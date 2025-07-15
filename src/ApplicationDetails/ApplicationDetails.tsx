import React from "react";

import { getFieldAlias } from "../utils";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";
import { config } from "../config";
import useApplicationDetails from "./useApplicationDetails";
import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-feature";

interface ApplicationDetailsProps {
  layer: __esri.FeatureLayer;
  fields: string[];
  expanded?: boolean;
}

const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({
  layer,
  fields,
  expanded,
}) => {
  const { graphic, loaded } = useStreetNameAppContext();
  const { detailsMap, handleViewReady } = useApplicationDetails();

  return (
    <>
      <calcite-block
        collapsible
        heading="Details"
        description="application details"
        expanded={expanded}
      >
        {loaded && graphic && graphic.attributes && (
          <div className="details-container">
            <calcite-table caption={"Details"} striped>
              <calcite-table-row>
                <calcite-table-header heading="Field"></calcite-table-header>
                <calcite-table-header heading="Value"></calcite-table-header>
              </calcite-table-row>
              {Object.entries(graphic?.attributes).map(
                ([key, value]) =>
                  fields.includes(key) && (
                    <calcite-table-row key={key}>
                      <calcite-table-cell>
                        {getFieldAlias(key, layer)}
                      </calcite-table-cell>
                      <calcite-table-cell>{String(value)}</calcite-table-cell>
                    </calcite-table-row>
                  )
              )}
            </calcite-table>
            <arcgis-map
              ref={detailsMap}
              itemId={config.webMapId}
              onarcgisViewReadyChange={handleViewReady}
            ></arcgis-map>
          </div>
        )}
      </calcite-block>
    </>
  );
};

export default ApplicationDetails;
