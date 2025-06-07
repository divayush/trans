import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  app.post('/api/translate', async (req, res) => {
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

      // Try Google Translate first for better Hindi support
      try {
        const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${detectedSourceLang || 'auto'}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
        
        const googleResponse = await fetch(googleUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TransLingo/1.0)',
          }
        });

        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          console.log('Google Translate API response:', googleData);

          if (googleData && googleData[0] && googleData[0][0] && googleData[0][0][0]) {
            let translatedText = googleData[0].map(item => item[0]).join('');
            
            const result = {
              translatedText,
              sourceLanguage: googleData[2] || detectedSourceLang || 'en',
              targetLanguage,
              confidence: 0.95
            };
            return res.json(result);
          }
        }
      } catch (googleError) {
        console.warn('Google Translate failed, trying LibreTranslate:', googleError.message);
      }

      // Try LibreTranslate second
      try {
        const libreResponse = await fetch('https://libretranslate.com/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: detectedSourceLang === 'auto' ? 'auto' : detectedSourceLang || 'en',
            target: targetLanguage,
            format: 'text'
          })
        });

        if (libreResponse.ok) {
          const libreData = await libreResponse.json();
          console.log('LibreTranslate API response:', libreData);

          if (libreData.translatedText) {
            const result = {
              translatedText: libreData.translatedText,
              sourceLanguage: libreData.detectedLanguage || detectedSourceLang || 'en',
              targetLanguage,
              confidence: 0.9
            };
            return res.json(result);
          }
        }
      } catch (libreError) {
        console.warn('LibreTranslate failed, trying MyMemory:', libreError.message);
      }

      // Final fallback to MyMemory with better Hindi handling
      const langPair = `${detectedSourceLang || 'auto'}|${targetLanguage}`;
      const encodedText = encodeURIComponent(text);
      const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${langPair}&de=translingo@example.com&mt=1`;

      console.log('Calling MyMemory API as fallback:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('MyMemory API response:', data);

      if (data.responseStatus === 200 && data.responseData) {
        let translatedText = data.responseData.translatedText;
        let confidence = data.responseData.match || 0.8;

        // Special handling for Hindi translations - prioritize better quality matches
        if (targetLanguage === 'hi' && data.matches && data.matches.length > 0) {
          // Look for higher quality matches for Hindi
          const bestMatch = data.matches.find(match => 
            (match.reference === 'Machine Translation.' || match['created-by'] === 'MT!') && 
            match.quality >= 70 && 
            match.translation && 
            match.translation.length > translatedText.length * 0.8 // Ensure it's not too short
          );

          if (bestMatch) {
            translatedText = bestMatch.translation;
            confidence = bestMatch.match;
            console.log('Using better Hindi translation:', translatedText);
          }
        } else if (data.matches && data.matches.length > 0) {
          // For other languages, use standard logic
          const mtMatch = data.matches.find(match => 
            match.reference === 'Machine Translation.' || match['created-by'] === 'MT!'
          );

          if (mtMatch && mtMatch.quality >= 60) {
            translatedText = mtMatch.translation;
            confidence = mtMatch.match;
            console.log('Using machine translation for better quality:', translatedText);
          }
        }

        const result = {
          translatedText,
          sourceLanguage: detectedSourceLang || 'en',
          targetLanguage,
          confidence
        };

        res.json(result);
      } else {
        throw new Error('All translation services failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({ error: 'Translation failed' });
    }
  });
})();