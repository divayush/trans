import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { TranslationService } from '@/lib/translationService';
import { StorageService } from '@/lib/storageService';
import { useToast } from '@/hooks/use-toast';
import type { TranslationResult, GrammarCorrection } from '@/types';

export function useTranslation() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const { toast } = useToast();

  const translateMutation = useMutation({
    mutationFn: ({ text, target, source }: { text: string; target: string; source?: string }) =>
      TranslationService.translateText(text, target, source),
    onSuccess: (result: TranslationResult) => {
      setTranslatedText(result.translatedText);
      setSourceLanguage(result.sourceLanguage);

      // Save to history
      StorageService.saveTranslation({
        sourceText,
        translatedText: result.translatedText,
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage,
        type: 'text',
        isFavorite: false,
        metadata: { confidence: result.confidence }
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Translation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Grammar correction removed

  const detectLanguageMutation = useMutation({
    mutationFn: (text: string) => TranslationService.detectLanguage(text),
    onSuccess: (result) => {
      setSourceLanguage(result.language);
      toast({
        title: "Language Detected",
        description: `Detected: ${result.language} (${Math.round(result.confidence * 100)}% confidence)`
      });
    }
  });

  const translate = useCallback(async (text?: string, sourceLang?: string, targetLang?: string) => {
    const textToTranslate = text || sourceText;
    if (!textToTranslate.trim()) return Promise.resolve();

    // Update source text if provided
    if (text) {
      setSourceText(text);
    }

    try {
      const result = await translateMutation.mutateAsync({
        text: textToTranslate,
        target: targetLang || targetLanguage,
        source: sourceLang || sourceLanguage
      });
      return result;
    } catch (error) {
      console.error('Translation failed:', error);
      throw error;
    }
  }, [sourceText, sourceLanguage, targetLanguage, translateMutation]);

  // Grammar improvement removed

  const detectLanguage = useCallback((text?: string) => {
    const textToDetect = text || sourceText;
    if (!textToDetect.trim()) return;
    detectLanguageMutation.mutate(textToDetect);
  }, [sourceText, detectLanguageMutation]);

  const swapLanguages = useCallback(() => {
    const tempSourceLang = sourceLanguage;
    const tempTargetLang = targetLanguage;
    const tempSourceText = sourceText;
    const tempTranslatedText = translatedText;

    setSourceLanguage(tempTargetLang);
    setTargetLanguage(tempSourceLang);
    setSourceText(tempTranslatedText);
    setTranslatedText(tempSourceText);
  }, [sourceLanguage, targetLanguage, sourceText, translatedText]);

  const clear = useCallback(() => {
    setSourceText('');
    setTranslatedText('');
  }, []);

  return {
    // State
    sourceText,
    translatedText,
    sourceLanguage,
    targetLanguage,

    // Setters
    setSourceText,
    setTranslatedText,
    setSourceLanguage,
    setTargetLanguage,

    // Actions
    translate,
    detectLanguage,
    swapLanguages,
    clear,

    // Status
    isTranslating: translateMutation.isPending,
    isDetectingLanguage: detectLanguageMutation.isPending,

    // Results
    translationError: translateMutation.error
  };
}