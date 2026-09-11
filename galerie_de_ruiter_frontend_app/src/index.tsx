import { createRoot } from "react-dom/client";
import App from "./App";
import 'react-bootstrap'
import "@/styles/App.scss";
import "@/styles/index.css";


createRoot(document.getElementById("root")!).render( <App /> );