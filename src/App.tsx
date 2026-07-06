import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Editor } from "./pages/Editor";
import { Plans } from "./pages/Plans";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "plans", element: <Plans /> },
      { path: "editor/:id", element: <Editor /> }
    ]
  }
]);

export const App = () => <RouterProvider router={router} />;
