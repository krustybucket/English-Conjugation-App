import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Check, ArrowRight, RefreshCw, BookOpen, Trophy, AlertCircle, Sparkles, Globe, Loader2, Settings, Sliders, X, Filter, Search, Zap, Moon, Sun, Key, Volume2, XCircle, CheckCircle } from 'lucide-react';
import {getStaticData} from './data';

const ConjugationApp = () => {
  // Load data
  const { ALL_TENSES, ALL_VERBS, CUSTOM_LIBRARY } = useMemo(() => getStaticData(), []);

  // State
  const [exercises, setExercises] = useState([]); 
  const [prefetchedExercises, setPrefetchedExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState("idle"); 
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  
  // New State for improvements
  const [mistakes, setMistakes] = useState([]); // Track missed questions
  const [shake, setShake] = useState(false); // For visual feedback animation
  
  // Loading States
  const [isFetching, setIsFetching] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(false);
  
  const [apiError, setApiError] = useState(null);
  const [view, setView] = useState('settings');
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Settings State - Start Empty
  const [selectedTenses, setSelectedTenses] = useState([]);
  const [selectedVerbs, setSelectedVerbs] = useState([]);
  const [verbSearchTerm, setVerbSearchTerm] = useState("");
  const [batchSize, setBatchSize] = useState(5);

  const inputRef = useRef(null);
  const currentExercise = exercises[currentExerciseIndex];

  // Initialize theme
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Focus management
  useEffect(() => {
    if (view === 'practice' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentExerciseIndex, view]);

  // Background Prefetch
  useEffect(() => {
    if ((view === 'practice' || view === 'summary') && prefetchedExercises.length === 0 && !isPrefetching && !isFetching) {
      prefetchNextRound();
    }
  }, [view, prefetchedExercises.length, isPrefetching, isFetching]);

  // --- HELPER FUNCTIONS ---

  const toggleTense = (tense) => {
    setSelectedTenses(prev => 
      prev.includes(tense) ? prev.filter(t => t !== tense) : [...prev, tense]
    );
  };

  const toggleVerb = (verb) => {
    setSelectedVerbs(prev => 
      prev.includes(verb) ? prev.filter(v => v !== verb) : [...prev, verb]
    );
  };

  const selectAllTenses = () => setSelectedTenses(ALL_TENSES);
  const selectNoTenses = () => setSelectedTenses([]);
  const selectAllVerbs = () => setSelectedVerbs(ALL_VERBS);
  const selectNoVerbs = () => setSelectedVerbs([]);

  // --- EXERCISE LOGIC (LOCAL ONLY) ---

  const getExercises = async (targetCount, tenses, verbs) => {
    const resultsContainer = [];
    const seenSentences = new Set();
    
    // Filter custom library for matches (CASE INSENSITIVE)
    const customMatches = CUSTOM_LIBRARY.filter(item => 
        tenses.includes(item.tense) && 
        verbs.some(v => v.toLowerCase() === item.verb.toLowerCase())
    );
    
    // Shuffle and pick
    const shuffledCustom = [...customMatches].sort(() => 0.5 - Math.random());
    
    for (const item of shuffledCustom) {
        if (resultsContainer.length >= targetCount) break;
        
        // Parse sentence to extract answer
        const match = item.text.match(/^(.*?)\[(.*?)\](.*)$/);
        
        if (match && !seenSentences.has(item.text)) {
            resultsContainer.push({
                id: `custom-${Date.now()}-${Math.random()}`,
                verb: item.verb,
                spanishVerb: item.verb, // Using Verb name as fallback for title
                tense: item.tense,
                sentenceParts: [match[1], match[3]],
                spanishSentence: item.translation,
                answer: match[2],
                hint: `The answer is '${match[2]}'`,
                fullSentence: item.text.replace(/[\[\]]/g, "") // Clean sentence for TTS
            });
            seenSentences.add(item.text);
        }
    }

    return resultsContainer;
  };

  const prefetchNextRound = async () => {
    setIsPrefetching(true);
    try {
      const newBatch = await getExercises(batchSize, selectedTenses, selectedVerbs);
      if (newBatch && newBatch.length > 0) {
        setPrefetchedExercises(newBatch);
      }
    } catch (err) {
      console.warn("Background prefetch failed:", err);
    } finally {
      setIsPrefetching(false);
    }
  };

  const handleLoadExercises = async (isNextRound = false) => {
    if (isNextRound && prefetchedExercises.length > 0) {
      setExercises(prefetchedExercises);
      setPrefetchedExercises([]); 
      setCurrentExerciseIndex(0);
      setUserInput("");
      setStatus("idle");
      setMistakes([]); // Reset mistakes for new round
      setView('practice');
      return;
    }
    
    setIsFetching(true);
    setApiError(null);
    setMistakes([]);
    
    try {
      const newExercises = await getExercises(batchSize, selectedTenses, selectedVerbs);
      
      if (newExercises.length === 0) {
          throw new Error("No sentences found for your selection in the library.");
      }
      
      setExercises(newExercises);
      setPrefetchedExercises([]); 
      setCurrentExerciseIndex(0);
      setUserInput("");
      setStatus("idle");
      setView('practice'); 
    } catch (err) {
      console.error("Load failed:", err);
      setApiError(err.message || "Failed to load exercises.");
    } finally {
      setIsFetching(false);
    }
  };

  // --- TTS HELPER ---
  const speakSentence = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCheck = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const cleanInput = userInput.trim().toLowerCase();
    const cleanAnswer = currentExercise.answer.toLowerCase();

    // Check for exact match or lenient match (ignoring punctuation)
    if (cleanInput === cleanAnswer || cleanInput === cleanAnswer.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"")) {
      setStatus("correct");
      setScore(score + 10);
      setStreak(streak + 1);
      speakSentence(currentExercise.fullSentence);
    } else {
      setStatus("incorrect");
      setStreak(0);
      setShake(true); // Trigger shake animation
      setTimeout(() => setShake(false), 500); // Reset shake after animation
      
      // Track mistake (prevent duplicates if checking multiple times)
      setMistakes(prev => {
        if (!prev.some(m => m.id === currentExercise.id)) {
            return [...prev, { ...currentExercise, usersWrongAnswer: userInput }];
        }
        return prev;
      });
    }
  };

  const handleNext = () => {
    if (currentExerciseIndex + 1 >= exercises.length) {
      setView('summary');
      return;
    }

    setUserInput("");
    setStatus("idle");
    setShowHint(false);
    setApiError(null);
    setCurrentExerciseIndex((prev) => prev + 1);
  };

  const handleRetry = () => {
    setStatus("idle");
    inputRef.current.focus();
  };

  // --- NEW FEATURE: ENTER KEY NAVIGATION ---
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (status === 'correct' && e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [status, handleNext]);

  // --- VIEWS ---

  const renderPracticeView = () => {
    if (!currentExercise) return null;

    return (
      <main className={`w-full max-w-md rounded-2xl shadow-xl overflow-hidden border relative transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <button 
          onClick={() => setView('settings')}
          className={`absolute top-4 right-4 transition-colors ${isDarkMode ? 'text-slate-600 hover:text-blue-400' : 'text-slate-300 hover:text-blue-500'}`}
          title="Customize Practice"
        >
          <Sliders size={20} />
        </button>

        {/* Progress Bar */}
        <div className={`w-full h-2 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <div 
            className="bg-blue-500 h-2 transition-all duration-500 ease-out"
            style={{ width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%` }}
          ></div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className={`inline-block px-4 py-1 rounded-full text-sm font-semibold mb-2 ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
              {currentExercise.tense}
            </div>
            <h2 className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{currentExercise.verb}</h2>
            
            <div className="mb-2 flex justify-center">
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${isDarkMode ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
                <BookOpen size={10} fill="currentColor" /> Custom Library
                </span>
            </div>

            <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>"{currentExercise.spanishSentence}"</p>
          </div>

          <form onSubmit={handleCheck} className="mb-6">
            <div className={`
                p-6 rounded-xl border text-lg sm:text-xl leading-relaxed text-center shadow-inner transition-all duration-300 relative
                ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}
                ${shake ? 'animate-shake border-red-400' : ''} 
            `}>
              {/* CSS for Shake Animation */}
              <style>{`
                @keyframes shake {
                  0%, 100% { transform: translateX(0); }
                  25% { transform: translateX(-5px); }
                  75% { transform: translateX(5px); }
                }
                .animate-shake {
                  animation: shake 0.3s ease-in-out;
                }
              `}</style>
              
              {/* TTS Button */}
              {status !== 'idle' && (
                <button
                  type="button"
                  onClick={() => speakSentence(currentExercise.fullSentence)}
                  className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
                    isDarkMode 
                      ? 'text-slate-500 hover:text-blue-400 hover:bg-slate-700' 
                      : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  title="Listen to sentence"
                >
                  <Volume2 size={16} />
                </button>
              )}

              <span>{currentExercise.sentenceParts[0]} </span>
              <span className="relative inline-block mx-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={status === 'correct'}
                  className={`
                    w-32 border-b-2 outline-none text-center font-semibold px-1 py-0.5 rounded-t transition-colors
                    ${status === 'idle' 
                        ? (isDarkMode ? 'bg-slate-700 border-slate-600 text-blue-300 focus:bg-slate-600' : 'bg-white border-slate-300 text-blue-700 focus:bg-blue-50') 
                        : ''}
                    ${status === 'correct' 
                        ? (isDarkMode ? 'border-green-500 bg-green-900/30 text-green-300' : 'border-green-500 bg-green-50 text-green-700') 
                        : ''}
                    ${status === 'incorrect' 
                        ? (isDarkMode ? 'border-red-500 bg-red-900/30 text-red-300' : 'border-red-500 bg-red-50 text-red-700') 
                        : ''}
                  `}
                  placeholder="..."
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </span>
              <span> {currentExercise.sentenceParts[1]}</span>
            </div>

            {status !== 'correct' && (
              <div className="mt-4 flex justify-center">
                <button 
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className={`text-sm flex items-center gap-1 transition-colors ${isDarkMode ? 'text-slate-500 hover:text-blue-400' : 'text-slate-400 hover:text-blue-500'}`}
                >
                  <Sparkles size={14} />
                  {showHint ? currentExercise.hint : "¿Necesitas una pista? / Need a hint?"}
                </button>
              </div>
            )}
          </form>

          <div className="mt-8 h-16"> 
            {status === 'idle' && (
              <button
                onClick={handleCheck}
                disabled={!userInput.trim()}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2
                  ${userInput.trim() ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25' : (isDarkMode ? 'bg-slate-700 cursor-not-allowed' : 'bg-slate-300 cursor-not-allowed')}
                `}
              >
                Comprobar / Check
              </button>
            )}

            {status === 'correct' && (
              <button
                onClick={handleNext}
                className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2"
              >
                <span>Siguiente / Next (Enter)</span>
                <ArrowRight size={20} />
              </button>
            )}

            {status === 'incorrect' && (
              <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                 <div className={`flex-1 border rounded-xl flex items-center justify-center px-4 font-medium ${isDarkMode ? 'bg-red-900/30 border-red-800 text-red-300' : 'bg-red-50 border-red-100 text-red-600'}`}>
                   Incorrecto
                 </div>
                 <button
                  onClick={handleRetry}
                  className={`px-6 py-3.5 text-white rounded-xl font-bold shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-800 hover:bg-slate-900'}`}
                >
                  <RefreshCw size={20} />
                  <span>Reintentar</span>
                </button>
              </div>
            )}
          </div>

          <div className={`mt-4 text-center text-sm font-medium transition-colors duration-300 h-6
            ${status === 'correct' ? (isDarkMode ? 'text-green-400' : 'text-green-600') : ''}
            ${status === 'incorrect' ? (isDarkMode ? 'text-red-400' : 'text-red-500') : ''}
            ${status === 'idle' ? 'opacity-0' : 'opacity-100'}
          `}>
            {status === 'correct' ? '¡Excelente! / Excellent!' : status === 'incorrect' ? 'Inténtalo de nuevo / Try again' : ''}
          </div>
        </div>
        
        <div className={`p-4 border-t flex justify-center ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
           <div className={`text-xs flex items-center gap-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
             <span className="font-semibold">{exercises.length}</span> exercises in queue
           </div>
        </div>
      </main>
    );
  };

  // Render Summary View
  const renderSummaryView = () => (
    <main className={`w-full max-w-md rounded-2xl shadow-xl overflow-hidden border animate-in fade-in zoom-in-95 p-8 transition-colors duration-300 flex flex-col ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <div className="text-center">
        <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full ${isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>
            <Trophy size={48} />
            </div>
        </div>
        
        <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Round Complete!</h2>
        <p className={`mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>You've finished this set of exercises.</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
            <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Total Score</div>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{score}</div>
            </div>
            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
            <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Current Streak</div>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`}>{streak}</div>
            </div>
        </div>
      </div>

      {/* --- MISTAKES REVIEW SECTION --- */}
      {mistakes.length > 0 && (
          <div className="mb-8 w-full">
              <h3 className={`text-sm font-bold uppercase tracking-wide mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Needs Review</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  {mistakes.map((mistake, i) => (
                      <div key={i} className={`p-3 rounded-lg border text-left text-sm ${isDarkMode ? 'bg-red-900/20 border-red-900/50' : 'bg-red-50 border-red-100'}`}>
                          <div className="flex items-center gap-2 mb-1">
                              <XCircle size={14} className="text-red-500" />
                              <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{mistake.verb} ({mistake.tense})</span>
                          </div>
                          <div className={`pl-6 mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              "{mistake.sentenceParts[0]} <span className="line-through decoration-red-500 text-red-500 font-medium">{mistake.usersWrongAnswer}</span> {mistake.sentenceParts[1]}"
                          </div>
                          <div className={`pl-6 flex items-center gap-2 font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                              <CheckCircle size={14} />
                              <span>{mistake.answer}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <button 
        onClick={() => handleLoadExercises(true)}
        disabled={isFetching}
        className={`w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${isFetching ? (isDarkMode ? 'disabled:bg-slate-700' : 'disabled:bg-slate-300') : ''}`}
      >
        {/* Show loading state OR if we have prefetched data, show a ready indicator */}
        {isFetching ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Loading...</span>
          </>
        ) : prefetchedExercises.length > 0 ? (
          <>
            <Sparkles size={20} className="text-yellow-300" />
            <span>Start Next Round (Ready!)</span>
          </>
        ) : (
          <>
            <RefreshCw size={20} />
            <span>Load Next Round</span>
          </>
        )}
      </button>
      
      <button 
        onClick={() => setView('settings')}
        className={`mt-4 text-sm font-medium ${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-400 hover:text-blue-500'}`}
      >
        Adjust Settings
      </button>
    </main>
  );

  // Render Settings View
  const renderSettingsView = () => (
    <main className={`w-full max-w-md rounded-2xl shadow-xl overflow-hidden border animate-in fade-in zoom-in-95 flex flex-col h-[80vh] transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <div className={`p-6 pb-2 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
            <Settings size={20} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}/>
            Practice Settings
          </h2>
          {/* Close Button - Hidden if no exercises exist to prevent empty state */}
          {exercises.length > 0 && (
            <button onClick={() => setView('practice')} className={`transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {/* Batch Size Selection */}
        <div>
            <label className={`text-sm font-bold uppercase tracking-wide mb-3 block ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Questions per Round
            </label>
            <div className="flex gap-2">
                {[5, 10, 15, 20].map(size => (
                    <button
                        key={size}
                        onClick={() => setBatchSize(size)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                            batchSize === size
                                ? (isDarkMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-200')
                                : (isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                        }`}
                    >
                        {size}
                    </button>
                ))}
            </div>
        </div>

        {/* Tenses Selection */}
        <div>
          <div className={`flex justify-between items-end mb-3 sticky top-0 z-10 pb-2 transition-colors ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
              <label className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Tenses</label>
              <div className="flex gap-2 text-xs">
                 <button onClick={selectAllTenses} className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>All</button>
                 <span className={isDarkMode ? 'text-slate-600' : 'text-slate-300'}>|</span>
                 <button onClick={selectNoTenses} className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>None</button>
              </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_TENSES.map(tense => (
              <button
                key={tense}
                onClick={() => toggleTense(tense)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedTenses.includes(tense) 
                    ? (isDarkMode ? 'bg-blue-900/50 text-blue-200 ring-2 ring-blue-600 ring-offset-1 ring-offset-slate-900' : 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 ring-offset-1')
                    : (isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                }`}
              >
                {tense}
              </button>
            ))}
          </div>
        </div>

        {/* Verbs Selection */}
        <div>
          <div className={`flex flex-col gap-2 mb-3 sticky top-0 z-10 pb-2 transition-colors ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
              <div className="flex justify-between items-end">
                 <label className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Verbs <span className={`ml-1 text-xs normal-case ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>({selectedVerbs.length} selected)</span>
                 </label>
                 <div className="flex gap-2 text-xs">
                    <button onClick={selectAllVerbs} className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>All</button>
                    <span className={isDarkMode ? 'text-slate-600' : 'text-slate-300'}>|</span>
                    <button onClick={selectNoVerbs} className={`hover:underline ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>None</button>
                 </div>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search verbs..." 
                  value={verbSearchTerm}
                  onChange={(e) => setVerbSearchTerm(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors placeholder:text-slate-400 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
              </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {verbSearchTerm.trim() === "" ? (
                <div className={`w-full py-8 text-center border-2 border-dashed rounded-xl text-sm ${isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                    <Search size={24} className="mx-auto mb-2 opacity-50" />
                    <p>Type above to find verbs</p>
                </div>
            ) : (
                ALL_VERBS.filter(v => v.toLowerCase().includes(verbSearchTerm.toLowerCase())).map(verb => (
                  <button
                    key={verb}
                    onClick={() => toggleVerb(verb)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedVerbs.includes(verb) 
                        ? (isDarkMode ? 'bg-emerald-900/50 text-emerald-200 ring-2 ring-emerald-600 ring-offset-1 ring-offset-slate-900' : 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500 ring-offset-1')
                        : (isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                    }`}
                  >
                    {verb}
                  </button>
                ))
            )}
            {verbSearchTerm.trim() !== "" && ALL_VERBS.filter(v => v.toLowerCase().includes(verbSearchTerm.toLowerCase())).length === 0 && (
                <p className={`text-xs w-full text-center py-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No verbs found matching "{verbSearchTerm}"</p>
            )}
          </div>
        </div>
      </div>

      <div className={`p-6 border-t ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
        {apiError && (
          <div className={`mb-4 p-3 text-sm rounded-lg flex items-start gap-2 border ${isDarkMode ? 'bg-red-900/30 text-red-300 border-red-800' : 'bg-red-50 text-red-600 border-red-100'}`}>
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{apiError}</p>
          </div>
        )}

        <button 
          onClick={() => handleLoadExercises(false)}
          disabled={isFetching || selectedTenses.length === 0 || selectedVerbs.length === 0}
          className={`w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${isFetching || selectedTenses.length === 0 || selectedVerbs.length === 0 ? (isDarkMode ? 'disabled:bg-slate-700' : 'disabled:bg-slate-300') : ''}`}
        >
          {isFetching ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Globe size={20} />
          )}
          <span>{isFetching ? "Searching..." : `Start Practice (${batchSize} Sentences)`}</span>
        </button>
      </div>
    </main>
  );

  return (
    // Explicit conditional styling guarantees dark mode works regardless of Tailwind configuration (class vs media)
    <div className={`min-h-screen font-sans flex flex-col items-center py-8 px-4 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className="w-full max-w-md flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className={`font-bold text-lg leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Verb Master</h1>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Practice English Verbs</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="hidden sm:flex gap-3">
              <div className="flex flex-col items-end">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Score</span>
                <span className={`font-mono font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{score}</span>
              </div>
              <div className="flex flex-col items-end">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Racha</span>
                  <div className={`flex items-center gap-1 font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`}>
                    <Trophy size={14} />
                    <span>{streak}</span>
                  </div>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>
      </header>

      {/* Mobile Stat Bar (Visible only on small screens) */}
      <div className={`sm:hidden w-full max-w-md flex justify-between mb-6 px-4 py-3 rounded-xl shadow-sm border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Score</span>
                <span className={`font-mono font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{score}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Racha</span>
                <div className={`flex items-center gap-1 font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`}>
                  <Trophy size={14} />
                  <span>{streak}</span>
                </div>
            </div>
      </div>

      {/* Main Content Switcher */}
      {view === 'practice' && renderPracticeView()}
      {view === 'settings' && renderSettingsView()}
      {view === 'summary' && renderSummaryView()}

      <div className={`mt-8 text-sm max-w-xs text-center transition-colors ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
        Created for Spanish speakers learning English. <br/> Data provided by Custom Library
      </div>
    </div>
  );
};

export default ConjugationApp;