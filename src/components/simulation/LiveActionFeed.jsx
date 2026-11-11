import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase client instance for realtime subscriptions
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * LiveActionFeed – Right-side hacker/command-terminal feed displaying
 * autonomous battery dispatch decisions in real time.
 * - Fetches initial logs via GET /api/simulation/logs
 * - Listens for live INSERT events on dispatch_logs via Supabase Realtime
 * - Backed by an automated 3-second polling fallback for resilient sync
 */
const LiveActionFeed = ({ refreshTrigger }) => {
  const [logs, setLogs] = useState([]);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const logContainerRef = useRef(null);

  // Format a database row into a terminal line
  const formatLogRow = (row) => {
    const time = row.created_at ? new Date(row.created_at).toLocaleTimeString() : new Date().toLocaleTimeString();
    const action = row.action || 'ACTION';
    const power = row.power_mw !== undefined ? `${parseFloat(row.power_mw).toFixed(1)}MW` : '';
    const reason = row.reason || '';
    return {
      id: row.id || Math.random(),
      text: `[${time}] ${action} ${power ? `(${power})` : ''} - ${reason}`,
      action,
      raw: row,
    };
  };

  // Fetch recent logs from API
  const fetchRecentLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/simulation/logs');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        // Reverse so chronological order flows downward in terminal
        const formatted = [...data].reverse().map(formatLogRow);
        setLogs(formatted);
      }
    } catch (err) {
      console.warn('[LiveActionFeed] Polling fetch warning:', err.message);
    }
  }, []);

  // Initial load and polling fallback every 3 seconds
  useEffect(() => {
    fetchRecentLogs();
    const pollInterval = setInterval(() => {
      fetchRecentLogs();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [fetchRecentLogs, refreshTrigger]);

  // Supabase Realtime postgres_changes subscription
  useEffect(() => {
    if (!supabase) return;

    try {
      const channel = supabase
        .channel('dispatch_logs_realtime_feed')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'dispatch_logs' },
          (payload) => {
            if (payload?.new) {
              const newEntry = formatLogRow(payload.new);
              setLogs((prev) => [...prev, newEntry].slice(-100));
            }
          }
        )
        .subscribe((status) => {
          setRealtimeActive(status === 'SUBSCRIBED');
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('[LiveActionFeed] Supabase realtime connection error:', err);
    }
  }, []);

  // Auto-scroll to bottom as new terminal entries arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-black border border-slate-700/80 rounded-xl flex flex-col h-[480px] shadow-2xl font-mono overflow-hidden">
      {/* Terminal Title Bar */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
          <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
          <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
          <span className="ml-2 text-xs font-semibold text-slate-300 tracking-wide uppercase">
            dispatch_engine.terminal
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              realtimeActive ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'
            }`}
          ></span>
          <span className="text-[11px] text-slate-400">
            {realtimeActive ? 'REALTIME ACTIVE' : 'POLLING 3s'}
          </span>
        </div>
      </div>

      {/* Terminal Content Area */}
      <div
        ref={logContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-1.5 text-xs select-text scrollbar-thin scrollbar-thumb-slate-800"
      >
        <div className="text-slate-600 mb-2">
          # GridVault Real-Time Autonomous Dispatch Feed initialized
        </div>
        {logs.length === 0 ? (
          <div className="text-slate-500 italic">Waiting for initial dispatch decisions...</div>
        ) : (
          logs.map((log) => {
            const isCharging = log.action === 'CHARGING' || log.action === 'CHARGE';
            const isDischarging = log.action === 'DISCHARGING' || log.action === 'DISCHARGE';

            return (
              <div
                key={log.id}
                className={`leading-relaxed break-words ${
                  isCharging
                    ? 'text-emerald-400'
                    : isDischarging
                    ? 'text-amber-300'
                    : 'text-cyan-300'
                }`}
              >
                <span className="text-slate-500 mr-1">&gt;</span>
                {log.text}
              </div>
            );
          })
        )}
      </div>

      {/* Terminal Status Footer */}
      <div className="px-4 py-1.5 bg-slate-950 border-t border-slate-900 text-[10px] text-slate-500 flex justify-between">
        <span>Log count: {logs.length}</span>
        <span>Supabase postgres_changes: dispatch_logs</span>
      </div>
    </div>
  );
};

export default LiveActionFeed;
