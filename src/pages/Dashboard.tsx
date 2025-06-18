import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, CheckCircle2 } from "lucide-react";

interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  splitType: "equal" | "custom";
  deductFromFund: boolean;
  customSplits?: { [key: string]: number };
  createdAt: string;
}

interface TripData {
  participants: string[];
  contributions: { [key: string]: number };
  totalPooled: number;
  expenses: Expense[];
  createdAt: string;
  receivedPayments?: { [payer: string]: { [debtor: string]: boolean } };
}

const Dashboard = () => {
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    paidBy: "",
    splitType: "equal" as "equal" | "custom",
    deductFromFund: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const storedTripData = localStorage.getItem("tripFundData");
    if (!storedTripData) {
      navigate("/add-members");
      return;
    }
    
    setTripData(JSON.parse(storedTripData));
  }, [navigate]);

  const saveTripData = (data: TripData) => {
    localStorage.setItem("tripFundData", JSON.stringify(data));
    setTripData(data);
  };

  const addExpense = () => {
    if (!tripData) return;
    
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

    const expense: Expense = {
      id: Date.now().toString(),
      title: newExpense.title.trim(),
      amount,
      paidBy: newExpense.deductFromFund && getRemainingFund() >= amount ? "Pool Fund" : newExpense.paidBy,
      splitType: newExpense.splitType,
      deductFromFund: newExpense.deductFromFund,
      createdAt: new Date().toISOString(),
    };

    const updatedTripData = {
      ...tripData,
      expenses: [...tripData.expenses, expense]
    };

    saveTripData(updatedTripData);
    
    // Reset form
    setNewExpense({
      title: "",
      amount: "",
      paidBy: "",
      splitType: "equal",
      deductFromFund: false,
    });

    toast({
      title: "Success!",
      description: "Expense added successfully",
    });
  };

  const deleteExpense = (expenseId: string) => {
    if (!tripData) return;
    
    const updatedTripData = {
      ...tripData,
      expenses: tripData.expenses.filter(exp => exp.id !== expenseId)
    };
    
    saveTripData(updatedTripData);
    
    toast({
      title: "Success!",
      description: "Expense deleted",
    });
  };

  const getTotalExpenses = () => {
    if (!tripData) return 0;
    return tripData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getTotalDeductedFromFund = () => {
    if (!tripData) return 0;
    return tripData.expenses
      .filter(expense => expense.deductFromFund)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getRemainingFund = () => {
    if (!tripData) return 0;
    return tripData.totalPooled - getTotalDeductedFromFund();
  };

  const getPerPersonShare = (expense: Expense) => {
    if (!tripData) return 0;
    return expense.amount / tripData.participants.length;
  };

  const calculateSettlements = () => {
    if (!tripData) return {};
    
    const balances: { [key: string]: number } = {};
    let runningFundBalance = tripData.totalPooled;
    
    // Initialize balances with contributions
    tripData.participants.forEach(name => {
      balances[name] = tripData.contributions[name] || 0;
    });

    // Process each expense
    tripData.expenses.forEach(expense => {
      if (expense.deductFromFund) {
        if (runningFundBalance >= expense.amount) {
          // Fund covers the expense fully
          runningFundBalance -= expense.amount;
          // Each person's share is deducted from their contribution
          const perPersonShare = expense.amount / tripData.participants.length;
          tripData.participants.forEach(name => {
            balances[name] -= perPersonShare;
          });
        } else {
          // Fund partially covers the expense
          const coveredAmount = runningFundBalance;
          const uncoveredAmount = expense.amount - coveredAmount;
          runningFundBalance = 0;

          // Deduct each person's share of the covered amount
          const coveredPerPersonShare = coveredAmount / tripData.participants.length;
          tripData.participants.forEach(name => {
            balances[name] -= coveredPerPersonShare;
          });

          // If someone paid the remaining amount
          if (expense.paidBy !== "Pool Fund") {
            // Add the uncovered amount to the payer's balance
            balances[expense.paidBy] += uncoveredAmount;
            
            // Everyone owes their share of the uncovered amount
            const uncoveredPerPersonShare = uncoveredAmount / tripData.participants.length;
            tripData.participants.forEach(name => {
              if (name !== expense.paidBy) {
                balances[name] -= uncoveredPerPersonShare;
              }
            });
          }
        }
      } else {
        // Regular expense - person who paid gets credit, everyone owes their share
        const perPersonShare = expense.amount / tripData.participants.length;
        balances[expense.paidBy] += expense.amount;
        tripData.participants.forEach(name => {
          balances[name] -= perPersonShare;
        });
      }
    });

    // Only adjust balances for payments that have been marked as received
    if (tripData.receivedPayments) {
      Object.entries(tripData.receivedPayments).forEach(([payer, debtors]) => {
        Object.entries(debtors).forEach(([debtor, received]) => {
          if (received && pendingReimbursements[payer]?.[debtor]) {
            // Only adjust if payment is marked as received
            const amount = pendingReimbursements[payer][debtor];
            balances[payer] -= amount; // Reduce payer's positive balance
            balances[debtor] += amount; // Reduce debtor's negative balance
          }
        });
      });
    }

    // Round all balances to 2 decimal places
    Object.keys(balances).forEach(name => {
      balances[name] = Math.round(balances[name] * 100) / 100;
    });

    return balances;
  };

  const getSettlementInstructions = () => {
    const balances = calculateSettlements();
    const settlements = [];
    
    // Filter out very small amounts (less than 0.01)
    const creditors = Object.entries(balances)
      .filter(([_, balance]) => balance > 0.01)
      .sort((a, b) => b[1] - a[1]); // Sort by amount descending
    
    const debtors = Object.entries(balances)
      .filter(([_, balance]) => balance < -0.01)
      .sort((a, b) => a[1] - b[1]); // Sort by amount ascending
    
    creditors.forEach(([creditor, creditAmount]) => {
      debtors.forEach(([debtor, debtAmount]) => {
        if (Math.abs(debtAmount) > 0.01 && creditAmount > 0.01) {
          const settleAmount = Math.min(creditAmount, Math.abs(debtAmount));
          settlements.push({
            from: debtor,
            to: creditor,
            amount: Math.round(settleAmount * 100) / 100, // Round to 2 decimal places
            status: tripData?.receivedPayments?.[creditor]?.[debtor] ? 'received' : 'pending'
          });
          
          balances[creditor] -= settleAmount;
          balances[debtor] += settleAmount;
        }
      });
    });
    
    return settlements;
  };

  const isExpenseOverFund = (expense: Expense) => {
    if (!expense.deductFromFund) return false;
    const remainingFund = getRemainingFund() + getTotalDeductedFromFund();
    return remainingFund <= 0;
  };

  const getPendingReimbursements = () => {
    if (!tripData) return {};
    
    const reimbursements: { [payer: string]: { [debtor: string]: number } } = {};
    let runningFundBalance = tripData.totalPooled;

    // Process expenses chronologically
    tripData.expenses.forEach((expense) => {
      if (expense.deductFromFund) {
        if (runningFundBalance >= expense.amount) {
          // Fund covers the expense fully
          runningFundBalance -= expense.amount;
        } else {
          // Fund partially covers the expense
          const coveredAmount = runningFundBalance;
          const uncoveredAmount = expense.amount - coveredAmount;
          runningFundBalance = 0;

          // If someone paid the remaining amount
          if (expense.paidBy !== "Pool Fund") {
            const payer = expense.paidBy;
            // Calculate per person share for the uncovered amount
            const perPersonShare = uncoveredAmount / tripData.participants.length;
            
            // Add to reimbursements
              if (!reimbursements[payer]) {
                reimbursements[payer] = {};
              }
              
            // Everyone except the payer owes their share
              tripData.participants.forEach(member => {
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
        const payer = expense.paidBy;
        const perPersonShare = expense.amount / tripData.participants.length;
        const payerShare = perPersonShare;
        const extraPaid = expense.amount - payerShare;
        
        if (extraPaid > 0) {
          if (!reimbursements[payer]) {
            reimbursements[payer] = {};
          }
          
          tripData.participants.forEach(member => {
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
    console.log('markAsReceived called with:', { payer, debtor });
    if (!tripData) return;
    
    // Create a new object to ensure state update
    const updatedReceivedPayments = {
      ...(tripData.receivedPayments || {}),
      [payer]: {
        ...(tripData.receivedPayments?.[payer] || {}),
        [debtor]: true
      }
    };
    
    const updatedTripData = {
      ...tripData,
      receivedPayments: updatedReceivedPayments
    };
    
    console.log('Updating trip data with:', updatedTripData);
    
    // Save to localStorage and update state
    localStorage.setItem("tripFundData", JSON.stringify(updatedTripData));
    setTripData(updatedTripData);
    
    toast({
      title: "Success!",
      description: "Payment marked as received",
    });
  };

  const getTotalContribution = (name: string) => {
    if (!tripData) return 0;
    
    // Start with initial contribution
    let total = tripData.contributions[name] || 0;
    
    // Add any extra expenses paid by this person
    tripData.expenses.forEach(expense => {
      if (expense.deductFromFund) {
        const remainingFund = getRemainingFund() + getTotalDeductedFromFund();
        if (remainingFund < expense.amount && expense.paidBy === name) {
          // Add the extra amount they paid beyond pool fund
          const uncoveredAmount = expense.amount - Math.min(expense.amount, remainingFund);
          total += uncoveredAmount;
        }
      } else if (expense.paidBy === name) {
        // Add full amount for non-fund expenses
        total += expense.amount;
      }
    });

    return total;
  };

  const getTotalExpenseShare = (name: string) => {
    if (!tripData) return 0;
    
    let totalShare = 0;
    let runningFundBalance = tripData.totalPooled;

    tripData.expenses.forEach(expense => {
      if (expense.deductFromFund) {
        if (runningFundBalance >= expense.amount) {
          // Fund covers the expense fully
          runningFundBalance -= expense.amount;
          totalShare += expense.amount / tripData.participants.length;
        } else {
          // Fund partially covers the expense
          const coveredAmount = runningFundBalance;
          const uncoveredAmount = expense.amount - coveredAmount;
          runningFundBalance = 0;

          // Add both covered and uncovered shares
          totalShare += (coveredAmount + uncoveredAmount) / tripData.participants.length;
        }
      } else {
        // Regular expense
        totalShare += expense.amount / tripData.participants.length;
      }
    });

    return totalShare;
  };

  if (!tripData) {
    return <div>Loading...</div>;
  }

  const pendingReimbursements = getPendingReimbursements();
  console.log('Pending reimbursements:', pendingReimbursements);

  const PendingReimbursementCard = ({ payer, debtors }: { payer: string; debtors: { [key: string]: number } }) => {
    return (
      <div className="bg-white/20 rounded-lg p-4">
        <h3 className="text-white text-xl font-bold mb-4">
          💰 {payer} (Waiting for payment)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(debtors).map(([debtor, amount]) => {
            console.log('Rendering debtor:', debtor, amount);
            const isReceived = tripData?.receivedPayments?.[payer]?.[debtor];
            return (
              <div key={debtor} className="bg-red-500/20 rounded-lg p-3 border border-red-300/30">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{debtor}</p>
                    <p className="text-red-300 font-bold text-lg">
                      Owes ₹{amount.toFixed(2)}
                    </p>
                  </div>
                  {isReceived ? (
                    <div className="flex items-center gap-1 text-green-400 bg-green-500/20 p-2 rounded">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Received</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        console.log('Button clicked for:', { payer, debtor });
                        markAsReceived(payer, debtor);
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Mark as Received</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen netflix-gradient">
      {/* Sticky Navigation */}
      <div className="sticky top-0 z-50 netflix-glass border-b border-gray-600">
        <div className="responsive-container py-4">
          <div className="flex items-center justify-between mb-4">
            <Link to="/setup-fund" className="text-white hover:text-red-400 flex items-center gap-2 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Fund Setup
            </Link>
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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="netflix-card rounded-lg p-3">
              <p className="text-gray-300 text-sm">Trip Fund Balance</p>
              <p className="text-xl font-bold text-green-400">₹{getRemainingFund().toLocaleString()}</p>
            </div>
            <div className="netflix-card rounded-lg p-3">
              <p className="text-gray-300 text-sm">Total Spent</p>
              <p className="text-xl font-bold text-red-400">₹{getTotalExpenses().toLocaleString()}</p>
            </div>
            <div className="netflix-card rounded-lg p-3">
              <p className="text-gray-300 text-sm">Deducted from Fund</p>
              <p className="text-xl font-bold text-blue-400">₹{getTotalDeductedFromFund().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="responsive-container py-8 space-y-8">
        {/* Add New Expense */}
        <Card className="netflix-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
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
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    className="pl-8 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                      {tripData.participants.map((name) => (
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
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                      {tripData.participants.map((name) => (
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

        {/* Expenses Table */}
        <Card className="netflix-card">
          <CardHeader>
            <CardTitle className="text-white">Expense History</CardTitle>
          </CardHeader>
          <CardContent>
            {tripData.expenses.length === 0 ? (
              <p className="text-gray-300 text-center py-8">No expenses added yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-600">
                      <TableHead className="text-white">Title</TableHead>
                      <TableHead className="text-white">Amount</TableHead>
                      <TableHead className="text-white">Paid By</TableHead>
                      <TableHead className="text-white">From Fund?</TableHead>
                      <TableHead className="text-white">Per Person</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tripData.expenses.map((expense) => (
                      <TableRow 
                        key={expense.id} 
                        className={`border-gray-600 ${isExpenseOverFund(expense) ? 'bg-red-900/20' : ''}`}
                      >
                        <TableCell className={`${isExpenseOverFund(expense) ? 'text-red-400 font-bold' : 'text-white'}`}>
                          {expense.title}
                          {isExpenseOverFund(expense) && <span className="ml-2 text-xs">(Distributed Equally)</span>}
                        </TableCell>
                        <TableCell className={`${isExpenseOverFund(expense) ? 'text-red-400 font-bold' : 'text-white'}`}>
                          ₹{expense.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className={`${isExpenseOverFund(expense) ? 'text-red-400 font-bold' : 'text-white'}`}>
                          {expense.paidBy}
                        </TableCell>
                        <TableCell className={`${isExpenseOverFund(expense) ? 'text-red-400 font-bold' : 'text-white'}`}>
                          {expense.deductFromFund ? "Yes" : "No"}
                        </TableCell>
                        <TableCell className={`${isExpenseOverFund(expense) ? 'text-red-400 font-bold' : 'text-white'}`}>
                          ₹{getPerPersonShare(expense).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Reimbursements */}
        {Object.keys(pendingReimbursements).length > 0 && (
          <Card className="netflix-card">
            <CardHeader>
              <CardTitle className="text-white">🧾 Pending Reimbursements</CardTitle>
              <CardDescription className="text-gray-300">
                Click the button when you receive the payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(pendingReimbursements).map(([payer, debtors]) => {
                  console.log('Rendering reimbursements for payer:', payer, debtors);
                  return (
                    <div key={payer} className="netflix-card rounded-lg p-4">
                      <h3 className="text-white text-xl font-bold mb-4">
                        💰 {payer} (Waiting for payment)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(debtors).map(([debtor, amount]) => {
                          console.log('Rendering debtor:', debtor, amount);
                          return (
                            <div key={debtor} className="bg-red-900/20 rounded-lg p-3 border border-red-600/30">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-white font-medium">{debtor}</p>
                                  <p className="text-red-400 font-bold text-lg">
                                    Owes ₹{amount.toFixed(2)}
                                  </p>
                                </div>
                                {tripData?.receivedPayments?.[payer]?.[debtor] ? (
                                  <div className="flex items-center gap-1 text-green-400 bg-green-900/20 p-2 rounded">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <span>Received</span>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() => {
                                      console.log('Button clicked for:', { payer, debtor });
                                      markAsReceived(payer, debtor);
                                    }}
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
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settlement Information */}
        <Card className="netflix-card">
          <CardHeader>
            <CardTitle className="text-white">Final Settlement</CardTitle>
            <CardDescription className="text-gray-300">
              Total contributions and remaining balances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Individual Contributions and Balances */}
              <div>
                <h4 className="text-white font-medium mb-3">Individual Contributions:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tripData.participants.map((name) => {
                    const totalContribution = getTotalContribution(name);
                    const totalExpenseShare = getTotalExpenseShare(name);
                    const balance = calculateSettlements()[name] || 0;
                    return (
                      <div key={name} className="netflix-card rounded-lg p-3">
                        <p className="text-white font-medium">{name}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-blue-400">
                            Initial Contribution: ₹{tripData.contributions[name].toFixed(2)}
                          </p>
                          <p className="text-blue-400">
                            Extra Paid: ₹{(totalContribution - tripData.contributions[name]).toFixed(2)}
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
                {getSettlementInstructions().length === 0 ? (
                  <p className="text-green-400 font-medium">All settled! Everyone is even.</p>
                ) : (
                  <div className="space-y-2">
                    {getSettlementInstructions().map((settlement, index) => (
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
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
