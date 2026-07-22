"use client";

import { Target, CheckCircle2, Circle, Flame, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function HabitsPage() {
  const [habits, setHabits] = useState([
    { id: '1', title: 'High Protein Breakfast', category: 'NUTRITION', completed: true, streak: 12 },
    { id: '2', title: 'Portion Control at Lunch', category: 'NUTRITION', completed: true, streak: 5 },
    { id: '3', title: 'Walk 30 mins', category: 'ACTIVITY', completed: false, streak: 0 },
    { id: '4', title: 'Drink 2.5L Water', category: 'ACTIVITY', completed: false, streak: 2 }
  ]);

  const toggleHabit = (id: string) => {
    setHabits(habits.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Daily Habits</h2>
          <p className="text-slate-500">Small daily actions create long-term health.</p>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full font-bold">
          <Flame className="w-5 h-5 fill-current" /> 12 Day Streak
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="glass-card rounded-[2rem] p-6 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Today's Plan</h3>
              <span className="text-sm font-medium text-slate-500">July 22, 2026</span>
            </div>

            <div className="space-y-3">
              {habits.map((habit) => (
                <div 
                  key={habit.id} 
                  onClick={() => toggleHabit(habit.id)}
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
                  <div className="flex items-center gap-4">
                    {habit.streak > 0 && (
                      <span className="text-xs font-bold text-orange-500 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded">
                        <Flame className="w-3 h-3" /> {habit.streak}
                      </span>
                    )}
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded hidden sm:block">
                      {habit.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-700 transition-colors">
              + Add Custom Habit
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-[2rem] p-6 border border-slate-200/60 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" /> Activity Log
            </h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl glass border border-slate-200/50 shadow-sm">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-slate-900">Yesterday</div>
                    <div className="text-xs font-medium text-green-500">100%</div>
                  </div>
                  <div className="text-sm text-slate-500">Perfect day!</div>
                </div>
              </div>
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <span className="text-xs font-bold">20</span>
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl glass border border-slate-200/50 shadow-sm opacity-60">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-slate-900">July 20</div>
                    <div className="text-xs font-medium text-yellow-500">75%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
