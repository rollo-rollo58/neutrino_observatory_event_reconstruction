import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Borealis Array | Neutrino Event Workbench',
  description: 'Research telescope telemetry and photon arrival reconstruction',
};

export default function RootLayout({ children }: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-abyss font-sans text-slate-100">
        {children}
      </body>
    </html>
  );
}
