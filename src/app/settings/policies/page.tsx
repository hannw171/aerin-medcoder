"use client";

import React, { useState, useEffect } from "react";
import { SearchableICDInput } from "@/components/SearchableICDInput";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Policy = {
  id: string;
  name: string;
  keywords: string[];
  icdCode: string;
  isActive: boolean;
};

export default function LocalPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formKeywords, setFormKeywords] = useState("");
  const [formIcdCode, setFormIcdCode] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Test State
  const [testText, setTestText] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Preview State
  const [previewData, setPreviewData] = useState<{
    description: string;
    chapter: string;
    category: string;
    type: string;
  } | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Delete Confirmation State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPolicies();
    
    // Add Esc key listener
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDrawerOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const fetchPolicies = async () => {
    try {
      const res = await fetch("/api/settings/policies");
      if (res.ok) {
        const data = await res.json();
        setPolicies(data);
      }
    } catch (error) {
      console.error("Failed to fetch policies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Live Preview Logic with Debounce
  useEffect(() => {
    if (!formIcdCode) {
      setPreviewData(null);
      setPreviewError(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsPreviewLoading(true);
      try {
        const res = await fetch(`/api/icd/lookup?code=${encodeURIComponent(formIcdCode)}`);
        if (res.ok) {
          const data = await res.json();
          setPreviewData({
            description: data.description,
            chapter: data.chapter,
            category: data.category,
            type: data.type
          });
          setPreviewError(false);
        } else {
          setPreviewData(null);
          setPreviewError(true);
        }
      } catch (err) {
        setPreviewData(null);
        setPreviewError(true);
      } finally {
        setIsPreviewLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formIcdCode]);

  const togglePolicyStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/settings/policies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        setPolicies(policies.map((p) => p.id === id ? { ...p, isActive: !currentStatus } : p));
      }
    } catch (error) {
      console.error("Failed to update policy:", error);
    }
  };

  const triggerDelete = (policy: Policy) => {
    setPolicyToDelete(policy);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!policyToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/settings/policies/${policyToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setPolicies(policies.filter((p) => p.id !== policyToDelete.id));
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to delete policy:", error);
    } finally {
      setIsDeleting(false);
      setPolicyToDelete(null);
    }
  };

  const openDrawerForNew = () => {
    setEditingPolicyId(null);
    setFormName("");
    setFormKeywords("");
    setFormIcdCode("");
    setFormIsActive(true);
    setPreviewData(null);
    setPreviewError(false);
    setTestText("");
    setIsDrawerOpen(true);
  };

  const openDrawerForEdit = (policy: Policy) => {
    setEditingPolicyId(policy.id);
    setFormName(policy.name);
    setFormKeywords(policy.keywords.join(", "));
    setFormIcdCode(policy.icdCode);
    setFormIsActive(policy.isActive);
    setTestText("");
    setIsDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!formName || !formKeywords || !formIcdCode) return;
    setIsSaving(true);

    const payload = {
      name: formName,
      keywords: formKeywords.split(",").map(k => k.trim()).filter(k => k),
      icdCode: formIcdCode.toUpperCase(),
      isActive: formIsActive
    };

    try {
      let res;
      if (editingPolicyId) {
        res = await fetch(`/api/settings/policies/${editingPolicyId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/settings/policies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        await fetchPolicies();
        setIsDrawerOpen(false);
      }
    } catch (err) {
      console.error("Failed to save policy", err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPolicies = policies.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.icdCode.toLowerCase().includes(q) ||
      p.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  const isTestMatched = React.useMemo(() => {
    if (!testText.trim() || !formKeywords.trim()) return false;
    const keywords = formKeywords.split(",").map(k => k.trim().toLowerCase()).filter(k => k);
    if (keywords.length === 0) return false;
    const lowerTestText = testText.toLowerCase();
    return keywords.some(kw => lowerTestText.includes(kw));
  }, [testText, formKeywords]);

  const totalPolicies = policies.length;
  const activePolicies = policies.filter((p) => p.isActive).length;

  return (
    <>
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-6xl mx-auto overflow-hidden px-1">
      {/* Sticky Header & KPIs */}
      <div id="tour-policies-header" className="flex-shrink-0 space-y-6 pb-6 bg-background sticky top-0 z-20">
        <div className="flex justify-between items-center pt-4">
          <div className="max-w-2xl pr-8">
            <h1 className="text-2xl font-bold text-on-background">Local Policies Configuration</h1>
            <p className="text-on-surface-variant text-sm mt-1">
              <span className="font-semibold text-primary">Modul sinkronisasi kebijakan lokal dengan AI Reasoning Engine.</span> Atur aturan logika bisnis koding spesifik internal rumah sakit.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/settings/policies/simulator"
              className="border border-primary text-primary hover:bg-primary-container/10 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">science</span>
              Local Policies Hub
            </Link>
            <button 
              id="tour-policies-add"
              onClick={openDrawerForNew}
              className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Tambah Aturan Baru
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Aturan */}
          <div className="bg-surface-container rounded-xl p-5 border border-outline-variant shadow-sm flex flex-col justify-center">
            <span className="text-on-surface-variant text-sm font-medium mb-1">Total Aturan</span>
            <span className="text-3xl font-bold text-on-surface">{isLoading ? "-" : totalPolicies}</span>
          </div>
          {/* Aturan Aktif */}
          <div className="bg-surface-container rounded-xl p-5 border border-outline-variant shadow-sm flex flex-col justify-center">
            <span className="text-on-surface-variant text-sm font-medium mb-1">Aturan Aktif</span>
            <span className="text-3xl font-bold text-emerald-600">{isLoading ? "-" : activePolicies}</span>
          </div>
          {/* Status Sinkronisasi */}
          <div className="bg-surface-container rounded-xl p-5 border border-outline-variant shadow-sm flex flex-col justify-center">
            <span className="text-on-surface-variant text-sm font-medium mb-1">Status Sinkronisasi</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <span className="text-emerald-700 font-semibold text-sm">AI Terkoneksi</span>
            </div>
          </div>
          {/* Update Terakhir */}
          <div className="bg-surface-container rounded-xl p-5 border border-outline-variant shadow-sm flex flex-col justify-center">
            <span className="text-on-surface-variant text-sm font-medium mb-1">Update Terakhir</span>
            <span className="text-on-surface font-semibold">Hari ini</span>
          </div>
        </div>
      </div>

      {/* Scrollable Policy List Section */}
      <div className="flex-1 flex flex-col min-h-0 px-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-on-surface">Daftar Aturan</h2>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Cari aturan, keyword, atau ICD..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
            <span className="material-symbols-outlined absolute left-3 top-2 text-on-surface-variant text-[20px]">search</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-surface-container rounded-xl animate-pulse border border-outline-variant"></div>
            ))}
          </div>
        ) : policies.length === 0 ? (
          <div className="text-center p-10 border border-dashed border-outline-variant rounded-xl bg-surface-container-low text-on-surface-variant">
            Belum ada aturan yang dikonfigurasi.
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="text-center p-10 border border-dashed border-outline-variant rounded-xl bg-surface-container-low text-on-surface-variant">
            Tidak ada aturan yang cocok dengan pencarian.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredPolicies.map((policy) => (
              <div
                key={policy.id}
                className={`flex flex-col md:flex-row items-center justify-between p-5 rounded-xl border transition-all ${
                  policy.isActive ? "bg-surface-container border-outline-variant shadow-sm" : "bg-surface-container-low border-outline-variant opacity-60"
                }`}
              >
                <div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
                  {/* Logic Visualizer */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-bold text-slate-500">JIKA</span>
                    <div className="flex flex-wrap gap-1">
                      {policy.keywords.map((kw, i) => (
                        <span key={i} className="bg-slate-200 text-slate-700 px-2 py-1 rounded-md text-xs font-medium">{kw}</span>
                      ))}
                    </div>
                    <span className="font-bold text-slate-500 ml-2">MAKA</span>
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-md font-bold">{policy.icdCode}</span>
                    <span className="text-slate-500 text-sm italic ml-2">({policy.name})</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-4 md:mt-0 self-end md:self-auto">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={policy.isActive} onChange={() => togglePolicyStatus(policy.id, policy.isActive)} />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${policy.isActive ? "bg-emerald-500" : "bg-slate-300"}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${policy.isActive ? "transform translate-x-4" : ""}`}></div>
                    </div>
                    <span className="ml-2 text-sm text-slate-600 font-medium w-12">{policy.isActive ? "Aktif" : "Mati"}</span>
                  </label>
                  <div className="flex items-center gap-1 border-l pl-4 border-slate-200">
                    <button onClick={() => openDrawerForEdit(policy)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Aturan">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button onClick={() => triggerDelete(policy)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Aturan">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
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
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>

      {/* Side Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          >
            {/* Drawer Panel */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-xl bg-surface h-full shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-xl font-bold text-on-surface">
                    {editingPolicyId ? "Edit Aturan" : "Tambah Aturan Baru"}
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">Konfigurasi logika AI untuk koding otomatis.</p>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)} 
                  className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="flex flex-col gap-8 pb-20">
                  {/* Form Sections */}
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-slate-700">Nama Aturan</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Contoh: Sepsis with Organ Failure"
                        className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-slate-700">Keywords (Triggers)</label>
                      <textarea
                        value={formKeywords}
                        onChange={(e) => setFormKeywords(e.target.value)}
                        placeholder="Contoh: sepsis, syok septik, kegagalan organ"
                        className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm min-h-[80px]"
                      />
                      <p className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded inline-block self-start">💡 Pisahkan dengan koma ( , )</p>
                    </div>

                    <div className="flex flex-col gap-2 relative">
                      <label className="text-sm font-bold text-slate-700">Target ICD-10 Code</label>
                      <SearchableICDInput
                        type="icd10"
                        placeholder="Cari ICD-10 (Contoh: A41.9)"
                        value={formIcdCode}
                        onChange={(val) => setFormIcdCode(val.toUpperCase())}
                        onSelect={(item) => setFormIcdCode(item.code)}
                      />
                      
                      {/* Live Preview Box */}
                      <div className="mt-3">
                        {isPreviewLoading ? (
                          <div className="flex items-center gap-2 text-sm text-slate-500 px-4 py-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                            Validasi kode...
                          </div>
                        ) : previewData ? (
                          <div className="flex flex-col gap-3 p-4 bg-emerald-50/40 rounded-xl border border-emerald-100 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg text-sm shrink-0 shadow-sm">
                                  {formIcdCode}
                                </div>
                                <div className="font-bold text-slate-800 text-sm leading-tight mt-0.5">
                                  {previewData.description}
                                </div>
                              </div>
                              <div className="bg-white border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap shadow-xs uppercase tracking-wider">
                                {previewData.type}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 border-t border-emerald-100/50 pt-3">
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">account_tree</span>
                                <span>Chapter {previewData.chapter}</span>
                              </div>
                              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                              <span>Category {previewData.category}</span>
                            </div>
                          </div>
                        ) : previewError ? (
                          <div className="flex items-start gap-3 text-sm text-amber-800 px-4 py-3 bg-amber-50 rounded-xl border border-amber-200">
                            <span className="material-symbols-outlined text-[20px] text-amber-600">warning</span>
                            <span className="font-medium">Kode tidak ditemukan di kamus resmi ICD-10. Pastikan kode valid sesuai standar INA-CBG.</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Uji Logika Aturan */}
                  <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-[20px]">biotech</span>
                      <label className="text-sm font-bold text-slate-700">Uji Logika Aturan (Simulator)</label>
                    </div>
                    <textarea
                      className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm min-h-[100px]"
                      placeholder="Masukkan contoh teks resume medis di sini untuk melihat apakah aturan ini akan terpicu..."
                      value={testText}
                      onChange={(e) => setTestText(e.target.value)}
                    />
                    
                    <div className="animate-in fade-in duration-300">
                      {!testText ? (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 px-1 font-medium">
                          <span className="material-symbols-outlined text-sm">info</span>
                          Simulasikan narasi koding untuk memverifikasi akurasi kata kunci.
                        </div>
                      ) : isTestMatched ? (
                        <div className="flex items-center gap-3 p-3 bg-emerald-600 text-white rounded-xl shadow-md">
                          <span className="material-symbols-outlined text-[24px]">verified</span>
                          <span className="text-xs font-bold leading-tight">
                            ATURAN TERPICU: AI akan menyarankan kode {formIcdCode || "???"} berdasarkan teks ini.
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-slate-200 text-slate-700 rounded-xl">
                          <span className="material-symbols-outlined text-[24px]">cancel</span>
                          <span className="text-xs font-bold leading-tight">
                            BELUM COCOK: Periksa kembali kata kunci atau narasi uji coba.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Status Aturan</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Aktifkan untuk sinkronisasi dengan AI.</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" className="sr-only" checked={formIsActive} onChange={(e) => setFormIsActive(e.target.checked)} />
                        <div className={`block w-12 h-7 rounded-full transition-colors ${formIsActive ? "bg-emerald-600" : "bg-slate-300"}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${formIsActive ? "transform translate-x-5" : ""}`}></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="p-6 border-t border-outline-variant bg-white flex justify-between items-center shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm"
                  disabled={isSaving}
                >
                  Batal
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!formName || !formKeywords || !formIcdCode || isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-200 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 flex items-center gap-2 text-sm"
                >
                  {isSaving ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">save</span>
                      Simpan Kebijakan
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteDialogOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !isDeleting && setIsDeleteDialogOpen(false)}
          >
            {/* Modal Panel */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className="relative bg-surface w-full max-w-sm rounded-3xl shadow-2xl p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 text-rose-600 ring-4 ring-rose-100">
                  <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>delete_forever</span>
                </div>
                
                <h3 className="text-2xl font-black text-on-surface mb-3 tracking-tight">Hapus Aturan?</h3>
                <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">
                  Apakah Anda yakin ingin menghapus aturan <span className="font-bold text-slate-900 italic">"{policyToDelete?.name}"</span>? 
                  <br /><span className="text-rose-600 font-medium">Tindakan ini tidak dapat dibatalkan.</span>
                </p>
                
                <div className="flex w-full gap-4">
                  <button 
                    onClick={() => setIsDeleteDialogOpen(false)}
                    disabled={isDeleting}
                    className="flex-1 px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-200 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    ) : (
                      "Ya, Hapus"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
