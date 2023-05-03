import { createBrowserRouter } from "react-router-dom";
import TestingPage from "../pages/TestingPage";

import CompareFlow from "../pages/CompareFlow";
import ScanDocumentBoundingBox from "../pages/ScanDocumentBoundingBox";
import EnrollWithMugshot from "../pages/EnrollWithMugshot";
import PredictWithMugshot from "../pages/PredictWithMugshot";

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
  },
  {
    path: "/enroll_with_mugshot",
    element: <EnrollWithMugshot />
  },
  {
    path: "/predict_with_mugshot",
    element: <PredictWithMugshot />
  }
]);

export default router;