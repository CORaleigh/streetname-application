// src/Context/StreetNameAppContextProvider.tsx
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { StreetNameAppContext } from "./StreetNameAppContext";
import type { StreetName } from "../types/types/types";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { config } from "../config";
import Graphic from "@arcgis/core/Graphic";
import { useLocation } from "react-router-dom";
import useLocalStorage from "../useLocalStorage";
import { useSearchParams } from "react-router-dom";
import Point from "@arcgis/core/geometry/Point";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils.js";

export const StreetNameAppContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [loaded, setLoaded] = useState<boolean>(false);
  const [graphic, setGraphic] = useState<__esri.Graphic | undefined>(
    new Graphic({ attributes: { streetnamesneeded: 1 } })
  );
  const [streetNames, setStreetNames] = useState<StreetName[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [streetNameGraphics, setStreetNameGraphics] = useState<
    __esri.Graphic[]
  >([]);
  const [contact] = useLocalStorage<string>("street_app_contact", "");

  const isAdminRoute = location.pathname.includes("/review/");
  const localStorageRead = useRef<boolean>(false);
  const paramsLoaded = useRef(false);
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
    if (localStorageRead.current || !contact || !graphic) return;
    localStorageRead.current = true;
    const contactObj = JSON.parse(contact);
    if (contactObj && graphic) {
      Object.entries(contactObj).forEach(([key, value]) => {
        graphic.setAttribute(key, value);
      });
    }
  }, [contact, graphic]);
  useEffect(() => {
    (async () => {
      await applicationLayer.load();
      await streetsTable.load();
      await streetsLookupTable.load();
      setLoaded(true);
    })();
  }, [applicationLayer, streetsTable, streetsLookupTable]);

  useEffect(() => {
    if (paramsLoaded.current || !graphic) return;
    paramsLoaded.current = true;
    const namesNeeded = searchParams.get("streetnamesneeded");
    if (namesNeeded) {
      graphic.setAttribute("streetnamesneeded", parseInt(namesNeeded));
    }
    ["projectname", "plannumber", "pinnum", "address", "zipcode"].forEach(
      (name: string) => {
        if (searchParams.get(name)) {
          graphic.setAttribute(name, searchParams.get(name));
        }
      }
    );
    const x = searchParams.get("x");
    const y = searchParams.get("y");

    if (x && y) {
      const point: Point = new Point({
        x: parseFloat(x),
        y: parseFloat(y),
        spatialReference: { wkid: 4326 },
      });
      graphic.geometry = webMercatorUtils.geographicToWebMercator(point);
    }
  }, [graphic, searchParams]);
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
        currentPath: location.pathname,
      }}
    >
      {children}
    </StreetNameAppContext.Provider>
  );
};
