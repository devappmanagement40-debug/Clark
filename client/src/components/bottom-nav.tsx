import { useLocation } from "wouter";
import {
  ChartNoAxesColumnIncreasing,
  PaintRoller,
  Share2,
  ContactRound,
  UsersRound,
} from "lucide-react";

const navItems = [
  { path: "/my-page/home", label: "Accueil", icon: PaintRoller },
  { path: "/my-page/income", label: "Revenus", icon: ChartNoAxesColumnIncreasing },
  { path: "/my-page/team", label: "Équipe", icon: UsersRound },
  { path: "/my-page/share", label: "Partager", icon: Share2 },
  { path: "/my-page/account", label: "Moi", icon: ContactRound },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();
  const isTeam = location === "/my-page/team" || location.startsWith("/my-page/team-details");
  const isHome = location === "/my-page/home" || location === "/my-page/deposit";
  const isAccount = [
    "/my-page/account",
    "/my-page/personal-information",
    "/my-page/bind-wallet",
    "/my-page/change-password",
    "/my-page/messages",
    "/my-page/history",
    "/my-page/deposit-history",
    "/my-page/deposits-history",
    "/my-page/withdrawal-history",
    "/my-page/partner-missions",
  ].includes(location);

  return (
    <nav
      className={`bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-[0_-1px_2px_rgba(0,0,0,.05)] ${isHome ? "cp-bottom-nav" : ""}`}
      style={{
        borderColor: "rgba(220, 226, 235, 0.95)",
      }}
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex h-[59px] max-w-[500px] items-center justify-around pb-1">
        {navItems.map((item) => {
          const isActive = (
            location === item.path
            || (item.path === "/my-page/home" && location === "/my-page/withdrawal")
            || (item.path === "/my-page/team" && isTeam)
            || (item.path === "/my-page/account" && isAccount)
          );
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                navigate(item.path);
                if (item.path === "/my-page/home") {
                  window.dispatchEvent(new Event("home-tab-clicked"));
                }
              }}
              className="flex h-full flex-1 flex-col items-center justify-center gap-[3px]"
              data-testid={`nav-${item.label.toLowerCase().replaceAll(" ", "-")}`}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              <span
                aria-hidden="true"
                className={`bottom-nav-icon-wrap grid h-[34px] w-[58px] place-items-center rounded-full transition-colors ${isActive ? "bg-[#123f83] text-white shadow-[0_3px_7px_rgba(18,63,131,0.25)]" : "bg-transparent text-[#979eaa]"}`}
              >
                <Icon className="bottom-nav-icon h-[23px] w-[23px]" strokeWidth={1.8} />
              </span>
              <span
                className="text-[12px] font-medium leading-none"
                  style={{
                    color: isActive ? "#073579" : "#55565a",
                  }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
