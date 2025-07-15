import type Graphic from "@arcgis/core/Graphic";
import { useCallback, useEffect, useState } from "react";
import { type Dialog, type Notice } from "../types/types/types";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";
import { config } from "../config";

// Define any types for your hook's inputs and outputs
interface UseReviewOptions {
  checkAuthentication: () => Promise<__esri.PortalUser>;
  streetNameGraphics: Graphic[];
  setStreetNameGraphics: React.Dispatch<React.SetStateAction<Graphic[]>>;
  updateStreetName: (streetName: __esri.Graphic) => void;
}

const useReview = ({
  checkAuthentication,
  streetNameGraphics,
  setStreetNameGraphics,
  updateStreetName,
}: UseReviewOptions) => {
  const { graphic, applicationLayer, streetsTable, sendEmail } =
    useStreetNameAppContext();

  const [user, setUser] = useState<__esri.PortalUser>();
  const [org, setOrg] = useState<"city" | "county" | undefined>(undefined);

  const [notice, setNotice] = useState<Notice>();

  const [dialog, setDialog] = useState<Dialog>();

  useEffect(() => {
    if (!user) {
      (async () => {
        const result = await checkAuthentication();
        if (result) {
          setOrg(
            result.username.toLowerCase().includes("raleighnc.gov")
              ? "city"
              : result.username.toLowerCase().includes("wake.gov")
              ? "county"
              : undefined
          );
          setUser(result);
        }
      })();
    }
  }, [checkAuthentication, user]);

  const updateStreetStatus = useCallback(
    (street: __esri.Graphic, approve: boolean) => {
      const updatedGraphic = street.clone();
      updatedGraphic.attributes = {
        ...updatedGraphic.attributes,
        [`${org}approved`]: approve ? "Yes" : "No",
        status:
          approve && org === "city"
            ? "City Approved"
            : approve && org === "county"
            ? "County Approved"
            : !approve && org === "city"
            ? "City Rejected"
            : !approve && org === "county"
            ? "County Rejected"
            : "",
      };
      if (org === "city" && !approve) {
        updatedGraphic.setAttribute("countyapproved", "No");
      }
      updateStreetName(updatedGraphic);
      setStreetNameGraphics((prev) =>
        prev.map((g) =>
          g.attributes.OBJECTID === updatedGraphic.attributes.OBJECTID
            ? updatedGraphic
            : g
        )
      );
    },
    [org, setStreetNameGraphics, updateStreetName]
  );
  const resetStreetStatus = useCallback(
    (street: __esri.Graphic) => {
      const statusField =
        org === "city"
          ? "cityapproved"
          : org === "county"
          ? "countyapproved"
          : "";
      if (statusField === "") return statusField;
      const updatedGraphic = street.clone();
      updatedGraphic.attributes = {
        ...updatedGraphic.attributes,
        [statusField]: "",
      };
      updateStreetName(updatedGraphic);
      setStreetNameGraphics((prev) =>
        prev.map((g) =>
          g.attributes.OBJECTID === updatedGraphic.attributes.OBJECTID
            ? updatedGraphic
            : g
        )
      );
    },
    [org, setStreetNameGraphics, updateStreetName]
  );

  useEffect(() => {
    const approved = streetNameGraphics.filter(
      (streetName: Graphic) =>
        streetName.getAttribute(`${org}approved`) === "Yes"
    ).length;
    const reviewed = streetNameGraphics.filter(
      (streetName: Graphic) =>
        streetName.getAttribute(`${org}approved`) === "Yes" ||
        streetName.getAttribute(`${org}approved`) === "No"
    ).length;

    const needed = graphic?.getAttribute("streetnamesneeded");
    let reviewNotice: Notice;

    if (org === "city" && reviewed < streetNameGraphics.length) {
      reviewNotice = {
        heading: `All Street Needs Need Reviewed`,
        message: `Only ${reviewed} of ${streetNameGraphics.length} street names have been reviewed`,
        action: undefined,
        kind: "danger",
      };
      setNotice(reviewNotice);
    }
    if (
      org === "city" &&
      reviewed === streetNameGraphics.length &&
      approved >= needed
    ) {
      reviewNotice = {
        heading: `Street Names Approved`,
        message: `Enough street names have been approved`,
        action: "Send to County",
        kind: "success",
      };
      setNotice(reviewNotice);
    }
    if (
      org === "city" &&
      reviewed === streetNameGraphics.length &&
      approved < needed
    ) {
      reviewNotice = {
        heading: `Not Enough Street Names Approved`,
        message: `Only ${approved} of ${needed} the needed street names have been approved, at least ${
          needed - approved
        } more needed from applicant.`,
        action: "Request More Names",
        kind: "danger",
      };
      setNotice(reviewNotice);
    }
    if (org === "county" && approved < needed) {
      reviewNotice = {
        heading: `Not Enough Street Names Approved`,
        message: `Only ${approved} of ${needed} the needed street names have been approved, at least ${
          needed - approved
        } more needed from applicant.`,
        action: "Request More Names",
        kind: "danger",
      };
      setNotice(reviewNotice);
    }
    if (org === "county" && approved >= needed) {
      reviewNotice = {
        heading: `Street Names Approved`,
        message: `The number of street names requested has been met, application can be approved.`,
        action: "Approve",
        kind: "success",
      };
      setNotice(reviewNotice);
    }
    if (org === "city" && graphic?.getAttribute("status") === "County Review") {
      reviewNotice = {
        heading: `County Review`,
        message: `This application is being reviewed by the County`,
        kind: "success",
      };
      setNotice(reviewNotice);
    }

    if (graphic?.getAttribute("status") === "Approved") {
      reviewNotice = {
        heading: `Street Names Approved`,
        message: `This application has already been approved`,
        kind: "success",
      };
      setNotice(reviewNotice);
    }
  }, [graphic, org, streetNameGraphics]);

  const handleCommentsChanged = (
    newValue: string,
    streetName: __esri.Graphic
  ) => {
    const updatedGraphic = streetName.clone();
    updatedGraphic.attributes = {
      ...updatedGraphic.attributes,
      Comments: newValue,
    };
    updateStreetName(updatedGraphic);
    setStreetNameGraphics((prev) =>
      prev.map((g) =>
        g.attributes.OBJECTID === updatedGraphic.attributes.OBJECTID
          ? updatedGraphic
          : g
      )
    );
  };
  const handleStreetNameChanged = (
    newValue: string,
    streetName: __esri.Graphic
  ) => {
    const updatedGraphic = streetName.clone();
    updatedGraphic.attributes = {
      ...updatedGraphic.attributes,
      streetname: newValue,
    };
    updateStreetName(updatedGraphic);
    setStreetNameGraphics((prev) =>
      prev.map((g) =>
        g.attributes.OBJECTID === updatedGraphic.attributes.OBJECTID
          ? updatedGraphic
          : g
      )
    );
  };
  const handleStreetTypeChanged = (
    newValue: string,
    streetName: __esri.Graphic
  ) => {
    const updatedGraphic = streetName.clone();
    updatedGraphic.attributes = {
      ...updatedGraphic.attributes,
      streettype: newValue,
    };
    updateStreetName(updatedGraphic);
    setStreetNameGraphics((prev) =>
      prev.map((g) =>
        g.attributes.OBJECTID === updatedGraphic.attributes.OBJECTID
          ? updatedGraphic
          : g
      )
    );
  };

  const handleReviewAction = async (
    action:
      | "Approve"
      | "Request More Names"
      | "Send to County"
      | "Submit Additional Streets"
      | undefined,
    org: "city" | "county" | undefined
  ) => {
    if (!graphic) return;
    if (action === "Send to County") {
      graphic?.setAttribute("status", "County Review");
      setDialog({
        open: true,
        heading: "Application Sent to County",
        message:
          "Street names have been reviewed by the City, County staff will receive an email with a link to review the application.",
      });

      sendEmail(config.flows.cityApproved, graphic.getAttribute("GlobalID"));
    }
    if (action === "Approve") {
      graphic?.setAttribute("status", "Approved");
    }
    if (action === "Request More Names") {
      graphic?.setAttribute(
        "status",
        `${org === "city" ? "City" : org === "county" ? "County" : ""} Rejected`
      );

      sendEmail(config.flows.rejected, graphic.getAttribute("GlobalID"));
      setDialog({
        open: true,
        heading: "More Street Names Requested",
        message:
          "Applicant will receive an email with a link to add additional street names to the application, once submitted, the application will go back to the City for review.",
      });
    }
    await applicationLayer.applyEdits({ updateFeatures: [graphic] });
    if (action === "Approve") {
      const notNeeded = streetNameGraphics.filter(
        (graphic: __esri.Graphic) =>
          graphic.getAttribute("countyapproved") === "" ||
          graphic.getAttribute("countyapproved") === null
      );

      notNeeded.forEach((graphic: __esri.Graphic) => {
        graphic.setAttribute("status", "Not Needed");
        graphic.setAttribute("notused", "Yes");
      });
      const rejected = streetNameGraphics.filter(
        (graphic: __esri.Graphic) =>
          graphic.getAttribute("countyapproved") === "No"
      );
      rejected.forEach((graphic: __esri.Graphic) => {
        graphic.setAttribute("status", "County Rejected");
      });
      await streetsTable.applyEdits({ updateFeatures: notNeeded });
      await streetsTable.applyEdits({ updateFeatures: rejected });
      setDialog({
        open: true,
        heading: "Application Approved",
        message:
          "Application has been approved, City staff will receive the approved street name application document to send to the applicant.",
      });
      sendEmail(config.flows.countyApproved, graphic.getAttribute("GlobalID"));
    }
  };

  const impersonate = () => {
    setOrg((prev) => (prev === "city" ? "county" : "city"));
  };
  return {
    user,
    org,
    notice,
    updateStreetStatus,
    resetStreetStatus,
    handleCommentsChanged,
    handleStreetNameChanged,
    handleStreetTypeChanged,
    handleReviewAction,
    dialog,
    impersonate,
  };
};

export default useReview;
