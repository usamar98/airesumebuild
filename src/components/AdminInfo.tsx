/**
 * Admin Information Component
 * Displays default admin credentials for easy access
 */
import { useState } from 'react';
import { Eye, EyeOff, Shield, Copy, Check } from 'lucide-react';
import { getDefaultAdminCredentials } from '../utils/adminSetup';

interface AdminInfoProps {
  className?: string;
}

export default function AdminInfo({ className = '' }: AdminInfoProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const adminCredentials = getDefaultAdminCredentials();

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-800">Admin Access</h3>
      </div>
      
      <p className="text-blue-700 text-sm mb-4">
        Use these credentials to access the admin dashboard:
      </p>
      
      <div className="space-y-3">
        {/* Email Field */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-blue-700 w-20">Email:</label>
          <div className="flex-1 flex items-center gap-2">
            <code className="bg-white px-3 py-1 rounded border text-sm font-mono flex-1">
              {adminCredentials.email}
            </code>
            <button
              onClick={() => copyToClipboard(adminCredentials.email, 'email')}
              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
              title="Copy email"
            >
              {copiedField === 'email' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        
        {/* Password Field */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-blue-700 w-20">Password:</label>
          <div className="flex-1 flex items-center gap-2">
            <code className="bg-white px-3 py-1 rounded border text-sm font-mono flex-1">
              {showPassword ? adminCredentials.password : '••••••••••••'}
            </code>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={() => copyToClipboard(adminCredentials.password, 'password')}
              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
              title="Copy password"
            >
              {copiedField === 'password' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-200">
        <p className="text-xs text-blue-600">
          <strong>Note:</strong> These are the default admin credentials. After logging in, 
          you can access the admin dashboard at <code>/admin</code> to manage users and view analytics.
        </p>
      </div>
    </div>
  );
}