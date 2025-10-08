import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Loader2, CheckCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { createApiUrl } from '../config/api';

interface Theme {
  id: string;
  name: string;
  description: string;
  preview_image: string;
  color_scheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  layout_type: string;
}

interface ParsedData {
  id: string;
  name: string;
  email: string;
  phone: string;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
}

const PersonalSiteGenerate: React.FC = () => {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const navigate = useNavigate();
  const { getAccessToken, isAuthenticated } = useSupabaseAuth();

  useEffect(() => {
    // Get parsed data from sessionStorage
    const storedData = sessionStorage.getItem('parsedResumeData');
    if (!storedData) {
      console.log('⚠️ No resume data found in sessionStorage, creating mock data for testing');
      // Create mock data for testing
      const mockData = {
        id: 'test-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        summary: 'Test summary',
        experience: [{
          title: 'Software Developer',
          company: 'Test Company',
          duration: '2020-2023',
          description: 'Test description'
        }],
        education: [{
          degree: 'Bachelor of Science',
          institution: 'Test University',
          year: '2020'
        }],
        skills: ['JavaScript', 'React', 'Node.js'],
        projects: [{
          name: 'Test Project',
          description: 'Test project description',
          technologies: ['React', 'Node.js']
        }]
      };
      setParsedData(mockData);
      loadThemes();
      return;
    }
    
    setParsedData(JSON.parse(storedData));
    loadThemes();
  }, [navigate]);

  const loadThemes = async () => {
    console.log('🎨 === THEME LOADING DEBUG START ===');
    console.log('🔐 Authentication status:', isAuthenticated);
    console.log('📍 Current location:', window.location.href);
    
    try {
      // Check authentication first
      if (!isAuthenticated) {
        console.log('❌ User not authenticated, redirecting to login');
        toast.error('Please log in to continue');
        navigate('/login');
        return;
      }

      console.log('✅ User is authenticated, getting access token...');
      const token = await getAccessToken();
      if (!token) {
        console.log('❌ No access token received');
        toast.error('Authentication failed. Please log in again.');
        navigate('/login');
        return;
      }

      console.log('✅ Access token received:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      const apiUrl = createApiUrl('/api/personal-sites/themes');
      console.log('🌐 Making API request to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error response:', errorText);
        throw new Error(`Failed to load themes: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📊 API Result:', result);
      console.log('📊 Themes count:', result.themes?.length || 0);
      
      if (result.success) {
        console.log('✅ Setting themes in state:', result.themes);
        setThemes(result.themes);
        // Select the first theme by default
        if (result.themes.length > 0) {
          console.log('🎯 Auto-selecting first theme:', result.themes[0].id);
          setSelectedTheme(result.themes[0].id);
        } else {
          console.log('⚠️ No themes available to select');
        }
      } else {
        console.log('❌ API returned success: false');
      }
    } catch (error: any) {
      console.error('💥 Error loading themes:', error);
      console.error('💥 Error type:', error.constructor.name);
      console.error('💥 Error message:', error.message);
      console.error('💥 Error stack:', error.stack);
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('🚫 CORS or network error detected');
        toast.error('Network error: Unable to connect to server. Please check if the backend is running.');
      } else {
        toast.error('Failed to load themes. Please try again.');
      }
    } finally {
      console.log('🏁 Setting loadingThemes to false');
      setLoadingThemes(false);
    }
    console.log('🎨 === THEME LOADING DEBUG END ===');
  };

  const handleGenerateSite = async () => {
    if (!selectedTheme || !parsedData) {
      toast.error('Please select a theme');
      return;
    }

    setIsGenerating(true);

    try {
      // Check authentication first
      if (!isAuthenticated) {
        toast.error('Please log in to continue');
        navigate('/login');
        return;
      }

      const token = await getAccessToken();
      if (!token) {
        toast.error('Authentication failed. Please log in again.');
        navigate('/login');
        return;
      }

      console.log('=== SITE GENERATION DEBUG ===');
      console.log('Authentication token:', token ? 'Token present' : 'No token');
      console.log('Token length:', token ? token.length : 0);
      console.log('Token starts with:', token ? token.substring(0, 20) + '...' : 'N/A');
      console.log('Selected theme ID:', selectedTheme);
      console.log('Parsed data ID:', parsedData.id);
      console.log('Parsed data name:', parsedData.name);

      const requestPayload = {
        parseId: parsedData.id,
        themeId: selectedTheme,
        customizations: {
          includeProjects: true,
          includeSkills: true,
          includeExperience: true,
          includeEducation: true
        }
      };

      console.log('Request payload:', JSON.stringify(requestPayload, null, 2));

      const response = await fetch('/api/personal-sites/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('API response status:', response.status);
      console.log('API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Parsed error JSON:', errorJson);
          throw new Error(errorJson.error || `Site generation failed: ${response.status} ${response.statusText}`);
        } catch (parseError) {
          console.error('Could not parse error response as JSON:', parseError);
          throw new Error(`Site generation failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('API success response:', result);
      
      if (result.success) {
        console.log('Site generated successfully with ID:', result.siteId);
        toast.success('Personal site generated successfully!');
        // Navigate to the edit page with the new site ID
        navigate(`/personal-site-generator/edit/${result.siteId}`);
      } else {
        console.error('API returned success=false:', result);
        throw new Error(result.error || 'Generation failed');
      }
    } catch (error) {
      console.error('=== GENERATION ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error detected - check if backend is running');
        toast.error('Network error. Please check if the server is running.');
      } else {
        toast.error(`Failed to generate site: ${error.message}`);
      }
    } finally {
      setIsGenerating(false);
      console.log('=== GENERATION PROCESS COMPLETE ===');
    }
  };

  const handleBackToUpload = () => {
    navigate('/personal-site-generator/upload');
  };

  if (loadingThemes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading themes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Site Theme
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select a theme that best represents your professional style
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={handleBackToUpload}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Upload</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Step 2: Select a Theme
            </h2>
            <p className="text-gray-600">
              Choose from our professionally designed themes
            </p>
          </div>

          {/* Resume Preview */}
          {parsedData && (
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your Resume Data
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{parsedData.name}</p>
                  <p className="text-gray-600">{parsedData.email}</p>
                </div>
                <div>
                  <p className="text-gray-600">
                    {parsedData.experience.length} work experience(s)
                  </p>
                  <p className="text-gray-600">
                    {parsedData.skills.length} skills
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">
                    {parsedData.education.length} education(s)
                  </p>
                  <p className="text-gray-600">
                    {parsedData.projects.length} project(s)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Theme Selection */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {themes.map((theme) => (
              <div
                key={theme.id}
                className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                  selectedTheme === theme.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTheme(theme.id)}
              >
                {selectedTheme === theme.id && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-6 w-6 text-blue-500" />
                  </div>
                )}
                
                {/* Theme Preview */}
                <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  {theme.preview_image ? (
                    <img
                      src={theme.preview_image}
                      alt={theme.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: theme.color_scheme.background }}
                    >
                      <div className="text-center">
                        <div 
                          className="w-16 h-16 rounded-full mx-auto mb-2"
                          style={{ backgroundColor: theme.color_scheme.primary }}
                        ></div>
                        <div 
                          className="w-20 h-2 rounded mx-auto mb-1"
                          style={{ backgroundColor: theme.color_scheme.secondary }}
                        ></div>
                        <div 
                          className="w-16 h-2 rounded mx-auto"
                          style={{ backgroundColor: theme.color_scheme.accent }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">{theme.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{theme.description}</p>
                
                {/* Color Scheme */}
                <div className="flex space-x-2">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: theme.color_scheme.primary }}
                    title="Primary Color"
                  ></div>
                  <div
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: theme.color_scheme.secondary }}
                    title="Secondary Color"
                  ></div>
                  <div
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: theme.color_scheme.accent }}
                    title="Accent Color"
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Generate Button */}
          <div className="text-center">
            <button
              onClick={handleGenerateSite}
              disabled={!selectedTheme || isGenerating}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-3 mx-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Generating Your Site...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-6 w-6" />
                  <span>Generate My Personal Site</span>
                </>
              )}
            </button>
            
            {isGenerating && (
              <p className="text-sm text-gray-600 mt-4">
                This may take a few moments while AI creates your personalized content...
              </p>
            )}
          </div>
        </div>

        {/* Process Steps */}
        <div className="mt-12">
          <div className="flex justify-center">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500 text-white">
                  1
                </div>
                <span className="text-sm font-medium text-gray-900">Upload Resume</span>
              </div>
              
              <div className="w-16 h-0.5 bg-gray-300"></div>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500 text-white">
                  2
                </div>
                <span className="text-sm font-medium text-gray-900">Generate Site</span>
              </div>
              
              <div className="w-16 h-0.5 bg-gray-300"></div>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-300 text-gray-500">
                  3
                </div>
                <span className="text-sm font-medium text-gray-500">Customize &amp; Publish</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalSiteGenerate;