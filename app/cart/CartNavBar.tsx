"use client";

import { useRouter } from 'next/navigation';
import { NavBar } from '@/app/src/components/NavBar';

interface CartNavBarProps {
  displayName: string;
  avatarUrl: string | null;
  isArtist: boolean;
}

export default function CartNavBar({ displayName, avatarUrl, isArtist }: CartNavBarProps) {
  const router = useRouter();

  // Route back to the homepage and open the designated tab cleanly via search params
  const handleNavigation = (tabIndex: number) => {
    router.push(`/homepage?tab=${tabIndex}`); 
  };

  return (
    <NavBar 
      logoText="GamâLokal" 
      userName={displayName} 
      profileImage={avatarUrl || '/user-default.svg'} 
      isArtist={isArtist}
      activeTab={-1} // Keeps tabs unhighlighted since we are inside the standalone cart route
      setActiveTab={handleNavigation}
    />
  );
}