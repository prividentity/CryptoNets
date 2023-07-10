import { createBrowserRouter } from "react-router-dom";
import TestingPage from "../pages/TestingPage";

import CompareFlow from "../pages/CompareFlow";
import EnrollWithMugshot from "../pages/EnrollWithMugshot";
import PredictWithMugshot from "../pages/PredictWithMugshot";
import EnrollWithLabel from "../pages/EnrollWithLabel";

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
    path: "/enroll_with_mugshot",
    element: <EnrollWithMugshot />
  },
  {
    path: "/predict_with_mugshot",
    element: <PredictWithMugshot />
  },
  {
    path: "/enroll_with_label",
    element: <EnrollWithLabel />
  }
]);

export default router;