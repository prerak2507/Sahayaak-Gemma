require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, getDocs, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteGarbageIssue() {
  console.log("Searching for the specific garbage sanitation issue...");
  try {
    const q = query(collection(db, 'needs'));
    const snapshot = await getDocs(q);
    
    let deletedCount = 0;
    
    for (const document of snapshot.docs) {
      const data = document.data();
      const titleMatch = data.title && data.title.includes('ROADS POTHOLES reported via WhatsApp');
      const descMatch1 = data.description && data.description.includes('A public road is severely obstructed by large piles of concrete debris');
      const descMatch2 = data.description && data.description.includes('A busy road is severely damaged with numerous large potholes filled with water');
      const descMatch3 = data.description && data.description.includes('polluted river');
      
      if (titleMatch || descMatch1 || descMatch2 || descMatch3) {
        console.log(`Found matching issue: ${data.title} (${document.id}) - Desc: ${data.description?.substring(0, 30)}...`);
        await deleteDoc(doc(db, 'needs', document.id));
        console.log(`Deleted document ${document.id}`);
        deletedCount++;
      }
    }
    
    console.log(`Finished. Deleted ${deletedCount} issues.`);
  } catch (err) {
    console.error("Error connecting to Firebase:", err);
  }
}

deleteGarbageIssue();
