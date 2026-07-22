import Link from "next/link";
import { Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 py-20">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6 group inline-flex">
              <div className="bg-slate-900 text-white p-1.5 rounded-lg group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                ClarityBS
              </span>
            </Link>
            <p className="text-slate-500 mb-6 max-w-sm text-sm leading-relaxed">
              AI-powered Health Report Decoder for Indian Families. Understand your blood sugar, BP, and cholesterol reports in simple language.
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 leading-relaxed max-w-sm">
              <span className="font-semibold text-slate-700">Disclaimer:</span> ClarityBS provides educational guidance to help you understand your reports. It does not provide medical diagnosis or replace professional medical advice. Always consult your doctor for treatment.
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 mb-6 tracking-tight">Product</h3>
            <ul className="space-y-4 text-sm text-slate-500 font-medium">
              <li><Link href="#how-it-works" className="hover:text-slate-900 transition-colors">How it Works</Link></li>
              <li><Link href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</Link></li>
              <li><Link href="#faq" className="hover:text-slate-900 transition-colors">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 mb-6 tracking-tight">Legal</h3>
            <ul className="space-y-4 text-sm text-slate-500 font-medium">
              <li><Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link></li>
              <li><Link href="/refunds" className="hover:text-slate-900 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-100 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium text-slate-400">
          <p>© {new Date().getFullYear()} ClarityBS. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-slate-900 transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Instagram</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
