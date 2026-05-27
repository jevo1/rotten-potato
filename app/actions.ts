'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

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
  
  // Redirect the user back to the login page
  redirect('/login')
}

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
    console.error('Error posting request:', error);
    throw new Error('Failed to post commission request.');
  }
  revalidatePath('/homepage');
}

// 2. Artist submits an offer/bid on an open job
export async function submitCommissionOffer(requestId: number, offerAmount: number, message: string) {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to submit an offer.");

  // NEW: 1. Fetch user role to ensure they are actually an artist
  const { data: currentUserData, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (roleError || currentUserData?.role !== 'artist') {
    throw new Error("Only registered artists can submit offers on job board requests.");
  }

  // 2. Fetch the original request to check who owns it
  const { data: requestData, error: fetchError } = await supabase
    .from('commission_requests')
    .select('client_id')
    .eq('request_id', requestId)
    .single();

  if (fetchError || !requestData) throw new Error('Could not find the commission request.');
  
  // 3. Block the user from bidding on their own job
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
    console.error('Error submitting offer:', error);
    throw new Error('Failed to submit offer.');
  }

  revalidatePath('/homepage'); 
}


// 3. Client accepts an offer (The State Machine Trigger)
export async function acceptCommissionOffer(requestId: number, offerId: number, artistId: string) {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore);
  
  // A. Mark the specific offer as 'accepted'
  const { error: offerError } = await supabase
    .from('commission_offers')
    .update({ status: 'accepted' })
    .eq('offer_id', offerId);

  if (offerError) throw new Error('Failed to accept the offer.');

  // B. Update the actual request: Assign the artist and change status to 'in_progress'
  const { error: requestError } = await supabase
    .from('commission_requests')
    .update({ 
      artist_id: artistId,
      status: 'in_progress' 
    })
    .eq('request_id', requestId);

  if (requestError) throw new Error('Failed to update the commission status.');

  // C. Mark all other offers for this request as 'rejected'
  await supabase
    .from('commission_offers')
    .update({ status: 'rejected' })
    .eq('request_id', requestId)
    .neq('offer_id', offerId);

  revalidatePath('/homepage'); 
}

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

// 5. Send a direct message to another user
export async function sendMessage(receiverId: string, content: string) {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore);
  
  // 1. Verify the sender is logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to send a message.");

  // 2. Insert the message into the database
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

// 6. Update or Create an Artist Profile
export async function updateArtistProfile(formData: FormData) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);
  
  // 1. Verify the user is logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to update your profile.");

  // 2. Extract data from the form
  const name = formData.get('name') as string;
  const specialty = formData.get('specialty') as string;
  const location = formData.get('location') as string;
  const priceRange = formData.get('price_range') as string;

  // 3. Update the base 'users' table (for the name)
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

  // 4. Check if the artist profile already exists
  const { data: existingProfile } = await supabase
    .from('artist_profiles')
    .select('profile_id')
    .eq('user_id', user.id)
    .single();

  // 5. Insert or Update the artist_profiles table
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

// Complete a commission and leave a review
export async function completeCommissionAndReview(
  requestId: number, 
  artistId: string, 
  rating: number, 
  comment: string
) {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  // 1. Mark request as completed
  const { error: reqError } = await supabase
    .from('commission_requests')
    .update({ status: 'completed' })
    .eq('request_id', requestId);

  if (reqError) throw new Error('Failed to update request status.');

  // 2. Insert the review
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

  if (reviewError) throw new Error('Failed to post review.');

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
      users ( name )
    `);

  // Filtering
  if (options.category && options.category !== 'All Categories') {
    query = query.eq('category', options.category);
  }

  if (options.search) {
    query = query.ilike('title', `%${options.search}%`);
  }

  // Sorting
  if (options.sortBy === 'price_asc') {
    query = query.order('price', { ascending: true });
  } else if (options.sortBy === 'price_desc') {
    query = query.order('price', { ascending: false });
  } else {
    // Default sorting by title if created_at is missing
    query = query.order('title', { ascending: true });
  }

  const { data, error } = await query;
  if (error) {
    console.error("Supabase error fetching artworks:", error.message, error.details, error.hint);
    throw new Error(`Failed to fetch artworks: ${error.message}`);
  }

  return data?.map(artwork => ({
    ...artwork,
    users: Array.isArray(artwork.users) ? artwork.users[0] : artwork.users
  }));
}

