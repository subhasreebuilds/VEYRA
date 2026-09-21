'use client';

import React, { useState } from 'react';
import { fetchApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Turnstile, TurnstileInstance } from '@marsidev/react-turnstile';

const getTurnstileSiteKey = () => {
  return process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";
};

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const turnstileRef = React.useRef<TurnstileInstance>(null);
  const { refreshUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    if (!turnstileToken) {
      setError('Please complete the security check.');
      return;
    }

    setIsLoading(true);

    try {
      await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, turnstileToken }),
      });

      // Seamlessly log in newly registered user to jump straight into personalized onboarding
      try {
        await fetchApi('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        await refreshUser();
        router.push('/onboarding');
      } catch (loginErr) {
        router.push('/login?registered=true');
      }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.message || 'Failed to create account. Please try again.');
      setTurnstileToken(''); // Clear the token state
      turnstileRef.current?.reset(); // Visually reset the widget so they can get a fresh token
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8F5F0] font-sans text-[#1F1916] antialiased selection:bg-[#EADBCE]">
      {/* Left/Top Column: High-Definition Image Visual */}
      <div className="flex lg:w-1/2 relative min-h-[40vh] sm:min-h-[50vh] lg:min-h-screen p-8 lg:p-12 flex-col justify-between overflow-hidden">
        <Image
          src="/images/veyra_hero_velera_portrait.png"
          alt="Veyra Personal Grooming & AI Wellness"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Soft Dark Luxury Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F1916]/90 via-[#1F1916]/40 to-black/20" />
        
        {/* Header / Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-block text-3xl font-serif font-bold tracking-tight text-white drop-shadow-md">
            VEYRA
          </Link>
        </div>

        {/* Bottom-left Content / Floating Glass Card */}
        <div className="relative z-10 mt-auto max-w-md space-y-4 lg:space-y-6 text-left pt-12 lg:pt-0">
          {/* Glassmorphism Card */}
          <div className="bg-white/15 backdrop-blur-md p-5 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl border border-white/25 shadow-2xl text-white space-y-2 lg:space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-300 text-sm">✨</span>
              <span className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-amber-200">AI Skin &amp; Grooming Scan</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white leading-tight">
              Start building a routine that's made for you.
            </h2>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-medium">
              Join 10,000+ users transforming their skincare, nutrition, and wellness habits with Veyra.
            </p>
          </div>
        </div>

      </div>

      {/* Right/Bottom Column: Registration Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 xl:px-28 py-10 lg:py-12 bg-[#F8F5F0]">
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

          <div className="space-y-2 mb-8">
            <div className="inline-block text-[10px] font-bold tracking-widest text-[#708264] uppercase bg-[#E8EFE6] px-3 py-1 rounded-full border border-[#708264]/20">
              JOIN THE SANCTUARY
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1916] tracking-tight">
              Create an account
            </h1>
            <p className="text-xs sm:text-sm text-[#6B5A52] font-medium">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-bold text-[#334234] hover:underline underline-offset-4 transition-all"
              >
                Log in here →
              </Link>
            </p>
          </div>



          <form className="space-y-4" onSubmit={handleSubmit}>
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
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C504A] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="block w-full rounded-2xl border border-[#E8DCD2] px-4 py-3.5 text-sm text-[#1F1916] placeholder-[#A09289] shadow-sm focus:border-[#334234] focus:ring-1 focus:ring-[#334234] bg-white transition-all outline-none pr-12"
                    placeholder="At least 6 characters"
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C504A] mb-2">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  className="block w-full rounded-2xl border border-[#E8DCD2] px-4 py-3.5 text-sm text-[#1F1916] placeholder-[#A09289] shadow-sm focus:border-[#334234] focus:ring-1 focus:ring-[#334234] bg-white transition-all outline-none"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-start pt-1">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="h-4 w-4 rounded border-[#E8DCD2] text-[#334234] focus:ring-[#334234] mt-0.5"
              />
              <label htmlFor="agree-terms" className="ml-2.5 block text-xs font-medium text-[#5C504A]">
                I agree to Veyra's{' '}
                <Link href="#" className="underline text-[#1F1916] font-semibold">
                  Terms of Service
                </Link>{' '}
                &amp;{' '}
                <Link href="#" className="underline text-[#1F1916] font-semibold">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div className="flex justify-center py-2">
              <Turnstile
                ref={turnstileRef}
                siteKey={getTurnstileSiteKey()}
                onSuccess={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken('')}
                onError={() => setTurnstileToken('')}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-6 border border-transparent rounded-full shadow-md text-xs font-bold uppercase tracking-wider text-white bg-[#334234] hover:bg-[#253226] focus:outline-none transition-all disabled:opacity-70 mt-2 cursor-pointer"
            >
              {isLoading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
