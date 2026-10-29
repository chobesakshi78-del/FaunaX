# Model Card: FAUNA-X Livestock Visual Health Screening Core

**Model Name**: FAUNA-X Livestock Visual Health Screening Model  
**Version**: `v1.0.0`  
**Date**: October 2026  
**License**: Apache-2.0 / Scientific Open Source  
**Repository**: [FAUNA-X (SIH26128)](file:///d:/FaunaX)

---

## 1. Model Overview & Purpose

### Primary Purpose
The **FAUNA-X Livestock Visual Health Screening Model** is an edge-optimized computer vision model designed to perform preliminary visual screening on livestock (primarily bovine / cattle) photographs. It detects observable morphological visual indicators associated with major infectious cattle conditions:
1. **Lumpy Skin Disease (LSD)** — Cutaneous nodules, firm round lesions, localized ulcerations.
2. **Foot-and-Mouth Disease (FMD)** — Vesicular erosions on oral mucosa, muzzle, and interdigital clefts.
3. **Healthy Controls** — Clear cutaneous epithelium without visible lesions.

### Intended Users
- **Rural Livestock Farmers**: Early detection flags encouraging timely veterinary outreach.
- **Para-Veterinarians & Field Extension Workers**: Photographic triage during village health camps.
- **State Animal Husbandry Departments**: Aggregate syndromic surveillance and cluster alerts.

### Intended Use
- Preliminary visual triage and automated anomaly flag generation.
- Feature extraction input into the downstream **FAUNA-X XGBoost Case Risk Engine (AI-03)** and **DBSCAN Outbreak Clustering (AI-04)**.

### Out-of-Scope & Non-Intended Uses
> [!CAUTION]
> - **NOT A VETERINARY DIAGNOSTIC SYSTEM**: This model does NOT replace clinical, serological, or PCR laboratory diagnostics.
> - **NOT FOR AUTONOMOUS TREATMENT**: Prescription of antibiotics, antiviral medication, or vaccines MUST NOT be triggered autonomously based on model inference alone.
> - **NON-BOVINE SPECIES**: The model is calibrated on cattle and should not be used as-is on equine, poultry, or swine without dedicated domain adaptation.

---

## 2. Training Data & Provenance

| Dataset | Provenance / Source | License | Samples (Cleaned) | Visual Indicators |
| :--- | :--- | :--- | :--- | :--- |
| **LSD DataHub** | Zenodo ([10.5281/zenodo.11003967](https://doi.org/10.5281/zenodo.11003967)) | CC-BY-4.0 | Peer-reviewed cattle imagery | Cutaneous nodules, scabs, normal skin |
| **FMD Cattle** | Zenodo ([10.5281/zenodo.7779246](https://doi.org/10.5281/zenodo.7779246)) | CC-BY-4.0 | Clinical cattle cases | Oral and foot vesicular lesions |

- **Data Splitting**: Stratified 70% Training / 15% Validation / 15% Testing with zero-leakage cross-split hash verification.
- **Data Hygiene**: Corrupt images, duplicate MD5 hashes, and non-informative solid frames filtered via automated audit.

---

## 3. Training & Technical Specifications

- **Architecture Backbone**: Ultralytics YOLO (`yolo11n-cls` / `yolo8n-cls`)
- **Input Resolution**: 224x224 RGB
- **Optimization**: AdamW, Learning Rate $\text{lr}_0 = 10^{-3}$, Weight Decay = $5 \times 10^{-4}$
- **Batch Size**: 16 with Automatic Mixed Precision (AMP FP16)
- **Early Stopping**: Patience = 12 epochs on validation loss
- **Hardware**: NVIDIA GeForce RTX 2050 (4GB VRAM)
- **Software Stack**: Python 3.10, PyTorch 2.5.1+cu121, CUDA 12.1

---

## 4. Ethical & Safety Considerations

> [!IMPORTANT]
> **Mandatory Regulatory Statement**:  
> *"This model is intended for AI-assisted livestock health screening and visual indicator detection. It is not a substitute for veterinary diagnosis."*

### Known Biases & Environmental Limitations
1. **Lighting Variations**: Direct harsh sunlight or heavy barn shadows can cause low-confidence outputs.
2. **Mud / Dung Artifacts**: Dried mud adhering to cattle hide can superficially mimic cutaneous nodules; confidence thresholding is enforced to flag ambiguous cases for manual inspection.
3. **Occlusion & Distance**: Animals photographed at extreme distances (>5 meters) lack fine lesion resolution.

---
*FAUNA-X Model Card — Smart India Hackathon 2026 (SIH26128)*
