"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import SendMessageModal from '../src/components/SendMessageModal'; 
import CreatePostModal from '../src/components/CreatePostModal';
import PostDetailModal from '../src/components/PostDetailModal';
import ArtworkDetailModal from '../src/components/ArtworkDetailModal';
import { Star, MessageSquare, ExternalLink, Share2, Heart, MessageCircle, Plus, Send, MoreVertical, Trash2, Edit3, Check } from 'lucide-react';
import { toggleLike, addComment, deleteComment, editPost, deletePost } from '@/app/actions/index';

interface Artwork {
  artwork_id: number;
  title: string;
  price: number;
  file_url: string;
  created_at?: string;
  users: {
    name: string;
  } | null;
}

interface Comment {
  comment_id: number;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: number | null;
  users: {
    name: string;
    avatar_url: string;
  };
}

interface Post {
  post_id: number;
  user_id: string;
  content: string;
  image_url: string;
  created_at: string;
  users: {
    name: string;
    avatar_url: string;
  };
  likes: { user_id: string }[];
  comments: Comment[];
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

interface ArtistRanked {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  rating: number;
  reviewCount: number;
}

const supabase = createClient();

function formatRelativeTime(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}

export default function HomePage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [topArtists, setTopArtists] = useState<ArtistRanked[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [activeMenu, setActiveMenu] = useState<{type: 'post' | 'comment', id: number} | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{type: 'post' | 'comment', id: number, postId?: number} | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  // Infinite Scroll State
  const [lastCursor, setLastCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const POSTS_PER_PAGE = 5;
  const observer = useRef<IntersectionObserver | null>(null);

  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (loadingPosts || isFetchingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && posts.length > 0) {
        const lastPost = posts[posts.length - 1];
        setLastCursor(lastPost.created_at);
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingPosts, isFetchingMore, hasMore, posts]);

  const handleOpenPostDetail = (post: Post) => {
    setSelectedPost(post);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('name, avatar_url, role')
          .eq('user_id', user.id)
          .single();
        
        setCurrentUser({
          ...user,
          user_metadata: {
            ...user.user_metadata,
            name: profile?.name || user.user_metadata?.name,
            avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url
          }
        } as User);
      }
    };
    fetchUser();
    
    // Hide body scrollbar
    document.body.style.overflow = 'hidden';
    return () => {
      // Restore body scrollbar on unmount
      document.body.style.overflow = 'unset';
    };
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [selectedArtistName, setSelectedArtistName] = useState('');

  const fetchSinglePost = async (postId: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('posts')
      .select(`
        post_id,
        user_id,
        content,
        image_url,
        created_at,
        users ( name, avatar_url ),
        likes ( user_id ),
        comments ( 
          comment_id,
          user_id,
          content,
          created_at,
          parent_id,
          users ( name, avatar_url )
        )
      `)
      .eq('post_id', postId)
      .single();

    if (!error && data) {
      const post = data as any;
      return {
        ...post,
        likes_count: post.likes?.length || 0,
        comments_count: post.comments?.length || 0,
        user_has_liked: post.likes?.some((l: { user_id: string }) => l.user_id === user?.id) || false,
        comments: (post.comments as Comment[])?.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ) || []
      } as Post;
    }
    return null;
  };

  const fetchPosts = async (cursor: string | null = null, isInitial: boolean = false) => {
    if (isInitial) setLoadingPosts(true);
    else setIsFetchingMore(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('posts')
        .select(`
          post_id,
          user_id,
          content,
          image_url,
          created_at,
          users ( name, avatar_url ),
          likes ( user_id ),
          comments ( 
            comment_id,
            user_id,
            content,
            created_at,
            parent_id,
            users ( name, avatar_url )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(POSTS_PER_PAGE);

      if (cursor && !isInitial) {
        query = query.lt('created_at', cursor);
      }

      const { data, error } = await query;

      if (!error && data) {
        const formattedPosts = (data as unknown[]).map((post: any) => {
          const rawUsers = post.users;
          const users = Array.isArray(rawUsers) ? rawUsers[0] : rawUsers;
          
          return {
            ...post,
            users,
            likes_count: post.likes?.length || 0,
            comments_count: post.comments?.length || 0,
            user_has_liked: post.likes?.some((l: { user_id: string }) => l.user_id === user?.id) || false,
            comments: (post.comments as Comment[])?.map(c => ({
              ...c,
              users: Array.isArray(c.users) ? c.users[0] : c.users
            })).sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            ) || []
          };
        });
        
        setPosts(prev => {
          const combined = isInitial ? [...formattedPosts] : [...prev, ...formattedPosts];
          const seen = new Set();
          return combined.filter(p => {
            const id = String(p.post_id);
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          });
        });
        setHasMore(data.length === POSTS_PER_PAGE);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoadingPosts(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    if (lastCursor) {
      fetchPosts(lastCursor);
    }
  }, [lastCursor]);

  useEffect(() => {
    const postsChannel = supabase
      .channel('homepage_posts_sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          const newPost = await fetchSinglePost(payload.new.post_id);
          if (newPost) {
            setPosts(prev => {
              const id = String(newPost.post_id);
              if (prev.some(p => String(p.post_id) === id)) return prev;
              return [newPost, ...prev];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        async (payload) => {
          const updatedPost = await fetchSinglePost(payload.new.post_id);
          if (updatedPost) {
            const id = String(payload.new.post_id);
            setPosts(prev => prev.map(p => String(p.post_id) === id ? updatedPost : p));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          const id = String(payload.old.post_id);
          setPosts(prev => prev.filter(p => String(p.post_id) !== id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, []);

  const handleEditPost = async (postId: number) => {
    if (!editContent.trim()) return;
    setPosts(prev => prev.map(p => p.post_id === postId ? { ...p, content: editContent } : p));
    setEditingPostId(null);
    try {
      await editPost(postId, editContent);
    } catch {
      fetchPosts(null, true);
    }
  };

  const handleDeletePost = async (postId: number) => {
    setPosts(prev => prev.filter(p => p.post_id !== postId));
    setDeleteConfirm(null);
    try {
      await deletePost(postId);
    } catch {
      fetchPosts(null, true);
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    // Optimistic Update
    setPosts(prev => prev.map(p => {
      if (p.post_id === postId) {
        return {
          ...p,
          comments_count: p.comments_count - 1,
          comments: p.comments.filter(c => c.comment_id !== commentId)
        };
      }
      return p;
    }));
    setDeleteConfirm(null);
    try {
      await deleteComment(commentId);
    } catch {
      fetchPosts(null, true);
    }
  };

  useEffect(() => {
    const fetchArtworks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('artworks')
        .select(`
          artwork_id,
          title,
          price,
          file_url,
          users ( name )
        `)
        .eq('status', 'available')
        .limit(6);

      if (!error && data) {
        setArtworks(data as unknown as Artwork[]);
      }
      setLoading(false);
    };

    fetchArtworks();
    fetchPosts(null, true);
  }, []);

  const handleLike = async (postId: number) => {
    if (!currentUser) return;
    
    setPosts(prev => prev.map(post => {
      if (post.post_id === postId) {
        return {
          ...post,
          user_has_liked: !post.user_has_liked,
          likes_count: post.user_has_liked ? post.likes_count - 1 : post.likes_count + 1
        };
      }
      return post;
    }));

    try {
      await toggleLike(postId);
    } catch (error) {
      fetchPosts(null, true);
    }
  };

  const handleComment = async (postId: number, parentId?: number) => {
    const key = parentId ? `reply-${parentId}` : `post-${postId}`;
    const content = commentInputs[key];
    if (!content || !currentUser) return;

    // Use a unique ID that doesn't rely on Date.now() in a way that causes hydration/pure errors
    const tempCommentId = Math.floor(Math.random() * 1000000);

    const tempComment: Comment = {
      comment_id: tempCommentId,
      user_id: currentUser.id, 
      content: content,
      created_at: new Date().toISOString(),
      parent_id: parentId || null,
      users: {
        name: currentUser.user_metadata?.name || currentUser.email || 'User',
        avatar_url: currentUser.user_metadata?.avatar_url || ''
      }
    };

    setPosts(prev => prev.map(post => {
      if (post.post_id === postId) {
        return {
          ...post,
          comments_count: post.comments_count + 1,
          comments: [...post.comments, tempComment]
        };
      }
      return post;
    }));

    setCommentInputs(prev => ({ ...prev, [key]: '' }));
    setReplyingTo(null);

    try {
      await addComment(postId, content, parentId);
    } catch (error) {
      console.error(error);
      fetchPosts(null, true);
    }
  };

  const handleShare = async (postId: number) => {
    const shareUrl = `${window.location.origin}/homepage?post=${postId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(postId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  useEffect(() => {
    const fetchArtists = async () => {
      const { data: artistsData, error: artistsError } = await supabase
        .from('users')
        .select(`
          user_id, 
          name, 
          avatar_url,
          artist_profiles ( specialty ),
          rating_reviews!artist_id ( rating )
        `)
        .eq('role', 'artist');

      interface ArtistData {
        user_id: string;
        name: string;
        avatar_url: string;
        artist_profiles: { specialty: string }[];
        rating_reviews: { rating: number }[];
      }

      if (!artistsError && artistsData) {
        const seenIds = new Set();
        const ranked = (artistsData as unknown as ArtistData[])
          .filter(a => {
            if (seenIds.has(a.user_id)) return false;
            seenIds.add(a.user_id);
            return true;
          })
          .map((artist) => {
            const reviews = artist.rating_reviews || [];
            const totalStars = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
            const avg = reviews.length > 0 ? (totalStars / reviews.length).toFixed(1) : "0";
            
            return {
              id: artist.user_id,
              name: artist.name,
              avatar: artist.avatar_url,
              specialty: artist.artist_profiles?.[0]?.specialty || 'Creator',
              rating: parseFloat(avg),
              reviewCount: reviews.length
            };
          }).sort((a, b) => b.rating - a.rating).slice(0, 5);
        
        setTopArtists(ranked);
      }
      setLoadingArtists(false);
    };

    fetchArtists();
  }, []); 

  useEffect(() => {
    if (artworks.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % artworks.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [artworks.length]);

  const openMessageModal = (id: string, name: string) => {
    setSelectedArtistId(id);
    setSelectedArtistName(name);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-[#FCFAF8] h-[calc(100vh-116px)] overflow-hidden">
      <div className="w-full h-full grid grid-cols-12 pl-0 lg:pl-6">
        {/* Left Column (9 units) */}
        <div className="col-span-12 lg:col-span-9 overflow-y-auto custom-scrollbar h-full px-4 md:px-6 pt-6 md:pt-8 pb-32">
          {/* Artwork Carousel */}
          <div className="relative h-[300px] md:h-[450px] rounded-2xl md:rounded-3xl overflow-hidden mb-6 md:mb-10 shadow-xl group">
            {loading ? (
              <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
                <p className="text-gray-400 font-medium">Loading featured artworks...</p>
              </div>
            ) : artworks.length > 0 ? (
              <>
                {artworks.map((art, index) => (
                  <div 
                    key={`artwork-${art.artwork_id}`}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
                  >
                    <Image 
                      src={art.file_url || '/background.png'} 
                      alt={art.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12 text-white max-w-xl">
                      <span className="inline-block bg-[#f2a83b] text-slate-900 text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 md:px-3 py-0.5 md:py-1 rounded-full mb-2 md:mb-4">Featured Artwork</span>
                      <h2 className="text-2xl md:text-5xl font-black mb-2 md:mb-3 leading-tight">{art.title}</h2>
                      <p className="text-sm md:text-lg font-medium opacity-90 mb-4 md:mb-8 flex items-center gap-2">
                         by <span className="text-[#f2a83b] font-bold">{art.users?.name}</span>
                      </p>
                      <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setSelectedArtwork(art)}
                            className="bg-[#f2a83b] text-slate-900 px-6 md:px-10 py-2.5 md:py-4 rounded-full font-black text-xs md:text-base hover:bg-[#ffbd59] transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
                          >
                              View Artwork
                              <ExternalLink size={14} />
                          </button>
                          <span className="text-lg md:text-2xl font-black text-white">₱{art.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Slide Indicators */}
                <div className="absolute bottom-6 right-6 md:bottom-8 md:right-12 flex gap-2 md:gap-3">
                  {artworks.map((_, i) => (
                    <button 
                      key={`indicator-${i}`} 
                      onClick={() => setCurrentSlide(i)}
                      className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'bg-[#f2a83b] w-8 md:w-12' : 'bg-white/30 w-4 md:w-6 hover:bg-white/60'}`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <p className="text-gray-400 italic">No featured artworks available.</p>
              </div>
            )}
          </div>

          {/* Mobile Top Artists (Stories Style) */}
          <div className="lg:hidden mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1C4A5C]">Top Artists</h2>
              <button className="text-[#C87941] text-xs font-bold">See All</button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {loadingArtists ? (
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-2 min-w-[70px] animate-pulse">
                      <div className="w-16 h-16 rounded-full bg-gray-200"></div>
                      <div className="h-2 w-10 bg-gray-100 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : topArtists.length > 0 ? (
                topArtists.map((artist) => (
                  <div 
                    key={`mobile-artist-${artist.id}`} 
                    className="flex flex-col items-center gap-2 min-w-[70px] snap-center cursor-pointer"
                    onClick={() => openMessageModal(artist.id, artist.name)}
                  >
                    <div className="w-16 h-16 rounded-full p-0.5 border-2 border-[#f2a83b] relative">
                      {artist.avatar ? (
                        <Image src={artist.avatar} alt={artist.name} width={64} height={64} className="rounded-full object-cover aspect-square" />
                      ) : (
                        <div className="w-full h-full bg-[#1C4A5C] text-white flex items-center justify-center font-bold rounded-full">
                          {artist.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 truncate w-full text-center">{artist.name.split(' ')[0]}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-[10px] italic">No top artists yet.</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#1C4A5C]">Community Feed</h2>
          </div>

          {/* Quick Create Post (Social style) - Primary entry point */}
          <div 
            onClick={() => setIsPostModalOpen(true)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex items-center gap-4 cursor-pointer hover:border-[#1C4A5C]/20 transition-all group"
          >
            {currentUser?.user_metadata?.avatar_url ? (
              <Image src={currentUser.user_metadata.avatar_url} alt="Avatar" width={40} height={40} className="rounded-full" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-[#1C4A5C] to-[#3A6A7C] text-white flex items-center justify-center font-bold rounded-full">
                {currentUser?.email?.charAt(0).toUpperCase() || <Plus size={20} />}
              </div>
            )}
            <div className="flex-1 bg-gray-50 rounded-full px-6 py-2.5 text-gray-400 text-sm font-medium group-hover:bg-gray-100 transition-colors">
              What&apos;s on your mind?
            </div>
          </div>
          
          {loadingPosts ? (
            <div className="space-y-4">
              {['s1', 's2'].map(i => (
                <div key={`skeleton-${i}`} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                      <div className="h-3 w-20 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                  <div className="h-20 bg-gray-50 rounded-xl mb-4"></div>
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post, index) => (
                <div 
                  key={`post-${post.post_id}`} 
                  ref={index === posts.length - 1 ? lastPostElementRef : null}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Link href={`/profile/${post.user_id}`} className="shrink-0">
                      {post.users?.avatar_url ? (
                        <Image src={post.users.avatar_url} alt={post.users.name} width={48} height={48} className="rounded-full border-2 border-white shadow-sm" />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-[#1C4A5C] to-[#3A6A7C] text-white flex items-center justify-center font-bold rounded-full border-2 border-white shadow-sm">
                          {post.users?.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1">
                      <Link href={`/profile/${post.user_id}`} className="font-bold text-sm text-gray-900 hover:text-[#1C4A5C] transition-colors">{post.users?.name}</Link>
                      <p className="text-xs text-gray-400 font-medium">
                        {formatRelativeTime(post.created_at)}
                      </p>
                    </div>

                    {/* Post Management Menu */}
                    {currentUser?.id === post.user_id && (
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu?.id === post.post_id ? null : {type: 'post', id: post.post_id})}
                          className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {activeMenu?.type === 'post' && activeMenu.id === post.post_id && (
                          <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                            <button 
                              onClick={() => {
                                setEditingPostId(post.post_id);
                                setEditContent(post.content);
                                setActiveMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit3 size={14} /> Edit Caption
                            </button>
                            <button 
                              onClick={() => {
                                setDeleteConfirm({type: 'post', id: post.post_id});
                                setActiveMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 size={14} /> Delete Post
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {editingPostId === post.post_id ? (
                    <div className="mb-4 space-y-2">
                      <textarea 
                        autoFocus
                        className="w-full p-3 bg-gray-50 border border-[#1C4A5C]/20 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1C4A5C]/10 transition-all resize-none"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingPostId(null)}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleEditPost(post.post_id)}
                          className="px-4 py-1.5 rounded-full text-[10px] font-bold bg-[#1C4A5C] text-white hover:bg-[#143745] transition-colors flex items-center gap-1"
                        >
                          <Check size={12} /> Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    post.content && (
                      <p 
                        onClick={() => handleOpenPostDetail(post)}
                        className="text-sm text-gray-700 mb-4 leading-relaxed cursor-pointer hover:text-gray-900 transition-colors"
                      >
                        {post.content}
                      </p>
                    )
                  )}
                  
                  {post.image_url && (
                    <div 
                      onClick={() => handleOpenPostDetail(post)}
                      className="relative w-full overflow-hidden rounded-xl mb-5 bg-gray-50 border border-gray-100 flex items-center justify-center cursor-pointer group/image"
                    >
                      <Image 
                        src={post.image_url} 
                        alt="Post content"
                        width={800}
                        height={1000}
                        className="w-full h-auto max-h-[550px] object-contain group-hover/image:scale-[1.01] transition-transform duration-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-6 text-sm text-gray-500 border-t border-gray-100 pt-4">
                    <button 
                      onClick={() => handleLike(post.post_id)}
                      className={`flex items-center gap-2 font-medium transition-colors ${post.user_has_liked ? 'text-red-500' : 'hover:text-[#C87941]'}`}
                    >
                      <Heart size={18} strokeWidth={2} fill={post.user_has_liked ? "currentColor" : "none"} /> 
                      {post.likes_count}
                    </button>
                    <button 
                      onClick={() => handleOpenPostDetail(post)}
                      className="flex items-center gap-2 hover:text-[#1C4A5C] font-medium transition-colors"
                    >
                      <MessageCircle size={18} strokeWidth={2} /> {post.comments_count}
                    </button>
                    <button 
                      onClick={() => handleShare(post.post_id)}
                      className={`flex items-center gap-2 font-medium transition-colors ${copiedId === post.post_id ? 'text-green-600' : 'hover:text-[#1C4A5C]'}`}
                    >
                      <Share2 size={18} strokeWidth={2} /> 
                      {copiedId === post.post_id ? 'Copied!' : 'Share'}
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Infinite Scroll Loader */}
              {isFetchingMore && (
                <div className="py-8 flex justify-center">
                  <div className="flex items-center gap-2 text-[#1C4A5C] font-bold text-sm animate-pulse">
                    <div className="w-5 h-5 border-2 border-[#1C4A5C] border-t-transparent rounded-full animate-spin"></div>
                    Loading more stories...
                  </div>
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <div className="py-12 text-center">
                  <p className="text-gray-400 text-sm font-medium italic">You&apos;ve caught up with everyone! 🎉</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">No posts in the community yet. Be the first!</p>
            </div>
          )}
        </div>

        {/* Right Column (3 units) */}
        <div className="hidden lg:flex lg:col-span-3 h-full border-l border-gray-100 bg-white/50 pl-6 pr-2 py-6 sticky top-0 flex-col overflow-hidden">
          <div className="flex justify-between items-end mb-5 flex-none pr-4">
            <h2 className="text-lg font-bold text-[#1C4A5C]">Top Artists</h2>
            <button className="text-[#C87941] text-[10px] font-bold hover:text-[#a86536] transition-colors">See All</button>
          </div>

          {/* Render Dynamic Top Artists List */}
          <div className="space-y-2 mb-6 max-h-[280px] overflow-y-auto custom-scrollbar pr-3">
            {loadingArtists ? (
              <p className="text-gray-500 text-[10px] text-center py-4">Loading top creators...</p>
            ) : topArtists && topArtists.length > 0 ? (
              topArtists.map((artist) => (
                <div key={`artist-${artist.id}`} className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                  <Link href={`/profile/${artist.id}`} className="flex items-center gap-2.5 min-w-0 group">
                    {artist.avatar ? (
                      <div className="w-8 h-8 relative flex-none">
                        <Image src={artist.avatar} alt={artist.name} fill className="bg-gray-200 rounded-full object-cover aspect-square" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-[#1C4A5C] to-[#3A6A7C] text-white flex items-center justify-center font-bold text-sm rounded-full flex-none aspect-square">
                        {artist.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-[11px] text-gray-900 flex items-center gap-1 truncate group-hover:text-[#1C4A5C] transition-colors">
                        {artist.name} 
                        {artist.rating >= 4.5 && (
                          <Star size={10} fill="#3b82f6" stroke="white" strokeWidth={2} className="text-blue-500 flex-none" />
                        )}
                      </h4>
                      <p className="text-[9px] text-gray-500 font-medium truncate">{artist.specialty}</p>
                      <p className="text-[9px] font-bold text-gray-700 mt-0.5 flex items-center gap-1">
                        <Star size={10} className={artist.rating > 0 ? "text-[#f2a83b] fill-[#f2a83b]" : "text-gray-300"} />
                        {artist.rating > 0 ? artist.rating : "New"} 
                      </p>
                    </div>
                  </Link>
                  <button 
                    onClick={() => openMessageModal(artist.id, artist.name)}
                    className="px-2.5 py-1 border border-gray-100 rounded-full text-[9px] font-bold text-gray-600 hover:border-[#1C4A5C] hover:text-[#1C4A5C] transition-colors flex-none flex items-center gap-1"
                  >
                    <MessageSquare size={10} />
                    Message
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-[10px] text-center py-4 bg-white rounded-xl border border-gray-100">No rated artists yet.</p>
            )}
          </div>

          {/* Commission CTA Card */}
          <div className="bg-gradient-to-br from-[#1C4A5C] to-[#143745] rounded-xl p-5 text-white text-center shadow-lg relative overflow-hidden group flex-none mt-auto mr-3">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            
            <div className="text-2xl mb-2 relative z-10">✨</div>
            <h3 className="font-extrabold text-base mb-1 relative z-10">Custom Art?</h3>
            <p className="text-[10px] text-blue-50/90 mb-4 font-medium leading-tight relative z-10">
              Post a commission and let local artists come to you!
            </p>
            <Link href="/commissions">
              <button className="w-full bg-[#f2a83b] text-slate-900 font-bold py-2.5 rounded-full hover:bg-[#ffbd59] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 shadow-sm relative z-10 text-[11px] flex items-center justify-center gap-2">
                Post Commission
                <Plus size={14} strokeWidth={3} />
              </button>
            </Link>
          </div>
        </div>
      </div>

      <CreatePostModal 
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />

      <SendMessageModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        receiverId={selectedArtistId}
        receiverName={selectedArtistName}
      />

      <PostDetailModal 
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        post={selectedPost ? {
          ...selectedPost,
          post_id: selectedPost.post_id.toString()
        } : null}
        userName={selectedPost?.users?.name || 'User'}
        userAvatar={selectedPost?.users?.avatar_url || null}
        currentUser={currentUser}
      />

      <ArtworkDetailModal 
        isOpen={!!selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
        artwork={selectedArtwork ? {
          ...selectedArtwork,
          artwork_id: selectedArtwork.artwork_id.toString(),
          description: null // We don't fetch description in the list, so we set to null or fetch it
        } : null}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Are you sure?</h3>
              <p className="text-sm text-gray-500 mb-8">
                This action cannot be undone. This {deleteConfirm.type} will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-6 py-3 rounded-full font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (deleteConfirm.type === 'post') {
                      handleDeletePost(deleteConfirm.id);
                    } else {
                      handleDeleteComment(deleteConfirm.postId!, deleteConfirm.id);
                    }
                  }}
                  className="flex-1 px-6 py-3 rounded-full font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
