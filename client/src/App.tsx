import { lazy, Suspense } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import BottomNav from "@/components/bottom-nav";
import FloatingSupport from "@/components/floating-support";
import GlobalProcessingOverlay, { ProcessingOverlay } from "@/components/global-processing-overlay";
import { ADMIN_PATH } from "@/lib/admin-path";

const LoginPage = lazy(() => import("@/pages/login"));
const RegisterPage = lazy(() => import("@/pages/register"));
const HomePage = lazy(() => import("@/pages/home"));
const TasksPage = lazy(() => import("@/pages/tasks"));
const InvestPage = lazy(() => import("@/pages/invest"));
const TeamPage = lazy(() => import("@/pages/team"));
const AccountPage = lazy(() => import("@/pages/account"));
const AdminPage = lazy(() => import("@/pages/admin"));
const AdminTeamPage = lazy(() => import("@/pages/admin-team"));
const BankerPage = lazy(() => import("@/pages/banker"));
const DepositPage = lazy(() => import("@/pages/deposit"));
const RobotPayPage = lazy(() => import("@/pages/robotpay"));
const WithdrawalPage = lazy(() => import("@/pages/withdrawal"));
const HistoryPage = lazy(() => import("@/pages/history"));
const ServicePage = lazy(() => import("@/pages/service"));
const MessagesPage = lazy(() => import("@/pages/messages"));
const WalletPage = lazy(() => import("@/pages/wallet"));
const IncomePage = lazy(() => import("@/pages/income"));
const SharePage = lazy(() => import("@/pages/share"));
const ChangePasswordPage = lazy(() => import("@/pages/change-password"));
const PersonalInformationPage = lazy(() => import("@/pages/personal-information"));
const BindWalletPage = lazy(() => import("@/pages/bind-wallet"));
const AboutPage = lazy(() => import("@/pages/about"));
const RulesPage = lazy(() => import("@/pages/rules"));
const GiftCodePage = lazy(() => import("@/pages/gift-code"));
const TeamDetailsPage = lazy(() => import("@/pages/team-details"));
const ProductsPage = lazy(() => import("@/pages/products"));
const RewardsPage = lazy(() => import("@/pages/rewards"));
const DepositOrdersPage = lazy(() => import("@/pages/deposit-orders"));
const SalaryBonusPage = lazy(() => import("@/pages/salary-bonus"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoading() {
  return <ProcessingOverlay variant="refresh" />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) return <PageLoading />;

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Compte suspendu</h1>
          <p className="text-muted-foreground">Votre compte a été suspendu. Contactez le support.</p>
        </div>
      </div>
    );
  }

  if ((user as any).isBanker && !user.isAdmin && location !== "/banker") {
    return <Redirect to="/banker" />;
  }

  return <>{children}</>;
}

function BankerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoading />;

  if (!user) return <Redirect to="/login" />;
  if (!(user as any).isBanker && !user.isAdmin) return <Redirect to="/my-page" />;

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoading />;

  if (!user || !user.isAdmin) {
    return <Redirect to="/my-page" />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoading />;

  if (user) {
    return <Redirect to="/my-page" />;
  }

  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const usesWhiteAccountShell = [
    "/account",
    "/personal-information",
    "/bind-wallet",
    "/change-password",
    "/about",
    "/rules",
    "/messages",
  ].includes(location);

  return (
    <div className={`min-h-screen ${usesWhiteAccountShell ? "bg-white pb-0" : "bg-background pb-16"}`}>
      {children}
      <BottomNav />
    </div>
  );
}

function BrandThemeScope({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isDashboard = location === "/my-page";
  return <div className={!isDashboard ? "equinor-theme" : undefined}>{children}</div>;
}

function FloatingGiftCodeButtonOnHome() {
  const [location] = useLocation();
  return location === "/my-page" ? <FloatingSupport /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      </Route>
      <Route path="/register">
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      </Route>
      <Route path="/html/register">
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      </Route>
      <Route path="/invitation">
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      </Route>
      <Route path="/rejoindre">
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      </Route>
      <Route path="/my-page">
        <ProtectedRoute>
          <AppLayout>
            <HomePage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <Redirect to={`/my-page${window.location.search}`} />
      </Route>
      <Route path="/tasks">
        <ProtectedRoute>
          <AppLayout>
            <TasksPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/invest">
        <ProtectedRoute>
          <AppLayout>
            <InvestPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/products">
        <ProtectedRoute>
          <AppLayout>
            <ProductsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/orders">
        <ProtectedRoute>
          <Redirect to="/income" />
        </ProtectedRoute>
      </Route>
      <Route path="/team">
        <ProtectedRoute>
          <AppLayout>
            <TeamPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/my-products">
        <ProtectedRoute>
          <Redirect to="/income" />
        </ProtectedRoute>
      </Route>
      <Route path="/account">
        <ProtectedRoute>
          <AppLayout>
            <AccountPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/personal-information">
        <ProtectedRoute>
          <AppLayout>
            <PersonalInformationPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/bind-wallet">
        <ProtectedRoute>
          <AppLayout>
            <BindWalletPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/deposit">
        <ProtectedRoute>
          <DepositPage />
        </ProtectedRoute>
      </Route>
      <Route path="/robotpay">
        <ProtectedRoute>
          <RobotPayPage />
        </ProtectedRoute>
      </Route>
      <Route path="/withdrawal">
        <ProtectedRoute>
          <AppLayout>
            <WithdrawalPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/deposit-history">
        <ProtectedRoute>
          <HistoryPage />
        </ProtectedRoute>
      </Route>
      <Route path="/deposits-history">
        <ProtectedRoute>
          <HistoryPage />
        </ProtectedRoute>
      </Route>
      <Route path="/history">
        <ProtectedRoute>
          <HistoryPage />
        </ProtectedRoute>
      </Route>
      <Route path="/withdrawal-history">
        <ProtectedRoute>
          <HistoryPage />
        </ProtectedRoute>
      </Route>
      <Route path="/deposit-orders">
        <ProtectedRoute>
          <DepositOrdersPage />
        </ProtectedRoute>
      </Route>
      <Route path="/service">
        <ProtectedRoute>
          <ServicePage />
        </ProtectedRoute>
      </Route>
      <Route path="/messages">
        <ProtectedRoute>
          <AppLayout>
            <MessagesPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/wallet">
        <ProtectedRoute>
          <WalletPage />
        </ProtectedRoute>
      </Route>
      <Route path="/income">
        <ProtectedRoute>
          <AppLayout>
            <IncomePage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/share">
        <ProtectedRoute>
          <AppLayout>
            <SharePage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/change-password">
        <ProtectedRoute>
          <AppLayout>
            <ChangePasswordPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/about">
        <ProtectedRoute>
          <AboutPage />
        </ProtectedRoute>
      </Route>
      <Route path="/rules">
        <ProtectedRoute>
          <RulesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/gift-code">
        <ProtectedRoute>
          <GiftCodePage />
        </ProtectedRoute>
      </Route>
      <Route path="/team-details">
        <ProtectedRoute>
          <AppLayout>
            <TeamDetailsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/daily-bonus">
        <ProtectedRoute>
          <AppLayout>
            <RewardsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/salary-bonus">
        <ProtectedRoute>
          <AppLayout>
            <SalaryBonusPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      {/* /admin is a decoy — the server already returns 404 for it,
          but we also map it to NotFound on the client to be thorough. */}
      <Route path="/admin" component={NotFound} />
      <Route path="/admin/:rest*" component={NotFound} />
      {/* The route is public in the client bundle; admin access is enforced by session and server-side role checks. */}
      <Route path={ADMIN_PATH}>
        <AdminRoute>
          <AdminPage />
        </AdminRoute>
      </Route>
      <Route path={`${ADMIN_PATH}/team/:id`}>
        <AdminRoute>
          <AdminTeamPage />
        </AdminRoute>
      </Route>
      <Route path="/banker">
        <BankerRoute>
          <BankerPage />
        </BankerRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrandThemeScope>
            <Suspense fallback={<PageLoading />}>
              <Router />
            </Suspense>
            <GlobalProcessingOverlay />
            <FloatingGiftCodeButtonOnHome />
            <Toaster />
          </BrandThemeScope>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
