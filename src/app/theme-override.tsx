'use client'

// This component provides global styling overrides to ensure dark mode text visibility
export default function ThemeOverride() {
  return (
    <style jsx global>{`
      /* Force all text to be white for visibility */
      * {
        color: white !important;
      }
      
      /* Target all card-like elements */
      div[class*="card"],
      div[class*="box"],
      div[class*="container"],
      .bg-card-bg,
      section,
      article,
      aside,
      .rounded-lg,
      .shadow {
        background-color: rgba(255, 255, 255, 0.2) !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3) !important;
      }
      
      /* Ensure headings stand out */
      h1, h2, h3, h4, h5, h6 {
        color: white !important;
        font-weight: 700 !important;
      }
      
      /* Text elements */
      p, span, div, a, button, label {
        color: white !important;
      }
      
      /* Icons */
      svg, [class*="icon"] {
        color: white !important;
        fill: white !important;
      }
    `}</style>
  )
}
