import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { StoreProvider } from "./contexts/StoreContext.jsx";
import { UserProvider } from "./contexts/UserContext.jsx";
import { ProductProvider } from "./contexts/ProductContext.jsx"; // 👈 add this

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>

          <ProductProvider>
         
            <UserProvider>
         
              <App />
            </UserProvider>
          </ProductProvider>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
