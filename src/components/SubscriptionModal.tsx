'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  CheckCircle2, ShieldCheck, Zap, Sparkles, X, Loader2,
  CreditCard, Lock, Star, QrCode, Copy, Check, ArrowRight
} from 'lucide-react';

// Extend window to include Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function SubscriptionModal() {
  const { user, isSubscriptionModalOpen, closeSubscriptionModal, refreshUser } = useAuth();
  const [paymentTab, setPaymentTab] = useState<'upi_qr' | 'razorpay'>('upi_qr');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const qrCodeUrl = '/images/phonepe-qr.jpg';

  useEffect(() => {
    if (isSubscriptionModalOpen) {
      loadRazorpayScript().then(setRazorpayLoaded);
    }
  }, [isSubscriptionModalOpen]);

  if (!isSubscriptionModalOpen) return null;

  const handleUpiVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber || utrNumber.trim().length < 6) {
      setError('Please enter the 12-digit UTR or transaction reference number from your UPI app.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/subscription/verify-upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utr: utrNumber.trim(),
          upiId: 'Official PhonePe QR',
          amount: 99,
          userId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify UPI transaction.');
      }

      setSuccess(true);
      await refreshUser();
      setTimeout(() => {
        setSuccess(false);
        closeSubscriptionModal();
      }, 3000);
    } catch (err: any) {
      setError(err?.message || 'UPI verification error. Please check your UTR.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      if (!razorpayLoaded) {
        const loaded = await loadRazorpayScript();
        if (!loaded) throw new Error('Failed to load payment gateway. Please try again.');
      }

      const orderRes = await fetch('/api/subscription/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || 'Failed to initiate payment');
      }

      await new Promise<void>((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'AceInterview.ai',
          description: 'Pro — Unlimited AI Interviews (30 Days)',
          image: '/logo.png',
          order_id: orderData.orderId,
          prefill: {
            name: orderData.user?.name || user?.name || '',
            email: orderData.user?.email || user?.email || '',
          },
          theme: {
            color: '#6366f1',
            backdrop_color: 'rgba(0,0,0,0.85)',
          },
          modal: {
            ondismiss: () => {
              setProcessing(false);
              reject(new Error('Payment cancelled'));
            },
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyRes = await fetch('/api/subscription/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userId: user?.id,
                }),
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) {
                throw new Error(verifyData.error || 'Payment verification failed');
              }

              setSuccess(true);
              await refreshUser();
              setTimeout(() => {
                setSuccess(false);
                closeSubscriptionModal();
              }, 3000);
              resolve();
            } catch (verifyErr: any) {
              reject(verifyErr);
            }
          },
        });

        razorpay.on('payment.failed', (response: any) => {
          reject(new Error(response.error?.description || 'Payment failed'));
        });

        razorpay.open();
      });
    } catch (err: any) {
      if (err.message !== 'Payment cancelled') {
        setError(err.message || 'Payment failed. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#0d121f] border border-indigo-500/30 rounded-2xl shadow-2xl shadow-indigo-950/50 text-white overflow-hidden my-8">

        {/* Gradient header bar */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="p-6 sm:p-8">
          {/* Close Button */}
          <button
            onClick={closeSubscriptionModal}
            disabled={processing}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {success ? (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-6 animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">🎉 Pro Subscription Activated!</h3>
              <p className="text-slate-300 text-sm max-w-sm">
                Your 30-day unlimited technical mock interview pass is now active for <strong className="text-indigo-400">{user?.email}</strong>. Enjoy full DSA, System Design, and autonomous scoring!
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 text-indigo-400 shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400 bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                      AceInterview Pro
                    </span>
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      ₹99 for 30 Days Unlimited
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                    Unlock Unlimited AI Interviews
                  </h2>
                </div>
              </div>

              {/* Payment Method Switcher */}
              <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 mb-5">
                <button
                  type="button"
                  onClick={() => { setPaymentTab('upi_qr'); setError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition ${
                    paymentTab === 'upi_qr'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Official UPI QR Scanner (Instant)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setPaymentTab('razorpay'); setError(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition ${
                    paymentTab === 'razorpay'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Cards / Netbanking (Razorpay)</span>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-500/30 text-red-300 text-xs">
                  ⚠️ {error}
                </div>
              )}

              {paymentTab === 'upi_qr' ? (
                /* ── Tab 1: Official UPI QR Scanner ── */
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 flex flex-col sm:flex-row items-center gap-6">
                    {/* QR Code Container */}
                    <div className="flex flex-col items-center bg-black p-3 rounded-2xl border-2 border-emerald-500/80 shadow-2xl shadow-emerald-500/20 shrink-0">
                      <img
                        src="/images/phonepe-qr.jpg"
                        alt="Official PhonePe / UPI QR Scanner"
                        className="w-44 h-auto max-h-56 rounded-xl object-contain"
                      />
                      <span className="text-[10px] font-bold text-emerald-400 mt-2 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Official PhonePe QR
                      </span>
                    </div>

                    {/* Instructions */}
                    <div className="flex-1 text-center sm:text-left space-y-3">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                          Step 1: Scan & Pay ₹99
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1.5">
                          Scan with Any UPI Payment App
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Open <strong>PhonePe, Google Pay, Paytm, BHIM, CRED</strong> or your mobile banking app, and scan the QR code to complete the ₹99 payment securely.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Plan Access:</span>
                          <span className="font-semibold text-emerald-400">30 Days Pro Unlimited</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Total Amount:</span>
                          <span className="font-bold text-white text-sm">₹99.00</span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                          <span className="text-slate-400">Payment Security:</span>
                          <span className="text-[11px] text-cyan-300 font-medium">Encrypted & Direct UPI Verified</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        ⚡ After paying, enter the 12-digit UTR transaction reference below for instant automated activation.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Enter UTR / Txn Reference */}
                  <form onSubmit={handleUpiVerification} className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-200">
                          Step 2: Enter 12-Digit UPI Ref / UTR Number
                        </label>
                        <span className="text-[11px] text-slate-400">From payment receipt</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                        placeholder="e.g. 423985123456"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={processing || utrNumber.trim().length < 6}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying UPI Transaction...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verify UTR & Activate Pro Unlimited</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* ── Tab 2: Razorpay Gateway ── */
                <div className="space-y-5">
                  <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-indigo-300 uppercase tracking-wider font-semibold">Online Gateway</div>
                      <div className="text-2xl font-extrabold text-white flex items-baseline gap-1.5 mt-1">
                        ₹99 <span className="text-sm font-normal text-slate-400">/ 30 days</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">Credit/Debit Cards, Netbanking, Wallets</div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                        <Sparkles className="w-3.5 h-3.5" />
                        Instant Active
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    {[
                      '30-minute deep interviews (vs 15-min trial)',
                      'Unlimited voice & DSA technical rounds',
                      'Resume ATS scoring & analytics',
                      'Placement report dossiers & code feedback',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleRazorpayPayment}
                    disabled={processing}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Opening Razorpay Checkout...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Pay ₹99 via Razorpay
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Security badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-4">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Encrypted • 100% Secure • Direct UPI or Razorpay Gateway</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
