import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PersonalInfo } from '@/types';
import { SparklesIcon, TrashIcon } from '@heroicons/react/24/outline';
import RichTextEditor from './RichTextEditor';
import { useTranslation } from 'react-i18next';

interface PersonalInfoFormProps {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
}

export default function PersonalInfoForm({ data, onChange }: PersonalInfoFormProps) {
  const { t } = useTranslation();
  const [isImproving, setIsImproving] = useState<string | null>(null);

  const handleInputChange = (field: keyof PersonalInfo, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const improveText = async (field: keyof PersonalInfo) => {
    const currentText = data[field];
    if (!currentText || (typeof currentText === 'string' && currentText.trim().length === 0)) {
      alert(t('personalInfo.pleaseEnterText'));
      return;
    }

    setIsImproving(field);
    
    try {
      const response = await fetch('/api/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: currentText,
          section: 'personal',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        handleInputChange(field, result.improvedText);
        
        // Show message if it's a fallback response
        if (result.fallback && result.message) {
          alert('✨ ' + result.message);
        }
      } else {
        alert(t('personalInfo.failedToImprove') + ': ' + (result.error || t('personalInfo.unknownError')));
      }
    } catch (error) {
      alert(t('personalInfo.errorImproving') + ': ' + (error instanceof Error ? error.message : t('personalInfo.unknownError')));
    } finally {
      setIsImproving(null);
    }
  };

  const addLanguage = () => {
    onChange({ ...data, languages: [...data.languages, ''] });
  };

  const removeLanguage = (index: number) => {
    onChange({ ...data, languages: data.languages.filter((_, i) => i !== index) });
  };

  const updateLanguage = (index: number, value: string) => {
    const newLanguages = data.languages.map((lang, i) => i === index ? value : lang);
    onChange({ ...data, languages: newLanguages });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('personalInfo.imageSizeError'));
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert(t('personalInfo.invalidImageError'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onChange({ ...data, profileImage: result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('personalInfo.fullName')} *
          </label>
          <div className="relative">
            <input
              type="text"
              value={data.fullName}
              onChange={(e) => onChange({ ...data, fullName: e.target.value })}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('personalInfo.fullNamePlaceholder')}
              required
            />
            <button
              type="button"
              onClick={() => improveText('fullName')}
              disabled={isImproving === 'fullName' || !data.fullName.trim()}
              className="absolute right-2 top-2 p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('personalInfo.improveWithAI')}
            >
              {isImproving === 'fullName' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <SparklesIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('personalInfo.emailAddress')} *
          </label>
          <div className="relative">
            <input
              type="email"
              value={data.email}
              onChange={(e) => onChange({ ...data, email: e.target.value })}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('personalInfo.emailPlaceholder')}
              required
            />
            <button
              type="button"
              onClick={() => improveText('email')}
              disabled={isImproving === 'email' || !data.email.trim()}
              className="absolute right-2 top-2 p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('personalInfo.improveWithAI')}
            >
              {isImproving === 'email' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <SparklesIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('personalInfo.phoneNumber')} *
          </label>
          <div className="relative">
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => onChange({ ...data, phone: e.target.value })}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('personalInfo.phonePlaceholder')}
              required
            />
            <button
              type="button"
              onClick={() => improveText('phone')}
              disabled={isImproving === 'phone' || !data.phone.trim()}
              className="absolute right-2 top-2 p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Improve with AI"
            >
              {isImproving === 'phone' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <SparklesIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* LinkedIn */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('personalInfo.linkedinProfile')}
          </label>
          <div className="relative">
            <input
              type="url"
              value={data.linkedin}
              onChange={(e) => onChange({ ...data, linkedin: e.target.value })}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t('personalInfo.linkedinPlaceholder')}
            />
            <button
              type="button"
              onClick={() => improveText('linkedin')}
              disabled={isImproving === 'linkedin' || !data.linkedin.trim()}
              className="absolute right-2 top-2 p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Improve with AI"
            >
              {isImproving === 'linkedin' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <SparklesIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* GitHub */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('personalInfo.githubProfile')}
          </label>
          <input
            type="url"
            value={data.github}
            onChange={(e) => onChange({ ...data, github: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('personalInfo.githubPlaceholder')}
          />
        </div>

        {/* Profile Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('personalInfo.profileImage')}
          </label>
          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {data.profileImage && (
              <div className="flex items-center space-x-3">
                <img
                  src={data.profileImage}
                  alt={t('personalInfo.profilePreview')}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => onChange({ ...data, profileImage: '' })}
                  className="text-sm text-red-600 hover:text-red-800 transition-colors"
                >
                  {t('personalInfo.removeImage')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Portfolio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('personalInfo.portfolioWebsite')}
          </label>
          <input
            type="url"
            value={data.portfolio}
            onChange={(e) => onChange({ ...data, portfolio: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('personalInfo.portfolioPlaceholder')}
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('personalInfo.dateOfBirth')}
          </label>
          <DatePicker
            selected={data.dateOfBirth ? new Date(data.dateOfBirth) : null}
            onChange={(date: Date | null) => onChange({ ...data, dateOfBirth: date ? date.toISOString().split('T')[0] : '' })}
            dateFormat="yyyy-MM-dd"
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
            yearDropdownItemNumber={100}
            scrollableYearDropdown
            maxDate={new Date()}
            placeholderText="Select date of birth"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Nationality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('personalInfo.nationality')}
          </label>
          <input
            type="text"
            value={data.nationality}
            onChange={(e) => onChange({ ...data, nationality: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('personalInfo.nationalityPlaceholder')}
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('personalInfo.address')} *
        </label>
        <div className="relative">
          <textarea
            value={data.address}
            onChange={(e) => onChange({ ...data, address: e.target.value })}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('personalInfo.addressPlaceholder')}
            rows={2}
            required
          />
          <button
            type="button"
            onClick={() => improveText('address')}
            disabled={isImproving === 'address' || !data.address.trim()}
            className="absolute right-2 top-2 p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Improve with AI"
          >
            {isImproving === 'address' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : (
              <SparklesIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Professional Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('personalInfo.professionalSummary')}
          </label>
        <div className="relative">
          <RichTextEditor
            value={data.professionalSummary}
            onChange={(value) => onChange({ ...data, professionalSummary: value })}
            placeholder="Brief overview of your professional background and career objectives..."
          />
          <button
            type="button"
            onClick={() => improveText('professionalSummary')}
            disabled={isImproving === 'professionalSummary' || !data.professionalSummary.trim()}
            className="absolute right-2 top-2 p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed z-10"
            title="Improve with AI"
          >
            {isImproving === 'professionalSummary' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : (
              <SparklesIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Languages */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            {t('personalInfo.languages')}
          </label>
          <button
            type="button"
            onClick={addLanguage}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            {t('personalInfo.addLanguage')}
          </button>
        </div>
        <div className="space-y-2">
          {data.languages.map((language, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={language}
                onChange={(e) => updateLanguage(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('personalInfo.languagesPlaceholder')}
              />
              {data.languages.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLanguage(index)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Remove language"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <SparklesIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">{t('personalInfo.aiTips')}</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• {t('personalInfo.tip1')}</li>
              <li>• {t('personalInfo.tip2')}</li>
              <li>• {t('personalInfo.tip3')}</li>
              <li>• {t('personalInfo.tip4')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      <div className="text-sm text-gray-500">
        <p>{t('personalInfo.requiredFields')}</p>
        {(!data.fullName || !data.email || !data.phone || !data.address) && (
          <p className="text-red-600 mt-1">
            {t('personalInfo.validationError')}
          </p>
        )}
      </div>
    </div>
  );
}