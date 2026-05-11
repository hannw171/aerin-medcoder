"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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

  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex h-screen overflow-hidden w-full antialiased bg-surface text-on-surface font-body-md">
      {/* SideNavBar */}
      <nav className={`flex-shrink-0 h-screen flex flex-col justify-between items-center py-panel-padding border-r border-outline-variant bg-slate-900 z-50 transition-all duration-300 ease-in-out relative ${isExpanded ? 'w-64' : 'w-20'}`}>
        
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
          <div className="mb-8 flex items-center justify-center text-primary-container gap-3 px-4 w-full h-10 overflow-hidden">
            <span className="material-symbols-outlined text-[32px] flex-shrink-0">
              local_hospital
            </span>
            <span className={`font-display text-xl font-bold whitespace-nowrap transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
              Aerin Coder
            </span>
          </div>

          <div className="flex flex-col gap-2 w-full px-3">
            <Link
              href="/patient-list"
              className={`flex items-center px-3 py-3 transition-all duration-200 rounded-xl w-full ${
                isActive("/patient-list")
                  ? "bg-primary text-on-primary"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              } ${isExpanded ? 'justify-start' : 'justify-center'}`}
              title={!isExpanded ? "Daftar Pasien" : ""}
            >
              <span
                className="material-symbols-outlined flex-shrink-0"
                style={isActive("/patient-list") ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                clinical_notes
              </span>
              <span className={`whitespace-nowrap font-medium transition-all duration-300 overflow-hidden ${isExpanded ? 'ml-3 opacity-100 w-full' : 'opacity-0 w-0'}`}>
                Daftar Pasien
              </span>
            </Link>

            <Link
              href="#"
              className={`flex items-center px-3 py-3 transition-all duration-200 rounded-xl w-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 ${isExpanded ? 'justify-start' : 'justify-center'}`}
              title={!isExpanded ? "Pencarian" : ""}
            >
              <span className="material-symbols-outlined flex-shrink-0">search</span>
              <span className={`whitespace-nowrap font-medium transition-all duration-300 overflow-hidden ${isExpanded ? 'ml-3 opacity-100 w-full' : 'opacity-0 w-0'}`}>
                Pencarian
              </span>
            </Link>

            <Link
              href="#"
              className={`flex items-center px-3 py-3 transition-all duration-200 rounded-xl w-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 ${isExpanded ? 'justify-start' : 'justify-center'}`}
              title={!isExpanded ? "Analitik" : ""}
            >
              <span className="material-symbols-outlined flex-shrink-0">analytics</span>
              <span className={`whitespace-nowrap font-medium transition-all duration-300 overflow-hidden ${isExpanded ? 'ml-3 opacity-100 w-full' : 'opacity-0 w-0'}`}>
                Analitik
              </span>
            </Link>

            <Link
              href="/settings/policies"
              className={`flex items-center px-3 py-3 transition-all duration-200 rounded-xl w-full ${
                pathname.startsWith("/settings/policies")
                  ? "bg-primary text-on-primary"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              } ${isExpanded ? 'justify-start' : 'justify-center'}`}
              title={!isExpanded ? "Pengaturan Aturan" : ""}
            >
              <span
                className="material-symbols-outlined flex-shrink-0"
                style={pathname.startsWith("/settings/policies") ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                settings
              </span>
              <span className={`whitespace-nowrap font-medium transition-all duration-300 overflow-hidden ${isExpanded ? 'ml-3 opacity-100 w-full' : 'opacity-0 w-0'}`}>
                Pengaturan
              </span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center w-full px-3">
          <button
            className={`bg-primary text-on-primary hover:bg-primary/90 transition-colors rounded-full h-12 flex items-center justify-center mb-4 ${isExpanded ? 'w-full px-4 justify-start gap-2 rounded-xl' : 'w-12'}`}
            title={!isExpanded ? "Tugas Baru" : ""}
          >
            <span className="material-symbols-outlined flex-shrink-0">add</span>
            <span className={`font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              Tugas Baru
            </span>
          </button>
          <Link
            href="#"
            className={`flex items-center px-3 py-3 transition-all duration-200 rounded-xl w-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 ${isExpanded ? 'justify-start' : 'justify-center'}`}
            title={!isExpanded ? "Bantuan" : ""}
          >
            <span className="material-symbols-outlined flex-shrink-0">help</span>
            <span className={`whitespace-nowrap font-medium transition-all duration-300 overflow-hidden ${isExpanded ? 'ml-3 opacity-100 w-full' : 'opacity-0 w-0'}`}>
              Bantuan
            </span>
          </Link>

          <div className={`flex items-center w-full mt-4 p-2 rounded-xl border border-slate-700 bg-slate-800/50 ${isExpanded ? 'justify-start gap-3' : 'justify-center border-transparent bg-transparent'}`}>
            <img
              alt="Medical Coder Profile"
              className="w-10 h-10 rounded-full border border-slate-600 object-cover flex-shrink-0"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2ms3aJCaZQ1W8QqZ1oRccglKOIqbFp9ynk5xMfXyB0JghoJn6gMgiMzQn8NwD89UKKyx6-1T0V1QjiKf8VV3_z2vjWBnbx-_WisUwZuOyTst-dE8hLDrAWXtybV4lJgq738dqoEl22yMumeIKKkL99AUs-38zrn6-1SsG3It8tAq21xqS_1LChI9isIw5KOgehHBFwLFnAI1m-7BUB3ROR8LLOnmaKZOR1ROOPlKwfmE_jlALQ8DjGLtaD-zVkMwiegDhBbkDyqI"
            />
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
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
                href="/patient-list"
                className={`${
                  isActive("/patient-list")
                    ? "text-primary border-b-2 border-primary font-bold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-all"
                } h-16 flex items-center px-1`}
              >
                Patient List
              </Link>
              <Link
                href="#"
                className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-all h-16 flex items-center px-1"
              >
                Reports
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-element-gap">
            <div className="relative hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                search
              </span>
              <input
                className="pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-64 transition-colors"
                placeholder="Search patient or code..."
                type="text"
              />
            </div>
            <button className="bg-primary text-on-primary px-4 py-2 rounded-lg font-body-md font-medium hover:bg-primary/90 transition-colors hidden sm:block">
              Save Progress
            </button>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
              </button>
              <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
                <span className="material-symbols-outlined">
                  account_circle
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
