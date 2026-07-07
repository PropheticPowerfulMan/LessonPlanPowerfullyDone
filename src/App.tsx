import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Editor } from "./pages/Editor";
import { Plans } from "./pages/Plans";

const ErrorPage = () => (
  <div className="min-h-screen bg-background px-4 py-20 text-center text-foreground">
    <p className="text-sm font-semibold text-secondary">Application error</p>
    <h1 className="mt-4 text-3xl font-black">Page introuvable</h1>
    <p className="mt-2 text-sm text-muted-foreground">Le routeur n’a pas trouvé la page demandée.</p>
    <a href={import.meta.env.BASE_URL} className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 hover:brightness-105">
      Retour à l’accueil
    </a>
  </div>
);

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppLayout />,
      errorElement: <ErrorPage />,
      children: [
        { index: true, element: <Dashboard /> },
        { path: "plans", element: <Plans /> },
        { path: "editor/:id", element: <Editor /> }
      ]
    }
  ],
  {
    basename: import.meta.env.BASE_URL
  }
);

export const App = () => <RouterProvider router={router} />;
