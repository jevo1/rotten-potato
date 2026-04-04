import React from 'react';

export default function MessagesPage() {
  // Mock data for the conversations list on the left
  const conversations = [
    { id: 1, name: 'Maria Santos', time: '2m ago', snippet: 'Sure! I can start the commissi...', unread: 2, online: true, active: true },
    { id: 2, name: 'Jun dela Cruz', time: '1h ago', snippet: 'The pottery set is ready for pickup!', unread: 0, online: false, active: false },
    { id: 3, name: 'Lola Nena Craft', time: 'Yesterday', snippet: 'Thank you for your order! 😊', unread: 0, online: true, active: false },
    { id: 4, name: 'Ana Reyes', time: '2 days ago', snippet: 'The necklace comes in gold and sil...', unread: 0, online: false, active: false },
  ];

  return (
    <div className="flex h-[calc(100vh-130px)] w-full bg-white font-sans border-t border-gray-100">
      
      {/* --- LEFT SIDEBAR: Conversation List --- */}
      <div className="w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col bg-[#FCFAF8] shrink-0">
        
        {/* Sidebar Header & Search */}
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-2xl font-black text-[#1C4A5C] mb-4 tracking-tight">Messages</h2>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-gray-100/80 border-transparent rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#C87941] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((chat) => (
            <div 
              key={chat.id} 
              className={`flex items-start gap-3 p-4 border-b border-gray-50 cursor-pointer transition-colors ${
                chat.active ? 'bg-white border-l-4 border-l-[#C87941]' : 'hover:bg-gray-50 border-l-4 border-l-transparent'
              }`}
            >
              {/* Avatar with Online Badge */}
              <div className="relative shrink-0">
                <div className="w-12 h-12 bg-gray-200 rounded-full border border-gray-100 overflow-hidden">
                  {/* Placeholder for actual avatar image */}
                </div>
                {chat.online && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              
              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{chat.name}</h4>
                  <span className="text-xs font-medium text-gray-400 shrink-0">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <p className={`text-xs truncate ${chat.unread > 0 ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
                    {chat.snippet}
                  </p>
                  {chat.unread > 0 && (
                    <span className="bg-[#C87941] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- RIGHT PANE: Active Chat History --- */}
      <div className="flex-1 flex flex-col bg-white h-full relative">
        
        {/* Chat Header */}
        <div className="h-[76px] px-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#1C4A5C]">Maria Santos</h3>
              <p className="text-xs font-medium text-green-500">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-[#5c8a9c]">
            <button className="hover:text-[#1C4A5C] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </button>
            <button className="hover:text-[#1C4A5C] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </button>
            <button className="hover:text-[#1C4A5C] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          
          {/* Incoming Message Block */}
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0"></div>
            <div className="max-w-[70%]">
              <div className="bg-gray-100 text-gray-800 p-3.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed">
                Hi! I saw you're interested in a custom painting. What size and subject did you have in mind?
              </div>
              <p className="text-[10px] text-gray-400 font-medium mt-1 ml-1">10:30 AM</p>
            </div>
          </div>

          {/* Outgoing Message Block */}
          <div className="flex items-end justify-end gap-2">
            <div className="max-w-[70%]">
              <div className="bg-[#C87941] text-white p-3.5 rounded-2xl rounded-br-sm text-sm leading-relaxed shadow-sm">
                Hello Maria! I'd love a 24x36 inch oil painting of the Baybay coastline at sunset. Is that possible?
              </div>
              <div className="flex items-center justify-end gap-1 mt-1 mr-1">
                <p className="text-[10px] text-gray-400 font-medium">10:35 AM</p>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
          </div>

          {/* Incoming Message Block */}
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0"></div>
            <div className="max-w-[70%]">
              <div className="bg-gray-100 text-gray-800 p-3.5 rounded-2xl rounded-bl-sm text-sm leading-relaxed">
                Absolutely! That's one of my favorite subjects. I can do that for ₱4,500 with a 3-week turnaround.
              </div>
              <p className="text-[10px] text-gray-400 font-medium mt-1 ml-1">10:40 AM</p>
            </div>
          </div>

          {/* Outgoing Message Block */}
          <div className="flex items-end justify-end gap-2">
            <div className="max-w-[70%]">
              <div className="bg-[#C87941] text-white p-3.5 rounded-2xl rounded-br-sm text-sm leading-relaxed shadow-sm">
                That sounds perfect! Can I see some samples of your sunset paintings first?
              </div>
              <div className="flex items-center justify-end gap-1 mt-1 mr-1">
                <p className="text-[10px] text-gray-400 font-medium">10:42 AM</p>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
          </div>

          {/* Incoming Message (Image Attachment) */}
          <div className="flex items-end gap-2 pb-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0"></div>
            <div className="max-w-[70%]">
              <div className="bg-gray-100 p-2 rounded-2xl rounded-bl-sm">
                <div className="w-64 h-40 bg-gray-300 rounded-xl overflow-hidden relative">
                    {/* Dark gradient to simulate image depth */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
                    <div className="absolute top-2 right-2 bg-[#C87941] text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">Painting</div>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-medium mt-1 ml-1">10:45 AM</p>
            </div>
          </div>

        </div>

        {/* Chat Input Box */}
        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            {/* Attachment Icons */}
            <div className="flex items-center gap-2 text-gray-400">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </button>
            </div>
            
            {/* Text Input */}
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="w-full bg-white border border-gray-200 rounded-full pl-5 pr-10 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#1C4A5C] focus:border-[#1C4A5C]"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </button>
            </div>

            {/* Send Button */}
            <button className="bg-gray-200 hover:bg-[#C87941] text-white p-3 rounded-full transition-colors group">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-white transition-colors translate-x-[-1px] translate-y-[1px]"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}