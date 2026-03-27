import { NextResponse } from "next/server";

export interface BracketTeam {
  name: string;
  shortName: string;
  abbreviation: string;
  logo: string;
  seed: number;
  score: number;
  winner: boolean;
}

export interface BracketGame {
  id: string;
  round: number; // 1=First Round, 2=Second Round, 3=Sweet16, 4=Elite8, 5=Final Four, 6=Championship
  roundName: string;
  region: string;
  state: "pre" | "in" | "post";
  statusDetail: string;
  date: string;
  team1: BracketTeam;
  team2: BracketTeam;
}

const ROUND_MAP: Record<string, number> = {
  "1st Round": 1,
  "2nd Round": 2,
  "Sweet 16": 3,
  "Elite Eight": 4,
  "Final Four": 5,
  Championship: 6,
};

function parseRound(headline: string): { roundNum: number; roundName: string; region: string } {
  // Parse region from "... - East Region - ..." pattern
  let region = "";
  const regionMatch = headline.match(/(East|West|South|Midwest)\s*Region/i);
  if (regionMatch) region = regionMatch[1];

  // Parse round — check specific rounds before generic "Championship" (which appears in ALL headlines)
  let roundName = "";
  let roundNum = 0;
  if (headline.includes("1st Round")) { roundName = "1st Round"; roundNum = 1; }
  else if (headline.includes("2nd Round")) { roundName = "2nd Round"; roundNum = 2; }
  else if (headline.includes("Sweet 16") || headline.includes("Regional Semifinal")) { roundName = "Sweet 16"; roundNum = 3; }
  else if (headline.includes("Elite Eight") || headline.includes("Elite 8") || headline.includes("Regional Final")) { roundName = "Elite Eight"; roundNum = 4; }
  else if (headline.includes("Final Four") || headline.includes("National Semifinal")) { roundName = "Final Four"; roundNum = 5; region = "Final Four"; }
  else if (headline.includes("National Championship") || headline.includes("National Final")) { roundName = "Championship"; roundNum = 6; region = "Championship"; }

  return { roundNum, roundName, region };
}

export async function GET() {
  try {
    // Fetch entire tournament in one call
    const url =
      "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups=100&dates=20260319-20260407&limit=100";
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) {
      return NextResponse.json({ games: [], lastUpdated: new Date().toISOString() });
    }
    const data = await res.json();
    const games: BracketGame[] = [];

    for (const event of data.events || []) {
      const comp = event.competitions[0];
      const notes = comp.notes?.[0]?.headline || "";
      const { roundNum, roundName, region } = parseRound(notes);

      const competitors = comp.competitors || [];
      const team1Data = competitors[0];
      const team2Data = competitors[1];
      if (!team1Data || !team2Data) continue;

      const makeTeam = (c: any): BracketTeam => ({
        name: c.team?.displayName || "TBD",
        shortName: c.team?.shortDisplayName || "TBD",
        abbreviation: c.team?.abbreviation || "TBD",
        logo: c.team?.logo || "",
        seed: c.curatedRank?.current <= 16 ? c.curatedRank.current : 0,
        score: parseInt(c.score) || 0,
        winner: c.winner || false,
      });

      games.push({
        id: event.id,
        round: roundNum,
        roundName,
        region,
        state: event.status?.type?.state || "pre",
        statusDetail: event.status?.type?.shortDetail || "",
        date: event.date,
        team1: makeTeam(team1Data),
        team2: makeTeam(team2Data),
      });
    }

    // Sort by round, then region, then date
    const regionOrder = ["South", "East", "Midwest", "West", "Final Four", "Championship"];
    games.sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      const aRegion = regionOrder.indexOf(a.region);
      const bRegion = regionOrder.indexOf(b.region);
      if (aRegion !== bRegion) return aRegion - bRegion;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return NextResponse.json({
      games,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ games: [], lastUpdated: new Date().toISOString() });
  }
}
