import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from './providers'
import ThemeOverride from './theme-override'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: "Revision AI Learning Port",
  description: "AI-powered learning platform for professionals",
  icons: {
    icon: "/Logo.png",
    shortcut: "/Logo.png",
    apple: "/Logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head></head>
      <body className="antialiased" style={{ backgroundColor: '#0f0924', overflowY: 'auto' }} suppressHydrationWarning>
        <ThemeOverride />
        <AuthProvider>
          <Toaster />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
