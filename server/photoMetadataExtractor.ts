/**
 * VeriShield AI — Optical & Synthetic Media Metadata Forensic Parser
 * Extracts EXIF headers, camera hardware profiles, and AI generator signatures
 * from raw JPEG, PNG, and WebP byte buffers without external binary dependencies.
 */

export interface ExtractedImageMetadata {
  hasExif: boolean;
  cameraMake?: string;
  cameraModel?: string;
  software?: string;
  lens?: string;
  iso?: string | number;
  exposureTime?: string;
  fNumber?: string | number;
  dateTimeOriginal?: string;
  aiSignaturesDetected: string[];
  colorSpace?: string;
  imageFormat: 'JPEG' | 'PNG' | 'WEBP' | 'UNKNOWN';
}

const CAMERA_MAKERS = [
  'apple', 'canon', 'nikon', 'sony', 'samsung', 'google', 'fujifilm',
  'panasonic', 'olympus', 'leica', 'hasselblad', 'xiaomi', 'oneplus',
  'motorola', 'oppo', 'vivo', 'huawei'
];

const AI_MARKERS = [
  'midjourney', 'stable diffusion', 'comfyui', 'dall-e', 'flux.1',
  'novelai', 'automatic1111', 'invokeai', 'civitai', 'dreamstudio',
  'adobe firefly', 'craiyon', 'bing image creator', 'sdxl', 'checkpoint:'
];

export function extractImageMetadata(base64Data: string): ExtractedImageMetadata {
  const result: ExtractedImageMetadata = {
    hasExif: false,
    aiSignaturesDetected: [],
    imageFormat: 'UNKNOWN'
  };

  try {
    const cleanBase64 = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
    const buffer = Buffer.from(cleanBase64, 'base64');

    if (buffer.length < 16) return result;

    // Detect format
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      result.imageFormat = 'JPEG';
    } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      result.imageFormat = 'PNG';
    } else if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      result.imageFormat = 'WEBP';
    }

    // Convert leading chunk to string to scan for metadata tags
    // Most EXIF & AI parameters are in the first 64KB - 256KB
    const searchLimit = Math.min(buffer.length, 262144);
    const headerStr = buffer.toString('latin1', 0, searchLimit);
    const lowerHeader = headerStr.toLowerCase();

    // Check for AI signatures in text chunks / comment headers
    for (const marker of AI_MARKERS) {
      if (lowerHeader.includes(marker)) {
        result.aiSignaturesDetected.push(marker);
      }
    }

    // Check for Stable Diffusion prompt parameters syntax: e.g. "Steps: 20, Sampler: Euler a, CFG scale: 7"
    if (lowerHeader.includes('steps:') && lowerHeader.includes('sampler:') && lowerHeader.includes('cfg scale:')) {
      result.aiSignaturesDetected.push('Stable Diffusion / Automatic1111 Generation Parameters');
    }

    // Check for ComfyUI workflow JSON
    if (lowerHeader.includes('comfyui') || (lowerHeader.includes('nodes') && lowerHeader.includes('ksampler'))) {
      result.aiSignaturesDetected.push('ComfyUI Neural Workflow Node Graph');
    }

    // Check for Exif in JPEG (APP1 marker 0xFFE1 followed by 'Exif\0\0')
    const exifIdx = lowerHeader.indexOf('exif\0\0');
    if (exifIdx !== -1) {
      result.hasExif = true;

      // Scan for Camera Maker
      for (const maker of CAMERA_MAKERS) {
        if (lowerHeader.includes(maker)) {
          result.cameraMake = maker.charAt(0).toUpperCase() + maker.slice(1);
          break;
        }
      }

      // Check specific popular models
      if (lowerHeader.includes('iphone')) {
        const match = headerStr.match(/iPhone\s*[\w\s,]+/i);
        result.cameraModel = match ? match[0].slice(0, 24).trim() : 'Apple iPhone';
        result.cameraMake = 'Apple';
      } else if (lowerHeader.includes('pixel')) {
        const match = headerStr.match(/Pixel\s*[\w\s]+/i);
        result.cameraModel = match ? match[0].slice(0, 20).trim() : 'Google Pixel';
        result.cameraMake = 'Google';
      } else if (lowerHeader.includes('galaxy') || lowerHeader.includes('sm-')) {
        result.cameraModel = 'Samsung Galaxy Camera';
        result.cameraMake = 'Samsung';
      } else if (lowerHeader.includes('eos')) {
        const match = headerStr.match(/EOS\s*[\w\s]+/i);
        result.cameraModel = match ? match[0].slice(0, 20).trim() : 'Canon EOS DSLR';
        result.cameraMake = 'Canon';
      } else if (lowerHeader.includes('ilce') || lowerHeader.includes('alpha')) {
        result.cameraModel = 'Sony Alpha Mirrorless';
        result.cameraMake = 'Sony';
      }

      // Date Time Original (YYYY:MM:DD HH:MM:SS)
      const dateMatch = headerStr.match(/(\d{4}:\d{2}:\d{2}\s\d{2}:\d{2}:\d{2})/);
      if (dateMatch) {
        result.dateTimeOriginal = dateMatch[1];
      }
    }

  } catch (err) {
    console.warn('Metadata extraction non-fatal error:', err);
  }

  return result;
}
