'use client';

import React, { useState, Suspense } from 'react';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await refreshUser();
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Back to Home Link */}
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B5A52] hover:text-[#1F1916] transition-colors py-1.5 px-3 rounded-full hover:bg-[#EADBCE]/50 border border-transparent hover:border-[#E8DCD2]"
        >
          <span>←</span> Back to home
        </Link>
      </div>

      {registered && (
        <div className="mb-6 p-4 bg-[#E8EFE6] text-[#2D452F] text-xs font-semibold rounded-2xl border border-[#708264]/30 shadow-sm flex items-start gap-2.5">
          <span className="text-base">✨</span>
          <div>
            <p className="font-bold">Account created successfully!</p>
            <p className="text-[11px] opacity-90 mt-0.5">Please sign in with your credentials to enter your dashboard.</p>
          </div>
        </div>
      )}

      <div className="space-y-2 mb-8">
        <div className="inline-block text-[10px] font-bold tracking-widest text-[#708264] uppercase bg-[#E8EFE6] px-3 py-1 rounded-full border border-[#708264]/20">
          MEMBER ACCESS
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1916] tracking-tight">
          Welcome back
        </h1>
        <p className="text-xs sm:text-sm text-[#6B5A52] font-medium">
          Don't have an account?{' '}
          <Link
            href="/register"
            className="font-bold text-[#334234] hover:underline underline-offset-4 transition-all"
          >
            Create one for free →
          </Link>
        </p>
      </div>



      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="p-4 bg-red-50 text-red-800 text-xs font-semibold rounded-2xl border border-red-200 shadow-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5C504A] mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              className="block w-full rounded-2xl border border-[#E8DCD2] px-4 py-3.5 text-sm text-[#1F1916] placeholder-[#A09289] shadow-sm focus:border-[#334234] focus:ring-1 focus:ring-[#334234] bg-white transition-all outline-none"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5C504A]">
                Password
              </label>
              <Link href="#" className="text-xs font-semibold text-[#708264] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="block w-full rounded-2xl border border-[#E8DCD2] px-4 py-3.5 text-sm text-[#1F1916] placeholder-[#A09289] shadow-sm focus:border-[#334234] focus:ring-1 focus:ring-[#334234] bg-white transition-all outline-none pr-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-bold text-[#6B5A52] hover:text-[#1F1916] focus:outline-none"
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded border-[#E8DCD2] text-[#334234] focus:ring-[#334234]"
          />
          <label htmlFor="remember-me" className="ml-2.5 block text-xs font-medium text-[#5C504A]">
            Keep me signed in on this device
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-4 px-6 border border-transparent rounded-full shadow-md text-xs font-bold uppercase tracking-wider text-white bg-[#334234] hover:bg-[#253226] focus:outline-none transition-all disabled:opacity-70 mt-2 cursor-pointer"
        >
          {isLoading ? 'Signing in...' : 'Sign In →'}
        </button>
      </form>
    </div>
  );
}

export default function Login() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8F5F0] font-sans text-[#1F1916] antialiased selection:bg-[#EADBCE]">
      {/* Left/Top Column: High-Definition Image Visual */}
      <div className="flex lg:w-1/2 relative min-h-[40vh] sm:min-h-[50vh] lg:min-h-screen p-8 lg:p-12 flex-col justify-between overflow-hidden">
        <Image
          src="/images/veyra_hero_silk_robe.png"
          alt="Veyra Luxury Wellness"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Soft Dark Luxury Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F1916]/90 via-[#1F1916]/40 to-black/20" />
        
        {/* Header / Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-block relative w-32 h-32 md:w-40 md:h-40 hover:scale-105 transition-transform duration-300">
            <Image
              src="/images/veyra-logo-serif.jpg"
              alt="Veyra Logo"
              fill
              className="object-contain drop-shadow-lg rounded-2xl"
              priority
            />
          </Link>
        </div>

        {/* Bottom-left Content / Floating Glass Card */}
        <div className="relative z-10 mt-auto max-w-md space-y-4 lg:space-y-6 text-left pt-12 lg:pt-0">
          {/* Glassmorphism Card */}
          <div className="bg-white/15 backdrop-blur-md p-5 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl border border-white/25 shadow-2xl text-white space-y-2 lg:space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-300 text-sm">🌿</span>
              <span className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-amber-200">Welcome Back Portal</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white leading-tight">
              Your personal wellness companion.
            </h2>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-medium">
              Log in to track your skincare progress, access tailored nutrition recipes, and consult your AI co-pilot.
            </p>
          </div>
        </div>
      </div>

      {/* Right/Bottom Column: Authentication Form with Suspense boundary */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 xl:px-28 py-10 lg:py-12 bg-[#F8F5F0]">
        <Suspense fallback={<div className="text-center text-sm text-[#6B5A52]">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
