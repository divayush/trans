import type { TranslationHistory, Language } from "@/types";

export class StorageService {
  private static readonly HISTORY_KEY = 'translingo-history';
  private static readonly FAVORITES_KEY = 'translingo-favorites';
  private static readonly SETTINGS_KEY = 'translingo-settings';

  static saveTranslation(translation: Omit<TranslationHistory, 'id' | 'createdAt'>): void {
    const history = this.getHistory();
    const newTranslation: TranslationHistory = {
      ...translation,
      id: Date.now(),
      createdAt: new Date()
    };
    
    history.unshift(newTranslation);
    
    // Keep only last 1000 translations
    if (history.length > 1000) {
      history.splice(1000);
    }
    
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
  }

  static getHistory(): TranslationHistory[] {
    try {
      const stored = localStorage.getItem(this.HISTORY_KEY);
      if (!stored) return [];
      
      const history = JSON.parse(stored);
      return history.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt)
      }));
    } catch {
      return [];
    }
  }

  static getFavorites(): TranslationHistory[] {
    return this.getHistory().filter(item => item.isFavorite);
  }

  static toggleFavorite(id: number): void {
    const history = this.getHistory();
    const index = history.findIndex(item => item.id === id);
    
    if (index !== -1) {
      history[index].isFavorite = !history[index].isFavorite;
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    }
  }

  static deleteTranslation(id: number): void {
    const history = this.getHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(filtered));
  }

  static searchHistory(query: string): TranslationHistory[] {
    const history = this.getHistory();
    const lowerQuery = query.toLowerCase();
    
    return history.filter(item => 
      item.sourceText.toLowerCase().includes(lowerQuery) ||
      item.translatedText.toLowerCase().includes(lowerQuery)
    );
  }

  static getHistoryByType(type: string): TranslationHistory[] {
    return this.getHistory().filter(item => item.type === type);
  }

  static clearHistory(): void {
    localStorage.removeItem(this.HISTORY_KEY);
  }

  static saveSettings(settings: any): void {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  static getSettings(): any {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
}
