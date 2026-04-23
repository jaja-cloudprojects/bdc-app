import cron from 'node-cron';
import { prisma } from '../config/database';
import { broadcastPush } from './notification.service';

// Map of campaignId → active cron task (for recurring campaigns)
const activeTasks = new Map<string, ReturnType<typeof cron.schedule>>();

async function fireCampaign(campaignId: string): Promise<void> {
  const campaign = await prisma.notificationCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign || !campaign.isActive) return;

  await broadcastPush({
    title: campaign.title,
    body: campaign.body,
    data: { type: 'campaign', campaignId },
  });

  await prisma.notificationCampaign.update({
    where: { id: campaignId },
    data: { lastSentAt: new Date(), sentCount: { increment: 1 } },
  });

  console.log(`[campaign] sent "${campaign.name}" (${campaignId})`);
}

export function registerRecurring(campaign: { id: string; cronExpr: string | null }): void {
  unregisterRecurring(campaign.id);
  if (!campaign.cronExpr || !cron.validate(campaign.cronExpr)) return;

  const task = cron.schedule(campaign.cronExpr, () => {
    fireCampaign(campaign.id).catch((e) =>
      console.error(`[campaign] error firing ${campaign.id}:`, e)
    );
  });
  activeTasks.set(campaign.id, task);
}

export function unregisterRecurring(campaignId: string): void {
  const task = activeTasks.get(campaignId);
  if (task) {
    task.stop();
    activeTasks.delete(campaignId);
  }
}

// One-time poll: setInterval instead of node-cron to avoid missed-execution flood on Docker resume
let oneTimePollTimer: NodeJS.Timeout | null = null;
let pollRunning = false;

async function pollOneTimeCampaigns(): Promise<void> {
  if (pollRunning) return; // prevent concurrent runs
  pollRunning = true;
  try {
    const due = await prisma.notificationCampaign.findMany({
      where: {
        isActive: true,
        isRecurring: false,
        lastSentAt: null,
        scheduledAt: { lte: new Date() },
      },
    });
    for (const campaign of due) {
      await fireCampaign(campaign.id).catch((e) =>
        console.error(`[campaign] one-time error ${campaign.id}:`, e)
      );
    }
  } catch (e) {
    console.error('[campaign] poll error:', e);
  } finally {
    pollRunning = false;
  }
}

function startOneTimePoll(): void {
  if (oneTimePollTimer) return;
  oneTimePollTimer = setInterval(() => {
    pollOneTimeCampaigns().catch((e) => console.error('[campaign] poll error:', e));
  }, 60_000);
  // Don't hold the process open just for the poller
  oneTimePollTimer.unref();
}

export async function initScheduler(): Promise<void> {
  // Load and schedule all active recurring campaigns
  const recurring = await prisma.notificationCampaign.findMany({
    where: { isActive: true, isRecurring: true },
  });
  for (const c of recurring) {
    registerRecurring(c);
  }

  // Start the one-time campaign poller (runs once per minute, no missed-execution warnings)
  startOneTimePoll();

  console.log(`[campaign] scheduler ready — ${recurring.length} recurring campaign(s) registered`);
}

export { fireCampaign };
