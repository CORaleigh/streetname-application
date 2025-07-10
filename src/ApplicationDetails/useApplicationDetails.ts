import { useCallback, useEffect, useRef } from "react";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";
import type { TargetedEvent } from "@arcgis/map-components";
import { useCalciteBreakpoint } from "../useCalciteBreakpoints";

const useApplicationDetails = () => {
  const { graphic } = useStreetNameAppContext();
  const breakpoint = useCalciteBreakpoint();

  const detailsMap = useRef<HTMLArcgisMapElement | null>(null);
  function disableZooming(view: __esri.MapView) {
    // Removes the zoom action on the popup

    // stops propagation of default behavior when an event fires
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function stopEvtPropagation(event: any) {
      event.stopPropagation();
    }

    // exlude the zoom widget from the default UI
    view.ui.components = ["attribution"];

    // disable mouse wheel scroll zooming on the view
    view.on("mouse-wheel", stopEvtPropagation);

    // disable zooming via double-click on the view
    view.on("double-click", stopEvtPropagation);

    // disable zooming out via double-click + Control on the view
    view.on("double-click", ["Control"], stopEvtPropagation);

    // disables pinch-zoom and panning on the view
    view.on("drag", stopEvtPropagation);

    // disable the view's zoom box to prevent the Shift + drag
    // and Shift + Control + drag zoom gestures.
    view.on("drag", ["Shift"], stopEvtPropagation);
    view.on("drag", ["Shift", "Control"], stopEvtPropagation);

    // prevents zooming with the + and - keys
    view.on("key-down", (event) => {
      const prohibitedKeys = [
        "+",
        "-",
        "Shift",
        "_",
        "=",
        "ArrowUp",
        "ArrowDown",
        "ArrowRight",
        "ArrowLeft",
      ];
      const keyPressed = event.key;
      if (prohibitedKeys.indexOf(keyPressed) !== -1) {
        event.stopPropagation();
      }
    });

    return view;
  }
  const handleViewReady = (
    event: TargetedEvent<HTMLArcgisMapElement, void>
  ) => {
    event.target.goTo({ target: graphic, zoom: 14 });
    if (breakpoint === "xxs" || breakpoint === "xs") {
      const view = event.target.view;
      disableZooming(view);
    }
  };
  const addPin = useCallback(() => {
    if (!graphic || !detailsMap.current) return;
    graphic.symbol = {
      type: "picture-marker",
      url: "./assets/pin.svg",
      height: 24,
      width: 24,
      yoffset: 12,
    };
    detailsMap.current.graphics.removeAll();
    detailsMap.current.graphics.add(graphic);
  }, [graphic]);

  useEffect(() => {
    if (graphic) {
      addPin();
    }
  }, [addPin, graphic]);
  return {
    detailsMap,
    handleViewReady,
  };
};

export default useApplicationDetails;
