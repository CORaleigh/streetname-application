import { useState, useEffect, useRef } from "react";
import type { FormInputsRef } from "../FormInputs/FormInputs";
import type { FormField } from "../types/types/types";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import useLocalStorage from "../useLocalStorage";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";

// Define any types for your hook's inputs and outputs
interface UseContactOptions {
  formFields: FormField[];
  layer: FeatureLayer;
  onValid: (step: string, isValid: boolean) => void;
}

const useContact = ({ formFields, layer, onValid }: UseContactOptions) => {
  const { graphic } = useStreetNameAppContext();
  const [fieldsLoaded, setFieldsLoaded] = useState<boolean>(false);
  const [fields, setFields] = useState<FormField[]>(formFields);
  const inputRef = useRef<FormInputsRef>(null);
  const [, setContact] = useLocalStorage<string>("street_app_contact", "");
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
  }, [fields, formFields, onValid, setContact]);

  useEffect(() => {
    const obj: { [x: string]: string } = {};

    formFields.forEach((field: FormField) => {
      obj[field.name] = graphic?.getAttribute(field.name);
    });

    setContact(JSON.stringify(obj));
  }, [formFields, graphic, setContact]);

  return { inputRef, fieldsLoaded, fields, setFields };
};

export default useContact;
