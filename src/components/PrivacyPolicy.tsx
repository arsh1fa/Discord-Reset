import { motion } from "motion/react";
import { Shield, Lock, EyeOff, Server, HardDrive, ArrowLeft } from "lucide-react";

interface PrivacyPolicyProps {
  onClose: () => void;
}

export default function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  return (
    <div className="fixed inset-0 z-50 bg-[#080809] overflow-y-auto font-sans p-8 md:p-20">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Return to Console</span>
        </button>

        <header className="mb-16">
          <h1 className="text-5xl font-black mb-6 tracking-tighter bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent uppercase">
            Privacy <span className="text-indigo-500">Protocol</span>
          </h1>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Effective Date: April 21, 2026 | Revision v3.0</p>
        </header>

        <div className="space-y-16">
          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight">01. Data Localization</h2>
            </div>
            <p className="text-zinc-400 leading-relaxed mb-4">
              At Digital Reset, we operate on a "Zero-Egress" principle. All processing, including the scanning of Discord message history and the execution of purge requests, occurs strictly within the sandboxed environment. 
            </p>
            <ul className="list-disc list-inside text-zinc-500 space-y-2 text-sm ml-4">
              <li>No message content is ever transmitted to Digital Reset's developers.</li>
              <li>Your Discord User Token is stored exclusively as an environment secret.</li>
              <li>Operational logs are ephemeral and reside only in your local session.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center">
                <Shield className="w-5 h-5 text-zinc-400" />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight">02. Credential Security</h2>
            </div>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Your <code className="text-red-400">DISCORD_USER_TOKEN</code> is the master key to your digital identity. Digital Reset handles this credential with extreme caution:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                <h3 className="font-bold text-xs uppercase mb-2 text-indigo-400">Environment Injection</h3>
                <p className="text-xs text-zinc-600 leading-relaxed">The token is only loaded into the server environment at runtime and is never hardcoded or logged to external aggregators.</p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                <h3 className="font-bold text-xs uppercase mb-2 text-red-500">Self-Maintenance</h3>
                <p className="text-xs text-zinc-600 leading-relaxed">We recommend regenerating your token or enabling 2FA immediately after your session if you have shared access to this environment.</p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-zinc-400" />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight">03. No Third-Party Tracking</h2>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Digital Reset does not utilize cookies, trackers, or telemetry from third-party analytics providers like Google Analytics or Mixpanel. The "Session Stats" found in the dashboard are generated in-memory and are destroyed when the browser window is closed.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-zinc-400" />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight">04. Session Persistence & Caching</h2>
            </div>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Due to the architectural constraints of the cloud environment and browser behavior, session data may occasionally persist:
            </p>
            <ul className="list-disc list-inside text-zinc-500 space-y-2 text-sm ml-4 border-l border-white/5 pl-6">
              <li><strong className="text-zinc-300 uppercase text-[10px]">Browser Cache:</strong> Your browser may cache the response from API endpoints. We have implemented "Truth Mode" headers to combat this, but manual clearing may be required.</li>
              <li><strong className="text-zinc-300 uppercase text-[10px]">Cloud Run Context:</strong> In some instances, the server environment may take several minutes to synchronize with the "Secrets" panel after a deletion request.</li>
              <li><strong className="text-zinc-300 uppercase text-[10px]">IndexedDB/Storage:</strong> Local identity data is cleared during a "Logout" or "System Wipe," but legacy browser versions may retain shadows of this data.</li>
            </ul>
          </section>

          <footer className="pt-20 border-t border-white/5 text-zinc-600 text-[10px] font-mono flex flex-col md:flex-row justify-between gap-4">
            <p>Digital_Reset_PRIVACY_DOC_7792</p>
            <p>© 2026 Digital Footprint Maintenance Systems</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
