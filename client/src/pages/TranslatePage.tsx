import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Mic, Clipboard, Volume2, Copy, Share, Sparkles, Camera, History, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from '@/hooks/useTranslation';
import { useVoice } from '@/hooks/useVoice';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export default function TranslatePage() {
  const {
    sourceText,
    translatedText,
    sourceLanguage,
    targetLanguage,
    setSourceText,
    setSourceLanguage,
    setTargetLanguage,
    translate,
    swapLanguages,
    clear,
    isTranslating
  } = useTranslation();

  const { speak, isSpeaking } = useVoice();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Removed auto-translation

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy text to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TransLingo Translation',
          text: text
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      handleCopy(text);
    }
  };

  const handleSpeak = async (text: string, language: string) => {
    try {
      await speak(text, language);
    } catch (error) {
      toast({
        title: "Speech Error",
        description: "Unable to speak the text.",
        variant: "destructive"
      });
    }
  };

  const characterCount = sourceText.length;
  const wordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4">
      {/* Language Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="mb-4 sm:mb-6 bg-white/5 backdrop-blur-xl border-white/10 neon:border-cyan-500/30 neon:glow neon:holographic">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0 sm:justify-between">
              <div className="w-full sm:flex-1">
                <LanguageSelector
                  value={sourceLanguage}
                  onValueChange={setSourceLanguage}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={swapLanguages}
                className="mx-0 sm:mx-4 hover:bg-white/10 neon:hover:bg-cyan-500/20 hover:rotate-180 transition-all duration-300 neon:glow order-3 sm:order-2"
              >
                <ArrowLeftRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div className="w-full sm:flex-1 order-2 sm:order-3">
                <LanguageSelector
                  value={targetLanguage}
                  onValueChange={setTargetLanguage}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Translation Interface */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
      >
        {/* Input Section */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 neon:border-cyan-500/30 neon:glow neon:holographic">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-semibold text-base sm:text-lg">Original Text</h3>
              <div className="flex space-x-1 sm:space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-white/10 neon:hover:bg-cyan-500/20 neon:text-cyan-300 neon:glow"
                  onClick={() => setLocation('/voice')}
                >
                  <Mic className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-white/10 neon:hover:bg-cyan-500/20 neon:text-cyan-300 neon:glow"
                  onClick={() => navigator.clipboard.readText().then(setSourceText)}
                >
                  <Clipboard className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>

            <Textarea
              placeholder="Enter text to translate..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="w-full h-28 sm:h-32 bg-white/5 border-white/10 neon:border-cyan-500/30 neon:bg-black/30 resize-none focus:ring-2 focus:ring-blue-500 neon:focus:ring-cyan-400 neon:focus:border-cyan-400 transition-all text-sm sm:text-base"
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 sm:mt-4 gap-2 sm:gap-0 text-xs sm:text-sm text-gray-500">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span>Chars: <span className="font-medium">{characterCount}</span></span>
                <span>Words: <span className="font-medium">{wordCount}</span></span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => translate()}
                disabled={!sourceText.trim() || isTranslating}
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 neon:text-cyan-400 neon:hover:text-cyan-300 neon:hover:bg-cyan-500/20 neon:glow h-8 text-xs sm:text-sm"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {isTranslating ? 'Translating...' : 'Translate'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 neon:border-cyan-500/30 neon:glow neon:holographic">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-semibold text-base sm:text-lg">Translation</h3>
              <div className="flex space-x-1 sm:space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-white/10 neon:hover:bg-cyan-500/20 neon:text-cyan-300 neon:glow"
                  onClick={() => handleSpeak(translatedText, targetLanguage)}
                  disabled={!translatedText || isSpeaking}
                >
                  <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-white/10 neon:hover:bg-cyan-500/20 neon:text-cyan-300 neon:glow"
                  onClick={() => handleCopy(translatedText)}
                  disabled={!translatedText}
                >
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-white/10 neon:hover:bg-cyan-500/20 neon:text-cyan-300 neon:glow"
                  onClick={() => handleShare(translatedText)}
                  disabled={!translatedText}
                >
                  <Share className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>

            <div className="w-full h-28 sm:h-32 p-3 sm:p-4 bg-white/5 border border-white/10 neon:border-cyan-500/30 neon:bg-black/30 rounded-lg neon:glow">
              {isTranslating ? (
                <div className="flex items-center justify-center h-full">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full"
                  />
                  <span className="ml-2 text-gray-400">Translating...</span>
                </div>
              ) : translatedText ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-sm sm:text-lg leading-relaxed break-words"
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                >
                  {translatedText}
                </motion.div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm sm:text-base text-center">
                  Translation will appear here
                </div>
              )}
            </div>

            {translatedText && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mt-4"
              >
                <div className="flex items-center space-x-2 text-sm text-green-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Translation complete</span>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6"
      >
        <Button
          variant="outline"
          className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-400/50"
          onClick={() => setLocation('/camera')}
        >
          <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-xs sm:text-sm">Scan Image</span>
        </Button>

        <Button
          variant="outline"
          className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-400/50"
          onClick={() => setLocation('/voice')}
        >
          <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-xs sm:text-sm">Voice Input</span>
        </Button>

        <Button
          variant="outline"
          className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-400/50"
          onClick={() => setLocation('/history')}
        >
          <History className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-xs sm:text-sm">Recent</span>
        </Button>

        <Button
          variant="outline"
          className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-400/50"
          onClick={clear}
          disabled={!sourceText && !translatedText}
        >
          <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-xs sm:text-sm">Clear</span>
        </Button>
      </motion.div>
    </div>
  );
}