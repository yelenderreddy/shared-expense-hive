import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getTripsByUser, createTrip, deleteTrip, Trip, getViewedTripsByUser } from "@/lib/database";
import { ArrowLeft, Plus, Users, Calendar, DollarSign, Trash2, Edit } from "lucide-react";

const Trips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<{ id: string; name: string } | null>(null);
  const [newTrip, setNewTrip] = useState({
    name: "",
    participants: [] as string[],
    participantInput: "",
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinLink, setJoinLink] = useState("");
  const [viewedTrips, setViewedTrips] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadTrips();
      // Load trips viewed as viewer
      getViewedTripsByUser(user.id).then(({ data }) => {
        if (data) setViewedTrips(data);
      });
    }
  }, [user]);

  const loadTrips = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await getTripsByUser(user.id);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load trips",
          variant: "destructive",
        });
      } else {
        setTrips(data || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load trips",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = () => {
    if (newTrip.participantInput.trim() && !newTrip.participants.includes(newTrip.participantInput.trim())) {
      setNewTrip(prev => ({
        ...prev,
        participants: [...prev.participants, newTrip.participantInput.trim()],
        participantInput: ""
      }));
    }
  };

  const handleRemoveParticipant = (index: number) => {
    setNewTrip(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };

  const handleCreateTrip = async () => {
    if (!user) return;

    if (!newTrip.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a trip name",
        variant: "destructive",
      });
      return;
    }

    if (newTrip.participants.length < 2) {
      toast({
        title: "Error",
        description: "Please add at least 2 participants",
        variant: "destructive",
      });
      return;
    }

    // Store trip data in localStorage for the setup fund flow
    const tripData = {
      name: newTrip.name.trim(),
      participants: newTrip.participants,
      contributions: {},
      totalPooled: 0,
      expenses: [],
      createdAt: new Date().toISOString(),
    };
    
    localStorage.setItem("tripFundData", JSON.stringify(tripData));
    localStorage.setItem("tripParticipants", JSON.stringify(newTrip.participants));
    
    toast({
      title: "Success!",
      description: "Trip setup completed. Now add contributions.",
    });
    
    setNewTrip({ name: "", participants: [], participantInput: "" });
    setShowCreateForm(false);
    
    // Redirect to setup fund page
    navigate("/setup-fund");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeleteTrip = async (tripId: string, tripName: string) => {
    if (!user) return;

    // Set the trip to delete and show custom dialog
    setTripToDelete({ id: tripId, name: tripName });
    setShowDeleteDialog(true);
  };

  const confirmDeleteTrip = async () => {
    if (!user || !tripToDelete) return;

    setDeletingTripId(tripToDelete.id);
    setShowDeleteDialog(false);

    try {
      const { error } = await deleteTrip(tripToDelete.id);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete trip",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: `Trip "${tripToDelete.name}" deleted successfully`,
        });
        // Reload trips to update the list
        loadTrips();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete trip",
        variant: "destructive",
      });
    } finally {
      setDeletingTripId(null);
      setTripToDelete(null);
    }
  };

  const cancelDeleteTrip = () => {
    setShowDeleteDialog(false);
    setTripToDelete(null);
  };

  const handleJoinTrip = () => {
    // Extract tripId from the link
    let match = joinLink.match(/trips\/shared\/([a-zA-Z0-9\-]+)/);
    if (match && match[1]) {
      navigate(`/trips/shared/${match[1]}`);
    } else {
      toast({
        title: "Invalid Link",
        description: "Please enter a valid shared trip link.",
        variant: "destructive",
      });
    }
  };

  console.log('viewedTrips:', viewedTrips);

  if (loading) {
    return (
      <div className="min-h-screen netflix-gradient flex items-center justify-center">
        <div className="text-white text-lg animate-pulse">Loading trips...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen netflix-gradient">
      <div className="responsive-container py-4 sm:py-6 md:py-8 px-2 sm:px-4">
        <div className="mb-4 sm:mb-6 animate-fade-in w-full">
          <div className="flex flex-row items-center w-full min-w-0">
            <div className="w-10 flex-shrink-0 z-50" />
            <Link
              to="/"
              className="flex-1 text-white hover:text-red-400 flex items-center gap-2 text-sm sm:text-base transition-colors truncate justify-end"
            >
              <span className="flex items-center gap-1 truncate justify-end w-full">
                <ArrowLeft className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">Back to Home</span>
              </span>
          </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4 sm:gap-2 flex-wrap">
          <h1 className="text-white text-2xl sm:text-3xl font-bold truncate">My Trips</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-wrap">
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="netflix"
              className="flex items-center gap-2 w-full sm:w-auto min-w-0"
          >
            <Plus className="h-4 w-4" />
              <span className="truncate">New Trip</span>
            </Button>
            <Button
              onClick={() => setShowJoinInput((v) => !v)}
              variant="netflix-secondary"
              className="flex items-center gap-2 w-full sm:w-auto min-w-0"
            >
              <span className="truncate">Join Trip by Link</span>
          </Button>
          </div>
        </div>

        {showJoinInput && (
          <div className="mb-6 flex flex-col sm:flex-row gap-2 items-center w-full max-w-full">
            <Input
              value={joinLink}
              onChange={e => setJoinLink(e.target.value)}
              placeholder="Paste shared trip link here"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 flex-1 w-full sm:w-auto min-w-0"
            />
            <Button onClick={handleJoinTrip} variant="netflix" className="w-full sm:w-auto min-w-0">
              <span className="truncate">Join</span>
            </Button>
          </div>
        )}

        {showCreateForm && (
          <Card className="netflix-card mb-8 w-full max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="text-white text-lg sm:text-xl">Create New Trip</CardTitle>
              <CardDescription className="text-gray-300 text-sm sm:text-base">
                Set up a new trip with participants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="tripName" className="text-white">Trip Name</Label>
                <Input
                  id="tripName"
                  value={newTrip.name}
                  onChange={(e) => setNewTrip(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Goa Trip 2024, Family Vacation"
                  className="mt-2 bg-gray-800 border-gray-600 text-white placeholder-gray-400 w-full"
                />
              </div>

              <div>
                <Label className="text-white">Participants</Label>
                <div className="flex gap-2 mt-2 flex-col sm:flex-row flex-wrap w-full">
                  <Input
                    value={newTrip.participantInput}
                    onChange={(e) => setNewTrip(prev => ({ ...prev, participantInput: e.target.value }))}
                    placeholder="Enter participant name"
                    className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400 w-full sm:w-auto min-w-0"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddParticipant()}
                  />
                  <Button onClick={handleAddParticipant} variant="netflix-secondary" className="w-full sm:w-auto min-w-0">
                    <span className="truncate">Add</span>
                  </Button>
                </div>
                {newTrip.participants.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {newTrip.participants.map((participant, index) => (
                      <div
                        key={index}
                        className="bg-red-600/20 text-white px-3 py-1 rounded-full flex items-center gap-2 max-w-full"
                      >
                        <span className="truncate max-w-[120px] sm:max-w-none">{participant}</span>
                        <button
                          onClick={() => handleRemoveParticipant(index)}
                          className="text-red-300 hover:text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full flex-wrap">
                <Button
                  onClick={handleCreateTrip}
                  variant="netflix"
                  className="flex-1 w-full sm:w-auto min-w-0"
                >
                  <span className="truncate">Create Trip</span>
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTrip({ name: "", participants: [], participantInput: "" });
                  }}
                  variant="netflix-secondary"
                  className="flex-1 w-full sm:w-auto min-w-0"
                >
                  <span className="truncate">Cancel</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {trips.length === 0 ? (
          <Card className="netflix-card w-full max-w-md mx-auto">
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">No trips yet</h3>
              <p className="text-gray-300 mb-6">Create your first trip to start managing expenses</p>
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="netflix"
                className="flex items-center gap-2 mx-auto w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                <span className="truncate">Create Your First Trip</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full">
            {trips.map((trip) => (
              <Card key={trip.id} className="w-full overflow-hidden">
                <CardHeader>
                  <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center w-full gap-2 xs:gap-0">
                    <div className="min-w-0">
                      <CardTitle className="text-white text-lg truncate max-w-[180px] sm:max-w-none">{trip.name}</CardTitle>
                      <CardDescription className="text-gray-300">
                        {trip.participants.length} participants
                      </CardDescription>
                    </div>
                    <div className="flex gap-1 flex-wrap min-w-0 mt-2 xs:mt-0">
                      <Button
                        variant="netflix-secondary"
                        size="sm"
                        onClick={() => navigate(`/trip/${trip.id}`)}
                        title="Manage Trip"
                        disabled={deletingTripId === trip.id}
                        className="w-8 h-8 sm:w-auto sm:h-auto"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTrip(trip.id, trip.name)}
                        title="Delete Trip"
                        disabled={deletingTripId === trip.id}
                        className="w-8 h-8 sm:w-auto sm:h-auto"
                      >
                        {deletingTripId === trip.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-gray-300 break-words">
                    <Users className="h-4 w-4" />
                    <span className="text-sm truncate max-w-[180px] sm:max-w-none">{trip.participants.join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">₹{trip.total_pooled.toFixed(2)} pooled</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Created {formatDate(trip.created_at)}</span>
                  </div>
                  <Button
                    onClick={() => navigate(`/trip/${trip.id}`)}
                    variant="netflix"
                    className="w-full mt-4"
                  >
                    <span className="truncate">Manage Trip</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recently Viewed as Viewer */}
        {viewedTrips.length > 0 && (
          <div className="mt-12">
            <h2 className="text-white text-2xl font-bold mb-4">Trips I Viewed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {viewedTrips.map((v) => {
                const trip = v.trip;
                if (!trip) return null;
                return (
                  <Card key={trip.id} className="netflix-card-hover w-full max-w-full sm:max-w-none mx-auto">
              <CardHeader>
                      <CardTitle className="text-white text-lg truncate max-w-[180px] sm:max-w-none">{trip.name}</CardTitle>
              </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-300">
                        <span className="text-sm">{trip.participants.length} participants</span>
                      </div>
                  <Button
                        onClick={() => navigate(`/trips/shared/${trip.id}`)}
                        variant="destructive"
                        className="w-full mt-4"
                      >
                        <span className="truncate">View as Viewer</span>
                  </Button>
              </CardContent>
            </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trips; 