'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase/config';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, serverTimestamp, getDocs, limit, doc, updateDoc 
} from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import { Send, X, User, MessageSquare, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  sender_id: string;
  text: string;
  created_at: any;
}

interface ChatInterfaceProps {
  targetUserId: string;
  targetUserName: string;
  onClose: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ targetUserId, targetUserName, onClose }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Find or Create Chat
  useEffect(() => {
    if (!user?.id || !targetUserId) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef, 
      where('participants', 'array-contains', user.id),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const existingChat = snapshot.docs.find(doc => 
        doc.data().participants.includes(targetUserId)
      );

      if (existingChat) {
        setChatId(existingChat.id);
      } else {
        // Create new chat
        addDoc(chatsRef, {
          participants: [user.id, targetUserId],
          created_at: serverTimestamp(),
          last_message: '',
          updated_at: serverTimestamp()
        }).then(doc => setChatId(doc.id));
      }
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    return () => unsubscribe();
  }, [user?.id, targetUserId]);

  // 2. Listen for Messages
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('created_at', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    }, (err: any) => {
      // Expected when the store is local or the rules deny client reads.
      // Logged rather than thrown: an uncaught listener error blanks the page.
      console.warn('Firestore subscription unavailable:', err?.code || err?.message);
    });

    return () => unsubscribe();
  }, [chatId]);

  // 3. Auto Scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user?.id) return;

    const msg = newMessage.trim();
    setNewMessage('');

    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        sender_id: user.id,
        sender_name: user.full_name,
        text: msg,
        created_at: serverTimestamp()
      });

      // Update last message in chat doc for sorting/preview
      const chatDocRef = doc(db, 'chats', chatId);
      await updateDoc(chatDocRef, {
        last_message: msg,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-[3000]"
    >
      {/* Header */}
      <div className="p-4 bg-[var(--ink)] text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
            <User size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm font-mukta !text-white">{targetUserName}</h3>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <MessageSquare size={48} className="text-slate-200 mb-4" />
            <p className="text-sm font-bold text-slate-400">Secure connection established.</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Send a message to start coordinating.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                isMe 
                  ? 'bg-[var(--saffron)] text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--saffron)] transition-all"
        />
        <button 
          type="submit" 
          className="p-2 bg-[var(--ink)] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          disabled={!newMessage.trim()}
        >
          <Send size={20} />
        </button>
      </form>
    </motion.div>
  );
};
