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
    redirect('/signup?error=Could not authenticate user')
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

  const { error } = await supabase
    .from('commission_requests')
    .insert({
      client_id: user.id,
      title: title,              
      description: description,  
      budget: budget,
      deadline: deadline,
      status: 'open' 
    });

  if (error) {
    console.error('Database error:', error);
    throw new Error(`Failed to create commission request: ${error.message}`);
  }
  revalidatePath('/homepage');
}

export async function submitCommissionOffer(requestId: number, offerAmount: number, message: string) {
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
      status: 'pending'
    });

  if (error) {
    console.error('Database error:', error);
    throw new Error(`Failed to submit offer: ${error.message}`);
  }

  revalidatePath('/homepage'); 
}

export async function acceptCommissionOffer(requestId: number, offerId: number, artistId: string) {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore);
  
  const { error: offerError } = await supabase
    .from('commission_offers')
    .update({ status: 'accepted' })
    .eq('offer_id', offerId);

  if (offerError) {
    console.error('Database error:', offerError);
    throw new Error(`Failed to accept the offer: ${offerError.message}`);
  }

  const { error: requestError } = await supabase
    .from('commission_requests')
    .update({ 
      artist_id: artistId,
      status: 'in_progress' 
    })
    .eq('request_id', requestId);

  if (requestError) {
    console.error('Database error:', requestError);
    throw new Error(`Failed to update the commission status: ${requestError.message}`);
  }

  await supabase
    .from('commission_offers')
    .update({ status: 'rejected' })
    .eq('request_id', requestId)
    .neq('offer_id', offerId);

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

// --- USER & ARTIST PROFILE PROFILE ---

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
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to comment.");

  const { error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content: content,
      parent_id: parentId || null
    });

  if (error) {
    console.error("Database error:", error);
    throw new Error('Failed to add comment.');
  }

  revalidatePath('/homepage');
}

export async function deleteComment(commentId: number) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  
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
    throw new Error(`Failed to delete comment: ${error.message}`);
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
    .select('stock_quantity')
    .eq('artwork_id', artworkId)
    .single();

  if (artworkError || !artwork) {
    console.error("Error fetching artwork stock:", artworkError);
    throw new Error("Artwork not found.");
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

// --- PAYMONGO CHECKOUT GATEWAY WORKFLOW ---

export async function processCheckout() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // 1. Verify user authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to checkout.");

  // 2. Fetch current cart items
  const cartItems = await getCartItems();
  if (!cartItems || cartItems.length === 0) {
    throw new Error("Your cart is empty.");
  }

  let totalAmount = 0;
  const lineItems = [];
  
  const primaryArtworkId = cartItems[0].artwork_id;
  const primaryArtistId = cartItems[0].artist_id;

  // 3. Re-verify stock and formulate line_items maps
  for (const item of cartItems) {
    const { data: artwork, error: artworkError } = await supabase
      .from('artworks')
      .select('stock_quantity, price, title')
      .eq('artwork_id', item.artwork_id)
      .single();

    if (artworkError || !artwork) {
      throw new Error(`Artwork "${item.artworks?.title || 'Unknown'}" not found.`);
    }

    if (artwork.stock_quantity < item.quantity) {
      throw new Error(`Item "${artwork.title}" is out of stock or requested quantity exceeds availability.`);
    }

    const itemPrice = artwork.price || 0;
    totalAmount += itemPrice * item.quantity;

    lineItems.push({
      amount: Math.round(itemPrice * 100),
      currency: 'PHP',
      name: artwork.title,
      quantity: item.quantity
    });
  }

  // 4. Initialize a tracking instance in your payments schema table
  const { data: paymentRecord, error: paymentError } = await supabase
    .from('payments')
    .insert({
      client_id: user.id,
      artist_id: primaryArtistId,
      artwork_id: primaryArtworkId,
      amount: totalAmount,
      status: 'pending'
    })
    .select()
    .single();

  if (paymentError || !paymentRecord) {
    console.error("Payment table initialization failure:", paymentError?.message);
    throw new Error("Failed to initialize system checkout parameters.");
  }

  const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
  if (!PAYMONGO_SECRET_KEY) {
    throw new Error("Internal Configuration Error: Secret API access keys are missing.");
  }

  // 5. Query PayMongo API endpoint parameters
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
          // Fixed parameter key here:
          payment_method_types: ['gcash', 'card'],
          currency: 'PHP',
          description: `GamâLokal Marketplace Checkout`,
          line_items: lineItems,
          metadata: {
            payment_id: paymentRecord.payment_id.toString(),
            buyer_id: user.id
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
      console.error("PayMongo Session Error Response:", resData.errors);
      throw new Error("Gateway rejected generation parameters.");
    }

    checkoutUrl = resData.data.attributes.checkout_url;

    await supabase
      .from('payments')
      .update({ paymongo_session_id: resData.data.id })
      .eq('payment_id', paymentRecord.payment_id);

  } catch (err) {
    console.error("Failed to connect to gateway infrastructure:", err);
    throw new Error("Payment gateway is temporarily unreachable.");
  }

  if (checkoutUrl) {
    redirect(checkoutUrl);
  }
}