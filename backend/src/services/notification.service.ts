import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { prisma } from '../config/database';
import { env } from '../config/env';

const expo = new Expo({
  accessToken: env.expoAccessToken,
  useFcmV1: true,
});

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
}

/**
 * Send push notification to specific user IDs.
 * Invalid tokens are automatically pruned from the database.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: userIds } },
  });
  return sendPushToTokens(tokens.map((t) => ({ id: t.id, token: t.token })), payload);
}

/**
 * Broadcast a notification to all registered devices.
 */
export async function broadcastPush(payload: PushPayload): Promise<{ sent: number; failed: number }> {
  const tokens = await prisma.pushToken.findMany();
  const result = await sendPushToTokens(
    tokens.map((t) => ({ id: t.id, token: t.token })),
    payload
  );
  await prisma.notification.create({
    data: { title: payload.title, body: payload.body, data: payload.data ?? {}, sentTo: result.sent },
  });
  return result;
}

async function sendPushToTokens(
  tokens: { id: string; token: string }[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const messages: ExpoPushMessage[] = [];
  const invalidTokenIds: string[] = [];

  for (const t of tokens) {
    if (!Expo.isExpoPushToken(t.token)) {
      invalidTokenIds.push(t.id);
      continue;
    }
    messages.push({
      to: t.token,
      sound: payload.sound ?? 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      priority: 'high',
    });
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (err) {
      console.error('[push] chunk error:', err);
    }
  }

  // Find failed "DeviceNotRegistered" entries and prune them
  const failedIdsFromTickets: string[] = [];
  tickets.forEach((ticket, i) => {
    if (
      ticket.status === 'error' &&
      ticket.details?.error === 'DeviceNotRegistered'
    ) {
      const token = messages[i]?.to as string;
      const matching = tokens.find((t) => t.token === token);
      if (matching) failedIdsFromTickets.push(matching.id);
    }
  });

  const allInvalid = [...invalidTokenIds, ...failedIdsFromTickets];
  if (allInvalid.length > 0) {
    await prisma.pushToken.deleteMany({ where: { id: { in: allInvalid } } });
  }

  const sent = tickets.filter((t) => t.status === 'ok').length;
  const failed = tickets.length - sent + invalidTokenIds.length;
  return { sent, failed };
}
