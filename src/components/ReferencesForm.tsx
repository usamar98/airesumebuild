import { useState } from 'react';
import { PlusIcon, TrashIcon, UserGroupIcon, EyeSlashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Reference } from '../types';

interface ReferencesFormProps {
  data: Reference[];
  onChange: (references: Reference[]) => void;
  availableOnRequest: boolean;
  onAvailableOnRequestChange: (value: boolean) => void;
}

export default function ReferencesForm({ 
  data, 
  onChange, 
  availableOnRequest, 
  onAvailableOnRequestChange 
}: ReferencesFormProps) {
  const addReference = () => {
    const newReference: Reference = {
      id: Date.now().toString(),
      name: '',
      title: '',
      company: '',
      relationship: '',
      email: '',
      phone: '',
      yearsKnown: undefined
    };
    onChange([...data, newReference]);
  };

  const removeReference = (id: string) => {
    onChange(data.filter(ref => ref.id !== id));
  };

  const updateReference = (id: string, field: keyof Reference, value: any) => {
    onChange(data.map(ref => 
      ref.id === id ? { ...ref, [field]: value } : ref
    ));
  };

  const relationshipTypes = [
    'Direct Supervisor', 'Manager', 'Team Lead', 'Colleague',
    'Client', 'Customer', 'Professor', 'Academic Advisor',
    'Mentor', 'Business Partner', 'Vendor', 'Volunteer Coordinator'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">References</h3>
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="available-on-request"
              checked={availableOnRequest}
              onChange={(e) => onAvailableOnRequestChange(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="available-on-request" className="ml-2 text-sm text-gray-700">
              Available upon request
            </label>
          </div>
          {!availableOnRequest && (
            <button
              onClick={addReference}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Reference
            </button>
          )}
        </div>
      </div>

      {availableOnRequest ? (
        <div className="text-center py-8 bg-blue-50 rounded-lg border border-blue-200">
          <EyeSlashIcon className="h-12 w-12 mx-auto mb-4 text-blue-400" />
          <p className="text-blue-800 font-medium mb-2">References Available Upon Request</p>
          <p className="text-sm text-blue-600">
            Your reference information will not be displayed on the resume. 
            Employers can request this information during the interview process.
          </p>
        </div>
      ) : (
        <>
          {data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="mb-4">No references added yet.</p>
              <p className="text-sm text-gray-400 mb-4">
                Add professional references who can speak to your work quality and character.
              </p>
              <div className="bg-yellow-50 p-4 rounded-md text-left max-w-md mx-auto">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 Reference Tips:</h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Always ask permission before listing someone as a reference</li>
                  <li>• Choose people who know your work well (supervisors, colleagues)</li>
                  <li>• Provide them with your current resume and job description</li>
                  <li>• Keep them updated on your job search progress</li>
                </ul>
              </div>
            </div>
          )}

          {data.map((reference, index) => (
            <div key={reference.id} className="bg-gray-50 p-6 rounded-lg border">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-md font-medium text-gray-900">Reference {index + 1}</h4>
                <button
                  onClick={() => removeReference(reference.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={reference.name}
                    onChange={(e) => updateReference(reference.id, 'name', e.target.value)}
                    placeholder="e.g., John Smith"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={reference.title}
                    onChange={(e) => updateReference(reference.id, 'title', e.target.value)}
                    placeholder="e.g., Senior Manager, Professor"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company/Organization *
                  </label>
                  <input
                    type="text"
                    value={reference.company}
                    onChange={(e) => updateReference(reference.id, 'company', e.target.value)}
                    placeholder="e.g., ABC Corporation, XYZ University"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship *
                  </label>
                  <input
                    type="text"
                    value={reference.relationship}
                    onChange={(e) => updateReference(reference.id, 'relationship', e.target.value)}
                    placeholder="e.g., Direct Supervisor, Colleague"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    list={`relationships-${reference.id}`}
                  />
                  <datalist id={`relationships-${reference.id}`}>
                    {relationshipTypes.map((type, idx) => (
                      <option key={idx} value={type} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={reference.email}
                    onChange={(e) => updateReference(reference.id, 'email', e.target.value)}
                    placeholder="john.smith@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={reference.phone || ''}
                    onChange={(e) => updateReference(reference.id, 'phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years Known (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={reference.yearsKnown || ''}
                    onChange={(e) => updateReference(reference.id, 'yearsKnown', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="e.g., 3"
                    className="w-full md:w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How many years have you known this person professionally?
                  </p>
                </div>
              </div>

              {/* Reference Status Indicator */}
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <div className="flex items-center">
                  <EyeIcon className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">This reference will be visible on your resume</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Make sure you have permission to share their contact information.
                </p>
              </div>
            </div>
          ))}

          {/* Privacy Notice */}
          {data.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">🔒 Privacy & Best Practices:</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Always obtain explicit permission before listing someone as a reference</li>
                <li>• Inform your references about the positions you're applying for</li>
                <li>• Keep your references updated on your job search timeline</li>
                <li>• Consider using "Available upon request" for sensitive positions</li>
                <li>• Provide references with your current resume and job descriptions</li>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}