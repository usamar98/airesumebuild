import { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CoverLetterGenerator from '@/components/CoverLetterGenerator';
import { ResumeData } from '@/types';

export default function CoverLetter() {
  const { t } = useTranslation();
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load resume data from localStorage
    const savedData = localStorage.getItem('resumeData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setResumeData(parsedData);
      } catch (error) {
        console.error('Error parsing saved resume data:', error);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="mb-6">
              <Link
                to="/"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                {t('coverLetter.backToResumeBuilder')}
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('coverLetter.noResumeDataTitle')}</h1>
            <p className="text-gray-600 mb-6">
              {t('coverLetter.noResumeDataDescription')}
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {t('coverLetter.createResume')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6 pt-6">
        <div className="max-w-4xl mx-auto px-6">
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            {t('coverLetter.backToResumeBuilder')}
          </Link>
        </div>
      </div>
      <CoverLetterGenerator resumeData={resumeData} />
    </div>
  );
}