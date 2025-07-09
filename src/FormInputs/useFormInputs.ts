import { useCallback, useImperativeHandle } from "react";
import type { FormField } from "../types/types/types";
import type { FormInputsRef } from "./FormInputs";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";

// Define any types for your hook's inputs and outputs
interface UseFormInputOptions {
  fields: FormField[];
  setFields: React.Dispatch<React.SetStateAction<FormField[]>>;
  ref: React.ForwardedRef<FormInputsRef>;
}

const useFormInput = ({ fields, setFields, ref }: UseFormInputOptions) => {
  const { graphic, setGraphic } = useStreetNameAppContext();

  const checkInput = useCallback(
    (
      element: HTMLCalciteInputTextElement | HTMLCalciteInputNumberElement,
      formField: FormField
    ) => {
      if (!graphic) return;

      const status =
        (element.required && element.value.length === 0) ||
        ((element.required || element.value.length > 0) &&
          formField.pattern &&
          !element.value.match(formField.pattern))
          ? "invalid"
          : "valid";
      const message =
        element.required && element.value.length === 0
          ? "field is required"
          : formField.pattern && !element.value.match(formField.pattern)
          ? formField.patternMessage
          : undefined;
      setFields((prevFields) =>
        prevFields.map((f) =>
          f.name === formField.name
            ? {
                ...f,
                status: status,
                message: message,
              }
            : f
        )
      );
      graphic.attributes[formField.name] = element.value;
      setGraphic(graphic.clone());
      return status;
    },
    [graphic, setFields, setGraphic]
  );

  const checkAllInputs = () => {
    let valid = true;
    fields.forEach((field: FormField) => {
      let element = document.querySelector(
        `calcite-input-text[name="${field.name}"]`
      ) as HTMLCalciteInputTextElement;
      if (!element) {
        element = document.querySelector(
          `calcite-input-number[name="${field.name}"]`
        ) as HTMLCalciteInputTextElement;
      }
      if (checkInput(element, field) === "invalid") {
        valid = false;
      }
    });
    return valid;
  };

  useImperativeHandle(ref, () => ({
    checkAllInputs,
  }));

  return {
    graphic,
    checkInput,
  };
};

export default useFormInput;
