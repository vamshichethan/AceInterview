import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'AceInterview.ai — Ace Every Interview.',
  description:
    'Ace every technical interview with real-time AI mock interviews, resume ATS scoring, interview skills rating, career role fit, and direct job applications.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 radial-mesh selection:bg-indigo-500/30 selection:text-indigo-200 antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="border-t border-slate-900/90 py-6 px-4 text-center text-xs text-slate-500 bg-slate-950/60 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="AceInterview.ai" className="w-5 h-5 rounded object-cover" />
                <span className="font-bold text-slate-300">AceInterview.ai</span>
                <span className="text-slate-500">&mdash; Ace Every Interview. &copy; {new Date().getFullYear()}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  AI Engine Online
                </span>
                <span>Sub-Second Speech Engine</span>
                <span>Calibrated Hiring Rubrics</span>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}

