"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Heart, MessageCircle, Share2, Clock, Send, Trash2, ChevronRight, CornerDownRight } from 'lucide-react';
import { toggleLike, addComment, deleteComment } from '@/app/actions/index';
import { createClient } from '@/utils/supabase/client';

interface UserActor {
  name: string;
  avatar_url: string | null;
}

interface Comment {
  comment_id: number | string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: number | string | null;
  users: UserActor;
  isOptimistic?: boolean;
}

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    post_id: string;
    content: string | null;
    image_url: string;
    created_at: string;
    user_id: string;
    likes_count: number;
    user_has_liked: boolean;
    comments: Comment[];
  } | null;
  userName: string;
  userAvatar: string | null;
  currentUser?: {
    id: string;
    user_metadata?: {
      name?: string;
      avatar_url?: string;
    };
  } | null;
}

const supabase = createClient();

export default function PostDetailModal({ 
  isOpen, 
  onClose, 
  post, 
  userName, 
  userAvatar,
  currentUser 
}: PostDetailModalProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Initialize state when post changes or modal opens
  useEffect(() => {
    if (post && isOpen) {
      setLocalComments(post.comments || []);
      setLikesCount(post.likes_count || 0);
      setHasLiked(post.user_has_liked || false);
      setReplyingTo(null);
      setComment('');
    }
  }, [post?.post_id, isOpen]);

  const scrollToBottom = () => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Real-time comments subscription
  useEffect(() => {
    if (!post || !isOpen) return;

    const channel = supabase
      .channel(`post_details:${post.post_id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'comments',
          filter: `post_id=eq.${post.post_id}`
        },
        async (payload) => {
          // Fetch user details for the new comment
          const { data: userData } = await supabase
            .from('users')
            .select('name, avatar_url')
            .eq('user_id', payload.new.user_id)
            .single();
          
          const newComment: Comment = {
            ...payload.new as any,
            users: userData || { name: 'User', avatar_url: null }
          };

          setLocalComments(prev => {
            // Check for existing comment (real ID or optimistic match)
            const exists = prev.some(c => 
              c.comment_id === newComment.comment_id || 
              (c.isOptimistic && c.content === newComment.content && c.user_id === newComment.user_id)
            );

            if (exists) {
              // If it exists and is optimistic, replace it. If it's already real, do nothing.
              return prev.map(c => {
                if (c.comment_id === newComment.comment_id) return c; // Already real
                if (c.isOptimistic && c.content === newComment.content && c.user_id === newComment.user_id) {
                  return newComment; // Replace optimistic with real
                }
                return c;
              }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            }

            // Otherwise add it
            return [...prev, newComment].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
          
          if (payload.new.parent_id === null) {
            setTimeout(scrollToBottom, 100);
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'comments',
          filter: `post_id=eq.${post.post_id}`
        },
        (payload) => {
          setLocalComments(prev => prev.filter(c => c.comment_id !== payload.old.comment_id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post?.post_id, isOpen]);

  const handleLike = async () => {
    if (!currentUser || !post) return;
    
    const prevHasLiked = hasLiked;
    setHasLiked(!prevHasLiked);
    setLikesCount(prev => prevHasLiked ? prev - 1 : prev + 1);

    try {
      await toggleLike(Number(post.post_id));
    } catch (error) {
      setHasLiked(prevHasLiked);
      setLikesCount(prev => prevHasLiked ? prev + 1 : prev - 1);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !post || !currentUser) return;

    if (replyingTo?.isOptimistic) return;

    setIsSubmitting(true);
    const content = comment;
    const parentId = replyingTo?.comment_id || null;
    setComment('');

    // Optimistic Update
    const tempId = `temp-${Math.random()}`;
    const tempComment: Comment = {
      comment_id: tempId,
      user_id: currentUser.id,
      content: content,
      created_at: new Date().toISOString(),
      parent_id: parentId,
      isOptimistic: true,
      users: {
        name: currentUser.user_metadata?.name || 'User',
        avatar_url: currentUser.user_metadata?.avatar_url || null
      }
    };

    setLocalComments(prev => [...prev, tempComment].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ));

    if (!parentId) {
      setTimeout(scrollToBottom, 50);
    }

    try {
      const realComment = await addComment(Number(post.post_id), content, parentId as number);
      
      // Update local state with real record immediately to enable further interactions
      setLocalComments(prev => prev.map(c => 
        c.comment_id === tempId ? { ...realComment, users: tempComment.users } : c
      ));
      
      setReplyingTo(null);
    } catch (error: any) {
      alert(error.message || "Failed to add comment");
      setComment(content);
      setLocalComments(prev => prev.filter(c => c.comment_id !== tempId));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number | string) => {
    if (typeof commentId === 'string' && commentId.startsWith('temp')) return;
    if (!confirm("Are you sure you want to delete this comment?")) return;
    
    setLocalComments(prev => prev.filter(c => c.comment_id !== commentId));

    try {
      await deleteComment(Number(commentId));
    } catch (error) {}
  };

  const handleShare = async () => {
    if (!post) return;
    const shareUrl = `${window.location.origin}/homepage?post=${post.post_id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return past.toLocaleDateString();
  };

  if (!isOpen || !post) return null;

  const topLevelComments = localComments.filter(c => !c.parent_id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-0 md:p-4">
      <div className="bg-white w-full h-full md:h-auto md:max-w-5xl md:max-h-[90vh] md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
        
        {/* Left Side: Image */}
        <div className={`md:w-3/5 bg-black flex items-center justify-center relative min-h-[40vh] md:min-h-0 ${!post.image_url && 'hidden md:flex'}`}>
          {post.image_url ? (
            <Image 
              src={post.image_url} 
              alt="Post content" 
              fill 
              className="object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/10">
              <MessageCircle size={160} />
            </div>
          )}
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 md:hidden bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-900 shadow-md z-20"
          >
            <X size={20} />
          </button>
        </div>

        {/* Right Side: Content & Interaction */}
        <div className={`${post.image_url ? 'md:w-2/5' : 'w-full'} flex flex-col bg-white overflow-hidden h-full`}>
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${post.user_id}`} onClick={onClose}>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-gray-100 relative border border-gray-100">
                  {userAvatar ? (
                    <Image src={userAvatar} alt={userName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-[#1C4A5C] bg-gray-100 uppercase text-xs">
                      {userName.charAt(0)}
                    </div>
                  )}
                </div>
              </Link>
              <div>
                <Link href={`/profile/${post.user_id}`} onClick={onClose} className="font-bold text-gray-900 text-xs md:text-sm hover:text-[#1C4A5C] transition-colors leading-none block mb-1">
                  {userName}
                </Link>
                <div className="flex items-center gap-1.5 text-gray-400 text-[9px] md:text-[10px] font-medium">
                  <Clock size={10} />
                  {formatRelativeTime(post.created_at)}
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body: Post Content + Comments */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6 md:space-y-8 bg-[#FCFAF8]/30">
            <div className="space-y-3 md:space-y-4">
              <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 md:px-2.5 md:py-1 rounded-md">
                Social Post
              </span>
              <p className="text-gray-800 leading-relaxed text-xs md:text-sm whitespace-pre-line font-medium">
                {post.content}
              </p>
            </div>

            {/* Interaction Stats */}
            <div className="flex items-center gap-5 md:gap-6 py-3 md:py-4 border-y border-gray-100">
              <button 
                onClick={handleLike}
                className={`flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold transition-all ${hasLiked ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Heart fill={hasLiked ? "currentColor" : "none"} strokeWidth={2.5} className="w-[18px] h-[18px] md:w-5 md:h-5" /> 
                {likesCount}
              </button>
              <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold text-[#1C4A5C]">
                <MessageCircle strokeWidth={2.5} className="w-[18px] h-[18px] md:w-5 md:h-5" /> 
                {localComments.length}
              </div>
              <button 
                onClick={handleShare}
                className={`flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold transition-all ${isCopied ? 'text-green-600' : 'text-gray-400 hover:text-[#1C4A5C]'}`}
              >
                <Share2 className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                {isCopied ? 'Copied!' : ''}
              </button>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
              <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Discussion</h5>
              
              {topLevelComments.length > 0 ? (
                <div className="space-y-6">
                  {topLevelComments.map((c) => (
                    <div key={c.comment_id} className="space-y-4">
                      {/* Top-level Comment */}
                      <div className="flex gap-3 group">
                        <Link href={`/profile/${c.user_id}`} onClick={onClose} className="shrink-0">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 relative border border-gray-100">
                            {c.users?.avatar_url ? (
                              <Image src={c.users.avatar_url} alt={c.users.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-[10px]">
                                {c.users?.name?.charAt(0)}
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className={`bg-gray-100 rounded-2xl px-4 py-2 relative shadow-sm ${c.isOptimistic ? 'opacity-60' : ''}`}>
                            <Link href={`/profile/${c.user_id}`} onClick={onClose} className="text-[10px] font-bold text-[#1C4A5C] mb-0.5 hover:underline block">
                              {c.users?.name}
                            </Link>
                            <p className="text-xs text-gray-800 leading-normal">
                              {c.content}
                            </p>
                            
                            {currentUser?.id === c.user_id && !c.isOptimistic && (
                              <button 
                                onClick={() => handleDelete(c.comment_id)}
                                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 ml-2">
                            {!c.isOptimistic && (
                              <button 
                                onClick={() => setReplyingTo(c)}
                                className="text-[9px] font-black text-gray-500 hover:text-[#1C4A5C] uppercase tracking-wider transition-colors"
                              >
                                Reply
                              </button>
                            )}
                            <span className="text-[9px] text-gray-400 font-medium italic">
                              {formatRelativeTime(c.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {localComments
                        .filter(reply => reply.parent_id === c.comment_id)
                        .map(reply => (
                          <div key={reply.comment_id} className="flex gap-3 group ml-8 animate-in slide-in-from-left-2 duration-300">
                            <div className="shrink-0 mt-1">
                              <CornerDownRight size={14} className="text-gray-300" />
                            </div>
                            <Link href={`/profile/${reply.user_id}`} onClick={onClose} className="shrink-0">
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 relative border border-gray-100">
                                {reply.users?.avatar_url ? (
                                  <Image src={reply.users.avatar_url} alt={reply.users.name} fill className="object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-[8px]">
                                    {reply.users?.name?.charAt(0)}
                                  </div>
                                )}
                              </div>
                            </Link>
                            <div className="flex-1 min-w-0">
                              <div className={`bg-gray-200/50 rounded-2xl px-4 py-2 relative shadow-sm border border-gray-100/50 ${reply.isOptimistic ? 'opacity-60' : ''}`}>
                                <Link href={`/profile/${reply.user_id}`} onClick={onClose} className="text-[9px] font-bold text-[#1C4A5C] mb-0.5 hover:underline block">
                                  {reply.users?.name}
                                </Link>
                                <p className="text-xs text-gray-700 leading-normal">
                                  {reply.content}
                                </p>
                                
                                {currentUser?.id === reply.user_id && !reply.isOptimistic && (
                                  <button 
                                    onClick={() => handleDelete(reply.comment_id)}
                                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 ml-2">
                                <span className="text-[9px] text-gray-400 font-medium italic">
                                  {formatRelativeTime(reply.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}
                  <div ref={commentsEndRef} />
                </div>
              ) : (
                <div className="py-10 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                  <p className="text-xs text-gray-400 italic">No comments yet. Start the conversation!</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer: Comment Input */}
          <div className="p-6 bg-white border-t border-gray-100 shrink-0">
            {replyingTo && (
              <div className="mb-3 px-4 py-2 bg-blue-50/50 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
                <p className="text-[10px] font-bold text-blue-700 flex items-center gap-2">
                  <ChevronRight size={12} /> Replying to <span className="underline">{replyingTo.users.name}</span>
                </p>
                <button 
                  onClick={() => setReplyingTo(null)}
                  className="text-blue-400 hover:text-blue-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <form onSubmit={handleCommentSubmit} className="relative">
              <input 
                type="text" 
                placeholder={currentUser ? (replyingTo ? "Write a reply..." : "Write a comment...") : "Log in to join the discussion"}
                value={comment}
                disabled={!currentUser || isSubmitting}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1C4A5C]/10 transition-all pr-12 font-medium shadow-inner"
              />
              <button 
                type="submit"
                disabled={isSubmitting || !comment.trim() || !currentUser}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1C4A5C] font-black text-xs uppercase tracking-widest hover:text-[#C87941] disabled:opacity-30 transition-colors bg-white p-2 rounded-full shadow-sm"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-[#1C4A5C] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
            {!currentUser && (
              <p className="text-[10px] text-center text-gray-400 mt-2 font-medium uppercase tracking-tighter">
                Authentication required to post comments
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
