import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("main.tsx: Starting execution");
const rootElement = document.getElementById("root");
console.log("main.tsx: Root element found:", !!rootElement);

if (rootElement) {
    console.log("main.tsx: Calling render");
    createRoot(rootElement).render(<App />);
    console.log("main.tsx: Render called");
} else {
    console.error("main.tsx: Root element NOT FOUND");
}
