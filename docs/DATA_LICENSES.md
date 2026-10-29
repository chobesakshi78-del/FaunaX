# FAUNA-X Dataset Provenance & Licensing Register

This document records the exact provenance, licensing, terms of use, and academic attribution for all public datasets incorporated into the **FAUNA-X Livestock Visual Health Screening Model** (Problem Statement: SIH26128).

---

## 1. Primary Datasets

### A. LumpySkinDisease_DataHub
- **Dataset Title**: LumpySkinDisease_DataHub
- **Source Platform**: Zenodo
- **Digital Object Identifier (DOI)**: [10.5281/zenodo.11003967](https://doi.org/10.5281/zenodo.11003967)
- **Direct Record URL**: https://zenodo.org/records/11003967
- **Creator / Author**: Francesco Branda (Università Campus Bio-Medico di Roma)
- **Publication Date**: April 21, 2024
- **License**: Creative Commons Attribution 4.0 International ([CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/))
- **File Archive**: `LumpySkinDisease_DataHub.zip` (511.5 MB, MD5: `81d77de795a5aaf5c446b872335f64d5`)
- **Clinical Scope**: Bovine imagery documenting cutaneous nodules, localized lesions, scabs, and healthy cattle controls.
- **Usage in FAUNA-X**: Preliminary screening for cutaneous nodular patterns associated with Lumpy Skin Disease (LSD).
- **Terms & Attribution**: Free to share and adapt with appropriate academic credit given to the author.

---

### B. Foot-and-Mouth Disease (FMD) Cattle Dataset
- **Dataset Title**: FMD Cattle
- **Source Platform**: Zenodo
- **Digital Object Identifier (DOI)**: [10.5281/zenodo.7779246](https://doi.org/10.5281/zenodo.7779246)
- **Direct Record URL**: https://zenodo.org/records/7779246
- **Creator / Author**: Abbie Osborn (University of Surrey)
- **Publication Date**: March 28, 2023
- **License**: Creative Commons Attribution 4.0 International ([CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/))
- **File Archive**: `FMD_Cattle.zip` (191.1 MB, MD5: `79185643478182c586a9c5f14e01cdd4`)
- **Clinical Scope**: Clinical photographic documentation of vesicular lesions, muzzle erosions, and oral/hoof indicators of Foot-and-Mouth Disease.
- **Usage in FAUNA-X**: Preliminary screening for vesicular epithelial abnormalities.
- **Terms & Attribution**: Free to share and adapt under CC-BY-4.0 terms.

---

## 2. Ethical Compliance & Data Governance Policy

1. **No Web Scraping Policy**: All images used in the FAUNA-X pipeline originate from verified scientific repositories with documented DOI records. No uncurated or unverified web search engine images are used.
2. **No Data Fabrication**: Ground truth clinical labels are strictly derived from scientific publications. No artificial annotations or hallucinated bounding boxes are introduced.
3. **Data Leakage Safeguards**: Rigorous MD5 and dHash checks prevent cross-contamination between training, validation, and test splits.
4. **Clinical Disclaimer**: All datasets represent photographic visual screening cues and are intended solely for AI-assisted triage, strictly mandating in-person veterinary confirmation.
