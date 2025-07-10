// src/Context/StreetNameAppContextProvider.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { StreetNameAppContext } from "./StreetNameAppContext";
import type { StreetName } from "../types/types/types";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { config } from "../config";
import Graphic from "@arcgis/core/Graphic";
import { useLocation } from "react-router-dom";

export const StreetNameAppContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const location = useLocation();
  const [loaded, setLoaded] = useState<boolean>(false);
  const [graphic, setGraphic] = useState<__esri.Graphic | undefined>(new Graphic({attributes:{streetnamesneeded : 1}}));
  const [streetNames, setStreetNames] = useState<StreetName[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [streetNameGraphics, setStreetNameGraphics] = useState<
    __esri.Graphic[]
  >([]);
  const isAdminRoute =
    location.pathname.includes("/review/");
  const applicationLayer = useMemo(
    () =>
      new FeatureLayer({
        portalItem: {
          id: isAdminRoute ? config.adminFormLayerId : config.formLayerId,
        },
        layerId: 0,
      }),
    [isAdminRoute]
  );
  const streetsTable = useMemo(
    () =>
      new FeatureLayer({
        portalItem: {
          id: isAdminRoute ? config.adminFormLayerId : config.formLayerId,
        },
        layerId: 1,
      }),
    [isAdminRoute]
  );
  const streetsLookupTable = useMemo(
    () => new FeatureLayer({ portalItem: { id: config.streetNamesTableId } }),
    []
  );

  const sendEmail = (url: string, applicationId: string) => {
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ applicationId }),
    })
      .then((response) => response.json())
      .then((data) => console.log("Flow triggered:", data))
      .catch((error) => console.error("Error triggering Flow:", error));
  };

  useEffect(() => {
    (async () => {
      await applicationLayer.load();
      await streetsTable.load();
      await streetsLookupTable.load();
      setLoaded(true);
    })();
  }, [applicationLayer, streetsTable, streetsLookupTable]);
  return (
    <StreetNameAppContext.Provider
      value={{
        graphic,
        setGraphic,
        streetNames,
        setStreetNames,
        streetNameGraphics,
        setStreetNameGraphics,
        attachments,
        setAttachments,
        applicationLayer,
        streetsTable,
        streetsLookupTable,
        loaded,
        sendEmail,
        currentPath: location.pathname 
      }}
    >
      {children}
    </StreetNameAppContext.Provider>
  );
};
