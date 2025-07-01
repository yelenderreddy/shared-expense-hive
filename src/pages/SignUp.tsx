import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User } from "lucide-react";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: "Account created successfully! Please check your email to verify your account.",
        });
        navigate("/signin");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen netflix-gradient">
      <div className="responsive-container py-6 sm:py-8">
        <div className="mb-6 animate-fade-in">
          <Link to="/" className="text-white hover:text-red-400 flex items-center gap-2 text-sm sm:text-base transition-colors">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            Back to Home
          </Link>
        </div>

        <div className="max-w-md mx-auto animate-fade-in w-full px-2 sm:px-0" style={{ animationDelay: '0.1s' }}>
          <Card className="netflix-card">
            <CardHeader className="text-center pb-6">
              <div className="bg-red-600/20 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <User className="h-8 w-8 text-red-400" />
              </div>
              <CardTitle className="text-white text-responsive-lg sm:text-2xl md:text-3xl">Create Account</CardTitle>
              <CardDescription className="text-gray-300 text-sm sm:text-base">
                Join Shared Expense Hive to manage your trip expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6 w-full">
                <div>
                  <Label htmlFor="email" className="text-white font-medium text-sm sm:text-base">
                    Email Address
                  </Label>
                  <div className="input-container relative mt-2">
                    <Mail className="input-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="input-field pl-12 md:pl-12 sm:pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-base h-12 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-white font-medium text-sm sm:text-base">
                    Password
                  </Label>
                  <div className="input-container relative mt-2">
                    <Lock className="input-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="input-field pl-12 md:pl-12 sm:pl-10 pr-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-base h-12 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-20"
                      tabIndex={-1}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">Password must be at least 6 characters</p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-white font-medium text-sm sm:text-base">
                    Confirm Password
                  </Label>
                  <div className="input-container relative mt-2">
                    <Lock className="input-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="input-field pl-12 md:pl-12 sm:pl-10 pr-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-base h-12 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-20"
                      tabIndex={-1}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit"
                  variant="netflix"
                  size="lg"
                  className="w-full text-responsive font-semibold"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>

                <div className="text-center">
                  <p className="text-gray-300 text-sm">
                    Already have an account?{" "}
                    <Link to="/signin" className="text-red-400 hover:text-red-300 font-medium transition-colors">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx global>{`
      .input-container { position: relative; }
      .input-icon { left: 12px; top: 50%; transform: translateY(-50%); z-index: 10; }
      .input-field { padding-left: 48px; }
      @media (max-width: 640px) {
        .input-field { padding-left: 40px; }
        .input-icon { left: 10px; }
      }
      `}</style>
    </div>
  );
};

export default SignUp; 