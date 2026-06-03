"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { removeFromCart, updateCartQuantity, processCheckout } from "@/app/actions";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";

interface CartItem {
    cart_item_id: number;
    quantity: number;
    artwork_id: number;
    artworks: {
        artwork_id: number;
        title: string;
        price: number;
        file_url: string;
    };
    artist_name: string;
}

interface CartListProps {
    initialItems: CartItem[];
}

export default function CartList({ initialItems }: CartListProps) {
    const [items, setItems] = useState<CartItem[]>(initialItems);
    const [isUpdating, setIsUpdating] = useState<number | null>(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const handleUpdateQuantity = async (cartItemId: number, newQuantity: number) => {
        if (newQuantity < 1) return;
        
        setIsUpdating(cartItemId);
        try {
            await updateCartQuantity(cartItemId, newQuantity);
            setItems(items.map(item => 
                item.cart_item_id === cartItemId ? { ...item, quantity: newQuantity } : item
            ));
        } catch (error) {
            console.error("Failed to update quantity:", error);
        } finally {
            setIsUpdating(null);
        }
    };

    const handleRemove = async (cartItemId: number) => {
        setIsUpdating(cartItemId);
        try {
            await removeFromCart(cartItemId);
            setItems(items.filter(item => item.cart_item_id !== cartItemId));
        } catch (error) {
            console.error("Failed to remove item:", error);
        } finally {
            setIsUpdating(null);
        }
    };

    const handleCheckout = async () => {
        setIsCheckingOut(true);
        try {
            await processCheckout('Mock GCash');
        } catch (error: any) {
            console.error("Checkout failed:", error);
            window.alert(error.message || "An error occurred during checkout. Please try again.");
            setIsCheckingOut(false);
        }
    };

    const subtotal = items.reduce((total, item) => total + (Number(item.artworks.price || 0) * item.quantity), 0);
    const shipping = 0; // For now
    const total = subtotal + shipping;

    if (items.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-orange-50 px-4">
                <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="text-[#C87941]" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">Looks like you haven&apos;t added any masterpieces to your cart yet. Explore our marketplace to find something you love!</p>
                <Link href="/homepage">
                    <button className="bg-[#1C4A5C] text-white px-8 py-3 rounded-full font-bold hover:bg-[#153a49] transition-all shadow-md active:scale-95">
                        Continue Shopping
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Items List */}
            <div className="flex-1 space-y-4">
                {items.map((item) => {
                    if (!item.artworks) return null;
                    
                    return (
                        <div 
                            key={item.cart_item_id} 
                            className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center transition-opacity ${isUpdating === item.cart_item_id ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border border-gray-50 bg-gray-100">
                                <Image 
                                    src={item.artworks.file_url} 
                                    alt={item.artworks.title} 
                                    fill 
                                    className="object-cover"
                                />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 truncate text-lg">{item.artworks.title}</h3>
                                <p className="text-sm text-gray-500 mb-2">by <span className="text-[#1C4A5C] font-medium">{item.artist_name}</span></p>
                                <p className="font-bold text-[#C87941] text-lg">₱{(Number(item.artworks.price || 0)).toLocaleString()}</p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                {/* Quantity Adjuster */}
                                <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                    <button 
                                        onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity - 1)}
                                        className="text-gray-400 hover:text-[#1C4A5C] transition-colors disabled:opacity-20"
                                        disabled={item.quantity <= 1 || isUpdating === item.cart_item_id}
                                        aria-label="Decrease quantity"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <span className="font-bold text-gray-800 w-6 text-center">{item.quantity}</span>
                                    <button 
                                        onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity + 1)}
                                        className="text-gray-400 hover:text-[#1C4A5C] transition-colors"
                                        disabled={isUpdating === item.cart_item_id}
                                        aria-label="Increase quantity"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>

                                {/* Remove Button */}
                                <button 
                                    onClick={() => handleRemove(item.cart_item_id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                                    disabled={isUpdating === item.cart_item_id}
                                    title="Remove item"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary Sidebar */}
            <div className="w-full lg:w-[380px]">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-orange-100 sticky top-24">
                    <h2 className="text-xl font-bold text-[#1C4A5C] mb-8 flex items-center gap-2">
                        Order Summary
                    </h2>
                    
                    <div className="space-y-4 mb-10">
                        <div className="flex justify-between text-gray-600 font-medium">
                            <span>Subtotal ({items.length} items)</span>
                            <span>₱{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 font-medium">
                            <span>Shipping</span>
                            <span className="text-green-600 font-semibold">Free</span>
                        </div>
                        <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-900">Total</span>
                            <span className="text-3xl font-black text-[#C87941]">₱{total.toLocaleString()}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleCheckout}
                        disabled={isCheckingOut}
                        className="w-full bg-[#f2a83b] text-slate-900 py-4 rounded-2xl font-black text-lg hover:bg-[#e09b36] hover:scale-[1.02] transition-all shadow-md active:scale-95 mb-4 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {isCheckingOut ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Proceed to Checkout
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                    
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
                        <p className="text-[11px] text-[#1C4A5C] leading-relaxed">
                            <span className="font-bold">Secure Checkout:</span> Your transaction is protected by GamâLokal's artist protection guarantee.
                        </p>
                    </div>

                    <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
                        GamâLokal &bull; Support Local Art
                    </p>
                </div>
            </div>
        </div>
    );
}
