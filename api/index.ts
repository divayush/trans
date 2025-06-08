
import express, { Request, Response } from "express";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Translation endpoint optimized for Vercel
app.post('/api/translate', async (req: Request, res: Response) => {
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
      } catch (detectError: any) {
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
    } catch (googleError: any) {
      console.warn('Google Translate failed, trying LibreTranslate:', googleError instanceof Error ? googleError.message : String(googleError));
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
    } catch (libreError: any) {
      console.warn('LibreTranslate failed, trying MyMemory:', libreError instanceof Error ? libreError.message : String(libreError));
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
        const bestMatch = data.matches.find((match: any) => 
          (match.reference === 'Machine Translation.' || match['created-by'] === 'MT!') && 
          match.quality >= 70 && 
          match.translation && 
          match.translation.length > translatedText.length * 0.8
        );

        if (bestMatch) {
          translatedText = bestMatch.translation;
          confidence = bestMatch.match;
          console.log('Using better Hindi translation:', translatedText);
        }
      } else if (data.matches && data.matches.length > 0) {
        const mtMatch = data.matches.find((match: any) => 
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
  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// Handle all other routes
app.all('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// For Vercel, export the app directly
export default app;
