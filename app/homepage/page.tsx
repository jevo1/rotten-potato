"use client";
import Image from 'next/image'
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
  const tabLabels = ['Home', 'Browse', 'Commissions', 'Messages'];

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
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
    };
    fetchUser();
  }, []);

  return (
    <div style={{ background: '#C87941', minHeight: '100vh', width: '100%' }}>
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#1C4A5C',
        height: '25px',
      }}>
        <Image src="/map-pin.svg" alt="Map Pin" width={22} height={22} />
        <span style={{
          color: '#fff',
          fontSize: '.8rem',
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          textAlign: 'center',
          marginLeft: '3px',
        }}>
          Proudly serving Baybay City, Leyte, Philippines
        </span>
      </div>
      <NavBar logoText="GamâLokal" userName={userName} profileImage={profileImage} />
	  <PageTab activeTab={activeTab} setActiveTab={setActiveTab} tabLabels={tabLabels} />
      <div>
        {activeTab === 0 && <Home />}
        {activeTab === 1 && <Browse />}
        {activeTab === 2 && <Commissions />}
        {activeTab === 3 && <Messages />}
      </div>
    </div>
  );
}
