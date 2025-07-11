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
      <calcite-label>
        Upload Supporting Documents
        <calcite-input
          type="file"
          accept=".pdf"
          oncalciteInputChange={handleFileInput}
        ></calcite-input>
              <calcite-notice title="File Upload Notice" open width="full" kind="info" icon="information-f"> 
        <div slot="message">
          Please upload a PDF file that shows the streets for your project.  Do not upload an entire plan set, just a page showing the streets.
        </div>
      </calcite-notice>
      </calcite-label>

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
