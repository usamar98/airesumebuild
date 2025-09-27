import { useState } from 'react';
import { PlusIcon, TrashIcon, SparklesIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { Award } from '@/types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface AwardsFormProps {
  data: Award[];
  onChange: (awards: Award[]) => void;
}

export default function AwardsForm({ data, onChange }: AwardsFormProps) {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const addAward = () => {
    const newAward: Award = {
      id: Date.now().toString(),
      name: '',
      organization: '',
      date: '',
      description: '',
      category: 'professional'
    };
    onChange([...data, newAward]);
  };

  const removeAward = (id: string) => {
    onChange(data.filter(award => award.id !== id));
  };

  const updateAward = (id: string, field: keyof Award, value: any) => {
    onChange(data.map(award => 
      award.id === id ? { ...award, [field]: value } : award
    ));
  };

  const generateAwardSuggestions = async (id: string) => {
    const award = data.find(a => a.id === id);
    if (!award || !award.name) return;

    setIsGenerating(id);
    try {
      const response = await fetch('/api/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `${award.name} from ${award.organization}: ${award.description}`,
          section: 'awards'
        }),
      });

      const result = await response.json();
      if (result.success && result.improvedText) {
        updateAward(id, 'description', result.improvedText);
      }
    } catch (error) {
      console.error('Error generating award suggestions:', error);
    } finally {
      setIsGenerating(null);
    }
  };

  const awardCategories = [
    { value: 'professional', label: 'Professional' },
    { value: 'academic', label: 'Academic' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'community', label: 'Community Service' },
    { value: 'technical', label: 'Technical' },
    { value: 'creative', label: 'Creative' },
    { value: 'sports', label: 'Sports & Athletics' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'other', label: 'Other' }
  ];

  const professionalAwards = [
    'Employee of the Month/Year', 'Outstanding Performance Award',
    'Innovation Award', 'Leadership Excellence Award',
    'Customer Service Excellence', 'Sales Achievement Award',
    'Quality Excellence Award', 'Team Player Award'
  ];

  const academicAwards = [
    'Dean\'s List', 'Magna Cum Laude', 'Summa Cum Laude',
    'Academic Excellence Award', 'Scholarship Recipient',
    'Honor Roll', 'Valedictorian', 'Salutatorian'
  ];

  const getSuggestedAwards = (category: string) => {
    switch (category) {
      case 'professional':
        return professionalAwards;
      case 'academic':
        return academicAwards;
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Awards & Achievements</h3>
        <button
          onClick={addAward}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Award
        </button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <TrophyIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="mb-4">No awards yet. Showcase your achievements!</p>
          <p className="text-sm text-gray-400">Include professional recognitions, academic honors, and personal achievements.</p>
        </div>
      )}

      {data.map((award, index) => (
        <div key={award.id} className="bg-gray-50 p-6 rounded-lg border">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-md font-medium text-gray-900">Award {index + 1}</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => generateAwardSuggestions(award.id)}
                disabled={isGenerating === award.id || !award.name}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="h-3 w-3 mr-1" />
                {isGenerating === award.id ? 'Generating...' : 'AI Improve'}
              </button>
              <button
                onClick={() => removeAward(award.id)}
                className="text-red-600 hover:text-red-800"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Award/Achievement Name *
              </label>
              <input
                type="text"
                value={award.name}
                onChange={(e) => updateAward(award.id, 'name', e.target.value)}
                placeholder="e.g., Employee of the Year, Dean's List"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                list={`awards-${award.id}`}
              />
              <datalist id={`awards-${award.id}`}>
                {getSuggestedAwards(award.category).map((awardName, idx) => (
                  <option key={idx} value={awardName} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={award.category}
                onChange={(e) => updateAward(award.id, 'category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {awardCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issuing Organization *
              </label>
              <input
                type="text"
                value={award.organization}
                onChange={(e) => updateAward(award.id, 'organization', e.target.value)}
                placeholder="e.g., ABC Company, University Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Received *
              </label>
              <input
                type="month"
                value={award.date}
                onChange={(e) => updateAward(award.id, 'date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description & Significance
            </label>
            <ReactQuill
              value={award.description || ''}
              onChange={(value) => updateAward(award.id, 'description', value)}
              placeholder="Describe what this award recognizes, the criteria, or its significance..."
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
              Examples: "Recognized for outstanding sales performance, exceeding targets by 150%", "Awarded for academic excellence with GPA above 3.8"
            </p>
          </div>

          {/* Award Category Tips */}
          {award.category && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <h5 className="text-sm font-medium text-blue-800 mb-1">
                Tips for {awardCategories.find(c => c.value === award.category)?.label} Awards:
              </h5>
              <p className="text-xs text-blue-700">
                {award.category === 'professional' && "Highlight the business impact, metrics, or recognition criteria."}
                {award.category === 'academic' && "Include GPA requirements, class ranking, or academic achievements."}
                {award.category === 'leadership' && "Emphasize team size, project scope, or leadership qualities recognized."}
                {award.category === 'community' && "Describe the community impact, volunteer hours, or service contribution."}
                {award.category === 'technical' && "Mention the technical skills, innovation, or problem-solving recognized."}
                {award.category === 'creative' && "Highlight the creative work, artistic achievement, or innovation recognized."}
                {award.category === 'sports' && "Include competition level, ranking, or athletic achievement details."}
                {award.category === 'volunteer' && "Describe the volunteer contribution, impact, or service hours."}
                {award.category === 'other' && "Provide context about what makes this achievement significant."}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}