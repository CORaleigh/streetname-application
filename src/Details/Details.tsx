import React from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import FormInputs from "../FormInputs/FormInputs";

import type { FormField } from "../types/types/types";
import useDetails from "./useDetails";

interface DetailsProps {
  formFields: FormField[];
  layer: FeatureLayer;
  onNext: (step: string) => void;
  onPrevious: (step: string) => void;
  onValid: (step: string, isValid: boolean) => void;
}

const Details: React.FC<DetailsProps> = ({
  formFields,
  layer,
  onNext,
  onPrevious,
  onValid,
}) => {
  const { inputRef, fieldsLoaded, fields, setFields, handleFileInput } =
    useDetails({
      formFields,
      layer,
      onValid,
    });
  return (
    <calcite-panel>
      {fieldsLoaded && (
        <FormInputs ref={inputRef} fields={fields} setFields={setFields} />
      )}
      <calcite-input
        type="file"
        accept=".pdf"
        oncalciteInputChange={handleFileInput}
      ></calcite-input>

      <calcite-button
        scale="l"
        slot="footer-start"
        iconStart="chevron-left"
        onClick={() => onPrevious("location")}
      >
        Previous
      </calcite-button>
      <calcite-button
        scale="l"
        slot="footer-end"
        iconEnd="chevron-right"
        onClick={() => {
          if (inputRef.current?.checkAllInputs()) {
            onNext("streetnames");
          }
        }}
      >
        Next
      </calcite-button>
    </calcite-panel>
  );
};

export default Details;
