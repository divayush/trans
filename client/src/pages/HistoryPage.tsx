import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, List, Star, Type, Mic, Camera, Trash2, Copy, Share, Play, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { StorageService } from '@/lib/storageService';
import { useToast } from '@/hooks/use-toast';
import { useVoice } from '@/hooks/useVoice';
import type { TranslationHistory } from '@/types';

const filterTabs = [
  { id: 'all', label: 'All', icon: List },
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'voice', label: 'Voice', icon: Mic },
];

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [history, setHistory] = useState<TranslationHistory[]>(() => StorageService.getHistory());
  const { toast } = useToast();
  const { speak, isSpeaking } = useVoice();

  const filteredHistory = useMemo(() => {
    let filtered = history;

    // Apply search filter
    if (searchQuery) {
      filtered = StorageService.searchHistory(searchQuery);
    }

    // Apply type filter
    switch (activeFilter) {
      case 'favorites':
        filtered = filtered.filter(item => item.isFavorite);
        break;
      case 'text':
      case 'voice':
        filtered = filtered.filter(item => item.type === activeFilter);
        break;
      default:
        break;
    }

    return filtered;
  }, [history, searchQuery, activeFilter]);

  const handleToggleFavorite = (id: number) => {
    StorageService.toggleFavorite(id);
    setHistory(StorageService.getHistory());
    toast({
      title: "Updated",
      description: "Favorite status updated."
    });
  };

  const handleDelete = (id: number) => {
    StorageService.deleteTranslation(id);
    setHistory(StorageService.getHistory());
    toast({
      title: "Deleted",
      description: "Translation removed from history."
    });
  };

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

  const handleShare = async (item: TranslationHistory) => {
    const shareText = `Original: ${item.sourceText}\nTranslation: ${item.translatedText}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TransLingo Translation',
          text: shareText
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      handleCopy(shareText);
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

  const clearAllHistory = () => {
    StorageService.clearHistory();
    setHistory([]);
    toast({
      title: "Cleared",
      description: "All translation history has been cleared."
    });
  };

  const stats = useMemo(() => {
    const total = history.length;
    const languages = new Set(history.flatMap(h => [h.sourceLanguage, h.targetLanguage])).size;
    const favorites = history.filter(h => h.isFavorite).length;
    const streak = 7; // This would be calculated based on actual usage

    return { total, languages, favorites, streak };
  }, [history]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'voice': return Mic;
      default: return Type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'voice': return 'text-purple-500 bg-purple-500/20';
      default: return 'text-blue-500 bg-blue-500/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h2 className="text-3xl font-bold mb-2">Translation History</h2>
          <p className="text-gray-600 dark:text-gray-300">
            View and manage your past translations
          </p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search translations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 neon:bg-cyan-500/5 neon:border-cyan-500/20 overflow-hidden"
      >
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;

            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter(tab.id)}
                className={`
                  flex-shrink-0 rounded-xl transition-all duration-300 whitespace-nowrap
                  ${isActive 
                    ? 'bg-blue-500 text-white shadow-lg neon:bg-cyan-500 neon:glow' 
                    : 'hover:bg-white/10 neon:hover:bg-cyan-500/10'
                  }
                `}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </motion.div>

      {/* History Items */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="space-y-4"
      >
        {filteredHistory.length === 0 ? (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                {searchQuery ? (
                  <>
                    <Search className="w-12 h-12 mx-auto mb-4" />
                    <p>No translations found matching "{searchQuery}"</p>
                  </>
                ) : (
                  <>
                    <List className="w-12 h-12 mx-auto mb-4" />
                    <p>No translations in this category yet</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredHistory.map((item, index) => {
            const TypeIcon = getTypeIcon(item.type);
            const typeColor = getTypeColor(item.type);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-blue-400/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColor}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium">
                              {item.sourceLanguage.toUpperCase()} → {item.targetLanguage.toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
                              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleFavorite(item.id)}
                              className={`${
                                item.isFavorite ? 'text-yellow-500' : 'text-gray-400'
                              } hover:text-yellow-400`}
                            >
                              <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                            </Button>

                            {item.type === 'voice' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSpeak(item.sourceText, item.sourceLanguage)}
                                disabled={isSpeaking}
                                className="text-gray-400 hover:text-blue-400"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopy(item.translatedText)}
                              className="text-gray-400 hover:text-green-400"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleShare(item)}
                              className="text-gray-400 hover:text-blue-400"
                            >
                              <Share className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                              className="text-gray-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Original:</p>
                            <p className="text-sm line-clamp-3">{item.sourceText}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Translation:</p>
                            <p className="text-sm line-clamp-3">{item.translatedText}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                          <span>{item.createdAt.toLocaleDateString()} at {item.createdAt.toLocaleTimeString()}</span>
                          {item.metadata?.confidence && (
                            <span>Confidence: {Math.round(item.metadata.confidence * 100)}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Load More */}
      {filteredHistory.length > 0 && filteredHistory.length >= 10 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-8"
        >
          <Button variant="outline" className="border-white/20 hover:bg-white/10">
            Load More Translations
          </Button>
        </motion.div>
      )}

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-8"
      >
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Your Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">{stats.total}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Translations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">{stats.languages}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Languages Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">{stats.favorites}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Favorites</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">{stats.streak}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Days Streak</div>
              </div>
            </div>

            {history.length > 0 && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={clearAllHistory}
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All History
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}