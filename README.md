# 🛡️ Sentinel — Advanced Discord Moderation & Utility Bot

[![Discord.js](https://img.shields.io/badge/Discord.js-v14.14+-5865F2?style=flat&logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v18%20%7C%20v20-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A powerful, modular Discord bot built with **Discord.js v14** featuring advanced voice channel moderation, dynamic Canvas-rendered welcome and goodbye cards, rolling activity analytics, automated mentions, XP leveling, and bulk message purging.

---

## ✨ Features

### 🔊 Advanced Voice Moderation
* **Mass Mute / Unmute**:
  * `/mute all` — Instantly server-mute everyone in your current voice channel.
  * `/mute users` — Filter-mute members by role or display name keywords.
  * `/unmute all` — Unmute all members in your current voice channel.
* **Mass Disconnect**:
  * `/disconnect all <channel>` — Disconnect all members from a designated voice channel.
  * `/disconnect users <channel>` — Selectively disconnect members matching specific roles or display name keywords.
* **Voice Relocation**:
  * `/move all <target> [from]` — Move all connected members from one or all voice channels into a destination channel.

---

### 👋 Dynamic Welcome & Goodbye Cards
* **Welcome System**:
  * Rich embed featuring member avatar thumbnail and customizable channel shortcuts (Rules & Self-Roles).
  * Native animated GIF support (`assets/welcome.gif`).
  * Auto-assigns newcomer roles upon joining.
  * Preview anytime via `/welcome test`.
* **Dynamic Canvas "Wasted" Goodbye System**:
  * Generates a custom GTA-inspired "Wasted" image using `@napi-rs/canvas`.
  * Dynamically stamps the departing member's avatar in the upper section with a glowing red outline.
  * Renders their `@DisplayName` in a large, auto-scaled bold font.
  * Preview anytime via `/goodbye test`.

---

### 📊 Leveling & 14-Day Rolling Analytics
* **XP & Level Progression**: Member activity earns XP tracked in `levels.json`. Check standing via `/my level`, `/user level`, and `/leaderboard`.
* **Deep Member & Server Metrics**: `/userinfo` and `/serverinfo` track voice and message activity over 1-day, 7-day, and 14-day intervals.
* **Automated Data Pruning**: Built-in background worker prunes message and voice records older than 14 days every 6 hours to prevent disk bloat without affecting cumulative XP or levels.

---

### 🛡️ Administration & Message Purging
* **Granular Purge Options**:
  * `/purge channel` — Bulk-delete messages in a channel.
  * `/purge user` — Target and delete messages from a specific member across channels.
  * `/purge all` — Mass cleanup across all server text channels.
  * Supports `hours_ago` filters.
* **Lockdown Mode**:
  * `/valli on` & `/valli off` — Emergency lockdown controls for server administrators.

---

### ⚙️ Automation & Utilities
* **Mention Triggers**:
  * `/auto react <emoji>` — Auto-react with an emoji whenever you are mentioned.
  * `/auto respond` — Set an automated text reply when you are mentioned.
* **System Utilities**:
  * `/ping` — WebSocket latency and REST response time.
  * `/help` — Permission-aware dynamic help directory.

---

## 📂 Project Structure

```text
├── assets/                  # Static media assets
│   ├── welcome.gif          # Welcome animated banner
│   └── wasted.png           # Goodbye canvas background
├── commands/                # Slash command handlers
│   ├── auto.js
│   ├── disconnect.js
│   ├── goodbye.js
│   ├── help.js
│   ├── leaderboard.js
│   ├── move.js
│   ├── mute.js
│   ├── my.js
│   ├── ping.js
│   ├── purge.js
│   ├── serverinfo.js
│   ├── unmute.js
│   ├── user.js
│   ├── userinfo.js
│   ├── valli.js
│   └── welcome.js
├── events/                  # Gateway event listeners
│   ├── guildMemberAdd.js    # Welcome cards & auto-roles
│   ├── guildMemberRemove.js # Dynamic Canvas goodbye cards
│   ├── interactionCreate.js # Slash command router
│   ├── messageCreate.js     # XP tracking & auto-responses
│   ├── ready.js             # Initialization & status
│   └── voiceStateUpdate.js  # Voice time & activity tracking
├── utils/                   # Helper modules
│   ├── analyticsPruner.js   # 14-day automated data cleanup
│   └── goodbyeCard.js       # Dynamic Canvas image generator
├── .env.example             # Environment variables template
├── .gitignore
├── analytics.json           # Activity logs (rolling 14 days)
├── bot-config.json          # Guild settings & automated triggers
├── deploy-commands.js       # Discord REST slash command registration
├── index.js                 # Main application entry point
├── levels.json              # Persistent XP and leveling store
└── package.json
