'use client';

import React, { useState } from 'react';
import { Calendar, User, Clock, ArrowRight, X } from 'lucide-react';

const POSTS = [
  {
    title: 'How Sahaayak is Scaling Disaster Relief in Gujarat',
    excerpt: 'A deep dive into our AI orchestration during the recent monsoon season.',
    content: "During the recent monsoon season, Gujarat faced unprecedented rainfall. Traditional disaster management systems were overwhelmed. This is where Sahaayak stepped in. By deploying our AI orchestration layer across 14 districts, we successfully predicted flood vectors and pre-deployed NDRF teams 48 hours before critical dam overflows.\n\nOur system integrated real-time telemetry from GEE GIS Satellite data with ground-level citizen reports, effectively routing over 5,000 verified volunteers to high-impact zones. The result? A 40% reduction in response time and seamless coordination between government agencies and local NGOs.",
    author: 'Sahaayak Team',
    date: 'Apr 15, 2026',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: '5 Ways to Maximize Your Impact as a Weekend Field Engineer',
    excerpt: 'Small efforts lead to big changes. Here is how you can help even with a busy schedule.',
    content: "You don't need to quit your day job to make a difference. Many of our most impactful volunteers contribute just 2-4 hours every weekend.\n\nHere is how to maximize that time:\n1. Setup specific notification zones in your Sahaayak profile so you only get alerts for tasks within a 5km radius.\n2. Focus on 'Verification Tasks' - these are critical for preventing fake requests and can often be done remotely or via a quick drive-by.\n3. Keep your skills updated. A certified First Aid skill badge moves you to priority dispatch for medical emergencies.\n\nEvery minute counts when a community is in need.",
    author: 'Community Lead',
    date: 'Apr 10, 2026',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1559027615-cd26714e93af?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Transparency in Philanthropy: The Blockchain Ledger',
    excerpt: 'Understanding how Sahaayak ensures every rupee reaches the intended cause.',
    content: "Trust is the cornerstone of philanthropy. In the past, donors often wondered where their contributions ended up. At Sahaayak, we utilize an immutable Blockchain ledger for all material and financial donations.\n\nWhen you donate 100 blankets, the transaction is tokenized. As the blankets move from the warehouse to the NGO coordinator, and finally to the verified recipient, each step is recorded. You can track your exact donation on our public dashboard. This level of transparency not only ensures zero leakage but also builds a stronger, more trusting relationship between citizens and relief organizations.",
    author: 'Tech Architect',
    date: 'Mar 28, 2026',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800'
  }
];

export default function BlogPage() {
  const [selectedPost, setSelectedPost] = useState<typeof POSTS[0] | null>(null);

  return (
    <div className="min-h-screen bg-[var(--surface)] pt-24 pb-20 font-dm-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        <div className="max-w-3xl mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-mukta text-[var(--ink)] mb-4">
            Blog & Stories
          </h1>
          <p className="text-lg text-[var(--ink-muted)]">
            Insights from the field, technical deep-dives, and heart-warming impact stories from our community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {POSTS.map((post, i) => (
            <article 
              key={i} 
              className="bg-white rounded-3xl overflow-hidden border border-[var(--border)] shadow-sm hover:shadow-xl transition-all group flex flex-col h-full cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              <div className="h-48 overflow-hidden relative">
                <img src={post.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={post.title} />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-[var(--saffron)]">Insight</span>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-4 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                </div>
                
                <h2 className="text-xl font-bold font-mukta text-[var(--ink)] mb-3 group-hover:text-[var(--saffron)] transition-colors leading-snug">
                  {post.title}
                </h2>
                
                <p className="text-sm text-[var(--ink-muted)] mb-6 flex-1 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="pt-6 border-t border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center font-bold text-[10px]">{post.author.charAt(0)}</div>
                    <span className="text-xs font-bold text-[var(--ink)]">{post.author}</span>
                  </div>
                  <button className="text-[var(--saffron)] hover:translate-x-1 transition-transform">
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* MODAL FOR FULL BLOG POST */}
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setSelectedPost(null)}
            />
            <div className="relative bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-300">
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center z-10 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="h-64 sm:h-80 relative w-full">
                <img src={selectedPost.image} className="w-full h-full object-cover" alt={selectedPost.title} />
              </div>
              
              <div className="p-6 sm:p-10">
                <div className="flex items-center gap-4 text-xs text-[var(--ink-muted)] mb-6 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {selectedPost.date}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {selectedPost.readTime}</span>
                  <span className="flex items-center gap-1"><User size={14} /> {selectedPost.author}</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-extrabold font-mukta text-[var(--ink)] mb-8 leading-tight">
                  {selectedPost.title}
                </h2>
                
                <div className="prose prose-lg text-[var(--ink)] space-y-6">
                  {selectedPost.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="leading-relaxed">
                      {paragraph.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i !== paragraph.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
