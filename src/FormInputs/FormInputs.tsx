import React, { forwardRef } from "react";
import type { TargetedEvent } from "@arcgis/map-components";
import type { FormField } from "../types/types/types";
import useFormInput from "./useFormInputs";

interface FormInputsProps {
  fields: FormField[];
  setFields: React.Dispatch<React.SetStateAction<FormField[]>>;
}

export interface FormInputsRef {
  checkAllInputs: () => void;
}

const FormInputs = forwardRef<FormInputsRef, FormInputsProps>(
  ({ fields, setFields }, ref) => {
    const { graphic, checkInput } = useFormInput({ fields, setFields, ref });

    return (
      <>
        {fields.map((formField: FormField) => {
          const field = formField.field;

          if (!field) return null;
          return (
            <calcite-label key={field.name}>
              {field.alias ? field.alias : field.name}
              {[
                "double",
                "integer",
                "small-integer",
                "single",
                "long",
              ].includes(field.type) && (
                <calcite-input-number
                  name={formField.name}
                  scale="l"
                  value={graphic?.getAttribute(formField.name).toString()}
                  required={formField.required ? true : undefined}
                  validationMessage={formField.message}
                  validationIcon="exclamation-mark-circle-f"
                  min={1}
                  status={formField.status}
                  oncalciteInputNumberInput={(
                    event: TargetedEvent<HTMLCalciteInputNumberElement, void>
                  ) => {
                    checkInput(event.target, formField);
                  }}
                ></calcite-input-number>
              )}
              {["string"].includes(field.type) && (
                <calcite-input-text
                  name={formField.name}
                  scale="l"
                  maxLength={field.length ? field.length : undefined}
                  pattern={formField.pattern ? formField.pattern : undefined}
                  status={formField.status}
                  required={formField.required ? true : undefined}
                  validationMessage={formField.message}
                  validationIcon="exclamation-mark-circle-f"
                  value={graphic?.getAttribute(formField.name)}
                  type={formField.type}
                  placeholder={formField.placeholder}
                  oncalciteInputTextInput={(
                    event: TargetedEvent<HTMLCalciteInputTextElement, void>
                  ) => {
                    checkInput(event.currentTarget, formField);
                  }}
                ></calcite-input-text>
              )}
            </calcite-label>
          );
        })}
      </>
    );
  }
);

export default FormInputs;
