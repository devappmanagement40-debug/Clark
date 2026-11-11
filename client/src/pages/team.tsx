import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCountryByCode, type ApiCountry } from "@/lib/countries";
import { getQueryFn } from "@/lib/queryClient";
import { parseTeamStats, type TeamStats } from "@/lib/team-stats";
import { useAuth } from "@/lib/auth";
import duluxTeamBanner from "@/assets/images/dulux-team-banner.webp";
import duluxLogo from "@assets/logo_1794316572935.png";
import "./team.css";

type TeamLevelNumber = 1 | 2 | 3;

interface TeamMember {
  id: number;
  maskedPhone: string;
  isDemo: boolean;
  depositAmount: number;
  withdrawalAmount: number;
  createdAt: string | Date;
}

interface DetailedTeam {
  level1: TeamMember[];
  level2: TeamMember[];
  level3: TeamMember[];
  totalLevel1Invested: number;
  totalLevel2Invested: number;
  totalLevel3Invested: number;
}

const getTeamStatsPayload = getQueryFn<unknown>({ on401: "throw" });

function formatNumber(value: number | undefined, loading: boolean) {
  if (loading) return "…";
  return typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("fr-FR")
    : "—";
}

function formatRate(value: string | undefined, loading: boolean) {
  if (loading) return "…";
  if (value === undefined || value.trim() === "") return "—";
  const rate = Number(value);
  return Number.isFinite(rate) && rate >= 0 ? `${rate.toLocaleString("fr-FR")}%` : "—";
}

function formatMoney(value: number | undefined, currency: string, loading: boolean) {
  if (loading) return "…";
  if (value === undefined || !Number.isFinite(value)) return "—";
  return `${currency} ${value.toLocaleString("fr-FR")}`;
}

function formatMemberTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function TeamPage() {
  const [activeLevel, setActiveLevel] = useState<TeamLevelNumber>(1);
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading, isError: statsError, isFetching: statsFetching, refetch: refetchStats } = useQuery<TeamStats>({
    queryKey: ["/api/team/stats"],
    queryFn: async (context) => parseTeamStats(await getTeamStatsPayload(context)),
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const { data: team, isLoading: teamLoading, isError: teamError, isFetching: teamFetching, refetch: refetchTeam } = useQuery<DetailedTeam>({
    queryKey: ["/api/team/details"],
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const { data: settings, isLoading: settingsLoading, isError: settingsError, isFetching: settingsFetching, refetch: refetchSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
  });
  const { data: countries } = useQuery<ApiCountry[]>({ queryKey: ["/api/countries"] });

  if (!user) return null;

  const currency = getCountryByCode(user.country || "", countries)?.currency || "XOF";
  const levelData = [
    {
      number: 1 as const,
      count: stats?.level1Count,
      rate: settings?.level1Commission,
      members: team?.level1 || [],
      consumption: team?.totalLevel1Invested,
    },
    {
      number: 2 as const,
      count: stats?.level2Count,
      rate: settings?.level2Commission,
      members: team?.level2 || [],
      consumption: team?.totalLevel2Invested,
    },
    {
      number: 3 as const,
      count: stats?.level3Count,
      rate: settings?.level3Commission,
      members: team?.level3 || [],
      consumption: team?.totalLevel3Invested,
    },
  ];
  const selectedLevel = levelData[activeLevel - 1];
  const totalMembers = stats
    ? stats.level1Count + stats.level2Count + stats.level3Count
    : undefined;
  const demoMemberCount = stats?.demoMemberCount ?? 0;
  const totalConsumption = team
    ? team.totalLevel1Invested + team.totalLevel2Invested + team.totalLevel3Invested
    : undefined;
  const isBusy = statsLoading || teamLoading || settingsLoading;
  const hasError = statsError || teamError || settingsError;
  const isFetching = statsFetching || teamFetching || settingsFetching;

  return (
    <main className="team-page" aria-busy={isBusy || isFetching}>
      <div className="team-page-inner">
        <header className="team-topbar">
          <h1 data-testid="text-page-title">Team LV.{activeLevel}</h1>
        </header>

        <img
          className="team-banner"
          src={duluxTeamBanner}
          alt="Dulux colours and paint products"
        />

        <div className="team-content">
          <section className="team-summary" aria-label="Team overview">
            <article className="team-summary-card">
              <span>Consumption</span>
              <strong data-testid="text-team-consumption">
                {formatMoney(totalConsumption, currency, teamLoading)}
              </strong>
            </article>
            <article className="team-summary-card">
              <span>Deposit</span>
              <strong data-testid="text-team-deposit">
                {formatMoney(stats?.totalDepositAmount, currency, statsLoading)}
              </strong>
            </article>
            <article className="team-summary-card">
              <span>Team size</span>
              <strong data-testid="text-team-size">
                {formatNumber(totalMembers, statsLoading)}
              </strong>
            </article>
          </section>

          {demoMemberCount > 0 && (
            <p className="team-demo-note">
              {formatNumber(demoMemberCount, false)} demonstration member{demoMemberCount === 1 ? "" : "s"} are included in the team size.
            </p>
          )}

          <nav className="team-level-tabs" aria-label="Choose a team level">
            {levelData.map((level) => (
              <button
                key={level.number}
                type="button"
                className={activeLevel === level.number ? "is-active" : ""}
                onClick={() => setActiveLevel(level.number)}
                aria-pressed={activeLevel === level.number}
                data-testid={`tab-level-${level.number}`}
              >
                <span>LV:{level.number}</span>
                <small>Income {formatRate(level.rate, settingsLoading)}</small>
              </button>
            ))}
          </nav>

          {hasError && (
            <div className="team-error" role="alert">
              <span>Team information could not be fully loaded.</span>
              <button
                type="button"
                onClick={() => void Promise.all([refetchStats(), refetchTeam(), refetchSettings()])}
                disabled={isFetching}
              >
                {isFetching ? "Loading…" : "Retry"}
              </button>
            </div>
          )}

          <section className="team-members" aria-label={`Level ${activeLevel} sponsored members`}>
            {teamLoading ? (
              <div className="team-member-loading" aria-label="Loading team members">
                {[0, 1].map((item) => <div className="team-member-skeleton" key={item} />)}
              </div>
            ) : teamError ? null : selectedLevel.members.length === 0 ? (
              <div className="team-empty">
                <strong>No members in LV:{activeLevel} yet</strong>
                <span>Sponsored members will appear here.</span>
              </div>
            ) : (
              selectedLevel.members.map((member) => (
                <article className="team-member-card" key={member.id} data-testid={`team-member-${member.id}`}>
                  <img className="team-member-logo" src={duluxLogo} alt="Dulux" />
                  <div className="team-member-info">
                    <div className="team-member-phone">
                      <strong>Mobile:</strong>
                      <span data-testid={`text-member-phone-${member.id}`}>{member.maskedPhone}</span>
                      {member.isDemo && <small className="team-demo-badge">Demo</small>}
                    </div>
                    <div className="team-member-balances">
                      <span><b>Deposit:</b> {formatNumber(member.depositAmount, false)}</span>
                      <span><b>Withdraw:</b> {formatNumber(member.withdrawalAmount, false)}</span>
                    </div>
                    <p className="team-member-time">
                      <strong>Time:</strong> {formatMemberTime(member.createdAt)}
                    </p>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
