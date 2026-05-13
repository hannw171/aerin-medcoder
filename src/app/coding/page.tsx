"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { patients } from "@/lib/mockData";

import { SearchableICDInput, type CodeItem } from "@/components/SearchableICDInput";
type CodingResult = {
  primaryDiagnosis: CodeItem | null;
  secondaryDiagnoses: CodeItem[];
  procedures: CodeItem[];
  potentialFindings?: { description: string; insight: string }[];
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
  const [currentStatus, setCurrentStatus] = useState(patient.status);
  const [isManuallyEdited, setIsManuallyEdited] = useState(patient.status === 'Direvisi');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

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

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-icd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicalRecord: patient.medicalRecord })
      });

      if (!res.ok) {
        throw new Error('Failed to generate AI codes');
      }

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
        potentialFindings: data.potentialFindings || []
      };

      setCodingResult(formattedResult);
      setIsGenerated(true);
      setIsManuallyEdited(false);
      setCurrentStatus('Draft AI');

      // Background auto-save (fire-and-forget)
      fetch(`/api/patients/${patient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codingResult: formattedResult,
          status: 'Draft AI'
        }),
        keepalive: true // Ensures request completes even if user navigates away
      })
      .then(() => setLastSavedTime(new Date()))
      .catch(err => console.error('Auto-save failed:', err));
    } catch (error) {
      console.error(error);
      setToastMessage("Gagal melakukan generate dengan AI. Silakan coba lagi.");
      setTimeout(() => setToastMessage(""), 3000);
    } finally {
      setIsGenerating(false);
    }
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
      await fetch(`/api/patients/${patient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codingResult: codingResult,
          status: 'Selesai'
        })
      });
      setLastSavedTime(new Date());
      setCurrentStatus('Selesai');
      router.push('/patient-list');
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
      setToastMessage("Gagal menyimpan.");
      setTimeout(() => setToastMessage(""), 3000);
    }
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
          <div className="flex gap-4 border-b border-outline-variant w-full">
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
      <section className="w-2/5 bg-surface-container flex flex-col h-full relative">
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
              Perubahan tersimpan pada {lastSavedTime.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit', hour12: false})} WIB
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
                  {codingResult?.secondaryDiagnoses.map((diag, idx) => (
                    <div key={diag.id}>
                      <div className="flex items-start gap-element-gap p-2 hover:bg-surface-container-low rounded border border-transparent hover:border-outline-variant transition-colors group">
                        {diag.code === "" ? (
                          <SearchableICDInput
                            type="icd10"
                            placeholder="Cari kode atau deskripsi ICD-10..."
                            onSelect={(selected) => updateSecondaryCode(diag.id, selected)}
                          />
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
                        {isRevisionMode && (
                          <button 
                            onClick={() => removeSecondaryCode(diag.id)}
                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all mt-1"
                          >
                            <span className="material-symbols-outlined text-sm">
                              delete
                            </span>
                          </button>
                        )}
                      </div>
                      {idx < codingResult.secondaryDiagnoses.length - 1 && (
                        <div className="w-full h-px bg-outline-variant/30"></div>
                      )}
                    </div>
                  ))}
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
                  {codingResult?.procedures.map((proc, idx) => (
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
                      {idx < codingResult.procedures.length - 1 && (
                        <div className="w-full h-px bg-outline-variant/30"></div>
                      )}
                    </div>
                  ))}
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
              {codingResult?.potentialFindings && codingResult.potentialFindings.length > 0 && (
                <div className="bg-amber-50/50 rounded-lg border border-amber-200 p-4 shadow-sm">
                  <h3 className="font-label-sm text-label-sm text-amber-800 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    Potensi Temuan Tambahan (Unverified)
                  </h3>
                  <div className="flex flex-col gap-3">
                    {codingResult.potentialFindings.map((finding, idx) => (
                      <div key={idx} className="bg-white/80 p-3 rounded border border-amber-100">
                        <div className="font-semibold text-amber-900 text-sm mb-1">{finding.description}</div>
                        <div className="text-[13px] text-amber-700/80 italic leading-snug">{finding.insight}</div>
                      </div>
                    ))}
                  </div>
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
      {toastMessage && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-6 py-3 rounded-md shadow-lg font-body-md z-50">
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
