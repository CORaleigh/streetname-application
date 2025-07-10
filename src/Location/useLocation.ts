import Collection from "@arcgis/core/core/Collection";
import LocatorSearchSource from "@arcgis/core/widgets/Search/LocatorSearchSource";
import type { TargetedEvent } from "@arcgis/map-components";
import { useState, useEffect, useRef, useCallback } from "react";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";
import { type JurisdictionLink } from "../types/types/types";
import { toTitleCase } from "../utils";
import * as locator from "@arcgis/core/rest/locator.js";
import { config } from "../config";
import Graphic from "@arcgis/core/Graphic";

// Define any types for your hook's inputs and outputs
interface UseLocationOptions {
  onNext: (step: string) => void;
  onValid: (step: string, isValid: boolean) => void;
}

const useLocation = ({ onNext, onValid }: UseLocationOptions) => {
  const { graphic, setGraphic, setAttachments } = useStreetNameAppContext();
  const arcgisMap = useRef<HTMLArcgisMapElement | null>(null);
  const arcgisSearch = useRef<HTMLArcgisSearchElement | null>(null);
  const [jurisdictionLink, setJurisdictionLink] = useState<JurisdictionLink>();
  const sources = new Collection([
    new LocatorSearchSource({
      url: "https://maps.raleighnc.gov/arcgis/rest/services/Locators/Locator/GeocodeServer",
      placeholder: "Search by address",
      outFields: ["*"],
    }),
  ]);
  const etjLayer = useRef<__esri.FeatureLayer | undefined>(undefined);
  const propertyLayer = useRef<__esri.FeatureLayer | undefined>(undefined);
  const [inEtj, setInEtj] = useState<boolean>(false);
  const [onProperty, setOnProperty] = useState<boolean>(false);
  const [mapPoint, setMapPoint] = useState<__esri.Point | undefined>(undefined);

  const handleSearchComplete = async (
    event: TargetedEvent<
      HTMLArcgisSearchElement,
      __esri.SearchViewModelSearchCompleteEvent
    >
  ) => {
    if (!etjLayer.current || !propertyLayer.current || !graphic) return;
    let resultFound = true;
    let feature: __esri.Graphic | undefined = undefined;

    if (
      !event.target.results ||
      !event.target.results[0] ||
      !event.target.results[0].results ||
      !event.target.results[0].results.length
    ) {
      resultFound = false;
      requestAnimationFrame(() => {
        const notice = document
          .querySelector(".arcgis-search__autocomplete")
          ?.querySelector("calcite-notice");
        if (notice) {
          notice.open = false;
        }
      });
    } else {
      feature = event.target.results[0].results[0].feature;
    }

    const searchPoint: __esri.Point =
      !resultFound && mapPoint ? mapPoint : (feature?.geometry as __esri.Point);
    const propertyResult = await propertyLayer.current?.queryFeatures({
      geometry: searchPoint,
      outFields: ["SITE_ADDRESS", "PIN_NUM", "CITY_DECODE"],
      returnGeometry: true,
    });

    if (!feature && propertyResult.features.length > 0) {
      const parcel = propertyResult.features.at(0);
      if (!parcel) return;

      const locateResult = await locator.addressToLocations(config.geocodeUrl, {
        address: { SingleLine: parcel.getAttribute("SITE_ADDRESS") },
        outFields: ["*"],
      });
      if (!locateResult || locateResult.length === 0) return;

      feature = new Graphic({
        attributes: locateResult.at(0)?.attributes,
        geometry: locateResult.at(0)?.location,
      });
    }
    if (!feature) return;

    const etjCount = await etjLayer.current?.queryFeatureCount({
      where: "JURISDICTION = 'RALEIGH'",
      geometry: searchPoint,
    });

    setInEtj(etjCount > 0);

    if (etjCount === 0) {
      const etjResults = await etjLayer.current?.queryFeatures({
        where: "1=1",
        geometry: searchPoint,
        outFields: ["JURISDICTION"],
        returnGeometry: false,
      });
      if (etjResults.features.length === 0) {
        setJurisdictionLink({
          name: "Wake County",
          href: "https://www.wake.gov/departments-government/geographic-information-services-gis/addresses-road-names-and-street-signs/road-name-approval-guide",
        });
      } else {
        const match = etjResults.features.at(0)?.getAttribute("JURISDICTION");
        if (match === "CARY") {
          setJurisdictionLink({
            name: "Cary",
            href: "https://www.carync.gov/home/showpublisheddocument/1400/638102363336230000",
          });
        } else if (match === "KNIGHTDALE") {
          setJurisdictionLink({
            name: "Knightdale",
            href: "https://www.knightdalenc.gov/sites/default/files/uploads/developmentservices/Forms%20or%20Applications/street-name-application_fillable.pdf",
          });
        } else if (match === "APEX") {
          setJurisdictionLink({
            name: "Apex",
            href: "https://www.knightdalenc.gov/sites/default/files/uploads/developmentservices/Forms%20or%20Applications/street-name-application_fillable.pdf",
          });
        } else {
          setJurisdictionLink({
            name: toTitleCase(match),
            href: "https://www.wake.gov/departments-government/geographic-information-services-gis/addresses-road-names-and-street-signs/road-name-approval-guide",
          });
        }
      }
      return;
    }
    setJurisdictionLink(undefined);

    setOnProperty(propertyResult.features.length > 0);
    if (propertyResult.features.length === 0) return;
    const propertyFeature = propertyResult.features.at(0);
    if (!propertyFeature) return;
    graphic.geometry = searchPoint;
    if (feature) {
      graphic.setAttribute("zipcode", feature.getAttribute("Postal"));
      graphic.setAttribute("address", feature.getAttribute("Match_addr"));
    }
    graphic.setAttribute("pinnum", propertyFeature.getAttribute("PIN_NUM"));

    console.log(graphic.attributes);

    setGraphic(graphic.clone());
  };

  const layerViewCreated = (
    event: TargetedEvent<HTMLArcgisMapElement, __esri.ViewLayerviewCreateEvent>
  ) => {
    if (event.detail.layer.title === "Raleigh Jurisdiction") {
      etjLayer.current = event.detail.layer as __esri.FeatureLayer;
    }
    if (event.detail.layer.title === "Properties") {
      propertyLayer.current = event.detail.layer as __esri.FeatureLayer;
    }
  };
  const mapViewClicked = (
    event: TargetedEvent<HTMLArcgisMapElement, __esri.ViewClickEvent>
  ) => {
    setMapPoint(event.detail.mapPoint);
    arcgisSearch.current?.search(event.detail.mapPoint);
  };

  const handleNextClick = async () => {
    {
      await reactiveUtils.whenOnce(() => arcgisMap.current?.updating === false);
      const screenshot = await arcgisMap.current?.takeScreenshot({
        width: 1048,
        height: 586,
      });
      if (screenshot) {
        const blob = await (await fetch(screenshot.dataUrl)).blob();
        const file = new File([blob], "screenshot", { type: blob.type });
        setAttachments((prev) => [...prev, file]);
      }
      await setTimeout(() => {}, 1000);

      if (inEtj && onProperty && graphic?.geometry) {
        onNext("details");
      }
    }
  };

  const addPin = useCallback(() => {
    if (!graphic || !arcgisMap.current) return;
    graphic.symbol = {
      type: "picture-marker",
      url: "./assets/pin.svg",
      height: 24,
      width: 24,
      yoffset: 12,
    };
    arcgisMap.current.graphics.removeAll();
    arcgisMap.current.graphics.add(graphic);
  }, [graphic]);

  useEffect(() => {
    if (graphic) {
      addPin();
    }
  }, [addPin, graphic]);

  useEffect(() => {
    onValid("details", Boolean(inEtj && onProperty && graphic?.geometry));
  }, [inEtj, onProperty, graphic?.geometry, onValid]);
  return {
    arcgisMap,
    arcgisSearch,
    graphic,
    inEtj,
    onProperty,
    sources,
    handleSearchComplete,
    layerViewCreated,
    mapViewClicked,
    handleNextClick,
    jurisdictionLink,
  };
};

export default useLocation;
