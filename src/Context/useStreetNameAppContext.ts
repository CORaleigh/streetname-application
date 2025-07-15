// src/Context/useStreetNameAppContext.ts
import { useContext } from "react";
import { StreetNameAppContext } from "./StreetNameAppContext";

export const useStreetNameAppContext = () => {
  const context = useContext(StreetNameAppContext);
  if (!context) {
    throw new Error(
      "useStreetNameAppContext must be used within a StreetNameAppContextProvider"
    );
  }
  return context;
};
