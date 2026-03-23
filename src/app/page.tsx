"use client";

import { useEffect, useState, useCallback } from "react";
import type { Game } from "./api/games/route";
import type { BracketGame } from "./api/bracket/route";

const REFRESH_INTERVAL = 30_000;

function formatGameTime(dateStr: string): string {
  const d = new Date(dateStr);
  const local = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const et = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
  // If user is already in ET, don't show duplicate
  const localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (localTZ === "America/New_York") return local;
  return `${local} / ${et} ET`;
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
        <img src={team.logo} alt={team.name} width={36} height={36} className="w-9 h-9 object-contain shrink-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]" />
        <div className="min-w-0">
          <p className={`font-semibold text-sm sm:text-base truncate ${isWinner ? "text-white" : "text-gray-200"}`}>{team.name}</p>
          <p className="text-xs text-gray-500">{team.record}</p>
        </div>
      </div>
      <span className={`text-2xl font-bold tabular-nums ${state === "pre" ? "text-gray-700" : isWinner ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" : "text-gray-400"}`}>
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs">
            {game.region && (
              <span className="px-2.5 py-1 rounded-lg bg-[#2d68c4]/15 text-[#4a90e2] font-semibold border border-[#2d68c4]/20">{game.region}</span>
            )}
            {game.round && <span className="text-gray-500">{game.round}</span>}
          </div>
          <StatusBadge state={game.state} detail={game.statusDetail} />
        </div>
        <div className="space-y-3 mb-4">
          <TeamRow team={game.awayTeam} state={game.state} isWinner={game.awayTeam.winner} />
          <div className="border-t border-white/5" />
          <TeamRow team={game.homeTeam} state={game.state} isWinner={game.homeTeam.winner} />
        </div>
        <div className="border-t border-white/5 pt-3 flex flex-wrap items-center gap-2 sm:gap-x-4 sm:gap-y-2">
          <span className="text-xs sm:text-sm font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">{formatGameTime(game.date)}</span>
          {game.tvChannels.length > 0 && (
            <span className="channel-tag flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-bold text-[#4a90e2] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              {game.tvChannels.join(", ")}
            </span>
          )}
          {game.streamingPlatforms.length > 0 && (
            <span className="stream-tag flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-bold text-orange-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              {game.streamingPlatforms.join(", ")}
            </span>
          )}
          {game.venue && <span className="ml-auto text-xs text-gray-500 hidden sm:inline">{game.venueCity}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Bracket Mini Game (for modal) ────────────────────────────────────
function BracketMiniGame({ game }: { game: BracketGame }) {
  const t1 = game.team1;
  const t2 = game.team2;
  const isLive = game.state === "in";
  const isFinal = game.state === "post";
  const isUpcoming = game.state === "pre";
  const isTBD = t1.abbreviation === "TBD" && t2.abbreviation === "TBD";

  // Format time for upcoming games
  const gameTime = game.date
    ? new Date(game.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })
    : "";

  return (
    <div className={`text-[11px] leading-tight rounded-lg border min-w-[150px] ${
      isLive ? "border-red-500/40 bg-red-500/5" : "border-white/8 bg-white/[0.03]"
    }`}>
      {/* Status bar: time for upcoming, LIVE for in-progress, FINAL for done */}
      {!isTBD && (
        <div className={`px-2 py-0.5 text-[9px] font-semibold text-center border-b ${
          isLive
            ? "bg-red-500/10 text-red-400 border-red-500/20"
            : isFinal
              ? "bg-white/[0.02] text-gray-500 border-white/5"
              : "bg-[#2d68c4]/10 text-[#4a90e2] border-white/5"
        }`}>
          {isLive && (
            <span className="flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-live" />
              {game.statusDetail}
            </span>
          )}
          {isFinal && "FINAL"}
          {isUpcoming && gameTime}
        </div>
      )}
      {/* Team 1 */}
      <div className={`flex items-center gap-1.5 px-2 py-1.5 ${isFinal && !t1.winner ? "opacity-35" : ""}`}>
        {t1.logo ? (
          <img src={t1.logo} alt="" className="w-4 h-4 object-contain shrink-0" />
        ) : (
          <span className="w-4 h-4 flex items-center justify-center text-[9px] text-gray-500 shrink-0">
            {isTBD ? "?" : ""}
          </span>
        )}
        <span className="text-[#4a90e2] w-3 text-right shrink-0 font-semibold">{t1.seed > 0 ? t1.seed : ""}</span>
        <span className={`flex-1 truncate ${t1.winner ? "text-white font-bold" : isTBD ? "text-gray-600 italic" : "text-gray-300"}`}>
          {isTBD && !t1.logo ? "TBD" : t1.abbreviation}
        </span>
        {(isLive || isFinal) && (
          <span className={`font-bold tabular-nums ${t1.winner ? "text-white" : "text-gray-500"}`}>{t1.score}</span>
        )}
      </div>
      <div className="border-t border-white/5" />
      {/* Team 2 */}
      <div className={`flex items-center gap-1.5 px-2 py-1.5 ${isFinal && !t2.winner ? "opacity-35" : ""}`}>
        {t2.logo ? (
          <img src={t2.logo} alt="" className="w-4 h-4 object-contain shrink-0" />
        ) : (
          <span className="w-4 h-4 flex items-center justify-center text-[9px] text-gray-500 shrink-0">
            {isTBD ? "?" : ""}
          </span>
        )}
        <span className="text-[#4a90e2] w-3 text-right shrink-0 font-semibold">{t2.seed > 0 ? t2.seed : ""}</span>
        <span className={`flex-1 truncate ${t2.winner ? "text-white font-bold" : isTBD ? "text-gray-600 italic" : "text-gray-300"}`}>
          {isTBD && !t2.logo ? "TBD" : t2.abbreviation}
        </span>
        {(isLive || isFinal) && (
          <span className={`font-bold tabular-nums ${t2.winner ? "text-white" : "text-gray-500"}`}>{t2.score}</span>
        )}
      </div>
    </div>
  );
}

// ── Bracket Matchup Pair (connects two games to one next-round game) ──
function BracketMatchupPair({
  game1,
  game2,
  nextGame,
  isLast,
}: {
  game1: BracketGame;
  game2: BracketGame;
  nextGame: BracketGame | null;
  isLast: boolean;
}) {
  return (
    <div className="flex items-stretch">
      {/* Two feeder games */}
      <div className="flex flex-col justify-center gap-1">
        <BracketMiniGame game={game1} />
        <BracketMiniGame game={game2} />
      </div>
      {/* Connector lines */}
      <div className="flex items-stretch w-6 shrink-0">
        <div className="flex flex-col w-3">
          <div className="flex-1 border-b border-r border-white/15 rounded-br-none" />
          <div className="flex-1 border-t border-r border-white/15 rounded-tr-none" />
        </div>
        <div className="flex items-center w-3">
          <div className="w-full border-t border-white/15" />
        </div>
      </div>
      {/* Next round game */}
      {nextGame && (
        <div className="flex items-center">
          <BracketMiniGame game={nextGame} />
        </div>
      )}
    </div>
  );
}

// ── TBD Placeholder ──────────────────────────────────────────────────
function makeTBD(id: string): BracketGame {
  return {
    id,
    round: 0,
    roundName: "",
    region: "",
    state: "pre",
    statusDetail: "TBD",
    date: "",
    team1: { name: "TBD", shortName: "TBD", abbreviation: "TBD", logo: "", seed: 0, score: 0, winner: false },
    team2: { name: "TBD", shortName: "TBD", abbreviation: "TBD", logo: "", seed: 0, score: 0, winner: false },
  };
}

// ── Bracket Sorting ──────────────────────────────────────────────────
// Standard NCAA bracket: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
const R1_TOP_SEED_ORDER = [1, 8, 5, 4, 6, 3, 7, 2];

// Each pair of R1 games feeds one R2 game. Group by which seeds appear.
const BRACKET_QUADRANTS = [
  new Set([1, 16, 8, 9]),   // R1 pair 0+1 → R2 game 0
  new Set([5, 12, 4, 13]),  // R1 pair 2+3 → R2 game 1
  new Set([6, 11, 3, 14]),  // R1 pair 4+5 → R2 game 2
  new Set([7, 10, 2, 15]),  // R1 pair 6+7 → R2 game 3
];

const BRACKET_HALVES = [
  new Set([1, 16, 8, 9, 5, 12, 4, 13]),  // Top half → S16 game 0
  new Set([6, 11, 3, 14, 7, 10, 2, 15]), // Bottom half → S16 game 1
];

function getTopSeed(game: BracketGame): number {
  const s1 = game.team1.seed;
  const s2 = game.team2.seed;
  if (s1 > 0 && s2 > 0) return Math.min(s1, s2);
  if (s1 > 0) return s1;
  if (s2 > 0) return s2;
  return 99;
}

function getGameSeeds(game: BracketGame): number[] {
  return [game.team1.seed, game.team2.seed].filter((s) => s > 0 && s <= 16);
}

function sortR1(games: BracketGame[]): BracketGame[] {
  return [...games].sort((a, b) => {
    const aIdx = R1_TOP_SEED_ORDER.indexOf(getTopSeed(a));
    const bIdx = R1_TOP_SEED_ORDER.indexOf(getTopSeed(b));
    return (aIdx >= 0 ? aIdx : 99) - (bIdx >= 0 ? bIdx : 99);
  });
}

function sortR2(games: BracketGame[], r1Sorted: BracketGame[]): BracketGame[] {
  // For each R2 game, figure out which quadrant it belongs to by checking team seeds
  return [...games].sort((a, b) => {
    const aSeeds = getGameSeeds(a);
    const bSeeds = getGameSeeds(b);
    let aQ = 99, bQ = 99;
    for (let q = 0; q < BRACKET_QUADRANTS.length; q++) {
      if (aSeeds.some((s) => BRACKET_QUADRANTS[q].has(s))) aQ = q;
      if (bSeeds.some((s) => BRACKET_QUADRANTS[q].has(s))) bQ = q;
    }
    // If seeds don't match (TBD teams), try matching by position from R1 winners
    if (aQ === 99 || bQ === 99) {
      // Fall back to matching R2 team names against R1 winners
      for (let q = 0; q < 4; q++) {
        const r1Pair = [r1Sorted[q * 2], r1Sorted[q * 2 + 1]];
        const r1Winners = r1Pair.flatMap((g) => [g.team1, g.team2].filter((t) => t.winner).map((t) => t.abbreviation));
        if (aQ === 99 && [a.team1.abbreviation, a.team2.abbreviation].some((n) => r1Winners.includes(n))) aQ = q;
        if (bQ === 99 && [b.team1.abbreviation, b.team2.abbreviation].some((n) => r1Winners.includes(n))) bQ = q;
      }
    }
    return aQ - bQ;
  });
}

function sortR3(games: BracketGame[]): BracketGame[] {
  return [...games].sort((a, b) => {
    const aSeeds = getGameSeeds(a);
    const bSeeds = getGameSeeds(b);
    let aH = 99, bH = 99;
    for (let h = 0; h < BRACKET_HALVES.length; h++) {
      if (aSeeds.some((s) => BRACKET_HALVES[h].has(s))) aH = h;
      if (bSeeds.some((s) => BRACKET_HALVES[h].has(s))) bH = h;
    }
    return aH - bH;
  });
}

// ── Bracket Region (with connectors) ─────────────────────────────────
function BracketRegion({ region, games }: { region: string; games: BracketGame[] }) {
  const r1Raw = games.filter((g) => g.round === 1);
  const r2Raw = games.filter((g) => g.round === 2);
  const r3Raw = games.filter((g) => g.round === 3);
  const r4Raw = games.filter((g) => g.round === 4);

  // Sort each round into proper bracket order
  const r1 = sortR1(r1Raw);
  const r2 = sortR2(r2Raw, r1);
  const r3 = sortR3(r3Raw);
  const r4 = [...r4Raw];

  // Pad rounds with placeholders if needed
  while (r1.length < 8) r1.push(makeTBD(`${region}-r1-ph-${r1.length}`));
  while (r2.length < 4) r2.push(makeTBD(`${region}-r2-ph-${r2.length}`));
  while (r3.length < 2) r3.push(makeTBD(`${region}-r3-ph-${r3.length}`));
  while (r4.length < 1) r4.push(makeTBD(`${region}-r4-ph-${r4.length}`));

  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold text-white mb-3 text-center px-3 py-2 rounded-xl bg-[#2d68c4]/15 border border-[#2d68c4]/25">
        {region} Region
      </h3>
      {/* Round headers */}
      <div className="flex gap-0 mb-2 text-[10px] font-bold text-[#4a90e2] uppercase tracking-wider">
        <span className="min-w-[150px] text-center">1st Round</span>
        <span className="w-6 shrink-0" />
        <span className="min-w-[150px] text-center">2nd Round</span>
        <span className="w-6 shrink-0" />
        <span className="min-w-[150px] text-center">Sweet 16</span>
        <span className="w-6 shrink-0" />
        <span className="min-w-[150px] text-center">Elite 8</span>
      </div>
      {/* Bracket tree: R1 pairs → R2, R2 pairs → R3, R3 pair → R4 */}
      <div className="flex items-stretch">
        {/* R1→R2 column */}
        <div className="flex flex-col justify-around gap-3">
          {[0, 1, 2, 3].map((i) => (
            <BracketMatchupPair
              key={`r1-${i}`}
              game1={r1[i * 2]}
              game2={r1[i * 2 + 1]}
              nextGame={r2[i]}
              isLast={i === 3}
            />
          ))}
        </div>
        {/* R2→R3 connectors + R3 games */}
        <div className="flex items-stretch">
          <div className="flex flex-col justify-around">
            {[0, 1].map((i) => (
              <div key={`r2-${i}`} className="flex items-stretch">
                <div className="flex items-stretch w-6 shrink-0">
                  <div className="flex flex-col w-3">
                    <div className="flex-1 border-b border-r border-white/15" />
                    <div className="flex-1 border-t border-r border-white/15" />
                  </div>
                  <div className="flex items-center w-3">
                    <div className="w-full border-t border-white/15" />
                  </div>
                </div>
                <div className="flex items-center">
                  <BracketMiniGame game={r3[i]} />
                </div>
              </div>
            ))}
          </div>
          {/* R3→R4 connector + R4 game */}
          <div className="flex items-stretch">
            <div className="flex items-stretch w-6 shrink-0">
              <div className="flex flex-col w-3">
                <div className="flex-1 border-b border-r border-white/15" />
                <div className="flex-1 border-t border-r border-white/15" />
              </div>
              <div className="flex items-center w-3">
                <div className="w-full border-t border-white/15" />
              </div>
            </div>
            <div className="flex items-center">
              <BracketMiniGame game={r4[0]} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Full Bracket Modal ───────────────────────────────────────────────
function BracketModal({ games, onClose }: { games: BracketGame[]; onClose: () => void }) {
  const regions = ["South", "East", "Midwest", "West"];
  const finalFourGames = games.filter((g) => g.round === 5);
  const championshipGames = games.filter((g) => g.round === 6);

  return (
    <div
      className="fixed inset-0 z-50 bracket-backdrop bg-black/70 overflow-y-auto overflow-x-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-card !rounded-2xl w-[96vw] sm:w-[96vw] mx-auto my-4 !bg-[rgba(8,16,35,0.95)]" onClick={(e) => e.stopPropagation()}>
        <div className="relative z-10">
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
          <div className="p-4 overflow-x-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-[600px]">
              {regions.map((region) => (
                <BracketRegion key={region} region={region} games={games.filter((g) => g.region === region)} />
              ))}
            </div>
            {/* Final Four + Championship with connectors */}
            <div className="mt-4 flex items-center justify-center gap-0 border-t border-white/5 pt-4">
              <div className="flex flex-col items-center">
                <h4 className="text-[10px] font-bold text-[#4a90e2] uppercase tracking-wider mb-2">Final Four</h4>
                <div className="flex flex-col gap-2">
                  {(finalFourGames.length > 0 ? finalFourGames : [makeTBD("ff-1"), makeTBD("ff-2")]).map((g) => (
                    <BracketMiniGame key={g.id} game={g} />
                  ))}
                </div>
              </div>
              <div className="flex items-stretch w-6 shrink-0">
                <div className="flex flex-col w-3">
                  <div className="flex-1 border-b border-r border-white/15" />
                  <div className="flex-1 border-t border-r border-white/15" />
                </div>
                <div className="flex items-center w-3">
                  <div className="w-full border-t border-white/15" />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <h4 className="text-[10px] font-bold text-[#4a90e2] uppercase tracking-wider mb-2">Championship</h4>
                <BracketMiniGame game={championshipGames[0] || makeTBD("champ-1")} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline Bracket Preview ───────────────────────────────────────────
function InlineBracketPreview({ games, onClick }: { games: BracketGame[]; onClick: () => void }) {
  const completedCount = games.filter((g) => g.state === "post").length;
  const totalCount = games.length;
  const liveCount = games.filter((g) => g.state === "in").length;
  const regions = ["South", "East", "Midwest", "West"];

  return (
    <button
      onClick={onClick}
      className="glass-card w-full p-4 sm:p-5 cursor-pointer group text-left"
    >
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#4a90e2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <h3 className="text-base font-bold text-white">Tournament Bracket</h3>
            {liveCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-live shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                {liveCount} LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{completedCount}/{totalCount} games played</span>
            <svg className="w-4 h-4 text-gray-500 group-hover:text-[#4a90e2] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
        </div>

        {/* Mini bracket grid showing region progress */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {regions.map((region) => {
            const regionGames = games.filter((g) => g.region === region);
            const regionCompleted = regionGames.filter((g) => g.state === "post").length;
            const regionTotal = regionGames.length;
            // Show last 4 completed games or first 4 upcoming
            const previewGames = regionGames
              .filter((g) => g.state === "post")
              .slice(-2)
              .concat(regionGames.filter((g) => g.state !== "post").slice(0, 2))
              .slice(0, 3);

            return (
              <div key={region} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#4a90e2] uppercase tracking-wider">{region}</span>
                  <span className="text-[9px] text-gray-500">{regionCompleted}/{regionTotal}</span>
                </div>
                {previewGames.map((g) => (
                  <div key={g.id} className={`text-[9px] rounded border px-1.5 py-0.5 ${
                    g.state === "in" ? "border-red-500/30 bg-red-500/5" : "border-white/5 bg-white/[0.02]"
                  }`}>
                    <div className={`flex items-center gap-1 ${g.state === "post" && !g.team1.winner ? "opacity-35" : ""}`}>
                      {g.team1.logo && <img src={g.team1.logo} alt="" className="w-2.5 h-2.5" />}
                      <span className="text-gray-400">{g.team1.seed > 0 ? g.team1.seed : ""}</span>
                      <span className={`flex-1 truncate ${g.team1.winner ? "text-white font-semibold" : "text-gray-400"}`}>
                        {g.team1.abbreviation === "TBD" ? "?" : g.team1.abbreviation}
                      </span>
                      {g.state !== "pre" && <span className={`tabular-nums ${g.team1.winner ? "text-white font-semibold" : "text-gray-500"}`}>{g.team1.score}</span>}
                    </div>
                    <div className={`flex items-center gap-1 ${g.state === "post" && !g.team2.winner ? "opacity-35" : ""}`}>
                      {g.team2.logo && <img src={g.team2.logo} alt="" className="w-2.5 h-2.5" />}
                      <span className="text-gray-400">{g.team2.seed > 0 ? g.team2.seed : ""}</span>
                      <span className={`flex-1 truncate ${g.team2.winner ? "text-white font-semibold" : "text-gray-400"}`}>
                        {g.team2.abbreviation === "TBD" ? "?" : g.team2.abbreviation}
                      </span>
                      {g.state !== "pre" && <span className={`tabular-nums ${g.team2.winner ? "text-white font-semibold" : "text-gray-500"}`}>{g.team2.score}</span>}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-gray-500 text-center mt-3 group-hover:text-[#4a90e2] transition-colors">
          Click to view full bracket
        </p>
      </div>
    </button>
  );
}

// ── Next Round Countdown ─────────────────────────────────────────────
function NextRoundCountdown({ bracketGames }: { bracketGames: BracketGame[] }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(timer);
  }, []);

  // Find the next upcoming round
  const upcomingGames = bracketGames
    .filter((g) => g.state === "pre" && g.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (upcomingGames.length === 0) return null;

  const nextRoundName = upcomingGames[0].roundName;
  const nextRoundGames = upcomingGames.filter((g) => g.roundName === nextRoundName);
  const firstGameDate = new Date(nextRoundGames[0].date);
  const diff = firstGameDate.getTime() - now.getTime();

  // Only show if next game is more than 6 hours away
  if (diff < 6 * 60 * 60 * 1000) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  // Group games by date for display
  const gamesByDate: Record<string, BracketGame[]> = {};
  for (const g of nextRoundGames) {
    const dateKey = new Date(g.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    if (!gamesByDate[dateKey]) gamesByDate[dateKey] = [];
    gamesByDate[dateKey].push(g);
  }

  // Check if matchups are known (not all TBD)
  const hasMatchups = nextRoundGames.some(
    (g) => g.team1.abbreviation !== "TBD" || g.team2.abbreviation !== "TBD"
  );

  return (
    <div className="glass-card p-5 sm:p-6 mb-8">
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-5">
          <p className="text-xs font-bold text-[#4a90e2] uppercase tracking-widest mb-2">Up Next</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {nextRoundName}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {Object.keys(gamesByDate).join(" & ")}
          </p>
        </div>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-3 sm:gap-5 mb-6">
          {days > 0 && (
            <div className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums drop-shadow-[0_0_15px_rgba(74,144,226,0.3)]">
                {days}
              </span>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-1">
                {days === 1 ? "Day" : "Days"}
              </span>
            </div>
          )}
          {days > 0 && <span className="text-2xl text-gray-600 font-light">:</span>}
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums drop-shadow-[0_0_15px_rgba(74,144,226,0.3)]">
              {hours}
            </span>
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-1">
              {hours === 1 ? "Hour" : "Hours"}
            </span>
          </div>
          <span className="text-2xl text-gray-600 font-light">:</span>
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums drop-shadow-[0_0_15px_rgba(74,144,226,0.3)]">
              {String(minutes).padStart(2, "0")}
            </span>
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-1">Min</span>
          </div>
          <span className="text-2xl text-gray-600 font-light">:</span>
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums drop-shadow-[0_0_15px_rgba(74,144,226,0.3)]">
              {String(seconds).padStart(2, "0")}
            </span>
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-1">Sec</span>
          </div>
        </div>

        {/* Matchups */}
        {hasMatchups && (
          <div className="space-y-4">
            {Object.entries(gamesByDate).map(([dateLabel, dateGames]) => (
              <div key={dateLabel}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">{dateLabel}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {dateGames.map((g) => {
                    const t1 = g.team1;
                    const t2 = g.team2;
                    const isTBD = t1.abbreviation === "TBD" && t2.abbreviation === "TBD";
                    if (isTBD) return null;
                    const gameTime = new Date(g.date).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      timeZoneName: "short",
                    });
                    return (
                      <div key={g.id} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                        {/* Team 1 */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {t1.logo && <img src={t1.logo} alt="" className="w-5 h-5 object-contain shrink-0" />}
                          <span className="text-xs text-[#4a90e2] font-semibold shrink-0">{t1.seed > 0 ? t1.seed : ""}</span>
                          <span className="text-sm font-semibold text-gray-200 truncate">{t1.abbreviation === "TBD" ? "TBD" : t1.shortName || t1.abbreviation}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-600 shrink-0">vs</span>
                        {/* Team 2 */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                          <span className="text-sm font-semibold text-gray-200 truncate text-right">{t2.abbreviation === "TBD" ? "TBD" : t2.shortName || t2.abbreviation}</span>
                          <span className="text-xs text-[#4a90e2] font-semibold shrink-0">{t2.seed > 0 ? t2.seed : ""}</span>
                          {t2.logo && <img src={t2.logo} alt="" className="w-5 h-5 object-contain shrink-0" />}
                        </div>
                        {/* Region + Time */}
                        <div className="hidden sm:flex flex-col items-end shrink-0 ml-2">
                          <span className="text-[10px] text-[#4a90e2] font-semibold">{g.region}</span>
                          <span className="text-[10px] text-gray-500">{gameTime}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
      const [gamesRes, bracketRes] = await Promise.all([fetch("/api/games"), fetch("/api/bracket")]);
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
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setShowBracket(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const grouped = groupGamesByDate(games);
  const liveCount = games.filter((g) => g.state === "in").length;
  const todayCount = games.filter((g) => isToday(g.date)).length;

  return (
    <div className="ambient-bg min-h-screen">
      {showBracket && <BracketModal games={bracketGames} onClose={() => setShowBracket(false)} />}

      {/* Follow on X + Purdue — fixed top-left on desktop, inline on mobile */}
      <div className="hidden sm:flex fixed top-4 left-4 z-40 flex-col items-center gap-2">
        <a
          href="https://x.com/zachlloydai"
          target="_blank"
          rel="noopener noreferrer"
          className="bracket-preview rounded-xl px-3.5 py-2 flex items-center gap-2 text-sm font-semibold text-white hover:text-[#4a90e2] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Follow @zachlloydai
        </a>
        <div className="bracket-preview rounded-xl px-3 py-2 flex flex-col items-center gap-1.5">
          <img
            src="https://a.espncdn.com/i/teamlogos/ncaa/500/2509.png"
            alt="Purdue Boilermakers"
            className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(206,184,136,0.3)]"
          />
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Who I&apos;m Rooting For</span>
        </div>
      </div>

      {/* Large basketball decoration — upper right */}
      <div className="fixed top-8 right-8 z-0 opacity-[0.06] pointer-events-none hidden lg:block">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="95" stroke="#4a90e2" strokeWidth="4" />
          <path d="M100 5 C100 195" stroke="#4a90e2" strokeWidth="3" />
          <path d="M5 100 C195 100" stroke="#4a90e2" strokeWidth="3" />
          <path d="M100 5 C55 50 55 150 100 195" stroke="#4a90e2" strokeWidth="3" />
          <path d="M100 5 C145 50 145 150 100 195" stroke="#4a90e2" strokeWidth="3" />
        </svg>
      </div>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 sm:py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-2 sm:mb-3 tracking-tight drop-shadow-[0_0_30px_rgba(45,104,196,0.3)]">
            March Madness{" "}
            <span className="text-[#4a90e2] drop-shadow-[0_0_20px_rgba(74,144,226,0.4)]">2026</span>
          </h1>
          <h2 className="text-sm sm:text-xl text-gray-300 font-medium max-w-lg mx-auto leading-relaxed">
            Every game. Every channel. Every stream.
            <br />
            <span className="text-gray-400">No digging required.</span>
          </h2>

          {/* Follow on X — between subtitle and stats */}
          <a
            href="https://x.com/zachlloydai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full glass-pill text-sm font-semibold text-white hover:text-[#4a90e2] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Follow @zachlloydai
          </a>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 sm:mt-5">
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

        {/* Inline Bracket Preview — right before games */}
        {bracketGames.length > 0 && (
          <div className="mb-8">
            <InlineBracketPreview games={bracketGames} onClick={() => setShowBracket(true)} />
          </div>
        )}

        {/* Next Round Countdown — shows when gap between rounds */}
        {!loading && bracketGames.length > 0 && (
          <NextRoundCountdown bracketGames={bracketGames} />
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#4a90e2] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(74,144,226,0.3)]" />
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
                {group.games.map((game) => (<GameCard key={game.id} game={game} />))}
              </div>
            </section>
          ))}
        </div>

        {/* Streaming Legend */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <h3 className="text-xs font-bold text-[#4a90e2] uppercase tracking-wider mb-4">Where to Stream</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { channel: "CBS", stream: "Paramount+" },
              { channel: "TBS", stream: "Max" },
              { channel: "TNT", stream: "Max" },
              { channel: "truTV", stream: "Max" },
            ].map((item) => (
              <div key={item.channel} className="glass-card !rounded-xl p-3.5 text-sm">
                <div className="relative z-10">
                  <p className="font-bold text-white">{item.channel}</p>
                  <p className="text-orange-400 font-semibold">{item.stream}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Share + Install */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => {
              navigator.clipboard.writeText("https://marchmadness.zach-lloyd.com");
              const btn = document.getElementById("share-btn");
              if (btn) { btn.textContent = "Copied!"; setTimeout(() => { btn.textContent = "Share This Tracker"; }, 2000); }
            }}
            className="glass-card !rounded-xl px-5 py-3 flex items-center gap-2 text-sm font-semibold text-white hover:text-[#4a90e2] cursor-pointer transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span id="share-btn">Share This Tracker</span>
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-white/5 pb-10 text-center space-y-4">
          {lastUpdated && (
            <p className="text-xs text-gray-500">Last updated: {new Date(lastUpdated).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short" })}</p>
          )}
          <p className="text-xs text-gray-500">Data from ESPN. All times in your local timezone + ET.</p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <a href="https://skool.com/zero-to-automated" target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-gray-300 hover:text-[#4a90e2] transition-colors">
              Zero to Automated Community
            </a>
            <span className="text-gray-600 text-lg">|</span>
            <a href="https://youtube.com/@blacksheepsystems" target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-gray-300 hover:text-[#4a90e2] transition-colors">
              YouTube
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-4">Built by Zach Lloyd</p>

          {/* Purdue — mobile only, at bottom */}
          <div className="sm:hidden flex flex-col items-center gap-2 mt-6 pt-4 border-t border-white/5">
            <img src="https://a.espncdn.com/i/teamlogos/ncaa/500/2509.png" alt="Purdue Boilermakers" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(206,184,136,0.3)]" />
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Who I&apos;m Rooting For</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
