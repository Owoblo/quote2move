import { Detection, QuotePayload } from '../types';

export function toCSV(detections: Detection[]): string {
  // Group detections by room
  const roomGroups = detections.reduce((acc, detection) => {
    const room = detection.room || 'Unassigned';
    if (!acc[room]) {
      acc[room] = [];
    }
    acc[room].push(detection);
    return acc;
  }, {} as Record<string, Detection[]>);

  // Build inventory by room
  let output = 'INVENTORY\n\n';

  Object.keys(roomGroups).sort().forEach(room => {
    output += `${room.toUpperCase()}\n`;
    roomGroups[room].forEach(detection => {
      output += `${detection.label} x ${detection.qty}\n`;
    });
    output += '\n';
  });

  // Calculate totals
  const totalCubicFeet = detections.reduce((sum, d) => sum + (d.cubicFeet || 0), 0);
  const totalWeight = detections.reduce((sum, d) => sum + (d.weight || 0), 0);

  // Add totals at the bottom
  output += '---\n';
  output += `Total Cubic Feet: ${totalCubicFeet.toFixed(2)}\n`;
  output += `Total Weight: ${totalWeight.toFixed(2)} lbs\n`;

  return output;
}

export function generatePdf(quotePayload: QuotePayload): Promise<Blob> {
  // Placeholder implementation - would integrate with a PDF library like jsPDF
  return new Promise((resolve) => {
    const content = `
      QUOTE2MOVE
      
      Address: ${quotePayload.address}
      Date: ${quotePayload.timestamp.toLocaleDateString()}
      
      INVENTORY:
      ${quotePayload.detections.map(d => 
        `• ${d.label} (${d.qty}) - ${Math.round(d.confidence * 100)}% confidence`
      ).join('\n')}
      
      ESTIMATE:
      Crew Size: ${quotePayload.estimate.crew}
      Hourly Rate: $${quotePayload.estimate.rate}
      Estimated Hours: ${quotePayload.estimate.hours}
      Total: $${quotePayload.estimate.total}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    resolve(blob);
  });
}

export function downloadFile(content: string | Blob, filename: string, mimeType: string = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

