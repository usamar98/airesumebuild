import { useState } from 'react';
import { PlusIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Education } from '@/types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface EducationFormProps {
  data: Education[];
  onChange: (education: Education[]) => void;
}

export default function EducationForm({ data, onChange }: EducationFormProps) {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: '',
      relevantCoursework: [],
      honors: [],
      thesis: ''
    };
    onChange([...data, newEducation]);
  };

  const removeEducation = (id: string) => {
    onChange(data.filter(edu => edu.id !== id));
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    onChange(data.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  const addCoursework = (id: string) => {
    const education = data.find(edu => edu.id === id);
    if (education) {
      updateEducation(id, 'relevantCoursework', [...education.relevantCoursework, '']);
    }
  };

  const updateCoursework = (id: string, index: number, value: string) => {
    const education = data.find(edu => edu.id === id);
    if (education) {
      const newCoursework = [...education.relevantCoursework];
      newCoursework[index] = value;
      updateEducation(id, 'relevantCoursework', newCoursework);
    }
  };

  const removeCoursework = (id: string, index: number) => {
    const education = data.find(edu => edu.id === id);
    if (education) {
      const newCoursework = education.relevantCoursework.filter((_, i) => i !== index);
      updateEducation(id, 'relevantCoursework', newCoursework);
    }
  };

  const addHonor = (id: string) => {
    const education = data.find(edu => edu.id === id);
    if (education) {
      updateEducation(id, 'honors', [...education.honors, '']);
    }
  };

  const updateHonor = (id: string, index: number, value: string) => {
    const education = data.find(edu => edu.id === id);
    if (education) {
      const newHonors = [...education.honors];
      newHonors[index] = value;
      updateEducation(id, 'honors', newHonors);
    }
  };

  const removeHonor = (id: string, index: number) => {
    const education = data.find(edu => edu.id === id);
    if (education) {
      const newHonors = education.honors.filter((_, i) => i !== index);
      updateEducation(id, 'honors', newHonors);
    }
  };

  const generateEducationSuggestions = async (id: string) => {
    const education = data.find(edu => edu.id === id);
    if (!education || !education.degree || !education.institution) return;

    setIsGenerating(id);
    try {
      const response = await fetch('/api/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `${education.degree} at ${education.institution}`,
          section: 'education'
        }),
      });

      const result = await response.json();
      if (result.success && result.improvedText) {
        // Parse suggestions and update relevant fields
        const suggestions = result.improvedText.split('\n').filter(line => line.trim());
        if (suggestions.length > 0) {
          updateEducation(id, 'thesis', suggestions[0]);
        }
      }
    } catch (error) {
      console.error('Error generating education suggestions:', error);
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Education</h3>
        <button
          onClick={addEducation}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Education
        </button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No education entries yet. Click "Add Education" to get started.</p>
        </div>
      )}

      {data.map((education, index) => (
        <div key={education.id} className="bg-gray-50 p-6 rounded-lg border">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-md font-medium text-gray-900">Education {index + 1}</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => generateEducationSuggestions(education.id)}
                disabled={isGenerating === education.id || !education.degree || !education.institution}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="h-3 w-3 mr-1" />
                {isGenerating === education.id ? 'Generating...' : 'AI Suggest'}
              </button>
              <button
                onClick={() => removeEducation(education.id)}
                className="text-red-600 hover:text-red-800"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Degree *
              </label>
              <input
                type="text"
                value={education.degree}
                onChange={(e) => updateEducation(education.id, 'degree', e.target.value)}
                placeholder="e.g., Bachelor of Science in Computer Science"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institution *
              </label>
              <input
                type="text"
                value={education.institution}
                onChange={(e) => updateEducation(education.id, 'institution', e.target.value)}
                placeholder="e.g., Stanford University"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={education.location}
                onChange={(e) => updateEducation(education.id, 'location', e.target.value)}
                placeholder="e.g., Stanford, CA"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GPA (Optional)
              </label>
              <input
                type="text"
                value={education.gpa || ''}
                onChange={(e) => updateEducation(education.id, 'gpa', e.target.value)}
                placeholder="e.g., 3.8/4.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="month"
                value={education.startDate}
                onChange={(e) => updateEducation(education.id, 'startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="month"
                value={education.endDate}
                onChange={(e) => updateEducation(education.id, 'endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Relevant Coursework */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Relevant Coursework
              </label>
              <button
                onClick={() => addCoursework(education.id)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Course
              </button>
            </div>
            {education.relevantCoursework.map((course, courseIndex) => (
              <div key={courseIndex} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={course}
                  onChange={(e) => updateCoursework(education.id, courseIndex, e.target.value)}
                  placeholder="e.g., Data Structures and Algorithms"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => removeCoursework(education.id, courseIndex)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Honors and Awards */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Honors & Awards
              </label>
              <button
                onClick={() => addHonor(education.id)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Honor
              </button>
            </div>
            {education.honors.map((honor, honorIndex) => (
              <div key={honorIndex} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={honor}
                  onChange={(e) => updateHonor(education.id, honorIndex, e.target.value)}
                  placeholder="e.g., Magna Cum Laude, Dean's List"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => removeHonor(education.id, honorIndex)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Thesis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thesis/Capstone Project (Optional)
            </label>
            <ReactQuill
              value={education.thesis || ''}
              onChange={(value) => updateEducation(education.id, 'thesis', value)}
              placeholder="Describe your thesis or capstone project..."
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
        </div>
      ))}
    </div>
  );
}