"use client";
import React, { useState } from 'react';
import { logout } from '@/app/actions';
import Image from 'next/image';
import Link from 'next/link';
import PostArtworkModal from './PostArtworkModal';
import { MessageCircle, Bell, ShoppingCart, ChevronDown, UserRound, LayoutGrid, DollarSign, Sparkles, LogOut, Plus } from 'lucide-react';

interface NavBarProps {
    logoText?: string;
    userName?: string;
    profileImage?: string;
    isArtist?: boolean; 
}

export const NavBar: React.FC<NavBarProps> = ({
    logoText = 'GamâLokal',
    userName = 'A',
    profileImage = '/user-default.svg',
    isArtist = false,
}) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);

    return (
        <nav className="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-100 shadow-sm w-full">
            {/* Logo Section */}
            <div className="flex items-center gap-3 min-w-fit">
                <a href="/homepage" className="flex items-center gap-3 no-underline">
                    <Image src="/logo.png" alt="GamâLokal Logo" width={40} height={40} className="object-contain" />
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-[#C87941] leading-none tracking-tight">{logoText}</span>
                        <span className="text-[10px] font-medium text-[#1C4A5C] tracking-wide mt-0.5">Art & Craft Marketplace</span>
                    </div>
                </a>
            </div>

            {/* Spacer to push icons to the right since search bar is removed */}
            <div className="flex-1"></div>

            {/* Right Side Icons & Profile */}
            <div className="flex items-center gap-3 min-w-fit">
                
                {/* Post Artwork Button (Artist Only) */}
                {isArtist && (
                  <button 
                    onClick={() => setIsPostModalOpen(true)}
                    className="flex items-center gap-2 bg-[#1C4A5C] text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-[#143745] hover:scale-105 transition-all shadow-sm active:scale-95 mr-2"
                  >
                    <Plus size={16} strokeWidth={3} />
                    Post
                  </button>
                )}

                {/* Messages Icon */}
                <button className="relative text-gray-500 hover:text-[#C87941] hover:bg-orange-50 p-2.5 rounded-full transition-all">
                    <MessageCircle size={20} strokeWidth={2} />
                    <span className="absolute top-1.5 right-1.5 bg-gray-800 text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">3</span>
                </button>

                {/* Notifications Icon */}
                <button className="relative text-gray-500 hover:text-[#1C4A5C] hover:bg-slate-50 p-2.5 rounded-full transition-all">
                    <Bell size={20} strokeWidth={2} />
                    <span className="absolute top-1.5 right-1.5 bg-gray-800 text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">5</span>
                </button>

                {/* Cart/Bag Icon */}
                <button className="relative text-gray-500 hover:text-[#8B5A2B] hover:bg-stone-50 p-2.5 rounded-full transition-all">
                    <ShoppingCart size={20} strokeWidth={2} />
                    <span className="absolute top-1.5 right-1.5 bg-gray-800 text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">2</span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative ml-2 pl-2 border-l border-gray-200">
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                    >
                        {profileImage === '/user-default.svg' || !profileImage ? (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1C4A5C] to-[#3A6A7C] flex items-center justify-center text-white font-bold text-sm shadow-inner">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        ) : (
                            <Image src={profileImage} alt="Profile" width={32} height={32} className="rounded-full bg-gray-100 object-cover aspect-square border border-gray-100" />
                        )}
                        <span className="text-gray-700 text-sm font-semibold hidden md:block">{userName}</span>
                        <ChevronDown size={14} strokeWidth={2} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                            
                            <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                                <UserRound size={16} strokeWidth={1.5} />
                                Profile
                            </Link>

                            {/* ARTIST ONLY LINKS */}
                            {isArtist && (
                                <>
                                    <Link href="/dashboard" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-t border-gray-50">
                                        <LayoutGrid size={16} strokeWidth={2} />
                                        Dashboard
                                    </Link>

                                    <Link href="/dashboard/sales" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-t border-gray-50">
                                        <DollarSign size={16} strokeWidth={2} />
                                        Sales
                                    </Link>
                                </>
                            )}

                            {/* NON-ARTIST ONLY LINK */}
                            {!isArtist && (
                                <Link href="/onboarding/artist" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-3 text-sm text-[#1C4A5C] font-semibold hover:bg-[#e8ecef] flex items-center gap-3 border-t border-gray-100 bg-gray-50/50">
                                    <Sparkles size={16} strokeWidth={2} />
                                    Become an Artist
                                </Link>
                            )}

                            <form action={logout}>
                                <button type="submit" className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 border-t border-gray-100 font-medium">
                                    <LogOut size={16} strokeWidth={2} />
                                    Logout
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
            
            <PostArtworkModal 
              isOpen={isPostModalOpen} 
              onClose={() => setIsPostModalOpen(false)} 
            />
        </nav>
    );
};
