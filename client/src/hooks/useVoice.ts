import { useState, useCallback, useRef, useEffect } from 'react';
import { voiceService } from '@/lib/voiceService';
import { StorageService } from '@/lib/storageService';
import { useToast } from '@/hooks/use-toast';
import type { VoiceRecognitionResult } from '@/types';

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isInterim, setIsInterim] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 1,
    pitch: 1,
    autoPlay: true
  });

  const { toast } = useToast();
  const conversationHistory = useRef<Array<{
    type: 'input' | 'output';
    text: string;
    language: string;
    timestamp: Date;
  }>>([]);

  useEffect(() => {
    const settings = StorageService.getSettings();
    if (settings.voice) {
      setVoiceSettings(prev => ({ ...prev, ...settings.voice }));
    }

    // Only check microphone permission, don't request it automatically
    checkMicrophonePermission().then(setHasPermission).catch(() => setHasPermission(false));
  }, []);

  const startListening = useCallback(async (language: string = 'en-US') => {
    if (!voiceService.isRecognitionSupported()) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      console.error('Speech recognition requires HTTPS');
      toast({
        title: "HTTPS Required",
        description: "Speech recognition requires a secure (HTTPS) connection.",
        variant: "destructive"
      });
      return;
    }

    setIsListening(true);
    setTranscript('');
    setIsInterim(false);

    try {
      // Store original volume settings to prevent interference
      const originalVolume = typeof window !== 'undefined' && 'speechSynthesis' in window ? 
        window.speechSynthesis.getVoices().length : null;

      await voiceService.startListening(
        language,
        (result: VoiceRecognitionResult) => {
          setTranscript(result.transcript);
          setIsInterim(!result.isFinal);

          if (result.isFinal) {
            // Add to conversation history
            conversationHistory.current.push({
              type: 'input',
              text: result.transcript,
              language,
              timestamp: new Date()
            });
          }
        },
        (error: string) => {
          setIsListening(false);
          toast({
            title: "Voice Recognition Error",
            description: error,
            variant: "destructive"
          });
        }
      );
    } catch (error) {
      setIsListening(false);
      toast({
        title: "Permission Error",
        description: "Failed to access microphone. Please allow microphone access.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopListening = useCallback(() => {
    voiceService.stopListening();
    setIsListening(false);
    setIsInterim(false);
  }, []);

  const speak = useCallback(async (
    text: string, 
    language: string = 'en-US',
    addToHistory: boolean = true
  ): Promise<void> => {
    if (!voiceService.isSynthesisSupported()) {
      toast({
        title: "Not Supported",
        description: "Speech synthesis is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    if (!text || text.trim().length === 0) {
      toast({
        title: "No Text",
        description: "No text to speak.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSpeaking(true);
      await voiceService.speak(text, language, voiceSettings.rate, voiceSettings.pitch);

      // Add to conversation history only if specified and it's not already there
      if (addToHistory) {
        const lastEntry = conversationHistory.current[conversationHistory.current.length - 1];
        if (!lastEntry || lastEntry.text !== text || lastEntry.type !== 'output') {
          conversationHistory.current.push({
            type: 'output',
            text,
            language,
            timestamp: new Date()
          });
        }
      }

    } catch (error: any) {
      console.error('Speech error:', error);

      // Provide more user-friendly error messages
      let errorMessage = "Failed to speak text";
      if (error?.message?.includes('network')) {
        errorMessage = "Network error - please check your connection and try again";
      } else if (error?.message?.includes('timeout')) {
        errorMessage = "Speech took too long - please try again with shorter text";
      } else if (error?.message?.includes('busy')) {
        errorMessage = "Audio device is busy - please wait and try again";
      } else if (error?.message?.includes('not supported')) {
        errorMessage = "Speech synthesis not supported on this device";
      }

      toast({
        title: "Speech Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSpeaking(false);
    }
  }, [voiceSettings, toast]);

  const saveVoiceTranslation = useCallback((
    sourceText: string,
    translatedText: string,
    sourceLanguage: string,
    targetLanguage: string,
    metadata?: any
  ) => {
    StorageService.saveTranslation({
      sourceText,
      translatedText,
      sourceLanguage,
      targetLanguage,
      type: 'voice',
      isFavorite: false,
      metadata: {
        ...metadata,
        conversationHistory: conversationHistory.current.slice(-10) // Keep last 10 entries
      }
    });
  }, []);

  const addTranslationToHistory = useCallback((
    translatedText: string,
    targetLanguage: string,
    sourceText?: string,
    sourceLanguage?: string
  ) => {
    const timestamp = new Date();

    // Add source text if provided and not already in history
    if (sourceText && sourceLanguage) {
      const lastEntry = conversationHistory.current[conversationHistory.current.length - 1];
      if (!lastEntry || lastEntry.text !== sourceText || lastEntry.type !== 'input') {
        conversationHistory.current.push({
          type: 'input' as const,
          text: sourceText,
          language: sourceLanguage,
          timestamp
        });
      }
    }

    // Add translation to conversation history - check if it's different from the last output
    const lastOutputEntry = conversationHistory.current.slice().reverse().find(entry => entry.type === 'output');
    if (!lastOutputEntry || lastOutputEntry.text !== translatedText) {
      conversationHistory.current.push({
        type: 'output' as const,
        text: translatedText,
        language: targetLanguage,
        timestamp
      });
    }
  }, []);

  const updateVoiceSettings = useCallback((newSettings: Partial<typeof voiceSettings>) => {
    const updated = { ...voiceSettings, ...newSettings };
    setVoiceSettings(updated);

    // Save to localStorage
    const currentSettings = StorageService.getSettings();
    StorageService.saveSettings({
      ...currentSettings,
      voice: updated
    });
  }, [voiceSettings]);

  const clearConversation = useCallback(() => {
    conversationHistory.current = [];
    setTranscript('');
    // Force a re-render by updating a state that triggers UI refresh
    setIsListening(false);
    setIsSpeaking(false);
  }, []);

  const getConversationHistory = useCallback(() => {
    return conversationHistory.current.slice();
  }, []);

  const checkMicrophonePermission = useCallback(async () => {
    return await voiceService.checkMicrophonePermission();
  }, []);

  const requestMicrophonePermission = useCallback(async () => {
    const granted = await voiceService.requestMicrophonePermission();
    setHasPermission(granted);
    if (granted) {
      toast({
        title: "Permission Granted",
        description: "Microphone access has been granted. You can now use voice features.",
      });
    } else {
      toast({
        title: "Permission Denied",
        description: "Microphone access was denied. Please enable it in your browser settings.",
        variant: "destructive"
      });
    }
    return granted;
  }, [toast]);

  return {
    // State
    isListening,
    transcript,
    isInterim,
    isSpeaking,
    hasPermission,
    voiceSettings,

    // Actions
    startListening,
    stopListening,
    speak,
    saveVoiceTranslation,
    addTranslationToHistory,
    updateVoiceSettings,
    clearConversation,
    checkMicrophonePermission,
    requestMicrophonePermission,

    // Data
    getConversationHistory,

    // Capabilities
    isRecognitionSupported: voiceService.isRecognitionSupported(),
    isSynthesisSupported: voiceService.isSynthesisSupported(),
    availableVoices: voiceService.getAvailableVoices()
  };
}