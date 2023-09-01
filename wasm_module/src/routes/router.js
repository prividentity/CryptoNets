import { createBrowserRouter } from "react-router-dom";
import TestingPage from "../pages/TestingPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <TestingPage />,
  }
]);

export default router;
