import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import ImageUploader from '../components/ImageUploader';
import AnalysisResults from '../components/AnalysisResults';
import { Activity, ShieldCheck, Users, Sparkles, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const [results, setResults] = useState<any>(null);

  const handleAnalysisComplete = (data: any) => {
    setResults(data);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <Navbar />

      <main className="container mx-auto px-4 py-12 relative">
        {/* Background Decorative Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-green-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-20 mt-8 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100/50 text-green-700 font-medium text-sm mb-6 border border-green-200/50 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            <span>Next-Generation Dermatological AI</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-6 leading-tight">
            AI-Powered Skin Analysis <br className="hidden md:block" />
            for <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500 dark:from-green-400 dark:to-emerald-300">Better Healthcare</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
            Advanced computer vision and multimodal AI to evaluate skin health, classify conditions, and provide personalized recommendations for dermatology clinics and telemedicine.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative bg-green-700 hover:bg-green-800 text-white h-14 px-8 inline-flex items-center justify-center rounded-xl text-base font-semibold transition-all shadow-lg hover:shadow-green-700/25 hover:-translate-y-0.5 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              <Activity className="mr-2 h-5 w-5 relative z-10" />
              <span className="relative z-10">Start Analysis</span>
              <ChevronRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 h-14 px-8 inline-flex items-center justify-center rounded-xl text-base font-semibold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              View Demo
            </button>
          </div>
        </div>

        {/* Highlight Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-24 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-green-900/5 hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors duration-300">
              <Activity className="h-7 w-7 text-green-600 dark:text-green-400 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">Instant Analysis</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Get comprehensive, highly accurate skin analysis results in seconds using our advanced proprietary AI models.</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-green-900/5 hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors duration-300">
              <ShieldCheck className="h-7 w-7 text-green-600 dark:text-green-400 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">Clinical Grade</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Trusted by top dermatology clinics globally with proven medical-grade accuracy, consistency, and reliability.</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-green-900/5 hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors duration-300">
              <Users className="h-7 w-7 text-green-600 dark:text-green-400 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">Patient Friendly</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Clear, deeply interpretable reports paired with highly personalized, actionable daily skincare recommendations.</p>
          </div>
        </div>

        {/* Interactive Workspace */}
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden" id="demo">
          {/* Subtle accent blob inside workspace */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 dark:bg-green-900/20 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />

          <div className="text-center mb-10 relative z-10">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 mb-4 tracking-tight">Try Our Skin Analysis</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Upload a clear, well-lit photo of the skin area you'd like to analyze for the most accurate AI diagnosis.</p>
          </div>
          
          <div className="relative z-10">
            {!results ? (
              <ImageUploader onAnalysisComplete={handleAnalysisComplete} />
            ) : (
              <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <AnalysisResults results={results} />
                <div className="mt-10 flex justify-center">
                  <button 
                    onClick={() => setResults(null)}
                    className="group bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 h-12 px-8 rounded-xl font-semibold transition-all border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    Analyze Another Image
                    <Activity className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
