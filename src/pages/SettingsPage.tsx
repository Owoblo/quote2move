import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { supabase } from '../lib/supabase';

interface QuoteSettings {
  customLogoUrl: string;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  includeMLSPhotos: boolean;
}

const SETTINGS_KEY = 'movsense_quote_settings';

export default function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'quote' | 'email' | 'company' | 'upsells'>('quote');
  const [settings, setSettings] = useState<QuoteSettings>({
    customLogoUrl: '',
    brandColors: {
      primary: '',
      secondary: '',
      accent: ''
    },
    includeMLSPhotos: true
  });
  const [saved, setSaved] = useState(false);
  const [emailSettings, setEmailSettings] = useState({
    fromEmail: '',
    fromName: '',
    replyTo: ''
  });
  const [loadingEmailSettings, setLoadingEmailSettings] = useState(true);
  const [savingEmailSettings, setSavingEmailSettings] = useState(false);
  const [companySettings, setCompanySettings] = useState({
    companyName: 'Saturn Star Movers',
    companyLogoUrl: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    forwardingEmail: ''
  });
  const [assignedEmails, setAssignedEmails] = useState<{
    fromEmail: string;
    replyToEmail: string;
  } | null>(null);
  const [loadingCompanySettings, setLoadingCompanySettings] = useState(true);
  const [savingCompanySettings, setSavingCompanySettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    // Load saved quote settings
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }

    // Load email settings from database
    loadEmailSettings();
    loadCompanySettings();
  }, []);

  const loadEmailSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_email_settings')
        .select('from_email, from_name, reply_to')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error loading email settings:', error);
      } else if (data) {
        setEmailSettings({
          fromEmail: data.from_email || '',
          fromName: data.from_name || '',
          replyTo: data.reply_to || ''
        });
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    } finally {
      setLoadingEmailSettings(false);
    }
  };

  const loadCompanySettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('company_settings')
        .select('company_name, company_logo_url, company_address, company_phone, company_email, company_website, forwarding_email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading company settings:', error);
      } else if (data) {
        setCompanySettings({
          companyName: data.company_name || 'Saturn Star Movers',
          companyLogoUrl: data.company_logo_url || '',
          companyAddress: data.company_address || '',
          companyPhone: data.company_phone || '',
          companyEmail: data.company_email || '',
          companyWebsite: data.company_website || '',
          forwardingEmail: data.forwarding_email || ''
        });
      }

      // Generate assigned email addresses
      if (user) {
        const userIdPrefix = user.id.substring(0, 8);
        const verifiedDomain = 'movsense.com'; // This should match VERIFIED_EMAIL_DOMAIN
        setAssignedEmails({
          fromEmail: `quotes-${userIdPrefix}@${verifiedDomain}`,
          replyToEmail: `replies-${userIdPrefix}@${verifiedDomain}`
        });
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    } finally {
      setLoadingCompanySettings(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to upload logo');
        return;
      }

      // Create storage bucket if it doesn't exist (this will be handled by Supabase)
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = fileName; // Store directly in user's folder, not in company-logos subfolder

      // Upload file to Supabase Storage
      // The RLS policy checks that the first folder is the user's ID
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // If bucket doesn't exist, try to create it or use a different approach
        if (uploadError.message.includes('bucket') || uploadError.message.includes('not found')) {
          // Fallback: use a public URL from a data URL or allow manual URL entry
          alert('Storage bucket not configured. Please enter a logo URL manually or contact support to set up storage.');
          return;
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      // Update company settings with the new logo URL
      setCompanySettings(prev => ({
        ...prev,
        companyLogoUrl: publicUrl
      }));

      // Save immediately
      await handleSaveCompanySettings(publicUrl);
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      alert(`Failed to upload logo: ${error.message || 'Unknown error'}`);
    } finally {
      setUploadingLogo(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleSaveCompanySettings = async (logoUrl?: string) => {
    setSavingCompanySettings(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to save company settings');
        return;
      }

      const { error } = await supabase
        .from('company_settings')
        .upsert({
          user_id: user.id,
          company_name: companySettings.companyName || 'Saturn Star Movers',
          company_logo_url: companySettings.companyLogoUrl || null,
          company_address: companySettings.companyAddress || null,
          company_phone: companySettings.companyPhone || null,
          company_email: companySettings.companyEmail || null,
          company_website: companySettings.companyWebsite || null,
          forwarding_email: companySettings.forwardingEmail || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error('Error saving company settings:', error);
      alert(`Failed to save company settings: ${error.message}`);
    } finally {
      setSavingCompanySettings(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    setSavingEmailSettings(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to save email settings');
        return;
      }

      const { error } = await supabase
        .from('user_email_settings')
        .upsert({
          user_id: user.id,
          from_email: emailSettings.fromEmail || 'MovSense <quotes@movsense.com>',
          from_name: emailSettings.fromName || 'MovSense',
          reply_to: emailSettings.replyTo || 'support@movsense.com',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error('Error saving email settings:', error);
      alert(`Failed to save email settings: ${error.message}`);
    } finally {
      setSavingEmailSettings(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent', value: string) => {
    setSettings(prev => ({
      ...prev,
      brandColors: {
        ...prev.brandColors,
        [colorType]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Settings</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Quote Customization</h2>

          {/* Logo URL */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Logo URL
            </label>
            <input
              type="url"
              value={settings.customLogoUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, customLogoUrl: e.target.value }))}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Enter a URL to your company logo. This will appear on all quotes.
            </p>
            {settings.customLogoUrl && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                <img
                  src={settings.customLogoUrl}
                  alt="Logo preview"
                  className="h-16 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Brand Colors */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Brand Colors
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Primary Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.brandColors.primary || '#3B82F6'}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.brandColors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Secondary Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.brandColors.secondary || '#8B5CF6'}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.brandColors.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    placeholder="#8B5CF6"
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Accent Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.brandColors.accent || '#10B981'}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.brandColors.accent}
                    onChange={(e) => handleColorChange('accent', e.target.value)}
                    placeholder="#10B981"
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              These colors will be used in quote PDFs and emails.
            </p>
          </div>

          {/* Include MLS Photos */}
          <div className="mb-8">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.includeMLSPhotos}
                onChange={(e) => setSettings(prev => ({ ...prev, includeMLSPhotos: e.target.checked }))}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Include MLS Photos in Quotes
              </span>
            </label>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 ml-8">
              When enabled, property photos from MLS listings will be included in the quote PDF.
            </p>
          </div>
        </div>

        {/* Email Settings Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Email Settings</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Configure how your quote emails appear to customers. These settings apply to all emails sent from your account.
          </p>

          {/* Assigned Email Addresses */}
          {assignedEmails && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Your Assigned Email Addresses</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Sending Address:</span>
                  <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">{assignedEmails.fromEmail}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Reply Address:</span>
                  <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">{assignedEmails.replyToEmail}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Replies to your quotes will be sent to {assignedEmails.replyToEmail} and forwarded to your company email.
                </p>
              </div>
            </div>
          )}

          {loadingEmailSettings ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* From Email */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Email Address
                </label>
                <input
                  type="email"
                  value={emailSettings.fromEmail}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                  placeholder="Your Company <noreply@yourcompany.com>"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Format: "Company Name &lt;email@domain.com&gt;" or just "email@domain.com"
                </p>
              </div>

              {/* From Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Name (Display Name)
                </label>
                <input
                  type="text"
                  value={emailSettings.fromName}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                  placeholder="Your Company Name"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  The name that appears in the "From" field of your emails.
                </p>
              </div>

              {/* Reply To */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reply-To Email
                </label>
                <input
                  type="email"
                  value={emailSettings.replyTo}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, replyTo: e.target.value }))}
                  placeholder="support@yourcompany.com"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Where customer replies will be sent.
                </p>
              </div>

              {/* Save Email Settings Button */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <div>
                  {saved && (
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Email settings saved!</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSaveEmailSettings}
                  disabled={savingEmailSettings}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  {savingEmailSettings ? 'Saving...' : 'Save Email Settings'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Company Settings Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Company Information</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Configure your company details. This will appear in quotes, emails, and customer communications.
          </p>

          {loadingCompanySettings ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Company Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={companySettings.companyName}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Saturn Star Movers"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  This will replace "MovSense" in quotes and emails.
                </p>
              </div>

              {/* Company Logo Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Logo
                </label>
                <div className="space-y-4">
                  {/* Upload Button */}
                  <div className="flex items-center space-x-4">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                        id="logo-upload"
                      />
                      <div className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-center">
                        {uploadingLogo ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center space-y-2">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Click to upload logo
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG up to 5MB</span>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Manual URL Input (Alternative) */}
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Or enter logo URL:</label>
                    <input
                      type="url"
                      value={companySettings.companyLogoUrl}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, companyLogoUrl: e.target.value }))}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>

                  {/* Logo Preview */}
                  {companySettings.companyLogoUrl && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 inline-block">
                        <img
                          src={companySettings.companyLogoUrl}
                          alt="Company logo"
                          className="h-16 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Phone
                  </label>
                  <input
                    type="tel"
                    value={companySettings.companyPhone}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, companyPhone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Email
                  </label>
                  <input
                    type="email"
                    value={companySettings.companyEmail}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, companyEmail: e.target.value }))}
                    placeholder="info@yourcompany.com"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Website
                  </label>
                  <input
                    type="url"
                    value={companySettings.companyWebsite}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, companyWebsite: e.target.value }))}
                    placeholder="https://yourcompany.com"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Address
                  </label>
                  <input
                    type="text"
                    value={companySettings.companyAddress}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, companyAddress: e.target.value }))}
                    placeholder="123 Main St, City, State ZIP"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Email Forwarding */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Forward Replies To <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={companySettings.forwardingEmail}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, forwardingEmail: e.target.value }))}
                  placeholder="your-company-email@example.com"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  When customers reply to your quotes, emails will be forwarded here. If not set, replies will forward to your Company Email above.
                </p>
              </div>

              {/* Save Company Settings Button */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <div>
                  {saved && (
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Company settings saved!</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleSaveCompanySettings()}
                  disabled={savingCompanySettings || uploadingLogo}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  {savingCompanySettings ? 'Saving...' : 'Save Company Settings'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Quote Customization Save Button */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 mt-8">
          <div className="flex items-center justify-between pt-6">
            <div>
              {saved && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Settings saved!</span>
                </p>
              )}
            </div>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors duration-200"
            >
              Save Quote Customization
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper function to get settings
export function getQuoteSettings(): QuoteSettings {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  return {
    customLogoUrl: '',
    brandColors: {
      primary: '',
      secondary: '',
      accent: ''
    },
    includeMLSPhotos: true
  };
}

