import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Square, Play, Volume2, Settings, Trash2, Download, 
  Pause, RotateCcw, Zap, Sparkles, Waves, Activity, Copy, Check 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useVoice } from '@/hooks/useVoice';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const quickPhrases = [
  { text: "Hello, how are you?", category: "Greetings", icon: "👋" },
  { text: "Where is the bathroom?", category: "Travel", icon: "🚽" },
  { text: "How much does this cost?", category: "Shopping", icon: "💰" },
  { text: "I need help, please", category: "Emergency", icon: "🆘" },
  { text: "Thank you very much", category: "Courtesy", icon: "🙏" },
  { text: "Excuse me, where is...?", category: "Directions", icon: "🗺️" },
  { text: "I don't understand", category: "Communication", icon: "❓" },
  { text: "Can you repeat that?", category: "Communication", icon: "🔄" },
];

const VoiceVisualization = ({ isListening, isSpeaking }: { isListening: boolean; isSpeaking: boolean }) => {
  return (
    <div className="relative">
      {/* Main microphone circle */}
      <motion.div
        animate={{
          scale: isListening ? [1, 1.1, 1] : isSpeaking ? [1, 1.05, 1] : 1,
          boxShadow: isListening 
            ? ["0 0 20px rgba(59, 130, 246, 0.5)", "0 0 40px rgba(59, 130, 246, 0.8)", "0 0 20px rgba(59, 130, 246, 0.5)"]
            : isSpeaking
            ? ["0 0 20px rgba(147, 51, 234, 0.5)", "0 0 40px rgba(147, 51, 234, 0.8)", "0 0 20px rgba(147, 51, 234, 0.5)"]
            : "0 0 20px rgba(59, 130, 246, 0.3)"
        }}
        transition={{ duration: 1, repeat: (isListening || isSpeaking) ? Infinity : 0 }}
        className={`
          w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center mx-auto relative overflow-hidden
          ${isListening 
            ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 neon:from-cyan-400 neon:via-blue-500 neon:to-pink-500' 
            : isSpeaking
            ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 neon:from-pink-500 neon:via-purple-500 neon:to-cyan-400'
            : 'bg-gradient-to-r from-gray-400 to-gray-600 neon:from-gray-600 neon:to-gray-800'
          }
        `}
      >
        {/* Animated background */}
        <motion.div
          animate={{ rotate: isListening || isSpeaking ? 360 : 0 }}
          transition={{ duration: 8, repeat: (isListening || isSpeaking) ? Infinity : 0, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />

        {/* Microphone icon */}
        <motion.div
          animate={{ 
            rotate: isListening ? [0, -5, 5, 0] : 0,
            scale: isSpeaking ? [1, 1.1, 1] : 1
          }}
          transition={{ 
            rotate: { duration: 0.5, repeat: isListening ? Infinity : 0 },
            scale: { duration: 0.8, repeat: isSpeaking ? Infinity : 0 }
          }}
        >
          {isSpeaking ? <Volume2 className="w-12 h-12 md:w-16 md:h-16 text-white" /> : <Mic className="w-12 h-12 md:w-16 md:h-16 text-white" />}
        </motion.div>
      </motion.div>

      {/* Sound waves */}
      <AnimatePresence>
        {(isListening || isSpeaking) && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.5, 1], 
                  opacity: [0.3, 0.1, 0.3] 
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className={`
                  rounded-full border-2 
                  ${isListening 
                    ? 'border-blue-400/30 neon:border-cyan-400/50' 
                    : 'border-purple-400/30 neon:border-pink-400/50'
                  }
                `} 
                style={{
                  width: `${180 + i * 40}px`,
                  height: `${180 + i * 40}px`
                }} />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatusBadge = ({ isListening, isTranslating, isSpeaking }: { 
  isListening: boolean; 
  isTranslating: boolean; 
  isSpeaking: boolean; 
}) => {
  const getStatus = () => {
    if (isListening) return { text: 'Listening', color: 'bg-red-500', icon: Activity };
    if (isTranslating) return { text: 'Translating', color: 'bg-yellow-500', icon: Zap };
    if (isSpeaking) return { text: 'Speaking', color: 'bg-purple-500', icon: Volume2 };
    return { text: 'Ready', color: 'bg-green-500', icon: Mic };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-morphism"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: isListening || isTranslating || isSpeaking ? Infinity : 0 }}
        className={`w-3 h-3 rounded-full ${status.color}`}
      />
      <StatusIcon className="w-4 h-4" />
      <span className="text-sm font-medium">{status.text}</span>
    </motion.div>
  );
};

export default function VoicePage() {
  const [recordingLanguage, setRecordingLanguage] = useState('en-US');
  const [outputLanguage, setOutputLanguage] = useState('es-ES');
  const [lastSpokenText] = useState(useRef(''));
  const [historyUpdateTrigger, setHistoryUpdateTrigger] = useState(0);
  const [conversationKey, setConversationKey] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isListening,
    transcript,
    isInterim,
    isSpeaking,
    voiceSettings,
    startListening,
    stopListening,
    speak,
    updateVoiceSettings,
    clearConversation,
    getConversationHistory,
    addTranslationToHistory,
    isRecognitionSupported,
    isSynthesisSupported
  } = useVoice();

  const {
    sourceText,
    translatedText,
    sourceLanguage,
    targetLanguage,
    setSourceText,
    setTranslatedText,
    setSourceLanguage,
    setTargetLanguage,
    translate,
    isTranslating,
  } = useTranslation();

  // Sync language changes with translation hook
  useEffect(() => {
    setSourceLanguage(recordingLanguage.split('-')[0]);
  }, [recordingLanguage, setSourceLanguage]);

  useEffect(() => {
    setTargetLanguage(outputLanguage.split('-')[0]);
  }, [outputLanguage, setTargetLanguage]);

  // Separate effect for auto re-translation when output language changes
  useEffect(() => {
    // Get the most recent input text from conversation history or current transcript
    const history = getConversationHistory();
    const lastInput = history.filter(h => h.type === 'input').pop();
    const textToRetranslate = transcript && transcript.trim() ? transcript : lastInput?.text;

    // Only auto re-translate if we have text and not currently processing
    if (textToRetranslate && textToRetranslate.trim().length > 0 && !isTranslating && !isListening) {
      // Create a unique key for this potential re-translation
      const retranslationKey = `${textToRetranslate}-${recordingLanguage.split('-')[0]}-${outputLanguage.split('-')[0]}`;
      
      // Only re-translate if this is actually a different language combination
      if (retranslationKey !== lastSpokenText.current) {
        // Clear previous translation state
        setTranslatedText('');

        // Debounce to prevent rapid re-translations
        const timeoutId = setTimeout(() => {
          console.log('Auto re-translating due to language change:', textToRetranslate);
          handleTranslateAndSpeak(textToRetranslate);
        }, 300);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [outputLanguage, recordingLanguage]); // Include recordingLanguage for complete language change detection

  const conversationHistory = getConversationHistory();

  useEffect(() => {
    if (!isRecognitionSupported) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive"
      });
    }
  }, [isRecognitionSupported, toast]);

  // Cleanup timeout and voice service on unmount
  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      // Stop any ongoing voice activities when leaving the page
      stopListening();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopListening]);

  // Handle auto-stop listening after silence and auto-translation
  useEffect(() => {
    if (isListening) {
      // Clear existing timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      // Set new timeout for auto-stop
      silenceTimeoutRef.current = setTimeout(() => {
        if (isListening) {
          stopListening();
        }
      }, 4000); // 4 seconds of silence

      return () => {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
      };
    }
  }, [transcript, isListening, stopListening]);

  // Handle auto-translation when transcript is final
  useEffect(() => {
    if (transcript && !isInterim && !isTranslating && transcript.trim().length > 0) {
      // Create a unique key for this translation to prevent duplicates
      const currentTranslationKey = `${transcript}-${recordingLanguage.split('-')[0]}-${outputLanguage.split('-')[0]}`;
      
      // Prevent repeated translation of the same text to same language
      if (currentTranslationKey !== lastSpokenText.current) {
        console.log('Triggering translation for:', transcript);
        handleTranslateAndSpeak(transcript);
        // Stop listening after getting final transcript
        if (isListening) {
          stopListening();
        }
      }
    }
  }, [transcript, isInterim, isTranslating, isListening, stopListening, recordingLanguage, outputLanguage]);

  // Add translation to conversation history when translation is complete
  useEffect(() => {
    if (
      translatedText && 
      transcript && 
      !isInterim && 
      translatedText.trim().length > 0
    ) {
      // Create a unique key for this translation to prevent duplicates
      const translationKey = `${transcript}-${translatedText}-${outputLanguage}`;
      
      // Only add if this is a new translation
      if (translationKey !== lastSpokenText.current) {
        // Add translation to conversation history immediately
        addTranslationToHistory(translatedText, outputLanguage, transcript, recordingLanguage.split('-')[0]);

        // Only speak if auto-play is enabled
        if (voiceSettings.autoPlay && !isSpeaking) {
          speak(translatedText, outputLanguage, false); // Don't add to history again when speaking
        }

        lastSpokenText.current = translationKey;

        // Trigger a re-render of the conversation history
        setHistoryUpdateTrigger(prev => prev + 1);
      }
    }
  }, [translatedText, voiceSettings.autoPlay, isSpeaking, transcript, isInterim, outputLanguage, recordingLanguage, speak, addTranslationToHistory]);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy text to clipboard",
        variant: "destructive"
      });
    }
  };

  const exportConversation = async () => {
    const history = getConversationHistory();
    if (history.length === 0) {
      toast({
        title: "No History",
        description: "No conversation history to export.",
        variant: "destructive"
      });
      return;
    }

    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        recordingLanguage,
        outputLanguage,
        conversations: history.map(entry => ({
          type: entry.type,
          text: entry.text,
          language: entry.language,
          timestamp: entry.timestamp
        }))
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const fileName = `voice-translation-history-${new Date().toISOString().split('T')[0]}.json`;

      // For mobile browsers, try to use the Web Share API first
      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([dataStr], fileName, { type: 'application/json' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Voice Translation History',
              text: 'Exported conversation history'
            });
            toast({
              title: "Export Complete",
              description: "Conversation history has been shared successfully.",
            });
            return;
          }
        } catch (shareError) {
          console.log('Web Share API failed, trying download');
        }
      }

      // Try File System Access API for desktop browsers
      if ('showSaveFilePicker' in window && !navigator.userAgent.includes('Mobile')) {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: 'JSON files',
              accept: { 'application/json': ['.json'] }
            }]
          });
          const writable = await fileHandle.createWritable();
          await writable.write(dataStr);
          await writable.close();

          toast({
            title: "Export Complete",
            description: "Conversation history has been saved successfully.",
          });
          return;
        } catch (e) {
          if ((e as Error).name !== 'AbortError') {
            console.log('File picker failed, using fallback');
          }
        }
      }

      // Fallback download method for all browsers
      const dataBlob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(dataBlob);

      // Create and configure download link
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      link.style.position = 'absolute';
      link.style.top = '-9999px';

      // Add to DOM and trigger download
      document.body.appendChild(link);

      // Force click event
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      link.dispatchEvent(clickEvent);

      // Alternative click methods for better compatibility
      setTimeout(() => {
        if (link.click) {
          link.click();
        }
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 10);

      toast({
        title: "Export Complete",
        description: "Download should start automatically. Check your downloads folder.",
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export conversation history. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStartListening = useCallback(async () => {
    // Check if we're on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isIOSSafari = isIOS && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

    // Use auto-detection by starting with a common language
    // The server will auto-detect the actual language during translation
    const inputLang = recordingLanguage === 'auto' ? 'auto' : recordingLanguage;
    const recognitionLang = inputLang === 'auto' ? 'en-US' : inputLang; // Fallback for recognition

    if (isListening) {
      stopListening();
    } else {
      // Try to start listening - the voiceService will handle permission requests
      try {
        await startListening(recognitionLang);
      } catch (error) {
        console.error('Failed to start listening:', error);
        // The error will be handled by the voiceService and displayed via onError callback
      }
    }
  }, [isListening, stopListening, startListening, recordingLanguage]);

  const handleStopListening = () => {
    stopListening();
  };

  const handleTranslateAndSpeak = useCallback(async (text: string) => {
    if (!text || text.trim().length === 0) return;

    // Create a unique key for this translation request
    const translationKey = `${text}-${recordingLanguage.split('-')[0]}-${outputLanguage.split('-')[0]}`;

    // Only prevent duplicate if it's the exact same text to same language combination
    // Allow re-translation when language changes
    const isDuplicateTranslation = translationKey === lastSpokenText.current && translatedText;

    if (isDuplicateTranslation) {
      console.log('Skipping duplicate translation:', translationKey);
      return;
    }

    // Prevent new translations while one is in progress
    if (isTranslating) {
      console.log('Translation already in progress, skipping');
      return;
    }

    console.log('Translating text:', text);
    console.log('From:', recordingLanguage.split('-')[0], 'To:', outputLanguage.split('-')[0]);

    try {
      // Use the translate function from useTranslation hook with proper parameters
      const result = await translate(text, recordingLanguage.split('-')[0], outputLanguage.split('-')[0]);
      console.log('Translation successful:', result);
      lastSpokenText.current = translationKey;
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Translation Error",
        description: "Failed to translate text. Please try again.",
        variant: "destructive"
      });
      // Set the text as processed to prevent infinite retries
      lastSpokenText.current = translationKey;
    }
  }, [recordingLanguage, outputLanguage, translatedText, isTranslating, translate, toast]);

  const handleSpeakTranslation = async (text: string, language: string) => {
    try {
      await speak(text, language, false);
    } catch (error) {
      toast({
        title: "Speech Error",
        description: "Failed to speak the text.",
        variant: "destructive"
      });
    }
  };

  const handleQuickPhrase = (phrase: string) => {
    handleTranslateAndSpeak(phrase);
  };

  return (
    <div className="min-h-screen w-full px-4 py-6 pb-24 md:pb-6 md:max-w-6xl md:mx-auto gradient-mesh main-content">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block mb-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 neon:from-cyan-400 neon:to-pink-500 flex items-center justify-center neon:glow">
            <Mic className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 neon:from-cyan-400 neon:via-pink-400 neon:to-red-400 bg-clip-text text-transparent">
          Voice Translation
        </h1>
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 neon:text-cyan-100/80 max-w-2xl mx-auto">
          Speak naturally and get instant voice-to-voice translation with AI-powered accuracy
        </p>
      </motion.div>

      {/* Main Voice Interface */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
      >
        <Card className="mb-8 glass-morphism border-0 neon:glow">
          <CardContent className="p-8 md:p-12">
            <div className="text-center">
              {/* Voice Visualization */}
              <div className="mb-8">
                <VoiceVisualization 
                  isListening={isListening} 
                  isSpeaking={isSpeaking} 
                />
              </div>

              {/* Status and Controls */}
              <div className="space-y-6">
                <StatusBadge 
                  isListening={isListening} 
                  isTranslating={isTranslating} 
                  isSpeaking={isSpeaking} 
                />

                <motion.h2 
                  key={`${isListening}-${isTranslating}-${isSpeaking}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl md:text-3xl font-bold"
                >
                  {isListening ? 'Listening...' : 
                   isTranslating ? 'Processing...' : 
                   isSpeaking ? 'Speaking...' : 
                   'Ready to Listen'}
                </motion.h2>

                <p className="text-gray-600 dark:text-gray-300 neon:text-cyan-100/70 max-w-md mx-auto">
                  {isListening ? 'Speak now, I\'ll auto-stop after silence' : 
                   isTranslating ? 'Translating your speech...' : 
                   isSpeaking ? 'Playing your translation...' :
                   'Tap the microphone to start speaking'}
                </p>

                {/* Transcript Display */}
                <AnimatePresence>
                  {transcript && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="max-w-md mx-auto p-6 glass-morphism rounded-2xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-xs">
                          {isInterim ? 'Processing...' : 'Final'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(transcript, -1)}
                          className="h-6 w-6 p-0"
                        >
                          {copiedIndex === -1 ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                      <p className={`text-lg ${isInterim ? 'opacity-70 italic' : 'font-medium'}`}>
                        "{transcript}"
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Voice Controls */}
              <div className="flex justify-center items-center mt-8">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    className={`
                      w-16 h-16 rounded-2xl text-white shadow-xl transition-all duration-300
                      ${isListening 
                        ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 animate-pulse-glow' 
                        : 'bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 hover:from-blue-600 hover:via-purple-700 hover:to-pink-700 hover-lift'
                      }
                      neon:glow
                    `}
                    onClick={isListening ? handleStopListening : handleStartListening}
                    disabled={!isRecognitionSupported}
                  >
                    <motion.div
                      animate={{ rotate: isListening ? [0, 10, -10, 0] : 0 }}
                      transition={{ duration: 0.5, repeat: isListening ? Infinity : 0 }}
                    >
                      {isListening ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </motion.div>
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Language Selection */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
      >
        {/* Input Language */}
        <Card className="glass-morphism border-0 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 neon:from-cyan-400 neon:to-blue-500 flex items-center justify-center neon:glow">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Speaking in</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 neon:text-cyan-200/70">Input language</p>
              </div>
            </div>

            <LanguageSelector
              value={recordingLanguage.split('-')[0]}
              onValueChange={(lang) => setRecordingLanguage(`${lang}-${lang.toUpperCase()}`)}
              className="w-full"
            />

            {/* Voice Level Indicator */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex space-x-1 items-end h-8 mt-4 justify-center"
                >
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: isListening ? ["25%", "100%", "25%"] : "25%",
                        backgroundColor: [
                          "rgb(34, 197, 94)", 
                          "rgb(59, 130, 246)", 
                          "rgb(147, 51, 234)"
                        ]
                      }}
                      transition={{
                        height: {
                          duration: 0.5 + Math.random() * 0.5,
                          repeat: isListening ? Infinity : 0,
                          delay: i * 0.1,
                        },
                        backgroundColor: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }}
                      className="w-2 rounded-full"
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Output Language */}
        <Card className="glass-morphism border-0 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 neon:from-pink-400 neon:to-purple-500 flex items-center justify-center neon:glow">
                <Volume2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Translate to</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 neon:text-cyan-200/70">Output language</p>
              </div>
            </div>

            <LanguageSelector
              value={outputLanguage.split('-')[0]}
              onValueChange={(lang) => setOutputLanguage(`${lang}-${lang.toUpperCase()}`)}
              className="w-full"
            />

            {/* Translation Display */}
            <AnimatePresence>
              {translatedText && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-4 glass-morphism rounded-xl border border-purple-500/20 neon:border-pink-500/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-purple-500/20 text-purple-400 neon:bg-pink-500/20 neon:text-pink-400">
                      Translation
                    </Badge>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(translatedText, -2)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedIndex === -2 ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isSpeaking}
                        onClick={() => speak(translatedText, outputLanguage, false)}
                        className="h-6 w-6 p-0"
                      >
                        <Volume2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-base font-medium break-words">{translatedText}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Speaking Indicator */}
            <AnimatePresence>
              {isSpeaking && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-6"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="inline-flex items-center space-x-2 px-4 py-2 glass-morphism rounded-full"
                  >
                    <Volume2 className="w-5 h-5 text-purple-500 neon:text-pink-400" />
                    <span className="text-sm font-medium">Playing translation...</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Conversation History */}
      <AnimatePresence>
        {conversationHistory.length > 0 && (
          <motion.div
            key={conversationKey}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <Card className="mb-8 glass-morphism border-0">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-centerjustify-between mb-6 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 neon:from-cyan-400 neon:to-green-500 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold">Conversation History</h3>
                    <Badge variant="outline">{conversationHistory.length}</Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:gap-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportConversation}
                      className="glass-morphism border-0 text-xs sm:text-sm"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        clearConversation();
                        setConversationKey(prev => prev + 1);
                        setHistoryUpdateTrigger(prev => prev + 1);
                      }}
                      className="glass-morphism border-0 text-red-500 hover:text-red-600 text-xs sm:text-sm"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {conversationHistory.slice(-8).map((entry, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: entry.type === 'input' ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`flex items-start space-x-3 ${
                        entry.type === 'input' ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      <div className={`
                        max-w-sm lg:max-w-md p-4 rounded-2xl glass-morphism
                        ${entry.type === 'input'
                          ? 'border border-blue-500/20 neon:border-cyan-500/30'
                          : 'border border-purple-500/20 neon:border-pink-500/30'
                        }
                      `}>
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              entry.type === 'input' 
                                ? 'border-blue-500/30 text-blue-400 neon:border-cyan-500/50 neon:text-cyan-400' 
                                : 'border-purple-500/30 text-purple-400 neon:border-pink-500/50 neon:text-pink-400'
                            }`}
                          >
                            {entry.type === 'input' ? 'You said' : 'Translation'}
                          </Badge>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(entry.text, index)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedIndex === index ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => speak(entry.text, entry.language, false)}
                              disabled={isSpeaking}
                              className="h-6 w-6 p-0"
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm font-medium break-words">{entry.text}</p>
                        <p className="text-xs text-gray-500 neon:text-cyan-200/50 mt-2">
                          {typeof entry.timestamp === 'string' ? 
                            new Date(entry.timestamp).toLocaleTimeString() : 
                            entry.timestamp.toLocaleTimeString()
                          }
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings and Quick Phrases */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Voice Settings */}
        <Card className="glass-morphism border-0 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-500 to-gray-700 neon:from-gray-600 neon:to-gray-800 flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-lg font-semibold">Voice Settings</h4>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Voice Speed</span>
                  <Badge variant="outline" className="text-xs">
                    {voiceSettings.rate.toFixed(1)}x
                  </Badge>
                </div>
                <Slider
                  value={[voiceSettings.rate]}
                  onValueChange={([value]) => updateVoiceSettings({ rate: value })}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 neon:text-cyan-200/50 mt-2">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>

              <Separator className="opacity-20" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Voice Pitch</span>
                  <Badge variant="outline" className="text-xs">
                    {voiceSettings.pitch.toFixed(1)}
                  </Badge>
                </div>
                <Slider
                  value={[voiceSettings.pitch]}
                  onValueChange={([value]) => updateVoiceSettings({ pitch: value })}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 neon:text-cyan-200/50 mt-2">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              <Separator className="opacity-20" />

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Auto-play Translation</span>
                  <p className="text-xs text-gray-500 neon:text-cyan-200/50">Automatically speak translations</p>
                </div>
                <Switch
                  checked={voiceSettings.autoPlay}
                  onCheckedChange={(checked) => updateVoiceSettings({ autoPlay: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Phrases */}
        <Card className="glass-morphism border-0 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 neon:from-orange-400 neon:to-red-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-lg font-semibold">Quick Phrases</h4>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {quickPhrases.map((phrase, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickPhrase(phrase.text)}
                    disabled={isTranslating || isSpeaking}
                    className="w-full text-left justify-between p-3 h-auto glass-morphism hover:scale-[1.02] transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{phrase.icon}</span>
                      <div className="text-left">
                        <p className="text-sm font-medium">{phrase.text}</p>
                        <p className="text-xs text-gray-500 neon:text-cyan-200/50">{phrase.category}</p>
                      </div>
                    </div>
                    <Play className="w-3 h-3 text-gray-400 neon:text-cyan-400/70" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}