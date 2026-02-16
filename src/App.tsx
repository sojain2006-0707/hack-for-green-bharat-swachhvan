import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import ChatBot from "@/components/ChatBot";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Service from "./pages/Service";
import Rating from "./pages/Rating";
import Support from "./pages/Support";
import Payment from "./pages/Payment";
import OnlinePay from "./pages/OnlinePay";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import HygieneSafety from "./pages/HygieneSafety";
import WomenFacilities from "./pages/WomenFacilities";
import Sustainability from "./pages/Sustainability";
import Profile from "./pages/Profile";
import ReferEarn from "./pages/ReferEarn";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />

            {/* Public auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected app routes */}
            <Route
              path="/home"
              element={
                <RequireAuth>
                  <Home />
                </RequireAuth>
              }
            />
            <Route
              path="/service/:type"
              element={
                <RequireAuth>
                  <Service />
                </RequireAuth>
              }
            />
            <Route
              path="/rating"
              element={
                <RequireAuth>
                  <Rating />
                </RequireAuth>
              }
            />

            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />

            <Route
              path="/refer"
              element={
                <RequireAuth>
                  <ReferEarn />
                </RequireAuth>
              }
            />

            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <Settings />
                </RequireAuth>
              }
            />

            <Route
              path="/about"
              element={
                <RequireAuth>
                  <About />
                </RequireAuth>
              }
            />
            <Route
              path="/how-it-works"
              element={
                <RequireAuth>
                  <HowItWorks />
                </RequireAuth>
              }
            />
            <Route
              path="/hygiene-safety"
              element={
                <RequireAuth>
                  <HygieneSafety />
                </RequireAuth>
              }
            />
            <Route
              path="/women-facilities"
              element={
                <RequireAuth>
                  <WomenFacilities />
                </RequireAuth>
              }
            />
            <Route
              path="/sustainability"
              element={
                <RequireAuth>
                  <Sustainability />
                </RequireAuth>
              }
            />
            <Route
              path="/support"
              element={
                <RequireAuth>
                  <Support />
                </RequireAuth>
              }
            />
            <Route
              path="/payment"
              element={
                <RequireAuth>
                  <Payment />
                </RequireAuth>
              }
            />
            <Route
              path="/pay"
              element={
                <RequireAuth>
                  <OnlinePay />
                </RequireAuth>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatBot />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
