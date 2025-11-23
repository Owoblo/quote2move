import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ThemeToggle from '../components/ThemeToggle';
import MovSenseLogo from '../components/MovSenseLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const navigate = useNavigate();

  // Email validation
  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  };

  // Input sanitization to prevent XSS
  const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  };

  // Password strength checker
  const checkPasswordStrength = (pwd: string): 'weak' | 'medium' | 'strong' => {
    if (pwd.length < 8) return 'weak';

    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*]/.test(pwd);

    const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

    if (score >= 3 && pwd.length >= 12) return 'strong';
    if (score >= 2 && pwd.length >= 8) return 'medium';
    return 'weak';
  };

  // Redirect if already logged in
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  // Update password strength when password changes
  React.useEffect(() => {
    if (isSignUp && password) {
      setPasswordStrength(checkPasswordStrength(password));
    }
  }, [password, isSignUp]);

  // Password reset handler
  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setError('success:Check your email! We sent you a password reset link.');
      setShowPasswordReset(false);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // DEBUG: Log the attempt
      console.log('Attempting auth action:', isSignUp ? 'Sign Up' : 'Sign In');
      
      // Check environment variables (safely)
      const hasUrl = !!process.env.REACT_APP_SOLD2MOVE_URL || !!process.env.REACT_APP_SUPABASE_URL;
      const hasKey = !!process.env.REACT_APP_SOLD2MOVE_ANON_KEY || !!process.env.REACT_APP_SUPABASE_ANON_KEY;
      console.log('Auth Environment Check:', { hasUrl, hasKey });

      // Validate and sanitize email
      const trimmedEmail = email.trim().toLowerCase();
      if (!validateEmail(trimmedEmail)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      if (isSignUp) {
        // Validate required fields
        if (!fullName.trim() || !companyName.trim() || !companyPhone.trim()) {
          setError('Please complete your name, business name, and phone number.');
          setIsLoading(false);
          return;
        }

        // Sanitize inputs to prevent XSS
        const sanitizedFullName = sanitizeInput(fullName);
        const sanitizedCompanyName = sanitizeInput(companyName);
        const cleanedPhone = companyPhone.trim();

        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: sanitizedFullName,
              company_name: sanitizedCompanyName,
              company_phone: cleanedPhone,
              company_size: companySize.trim(),
              referral_source: referralSource.trim(),
            },
          },
        });
        if (error) throw error;

        // Fix race condition: Only proceed if company_settings insert succeeds
        if (data.user && data.session) {
          try {
            const { error: settingsError } = await supabase
              .from('company_settings')
              .insert({
                user_id: data.user.id,
                company_name: sanitizedCompanyName,
                company_email: trimmedEmail,
                company_phone: cleanedPhone,
              });

            if (settingsError) {
              throw new Error('Failed to initialize company settings');
            }

            // Success! Now safe to navigate
            navigate('/dashboard');
          } catch (settingsError: any) {
            // Show error to user and don't navigate
            setError('Account created but settings failed. Please contact support.');
            setIsLoading(false);
            return;
          }
        }

        // Check if email confirmation is required
        if (data.user && !data.session) {
          // Email confirmation is required
          setError('success:Check your email for the confirmation link! We sent you a verification email.');
        }
      } else {
        console.log('Starting signInWithPassword...');
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        
        if (error) {
          console.error('Sign In Error:', error);
          throw error;
        }
        
        console.log('Sign in successful, navigating...');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Auth Handler Error:', error);
      // Handle common errors with user-friendly messages
      let errorMessage = error.message;
      
      if (errorMessage.includes('Invalid value')) {
        errorMessage = 'Configuration Error: Invalid API Key format. Please contact support.';
        console.error('CRITICAL: Invalid Value error usually means headers are malformed.');
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link to verify your account.';
      } else if (error.message.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (error.message.includes('Password')) {
        errorMessage = 'Password must be at least 6 characters long.';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-highlight/5 dark:from-primary dark:via-primary dark:to-primary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center relative">
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <Link to="/" className="flex items-center justify-center mb-8">
            <MovSenseLogo size="lg" />
          </Link>
          <h2 className="text-3xl font-bold text-[#111827] mb-2">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-[#374151]">
            {isSignUp ? 'Start your free trial today' : 'Sign in to your account'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className={`${error.startsWith('success:') 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'} rounded-lg p-4`}>
                <div className="flex">
                  {error.startsWith('success:') ? (
                    <svg className="w-5 h-5 text-green-400 dark:text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-400 dark:text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <div className="ml-3">
                    <p className={`text-sm ${error.startsWith('success:') 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-red-800 dark:text-red-200'}`}>
                      {error.replace('success:', '')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#374151] mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-[#111827] placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#374151] mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-[#111827] placeholder-gray-400 dark:placeholder-gray-500"
                placeholder={isSignUp ? 'Create a password (min. 8 characters)' : 'Enter your password'}
              />
              {isSignUp && password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 flex-1 rounded transition-colors ${
                      passwordStrength === 'weak' ? 'bg-red-500' :
                      passwordStrength === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}></div>
                    <span className={`text-xs font-medium ${
                      passwordStrength === 'weak' ? 'text-red-600 dark:text-red-400' :
                      passwordStrength === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {passwordStrength === 'weak' ? 'Weak' :
                       passwordStrength === 'medium' ? 'Medium' :
                       'Strong'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Use 8+ characters with uppercase, lowercase, numbers, and symbols
                  </p>
                </div>
              )}
            </div>

            {isSignUp && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-[#374151] mb-2">
                    Your name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-[#111827] placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-[#374151] mb-2">
                    Moving company name
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-[#111827] placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="MovSense Logistics"
                  />
                </div>

                <div>
                  <label htmlFor="companyPhone" className="block text-sm font-medium text-[#374151] mb-2">
                    Company phone number
                  </label>
                  <input
                    id="companyPhone"
                    name="companyPhone"
                    type="tel"
                    required
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-[#111827] placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="companySize" className="block text-sm font-medium text-[#374151] mb-2">
                      Team size (optional)
                    </label>
                    <select
                      id="companySize"
                      name="companySize"
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-[#111827]"
                    >
                      <option value="">Select...</option>
                      <option value="solo">Just me</option>
                      <option value="2-5">2 - 5 movers</option>
                      <option value="6-15">6 - 15 movers</option>
                      <option value="16-30">16 - 30 movers</option>
                      <option value="30+">30+ movers</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="referralSource" className="block text-sm font-medium text-[#374151] mb-2">
                      How did you hear about us? (optional)
                    </label>
                    <select
                      id="referralSource"
                      name="referralSource"
                      value={referralSource}
                      onChange={(e) => setReferralSource(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-[#111827]"
                    >
                      <option value="">Select...</option>
                      <option value="friend">Friend or colleague</option>
                      <option value="social">Social media</option>
                      <option value="search">Google search</option>
                      <option value="conference">Conference / event</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {!isSignUp && (
              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={isLoading}
                    className="font-medium text-accent dark:text-accent-light hover:text-accent-dark dark:hover:text-accent transition-colors disabled:opacity-50"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent hover:bg-accent-dark disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </div>
              ) : (
                isSignUp ? 'Create account' : 'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#374151]">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setEmail('');
                  setPassword('');
                  setFullName('');
                  setCompanyName('');
                  setCompanyPhone('');
                  setCompanySize('');
                  setReferralSource('');
                }}
                className="font-medium text-accent dark:text-accent-light hover:text-accent-dark dark:hover:text-accent transition-colors"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link to="/" className="text-sm text-[#374151] hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
