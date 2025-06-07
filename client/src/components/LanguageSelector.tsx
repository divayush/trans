import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { SUPPORTED_LANGUAGES } from '@shared/schema';
import type { Language } from '@/types';

interface LanguageSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function LanguageSelector({ 
  value, 
  onValueChange, 
  placeholder = "Select language",
  className = ""
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between bg-white/5 hover:bg-white/10 border-white/10 ${className}`}
        >
          {selectedLanguage ? (
            <div className="flex items-center">
              <span className="text-2xl mr-3">{selectedLanguage.flag}</span>
              <span className="font-medium">{selectedLanguage.name}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-black/90 backdrop-blur-xl border-white/20">
        <Command>
          <CommandInput 
            placeholder="Search languages..." 
            className="h-9 bg-transparent border-none focus:ring-0"
          />
          <CommandEmpty>No language found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {SUPPORTED_LANGUAGES.map((language) => (
              <CommandItem
                key={language.code}
                value={`${language.name} ${language.code}`}
                onSelect={() => {
                  onValueChange(language.code);
                  setOpen(false);
                }}
                className="flex items-center cursor-pointer hover:bg-white/10"
              >
                <span className="text-2xl mr-3">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
                <span className="ml-auto text-xs text-gray-400 uppercase">
                  {language.code}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
const languages = [
  { code: 'auto', name: 'Auto-detect', flag: '🌐' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];