import React from "react";
import RoutesList from "./routes";
// import { Toaster } from "react-hot-toast";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />

      {/* <Toaster position="top-right" reverseOrder={false} /> */}

      <RoutesList />
    </div>
  );
}

export default App;
