"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, MessageCircle, FileText, CheckCircle, Clock, Truck, Package, MapPin, Send } from 'lucide-react';
import { 
  updateFulfillmentDetails, 
  markCommissionAsReady, 
  updateShippingStatus
} from '@/app/actions/index';
import { processCommissionPayment } from '@/app/actions/payments';

export default function CommissionWorkspace() {
  const { id } = useParams();
  const router = useRouter();
  const [commission, setCommission] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Fulfillment Form State
  const [fulfillmentMethod, setFulfillmentMethod] = useState('courier');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');
  
  // Artist Action State
  const [trackingNumber, setTrackingNumber] = useState('');
  const [eta, setEta] = useState('');

  const supabase = createClient();

  useEffect(() => {
    const fetchWorkspace = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data, error } = await supabase
        .from('commission_requests')
        .select(`
          *,
          client:users!client_id ( name, avatar_url ),
          artist:users!artist_id ( name, avatar_url ),
          offers:commission_offers ( * )
        `)
        .eq('request_id', id)
        .single();

      if (data) {
        setCommission(data);
        if (data.fulfillment_method) setFulfillmentMethod(data.fulfillment_method);
        if (data.fulfillment_details) {
            setAddress(data.fulfillment_details.address || '');
            setPhone(data.fulfillment_details.phone || '');
            setPickupInstructions(data.fulfillment_details.instructions || '');
        }
      }
      setIsLoading(false);
    };

    fetchWorkspace();
  }, [id, supabase]);

  if (isLoading) return <div className="p-10 text-center font-bold text-[#1C4A5C] animate-pulse">Synchronizing Workspace...</div>;
  if (!commission) return <div className="p-10 text-center">Commission not found.</div>;

  const isClient = user?.id === commission.client_id;
  const isArtist = user?.id === commission.artist_id;
  const inTransitStates = ['shipped', 'ready_for_pickup', 'out_for_delivery'];
  const isInTransit = inTransitStates.includes(commission.shipping_status);
  const acceptedOffer = commission.offers?.find((o: any) => o.status === 'accepted');
  const totalAmount = acceptedOffer?.offer_amount || commission.budget;
  const depositAmount = (totalAmount * (acceptedOffer?.deposit_percentage || 50)) / 100;
  const remainingBalance = totalAmount - depositAmount;

  const steps = [
    { label: 'Hired', status: 'completed', icon: CheckCircle },
    { 
      label: 'Deposit', 
      status: commission.status === 'awaiting_deposit' ? 'current' : 'completed', 
      icon: commission.status === 'awaiting_deposit' ? Clock : CheckCircle 
    },
    { 
      label: 'In Progress', 
      status: commission.status === 'in_progress' ? 'current' : 
              ['awaiting_final_payment', 'completed'].includes(commission.status) ? 'completed' : 'upcoming', 
      icon: commission.status === 'in_progress' ? Clock : (['awaiting_final_payment', 'completed'].includes(commission.status) ? CheckCircle : Clock)
    },
    { 
      label: 'Paid', 
      status: commission.status === 'awaiting_final_payment' ? 'current' : 
              commission.status === 'completed' ? 'completed' : 'upcoming', 
      icon: commission.status === 'awaiting_final_payment' ? Clock : (commission.status === 'completed' ? CheckCircle : Clock)
    },
    { 
      label: 'Delivered', 
      status: commission.shipping_status === 'delivered' ? 'completed' : 
              isInTransit ? 'current' : 'upcoming', 
      icon: Truck 
    },
  ];

  const handlePayDeposit = async () => {
    setIsProcessing(true);
    try {
      await processCommissionPayment({
        requestId: Number(id),
        artistId: commission.artist_id,
        amount: depositAmount,
        title: commission.title,
        milestoneType: 'deposit'
      });
    } catch (err) {
      alert("Payment failed to initialize.");
      setIsProcessing(false);
    }
  };

  const handlePayBalance = async () => {
    setIsProcessing(true);
    try {
      await processCommissionPayment({
        requestId: Number(id),
        artistId: commission.artist_id,
        amount: remainingBalance,
        title: commission.title,
        milestoneType: 'final'
      });
    } catch (err) {
      alert("Payment failed to initialize.");
      setIsProcessing(false);
    }
  };

  const handleUpdateFulfillment = async () => {
    setIsProcessing(true);
    const details = fulfillmentMethod === 'pickup' ? { instructions: pickupInstructions } : { address, phone };
    await updateFulfillmentDetails(Number(id), fulfillmentMethod, details);
    setIsProcessing(false);
    location.reload();
  };

  const handleMarkAsReady = async () => {
    setIsProcessing(true);
    await markCommissionAsReady(Number(id));
    setIsProcessing(false);
    location.reload();
  };

  const handleUpdateShipping = async (status: string) => {
    setIsProcessing(true);
    const tracking = fulfillmentMethod === 'courier' ? trackingNumber : eta;
    await updateShippingStatus(Number(id), status, tracking);
    setIsProcessing(false);
    location.reload();
  };

  return (
    <div className="bg-[#FCFAF8] min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1C4A5C]">{commission.title}</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Secure Project Workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <span className="bg-[#C87941]/10 text-[#C87941] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#C87941]/20">
             {commission.status.replace(/_/g, ' ')}
           </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Progress & Chat */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Action Center / Milestone Tracker */}
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl shadow-orange-900/5 overflow-hidden relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
             
             <h2 className="text-sm font-black text-[#1C4A5C] mb-8 flex items-center gap-2 uppercase tracking-widest">
               <Clock size={16} className="text-[#C87941]" /> Project Milestones
             </h2>
             
             <div className="flex justify-between relative mb-12">
                <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-100 -z-0"></div>
                {steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-3 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 transform rotate-3 transition-all ${
                      step.status === 'completed' ? 'bg-green-500 border-green-100 text-white scale-110 rotate-0' :
                      step.status === 'current' ? 'bg-[#C87941] border-[#F9EBD7] text-white animate-bounce rotate-0' :
                      'bg-white border-gray-100 text-gray-300'
                    }`}>
                      <step.icon size={20} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${
                      step.status === 'completed' ? 'text-green-600' :
                      step.status === 'current' ? 'text-[#C87941]' :
                      'text-gray-300'
                    }`}>{step.label}</span>
                  </div>
                ))}
             </div>

             {/* Dynamic Action Buttons */}
             <div className="bg-[#1C4A5C] rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                   <p className="text-[10px] font-bold text-orange-200 uppercase tracking-widest mb-1">Required Action</p>
                   <h3 className="text-lg font-bold leading-tight">
                      {commission.status === 'awaiting_deposit' && isClient && "Secure the project with an upfront deposit."}
                      {commission.status === 'awaiting_deposit' && isArtist && "Waiting for the client to secure the deposit..."}
                      {commission.status === 'in_progress' && isArtist && "Work is in progress! Update your client regularly."}
                      {commission.status === 'in_progress' && isClient && "Your artist is working on the masterpiece!"}
                      {commission.status === 'awaiting_final_payment' && isClient && "The work is ready! Complete the final payment."}
                      {commission.status === 'awaiting_final_payment' && isArtist && "Awaiting final balance from the client..."}
                      {commission.status === 'completed' && "Project successfully completed and funded!"}
                   </h3>
                </div>
                
                <div className="flex gap-3">
                  {commission.status === 'awaiting_deposit' && isClient && (
                    <button 
                      onClick={handlePayDeposit} 
                      disabled={isProcessing}
                      className="bg-[#C87941] hover:bg-[#A66435] text-white px-8 py-4 rounded-xl font-black text-sm transition-all shadow-lg shadow-[#C87941]/20 uppercase tracking-widest flex items-center gap-2"
                    >
                      {isProcessing ? 'Processing...' : `Pay Deposit (₱${depositAmount})`}
                    </button>
                  )}

                  {commission.status === 'in_progress' && isArtist && (
                    <button 
                      onClick={handleMarkAsReady}
                      disabled={isProcessing}
                      className="bg-[#C87941] hover:bg-[#A66435] text-white px-8 py-4 rounded-xl font-black text-sm transition-all shadow-lg shadow-[#C87941]/20 uppercase tracking-widest"
                    >
                      {isProcessing ? 'Updating...' : 'Mark as Ready for Review'}
                    </button>
                  )}

                  {commission.status === 'awaiting_final_payment' && isClient && (
                    <button 
                      onClick={handlePayBalance}
                      disabled={isProcessing}
                      className="bg-[#C87941] hover:bg-[#A66435] text-white px-8 py-4 rounded-xl font-black text-sm transition-all shadow-lg shadow-[#C87941]/20 uppercase tracking-widest"
                    >
                      {isProcessing ? 'Processing...' : `Pay Balance (₱${remainingBalance})`}
                    </button>
                  )}
                </div>
             </div>
          </div>

          {/* Chat Integration (Enhanced Placeholder) */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-[500px]">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <h3 className="font-black text-xs uppercase tracking-widest text-[#1C4A5C]">Collaboration Chat</h3>
              </div>
              <span className="text-[10px] text-gray-400 font-bold italic">Encrypted Connection</span>
            </div>
            
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center gap-4 bg-[#FCFAF8]/50">
               <div className="w-16 h-16 rounded-3xl bg-white shadow-md flex items-center justify-center text-[#C87941]">
                 <MessageCircle size={32} />
               </div>
               <div>
                  <p className="text-sm font-bold text-[#1C4A5C]">Start collaborating with {isClient ? commission.artist?.name : commission.client?.name}</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Discuss details, share drafts, and finalize requirements here.</p>
               </div>
            </div>

            <div className="p-6 border-t border-gray-50 bg-white">
               <div className="flex gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                 <input type="text" disabled placeholder="Integrated messaging is launching soon..." className="flex-1 bg-transparent px-4 py-3 outline-none text-sm font-medium" />
                 <button disabled className="bg-[#1C4A5C] p-4 rounded-xl text-white opacity-40"><Send size={18} /></button>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Fulfillment */}
        <div className="flex flex-col gap-8">
           
           {/* Order Summary Card */}
           <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
             <h3 className="text-xs font-black text-[#1C4A5C] mb-6 flex items-center gap-2 uppercase tracking-widest">
               <FileText size={14} className="text-[#C87941]" /> Project Specs
             </h3>
             <div className="space-y-5">
               <div className="flex justify-between items-center">
                 <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Budget</span>
                 <span className="font-black text-[#C87941] text-lg">₱{totalAmount}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Deposit Req.</span>
                 <span className="font-bold text-[#1C4A5C]">{acceptedOffer?.deposit_percentage || 50}%</span>
               </div>
               <div className="pt-5 border-t border-gray-50">
                  <p className="text-xs text-gray-500 font-medium leading-relaxed italic">&quot;{commission.description}&quot;</p>
               </div>
               
               <div className="flex items-center gap-4 pt-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#1C4A5C] p-0.5 transform -rotate-6">
                    <div className="w-full h-full rounded-[14px] overflow-hidden bg-white">
                      {commission.artist?.avatar_url ? (
                        <img src={commission.artist.avatar_url} className="w-full h-full object-cover" alt="Artist" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] font-black">{commission.artist?.name?.[0]}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Master Artist</p>
                    <p className="text-sm font-black text-[#1C4A5C]">{commission.artist?.name || 'Handicraft Specialist'}</p>
                  </div>
               </div>
             </div>
           </div>

           {/* Fulfillment Card */}
           <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-50 blur-2xl"></div>
             
             <h3 className="text-xs font-black text-[#1C4A5C] mb-6 flex items-center gap-2 uppercase tracking-widest">
               <Truck size={14} className="text-blue-500" /> Fulfillment Details
             </h3>

             {/* Case 1: Information already provided */}
             {commission.fulfillment_method ? (
               <div className="space-y-4">
                 <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Chosen Method</p>
                    <p className="text-sm font-bold text-[#1C4A5C] capitalize flex items-center gap-2">
                       {commission.fulfillment_method === 'courier' && <Truck size={14} />}
                       {commission.fulfillment_method === 'pickup' && <MapPin size={14} />}
                       {commission.fulfillment_method === 'artist_delivery' && <Package size={14} />}
                       {commission.fulfillment_method.replace(/_/g, ' ')}
                    </p>
                 </div>

                 {commission.fulfillment_method === 'pickup' ? (
                   <div>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Instructions</p>
                     <p className="text-xs font-medium text-gray-600">{commission.fulfillment_details?.instructions || 'Check chat for location.'}</p>
                   </div>
                 ) : (
                   <div>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Destination</p>
                     <p className="text-xs font-bold text-[#1C4A5C]">{commission.fulfillment_details?.address}</p>
                     <p className="text-[10px] font-bold text-gray-400 mt-1">Contact: {commission.fulfillment_details?.phone}</p>
                   </div>
                 )}

                 {/* Shipping Status (Visible to both) */}
                 <div className="pt-4 border-t border-gray-50">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hand-off Status</span>
                       <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{commission.shipping_status || 'Pending Payment'}</span>
                    </div>
                    
                    {/* Artist Control for Shipping */}
                    {isArtist && commission.status === 'completed' && !isInTransit && commission.shipping_status !== 'delivered' && (
                      <div className="space-y-3 mt-4">
                        {commission.fulfillment_method === 'courier' && (
                          <input 
                            type="text" 
                            placeholder="Enter Tracking #" 
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                          />
                        )}
                        {commission.fulfillment_method === 'artist_delivery' && (
                          <input 
                            type="text" 
                            placeholder="Enter ETA (e.g. Today 5pm)" 
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold"
                            value={eta}
                            onChange={(e) => setEta(e.target.value)}
                          />
                        )}
                        <button 
                          onClick={() => handleUpdateShipping(commission.fulfillment_method === 'courier' ? 'shipped' : commission.fulfillment_method === 'pickup' ? 'ready_for_pickup' : 'out_for_delivery')}
                          className="w-full bg-[#1C4A5C] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Update Fulfillment Status
                        </button>
                      </div>
                    )}

                    {/* Delivered Action for Artist */}
                    {isArtist && isInTransit && (
                      <div className="mt-4">
                        <button 
                          onClick={() => handleUpdateShipping('delivered')}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-green-900/10"
                        >
                          Mark as Delivered / Picked Up
                        </button>
                      </div>
                    )}

                    {/* Delivered Action for Client */}
                    {isClient && isInTransit && (
                      <div className="mt-4">
                        <button 
                          onClick={() => handleUpdateShipping('delivered')}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-green-900/10"
                        >
                          Confirm Receipt / Delivery
                        </button>
                      </div>
                    )}

                    {commission.tracking_number && (
                       <div className="bg-gray-50 rounded-xl p-3 mt-2">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tracking/Info</p>
                          <p className="text-xs font-bold text-[#1C4A5C]">{commission.tracking_number}</p>
                       </div>
                    )}
                 </div>
               </div>
             ) : (
               /* Case 2: Client needs to provide info */
               isClient ? (
                 <div className="space-y-4">
                    <div className="flex gap-2">
                       {['courier', 'pickup', 'artist_delivery'].map((m) => (
                         <button 
                           key={m} 
                           onClick={() => setFulfillmentMethod(m)}
                           className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${fulfillmentMethod === m ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                         >
                           {m.replace(/_/g, ' ')}
                         </button>
                       ))}
                    </div>

                    {fulfillmentMethod === 'pickup' ? (
                       <textarea 
                         placeholder="Special pick-up requests or notes..." 
                         className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs min-h-[80px]"
                         value={pickupInstructions}
                         onChange={(e) => setPickupInstructions(e.target.value)}
                       />
                    ) : (
                       <>
                         <input 
                           type="text" 
                           placeholder="Full Delivery Address" 
                           className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs"
                           value={address}
                           onChange={(e) => setAddress(e.target.value)}
                         />
                         <input 
                           type="text" 
                           placeholder="Contact Phone Number" 
                           className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs"
                           value={phone}
                           onChange={(e) => setPhone(e.target.value)}
                         />
                       </>
                    )}

                    <button 
                      onClick={handleUpdateFulfillment}
                      disabled={isProcessing}
                      className="w-full bg-[#1C4A5C] text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                      Save Fulfillment Info
                    </button>
                 </div>
               ) : (
                 <p className="text-xs text-gray-400 font-medium italic">Waiting for client to provide fulfillment details...</p>
               )
             )}
           </div>

           {/* Secure Payment Note */}
           <div className="bg-green-50 rounded-[2rem] p-6 border border-green-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 shrink-0">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-green-800">Funds Protected</p>
                <p className="text-[10px] text-green-700/70 mt-1 leading-relaxed">Payments are held securely and released to the artist in stages to ensure project integrity.</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
