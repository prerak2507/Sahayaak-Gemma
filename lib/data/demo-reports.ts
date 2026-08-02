/**
 * The demo workload.
 *
 * These are written the way people in Rajkot actually report things: Gujarati
 * script, Gujarati in Latin letters, Hindi, English, and the odd sentence that
 * switches language halfway through. Several are deliberately vague about
 * location, and two are junk, because a demo where every input is clean proves
 * nothing about a system that has to survive real ones.
 *
 * Nothing here is pre-triaged. Each entry is raw resident text, exactly as it
 * would arrive. The seeder runs it through Gemma, so what lands in the database
 * is genuinely the model's output and not something a developer typed. That is
 * slower to seed and it is the entire point: a judge can delete a record, re-run
 * the seed, and watch it be re-derived.
 */

export interface DemoReport {
  /** Raw text exactly as the resident would send it. */
  text: string;
  /** How it arrived, for the provenance badge. */
  source: 'web' | 'whatsapp' | 'voice';
  /** Minutes in the past, so the board has a believable spread of ages. */
  ageMinutes: number;
  /** Short label for the demo script, never stored. */
  note: string;
}

export const DEMO_REPORTS: DemoReport[] = [
  // ── Gujarati script ─────────────────────────────────────────────────────
  {
    text: 'કાલાવડ રોડ પર સ્કૂલના ગેટ પાસે મોટો ખાડો પડ્યો છે. રોજ સવારે બાળકો ઉતરે છે ત્યાં રિક્ષા લપસે છે.',
    source: 'web',
    ageMinutes: 45,
    note: 'Gujarati script, pothole outside a school, should route to PWD',
  },
  {
    text: 'મધાપરમાં ગટર ત્રણ દિવસથી ઉભરાય છે. ઘરની બહાર નીકળાતું નથી અને બહુ વાસ આવે છે.',
    source: 'whatsapp',
    ageMinutes: 130,
    note: 'Gujarati script, sewer overflow, drainage, high urgency',
  },
  {
    text: 'ગોંડલ રોડ પર નળમાં પીળું પાણી આવે છે. પીવા લાયક નથી, બાળકોને પેટમાં તકલીફ થઈ છે.',
    source: 'web',
    ageMinutes: 200,
    note: 'Gujarati script, contaminated water, should be near the top',
  },
  {
    text: 'યાજ્ઞિક રોડ પર વીજળીનો તાર તૂટીને ફૂટપાથ પર પડ્યો છે અને તણખા ઝરે છે. કોઈ પાસે જતું નથી.',
    source: 'whatsapp',
    ageMinutes: 6,
    note: 'Gujarati script, live wire down. This is the one that should escalate',
  },

  // ── Romanized Gujarati, the most common real input ──────────────────────
  {
    text: 'kalavad road par pipeline futi gai chhe, aakho divas pani vahi rahyu chhe. koi aavtu nathi.',
    source: 'whatsapp',
    ageMinutes: 18,
    note: 'Romanized Gujarati, burst main, water works',
  },
  {
    text: 'university road na badha street light band chhe. raat ma sav andharu thai jaay chhe, chalvu bik lage chhe.',
    source: 'web',
    ageMinutes: 1400,
    note: 'Romanized Gujarati, street lights, electricity',
  },
  {
    text: 'madhapar community hall pachhal pani bharai gayu chhe ne machchhar bahu thai gaya chhe.',
    source: 'whatsapp',
    ageMinutes: 700,
    note: 'Romanized Gujarati, standing water, sanitation',
  },
  {
    text: 'gondal road na khune ek week thi kachro padyo chhe, kutra faelave chhe ne vaas aave chhe.',
    source: 'web',
    ageMinutes: 900,
    note: 'Romanized Gujarati, uncollected rubbish',
  },

  // ── Hindi ───────────────────────────────────────────────────────────────
  {
    text: 'University road pe college ke saamne manhole ka dhakkan nahi hai. raat ko bilkul dikhta nahi, koi gir jayega.',
    source: 'whatsapp',
    ageMinutes: 25,
    note: 'Hindi, open manhole, drainage, high urgency',
  },
  {
    text: 'Ring road ke park ke andar kuch logon ne tent laga diye hain, bachche khel nahi paate.',
    source: 'web',
    ageMinutes: 2000,
    note: 'Hindi, encroachment, low urgency',
  },

  // ── English ─────────────────────────────────────────────────────────────
  {
    text: 'The storm drain at the Yagnik Road corner is completely blocked with silt. It will flood the moment the monsoon starts.',
    source: 'web',
    ageMinutes: 600,
    note: 'English, preventive drainage report',
  },
  {
    text: 'A section of Gondal Road has sunk by nearly a foot since last week. Trucks are swerving into oncoming traffic to avoid it.',
    source: 'web',
    ageMinutes: 90,
    note: 'English, road subsidence, dangerous',
  },
  {
    text: 'There is a strong smell of gas around the building entrance on Kalavad Road since this morning. Several residents have noticed it.',
    source: 'whatsapp',
    ageMinutes: 40,
    note: 'English, gas leak, should escalate',
  },

  // ── Mixed language mid-sentence, which people genuinely do ──────────────
  {
    text: 'Ring road pe flyover ke pehle road tuti gayi chhe, bike walo padi jaay chhe. please jaldi thik karo.',
    source: 'whatsapp',
    ageMinutes: 310,
    note: 'Hindi and Gujarati mixed in one sentence',
  },
  {
    text: 'madhapar ma third floor par pani bilkul nahi aata, subah se motor chala rahe hain but kuch nahi.',
    source: 'web',
    ageMinutes: 480,
    note: 'Mixed, low supply pressure',
  },

  // ── Humanitarian, should go to an NGO rather than RMC ───────────────────
  {
    text: 'અમારા વિસ્તારમાં એક વૃદ્ધ દંપતી એકલા રહે છે, તેમને દવા અને જમવાનું લાવી આપે એવું કોઈ નથી.',
    source: 'whatsapp',
    ageMinutes: 1500,
    note: 'Gujarati, elderly care. Must route to NGO, not a municipal department',
  },
  {
    text: 'Bahar rehta majoor parivar ne blanket ni jarur chhe, raat e bahu thandi lage chhe.',
    source: 'web',
    ageMinutes: 2600,
    note: 'Romanized Gujarati, shelter aid, NGO',
  },

  // ── Location given loosely, so the gazetteer will not resolve it ────────
  {
    text: 'Aa shakti society na naka par thi gatar ubhrai chhe, bahu divas thi.',
    source: 'whatsapp',
    ageMinutes: 260,
    note: 'Names a society the gazetteer does not know. Should ask for a pin, not guess',
  },

  // ── Junk, which must be rejected with a reason ──────────────────────────
  {
    text: 'hello hello testing 123',
    source: 'whatsapp',
    ageMinutes: 30,
    note: 'Should be rejected as spam_or_test',
  },
  {
    text: 'mara ghar na bedroom ni light bandh thai gai chhe, aavo ne repair karo.',
    source: 'web',
    ageMinutes: 55,
    note: 'Private property inside a home. Should be rejected, RMC does not do this',
  },
];
