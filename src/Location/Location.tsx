import React from "react";
import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-search";
import "@esri/calcite-components/components/calcite-link";
import useLocation from "./useLocation";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";

interface LocationProps {
  itemId: string;
  onNext: (step: string) => void;
  onPrevious: (step: string) => void;
  onValid: (step: string, isValid: boolean) => void;
}

const Location: React.FC<LocationProps> = ({
  itemId,
  onNext,
  onPrevious,
  onValid,
}) => {
  const { graphic } = useStreetNameAppContext();
  const {
    arcgisMap,
    arcgisSearch,
    inEtj,
    onProperty,
    sources,
    handleSearchComplete,
    layerViewCreated,
    mapViewClicked,
    handleNextClick,
    jurisdictionLink,
  } = useLocation({ onNext, onValid });

  return (
    <calcite-panel id="location-panel">
      <calcite-notice
        open
        width="full"
        kind={
          !graphic?.geometry || !inEtj || !onProperty ? "danger" : "success"
        }
        icon={
          !graphic?.geometry || !inEtj || !onProperty
            ? "exclamation-mark-circle-f"
            : "check"
        }
      >
        <div slot="title">
          {!graphic?.geometry
            ? "Location has not been set"
            : !inEtj
            ? `Location is in ${jurisdictionLink?.name}'s jurisdiction`
            : !onProperty
            ? "Location must be on a property"
            : "Location has been set"}
        </div>
        {jurisdictionLink && (
          <calcite-link
            iconStart="link"
            target="_blank"
            slot="link"
            href={jurisdictionLink?.href}
          >
            View Application
          </calcite-link>
        )}
      </calcite-notice>
      <arcgis-map
        itemId={itemId}
        ref={arcgisMap}
        onarcgisViewLayerviewCreate={layerViewCreated}
        onarcgisViewClick={mapViewClicked}
        popupDisabled
      >
        <arcgis-search
          position="top-left"
          includeDefaultSourcesDisabled
          sources={sources}
          onarcgisSearchComplete={handleSearchComplete}
          ref={arcgisSearch}
          popupDisabled
          resultGraphicDisabled
        ></arcgis-search>
      </arcgis-map>

      <calcite-button
        scale="l"
        slot="footer-start"
        iconStart="chevron-left"
        onClick={() => onPrevious("contact")}
      >
        Previous
      </calcite-button>
      <calcite-button
        disabled={inEtj && onProperty && graphic?.geometry ? undefined : true}
        scale="l"
        slot="footer-end"
        iconEnd="chevron-right"
        onClick={handleNextClick}
      >
        Next
      </calcite-button>
    </calcite-panel>
  );
};

export default Location;
