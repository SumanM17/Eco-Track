"""FastAPI router for Multilingual AI Chat & Voice Assistant.
Answers carbon queries, explains utility bills, and recommends high-impact swaps in en, hi, ta, te.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

try:
    from api.claude_client import ClaudeLanguageEngine
    from api.config import AIConfig
except ImportError:
    from ai_models.claude_client import ClaudeLanguageEngine
    from ai_models.config import AIConfig
from backend.database import get_db_connection
from backend.routers.auth import get_authenticated_user_id
from backend.services.calculation_engine import CalculationEngine

router = APIRouter(prefix="/api/assistant", tags=["Multilingual AI Assistant"])


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1)
    language: str = "en"  # en | hi | ta | te
    account_type: str = "individual"


# Multilingual Knowledge Base for 100% Offline Resilience & Vernacular Precision
KNOWLEDGE_RESPONSES = {
    "en": {
        "reduce_money": (
            "Here are the top 3 money-saving climate swaps for Indian households: "
            "1. Set AC to 26°C with ceiling fan (saves ~₹450/month and 1.4 kg CO2e/day). "
            "2. Switch 2 solo cab trips per week to Metro (saves ₹800/month and 3.2 kg CO2e/trip). "
            "3. Cook with covered lids on medium flame (saves 25% LPG and ₹150/month)."
        ),
        "why_increase": (
            "Your carbon footprint typically spikes due to extended air conditioner usage during hot days, "
            "solo private car or cab commutes, or sudden increases in power consumption. "
            "Checking your electricity bill in Evidence and switching to public transit will quickly bring it down."
        ),
        "bill_reduction": (
            "To verify bill reduction and earn rewards, upload your DISCOM electricity bill in the Evidence tab. "
            "Our anti-fraud engine checks your meter units against previous months and awards up to 50 Carbon Coins!"
        ),
        "points_balance": (
            "You earn Carbon Coins for verified electricity cuts, daily logging streaks, and metro commutes. "
            "Go to the Rewards tab to redeem them for DMRC Metro passes, Tata Power EV charging, and Organic Mandi coupons."
        ),
        "solar_panels": (
            "Under the PM Surya Ghar Muft Bijli Yojana, a 3 kW rooftop solar system provides ~360 kWh/month, "
            "saving ₹2,800/month on electricity bills and eliminating 295 kg CO2e every month. "
            "Subsidies cover up to ₹78,000 in India."
        ),
        "electric_vehicle": (
            "An electric two-wheeler runs at ~₹0.35/km compared to ₹2.20/km for petrol, cutting running costs by 84% "
            "and reducing tailpipe carbon emissions from 0.055 kg/km to 0.018 kg CO2e/km on the Indian grid."
        ),
        "food_diet": (
            "Plant-based Indian meals (dal, seasonal sabzi, millets, rice) have a carbon footprint of only 0.8 kg CO2e, "
            "compared to 2.5 kg CO2e for mutton or poultry. Swapping 3 meals a week saves ~25 kg CO2e monthly."
        ),
        "organization_esg": (
            "For organizations, Scope 1 covers company vehicles and backup diesel generators, Scope 2 covers grid electricity "
            "(CEA v19 factor: 0.820 kg/kWh), and Scope 3 covers employee commutes and business travel. Check our Organization tab for automated ESG reports."
        ),
        "default": (
            "Namaste! I am EcoTrack's multilingual climate assistant. I can calculate your daily routine footprint, "
            "verify electricity bills, explain emissions in Kid/Student/Expert mode, and suggest money-saving swaps. "
            "What would you like to explore today?"
        ),
    },
    "hi": {
        "reduce_money": (
            "कम खर्च में कार्बन और पैसे बचाने के 3 मुख्य उपाय: "
            "1. एसी को 22°C के बजाय 26°C पर सेट करें और पंखा चलाएं (हर महीने ₹450 बचेंगे)। "
            "2. हफ्ते में 2 दिन कैब की जगह मेट्रो या बस लें (प्रति ट्रिप 3.2 किग्रा CO2e और ₹800/माह की बचत)। "
            "3. खाना पकाते समय बर्तन पर ढक्कन रखें (25% एलपीजी गैस की बचत)।"
        ),
        "why_increase": (
            "उत्सर्जन बढ़ने का सबसे बड़ा कारण एसी का अधिक चलना या निजी कार/बाइक से लंबी यात्राएं होना है। "
            "मेट्रो का उपयोग करना और एसी तापमान 26°C रखना आपके पदचिह्न को तुरंत कम करता है।"
        ),
        "bill_reduction": (
            "बिजली बिल की जांच के लिए 'Evidence' टैब में अपना बिजली बिल (BESCOM, BSES, TNEB आदि) अपलोड करें। "
            "हम पिछले महीने की तुलना में यूनिट्स मापेंगे और बचत होने पर आपको 50 कार्बन कॉइन्स देंगे!"
        ),
        "points_balance": (
            "आप बिजली बिल घटाने, लगातार रूटीन दर्ज करने और मेट्रो यात्रा करने पर कार्बन कॉइन्स कमाते हैं। "
            "इन्हें 'Rewards' टैब में जाकर दिल्ली मेट्रो कूपन, टाटा पावर ईवी चार्जिंग छूट और किराना वाउचर में भुना सकते हैं।"
        ),
        "solar_panels": (
            "पीएम सूर्य घर मुफ्त बिजली योजना के तहत 3 किलोवाट का रूफटॉप सोलर सिस्टम लगाने से हर महीने लगभग 360 यूनिट बिजली बनती है। "
            "इससे हर महीने ₹2,800 की बचत और 295 किग्रा CO2e उत्सर्जन में कमी आती है।"
        ),
        "electric_vehicle": (
            "इलेक्ट्रिक स्कूटर चलाने का खर्च लगभग ₹0.35/किमी है, जबकि पेट्रोल बाइक का ₹2.20/किमी। "
            "यह 80% से ज्यादा खर्च बचाता है और प्रदूषण को बहुत कम करता है।"
        ),
        "food_diet": (
            "दाल, मौसमी सब्जियां, बाजरा और चावल जैसे पारंपरिक भारतीय शाकाहारी भोजन का कार्बन पदचिह्न केवल 0.8 किग्रा CO2e है, "
            "जो मांसाहारी भोजन की तुलना में 70% कम है।"
        ),
        "organization_esg": (
            "संस्थानों के लिए स्कोप 1 डीजल जनरेटर व कंपनी वाहनों का उत्सर्जन है, स्कोप 2 ग्रिड बिजली (0.820 किग्रा/यूनिट) है, "
            "और स्कोप 3 कर्मचारी यात्रा है। आप 'Organization' टैब से पूरी ऑडिट रिपोर्ट डाउनलोड कर सकते हैं।"
        ),
        "default": (
            "नमस्ते! मैं इको ट्रैकर एआई (EcoTrack) सहायक हूँ। आप बोलकर या लिखकर अपनी दिनचर्या बता सकते हैं, "
            "बिजली बिल स्कैन कर सकते हैं, सोलर पैनल व ईवी के फायदे जान सकते हैं और पैसे बचाने वाले सुझाव पा सकते हैं।"
        ),
    },
    "ta": {
        "reduce_money": (
            "பணம் மற்றும் கார்பனை மிச்சப்படுத்த 3 எளிய வழிகள்: "
            "1. ஏசி வெப்பநிலையை 26°C ஆக அமைத்து மின்விசிறியை இயக்கவும் (மாதம் ₹450 வரை மின் கட்டணம் குறையும்). "
            "2. வாரத்தில் 2 நாட்கள் டாக்ஸிக்கு பதில் மெட்ரோ ரயிலில் செல்லவும் (ஒரு பயணத்திற்கு 3.2 கிகி CO2e மிச்சம்). "
            "3. சமைக்கும் போது பாத்திரங்களை மூடி சமைக்கவும் (25% எல்பிஜி சிலிண்டர் மிச்சமாகும்)."
        ),
        "why_increase": (
            "வெயில் காலத்தில் ஏசி அதிக நேரம் ஓடுவது அல்லது சொந்த வாகனங்களில் பயணம் செய்வதே கார்பன் அளவு அதிகரிக்க முக்கிய காரணம். "
            "பொதுப் போக்குவரத்தைப் பயன்படுத்துவது இதை உடனடியாகக் குறைக்கும்."
        ),
        "bill_reduction": (
            "மின் கட்டணத்தைக் குறைக்க, 'Evidence' பக்கத்தில் உங்கள் டிஸ்காம் மின்சார பில்லை பதிவேற்றவும். "
            "முந்தைய மாதத்தை விட குறைந்த யூனிட் பயன்படுத்தியிருந்தால் உங்களுக்கு கார்பன் காயின்கள் பரிசாக வழங்கப்படும்!"
        ),
        "points_balance": (
            "மின்சார சேமிப்பு, தொடர்ந்து பதிவு செய்தல் மற்றும் மெட்ரோ பயணங்கள் மூலம் நீங்கள் கார்பன் காயின்களைப் பெறலாம். "
            "'Rewards' பகுதியில் இவற்றை மெட்ரோ பாஸ் மற்றும் தள்ளுபடி கூப்பன்களாக மாற்றிக்கொள்ளலாம்."
        ),
        "solar_panels": (
            "சூரிய ஒளி மின்சார திட்டம் மூலம் 3 kW சோலார் அமைத்தால் மாதம் 360 யூனிட் மின்சாரம் உற்பத்தியாகும். "
            "மாதம் ₹2,800 வரை மின் கட்டணம் மிச்சமாவதுடன் 295 கிகி கார்பன் வெளியீடு தடுக்கப்படும்."
        ),
        "electric_vehicle": (
            "மின்சார இருசக்கர வாகனம் ஒரு கிலோமீட்டருக்கு வெறும் ₹0.35 மட்டுமே செலவாகும், பெட்ரோல் வண்டியில் ₹2.20 ஆகும். "
            "இது 80% பணத்தை மிச்சப்படுத்துகிறது."
        ),
        "food_diet": (
            "பருப்பு, காய்கறிகள், சிறுதானியங்கள் அடங்கிய பாரம்பரிய சைவ உணவு ஒரு வேளைக்கு 0.8 கிகி CO2e மட்டுமே உருவாக்குகிறது, "
            "இது சுற்றுச்சூழலுக்கு மிகவும் சிறந்தது."
        ),
        "default": (
            "வணக்கம்! நான் எகோ டிராக்கர் ஏஐ (EcoTrack) தமிழ் உதவியாளர். உங்கள் தினசரி மின்சார பயன்பாடு, "
            "கார்பன் குறைப்பு வழிகள், சோலார் பேனல் மற்றும் வெகுமதிகள் பற்றி என்னிடம் கேட்கலாம்."
        ),
    },
    "te": {
        "reduce_money": (
            "డబ్బు మరియు కార్బన్ ఆదా చేయడానికి 3 ఉత్తమ మార్గాలు: "
            "1. ఏసీని 26°C వద్ద ఉంచి ఫ్యాన్ వాడండి (నెలకు ₹450 కరెంట్ బిల్లు ఆదా అవుతుంది). "
            "2. వారంలో 2 రోజులు క్యాబ్ బదులుగా మెట్రో లేదా బస్సు వాడండి (ప్రతి ప్రయాణానికి 3.2 కిలోల CO2e ఆదా). "
            "3. వంట చేసేటప్పుడు పాత్రపై మూత ఉంచండి (25% వంట గ్యాస్ ఆదా)."
        ),
        "why_increase": (
            "వేసవిలో ఏసీ ఎక్కువసేపు వాడటం లేదా వ్యక్తిగత వాహనాలలో ఎక్కువ దూరం ప్రయాణించడం వల్ల మీ కార్బన్ ఉద్గారాలు పెరుగుతాయి. "
            "మెట్రో లేదా ఆర్టీసీ బస్సు వాడటం ద్వారా దీన్ని వెంటనే తగ్గించవచ్చు."
        ),
        "bill_reduction": (
            "విద్యుత్ ఆదాను ధృవీకరించడానికి, 'Evidence' ట్యాబ్‌లో మీ విద్యుత్ బిల్లును అప్‌లోడ్ చేయండి. "
            "గత నెల కంటే తక్కువ యూనిట్లు వాడినట్లు ధృవీకరిస్తే మీకు కార్బన్ కాయిన్స్ లభిస్తాయి!"
        ),
        "points_balance": (
            "విద్యుత్ తగ్గింపు, రోజువారీ లాగింగ్ మరియు ప్రజా రవాణా వాడటం ద్వారా మీరు కార్బన్ కాయిన్స్ సంపాదిస్తారు. "
            "'Rewards' ట్యాబ్‌లో మెట్రో పాస్‌లు మరియు డిస్కౌంట్ వోచర్లుగా వీటిని మార్చుకోవచ్చు."
        ),
        "solar_panels": (
            "రూఫ్‌టాప్ సోలార్ ప్యానెల్స్ ద్వారా నెలకు సుమారు 360 యూనిట్ల ఉచిత విద్యుత్ ఉత్పత్తి అవుతుంది. "
            "దీనివలన నెలకు ₹2,800 కరెంట్ బిల్లు ఆదా అవ్వడమే కాక 295 కిలోల కార్బన్ తగ్గుతుంది."
        ),
        "electric_vehicle": (
            "ఎలక్ట్రిక్ స్కూటర్ నడపడానికి కిలోమీటరుకు ₹0.35 ఖర్చవుతుంది, పెట్రోల్ బైక్‌కు ₹2.20 అవుతుంది. "
            "ఇది 80% ఖర్చును ఆదా చేస్తుంది."
        ),
        "food_diet": (
            "పప్పు, కూరగాయలు, చిరుధాన్యాలతో కూడిన భారతీయ శాకాహారం పర్యావరణానికి ఎంతో మేలు చేస్తుంది, "
            "ఇది మాంసాహారం కంటే 70% తక్కువ కార్బన్ ఉద్గారాలను ఉత్పత్తి చేస్తుంది."
        ),
        "default": (
            "నమస్కారం! నేను ఎకో ట్రాకర్ ఏఐ (EcoTrack) తెలుగు అసిస్టెంట్‌ని. మీ రోజువారీ రవాణా, విద్యుత్ బిల్లులు, "
            "సోలార్ ప్యానెల్స్ మరియు కార్బన్ తగ్గింపుల గురించి నన్ను అడగవచ్చు."
        ),
    },
    "kn": {
        "reduce_money": (
            "ಹಣ ಮತ್ತು ಇಂಗಾಲ ಉಳಿಸಲು 3 ಅತ್ಯುತ್ತಮ ಭಾರತೀಯ ಕ್ರಮಗಳು: "
            "1. ಎಸಿ ತಾಪಮಾನವನ್ನು 26°C ಗೆ ಇಟ್ಟು ಫ್ಯಾನ್ ಬಳಸಿ (ತಿಂಗಳಿಗೆ ₹450 ವಿದ್ಯುತ್ ಬಿಲ್ ಉಳಿಯುತ್ತದೆ). "
            "2. ವಾರದಲ್ಲಿ 2 ದಿನ ಕ್ಯಾಬ್ ಬದಲು ನಮ್ಮ ಮೆಟ್ರೋ ಅಥವಾ ಬಸ್ ಬಳಸಿ (ಪ್ರತಿ ಟ್ರಿಪ್‌ಗೆ 3.2 ಕಿ.ಗ್ರಾಂ CO2e ಆದಾ). "
            "3. ಅಡುಗೆ ಮಾಡುವಾಗ ಪಾತ್ರೆಯ ಮೇಲೆ ಮುಚ್ಚಳ ಮುಚ್ಚಿ (25% ಅಡುಗೆ ಅನಿಲ ಉಳಿತಾಯ)."
        ),
        "why_increase": (
            "ಬೇಸಿಗೆಯಲ್ಲಿ ಎಸಿ ದೀರ್ಘಕಾಲ ಓಡುವುದು ಅಥವಾ ಖಾಸಗಿ ಕಾರುಗಳಲ್ಲಿ ಪ್ರಯಾಣಿಸುವುದು ಇಂಗಾಲ ಪ್ರಮಾಣ ಹೆಚ್ಚಾಗಲು ಮುಖ್ಯ ಕಾರಣ. "
            "ನಮ್ಮ ಮೆಟ್ರೋ ಅಥವಾ ಬಿಎಂಟಿಸಿ ಬಸ್ ಬಳಸುವುದರಿಂದ ಇದನ್ನು ತಕ್ಷಣವೇ ಕಡಿಮೆ ಮಾಡಬಹುದು."
        ),
        "bill_reduction": (
            "ವಿದ್ಯುತ್ ಉಳಿತಾಯ ಪರಿಶೀಲಿಸಲು, 'Evidence' ಟ್ಯಾಬ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಬೆಸ್ಕಾಂ (BESCOM) ವಿದ್ಯುತ್ ಬಿಲ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. "
            "ಕಳೆದ ತಿಂಗಳಿಗಿಂತ ಕಡಿಮೆ ಯೂನಿಟ್ ಬಳಸಿದ್ದರೆ ನಿಮಗೆ 50 ಕಾರ್ಬನ್ ನಾಣ್ಯಗಳು ಸಿಗುತ್ತವೆ!"
        ),
        "points_balance": (
            "ವಿದ್ಯುತ್ ಕಡಿತ, ನಿತ್ಯ ದಿನಚರಿ ದಾಖಲಿಸುವುದು ಮತ್ತು ಮೆಟ್ರೋ ಪ್ರಯಾಣದಿಂದ ನೀವು ಕಾರ್ಬನ್ ನಾಣ್ಯಗಳನ್ನು ಗಳಿಸುತ್ತೀರಿ. "
            "'Rewards' ಟ್ಯಾಬ್‌ನಲ್ಲಿ ಮೆಟ್ರೋ ಸ್ಮಾರ್ಟ್ ಕಾರ್ಡ್ ಮತ್ತು ರಿಯಾಯಿತಿ ವೋಚರ್‌ಗಳಾಗಿ ಇವುಗಳನ್ನು ರಿಡೀಮ್ ಮಾಡಿಕೊಳ್ಳಿ."
        ),
        "solar_panels": (
            "ಪಿಎಂ ಸೂರ್ಯ ಘರ್ ಮುಫ್ಟ್ ಬಿಜ್ಲಿ ಯೋಜನೆಯಡಿ 3 kW ರೂಫ್‌ಟಾಪ್ ಸೋಲಾರ್ ತಿಂಗಳಿಗೆ 360 ಯೂನಿಟ್ ವಿದ್ಯುತ್ ಉತ್ಪಾದಿಸುತ್ತದೆ. "
            "ತಿಂಗಳಿಗೆ ₹2,800 ವಿದ್ಯುತ್ ಬಿಲ್ ಉಳಿಯುವುದರ ಜೊತೆಗೆ 295 ಕಿ.ಗ್ರಾಂ ಇಂಗಾಲ ಹೊರಸೂಸುವಿಕೆ ತಡೆಯುತ್ತದೆ."
        ),
        "electric_vehicle": (
            "ಎಲೆಕ್ಟ್ರಿಕ್ ಸ್ಕೂಟರ್ ಚಲಾಯಿಸಲು ಪ್ರತಿ ಕಿ.ಮೀಗೆ ಕೇವಲ ₹0.35 ಖರ್ಚಾಗುತ್ತದೆ, ಪೆಟ್ರೋಲ್ ಬೈಕ್‌ಗೆ ₹2.20 ಆಗುತ್ತದೆ. "
            "ಇದು 84% ಇಂಧನ ವೆಚ್ಚವನ್ನು ಉಳಿಸುತ್ತದೆ."
        ),
        "food_diet": (
            "ಬೇಳೆ, ತರಕಾರಿ, ಸಿರಿಧಾನ್ಯಗಳ ಭಾರತೀಯ ಸಾಂಪ್ರದಾಯಿಕ ಸಸ್ಯಾಹಾರಿ ಊಟ ಪರಿಸರಕ್ಕೆ ಅತ್ಯಂತ ಹಿತಕಾರಿ, "
            "ಇದು ಮಾಂಸಾಹಾರಕ್ಕಿಂತ 70% ಕಡಿಮೆ ಇಂಗಾಲವನ್ನು ಉತ್ಪಾದಿಸುತ್ತದೆ."
        ),
        "default": (
            "ನಮಸ್ಕಾರ! ನಾನು ಇಕೋ ಟ್ರ್ಯಾಕರ್ ಎಐ (EcoTrack) ಕನ್ನಡ ಸಹಾಯಕ. ನಿಮ್ಮ ದೈನಂದಿನ ದಿನಚರಿ, ವಿದ್ಯುತ್ ಬಿಲ್ ವಿಶ್ಲೇಷಣೆ, "
            "ಸೋಲಾರ್ ಪ್ಯಾನಲ್ ಮತ್ತು ಕಾರ್ಬನ್ ಉಳಿತಾಯ ಕ್ರಮಗಳ ಬಗ್ಗೆ ನನ್ನನ್ನು ಕೇಳಬಹುದು."
        ),
    },
}


@router.post("/chat", summary="Chat with multilingual AI assistant (en, hi, ta, te, kn)")
def chat_with_assistant(req: ChatMessageRequest, authorization: Optional[str] = Header(None)):
    user_id = get_authenticated_user_id(authorization)
    msg_lower = req.message.lower()
    lang = (req.language or "en").lower().strip()
    if lang not in ("en", "hi", "ta", "te", "kn"):
        lang = "en"

    # 1. Check for live Claude API engine if configured
    claude = ClaudeLanguageEngine()
    if claude.is_ready():
        try:
            reply = claude.generate_text(
                f"You are EcoTrack's multilingual Indian climate assistant. Answer helpfully and concisely in {lang}. User question: {req.message}"
            )
            if reply:
                return {"reply": reply, "engine": "claude", "language": lang}
        except Exception:
            pass

    # 2. Rich Multilingual Domain Knowledge Engine (100% Offline Precision)
    kb = KNOWLEDGE_RESPONSES.get(lang, KNOWLEDGE_RESPONSES["en"])

    # High-precision semantic keyword matching
    if any(w in msg_lower for w in ["reduce", "save", "money", "cost", "कम", "बचत", "पैसे", "குறைக்க", "சேமிக்க", "తగ్గించ", "ఆదా", "పైసలు"]):
        reply = kb.get("reduce_money", kb["default"])
    elif any(w in msg_lower for w in ["solar", "solor", "surya", "सन", "सोलर", "சூரிய", "సోలార్"]):
        reply = kb.get("solar_panels", kb["default"])
    elif any(w in msg_lower for w in ["ev", "electric", "scooter", "bike", "ईवी", "स्कूटर", "மின்சார", "ఎలక్ట్రిక్"]):
        reply = kb.get("electric_vehicle", kb["default"])
    elif any(w in msg_lower for w in ["food", "diet", "veg", "non-veg", "chicken", "khana", "भोजन", "खाना", "உணவு", "భోజనం", "ఆహారం"]):
        reply = kb.get("food_diet", kb["default"])
    elif any(w in msg_lower for w in ["bill", "electricity", "power", "kwh", "बिजली", "बिल", "மின்சாரம்", "பில்", "కరెంట్", "విద్యుత్"]):
        reply = kb.get("bill_reduction", kb["default"])
    elif any(w in msg_lower for w in ["coin", "point", "reward", "redeem", "voucher", "कॉइन", "सिक्के", "रिवॉर्ड", "காயின்", "பரிசு", "కాయిన్"]):
        reply = kb.get("points_balance", kb["default"])
    elif any(w in msg_lower for w in ["why", "spike", "increase", "high", "ज्यादा", "बढ़ा", "ஏன்", "அதிகம்", "ఎందుకు", "ఎక్కువ"]):
        reply = kb.get("why_increase", kb["default"])
    elif any(w in msg_lower for w in ["scope", "org", "company", "esg", "कंपनी", "సంస్థ", "நிறுவனம்"]):
        reply = kb.get("organization_esg", kb["default"])
    else:
        reply = kb["default"]

    return {
        "reply": reply,
        "engine": "domain_knowledge_engine",
        "language": lang,
    }
