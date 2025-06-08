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

  // Translation API endpoint with LibreTranslate first, then Google, then MyMemory
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLanguage, sourceLanguage } = req.body;
      console.log('Translation request:', { text, targetLanguage, sourceLanguage });

      if (!text || !targetLanguage) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Auto-detect language if not provided or set to 'auto'
      let detectedSourceLang = sourceLanguage;
      if (!sourceLanguage || sourceLanguage === 'auto') {
        try {
          const detectResponse = await fetch('https://ws.detectlanguage.com/0.2/detect', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer demo', // Free demo key
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ q: text })
          });

          if (detectResponse.ok) {
            const detectData = await detectResponse.json();
            if (detectData.data && detectData.data.detections && detectData.data.detections.length > 0) {
              detectedSourceLang = detectData.data.detections[0].language;
              console.log('Detected language:', detectedSourceLang);
            }
          }
        } catch (detectError) {
          console.warn('Language detection failed, using fallback');
        }
      }

      // Try LibreTranslate first as primary service
      try {
        console.log('Trying LibreTranslate API...');
        const libreResponse = await fetch('https://libretranslate.com/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; TransLingo/1.0)',
          },
          body: JSON.stringify({
            q: text,
            source: detectedSourceLang === 'auto' ? 'auto' : detectedSourceLang || 'en',
            target: targetLanguage,
            format: 'text'
          })
        });

        console.log('LibreTranslate response status:', libreResponse.status);
        
        if (libreResponse.ok) {
          const libreData = await libreResponse.json();
          console.log('LibreTranslate API response:', libreData);

          if (libreData.translatedText) {
            const result = {
              translatedText: libreData.translatedText,
              sourceLanguage: libreData.detectedLanguage || detectedSourceLang || 'en',
              targetLanguage,
              confidence: 0.95
            };
            console.log('LibreTranslate success, returning result');
            return res.json(result);
          }
        } else {
          const errorText = await libreResponse.text();
          console.warn('LibreTranslate API error:', libreResponse.status, errorText);
        }
      } catch (libreError) {
        console.warn('LibreTranslate failed with error:', libreError instanceof Error ? libreError.message : String(libreError));
      }

      // Try Google Translate as backup
      try {
        console.log('Trying Google Translate API...');
        const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${detectedSourceLang || 'auto'}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
        
        const googleResponse = await fetch(googleUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TransLingo/1.0)',
          }
        });

        console.log('Google Translate response status:', googleResponse.status);

        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          console.log('Google Translate API response:', googleData);

          if (googleData && googleData[0] && googleData[0][0] && googleData[0][0][0]) {
            let translatedText = googleData[0].map(item => item[0]).join('');
            
            const result = {
              translatedText,
              sourceLanguage: googleData[2] || detectedSourceLang || 'en',
              targetLanguage,
              confidence: 0.9
            };
            console.log('Google Translate success, returning result');
            return res.json(result);
          }
        } else {
          const errorText = await googleResponse.text();
          console.warn('Google Translate API error:', googleResponse.status, errorText);
        }
      } catch (googleError) {
        console.warn('Google Translate failed with error:', googleError instanceof Error ? googleError.message : String(googleError));
      }

      // Try MyMemory as final fallback
      try {
        console.log('Trying MyMemory API...');
        const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${detectedSourceLang || 'en'}|${targetLanguage}`;
        console.log('Calling MyMemory API:', myMemoryUrl);
        
        const myMemoryResponse = await fetch(myMemoryUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TransLingo/1.0)',
          }
        });

        if (myMemoryResponse.ok) {
          const myMemoryData = await myMemoryResponse.json();
          console.log('MyMemory API response:', myMemoryData);

          if (myMemoryData.responseData && myMemoryData.responseData.translatedText) {
            const result = {
              translatedText: myMemoryData.responseData.translatedText,
              sourceLanguage: detectedSourceLang || 'en',
              targetLanguage,
              confidence: myMemoryData.responseData.match || 0.8
            };
            console.log('MyMemory success, returning result');
            return res.json(result);
          }
        } else {
          console.warn('MyMemory API error:', myMemoryResponse.status);
        }
      } catch (myMemoryError) {
        console.warn('MyMemory failed with error:', myMemoryError instanceof Error ? myMemoryError.message : String(myMemoryError));
      }

      // If all translation services fail, return an error
      throw new Error('All translation services are currently unavailable. Please try again later.');
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({ error: 'Translation failed' });
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