import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Printer, 
  Download, 
  X, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  MapPin, 
  User, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Globe,
  Building
} from 'lucide-react';
import { Case } from '../../types';

interface CaseReportModalProps {
  caseData: Case;
  isOpen: boolean;
  onClose: () => void;
}

export const CaseReportModal: React.FC<CaseReportModalProps> = ({ caseData, isOpen, onClose }) => {
  const { t, i18n } = useTranslation();

  // Report-specific language selection (defaults to requesting user's active language)
  const [reportLang, setReportLang] = useState<'en' | 'mr' | 'hi'>(() => {
    const active = i18n.language;
    return active === 'mr' || active === 'hi' ? active : 'en';
  });

  if (!isOpen || !caseData) return null;

  // Localized report strings dictionary
  const STRINGS = {
    en: {
      govtHeader: "GOVERNMENT OF MAHARASHTRA / INDIA — LIVESTOCK HEALTH SURVEILLANCE NETWORK",
      reportTitle: "LIVESTOCK CLINICAL HEALTH & SURVEILLANCE DOSSIER",
      confidentialSubtitle: "CONFIDENTIAL EPIDEMIOLOGICAL RECORD FOR AUTHORIZED USE",
      genTime: "Generated on",
      caseNum: "Case Dossier ID",
      status: "Case Status",
      priority: "Triage Priority",
      riskTier: "Biosecurity Risk Tier",
      sec1: "1. Farmer & Incident Location Profile",
      farmerName: "Livestock Owner / Reporter",
      phone: "Contact Phone",
      location: "Incident Location",
      coordinates: "GPS Coordinates",
      herdSize: "Total Herd Size",
      sec2: "2. Animal Demographics & Identification",
      tagNum: "Ear Tag / ID Number",
      species: "Species",
      breed: "Breed",
      ageSex: "Age / Sex",
      affectedCount: "Number of Affected Animals",
      sec3: "3. Observed Symptoms & Verbatim Notes",
      symptomsRecorded: "Recorded Symptoms",
      farmerStatement: "Farmer Verbatim Statement",
      originalLang: "Original Statement Language",
      translatedView: "Clinical Translation",
      sec4: "4. Epidemiological Context & Field History",
      vaccination: "Vaccination Status",
      prevIllness: "Previous Illness History",
      recentTreatment: "Recent Treatments & Medicines",
      recentMovement: "Animal Movement (Last 30 Days)",
      sharedGrazing: "Shared Grazing with Other Herds",
      herdDeaths: "Recent Deaths in Herd (Last 30 Days)",
      sec5: "5. Automated Vision AI Screening Assessment",
      modelName: "Edge AI Model",
      finding: "Screening Indicator",
      confidence: "Confidence Score",
      indicators: "Detected Visual Signs",
      aiNotice: "AI Syndromic Notice: Visual screening is an auxiliary triaging indicator. Mandatory clinical verification required.",
      sec6: "6. Official Veterinary Verification & Directives",
      vetName: "Licensed Veterinary Officer",
      verifiedDiag: "Official Clinical Diagnosis",
      severity: "Severity Level",
      findings: "Clinical Examination Findings",
      treatment: "Prescribed Treatment & Medicine Regimen",
      quarantine: "Quarantine & Containment Mandate",
      labSample: "Diagnostic Lab Sample Collection",
      sec7: "7. Field Officer Inspection & Containment Audit",
      inspector: "Assigned Field Officer",
      visitStatus: "Inspection Status",
      observations: "Field Observations",
      outcome: "Inspection Outcome",
      containmentStatus: "Containment Compliance",
      sec8: "8. Legal Disclaimer & Official Sign-off",
      disclaimer: "This document is an official syndromic record issued under the National Livestock Health Framework. All prescription items must be verified against licensed veterinary directives.",
      vetSig: "Veterinary Officer Signature & Official Seal",
      officerSig: "Field Officer Signature",
      farmerSig: "Farmer / Reporter Acknowledgement",
      printBtn: "Print Official Report",
      downloadPdfBtn: "Download PDF Dossier",
      downloadHtmlBtn: "Export HTML File",
      closeBtn: "Close",
      yes: "Yes",
      no: "No",
      animalsUnit: "animal(s)",
      noneRecorded: "None Recorded / Pending"
    },
    mr: {
      govtHeader: "महाराष्ट्र शासन / भारत सरकार — पशुसंवर्धन व रोग नियंत्रण विभाग",
      reportTitle: "पशु आरोग्य, रोगनिदान व संसर्ग नियंत्रण अधिकृत अहवाल",
      confidentialSubtitle: "अधिकृत वापरासाठी गोपनीय रोगनियंत्रण व वैद्यकीय दस्तऐवज",
      genTime: "अहवाल निर्मिती दिनांक व वेळ",
      caseNum: "केस संदर्भ क्रमांक",
      status: "सद्यस्थिती",
      priority: "प्राधान्यता पातळी",
      riskTier: "जैवसुरक्षा जोखीम वर्ग",
      sec1: "१. शेतकरी व घटनास्थळ तपशील",
      farmerName: "पशुपालक / तक्रारदार नाव",
      phone: "संपर्क क्रमांक",
      location: "घटनास्थळ / गाव / जिल्हा",
      coordinates: "GPS अक्षांश-रेखांश",
      herdSize: "कळपातील एकूण पशुधन",
      sec2: "२. जनावराचा प्रकार व ओळख",
      tagNum: "कानाचा बिल्ला / ओळख क्रमांक (टॅग)",
      species: "जनावराचा प्रकार",
      breed: "जात / पैदास",
      ageSex: "वय / लिंग",
      affectedCount: "बाधित जनावरांची संख्या",
      sec3: "३. दिसणारी लक्षणे व मूळ शेतकरी विधान",
      symptomsRecorded: "नोंदवलेली लक्षणे",
      farmerStatement: "शेतकऱ्याचे मूळ विधान",
      originalLang: "मूळ विधानाची भाषा",
      translatedView: "वैद्यकीय भाषांतरित प्रत",
      sec4: "४. रोगप्रसार इतिहास व जोखीम घटक",
      vaccination: "लसीकरण स्थिती",
      prevIllness: "मागील आजार / इतिहास",
      recentTreatment: "अलिकडे दिलेले औषधोपचार",
      recentMovement: "जनावरांची अलिकडील वाहतूक (३० दिवस)",
      sharedGrazing: "इतर कळपांसोबत एकत्र चराई",
      herdDeaths: "कळपात मागील ३० दिवसांत झालेले मृत्यू",
      sec5: "५. संगणकीय दृष्टी (AI) प्राथमिक तपासणी अहवाल",
      modelName: "AI मॉडेल",
      finding: "स्क्रीनिंग निष्कर्ष",
      confidence: "खात्री टक्केवारी",
      indicators: "आढळलेली दृश्य लक्षणे",
      aiNotice: "AI प्राथमिक तपासणी सूचना: हा निकाल सहाय्यक मार्गदर्शनासाठी आहे. प्रत्यक्ष पशुवैद्यकीय पडताळणी अनिवार्य आहे.",
      sec6: "६. अधिकृत पशुवैद्यकीय तपासणी व उपचार आदेश",
      vetName: "तपासणी अधिकारी (पशुवैद्यक)",
      verifiedDiag: "प्रमाणित अधिकृत रोगनिदान",
      severity: "तीव्रता पातळी",
      findings: "वैद्यकीय प्रत्यक्ष तपासणी नोंदी",
      treatment: "विहित औषधोपचार व काळजीच्या सूचना",
      quarantine: "विलगीकरण (क्वारंटीन) आदेश",
      labSample: "प्रयोगशाळा चाचणी नमुना",
      sec7: "७. क्षेत्र अधिकारी पाहणी व विलगीकरण पडताळणी",
      inspector: "नियुक्त क्षेत्र अधिकारी",
      visitStatus: "तपासणी स्थिती",
      observations: "क्षेत्रीय पाहणीतील निरीक्षणे",
      outcome: "पाहणीचा निकाल व कार्यवाही",
      containmentStatus: "विलगीकरण नियमांचे पालन",
      sec8: "८. कायदेशीर सूचना व स्वाक्षरी",
      disclaimer: "हा अहवाल राष्ट्रीय पशु आरोग्य पाळत ठेवणे प्रणाली अंतर्गत अधिकृत दस्तऐवज आहे. सर्व औषधांचा वापर नोंदणीकृत पशुवैद्यकाच्या मार्गदर्शनानुसार करावा.",
      vetSig: "पशुवैद्यकीय अधिकाऱ्याची स्वाक्षरी व शिक्का",
      officerSig: "क्षेत्र अधिकारी स्वाक्षरी",
      farmerSig: "पशुपालक / तक्रारदार स्वाक्षरी",
      printBtn: "अहवाल मुद्रित करा (प्रिंट)",
      downloadPdfBtn: "अधिकृत PDF अहवाल डाउनलोड करा",
      downloadHtmlBtn: "HTML प्रत डाउनलोड करा",
      closeBtn: "बंद करा",
      yes: "होय",
      no: "नाही",
      animalsUnit: "जनावरे",
      noneRecorded: "नोंद उपलब्ध नाही / लागू नाही"
    },
    hi: {
      govtHeader: "महाराष्ट्र शासन / भारत सरकार — पशुपालन एवं रोग निगरानी विभाग",
      reportTitle: "पशु स्वास्थ्य, रोग निदान एवं निगरानी आधिकारिक रिपोर्ट",
      confidentialSubtitle: "अधिकृत उपयोग हेतु गोपनीय महामारी विज्ञान रिकॉर्ड",
      genTime: "रिपोर्ट निर्माण दिनांक एवं समय",
      caseNum: "केस संदर्भ संख्या",
      status: "वर्तमान स्थिति",
      priority: "प्राथमिकता स्तर",
      riskTier: "जैव सुरक्षा जोखिम श्रेणी",
      sec1: "१. पशुपालक एवं घटना स्थल विवरण",
      farmerName: "पशुपालक / सूचनाकर्ता",
      phone: "संपर्क फ़ोन नंबर",
      location: "घटना स्थल / गांव / ज़िला",
      coordinates: "GPS निर्देशांक",
      herdSize: "झुंड में कुल पशु",
      sec2: "२. पशु जनसांख्यिकी एवं पहचान",
      tagNum: "कान का टैग / पहचान संख्या",
      species: "पशु की प्रजाति",
      breed: "नस्ल",
      ageSex: "आयु / लिंग",
      affectedCount: "प्रभावित पशुओं की संख्या",
      sec3: "३. देखे गए लक्षण एवं मूल कथन",
      symptomsRecorded: "दर्ज किए गए लक्षण",
      farmerStatement: "किसान का मूल बयान",
      originalLang: "मूल कथन की भाषा",
      translatedView: "चिकित्सीय अनुवादित प्रति",
      sec4: "४. महामारी इतिहास एवं जोखिम कारक",
      vaccination: "टीकाकरण स्थिति",
      prevIllness: "पिछली बीमारी का इतिहास",
      recentTreatment: "हालिया दिए गए उपचार एवं दवाएं",
      recentMovement: "पशुओं का आवागमन (पिछले ३० दिन)",
      sharedGrazing: "सांझा चराई क्षेत्र",
      herdDeaths: "झुंड में हालिया मौतें (३० दिन)",
      sec5: "५. स्वचालित विज़न AI प्राथमिक जांच निष्कर्ष",
      modelName: "AI विज़न मॉडल",
      finding: "स्क्रीनिंग निष्कर्ष",
      confidence: "विश्वसनीयता प्रतिशत",
      indicators: "पहचाने गए दृश्य लक्षण",
      aiNotice: "AI जांच सूचना: यह परिणाम प्रारंभिक सहायता हेतु है। भौतिक पशुचिकित्सक सत्यापन अनिवार्य है।",
      sec6: "६. आधिकारिक पशुचिकित्सकीय सत्यापन एवं निर्देश",
      vetName: "अधिकृत पशुचिकित्सक",
      verifiedDiag: "आधिकारिक सत्यापित रोग निदान",
      severity: "गंभीरता स्तर",
      findings: "चिकित्सीय भौतिक परीक्षण निष्कर्ष",
      treatment: "निर्धारित उपचार एवं दवाइयों के निर्देश",
      quarantine: "क्वारंटीन (संगरोध) आदेश",
      labSample: "प्रयोगशाला नमूना संग्रह",
      sec7: "७. फील्ड ऑफिसर निरीक्षण एवं क्वारंटीन ऑडिट",
      inspector: "नियुक्त फील्ड ऑफिसर",
      visitStatus: "निरीक्षण स्थिति",
      observations: "क्षेत्रीय अवलोकन",
      outcome: "निरीक्षण परिणाम एवं कार्यवाही",
      containmentStatus: "क्वारंटीन अनुपालन स्थिति",
      sec8: "८. कानूनी अस्वीकरण एवं हस्ताक्षर",
      disclaimer: "यह दस्तावेज़ राष्ट्रीय पशु स्वास्थ्य निगरानी प्रणाली के तहत जारी आधिकारिक रिकॉर्ड है। सभी दवाओं का उपयोग पंजीकृत पशुचिकित्सक की देखरेख में करें।",
      vetSig: "पशुचिकित्सक के हस्ताक्षर एवं मुहर",
      officerSig: "फील्ड ऑफिसर हस्ताक्षर",
      farmerSig: "पशुपालक पावती हस्ताक्षर",
      printBtn: "आधिकारिक रिपोर्ट प्रिंट करें",
      downloadPdfBtn: "आधिकारिक PDF रिपोर्ट डाउनलोड करें",
      downloadHtmlBtn: "HTML प्रति डाउनलोड करें",
      closeBtn: "बंद करें",
      yes: "हाँ",
      no: "नहीं",
      animalsUnit: "पशु",
      noneRecorded: "कोई रिकॉर्ड उपलब्ध नहीं / लागू नहीं"
    }
  };

  const S = STRINGS[reportLang];

  const getLocalizedValue = (val: string | undefined | null) => {
    if (!val) return '';
    const map: Record<string, Record<string, string>> = {
      mr: {
        'Cattle': 'गाय / गोवंश',
        'Buffalo': 'म्हैस',
        'Goat': 'शेळी',
        'Sheep': 'मेंढी',
        'Female': 'मादी',
        'Male': 'नर',
        'SUBMITTED': 'नोंदणीकृत',
        'AI_SCREENING': 'AI तपासणी',
        'VETERINARY_REVIEW': 'पशुवैद्यकीय पुनरावलोकन',
        'VERIFIED': 'प्रमाणित (सत्यापित)',
        'REJECTED': 'नाकारले',
        'RESPONSE_ACTIVE': 'सक्रिय पाहणी',
        'FOLLOW_UP': 'पाठपुरावा',
        'RESOLVED': 'पूर्ण बरे झाले',
        'CLOSED': 'बंद',
        'ROUTINE': 'नियमित',
        'MEDIUM': 'मध्यम',
        'HIGH': 'उच्च',
        'CRITICAL': 'अतितातडीचे / गंभीर',
        'LOW': 'कमी'
      },
      hi: {
        'Cattle': 'गाय / गोवंश',
        'Buffalo': 'भैंस',
        'Goat': 'बकरी',
        'Sheep': 'भेड़',
        'Female': 'मादा',
        'Male': 'नर',
        'SUBMITTED': 'दर्ज किया गया',
        'AI_SCREENING': 'AI जांच',
        'VETERINARY_REVIEW': 'पशुचिकित्सक समीक्षा',
        'VERIFIED': 'सत्यापित',
        'REJECTED': 'अस्वीकृत',
        'RESPONSE_ACTIVE': 'सक्रिय निरीक्षण',
        'FOLLOW_UP': 'अनुवर्ती कार्यवाही',
        'RESOLVED': 'हल किया गया',
        'CLOSED': 'बंद',
        'ROUTINE': 'सामान्य',
        'MEDIUM': 'मध्यम',
        'HIGH': 'उच्च',
        'CRITICAL': 'अतिगंभीर',
        'LOW': 'निम्न'
      }
    };
    if (reportLang in map && val in map[reportLang]) {
      return map[reportLang][val];
    }
    return val;
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Primary prediction and image
  const primaryPrediction = caseData.ai_predictions?.[0] || (caseData as any).predictions?.[0];
  const primaryImage = caseData.images?.[0];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cases/${caseData.id}/report/pdf?lang=${reportLang}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error('PDF download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FaunaX_Report_${caseData.case_number}_${reportLang.toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      // Fallback to HTML export
      handleDownloadHtml();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadHtml = () => {
    const reportElement = document.getElementById('printable-clinical-report');
    if (!reportElement) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="${reportLang}">
<head>
  <meta charset="UTF-8">
  <title>${S.reportTitle} - ${caseData.case_number}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=Noto+Sans+Devanagari:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Noto Sans Devanagari', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 32px;
      line-height: 1.5;
    }
    .header-bar { border-bottom: 3px double #0284c7; padding-bottom: 12px; margin-bottom: 24px; text-align: center; }
    .govt { font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 1px; }
    h1 { font-size: 20px; font-weight: 900; color: #0f172a; margin: 4px 0; }
    .sub { font-size: 10px; color: #64748b; font-weight: 600; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
    .meta-table td, .meta-table th { border: 1px solid #cbd5e1; padding: 6px 10px; }
    .meta-table th { background: #f8fafc; text-align: left; color: #475569; }
    .section-title { font-size: 13px; font-weight: 800; color: #0369a1; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 4px; margin-top: 18px; margin-bottom: 10px; }
    .data-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 11px; margin-bottom: 14px; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
    .box-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .box-val { font-size: 12px; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .alert-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px; font-size: 10px; color: #92400e; margin-top: 14px; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 48px; text-align: center; font-size: 10px; }
    .sig-line { border-top: 1px dashed #94a3b8; padding-top: 6px; font-weight: 700; color: #334155; }
    @media print {
      body { padding: 0; }
      @page { size: A4; margin: 15mm; }
    }
  </style>
</head>
<body>
  ${reportElement.innerHTML}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FaunaX_Report_${caseData.case_number}_${reportLang.toUpperCase()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Find translation notes if available
  const getTranslatedNote = (fieldName: string) => {
    if (!caseData.translations) return null;
    const match = caseData.translations.find(t => t.field_name === fieldName && t.target_language === reportLang);
    return match ? match.translated_text : null;
  };

  const translatedNotes = getTranslatedNote('voice_transcript');
  const translatedSymptoms = getTranslatedNote('symptoms');
  const translatedTreatment = getTranslatedNote('treatment_prescribed');
  const translatedFindings = getTranslatedNote('clinical_findings');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Controls Header (Screen Only) */}
        <div className="print:hidden p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="font-extrabold text-sm sm:text-base text-navy-950">
              {S.reportTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Report Language Selector */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-blue-600 ml-1.5" />
              <button
                type="button"
                onClick={() => setReportLang('mr')}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  reportLang === 'mr'
                    ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                मराठी (mr)
              </button>
              <button
                type="button"
                onClick={() => setReportLang('hi')}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  reportLang === 'hi'
                    ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिंदी (hi)
              </button>
              <button
                type="button"
                onClick={() => setReportLang('en')}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  reportLang === 'en'
                    ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadingPdf ? (reportLang === 'mr' ? 'डाउनलोड होत आहे...' : reportLang === 'hi' ? 'डाउनलोड हो रहा है...' : 'Downloading...') : S.downloadPdfBtn}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{S.printBtn}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{S.downloadHtmlBtn}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-200 transition-colors ml-1"
              aria-label={S.closeBtn}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 font-sans text-slate-900 space-y-6" id="printable-clinical-report">
          {/* Government Official Banner */}
          <div className="border-b-2 border-slate-900/80 pb-4 text-center space-y-1">
            <div className="text-[10px] sm:text-xs font-black tracking-widest text-blue-900 uppercase">
              {S.govtHeader}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {S.reportTitle}
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {S.confidentialSubtitle} • {S.genTime}: {new Date().toLocaleString(reportLang === 'mr' ? 'mr-IN' : reportLang === 'hi' ? 'hi-IN' : 'en-IN')}
            </p>
          </div>

          {/* Dossier Metadata Grid */}
          <table className="w-full border-collapse border border-slate-300 text-xs">
            <tbody>
              <tr>
                <td className="bg-slate-50 font-bold p-2 border border-slate-300 w-1/4 text-slate-600 uppercase text-[10px]">
                  {S.caseNum}
                </td>
                <td className="font-mono font-black p-2 border border-slate-300 text-blue-900 w-1/4">
                  {caseData.case_number}
                </td>
                <td className="bg-slate-50 font-bold p-2 border border-slate-300 w-1/4 text-slate-600 uppercase text-[10px]">
                  {S.status}
                </td>
                <td className="font-bold p-2 border border-slate-300 w-1/4">
                  {getLocalizedValue(caseData.status)}
                </td>
              </tr>
              <tr>
                <td className="bg-slate-50 font-bold p-2 border border-slate-300 text-slate-600 uppercase text-[10px]">
                  {S.priority}
                </td>
                <td className="font-bold p-2 border border-slate-300 text-rose-700">
                  {getLocalizedValue(caseData.ai_triage_priority || 'ROUTINE')}
                </td>
                <td className="bg-slate-50 font-bold p-2 border border-slate-300 text-slate-600 uppercase text-[10px]">
                  {S.riskTier}
                </td>
                <td className="font-bold p-2 border border-slate-300 text-blue-700">
                  {getLocalizedValue(caseData.ai_risk_tier || 'LOW')} (Score: {caseData.ai_risk_score ?? '0.0'})
                </td>
              </tr>
            </tbody>
          </table>

          {/* 1. Farmer & Incident Location Profile */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1">
              {S.sec1}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.farmerName}</span>
                <p className="font-bold text-slate-900 mt-0.5">{caseData.farmer?.full_name || 'Registered Farmer'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.phone}</span>
                <p className="font-bold text-slate-900 mt-0.5">{caseData.farmer?.phone || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.location}</span>
                <p className="font-bold text-slate-900 mt-0.5">{caseData.village || 'Field Village'}, {caseData.district || 'Nagpur'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.coordinates}</span>
                <p className="font-mono font-bold text-blue-800 mt-0.5">
                  {caseData.latitude ? `${caseData.latitude.toFixed(4)}° N, ${caseData.longitude?.toFixed(4)}° E` : 'Coordinates Recorded'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.herdSize}</span>
                <p className="font-bold text-slate-900 mt-0.5">{caseData.animal?.herd_size || caseData.number_affected || 1}</p>
              </div>
            </div>
          </div>

          {/* 2. Animal Demographics & Identification */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1">
              {S.sec2}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.tagNum}</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5">{caseData.animal?.tag_number || 'FX-TAG-REGISTERED'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.species}</span>
                <p className="font-bold text-slate-900 mt-0.5">{getLocalizedValue(caseData.species)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.breed}</span>
                <p className="font-bold text-slate-900 mt-0.5">{caseData.breed || 'Indigen / Local'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.affectedCount}</span>
                <p className="font-bold text-rose-700 mt-0.5">{caseData.number_affected} {S.animalsUnit}</p>
              </div>
            </div>
          </div>

          {/* 3. Observed Symptoms & Verbatim Notes */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1">
              {S.sec3}
            </h3>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-600 block mb-1">{S.symptomsRecorded}:</span>
                <div className="flex flex-wrap gap-1.5">
                  {caseData.symptoms?.map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-white border border-slate-300 font-bold rounded-lg text-slate-800">
                      {s.symptom_name}
                    </span>
                  ))}
                  {translatedSymptoms && reportLang !== caseData.primary_language && (
                    <div className="w-full mt-2 p-2 bg-blue-50/80 rounded-xl border border-blue-200 text-blue-900">
                      <span className="text-[10px] font-bold uppercase block text-blue-700">[{S.translatedView}]:</span>
                      {translatedSymptoms}
                    </div>
                  )}
                </div>
              </div>

              {caseData.voice_transcript && (
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">{S.farmerStatement}</span>
                    <span className="text-[10px] font-semibold bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                      {S.originalLang}: {caseData.primary_language || 'mr'}
                    </span>
                  </div>
                  <p className="text-slate-900 italic font-medium p-2.5 bg-white rounded-xl border border-slate-200">
                    "{caseData.voice_transcript}"
                  </p>
                  {translatedNotes && reportLang !== caseData.primary_language && (
                    <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-blue-950 font-medium">
                      <span className="text-[10px] font-bold uppercase block text-blue-700">[{S.translatedView}]:</span>
                      {translatedNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 4. Epidemiological Context & Field History */}
          {caseData.history_data && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1">
                {S.sec4}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.vaccination}</span>
                  <p className="font-bold text-slate-900 mt-0.5">{caseData.history_data.vaccination_status || 'Unknown'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.prevIllness}</span>
                  <p className="font-bold text-slate-900 mt-0.5">{caseData.history_data.previous_illness || S.noneRecorded}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.recentTreatment}</span>
                  <p className="font-bold text-slate-900 mt-0.5">{caseData.history_data.recent_treatment || S.noneRecorded}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.recentMovement}</span>
                  <p className="font-bold text-slate-900 mt-0.5">{caseData.history_data.recent_movement ? S.yes : S.no}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.sharedGrazing}</span>
                  <p className="font-bold text-slate-900 mt-0.5">{caseData.history_data.contact_with_other_animals ? S.yes : S.no}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.herdDeaths}</span>
                  <p className="font-bold text-rose-700 mt-0.5">{caseData.history_data.recent_deaths ?? 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* 5. Automated Vision AI Screening Assessment */}
          {primaryPrediction && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1">
                {S.sec5}
              </h3>
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 text-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.finding}</span>
                    <p className="text-base font-black text-navy-950 mt-0.5">
                      {primaryPrediction.display_name || primaryPrediction.prediction_class}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.confidence}</span>
                    <p className="font-mono text-base font-black text-blue-700 mt-0.5">
                      {primaryPrediction.percentage ?? Math.round((primaryPrediction.confidence || 0) * 100)}%
                    </p>
                  </div>
                </div>

                {primaryPrediction.visual_indicators && primaryPrediction.visual_indicators.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">{S.indicators}:</span>
                    <ul className="list-disc list-inside space-y-0.5 font-medium text-slate-800">
                      {primaryPrediction.visual_indicators.map((ind: any, i: number) => (
                        <li key={i}>{ind.name} — {ind.description}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[10px] font-semibold text-amber-900">
                  {S.aiNotice}
                </div>
              </div>
            </div>
          )}

          {/* 6. Official Veterinary Verification & Directives */}
          {caseData.verification && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-1">
                {S.sec6}
              </h3>
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.verifiedDiag}</span>
                    <p className="text-sm font-black text-emerald-950 mt-0.5">
                      {caseData.verification.preliminary_diagnosis || 'Clinically Confirmed Disease Event'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">{S.severity}</span>
                    <p className="font-bold text-slate-900 mt-0.5">{caseData.verification.severity}</p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase block mb-0.5">{S.findings}</span>
                  <p className="font-medium text-slate-900 p-2.5 bg-white rounded-xl border border-emerald-100">
                    {translatedFindings || caseData.verification.clinical_findings}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase block mb-0.5">{S.treatment}</span>
                  <p className="font-medium text-slate-900 p-2.5 bg-white rounded-xl border border-emerald-100">
                    {translatedTreatment || caseData.verification.treatment_prescribed || 'Standard antipyretic, wound care, and isolation.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 font-bold text-[11px]">
                  {caseData.verification.containment_required && (
                    <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg border border-rose-200">
                      ✓ {S.quarantine}
                    </span>
                  )}
                  {caseData.verification.sample_required && (
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg border border-blue-200">
                      ✓ {S.labSample}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 7. Field Officer Inspection & Containment Audit */}
          {caseData.field_visits && caseData.field_visits.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1">
                {S.sec7}
              </h3>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                {caseData.field_visits.map((fv, idx) => (
                  <div key={idx} className="space-y-1.5 pb-2 border-b border-slate-200 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-slate-600 font-bold">
                      <span>{S.inspector}: {fv.officer?.full_name || 'Assigned Officer'}</span>
                      <span className="uppercase text-[10px] bg-slate-200 px-2 py-0.5 rounded-full">{fv.visit_status}</span>
                    </div>
                    {fv.observations && (
                      <p className="text-slate-900 font-medium"><strong>{S.observations}:</strong> {fv.observations}</p>
                    )}
                    {fv.outcome && (
                      <p className="text-slate-900 font-medium"><strong>{S.outcome}:</strong> {fv.outcome}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. Legal Disclaimer & Sign-off Blocks */}
          <div className="space-y-4 pt-4 border-t-2 border-slate-900">
            <p className="text-[10px] text-slate-500 text-center italic">
              {S.disclaimer}
            </p>

            <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs">
              <div className="space-y-1">
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                  {S.farmerSig}
                </div>
                <div className="text-[10px] text-slate-400">{caseData.farmer?.full_name || 'Livestock Owner'}</div>
              </div>

              <div className="space-y-1">
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                  {S.officerSig}
                </div>
                <div className="text-[10px] text-slate-400">Field Biosecurity Inspector</div>
              </div>

              <div className="space-y-1">
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                  {S.vetSig}
                </div>
                <div className="text-[10px] text-slate-400">Govt. Veterinary Dispensary</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseReportModal;
