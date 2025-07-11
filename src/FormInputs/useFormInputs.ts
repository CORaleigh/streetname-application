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
      const input = element.shadowRoot?.querySelector("input");
      const status = input?.checkValidity() ? "valid" : "invalid";
      if (formField.name === "phone") {
        const cleaned = element.value.replace(/[^0-9().\-\s]/g, "");

        // Update the input's value with cleaned text
        if (cleaned !== element.value) {
          element.value = cleaned;
        }
        element.value = formatPhoneNumber(element.value);
      }
      const message = input?.validity.patternMismatch
        ? formField.patternMessage
        : status === "invalid"
        ? input?.validationMessage
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
      let value: string | number = element.value;

      if (
        formField.field &&
        ["integer", "small-integer", "single", "long"].includes(
          formField.field.type
        )
      ) {
        value = parseInt(element.value);
        if (isNaN(value)) {
          value = 0;
        }
      }
      if (formField.field && formField.field.type === "double") {
        value = parseFloat(element.value);
        if (isNaN(value)) {
          value = 0.0;
        }
      }
      graphic.attributes[formField.name] = value;

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

  function formatPhoneNumber(value: string): string {
    // Keep only digits and allowed punctuation
    const cleaned = value.replace(/[^0-9().\-\s]/g, "");

    // Extract digits only for validation and formatting
    const digits = cleaned.replace(/\D/g, "");

    if (digits.length !== 10) return value; // return original if not 10 digits

    const areaCode = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const lineNumber = digits.slice(6, 10);

    return `(${areaCode}) ${prefix}-${lineNumber}`;
  }

  useImperativeHandle(ref, () => ({
    checkAllInputs,
  }));

  return {
    graphic,
    checkInput,
  };
};

export default useFormInput;
