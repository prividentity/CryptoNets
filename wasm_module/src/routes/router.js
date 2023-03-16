import { createBrowserRouter } from "react-router-dom";
import TestingPage from "../pages/TestingPage";

import CompareFlow from "../pages/CompareFlow";

const router = createBrowserRouter([
  {
    path: "/",
    element: <TestingPage />,
  },
  {
    path: "/compare",
    element: <CompareFlow />,
  },
]);

export default router;