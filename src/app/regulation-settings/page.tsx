"use client";

import React, { useState } from "react";
import { PolicyMappingTab } from "@/components/PolicyMappingTab";
import { ClinicalRulesTab } from "@/components/ClinicalRulesTab";

const TABS = [
  { id: "icd-mapping", label: "Pemetaan Kode (ICD-10)", icon: "swap_horiz" },
  { id: "clinical-rules", label: "Kamus & Batasan Klinis", icon: "library_books" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function RegulationSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("icd-mapping");

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-6xl mx-auto overflow-hidden px-1">
      {/* Page Header */}
      <div className="flex-shrink-0 pt-4 pb-6">
        <h1 className="text-2xl font-bold text-on-background tracking-tight">
          Pengaturan Regulasi
        </h1>
        <p className="text-on-surface-variant text-sm mt-1.5 max-w-2xl">
          Kelola substitusi kode ICD dan parameter kepatuhan klaim BPJS secara mandiri.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 border-b border-outline-variant mb-6">
        <nav className="flex gap-1" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all duration-200 rounded-t-lg
                ${activeTab === tab.id
                  ? "text-primary bg-primary/5"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }
              `}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={activeTab === tab.id ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {tab.icon}
              </span>
              {tab.label}

              {/* Active indicator bar */}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "icd-mapping" && <PolicyMappingTab />}

        {activeTab === "clinical-rules" && <ClinicalRulesTab />}
      </div>
    </div>
  );
}
