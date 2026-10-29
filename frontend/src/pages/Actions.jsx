import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle2, 
  Sparkles, 
  TrendingDown, 
  IndianRupee, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight,
  Zap,
  Car,
  Flame,
  Trash2
} from 'lucide-react';

export function Actions() {
  const { t, i18n } = useTranslation();
  const [adoptedActions, setAdoptedActions] = useState([]);

  // Carbon budget data
  const budget = {
    limit: 6.5,
    current: 4.8,
    unit: 'kg CO₂e/day',
    percentage: Math.round((4.8 / 6.5) * 100)
  };

  // High-impact catalog tailored to Indian households
  const actionCatalog = [
    {
      id: 'ac_26',
      category: 'Electricity',
      icon: Zap,
      title: i18n.language === 'hi' ? 'एसी 24°C से 26°C पर सेट करें' :
             i18n.language === 'ta' ? 'ஏசி 24°C-லிருந்து 26°C ஆக மாற்றவும்' :
             i18n.language === 'te' ? 'ఏసీని 24°C నుండి 26°C కి మార్చండి' :
             'Set AC to 26°C instead of 22°C',
      why: i18n.language === 'hi' ? 'प्रत्येक 1°C तापमान बढ़ाने से बिजली की खपत 6% कम होती है।' :
           i18n.language === 'ta' ? 'ஒவ்வொரு 1°C அதிகரிப்பும் 6% மின்சாரத்தை மிச்சப்படுத்துகிறது.' :
           i18n.language === 'te' ? 'ప్రతి 1°C పెంచితే 6% విద్యుత్ వినియోగం తగ్గుతుంది.' :
           'Every 1°C increase saves up to 6% compressor electricity consumption.',
      howto: i18n.language === 'hi' ? 'रिमोट से तापमान 26°C करें और साथ में पंखा चलाएं। रूम कूल रहेगा।' :
             i18n.language === 'ta' ? 'ரிமோட்டில் 26°C அமைத்து மின்விசிறியை குறைந்த வேகத்தில் இயக்கவும்.' :
             i18n.language === 'te' ? 'రిమోట్‌లో 26°C సెట్ చేసి సీలింగ్ ఫ్యాన్ తక్కువ వేగంతో నడపండి.' :
             'Use ceiling fan at low speed along with AC set to 26°C for optimum comfort.',
      co2Saved: '1.4 kg/day',
      rupeesSaved: '₹ 450/mo',
      color: 'border-amber-200 bg-amber-50/40 text-amber-700'
    },
    {
      id: 'metro_swap',
      category: 'Transport',
      icon: Car,
      title: i18n.language === 'hi' ? 'सप्ताह में 2 दिन कैब की जगह मेट्रो लें' :
             i18n.language === 'ta' ? 'வாரத்தில் 2 நாட்கள் மெட்ரோ ரயிலில் பயணிக்கவும்' :
             i18n.language === 'te' ? 'వారంలో 2 రోజులు క్యాబ్‌కి బదులుగా మెట్రో తీసుకోండి' :
             'Swap solo cab commute with Metro twice a week',
      why: i18n.language === 'hi' ? 'मेट्रो का प्रति किमी कार्बन फुटप्रिंट कैब से 75% कम है।' :
           i18n.language === 'ta' ? 'மெட்ரோ ரயில் டாக்ஸியை விட 75% குறைவான கார்பனை வெளியிடுகிறது.' :
           i18n.language === 'te' ? 'క్యాబ్ కంటే మెట్రో 75% తక్కువ కార్బన్ ఉద్గారాలను కలిగిస్తుంది.' :
           'Urban metro produces 75% less CO₂ per passenger-km compared to single-occupancy cabs.',
      howto: i18n.language === 'hi' ? 'नजदीकी स्टेशन के लिए ई-रिक्शा या वॉक करें और स्मार्ट कार्ड इस्तेमाल करें।' :
             i18n.language === 'ta' ? 'அருகிலுள்ள நிலையத்திற்கு நடக்கலாம் மற்றும் ஸ்மார்ட் கார்டு பயன்படுத்தவும்.' :
             i18n.language === 'te' ? 'సమీప మెట్రో స్టేషన్ కోసం స్మార్ట్ కార్డ్ వాడండి.' :
             'Combine walking or e-rickshaw for first-mile connectivity with metro smart card.',
      co2Saved: '3.2 kg/trip',
      rupeesSaved: '₹ 800/mo',
      color: 'border-emerald-200 bg-emerald-50/40 text-emerald-700'
    },
    {
      id: 'lid_cooking',
      category: 'Cooking Fuel',
      icon: Flame,
      title: i18n.language === 'hi' ? 'खाना पकाते समय ढक्कन का प्रयोग करें' :
             i18n.language === 'ta' ? 'சமைக்கும் போது மூடி வைக்கவும்' :
             i18n.language === 'te' ? 'వండేటప్పుడు పాత్రపై మూత ఉంచండి' :
             'Always cover cooking pots with tight lids',
      why: i18n.language === 'hi' ? 'भाप रुकने से खाना 30% तेजी से पकता है और एलपीजी गैस बचती है।' :
           i18n.language === 'ta' ? 'நீராவி உள்ளேயே தங்குவதால் சமையல் விரைவாகி எல்பிஜி சேமிக்கப்படும்.' :
           i18n.language === 'te' ? 'ఆవిరి బయటకు పోకుండా త్వరగా ఉడికి ఎల్పీజీ సిలిండర్ ఆదా అవుతుంది.' :
           'Traps steam and heat, reducing gas consumption and cooking duration by 25-30%.',
      howto: i18n.language === 'hi' ? 'दाल या सब्जी उबालते समय बर्तन को फ्लैट ढक्कन से ढकें।' :
             i18n.language === 'ta' ? 'பருப்பு அல்லது காய்கறிகளை கொதிக்க வைக்கும்போது மூடி வைக்கவும்.' :
             i18n.language === 'te' ? 'కూరగాయలు లేదా పప్పు ఉడికించేటప్పుడు సరైన మూత వాడండి.' :
             'Fit the lid properly before simmering on medium-to-low flame.',
      co2Saved: '0.3 kg/day',
      rupeesSaved: '₹ 150/mo',
      color: 'border-orange-200 bg-orange-50/40 text-orange-700'
    },
    {
      id: 'segregate_waste',
      category: 'Waste',
      icon: Trash2,
      title: i18n.language === 'hi' ? 'गीला और सूखा कचरा अलग करें' :
             i18n.language === 'ta' ? 'ஈர மற்றும் உலர் கழிவுகளை பிரிக்கவும்' :
             i18n.language === 'te' ? 'తడి మరియు పొడి చెత్తను వేరు చేయండి' :
             'Segregate wet kitchen waste from recyclables',
      why: i18n.language === 'hi' ? 'लैंडफिल में गीला कचरा मीथेन गैस बनाता है जो CO₂ से 28 गुना अधिक हानिकारक है।' :
           i18n.language === 'ta' ? 'ஈரக் கழிவுகள் காற்றில்லா சூழலில் அதிக மீத்தேன் வாயுவை உருவாக்குகின்றன.' :
           i18n.language === 'te' ? 'తడి వ్యర్థాలు కుళ్లిపోయినప్పుడు హానికరమైన మీథేన్ వాయువు విడుదలవుతుంది.' :
           'Prevents anaerobic decomposition in landfills which emits potent methane gas (28x worse than CO₂).',
      howto: i18n.language === 'hi' ? 'रसोई में दो अलग डिब्बे रखें - हरा गीले छिलकों के लिए, नीला प्लास्टिक/कागज़ के लिए।' :
             i18n.language === 'ta' ? 'பச்சை தொட்டியில் காய்கறி கழிவுகளையும், நீல தொட்டியில் பிளாஸ்டிக்கையும் போடவும்.' :
             i18n.language === 'te' ? 'వంటగదిలో రెండు వేర్వేరు డబ్బాలు ఉంచి తడి, పొడి చెత్తను వేరు చేయండి.' :
             'Keep a green dustbin for food scraps and a dry bin for plastics, paper, and metal.',
      co2Saved: '0.5 kg/day',
      rupeesSaved: '₹ 100/mo',
      color: 'border-cyan-200 bg-cyan-50/40 text-cyan-700'
    }
  ];

  const toggleAdopt = (id) => {
    if (adoptedActions.includes(id)) {
      setAdoptedActions(adoptedActions.filter(a => a !== id));
    } else {
      setAdoptedActions([...adoptedActions, id]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-seafoam-100 text-seafoam-800 border border-seafoam-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-seafoam-600" />
            Practical Reductions & Swaps
          </span>
          <h1 className="text-3xl font-extrabold text-coastal-900 tracking-tight">
            {t('nav.actions')}
          </h1>
          <p className="text-sm text-coastal-600 mt-1">
            Tailored carbon reductions for Indian households that cut emissions and save money simultaneously.
          </p>
        </div>
      </div>

      {/* Carbon Budget Meter & Warning Banner */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-beach-300 shadow-sm mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-seafoam-600" />
            <h2 className="text-lg font-bold text-coastal-900">Daily Carbon Budget</h2>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-beach-200 text-coastal-800 border border-beach-300">
            Target: {budget.limit} {budget.unit}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-beach-200 rounded-full h-3.5 mb-3 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${
              budget.percentage > 85 ? 'bg-coral-500' : 'bg-seafoam-600'
            }`}
            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-coastal-600 font-medium">
          <span>Used: {budget.current} kg CO₂e ({budget.percentage}%)</span>
          <span>Remaining: {(budget.limit - budget.current).toFixed(1)} kg CO₂e safe headroom</span>
        </div>

        {budget.percentage > 70 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>
              <strong>Budget Warning:</strong> You have consumed over 70% of your daily safe footprint. Adopting 1 swap below keeps you comfortably green.
            </span>
          </div>
        )}
      </div>

      {/* Action Recommendation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actionCatalog.map((action) => {
          const Icon = action.icon;
          const isAdopted = adoptedActions.includes(action.id);

          return (
            <div 
              key={action.id}
              className={`glass-card rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between ${
                isAdopted ? 'border-seafoam-400 bg-seafoam-50/40 shadow-md ring-2 ring-seafoam-400/20' : 'border-beach-300 hover:border-beach-400'
              }`}
            >
              <div>
                {/* Category & Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${action.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {action.category}
                  </span>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="text-seafoam-700">-{action.co2Saved}</span>
                    <span className="text-coastal-400">•</span>
                    <span className="text-amber-700">{action.rupeesSaved}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-coastal-900 mb-2">
                  {action.title}
                </h3>

                {/* Why It Works */}
                <div className="mb-2">
                  <div className="text-[11px] font-bold text-coastal-500 uppercase tracking-wider mb-0.5">Why it works</div>
                  <p className="text-xs text-coastal-700 leading-relaxed">{action.why}</p>
                </div>

                {/* Short How-To */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold text-coastal-500 uppercase tracking-wider mb-0.5">How-to guide</div>
                  <p className="text-xs text-coastal-600 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-beach-200">
                    {action.howto}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => toggleAdopt(action.id)}
                className={`w-full py-2.5 px-4 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  isAdopted
                    ? 'bg-seafoam-700 text-white shadow-sm'
                    : 'bg-white hover:bg-beach-200 text-coastal-800 border border-beach-300 shadow-sm'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${isAdopted ? 'text-white' : 'text-seafoam-600'}`} />
                <span>{isAdopted ? "I'm doing this!" : "I'll do this"}</span>
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default Actions;
