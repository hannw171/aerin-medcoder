"use client";

import { useState, useRef, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { patients } from "@/lib/mockData";
import { useVoiceCommandContext } from "@/components/VoiceCommandContext";

import { SearchableICDInput, type CodeItem } from "@/components/SearchableICDInput";
import { FinancialImpactCard } from "@/components/FinancialImpactCard";
import { getEstimatedTariff, determineSeverityLevel, formatIDR } from "@/utils/pricing";
import { useBackgroundCoder } from "@/store/useBackgroundCoder";
type CodingResult = {
  primaryDiagnosis: CodeItem | null;
  secondaryDiagnoses: CodeItem[];
  procedures: CodeItem[];
  potentialFindings?: { code: string; description: string; insight: string; processed?: boolean }[];
};

function RightPanelSkeleton() {
  return (
    <div className="flex-1 p-panel-padding overflow-y-auto flex flex-col gap-element-gap animate-pulse">
      {/* Diagnosa Utama Skeleton */}
      <div className="bg-slate-200 h-28 rounded-xl w-full mb-2"></div>

      {/* Diagnosa Sekunder Skeleton */}
      <div className="flex flex-col gap-3 mt-4">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-1"></div>
        <div className="h-12 bg-slate-200 rounded-lg w-full"></div>
        <div className="h-12 bg-slate-200 rounded-lg w-full"></div>
        <div className="h-12 bg-slate-200 rounded-lg w-full"></div>
      </div>

      {/* Prosedur Skeleton */}
      <div className="flex flex-col gap-3 mt-4">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-1"></div>
        <div className="h-12 bg-slate-200 rounded-lg w-full"></div>
        <div className="h-12 bg-slate-200 rounded-lg w-full"></div>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <p className="text-sm text-slate-400 animate-pulse text-center">
          AI sedang menganalisis rekam medis...
        </p>
      </div>
    </div>
  );
}

function CodingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get("patientId");
  const patient = patients.find((p) => p.id === patientId) || patients[0];

  const [isGenerated, setIsGenerated] = useState(patient.status === 'Draft AI' || patient.status === 'Selesai');
  const [activeTab, setActiveTab] = useState(1);
  const [codingResult, setCodingResult] = useState<CodingResult | null>(
    patient.status === 'Draft AI' || patient.status === 'Selesai'
      ? {
        primaryDiagnosis: { id: "1", code: "E11.9", description: "Type 2 diabetes mellitus without complications" },
        secondaryDiagnoses: [
          { id: "2", code: "I10", description: "Essential (primary) hypertension" },
          { id: "3", code: "E78.5", description: "Hyperlipidemia, unspecified" },
        ],
        procedures: [
          { id: "4", code: "99.21", description: "Injection of antibiotic" },
        ]
      }
      : null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  const [codingResultSnapshot, setCodingResultSnapshot] = useState<CodingResult | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [isEditingPrimary, setIsEditingPrimary] = useState(false);
  const [editingSecondaryId, setEditingSecondaryId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(patient.status);
  const [isManuallyEdited, setIsManuallyEdited] = useState(patient.status === 'Direvisi');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [hasError, setHasError] = useState(false);
  const [smartAdjustFinding, setSmartAdjustFinding] = useState<{
    index: number;
    code: string;
    description: string;
    insight: string;
    parentSuggestion: string | null;
  } | null>(null);

  // Register page-specific voice actions using refs to avoid stale closures
  const { registerActions, unregisterActions } = useVoiceCommandContext();
  const { startGeneration, completeGeneration, failGeneration } = useBackgroundCoder();
  const handleGenerateRef = useRef<(() => void) | null>(null);
  const handleSaveRef = useRef<(() => void) | null>(null);
  const enterRevisionModeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    registerActions({
      onGenerate: () => handleGenerateRef.current?.(),
      onSave: () => handleSaveRef.current?.(),
      onOpenRevision: () => enterRevisionModeRef.current?.(),
    });
    return () => unregisterActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Always keep refs pointed to the latest function instance (runs every render)
  // This MUST be in the component body, not inside the functions themselves.

  // Fetch latest patient data on mount to ensure persistence
  useEffect(() => {
    if (patientId) {
      fetch(`/api/patients`)
        .then(res => res.json())
        .then(data => {
          const latestPatient = data.find((p: any) => p.id === patientId);
          if (latestPatient) {
            setCurrentStatus(latestPatient.status);
            if (latestPatient.codingResult) {
              setCodingResult(latestPatient.codingResult);
              setIsGenerated(true);
              setIsManuallyEdited(latestPatient.status === 'Direvisi');
            }
          }
        })
        .catch(err => console.error("Failed to fetch latest patient data", err));
    }
  }, [patientId]);

  const handleGenerate = () => {
    // Task 2: Non-blocking — user can navigate away immediately
    startGeneration({ id: patient.id, name: patient.name });
    setIsGenerating(true);

    // Fire-and-forget promise — does NOT block navigation
    fetch('/api/generate-icd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicalRecord: patient.medicalRecord })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to generate AI codes');
        const data = await res.json();

        const formattedResult: CodingResult = {
          primaryDiagnosis: data.primaryDiagnosis ? {
            ...data.primaryDiagnosis,
            id: crypto.randomUUID()
          } : null,
          secondaryDiagnoses: (data.secondaryDiagnoses || []).map((d: any) => ({
            ...d,
            id: crypto.randomUUID()
          })),
          procedures: (data.procedures || []).map((p: any) => ({
            ...p,
            id: crypto.randomUUID()
          })),
          potentialFindings: (data.potentialFindings || []).map((f: any) => ({
            ...f,
            processed: false
          }))
        };

        // Update local UI state (only effective if user is still on this page)
        setCodingResult(formattedResult);
        setIsGenerated(true);
        setIsManuallyEdited(false);
        setCurrentStatus('Draft AI');
        setIsGenerating(false);

        // Mark global tracker as complete
        completeGeneration(formattedResult);

        // Background auto-save
        fetch(`/api/patients/${patient.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codingResult: formattedResult, status: 'Draft AI' }),
          keepalive: true
        })
          .then(() => setLastSavedTime(new Date()))
          .catch(err => console.error('Auto-save failed:', err));
      })
      .catch((error) => {
        console.error(error);
        setIsGenerating(false);
        setHasError(true);
        setToastMessage("Gagal melakukan generate dengan AI.");
        setTimeout(() => setToastMessage(""), 3000);
        failGeneration("Gagal menganalisis rekam medis.");
      });
  };

  const enterRevisionMode = () => {
    setCodingResultSnapshot(codingResult);
    setIsRevisionMode(true);
  };

  const handleCancelRevision = () => {
    setIsRevisionMode(false);
    setIsEditingPrimary(false);
    if (codingResultSnapshot) {
      setCodingResult(codingResultSnapshot);
      setCodingResultSnapshot(null);
    }
  };

  const handleUpdate = async () => {
    setIsGenerating(true);
    let updatedResult = codingResult;
    if (codingResult) {
      updatedResult = {
        ...codingResult,
        secondaryDiagnoses: codingResult.secondaryDiagnoses.filter(d => d.code !== ""),
        procedures: codingResult.procedures.filter(p => p.code !== "")
      };
      setCodingResult(updatedResult);
    }
    try {
      await fetch(`/api/patients/${patient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codingResult: updatedResult,
          status: 'Direvisi'
        })
      });
      setIsGenerating(false);
      setIsRevisionMode(false);
      setIsEditingPrimary(false);
      setIsManuallyEdited(true);
      setCurrentStatus('Direvisi');
      setLastSavedTime(new Date());
      setCodingResultSnapshot(null);
      setToastMessage("Berhasil diperbarui");
      setTimeout(() => setToastMessage(""), 3000);
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
      setToastMessage("Gagal menyimpan.");
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  const handleSaveAndValidate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codingResult: codingResult,
          status: 'Selesai'
        })
      });

      if (!res.ok) throw new Error("Failed to save");

      setLastSavedTime(new Date());
      setCurrentStatus('Selesai');
      setToastMessage("Data Pasien Berhasil Diverifikasi dan Disimpan");
      
      // Delay redirect to allow user to see the success toast
      setTimeout(() => {
        router.push('/patient-list');
      }, 2000);
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
      setToastMessage("Gagal menyimpan data.");
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  // Task 3: Parent code suggestion utility
  const getParentCodeSuggestion = (code: string): string | null => {
    if (!code || code.length <= 3) return null;
    // Try 4-char parent first (e.g. L03.1 from L03.116)
    const fourChar = code.substring(0, code.indexOf('.') + 2).replace(/\.$/, '');
    if (fourChar.length >= 4 && fourChar !== code) return fourChar;
    // Fallback to 3-char parent (e.g. L03)
    const threeChar = code.substring(0, code.indexOf('.') > 0 ? code.indexOf('.') : 3);
    return threeChar !== code ? threeChar : null;
  };

  // Task 2: Smart Promote — validates code, shows modal if adjustment needed
  const promoteFinding = async (findingIndex: number) => {
    if (!codingResult || !codingResult.potentialFindings) return;
    const finding = codingResult.potentialFindings[findingIndex];
    if (finding.processed) return;

    // Validate code against local library
    try {
      const res = await fetch(`/api/search-icd?q=${encodeURIComponent(finding.code)}&type=icd10`);
      const results = await res.json();
      const exactMatch = results.find((r: any) =>
        r.code.toLowerCase() === finding.code.toLowerCase()
      );

      if (exactMatch) {
        // Direct promote — code is valid
        doPromoteFinding(findingIndex, { code: exactMatch.code, description: exactMatch.description });
      } else {
        // Open Smart Adjust modal with parent suggestion
        setSmartAdjustFinding({
          index: findingIndex,
          code: finding.code,
          description: finding.description,
          insight: finding.insight,
          parentSuggestion: getParentCodeSuggestion(finding.code),
        });
      }
    } catch {
      // On error, open modal anyway
      setSmartAdjustFinding({
        index: findingIndex,
        code: finding.code,
        description: finding.description,
        insight: finding.insight,
        parentSuggestion: getParentCodeSuggestion(finding.code),
      });
    }
  };

  const doPromoteFinding = (findingIndex: number, overrideCode?: { code: string; description: string }) => {
    if (!codingResult || !codingResult.potentialFindings) return;
    const finding = codingResult.potentialFindings[findingIndex];

    const newSecondary: CodeItem = {
      id: crypto.randomUUID(),
      code: overrideCode?.code ?? finding.code,
      description: overrideCode?.description ?? finding.description,
      insight: finding.insight,
    };

    const updatedPotential = [...codingResult.potentialFindings];
    updatedPotential[findingIndex] = { ...finding, processed: true };

    setCodingResult({
      ...codingResult,
      secondaryDiagnoses: [...codingResult.secondaryDiagnoses, newSecondary],
      potentialFindings: updatedPotential,
    });

    setSmartAdjustFinding(null);
    setToastMessage(`Diagnosa ${newSecondary.code} berhasil ditambahkan ke sekunder`);
    setTimeout(() => setToastMessage(""), 2500);
  };

  const removeSecondaryCode = (id: string) => {
    if (!codingResult) return;
    setCodingResult({
      ...codingResult,
      secondaryDiagnoses: codingResult.secondaryDiagnoses.filter(d => d.id !== id)
    });
  };

  const removeProcedure = (id: string) => {
    if (!codingResult) return;
    setCodingResult({
      ...codingResult,
      procedures: codingResult.procedures.filter(p => p.id !== id)
    });
  };

  const addSecondaryCode = () => {
    if (!codingResult) return;
    setCodingResult({
      ...codingResult,
      secondaryDiagnoses: [
        ...codingResult.secondaryDiagnoses,
        { id: Date.now().toString(), code: '', description: '' }
      ]
    });
  };

  const addProcedure = () => {
    if (!codingResult) return;
    setCodingResult({
      ...codingResult,
      procedures: [
        ...codingResult.procedures,
        { id: Date.now().toString(), code: '', description: '' }
      ]
    });
  };

  const updateSecondaryCode = (id: string, newCode: CodeItem) => {
    if (!codingResult) return;
    setCodingResult({
      ...codingResult,
      secondaryDiagnoses: codingResult.secondaryDiagnoses.map(d =>
        d.id === id ? { ...d, code: newCode.code, description: newCode.description } : d
      )
    });
  };

  const updateProcedure = (id: string, newCode: CodeItem) => {
    if (!codingResult) return;
    setCodingResult({
      ...codingResult,
      procedures: codingResult.procedures.map(p =>
        p.id === id ? { ...p, code: newCode.code, description: newCode.description } : p
      )
    });
  };

  const updatePrimaryCode = (newCode: CodeItem) => {
    if (!codingResult) return;
    setCodingResult({
      ...codingResult,
      primaryDiagnosis: newCode
    });
    setIsEditingPrimary(false);
  };

  // Assign refs here (after all functions are defined) so voice commands always
  // invoke the latest closure with current state — never stale.
  handleGenerateRef.current = handleGenerate;
  handleSaveRef.current = handleSaveAndValidate;
  enterRevisionModeRef.current = enterRevisionMode;

  return (
    <div className="flex-1 flex overflow-hidden -m-8 h-[calc(100vh-64px)]">
      {/* LEFT PANEL: Medical Record */}
      <section className="w-3/5 bg-surface-container-lowest flex flex-col h-full border-r border-outline-variant relative">
        <div className="px-panel-padding pt-panel-padding pb-0 flex-shrink-0 bg-surface-container-lowest z-10 border-b border-surface-variant">
          <h2 className="font-headline-md text-headline-md text-on-background mb-4">
            Anamnesis & Resume Medis
          </h2>
          <div className="flex gap-tight-gap mb-4">
            <span className="bg-surface-container-highest text-on-surface font-mono-data text-mono-data px-3 py-1 rounded-full">
              Patient: {patient.registerNo} - {patient.name}
            </span>
            <span className="bg-surface-container-highest text-on-surface font-mono-data text-mono-data px-3 py-1 rounded-full">
              RM: {patient.rmNo}
            </span>
            <span className="bg-surface-container-highest text-on-surface font-mono-data text-mono-data px-3 py-1 rounded-full">
              DOA: {patient.dischargeDate}
            </span>
          </div>
          <div id="tour-coding-narrative" className="flex gap-4 border-b border-outline-variant w-full">
            <button
              onClick={() => setActiveTab(1)}
              className={`font-body-md text-body-md pb-2 ${activeTab === 1
                ? "text-primary border-b-2 border-primary font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
                }`}
            >
              Anamnesa & Klinis
            </button>
            <button
              onClick={() => setActiveTab(2)}
              className={`font-body-md text-body-md pb-2 ${activeTab === 2
                ? "text-primary border-b-2 border-primary font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
                }`}
            >
              Penunjang Klinis
            </button>
            <button
              onClick={() => setActiveTab(3)}
              className={`font-body-md text-body-md pb-2 ${activeTab === 3
                ? "text-primary border-b-2 border-primary font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
                }`}
            >
              Tindakan & Terapi
            </button>
          </div>
        </div>
        <div className="flex-1 p-panel-padding overflow-y-auto bg-surface-container-lowest">
          <div className="flex flex-col gap-6">
            {activeTab === 1 && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                    Anamnesa
                  </label>
                  <textarea
                    readOnly
                    className="w-full h-24 bg-surface-container-lowest border border-slate-300 rounded-lg p-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                    value={patient.medicalRecord.anamnesa}
                  ></textarea>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                    TTV (Tanda-Tanda Vital)
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm text-on-surface-variant">
                        Tekanan Darah
                      </label>
                      <input
                        readOnly
                        className="w-full bg-surface-container-lowest border border-slate-300 rounded-md p-2 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        value={patient.medicalRecord.ttv.td}
                        type="text"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm text-on-surface-variant">
                        Nadi
                      </label>
                      <input
                        readOnly
                        className="w-full bg-surface-container-lowest border border-slate-300 rounded-md p-2 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        value={patient.medicalRecord.ttv.nadi}
                        type="text"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm text-on-surface-variant">
                        RR
                      </label>
                      <input
                        readOnly
                        className="w-full bg-surface-container-lowest border border-slate-300 rounded-md p-2 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        value={patient.medicalRecord.ttv.rr}
                        type="text"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm text-on-surface-variant">
                        Suhu
                      </label>
                      <input
                        readOnly
                        className="w-full bg-surface-container-lowest border border-slate-300 rounded-md p-2 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        value={patient.medicalRecord.ttv.suhu}
                        type="text"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm text-on-surface-variant">
                        SpO2
                      </label>
                      <input
                        readOnly
                        className="w-full bg-surface-container-lowest border border-slate-300 rounded-md p-2 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        value={patient.medicalRecord.ttv.spo2}
                        type="text"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm text-on-surface-variant">
                        Skala Nyeri
                      </label>
                      <input
                        readOnly
                        className="w-full bg-surface-container-lowest border border-slate-300 rounded-md p-2 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        value={patient.medicalRecord.ttv.nyeri}
                        type="text"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                    Temuan Kelainan Fisik
                  </label>
                  <textarea
                    readOnly
                    className="w-full h-24 bg-surface-container-lowest border border-slate-300 rounded-lg p-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                    value={patient.medicalRecord.physicalExam}
                  ></textarea>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                    Diagnosis Klinis Utama
                  </label>
                  <textarea
                    readOnly
                    className="w-full h-16 bg-surface-container-lowest border border-slate-300 rounded-lg p-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                    value={patient.medicalRecord.diagnosisKlinisUtama}
                  ></textarea>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                    Diagnosis Klinis Sekunder
                  </label>
                  <textarea
                    readOnly
                    className="w-full h-20 bg-surface-container-lowest border border-slate-300 rounded-lg p-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                    value={patient.medicalRecord.diagnosisKlinisSekunder}
                  ></textarea>
                </div>
              </>
            )}

            {activeTab === 2 && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                    Hasil Laboratorium
                  </label>
                  <textarea
                    readOnly
                    className="w-full h-32 bg-surface-container-lowest border border-slate-300 rounded-lg p-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                    value={patient.medicalRecord.labResult || "Tidak ada Order lab yang dilakukan"}
                  ></textarea>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                    Hasil Radiologi
                  </label>
                  <textarea
                    readOnly
                    className="w-full h-32 bg-surface-container-lowest border border-slate-300 rounded-lg p-3 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                    value={patient.medicalRecord.radiologyResult || "Tidak ada Order RO"}
                  ></textarea>
                </div>
              </>
            )}

            {activeTab === 3 && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                    Prosedur
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {patient.medicalRecord.procedures.length > 0 ? (
                      patient.medicalRecord.procedures.map((proc, index) => (
                        <span
                          key={index}
                          className="bg-surface-container text-on-surface font-body-md text-body-md px-3 py-1 rounded-full border border-outline-variant"
                        >
                          {proc}
                        </span>
                      ))
                    ) : (
                      <span className="text-on-surface-variant font-body-md italic">
                        Tidak ada Prosedur yang dilakukan
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                    Obat Inpatient
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {patient.medicalRecord.inpatientMeds.length > 0 ? (
                      patient.medicalRecord.inpatientMeds.map((med, index) => (
                        <span
                          key={index}
                          className="bg-surface-container text-on-surface font-body-md text-body-md px-3 py-1 rounded-full border border-outline-variant"
                        >
                          {med}
                        </span>
                      ))
                    ) : (
                      <span className="text-on-surface-variant font-body-md italic">
                        Tidak ada Order Obat Inpatient
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                    Obat Pulang (Discharge)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {patient.medicalRecord.dischargeMeds.length > 0 ? (
                      patient.medicalRecord.dischargeMeds.map((med, index) => (
                        <span
                          key={index}
                          className="bg-surface-container text-on-surface font-body-md text-body-md px-3 py-1 rounded-full border border-outline-variant"
                        >
                          {med}
                        </span>
                      ))
                    ) : (
                      <span className="text-on-surface-variant font-body-md italic">
                        Tidak ada Order Obat Pulang
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="p-panel-padding bg-surface-container-lowest border-t border-outline-variant flex-shrink-0 z-10 sticky bottom-0">
          <button
            id="tour-coding-generate"
            onClick={handleGenerate}
            disabled={isGenerating || currentStatus === 'Selesai'}
            className="w-full bg-primary text-on-primary font-label-sm text-label-sm py-3 rounded-lg flex items-center justify-center gap-tight-gap hover:bg-surface-tint transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Menganalisis...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">auto_awesome</span>
                Generate ICD Codes
              </>
            )}
          </button>
        </div>
      </section>
      {/* RIGHT PANEL: Coding Action Area */}
      <section id="tour-coding-results" className="w-2/5 bg-surface-container flex flex-col h-full relative">
        <div className="p-panel-padding pb-0 flex-shrink-0 bg-surface-container z-10 border-b border-surface-variant">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-headline-md text-headline-md text-on-background">
              Hasil Coding AI
            </h2>
            {isGenerated && (
              currentStatus === 'Selesai' ? (
                <span className="bg-green-100 text-green-700 border border-green-200 font-label-sm text-label-sm px-2 py-1 rounded flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  Selesai
                </span>
              ) : isManuallyEdited ? (
                <span className="bg-blue-100 text-blue-700 border border-blue-200 font-label-sm text-label-sm px-2 py-1 rounded">
                  Direvisi
                </span>
              ) : (
                <span className="bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm px-2 py-1 rounded">
                  Draft AI
                </span>
              )
            )}
          </div>
          {lastSavedTime && (
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-4">
              <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Perubahan tersimpan pada {lastSavedTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })} WIB
            </div>
          )}
        </div>

        {isGenerating ? (
          <RightPanelSkeleton />
        ) : !isGenerated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mb-4 text-outline">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "32px" }}
              >
                robot_2
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">
              Belum Ada Hasil Koding
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
              Klik tombol "Generate ICD Codes" di panel kiri untuk mulai menganalisis resume medis pasien dengan AI.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 p-panel-padding overflow-y-auto flex flex-col gap-element-gap">
              {/* Diagnosa Utama */}
              {codingResult?.primaryDiagnosis && (
                <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm border-l-4 !border-l-primary relative group">
                  <div className="absolute top-4 right-4 text-primary bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded">
                    Primary
                  </div>
                  <h3 className="font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider flex items-center justify-between">
                    Diagnosa Utama
                  </h3>
                  {isEditingPrimary ? (
                    <div className="mt-2 p-3 border rounded-lg bg-slate-50">
                      <p className="text-xs text-slate-500 mb-3">Kode Awal (Draft): <span className="font-semibold text-slate-700">{codingResult.primaryDiagnosis.code} - {codingResult.primaryDiagnosis.description}</span></p>
                      <SearchableICDInput
                        type="icd10"
                        placeholder="Cari diagnosa utama (ICD-10)..."
                        onSelect={updatePrimaryCode}
                        onCancel={() => setIsEditingPrimary(false)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-start gap-element-gap pt-1">
                      <div className="bg-surface-variant text-on-surface font-mono-data text-mono-data px-4 py-2 rounded-full border border-outline-variant">
                        {codingResult.primaryDiagnosis.code}
                      </div>
                      <div className="font-body-md text-body-md text-on-surface flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mt-2">
                          <span>{codingResult.primaryDiagnosis.description}</span>
                          {codingResult.primaryDiagnosis.insight && (
                            <span className="material-symbols-outlined text-[16px] text-emerald-500 cursor-help" title="Gemini Insight">
                              lightbulb
                            </span>
                          )}
                        </div>
                        {codingResult.primaryDiagnosis.insight && (
                          <div className="mt-2.5 mb-1 bg-emerald-50 border-l-2 border-dashed border-emerald-400 p-2.5 rounded-r-md hidden group-hover:block transition-all mr-2">
                            <p className="text-[13px] italic text-emerald-800 leading-snug">{codingResult.primaryDiagnosis.insight}</p>
                          </div>
                        )}
                      </div>
                      {isRevisionMode && (
                        <button
                          onClick={() => setIsEditingPrimary(true)}
                          className="text-primary hover:text-primary-variant transition-all mt-2"
                        >
                          <span className="material-symbols-outlined text-sm">
                            edit
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Diagnosa Sekunder */}
              <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm">
                <h3 className="font-label-sm text-label-sm text-on-surface-variant mb-3 uppercase tracking-wider">
                  Diagnosa Sekunder
                </h3>
                <div className="flex flex-col gap-tight-gap">
                  {codingResult?.secondaryDiagnoses && codingResult.secondaryDiagnoses.length > 0 ? (
                    codingResult.secondaryDiagnoses.map((diag, idx) => (
                      <div key={diag.id}>
                        <div className="flex items-start gap-element-gap p-2 hover:bg-surface-container-low rounded border border-transparent hover:border-outline-variant transition-colors group">
                          {diag.code === "" || editingSecondaryId === diag.id ? (
                            <div className="flex-1">
                              {editingSecondaryId === diag.id && (
                                <p className="text-xs text-slate-500 mb-2">
                                  Kode saat ini: <span className="font-semibold font-mono text-slate-700">{diag.code}</span> — Cari kode pengganti:
                                </p>
                              )}
                              <SearchableICDInput
                                type="icd10"
                                placeholder="Cari kode atau deskripsi ICD-10..."
                                onSelect={(selected) => {
                                  updateSecondaryCode(diag.id, selected);
                                  setEditingSecondaryId(null);
                                }}
                                onCancel={editingSecondaryId === diag.id ? () => setEditingSecondaryId(null) : undefined}
                              />
                            </div>
                          ) : (
                            <>
                              <div className="bg-surface-variant text-on-surface font-mono-data text-mono-data px-3 py-1 rounded-full border border-outline-variant w-20 text-center shrink-0">
                                {diag.code}
                              </div>
                              <div className="font-body-md text-body-md text-on-surface flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mt-1">
                                  <span>{diag.description}</span>
                                  {diag.insight && (
                                    <span className="material-symbols-outlined text-[16px] text-emerald-500 cursor-help" title="Gemini Insight">
                                      lightbulb
                                    </span>
                                  )}
                                </div>
                                {diag.insight && (
                                  <div className="mt-2.5 mb-1 bg-emerald-50 border-l-2 border-dashed border-emerald-400 p-2.5 rounded-r-md hidden group-hover:block transition-all mr-2">
                                    <p className="text-[13px] italic text-emerald-800 leading-snug">{diag.insight}</p>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                          {isRevisionMode && editingSecondaryId !== diag.id && diag.code !== "" && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all mt-1">
                              <button
                                onClick={() => setEditingSecondaryId(diag.id)}
                                className="text-slate-400 hover:text-primary transition-colors"
                                title="Edit kode"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>
                              <button
                                onClick={() => removeSecondaryCode(diag.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title="Hapus"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                        {idx < (codingResult?.secondaryDiagnoses?.length || 0) - 1 && (
                          <div className="w-full h-px bg-outline-variant/30"></div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-6 flex flex-col items-center justify-center gap-2 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                      <span className="material-symbols-outlined text-slate-300 text-[24px]">assignment_late</span>
                      <p className="text-xs font-medium text-slate-400 italic">Tidak ada diagnosa sekunder yang terdeteksi</p>
                    </div>
                  )}
                </div>
                {isRevisionMode && (
                  <button
                    onClick={addSecondaryCode}
                    className="mt-3 text-primary font-label-sm text-label-sm flex items-center gap-tight-gap hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>{" "}
                    Add Secondary Code
                  </button>
                )}
              </div>
              {/* Prosedur */}
              <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-4 shadow-sm">
                <h3 className="font-label-sm text-label-sm text-on-surface-variant mb-3 uppercase tracking-wider">
                  Prosedur
                </h3>
                <div className="flex flex-col gap-tight-gap">
                  {codingResult?.procedures && codingResult.procedures.length > 0 ? (
                    codingResult.procedures.map((proc, idx) => (
                      <div key={proc.id}>
                        <div className="flex items-center gap-element-gap p-2 hover:bg-surface-container-low rounded border border-transparent hover:border-outline-variant transition-colors group">
                          {proc.code === "" ? (
                            <SearchableICDInput
                              type="icd9"
                              placeholder="Cari kode atau deskripsi prosedur..."
                              onSelect={(selected) => updateProcedure(proc.id, selected)}
                            />
                          ) : (
                            <>
                              <div className="bg-surface-variant text-on-surface font-mono-data text-mono-data px-3 py-1 rounded-full border border-outline-variant w-20 text-center">
                                {proc.code}
                              </div>
                              <div className="font-body-md text-body-md text-on-surface flex-1">
                                {proc.description}
                              </div>
                            </>
                          )}
                          {isRevisionMode && (
                            <button
                              onClick={() => removeProcedure(proc.id)}
                              className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">
                                delete
                              </span>
                            </button>
                          )}
                        </div>
                        {idx < (codingResult?.procedures?.length || 0) - 1 && (
                          <div className="w-full h-px bg-outline-variant/30"></div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-6 flex flex-col items-center justify-center gap-2 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                      <span className="material-symbols-outlined text-slate-300 text-[24px]">medical_services</span>
                      <p className="text-xs font-medium text-slate-400 italic">Tidak ada tindakan atau prosedur yang terdeteksi</p>
                    </div>
                  )}
                </div>
                {isRevisionMode && (
                  <button
                    onClick={addProcedure}
                    className="mt-3 text-primary font-label-sm text-label-sm flex items-center gap-tight-gap hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>{" "}
                    Add Procedure Code
                  </button>
                )}
              </div>

              {/* Potensi Temuan Tambahan */}
              <div id="tour-coding-potential" className="flex flex-col gap-3">
                {codingResult?.potentialFindings && codingResult.potentialFindings.length > 0 ? (
                  (() => {
                    const pCode = codingResult.primaryDiagnosis?.code || '';
                    const currentSeverity = determineSeverityLevel(codingResult.secondaryDiagnoses, codingResult.potentialFindings);
                    const currentTariff = getEstimatedTariff(pCode, currentSeverity, codingResult.procedures);
                    const severityWithoutPotential = determineSeverityLevel(codingResult.secondaryDiagnoses, []);
                    const tariffWithoutPotential = getEstimatedTariff(pCode, severityWithoutPotential, codingResult.procedures);

                    const potentialGap = currentTariff - tariffWithoutPotential;
                    const isRevenueOptimization = potentialGap > 0;

                    return (
                      <div className={`rounded-lg border p-4 shadow-sm transition-all duration-500 ${
                        isRevenueOptimization 
                          ? 'bg-amber-100/50 border-amber-200' 
                          : 'bg-blue-100/50 border-blue-200'
                      }`}>
                        <h3 className={`font-label-sm text-label-sm mb-3 uppercase tracking-wider flex items-center justify-between ${
                          isRevenueOptimization ? 'text-amber-800' : 'text-blue-800'
                        }`}>
                          <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">
                              {isRevenueOptimization ? 'payments' : 'fact_check'}
                            </span>
                            Potensi Temuan Tambahan
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            isRevenueOptimization ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isRevenueOptimization ? 'Revenue Optimization' : 'Clinical Accuracy Improvement'}
                          </span>
                        </h3>
                        <div className="flex flex-col gap-3">
                          {codingResult.potentialFindings.map((finding, idx) => (
                            <div key={idx} className={`bg-white/80 p-3 rounded border flex items-start justify-between gap-3 group transition-all ${
                              isRevenueOptimization ? 'border-amber-100 hover:border-amber-300' : 'border-blue-100 hover:border-blue-300'
                            }`}>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="bg-slate-100 text-slate-700 font-mono text-[11px] px-1.5 py-0.5 rounded border border-slate-200">
                                    {finding.code}
                                  </div>
                                  <div className={`font-semibold text-sm ${
                                    isRevenueOptimization ? 'text-amber-900' : 'text-blue-900'
                                  }`}>{finding.description}</div>
                                </div>
                                <div className={`text-[13px] italic leading-snug ${
                                  isRevenueOptimization ? 'text-amber-700/80' : 'text-blue-700/80'
                                }`}>{finding.insight}</div>
                              </div>
                              
                              <div className="shrink-0 pt-1">
                                {finding.processed ? (
                                  <div className="bg-emerald-500 text-white p-1 rounded-full shadow-sm">
                                    <span className="material-symbols-outlined text-[16px] block">check</span>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => promoteFinding(idx)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-emerald-500 text-emerald-600 text-[11px] font-bold hover:bg-emerald-500 hover:text-white transition-all shadow-sm bg-white"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">add</span>
                                    Tambahkan
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {isRevenueOptimization && (
                          <div className="mt-4 flex items-center justify-between">
                            <div className="text-[13px] font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 inline-flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">trending_up</span>
                              Estimasi Peningkatan: +{formatIDR(potentialGap)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-6 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-emerald-100">
                      <span className="material-symbols-outlined text-emerald-500 text-[24px]">verified</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">Dokumentasi Optimal</h4>
                      <p className="text-[12px] text-emerald-700/70 leading-relaxed mt-1">
                        AI tidak menemukan potensi klaim tambahan.<br/>Resume medis saat ini sudah sangat akurat.
                      </p>
                    </div>
                  </div>
                )}

                {hasError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-6 flex flex-col items-center justify-center text-center gap-4">
                    <span className="material-symbols-outlined text-red-400 text-[32px]">error</span>
                    <div>
                      <h4 className="text-sm font-bold text-red-900">Gagal Menganalisis</h4>
                      <p className="text-[12px] text-red-700/70 mt-1">
                        Terjadi kendala saat menghubungi AI Gemini.
                      </p>
                    </div>
                    <button 
                      onClick={handleGenerate}
                      className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      Coba Lagi
                    </button>
                  </div>
                )}
              </div>

              {/* Financial Impact */}
              {codingResult?.primaryDiagnosis && (
                <div id="tour-coding-financial" className="mt-2">
                  <FinancialImpactCard
                    primaryDiagnosis={codingResult.primaryDiagnosis}
                    secondaryDiagnoses={codingResult.secondaryDiagnoses}
                    procedures={codingResult.procedures}
                    potentialFindings={codingResult.potentialFindings || []}
                  />
                </div>
              )}
            </div>
            <div className="p-panel-padding bg-surface-container border-t border-outline-variant flex-shrink-0 z-10 sticky bottom-0 flex gap-element-gap">
              {!isRevisionMode ? (
                <>
                  {currentStatus === 'Selesai' ? (
                    <button
                      onClick={() => router.push('/patient-list')}
                      className="flex-1 bg-surface-container-lowest border border-outline text-on-surface font-label-sm text-label-sm py-3 rounded-lg hover:bg-surface-variant transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                      Kembali ke Daftar Pasien
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={enterRevisionMode}
                        className="flex-1 bg-surface-container-lowest border border-outline text-on-surface font-label-sm text-label-sm py-3 rounded-lg hover:bg-surface-variant transition-colors"
                      >
                        Revisi
                      </button>
                      <button onClick={handleSaveAndValidate} disabled={isGenerating} className="flex-1 bg-emerald-600 text-white font-label-sm text-label-sm py-3 rounded-lg flex items-center justify-center gap-tight-gap hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-70">
                        <span className="material-symbols-outlined text-sm">
                          check_circle
                        </span>
                        Validasi & Simpan
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancelRevision}
                    className="flex-1 bg-surface-container-lowest border border-outline text-on-surface font-label-sm text-label-sm py-3 rounded-lg hover:bg-surface-variant transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={isGenerating}
                    className="flex-1 bg-emerald-600 text-white font-label-sm text-label-sm py-3 rounded-lg flex items-center justify-center gap-tight-gap hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-70"
                  >
                    {isGenerating ? (
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                    )}
                    Update
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </section>
      {/* Smart Adjust Modal */}
      {smartAdjustFinding && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
              <div className="flex items-center gap-3 mb-1">
                <span className="material-symbols-outlined text-[20px]">tune</span>
                <h3 className="font-bold text-base">Smart Adjust Diperlukan</h3>
              </div>
              <p className="text-amber-100 text-[12px] leading-relaxed">
                Kode <span className="font-mono bg-amber-600/50 px-1.5 py-0.5 rounded font-bold">{smartAdjustFinding.code}</span> tidak ditemukan secara tepat di kamus ICD-10. Silakan sesuaikan atau cari kode yang paling mendekati.
              </p>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* AI Context */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-[11px] uppercase tracking-wide font-bold text-amber-700 mb-1">Konteks AI</p>
                <p className="text-sm font-semibold text-amber-900">{smartAdjustFinding.description}</p>
                <p className="text-[12px] text-amber-700/80 italic mt-1 leading-relaxed">{smartAdjustFinding.insight}</p>
              </div>

              {/* Parent Code Suggestion */}
              {smartAdjustFinding.parentSuggestion && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-2">Saran Kode Induk (Otomatis)</p>
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/search-icd?q=${encodeURIComponent(smartAdjustFinding.parentSuggestion!)}&type=icd10`);
                      const results = await res.json();
                      const match = results.find((r: any) => r.code.toLowerCase().startsWith(smartAdjustFinding.parentSuggestion!.toLowerCase().replace('.', '')));
                      if (match) {
                        doPromoteFinding(smartAdjustFinding.index, { code: match.code, description: match.description });
                      } else if (results[0]) {
                        doPromoteFinding(smartAdjustFinding.index, { code: results[0].code, description: results[0].description });
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all text-left group"
                  >
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-white text-[16px]">auto_fix_high</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-mono font-bold text-emerald-800 text-sm">{smartAdjustFinding.parentSuggestion}</div>
                      <div className="text-[11px] text-emerald-600">Gunakan kode induk ini</div>
                    </div>
                    <span className="material-symbols-outlined text-emerald-400 text-sm">arrow_forward</span>
                  </button>
                </div>
              )}

              {/* Manual Search */}
              <div>
                <p className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mb-2">Atau Cari Kode Manual</p>
                <SearchableICDInput
                  type="icd10"
                  placeholder="Cari kode ICD-10..."
                  onSelect={(selected) => doPromoteFinding(smartAdjustFinding.index, { code: selected.code, description: selected.description })}
                />
              </div>

              {/* Cancel */}
              <button
                onClick={() => setSmartAdjustFinding(null)}
                className="w-full py-2.5 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-xl font-medium text-sm z-50 flex items-center gap-2 transition-all ${
          toastMessage.includes('Berhasil') || toastMessage.includes('berhasil')
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-800 text-white'
        }`}>
          <span className="material-symbols-outlined text-sm">
            {toastMessage.includes('Berhasil') || toastMessage.includes('berhasil') ? 'check_circle' : 'info'}
          </span>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function CodingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CodingPageContent />
    </Suspense>
  );
}
