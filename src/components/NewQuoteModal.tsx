import React from 'react';

interface NewQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMLS: () => void;
  onSelectManualUpload: () => void;
  onSelectCustomerUpload: () => void;
}

export default function NewQuoteModal({
  isOpen,
  onClose,
  onSelectMLS,
  onSelectManualUpload,
  onSelectCustomerUpload
}: NewQuoteModalProps) {
  if (!isOpen) return null;

  const handleOptionClick = (callback: () => void) => {
    callback();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                Create New Quote
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                Choose how you'd like to start
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="p-8 space-y-4">
          {/* MLS Search - PRIMARY */}
          <button
            onClick={() => handleOptionClick(onSelectMLS)}
            className="w-full group relative bg-gradient-to-br from-primary to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl p-6 transition-all transform hover:scale-[1.01] shadow-lg hover:shadow-xl shadow-blue-500/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold">Search Property Address</h3>
                  <p className="text-blue-100 mt-1 font-medium">
                    Find photos from MLS listings (Recommended)
                  </p>
                </div>
              </div>
              <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Manual Upload */}
          <button
            onClick={() => handleOptionClick(onSelectManualUpload)}
            className="w-full group bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 border-2 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 rounded-2xl p-6 transition-all transform hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 text-gray-600 dark:text-gray-300 group-hover:text-primary group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                    Upload Photos Manually
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    I have my own photos to upload
                  </p>
                </div>
              </div>
            </div>
          </button>

          {/* Customer Upload */}
          <button
            onClick={() => handleOptionClick(onSelectCustomerUpload)}
            className="w-full group bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 border-2 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 rounded-2xl p-6 transition-all transform hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 text-gray-600 dark:text-gray-300 group-hover:text-primary group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                    Customer Upload
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Send a link to customer to upload photos
                  </p>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end bg-gray-50/50 dark:bg-gray-800/50 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl transition-colors font-semibold shadow-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
