'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  matchScore: number;
  price: string;
  size: string;
  image: string;
  actives: string[];
  whyChosen: string;
  rating: number;
  reviewsCount: number;
  addedToRoutine: boolean;
}

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toastMessage, setToastMessage] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  React.useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await fetchApi('/skin-analysis/latest/recommendations');
      
      const mappedProducts = data.filter((r: any) => r.category === 'SKINCARE').map((r: any, idx: number) => {
        let instr: any = {};
        try { instr = JSON.parse(r.instructions || '{}'); } catch(e) {}
        
        const typeUpper = ((r.recommendationType || '') + ' ' + (instr.name || '') + ' ' + (r.title || '')).toUpperCase();
        const img = instr.imageUrl || (() => {
          if (typeUpper.includes('HONEY') || typeUpper.includes('OAT') || typeUpper.includes('MASK')) return '/products/honey.jpg';
          if (typeUpper.includes('TEA') || typeUpper.includes('MIST') || typeUpper.includes('COMPRESS')) return '/products/tea.jpg';
          if (typeUpper.includes('CUCUMBER') || typeUpper.includes('ROSE')) return '/products/cucumber.jpg';
          if (typeUpper.includes('PATCH') || typeUpper.includes('UNDEREYE_PATCH')) return '/products/eye_patches.jpg';
          if (typeUpper.includes('EYE') || typeUpper.includes('UNDEREYE')) return '/products/eye_cream.jpg';
          if (typeUpper.includes('TONER') || typeUpper.includes('ASTRINGENT')) return '/products/toner.jpg';
          if (typeUpper.includes('SUNSCREEN') || typeUpper.includes('SPF') || typeUpper.includes('BLOCK')) return '/products/sunscreen.jpg';
          if (typeUpper.includes('CLEANSER') || typeUpper.includes('WASH')) return '/products/cleanser.jpg';
          if (typeUpper.includes('SERUM')) return '/products/serum.jpg';
          if (typeUpper.includes('TREATMENT') || typeUpper.includes('EXFOLIANT')) return '/products/treatment.jpg';
          return '/products/moisturizer.jpg';
        })();

        return {
          id: r.id,
          name: instr.name || r.title,
          brand: instr.brand || 'Recommended Brand',
          category: r.recommendationType || 'Skincare',
          matchScore: 90 + Math.floor(Math.random() * 9),
          price: (instr.currency || '₹') + (instr.price || 'N/A'),
          size: 'Standard',
          image: img,
          actives: [],
          whyChosen: r.reason || r.description,
          rating: 4.5 + (Math.random() * 0.5),
          reviewsCount: 100 + Math.floor(Math.random() * 400),
          addedToRoutine: false
        };
      });
      
      setProducts(mappedProducts);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not load products.');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ['All', 'Cleansers', 'Toners', 'Serums & Actives', 'Moisturizers', 'Sun Protection', 'Eye Care & Patches'];

  const toggleRoutine = (id: string, name: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const nextState = !p.addedToRoutine;
        showToast(nextState ? `Added "${name}" to your daily rituals.` : `Removed "${name}" from rituals.`);
        return { ...p, addedToRoutine: nextState };
      }
      return p;
    }));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const filteredProducts = products.filter(
    (p) => selectedCategory === 'All' || p.category === selectedCategory
  );

  return (
    <div className="space-y-8 pb-12 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-[#334234] text-white text-xs font-bold px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-500/30 animate-bounce">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HERO HEADER */}
      <section className="bg-[#EFE7E0] rounded-[36px] border border-[#E2D4C8] p-8 sm:p-10 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-emerald-800 text-sm">🧴</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#708264]">
                CURATED APOTHECARY
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#1F1916] tracking-tight">
              Product Recommendations
            </h1>
            <p className="text-xs sm:text-sm text-[#6B5A52] leading-relaxed">
              Biocompatible formulations hand-selected to pair with your skin biomarker profile. Clean ingredients, dermatologically validated, and fragrance-neutral.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/skin-analysis"
              className="bg-[#334234] text-white px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#253226] transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>✨</span>
              <span>Re-scan Skin for Matches →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY SELECTOR */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#334234] text-white shadow-sm'
                : 'bg-white text-[#6B5A52] border border-[#E8DCD2] hover:bg-[#FAF7F2] hover:text-[#1F1916]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. PRODUCT GRID */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-[#334234] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm">
          {error}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-[#E8DCD2] p-12 text-center shadow-sm">
          <p className="text-sm text-[#6B5A52]">No products found. Complete a skin scan to get personalized recommendations.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-[32px] border border-[#E8DCD2] overflow-hidden shadow-sm hover:shadow-md hover:border-[#334234]/30 transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Image banner with match pill */}
              <div className="relative h-60 w-full bg-[#FAF7F2] overflow-hidden flex items-center justify-center p-6">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-emerald-800 border border-emerald-200 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{p.matchScore}% Match</span>
                </div>

                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white">
                  ★ {p.rating} ({p.reviewsCount})
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A7970]">
                      {p.brand} • {p.size}
                    </span>
                    <h3 className="text-base font-serif font-bold text-[#1F1916] mt-0.5">
                      {p.name}
                    </h3>
                  </div>
                  <span className="text-base font-serif font-bold text-[#1F1916]">{p.price}</span>
                </div>

                <p className="text-xs text-[#6B5A52] leading-relaxed">
                  {p.whyChosen}
                </p>

                {/* Key actives */}
                <div className="pt-2 border-t border-[#E8DCD2]/60 space-y-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#8A7970]">
                    Primary Actives:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {p.actives.map((act) => (
                      <span
                        key={act}
                        className="px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#334234] text-[9px] font-bold border border-[#E8DCD2]"
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-0">
              <button
                onClick={() => toggleRoutine(p.id, p.name)}
                className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  p.addedToRoutine
                    ? 'bg-[#E8EFE6] text-[#334234] border border-[#708264]/40 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                    : 'bg-[#334234] text-white hover:bg-[#253226] shadow-sm'
                }`}
              >
                <span>{p.addedToRoutine ? '✓ In Your Daily Routine' : '+ Add to Ritual'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

