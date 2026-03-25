export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
  avatar: string;
  helpfulCount: number;
}

export interface AppData {
  id: string;
  name: string;
  developer: string;
  category: string;
  rating?: number; // Optional, will be derived from reviews if possible
  downloads: string;
  icon: string;
  description: string;
  longDescription: string;
  downloadUrl: string;
  screenshots: string[];
  videoUrl?: string;
  reviews: Review[];
  size: string;
  version: string;
  isWishlisted?: boolean;
}

export const calculateRating = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};

export const CATEGORIES = [
  "Games",
  "Productivity",
  "Social",
  "Education",
  "Entertainment",
  "Finance",
  "Health & Fitness",
  "Tools"
];
