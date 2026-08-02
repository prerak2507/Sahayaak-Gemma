import type { Metadata } from 'next';

import './globals.css';
import { Providers } from './providers';
import { GlobalCitySync } from '@/components/shared/GlobalCitySync';


export const metadata: Metadata = {
  title: 'Sahaayak — civic reporting for Rajkot, in your own language',
  description:
    'Report a civic problem in Gujarati, Hindi or English, by voice, photo or text. Gemma 4 runs on the corporation’s own hardware to understand it, route it to the right RMC department and track it to closure.',
  keywords: ['Rajkot', 'civic', 'municipal', 'Gujarati', 'Gemma', 'volunteer', 'NGO', 'RMC'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Mukta:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet" />
          <link
            rel="stylesheet"
            href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            crossOrigin=""
          />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          {children}
          <GlobalCitySync />
        </Providers>
      </body>
    </html>
  );
}
