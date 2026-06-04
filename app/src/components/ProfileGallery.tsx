'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProfileGalleryProps {
  artworks: {
    artwork_id: string;
    title: string;
    description: string | null;
    file_url: string;
    price: number;
    created_at: string;
  }[]
  posts: {
    post_id: string;
    content: string | null;
    image_url: string;
    created_at: string;
  }[]
}

export default function ProfileGallery({ artworks, posts }: ProfileGalleryProps) {
  const [filter, setFilter] = useState<'all' | 'artworks' | 'posts'>('all')

  const combined = [
    ...artworks.map(a => ({ ...a, type: 'artwork' as const })),
    ...posts.map(p => ({ ...p, type: 'post' as const }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const filteredItems = combined.filter(item => {
    if (filter === 'all') return true
    if (filter === 'artworks') return item.type === 'artwork'
    if (filter === 'posts') return item.type === 'post'
    return true
  })

  return (
    <div className="space-y-8">
      {/* Filter Tabs */}
      <div className="flex gap-8 border-b border-gray-100">
        <button 
          onClick={() => setFilter('all')}
          className={`pb-4 text-sm font-bold transition-all border-b-2 ${
            filter === 'all' ? 'border-[#1C4A5C] text-[#1C4A5C]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          All Activity
        </button>
        <button 
          onClick={() => setFilter('artworks')}
          className={`pb-4 text-sm font-bold transition-all border-b-2 ${
            filter === 'artworks' ? 'border-[#1C4A5C] text-[#1C4A5C]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Artworks
        </button>
        <button 
          onClick={() => setFilter('posts')}
          className={`pb-4 text-sm font-bold transition-all border-b-2 ${
            filter === 'posts' ? 'border-[#1C4A5C] text-[#1C4A5C]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Social Posts
        </button>
      </div>

      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div 
              key={`${item.type}-${'artwork_id' in item ? item.artwork_id : item.post_id}`}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className="aspect-square relative overflow-hidden bg-gray-50">
                <Image 
                  src={'file_url' in item ? item.file_url : item.image_url} 
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
                  <button className="bg-white text-[#1C4A5C] px-5 py-2 rounded-full font-bold text-sm shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all">
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
    </div>
  )
}