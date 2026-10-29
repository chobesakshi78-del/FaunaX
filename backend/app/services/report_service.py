"""
FAUNA-X: Localized Clinical & Syndromic Report Generation Engine
Generates official, print-ready PDF reports with embedded Unicode Devanagari fonts (Noto Sans Devanagari)
in Marathi (मराठी), Hindi (हिंदी), and English.
Complies with SIH26128 biosecurity standards, clinical audit trails, and data integrity rules.
"""
import io
import os
from datetime import datetime
from typing import Dict, Any, Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Ensure Devanagari fonts are registered
FONT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "fonts")
REGULAR_FONT = os.path.join(FONT_DIR, "NotoSansDevanagari-Regular.ttf")
BOLD_FONT = os.path.join(FONT_DIR, "NotoSansDevanagari-Bold.ttf")

if os.path.exists(REGULAR_FONT):
    try:
        pdfmetrics.registerFont(TTFont("NotoSansDevanagari", REGULAR_FONT))
        pdfmetrics.registerFont(TTFont("NotoSansDevanagari-Bold", BOLD_FONT))
        HAS_DEVANAGARI_FONT = True
    except Exception:
        HAS_DEVANAGARI_FONT = False
else:
    HAS_DEVANAGARI_FONT = False

REPORT_TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "en": {
        "govtHeader": "GOVERNMENT OF MAHARASHTRA / INDIA — LIVESTOCK HEALTH SURVEILLANCE NETWORK",
        "dossierTitle": "OFFICIAL LIVESTOCK CLINICAL HEALTH & SURVEILLANCE DOSSIER",
        "confidentialSubtitle": "CONFIDENTIAL EPIDEMIOLOGICAL RECORD FOR AUTHORIZED CLINICAL USE ONLY",
        "genDate": "Generated Date",
        "caseNumber": "Case Reference ID",
        "caseStatus": "Case Status",
        "priority": "Triage Priority",
        "riskTier": "Biosecurity Risk Tier",
        "sec1": "1. FARMER & INCIDENT LOCATION PROFILE",
        "farmerName": "Livestock Owner / Reporter",
        "phone": "Contact Phone",
        "location": "Incident Location",
        "coordinates": "GPS Coordinates",
        "herdSize": "Total Animals in Herd",
        "sec2": "2. ANIMAL IDENTIFICATION & DEMOGRAPHICS",
        "tagNumber": "Ear Tag / ID Number",
        "species": "Species",
        "breed": "Breed",
        "ageSex": "Age / Sex",
        "affectedCount": "Affected Animals",
        "sec3": "3. CLINICAL SYMPTOMS & VERBATIM STATEMENTS",
        "symptomsRecorded": "Recorded Clinical Signs",
        "farmerVerbatim": "Farmer Original Statement (Verbatim)",
        "statementLang": "Source Statement Language",
        "translatedView": "Clinical English Translation",
        "sec4": "4. EPIDEMIOLOGICAL HISTORY & BIOSECURITY AUDIT",
        "vaccination": "Vaccination Status",
        "prevIllness": "Previous Illness History",
        "recentTreatment": "Recent Treatments / Medication",
        "recentMovement": "Animal Movement (Last 30 Days)",
        "sharedGrazing": "Shared Pasture / Water Source",
        "herdDeaths": "Recent Herd Mortality (Last 30 Days)",
        "sec5": "5. AUTOMATED VISION AI SCREENING ASSESSMENT",
        "aiModel": "Edge Vision Model",
        "finding": "Preliminary Visual Indicator",
        "confidence": "Model Confidence Score",
        "indicators": "Detected Visual Lesions",
        "aiNotice": "AI SCREENING NOTICE: Machine learning outputs are preliminary syndromic indicators and DO NOT constitute a definitive veterinary diagnosis. Clinical physical verification is mandatory.",
        "sec6": "6. OFFICIAL VETERINARY VERIFICATION & DIRECTIVES",
        "vetOfficer": "Licensed Veterinary Officer",
        "verifiedDiag": "Official Clinical Diagnosis",
        "severity": "Severity Level",
        "findings": "Physical Examination Findings",
        "prescribedTreatment": "Prescribed Treatment & Care Directives",
        "containmentMandate": "Quarantine / Biosecurity Directive",
        "labSample": "Diagnostic Laboratory Sample Requisition",
        "sec7": "7. FIELD OFFICER INSPECTION & CONTAINMENT AUDIT",
        "fieldOfficer": "Assigned Field Officer",
        "visitStatus": "Inspection Status",
        "observations": "On-Ground Field Observations",
        "outcome": "Field Action Outcome",
        "containmentCompliance": "Containment Protocol Compliance",
        "sec8": "8. LEGAL DISCLAIMER & OFFICIAL SIGN-OFF",
        "disclaimer": "This document is an official syndromic record issued under the National Livestock Health Framework. All prescription items must be verified against physical veterinary directives.",
        "vetSig": "Veterinary Medical Officer Signature & Seal",
        "fieldSig": "Field Inspector Signature",
        "farmerSig": "Farmer / Reporter Acknowledgement",
        "noneRecorded": "None Recorded / Not Available",
        "pending": "Pending Verification",
        "yes": "Yes",
        "no": "No",
        "months": "months",
        "standardSupportive": "Standard supportive care protocol prescribed."
    },
    "mr": {
        "govtHeader": "महाराष्ट्र शासन / भारत सरकार — पशुसंवर्धन व रोग नियंत्रण विभाग",
        "dossierTitle": "पशु आरोग्य, रोगनिदान व संसर्ग नियंत्रण अधिकृत अहवाल",
        "confidentialSubtitle": "अधिकृत वापरासाठी गोपनीय रोगनियंत्रण व पशुवैद्यकीय दस्तऐवज",
        "genDate": "अहवाल निर्मिती दिनांक",
        "caseNumber": "केस संदर्भ क्रमांक",
        "caseStatus": "सद्यस्थिती",
        "priority": "प्राधान्यता पातळी",
        "riskTier": "जैवसुरक्षा जोखीम वर्ग",
        "sec1": "१. पशुपालक व घटनास्थळ तपशील",
        "farmerName": "पशुपालक / तक्रारदार नाव",
        "phone": "संपर्क दूरध्वनी क्रमांक",
        "location": "घटनास्थळ (गाव व जिल्हा)",
        "coordinates": "GPS अक्षांश-रेखांश",
        "herdSize": "कळपातील एकूण पशुधन",
        "sec2": "२. जनावराचा प्रकार व ओळख",
        "tagNumber": "कानाचा बिल्ला / ओळख क्रमांक (टॅग)",
        "species": "जनावराचा प्रकार",
        "breed": "जात / पैदास",
        "ageSex": "वय / लिंग",
        "affectedCount": "बाधित जनावरांची संख्या",
        "sec3": "३. दिसणारी लक्षणे व मूळ शेतकरी तक्रार",
        "symptomsRecorded": "नोंदवलेली वैद्यकीय लक्षणे",
        "farmerVerbatim": "शेतकऱ्याचे मूळ विधान (जसेच्या तसे)",
        "statementLang": "मूळ विधानाची भाषा",
        "translatedView": "वैद्यकीय भाषांतरित प्रत",
        "sec4": "४. रोगप्रसार इतिहास व जैवसुरक्षा आढावा",
        "vaccination": "लसीकरण स्थिती",
        "prevIllness": "मागील आजारांचा इतिहास",
        "recentTreatment": "अलिकडे दिलेले औषधोपचार",
        "recentMovement": "जनावरांची अलिकडील वाहतूक (३० दिवस)",
        "sharedGrazing": "इतर कळपांसोबत एकत्र चराई",
        "herdDeaths": "कळपात मागील ३० दिवसांत झालेले मृत्यू",
        "sec5": "५. संगणकीय दृष्टी (AI) प्राथमिक तपासणी निष्कर्ष",
        "aiModel": "AI संगणकीय दृष्टी मॉडेल",
        "finding": "स्क्रीनिंग दृश्य निष्कर्ष",
        "confidence": "खात्री टक्केवारी",
        "indicators": "आढळलेली दृश्य लक्षणे",
        "aiNotice": "AI प्राथमिक तपासणी सूचना: हा निकाल सहाय्यक मार्गदर्शनासाठी आहे. प्रत्यक्ष पशुवैद्यकीय वैद्यकीय पडताळणी अनिवार्य आहे.",
        "sec6": "६. अधिकृत पशुवैद्यकीय तपासणी व उपचार आदेश",
        "vetOfficer": "तपासणी अधिकारी (नोंदणीकृत पशुवैद्यक)",
        "verifiedDiag": "प्रमाणित अधिकृत रोगनिदान",
        "severity": "तीव्रता पातळी",
        "findings": "प्रत्यक्ष वैद्यकीय तपासणी नोंदी",
        "prescribedTreatment": "विहित औषधोपचार व काळजीच्या सूचना",
        "containmentMandate": "विलगीकरण (क्वारंटीन) आदेश",
        "labSample": "प्रयोगशाळा चाचणी नमुना नोंद",
        "sec7": "७. क्षेत्र अधिकारी पाहणी व विलगीकरण पडताळणी",
        "fieldOfficer": "नियुक्त क्षेत्र अधिकारी",
        "visitStatus": "तपासणी स्थिती",
        "observations": "क्षेत्रीय पाहणीतील निरीक्षणे",
        "outcome": "पाहणीचा निकाल व कार्यवाही",
        "containmentCompliance": "विलगीकरण नियमांचे पालन",
        "sec8": "८. कायदेशीर सूचना व अधिकृत स्वाक्षरी",
        "disclaimer": "हा अहवाल राष्ट्रीय पशु आरोग्य पाळत ठेवणे प्रणाली अंतर्गत अधिकृत दस्तऐवज आहे. सर्व औषधांचा वापर नोंदणीकृत पशुवैद्यकाच्या मार्गदर्शनानुसार करावा.",
        "vetSig": "पशुवैद्यकीय अधिकाऱ्याची स्वाक्षरी व शिक्का",
        "fieldSig": "क्षेत्र अधिकारी स्वाक्षरी",
        "farmerSig": "पशुपालक / तक्रारदार स्वाक्षरी",
        "noneRecorded": "नोंद उपलब्ध नाही / लागू नाही",
        "pending": "पडताळणी प्रलंबित",
        "yes": "होय",
        "no": "नाही",
        "months": "महिने",
        "standardSupportive": "विहित प्रमाणभूत पूरक काळजी उपचार पद्धती."
    },
    "hi": {
        "govtHeader": "महाराष्ट्र शासन / भारत सरकार — पशुपालन एवं रोग निगरानी विभाग",
        "dossierTitle": "पशु स्वास्थ्य, रोग निदान एवं निगरानी आधिकारिक रिपोर्ट",
        "confidentialSubtitle": "अधिकृत उपयोग हेतु गोपनीय महामारी विज्ञान रिकॉर्ड",
        "genDate": "रिपोर्ट निर्माण दिनांक",
        "caseNumber": "केस संदर्भ संख्या",
        "caseStatus": "वर्तमान स्थिति",
        "priority": "प्राथमिकता स्तर",
        "riskTier": "जैव सुरक्षा जोखिम श्रेणी",
        "sec1": "१. पशुपालक एवं घटना स्थल विवरण",
        "farmerName": "पशुपालक / सूचनाकर्ता का नाम",
        "phone": "संपर्क दूरभाष संख्या",
        "location": "घटना स्थल (गांव एवं ज़िला)",
        "coordinates": "GPS निर्देशांक",
        "herdSize": "झुंड में कुल पशु",
        "sec2": "२. पशु जनसांख्यिकी एवं पहचान",
        "tagNumber": "कान का टैग / पहचान संख्या",
        "species": "पशु की प्रजाति",
        "breed": "नस्ल",
        "ageSex": "आयु / लिंग",
        "affectedCount": "प्रभावित पशुओं की संख्या",
        "sec3": "३. देखे गए लक्षण एवं मूल कथन",
        "symptomsRecorded": "दर्ज किए गए नैदानिक लक्षण",
        "farmerVerbatim": "किसान का मूल बयान (ज्यों का त्यों)",
        "statementLang": "मूल कथन की भाषा",
        "translatedView": "चिकित्सीय अनुवादित प्रति",
        "sec4": "४. महामारी इतिहास एवं जैव सुरक्षा ऑडिट",
        "vaccination": "टीकाकरण स्थिति",
        "prevIllness": "पिछली बीमारी का इतिहास",
        "recentTreatment": "हालिया दिए गए उपचार एवं दवाएं",
        "recentMovement": "पशुओं का आवागमन (पिछले ३० दिन)",
        "sharedGrazing": "सांझा चराई क्षेत्र",
        "herdDeaths": "झुंड में हालिया मौतें (पिछले ३० दिन)",
        "sec5": "५. स्वचालित विज़न AI प्राथमिक जांच निष्कर्ष",
        "aiModel": "AI विज़न मॉडल",
        "finding": "स्क्रीनिंग निष्कर्ष",
        "confidence": "विश्वसनीयता प्रतिशत",
        "indicators": "पहचाने गए दृश्य लक्षण",
        "aiNotice": "AI जांच सूचना: यह परिणाम प्रारंभिक सहायता हेतु है। भौतिक पशुचिकित्सक सत्यापन अनिवार्य है।",
        "sec6": "६. आधिकारिक पशुचिकित्सकीय सत्यापन एवं निर्देश",
        "vetOfficer": "अधिकृत पशुचिकित्सक",
        "verifiedDiag": "आधिकारिक सत्यापित रोग निदान",
        "severity": "गंभीरता स्तर",
        "findings": "चिकित्सीय भौतिक परीक्षण निष्कर्ष",
        "prescribedTreatment": "निर्धारित उपचार एवं दवाइयों के निर्देश",
        "containmentMandate": "क्वारंटीन (संगरोध) आदेश",
        "labSample": "प्रयोगशाला नमूना संग्रह",
        "sec7": "७. फील्ड ऑफिसर निरीक्षण एवं क्वारंटीन ऑडिट",
        "fieldOfficer": "नियुक्त फील्ड ऑफिसर",
        "visitStatus": "निरीक्षण स्थिति",
        "observations": "क्षेत्रीय अवलोकन",
        "outcome": "निरीक्षण परिणाम एवं कार्यवाही",
        "containmentCompliance": "क्वारंटीन अनुपालन स्थिति",
        "sec8": "८. कानूनी अस्वीकरण एवं हस्ताक्षर",
        "disclaimer": "यह दस्तावेज़ राष्ट्रीय पशु स्वास्थ्य निगरानी प्रणाली के तहत जारी आधिकारिक रिकॉर्ड है। सभी दवाओं का उपयोग पंजीकृत पशुचिकित्सक की देखरेख में करें।",
        "vetSig": "पशुचिकित्सक के हस्ताक्षर एवं मुहर",
        "fieldSig": "फील्ड ऑफिसर हस्ताक्षर",
        "farmerSig": "पशुपालक पावती हस्ताक्षर",
        "noneRecorded": "कोई रिकॉर्ड उपलब्ध नहीं / लागू नहीं",
        "pending": "सत्यापन लंबित",
        "yes": "हाँ",
        "no": "नहीं",
        "months": "महीने",
        "standardSupportive": "निर्धारित मानक सहायक देखभाल उपचार पद्धति।"
    }
}

# Value dictionaries for clean localization
LOCALIZED_VALUES = {
    "mr": {
        "Cattle": "गाय / गोवंश",
        "Buffalo": "म्हैस",
        "Goat": "शेळी",
        "Sheep": "मेंढी",
        "Female": "मादी",
        "Male": "नर",
        "SUBMITTED": "नोंदणीकृत (सबमिट केलेले)",
        "AI_SCREENING": "AI तपासणी सुरू",
        "VETERINARY_REVIEW": "पशुवैद्यकीय पुनरावलोकन",
        "VERIFIED": "प्रमाणित (सत्यापित)",
        "REJECTED": "नाकारले (तपासणीत असत्य)",
        "RESPONSE_ACTIVE": "सक्रिय प्रतिसाद / पाहणी",
        "FOLLOW_UP": "पुढील पाठपुरावा",
        "RESOLVED": "पूर्ण बरे झाले (निवारण)",
        "CLOSED": "बंद",
        "ROUTINE": "नियमित",
        "MEDIUM": "मध्यम",
        "HIGH": "उच्च",
        "CRITICAL": "अतितातडीचे / गंभीर",
        "LOW": "कमी",
        "COMPLETED": "पूर्ण झाले",
        "SCHEDULED": "नियोजित",
        "IN_PROGRESS": "सुरू आहे",
        "CANCELLED": "रद्द"
    },
    "hi": {
        "Cattle": "गाय / गोवंश",
        "Buffalo": "भैंस",
        "Goat": "बकरी",
        "Sheep": "भेड़",
        "Female": "मादा",
        "Male": "नर",
        "SUBMITTED": "दर्ज (सबमिट किया गया)",
        "AI_SCREENING": "AI जांच जारी",
        "VETERINARY_REVIEW": "पशुचिकित्सक समीक्षा",
        "VERIFIED": "सत्यापित",
        "REJECTED": "अस्वीकृत",
        "RESPONSE_ACTIVE": "सक्रिय प्रतिक्रिया / निरीक्षण",
        "FOLLOW_UP": "अनुवर्ती कार्यवाही",
        "RESOLVED": "पूर्णतः स्वस्थ (हल किया गया)",
        "CLOSED": "बंद",
        "ROUTINE": "सामान्य",
        "MEDIUM": "मध्यम",
        "HIGH": "उच्च",
        "CRITICAL": "अतिगंभीर / आपातकालीन",
        "LOW": "निम्न",
        "COMPLETED": "पूर्ण हुआ",
        "SCHEDULED": "अनुसूचित",
        "IN_PROGRESS": "प्रगति पर",
        "CANCELLED": "रद्द"
    }
}

def translate_val(val: Any, lang: str) -> str:
    if val is None:
        return ""
    str_val = str(val).strip()
    if lang in LOCALIZED_VALUES and str_val in LOCALIZED_VALUES[lang]:
        return LOCALIZED_VALUES[lang][str_val]
    return str_val


def generate_case_pdf_report(case_obj: Any, target_lang: str = "en") -> bytes:
    """
    Builds an official PDF dossier for a Case using ReportLab.
    Embeds Noto Sans Devanagari font for Marathi and Hindi text.
    Returns bytes of the compiled PDF.
    """
    lang = target_lang.lower().strip()
    if lang not in REPORT_TRANSLATIONS:
        lang = "en"

    S = REPORT_TRANSLATIONS[lang]
    font_name = "NotoSansDevanagari" if (HAS_DEVANAGARI_FONT and lang in ["mr", "hi"]) else "Helvetica"
    bold_font_name = "NotoSansDevanagari-Bold" if (HAS_DEVANAGARI_FONT and lang in ["mr", "hi"]) else "Helvetica-Bold"

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    header_govt_style = ParagraphStyle(
        "GovtHeader",
        fontName=bold_font_name,
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0284c7"),
        alignment=1
    )
    title_style = ParagraphStyle(
        "DocTitle",
        fontName=bold_font_name,
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#0f233d"),
        alignment=1
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        fontName=font_name,
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#64748b"),
        alignment=1
    )
    section_head_style = ParagraphStyle(
        "SectionHead",
        fontName=bold_font_name,
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#0369a1")
    )
    cell_label_style = ParagraphStyle(
        "CellLabel",
        fontName=bold_font_name,
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#475569")
    )
    cell_val_style = ParagraphStyle(
        "CellVal",
        fontName=font_name,
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a")
    )
    cell_val_bold = ParagraphStyle(
        "CellValBold",
        fontName=bold_font_name,
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a")
    )
    notice_style = ParagraphStyle(
        "NoticeText",
        fontName=font_name,
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#92400e")
    )
    disclaimer_style = ParagraphStyle(
        "DisclaimerText",
        fontName=font_name,
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor("#475569")
    )
    sig_style = ParagraphStyle(
        "SigText",
        fontName=bold_font_name,
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#1e293b"),
        alignment=1
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph(S["govtHeader"], header_govt_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(S["dossierTitle"], title_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph(S["confidentialSubtitle"], subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=8))

    # 2. Metadata Bar Table
    created_dt = case_obj.created_at.strftime("%d %B %Y, %H:%M UTC") if case_obj.created_at else datetime.utcnow().strftime("%d %B %Y")
    status_str = translate_val(case_obj.status.value if hasattr(case_obj.status, 'value') else case_obj.status, lang)
    priority_str = translate_val(case_obj.ai_triage_priority, lang)
    risk_str = translate_val(case_obj.ai_risk_tier, lang)

    meta_table_data = [
        [
            Paragraph(f"<b>{S['caseNumber']}:</b> {case_obj.case_number}", cell_val_style),
            Paragraph(f"<b>{S['genDate']}:</b> {created_dt}", cell_val_style),
        ],
        [
            Paragraph(f"<b>{S['caseStatus']}:</b> {status_str}", cell_val_bold),
            Paragraph(f"<b>{S['priority']}:</b> {priority_str} | <b>{S['riskTier']}:</b> {risk_str}", cell_val_bold)
        ]
    ]
    t_meta = Table(meta_table_data, colWidths=[260, 260])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 8))

    # 3. Section 1: Farmer & Incident Location Profile
    story.append(Paragraph(S["sec1"], section_head_style))
    story.append(Spacer(1, 3))

    farmer_name = case_obj.farmer.full_name if (getattr(case_obj, 'farmer', None) and case_obj.farmer) else "Registered Farmer"
    phone_val = case_obj.farmer.phone if (getattr(case_obj, 'farmer', None) and case_obj.farmer and case_obj.farmer.phone) else "+91 98765 XXXXX"
    loc_val = f"{case_obj.village or 'Field'}, {case_obj.district or 'Maharashtra'}, {case_obj.state or 'India'}"
    coords_val = f"{case_obj.latitude:.4f}° N, {case_obj.longitude:.4f}° E" if (case_obj.latitude and case_obj.longitude) else S["noneRecorded"]
    herd_val = str(case_obj.animal.herd_size) if (getattr(case_obj, 'animal', None) and case_obj.animal) else str(case_obj.number_affected or 1)

    sec1_data = [
        [Paragraph(S["farmerName"], cell_label_style), Paragraph(farmer_name, cell_val_style),
         Paragraph(S["phone"], cell_label_style), Paragraph(phone_val, cell_val_style)],
        [Paragraph(S["location"], cell_label_style), Paragraph(loc_val, cell_val_style),
         Paragraph(S["coordinates"], cell_label_style), Paragraph(coords_val, cell_val_style)]
    ]
    t_sec1 = Table(sec1_data, colWidths=[100, 160, 100, 160])
    t_sec1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#ffffff")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_sec1)
    story.append(Spacer(1, 8))

    # 4. Section 2: Animal Identification & Demographics
    story.append(Paragraph(S["sec2"], section_head_style))
    story.append(Spacer(1, 3))

    tag_val = case_obj.animal.tag_number if (getattr(case_obj, 'animal', None) and case_obj.animal and case_obj.animal.tag_number) else S["noneRecorded"]
    species_val = translate_val(case_obj.species, lang)
    breed_val = case_obj.breed or S["noneRecorded"]
    age_str = f"{case_obj.age_months} {S['months']}" if case_obj.age_months else S["noneRecorded"]
    sex_str = translate_val(case_obj.sex or "Female", lang)
    affected_str = str(case_obj.number_affected or 1)

    sec2_data = [
        [Paragraph(S["tagNumber"], cell_label_style), Paragraph(tag_val, cell_val_style),
         Paragraph(S["species"], cell_label_style), Paragraph(species_val, cell_val_style)],
        [Paragraph(S["breed"], cell_label_style), Paragraph(breed_val, cell_val_style),
         Paragraph(S["ageSex"], cell_label_style), Paragraph(f"{age_str} / {sex_str}", cell_val_style)],
        [Paragraph(S["affectedCount"], cell_label_style), Paragraph(affected_str, cell_val_style),
         Paragraph(S["herdSize"], cell_label_style), Paragraph(herd_val, cell_val_style)]
    ]
    t_sec2 = Table(sec2_data, colWidths=[100, 160, 100, 160])
    t_sec2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#ffffff")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_sec2)
    story.append(Spacer(1, 8))

    # 5. Section 3: Symptoms & Verbatim Notes
    story.append(Paragraph(S["sec3"], section_head_style))
    story.append(Spacer(1, 3))

    symptoms_list = [s.symptom_name for s in case_obj.symptoms if s.symptom_name] if case_obj.symptoms else []
    symptoms_str = ", ".join(symptoms_list) if symptoms_list else S["noneRecorded"]
    
    # Check for translation of symptoms
    trans_symptoms = next((t.translated_text for t in case_obj.translations if t.field_name == "symptoms" and t.target_language == lang), None)
    if trans_symptoms:
        symptoms_str = f"{trans_symptoms} ({symptoms_str})" if lang != "en" else symptoms_str

    original_statement = case_obj.voice_transcript or S["noneRecorded"]
    orig_lang_label = (case_obj.primary_language or "en").upper()
    translated_statement = next((t.translated_text for t in case_obj.translations if t.field_name == "voice_transcript" and t.target_language == lang), None)

    sec3_data = [
        [Paragraph(S["symptomsRecorded"], cell_label_style), Paragraph(symptoms_str, cell_val_style)],
        [Paragraph(f"{S['farmerVerbatim']} [{orig_lang_label}]", cell_label_style), Paragraph(original_statement, cell_val_style)]
    ]
    if translated_statement and lang != (case_obj.primary_language or "en"):
        sec3_data.append([Paragraph(f"{S['translatedView']} [{lang.upper()}]", cell_label_style), Paragraph(translated_statement, cell_val_style)])

    t_sec3 = Table(sec3_data, colWidths=[140, 380])
    t_sec3.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#ffffff")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_sec3)
    story.append(Spacer(1, 8))

    # 6. Section 4: Epidemiological History
    story.append(Paragraph(S["sec4"], section_head_style))
    story.append(Spacer(1, 3))

    hist = case_obj.history_data or {}
    vac_val = hist.get("vaccination_status") or S["noneRecorded"]
    prev_illness = hist.get("previous_illness") or S["noneRecorded"]
    recent_tx = hist.get("recent_treatment") or S["noneRecorded"]
    movement_val = S["yes"] if hist.get("recent_movement") else S["no"]
    shared_pasture = S["yes"] if hist.get("shared_grazing") else S["no"]
    deaths_val = str(hist.get("herd_deaths", 0))

    sec4_data = [
        [Paragraph(S["vaccination"], cell_label_style), Paragraph(str(vac_val), cell_val_style),
         Paragraph(S["prevIllness"], cell_label_style), Paragraph(str(prev_illness), cell_val_style)],
        [Paragraph(S["recentTreatment"], cell_label_style), Paragraph(str(recent_tx), cell_val_style),
         Paragraph(S["recentMovement"], cell_label_style), Paragraph(movement_val, cell_val_style)],
        [Paragraph(S["sharedGrazing"], cell_label_style), Paragraph(shared_pasture, cell_val_style),
         Paragraph(S["herdDeaths"], cell_label_style), Paragraph(deaths_val, cell_val_style)]
    ]
    t_sec4 = Table(sec4_data, colWidths=[120, 140, 120, 140])
    t_sec4.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#ffffff")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_sec4)
    story.append(Spacer(1, 8))

    # 7. Section 5: Automated Vision AI Screening Assessment
    story.append(Paragraph(S["sec5"], section_head_style))
    story.append(Spacer(1, 3))

    ai_pred = case_obj.ai_predictions[0] if (case_obj.ai_predictions and len(case_obj.ai_predictions) > 0) else None
    if ai_pred:
        pred_name = ai_pred.display_name or ai_pred.prediction_class
        conf_str = f"{ai_pred.confidence * 100:.1f}%" if ai_pred.confidence else f"{ai_pred.percentage:.1f}%"
        model_str = f"{ai_pred.model_name} (v{ai_pred.model_version})"
    else:
        pred_name = S["pending"]
        conf_str = S["noneRecorded"]
        model_str = "FAUNA-X YOLO11n Edge Vision Suite"

    sec5_data = [
        [Paragraph(S["aiModel"], cell_label_style), Paragraph(model_str, cell_val_style),
         Paragraph(S["confidence"], cell_label_style), Paragraph(conf_str, cell_val_style)],
        [Paragraph(S["finding"], cell_label_style), Paragraph(pred_name, cell_val_bold),
         Paragraph(S["riskTier"], cell_label_style), Paragraph(risk_str, cell_val_bold)]
    ]
    t_sec5 = Table(sec5_data, colWidths=[100, 160, 100, 160])
    t_sec5.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_sec5)
    story.append(Spacer(1, 3))
    # Disclaimer box
    t_notice = Table([[Paragraph(S["aiNotice"], notice_style)]], colWidths=[520])
    t_notice.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fffbeb")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#fde68a")),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_notice)
    story.append(Spacer(1, 8))

    # 8. Section 6: Official Veterinary Verification & Directives
    story.append(Paragraph(S["sec6"], section_head_style))
    story.append(Spacer(1, 3))

    verif = case_obj.verification
    if verif:
        vet_name = verif.veterinarian.full_name if (getattr(verif, 'veterinarian', None) and verif.veterinarian) else "Authorized Veterinary Officer"
        diag_val = verif.preliminary_diagnosis or S["pending"]
        sev_val = translate_val(verif.severity or "Moderate", lang)
        findings_val = verif.clinical_findings or S["noneRecorded"]
        tx_val = verif.treatment_prescribed or S["standardSupportive"]
        quarantine_val = S["yes"] if verif.containment_required else S["no"]
        sample_val = S["yes"] if verif.sample_required else S["no"]
    else:
        vet_name = S["pending"]
        diag_val = S["pending"]
        sev_val = S["pending"]
        findings_val = S["pending"]
        tx_val = S["pending"]
        quarantine_val = S["noneRecorded"]
        sample_val = S["noneRecorded"]

    sec6_data = [
        [Paragraph(S["vetOfficer"], cell_label_style), Paragraph(vet_name, cell_val_style),
         Paragraph(S["verifiedDiag"], cell_label_style), Paragraph(diag_val, cell_val_bold)],
        [Paragraph(S["severity"], cell_label_style), Paragraph(sev_val, cell_val_style),
         Paragraph(S["containmentMandate"], cell_label_style), Paragraph(quarantine_val, cell_val_style)],
        [Paragraph(S["findings"], cell_label_style), Paragraph(findings_val, cell_val_style),
         Paragraph(S["labSample"], cell_label_style), Paragraph(sample_val, cell_val_style)],
        [Paragraph(S["prescribedTreatment"], cell_label_style), Paragraph(tx_val, cell_val_bold),
         Paragraph("", cell_label_style), Paragraph("", cell_val_style)]
    ]
    t_sec6 = Table(sec6_data, colWidths=[120, 140, 120, 140])
    t_sec6.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#ffffff")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('SPAN', (1, 3), (3, 3))
    ]))
    story.append(t_sec6)
    story.append(Spacer(1, 8))

    # 9. Section 7: Field Officer Inspection & Containment Audit
    story.append(Paragraph(S["sec7"], section_head_style))
    story.append(Spacer(1, 3))

    fvisit = case_obj.field_visits[-1] if (case_obj.field_visits and len(case_obj.field_visits) > 0) else None
    if fvisit:
        inspector_name = fvisit.officer.full_name if (getattr(fvisit, 'officer', None) and fvisit.officer) else "Assigned Field Inspector"
        visit_st = translate_val(fvisit.visit_status, lang)
        obs_val = fvisit.observations or S["noneRecorded"]
        out_val = fvisit.outcome or S["noneRecorded"]
        cont_val = translate_val(fvisit.containment_status, lang)
    else:
        inspector_name = case_obj.assigned_officer.full_name if (getattr(case_obj, 'assigned_officer', None) and case_obj.assigned_officer) else S["pending"]
        visit_st = S["pending"]
        obs_val = S["noneRecorded"]
        out_val = S["noneRecorded"]
        cont_val = S["noneRecorded"]

    sec7_data = [
        [Paragraph(S["fieldOfficer"], cell_label_style), Paragraph(inspector_name, cell_val_style),
         Paragraph(S["visitStatus"], cell_label_style), Paragraph(visit_st, cell_val_style)],
        [Paragraph(S["observations"], cell_label_style), Paragraph(obs_val, cell_val_style),
         Paragraph(S["outcome"], cell_label_style), Paragraph(out_val, cell_val_style)],
        [Paragraph(S["containmentCompliance"], cell_label_style), Paragraph(cont_val, cell_val_style),
         Paragraph("", cell_label_style), Paragraph("", cell_val_style)]
    ]
    t_sec7 = Table(sec7_data, colWidths=[120, 140, 120, 140])
    t_sec7.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#ffffff")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('SPAN', (1, 2), (3, 2))
    ]))
    story.append(t_sec7)
    story.append(Spacer(1, 14))

    # 10. Legal Disclaimer & Signatures
    story.append(KeepTogether([
        Paragraph(S["disclaimer"], disclaimer_style),
        Spacer(1, 20),
        Table([
            [Paragraph(f"__________________________<br/>{S['vetSig']}", sig_style),
             Paragraph(f"__________________________<br/>{S['fieldSig']}", sig_style),
             Paragraph(f"__________________________<br/>{S['farmerSig']}", sig_style)]
        ], colWidths=[173, 173, 173])
    ]))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

report_service = generate_case_pdf_report
