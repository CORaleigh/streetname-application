import React from "react";
import "@esri/calcite-components/components/calcite-link";
import "@esri/calcite-components/components/calcite-notice";

import useIntro from "./useIntro";
import StreetRulesDialog from "./StreetRulesDialog";
import StreetTypesDialog from "./StreetTypesDialog";
interface IntroProps {
  onNext: (step: string) => void;
}

const Intro: React.FC<IntroProps> = ({ onNext }) => {
  const { visibleDialog, setVisibleDialog, showDialogClicked } = useIntro();
  return (
    <>
      <calcite-panel>
        After submitting a street name application, City staff will review each
        of the street names submitted. If not enough street names are approved,
        you will receive an email asking for additional street names to be
        submitted. After the City has approved the application, County staff
        will perform a final review. <p />
        Once approved by the County, you will receive a copy with a digital
        signature. City and County staff will determine whether the names
        submitted in this application are acceptable.
        <p />
        Please follow our street naming rules when selecting your possible road
        names:
        <p />
        <calcite-button
          scale="l"
          width="auto"
          appearance="outline-fill"
          onClick={() => showDialogClicked("rules")}
        >
          View Street Name Rules
        </calcite-button>
        <p />
        The following street type definitions should be used when selecting
        possible street names to better the chances of submitting an approvable
        street name:
        <p />
        <calcite-button
          scale="l"
          width="auto"
          appearance="outline-fill"
          onClick={() => showDialogClicked("types")}
        >
          View Street Types
        </calcite-button>
        <p />
        Have questions? Addressing staff is available at{" "}
        <calcite-link
          iconStart="envelope"
          href="mailto:RaleighAddressing@raleighnc.gov"
        >
          RaleighAddress@raleighnc.gov
        </calcite-link>
        <p />
        For more information, please visit our page on the City website:
        <calcite-link
          iconStart="link"
          href="https://raleighnc.gov/permits/services/new-street-names"
        >
          New Street Names
        </calcite-link>
        <p />
        Have you read and agree to the follow these guidelines?
        <p />
        <calcite-button
          slot="footer-start"
          scale="l"
          iconStart="check"
          onClick={() => onNext("contact")}
        >
          I Agree
        </calcite-button>
      </calcite-panel>
      <StreetRulesDialog
        open={visibleDialog === "rules"}
        onClose={() => setVisibleDialog(undefined)}
      ></StreetRulesDialog>
      <StreetTypesDialog
        open={visibleDialog === "types"}
        onClose={() => setVisibleDialog(undefined)}
      ></StreetTypesDialog>
    </>
  );
};

export default Intro;
