// src/Context/StreetNameAppContext.ts
import { createContext } from "react";
import type { StreetName } from "../types/types/types";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";

export type StreetNameAppContextType = {
  graphic: __esri.Graphic | undefined;
  setGraphic: React.Dispatch<React.SetStateAction<__esri.Graphic | undefined>>;
  streetNames: StreetName[];
  setStreetNames: React.Dispatch<React.SetStateAction<StreetName[]>>;
  streetNameGraphics: __esri.Graphic[];
  setStreetNameGraphics: React.Dispatch<React.SetStateAction<__esri.Graphic[]>>;  
  attachments: File[];
  setAttachments: React.Dispatch<React.SetStateAction<File[]>>;
  applicationLayer: FeatureLayer;
  streetsTable: FeatureLayer;
  streetsLookupTable: FeatureLayer;
  loaded: boolean;
  sendEmail: (url: string, applicationId: string) => void;
  currentPath: string;
};

// Create context with undefined default for safety check in hook
export const StreetNameAppContext = createContext<
  StreetNameAppContextType | undefined
>(undefined);
