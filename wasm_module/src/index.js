import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import router from "./routes/router";
import { RouterProvider } from "react-router-dom";
import DebugContextProvider from "./context/DebugContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <DebugContextProvider>
    <RouterProvider router={router} /> 
  </DebugContextProvider>
);
