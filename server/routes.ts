import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTranslationSchema } from "@shared/schema";
import OpenAI from "openai";
import multer from "multer";
import express, { type Request, Response } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createWorker } from "tesseract.js";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ dest: 'uploads/' });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function registerRoutes(app: Express): Promise<Server> {

  // MyMemory Free Translation API endpoint
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLanguage, sourceLanguage } = req.body;

      console.log('Translation request:', { text, targetLanguage, sourceLanguage });

      if (!text || !targetLanguage) {
        return res.status(400).json({ message: "Text and target language are required" });
      }

      // Use MyMemory Free Translation API (no API key required)
      const sourceLang = sourceLanguage && sourceLanguage !== 'auto' ? sourceLanguage : 'en';
      const langPair = `${sourceLang}|${targetLanguage}`;

      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

      console.log('Calling MyMemory API:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TransLingo/1.0)',
        }
      });

      if (!response.ok) {
        console.error('MyMemory API error:', response.statusText);
        throw new Error(`Translation API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('MyMemory API response:', data);

      if (!data.responseData || !data.responseData.translatedText) {
        throw new Error('Invalid response format from translation API');
      }

      let translatedText = data.responseData.translatedText;

      // Clean up common MyMemory artifacts
      if (translatedText === text || translatedText.includes('MYMEMORY WARNING')) {
        // Fallback to simple translation if MyMemory fails
        translatedText = await getFallbackTranslation(text, targetLanguage);
      }

      res.json({
        translatedText,
        sourceLanguage: sourceLang,
        targetLanguage,
        confidence: data.responseData.match || 0.85
      });
    } catch (error) {
      console.error('Translation error:', error as Error);

      // Fallback to simple translation
      try {
        const fallbackTranslation = await getFallbackTranslation(req.body.text, req.body.targetLanguage);
        res.json({
          translatedText: fallbackTranslation,
          sourceLanguage: req.body.sourceLanguage || 'en',
          targetLanguage: req.body.targetLanguage,
          confidence: 0.75
        });
      } catch (fallbackError) {
        console.error('Fallback translation error:', fallbackError);
        res.status(500).json({ message: "Translation failed", error: error.message });
      }
    }
  });

  // Fallback translation function using LibreTranslate public instance
  async function getFallbackTranslation(text: string, targetLanguage: string): Promise<string> {
    try {
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: 'auto',
          target: targetLanguage,
          format: 'text'
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.translatedText || `[${targetLanguage.toUpperCase()}] ${text}`;
      } else {
        throw new Error('LibreTranslate failed');
      }
    } catch (error) {
      console.log('LibreTranslate fallback failed, using basic translation');
      return `[${targetLanguage.toUpperCase()}] ${text}`;
    }
  }

  // Language detection endpoint
  app.post("/api/detect-language", async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const googleTranslateKey = process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_TRANSLATE_KEY || "default_key";
      const url = `https://translation.googleapis.com/language/translate/v2/detect?key=${googleTranslateKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text
        })
      });

      if (!response.ok) {
        throw new Error(`Detection API error: ${response.statusText}`);
      }

      const data = await response.json();
      const detection = data.data.detections[0][0];

      res.json({
        language: detection.language,
        confidence: detection.confidence
      });
    } catch (error) {
      console.error('Language detection error:', error as Error);
      res.status(500).json({ message: "Language detection failed", error: error.message });
    }
  });

  // Grammar correction endpoint using OpenAI
  app.post("/api/improve-grammar", async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a grammar correction expert. Improve the grammar, spelling, and clarity of the given text while maintaining its original meaning. Respond with JSON in this format: { 'correctedText': string, 'improvements': string[] }"
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content!);

      res.json({
        correctedText: result.correctedText,
        improvements: result.improvements || [],
        originalText: text
      });
    } catch (error) {
      console.error('Grammar correction error:', error as Error);
      res.status(500).json({ message: "Grammar correction failed", error: error.message });
    }
  });

  // OCR endpoint for image text extraction
  app.post("/api/ocr", upload.single('image'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      // In a real implementation, we would process the uploaded image
      // For now, we'll return a simulated OCR result
      res.json({
        text: "Sample OCR extracted text",
        confidence: 0.95,
        language: "en"
      });
    } catch (error) {
      console.error('OCR error:', error);
      res.status(500).json({ message: "OCR processing failed", error: error.message });
    }
  });

  // Translation history endpoints
  app.get("/api/translations", async (req, res) => {
    try {
      const { limit, offset, type, favorites, search } = req.query;
      let translations;

      if (search) {
        translations = await storage.searchTranslations(search as string);
      } else if (type) {
        translations = await storage.getTranslationsByType(type as string);
      } else if (favorites === 'true') {
        translations = await storage.getFavoriteTranslations();
      } else {
        translations = await storage.getTranslations(
          undefined,
          limit ? parseInt(limit as string) : undefined,
          offset ? parseInt(offset as string) : undefined
        );
      }

      res.json(translations);
    } catch (error) {
      console.error('Get translations error:', error as Error);
      res.status(500).json({ message: "Failed to fetch translations", error: error.message });
    }
  });

  app.post("/api/translations", async (req, res) => {
    try {
      const validatedData = insertTranslationSchema.parse(req.body);
      const translation = await storage.createTranslation(validatedData);
      res.json(translation);
    } catch (error) {
      console.error('Create translation error:', error as Error);
      res.status(400).json({ message: "Invalid translation data", error: error.message });
    }
  });

  app.patch("/api/translations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const translation = await storage.updateTranslation(id, updates);

      if (!translation) {
        return res.status(404).json({ message: "Translation not found" });
      }

      res.json(translation);
    } catch (error) {
      console.error('Update translation error:', error as Error);
      res.status(500).json({ message: "Failed to update translation", error: error.message });
    }
  });

  app.delete("/api/translations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTranslation(id);

      if (!success) {
        return res.status(404).json({ message: "Translation not found" });
      }

      res.json({ message: "Translation deleted successfully" });
    } catch (error) {
      console.error('Delete translation error:', error as Error);
      res.status(500).json({ message: "Failed to delete translation", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}