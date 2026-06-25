import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Loja from "./pages/loja";
import NotFound from "./pages/not-found";

const Login = lazy(() => import("./pages/login"));
const Admin = lazy(() => import("./pages/admin"));
const OrderStatus = lazy(() => import("./pages/order-status"));

function CarregandoPagina() {
  return (
    <main className="grid min-h-screen place-items-center text-gray-500">
      Carregando...
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Loja />}
        />

        <Route
          path="/login"
          element={
            <Suspense fallback={<CarregandoPagina />}>
              <Login />
            </Suspense>
          }
        />

        <Route
          path="/admin"
          element={
            <Suspense fallback={<CarregandoPagina />}>
              <Admin />
            </Suspense>
          }
        />

        <Route
          path="/pedido"
          element={
            <Suspense fallback={<CarregandoPagina />}>
              <OrderStatus />
            </Suspense>
          }
        />

        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
