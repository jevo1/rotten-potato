"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { updateArtistProfile } from '@/app/actions';

export default function EditProfilePage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState('');

  const supabase = createClient();

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('user_id', user.id)
        .single();
        
      if (userData?.name) setName(userData.name);

      const { data: profileData } = await supabase
        .from('artist_profiles')
        .select('specialty, location, price_range')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setSpecialty(profileData.specialty || '');
        setLocation(profileData.location || '');
        setPriceRange(profileData.price_range || '');
      }
      
      setLoading(false);
    };

    fetchProfileData();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      await updateArtistProfile(formData);
    } catch (error) {
      console.error(error);
      alert("Failed to update profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FCFAF8] text-[#1C4A5C] font-bold">Loading your profile...</div>;
  }

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full flex items-center justify-center p-6 font-sans text-slate-800">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#1C4A5C] p-6 text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Edit Artist Profile</h1>
            <p className="text-sm text-blue-50/80 font-medium mt-1">Set up your portfolio so Baybayanon clients can find you.</p>
          </div>
          <Link href="/homepage" className="text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </Link>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Display Name *</label>
            <input 
              type="text" 
              name="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
              placeholder="e.g. Maria Santos"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Specialty</label>
            <input 
              type="text" 
              name="specialty" 
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Oil Painting, Pottery, Weaving"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Location (Barangay)</label>
              <input 
                type="text" 
                name="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)} 
                placeholder="e.g. Brgy. Guadalupe"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Price Range</label>
              <select 
                name="price_range" 
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all bg-white"
              >
                <option value="" disabled>Select a range</option>
                <option value="₱ - Budget Friendly (Under ₱500)">₱ - Budget Friendly (Under ₱500)</option>
                <option value="₱₱ - Mid Range (₱500 - ₱2,000)">₱₱ - Mid Range (₱500 - ₱2,000)</option>
                <option value="₱₱₱ - Premium (₱2,000+)">₱₱₱ - Premium (₱2,000+)</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#C87941] text-white font-bold py-3.5 rounded-full hover:bg-[#a86536] hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving Profile...' : 'Save Profile'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}