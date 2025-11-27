/**
 * Jest Global Setup
 *
 * This file runs after Jest is initialized but before tests run.
 * It sets up global test utilities, mocks, and extended matchers.
 */

// Import Jest DOM matchers for enhanced DOM assertions
import '@testing-library/jest-dom';

// Polyfill Web APIs for Next.js server components
import { TextEncoder, TextDecoder } from 'util';

// Add Web API globals if not present
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

// Mock Request/Response for API route testing
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    url: string;
    method: string;
    headers: Headers;
    body: string | null;

    constructor(input: string | URL, init?: RequestInit) {
      this.url = typeof input === 'string' ? input : input.toString();
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this.body = init?.body as string || null;
    }

    async json() {
      return this.body ? JSON.parse(this.body) : {};
    }

    async text() {
      return this.body || '';
    }
  } as unknown as typeof Request;
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    body: unknown;
    status: number;
    headers: Headers;

    constructor(body?: BodyInit | null, init?: ResponseInit) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new Headers(init?.headers);
    }

    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
  } as unknown as typeof Response;
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    private _headers: Map<string, string> = new Map();

    constructor(init?: HeadersInit) {
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => this._headers.set(key.toLowerCase(), value));
        } else if (init instanceof Headers) {
          // @ts-expect-error - accessing private map
          init._headers.forEach((value: string, key: string) => this._headers.set(key, value));
        } else {
          Object.entries(init).forEach(([key, value]) => this._headers.set(key.toLowerCase(), value));
        }
      }
    }

    get(key: string) {
      return this._headers.get(key.toLowerCase()) || null;
    }

    set(key: string, value: string) {
      this._headers.set(key.toLowerCase(), value);
    }

    has(key: string) {
      return this._headers.has(key.toLowerCase());
    }
  } as unknown as typeof Headers;
}

// Mock Next.js navigation module
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: Record<string, unknown>) {
    // Return a plain object that represents an img element for testing
    return { type: 'img', props };
  },
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
  headers: () => new Headers(),
}));

// Global test timeout
jest.setTimeout(10000);

// Suppress console errors in tests (optional - comment out for debugging)
// const originalError = console.error;
// beforeAll(() => {
//   console.error = (...args: unknown[]) => {
//     if (
//       typeof args[0] === 'string' &&
//       args[0].includes('Warning: ReactDOM.render is no longer supported')
//     ) {
//       return;
//     }
//     originalError.call(console, ...args);
//   };
// });
// afterAll(() => {
//   console.error = originalError;
// });

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
