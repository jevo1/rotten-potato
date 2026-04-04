"use client";
import { useEffect, useState } from 'react';
import { NavBar } from '../src/components/NavBar';
import { createClient } from '@/utils/supabase/client';
import PageTab from '../src/components/PageTab';
import Browse from './BrowsePage';
import Commissions from './CommissionsPage';
import Messages from './MessagesPage';
import Home from './HomePage';

export default function Homepage() {
  const [userName, setUserName] = useState('A');
  const [profileImage, setProfileImage] = useState('/user-default.svg');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.warn("Supabase Auth:", error.message);
          return;
        }

        if (user) {
          if (user.user_metadata && user.user_metadata.name) {
            setUserName(user.user_metadata.name.split(' ')[0]);
          } else if (user.email) {
            setUserName(user.email.split('@')[0]);
          }
          if (user.user_metadata && user.user_metadata.avatar_url) {
            setProfileImage(user.user_metadata.avatar_url);
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
      
      <div className="sticky top-0 z-50 flex flex-col w-full">
        <NavBar logoText="GamâLokal" userName={userName} profileImage={profileImage} />
        <PageTab activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      
      <div className="flex-1">
        {activeTab === 0 && <Home />}
        {activeTab === 1 && <Browse />}
        {activeTab === 2 && <Commissions />}
        {activeTab === 3 && <Messages />}
      </div>
      
    </div>
  );
}