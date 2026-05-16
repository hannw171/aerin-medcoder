import { create } from "zustand";

export type ProcessState = "idle" | "processing" | "completed" | "error";

export interface BackgroundPatient {
  id: string;
  name: string;
}

export interface BackgroundResults {
  primaryDiagnosis: { code: string; description: string } | null;
  secondaryDiagnoses: { code: string; description: string }[];
  procedures: { code: string; description: string }[];
  potentialFindings?: { code: string; description: string; insight: string }[];
}

interface BackgroundCoderState {
  processState: ProcessState;
  currentPatient: BackgroundPatient | null;
  /** The exact URL path of the patient's coding page, e.g. /coding?patientId=p1 */
  targetUrl: string | null;
  results: BackgroundResults | null;
  errorMessage: string | null;

  // Actions
  startGeneration: (patient: BackgroundPatient) => void;
  completeGeneration: (results: BackgroundResults) => void;
  failGeneration: (message: string) => void;
  clearProcess: () => void;
}

export const useBackgroundCoder = create<BackgroundCoderState>((set) => ({
  processState: "idle",
  currentPatient: null,
  targetUrl: null,
  results: null,
  errorMessage: null,

  startGeneration: (patient) =>
    set({
      processState: "processing",
      currentPatient: patient,
      targetUrl: `/coding?patientId=${patient.id}`,
      results: null,
      errorMessage: null,
    }),

  completeGeneration: (results) =>
    set({
      processState: "completed",
      results,
    }),

  failGeneration: (message) =>
    set({
      processState: "error",
      errorMessage: message,
    }),

  clearProcess: () =>
    set({
      processState: "idle",
      currentPatient: null,
      targetUrl: null,
      results: null,
      errorMessage: null,
    }),
}));
