import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QuoteService, QuoteData } from '../lib/quoteService';
import ThemeToggle from '../components/ThemeToggle';

export default function EditQuotePage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    moveDate: '',
    originAddress: '',
    destinationAddress: '',
    totalAmount: 0,
    leadSource: '',
    moveTimeConfirmed: '',
    priceOverride: false,
    overrideAmount: null as number | null,
    overrideReason: '',
    salesRepNotes: ''
  });

  useEffect(() => {
    loadQuote();
  }, [quoteId]);

  const loadQuote = async () => {
    if (!quoteId) return;
    
    try {
      const quoteData = await QuoteService.getQuote(quoteId);
      if (quoteData) {
        setQuote(quoteData);
        setFormData({
          customerName: quoteData.customerName || '',
          customerEmail: quoteData.customerEmail || '',
          customerPhone: quoteData.customerPhone || '',
          moveDate: quoteData.moveDate || '',
          originAddress: quoteData.originAddress || '',
          destinationAddress: quoteData.destinationAddress || '',
          totalAmount: quoteData.totalAmount || 0,
          leadSource: quoteData.leadSource || '',
          moveTimeConfirmed: quoteData.moveTimeConfirmed || '',
          priceOverride: quoteData.priceOverride || false,
          overrideAmount: quoteData.originalTotalAmount || null,
          overrideReason: quoteData.overrideReason || '',
          salesRepNotes: quoteData.salesRepNotes || ''
        });
      }
    } catch (error) {
      console.error('Error loading quote:', error);
      alert('Failed to load quote. You may not have permission to edit this quote.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!quoteId) return;
    
    setSaving(true);
    try {
      const updates: Partial<QuoteData> = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        moveDate: formData.moveDate,
        originAddress: formData.originAddress,
        destinationAddress: formData.destinationAddress,
        totalAmount: formData.priceOverride && formData.overrideAmount ? formData.overrideAmount : formData.totalAmount,
        leadSource: formData.leadSource,
        moveTimeConfirmed: formData.moveTimeConfirmed,
        priceOverride: formData.priceOverride,
        originalTotalAmount: formData.priceOverride ? formData.totalAmount : undefined,
        overrideAmount: formData.priceOverride ? formData.overrideAmount : undefined,
        overrideReason: formData.priceOverride ? formData.overrideReason : '',
        salesRepNotes: formData.salesRepNotes
      };

      await QuoteService.updateQuote(quoteId, updates);
      alert('Quote updated successfully!');
      navigate(`/quote/${quoteId}`);
    } catch (error: any) {
      console.error('Error updating quote:', error);
      alert(`Failed to update quote: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Quote Not Found</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/quote/${quoteId}`)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Edit Quote #{quoteId?.slice(0, 8)}</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Quote Details</h2>

          {/* Customer Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer Email *
                </label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer Phone *
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Move Date *
                </label>
                <input
                  type="date"
                  value={formData.moveDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, moveDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Addresses</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Origin Address *
                </label>
                <input
                  type="text"
                  value={formData.originAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, originAddress: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Destination Address *
                </label>
                <input
                  type="text"
                  value={formData.destinationAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, destinationAddress: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Pricing</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.priceOverride}
                  onChange={(e) => setFormData(prev => ({ ...prev, priceOverride: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price Override
                </label>
              </div>
              {formData.priceOverride && (
                <div className="ml-8 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Override Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.overrideAmount || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, overrideAmount: parseFloat(e.target.value) || null }))}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Override Reason
                    </label>
                    <textarea
                      value={formData.overrideReason}
                      onChange={(e) => setFormData(prev => ({ ...prev, overrideReason: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="Reason for price override..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CRM Fields */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">CRM Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lead Source
                </label>
                <select
                  value={formData.leadSource}
                  onChange={(e) => setFormData(prev => ({ ...prev, leadSource: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Select lead source...</option>
                  <option value="Google Search">Google Search</option>
                  <option value="Referral">Referral</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Direct Mail">Direct Mail</option>
                  <option value="Billboard">Billboard</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Move Time Confirmed
                </label>
                <input
                  type="time"
                  value={formData.moveTimeConfirmed}
                  onChange={(e) => setFormData(prev => ({ ...prev, moveTimeConfirmed: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Sales Rep Notes */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sales Rep Notes
            </label>
            <textarea
              value={formData.salesRepNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, salesRepNotes: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Add notes about this quote..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => navigate(`/quote/${quoteId}`)}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

