
import { createRoot } from "react-dom/client";
import RouterApp from "./components/RouterApp.tsx";
import "./index.css";
import { initApiClient } from "./services/api";

initApiClient();

createRoot(document.getElementById("root")!).render(<RouterApp />);
  
