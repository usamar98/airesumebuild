import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { 
  SparklesIcon, 
  ChartBarIcon, 
  DocumentTextIcon, 
  DocumentDuplicateIcon,
  UserGroupIcon,
  LanguageIcon,
  CogIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  PresentationChartLineIcon,
  AcademicCapIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import Navigation from '../components/Navigation';

export default function Home() {
  const { t } = useTranslation();

  useEffect(() => {
    // SEO Meta Tags
    document.title = 'AI Resume Builder 2025 | Professional Resume Creator with ATS Optimization';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Create professional resumes in 2025 with our AI-powered builder. ATS optimization, multi-language support, 50+ templates. Build your perfect resume in minutes.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Create professional resumes in 2025 with our AI-powered builder. ATS optimization, multi-language support, 50+ templates. Build your perfect resume in minutes.';
      document.head.appendChild(meta);
    }

    // Keywords meta tag
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', 'resume builder, AI resume, ATS optimization, professional resume, resume templates, cover letter generator, job application, career tools, resume maker 2025');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = 'resume builder, AI resume, ATS optimization, professional resume, resume templates, cover letter generator, job application, career tools, resume maker 2025';
      document.head.appendChild(meta);
    }

    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'AI Resume Builder 2025 | Professional Resume Creator');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      meta.content = 'AI Resume Builder 2025 | Professional Resume Creator';
      document.head.appendChild(meta);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Build professional resumes with AI-powered optimization, ATS compatibility, and industry-specific templates. Perfect for 2025 job market.');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      meta.content = 'Build professional resumes with AI-powered optimization, ATS compatibility, and industry-specific templates. Perfect for 2025 job market.';
      document.head.appendChild(meta);
    }

    // Structured Data (JSON-LD)
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "AI Resume Builder 2025",
      "description": "Professional resume builder with AI optimization, ATS compatibility, and multi-language support",
      "url": window.location.origin,
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": [
        "AI-powered resume building",
        "ATS optimization",
        "Multi-language support",
        "Professional templates",
        "Cover letter generator",
        "Achievement quantifier",
        "Keyword optimization"
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              {t('home.hero.buildPerfectResume')}{' '}
              <span className="text-blue-600">{t('home.hero.withAI')}</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t('home.hero.createStandoutResume')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/resume-builder"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {t('home.hero.startForFree')}
              </Link>
              <Link
                to="/templates"
                className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                {t('home.hero.viewTemplates')}
              </Link>
            </div>
            
            {/* Key Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 bg-white/80 backdrop-blur-sm rounded-lg p-4 sm:p-6 lg:p-8 shadow-lg mx-4 max-w-4xl mt-8 sm:mt-10 lg:mt-12">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">8</div>
                <div className="text-gray-600 text-xs sm:text-sm lg:text-base">{t('home.stats.industrySpecific')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1 sm:mb-2">5</div>
                <div className="text-gray-600 text-xs sm:text-sm lg:text-base">{t('home.stats.languagesSupported')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">95%</div>
                <div className="text-gray-600 text-xs sm:text-sm lg:text-base">{t('home.stats.atsCompatibility')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1 sm:mb-2">AI</div>
                <div className="text-gray-600 text-xs sm:text-sm lg:text-base">{t('home.stats.poweredOptimization')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              {t('home.featuresTitle')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto px-4">
              {t('home.featuresDescription')}
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* AI-Powered Resume Builder */}
            <div className="text-center p-4 sm:p-6 lg:p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow bg-white">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-blue-100 rounded-lg mb-4 sm:mb-5 lg:mb-6">
                <SparklesIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">AI-Powered Builder</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-5 lg:mb-6">
                Create professional resumes with intelligent content suggestions and real-time optimization.
              </p>
              <ul className="text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-2 text-left">
                <li>• Live preview as you type</li>
                <li>• Smart content suggestions</li>
                <li>• Auto-formatting & layout</li>
                <li>• Achievement quantifier</li>
              </ul>
            </div>

            {/* ATS Optimization */}
            <div className="text-center p-4 sm:p-6 lg:p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow bg-white">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-green-100 rounded-lg mb-4 sm:mb-5 lg:mb-6">
                <ChartBarIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">{t('home.featuresSection.atsOptimizationTitle')}</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-5 lg:mb-6">
                {t('home.featuresSection.atsOptimizationDesc')}
              </p>
              <ul className="text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-2 text-left">
                <li>• Real-time ATS scoring</li>
                <li>• Keyword optimization</li>
                <li>• Format compatibility check</li>
                <li>• Industry-specific analysis</li>
              </ul>
            </div>

            {/* Multi-Language Support */}
            <div className="text-center p-4 sm:p-6 lg:p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow bg-white">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-purple-100 rounded-lg mb-4 sm:mb-5 lg:mb-6">
                <GlobeAltIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">{t('home.featuresSection.multiLanguageSupportTitle')}</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-5 lg:mb-6">
                {t('home.featuresSection.multiLanguageSupportDesc')}
              </p>
              <ul className="text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-2 text-left">
                <li>• English, French, Italian, German</li>
                <li>• Localized date formats</li>
                <li>• Cultural adaptations</li>
                <li>• Regional best practices</li>
              </ul>
            </div>

            {/* Industry Templates */}
            <div className="text-center p-4 sm:p-6 lg:p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow bg-white">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-orange-100 rounded-lg mb-4 sm:mb-5 lg:mb-6">
                <DocumentTextIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-orange-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">{t('home.featuresSection.industryTemplatesTitle')}</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-5 lg:mb-6">
                {t('home.featuresSection.industryTemplatesDesc')}
              </p>
              <ul className="text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-2 text-left">
                <li>• Technology & Engineering</li>
                <li>• Healthcare & Medical</li>
                <li>• Finance & Banking</li>
                <li>• Creative & Design</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Product Features */}
      <div className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{t('home.featuresSection.title')}</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              {t('home.featuresSection.subtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 mb-12 sm:mb-16">
            {/* Resume Builder & Live Preview */}
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                  <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">{t('home.toolsSection.interactiveResumeBuilderTitle')}</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                {t('home.toolsSection.interactiveResumeBuilderDesc')}
              </p>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-600">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Live preview updates as you type</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Automatic formatting and layout optimization</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Section management (Work Experience, Education, Skills)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Professional PDF generation</span>
                </li>
              </ul>
            </div>

            {/* ATS Optimization & Analysis */}
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                  <ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">{t('home.toolsSection.atsOptimizationTitle')}</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                {t('home.toolsSection.atsOptimizationDesc')}
              </p>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-600">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Real-time ATS compatibility scoring</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Keyword optimization suggestions</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Format and structure analysis</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span>Industry-specific optimization</span>
                </li>
              </ul>
            </div>

            {/* Achievement Quantifier */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <PresentationChartLineIcon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">{t('home.toolsSection.achievementQuantifierTitle')}</h3>
              </div>
              <p className="text-gray-600 mb-6">
                {t('home.toolsSection.achievementQuantifierDesc')}
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Convert achievements into measurable results</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Suggest metrics and percentages</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Industry-specific achievement examples</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Impact-focused language suggestions</span>
                </li>
              </ul>
            </div>

            {/* Cover Letter Generator */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <DocumentDuplicateIcon className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">{t('home.toolsSection.coverLetterGeneratorTitle')}</h3>
              </div>
              <p className="text-gray-600 mb-6">
                {t('home.toolsSection.coverLetterGeneratorDesc')}
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Personalized content generation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Industry-specific templates</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Tone and style customization</span>
                </li>
                <li className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Professional formatting</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Additional Tools Section */}
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm mb-12 sm:mb-16">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 sm:mb-8 text-center">{t('home.toolsSection.additionalToolsTitle')}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <CogIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t('home.toolsSection.keywordOptimizerTitle')}</h4>
                <p className="text-gray-600 text-xs sm:text-sm">
                  {t('home.toolsSection.keywordOptimizerDesc')}
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <GlobeAltIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Multi-Language Support</h4>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Create resumes in English, French, Italian, and German with localized formatting and cultural adaptations.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <StarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t('home.toolsSection.professionalTemplatesTitle')}</h4>
                <p className="text-gray-600 text-xs sm:text-sm">
                  {t('home.toolsSection.professionalTemplatesDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            {t('home.cta.title')}
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8">
            {t('home.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              to="/builder"
              className="bg-white text-blue-600 px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center text-sm sm:text-base"
            >
              {t('home.cta.startBuilding')}
              <ArrowRightIcon className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
            <Link
              to="/templates"
              className="border border-white text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors text-sm sm:text-base"
            >
              {t('home.cta.browseTemplates')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <DocumentTextIcon className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold">{t('common.appName')}</span>
            </div>
            <p className="text-gray-400">
              {t('home.footerDescription')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}