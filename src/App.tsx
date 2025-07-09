import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Form from "./Form/Form";
import Status from "./Status/Status";
import Review from "./Review/Review";
import { StreetNameAppContextProvider } from "./Context/StreetNameAppContextProvider";
import { useStreetNameAppContext } from "./Context/useStreetNameAppContext";

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
          <Route
            path="/status"
            element={<Navigate to="/submit" replace />}
          />
          <Route path="/status/:submittalId" element={<Status />} />
          <Route
            path="/update"
            element={<Navigate to="/submit" replace />}
          />
          <Route path="/update/:submittalId" element={<Status />} />
          <Route
            path="/review"
            element={<Navigate to="/submit" replace />}
          />
          <Route path="/review/:submittalId" element={<Review />} />
          <Route path="*" element={<Navigate to="/submit" replace />} />
        </Routes>
      </StreetNameAppContextProvider>
    </BrowserRouter>
  );
}

export default App;
