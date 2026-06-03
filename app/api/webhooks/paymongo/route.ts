import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Instantiate high-clearance admin client to handle background table mutations smoothly
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // 1. Grab the cryptographic validation tracking token from headers
    const signatureHeader = request.headers.get('paymongo-signature')
    
    // Read the raw body as text first (Crucial for computing correct hashes in Next.js)
    const rawBody = await request.text()
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET

    // 2. Validate request authenticity if a secret is configured in Vercel
    if (signatureHeader && webhookSecret) {
      const parts = signatureHeader.split(',')
      const timestampPart = parts.find(p => p.trim().startsWith('t='))
      const signaturePart = parts.find(p => p.trim().startsWith('te=') || p.trim().startsWith('li='))

      if (timestampPart && signaturePart) {
        const timestamp = timestampPart.split('=')[1]
        const headerSignature = signaturePart.split('=')[1]
        
        const baseString = `${timestamp}.${rawBody}`
        const localSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(baseString)
          .digest('hex')

        if (localSignature !== headerSignature) {
          console.warn("Security Alert: Unauthorized payment notification signature blocked.")
          return NextResponse.json({ error: 'Signature mismatch' }, { status: 401 })
        }
      }
    }

    // 3. Parse payload structure once verified safely
    const body = JSON.parse(rawBody)
    const eventType = body.data.attributes.type 
    
    // FIX: Aligned match directly with your dashboard event configuration string!
    if (eventType === 'checkout_session.payment.paid') {
      const sessionAttributes = body.data.attributes.data.attributes
      const metadata = sessionAttributes.metadata
      
      const paymentId = parseInt(metadata.payment_id, 10)
      const buyerId = metadata.buyer_id
      const selectedItemIdsString = metadata.selected_item_ids // Contains checked row IDs e.g. "2,5"
      const itemsPaid = sessionAttributes.line_items

      // A. Core Balance Update: Mark row statement as settled
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

      // B. Dynamic Inventory Management and Creators Ledger Credit Notifications
      for (const item of itemsPaid) {
        const itemTitle = item.name
        const quantityBought = item.quantity

        const { data: artwork } = await supabaseAdmin
          .from('artworks')
          .select('artwork_id, stock_quantity, user_id')
          .eq('title', itemTitle)
          .maybeSingle()

        if (artwork) {
          const currentStock = artwork.stock_quantity || 0
          const remainingStock = Math.max(0, currentStock - quantityBought)
          
          await supabaseAdmin
            .from('artworks')
            .update({ 
              stock_quantity: remainingStock,
              status: remainingStock === 0 ? 'sold' : 'available'
            })
            .eq('artwork_id', artwork.artwork_id)

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

      // C. FIX: Target cleanup rules to remove only the checked items, preserving others
      if (selectedItemIdsString) {
        const idsToDelete = selectedItemIdsString.split(',').map((id: string) => parseInt(id, 10))
        await supabaseAdmin
          .from('cart_items')
          .delete()
          .in('cart_item_id', idsToDelete)
          .eq('user_id', buyerId)
      } else {
        // Fallback catch-all 
        await supabaseAdmin
          .from('cart_items')
          .delete()
          .eq('user_id', buyerId)
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err: any) {
    console.error('PayMongo secure webhook processing failure:', err.message)
    return NextResponse.json({ error: 'Webhook payload evaluation exception thrown' }, { status: 400 })
  }
}