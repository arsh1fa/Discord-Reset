import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Trash2, 
  User, 
  MessageSquare, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Hash,
  ShieldAlert,
  Shield,
  Lock,
  ChevronRight,
  Search,
  Settings,
  LogOut,
  Globe,
  Cpu,
  Zap,
  ArrowRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfService from "./components/TermsOfService";

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

interface DMChannel {
  id: string;
  type: number;
  last_message_id: string;
  recipients: DiscordUser[];
}

interface Message {
  id: string;
  content: string;
  author: DiscordUser;
  timestamp: string;
}

export default function App() {
  const [me, setMe] = useState<DiscordUser | null>(null);
  const [dms, setDms] = useState<DMChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<DMChannel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteProgress, setDeleteProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<"app" | "pp" | "tos">("app");

  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`].slice(-50));
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const safeJson = async (res: Response) => {
    const text = await res.text();
    const contentType = res.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      try {
        return JSON.parse(text);
      } catch (e) {
        // Fallback if header says JSON but body is not
        throw new Error(`Invalid JSON: ${text.slice(0, 50)}...`);
      }
    }

    // If not JSON, it might be HTML error from proxy/server
    throw new Error(`Unexpected Response (HTTP ${res.status}): ${text.slice(0, 50)}...`);
  };

  const [serverInfo, setServerInfo] = useState<{id: string, start: string, envTokenPresent: boolean, maskedToken: string} | null>(null);

  const fetchMe = async () => {
    try {
      const res = await fetch(`/api/v2/discord/identity?v=${Date.now()}`);
      const data = await safeJson(res);

      if (res.ok) {
        setMe(data);
        setServerInfo(data._server);
        fetchDMs();
      } else {
        setMe(null);
        setServerInfo(data._server || null);
        // If the server explicitly says AUTH_REQUIRED, we know the secret is gone
        if (data.message === "AUTH_REQUIRED") {
            setError("DISCORD_TOKEN_MISSING");
        } else {
            setError(data.message || data.error?.message || "Failed to authenticate. Is your DISCORD_USER_TOKEN correct?");
        }
      }
    } catch (err) {
      setError("SERVER_UNAVAILABLE");
    }
  };

  const fetchDMs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/discord/dms");
      if (res.ok) {
        const data = await safeJson(res);
        setDms(data);
      }
    } catch (err) {
      addLog(`Error fetching DMs: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const selectChannel = async (channel: DMChannel) => {
    setSelectedChannel(channel);
    setIsLoading(true);
    setMessages([]);
    try {
      const res = await fetch(`/api/discord/channels/${channel.id}/messages?limit=100`);
      if (res.ok) {
        const data = await safeJson(res);
        setMessages(data);
      } else {
        addLog(`Failed to load messages: ${res.status}`);
      }
    } catch (err) {
      addLog(`Error fetching messages: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const stopPurge = () => {
    cancelRef.current = true;
    setIsDeleting(false);
    addLog("STOP requested. Finishing current batch...");
  };

  const filteredDMs = dms.filter(dm => {
    const recipient = dm.recipients?.[0];
    if (!recipient) return false;
    return recipient.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const [isTurbo, setIsTurbo] = useState(false);
  const [isContinuous, setIsContinuous] = useState(false);

  // Advanced Filters
  const [keywordFilter, setKeywordFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

  // Stats
  const [sessionStats, setSessionStats] = useState({
    deleted: 0,
    scanned: 0,
    errors: 0,
    startTime: Date.now()
  });
  const [uptime, setUptime] = useState(0);

  const systemWipe = () => {
    localStorage.clear();
    sessionStorage.clear();
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    // Advanced: Clear indexedDB for absolute wipe
    if (window.indexedDB && (window.indexedDB as any).databases) {
      (window.indexedDB as any).databases().then((databases: any[]) => {
        databases.forEach((db: any) => {
          if (db.name) window.indexedDB.deleteDatabase(db.name);
        });
      });
    }
    // Force immediate reload to state zero
    window.location.href = window.location.pathname + "?wipe=" + Date.now();
  };

  useEffect(() => {
    if (isDeleting) {
      const interval = setInterval(() => {
        setUptime(Math.floor((Date.now() - sessionStats.startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isDeleting, sessionStats.startTime]);

  const deleteMessages = async () => {
    if (!selectedChannel || !me) return;

    setIsDeleting(true);
    cancelRef.current = false;
    setError(null);
    setDeleteProgress({ done: 0, total: 0 });

    addLog(`[SYSTEM] DEPTH-FIRST PURGE INITIALIZED`);
    addLog(`[TARGET] ${selectedChannel.recipients?.[0]?.username} | ID: ${selectedChannel.id}`);
    if (keywordFilter) addLog(`[FILTER] KEYWORD: "${keywordFilter}"`);
    if (dateFilter !== "all") {
      const label = dateFilter === "today" ? "Last 24 Hours" : dateFilter === "week" ? "Last 7 Days" : "Last 30 Days";
      addLog(`[FILTER] DATE RANGE: ${label}`);
    }

    let totalDeleted = 0;
    let scannedCount = 0;
    let errorCount = 0;
    const MAX_RETRIES = 5;

    const fetchWithRetry = async (before: string | null): Promise<Message[]> => {
      let attempts = 0;
      while (attempts < MAX_RETRIES && !cancelRef.current) {
        try {
          const url = `/api/discord/channels/${selectedChannel.id}/messages?limit=100${before ? `&before=${before}` : ""}`;
          const res = await fetch(url);
          if (res.ok) return await safeJson(res);
          // Handle rate limit
          if (res.status === 429) {
            let retryAfter = 5;
            try {
              const data = await res.json();
              retryAfter = data.retry_after || data.retryAfter || 5;
            } catch (e) {}
            addLog(`[WARN] RATE LIMIT: WAIT ${retryAfter}s`);
            await new Promise(r => setTimeout(r, retryAfter * 1000));
            attempts++;
            continue;
          }
          throw new Error(`HTTP ${res.status}`);
        } catch (e) {
          attempts++;
          addLog(`[ERROR] FETCH RETRY ${attempts}/${MAX_RETRIES}`);
          await new Promise(r => setTimeout(r, 2000 * attempts));
        }
      }
      return [];
    };

    // Outer loop for continuous mode
    while (!cancelRef.current) {
      let beforeId: string | null = null;

      // Inner loop for one full history pass
      while (!cancelRef.current) {
        try {
          const batch = await fetchWithRetry(beforeId);
          if (batch.length === 0) {
            addLog("[REPORT] REACHED END OF ACCESSIBLE HISTORY");
            break;
          }

          scannedCount += batch.length;
          beforeId = batch[batch.length - 1].id;

          // Apply filters
          const filteredBatch = batch.filter(m => {
            const isMine = m.author.id === me.id;
            if (!isMine) return false;

            if (keywordFilter && !m.content.toLowerCase().includes(keywordFilter.toLowerCase())) {
              return false;
            }

            if (dateFilter !== "all") {
              const msgDate = new Date(m.timestamp);
              const now = new Date();
              if (dateFilter === "today" && (now.getTime() - msgDate.getTime()) > 86400000) return false;
              if (dateFilter === "week" && (now.getTime() - msgDate.getTime()) > 604800000) return false;
              if (dateFilter === "month" && (now.getTime() - msgDate.getTime()) > 2592000000) return false;
            }

            return true;
          });

          const myMessageIds = filteredBatch.map(m => m.id);

          if (myMessageIds.length > 0) {
            addLog(`[ENGINE] DETECTED ${myMessageIds.length} TARGETS | SCANNED: ${scannedCount}`);

            const purgeRes = await fetch(`/api/discord/channels/${selectedChannel.id}/purge`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                messageIds: myMessageIds,
                concurrency: isTurbo ? 18 : 6
              })
            });

            if (purgeRes.ok) {
              const result = await safeJson(purgeRes);
              totalDeleted += result.deleted;
              setDeleteProgress(prev => ({ ...prev, done: totalDeleted }));
              setSessionStats(prev => ({ ...prev, deleted: prev.deleted + result.deleted, scanned: scannedCount }));

              if (result.rateLimited) {
                await new Promise(r => setTimeout(r, (result.retryAfter || 2) * 1000));
              } else {
                await new Promise(r => setTimeout(r, isTurbo ? 30 : 200));
              }
            } else {
              addLog(`[ERROR] PURGE FAILURE: HTTP ${purgeRes.status}`);
            }
          } else {
            if (scannedCount % 500 === 0) {
              addLog(`[REPORT] SCANNING... INDEX: ${scannedCount}`);
              setSessionStats(prev => ({ ...prev, scanned: scannedCount }));
            }
          }
        } catch (err) {
          errorCount++;
          setSessionStats(prev => ({ ...prev, errors: prev.errors + 1 }));
          addLog(`[ENGINE] HICCUP: ${err}`);
          if (errorCount > 15) {
            cancelRef.current = true;
            break;
          }
          await new Promise(r => setTimeout(r, 3000));
        }
      }

      if (!isContinuous || cancelRef.current) break;
      addLog("[LOOP] RE-SCANNING HISTORY...");
      await new Promise(r => setTimeout(r, 5000));
    }

    addLog(`[FINISH] EXHAUSTED | TOTAL REMOVED: ${totalDeleted}`);
    setIsDeleting(false);
    selectChannel(selectedChannel);
  };

  if (error === "DISCORD_TOKEN_MISSING" || !me && !isLoading && !error) {
    return (
      <div className="min-h-screen bg-[#080809] text-[#E4E4E7] flex flex-col font-sans overflow-x-hidden selection:bg-indigo-500/30">
        {/* Immersive Grid Background */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]" 
          style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '48px 48px' }} 
        />

        {/* Header */}
        <nav className="relative z-20 flex items-center justify-between p-8 md:px-20 border-b border-white/5 bg-[#080809]/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)]">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase">Digital<span className="text-indigo-500">_Reset</span></span>
          </div>
          <div className="flex items-center gap-8">
            <button onClick={() => setActiveView("tos")} className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.2em]">Terms</button>
            <button onClick={() => setActiveView("pp")} className="text-[10px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.2em]">Privacy</button>
            <div className="w-px h-4 bg-white/10 hidden md:block" />
            <span className="text-[10px] font-mono text-zinc-600 hidden md:block">REL: V3.0.4 STABLE</span>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-7xl mx-auto w-full overflow-hidden">
          {/* Background Aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none">Uplink Pending • Waiting for Auth</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight leading-[0.9] text-white">
              YOUR DIGITAL <br />
              <span className="text-indigo-500 italic-small font-light">FOOTPRINT</span> RECLAIMED.
            </h1>

            <p className="text-zinc-500 text-base md:text-lg max-w-2xl mx-auto mb-16 leading-relaxed">
              Automated high-throughput message history management. <br className="hidden md:block" />
              Reset your profile, secure your associations, and maintain protocol compliance.
            </p>

            {/* Onboarding Grid */}
            <div className="grid md:grid-cols-3 gap-8 text-left mb-20 w-full">
              {[
                { 
                  icon: Shield, 
                  title: "Absolute Privacy", 
                  desc: "Zero-egress infrastructure. Your token never leaves the sandboxed environment logic.",
                  color: "text-indigo-400"
                },
                { 
                  icon: Zap, 
                  title: "Turbo Purge", 
                  desc: "High-concurrency deletion engine capable of handling history depths of 50k+ records.",
                  color: "text-amber-400"
                },
                { 
                  icon: Cpu, 
                  title: "Deep Scan", 
                  desc: "Depth-first recursive scanning detects associations often missed by standard utilities.",
                  color: "text-emerald-400"
                }
              ].map((feature, i) => (
                <div key={i} className="group p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-indigo-500/20 transition-all hover:bg-white/[0.04]">
                  <div className={`w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-tight mb-3 text-white">{feature.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Manual Setup Box */}
            <div className="flex flex-col md:flex-row gap-8 items-stretch w-full">
               <div className="flex-1 bg-[#111113] border border-white/5 rounded-[2.5rem] p-10 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-500">
                    <Lock className="w-32 h-32" />
                  </div>
                  <h2 className="text-2xl font-bold mb-8 uppercase tracking-tight flex items-center gap-3">
                    <Lock className="w-5 h-5 text-indigo-500" />
                    Protocol Initialization
                  </h2>
                  <div className="space-y-6 mb-10">
                    {[
                      { step: "01", text: "Acquire your DISCORD_USER_TOKEN from network headers." },
                      { step: "02", text: "Open AI Studio Secrets and bind the token to the registry." },
                      { step: "03", text: "Restart the environment to finalize the secure uplink." }
                    ].map((step, i) => (
                       <div key={i} className="flex gap-6 items-start">
                          <span className="font-mono text-zinc-700 text-sm font-black">{step.step}</span>
                          <p className="text-sm text-zinc-400 leading-normal">{step.text}</p>
                       </div>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <a 
                      href="https://github.com/shikhir-sharma/Digital-Reset" 
                      target="_blank"
                      className="px-6 py-3 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-colors"
                    >
                      Documentation <ArrowRight className="w-3 h-3" />
                    </a>
                    <button 
                      onClick={fetchMe}
                      className="px-6 py-3 rounded-xl bg-zinc-900 border border-white/5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-800 transition-colors"
                    >
                      Retry Link <Loader2 className="w-3 h-3" />
                    </button>
                  </div>
               </div>

               <div className="w-full md:w-80 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center">
                  <ShieldAlert className="w-12 h-12 text-zinc-700 mb-6" />
                  <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Internal Diagnostics</h3>
                  {serverInfo ? (
                    <div className="w-full space-y-4 font-mono text-[9px] text-zinc-600 mt-4 bg-black/30 p-4 rounded-2xl border border-white/5">
                        <div className="flex justify-between"><span>SYS_ID:</span> <span className="text-indigo-500">{serverInfo.id}</span></div>
                        <div className="flex justify-between"><span>TOKEN_MATCH:</span> <span className={serverInfo.envTokenPresent ? "text-red-500 font-bold" : "text-zinc-400"}>{serverInfo.envTokenPresent ? "ACTIVE (HIDDEN)" : "WAITING"}</span></div>
                        <div className="flex justify-between"><span>CACHED:</span> <span className="text-amber-500">{serverInfo.maskedToken || "NONE"}</span></div>
                    </div>
                  ) : (
                    <div className="h-24 flex items-center justify-center italic opacity-30 text-xs">Awaiting signal...</div>
                  )}
                  <button 
                    onClick={sys
