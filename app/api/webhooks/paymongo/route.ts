import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Instantiate high-privilege client authorization to process post-payment tasks smoothly
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const eventType = body.data.attributes.type 
    
    if (eventType === 'checkout_session.paid') {
      const sessionAttributes = body.data.attributes.data.attributes
      const metadata = sessionAttributes.metadata
      
      const paymentId = parseInt(metadata.payment_id, 10)
      const buyerId = metadata.buyer_id
      const itemsPaid = sessionAttributes.line_items

      // 1. Core Update: Flag the corresponding transaction row as paid and update the date
      const { data: paymentRecord, error: paymentUpdateError } = await supabaseAdmin
        .from('payments')
        .update({ 
          status: 'paid',
          transaction_date: new Date().toISOString()
        })
        .eq('payment_id', paymentId)
        .select()
        .single()

      if (paymentUpdateError || !paymentRecord) throw paymentUpdateError

      // 2. Cascade Actions: Deduct artwork stock and notify the creators
      for (const item of itemsPaid) {
        const itemTitle = item.name
        const quantityBought = item.quantity

        // Pull current artwork details to calculate remaining stock
        const { data: artwork } = await supabaseAdmin
          .from('artworks')
          .select('artwork_id, stock_quantity, user_id')
          .eq('title', itemTitle)
          .maybeSingle()

        if (artwork) {
          // Deduct quantity from stock
          const newStock = Math.max(0, (artwork.stock_quantity || 0) - quantityBought)
          
          await supabaseAdmin
            .from('artworks')
            .update({ 
              stock_quantity: newStock,
              status: newStock === 0 ? 'sold' : 'available'
            })
            .eq('artwork_id', artwork.artwork_id)

          // Drop a standard platform notification message to the artist
          if (artwork.user_id) {
            await supabaseAdmin
              .from('notifications')
              .insert({
                user_id: artwork.user_id,
                actor_id: buyerId,
                type: 'purchase',
                entity_id: artwork.artwork_id,
                entity_type: 'artwork',
                content: `Your masterpiece artwork "${itemTitle}" was purchased! (Qty: ${quantityBought})`,
                is_read: false
              })
          }
        }
      }

      // 3. Cleanup: Empty out all current cart items associated with the buyer
      await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('user_id', buyerId)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err: any) {
    console.error('PayMongo secure webhook processing failure:', err.message)
    return NextResponse.json({ error: 'Webhook payload processing exception thrown' }, { status: 400 })
  }
}