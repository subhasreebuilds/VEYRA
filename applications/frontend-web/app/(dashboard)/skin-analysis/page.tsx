'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';

export default function SkinAnalysisPage() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [alignmentPhase, setAlignmentPhase] = useState<'idle' | 'aligning' | 'aligned'>('idle');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [metrics, setMetrics] = useState<any[]>([]);
  const [concerns, setConcerns] = useState<any[]>([]);
  const [recommendedActives, setRecommendedActives] = useState<any[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [activeRecommendationTab, setActiveRecommendationTab] = useState('All');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const loadRecommendations = async () => {
    try {
      const data = await fetchApi('/skin-analysis/latest/recommendations');
      if (Array.isArray(data)) {
        setRecommendations(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const data = await fetchApi('/skin-analysis/latest/recommendations/generate', { method: 'POST' });
      if (Array.isArray(data)) {
        setRecommendations(data);
      }
    } catch (err) {
      console.error('Failed to regenerate', err);
      alert('Failed to regenerate recommendations. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const data = await fetchApi('/skin-analysis/history');
        if (Array.isArray(data)) {
          setHistory(data);
          if (data.length > 0) {
            const latest = data[0];
            setMetrics(latest.metrics || []);
            setRecommendedActives(latest.actives || []);
            setConcerns(latest.concerns || []);
            setOverallScore(latest.overallScore);
            setSummary(latest.summary);
            setScanComplete(true);
            loadRecommendations();
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchInitial();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    let phase1: NodeJS.Timeout;
    let phase2: NodeJS.Timeout;
    
    if (isCameraActive && alignmentPhase === 'aligning') {
      // Simulate the AI detecting a perfect fit after 3 seconds
      phase1 = setTimeout(() => {
        setAlignmentPhase('aligned');
        
        // Auto capture 1.5 seconds after finding the perfect fit
        phase2 = setTimeout(() => {
          handleCaptureAndScan();
        }, 1500);
      }, 3000);
    }
    
    return () => {
      clearTimeout(phase1);
      clearTimeout(phase2);
    };
  }, [isCameraActive, alignmentPhase]);

  const loadHistory = async () => {
    try {
      const data = await fetchApi('/skin-analysis/history');
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startCameraFlow = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      setIsCameraActive(true);
      setAlignmentPhase('aligning');
      // We need a slight delay to ensure videoRef is rendered before assigning the stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error('Camera access denied or unavailable', err);
      alert('Camera access denied. Please allow camera permissions to use this feature.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setAlignmentPhase('idle');
  };

  const handleCaptureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Capture Image
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Resize to 600x600 to ensure fast, lightweight upload under Vercel payload limits
    const maxDim = 600;
    const scale = Math.min(maxDim / video.videoWidth, maxDim / video.videoHeight, 1);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Compress JPEG to 0.6 quality for ultra-fast payload delivery (<100KB)
    const base64Image = canvas.toDataURL('image/jpeg', 0.6);

    // Stop camera and transition to scanning state
    stopCamera();
    setIsScanning(true);
    setScanComplete(false);

    try {
      const data = await fetchApi('/skin-analysis/scan', {
        method: 'POST',
        body: JSON.stringify({ image: base64Image }),
      });
      
      setMetrics(data.metrics);
      setRecommendedActives(data.actives);
      setOverallScore(data.overallScore);
      setSummary(data.summary);
      setConcerns(data.concerns || []);
      setScanComplete(true);
      setActiveTab('Overview');
      loadHistory(); // Refresh history
    } catch (err: any) {
      console.error('Failed to scan skin', err);
      alert(err.message || 'Failed to analyze skin. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen font-sans pb-12 w-full mx-auto max-w-[1500px]">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pt-4 px-2">
        <div>

          <h1 className="text-[44px] font-serif text-[#1F2922] mb-3 leading-tight tracking-tight">Your Skin Analysis</h1>
          <p className="text-[15px] text-[#5C6B61] leading-relaxed max-w-lg">Discover what your skin needs and get personalized<br/>recommendations for a healthier, brighter you.</p>
        </div>
        
        <div className="mt-6">
          {!isCameraActive ? (
            <button
              onClick={startCameraFlow}
              disabled={isScanning}
              className="flex items-center gap-2.5 bg-transparent border border-[#E0E2DF] text-[#2C3E35] px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#F2EFEA] transition-all shadow-sm"
            >
              {isScanning ? (
                <span className="w-4 h-4 border-2 border-[#2C3E35] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11v6m0-6l-3 3m3-3l3 3"></path></svg>
              )}
              {isScanning ? 'Analyzing...' : 'Upload New Photo'}
            </button>
          ) : (
            <button
              onClick={handleCaptureAndScan}
              className="flex items-center gap-2.5 bg-[#516454] text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#435245] transition-all shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Capture Photo
            </button>
          )}
        </div>
      </div>

      {/* Main Unified White Card */}
      <div className="bg-white rounded-[32px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[#F0EFEB]">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10">
          
          {/* LEFT COLUMN */}
          <div className="flex flex-col space-y-6">
            {/* User Image Area */}
            <div className="relative w-full h-[420px] bg-[#EAE6DF] rounded-[24px] overflow-hidden">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 border-4 border-dashed border-white/30 rounded-[24px] m-4 pointer-events-none" />
                  <p className="absolute bottom-6 left-0 right-0 text-center text-white text-xs bg-black/50 py-1.5 mx-12 rounded-full backdrop-blur-md">Align face in frame</p>
                </>
              ) : (
                <>
                  <Image
                    src="/images/veyra_hero_velera_portrait.png"
                    alt="User portrait"
                    fill
                    className="object-cover"
                  />
                  {/* Subtle bottom gradient for text readability */}
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent"></div>
                  
                  {scanComplete && (
                    <div className="absolute bottom-5 left-5 right-5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-[16px] p-3.5 flex items-center gap-3">
                      <div className="bg-white rounded-full p-0.5 flex-shrink-0">
                        <svg className="w-4 h-4 text-[#7A6B5D]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold mb-0.5 leading-none">Analysis Complete</p>
                        <p className="text-[10px] text-white/80 font-medium leading-none">{history.length > 0 ? new Date(history[0].createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'Sep 11, 2025 - 10:24 AM'}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Skin Type Block */}
            <div className="bg-[#FAF8F5] rounded-[24px] p-5 flex items-center gap-4">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center border border-[#DCD9D4] rounded-full text-[#516454] bg-transparent">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"></path></svg>
              </div>
              <div>
                <p className="text-[11px] text-[#5C6B61] font-medium tracking-wide mb-1">Your Skin Type</p>
                <h3 className="text-[17px] font-serif text-[#1F2922] font-semibold mb-0.5">Combination</h3>
                <p className="text-[12px] text-[#869188]">Oily T-zone, Normal cheeks</p>
              </div>
            </div>

            {/* Key Concerns */}
            <div className="space-y-4 pt-2">
              <h4 className="text-[14px] font-bold text-[#1F2922]">Key Concerns</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 bg-[#FFF7F5] p-2.5 rounded-[16px] text-[11px] text-[#1F2922] font-semibold">
                  <span className="text-[#E76F51] bg-[#FFE9E3] p-1.5 rounded-full"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path></svg></span>
                  Acne & Breakouts
                </div>
                <div className="flex items-center gap-2 bg-[#FFF9F0] p-2.5 rounded-[16px] text-[11px] text-[#1F2922] font-semibold">
                  <span className="text-[#F4A261] bg-[#FFECCC] p-1.5 rounded-full"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg></span>
                  Uneven Skin Tone
                </div>
                <div className="flex items-center gap-2 bg-[#F6F5F8] p-2.5 rounded-[16px] text-[11px] text-[#1F2922] font-semibold">
                  <span className="text-[#8D7DA3] bg-[#E7E2EE] p-1.5 rounded-full"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span>
                  Large Pores
                </div>
                <div className="flex items-center gap-2 bg-[#F1F6F8] p-2.5 rounded-[16px] text-[11px] text-[#1F2922] font-semibold">
                  <span className="text-[#598CA0] bg-[#E0EDF2] p-1.5 rounded-full"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg></span>
                  Mild Dark Circles
                </div>
              </div>
            </div>

            {/* Button */}
            <button className="w-full bg-[#516454] text-white py-4 rounded-full text-[13px] font-semibold hover:bg-[#435245] transition-all flex justify-between items-center px-6 mt-4 shadow-sm">
              <span className="mx-auto ml-16">View Detailed Report</span>
              <span className="bg-white/20 rounded-full p-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg></span>
            </button>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col space-y-6">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 w-full border-b border-[#F0EFEB] pb-5 overflow-x-auto no-scrollbar">
              <div className="bg-[#FAF8F5] rounded-full p-1 flex whitespace-nowrap">
                {['Overview', 'Skin Concerns', 'Recommendations', 'Products', 'Daily Routine'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all ${activeTab === tab ? 'bg-[#516454] text-white shadow-sm' : 'text-[#6A786E] hover:text-[#1F2922]'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB CONTENT: Overview */}
            {activeTab === 'Overview' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Health Score Box */}
                <div className="border border-[#F0EFEB] rounded-[24px] p-7 flex flex-col md:flex-row gap-8 md:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-6">
                      <h3 className="text-[20px] font-serif text-[#1F2922]">Skin Health Score</h3>
                      <svg className="w-3.5 h-3.5 text-[#B8C2BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="relative w-[110px] h-[110px] flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="44" stroke="#F4F6F4" strokeWidth="8" fill="none" />
                          <circle cx="50" cy="50" r="44" stroke="#516454" strokeWidth="8" fill="none" strokeDasharray="276.46" strokeDashoffset={276.46 - (276.46 * (overallScore || 0)) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[34px] font-serif text-[#1F2922] leading-none mb-1">{overallScore || '-'}</span>
                          <span className="text-[11px] text-[#869188] font-medium border-t border-[#F0EFEB] pt-1 w-10 text-center">/100</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[18px] font-serif text-[#1F2922] font-bold mb-2">{overallScore && overallScore >= 80 ? 'Good' : overallScore && overallScore >= 60 ? 'Fair' : 'Needs Attention'}</h3>
                        <p className="text-[12px] text-[#5C6B61] leading-relaxed max-w-[240px]">
                          {summary || 'Your skin is in good condition! With the right care and consistency, it can look even healthier and more radiant.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Key Strengths */}
                  <div className="bg-[#F6F7F5] rounded-[20px] p-6 md:w-[260px] flex-shrink-0">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="text-[#516454] bg-[#EBECE9] p-1.5 rounded-full">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                      </div>
                      <h4 className="text-[14px] font-bold text-[#1F2922]">Key Strengths</h4>
                    </div>
                    <ul className="space-y-4">
                      <li className="flex items-center gap-3 text-[12px] text-[#425046] font-medium">
                        <svg className="w-3.5 h-3.5 text-[#516454] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                        Good hydration levels
                      </li>
                      <li className="flex items-center gap-3 text-[12px] text-[#425046] font-medium">
                        <svg className="w-3.5 h-3.5 text-[#516454] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                        Healthy skin barrier
                      </li>
                      <li className="flex items-center gap-3 text-[12px] text-[#425046] font-medium">
                        <svg className="w-3.5 h-3.5 text-[#516454] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                        Even skin texture
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metrics.length > 0 ? metrics.map((m: any, i: number) => {
                     const getIcon = (name: string) => {
                       if(name.toLowerCase().includes('hydra')) return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16a4 4 0 100-8 4 4 0 000 8z"></path></svg>;
                       if(name.toLowerCase().includes('oil')) return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>;
                       if(name.toLowerCase().includes('pore')) return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
                       if(name.toLowerCase().includes('textur')) return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16m-7 6h7"></path></svg>;
                       if(name.toLowerCase().includes('dark')) return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>;
                       return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>;
                     };
                     
                     return (
                      <div key={i} className="border border-[#F0EFEB] rounded-[16px] p-5 flex items-start gap-4">
                        <div className="text-[#1F2922] mt-0.5">
                          {getIcon(m.name)}
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h4 className="text-[13px] font-bold text-[#1F2922] mb-0.5">{m.name}</h4>
                            <span className="text-[11px] text-[#5C6B61] block">{m.score}/100</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#F4F6F4] rounded-full overflow-hidden">
                            <div className="h-full bg-[#516454] rounded-full" style={{ width: `${m.score}%` }} />
                          </div>
                        </div>
                      </div>
                     );
                  }) : (
                    // Skeleton loading / placeholders
                    Array(6).fill(0).map((_, i) => (
                      <div key={i} className="border border-[#F0EFEB] rounded-[16px] p-5 flex items-start gap-4 opacity-50">
                        <div className="w-5 h-5 rounded bg-[#EAE6DF]" />
                        <div className="flex-1 space-y-3">
                          <div>
                            <div className="w-24 h-4 bg-[#EAE6DF] rounded mb-1.5" />
                            <div className="w-12 h-3 bg-[#EAE6DF] rounded" />
                          </div>
                          <div className="w-full h-1.5 bg-[#F4F6F4] rounded-full" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Skin Concerns */}
            {activeTab === 'Skin Concerns' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-[20px] font-serif text-[#1F2922]">Skin Concerns Details</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {concerns.length > 0 ? concerns.map((concern, i) => (
                    <div key={i} className="border border-[#F0EFEB] rounded-[16px] p-5 bg-white">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <span className="w-3 h-3 rounded-full" style={{ backgroundColor: concern.color }} />
                           <h4 className="text-[15px] font-bold text-[#1F2922]">{concern.name}</h4>
                        </div>
                        <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: concern.color }}>{concern.level}</span>
                      </div>
                      <div className="w-full h-2 bg-[#F4F6F4] rounded-full overflow-hidden mb-3">
                        <div className="h-full rounded-full" style={{ width: `${concern.score}%`, backgroundColor: concern.color }} />
                      </div>
                      <p className="text-[13px] text-[#5C6B61]">{concern.text}</p>
                      <button 
                        onClick={() => setActiveTab('Recommendations')}
                        className="text-[12px] font-bold text-[#516454] mt-3 hover:underline"
                      >
                        View recommendation →
                      </button>
                    </div>
                  )) : (
                    <div className="text-sm text-[#869188] border border-[#F0EFEB] rounded-[16px] p-5 text-center bg-[#FAF8F5]">
                      No specific skin concerns detected in this scan.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Recommendations */}
            {activeTab === 'Recommendations' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-[#FAF8F5] border border-[#F0EFEB] rounded-[24px] p-7">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start gap-3">
                      <div className="text-[#D4A373] mt-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                      </div>
                      <div>
                        <h3 className="text-[16px] font-serif text-[#1F2922] font-semibold mb-0.5">Your Personalized Recommendations</h3>
                        <p className="text-[12px] text-[#869188]">Simple steps for healthier, clearer and glowing skin.</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-[#516454] bg-white border border-[#E0E2DF] px-3 py-1.5 rounded-full hover:bg-[#F2EFEA] transition-colors"
                    >
                      {isRegenerating ? <span className="w-3 h-3 border border-[#516454] border-t-transparent rounded-full animate-spin" /> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>}
                      {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap mb-6">
                    {['All', 'Lifestyle', 'Diet', 'Home Remedies'].map(tag => (
                      <button 
                        key={tag} 
                        onClick={() => setActiveRecommendationTab(tag)}
                        className={`px-4 py-1.5 rounded-full border text-[12px] font-medium transition-colors ${activeRecommendationTab === tag ? 'bg-[#516454] text-white border-[#516454]' : 'border-[#E0E2DF] text-[#6A786E] hover:bg-[#FAF8F5]'}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommendations.length === 0 && !isRegenerating && (
                      <p className="text-sm text-[#869188] col-span-2">No recommendations available yet. Click Regenerate to generate personalized advice.</p>
                    )}

                    {(activeRecommendationTab === 'All' || activeRecommendationTab === 'Lifestyle') && recommendations.filter(r => r.category === 'LIFESTYLE').map(r => (
                      <div key={r.id} className="bg-white p-5 rounded-2xl border border-[#F0EFEB] space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-[#D4A373]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
                          <h4 className="text-[14px] font-bold text-[#1F2922]">{r.title}</h4>
                        </div>
                        <p className="text-[13px] text-[#5C6B61] leading-relaxed">{r.description}</p>
                        <p className="text-[11px] text-[#869188] italic">Why: {r.reason}</p>
                      </div>
                    ))}

                    {(activeRecommendationTab === 'All' || activeRecommendationTab === 'Diet') && recommendations.filter(r => r.category === 'DIET').map(r => (
                      <div key={r.id} className="bg-white p-5 rounded-2xl border border-[#F0EFEB] space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-[#E76F51]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                          <h4 className="text-[14px] font-bold text-[#1F2922]">{r.title}</h4>
                        </div>
                        <p className="text-[13px] text-[#5C6B61] leading-relaxed">{r.description}</p>
                        <p className="text-[11px] text-[#869188] italic">Why: {r.reason}</p>
                      </div>
                    ))}

                    {(activeRecommendationTab === 'All' || activeRecommendationTab === 'Home Remedies') && recommendations.filter(r => r.category === 'HOMEREMEDIES').map(r => (
                      <div key={r.id} className="bg-white p-5 rounded-2xl border border-[#F0EFEB] space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-[#598CA0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                          <h4 className="text-[14px] font-bold text-[#1F2922]">{r.title}</h4>
                        </div>
                        <p className="text-[13px] text-[#5C6B61] leading-relaxed">{r.description}</p>
                        <p className="text-[11px] text-[#869188] italic">Why: {r.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Products */}
            {activeTab === 'Products' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-[20px] font-serif text-[#1F2922]">Recommended for your skin</h3>
                
                {recommendations.filter(r => r.category === 'SKINCARE').length === 0 && !isRegenerating && (
                  <p className="text-sm text-[#869188]">No matching products available yet. Try regenerating recommendations.</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendations.filter(r => r.category === 'SKINCARE').map(r => {
                    const productData = r.instructions ? JSON.parse(r.instructions) : null;
                    if (!productData) {
                      return null;
                    }

                    return (
                      <div key={r.id} className="border border-[#F0EFEB] rounded-[16px] p-5 hover:border-[#516454]/30 transition-colors cursor-pointer flex flex-col gap-4 bg-white relative overflow-hidden group">
                        <div className="flex items-start gap-4">
                          {productData.imageUrl ? (
                             <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative bg-[#F4F6F4]">
                               <img src={productData.imageUrl} alt={productData.name} className="object-cover w-full h-full" />
                             </div>
                          ) : (
                            <div className="bg-[#FAF8F5] w-16 h-16 flex items-center justify-center rounded-xl text-xl flex-shrink-0">
                              {r.recommendationType.includes('CLEAN') ? '🧴' : '💧'}
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#869188] mb-1 block truncate">{productData.brand} • {r.recommendationType}</span>
                            <h4 className="text-[14px] font-bold text-[#1F2922] mb-1 truncate">{productData.name}</h4>
                            <p className="text-[12px] text-[#5C6B61] font-medium">{productData.currency} {productData.price}</p>
                          </div>
                        </div>

                        <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#F0EFEB]/50">
                          <p className="text-[11px] font-bold text-[#516454] mb-1 flex items-center gap-1">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                             Why Veyra recommends it
                          </p>
                          <p className="text-[12px] text-[#5C6B61] leading-relaxed line-clamp-2">{r.reason || 'Matches your specific skin profile and concerns.'}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Daily Routine */}
            {activeTab === 'Daily Routine' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {(() => {
                  const products = recommendations.filter(r => r.category === 'SKINCARE').map(r => {
                    const parsed = r.instructions ? JSON.parse(r.instructions) : {};
                    return { type: (r.recommendationType || '').toUpperCase(), name: parsed.name, brand: parsed.brand, reason: r.reason || r.description || '' };
                  });
                  
                  const getProduct = (types: string[]) => {
                    for (const t of types) {
                      const p = products.find(p => p.type.includes(t));
                      if (p) return {
                        name: p.brand && p.brand !== 'Veyra Recommendation' ? `${p.brand.toUpperCase()} • ${p.type.replace('_', ' ')}` : p.type.replace('_', ' '),
                        action: p.name
                      };
                    }
                    return null;
                  };

                  const getStep = (types: string[], defaultName: string, defaultAction: string, hiddenIfMissing: boolean = false) => {
                    const p = getProduct(types);
                    if (!p && hiddenIfMissing) return { hidden: true, step: 0, name: '', action: '' };
                    return {
                      name: p ? p.name : defaultName,
                      action: p ? p.action : defaultAction,
                      hidden: false
                    };
                  };

                  const morningRoutine = [
                    getStep(['CLEANSER', 'WASH'], 'Cleanser', 'Wash with gentle circular motions'),
                    getStep(['SERUM'], 'Serum', 'Apply to damp skin and pat gently', true),
                    getStep(['MOISTURIZER', 'CREAM', 'LOTION'], 'Moisturizer', 'Apply to lock in hydration'),
                    getStep(['SUNSCREEN', 'SPF', 'BLOCK'], 'Sunscreen', 'Apply generous amount to face & neck')
                  ].filter(r => !r.hidden).map((r, i) => ({ ...r, step: i + 1 }));

                  const eveningRoutine = [
                    getStep(['CLEANSER', 'WASH'], 'Cleanser', 'Double cleanse to remove SPF/dirt'),
                    getStep(['TREATMENT', 'EXFOLIAN', 'PEEL'], 'Treatment', 'Apply to targeted areas', true),
                    getStep(['EYE'], 'Eye Cream', 'Dab gently around orbital bone', true),
                    getStep(['MOISTURIZER', 'CREAM', 'LOTION'], 'Moisturizer', 'Layer over dry skin to seal actives')
                  ].filter(r => !r.hidden).map((r, i) => ({ ...r, step: i + 1 }));

                  return (
                    <>
                      <div>
                        <h3 className="text-[20px] font-serif text-[#1F2922] flex items-center gap-2 mb-4">
                          <span className="text-[#F4A261]">☀</span> Morning Routine
                        </h3>
                        <div className="space-y-3">
                          {morningRoutine.map(r => (
                            <div key={r.step} className="flex items-center gap-4 border border-[#F0EFEB] rounded-[16px] p-4 bg-white">
                              <div className="w-6 h-6 rounded-full bg-[#EAE6DF] text-[#516454] text-[11px] font-bold flex items-center justify-center flex-shrink-0">{r.step}</div>
                              <div className="flex-1">
                                <h4 className="text-[13px] font-bold text-[#1F2922]">{r.name}</h4>
                                <p className="text-[11px] text-[#869188]">{r.action}</p>
                              </div>
                              <button className="text-[11px] font-bold text-[#516454] px-3 py-1.5 rounded-full border border-[#E0E2DF] hover:bg-[#FAF8F5]">Mark ✓</button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-[20px] font-serif text-[#1F2922] flex items-center gap-2 mb-4">
                          <span className="text-[#8D7DA3]">🌙</span> Evening Routine
                        </h3>
                        <div className="space-y-3">
                          {eveningRoutine.map(r => (
                            <div key={r.step} className="flex items-center gap-4 border border-[#F0EFEB] rounded-[16px] p-4 bg-white">
                              <div className="w-6 h-6 rounded-full bg-[#EAE6DF] text-[#516454] text-[11px] font-bold flex items-center justify-center flex-shrink-0">{r.step}</div>
                              <div className="flex-1">
                                <h4 className="text-[13px] font-bold text-[#1F2922]">{r.name}</h4>
                                <p className="text-[11px] text-[#869188]">{r.action}</p>
                              </div>
                              <button className="text-[11px] font-bold text-[#516454] px-3 py-1.5 rounded-full border border-[#E0E2DF] hover:bg-[#FAF8F5]">Mark ✓</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
