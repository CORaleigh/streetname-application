import { useState, useEffect, useRef } from "react";
import type { FormInputsRef } from "../FormInputs/FormInputs";
import type { FormField } from "../types/types/types";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import type { TargetedEvent } from "@arcgis/map-components";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";

// Define any types for your hook's inputs and outputs
interface UseDetailsOptions {
  formFields: FormField[];
  layer: FeatureLayer;
  onValid: (step: string, isValid: boolean) => void;
}

const useDetails = ({ formFields, layer, onValid }: UseDetailsOptions) => {
  const { setAttachments } = useStreetNameAppContext();

  const [fieldsLoaded, setFieldsLoaded] = useState<boolean>(false);
  const [fields, setFields] = useState<FormField[]>(formFields);
  const inputRef = useRef<FormInputsRef>(null);

  const handleFileInput = (
    event: TargetedEvent<HTMLCalciteInputElement, void>
  ) => {
    if (event.target.files) {
      if (event.target.files.length > 0) {
        const file = event.target.files?.[0];
        if (file) {
          setAttachments((prev) => [...prev, file]);
        }
      }
    }
  };
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
    onValid("streetnames", invalidFields.length === 0);
  }, [fields, onValid]);

  return { inputRef, fieldsLoaded, fields, setFields, handleFileInput };
};

export default useDetails;
