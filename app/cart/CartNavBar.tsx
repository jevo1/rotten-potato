"use client";

import { useRouter } from 'next/navigation';
import { NavBar } from '@/app/src/components/NavBar';

interface CartNavBarProps {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  isArtist: boolean;
}

export default function CartNavBar({ userId, displayName, avatarUrl, isArtist }: CartNavBarProps) {
  const router = useRouter();

  const handleNavigation = (tabIndex: number) => {
    router.push(`/homepage?tab=${tabIndex}`); 
  };

  return (
    <NavBar 
      userId={userId}
      logoText="GamâLokal" 
      userName={displayName} 
      profileImage={avatarUrl || '/user-default.svg'} 
      isArtist={isArtist}
      activeTab={-1} 
      setActiveTab={handleNavigation}
    />
  );
}