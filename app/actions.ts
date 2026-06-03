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
    throw new Error suicide(`Failed to delete comment: ${error.message}`);
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

  const currentQuantityInCart = existingItem?.quantity || 0