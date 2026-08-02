'use client';

import { useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { useGovtStore } from '@/stores/govtStore';

export function GlobalCitySync() {
  const setActiveCity = useGovtStore(s => s.setActiveCity);

  useEffect(() => {
    // Listen to the jury panel geofence settings globally
    const unsubscribe = onSnapshot(doc(db, 'system_config', 'geofence_settings'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.active_city) {
          let newCity = data.active_city.toLowerCase();
          if (newCity === 'delhi' || newCity === 'rajkot' || newCity === 'global') {
            setActiveCity(newCity);
          }
        }
      }
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    return () => unsubscribe();
  }, [setActiveCity]);

  return null;
}
