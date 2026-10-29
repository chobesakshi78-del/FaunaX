import { Case, AIPrediction, MapCasePoint, MapCaseFeature, AIHealthStatus, User, ClusterPoint, OutbreakForecast, LabRecord } from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('faunax_token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Authentication failed');
    }
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  // AI Health & ML Endpoints
  async getAIHealth(): Promise<AIHealthStatus> {
    const res = await fetch(`${API_BASE}/ml/health`);
    if (!res.ok) {
      const fallback = await fetch(`${API_BASE}/ai/health`).catch(() => null);
      if (fallback && fallback.ok) return fallback.json();
      return { status: 'unavailable' };
    }
    return res.json();
  },

  async getAiHealth(): Promise<AIHealthStatus> {
    return this.getAIHealth();
  },

  async getModelMetadata(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/models`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch model telemetry');
    return res.json();
  },

  async directVisionPredict(file: File, species = 'cattle'): Promise<AIPrediction> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('animal_species', species);

    const res = await fetch(`${API_BASE}/ml/image-analysis`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Inference failed' }));
      throw new Error(err.detail || 'Visual screening inference failed');
    }
    return res.json();
  },

  async extractSymptomsFromText(text: string, species = 'Cattle'): Promise<any> {
    const res = await fetch(`${API_BASE}/ml/symptom-extraction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ text, species }),
    });
    if (!res.ok) throw new Error('Failed to extract symptoms from text');
    return res.json();
  },

  async getCaseExplanation(caseId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/explanation/${caseId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch SHAP explainability factors');
    return res.json();
  },

  // Cases
  async createCase(data: any): Promise<Case> {
    const res = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Creation failed' }));
      throw new Error(err.detail || 'Failed to create case');
    }
    return res.json();
  },

  async uploadCaseImage(caseId: number, file: File): Promise<AIPrediction> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/cases/${caseId}/image`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload & screening failed' }));
      throw new Error(err.detail || 'Image upload and AI screening failed');
    }
    return res.json();
  },

  async getCases(statusFilter?: string, districtFilter?: string, riskFilter?: string): Promise<Case[]> {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status_filter', statusFilter);
    if (districtFilter) params.append('district_filter', districtFilter);
    if (riskFilter) params.append('risk_filter', riskFilter);

    const res = await fetch(`${API_BASE}/cases?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load cases');
    return res.json();
  },

  async getCase(id: number | string): Promise<Case> {
    const res = await fetch(`${API_BASE}/cases/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load case detail');
    return res.json();
  },

  async getCaseById(id: number | string): Promise<Case> {
    return this.getCase(id);
  },

  // Vet Actions
  async verifyCase(caseId: number, verificationData: any): Promise<Case> {
    const res = await fetch(`${API_BASE}/vet/cases/${caseId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(verificationData),
    });
    if (!res.ok) throw new Error('Failed to verify case');
    return res.json();
  },

  async rejectCase(caseId: number, rejectionData: any): Promise<Case> {
    const res = await fetch(`${API_BASE}/vet/cases/${caseId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ ...rejectionData, status: 'REJECTED' }),
    });
    if (!res.ok) throw new Error('Failed to reject case');
    return res.json();
  },

  async scheduleFieldVisit(caseId: number, visitData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/vet/cases/${caseId}/visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(visitData),
    });
    if (!res.ok) throw new Error('Failed to schedule field visit');
    return res.json();
  },

  async referLabSample(caseId: number, labData: any): Promise<LabRecord> {
    const res = await fetch(`${API_BASE}/vet/cases/${caseId}/lab-sample`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(labData),
    });
    if (!res.ok) throw new Error('Failed to create laboratory requisition');
    return res.json();
  },

  async getVetStats(): Promise<any> {
    const res = await fetch(`${API_BASE}/vet/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load vet statistics');
    return res.json();
  },

  // Map, Clusters & Forecasting
  async getMapCases(district?: string, species?: string, riskLevel?: string): Promise<MapCasePoint[]> {
    const params = new URLSearchParams();
    if (district) params.append('district', district);
    if (species) params.append('species', species);
    if (riskLevel) params.append('risk_level', riskLevel);

    const res = await fetch(`${API_BASE}/map/cases?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load map cases');
    return res.json();
  },

  async getClusters(district?: string, timeWindowDays = 21): Promise<ClusterPoint[]> {
    const params = new URLSearchParams();
    if (district) params.append('district', district);
    params.append('time_window_days', timeWindowDays.toString());

    const res = await fetch(`${API_BASE}/map/clusters?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load clusters');
    return res.json();
  },

  async getOutbreakForecast(district: string): Promise<OutbreakForecast> {
    const res = await fetch(`${API_BASE}/map/forecast/${encodeURIComponent(district)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load outbreak forecast');
    return res.json();
  },

  async getSpatialStats(): Promise<any> {
    const res = await fetch(`${API_BASE}/map/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load spatial statistics');
    return res.json();
  },

  // Multilingual & Translation
  async translateCase(caseId: number, targetLanguage: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/translate?target_language=${encodeURIComponent(targetLanguage)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ target_language: targetLanguage }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Translation request failed' }));
      throw new Error(err.detail || 'Translation failed');
    }
    return res.json();
  },

  async translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/cases/translate/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        text,
        target_language: targetLanguage,
        source_language: sourceLanguage,
      }),
    });
    if (!res.ok) throw new Error('Text translation failed');
    return res.json();
  },

  async getCaseTranslations(caseId: number): Promise<any[]> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/translations`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async updateUserLanguage(preferred_language: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/profile/language`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ preferred_language }),
    });
    if (!res.ok) throw new Error('Failed to update language preference');
    return res.json();
  },

  // Livestock Herd Management
  async getMyAnimals(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/cases/animals/mine`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async createAnimal(animalData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/cases/animals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(animalData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to register animal' }));
      throw new Error(err.detail || 'Failed to register animal');
    }
    return res.json();
  },

  // Field Officer Operations
  async getFieldOfficers(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/field/officers`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async assignFieldOfficer(caseId: number, officerId: number, instructions?: string, priority?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/field/cases/${caseId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        field_officer_id: officerId,
        instructions: instructions || 'Conduct on-ground health verification and sample inspection.',
        priority: priority || 'HIGH',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to assign field officer' }));
      throw new Error(err.detail || 'Failed to assign field officer');
    }
    return res.json();
  },

  async getFieldCases(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/field/cases`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load assigned field cases');
    return res.json();
  },

  async recordFieldVisit(caseId: number, visitData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/field/cases/${caseId}/visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(visitData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to record visit' }));
      throw new Error(err.detail || 'Failed to record field visit');
    }
    return res.json();
  },

  async escalateFieldCase(caseId: number, reason: string): Promise<any> {
    const res = await fetch(`${API_BASE}/field/cases/${caseId}/escalate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ escalation_reason: reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to escalate case' }));
      throw new Error(err.detail || 'Failed to escalate case');
    }
    return res.json();
  },
};
