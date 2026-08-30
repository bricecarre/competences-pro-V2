import { useState } from "react";
import "./App.css";

import DashboardEleve from "./pages/DashboardEleve";
import DashboardProf from "./pages/DashboardProf";
import DashboardAdmin from "./pages/DashboardAdmin";

function App() {

  const [page, setPage] = useState("home");

  return (

    <div className="app">

      {page === "home" && (

        <div className="card">

          <h1>🎓 Compétences Pro</h1>

          <p>Bac Professionnel TCI</p>

          <button onClick={() => setPage("eleve")}>
            👨‍🎓 Élèves
          </button>

          <button onClick={() => setPage("prof")}>
            👨‍🏫 Enseignants
          </button>

          <button onClick={() => setPage("admin")}>
            ⚙️ Administrateurs
          </button>

        </div>

      )}

      {page === "eleve" && <DashboardEleve />}

      {page === "prof" && <DashboardProf />}

      {page === "admin" && <DashboardAdmin />}

    </div>

  );

}

export default App;