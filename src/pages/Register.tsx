/**
 * Registration Page Component
 * Handles user registration with form validation
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Briefcase, Building2, Users, Sparkles } from 'lucide-react';
import { isFeatureEnabled } from '../config/featureFlags';
import { createApiUrl } from '../config/api';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userRole: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const { register, isAuthenticated } = useSupabaseAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Calculate password strength
  useEffect(() => {
    const password = formData.password;
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
    setSuccess(''); // Clear success when user types
  };

  const validateForm = () => {
    const { name, email, password, confirmPassword, userRole } = formData;

    if (!name.trim()) {
      return 'Name is required';
    }

    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters long';
    }

    if (!email) {
      return 'Email is required';
    }

    if (!email.includes('@') || !email.includes('.')) {
      return 'Please enter a valid email address';
    }

    if (!userRole) {
      return 'Please select your role';
    }

    if (!password) {
      return 'Password is required';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Form submission started');
    console.log('📋 Form data:', formData);
    
    // First, validate the form using the validateForm function
    const validationError = validateForm();
    console.log('🔍 Validation result:', validationError);
    
    if (validationError) {
      console.log('❌ Validation failed:', validationError);
      setError(validationError);
      return;
    }

    if (passwordStrength < 3) {
      console.log('❌ Password strength insufficient:', passwordStrength);
      setError('Please choose a stronger password');
      return;
    }

    console.log('✅ Frontend validation passed');
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Check if user already exists before attempting registration
      console.log('🔍 Checking if user already exists...');
      try {
        const checkUserUrl = '/api/check-user-exists';
        console.log('🔗 Calling check-user-exists at:', checkUserUrl);
        const checkResponse = await fetch(checkUserUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: formData.email }),
        });

        if (checkResponse.ok) {
          const checkResult = await checkResponse.json();
          console.log('📊 User existence check result:', checkResult);
          
          if (checkResult.exists) {
            console.log('🚫 User already exists');
            setError(checkResult.message || 'A user with this email already exists. Please try logging in instead.');
            setIsSubmitting(false);
            return;
          }
          
          console.log('✅ No existing user found, proceeding with registration');
        } else {
          console.warn('⚠️ Could not check existing users, proceeding with registration');
        }
      } catch (checkError) {
        console.warn('⚠️ Error checking existing users:', checkError);
        // Continue with registration if backend check fails (fallback behavior)
      }

      console.log('🔄 Calling register function...');
      const result = await register(formData.name, formData.email, formData.password, formData.userRole);
      console.log('📊 Registration result:', result);
      
      if (result.success) {
        console.log('✅ Registration successful');
        setSuccess(result.message || 'Registration successful! Please check your email to verify your account.');
        
        // Clear form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          userRole: ''
        });
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        console.log('❌ Registration failed:', result.error);
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('💥 Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'from-red-500 to-red-600';
    if (passwordStrength <= 3) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-emerald-600';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-lg w-full space-y-8 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10 transform transition-all duration-300 hover:shadow-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-4 shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-3">
              Create Account
            </h2>
            <p className="text-gray-600 text-lg">
              Join our community and start building amazing resumes
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50 rounded-2xl flex items-center space-x-3 shadow-sm animate-in slide-in-from-top-2 duration-300">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl flex items-center space-x-3 shadow-sm animate-in slide-in-from-top-2 duration-300">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-green-700 text-sm font-medium">{success}</span>
            </div>
          )}

          {/* Registration Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name Field */}
            <div className="relative group">
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  className="peer w-full px-4 py-4 pl-12 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder-transparent"
                  placeholder="Full Name"
                />
                <label
                  htmlFor="name"
                  className={`absolute left-12 transition-all duration-300 pointer-events-none ${
                    formData.name || focusedField === 'name'
                      ? '-top-2 left-4 text-xs text-blue-600 bg-white px-2 rounded-full'
                      : 'top-4 text-gray-500'
                  }`}
                >
                  Full Name
                </label>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 transition-colors duration-300 ${
                    focusedField === 'name' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="relative group">
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="peer w-full px-4 py-4 pl-12 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder-transparent"
                  placeholder="Email Address"
                />
                <label
                  htmlFor="email"
                  className={`absolute left-12 transition-all duration-300 pointer-events-none ${
                    formData.email || focusedField === 'email'
                      ? '-top-2 left-4 text-xs text-blue-600 bg-white px-2 rounded-full'
                      : 'top-4 text-gray-500'
                  }`}
                >
                  Email Address
                </label>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 transition-colors duration-300 ${
                    focusedField === 'email' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                </div>
              </div>
            </div>

            {/* Role Selection Field */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Choose your role
              </label>
              <div className="grid grid-cols-1 gap-3">
                {/* Job Seeker Option */}
                <label className={`relative flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                  formData.userRole === 'job_seeker' 
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg shadow-blue-500/20' 
                    : 'border-gray-200 hover:border-gray-300 bg-white/50'
                }`}>
                  <input
                    type="radio"
                    name="userRole"
                    value="job_seeker"
                    checked={formData.userRole === 'job_seeker'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${
                      formData.userRole === 'job_seeker' 
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg' 
                        : 'bg-gray-100'
                    }`}>
                      <Briefcase className={`h-6 w-6 ${
                        formData.userRole === 'job_seeker' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg">Job Seeker</div>
                      <div className="text-sm text-gray-600">Looking for job opportunities</div>
                    </div>
                  </div>
                  {formData.userRole === 'job_seeker' && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </label>

                {/* Employer Option */}
                <label className={`relative flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] opacity-60 border-gray-200 bg-white/50`}>
                  <input
                    type="radio"
                    name="userRole"
                    value="employer"
                    checked={false}
                    onChange={() => {}}
                    className="sr-only"
                    disabled={true}
                  />
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="p-3 rounded-xl transition-all duration-300 bg-gray-100">
                      <Building2 className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg">Employer</div>
                      <div className="text-sm text-gray-600">Hiring talent for my company</div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <div className="text-center px-4">
                      <h3 className="font-semibold text-gray-700 text-sm mb-1">Coming Soon</h3>
                      <p className="text-gray-500 text-xs">Employer features are under development</p>
                    </div>
                  </div>
                </label>

                {/* Both Option */}
                <label className={`relative flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] opacity-60 border-gray-200 bg-white/50`}>
                  <input
                    type="radio"
                    name="userRole"
                    value="both"
                    checked={false}
                    onChange={() => {}}
                    className="sr-only"
                    disabled={true}
                  />
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="p-3 rounded-xl transition-all duration-300 bg-gray-100">
                      <Users className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg">Both</div>
                      <div className="text-sm text-gray-600">Looking for work & hiring talent</div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <div className="text-center px-4">
                      <h3 className="font-semibold text-gray-700 text-sm mb-1">Coming Soon</h3>
                      <p className="text-gray-500 text-xs">Dual role features are under development</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Password Field */}
            <div className="relative group">
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="peer w-full px-4 py-4 pl-12 pr-12 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder-transparent"
                  placeholder="Password"
                />
                <label
                  htmlFor="password"
                  className={`absolute left-12 transition-all duration-300 pointer-events-none ${
                    formData.password || focusedField === 'password'
                      ? '-top-2 left-4 text-xs text-blue-600 bg-white px-2 rounded-full'
                      : 'top-4 text-gray-500'
                  }`}
                >
                  Password
                </label>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 transition-colors duration-300 ${
                    focusedField === 'password' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                </div>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 bg-gradient-to-r ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      passwordStrength <= 2 ? 'text-red-700 bg-red-100' : 
                      passwordStrength <= 3 ? 'text-yellow-700 bg-yellow-100' : 'text-green-700 bg-green-100'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="relative group">
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  className="peer w-full px-4 py-4 pl-12 pr-12 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder-transparent"
                  placeholder="Confirm Password"
                />
                <label
                  htmlFor="confirmPassword"
                  className={`absolute left-12 transition-all duration-300 pointer-events-none ${
                    formData.confirmPassword || focusedField === 'confirmPassword'
                      ? '-top-2 left-4 text-xs text-blue-600 bg-white px-2 rounded-full'
                      : 'top-4 text-gray-500'
                  }`}
                >
                  Confirm Password
                </label>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 transition-colors duration-300 ${
                    focusedField === 'confirmPassword' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                </div>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="mt-3 flex items-center space-x-2">
                  {formData.password === formData.confirmPassword ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-3 w-3" />
                      </div>
                      <span className="text-sm font-medium">Passwords match</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-red-600">
                      <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-3 w-3" />
                      </div>
                      <span className="text-sm font-medium">Passwords do not match</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Creating your account...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>Create Account</span>
                  <Sparkles className="h-5 w-5" />
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-300 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;