"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation'; // <-- 1. Import search params
import { NavBar } from '../src/components/NavBar';
import { createClient } from '@/utils/supabase/client';
import Browse from './BrowsePage';
import Commissions from './CommissionsPage';
import Messages from './MessagesPage';
import Home from './HomePage';

export default function Homepage() {
  const searchParams = useSearchParams(); // <-- 2. Initialize it
  const tabQuery = searchParams.get('tab'); // <-- 3. Grab the 'tab' number from the URL
  
  const [userName, setUserName] = useState('A');
  const [profileImage, setProfileImage] = useState('/user-default.svg');
  
  // 4. If there is a tab in the URL, use it! Otherwise, default to 0.
  const [activeTab, setActiveTab] = useState(tabQuery ? parseInt(tabQuery) : 0);

  // 5. Keep it synced in case the URL changes while they are already on the page
  useEffect(() => {
    if (tabQuery) {
      setActiveTab(parseInt(tabQuery));
    }
  }, [tabQuery]);

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