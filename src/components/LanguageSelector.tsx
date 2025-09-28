import React, { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useLanguage, Language } from '../hooks/useLanguage';

const LanguageSelector: React.FC = () => {
  const { currentLanguage, changeLanguage, getCurrentLanguageInfo, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLangInfo = getCurrentLanguageInfo();

  const handleLanguageChange = (language: Language) => {
    changeLanguage(language);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 rounded-lg hover:bg-gray-100"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{currentLangInfo.flag}</span>
        <span className="text-sm font-medium hidden sm:block">{currentLangInfo.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 transition-colors duration-200 ${
                    currentLanguage === language.code
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span>{language.name}</span>
                  {currentLanguage === language.code && (
                    <span className="ml-auto text-blue-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;