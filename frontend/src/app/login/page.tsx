"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Mock success: normally you'd save the token and redirect to a dashboard
      alert(`Login Successful! Token: ${data.token}\n\nSince the dashboard isn't built yet, we will redirect you to the home page to test the report upload.`);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
      <main className="flex-grow flex items-center justify-center p-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[400px] bg-gradient-to-tr from-blue-100/50 to-emerald-50/50 blur-3xl -z-10 rounded-full mix-blend-multiply opacity-70"></div>
        
        <div className="w-full max-w-md glass-card rounded-[2.5rem] p-10 flex flex-col shadow-[0_20px_50px_rgb(0,0,0,0.05)]">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Welcome back</h1>
            <p className="text-slate-500">Log in to view your health reports and meal plans.</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium ml-1">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@claritybs.com" 
                className="rounded-full h-12 px-6 bg-white/50 border-slate-200 focus-visible:ring-slate-900"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                <Link href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">Forgot password?</Link>
              </div>
              <Input 
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123" 
                className="rounded-full h-12 px-6 bg-white/50 border-slate-200 focus-visible:ring-slate-900"
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-8 h-14 text-base font-semibold text-white hover:bg-slate-800 transition-all shadow-md gap-2 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Sign In</>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="font-semibold text-slate-900 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
