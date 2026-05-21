"use client";
import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { sendMessage } from '@/app/actions';

// Define types for our grouped data
type Message = {
  message_id: string;
  content: string;
  timestamp: string;
  sender_id: string;
  receiver_id: string;
  sender?: any; 
  receiver?: any;
};
type Conversation = {
  otherUserId: string;
  otherUserName: string;
  latestMessageTime: string;
  messages: Message[];
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Reply State
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

    // Fetch all messages involving the user
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
      .order('timestamp', { ascending: true }); // Ascending so oldest is at top, newest at bottom

    if (error) {
      console.error("Error fetching messages:", error);
    } else if (data) {
      
      const convoMap = new Map<string, Conversation>();
      
      data.forEach((msg: Message) => {
        const isSender = msg.sender_id === user.id;
        const otherUserId = isSender ? msg.receiver_id : msg.sender_id;
        const otherUserName = isSender 
          ? (msg.receiver?.name || 'Unknown User') 
          : (msg.sender?.name || 'Unknown User');

        if (!convoMap.has(otherUserId)) {
          convoMap.set(otherUserId, {
            otherUserId,
            otherUserName,
            latestMessageTime: msg.timestamp,
            messages: []
          });
        }
        
        const convo = convoMap.get(otherUserId)!;
        convo.messages.push(msg);
        convo.latestMessageTime = msg.timestamp;
      });

      const convoArray = Array.from(convoMap.values()).sort(
        (a, b) => new Date(b.latestMessageTime).getTime() - new Date(a.latestMessageTime).getTime()
      );

      setConversations(convoArray);
      
      if (!activeConvoId && convoArray.length > 0) {
        setActiveConvoId(convoArray[0].otherUserId);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConvoId, conversations]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConvoId) return;

    setIsSending(true);
    try {
      await sendMessage(activeConvoId, replyText);
      setReplyText('');
      await fetchMessages(); 
    } catch (error) {
      console.error(error);
      alert("Failed to send reply.");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500 font-medium">Loading your inbox...</div>;
  }

  const activeConversation = conversations.find(c => c.otherUserId === activeConvoId);

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full text-slate-800 font-sans pb-10 pt-6">
      <div className="max-w-6xl mx-auto px-6 h-[80vh] flex flex-col">
        
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#1C4A5C]">Inbox</h1>
        </div>

        {/* --- Split Inbox Layout --- */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row h-full">
          
          {/* Left Panel: Conversation List */}
          <div className="w-full md:w-1/3 border-r border-gray-100 flex flex-col h-full bg-gray-50/50">
            <div className="p-4 border-b border-gray-100 bg-white">
              <h2 className="font-bold text-gray-700">Messages</h2>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {conversations.length > 0 ? (
                conversations.map((convo) => (
                  <button
                    key={convo.otherUserId}
                    onClick={() => setActiveConvoId(convo.otherUserId)}
                    className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-3 ${
                      activeConvoId === convo.otherUserId 
                        ? 'bg-[#1C4A5C] text-white shadow-md' 
                        : 'hover:bg-white text-gray-700 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      activeConvoId === convo.otherUserId ? 'bg-white/20 text-white' : 'bg-[#1C4A5C]/10 text-[#1C4A5C]'
                    }`}>
                      {convo.otherUserName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate text-sm">{convo.otherUserName}</h3>
                      <p className={`text-xs truncate mt-0.5 ${activeConvoId === convo.otherUserId ? 'text-blue-100' : 'text-gray-500'}`}>
                        {convo.messages[convo.messages.length - 1].content}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center p-6 text-gray-400 text-sm">
                  No conversations yet.
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Active Chat & Reply */}
          <div className="flex-1 flex flex-col h-full bg-white relative">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white/95 backdrop-blur-sm z-10 sticky top-0">
                   <div className="w-10 h-10 rounded-full bg-[#1C4A5C]/10 flex items-center justify-center font-bold text-[#1C4A5C]">
                      {activeConversation.otherUserName.charAt(0)}
                    </div>
                  <div>
                    <h2 className="font-bold text-gray-900">{activeConversation.otherUserName}</h2>
                  </div>
                </div>

                {/* Messages History */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FCFAF8]/30">
                  {activeConversation.messages.map((msg) => {
                    const isMine = msg.sender_id === currentUserId;
                    return (
                      <div key={msg.message_id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                          isMine 
                            ? 'bg-[#1C4A5C] text-white rounded-tr-sm' 
                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-2 text-right ${isMine ? 'text-blue-200/70' : 'text-gray-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="p-4 border-t border-gray-100 bg-white flex items-end gap-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 max-h-32 min-h-[50px] p-3 rounded-2xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none resize-none text-sm transition-all"
                    rows={1}
                    onKeyDown={(e) => {
                      // Pressing Enter sends the message (Shift+Enter for new line)
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSending}
                    className="h-[50px] px-6 rounded-2xl bg-[#1C4A5C] text-white font-bold text-sm hover:bg-[#143745] disabled:opacity-50 transition-all shadow-sm flex items-center justify-center"
                  >
                    {isSending ? '...' : 'Send'}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 h-full">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <p>Select a conversation to start chatting</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}