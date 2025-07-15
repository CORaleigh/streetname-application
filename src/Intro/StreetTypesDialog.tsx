import React from "react";
import "@esri/calcite-components/components/calcite-link";
import { config } from "../config";
interface IntroProps {
  open: boolean;
  onClose: () => void;
}

const StreetTypesDialog: React.FC<IntroProps> = ({ open, onClose }) => {
  return (
    <calcite-dialog
      open={open}
      heading="Street Types"
      oncalciteDialogClose={onClose}
      modal
    >
      <calcite-list label={"Street Types"} interactionMode="static">
        {config.streetTypes.map((streetType) => (
          <calcite-list-item
            key={streetType.types}
            label={streetType.types}
            description={streetType.description}
          ></calcite-list-item>
        ))}
      </calcite-list>
    </calcite-dialog>
  );
};

export default StreetTypesDialog;
