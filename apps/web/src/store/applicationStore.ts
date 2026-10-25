import { create } from 'zustand';
import type { Purpose, Recommendation } from '../lib/types';

/** Черновик новой заявки, пока клиент идёт по шагам: цель → компания → проверка и отправка */
interface DraftState {
  purpose: Purpose | null;
  amountRub: number;
  term: number;
  recommendation: Recommendation | null;
  companyId: string | null;
  companyName: string | null;
  setProduct: (purpose: Purpose, amountRub: number, term: number, recommendation: Recommendation) => void;
  setCompany: (companyId: string, companyName: string) => void;
  reset: () => void;
}

const initial = {
  purpose: null,
  amountRub: 1_500_000,
  term: 24,
  recommendation: null,
  companyId: null,
  companyName: null,
};

export const useApplicationStore = create<DraftState>((set) => ({
  ...initial,
  setProduct: (purpose, amountRub, term, recommendation) => set({ purpose, amountRub, term, recommendation }),
  setCompany: (companyId, companyName) => set({ companyId, companyName }),
  reset: () => set(initial),
}));
