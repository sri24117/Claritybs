import { BookOpen, PlayCircle, Clock, ChevronRight, Stethoscope, ArrowRight } from "lucide-react";

export default function LearnPage() {
  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Knowledge Base</h2>
          <p className="text-slate-500">Clinically reviewed articles and videos to help you understand your health.</p>
        </div>
      </div>

      {/* Featured Article */}
      <div className="glass-card rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-2/5 bg-slate-900 relative">
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 to-transparent"></div>
           <div className="h-full p-8 flex flex-col justify-between relative z-10 text-white min-h-[250px]">
             <div className="bg-blue-500/20 text-blue-300 w-fit px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-md border border-blue-500/30">
               Featured Masterclass
             </div>
             <div>
               <h3 className="text-2xl font-bold mb-2">Reversing Prediabetes in 90 Days</h3>
               <p className="text-slate-300 text-sm">Dr. Sharma explains the exact mechanism of insulin resistance and how to break it.</p>
             </div>
           </div>
        </div>
        <div className="p-8 md:w-3/5 flex flex-col justify-center bg-white">
          <div className="flex items-center gap-4 mb-4 text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-1.5"><PlayCircle className="w-4 h-4" /> 15 Min Video</span>
            <span className="flex items-center gap-1.5"><Stethoscope className="w-4 h-4" /> Medically Reviewed</span>
          </div>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Discover the Clarity Method for managing blood sugar. You don't need to starve yourself, you just need to understand the science of glucose spikes.
          </p>
          <button className="w-fit flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm">
            Watch Now <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Recommended for You</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "The Truth About Indian Breakfasts", category: "Nutrition", readTime: "5 min read" },
            { title: "Why Walking After Meals Works", category: "Activity", readTime: "3 min read" },
            { title: "Understanding HbA1c vs Fasting Sugar", category: "Science", readTime: "7 min read" },
          ].map((article, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group bg-white">
              <div className="mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">
                  {article.category}
                </span>
              </div>
              <h4 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                {article.title}
              </h4>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Clock className="w-3.5 h-3.5" /> {article.readTime}
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
