import { motion } from "motion/react";
import { Scale, AlertCircle, FileText, Ban, Trash2, ArrowLeft } from "lucide-react";

interface TermsOfServiceProps {
  onClose: () => void;
}

export default function TermsOfService({ onClose }: TermsOfServiceProps) {
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
            Terms of <span className="text-indigo-500">Service</span>
          </h1>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Revision v3.4 | Protocol Binding Agreement</p>
        </header>

        <div className="space-y-16">
          <section className="bg-red-500/5 border border-red-500/10 p-8 rounded-2xl">
            <div className="flex items-center gap-4 mb-4 text-red-500">
              <AlertCircle className="w-6 h-6" />
              <h2 className="text-lg font-black uppercase tracking-widest leading-none">Vital Compliance Warning</h2>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed italic">
              Digital Reset is a powerful data maintenance utility. By deploying this protocol, you acknowledge that the use of automated "self-bots" may violate Discord's Terms of Service. You assume all responsibility, risk, and liability associated with account suspension, termination, or shadow-banning.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center">
                <FileText className="w-5 h-5 text-zinc-400" />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight">01. Acceptance of Protocol</h2>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              By initializing the purge engine, you signify your irrevocable acceptance of these Terms. If you do not agree to every clause, you must immediately terminate the session and delete all environment secrets associated with Digital Reset.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight">02. Prohibited Conduct</h2>
            </div>
            <p className="text-zinc-400 leading-relaxed mb-4">You are strictly forbidden from using Digital Reset to:</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border border-white/5 rounded-xl text-xs text-zinc-500">
                <strong className="text-zinc-300 uppercase block mb-1">Harassment</strong>
                Executing large-scale deletes to disrupt active conversations or evade record-keeping in documented abuse cases.
              </div>
              <div className="p-4 border border-white/5 rounded-xl text-xs text-zinc-500">
                <strong className="text-zinc-300 uppercase block mb-1">Commercial Abuse</strong>
                Operating Digital Reset as a paid service or distributing it via unauthorized third-party marketplaces.
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight">03. Finality of Deletion</h2>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Digital Reset executes "Direct-to-API" delete instructions. There is no confirmation dialog between the engine's decision and the API call. All removals are permanent and non-recoverable from the Discord database infrastructure. Digital Reset is not liable for accidental data loss.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center">
                <Scale className="w-5 h-5 text-zinc-400" />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight">04. Limitation of Liability</h2>
            </div>
            <p className="text-zinc-400 leading-relaxed italic text-sm">
              THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight">05. Session Persistence & "Truth Mode"</h2>
            </div>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Users acknowledge that "Digital Reset" utilizes a "Truth Mode" diagnostic system to accurately reflect authentication status.
            </p>
            <div className="bg-[#121214] p-6 rounded-xl border border-white/5 text-[11px] text-zinc-500 leading-relaxed">
              In the event that a user has deleted the <code className="text-red-400">DISCORD_USER_TOKEN</code> from the environment but authentication persists, the user agrees to utilize the "Emergency System Wipe" protocol. Digital Reset is not responsible for environment secrets that fail to synchronize with the cloud provider's runtime after a deletion request has been issued via the hosting platform's dashboard.
            </div>
          </section>

          <footer className="pt-20 border-t border-white/5 text-zinc-600 text-[10px] font-mono flex flex-col md:flex-row justify-between gap-4">
            <p>DIGITAL_RESET_TOS_DOC_2210</p>
            <p>© 2026 Digital Footprint Maintenance Systems</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
