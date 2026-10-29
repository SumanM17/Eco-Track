import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Send, 
  Sparkles, 
  Volume2, 
  Plus, 
  Zap, 
  Car, 
  Flame, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Edit3, 
  ArrowRight,
  RotateCcw,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { api } from '../api/client';

export function Log() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Parsed results
  const [parsedData, setParsedData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [assumptions, setAssumptions] = useState([]);
  const [followUp, setFollowUp] = useState(null);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Manual Quick-Form Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualCategory, setManualCategory] = useState('electricity');
  const [manualItem, setManualItem] = useState('');
  const [manualValue, setManualValue] = useState(1);
  const [manualUnit, setManualUnit] = useState('hours');

  // Pre-tested sample sentences in 4 languages
  const samplePrompts = [
    {
      label: "Delhi Summer Day",
      lang: "en",
      text: "Ran 1.5-ton split AC for 6 hours, took petrol cab for 14 km, and ceiling fan ran 8 hours."
    },
    {
      label: "बेंगलुरु टेक दिनचर्या",
      lang: "hi",
      text: "आज 8 घंटे पंखा चला, 15 किमी मेट्रो से ऑफिस गया और शाम को 1 घंटा गैस पर खाना बनाया।"
    },
    {
      label: "சென்னை வழக்கமான நாள்",
      lang: "ta",
      text: "வீட்டில் 5 மணி நேரம் ஏசி ஓடியது, பஸ்ஸில் 12 கிமீ பயணம் செய்தேன் மற்றும் 2 மணி நேரம் சமையல் செய்தேன்."
    },
    {
      label: "హైదరాబాద్ రొటీన్",
      lang: "te",
      text: "ఈ రోజు 4 గంటలు ఏసీ వాడాను, బైక్ మీద 10 కిమీ వెళ్లాను మరియు 30 నిమిషాలు గ్యాస్ స్టవ్ వెలిగించాను."
    },
    {
      label: "ಬೆಂಗಳೂರು ದಿನಚರಿ (Kannada)",
      lang: "kn",
      text: "ಮನೆಯಲ್ಲಿ 4 ಗಂಟೆ ಎಸಿ ಬಳಸಿದೆ, 15 ಕಿಮೀ ನಮ್ಮ ಮೆಟ್ರೋದಲ್ಲಿ ಪ್ರಯಾಣಿಸಿದೆ ಮತ್ತು 1 ಗಂಟೆ ಗ್ಯಾಸ್ ಒಲೆಯಲ್ಲಿ ಅಡುಗೆ ಮಾಡಿದೆ."
    }
  ];

  // Text to Speech in regional language
  const speakRegionalText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langMap = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN' };
      utterance.lang = langMap[i18n.language] || 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  // POST /api/parse/
  const handleParse = async () => {
    if (!inputText || !inputText.trim()) {
      setError("Please type or speak your daily routine first.");
      return;
    }

    setLoading(true);
    setError(null);
    setFeedbackSent(false);

    try {
      const response = await api.parseText(inputText.trim(), i18n.language);
      setParsedData(response);
      setActivities(response.activities || []);
      setAssumptions(response.assumptions || []);
      setFollowUp(response.follow_up_question || null);
    } catch (err) {
      setError(err.message || "Failed to parse routine. Please try again or switch to Mock mode.");
    } finally {
      setLoading(false);
    }
  };

  // Edit chip values
  const handleActivityChange = (index, field, newValue) => {
    const updated = [...activities];
    updated[index] = {
      ...updated[index],
      [field]: field === 'value' ? parseFloat(newValue) || 0 : newValue
    };
    setActivities(updated);

    // Active learning feedback submission
    if (parsedData && !feedbackSent) {
      api.submitFeedback({
        session_id: `session_${Date.now()}`,
        original_text: inputText,
        original_activities: parsedData.activities || [],
        corrected_activities: updated,
        user_comment: "User edited activity parameters in UI"
      }).catch((e) => console.warn('Feedback submit failed', e));
      setFeedbackSent(true);
    }
  };

  // Delete activity chip
  const handleDeleteActivity = (index) => {
    const updated = activities.filter((_, i) => i !== index);
    setActivities(updated);
  };

  // Add custom activity chip
  const handleAddCustomActivity = () => {
    const newAct = {
      category: 'electricity',
      item: 'New Appliance',
      value: 1.0,
      unit: 'hours',
      frequency: 'daily',
      confidence: 1.0
    };
    setActivities([...activities, newAct]);
  };

  // Save manual form submission
  const handleAddManualCategory = (e) => {
    e.preventDefault();
    if (!manualItem.trim()) return;

    const newAct = {
      category: manualCategory,
      item: manualItem.trim(),
      value: parseFloat(manualValue) || 1.0,
      unit: manualUnit,
      frequency: 'daily',
      confidence: 1.0
    };

    setActivities((prev) => [...prev, newAct]);
    setShowManualModal(false);
    setManualItem('');
  };

  // Navigate to Dashboard with calculated emissions
  const handleProceedToDashboard = () => {
    if (activities.length === 0) {
      alert("Please add or parse at least one activity first.");
      return;
    }
    // Store in localStorage for dashboard persistence
    localStorage.setItem('carbonkatha_current_activities', JSON.stringify(activities));
    navigate('/dashboard');
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-seafoam-100 text-seafoam-800 border border-seafoam-300 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-seafoam-600" />
          {t('log.title', 'Log Your Carbon Activities')}
        </span>
        <h1 className="text-3xl font-extrabold text-coastal-900 tracking-tight mb-2">
          {t('nav.log', 'Log Routine')}
        </h1>
        <p className="text-sm text-coastal-600">
          {t('log.subtitle', 'Speak or type your day in English, Hindi, Tamil, or Telugu. Our AI parses and estimates emissions.')}
        </p>
      </div>

      {/* Main Routine Input Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-sm border border-beach-300 mb-6">
        
        {/* Text Area */}
        <div className="relative mb-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
            placeholder={t('log.placeholder', 'e.g. I ran the split AC for 4 hours, took the metro for 15 km, cooked dal for 30 minutes, and fan ran overnight...')}
            className="w-full p-4 rounded-2xl bg-white/95 border border-beach-300 text-coastal-900 placeholder:text-coastal-400 focus:outline-none focus:ring-2 focus:ring-seafoam-500 focus:border-transparent transition-all shadow-inner text-sm sm:text-base resize-none"
          />
          {inputText && (
            <button
              onClick={() => setInputText('')}
              className="absolute top-3 right-3 text-coastal-400 hover:text-coastal-700 p-1"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Input Controls Bar */}
        <div className="flex items-center justify-end gap-4">
          
          {/* Action Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleParse}
            className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-seafoam-700 to-seafoam-800 hover:from-seafoam-800 hover:to-seafoam-900 text-white shadow-md transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('common.loading', 'AI Parsing...')}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{t('log.btn_calculate', 'Parse & Calculate')}</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Tap Demo Sentences */}
        <div className="mt-5 pt-4 border-t border-beach-200">
          <div className="text-xs font-semibold text-coastal-500 mb-2">
            {t('log.sample_prompts_title', 'Try these Indian everyday routines:')}
          </div>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((sample, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setInputText(sample.text);
                  i18n.changeLanguage(sample.lang);
                  localStorage.setItem('carbonkatha_lang', sample.lang);
                }}
                className="text-xs px-3 py-1.5 rounded-full bg-beach-200 hover:bg-beach-300 text-coastal-800 border border-beach-300/80 transition-all font-medium"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-coral-300 text-coral-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs font-bold underline ml-4 hover:text-coral-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Manual Input Quick Categories Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-coastal-500">
            Or Add Specific Categories Directly:
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { cat: 'electricity', label: 'Electricity', icon: Zap, color: 'text-amber-700 bg-amber-50/60 border-amber-200', defaultUnit: 'hours' },
            { cat: 'transport', label: 'Transport', icon: Car, color: 'text-emerald-700 bg-emerald-50/60 border-emerald-200', defaultUnit: 'km' },
            { cat: 'fuel', label: 'Cooking Fuel', icon: Flame, color: 'text-orange-700 bg-orange-50/60 border-orange-200', defaultUnit: 'hours' },
            { cat: 'food', label: 'Diet & Food', icon: Sparkles, color: 'text-yellow-700 bg-yellow-50/60 border-yellow-200', defaultUnit: 'meal' },
            { cat: 'waste', label: 'Solid Waste', icon: Trash2, color: 'text-slate-700 bg-slate-50/60 border-slate-200', defaultUnit: 'kg' },
            { cat: 'shopping', label: 'Shopping', icon: Plus, color: 'text-blue-700 bg-blue-50/60 border-blue-200', defaultUnit: 'items' },
            { cat: 'water', label: 'Water', icon: Sparkles, color: 'text-teal-700 bg-teal-50/60 border-teal-200', defaultUnit: 'kL' },
          ].map((catItem) => {
            const Icon = catItem.icon;
            return (
              <button
                key={catItem.cat}
                type="button"
                onClick={() => {
                  setManualCategory(catItem.cat);
                  setManualUnit(catItem.defaultUnit);
                  setShowManualModal(true);
                }}
                className={`glass-card p-3 rounded-2xl border text-center transition-all hover:scale-[1.02] shadow-xs cursor-pointer ${catItem.color}`}
              >
                <Icon className="w-5 h-5 mx-auto mb-1.5" />
                <div className="font-bold text-xs text-coastal-900">{catItem.label}</div>
                <div className="text-[10px] text-coastal-500 mt-0.5 flex items-center justify-center gap-0.5">
                  <Plus className="w-2.5 h-2.5" /> Add
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editable Activity Chips Section */}
      {activities.length > 0 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-seafoam-300 shadow-md mb-8 bg-white/70">
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-seafoam-600" />
                <h2 className="text-xl font-bold text-coastal-900">
                  Extracted Activities ({activities.length})
                </h2>
              </div>
              <p className="text-xs text-coastal-500 mt-1">
                You can review, adjust quantities, or add missing appliances. Corrections are learned by our model.
              </p>
            </div>

            {parsedData && (
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-seafoam-100 text-seafoam-800 font-semibold border border-seafoam-300">
                  Engine: {parsedData.parser || 'Hybrid AI'}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-beach-200 text-coastal-700 font-semibold uppercase">
                  {parsedData.language_detected || i18n.language}
                </span>
              </div>
            )}
          </div>

          {/* Activity Cards List */}
          <div className="space-y-3 mb-6">
            {activities.map((act, index) => {
              const categoryColors = {
                electricity: 'border-amber-300 bg-amber-50/50 text-amber-800',
                transport: 'border-emerald-300 bg-emerald-50/50 text-emerald-800',
                fuel: 'border-orange-300 bg-orange-50/50 text-orange-800',
                waste: 'border-slate-300 bg-slate-50/50 text-slate-800',
              };

              return (
                <div 
                  key={index}
                  className="p-4 rounded-2xl bg-white border border-beach-300 shadow-xs flex flex-wrap items-center justify-between gap-4 transition-all hover:border-seafoam-400"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${categoryColors[act.category.toLowerCase()] || 'border-beach-300 bg-beach-100 text-coastal-700'}`}>
                      {act.category}
                    </span>
                    <input
                      type="text"
                      value={act.item}
                      onChange={(e) => handleActivityChange(index, 'item', e.target.value)}
                      className="font-bold text-sm text-coastal-900 bg-transparent border-b border-transparent hover:border-beach-300 focus:border-seafoam-500 focus:outline-none px-1"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-beach-100 px-3 py-1.5 rounded-xl border border-beach-300">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={act.value}
                        onChange={(e) => handleActivityChange(index, 'value', e.target.value)}
                        className="w-16 text-center font-bold text-sm text-coastal-900 bg-white rounded-lg border border-beach-300 focus:outline-none focus:ring-1 focus:ring-seafoam-500 py-0.5"
                      />
                      <input
                        type="text"
                        value={act.unit}
                        onChange={(e) => handleActivityChange(index, 'unit', e.target.value)}
                        className="w-14 text-xs font-semibold text-coastal-600 bg-transparent focus:outline-none"
                      />
                    </div>

                    <span 
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        act.confidence >= 0.85 ? 'bg-seafoam-100 text-seafoam-800' : 'bg-amber-100 text-amber-800'
                      }`}
                      title="AI Extraction Confidence"
                    >
                      {Math.round((act.confidence || 0.8) * 100)}% conf
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteActivity(index)}
                      className="p-1.5 text-coastal-400 hover:text-coral-500 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove activity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add another activity button */}
          <div className="flex items-center justify-between border-t border-beach-200 pt-4 mb-6">
            <button
              type="button"
              onClick={handleAddCustomActivity}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-seafoam-700 hover:text-seafoam-800"
            >
              <Plus className="w-4 h-4" />
              <span>Add another appliance / journey</span>
            </button>
            {feedbackSent && (
              <span className="text-[11px] text-seafoam-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Corrections saved to learning DB
              </span>
            )}
          </div>

          {/* Assumptions & Follow-up Question Cards with Voice Readout */}
          {(assumptions.length > 0 || followUp) && (
            <div className="space-y-3 mb-6">
              {assumptions.length > 0 && (
                <div className="p-4 rounded-2xl bg-beach-100/80 border border-beach-300 text-xs">
                  <div className="font-bold text-coastal-800 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-coastal-600" />
                      {t('log.assumptions_title', 'Sensible Defaults & Assumptions Made')}:
                    </span>
                    <button
                      type="button"
                      onClick={() => speakRegionalText(assumptions.join('. '))}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-seafoam-700 hover:text-seafoam-900 px-2.5 py-1 rounded-full bg-white border border-beach-300 shadow-xs"
                      title="Listen in regional language"
                    >
                      <Volume2 className="w-3 h-3 text-seafoam-700" />
                      <span>{t('chat.voice_speak', 'Listen')}</span>
                    </button>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-coastal-600 pl-1">
                    {assumptions.map((assump, i) => (
                      <li key={i}>{assump}</li>
                    ))}
                  </ul>
                </div>
              )}

              {followUp && (
                <div className="p-3.5 rounded-2xl bg-seafoam-50 border border-seafoam-200 text-xs text-seafoam-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-seafoam-600 flex-shrink-0" />
                    <div>
                      <span className="font-bold">{t('log.follow_up_title', 'Follow-up Clarification')}: </span>
                      <span>{followUp}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakRegionalText(followUp)}
                    className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-seafoam-700 hover:text-seafoam-900 px-2.5 py-1 rounded-full bg-white border border-seafoam-300 shadow-xs"
                    title="Speak in regional language"
                  >
                    <Volume2 className="w-3 h-3 text-seafoam-700" />
                    <span>{t('chat.voice_speak', 'Listen')}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CTA: Calculate Footprint & View Dashboard */}
          <div className="text-right">
            <button
              type="button"
              onClick={handleProceedToDashboard}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-bold bg-gradient-to-r from-seafoam-700 to-ocean-600 hover:from-seafoam-800 hover:to-ocean-700 text-white shadow-lg transition-all hover:scale-[1.02]"
            >
              <span>{t('dashboard.ask_ai_btn', 'Calculate Footprint & View Dashboard')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* Manual Quick Add Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-coastal-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-beach-300 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-coastal-900 capitalize">
                Add {manualCategory} Entry
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-coastal-400 hover:text-coastal-700 p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-coastal-700 uppercase mb-1">
                  Item / Appliance Name
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    manualCategory === 'electricity' ? 'e.g. 1.5-ton Split AC' :
                    manualCategory === 'transport' ? 'e.g. Petrol Car or Metro' :
                    manualCategory === 'fuel' ? 'e.g. LPG Stove' : 'e.g. Kitchen Food Scraps'
                  }
                  value={manualItem}
                  onChange={(e) => setManualItem(e.target.value)}
                  className="w-full p-3 rounded-xl border border-beach-300 focus:outline-none focus:ring-2 focus:ring-seafoam-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-coastal-700 uppercase mb-1">
                    Value / Quantity
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    required
                    value={manualValue}
                    onChange={(e) => setManualValue(e.target.value)}
                    className="w-full p-3 rounded-xl border border-beach-300 focus:outline-none focus:ring-2 focus:ring-seafoam-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-coastal-700 uppercase mb-1">
                    Unit
                  </label>
                  <select
                    value={manualUnit}
                    onChange={(e) => setManualUnit(e.target.value)}
                    className="w-full p-3 rounded-xl border border-beach-300 focus:outline-none focus:ring-2 focus:ring-seafoam-500 text-sm bg-white"
                  >
                    <option value="hours">Hours</option>
                    <option value="km">Kilometers (km)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="units">kWh (Units)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-beach-200">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-coastal-600 hover:bg-beach-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full text-xs font-bold bg-seafoam-700 hover:bg-seafoam-800 text-white shadow-sm"
                >
                  Add to Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Log;
