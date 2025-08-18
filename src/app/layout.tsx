import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Rap Video Studio',
  description: 'Transform your creative vision into cinematic rap music videos with AI-powered scene generation',
  keywords: ['rap', 'music video', 'AI', 'video generation', 'cinema', 'hip hop'],
  authors: [{ name: 'AI Rap Video Studio' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'AI Rap Video Studio',
    description: 'Transform your creative vision into cinematic rap music videos with AI-powered scene generation',
    type: 'website',
    siteName: 'AI Rap Video Studio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Rap Video Studio',
    description: 'Transform your creative vision into cinematic rap music videos with AI-powered scene generation',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>🎬</text></svg>" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}