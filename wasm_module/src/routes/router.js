import { createBrowserRouter } from "react-router-dom";
import TestingPage from "../pages/TestingPage";

import CompareFlow from "../pages/CompareFlow";
import ScanDocumentBoundingBox from "../pages/ScanDocumentBoundingBox";

const router = createBrowserRouter([
  {
    path: "/",
    element: <TestingPage />,
  },
  {
    path: "/compare",
    element: <CompareFlow />,
  },
  {
    path: "/bounding_box",
    element: <ScanDocumentBoundingBox />
  }
]);

export default router;