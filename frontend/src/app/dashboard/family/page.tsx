import { Users, Plus, UserCircle2, ArrowRight } from "lucide-react";

export default function FamilyPage() {
  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Family Hub</h2>
          <p className="text-slate-500">Manage health profiles for your parents and spouse in one place.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full font-medium hover:bg-slate-800 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Family Member
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Main User */}
        <div className="glass-card rounded-[2rem] p-6 border-2 border-blue-500/20 shadow-sm relative overflow-hidden bg-blue-50/30">
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Primary</div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <UserCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">John Doe</h3>
                <p className="text-slate-500">You</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500">Health Score</p>
              <p className="text-2xl font-black text-blue-600">78</p>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
             <button className="flex-1 bg-white border border-slate-200 text-slate-700 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
               View Profile
             </button>
          </div>
        </div>

        {/* Family Member 1 */}
        <div className="glass-card rounded-[2rem] p-6 border border-slate-200/60 shadow-sm relative bg-white">
          <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Member</div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-2xl flex items-center justify-center">
                <UserCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Mary Doe</h3>
                <p className="text-slate-500">Mother</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-500">Health Score</p>
              <p className="text-2xl font-black text-pink-500">62</p>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
             <button className="flex-1 bg-slate-50 text-slate-700 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
               Switch to Profile
             </button>
             <button className="flex-none bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors">
               Add Report
             </button>
          </div>
        </div>

        {/* Empty State / Add New */}
        <div className="glass-card rounded-[2rem] p-6 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center min-h-[200px] hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer group">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:text-blue-500 group-hover:bg-blue-50">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-700">Add Another Member</h3>
          <p className="text-sm text-slate-500 mt-1">Keep track of your father's or spouse's reports.</p>
        </div>
      </div>
    </div>
  );
}
