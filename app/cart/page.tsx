import React from "react";
import { getCartItems } from "@/app/actions";
import { NavBar } from "@/app/src/components/NavBar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import CartList from "./CartList";
import { redirect } from "next/navigation";

export default async function CartPage() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Fetch user to check if logged in and for NavBar data
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        redirect("/login?next=/cart");
    }

    const cartItems = await getCartItems();

    // Extract user info for NavBar
    let userName = 'User';
    let profileImage = '/user-default.svg';
    if (user) {
        if (user.user_metadata && user.user_metadata.name) {
            userName = user.user_metadata.name.split(' ')[0];
        } else if (user.email) {
            userName = user.email.split('@')[0];
        }
        if (user.user_metadata && user.user_metadata.avatar_url) {
            profileImage = user.user_metadata.avatar_url;
        }
    }

    // Check if user is artist for NavBar
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('user_id', user.id)
        .single();
    
    const isArtist = userData?.role === 'artist';

    return (
        <div className="bg-[#FCFAF8] min-h-screen flex flex-col">
            <NavBar 
                logoText="GamâLokal" 
                userName={userName} 
                profileImage={profileImage} 
                isArtist={isArtist}
            />
            
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-[#1C4A5C] tracking-tight mb-2">Shopping Cart</h1>
                    <p className="text-gray-500 font-medium">Review your selected masterpieces before checkout</p>
                </div>

                <CartList initialItems={cartItems} />
            </main>

            {/* Footer space for mobile nav */}
            <div className="h-20 lg:hidden"></div>
        </div>
    );
}
