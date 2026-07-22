import Link from "next/link";
import { Activity } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 glass-nav transition-all duration-300">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-slate-900 text-white p-1.5 rounded-lg group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            ClarityBS
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-[15px] font-medium text-slate-500">
          <Link href="#how-it-works" className="hover:text-slate-900 transition-colors">How it Works</Link>
          <Link href="#features" className="hover:text-slate-900 transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
          <Link href="#faq" className="hover:text-slate-900 transition-colors">FAQ</Link>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-[15px] font-medium text-slate-500 hover:text-slate-900 transition-colors hidden md:block">
            Log in
          </Link>
          <Link href="#upload" className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all">
            Upload Report
          </Link>
        </div>
      </div>
    </nav>
  );
}
