"use client";
import Image from 'next/image'
import { useEffect, useState } from 'react';
import { NavBar } from '../src/components/NavBar';
import { createClient } from '@/utils/supabase/client';

export default function Homepage() {
  const [userName, setUserName] = useState('A');

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata && user.user_metadata.name) {
        // Extract first name only
        const firstName = user.user_metadata.name.split(' ')[0];
        setUserName(firstName);
      } else if (user && user.email) {
        setUserName(user.email.split('@')[0]);
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
      <NavBar logoText="GamâLokal" userName={userName} />
    </div>
  );
}
