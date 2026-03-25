import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { Search, Plus, Home as HomeIcon, LayoutGrid, Download, Star, ArrowLeft, X, Info, ShieldCheck, MessageSquare, ChevronRight, Share2, MoreVertical, Heart, CheckCircle2, Edit, Trash2, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import { AppData, CATEGORIES, Review, calculateRating } from "./types";
import { getApps, saveApp, updateApp, toggleWishlist, deleteApp } from "./lib/storage";
import { cn } from "./lib/utils";

// Components
const DownloadProgress = ({ app, onComplete }: { app: AppData, onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Connecting...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!app.downloadUrl || app.downloadUrl === "#") {
      // Realistic simulation for demo links
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 8;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          setTimeout(onComplete, 800);
        }
        setProgress(p);
        setStatus(p < 20 ? "Connecting..." : p < 80 ? "Downloading..." : "Finalizing...");
      }, 150);
      return () => clearInterval(interval);
    }

    // Real download attempt using XHR for progress tracking
    const xhr = new XMLHttpRequest();
    xhr.open('GET', app.downloadUrl, true);
    xhr.responseType = 'blob';

    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setProgress(percentComplete);
        setStatus(`Downloading... ${Math.round(percentComplete)}%`);
      } else {
        setStatus("Downloading...");
        // Fallback progress if length not computable
        setProgress(prev => Math.min(prev + 0.5, 99));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = xhr.response;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Extract filename and extension from URL
        const urlPath = app.downloadUrl.split('?')[0];
        const urlFileName = urlPath.split('/').pop();
        const hasExtension = urlFileName && urlFileName.includes('.');
        const extension = hasExtension ? urlFileName?.split('.').pop() : 'apk';
        const fileName = hasExtension ? urlFileName : `${app.name.replace(/\s+/g, '_')}.${extension}`;
        
        a.download = fileName || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setProgress(100);
        setStatus("Download complete!");
        
        // Save to download history
        const history = JSON.parse(localStorage.getItem("download_history") || "[]");
        const newEntry = {
          id: Date.now().toString(),
          appId: app.id,
          appName: app.name,
          appIcon: app.icon,
          date: new Date().toLocaleString(),
          size: app.size
        };
        localStorage.setItem("download_history", JSON.stringify([newEntry, ...history]));
        
        setTimeout(onComplete, 1000);
      } else {
        setError("Download failed. Opening link directly...");
        window.open(app.downloadUrl, '_blank');
        setTimeout(onComplete, 2000);
      }
    };

    xhr.onerror = () => {
      setError("CORS policy blocked direct download. Opening in new tab...");
      window.open(app.downloadUrl, '_blank');
      // Fast simulation for UI feedback
      let p = 0;
      const interval = setInterval(() => {
        p += 5;
        if (p >= 100) {
          clearInterval(interval);
          onComplete();
        }
        setProgress(p);
      }, 50);
    };

    xhr.send();

    return () => xhr.abort();
  }, [app, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 p-6 w-[95%] max-w-md"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 relative overflow-hidden">
          <img src={app.icon} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <Download size={28} className="relative z-10" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 truncate">{app.name}</h4>
          <p className={cn("text-xs font-medium", error ? "text-amber-600" : "text-emerald-600")}>
            {error || status}
          </p>
        </div>
        <button onClick={onComplete} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X size={20} className="text-gray-400" />
        </button>
      </div>
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        />
      </div>
      <div className="mt-3 flex justify-between items-center">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">NextGen Installer</span>
        <span className="text-xs font-bold text-gray-900">{Math.round(progress)}%</span>
      </div>
    </motion.div>
  );
};
const Navbar = ({ onSearch }: { onSearch: (q: string) => void }) => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover:scale-105 transition-transform">
            <LayoutGrid size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">NextGen Store</span>
        </Link>

        {isHome && (
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search apps, games, and more..."
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-full py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-sm"
            />
          </div>
        )}

        <div className="flex items-center gap-4">
          <Link to="/downloads" className="p-2 text-gray-500 hover:text-emerald-600 transition-colors relative">
            <Download size={22} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></span>
          </Link>
          <Link
            to="/add"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full font-medium transition-colors shadow-lg shadow-emerald-100"
          >
            <Plus size={20} />
            <span className="hidden md:inline">Add App</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

const AppCard: React.FC<{ app: AppData }> = ({ app }) => {
  const navigate = useNavigate();
  const rating = app.reviews.length > 0 ? calculateRating(app.reviews) : (app.rating || 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/app/${app.id}`)}
      className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50/50 transition-all group cursor-pointer"
    >
      <div className="flex gap-4">
        <img
          src={app.icon}
          alt={app.name}
          className="w-20 h-20 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">{app.name}</h3>
          <p className="text-sm text-gray-500 truncate">{app.developer}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              {rating > 0 ? rating : "New"}
            </div>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs font-medium text-gray-600">{app.downloads}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
          {app.category}
        </span>
        <button
          className="flex items-center gap-2 bg-gray-900 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            toast.success(`Installing ${app.name}...`, {
              description: "Check your notification panel for progress.",
              icon: <Download size={16} />
            });
          }}
        >
          <Download size={16} />
          Install
        </button>
      </div>
    </motion.div>
  );
};

const AppDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<AppData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    const apps = getApps();
    const found = apps.find(a => a.id === id);
    if (found) setApp(found);
    window.scrollTo(0, 0);
  }, [id]);

  const handleInstall = () => {
    setIsDownloading(true);
  };

  const handleDownloadComplete = () => {
    setIsDownloading(false);
    toast.success(`${app?.name} installed successfully!`, {
      description: "You can now open the app from your home screen.",
      icon: <CheckCircle2 size={18} />
    });
    if (app?.downloadUrl && app.downloadUrl !== "#") {
      window.open(app.downloadUrl, '_blank');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.info("Link copied to clipboard!", {
      description: "You can now share this app with your friends."
    });
  };

  const handleToggleWishlist = () => {
    if (!app) return;
    toggleWishlist(app.id);
    const updatedApps = getApps();
    const found = updatedApps.find(a => a.id === id);
    if (found) setApp(found);
    
    if (!app.isWishlisted) {
      toast.success("Added to wishlist", { icon: <Heart size={16} className="fill-red-500 text-red-500" /> });
    } else {
      toast("Removed from wishlist");
    }
  };

  const handleHelpful = (reviewId: string) => {
    if (!app) return;
    const updatedReviews = app.reviews.map(r => 
      r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
    );
    const updatedApp = { ...app, reviews: updatedReviews };
    updateApp(updatedApp);
    setApp(updatedApp);
    toast.success("Thanks for your feedback!");
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!app) return;
    
    const review: Review = {
      id: Date.now().toString(),
      user: "You",
      rating: newReview.rating,
      comment: newReview.comment,
      date: "Just now",
      avatar: "https://i.pravatar.cc/150?u=you",
      helpfulCount: 0
    };

    const updatedApp = { ...app, reviews: [review, ...app.reviews] };
    updateApp(updatedApp);
    setApp(updatedApp);
    setNewReview({ rating: 5, comment: "" });
    toast.success("Review posted!");
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this app?")) {
      deleteApp(app!.id);
      toast.error("App deleted");
      navigate("/");
    }
  };

  if (!app) return <div className="p-20 text-center">App not found</div>;

  const rating = app.reviews.length > 0 ? calculateRating(app.reviews) : (app.rating || 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto px-4 py-8"
    >
      <AnimatePresence>
        {isDownloading && (
          <DownloadProgress app={app} onComplete={handleDownloadComplete} />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors">
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/edit/${app.id}`)}
            className="p-2.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
          >
            <Edit size={18} />
          </button>
          <button 
            onClick={handleDelete}
            className="p-2.5 rounded-full border border-gray-200 hover:bg-red-50 hover:text-red-500 transition-colors text-gray-600"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
        <img
          src={app.icon}
          alt={app.name}
          className="w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] object-cover shadow-2xl shadow-emerald-100"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">{app.name}</h1>
          <p className="text-xl text-emerald-600 font-medium mb-6">{app.developer}</p>
          
          <div className="flex flex-wrap gap-8 mb-8 border-y border-gray-100 py-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 font-bold text-lg">
                {rating > 0 ? rating : "New"} <Star size={18} className="fill-gray-900" />
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">{app.reviews.length} reviews</p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="text-center">
              <div className="font-bold text-lg">{app.downloads}</div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">Downloads</p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="text-center">
              <div className="font-bold text-lg">{app.size}</div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">Size</p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="text-center">
              <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">E</div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1">Everyone</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handleInstall}
              className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-3 rounded-full font-bold shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              Install
            </button>
            <button 
              onClick={handleToggleWishlist}
              className={cn(
                "p-3 rounded-full border transition-all active:scale-90",
                app.isWishlisted ? "bg-red-50 border-red-100 text-red-500" : "border-gray-200 hover:bg-gray-50 text-gray-600"
              )}
            >
              <Heart size={20} className={cn(app.isWishlisted && "fill-current")} />
            </button>
            <button 
              onClick={handleShare}
              className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors active:scale-90"
            >
              <Share2 size={20} className="text-gray-600" />
            </button>
            <button 
              onClick={() => toast("More options coming soon!")}
              className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors active:scale-90"
            >
              <MoreVertical size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Screenshots */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
          Screenshots
          <ChevronRight size={20} className="text-gray-400" />
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
          {app.screenshots.map((s, i) => (
            <img
              key={i}
              src={s}
              alt="Screenshot"
              className="h-64 md:h-96 rounded-2xl object-cover shadow-lg flex-shrink-0"
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
      </section>

      {/* About */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
          About this app
          <ChevronRight size={20} className="text-gray-400" />
        </h2>
        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
          {app.longDescription || app.description}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="px-4 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-600">#{app.category}</span>
          <span className="px-4 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-600">#TopCharts</span>
        </div>
      </section>

      {/* Data Safety */}
      <section className="mb-12 p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ShieldCheck className="text-emerald-600" />
          Data safety
        </h2>
        <p className="text-sm text-gray-600 mb-6">Safety starts with understanding how developers collect and share your data. Data privacy and security practices may vary based on your use, region, and age.</p>
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="p-2 bg-white rounded-lg shadow-sm"><Info size={18} className="text-gray-400" /></div>
            <div>
              <p className="font-semibold text-sm">No data shared with third parties</p>
              <p className="text-xs text-gray-500">The developer says this app doesn't share user data with other companies or organizations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Ratings and reviews</h2>
          <button className="text-emerald-600 font-bold text-sm">See all reviews</button>
        </div>

        {/* Add Review Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 mb-8">
          <h3 className="font-bold mb-4">Write a review</h3>
          <form onSubmit={handleAddReview} className="space-y-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                  className="transition-transform active:scale-90"
                >
                  <Star size={24} className={cn(star <= newReview.rating ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
                </button>
              ))}
            </div>
            <textarea
              required
              value={newReview.comment}
              onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
              placeholder="Tell others what you think about this app..."
              className="w-full bg-gray-50 border border-transparent focus:border-emerald-500 rounded-xl px-4 py-3 outline-none transition-all resize-none"
              rows={3}
            />
            <button
              type="submit"
              className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 transition-all"
            >
              <Send size={16} />
              Post Review
            </button>
          </form>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {app.reviews.map(review => (
            <div key={review.id} className="bg-white p-6 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={review.avatar} alt={review.user} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-bold text-sm">{review.user}</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} className={cn(i < review.rating ? "fill-gray-900" : "text-gray-200")} />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{review.date}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{review.comment}</p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <span className="text-xs text-gray-400">{review.helpfulCount} people found this helpful</span>
                <button 
                  onClick={() => handleHelpful(review.id)}
                  className="text-xs font-bold text-gray-500 hover:text-emerald-600 transition-colors"
                >
                  Helpful?
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

const Home = ({ searchQuery }: { searchQuery: string }) => {
  const [apps, setApps] = useState<AppData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    setApps(getApps());
  }, []);

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.developer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2.5rem] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl shadow-emerald-200">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest mb-6">New Arrivals</span>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-none">Apps that move you.</h1>
            <p className="text-emerald-50 text-xl mb-10 opacity-90 font-medium">Experience the next generation of software. Faster, smarter, and more beautiful than ever before.</p>
            <div className="flex gap-4">
              <button className="bg-white text-emerald-700 px-10 py-4 rounded-full font-bold hover:bg-emerald-50 transition-all shadow-xl hover:scale-105 active:scale-95">
                Get Started
              </button>
              <button className="bg-emerald-500/30 backdrop-blur-md text-white border border-white/30 px-10 py-4 rounded-full font-bold hover:bg-emerald-500/40 transition-all">
                Learn More
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <LayoutGrid size={600} className="translate-x-1/4 -translate-y-1/4" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-6 mb-8 no-scrollbar">
        <button
          onClick={() => setSelectedCategory("All")}
          className={cn(
            "px-8 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap border-2",
            selectedCategory === "All" ? "bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-100" : "bg-white text-gray-600 border-gray-100 hover:border-emerald-200"
          )}
        >
          All Apps
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-8 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap border-2",
              selectedCategory === cat ? "bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-100" : "bg-white text-gray-600 border-gray-100 hover:border-emerald-200"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* App Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredApps.map(app => (
            <AppCard key={app.id} app={app} />
          ))}
        </AnimatePresence>
      </div>

      {filteredApps.length === 0 && (
        <div className="text-center py-32">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <Search size={40} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No apps found</h3>
          <p className="text-gray-500 max-w-xs mx-auto">We couldn't find any apps matching your search. Try different keywords.</p>
        </div>
      )}
    </div>
  );
};

const AddApp = () => {
  const [formData, setFormData] = useState({
    name: "",
    developer: "",
    category: CATEGORIES[0],
    description: "",
    longDescription: "",
    downloadUrl: "",
    icon: "",
    size: "25 MB",
    version: "1.0.0",
    rating: 4.5,
    screenshots: ""
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newApp: AppData = {
      ...formData,
      id: Date.now().toString(),
      downloads: "0",
      screenshots: formData.screenshots.split(",").map(s => s.trim()).filter(Boolean),
      reviews: []
    };
    if (newApp.screenshots.length === 0) {
      newApp.screenshots = [
        `https://picsum.photos/seed/${formData.name}1/800/1200`,
        `https://picsum.photos/seed/${formData.name}2/800/1200`
      ];
    }
    saveApp(newApp);
    setIsSuccess(true);
    setTimeout(() => navigate('/'), 1500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 mb-8 transition-colors group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Store
      </Link>

      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl shadow-gray-100/50">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">Publish App</h2>
        <p className="text-gray-500 mb-10">Launch your app on the world's most modern store.</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">App Name</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Awesome App"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Developer</label>
              <input
                required
                type="text"
                value={formData.developer}
                onChange={e => setFormData({...formData, developer: e.target.value})}
                placeholder="e.g. John Doe"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all appearance-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Size</label>
              <input
                type="text"
                value={formData.size}
                onChange={e => setFormData({...formData, size: e.target.value})}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Initial Rating</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Icon URL</label>
            <input
              required
              type="url"
              value={formData.icon}
              onChange={e => setFormData({...formData, icon: e.target.value})}
              placeholder="https://example.com/icon.png"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Download Link (URL)</label>
            <input
              required
              type="url"
              value={formData.downloadUrl}
              onChange={e => setFormData({...formData, downloadUrl: e.target.value})}
              placeholder="https://example.com/file.zip or .apk"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Screenshot URLs (comma separated)</label>
            <textarea
              value={formData.screenshots}
              onChange={e => setFormData({...formData, screenshots: e.target.value})}
              placeholder="url1, url2, url3..."
              className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Description (Short)</label>
            <input
              required
              type="text"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="One line about your app..."
              className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Full Description</label>
            <textarea
              required
              rows={5}
              value={formData.longDescription}
              onChange={e => setFormData({...formData, longDescription: e.target.value})}
              placeholder="Detailed explanation of features..."
              className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-3 text-lg"
          >
            <Plus size={24} />
            Publish to Store
          </button>
        </form>

        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 p-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl text-emerald-700 text-center font-bold"
            >
              🎉 App published! Redirecting to store...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const EditApp = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    const apps = getApps();
    const app = apps.find(a => a.id === id);
    if (app) {
      setFormData({
        ...app,
        screenshots: app.screenshots.join(", ")
      });
    }
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedApp: AppData = {
      ...formData,
      screenshots: formData.screenshots.split(",").map((s: string) => s.trim()).filter(Boolean)
    };
    updateApp(updatedApp);
    toast.success("App updated successfully!");
    navigate(`/app/${id}`);
  };

  if (!formData) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 mb-8 transition-colors group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl shadow-gray-100/50">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">Edit App</h2>
        <p className="text-gray-500 mb-10">Update your app details.</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">App Name</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Developer</label>
              <input
                required
                type="text"
                value={formData.developer}
                onChange={e => setFormData({...formData, developer: e.target.value})}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all appearance-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Size</label>
              <input
                type="text"
                value={formData.size}
                onChange={e => setFormData({...formData, size: e.target.value})}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Version</label>
              <input
                type="text"
                value={formData.version}
                onChange={e => setFormData({...formData, version: e.target.value})}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Icon URL</label>
            <input
              required
              type="url"
              value={formData.icon}
              onChange={e => setFormData({...formData, icon: e.target.value})}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Download Link (URL)</label>
            <input
              required
              type="url"
              value={formData.downloadUrl}
              onChange={e => setFormData({...formData, downloadUrl: e.target.value})}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Screenshot URLs (comma separated)</label>
            <textarea
              value={formData.screenshots}
              onChange={e => setFormData({...formData, screenshots: e.target.value})}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Description (Short)</label>
            <input
              required
              type="text"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Full Description</label>
            <textarea
              required
              rows={5}
              value={formData.longDescription}
              onChange={e => setFormData({...formData, longDescription: e.target.value})}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl px-5 py-4 outline-none transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 rounded-2xl shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-3 text-lg"
          >
            <CheckCircle2 size={24} />
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

const Downloads = () => {
  const [history, setHistory] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("download_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("download_history");
    setHistory([]);
    toast.success("Download history cleared");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Downloads</h1>
          <p className="text-gray-500">Manage your installed applications and history.</p>
        </div>
        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="text-sm font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-full transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="space-y-4">
          {history.map((item) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={item.id}
              className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center gap-5 hover:shadow-lg transition-all group cursor-pointer"
              onClick={() => navigate(`/app/${item.appId}`)}
            >
              <img src={item.appIcon} alt="" className="w-16 h-16 rounded-2xl object-cover" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{item.appName}</h3>
                <p className="text-xs text-gray-400 mt-1">Installed on {item.date}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900">{item.size}</span>
                <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                  <CheckCircle2 size={12} />
                  Installed
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <Download size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No downloads yet</h3>
          <p className="text-gray-500 max-w-xs mx-auto">Apps you install will appear here for quick access.</p>
          <Link to="/" className="inline-block mt-8 bg-emerald-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-emerald-100">
            Explore Apps
          </Link>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-emerald-100 selection:text-emerald-900">
        <Toaster position="top-center" richColors />
        <Navbar onSearch={setSearchQuery} />
        <main>
          <Routes>
            <Route path="/" element={<Home searchQuery={searchQuery} />} />
            <Route path="/app/:id" element={<AppDetails />} />
            <Route path="/add" element={<AddApp />} />
            <Route path="/edit/:id" element={<EditApp />} />
            <Route path="/downloads" element={<Downloads />} />
          </Routes>
        </main>
        
        <footer className="bg-white border-t border-gray-100 py-20 mt-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <LayoutGrid size={24} />
                  </div>
                  <span className="font-bold text-2xl tracking-tight">NextGen Store</span>
                </div>
                <p className="text-gray-500 max-w-sm leading-relaxed">The world's most advanced platform for discovering and sharing the next generation of applications. Built for creators, by creators.</p>
              </div>
              <div>
                <h4 className="font-bold mb-6 text-gray-900">Platform</h4>
                <ul className="space-y-4 text-gray-500">
                  <li><a href="#" className="hover:text-emerald-600 transition-colors">Browse Apps</a></li>
                  <li><a href="#" className="hover:text-emerald-600 transition-colors">Top Charts</a></li>
                  <li><a href="#" className="hover:text-emerald-600 transition-colors">New Releases</a></li>
                  <li><a href="#" className="hover:text-emerald-600 transition-colors">Categories</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-6 text-gray-900">Developers</h4>
                <ul className="space-y-4 text-gray-500">
                  <li><a href="#" className="hover:text-emerald-600 transition-colors">Submit App</a></li>
                  <li><a href="#" className="hover:text-emerald-600 transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-emerald-600 transition-colors">API Reference</a></li>
                  <li><a href="#" className="hover:text-emerald-600 transition-colors">Guidelines</a></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-gray-400 text-sm">© 2026 NextGen Store. All rights reserved.</p>
              <div className="flex items-center gap-8 text-sm font-medium text-gray-400">
                <a href="#" className="hover:text-emerald-600 transition-colors">Privacy</a>
                <a href="#" className="hover:text-emerald-600 transition-colors">Terms</a>
                <a href="#" className="hover:text-emerald-600 transition-colors">Cookies</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
