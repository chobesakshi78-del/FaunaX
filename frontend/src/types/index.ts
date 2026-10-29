export type UserRole = 
  | 'FARMER' 
  | 'VETERINARIAN' 
  | 'FIELD_OFFICER' 
  | 'DISTRICT_ADMIN' 
  | 'STATE_ADMIN' 
  | 'NATIONAL_ADMIN' 
  | 'GOVERNMENT' 
  | 'ADMIN';

export type CaseStatus = 
  | 'SUBMITTED'
  | 'AI_SCREENING'
  | 'AI_SCREENED'
  | 'UNDER_REVIEW'
  | 'VETERINARY_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'LAB_PENDING'
  | 'RESPONSE_ACTIVE'
  | 'FOLLOW_UP'
  | 'RESOLVED'
  | 'CLOSED';

export type CasePriority = 'ROUTINE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CaseTranslation {
  id?: number;
  case_id?: number;
  field_name: string;
  source_language: string;
  target_language: string;
  original_text: string;
  translated_text: string;
  is_verified?: boolean;
  created_at?: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  district?: string;
  state?: string;
  village?: string;
  preferred_language?: string;
  created_at: string;
}

export interface VisualIndicator {
  label: string;
  name: string;
  description: string;
  confidence: number;
  detected: boolean;
}

export interface AlternativePrediction {
  class: string;
  display_name: string;
  confidence: number;
  percentage: number;
}

export interface ImageQualityAudit {
  width?: number;
  height?: number;
  sharpness_score?: number;
  brightness_mean?: number;
  is_blurry?: boolean;
  is_too_dark?: boolean;
  is_too_bright?: boolean;
  overall_quality_score?: number;
  quality_level?: 'GOOD' | 'FAIR' | 'POOR';
  issues?: string[];
}

export interface SHAPFactor {
  feature_key?: string;
  label: string;
  shap_value: number;
  impact: 'INCREASES_RISK' | 'DECREASES_RISK';
}

export interface AIPrediction {
  id?: number;
  model_name: string;
  model_version: string;
  task: string;
  prediction_class: string;
  display_name: string;
  confidence?: number;
  confidence_score?: number;
  percentage?: number;
  is_low_confidence?: boolean;
  status_text?: string;
  visual_indicators?: VisualIndicator[];
  alternatives?: AlternativePrediction[];
  all_probabilities?: Record<string, number>;
  shap_factors?: SHAPFactor[];
  image_quality?: ImageQualityAudit;
  requires_verification?: boolean;
  validation_status?: string;
  clinical_disclaimer?: string;
  created_at?: string;
}

export interface CaseImage {
  id: number;
  storage_path: string;
  original_filename?: string;
  quality_score?: number;
  is_blurry?: boolean;
  created_at: string;
}

export interface CaseSymptom {
  id?: number;
  symptom_name: string;
  severity?: string;
  source?: string;
  notes?: string;
}

export interface VeterinaryVerification {
  id: number;
  veterinarian_id?: number;
  status?: string;
  verification_status?: 'VERIFIED' | 'REJECTED';
  preliminary_diagnosis?: string;
  clinical_findings?: string;
  assessment_notes?: string;
  severity: string;
  sample_required: boolean;
  containment_required: boolean;
  vaccination_required?: boolean;
  treatment_required?: boolean;
  treatment_prescribed?: string | boolean;
  follow_up_date?: string;
  notes?: string;
  verified_at?: string;
  created_at?: string;
}

export interface LabRecord {
  id: number;
  case_id: number;
  sample_id: string;
  sample_type: string;
  lab_name: string;
  test_method: string;
  status: string;
  confirmed_pathogen?: string;
  collection_date?: string;
  result_date?: string;
  notes?: string;
}

export interface Case {
  id: number;
  case_number: string;
  farmer_id?: number;
  species: string;
  breed?: string;
  age?: string;
  age_months?: number;
  sex?: string;
  number_affected: number;
  status: CaseStatus;
  latitude: number;
  longitude: number;
  location_name?: string;
  village?: string;
  district?: string;
  state?: string;
  temperature_c?: number;
  appetite_status?: string;
  mobility_status?: string;
  duration_days?: number;
  voice_transcript?: string;
  notes?: string;
  primary_language?: string;
  translations?: CaseTranslation[];
  farmer?: any;
  animal?: any;
  field_visits?: any[];
  assigned_officer?: any;
  assigned_officer_id?: number;
  ai_risk_score?: number;
  ai_risk_tier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ai_triage_priority?: 'ROUTINE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ai_confidence?: number;
  offline_sync_status?: string;
  history?: Record<string, any>;
  history_data?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  symptoms: CaseSymptom[];
  images: CaseImage[];
  predictions?: AIPrediction[];
  ai_predictions?: AIPrediction[];
  verification?: VeterinaryVerification;
  lab_records?: LabRecord[];
}

export type CaseDetail = Case;

export interface MapCasePoint {
  id: number;
  case_number: string;
  species: string;
  status: CaseStatus;
  latitude: number;
  longitude: number;
  village?: string;
  district?: string;
  location_name?: string;
  ai_risk_tier?: string;
  ai_risk_score?: number;
  top_prediction?: string;
  confidence?: number;
  created_at: string;
}

export interface MapCaseFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    id: number;
    case_number: string;
    species: string;
    status: CaseStatus;
    location_name?: string;
    top_prediction?: string;
    confidence?: number;
    created_at: string;
  };
}

export interface ClusterPoint {
  cluster_code: string;
  centroid: { latitude: number; longitude: number };
  radius_km: number;
  case_count: number;
  primary_species: string;
  risk_level: string;
  status: string;
  recommended_action: string;
}

export interface OutbreakForecast {
  model_name: string;
  model_version: string;
  validation_status: string;
  district: string;
  forecast_risk_level: string;
  trend: string;
  growth_rate_pct: number;
  vaccination_coverage_pct: number;
  active_cluster_count: number;
  projected_cases: Record<string, number>;
  trajectory: Array<{ day: string; cases: number; lower_ci: number; upper_ci: number }>;
  key_drivers: string[];
  recommended_interventions: string[];
  disclaimer: string;
}

export interface AlertItem {
  id: number;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  district?: string;
  state?: string;
  is_active: boolean;
  created_at: string;
}

export interface AIHealthStatus {
  status: 'ready' | 'unavailable' | 'READY' | 'PROTOTYPE_MODE';
  model?: string;
  version?: string;
  task?: string;
  classes?: string[];
  device?: string;
  disclaimer?: string;
}
