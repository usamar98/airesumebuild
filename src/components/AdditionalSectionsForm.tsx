import { useState } from 'react';
import { PlusIcon, TrashIcon, SparklesIcon, DocumentTextIcon, LightBulbIcon, MicrophoneIcon, HeartIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { Publication, Patent, SpeakingEngagement, ProfessionalMembership } from '../types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface AdditionalSectionsFormProps {
  publications: Publication[];
  patents: Patent[];
  speakingEngagements: SpeakingEngagement[];
  professionalMemberships: ProfessionalMembership[];
  hobbies: string[];
  onPublicationsChange: (publications: Publication[]) => void;
  onPatentsChange: (patents: Patent[]) => void;
  onSpeakingEngagementsChange: (engagements: SpeakingEngagement[]) => void;
  onProfessionalMembershipsChange: (memberships: ProfessionalMembership[]) => void;
  onHobbiesChange: (hobbies: string[]) => void;
}

export default function AdditionalSectionsForm({
  publications,
  patents,
  speakingEngagements,
  professionalMemberships,
  hobbies,
  onPublicationsChange,
  onPatentsChange,
  onSpeakingEngagementsChange,
  onProfessionalMembershipsChange,
  onHobbiesChange
}: AdditionalSectionsFormProps) {
  const [activeSection, setActiveSection] = useState<string>('publications');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  // Publications functions
  const addPublication = () => {
    const newPublication: Publication = {
      id: Date.now().toString(),
      title: '',
      authors: [],
      publication: '',
      journal: '',
      date: '',
      year: new Date().getFullYear(),
      doi: '',
      url: '',
      abstract: ''
    };
    onPublicationsChange([...publications, newPublication]);
  };

  const removePublication = (id: string) => {
    onPublicationsChange(publications.filter(pub => pub.id !== id));
  };

  const updatePublication = (id: string, field: keyof Publication, value: any) => {
    onPublicationsChange(publications.map(pub => 
      pub.id === id ? { ...pub, [field]: value } : pub
    ));
  };

  // Patents functions
  const addPatent = () => {
    const newPatent: Patent = {
      id: Date.now().toString(),
      title: '',
      inventors: [],
      patentNumber: '',
      date: '',
      filingDate: '',
      grantDate: '',
      status: 'pending',
      description: ''
    };
    onPatentsChange([...patents, newPatent]);
  };

  const removePatent = (id: string) => {
    onPatentsChange(patents.filter(patent => patent.id !== id));
  };

  const updatePatent = (id: string, field: keyof Patent, value: any) => {
    onPatentsChange(patents.map(patent => 
      patent.id === id ? { ...patent, [field]: value } : patent
    ));
  };

  // Speaking Engagements functions
  const addSpeakingEngagement = () => {
    const newEngagement: SpeakingEngagement = {
      id: Date.now().toString(),
      title: '',
      event: '',
      date: '',
      location: '',
      description: '',
      audienceSize: undefined,
      type: 'conference'
    };
    onSpeakingEngagementsChange([...speakingEngagements, newEngagement]);
  };

  const removeSpeakingEngagement = (id: string) => {
    onSpeakingEngagementsChange(speakingEngagements.filter(eng => eng.id !== id));
  };

  const updateSpeakingEngagement = (id: string, field: keyof SpeakingEngagement, value: any) => {
    onSpeakingEngagementsChange(speakingEngagements.map(eng => 
      eng.id === id ? { ...eng, [field]: value } : eng
    ));
  };

  // Professional Memberships functions
  const addProfessionalMembership = () => {
    const newMembership: ProfessionalMembership = {
      id: Date.now().toString(),
      organization: '',
      role: '',
      startDate: '',
      endDate: '',
      current: true,
      description: ''
    };
    onProfessionalMembershipsChange([...professionalMemberships, newMembership]);
  };

  const removeProfessionalMembership = (id: string) => {
    onProfessionalMembershipsChange(professionalMemberships.filter(mem => mem.id !== id));
  };

  const updateProfessionalMembership = (id: string, field: keyof ProfessionalMembership, value: any) => {
    onProfessionalMembershipsChange(professionalMemberships.map(mem => 
      mem.id === id ? { ...mem, [field]: value } : mem
    ));
  };

  // Hobbies functions
  const addHobby = () => {
    onHobbiesChange([...hobbies, '']);
  };

  const removeHobby = (index: number) => {
    onHobbiesChange(hobbies.filter((_, i) => i !== index));
  };

  const updateHobby = (index: number, value: string) => {
    const newHobbies = [...hobbies];
    newHobbies[index] = value;
    onHobbiesChange(newHobbies);
  };

  const sections = [
    { id: 'publications', label: 'Publications', icon: DocumentTextIcon, count: publications.length },
    { id: 'patents', label: 'Patents', icon: LightBulbIcon, count: patents.length },
    { id: 'speaking', label: 'Speaking', icon: MicrophoneIcon, count: speakingEngagements.length },
    { id: 'memberships', label: 'Memberships', icon: BuildingOfficeIcon, count: professionalMemberships.length },
    { id: 'hobbies', label: 'Hobbies', icon: HeartIcon, count: hobbies.length }
  ];

  const commonHobbies = [
    'Reading', 'Writing', 'Photography', 'Traveling', 'Cooking',
    'Hiking', 'Cycling', 'Swimming', 'Running', 'Yoga',
    'Music', 'Painting', 'Drawing', 'Gardening', 'Chess',
    'Board Games', 'Video Games', 'Volunteering', 'Learning Languages',
    'Playing Musical Instruments', 'Dancing', 'Rock Climbing'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Sections</h3>
        
        {/* Section Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeSection === section.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {section.label}
                  {section.count > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                      {section.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Publications Section */}
      {activeSection === 'publications' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-900">Publications</h4>
            <button
              onClick={addPublication}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Publication
            </button>
          </div>

          {publications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No publications yet. Add your research papers, articles, or books.</p>
            </div>
          )}

          {publications.map((publication, index) => (
            <div key={publication.id} className="bg-gray-50 p-6 rounded-lg border">
              <div className="flex justify-between items-start mb-4">
                <h5 className="text-md font-medium text-gray-900">Publication {index + 1}</h5>
                <button
                  onClick={() => removePublication(publication.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={publication.title}
                    onChange={(e) => updatePublication(publication.id, 'title', e.target.value)}
                    placeholder="Publication title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Journal/Publisher *</label>
                  <input
                    type="text"
                    value={publication.journal}
                    onChange={(e) => updatePublication(publication.id, 'journal', e.target.value)}
                    placeholder="Journal or publisher name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 5}
                    value={publication.year}
                    onChange={(e) => updatePublication(publication.id, 'year', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DOI (Optional)</label>
                  <input
                    type="text"
                    value={publication.doi || ''}
                    onChange={(e) => updatePublication(publication.id, 'doi', e.target.value)}
                    placeholder="10.1000/xyz123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL (Optional)</label>
                  <input
                    type="url"
                    value={publication.url || ''}
                    onChange={(e) => updatePublication(publication.id, 'url', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Authors *</label>
                {publication.authors.map((author, authorIndex) => (
                  <div key={authorIndex} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => {
                        const newAuthors = [...publication.authors];
                        newAuthors[authorIndex] = e.target.value;
                        updatePublication(publication.id, 'authors', newAuthors);
                      }}
                      placeholder="Author name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        const newAuthors = publication.authors.filter((_, i) => i !== authorIndex);
                        updatePublication(publication.id, 'authors', newAuthors);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updatePublication(publication.id, 'authors', [...publication.authors, ''])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Author
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Abstract (Optional)</label>
                <ReactQuill
                  value={publication.abstract || ''}
                  onChange={(value) => updatePublication(publication.id, 'abstract', value)}
                  placeholder="Brief abstract or summary..."
                  modules={{
                    toolbar: [
                      ['bold', 'italic'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['clean']
                    ]
                  }}
                  className="bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Patents Section */}
      {activeSection === 'patents' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-900">Patents</h4>
            <button
              onClick={addPatent}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Patent
            </button>
          </div>

          {patents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <LightBulbIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No patents yet. Add your intellectual property and innovations.</p>
            </div>
          )}

          {patents.map((patent, index) => (
            <div key={patent.id} className="bg-gray-50 p-6 rounded-lg border">
              <div className="flex justify-between items-start mb-4">
                <h5 className="text-md font-medium text-gray-900">Patent {index + 1}</h5>
                <button
                  onClick={() => removePatent(patent.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patent Title *</label>
                  <input
                    type="text"
                    value={patent.title}
                    onChange={(e) => updatePatent(patent.id, 'title', e.target.value)}
                    placeholder="Patent title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patent Number</label>
                  <input
                    type="text"
                    value={patent.patentNumber || ''}
                    onChange={(e) => updatePatent(patent.id, 'patentNumber', e.target.value)}
                    placeholder="US1234567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    value={patent.status}
                    onChange={(e) => updatePatent(patent.id, 'status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="granted">Granted</option>
                    <option value="filed">Filed</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filing Date</label>
                  <input
                    type="date"
                    value={patent.filingDate || ''}
                    onChange={(e) => updatePatent(patent.id, 'filingDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grant Date</label>
                  <input
                    type="date"
                    value={patent.grantDate || ''}
                    onChange={(e) => updatePatent(patent.id, 'grantDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Inventors *</label>
                {patent.inventors.map((inventor, inventorIndex) => (
                  <div key={inventorIndex} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={inventor}
                      onChange={(e) => {
                        const newInventors = [...patent.inventors];
                        newInventors[inventorIndex] = e.target.value;
                        updatePatent(patent.id, 'inventors', newInventors);
                      }}
                      placeholder="Inventor name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <button
                      onClick={() => {
                        const newInventors = patent.inventors.filter((_, i) => i !== inventorIndex);
                        updatePatent(patent.id, 'inventors', newInventors);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updatePatent(patent.id, 'inventors', [...patent.inventors, ''])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Inventor
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <ReactQuill
                  value={patent.description || ''}
                  onChange={(value) => updatePatent(patent.id, 'description', value)}
                  placeholder="Brief description of the patent..."
                  modules={{
                    toolbar: [
                      ['bold', 'italic'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['clean']
                    ]
                  }}
                  className="bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Speaking Engagements Section */}
      {activeSection === 'speaking' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-900">Speaking Engagements</h4>
            <button
              onClick={addSpeakingEngagement}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Speaking Engagement
            </button>
          </div>

          {speakingEngagements.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MicrophoneIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No speaking engagements yet. Add your presentations and talks.</p>
            </div>
          )}

          {speakingEngagements.map((engagement, index) => (
            <div key={engagement.id} className="bg-gray-50 p-6 rounded-lg border">
              <div className="flex justify-between items-start mb-4">
                <h5 className="text-md font-medium text-gray-900">Speaking Engagement {index + 1}</h5>
                <button
                  onClick={() => removeSpeakingEngagement(engagement.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Presentation Title *</label>
                  <input
                    type="text"
                    value={engagement.title}
                    onChange={(e) => updateSpeakingEngagement(engagement.id, 'title', e.target.value)}
                    placeholder="Presentation or talk title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event/Conference *</label>
                  <input
                    type="text"
                    value={engagement.event}
                    onChange={(e) => updateSpeakingEngagement(engagement.id, 'event', e.target.value)}
                    placeholder="Event or conference name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={engagement.type}
                    onChange={(e) => updateSpeakingEngagement(engagement.id, 'type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="conference">Conference</option>
                    <option value="workshop">Workshop</option>
                    <option value="webinar">Webinar</option>
                    <option value="panel">Panel Discussion</option>
                    <option value="keynote">Keynote</option>
                    <option value="meetup">Meetup</option>
                    <option value="podcast">Podcast</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={engagement.date}
                    onChange={(e) => updateSpeakingEngagement(engagement.id, 'date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={engagement.location || ''}
                    onChange={(e) => updateSpeakingEngagement(engagement.id, 'location', e.target.value)}
                    placeholder="City, Country or Virtual"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Audience Size</label>
                  <input
                    type="number"
                    min="1"
                    value={engagement.audienceSize || ''}
                    onChange={(e) => updateSpeakingEngagement(engagement.id, 'audienceSize', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="e.g., 100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <ReactQuill
                  value={engagement.description || ''}
                  onChange={(value) => updateSpeakingEngagement(engagement.id, 'description', value)}
                  placeholder="Brief description of the presentation topic and key points..."
                  modules={{
                    toolbar: [
                      ['bold', 'italic'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['clean']
                    ]
                  }}
                  className="bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Professional Memberships Section */}
      {activeSection === 'memberships' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-900">Professional Memberships</h4>
            <button
              onClick={addProfessionalMembership}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Membership
            </button>
          </div>

          {professionalMemberships.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No memberships yet. Add your professional associations and organizations.</p>
            </div>
          )}

          {professionalMemberships.map((membership, index) => (
            <div key={membership.id} className="bg-gray-50 p-6 rounded-lg border">
              <div className="flex justify-between items-start mb-4">
                <h5 className="text-md font-medium text-gray-900">Membership {index + 1}</h5>
                <button
                  onClick={() => removeProfessionalMembership(membership.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
                  <input
                    type="text"
                    value={membership.organization}
                    onChange={(e) => updateProfessionalMembership(membership.id, 'organization', e.target.value)}
                    placeholder="e.g., IEEE, ACM, PMI"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role/Position</label>
                  <input
                    type="text"
                    value={membership.role || ''}
                    onChange={(e) => updateProfessionalMembership(membership.id, 'role', e.target.value)}
                    placeholder="e.g., Member, Board Member, Committee Chair"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="month"
                    value={membership.startDate}
                    onChange={(e) => updateProfessionalMembership(membership.id, 'startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`current-membership-${membership.id}`}
                        checked={membership.current}
                        onChange={(e) => {
                          updateProfessionalMembership(membership.id, 'current', e.target.checked);
                          if (e.target.checked) {
                            updateProfessionalMembership(membership.id, 'endDate', '');
                          }
                        }}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`current-membership-${membership.id}`} className="ml-2 block text-sm text-gray-700">
                        Current member
                      </label>
                    </div>
                    {!membership.current && (
                      <input
                        type="month"
                        value={membership.endDate || ''}
                        onChange={(e) => updateProfessionalMembership(membership.id, 'endDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description & Activities</label>
                <ReactQuill
                  value={membership.description || ''}
                  onChange={(value) => updateProfessionalMembership(membership.id, 'description', value)}
                  placeholder="Describe your role, activities, or contributions..."
                  modules={{
                    toolbar: [
                      ['bold', 'italic'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['clean']
                    ]
                  }}
                  className="bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hobbies & Interests Section */}
      {activeSection === 'hobbies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-md font-medium text-gray-900">Hobbies & Interests</h4>
            <button
              onClick={addHobby}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Hobby
            </button>
          </div>

          {hobbies.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <HeartIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="mb-4">No hobbies yet. Show your personality and interests!</p>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Popular hobbies:</p>
                <div className="flex flex-wrap gap-1 justify-center max-w-md mx-auto">
                  {commonHobbies.slice(0, 8).map((hobby, idx) => (
                    <button
                      key={idx}
                      onClick={() => onHobbiesChange([...hobbies, hobby])}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800 hover:bg-pink-200 cursor-pointer"
                    >
                      + {hobby}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hobbies.map((hobby, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={hobby}
                  onChange={(e) => updateHobby(index, e.target.value)}
                  placeholder="e.g., Photography, Hiking"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  list="common-hobbies"
                />
                <button
                  onClick={() => removeHobby(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <datalist id="common-hobbies">
            {commonHobbies.map((hobby, idx) => (
              <option key={idx} value={hobby} />
            ))}
          </datalist>

          {hobbies.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-md">
              <h5 className="text-sm font-medium text-blue-800 mb-1">💡 Tips for Hobbies & Interests:</h5>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Keep it relevant to the job or industry when possible</li>
                <li>• Show personality traits that employers value (teamwork, creativity, leadership)</li>
                <li>• Avoid controversial topics (politics, religion)</li>
                <li>• Be genuine - only include hobbies you actually pursue</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}