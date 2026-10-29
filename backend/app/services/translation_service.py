"""
FAUNA-X: Clinical & Syndromic Multilingual Translation Engine
Provides robust bidirectional translation between English, Marathi (मराठी), and Hindi (हिंदी).
Preserves original clinical notes, provides offline-first domain dictionary mapping,
language detection heuristics, and isolates sensitive livestock health data.
"""
from typing import Dict, Any, Optional, List, Tuple
import re

# Comprehensive Domain-Specific Vocabulary for Veterinary, Farmer & Field Operations
CLINICAL_DICTIONARY: Dict[str, Dict[str, str]] = {
    # Diseases
    "foot and mouth disease": {
        "mr": "लाळ्या खुरकूत रोग (FMD)",
        "hi": "खुरपका-मुंहपका रोग (FMD)"
    },
    "fmd": {
        "mr": "लाळ्या खुरकूत रोग (FMD)",
        "hi": "खुरपका-मुंहपका रोग (FMD)"
    },
    "lumpy skin disease": {
        "mr": "लंपी / लम्पी त्वचा रोग (LSD)",
        "hi": "लंपी / लम्पी त्वचा रोग (LSD)"
    },
    "lumpy skin": {
        "mr": "लंपी / लम्पी त्वचा रोग (LSD)",
        "hi": "लंपी / लम्पी त्वचा रोग (LSD)"
    },
    "lsd": {
        "mr": "लंपी / लम्पी त्वचा रोग (LSD)",
        "hi": "लंपी / लम्पी त्वचा रोग (LSD)"
    },
    "healthy": {
        "mr": "निरोगी जनावर",
        "hi": "स्वस्थ पशु"
    },
    "anthrax": {
        "mr": "काळपुळी",
        "hi": "एंथ्रेक्स / गिल्टी रोग"
    },
    "black quarter": {
        "mr": "एकटांग्या रोग",
        "hi": "लंगड़ा बुखार (BQ)"
    },
    "hemorrhagic septicemia": {
        "mr": "घटसर्प",
        "hi": "गलघोंटू (HS)"
    },

    # Core Symptoms & Clinical Signs (including prompt required indicators)
    "high fever": {
        "mr": "तीव्र ताप",
        "hi": "तेज बुखार"
    },
    "fever": {
        "mr": "ताप",
        "hi": "बुखार"
    },
    "blisters on mouth": {
        "mr": "तोंडात फोड",
        "hi": "मुंह में छाले"
    },
    "oral lesions": {
        "mr": "तोंडातील व्रण / जखमा",
        "hi": "मुंह के घाव"
    },
    "foot lesions": {
        "mr": "खुरांमधील जखमा",
        "hi": "खुरों में घाव"
    },
    "excessive salivation": {
        "mr": "तोंडातून लाळ गळणे / तोंडातून जास्त लाळ",
        "hi": "मुंह से अत्यधिक लार / मुंह से अत्यधिक लार गिरना / मुंह से लार"
    },
    "drooling": {
        "mr": "लाळ गळणे",
        "hi": "लार टपकना"
    },
    "loss of appetite": {
        "mr": "भूक मंदावणे / चारा न खाणे",
        "hi": "भूख न लगना / चारा न खाना"
    },
    "stopped eating": {
        "mr": "चारा खाणे बंद केले",
        "hi": "चारा खाना बंद कर दिया"
    },
    "not eating": {
        "mr": "चारा खात नाही",
        "hi": "चारा नहीं खा रहा"
    },
    "difficulty walking": {
        "mr": "चालण्यास त्रास / अडचण",
        "hi": "चलने में परेशानी / लड़खड़ाहट"
    },
    "swelling": {
        "mr": "सूज",
        "hi": "सूजन"
    },
    "udder swelling": {
        "mr": "कासेची सूज (स्तनदाह)",
        "hi": "थन की सूजन (थनैला)"
    },
    "unusual behavior": {
        "mr": "असामान्य / विचित्र वर्तन",
        "hi": "असामान्य व्यवहार"
    },
    "visible wounds": {
        "mr": "उघड्या / दृश्य जखमा",
        "hi": "खुले घाव / चोट"
    },
    "change in activity": {
        "mr": "हालचालीत बदल / सुस्तपणा",
        "hi": "गतिविधि में बदलाव / सुस्ती"
    },
    "skin nodules": {
        "mr": "त्वचेवर गाठी",
        "hi": "त्वचा पर गांठें"
    },
    "lameness": {
        "mr": "लंगडणे",
        "hi": "लंगड़ापन"
    },
    "limping": {
        "mr": "लंगडत चालणे",
        "hi": "लंगड़ाना"
    },
    "nasal discharge": {
        "mr": "नाकातून स्राव येणे",
        "hi": "नाक से स्राव बहना"
    },
    "eye discharge": {
        "mr": "डोळ्यातून पाणी / घाण येणे",
        "hi": "आंख से पानी या कीचड़ आना"
    },
    "respiratory distress": {
        "mr": "श्वास घेण्यास त्रास",
        "hi": "सांस लेने में तकलीफ"
    },
    "coughing": {
        "mr": "खोकला",
        "hi": "खांसी"
    },
    "drop in milk yield": {
        "mr": "दूध उत्पादनात घट",
        "hi": "दूध उत्पादन में भारी कमी"
    },
    "diarrhea": {
        "mr": "हगवण / जुलाब",
        "hi": "दस्त / दस्त लगना"
    },
    "weakness": {
        "mr": "अशक्तपणा / पडून राहणे",
        "hi": "कमजोरी / लेटे रहना"
    },

    # Animal Species & Herd Demographics
    "cattle": {
        "mr": "गाय / बैल",
        "hi": "गाय / बैल (गोवंश)"
    },
    "cow": {
        "mr": "गाय",
        "hi": "गाय"
    },
    "bull": {
        "mr": "बैल",
        "hi": "बैल"
    },
    "buffalo": {
        "mr": "म्हैस",
        "hi": "भैंस"
    },
    "goat": {
        "mr": "शेळी",
        "hi": "बकरी"
    },
    "sheep": {
        "mr": "मेंढी",
        "hi": "भेड़"
    },
    "male": {
        "mr": "नर",
        "hi": "नर"
    },
    "female": {
        "mr": "मादी",
        "hi": "मादा"
    },

    # Epidemiological History & Risk Factors
    "fully vaccinated": {
        "mr": "पूर्ण लसीकरण झालेले",
        "hi": "पूर्णतः टीकाकरण प्राप्त"
    },
    "partially vaccinated": {
        "mr": "अंशतः लसीकरण",
        "hi": "आंशिक टीकाकरण"
    },
    "unvaccinated": {
        "mr": "लसीकरण न झालेले",
        "hi": "अटीकाकृत / टीका नहीं लगा"
    },
    "unknown": {
        "mr": "माहित नाही",
        "hi": "अज्ञात"
    },
    "recent movement": {
        "mr": "अलिकडील जनावरांची वाहतूक",
        "hi": "हाल ही में पशुओं का आवागमन"
    },
    "shared grazing": {
        "mr": "सार्वजनिक कुरणात चराई",
        "hi": "सांझा चराई क्षेत्र"
    },
    "recent deaths": {
        "mr": "कळपात अलिकडे झालेले मृत्यू",
        "hi": "झुंड में हालिया मौतें"
    },
    "previous illness": {
        "mr": "मागील आजार",
        "hi": "पिछली बीमारी"
    },
    "recent treatment": {
        "mr": "अलिकडील उपचार",
        "hi": "हाल का उपचार"
    },

    # Veterinary Actions & Prescriptions
    "isolate the affected animal immediately": {
        "mr": "बाधित जनावराला तात्काळ इतर जनावरांपासून वेगळे (विलगीकरण) करा.",
        "hi": "प्रभावित पशु को तुरंत अन्य पशुओं से अलग (क्वारंटीन) करें।"
    },
    "quarantine the herd": {
        "mr": "संपूर्ण कळपाचे विलगीकरण करा.",
        "hi": "पूरे झुंड को संगरोध (क्वारंटीन) में रखें।"
    },
    "clean lesions with potassium permanganate solution": {
        "mr": "पोटॅशियम परमँगनेटच्या सौम्य द्रावणाने जखमा स्वच्छ धुवाव्यात.",
        "hi": "पोटैशियम परमैंगनेट के हल्के घोल से घावों को साफ करें।"
    },
    "apply antiseptic ointment to foot lesions": {
        "mr": "खुरांमधील जखमांवर जंतुनाशक मलम लावावे.",
        "hi": "खुरों के घावों पर एंटीसेप्टिक मलहम लगाएं।"
    },
    "provide soft green fodder and clean drinking water": {
        "mr": "मऊ हिरवा चारा आणि स्वच्छ पिण्याचे पाणी उपलब्ध करून द्यावे.",
        "hi": "मुलायम हरा चारा और स्वच्छ पीने का पानी उपलब्ध कराएं।"
    },
    "administer prescribed antipyretic for fever": {
        "mr": "तापासाठी पशुवैद्यकांनी लिहून दिलेले औषध द्यावे.",
        "hi": "बुखार के लिए पशुचिकित्सक द्वारा निर्धारित दवा दें।"
    },
    "do not allow grazing in public pastures": {
        "mr": "जनावरांना सार्वजनिक कुरणात चरण्यास सोडू नका.",
        "hi": "पशुओं को सार्वजनिक चरागाहों में चरने न भेजें।"
    },
    "disinfect the cattle shed with bleaching powder": {
        "mr": "गोठा ब्लिचिंग पावडर किंवा जंतुनाशकाने स्वच्छ धुवून निर्जंतुक करावा.",
        "hi": "पशुबाड़े को ब्लीचिंग पाउडर या कीटाणुनाशक से साफ करें।"
    },
    "sample collection required for confirmatory pcr test": {
        "mr": "तपासणीसाठी प्रयोगशाळा नमुना (PCR) गोळा करणे आवश्यक आहे.",
        "hi": "पुष्टिकरण पीसीआर परीक्षण हेतु प्रयोगशाला नमूना एकत्र करना आवश्यक है।"
    },
    "field visit scheduled for physical examination": {
        "mr": "प्रत्यक्ष तपासणीसाठी क्षेत्र अधिकारी भेट नियोजित केली आहे.",
        "hi": "शारीरिक जांच के लिए फील्ड ऑफिसर का दौरा निर्धारित किया गया है।"
    },

    # AI Vision Screening Labels & Disclaimers
    "no visible abnormality": {
        "mr": "कोणतीही दृश्य विकृती आढळली नाही",
        "hi": "कोई दृश्य असामान्यता नहीं पाई गई"
    },
    "potential indicator": {
        "mr": "संभाव्य रोग लक्षण आढळले",
        "hi": "संभावित रोग लक्षण संकेत"
    },
    "low-confidence flag": {
        "mr": "कमी खात्री - प्रत्यक्ष तपासणी आवश्यक",
        "hi": "कम विश्वास - प्रत्यक्ष परीक्षण आवश्यक"
    },
    "screening pending": {
        "mr": "तपासणी प्रलंबित",
        "hi": "जांच लंबित"
    },
    "visual symptoms detected matching disease model": {
        "mr": "रोगाच्या मॉडेलशी जुळणारी दृश्य लक्षणे आढळली आहेत",
        "hi": "रोग मॉडल से मेल खाने वाले दृश्य लक्षण पाए गए हैं"
    },
    "animal shows no visible disease lesions": {
        "mr": "जनावरावर कोणतेही दृश्य आजाराचे व्रण आढळले नाहीत",
        "hi": "पशु पर बीमारी का कोई दृश्य घाव नहीं दिखा"
    },
    "ai clinical disclaimer": {
        "mr": "हा निकाल प्राथमिक तपासणीसाठी AI संगणकीय दृष्टी मॉडेलद्वारे तयार केला आहे. हे अधिकृत पशुवैद्यकीय निदान मानले जाऊ नये. सर्व उपचारांसाठी प्रत्यक्ष पशुवैद्यकीय पडताळणी अनिवार्य आहे.",
        "hi": "यह परिणाम प्रारंभिक जांच के लिए AI कंप्यूटर विज़न मॉडल द्वारा तैयार किया गया है। इसे आधिकारिक पशुचिकित्सकीय निदान न माना जाए। सभी उपचारों हेतु प्रत्यक्ष पशुचिकित्सक सत्यापन अनिवार्य है।"
    },

    # Field Inspection Statuses
    "strict quarantine active & compliant": {
        "mr": "कडक विलगीकरण सुरू व नियमांचे पालन",
        "hi": "सख्त क्वारंटीन सक्रिय एवं नियमों का पालन"
    },
    "quarantine advised to farmer": {
        "mr": "शेतकऱ्याला विलगीकरणाचा सल्ला दिला",
        "hi": "किसान को क्वारंटीन की सलाह दी गई"
    },
    "quarantine breached / high contagion risk": {
        "mr": "विलगीकरण उल्लंघन / रोगाचा उच्च प्रसार धोका",
        "hi": "क्वारंटीन का उल्लंघन / उच्च संक्रमण जोखिम"
    },
    "biological sample collected for laboratory": {
        "mr": "प्रयोगशाळेसाठी जैविक नमुना गोळा केला",
        "hi": "प्रयोगशाला हेतु जैविक नमूना एकत्र किया गया"
    }
}

# Inverse mappings for Marathi -> English and Hindi -> English
INVERSE_DICTIONARY: Dict[str, Dict[str, str]] = {"mr": {}, "hi": {}}
for en_term, lang_map in CLINICAL_DICTIONARY.items():
    for lang, trans in lang_map.items():
        INVERSE_DICTIONARY[lang][trans.lower()] = en_term
        for part in re.split(r'[/()]', trans):
            p = part.strip().lower()
            if len(p) >= 2:
                INVERSE_DICTIONARY[lang][p] = en_term

# Distinctive word sets for language identification heuristic
MARATHI_MARKERS = {
    "आहे", "नाही", "आहेत", "नाहीत", "गाईला", "गायीला", "बैलाला", "म्हशीला", "शेळीला", 
    "फोड", "खुरकूत", "लाळ्या", "कमी", "झाले", "करा", "द्यावे", "पाहिजे", "दिवसांपासून",
    "कालपासून", "लक्षणे", "गोठा", "शेतकरी", "जनावर", "कास", "लाळ", "चारा"
}

HINDI_MARKERS = {
    "है", "नहीं", "हैं", "गाय", "बैल", "भैंस", "बकरी", "छाले", "खुरपका", "मुंहपका",
    "कम", "हुआ", "हुई", "करें", "दीजिए", "चाहिए", "दिनों", "कल", "लक्षण",
    "किसान", "पशु", "थन", "लार", "चारा", "से", "को", "का", "की", "के"
}


class TranslationService:
    def __init__(self):
        self.supported_languages = ["en", "mr", "hi"]

    def detect_language(self, text: Optional[str]) -> str:
        """
        Determines the language of the provided text with heuristic checks.
        Distinguishes between Marathi (mr), Hindi (hi), and English (en).
        """
        if not text or not text.strip():
            return "en"

        cleaned = text.strip()
        
        # Check for Devanagari script range (U+0900 to U+097F)
        devanagari_chars = len(re.findall(r'[\u0900-\u097F]', cleaned))
        total_letters = len(re.findall(r'\w', cleaned))

        if total_letters == 0 or devanagari_chars == 0:
            return "en"

        # If significant Devanagari is present, classify between Marathi and Hindi
        words = set(re.findall(r'[\u0900-\u097F]+', cleaned))
        mr_score = len(words.intersection(MARATHI_MARKERS))
        hi_score = len(words.intersection(HINDI_MARKERS))

        # Check distinctive grammatical patterns
        if re.search(r'(आहे|नाही|आहेत|लाळ्या|खुरकूत|गाईला|बैलाला|म्हशीला)', cleaned):
            mr_score += 2
        if re.search(r'(है|नहीं|हैं|खुरपका|मुंहपका|गाय को|बैल को)', cleaned):
            hi_score += 2

        if mr_score > hi_score:
            return "mr"
        elif hi_score > mr_score:
            return "hi"
        
        # Default Devanagari preference based on state/regional default in FaunaX
        return "mr" if devanagari_chars > 0 else "en"

    def translate_clinical_text(
        self,
        text: str,
        source_lang: Optional[str] = None,
        target_lang: str = "en"
    ) -> Dict[str, Any]:
        """
        Translates text between English, Marathi, and Hindi.
        Preserves original text, identifies clinical vocabulary, and provides transparent metadata.
        """
        if not text or not text.strip():
            return {
                "original_text": text or "",
                "translated_text": text or "",
                "source_language": source_lang or "en",
                "target_language": target_lang,
                "is_machine_translated": False,
                "confidence": 1.0,
                "method": "empty"
            }

        # Auto-detect source language if missing or uncertain
        source = (source_lang or "").lower().strip()
        if not source or source not in self.supported_languages:
            source = self.detect_language(text)

        target = (target_lang or "en").lower().strip()
        if target not in self.supported_languages:
            target = "en"

        if source == target:
            return {
                "original_text": text,
                "translated_text": text,
                "source_language": source,
                "target_language": target,
                "is_machine_translated": False,
                "confidence": 1.0,
                "method": "identity"
            }

        cleaned_text = text.strip()
        lower_cleaned = cleaned_text.lower()

        # 1. Exact match lookup in domain dictionary
        if source == "en":
            if lower_cleaned in CLINICAL_DICTIONARY and target in CLINICAL_DICTIONARY[lower_cleaned]:
                return {
                    "original_text": text,
                    "translated_text": CLINICAL_DICTIONARY[lower_cleaned][target],
                    "source_language": source,
                    "target_language": target,
                    "is_machine_translated": True,
                    "confidence": 0.99,
                    "method": "clinical_exact_match"
                }
        elif source in INVERSE_DICTIONARY:
            if lower_cleaned in INVERSE_DICTIONARY[source]:
                en_equivalent = INVERSE_DICTIONARY[source][lower_cleaned]
                if target == "en":
                    return {
                        "original_text": text,
                        "translated_text": en_equivalent.capitalize(),
                        "source_language": source,
                        "target_language": target,
                        "is_machine_translated": True,
                        "confidence": 0.99,
                        "method": "clinical_exact_match"
                    }
                elif target in CLINICAL_DICTIONARY.get(en_equivalent, {}):
                    return {
                        "original_text": text,
                        "translated_text": CLINICAL_DICTIONARY[en_equivalent][target],
                        "source_language": source,
                        "target_language": target,
                        "is_machine_translated": True,
                        "confidence": 0.96,
                        "method": "clinical_pivot_match"
                    }

        # 2. Multi-word phrase and term replacement
        translated_text = cleaned_text
        matched_terms = 0

        if source == "en":
            for en_term, translations in CLINICAL_DICTIONARY.items():
                if target in translations and re.search(r'\b' + re.escape(en_term) + r'\b', translated_text, re.IGNORECASE):
                    translated_text = re.sub(
                        r'\b' + re.escape(en_term) + r'\b',
                        translations[target],
                        translated_text,
                        flags=re.IGNORECASE
                    )
                    matched_terms += 1
        else:
            # Map from source lang phrases to English/Target
            for src_term, en_term in INVERSE_DICTIONARY.get(source, {}).items():
                if src_term in translated_text.lower():
                    dest_term = en_term if target == "en" else CLINICAL_DICTIONARY.get(en_term, {}).get(target, en_term)
                    translated_text = re.sub(re.escape(src_term), dest_term, translated_text, flags=re.IGNORECASE)
                    matched_terms += 1

        # 3. Structural phrase translation templates for farmer & vet notes
        if source != "en" and target == "en":
            if source == "mr":
                translated_text = self._apply_marathi_farmer_patterns(translated_text)
            elif source == "hi":
                translated_text = self._apply_hindi_farmer_patterns(translated_text)
        elif source == "en" and target in ["mr", "hi"]:
            translated_text = self._apply_english_vet_patterns(translated_text, target)
        elif source == "mr" and target == "hi":
            translated_text = self._apply_marathi_to_hindi_patterns(translated_text)
        elif source == "hi" and target == "mr":
            translated_text = self._apply_hindi_to_marathi_patterns(translated_text)

        confidence = 0.95 if matched_terms > 0 else 0.85

        return {
            "original_text": text,
            "translated_text": translated_text,
            "source_language": source,
            "target_language": target,
            "is_machine_translated": True,
            "confidence": confidence,
            "method": "clinical_phrase_synthesis"
        }

    def localize_ai_result(self, prediction_dict: Any, target_lang: str) -> Dict[str, Any]:
        """
        Translates AI prediction result fields into target language while preserving
        numerical metrics, model versions, and structured IDs.
        """
        if not prediction_dict:
            return {}
        if isinstance(prediction_dict, str):
            prediction_dict = {
                "prediction_class": prediction_dict,
                "display_name": prediction_dict.replace("_", " ").title()
            }

        target = (target_lang or "en").lower()
        pred_class = (prediction_dict.get("prediction_class") or "").lower().replace("_", " ")

        localized = dict(prediction_dict)

        # Localize disease name
        if pred_class in CLINICAL_DICTIONARY and target in CLINICAL_DICTIONARY[pred_class]:
            localized["display_name"] = CLINICAL_DICTIONARY[pred_class][target]
        elif target != "en":
            tr = self.translate_clinical_text(prediction_dict.get("display_name", pred_class), "en", target)
            localized["display_name"] = tr["translated_text"]

        # Localize status text
        raw_status = prediction_dict.get("status_text") or prediction_dict.get("status") or ""
        if raw_status and target != "en":
            tr_status = self.translate_clinical_text(raw_status, "en", target)
            localized["status_text"] = tr_status["translated_text"]

        # Localize visual indicators
        if "visual_indicators" in localized and isinstance(localized["visual_indicators"], list) and target != "en":
            new_indicators = []
            for ind in localized["visual_indicators"]:
                ind_copy = dict(ind)
                if "name" in ind_copy:
                    ind_copy["name"] = self.translate_clinical_text(ind_copy["name"], "en", target)["translated_text"]
                if "description" in ind_copy:
                    ind_copy["description"] = self.translate_clinical_text(ind_copy["description"], "en", target)["translated_text"]
                new_indicators.append(ind_copy)
            localized["visual_indicators"] = new_indicators

        # Localize alternatives
        if "alternatives" in localized and isinstance(localized["alternatives"], list) and target != "en":
            new_alts = []
            for alt in localized["alternatives"]:
                alt_copy = dict(alt)
                alt_name = (alt_copy.get("class") or "").lower().replace("_", " ")
                if alt_name in CLINICAL_DICTIONARY and target in CLINICAL_DICTIONARY[alt_name]:
                    alt_copy["display_name"] = CLINICAL_DICTIONARY[alt_name][target]
                new_alts.append(alt_copy)
            localized["alternatives"] = new_alts

        # Localize disclaimer
        disclaimer_text = CLINICAL_DICTIONARY["ai clinical disclaimer"].get(target, localized.get("clinical_disclaimer", ""))
        localized["clinical_disclaimer"] = disclaimer_text

        # Compatibility aliases for callers and tests
        localized["disease_name"] = localized.get("display_name", "")
        localized["disclaimer"] = disclaimer_text

        return localized

    def _apply_marathi_farmer_patterns(self, text: str) -> str:
        res = text
        replacements = [
            (r"गायीला|गाईला", "The cow"),
            (r"बैलाला", "The ox/bull"),
            (r"म्हशीला", "The buffalo"),
            (r"शेळीला", "The goat"),
            (r"तीव्र ताप|जास्त ताप", "has high fever"),
            (r"ताप आला आहे|ताप आहे", "has fever"),
            (r"चारा खात नाही|चारा खाणे बंद केले", "stopped eating feed / loss of appetite"),
            (r"तोंडातून लाळ गळत आहे|लाळ गळत आहे", "is salivating excessively / drooling"),
            (r"तोंडात फोड आले आहेत|तोंडात फोड", "has blisters/lesions in mouth"),
            (r"पायाला फोड आले आहेत|खुरांत जखमा", "has sores/lesions on feet"),
            (r"चालण्यास त्रास|लंगडत चालत आहे|लंगडणे", "has difficulty walking / limping"),
            (r"दूध कमी झाले|दूध उत्पादनात घट", "milk yield dropped drastically"),
            (r"अंगावर गाठी आल्या आहेत|त्वचेवर गाठी", "has skin nodules/lumps"),
            (r"कासेला सूज|कास सुजली आहे", "has udder swelling (mastitis)"),
            (r"दोन दिवसांपासून|२ दिवसांपासून", "since 2 days"),
            (r"कालपासून", "since yesterday"),
            (r"कृपया मदत करा|लवकर तपासा", "please provide veterinary assistance urgently")
        ]
        for pat, rep in replacements:
            res = re.sub(pat, rep, res, flags=re.IGNORECASE)
        return res

    def _apply_hindi_farmer_patterns(self, text: str) -> str:
        res = text
        replacements = [
            (r"गाय को", "The cow"),
            (r"बैल को", "The bull"),
            (r"भैंस को", "The buffalo"),
            (r"बकरी को", "The goat"),
            (r"तेज बुखार है", "has high fever"),
            (r"बुखार है", "has fever"),
            (r"चारा नहीं खा रही|चारा नहीं खा रहा|खाना बंद कर दिया", "stopped eating fodder / off feed"),
            (r"मुंह से अत्यधिक लार( गिरना)?|मुंह से लार( टपक रही है)?|लार गिरना", "is salivating heavily from mouth / excessive salivation / drooling"),
            (r"मुंह में छाले हैं|मुंह में छाले", "has blisters/lesions in mouth"),
            (r"पैरों में घाव हैं|खुरों में घाव", "has lesions on hooves/feet"),
            (r"चलने में परेशानी|लंगड़ा कर चल रही है|लंगड़ापन", "has difficulty walking / limping"),
            (r"दूध बहुत कम हो गया है|दूध उत्पादन में कमी", "milk production decreased significantly"),
            (r"त्वचा पर गांठें हैं|त्वचा पर गांठ", "has skin nodules/lumps"),
            (r"थन में सूजन है|थन सूज गया है", "has udder swelling (mastitis)"),
            (r"दो दिन से|२ दिन से", "since 2 days"),
            (r"कल से", "since yesterday"),
            (r"कृपया सहायता करें|डॉक्टर को भेजें", "please provide veterinary assistance urgently")
        ]
        for pat, rep in replacements:
            res = re.sub(pat, rep, res, flags=re.IGNORECASE)
        return res

    def _apply_english_vet_patterns(self, text: str, target: str) -> str:
        res = text
        if target == "mr":
            patterns = [
                (r"isolate (the )?(affected )?animal( immediately)?", "बाधित जनावराला तात्काळ इतर जनावरांपासून वेगळे (विलगीकरण) करा"),
                (r"clean (lesions )?with potassium permanganate", "पोटॅशियम परमँगनेटच्या सौम्य द्रावणाने जखमा धुवा"),
                (r"apply antiseptic ointment", "जंतुनाशक मलम लावा"),
                (r"administer antipyretic", "तापाचे औषध द्या"),
                (r"provide soft (green )?feed", "मऊ हिरवा चारा व स्वच्छ पाणी द्या"),
                (r"keep in quarantine", "विलगीकरणात ठेवा"),
                (r"sample collection required", "तपासणीसाठी नमुना गोळा करणे आवश्यक आहे"),
                (r"mandatory veterinary verification", "पशुवैद्यकीय तपासणी अनिवार्य आहे")
            ]
        else:
            patterns = [
                (r"isolate (the )?(affected )?animal( immediately)?", "प्रभावित पशु को तुरंत अन्य पशुओं से अलग (क्वारंटीन) करें"),
                (r"clean (lesions )?with potassium permanganate", "पोटैशियम परमैंगनेट के हल्के घोल से घाव साफ करें"),
                (r"apply antiseptic ointment", "एंटीसेप्टिक मलहम लगाएं"),
                (r"administer antipyretic", "बुखार की निर्धारित दवा दें"),
                (r"provide soft (green )?feed", "मुलायम हरा चारा और स्वच्छ पानी दें"),
                (r"keep in quarantine", "क्वारंटीन में रखें"),
                (r"sample collection required", "पुष्टिकरण हेतु प्रयोगशाला नमूना आवश्यक है"),
                (r"mandatory veterinary verification", "पशुचिकित्सक सत्यापन अनिवार्य है")
            ]
        for pat, rep in patterns:
            res = re.sub(pat, rep, res, flags=re.IGNORECASE)
        return res

    def _apply_marathi_to_hindi_patterns(self, text: str) -> str:
        res = text
        replacements = [
            (r"आहे", "है"),
            (r"आहेत", "हैं"),
            (r"नाही", "नहीं"),
            (r"गाईला|गायीला", "गाय को"),
            (r"बैलाला", "बैल को"),
            (r"म्हशीला", "भैंस को"),
            (r"शेळीला", "बकरी को"),
            (r"चारा खात नाही", "चारा नहीं खा रहा"),
            (r"लाळ गळत आहे", "लार टपक रही है"),
            (r"फोड", "छाले"),
            (r"लंगडत", "लंगड़ाते हुए"),
            (r"झाले", "हुआ"),
            (r"करा", "करें")
        ]
        for pat, rep in replacements:
            res = re.sub(pat, rep, res, flags=re.IGNORECASE)
        return res

    def _apply_hindi_to_marathi_patterns(self, text: str) -> str:
        res = text
        replacements = [
            (r"है", "आहे"),
            (r"हैं", "आहेत"),
            (r"नहीं", "नाही"),
            (r"गाय को", "गाईला"),
            (r"बैल को", "बैलाला"),
            (r"भैंस को", "म्हशीला"),
            (r"बकरी को", "शेळीला"),
            (r"चारा नहीं खा रहा", "चारा खात नाही"),
            (r"लार टपक रही है", "लाळ गळत आहे"),
            (r"छाले", "फोड"),
            (r"हुआ", "झाले"),
            (r"करें", "करा")
        ]
        for pat, rep in replacements:
            res = re.sub(pat, rep, res, flags=re.IGNORECASE)
        return res

    def translate_text(self, text: str, source_lang: Optional[str] = None, target_lang: str = "en") -> str:
        """Alias for translate_clinical_text that returns the translated text string directly."""
        res = self.translate_clinical_text(text, source_lang=source_lang, target_lang=target_lang)
        if isinstance(res, dict):
            return res.get("translated_text", text)
        return str(res)


translation_service = TranslationService()

