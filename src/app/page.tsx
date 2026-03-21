"use client";

import { useEffect, useState, useCallback } from "react";
import type { Game } from "./api/games/route";

const REFRESH_INTERVAL = 30_000; // 30 seconds

function formatGameTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatGameDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isTomorrow(dateStr: string): boolean {
  const d = new Date(dateStr);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return d.toDateString() === tomorrow.toDateString();
}

function StatusBadge({ state, detail }: { state: string; detail: string }) {
  if (state === "in") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-live" />
        LIVE
        <span className="text-red-300 font-normal ml-1">{detail}</span>
      </span>
    );
  }
  if (state === "post") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30">
        FINAL
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
      {detail}
    </span>
  );
}

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
    <div
      className={`flex items-center justify-between gap-3 ${dimmed ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xs font-bold text-gray-400 w-5 text-right shrink-0">
          {team.seed > 0 && team.seed <= 16 ? team.seed : ""}
        </span>
        <img
          src={team.logo}
          alt={team.name}
          width={32}
          height={32}
          className="w-8 h-8 object-contain shrink-0"
        />
        <div className="min-w-0">
          <p
            className={`font-semibold text-sm truncate ${isWinner ? "text-white" : "text-gray-200"}`}
          >
            {team.name}
          </p>
          <p className="text-xs text-gray-500">{team.record}</p>
        </div>
      </div>
      <span
        className={`text-xl font-bold tabular-nums ${
          state === "pre"
            ? "text-gray-600"
            : isWinner
              ? "text-white"
              : "text-gray-400"
        }`}
      >
        {state === "pre" ? "" : team.score}
      </span>
    </div>
  );
}

function GameCard({ game }: { game: Game }) {
  const borderColor =
    game.state === "in"
      ? "border-red-500/40"
      : game.state === "pre"
        ? "border-blue-500/20"
        : "border-gray-700/50";

  const bgGlow =
    game.state === "in" ? "shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "";

  return (
    <div
      className={`bg-[#1e293b] rounded-xl border ${borderColor} ${bgGlow} p-4 transition-all hover:border-gray-500/50`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {game.region && (
            <span className="px-2 py-0.5 rounded bg-gray-700/50 font-medium">
              {game.region}
            </span>
          )}
          {game.round && <span>{game.round}</span>}
        </div>
        <StatusBadge state={game.state} detail={game.statusDetail} />
      </div>

      {/* Teams */}
      <div className="space-y-3 mb-3">
        <TeamRow
          team={game.awayTeam}
          state={game.state}
          isWinner={game.awayTeam.winner}
        />
        <div className="border-t border-gray-700/30" />
        <TeamRow
          team={game.homeTeam}
          state={game.state}
          isWinner={game.homeTeam.winner}
        />
      </div>

      {/* Footer: Time + Channel + Streaming */}
      <div className="border-t border-gray-700/30 pt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
        <span>{formatGameTime(game.date)}</span>

        {game.tvChannels.length > 0 && (
          <span className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            {game.tvChannels.join(", ")}
          </span>
        )}

        {game.streamingPlatforms.length > 0 && (
          <span className="flex items-center gap-1 text-orange-400">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            {game.streamingPlatforms.join(", ")}
          </span>
        )}

        {game.venue && (
          <span className="ml-auto text-gray-500 hidden sm:inline">
            {game.venueCity}
          </span>
        )}
      </div>
    </div>
  );
}

type GroupedGames = { label: string; games: Game[] }[];

function groupGamesByDate(games: Game[]): GroupedGames {
  const groups: Record<string, Game[]> = {};

  for (const game of games) {
    const dateKey = new Date(game.date).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(game);
  }

  return Object.entries(groups).map(([dateKey, dayGames]) => {
    const sample = dayGames[0].date;
    let label = formatGameDate(sample);
    if (isToday(sample)) label = `Today - ${label}`;
    else if (isTomorrow(sample)) label = `Tomorrow - ${label}`;
    return { label, games: dayGames };
  });
}

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchGames = useCallback(async () => {
    try {
      const res = await fetch("/api/games");
      const data = await res.json();
      setGames(data.games);
      setLastUpdated(data.lastUpdated);
    } catch {
      // silently retry on next interval
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchGames]);

  const grouped = groupGamesByDate(games);
  const liveCount = games.filter((g) => g.state === "in").length;
  const todayCount = games.filter((g) => isToday(g.date)).length;

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          March Madness 2026
        </h1>
        <p className="text-gray-400 text-sm">
          NCAA Tournament Schedule, Scores & Streaming
        </p>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
          {liveCount > 0 && (
            <span className="flex items-center gap-1.5 text-red-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-live" />
              {liveCount} LIVE
            </span>
          )}
          {todayCount > 0 && <span>{todayCount} games today</span>}
          <span>Auto-updates every 30s</span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
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
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
              {group.label}
            </h2>
            <div className="space-y-3">
              {group.games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-10 border-t border-gray-700/30 pt-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Where to Stream
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { channel: "CBS", stream: "Paramount+" },
            { channel: "TBS", stream: "Max" },
            { channel: "TNT", stream: "Max" },
            { channel: "truTV", stream: "Max" },
          ].map((item) => (
            <div
              key={item.channel}
              className="bg-[#1e293b] rounded-lg p-3 border border-gray-700/30"
            >
              <p className="font-semibold text-gray-300">{item.channel}</p>
              <p className="text-orange-400">{item.stream}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 border-t border-gray-700/30 pt-6 pb-8 text-center text-xs text-gray-500 space-y-2">
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
        <p>Data from ESPN. All times shown in your local timezone.</p>
        <div className="flex items-center justify-center gap-4 mt-4 text-gray-400">
          <a
            href="https://skool.com/zero-to-automated"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-orange-400 transition-colors"
          >
            Zero to Automated Community
          </a>
          <span className="text-gray-600">|</span>
          <a
            href="https://youtube.com/@blacksheepsystems"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-orange-400 transition-colors"
          >
            YouTube
          </a>
        </div>
        <p className="text-gray-600 mt-2">
          Built by Zach Lloyd with Claude Code
        </p>
      </footer>
    </main>
  );
}
