import { useParams } from "react-router-dom";
import Navigation from "../Navigation/Navigation";
import useApplication from "../useApplication";
import useAuthentication from "../useAuthentication";
import useReview from "./useReview";
import { config } from "../config";
import ApplicationDetails from "../ApplicationDetails/ApplicationDetails";
import type { FormField } from "../types/types/types";
import "@esri/calcite-components/components/calcite-text-area";
import "@esri/calcite-components/components/calcite-chip";
import "@esri/calcite-components/components/calcite-chip-group";
import "@esri/calcite-components/components/calcite-block";
import "@esri/calcite-components/components/calcite-action";
import "@esri/calcite-components/components/calcite-action-bar";

import StreetNamesTable from "../StreetNamesTable/StreetNamesTable";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";

function Review() {
  const { graphic, streetNameGraphics, setStreetNameGraphics } =
    useStreetNameAppContext();

  const { submittalId } = useParams<{ submittalId: string }>();

  const { checkAuthentication } = useAuthentication();
  const { applicationLayer, updateStreetName } = useApplication({
    submittalId,
  });
  const {
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
  } = useReview({
    checkAuthentication,
    streetNameGraphics,
    setStreetNameGraphics,
    updateStreetName,
  });

  const fields = config.fields.contact
    .map((field: FormField) => field.name)
    .concat(config.fields.details.map((field: FormField) => field.name));

  if (!graphic) {
    return <calcite-scrim loading></calcite-scrim>;
  }
  return (
    <div id="review">
      <Navigation user={user}></Navigation>
      <calcite-panel className="review-panel">
        <div className="review">
          <div className="review-container">
            <ApplicationDetails
              layer={applicationLayer}
              fields={fields}
            ></ApplicationDetails>
          </div>
          <div className="review-container">
            <StreetNamesTable
              editable
              org={org}
              streetNameGraphics={streetNameGraphics}
              handleCommentsChanged={handleCommentsChanged}
              handleStreetNameChanged={handleStreetNameChanged}
              handleStreetTypeChanged={handleStreetTypeChanged}
              updateStreetStatus={updateStreetStatus}
              resetStreetStatus={resetStreetStatus}
            ></StreetNamesTable>
          </div>
        </div>
        {notice && (
          <div slot="content-bottom" className="notice-content">
            <calcite-notice
              open
              width="full"
              kind={notice.kind}
              icon={
                notice.kind === "danger"
                  ? "exclamation-mark-circle-f"
                  : notice.kind === "warning"
                  ? "exclamation-mark-triangle-f"
                  : notice.kind === "info"
                  ? "information"
                  : notice.kind === "success"
                  ? "check"
                  : undefined
              }
            >
              <div slot="title">{notice.heading}</div>

              <div slot="message">{notice.message}</div>
              {notice.action && (
                <calcite-action
                  slot="actions-end"
                  icon="submit"
                  text={notice.action}
                  text-enabled
                  onClick={() => handleReviewAction(notice.action, org)}
                ></calcite-action>
              )}
            </calcite-notice>
          </div>
        )}
        {/* <calcite-button disabled={isButtonDisabled} slot="footer-end" scale="l">
          Submit
        </calcite-button> */}
        <calcite-fab
          appearance="outline-fill"
          icon="user"
          slot="fab"
          text={`Impersonate ${org === "city" ? "County" : "City"}`}
          textEnabled
          onClick={impersonate}
        ></calcite-fab>
      </calcite-panel>
      <calcite-dialog
        open={dialog?.open}
        heading="Submission Successful"
        oncalciteDialogClose={() => location.reload()}
        modal
      >
        {dialog?.message}
      </calcite-dialog>
    </div>
  );
}

export default Review;
