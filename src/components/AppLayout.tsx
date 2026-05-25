"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTour } from "@/components/TourProvider";
import { VoiceCommandCenter } from "@/components/VoiceCommandCenter";
import { ProcessTracker } from "@/components/ProcessTracker";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const { startTour } = useTour();

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("sidebar-expanded");
    if (stored !== null) {
      setIsExpanded(stored === "true");
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("sidebar-expanded", String(isExpanded));
    }
  }, [isExpanded, isMounted]);

  const isActive = (path: string) => {
    if (path === "#") return false;
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(path + "/");
  };

  const showExpanded = isExpanded || isHovered;

  return (
    <div className="flex h-screen overflow-hidden w-full antialiased bg-surface text-on-surface font-body-md">
      {/* SideNavBar */}
      <nav 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex-shrink-0 h-screen flex flex-col justify-between items-center py-panel-padding border-r border-outline-variant bg-slate-900 z-50 transition-all duration-300 ease-in-out relative ${showExpanded ? 'w-64' : 'w-20'}`}
      >
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-6 bg-primary text-on-primary rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors border border-slate-800 z-50"
        >
          <span className="material-symbols-outlined text-[16px]">
            {isExpanded ? 'chevron_left' : 'chevron_right'}
          </span>
        </button>

        <div className="flex flex-col items-center w-full">
          <div className="mb-8 flex items-center justify-center gap-3 px-4 w-full h-12 overflow-hidden">
            {/* Miniature Splash Screen Emblem */}
            <div className="relative shrink-0 flex items-center justify-center w-10 h-10">
              
              <div className="w-8 h-8 rounded-lg bg-slate-950 border border-[#004AC6]/80 flex items-center justify-center shadow-[0_0_15px_rgba(0,74,198,0.4)] z-10">
                <span className="material-symbols-outlined text-[18px] text-white">
                  local_hospital
                </span>
              </div>
            </div>
            <span 
              className={`whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 ${showExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}
              style={{ fontFamily: "Helvetica, 'Helvetica Neue', Arial, sans-serif" }}
            >
              <span className="text-white font-black tracking-widest text-base">AERIN</span>
              <span className="text-slate-400 font-medium tracking-wide text-sm">CODER</span>
            </span>
          </div>

          <div className="flex flex-col gap-2 w-full px-3">
            <Link
              href="/patient-list"
              className={`flex items-center px-3 py-3 transition-all duration-200 w-full group relative ${
                isActive("/patient-list")
                  ? "bg-primary text-on-primary border-l-4 border-primary-fixed rounded-r-xl shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
              } ${showExpanded ? 'justify-start' : 'justify-center'}`}
              title={!showExpanded ? "Daftar Pasien" : ""}
            >
              <span
                className={`material-symbols-outlined flex-shrink-0 transition-colors duration-200 ${isActive("/patient-list") ? "text-on-primary" : ""}`}
                style={isActive("/patient-list") ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                clinical_notes
              </span>
              <span className={`whitespace-nowrap font-semibold transition-all duration-300 overflow-hidden ${showExpanded ? 'ml-3 opacity-100 w-full' : 'opacity-0 w-0'}`}>
                Daftar Pasien
              </span>
            </Link>



            <Link
              id="tour-sidebar-policies"
              href="/regulation-settings"
              className={`flex items-center px-3 py-3 transition-all duration-200 w-full group relative ${
                pathname === "/regulation-settings"
                  ? "bg-primary text-on-primary border-l-4 border-primary-fixed rounded-r-xl shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
              } ${showExpanded ? 'justify-start' : 'justify-center'}`}
              title={!showExpanded ? "Pengaturan Regulasi" : ""}
            >
              <span
                className={`material-symbols-outlined flex-shrink-0 transition-colors duration-200 ${pathname === "/regulation-settings" ? "text-on-primary" : ""}`}
                style={pathname === "/regulation-settings" ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                settings
              </span>
              <span className={`whitespace-wrap font-semibold transition-all duration-300 overflow-hidden ${showExpanded ? 'ml-3 opacity-100 w-full' : 'opacity-0 w-0'}`}>
                Pengaturan Regulasi
              </span>
            </Link>

            <Link
              href="/audit-logs"
              className={`flex items-center px-3 py-3 transition-all duration-200 w-full group relative ${
                pathname === "/audit-logs"
                  ? "bg-primary text-on-primary border-l-4 border-primary-fixed rounded-r-xl shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
              } ${showExpanded ? 'justify-start' : 'justify-center'}`}
              title={!showExpanded ? "Log Audit Internal" : ""}
            >
              <span
                className={`material-symbols-outlined flex-shrink-0 transition-colors duration-200 ${pathname === "/audit-logs" ? "text-on-primary" : ""}`}
                style={pathname === "/audit-logs" ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                fact_check
              </span>
              <span className={`whitespace-wrap font-semibold transition-all duration-300 overflow-hidden ${showExpanded ? 'ml-3 opacity-100 w-full' : 'opacity-0 w-0'}`}>
                Log Audit Internal
              </span>
            </Link>

            <Link
              href="/settings/policies/simulator"
              className={`flex items-center px-3 py-3 transition-all duration-200 w-full group relative ${
                pathname.startsWith("/settings/policies/simulator")
                  ? "bg-primary text-on-primary border-l-4 border-primary-fixed rounded-r-xl shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
              } ${showExpanded ? 'justify-start' : 'justify-center'}`}
              title={!showExpanded ? "Validasi Kebijakan Internal" : ""}
            >
              <span
                className={`material-symbols-outlined flex-shrink-0 transition-colors duration-200 ${pathname.startsWith("/settings/policies/simulator") ? "text-on-primary" : ""}`}
                style={pathname.startsWith("/settings/policies/simulator") ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                science
              </span>
              <span className={`whitespace-wrap font-semibold transition-all duration-300 overflow-hidden ${showExpanded ? 'ml-3 opacity-100 w-full' : 'opacity-0 w-0'}`}>
                Validator Kebijakan Internal
              </span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center w-full px-3">
          <button
            onClick={() => startTour()}
            className={`flex items-center px-3 py-3 transition-all duration-200 rounded-xl w-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 ${showExpanded ? 'justify-start' : 'justify-center'}`}
            title={!showExpanded ? "Bantuan Tur AI" : ""}
          >
            <span className="material-symbols-outlined flex-shrink-0">help</span>
            <span className={`whitespace-nowrap font-medium transition-all duration-300 overflow-hidden ${showExpanded ? 'ml-3 opacity-100 w-full text-left' : 'opacity-0 w-0'}`}>
              Bantuan Tur AI
            </span>
          </button>

          <div className={`flex items-center w-full mt-4 p-2 rounded-xl border border-slate-700 bg-slate-800/50 ${showExpanded ? 'justify-start gap-3' : 'justify-center border-transparent bg-transparent'}`}>
            <img
              alt="Medical Coder Profile"
              className="w-10 h-10 rounded-full border border-slate-600 object-cover flex-shrink-0"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2ms3aJCaZQ1W8QqZ1oRccglKOIqbFp9ynk5xMfXyB0JghoJn6gMgiMzQn8NwD89UKKyx6-1T0V1QjiKf8VV3_z2vjWBnbx-_WisUwZuOyTst-dE8hLDrAWXtybV4lJgq738dqoEl22yMumeIKKkL99AUs-38zrn6-1SsG3It8tAq21xqS_1LChI9isIw5KOgehHBFwLFnAI1m-7BUB3ROR8LLOnmaKZOR1ROOPlKwfmE_jlALQ8DjGLtaD-zVkMwiegDhBbkDyqI"
            />
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${showExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
              <span className="text-sm font-bold text-slate-200 whitespace-nowrap">Dr. Andi</span>
              <span className="text-xs text-slate-400 whitespace-nowrap">Clinical Coder</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area Wrapper */}
      <div className="flex-1 flex flex-col bg-background h-screen overflow-hidden relative">
        {/* TopAppBar */}
        <header className="flex-shrink-0 h-16 border-b border-outline-variant bg-surface flex justify-between items-center w-full px-panel-padding z-40">
          <div className="flex items-center gap-6 h-full">
            <span className="font-headline-md text-headline-md font-bold text-on-background">
              Clinical Coding Interface
            </span>
            <nav className="hidden md:flex gap-6 h-full items-center">
              <Link
                href="/"
                className={`${
                  isActive("/")
                    ? "text-primary border-b-2 border-primary font-bold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-all"
                } h-16 flex items-center px-1`}
              >
                Dashboard
              </Link>
              <Link
                id="tour-sidebar-patients"
                href="/patient-list"
                className={`${
                  isActive("/patient-list")
                    ? "text-primary border-b-2 border-primary font-bold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-all"
                } h-16 flex items-center px-1`}
              >
                Patient List
              </Link>
            </nav>
          </div>
          {/* Right side: Voice Command Center */}
          <VoiceCommandCenter />
        </header>

        {/* Main Dashboard Content */}
        <ProcessTracker />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
