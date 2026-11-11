import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase client – expects VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * LiveActionFeed – right‑side terminal‑style panel.
 * Shows the dispatch algorithm’s actions in real time via Supabase Realtime.
 */
const LiveActionFeed = () => {
  const [logs, setLogs] = useState([]);
  const containerRef = useRef(null);

  // -----------------------------------------------------------------
  // Initialise: fetch recent logs and subscribe to new inserts.
  // -----------------------------------------------------------------
  useEffect(() => {
    // Fetch the most recent logs (optional, limit to e.g., 100 rows)
    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from("dispatch_log")
        .select("created_at,message")
        .order("created_at", { ascending: true })
        .limit(100);
      if (!error && data) {
        const initial = data.map((row) =>
          `[${new Date(row.created_at).toLocaleTimeString()}] ${row.message}`
        );
        setLogs(initial);
      }
    };
    fetchInitial();

    // Subscribe to new INSERT events
    const subscription = supabase
      .from("dispatch_log")
      .on("INSERT", (payload) => {
        const newEntry = payload.new;
        const line = `[${new Date(newEntry.created_at).toLocaleTimeString()}] ${newEntry.message}`;
        setLogs((prev) => [...prev, line]);
      })
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeSubscription(subscription);
    };
  }, []);

  // Auto‑scroll to bottom whenever logs change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-black rounded-lg h-full flex flex-col">
      <div className="px-4 py-2 bg-gray-800 text-gray-200 font-medium">
        Live Action Feed
      </div>
      <div
        ref={containerRef}
        className="flex-1 p-4 overflow-y-auto text-green-400 font-mono text-sm"
      >
        {logs.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </div>
    </div>
  );
};

export default LiveActionFeed;
