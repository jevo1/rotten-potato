'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

interface PaymentPayload {
  artistId: string;
  amount: number;
  title: string;
  artworkId?: number;     // Optional if checking out a marketplace piece
  requestId?: number;     // Optional if paying for a custom commission request
}

export async function processPayMongoPayment({ artistId, amount, title, artworkId, requestId }: PaymentPayload) {
  const supabase = await createClient(cookies())
  
  // 1. Authenticate user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // 2. Initialize a record directly inside your payments table schema
  const { data: paymentRecord, error: paymentError } = await supabase
    .from('payments')
    .insert({
      client_id: user.id,
      artist_id: artistId,
      amount: amount,
      status: 'pending',
      request_id: requestId || null,
      artwork_id: artworkId || null
    })
    .select()
    .single()

  if (paymentError || !paymentRecord) {
    console.error('Database pre-payment tracking failure:', paymentError?.message)
    throw new Error('Failed to log transaction tracking parameters.')
  }

  const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY
  if (!PAYMONGO_SECRET_KEY) {
    throw new Error('System Configuration Error: API access keys are missing.')
  }

  // 3. Configure the checkout window options (Amounts parsed in cents)
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
          payment_method_allowed: ['gcash', 'card'],
          currency: 'PHP',
          description: `GamâLokal: Payment for "${title}"`,
          line_items: [{
            amount: Math.round(amount * 100), 
            currency: 'PHP',
            name: title,
            quantity: 1
          }],
          // Store your specific payment_id inside metadata for secure background processing
          metadata: {
            payment_id: paymentRecord.payment_id.toString()
          },
          success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/homepage?tab=1&payment=success`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/homepage?tab=1&payment=cancelled`
        }
      }
    })
  }

  let checkoutUrl = ''
  try {
    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', options)
    const resData = await response.json()

    if (resData.errors) {
      console.error('PayMongo Gateway Exception:', resData.errors)
      throw new Error('Gateway rejected initialization configuration.')
    }
    
    checkoutUrl = resData.data.attributes.checkout_url
    
    // Bind session trace ID back to your row entry
    await supabase
      .from('payments')
      .update({ paymongo_session_id: resData.data.id })
      .eq('payment_id', paymentRecord.payment_id)

  } catch (err) {
    console.error('Payment infrastructure breakdown:', err)
    throw new Error('Payment gateway currently unreachable.')
  }

  if (checkoutUrl) {
    redirect(checkoutUrl)
  }
}