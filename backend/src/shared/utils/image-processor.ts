import sharp from 'sharp';
import { promises as fs } from 'fs';
import { join } from 'path';
import { config } from '../../config/environment';
import { logger } from './logger';

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const JPEG_QUALITY = 85;

export async function processAndSaveImage(
  buffer: Buffer,
  filename: string
): Promise<string> {
  try {
    // Ensure upload directory exists
    await fs.mkdir(config.upload.dir, { recursive: true });

    // Process image
    const processed = await sharp(buffer)
      .resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    // Save to disk
    const filepath = join(config.upload.dir, filename);
    await fs.writeFile(filepath, processed);

    logger.info('Image processed and saved', { filename, size: processed.length });

    return filepath;
  } catch (error) {
    logger.error('Image processing failed', { error, filename });
    throw error;
  }
}

export async function deleteImage(filepath: string): Promise<void> {
  try {
    await fs.unlink(filepath);
    logger.info('Image deleted', { filepath });
  } catch (error) {
    logger.warn('Failed to delete image', { error, filepath });
  }
}
