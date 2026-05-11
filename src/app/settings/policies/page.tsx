"use client";

import React, { useState, useEffect } from "react";

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

  // Preview State
  const [previewDesc, setPreviewDesc] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Delete Confirmation State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPolicies();
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
      setPreviewDesc(null);
      setPreviewError(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsPreviewLoading(true);
      try {
        const res = await fetch(`/api/icd/lookup?code=${encodeURIComponent(formIcdCode)}`);
        if (res.ok) {
          const data = await res.json();
          setPreviewDesc(data.description);
          setPreviewError(false);
        } else {
          setPreviewDesc(null);
          setPreviewError(true);
        }
      } catch (err) {
        setPreviewDesc(null);
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
    setPreviewDesc(null);
    setPreviewError(false);
    setIsDrawerOpen(true);
  };

  const openDrawerForEdit = (policy: Policy) => {
    setEditingPolicyId(policy.id);
    setFormName(policy.name);
    setFormKeywords(policy.keywords.join(", "));
    setFormIcdCode(policy.icdCode);
    setFormIsActive(policy.isActive);
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

  const totalPolicies = policies.length;
  const activePolicies = policies.filter((p) => p.isActive).length;

  return (
    <>
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-6xl mx-auto overflow-hidden px-1">
      {/* Sticky Header & KPIs */}
      <div className="flex-shrink-0 space-y-6 pb-6 bg-background sticky top-0 z-20">
        <div className="flex justify-between items-center pt-4">
          <div>
            <h1 className="text-2xl font-bold text-on-background">Local Policies Configuration</h1>
            <p className="text-on-surface-variant text-sm mt-1">Atur aturan logika bisnis koding spesifik untuk rumah sakit.</p>
          </div>
          <button 
            onClick={openDrawerForNew}
            className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Tambah Aturan Baru
          </button>
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
        <h2 className="text-lg font-bold text-on-surface mb-4 flex-shrink-0">Daftar Aturan</h2>
        
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
        ) : (
          <div className="flex flex-col gap-4">
            {policies.map((policy) => (
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
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)}></div>
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-surface h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h2 className="text-xl font-bold text-on-surface">
                {editingPolicyId ? "Edit Aturan" : "Tambah Aturan Baru"}
              </h2>
              <button onClick={() => setIsDrawerOpen(false)} className="text-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-variant/10">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
              {/* Form Fields */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Nama Aturan</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Stroke Non Hemoragik"
                  className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Keywords</label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="Contoh: SNH, Stroke Infark, Stroke"
                  className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-on-surface-variant mt-1">Pisahkan dengan koma ( , )</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface">Target ICD-10 Code</label>
                <input
                  type="text"
                  value={formIcdCode}
                  onChange={(e) => setFormIcdCode(e.target.value)}
                  placeholder="Contoh: I63.9"
                  className="w-full px-4 py-2 border border-outline-variant rounded-lg bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all uppercase"
                />
                
                {/* Live Preview Box */}
                <div className="mt-2 min-h-[44px]">
                  {isPreviewLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Mencari kode...
                    </div>
                  ) : previewDesc ? (
                    <div className="flex items-start gap-2 text-sm text-emerald-800 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="material-symbols-outlined text-[18px] text-emerald-600 mt-0.5">check_circle</span>
                      <span className="font-medium">Preview: {previewDesc}</span>
                    </div>
                  ) : previewError ? (
                    <div className="flex items-start gap-2 text-sm text-amber-800 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                      <span className="material-symbols-outlined text-[18px] text-amber-600 mt-0.5">warning</span>
                      <span>Kode tidak ditemukan di kamus resmi ICD-10.</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-6 border-t border-outline-variant">
                <div>
                  <h3 className="text-sm font-semibold text-on-surface">Status Aktif</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Terapkan aturan ini saat AI melakukan koding</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={formIsActive} onChange={(e) => setFormIsActive(e.target.checked)} />
                    <div className={`block w-12 h-7 rounded-full transition-colors ${formIsActive ? "bg-emerald-500" : "bg-slate-300"}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${formIsActive ? "transform translate-x-5" : ""}`}></div>
                  </div>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3">
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                disabled={isSaving}
              >
                Batal
              </button>
              <button 
                onClick={handleSave}
                disabled={!formName || !formKeywords || !formIcdCode || isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Aturan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => !isDeleting && setIsDeleteDialogOpen(false)}></div>
          
          <div className="relative bg-surface w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-600">
                <span className="material-symbols-outlined text-[32px]">warning</span>
              </div>
              
              <h3 className="text-xl font-bold text-on-surface mb-2">Hapus Aturan?</h3>
              <p className="text-on-surface-variant text-sm mb-6">
                Apakah Anda yakin ingin menghapus aturan <span className="font-semibold text-on-surface">"{policyToDelete?.name}"</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  ) : (
                    "Hapus"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
