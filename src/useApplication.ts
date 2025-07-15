import { useEffect, useState } from "react";
import { useStreetNameAppContext } from "./Context/useStreetNameAppContext";

interface UseApplicationOptions {
  submittalId: string | undefined;
}

const useApplication = ({ submittalId }: UseApplicationOptions) => {
  const {
    graphic,
    setGraphic,
    applicationLayer,
    streetsTable,
    setStreetNameGraphics,
  } = useStreetNameAppContext();

  const [graphicLoaded, setGraphicLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (applicationLayer && submittalId && !graphicLoaded) {
      setGraphicLoaded(true);
      (async () => {
        const result = await applicationLayer.queryFeatures({
          where: `GlobalID = '${submittalId}'`,
          outFields: ["*"],
          returnGeometry: true,
        });
        if (result && result.features.length > 0) {
          const feature = result.features.at(0);

          if (!feature) return;

          setGraphic(feature);
          const oid = feature.getObjectId() as number;
          const relates = await applicationLayer.queryRelatedFeatures({
            relationshipId: 0,
            objectIds: [oid],
            outFields: ["*"],
          });
          if (relates[oid]) {
            setStreetNameGraphics(relates[oid].features);
          }
        }
      })();
    }
  }, [
    submittalId,
    applicationLayer,
    graphic,
    setGraphic,
    setStreetNameGraphics,
    graphicLoaded,
  ]);
  const updateStreetName = (streetName: __esri.Graphic) => {
    streetsTable.applyEdits({ updateFeatures: [streetName] });
  };

  return {
    updateStreetName,
    applicationLayer,
  };
};

export default useApplication;
