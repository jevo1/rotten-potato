"use client";
import { useEffect, useState, Suspense } from 'react'; // Added Suspense
import { useSearchParams } from 'next/navigation'; 
import { NavBar } from '../src/components/NavBar';
import { createClient } from '@/utils/supabase/client';
import Browse from './BrowsePage';
import Commissions from './CommissionsPage';
import Messages from './MessagesPage';
import Home from './HomePage';

// 1. Move all the layout and tab logic to an inner content component
function HomepageContent() {
  const searchParams = useSearchParams(); 
  const tabQuery = searchParams.get('tab'); 
  
  const [userName, setUserName] = useState('A');
  const [profileImage, setProfileImage] = useState('/user-default.svg');
  const [isArtist, setIsArtist] = useState(false);
  
  // Initialize from search params
  const [activeTab, setActiveTab] = useState(tabQuery ? parseInt(tabQuery) : 0);
  
  // Track previous search param to sync state if it changes externally (e.g., back button)
  const [prevTabQuery, setPrevTabQuery] = useState(tabQuery);

  if (tabQuery !== prevTabQuery) {
    setPrevTabQuery(tabQuery);
    if (tabQuery) {
      setActiveTab(parseInt(tabQuery));
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) return;

        if (user) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('name, avatar_url, role')
            .eq('user_id', user.id)
            .single();

          if (userProfile) {
            if (userProfile.name) {
              setUserName(userProfile.name.split(' ')[0]);
            } else if (user.email) {
              setUserName(user.email.split('@')[0]);
            }
            if (userProfile.avatar_url) {
              setProfileImage(userProfile.avatar_url);
            }
            setIsArtist(userProfile.role === 'artist');
          }
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    
    fetchUser();
  }, []);

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full flex flex-col">
      <NavBar 
        logoText="GamâLokal" 
        userName={userName} 
        profileImage={profileImage} 
        isArtist={isArtist}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <div className="flex-1 pb-20 lg:pb-0">
        {activeTab === 0 && <Home />}
        {activeTab === 1 && <Browse />}
        {activeTab === 2 && <Commissions />}
        {activeTab === 3 && <Messages />}
      </div>
    </div>
  );
}

// 2. Export the main component wrapped cleanly in a Suspense boundary
export default function Homepage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FCFAF8] text-[#1C4A5C] font-bold">
        Loading GamâLokal...
      </div>
    }>
      <HomepageContent />
    </Suspense>
  );
}