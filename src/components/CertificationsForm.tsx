import { useState } from 'react';
import { PlusIcon, TrashIcon, SparklesIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Certification } from '../types';

interface CertificationsFormProps {
  data: Certification[];
  onChange: (certifications: Certification[]) => void;
}

export default function CertificationsForm({ data, onChange }: CertificationsFormProps) {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const addCertification = () => {
    const newCertification: Certification = {
      id: Date.now().toString(),
      name: '',
      issuingOrganization: '',
      issueDate: '',
      expirationDate: '',
      credentialId: '',
      credentialUrl: ''
    };
    onChange([...data, newCertification]);
  };

  const removeCertification = (id: string) => {
    onChange(data.filter(cert => cert.id !== id));
  };

  const updateCertification = (id: string, field: keyof Certification, value: any) => {
    onChange(data.map(cert => 
      cert.id === id ? { ...cert, [field]: value } : cert
    ));
  };

  const generateCertificationSuggestions = async (id: string) => {
    const certification = data.find(cert => cert.id === id);
    if (!certification || !certification.name) return;

    setIsGenerating(id);
    try {
      const response = await fetch('/api/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: certification.name,
          section: 'certifications'
        }),
      });

      const result = await response.json();
      if (result.success && result.improvedText) {
        // The AI might suggest improvements to the certification name or description
        console.log('AI Suggestion:', result.improvedText);
      }
    } catch (error) {
      console.error('Error generating certification suggestions:', error);
    } finally {
      setIsGenerating(null);
    }
  };

  const popularCertifications = [
    'AWS Certified Solutions Architect',
    'Google Cloud Professional',
    'Microsoft Azure Fundamentals',
    'Certified Kubernetes Administrator',
    'PMP - Project Management Professional',
    'Certified ScrumMaster',
    'CompTIA Security+',
    'Cisco CCNA',
    'Oracle Certified Professional',
    'Salesforce Certified Administrator'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Certifications & Licenses</h3>
        <button
          onClick={addCertification}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Certification
        </button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No certifications yet. Click "Add Certification" to get started.</p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Popular Certifications:</h4>
            <div className="flex flex-wrap gap-2">
              {popularCertifications.slice(0, 6).map((cert, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {data.map((certification, index) => (
        <div key={certification.id} className="bg-gray-50 p-6 rounded-lg border">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-md font-medium text-gray-900">Certification {index + 1}</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => generateCertificationSuggestions(certification.id)}
                disabled={isGenerating === certification.id || !certification.name}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="h-3 w-3 mr-1" />
                {isGenerating === certification.id ? 'Generating...' : 'AI Suggest'}
              </button>
              <button
                onClick={() => removeCertification(certification.id)}
                className="text-red-600 hover:text-red-800"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certification Name *
              </label>
              <input
                type="text"
                value={certification.name}
                onChange={(e) => updateCertification(certification.id, 'name', e.target.value)}
                placeholder="e.g., AWS Certified Solutions Architect"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                list={`certifications-${certification.id}`}
              />
              <datalist id={`certifications-${certification.id}`}>
                {popularCertifications.map((cert, idx) => (
                  <option key={idx} value={cert} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issuing Organization *
              </label>
              <input
                type="text"
                value={certification.issuingOrganization}
                onChange={(e) => updateCertification(certification.id, 'issuingOrganization', e.target.value)}
                placeholder="e.g., Amazon Web Services"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Date *
              </label>
              <input
                type="month"
                value={certification.issueDate}
                onChange={(e) => updateCertification(certification.id, 'issueDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date (Optional)
              </label>
              <input
                type="month"
                value={certification.expirationDate || ''}
                onChange={(e) => updateCertification(certification.id, 'expirationDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credential ID (Optional)
              </label>
              <input
                type="text"
                value={certification.credentialId || ''}
                onChange={(e) => updateCertification(certification.id, 'credentialId', e.target.value)}
                placeholder="e.g., AWS-ASA-12345"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credential URL (Optional)
              </label>
              <div className="flex">
                <input
                  type="url"
                  value={certification.credentialUrl || ''}
                  onChange={(e) => updateCertification(certification.id, 'credentialUrl', e.target.value)}
                  placeholder="https://www.credly.com/badges/..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {certification.credentialUrl && (
                  <a
                    href={certification.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:text-gray-700"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Expiration Warning */}
          {certification.expirationDate && (
            <div className="mt-4">
              {(() => {
                const expirationDate = new Date(certification.expirationDate);
                const today = new Date();
                const monthsUntilExpiration = (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
                
                if (monthsUntilExpiration < 0) {
                  return (
                    <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="text-red-800 text-sm">
                        ⚠️ This certification has expired. Consider renewing it.
                      </div>
                    </div>
                  );
                } else if (monthsUntilExpiration < 6) {
                  return (
                    <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="text-yellow-800 text-sm">
                        ⏰ This certification expires in {Math.round(monthsUntilExpiration)} months. Consider renewing soon.
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}