'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, RefreshCw, FileText, TrendingDown, ShieldAlert,
  CheckCircle2, Target, Zap, BookOpen, BarChart3, Layers, Download
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { ALL_DEPARTMENTS, getDeptIcon } from '@/lib/data/govt-data';
import { useGovtStore } from '@/stores/govtStore';
import { scopeToCity } from '@/lib/data/needs';

export default function SchemeGapAnalysisPage() {
  const [needs, setNeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeCity } = useGovtStore();
  const DEPARTMENTS = ALL_DEPARTMENTS[activeCity] || ALL_DEPARTMENTS['rajkot'];

  // AI Analysis states
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzePhase, setAnalyzePhase] = useState('');

  // Policy Draft states
  const [policyDraft, setPolicyDraft] = useState<any>(null);
  const [isDraftingPolicy, setIsDraftingPolicy] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const policyDraftRef = useRef<HTMLDivElement>(null);

  // Sync needs from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'needs'), (snapshot) => {
      const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNeeds(all);
      setLoading(false);
    }, (err) => {
      console.warn("Firestore needs sync offline:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filter strictly for government needs
  const govtNeeds = scopeToCity(needs).filter((n: any) => n.assignment_type === 'government');

  // Compute category distribution from live needs
  const categoryDistribution: Record<string, number> = {};
  govtNeeds.forEach((n: any) => {
    const deptId = n.assigned_department || 'unknown';
    const catName = DEPARTMENTS.find(d => d.id === deptId)?.name || 'General Municipal Work';
    categoryDistribution[catName] = (categoryDistribution[catName] || 0) + 1;
  });

  // Compute department load distribution
  const departmentLoad: Record<string, number> = {};
  govtNeeds.forEach((n: any) => {
    const dept = n.assigned_department || 'unknown';
    departmentLoad[dept] = (departmentLoad[dept] || 0) + 1;
  });

  // Run AI Scheme Gap Analysis
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setPolicyDraft(null);

    // Animated loading phases
    const phases = [
      'Collecting Firestore needs data...',
      'Cross-referencing 12 central government schemes...',
      'Gemma is analysing policy coverage',
      'Calculating gap percentages & severity...',
      'Generating priority actions...'
    ];
    let phaseIdx = 0;
    setAnalyzePhase(phases[0]);
    const phaseInterval = setInterval(() => {
      phaseIdx++;
      if (phaseIdx < phases.length) {
        setAnalyzePhase(phases[phaseIdx]);
      }
    }, 1500);

    toast.loading("Starting Gemma", { id: "scheme-analysis" });

    try {
      const res = await fetch("/api/ai/scheme-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          needsDistribution: categoryDistribution,
          totalNeeds: govtNeeds.length
        })
      });

      clearInterval(phaseInterval);
      setAnalyzePhase('');

      if (!res.ok) throw new Error("Analysis API failed");
      const data = await res.json();
      setAnalysisResult(data);
      toast.success("Scheme Gap Analysis Complete!", { id: "scheme-analysis", icon: "🧠" });
    } catch (err) {
      console.error(err);
      clearInterval(phaseInterval);
      setAnalyzePhase('');
      // No canned analysis. This previously substituted a complete twelve-scheme
      // coverage report, with invented gap percentages and a specific budget
      // proposal, whenever the model was unreachable. An officer could act on
      // that believing it described their own ward.
      toast.error("Gemma is not reachable. No analysis was produced.", { id: "scheme-analysis" });
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate Policy Draft
  const handleGeneratePolicyDraft = async () => {
    if (!analysisResult) return;
    setIsDraftingPolicy(true);
    toast.loading("Drafting executive policy brief...", { id: "policy-draft" });

    try {
      const res = await fetch("/api/ai/scheme-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "draft",
          analysisData: analysisResult
        })
      });

      if (!res.ok) throw new Error("Draft API failed");
      const data = await res.json();
      setPolicyDraft(data);
      toast.success("Policy Draft Generated!", { id: "policy-draft", icon: "📄" });
    } catch (err) {
      console.error(err);
      // No canned brief. This previously substituted a pre-written policy
      // document proposing a specific ₹15 Crore fund whenever the model was
      // unreachable, which an officer could have downloaded as a PDF and
      // forwarded believing it was analysis of their own ward's data.
      toast.error("Gemma could not draft this. Nothing was generated.", { id: "policy-draft" });
      setPolicyDraft(null);
    } finally {
      setIsDraftingPolicy(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!policyDraftRef.current) return;
    setIsDownloading(true);
    toast.loading("Generating High-Resolution PDF...", { id: "pdf-download" });

    try {
      const canvas = await html2canvas(policyDraftRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`MCD_Policy_Brief_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("PDF Downloaded Successfully!", { id: "pdf-download", icon: "📥" });
    } catch (error) {
      console.error("PDF Generation failed:", error);
      toast.error("Failed to generate PDF.", { id: "pdf-download" });
    } finally {
      setIsDownloading(false);
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-sky-600 bg-sky-50 border-sky-200';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'critical': return { bar: 'bg-red-500', badge: 'text-red-600 bg-red-50 border-red-200' };
      case 'strained': return { bar: 'bg-amber-500', badge: 'text-amber-600 bg-amber-50 border-amber-200' };
      default: return { bar: 'bg-emerald-500', badge: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Page Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-100/40 rounded-full blur-[80px] pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <span className="text-[9px] font-mono text-violet-600 font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-1 bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-full w-max">
            <Sparkles size={10} className="text-violet-600 animate-pulse" /> Runs on Gemma 4, locally
          </span>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-mukta">Scheme Gap Analysis (AI)</h1>
          <p className="text-xs text-slate-500 font-semibold">
            {govtNeeds.length} live community needs ready for cross-referencing against 12 central government schemes
          </p>
        </div>

        <div className="flex gap-3 relative z-10">
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing || loading}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 transition-all shadow-[0_0_25px_rgba(139,92,246,0.2)] active:scale-[0.98] cursor-pointer"
          >
            {isAnalyzing ? (
              <><RefreshCw className="animate-spin" size={13} /> Analyzing...</>
            ) : (
              <><Sparkles size={13} /> {analysisResult ? 'Re-Run Analysis' : 'Run AI Gap Analysis'}</>
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="bg-white border border-violet-100 rounded-[2.5rem] p-10 text-center space-y-5 shadow-sm relative overflow-hidden animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-50/50 to-transparent pointer-events-none" />
          <div className="relative z-10 w-16 h-16 mx-auto bg-violet-50 border border-violet-200 rounded-2xl flex items-center justify-center">
            <Sparkles size={28} className="text-violet-600 animate-pulse" />
          </div>
          <div className="relative z-10">
            <h3 className="text-slate-800 font-black text-sm">Gemma 4 vision</h3>
            <p className="text-violet-600 text-[10px] font-mono font-bold mt-2 animate-pulse">{analyzePhase}</p>
          </div>
          <div className="relative z-10 max-w-xs mx-auto">
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full animate-pulse" style={{ width: '65%' }} />
            </div>
          </div>
        </div>
      )}

      {/* Pre-Analysis: Quick Firestore stats + Department Heatmap */}
      {!analysisResult && !isAnalyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Empty state call to action */}
          <div className="lg:col-span-7">
            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50 space-y-4">
              <div className="w-20 h-20 mx-auto bg-slate-100 border border-slate-200 rounded-3xl flex items-center justify-center">
                <Sparkles className="text-slate-300" size={36} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">AI Analysis Awaiting</h4>
                <p className="text-[11px] text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                  Click <strong>"Run AI Gap Analysis"</strong> to have Gemma cross-reference <strong>{govtNeeds.length}</strong> live community needs against <strong>12 central government schemes</strong> and generate a complete coverage matrix, gap identification, priority actions, and policy recommendations.
                </p>
              </div>
              <button
                onClick={handleRunAnalysis}
                disabled={loading}
                className="mt-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] inline-flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer shadow-lg"
              >
                <Sparkles size={13} /> Run AI Gap Analysis
              </button>
            </div>
          </div>

          {/* Right: Live stats from Firestore (not static) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Department Heatmap — real Firestore data */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 mb-4 border-b border-slate-100 pb-3">
                <Layers size={14} className="text-indigo-500" /> Live Department Load (Firestore)
              </h4>
              <div className="space-y-3">
                {DEPARTMENTS.map((dept) => {
                  const load = departmentLoad[dept.id] || 0;
                  const maxLoad = Math.max(...Object.values(departmentLoad), 1);
                  const barWidth = Math.max(Math.round((load / maxLoad) * 100), 4);
                  return (
                    <div key={dept.id} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                        {getDeptIcon(dept.id)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[9px] font-black text-slate-700 truncate">{dept.name}</span>
                          <span className="text-[8px] font-mono text-slate-500">{load} tasks</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${load >= 5 ? 'bg-red-500' : load >= 3 ? 'bg-amber-500' : 'bg-blue-500'}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick stats tiles — real Firestore data */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/90 backdrop-blur border border-slate-200/60 rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] text-center transform transition-transform hover:-translate-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Needs</p>
                <h3 className="text-3xl font-black text-slate-800 font-mukta">{needs.length}</h3>
              </div>
              <div className="bg-white/90 backdrop-blur border border-blue-100 rounded-2xl p-5 shadow-[0_4px_20px_rgb(59,130,246,0.08)] text-center transform transition-transform hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
                <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Govt Routed</p>
                <h3 className="text-3xl font-black text-blue-600 font-mukta">
                  {govtNeeds.length}
                </h3>
              </div>
              <div className="bg-white/90 backdrop-blur border border-violet-100 rounded-2xl p-5 shadow-[0_4px_20px_rgb(139,92,246,0.08)] text-center transform transition-transform hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-violet-500" />
                <p className="text-[8px] font-black text-violet-400 uppercase tracking-widest mb-1">Categories</p>
                <h3 className="text-3xl font-black text-violet-600 font-mukta">{Object.keys(categoryDistribution).length}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ALL CONTENT BELOW IS 100% AI-GENERATED AFTER BUTTON CLICK
          ═══════════════════════════════════════════════════════════ */}
      {analysisResult && (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500">

          {/* Row 1: Overall Score + Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Overall Coverage Score */}
            <div className="lg:col-span-5 bg-gradient-to-br from-violet-600 to-indigo-700 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-[40px]" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Target size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-violet-200 uppercase tracking-widest">AI Coverage Score</p>
                  <h2 className="text-3xl font-black font-mukta">{analysisResult.overall_coverage_score}%</h2>
                </div>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${analysisResult.overall_coverage_score}%` }} />
              </div>
              <p className="text-[9px] text-violet-200 mt-2 font-medium">{analysisResult.data_summary}</p>
            </div>

            {/* Right: Stats + Department heatmap */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Needs</p>
                  <h3 className="text-2xl font-black text-slate-800 font-mukta">{needs.length}</h3>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Govt Routed</p>
                  <h3 className="text-2xl font-black text-blue-600 font-mukta">
                    {needs.filter((n: any) => n.assignment_type === 'government').length}
                  </h3>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Gaps Found</p>
                  <h3 className="text-2xl font-black text-red-600 font-mukta">{(analysisResult.gaps || []).length}</h3>
                </div>
              </div>

              {/* Department heatmap */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm">
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                  <Layers size={14} className="text-slate-500" /> Department Impact Heatmap
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {DEPARTMENTS.map((dept) => {
                    const load = departmentLoad[dept.id] || 0;
                    const maxLoad = Math.max(...Object.values(departmentLoad), 1);
                    const barWidth = Math.max(Math.round((load / maxLoad) * 100), 4);
                    return (
                      <div key={dept.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                          {getDeptIcon(dept.id)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[8px] font-black text-slate-700 truncate">{dept.name}</span>
                            <span className="text-[7px] font-mono text-slate-500">{load}</span>
                          </div>
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${load >= 5 ? 'bg-red-500' : load >= 3 ? 'bg-amber-500' : 'bg-blue-500'}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: AI-Generated Scheme Coverage Matrix */}
          {analysisResult.scheme_coverage && analysisResult.scheme_coverage.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                <BarChart3 size={16} className="text-violet-600" /> AI Scheme Coverage Matrix
                <span className="ml-2 text-[8px] font-mono text-violet-500 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded uppercase">
                  Generated by Gemma
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysisResult.scheme_coverage.map((scheme: any, i: number) => {
                  const style = getStatusStyle(scheme.status);
                  return (
                    <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1 h-full ${style.bar}`} />
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wide truncate">{scheme.scheme_name}</h4>
                          <p className="text-[9px] text-slate-400 mt-0.5 truncate">{scheme.description}</p>
                        </div>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border shrink-0 uppercase ${style.badge}`}>
                          {scheme.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${style.bar}`} style={{ width: `${scheme.coverage_percent}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-700 shrink-0">{scheme.coverage_percent}%</span>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <p className="text-[9px] text-slate-600 font-medium truncate flex-1">{scheme.weakness}</p>
                        <span className="text-[8px] font-mono text-slate-500 shrink-0 ml-2">{scheme.needs_addressed} needs</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Row 3: Gap Cards */}
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 mb-4">
              <TrendingDown size={16} className="text-red-500" /> Identified Scheme-to-Need Gaps
              <span className="ml-2 text-[8px] font-mono text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded uppercase">AI Detected</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(analysisResult.gaps || []).map((gap: any, i: number) => (
                <div key={i} className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${
                    gap.severity === 'critical' ? 'bg-red-500' : gap.severity === 'warning' ? 'bg-amber-500' : 'bg-sky-500'
                  }`} />
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <h4 className="text-xs font-black text-slate-800 leading-tight">{gap.category}</h4>
                    <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase shrink-0 ${getSeverityStyle(gap.severity)}`}>
                      {gap.gap_percent}% Gap
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        gap.severity === 'critical' ? 'bg-red-500' : gap.severity === 'warning' ? 'bg-amber-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${gap.gap_percent}%` }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-start gap-1.5">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider shrink-0 mt-0.5">Scheme:</span>
                      <span className="text-[10px] text-slate-600 font-bold">{gap.existing_scheme}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[8px] font-black text-red-400 uppercase tracking-wider shrink-0 mt-0.5">Gap:</span>
                      <span className="text-[10px] text-slate-700 font-medium leading-relaxed">{gap.scheme_weakness}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 4: Priority Actions */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 mb-4">
              <Zap size={16} className="text-amber-500" /> Priority Policy Actions
              <span className="ml-2 text-[8px] font-mono text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">AI Recommended</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(analysisResult.priority_actions || []).map((action: any, i: number) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 hover:bg-slate-100/60 transition-all">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-[10px] font-black border border-violet-200">{i + 1}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{action.timeline}</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-800 leading-relaxed">{action.action}</p>
                  <p className="text-[9px] text-emerald-700 font-extrabold flex items-center gap-1">
                    <CheckCircle2 size={10} /> {action.impact}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Row 5: Policy Recommendation */}
          <div className="bg-gradient-to-r from-indigo-50/80 to-violet-50/40 border border-indigo-100 rounded-[2.5rem] p-6 shadow-sm">
            <h3 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <BookOpen size={14} /> Gemma policy recommendation
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed italic">"{analysisResult.policy_recommendation}"</p>
            <button
              onClick={handleGeneratePolicyDraft}
              disabled={isDraftingPolicy}
              className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
            >
              {isDraftingPolicy ? (
                <><RefreshCw className="animate-spin" size={12} /> Drafting...</>
              ) : (
                <><FileText size={12} /> Generate Policy Draft</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Policy Draft Output */}
      {policyDraft && (
        <div 
          ref={policyDraftRef}
          className="bg-white border-2 border-indigo-200 rounded-[2.5rem] p-8 shadow-lg relative overflow-hidden animate-in slide-in-from-bottom duration-500"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-600 to-violet-600" />
          
          <div className="flex justify-between items-start mb-4">
            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">📋 Municipal Policy Brief</span>
            <div className="flex items-center gap-3">
              <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">
                Official Draft — AI Generated
              </span>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95"
              >
                {isDownloading ? <RefreshCw className="animate-spin" size={12} /> : <Download size={12} />}
                Download PDF
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 font-mukta">{policyDraft.title}</h2>
            </div>

            <div className="text-sm text-slate-700 leading-[1.8] whitespace-pre-line border-t border-slate-100 pt-4">
              {policyDraft.brief}
            </div>

            {policyDraft.key_directives && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mt-4">
                <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <ShieldAlert size={12} /> Key Executive Directives
                </h4>
                <div className="space-y-2">
                  {policyDraft.key_directives.map((d: string, i: number) => (
                    <div key={i} className="flex items-start gap-2.5 text-[11px] text-slate-700">
                      <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">{i + 1}</span>
                      <span className="font-bold leading-relaxed">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
