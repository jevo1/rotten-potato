'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useOptimistic } from 'react'
import { followUser, unfollowUser } from '@/app/profile/actions'

interface ProfileHeaderProps {
  profile: {
    user_id: string;
    name: string;
    avatar_url: string | null;
    role: string;
    created_at: string;
  }
  artistDetails: {
    specialty: string | null;
    location: string | null;
    price_range: string | null;
    bio: string | null;
    cover_url: string | null;
    social_links: {
      instagram?: string;
      facebook?: string;
      website?: string;
    } | null;
  } | null
  isOwner: boolean
  isFollowingInitial: boolean
  followerCount: number
}

export default function ProfileHeader({ 
  profile, 
  artistDetails, 
  isOwner, 
  isFollowingInitial,
  followerCount 
}: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(isFollowingInitial)
  const [optimisticFollowing, addOptimisticFollowing] = useOptimistic(
    isFollowing,
    (state, newState: boolean) => newState
  )

  const handleFollowToggle = async () => {
    const nextState = !optimisticFollowing
    addOptimisticFollowing(nextState)
    
    try {
      if (nextState) {
        await followUser(profile.user_id)
      } else {
        await unfollowUser(profile.user_id)
      }
      setIsFollowing(nextState)
    } catch (error) {
      console.error('Follow toggle failed:', error)
    }
  }

  const socialLinks = artistDetails?.social_links || {}
  const hasSocials = socialLinks.instagram || socialLinks.facebook || socialLinks.website

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-8 relative">
      {/* Cover Photo */}
      <div className="h-48 md:h-64 w-full relative bg-[#1C4A5C]">
        {artistDetails?.cover_url ? (
          <Image 
            src={artistDetails.cover_url} 
            alt="Cover" 
            fill 
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full opacity-20" style={{ background: 'repeating-linear-gradient(45deg, #3A6A7C, #3A6A7C 10px, #1C4A5C 10px, #1C4A5C 20px)' }}></div>
        )}
      </div>
      
      <div className="px-8 pb-8 relative">
        <div className="relative -mt-16 mb-4 flex justify-between items-end">
          {/* Avatar Container */}
          <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-lg shrink-0 z-10">
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-full overflow-hidden relative flex items-center justify-center border-2 border-white">
              {profile.avatar_url ? (
                <Image 
                  src={profile.avatar_url} 
                  alt={profile.name} 
                  fill
                  className="object-cover" 
                />
              ) : (
                <span className="text-gray-400 font-black text-4xl uppercase">
                  {profile.name?.charAt(0)}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 mb-2">
            {isOwner ? (
              <Link href="/profile/edit" className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-full transition-all border border-gray-200 shadow-sm">
                Edit Profile
              </Link>
            ) : (
              <>
                <button className="p-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-full border border-gray-200 shadow-sm transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </button>
                <button 
                  onClick={handleFollowToggle}
                  className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all shadow-md ${
                    optimisticFollowing 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      : 'bg-[#C87941] text-white hover:bg-[#a86536]'
                  }`}
                >
                  {optimisticFollowing ? 'Following' : 'Follow'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                {profile.name}
                {profile.role === 'artist' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#C87941" stroke="white" strokeWidth="2" className="drop-shadow-sm">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                )}
              </h1>
              {artistDetails?.specialty && (
                <p className="text-[#C87941] font-bold text-lg">{artistDetails.specialty}</p>
              )}
            </div>

            {artistDetails?.bio && (
              <p className="text-gray-600 leading-relaxed max-w-2xl whitespace-pre-line">
                {artistDetails.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-900 font-bold">{followerCount}</span> Followers
              </div>
              {artistDetails?.location && (
                <div className="flex items-center gap-1.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {artistDetails.location}
                </div>
              )}
              {artistDetails?.price_range && (
                <div className="flex items-center gap-1.5 text-[#C87941]">
                  <span className="font-bold">{artistDetails.price_range.split(' ')[0]}</span>
                  {artistDetails.price_range.split('-')[1]}
                </div>
              )}
            </div>
          </div>

          {/* Social Links Column */}
          <div className="flex flex-col md:items-end justify-center gap-4">
            {hasSocials && (
              <div className="flex gap-3">
                {socialLinks.instagram && (
                  <a href={`https://instagram.com/${socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  </a>
                )}
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook.startsWith('http') ? socialLinks.facebook : `https://facebook.com/${socialLinks.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  </a>
                )}
                {socialLinks.website && (
                  <a href={socialLinks.website.startsWith('http') ? socialLinks.website : `https://${socialLinks.website}`} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  </a>
                )}
              </div>
            )}
            <p className="text-gray-400 text-xs font-medium">Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  )
}