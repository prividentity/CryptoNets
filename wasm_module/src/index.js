import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import router from "./routes/router";
import { RouterProvider } from "react-router-dom";
import ScanDocumentBoundingBox from "./pages/ScanDocumentBoundingBox";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {/* <ScanDocumentBoundingBox /> */}
    <RouterProvider router={router} /> 
  </React.StrictMode>
);
