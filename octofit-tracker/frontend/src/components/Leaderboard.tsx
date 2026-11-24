import { getJson } from '../api/client.js';
import { ApiResourcePage } from './ApiResourcePage.js';

type Entry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: Entry[] };

const loadLeaderboard = async () => (await getJson<LeaderboardResponse>('/api/leaderboard')).leaderboard;

export default function Leaderboard() {
  return (
    <ApiResourcePage
      title="Leaderboard"
      description="Compare team point totals."
      emptyMessage="No leaderboard scores yet."
      load={loadLeaderboard}
      getKey={(entry) => entry.teamName}
      renderItem={(entry) => <>#{entry.rank} {entry.teamName} — {entry.totalPoints} points</>}
    />
  );
}
