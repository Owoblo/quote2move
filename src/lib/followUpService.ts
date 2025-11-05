/**
 * Follow-up Automation Service
 * Handles automated follow-ups for quotes
 */

import { supabase } from './supabase';
import { QuoteService } from './quoteService';

export interface FollowUp {
  id: string;
  quoteId: string;
  userId: string;
  followUpDate: string;
  followUpType: 'automatic' | 'manual';
  completed: boolean;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export class FollowUpService {
  // Create a follow-up for a quote (default: next day)
  static async createFollowUp(
    quoteId: string,
    followUpDate?: string,
    followUpType: 'automatic' | 'manual' = 'automatic'
  ): Promise<FollowUp> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const date = followUpDate || this.getDefaultFollowUpDate();

    const { data, error } = await supabase
      .from('quote_follow_ups')
      .insert({
        quote_id: quoteId,
        user_id: user.id,
        follow_up_date: date,
        follow_up_type: followUpType
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get all pending follow-ups for the current user
  static async getPendingFollowUps(): Promise<FollowUp[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase
      .from('quote_follow_ups')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .gte('follow_up_date', new Date().toISOString().split('T')[0])
      .order('follow_up_date', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Get follow-ups due today
  static async getFollowUpsDueToday(): Promise<FollowUp[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('quote_follow_ups')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .eq('follow_up_date', today)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Mark follow-up as completed
  static async completeFollowUp(followUpId: string, notes?: string): Promise<void> {
    const { error } = await supabase
      .from('quote_follow_ups')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        notes
      })
      .eq('id', followUpId);

    if (error) throw error;
  }

  // Update follow-up date
  static async updateFollowUpDate(followUpId: string, newDate: string): Promise<void> {
    const { error } = await supabase
      .from('quote_follow_ups')
      .update({ follow_up_date: newDate })
      .eq('id', followUpId);

    if (error) throw error;
  }

  // Get default follow-up date (next day)
  private static getDefaultFollowUpDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // Check for follow-ups and send reminders (should be called periodically)
  static async processFollowUpReminders(): Promise<void> {
    const followUpsDue = await this.getFollowUpsDueToday();
    
    for (const followUp of followUpsDue) {
      // Get the quote associated with this follow-up
      const quote = await QuoteService.getQuote(followUp.quoteId);
      if (!quote) continue;

      // Send reminder notification (would integrate with email/SMS service)
      console.log(`Follow-up reminder: Quote ${quote.id} for ${quote.customerName} - ${quote.customerEmail}`);
      
      // In production, this would send an email/SMS to the sales rep
      // await EmailService.sendFollowUpReminder(followUp, quote);
    }
  }
}

