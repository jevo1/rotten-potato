"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import SendMessageModal from '../src/components/SendMessageModal'; 
import CreatePostModal from '../src/components/CreatePostModal';
import { Star, MessageSquare, ExternalLink, Share2, Heart, MessageCircle, Plus, Send, MoreVertical, Trash2, Edit3, Check } from 'lucide-react';
import { toggleLike, addComment, deleteComment, editPost, deletePost } from '@/app/actions/index';

interface Artwork {
  artwork_id: number;
  title: string;
  price: number;
  file_url: string;
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

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user as User);
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

  const fetchPosts = async () => {
    setLoadingPosts(true);
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
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedPosts = (data as unknown[]).map((post: any) => ({
        ...post,
        likes_count: post.likes?.length || 0,
        comments_count: post.comments?.length || 0,
        user_has_liked: post.likes?.some((l: { user_id: string }) => l.user_id === user?.id) || false,
        comments: (post.comments as Comment[])?.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ) || []
      }));
      setPosts(formattedPosts as Post[]);
    }
    setLoadingPosts(false);
  };

  const handleEditPost = async (postId: number) => {
    if (!editContent.trim()) return;
    setPosts(prev => prev.map(p => p.post_id === postId ? { ...p, content: editContent } : p));
    setEditingPostId(null);
    try {
      await editPost(postId, editContent);
    } catch {
      fetchPosts();
    }
  };

  const handleDeletePost = async (postId: number) => {
    setPosts(prev => prev.filter(p => p.post_id !== postId));
    setDeleteConfirm(null);
    try {
      await deletePost(postId);
    } catch {
      fetchPosts();
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
      fetchPosts();
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
    fetchPosts();
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
      fetchPosts();
    }
  };

  const handleComment = async (postId: number, parentId?: number) => {
    const key = parentId ? `reply-${parentId}` : `post-${postId}`;
    const content = commentInputs[key];
    if (!content || !currentUser) return;

    const tempComment: Comment = {
      comment_id: Date.now(),
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
      fetchPosts();
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
        const ranked = (artistsData as unknown as ArtistData[]).map((artist) => {
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

  const openMessageModal = (id: string, name: string) => {
    setSelectedArtistId(id);
    setSelectedArtistName(name);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-[#FCFAF8] h-[calc(100vh-116px)] overflow-hidden">
      <div className="w-full h-full grid grid-cols-12 pl-0 lg:pl-6">
        {/* Left Column (9 units) */}
        <div className="col-span-12 lg:col-span-9 overflow-y-auto custom-scrollbar h-full px-6 pt-8 pb-20">
          {/* Artwork Carousel */}
          <div className="relative h-[450px] rounded-3xl overflow-hidden mb-10 shadow-xl group">
            {loading ? (
              <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
                <p className="text-gray-400 font-medium">Loading featured artworks...</p>
              </div>
            ) : artworks.length > 0 ? (
              <>
                {artworks.map((art, index) => (
                  <div 
                    key={art.artwork_id}
                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
                  >
                    <Image 
                      src={art.file_url || '/background.png'} 
                      alt={art.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                    <div className="absolute bottom-12 left-12 text-white max-w-xl">
                      <span className="inline-block bg-[#f2a83b] text-slate-900 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">Featured Artwork</span>
                      <h2 className="text-5xl font-black mb-3 leading-tight">{art.title}</h2>
                      <p className="text-lg font-medium opacity-90 mb-8 flex items-center gap-2">
                         by <span className="text-[#f2a83b] font-bold">{art.users?.name}</span>
                      </p>
                      <div className="flex items-center gap-4">
                          <button className="bg-[#f2a83b] text-slate-900 px-10 py-4 rounded-full font-black hover:bg-[#ffbd59] transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2">
                              View Artwork
                              <ExternalLink size={18} />
                          </button>
                          <span className="text-2xl font-black text-white">₱{art.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Slide Indicators */}
                <div className="absolute bottom-8 right-12 flex gap-3">
                  {artworks.map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => setCurrentSlide(i)}
                      className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'bg-[#f2a83b] w-12' : 'bg-white/30 w-6 hover:bg-white/60'}`}
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
              {[1, 2].map(i => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
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
              {posts.map((post) => (
                <div key={post.post_id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
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
                    post.content && <p className="text-sm text-gray-700 mb-4 leading-relaxed">{post.content}</p>
                  )}
                  
                  {post.image_url && (
                    <div className="relative w-full overflow-hidden rounded-xl mb-5 bg-gray-50 border border-gray-100 flex items-center justify-center">
                      <Image 
                        src={post.image_url} 
                        alt="Post content"
                        width={800}
                        height={1000}
                        className="w-full h-auto max-h-[550px] object-contain"
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
                    <button className="flex items-center gap-2 hover:text-[#1C4A5C] font-medium transition-colors">
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

                  {/* Comments List */}
                  {post.comments.length > 0 && (
                    <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-50">
                      {post.comments
                        .filter(c => !c.parent_id)
                        .map((comment) => (
                        <div key={comment.comment_id} className="space-y-3">
                          <div className="flex gap-2">
                            <Link href={`/profile/${comment.user_id}`} className="shrink-0">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex-none overflow-hidden relative border border-gray-100">
                                {comment.users?.avatar_url ? (
                                  <Image src={comment.users.avatar_url} alt={comment.users?.name || 'User'} fill className="object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-[#1C4A5C] text-white text-[10px] flex items-center justify-center font-bold">
                                    {comment.users?.name?.charAt(0) || '?'}
                                  </div>
                                )}
                              </div>
                            </Link>
                            <div className="flex-1">
                              <div className="group/comment flex items-start gap-2 max-w-full">
                                <div className="bg-gray-100 rounded-2xl px-4 py-2 inline-block max-w-full shadow-sm">
                                  <Link href={`/profile/${comment.user_id}`} className="text-[10px] font-bold text-[#1C4A5C] mb-0.5 hover:underline">{comment.users?.name || 'User'}</Link>
                                  <p className="text-sm text-gray-800 leading-snug">{comment.content}</p>
                                </div>
                                {currentUser?.id === comment.user_id && (
                                  <button 
                                    onClick={() => setDeleteConfirm({type: 'comment', id: comment.comment_id, postId: post.post_id})}
                                    className="p-1.5 text-gray-400 hover:text-red-600 opacity-0 group-hover/comment:opacity-100 transition-all rounded-full hover:bg-red-50"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 ml-2">
                                <button 
                                  onClick={() => setReplyingTo(replyingTo === comment.comment_id ? null : comment.comment_id)}
                                  className="text-[10px] font-black text-gray-600 hover:text-[#1C4A5C] transition-colors uppercase tracking-wider"
                                >
                                  Reply
                                </button>
                                <span className="text-[10px] text-gray-500 font-medium">
                                  {formatRelativeTime(comment.created_at)}
                                </span>
                              </div>

                              {/* Replies */}
                              <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100">
                                {post.comments
                                  .filter(reply => reply.parent_id === comment.comment_id)
                                  .map(reply => (
                                    <div key={reply.comment_id} className="flex gap-2 group/reply">
                                      <Link href={`/profile/${reply.user_id}`} className="shrink-0">
                                        <div className="w-6 h-6 bg-gray-100 rounded-full flex-none overflow-hidden relative">
                                          {reply.users?.avatar_url ? (
                                            <Image src={reply.users.avatar_url} alt={reply.users.name || 'User'} fill className="object-cover" />
                                          ) : (
                                            <div className="w-full h-full bg-[#3A6A7C] text-white text-[8px] flex items-center justify-center font-bold">
                                              {reply.users?.name?.charAt(0) || '?'}
                                            </div>
                                          )}
                                        </div>
                                      </Link>
                                      <div className="flex-1 flex items-start gap-2 max-w-full">
                                        <div className="bg-gray-200/70 rounded-2xl px-3 py-1.5 inline-block max-w-[90%] shadow-sm">
                                          <Link href={`/profile/${reply.user_id}`} className="text-[9px] font-bold text-[#1C4A5C] mb-0.5 hover:underline">{reply.users?.name || 'User'}</Link>
                                          <p className="text-xs text-gray-800">{reply.content}</p>
                                        </div>
                                        {currentUser?.id === reply.user_id && (
                                          <button 
                                            onClick={() => setDeleteConfirm({type: 'comment', id: reply.comment_id, postId: post.post_id})}
                                            className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover/reply:opacity-100 transition-all rounded-full hover:bg-red-50"
                                          >
                                            <Trash2 size={10} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                
                                {/* Reply Input */}
                                {replyingTo === comment.comment_id && (
                                  <div className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <input 
                                      type="text" 
                                      autoFocus
                                      placeholder={`Reply to ${comment.users?.name || 'User'}...`}
                                      className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#1C4A5C]"
                                      value={commentInputs[`reply-${comment.comment_id}`] || ''}
                                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [`reply-${comment.comment_id}`]: e.target.value }))}
                                      onKeyDown={(e) => e.key === 'Enter' && handleComment(post.post_id, comment.comment_id)}
                                    />
                                    <button 
                                      onClick={() => handleComment(post.post_id, comment.comment_id)}
                                      className="p-1.5 text-[#1C4A5C] hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                      <Send size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Top-level Comment Input */}
                  <div className="mt-6 flex gap-3 items-center border-t border-gray-50 pt-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex-none overflow-hidden relative border border-gray-100">
                      {currentUser?.user_metadata?.avatar_url ? (
                        <Image src={currentUser.user_metadata.avatar_url} alt="Me" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                          <Plus size={14} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 relative">
                      <input 
                        type="text" 
                        placeholder="Write a comment..."
                        className="w-full bg-gray-50 border border-transparent rounded-full px-5 py-2.5 text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1C4A5C]/10 transition-all placeholder:text-gray-400"
                        value={commentInputs[`post-${post.post_id}`] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [`post-${post.post_id}`]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleComment(post.post_id)}
                      />
                      <button 
                        onClick={() => handleComment(post.post_id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#1C4A5C] hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
                <div key={artist.id} className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2.5">
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
                      <h4 className="font-bold text-[11px] text-gray-900 flex items-center gap-1 truncate">
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
                  </div>
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
