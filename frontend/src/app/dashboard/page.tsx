"use client";

import { useEffect, useState } from "react";
import { Activity, Target, Flame, TrendingDown, TrendingUp, AlertCircle, MessageSquare, Send, CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [coachInput, setCoachInput] = useState("");
  const [coachResponse, setCoachResponse] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/dashboard/summary")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const toggleHabit = async (habitId: string, currentStatus: boolean) => {
    // Optimistic update
    const updatedHabits = data.todayHabits.map((h: any) => 
      h.id === habitId ? { ...h, completed: !currentStatus } : h
    );
    setData({ ...data, todayHabits: updatedHabits });

    // Send to backend
    await fetch("http://localhost:5000/api/dashboard/habit/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, completed: !currentStatus })
    });
  };

  const askCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachInput.trim()) return;
    
    setIsAsking(true);
    setCoachResponse("");
    
    try {
      const res = await fetch("http://localhost:5000/api/coach/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: coachInput })
      });
      const resData = await res.json();
      setCoachResponse(resData.answer);
    } catch (err) {
      setCoachResponse("Sorry, I'm having trouble connecting to the network right now.");
    } finally {
      setIsAsking(false);
      setCoachInput("");
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center animate-pulse text-slate-400">Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* Welcome Banner */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
          👋 Good Morning, Srikanth
        </h2>
        <p className="text-slate-500">Here's what you need to focus on today to reach your goals.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Health Score Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-1 glass-card rounded-[2rem] p-6 flex flex-col justify-between shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-bl-[100px] -z-10 opacity-50"></div>
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-700 uppercase tracking-wider text-xs">Overall Health Score</h3>
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-6xl font-bold tracking-tighter text-slate-900">{data?.healthProfile?.currentHealthScore || 0}</span>
              <span className="text-xl text-slate-400 font-medium">/ 100</span>
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-semibold mb-6">
              <TrendingUp className="w-4 h-4" /> +4 points this month
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-medium text-slate-500 mb-2">Next Goal</h4>
            <p className="text-slate-900 font-semibold">Reduce HbA1c from 6.4 → {data?.healthProfile?.targetHbA1c || 5.9}</p>
          </div>
        </motion.div>

        {/* Daily Action Plan (Habits) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" /> Today's Action Plan
            </h3>
            <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" /> 12 Day Streak
            </span>
          </div>

          <div className="space-y-3">
            {data?.todayHabits?.map((habit: any) => (
              <div 
                key={habit.id} 
                onClick={() => toggleHabit(habit.id, habit.completed)}
                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${
                  habit.completed ? 'bg-slate-50 border-transparent text-slate-500' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 font-medium">
                  {habit.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-300 shrink-0" />
                  )}
                  <span className={habit.completed ? 'line-through decoration-slate-300' : ''}>
                    {habit.title}
                  </span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  {habit.category}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Timeline / Compare Reports */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" /> Report History
            </h3>
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Compare</button>
          </div>

          <div className="relative pl-6 border-l-2 border-slate-100 space-y-8 py-2">
            {data?.timeline?.map((report: any, idx: number) => (
              <div key={report.id} className="relative">
                <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white ${idx === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">{new Date(report.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Report</h4>
                <div className="flex gap-4 mt-2">
                  <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500 block mb-1">HbA1c</span>
                    <span className="font-bold text-slate-900">{report.hba1c} <span className="text-sm font-normal text-slate-500">%</span></span>
                  </div>
                  <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    <span className="text-xs text-slate-500 block mb-1">Weight</span>
                    <span className="font-bold text-slate-900">{report.weight} <span className="text-sm font-normal text-slate-500">kg</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Health Coach Widget */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm flex flex-col h-[400px]"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">AI Health Coach</h3>
              <p className="text-xs text-slate-500 font-medium">Context: Non-Veg | Target 5.9</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 rounded-2xl p-4 mb-4 flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 shrink-0 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm text-sm text-slate-700 border border-slate-100">
                Hi Srikanth. Based on your July report, I recommend sticking to the high protein breakfast today. What's on your mind?
              </div>
            </div>
            
            {coachResponse && (
              <div className="flex gap-3 mt-auto">
                <div className="w-8 h-8 rounded-full bg-blue-100 shrink-0 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm text-sm text-slate-700 border border-slate-100">
                  {coachResponse}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={askCoach} className="relative">
            <input 
              type="text" 
              value={coachInput}
              onChange={(e) => setCoachInput(e.target.value)}
              placeholder="E.g., Can I eat dosa for dinner?" 
              className="w-full bg-white border border-slate-200 rounded-full h-12 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isAsking}
            />
            <button 
              type="submit" 
              disabled={isAsking || !coachInput.trim()}
              className="absolute right-2 top-2 bottom-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 justify-center">
            <AlertCircle className="w-3 h-3" /> Educational guidance only. Consult a doctor.
          </div>
        </motion.div>

      </div>
    </div>
  );
}
