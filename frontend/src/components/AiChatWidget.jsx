import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageSquare, 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  RotateCcw,
  Bot,
  User,
  Volume2,
  VolumeX,
  AlertCircle,
  Globe2,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { api } from '../api/client';

export function AiChatWidget() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Namaste! I am EcoTrack's multilingual climate assistant. You can speak or type in English, हिन्दी, தமிழ், తెలుగు, or ಕನ್ನಡ.",
      time: "Just now",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveSpeechPreview, setLiveSpeechPreview] = useState('');
  const [micError, setMicError] = useState(null);
  const [speakingBotIdx, setSpeakingBotIdx] = useState(null);

  // Selected speaking language for Web Speech API
  const langSpeechMap = {
    en: { code: 'en-IN', label: 'English (IN)' },
    hi: { code: 'hi-IN', label: 'हिन्दी' },
    ta: { code: 'ta-IN', label: 'தமிழ்' },
    te: { code: 'te-IN', label: 'తెలుగు' },
    kn: { code: 'kn-IN', label: 'ಕನ್ನಡ' }
  };

  const [speechLang, setSpeechLang] = useState(langSpeechMap[i18n.language]?.code || 'en-IN');
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Sync speech language when app language changes
  useEffect(() => {
    if (langSpeechMap[i18n.language]) {
      setSpeechLang(langSpeechMap[i18n.language].code);
    }
  }, [i18n.language]);

  // Scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, liveSpeechPreview]);

  // Cleanup speech recognition and text-to-speech on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text to Speech playback in regional language
  const speakText = (text, idx) => {
    if (!('speechSynthesis' in window)) {
      setMicError("Speech playback is not supported in this browser.");
      return;
    }

    if (speakingBotIdx === idx) {
      // Toggle off
      window.speechSynthesis.cancel();
      setSpeakingBotIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang || 'en-IN';
    utterance.onend = () => setSpeakingBotIdx(null);
    utterance.onerror = () => setSpeakingBotIdx(null);
    
    setSpeakingBotIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  // Start speech recognition
  const startListening = () => {
    setMicError(null);
    setLiveSpeechPreview('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari, or type your message.");
      return;
    }

    // Stop any existing session
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onresult = (event) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }

        if (finalText) {
          setInputText((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalText.trim()}` : finalText.trim();
          });
          setLiveSpeechPreview('');
        } else if (interimText) {
          setLiveSpeechPreview(interimText);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        let errorMsg = "Could not recognize speech. Please try again or type your message.";
        if (event.error === 'not-allowed') {
          errorMsg = "Microphone access was denied. Please allow microphone permission in your browser settings to speak.";
        } else if (event.error === 'no-speech') {
          errorMsg = "No speech detected. Click the microphone and try speaking again.";
        } else if (event.error === 'audio-capture') {
          errorMsg = "No microphone found. Please connect a microphone and try again.";
        } else if (event.error === 'network') {
          errorMsg = "Network error during speech recognition. Please check your internet connection.";
        }
        setMicError(errorMsg);
        setIsListening(false);
        setLiveSpeechPreview('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setLiveSpeechPreview('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setMicError("Unable to access microphone. Please ensure microphone permissions are granted.");
      setIsListening(false);
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setLiveSpeechPreview('');
  };

  // Toggle speech recognition
  const toggleSpeech = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Close widget and stop any audio / speech processes
  const handleClose = () => {
    stopListening();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingBotIdx(null);
    setIsOpen(false);
  };

  // Submit message to AI
  const handleSend = async (textToSend = null) => {
    // If currently listening, stop it first
    if (isListening) {
      stopListening();
    }

    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userMsg = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLiveSpeechPreview('');
    setMicError(null);
    setLoading(true);

    try {
      const res = await api.chatWithAssistant(query, i18n.language);
      const botMsg = {
        sender: 'bot',
        text: res.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: t('chat.placeholder', "I am here to help! You can check your verified bills in Evidence or track low-cost AC and transit swaps in What-If."),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: "💡 Low-Cost Swaps", text: "How can I reduce my carbon footprint without spending much money?" },
    { label: "🪙 Carbon Coins", text: "How many verified carbon reduction points have I earned?" },
    { label: "⚡ बिजली बिल", text: "बिजली बिल घटाकर कार्बन कॉइन्स कैसे कमाएं?" },
    { label: "🌱 தமிழ்", text: "குறைந்த செலவில் கார்பனை குறைக்கும் வழிகள் என்ன?" },
    { label: "🌞 తెలుగు", text: "రూఫ్‌టాప్ సోలార్ ప్యానెల్స్ వలన ఎంత ఆదా అవుతుంది?" },
    { label: "🌾 ಕನ್ನಡ", text: "ಕಡಿಮೆ ವೆಚ್ಚದಲ್ಲಿ ಮನೆಯ ಇಂಗಾಲದ ಪ್ರಮಾಣ ಕಡಿಮೆ ಮಾಡುವುದು ಹೇಗೆ?" },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50">
      
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white shadow-xl hover:scale-105 transition-all flex items-center justify-center border border-emerald-600/40"
          title={t('chat.title', "Chat with EcoTrack Assistant")}
        >
          <Bot className="w-7 h-7 text-emerald-200" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-[380px] sm:w-[420px] max-w-[calc(100vw-2rem)] h-[560px] rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-emerald-950 text-white p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-emerald-300">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm tracking-tight">{t('chat.title', 'EcoTrack Assistant')}</h4>
                  <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 rounded-md">LIVE</span>
                </div>
                <span className="text-[11px] text-emerald-300 block">
                  Vernacular Speech & Text AI
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleClose} 
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Voice Language Selector & Quick Mode Bar */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Globe2 className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-[11px] text-slate-500 font-bold">Voice Language:</span>
            </div>
            <select
              value={speechLang}
              onChange={(e) => setSpeechLang(e.target.value)}
              className="text-[11px] font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="en-IN">English (India)</option>
              <option value="hi-IN">हिन्दी (Hindi)</option>
              <option value="ta-IN">தமிழ் (Tamil)</option>
              <option value="te-IN">తెలుగు (Telugu)</option>
              <option value="kn-IN">ಕನ್ನಡ (Kannada)</option>
            </select>
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2 bg-white border-b border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp.text)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 font-medium transition-all"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-50/50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-emerald-800 text-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                
                <div
                  className={`max-w-[82%] p-3.5 rounded-2xl leading-relaxed shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-emerald-800 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                  }`}
                >
                  <p className="text-xs">{m.text}</p>
                  
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-black/5 gap-2">
                    <span className={`text-[10px] ${m.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'}`}>
                      {m.time}
                    </span>
                    {m.sender === 'bot' && (
                      <button
                        type="button"
                        onClick={() => speakText(m.text, idx)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 p-0.5 transition-colors"
                        title={speakingBotIdx === idx ? "Stop speaking" : "Listen in voice"}
                      >
                        {speakingBotIdx === idx ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                            <span className="text-rose-600">Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{t('chat.voice_speak', 'Listen')}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span>Thinking in {i18n.language.toUpperCase()}...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Active Listening Indicator Banner */}
          {isListening && (
            <div className="px-4 py-2.5 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                <span className="text-xs font-bold text-emerald-900">
                  Listening in {langSpeechMap[Object.keys(langSpeechMap).find(k => langSpeechMap[k].code === speechLang)]?.label || 'Voice'}...
                </span>
              </div>
              <button
                type="button"
                onClick={stopListening}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100 transition-all shadow-xs"
              >
                Stop Listening
              </button>
            </div>
          )}

          {/* Interim Real-Time Speech Preview */}
          {liveSpeechPreview && (
            <div className="px-4 py-1.5 bg-emerald-50/70 text-emerald-800 text-[11px] italic border-t border-emerald-100 truncate">
              Hearing: "{liveSpeechPreview}..."
            </div>
          )}

          {/* Microphone Error Alert */}
          {micError && (
            <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                <span className="text-[11px] leading-tight">{micError}</span>
              </div>
              <button 
                onClick={() => setMicError(null)} 
                className="text-rose-500 hover:text-rose-700 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Input Controls */}
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="flex items-center gap-2">
              
              {/* Microphone Button */}
              <button
                type="button"
                onClick={toggleSpeech}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
                  isListening 
                    ? 'bg-rose-600 text-white border-rose-700 shadow-md animate-pulse ring-2 ring-rose-400' 
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 shadow-xs'
                }`}
                title={isListening ? "Listening... Click to stop" : "Click to speak with microphone"}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 text-white" />
                ) : (
                  <Mic className="w-4 h-4 text-emerald-700" />
                )}
              </button>

              {/* Text Input Field for Typing or Reviewing/Editing Voice Input */}
              <input
                type="text"
                placeholder={isListening ? "Listening... Speak naturally" : t('chat.placeholder', "Ask about footprint, bills, or swaps...")}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputText.trim() || loading}
                className="p-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs disabled:opacity-40 transition-all flex items-center justify-center"
                title="Send message to AI"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400">
              <span>Press Enter or Send to submit</span>
              <span>Review speech before sending</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default AiChatWidget;