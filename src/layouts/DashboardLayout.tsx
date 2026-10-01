import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Compass, 
  CheckSquare, 
  Users, 
  Newspaper, 
  GraduationCap,
  LogOut
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showMobileLogout, setShowMobileLogout] = useState(false);

  const menuItems = [
    { name: "Today", path: "/", icon: Compass },
    { name: "Tasks", path: "/tasks", icon: CheckSquare },
    { name: "Teams", path: "/teams", icon: Users },
    { name: "Feed", path: "/feed", icon: Newspaper },
  ];

  const userInitials = user?.displayName
    ? user.displayName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : "ST";

  const handleLogout = () => {
    if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่? (Are you sure you want to log out?)")) {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 p-6 shrink-0 h-screen sticky top-0">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-[#F05A22] flex items-center justify-center text-white font-bold text-lg shadow-md shadow-orange-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-slate-900">KKU LifeOS</h1>
            <p className="text-xs text-slate-400 font-medium">Student Operating System</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1.5" id="desktop-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                id={`nav-${item.name.toLowerCase()}`}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#F05A22]/10 text-[#F05A22] shadow-sm shadow-orange-500/5 font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[#F05A22]" : "text-slate-400 group-hover:text-slate-600"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info Card & Logout in Sidebar */}
        <div className="border-t border-slate-100 pt-6 mt-auto space-y-3">
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || "User Avatar"} 
                className="w-9 h-9 rounded-full object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-[#F05A22] font-semibold text-sm">
                {userInitials}
              </div>
            )}
            <div className="overflow-hidden flex-1">
              <h4 className="font-semibold text-sm text-slate-900 truncate">
                {user?.displayName || "KKU Student"}
              </h4>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email || "student@kkumail.com"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-100 hover:border-rose-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ (Log Out)</span>
          </button>
        </div>
      </aside>

      {/* Header for Mobile */}
      <header className="md:hidden bg-white border-b border-slate-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F05A22] flex items-center justify-center text-white font-bold shadow-sm shadow-orange-500/10">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 leading-none">KKU LifeOS</h1>
            <p className="text-[10px] text-slate-400 font-medium">Student OS</p>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMobileLogout(!showMobileLogout)}
            className="focus:outline-none cursor-pointer"
          >
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-[#F05A22] font-semibold text-xs border border-orange-100">
                {userInitials}
              </div>
            )}
          </button>

          {showMobileLogout && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg p-2 z-50">
              <div className="px-2 py-1.5 border-b border-slate-100 mb-1.5">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.displayName || "KKU Student"}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || ""}</p>
              </div>
              <button
                onClick={() => {
                  setShowMobileLogout(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกจากระบบ (Log Out)</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-24 md:pb-8">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-2 flex justify-around items-center z-40 shadow-lg shadow-slate-200/50" id="mobile-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              id={`mobile-nav-${item.name.toLowerCase()}`}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? "text-[#F05A22] font-semibold"
                  : "text-slate-400"
              }`}
            >
              <Icon className={`w-5.5 h-5.5 ${isActive ? "text-[#F05A22]" : "text-slate-400"}`} />
              <span className="text-[10px] font-medium leading-none">{item.name}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}

