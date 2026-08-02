const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/['"]/g, '').replace(/\\n/g, '\n')
        : undefined,
    }),
  });
}

const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('needs').get();
  console.log(`Found ${snapshot.size} total tasks.`);
  
  const batch = db.batch();
  let deleted = 0;
  let updated = 0;

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    
    // Delete non-government tasks
    if (data.category !== 'government') {
      batch.delete(doc.ref);
      deleted++;
    } else {
      let needsUpdate = false;
      const updates = {};
      
      let finalLat = data.location_lat || data.latitude;
      let finalLng = data.location_lng || data.longitude;
      
      if (!finalLat || !finalLng) {
        finalLat = 28.60 + (Math.random() * 0.1);
        finalLng = 77.20 + (Math.random() * 0.1);
      }
      
      if (data.location_lat !== finalLat) { updates.location_lat = finalLat; needsUpdate = true; }
      if (data.location_lng !== finalLng) { updates.location_lng = finalLng; needsUpdate = true; }
      if (data.latitude !== finalLat) { updates.latitude = finalLat; needsUpdate = true; }
      if (data.longitude !== finalLng) { updates.longitude = finalLng; needsUpdate = true; }
      
      if (needsUpdate) {
        batch.update(doc.ref, updates);
        updated++;
      }
    }
  });

  if (deleted > 0 || updated > 0) {
    await batch.commit();
  }
  
  console.log(`Deleted ${deleted} non-government tasks.`);
  console.log(`Updated ${updated} tasks with standardized coordinates.`);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
