import { NextResponse } from 'next/server';
import { db as adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('needs').get();
    const batch = adminDb.batch();
    let deleted = 0;
    let updated = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.category !== 'government') {
        batch.delete(doc.ref);
        deleted++;
      } else {
        let needsUpdate = false;
        const updates: any = {};
        
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

    return NextResponse.json({ success: true, deleted, updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
