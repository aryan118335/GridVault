import { useEffect, useState } from 'react';
import { Bell, Menu, Search } from 'lucide-react';

export default function Header({ onOpenMobileSidebar, searchQuery, onSearchChange }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
  });
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/95 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile toggle & Search bar */}
      <div className="flex flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:text-white lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search grid telemetry, solar, wind..."
            className="w-full rounded-lg border border-slate-700/80 bg-slate-800/80 py-1.5 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-400 outline-none transition-colors focus:border-teal-400/70 focus:bg-slate-800"
          />
        </div>
      </div>

      {/* Right: Notification Bell, System Status Stable Badge & Live Clock */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative hidden rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white sm:inline-flex"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sky-400" />
        </button>

        <div className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
          <span>System Status: Stable</span>
        </div>

        <div className="hidden border-l border-slate-700/80 pl-4 font-mono text-xs text-slate-300 md:block">
          <span>
            {formattedDate}, {formattedTime}
          </span>
        </div>
      </div>
    </header>
  );
}
