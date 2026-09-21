import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Post, UserProfile, Comment, NotificationItem, ReportItem, NavigationTab, PostCategory, UserRole } from '../types';
import { SEED_POSTS, SEED_USERS, SEED_COMMENTS } from '../data/seedData';
import { firebaseStatus, auth, db, signInWithGoogle, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, limit } from 'firebase/firestore';
import { OWNER_UID, isOwnerUid, isOwnerUser } from './ownerConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';

interface AppStoreContextType {
  // Navigation & Theme
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Auth State
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  isOwner: boolean;
  ownerUid: string;
  loginAsDemoUser: (userId: string) => void;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  login: (email: string, pass: string) => { success: boolean; error?: string };
  registerUser: (username: string, displayName: string, email: string, wilaya: string, wilayaNumber: number) => Promise<boolean>;
  register: (params: { displayName: string; username: string; email: string; password?: string; wilaya: string; wilayaNumber: number }) => { success: boolean; error?: string };
  logout: () => void;
  updateProfile: (updated: Partial<UserProfile>) => void;
  followUser: (targetUserId: string) => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;

  // Posts Feed & Filtering
  posts: Post[];
  selectedCategory: PostCategory;
  setSelectedCategory: (cat: PostCategory) => void;
  selectedWilaya: number | null; // null for all
  setSelectedWilaya: (wNum: number | null) => void;
  likePost: (postId: string) => void;
  sharePost: (postId: string) => void;
  incrementViews: (postId: string) => void;
  createPost: (params: {
    content: string;
    mediaUrl?: string;
    mediaType: 'image' | 'video' | 'none';
    category: PostCategory;
    wilaya: string;
    wilayaNumber: number;
    soundTitle?: string;
    hashtags?: string[];
  }) => { success: boolean; error?: string };
  deletePost: (postId: string) => void;

  // Comments
  comments: Comment[];
  activeCommentsPostId: string | null;
  openComments: (postId: string) => void;
  closeComments: () => void;
  addComment: (postId: string, content: string) => boolean;
  likeComment: (commentId: string) => void;

  // AI Assistant Modal
  isAIAssistantOpen: boolean;
  openAIAssistant: (initialPrompt?: string) => void;
  closeAIAssistant: () => void;

  // Notifications
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationsAsRead: () => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;

  // Reports
  submitReport: (report: Omit<ReportItem, 'id' | 'createdAt' | 'reporterId'>) => boolean;
  activeReportTarget: { type: 'post' | 'user' | 'comment'; id: string } | null;
  reportTarget: { type: 'post' | 'user' | 'comment'; id: string } | null;
  openReportModal: (target: { type: 'post' | 'user' | 'comment'; id: string }) => void;
  closeReportModal: () => void;

  // Status & Feedback Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppStoreContext = createContext<AppStoreContextType | null>(null);

const STORAGE_KEYS = {
  POSTS: 'trend_dz_posts_v1',
  USERS: 'trend_dz_users_v1',
  COMMENTS: 'trend_dz_comments_v1',
  CURRENT_USER_ID: 'trend_dz_curr_user_v1',
  DARK_MODE: 'trend_dz_dark_mode_v1',
  NOTIFICATIONS: 'trend_dz_notifs_v1',
};

// Trend score formula: Likes*3 + Comments*4 + Shares*5 + Views*0.1
export function calculateTrendScore(post: Post): number {
  return post.likesCount * 3 + post.commentsCount * 4 + post.sharesCount * 5 + Math.round(post.viewsCount * 0.1);
}

export const AppStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [currentTab, setCurrentTab] = useState<NavigationTab>('feed');

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Users State
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    let initialList = SEED_USERS;
    const local = localStorage.getItem(STORAGE_KEYS.USERS);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialList = parsed;
        }
      } catch {
        // fallback
      }
    }
    // Security Enforcement: dynamically guarantee role is strictly derived from OWNER_UID
    return initialList.map((u) => ({
      ...u,
      uid: u.uid || u.id,
      photoURL: u.photoURL || u.avatarUrl,
      role: (isOwnerUid(u.uid || u.id) ? 'owner' : 'user') as UserRole,
      createdAt: u.createdAt || u.joinedAt || new Date().toISOString(),
    }));
  });

  // Current Logged-in User
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'user_amine_dz'; // Default to Amine for immediate experience
  });

  const currentUser = useMemo(() => {
    if (!currentUserId) return null;
    const u = allUsers.find((user) => user.id === currentUserId || user.uid === currentUserId);
    if (!u) return null;
    const role: UserRole = isOwnerUid(u.uid || u.id) ? 'owner' : 'user';
    return {
      ...u,
      role,
    };
  }, [currentUserId, allUsers]);

  const isOwner = useMemo(() => {
    return isOwnerUser(currentUser);
  }, [currentUser]);

  // Sync Firebase Auth if configured
  useEffect(() => {
    if (!auth) return;
    try {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const userIsOwner = isOwnerUid(firebaseUser.uid);
          setAllUsers((prev) => {
            const existing = prev.find((u) => u.id === firebaseUser.uid || u.uid === firebaseUser.uid);
            if (existing) {
              return prev.map((u) =>
                u.id === existing.id
                  ? {
                      ...u,
                      uid: firebaseUser.uid,
                      role: userIsOwner ? 'owner' : 'user',
                      email: firebaseUser.email || u.email,
                      displayName: firebaseUser.displayName || u.displayName,
                      photoURL: firebaseUser.photoURL || u.photoURL,
                    }
                  : u
              );
            }
            // Add new user profile from Firebase
            const newUserProfile: UserProfile = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              username: firebaseUser.email ? firebaseUser.email.split('@')[0] : `user_${firebaseUser.uid.slice(0, 6)}`,
              displayName: firebaseUser.displayName || 'مستخدم جزائري 🇩🇿',
              avatarUrl: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
              photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
              bio: 'عضو في TREND DZ 🇩🇿✨',
              wilaya: 'الجزائر',
              wilayaNumber: 16,
              role: userIsOwner ? 'owner' : 'user',
              followersCount: 0,
              followingCount: 0,
              postsCount: 0,
              followers: [],
              following: [],
              isVerified: userIsOwner,
              joinedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            };
            return [...prev, newUserProfile];
          });
          setCurrentUserId(firebaseUser.uid);
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('[TREND DZ] Firebase Auth subscription notice:', e);
    }
  }, []);

  // Posts State
  const [posts, setPosts] = useState<Post[]>(() => {
    const local = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        // fallback
      }
    }
    return SEED_POSTS.map((p) => ({ ...p, trendScore: calculateTrendScore(p) }));
  });

  // Firestore Posts Sync
  useEffect(() => {
    if (!db) return;
    const postsPath = 'posts';
    try {
      const q = query(collection(db, postsPath), limit(100));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const fsPosts: Post[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Post;
              fsPosts.push({
                ...data,
                id: docSnap.id,
                trendScore: calculateTrendScore(data),
              });
            });
            // Merge with local seed posts
            setPosts((prev) => {
              const merged = [...fsPosts];
              prev.forEach((p) => {
                if (!merged.some((mp) => mp.id === p.id)) {
                  merged.push(p);
                }
              });
              return merged;
            });
          }
        },
        (error) => {
          console.warn('[TREND DZ] Firestore posts sync note:', error.message);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('[TREND DZ] Firestore sync setup:', e);
    }
  }, []);

  // Comments State
  const [comments, setComments] = useState<Comment[]>(() => {
    const local = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        // fallback
      }
    }
    return SEED_COMMENTS;
  });

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const local = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'notif_1',
        type: 'like',
        actorId: 'user_sarah_oran',
        actorUsername: 'sarah_wahran',
        actorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        postId: 'post_1',
        text: 'أعجب بمنشورك الأخير حول ميمز الباك 😂',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        read: false,
      },
      {
        id: 'notif_2',
        type: 'follow',
        actorId: 'user_mehdi_setif',
        actorUsername: 'mehdi_elain',
        actorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        text: 'بدأ بمتابعتك! ناس سطيف راهم هنا 🦅',
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        read: false,
      },
    ];
  });

  // Modals & UI States
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>('all');
  const [selectedWilaya, setSelectedWilaya] = useState<number | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeReportTarget, setActiveReportTarget] = useState<{ type: 'post' | 'user' | 'comment'; id: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }
  }, [currentUserId]);

  // Auth Operations
  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const loginAsDemoUser = (userId: string) => {
    setCurrentUserId(userId);
    setIsAuthModalOpen(false);
    const u = allUsers.find((x) => x.id === userId);
    showToast(`مرحبا بك مجدداً يا ${u?.displayName || 'خونا'}! 🇩🇿`);
  };

  const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
    const res = login(email, pass);
    return res.success;
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      if (user) {
        showToast(`مرحبا بك يا ${user.displayName || 'خونا'}! 🇩🇿✨`);
        setIsAuthModalOpen(false);
        return { success: true };
      }
      return { success: false, error: 'لم يتم استرجاع معلومات الحساب' };
    } catch (err: any) {
      const msg = err?.message || 'فشل تسجيل الدخول باستخدام Google';
      showToast(msg);
      return { success: false, error: msg };
    }
  };

  const login = (email: string, pass: string): { success: boolean; error?: string } => {
    const found = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUserId(found.id);
      setIsAuthModalOpen(false);
      showToast(`تم تسجيل الدخول بنجاح! مرحبا ${found.displayName} 🇩🇿`);
      return { success: true };
    }
    return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة، أو يمكنك الدخول كحساب تجريبي.' };
  };

  const registerUser = async (
    username: string,
    displayName: string,
    email: string,
    wilaya: string,
    wilayaNumber: number
  ): Promise<boolean> => {
    const res = register({ username, displayName, email, wilaya, wilayaNumber });
    return res.success;
  };

  const register = (params: {
    displayName: string;
    username: string;
    email: string;
    password?: string;
    wilaya: string;
    wilayaNumber: number;
  }): { success: boolean; error?: string } => {
    const cleanUsername = params.username.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const existing = allUsers.find(
      (u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === params.email.toLowerCase()
    );
    if (existing) {
      return { success: false, error: 'اسم المستخدم أو البريد الإلكتروني مسجل مسبقاً.' };
    }
    const newId = `user_${Date.now()}`;
    const newUser: UserProfile = {
      id: newId,
      uid: newId,
      username: cleanUsername || `dz_user_${Math.floor(Math.random() * 1000)}`,
      displayName: params.displayName,
      email: params.email,
      bio: 'عضو جديد في TREND DZ 🇩🇿✨',
      wilaya: params.wilaya,
      wilayaNumber: params.wilayaNumber,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
      photoURL: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
      role: (isOwnerUid(newId) ? 'owner' : 'user') as UserRole, // Strictly defaults to 'user'
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      followers: [],
      following: [],
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setAllUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setIsAuthModalOpen(false);
    showToast(`مرحبا بك في TREND DZ، يا ${params.displayName}! 🚀`);
    return { success: true };
  };

  const logout = () => {
    if (auth) {
      signOut(auth).catch(() => {});
    }
    setCurrentUserId(null);
    showToast('تم تسجيل الخروج بنجاح.');
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
    // Security: strip role to prevent user from self-assigning or tampering with owner status
    const { role: _ignoredRole, ...safeUpdates } = updated;
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUser.id) {
          return {
            ...u,
            ...safeUpdates,
            role: (isOwnerUid(u.uid || u.id) ? 'owner' : 'user') as UserRole,
          };
        }
        return u;
      })
    );
    showToast('تم تحديث بروفايلك بنجاح ✨');
  };

  const followUser = (targetUserId: string) => {
    if (!currentUser) {
      openAuthModal();
      return;
    }
    if (targetUserId === currentUser.id) {
      showToast('ما تقدرش تتابعي روحك يا خويا 😂');
      return;
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUser.id) {
          const newFollowing = isFollowing
            ? u.following.filter((id) => id !== targetUserId)
            : [...u.following, targetUserId];
          return {
            ...u,
            following: newFollowing,
            followingCount: newFollowing.length,
          };
        }
        if (u.id === targetUserId) {
          const newFollowers = isFollowing
            ? u.followers.filter((id) => id !== currentUser.id)
            : [...u.followers, currentUser.id];
          return {
            ...u,
            followers: newFollowers,
            followersCount: newFollowers.length,
          };
        }
        return u;
      })
    );

    if (!isFollowing) {
      // Add notification
      const newNotif: NotificationItem = {
        id: `notif_${Date.now()}`,
        type: 'follow',
        actorId: currentUser.id,
        actorUsername: currentUser.username,
        actorAvatar: currentUser.avatarUrl,
        text: `بدأ بمتابعتك!`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
      showToast('تمت المتابعة بنجاح! 🇩🇿');
    } else {
      showToast('تم إلغاء المتابعة.');
    }
  };

  // Post Operations
  const likePost = (postId: string) => {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const alreadyLiked = post.likedBy.includes(currentUser.id);
        const newLikedBy = alreadyLiked
          ? post.likedBy.filter((id) => id !== currentUser.id)
          : [...post.likedBy, currentUser.id];
        const newLikesCount = newLikedBy.length;
        const updated = {
          ...post,
          likedBy: newLikedBy,
          likesCount: newLikesCount,
        };

        if (db) {
          updateDoc(doc(db, 'posts', postId), {
            likedBy: newLikedBy,
            likesCount: newLikesCount,
          }).catch((err) => {
            console.warn('[TREND DZ] Firestore like sync notice:', err.message);
          });
        }

        return {
          ...updated,
          trendScore: calculateTrendScore(updated),
        };
      })
    );
  };

  const sharePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const updated = { ...p, sharesCount: p.sharesCount + 1 };
        return { ...updated, trendScore: calculateTrendScore(updated) };
      })
    );

    // Try Web Share API or copy link
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'TREND DZ - المنصة الجزائرية',
        text: 'شوف هذا المنشور على TREND DZ! 🔥🇩🇿',
        url,
      }).catch(() => {
        // Ignore user cancellation
      });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('تم نسخ رابط المنشور! شاركه مع صحابك 🔗');
    } else {
      showToast('تمت المشاركة بنجاح! 🚀');
    }
  };

  const incrementViews = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const updated = { ...p, viewsCount: p.viewsCount + 1 };
        return { ...updated, trendScore: calculateTrendScore(updated) };
      })
    );
  };

  const createPost = (params: {
    content: string;
    mediaUrl?: string;
    mediaType: 'image' | 'video' | 'none';
    category: PostCategory;
    wilaya: string;
    wilayaNumber: number;
    soundTitle?: string;
    hashtags?: string[];
  }): { success: boolean; error?: string } => {
    if (!currentUser) {
      openAuthModal();
      return { success: false, error: 'يجب تسجيل الدخول أولاً لنشر المحتوى.' };
    }

    if (!params.content.trim() && !params.mediaUrl) {
      return { success: false, error: 'اكتب واش راك حاب تقول أو ارفع صورة/فيديو.' };
    }

    if (!params.wilaya) {
      return { success: false, error: 'يرجى اختيار الولاية الخاصة بالمنشور.' };
    }

    // Auto extract hashtags from caption if not provided
    const extractedTags = (params.content.match(/#[^\s#]+/g) || []).map((t) => t.trim());
    const finalHashtags = Array.from(new Set([...(params.hashtags || []), ...extractedTags]));

    const newPost: Post = {
      id: `post_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.displayName,
      authorUsername: currentUser.username,
      authorAvatar: currentUser.avatarUrl,
      authorRole: isOwnerUser(currentUser) ? 'owner' : 'user',
      authorWilaya: params.wilaya,
      wilayaNumber: params.wilayaNumber,
      category: params.category,
      content: params.content.trim(),
      mediaUrl: params.mediaUrl,
      mediaType: params.mediaType,
      hashtags: finalHashtags,
      soundTitle: params.soundTitle || (params.mediaType === 'video' ? 'صوت أصلي جزائري 🎵' : undefined),
      createdAt: new Date().toISOString(),
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 1,
      likedBy: [],
      savedBy: [],
      isDevSeed: false,
    };

    newPost.trendScore = calculateTrendScore(newPost);

    setPosts((prev) => [newPost, ...prev]);

    // Save to Firestore if connected
    if (db) {
      setDoc(doc(db, 'posts', newPost.id), newPost).catch((err) => {
        console.warn('[TREND DZ] Firestore setDoc error:', err.message);
      });
    }

    // increment user postsCount
    setAllUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, postsCount: u.postsCount + 1 } : u))
    );

    showToast('تم نشر المنشور بنجاح في TREND DZ! 🚀🔥');
    return { success: true };
  };

  const deletePost = (postId: string) => {
    if (!currentUser) return;
    const target = posts.find((p) => p.id === postId);
    if (!target) return;
    const userIsOwner = isOwnerUser(currentUser);
    if (target.authorId !== currentUser.id && !userIsOwner) {
      showToast('تقدر تحذف غير المنشورات تاعك يا خويا!');
      return;
    }

    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setComments((prev) => prev.filter((c) => c.postId !== postId));
    setAllUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id ? { ...u, postsCount: Math.max(0, u.postsCount - 1) } : u
      )
    );

    // Delete from Firestore if connected
    if (db) {
      deleteDoc(doc(db, 'posts', postId)).catch((err) => {
        console.warn('[TREND DZ] Firestore deleteDoc error:', err.message);
      });
    }

    showToast('تم حذف المنشور.');
  };

  // Comments Operations
  const openComments = (postId: string) => {
    setActiveCommentsPostId(postId);
  };

  const closeComments = () => {
    setActiveCommentsPostId(null);
  };

  const addComment = (postId: string, content: string): boolean => {
    if (!currentUser) {
      openAuthModal();
      return false;
    }

    if (!content.trim()) {
      showToast('اكتب تعليقك أولاً.');
      return false;
    }

    const newComment: Comment = {
      id: `comm_${Date.now()}`,
      postId,
      authorId: currentUser.id,
      authorName: currentUser.displayName,
      authorUsername: currentUser.username,
      authorAvatar: currentUser.avatarUrl,
      authorRole: isOwnerUser(currentUser) ? 'owner' : 'user',
      authorWilaya: currentUser.wilaya,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likesCount: 0,
      likedBy: [],
    };

    setComments((prev) => [newComment, ...prev]);

    // Update post comments count & trend score
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const updated = { ...p, commentsCount: p.commentsCount + 1 };
        return { ...updated, trendScore: calculateTrendScore(updated) };
      })
    );

    // Notify post author if not self
    const post = posts.find((p) => p.id === postId);
    if (post && post.authorId !== currentUser.id) {
      const notif: NotificationItem = {
        id: `notif_${Date.now()}`,
        type: 'comment',
        actorId: currentUser.id,
        actorUsername: currentUser.username,
        actorAvatar: currentUser.avatarUrl,
        postId,
        text: `علّق على منشورك: "${content.slice(0, 35)}..."`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [notif, ...prev]);
    }

    showToast('تمت إضافة تعليقك! 💬');
    return true;
  };

  const likeComment = (commentId: string) => {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const alreadyLiked = c.likedBy.includes(currentUser.id);
        const newLikedBy = alreadyLiked
          ? c.likedBy.filter((id) => id !== currentUser.id)
          : [...c.likedBy, currentUser.id];
        return {
          ...c,
          likedBy: newLikedBy,
          likesCount: newLikedBy.length,
        };
      })
    );
  };

  // AI Assistant Modal
  const openAIAssistant = () => setIsAIAssistantOpen(true);
  const closeAIAssistant = () => setIsAIAssistantOpen(false);

  // Notifications
  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Reports
  const openReportModal = (target: { type: 'post' | 'user' | 'comment'; id: string }) => {
    setActiveReportTarget(target);
  };

  const closeReportModal = () => {
    setActiveReportTarget(null);
  };

  const submitReport = (report: Omit<ReportItem, 'id' | 'createdAt' | 'reporterId'>): boolean => {
    if (!currentUser) {
      openAuthModal();
      return false;
    }

    // In a live system, this inserts to Firebase Firestore 'reports' collection
    console.log('[TREND DZ Moderation] Report submitted:', {
      ...report,
      reporterId: currentUser.id,
      timestamp: new Date().toISOString(),
    });

    closeReportModal();
    showToast('شكراً لك، تم إرسال البلاغ لفريق الإشراف لمراجعته 🚨');
    return true;
  };

  return (
    <AppStoreContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        isDarkMode,
        toggleDarkMode,
        currentUser,
        allUsers,
        isOwner,
        ownerUid: OWNER_UID,
        loginAsDemoUser,
        loginWithEmail,
        loginWithGoogle,
        login,
        registerUser,
        register,
        logout,
        updateProfile,
        followUser,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        posts,
        selectedCategory,
        setSelectedCategory,
        selectedWilaya,
        setSelectedWilaya,
        likePost,
        sharePost,
        incrementViews,
        createPost,
        deletePost,
        comments,
        activeCommentsPostId,
        openComments,
        closeComments,
        addComment,
        likeComment,
        isAIAssistantOpen,
        openAIAssistant,
        closeAIAssistant,
        notifications,
        unreadNotificationsCount,
        markNotificationsAsRead,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        isNotificationsOpen,
        setIsNotificationsOpen,
        submitReport,
        activeReportTarget,
        reportTarget: activeReportTarget,
        openReportModal,
        closeReportModal,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
};

export function useAppStore(): AppStoreContextType {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return context;
}
