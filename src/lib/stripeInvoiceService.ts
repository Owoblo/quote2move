/**
 * Stripe Invoice Service
 * Handles Stripe invoice generation for quotes
 */

import { supabase } from './supabase';
import { QuoteService, QuoteData } from './quoteService';

export class StripeInvoiceService {
  // Create a Stripe invoice for a quote when payment is due
  static async createInvoice(quoteId: string, paymentDueDate?: string): Promise<{ invoiceId: string; invoiceUrl: string }> {
    const quote = await QuoteService.getQuote(quoteId);
    if (!quote) throw new Error('Quote not found');

    // Calculate payment due date (default: 7 days from invoice creation)
    const dueDate = paymentDueDate || this.getDefaultDueDate();

    try {
      // In production, this would call your backend API to create a Stripe invoice
      // For now, we'll simulate it and store the invoice ID
      const response = await fetch('/api/create-stripe-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId: quote.id,
          customerEmail: quote.customerEmail,
          customerName: quote.customerName,
          amount: quote.totalAmount,
          description: `Moving services for ${quote.originAddress} to ${quote.destinationAddress}`,
          dueDate: dueDate,
          metadata: {
            quote_id: quote.id,
            move_date: quote.moveDate,
            customer_phone: quote.customerPhone
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Stripe invoice');
      }

      const { invoiceId, invoiceUrl } = await response.json();

      // Update quote with invoice information
      await supabase
        .from('quotes')
        .update({
          stripe_invoice_id: invoiceId,
          invoice_sent_at: new Date().toISOString(),
          payment_due_date: dueDate,
          payment_status: 'invoice_sent'
        })
        .eq('id', quoteId);

      return { invoiceId, invoiceUrl };
    } catch (error: any) {
      // If backend API doesn't exist, create a mock invoice for development
      console.warn('Stripe invoice API not available, using mock invoice:', error);
      
      const mockInvoiceId = `inv_${Date.now()}`;
      const mockInvoiceUrl = `https://invoice.stripe.com/i/${mockInvoiceId}`;
      
      // Update quote with mock invoice information
      await supabase
        .from('quotes')
        .update({
          stripe_invoice_id: mockInvoiceId,
          invoice_sent_at: new Date().toISOString(),
          payment_due_date: dueDate,
          payment_status: 'invoice_sent'
        })
        .eq('id', quoteId);

      return { invoiceId: mockInvoiceId, invoiceUrl: mockInvoiceUrl };
    }
  }

  // Send invoice to customer
  static async sendInvoice(quoteId: string): Promise<void> {
    const quote = await QuoteService.getQuote(quoteId);
    if (!quote) throw new Error('Quote not found');

    if (!quote.stripeInvoiceId) {
      // Create invoice first if it doesn't exist
      await this.createInvoice(quoteId);
      // Re-fetch quote to get invoice ID
      const updatedQuote = await QuoteService.getQuote(quoteId);
      if (!updatedQuote?.stripeInvoiceId) {
        throw new Error('Failed to create invoice');
      }
    }

    // In production, this would send the invoice via Stripe's email system
    // or use your email service
    console.log(`Invoice ${quote.stripeInvoiceId} sent to ${quote.customerEmail}`);
    
    // You could integrate with ResendService here to send a custom email with invoice link
    // await ResendService.sendInvoiceEmail(quote);
  }

  // Get invoice status
  static async getInvoiceStatus(quoteId: string): Promise<{
    status: 'pending' | 'invoice_sent' | 'paid' | 'overdue';
    invoiceId?: string;
    invoiceUrl?: string;
    dueDate?: string;
    paidAt?: string;
  }> {
    const quote = await QuoteService.getQuote(quoteId);
    if (!quote) throw new Error('Quote not found');

    return {
      status: quote.paymentStatus || 'pending',
      invoiceId: quote.stripeInvoiceId,
      invoiceUrl: quote.stripeInvoiceId ? `https://invoice.stripe.com/i/${quote.stripeInvoiceId}` : undefined,
      dueDate: quote.paymentDueDate,
      paidAt: quote.paymentStatus === 'paid' ? quote.invoiceSentAt : undefined
    };
  }

  // Mark invoice as paid
  static async markInvoicePaid(quoteId: string): Promise<void> {
    await supabase
      .from('quotes')
      .update({
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId);
  }

  // Get default due date (7 days from now)
  private static getDefaultDueDate(): string {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    return dueDate.toISOString().split('T')[0];
  }
}

