/**
 * TypeScript declaration for TinyMCE global
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TinyMCEInstance = Record<string, unknown>;

interface Window {
  tinymce: TinyMCEInstance | undefined;
}
