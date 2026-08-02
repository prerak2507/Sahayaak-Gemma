'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/stores/uiStore';
import toast from 'react-hot-toast';

export function GlobalTranslator() {
  const pathname = usePathname();
  const { currentLanguage } = useUIStore();
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // Translate a single element safely
    const translateElement = async (el: HTMLElement, lang: string) => {
      const text = el.innerText?.trim();
      if (!text || text.length <= 1) return;
      
      // Avoid translating icons/SVGs
      if (el.querySelector('svg')) return;
      
      // Get or set original English text
      let origText = el.getAttribute('data-orig-text');
      if (!origText) {
        origText = text;
        el.setAttribute('data-orig-text', origText);
      }
      
      // If language is English, restore original text and clear translated flag
      if (lang === 'en') {
        if (el.innerText !== origText) {
          el.innerText = origText;
        }
        el.removeAttribute('data-translated');
        return;
      }
      
      // Check if already translated to this language
      if (el.getAttribute('data-translated') === lang) return;
      
      try {
        const res = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: origText,
            source_language: 'en-IN',
            target_language: lang + '-IN'
          })
        });
        const data = await res.json();
        if (data.translatedText) {
          el.innerText = data.translatedText;
          el.setAttribute('data-translated', lang);
        }
      } catch (err) {
        console.error('Translation error for element:', err);
      }
    };

    const translatePage = async () => {
      const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, button, label, a');
      const arrayElements = Array.from(elements) as HTMLElement[];
      
      // Filter out elements that already match the target translation status
      const pendingElements = arrayElements.filter(el => {
        const text = el.innerText?.trim();
        if (!text || text.length <= 1 || el.querySelector('svg')) return false;
        
        if (currentLanguage === 'en') {
          return el.hasAttribute('data-translated');
        }
        return el.getAttribute('data-translated') !== currentLanguage;
      });

      if (pendingElements.length === 0) return;

      const toastId = currentLanguage !== 'en' 
        ? toast.loading(`Translating page to ${currentLanguage.toUpperCase()}...`)
        : toast.loading('Restoring English...');
      
      try {
        const batchSize = 10;
        for (let i = 0; i < pendingElements.length; i += batchSize) {
          const batch = pendingElements.slice(i, i + batchSize);
          await Promise.all(batch.map(el => translateElement(el, currentLanguage)));
        }
        
        if (currentLanguage !== 'en') {
          toast.success('Page translated!', { id: toastId });
        } else {
          toast.success('Restored English!', { id: toastId });
        }
      } catch (error) {
        console.error('Global translation error:', error);
        toast.error('Translation sync failed.', { id: toastId });
      }
    };

    // Run initial page translation
    const timer = setTimeout(translatePage, 1000);

    // Set up MutationObserver to capture new dynamic content
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new MutationObserver((mutations) => {
      let shouldTranslate = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldTranslate = true;
          break;
        }
      }
      
      if (shouldTranslate) {
        // Debounce mutations
        clearTimeout(mutationTimer);
        mutationTimer = setTimeout(translatePage, 1200);
      }
    });

    let mutationTimer: NodeJS.Timeout;
    observer.observe(document.body, { childList: true, subtree: true });
    observerRef.current = observer;

    return () => {
      clearTimeout(timer);
      clearTimeout(mutationTimer);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [pathname, currentLanguage]);

  return null;
}
