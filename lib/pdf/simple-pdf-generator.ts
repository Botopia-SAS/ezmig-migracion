import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import type { FormSchema, FormField } from '@/lib/forms/service';

interface GenerateSimplePdfOptions {
  formCode: string;
  formName: string;
  caseNumber: string;
  formSchema: FormSchema;
  formData: Record<string, unknown>;
  progressPercentage: number;
}

/**
 * Generate a simple PDF with form responses when the USCIS template fails
 * This creates a clean, readable document with all the answered questions
 */
export async function generateSimplePdf({
  formCode,
  formName,
  caseNumber,
  formSchema,
  formData,
  progressPercentage
}: GenerateSimplePdfOptions): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margin = 50;
  let yPosition = height - margin;

  // Helper function to add a new page when needed
  const checkNewPage = (): PDFPage => {
    if (yPosition < margin + 50) {
      page = pdfDoc.addPage();
      yPosition = height - margin;
    }
    return page;
  };

  // Helper function to draw text
  const drawText = (
    text: string,
    options: {
      font?: any;
      size?: number;
      color?: any;
      indent?: number;
    } = {}
  ) => {
    const currentPage = checkNewPage();
    const {
      font = helveticaFont,
      size = 11,
      color = rgb(0, 0, 0),
      indent = 0
    } = options;

    // Wrap text if it's too long
    const maxWidth = width - (margin * 2) - indent;
    const words = text.split(' ');
    let line = '';

    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const textWidth = font.widthOfTextAtSize(testLine, size);

      if (textWidth > maxWidth && line) {
        currentPage.drawText(line, {
          x: margin + indent,
          y: yPosition,
          size,
          font,
          color,
        });
        yPosition -= size + 3;
        checkNewPage();
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      currentPage.drawText(line, {
        x: margin + indent,
        y: yPosition,
        size,
        font,
        color,
      });
      yPosition -= size + 3;
    }
  };

  // Draw header
  drawText(`${formCode} - ${formName}`, { font: helveticaBold, size: 18 });
  yPosition -= 10;
  drawText(`Case Number: ${caseNumber}`, { size: 12 });
  drawText(`Form Completion: ${progressPercentage}%`, { size: 12 });
  drawText(`Generated: ${new Date().toLocaleDateString()}`, { size: 12 });
  yPosition -= 20;

  // Draw a line separator
  page.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  yPosition -= 20;

  // Process each part and section
  for (const part of formSchema.parts) {
    // Draw part title
    drawText(`Part ${part.number}: ${part.title}`, {
      font: helveticaBold,
      size: 14,
      color: rgb(0.2, 0.2, 0.8)
    });
    yPosition -= 10;

    for (const section of part.sections) {
      // Draw section title if it exists
      if (section.title) {
        drawText(section.title, {
          font: helveticaBold,
          size: 12,
          indent: 20
        });
        yPosition -= 5;
      }

      // Process fields
      for (const field of section.fields) {
        const fieldPath = `${part.id}.${section.id}.${field.id}`;
        const value = formData[fieldPath];

        // Skip empty fields
        if (value === undefined || value === null || value === '') {
          continue;
        }

        // Format the field value based on type
        let displayValue = String(value);
        if (field.type === 'checkbox') {
          displayValue = value ? 'Yes' : 'No';
        } else if (field.type === 'date') {
          try {
            const date = new Date(String(value));
            if (!isNaN(date.getTime())) {
              displayValue = date.toLocaleDateString();
            }
          } catch {
            // Keep original value if date parsing fails
          }
        } else if (field.type === 'checkbox_group' && Array.isArray(value)) {
          displayValue = value.join(', ');
        }

        // Draw field label and value
        const label = field.label || field.placeholder || field.id;
        drawText(`${label}:`, {
          font: helveticaBold,
          size: 10,
          indent: 40,
          color: rgb(0.3, 0.3, 0.3)
        });
        drawText(displayValue, {
          size: 11,
          indent: 40
        });
        yPosition -= 8;
      }
    }
    yPosition -= 15;
  }

  // Add footer on last page
  yPosition = margin;
  page.drawLine({
    start: { x: margin, y: yPosition + 20 },
    end: { x: width - margin, y: yPosition + 20 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  page.drawText('This document was generated from form data and may not be accepted for official filing.', {
    x: margin,
    y: yPosition,
    size: 9,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Save the PDF with proper settings
  const pdfBytes = await pdfDoc.save({
    useObjectStreams: false // Better compatibility
  });

  // Validate the PDF bytes before returning
  if (!pdfBytes || pdfBytes.length === 0) {
    throw new Error('Generated PDF is empty');
  }

  console.log(`[Simple PDF] Generated PDF with ${pdfBytes.length} bytes`);
  return pdfBytes;
}

/**
 * Extract text representation of form data for debugging
 */
export function extractFormDataAsText(
  formSchema: FormSchema,
  formData: Record<string, unknown>
): string {
  let text = '';

  for (const part of formSchema.parts) {
    text += `\nPart ${part.number}: ${part.title}\n`;
    text += '='.repeat(50) + '\n';

    for (const section of part.sections) {
      if (section.title) {
        text += `\n${section.title}\n`;
        text += '-'.repeat(30) + '\n';
      }

      for (const field of section.fields) {
        const fieldPath = `${part.id}.${section.id}.${field.id}`;
        const value = formData[fieldPath];

        if (value !== undefined && value !== null && value !== '') {
          const label = field.label || field.placeholder || field.id;
          text += `${label}: ${value}\n`;
        }
      }
    }
  }

  return text;
}