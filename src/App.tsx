import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

// --- IMPORT YOUR PAGES ---
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage"; // <-- RE-ADD THIS
import AdminJobPostings from "./pages/AdminJobPostings";
import AdminApplications from "./pages/AdminApplications";

// --- IMPORT YOUR LAYOUTS ---
import StudentLayout from "./pages/StudentLayout"; // <-- RENAME/CREATE THIS
import AdminLayout from "./pages/AdminLayout";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* === PUBLIC ROUTES === */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* === STUDENT ROUTES (Protected) === */}
          {/* This wrapper protects all student pages */}
          <Route element={<StudentLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* === ADMIN ROUTES (Protected) === */}
          {/* This wrapper protects all admin pages */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminJobPostings />} /> {/* Default admin page */}
            <Route path="job-postings" element={<AdminJobPostings />} />
            <Route path="applications" element={<AdminApplications />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;