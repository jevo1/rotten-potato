"use client";
import React, { useState, useEffect } from 'react';
import { logout, getCartItems } from '@/app/actions';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import PostArtworkModal from './PostArtworkModal';
import { 
    MessageCircle, 
    Bell, 
    ShoppingCart, 
    ChevronDown, 
    UserRound, 
    LayoutGrid, 
    DollarSign, 
    Sparkles, 
    LogOut, 
    Plus,
    Home,
    Store,
    ClipboardList,
    MessageSquare
} from 'lucide-react';

interface NavBarProps {
    logoText?: string;
    userName?: string;
    profileImage?: string;
    isArtist?: boolean;
    activeTab?: number;
    setActiveTab?: (tab: number) => void;
}

export const NavBar: React.FC<NavBarProps> = ({
    logoText = 'GamâLokal',
    userName = 'A',
    profileImage = '/user-default.svg',
    isArtist = false,
    activeTab = 0,
    setActiveTab = (_tab: number) => {},
}) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const fetchCartCount = async () => {
            const items = await getCartItems();
            setCartCount(items.length);
        };

        fetchCartCount();

        const supabase = createClient();
        const channel = supabase
            .channel('cart_items_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'cart_items',
                },
                () => {
                    fetchCartCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const tabs = [
        { id: 0, label: 'Home', icon: Home },
        { id: 1, label: 'Marketplace', icon: Store },
        { id: 2, label: 'Commission', icon: ClipboardList },
        { id: 3, label: 'Messages', icon: MessageSquare },
    ];

    return (
        <>
            <nav className="bg-white px-4 md:px-6 py-3 flex items-center justify-between border-b border-gray-100 shadow-sm w-full sticky top-0 z-50">
                {/* Logo Section */}
                <div className="flex items-center gap-3 min-w-fit">
                    <Link href="/homepage" className="flex items-center gap-3 no-underline">
                        <Image src="/logo.png" alt="GamâLokal Logo" width={40} height={40} className="object-contain" />
                        <div className="flex flex-col hidden sm:flex">
                            <span className="text-xl font-black text-[#C87941] leading-none tracking-tight">{logoText}</span>
                            <span className="text-[10px] font-medium text-[#1C4A5C] tracking-wide mt-0.5">Art & Craft Marketplace</span>
                        </div>
                    </Link>
                </div>

                {/* Navigation Tabs - Desktop Only */}
                <div className="hidden lg:flex items-center bg-gray-50/50 rounded-full px-1 py-1 border border-gray-100">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-[#1C4A5C] text-white shadow-md'
                                        : 'text-gray-500 hover:text-[#1C4A5C] hover:bg-white'
                                }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Right Side Icons & Profile */}
                <div className="flex items-center gap-2 md:gap-3 min-w-fit">
                    
                    {/* List Artwork Button */}
                    <button
                        onClick={() => setIsPostModalOpen(true)}
                        className="flex items-center gap-2 bg-[#f2a83b] text-slate-900 px-4 md:px-5 py-2 rounded-full font-bold text-sm hover:bg-[#e09b36] hover:scale-105 transition-all shadow-sm active:scale-95"
                    >
                        <Plus size={16} strokeWidth={3} />
                        <span className="hidden md:inline">List Artwork</span>
                        <span className="md:hidden">List</span>
                    </button>

                    <div className="flex items-center gap-1">
                        <button className="relative text-gray-500 hover:text-[#C87941] hover:bg-orange-50 p-2 rounded-full transition-all">
                            <MessageCircle size={20} strokeWidth={2} />
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">3</span>
                        </button>

                        <button className="relative text-gray-500 hover:text-[#1C4A5C] hover:bg-slate-50 p-2 rounded-full transition-all hidden sm:block">
                            <Bell size={20} strokeWidth={2} />
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">5</span>
                        </button>

                        <Link href="/cart">
                            <button className="relative text-gray-500 hover:text-[#8B5A2B] hover:bg-stone-50 p-2 rounded-full transition-all">
                                <ShoppingCart size={20} strokeWidth={2} />
                                {cartCount > 0 && (
                                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </Link>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative ml-1 pl-2 border-l border-gray-200">
                        <button 
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-50 transition-colors"
                        >
                            {profileImage === '/user-default.svg' || !profileImage ? (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1C4A5C] to-[#3A6A7C] flex items-center justify-center text-white font-bold text-sm shadow-inner">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                            ) : (
                                <Image src={profileImage} alt="Profile" width={32} height={32} className="rounded-full bg-gray-100 object-cover aspect-square border border-gray-100" />
                            )}
                            <ChevronDown size={14} strokeWidth={2} className={`text-gray-400 transition-transform duration-200 hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-50">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
                                    <p className="text-sm font-bold text-gray-800 truncate">{userName}</p>
                                </div>
                                
                                <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                                    <UserRound size={16} strokeWidth={1.5} />
                                    Profile
                                </Link>

                                {isArtist && (
                                    <>
                                        <Link href="/dashboard" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                                            <LayoutGrid size={16} strokeWidth={2} />
                                            Dashboard
                                        </Link>

                                        <Link href="/dashboard/sales" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                                            <DollarSign size={16} strokeWidth={2} />
                                            Sales
                                        </Link>
                                    </>
                                )}

                                {!isArtist && (
                                    <Link href="/onboarding/artist" onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-3 text-sm text-[#1C4A5C] font-semibold hover:bg-slate-50 flex items-center gap-3 border-t border-gray-50">
                                        <Sparkles size={16} strokeWidth={2} />
                                        Become an Artist
                                    </Link>
                                )}

                                <form action={logout}>
                                    <button type="submit" className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 border-t border-gray-50 font-medium">
                                        <LogOut size={16} strokeWidth={2} />
                                        Logout
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center gap-1 transition-all ${
                                activeTab === tab.id
                                    ? 'text-[#1C4A5C]'
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <div className={`p-1 rounded-lg ${activeTab === tab.id ? 'bg-slate-100' : ''}`}>
                                <Icon 
                                    size={22}
                                    strokeWidth={activeTab === tab.id ? 2.5 : 2}
                                />
                            </div>
                            <span className={`text-[10px] font-bold ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            <PostArtworkModal 
                isOpen={isPostModalOpen} 
                onClose={() => setIsPostModalOpen(false)} 
            />
        </>
    );
};
