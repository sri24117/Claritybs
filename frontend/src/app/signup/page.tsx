"use client";

import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FAFAFA] selection:bg-slate-200">
      {/* Minimal Navbar */}
      <nav className="w-full z-50 glass-nav transition-all duration-300">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-slate-900 text-white p-1.5 rounded-lg group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              ClarityBS
            </span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col md:flex-row items-center justify-center p-6 relative gap-12 max-w-5xl mx-auto w-full">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[500px] bg-gradient-to-bl from-purple-100/50 to-blue-50/50 blur-3xl -z-10 rounded-full mix-blend-multiply opacity-70"></div>
        
        {/* Value Prop Side */}
        <div className="hidden md:flex flex-col w-full max-w-md pt-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-6 leading-[1.15] tracking-tight">Join ClarityBS today.</h2>
          <p className="text-slate-500 text-lg mb-10">Make sense of your blood tests instantly. Get actionable dietary guidance designed for Indian families.</p>
          
          <ul className="space-y-6">
            <li className="flex items-start gap-4">
              <div className="bg-green-100 p-2 rounded-full mt-1"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
              <div>
                <h4 className="font-semibold text-slate-900 text-lg">Instant AI Extraction</h4>
                <p className="text-slate-500 text-sm">Upload any report format and let our rule engine do the heavy lifting.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-full mt-1"><CheckCircle2 className="w-5 h-5 text-blue-600" /></div>
              <div>
                <h4 className="font-semibold text-slate-900 text-lg">Simple Explanations</h4>
                <p className="text-slate-500 text-sm">Understand your HbA1c, FBS, and Lipids without needing a medical degree.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="bg-purple-100 p-2 rounded-full mt-1"><CheckCircle2 className="w-5 h-5 text-purple-600" /></div>
              <div>
                <h4 className="font-semibold text-slate-900 text-lg">Personalized Diet Plans</h4>
                <p className="text-slate-500 text-sm">Get practical food recommendations tailored to your risk level.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Form Side */}
        <div className="w-full max-w-md glass-card rounded-[2.5rem] p-10 flex flex-col shadow-[0_20px_50px_rgb(0,0,0,0.05)]">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Create an account</h1>
            <p className="text-slate-500">Start your journey to better health understanding.</p>
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-medium ml-1">Full Name</Label>
              <Input 
                id="name" 
                type="text" 
                placeholder="Ramesh Kumar" 
                className="rounded-full h-12 px-6 bg-white/50 border-slate-200 focus-visible:ring-slate-900"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium ml-1">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                className="rounded-full h-12 px-6 bg-white/50 border-slate-200 focus-visible:ring-slate-900"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium ml-1">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Create a strong password" 
                className="rounded-full h-12 px-6 bg-white/50 border-slate-200 focus-visible:ring-slate-900"
                required
              />
            </div>
            
            <button type="submit" className="w-full mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-8 h-14 text-base font-semibold text-white hover:bg-slate-800 transition-all shadow-md gap-2">
              Create Account <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-slate-900 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
