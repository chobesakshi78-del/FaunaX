import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Layers, Filter, Compass } from 'lucide-react';
import L from 'leaflet';
import { MapCasePoint, MapCaseFeature } from '../../types';

interface MapViewProps {
  cases?: MapCasePoint[];
  features?: MapCaseFeature[];
  height?: string;
  onSelectCase?: (caseId: number) => void;
  selectedCaseId?: number | null;
}

export const MapView: React.FC<MapViewProps> = ({ 
  cases = [], 
  features = [], 
  height = '500px', 
  onSelectCase, 
  selectedCaseId 
}) => {
  const { t, i18n } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Normalize points from either cases array or GeoJSON features array
  const rawPoints = cases.length > 0 
    ? cases 
    : features.map(f => ({
        id: f.properties.id,
        case_number: f.properties.case_number,
        species: f.properties.species,
        status: f.properties.status,
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0],
        village: f.properties.location_name,
        district: f.properties.location_name,
        top_prediction: f.properties.top_prediction,
        confidence: f.properties.confidence,
        created_at: f.properties.created_at,
      }));

  const filteredCases = rawPoints.filter((c) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'VERIFIED') return c.status === 'VERIFIED';
    if (statusFilter === 'PENDING') return ['SUBMITTED', 'AI_SCREENING', 'AI_SCREENED', 'UNDER_REVIEW', 'VETERINARY_REVIEW'].includes(c.status);
    if (statusFilter === 'ACTIVE') return c.status === 'RESPONSE_ACTIVE';
    return true;
  });

  const getMarkerColorHex = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return '#10b981'; // emerald
      case 'RESPONSE_ACTIVE':
        return '#f43f5e'; // rose
      case 'VETERINARY_REVIEW':
      case 'UNDER_REVIEW':
      case 'AI_SCREENING':
      case 'AI_SCREENED':
      case 'SUBMITTED':
        return '#f59e0b'; // amber
      default:
        return '#64748b'; // slate
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [19.7515, 75.7139], // Center of Maharashtra
        zoom: 7,
        minZoom: 6,
        maxZoom: 18,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | FAUNA-X GIS Surveillance',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      setTimeout(() => map.invalidateSize(), 200);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync Markers when filteredCases or selectedCaseId changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    filteredCases.forEach((c) => {
      const lat = c.latitude || 19.75;
      const lng = c.longitude || 75.71;
      const isSelected = selectedPoint?.id === c.id || selectedCaseId === c.id;
      const color = getMarkerColorHex(c.status);

      const markerHtml = `
        <div style="position: relative; transform: translate(-50%, -100%); cursor: pointer;">
          <div style="
            background: ${color};
            color: white;
            padding: 4px;
            border-radius: 9999px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? '32px' : '26px'};
            height: ${isSelected ? '32px' : '26px'};
            outline: ${isSelected ? '4px solid #60a5fa' : 'none'};
            transition: all 0.2s;
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'case-gis-marker',
        html: markerHtml,
        iconSize: [26, 32],
        iconAnchor: [13, 32],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedPoint(c);
        if (onSelectCase) onSelectCase(c.id);
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [filteredCases, selectedPoint, selectedCaseId]);

  return (
    <div 
      style={{ height }}
      className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-card flex flex-col"
    >
      {/* Map Header Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 text-slate-800 text-xs shadow-md">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900">
            {i18n.language === 'mr'
              ? `महाराष्ट्र पशु रोग पाळत ठेवणे GIS (${filteredCases.length} नोंदवलेली ठिकाणे)`
              : i18n.language === 'hi'
              ? `महाराष्ट्र पशु रोग निगरानी GIS (${filteredCases.length} दर्ज स्थान)`
              : `Maharashtra Epidemiological Surveillance GIS (${filteredCases.length} points)`}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">{t('common.all')}</option>
            <option value="VERIFIED">{t('status.verified')}</option>
            <option value="PENDING">{t('vet.pendingReview')}</option>
            <option value="ACTIVE">{t('status.responseActive')}</option>
          </select>
        </div>
      </div>

      {/* Interactive Leaflet Map Div */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0 bg-slate-100" />

      {/* Selected Case Detail Drawer Popup on Map */}
      {selectedPoint && (
        <div className="absolute bottom-12 left-4 right-4 sm:right-auto sm:w-84 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 text-slate-900 z-[400] shadow-2xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-blue-600 text-xs">{selectedPoint.case_number}</span>
              <span className="text-[11px] text-slate-500 font-medium">({selectedPoint.species})</span>
            </div>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-slate-400 hover:text-slate-700 text-xs p-1 font-bold"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('location.villageBlockDistrict')}:</span>
              <span className="font-semibold text-slate-800">
                {selectedPoint.village || selectedPoint.district || 'Maharashtra Field'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('common.status')}:</span>
              <span className="font-bold text-emerald-600">{selectedPoint.status}</span>
            </div>
            {selectedPoint.top_prediction && (
              <div className="flex justify-between">
                <span className="text-slate-500">{t('vet.aiScreeningHeader')}:</span>
                <span className="font-bold text-blue-700">
                  {selectedPoint.top_prediction} ({((selectedPoint.confidence || 0) * 100).toFixed(0)}%)
                </span>
              </div>
            )}
            <div className="flex justify-between font-mono text-[10px] text-slate-400 pt-1">
              <span>{t('location.coordinates')}:</span>
              <span>{selectedPoint.latitude?.toFixed(4)}° N, {selectedPoint.longitude?.toFixed(4)}° E</span>
            </div>
          </div>

          {onSelectCase && (
            <button
              onClick={() => onSelectCase(selectedPoint.id)}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              {t('common.viewDetails')}
            </button>
          )}
        </div>
      )}

      {/* Map Legend */}
      <div className="bg-white border-t border-slate-200 p-2.5 px-4 flex flex-wrap items-center justify-between text-[11px] text-slate-600 z-[400]">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span>
            <span className="font-medium">{t('status.verified')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></span>
            <span className="font-medium">{t('vet.pendingReview')}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm"></span>
            <span className="font-medium">{t('status.responseActive')}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-blue-700 font-bold">
          <Compass className="w-3.5 h-3.5" />
          <span>OpenStreetMap & PostGIS Live Feed</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
