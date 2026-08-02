'use client';

import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '@/types';
import { useUIStore } from '@/stores/uiStore';
import toast from 'react-hot-toast';
import { usePathname } from 'next/navigation';

export function LanguageSwitcher({ isSidebar }: { isSidebar?: boolean }) {
  const [open, setOpen] = useState(false);
  const { currentLanguage, setLanguage } = useUIStore();
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all w-full ${isSidebar ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
        style={{
          color: isSidebar ? 'white' : 'var(--ink-muted)',
          background: open ? (isSidebar ? 'rgba(255,255,255,0.1)' : 'var(--surface-2)') : 'transparent',
          border: isSidebar ? '1px solid rgba(255,255,255,0.1)' : 'none'
        }}
      >
        <Globe size={16} className={isSidebar ? 'text-[var(--saffron)]' : ''} />
        <span className="flex-1 text-left">{currentLang.native}</span>
        <span className="text-[10px] opacity-40">{currentLang.code.toUpperCase()}</span>
      </button>

      {open && (
        <div
          className={`absolute right-0 ${isSidebar ? 'bottom-full mb-2' : 'top-full mt-2'} w-48 rounded-xl py-2 shadow-lg z-[100]`}
          style={{
            background: 'white',
            border: '1px solid var(--border)',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
          }}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={async () => { 
                setLanguage(lang.code); 
                setOpen(false); 
                // ✨ Sarvam Magic: Translate UI elements
                if (lang.code !== 'en') {
                  const toastId = toast.loading(`Translating page to ${lang.native}...`);
                  try {
                    // Find all translate-ready text nodes
                    const elements = document.querySelectorAll('h1, h2, h3, p, span, button');
                    for (const el of Array.from(elements)) {
                      // Filter out icons and small bits
                      if ((el as HTMLElement).innerText.length > 3 && !el.querySelector('svg')) {
                        const res = await fetch('/api/ai/translate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            text: (el as HTMLElement).innerText,
                            source_language: 'en-IN',
                            target_language: lang.code + '-IN'
                          })
                        });
                        const data = await res.json();
                        if (data.translatedText) (el as HTMLElement).innerText = data.translatedText;
                      }
                    }
                    toast.success('Page translated!', { id: toastId });
                  } catch (e) {
                    toast.error('Global translation failed.', { id: toastId });
                  }
                } else {
                   window.location.reload(); // Reset to English
                }
              }}
              className="w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors hover:bg-slate-50"
              style={{
                color: lang.code === currentLanguage ? 'var(--saffron)' : 'var(--ink)',
                background: lang.code === currentLanguage ? 'var(--saffron-light)' : 'transparent',
                fontWeight: lang.code === currentLanguage ? 600 : 400,
              }}
            >
              <span>{lang.native}</span>
              <span style={{ color: 'var(--ink-faint)', fontSize: 12 }}>{lang.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
