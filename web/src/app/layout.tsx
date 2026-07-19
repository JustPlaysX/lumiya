import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lumiya — Der moderne Discord-Verwaltungsbot',
  description:
    'Lumiya bringt Moderation, AutoMod, Leveling, Willkommensnachrichten, Tickets und starken Anti-Raid-/Honeypot-Schutz auf deinen Server.',
  openGraph: {
    title: 'Lumiya — Discord-Verwaltungsbot',
    description: 'Moderation, Leveling, Tickets & Anti-Raid — alles in einem Bot.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
