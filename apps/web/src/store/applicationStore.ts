import { create } from 'zustand';

interface ApplicationData {
  purpose: string | null;
  amount: number;
  term: number;
  rate: number;
  monthlyPayment: number;
  company: any;
  financials: any;
  bkiConsent: boolean;
  applicationId: string | null;
  applicationNumber: string | null;
}

interface ApplicationStore extends ApplicationData {
  setProductData: (purpose: string, amount: number, term: number, rate: number, monthlyPayment: number) => void;
  setCompany: (company: any) => void;
  setFinancials: (financials: any) => void;
  setBkiConsent: (consent: boolean) => void;
  setApplication: (id: string, number: string) => void;
  reset: () => void;
}

const initialState: ApplicationData = {
  purpose: null,
  amount: 0,
  term: 0,
  rate: 0,
  monthlyPayment: 0,
  company: null,
  financials: null,
  bkiConsent: false,
  applicationId: null,
  applicationNumber: null,
};

export const useApplicationStore = create<ApplicationStore>((set) => ({
  ...initialState,

  setProductData: (purpose, amount, term, rate, monthlyPayment) =>
    set({ purpose, amount, term, rate, monthlyPayment }),

  setCompany: (company) => set({ company }),

  setFinancials: (financials) => set({ financials }),

  setBkiConsent: (bkiConsent) => set({ bkiConsent }),

  setApplication: (applicationId, applicationNumber) =>
    set({ applicationId, applicationNumber }),

  reset: () => set(initialState),
}));