import { FileText, Download, Plus, Search, ChevronRight } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">My Reports</h2>
          <p className="text-slate-500">View, download, and compare your lab history.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full font-medium hover:bg-slate-800 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Upload New Report
        </button>
      </div>

      <div className="glass-card rounded-[2rem] p-6 border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search reports by date or lab..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          {[
            { date: "July 20, 2026", lab: "Dr Lal PathLabs", status: "Analyzed", risk: "Prediabetes", hba1c: 6.4 },
            { date: "April 10, 2026", lab: "Apollo Diagnostics", status: "Analyzed", risk: "Prediabetes", hba1c: 6.8 },
            { date: "January 15, 2026", lab: "Local Lab", status: "Analyzed", risk: "Diabetes", hba1c: 7.2 },
          ].map((report, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">{report.date}</h4>
                  <p className="text-sm text-slate-500">{report.lab}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between w-full sm:w-auto mt-4 sm:mt-0 sm:gap-8">
                <div className="text-left sm:text-right hidden sm:block">
                  <span className="text-xs text-slate-500 block">HbA1c</span>
                  <span className="font-bold text-slate-900">{report.hba1c}%</span>
                </div>
                
                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md ${
                  report.risk === 'Diabetes' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                }`}>
                  {report.risk}
                </span>

                <div className="flex items-center gap-2">
                  <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
