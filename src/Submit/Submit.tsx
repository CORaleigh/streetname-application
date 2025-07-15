import React from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

import type { FormField, StreetName } from "../types/types/types";
import useSubmit from "./useSubmit";
import ApplicationDetails from "../ApplicationDetails/ApplicationDetails";
import { config } from "../config";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";
import { useCalciteBreakpoint } from "../useCalciteBreakpoints";

interface SubmitProps {
  layer: FeatureLayer;
  streetsTable: FeatureLayer;
  onPrevious: (step: string) => void;
  onSuccess: (globalId: string) => void;
}

const Submit: React.FC<SubmitProps> = ({
  layer,
  streetsTable,

  onPrevious,
  onSuccess,
}) => {
  const { streetNames } = useStreetNameAppContext();
  const breakpoint = useCalciteBreakpoint();
  const { submitApplication, submitting, submitted } = useSubmit({
    layer,
    streetsTable,
    onSuccess,
  });
  const fields = config.fields.contact
    .map((field: FormField) => field.name)
    .concat(config.fields.details.map((field: FormField) => field.name));

  return (
    <calcite-panel>
      {submitting && <calcite-scrim open loading></calcite-scrim>}
      <ApplicationDetails
        layer={layer}
        fields={fields}
        expanded={
          breakpoint === "xs" || breakpoint === "xxs" ? undefined : true
        }
      ></ApplicationDetails>
      <h2>Street Names</h2>

      <calcite-table caption={"Street Names"} numbered striped>
        <calcite-table-row slot="table-header">
          <calcite-table-header heading="Name"></calcite-table-header>
          <calcite-table-header heading="Type"></calcite-table-header>
        </calcite-table-row>
        {streetNames.map((streetName: StreetName, i: number) => (
          <calcite-table-row key={`street-name-${i}`}>
            <calcite-table-cell>{streetName.streetname}</calcite-table-cell>
            <calcite-table-cell>{streetName.streettype}</calcite-table-cell>
          </calcite-table-row>
        ))}
      </calcite-table>
      <calcite-button
        scale="l"
        slot="footer-start"
        iconStart="chevron-left"
        onClick={() => onPrevious("streetnames")}
      >
        Previous
      </calcite-button>
      <calcite-button
        scale="l"
        slot="footer-end"
        iconEnd="submit"
        onClick={submitApplication}
        disabled={submitting || submitted ? true : undefined}
      >
        Submit
      </calcite-button>
    </calcite-panel>
  );
};

export default Submit;
