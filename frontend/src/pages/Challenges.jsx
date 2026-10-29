import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Trophy, 
  Flame, 
  TreePine, 
  Lightbulb, 
  Award, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Users
} from 'lucide-react';

export function Challenges() {
  const { t, i18n } = useTranslation();
  const [completedChallenges, setCompletedChallenges] = useState(['c1']);

  // Weekly challenges
  const challenges = [
    {
      id: 'c1',
      title: i18n.language === 'hi' ? 'नो-एसी संडे' :
             i18n.language === 'ta' ? 'ஏசி இல்லாத ஞாயிறு' :
             i18n.language === 'te' ? 'ఏసీ లేని ఆదివారం' :
             'No-AC Sunday',
      desc: i18n.language === 'hi' ? 'पूरे रविवार एसी बंद रखें और प्राकृतिक वेंटिलेशन या पंखे का उपयोग करें।' :
            i18n.language === 'ta' ? 'ஞாயிறு முழுவதும் ஏசி இல்லாமல் இயற்கை காற்று அல்லது விசிறியைப் பயன்படுத்தவும்.' :
            i18n.language === 'te' ? 'ఆదివారం మొత్తం ఏసీ లేకుండా సహజ గాలి లేదా ఫ్యాన్ వాడండి.' :
            'Keep AC off for the entire Sunday and rely on natural ventilation and fan.',
      reward: '50 Green Points',
      category: 'Electricity',
      daysLeft: 3
    },
    {
      id: 'c2',
      title: i18n.language === 'hi' ? 'पब्लिक ट्रांजिट राइडर' :
             i18n.language === 'ta' ? 'பொதுப் போக்குவரத்து பயணம்' :
             i18n.language === 'te' ? 'ప్రజా రవాణా ప్రయాణం' :
             'Public Transit Commute',
      desc: i18n.language === 'hi' ? 'कम से कम 10 किमी की दूरी बस या मेट्रो से तय करें।' :
            i18n.language === 'ta' ? 'குறைந்தது 10 கி.மீ தொலைவை பேருந்து அல்லது மெட்ரோவில் கடக்கவும்.' :
            i18n.language === 'te' ? 'కనీసం 10 కి.మీ బస్సు లేదా మెట్రోలో ప్రయాణించండి.' :
            'Commute at least 10 km using Metro or City Electric Bus.',
      reward: '40 Green Points',
      category: 'Transport',
      daysLeft: 5
    },
    {
      id: 'c3',
      title: i18n.language === 'hi' ? 'ज़ीरो वेस्ट किचन डे' :
             i18n.language === 'ta' ? 'பூஜ்ஜிய கழிவு சமையலறை' :
             i18n.language === 'te' ? 'జీరో వేస్ట్ కిచెన్ డే' :
             'Zero Food Waste Day',
      desc: i18n.language === 'hi' ? 'आज के दिन कोई खाना न फेंकें और छिलकों से खाद बनाएं।' :
            i18n.language === 'ta' ? 'இன்று எந்த உணவையும் வீணாக்காமல் உரம் தயாரிக்கவும்.' :
            i18n.language === 'te' ? 'ఈ రోజు ఆహారాన్ని వృథా చేయకుండా తొక్కలను కంపోస్ట్ చేయండి.' :
            'Ensure zero plate food waste and compost all organic kitchen scraps.',
      reward: '30 Green Points',
      category: 'Waste',
      daysLeft: 2
    },
    {
      id: 'c4',
      title: i18n.language === 'hi' ? 'सीलिंग फैन लेवल 3 स्पीड' :
             i18n.language === 'ta' ? 'மின்விசிறி வேகம் 3' :
             i18n.language === 'te' ? 'సీలింగ్ ఫ్యాన్ స్పీడ్ 3' :
             'Fan Speed Calibration',
      desc: i18n.language === 'hi' ? 'पंखा फुल स्पीड 5 के बजाय 3 या 4 पर चलाएं (25% ऊर्जा बचत)।' :
            i18n.language === 'ta' ? 'மின்விசிறியை 5-க்கு பதில் 3 அல்லது 4-ல் இயக்கவும்.' :
            i18n.language === 'te' ? 'ఫ్యాన్‌ని 5 కాకుండా 3 లేదా 4 స్పీడ్‌లో నడపండి.' :
            'Run ceiling fan at speed 3 or 4 instead of maximum speed 5 (25% power cut).',
      reward: '25 Green Points',
      category: 'Electricity',
      daysLeft: 6
    }
  ];

  // Did You Know facts
  const didYouKnowList = [
    {
      fact: i18n.language === 'hi' 
        ? 'क्या आप जानते हैं? भारत में एसी का तापमान 24°C से 26°C करने से 1 वर्ष में देश भर में 20 अरब यूनिट बिजली बच सकती है!'
        : i18n.language === 'ta'
        ? 'உங்களுக்குத் தெரியுமா? இந்தியாவில் ஏசி வெப்பநிலையை 24°C-லிருந்து 26°C ஆக உயர்த்தினால் ஆண்டிற்கு 20 பில்லியன் யூனிட் மின்சாரம் மிச்சமாகும்!'
        : i18n.language === 'te'
        ? 'మీకు తెలుసా? భారతదేశంలో ఏసీ ఉష్ణోగ్రతను 24°C నుండి 26°C కి పెంచితే సంవత్సరానికి 20 బిలియన్ యూనిట్ల విద్యుత్ ఆదా అవుతుంది!'
        : 'Did you know? Setting your AC to 26°C instead of 20°C reduces compressor power draw by up to 36% while keeping the room cool with a ceiling fan.'
    },
    {
      fact: i18n.language === 'hi'
        ? 'दिल्ली मेट्रो हर साल शहर की सड़कों से 3.9 लाख से अधिक वाहनों का धुआं और जाम कम करती है।'
        : i18n.language === 'ta'
        ? 'மெட்ரோ ரயில்கள் சாலைகளில் நெரிசல் மற்றும் வாகனப் புகையை பெருமளவில் குறைக்கின்றன.'
        : i18n.language === 'te'
        ? 'మెట్రో రైలు ప్రయాణం వల్ల నగరాల్లో రోడ్డు ట్రాఫిక్ మరియు కాలుష్యం భారీగా తగ్గుతాయి.'
        : 'Did you know? Switching a 15 km daily car commute to an electric metro saves approximately 850 kg CO₂e per year.'
    }
  ];

  const toggleChallenge = (id) => {
    if (completedChallenges.includes(id)) {
      setCompletedChallenges(completedChallenges.filter(c => c !== id));
    } else {
      setCompletedChallenges([...completedChallenges, id]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-seafoam-100 text-seafoam-800 border border-seafoam-300 mb-2">
            <Award className="w-3.5 h-3.5 text-seafoam-600" />
            Gamification & Habit Building
          </span>
          <h1 className="text-3xl font-extrabold text-coastal-900 tracking-tight">
            {t('nav.challenges')}
          </h1>
          <p className="text-sm text-coastal-600 mt-1">
            Complete weekly climate micro-actions, grow your virtual Planet Tree, and level up with friends.
          </p>
        </div>
      </div>

      {/* Planet Tree & Streak Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Planet Tree Card */}
        <div className="md:col-span-2 glass-card p-6 sm:p-7 rounded-3xl border border-beach-300 relative overflow-hidden flex flex-col sm:flex-row items-center gap-6">
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-seafoam-100 to-seafoam-200 border border-seafoam-300 flex items-center justify-center flex-shrink-0 shadow-inner">
            <TreePine className="w-16 h-16 text-seafoam-700 animate-bounce duration-1000" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-seafoam-200 text-seafoam-800 mb-1.5">
              Stage 3: Flourishing Neem Tree
            </div>
            <h2 className="text-xl font-bold text-coastal-900 mb-1">Your Virtual Planet Tree</h2>
            <p className="text-xs text-coastal-600 mb-3">
              Your consistent reductions have watered this tree for 12 days. Complete 2 more weekly challenges to unlock Stage 4 (Fruit-bearing Banyan).
            </p>
            <div className="w-full bg-beach-200 rounded-full h-2.5 overflow-hidden">
              <div className="bg-seafoam-600 h-full rounded-full w-3/4 transition-all duration-700" />
            </div>
            <div className="flex justify-between text-[11px] text-coastal-500 font-semibold mt-1">
              <span>Progress: 75%</span>
              <span>150 / 200 XP</span>
            </div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="glass-card p-6 rounded-3xl border border-coral-200 bg-coral-50/30 flex flex-col justify-between text-center">
          <div>
            <div className="w-12 h-12 bg-coral-100 text-coral-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Flame className="w-6 h-6 fill-coral-500" />
            </div>
            <div className="text-3xl font-black text-coral-600 mb-0.5">7 Days</div>
            <div className="text-xs font-bold text-coastal-700 uppercase tracking-wider">Active Daily Streak</div>
          </div>
          <p className="text-[11px] text-coastal-600 mt-2">
            Logged your day 7 days in a row. Log tomorrow to unlock the "Consistent Climber" badge!
          </p>
        </div>

      </div>

      {/* Did You Know Fact Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-beach-200 to-seafoam-100 border border-beach-300 text-xs text-coastal-800 mb-8 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-coastal-900">Did You Know? </span>
          <span>{didYouKnowList[0].fact}</span>
        </div>
      </div>

      {/* Weekly Challenges List */}
      <h2 className="text-xl font-bold text-coastal-900 mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-seafoam-600" />
        Active Weekly Challenges
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {challenges.map((ch) => {
          const isDone = completedChallenges.includes(ch.id);

          return (
            <div 
              key={ch.id}
              className={`glass-card p-5 rounded-3xl border transition-all ${
                isDone ? 'border-seafoam-400 bg-seafoam-50/40' : 'border-beach-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-beach-200 text-coastal-700">
                  {ch.category}
                </span>
                <span className="text-[11px] text-coastal-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {ch.daysLeft} days left
                </span>
              </div>

              <h3 className="font-bold text-base text-coastal-900 mb-1">
                {ch.title}
              </h3>
              <p className="text-xs text-coastal-600 mb-4 leading-relaxed">
                {ch.desc}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-beach-200">
                <span className="text-xs font-bold text-seafoam-700">
                  +{ch.reward}
                </span>
                <button
                  onClick={() => toggleChallenge(ch.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isDone 
                      ? 'bg-seafoam-700 text-white' 
                      : 'bg-white hover:bg-beach-200 text-coastal-800 border border-beach-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isDone ? 'Completed' : 'Mark Done'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default Challenges;
