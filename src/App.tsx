/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FLAVORS } from './data/flavors.ts';
import { FlavorItem, CartItem, PageRoute } from './types/index.ts';
import { AtmosphericBackground, BackdropVariant } from './components/AtmosphericBackground.tsx';
import { useSmoothScroll } from './hooks/useSmoothScroll.ts';
import { TranslucentNavbar } from './components/TranslucentNavbar.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ShopPage } from './pages/ShopPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { FindUsPage } from './pages/FindUsPage.tsx';
import { CartPage } from './pages/CartPage.tsx';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<PageRoute>('home');
  const [selectedFlavor, setSelectedFlavor] = useState<FlavorItem>(FLAVORS[0]); // Glacier Mint by default
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useSmoothScroll(true);

  // Sync hash with route for browser navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (['home', 'shop', 'about', 'find-us', 'cart'].includes(hash)) {
        setCurrentRoute(hash as PageRoute);
      } else if (!hash) {
        setCurrentRoute('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: PageRoute) => {
    setCurrentRoute(route);
    window.location.hash = `#/${route}`;
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((curr) => (curr === message ? null : curr));
    }, 2800);
  };

  const handleAddToCart = (
    flavor: FlavorItem,
    packSize: '6-pack' | '12-pack',
    purchaseType: 'one-time' | 'subscribe'
  ) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.flavor.id === flavor.id &&
          item.packSize === packSize &&
          item.purchaseType === purchaseType
      );

      if (existingIdx > -1) {
        return prev.map((item, idx) =>
          idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...prev, { flavor, packSize, purchaseType, quantity: 1 }];
    });

    showToast(`ADDED ${flavor.headlineTitle.toUpperCase()} (${packSize}) TO CART`);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((_, idx) => idx !== index));
    } else {
      setCart((prev) =>
        prev.map((item, idx) => (idx === index ? { ...item, quantity } : item))
      );
    }
  };

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const backdrop: BackdropVariant =
    currentRoute === 'home' ? 'home' : currentRoute === 'shop' || currentRoute === 'cart' ? 'steel' : 'night';

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="relative min-h-screen text-white flex flex-col font-display antialiased selection:bg-white selection:text-black bg-transparent">
      <AtmosphericBackground variant={backdrop} />

      {/* Translucent Toast Notification */}
      {toastMessage && (
        <aside
          aria-live="polite"
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="glass text-white px-6 py-2.5 rounded-[100px] font-mono-tag text-[11px] uppercase flex items-center gap-2">
            <span>✓</span>
            <span>{toastMessage}</span>
          </div>
        </aside>
      )}

      <TranslucentNavbar currentRoute={currentRoute} cartCount={totalCartCount} onNavigate={navigateTo} />

      {/* Active Page View */}
      <main className="flex-1 flex flex-col bg-transparent">
        {currentRoute === 'home' && (
          <HomePage
            onSelectFlavorForShop={(flavor) => {
              setSelectedFlavor(flavor);
            }}
            onNavigateToShop={() => navigateTo('shop')}
          />
        )}

        {currentRoute === 'shop' && (
          <ShopPage
            currentFlavor={selectedFlavor}
            onSelectFlavor={setSelectedFlavor}
            onAddToCart={handleAddToCart}
            onNavigateToCart={() => navigateTo('cart')}
          />
        )}

        {currentRoute === 'about' && <AboutPage onNavigate={navigateTo} />}

        {currentRoute === 'find-us' && <FindUsPage />}

        {currentRoute === 'cart' && (
          <CartPage
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onNavigateToShop={() => navigateTo('shop')}
          />
        )}
      </main>
    </div>
  );
}
