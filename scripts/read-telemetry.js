const fs = require('fs');
const admin = require('firebase-admin');

// 1. Parse and load environment variables from .env.local
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
    }
  });
}

const projectId = env.FIREBASE_PROJECT_ID;
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  })
});

const db = admin.firestore();

async function main() {
  const snapshot = await db.collection('telemetry_logs')
    .orderBy('timestamp', 'desc')
    .limit(30)
    .get();

  console.log("--- LATEST TELEMETRY LOGS ---");
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`[${data.timestamp}] [${data.type}] ${data.message}`);
  });
}

main();
