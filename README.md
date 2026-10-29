# FAUNA-X: Livestock Health Intelligence & Early Outbreak Response System

**Smart India Hackathon 2026 — Problem Statement SIH26128**  
*Efficient systems for early detection, prevention, and management of livestock diseases and animal health issues.*

---

## 1. Executive Summary

**FAUNA-X** is an end-to-end, multi-tier livestock disease surveillance and syndromic early response platform designed for the Department of Animal Husbandry and Dairying (DAHD), veterinary field officers, and rural farmers across India.

Unlike standalone computer vision demonstrators, FAUNA-X provides a complete field-to-policy pipeline:
$$\text{Farmer Field Signal} \xrightarrow{} \text{AI Visual Screening} \xrightarrow{} \text{Spatial-Temporal Intelligence} \xrightarrow{} \text{Veterinary Clinical Audit} \xrightarrow{} \text{Containment Directive} \xrightarrow{} \text{National Surveillance}$$

```
Farmer
  ↓ (Photo + Symptoms + Voice + GPS + History)
AI Visual Screening (Trained PyTorch/YOLO Engine)
  ↓ (Preliminary Visual Indicators)
Spatial-Temporal Intelligence (PostGIS Geospatial Coordinates)
  ↓ (Clinical Triage Worklist)
Veterinary Verification (Official Diagnosis / Lab Sample / Quarantine)
  ↓ (Audit Logs & Lifecycle Actions)
Government Outbreak Surveillance (GIS Maps & Macro Analytics)
```

---

## 2. Real AI Model Integration

FAUNA-X is powered by the actual trained production vision model:
- **Model Path**: `models/production/faunax_livestock_vision_v1.pt`
- **Architecture**: `YOLO11n-cls` (Ultralytics / PyTorch 2.5.1+cu121)
- **Model Size**: `3.2 MB` (Lightweight edge-optimized weights)
- **Input Tensor**: `640 × 640 × 3` RGB
- **Dynamic Classes**:
  1. `fmd` (Foot-and-Mouth Disease)
  2. `healthy` (Healthy Livestock)
  3. `lumpy_skin` (Lumpy Skin Disease)
- **Confidence Decision Threshold**: `0.65 (65%)`
- **Quality Checks**: Automated Laplacian blur estimation, brightness audit, and resolution validation before inference.
- **Hardware Acceleration**: Automatic CUDA detection with graceful CPU fallback.

> **AI Safety & Clinical Governance Disclaimer**:  
> FAUNA-X visual screening outputs represent preliminary syndromic indicators and **do NOT replace veterinary medical diagnosis**. All disease containment, vaccination directives, and treatment regimens mandate physical veterinary clinical verification.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router, Recharts, Lucide React, IndexedDB (IDB) |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy 2.0 (Async), Pydantic V2, Uvicorn |
| **AI / ML** | PyTorch 2.5.1, Torchvision, Ultralytics YOLO, OpenCV (`opencv-python-headless`) |
| **Database** | PostgreSQL + PostGIS (Production), SQLite with `aiosqlite` (Zero-Config Development) |
| **Caching / Queue**| Redis 7 |
| **Authentication**| JWT (JSON Web Tokens) with Argon2 / bcrypt password hashing & Role-Based Access Control |
| **Containerization**| Docker, Docker Compose, Multi-stage Nginx builds |

---

## 4. Multi-Modal AI Interface Architecture

FAUNA-X establishes clean interfaces for future intelligence modules while ensuring that untrained models are never simulated or fabricated:

| Module Code | Subsystem Name | Current Implementation Status | Underlying Tech |
| :--- | :--- | :--- | :--- |
| **AI-01** | Livestock Visual Screening | **ONLINE / PRODUCTION** | PyTorch / YOLO11n-cls (`.pt`) |
| **AI-02** | Voice Dialect Symptom Parser | **PLANNED** | Whisper / Indic-Wav2Vec |
| **AI-03** | Multi-Factor Case Risk Engine | **PLANNED** | XGBoost / LightGBM |
| **AI-04** | Spatial-Temporal Outbreak Clustering | **PLANNED** | DBSCAN / HDBSCAN (`/api/ai/clusters/analyze`) |
| **AI-05** | Regional Epidemic Forecasting | **PLANNED** | Prophet / Bi-LSTM |
| **AI-06** | Clinical Explainability Heatmaps | **PLANNED** | Grad-CAM / SHAP |

---

## 5. Seed Demo Accounts

FAUNA-X is pre-seeded with realistic synthetic test accounts:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Farmer** | `farmer@faunax.gov.in` | `Farmer@123` | Mobile-first 8-step reporting wizard, offline drafts, case tracking |
| **Veterinarian** | `vet@faunax.gov.in` | `Vet@123` | Clinical triage worklist, AI screening audit, official verification panel |
| **Government** | `govt@faunax.gov.in` | `Govt@123` | National GIS disease maps, species distribution, district statistics |
| **Administrator** | `admin@faunax.gov.in` | `Admin@123` | Full system oversight, AI model registry & GPU telemetry |

---

## 6. Quick Start Guide

### Prerequisites
- Python 3.10+ (with Virtual Environment)
- Node.js 18+ and npm
- (Optional) NVIDIA GPU with CUDA 12.1+

### Step 1: Clone and Configure Environment
```bash
git clone https://github.com/faunax/faunax.git
cd faunax
cp .env.example .env
```

### Step 2: Set Up Backend
```bash
# Create and activate python virtual environment
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Linux / macOS:
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Seed development database with demo accounts & records
python -m backend.app.seed

# Start FastAPI server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend starts at `http://localhost:8000` (Interactive Swagger Docs: `http://localhost:8000/docs`).

### Step 3: Set Up Frontend
```bash
cd frontend
npm install
npm run dev
```
The React frontend starts at `http://localhost:5173`.

---

## 7. Running Automated Test Suites

FAUNA-X includes end-to-end tests validating the real trained PyTorch vision model and FastAPI endpoints:

```bash
# Run backend and ML model tests
pytest tests/ -v
```

Tests verify:
1. Model loading & CUDA/CPU memory allocation.
2. Direct image inference against actual validation images.
3. Probability distribution sum constraint ($\sum p_i = 1.0$).
4. Image quality evaluation (blur, contrast, brightness).
5. Authentication, case creation, and veterinary verification endpoints.

---

## 8. Docker Deployment

Deploy the entire production stack (Frontend + Backend + PostGIS + Redis) with a single command:

```bash
docker-compose up --build -d
```
- **Web App**: `http://localhost:3000`
- **FastAPI API**: `http://localhost:8000`
- **PostGIS Database**: `localhost:5432`

---

## 9. API Reference Overview

### AI Vision Inference
- `POST /api/ai/vision/predict` — Multipart upload for real-time model inference.
- `GET /api/ai/health` — Returns model readiness, task, classes, and GPU hardware device.

### Case Management & Workflow
- `POST /api/cases` — Register new field incident with symptoms and history.
- `POST /api/cases/{case_id}/image` — Upload photo and trigger automated AI visual screening.
- `GET /api/cases` — List cases with status and district filtering.
- `GET /api/cases/{case_id}` — Retrieve full case profile with clinical timeline.

### Veterinary Actions
- `POST /api/vet/cases/{case_id}/verify` — Submit official clinical verification, severity, containment directives.
- `POST /api/vet/cases/{case_id}/reject` — Reject false alert with clinical notes.

### Geospatial Surveillance
- `GET /api/map/cases` — PostGIS GeoJSON feature feed for interactive surveillance mapping.
- `GET /api/map/summary` — Epidemiological KPI counters and district disease breakdown.

---

## 10. License & Acknowledgements

Developed for **Smart India Hackathon 2026** under Problem Statement **SIH26128**.  
Built with PyTorch, Ultralytics YOLO, FastAPI, React, and Mapbox GL JS.
