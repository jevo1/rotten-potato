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

export async function processCommissionPayment({ 
  requestId, 
  artistId, 
  amount, 
  title, 
  milestoneType 
}: { 
  requestId: number; 
  artistId: string; 
  amount: number; 
  title: string; 
  milestoneType: 'deposit' | 'final'; 
}) {
  const supabase = await createClient(cookies())
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // 1. Log the specific milestone payment
  const { data: paymentRecord, error: paymentError } = await supabase
    .from('payments')
    .insert({
      client_id: user.id,
      artist_id: artistId,
      amount: amount,
      status: 'pending',
      request_id: requestId,
      milestone_type: milestoneType // New field to distinguish payment type
    })
    .select()
    .single()

  if (paymentError || !paymentRecord) {
    console.error('Database pre-payment tracking failure:', paymentError?.message)
    throw new Error('Failed to log commission payment parameters.')
  }

  const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY
  if (!PAYMONGO_SECRET_KEY) throw new Error('System Configuration Error: API keys missing.')

  // 2. Configure PayMongo session
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
          description: `GamâLokal: ${milestoneType === 'deposit' ? 'Deposit' : 'Final Payment'} for "${title}"`,
          line_items: [{
            amount: Math.round(amount * 100), 
            currency: 'PHP',
            name: `${milestoneType === 'deposit' ? 'Commission Deposit' : 'Commission Final Payment'} - ${title}`,
            quantity: 1
          }],
          metadata: {
            payment_id: paymentRecord.payment_id.toString(),
            request_id: requestId.toString(),
            milestone_type: milestoneType,
            buyer_id: user.id
          },
          success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/homepage?tab=2&payment=success&request_id=${requestId}`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/homepage?tab=2&payment=cancelled`
        }
      }
    })
  }

  let checkoutUrl = ''
  try {
    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', options)
    const resData = await response.json()
    if (resData.errors) throw new Error('Gateway initialization failed.')
    
    checkoutUrl = resData.data.attributes.checkout_url
    
    await supabase
      .from('payments')
      .update({ paymongo_session_id: resData.data.id })
      .eq('payment_id', paymentRecord.payment_id)

  } catch (err) {
    console.error('Payment failure:', err)
    throw new Error('Payment gateway unreachable.')
  }

  if (checkoutUrl) redirect(checkoutUrl)
}