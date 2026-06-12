import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Loja from "./pages/Loja";
import Admin from "./pages/Admin";
import Login from "./pages/Login";

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
          element={<Login />}
        />

        <Route
          path="/admin"
          element={<Admin />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;