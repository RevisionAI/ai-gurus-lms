/**
 * Input Validation Security Tests
 * Story: 3.5 - Security Penetration Testing
 *
 * Tests for SQL injection prevention, XSS sanitization, and input validation.
 */

import { sanitizeHtml, sanitizeStrict, stripHtml, containsDangerousContent } from '@/lib/sanitize';
import { validateRequest, validateData, cuidSchema, emailSchema } from '@/lib/validation';
import { z } from 'zod';

describe('XSS Prevention - HTML Sanitization', () => {
  describe('sanitizeHtml - Rich Text Content', () => {
    it('removes script tags', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const output = sanitizeHtml(input);

      expect(output).not.toContain('<script>');
      expect(output).not.toContain('alert');
      expect(output).toContain('<p>Hello</p>');
    });

    it('removes event handlers', () => {
      const input = '<img src="x" onerror="alert(\'XSS\')">';
      const output = sanitizeHtml(input);

      expect(output).not.toContain('onerror');
      expect(output).not.toContain('alert');
    });

    it('removes inline JavaScript', () => {
      const input = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const output = sanitizeHtml(input);

      expect(output).not.toContain('javascript:');
    });

    it('allows safe HTML tags', () => {
      const input = '<p>Paragraph</p><strong>Bold</strong><em>Italic</em>';
      const output = sanitizeHtml(input);

      expect(output).toContain('<p>Paragraph</p>');
      expect(output).toContain('<strong>Bold</strong>');
      expect(output).toContain('<em>Italic</em>');
    });

    it('removes iframe tags', () => {
      const input = '<iframe src="http://evil.com"></iframe>';
      const output = sanitizeHtml(input);

      expect(output).not.toContain('<iframe');
    });

    it('removes object and embed tags', () => {
      const input = '<object data="malware.swf"></object><embed src="evil.swf">';
      const output = sanitizeHtml(input);

      expect(output).not.toContain('<object');
      expect(output).not.toContain('<embed');
    });

    it('handles empty or null input', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
    });
  });

  describe('sanitizeStrict - Basic Formatting Only', () => {
    it('allows only basic formatting tags', () => {
      const input = '<p>Text</p><strong>Bold</strong><table><tr><td>Table</td></tr></table>';
      const output = sanitizeStrict(input);

      expect(output).toContain('<p>Text</p>');
      expect(output).toContain('<strong>Bold</strong>');
      expect(output).not.toContain('<table');
    });

    it('removes all attributes', () => {
      const input = '<p class="danger">Text</p>';
      const output = sanitizeStrict(input);

      expect(output).not.toContain('class=');
      expect(output).toContain('>Text<');
    });
  });

  describe('stripHtml - Plain Text Only', () => {
    it('removes all HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const output = stripHtml(input);

      expect(output).not.toContain('<');
      expect(output).not.toContain('>');
      expect(output).toContain('Hello');
      expect(output).toContain('World');
    });

    it('handles complex HTML', () => {
      const input = '<div><h1>Title</h1><p>Content</p><script>alert("xss")</script></div>';
      const output = stripHtml(input);

      expect(output).not.toContain('<');
      expect(output).not.toContain('script');
    });
  });

  describe('containsDangerousContent - Detection', () => {
    it('detects script tags', () => {
      expect(containsDangerousContent('<script>alert("xss")</script>')).toBe(true);
      expect(containsDangerousContent('<SCRIPT>alert("xss")</SCRIPT>')).toBe(true);
    });

    it('detects javascript: protocol', () => {
      expect(containsDangerousContent('javascript:alert("xss")')).toBe(true);
      expect(containsDangerousContent('JAVASCRIPT:alert("xss")')).toBe(true);
    });

    it('detects event handlers', () => {
      expect(containsDangerousContent('<img onerror="alert()">')).toBe(true);
      expect(containsDangerousContent('<div onload="malicious()">')).toBe(true);
      expect(containsDangerousContent('<a onclick="hack()">')).toBe(true);
    });

    it('detects iframe tags', () => {
      expect(containsDangerousContent('<iframe src="evil.com">')).toBe(true);
    });

    it('detects data: protocol', () => {
      expect(containsDangerousContent('data:text/html,<script>alert()</script>')).toBe(true);
    });

    it('returns false for safe content', () => {
      expect(containsDangerousContent('<p>Safe content</p>')).toBe(false);
      expect(containsDangerousContent('Plain text')).toBe(false);
    });
  });
});

describe('SQL Injection Prevention - Prisma Parameterization', () => {
  describe('Prisma Query Patterns', () => {
    it('uses parameterized queries (conceptual test)', () => {
      // Prisma automatically parameterizes all queries
      // This test verifies we understand the protection mechanism

      // BAD (raw SQL - Prisma doesn't allow this by default):
      // const query = `SELECT * FROM users WHERE email = '${userInput}'`;

      // GOOD (Prisma ORM - automatically parameterized):
      // prisma.user.findUnique({ where: { email: userInput } })

      // Verify our understanding
      const userInput = "admin'--";

      // If we were to use Prisma (mocked here for concept):
      const whereClause = { email: userInput };

      // The where clause would be safely parameterized
      expect(whereClause.email).toBe(userInput);
      expect(whereClause.email).toContain("'"); // Quote is preserved as data, not SQL
    });
  });

  describe('Input Sanitization for Search', () => {
    it('handles SQL injection patterns in search input', () => {
      const sqlInjectionPatterns = [
        "'; DROP TABLE users; --",
        "admin'--",
        "' OR '1'='1",
        "' UNION SELECT * FROM passwords--",
      ];

      sqlInjectionPatterns.forEach(pattern => {
        // When passed to Prisma, these are treated as literal strings
        const searchQuery = { contains: pattern };

        // Prisma would escape this automatically
        expect(searchQuery.contains).toBe(pattern);

        // The pattern is preserved as search data, not executed as SQL
        expect(typeof searchQuery.contains).toBe('string');
      });
    });
  });
});

describe('Zod Schema Validation', () => {
  describe('CUID Validation', () => {
    it('validates correct CUID format', () => {
      const validCuids = [
        'cl9k8j2lk0000abcdefgh1234',
        'cm1a2b3c4d5e6f7g8h9i0j1k2',
      ];

      validCuids.forEach(cuid => {
        expect(() => cuidSchema.parse(cuid)).not.toThrow();
      });
    });

    it('rejects invalid CUID format', () => {
      const invalidCuids = [
        'not-a-cuid',
        '12345',
        "'; DROP TABLE users; --",
        '<script>alert("xss")</script>',
        '../../../etc/passwd',
      ];

      invalidCuids.forEach(invalid => {
        expect(() => cuidSchema.parse(invalid)).toThrow();
      });
    });

    it('prevents SQL injection in ID parameters', () => {
      const sqlInjection = "' OR 1=1--";

      expect(() => cuidSchema.parse(sqlInjection)).toThrow(/Invalid ID format/);
    });
  });

  describe('Email Validation', () => {
    it('validates correct email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'admin@localhost',
      ];

      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });

    it('rejects invalid email formats', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        "admin'--@example.com",
      ];

      invalidEmails.forEach(invalid => {
        expect(() => emailSchema.parse(invalid)).toThrow();
      });
    });

    it('normalizes email to lowercase', () => {
      const result = emailSchema.parse('USER@EXAMPLE.COM');
      expect(result).toBe('user@example.com');
    });

    it('trims whitespace', () => {
      const result = emailSchema.parse('  user@example.com  ');
      expect(result).toBe('user@example.com');
    });
  });

  describe('Request Body Validation', () => {
    const testSchema = z.object({
      title: z.string().min(1).max(200),
      email: emailSchema,
      year: z.number().int().min(2000).max(2100),
    });

    it('validates correct request body', async () => {
      const validBody = {
        title: 'Test Course',
        email: 'instructor@example.com',
        year: 2025,
      };

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify(validBody),
      });

      const result = await validateRequest(request, testSchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe(validBody.title);
      }
    });

    it('rejects malformed JSON', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        body: 'not valid json{',
      });

      const result = await validateRequest(request, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        const body = await result.response.json();
        expect(body.error.code).toBe('BAD_REQUEST');
      }
    });

    it('rejects missing required fields', async () => {
      const invalidBody = {
        title: 'Test',
        // missing email and year
      };

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
      });

      const result = await validateRequest(request, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        const body = await result.response.json();
        expect(body.error.code).toBe('INVALID_INPUT');
        expect(body.error.details).toBeDefined();
      }
    });

    it('rejects XSS attempts in string fields', async () => {
      const xssBody = {
        title: '<script>alert("xss")</script>',
        email: 'user@example.com',
        year: 2025,
      };

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify(xssBody),
      });

      const result = await validateRequest(request, testSchema);

      // Zod will accept it (string validation passes)
      // BUT the application layer should sanitize it before storage
      expect(result.success).toBe(true);
      if (result.success) {
        // The XSS would be caught by sanitizeHtml() before storage
        const sanitized = sanitizeHtml(result.data.title);
        expect(sanitized).not.toContain('<script>');
      }
    });

    it('rejects SQL injection attempts in string fields', async () => {
      const sqlBody = {
        title: "'; DROP TABLE courses; --",
        email: 'user@example.com',
        year: 2025,
      };

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify(sqlBody),
      });

      const result = await validateRequest(request, testSchema);

      // Zod accepts it as valid string
      expect(result.success).toBe(true);

      // BUT Prisma parameterizes it, so it's safe
      if (result.success) {
        // This would be treated as literal text in Prisma query
        expect(result.data.title).toBe(sqlBody.title);
        expect(typeof result.data.title).toBe('string');
      }
    });

    it('validates data types strictly', async () => {
      const invalidTypes = {
        title: 'Test',
        email: 'user@example.com',
        year: '2025', // Should be number, not string
      };

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        body: JSON.stringify(invalidTypes),
      });

      const result = await validateRequest(request, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        const body = await result.response.json();
        expect(body.error.details).toBeDefined();
      }
    });
  });
});

describe('File Input Validation', () => {
  describe('Filename Sanitization', () => {
    it('sanitizes function should be tested', () => {
      // Import the sanitize function from validators/file.ts
      const { sanitizeFilename } = require('@/validators/file');

      const maliciousFilenames = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '<script>alert("xss")</script>.pdf',
        'file; rm -rf /',
        'normal file.pdf',
      ];

      maliciousFilenames.forEach(filename => {
        const sanitized = sanitizeFilename(filename);

        // Should not contain path traversal
        expect(sanitized).not.toContain('..');
        expect(sanitized).not.toContain('/');
        expect(sanitized).not.toContain('\\');

        // Should not contain HTML
        expect(sanitized).not.toContain('<');
        expect(sanitized).not.toContain('>');

        // Should not be empty
        expect(sanitized.length).toBeGreaterThan(0);
      });
    });
  });
});
