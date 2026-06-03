"use client";

import { useRouter } from 'next/navigation';
import { NavBar } from '@/app/src/components/NavBar';

interface DashboardNavBarProps {
  displayName: string;
  avatarUrl: string | null;
}

export default function DashboardNavBar({ displayName, avatarUrl }: DashboardNavBarProps) {
  const router = useRouter();

  // Route back to the home tabs smoothly using your search query params
  const handleNavigation = (tabIndex: number) => {
    router.push(`/homepage?tab=${tabIndex}`); 
  };

  return (
    <NavBar 
      logoText="GamâLokal" 
      userName={displayName.split(' ')[0] || 'User'} 
      profileImage={avatarUrl || '/user-default.svg'} 
      isArtist={true} // Since they are on the dashboard, they are a verified artist
      activeTab={-1}  // Keeps dashboard view independent of home tabs
      setActiveTab={handleNavigation}
    />
  );
}