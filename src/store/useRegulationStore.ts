import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import seedData from '@/data/seedRegulations.json';

export type RuleType = "Batasan Usia" | "Screening PRB" | "Restriksi Gender" | "Tips FAQ Casemix";

export interface ComplianceRule {
  id: string;
  targetCode: string;
  ruleType: RuleType;
  recommendation: string;
  condition?: {
    minAge?: number;
    maxAge?: number;
    requiredGender?: "Laki-laki" | "Perempuan" | "L" | "P";
    mandatoryClinicalKeywords?: string;
  };
}

interface RegulationState {
  rules: ComplianceRule[];
  addRule: (rule: Omit<ComplianceRule, 'id'>) => void;
  deleteRule: (id: string) => void;
  updateRule: (id: string, updatedRule: Omit<ComplianceRule, 'id'>) => void;
}

// Map seed data to ensure UUIDs if missing
const initialRules: ComplianceRule[] = seedData.map((rule: any) => ({
  id: rule.id || crypto.randomUUID(),
  targetCode: rule.targetCode,
  ruleType: rule.ruleType as RuleType,
  recommendation: rule.recommendation,
  condition: rule.condition
}));

export const useRegulationStore = create<RegulationState>()(
  persist(
    (set) => ({
      rules: initialRules,
      addRule: (rule) => set((state) => ({
        rules: [...state.rules, { ...rule, id: crypto.randomUUID() }]
      })),
      deleteRule: (id) => set((state) => ({
        rules: state.rules.filter((r) => r.id !== id)
      })),
      updateRule: (id, updatedRule) => set((state) => ({
        rules: state.rules.map((r) => r.id === id ? { ...r, ...updatedRule } : r)
      })),
    }),
    {
      name: 'regulation-storage',
    }
  )
);
