/**
 * Simple PDF Service
 * Generate PDF quotes using a simpler approach
 */

interface QuoteData {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  moveDate: string;
  originAddress: string;
  destinationAddress: string;
  detections: any[];
  estimate: any;
  upsells: any[];
  totalAmount: number;
  photos?: any[];
}

export class SimplePDFService {
  static async downloadQuote(quoteData: QuoteData): Promise<void> {
    try {
      // For now, create a simple text-based PDF
      // Create a simple HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Quote ${quoteData.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 25px; padding: 15px; background: #f8fafc; border-radius: 8px; }
            .section h3 { color: #1e40af; margin-top: 0; }
            .item { margin: 8px 0; padding: 5px 0; border-bottom: 1px solid #e5e7eb; }
            .total { font-size: 18px; font-weight: bold; color: #1e40af; text-align: right; margin-top: 20px; }
            .footer { text-align: center; margin-top: 40px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>QUOTE2MOVE</h1>
            <p>Professional Moving Services</p>
          </div>
          
          <div class="section">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${quoteData.customerName}</p>
            <p><strong>Email:</strong> ${quoteData.customerEmail}</p>
            <p><strong>Phone:</strong> ${quoteData.customerPhone}</p>
            <p><strong>Move Date:</strong> ${quoteData.moveDate}</p>
          </div>
          
          <div class="section">
            <h3>Move Details</h3>
            <p><strong>From:</strong> ${quoteData.originAddress}</p>
            <p><strong>To:</strong> ${quoteData.destinationAddress}</p>
          </div>
          
          <div class="section">
            <h3>Inventory</h3>
            ${this.generateInventoryHTML(quoteData.detections)}
          </div>
          
          ${quoteData.upsells.filter(u => u.selected).length > 0 ? `
          <div class="section">
            <h3>Additional Services</h3>
            ${quoteData.upsells.filter(u => u.selected).map(upsell => 
              `<div class="item">${upsell.name}: $${upsell.price.toFixed(2)}</div>`
            ).join('')}
          </div>
          ` : ''}
          
          <div class="total">
            Total: $${quoteData.totalAmount.toFixed(2)}
          </div>
          
          <div class="section">
            <h3>Insurance Coverage</h3>
            <p><strong>Basic Coverage (Included):</strong> $0.60 per pound per item</p>
            <p>All items are covered under basic moving insurance. For additional coverage options, please contact us.</p>
            <p><strong>Important:</strong> Items must be properly packed and inventoried. We recommend taking photos of valuable items before the move.</p>
          </div>
          
          <div class="section">
            <h3>Customer Agreement & Policies</h3>
            <h4>Terms and Conditions:</h4>
            <ul style="line-height: 1.8;">
              <li><strong>Payment:</strong> Payment is due on the day of the move unless other arrangements have been made.</li>
              <li><strong>Rescheduling:</strong> Changes to move date must be made at least 48 hours in advance. Late changes may incur a rescheduling fee.</li>
              <li><strong>Cancellation:</strong> Cancellations made 24+ hours before move date: no charge. Cancellations within 24 hours: 25% cancellation fee.</li>
              <li><strong>Liability:</strong> Our liability is limited to $0.60 per pound per item under basic coverage. Additional insurance options are available.</li>
              <li><strong>Access:</strong> Customer must ensure access to both origin and destination locations. Delays due to access issues may result in additional charges.</li>
              <li><strong>Packing:</strong> Customer is responsible for packing personal items unless packing service is included in this quote.</li>
              <li><strong>Hazardous Materials:</strong> We cannot transport hazardous materials, firearms, or perishables unless specifically arranged.</li>
              <li><strong>Disputes:</strong> Any disputes must be reported within 48 hours of move completion.</li>
            </ul>
          </div>
          
          <div class="section">
            <h3>Customer Reviews</h3>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
              <p style="font-style: italic; margin: 5px 0;">"Professional, efficient, and careful with our belongings. Highly recommend!"</p>
              <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">- Sarah M., 5 stars</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
              <p style="font-style: italic; margin: 5px 0;">"The team was punctual and handled everything with care. Great experience!"</p>
              <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">- John D., 5 stars</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
              <p style="font-style: italic; margin: 5px 0;">"They made our move stress-free. Everything arrived in perfect condition."</p>
              <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">- Maria L., 5 stars</p>
            </div>
          </div>
          
          <div class="section">
            <h3>Acceptance of Quote</h3>
            <p>By accepting this quote, you agree to the terms and conditions outlined above.</p>
            <p>You can accept this quote by:</p>
            <ul>
              <li>Clicking "Accept Quote" in the email link provided</li>
              <li>Calling us at the number listed above</li>
              <li>Responding to this quote via email</li>
            </ul>
            <p style="margin-top: 15px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
              <strong>Note:</strong> This quote is valid for 30 days from the date of generation. Prices are subject to change if move date or details change significantly.
            </p>
          </div>
          
          <div class="footer">
            <p>This quote is valid for 30 days from the date of generation.</p>
            <p>For questions or to accept this quote, contact us at support@movsense.com</p>
            <p style="margin-top: 10px; font-size: 10px; color: #9ca3af;">
              Licensed & Insured Moving Company | All Rights Reserved
            </p>
          </div>
        </body>
        </html>
      `;
      
      // Create and download the HTML file (can be printed to PDF)
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quote-${quoteData.id}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  private static generateQuoteContent(quoteData: QuoteData): string {
    // This method is kept for future use but not currently used
    // It generates a text-based quote content
    return `QUOTE ${quoteData.id} - ${quoteData.customerName}`;
  }

  private static generateInventoryHTML(detections: any[]): string {
    const grouped = detections.reduce((groups, item) => {
      const room = item.room || 'Other';
      if (!groups[room]) groups[room] = [];
      groups[room].push(item);
      return groups;
    }, {} as Record<string, any[]>);

    let html = '';
    Object.entries(grouped).forEach(([room, items]) => {
      html += `<h4>${room}</h4>`;
      (items as any[]).forEach((item: any) => {
        html += `<div class="item">${item.label} (${item.qty}x)`;
        if (item.size) html += ` - ${item.size}`;
        html += '</div>';
      });
    });

    return html;
  }
}
