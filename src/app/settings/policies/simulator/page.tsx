"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

type Policy = {
  id: string;
  name: string;
  keywords: string[];
  icdCode: string;
  isActive: boolean;
};

type MatchedPolicy = {
  policy: Policy;
  triggerKeyword: string;
  matchIndex: number;
  category: "Diagnosa Primer" | "Diagnosa Sekunder";
};

export default function LogicSimulatorPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [matches, setMatches] = useState<MatchedPolicy[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    document.title = "Local Rule Compliance Hub | Aerin MedCoder";
  }, []);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await fetch("/api/settings/policies");
        if (res.ok) {
          const data = await res.json();
          // Filter to active only for simulation
          setPolicies(data.filter((p: Policy) => p.isActive));
        }
      } catch (error) {
        console.error("Failed to fetch policies:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  useEffect(() => {
    if (!inputText.trim()) {
      setMatches([]);
      return;
    }

    const lowerInput = inputText.toLowerCase();
    const newMatches: MatchedPolicy[] = [];

    policies.forEach((policy) => {
      let earliestMatchIndex = -1;
      let matchedKeyword = "";

      for (const kw of policy.keywords) {
        const lowerKw = kw.toLowerCase();
        const index = lowerInput.indexOf(lowerKw);
        if (index !== -1) {
          if (earliestMatchIndex === -1 || index < earliestMatchIndex) {
            earliestMatchIndex = index;
            matchedKeyword = kw;
          }
        }
      }

      if (earliestMatchIndex !== -1) {
        newMatches.push({
          policy,
          triggerKeyword: matchedKeyword,
          matchIndex: earliestMatchIndex,
          category: "Diagnosa Sekunder" // default, will be updated based on sort
        });
      }
    });

    // Sort by match index (first appearing keyword)
    newMatches.sort((a, b) => a.matchIndex - b.matchIndex);

    // Assign 'Diagnosa Primer' to the first match
    if (newMatches.length > 0) {
      newMatches[0].category = "Diagnosa Primer";
      for (let i = 1; i < newMatches.length; i++) {
        newMatches[i].category = "Diagnosa Sekunder";
      }
    }

    setMatches(newMatches);
  }, [inputText, policies]);

  const primaryMatches = matches.filter(m => m.category === "Diagnosa Primer");
  const secondaryMatches = matches.filter(m => m.category === "Diagnosa Sekunder");

  const handleCopy = () => {
    if (matches.length === 0) return;

    const primer = primaryMatches[0];
    const sekunder = secondaryMatches.map(m => `${m.policy.icdCode} (${m.policy.name})`).join(", ");

    let resultText = `[Aerin-MedCoder Analysis] Primer: ${primer ? `${primer.policy.icdCode} (${primer.policy.name})` : "Tidak ada"}`;
    if (secondaryMatches.length > 0) {
      resultText += ` Sekunder: ${sekunder}`;
    }

    navigator.clipboard.writeText(resultText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-7xl mx-auto overflow-hidden px-1">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between pb-6 bg-background sticky top-0 z-20 pt-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/settings/policies" className="text-slate-500 hover:text-primary transition-colors flex items-center">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <h1 className="text-2xl font-bold text-on-background">Local Policies Compliance Hub</h1>
          </div>
          <p className="text-on-surface-variant text-sm ml-7">
            Uji interaksi multi-aturan terhadap narasi medis kompleks secara real-time sebagai guardrail dari keputusan koding AI
          </p>
        </div>
        <button 
          onClick={handleCopy}
          disabled={matches.length === 0}
          className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-mono transition-colors hover:cursor-pointer disabled:pointer-events-none shadow-sm relative"
        >
          {isCopied ? (
            <>
              <span className="material-symbols-outlined text-[18px] text-emerald-400">check</span>
              <span className="text-emerald-400">Tersalin!</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
              Copy Results
            </>
          )}
        </button>
      </div>

      {/* Split Screen Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 pb-6">
        
        {/* Left Column: Input */}
        <div className="flex-1 flex flex-col bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b border-outline-variant px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-500">edit_document</span>
            <h2 className="font-semibold text-slate-800">Narasi Klinis Lengkap</h2>
          </div>
          <textarea
            className="flex-1 w-full p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 leading-relaxed custom-scrollbar"
            placeholder="Ketik atau paste narasi diagnosa pasien di sini...&#10;Contoh: Pasien masuk dengan keluhan kelemahan separuh badan. Diagnosa SNH, ada riwayat Hipertensi dan Gagal Ginjal Kronik."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="bg-blue-50 border-t border-outline-variant px-4 py-2 text-xs text-slate-500 flex justify-between">
            <span>{inputText.length} karakter</span>
            {isLoading ? <span>Memuat aturan...</span> : <span>{policies.length} aturan aktif dimuat</span>}
          </div>
        </div>

        {/* Right Column: Analysis / Debugger */}
        <div className="flex-[1.2] flex flex-col bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden text-slate-300 font-mono">
          <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">terminal</span>
              <h2 className="font-semibold text-slate-200 text-sm tracking-wide">ANALYSIS_ENGINE</h2>
            </div>
            {matches.length > 0 && (
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {!inputText.trim() ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-3">
                <span className="material-symbols-outlined text-4xl opacity-50">data_object</span>
                <p className="text-sm">Menunggu input teks...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Top Section: Summary */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="text-sm text-slate-400">
                    STATUS: <span className="text-primary font-bold">OK</span>
                  </div>
                  <div className="text-sm bg-slate-800 text-slate-300 px-3 py-1 rounded">
                    {matches.length} Aturan Terdeteksi
                  </div>
                </div>

                {/* Middle Section: Triggered Policies */}
                <div className="space-y-6">
                  {/* Primary Match */}
                  {primaryMatches.length > 0 && (
                    <div>
                      {primaryMatches.map((m, idx) => (
                        <div 
                          key={m.policy.id + idx} 
                          className="bg-primary/5 border-2 border-primary/40 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] rounded-xl p-5 animate-in slide-in-from-right-4 duration-300"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                                Diagnosa Primer
                              </span>
                              <span className="text-slate-200 text-base font-semibold">{m.policy.name}</span>
                            </div>
                            <span className="text-primary font-bold bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-sm shadow-sm">
                              {m.policy.icdCode}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/50">
                            <div className="text-xs text-slate-400 flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px] text-amber-500">search</span>
                              Triggered by: <span className="text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-mono">"{m.triggerKeyword}"</span> 
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-500">
                              Ditemukan di awal
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Secondary Matches Grid */}
                  {secondaryMatches.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {secondaryMatches.map((m, idx) => {
                        const isMiddle = m.matchIndex < inputText.length / 2;
                        return (
                          <div 
                            key={m.policy.id + idx} 
                            className="bg-slate-800/40 border border-slate-700/60 rounded-lg p-3 animate-in slide-in-from-right-4 duration-300 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  Sekunder
                                </span>
                                <span className="text-blue-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700/50 text-xs">
                                  {m.policy.icdCode}
                                </span>
                              </div>
                              <span className="text-slate-300 text-sm font-medium line-clamp-1 mb-3" title={m.policy.name}>
                                {m.policy.name}
                              </span>
                            </div>
                            
                            <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-700/50 pt-2 mt-auto">
                              <span className="truncate pr-2">
                                by: <span className="text-amber-400/80">"{m.triggerKeyword}"</span>
                              </span>
                              <span className="text-slate-500 italic shrink-0">
                                {isMiddle ? "tengah" : "akhir"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {matches.length === 0 && (
                    <div className="text-slate-500 text-sm py-4 border-l-2 border-slate-700 pl-3">
                      &gt; Tidak ada aturan yang cocok dengan narasi saat ini.
                    </div>
                  )}
                </div>

                {/* Bottom Section: Final Preview */}
                {matches.length > 0 && (
                  <div className="mt-8 border-t border-slate-800 pt-6">
                    <h3 className="text-xs text-slate-500 mb-3 uppercase tracking-wider">&gt; Final Output Preview</h3>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
                      
                      {primaryMatches.length > 0 && (
                        <div>
                          <div className="text-primary text-xs font-bold mb-2">DIAGNOSA PRIMER</div>
                          {primaryMatches.map(m => (
                            <div key={m.policy.id} className="flex gap-3 text-sm items-center mb-1">
                              <span className="w-16 font-bold text-slate-300">[{m.policy.icdCode}]</span>
                              <span className="text-slate-400">{m.policy.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {secondaryMatches.length > 0 && (
                        <div>
                          <div className="text-blue-500 text-xs font-bold mb-2">DIAGNOSA SEKUNDER</div>
                          {secondaryMatches.map(m => (
                            <div key={m.policy.id} className="flex gap-3 text-sm items-center mb-1">
                              <span className="w-16 font-bold text-slate-300">[{m.policy.icdCode}]</span>
                              <span className="text-slate-400">{m.policy.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569; /* slate-600 */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b; /* slate-500 */
        }
      `}</style>
    </div>
  );
}
