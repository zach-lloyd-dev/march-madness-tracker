import { NextResponse } from "next/server";

const STREAMING_MAP: Record<string, string> = {
  CBS: "Paramount+",
  TBS: "Max",
  TNT: "Max",
  truTV: "Max",
  ESPN: "ESPN+",
  ESPN2: "ESPN+",
  ESPNU: "ESPN+",
};

interface ESPNTeam {
  id: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  logo: string;
  color?: string;
  alternateColor?: string;
}

interface ESPNCompetitor {
  homeAway: string;
  score: string;
  curatedRank: { current: number };
  records: { summary: string }[];
  team: ESPNTeam;
  winner?: boolean;
}

interface ESPNBroadcast {
  names: string[];
}

interface ESPNCompetition {
  competitors: ESPNCompetitor[];
  broadcasts: ESPNBroadcast[];
  venue: {
    fullName: string;
    address: { city: string; state: string };
  };
  notes: { headline: string }[];
}

interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  status: {
    clock: number;
    period: number;
    type: {
      name: string;
      state: string;
      detail: string;
      shortDetail: string;
    };
  };
  competitions: ESPNCompetition[];
}

export interface Game {
  id: string;
  date: string;
  state: "pre" | "in" | "post";
  statusDetail: string;
  clock: number;
  period: number;
  round: string;
  region: string;
  venue: string;
  venueCity: string;
  awayTeam: {
    name: string;
    shortName: string;
    abbreviation: string;
    logo: string;
    color: string;
    seed: number;
    score: number;
    record: string;
    winner: boolean;
  };
  homeTeam: {
    name: string;
    shortName: string;
    abbreviation: string;
    logo: string;
    color: string;
    seed: number;
    score: number;
    record: string;
    winner: boolean;
  };
  tvChannels: string[];
  streamingPlatforms: string[];
}

function parseRoundAndRegion(notes: { headline: string }[]): {
  round: string;
  region: string;
} {
  if (!notes?.length) return { round: "", region: "" };
  const headline = notes[0].headline;

  let region = "";
  const regionMatch = headline.match(
    /(East|West|South|Midwest|Final Four)\s*Region/i
  );
  if (regionMatch) region = regionMatch[1];
  if (headline.includes("Final Four")) region = "Final Four";

  let round = "";
  if (headline.includes("1st Round")) round = "1st Round";
  else if (headline.includes("2nd Round")) round = "2nd Round";
  else if (headline.includes("Sweet 16") || headline.includes("Regional Semifinal")) round = "Sweet 16";
  else if (headline.includes("Elite Eight") || headline.includes("Regional Final")) round = "Elite Eight";
  else if (headline.includes("Final Four") || headline.includes("National Semifinal")) round = "Final Four";
  else if (headline.includes("Championship") || headline.includes("National Final"))
    round = "Championship";

  return { round, region };
}

function parseCompetitor(c: ESPNCompetitor) {
  return {
    name: c.team.displayName,
    shortName: c.team.shortDisplayName,
    abbreviation: c.team.abbreviation,
    logo: c.team.logo,
    color: `#${c.team.color || "333"}`,
    seed: c.curatedRank?.current || 0,
    score: parseInt(c.score) || 0,
    record: c.records?.[0]?.summary || "",
    winner: c.winner || false,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  // Fetch multiple days to show recent + upcoming
  const dates = [];
  if (dateParam) {
    dates.push(dateParam);
  } else {
    // Get today and surrounding days
    const today = new Date();
    for (let i = -1; i <= 2; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push(
        `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
      );
    }
  }

  const allGames: Game[] = [];

  for (const date of dates) {
    try {
      const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${date}&groups=100&limit=50`;
      const res = await fetch(url, { next: { revalidate: 30 } });
      if (!res.ok) continue;
      const data = await res.json();

      for (const event of (data.events || []) as ESPNEvent[]) {
        const comp = event.competitions[0];
        const away = comp.competitors.find(
          (c: ESPNCompetitor) => c.homeAway === "away"
        );
        const home = comp.competitors.find(
          (c: ESPNCompetitor) => c.homeAway === "home"
        );
        if (!away || !home) continue;

        const tvChannels = comp.broadcasts?.[0]?.names || [];
        const streamingPlatforms = [
          ...new Set(
            tvChannels
              .map((ch: string) => STREAMING_MAP[ch])
              .filter(Boolean)
          ),
        ];

        const { round, region } = parseRoundAndRegion(comp.notes);

        allGames.push({
          id: event.id,
          date: event.date,
          state: event.status.type.state as "pre" | "in" | "post",
          statusDetail: event.status.type.shortDetail,
          clock: event.status.clock,
          period: event.status.period,
          round,
          region,
          venue: comp.venue?.fullName || "",
          venueCity: comp.venue?.address
            ? `${comp.venue.address.city}, ${comp.venue.address.state}`
            : "",
          awayTeam: parseCompetitor(away),
          homeTeam: parseCompetitor(home),
          tvChannels,
          streamingPlatforms,
        });
      }
    } catch {
      // Skip failed date fetches
    }
  }

  // Sort: live games first, then upcoming by date, then completed
  allGames.sort((a, b) => {
    const stateOrder = { in: 0, pre: 1, post: 2 };
    const aOrder = stateOrder[a.state] ?? 1;
    const bOrder = stateOrder[b.state] ?? 1;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return NextResponse.json({
    games: allGames,
    lastUpdated: new Date().toISOString(),
  });
}
