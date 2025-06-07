import { apiRequest } from "./queryClient";
import type { TranslationResult } from "@/types";

export class TranslationService {
  private static readonly API_URL = 'https://api.mymemory.translated.net/get';

  static async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    try {
      console.log('Translating:', { text, targetLanguage, sourceLanguage });
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          targetLanguage,
          sourceLanguage: sourceLanguage || 'auto',
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Translation API error:', errorData);
        throw new Error(`Translation failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Translation result:', result);

      // Ensure we have the required fields
      if (!result.translatedText) {
        throw new Error('Invalid translation response');
      }

      return {
        translatedText: result.translatedText,
        sourceLanguage: result.sourceLanguage || sourceLanguage || 'auto',
        targetLanguage: result.targetLanguage || targetLanguage,
        confidence: result.confidence || 0.9
      };
    } catch (error) {
      console.error('Translation service error:', error);
      throw new Error('Failed to translate text. Please check your connection and try again.');
    }
  }

  static async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    try {
      // Simple language detection fallback
      return {
        language: 'en',
        confidence: 0.8
      };
    } catch (error) {
      throw new Error('Language detection failed');
    }
  }

  static async saveTranslation(translation: {
    sourceText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    type: 'text' | 'voice' | 'ocr';
    metadata?: any;
  }) {
    try {
      const response = await apiRequest('POST', '/api/translations', translation);
      return await response.json();
    } catch (error) {
      console.error('Save translation error:', error);
    }
  }
}