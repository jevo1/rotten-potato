"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { sendMessage } from '@/app/actions/index';

type MessageUser = {
  name: string;
};

type Message = {
  message_id: string;
  content: string;
  timestamp: string;
  sender_id: string;
  receiver_id: string;
  sender?: MessageUser | MessageUser[]; 
  receiver?: MessageUser | MessageUser[];
};

type Conversation = {
  otherUserId: string;
  otherUserName: string;
  latestMessageTime: string;
  messages: Message[];
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

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
      .order('timestamp', { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else if (data) {
      const convoMap = new Map<string, Conversation>();
      
      (data as Message[]).forEach((msg) => {
        const isSender = msg.sender_id === user.id;
        const otherUserId = isSender ? msg.receiver_id : msg.sender_id;
        
        const receiverName = Array.isArray(msg.receiver) ? msg.receiver[0]?.name : msg.receiver?.name;
        const senderName = Array.isArray(msg.sender) ? msg.sender[0]?.name : msg.sender?.name;

        const otherUserName = isSender 
          ? (receiverName || 'Unknown User') 
          : (senderName || 'Unknown User');

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
  }, [supabase, activeConvoId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('realtime_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.sender_id !== currentUserId && newMessage.receiver_id !== currentUserId) return;

          let needsRefetch = false;
          setConversations(prev => {
            const isDuplicate = prev.some(c => c.messages.some(m => m.message_id === newMessage.message_id));
            if (isDuplicate) return prev;

            const otherUserId = newMessage.sender_id === currentUserId ? newMessage.receiver_id : newMessage.sender_id;
            const existingConvoIndex = prev.findIndex(c => c.otherUserId === otherUserId);

            if (existingConvoIndex === -1) {
              needsRefetch = true;
              return prev;
            }

            const updatedConversations = [...prev];
            const convo = { ...updatedConversations[existingConvoIndex] };
            convo.messages = [...convo.messages, newMessage];
            convo.latestMessageTime = newMessage.timestamp;
            updatedConversations[existingConvoIndex] = convo;
            
            return updatedConversations.sort(
              (a, b) => new Date(b.latestMessageTime).getTime() - new Date(a.latestMessageTime).getTime()
            );
          });

          if (needsRefetch) fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchMessages, supabase]);

  useEffect(() => {
    scrollToBottom();
  }, [activeConvoId, conversations, scrollToBottom]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConvoId) return;

    setIsSending(true);
    try {
      await sendMessage(activeConvoId, replyText);
      setReplyText('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[calc(100vh-116px)] w-full flex items-center justify-center bg-[#FCFAF8]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#1C4A5C] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium text-sm">Syncing messages...</p>
        </div>
      </div>
    );
  }

  const activeConversation = conversations.find(c => c.otherUserId === activeConvoId);

  return (
    <div className="h-[calc(100vh-116px)] w-full bg-[#FCFAF8] overflow-hidden">
      <div className="h-full w-full flex">
        
        {/* --- Conversations Sidebar --- */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col border-r border-gray-200 bg-white z-20">
          <div className="p-6 pb-4">
            <h1 className="text-2xl font-black text-[#1C4A5C] mb-4">Inbox</h1>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input 
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#1C4A5C]/10 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((convo) => (
                <button
                  key={convo.otherUserId}
                  onClick={() => setActiveConvoId(convo.otherUserId)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center gap-3.5 mb-1 group ${
                    activeConvoId === convo.otherUserId 
                      ? 'bg-[#1C4A5C] text-white shadow-lg shadow-[#1C4A5C]/20' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="relative flex-none">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg transition-transform group-active:scale-90 ${
                      activeConvoId === convo.otherUserId ? 'bg-white/20 text-white' : 'bg-[#1C4A5C]/10 text-[#1C4A5C]'
                    }`}>
                      {convo.otherUserName.charAt(0)}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-bold truncate text-sm">{convo.otherUserName}</h3>
                      <span className={`text-[10px] flex-none ml-2 ${activeConvoId === convo.otherUserId ? 'text-blue-100/70' : 'text-gray-400'}`}>
                        {new Date(convo.latestMessageTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className={`text-xs truncate font-medium ${activeConvoId === convo.otherUserId ? 'text-blue-100/90' : 'text-gray-500'}`}>
                      {convo.messages[convo.messages.length - 1].content}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <p className="text-gray-400 text-xs font-medium">No conversations found</p>
              </div>
            )}
          </div>
        </div>

        {/* --- Chat Window --- */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-[#1C4A5C] text-white flex items-center justify-center font-black shadow-md shadow-[#1C4A5C]/10">
                      {activeConversation.otherUserName.charAt(0)}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <h2 className="font-black text-gray-900 leading-tight">{activeConversation.otherUserName}</h2>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Online Now</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2.5 rounded-xl hover:bg-gray-50 text-gray-400 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                  </button>
                </div>
              </div>

              {/* Messages History */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-[#FCFAF8]/40">
                {activeConversation.messages.map((msg, index) => {
                  const isMine = msg.sender_id === currentUserId;
                  const prevMsg = activeConversation.messages[index - 1];
                  const showTime = !prevMsg || new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() > 300000;

                  return (
                    <React.Fragment key={msg.message_id}>
                      {showTime && (
                        <div className="flex justify-center my-6">
                          <span className="px-3 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[80%] md:max-w-[65%] rounded-2xl px-4 py-3 shadow-sm relative ${
                          isMine 
                            ? 'bg-[#1C4A5C] text-white rounded-tr-none' 
                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                        }`}>
                          <p className="text-[13px] leading-relaxed font-medium">{msg.content}</p>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} className="h-2" />
              </div>

              {/* Reply Form */}
              <div className="p-6 bg-white border-t border-gray-100">
                <form onSubmit={handleSendReply} className="flex flex-row items-center gap-3 w-full max-w-7xl mx-auto">
                  <div className="flex-1">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a message..."
                      className="w-full max-h-40 min-h-[52px] px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#1C4A5C]/10 outline-none resize-none text-sm text-gray-900 font-medium transition-all placeholder:text-gray-400 flex items-center"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply(e);
                        }
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSending}
                    className="w-12 h-12 flex-none rounded-2xl bg-[#1C4A5C] text-white hover:bg-[#143745] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg shadow-[#1C4A5C]/20 flex items-center justify-center"
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#FCFAF8]/40 p-12 text-center h-full">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-gray-200/50 flex items-center justify-center mb-8 animate-bounce duration-[3000ms]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1C4A5C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <h2 className="text-xl font-black text-[#1C4A5C] mb-3">Your Conversations</h2>
              <p className="text-gray-400 text-sm max-w-xs font-medium">Select a friend from the list on the left to start sharing your art journey.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}