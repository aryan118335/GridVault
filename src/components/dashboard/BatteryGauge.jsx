import { BatteryCharging, Clock, HardDrive, MoreVertical } from 'lucide-react';

export default function BatteryGauge({
  soc = 78,
  capacityMwh = 14.8,
  chargingStatus = 'Charging',
  timeToFull = '2h 15m',
  overrideSoc,
  onSelectOverride,
}) {
  const clampedSoc = Math.max(0, Math.min(100, Math.round(soc)));

  // Dynamic conditional styling:
  // > 50%: Green | 20% - 50%: Yellow | < 20%: Flashing Red
  let ringColor = '#10B981';
  let textColor = 'text-emerald-400';
  let glowFilter = 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.5))';
  let flashClass = '';
  let statusBadge = chargingStatus;

  if (clampedSoc < 20) {
    ringColor = '#EF4444';
    textColor = 'text-rose-400';
    glowFilter = 'drop-shadow(0 0 16px rgba(239, 68, 68, 0.78))';
    flashClass = 'animate-pulse';
    statusBadge = 'Critical Low';
  } else if (clampedSoc <= 50) {
    ringColor = '#F59E0B';
    textColor = 'text-amber-400';
    glowFilter = 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.55))';
    statusBadge = 'Reserve Warning';
  }

  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedSoc / 100) * circumference;

  return (
    <aside
      className={`flex flex-col justify-between rounded-2xl border bg-slate-800/90 p-5 shadow-lg transition-colors ${
        clampedSoc < 20
          ? 'border-rose-500/60 shadow-[0_0_28px_-4px_rgba(239,68,68,0.35)]'
          : 'border-slate-700/80'
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Storage Reserve</h2>
        <button
          type="button"
          className="rounded p-1 text-slate-400 hover:bg-slate-700/60 hover:text-white"
          aria-label="Storage reserve options"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Circular SVG Progress Ring */}
      <div className="my-5 flex flex-col items-center justify-center">
        <div className={`relative flex items-center justify-center ${flashClass}`}>
          <svg className="h-48 w-48 -rotate-90" viewBox="0 0 200 200">
            {/* Outer background track */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="rgba(51, 65, 85, 0.55)"
              strokeWidth="12"
            />
            {/* Inner subtle ring */}
            <circle
              cx="100"
              cy="100"
              r={radius - 16}
              fill="none"
              stroke="rgba(51, 65, 85, 0.35)"
              strokeWidth="3"
            />
            {/* Active SOC arc */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                filter: glowFilter,
                transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
              }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-4xl font-bold tracking-tight text-white">
              {clampedSoc}%
            </span>
            <span className={`mt-1 text-xs font-semibold ${textColor}`}>{clampedSoc}%</span>
            <span className="mt-0.5 text-[11px] text-slate-400">Battery percentage</span>
          </div>
        </div>

        {clampedSoc < 20 && (
          <div className="mt-2 rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-rose-300 animate-pulse">
            Low Battery Alert (&lt;20%)
          </div>
        )}
      </div>

      {/* Battery Telemetry Details */}
      <div className="space-y-3 border-t border-slate-700/70 pt-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-400">
            <HardDrive className="h-4 w-4 text-slate-400" />
            Capacity
          </span>
          <span className="font-mono font-semibold text-white">{capacityMwh} MWh</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-400">
            <BatteryCharging className={`h-4 w-4 ${textColor}`} />
            Status
          </span>
          <span className={`font-semibold ${textColor}`}>{statusBadge}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-400">
            <Clock className="h-4 w-4 text-slate-400" />
            Time to full
          </span>
          <span className="font-mono font-semibold text-white">{timeToFull}</span>
        </div>
      </div>

      {/* SOC State Threshold Test Controls */}
      {onSelectOverride && (
        <div className="mt-4 flex items-center justify-between gap-1.5 border-t border-slate-700/60 pt-3">
          <span className="text-[11px] text-slate-400">Test SOC:</span>
          <div className="flex items-center gap-1">
            {[
              { label: 'Auto', val: null },
              { label: '78%', val: 78 },
              { label: '35%', val: 35 },
              { label: '15%', val: 15 },
            ].map((opt) => {
              const active = overrideSoc === opt.val;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => onSelectOverride(opt.val)}
                  className={`rounded px-2 py-0.5 font-mono text-[11px] transition-colors ${
                    active
                      ? 'bg-teal-500 text-slate-950 font-semibold'
                      : 'bg-slate-900/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
