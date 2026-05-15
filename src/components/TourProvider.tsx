"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Joyride, EventData, STATUS, Step, EVENTS } from "react-joyride";
import { usePathname, useRouter } from "next/navigation";

interface TourContextType {
  startTour: () => void;
  stopTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
};

const TOUR_STEPS: Step[] = [
  // --- DASHBOARD (Path: /) --- Steps 0-3
  {
    target: "body",
    placement: "center",
    title: "Selamat Datang di Aerin MedCoder!",
    content: "Sistem koding medis berbasis AI yang dirancang untuk mengoptimalkan pendapatan RS dan memastikan akurasi klinis. Mari mulai tur singkat ini.",
    skipBeacon: true,
  },
  {
    target: "#tour-dashboard-stats",
    content: "Di Dashboard ini, Anda dapat memantau performa koding secara real-time. Perhatikan 'Optimasi Nilai Klaim' dan 'Potensi Temuan' untuk melihat ROI sistem AI ini.",
  },
  {
    target: "#tour-morbidity-table",
    placement: "left",
    content: "Tabel Morbiditas & Kontribusi Klinis menunjukkan 10 diagnosa teratas. Anda dapat mengklik baris mana saja untuk melihat detail severity level pasien.",
  },
  {
    target: "#tour-voice-mic",
    title: "Kontrol Suara AI",
    content: "Kendalikan aplikasi hanya dengan suara! Klik ikon mikrofon ini untuk mulai memberikan perintah seperti 'Buka Dashboard' atau 'Analisis AI'.",
  },
  {
    target: "#tour-voice-guide",
    content: "Bingung apa yang harus diucapkan? Klik ikon bantuan ini untuk melihat daftar perintah suara yang didukung oleh sistem.",
  },
  {
    target: "#tour-voice-text",
    content: "Jika mikrofon tidak tersedia, Anda tetap bisa memberikan perintah lewat keyboard dengan mengklik ikon keyboard ini.",
  },
  {
    target: "#tour-sidebar-patients",
    content: "Langkah selanjutnya, mari kita lihat daftar pasien yang sedang mengantre. Klik menu 'Patient List' ini untuk melanjutkan.",
    overlayClickAction: false,
    skipBeacon: true,
    styles: {
      tooltipFooter: { display: 'none' }
    }
  },

  // --- PATIENT LIST (Path: /patient-list) --- Steps 4-5
  {
    target: "body",
    placement: "center",
    title: "Daftar Antrean Pasien",
    content: "Ini adalah halaman daftar pasien. Anda dapat memprioritaskan pasien dengan status 'Belum Coding'.",
    skipBeacon: true,
  },
  {
    target: "#tour-patient-first-action",
    content: "Untuk mulai memproses pasien, klik tombol 'Code Now' ini. Workspace Koding AI akan terbuka.",
    skipBeacon: true,
    styles: {
      tooltipFooter: { display: 'none' }
    }
  },

  // --- CODING (Path: /coding) --- Steps 6-8
  {
    target: "#tour-coding-narrative",
    content: "Ini adalah panel Anamnesa & Klinis pasien. Anda dapat melihat resume medis asli dari rekam medis elektronik (EMR).",
    skipBeacon: true,
  },
  {
    target: "#tour-coding-generate",
    blockTargetInteraction: true,
    content: "Tombol ajaib! Klik tombol ini agar AI menganalisis narasi di panel kiri dan menghasilkan kode ICD-10 dan ICD-9-CM yang relevan secara otomatis.",
  },
  {
    target: "#tour-coding-results",
    placement: "left",
    content: "Panel kanan ini menampilkan hasil koding AI. Setelah generate, Anda dapat memverifikasi kode utama, sekunder, prosedur, hingga estimasi dampak finansialnya.",
  },
  {
    target: "#tour-sidebar-policies",
    content: "Terakhir, AI membutuhkan panduan. Mari kita atur 'Kebijakan Lokal'. Klik menu ini.",
    overlayClickAction: false,
    skipBeacon: true,
    styles: {
      tooltipFooter: { display: 'none' }
    }
  },

  // --- POLICIES (Path: /settings/policies) --- Steps 10-12
  {
    target: "#tour-policies-header",
    content: "Halaman Kebijakan Lokal memungkinkan Anda menetapkan aturan rumah sakit yang spesifik. AI akan secara ketat mematuhi aturan ini saat melakukan generate kode.",
    skipBeacon: true,
  },
  {
    target: "#tour-policies-add",
    content: "Klik di sini untuk membuat aturan baru. Misalnya, jika 'Syok Septik' selalu harus memunculkan A41.9, Anda dapat mengaturnya di sini untuk hasil koding yang deterministik.",
    blockTargetInteraction: true,
  },
  {
    target: "body",
    placement: "center",
    title: "Selesai!",
    content: "Anda telah siap menggunakan Aerin MedCoder. Silakan jelajahi fitur-fiturnya dan rasakan sendiri kemudahan koding cerdas dengan AI.",
  }
];


export const TourProvider = ({ children }: { children: React.ReactNode }) => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Auto-start for first-time users
    const hasSeenTour = localStorage.getItem("has_seen_tour");
    if (!hasSeenTour) {
      // Delay slightly to ensure layout is ready
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle route changes to prevent "top-left" glitch during transitions
  useEffect(() => {
    if (!run) return;

    // Pause the tour UI during navigation
    setIsNavigating(true);
    
    // Logic to sync stepIndex based on the new path
    if (pathname === "/") {
      if (stepIndex > 6) setStepIndex(0);
    } else if (pathname === "/patient-list") {
      if (stepIndex < 7) setStepIndex(7);
    } else if (pathname === "/coding" || pathname.startsWith("/coding/")) {
      if (stepIndex < 9) setStepIndex(9);
    } else if (pathname === "/settings/policies") {
      if (stepIndex < 13) setStepIndex(13);
    }

    // Resume the tour after a very short delay to allow the DOM to settle
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, run]);


  const handleJoyrideCallback = (data: EventData) => {
    const { status, type, index, action } = data;
    
    // Jika user mengklik tombol silang (X), anggap sebagai "Lewati Tur"
    if (action === "close") {
      stopTour();
      return;
    }

    // Update step index only when a step is successfully completed
    if (type === EVENTS.STEP_AFTER) {
      setStepIndex(index + (action === "prev" ? -1 : 1));
    }
    
    // Log for debugging if target is not found (hidden from user)
    if (type === EVENTS.TARGET_NOT_FOUND) {
      console.warn("Tour target not found:", data.step.target);
    }

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      stopTour();
    }
  };

  const startTour = () => {
    // If not on dashboard, route to dashboard first to start fresh
    if (pathname !== "/") {
      router.push("/");
    }
    setStepIndex(0);
    setRun(true);
  };

  const stopTour = () => {
    setRun(false);
    localStorage.setItem("has_seen_tour", "true");
  };

  return (
    <TourContext.Provider value={{ startTour, stopTour }}>
      {children}
      <Joyride
        steps={TOUR_STEPS}
        run={run && !isNavigating}
        stepIndex={stepIndex}
        continuous
        onEvent={handleJoyrideCallback}
        options={{
          primaryColor: '#10b981', // Emerald 500
          textColor: '#1e293b', // Slate 800
          backgroundColor: '#ffffff',
          arrowColor: '#ffffff',
          overlayColor: 'rgba(15, 23, 42, 0.6)', // Slate 900
          zIndex: 1000,
          showProgress: true,
          buttons: ['back', 'close', 'primary', 'skip'],
          overlayClickAction: 'close',
        }}
        styles={{
          tooltip: {
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '28px',
            backgroundColor: '#ffffff',
          },
          tooltipTitle: {
            fontSize: '20px',
            fontWeight: '800',
            color: '#0f172a',
            marginBottom: '10px',
            letterSpacing: '-0.02em',
          },
          tooltipContent: {
            fontSize: '15px',
            lineHeight: '1.6',
            color: '#475569',
            padding: '0',
          },
          tooltipFooter: {
            marginTop: '24px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between', // Memisahkan Skip (kiri) dari Back/Next (kanan)
          },
          buttonPrimary: {
            backgroundColor: '#10b981',
            borderRadius: '10px',
            fontWeight: '700',
            padding: '10px 20px',
            fontSize: '14px',
            transition: 'all 0.2s ease',
          },
          buttonBack: {
            color: '#64748b',
            marginRight: '12px',
            fontSize: '14px',
            fontWeight: '600',
          },
          buttonSkip: {
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: '500',
            textDecoration: 'underline',
            textUnderlineOffset: '4px',
            padding: '0',
          }
        }}
        locale={{
          back: 'Kembali',
          close: 'Tutup',
          last: 'Selesai',
          next: 'Lanjut',
          skip: 'Lewati Tur'
        }}
      />
    </TourContext.Provider>
  );
};
