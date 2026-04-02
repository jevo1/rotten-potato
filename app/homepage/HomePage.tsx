import React from 'react';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="bg-[#FCFAF8] min-h-screen w-full text-slate-800 font-sans pb-20">
      <div className="max-w-7xl mx-auto px-6 pt-8">
        
        {/* --- Categories Section --- */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <button className="flex items-center gap-2 px-5 py-2 rounded-full border border-orange-300 text-orange-700 bg-orange-50/70 hover:bg-orange-100 transition-colors shadow-sm">
            <span className="text-sm">🎨</span> <span className="font-semibold text-sm">Paintings</span>
          </button>
          
          <button className="flex items-center gap-2 px-5 py-2 rounded-full border border-teal-400 text-teal-800 bg-teal-50/70 hover:bg-teal-100 transition-colors shadow-sm">
            <span className="text-sm">🧵</span> <span className="font-semibold text-sm">Weaving</span>
          </button>
          
          <button className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#b88c67] text-[#7a5840] bg-[#fdf8f5] hover:bg-[#f5ebe4] transition-colors shadow-sm">
            <span className="text-sm">🏺</span> <span className="font-semibold text-sm">Pottery</span>
          </button>
          
          <button className="flex items-center gap-2 px-5 py-2 rounded-full border border-stone-400 text-stone-800 bg-stone-100/70 hover:bg-stone-200 transition-colors shadow-sm">
            <span className="text-sm">🪵</span> <span className="font-semibold text-sm">Wood Carving</span>
          </button>
          
          <button className="flex items-center gap-2 px-5 py-2 rounded-full border border-yellow-400 text-yellow-700 bg-yellow-50/70 hover:bg-yellow-100 transition-colors shadow-sm">
            <span className="text-sm">💍</span> <span className="font-semibold text-sm">Jewelry</span>
          </button>
          
          <button className="flex items-center gap-2 px-5 py-2 rounded-full border border-blue-400 text-blue-600 bg-blue-50/70 hover:bg-blue-100 transition-colors shadow-sm">
            <span className="text-sm">💻</span> <span className="font-semibold text-sm">Digital Art</span>
          </button>
          
          <button className="flex items-center gap-2 px-5 py-2 rounded-full border border-purple-400 text-purple-700 bg-purple-50/70 hover:bg-purple-100 transition-colors shadow-sm">
            <span className="text-sm">🪡</span> <span className="font-semibold text-sm">Embroidery</span>
          </button>
          
          <button className="flex items-center gap-2 px-5 py-2 rounded-full border border-green-400 text-green-700 bg-green-50/70 hover:bg-green-100 transition-colors shadow-sm">
            <span className="text-sm">📷</span> <span className="font-semibold text-sm">Photography</span>
          </button>
        </div>

        {/* --- Quick Actions Cards Section --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4 text-xl">🎨</div>
            <h3 className="font-bold text-gray-900 mb-1">Post Artworks</h3>
            <p className="text-xs text-gray-500">Share your creations</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-xl">💬</div>
            <h3 className="font-bold text-gray-900 mb-1">Direct Messaging</h3>
            <p className="text-xs text-gray-500">Talk to artists</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4 text-xl">🛍️</div>
            <h3 className="font-bold text-gray-900 mb-1">Secure Payment</h3>
            <p className="text-xs text-gray-500">Safe transactions</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-4 text-xl">📋</div>
            <h3 className="font-bold text-gray-900 mb-1">Commissions</h3>
            <p className="text-xs text-gray-500">Custom orders</p>
          </div>
        </div>

        {/* --- Featured Artworks Section --- */}
        <div className="mb-16">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1C4A5C]">Featured Artworks</h2>
              <p className="text-sm text-gray-500 mt-1">Handpicked from local Baybayanon artists</p>
            </div>
            <button className="text-[#C87941] text-sm font-semibold hover:underline">View All →</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Artwork Card 1 */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="relative h-48 bg-gray-200">
                 {/* Placeholder for actual image */}
                 <div className="absolute top-3 left-3 bg-[#C87941] text-white text-xs font-bold px-2 py-1 rounded">Painting</div>
                 <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-red-500">♡</button>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900">Sunset Over Baybay Bay</h3>
                <p className="text-sm text-[#3A6A7C] mb-2">by Maria Santos</p>
                <div className="flex items-center gap-1 mb-4 text-sm">
                  <span className="text-yellow-400">★</span> <span className="font-bold text-gray-700">4.9</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-lg text-[#C87941]">₱2,500</span>
                  <button className="bg-[#1C4A5C] hover:bg-[#2a6279] text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors">Add to Cart</button>
                </div>
              </div>
            </div>

            {/* Artwork Card 2 */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="relative h-48 bg-gray-200">
                 <div className="absolute top-3 left-3 bg-[#C87941] text-white text-xs font-bold px-2 py-1 rounded">Weaving</div>
                 <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-red-500">♡</button>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900">Handwoven Pinukpok Basket</h3>
                <p className="text-sm text-[#3A6A7C] mb-2">by Lola Nena Craft</p>
                <div className="flex items-center gap-1 mb-4 text-sm">
                  <span className="text-yellow-400">★</span> <span className="font-bold text-gray-700">4.7</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-lg text-[#C87941]">₱850</span>
                  <button className="bg-[#1C4A5C] hover:bg-[#2a6279] text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors">Add to Cart</button>
                </div>
              </div>
            </div>

            {/* Artwork Card 3 */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="relative h-48 bg-gray-200">
                 <div className="absolute top-3 left-3 bg-[#C87941] text-white text-xs font-bold px-2 py-1 rounded">Pottery</div>
                 <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-red-500">♡</button>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-900">Celadon Sea Pottery Set</h3>
                <p className="text-sm text-[#3A6A7C] mb-2">by Jun dela Cruz</p>
                <div className="flex items-center gap-1 mb-4 text-sm">
                  <span className="text-yellow-400">★</span> <span className="font-bold text-gray-700">5.0</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-lg text-[#C87941]">₱1,800</span>
                  <button className="bg-[#1C4A5C] hover:bg-[#2a6279] text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors">Add to Cart</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- Bottom Layout: Feed & Sidebar --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Feed Column */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-[#1C4A5C] mb-6">Community Feed</h2>
            
            {/* Feed Post 1 */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div>
                  <h4 className="font-bold text-sm">Maria Santos</h4>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4">Just finished my latest oil painting inspired by the Baybay coastline 🌊 Available for sale!</p>
              <div className="h-64 bg-gray-200 rounded-xl mb-4 w-full"></div>
              <div className="flex items-center gap-6 text-sm text-gray-500 border-t pt-3">
                <button className="flex items-center gap-1 hover:text-[#C87941]"><span>♡</span> 42</button>
                <button className="flex items-center gap-1 hover:text-[#C87941]"><span>💬</span> 8</button>
                <button className="flex items-center gap-1 hover:text-[#C87941] ml-auto"><span>➦</span> Share</button>
              </div>
            </div>

            {/* Feed Post 2 */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div>
                  <h4 className="font-bold text-sm">Jun dela Cruz</h4>
                  <p className="text-xs text-gray-500">5 hours ago</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4">New batch of handcrafted pottery is ready! Each piece is unique and made with local clay. Taking orders now 🏺</p>
              <div className="h-48 bg-gray-200 rounded-xl mb-4 w-full"></div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-1">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-bold text-[#1C4A5C]">Top Artists</h2>
              <button className="text-[#C87941] text-sm font-semibold hover:underline">See All</button>
            </div>

            {/* Top Artists List */}
            <div className="space-y-3 mb-8">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div>
                    <h4 className="font-bold text-sm flex items-center gap-1">Maria Santos <span className="text-blue-500 text-xs">✓</span></h4>
                    <p className="text-xs text-gray-500">Oil Painting</p>
                    <p className="text-xs text-yellow-500 font-medium mt-1">★ 4.9 <span className="text-gray-400">· 87 sales</span></p>
                  </div>
                </div>
                <button className="px-4 py-1.5 border border-gray-300 rounded-full text-xs font-semibold hover:bg-gray-50">View</button>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div>
                    <h4 className="font-bold text-sm flex items-center gap-1">Jun dela Cruz <span className="text-blue-500 text-xs">✓</span></h4>
                    <p className="text-xs text-gray-500">Pottery & Ceramics</p>
                    <p className="text-xs text-yellow-500 font-medium mt-1">★ 5.0 <span className="text-gray-400">· 63 sales</span></p>
                  </div>
                </div>
                <button className="px-4 py-1.5 border border-gray-300 rounded-full text-xs font-semibold hover:bg-gray-50">View</button>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div>
                    <h4 className="font-bold text-sm flex items-center gap-1">Lola Nena Craft <span className="text-blue-500 text-xs">✓</span></h4>
                    <p className="text-xs text-gray-500">Traditional Weaving</p>
                    <p className="text-xs text-yellow-500 font-medium mt-1">★ 4.7 <span className="text-gray-400">· 120 sales</span></p>
                  </div>
                </div>
                <button className="px-4 py-1.5 border border-gray-300 rounded-full text-xs font-semibold hover:bg-gray-50">View</button>
              </div>
            </div>

            {/* Commission CTA Card */}
            <div className="bg-[#de8f3c] rounded-2xl p-6 text-white text-center shadow-md">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="font-bold text-lg mb-2">Need Something Custom?</h3>
              <p className="text-sm text-orange-100 mb-6">Post a commission request and let artists come to you!</p>
              <button className="w-full bg-white text-[#C87941] font-bold py-2.5 rounded-full hover:bg-gray-50 transition-colors shadow-sm">
                Post Commission
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}