import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getTripById, getExpensesByTrip, createExpense, deleteExpense, Trip, Expense, updateTrip, addTripViewer } from "@/lib/database";
import { ArrowLeft, Plus, Trash2, CheckCircle2 } from "lucide-react";

interface TripDashboardProps {
  isSharedView?: boolean;
}

const TripDashboard = ({ isSharedView = false }: TripDashboardProps) => {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [receivedPayments, setReceivedPayments] = useState<{ [payer: string]: { [debtor: string]: boolean } }>({});
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    paidBy: "",
    splitType: "equal" as "equal" | "custom",
    deductFromFund: false,
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasJoinedAsViewer, setHasJoinedAsViewer] = useState(false);

  useEffect(() => {
    if (tripId && user) {
      loadTripData();
    }
    if (isSharedView && tripId && user && trip && !trip.participants.includes(user.email || user.id)) {
      if (localStorage.getItem(`joined_trip_${tripId}`) === 'true') {
        setHasJoinedAsViewer(true);
      }
    }
  }, [tripId, user, isSharedView, trip]);

  const loadTripData = async () => {
    if (!tripId || !user) return;

    try {
      // Load trip data
      const { data: tripData, error: tripError } = await getTripById(tripId);
      if (tripError) {
        toast({
          title: "Error",
          description: "Failed to load trip",
          variant: "destructive",
        });
        navigate("/trips");
        return;
      }

      setTrip(tripData);

      // Load expenses
      const { data: expensesData, error: expensesError } = await getExpensesByTrip(tripId);
      if (expensesError) {
        toast({
          title: "Error",
          description: "Failed to load expenses",
          variant: "destructive",
        });
      } else {
        setExpenses(expensesData || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load trip data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async () => {
    if (!trip || !tripId) return;
    
    if (!newExpense.title.trim() || !newExpense.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(newExpense.amount);
    if (amount <= 0) {
      toast({
        title: "Error", 
        description: "Amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    // If deducting from fund, check if there's enough balance
    if (newExpense.deductFromFund) {
      const remainingFund = getRemainingFund();
      if (remainingFund < amount) {
        // If not enough fund, require who is paying the extra amount
        if (!newExpense.paidBy) {
          toast({
            title: "Error",
            description: `Pool fund has only ₹${remainingFund.toFixed(2)}. Please select who will pay the remaining ₹${(amount - remainingFund).toFixed(2)}`,
            variant: "destructive",
          });
          return;
        }
      }
    } else if (!newExpense.paidBy) {
      toast({
        title: "Error",
        description: "Please select who paid for this expense",
        variant: "destructive",
      });
      return;
    }

    try {
      const expenseData = {
        trip_id: tripId,
        title: newExpense.title.trim(),
        amount,
        paid_by: newExpense.deductFromFund && getRemainingFund() >= amount ? "Pool Fund" : newExpense.paidBy,
        split_type: newExpense.splitType,
        deduct_from_fund: newExpense.deductFromFund,
      };

      const { error } = await createExpense(expenseData);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to add expense",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: "Expense added successfully",
        });
        
        // Reset form
        setNewExpense({
          title: "",
          amount: "",
          paidBy: "",
          splitType: "equal",
          deductFromFund: false,
        });

        // Reload expenses
        loadTripData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    }
  };

  const deleteExpenseHandler = async (expenseId: string) => {
    try {
      const { error } = await deleteExpense(expenseId);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete expense",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: "Expense deleted",
        });
        loadTripData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getPerPersonShare = (expense: Expense) => {
    if (!trip) return 0;
    return expense.amount / trip.participants.length;
  };

  const getTotalDeductedFromFund = () => {
    return expenses
      .filter(expense => expense.deduct_from_fund)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getRemainingFund = () => {
    if (!trip) return 0;
    return trip.total_pooled - getTotalDeductedFromFund();
  };

  const getPendingReimbursements = () => {
    if (!trip) return {};
    
    const reimbursements: { [payer: string]: { [debtor: string]: number } } = {};
    let runningFundBalance = trip.total_pooled;

    // Process expenses chronologically
    expenses.forEach((expense) => {
      if (expense.deduct_from_fund) {
        if (runningFundBalance >= expense.amount) {
          // Fund covers the expense fully
          runningFundBalance -= expense.amount;
        } else {
          // Fund partially covers the expense
          const coveredAmount = runningFundBalance;
          const uncoveredAmount = expense.amount - coveredAmount;
          runningFundBalance = 0;

          // If someone paid the remaining amount
          if (expense.paid_by !== "Pool Fund") {
            const payer = expense.paid_by;
            // Calculate per person share for the uncovered amount
            const perPersonShare = uncoveredAmount / trip.participants.length;
            
            // Add to reimbursements
            if (!reimbursements[payer]) {
              reimbursements[payer] = {};
            }
              
            // Everyone except the payer owes their share
            trip.participants.forEach(member => {
              if (member !== payer) {
                if (!reimbursements[payer][member]) {
                  reimbursements[payer][member] = 0;
                }
                reimbursements[payer][member] += perPersonShare;
              }
            });
          }
        }
      } else {
        // For non-fund expenses, check if someone paid extra beyond their share
        const payer = expense.paid_by;
        const perPersonShare = expense.amount / trip.participants.length;
        const payerShare = perPersonShare;
        const extraPaid = expense.amount - payerShare;
        
        if (extraPaid > 0) {
          if (!reimbursements[payer]) {
            reimbursements[payer] = {};
          }
          
          trip.participants.forEach(member => {
            if (member !== payer) {
              if (!reimbursements[payer][member]) {
                reimbursements[payer][member] = 0;
              }
              reimbursements[payer][member] += perPersonShare;
            }
          });
        }
      }
    });

    // Filter out any zero amounts and empty objects
    const filteredReimbursements: { [payer: string]: { [debtor: string]: number } } = {};
    Object.entries(reimbursements).forEach(([payer, debtors]) => {
      const filteredDebtors: { [debtor: string]: number } = {};
      Object.entries(debtors).forEach(([debtor, amount]) => {
        if (amount > 0.01) { // Using 0.01 to account for floating point precision
          filteredDebtors[debtor] = amount;
        }
      });
      if (Object.keys(filteredDebtors).length > 0) {
        filteredReimbursements[payer] = filteredDebtors;
      }
    });
    
    return filteredReimbursements;
  };

  const markAsReceived = (payer: string, debtor: string) => {
    if (!trip) return;
    
    // Create a new object to ensure state update
    const updatedReceivedPayments = {
      ...receivedPayments,
      [payer]: {
        ...(receivedPayments[payer] || {}),
        [debtor]: true
      }
    };
    
    setReceivedPayments(updatedReceivedPayments);
    
    toast({
      title: "Success!",
      description: "Payment marked as received",
    });
  };

  const getTotalContribution = (name: string) => {
    if (!trip) return 0;
    
    // Start with initial contribution
    let total = trip.contributions[name] ?? 0;
    
    // Add any extra expenses paid by this person
    expenses.forEach(expense => {
      if (expense.deduct_from_fund) {
        const remainingFund = getRemainingFund() + getTotalDeductedFromFund();
        if (remainingFund < expense.amount && expense.paid_by === name) {
          // Add the extra amount they paid beyond pool fund
          const uncoveredAmount = expense.amount - Math.min(expense.amount, remainingFund);
          total += uncoveredAmount;
        }
      } else if (expense.paid_by === name) {
        // Add full amount for non-fund expenses
        total += expense.amount;
      }
    });

    return total;
  };

  const getTotalExpenseShare = (name: string) => {
    if (!trip) return 0;
    
    let totalShare = 0;
    let runningFundBalance = trip.total_pooled;

    expenses.forEach(expense => {
      if (expense.deduct_from_fund) {
        if (runningFundBalance >= expense.amount) {
          // Fund covers the expense fully
          runningFundBalance -= expense.amount;
          totalShare += expense.amount / trip.participants.length;
        } else {
          // Fund partially covers the expense
          const coveredAmount = runningFundBalance;
          const uncoveredAmount = expense.amount - coveredAmount;
          runningFundBalance = 0;

          // Add both covered and uncovered shares
          totalShare += (coveredAmount + uncoveredAmount) / trip.participants.length;
        }
      } else {
        // Regular expense
        totalShare += expense.amount / trip.participants.length;
      }
    });

    return totalShare;
  };

  if (loading) {
    return (
      <div className="min-h-screen netflix-gradient flex items-center justify-center">
        <div className="text-white text-lg animate-pulse">Loading trip...</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen netflix-gradient flex items-center justify-center">
        <div className="text-white text-lg">Trip not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen netflix-gradient">
      {/* Sticky Navigation */}
      <div className="sticky top-0 z-50 netflix-glass border-b border-gray-600">
        <div className="responsive-container py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
            <Link to="/trips" className="text-white hover:text-red-400 flex items-center gap-2 transition-colors text-base sm:text-lg">
              <ArrowLeft className="h-4 w-4" />
              Back to Trips
            </Link>
            <div className="flex items-center gap-2">
            <Button 
              variant="netflix-secondary" 
              size="sm"
              onClick={() => {
                localStorage.clear();
                navigate("/");
              }}
            >
              Reset Trip
            </Button>
              {/* Share Button: only show if not shared view and user is owner */}
              {!isSharedView && user && trip && user.id === trip.user_id && (
                <Button
                  variant="netflix"
                  size="sm"
                  onClick={async () => {
                    const shareUrl = `${window.location.origin}/trips/shared/${trip.id}`;
                    await navigator.clipboard.writeText(shareUrl);
                    toast({
                      title: "Link Copied!",
                      description: "Share this link with others to let them view the trip.",
                    });
                  }}
                >
                  Share
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="netflix-card rounded-lg p-3">
              <p className="text-gray-300 text-sm">Initial Pool</p>
              <p className="text-xl font-bold text-blue-400">₹{trip.total_pooled.toLocaleString()}</p>
            </div>
            <div className="netflix-card rounded-lg p-3">
              <p className="text-gray-300 text-sm">Remaining Balance</p>
              <p className="text-xl font-bold text-green-400">₹{getRemainingFund().toLocaleString()}</p>
            </div>
            <div className="netflix-card rounded-lg p-3">
              <p className="text-gray-300 text-sm">From Fund</p>
              <p className="text-xl font-bold text-red-400">₹{getTotalDeductedFromFund().toLocaleString()}</p>
            </div>
            <div className="netflix-card rounded-lg p-3">
              <p className="text-gray-300 text-sm">Participants</p>
              <p className="text-xl font-bold text-yellow-400">{trip.participants.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Join Trip Button for shared view (after sticky nav, before dashboard) */}
      {isSharedView && user && trip && !trip.participants.includes(user.email || user.id) && !hasJoinedAsViewer ? (
        <div className="flex flex-col items-center mt-4 px-2">
          <p className="text-white mb-4 text-center">Join to view trip details</p>
          <Button
            variant="netflix"
            className="w-full max-w-xs"
            onClick={async () => {
              localStorage.setItem(`joined_trip_${tripId}`, 'true');
              setHasJoinedAsViewer(true);
              if (tripId && user && user.id) {
                await addTripViewer(tripId, user.id);
              }
              toast({
                title: "Joined as Viewer!",
                description: "You can now view this trip's details.",
              });
            }}
          >
            Join Trip
          </Button>
        </div>
      ) : (
      <div className="responsive-container py-6 sm:py-8 space-y-8">
        {/* Trip Info */}
        <Card className="netflix-card">
          <CardHeader>
            <CardTitle className="text-white text-lg sm:text-xl md:text-2xl">{trip.name}</CardTitle>
            <CardDescription className="text-gray-300">
              Created on {new Date(trip.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-white font-medium mb-2">Participants:</h4>
                <div className="flex flex-wrap gap-2">
                  {trip.participants.map((participant, index) => (
                    <span key={index} className="bg-red-600/20 text-white px-3 py-1 rounded-full text-sm">
                      {participant}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">Contributions:</h4>
                <div className="space-y-1">
                  {Object.entries(trip.contributions).map(([name, amount]) => (
                    <div key={name} className="flex justify-between text-gray-300">
                      <span>{name}:</span>
                      <span>₹{amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add New Expense */}
        {(!isSharedView) && (
        <Card className="netflix-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
              <Plus className="h-5 w-5" />
              Add New Expense
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-white">Title</Label>
                <Input
                  id="title"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Hotel, Food, Transport"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent w-full"
                />
              </div>
              <div>
                <Label htmlFor="amount" className="text-white">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="pl-8 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent w-full [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <div
                  onClick={() => setNewExpense(prev => ({ 
                    ...prev, 
                    deductFromFund: !prev.deductFromFund,
                    paidBy: !prev.deductFromFund ? "" : prev.paidBy
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 cursor-pointer ${
                    newExpense.deductFromFund 
                      ? 'bg-red-600 shadow-lg shadow-red-600/30' 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-all duration-200 ${
                      newExpense.deductFromFund ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
                <Label htmlFor="deductFromFund" className="text-white font-medium cursor-pointer">Deduct from Pooled Fund</Label>
              </div>
              {(newExpense.deductFromFund && getRemainingFund() < parseFloat(newExpense.amount || "0")) && (
                <div>
                  <Label htmlFor="paidBy" className="text-white">Who will pay the remaining amount?</Label>
                  <Select value={newExpense.paidBy} onValueChange={(value) => setNewExpense(prev => ({ ...prev, paidBy: value }))}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white w-full">
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                      {trip.participants.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {!newExpense.deductFromFund && (
                <div>
                  <Label htmlFor="paidBy" className="text-white">Paid By</Label>
                  <Select value={newExpense.paidBy} onValueChange={(value) => setNewExpense(prev => ({ ...prev, paidBy: value }))}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white w-full">
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                      {trip.participants.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Button onClick={addExpense} variant="netflix" className="w-full">
              Add Expense
            </Button>
          </CardContent>
        </Card>
        )}

        {/* Expenses Table */}
        <Card className="netflix-card">
          <CardHeader>
            <CardTitle className="text-white text-lg sm:text-xl">Expense History</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-gray-300 text-center py-8">No expenses added yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow className="border-gray-600">
                      <TableHead className="text-white">Title</TableHead>
                      <TableHead className="text-white">Amount</TableHead>
                      <TableHead className="text-white">Paid By</TableHead>
                      <TableHead className="text-white">From Fund?</TableHead>
                      <TableHead className="text-white">Per Person</TableHead>
                      {(!isSharedView) && <TableHead className="text-white">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow 
                        key={expense.id} 
                        className={`border-gray-600 ${expense.deduct_from_fund ? 'bg-red-900/20' : ''}`}
                      >
                        <TableCell className={`${expense.deduct_from_fund ? 'text-red-400 font-bold' : 'text-white'}`}> {expense.title} {expense.deduct_from_fund && <span className="ml-2 text-xs">(From Fund)</span>} </TableCell>
                        <TableCell className={`${expense.deduct_from_fund ? 'text-red-400 font-bold' : 'text-white'}`}> ₹{expense.amount.toLocaleString()} </TableCell>
                        <TableCell className={`${expense.deduct_from_fund ? 'text-red-400 font-bold' : 'text-white'}`}> {expense.paid_by} </TableCell>
                        <TableCell className={`${expense.deduct_from_fund ? 'text-red-400 font-bold' : 'text-white'}`}> {expense.deduct_from_fund ? "Yes" : "No"} </TableCell>
                        <TableCell className={`${expense.deduct_from_fund ? 'text-red-400 font-bold' : 'text-white'}`}> ₹{getPerPersonShare(expense).toLocaleString()} </TableCell>
                        {(!isSharedView) && (
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteExpenseHandler(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Reimbursements */}
        {(Object.keys(getPendingReimbursements()).length > 0 && !isSharedView) && (
          <Card className="netflix-card">
            <CardHeader>
              <CardTitle className="text-white text-lg sm:text-xl">🧾 Pending Reimbursements</CardTitle>
              <CardDescription className="text-gray-300">
                Click the button when you receive the payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(getPendingReimbursements()).map(([payer, debtors]) => (
                  <div key={payer} className="netflix-card rounded-lg p-4">
                    <h3 className="text-white text-lg sm:text-xl font-bold mb-4">
                      💰 {payer} (Waiting for payment)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(debtors).map(([debtor, amount]) => (
                        <div key={debtor} className="bg-red-900/20 rounded-lg p-3 border border-red-600/30">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-white font-medium">{debtor}</p>
                              <p className="text-red-400 font-bold text-lg">
                                Owes ₹{amount.toFixed(2)}
                              </p>
                            </div>
                            {receivedPayments[payer]?.[debtor] ? (
                              <div className="flex items-center gap-1 text-green-400 bg-green-900/20 p-2 rounded">
                                <CheckCircle2 className="h-5 w-5" />
                                <span>Received</span>
                              </div>
                            ) : (
                              <Button
                                onClick={() => markAsReceived(payer, debtor)}
                                variant="success"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <CheckCircle2 className="h-5 w-5" />
                                <span>Mark as Received</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settlement Information */}
        <Card className="netflix-card">
          <CardHeader>
            <CardTitle className="text-white text-lg sm:text-xl">Final Settlement</CardTitle>
            <CardDescription className="text-gray-300">
              Total contributions and remaining balances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Individual Contributions and Balances */}
              <div>
                <h4 className="text-white font-medium mb-3">Individual Balances:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {trip.participants.map((name) => {
                    const totalContribution = getTotalContribution(name);
                    const totalExpenseShare = getTotalExpenseShare(name);
                    const balance = totalContribution - totalExpenseShare;
                    return (
                      <div key={name} className="netflix-card rounded-lg p-3">
                        <p className="text-white font-medium">{name}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-blue-400">
                              Initial Contribution: ₹{(trip.contributions[name] ?? 0).toFixed(2)}
                          </p>
                          <p className="text-blue-400">
                              Extra Paid: ₹{(totalContribution - (trip.contributions[name] ?? 0)).toFixed(2)}
                          </p>
                          <p className="text-blue-400">
                            Total Contribution: ₹{totalContribution.toFixed(2)}
                          </p>
                          <p className="text-yellow-400">
                            Total Expense Share: ₹{totalExpenseShare.toFixed(2)}
                          </p>
                          <p className={`text-lg font-bold ${balance > 0 ? 'text-green-400' : balance < 0 ? 'text-red-400' : 'text-white'}`}>
                            Current Balance: {balance > 0 ? '+' : ''}₹{balance.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Settlement Instructions */}
              <div>
                <h4 className="text-white font-medium mb-3">Settlement Instructions:</h4>
                {(() => {
                  const pendingReimbursements = getPendingReimbursements();
                  const allSettlements = [];
                  Object.entries(pendingReimbursements).forEach(([payer, debtors]) => {
                    Object.entries(debtors).forEach(([debtor, amount]) => {
                      const isReceived = receivedPayments[payer]?.[debtor];
                      allSettlements.push({
                        from: debtor,
                        to: payer,
                        amount: amount,
                        status: isReceived ? 'received' : 'pending'
                      });
                    });
                  });
                  if (allSettlements.length === 0) {
                    return <p className="text-green-400 font-medium">All settled! Everyone is even.</p>;
                  }
                  return (
                    <div className="space-y-2">
                      {allSettlements.map((settlement, index) => (
                        <div key={index} className={`netflix-card rounded-lg p-3 ${settlement.status === 'received' ? 'border border-green-600/30' : ''}`}>
                          <p className="text-white">
                            <span className="font-medium text-red-400">{settlement.from}</span>
                            {" owes "}
                            <span className="font-medium text-green-400">{settlement.to}</span>
                            {" "}
                            <span className="font-bold text-yellow-400">₹{settlement.amount.toFixed(2)}</span>
                            {settlement.status === 'received' && (
                              <span className="ml-2 text-green-400">✓ Received</span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
};

export default TripDashboard; 