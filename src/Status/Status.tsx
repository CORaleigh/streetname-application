import { useParams } from "react-router-dom";
import Navigation from "../Navigation/Navigation";
import useApplication from "../useApplication";
import { config } from "../config";
import useStatus from "./useStatus";
import StreetNamesTable from "../StreetNamesTable/StreetNamesTable";
import ApplicationDetails from "../ApplicationDetails/ApplicationDetails";
import type { FormField } from "../types/types/types";
import StreetNames from "../StreetNames/StreetNames";
import useForm from "../Form/useForm";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";

function Status() {
  const {
    graphic,
    setStreetNames,
    loaded,
    streetNameGraphics,
    applicationLayer,
  } = useStreetNameAppContext();

  const { submittalId } = useParams<{ submittalId: string }>();

  useApplication({
    submittalId,
  });
  const { streetsLookupTable } = useForm();
  const {
    notice,
    handleAdditionalStreetsClicked,
    showStreetsForm,
    handleStreetsDialogClose,
  } = useStatus({
    setStreetNames,
    streetNameGraphics,
  });

  const fields = config.fields.contact
    .map((field: FormField) => field.name)
    .concat(config.fields.details.map((field: FormField) => field.name));
  if (!loaded) {
    return <calcite-scrim loading></calcite-scrim>;
  }
  return (
    <>
      <Navigation></Navigation>

      {notice && (
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
              onClick={handleAdditionalStreetsClicked}
            ></calcite-action>
          )}
        </calcite-notice>
      )}
      {graphic && (
        <ApplicationDetails
          layer={applicationLayer}
          fields={fields}
        ></ApplicationDetails>
      )}
      <StreetNamesTable
        streetNameGraphics={streetNameGraphics}
      ></StreetNamesTable>
      <calcite-dialog
        open={showStreetsForm}
        heading="Submit Additional Streets"
        oncalciteDialogClose={handleStreetsDialogClose}
        modal
      >
        <StreetNames
          streetsLookupTable={streetsLookupTable}
          allowedStreetTypes={config.allowedStreetTypes}
        ></StreetNames>
      </calcite-dialog>
    </>
  );
}

export default Status;
