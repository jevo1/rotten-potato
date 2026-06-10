"use client";
import React, { useState } from 'react';
import { sendMessage } from '@/app/actions/index';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
}

export default function SendMessageModal({ isOpen, onClose, receiverId, receiverName }: SendMessageModalProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // If the modal isn't open, don't render anything
  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await sendMessage(receiverId, content);
      setSuccess(true);
      setTimeout(() => {
        // Reset and close after a short delay
        setSuccess(false);
        setContent('');
        onClose();
      }, 1500);
    } catch (error) {
      console.error(error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-4">
      {/* Modal Container */}
      <div className="bg-white w-full h-full md:h-auto md:max-w-md md:rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
        
        {/* Header */}
        <div className="bg-[#1C4A5C] px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-white font-bold text-lg">Message {receiverName}</h3>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors bg-white/10 p-1.5 rounded-full hover:bg-white/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {success ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900">Message Sent!</h4>
              <p className="text-sm text-gray-500 mt-1">They will see it in their inbox.</p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Your Message</label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Hi ${receiverName}, I'm interested in your art...`}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all resize-none text-sm text-gray-900"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pb-10 md:pb-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="px-6 py-2.5 rounded-full text-sm font-bold bg-[#1C4A5C] text-white hover:bg-[#143745] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}