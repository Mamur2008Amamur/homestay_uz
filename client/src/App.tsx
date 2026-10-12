import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthDialog } from "./components/AuthDialog";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import ListingDetail from "./pages/ListingDetail";
import PostRoom from "./pages/PostRoom";
import InfoPage from "./pages/InfoPage";
import PaymentPage from "./pages/PaymentPage";
import HostProfile from "./pages/HostProfile";
import AdminPanel from "./pages/AdminPanel";
import MyBookings from "./pages/MyBookings";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/"        component={Home} />
      <Route path="/search"  component={SearchResults} />
      <Route path="/stay/:id" component={ListingDetail} />
      <Route path="/post"     component={PostRoom} />
      <Route path="/payment" component={PaymentPage} />
      <Route path="/host/:id" component={HostProfile} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/my-bookings" component={MyBookings} />
      <Route path="/about">   <InfoPage type="about" />   </Route>
      <Route path="/hosting"> <InfoPage type="hosting" /> </Route>
      <Route path="/inspire"> <InfoPage type="inspire" /> </Route>
      <Route path="/reviews"> <InfoPage type="reviews" /> </Route>
      <Route path="/help">    <InfoPage type="help" />    </Route>
      <Route path="/404"     component={NotFound} />
      <Route                 component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <AuthDialog />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
