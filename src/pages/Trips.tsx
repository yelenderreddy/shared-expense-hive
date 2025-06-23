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

  if (loading) {
    return (
      <div className="min-h-screen netflix-gradient flex items-center justify-center">
        <div className="text-white text-lg animate-pulse">Loading trips...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen netflix-gradient">
      <div className="responsive-container py-6 sm:py-8">
        <div className="mb-6 animate-fade-in">
          <Link to="/" className="text-white hover:text-red-400 flex items-center gap-2 text-sm sm:text-base transition-colors">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            Back to Home
          </Link>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">My Trips</h1>
          <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="netflix"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Trip
          </Button>
            <Button
              onClick={() => setShowJoinInput((v) => !v)}
              variant="netflix-secondary"
              className="flex items-center gap-2"
            >
              Join Trip by Link
            </Button>
          </div>
        </div>

        {showJoinInput && (
          <div className="mb-8 flex gap-2 items-center">
            <Input
              value={joinLink}
              onChange={e => setJoinLink(e.target.value)}
              placeholder="Paste shared trip link here"
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 flex-1"
            />
            <Button onClick={handleJoinTrip} variant="netflix">
              Join
            </Button>
          </div>
        )}

        {showCreateForm && (
          <Card className="netflix-card mb-8">
            <CardHeader>
              <CardTitle className="text-white">Create New Trip</CardTitle>
              <CardDescription className="text-gray-300">
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
                  className="mt-2 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <Label className="text-white">Participants</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newTrip.participantInput}
                    onChange={(e) => setNewTrip(prev => ({ ...prev, participantInput: e.target.value }))}
                    placeholder="Enter participant name"
                    className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddParticipant()}
                  />
                  <Button onClick={handleAddParticipant} variant="netflix-secondary">
                    Add
                  </Button>
                </div>
                
                {newTrip.participants.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {newTrip.participants.map((participant, index) => (
                      <div
                        key={index}
                        className="bg-red-600/20 text-white px-3 py-1 rounded-full flex items-center gap-2"
                      >
                        <span>{participant}</span>
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

              <div className="flex gap-3">
                <Button
                  onClick={handleCreateTrip}
                  variant="netflix"
                  className="flex-1"
                >
                  Create Trip
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTrip({ name: "", participants: [], participantInput: "" });
                  }}
                  variant="netflix-secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {trips.length === 0 ? (
          <Card className="netflix-card">
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">No trips yet</h3>
              <p className="text-gray-300 mb-6">Create your first trip to start managing expenses</p>
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="netflix"
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Create Your First Trip
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Card key={trip.id} className="netflix-card-hover">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white text-lg">{trip.name}</CardTitle>
                      <CardDescription className="text-gray-300">
                        {trip.participants.length} participants
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="netflix-secondary"
                        size="sm"
                        onClick={() => navigate(`/trip/${trip.id}`)}
                        title="Manage Trip"
                        disabled={deletingTripId === trip.id}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTrip(trip.id, trip.name)}
                        title="Delete Trip"
                        disabled={deletingTripId === trip.id}
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
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{trip.participants.join(", ")}</span>
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
                    Manage Trip
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recently Viewed as Viewer */}
        {console.log('viewedTrips:', viewedTrips)}
        {viewedTrips.length > 0 && (
          <div className="mt-12">
            <h2 className="text-white text-2xl font-bold mb-4">Trips I Viewed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {viewedTrips.map((v) => {
                const trip = v.trip;
                console.log('trip:', trip);
                if (!trip) return null;
                return (
                  <Card key={trip.id} className="netflix-card-hover">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">{trip.name}</CardTitle>
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
                        View as Viewer
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Delete Confirmation Dialog */}
        {showDeleteDialog && tripToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="netflix-card max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-400" />
                  Delete Trip
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Are you sure you want to delete this trip?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">
                    "{tripToDelete.name}"
                  </h4>
                  <p className="text-gray-300 text-sm mb-3">
                    This will permanently delete:
                  </p>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• The trip and all its data</li>
                    <li>• All expenses recorded for this trip</li>
                    <li>• All payment records</li>
                  </ul>
                  <p className="text-red-400 text-sm font-medium mt-3">
                    This action cannot be undone.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={confirmDeleteTrip}
                    variant="destructive"
                    className="flex-1"
                    disabled={deletingTripId === tripToDelete.id}
                  >
                    {deletingTripId === tripToDelete.id ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Deleting...
                      </div>
                    ) : (
                      "Delete Trip"
                    )}
                  </Button>
                  <Button
                    onClick={cancelDeleteTrip}
                    variant="netflix-secondary"
                    className="flex-1"
                    disabled={deletingTripId === tripToDelete.id}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trips; 