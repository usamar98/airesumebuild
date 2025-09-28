import { useState, KeyboardEvent } from 'react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface SkillsFormProps {
  data: string[];
  onChange: (data: string[]) => void;
}

export default function SkillsForm({ data, onChange }: SkillsFormProps) {
  const [inputValue, setInputValue] = useState('');
  const [isImproving, setIsImproving] = useState(false);

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !data.includes(trimmedSkill)) {
      onChange([...data, trimmedSkill]);
    }
    setInputValue('');
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(data.filter(skill => skill !== skillToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && data.length > 0) {
      // Remove last skill if input is empty and backspace is pressed
      removeSkill(data[data.length - 1]);
    }
  };

  const handleInputBlur = () => {
    if (inputValue.trim()) {
      addSkill(inputValue);
    }
  };

  const improveSkills = async () => {
    if (data.length === 0) {
      alert('Please add some skills first');
      return;
    }

    setIsImproving(true);
    
    try {
      const response = await fetch('/api/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: data.join(', '),
          section: 'skills',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Parse the improved skills back into an array
        const improvedSkills = result.improvedText
          .split(',')
          .map((skill: string) => skill.trim())
          .filter((skill: string) => skill.length > 0);
        onChange(improvedSkills);
      } else {
        alert('Failed to improve skills: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error improving skills: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsImproving(false);
    }
  };

  // Predefined skill suggestions
  const skillSuggestions = {
    technical: [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'SQL',
      'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Git', 'REST APIs',
      'GraphQL', 'HTML/CSS', 'Vue.js', 'Angular', 'Express.js', 'Django', 'Flask'
    ],
    soft: [
      'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration',
      'Project Management', 'Critical Thinking', 'Adaptability', 'Time Management',
      'Creativity', 'Analytical Skills', 'Attention to Detail', 'Customer Service'
    ],
    tools: [
      'Figma', 'Adobe Creative Suite', 'Jira', 'Slack', 'Microsoft Office',
      'Google Workspace', 'Trello', 'Notion', 'Salesforce', 'HubSpot', 'Tableau',
      'Power BI', 'Jenkins', 'GitHub', 'VS Code', 'IntelliJ IDEA'
    ]
  };

  const addSuggestedSkill = (skill: string) => {
    if (!data.includes(skill)) {
      onChange([...data, skill]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Skills Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Skills *
          </label>
          {data.length > 0 && (
            <button
              type="button"
              onClick={improveSkills}
              disabled={isImproving}
              className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isImproving ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
              ) : (
                <SparklesIcon className="h-3 w-3 mr-1" />
              )}
              {isImproving ? 'Improving...' : 'Improve with AI'}
            </button>
          )}
        </div>
        
        <div className="border border-gray-300 rounded-md p-3 min-h-[100px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          {/* Selected Skills */}
          <div className="flex flex-wrap gap-2 mb-2">
            {data.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800 transition-colors"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          
          {/* Input Field */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            className="w-full border-none outline-none text-sm placeholder-gray-500"
            placeholder={data.length === 0 ? "Type a skill and press Enter or comma to add..." : "Add another skill..."}
          />
        </div>
        
        <p className="text-xs text-gray-500 mt-1">
          Type skills and press Enter or comma to add them. Press Backspace to remove the last skill.
        </p>
      </div>

      {/* Skill Suggestions */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Skill Suggestions</h3>
        
        {/* Technical Skills */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">Technical Skills</h4>
          <div className="flex flex-wrap gap-2">
            {skillSuggestions.technical.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => addSuggestedSkill(skill)}
                disabled={data.includes(skill)}
                className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                  data.includes(skill)
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Soft Skills */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">Soft Skills</h4>
          <div className="flex flex-wrap gap-2">
            {skillSuggestions.soft.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => addSuggestedSkill(skill)}
                disabled={data.includes(skill)}
                className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                  data.includes(skill)
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Tools & Software */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">Tools & Software</h4>
          <div className="flex flex-wrap gap-2">
            {skillSuggestions.tools.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => addSuggestedSkill(skill)}
                disabled={data.includes(skill)}
                className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                  data.includes(skill)
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <SparklesIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">AI Tips for Skills</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Include both technical and soft skills relevant to your target role</li>
              <li>• Be specific (e.g., "React.js" instead of just "Frontend")</li>
              <li>• Add 10-15 skills for a well-rounded profile</li>
              <li>• Use the AI improvement feature to optimize your skill list</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}