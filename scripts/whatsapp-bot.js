const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const admin = require('firebase-admin');

// 1. Parse and load environment variables from .env.local
console.log("[WHATSAPP-BOT] Loading environment variables from .env.local...");
const env = {};
if (fs.existsSync('.env.local')) {
  const envFileContent = fs.readFileSync('.env.local', 'utf8');
  envFileContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      env[key] = val;
      process.env[key] = val; // Also populate process.env
    }
  });
}

// Ensure critical variables are loaded
const projectId = env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const clientEmail = env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = (env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, "\n");
const sarvamApiKey = env.SARVAM_API_KEY || process.env.SARVAM_API_KEY;


// 2. Firebase is optional.
//
// Reports are filed through the app's HTTP API, which owns whichever storage
// backend is configured, so the bot does not need database credentials to do
// its main job. Firebase is used only for two extras: telemetry logging and
// looking up a department lead's WhatsApp number. Both degrade quietly.
const hasFirebase = Boolean(projectId && clientEmail && privateKey);

if (hasFirebase && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

/**
 * A no-op stand-in with the same shape as a Firestore handle, so the optional
 * paths below read normally instead of being wrapped in existence checks.
 */
const noopDb = {
  collection: () => ({
    add: async () => undefined,
    doc: () => ({
      get: async () => ({ exists: false, data: () => ({}) }),
      set: async () => undefined,
      update: async () => undefined,
    }),
    where: () => ({ limit: () => ({ get: async () => ({ docs: [], empty: true }) }), get: async () => ({ docs: [], empty: true }) }),
    limit: () => ({ get: async () => ({ docs: [], empty: true }) }),
    orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [], empty: true }) }) }),
  }),
};

const db = hasFirebase ? admin.firestore() : noopDb;

if (!hasFirebase) {
  console.log('[WHATSAPP-BOT] No Firebase credentials. Reports still file through the app API; telemetry and lead notifications are off.');
}

// ── Gemma ─────────────────────────────────────────────────────────────────
//
// The bot runs against the same local Gemma the web app uses. This is the
// intake channel that matters most in practice: a resident who will never
// install an app will send a WhatsApp voice note in Gujarati, and that has to
// work on a corporation machine with no cloud budget.
//
// Local first, hosted only if a key is set, matching lib/gemma/config.ts.

const GEMMA_ORIGIN = (process.env.GEMMA_LOCAL_ORIGIN || 'http://localhost:11434').replace(/\/$/, '');
const GEMMA_MODEL = process.env.GEMMA_LOCAL_MODEL || 'gemma4:e4b-it-qat';
const GEMMA_CLOUD_ORIGIN = (process.env.GEMMA_CLOUD_ORIGIN || 'https://ollama.com').replace(/\/$/, '');
const GEMMA_CLOUD_MODEL = process.env.GEMMA_CLOUD_MODEL || 'gemma4:cloud';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const GEMMA_TIMEOUT_MS = Number(process.env.GEMMA_TIMEOUT_MS) || 120000;

function gemmaHosts() {
  const hosts = [{ origin: GEMMA_ORIGIN, model: GEMMA_MODEL, kind: 'local' }];
  if (OLLAMA_API_KEY) {
    hosts.push({ origin: GEMMA_CLOUD_ORIGIN, model: GEMMA_CLOUD_MODEL, kind: 'cloud', apiKey: OLLAMA_API_KEY });
  }
  return hosts;
}

/**
 * Runs a prompt on Gemma, optionally with an image.
 *
 * Returns a { response: { text() } } shape so the call sites below read the
 * same as they always did. Retries on transport failures, then falls through to
 * the next host.
 */
async function generateContentWithRetry(prompt, mediaData = null, retries = 3) {
  const message = { role: 'user', content: prompt };

  // Gemma 4 reads images natively; Ollama wants bare base64 in `images`.
  if (mediaData && mediaData.data) {
    message.images = [String(mediaData.data).replace(/^data:[^;]+;base64,/, '')];
  }

  // The bot follows the same rule as the app: local first, cloud only when
  // local is missing or slow. A report from a resident should be read on the
  // corporation's own machine.
  const hosts = await orderedHosts();
  let lastError;

  for (const host of hosts) {
    let delay = 2000;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), GEMMA_TIMEOUT_MS);

        const res = await fetch(`${host.origin}/api/chat`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(host.apiKey ? { Authorization: `Bearer ${host.apiKey}` } : {}),
          },
          body: JSON.stringify({
            model: host.model,
            messages: [message],
            // Everything in this bot parses the reply as JSON.
            format: 'json',
            stream: false,
            think: false,
            options: { temperature: 0.2, num_ctx: Number(process.env.GEMMA_NUM_CTX) || 8192 },
          }),
        }).finally(() => clearTimeout(timer));

        if (!res.ok) {
          throw new Error(`${host.kind} returned ${res.status}: ${(await res.text()).slice(0, 160)}`);
        }

        const data = await res.json();
        if (data.error) throw new Error(`${host.kind} error: ${data.error}`);

        const content = (data.message && data.message.content) || '';
        return { response: { text: () => content } };
      } catch (err) {
        lastError = err;
        console.error(`[GEMMA] ${host.kind} attempt ${attempt}/${retries}: ${err.message}`);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
        }
      }
    }

    console.warn(`[GEMMA] giving up on the ${host.kind} host, trying the next`);
  }

  throw new Error(
    `No Gemma host answered. Is Ollama running with ${GEMMA_MODEL} pulled? Last error: ${
      lastError ? lastError.message : 'unknown'
    }`
  );
}

/**
 * Hosts in the order to try them, skipping a local daemon that is not there.
 *
 * Checking reachability first means a machine without Ollama does not sit
 * waiting on a connection that will never open before reaching the cloud.
 */
async function orderedHosts() {
  const all = gemmaHosts();
  const local = all.find((h) => h.kind === 'local');
  const rest = all.filter((h) => h.kind !== 'local');

  if (!local) return rest;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${local.origin}/api/tags`, { signal: controller.signal }).finally(() =>
      clearTimeout(timer)
    );
    if (res.ok) return [local, ...rest];
  } catch {
    // Not there.
  }

  if (rest.length > 0) {
    console.warn('[GEMMA] local Ollama is not reachable, using the cloud host');
    return rest;
  }
  return [local];
}


/**
 * Files a report through the app's intake API.
 *
 * The bot deliberately owns no triage logic of its own. Everything it knows
 * about routing comes back from /api/ai/validate, which is the same endpoint
 * the website posts to.
 */
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

async function fileReport({ description, contextNote, source_type, reported_by }) {
  try {
    const res = await fetch(`${APP_BASE_URL}/api/ai/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, contextNote, persist: true, source_type, reported_by }),
    });

    const body = await res.json();

    if (!res.ok) {
      console.error('[WHATSAPP-BOT] intake failed:', body.error || res.status);
      return { ok: false, rejected: false };
    }

    if (body.triage && body.triage.valid === false) {
      const reasons = {
        abusive_or_explicit: 'That message contains language we cannot accept.',
        spam_or_test: 'That does not look like a real report. Please describe the problem.',
        no_issue_described: 'Please describe what is actually wrong.',
        private_property:
          'That fault is inside a private property. The corporation maintains public assets only.',
      };
      return {
        ok: false,
        rejected: true,
        reason: reasons[body.triage.rejection_reason] || 'It could not be accepted.',
      };
    }

    const action = body.dispatch && body.dispatch.action;
    const assignment = action && action.assignment;

    return {
      ok: true,
      triage: body.triage,
      toolCalled: body.dispatch ? body.dispatch.toolCalled : null,
      worker: assignment ? assignment.worker : null,
      targetHours: action ? action.targetHours : null,
      needId: body.needId,
    };
  } catch (err) {
    console.error('[WHATSAPP-BOT] intake unreachable:', err.message);
    return { ok: false, rejected: false };
  }
}

// 4. In-Memory Session state machine
const sessions = new Map();

// Helper to write to telemetry logs collection in Firestore
async function writeTelemetryLog(message, type = 'info') {
  try {
    await db.collection('telemetry_logs').add({
      message: `[WHATSAPP-BOT] ${message}`,
      type,
      timestamp: new Date().toISOString(),
    });
    console.log(`[Telemetry - ${type.toUpperCase()}] ${message}`);
  } catch (err) {
    console.error("Failed to write telemetry log:", err);
  }
}

// 5. Field crew registry.
// NOTE: this duplicates lib/data/rmc-workers.ts. The bot is CommonJS and cannot
// import the TypeScript registry directly. The fix is for this bot to post to
// /api/ai/validate instead of triaging on its own, which also removes the
// duplicated prompts below. Tracked as follow-up work.
const DEPARTMENT_EMPLOYEES = {
  pwd: [
    { id: 'emp-pwd-1', name: 'Jayesh Rathod', title: 'PWD Field Engineer', avatar: 'https://i.pravatar.cc/150?u=emp-pwd-1', phone: '+91 94280 12345' },
    { id: 'emp-pwd-2', name: 'Amrit Parmar', title: 'Road Maintenance Assistant', avatar: 'https://i.pravatar.cc/150?u=emp-pwd-2', phone: '+91 94280 67890' }
  ],
  health_sanitation: [
    { id: 'emp-san-1', name: 'Ramesh Koli', title: 'Ward 7 Sanitation Inspector', avatar: 'https://i.pravatar.cc/150?u=emp-san-1', phone: '+91 94281 12345' },
    { id: 'emp-san-2', name: 'Hasmukh Vora', title: 'Solid Waste Supervisor', avatar: 'https://i.pravatar.cc/150?u=emp-san-2', phone: '+91 94281 67890' }
  ],
  water_works: [
    { id: 'emp-water-1', name: 'Tushar Trivedi', title: 'Pipeline Field Assistant', avatar: 'https://i.pravatar.cc/150?u=emp-water-1', phone: '+91 94282 12345' }
  ],
  drainage: [
    { id: 'emp-drain-1', name: 'Sohan Prasad', title: 'Sewer Jetting Operator', avatar: 'https://i.pravatar.cc/150?u=emp-drain-1', phone: '+91 94283 12345' }
  ],
  electricity: [
    { id: 'emp-elec-1', name: 'Vijay Parmar', title: 'High Voltage Lineman', avatar: 'https://i.pravatar.cc/150?u=emp-elec-1', phone: '+91 94284 12345' }
  ],
  encroachment: [
    { id: 'emp-enc-1', name: 'Ketan Chawda', title: 'Field Demolition Officer', avatar: 'https://i.pravatar.cc/150?u=emp-enc-1', phone: '+91 94285 12345' }
  ],
  fire_safety: [
    { id: 'emp-fire-1', name: 'Arjan Kher', title: 'Senior Fire Rescue Lead', avatar: 'https://i.pravatar.cc/150?u=emp-fire-1', phone: '+91 94286 12345' }
  ]
};

function getGovernmentWorkerAssignment(department) {
  const dept = department || 'pwd';
  const deptWorkers = DEPARTMENT_EMPLOYEES[dept] || [];
  if (deptWorkers.length === 0) {
    return { name: "Jayesh Rathod", title: "PWD Field Engineer", avatar: "https://i.pravatar.cc/150?u=emp-pwd-1" };
  }
  // Deterministic so the same ticket always names the same person and the
  // assignment can be justified. Real load balancing needs live crew state.
  return deptWorkers[0];
}

// Bounding box / Polygon boundary validation checks
function isUserInJurisdiction(lat, lng, city = 'delhi') {
  if (city === 'disabled' || city === 'global') return true;
  if (city === 'rajkot') return (lat >= 22.1 && lat <= 22.5 && lng >= 70.6 && lng <= 71.0);
  if (city === 'mumbai') return (lat >= 18.8 && lat <= 19.3 && lng >= 72.7 && lng <= 73.0);
  
  // Delhi boundaries polygon ray casting check
  const coords = [
    [76.84, 28.50], [76.95, 28.40], [77.10, 28.40], [77.20, 28.45], [77.30, 28.48],
    [77.35, 28.55], [77.32, 28.65], [77.35, 28.70], [77.30, 28.80], [77.15, 28.88],
    [77.05, 28.88], [76.90, 28.80], [76.84, 28.70], [76.80, 28.60], [76.84, 28.50]
  ];

  try {
    let inside = false;
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
      const xi = coords[i][0], yi = coords[i][1];
      const xj = coords[j][0], yj = coords[j][1];
      const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  } catch (err) {
    return (lat >= 28.4 && lat <= 28.9 && lng >= 76.8 && lng <= 77.5);
  }
}

async function fetchAddressFromCoords(lat, lng) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Sahaayak-Bot/1.0' }
    });
    if (!response.ok) throw new Error("Nominatim status: " + response.status);
    const data = await response.json();
    if (data && data.display_name) {
      const addressParts = data.display_name.split(', ');
      return addressParts.length > 3 ? addressParts.slice(0, 3).join(', ') : data.display_name;
    }
    return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
  } catch (err) {
    return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
  }
}

function parseModelJSON(text) {
  try {
    return JSON.parse(text.trim());
  } catch (err) {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end > start) {
        return JSON.parse(cleaned.substring(start, end + 1));
      }
      throw new Error("JSON parsing failed");
    }
  }
}

const ABUSIVE_KEYWORDS = ['love you', 'sweet bot', 'stupid', 'idiot', 'bomb', 'kill', 'fuck', 'bastard', 'marry me', 'cute'];
function containsAbusiveKeywords(text) {
  const textLower = (text || "").toLowerCase();
  return ABUSIVE_KEYWORDS.some(word => textLower.includes(word));
}

function validateDescriptionText(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return { valid: false, reason: "Description cannot be empty." };

  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{200d}\u{2600}-\u{27BF}]/u;
  if (emojiRegex.test(trimmed)) {
    return { valid: false, reason: "Emojis and symbols are not allowed or accepted in the description. Please provide a clear text description." };
  }
  if (trimmed.length < 8) {
    return { valid: false, reason: "The description is too short. Please write a descriptive statement of at least 8 characters explaining the issue." };
  }

  const cleanWords = trimmed.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").split(/\s+/).filter(w => w.length > 0);
  if (cleanWords.length < 3) {
    return { valid: false, reason: "The description must contain at least 3 words to explain the civic issue properly." };
  }

  const JUNK_WORDS = new Set([
    'sachi', 'mei', 'issue', 'hei', 'ye', 'hai', 'sach', 'me',
    'really', 'its', 'an', 'is', 'a', 'the', 'yes', 'no', 'ok', 'okay', 'true', 'false',
    'hello', 'hi', 'hey', 'test', 'testing', 'please', 'plz', 'help', 'solve', 'fix', 'work',
    'this', 'that', 'it', 'there', 'here', 'problem', 'complaint', 'bot', 'assistant', 'working',
    'properly', 'proper', 'friend', 'wrote', 'write', 'say', 'saying', 'done', 'perfect',
    'good', 'bad', 'awesome', 'great', 'cool', 'fine', 'no problem', 'thanks', 'thank', 'you',
    'my', 'mine', 'our', 'us', 'we', 'i', 'me', 'he', 'she', 'they', 'them', 'him', 'her',
    'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'but', 'and', 'or', 'so', 'as', 'to', 'for', 'with', 'in', 'on', 'at', 'by', 'of', 'about'
  ]);

  const allJunk = cleanWords.every(word => JUNK_WORDS.has(word));
  if (allJunk) {
    return { valid: false, reason: "Conversational text or generic phrases are not accepted as descriptions. Please describe the specific civic problem." };
  }

  const lowerTrimmed = trimmed.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
  const junkPhrases = [
    'sachi mei issue hei ye', 'sachi me issue hai ye', 'sach me issue hai', 'sachi mei issue',
    'really issue', 'this is an issue', 'its working properly', 'testing this bot'
  ];
  if (junkPhrases.includes(lowerTrimmed)) {
    return { valid: false, reason: "Conversational phrases are not accepted as descriptions. Please describe the specific civic problem." };
  }

  return { valid: true };
}

// 8. Initialize WhatsApp Web Client
console.log("[WHATSAPP-BOT] Initializing whatsapp-web.js client...");

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || 'C:\\Users\\Default\\AppData\\Local', 'Google\\Chrome\\Application\\chrome.exe')
];
let chromePath = undefined;
for (const p of chromePaths) {
  if (fs.existsSync(p)) {
    chromePath = p;
    break;
  }
}
if (chromePath) {
  console.log(`[WHATSAPP-BOT] Found system Google Chrome at: ${chromePath}. Launching visible browser...`);
}

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
  puppeteer: {
    headless: false,
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized', '--no-first-run', '--no-default-browser-check', '--disable-infobars']
  }
});

client.on('qr', (qr) => {
  console.log('[WHATSAPP-BOT] Scan the QR code below to connect your WhatsApp account:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('[WHATSAPP-BOT] WhatsApp Client is fully authenticated and READY!');
  writeTelemetryLog("Actual WhatsApp Web Client linked & online. Ready to intercept messages.", "success");
});

// Escalation CRON: Runs every 60 seconds to check for overdue urgent tickets (timeout: 2 minutes for demo)
setInterval(async () => {
  try {
    const cutoffTime = new Date(Date.now() - 120000); // 2 minutes ago
    const snapshot = await db.collection('needs')
      .where('status', '==', 'dispatched')
      .where('urgency_score', '>=', 8)
      .get();
      
    snapshot.forEach(async (doc) => {
      const ticket = doc.data();
      if (ticket.created_at && new Date(ticket.created_at) < cutoffTime) {
         if (!ticket.escalated) {
           await doc.ref.update({ escalated: true });
           
           const dept = ticket.assigned_department;
           const leadSnap = await db.collection('whatsapp_leads').doc(dept).get();
           if (leadSnap.exists) {
              const leadPhone = leadSnap.data().phone;
              await client.sendMessage(leadPhone + '@c.us', `⚠️ *URGENT ESCALATION* ⚠️\n\nTicket *${doc.id}* (Urgency: ${ticket.urgency_score}/10) has been dispatched for over 2 minutes and is still pending resolution!\n\nPlease prioritize this immediately.`);
           }
         }
      }
    });
  } catch (err) {
    console.error("Escalation CRON error:", err);
  }
}, 60000);

client.on('message', async (message) => {
  if (message.from.endsWith('@g.us')) return; // ignore groups
  const phone = message.from.replace('@c.us', '');

  // Session cleanup mechanism (5 minutes timeout)
  if (sessions.has(phone)) {
    const activeSession = sessions.get(phone);
    if (activeSession.step !== 'idle' && Date.now() - activeSession.timestamp > 300000) {
      console.log(`[WHATSAPP-BOT] Session for +${phone} expired due to inactivity.`);
      sessions.delete(phone);
    }
  }

  // Handle global commands (/stop and /restart)
  if (message.body) {
    const textLower = message.body.trim().toLowerCase();
    if (textLower === '/stop') {
      if (sessions.has(phone)) {
        sessions.delete(phone);
        await client.sendMessage(message.from, "🛑 Civic reporting session stopped. AI analysis cancelled.");
      }
      return;
    }
    if (textLower === '/restart') {
      sessions.delete(phone);
      await client.sendMessage(message.from, "🔄 Session restarted. Please upload a clear photo of the civic issue (and include **#issue** in the caption) to begin.");
      return;
    }
    if (textLower.startsWith('/register_lead')) {
      const parts = textLower.split(' ');
      const dept = parts[1] || 'pwd';
      await db.collection('whatsapp_leads').doc(dept).set({ phone: phone });
      await client.sendMessage(message.from, `✅ You have been successfully registered as the Lead for department: *${dept}*.\n\nYou will now receive automatic task dispatches directly in this chat.`);
      return;
    }
    if (textLower.startsWith('/ask')) {
       const query = textLower.replace('/ask', '').trim();
       if (!query) {
         await client.sendMessage(message.from, `❌ Please provide a question. Example: /ask What are my pending tasks?`);
         return;
       }
       
       const chat = await message.getChat();
       await chat.sendStateTyping();
       
       try {
         // Determine which department this lead belongs to
         const leadsRef = db.collection('whatsapp_leads');
         const leadsSnap = await leadsRef.where('phone', '==', phone).get();
         if (leadsSnap.empty) {
            await client.sendMessage(message.from, `❌ You are not registered as a Lead. Use /register_lead <department> first.`);
            return;
         }
         const dept = leadsSnap.docs[0].id;
         
         // Fetch recent tasks for this department
         const tasksSnap = await db.collection('needs').where('assigned_department', '==', dept).limit(20).get();
         const tasksData = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         
         const prompt = `You are a helpful AI assistant for a government Lead in the '${dept}' department.
The user asked: "${query}"

Here is the data for the active/recent tasks in their department (JSON):
${JSON.stringify(tasksData, null, 2)}

Provide a concise, helpful summary answering their question based ONLY on the provided JSON data. Format the response nicely for WhatsApp (using *bold* etc). Do not expose raw JSON.`;

         const result = await generateContentWithRetry(prompt);
         await client.sendMessage(message.from, result.response.text());
       } catch (err) {
         console.error("Natural Language Query error:", err);
         await client.sendMessage(message.from, `⚠️ Error processing query. Please try again later.`);
       }
       return;
    }
  }

  console.log(`[WHATSAPP-BOT] Received message from +${phone}: "${message.body || '[Media/Attachment]'}"`);

  try {
    const userRef = db.collection('whatsapp_sim_users').doc(phone);
    const userSnap = await userRef.get();
    let userData = userSnap.exists ? userSnap.data() : { warnings_count: 0, banned_until: null };

    if (userData.banned_until) {
      if (new Date(userData.banned_until) > new Date()) return; // silently ignore banned users
    }

    if (!sessions.has(phone)) {
      sessions.set(phone, {
        step: 'idle',
        phone,
        imageMedia: null,
        autoDescription: '',
        description: '',
        category: '',
        urgency_score: 5,
        is_sos: false,
        timestamp: Date.now()
      });
    }
    const session = sessions.get(phone);
    
    // Reset timestamp on activity
    session.timestamp = Date.now();

    if (message.body && containsAbusiveKeywords(message.body) && (message.body.toLowerCase().includes('bomb') || message.body.toLowerCase().includes('kill'))) {
      await writeTelemetryLog(`[AI-MODERATION] Extremist keywords detected from +${phone}.`, 'error');
      await client.sendMessage(message.from, "⚠️ Critical System Warning: Your message violates safety standards. Content logged.");
      sessions.delete(phone);
      return;
    }

    // Step A: Media uploaded
    if (message.hasMedia) {
      const media = await message.downloadMedia();
      if (!media) return;
      
      if (media.mimetype.startsWith('image/')) {
        const captionText = (message.body || "").trim();
        
        // --- WORKER RESOLUTION FLOW ---
        const resolvedMatch = captionText.match(/#resolved\s+([a-zA-Z0-9_-]+)/i);
        if (resolvedMatch) {
           const ticketId = resolvedMatch[1];
           await client.sendMessage(message.from, `🔍 Verifying resolution for task *${ticketId}*...`);
           
           const ticketRef = db.collection('needs').doc(ticketId);
           const ticketSnap = await ticketRef.get();
           if (!ticketSnap.exists) {
              await client.sendMessage(message.from, `❌ Ticket ${ticketId} not found.`);
              return;
           }
           const ticketData = ticketSnap.data();
           
           const verifyPrompt = `You are an AI inspector verifying civic repairs.
The original issue was described as: "${ticketData.description}" (Category: ${ticketData.category}).
Look at the attached image submitted by the worker. Does this new image show that the issue has been repaired, cleared, or resolved?
Return ONLY a JSON object: {"verified": true|false, "reason": "short explanation"}`;

           try {
             const result = await generateContentWithRetry(verifyPrompt, media);
             const verification = parseModelJSON(result.response.text());
             
             if (verification.verified) {
                await ticketRef.update({ status: 'completed', resolution_notes: verification.reason, resolved_at: new Date().toISOString() });
                await client.sendMessage(message.from, `✅ *Task ${ticketId} Successfully Verified!*\n\nAI Notes: ${verification.reason}`);
                
                if (ticketData.phone_number) {
                   await client.sendMessage(ticketData.phone_number + '@c.us', `🎉 *Good news!* Your reported issue (${ticketData.category}) has been successfully resolved by our municipal team.\n\nAI Verification: ${verification.reason}\n\nThank you for making the city better!`);
                }
             } else {
                await client.sendMessage(message.from, `❌ *Verification Failed.*\n\nAI Notes: ${verification.reason}\n\nPlease submit a clearer image showing the completed work.`);
             }
           } catch(e) {
              console.error("Resolution verification error:", e);
              await client.sendMessage(message.from, `⚠️ Error verifying resolution. Please try again later.`);
           }
           return;
        }
        // ------------------------------

        const hasIssueHashtag = /#\s*issue/i.test(captionText);

        // SILENT TRIGGER LOGIC:
        // If session is idle and image lacks #issue, completely ignore it.
        if (session.step === 'idle' && !hasIssueHashtag) {
          sessions.delete(phone);
          return;
        }

        // If session is awaiting image or it's an idle session with #issue hashtag, accept it!
        session.step = 'awaiting_description_confirmation';
        session.imageMedia = media;
        session.is_sos = false;
        session.category = '';
        session.autoDescription = '';
        session.description = '';

        await writeTelemetryLog(`Citizen +${phone} uploaded valid image. Commencing media analysis...`, 'system');
        await writeTelemetryLog(`Running Gemma image verification for +${phone}...`, 'info');
        
        try {
          const prompt = `Analyze this image for a civic incident reporting platform (Sahaayak).
Determine if this image shows:
1. "blurry": Blurry, unreadable, or insufficient visual quality.
2. "violence": Violent content, physical injury, blood, or immediate danger/assault.
3. "civic": A valid civic issue like a road pothole, road crack, sewage/drainage overflow, overflowing garbage dumpster, solid waste dump, electricity outage, street light issue, or water supply pipe leak.
4. "invalid": None of the above (e.g. self, room interior, cartoon, random scene, spam).

If it is "civic", classify it into one of these categories:
- "roads_potholes" (road issues, cracks, potholes)
- "drainage_sewerage" (sewage, overflow, open manholes)
- "water_supply" (pipe leaks, tap bursts in public)
- "electricity_streetlights" (street light outage, hanging wires)
- "garbage_sanitation" (garbage piles, overflowing dumpsters)
- "encroachment" (illegal structures blocking roads/sidewalks)
- "fire_safety" (fires, active hazards)

Return ONLY a JSON object (no markdown formatting, no backticks, no code blocks):
{
  "type": "blurry" | "violence" | "civic" | "invalid",
  "category": "roads_potholes" | "drainage_sewerage" | "water_supply" | "electricity_streetlights" | "garbage_sanitation" | "encroachment" | "fire_safety" | "other",
  "description": "A detailed 1-2 sentence description of the civic issue shown in the image (or blank if invalid/blurry/violence)",
  "confidence": number (0 to 1),
  "urgency_score": number (1 to 10 based on severity/danger),
  "authenticity_score": number (0 to 100, where low scores indicate a fake/stock photo, photoshop, or unnatural image)
}`;

          const chat = await message.getChat();
          await chat.sendStateTyping();

          const result = await generateContentWithRetry(prompt, media);
          const analysis = parseModelJSON(result.response.text());

          if (analysis.authenticity_score !== undefined && analysis.authenticity_score < 40) {
            await client.sendMessage(message.from, "❌ *Authenticity Warning:* Our AI detected that this image might be a stock photo, downloaded from the internet, or heavily edited.\n\nOnly genuine live photos of civic issues are accepted. Session cancelled.");
            sessions.delete(phone);
            return;
          }

          if (analysis.type === 'blurry') {
            await client.sendMessage(message.from, "Please send a clear image. Visual clarity is insufficient for ticket creation.");
            sessions.delete(phone);
            return;
          }

          if (analysis.type === 'violence') {
            session.step = 'awaiting_emergency_location';
            session.is_sos = true;
            session.category = 'fire_safety';
            await client.sendMessage(message.from, "🚨 CRITICAL EMERGENCY DETECTED! Please send your location pin now to dispatch immediate assistance.");
            return;
          }

          if (analysis.type === 'civic') {
            session.category = analysis.category;
            session.autoDescription = analysis.description;
            session.description = analysis.description;
            session.urgency_score = analysis.urgency_score;
            const issueLabel = analysis.category.replace('_', ' ').toUpperCase();
            await client.sendMessage(message.from, `I have successfully analyzed the image and detected a **${issueLabel}**.\n\nAI Description: "${analysis.description}"\n\nIf you would like to edit or add manual details, please reply now (or send a voice note). Otherwise, type *ok* to proceed to location verification.`);
          } else {
            await client.sendMessage(message.from, "I'm sorry, I couldn't identify a valid public civic issue in this image. Please send an image of a public problem (like a pothole or garbage spill).");
            sessions.delete(phone);
          }
        } catch (err) {
          console.error("Gemma analysis error:", err);
          await writeTelemetryLog(`Gemma image analysis completely failed (after retries) for +${phone}.`, 'error');
          // NO STATIC FALLBACK - inform the user of AI failure instead of faking it.
          await client.sendMessage(message.from, "⚠️ The AI Vision Service is currently experiencing high demand or an error occurred. Please type /restart to try again later.");
          sessions.delete(phone);
        }
        return;
      } else if (media.mimetype.startsWith('audio/') || media.mimetype.includes('ogg')) {
        if (session.step === 'awaiting_description_confirmation') {
          await writeTelemetryLog(`Received voice note from +${phone}. Transcribing via AI...`, 'info');
          try {
            const audioPrompt = `You are an expert transcription and translation AI. 
The user has sent a voice note describing a civic issue.
Accurately transcribe what the user is saying. If it is in Hindi, Hinglish, or any regional language, translate it directly into clear, professional English.
Return ONLY the final translated/transcribed English text. Do not include any other commentary.`;
            
            const result = await generateContentWithRetry(audioPrompt, media);
            let transcribedText = result.response.text().trim();
            if (transcribedText) {
              await client.sendMessage(message.from, `🎙️ Transcribed Voice Note:\n"${transcribedText}"`);
              message.body = transcribedText; // Inject for Step B
            } else {
               await client.sendMessage(message.from, "⚠️ Could not hear or transcribe the voice note clearly. Please type your description instead.");
               return;
            }
          } catch (err) {
            console.error("Audio transcription error:", err);
            await client.sendMessage(message.from, "⚠️ Error transcribing voice note. Please type your description instead.");
            return;
          }
        } else {
           return;
        }
      } else {
        return;
      }
    }

    // Step C: Location attachment
    if (message.type === 'location') {
      const lat = parseFloat(message.location.latitude);
      const lng = parseFloat(message.location.longitude);

      if (session.step === 'awaiting_location' || session.step === 'awaiting_emergency_location') {
        let activeCity = 'delhi';
        try {
          const configSnap = await db.collection('system_config').doc('geofence_settings').get();
          if (configSnap.exists && configSnap.data().active_city) {
            activeCity = configSnap.data().active_city;
          }
        } catch (e) {
          console.error("Geofence config fetch error:", e);
        }

        const inBounds = isUserInJurisdiction(lat, lng, activeCity);
        if (!inBounds) {
          await client.sendMessage(message.from, `❌ Location is outside active service zones (Currently: ${activeCity.toUpperCase()}). We cannot accept this report.`);
          sessions.delete(phone);
          return;
        }

        const resolvedAddress = await fetchAddressFromCoords(lat, lng);

        // File through the app's own intake API rather than writing to the
        // database here.
        //
        // This block used to insert a record directly with the department
        // guessed from a menu choice, urgency defaulted to 7, a title built by
        // upper-casing the category, and the city hardcoded to New Delhi. None
        // of that involved the model, and the New Delhi rows it left behind are
        // still sitting in the shared project.
        //
        // Posting to /api/ai/validate means WhatsApp reports are triaged,
        // routed, crewed and stored by exactly the same code as web reports,
        // and there is one place where that logic lives.
        const filed = await fileReport({
          description: session.is_sos
            ? `Emergency reported by phone from +${phone}. The caller pressed the SOS button and their location is confirmed by GPS. ${session.description || ''}`.trim()
            : session.description || 'No description given.',
          contextNote: `Reported over WhatsApp from +${phone}. GPS location: ${resolvedAddress}.`,
          source_type: 'whatsapp',
          reported_by: `whatsapp:${phone}`,
        });

        if (!filed.ok) {
          await client.sendMessage(
            message.from,
            filed.rejected
              ? `We could not accept that report. ${filed.reason}`
              : 'Something went wrong filing that report. Please try again shortly.'
          );
          sessions.delete(phone);
          return;
        }

        const t = filed.triage;
        const crew = filed.worker;
        const emergency = filed.toolCalled === 'escalate_emergency';

        const lines = [
          emergency ? '🚨 Treated as an emergency.' : '✅ Report filed.',
          '',
          t.summary_native || t.summary,
          '',
          `Department: ${String(t.assigned_department || t.assignment_type).replace(/_/g, ' ')}`,
          `Priority: ${t.urgency_score} out of 10`,
        ];
        if (crew) lines.push(`Crew: ${crew.name}, ${crew.title}`);
        if (filed.targetHours) lines.push(`Target: within ${filed.targetHours} hours`);
        if (t.needs_location_pin) {
          lines.push('', 'We could not place this on the map from your description. Someone will call to confirm where it is.');
        }
        lines.push('', `Read and routed by ${t._meta?.model || 'Gemma'} running on the corporation's own machine.`);

        await client.sendMessage(message.from, lines.join(String.fromCharCode(10)));

        // Notify the department lead, if one has registered their number.
        try {
          const leadSnap = await db.collection('whatsapp_leads').doc(t.assigned_department || 'pwd').get();
          if (leadSnap.exists) {
            const leadData = leadSnap.data();
            const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
            const brief = [
              emergency ? 'NEW EMERGENCY DISPATCH' : 'NEW TASK DISPATCHED',
              '',
              `Ticket: ${filed.needId}`,
              `${t.auto_title}`,
              `Urgency: ${t.urgency_score}/10`,
              '',
              t.summary,
              '',
              `Location: ${resolvedAddress}`,
              mapsLink,
              '',
              `Reply with a photo of the finished work captioned #resolved ${filed.needId} to close it.`,
            ].join(String.fromCharCode(10));
            await client.sendMessage(leadData.phone + '@c.us', brief);
          }
        } catch (err) {
          // A missing lead is not a failure of the report itself.
          console.warn('[WHATSAPP-BOT] could not notify the department lead:', err.message);
        }

        sessions.delete(phone);
      }
      return;
    }

    // Step B: Text reply
    if (message.body) {
      const text = message.body.trim();
      const textLower = text.toLowerCase();

      if (session.step === 'idle') {
        if (textLower.includes('#issue')) {
          session.step = 'awaiting_image';
          await client.sendMessage(message.from, "Welcome to Sahaayak Civic Assistant! 📱\n\nPlease upload a clear photograph of the civic issue (pothole, garbage, leak, etc.) to begin reporting.");
        } else {
          // SILENT TRIGGER LOGIC: Ignore any text that does not contain #issue
          sessions.delete(phone);
        }
        return;
      }

      if (session.step === 'awaiting_image') {
        if (textLower.includes('#issue')) {
          await client.sendMessage(message.from, "I am ready. Please upload a clear photograph of the civic issue.");
        }
        // Do not respond to normal texts while awaiting image to avoid spamming
        return;
      }

      if (session.step === 'awaiting_description_confirmation') {
        if (textLower === 'ok') {
          session.step = 'awaiting_location';
          await client.sendMessage(message.from, "Perfect. Now, please share your *Live Location* or *Current Location* using the WhatsApp location sharing feature so we can geocode and dispatch the ticket.");
        } else {
          const localCheck = validateDescriptionText(text);
          if (!localCheck.valid) {
            await client.sendMessage(message.from, `❌ Validation Failed: ${localCheck.reason}`);
            return;
          }

          if (containsAbusiveKeywords(text)) {
            sessions.delete(phone);
            await client.sendMessage(message.from, `⚠️ Warning: Inappropriate description. Session terminated.`);
            return;
          }

          try {
            const chat = await message.getChat();
            await chat.sendStateTyping();
            
            const verificationPrompt = `You are a strict validation AI for a municipal incident reporter.
Analyze the user's manual description of a civic issue and verify if it matches the uploaded image.
User's manual description: "${text}"

Check:
1. Is it "mismatched": Completely unrelated to the actual civic issue visible in the image.
2. Is it "junk_or_emojis": Contains ONLY emojis or random conversational phrases.
3. Is it "valid": A proper, descriptive statement matching the image.

Return ONLY JSON: {"status": "valid"|"mismatched"|"junk_or_emojis", "reason": "Explain why if invalid."}`;

            const verifyResult = await generateContentWithRetry(verificationPrompt, session.imageMedia);
            const verification = parseModelJSON(verifyResult.response.text());

            if (verification.status === 'valid') {
              session.description = text;
              await client.sendMessage(message.from, `✅ Description updated successfully to:\n"${text}"\n\nType *ok* to proceed to location verification, or edit again.`);
            } else {
              await client.sendMessage(message.from, `❌ Validation Failed: The description you provided does not match the uploaded image.\n\nReason: ${verification.reason}\n\nPlease provide a proper description.`);
            }
          } catch (verErr) {
            console.error("Gemma description validation error:", verErr);
            await client.sendMessage(message.from, "⚠️ The AI Service is busy. Unable to verify description at this time. Please type /restart and try again.");
            sessions.delete(phone);
          }
        }
        return;
      }

      if (session.step === 'awaiting_location') {
        await client.sendMessage(message.from, "Please send a location pin using the paperclip/attachment icon -> Location.");
        return;
      }
    }
  } catch (err) {
    console.error(`[ERROR] Processing WhatsApp message:`, err);
    await client.sendMessage(message.from, "⚠️ An internal error occurred while processing your request. Please try again later.");
  }
});

client.initialize();
