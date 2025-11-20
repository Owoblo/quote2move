import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function QuoteFeedbackPage() {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const [actualCubicFeet, setActualCubicFeet] = useState('');
  const [actualHours, setActualHours] = useState('');
  const [missedItems, setMissedItems] = useState('');
  const [extraItems, setExtraItems] = useState('');
  const [actualPrice, setActualPrice] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const { error } = await supabase.functions.invoke('update-quote-outcome', {
        body: {
          quoteId: quoteId,
          actualCubicFeet: actualCubicFeet ? parseInt(actualCubicFeet) : null,
          actualHours: actualHours ? parseInt(actualHours) : null,
          missedItems: missedItems,
          extraItems: extraItems,
          actualPrice: actualPrice ? parseFloat(actualPrice) : null,
          lostReason: lostReason,
        }
      });
      
      if (error) throw error;
      
      navigate(`/quote/${quoteId}`);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Post-Move Feedback</h1>
        <p className="text-gray-600 mb-8">Help us improve our AI by providing details about the actual move.</p>
        
        {error && <p className="text-red-500 mb-4">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Actual Cubic Feet</label>
            <input type="number" value={actualCubicFeet} onChange={e => setActualCubicFeet(e.target.value)} className="w-full input-field mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Actual Hours</label>
            <input type="number" value={actualHours} onChange={e => setActualHours(e.target.value)} className="w-full input-field mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Actual Price</label>
            <input type="number" value={actualPrice} onChange={e => setActualPrice(e.target.value)} className="w-full input-field mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Items Missed by AI</label>
            <textarea value={missedItems} onChange={e => setMissedItems(e.target.value)} className="w-full input-field mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Items Detected but Not Present</label>
            <textarea value={extraItems} onChange={e => setExtraItems(e.target.value)} className="w-full input-field mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reason if Quote Was Lost</label>
            <textarea value={lostReason} onChange={e => setLostReason(e.target.value)} className="w-full input-field mt-1" />
          </div>
          <button type="submit" disabled={isSaving} className="w-full btn btn-primary py-3">
            {isSaving ? 'Saving...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}
