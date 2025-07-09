import { useState, useEffect, useRef } from "react";
import type { FormInputsRef } from "../FormInputs/FormInputs";
import type { FormField } from "../types/types/types";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";

// Define any types for your hook's inputs and outputs
interface UseContactOptions {
  formFields: FormField[];
  layer: FeatureLayer;
  onValid: (step: string, isValid: boolean) => void;
}

const useContact = ({ formFields, layer, onValid }: UseContactOptions) => {
  const [fieldsLoaded, setFieldsLoaded] = useState<boolean>(false);
  const [fields, setFields] = useState<FormField[]>(formFields);
  const inputRef = useRef<FormInputsRef>(null);
  useEffect(() => {
    if (!layer.loaded) return;
    formFields.forEach((formField: FormField) => {
      formField.field = layer.fields.find(
        (field: __esri.Field) => field.name === formField.name
      );
    });
    setFieldsLoaded(true);
  }, [formFields, layer]);

  useEffect(() => {
    const invalidFields = fields.filter(
      (field: FormField) => field.status !== "valid"
    );
    onValid("location", invalidFields.length === 0);
  }, [fields, onValid]);

  return { inputRef, fieldsLoaded, fields, setFields };
};

export default useContact;
