import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  MarketMimicAppService,
  type WatchlistRecord,
  type WatchlistItemDetail,
  type OrderRequest,
} from './app-service.js';
import { createDatabaseDriver } from '../storage/expo-adapter.js';
import type {
  Instrument,
  Quote,
  Order,
  DataMode,
} from '../domain/orders/types.js';
import type { OrderValidationResult } from '../domain/orders/validator.js';
import type { DeliveryHolding, IntradayPosition, PortfolioSummary } from '../domain/portfolio/types.js';
import type { Paise, Shares, InstrumentId, OrderId } from '../domain/types.js';
import { toPaise } from '../domain/money/money.js';

interface AppContextValue {
  readonly service: MarketMimicAppService;
  readonly availableCash: Paise;
  readonly portfolioSummary: PortfolioSummary;
  readonly holdings: readonly DeliveryHolding[];
  readonly openPositions: readonly IntradayPosition[];
  readonly openOrders: readonly Order[];
  readonly executedOrders: readonly Order[];
  readonly watchlists: readonly WatchlistRecord[];
  readonly activeWatchlistId: string;
  readonly activeWatchlistItems: readonly WatchlistItemDetail[];
  readonly dataMode: DataMode;
  readonly isReplay: boolean;
  readonly replayTime: string;

  // Actions
  readonly setActiveWatchlistId: (id: string) => void;
  readonly toggleWatchlistItem: (instrumentId: InstrumentId) => boolean;
  readonly refreshAll: () => void;
  readonly validateOrder: (request: OrderRequest) => OrderValidationResult;
  readonly placeOrder: (request: OrderRequest) => { order: Order };
  readonly cancelOrder: (orderId: OrderId) => void;
  readonly squareOffPosition: (positionId: string) => void;
  readonly squareOffAllPositions: () => void;
  readonly resetAccount: () => void;
  readonly getInstrument: (idOrSymbol: string) => Instrument | null;
  readonly getQuote: (instrumentId: InstrumentId) => Quote;
  readonly searchInstruments: (query: string, exchange?: string) => Instrument[];
  readonly stepReplay: (stepMs?: number) => void;
  readonly stopReplay: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

let singletonService: MarketMimicAppService | null = null;

function getService(): MarketMimicAppService {
  if (!singletonService) {
    const db = createDatabaseDriver('marketmimic.db');
    singletonService = new MarketMimicAppService(db);
  }
  return singletonService;
}

export function AppProvider({
  children,
  serviceOverride,
}: {
  children: ReactNode;
  serviceOverride?: MarketMimicAppService;
}): React.JSX.Element {
  const service = useMemo(() => serviceOverride ?? getService(), [serviceOverride]);

  const [revision, setRevision] = useState(0);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string>('wl_top10');

  const triggerUpdate = useCallback(() => {
    setRevision((prev) => prev + 1);
  }, []);

  // Synchronously compute current state based on revision
  const availableCash = useMemo(() => service.getAvailableCash(), [service, revision]);
  const portfolioSummary = useMemo(() => service.getPortfolioSummary(), [service, revision]);
  const holdings = useMemo(() => service.getHoldings(), [service, revision]);
  const openPositions = useMemo(() => service.getOpenPositions(), [service, revision]);
  const openOrders = useMemo(() => service.getOpenOrders(), [service, revision]);
  const executedOrders = useMemo(() => service.getExecutedOrders(), [service, revision]);
  const watchlists = useMemo(() => service.getWatchlists(), [service, revision]);
  const activeWatchlistItems = useMemo(
    () => service.getWatchlistItems(activeWatchlistId),
    [service, activeWatchlistId, revision],
  );
  const dataMode = useMemo(() => service.getDataMode(), [service, revision]);
  const isReplay = useMemo(() => service.isReplayActive(), [service, revision]);
  const replayTime = useMemo(() => service.getClock().nowIso(), [service, revision]);

  const toggleWatchlistItem = useCallback(
    (instrumentId: InstrumentId): boolean => {
      const result = service.toggleWatchlistItem(activeWatchlistId, instrumentId);
      triggerUpdate();
      return result;
    },
    [service, activeWatchlistId, triggerUpdate],
  );

  const placeOrder = useCallback(
    (request: OrderRequest) => {
      const res = service.placeOrder(request);
      triggerUpdate();
      return res;
    },
    [service, triggerUpdate],
  );

  const cancelOrder = useCallback(
    (orderId: OrderId) => {
      service.cancelOrder(orderId);
      triggerUpdate();
    },
    [service, triggerUpdate],
  );

  const squareOffPosition = useCallback(
    (positionId: string) => {
      service.squareOffPosition(positionId);
      triggerUpdate();
    },
    [service, triggerUpdate],
  );

  const squareOffAllPositions = useCallback(() => {
    service.squareOffAllPositions();
    triggerUpdate();
  }, [service, triggerUpdate]);

  const resetAccount = useCallback(() => {
    service.resetAccount();
    triggerUpdate();
  }, [service, triggerUpdate]);

  const stepReplay = useCallback(
    (stepMs?: number) => {
      service.stepReplay(stepMs);
      triggerUpdate();
    },
    [service, triggerUpdate],
  );

  const stopReplay = useCallback(() => {
    service.stopReplay();
    triggerUpdate();
  }, [service, triggerUpdate]);

  const value = useMemo<AppContextValue>(
    () => ({
      service,
      availableCash,
      portfolioSummary,
      holdings,
      openPositions,
      openOrders,
      executedOrders,
      watchlists,
      activeWatchlistId,
      activeWatchlistItems,
      dataMode,
      isReplay,
      replayTime,
      setActiveWatchlistId,
      toggleWatchlistItem,
      refreshAll: triggerUpdate,
      validateOrder: (req) => service.validateOrderRequest(req),
      placeOrder,
      cancelOrder,
      squareOffPosition,
      squareOffAllPositions,
      resetAccount,
      getInstrument: (idOrSymbol) => service.getInstrument(idOrSymbol),
      getQuote: (id) => service.getQuote(id),
      searchInstruments: (q, ex) => service.searchInstruments(q, ex),
      stepReplay,
      stopReplay,
    }),
    [
      service,
      availableCash,
      portfolioSummary,
      holdings,
      openPositions,
      openOrders,
      executedOrders,
      watchlists,
      activeWatchlistId,
      activeWatchlistItems,
      dataMode,
      isReplay,
      replayTime,
      toggleWatchlistItem,
      triggerUpdate,
      placeOrder,
      cancelOrder,
      squareOffPosition,
      squareOffAllPositions,
      resetAccount,
      stepReplay,
      stopReplay,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}

export function useAccount() {
  const { service, availableCash, resetAccount } = useApp();
  return { accountId: service.getAccountId(), availableCash, resetAccount };
}

export function usePortfolio() {
  const {
    portfolioSummary,
    holdings,
    openPositions,
    squareOffPosition,
    squareOffAllPositions,
  } = useApp();
  return {
    portfolioSummary,
    holdings,
    openPositions,
    squareOffPosition,
    squareOffAllPositions,
  };
}

export function useOrders() {
  const { openOrders, executedOrders, placeOrder, cancelOrder, validateOrder } = useApp();
  return { openOrders, executedOrders, placeOrder, cancelOrder, validateOrder };
}

export function useWatchlist() {
  const {
    watchlists,
    activeWatchlistId,
    activeWatchlistItems,
    setActiveWatchlistId,
    toggleWatchlistItem,
  } = useApp();
  return {
    watchlists,
    activeWatchlistId,
    activeWatchlistItems,
    setActiveWatchlistId,
    toggleWatchlistItem,
  };
}

export function useMarketData() {
  const { getInstrument, getQuote, searchInstruments, dataMode, isReplay, replayTime } = useApp();
  return { getInstrument, getQuote, searchInstruments, dataMode, isReplay, replayTime };
}
