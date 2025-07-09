import { useRef } from "react";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";
import type { TargetedEvent } from "@arcgis/map-components";

const useApplicationDetails = () => {
  const { graphic } = useStreetNameAppContext();

  const detailsMap = useRef<HTMLArcgisMapElement | null>(null);

  const handleViewReady = (
    event: TargetedEvent<HTMLArcgisMapElement, void>
  ) => {
    event.target.goTo({target: graphic, zoom: 14});
  };
  return {
    detailsMap,
    handleViewReady
  };
};

export default useApplicationDetails;
