import React from 'react';
import {
  createContext, useContext
} from 'react';
import { inferRouterOutputs } from '@trpc/server';
import { AppRouter } from '@/trpc/routers/_app';

type TTSVoiceItem = inferRouterOutputs<AppRouter>['voices']['getAll']['custom'][number];

export interface TTSVoicesContextValue {
  customVoices: TTSVoiceItem[]
  systemVoices: TTSVoiceItem[]
  allVoices: TTSVoiceItem[]
}

const TTSVoicesContext = createContext<TTSVoicesContextValue | null>(null);

interface TTSVoicesProviderProps {
  children: React.ReactNode
  value: TTSVoicesContextValue
}

const TTSVoicesProvider = ({ children, value }: TTSVoicesProviderProps) => {
  return (
    <TTSVoicesContext.Provider value={value}>
      {children}
    </TTSVoicesContext.Provider>
  );
};

const useTTSVoices = () => {
  const context = useContext(TTSVoicesContext);

  if (!context) {
    throw new Error('useTTSVoices must be used within a TTSVoicesProvider');
  }

  return context;
};

export {
  TTSVoicesContext, TTSVoicesProvider, useTTSVoices
};
