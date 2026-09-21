'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../lib/api';
import Link from 'next/link';
import Image from 'next/image';

export default function Onboarding() {
  const { refreshUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: 'PREFER_NOT_TO_SAY',
    height: '',
    weight: '',
    activityLevel: 'SEDENTARY',
    goal: 'MAINTENANCE',
    dietaryPreference: 'NON_VEGETARIAN',
    allergies: '',
    dislikes: '',
    budget: '50',
    cookingTime: '30',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    if (step === 1 && (!formData.firstName || !formData.lastName || !formData.age)) {
      setError("Please fill out all required fields.");
      return;
    }
    if (step === 2 && (!formData.height || !formData.weight)) {
      setError("Please fill out all required fields.");
      return;
    }
    setError('');
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setError('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== totalSteps) {
      nextStep();
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age),
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        budget: parseFloat(formData.budget),
        cookingTime: parseInt(formData.cookingTime),
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        dislikes: formData.dislikes ? formData.dislikes.split(',').map(s => s.trim()).filter(Boolean) : [],
      };

      await fetchApi('/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      await refreshUser();
      router.push('/dashboard');
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.message || 'Failed to save profile. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8F5F0] font-sans text-[#1F1916] antialiased selection:bg-[#EADBCE]">
      
      {/* Left Column: Full Bleed High-Definition Image Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative min-h-screen p-12 flex-col justify-between overflow-hidden">
        <Image
          src="/images/hero_wellness.png"
          alt="Veyra Wellness"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Soft Dark Luxury Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F1916]/90 via-[#1F1916]/30 to-black/20" />
        
        {/* Header / Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-block text-3xl font-serif font-bold tracking-tight text-white drop-shadow-md hover:opacity-90 transition-opacity">
            VEYRA
          </Link>
        </div>

        {/* Bottom-left Content / Floating Glass Card */}
        <div className="relative z-10 mt-auto max-w-md space-y-6 text-left">
          <div className="bg-white/15 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/25 shadow-2xl text-white space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-300 text-sm">✨</span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-200">Personalized Journey</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight">
              A routine designed just for you.
            </h2>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-medium">
              We tailor your skincare, grooming, and nutrition perfectly to match your goals and lifestyle.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Onboarding Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 xl:px-28 py-12 bg-[#F8F5F0] overflow-y-auto">
        <div className="mx-auto w-full max-w-xl">
          
          {/* Mobile Header / Logo */}
          <div className="lg:hidden mb-8 flex justify-center">
             <Link href="/" className="text-3xl font-serif font-bold tracking-tight text-[#1F1916]">
                VEYRA
             </Link>
          </div>

          <div className="mb-10 text-center sm:text-left space-y-3">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1916] tracking-tight">
              Let's get to know you.
            </h1>
            <p className="text-sm sm:text-base text-[#6B5A52] font-medium">
              Tell us a little about yourself so Veyra can personalize your experience.
            </p>
          </div>
          
          {/* Progress Indicator */}
          <div className="mb-14 px-2 sm:px-8">
            <div className="flex items-center justify-between relative mx-auto">
              {/* Background Line */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-[#E8DCD2] z-0" />
              {/* Active Line */}
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#334234] z-0 transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
              />
              
              {[
                { num: 1, label: 'About You' },
                { num: 2, label: 'Body & Goals' },
                { num: 3, label: 'Food & Lifestyle' }
              ].map((s) => (
                <div key={s.num} className="relative z-10 flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 
                      ${step === s.num 
                        ? 'bg-[#334234] border-[#334234] text-white shadow-md ring-4 ring-[#E8EFE6]' 
                        : step > s.num
                        ? 'bg-[#E8EFE6] border-[#334234] text-[#334234]'
                        : 'bg-[#F8F5F0] border-[#E8DCD2] text-[#A09289]'}`}
                  >
                    {step > s.num ? '✓' : `0${s.num}`}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider absolute -bottom-7 whitespace-nowrap transition-colors
                    ${step >= s.num ? 'text-[#334234]' : 'text-[#A09289]'}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-800 p-4 rounded-2xl mb-8 text-xs font-semibold border border-red-200 shadow-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 flex-1 flex flex-col">
            {/* STEP 1: About You */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C504A] mb-2">First Name <span className="text-[#334234]">*</span></label>
                    <input 
                      type="text" 
                      name="firstName" 
                      required 
                      className="block w-full rounded-2xl border border-[#E8DCD2] px-4 py-3.5 text-sm text-[#1F1916] placeholder-[#A09289] shadow-sm focus:border-[#334234] focus:ring-1 focus:ring-[#334234] bg-white transition-all outline-none" 
                      value={formData.firstName} 
                      onChange={handleChange} 
                      placeholder="e.g. Subhasree" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C504A] mb-2">Last Name <span className="text-[#334234]">*</span></label>
                    <input 
                      type="text" 
                      name="lastName" 
                      required 
                      className="block w-full rounded-2xl border border-[#E8DCD2] px-4 py-3.5 text-sm text-[#1F1916] placeholder-[#A09289] shadow-sm focus:border-[#334234] focus:ring-1 focus:ring-[#334234] bg-white transition-all outline-none" 
                      value={formData.lastName} 
                      onChange={handleChange} 
                      placeholder="e.g. Lenka" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C504A] mb-2">Age <span className="text-[#334234]">*</span></label>
                  <input 
                    type="number" 
                    name="age" 
                    required 
                    min="13" 
                    max="120" 
                    className="block w-full sm:w-1/2 rounded-2xl border border-[#E8DCD2] px-4 py-3.5 text-sm text-[#1F1916] placeholder-[#A09289] shadow-sm focus:border-[#334234] focus:ring-1 focus:ring-[#334234] bg-white transition-all outline-none" 
                    value={formData.age} 
                    onChange={handleChange} 
                    placeholder="e.g. 24" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C504A] mb-3">Gender</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'MALE', label: 'Male' },
                      { id: 'FEMALE', label: 'Female' },
                      { id: 'OTHER', label: 'Other' },
                      { id: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' }
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleSelectField('gender', g.id)}
                        className={`py-3 px-3 rounded-2xl border text-center transition-all text-xs font-bold flex items-center justify-center gap-2 ${
                          formData.gender === g.id
                            ? 'border-[#708264] bg-[#E8EFE6] text-[#2D452F] shadow-sm ring-1 ring-[#708264]'
                            : 'border-[#E8DCD2] bg-white hover:bg-[#FAF7F2] text-[#5C504A]'
                        }`}
                      >
                        {formData.gender === g.id && <span className="text-[#708264]">✓</span>}
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Body & Goals */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in duration-500 flex-1">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8A7970] border-b border-[#E8DCD2] pb-2">Body Metrics</h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5C504A] mb-2">Height (cm) <span className="text-[#334234]">*</span></label>
                      <input 
                        type="number" 
                        name="height" 
                        required 
                        min="50" 
                        step="0.1" 
                        className="block w-full rounded-2xl border border-[#E8DCD2] px-4 py-3.5 text-sm text-[#1F1916] placeholder-[#A09289] shadow-sm focus:border-[#334234] focus:ring-1 focus:ring-[#334234] bg-white transition-all outline-none" 
                        value={formData.height} 
                        onChange={handleChange} 
                        placeholder="e.g. 168" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5C504A] mb-2">Weight (kg) <span className="text-[#334234]">*</span></label>
                      <input 
                        type="number" 
                        name="weight" 
                        required 
                        min="20" 
                        step="0.1" 
                        className="block w-full rounded-2xl border border-[#E8DCD2] px-4 py-3.5 text-sm text-[#1F1916] placeholder-[#A09289] shadow-sm focus:border-[#334234] focus:ring-1 focus:ring-[#334234] bg-white transition-all outline-none" 
                        value={formData.weight} 
                        onChange={handleChange} 
                        placeholder="e.g. 58" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8A7970] border-b border-[#E8DCD2] pb-2">Goals & Activity</h3>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C504A] mb-3">Primary Goal</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: 'GENERAL_WELLNESS', label: 'General Wellness', icon: '🌿', desc: 'Holistic balance & energy' },
                        { id: 'MAINTENANCE', label: 'Maintenance', icon: '⚖️', desc: 'Keep routines consistent' },
                        { id: 'WEIGHT_LOSS', label: 'Weight Loss', icon: '🎯', desc: 'Healthy, sustainable loss' },
                        { id: 'WEIGHT_GAIN', label: 'Muscle / Gain', icon: '💪', desc: 'Lean strength & mass' },
                      ].map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => handleSelectField('goal', g.id)}
                          className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                            formData.goal === g.id
                              ? 'border-[#708264] bg-[#E8EFE6] text-[#1F1916] shadow-sm ring-1 ring-[#708264]'
                              : 'border-[#E8DCD2] bg-white hover:bg-[#FAF7F2] text-[#5C504A]'
                          }`}
                        >
                          <div className="text-xl bg-[#F8F5F0] w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 border border-[#E8DCD2]">
                            {g.icon}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#1F1916]">{g.label}</div>
                            <div className="text-[11px] text-[#6B5A52] font-medium mt-0.5">{g.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C504A] mb-2 mt-4">Activity Level</label>
                    <select 
                      name="activityLevel" 
                      className="block w-full rounded-2xl border border-[#E8DCD2] px-4 py-3.5 text-sm text-[#1F1916] shadow-sm focus:border-[#334234] focus:ring-1 focus:ring-[#334234] bg-white transition-all outline-none cursor-pointer" 
                      value={formData.activityLevel} 
                      onChange={handleChange}
                    >
                      <option value="SEDENTARY">Sedentary (Little to no structured exercise)</option>
                      <option value="LIGHT">Light (1–3 active sessions / week)</option>
                      <option value="MODERATE">Moderate (3–5 training days / week)</option>
                      <option value="ACTIVE">Active (6–7 days of vigorous movement)</option>
                      <option value="VERY_ACTIVE">Very Active (Physical work + daily training)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Food & Lifestyle */}
            {step === 3 && (
              <div className="space-y-8 animate-in fade-in duration-500 flex-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C504A] mb-3">Dietary Preference</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'NON_VEGETARIAN', label: 'Non-Vegetarian', icon: '🥩' },
                      { id: 'VEGETARIAN', label: 'Vegetarian', icon: '🥗' },
                      { id: 'VEGAN', label: 'Vegan', icon: '🌱' },
                      { id: 'EGGETARIAN', label: 'Eggetarian', icon: '🍳' },
                      { id: 'OTHER', label: 'Other', icon: '🍽️' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleSelectField('dietaryPreference', d.id)}
                        className={`py-2 px-4 rounded-full border transition-all flex items-center gap-2 ${
                          formData.dietaryPreference === d.id
                            ? 'border-[#708264] bg-[#E8EFE6] text-[#2D452F] shadow-sm'
                            : 'border-[#E8DCD2] bg-white hover:bg-[#FAF7F2] text-[#5C504A]'
                        }`}
                      >
                        <span>{d.icon}</span>
                        <span className="text-xs font-bold">{d.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C504A] mb-2">Daily Food Budget ($) <span className="text-[#334234]">*</span></label>
                    <input 
                      type="number" 
                      name="budget" 
                      required 
                      min="1" 
                      className="block w-full rounded-2xl border border-[#E8DCD2] px-4 py-3.5 text-sm text-[#1F1916] placeholder-[#A09289] shadow-sm focus:border-[#334234] focus:ring-1 focus:ring-[#334234] bg-white transition-all outline-none" 
                      value={formData.budget} 
                      onChange={handleChange} 
                      placeholder="e.g. 50" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C504A] mb-2">Cooking Time (min) <span className="text-[#334234]">*</span></label>
                    <input 
                      type="number" 
                      name="cookingTime" 
                      required 
                      min="5" 
                      className="block w-full rounded-2xl border border-[#E8DCD2] px-4 py-3.5 text-sm text-[#1F1916] placeholder-[#A09289] shadow-sm focus:border-[#334234] focus:ring-1 focus:ring-[#334234] bg-white transition-all outline-none" 
                      value={formData.cookingTime} 
                      onChange={handleChange} 
                      placeholder="e.g. 30" 
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C504A] mb-2">
                      Allergies <span className="text-[#A09289] font-normal normal-case">(optional, comma-separated)</span>
                    </label>
                    <input 
                      type="text" 
                      name="allergies" 
                      placeholder="e.g. peanuts, dairy, shellfish" 
                      className="block w-full rounded-2xl border border-[#E8DCD2] px-4 py-3.5 text-sm text-[#1F1916] placeholder-[#A09289] shadow-sm focus:border-[#334234] focus:ring-1 focus:ring-[#334234] bg-white transition-all outline-none" 
                      value={formData.allergies} 
                      onChange={handleChange} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C504A] mb-2">
                      Ingredient Dislikes <span className="text-[#A09289] font-normal normal-case">(optional, comma-separated)</span>
                    </label>
                    <input 
                      type="text" 
                      name="dislikes" 
                      placeholder="e.g. mushrooms, cilantro, eggplant" 
                      className="block w-full rounded-2xl border border-[#E8DCD2] px-4 py-3.5 text-sm text-[#1F1916] placeholder-[#A09289] shadow-sm focus:border-[#334234] focus:ring-1 focus:ring-[#334234] bg-white transition-all outline-none" 
                      value={formData.dislikes} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Form Controls */}
            <div className="pt-8 mt-auto flex items-center justify-between border-t border-[#E8DCD2]/50">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3.5 border border-[#E8DCD2] rounded-full text-xs font-bold uppercase tracking-wider text-[#5C504A] bg-white hover:bg-[#FAF4EE] hover:text-[#1F1916] transition-all shadow-sm cursor-pointer"
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#334234] hover:bg-[#253226] transition-all shadow-md disabled:opacity-70 flex items-center gap-2 ml-auto cursor-pointer border border-transparent"
              >
                {loading ? 'Saving...' : step === totalSteps ? 'Complete Profile →' : 'Continue →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
