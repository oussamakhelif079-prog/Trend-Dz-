export type PostCategory = 'all' | 'memes' | 'video' | 'posts' | 'audio';

export type MediaType = 'image' | 'video' | 'none';

export type UserRole = 'user' | 'owner';

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorRole?: UserRole;
  authorWilaya: string;
  wilayaNumber: number;
  category: PostCategory;
  content: string;
  mediaUrl?: string;
  mediaType: MediaType;
  hashtags: string[];
  soundTitle?: string;
  createdAt: string; // ISO string
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  likedBy: string[]; // user IDs
  savedBy: string[]; // user IDs
  isDevSeed?: boolean;
  trendScore?: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorRole?: UserRole;
  authorWilaya: string;
  content: string;
  createdAt: string;
  likesCount: number;
  likedBy: string[];
}

export interface UserProfile {
  id: string;
  uid?: string; // Firebase Auth UID
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  photoURL?: string; // Firebase standard photoURL
  bio: string;
  wilaya: string;
  wilayaNumber: number;
  role: UserRole; // 'user' | 'owner'
  followersCount: number;
  followingCount: number;
  postsCount: number;
  followers: string[]; // user IDs
  following: string[]; // user IDs
  isVerified?: boolean;
  joinedAt: string;
  createdAt?: string; // Firebase standard createdAt
}

export interface Wilaya {
  number: number;
  code: string;
  nameAr: string;
  nameFr: string;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'report';
  actorId: string;
  actorUsername: string;
  actorAvatar: string;
  postId?: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface ReportItem {
  id: string;
  targetType: 'post' | 'user' | 'comment';
  targetId: string;
  reporterId: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'fake_scam';
  details?: string;
  createdAt: string;
}

export type NavigationTab = 'feed' | 'trend' | 'create' | 'search' | 'profile';
