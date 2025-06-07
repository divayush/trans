import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Languages, Camera, Mic, Sparkles, Wifi, Smartphone, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from 'wouter';

const features = [
  {
    icon: Languages,
    title: 'Real-time Translation',
    description: 'Instant translation between multiple languages with neural networks',
  },
  {
    icon: Mic,
    title: 'Voice Input',
    description: 'Speak naturally and get voice-to-voice translation',
  },
  {
    icon: Sparkles,
    title: 'Grammar Correction',
    description: 'AI-powered grammar correction and writing improvements',
  },
  {
    icon: Wifi,
    title: 'Web Based',
    description: 'Works on any device with a modern web browser',
  },
  {
    icon: Smartphone,
    title: 'Mobile Optimized',
    description: 'Responsive design for all screen sizes',
  },
];

const realFeatures = [
  { value: '12+', label: 'Languages Supported' },
  { value: 'AI', label: 'Grammar Correction' },
  { value: 'Voice', label: 'Speech Recognition' },
  { value: 'Web', label: 'Cross Platform' },
];

export default function HomePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/20 neon:glow neon:holographic"
        >
          <Globe className="w-12 h-12 text-blue-400 neon:text-cyan-400" />
        </motion.div>

        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent neon:glitch neon:text-cyan-400" data-text="Chiefu">
            Chiefu
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          AI-powered translation app with OCR, voice input, and real-time language detection
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => setLocation('/translate')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 neon:from-cyan-500 neon:to-pink-500 neon:glow-hover neon:holographic transition-all duration-300"
          >
            <Languages className="w-5 h-5 mr-2" />
            Start Translating
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => setLocation('/voice')}
            className="border-white/20 hover:bg-white/10 neon:border-cyan-500/50 neon:hover:border-cyan-400 neon:hover:bg-cyan-500/10 neon:glow"
          >
            <Mic className="w-5 h-5 mr-2" />
            Voice Translation
          </Button>
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
      >
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group"
            >
              <Card className="h-full bg-white/5 backdrop-blur-xl border-white/10 hover:border-blue-400/50 neon:hover:border-cyan-400/70 neon:glow-hover transition-all duration-300 neon:holographic">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 neon:from-cyan-500/30 neon:to-pink-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 neon:glow">
                    <Icon className="w-6 h-6 text-blue-400 neon:text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 neon:text-cyan-300">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 neon:text-cyan-100/80">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
      >
        {realFeatures.map((feature, index) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-blue-400/50 neon:border-cyan-500/30 neon:hover:border-cyan-400/70 neon:glow transition-all duration-300 neon:holographic"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 + index * 0.2 }}
              className="text-3xl font-bold text-blue-400 neon:text-cyan-400 neon:glow mb-2"
            >
              {feature.value}
            </motion.div>
            <div className="text-gray-600 dark:text-gray-300 neon:text-cyan-100/70">{feature.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
