import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function recordInput(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw httpError('Request body must be an object', 400);
  }
  return input as Record<string, unknown>;
}

function requiredString(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw httpError(`${key} is required`, 400);
  }
  return value.trim();
}

function objectId(input: Record<string, unknown>, key: string): string {
  const value = requiredString(input, key);
  if (!/^[\da-f]{24}$/i.test(value)) throw httpError(`${key} must be a valid ID`, 400);
  return value;
}

function positiveMinutes(input: Record<string, unknown>): number {
  const minutes = input.minutes;
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw httpError('minutes must be a positive number', 400);
  }
  return minutes;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const body = recordInput(input);
  const userId = objectId(body, 'userId');
  const teamId = objectId(body, 'teamId');
  const type = requiredString(body, 'type');
  const minutes = positiveMinutes(body);
  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) throw httpError('User or team not found', 404);

  return Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const body = recordInput(input);
  const name = requiredString(body, 'name');
  const mascot = requiredString(body, 'mascot');
  const memberIds = body.members ?? [];
  if (!Array.isArray(memberIds)) throw httpError('members must be an array', 400);
  const ids = memberIds.map((id) => {
    if (typeof id !== 'string' || !/^[\da-f]{24}$/i.test(id)) {
      throw httpError('members must contain valid user IDs', 400);
    }
    return id;
  });
  const members = ids.length ? await User.find({ _id: { $in: ids } }).select('_id').lean() : [];
  if (members.length !== new Set(ids).size) throw httpError('One or more members were not found', 404);

  return Team.create({ name, mascot, members: ids });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: string; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeam = new Map(totals.map(({ _id, totalPoints }) => [String(_id), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: totalsByTeam.get(String(team._id)) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

const activityFocus: Record<string, string> = {
  cycle: 'endurance',
  cycling: 'endurance',
  run: 'endurance',
  running: 'endurance',
  walk: 'endurance',
  walking: 'endurance',
  strength: 'strength',
};

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw httpError('User not found', 404);

  const recentActivities = await Activity.find({
    user: user._id,
    occurredAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  }).sort({ occurredAt: -1 }).lean();
  const workoutOptions = await Workout.find().lean();
  const activityTypes = [...new Set(recentActivities.map(({ type }) => type.toLowerCase()))];
  const candidateFocuses = [
    ...activityTypes.map((type) => activityFocus[type] ?? type),
    user.fitnessGoal.toLowerCase(),
  ];
  const focus = candidateFocuses.find((candidate) => workoutOptions.some((workout) => workout.focus.toLowerCase() === candidate));
  if (!focus) return [];

  const matchingWorkouts = workoutOptions.filter((workout) => workout.focus.toLowerCase() === focus);
  const activityType = activityTypes.find((type) => (activityFocus[type] ?? type) === focus);
  const reason = activityType
    ? `Recommended based on your recent ${activityType} activity.`
    : `Recommended to support your ${user.fitnessGoal} fitness goal.`;
  return matchingWorkouts.map((workout) => ({ ...workout, reason }));
}

export { User };
