import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Plus, Sun, Moon, Zap, Home, Languages, Mic, History } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/components/ThemeProvider";
import HomePage from "@/pages/HomePage";
import TranslatePage from "@/pages/TranslatePage";
import VoicePage from "@/pages/VoicePage";
import HistoryPage from "@/pages/HistoryPage";
import NotFound from "@/pages/not-found";
import { motion } from "framer-motion";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themeButtons = [
    { theme: 'light' as const, icon: Sun, gradient: 'from-blue-400 to-purple-500' },
    { theme: 'dark' as const, icon: Moon, gradient: 'from-gray-700 to-gray-900' },
    { theme: 'neon' as const, icon: Zap, gradient: 'from-cyan-400 to-pink-500' },
  ];

  return (
    <div className="fixed top-4 right-4 z-40 safe-top">
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-full p-1.5 border border-white/20 shadow-lg">
        <div className="flex space-x-1">
          {themeButtons.map(({ theme: themeOption, icon: Icon, gradient }) => (
            <Button
              key={themeOption}
              variant="ghost"
              size="icon"
              onClick={() => setTheme(themeOption)}
              className={`w-7 h-7 rounded-full bg-gradient-to-r ${gradient} transition-all duration-300 hover:scale-110 ${
                theme === themeOption ? 'ring-2 ring-white shadow-lg' : ''
              }`}
            >
              <Icon className="w-3 h-3 text-white" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FloatingActionButton() {
  return null;
}

function Router() {
  return (
    <div className="pt-20 pb-24 md:pt-24 md:pb-8 min-h-screen max-w-full overflow-x-hidden">
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/translate" component={TranslatePage} />
        <Route path="/voice" component={VoicePage} />
        <Route path="/history" component={HistoryPage} />
        <Route default component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  const [location, setLocation] = useLocation();
  const showNavigation = location !== '/404';

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
            {/* Theme Toggle */}
          <div className="fixed top-4 right-4 z-50 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="glass-morphism rounded-lg border border-white/10 hover:bg-white/10 w-10 h-10 p-0"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost" 
              size="sm"
              onClick={() => setTheme(theme === 'neon' ? 'dark' : 'neon')}
              className="glass-morphism rounded-lg border border-white/10 hover:bg-white/10 w-10 h-10 p-0"
            >
              <Zap className="w-4 h-4" />
            </Button>
          </div>
            <FloatingActionButton />

            <main className={showNavigation ? "pb-24 md:pb-8" : ""}>
              <Switch>
                <Route path="/" component={HomePage} />
                <Route path="/translate" component={TranslatePage} />
                <Route path="/voice" component={VoicePage} />
                <Route path="/history" component={HistoryPage} />
                <Route component={NotFound} />
              </Switch>
            </main>

            {/* Bottom Navigation only */}
            {showNavigation && (
              <div className="fixed bottom-0 left-0 right-0 z-40 safe-bottom">
                <div className="glass-morphism mx-4 mb-4 rounded-2xl p-2 overflow-hidden">
                  <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {[
                      { path: '/', icon: Home, label: 'Home', gradient: 'from-blue-500 to-purple-600' },
                      { path: '/translate', icon: Languages, label: 'Translate', gradient: 'from-green-500 to-teal-600' },
                      { path: '/voice', icon: Mic, label: 'Voice', gradient: 'from-purple-500 to-pink-600' },
                      { path: '/history', icon: History, label: 'History', gradient: 'from-gray-500 to-gray-700' },
                    ].map((item, index) => {
                      const isActive = location === item.path;
                      const Icon = item.icon;

                      return (
                        <motion.div
                          key={item.path}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 max-w-20"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(item.path)}
                            className={`
                              flex flex-col items-center justify-center p-2 h-14 w-full rounded-xl transition-all duration-300 mobile-nav-button
                              ${isActive 
                                ? 'bg-white/20 neon:bg-cyan-500/20' 
                                : 'hover:bg-white/10 neon:hover:bg-cyan-500/10'
                              }
                            `}
                          >
                            <div className={`
                              w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300 mb-1
                              ${isActive 
                                ? `bg-gradient-to-br ${item.gradient} text-white neon:glow` 
                                : 'text-gray-600 dark:text-gray-400 neon:text-cyan-400'
                              }
                            `}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className={`
                              text-xs font-medium transition-colors duration-300 text-center leading-tight truncate
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
              </div>
            )}

            <Toaster />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;