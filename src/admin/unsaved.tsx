import { createContext, useContext } from "react";

export const UnsavedContext = createContext<(dirty: boolean) => void>(() => {});
export const useUnsaved = () => useContext(UnsavedContext);
