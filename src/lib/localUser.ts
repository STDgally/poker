import { prisma } from './prisma';

// MVP has no auth system: every hand/session is tracked against a single
// local profile so the dashboard has something real to aggregate.
const LOCAL_USERNAME = 'local_player';

export async function getOrCreateLocalUser() {
  return prisma.user.upsert({
    where: { username: LOCAL_USERNAME },
    update: {},
    create: { username: LOCAL_USERNAME },
  });
}

export { LOCAL_USERNAME };
