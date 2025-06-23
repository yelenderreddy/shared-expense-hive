import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen netflix-gradient flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="netflix-card rounded-2xl p-8 sm:p-12 max-w-md mx-4 px-2">
          <h1 className="text-6xl sm:text-8xl font-bold text-white mb-4">404</h1>
          <p className="text-responsive text-gray-300 mb-6 sm:mb-8">Oops! Page not found</p>
          <Link to="/">
            <Button 
              variant="netflix" 
              size="lg"
              className="text-responsive font-semibold w-full max-w-xs mx-auto"
            >
              <Home className="h-5 w-5 mr-2" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
