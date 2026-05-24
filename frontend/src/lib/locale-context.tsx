"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import { DEFAULT_LOCALE } from "./i18n";

type LocaleContextValue = {
  locale: string;
  setLocale: (locale: string) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
});

export const LocaleProvider = ({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: string;
}) => {
  const [locale, setLocale] = useState(initialLocale);
  const value = useMemo(() => ({ locale, setLocale }), [locale]);
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
};

export const useLocale = () => useContext(LocaleContext);
