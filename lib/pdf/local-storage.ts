import { writeFile, mkdir } from 'node:fs/promises';
import path from 'path';
import { existsSync } from 'node:fs';

/**
 * Save PDF locally when Cloudinary is not configured or fails
 */
export async function savePdfLocally(
  buffer: Uint8Array,
  fileName: string
): Promise<string> {
  // Create directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'pdfs');
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}-${fileName}`;
  const filePath = path.join(uploadsDir, uniqueFileName);

  // Write file
  await writeFile(filePath, buffer);

  // Return public URL
  const publicUrl = `/uploads/pdfs/${uniqueFileName}`;
  console.log(`[Local Storage] PDF saved locally: ${publicUrl}`);

  return publicUrl;
}