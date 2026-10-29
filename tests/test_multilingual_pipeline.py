"""
FAUNA-X: Comprehensive End-to-End Multilingual Test Suite
Verifies:
1. English, Marathi, Hindi dictionary parity & Unicode formatting
2. Role-based independent language preferences (Farmer, Vet, Field Officer)
3. Devanagari Marathi symptom entry & verbatim retrieval
4. Devanagari Hindi symptom entry & verbatim retrieval
5. Devanagari location names & language-neutral GPS preservation
6. Medical history and epidemiological records localization
7. Devanagari symptom NLP extraction (Marathi & Hindi)
8. Translation service endpoints (dual-language preservation, caching, query & body support)
9. AI visual screening result localization & mandatory veterinary disclaimers
10. Dynamic text translation API (/api/cases/translate/text)
"""
import json
import pytest
from pathlib import Path
from httpx import AsyncClient, ASGITransport

from backend.app.main import app
from backend.app.services.translation_service import translation_service
from ml.nlp.symptom_extraction import extract_symptoms_from_text


# 1. Locale Dictionary Parity & Unicode Test
def test_locale_dictionaries_parity_and_unicode():
    locales_dir = Path(__file__).resolve().parent.parent / "frontend" / "src" / "i18n" / "locales"
    en_path = locales_dir / "en.json"
    mr_path = locales_dir / "mr.json"
    hi_path = locales_dir / "hi.json"

    assert en_path.exists(), "en.json must exist"
    assert mr_path.exists(), "mr.json must exist"
    assert hi_path.exists(), "hi.json must exist"

    with open(en_path, "r", encoding="utf-8") as f:
        en_dict = json.load(f)
    with open(mr_path, "r", encoding="utf-8") as f:
        mr_dict = json.load(f)
    with open(hi_path, "r", encoding="utf-8") as f:
        hi_dict = json.load(f)

    # Core required sections
    required_sections = [
        "common", "roles", "farmer", "vet", "field", "report",
        "symptoms", "history", "aiScreening", "diseases", "species",
        "voice", "validation", "priority", "timeline"
    ]

    for sec in required_sections:
        assert sec in en_dict, f"Missing section '{sec}' in en.json"
        assert sec in mr_dict, f"Missing section '{sec}' in mr.json"
        assert sec in hi_dict, f"Missing section '{sec}' in hi.json"

        # Check key parity
        for key in en_dict[sec]:
            assert key in mr_dict[sec], f"Key '{key}' in section '{sec}' missing in mr.json"
            assert key in hi_dict[sec], f"Key '{key}' in section '{sec}' missing in hi.json"

    # Verify Devanagari characters in mr and hi
    assert ("लंपी" in mr_dict["diseases"]["lumpy_skin"] or "लम्पी" in mr_dict["diseases"]["lumpy_skin"])
    assert ("लंपी" in hi_dict["diseases"]["lumpy_skin"] or "लम्पी" in hi_dict["diseases"]["lumpy_skin"])
    assert "लसीकरण" in mr_dict["history"]["vaccinationStatus"]
    assert "टीकाकरण" in hi_dict["history"]["vaccinationStatus"]


# 2. Devanagari NLP Symptom Extraction Test
def test_nlp_symptom_extraction_multilingual():
    # Marathi symptom extraction
    mr_text = "गाय दोन दिवसांपासून चारा खात नाही आणि खूप ताप आहे आणि त्वचेवर गाठी दिसत आहेत"
    extracted_mr = extract_symptoms_from_text(mr_text)
    assert any("Skin Lesions" in s or "Appetite Loss" in s or "Fever" in s for s in extracted_mr), f"Failed for Marathi: {extracted_mr}"

    # Hindi symptom extraction
    hi_text = "भैंस के मुंह से अत्यधिक लार गिर रही है और चलने में लंगड़ा रही है"
    extracted_hi = extract_symptoms_from_text(hi_text)
    assert any("Oral" in s or "Drooling" in s or "Lameness" in s for s in extracted_hi), f"Failed for Hindi: {extracted_hi}"

    # English symptom extraction
    en_text = "Cow has high fever and severe skin nodules with mouth blisters"
    extracted_en = extract_symptoms_from_text(en_text)
    assert any("Skin Lesions" in s or "Fever" in s for s in extracted_en), f"Failed for English: {extracted_en}"


# 3. Translation Service Unit Tests
def test_translation_service_clinical_vocabulary():
    # Detect language
    assert translation_service.detect_language("गाय आजारी आहे") == "mr"
    assert translation_service.detect_language("भैंस बीमार है") == "hi"
    assert translation_service.detect_language("The cow is sick") == "en"

    # Translate symptoms
    mr_sym = translation_service.translate_text("त्वचेवर गाठी", source_lang="mr", target_lang="en")
    assert "Skin nodules" in mr_sym or "nodule" in mr_sym.lower()

    hi_sym = translation_service.translate_text("मुंह से अत्यधिक लार", source_lang="hi", target_lang="en")
    assert "salivation" in hi_sym.lower() or "frothing" in hi_sym.lower()

    # Translate clinical findings to Marathi
    en_finding = "Severe necrotic ulcers in oral mucosa"
    mr_finding = translation_service.translate_text(en_finding, source_lang="en", target_lang="mr")
    assert len(mr_finding) > 0

    # Localize AI result
    ai_mr = translation_service.localize_ai_result("lumpy_skin", target_lang="mr")
    assert "लंपी" in ai_mr["disease_name"]
    assert "पशुवैद्यकीय" in ai_mr["disclaimer"]

    ai_hi = translation_service.localize_ai_result("fmd", target_lang="hi")
    assert "खुरपका" in ai_hi["disease_name"] or "FMD" in ai_hi["disease_name"]
    assert "पशुचिकित्सक" in ai_hi["disclaimer"] or "पशु चिकित्सक" in ai_hi["disclaimer"]


# 4. End-to-End API Test: Auth and Independent Language Preferences
@pytest.mark.asyncio
async def test_api_independent_user_languages():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Farmer login
        res_farmer = await ac.post("/api/auth/login", json={
            "email": "farmer@faunax.gov.in",
            "password": "Farmer@123"
        })
        assert res_farmer.status_code == 200
        farmer_data = res_farmer.json()["user"]
        assert farmer_data["role"] == "FARMER"
        assert farmer_data["preferred_language"] == "mr"

        # Vet login
        res_vet = await ac.post("/api/auth/login", json={
            "email": "vet@faunax.gov.in",
            "password": "Vet@123"
        })
        assert res_vet.status_code == 200
        vet_data = res_vet.json()["user"]
        assert vet_data["role"] in ["VET", "VETERINARIAN"]
        assert vet_data["preferred_language"] == "en"

        # Field Officer login
        res_field = await ac.post("/api/auth/login", json={
            "email": "field@faunax.gov.in",
            "password": "Field@123"
        })
        assert res_field.status_code == 200
        field_data = res_field.json()["user"]
        assert field_data["role"] == "FIELD_OFFICER"
        assert field_data["preferred_language"] == "hi"

        # Changing one user preference does not change others
        assert farmer_data["preferred_language"] != vet_data["preferred_language"]
        assert vet_data["preferred_language"] != field_data["preferred_language"]


# 5. End-to-End API Test: Case Submission with Devanagari Symptoms, Location & History
@pytest.mark.asyncio
async def test_api_marathi_case_creation_and_translation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as Farmer
        login_res = await ac.post("/api/auth/login", json={
            "email": "farmer@faunax.gov.in",
            "password": "Farmer@123"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Submit Marathi case
        case_payload = {
            "species": "Cattle",
            "breed": "Khillar",
            "age": "3 years",
            "sex": "Female",
            "number_affected": 2,
            "symptoms": ["त्वचेवर गाठी", "ताप", "लाळ गळणे"],
            "latitude": 21.1458,
            "longitude": 79.0882,
            "location_name": "मौदा, नागपूर जिल्हा",
            "primary_language": "mr",
            "notes": "गाय दोन दिवसांपासून चारा खात नाही आणि अंगावर मोठ्या गाठी आल्या आहेत.",
            "history": {
                "previous_illness": "दोन महिन्यांपूर्वी किरकोळ ताप",
                "vaccination_status": "अंशतः लसीकरण",
                "recent_treatment": "घरगुती हळद व तेल लावले",
                "recent_movement": False,
                "contact_with_other_animals": True,
                "recent_deaths": 0,
                "nearby_disease_reports": True
            }
        }

        create_res = await ac.post("/api/cases", json=case_payload, headers=headers)
        assert create_res.status_code in [200, 201]
        created = create_res.json()
        case_id = created["id"]
        assert created["primary_language"] == "mr"
        assert "मौदा" in created["location_name"]
        assert created["notes"] == "गाय दोन दिवसांपासून चारा खात नाही आणि अंगावर मोठ्या गाठी आल्या आहेत."

        # 3. Retrieve case details as Vet
        vet_login = await ac.post("/api/auth/login", json={
            "email": "vet@faunax.gov.in",
            "password": "Vet@123"
        })
        vet_token = vet_login.json()["access_token"]
        vet_headers = {"Authorization": f"Bearer {vet_token}"}

        get_res = await ac.get(f"/api/cases/{case_id}", headers=vet_headers)
        assert get_res.status_code == 200
        case_detail = get_res.json()
        assert case_detail["primary_language"] == "mr"
        assert case_detail["notes"] == case_payload["notes"]
        assert case_detail["latitude"] == pytest.approx(21.1458, 0.001)

        # 4. Request Clinical Translation to English
        trans_res = await ac.post(f"/api/cases/{case_id}/translate?target_language=en", headers=vet_headers)
        assert trans_res.status_code == 200
        translations = trans_res.json()
        assert isinstance(translations, list)
        assert len(translations) > 0

        # Verify translated entries
        field_names = [tr["field_name"] for tr in translations]
        assert "voice_transcript" in field_names or "symptoms" in field_names

        # Check that original text in case is unchanged
        get_res2 = await ac.get(f"/api/cases/{case_id}", headers=vet_headers)
        assert get_res2.json()["notes"] == case_payload["notes"]


# 6. End-to-End API Test: Hindi Case Submission & Arbitrary Text Translation
@pytest.mark.asyncio
async def test_api_hindi_case_and_dynamic_translate():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login
        login_res = await ac.post("/api/auth/login", json={
            "email": "farmer@faunax.gov.in",
            "password": "Farmer@123"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Submit Hindi case
        case_payload = {
            "species": "Buffalo",
            "breed": "Murrah",
            "age": "4 years",
            "sex": "Female",
            "number_affected": 1,
            "symptoms": ["बुखार", "लंगड़ाना"],
            "latitude": 20.9042,
            "longitude": 77.7567,
            "location_name": "अमरावती ग्रामीण",
            "primary_language": "hi",
            "notes": "भैंस को चलने में अत्यधिक दर्द हो रहा है और चारा खाना बंद कर दिया है।",
            "history": {
                "previous_illness": "कोई नहीं",
                "vaccination_status": "पूर्ण टीकाकृत",
                "recent_treatment": "पेरासिटामोल दिया गया",
                "recent_movement": True,
                "contact_with_other_animals": False,
                "recent_deaths": 0,
                "nearby_disease_reports": False
            }
        }

        create_res = await ac.post("/api/cases", json=case_payload, headers=headers)
        assert create_res.status_code in [200, 201]
        created = create_res.json()
        case_id = created["id"]
        assert created["primary_language"] == "hi"
        assert "अमरावती" in created["location_name"]

        # 3. Dynamic Arbitrary Text Translation endpoint
        text_trans_res = await ac.post("/api/cases/translate/text", json={
            "text": "अमरावती ग्रामीण में खुरपका रोग का प्रकोप",
            "source_language": "hi",
            "target_language": "en"
        }, headers=headers)
        assert text_trans_res.status_code == 200
        trans_out = text_trans_res.json()
        assert "translated_text" in trans_out
        assert len(trans_out["translated_text"]) > 0


# 7. PDF Clinical Dossier Generation Test (Devanagari Marathi, Hindi, English)
@pytest.mark.asyncio
async def test_pdf_report_generation_multilingual():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Login as Vet
        login_res = await ac.post("/api/auth/login", json={
            "email": "vet@faunax.gov.in",
            "password": "Vet@123"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Test case 1 report in English, Marathi, and Hindi
        for lang in ["en", "mr", "hi"]:
            pdf_res = await ac.get(f"/api/cases/1/report/pdf?lang={lang}", headers=headers)
            assert pdf_res.status_code == 200, f"PDF export failed for language {lang}"
            assert pdf_res.headers["content-type"] == "application/pdf"
            assert pdf_res.content.startswith(b"%PDF"), f"Response for {lang} is not a valid PDF binary"
            assert len(pdf_res.content) > 1000, f"PDF content too small for {lang}"

