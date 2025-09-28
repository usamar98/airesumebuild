import { useState } from 'react';
import { PlusIcon, TrashIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { Language } from '@/types';

interface LanguagesFormProps {
  data: Language[];
  onChange: (languages: Language[]) => void;
}

export default function LanguagesForm({ data, onChange }: LanguagesFormProps) {
  const addLanguage = () => {
    const newLanguage: Language = {
      id: Date.now().toString(),
      name: '',
      proficiency: 'intermediate',
      certification: ''
    };
    onChange([...data, newLanguage]);
  };

  const removeLanguage = (id: string) => {
    onChange(data.filter(lang => lang.id !== id));
  };

  const updateLanguage = (id: string, field: keyof Language, value: any) => {
    onChange(data.map(lang => 
      lang.id === id ? { ...lang, [field]: value } : lang
    ));
  };

  const proficiencyLevels = [
    { value: 'native', label: 'Native/Bilingual', description: 'Native speaker or equivalent fluency' },
    { value: 'fluent', label: 'Fluent', description: 'Highly proficient in speaking, reading, and writing' },
    { value: 'advanced', label: 'Advanced', description: 'Strong command with minor limitations' },
    { value: 'intermediate', label: 'Intermediate', description: 'Good working knowledge' },
    { value: 'basic', label: 'Basic', description: 'Elementary proficiency' }
  ];

  const commonLanguages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Chinese (Mandarin)', 'Chinese (Cantonese)', 'Japanese', 'Korean',
    'Arabic', 'Russian', 'Hindi', 'Dutch', 'Swedish', 'Norwegian',
    'Danish', 'Finnish', 'Polish', 'Czech', 'Hungarian', 'Greek',
    'Turkish', 'Hebrew', 'Thai', 'Vietnamese', 'Indonesian', 'Malay'
  ];

  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency) {
      case 'native': return 'bg-green-500';
      case 'fluent': return 'bg-blue-500';
      case 'advanced': return 'bg-purple-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'basic': return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  const getProficiencyWidth = (proficiency: string) => {
    switch (proficiency) {
      case 'native': return 'w-full';
      case 'fluent': return 'w-5/6';
      case 'advanced': return 'w-4/6';
      case 'intermediate': return 'w-3/6';
      case 'basic': return 'w-2/6';
      default: return 'w-1/6';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Languages</h3>
        <button
          onClick={addLanguage}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Language
        </button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <GlobeAltIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="mb-4">No languages added yet. Show your multilingual abilities!</p>
          <p className="text-sm text-gray-400">Language skills are valuable in today's global workplace.</p>
        </div>
      )}

      {data.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Proficiency Level Guide:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-blue-700">
            {proficiencyLevels.map((level) => (
              <div key={level.value} className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${getProficiencyColor(level.value)} mr-2`}></div>
                <span className="font-medium">{level.label}:</span>
                <span className="ml-1">{level.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.map((language, index) => (
          <div key={language.id} className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-md font-medium text-gray-900">Language {index + 1}</h4>
              <button
                onClick={() => removeLanguage(language.id)}
                className="text-red-600 hover:text-red-800"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language *
                </label>
                <input
                  type="text"
                  value={language.name}
                  onChange={(e) => updateLanguage(language.id, 'name', e.target.value)}
                  placeholder="e.g., Spanish, French, Mandarin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  list={`languages-${language.id}`}
                />
                <datalist id={`languages-${language.id}`}>
                  {commonLanguages.map((lang, idx) => (
                    <option key={idx} value={lang} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proficiency Level *
                </label>
                <select
                  value={language.proficiency}
                  onChange={(e) => updateLanguage(language.id, 'proficiency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {proficiencyLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visual Proficiency Indicator */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proficiency Indicator
                </label>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProficiencyColor(language.proficiency)} ${getProficiencyWidth(language.proficiency)}`}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {proficiencyLevels.find(l => l.value === language.proficiency)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certification (Optional)
                </label>
                <input
                  type="text"
                  value={language.certification || ''}
                  onChange={(e) => updateLanguage(language.id, 'certification', e.target.value)}
                  placeholder="e.g., TOEFL 110, DELE B2, JLPT N2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include any language certifications or test scores
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Common Certifications Info */}
      {data.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-800 mb-2">Common Language Certifications:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-gray-600">
            <div><strong>English:</strong> TOEFL, IELTS, Cambridge (FCE, CAE, CPE)</div>
            <div><strong>Spanish:</strong> DELE, SIELE, CEFR levels</div>
            <div><strong>French:</strong> DELF, DALF, TCF, TEF</div>
            <div><strong>German:</strong> Goethe Certificate, TestDaF, DSH</div>
            <div><strong>Japanese:</strong> JLPT (N5-N1), BJT</div>
            <div><strong>Chinese:</strong> HSK, TOCFL</div>
          </div>
        </div>
      )}
    </div>
  );
}