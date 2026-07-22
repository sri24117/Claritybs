"use client";

import { MessageSquare, Send, Sparkles, User, Info } from "lucide-react";
import { useState } from "react";

export default function CoachPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hi! I'm your ClarityBS AI Health Coach. Based on your profile, you're currently maintaining an HbA1c of 7.2% and your goal is 5.9%. What dietary or lifestyle questions do you have today?"
    }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages([...messages, { id: Date.now(), role: 'user', content: input }]);
    setInput('');
    
    // Simulate thinking delay
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: "That's a great question. Based on your current health targets, I'd suggest pairing that with high fiber and some protein to prevent a rapid blood sugar spike."
      }]);
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">AI Health Coach</h2>
          <p className="text-slate-500">Personalized guidance based on your blood reports.</p>
        </div>
      </div>

      <div className="flex-1 glass-card rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col overflow-hidden relative">
        {/* Context Banner */}
        <div className="bg-blue-50 border-b border-blue-100 p-3 px-6 flex items-start sm:items-center gap-3 text-sm text-blue-800">
          <Info className="w-5 h-5 shrink-0 text-blue-600 mt-0.5 sm:mt-0" />
          <p>
            <strong>Context Active:</strong> I know your latest HbA1c is <span className="font-bold">7.2%</span> and you prefer a <span className="font-bold">Non-Veg</span> diet.
          </p>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-blue-100 text-blue-600'
              }`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              </div>
              <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-200 shadow-sm rounded-tl-none'
              }`}>
                <p className="leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/50 backdrop-blur border-t border-slate-200/60">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g., Can I eat a dosa for dinner tonight?"
              className="w-full bg-white border border-slate-300 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
