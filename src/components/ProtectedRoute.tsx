import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GraduationCap } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F05A22] flex items-center justify-center text-white shadow-xl shadow-orange-500/20 animate-bounce">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="flex flex-col items-center">
            <h2 className="font-bold text-lg text-slate-900 tracking-tight">KKU LifeOS</h2>
            <p className="text-xs text-slate-400 font-medium mt-1">Verifying your student passport...</p>
          </div>
          <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div className="h-full w-1/2 bg-[#F05A22] rounded-full animate-[loading_1s_infinite_ease-in-out]"></div>
          </div>
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
