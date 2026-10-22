import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from './logger';

export interface ImageUploadResult {
  url: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// Magic bytes header check
const verifyMagicBytes = (buffer: Buffer): string | null => {
  if (buffer.length < 8) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
};

/**
 * Ensures the uploads directory exists on disk
 */
const getUploadDir = (): string => {
  const dir = path.join(process.cwd(), 'uploads', 'menu');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

/**
 * Saves a base64 data URL or raw buffer safely to disk.
 */
export const storeMenuImage = async (
  rawInput: string | Buffer,
  originalFilename?: string
): Promise<ImageUploadResult> => {
  let buffer: Buffer;

  if (Buffer.isBuffer(rawInput)) {
    buffer = rawInput;
  } else if (typeof rawInput === 'string' && rawInput.startsWith('data:')) {
    // Parse base64 dataUrl: data:image/jpeg;base64,...
    const matches = rawInput.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 image data payload format.');
    }
    buffer = Buffer.from(matches[2], 'base64');
  } else if (typeof rawInput === 'string') {
    // Standard base64 string
    buffer = Buffer.from(rawInput, 'base64');
  } else {
    throw new Error('Unsupported image payload.');
  }

  // 1. File Size Verification
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`Image exceeds the maximum allowed size of 5 MB (${(buffer.length / 1024 / 1024).toFixed(2)} MB uploaded).`);
  }

  // 2. Magic Bytes Content Verification (prevent executable/spoofed extensions)
  const detectedMime = verifyMagicBytes(buffer);
  if (!detectedMime || !ALLOWED_MIME_EXT[detectedMime]) {
    throw new Error('Invalid image file content. Only authentic JPEG, PNG, and WebP images are permitted.');
  }

  const extension = ALLOWED_MIME_EXT[detectedMime];
  const uniqueToken = crypto.randomBytes(6).toString('hex');
  const sanitizedFilename = `dish-${Date.now()}-${uniqueToken}.${extension}`;

  const uploadDir = getUploadDir();
  const filePath = path.join(uploadDir, sanitizedFilename);

  // Write file securely
  fs.writeFileSync(filePath, buffer, { mode: 0o644 });

  logger.info(`[ImageStorage] Saved menu image: ${sanitizedFilename} (${buffer.length} bytes, ${detectedMime})`);

  return {
    url: `/uploads/menu/${sanitizedFilename}`,
    filename: sanitizedFilename,
    sizeBytes: buffer.length,
    mimeType: detectedMime,
  };
};
