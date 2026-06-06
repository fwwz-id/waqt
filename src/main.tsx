import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { SettingsProvider } from "@/app/SettingsContext";
import { router } from "@/app/router";
import { warmServiceWorkerRegistration } from "@/lib/pwa/serviceWorkerRegistration";
import "./index.css";

warmServiceWorkerRegistration();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Nominatim is rate-limited and our data is geographic; cache generously.
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <RouterProvider router={router} />
      </SettingsProvider>
    </QueryClientProvider>
  </StrictMode>,
);
