'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

// --- AUTHENTICATION ACTIONS ---

export async function signup(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as string 

  // Basic validation
  if (!name || name.trim().length < 2) {
    redirect('/signup?error=Please enter your full name')
  }
  if (!email || !email.includes('@')) {
    redirect('/signup?error=Please enter a valid email address')
  }
  if (!password || password.length < 6) {
    redirect('/signup?error=Password must be at least 6 characters long')
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  })

  if (error) {
    console.error('Signup error:', error.message)
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }
  
  redirect('/login?message=Account created successfully. Please log in.')
}

export async function login(formData: FormData) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error.message)
    redirect('/login?error=Invalid login credentials')
  }

  revalidatePath('/homepage', 'layout')
  redirect('/homepage')
}

export async function signInWithGoogle() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=/homepage`,
    },
  })

  if (error) {
    console.error('Google Auth Error:', error.message)
    redirect('/login?error=Could not authenticate with Google')
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function logout() {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)
  
  await supabase.auth.signOut()
  
  redirect('/login')
}

export async function setAccountRole(role: 'client' | 'artist') {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('user_id', user.id)

  if (error) {
    console.error('Error setting role:', error.message)
    throw new Error('Failed to set account role')
  }

  if (role === 'artist') {
    redirect('/onboarding/artist')
  } else {
    redirect('/homepage')
  }
}

// --- COMMISSION ACTIONS ---

export async function createCommissionRequest(formData: FormData) {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to post a request.");

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const budget = parseFloat(formData.get('budget') as string);
  const deadline = formData.get('deadline') as string;
  const artistId = formData.get('artist_id') as string | null;

  const { error } = await supabase
    .from('commission_requests')
    .insert({
      client_id: user.id,
      artist_id: artistId,
      title: title,              
      description: description,  
      budget: budget,
      deadline: deadline,
      status: artistId ? 'awaiting_offer' : 'open' 
    });

  if (error) {
    console.error('Database error:', error);
    throw new Error(`Failed to create commission request: ${error.message}`);
  }
  revalidatePath('/homepage');
}

export async function submitCommissionOffer(requestId: number, offerAmount: number, message: string, depositPercentage: number = 50) {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to submit an offer.");

  const { data: currentUserData, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleError || currentUserData?.role !== 'artist') {
    throw new Error("Only registered artists can submit offers on job board requests.");
  }

  const { data: requestData, error: fetchError } = await supabase
    .from('commission_requests')
    .select('client_id')
    .eq('request_id', requestId)
    .single();

  if (fetchError || !requestData) throw new Error('Could not find the commission request.');
  
  if (requestData.client_id === user.id) {
    throw new Error("You cannot submit an offer on your own commission request.");
  }

  const { error } = await supabase
    .from('commission_offers')
    .insert({
      request_id: requestId,
      artist_id: user.id,
      offer_amount: offerAmount,
      message: message,
      status: 'pending',
      deposit_percentage: depositPercentage
    });

  if (error) {
    console.error('Database error:', error);
    throw new Error(`Failed to submit offer: ${error.message}`);
  }

  revalidatePath('/homepage'); 
}

export async function updateFulfillmentDetails(requestId: number, method: string, details: any) {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore);
  
  const { error } = await supabase
    .from('commission_requests')
    .update({ 
      fulfillment_method: method,
      fulfillment_details: details
    })
    .eq('request_id', requestId);

  if (error) throw new Error(`Failed to update fulfillment: ${error.message}`);
  revalidatePath(`/commissions/${requestId}`);
}

export async function markCommissionAsReady(requestId: number) {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore);
  
  const { error } = await supabase
    .from('commission_requests')
    .update({ status: 'awaiting_final_payment' })
    .eq('request_id', requestId);

  if (error) throw new Error(`Failed to update status: ${error.message}`);
  revalidatePath(`/commissions/${requestId}`);
}

export async function updateShippingStatus(requestId: number, status: string, tracking?: string) {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore);
  
  const updateData: any = { shipping_status: status };
  if (tracking) updateData.tracking_number = tracking;

  const { error } = await supabase
    .from('commission_requests')
    .update(updateData)
    .eq('request_id', requestId);

  if (error) throw new Error(`Failed to update shipping: ${error.message}`);
  revalidatePath(`/commissions/${requestId}`);
}

export async function acceptCommissionOffer(requestId: number, offerId: number, artistId: string) {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore);
  
  // 1. Fetch offer details to calculate deposit
  const { data: offer, error: offerFetchError } = await supabase
    .from('commission_offers')
    .select('offer_amount, deposit_percentage')
    .eq('offer_id', offerId)
    .single();

  if (offerFetchError || !offer) throw new Error("Could not fetch offer details.");

  const depositAmount = (offer.offer_amount * (offer.deposit_percentage || 50)) / 100;

  // 2. Update the offer status
  const { error: offerError } = await supabase
    .from('commission_offers')
    .update({ status: 'accepted' })
    .eq('offer_id', offerId);

  if (offerError) {
    console.error('Database error:', offerError);
    throw new Error(`Failed to accept the offer: ${offerError.message}`);
  }

  // 3. Update the commission status to awaiting_deposit
  const { error: requestError } = await supabase
    .from('commission_requests')
    .update({ 
      artist_id: artistId,
      status: 'awaiting_deposit' 
    })
    .eq('request_id', requestId);

  if (requestError) {
    console.error('Database error:', requestError);
    throw new Error(`Failed to update the commission status: ${requestError.message}`);
  }

  // 4. Reject other offers
  await supabase
    .from('commission_offers')
    .update({ status: 'rejected' })
    .eq('request_id', requestId)
    .neq('offer_id', offerId);

  // 5. Initiate PayMongo Checkout for the DEPOSIT
  // We'll call the checkout logic here (simplified for this action)
  // In a real scenario, we might redirect from the client after this action returns
  
  revalidatePath('/homepage'); 
}

export async function completeCommissionAndReview(
  requestId: number, 
  artistId: string, 
  rating: number, 
  comment: string
) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { error: reqError } = await supabase
    .from('commission_requests')
    .update({ status: 'completed' })
    .eq('request_id', requestId);

  if (reqError) {
    console.error('Database error:', reqError);
    throw new Error(`Failed to update request status: ${reqError.message}`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error: reviewError } = await supabase
    .from('rating_reviews')
    .insert({
      client_id: user.id,
      artist_id: artistId,
      request_id: requestId,
      rating: rating,
      comment: comment
    });

  if (reviewError) {
    console.error('Database error:', reviewError);
    throw new Error(`Failed to post review: ${reviewError.message}`);
  }

  revalidatePath('/homepage');
}

// --- PORTFOLIO GALLERY ACTIONS ---

export async function postArtwork(formData: FormData) {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to post artwork.");

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const price = parseFloat(formData.get('price') as string);
  const stockQuantity = parseInt(formData.get('stock_quantity') as string) || 1;
  const file = formData.get('image') as File;

  if (!file || file.size === 0) throw new Error("Please upload an image.");

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Math.random()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('artworks')
    .upload(fileName, file);

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw new Error('Failed to upload image.');
  }

  const { data: publicUrlData } = supabase.storage
    .from('artworks')
    .getPublicUrl(fileName);

  const { error: dbError } = await supabase
    .from('artworks')
    .insert({
      user_id: user.id,
      title: title,
      description: description,
      category: category,
      price: price,
      stock_quantity: stockQuantity,
      file_url: publicUrlData.publicUrl,
      status: 'available'
    });

  if (dbError) {
    console.error("Database error:", dbError);
    throw new Error('Failed to save artwork details.');
  }

  revalidatePath('/homepage');
}

export async function getArtworks(options: {
  search?: string;
  category?: string;
  sortBy?: 'popular' | 'price_asc' | 'price_desc' | 'newest';
}) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  let query = supabase
    .from('artworks')
    .select(`
      artwork_id,
      title,
      description,
      price,
      file_url,
      category,
      status,
      stock_quantity,
      users ( name )
    `);

  if (options.category && options.category !== 'All Categories') {
    query = query.eq('category', options.category);
  }

  if (options.search) {
    query = query.ilike('title', `%${options.search}%`);
  }

  if (options.sortBy === 'price_asc') {
    query = query.order('price', { ascending: true });
  } else if (options.sortBy === 'price_desc') {
    query = query.order('price', { ascending: false });
  } else {
    query = query.order('title', { ascending: true });
  }

  const { data, error } = await query;
  if (error) {
    console.error("Supabase error fetching artworks:", error.message);
    throw new Error(`Failed to fetch artworks: ${error.message}`);
  }

  return data?.map(artwork => ({
    ...artwork,
    users: Array.isArray(artwork.users) ? artwork.users[0] : artwork.users
  }));
}

// --- MESSAGING ACTIONS ---

export async function sendMessage(receiverId: string, content: string) {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to send a message.");

  const { error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: content
    });

  if (error) {
    console.error("Database error:", error);
    throw new Error('Failed to send the message.');
  }

  revalidatePath('/homepage');
}

// --- USER & ARTIST PROFILE PROFILES ---

export async function updateArtistProfile(formData: FormData) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to update your profile.");

  const name = formData.get('name') as string;
  const specialty = formData.get('specialty') as string;
  const location = formData.get('location') as string;
  const priceRange = formData.get('price_range') as string;

  if (name) {
    const { error: userError } = await supabase
      .from('users')
      .update({ name: name })
      .eq('user_id', user.id);

    if (userError) {
      console.error("Error updating user:", userError);
      throw new Error('Failed to update name.');
    }
  }

  const { data: existingProfile } = await supabase
    .from('artist_profiles')
    .select('profile_id')
    .eq('user_id', user.id)
    .single();

  if (existingProfile) {
    const { error: profileError } = await supabase
      .from('artist_profiles')
      .update({
        specialty: specialty,
        location: location,
        price_range: priceRange
      })
      .eq('user_id', user.id);

    if (profileError) throw new Error('Failed to update artist profile.');
  } else {
    const { error: insertError } = await supabase
      .from('artist_profiles')
      .insert({
        user_id: user.id,
        specialty: specialty,
        location: location,
        price_range: priceRange
      });

    if (insertError) throw new Error('Failed to create artist profile.');
  }

  revalidatePath('/homepage');
  redirect('/homepage');
}

// --- COMMUNITY FEED ACTIONS ---

export async function createPost(formData: FormData) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to create a post.");

  const content = formData.get('content') as string;
  const artworkId = formData.get('artwork_id') ? parseInt(formData.get('artwork_id') as string) : null;
  const file = formData.get('image') as File;

  let imageUrl = null;

  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('artworks')
      .upload(`posts/${fileName}`, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error('Failed to upload image.');
    }

    const { data: publicUrlData } = supabase.storage
      .from('artworks')
      .getPublicUrl(`posts/${fileName}`);
    
    imageUrl = publicUrlData.publicUrl;
  }

  const { error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      content,
      artwork_id: artworkId,
      image_url: imageUrl
    });

  if (error) {
    console.error("Database error:", error);
    throw new Error('Failed to create post.');
  }

  revalidatePath('/homepage');
}

export async function toggleLike(postId: number) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to like a post.");

  const { data: existingLike } = await supabase
    .from('likes')
    .select('like_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  if (existingLike) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('like_id', existingLike.like_id);
    
    if (error) throw new Error('Failed to unlike post.');
  } else {
    const { error } = await supabase
      .from('likes')
      .insert({
        post_id: postId,
        user_id: user.id
      });
    
    if (error) throw new Error('Failed to like post.');
  }

  revalidatePath('/homepage');
}

export async function addComment(postId: number, content: string, parentId?: number) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("You must be logged in to comment.");

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content: content,
      parent_id: parentId || null
    })
    .select()
    .single();

  if (error) {
    console.error("Database error:", error);
    throw new Error('Failed to add comment.');
  }

  revalidatePath('/homepage');
  return data;
}

export async function deleteComment(commentId: number) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from('comments')
    .delete()
    .eq('parent_id', commentId);

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('comment_id', commentId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Supabase error deleting comment:', error);
    throw new Error(`Failed to delete comment: ${error.message || 'Unknown error'}`);
  }
  
  revalidatePath('/homepage');
}

export async function editPost(postId: number, content: string) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from('posts')
    .update({ content })
    .eq('post_id', postId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Database error:', error);
    throw new Error(`Failed to update post: ${error.message}`);
  }
  
  revalidatePath('/homepage');
}

export async function deletePost(postId: number) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from('comments').delete().eq('post_id', postId);
  await supabase.from('likes').delete().eq('post_id', postId);

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Database error:', error);
    throw new Error(`Failed to delete post: ${error.message}`);
  }
  
  revalidatePath('/homepage');
}

// --- SHOPPING CART ACTIONS ---

export async function addToCart(artworkId: number, quantity: number = 1) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to add to cart.");

  const { data: artwork, error: artworkError } = await supabase
    .from('artworks')
    .select('stock_quantity, user_id')
    .eq('artwork_id', artworkId)
    .single();

  if (artworkError || !artwork) {
    console.error("Error fetching artwork stock:", artworkError);
    throw new Error("Artwork not found.");
  }

  if (artwork.user_id === user.id) {
    throw new Error("You cannot add your own artwork to the cart.");
  }

  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', user.id)
    .eq('artwork_id', artworkId)
    .maybeSingle();

  const currentQuantityInCart = existingItem?.quantity || 0;
  const newQuantity = currentQuantityInCart + quantity;

  if (artwork.stock_quantity < newQuantity) {
    throw new Error(`Cannot add more to cart. Only ${artwork.stock_quantity} available in stock.`);
  }

  const { error } = await supabase
    .from('cart_items')
    .upsert({ 
      user_id: user.id, 
      artwork_id: artworkId, 
      quantity: newQuantity 
    }, { onConflict: 'user_id, artwork_id' });

  if (error) {
    console.error("Cart error:", error);
    throw new Error('Failed to update cart.');
  }

  revalidatePath('/homepage');
}

export async function getCartItems() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      cart_item_id,
      quantity,
      artwork_id,
      artworks (
        artwork_id,
        title,
        price,
        file_url,
        stock_quantity,
        user_id,
        users (
          name
        )
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error("Get cart error:", error);
    throw new Error('Failed to fetch cart items.');
  }

  return data?.map(item => {
    const artwork = Array.isArray(item.artworks) ? item.artworks[0] : item.artworks;
    const artist = Array.isArray(artwork?.users) ? artwork.users[0] : artwork?.users;
    
    return {
      ...item,
      artworks: artwork,
      artist_name: artist?.name || 'Unknown Artist',
      artist_id: artwork?.user_id
    };
  });
}

export async function removeFromCart(cartItemId: number) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_item_id', cartItemId);

  if (error) {
    console.error("Remove from cart error:", error);
    throw new Error('Failed to remove item from cart.');
  }

  revalidatePath('/cart');
}

export async function updateCartQuantity(cartItemId: number, quantity: number) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('cart_item_id', cartItemId);

  if (error) {
    console.error("Update cart quantity error:", error);
    throw new Error('Failed to update quantity.');
  }

  revalidatePath('/cart');
}

// --- SECURE PAYMONGO CHECKOUT WITH TARGETED DELETIONS ---

export async function processCheckout(paymentMethod: string, selectedItemIds?: number[]) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // 1. Verify user authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to checkout.");

  // 2. Fetch current cart items
  let cartItems = await getCartItems();
  
  // Apply targeted checkbox filtering if individual items were checked
  if (selectedItemIds && selectedItemIds.length > 0) {
    cartItems = cartItems.filter(item => selectedItemIds.includes(item.cart_item_id));
  }

  if (!cartItems || cartItems.length === 0) {
    throw new Error("No items selected for checkout.");
  }

  const lineItems = [];
  const paymentInserts = [];

  // 3. Re-verify inventory parameters and prepare row splittings
  for (const item of cartItems) {
    const { data: artwork, error: artworkError } = await supabase
      .from('artworks')
      .select('stock_quantity, price, title, user_id')
      .eq('artwork_id', item.artwork_id)
      .single();

    if (artworkError || !artwork) {
      throw new Error(`Artwork "${item.artworks?.title || 'Unknown'}" not found.`);
    }

    if (artwork.stock_quantity < item.quantity) {
      throw new Error(`Item "${artwork.title}" is out of stock or quantity exceeds availability.`);
    }

    const itemPrice = artwork.price || 0;
    const itemTotalCost = itemPrice * item.quantity;

    // Build the line items for PayMongo (amounts parsed in cents)
    lineItems.push({
      amount: Math.round(itemPrice * 100),
      currency: 'PHP',
      name: artwork.title,
      quantity: item.quantity
    });

    // FIX: Generate an isolated payment tracking row item allocation per separate product
    paymentInserts.push({
      client_id: user.id,
      artist_id: artwork.user_id, // Each row gets its respective unique artist account
      artwork_id: item.artwork_id, // Each row logs its true artwork source link
      amount: itemTotalCost,
      status: 'pending'
    });
  }

  // 4. Batch insert all pending rows simultaneously into your database layout
  const { data: paymentRecords, error: paymentError } = await supabase
    .from('payments')
    .insert(paymentInserts)
    .select();

  if (paymentError || !paymentRecords || paymentRecords.length === 0) {
    console.error("Payment split array registration failure:", paymentError?.message);
    throw new Error("Failed to initialize system checkout parameters.");
  }

  const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
  if (!PAYMONGO_SECRET_KEY) {
    throw new Error("Internal Configuration Error: Secret API access keys are missing.");
  }

  // Map out generated row IDs into a comma-separated string list (e.g. "24,25")
  const paymentIdsString = paymentRecords.map(r => r.payment_id).join(',');

  // 5. Package session attributes for gateway verification
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`
    },
    body: JSON.stringify({
      data: {
        attributes: {
          payment_method_types: ['gcash', 'card'],
          currency: 'PHP',
          description: `GamâLokal Marketplace Checkout`,
          line_items: lineItems,
          metadata: {
            payment_ids: paymentIdsString, // FIX: Send the complete list of matching tracking rows
            buyer_id: user.id,
            selected_item_ids: selectedItemIds && selectedItemIds.length > 0 ? selectedItemIds.join(',') : ''
          },
          success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/homepage?tab=1&payment=success`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart?payment=cancelled`
        }
      }
    })
  };

  let checkoutUrl = '';
  try {
    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', options);
    const resData = await response.json();

    if (resData.errors) {
      console.error("PayMongo Session Error Response Log:", resData.errors);
      throw new Error("Gateway rejected parameter compilation rules.");
    }

    checkoutUrl = resData.data.attributes.checkout_url;

    const completedPaymentIds = paymentRecords.map(r => r.payment_id);
    
    // Bind the unique session token back across ALL matching ledger rows
    await supabase
      .from('payments')
      .update({ paymongo_session_id: resData.data.id })
      .in('payment_id', completedPaymentIds);

  } catch (err) {
    console.error("Connection tracking trace exception:", err);
    throw new Error("Payment gateway is temporarily unreachable.");
  }

  if (checkoutUrl) {
    redirect(checkoutUrl);
  }
}

// --- ARTIST PAYOUT WITHDRAWAL ACTIONS ---

export async function createPayoutRequest(amount: number, gcashName: string, gcashNumber: string) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // 1. Verify user authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to request a withdrawal.");

  // 2. Log the withdrawal request into the schema
  const { error } = await supabase
    .from('payout_requests')
    .insert({
      artist_id: user.id,
      amount: amount,
      gcash_name: gcashName,
      gcash_number: gcashNumber,
      status: 'pending'
    });

  if (error) {
    console.error("Payout table write error:", error);
    throw new Error(`Failed to submit withdrawal: ${error.message}`);
  }

  // 3. Refresh dashboard metrics layout
  revalidatePath('/dashboard');
}

// --- ADMIN PAYOUT MANAGEMENT ACTIONS ---

export async function approvePayoutRequest(payoutId: number) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // 1. Verify that the logged-in user is actually an administrator
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: adminProfile } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (adminProfile?.role !== 'admin') {
    throw new Error("Unauthorized. Only platform admins can approve payouts.");
  }

  // 2. Update the payout request status to approved
  const { error } = await supabase
    .from('payout_requests')
    .update({ status: 'approved' })
    .eq('payout_id', payoutId);

  if (error) {
    console.error("Failed to update payout status:", error);
    throw new Error(`Status update failed: ${error.message}`);
  }

  // 3. Revalidate dashboard layouts so changes reflect instantly
  revalidatePath('/dashboard');
}

// --- NOTIFICATION ACTIONS ---

export async function markAllNotificationsAsRead() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("User not authenticated");

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id);

  if (error) {
    console.error("Failed to mark notifications as read:", error);
    throw new Error("Update failed");
  }

  revalidatePath('/');
}