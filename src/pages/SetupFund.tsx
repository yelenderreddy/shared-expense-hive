import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createTrip } from "@/lib/database";
import { ArrowLeft, CreditCard, Save } from "lucide-react";

const SetupFund = () => {
  const [participants, setParticipants] = useState<string[]>([]);
  const [tripName, setTripName] = useState<string>("");
  const [contributions, setContributions] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const storedParticipants = localStorage.getItem("tripParticipants");
    const storedTripData = localStorage.getItem("tripFundData");
    
    if (!storedParticipants) {
      navigate("/trips");
      return;
    }
    
    const parsedParticipants = JSON.parse(storedParticipants);
    setParticipants(parsedParticipants);
    
    // Get trip name from stored data
    if (storedTripData) {
      const tripData = JSON.parse(storedTripData);
      setTripName(tripData.name || "");
    }
    
    // Initialize contributions
    const initialContributions: { [key: string]: number } = {};
    parsedParticipants.forEach((name: string) => {
      initialContributions[name] = 0;
    });
    setContributions(initialContributions);
  }, [navigate]);

  const handleContributionChange = (name: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setContributions(prev => ({
      ...prev,
      [name]: numAmount
    }));
  };

  const getTotalPooled = () => {
    return Object.values(contributions).reduce((sum, amount) => sum + amount, 0);
  };

  const handleSaveFund = () => {
    const totalPooled = getTotalPooled();
    
    if (totalPooled <= 0) {
      toast({
        title: "Error",
        description: "Total pooled amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    // Store fund data in localStorage
    const fundData = {
      participants,
      contributions,
      totalPooled,
      expenses: [],
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem("tripFundData", JSON.stringify(fundData));
    
    toast({
      title: "Success!",
      description: `Fund data saved. Total pooled: ₹${totalPooled.toLocaleString()}`,
    });
  };

  const handleCreateTrip = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to create a trip",
        variant: "destructive",
      });
      return;
    }

    const totalPooled = getTotalPooled();
    
    if (totalPooled <= 0) {
      toast({
        title: "Error",
        description: "Total pooled amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const tripData = {
        user_id: user.id,
        name: tripName,
        participants: participants,
        contributions: contributions,
        total_pooled: totalPooled,
      };

      const { data, error } = await createTrip(tripData);
      
      if (error) {
        toast({
          title: "Error",
          description: `Failed to create trip: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: `Trip "${tripName}" created successfully with ₹${totalPooled.toLocaleString()} pooled fund`,
        });

        // Clear localStorage
        localStorage.removeItem("tripParticipants");
        localStorage.removeItem("tripFundData");

        // Navigate to the new trip dashboard
        navigate(`/trip/${data.id}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create trip",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (participants.length === 0) {
    return (
      <div className="min-h-screen netflix-gradient flex items-center justify-center">
        <div className="text-white text-lg animate-pulse-slow">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen netflix-gradient">
      <div className="responsive-container py-6 sm:py-8">
        <div className="mb-6 animate-fade-in">
          <Link to="/trips" className="text-white hover:text-red-400 flex items-center gap-2 text-sm sm:text-base transition-colors">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            Back to Trips
          </Link>
        </div>

        <div className="max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <Card className="netflix-card">
            <CardHeader className="text-center pb-6">
              <div className="bg-red-600/20 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-red-400" />
              </div>
              <CardTitle className="text-white text-responsive-lg sm:text-2xl md:text-3xl">Setup Trip Fund</CardTitle>
              <CardDescription className="text-gray-300 text-sm sm:text-base">
                {tripName && `Setting up fund for: ${tripName}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {participants.map((name, index) => (
                  <div key={name} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <Label htmlFor={`contribution-${name}`} className="text-white font-medium text-sm sm:text-base">
                      Enter amount contributed by {name}:
                    </Label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base">₹</span>
                      <Input
                        id={`contribution-${name}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={contributions[name] || ""}
                        onChange={(e) => handleContributionChange(name, e.target.value)}
                        placeholder="0.00"
                        className="pl-8 bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-base h-12 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Card className="netflix-card border-gray-600 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-white font-medium text-sm sm:text-base">Total Pooled Amount:</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-400 mt-2">
                      ₹{getTotalPooled().toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleSaveFund}
                  variant="netflix-secondary"
                  size="lg"
                  className="flex-1 text-responsive font-semibold flex items-center gap-2"
                  disabled={getTotalPooled() <= 0}
                >
                  <Save className="h-5 w-5" />
                  Save Fund Data
                </Button>
                <Button 
                  onClick={handleCreateTrip}
                  variant="netflix"
                  size="lg"
                  className="flex-1 text-responsive font-semibold"
                  disabled={getTotalPooled() <= 0 || loading}
                >
                  {loading ? "Creating Trip..." : "Create Trip"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SetupFund;
