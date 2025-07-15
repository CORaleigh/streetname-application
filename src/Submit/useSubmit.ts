import type { StreetName } from "../types/types/types";
import Graphic from "@arcgis/core/Graphic";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { useState } from "react";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";
import { config } from "../config";

// Define any types for your hook's inputs and outputs
interface UseSubmitOptions {
  layer: FeatureLayer;
  streetsTable: FeatureLayer;
  onSuccess: (globalId: string) => void;
}

const useSubmit = ({
  layer,
  streetsTable,

  onSuccess,
}: UseSubmitOptions) => {
  const { graphic, streetNames, attachments, sendEmail } =
    useStreetNameAppContext();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitApplication = async () => {
    if (!graphic) return;
    setSubmitting((prev) => !prev);
    graphic.setAttribute("status", "City Review");

    const result = await layer.applyEdits({ addFeatures: [graphic] });
    if (result.addFeatureResults.length > 0) {
      const addedFeature = result.addFeatureResults[0];
      if (addedFeature.error) return;
      if (!addedFeature.globalId) return;
      const streetGraphics: __esri.Graphic[] = streetNames.map(
        (streetName: StreetName) =>
          new Graphic({
            attributes: {
              streetname: streetName.streetname,
              streettype: streetName.streettype,
              applicationid: addedFeature.globalId,
              status: "City Review",
              streetorder: streetName.order,
            },
          })
      );
      const streetResult = await streetsTable.applyEdits({
        addFeatures: streetGraphics,
      });
      console.log(streetResult);

      attachments.forEach(async (attachment: File) => {
        const formData = new FormData();
        formData.append("attachment", attachment);
        console.log(
          await layer.addAttachment(
            new Graphic({
              attributes: {
                OBJECTID: addedFeature.objectId,
                GlobalId: addedFeature.globalId,
              },
            }),
            formData
          )
        );
      });
      onSuccess(addedFeature.globalId.toLowerCase() as string);
      sendEmail(config.flows.submitted, addedFeature.globalId.toLowerCase());
    }
    setSubmitting((prev) => !prev);
    setSubmitted(true);
  };
  return {
    submitApplication,
    submitting,
    submitted,
  };
};

export default useSubmit;
