"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useRegulationStore, RuleType, ComplianceRule } from "@/store/useRegulationStore";

export function ClinicalRulesTab() {
  // ---------- Form State ----------
  const [targetCode, setTargetCode] = useState("");
  const [ruleType, setRuleType] = useState<RuleType>("Batasan Usia");
  const [recommendation, setRecommendation] = useState("");

  // Conditional fields
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [gender, setGender] = useState("Laki-laki");
  const [keywords, setKeywords] = useState("");

  // ---------- Edit Form State ----------
  const [editingRule, setEditingRule] = useState<ComplianceRule | null>(null);
  const [editTargetCode, setEditTargetCode] = useState("");
  const [editRuleType, setEditRuleType] = useState<RuleType>("Batasan Usia");
  const [editRecommendation, setEditRecommendation] = useState("");
  const [editMinAge, setEditMinAge] = useState("");
  const [editMaxAge, setEditMaxAge] = useState("");
  const [editGender, setEditGender] = useState("Laki-laki");
  const [editKeywords, setEditKeywords] = useState("");

  const { rules, addRule, deleteRule, updateRule } = useRegulationStore();

  const resetForm = () => {
    setTargetCode("");
    setRuleType("Batasan Usia");
    setRecommendation("");
    setMinAge("");
    setMaxAge("");
    setGender("Laki-laki");
    setKeywords("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCode || !recommendation) return;

    const newRuleCondition: any = {};
    if (ruleType === "Batasan Usia") {
      newRuleCondition.minAge = Number(minAge) || 0;
      newRuleCondition.maxAge = Number(maxAge) || 0;
    } else if (ruleType === "Restriksi Gender") {
      newRuleCondition.requiredGender = gender;
    } else if (ruleType === "Screening PRB") {
      newRuleCondition.mandatoryClinicalKeywords = keywords;
    }

    addRule({
      targetCode,
      ruleType,
      recommendation,
      condition: Object.keys(newRuleCondition).length > 0 ? newRuleCondition : undefined,
    });
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteRule(id);
  };

  const handleEditClick = (rule: ComplianceRule) => {
    setEditingRule(rule);
    setEditTargetCode(rule.targetCode);
    setEditRuleType(rule.ruleType);
    setEditRecommendation(rule.recommendation);
    if (rule.ruleType === "Batasan Usia") {
      setEditMinAge(String(rule.condition?.minAge ?? ""));
      setEditMaxAge(String(rule.condition?.maxAge ?? ""));
      setEditGender("Laki-laki");
      setEditKeywords("");
    } else if (rule.ruleType === "Restriksi Gender") {
      setEditMinAge("");
      setEditMaxAge("");
      setEditGender(rule.condition?.requiredGender ?? "Laki-laki");
      setEditKeywords("");
    } else if (rule.ruleType === "Screening PRB") {
      setEditMinAge("");
      setEditMaxAge("");
      setEditGender("Laki-laki");
      setEditKeywords(rule.condition?.mandatoryClinicalKeywords ?? "");
    } else {
      setEditMinAge("");
      setEditMaxAge("");
      setEditGender("Laki-laki");
      setEditKeywords("");
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule || !editTargetCode || !editRecommendation) return;

    const updatedCondition: any = {};
    if (editRuleType === "Batasan Usia") {
      updatedCondition.minAge = Number(editMinAge) || 0;
      updatedCondition.maxAge = Number(editMaxAge) || 0;
    } else if (editRuleType === "Restriksi Gender") {
      updatedCondition.requiredGender = editGender;
    } else if (editRuleType === "Screening PRB") {
      updatedCondition.mandatoryClinicalKeywords = editKeywords;
    }

    updateRule(editingRule.id, {
      targetCode: editTargetCode,
      ruleType: editRuleType,
      recommendation: editRecommendation,
      condition: Object.keys(updatedCondition).length > 0 ? updatedCondition : undefined,
    });

    setEditingRule(null);
  };

  // ---------- Render Helpers ----------
  const renderCondition = (rule: any) => {
    switch (rule.ruleType) {
      case "Batasan Usia":
        return `${rule.condition?.minAge} ≤ Usia ≤ ${rule.condition?.maxAge}`;
      case "Restriksi Gender":
        return `Gender: ${rule.condition?.requiredGender}`;
      case "Screening PRB":
        return `Kata Kunci: ${rule.condition?.mandatoryClinicalKeywords}`;
      case "Tips FAQ Casemix":
        return "‑";
      default:
        return "‑";
    }
  };

  return (
    <div className="p-6 bg-background text-on-surface h-full overflow-y-auto custom-scrollbar pb-20">
      <h2 className="text-xl font-bold text-on-background mb-6">Kamus & Batasan Klinis</h2>

      {/* ---- Form ---- */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        {/* Target Code & Rule Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Target Code</label>
            <input
              type="text"
              placeholder="e.g., J20.9 or E11"
              value={targetCode}
              onChange={(e) => setTargetCode(e.target.value)}
              className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium placeholder-slate-400"
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Tipe Aturan</label>
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as RuleType) }
              className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
            >
              <option value="Batasan Usia">Batasan Usia</option>
              <option value="Screening PRB">Screening PRB</option>
              <option value="Restriksi Gender">Restriksi Gender</option>
              <option value="Tips FAQ Casemix">Tips FAQ Casemix</option>
            </select>
          </div>
        </div>

        {/* Conditional Fields */}
        {ruleType === "Batasan Usia" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Minimal Usia</label>
              <input
                type="number"
                placeholder="0"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Maksimal Usia</label>
              <input
                type="number"
                placeholder="120"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                required
              />
            </div>
          </div>
        )}

        {ruleType === "Restriksi Gender" && (
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as "Laki-laki" | "Perempuan")}
              className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
            >
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
        )}

        {ruleType === "Screening PRB" && (
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Kata Kunci Klinis Wajib</label>
            <input
              type="text"
              placeholder="e.g., stabil, rutin, kontrol - separated by commas"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
            />
          </div>
        )}

        {/* Recommendation */}
        <div>
          <label className="text-sm font-bold text-slate-700 block mb-2">Actionable Insight / Rekomendasi Solusi</label>
          <textarea
            placeholder="Pesan yang akan ditampilkan ke coder jika aturan terpicu..."
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm min-h-[80px] placeholder-slate-400"
            rows={3}
            required
          />
        </div>

        <button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tambah Aturan
        </button>
      </form>

      {/* ---- Rules Table ---- */}
      {rules.length > 0 && (
        <div className="mt-12">
          <h3 className="text-lg font-bold text-on-surface mb-4">Daftar Aturan Klinis</h3>
          <div className="max-h-[450px] overflow-y-auto overflow-x-auto rounded-xl border border-outline-variant shadow-sm relative">
            <table className="min-w-full text-left text-sm border-collapse">
              <thead className="text-slate-600 border-b border-outline-variant sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 font-bold bg-slate-50">Kode</th>
                  <th className="px-6 py-4 font-bold bg-slate-50">Tipe Aturan</th>
                  <th className="px-6 py-4 font-bold bg-slate-50">Kondisi</th>
                  <th className="px-6 py-4 font-bold bg-slate-50">Rekomendasi</th>
                  <th className="px-6 py-4 font-bold text-right bg-slate-50">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b border-outline-variant hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-md font-bold">
                        {rule.targetCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{rule.ruleType}</td>
                    <td className="px-6 py-4 text-slate-600">{renderCondition(rule)}</td>
                    <td className="px-6 py-4 leading-relaxed max-w-xs">
                      <span 
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}
                        title={rule.recommendation}
                        className="block text-slate-600 text-sm"
                      >
                        {rule.recommendation}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-1">
                      <button
                        type="button"
                        onClick={() => handleEditClick(rule)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        title="Edit Aturan"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rule.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Aturan"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- Edit Sidepanel ---- */}
      <AnimatePresence>
        {editingRule && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingRule(null)}
              className="fixed inset-0 bg-slate-900 z-50 pointer-events-auto"
            />
            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
              className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 border-l border-outline-variant flex flex-col pointer-events-auto text-on-surface"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[24px]">edit_note</span>
                  <h3 className="text-lg font-bold text-slate-800">Edit Aturan Klinis</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar flex flex-col justify-between">
                <div className="space-y-5">
                  {/* Target Code & Rule Type */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-1.5">Target Code</label>
                      <input
                        type="text"
                        placeholder="e.g., J20.9 or E11"
                        value={editTargetCode}
                        onChange={(e) => setEditTargetCode(e.target.value)}
                        className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium placeholder-slate-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-1.5">Tipe Aturan</label>
                      <select
                        value={editRuleType}
                        onChange={(e) => setEditRuleType(e.target.value as RuleType)}
                        className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                      >
                        <option value="Batasan Usia">Batasan Usia</option>
                        <option value="Screening PRB">Screening PRB</option>
                        <option value="Restriksi Gender">Restriksi Gender</option>
                        <option value="Tips FAQ Casemix">Tips FAQ Casemix</option>
                      </select>
                    </div>
                  </div>

                  {/* Conditional Fields */}
                  {editRuleType === "Batasan Usia" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-1.5">Minimal Usia</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={editMinAge}
                          onChange={(e) => setEditMinAge(e.target.value)}
                          className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-1.5">Maksimal Usia</label>
                        <input
                          type="number"
                          placeholder="120"
                          value={editMaxAge}
                          onChange={(e) => setEditMaxAge(e.target.value)}
                          className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {editRuleType === "Restriksi Gender" && (
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-1.5">Gender</label>
                      <select
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value)}
                        className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                        <option value="L">L</option>
                        <option value="P">P</option>
                      </select>
                    </div>
                  )}

                  {editRuleType === "Screening PRB" && (
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-1.5">Kata Kunci Klinis Wajib</label>
                      <input
                        type="text"
                        placeholder="e.g., stabil, rutin, kontrol - separated by commas"
                        value={editKeywords}
                        onChange={(e) => setEditKeywords(e.target.value)}
                        className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
                      />
                    </div>
                  )}

                  {/* Recommendation */}
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">Actionable Insight / Rekomendasi Solusi</label>
                    <textarea
                      placeholder="Pesan yang akan ditampilkan ke coder jika aturan terpicu..."
                      value={editRecommendation}
                      onChange={(e) => setEditRecommendation(e.target.value)}
                      className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm min-h-[100px] placeholder-slate-400"
                      rows={3}
                      required
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-6 border-t border-outline-variant flex items-center justify-end gap-3 bg-white mt-8">
                  <button
                    type="button"
                    onClick={() => setEditingRule(null)}
                    className="px-5 py-2.5 border border-outline rounded-xl font-bold hover:bg-slate-50 transition-all text-slate-600 text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2 text-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
