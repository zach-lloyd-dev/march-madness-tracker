"use client";

import { useEffect, useState, useCallback } from "react";
import type { Game } from "./api/games/route";
import type { BracketGame } from "./api/bracket/route";

const REFRESH_INTERVAL = 30_000;

function formatGameTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatGameDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isToday(dateStr: string): boolean {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function isTomorrow(dateStr: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return new Date(dateStr).toDateString() === tomorrow.toDateString();
}

// ── Status Badge ─────────────────────────────────────────────────────
function StatusBadge({ state, detail }: { state: string; detail: string }) {
  if (state === "in") {
    return (
      <span className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold !bg-red-500/15 !border-red-500/30 text-red-400">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-live shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
        LIVE
        <span className="text-red-300/80 font-normal ml-1">{detail}</span>
      </span>
    );
  }
  if (state === "post") {
    return (
      <span className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-400">
        FINAL
      </span>
    );
  }
  return (
    <span className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold !bg-[#2d68c4]/15 !border-[#4a90e2]/25 text-[#4a90e2]">
      {detail}
    </span>
  );
}

// ── Team Row ─────────────────────────────────────────────────────────
function TeamRow({
  team,
  state,
  isWinner,
}: {
  team: Game["homeTeam"];
  state: string;
  isWinner: boolean;
}) {
  const dimmed = state === "post" && !isWinner;
  return (
    <div className={`flex items-center justify-between gap-3 ${dimmed ? "opacity-35" : ""}`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs font-bold text-[#4a90e2] w-5 text-right shrink-0">
          {team.seed > 0 && team.seed <= 16 ? team.seed : ""}
        </span>
        <img
          src={team.logo}
          alt={team.name}
          width={36}
          height={36}
          className="w-9 h-9 object-contain shrink-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]"
        />
        <div className="min-w-0">
          <p className={`font-semibold text-sm sm:text-base truncate ${isWinner ? "text-white" : "text-gray-200"}`}>
            {team.name}
          </p>
          <p className="text-xs text-gray-500">{team.record}</p>
        </div>
      </div>
      <span
        className={`text-2xl font-bold tabular-nums ${
          state === "pre" ? "text-gray-700" : isWinner ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" : "text-gray-400"
        }`}
      >
        {state === "pre" ? "" : team.score}
      </span>
    </div>
  );
}

// ── Game Card ────────────────────────────────────────────────────────
function GameCard({ game }: { game: Game }) {
  const isLive = game.state === "in";

  return (
    <div className={`glass-card ${isLive ? "glass-card-live" : ""} p-4 sm:p-5`}>
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs">
            {game.region && (
              <span className="px-2.5 py-1 rounded-lg bg-[#2d68c4]/15 text-[#4a90e2] font-semibold border border-[#2d68c4]/20">
                {game.region}
              </span>
            )}
            {game.round && <span className="text-gray-500">{game.round}</span>}
          </div>
          <StatusBadge state={game.state} detail={game.statusDetail} />
        </div>

        {/* Teams */}
        <div className="space-y-3 mb-4">
          <TeamRow team={game.awayTeam} state={game.state} isWinner={game.awayTeam.winner} />
          <div className="border-t border-white/5" />
          <TeamRow team={game.homeTeam} state={game.state} isWinner={game.homeTeam.winner} />
        </div>

        {/* Footer: Time + Channel + Streaming */}
        <div className="border-t border-white/5 pt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Time */}
          <span className="text-sm font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">
            {formatGameTime(game.date)}
          </span>

          {/* TV Channel */}
          {game.tvChannels.length > 0 && (
            <span className="channel-tag flex items-center gap-1.5 text-sm font-bold text-[#4a90e2] px-3 py-1.5 rounded-xl">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {game.tvChannels.join(", ")}
            </span>
          )}

          {/* Streaming */}
          {game.streamingPlatforms.length > 0 && (
            <span className="stream-tag flex items-center gap-1.5 text-sm font-bold text-orange-400 px-3 py-1.5 rounded-xl">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {game.streamingPlatforms.join(", ")}
            </span>
          )}

          {/* Venue */}
          {game.venue && (
            <span className="ml-auto text-xs text-gray-500 hidden sm:inline">
              {game.venueCity}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Bracket Mini Game ────────────────────────────────────────────────
function BracketMiniGame({ game }: { game: BracketGame }) {
  const t1 = game.team1;
  const t2 = game.team2;
  const isLive = game.state === "in";
  const isFinal = game.state === "post";

  return (
    <div className={`text-[10px] leading-tight rounded-lg border min-w-[130px] ${
      isLive
        ? "border-red-500/40 bg-red-500/5"
        : "border-white/8 bg-white/[0.03]"
    }`}>
      <div className={`flex items-center gap-1 px-1.5 py-1 ${isFinal && !t1.winner ? "opacity-35" : ""}`}>
        {t1.logo ? <img src={t1.logo} alt="" className="w-3 h-3 object-contain" /> : <span className="w-3 h-3" />}
        <span className="text-[#4a90e2] w-3 text-right">{t1.seed > 0 ? t1.seed : ""}</span>
        <span className={`flex-1 truncate ${t1.winner ? "text-white font-semibold" : "text-gray-300"}`}>
          {t1.abbreviation || "TBD"}
        </span>
        {(isLive || isFinal) && (
          <span className={`font-bold tabular-nums ${t1.winner ? "text-white" : "text-gray-500"}`}>{t1.score}</span>
        )}
      </div>
      <div className="border-t border-white/5" />
      <div className={`flex items-center gap-1 px-1.5 py-1 ${isFinal && !t2.winner ? "opacity-35" : ""}`}>
        {t2.logo ? <img src={t2.logo} alt="" className="w-3 h-3 object-contain" /> : <span className="w-3 h-3" />}
        <span className="text-[#4a90e2] w-3 text-right">{t2.seed > 0 ? t2.seed : ""}</span>
        <span className={`flex-1 truncate ${t2.winner ? "text-white font-semibold" : "text-gray-300"}`}>
          {t2.abbreviation || "TBD"}
        </span>
        {(isLive || isFinal) && (
          <span className={`font-bold tabular-nums ${t2.winner ? "text-white" : "text-gray-500"}`}>{t2.score}</span>
        )}
      </div>
    </div>
  );
}

// ── Bracket Column ───────────────────────────────────────────────────
function BracketColumn({ title, games }: { title: string; games: BracketGame[] }) {
  return (
    <div className="flex flex-col gap-2 min-w-[140px]">
      <h4 className="text-[10px] font-bold text-[#4a90e2] uppercase tracking-wider text-center mb-1 whitespace-nowrap">
        {title}
      </h4>
      <div className="flex flex-col justify-around flex-1 gap-1">
        {games.map((g) => (
          <BracketMiniGame key={g.id} game={g} />
        ))}
      </div>
    </div>
  );
}

// ── Bracket Region ───────────────────────────────────────────────────
function BracketRegion({ region, games }: { region: string; games: BracketGame[] }) {
  const rounds = [1, 2, 3, 4];
  const roundNames = ["1st Round", "2nd Round", "Sweet 16", "Elite 8"];

  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-white mb-3 text-center px-3 py-1.5 rounded-xl bg-[#2d68c4]/15 border border-[#2d68c4]/25">
        {region} Region
      </h3>
      <div className="flex gap-3 items-stretch">
        {rounds.map((r, i) => {
          const roundGames = games.filter((g) => g.round === r);
          if (roundGames.length === 0 && r > 2) {
            const placeholderCount = r === 3 ? 2 : 1;
            const placeholders: BracketGame[] = Array.from({ length: placeholderCount }, (_, j) => ({
              id: `${region}-${r}-${j}`,
              round: r,
              roundName: roundNames[i],
              region,
              state: "pre" as const,
              statusDetail: "TBD",
              date: "",
              team1: { name: "TBD", shortName: "TBD", abbreviation: "TBD", logo: "", seed: 0, score: 0, winner: false },
              team2: { name: "TBD", shortName: "TBD", abbreviation: "TBD", logo: "", seed: 0, score: 0, winner: false },
            }));
            return <BracketColumn key={r} title={roundNames[i]} games={placeholders} />;
          }
          return <BracketColumn key={r} title={roundNames[i]} games={roundGames} />;
        })}
      </div>
    </div>
  );
}

// ── Full Bracket Modal ───────────────────────────────────────────────
function BracketModal({
  games,
  onClose,
}: {
  games: BracketGame[];
  onClose: () => void;
}) {
  const regions = ["South", "East", "Midwest", "West"];
  const finalFourGames = games.filter((g) => g.round === 5);
  const championshipGames = games.filter((g) => g.round === 6);

  return (
    <div
      className="fixed inset-0 z-50 bracket-backdrop bg-black/70 flex items-start justify-center p-4 pt-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-card !rounded-2xl w-full max-w-[95vw] max-h-[90vh] flex flex-col !bg-[rgba(10,20,40,0.85)]">
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
            <h2 className="text-lg font-bold text-white">2026 NCAA Tournament Bracket</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Bracket Grid */}
          <div className="bracket-scroll p-4 flex-1 min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-[600px]">
              {regions.map((region) => (
                <BracketRegion
                  key={region}
                  region={region}
                  games={games.filter((g) => g.region === region)}
                />
              ))}
            </div>

            {/* Final Four + Championship */}
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="flex gap-6 items-start">
                {finalFourGames.length > 0 && (
                  <BracketColumn title="Final Four" games={finalFourGames} />
                )}
                {championshipGames.length > 0 && (
                  <BracketColumn title="Championship" games={championshipGames} />
                )}
                {finalFourGames.length === 0 && (
                  <div className="text-center text-gray-500 text-xs py-4">
                    Final Four matchups TBD
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bracket Preview Thumbnail ────────────────────────────────────────
function BracketPreview({
  games,
  onClick,
}: {
  games: BracketGame[];
  onClick: () => void;
}) {
  const completedCount = games.filter((g) => g.state === "post").length;
  const totalCount = games.length;
  const liveCount = games.filter((g) => g.state === "in").length;

  return (
    <button
      onClick={onClick}
      className="bracket-preview fixed top-4 right-4 z-40 rounded-2xl p-3.5 cursor-pointer group"
      title="View Full Bracket"
    >
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-[#4a90e2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
        <span className="text-xs font-bold text-white">Bracket</span>
        {liveCount > 0 && (
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-live shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
        )}
      </div>
      {/* Mini bracket visual */}
      <div className="grid grid-cols-4 gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-1.5 rounded-sm ${
              i < completedCount * (16 / Math.max(totalCount, 1))
                ? "bg-[#4a90e2] shadow-[0_0_4px_rgba(74,144,226,0.4)]"
                : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <p className="text-[9px] text-gray-400 mt-2 text-center">
        {completedCount}/{totalCount} games
      </p>
    </button>
  );
}

// ── Group Games by Date ──────────────────────────────────────────────
type GroupedGames = { label: string; games: Game[] }[];

function groupGamesByDate(games: Game[]): GroupedGames {
  const groups: Record<string, Game[]> = {};
  for (const game of games) {
    const dateKey = new Date(game.date).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(game);
  }
  return Object.entries(groups).map(([, dayGames]) => {
    const sample = dayGames[0].date;
    let label = formatGameDate(sample);
    if (isToday(sample)) label = `Today - ${label}`;
    else if (isTomorrow(sample)) label = `Tomorrow - ${label}`;
    return { label, games: dayGames };
  });
}

// ── Main Page ────────────────────────────────────────────────────────
export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [bracketGames, setBracketGames] = useState<BracketGame[]>([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading] = useState(true);
  const [showBracket, setShowBracket] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [gamesRes, bracketRes] = await Promise.all([
        fetch("/api/games"),
        fetch("/api/bracket"),
      ]);
      const gamesData = await gamesRes.json();
      const bracketData = await bracketRes.json();
      setGames(gamesData.games);
      setBracketGames(bracketData.games);
      setLastUpdated(gamesData.lastUpdated);
    } catch {
      // retry on next interval
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowBracket(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const grouped = groupGamesByDate(games);
  const liveCount = games.filter((g) => g.state === "in").length;
  const todayCount = games.filter((g) => isToday(g.date)).length;

  return (
    <div className="ambient-bg min-h-screen">
      {/* Bracket Preview (top-right) */}
      {bracketGames.length > 0 && !showBracket && (
        <BracketPreview games={bracketGames} onClick={() => setShowBracket(true)} />
      )}

      {/* Bracket Modal */}
      {showBracket && (
        <BracketModal games={bracketGames} onClose={() => setShowBracket(false)} />
      )}

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight drop-shadow-[0_0_30px_rgba(45,104,196,0.3)]">
            March Madness{" "}
            <span className="text-[#4a90e2] drop-shadow-[0_0_20px_rgba(74,144,226,0.4)]">2026</span>
          </h1>
          <h2 className="text-lg sm:text-xl text-gray-300 font-medium max-w-lg mx-auto leading-relaxed">
            Every game. Every channel. Every stream.
            <br />
            <span className="text-gray-400">No digging required.</span>
          </h2>
          <div className="flex items-center justify-center gap-4 sm:gap-6 mt-5">
            {liveCount > 0 && (
              <span className="glass-pill !bg-red-500/10 !border-red-500/25 inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse-live shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                {liveCount} LIVE
              </span>
            )}
            {todayCount > 0 && (
              <span className="glass-pill inline-flex items-center px-4 py-2 rounded-full text-base font-semibold text-gray-200">
                {todayCount} games today
              </span>
            )}
            <span className="text-sm text-gray-500">Auto-updates every 30s</span>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#4a90e2] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(74,144,226,0.3)]" />
          </div>
        )}

        {/* No Games */}
        {!loading && games.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No tournament games scheduled</p>
            <p className="text-sm mt-2">Check back closer to game day</p>
          </div>
        )}

        {/* Game Groups */}
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.label}>
              <h2 className="text-sm font-bold text-[#4a90e2] uppercase tracking-wider mb-4 px-1 flex items-center gap-2">
                <span className="w-1 h-5 bg-[#2d68c4] rounded-full shadow-[0_0_8px_rgba(45,104,196,0.4)]" />
                {group.label}
              </h2>
              <div className="space-y-4">
                {group.games.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Streaming Legend */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <h3 className="text-xs font-bold text-[#4a90e2] uppercase tracking-wider mb-4">
            Where to Stream
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { channel: "CBS", stream: "Paramount+" },
              { channel: "TBS", stream: "Max" },
              { channel: "TNT", stream: "Max" },
              { channel: "truTV", stream: "Max" },
            ].map((item) => (
              <div
                key={item.channel}
                className="glass-card !rounded-xl p-3.5 text-sm"
              >
                <div className="relative z-10">
                  <p className="font-bold text-white">{item.channel}</p>
                  <p className="text-orange-400 font-semibold">{item.stream}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-white/5 pb-8 text-center text-xs text-gray-500 space-y-2">
          {lastUpdated && (
            <p>
              Last updated:{" "}
              {new Date(lastUpdated).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
                timeZoneName: "short",
              })}
            </p>
          )}
          <p>Data from ESPN. All times in your local timezone.</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-gray-400">
            <a
              href="https://skool.com/zero-to-automated"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#4a90e2] transition-colors"
            >
              Zero to Automated Community
            </a>
            <span className="text-gray-600">|</span>
            <a
              href="https://youtube.com/@blacksheepsystems"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#4a90e2] transition-colors"
            >
              YouTube
            </a>
          </div>
          <p className="text-gray-600 mt-2">Built by Zach Lloyd with Claude Code</p>
        </footer>
      </main>
    </div>
  );
}
