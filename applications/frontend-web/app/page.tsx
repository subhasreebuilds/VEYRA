'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F2EDE7] text-[#1F1916] font-sans antialiased selection:bg-[#EADBCE] overflow-x-hidden">
      {/* 1. NAVBAR */}
      <header className="sticky top-0 z-50 w-full bg-[#F8F5F0]/95 backdrop-blur-md border-b border-[#EADCD4]/40 py-4">
        <div className="veyra-container flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="text-2xl font-serif tracking-tight font-bold text-[#1F1916]">
              VEYRA
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wide text-[#5C504A]">
              <Link href="#features" className="hover:text-[#1F1916] transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="hover:text-[#1F1916] transition-colors">
                How It Works
              </Link>
              <Link href="#about" className="hover:text-[#1F1916] transition-colors">
                About
              </Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <div 
                  className="flex items-center gap-3 bg-transparent cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-[#E0E2DF]">
                    <img src="/images/veyra_hero_velera_portrait.png" alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#1F1916]">{user?.email?.split('@')[0] || 'User'}</span>
                    <svg className={`w-3.5 h-3.5 text-[#869188] transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>

                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-56 bg-[#F8F5F0] rounded-[20px] shadow-lg border border-[#EADCD4] py-2 z-50 overflow-hidden">
                      <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#1F2922] hover:bg-white transition-colors" onClick={() => setIsProfileOpen(false)}>
                        <span>📊</span> Dashboard
                      </Link>
                      <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#1F2922] hover:bg-white transition-colors" onClick={() => setIsProfileOpen(false)}>
                        <span>👤</span> Profile & Health
                      </Link>
                      <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#1F2922] hover:bg-white transition-colors" onClick={() => setIsProfileOpen(false)}>
                        <span>⚙️</span> Settings
                      </Link>
                      <div className="border-t border-[#EADCD4] my-2"></div>
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
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-bold text-[#1F1916] hover:opacity-80 px-4 py-2"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="bg-[#334234] text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-[#253226] transition-all shadow-sm flex items-center gap-1.5"
                >
                  Get Started →
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:text-black focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#F8F5F0] border-b border-[#EADCD4] px-6 pt-4 pb-6 space-y-4 shadow-lg">
            <nav className="flex flex-col space-y-3 text-sm font-semibold uppercase tracking-wider text-gray-800">
              <Link href="#features" onClick={() => setMobileMenuOpen(false)}>
                Features
              </Link>
              <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>
                How It Works
              </Link>
              <Link href="#about" onClick={() => setMobileMenuOpen(false)}>
                About
              </Link>
            </nav>
            <div className="pt-4 border-t border-[#EADCD4] flex flex-col space-y-3">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-center font-medium text-gray-800">
                    Dashboard
                  </Link>
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="text-center font-medium text-[#9A4B3E]"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-center font-medium text-gray-800">
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center bg-[#334234] text-white py-3 rounded-full font-medium shadow"
                  >
                    Get Started →
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow w-full space-y-16 lg:space-y-24">
        {/* 2. HERO SECTION */}
        <section className="w-full relative overflow-hidden">
          <div className="w-full grid grid-cols-1 md:grid-cols-12 items-start">
            {/* Left Hero Column */}
            <div className="md:col-span-5 space-y-6 z-10 px-6 md:px-10 xl:px-16 pt-8 pb-10 max-w-[1440px]">
              <div className="inline-block text-[11px] font-bold tracking-widest text-[#6B5A52] uppercase">
                PERSONALIZED WELLNESS, MADE FOR YOU
              </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif text-[#1F1916] leading-[1.12] tracking-tight">
                  Your personal <br />
                  <span className="italic font-serif font-normal text-[#5C504A]">grooming </span>
                  <span className="font-serif font-normal text-[#334234]">&amp;</span> <br />
                  wellness companion.
                </h1>

                <p className="text-sm sm:text-base text-[#6B5A52] max-w-lg leading-relaxed">
                  Personalized skincare, grooming, nutrition, and wellness guidance — designed around you.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <Link
                    href="/register"
                    className="bg-[#334234] text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#253226] transition-all shadow-md inline-flex items-center gap-2"
                  >
                    Get Started →
                  </Link>
                  <Link
                    href="#features"
                    className="bg-white text-[#1F1916] border border-[#334234]/40 px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#FAF4EE] transition-all"
                  >
                    Explore VEYRA
                  </Link>
                </div>

                {/* Social Proof */}
                <div className="pt-4 flex items-center gap-3">
                  <div className="flex -space-x-2 overflow-hidden">
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#F8F5F0] bg-[#8C6D58] text-white flex items-center justify-center text-[10px] font-bold">
                      S
                    </div>
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#F8F5F0] bg-[#708264] text-white flex items-center justify-center text-[10px] font-bold">
                      M
                    </div>
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#F8F5F0] bg-[#4A3E3D] text-white flex items-center justify-center text-[10px] font-bold">
                      A
                    </div>
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#F8F5F0] bg-[#B0937A] text-white flex items-center justify-center text-[10px] font-bold">
                      R
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center text-amber-600 text-xs gap-1">
                      ★★★★★
                    </div>
                    <p className="text-[11px] text-[#6B5A52] font-medium">
                      Trusted by 10,000+ users
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Hero Column — Arched image matching reference */}
              <div className="md:col-span-7 relative h-[540px] md:h-[620px] lg:h-[680px] flex justify-end">
                <div className="relative w-full h-full rounded-tl-[260px] overflow-hidden">
                  <Image
                    src="/images/veyra_hero_silk_robe.png"
                    alt="Veyra Personal Grooming & Wellness Model"
                    fill
                    className="object-cover object-top"
                    priority
                  />
                </div>

                {/* Botanical leaf overlay */}
                <div className="absolute -bottom-4 right-4 z-30 pointer-events-none text-6xl select-none">🌿</div>

                {/* Floating Badge 1: Personalized for you — center-left over image */}
                <div className="absolute bottom-16 left-6 bg-[#FAF7F2]/96 backdrop-blur-md p-4 rounded-2xl border border-[#E8DCD2] shadow-2xl z-20 min-w-[230px]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-amber-800 text-sm">🌱</span>
                    <span className="text-xs font-bold text-[#1F1916]">Personalized for you</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center border-t border-[#E8DCD2]/60 pt-3">
                    <div className="flex flex-col items-center gap-1 border-r border-[#E8DCD2]">
                      <span className="text-base">💧</span>
                      <span className="text-[10px] font-bold text-[#5C504A]">Skin</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 border-r border-[#E8DCD2]">
                      <span className="text-base">🥗</span>
                      <span className="text-[10px] font-bold text-[#5C504A]">Nutrition</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-base">🧘</span>
                      <span className="text-[10px] font-bold text-[#5C504A]">Wellness</span>
                    </div>
                  </div>
                </div>

                {/* Floating Badge 2: Your morning routine */}
                <div className="absolute top-8 right-8 sm:right-12 bg-[#FAF7F2]/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-[#E8DCD2] shadow-2xl z-20 min-w-[210px] sm:min-w-[240px] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E8DCD2]/60 pb-2">
                    <span className="text-xs font-bold text-[#1F1916]">Your morning routine</span>
                    <span className="text-amber-600 text-xs">☀️</span>
                  </div>
                  <ul className="text-[11px] text-[#5C504A] space-y-2 font-medium">
                    <li className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#708264] text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                        <span>Hydration</span>
                      </div>
                      <span className="text-[10px] text-gray-400">Done</span>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#708264] text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                        <span>Skincare</span>
                      </div>
                      <span className="text-[10px] text-gray-400">Done</span>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#708264] text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                        <span>Breakfast</span>
                      </div>
                      <span className="text-[10px] text-gray-400">Done</span>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#708264] text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                        <span>Movement</span>
                      </div>
                      <span className="text-[10px] text-[#708264] font-semibold">20 min</span>
                    </li>
                  </ul>
                </div>

              {/* Botanical Leaf Overlay Branch */}
              <div className="absolute -bottom-8 -right-6 z-30 pointer-events-none text-5xl">
                🌿
              </div>
            </div>
          </div>
        </section>

        {/* 3. CATEGORY ICON STRIP */}
        <section className="w-full">
          <div className="veyra-container">
            <div className="bg-[#EFE7E0] rounded-2xl p-6 border border-[#E2D4C8] space-y-4">
              <h3 className="text-center text-xs font-serif font-bold text-[#1F1916] tracking-tight text-sm sm:text-base">
                One place for your everyday wellness
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#E0D5CB] text-center pt-2">
                {[
                  { label: 'Skin', icon: '🌿' },
                  { label: 'Grooming', icon: '🧴' },
                  { label: 'Nutrition', icon: '🥗' },
                  { label: 'Recipes', icon: '🍳' },
                  { label: 'Wellness', icon: '🧘' },
                  { label: 'Progress', icon: '📊' },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="py-2 px-4 flex items-center justify-center gap-2.5 text-xs font-semibold text-[#1F1916] hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. BENTO GRID FEATURES SECTION */}
        <section id="features" className="w-full">
          <div className="veyra-container space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#1F1916] tracking-tight">
              Everything you need to take better care of yourself.
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Left AI Skin Analysis Card */}
              <div className="lg:col-span-5 bg-[#EFE7E0] p-8 sm:p-10 rounded-[36px] border border-[#E2D4C8] flex flex-col justify-between space-y-8 overflow-hidden">
                <div className="space-y-4">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-white/90 text-xs font-extrabold tracking-widest text-[#334234] uppercase border border-[#E2D4C8]">
                    AI POWERED
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-serif text-[#1F1916]">AI Skin Analysis</h3>
                  <p className="text-sm sm:text-base text-[#6B5A52] leading-relaxed max-w-sm">
                    Understand your skin and get personalized guidance with AI.
                  </p>
                  <Link href="/register" className="inline-block text-sm font-bold text-[#1F1916] hover:underline">
                    Learn more →
                  </Link>
                </div>

                {/* Enlarged Phone Mockup Graphic with Face Scan Image */}
                <div className="relative bg-white rounded-[32px] border-4 border-stone-200 shadow-2xl overflow-hidden w-full max-w-[280px] sm:max-w-[310px] mx-auto shrink-0 space-y-3 pb-4">
                  {/* Speaker notch */}
                  <div className="w-14 h-1.5 bg-stone-200 rounded-full mx-auto mt-2.5 mb-1" />
                  
                  {/* Model Face Image with Scan reticle */}
                  <div className="relative w-full h-[180px] sm:h-[210px] overflow-hidden">
                    <Image
                      src="/images/veyra_hero_velera_portrait.png"
                      alt="AI Face Scan Analysis"
                      fill
                      className="object-cover object-top"
                    />
                    {/* Glowing AI face scan reticle */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full border-2 border-emerald-400/90 animate-pulse flex items-center justify-center bg-emerald-500/15">
                        <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-md" />
                      </div>
                    </div>
                    {/* Score badge overlay on image */}
                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-extrabold text-[#1F1916] border border-stone-200 shadow-md">
                      82 / 100
                    </div>
                  </div>

                  {/* Skin health breakdown */}
                  <div className="px-5 text-xs space-y-2 text-left pt-1">
                    <p className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest text-center">Skin Analysis Result</p>
                    <div className="flex justify-between border-b border-stone-100 pb-1.5">
                      <span className="text-stone-600 font-medium">Hydration</span>
                      <span className="font-bold text-emerald-700">Good</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-100 pb-1.5">
                      <span className="text-stone-600 font-medium">Texture</span>
                      <span className="font-bold text-emerald-700">Good</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-100 pb-1.5">
                      <span className="text-stone-600 font-medium">Redness</span>
                      <span className="font-bold text-amber-600">Mild</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600 font-medium">Acne</span>
                      <span className="font-bold text-emerald-700">Clear</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side Bento Grid Stack */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* Top row: 2 horizontal cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Card 1: Personalized Routines */}
                  <div className="bg-[#EFE7E0] p-6 sm:p-8 rounded-[32px] border border-[#E2D4C8] flex flex-row items-center justify-between gap-4 overflow-hidden">
                    <div className="space-y-2 flex-1 min-w-0">
                      <h4 className="text-lg sm:text-xl font-serif font-bold text-[#1F1916]">Personalized Routines</h4>
                      <p className="text-xs sm:text-sm text-[#6B5A52] leading-relaxed">
                        Build skincare and grooming routines that fit your needs.
                      </p>
                      <Link href="/register" className="inline-block text-xs sm:text-sm font-bold text-[#1F1916] hover:underline pt-1">
                        Learn more →
                      </Link>
                    </div>
                    <div className="relative w-[130px] sm:w-[150px] h-[110px] sm:h-[130px] rounded-2xl overflow-hidden shrink-0 border border-[#E2D4C8] shadow-sm">
                      <Image
                        src="/images/features_skincare.png"
                        alt="Personalized Routines"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Card 2: Nutrition */}
                  <div className="bg-[#EFE7E0] p-6 sm:p-8 rounded-[32px] border border-[#E2D4C8] flex flex-row items-center justify-between gap-4 overflow-hidden">
                    <div className="space-y-2 flex-1 min-w-0">
                      <h4 className="text-lg sm:text-xl font-serif font-bold text-[#1F1916]">Nutrition</h4>
                      <p className="text-xs sm:text-sm text-[#6B5A52] leading-relaxed">
                        Get meal ideas personalized to your goals and preferences.
                      </p>
                      <Link href="/register" className="inline-block text-xs sm:text-sm font-bold text-[#1F1916] hover:underline pt-1">
                        Learn more →
                      </Link>
                    </div>
                    <div className="relative w-[110px] sm:w-[130px] h-[110px] sm:h-[130px] rounded-full overflow-hidden shrink-0 border border-[#E2D4C8] shadow-sm">
                      <Image
                        src="/images/veyra_bento_nutrition.png"
                        alt="Nutrition"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom row: 3 cards matching reference */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1">
                  {/* Card 3: Smart Recipes */}
                  <div className="bg-[#EFE7E0] p-6 rounded-[32px] border border-[#E2D4C8] flex flex-col justify-between gap-4 overflow-hidden">
                    <div className="space-y-2">
                      <h4 className="text-base sm:text-lg font-serif font-bold text-[#1F1916]">Smart Recipes</h4>
                      <p className="text-xs text-[#6B5A52] leading-relaxed">
                        Discover recipes based on your preferences and what's available.
                      </p>
                      <Link href="/register" className="inline-block text-xs font-bold text-[#1F1916] hover:underline">
                        Learn more →
                      </Link>
                    </div>
                    <div className="relative w-full h-[130px] sm:h-[150px] rounded-2xl overflow-hidden shrink-0 border border-[#E2D4C8] shadow-sm">
                      <Image
                        src="/images/hero_wellness.png"
                        alt="Smart Recipes"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Card 4: Product Recommendations */}
                  <div className="bg-[#EFE7E0] p-6 rounded-[32px] border border-[#E2D4C8] flex flex-col justify-between gap-4 overflow-hidden">
                    <div className="space-y-2">
                      <h4 className="text-base sm:text-lg font-serif font-bold text-[#1F1916]">Product Recommendations</h4>
                      <p className="text-xs text-[#6B5A52] leading-relaxed">
                        Find products that match your needs and budget.
                      </p>
                      <Link href="/register" className="inline-block text-xs font-bold text-[#1F1916] hover:underline">
                        Learn more →
                      </Link>
                    </div>
                    <div className="relative w-full h-[130px] sm:h-[150px] rounded-2xl overflow-hidden shrink-0 border border-[#E2D4C8] shadow-sm">
                      <Image
                        src="/images/veyra_serum_bottle.png"
                        alt="Product Recommendations"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Card 5: Progress Tracking */}
                  <div className="bg-[#EFE7E0] p-6 rounded-[32px] border border-[#E2D4C8] flex flex-col justify-between gap-4 overflow-hidden">
                    <div className="space-y-2">
                      <h4 className="text-base sm:text-lg font-serif font-bold text-[#1F1916]">Progress Tracking</h4>
                      <p className="text-xs text-[#6B5A52] leading-relaxed">
                        Track your wellness and personal progress over time effortlessly.
                      </p>
                      <Link href="/register" className="inline-block text-xs font-bold text-[#1F1916] hover:underline">
                        Learn more →
                      </Link>
                    </div>
                    {/* Enlarged chart card */}
                    <div className="bg-white/90 rounded-2xl p-4 border border-[#E2D4C8] space-y-2 shadow-sm">
                      <div className="flex justify-between items-center text-xs font-bold text-[#1F1916] uppercase">
                        <span>This week</span>
                        <span className="text-emerald-700 font-extrabold">↗ +12%</span>
                      </div>
                      <svg viewBox="0 0 100 28" className="w-full h-12">
                        <polyline
                          points="0,22 18,18 36,20 54,10 72,12 100,4"
                          fill="none"
                          stroke="#334234"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. HOW IT WORKS SECTION */}
        <section id="how-it-works" className="w-full">
          <div className="veyra-container">
            <div className="bg-[#EFE7E0] rounded-3xl p-8 sm:p-12 border border-[#E2D4C8] space-y-8">
              <h2 className="text-2xl sm:text-3xl font-serif text-[#1F1916]">How it works</h2>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Left 3 Step Columns */}
                <div className="md:col-span-7 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Step 1 */}
                    <div className="space-y-2">
                      <div className="w-9 h-9 rounded-full bg-white text-[#1F1916] border border-[#E2D4C8] flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                        01
                      </div>
                      <h4 className="font-bold text-sm text-[#1F1916]">Tell VEYRA about yourself.</h4>
                      <p className="text-xs text-[#6B5A52]">
                        Share your goals, lifestyle, preferences, and routines.
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="space-y-2">
                      <div className="w-9 h-9 rounded-full bg-white text-[#1F1916] border border-[#E2D4C8] flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                        02
                      </div>
                      <h4 className="font-bold text-sm text-[#1F1916]">Get personalized recommendations.</h4>
                      <p className="text-xs text-[#6B5A52]">
                        Receive tailored routines, meals, and product suggestions.
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="space-y-2">
                      <div className="w-9 h-9 rounded-full bg-white text-[#1F1916] border border-[#E2D4C8] flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                        03
                      </div>
                      <h4 className="font-bold text-sm text-[#1F1916]">Build better daily habits.</h4>
                      <p className="text-xs text-[#6B5A52]">
                        Follow your plan and track your progress over time.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Image */}
                <div className="md:col-span-5 relative h-[240px] sm:h-[280px] rounded-2xl overflow-hidden border border-[#E2D4C8] shadow-md">
                  <Image
                    src="/images/veyra_hero_model_portrait.png"
                    alt="Woman reviewing personalized Veyra plan"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. ONE PROFILE. EVERYTHING PERSONALIZED. SECTION */}
        <section className="w-full">
          <div className="veyra-container">
            <div className="bg-[#EFE7E0] rounded-3xl p-8 sm:p-12 border border-[#E2D4C8]">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Left Profile Card Mockup & Connected Floating Pills */}
                <div className="md:col-span-6 space-y-4 relative">
                  <div className="bg-white p-6 rounded-3xl border border-[#E2D4C8] shadow-md space-y-4 max-w-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <h4 className="font-bold text-[#1F1916] text-xs">Your Profile</h4>
                      <span className="text-[11px] text-emerald-700 font-bold">Edit</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-[#FAF4EE] p-3 rounded-xl border border-[#EADCD4]">
                        <p className="text-gray-400 text-[10px]">Goal</p>
                        <p className="font-bold text-[#1F1916] mt-0.5 text-[11px]">General Wellness</p>
                      </div>
                      <div className="bg-[#FAF4EE] p-3 rounded-xl border border-[#EADCD4]">
                        <p className="text-gray-400 text-[10px]">Activity</p>
                        <p className="font-bold text-[#1F1916] mt-0.5 text-[11px]">Moderately Active</p>
                      </div>
                      <div className="bg-[#FAF4EE] p-3 rounded-xl border border-[#EADCD4]">
                        <p className="text-gray-400 text-[10px]">Diet</p>
                        <p className="font-bold text-[#1F1916] mt-0.5 text-[11px]">Vegetarian</p>
                      </div>
                      <div className="bg-[#FAF4EE] p-3 rounded-xl border border-[#EADCD4]">
                        <p className="text-gray-400 text-[10px]">Focus</p>
                        <p className="font-bold text-[#1F1916] mt-0.5 text-[11px]">Skin + Nutrition</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating Node Pills */}
                  <div className="hidden sm:block absolute -top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#E2D4C8] shadow-md text-[11px] font-medium text-[#1F1916]">
                    🌅 Morning Routine <span className="text-gray-400 text-[9px]">4 steps ›</span>
                  </div>
                  <div className="hidden sm:block absolute top-16 right-0 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#E2D4C8] shadow-md text-[11px] font-medium text-[#1F1916]">
                    🥗 Healthy Meal <span className="text-emerald-700 text-[9px]">520 kcal ›</span>
                  </div>
                  <div className="hidden sm:block absolute bottom-12 right-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#E2D4C8] shadow-md text-[11px] font-medium text-[#1F1916]">
                    💡 Grooming Tip <span className="text-gray-400 text-[9px]">For your skin type ›</span>
                  </div>
                  <div className="hidden sm:block absolute -bottom-4 right-16 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#E2D4C8] shadow-md text-[11px] font-medium text-[#1F1916]">
                    🏃 Wellness Goal <span className="text-emerald-700 text-[9px]">7,500 steps ›</span>
                  </div>
                </div>

                {/* Right Profile Column Text */}
                <div className="md:col-span-6 space-y-6">
                  <h2 className="text-3xl sm:text-4xl font-serif text-[#1F1916] leading-tight">
                    One profile. <br /> Everything personalized.
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6B5A52] leading-relaxed max-w-md">
                    VEYRA learns your goals, lifestyle, preferences, routines, and needs to make every recommendation more relevant to you.
                  </p>
                  <div>
                    <Link
                      href="/register"
                      className="bg-[#334234] text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#253226] transition-all shadow-sm inline-flex items-center gap-2"
                    >
                      Get Started →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. EVERYTHING YOU NEED IN ONE PLACE (DASHBOARD PREVIEW) */}
        <section className="w-full">
          <div className="veyra-container">
            <div className="bg-[#EFE7E0] rounded-3xl p-8 sm:p-12 border border-[#E2D4C8]">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Left Column Text */}
                <div className="md:col-span-4 space-y-4">
                  <h2 className="text-3xl sm:text-4xl font-serif text-[#1F1916] leading-tight">
                    Everything you need, <br /> in one place.
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6B5A52] leading-relaxed">
                    Your personalized dashboard for a better you.
                  </p>
                  <div>
                    <Link href="#how-it-works" className="text-xs font-bold text-[#1F1916] hover:underline">
                      See how it works →
                    </Link>
                  </div>
                </div>

                {/* Right Column Dashboard Mockup */}
                <div className="md:col-span-8 bg-white rounded-3xl border border-[#E2D4C8] shadow-xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h4 className="font-serif text-lg text-[#1F1916]">Good morning, Subhasree 👋</h4>
                      <p className="text-xs text-[#6B5A52]">Let's take care of you today.</p>
                    </div>
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#E2D4C8] shadow-sm">
                      <Image
                        src="/images/veyra_hero_model_portrait.png"
                        alt="Subhasree Avatar"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-[#FAF4EE] p-3.5 rounded-xl border border-[#EADCD4]">
                      <p className="text-gray-400 text-[10px]">Skin Health Score</p>
                      <p className="text-lg font-bold text-[#1F1916] mt-0.5">82 / 100</p>
                      <span className="text-[10px] text-emerald-700 font-bold">Good</span>
                    </div>
                    <div className="bg-[#FAF4EE] p-3.5 rounded-xl border border-[#EADCD4]">
                      <p className="text-gray-400 text-[10px]">Today's Routine</p>
                      <p className="text-lg font-bold text-[#1F1916] mt-0.5">4 / 5</p>
                      <span className="text-[10px] text-emerald-700 font-bold">Completed</span>
                    </div>
                    <div className="bg-[#FAF4EE] p-3.5 rounded-xl border border-[#EADCD4]">
                      <p className="text-gray-400 text-[10px]">Daily Calories</p>
                      <p className="text-lg font-bold text-[#1F1916] mt-0.5">1,450 / 1.8k</p>
                      <span className="text-[10px] text-emerald-700 font-bold">Good</span>
                    </div>
                    <div className="bg-[#FAF4EE] p-3.5 rounded-xl border border-[#EADCD4]">
                      <p className="text-gray-400 text-[10px]">Water Intake</p>
                      <p className="text-lg font-bold text-[#1F1916] mt-0.5">1.6 / 2 L</p>
                      <span className="text-[10px] text-amber-600 font-bold">Keep going</span>
                    </div>
                  </div>

                  {/* Today's Plan & Recommended Meal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-[#FAF4EE] p-4 rounded-xl border border-[#EADCD4] space-y-2">
                      <p className="font-bold text-[#1F1916]">Today's Plan</p>
                      <ul className="space-y-1.5 text-[11px] text-[#5C504A]">
                        <li className="flex justify-between">
                          <span>✓ Morning skincare routine</span>
                          <span className="text-emerald-700 font-bold">Completed</span>
                        </li>
                        <li className="flex justify-between">
                          <span>✓ High-protein breakfast</span>
                          <span className="text-emerald-700 font-bold">Completed</span>
                        </li>
                        <li className="flex justify-between">
                          <span>⏳ 20-min walk</span>
                          <span className="text-amber-600 font-bold">In progress</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#FAF4EE] p-4 rounded-xl border border-[#EADCD4] space-y-2">
                      <p className="font-bold text-[#1F1916]">Recommended Meal</p>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                          <Image
                            src="/images/veyra_bento_nutrition.png"
                            alt="Quinoa salad bowl"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-[11px]">Quinoa Wellness Bowl</p>
                          <p className="text-[10px] text-gray-500">High protein • 480 kcal</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. AI SECTION & SAFETY TRUST DISCLAIMER */}
        <section className="w-full">
          <div className="veyra-container space-y-6">
            {/* AI Banner Card */}
            <div className="bg-[#2B3B2C] text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-3 max-w-lg">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif leading-tight">
                  Personal care, <br /> powered by intelligence.
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  VEYRA uses your profile, goals, preferences, and routines to provide guidance that becomes more relevant over time.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 space-y-3 min-w-[280px]">
                <p className="text-xs font-bold text-emerald-300">Good morning, Subhasree ✨</p>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="bg-white/20 px-3 py-1 rounded-full">Morning skincare</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">Protein-rich breakfast</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">20 min movement</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">Hydration</span>
                </div>
                <p className="text-[10px] text-gray-300 pt-1 border-t border-white/10">
                  Why this works for you: Based on your goals, skin type, activity level, and preferences.
                </p>
              </div>
            </div>

            {/* Safety / Trust Disclaimer Strip */}
            <div className="bg-[#EFE7E0] rounded-2xl p-6 border border-[#E2D4C8] flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-10 h-10 rounded-full bg-[#1F1916] text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                🛡️
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#1F1916] uppercase tracking-wider">
                  Guidance designed around you.
                </h4>
                <p className="text-[11px] text-[#6B5A52] leading-relaxed">
                  VEYRA provides general grooming and wellness guidance based on the information you provide. AI skin insights are informational and are not a medical diagnosis or replacement for professional care.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 9. FINAL CTA SECTION */}
        <section className="w-full">
          <div className="veyra-container">
            <div className="bg-[#EFE7E0] rounded-3xl overflow-hidden border border-[#E2D4C8] grid grid-cols-1 md:grid-cols-12 items-center">
              <div className="md:col-span-5 relative h-[260px] lg:h-full min-h-[280px]">
                <Image
                  src="/images/veyra_cta_cozy_interior.png"
                  alt="Cozy wellness home interior"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="md:col-span-7 p-8 sm:p-14 text-left space-y-6">
                <h2 className="text-3xl sm:text-4xl font-serif text-[#1F1916] tracking-tight">
                  Feel better. Look after yourself. Make it yours.
                </h2>
                <p className="text-xs sm:text-sm text-[#6B5A52] max-w-md">
                  Build a personalized routine for your skin, grooming, nutrition, and everyday wellness.
                </p>
                <div>
                  <Link
                    href="/register"
                    className="bg-[#334234] text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#253226] transition-all shadow-sm inline-flex items-center gap-2"
                  >
                    Get Started →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 10. FOOTER */}
      <footer className="w-full bg-[#F8F5F0] border-t border-[#E2D4C8] mt-16 py-12">
        <div className="veyra-container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-bold text-[#1F1916]">VEYRA</h3>
              <p className="text-xs text-[#6B5A52]">Your personal grooming &amp; wellness companion.</p>
            </div>
            <div>
              <h5 className="text-xs font-bold text-[#1F1916] uppercase mb-3">Product</h5>
              <ul className="text-xs text-[#6B5A52] space-y-2">
                <li><Link href="#features">Features</Link></li>
                <li><Link href="#how-it-works">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-bold text-[#1F1916] uppercase mb-3">Company</h5>
              <ul className="text-xs text-[#6B5A52] space-y-2">
                <li><Link href="#about">About</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-bold text-[#1F1916] uppercase mb-3">Account</h5>
              <ul className="text-xs text-[#6B5A52] space-y-2">
                <li><Link href="/login" className="hover:underline">Login</Link></li>
                <li><Link href="/register" className="hover:underline">Register</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-[#E2D4C8] flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-4">
            <p>&copy; 2026 VEYRA. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="#" className="hover:underline">Privacy Policy</Link>
              <Link href="#" className="hover:underline">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
