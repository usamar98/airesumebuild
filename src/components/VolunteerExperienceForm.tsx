import { useState } from 'react';
import { PlusIcon, TrashIcon, SparklesIcon, HeartIcon } from '@heroicons/react/24/outline';
import { VolunteerExperience } from '../types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface VolunteerExperienceFormProps {
  data: VolunteerExperience[];
  onChange: (experiences: VolunteerExperience[]) => void;
}

export default function VolunteerExperienceForm({ data, onChange }: VolunteerExperienceFormProps) {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const addExperience = () => {
    const newExperience: VolunteerExperience = {
      id: Date.now().toString(),
      organization: '',
      role: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      impact: '',
      achievements: [],
      hoursPerWeek: undefined,
      totalHours: undefined
    };
    onChange([...data, newExperience]);
  };

  const removeExperience = (id: string) => {
    onChange(data.filter(exp => exp.id !== id));
  };

  const updateExperience = (id: string, field: keyof VolunteerExperience, value: any) => {
    onChange(data.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const generateVolunteerSuggestions = async (id: string) => {
    const experience = data.find(exp => exp.id === id);
    if (!experience || !experience.role || !experience.organization) return;

    setIsGenerating(id);
    try {
      const response = await fetch('/api/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `${experience.role} at ${experience.organization}: ${experience.description}`,
          section: 'volunteer'
        }),
      });

      const result = await response.json();
      if (result.success && result.improvedText) {
        updateExperience(id, 'description', result.improvedText);
      }
    } catch (error) {
      console.error('Error generating volunteer suggestions:', error);
    } finally {
      setIsGenerating(null);
    }
  };

  const volunteerRoles = [
    'Volunteer Coordinator', 'Event Organizer', 'Mentor', 'Tutor',
    'Community Outreach Specialist', 'Fundraising Coordinator',
    'Social Media Manager', 'Program Assistant', 'Team Leader',
    'Workshop Facilitator', 'Administrative Assistant', 'Translator'
  ];

  const organizationTypes = [
    'Non-profit Organization', 'Charity', 'Community Center',
    'Educational Institution', 'Healthcare Facility', 'Animal Shelter',
    'Environmental Organization', 'Religious Institution',
    'Youth Organization', 'Senior Center', 'Food Bank', 'Homeless Shelter'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Volunteer Experience</h3>
        <button
          onClick={addExperience}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Experience
        </button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <HeartIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="mb-4">No volunteer experience yet. Show your community involvement!</p>
          <p className="text-sm text-gray-400">Volunteer work demonstrates leadership, compassion, and commitment to making a difference.</p>
        </div>
      )}

      {data.map((experience, index) => (
        <div key={experience.id} className="bg-gray-50 p-6 rounded-lg border">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-md font-medium text-gray-900">Volunteer Experience {index + 1}</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => generateVolunteerSuggestions(experience.id)}
                disabled={isGenerating === experience.id || !experience.role || !experience.organization}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="h-3 w-3 mr-1" />
                {isGenerating === experience.id ? 'Generating...' : 'AI Improve'}
              </button>
              <button
                onClick={() => removeExperience(experience.id)}
                className="text-red-600 hover:text-red-800"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization *
              </label>
              <input
                type="text"
                value={experience.organization}
                onChange={(e) => updateExperience(experience.id, 'organization', e.target.value)}
                placeholder="e.g., Red Cross, Local Food Bank"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                list={`organizations-${experience.id}`}
              />
              <datalist id={`organizations-${experience.id}`}>
                {organizationTypes.map((type, idx) => (
                  <option key={idx} value={type} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role/Position *
              </label>
              <input
                type="text"
                value={experience.role}
                onChange={(e) => updateExperience(experience.id, 'role', e.target.value)}
                placeholder="e.g., Volunteer Coordinator, Mentor"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                list={`roles-${experience.id}`}
              />
              <datalist id={`roles-${experience.id}`}>
                {volunteerRoles.map((role, idx) => (
                  <option key={idx} value={role} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="month"
                value={experience.startDate}
                onChange={(e) => updateExperience(experience.id, 'startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`current-${experience.id}`}
                    checked={experience.current}
                    onChange={(e) => {
                      updateExperience(experience.id, 'current', e.target.checked);
                      if (e.target.checked) {
                        updateExperience(experience.id, 'endDate', '');
                      }
                    }}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`current-${experience.id}`} className="ml-2 block text-sm text-gray-700">
                    Currently volunteering
                  </label>
                </div>
                {!experience.current && (
                  <input
                    type="month"
                    value={experience.endDate || ''}
                    onChange={(e) => updateExperience(experience.id, 'endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hours per Week (Optional)
              </label>
              <input
                type="number"
                min="1"
                max="40"
                value={experience.hoursPerWeek || ''}
                onChange={(e) => updateExperience(experience.id, 'hoursPerWeek', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Hours (Optional)
              </label>
              <input
                type="number"
                min="1"
                value={experience.totalHours || ''}
                onChange={(e) => updateExperience(experience.id, 'totalHours', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 200"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description & Responsibilities *
            </label>
            <ReactQuill
              value={experience.description}
              onChange={(value) => updateExperience(experience.id, 'description', value)}
              placeholder="Describe your volunteer role, responsibilities, and activities..."
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['link'],
                  ['clean']
                ]
              }}
              className="bg-white"
            />
          </div>

          {/* Impact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Impact & Achievements
            </label>
            <ReactQuill
              value={experience.impact || ''}
              onChange={(value) => updateExperience(experience.id, 'impact', value)}
              placeholder="Describe the impact you made, people helped, or achievements..."
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['link'],
                  ['clean']
                ]
              }}
              className="bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Examples: "Helped 50+ families access food assistance", "Organized events that raised $10,000 for charity"
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}