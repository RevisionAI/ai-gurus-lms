'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import styles from './RichTextEditor.module.css'

// Dynamically import TinyMCE to prevent SSR issues
const Editor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), {
  ssr: false,
})

interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
  height?: number
}

export default function RichTextEditor({ value, onChange, height = 300 }: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Return a placeholder div during SSR or before hydration
  if (!mounted) {
    return (
      <div className={styles.editorContainer} style={{ height: `${height}px` }}>
        <div className="p-4 text-gray-500">Loading editor...</div>
      </div>
    )
  }

  // Define high-contrast CSS to be injected when editor initializes
  const highContrastCSS = `
    /* Editor border and background */
    .tox-tinymce { 
      border: 3px solid #000000 !important; 
      border-radius: 4px !important;
    }
    .tox-editor-container { background: #fff !important; }
    
    /* Menubar styling */
    .tox-menubar { 
      background-color: #f0f0f0 !important; 
      border-bottom: 2px solid #000000 !important;
      padding: 4px !important;
    }
    .tox-mbtn { 
      color: #000000 !important; 
      font-weight: bold !important;
      background-color: #ffffff !important;
      border: 2px solid #666666 !important;
      margin: 2px !important;
    }
    .tox-mbtn:hover { background-color: #dddddd !important; }
    .tox-mbtn--active { background-color: #cccccc !important; }
    
    /* Toolbar styling */
    .tox-toolbar, .tox-toolbar__primary, .tox-toolbar__overflow { 
      background-color: #f0f0f0 !important; 
      border-bottom: 2px solid #000000 !important;
      padding: 4px !important;
    }
    
    /* Toolbar buttons */
    .tox-tbtn {
      color: #000000 !important;
      margin: 2px !important;
      border: 2px solid #666666 !important;
      background-color: #ffffff !important;
    }
    .tox-tbtn:hover { 
      background-color: #dddddd !important; 
      border-color: #000000 !important; 
    }
    .tox-tbtn--enabled, .tox-tbtn--active { 
      background-color: #cccccc !important; 
      border-color: #333333 !important;
    }
    
    /* SVG icons */
    .tox-tbtn svg, .tox-mbtn svg { 
      fill: #000000 !important; 
    }
    
    /* Dropdown button text */
    .tox-tbtn__select-label { 
      color: #000000 !important; 
      font-weight: bold !important; 
    }
    
    /* Status bar */
    .tox-statusbar { 
      background-color: #f0f0f0 !important; 
      border-top: 1px solid #000000 !important;
      color: #000000 !important;
    }
    
    /* Dialog styling */
    .tox-dialog { background-color: #ffffff !important; }
    .tox-dialog__header { background-color: #f0f0f0 !important; }
    .tox-dialog__title { color: #000000 !important; }
    .tox-dialog__body-content { color: #000000 !important; }
    .tox-label { color: #000000 !important; }
    
    /* Dialog buttons */
    .tox-button { 
      background-color: #2563eb !important; 
      color: #ffffff !important; 
      border-color: #2563eb !important; 
      font-weight: 600 !important; 
    }
    .tox-button--secondary { 
      background-color: #ffffff !important; 
      color: #000000 !important; 
      border-color: #000000 !important; 
    }
    
    /* Content area */
    .mce-content-body { 
      color: #000000 !important; 
      background-color: #ffffff !important; 
    }
  `;

  return (
    <div className={styles.editorWrapper}>
      <Editor
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
        init={{
          height,
          menubar: true,
          // Using minimal set of core plugins to avoid loading errors
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 
            'searchreplace', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | formatselect | ' +
            'bold italic underline | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'link image | removeformat | help',
          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif; font-size: 16px; color: #000000; background-color: #FFFFFF; line-height: 1.6; padding: 12px; }',
          // High contrast settings
          skin: 'oxide',
          icons: 'default',
          toolbar_sticky: true,
          toolbar_mode: 'wrap',
          statusbar: true,
          resize: true,
          
          setup: function(editor) {
            // Add error handling for plugin loading
            editor.on('PluginLoadError', function(e) {
              console.warn('TinyMCE plugin load error:', e.type);
            });
            
            editor.on('init', function() {
              // Apply high contrast CSS after editor loads
              if (typeof window !== 'undefined') {
                // Inject the custom CSS
                const styleTag = document.createElement('style');
                styleTag.innerHTML = highContrastCSS;
                document.head.appendChild(styleTag);
                
                // Force color on SVG elements
                setTimeout(() => {
                  const svgElements = document.querySelectorAll('.tox .tox-toolbar svg, .tox .tox-menubar svg');
                  svgElements.forEach(svg => {
                    if (svg instanceof SVGElement) {
                      svg.setAttribute('fill', '#000000');
                    }
                  });
                }, 100); // Small delay to ensure elements are rendered
              }
            });
          },
          paste_data_images: true,
          branding: false,
          promotion: false
        }}
        value={value}
        onEditorChange={onChange}
      />
    </div>
  )
}
