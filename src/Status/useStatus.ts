import {
  useState,
  useEffect,
  type SetStateAction,
  type Dispatch,
  useCallback,
} from "react";
import type { Notice, StreetName } from "../types/types/types";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";
import Graphic from "@arcgis/core/Graphic";

// Define any types for your hook's inputs and outputs
interface UseStatusOptions {
  setStreetNames: Dispatch<SetStateAction<StreetName[]>>;
  streetNameGraphics: __esri.Graphic[];
}

const useStatus = ({ streetNameGraphics }: UseStatusOptions) => {
  const { graphic, setStreetNames } = useStreetNameAppContext();

  const [notice, setNotice] = useState<Notice>();
  const [showStreetsForm, setShowStreetsForm] = useState<boolean>(false);

  const handleAdditionalStreetsClicked = useCallback(() => {
    const status = graphic?.getAttribute("status");
    const field =
      status === "City Rejected"
        ? "cityapproved"
        : status === "County Rejected"
        ? "countyapproved"
        : undefined;
    if (!field) return;

    const requested = graphic?.getAttribute("streetnamesneeded");
    const approved = streetNameGraphics.filter(
      (graphic) => graphic.getAttribute(field) === "Yes"
    ).length;
    const needed = requested - approved;
    const maxOrder =
      streetNameGraphics.length > 0
        ? Math.max(...streetNameGraphics.map((g) => g.getAttribute('streetorder'))) : 0; 
    setStreetNames(
      Array.from({ length: needed }, (_, index) => ({
        streetname: "",
        streettype: "",
        status: "invalid",
        message: "required",
        nameValid: false,
        typeValid: false,
        graphic: new Graphic(),
        order: maxOrder + 1 + index,
        id: crypto.randomUUID(),
      }))
    );

    setShowStreetsForm(true);
  }, [graphic, setStreetNames, streetNameGraphics]);
  useEffect(() => {
    if (!graphic) return;
    const status = graphic?.getAttribute("status");
    if (!status) return;
    const kind = status.includes("Approved")
      ? "success"
      : status.includes("Review")
      ? "warning"
      : status.includes("Rejected")
      ? "danger"
      : undefined;
    const message = status.includes("Approved")
      ? "Your street name application has been approved, please download your street name application below."
      : status.includes("Review")
      ? "Your application is currently being reviewed by staff."
      : status.includes("Rejected")
      ? "Your application has not been approved, you will need to submit additional street names."
      : "";
    const action = status.includes("Rejected")
      ? "Submit Additional Streets"
      : undefined;
    setNotice({
      heading: status,
      kind: kind,
      message: message,
      action: action,
    });
  }, [graphic]);

  const handleStreetsDialogClose = () => {
    setShowStreetsForm(false);
  };



  return {
    notice,
    handleAdditionalStreetsClicked,
    showStreetsForm,
    handleStreetsDialogClose,
  };
};

export default useStatus;
