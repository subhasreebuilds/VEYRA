'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Dashboard() {
  const { user, profileComplete } = useAuth();
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [habits, setHabits] = useState<any[]>([]);

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchApi('/profile');
        if (!response.isComplete) {
          router.push('/onboarding');
          return;
        }
        setData(response);
        if (response.habits) {
          setHabits(response.habits);
        }
      } catch (err) {
        setError("We couldn't load your profile.");
      } finally {
        setLoading(false);
      }
    };

    if (user && profileComplete) {
      loadData();
    }
  }, [user, profileComplete, router]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-[#EADCD4]/50 rounded-[32px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-[#EADCD4]/50 rounded-[32px]" />
          <div className="h-48 bg-[#EADCD4]/50 rounded-[32px]" />
          <div className="h-48 bg-[#EADCD4]/50 rounded-[32px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-8 rounded-[32px] border border-red-200 text-center max-w-lg mx-auto space-y-4 shadow-sm">
        <div className="text-3xl">⚠️</div>
        <h3 className="text-red-900 font-serif font-bold text-lg">{error}</h3>
        <p className="text-xs text-red-700">Please verify your database connection or try reloading.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2.5 bg-[#334234] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#253226] transition-all cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const p = data?.profile;
  const firstName = p?.firstName || user?.email?.split('@')[0] || 'Member';

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const completedCount = habits.filter(h => h.done).length;

  return (
    <div className="font-sans pb-12 w-full mx-auto max-w-[1500px] space-y-12">
      <div className="mb-8 pt-4 px-2 flex justify-between items-start">
        <div>
          <div className="flex items-center text-[#869188] text-[13px] font-medium mb-3 cursor-pointer hover:text-[#516454] transition-colors">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            Dashboard
          </div>
          <h1 className="text-[32px] font-serif font-semibold text-[#1F2922] leading-tight">Your Wellness Overview</h1>
        </div>
      </div>
      {/* 1. HERO WELCOME BANNER */}
      <section className="relative overflow-hidden bg-[#EFE7E0] rounded-[36px] border border-[#E2D4C8] p-8 sm:p-10 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-amber-800 text-sm">🌱</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#708264]">
                YOUR WELLNESS SANCTUARY
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#1F1916] tracking-tight leading-tight">
              {greeting()}, {firstName}.
            </h1>
            <p className="text-xs sm:text-sm text-[#6B5A52] leading-relaxed">
              Your personalized wellness companion is calibrated for your daily goals. Keep your daily rituals consistent for radiant skin and balanced energy.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#E2D4C8] text-center shadow-sm">
              <span className="block text-[10px] uppercase font-bold text-[#8A7970] tracking-wider">Goal</span>
              <span className="text-xs font-bold text-[#334234] capitalize">
                {p?.goal?.toLowerCase().replace('_', ' ') || 'Wellness'}
              </span>
            </div>
            <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#E2D4C8] text-center shadow-sm">
              <span className="block text-[10px] uppercase font-bold text-[#8A7970] tracking-wider">Diet</span>
              <span className="text-xs font-bold text-[#334234] capitalize">
                {p?.dietaryPreference?.toLowerCase().replace('_', ' ') || 'General'}
              </span>
            </div>
            <Link
              href="/skin-analysis"
              className="bg-[#334234] text-white px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#253226] transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Scan Skin →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THREE KEY METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Card 1: BMI & Body Health */}
        <div className="bg-[#2B3B2C] text-white rounded-[32px] p-7 flex flex-col justify-between shadow-md space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                BODY COMPOSITION
              </span>
              <h3 className="text-xl font-serif font-bold">Calculated BMI</h3>
            </div>
            <span className="text-2xl">⚖️</span>
          </div>

          <div className="my-auto py-2">
            <div className="text-5xl font-serif font-bold tracking-tight text-white mb-1">
              {data?.bmi || '21.4'}
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold text-emerald-200 border border-white/20">
              Optimal Health Range
            </div>
          </div>

          <div className="pt-4 border-t border-white/15 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="block text-[10px] text-gray-300 uppercase">Height</span>
              <span className="font-bold text-white">{p?.height ? `${p.height} cm` : '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-300 uppercase">Weight</span>
              <span className="font-bold text-white">{p?.weight ? `${p.weight} kg` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: AI Skin Health Score */}
        <div className="bg-[#FAF7F2] rounded-[32px] border border-[#E8DCD2] p-7 flex flex-col justify-between shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#708264]">
                DERMATOLOGY INSIGHT
              </span>
              <h3 className="text-xl font-serif font-bold text-[#1F1916]">Skin Health Index</h3>
            </div>
            <span className="text-2xl">✨</span>
          </div>

          {data?.skinHealth ? (
            <div className="my-auto py-2 flex items-center gap-4">
              <div className="text-5xl font-serif font-bold tracking-tight text-[#1F1916]">
                {data.skinHealth.score}<span className="text-lg text-[#8A7970] font-sans font-normal">/100</span>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-700">{data.skinHealth.summary}</div>
                <div className="text-[11px] text-[#6B5A52]">{data.skinHealth.details}</div>
              </div>
            </div>
          ) : (
            <div className="my-auto py-6 text-center space-y-2">
              <div className="text-3xl opacity-50">📸</div>
              <p className="text-sm font-bold text-[#6B5A52]">No scan data yet</p>
              <p className="text-[11px] text-[#8A7970]">Complete your first AI scan to unlock your personalized skin index.</p>
            </div>
          )}

          <div className="pt-4 border-t border-[#E8DCD2] flex justify-between items-center text-xs">
            <span className="text-[#6B5A52] text-[11px]">
              {data?.skinHealth?.lastScan ? `Last scanned ${data.skinHealth.lastScan}` : 'Action required'}
            </span>
            <Link href="/skin-analysis" className="font-bold text-[#334234] hover:underline">
              {data?.skinHealth ? 'New scan →' : 'Start Scan →'}
            </Link>
          </div>
        </div>

        {/* Card 3: Today's Rituals Checklist */}
        <div className="bg-white rounded-[32px] border border-[#E8DCD2] p-7 flex flex-col justify-between shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A7970]">
                DAILY RITUALS
              </span>
              <h3 className="text-xl font-serif font-bold text-[#1F1916]">Today's Habits</h3>
            </div>
            {habits.length > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#E8EFE6] text-[#334234] border border-[#708264]/20">
                {completedCount} / {habits.length} Done
              </span>
            )}
          </div>

          <div className="my-auto py-2">
            {habits.length > 0 ? (
              <ul className="space-y-2.5">
                {habits.map((habit) => (
                  <li 
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      habit.done 
                        ? 'bg-[#FAF7F2] border-[#E8DCD2]/60 text-[#1F1916]' 
                        : 'bg-white border-[#E8DCD2] text-[#6B5A52] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                        habit.done ? 'bg-[#334234] text-white' : 'border border-[#E8DCD2] text-transparent'
                      }`}>
                        ✓
                      </div>
                      <div>
                        <p className={`text-xs font-bold leading-tight ${habit.done ? 'line-through opacity-70' : ''}`}>
                          {habit.title}
                        </p>
                        <p className="text-[10px] text-[#8A7970]">{habit.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-sm">{habit.icon}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center space-y-2 py-4">
                <div className="text-3xl opacity-50">🌿</div>
                <p className="text-sm font-bold text-[#6B5A52]">No rituals set</p>
                <p className="text-[11px] text-[#8A7970]">Your personalized daily habits will appear here once configured.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#E8DCD2] text-center">
            <Link href="/grooming" className="text-xs font-bold text-[#334234] hover:underline">
              View full morning & evening routine →
            </Link>
          </div>
        </div>
      </div>

      {/* 3. QUICK ACCESS BENTO ACTIONS */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-serif font-bold text-[#1F1916]">Wellness Features</h2>
          <span className="text-xs font-semibold text-[#8A7970]">Personalized for {firstName}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Skin Analysis', icon: '✨', href: '/skin-analysis', desc: 'AI scan & score' },
            { name: 'Grooming & Routine', icon: '🌿', href: '/grooming', desc: 'Step-by-step rituals' },
            { name: 'Nutrition Plan', icon: '🥗', href: '/nutrition', desc: 'Tailored calorie & macros' },
            { name: 'Smart Recipes', icon: '🍳', href: '/recipes', desc: 'Fresh curated meals' },
          ].map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="bg-white p-5 rounded-[28px] border border-[#E8DCD2] hover:border-[#334234]/40 hover:shadow-md transition-all group flex flex-col justify-between space-y-3"
            >
              <div className="flex justify-between items-center">
                <span className="text-2xl p-2 rounded-2xl bg-[#FAF7F2] border border-[#E8DCD2] group-hover:scale-110 transition-transform">
                  {action.icon}
                </span>
                <span className="text-xs text-[#8A7970] group-hover:text-[#1F1916]">→</span>
              </div>
              <div>
                <h4 className="text-sm font-serif font-bold text-[#1F1916] group-hover:text-[#334234]">
                  {action.name}
                </h4>
                <p className="text-[11px] text-[#6B5A52] font-medium mt-0.5">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. PERSONALIZED PROFILE OVERVIEW SECTION */}
      <section className="bg-white rounded-[36px] p-8 border border-[#E8DCD2] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E8DCD2] pb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#708264]">
              YOUR HEALTH BLUEPRINT
            </span>
            <h3 className="text-2xl font-serif font-bold text-[#1F1916]">Profile Summary</h3>
          </div>
          <Link
            href="/profile"
            className="px-5 py-2.5 rounded-full border border-[#E8DCD2] text-xs font-bold text-[#1F1916] hover:bg-[#FAF7F2] transition-colors"
          >
            Edit Profile →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DCD2]/60">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8A7970] mb-1">Age</span>
            <span className="text-base font-bold text-[#1F1916]">{p?.age ? `${p.age} years` : '—'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DCD2]/60">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8A7970] mb-1">Activity</span>
            <span className="text-base font-bold text-[#1F1916] capitalize">
              {p?.activityLevel?.toLowerCase().replace('_', ' ') || '—'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DCD2]/60">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8A7970] mb-1">Daily Budget</span>
            <span className="text-base font-bold text-[#1F1916]">{p?.budget ? `$${p.budget}` : '—'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DCD2]/60">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8A7970] mb-1">Cooking Time</span>
            <span className="text-base font-bold text-[#1F1916]">{p?.cookingTime ? `${p.cookingTime} min` : '—'}</span>
          </div>
        </div>

        {(p?.allergies?.length > 0 || p?.dislikes?.length > 0) && (
          <div className="pt-4 border-t border-[#E8DCD2] flex flex-wrap gap-4 text-xs">
            {p?.allergies?.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#8A7970]">Allergies:</span>
                <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full font-medium border border-red-200">
                  {p.allergies.join(', ')}
                </span>
              </div>
            )}
            {p?.dislikes?.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#8A7970]">Dislikes:</span>
                <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-medium border border-amber-200">
                  {p.dislikes.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
