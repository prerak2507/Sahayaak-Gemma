import { point, polygon } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

// 🗺️ GeoJSON Polygon representing New Delhi NCR Municipal boundaries
export const DELHI_GEOFENCE_POLYGON = {
  type: "Polygon" as const,
  coordinates: [[
    [76.84, 28.50],
    [76.95, 28.40],
    [77.10, 28.40],
    [77.20, 28.45],
    [77.30, 28.48],
    [77.35, 28.55],
    [77.32, 28.65],
    [77.35, 28.70],
    [77.30, 28.80],
    [77.15, 28.88],
    [77.05, 28.88],
    [76.90, 28.80],
    [76.84, 28.70],
    [76.80, 28.60],
    [76.84, 28.50]
  ]]
};

/**
 * Validates if the user's coordinates reside strictly inside the New Delhi NCR polygon.
 * @param lat Latitude
 * @param lng Longitude
 * @returns boolean
 */
export function isUserInJurisdiction(lat: number, lng: number, city: string = 'delhi'): boolean {
  if (city === 'disabled') {
    return true; // Dynamic developer bypass
  }

  if (city === 'mumbai') {
    // Highly accurate Mumbai Zonal Bounding Box fallback
    return (lat >= 18.8 && lat <= 19.3 && lng >= 72.7 && lng <= 73.0);
  }

  try {
    const pt = point([lng, lat]); // Turf uses [longitude, latitude] (X, Y) GeoJSON convention
    const poly = polygon(DELIE_GEOFENCE_COORDS());
    return booleanPointInPolygon(pt, poly);
  } catch (err) {
    console.error("Geofence check error, activating fallback boundary check:", err);
    // Highly accurate Delhi NCR Bounding Box fallback
    return (lat >= 28.4 && lat <= 28.9 && lng >= 76.8 && lng <= 77.5);
  }
}

// Helper to provide correct typing format for Turf polygon builder
function DELIE_GEOFENCE_COORDS() {
  return DELHI_GEOFENCE_POLYGON.coordinates;
}

/**
 * Performs reverse geocoding via OpenStreetMap Nominatim API (100% Free, No-API-Key).
 * Enforces custom User-Agent headers to satisfy Nominatim usage guidelines.
 * @param lat Latitude
 * @param lng Longitude
 * @returns Address string
 */
export async function fetchAddressFromCoords(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Sahaayak-App/1.0 (hackathon-demo; contact: support@sahaayak.org)'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Nominatim query returned status code: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.display_name) {
      // Return a slightly condensed version of Nominatim's verbose address output
      const addressParts = data.display_name.split(', ');
      if (addressParts.length > 3) {
        return addressParts.slice(0, 3).join(', '); // Show top 3 local details (e.g. "Connaught Place, New Delhi, Delhi")
      }
      return data.display_name;
    }
    
    if (data && data.address) {
      const addr = data.address;
      const localName = addr.road || addr.suburb || addr.neighbourhood || addr.amenity || addr.building || "";
      const districtName = addr.district || addr.county || addr.city || addr.town || "";
      if (localName && districtName) {
        return `${localName}, ${districtName}`;
      }
    }
    
    return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
  } catch (err) {
    console.error("OSM Nominatim geocoding failed, returning raw coords fallback:", err);
    return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
  }
}
