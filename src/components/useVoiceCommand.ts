"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useVoiceCommandContext } from "./VoiceCommandContext";

interface Patient {
  id: string;
  name: string;
}

export type VoiceStatus = "idle" | "listening" | "processing" | "retrying" | "success" | "unrecognized" | "error";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [500, 1200, 2500]; // ms per attempt

export function useVoiceCommand() {
  const router = useRouter();
  const { getActions } = useVoiceCommandContext();

  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [toast, setToast] = useState("");
  const recognitionRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const isManualStopRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }, []);

  const parseAndExecute = useCallback(
    async (text: string) => {
      setStatus("processing");
      const normalized = text.toLowerCase().trim();

      if (normalized.includes("buka dashboard") || normalized.includes("dashboard")) {
        router.push("/");
        setStatus("success");
        setTimeout(() => setStatus("idle"), 800);
        return;
      }

      if (normalized.includes("buka kebijakan") || normalized.includes("kebijakan")) {
        router.push("/settings/policies");
        setStatus("idle");
        return;
      }

      if (normalized.includes("buka pasien")) {
        const nameQuery = normalized.replace(/buka pasien/gi, "").trim();
        if (!nameQuery) {
          showToast("Sebutkan nama pasien setelah 'Buka Pasien'");
          setStatus("idle");
          return;
        }
        try {
          const res = await fetch("/api/patients");
          const patients: Patient[] = await res.json();
          const match = patients.find((p) =>
            p.name.toLowerCase().includes(nameQuery)
          );
          if (match) {
            router.push(`/coding?patientId=${match.id}`);
            showToast(`Membuka pasien: ${match.name}`);
          } else {
            showToast(`Pasien "${nameQuery}" tidak ditemukan`);
          }
        } catch {
          showToast("Gagal mencari data pasien");
        }
        setStatus("idle");
        return;
      }

      if (normalized.includes("daftar pasien") || normalized.includes("list pasien")) {
        router.push("/patient-list");
        setStatus("idle");
        return;
      }

      // --- Contextual Page Actions ---
      const actions = getActions();

      if (
        normalized.includes("analisis ai") ||
        normalized.includes("generate") ||
        normalized.includes("analisis")
      ) {
        if (actions.onGenerate) {
          actions.onGenerate();
          showToast("Memulai analisis AI...");
        } else {
          showToast("Perintah ini hanya tersedia di halaman coding pasien");
        }
        setStatus("idle");
        return;
      }

      if (
        normalized.includes("simpan koding") ||
        normalized.includes("simpan") ||
        normalized.includes("selesai") ||
        normalized.includes("validasi")
      ) {
        if (actions.onSave) {
          actions.onSave();
          showToast("Menyimpan & memvalidasi...");
        } else {
          showToast("Perintah ini hanya tersedia di halaman koding pasien");
        }
        setStatus("idle");
        return;
      }

      if (normalized.includes("buka revisi") || normalized.includes("mode revisi") || normalized.includes("edit koding")) {
        // This command should trigger the revision mode if available
        if (actions.onOpenRevision) {
          actions.onOpenRevision();
          showToast("Membuka mode revisi...");
          setStatus("success");
          setTimeout(() => setStatus("idle"), 800);
        } else {
          showToast("Mode revisi tidak tersedia di halaman ini");
          setStatus("idle");
        }
        return;
      }

      // Task 1: Unrecognized logic - silent exit with neutral feedback
      setStatus("unrecognized");
      setTimeout(() => setStatus("idle"), 3000); // Berikan waktu 3 detik untuk membaca
    },
    [router, getActions, showToast]
  );

  // Core attempt — called by startListening and retries
  const attemptRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "id-ID";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setStatus("listening");
      setTranscript("");
      
      // Task 2: 3-second auto-timeout if no speech is detected
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          // Alihkan ke unrecognized agar muncul pesan "Perintah tidak dikenali" sebelum tutup
          setStatus("unrecognized");
          setTimeout(() => setStatus("idle"), 1200);
        }
      }, 3500); // 3.5s limit
    };

    recognition.onresult = (event: any) => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
      if (finalTranscript) {
        isManualStopRef.current = true;
        parseAndExecute(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (isManualStopRef.current || event.error === "aborted") return;
      if (event.error === "no-speech") {
        setStatus("idle");
        return;
      }

      // For network errors: auto-retry silently
      if (event.error === "network") {
        const attempt = retryCountRef.current;
        if (attempt < MAX_RETRIES) {
          retryCountRef.current += 1;
          setStatus("retrying");
          setTranscript(`Menghubungkan ulang... (${retryCountRef.current}/${MAX_RETRIES})`);
          setTimeout(() => {
            if (!isManualStopRef.current) {
              attemptRecognition();
            }
          }, RETRY_DELAYS[attempt]);
        } else {
          // All retries exhausted
          retryCountRef.current = 0;
          setStatus("idle");
          showToast("Suara tidak tersedia. Gunakan input teks di bawah.");
        }
        return;
      }

      // Other errors — show immediately
      const errorMessages: Record<string, string> = {
        "not-allowed": "Izin mikrofon ditolak oleh browser.",
        "audio-capture": "Mikrofon tidak terdeteksi di perangkat ini.",
      };
      showToast(errorMessages[event.error] ?? `Kesalahan: ${event.error}`);
      setStatus("idle");
    };

    recognition.onend = () => {
      // Task: Jangan paksa ke 'idle' jika sedang menampilkan feedback (success/unrecognized)
      // atau sedang dalam proses (processing/retrying)
      setStatus(prev =>
        prev === "retrying" || prev === "processing" || prev === "success" || prev === "unrecognized" 
          ? prev 
          : "idle"
      );
    };

    try {
      recognition.start();
    } catch (e) {
      setStatus("idle");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parseAndExecute, showToast]);

  const startListening = useCallback(async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast("Browser tidak mendukung Web Speech API. Gunakan Chrome.");
      return;
    }

    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      showToast("Gunakan 'localhost' agar fitur suara aktif.");
      return;
    }

    if (!navigator.onLine) {
      showToast("Koneksi internet terputus.");
      return;
    }

    // Request mic permission if needed
    let needsPermission = true;
    try {
      const perm = await navigator.permissions.query({ name: "microphone" as any });
      if (perm.state === "granted") needsPermission = false;
    } catch (e) {}

    if (needsPermission) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        await new Promise(r => setTimeout(r, 300));
      } catch {
        showToast("Izin mikrofon ditolak.");
        return;
      }
    }

    isManualStopRef.current = false;
    retryCountRef.current = 0;
    attemptRecognition();
  }, [attemptRecognition, showToast]);

  const stopListening = useCallback(() => {
    isManualStopRef.current = true;
    retryCountRef.current = 0;
    try { recognitionRef.current?.abort(); } catch (e) {}
    setStatus("idle");
    setTranscript("");
  }, []);

  const toggleListening = useCallback(() => {
    if (status === "listening" || status === "retrying") {
      stopListening();
    } else {
      startListening();
    }
  }, [status, startListening, stopListening]);

  return { status, transcript, toast, toggleListening, stopListening, parseAndExecute };
}
