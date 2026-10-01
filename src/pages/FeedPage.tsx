import React, { useEffect, useState } from "react";
import { 
  Newspaper, 
  Bell, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  X, 
  AlertCircle,
  Mail,
  ArrowRight,
  Info
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getAnnouncements } from "../firebase/firestore";
import { getKKUAnnouncements, GmailAnnouncement } from "../services/gmailService";
import { Announcement } from "../types";
import AnnouncementCard from "../components/AnnouncementCard";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

interface FeedItem {
  id: string;
  title: string;
  description: string;
  content: string;
  source: "Gmail" | "Firestore";
  sender: string;
  createdAt: number;
  dateStr: string;
  category: string;
  isImportant: boolean;
  gmailLink?: string;
}

export default function FeedPage() {
  const { accessToken, connectGoogleClassroom, user } = useAuth();
  
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | "Latest" | "Important">("All");
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    async function loadFeed() {
      setIsLoading(true);
      setError("");
      
      try {
        let gmailNews: GmailAnnouncement[] = [];
        let manualNews: Announcement[] = [];
        
        // 1. Load manual / Firestore announcements
        try {
          manualNews = await getAnnouncements();
        } catch (err) {
          console.error("Failed to load manual announcements from Firestore:", err);
        }

        // 2. Load Gmail announcements if token exists
        if (accessToken) {
          try {
            gmailNews = await getKKUAnnouncements(accessToken, 20);
            setIsGmailConnected(true);
          } catch (gmailErr: any) {
            console.error("Gmail fetch error:", gmailErr);
            // If the access token is invalid/expired (UNAUTHORIZED)
            if (gmailErr.message === "UNAUTHORIZED" || (gmailErr.status === 401)) {
              setIsGmailConnected(false);
            } else {
              setError("ไม่สามารถโหลดประกาศจาก KKU ได้");
            }
          }
        } else {
          setIsGmailConnected(false);
        }

        // 3. Map into unified FeedItem
        const mappedManual: FeedItem[] = manualNews.map((ann) => ({
          id: ann.id,
          title: ann.title,
          description: ann.description,
          content: ann.description,
          source: "Firestore",
          sender: "KKU Student OS System",
          createdAt: ann.createdAt || Date.now(),
          dateStr: new Date(ann.createdAt || Date.now()).toISOString().split("T")[0],
          category: ann.category,
          isImportant: ann.isImportant,
        }));

        const mappedGmail: FeedItem[] = gmailNews.map((ann) => ({
          id: ann.id,
          title: ann.title,
          description: ann.description,
          content: ann.content,
          source: "Gmail",
          sender: ann.sender,
          createdAt: ann.createdAt,
          dateStr: ann.dateStr,
          category: ann.category,
          isImportant: ann.isImportant,
          gmailLink: ann.gmailLink,
        }));

        // 4. Combine and sort by newest first
        const combined = [...mappedGmail, ...mappedManual].sort((a, b) => b.createdAt - a.createdAt);
        setFeedItems(combined);

      } catch (err) {
        console.error("Error loading feed items:", err);
        setError("เกิดข้อผิดพลาดในการโหลดข่าวสารและประกาศ");
      } finally {
        setIsLoading(false);
      }
    }

    loadFeed();
  }, [accessToken, refreshTrigger]);

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    setError("");
    try {
      await connectGoogleClassroom(); // prompts scopes including gmail.readonly
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error connecting Gmail:", err);
      setError("ไม่สามารถเชื่อมต่อ Gmail ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsConnecting(false);
    }
  };

  // Filtering Logic
  const filteredItems = feedItems.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;
    
    if (activeFilter === "Important") {
      return item.isImportant;
    }
    
    return true;
  });

  // Latest filter simply takes the top 5 newest entries
  const displayItems = activeFilter === "Latest" ? filteredItems.slice(0, 5) : filteredItems;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Newspaper className="w-7 h-7 text-[#F05A22]" />
            KKU Feed
          </h2>
          <p className="text-slate-400 text-sm font-semibold mt-1">
            ศูนย์รวมข่าวสารและประกาศสำคัญส่งตรงจากมหาวิทยาลัยขอนแก่น
          </p>
        </div>
        
        {/* Actions row */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={isLoading}
            className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl transition duration-150 cursor-pointer disabled:opacity-50"
            title="รีเฟรชข่าวสาร"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          
          {!isGmailConnected && (
            <button
              onClick={handleConnectGmail}
              disabled={isConnecting}
              className="flex items-center gap-2 px-4.5 py-3 bg-[#F05A22] text-white rounded-2xl font-bold hover:bg-orange-600 transition duration-150 shadow-md shadow-orange-500/15 text-sm cursor-pointer disabled:opacity-75"
            >
              <Mail className="w-4 h-4" />
              <span>{isConnecting ? "กำลังเชื่อมต่อ..." : "Connect Gmail"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Gmail Connection Prompt Info Banner if not connected */}
      {!isGmailConnected && !isLoading && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-200 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">เชื่อมต่อ Gmail เพื่อรับประกาศจาก มข. ด่วน!</h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-medium">
                ลงชื่อเข้าใช้งานด้วยบัญชี Gmail ของท่าน เพื่อรับข่าวสารอย่างเป็นทางการของมหาวิทยาลัยจาก <strong className="text-amber-700">allstudents@kkumail.com</strong> โดยตรงบนหน้าบอร์ดนี้
              </p>
            </div>
          </div>
          <button
            onClick={handleConnectGmail}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition duration-150 cursor-pointer"
          >
            Connect Gmail <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อเรื่องหรือเนื้อหาย่อ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4.5 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold text-slate-700 shadow-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(["All", "Latest", "Important"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold transition duration-150 cursor-pointer border shrink-0 ${
                activeFilter === filter
                  ? "bg-[#F05A22] text-white border-[#F05A22] shadow-xs"
                  : "bg-white border-slate-150 text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {filter === "All" && "ประกาศทั้งหมด"}
              {filter === "Latest" && "ประกาศล่าสุด (5)"}
              {filter === "Important" && "สำคัญด่วน 📢"}
            </button>
          ))}
        </div>
      </div>

      {/* Main feed displays */}
      {isLoading ? (
        <div className="space-y-4">
          <p className="text-slate-400 text-xs font-bold animate-pulse text-center py-4">
            กำลังโหลดประกาศจาก KKU...
          </p>
          <LoadingState type="list" count={3} />
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto animate-bounce" />
          <div>
            <h3 className="font-bold text-rose-800 text-base">{error}</h3>
            <p className="text-xs text-rose-600 mt-1">เกิดข้อผิดพลาดในการดึงข้อมูลประกาศผ่านระบบ API</p>
          </div>
          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition duration-150 cursor-pointer shadow-md"
          >
            Try Again
          </button>
        </div>
      ) : displayItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayItems.map((item) => (
            <AnnouncementCard
              key={item.id}
              announcement={item}
              onClick={() => setSelectedItem(item)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={searchQuery ? "ไม่พบบทความประกาศที่ค้นหา" : "ยังไม่มีประกาศใหม่จาก KKU"}
          description={
            searchQuery 
              ? "ลองพิมพ์คำค้นหาอื่น ๆ หรือล้างตัวกรองเพื่อค้นหาประกาศใหม่อีกครั้ง" 
              : "ระบบประกาศของมหาวิทยาลัยขอนแก่นไม่มีความเคลื่อนไหวจากผู้ส่งในช่วงนี้"
          }
          action={
            searchQuery
              ? {
                  label: "ล้างการค้นหา",
                  onClick: () => setSearchQuery(""),
                }
              : undefined
          }
        />
      )}

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setSelectedItem(null)}
          />
          
          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {selectedItem.source === "Gmail" ? (
                  <span className="text-[10px] px-2.5 py-1 rounded-md font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 text-white border border-orange-200">
                    📢 KKU Official Announcement
                  </span>
                ) : (
                  <span className="text-[10px] px-2.5 py-1 rounded-md font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedItem.category}
                  </span>
                )}
                
                {selectedItem.isImportant && (
                  <span className="text-[10px] px-2.5 py-1 rounded-md font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    Important
                  </span>
                )}
              </div>
              
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {selectedItem.title}
                </h3>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-slate-400 mt-2 font-medium">
                  <span className="font-semibold text-slate-600">{selectedItem.sender}</span>
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span>Published Date: {selectedItem.dateStr}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                {/* Safe HTML Render or pre-line Plain Text */}
                {/<[a-z][\s\S]*>/i.test(selectedItem.content) ? (
                  <div 
                    className="prose prose-sm prose-orange max-w-full overflow-x-auto text-slate-600 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selectedItem.content }}
                  />
                ) : (
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-medium">
                    {selectedItem.content}
                  </p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Source: {selectedItem.source === "Gmail" ? "KKU Official Announcement via Gmail" : "KKU LifeOS Internal Server"}
              </span>
              
              <div className="flex items-center gap-2">
                {selectedItem.gmailLink && (
                  <a
                    href={selectedItem.gmailLink}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition duration-150 cursor-pointer"
                  >
                    Open in Gmail <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4.5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl font-bold text-xs transition duration-150 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
