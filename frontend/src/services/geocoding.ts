/**
 * FAUNA-X: Maharashtra Geospatial & Geocoding Service
 * Provides bidirectional place name search (Marathi, Hindi, English),
 * administrative boundary bounds, reverse geocoding, and offline fallback.
 */

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  displayName: string;
  village?: string;
  district?: string;
  state: string;
  source: 'database' | 'osm' | 'gps' | 'manual';
}

// Bounding box for Maharashtra [minLat, minLng, maxLat, maxLng]
export const MAHARASHTRA_BOUNDS = {
  center: [19.7515, 75.7139] as [number, number],
  defaultZoom: 7,
  minLat: 15.6,
  maxLat: 22.1,
  minLng: 72.6,
  maxLng: 80.9,
};

// Comprehensive Maharashtra Administrative Settlements Database
// Supports instant multilingual search in Marathi (मराठी), Hindi (हिंदी), and English
interface MHLocationEntry {
  en: string;
  mr: string;
  hi: string;
  districtEn: string;
  districtMr: string;
  districtHi: string;
  lat: number;
  lng: number;
}

export const MAHARASHTRA_LOCATIONS: MHLocationEntry[] = [
  // Districts & Principal Hubs
  { en: "Pune", mr: "पुणे", hi: "पुणे", districtEn: "Pune", districtMr: "पुणे", districtHi: "पुणे", lat: 18.5204, lng: 73.8567 },
  { en: "Nagpur", mr: "नागपूर", hi: "नागपुर", districtEn: "Nagpur", districtMr: "नागपूर", districtHi: "नागपुर", lat: 21.1458, lng: 79.0882 },
  { en: "Nashik", mr: "नाशिक", hi: "नासिक", districtEn: "Nashik", districtMr: "नाशिक", districtHi: "नासिक", lat: 19.9975, lng: 73.7898 },
  { en: "Chhatrapati Sambhajinagar", mr: "छत्रपती संभाजीनगर (औरंगाबाद)", hi: "छत्रपति संभाजीनगर", districtEn: "Chhatrapati Sambhajinagar", districtMr: "छत्रपती संभाजीनगर", districtHi: "छत्रपति संभाजीनगर", lat: 19.8762, lng: 75.3433 },
  { en: "Ahmednagar", mr: "अहमदनगर (अहिल्यानगर)", hi: "अहमदनगर", districtEn: "Ahmednagar", districtMr: "अहमदनगर", districtHi: "अहमदनगर", lat: 19.0948, lng: 74.7480 },
  { en: "Satara", mr: "सातारा", hi: "सतारा", districtEn: "Satara", districtMr: "सातारा", districtHi: "सतारा", lat: 17.6805, lng: 74.0183 },
  { en: "Kolhapur", mr: "कोल्हापूर", hi: "कोल्हापुर", districtEn: "Kolhapur", districtMr: "कोल्हापूर", districtHi: "कोल्हापुर", lat: 16.7050, lng: 74.2433 },
  { en: "Solapur", mr: "सोलापूर", hi: "सोलापुर", districtEn: "Solapur", districtMr: "सोलापूर", districtHi: "सोलापुर", lat: 17.6599, lng: 75.9064 },
  { en: "Amravati", mr: "अमरावती", hi: "अमरावती", districtEn: "Amravati", districtMr: "अमरावती", districtHi: "अमरावती", lat: 20.9374, lng: 77.7796 },
  { en: "Nanded", mr: "नांदेड", hi: "नांदेड़", districtEn: "Nanded", districtMr: "नांदेड", districtHi: "नांदेड़", lat: 19.1383, lng: 77.3210 },
  { en: "Latur", mr: "लातूर", hi: "लातुर", districtEn: "Latur", districtMr: "लातूर", districtHi: "लातुर", lat: 18.4088, lng: 76.5604 },
  { en: "Jalgaon", mr: "जळगाव", hi: "जलगांव", districtEn: "Jalgaon", districtMr: "जळगाव", districtHi: "जलगांव", lat: 21.0077, lng: 75.5626 },
  { en: "Akola", mr: "अकोला", hi: "अकोला", districtEn: "Akola", districtMr: "अकोला", districtHi: "अकोला", lat: 20.7002, lng: 77.0082 },
  { en: "Dhule", mr: "धुळे", hi: "धुले", districtEn: "Dhule", districtMr: "धुळे", districtHi: "धुले", lat: 20.9042, lng: 74.7749 },
  { en: "Chandrapur", mr: "चंद्रपूर", hi: "चंद्रपुर", districtEn: "Chandrapur", districtMr: "चंद्रपूर", districtHi: "चंद्रपुर", lat: 19.9615, lng: 79.2961 },
  { en: "Parbhani", mr: "परभणी", hi: "परभणी", districtEn: "Parbhani", districtMr: "परभणी", districtHi: "परभणी", lat: 19.2644, lng: 76.7767 },
  { en: "Jalna", mr: "जालना", hi: "जालना", districtEn: "Jalna", districtMr: "जालना", districtHi: "जालना", lat: 19.8347, lng: 75.8816 },
  { en: "Beed", mr: "बीड", hi: "बीड", districtEn: "Beed", districtMr: "बीड", districtHi: "बीड", lat: 18.9891, lng: 75.7601 },
  { en: "Yavatmal", mr: "यवतमाळ", hi: "यवतमाल", districtEn: "Yavatmal", districtMr: "यवतमाळ", districtHi: "यवतमाल", lat: 20.3888, lng: 78.1204 },
  { en: "Sangli", mr: "सांगली", hi: "सांगली", districtEn: "Sangli", districtMr: "सांगली", districtHi: "सांगली", lat: 16.8524, lng: 74.5815 },
  { en: "Wardha", mr: "वर्धा", hi: "वर्धा", districtEn: "Wardha", districtMr: "वर्धा", districtHi: "वर्धा", lat: 20.7453, lng: 78.6022 },
  { en: "Bhandara", mr: "भंडारा", hi: "भंडारा", districtEn: "Bhandara", districtMr: "भंडारा", districtHi: "भंडारा", lat: 21.1667, lng: 79.6500 },
  { en: "Gondia", mr: "गोंदिया", hi: "गोंदिया", districtEn: "Gondia", districtMr: "गोंदिया", districtHi: "गोंदिया", lat: 21.4624, lng: 80.1961 },
  { en: "Buldhana", mr: "बुलढाणा", hi: "बुलढाणा", districtEn: "Buldhana", districtMr: "बुलढाणा", districtHi: "बुलढाणा", lat: 20.5292, lng: 76.1843 },
  { en: "Dharashiv", mr: "धाराशिव (उस्मानाबाद)", hi: "धाराशिव", districtEn: "Dharashiv", districtMr: "धाराशिव", districtHi: "धाराशिव", lat: 18.1861, lng: 76.0419 },
  { en: "Nandurbar", mr: "नंदुरबार", hi: "नंदुरबार", districtEn: "Nandurbar", districtMr: "नंदुरबार", districtHi: "नंदुरबार", lat: 21.3700, lng: 74.2400 },
  { en: "Ratnagiri", mr: "रत्नागिरी", hi: "रत्नागिरी", districtEn: "Ratnagiri", districtMr: "रत्नागिरी", districtHi: "रत्नागिरी", lat: 16.9902, lng: 73.3120 },
  { en: "Sindhudurg", mr: "सिंधुदुर्ग", hi: "सिंधुदुर्ग", districtEn: "Sindhudurg", districtMr: "सिंधुदुर्ग", districtHi: "सिंधुदुर्ग", lat: 16.1200, lng: 73.7000 },
  { en: "Raigad", mr: "रायगड (अलिबाग)", hi: "रायगढ़", districtEn: "Raigad", districtMr: "रायगड", districtHi: "रायगढ़", lat: 18.6414, lng: 72.8722 },
  { en: "Palghar", mr: "पालघर", hi: "पालघर", districtEn: "Palghar", districtMr: "पालघर", districtHi: "पालघर", lat: 19.6967, lng: 72.7699 },
  { en: "Thane", mr: "ठाणे", hi: "ठाणे", districtEn: "Thane", districtMr: "ठाणे", districtHi: "ठाणे", lat: 19.2183, lng: 72.9781 },
  { en: "Gadchiroli", mr: "गडचिरोली", hi: "गढ़चिरौली", districtEn: "Gadchiroli", districtMr: "गडचिरोली", districtHi: "गढ़चिरौली", lat: 20.1800, lng: 80.0000 },
  { en: "Hingoli", mr: "हिंगोली", hi: "हिंगोली", districtEn: "Hingoli", districtMr: "हिंगोली", districtHi: "हिंगोली", lat: 19.7180, lng: 77.1480 },
  { en: "Washim", mr: "वाशीम", hi: "वाशिम", districtEn: "Washim", districtMr: "वाशीम", districtHi: "वाशिम", lat: 20.1110, lng: 77.1360 },

  // Key Rural Livestock Talukas & Villages
  { en: "Baramati", mr: "बारामती", hi: "बारामती", districtEn: "Pune", districtMr: "पुणे", districtHi: "पुणे", lat: 18.1519, lng: 74.5772 },
  { en: "Shirur", mr: "शिरूर", hi: "शिरूर", districtEn: "Pune", districtMr: "पुणे", districtHi: "पुणे", lat: 18.8256, lng: 74.3780 },
  { en: "Junnar", mr: "जुन्नर", hi: "जुन्नर", districtEn: "Pune", districtMr: "पुणे", districtHi: "पुणे", lat: 19.2064, lng: 73.8764 },
  { en: "Haveli", mr: "हवेली", hi: "हवेली", districtEn: "Pune", districtMr: "पुणे", districtHi: "पुणे", lat: 18.4500, lng: 73.8500 },
  { en: "Khed (Rajgurunagar)", mr: "खेड (राजगुरुनगर)", hi: "खेड", districtEn: "Pune", districtMr: "पुणे", districtHi: "पुणे", lat: 18.8570, lng: 73.9030 },
  { en: "Daund", mr: "दौंड", hi: "दौंड", districtEn: "Pune", districtMr: "पुणे", districtHi: "पुणे", lat: 18.4630, lng: 74.5820 },
  { en: "Indapur", mr: "इंदापूर", hi: "इंदापुर", districtEn: "Pune", districtMr: "पुणे", districtHi: "पुणे", lat: 18.1150, lng: 75.0280 },
  { en: "Phaltan", mr: "फलटण", hi: "फलटन", districtEn: "Satara", districtMr: "सातारा", districtHi: "सतारा", lat: 17.9860, lng: 74.4320 },
  { en: "Karad", mr: "कराड", hi: "कराड", districtEn: "Satara", districtMr: "सातारा", districtHi: "सतारा", lat: 17.2885, lng: 74.1844 },
  { en: "Rahata", mr: "राहाता", hi: "राहाता", districtEn: "Ahmednagar", districtMr: "अहमदनगर", districtHi: "अहमदनगर", lat: 19.6970, lng: 74.4820 },
  { en: "Shrirampur", mr: "श्रीरामपूर", hi: "श्रीरामपुर", districtEn: "Ahmednagar", districtMr: "अहमदनगर", districtHi: "अहमदनगर", lat: 19.6190, lng: 74.6570 },
  { en: "Sangamner", mr: "संगमनेर", hi: "संगमनेर", districtEn: "Ahmednagar", districtMr: "अहमदनगर", districtHi: "अहमदनगर", lat: 19.5750, lng: 74.2140 },
  { en: "Malegaon", mr: "मालेगाव", hi: "मालेगांव", districtEn: "Nashik", districtMr: "नाशिक", districtHi: "नासिक", lat: 20.5537, lng: 74.5288 },
  { en: "Sinnar", mr: "सिन्नर", hi: "सिन्नर", districtEn: "Nashik", districtMr: "नाशिक", districtHi: "नासिक", lat: 19.8480, lng: 73.9980 },
  { en: "Niphad", mr: "निफाड", hi: "निफाड", districtEn: "Nashik", districtMr: "नाशिक", districtHi: "नासिक", lat: 20.0760, lng: 74.1110 },
  { en: "Mouda", mr: "मौदा", hi: "मौदा", districtEn: "Nagpur", districtMr: "नागपूर", districtHi: "नागपुर", lat: 21.2660, lng: 79.4000 },
  { en: "Hingna", mr: "हिंगणा", hi: "हिंगणा", districtEn: "Nagpur", districtMr: "नागपूर", districtHi: "नागपुर", lat: 21.0667, lng: 78.9667 },
  { en: "Katol", mr: "काटोल", hi: "काटोल", districtEn: "Nagpur", districtMr: "नागपूर", districtHi: "नागपुर", lat: 21.2720, lng: 78.5860 },
  { en: "Saoner", mr: "सावनेर", hi: "सावनेर", districtEn: "Nagpur", districtMr: "नागपूर", districtHi: "नागपुर", lat: 21.3910, lng: 78.9190 },
  { en: "Umred", mr: "उमरेड", hi: "उमरेड", districtEn: "Nagpur", districtMr: "नागपूर", districtHi: "नागपुर", lat: 20.8520, lng: 79.3270 },
  { en: "Ramtek", mr: "रामटेक", hi: "रामटेक", districtEn: "Nagpur", districtMr: "नागपूर", districtHi: "नागपुर", lat: 21.3990, lng: 79.3280 }
];

export async function searchMaharashtraPlaces(
  query: string,
  preferredLanguage: string = 'en'
): Promise<GeoLocationResult[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  const results: GeoLocationResult[] = [];

  // 1. Search local curated database (Exact, Substring & Multilingual)
  for (const loc of MAHARASHTRA_LOCATIONS) {
    const matchEn = loc.en.toLowerCase().includes(cleanQuery);
    const matchMr = loc.mr.includes(cleanQuery);
    const matchHi = loc.hi.includes(cleanQuery);
    const matchDistEn = loc.districtEn.toLowerCase().includes(cleanQuery);
    const matchDistMr = loc.districtMr.includes(cleanQuery);
    const matchDistHi = loc.districtHi.includes(cleanQuery);

    if (matchEn || matchMr || matchHi || matchDistEn || matchDistMr || matchDistHi) {
      let displayName = `${loc.en}, ${loc.districtEn}, Maharashtra`;
      let village = loc.en;
      let district = loc.districtEn;

      if (preferredLanguage === 'mr') {
        displayName = `${loc.mr}, जिल्हा ${loc.districtMr}, महाराष्ट्र`;
        village = loc.mr;
        district = loc.districtMr;
      } else if (preferredLanguage === 'hi') {
        displayName = `${loc.hi}, ज़िला ${loc.districtHi}, महाराष्ट्र`;
        village = loc.hi;
        district = loc.districtHi;
      }

      results.push({
        latitude: loc.lat,
        longitude: loc.lng,
        displayName,
        village,
        district,
        state: preferredLanguage === 'mr' ? 'महाराष्ट्र' : preferredLanguage === 'hi' ? 'महाराष्ट्र' : 'Maharashtra',
        source: 'database'
      });
    }
  }

  // 2. If fewer than 2 results and query has 3+ chars, try OpenStreetMap Nominatim
  if (results.length < 3 && cleanQuery.length >= 3) {
    try {
      const q = encodeURIComponent(`${cleanQuery}, Maharashtra, India`);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=in&viewbox=72.6,22.1,80.9,15.6&bounded=0&limit=5`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': preferredLanguage === 'mr' ? 'mr,hi,en' : preferredLanguage === 'hi' ? 'hi,mr,en' : 'en' }
      });
      if (res.ok) {
        const osmData = await res.json();
        for (const item of osmData) {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          // Check if within approximate Maharashtra envelope
          if (lat >= 15.0 && lat <= 22.5 && lon >= 72.0 && lon <= 81.5) {
            // Avoid duplicate coordinates
            const isDup = results.some(r => Math.abs(r.latitude - lat) < 0.01 && Math.abs(r.longitude - lon) < 0.01);
            if (!isDup) {
              const parts = (item.display_name || '').split(',').map((p: string) => p.trim());
              const village = parts[0] || cleanQuery;
              const district = parts.length > 2 ? parts[2] : parts[1] || 'Maharashtra';
              results.push({
                latitude: lat,
                longitude: lon,
                displayName: item.display_name,
                village,
                district,
                state: 'Maharashtra',
                source: 'osm'
              });
            }
          }
        }
      }
    } catch (e) {
      // Gracefully silent fallback to curated results
      console.warn('OSM Geocoding service fallback:', e);
    }
  }

  return results;
}

export function findClosestDistrict(lat: number, lng: number): { districtEn: string; districtMr: string; districtHi: string; distanceKm: number } {
  let closest = MAHARASHTRA_LOCATIONS[0];
  let minDistance = Number.MAX_VALUE;

  for (const loc of MAHARASHTRA_LOCATIONS) {
    const dLat = (loc.lat - lat) * 111; // ~111km per degree lat
    const dLng = (loc.lng - lng) * 105; // ~105km per degree lng at 19 deg N
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = loc;
    }
  }

  return {
    districtEn: closest.districtEn,
    districtMr: closest.districtMr,
    districtHi: closest.districtHi,
    distanceKm: minDistance
  };
}
