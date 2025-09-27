import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DocumentTextIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import IndustryTemplates from '../components/IndustryTemplates';

interface Template {
  id: string;
  name: string;
  description: string;
  font_family: string;
  font_size: number;
  primary_color: string;
  secondary_color: string;
  section_order: string[];
  bullet_style: string;
  spacing: string;
  category: string;
  style: string;
}

export default function Templates() {
  const { t } = useTranslation();


  const [selectedIndustryTemplate, setSelectedIndustryTemplate] = useState<any>(null);





  const handleIndustryTemplateSelect = (industryTemplate: any) => {
    setSelectedIndustryTemplate(industryTemplate);
    // Store selected industry template in localStorage
    localStorage.setItem('selectedIndustryTemplate', JSON.stringify(industryTemplate));
    localStorage.removeItem('selectedTemplate');
    // Redirect directly to resume builder
    window.location.href = '/builder';
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">{t('common.appName')}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/builder" 
                className="inline-flex items-center text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                {t('templates.backToBuilder')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('templates.title')}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              {t('templates.description')}
            </p>
            

            



          </div>
        </div>
      </section>

      {/* Templates Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <IndustryTemplates 
            onTemplateSelect={handleIndustryTemplateSelect}
            selectedIndustry={selectedIndustryTemplate?.id}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <DocumentTextIcon className="h-6 w-6 text-blue-400" />
              <span className="ml-2 text-lg font-bold">{t('common.appName')}</span>
            </div>
            <p className="text-gray-400 text-sm">
              {t('templates.footerDescription')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}