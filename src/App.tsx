import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Form from "./Form/Form";
import Status from "./Status/Status";
import Review from "./Review/Review";
import { StreetNameAppContextProvider } from "./Context/StreetNameAppContextProvider";
import { useStreetNameAppContext } from "./Context/useStreetNameAppContext";
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

const TestContext = () => {
  const ctx = useStreetNameAppContext();
  console.log("✅ Context inside <TestContext />", ctx);
  return null;
};
function App() {
  return (
    <BrowserRouter basename="/streetname-application">
      <StreetNameAppContextProvider>
        <TestContext />
        <Routes>
          <Route path="/submit" element={<Form />} />
          <Route path="/status" element={<Navigate to="/submit" replace />} />
          <Route path="/status/:submittalId" element={<Status />} />
          <Route path="/update" element={<Navigate to="/submit" replace />} />
          <Route path="/update/:submittalId" element={<Status />} />
          <Route path="/review" element={<Navigate to="/submit" replace />} />
          <Route path="/review/:submittalId" element={<Review />} />
          <Route path="*" element={<Navigate to="/submit" replace />} />
        </Routes>
      </StreetNameAppContextProvider>
    </BrowserRouter>
  );
}

export default App;
