import React from "react";
import { getCartItems } from "@/app/actions";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import CartList from "./CartList";
import CartNavBar from "./CartNavBar"; // Swapped to our new client wrapper
import { redirect } from "next/navigation";

export default async function CartPage() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Authenticate user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect("/login?next=/cart");
    }

    const cartItems = await getCartItems();

    // Pull ALL fresh records from the public database table in a single request
    const { data: profile } = await supabase
        .from('users')
        .select('name, avatar_url, role')
        .eq('user_id', user.id)
        .single();
    
    // Set explicit database fallbacks
    const displayName = profile?.name || user.email?.split('@')[0] || 'User';
    const avatarUrl = profile?.avatar_url || null;
    const isArtist = profile?.role === 'artist';

    return (
        <div className="bg-[#FCFAF8] min-h-screen flex flex-col">
            {/* Nav containing router integration and synchronized profile caching */}
            <CartNavBar 
                userId={user.id}
                displayName={displayName} 
                avatarUrl={avatarUrl} 
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