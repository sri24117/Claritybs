import { User, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8 pb-12 max-w-3xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Settings</h2>
        <p className="text-slate-500">Manage your account and preferences.</p>
      </div>

      <div className="glass-card rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden bg-white">
        
        {/* Profile Section */}
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Profile Information</h3>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input type="text" defaultValue="John Doe" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input type="tel" defaultValue="+91 98765 43210" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">WhatsApp Reminders</p>
                <p className="text-sm text-slate-500">Get daily habit reminders on WhatsApp.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Data & Privacy</h3>
          </div>
          
          <div className="space-y-4">
             <button className="text-blue-600 font-medium hover:underline block">Download my data archive</button>
             <button className="text-red-600 font-medium hover:underline block">Delete my account completely</button>
          </div>
        </div>

      </div>
      
      <div className="flex justify-end pt-4">
        <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
}
