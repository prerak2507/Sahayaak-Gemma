'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function MapPanTo({ lat, lng, zoom }: { lat: number, lng: number, zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([lat, lng], zoom || map.getZoom(), {
      animate: true,
      duration: 1.5
    });
  }, [lat, lng, zoom, map]);

  return null;
}
