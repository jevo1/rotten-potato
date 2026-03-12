"use client";
import React, { useState } from 'react';
import Button from './Button';
import Image from 'next/image';


interface NavBarProps {
    logoText?: string;
    onSearch?: (query: string) => void;
    onProfileClick?: () => void;
    userName?: string;
    profileImage?: string;
}

export const NavBar: React.FC<NavBarProps> = ({
    logoText = 'Logo',
    onSearch,
    onProfileClick,
    userName = 'A',
    profileImage = '/user-default.svg',
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [activeButton, setActiveButton] = useState('');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearch?.(query);
    };

    return (
        <nav className="flex items-center justify-between bg-white shadow-md px-4 py-1">
            {/* Logo */}
            <div className="flex items-center gap-2">
                <a href="/homepage" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
                    <Image src="/logo.png" alt="App Logo" width={32} height={32} />
                    <span className="text-xl font-bold" style={{ color: '#C87941' }}>{logoText}</span>
                </a>
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 mx-8">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.5 15a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zm7.5 1-3.5-3.5" stroke="#888" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </span>
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={handleSearch}
                    onFocus={e => {
                        if (e.target.value === "") {
                            e.target.placeholder = "";
                        }
                    }}
                    onBlur={e => {
                        if (e.target.value === "") {
                            e.target.placeholder = "Search...";
                        }
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-white bg-opacity-80 text-gray-700 placeholder:text-gray-400 placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#C87941] transition-all"
                />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-4">
                <Button
                    imageSrc="/message.svg"
                    alt="Messages"
                    isActive={activeButton === 'Messages'}
                    onClick={() => setActiveButton('Messages')}
                />
                <Button
                    imageSrc="/notification.svg"
                    alt="Notifications"
                    isActive={activeButton === 'Notifications'}
                    onClick={() => setActiveButton('Notifications')}
                />
                <Button
                    imageSrc="/Cart.svg"
                    alt="Cart"
                    isActive={activeButton === 'Cart'}
                    onClick={() => setActiveButton('Cart')}
                />

                {/* Profile Dropdown */}
                <div className="relative">
                    <Button
                        imageSrc={profileImage}
                        alt="Profile"
                        label={userName}
                        isActive={activeButton === 'Profile'}
                        onClick={() => {
                            setActiveButton('Profile');
                            setIsProfileOpen(!isProfileOpen);
                        }}
                    />
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg">
                            <Button
                                imageSrc="/profile-icon.png"
                                alt="Profile"
                                label="Profile"
                                isActive={activeButton === 'ProfileDropdownProfile'}
                                onClick={() => setActiveButton('ProfileDropdownProfile')}
                            />
                            <Button
                                imageSrc="/settings-icon.png"
                                alt="Settings"
                                label="Settings"
                                isActive={activeButton === 'ProfileDropdownSettings'}
                                onClick={() => setActiveButton('ProfileDropdownSettings')}
                            />
                            <Button
                                imageSrc="/logout-icon.png"
                                alt="Logout"
                                label="Logout"
                                isActive={activeButton === 'ProfileDropdownLogout'}
                                onClick={() => setActiveButton('ProfileDropdownLogout')}
                            />
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};