"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPost } from '@/app/actions/index';
import Image from 'next/image';
import { X, Image as ImageIcon, Send } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await createPost(formData);
      onClose();
      setPreviewUrl(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to create post.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1C4A5C]">Create Community Post</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form action={handleSubmit} className="p-6 space-y-4">
          <textarea 
            name="content" 
            required
            placeholder="What's on your mind? Share your process or a status update..."
            className="w-full min-h-[120px] p-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#1C4A5C]/10 outline-none transition-all resize-none text-sm text-gray-700 placeholder:text-gray-400 font-medium"
          ></textarea>

          {/* Image Preview */}
          {previewUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 aspect-video group">
              <Image src={previewUrl} alt="Preview" fill className="object-cover" />
              <button 
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full cursor-pointer transition-colors text-gray-600">
              <ImageIcon size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Add Photo</span>
              <input 
                type="file" 
                name="image" 
                accept="image/*" 
                onChange={handleImageChange}
                className="hidden" 
              />
            </label>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-[#1C4A5C] text-white font-bold py-2.5 px-8 rounded-full hover:bg-[#143745] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-[#1C4A5C]/10"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Post</span>
                  <Send size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
