'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';

interface Step {
  id: string;
  stepNumber: string;
  time?: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  actives?: string[];
  productName: string;
  productBrand?: string;
  productImage?: string;
  productPrice?: string;
  productType?: string;
  reason?: string;
  done: boolean;
}

export default function GroomingPage() {
  const [activeTab, setActiveTab] = useState<'morning' | 'night' | 'homeRemedies' | 'all'>('morning');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const [morningSteps, setMorningSteps] = useState<Step[]>([]);
  const [nightSteps, setNightSteps] = useState<Step[]>([]);
  const [homeRemediesSteps, setHomeRemediesSteps] = useState<Step[]>([]);

  useEffect(() => {
    loadRoutine();
  }, []);

  const loadRoutine = async () => {
    try {
      setIsLoading(true);
      setError('');
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      const data = await fetchApi(`/grooming/routine?date=${today}`);

      if (data && data.routine) {
        populateSteps(data.routine, data.progress || []);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load grooming routine.');
    } finally {
      setIsLoading(false);
    }
  };

  const populateSteps = (routineData: any, completedIds: string[] = []) => {
    const mapSteps = (steps: any[]) =>
      (steps || []).map((s: any) => ({
        ...s,
        productImage: s.productImage || s.imageUrl || '/products/moisturizer.jpg',
        productBrand: s.productBrand || s.brand || 'Recommended',
        productName: s.productName || s.name || s.title,
        reason: s.reason || s.whyChosen || s.description || '',
        done: (completedIds || []).includes(s.id),
      }));

    const morning = routineData.morning || [];
    // Support both night and legacy evening
    const night = routineData.night || routineData.evening || [];
    // Support both homeRemedies and legacy weekly
    const homeRemedies = routineData.homeRemedies || routineData.weekly || [];

    setMorningSteps(mapSteps(morning));
    setNightSteps(mapSteps(night));
    setHomeRemediesSteps(mapSteps(homeRemedies));
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError('');
      const data = await fetchApi('/grooming/generate', { method: 'POST' });
      if (data && data.routine) {
        populateSteps(data.routine, []);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate routine. Please make sure you have taken a skin scan first.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleStep = async (id: string) => {
    const today = new Date().toLocaleDateString('en-CA');
    const updateLocal = (prev: Step[]) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s));

    setMorningSteps(updateLocal);
    setNightSteps(updateLocal);
    setHomeRemediesSteps(updateLocal);

    try {
      await fetchApi('/grooming/progress', {
        method: 'POST',
        body: JSON.stringify({ date: today, stepId: id }),
      });
    } catch (err) {
      console.error('Failed to save progress:', err);
      // Revert on failure
      const revertLocal = (prev: Step[]) =>
        prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s));
      setMorningSteps(revertLocal);
      setNightSteps(revertLocal);
      setHomeRemediesSteps(revertLocal);
    }
  };

  const allSteps = [...morningSteps, ...nightSteps, ...homeRemediesSteps];
  const totalCompleted = allSteps.filter((s) => s.done).length;
  const totalPercentage = allSteps.length > 0 ? Math.round((totalCompleted / allSteps.length) * 100) : 0;

  const currentSteps =
    activeTab === 'morning'
      ? morningSteps
      : activeTab === 'night'
      ? nightSteps
      : activeTab === 'homeRemedies'
      ? homeRemediesSteps
      : allSteps;

  const currentCompleted = currentSteps.filter((s) => s.done).length;
  const currentPercentage =
    currentSteps.length > 0 ? Math.round((currentCompleted / currentSteps.length) * 100) : 0;

  const hasRoutine = morningSteps.length > 0 || nightSteps.length > 0 || homeRemediesSteps.length > 0;

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-80 space-y-4">
        <div className="w-10 h-10 border-4 border-[#334234] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-wider text-[#8A7970]">
          Loading grooming timeline...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* 1. HEADER & DAILY PROGRESS */}
      <section className="bg-[#EFE7E0] rounded-[36px] border border-[#E2D4C8] p-8 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-emerald-800 text-sm">🌿</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#708264]">
                GROOMING & DAILY RITUALS
              </span>
              <span className="text-[11px] font-medium text-[#8A7970]">• {formattedDate}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#1F1916] tracking-tight">
              Grooming Timeline
            </h1>
            <p className="text-xs sm:text-sm text-[#6B5A52] leading-relaxed">
              Your personalized timeline to-do list. Products and steps are directly matched to your AI skin biomarker recommendations.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-[#E2D4C8] shadow-sm flex flex-col gap-2 shrink-0 w-full sm:w-auto min-w-[220px]">
            <div className="flex justify-between items-center text-[11px] font-bold text-[#1F1916]">
              <span>Today's Progress</span>
              <span className="text-emerald-800">{totalCompleted} / {allSteps.length} Done ({totalPercentage}%)</span>
            </div>
            <div className="w-full h-2.5 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8DCD2]/60">
              <div
                className="h-full bg-[#334234] rounded-full transition-all duration-500"
                style={{ width: `${totalPercentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center pt-1 text-[10px] text-[#8A7970]">
              <span>Morning: {morningSteps.filter(s => s.done).length}/{morningSteps.length}</span>
              <span>Night: {nightSteps.filter(s => s.done).length}/{nightSteps.length}</span>
              <span>Remedies: {homeRemediesSteps.filter(s => s.done).length}/{homeRemediesSteps.length}</span>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-sm flex items-center justify-between gap-4">
          <span>{error}</span>
          <button
            onClick={loadRoutine}
            className="text-xs font-bold underline cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {!hasRoutine ? (
        /* Empty state: Unlock routine */
        <div className="bg-white rounded-[32px] border border-[#E8DCD2] p-12 text-center shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 bg-[#FAF7F2] rounded-full flex items-center justify-center mx-auto border border-[#E8DCD2]">
            <span className="text-3xl">✨</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-[#1F1916]">Unlock Your Grooming Timeline</h2>
            <p className="text-sm text-[#6B5A52] leading-relaxed max-w-md mx-auto">
              We'll use your skin analysis recommendations to automatically build your Morning, Night, and Home Remedies timeline to-do list with matched products and instructions.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-8 py-3.5 bg-[#334234] text-white font-bold rounded-full hover:bg-[#1F1916] transition-colors shadow-lg shadow-emerald-900/10 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Timeline...</span>
              </>
            ) : (
              <span>Generate My Routine Timeline</span>
            )}
          </button>
          
          <p className="text-xs text-[#8A7970]">
            Don't have a skin scan yet? <Link href="/skin-analysis" className="underline hover:text-[#1F1916] font-semibold">Scan your face first</Link>.
          </p>
        </div>
      ) : (
        <>
          {/* 2. THREE SECTION SWITCHER TABS */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E8DCD2] pb-4">
            <div className="flex items-center gap-2 bg-[#FAF7F2] p-1.5 rounded-full border border-[#E8DCD2] flex-wrap">
              {/* Section 1: Morning */}
              <button
                onClick={() => setActiveTab('morning')}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'morning'
                    ? 'bg-[#334234] text-white shadow-sm'
                    : 'text-[#6B5A52] hover:text-[#1F1916]'
                }`}
              >
                <span>☀️</span>
                <span>Morning</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === 'morning' ? 'bg-white/20 text-white' : 'bg-[#EFE7E0] text-[#6B5A52]'
                }`}>
                  {morningSteps.filter((s) => s.done).length}/{morningSteps.length}
                </span>
              </button>

              {/* Section 2: Night */}
              <button
                onClick={() => setActiveTab('night')}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'night'
                    ? 'bg-[#334234] text-white shadow-sm'
                    : 'text-[#6B5A52] hover:text-[#1F1916]'
                }`}
              >
                <span>🌙</span>
                <span>Night</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === 'night' ? 'bg-white/20 text-white' : 'bg-[#EFE7E0] text-[#6B5A52]'
                }`}>
                  {nightSteps.filter((s) => s.done).length}/{nightSteps.length}
                </span>
              </button>

              {/* Section 3: Home Remedies */}
              <button
                onClick={() => setActiveTab('homeRemedies')}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'homeRemedies'
                    ? 'bg-[#334234] text-white shadow-sm'
                    : 'text-[#6B5A52] hover:text-[#1F1916]'
                }`}
              >
                <span>🌿</span>
                <span>Home Remedies</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === 'homeRemedies' ? 'bg-white/20 text-white' : 'bg-[#EFE7E0] text-[#6B5A52]'
                }`}>
                  {homeRemediesSteps.filter((s) => s.done).length}/{homeRemediesSteps.length}
                </span>
              </button>

              {/* All Timeline view */}
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#334234] text-white shadow-sm'
                    : 'text-[#6B5A52] hover:text-[#1F1916]'
                }`}
              >
                <span>⏱</span>
                <span>All Day</span>
              </button>
            </div>

            {/* Sync / Regenerate button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="text-xs font-bold text-[#516454] bg-white border border-[#E0E2DF] px-4 py-2 rounded-full hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <span className="w-3 h-3 border border-[#516454] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                <span>Sync with Skin Scan</span>
              </button>
            </div>
          </div>

          {/* Section completion banner */}
          {currentSteps.length > 0 && currentCompleted === currentSteps.length && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-3xl p-5 flex items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <h4 className="text-sm font-bold">
                    {activeTab === 'morning'
                      ? 'Morning Ritual Completed!'
                      : activeTab === 'night'
                      ? 'Night Ritual Completed!'
                      : activeTab === 'homeRemedies'
                      ? 'Home Remedies Completed!'
                      : 'All Daily Rituals Completed!'}
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Excellent consistency! Your skin barrier is thriving.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-white text-emerald-800 px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm">
                100% Done
              </span>
            </div>
          )}

          {/* 3. TIMELINE TO-DO LIST */}
          <div className="relative pt-4">
            {currentSteps.length === 0 ? (
              <div className="p-12 text-center text-[#6B5A52] border border-dashed border-[#E8DCD2] rounded-3xl bg-white space-y-3">
                <span className="text-3xl">🌿</span>
                <p className="text-sm font-bold text-[#1F1916]">No steps available for this section.</p>
                <p className="text-xs text-[#8A7970]">Click "Sync with Skin Scan" above to populate all sections.</p>
              </div>
            ) : (
              <div className="space-y-0">
                {currentSteps.map((step, index) => {
                  const isLast = index === currentSteps.length - 1;

                  return (
                    <div key={step.id} className="relative pl-10 sm:pl-14 pb-8 sm:pb-10 last:pb-2">
                      {/* Vertical Timeline Axis Line */}
                      {!isLast && (
                        <div className="absolute left-[15px] sm:left-[21px] top-8 bottom-0 w-0.5 bg-[#E2D4C8]" />
                      )}

                      {/* Timeline Node Checkbox */}
                      <button
                        onClick={() => toggleStep(step.id)}
                        title={step.done ? 'Mark incomplete' : 'Mark completed'}
                        className={`absolute left-0 top-1 w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all cursor-pointer z-10 ${
                          step.done
                            ? 'bg-[#334234] text-white shadow-md ring-4 ring-emerald-100 scale-105'
                            : 'bg-white border-2 border-[#D8C7B8] text-[#8A7970] hover:border-[#334234] hover:text-[#334234]'
                        }`}
                      >
                        {step.done ? (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span>{step.stepNumber}</span>
                        )}
                      </button>

                      {/* Timeline To-Do Card */}
                      <div
                        className={`rounded-[28px] border transition-all p-5 sm:p-7 shadow-sm ${
                          step.done
                            ? 'bg-[#FAF8F5]/80 border-[#708264]/30'
                            : 'bg-white border-[#E8DCD2] hover:border-[#334234]/30 hover:shadow-md'
                        }`}
                      >
                        {/* Meta header: Tag, Time, Duration */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#FAF7F2] text-[#708264] border border-[#E8DCD2]">
                              {step.category}
                            </span>
                            {step.time && (
                              <span className="text-[11px] font-bold text-[#1F1916] bg-[#EFE7E0] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                ⏱ {step.time}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#8A7970] font-medium flex items-center gap-1">
                              ⌛ {step.duration}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                step.done
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {step.done ? 'Done ✓' : 'To Do'}
                            </span>
                          </div>
                        </div>

                        {/* Task Title & Actionable Description */}
                        <div className="space-y-1.5 mb-4">
                          <h3
                            className={`text-lg sm:text-xl font-serif font-bold text-[#1F1916] transition-opacity ${
                              step.done ? 'line-through opacity-60' : ''
                            }`}
                          >
                            {step.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-[#6B5A52] leading-relaxed">
                            {step.description}
                          </p>
                        </div>

                        {/* Why Veyra Recommends This (Skin recommendation reason) */}
                        {step.reason && (
                          <div className="mb-4 bg-[#FAF7F2] border border-[#E8DCD2]/70 rounded-2xl p-3.5 flex items-start gap-2.5">
                            <span className="text-amber-600 text-sm mt-0.5">💡</span>
                            <div className="text-[11px] text-[#5C504A] leading-relaxed">
                              <span className="font-bold text-[#1F1916]">Why recommended: </span>
                              {step.reason}
                            </div>
                          </div>
                        )}

                        {/* Matched Product Card - SAME Product, SAME Image */}
                        <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E8DCD2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative bg-white border border-[#E8DCD2] shadow-sm">
                              <img
                                src={step.productImage || '/products/moisturizer.jpg'}
                                alt={step.productName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A7970] truncate">
                                  {step.productBrand || 'Recommended'}
                                </span>
                                <span className="text-[10px] text-emerald-700 font-bold">★ 4.9</span>
                              </div>
                              <h4 className="text-xs sm:text-sm font-bold text-[#1F1916] truncate">
                                {step.productName}
                              </h4>
                              <p className="text-[11px] text-[#6B5A52]">
                                {step.productPrice ? `${step.productPrice} • ` : ''}
                                {step.productType || step.category}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8DCD2]/60">
                            <Link
                              href="/products"
                              className="text-[11px] font-bold text-[#334234] hover:underline"
                            >
                              View in Products →
                            </Link>
                            <button
                              onClick={() => toggleStep(step.id)}
                              className={`text-xs font-bold px-4 py-2 rounded-full cursor-pointer transition-all flex items-center gap-1.5 shadow-sm ${
                                step.done
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-[#334234] text-white hover:bg-[#253226]'
                              }`}
                            >
                              {step.done ? (
                                <>
                                  <span>✓</span>
                                  <span>Completed</span>
                                </>
                              ) : (
                                <>
                                  <span>Mark Done</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
