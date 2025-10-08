import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Eye, 
  Edit3, 
  Save, 
  ArrowLeft, 
  Monitor, 
  Smartphone, 
  Tablet,
  Loader2,
  CheckCircle,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface SiteContent {
  id: string;
  section_name: string;
  content_type: string;
  content_data: any;
  display_order: number;
}

interface PersonalSite {
  id: string;
  title: string;
  description: string;
  theme_id: string;
  status: string;
  custom_domain: string | null;
  seo_settings: any;
  created_at: string;
  updated_at: string;
}

const PersonalSiteEdit: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  
  const [site, setSite] = useState<PersonalSite | null>(null);
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<any>({});

  useEffect(() => {
    if (siteId) {
      loadSiteData();
    }
  }, [siteId]);

  const loadSiteData = async () => {
    try {
      const response = await fetch(`/api/personal-sites/${siteId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load site data');
      }

      const result = await response.json();
      if (result.success) {
        setSite(result.data.site);
        setContent(result.data.content);
      }
    } catch (error) {
      console.error('Error loading site:', error);
      toast.error('Failed to load site data');
      navigate('/personal-site-generator/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSection = (sectionId: string, currentContent: any) => {
    setEditingSection(sectionId);
    setEditedContent({ ...currentContent });
  };

  const handleSaveSection = async (sectionId: string) => {
    setSaving(true);
    
    try {
      const response = await fetch(`/api/personal-sites/${siteId}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sectionId,
          contentData: editedContent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      const result = await response.json();
      if (result.success) {
        // Update local content
        setContent(prev => prev.map(item => 
          item.id === sectionId 
            ? { ...item, content_data: editedContent }
            : item
        ));
        setEditingSection(null);
        toast.success('Section updated successfully');
      }
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditedContent({});
  };

  const handlePublish = () => {
    if (siteId) {
      navigate(`/personal-site-generator/publish/${siteId}`);
    }
  };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile': return 'max-w-sm';
      case 'tablet': return 'max-w-2xl';
      default: return 'max-w-6xl';
    }
  };

  const renderSectionContent = (section: SiteContent) => {
    const isEditing = editingSection === section.id;
    const contentData = isEditing ? editedContent : section.content_data;

    switch (section.content_type) {
      case 'hero':
        return (
          <div className="text-center py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={contentData.name || ''}
                  onChange={(e) => setEditedContent({...editedContent, name: e.target.value})}
                  className="w-full text-4xl font-bold bg-transparent border-b-2 border-white/30 text-center text-white placeholder-white/70"
                  placeholder="Your Name"
                />
                <input
                  type="text"
                  value={contentData.title || ''}
                  onChange={(e) => setEditedContent({...editedContent, title: e.target.value})}
                  className="w-full text-xl bg-transparent border-b-2 border-white/30 text-center text-white placeholder-white/70"
                  placeholder="Your Professional Title"
                />
                <textarea
                  value={contentData.summary || ''}
                  onChange={(e) => setEditedContent({...editedContent, summary: e.target.value})}
                  className="w-full bg-transparent border-2 border-white/30 rounded p-4 text-white placeholder-white/70"
                  placeholder="Brief summary about yourself"
                  rows={3}
                />
              </div>
            ) : (
              <>
                <h1 className="text-5xl font-bold mb-4">{contentData.name}</h1>
                <p className="text-2xl mb-6">{contentData.title}</p>
                <p className="text-lg max-w-2xl mx-auto">{contentData.summary}</p>
              </>
            )}
          </div>
        );

      case 'experience':
        return (
          <div className="py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Experience</h2>
            {isEditing ? (
              <div className="space-y-6">
                {(contentData.items || []).map((item: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => {
                        const newItems = [...(contentData.items || [])];
                        newItems[index] = {...item, title: e.target.value};
                        setEditedContent({...editedContent, items: newItems});
                      }}
                      className="w-full text-xl font-semibold border-b border-gray-300 mb-2"
                      placeholder="Job Title"
                    />
                    <input
                      type="text"
                      value={item.company || ''}
                      onChange={(e) => {
                        const newItems = [...(contentData.items || [])];
                        newItems[index] = {...item, company: e.target.value};
                        setEditedContent({...editedContent, items: newItems});
                      }}
                      className="w-full text-lg text-blue-600 border-b border-gray-300 mb-2"
                      placeholder="Company Name"
                    />
                    <input
                      type="text"
                      value={item.duration || ''}
                      onChange={(e) => {
                        const newItems = [...(contentData.items || [])];
                        newItems[index] = {...item, duration: e.target.value};
                        setEditedContent({...editedContent, items: newItems});
                      }}
                      className="w-full text-gray-600 border-b border-gray-300 mb-2"
                      placeholder="Duration (e.g., 2020 - 2023)"
                    />
                    <textarea
                      value={item.description || ''}
                      onChange={(e) => {
                        const newItems = [...(contentData.items || [])];
                        newItems[index] = {...item, description: e.target.value};
                        setEditedContent({...editedContent, items: newItems});
                      }}
                      className="w-full border border-gray-300 rounded p-2"
                      placeholder="Job description"
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {(contentData.items || []).map((item: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-6">
                    <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-lg text-blue-600 mb-2">{item.company}</p>
                    <p className="text-gray-600 mb-3">{item.duration}</p>
                    <p className="text-gray-700">{item.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'skills':
        return (
          <div className="py-12 bg-gray-50 rounded-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Skills</h2>
            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  value={(contentData.items || []).join(', ')}
                  onChange={(e) => {
                    const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                    setEditedContent({...editedContent, items: skills});
                  }}
                  className="w-full border border-gray-300 rounded p-4"
                  placeholder="Enter skills separated by commas"
                  rows={4}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                {(contentData.items || []).map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="py-8">
            <h3 className="text-xl font-semibold mb-4 capitalize">{section.section_name}</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(contentData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your site...</p>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Site not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/personal-site-generator/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{site.title}</h1>
                <p className="text-sm text-gray-600">Edit your personal site</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Preview Mode Selector */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-white shadow' : ''}`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('tablet')}
                  className={`p-2 rounded ${previewMode === 'tablet' ? 'bg-white shadow' : ''}`}
                >
                  <Tablet className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-white shadow' : ''}`}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={handlePublish}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Publish Site</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className={`w-full ${getPreviewWidth()} transition-all duration-300`}>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Site Preview */}
              <div className="space-y-0">
                {content
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((section) => (
                    <div key={section.id} className="relative group">
                      {/* Edit Button */}
                      {editingSection !== section.id && (
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button
                            onClick={() => handleEditSection(section.id, section.content_data)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      {/* Save/Cancel Buttons for Editing */}
                      {editingSection === section.id && (
                        <div className="absolute top-4 right-4 flex space-x-2 z-10">
                          <button
                            onClick={() => handleSaveSection(section.id)}
                            disabled={saving}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                          >
                            ×
                          </button>
                        </div>
                      )}

                      {/* Section Content */}
                      <div className="p-6">
                        {renderSectionContent(section)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalSiteEdit;