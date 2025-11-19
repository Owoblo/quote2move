import { supabase } from './supabase';

export interface UploadSession {
  id: string;
  token: string;
  uploadType: 'manual' | 'customer';
  status: 'pending' | 'processing' | 'completed' | 'error';
  propertyAddress?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  detections?: any[];
  createdAt: string;
  processedAt?: string;
}

export interface UploadFile {
  id: string;
  uploadId: string;
  filePath: string;
  fileType: 'image' | 'video';
  fileSize: number;
  originalName: string;
  mimeType: string;
  processed: boolean;
  framesExtracted?: number;
  createdAt: string;
}

export class UploadService {
  private static BUCKET_NAME = 'property-uploads';

  /**
   * Create a new upload session
   */
  static async createUploadSession(data: {
    uploadType?: 'manual' | 'customer';
    propertyAddress?: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  }): Promise<UploadSession> {
    const { data: session, error } = await supabase
      .from('uploads')
      .insert({
        upload_type: data.uploadType || 'manual',
        property_address: data.propertyAddress,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        sqft: data.sqft,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: session.id,
      token: session.token,
      uploadType: session.upload_type,
      status: session.status,
      propertyAddress: session.property_address,
      bedrooms: session.bedrooms,
      bathrooms: session.bathrooms,
      sqft: session.sqft,
      customerName: session.customer_name,
      customerEmail: session.customer_email,
      customerPhone: session.customer_phone,
      createdAt: session.created_at
    };
  }

  /**
   * Upload a file to Supabase Storage
   */
  static async uploadFile(
    uploadId: string,
    file: File
  ): Promise<UploadFile> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('User not authenticated');

    // Create unique file path
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${uploadId}/${timestamp}-${sanitizedName}`;

    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (storageError) throw storageError;

    // Determine file type
    const fileType = file.type.startsWith('video/') ? 'video' : 'image';

    // Save file record to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('upload_files')
      .insert({
        upload_id: uploadId,
        file_path: storageData.path,
        file_type: fileType,
        file_size: file.size,
        original_name: file.name,
        mime_type: file.type
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return {
      id: fileRecord.id,
      uploadId: fileRecord.upload_id,
      filePath: fileRecord.file_path,
      fileType: fileRecord.file_type,
      fileSize: fileRecord.file_size,
      originalName: fileRecord.original_name,
      mimeType: fileRecord.mime_type,
      processed: fileRecord.processed,
      framesExtracted: fileRecord.frames_extracted,
      createdAt: fileRecord.created_at
    };
  }

  /**
   * Get public URL for uploaded file
   */
  static getFileUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Get all files for an upload session
   */
  static async getUploadFiles(uploadId: string): Promise<UploadFile[]> {
    const { data, error } = await supabase
      .from('upload_files')
      .select('*')
      .eq('upload_id', uploadId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map((file: any) => ({
      id: file.id,
      uploadId: file.upload_id,
      filePath: file.file_path,
      fileType: file.file_type,
      fileSize: file.file_size,
      originalName: file.original_name,
      mimeType: file.mime_type,
      processed: file.processed,
      framesExtracted: file.frames_extracted,
      createdAt: file.created_at
    }));
  }

  /**
   * Update upload session status
   */
  static async updateUploadStatus(
    uploadId: string,
    status: 'pending' | 'processing' | 'completed' | 'error',
    detections?: any[]
  ): Promise<void> {
    const updateData: any = { status };

    if (status === 'completed') {
      updateData.processed_at = new Date().toISOString();
    }

    if (detections) {
      updateData.detections = detections;
    }

    const { error } = await supabase
      .from('uploads')
      .update(updateData)
      .eq('id', uploadId);

    if (error) throw error;
  }

  /**
   * Get user's upload sessions
   */
  static async getUserUploads(): Promise<UploadSession[]> {
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((session: any) => ({
      id: session.id,
      token: session.token,
      uploadType: session.upload_type,
      status: session.status,
      propertyAddress: session.property_address,
      bedrooms: session.bedrooms,
      bathrooms: session.bathrooms,
      sqft: session.sqft,
      customerName: session.customer_name,
      customerEmail: session.customer_email,
      customerPhone: session.customer_phone,
      detections: session.detections,
      createdAt: session.created_at,
      processedAt: session.processed_at
    }));
  }

  /**
   * Delete upload session and all associated files
   */
  static async deleteUpload(uploadId: string): Promise<void> {
    // Get all files
    const files = await this.getUploadFiles(uploadId);

    // Delete files from storage
    const filePaths = files.map(f => f.filePath);
    if (filePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove(filePaths);

      if (storageError) console.error('Error deleting files from storage:', storageError);
    }

    // Delete upload session (cascade will delete upload_files records)
    const { error } = await supabase
      .from('uploads')
      .delete()
      .eq('id', uploadId);

    if (error) throw error;
  }
}
