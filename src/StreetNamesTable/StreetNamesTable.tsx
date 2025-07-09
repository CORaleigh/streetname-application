import React from "react";

//import useStreetNamesTable from "./useStreetNamesTable";
import type { TargetedEvent } from "@arcgis/map-components";
import { config } from "../config";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";

interface StreetNamesTableProps {
  editable?: boolean;
  streetNameGraphics: __esri.Graphic[];
  org?: "" | "city" | "county";
  updateStreetStatus?: (
    street: __esri.Graphic,
    approve: boolean
  ) => void;
  resetStreetStatus?: (street: __esri.Graphic) => "" | undefined;
  handleCommentsChanged?: (
    newValue: string,
    streetName: __esri.Graphic
  ) => void;
  handleStreetNameChanged?: (
    newValue: string,
    streetName: __esri.Graphic
  ) => void;
  handleStreetTypeChanged?: (
    newValue: string,
    streetName: __esri.Graphic
  ) => void;
}

const StreetNamesTable: React.FC<StreetNamesTableProps> = ({
  editable,
  streetNameGraphics,
  org,
  updateStreetStatus,
  resetStreetStatus,
  handleCommentsChanged,
  handleStreetNameChanged,
  handleStreetTypeChanged,
}) => {
  //  const {} = useStreetNamesTable({});
  const {  graphic } =
    useStreetNameAppContext();

  return (
    <calcite-block
      collapsible
      expanded
      heading="Street Names"
      description="submitted street names"
    >
      <calcite-table caption={"Street Names"} bordered layout="auto" numbered>
        <calcite-table-row slot="table-header">
          {editable && (
            <calcite-table-header
              heading=""
              className="number-cell"
            ></calcite-table-header>
          )}
          <calcite-table-header heading="Status"></calcite-table-header>

          <calcite-table-header heading="Name"></calcite-table-header>
          <calcite-table-header heading="Type"></calcite-table-header>
          <calcite-table-header heading="Comments"></calcite-table-header>

        </calcite-table-row>
        {streetNameGraphics.map((streetName: __esri.Graphic, i: number) => (
          <calcite-table-row
            key={`street-name-${i}`}
            disabled={
              org === "county" &&
              streetName.getAttribute("countyapproved") !== "Yes"  &&
              (streetNameGraphics.filter(
                (streetNameGraphic: __esri.Graphic) =>
                  streetNameGraphic.getAttribute("countyapproved") === "Yes"
              ).length >= graphic?.getAttribute("streetnamesneeded")) || streetName.getAttribute("cityapproved") === "No" || graphic?.getAttribute('status') === 'Approved'
                ? true
                : undefined 
            }
          >
            {editable &&
              updateStreetStatus &&
              updateStreetStatus &&
              resetStreetStatus && (
                <calcite-table-cell className="number-cell" alignment="center">
                  <calcite-action-bar layout="vertical" expandDisabled>
                    <calcite-action
                      icon="thumbs-up"
                      text="Approve"
                      onClick={() => updateStreetStatus(streetName, true)}
                    ></calcite-action>
                    <calcite-action
                      icon="thumbs-down"
                      text="Reject"
                      onClick={() => updateStreetStatus(streetName, false)}
                    ></calcite-action>
                    <calcite-action
                      icon="question"
                      text="Reset"
                      onClick={() => resetStreetStatus(streetName)}
                    ></calcite-action>
                  </calcite-action-bar>
                </calcite-table-cell>
              )}
            <calcite-table-cell>
              <calcite-chip-group label={"Status"}>
                <calcite-chip
                  icon={
                    streetName.getAttribute("cityapproved") === "Yes"
                      ? "check-circle"
                      : streetName.getAttribute("cityapproved") === "No"
                      ? "minus-circle"
                      : "question"
                  }
                  className={
                    streetName.getAttribute("cityapproved") === "Yes"
                      ? "approved"
                      : streetName.getAttribute("cityapproved") === "No"
                      ? "rejected"
                      : ""
                  }
                  label={"City"}
                >
                  City
                </calcite-chip>
                <calcite-chip
                  icon={
                    streetName.getAttribute("countyapproved") === "Yes"
                      ? "check-circle"
                      : streetName.getAttribute("countyapproved") === "No"
                      ? "minus-circle"
                      : "question"
                  }
                  className={
                    streetName.getAttribute("countyapproved") === "Yes"
                      ? "approved"
                      : streetName.getAttribute("countyapproved") === "No"
                      ? "rejected"
                      : ""
                  }
                  label={"County"}
                >
                  County
                </calcite-chip>
              </calcite-chip-group>
            </calcite-table-cell>
            <calcite-table-cell>
              {editable &&
                handleStreetNameChanged &&
                handleStreetTypeChanged && (
                  <calcite-input-text
                    scale="l"
                    value={streetName.getAttribute("streetname")}
                    oncalciteInputTextChange={(
                      event: TargetedEvent<HTMLCalciteInputTextElement, void>
                    ) =>
                      handleStreetNameChanged(event.target.value, streetName)
                    }
                  ></calcite-input-text>
                )}
              {!editable && streetName.getAttribute("streetname")}
            </calcite-table-cell>
            <calcite-table-cell>
              {editable && handleStreetTypeChanged && (
                <calcite-select
                  scale="l"
                  value={streetName.getAttribute("streettype")}
                  label={"Street Type"}
                  oncalciteSelectChange={(
                    event: TargetedEvent<HTMLCalciteSelectElement, void>
                  ) => handleStreetTypeChanged(event.target.value, streetName)}
                >
                  {config.allowedStreetTypes.map((streetType) => (
                    <calcite-option key={streetType} value={streetType}>
                      {streetType}
                    </calcite-option>
                  ))}
                </calcite-select>
              )}
              {!editable && streetName.getAttribute("streettype")}
            </calcite-table-cell>

            <calcite-table-cell>
              {editable && handleCommentsChanged && (
                <calcite-text-area
                  scale="l"
                  value={streetName.getAttribute("Comments")}
                  oncalciteTextAreaChange={(
                    event: TargetedEvent<HTMLCalciteTextAreaElement, void>
                  ) => handleCommentsChanged(event.target.value, streetName)}
                ></calcite-text-area>
              )}
              {!editable && streetName.getAttribute("Comments")}
            </calcite-table-cell>
          </calcite-table-row>
        ))}
      </calcite-table>
    </calcite-block>
  );
};

export default StreetNamesTable;
