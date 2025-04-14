import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  
  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    // Save language preference to localStorage
    localStorage.setItem('language', language);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t('header.language', 'Toggle language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage('nl')}>
          <div className="flex items-center">
            <span className="mr-2">🇳🇱</span>
            <span>Nederlands</span>
            {i18n.language === 'nl' && <span className="ml-2">✓</span>}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('en')}>
          <div className="flex items-center">
            <span className="mr-2">🇬🇧</span>
            <span>English</span>
            {i18n.language === 'en' && <span className="ml-2">✓</span>}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;