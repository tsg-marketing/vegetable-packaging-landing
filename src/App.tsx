
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Vegetables from "./pages/Vegetables";
import Vacuum from "./pages/Vacuum";
import Gorizontalnoe from "./pages/Gorizontalnoe";
import Kartonajnoe from "./pages/Kartonajnoe";
import NotFound from "./pages/NotFound";
import { ymGoal } from "@/lib/ym";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest("a") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (href.startsWith("tel:")) ymGoal("click_phone");
      else if (href.startsWith("mailto:")) ymGoal("click_email");
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/vegetables" element={<Vegetables />} />
            <Route path="/vacuum" element={<Vacuum />} />
            <Route path="/gorizontalnoe" element={<Gorizontalnoe />} />
            <Route path="/kartonajnoe" element={<Kartonajnoe />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;