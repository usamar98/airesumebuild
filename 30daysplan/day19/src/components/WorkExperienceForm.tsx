import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { WorkExperience } from '@/types';
import { PlusIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import RichTextEditor from './RichTextEditor';

interface WorkExperienceFormProps {
  data: WorkExperience[];
  onChange: (data: WorkExperience[]) => void;
}

export default function WorkExperienceForm({ data, onChange }: WorkExperienceFormProps) {
  const [isImproving, setIsImproving] = useState<string | null>(null);

  const addExperience = () => {
    const newExperience: WorkExperience = {
      id: Date.now().toString(),
      jobTitle: '',
      company: '',
      companySize: '',
      industry: '',
      startDate: '',
      endDate: '',
      achievements: [''],
      technologies: [''],
      teamSize: '',
      location: '',
    };
    onChange([...data, newExperience]);
  };

  const removeExperience = (id: string) => {
    onChange(data.filter(exp => exp.id !== id));
  };

  const updateExperience = (id: string, field: keyof WorkExperience, value: any) => {
    onChange(data.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const addAchievement = (experienceId: string) => {
    const experience = data.find(exp => exp.id === experienceId);
    if (experience) {
      updateExperience(experienceId, 'achievements', [...experience.achievements, '']);
    }
  };

  const removeAchievement = (experienceId: string, achievementIndex: number) => {
    const experience = data.find(exp => exp.id === experienceId);
    if (experience) {
      const newAchievements = experience.achievements.filter((_, index) => index !== achievementIndex);
      updateExperience(experienceId, 'achievements', newAchievements);
    }
  };

  const updateAchievement = (experienceId: string, achievementIndex: number, value: string) => {
    const experience = data.find(exp => exp.id === experienceId);
    if (experience) {
      const newAchievements = experience.achievements.map((achievement, index) => 
        index === achievementIndex ? value : achievement
      );
      updateExperience(experienceId, 'achievements', newAchievements);
    }
  };

  const addTechnology = (experienceId: string) => {
    const experience = data.find(exp => exp.id === experienceId);
    if (experience) {
      updateExperience(experienceId, 'technologies', [...experience.technologies, '']);
    }
  };

  const removeTechnology = (experienceId: string, techIndex: number) => {
    const experience = data.find(exp => exp.id === experienceId);
    if (experience) {
      const newTechnologies = experience.technologies.filter((_, index) => index !== techIndex);
      updateExperience(experienceId, 'technologies', newTechnologies);
    }
  };

  const updateTechnology = (experienceId: string, techIndex: number, value: string) => {
    const experience = data.find(exp => exp.id === experienceId);
    if (experience) {
      const newTechnologies = experience.technologies.map((tech, index) => 
        index === techIndex ? value : tech
      );
      updateExperience(experienceId, 'technologies', newTechnologies);
    }
  };

  const generateAISuggestions = async (experienceId: string, field: string) => {
    const experience = data.find(exp => exp.id === experienceId);
    if (!experience || !experience.jobTitle || !experience.company) {
      alert('Please fill in job title and company first');
      return;
    }

    const improvingKey = `${experienceId}-${field}`;
    setIsImproving(improvingKey);
    
    try {
      const response = await fetch('/api/generate-work-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle: experience.jobTitle,
          company: experience.company,
          industry: experience.industry,
          type: field === 'achievements' ? 'achievements' : 'technologies',
        }),
      });

      const result = await response.json();
      
      if (result.suggestions && result.suggestions.length > 0) {
        if (field === 'achievements') {
          updateExperience(experienceId, 'achievements', result.suggestions);
        } else if (field === 'technologies') {
          updateExperience(experienceId, 'technologies', result.suggestions);
        }
      } else {
        alert('Failed to generate suggestions: ' + (result.error || 'No suggestions received'));
      }
    } catch (error) {
      alert('Error generating suggestions: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsImproving(null);
    }
  };

  const improveAchievement = async (experienceId: string, achievementIndex: number) => {
    const experience = data.find(exp => exp.id === experienceId);
    const achievement = experience?.achievements[achievementIndex];
    
    if (!achievement || achievement.trim().length === 0) {
      alert('Please enter some text first');
      return;
    }

    const improvingKey = `${experienceId}-${achievementIndex}`;
    setIsImproving(improvingKey);
    
    try {
      const response = await fetch('/api/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: achievement,
          section: 'experience',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        updateAchievement(experienceId, achievementIndex, result.improvedText);
        if (result.fallback && result.message) {
          alert(result.message);
        }
      } else {
        alert('Failed to improve text: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error improving text: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsImproving(null);
    }
  };

  return (
    <div className="space-y-8">
      {data.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M8 6v10a2 2 0 002 2h4a2 2 0 002-2V6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No work experience added yet</h3>
          <p className="text-gray-500 mb-6">Add your professional experience to showcase your career journey</p>
          <button
            onClick={addExperience}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add First Experience
          </button>
        </div>
      ) : (
        <>
          {data.map((experience, index) => (
            <div key={experience.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Experience #{index + 1}
                </h3>
                <button
                  onClick={() => removeExperience(experience.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Remove this experience"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={experience.jobTitle}
                    onChange={(e) => updateExperience(experience.id, 'jobTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Software Engineer"
                    required
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company *
                  </label>
                  <input
                    type="text"
                    value={experience.company}
                    onChange={(e) => updateExperience(experience.id, 'company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tech Company Inc."
                    required
                  />
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={experience.industry}
                    onChange={(e) => updateExperience(experience.id, 'industry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Technology, Healthcare, Finance"
                  />
                </div>

                {/* Company Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  <select
                    value={experience.companySize}
                    onChange={(e) => updateExperience(experience.id, 'companySize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={experience.location}
                    onChange={(e) => updateExperience(experience.id, 'location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="San Francisco, CA / Remote"
                  />
                </div>

                {/* Team Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Size Managed
                  </label>
                  <input
                    type="text"
                    value={experience.teamSize}
                    onChange={(e) => updateExperience(experience.id, 'teamSize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="5 developers, 2 designers"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <DatePicker
                    selected={experience.startDate ? new Date(experience.startDate + '-01') : null}
                    onChange={(date: Date | null) => {
                      const formattedDate = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : '';
                      updateExperience(experience.id, 'startDate', formattedDate);
                    }}
                    dateFormat="MM/yyyy"
                    showMonthYearPicker
                    showYearDropdown
                    yearDropdownItemNumber={50}
                    scrollableYearDropdown
                    maxDate={new Date()}
                    placeholderText="Select start month/year"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <DatePicker
                    selected={experience.endDate ? new Date(experience.endDate + '-01') : null}
                    onChange={(date: Date | null) => {
                      const formattedDate = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : '';
                      updateExperience(experience.id, 'endDate', formattedDate);
                    }}
                    dateFormat="MM/yyyy"
                    showMonthYearPicker
                    showYearDropdown
                    yearDropdownItemNumber={50}
                    scrollableYearDropdown
                    maxDate={new Date()}
                    minDate={experience.startDate ? new Date(experience.startDate + '-01') : undefined}
                    placeholderText="Leave empty if current job"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    isClearable
                  />
                </div>
              </div>

              {/* Technologies */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Technologies Used
                  </label>
                  <button
                    onClick={() => addTechnology(experience.id)}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    + Add Technology
                  </button>
                </div>
                
                <div className="space-y-3">
                  {experience.technologies.map((technology, techIndex) => (
                    <div key={techIndex} className="flex items-start space-x-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={technology}
                          onChange={(e) => updateTechnology(experience.id, techIndex, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="React, Node.js, PostgreSQL"
                        />
                      </div>
                      {experience.technologies.length > 1 && (
                        <button
                          onClick={() => removeTechnology(experience.id, techIndex)}
                          className="text-red-600 hover:text-red-800 transition-colors mt-2"
                          title="Remove this technology"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => generateAISuggestions(experience.id, 'technologies')}
                    disabled={isImproving === `${experience.id}-technologies`}
                    className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isImproving === `${experience.id}-technologies` ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <SparklesIcon className="h-4 w-4 mr-2" />
                    )}
                    AI Suggest Technologies
                  </button>
                </div>
              </div>

              {/* Achievements */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Key Achievements & Responsibilities *
                  </label>
                  <button
                    onClick={() => addAchievement(experience.id)}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    + Add Achievement
                  </button>
                </div>
                
                <div className="space-y-3">
                  {experience.achievements.map((achievement, achievementIndex) => (
                    <div key={achievementIndex} className="flex items-start space-x-2">
                      <div className="flex-1 relative">
                        <RichTextEditor
                          value={achievement}
                          onChange={(value) => updateAchievement(experience.id, achievementIndex, value)}
                          placeholder="Describe your achievement or responsibility..."
                        />
                        <button
                          type="button"
                          onClick={() => improveAchievement(experience.id, achievementIndex)}
                          disabled={isImproving === `${experience.id}-${achievementIndex}` || !achievement.trim()}
                          className="absolute right-2 top-2 p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed z-10"
                          title="Improve with AI"
                        >
                          {isImproving === `${experience.id}-${achievementIndex}` ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          ) : (
                            <SparklesIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {experience.achievements.length > 1 && (
                        <button
                          onClick={() => removeAchievement(experience.id, achievementIndex)}
                          className="text-red-600 hover:text-red-800 transition-colors mt-2"
                          title="Remove this achievement"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => generateAISuggestions(experience.id, 'achievements')}
                    disabled={isImproving === `${experience.id}-achievements`}
                    className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isImproving === `${experience.id}-achievements` ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <SparklesIcon className="h-4 w-4 mr-2" />
                    )}
                    AI Suggest Achievements
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="text-center">
            <button
              onClick={addExperience}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Another Experience
            </button>
          </div>
        </>
      )}

      {/* AI Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <SparklesIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">AI Tips for Work Experience</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Start each achievement with an action verb (Led, Developed, Improved, etc.)</li>
              <li>• Include specific numbers and metrics when possible (increased sales by 25%)</li>
              <li>• Focus on results and impact rather than just responsibilities</li>
              <li>• Use the AI improvement feature to enhance your descriptions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}