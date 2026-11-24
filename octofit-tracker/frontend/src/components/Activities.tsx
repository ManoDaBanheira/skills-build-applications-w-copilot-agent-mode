import { getJson } from '../api/client.js';
import { ApiResourcePage } from './ApiResourcePage.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };
type ActivityResponse = { activities: Activity[] };

const loadActivities = async () => (await getJson<ActivityResponse>('/api/activities')).activities;

export default function Activities() {
  return (
    <ApiResourcePage
      title="Activities"
      description="Track student activity minutes and points."
      emptyMessage="No activities yet."
      load={loadActivities}
      getKey={(activity, index) => activity._id ?? `${activity.type}-${index}`}
      renderItem={(activity) => <>{activity.type} — {activity.minutes} minutes — {activity.points} points</>}
    />
  );
}
