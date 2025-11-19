import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UploadService } from '../lib/uploadService';

interface CustomerUpload {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  propertyAddress: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  status: string;
  createdAt: string;
  fileCount: number;
}

interface CustomerUploadsPanelProps {
  onLoadUpload: (uploadId: string, propertyInfo: any) => void;
}

export default function CustomerUploadsPanel({ onLoadUpload }: CustomerUploadsPanelProps) {
  const [uploads, setUploads] = useState<CustomerUpload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerUploads();
  }, []);

  const fetchCustomerUploads = async () => {
    try {
      setLoading(true);

      // Get all customer-type uploads for current user
      const { data: uploadsData, error: uploadsError } = await supabase
        .from('uploads')
        .select('*')
        .eq('upload_type', 'customer')
        .order('created_at', { ascending: false });

      if (uploadsError) throw uploadsError;

      // Get file counts for each upload
      const uploadsWithCounts = await Promise.all(
        (uploadsData || []).map(async (upload) => {
          const { data: files } = await supabase
            .from('upload_files')
            .select('id')
            .eq('upload_id', upload.id);

          return {
            id: upload.id,
            customerName: upload.customer_name || 'Unknown',
            customerEmail: upload.customer_email,
            customerPhone: upload.customer_phone,
            propertyAddress: upload.property_address || 'No address',
            bedrooms: upload.bedrooms,
            bathrooms: upload.bathrooms,
            sqft: upload.sqft,
            status: upload.status,
            createdAt: upload.created_at,
            fileCount: files?.length || 0
          };
        })
      );

      setUploads(uploadsWithCounts);
    } catch (error) {
      console.error('Error fetching customer uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadUpload = async (upload: CustomerUpload) => {
    try {
      // Get all files for this upload
      const files = await UploadService.getUploadFiles(upload.id);

      // Convert to photos format
      const photos = files
        .filter(f => f.fileType === 'image')
        .map((file, index) => ({
          id: `customer-${file.id}`,
          url: UploadService.getFileUrl(file.filePath),
          thumbnailUrl: UploadService.getFileUrl(file.filePath),
          filename: file.originalName,
          uploadedAt: new Date(file.createdAt)
        }));

      // Pass to parent with property info
      onLoadUpload(upload.id, {
        photos,
        propertyInfo: {
          address: upload.propertyAddress,
          bedrooms: upload.bedrooms,
          bathrooms: upload.bathrooms,
          sqft: upload.sqft
        },
        customerInfo: {
          name: upload.customerName,
          email: upload.customerEmail,
          phone: upload.customerPhone
        }
      });

    } catch (error) {
      console.error('Error loading upload:', error);
      alert('Failed to load customer upload');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading customer uploads...</p>
        </div>
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No Customer Uploads Yet</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Share upload links with customers to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Uploads</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Photos uploaded by your customers</p>
        </div>
        <button
          onClick={fetchCustomerUploads}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {uploads.map((upload) => (
          <div
            key={upload.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {upload.customerName}
                  </h4>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    upload.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : upload.status === 'pending'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  }`}>
                    {upload.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{upload.propertyAddress}</span>
                  </div>

                  {upload.customerPhone && (
                    <div className="flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{upload.customerPhone}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 mt-2">
                    <span className="flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {upload.fileCount} {upload.fileCount === 1 ? 'file' : 'files'}
                    </span>
                    {(upload.bedrooms || upload.bathrooms || upload.sqft) && (
                      <span className="flex items-center space-x-1">
                        {upload.bedrooms && <span>{upload.bedrooms} bed</span>}
                        {upload.bathrooms && <span>• {upload.bathrooms} bath</span>}
                        {upload.sqft && <span>• {upload.sqft.toLocaleString()} sqft</span>}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-2 ml-4">
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatDate(upload.createdAt)}
                </span>
                {upload.fileCount > 0 && (
                  <button
                    onClick={() => handleLoadUpload(upload)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Load & Detect
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
