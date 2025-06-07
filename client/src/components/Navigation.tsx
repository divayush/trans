import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Languages, Mic, History, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useState } from 'react';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Languages, label: 'Translate', path: '/translate' },
  { icon: Mic, label: 'Voice', path: '/voice' },
  { icon: History, label: 'History', path: '/history' },
];

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-4 left-1/2 transform -translate-x-1/2 z-50 glass-morphism rounded-2xl p-2 border border-white/10">
        <div className="flex space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <motion.div
                key={item.path}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLocation(item.path)}
                  className={`
                    relative overflow-hidden transition-all duration-300
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeBackground"
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md -z-10"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom">
        <div className="glass-morphism border-t border-white/10 px-4 py-3">
          <div className="flex justify-around items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <motion.div
                  key={item.path}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-col items-center"
                >
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => setLocation(item.path)}
                    className={`
                      flex flex-col items-center justify-center p-3 h-16 w-16 rounded-xl transition-all duration-300
                      ${isActive 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg neon:glow' 
                        : 'text-gray-600 dark:text-gray-300 neon:text-cyan-200/70 hover:text-gray-900 dark:hover:text-white hover:bg-white/10'
                      }
                    `}
                  >
                    <Icon className={`${isActive ? 'w-6 h-6' : 'w-5 h-5'} mb-1`} />
                    <span className={`text-xs font-medium ${isActive ? 'text-white' : ''}`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="mobileActiveBackground"
                        className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl -z-10"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile menu toggle (if needed for additional options) */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="glass-morphism rounded-xl p-2 border border-white/10"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </motion.div>
      </div>

      {/* Mobile overlay menu (if needed) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 bottom-0 w-64 glass-morphism border-l border-white/10 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col space-y-4 mt-16">
                {/* Additional menu items can go here */}
                <div className="text-center text-sm text-gray-500 neon:text-cyan-200/50">
                  Translation App v1.0
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const navItems = [
  { path: '/', icon: Home, label: 'Home', gradient: 'from-blue-500 to-purple-600' },
  { path: '/translate', icon: Languages, label: 'Translate', gradient: 'from-green-500 to-teal-600' },
  { path: '/voice', icon: Mic, label: 'Voice', gradient: 'from-purple-500 to-pink-600' },
  { path: '/history', icon: History, label: 'History', gradient: 'from-gray-500 to-gray-700' },
];

export function Navigation() {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 hidden md:block"
      >
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="glass-morphism rounded-2xl px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => setLocation('/')}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 neon:from-cyan-400 neon:to-pink-500 flex items-center justify-center">
                  <Languages className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 neon:from-cyan-400 neon:to-pink-400 bg-clip-text text-transparent">
                  Chiefu
                </span>
              </motion.div>

              {/* Navigation Items */}
              <div className="flex items-center space-x-2">
                {navItems.map((item, index) => {
                  const isActive = location === item.path;
                  const Icon = item.icon;

                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setLocation(item.path)}
                        className={`
                          relative px-4 py-2 rounded-xl transition-all duration-300
                          ${isActive 
                            ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg neon:glow` 
                            : 'hover:bg-white/10 neon:hover:bg-cyan-500/10'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        <span className="font-medium">{item.label}</span>

                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-white/10"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="fixed top-0 left-0 right-0 z-50 safe-top"
        >
          <div className="glass-morphism mx-4 mt-4 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Mobile Logo */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-3"
                onClick={() => setLocation('/')}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 neon:from-cyan-400 neon:to-pink-500 flex items-center justify-center">
                  <Languages className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 neon:from-cyan-400 neon:to-pink-400 bg-clip-text text-transparent">
                  Chiefu
                </span>
              </motion.div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="w-10 h-10 rounded-xl hover:bg-white/10 neon:hover:bg-cyan-500/10"
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={toggleMobileMenu}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="fixed top-20 left-4 right-4 z-50 safe-top"
              >
                <div className="glass-morphism rounded-2xl p-6 space-y-3">
                  {navItems.map((item, index) => {
                    const isActive = location === item.path;
                    const Icon = item.icon;

                    return (
                      <motion.div
                        key={item.path}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          size="lg"
                          onClick={() => {
                            setLocation(item.path);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`
                            w-full justify-start rounded-xl transition-all duration-300
                            ${isActive 
                              ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg neon:glow` 
                              : 'hover:bg-white/10 neon:hover:bg-cyan-500/10'
                            }
                          `}
                        >
                          <Icon className="w-5 h-5 mr-3" />
                          <span className="font-medium">{item.label}</span>
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Bottom Navigation */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="fixed bottom-0 left-0 right-0 z-40 safe-bottom"
        >
          <div className="glass-morphism mx-4 mb-4 rounded-2xl p-2">
            <div className="flex justify-center items-center gap-1">
              {navItems.map((item, index) => {
                const isActive = location === item.path;
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.path}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(item.path)}
                      className={`
                        flex flex-col items-center justify-center p-3 h-16 w-full rounded-xl transition-all duration-300 mobile-nav-button
                        ${isActive 
                          ? 'bg-white/20 neon:bg-cyan-500/20' 
                          : 'hover:bg-white/10 neon:hover:bg-cyan-500/10'
                        }
                      `}
                    >
                      <div className={`
                        w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 mb-1
                        ${isActive 
                          ? `bg-gradient-to-br ${item.gradient} text-white neon:glow` 
                          : 'text-gray-600 dark:text-gray-400 neon:text-cyan-400'
                        }
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`
                        text-xs font-medium transition-colors duration-300 text-center leading-tight
                        ${isActive 
                          ? 'text-gray-900 dark:text-gray-100 neon:text-cyan-300' 
                          : 'text-gray-600 dark:text-gray-400 neon:text-cyan-400'
                        }
                      `}>
                        {item.label}
                      </span>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}