import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Trips from "./pages/Trips";
import TripDashboard from "./pages/TripDashboard";
import AddMembers from "./pages/AddMembers";
import SetupFund from "./pages/SetupFund";
import Dashboard from "./pages/Dashboard";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import { SidebarProvider, Sidebar, CustomSidebarContent, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import React from "react";

const queryClient = new QueryClient();

function AppLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const hideSidebar = ["/signin", "/signup"].includes(location.pathname) || (location.pathname === "/" && !user);

  // Sidebar open state lifted to AppLayout
  const [openMobile, setOpenMobile] = React.useState(false);

  function MobileSidebarTrigger() {
    // Robust client-only mobile detection
    const [isMobile, setIsMobile] = React.useState(false);
    React.useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 1024); // lg breakpoint
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);
    // Debug log
    React.useEffect(() => {
      console.log('MobileSidebarTrigger isMobile:', isMobile);
    }, [isMobile]);
    // Always render the menu icon on mobile
    return (
      <button
        type="button"
        className="lg:hidden fixed top-3 left-3 z-[9999] p-2 text-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        aria-label="Open menu"
        style={{ display: isMobile ? 'block' : 'none', pointerEvents: 'auto' }}
        onClick={() => {
          setOpenMobile(true);
        }}
      >
        <Menu className="w-7 h-7" />
      </button>
    );
  }

  return (
    <SidebarProvider openMobile={openMobile} setOpenMobile={setOpenMobile}>
      {/* Floating sidebar trigger for mobile, always visible when sidebar is not hidden */}
      {!hideSidebar && <MobileSidebarTrigger />}
      <div className="flex flex-col md:flex-row min-h-screen w-full overflow-x-hidden">
        {!hideSidebar && (
          <Sidebar>
            <CustomSidebarContent />
          </Sidebar>
        )}
        <div className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/trips" element={<ProtectedRoute><Trips /></ProtectedRoute>} />
            <Route path="/trip/:tripId" element={<ProtectedRoute><TripDashboard /></ProtectedRoute>} />
            <Route path="/trips/shared/:tripId" element={<ProtectedRoute><TripDashboard isSharedView={true} /></ProtectedRoute>} />
            <Route path="/add-members" element={<ProtectedRoute><AddMembers /></ProtectedRoute>} />
            <Route path="/setup-fund" element={<ProtectedRoute><SetupFund /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
