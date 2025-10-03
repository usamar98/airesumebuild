/**
 * Coming Soon Component
 * Reusable overlay/banner for features under development
 */
import React from 'react';
import { ClockIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

interface ComingSoonProps {
  title?: string;
  description?: string;
  variant?: 'overlay' | 'banner' | 'card';
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  title = "Coming Soon",
  description = "This feature is currently under development and will be available soon.",
  variant = 'overlay',
  size = 'medium',
  showIcon = true,
  className = '',
  children
}) => {
  const sizeClasses = {
    small: 'p-4 text-sm',
    medium: 'p-6 text-base',
    large: 'p-8 text-lg'
  };

  const iconSizes = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  if (variant === 'overlay') {
    return (
      <div className={`absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
        <div className={`text-center max-w-md mx-auto ${sizeClasses[size]}`}>
          {showIcon && (
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <RocketLaunchIcon className={`${iconSizes[size]} text-blue-600`} />
              </div>
            </div>
          )}
          <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{description}</p>
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <ClockIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Stay tuned!</span>
          </div>
          {children}
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg ${sizeClasses[size]} ${className}`}>
        <div className="flex items-center gap-3">
          {showIcon && (
            <div className="p-2 bg-blue-100 rounded-lg">
              <RocketLaunchIcon className="h-6 w-6 text-blue-600" />
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{title}</h4>
            <p className="text-gray-600 text-sm mt-1">{description}</p>
          </div>
          <div className="flex items-center gap-1 text-blue-600">
            <ClockIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Coming Soon</span>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // Card variant
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${sizeClasses[size]} text-center ${className}`}>
      {showIcon && (
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <RocketLaunchIcon className={`${iconSizes[size]} text-blue-600`} />
          </div>
        </div>
      )}
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="flex items-center justify-center gap-2 text-blue-600">
        <ClockIcon className="h-4 w-4" />
        <span className="text-sm font-medium">Stay tuned for updates!</span>
      </div>
      {children}
    </div>
  );
};

export default ComingSoon;