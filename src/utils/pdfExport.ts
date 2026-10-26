import { jsPDF } from 'jspdf';
import { QuotationData } from '../types/quote';

interface PDFExportOptions {
  filename?: string;
  onProgress?: (message: string) => void;
}

// Convert HEX color to RGB numbers
function hexToRgb(hex: string): [number, number, number] {
  try {
    const clean = (hex || '#0284c7').replace('#', '').trim();
    if (clean.length === 3) {
      return [
        parseInt(clean[0] + clean[0], 16),
        parseInt(clean[1] + clean[1], 16),
        parseInt(clean[2] + clean[2], 16),
      ];
    }
    const num = parseInt(clean, 16);
    if (isNaN(num)) return [2, 132, 199];
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  } catch {
    return [2, 132, 199];
  }
}

// Helper to convert image URL to Base64 data URL
async function loadImageDataUrl(src: string): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith('data:image')) return src;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 200;
        canvas.height = img.naturalHeight || 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        console.warn('Canvas rasterization of logo failed:', e);
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn('Failed to load image at:', src);
      resolve(null);
    };
    img.src = src;
  });
}

function formatNum(num: number): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Generates a clean, 100% reliable, vector-sharp PDF directly using jsPDF.
 * Bypasses all DOM and CSS Color Module 4 (oklch) parsing limitations,
 * guaranteeing instantaneous, pristine PDF downloads in every browser.
 */
export async function downloadQuotationPDF(
  quotation: QuotationData,
  options: PDFExportOptions = {}
): Promise<boolean> {
  const { 
    filename = 'Quotation.pdf', 
    onProgress 
  } = options;

  onProgress?.('Preparing vector PDF document...');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2); // 182mm
  const [themeR, themeG, themeB] = hexToRgb(quotation.themeColor || '#0284c7');

  let curY = margin;

  // 1. Preload Logo & Signature if available
  onProgress?.('Loading images and brand assets...');
  let logoDataUrl: string | null = null;
  if (quotation.company.logoUrl) {
    logoDataUrl = await loadImageDataUrl(quotation.company.logoUrl);
  }

  let signatureDataUrl: string | null = null;
  if (quotation.signature?.signatureDataUrl) {
    signatureDataUrl = await loadImageDataUrl(quotation.signature.signatureDataUrl);
  }

  onProgress?.('Drawing document header...');

  // 2. Company Header (Logo + Company Name on Left, Address/Phone on Right)
  const headerTop = curY;
  let leftOffset = margin;

  if (logoDataUrl) {
    try {
      const logoW = 20;
      const logoH = 16;
      pdf.addImage(logoDataUrl, 'PNG', leftOffset, curY, logoW, logoH, undefined, 'FAST');
      leftOffset += logoW + 4;
    } catch (e) {
      console.warn('Could not embed logo in PDF:', e);
    }
  }

  // Company Name & Tagline
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(themeR, themeG, themeB);
  
  const companyNameLines = pdf.splitTextToSize(
    (quotation.company.name || 'ONE STEP SOLUTION').toUpperCase(),
    75
  );
  pdf.text(companyNameLines, leftOffset, curY + 4);
  const companyNameHeight = companyNameLines.length * 4.5;

  if (quotation.company.tagline) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(80, 80, 80);
    const taglineLines = pdf.splitTextToSize(quotation.company.tagline.toUpperCase(), 75);
    pdf.text(taglineLines, leftOffset, curY + 4 + companyNameHeight);
  }

  // Right Side: Company Contact Info
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(themeR, themeG, themeB);

  const contactLines: string[] = [];
  if (quotation.company.address) contactLines.push(quotation.company.address.toUpperCase());
  if (quotation.company.phone) contactLines.push(quotation.company.phone);
  if (quotation.company.website) contactLines.push(quotation.company.website.toUpperCase());

  let rightY = headerTop + 3;
  for (const line of contactLines) {
    const split = pdf.splitTextToSize(line, 65);
    for (const s of split) {
      pdf.text(s, pageWidth - margin, rightY, { align: 'right' });
      rightY += 3.8;
    }
  }

  curY = Math.max(headerTop + companyNameHeight + 14, rightY + 6);

  // 3. Document Title: QUOTATION
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(themeR, themeG, themeB);
  pdf.text('QUOTATION', pageWidth / 2, curY, { align: 'center' });
  curY += 8;

  // 4. Two-Column Metadata Box
  const metaStartY = curY;
  const colW = (contentWidth - 8) / 2;

  // Left Column: Quote Details
  pdf.setFontSize(8.5);
  const leftDetails = [
    { label: 'Quotation No:', value: quotation.details.quoteNumber || '#1234' },
    { label: 'Date:', value: quotation.details.date || new Date().toISOString().split('T')[0] },
    { label: 'Valid Until:', value: quotation.details.validUntil || '30 Days' },
  ];
  if (quotation.client.customerId) {
    leftDetails.push({ label: 'Customer ID:', value: quotation.client.customerId });
  }

  let leftY = metaStartY;
  for (const row of leftDetails) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(20, 20, 20);
    pdf.text(row.label, margin, leftY);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(40, 40, 40);
    pdf.text(row.value, margin + 26, leftY);
    leftY += 4.5;
  }

  // Right Column: Client Details
  let rightClientY = metaStartY;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(20, 20, 20);
  pdf.text(quotation.client.name || 'Client Name', margin + colW + 8, rightClientY);
  rightClientY += 4.5;

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(40, 40, 40);
  if (quotation.client.company) {
    pdf.text(quotation.client.company, margin + colW + 8, rightClientY);
    rightClientY += 4.2;
  }
  if (quotation.client.address) {
    const addrSplit = pdf.splitTextToSize(quotation.client.address, colW - 8);
    pdf.text(addrSplit, margin + colW + 8, rightClientY);
    rightClientY += addrSplit.length * 4;
  }
  if (quotation.client.phone) {
    pdf.text(quotation.client.phone, margin + colW + 8, rightClientY);
    rightClientY += 4.2;
  }

  curY = Math.max(leftY, rightClientY) + 4;

  // 5. Project Description Strip
  if (quotation.details.projectDescription) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(20, 20, 20);
    pdf.text('PROJECT DESCRIPTION', margin, curY);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(50, 50, 50);
    const descLines = pdf.splitTextToSize(quotation.details.projectDescription, contentWidth - 48);
    pdf.text(descLines, margin + 46, curY);
    curY += Math.max(descLines.length * 4, 6) + 3;
  }

  // 6. Line Items Table
  onProgress?.('Rendering line items table...');

  const colDesc = margin;
  const colDescW = 96;
  const colQty = colDesc + colDescW;
  const colQtyW = 24;
  const colPrice = colQty + colQtyW;
  const colPriceW = 31;
  const colTotal = colPrice + colPriceW;
  const colTotalW = 31;

  // Header Bar
  const tableHeaderHeight = 7;
  pdf.setFillColor(themeR, themeG, themeB);
  pdf.rect(margin, curY, contentWidth, tableHeaderHeight, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Description', colDesc + 4, curY + 4.8);
  pdf.text('Quantity', colQty + (colQtyW / 2), curY + 4.8, { align: 'center' });
  pdf.text('Price', colPrice + colPriceW - 4, curY + 4.8, { align: 'right' });
  pdf.text('Total', colTotal + colTotalW - 4, curY + 4.8, { align: 'right' });

  curY += tableHeaderHeight;

  // Items Rows
  const currency = quotation.pricing.currencySymbol || 'KSh';
  const currDisplay = currency.length > 1 ? `${currency} ` : currency;

  let subtotal = 0;

  pdf.setFontSize(8);

  for (let i = 0; i < quotation.items.length; i++) {
    const item = quotation.items[i];
    const itemTotal = (item.quantity || 0) * (item.price || 0);
    subtotal += itemTotal;

    const descLines = pdf.splitTextToSize(item.description || '', colDescW - 8);
    const rowHeight = Math.max(descLines.length * 4.2 + 3.5, 7.5);

    // Alternating row background
    if (i % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, curY, contentWidth, rowHeight, 'F');
    }

    // Row divider line
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.2);
    pdf.line(margin, curY + rowHeight, margin + contentWidth, curY + rowHeight);

    // Vertical column divider lines
    pdf.line(colQty, curY, colQty, curY + rowHeight);
    pdf.line(colPrice, curY, colPrice, curY + rowHeight);
    pdf.line(colTotal, curY, colTotal, curY + rowHeight);

    // Cell Texts
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 41, 59);
    pdf.text(descLines, colDesc + 4, curY + 4.8);

    pdf.text(String(item.quantity || 1), colQty + (colQtyW / 2), curY + 4.8, { align: 'center' });
    pdf.text(`${currDisplay}${formatNum(item.price || 0)}`, colPrice + colPriceW - 4, curY + 4.8, { align: 'right' });

    pdf.setFont('helvetica', 'bold');
    pdf.text(`${currDisplay}${formatNum(itemTotal)}`, colTotal + colTotalW - 4, curY + 4.8, { align: 'right' });

    curY += rowHeight;
  }

  curY += 4;

  // 7. Totals Summary Box (Right Aligned)
  const totalsWidth = 68;
  const totalsX = margin + contentWidth - totalsWidth;
  const tax = quotation.pricing.taxAmount || (subtotal * (quotation.pricing.taxRatePercent / 100));
  const others = quotation.pricing.othersFee || 0;
  const grandTotal = subtotal + tax + others;

  // Subtotal
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(50, 50, 50);
  pdf.text('Subtotal', totalsX, curY + 3);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${currDisplay}${formatNum(subtotal)}`, margin + contentWidth - 4, curY + 3, { align: 'right' });
  curY += 5;

  // VAT
  pdf.setFont('helvetica', 'bold');
  pdf.text('Value-Added Tax', totalsX, curY + 3);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${currDisplay}${formatNum(tax)}`, margin + contentWidth - 4, curY + 3, { align: 'right' });
  curY += 5;

  // Others (if any)
  if (others > 0 || quotation.pricing.othersFee !== undefined) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Others', totalsX, curY + 3);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${currDisplay}${formatNum(others)}`, margin + contentWidth - 4, curY + 3, { align: 'right' });
    curY += 5;
  }

  // Grand Total Solid Bar
  curY += 1.5;
  const totalBarHeight = 7.5;
  pdf.setFillColor(themeR, themeG, themeB);
  pdf.rect(totalsX - 4, curY, totalsWidth + 4, totalBarHeight, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Total', totalsX, curY + 5.2);
  pdf.text(`${currDisplay}${formatNum(grandTotal)}`, margin + contentWidth - 4, curY + 5.2, { align: 'right' });

  curY += totalBarHeight + 6;

  // 8. Horizontal Accent Divider
  pdf.setDrawColor(themeR, themeG, themeB);
  pdf.setLineWidth(0.8);
  pdf.line(margin, curY, margin + contentWidth, curY);
  curY += 5;

  // 9. Terms & Conditions
  if (quotation.terms) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(20, 20, 20);
    pdf.text('TERMS & CONDITIONS', margin, curY + 3);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(70, 70, 70);
    const termsLines = pdf.splitTextToSize(quotation.terms, contentWidth - 48);
    pdf.text(termsLines, margin + 46, curY + 3);
    curY += Math.max(termsLines.length * 3.8, 6) + 4;
  }

  // 10. Acceptance of Quote Confirmation & Signatures
  curY = Math.max(curY + 2, pageHeight - margin - 32);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(20, 20, 20);
  pdf.text('PLEASE CONFIRM YOUR ACCEPTANCE OF THIS QUOTE', pageWidth / 2, curY, { align: 'center' });
  curY += 5;

  const sigColW = 60;
  const sigLeftX = margin + 15;
  const sigRightX = margin + contentWidth - sigColW - 15;
  const sigLineY = curY + 14;

  // Left: Signature Line
  if (signatureDataUrl) {
    try {
      pdf.addImage(signatureDataUrl, 'PNG', sigLeftX + 5, curY + 2, 50, 11, undefined, 'FAST');
    } catch (e) {
      console.warn('Could not render drawn signature:', e);
    }
  } else if (quotation.signature?.printedName) {
    pdf.setFont('helvetica', 'oblique');
    pdf.setFontSize(10);
    pdf.setTextColor(20, 20, 20);
    pdf.text(quotation.signature.printedName, sigLeftX + (sigColW / 2), sigLineY - 2, { align: 'center' });
  }

  pdf.setDrawColor(20, 20, 20);
  pdf.setLineWidth(0.3);
  pdf.line(sigLeftX, sigLineY, sigLeftX + sigColW, sigLineY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(60, 60, 60);
  pdf.text('Signature over printed name', sigLeftX + (sigColW / 2), sigLineY + 4, { align: 'center' });

  // Right: Date Signed
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(20, 20, 20);
  const dateSignedText = quotation.signature?.dateSigned || quotation.details.date || '';
  pdf.text(dateSignedText, sigRightX + (sigColW / 2), sigLineY - 2, { align: 'center' });

  pdf.setDrawColor(20, 20, 20);
  pdf.setLineWidth(0.3);
  pdf.line(sigRightX, sigLineY, sigRightX + sigColW, sigLineY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(60, 60, 60);
  pdf.text('Date signed', sigRightX + (sigColW / 2), sigLineY + 4, { align: 'center' });

  // 11. Save and trigger direct browser file download
  onProgress?.('Downloading PDF file...');
  pdf.save(filename);

  return true;
}
