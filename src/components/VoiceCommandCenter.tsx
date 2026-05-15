"use client";

import React, { useState, useRef } from "react";
import { useVoiceCommand, VoiceStatus } from "./useVoiceCommand";
import { AnimatePresence, motion } from "framer-motion";

const STATUS_LABEL: Record<VoiceStatus, string> = {
  idle: "",
  listening: "Mendengarkan...",
  processing: "Memproses perintah...",
  retrying: "Menghubungkan ulang...",
  success: "Perintah Diterima",
  unrecognized: "Tidak dikenali / Tidak ada suara",
  error: "Terjadi kesalahan",
};

const STATUS_COLOR: Record<VoiceStatus, string> = {
  idle: "text-slate-400",
  listening: "text-emerald-400",
  processing: "text-amber-400",
  retrying: "text-sky-400",
  success: "text-emerald-400",
  unrecognized: "text-slate-500",
  error: "text-red-400",
};

export function VoiceCommandCenter() {
  const { status, transcript, toast, toggleListening, parseAndExecute } = useVoiceCommand();
  const [textInput, setTextInput] = useState("");
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);

  // Close guide when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (guideRef.current && !guideRef.current.contains(event.target as Node)) {
        setShowGuide(false);
      }
    }
    if (showGuide) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showGuide]);

  const isActive = status === "listening";
  const isRetrying = status === "retrying";
  const isProcessing = status === "processing";
  const isSuccess = status === "success";
  const isUnrecognized = status === "unrecognized";
  const isOverlayVisible = isActive || isRetrying || isProcessing || isSuccess || isUnrecognized || showTextFallback;

  // Task: Close HUD when clicking outside (especially for text input mode)
  React.useEffect(() => {
    function handleHudClickOutside(event: MouseEvent) {
      if (hudRef.current && !hudRef.current.contains(event.target as Node)) {
        // Jika sedang dalam mode text fallback, tutup
        if (showTextFallback) {
          setShowTextFallback(false);
        }
      }
    }

    if (isOverlayVisible) {
      document.addEventListener("mousedown", handleHudClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleHudClickOutside);
    };
  }, [isOverlayVisible, showTextFallback]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = textInput.trim();
    if (!cmd) return;
    setTextInput("");
    parseAndExecute(cmd);
    setShowTextFallback(false);
  };

  const handleToggle = () => {
    toggleListening();
    if (status === "idle") {
      setShowTextFallback(false);
      setShowGuide(false);
    }
  };

  const commandCategories = [
    {
      title: "Navigasi",
      icon: "explore",
      commands: [
        { cmd: "Buka Dashboard", desc: "Ke halaman utama" },
        { cmd: "Buka Kebijakan", desc: "Ke pengaturan kebijakan" },
        { cmd: "Daftar Pasien", desc: "Ke list pasien" },
        { cmd: "Buka Pasien [Nama]", desc: "Cari & buka detail pasien" },
      ]
    },
    {
      title: "Aksi Koding",
      icon: "psychology",
      commands: [
        { cmd: "Analisis AI", desc: "Jalankan deteksi ICD otomatis" },
        { cmd: "Simpan Koding", desc: "Validasi & simpan hasil koding" },
        { cmd: "Buka Revisi", desc: "Aktifkan mode edit koding" },
      ]
    }
  ];

  const hints = [
    "Tip: Ucapkan 'Buka Dashboard'",
    "Tip: Ucapkan 'Analisis AI'",
    "Tip: Ucapkan 'Buka Pasien Sari'",
    "Tip: Ucapkan 'Simpan Koding'",
  ];

  const [hintIndex, setHintIndex] = useState(0);

  // Rotate hints every 3 seconds
  React.useEffect(() => {
    if (isActive && !transcript) {
      const interval = setInterval(() => {
        setHintIndex((prev) => (prev + 1) % hints.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isActive, transcript]);

  return (
    <>
      <div className="flex items-center gap-2 relative">
        {/* Help Icon / Guide Toggle */}
        <div className="relative">
          <button
            id="tour-voice-guide"
            onClick={() => setShowGuide(!showGuide)}
            title="Panduan Perintah"
            className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
              showGuide ? "bg-primary-500/10 text-primary-500" : "text-slate-400 hover:text-surface hover:bg-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
          </button>

          {/* Guide Popover */}
          <AnimatePresence>
            {showGuide && (
              <motion.div
                ref={guideRef}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl z-[60] overflow-hidden"
              >
                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">auto_awesome</span>
                    Panduan Perintah Suara
                  </h3>
                </div>
                
                <div className="p-4 flex flex-col gap-5">
                  {commandCategories.map((cat, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
                        {cat.title}
                      </div>
                      <div className="flex flex-col gap-2">
                        {cat.commands.map((c, i) => (
                          <div key={i} className="group cursor-help">
                            <div className="font-mono text-[13px] text-surface bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 group-hover:border-emerald-500/30 transition-colors inline-block">
                              "{c.cmd}"
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 ml-1">{c.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-950/50 border-t border-slate-800 text-center">
                  <p className="text-[10px] text-slate-500">
                    Klik ikon mikrofon lalu ucapkan perintah di atas.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Text Fallback Toggle */}
        <button
          id="tour-voice-text"
          onClick={() => {
            setShowTextFallback(v => !v);
            setShowGuide(false);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          title="Input perintah teks"
          className="flex items-center justify-center w-9 h-9 rounded-full border border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[18px]">keyboard</span>
        </button>

        {/* Mic Button */}
        <button
          id="tour-voice-mic"
          onClick={handleToggle}
          title={isActive ? "Hentikan mendengarkan" : "Aktifkan perintah suara"}
          className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ${isActive
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40"
              : isRetrying
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/40"
                : isProcessing
                  ? "bg-amber-500 text-white"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant"
            }`}
        >
          {/* Glow-pulse ring when active or retrying */}
          {(isActive || isRetrying) && (
            <span className={`absolute inset-0 rounded-full animate-ping opacity-50 pointer-events-none ${isRetrying ? "bg-sky-400" : "bg-emerald-400"}`} />
          )}
          <span className="material-symbols-outlined text-[20px] relative z-10">
            {isActive ? "mic" : isRetrying ? "sync" : isProcessing ? "hourglass_top" : "mic_none"}
          </span>
        </button>
      </div>

      {/* Dynamic Listening HUD Overlay */}
      <AnimatePresence>
        {isOverlayVisible && (
          <motion.div
            key="voice-hud"
            initial={{ y: 100, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            exit={{ 
              y: 100, 
              x: "-50%", 
              opacity: 0,
              transition: { duration: isUnrecognized ? 0.3 : 0.4 } 
            }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20 
            }}
            className="fixed bottom-10 left-1/2 z-[100] pointer-events-none"
          >
            <div 
              ref={hudRef}
              className={`bg-slate-900/80 backdrop-blur-xl border rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 min-w-[320px] pointer-events-auto transition-colors duration-300 ${
              isUnrecognized ? "border-slate-500/50" : isSuccess ? "border-emerald-500/50" : isProcessing ? "border-amber-500/50" : "border-emerald-500/30"
            }`}>
              <div className="flex items-center gap-4 px-4 py-3">
                
                {/* Visual Feedback Left (Dot/Waveform) */}
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary-fixed-dim/10 shrink-0">
                  {isSuccess ? (
                    <motion.span 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      className="material-symbols-outlined text-slate-500 font-bold"
                    >
                      check_circle
                    </motion.span>
                  ) : isUnrecognized ? (
                    <span className="material-symbols-outlined text-slate-500">help_center</span>
                  ) : (isActive || isRetrying || isProcessing) ? (
                    <div className="flex items-end gap-[3px] h-4">
                      {[0.4, 1.0, 0.7, 0.5].map((h, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: ["4px", `${h * 16}px`, "4px"] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                          className={`w-[3px] rounded-full ${isRetrying ? "bg-sky-400" : "bg-primary-fixed-dim"}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                  )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
                      isUnrecognized ? "text-slate-500" : isRetrying ? "text-sky-400" : showTextFallback ? "text-surface" : "text-emerald-400"
                    }`}>
                      {isSuccess ? "Berhasil" : isUnrecognized ? "Gagal" : isRetrying ? "Retrying" : showTextFallback ? "Input Teks" : "Mendengarkan"}
                    </span>
                    {(isActive || isRetrying) && !showTextFallback && (
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRetrying ? "bg-sky-400" : "bg-emerald-400"}`}></span>
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isRetrying ? "bg-sky-500" : "bg-emerald-500"}`}></span>
                      </span>
                    )}
                  </div>

                  <div className="mt-0.5 min-h-[20px] flex items-center">
                    <AnimatePresence mode="wait">
                      {isSuccess ? (
                        <motion.p 
                          key="success-text"
                          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                          className="text-white text-sm font-medium"
                        >
                          Perintah Diterima
                        </motion.p>
                      ) : isUnrecognized ? (
                        <motion.p 
                          key="fail-text"
                          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                          className="text-slate-400 text-sm font-medium"
                        >
                          Perintah tidak dikenali
                        </motion.p>
                      ) : showTextFallback ? (
                        <form onSubmit={handleTextSubmit} className="w-full flex items-center gap-2">
                          <input
                            ref={inputRef}
                            type="text"
                            autoFocus
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Ketik perintah (ex: Buka Dashboard)..."
                            className="w-full bg-transparent border-none outline-none text-white text-sm font-medium placeholder:text-slate-500"
                          />
                          <button type="submit" className="material-symbols-outlined text-emerald-400 text-sm">send</button>
                        </form>
                      ) : transcript ? (
                        <motion.p 
                          key="transcript-text"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="text-white text-sm font-medium truncate italic"
                        >
                          "{transcript}"
                        </motion.p>
                      ) : (
                        <motion.p 
                          key={hintIndex}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          className="text-slate-400 text-[13px]"
                        >
                          {hints[hintIndex]}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Close/Stop Button */}
                {(isActive || isRetrying || isProcessing) && (
                  <button
                    onClick={handleToggle}
                    className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Voice Toast (Errors/Alerts) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[101] bg-slate-900/90 border border-slate-700 text-white text-xs font-medium px-4 py-2 rounded-full shadow-2xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-amber-400 text-[16px]">warning</span>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
