import { translations, type Translation, type InsertTranslation } from "@shared/schema";

export interface IStorage {
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  getTranslations(userId?: number, limit?: number, offset?: number): Promise<Translation[]>;
  getTranslationById(id: number): Promise<Translation | undefined>;
  updateTranslation(id: number, updates: Partial<Translation>): Promise<Translation | undefined>;
  deleteTranslation(id: number): Promise<boolean>;
  searchTranslations(query: string, userId?: number): Promise<Translation[]>;
  getTranslationsByType(type: string, userId?: number): Promise<Translation[]>;
  getFavoriteTranslations(userId?: number): Promise<Translation[]>;
}

export class MemStorage implements IStorage {
  private translations: Map<number, Translation>;
  private currentId: number;

  constructor() {
    this.translations = new Map();
    this.currentId = 1;
  }

  async createTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const id = this.currentId++;
    const translation: Translation = {
      ...insertTranslation,
      id,
      createdAt: new Date(),
    };
    this.translations.set(id, translation);
    return translation;
  }

  async getTranslations(userId?: number, limit = 50, offset = 0): Promise<Translation[]> {
    let results = Array.from(this.translations.values());
    
    if (userId) {
      results = results.filter(t => t.userId === userId);
    }
    
    // Sort by creation date, newest first
    results.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    
    return results.slice(offset, offset + limit);
  }

  async getTranslationById(id: number): Promise<Translation | undefined> {
    return this.translations.get(id);
  }

  async updateTranslation(id: number, updates: Partial<Translation>): Promise<Translation | undefined> {
    const existing = this.translations.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.translations.set(id, updated);
    return updated;
  }

  async deleteTranslation(id: number): Promise<boolean> {
    return this.translations.delete(id);
  }

  async searchTranslations(query: string, userId?: number): Promise<Translation[]> {
    const lowerQuery = query.toLowerCase();
    let results = Array.from(this.translations.values());
    
    if (userId) {
      results = results.filter(t => t.userId === userId);
    }
    
    return results.filter(t =>
      t.sourceText.toLowerCase().includes(lowerQuery) ||
      t.translatedText.toLowerCase().includes(lowerQuery)
    );
  }

  async getTranslationsByType(type: string, userId?: number): Promise<Translation[]> {
    let results = Array.from(this.translations.values());
    
    if (userId) {
      results = results.filter(t => t.userId === userId);
    }
    
    return results.filter(t => t.type === type);
  }

  async getFavoriteTranslations(userId?: number): Promise<Translation[]> {
    let results = Array.from(this.translations.values());
    
    if (userId) {
      results = results.filter(t => t.userId === userId);
    }
    
    return results.filter(t => t.isFavorite);
  }
}

export const storage = new MemStorage();
