'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Skin Analysis', href: '/skin-analysis', icon: '✨' },
    { name: 'Grooming & Skincare', href: '/grooming', icon: '🌿' },
    { name: 'Nutrition', href: '/nutrition', icon: '🥗' },
    { name: 'Smart Recipes', href: '/recipes', icon: '🍳' },
    { name: 'Product Picks', href: '/products', icon: '🧴' },
    { name: 'Progress Tracking', href: '/progress', icon: '📈' },
  ];

  const secondaryNavigation = [
    { name: 'Profile & Health', href: '/profile', icon: '👤' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  const currentNav = navigation.find(n => n.href === pathname) || secondaryNavigation.find(n => n.href === pathname);

  return (
    <div className="flex h-screen bg-[#FAF8F5] text-[#2C3E35] font-sans antialiased selection:bg-[#EAE6DF]">
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm xl:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-[#FAF8F5] transform transition-transform duration-300 ease-in-out xl:relative xl:translate-x-0 flex flex-col justify-between py-6 px-4 sm:py-8 sm:px-6
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="flex flex-col flex-1">
          {/* Logo Brand Header */}
          <div className="flex items-center justify-between mb-10 pl-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-serif font-semibold tracking-wider text-[#1F2922]">
                VEYRA
              </span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="xl:hidden p-1 text-[#6A786E] hover:text-[#1F2922] rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 space-y-1.5">
            {[
              { name: 'Home', href: '/dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg> },
              { name: 'Skin Analysis', href: '/skin-analysis', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
              { name: 'Grooming', href: '/grooming', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg> },
              { name: 'Nutrition', href: '/nutrition', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h7"></path></svg> },
              { name: 'Recipes', href: '/recipes', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg> },
              { name: 'Products', href: '/products', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg> },
              { name: 'Progress', href: '/progress', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg> },
            ].map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    group flex items-center gap-3.5 px-4 py-3 text-[13px] font-medium rounded-2xl transition-all
                    ${isActive 
                      ? 'bg-[#E7EBE8] text-[#1F2922]' 
                      : 'text-[#6A786E] hover:bg-[#EAE6DF]/50 hover:text-[#1F2922]'}
                  `}
                >
                  <span className={`flex items-center justify-center ${isActive ? 'text-[#516454]' : 'text-[#869188] group-hover:text-[#516454]'}`}>
                    {isActive && item.name === 'Skin Analysis' ? (
                      <div className="bg-white p-1 rounded-md shadow-sm border border-[#DCD9D4]">
                        <svg className="w-4 h-4 text-[#516454]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                    ) : item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Card */}
          <div className="mt-8 relative overflow-hidden rounded-[24px] bg-[#EAE6DF] h-64 p-6 shadow-sm border border-[#E0E2DF]">
            {/* Soft leaf overlay effect */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[url('https://images.unsplash.com/photo-1599824240776-6ee29f4f46a2?q=80&w=200&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-multiply rounded-full blur-sm"></div>
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-[url('https://images.unsplash.com/photo-1599824240776-6ee29f4f46a2?q=80&w=200&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-multiply rounded-full blur-sm"></div>
            
            <div className="relative z-10 flex flex-col justify-end h-full">
              <h4 className="text-[17px] font-serif text-[#1F2922] font-semibold leading-snug mb-3">
                Healthy skin<br/>is a reflection<br/>of a healthy you.
              </h4>
              <p className="text-[11px] text-[#5C6B61] font-medium">— Veyra</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#FAF8F5]">
        {/* Header (Search + Profile) */}
        <header className="relative flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 shrink-0 z-30">
          <div className="flex items-center flex-1 max-w-xl">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="xl:hidden p-2 mr-3 text-[#5C6B61] hover:text-[#1F2922]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>

          </div>

          <div className="flex items-center gap-2 sm:gap-5 ml-auto">
            <button className="relative text-[#1F2922] bg-white p-2 rounded-full shadow-sm hover:shadow transition-shadow border border-[#E0E2DF]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>

            <div className="relative">
              <div 
                className="flex items-center gap-3 bg-transparent cursor-pointer"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border border-[#E0E2DF]">
                  <img src="/images/veyra_hero_velera_portrait.png" alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[#1F2922]">{user?.email?.split('@')[0] || 'Subhasree Lenka'}</span>
                  <svg className={`w-3.5 h-3.5 text-[#869188] transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-[20px] shadow-lg border border-[#E0E2DF] py-2 z-50 overflow-hidden">
                    <div className="px-4 py-2 border-b border-[#EAE6DF] mb-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#869188]">Account</div>
                    </div>
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#1F2922] hover:bg-[#FAF8F5] transition-colors" onClick={() => setIsProfileOpen(false)}>
                      <span>👤</span> Profile & Health
                    </Link>
                    <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#1F2922] hover:bg-[#FAF8F5] transition-colors" onClick={() => setIsProfileOpen(false)}>
                      <span>⚙️</span> Settings
                    </Link>
                    <div className="border-t border-[#EAE6DF] my-2"></div>
                    <button 
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#9A4B3E] hover:bg-red-50 transition-colors text-left"
                    >
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
