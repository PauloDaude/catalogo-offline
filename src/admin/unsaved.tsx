import { createContext, useContext } from "react";

export const UnsavedContext = createContext<{
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
}>({ dirty: false, setDirty: () => {} });
export const useUnsaved = () => useContext(UnsavedContext).setDirty;
export const useIsUnsaved = () => useContext(UnsavedContext).dirty;
