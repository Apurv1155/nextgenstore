import { AppData } from "../types";

const INITIAL_APPS: AppData[] = [
  {
    id: "1",
    name: "Skyward Messenger",
    developer: "CloudSoft",
    category: "Social",
    rating: 4.8,
    downloads: "10M+",
    size: "45 MB",
    version: "2.4.1",
    icon: "https://picsum.photos/seed/skyward/200/200",
    description: "A fast and secure messaging app for everyone.",
    longDescription: "Skyward Messenger is the world's most advanced communication platform. Built with end-to-end encryption, it ensures your private conversations stay private. Share high-quality media, create groups of up to 5000 members, and enjoy crystal-clear voice and video calls. Our cloud-based architecture means your messages are synced across all your devices instantly.",
    downloadUrl: "#",
    screenshots: [
      "https://picsum.photos/seed/sky1/800/1200",
      "https://picsum.photos/seed/sky2/800/1200",
      "https://picsum.photos/seed/sky3/800/1200"
    ],
    reviews: [
      { id: "r1", user: "Alex Rivers", rating: 5, comment: "Best messaging app I've ever used. The stickers are amazing!", date: "2 days ago", avatar: "https://i.pravatar.cc/150?u=alex", helpfulCount: 12 },
      { id: "r2", user: "Sarah Chen", rating: 4, comment: "Very fast, but I wish there were more themes.", date: "1 week ago", avatar: "https://i.pravatar.cc/150?u=sarah", helpfulCount: 5 }
    ]
  },
  {
    id: "2",
    name: "Neon Racer",
    developer: "CyberGames",
    category: "Games",
    rating: 4.5,
    downloads: "5M+",
    size: "1.2 GB",
    version: "1.0.5",
    icon: "https://picsum.photos/seed/neon/200/200",
    description: "High-speed racing in a cyberpunk world.",
    longDescription: "Experience the adrenaline-pumping speed of the future. Neon Racer features ultra-realistic physics, customizable hover-cars, and 20 challenging tracks set in a vibrant neon-lit metropolis. Compete against players worldwide in real-time multiplayer mode and climb the global leaderboards.",
    downloadUrl: "#",
    screenshots: [
      "https://picsum.photos/seed/neon1/1200/800",
      "https://picsum.photos/seed/neon2/1200/800",
      "https://picsum.photos/seed/neon3/1200/800"
    ],
    reviews: [
      { id: "r3", user: "Mike Wheeler", rating: 5, comment: "Graphics are insane! Feels like I'm in the future.", date: "3 days ago", avatar: "https://i.pravatar.cc/150?u=mike", helpfulCount: 42 }
    ]
  },
  {
    id: "3",
    name: "Focus Flow",
    developer: "ZenApps",
    category: "Productivity",
    rating: 4.9,
    downloads: "1M+",
    size: "12 MB",
    version: "3.2.0",
    icon: "https://picsum.photos/seed/focus/200/200",
    description: "The ultimate productivity timer and task manager.",
    longDescription: "Master your time with Focus Flow. Combining the power of the Pomodoro technique with a robust task management system, Focus Flow helps you stay deep in your work without distractions. Features include detailed analytics, ambient soundscapes, and cross-platform synchronization.",
    downloadUrl: "#",
    screenshots: [
      "https://picsum.photos/seed/focus1/800/1200",
      "https://picsum.photos/seed/focus2/800/1200"
    ],
    reviews: [
      { id: "r4", user: "Elena Gilbert", rating: 5, comment: "This app changed my study habits completely. Highly recommend!", date: "5 days ago", avatar: "https://i.pravatar.cc/150?u=elena", helpfulCount: 8 }
    ]
  }
];

export const getApps = (): AppData[] => {
  const saved = localStorage.getItem("nextgen_apps");
  if (saved) {
    return JSON.parse(saved);
  }
  return INITIAL_APPS;
};

export const saveApp = (app: AppData) => {
  const apps = getApps();
  const updated = [app, ...apps];
  localStorage.setItem("nextgen_apps", JSON.stringify(updated));
};

export const updateApp = (updatedApp: AppData) => {
  const apps = getApps();
  const updated = apps.map(a => a.id === updatedApp.id ? updatedApp : a);
  localStorage.setItem("nextgen_apps", JSON.stringify(updated));
};

export const deleteApp = (appId: string) => {
  const apps = getApps();
  const updated = apps.filter(a => a.id !== appId);
  localStorage.setItem("nextgen_apps", JSON.stringify(updated));
};

export const toggleWishlist = (appId: string) => {
  const apps = getApps();
  const updated = apps.map(a => a.id === appId ? { ...a, isWishlisted: !a.isWishlisted } : a);
  localStorage.setItem("nextgen_apps", JSON.stringify(updated));
};
