import React from "react";
import "@esri/calcite-components/components/calcite-link";
import { config } from "../config";
interface IntroProps {
  open: boolean;
  onClose: () => void;
}

const StreetRulesDialog: React.FC<IntroProps> = ({ open, onClose }) => {
  return (
    <calcite-dialog
      open={open}
      heading="Street Naming Rules"
      oncalciteDialogClose={onClose}
      modal
    >
      <calcite-list
        label={"Street Rules"}
        interactionMode="static"
        numberingSystem="arab"
      >
        {config.rules.map((rule, i) => (
          <calcite-list-item key={rule} label={rule}>
            <div slot="content-start">{i + 1}. </div>
          </calcite-list-item>
        ))}
      </calcite-list>
    </calcite-dialog>
  );
};

export default StreetRulesDialog;
