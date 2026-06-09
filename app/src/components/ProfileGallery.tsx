'use client'

import { useState } from 'react'
import Image from 'next/image'
import ArtworkDetailModal from './ArtworkDetailModal'
import PostDetailModal from './PostDetailModal'

interface ProfileGalleryProps {
  artworks: {
    artwork_id: string;
    title: string;
    description: string | null;
    file_url: string;
    price: number;
    created_at: string;
    category?: string;
  }[]
  posts: {
    post_id: string;
    content: string | null;
    image_url: string;
    created_at: string;
    user_id: string;
  }[]
  reviews: {
    review_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    users: {
      name: string;
      avatar_url: string | null;
    } | null;
  }[]
  profileName: string;
  profileAvatar: string | null;
}

export default function ProfileGallery({ artworks, posts, reviews, profileName, profileAvatar }: ProfileGalleryProps) {
  const [filter, setFilter] = useState<'all' | 'artworks' | 'posts' | 'reviews'>('all')
  const [selectedArtwork, setSelectedArtwork] = useState<any>(null)
  const [selectedPost, setSelectedPost] = useState<any>(null)

  const combined = [
    ...artworks
      .filter(a => a.artwork_id)
      .map(a => ({ ...a, type: 'artwork' as const })),
    ...posts
      .filter(p => p.post_id)
      .map(p => ({ ...p, type: 'post' as const }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const filteredItems = combined.filter(item => {
    if (filter === 'all') return true
    if (filter === 'artworks') return item.type === 'artwork'
    if (filter === 'posts') return item.type === 'post'
    return true
  })

  const handleViewDetails = (item: any) => {
    if (item.type === 'artwork') {
      setSelectedArtwork(item)
    } else {
      setSelectedPost(item)
    }
  }

  return (
    <div className="space-y-8">
      {/* Filter Tabs */}
      <div className="flex gap-8 border-b border-gray-100 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setFilter('all')}
          className={`pb-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            filter === 'all' ? 'border-[#1C4A5C] text-[#1C4A5C]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          All Activity
        </button>
        <button 
          onClick={() => setFilter('artworks')}
          className={`pb-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            filter === 'artworks' ? 'border-[#1C4A5C] text-[#1C4A5C]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Artworks
        </button>
        <button 
          onClick={() => setFilter('posts')}
          className={`pb-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            filter === 'posts' ? 'border-[#1C4A5C] text-[#1C4A5C]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Social Posts
        </button>
        <button 
          onClick={() => setFilter('reviews')}
          className={`pb-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
            filter === 'reviews' ? 'border-[#1C4A5C] text-[#1C4A5C]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Reviews ({reviews.length})
        </button>
      </div>

      {/* Content */}
      {filter === 'reviews' ? (
        <div className="space-y-6">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.review_id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden shrink-0 relative border border-gray-100">
                  {review.users?.avatar_url ? (
                    <Image src={review.users.avatar_url} alt={review.users.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-sm">
                      {review.users?.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="font-bold text-gray-900">{review.users?.name || 'Anonymous Client'}</h5>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 text-[#f2a83b] mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < review.rating ? "currentColor" : "none"} stroke={i < review.rating ? "none" : "currentColor"} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {review.comment || 'No comment provided.'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <h3 className="font-bold text-gray-900">No reviews yet</h3>
              <p className="text-sm text-gray-500 mt-1">This artist hasn&apos;t received any reviews from clients yet.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item, index) => (
                <div 
                  key={`${item.type}-${('artwork_id' in item ? item.artwork_id : item.post_id) || index}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  <div className="aspect-square relative overflow-hidden bg-gray-50">
                    <Image 
                      src={('file_url' in item ? item.file_url : item.image_url) || '/background.png'} 
                      alt={'title' in item ? item.title : 'Post Image'} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.type === 'artwork' && 'price' in item && (
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                        <span className="text-[#C87941] font-bold text-sm">₱{item.price}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => handleViewDetails(item)}
                        className="bg-white text-[#1C4A5C] px-5 py-2 rounded-full font-bold text-sm shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        item.type === 'artwork' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {item.type}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 line-clamp-1 group-hover:text-[#1C4A5C] transition-colors">
                      {'title' in item ? item.title : item.content?.split('\n')[0] || 'Untitled Post'}
                    </h4>
                    {('description' in item && item.description) || ('content' in item && item.content) ? (
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {'description' in item ? item.description : item.content}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <h3 className="font-bold text-gray-900">Nothing to show yet</h3>
              <p className="text-sm text-gray-500 mt-1">This artist hasn&apos;t uploaded any {filter === 'all' ? 'content' : filter} yet.</p>
            </div>
          )}
        </>
      )}

      {/* Detail Modals */}
      <ArtworkDetailModal 
        isOpen={!!selectedArtwork} 
        onClose={() => setSelectedArtwork(null)} 
        artwork={selectedArtwork} 
      />
      <PostDetailModal 
        isOpen={!!selectedPost} 
        onClose={() => setSelectedPost(null)} 
        post={selectedPost}
        userName={profileName}
        userAvatar={profileAvatar}
      />
    </div>
  )
}