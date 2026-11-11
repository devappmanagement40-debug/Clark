import { useLocation } from "wouter";
import {
  ChartNoAxesColumnIncreasing,
  PaintRoller,
  Share2,
  ContactRound,
  UsersRound,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Accueil", icon: PaintRoller },
  { path: "/income", label: "Revenus", icon: ChartNoAxesColumnIncreasing },
  { path: "/team", label: "Équipe", icon: UsersRound },
  { path: "/share", label: "Partager", icon: Share2 },
  { path: "/account", label: "Moi", icon: ContactRound },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();
  const isTeam = location === "/team" || location.startsWith("/team-details");
  const isHome = location === "/my-page" || location === "/deposit";
  const isAccount = [
    "/account",
    "/personal-information",
    "/bind-wallet",
    "/change-password",
    "/messages",
    "/history",
    "/deposit-history",
    "/deposits-history",
    "/withdrawal-history",
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
            || (item.path === "/" && location === "/withdrawal")
            || (item.path === "/team" && isTeam)
            || (item.path === "/account" && isAccount)
          );
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                navigate(item.path);
                if (item.path === "/") {
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
