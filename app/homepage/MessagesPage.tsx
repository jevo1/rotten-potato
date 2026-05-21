"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    const fetchMessages = async () => {
      // 1. Get the currently logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      // 2. Fetch messages where the user is either the sender or receiver
      const { data, error } = await supabase
        .from('messages')
        .select(`
          message_id,
          content,
          timestamp,
          sender_id,
          receiver_id,
          sender:users!messages_sender_id_fkey ( name ),
          receiver:users!messages_receiver_id_fkey ( name )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error("Error fetching messages:", error);
      } else if (data) {
        setMessages(data);
      }
      setLoading(false);
    };

    fetchMessages();
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading messages...</div>;
  }

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full text-slate-800 font-sans pb-20 pt-8">
      <div className="max-w-4xl mx-auto px-6">
        
        <div className="mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-extrabold text-[#1C4A5C]">Direct Messages</h1>
          <p className="text-gray-500 mt-2 font-medium">Chat with local Baybayanon artists and clients.</p>
        </div>

        <div className="space-y-4">
          {messages.length > 0 ? (
            messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              
              return (
                <div key={msg.message_id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${isMine ? 'bg-[#1C4A5C] text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}`}>
                    
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold ${isMine ? 'text-blue-100' : 'text-[#C87941]'}`}>
                        {isMine ? 'You' : msg.sender?.name || 'Unknown User'}
                      </span>
                      <span className={`text-[10px] ${isMine ? 'text-blue-200/70' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 border-dashed">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-lg font-bold text-gray-900">No messages yet</h3>
              <p className="text-gray-500 text-sm mt-1">When you contact an artist or client, your conversation will appear here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}