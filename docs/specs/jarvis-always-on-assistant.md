# Jarvis: Always-On Assistant

**Status:** Idea — not yet started
**Created:** 2026-03-27
**Todo:** #49

## Vision

A dedicated always-on side monitor running an AI assistant (OpenClaw) that can:
- Display schedule, habits, dashboard in real-time
- Accept voice commands ("move gym to 2pm")
- Act as a conversational assistant with full tracker context
- Ambient awareness (proactive suggestions, idle detection)

Think Iron Man's Jarvis — always visible, always listening, always helpful.

## Hardware Plan

| Component | Option | Est. Cost |
|-----------|--------|-----------|
| Compute | Mac Mini M2 (base) | ~$500 |
| Display | 24" IPS monitor (portrait/vertical) + VESA arm | ~$150-200 |
| Mic | USB desk mic (Jabra Speak / Blue Yeti Nano) | ~$50-80 |
| **Total** | | **~$700-780** |

## Current Desk Setup

- 2 external monitors (top), 2 laptops (work + personal) below
- Either laptop can dock into the left-center position and drive both monitors
- Jarvis monitor would be a 3rd screen on the right side, driven by the Mac Mini independently

```
PROPOSED LAYOUT

┌────────┐ ┌────────┐ ┌─────┐
│   L    │ │   R    │ │  J  │
│        │ │        │ │  A  │
└────────┘ └────────┘ │  R  │
    Laptop(s)          │  V  │
 (work or personal)    │  I  │
                       │  S  │
                       └─────┘
                       Mac Mini
                    (always running)
```

Vertical monitor is ideal: chat interfaces and schedules are naturally vertical, doesn't eat horizontal desk space.

## Software Stack

### OpenClaw
- Open-source personal AI assistant (MIT license, 310k+ GitHub stars)
- Runs on own hardware (Mac Mini)
- 100+ AgentSkills (shell, files, web automation)
- Multi-channel: WhatsApp, Slack, iMessage, WebChat
- Model-agnostic: bring your own API keys or run local
- Security note: broad permissions by design — needs careful scoping

### Voice Pipeline
- **Wake word:** Porcupine (Picovoice) — runs locally, custom wake word, free for personal use
- **STT:** Whisper (runs locally on M-series) or Deepgram API
- **Flow:** Mic → Porcupine (wake) → Whisper (transcribe) → OpenClaw skill → tracker API → CSV

Why not Alexa/Google Home:
- Extra hop for no reason ("Alexa, tell Jarvis to..." vs just "Jarvis, ...")
- Locked ecosystems, privacy concerns
- Mac Mini has plenty of power for local wake word + Whisper

### Tracker Integration
- OpenClaw AgentSkills can hit existing Next.js API endpoints
- "Move gym to 2pm" → skill calls `/api/plan`
- Dashboard view = existing tracker app in kiosk/dashboard mode
- Extends what's already built rather than starting from scratch

## Open Questions

1. **Primary interaction mode:** Voice-first or type-first? (Affects day-1 complexity)
2. **Integration depth:** OpenClaw reads/writes CSVs vs. OpenClaw IS the primary interface to the life system
3. **Ambient features:** How proactive should it be? (notifications, idle detection, context switching)
4. **Display split:** Full-screen chat? Split chat + dashboard? Rotating views?

## Next Steps

- [ ] Decide: buy hardware or prototype on existing laptop first
- [ ] Try OpenClaw locally on current machine to evaluate UX
- [ ] Design AgentSkills for tracker API integration
- [ ] Prototype wake word + STT pipeline
