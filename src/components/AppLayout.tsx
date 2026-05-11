"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex h-screen overflow-hidden w-full antialiased bg-surface text-on-surface font-body-md">
      {/* SideNavBar */}
      <nav className="flex-shrink-0 h-screen w-20 flex flex-col justify-between items-center py-panel-padding border-r border-outline-variant bg-inverse-surface z-50">
        <div className="flex flex-col items-center w-full">
          <div className="mb-8 font-display text-display font-bold text-surface text-center">
            <span className="material-symbols-outlined text-[32px]">
              local_hospital
            </span>
          </div>
          <div className="flex flex-col gap-4 w-full px-2">
            <Link
              href="/patient-list"
              className={`flex flex-col items-center p-3 transition-all duration-200 rounded-xl ${
                isActive("/patient-list")
                  ? "bg-primary-container text-on-primary-container scale-95"
                  : "text-surface-variant hover:text-surface hover:bg-surface-variant/10"
              }`}
              title="Patient Queue"
            >
              <span
                className="material-symbols-outlined"
                style={
                  isActive("/patient-list")
                    ? { fontVariationSettings: "'FILL' 1" }
                    : {}
                }
              >
                clinical_notes
              </span>
            </Link>
            <Link
              href="#"
              className="flex flex-col items-center text-surface-variant hover:text-surface p-3 hover:bg-surface-variant/10 transition-colors duration-200 rounded-xl"
              title="Search Records"
            >
              <span className="material-symbols-outlined">search</span>
            </Link>
            <Link
              href="#"
              className="flex flex-col items-center text-surface-variant hover:text-surface p-3 hover:bg-surface-variant/10 transition-colors duration-200 rounded-xl"
              title="Analytics"
            >
              <span className="material-symbols-outlined">analytics</span>
            </Link>
            <Link
              href="#"
              className="flex flex-col items-center text-surface-variant hover:text-surface p-3 hover:bg-surface-variant/10 transition-colors duration-200 rounded-xl"
              title="System Settings"
            >
              <span className="material-symbols-outlined">settings</span>
            </Link>
          </div>
        </div>
        <div className="flex flex-col items-center w-full px-2">
          <button
            className="bg-primary-container text-on-primary-container rounded-full w-12 h-12 flex items-center justify-center mb-4"
            title="New Coding Task"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
          <Link
            href="#"
            className="flex flex-col items-center text-surface-variant hover:text-surface p-3 hover:bg-surface-variant/10 transition-colors duration-200 rounded-xl"
            title="Help Center"
          >
            <span className="material-symbols-outlined">help</span>
          </Link>
          <img
            alt="Medical Coder Profile"
            className="w-10 h-10 rounded-full mt-4 border border-outline-variant object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2ms3aJCaZQ1W8QqZ1oRccglKOIqbFp9ynk5xMfXyB0JghoJn6gMgiMzQn8NwD89UKKyx6-1T0V1QjiKf8VV3_z2vjWBnbx-_WisUwZuOyTst-dE8hLDrAWXtybV4lJgq738dqoEl22yMumeIKKkL99AUs-38zrn6-1SsG3It8tAq21xqS_1LChI9isIw5KOgehHBFwLFnAI1m-7BUB3ROR8LLOnmaKZOR1ROOPlKwfmE_jlALQ8DjGLtaD-zVkMwiegDhBbkDyqI"
          />
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
