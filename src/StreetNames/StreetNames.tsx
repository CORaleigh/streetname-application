import React from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import type { TargetedEvent } from "@arcgis/map-components";

import type { StreetName } from "../types/types/types";
import useStreetNames from "./useStreetNames";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";

interface StreetNamesProps {
  streetsLookupTable: FeatureLayer;
  allowedStreetTypes: string[];
  onNext?: (step: string) => void;
  onPrevious?: (step: string) => void;
  onValid?: (step: string, isValid: boolean) => void;
}

const StreetNames: React.FC<StreetNamesProps> = ({
  streetsLookupTable,
  allowedStreetTypes,
  onNext,
  onPrevious,
  onValid,
}) => {
  const { streetsTable, streetNames } = useStreetNameAppContext();

  const {
    validStreetsCount,
    minStreetNameCount,
    handleStreetNameInput,
    handleStreetTypeSelect,
    deleteStreet,
    addStreet,
    submitAdditionalStreets,
    handleListOrderChange,
    handleAddedDialogClosed,
    showAdditionalStreetsAdded,
  } = useStreetNames({ streetsLookupTable, streetsTable, onValid });

  return (
    <>
      <calcite-panel id="streetname-panel">
        {validStreetsCount < minStreetNameCount && (
          <calcite-notice
            open
            width="full"
            kind="danger"
            icon="exclamation-mark-circle-f"
          >
            <div slot="message">
              {`${
                minStreetNameCount - validStreetsCount
              } more valid street names needed`}
            </div>
          </calcite-notice>
        )}
        {validStreetsCount - minStreetNameCount === 0 && (
          <calcite-notice
            open
            width="full"
            kind="warning"
            icon="exclamation-mark-triangle-f"
          >
            <div slot="message">
              {`It is recommended to include more street names than needed`}
            </div>
          </calcite-notice>
        )}

        <form>
          <calcite-list
            label={"street names"}
            selectionMode="none"
            dragEnabled
            oncalciteListOrderChange={handleListOrderChange}
          >
            {/* <calcite-list-item dragDisabled disabled>
              <div slot="content">
                <div className="street-inputs">
                  <div className="street-name-header">
                    <calcite-label>Street Name</calcite-label>
                  </div>
                  <div className="street-type-header">
                    <calcite-label>Street Type</calcite-label>
                  </div>
                </div>
              </div>
            </calcite-list-item> */}
            {streetNames
              .sort((a, b) => a.order - b.order)
              .map((street: StreetName, i: number) => (
                <calcite-list-item id={street.id} key={street.id}>
                  <div slot="content-start">
                    <h3>{street.order}</h3>
                  </div>

                  <div slot="content">
                    <div className="street-inputs">
                      <calcite-label className="street-name-label">
                        Street Name
                        <calcite-input-text
                          scale="l"
                          value={street.streetname}
                          status={street.nameValid ? "valid" : "invalid"}
                          validationMessage={street.message}
                          validationIcon="exclamation-mark-circle-f"
                          oncalciteInputTextInput={(
                            e: TargetedEvent<HTMLCalciteInputTextElement, void>
                          ) => handleStreetNameInput(e.target, street, i)}
                        ></calcite-input-text>
                        {street.status === "valid" &&
                          street.message.length > 0 && (
                            <calcite-input-message
                              className="warning-message"
                              icon="exclamation-mark-triangle-f"
                              status={street.status}
                            >
                              {street.message}
                            </calcite-input-message>
                          )}
                      </calcite-label>
                      <calcite-label className="street-type-label">
                        Street Type
                        <calcite-select
                          scale="l"
                          label={"street type"}
                          value={street.streettype}
                          status={street.typeValid ? "valid" : "invalid"}
                          validationMessage="required"
                          validationIcon="exclamation-mark-circle-f"
                          placeholder="Select type"
                          oncalciteSelectChange={async (
                            e: TargetedEvent<HTMLCalciteSelectElement, void>
                          ) => handleStreetTypeSelect(e.target, street, i)}
                        >
                          <calcite-option value=""> </calcite-option>
                          {allowedStreetTypes.map((streetType: string) => (
                            <calcite-option key={streetType} value={streetType}>
                              {streetType}
                            </calcite-option>
                          ))}
                        </calcite-select>
                      </calcite-label>
                    </div>
                  </div>
                  <div slot="actions-end">
                    <calcite-action
                      icon="trash"
                      text={"delete"}
                      onClick={() => deleteStreet(i)}
                    ></calcite-action>
                  </div>
                </calcite-list-item>
              ))}
          </calcite-list>
        </form>
        <calcite-fab
          slot="fab"
          icon="plus"
          label="Add street"
          text="Add street"
          textEnabled
          scale="l"
          onClick={() => addStreet()}
        ></calcite-fab>
        {onPrevious && (
          <calcite-button
            scale="l"
            slot="footer-start"
            iconStart="chevron-left"
            onClick={() => onPrevious("details")}
          >
            Previous
          </calcite-button>
        )}
        {onNext && (
          <calcite-button
            disabled={validStreetsCount < minStreetNameCount ? true : undefined}
            scale="l"
            slot="footer-end"
            iconEnd="chevron-right"
            onClick={() => onNext("submit")}
          >
            Next
          </calcite-button>
        )}
        {/* {onNext && (
          <calcite-button
            disabled={validStreetsCount < minStreetNameCount ? true : undefined}
            scale="l"
            slot="footer-end"
            iconEnd="chevron-right"
            onClick={() => onNext("submit")}
          >
            Submit
          </calcite-button>
        )} */}
        {!onNext && (
          <calcite-button
            disabled={
              validStreetsCount < minStreetNameCount ||
              streetNames.filter((streetName) => streetName.status !== "valid")
                .length > 0
                ? true
                : undefined
            }
            scale="l"
            slot="footer-end"
            iconEnd="chevron-right"
            //onClick={() => onNext("submit")}
            onClick={submitAdditionalStreets}
          >
            Submit
          </calcite-button>
        )}
      </calcite-panel>
      <calcite-dialog
        open={showAdditionalStreetsAdded}
        heading="Street Names Added"
        oncalciteDialogClose={handleAddedDialogClosed}
      >
        Thank you for submitting additional street names, City staff will review
        the newly added names.
      </calcite-dialog>
    </>
  );
};

export default StreetNames;
