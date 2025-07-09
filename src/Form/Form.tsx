import "@esri/calcite-components/components/calcite-shell";
import "@esri/calcite-components/components/calcite-panel";

import "@esri/calcite-components/components/calcite-navigation";
import "@esri/calcite-components/components/calcite-navigation-logo";
import "@esri/calcite-components/components/calcite-navigation-user";
import "@esri/calcite-components/components/calcite-stepper";
import "@esri/calcite-components/components/calcite-stepper-item";
import "@esri/calcite-components/components/calcite-scrim";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-input";
import "@esri/calcite-components/components/calcite-dialog";

import "@esri/calcite-components/components/calcite-input-text";
import "@esri/calcite-components/components/calcite-input-number";
import "@esri/calcite-components/components/calcite-text-area";
import "@esri/calcite-components/components/calcite-notice";
import "@esri/calcite-components/components/calcite-list";
import "@esri/calcite-components/components/calcite-list-item";
import "@esri/calcite-components/components/calcite-action";
import "@esri/calcite-components/components/calcite-select";
import "@esri/calcite-components/components/calcite-option";
import "@esri/calcite-components/components/calcite-fab";
import "@esri/calcite-components/components/calcite-input-message";
import "@esri/calcite-components/components/calcite-table";
import "@esri/calcite-components/components/calcite-table-row";
import "@esri/calcite-components/components/calcite-table-cell";
import "@esri/calcite-components/components/calcite-table-header";

import Contact from "../Contact/Contact";
import { config } from "../config";
import Details from "../Details/Details";
import type { TargetedEvent } from "@arcgis/map-components";
import Location from "../Location/Location";
import Intro from "../Intro/Intro";
import Submit from "../Submit/Submit";
import StreetNames from "../StreetNames/StreetNames";
import useForm from "./useForm";
import Navigation from "../Navigation/Navigation";
import { useStreetNameAppContext } from "../Context/useStreetNameAppContext";

function Form() {
  const { applicationLayer, streetsTable, streetsLookupTable, loaded } =
    useStreetNameAppContext();
  const {
    selectedStep,
    setSelectedStep,
    activeSteps,
    onValid,
    onSuccess,
    submissionId,
  } = useForm();
  
  if (!loaded) {
    return <calcite-scrim loading></calcite-scrim>;
  }
  return (
    <>

      <Navigation></Navigation>
      <calcite-stepper
        oncalciteStepperChange={(
          event: TargetedEvent<HTMLCalciteStepperElement, void>
        ) => {
          setSelectedStep(event.currentTarget.selectedItem.id);
        }}
      >
        <calcite-stepper-item
          heading="Introduction"
          id={"intro"}
          selected={selectedStep === "intro"}
          disabled={activeSteps.includes("intro") ? undefined : true}
        >
          <Intro
            onNext={(step: string) => {
              setSelectedStep(step);
            }}
          ></Intro>
        </calcite-stepper-item>
        <calcite-stepper-item
          heading="Contact"
          selected={selectedStep === "contact"}
          id={"contact"}
          disabled={activeSteps.includes("contact") ? undefined : true}
        >
          <Contact
            formFields={config.fields.contact}
            layer={applicationLayer}
            onNext={(step: string) => {
              setSelectedStep(step);
            }}
            onPrevious={(step: string) => {
              setSelectedStep(step);
            }}
            onValid={onValid}
          ></Contact>
        </calcite-stepper-item>
        <calcite-stepper-item
          heading="Location"
          id="location"
          selected={selectedStep === "location"}
          disabled={activeSteps.includes("location") ? undefined : true}
        >
          <Location
            itemId={config.webMapId}
            onNext={(step: string) => {
              setSelectedStep(step);
            }}
            onPrevious={(step: string) => {
              setSelectedStep(step);
            }}
            onValid={onValid}
          ></Location>
        </calcite-stepper-item>
        <calcite-stepper-item
          heading="Project Details"
          id="details"
          selected={selectedStep === "details"}
          disabled={activeSteps.includes("details") ? undefined : true}
        >
          <Details
            formFields={config.fields.details}
            layer={applicationLayer}
            onNext={(step: string) => {
              setSelectedStep(step);
            }}
            onPrevious={(step: string) => {
              setSelectedStep(step);
            }}
            onValid={onValid}
          ></Details>
        </calcite-stepper-item>

        <calcite-stepper-item
          heading="Street Names"
          id="streetnames"
          selected={selectedStep === "streetnames"}
          disabled={activeSteps.includes("streetnames") ? undefined : true}
        >
          <StreetNames
            streetsLookupTable={streetsLookupTable}
            allowedStreetTypes={config.allowedStreetTypes}
            onNext={(step: string) => {
              setSelectedStep(step);
            }}
            onPrevious={(step: string) => {
              setSelectedStep(step);
            }}
            onValid={onValid}
          ></StreetNames>
        </calcite-stepper-item>
        <calcite-stepper-item
          heading="Submit"
          id="submit"
          selected={selectedStep === "submit"}
          disabled={activeSteps.includes("submit") ? undefined : true}
        >
          <Submit
            layer={applicationLayer}
            streetsTable={streetsTable}
            onPrevious={(step: string) => {
              setSelectedStep(step);
            }}
            onSuccess={onSuccess}
          ></Submit>
        </calcite-stepper-item>
      </calcite-stepper>
      <calcite-dialog
        open={submissionId.length > 0}
        heading="Submission Successful"
        modal
        oncalciteDialogClose={() => location.href = `${document.location.origin}/streetname-application/${submissionId}`}
      >
        Your application has successfully been submitted. Staff will begin
        reviewing the application. If not enough street names are approved, you
        will receive an email asking for additional street names to be
        submitted. Once the application is approved by city staff, it will be
        sent to the county for final approval. To check the status of your
        application, please refer to following link:
        {`${document.location.origin}/streetname-application/status/${submissionId}`}
      </calcite-dialog>
    </>
  );
}

export default Form;
