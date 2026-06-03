"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { updateProfile } from '@/app/profile/actions'; 
import Cropper, { Area, Point } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

// --- Utility Function to physically crop the image via HTML Canvas ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('No 2d context');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) resolve(file);
      else reject(new Error('Canvas is empty'));
    }, 'image/jpeg');
  });
}
// --------------------------------------------------------------------

export default function EditProfilePage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState('');

  // Image Cropping States
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); 
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null); 
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null); 

  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const supabase = createClient();
  const router = useRouter(); // Initialize the router

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('name, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (userData) {
        if (userData.name) setName(userData.name);
        if (userData.avatar_url) setAvatarUrl(userData.avatar_url);
      }

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

  // 1. User selects a file from their computer
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setRawImageSrc(reader.result?.toString() || null);
        setIsCropping(true); 
      });
      reader.readAsDataURL(file);
    }
  };

  // 2. User drags and zooms
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // 3. User clicks "Confirm Crop"
  const handleCropSave = async () => {
    try {
      if (rawImageSrc && croppedAreaPixels) {
        const croppedBlob = await getCroppedImg(rawImageSrc, croppedAreaPixels);
        const croppedUrl = URL.createObjectURL(croppedBlob);
        
        setAvatarUrl(croppedUrl); 
        setCroppedImageBlob(croppedBlob); 
        setIsCropping(false); 
      }
    } catch (e) {
      console.error(e);
      alert('Failed to crop image.');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    
    if (croppedImageBlob) {
      formData.set('avatar_image', croppedImageBlob, 'profile_pic.jpg');
    }
    
    try {
      await updateProfile(formData); 
      router.push('/profile'); // Smoothly route back to the profile on success!
    } catch (error: any) {
      console.error(error);
      alert(`Failed to update profile: ${error.message}`); 
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FCFAF8] text-[#1C4A5C] font-bold">Loading your profile...</div>;
  }

  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full flex items-center justify-center p-6 font-sans text-slate-800 relative">
      
      {/* CROPPER MODAL */}
      {isCropping && rawImageSrc && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg h-[60vh] bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <Cropper
              image={rawImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          
          <div className="w-full max-w-lg mt-6 bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/10">
            <label className="text-white text-sm font-bold mb-3 block">Zoom</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#C87941] mb-6"
            />
            <div className="flex gap-4">
              <button 
                onClick={() => setIsCropping(false)}
                type="button"
                className="flex-1 py-3 rounded-full text-white font-bold bg-white/10 hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCropSave}
                type="button"
                className="flex-1 py-3 rounded-full text-white font-bold bg-[#C87941] hover:bg-[#a86536] transition-colors"
              >
                Confirm Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN EDIT FORM */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#1C4A5C] p-6 text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Edit Profile</h1>
            <p className="text-sm text-blue-50/80 font-medium mt-1">Set up your details so Baybayanon clients can find you.</p>
          </div>
          <Link href="/profile" className="text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* Avatar Upload Section */}
          <div className="flex items-center gap-6 pb-4 border-b border-gray-100">
            <div className="w-20 h-20 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0 relative flex items-center justify-center">
              {avatarUrl ? (
                <Image 
                  src={avatarUrl} 
                  alt="Profile Preview" 
                  width={80} 
                  height={80} 
                  className="object-cover w-full h-full" 
                />
              ) : (
                <span className="text-gray-400 font-bold text-2xl uppercase">
                  {name.charAt(0) || '?'}
                </span>
              )}
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">Profile Picture</label>
              <input 
                type="file" 
                name="avatar_image" 
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-bold
                  file:bg-[#1C4A5C]/10 file:text-[#1C4A5C]
                  hover:file:bg-[#1C4A5C]/20 transition-colors cursor-pointer"
              />
              <p className="text-xs text-gray-400 mt-2 font-medium">Click to select and crop a new image.</p>
            </div>
          </div>

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