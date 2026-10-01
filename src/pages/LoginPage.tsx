import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  GraduationCap, 
  Chrome, 
  CheckSquare, 
  Users, 
  Newspaper, 
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";

export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error(err);
      setError("การเข้าสู่ระบบล้มเหลว กรุณาลองใหม่อีกครั้ง (Google Authentication failed)");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* Left Column: Branding & Features (Hidden on mobile or styled gracefully) */}
      <div className="hidden lg:flex lg:w-7/12 bg-[#0F172A] relative overflow-hidden flex-col justify-between p-16 text-white">
        {/* Subtle decorative background glow */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-[#F05A22]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-orange-600/10 blur-[100px]" />
        
        {/* Top: Branding logo */}
        <div className="flex items-center gap-3.5 z-10">
          <div className="w-11 h-11 rounded-xl bg-[#F05A22] flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/10">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-2xl tracking-tight text-white">KKU LifeOS</span>
            <span className="text-xs block text-slate-400 font-medium">Khon Kaen University Student OS</span>
          </div>
        </div>

        {/* Middle: Feature Showcases with Staggered Motion */}
        <div className="my-auto max-w-xl z-10">
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] mb-6">
            เปิดแอปเดียว รู้ทันที <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-[#F05A22]">
              ว่าวันนี้ต้องทำอะไร
            </span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg mb-10 leading-relaxed font-medium">
            KKU LifeOS รวบรวมและจัดระเบียบทุกกิจกรรมการเรียน งานมอบหมาย โปรเจกต์กลุ่ม และประกาศสำคัญของ มข. ไว้ในที่เดียวอย่างชาญฉลาด
          </p>

          {/* Feature List */}
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#F05A22] shrink-0 border border-orange-500/20">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">วันนี้ทำอะไร (Today Dashboard)</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  แสดงเดดไลน์งาน ดิวส่งการบ้าน และตารางเวลากลุ่มของคุณทันทีอย่างเป็นระเบียบตามลำดับความสำคัญ
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#F05A22] shrink-0 border border-orange-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">ค้นหาทีมเรียน (Team Finder)</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  แหล่งค้นหาและจับคู่ทีมทำโครงงานกลุ่มย่อย หาเพื่อนร่วมทำโปรเจกต์วิชาเรียน มข. ที่มีสกิลลงตัว
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#F05A22] shrink-0 border border-orange-500/20">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">กระดานประกาศสถาบัน (Student Feed)</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  อัปเดตแจ้งเตือน ข่าวด่วนจากมหาวิทยาลัย และกิจกรรมรอบรั้วกัลปพฤกษ์ โดยไม่มีฟีดขยะรบกวน
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Faculty Note */}
        <div className="z-10 text-xs text-slate-500 font-medium">
          พัฒนาขึ้นสำหรับนักศึกษา มหาวิทยาลัยขอนแก่น • © {new Date().getFullYear()} KKU LifeOS
        </div>
      </div>

      {/* Right Column: Login Card & Credentials */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 bg-white">
        
        {/* Top: Mobile header only */}
        <div className="flex lg:hidden items-center gap-3.5 mb-10">
          <div className="w-10 h-10 rounded-xl bg-[#F05A22] flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/15">
            <GraduationCap className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight text-slate-900">KKU LifeOS</span>
            <span className="text-[10px] block text-slate-400 font-medium">Student Operating System</span>
          </div>
        </div>

        {/* Center: Actual Login Box */}
        <div className="my-auto max-w-md w-full mx-auto space-y-8">
          <div className="space-y-2.5">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              ยินดีต้อนรับสู่ KKU LifeOS
            </h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              กรุณาเข้าสู่ระบบด้วยบัญชี Google หรืออีเมลนักศึกษา มข. (@kkumail.com) เพื่อเริ่มต้นบริหารจัดการชีวิตในรั้วมหาวิทยาลัย
            </p>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Social Sign In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl font-semibold text-slate-700 transition-all duration-200 hover:shadow-sm disabled:opacity-75 cursor-pointer relative"
          >
            <Chrome className="w-5 h-5 text-red-500 shrink-0" />
            <span>
              {isSigningIn ? "กำลังเชื่อมต่อบัญชี..." : "เข้าสู่ระบบด้วย Google"}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 absolute right-5" />
          </button>

          {/* Information Notice */}
          <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-700">คำชี้แจงด้านความปลอดภัย (Privacy & Security):</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              เราใช้ระบบจัดเก็บข้อมูลและยืนยันตัวตนผ่านระบบคลาวด์ Firebase ของ Google ข้อมูลโปรไฟล์สาธารณะ (ชื่อ, รูปถ่าย, อีเมล) จะถูกบันทึกเพื่อใช้แสดงผลบนแพลตฟอร์มอย่างโปร่งใสและปลอดภัย
            </p>
          </div>
        </div>

        {/* Bottom: Mobile and Desktop Footer info */}
        <div className="text-center text-xs text-slate-400 font-medium mt-12 lg:mt-0">
          <span className="lg:hidden block mb-1">KKU LifeOS คือแอปจัดการการเรียนส่วนตัวสำหรับนักศึกษา</span>
          ขอนแก่น มุ่งมั่นพัฒนาเพื่อสังคมไอทีในมหาวิทยาลัยที่ดีขึ้น
        </div>
      </div>

    </div>
  );
}
