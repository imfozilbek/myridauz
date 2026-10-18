import { waitingSupport } from './modules/assignments';
import { waitingComplaints } from './modules/complaints';
import { waitingApplications } from './modules/drivers';
import { wireTeamQueue } from './modules/team-queue';
import { waitingFaces } from './modules/users';

// «Navbat» of the team reads its cases from the modules that hold them (G68, docs/122).
wireTeamQueue(async (env) => {
  const [applications, complaints, faces, support] = await Promise.all([
    waitingApplications(env),
    waitingComplaints(env),
    waitingFaces(env),
    waitingSupport(env),
  ]);
  return [
    ...applications.map(({ publicId, name, submittedAt, car }) => ({
      kind: 'application' as const,
      id: publicId,
      name,
      since: submittedAt,
      car,
    })),
    ...complaints.map((item) => ({ kind: 'complaint' as const, ...item })),
    ...faces.map((item) => ({ kind: 'face' as const, ...item })),
    ...support.map((item) => ({ kind: 'support' as const, ...item })),
  ];
});
