"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useBackgroundCoder } from "@/store/useBackgroundCoder";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ProcessTrackerInner() {
  const { processState, currentPatient, targetUrl, clearProcess } = useBackgroundCoder();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Task 1 & 4: Build the full current URL string including query params
  // and compare against targetUrl to decide visibility
  const currentFullPath = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  // The tracker is "on the patient's page" if the current URL matches targetUrl
  const isOnTargetPage = targetUrl !== null && currentFullPath === targetUrl;

  // Task 3: When user navigates back to the patient's page while processing, hide the tracker.
  // Also auto-clear the completed state when user arrives on the target page.
  useEffect(() => {
    if (isOnTargetPage && processState === "completed") {
      // User is back on the patient page — clear the tracker silently
      clearProcess();
    }
  }, [isOnTargetPage, processState, clearProcess]);

  // Task 1: Only show tracker when (processing or completed or error) AND NOT on the target page
  const hasActiveProcess =
    processState === "processing" || processState === "completed" || processState === "error";
  const isVisible = hasActiveProcess && !isOnTargetPage;

  // Auto-clear completed/error state after 12 seconds if user doesn't interact
  useEffect(() => {
    if (processState === "completed" || processState === "error") {
      const timer = setTimeout(() => {
        clearProcess();
      }, 12000);
      return () => clearTimeout(timer);
    }
  }, [processState, clearProcess]);

  // Task 3: 'Lihat Hasil' — navigate to the patient page and clear the store
  const handleViewResults = () => {
    if (targetUrl) {
      router.push(targetUrl);
      // Don't call clearProcess here — the useEffect above will clear it
      // once the user arrives on the page
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="process-tracker"
          initial={{ x: 120, opacity: 0 }}
          animate={
            processState === "completed"
              ? { x: 0, opacity: 1, y: [0, -15, 0] }
              : { x: 0, opacity: 1, y: 0 }
          }
          exit={{ x: 120, opacity: 0, transition: { duration: 0.25 } }}
          transition={
            processState === "completed"
              ? { duration: 0.4, ease: "easeOut" }
              : { type: "spring", stiffness: 300, damping: 25 }
          }
          className="fixed top-[72px] right-4 z-[90] max-w-[280px] w-full"
        >
          <div
            className={`
              relative overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl
              transition-all duration-500
              ${processState === "completed"
                ? "bg-emerald-700 border-emerald-500/50 animate-glow-pulse"
                : processState === "error"
                  ? "bg-slate-900/90 border-red-500/30"
                  : "bg-slate-900/80 border-emerald-500/20"
              }
            `}
          >
            {/* Processing shimmer background */}
            {processState === "processing" && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent skew-x-12"
                />
              </div>
            )}

            <div className="p-3.5 flex flex-col gap-2.5">
              {/* Header row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {/* Status Icon */}
                  <div className="shrink-0 relative">
                    {processState === "processing" ? (
                      <svg
                        className="w-5 h-5 text-emerald-400 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : processState === "completed" ? (
                      <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="material-symbols-outlined text-white text-[22px]"
                        style={{ fontVariationSettings: '"FILL" 1' }}
                      >
                        check_circle
                      </motion.span>
                    ) : (
                      <span className="material-symbols-outlined text-red-400 text-[22px]">
                        error
                      </span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-[0.15em] ${
                        processState === "completed"
                          ? "text-emerald-200"
                          : processState === "error"
                            ? "text-red-400"
                            : "text-emerald-400"
                      }`}
                    >
                      {processState === "processing"
                        ? "Menganalisis"
                        : processState === "completed"
                          ? "Analisis Selesai"
                          : "Analisis Gagal"}
                    </span>
                    <span
                      className={`text-[13px] font-semibold truncate ${
                        processState === "completed" ? "text-white" : "text-slate-200"
                      }`}
                    >
                      {currentPatient?.name ?? "Pasien"}
                    </span>
                  </div>
                </div>

                {/* Dismiss button */}
                <button
                  onClick={clearProcess}
                  className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                    processState === "completed"
                      ? "text-emerald-200 hover:bg-emerald-600"
                      : "text-slate-500 hover:bg-slate-800"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              {/* Waveform animation when processing */}
              {processState === "processing" && (
                <div className="flex items-end gap-[3px] h-3 px-0.5">
                  {[0.4, 0.9, 0.6, 1.0, 0.5, 0.8, 0.3].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [`${h * 30}%`, "100%", `${h * 30}%`] }}
                      transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.08 }}
                      className="flex-1 bg-emerald-500/40 rounded-full"
                    />
                  ))}
                </div>
              )}

              {/* CTA Button on Success */}
              {processState === "completed" && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={handleViewResults}
                  className="w-full flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-[13px] font-semibold py-2 rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  Lihat Hasil
                </motion.button>
              )}

              {/* Error message */}
              {processState === "error" && (
                <p className="text-[12px] text-red-400">
                  Gagal menganalisis. Silakan coba lagi.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Wrap in Suspense because useSearchParams requires it in Next.js App Router
export function ProcessTracker() {
  return (
    <Suspense fallback={null}>
      <ProcessTrackerInner />
    </Suspense>
  );
}
