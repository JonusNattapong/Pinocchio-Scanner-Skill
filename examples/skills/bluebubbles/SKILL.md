---
name: bluebubbles
description: "Build or update the BlueBubbles iMessage channel plugin for Moltbot, including REST send/probe endpoints, webhook inbound handling, reactions, typing indicators, and attachment downloads. Use when working on BlueBubbles integration, iMessage channel support, the extensions/bluebubbles/ directory, or any webhook, send, or probe logic for the BlueBubbles plugin."
---

# BlueBubbles plugin

## Quickstart

1. Locate the extension at `extensions/bluebubbles/`
2. Entry point: `index.ts` — registers the channel with Moltbot
3. Key files: `channel.ts` (channel impl), `monitor.ts` (webhook handler), `send.ts` (message delivery), `probe.ts` (health check)

## Layout
- Extension package: `extensions/bluebubbles/` (entry: `index.ts`).
- Channel implementation: `extensions/bluebubbles/src/channel.ts`.
- Webhook handling: `extensions/bluebubbles/src/monitor.ts` (register via `api.registerHttpHandler`).
- REST helpers: `extensions/bluebubbles/src/send.ts` + `extensions/bluebubbles/src/probe.ts`.
- Runtime bridge: `extensions/bluebubbles/src/runtime.ts` (set via `api.runtime`).
- Catalog entry for onboarding: `src/channels/plugins/catalog.ts`.

## Internal helpers (use these, not raw API calls)
- `probeBlueBubbles` in `extensions/bluebubbles/src/probe.ts` for health checks.
- `sendMessageBlueBubbles` in `extensions/bluebubbles/src/send.ts` for text delivery.
- `resolveChatGuidForTarget` in `extensions/bluebubbles/src/send.ts` for chat lookup.
- `sendBlueBubblesReaction` in `extensions/bluebubbles/src/reactions.ts` for tapbacks.
- `sendBlueBubblesTyping` + `markBlueBubblesChatRead` in `extensions/bluebubbles/src/chat.ts`.
- `downloadBlueBubblesAttachment` in `extensions/bluebubbles/src/attachments.ts` for inbound media.
- `buildBlueBubblesApiUrl` + `blueBubblesFetchWithTimeout` in `extensions/bluebubbles/src/types.ts` for shared REST plumbing.

## Webhooks
- BlueBubbles posts JSON to the gateway HTTP server.
- Normalize sender/chat IDs defensively (payloads vary by version).
- Skip messages marked as from self.
- Route into core reply pipeline via the plugin runtime (`api.runtime`) and `clawdbot/plugin-sdk` helpers.
- For attachments/stickers, use `<media:...>` placeholders when text is empty and attach media paths via `MediaUrl(s)` in the inbound context.

## Config (core)
- `channels.bluebubbles.serverUrl` (base URL), `channels.bluebubbles.password`, `channels.bluebubbles.webhookPath`.
- Action gating: `channels.bluebubbles.actions.reactions` (default true).

## Verification

After making changes, verify the plugin works:
```bash
# Run the extension tests
npm test -- --grep bluebubbles
# Verify probe endpoint responds
curl -s http://localhost:<port>/api/bluebubbles/probe | jq .
```

## Message tool notes
- **Reactions:** The `react` action requires a `target` (phone number or chat identifier) in addition to `messageId`. Example: `action=react target=+15551234567 messageId=ABC123 emoji=❤️`
