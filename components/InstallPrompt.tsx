'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      console.log('beforeinstallprompt event fired!');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the install prompt
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      isIOSStandalone ||
                      document.referrer.includes('android-app://');

    setIsStandalone(standalone);
    if (standalone) {
      setShowPrompt(false);
    }

    // Show manual button after 3 seconds if no install prompt appeared
    const timer = setTimeout(() => {
      if (!standalone && !deferredPrompt) {
        setShowManualInstructions(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 7 days
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  // Check if user dismissed recently (within 7 days)
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowPrompt(false);
      }
    }
  }, []);

  return (
    <>
      <AnimatePresence>
        {showPrompt && deferredPrompt && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
          >
            <div className="backdrop-blur-md bg-gradient-to-r from-primary to-primary rounded-2xl shadow-2xl p-6 border border-border/50">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg
                    className="h-8 w-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-1">Install VaultKeep</h3>
                  <p className="text-primary-foreground text-sm mb-4">
                    Install our app for quick access and better experience. Works offline!
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleInstallClick}
                      className="flex-1 bg-white text-primary font-semibold py-2 px-4 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      Install
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="flex-1 bg-primary/90/50 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Not Now
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Install Instructions */}
      <AnimatePresence>
        {showManualInstructions && !isStandalone && !showPrompt && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
          >
            <div className="backdrop-blur-md bg-white/95 rounded-2xl shadow-2xl p-6 border border-border">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 font-bold text-lg mb-1">Install as App</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    To install VaultKeep:
                  </p>
                  <div className="text-sm text-gray-700 space-y-2 mb-4">
                    <p><span className="font-semibold">Desktop:</span> Click the install icon (⊕) in the address bar</p>
                    <p><span className="font-semibold">Mobile:</span> Tap Menu (⋮) → &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;</p>
                  </div>
                  <button
                    onClick={() => setShowManualInstructions(false)}
                    className="w-full bg-gradient-to-r from-primary to-primary text-white font-semibold py-2 px-4 rounded-lg hover:from-primary/90 hover:to-primary transition-colors"
                  >
                    Got it!
                  </button>
                </div>
                <button
                  onClick={() => setShowManualInstructions(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
