import { Activity, LayoutDashboard, FileText, Target, Users, BookOpen, Settings, LogOut, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-sans selection:bg-slate-200">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <div className="bg-slate-900 text-white p-1.5 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            ClarityBS
          </span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavItem href="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Home" active />
          <NavItem href="/dashboard/reports" icon={<FileText className="w-5 h-5" />} label="My Reports" />
          <NavItem href="/dashboard/habits" icon={<Target className="w-5 h-5" />} label="Daily Habits" />
          <NavItem href="/dashboard/coach" icon={<MessageSquare className="w-5 h-5" />} label="AI Coach" />
          <NavItem href="/dashboard/family" icon={<Users className="w-5 h-5" />} label="Family" />
          <NavItem href="/dashboard/learn" icon={<BookOpen className="w-5 h-5" />} label="Learn" />
        </nav>
        
        <div className="p-4 border-t border-slate-100 space-y-1">
          <NavItem href="/dashboard/settings" icon={<Settings className="w-5 h-5" />} label="Settings" />
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors w-full text-left text-sm font-medium">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* Top bar for mobile / general top area */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center px-6 justify-between">
          <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
              S
            </div>
          </div>
        </header>
        
        <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active 
          ? "bg-blue-50 text-blue-700" 
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
