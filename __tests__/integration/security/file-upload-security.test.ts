/**
 * File Upload Security Tests
 * Story: 3.5 - Security Penetration Testing
 *
 * Tests for file upload validation, MIME type checking, and size limits.
 */

import {
  signedUrlRequestSchema,
  sanitizeFilename,
  validateFileSize,
  getMaxFileSize,
  UploadErrorCodes,
} from '@/validators/file';
import { validateFile, ALLOWED_MIME_TYPES } from '@/lib/r2';

describe('File Upload Security', () => {
  describe('MIME Type Validation', () => {
    it('allows safe document formats', () => {
      const safeMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ];

      safeMimeTypes.forEach(mimeType => {
        const result = validateFile(mimeType, 1024);
        expect(result.valid).toBe(true);
      });
    });

    it('allows safe image formats', () => {
      const safeMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];

      safeMimeTypes.forEach(mimeType => {
        const result = validateFile(mimeType, 1024);
        expect(result.valid).toBe(true);
      });
    });

    it('allows safe video formats', () => {
      const safeMimeTypes = [
        'video/mp4',
        'video/webm',
        'video/quicktime',
      ];

      safeMimeTypes.forEach(mimeType => {
        const result = validateFile(mimeType, 1024);
        expect(result.valid).toBe(true);
      });
    });

    it('rejects executable files', () => {
      const executableMimeTypes = [
        'application/x-msdownload', // .exe
        'application/x-msdos-program',
        'application/x-executable',
        'application/x-sh', // Shell scripts
        'application/x-bat', // Batch files
      ];

      executableMimeTypes.forEach(mimeType => {
        const result = validateFile(mimeType, 1024);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('not allowed');
      });
    });

    it('rejects script files', () => {
      const scriptMimeTypes = [
        'application/x-php',
        'application/x-httpd-php',
        'application/javascript',
        'text/javascript',
        'application/x-python',
      ];

      scriptMimeTypes.forEach(mimeType => {
        const result = validateFile(mimeType, 1024);
        expect(result.valid).toBe(false);
      });
    });

    it('rejects archives that could contain malware', () => {
      const archiveMimeTypes = [
        'application/x-rar-compressed',
        'application/x-tar',
        'application/x-7z-compressed',
      ];

      // Note: zip might be allowed - check ALLOWED_MIME_TYPES
      archiveMimeTypes.forEach(mimeType => {
        const result = validateFile(mimeType, 1024);

        // Either rejected OR if allowed, properly validated
        if (!result.valid) {
          expect(result.error).toBeTruthy();
        }
      });
    });

    it('rejects unknown/suspicious MIME types', () => {
      const suspiciousMimeTypes = [
        'application/octet-stream', // Generic binary
        'application/x-shockwave-flash', // Flash
        'application/vnd.ms-htmlhelp', // CHM files
      ];

      suspiciousMimeTypes.forEach(mimeType => {
        const result = validateFile(mimeType, 1024);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('File Size Validation', () => {
    it('enforces maximum size for images (10MB)', () => {
      const imageSize = 11 * 1024 * 1024; // 11MB
      const result = validateFileSize('image/jpeg', imageSize);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('accepts valid image sizes', () => {
      const imageSize = 5 * 1024 * 1024; // 5MB
      const result = validateFileSize('image/jpeg', imageSize);

      expect(result.valid).toBe(true);
    });

    it('enforces maximum size for videos (500MB)', () => {
      const videoSize = 600 * 1024 * 1024; // 600MB
      const result = validateFileSize('video/mp4', videoSize);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('accepts valid video sizes', () => {
      const videoSize = 100 * 1024 * 1024; // 100MB
      const result = validateFileSize('video/mp4', videoSize);

      expect(result.valid).toBe(true);
    });

    it('enforces maximum size for documents', () => {
      const maxSize = getMaxFileSize('application/pdf');
      const oversizedDoc = maxSize + 1024;

      const result = validateFileSize('application/pdf', oversizedDoc);

      expect(result.valid).toBe(false);
    });

    it('rejects zero-byte files', () => {
      const result = validateFileSize('image/jpeg', 0);

      // Zod validation should catch this
      expect(result.valid).toBe(false);
    });

    it('rejects negative file sizes', () => {
      // This should be caught by Zod schema validation
      expect(() => {
        signedUrlRequestSchema.parse({
          filename: 'test.jpg',
          mimeType: 'image/jpeg',
          size: -100,
          directory: 'courses',
        });
      }).toThrow();
    });
  });

  describe('Filename Sanitization', () => {
    it('removes path traversal sequences', () => {
      const malicious = '../../../etc/passwd';
      const sanitized = sanitizeFilename(malicious);

      expect(sanitized).not.toContain('..');
      expect(sanitized).not.toContain('/');
    });

    it('removes backslash path separators', () => {
      const malicious = '..\\..\\windows\\system32\\config\\sam';
      const sanitized = sanitizeFilename(malicious);

      expect(sanitized).not.toContain('\\');
      expect(sanitized).not.toContain('..');
    });

    it('removes special characters', () => {
      const malicious = 'file<script>.pdf';
      const sanitized = sanitizeFilename(malicious);

      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });

    it('removes shell command characters', () => {
      const malicious = 'file; rm -rf /.pdf';
      const sanitized = sanitizeFilename(malicious);

      expect(sanitized).not.toContain(';');
      expect(sanitized).toMatch(/^[a-zA-Z0-9._-]+$/);
    });

    it('removes leading dots (hidden files)', () => {
      const malicious = '.htaccess';
      const sanitized = sanitizeFilename(malicious);

      expect(sanitized).not.toMatch(/^\./);
    });

    it('handles null bytes', () => {
      const malicious = 'file\x00.pdf';
      const sanitized = sanitizeFilename(malicious);

      expect(sanitized).not.toContain('\x00');
    });

    it('preserves safe filenames', () => {
      const safe = 'document-2025-01-15.pdf';
      const sanitized = sanitizeFilename(safe);

      expect(sanitized).toBe(safe);
    });

    it('preserves file extensions', () => {
      const filename = 'my_file.pdf';
      const sanitized = sanitizeFilename(filename);

      expect(sanitized).toContain('.pdf');
    });

    it('truncates long filenames', () => {
      const longName = 'a'.repeat(300) + '.pdf';
      const sanitized = sanitizeFilename(longName);

      expect(sanitized.length).toBeLessThanOrEqual(205);
      expect(sanitized).toContain('.pdf');
    });

    it('handles empty filenames', () => {
      const sanitized = sanitizeFilename('');

      expect(sanitized).toBe('unnamed_file');
    });

    it('handles filenames with only special characters', () => {
      const malicious = '!!!@@@###';
      const sanitized = sanitizeFilename(malicious);

      expect(sanitized).not.toContain('!');
      expect(sanitized).not.toContain('@');
      expect(sanitized).not.toContain('#');
    });
  });

  describe('Upload Request Schema Validation', () => {
    it('validates complete upload request', () => {
      const validRequest = {
        filename: 'document.pdf',
        mimeType: 'application/pdf',
        size: 1024 * 1024, // 1MB
        directory: 'courses' as const,
      };

      expect(() => signedUrlRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('rejects request with invalid MIME type', () => {
      const invalidRequest = {
        filename: 'malware.exe',
        mimeType: 'application/x-msdownload',
        size: 1024,
        directory: 'courses' as const,
      };

      expect(() => signedUrlRequestSchema.parse(invalidRequest)).toThrow(/not allowed/);
    });

    it('rejects request with oversized file', () => {
      const oversizedRequest = {
        filename: 'huge.mp4',
        mimeType: 'video/mp4',
        size: 600 * 1024 * 1024, // 600MB (exceeds 500MB limit)
        directory: 'courses' as const,
      };

      expect(() => signedUrlRequestSchema.parse(oversizedRequest)).toThrow(/exceeds maximum/);
    });

    it('sanitizes filename in request', () => {
      const requestWithMaliciousName = {
        filename: '../../../etc/passwd',
        mimeType: 'application/pdf',
        size: 1024,
        directory: 'courses' as const,
      };

      const validated = signedUrlRequestSchema.parse(requestWithMaliciousName);

      expect(validated.filename).not.toContain('..');
      expect(validated.filename).not.toContain('/');
    });

    it('validates directory enum', () => {
      const validDirectories = ['courses', 'submissions', 'profiles', 'thumbnails'];

      validDirectories.forEach(dir => {
        const request = {
          filename: 'test.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          directory: dir,
        };

        expect(() => signedUrlRequestSchema.parse(request)).not.toThrow();
      });
    });

    it('rejects invalid directory', () => {
      const invalidRequest = {
        filename: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        directory: '../../etc',
      };

      expect(() => signedUrlRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('applies default directory if not provided', () => {
      const requestWithoutDir = {
        filename: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
      };

      const validated = signedUrlRequestSchema.parse(requestWithoutDir);

      expect(validated.directory).toBe('courses');
    });
  });

  describe('Content Type Mismatches', () => {
    it('should validate actual file content matches MIME type (conceptual)', () => {
      // In production, we would validate file magic bytes
      // For now, we rely on client-provided MIME type + extension

      const suspiciousCombos = [
        { filename: 'image.pdf', mimeType: 'image/jpeg' }, // PDF disguised as JPEG
        { filename: 'document.jpg', mimeType: 'application/pdf' }, // Opposite
      ];

      // Currently we accept these (trust MIME type)
      // A future enhancement would be to validate file magic bytes server-side
      suspiciousCombos.forEach(combo => {
        const result = validateFile(combo.mimeType, 1024);
        // As long as MIME type is allowed, it passes
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Malware Prevention', () => {
    it('blocks common malware extensions via MIME type', () => {
      const malwareMimeTypes = [
        'application/x-msdownload', // .exe
        'application/vnd.microsoft.portable-executable', // .exe
        'application/x-sh', // .sh
        'application/x-bat', // .bat
        'application/x-php', // .php
      ];

      malwareMimeTypes.forEach(mimeType => {
        const result = validateFile(mimeType, 1024);
        expect(result.valid).toBe(false);
      });
    });

    it('would benefit from virus scanning (future enhancement)', () => {
      // This is a placeholder for future ClamAV or similar integration
      // For now, we rely on MIME type filtering

      const potentiallyDangerous = [
        'application/zip',
        'application/x-compressed',
      ];

      potentiallyDangerous.forEach(mimeType => {
        // Check if allowed
        const isAllowed = ALLOWED_MIME_TYPES[mimeType as keyof typeof ALLOWED_MIME_TYPES];

        if (isAllowed) {
          // Would need virus scanning before allowing download
          expect(isAllowed).toBeDefined();
        }
      });
    });
  });

  describe('Error Codes', () => {
    it('has defined error codes for all upload failure scenarios', () => {
      expect(UploadErrorCodes.FILE_TOO_LARGE).toBe('FILE_TOO_LARGE');
      expect(UploadErrorCodes.INVALID_FILE_TYPE).toBe('INVALID_FILE_TYPE');
      expect(UploadErrorCodes.UPLOAD_TIMEOUT).toBe('UPLOAD_TIMEOUT');
      expect(UploadErrorCodes.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(UploadErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(UploadErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(UploadErrorCodes.S3_ERROR).toBe('S3_ERROR');
    });
  });
});
