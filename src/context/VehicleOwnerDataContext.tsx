import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  type AllocationBreakdown,
  type LoanTrendPoint,
  type RecentTransaction,
  type SavingsTrendPoint,
  getLatestAllocation,
  getLoanTrend,
  getLoansTotal,
  getRecentTransactions,
  getSavingsTotal,
  getSavingsTrend
} from '../services/finance';
import {
  type AvailableDriver,
  type RouteItem,
  type VehicleCard,
  type VehicleSummary,
  getAvailableDrivers,
  getDashboardCards,
  getRoutes,
  getUserVehicleSummaries
} from '../services/matatus';

const DEFAULT_MONTHS_WINDOW = 12;

export type FinanceDataBundle = {
  savingsTrend: SavingsTrendPoint[];
  loanTrend: LoanTrendPoint[];
  allocation: AllocationBreakdown | null;
  transactions: RecentTransaction[];
  totals: {
    savings: number;
    loans: number;
  };
};

export type MatatuDataBundle = {
  dashboardCards: VehicleCard[];
  availableDrivers: AvailableDriver[];
  routes: RouteItem[];
  vehicleSummaries: VehicleSummary[];
};

type LoadOptions = {
  force?: boolean;
};

type Status = 'idle' | 'loading' | 'ready' | 'error';

type FinanceState = {
  status: Status;
  data: FinanceDataBundle | null;
  error: string | null;
  lastFetched: number | null;
};

type MatatuState = {
  status: Status;
  data: MatatuDataBundle | null;
  error: string | null;
  lastFetched: number | null;
};

const initialFinanceState: FinanceState = {
  status: 'idle',
  data: null,
  error: null,
  lastFetched: null
};

const initialMatatuState: MatatuState = {
  status: 'idle',
  data: null,
  error: null,
  lastFetched: null
};

type VehicleOwnerDataContextValue = {
  userId: string | null;
  finance: FinanceState;
  matatu: MatatuState;
  loadFinance: (options?: LoadOptions) => Promise<FinanceDataBundle | null>;
  refreshFinance: () => Promise<FinanceDataBundle | null>;
  invalidateFinance: () => void;
  loadMatatu: (options?: LoadOptions) => Promise<MatatuDataBundle | null>;
  refreshMatatu: () => Promise<MatatuDataBundle | null>;
  invalidateMatatu: () => void;
};

const VehicleOwnerDataContext = createContext<VehicleOwnerDataContextValue | undefined>(undefined);

export function VehicleOwnerDataProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
  const [financeState, setFinanceState] = useState<FinanceState>(initialFinanceState);
  const [matatuState, setMatatuState] = useState<MatatuState>(initialMatatuState);
  const financeRequestRef = useRef<Promise<FinanceDataBundle> | null>(null);
  const matatuRequestRef = useRef<Promise<MatatuDataBundle> | null>(null);

  useEffect(() => {
    setFinanceState(initialFinanceState);
    setMatatuState(initialMatatuState);
    financeRequestRef.current = null;
    matatuRequestRef.current = null;
  }, [userId]);

  const loadFinance = useCallback(async ({ force = false }: LoadOptions = {}) => {
    if (!userId) {
      setFinanceState(initialFinanceState);
      return null;
    }

    if (!force) {
      if (financeState.status === 'ready' && financeState.data) {
        return financeState.data;
      }
      if (financeState.status === 'loading' && financeRequestRef.current) {
        return financeRequestRef.current;
      }
    }

    const request = (async () => {
      const [savingsTrend, loanTrend, allocation, transactions, savingsTotal, loansTotal] = await Promise.all([
        getSavingsTrend(userId, { months: DEFAULT_MONTHS_WINDOW }),
        getLoanTrend(userId, { months: DEFAULT_MONTHS_WINDOW }),
        getLatestAllocation(userId),
        getRecentTransactions(userId, { limit: 20 }),
        getSavingsTotal(),
        getLoansTotal()
      ]);

      return {
        savingsTrend,
        loanTrend,
        allocation,
        transactions,
        totals: {
          savings: savingsTotal,
          loans: loansTotal
        }
      } satisfies FinanceDataBundle;
    })();

    financeRequestRef.current = request;
    setFinanceState((prev) => ({
      ...prev,
      status: 'loading',
      error: null
    }));

    try {
      const data = await request;
      setFinanceState({
        status: 'ready',
        data,
        error: null,
        lastFetched: Date.now()
      });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load finance data';
      setFinanceState((prev) => ({
        ...prev,
        status: prev.data ? 'ready' : 'error',
        error: message
      }));
      return null;
    } finally {
      financeRequestRef.current = null;
    }
  }, [financeState.data, financeState.status, userId]);

  const loadMatatu = useCallback(async ({ force = false }: LoadOptions = {}) => {
    if (!userId) {
      setMatatuState(initialMatatuState);
      return null;
    }

    if (!force) {
      if (matatuState.status === 'ready' && matatuState.data) {
        return matatuState.data;
      }
      if (matatuState.status === 'loading' && matatuRequestRef.current) {
        return matatuRequestRef.current;
      }
    }

    const request = (async () => {
      const [dashboardCards, availableDrivers, routes, vehicleSummaries] = await Promise.all([
        getDashboardCards(),
        getAvailableDrivers(),
        getRoutes(),
        getUserVehicleSummaries()
      ]);

      return {
        dashboardCards,
        availableDrivers,
        routes,
        vehicleSummaries
      } satisfies MatatuDataBundle;
    })();

    matatuRequestRef.current = request;
    setMatatuState((prev) => ({
      ...prev,
      status: 'loading',
      error: null
    }));

    try {
      const data = await request;
      setMatatuState({
        status: 'ready',
        data,
        error: null,
        lastFetched: Date.now()
      });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load matatu data';
      setMatatuState((prev) => ({
        ...prev,
        status: prev.data ? 'ready' : 'error',
        error: message
      }));
      return null;
    } finally {
      matatuRequestRef.current = null;
    }
  }, [matatuState.data, matatuState.status, userId]);

  const invalidateFinance = useCallback(() => {
    setFinanceState(initialFinanceState);
  }, []);

  const invalidateMatatu = useCallback(() => {
    setMatatuState(initialMatatuState);
  }, []);

  const value = useMemo<VehicleOwnerDataContextValue>(() => ({
    userId,
    finance: financeState,
    matatu: matatuState,
    loadFinance,
    refreshFinance: () => loadFinance({ force: true }),
    invalidateFinance,
    loadMatatu,
    refreshMatatu: () => loadMatatu({ force: true }),
    invalidateMatatu
  }), [userId, financeState, matatuState, loadFinance, loadMatatu, invalidateFinance, invalidateMatatu]);

  return (
    <VehicleOwnerDataContext.Provider value={value}>
      {children}
    </VehicleOwnerDataContext.Provider>
  );
}

export function useVehicleOwnerData() {
  const context = useContext(VehicleOwnerDataContext);
  if (!context) {
    throw new Error('useVehicleOwnerData must be used within a VehicleOwnerDataProvider');
  }
  return context;
}
