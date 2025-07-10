import React from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import type { FormField } from "../types/types/types";
import useContact from "./useContact";
import FormInputs from "../FormInputs/FormInputs";

interface ContactProps {
  formFields: FormField[];
  layer: FeatureLayer;
  onNext: (step: string) => void;
  onPrevious: (step: string) => void;
  onValid: (step: string, isValid: boolean) => void;
}

const Contact: React.FC<ContactProps> = ({
  formFields,
  layer,
  onNext,
  onPrevious,
  onValid,
}) => {
  const { inputRef, fieldsLoaded, fields, setFields } = useContact({
    formFields,
    layer,
    onValid
  });
  return (
    <calcite-panel>
      {/* <form onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
      }}> */}
        {fieldsLoaded && (
          <FormInputs ref={inputRef} fields={fields} setFields={setFields} />
        )}
        <calcite-button
          scale="l"
          slot="footer-start"
          iconStart="chevron-left"
          onClick={() => onPrevious("intro")}
        >
          Previous
        </calcite-button>
        <calcite-button
          scale="l"
          type="submit"
          slot="footer-end"
          iconEnd="chevron-right"
          onClick={() => {
            if (inputRef.current?.checkAllInputs()) {
              onNext("location");
            }
          }}
        >
          Next
        </calcite-button>
      {/* </form> */}
    </calcite-panel>
  );
};

export default Contact;
