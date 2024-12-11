import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Overlay from "./Overlay"; // Import the new overlay component
import Overlay2 from "./Overlay2"; // Import the new overlay component
import App from "./App";

const Root = () => (
    <Router>
        <Routes>
            <Route path="/" element={<App />} />
        </Routes>
    </Router>
);

ReactDOM.render(<Root />, document.getElementById("root"));
