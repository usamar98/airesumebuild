import { useState } from 'react';
import { PlusIcon, TrashIcon, SparklesIcon, ArrowTopRightOnSquareIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { Project } from '@/types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface ProjectsFormProps {
  data: Project[];
  onChange: (projects: Project[]) => void;
}

export default function ProjectsForm({ data, onChange }: ProjectsFormProps) {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: '',
      description: '',
      technologies: [],
      startDate: '',
      endDate: '',
      githubUrl: '',
      liveUrl: '',
      highlights: []
    };
    onChange([...data, newProject]);
  };

  const removeProject = (id: string) => {
    onChange(data.filter(project => project.id !== id));
  };

  const updateProject = (id: string, field: keyof Project, value: any) => {
    onChange(data.map(project => 
      project.id === id ? { ...project, [field]: value } : project
    ));
  };

  const addTechnology = (id: string) => {
    const project = data.find(p => p.id === id);
    if (project) {
      updateProject(id, 'technologies', [...project.technologies, '']);
    }
  };

  const updateTechnology = (id: string, index: number, value: string) => {
    const project = data.find(p => p.id === id);
    if (project) {
      const newTechnologies = [...project.technologies];
      newTechnologies[index] = value;
      updateProject(id, 'technologies', newTechnologies);
    }
  };

  const removeTechnology = (id: string, index: number) => {
    const project = data.find(p => p.id === id);
    if (project) {
      const newTechnologies = project.technologies.filter((_, i) => i !== index);
      updateProject(id, 'technologies', newTechnologies);
    }
  };

  const addHighlight = (id: string) => {
    const project = data.find(p => p.id === id);
    if (project) {
      updateProject(id, 'highlights', [...project.highlights, '']);
    }
  };

  const updateHighlight = (id: string, index: number, value: string) => {
    const project = data.find(p => p.id === id);
    if (project) {
      const newHighlights = [...project.highlights];
      newHighlights[index] = value;
      updateProject(id, 'highlights', newHighlights);
    }
  };

  const removeHighlight = (id: string, index: number) => {
    const project = data.find(p => p.id === id);
    if (project) {
      const newHighlights = project.highlights.filter((_, i) => i !== index);
      updateProject(id, 'highlights', newHighlights);
    }
  };

  const generateProjectSuggestions = async (id: string) => {
    const project = data.find(p => p.id === id);
    if (!project || !project.name) return;

    setIsGenerating(id);
    try {
      const response = await fetch('/api/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `${project.name}: ${project.description}`,
          section: 'projects'
        }),
      });

      const result = await response.json();
      if (result.success && result.improvedText) {
        updateProject(id, 'description', result.improvedText);
      }
    } catch (error) {
      console.error('Error generating project suggestions:', error);
    } finally {
      setIsGenerating(null);
    }
  };

  const popularTechnologies = [
    'React', 'Vue.js', 'Angular', 'Node.js', 'Express.js', 'Next.js',
    'TypeScript', 'JavaScript', 'Python', 'Java', 'C#', 'Go',
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
    'Git', 'GitHub', 'GitLab', 'Jenkins', 'CI/CD'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Projects</h3>
        <button
          onClick={addProject}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Project
        </button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <CodeBracketIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="mb-4">No projects yet. Showcase your best work!</p>
          <p className="text-sm text-gray-400">Include personal projects, open source contributions, or work projects you can share.</p>
        </div>
      )}

      {data.map((project, index) => (
        <div key={project.id} className="bg-gray-50 p-6 rounded-lg border">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-md font-medium text-gray-900">Project {index + 1}</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => generateProjectSuggestions(project.id)}
                disabled={isGenerating === project.id || !project.name}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="h-3 w-3 mr-1" />
                {isGenerating === project.id ? 'Generating...' : 'AI Improve'}
              </button>
              <button
                onClick={() => removeProject(project.id)}
                className="text-red-600 hover:text-red-800"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                value={project.name}
                onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                placeholder="e.g., E-commerce Platform, Task Management App"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="month"
                value={project.startDate}
                onChange={(e) => updateProject(project.id, 'startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date (Optional)
              </label>
              <input
                type="month"
                value={project.endDate || ''}
                onChange={(e) => updateProject(project.id, 'endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitHub URL (Optional)
              </label>
              <div className="flex">
                <input
                  type="url"
                  value={project.githubUrl || ''}
                  onChange={(e) => updateProject(project.id, 'githubUrl', e.target.value)}
                  placeholder="https://github.com/username/project"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:text-gray-700"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Live Demo URL (Optional)
              </label>
              <div className="flex">
                <input
                  type="url"
                  value={project.liveUrl || ''}
                  onChange={(e) => updateProject(project.id, 'liveUrl', e.target.value)}
                  placeholder="https://your-project.com"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
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

          {/* Project Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Description *
            </label>
            <ReactQuill
              value={project.description}
              onChange={(value) => updateProject(project.id, 'description', value)}
              placeholder="Describe your project, its purpose, and key features..."
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

          {/* Technologies Used */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Technologies Used *
              </label>
              <button
                onClick={() => addTechnology(project.id)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Technology
              </button>
            </div>
            {project.technologies.length === 0 && (
              <div className="mb-2">
                <p className="text-sm text-gray-500 mb-2">Popular technologies:</p>
                <div className="flex flex-wrap gap-1">
                  {popularTechnologies.slice(0, 10).map((tech, idx) => (
                    <button
                      key={idx}
                      onClick={() => updateProject(project.id, 'technologies', [...project.technologies, tech])}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                    >
                      + {tech}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {project.technologies.map((tech, techIndex) => (
              <div key={techIndex} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={tech}
                  onChange={(e) => updateTechnology(project.id, techIndex, e.target.value)}
                  placeholder="e.g., React, Node.js, MongoDB"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  list={`technologies-${project.id}`}
                />
                <button
                  onClick={() => removeTechnology(project.id, techIndex)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            <datalist id={`technologies-${project.id}`}>
              {popularTechnologies.map((tech, idx) => (
                <option key={idx} value={tech} />
              ))}
            </datalist>
          </div>

          {/* Key Highlights */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Key Highlights & Achievements
              </label>
              <button
                onClick={() => addHighlight(project.id)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Highlight
              </button>
            </div>
            {project.highlights.map((highlight, highlightIndex) => (
              <div key={highlightIndex} className="flex items-start space-x-2 mb-2">
                <input
                  type="text"
                  value={highlight}
                  onChange={(e) => updateHighlight(project.id, highlightIndex, e.target.value)}
                  placeholder="e.g., Achieved 99.9% uptime, Reduced load time by 50%"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => removeHighlight(project.id, highlightIndex)}
                  className="text-red-600 hover:text-red-800 mt-2"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}