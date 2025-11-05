/**
 * Email Backend Service
 * Sends emails through the backend API endpoint (Vercel serverless function)
 * This avoids CORS issues and keeps API keys secure
 */

import { supabase } from './supabase';

interface QuoteEmailData {
  quoteId: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  moveDate: string;
  originAddress: string;
  destinationAddress: string;
  totalAmount: number;
  quoteUrl: string;
}

export class EmailBackendService {
  private static readonly API_URL = '/api/send-quote-email';

  static async sendQuote(data: QuoteEmailData): Promise<{ success: boolean; emailId?: string; message?: string }> {
    try {
      // Get the current user's session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('You must be logged in to send emails. Please log in and try again.');
      }

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let result: any;
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        // If not JSON, read as text
        const text = await response.text();
        console.error('Non-JSON response from server:', text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(result.error || result.message || `Failed to send email: ${response.status} ${response.statusText}`);
      }

      return {
        success: true,
        emailId: result.emailId,
        message: result.message || 'Email sent successfully'
      };
    } catch (error: any) {
      console.error('Email sending failed:', error);
      
      // If it's already an Error with a message, throw it as-is
      if (error instanceof Error) {
        throw error;
      }
      
      // Otherwise, create a user-friendly error message
      throw new Error(error.message || 'Failed to send email. Please check your configuration and try again.');
    }
  }
}

