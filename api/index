
import express, { type Request, Response, NextFunction } from "express";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const apiPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (apiPath.startsWith("/api")) {
      let logLine = `${req.method} ${apiPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Translation API endpoint
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
            'Authorization': 'Bearer demo',
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

    // Try Google Translate first
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
          let translatedText = googleData[0].map((item: any) => item[0]).join('');
          
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
      console.warn('Google Translate failed, trying MyMemory:', (googleError as Error).message);
    }

    // Fallback to MyMemory
    const langPair = `${detectedSourceLang || 'auto'}|${targetLanguage}`;
    const encodedText = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${langPair}&de=translingo@example.com&mt=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData) {
      let translatedText = data.responseData.translatedText;
      let confidence = data.responseData.match || 0.8;

      if (targetLanguage === 'hi' && data.matches && data.matches.length > 0) {
        const bestMatch = data.matches.find((match: any) => 
          (match.reference === 'Machine Translation.' || match['created-by'] === 'MT!') && 
          match.quality >= 70 && 
          match.translation && 
          match.translation.length > translatedText.length * 0.8
        );

        if (bestMatch) {
          translatedText = bestMatch.translation;
          confidence = bestMatch.match;
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
      throw new Error('Translation failed');
    }
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export default app;
