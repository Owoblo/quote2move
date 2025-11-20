import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ThemeToggle from '../components/ThemeToggle';
import MovSenseLogo from '../components/MovSenseLogo';

export default function CompanySignupPage() {
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [truckCount, setTruckCount] = useState('');
  const [serviceArea, setServiceArea] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    const requiredFields = { companyName, adminName, adminEmail, adminPassword };
    if (Object.values(requiredFields).some(v => !v)) {
      setError('Please fill out all required fields.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Invoke the edge function to handle the entire signup process
      const { error: functionError } = await supabase.functions.invoke('signup-company', {
        body: {
          companyName,
          adminName,
          adminEmail,
          adminPassword,
          adminPhone,
          companyAddress,
          truckCount: parseInt(truckCount, 10) || null,
          serviceArea,
        }
      });
      
      if (functionError) throw functionError;

      // 2. Sign in the user to create a session
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });

      if (signInError) throw signInError;

      // 3. Navigate to the dashboard
      navigate('/dashboard');

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-highlight/5 dark:from-primary dark:via-primary dark:to-primary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center relative">
          <div className="absolute top-0 right-0"><ThemeToggle /></div>
          <Link to="/" className="flex items-center justify-center mb-8"><MovSenseLogo size="lg" /></Link>
          <h2 className="text-3xl font-bold text-[#111827] mb-2">Create your Company Account</h2>
          <p className="text-[#374151]">Register your moving company to get started.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className={'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'}>
                <p className={'text-sm text-red-800 dark:text-red-200'}>{error}</p>
              </div>
            )}
            
            <input name="companyName" type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company Name" className="w-full input-field" />
            <input name="adminName" type="text" required value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Your Full Name" className="w-full input-field" />
            <input name="adminEmail" type="email" required value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="Your Email (for login)" className="w-full input-field" />
            <input name="adminPassword" type="password" required value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Create a Password" className="w-full input-field" />
            <input name="adminPhone" type="tel" value={adminPhone} onChange={e => setAdminPhone(e.target.value)} placeholder="Company Phone" className="w-full input-field" />
            <input name="companyAddress" type="text" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="Company Address" className="w-full input-field" />
            <input name="truckCount" type="number" value={truckCount} onChange={e => setTruckCount(e.target.value)} placeholder="Number of Trucks" className="w-full input-field" />
            <input name="serviceArea" type="text" value={serviceArea} onChange={e => setServiceArea(e.target.value)} placeholder="Primary Service Area (e.g., Austin, TX)" className="w-full input-field" />

            <button type="submit" disabled={isLoading} className="w-full btn btn-primary py-3">
              {isLoading ? 'Creating Account...' : 'Create Company Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#374151]">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-accent hover:text-accent-dark">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
