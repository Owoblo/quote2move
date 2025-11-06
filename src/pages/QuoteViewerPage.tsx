import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { QuoteService, QuoteData } from '../lib/quoteService';
import { EmailBackendService } from '../lib/emailBackendService';

export default function QuoteViewerPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [question, setQuestion] = useState('');
  const [, setQuestions] = useState<string[]>([]);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [customDeclineReason, setCustomDeclineReason] = useState('');
  const [isSalesRep, setIsSalesRep] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false); // Track if we've checked permissions
  const [declineActionBy, setDeclineActionBy] = useState<'customer' | 'sales_rep'>('customer');
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [companySettings, setCompanySettings] = useState<{
    companyName: string;
    companyLogoUrl: string | null;
    companyPhone: string | null;
    companyEmail: string | null;
    companyWebsite: string | null;
  } | null>(null);

  useEffect(() => {
    fetchQuote();
    checkUserRole();
    loadCompanySettings();
  }, [quoteId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Always check edit permission when quote loads or changes
    // This ensures canEdit is properly set for both authenticated and unauthenticated users
    checkEditPermission();
  }, [quote]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCompanySettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('company_settings')
        .select('company_name, company_logo_url, company_phone, company_email, company_website')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading company settings:', error);
      } else if (data) {
        setCompanySettings({
          companyName: data.company_name || 'Saturn Star Movers',
          companyLogoUrl: data.company_logo_url,
          companyPhone: data.company_phone,
          companyEmail: data.company_email,
          companyWebsite: data.company_website
        });
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
  };

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsSalesRep(!!user); // If user is authenticated, they're a sales rep
    } catch (error) {
      setIsSalesRep(false);
    }
  };

  const checkEditPermission = async () => {
    // Always start with false - only set to true if user is authenticated AND owns the quote
    setCanEdit(false);
    setPermissionChecked(false);
    
    if (!quote || !quote.id) {
      setPermissionChecked(true);
      return;
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      // If user is not authenticated, canEdit stays false
      if (authError || !user) {
        setCanEdit(false);
        setPermissionChecked(true);
        return;
      }

      // Check if quote belongs to the authenticated user
      // Use maybeSingle() to avoid errors if quote doesn't exist or RLS blocks access
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('user_id')
        .eq('id', quote.id)
        .maybeSingle();

      // If there's an error, quote doesn't exist, or user doesn't have access, canEdit stays false
      if (quoteError || !quoteData) {
        setCanEdit(false);
        setPermissionChecked(true);
        return;
      }

      // Only allow edit if user owns the quote - explicit check
      if (quoteData.user_id && quoteData.user_id === user.id) {
        setCanEdit(true);
      } else {
        // Explicitly set to false if user doesn't own it
        setCanEdit(false);
      }
      setPermissionChecked(true);
    } catch (error) {
      console.error('Error checking edit permission:', error);
      setCanEdit(false);
      setPermissionChecked(true);
    }
  };

  // Track email open when quote is loaded (only for customers, not sales reps viewing their own quotes)
  useEffect(() => {
    if (quote && quoteId && !canEdit) {
      // Only track opens for customers (non-authenticated users or users who don't own the quote)
      // Get IP address and user agent for tracking
      const trackEmailOpen = async () => {
        try {
          // Try to get IP address (this is a simple approach, might need backend for accurate IP)
          const ipResponse = await fetch('https://api.ipify.org?format=json').catch(() => null);
          const ipData = ipResponse ? await ipResponse.json() : null;
          const ipAddress = ipData?.ip || null;
          const userAgent = navigator.userAgent;
          
          await QuoteService.trackEmailOpen(quoteId, ipAddress, userAgent);
        } catch (error) {
          console.error('Error tracking email open:', error);
          // Don't fail silently - still track without IP
          try {
            await QuoteService.trackEmailOpen(quoteId, undefined, navigator.userAgent);
          } catch (e) {
            console.error('Error tracking email open (fallback):', e);
          }
        }
      };
      
      trackEmailOpen();
    }
  }, [quote, quoteId]);

  const fetchQuote = async () => {
    try {
      const quoteData = await QuoteService.getQuote(quoteId || '');
      if (quoteData) {
        setQuote(quoteData);
      } else {
        setQuote(null);
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteAction = async (action: 'accept' | 'decline', declineReason?: string, actionBy: 'customer' | 'sales_rep' = 'customer') => {
    if (!quote || !quoteId) return;
    
    setActionLoading(true);
    try {
      await QuoteService.updateQuoteStatus(
        quoteId,
        action === 'accept' ? 'accepted' : 'declined',
        actionBy,
        declineReason
      );
      
      // Refresh quote data
      const updatedQuote = await QuoteService.getQuote(quoteId);
      if (updatedQuote) {
        setQuote(updatedQuote);
      }
      
      // Show success message
      alert(`Quote ${action === 'accept' ? 'accepted' : 'declined'} successfully! ${action === 'accept' ? 'We\'ll contact you soon to schedule your move.' : ''}`);
      
      // Send notification email (would be handled by backend in production)
      // For now, we'll just log it
      console.log(`Quote ${action}ed by customer. Email notification should be sent.`);
    } catch (error) {
      console.error(`Error ${action}ing quote:`, error);
      alert(`Failed to ${action} quote. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!question.trim() || !quoteId) return;
    
    try {
      await QuoteService.addQuestion(quoteId, question);
      
      // Update local state
    setQuestions(prev => [...prev, question]);
    setQuestion('');
    setShowQuestions(false);
    
      // Refresh quote to get updated questions
      const updatedQuote = await QuoteService.getQuote(quoteId);
      if (updatedQuote) {
        setQuote(updatedQuote);
      }
      
    alert('Question submitted! We\'ll get back to you soon.');
      
      // Send notification email (would be handled by backend in production)
      console.log('Question submitted. Email notification should be sent.');
    } catch (error) {
      console.error('Error submitting question:', error);
      alert('Failed to submit question. Please try again.');
    }
  };

  const handleSendQuote = async () => {
    if (!quote || !quoteId) return;
    
    setIsSendingEmail(true);
    try {
      const quoteUrl = `${window.location.origin}/quote/${quoteId}`;
      
      await EmailBackendService.sendQuote({
        quoteId: quoteId,
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        customerPhone: quote.customerPhone,
        moveDate: quote.moveDate,
        originAddress: quote.originAddress,
        destinationAddress: quote.destinationAddress,
        totalAmount: quote.totalAmount,
        quoteUrl: quoteUrl
      });
      
      alert(`Quote email sent successfully to ${quote.customerEmail}!`);
    } catch (error: any) {
      console.error('Error sending quote email:', error);
      alert(`Failed to send email: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Wait for both quote loading AND permission check before rendering
  if (loading || !permissionChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Quote Not Found</h1>
          <p className="text-gray-600 mb-8">The quote you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-accent hover:bg-accent-dark text-white font-semibold py-2 px-4 rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const groupedItems = quote.detections.reduce((groups, item) => {
    const room = item.room || 'Other';
    if (!groups[room]) groups[room] = [];
    groups[room].push(item);
    return groups;
  }, {} as Record<string, any[]>);

  const selectedUpsells = (quote.upsells || []).filter((u: any) => u.selected !== false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Header with Logo */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {(companySettings?.companyLogoUrl || quote.customLogoUrl) && (
                    <img
                      src={companySettings?.companyLogoUrl || quote.customLogoUrl || ''}
                      alt={companySettings?.companyName || 'Company Logo'}
                      className="h-16 object-contain bg-white rounded-lg p-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <h1 className="text-2xl font-bold">{companySettings?.companyName || 'Saturn Star Movers'}</h1>
                    <p className="text-blue-100 text-sm">Professional Moving Services</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Quote #{quote.id?.slice(0, 8)}</p>
                  <p className="text-sm text-blue-100">
                    {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Property Photos */}
            {quote.photos && quote.photos.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Photos</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {quote.photos.slice(0, 6).map((photo: any, index: number) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={photo.url || photo}
                        alt={`Property photo ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map Illustration */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Move Route</h2>
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <p className="text-sm font-medium text-gray-700">Origin</p>
                    </div>
                    <p className="text-xs text-gray-600 ml-5">{quote.originAddress}</p>
                  </div>
                  <div className="px-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-end space-x-2 mb-2">
                      <p className="text-sm font-medium text-gray-700">Destination</p>
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    </div>
                    <p className="text-xs text-gray-600 mr-5">{quote.destinationAddress}</p>
                  </div>
                </div>
                {quote.estimate?.distance && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Distance:</span> {quote.estimate.distance} miles
                      {quote.estimate.travelTime && <span className="ml-4"><span className="font-medium">Travel Time:</span> {quote.estimate.travelTime} minutes</span>}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{quote.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{quote.customerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{quote.customerPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Move Date</p>
                  <p className="font-medium text-gray-900">{quote.moveDate}</p>
                </div>
              </div>
            </div>

            {/* Move Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Move Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">From</p>
                  <p className="font-medium text-gray-900">{quote.originAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">To</p>
                  <p className="font-medium text-gray-900">{quote.destinationAddress}</p>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Summary</h2>
              <div className="space-y-4">
                {Object.entries(groupedItems).map(([room, items]) => (
                  <div key={room}>
                    <h3 className="font-medium text-gray-900 mb-2">{room}</h3>
                    <div className="space-y-2">
                      {(items as any[]).map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div>
                            <p className="font-medium text-gray-900">{item.label}</p>
                            {item.size && (
                              <p className="text-sm text-gray-500">Size: {item.size}</p>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Qty: {item.qty}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Services */}
            {selectedUpsells.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Services</h2>
                <div className="space-y-3">
                  {selectedUpsells.map((upsell) => (
                    <div key={upsell.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{upsell.name}</p>
                        <p className="text-sm text-gray-500">{upsell.description}</p>
                      </div>
                      <p className="font-medium text-gray-900">${upsell.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Moving Cost</span>
                  <span className="font-medium">${quote.estimate.total.toFixed(2)}</span>
                </div>
                {selectedUpsells.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Additional Services</span>
                    <span className="font-medium">
                      ${selectedUpsells.reduce((sum, u) => sum + u.price, 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-semibold text-gray-900">${quote.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Rep Section - ONLY visible to authenticated users who own the quote */}
            {/* This section is HIDDEN from customers - they should never see this */}
            {canEdit === true && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Sales Rep View
                </h2>
                
                {/* Email Tracking */}
                {quote.emailTracking && (
                  <div className="mb-4 p-3 bg-white rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Email Tracking</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Opens: {quote.emailTracking.opens?.length || 0} time(s)</p>
                      {quote.emailTracking.firstOpened && (
                        <p>First opened: {new Date(quote.emailTracking.firstOpened).toLocaleString()}</p>
                      )}
                      {quote.emailTracking.lastOpened && (
                        <p>Last opened: {new Date(quote.emailTracking.lastOpened).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Sales Rep Actions */}
                <div className="space-y-2 mb-4">
                  {canEdit && (
                    <>
                      <button
                        onClick={() => navigate(`/quote/${quoteId}/edit`)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        Edit Quote
                      </button>
                      <button
                        onClick={handleSendQuote}
                        disabled={isSendingEmail}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        {isSendingEmail ? 'Sending...' : 'Send Quote via Email'}
                      </button>
                    </>
                  )}
                  {quote.status === 'pending' && canEdit && (
                    <>
                      <button
                        onClick={() => handleQuoteAction('accept', undefined, 'sales_rep')}
                        disabled={actionLoading}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        Accept on Behalf
                      </button>
                      <button
                        onClick={() => {
                          setDeclineActionBy('sales_rep');
                          setShowDeclineModal(true);
                        }}
                        disabled={actionLoading}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        Decline on Behalf
                      </button>
                    </>
                  )}
                </div>

                {/* Quote Info */}
                <div className="text-xs text-gray-600 space-y-1">
                  {quote.leadSource && <p>Lead Source: <span className="font-semibold">{quote.leadSource}</span></p>}
                  {quote.moveTimeConfirmed && <p>Move Time: <span className="font-semibold">{quote.moveTimeConfirmed}</span></p>}
                  {quote.priceOverride && (
                    <p className="text-yellow-700">⚠️ Price Overridden: ${quote.originalTotalAmount?.toFixed(2)} → ${quote.totalAmount.toFixed(2)}</p>
                  )}
                </div>

                {/* Sales Rep Notes */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Sales Rep Notes
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Add notes about this quote..."
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={async () => {
                            try {
                              await supabase
                                .from('quotes')
                                .update({ sales_rep_notes: editNotes })
                                .eq('id', quoteId);
                              const updated = await QuoteService.getQuote(quoteId || '');
                              if (updated) setQuote(updated);
                              setIsEditing(false);
                            } catch (error) {
                              console.error('Error saving notes:', error);
                            }
                          }}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditNotes(quote.salesRepNotes || '');
                          }}
                          className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-700 mb-2">
                        {quote.salesRepNotes || 'No notes added'}
                      </p>
                      <button
                        onClick={() => {
                          setEditNotes(quote.salesRepNotes || '');
                          setIsEditing(true);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        {quote.salesRepNotes ? 'Edit' : 'Add'} Notes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions - Customer View (ONLY for customers - hidden from sales reps) */}
            {/* This section is shown when canEdit is false (not authenticated or doesn't own quote) */}
            {canEdit !== true && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Actions</h2>
              
              {quote.status === 'pending' && (
                <div className="space-y-3">
                  <button
                    onClick={() => handleQuoteAction('accept')}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    {actionLoading ? 'Processing...' : 'Accept Quote'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setDeclineActionBy('customer');
                      setShowDeclineModal(true);
                    }}
                    disabled={actionLoading}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    Decline Quote
                  </button>
                  
                  <button
                    onClick={() => setShowQuestions(true)}
                    className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    Ask Questions
                  </button>
                </div>
              )}

              {quote.status === 'accepted' && (
                <div className="text-center">
                  <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg mb-4">
                    <p className="font-semibold">Quote Accepted!</p>
                    <p className="text-sm">We'll contact you soon to schedule your move.</p>
                  </div>
                </div>
              )}

              {quote.status === 'declined' && (
                <div className="text-center">
                  <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg mb-4">
                    <p className="font-semibold">Quote Declined</p>
                    <p className="text-sm">Thank you for considering our services.</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => window.print()}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors mt-3"
              >
                Print Quote
              </button>
            </div>
            )}

            {/* Questions Modal */}
            {showQuestions && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ask a Question</h3>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What would you like to know about this quote?"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={handleSubmitQuestion}
                      className="flex-1 bg-accent hover:bg-accent-dark text-white font-semibold py-2 px-4 rounded-lg"
                    >
                      Submit
                    </button>
                    <button
                      onClick={() => setShowQuestions(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Decline Reason Modal */}
            {showDeclineModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Decline Quote</h3>
                  <p className="text-sm text-gray-600 mb-4">Please let us know why you're declining this quote (optional):</p>
                  <select
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  >
                    <option value="">Select a reason...</option>
                    <option value="Found another mover">Found another mover</option>
                    <option value="Price too high">Price too high</option>
                    <option value="Moving date changed">Moving date changed</option>
                    <option value="Not moving anymore">Not moving anymore</option>
                    <option value="Other">Other</option>
                  </select>
                  {declineReason === 'Other' && (
                    <textarea
                      value={customDeclineReason}
                      onChange={(e) => setCustomDeclineReason(e.target.value)}
                      placeholder="Please specify..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                    />
                  )}
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={async () => {
                        const finalReason = declineReason === 'Other' ? customDeclineReason : declineReason;
                        await handleQuoteAction('decline', finalReason || undefined, declineActionBy);
                        setShowDeclineModal(false);
                        setDeclineReason('');
                        setCustomDeclineReason('');
                        setDeclineActionBy('customer');
                      }}
                      disabled={actionLoading}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg"
                    >
                      {actionLoading ? 'Processing...' : 'Confirm Decline'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeclineModal(false);
                        setDeclineReason('');
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
