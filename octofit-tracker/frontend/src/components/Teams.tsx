import { getJson } from '../api/client.js';
import { ApiResourcePage } from './ApiResourcePage.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };
type TeamResponse = { teams: Team[] };

const loadTeams = async () => (await getJson<TeamResponse>('/api/teams')).teams;

export default function Teams() {
  return (
    <ApiResourcePage
      title="Teams"
      description="Manage teams and members."
      emptyMessage="No teams yet."
      load={loadTeams}
      getKey={(team, index) => team._id ?? `${team.name}-${index}`}
      renderItem={(team) => <>{team.name}{team.mascot ? ` — ${team.mascot}` : ''} — {team.members.length} members</>}
    />
  );
}
