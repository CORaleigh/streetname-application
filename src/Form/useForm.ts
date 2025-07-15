import { useState, useCallback } from "react";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";

const useForm = () => {
  const { applicationLayer, streetsTable, streetsLookupTable } =
    useStreetNameAppContext();
  const [activeSteps, setActiveSteps] = useState<string[]>([
    "intro",
    "contact",
  ]);
  const [submissionId, setSubmissionId] = useState<string>("");

  const onValid = useCallback((step: string, isValid: boolean) => {
    if (isValid) {
      setActiveSteps((prev) => [...prev, step]);
    } else {
      setActiveSteps((prev) =>
        prev.filter((activeStep) => activeStep !== step)
      );
    }
  }, []);

  const onSuccess = useCallback((globalId: string) => {
    setSubmissionId(globalId);
  }, []);

  const [selectedStep, setSelectedStep] = useState<string>("intro");

  return {
    applicationLayer,
    streetsTable,
    streetsLookupTable,
    selectedStep,
    setSelectedStep,
    activeSteps,
    onValid,
    onSuccess,
    submissionId,
  };
};

export default useForm;
