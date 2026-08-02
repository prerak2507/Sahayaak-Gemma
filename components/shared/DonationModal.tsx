'use client';

import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Banknote, ShieldCheck, Wallet, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface DonationModalProps {
  ngoName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DonationModal({ ngoName, onClose, onSuccess }: DonationModalProps) {
  const [step, setStep] = useState<'amount' | 'payment' | 'processing'>('amount');
  const [amount, setAmount] = useState('500');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'wallet'>('wallet');

  const handleProcessPayment = () => {
    setStep('processing');
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 2000);
  };

  const amounts = ['100', '500', '1000', '2000'];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl mx-4"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold font-mukta text-xl text-slate-900">Support {ngoName}</h3>
            <p className="text-xs text-slate-500 font-medium">100% of your donation reaches the cause</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 'amount' && (
              <motion.div 
                key="amount"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Select Amount (INR)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {amounts.map((a) => (
                      <button
                        key={a}
                        onClick={() => setAmount(a)}
                        className={`py-3 rounded-2xl font-bold transition-all border-2 ${
                          amount === a 
                            ? 'bg-[var(--saffron)] border-[var(--saffron)] text-white shadow-lg shadow-[var(--saffron-glow)]' 
                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                        }`}
                      >
                        ₹{a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                  <input 
                    type="number" 
                    placeholder="Custom Amount" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-[var(--saffron)] outline-none font-bold text-lg transition-all"
                  />
                </div>

                <button 
                  onClick={() => setStep('payment')}
                  className="btn-primary w-full justify-center py-4 text-base font-bold shadow-xl shadow-[var(--saffron-glow)]"
                >
                  Next Step <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div 
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Payment Method</label>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setPaymentMethod('wallet')}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                        paymentMethod === 'wallet' ? 'border-[var(--saffron)] bg-[var(--saffron-light)]/30' : 'border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${paymentMethod === 'wallet' ? 'bg-[var(--saffron)] text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <Wallet size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-900 text-sm">Sahaayak Demo Wallet</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Balance: ₹5,000.00</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'wallet' ? 'border-[var(--saffron)]' : 'border-slate-200'}`}>
                        {paymentMethod === 'wallet' && <div className="w-2.5 h-2.5 rounded-full bg-[var(--saffron)]" />}
                      </div>
                    </button>

                    <button 
                      onClick={() => setPaymentMethod('upi')}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                        paymentMethod === 'upi' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${paymentMethod === 'upi' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <Smartphone size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-900 text-sm">UPI (PhonePe/GPay)</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Instant Bank Transfer</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'upi' ? 'border-blue-500' : 'border-slate-200'}`}>
                        {paymentMethod === 'upi' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                      </div>
                    </button>

                    <button 
                      onClick={() => setPaymentMethod('card')}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                        paymentMethod === 'card' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${paymentMethod === 'card' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <CreditCard size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-slate-900 text-sm">Credit / Debit Card</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Visa, Master, RuPay</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-indigo-500' : 'border-slate-200'}`}>
                        {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                      </div>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep('amount')} className="btn-ghost flex-1 py-4 font-bold border-2">Back</button>
                  <button 
                    onClick={handleProcessPayment}
                    className="btn-primary flex-[2] justify-center py-4 text-base font-bold shadow-xl"
                  >
                    Pay ₹{amount}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-6"
              >
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-[var(--saffron)] border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-[var(--saffron)]">
                    <ShieldCheck size={32} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Verifying Transaction</h3>
                  <p className="text-sm text-slate-500">Securing your contribution to {ngoName}...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Security */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-2">
            <ShieldCheck size={12} className="text-emerald-500" /> SECURED BY SAHAAYAK DEMO PAY
          </p>
        </div>
      </motion.div>
    </div>
  );
}
