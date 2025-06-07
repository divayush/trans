export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

export interface TranslationHistory {
  id: number;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  type: 'text' | 'voice' | 'ocr';
  isFavorite: boolean;
  metadata?: any;
  createdAt: Date;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
}

export interface GrammarCorrection {
  correctedText: string;
  improvements: string[];
  originalText: string;
}

export type Theme = 'light' | 'dark' | 'neon';

export interface ThemeConfig {
  name: Theme;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    card: string;
    text: string;
    border: string;
  };
}
