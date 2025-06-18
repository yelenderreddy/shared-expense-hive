import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calculator, CreditCard, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen netflix-gradient">
      <div className="responsive-container py-6 sm:py-8 md:py-12">
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <h1 className="text-responsive-xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Trip Expense Splitter
          </h1>
          <p className="text-responsive sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
            Manage group expenses effortlessly with pooled funds and automatic settlements
          </p>
          <Link to="/add-members">
            <Button 
              size="lg" 
              variant="netflix"
              className="text-responsive font-semibold px-6 sm:px-8 py-4 sm:py-5 shadow-2xl hover:shadow-3xl"
            >
              Start New Trip
            </Button>
          </Link>
        </div>

        <div className="card-grid mb-8 sm:mb-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <Card className="netflix-card-hover text-white">
            <CardHeader className="text-center pb-4">
              <div className="bg-red-600/20 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Users className="h-8 w-8 text-red-400" />
              </div>
              <CardTitle className="text-responsive">Add Members</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 text-sm sm:text-base">
                Add trip participants and track their contributions
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="netflix-card-hover text-white" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="text-center pb-4">
              <div className="bg-red-600/20 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-red-400" />
              </div>
              <CardTitle className="text-responsive">Pool Funds</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 text-sm sm:text-base">
                Collect initial contributions and manage pooled money
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="netflix-card-hover text-white" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="text-center pb-4">
              <div className="bg-red-600/20 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Calculator className="h-8 w-8 text-red-400" />
              </div>
              <CardTitle className="text-responsive">Track Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 text-sm sm:text-base">
                Add expenses with flexible splitting options
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="netflix-card-hover text-white" style={{ animationDelay: '0.4s' }}>
            <CardHeader className="text-center pb-4">
              <div className="bg-green-600/20 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <CardTitle className="text-responsive">Auto Settlement</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300 text-sm sm:text-base">
                Get automatic settlement calculations and balances
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <Card className="netflix-card max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white text-responsive-lg sm:text-2xl md:text-3xl">How it works</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-red-600 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0">1</div>
                <p className="text-sm sm:text-base md:text-lg text-left">Add all trip participants and their names</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-red-600 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0">2</div>
                <p className="text-sm sm:text-base md:text-lg text-left">Set up initial fund contributions from each member</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-red-600 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0">3</div>
                <p className="text-sm sm:text-base md:text-lg text-left">Track expenses and manage settlements automatically</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
