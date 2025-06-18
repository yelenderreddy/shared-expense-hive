import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Users } from "lucide-react";
import { Link } from "react-router-dom";

const AddMembers = () => {
  const [numParticipants, setNumParticipants] = useState<number>(2);
  const [participants, setParticipants] = useState<string[]>([]);
  const [showNameInputs, setShowNameInputs] = useState(false);
  const navigate = useNavigate();

  const handleNumParticipantsSubmit = () => {
    if (numParticipants < 2) {
      toast({
        title: "Error",
        description: "You need at least 2 participants for a trip",
        variant: "destructive",
      });
      return;
    }
    if (numParticipants > 20) {
      toast({
        title: "Error", 
        description: "Maximum 20 participants allowed",
        variant: "destructive",
      });
      return;
    }
    setParticipants(new Array(numParticipants).fill(""));
    setShowNameInputs(true);
  };

  const handleParticipantChange = (index: number, name: string) => {
    const updated = [...participants];
    updated[index] = name;
    setParticipants(updated);
  };

  const handleSubmit = () => {
    const validParticipants = participants.filter(name => name.trim() !== "");
    
    if (validParticipants.length !== numParticipants) {
      toast({
        title: "Error",
        description: "Please fill in all participant names",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate names
    const uniqueNames = new Set(validParticipants.map(name => name.trim().toLowerCase()));
    if (uniqueNames.size !== validParticipants.length) {
      toast({
        title: "Error",
        description: "All participant names must be unique",
        variant: "destructive",
      });
      return;
    }

    // Store participants in localStorage
    localStorage.setItem("tripParticipants", JSON.stringify(validParticipants));
    
    toast({
      title: "Success!",
      description: `Added ${validParticipants.length} participants`,
    });

    navigate("/setup-fund");
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

        <div className="max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <Card className="netflix-card">
            <CardHeader className="text-center pb-6">
              <div className="bg-red-600/20 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-red-400" />
              </div>
              <CardTitle className="text-white text-responsive-lg sm:text-2xl md:text-3xl">Add Trip Members</CardTitle>
              <CardDescription className="text-gray-300 text-sm sm:text-base">
                Let's start by adding everyone going on this trip
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!showNameInputs ? (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="numParticipants" className="text-white font-medium text-sm sm:text-base">
                      How many people are going on this trip?
                    </Label>
                    <Input
                      id="numParticipants"
                      type="number"
                      min="2"
                      max="20"
                      value={numParticipants}
                      onChange={(e) => setNumParticipants(parseInt(e.target.value) || 2)}
                      className="mt-3 bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-base h-12 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <Button 
                    onClick={handleNumParticipantsSubmit}
                    variant="netflix"
                    size="lg"
                    className="w-full text-responsive font-semibold"
                  >
                    Continue
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-white font-medium text-lg sm:text-xl">Enter participant names:</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {participants.map((name, index) => (
                      <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                        <Label htmlFor={`participant-${index}`} className="text-white text-sm sm:text-base">
                          Person {index + 1} Name:
                        </Label>
                        <Input
                          id={`participant-${index}`}
                          type="text"
                          value={name}
                          onChange={(e) => handleParticipantChange(index, e.target.value)}
                          placeholder={`Enter name for person ${index + 1}`}
                          className="mt-2 bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-base h-12 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      variant="netflix-secondary" 
                      onClick={() => setShowNameInputs(false)}
                      className="flex-1 h-12 text-base"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      variant="netflix"
                      size="lg"
                      className="flex-1 text-responsive font-semibold"
                    >
                      Continue to Fund Setup
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddMembers;
