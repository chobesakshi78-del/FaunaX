import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MapPin, 
  Navigation, 
  AlertCircle, 
  Search, 
  Crosshair, 
  CheckCircle2, 
  Map as MapIcon, 
  Globe, 
  RotateCcw,
  Compass
} from 'lucide-react';
import L from 'leaflet';
import { 
  searchMaharashtraPlaces, 
  findClosestDistrict, 
  MAHARASHTRA_BOUNDS, 
  GeoLocationResult 
} from '../../services/geocoding';

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  locationName?: string;
  village?: string;
  district?: string;
  state?: string;
  onChange: any;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude = 19.7515,
  longitude = 75.7139,
  locationName = '',
  village = '',
  district = '',
  state = 'Maharashtra',
  onChange,
}) => {
  const { t, i18n } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Mode: 'gps' (Use Current Location) vs 'manual' (Choose on Map)
  const [activeMode, setActiveMode] = useState<'gps' | 'manual'>('manual');
  const [currentLat, setCurrentLat] = useState<number>(latitude || 19.7515);
  const [currentLng, setCurrentLng] = useState<number>(longitude || 75.7139);
  const [resolvedName, setResolvedName] = useState<string>(locationName || village || district || '');

  // Search & Geocoding states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoLocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationAlert, setLocationAlert] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Custom high-visibility SVG pin for Leaflet
  const createCustomIcon = (isGps: boolean = false) => {
    return L.divIcon({
      className: 'custom-faunax-marker',
      html: `
        <div style="position: relative; transform: translate(-50%, -100%); cursor: grab;">
          <div style="
            background: ${isGps ? '#0284c7' : '#e11d48'};
            color: white;
            padding: 6px;
            border-radius: 9999px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.3);
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div style="
            width: 8px;
            height: 8px;
            background: rgba(0,0,0,0.4);
            border-radius: 9999px;
            margin: -2px auto 0;
            filter: blur(1px);
          "></div>
        </div>
      `,
      iconSize: [32, 38],
      iconAnchor: [16, 38],
    });
  };

  const notifyChange = (lat: number, lng: number, name: string) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    setResolvedName(name);

    // Derive village & district from name or nearest district lookup
    let derivedVillage = name.split(',')[0]?.trim() || 'Field Location';
    let derivedDistrict = 'Pune';

    const parts = name.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      derivedDistrict = parts[1].replace(/District|जिल्हा|ज़िला/gi, '').trim();
    } else {
      const closest = findClosestDistrict(lat, lng);
      derivedDistrict = i18n.language === 'mr' ? closest.districtMr : i18n.language === 'hi' ? closest.districtHi : closest.districtEn;
    }

    if (typeof onChange === 'function') {
      if (onChange.length >= 3) {
        onChange(lat, lng, name);
      } else {
        onChange({
          latitude: lat,
          longitude: lng,
          location_name: name,
          village: derivedVillage,
          district: derivedDistrict,
          state: i18n.language === 'mr' || i18n.language === 'hi' ? 'महाराष्ट्र' : 'Maharashtra',
        });
      }
    }
  };

  // Initialize or update Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: currentLat === 19.7515 ? 7 : 11,
        minZoom: 6,
        maxZoom: 18,
      });

      // Standard OpenStreetMap Tiles
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | FAUNA-X GIS',
        maxZoom: 19,
      }).addTo(map);

      // Create initial draggable marker
      const marker = L.marker([currentLat, currentLng], {
        draggable: true,
        icon: createCustomIcon(activeMode === 'gps'),
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        handleCoordinateUpdate(pos.lat, pos.lng, false);
      });

      // Map click places or moves marker
      map.on('click', (e: L.LeafletMouseEvent) => {
        handleCoordinateUpdate(e.latlng.lat, e.latlng.lng, false);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Force layout calculation
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const handleCoordinateUpdate = (lat: number, lng: number, flyTo: boolean = true) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    setConfirmed(false);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(createCustomIcon(activeMode === 'gps'));
    }

    if (flyTo && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 12, { duration: 1 });
    }

    // Auto-resolve nearest district and location descriptor
    const closest = findClosestDistrict(lat, lng);
    const districtName = i18n.language === 'mr' 
      ? closest.districtMr 
      : i18n.language === 'hi' 
      ? closest.districtHi 
      : closest.districtEn;

    const formattedLoc = i18n.language === 'mr'
      ? `घटनास्थळ (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E), जिल्हा ${districtName}`
      : i18n.language === 'hi'
      ? `घटना स्थल (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E), ज़िला ${districtName}`
      : `Incident Location (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E), ${districtName} District`;

    notifyChange(lat, lng, formattedLoc);
  };

  // Option 1: Browser GPS Geolocation
  const handleUseCurrentLocation = () => {
    setLocationAlert(null);
    if (!navigator.geolocation) {
      setLocationAlert(t('location.geoUnsupported'));
      return;
    }

    setIsLocating(true);
    setActiveMode('gps');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const closest = findClosestDistrict(lat, lng);
        const districtName = i18n.language === 'mr' ? closest.districtMr : i18n.language === 'hi' ? closest.districtHi : closest.districtEn;
        
        const locLabel = i18n.language === 'mr'
          ? `GPS स्थान: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E (जवळचे: ${districtName})`
          : i18n.language === 'hi'
          ? `GPS स्थान: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E (निकटतम: ${districtName})`
          : `GPS Field Location: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E (${districtName} District)`;

        handleCoordinateUpdate(lat, lng, true);
        notifyChange(lat, lng, locLabel);
        setConfirmed(true);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err.message);
        if (err.code === 1) {
          setLocationAlert(
            i18n.language === 'mr'
              ? 'स्थान (GPS) परवानगी नाकारली गेली. कृपया नकाशावर हाताने ठिकाण निवडा.'
              : i18n.language === 'hi'
              ? 'स्थान (GPS) अनुमति अस्वीकृत हुई। कृपया मानचित्र पर स्थान चुनें।'
              : 'Location permission was denied. Please select your incident location directly on the map.'
          );
        } else {
          setLocationAlert(t('location.geoFailed'));
        }
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  // Option 2: Place Name Multilingual Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setLocationAlert(null);
    try {
      const results = await searchMaharashtraPlaces(searchQuery, i18n.language);
      setSearchResults(results);
      if (results.length === 0) {
        setLocationAlert(
          i18n.language === 'mr'
            ? `"${searchQuery}" हे ठिकाण सापडले नाही. कृपया नकाशावर थेट क्लिक करून निवडा.`
            : i18n.language === 'hi'
            ? `"${searchQuery}" स्थान नहीं मिला। कृपया मानचित्र पर सीधे क्लिक करें।`
            : `Could not locate "${searchQuery}". Please zoom or click on the map directly.`
        );
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (res: GeoLocationResult) => {
    setSearchResults([]);
    setSearchQuery('');
    handleCoordinateUpdate(res.latitude, res.longitude, true);
    notifyChange(res.latitude, res.longitude, res.displayName);
    setConfirmed(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Selector: Option 1 (Use Current Location) vs Option 2 (Choose Location on Map) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMode('manual')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'manual'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>
              {i18n.language === 'mr' ? 'नकाशावर ठिकाण निवडा' : i18n.language === 'hi' ? 'मानचित्र पर स्थान चुनें' : 'Choose on Map'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'gps'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>
              {isLocating
                ? t('location.locating')
                : i18n.language === 'mr'
                ? 'चालू GPS स्थान वापरा'
                : i18n.language === 'hi'
                ? 'वर्तमान GPS स्थान उपयोग करें'
                : 'Use Current Location'}
            </span>
          </button>
        </div>

        <div className="text-[11px] font-mono font-bold text-slate-600 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          <Crosshair className="w-3.5 h-3.5 text-blue-600" />
          <span>
            {currentLat.toFixed(4)}° N, {currentLng.toFixed(4)}° E
          </span>
        </div>
      </div>

      {/* Multilingual Place Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                i18n.language === 'mr'
                  ? 'महाराष्ट्रातील गाव, तालुका किंवा जिल्हा शोधा (उदा. पुणे, मौदा, कराड, बारामती)...'
                  : i18n.language === 'hi'
                  ? 'महाराष्ट्र का गांव, कस्बा या ज़िला खोजें (उदा. पुणे, मौदा, कराड, बारामती)...'
                  : 'Search Maharashtra village, taluka, or district (e.g. Pune, Mouda, Karad, Baramati)...'
              }
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {isSearching ? t('common.loading') : t('common.search')}
          </button>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {searchResults.map((res, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectSearchResult(res)}
                className="w-full text-left p-3 hover:bg-blue-50/70 transition-colors flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-navy-950 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{res.displayName}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {res.latitude.toFixed(4)}° N, {res.longitude.toFixed(4)}° E • {res.district}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {res.source === 'database' ? 'Maharashtra DB' : 'OSM'}
                </span>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Alert or Guidance Message */}
      {locationAlert && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{locationAlert}</span>
        </div>
      )}

      {/* Interactive Maharashtra Map Display */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-sm">
        <div
          ref={mapContainerRef}
          className="w-full h-72 sm:h-80 z-0 bg-slate-100"
          style={{ minHeight: '300px' }}
        />

        {/* Map Overlay Badge */}
        <div className="absolute bottom-2 left-2 z-10 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] text-slate-600 font-bold flex items-center gap-1.5 shadow-xs pointer-events-none">
          <Compass className="w-3 h-3 text-blue-600" />
          <span>Maharashtra Sector [19.75° N, 75.71° E] — Click or drag pin to adjust</span>
        </div>
      </div>

      {/* Location Details & Editable Confirmation */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t('location.villageBlockDistrict')}
            </label>
            <input
              type="text"
              value={resolvedName}
              onChange={(e) => notifyChange(currentLat, currentLng, e.target.value)}
              placeholder={t('location.locationPlaceholder')}
              className="mt-1 w-full text-xs font-bold text-navy-950 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="shrink-0 flex items-center gap-2 pt-2 sm:pt-0">
            <button
              type="button"
              onClick={() => {
                setConfirmed(true);
                notifyChange(currentLat, currentLng, resolvedName);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                confirmed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {confirmed
                  ? i18n.language === 'mr' ? 'स्थान निश्चित झाले' : i18n.language === 'hi' ? 'स्थान पक्का हुआ' : 'Location Confirmed'
                  : i18n.language === 'mr' ? 'स्थान निश्चित करा' : i18n.language === 'hi' ? 'स्थान पक्का करें' : 'Confirm Location'}
              </span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
          {i18n.language === 'mr'
            ? 'टीप: निवडलेले स्थान अधिकृत रोग पाळत ठेवणे व नकाशा अहवालात नोंदवले जाईल. तुम्ही नकाशावरील मार्कर ओढून (drag) अचूक जागा बदलू शकता.'
            : i18n.language === 'hi'
            ? 'नोट: चयनित स्थान आधिकारिक रोग निगरानी एवं रिपोर्ट में दर्ज होगा। आप मानचित्र पर मार्कर खींचकर सटीक स्थान बदल सकते हैं।'
            : 'Note: The selected coordinates and place details will be recorded with the incident case for veterinary response.'}
        </p>
      </div>
    </div>
  );
};

export default LocationPicker;
