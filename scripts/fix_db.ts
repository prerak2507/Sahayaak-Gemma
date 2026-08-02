import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

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

async function fix() {
  console.log("Querying for the specific Garbage Sanitation issue...");
  const q = query(
    collection(db, 'needs'), 
    where('title', '==', 'GARBAGE SANITATION reported via WhatsApp')
  );
  
  const snapshot = await getDocs(q);
  console.log(`Found ${snapshot.docs.length} documents.`);
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.assigned_worker_name === 'PWD Field Engineers' || data.assigned_department === 'pwd') {
      console.log(`Updating document ID: ${docSnap.id}`);
      await updateDoc(docSnap.ref, {
        assigned_department: 'health_sanitation',
        assigned_worker_name: 'Hasmukh Vora',
        assigned_worker_title: 'Solid Waste Supervisor',
        assigned_worker_avatar: 'https://i.pravatar.cc/150?u=emp-san-2'
      });
      console.log("Successfully updated to Hasmukh Vora (Sanitation).");
    }
  }
}

fix().then(() => {
  console.log("Done.");
  process.exit(0);
}).catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
