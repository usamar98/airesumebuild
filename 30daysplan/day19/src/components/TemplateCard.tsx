import React from 'react';
import { CheckCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

interface Template {
  id: string;
  name: string;
  description: string;
  font_family: string;
  font_size: number;
  primary_color: string;
  secondary_color: string;
  section_order: string[];
  bullet_style: string;
  spacing: string;
  category: string;
  style: string;
}

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}

export default function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const handleSelect = () => {
    onSelect(template.id);
  };

  const generatePreviewImage = () => {
    // Generate a placeholder preview based on template properties
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header section with primary color
    ctx.fillStyle = template.primary_color;
    ctx.fillRect(0, 0, canvas.width, 60);

    // Name placeholder (white text on colored background)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('John Doe', 10, 25);
    ctx.font = '10px Arial';
    ctx.fillText('Software Engineer', 10, 45);

    // Content sections
    ctx.fillStyle = template.secondary_color;
    ctx.font = 'bold 10px Arial';
    
    let yPos = 80;
    template.section_order.slice(0, 3).forEach((section, index) => {
      ctx.fillText(section.toUpperCase(), 10, yPos);
      
      // Section content lines
      ctx.fillStyle = '#666666';
      ctx.font = '8px Arial';
      for (let i = 0; i < 3; i++) {
        const lineY = yPos + 15 + (i * 12);
        if (lineY < canvas.height - 10) {
          const bullet = template.bullet_style === 'circle' ? '●' : template.bullet_style === 'square' ? '■' : '–';
          ctx.fillText(`${bullet} Sample content line ${i + 1}`, 15, lineY);
        }
      }
      
      yPos += 60;
      ctx.fillStyle = template.secondary_color;
      ctx.font = 'bold 10px Arial';
    });

    return canvas.toDataURL();
  };

  const previewImage = generatePreviewImage();

  return (
    <div 
      className={`relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:scale-105'
      }`}
      onClick={handleSelect}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10">
          <CheckCircleIconSolid className="h-6 w-6 text-blue-500" />
        </div>
      )}

      {/* Template Preview */}
      <div className="relative overflow-hidden rounded-t-lg">
        <img 
          src={previewImage} 
          alt={`${template.name} preview`}
          className="w-full h-48 object-cover bg-gray-100"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-white rounded-full p-2">
              <EyeIcon className="h-5 w-5 text-gray-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm truncate">
            {template.name}
          </h3>
          <span 
            className="inline-block w-3 h-3 rounded-full ml-2 flex-shrink-0"
            style={{ backgroundColor: template.primary_color }}
            title={`Primary color: ${template.primary_color}`}
          />
        </div>
        
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {template.description}
        </p>

        {/* Template Details */}
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Font:</span>
            <span className="font-medium">{template.font_family}</span>
          </div>
          <div className="flex justify-between">
            <span>Style:</span>
            <span className="font-medium capitalize">{template.style}</span>
          </div>
          <div className="flex justify-between">
            <span>Category:</span>
            <span className="font-medium capitalize">{template.category}</span>
          </div>
        </div>

        {/* Section Order Preview */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Section Order:</p>
          <div className="flex flex-wrap gap-1">
            {template.section_order.slice(0, 3).map((section, index) => (
              <span 
                key={index}
                className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
              >
                {section}
              </span>
            ))}
            {template.section_order.length > 3 && (
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                +{template.section_order.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Select Button */}
        <button
          className={`w-full mt-4 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isSelected
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleSelect();
          }}
        >
          {isSelected ? (
            <span className="flex items-center justify-center">
              <CheckCircleIconSolid className="h-4 w-4 mr-1" />
              Selected
            </span>
          ) : (
            'Select Template'
          )}
        </button>
      </div>
    </div>
  );
}