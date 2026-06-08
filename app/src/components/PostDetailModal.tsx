"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Heart, MessageCircle, Share2, Clock } from 'lucide-react';
import { toggleLike, addComment } from '@/app/actions/index';

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    post_id: string;
    content: string | null;
    image_url: string;
    created_at: string;
    user_id: string;
  } | null;
  userName: string;
  userAvatar: string | null;
}

export default function PostDetailModal({ isOpen, onClose, post, userName, userAvatar }: PostDetailModalProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !post) return null;

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment(Number(post.post_id), comment);
      setComment('');
      // In a real app, we'd update the UI here with the new comment
      alert("Comment added! (UI refresh pending)");
    } catch (error: any) {
      alert(error.message || "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
        
        {/* Left Side: Image (if any) */}
        <div className={`md:w-1/2 bg-black flex items-center justify-center relative ${!post.image_url && 'hidden md:flex'}`}>
          {post.image_url ? (
            <Image 
              src={post.image_url} 
              alt="Post content" 
              fill 
              className="object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20">
              <MessageCircle size={120} />
            </div>
          )}
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 md:hidden bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-900 shadow-md"
          >
            <X size={20} />
          </button>
        </div>

        {/* Right Side: Content & Interaction */}
        <div className={`${post.image_url ? 'md:w-1/2' : 'w-full'} flex flex-col bg-white overflow-hidden`}>
          {/* Header */}
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 relative">
                {userAvatar ? (
                  <Image src={userAvatar} alt={userName} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">
                    {userName.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm leading-none mb-1">{userName}</h4>
                <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-medium">
                  <Clock size={10} />
                  {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
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

          {/* Body: Post Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            <div className="space-y-4">
              <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                Social Post
              </span>
              <p className="text-gray-800 leading-relaxed text-sm whitespace-pre-line">
                {post.content}
              </p>
            </div>

            {/* Interaction Stats (Simplified) */}
            <div className="flex items-center gap-6 py-4 border-y border-gray-50">
              <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-500 transition-colors">
                <Heart size={18} /> Like
              </button>
              <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#1C4A5C] transition-colors">
                <MessageCircle size={18} /> Comment
              </button>
              <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#1C4A5C] transition-colors">
                <Share2 size={18} /> Share
              </button>
            </div>

            {/* Comments Placeholder */}
            <div className="space-y-4">
              <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Comments</h5>
              <div className="py-10 text-center">
                <p className="text-xs text-gray-400 italic">No comments to display yet.</p>
              </div>
            </div>
          </div>

          {/* Footer: Comment Input */}
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <form onSubmit={handleCommentSubmit} className="relative">
              <input 
                type="text" 
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C4A5C]/10 transition-all pr-12"
              />
              <button 
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1C4A5C] font-black text-xs uppercase tracking-widest hover:text-[#C87941] disabled:opacity-30 transition-colors"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
