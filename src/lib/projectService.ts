import { supabase } from './supabase';
import { QuotePayload, Detection } from '../types';

export interface Project {
  id: string;
  userId: string;
  address: string;
  projectName?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  source: 'mls' | 'manual_upload' | 'customer_upload';
  uploadSessionId?: string;
  photoUrls: string[];
  status: 'draft' | 'detecting' | 'editing' | 'quote_sent' | 'archived';
  detections: Detection[];
  estimate: QuotePayload['estimate'];
  roomsClassified?: Record<string, string[]>;
  detectionCompletedAt?: string;
  quoteId?: string;
  mlsListingId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastAutoSave: string;
}

export interface CreateProjectInput {
  address: string;
  projectName?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  source: 'mls' | 'manual_upload' | 'customer_upload';
  uploadSessionId?: string;
  photoUrls?: string[];
  mlsListingId?: string;
  notes?: string;
}

export interface UpdateProjectInput {
  address?: string;
  projectName?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  photoUrls?: string[];
  status?: 'draft' | 'detecting' | 'editing' | 'quote_sent' | 'archived';
  detections?: Detection[];
  estimate?: any;
  roomsClassified?: Record<string, string[]>;
  detectionCompletedAt?: string;
  quoteId?: string;
  notes?: string;
}

export class ProjectService {
  /**
   * Create a new project
   */
  static async createProject(input: CreateProjectInput): Promise<Project> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error} = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        address: input.address,
        project_name: input.projectName || input.address,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        sqft: input.sqft,
        source: input.source,
        upload_session_id: input.uploadSessionId,
        photo_urls: input.photoUrls || [],
        mls_listing_id: input.mlsListingId,
        notes: input.notes,
        status: 'draft',
        detections: [],
        estimate: {}
      })
      .select()
      .single();

    if (error) throw error;

    console.log('[ProjectService] Created project:', data.id);
    return this.mapToProject(data);
  }

  /**
   * Update an existing project (auto-save)
   */
  static async updateProject(projectId: string, updates: UpdateProjectInput): Promise<Project> {
    const updateData: any = {};

    // Only include fields that are provided
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.projectName !== undefined) updateData.project_name = updates.projectName;
    if (updates.customerName !== undefined) updateData.customer_name = updates.customerName;
    if (updates.customerEmail !== undefined) updateData.customer_email = updates.customerEmail;
    if (updates.customerPhone !== undefined) updateData.customer_phone = updates.customerPhone;
    if (updates.bedrooms !== undefined) updateData.bedrooms = updates.bedrooms;
    if (updates.bathrooms !== undefined) updateData.bathrooms = updates.bathrooms;
    if (updates.sqft !== undefined) updateData.sqft = updates.sqft;
    if (updates.photoUrls !== undefined) updateData.photo_urls = updates.photoUrls;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.detections !== undefined) updateData.detections = updates.detections;
    if (updates.estimate !== undefined) updateData.estimate = updates.estimate;
    if (updates.roomsClassified !== undefined) updateData.rooms_classified = updates.roomsClassified;
    if (updates.detectionCompletedAt !== undefined) updateData.detection_completed_at = updates.detectionCompletedAt;
    if (updates.quoteId !== undefined) updateData.quote_id = updates.quoteId;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;

    console.log('[ProjectService] Auto-saved project:', projectId, 'at', new Date(data.last_auto_save || data.updated_at).toLocaleTimeString());
    return this.mapToProject(data);
  }

  /**
   * Get a project by ID
   */
  static async getProject(projectId: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.mapToProject(data);
  }

  /**
   * List all projects for current user
   */
  static async listUserProjects(filters?: {
    status?: string;
    source?: string;
    limit?: number;
  }): Promise<Project[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.source) {
      query = query.eq('source', filters.source);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(this.mapToProject);
  }

  /**
   * Get active (non-archived) projects
   */
  static async getActiveProjects(): Promise<Project[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapToProject);
  }

  /**
   * Delete a project
   */
  static async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;

    console.log('[ProjectService] Deleted project:', projectId);
  }

  /**
   * Archive a project (soft delete)
   */
  static async archiveProject(projectId: string): Promise<Project> {
    return this.updateProject(projectId, { status: 'archived' });
  }

  /**
   * Add photos to a project
   */
  static async addPhotos(projectId: string, photoUrls: string[]): Promise<Project> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const updatedUrls = [...project.photoUrls, ...photoUrls];
    return this.updateProject(projectId, { photoUrls: updatedUrls });
  }

  /**
   * Update detections for a project
   */
  static async updateDetections(
    projectId: string,
    detections: Detection[],
    roomsClassified?: Record<string, string[]>
  ): Promise<Project> {
    return this.updateProject(projectId, {
      detections,
      roomsClassified,
      detectionCompletedAt: new Date().toISOString(),
      status: 'editing'
    });
  }

  /**
   * Link a customer upload to a project
   */
  static async linkCustomerUpload(projectId: string, uploadSessionId: string): Promise<void> {
    // Update upload session with project reference
    const { error } = await supabase
      .from('uploads')
      .update({ project_id: projectId })
      .eq('id', uploadSessionId);

    if (error) throw error;

    console.log('[ProjectService] Linked upload', uploadSessionId, 'to project', projectId);
  }

  /**
   * Create a project from a customer upload
   */
  static async createFromCustomerUpload(
    uploadSessionId: string,
    photoUrls: string[]
  ): Promise<Project> {
    // Get upload session details
    const { data: upload, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', uploadSessionId)
      .single();

    if (error) throw error;

    // Create project with customer upload data
    const project = await this.createProject({
      address: upload.property_address || 'Customer Upload',
      customerName: upload.customer_name,
      customerEmail: upload.customer_email,
      customerPhone: upload.customer_phone,
      bedrooms: upload.bedrooms,
      bathrooms: upload.bathrooms,
      sqft: upload.sqft,
      source: 'customer_upload',
      uploadSessionId: uploadSessionId,
      photoUrls: photoUrls
    });

    // Link upload to project
    await this.linkCustomerUpload(project.id, uploadSessionId);

    return project;
  }

  /**
   * Get project from MLS listing (or create if doesn't exist)
   */
  static async getOrCreateFromMLS(
    mlsListingId: string,
    address: string,
    propertyData?: {
      bedrooms?: number;
      bathrooms?: number;
      sqft?: number;
    }
  ): Promise<Project> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if project already exists for this MLS listing
    const { data: existing } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('mls_listing_id', mlsListingId)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      console.log('[ProjectService] Found existing MLS project:', existing.id);
      return this.mapToProject(existing);
    }

    // Create new project
    return this.createProject({
      address,
      source: 'mls',
      mlsListingId,
      bedrooms: propertyData?.bedrooms,
      bathrooms: propertyData?.bathrooms,
      sqft: propertyData?.sqft
    });
  }

  /**
   * Legacy: Save a project/quote (backwards compatibility)
   */
  static async saveProject(
    address: string,
    detections: Detection[],
    estimate: QuotePayload['estimate'],
    projectName?: string,
    notes?: string
  ): Promise<Project> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be logged in to save projects');

    const projectData = {
      user_id: user.id,
      address,
      detections,
      estimate,
      project_name: projectName || address || 'Untitled Project',
      notes: notes || null,
      status: 'draft',
      source: 'manual_upload',
      photo_urls: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (error) {
      console.error('Error saving project:', error);
      throw new Error(`Failed to save project: ${error.message}`);
    }

    return this.mapToProject(data);
  }

  /**
   * Legacy: Load user's projects (backwards compatibility)
   */
  static async loadProjects(): Promise<Project[]> {
    return this.getActiveProjects();
  }

  /**
   * Map database row to Project interface
   */
  private static mapToProject(data: any): Project {
    return {
      id: data.id,
      userId: data.user_id,
      address: data.address,
      projectName: data.project_name,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerPhone: data.customer_phone,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      sqft: data.sqft,
      source: data.source || 'manual_upload',
      uploadSessionId: data.upload_session_id,
      photoUrls: data.photo_urls || [],
      status: data.status || 'draft',
      detections: data.detections || [],
      estimate: data.estimate || {},
      roomsClassified: data.rooms_classified,
      detectionCompletedAt: data.detection_completed_at,
      quoteId: data.quote_id,
      mlsListingId: data.mls_listing_id,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastAutoSave: data.last_auto_save || data.updated_at
    };
  }
}
