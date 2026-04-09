const { Expo } = require('expo-server-sdk');
const User = require('../models/user');

const expo = new Expo();
const PUSH_NOTIFICATIONS_ENABLED = false;

async function removeInvalidTokens(tokens) {
  if (!tokens || tokens.length === 0) return;
  try {
    await User.updateMany(
      { pushTokens: { $in: tokens } },
      { $pull: { pushTokens: { $in: tokens } } }
    );
  } catch (e) {
    console.error('removeInvalidTokens error', e.message);
  }
}

async function sendPushToShop(shopId, title, body) {
  if (!PUSH_NOTIFICATIONS_ENABLED) return;
  try {
    const users = await User.find({ shops: shopId, pushTokens: { $exists: true, $ne: [] } }).select('pushTokens');
    const tokens = users.flatMap((u) => u.pushTokens || []);
    if (!tokens.length) return;

    // Build messages preserving token order so we can map responses back
    const validPairs = tokens
      .filter((t) => Expo.isExpoPushToken(t))
      .map((t) => ({
        token: t,
        message: {
          to: t,
          sound: 'default',
          title,
          body,
          data: { shopId },
        },
      }));

    const messages = validPairs.map((p) => p.message);
    const tokenOrder = validPairs.map((p) => p.token);

    const invalidFormat = tokens.filter((t) => !Expo.isExpoPushToken(t));
    if (invalidFormat.length) await removeInvalidTokens(invalidFormat);

    const chunks = expo.chunkPushNotifications(messages);
    let offset = 0;
    for (const chunk of chunks) {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      // receipts align to chunk messages
      const invalid = [];
      for (let i = 0; i < receipts.length; i++) {
        const r = receipts[i];
        if (r?.status === 'error') {
          const err = r.details?.error || r.message;
          if (err && (err === 'DeviceNotRegistered' || err === 'MessageTooBig' || err === 'MessageRateExceeded' || err === 'InvalidCredentials' || err === 'InvalidCredentialsError')) {
            const badToken = tokenOrder[offset + i];
            if (badToken) invalid.push(badToken);
          }
        }
      }
      if (invalid.length) await removeInvalidTokens(invalid);
      offset += receipts.length;
    }
  } catch (e) {
    console.error('sendPushToShop error', e.message);
  }
}

async function pruneInvalidFormatTokens() {
  if (!PUSH_NOTIFICATIONS_ENABLED) return;
  try {
    const users = await User.find({ pushTokens: { $exists: true, $ne: [] } }).select('pushTokens');
    const toRemove = new Map();
    for (const u of users) {
      const seen = new Set();
      const keep = [];
      for (const t of u.pushTokens) {
        if (!Expo.isExpoPushToken(t)) {
          toRemove.set(t, true);
          continue;
        }
        if (seen.has(t)) {
          toRemove.set(t, true);
          continue;
        }
        seen.add(t);
        keep.push(t);
      }
      // If dedup changed, update user document
      if (keep.length !== u.pushTokens.length) {
        u.pushTokens = keep;
        await u.save();
      }
    }
    const rm = Array.from(toRemove.keys());
    if (rm.length) await removeInvalidTokens(rm);
  } catch (e) {
    console.error('pruneInvalidFormatTokens error', e.message);
  }
}

module.exports = { sendPushToShop, pruneInvalidFormatTokens };
