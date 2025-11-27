/**
 * TypeScript declaration for TinyMCE global
 */

type TinyMCEInstance = Record<string, unknown>;

interface Window {
  tinymce: TinyMCEInstance | undefined;
}
