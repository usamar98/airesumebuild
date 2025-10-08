import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Globe, 
  Copy, 
  ExternalLink, 
  Settings, 
  ArrowLeft,
  CheckCircle,
  Loader2,
  Share2,
  Download,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface PersonalSite {
  id: string;
  title: string;
  description: string;
  theme_id: string;
  status: string;
  custom_domain: string | null;
  seo_settings: any;
  site_url: string;
  created_at: string;
  updated_at: string;
}

const PersonalSitePublish: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  
  const [site, setSite] = useState<PersonalSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');

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
        const siteData = result.data.site;
        setSite(siteData);
        setCustomDomain(siteData.custom_domain || '');
        setSeoTitle(siteData.seo_settings?.title || siteData.title);
        setSeoDescription(siteData.seo_settings?.description || siteData.description);
        setSeoKeywords(siteData.seo_settings?.keywords || '');
      }
    } catch (error) {
      console.error('Error loading site:', error);
      toast.error('Failed to load site data');
      navigate('/personal-site-generator/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishSite = async () => {
    if (!siteId) return;

    setPublishing(true);

    try {
      const response = await fetch(`/api/personal-sites/${siteId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          customDomain: customDomain || null,
          seoSettings: {
            title: seoTitle,
            description: seoDescription,
            keywords: seoKeywords
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to publish site');
      }

      const result = await response.json();
      if (result.success) {
        setSite(prev => prev ? { ...prev, ...result.data } : null);
        toast.success('Site published successfully!');
      }
    } catch (error) {
      console.error('Error publishing site:', error);
      toast.error('Failed to publish site');
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyUrl = () => {
    if (site?.site_url) {
      navigator.clipboard.writeText(site.site_url);
      toast.success('URL copied to clipboard!');
    }
  };

  const handleOpenSite = () => {
    if (site?.site_url) {
      window.open(site.site_url, '_blank');
    }
  };

  const handleShareSite = async () => {
    if (site?.site_url && navigator.share) {
      try {
        await navigator.share({
          title: site.title,
          text: site.description,
          url: site.site_url
        });
      } catch (error) {
        // Fallback to copy URL
        handleCopyUrl();
      }
    } else {
      handleCopyUrl();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading site data...</p>
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

  const isPublished = site.status === 'published';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/personal-site-generator/edit/${siteId}`)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Editor</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {isPublished ? 'Your Site is Live!' : 'Publish Your Site'}
            </h1>
            <p className="text-xl text-gray-600">
              {isPublished 
                ? 'Share your professional website with the world'
                : 'Configure settings and make your site public'
              }
            </p>
          </div>
        </div>

        {isPublished && (
          /* Published Site Info */
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Site Successfully Published!
              </h2>
              <p className="text-gray-600">Your personal website is now live and accessible</p>
            </div>

            {/* Site URL */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Site URL
              </label>
              <div className="flex items-center space-x-3">
                <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-lg px-4 py-3">
                  <Globe className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-blue-600 font-medium">{site.site_url}</span>
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copy URL"
                >
                  <Copy className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={handleOpenSite}
                  className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  title="Open Site"
                >
                  <ExternalLink className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleShareSite}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Share2 className="h-5 w-5" />
                <span>Share Site</span>
              </button>
              
              <button
                onClick={() => navigate(`/personal-site-generator/edit/${siteId}`)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Settings className="h-5 w-5" />
                <span>Edit Site</span>
              </button>
            </div>
          </div>
        )}

        {/* Publishing Configuration */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            {isPublished ? 'Site Configuration' : 'Publishing Settings'}
          </h2>

          <div className="space-y-6">
            {/* Custom Domain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Domain (Optional)
              </label>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="www.yourname.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to use our default domain
              </p>
            </div>

            {/* SEO Settings */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Title
                  </label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Your Name - Professional Portfolio"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Brief description of your professional background and skills"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    placeholder="developer, designer, portfolio, professional"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Separate keywords with commas
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Publish Button */}
          <div className="mt-8 text-center">
            <button
              onClick={handlePublishSite}
              disabled={publishing}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-3 mx-auto"
            >
              {publishing ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Globe className="h-6 w-6" />
                  <span>{isPublished ? 'Update Site' : 'Publish Site'}</span>
                </>
              )}
            </button>
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
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500 text-white">
                  2
                </div>
                <span className="text-sm font-medium text-gray-900">Generate Site</span>
              </div>
              
              <div className="w-16 h-0.5 bg-gray-300"></div>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500 text-white">
                  3
                </div>
                <span className="text-sm font-medium text-gray-900">Customize &amp; Publish</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalSitePublish;