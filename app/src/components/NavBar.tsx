"use client";
import React, { useState } from 'react';
import { logout } from '@/app/actions';
import Image from 'next/image';
import Link from 'next/link';

interface NavBarProps {
    logoText?: string;
    onSearch?: (query: string) => void;
    onProfileClick?: () => void;
    userName?: string;
    profileImage?: string;
    isArtist?: boolean; 
}

export const NavBar: React.FC<NavBarProps> = ({
    logoText = 'GamâLokal',
    onSearch,
    onProfileClick,
    userName = 'A',
    profileImage = '/user-default.svg',
    isArtist = false,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearch?.(query);
    };

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

            {/* Search Bar */}
            <div className="flex-1 max-w-3xl mx-8">
                <div className="flex w-full">
                    <input
                        type="text"
                        placeholder="Search artworks, artists, crafts..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full border border-r-0 border-[#C87941] rounded-l-full pl-5 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C87941] focus:border-[#C87941] transition-colors"
                    />
                    <button className="bg-[#C87941] hover:bg-[#b06a39] text-white px-6 rounded-r-full border border-[#C87941] flex items-center justify-center transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </button>
                </div>
            </div>

            {/* Right Side Icons & Profile */}
            <div className="flex items-center gap-6 min-w-fit">
                
                {/* Messages Icon */}
                <button className="relative text-[#C87941] hover:text-[#b06a39] transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span className="absolute -top-1.5 -right-1.5 bg-[#f2a83b] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">3</span>
                </button>

                {/* Notifications Icon */}
                <button className="relative text-[#C87941] hover:text-[#b06a39] transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <span className="absolute -top-1.5 -right-1.5 bg-[#1C4A5C] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">5</span>
                </button>

                {/* Cart/Bag Icon */}
                <button className="relative text-[#C87941] hover:text-[#b06a39] transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    <span className="absolute -top-1.5 -right-1.5 bg-[#8B5A2B] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">2</span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative ml-2">
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 border border-[#C87941] rounded-full pl-1 pr-3 py-1 hover:bg-orange-50 transition-colors"
                    >
                        <Image src={profileImage} alt="Profile" width={28} height={28} className="rounded-full bg-gray-200" />
                        <span className="text-[#C87941] text-sm font-semibold">{userName}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C87941" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                            
                            <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                Profile
                            </Link>

                            {/* ARTIST ONLY LINKS */}
                            {isArtist && (
                                <>
                                    <Link href="/dashboard" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-t border-gray-50">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                                        Dashboard
                                    </Link>

                                    <Link href="/dashboard/sales" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-t border-gray-50">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                        Sales
                                    </Link>
                                </>
                            )}

                            <Link href="/settings" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 border-t border-gray-50">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                                Settings
                            </Link>

                            {/* NON-ARTIST ONLY LINK */}
                            {!isArtist && (
                                <Link href="/onboarding/artist" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-3 text-sm text-[#1C4A5C] font-semibold hover:bg-[#e8ecef] flex items-center gap-3 border-t border-gray-100 bg-gray-50/50">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                    Become an Artist
                                </Link>
                            )}

                            <form action={logout}>
                                <button type="submit" className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 border-t border-gray-100 font-medium">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                    Logout
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};