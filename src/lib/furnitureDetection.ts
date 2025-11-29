import { Detection, PropertyContext } from '../types';
import { detectFurniture, classifyRooms, detectFurnitureInRoom } from './aiDetectionServices';

// AI Furniture Detection Service
export class FurnitureDetectionService {
  // NEW: Phase 1 - Classify rooms first
  static async classifyRooms(
    photoUrls: string[],
    propertyContext?: PropertyContext
  ): Promise<{ rooms: Record<string, string[]>, metadata: any }> {
    console.log('🏠 Classifying rooms for', photoUrls.length, 'photos');

    try {
      const result = await classifyRooms(photoUrls, propertyContext);
      console.log('Room classification completed:', Object.keys(result.rooms).length, 'rooms');
      return result;
    } catch (error) {
      console.error('Room classification failed:', error);
      throw new Error('Room classification failed. Please check your API keys and try again.');
    }
  }

  // NEW: Phase 2 - Detect furniture in a specific room
  static async detectFurnitureInRoom(
    roomName: string,
    roomPhotos: string[],
    propertyContext?: PropertyContext
  ): Promise<{ detections: Detection[], detectionTimeMs: number }> {
    console.log(`📍 Detecting furniture in ${roomName}`);

    try {
      const result = await detectFurnitureInRoom(roomName, roomPhotos, propertyContext);
      console.log(`${roomName}: Found ${result.detections.length} items`);
      return result;
    } catch (error) {
      console.error(`Detection failed for ${roomName}:`, error);
      return { detections: [], detectionTimeMs: 0 };
    }
  }

  // Real AI detection using external services (legacy)
  static async detectFurniture(photoUrls: string[]): Promise<Detection[]> {
    console.log('Starting AI furniture detection for', photoUrls.length, 'photos');

    try {
      // Use real AI detection
      const detections = await detectFurniture(photoUrls);

      console.log('AI detection completed. Found', detections.length, 'items');
      return detections;
    } catch (error) {
      console.error('AI detection failed:', error);
      throw new Error('AI detection failed. Please check your API keys and try again.');
    }
  }

  // Analyze photos for furniture detection (legacy)
  static async analyzePhotos(photos: any[]): Promise<Detection[]> {
    if (photos.length === 0) {
      return [];
    }

    const photoUrls = photos.map(photo => photo.url);
    return await this.detectFurniture(photoUrls);
  }
}
