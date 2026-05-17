"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Types for a compliance rule
interface BaseRule {
  id: string;
  targetCode: string;
  ruleType: "Batasan Usia" | "Screening PRB" | "Restriksi Gender" | "Tips FAQ Casemix";
  recommendation: string;
}

interface AgeRule extends BaseRule {
  ruleType: "Batasan Usia";
  minAge: number;
  maxAge: number;
}

interface GenderRule extends BaseRule {
  ruleType: "Restriksi Gender";
  gender: "Laki-laki" | "Perempuan";
}

interface ScreeningRule extends BaseRule {
  ruleType: "Screening PRB";
  keywords: string; // comma‑separated list
}

interface TipsRule extends BaseRule {
  ruleType: "Tips FAQ Casemix";
}

type Rule = AgeRule | GenderRule | ScreeningRule | TipsRule;

export function ClinicalRulesTab() {
  // ---------- Form State ----------
  const [targetCode, setTargetCode] = useState("");
  const [ruleType, setRuleType] = useState<Rule["ruleType"]>("Batasan Usia");
  const [recommendation, setRecommendation] = useState("");

  // Conditional fields
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [gender, setGender] = useState("Laki-laki");
  const [keywords, setKeywords] = useState("");

  // ---------- Rules List ----------
  const [rules, setRules] = useState<Rule[]>([]);

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

    const newRule: Rule = (() => {
      const base = {
        id: crypto.randomUUID(),
        targetCode,
        ruleType,
        recommendation,
      } as BaseRule;

      switch (ruleType) {
        case "Batasan Usia":
          return {
            ...base,
            ruleType,
            minAge: Number(minAge) || 0,
            maxAge: Number(maxAge) || 0,
          } as AgeRule;
        case "Restriksi Gender":
          return { ...base, ruleType, gender } as GenderRule;
        case "Screening PRB":
          return { ...base, ruleType, keywords } as ScreeningRule;
        case "Tips FAQ Casemix":
          return { ...base, ruleType } as TipsRule;
      }
    })();

    setRules((prev) => [...prev, newRule]);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  // ---------- Render Helpers ----------
  const renderCondition = (rule: Rule) => {
    switch (rule.ruleType) {
      case "Batasan Usia":
        const age = rule as AgeRule;
        return `${age.minAge} ≤ Usia ≤ ${age.maxAge}`;
      case "Restriksi Gender":
        const g = rule as GenderRule;
        return `Gender: ${g.gender}`;
      case "Screening PRB":
        const s = rule as ScreeningRule;
        return `Kata Kunci: ${s.keywords}`;
      case "Tips FAQ Casemix":
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
              className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium placeholder-slate-400"
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Tipe Aturan</label>
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as Rule["ruleType"]) }
              className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
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
                className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
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
                className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
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
              className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
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
              className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
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
            className="w-full px-4 py-3 border border-outline-variant rounded-xl bg-background text-on-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm min-h-[80px] placeholder-slate-400"
            rows={3}
            required
          />
        </div>

        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 flex items-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tambah Aturan
        </button>
      </form>

      {/* ---- Rules Table ---- */}
      {rules.length > 0 && (
        <div className="mt-12">
          <h3 className="text-lg font-bold text-on-surface mb-4">Daftar Aturan Klinis</h3>
          <div className="overflow-x-auto rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <table className="min-w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4 font-bold">Kode</th>
                  <th className="px-6 py-4 font-bold">Tipe Aturan</th>
                  <th className="px-6 py-4 font-bold">Kondisi</th>
                  <th className="px-6 py-4 font-bold">Rekomendasi</th>
                  <th className="px-6 py-4 font-bold text-right">Aksi</th>
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
                    <td className="px-6 py-4 text-slate-600 leading-relaxed max-w-xs">{rule.recommendation}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
    </div>
  );
}
