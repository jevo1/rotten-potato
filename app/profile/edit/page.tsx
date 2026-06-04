"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { updateProfile } from '@/app/profile/actions'; 
import Cropper, { Area, Point } from 'react-easy-crop';

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
  const [isArtist, setIsArtist] = useState(false);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [bio, setBio] = useState('');
  const [socialLinks, setSocialLinks] = useState({ instagram: '', facebook: '', website: '' });

  // Avatar Cropping States
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); 
  const [rawAvatarSrc, setRawAvatarSrc] = useState<string | null>(null); 
  const [croppedAvatarBlob, setCroppedAvatarBlob] = useState<Blob | null>(null); 

  // Cover Cropping States
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [rawCoverSrc, setRawCoverSrc] = useState<string | null>(null);
  const [croppedCoverBlob, setCroppedCoverBlob] = useState<Blob | null>(null);

  const [isCropping, setIsCropping] = useState<'avatar' | 'cover' | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('name, avatar_url, role')
        .eq('user_id', user.id)
        .single();

      if (userData) {
        if (userData.name) setName(userData.name);
        if (userData.avatar_url) setAvatarUrl(userData.avatar_url);
        setIsArtist(userData.role === 'artist');
      }

      if (userData?.role === 'artist') {
        const { data: profileData } = await supabase
          .from('artist_profiles')
          .select('specialty, location, price_range, bio, social_links, cover_url')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setSpecialty(profileData.specialty || '');
          setLocation(profileData.location || '');
          setPriceRange(profileData.price_range || '');
          setBio(profileData.bio || '');
          setCoverUrl(profileData.cover_url || null);
          if (profileData.social_links) {
            setSocialLinks({
              instagram: profileData.social_links.instagram || '',
              facebook: profileData.social_links.facebook || '',
              website: profileData.social_links.website || ''
            });
          }
        }
      }
      setLoading(false);
    };

    fetchProfileData();
  }, [supabase]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setRawAvatarSrc(reader.result?.toString() || null);
        setIsCropping('avatar');
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setRawCoverSrc(reader.result?.toString() || null);
        setIsCropping('cover');
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      if (isCropping === 'avatar' && rawAvatarSrc && croppedAreaPixels) {
        const croppedBlob = await getCroppedImg(rawAvatarSrc, croppedAreaPixels);
        const croppedUrl = URL.createObjectURL(croppedBlob);
        setAvatarUrl(croppedUrl); 
        setCroppedAvatarBlob(croppedBlob); 
        setIsCropping(null); 
      } else if (isCropping === 'cover' && rawCoverSrc && croppedAreaPixels) {
        const croppedBlob = await getCroppedImg(rawCoverSrc, croppedAreaPixels);
        const croppedUrl = URL.createObjectURL(croppedBlob);
        setCoverUrl(croppedUrl);
        setCroppedCoverBlob(croppedBlob);
        setIsCropping(null);
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
    
    if (croppedAvatarBlob) {
      formData.set('avatar_image', croppedAvatarBlob, 'avatar.jpg');
    }
    if (croppedCoverBlob) {
      formData.set('cover_image', croppedCoverBlob, 'cover.jpg');
    }
    
    try {
      await updateProfile(formData); 
      router.push('/profile');
    } catch (error) {
      const err = error as Error;
      console.error(err);
      alert(`Failed to update profile: ${err.message}`); 
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
      {isCropping && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl h-[60vh] bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <Cropper
              image={isCropping === 'avatar' ? rawAvatarSrc! : rawCoverSrc!}
              crop={crop}
              zoom={zoom}
              aspect={isCropping === 'avatar' ? 1 : 16 / 9}
              cropShape={isCropping === 'avatar' ? "round" : "rect"}
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
                onClick={() => setIsCropping(null)}
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
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-12">
        
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

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Images Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Profile Images</h3>
            
            {/* Cover Photo */}
            {isArtist && (
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">Cover Photo</label>
                <div className="relative h-48 w-full rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden group">
                  {coverUrl ? (
                    <Image src={coverUrl} alt="Cover Preview" fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">No cover photo set</div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-[#1C4A5C] px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      Change Cover
                      <input type="file" className="hidden" accept="image/*" onChange={handleCoverChange} />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Avatar Upload */}
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 overflow-hidden shrink-0 relative flex items-center justify-center group">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar Preview" width={96} height={96} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-gray-400 font-bold text-3xl uppercase">{name.charAt(0) || '?'}</span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer p-2 text-white">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Profile Picture</h4>
                <p className="text-xs text-gray-500 mt-1">Recommended: Square image, at least 400x400px.</p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Basic Information</h3>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Display Name *</label>
              <input 
                type="text" name="name" value={name} onChange={(e) => setName(e.target.value)} required 
                placeholder="e.g. Maria Santos"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all"
              />
            </div>

            {isArtist && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Artist Bio</label>
                  <textarea 
                    name="bio" value={bio} onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell your story, your inspirations, and what you do best..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Specialty</label>
                    <input 
                      type="text" name="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="e.g. Oil Painting, Pottery"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Location (Barangay)</label>
                    <input 
                      type="text" name="location" value={location} onChange={(e) => setLocation(e.target.value)} 
                      placeholder="e.g. Brgy. Guadalupe"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Price Range</label>
                  <select 
                    name="price_range" value={priceRange} onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all bg-white"
                  >
                    <option value="" disabled>Select a range</option>
                    <option value="₱ - Budget Friendly (Under ₱500)">₱ - Budget Friendly (Under ₱500)</option>
                    <option value="₱₱ - Mid Range (₱500 - ₱2,000)">₱₱ - Mid Range (₱500 - ₱2,000)</option>
                    <option value="₱₱₱ - Premium (₱2,000+)">₱₱₱ - Premium (₱2,000+)</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Social Links */}
          {isArtist && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Instagram</label>
                  <input 
                    type="text" name="instagram" value={socialLinks.instagram} 
                    onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
                    placeholder="@username"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Facebook</label>
                  <input 
                    type="text" name="facebook" value={socialLinks.facebook} 
                    onChange={(e) => setSocialLinks({...socialLinks, facebook: e.target.value})}
                    placeholder="facebook.com/username"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700">Personal Website / Portfolio</label>
                  <input 
                    type="text" name="website" value={socialLinks.website} 
                    onChange={(e) => setSocialLinks({...socialLinks, website: e.target.value})}
                    placeholder="https://yourportfolio.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C4A5C] focus:ring-2 focus:ring-[#1C4A5C]/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100 flex gap-4">
            <Link href="/profile" className="flex-1 text-center py-3.5 rounded-full border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button 
              type="submit" disabled={isSubmitting}
              className="flex-[2] bg-[#C87941] text-white font-bold py-3.5 rounded-full hover:bg-[#a86536] hover:shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}