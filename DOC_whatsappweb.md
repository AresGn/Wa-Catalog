# whatsapp-web.js Documentation

whatsapp-web.js is an unofficial WhatsApp client library for Node.js that connects through the WhatsApp Web browser app. It uses Puppeteer to automate WhatsApp Web, providing access to most features while mitigating ban risks, though it's not guaranteed safe as WhatsApp prohibits bots and unofficial clients.

**Key Points:**
- **Purpose and Risks**: Enables building chatbots or applications with WhatsApp functionality, but use at your own risk due to potential account blocking.
- **Requirements**: Node.js v18 or higher; install via `npm i whatsapp-web.js`.
- **Basic Setup**: Initialize a Client, handle QR code for authentication, and listen for events like 'ready' and 'message'.
- **Supported Features**: Includes multi-device support, sending/receiving messages and media, group management, polls, channels, but some like buttons/lists are deprecated.
- **Authentication Options**: Use strategies like LocalAuth for session persistence to avoid repeated QR scans; advanced options like RemoteAuth for custom storage.
- **Media Handling**: Send/receive images, videos, stickers; note caveats for video formats requiring Chrome.
- **API Structure**: Core classes include Client for overall control, Message for individual messages, Chat for conversations, and GroupChat for group-specific actions.

## Introduction

whatsapp-web.js allows programmatic interaction with WhatsApp via browser automation. It launches WhatsApp Web using Puppeteer, accessing internal functions for features like messaging, media, groups, and more. This library is Apache 2.0 licensed and not affiliated with WhatsApp.

Key warnings: WhatsApp may block accounts using unofficial clients. Always check for updates, as features evolve.

## Installation

Install via npm: `npm i whatsapp-web.js`.

Node.js v18+ is required. Upgrade instructions:

- **Windows (Manual)**: Download LTS from [nodejs.org](https://nodejs.org/en/download/).
- **Windows (npm)**: `sudo npm install -g n` then `sudo n stable`.
- **Windows (Choco)**: `choco install nodejs-lts`.
- **Windows (Winget)**: `winget install OpenJS.NodeJS.LTS`.
- **Ubuntu/Debian**: `curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs`.

## Quick Start and Usage

Basic example:

```javascript
const { Client } = require('whatsapp-web.js');

const client = new Client();

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});

client.initialize();
```

Scan the QR code with your phone to authenticate. For session persistence, use authentication strategies (see below).

## Authentication Strategies

By default, no session saving—QR scan required each time. Use strategies for persistence.

- **NoAuth**: Explicit fresh session (default if unspecified).
- **LocalAuth**: Saves sessions locally; use `clientId` for multiple instances.
  ```javascript
  const { Client, LocalAuth } = require('whatsapp-web.js');
  const client = new Client({ authStrategy: new LocalAuth({ clientId: 'my-client' }) });
  ```
- **RemoteAuth**: Flexible with custom storage (e.g., MongoDB); supports backups.
  ```javascript
  const { Client, RemoteAuth } = require('whatsapp-web.js');
  const { MongoStore } = require('wwebjs-mongo');
  const mongoose = require('mongoose');
  mongoose.connect('mongodb://...').then(() => {
      const store = new MongoStore({ mongoose });
      const client = new Client({ authStrategy: new RemoteAuth({ store, backupSyncIntervalMs: 300000 }) });
      client.initialize();
  });
  ```

## Handling Attachments

Send media using `MessageMedia`:

- From file: `MessageMedia.fromFilePath('./image.png')`.
- From URL: `await MessageMedia.fromUrl('https://example.com/image.png')`.

Example:
```javascript
const { MessageMedia } = require('whatsapp-web.js');
client.on('message', async msg => {
    if (msg.body === '!media') {
        const media = MessageMedia.fromFilePath('./image.png');
        msg.reply(media);
    }
});
```

For videos/GIFs, use Chrome (set in Client options) due to format support. Receive media via `msg.hasMedia` and `msg.downloadMedia()`.

## Mentions

Mention users/groups in messages:

- Users: Use `mentions` option with Contact IDs.
- Groups: Use `groupMentions` with GroupMention objects.

Example:
```javascript
client.sendMessage(chatId, 'Hello @1234567890', { mentions: ['1234567890@c.us'] });
```

Parse mentions from received messages via `msg.mentionedIds` or `msg.getMentions()`.

## Supported Features

| Feature                          | Status |
|----------------------------------|--------|
| Multi Device                     | ✅     |
| Send messages                    | ✅     |
| Receive messages                 | ✅     |
| Send media (images/audio/documents) | ✅  |
| Send media (video)               | ✅ (requires Google Chrome) |
| Send stickers                    | ✅     |
| Receive media (images/audio/video/documents) | ✅ |
| Send contact cards               | ✅     |
| Send location                    | ✅     |
| Send buttons                     | ❌ (DEPRECATED) |
| Send lists                       | ❌ (DEPRECATED) |
| Receive location                 | ✅     |
| Message replies                  | ✅     |
| Join groups by invite            | ✅     |
| Get invite for group             | ✅     |
| Modify group info (subject, description) | ✅ |
| Modify group settings (send messages, edit info) | ✅ |
| Add group participants           | ✅     |
| Kick group participants          | ✅     |
| Promote/demote group participants| ✅     |
| Mention users                    | ✅     |
| Mention groups                   | ✅     |
| Mute/unmute chats                | ✅     |
| Block/unblock contacts           | ✅     |
| Get contact info                 | ✅     |
| Get profile pictures             | ✅     |
| Set user status message          | ✅     |
| React to messages                | ✅     |
| Create polls                     | ✅     |
| Channels                         | ✅     |
| Vote in polls                    | 🔜    |
| Communities                      | 🔜    |

---

whatsapp-web.js is an open-source Node.js library for interacting with WhatsApp Web, enabling developers to build custom clients, bots, and applications. By automating WhatsApp Web via Puppeteer, it provides near-complete access to features like messaging, media sharing, group management, and more, though with inherent risks of account suspension since WhatsApp officially disallows unofficial clients.

This comprehensive documentation covers installation, setup, authentication, media handling, mentions, supported features, and a detailed API reference for key classes. All information is derived from official sources and is current as of the library's latest version (1.34.1, WhatsApp Web 2.2346.52).

### Introduction and Overview

The library's core mechanism involves launching WhatsApp Web in a headless browser and exposing its APIs for Node.js use. This approach reduces detection risks compared to direct API calls but is not foolproof—WhatsApp may still block accounts. The project is licensed under Apache 2.0, copyrighted by Pedro S. Lopez, and unaffiliated with WhatsApp Inc.

Key benefits include multi-device support, dynamic event handling, and extensibility. For contributions, check the GitHub repo; report missing features via issues.

### Installation and Requirements

Requires Node.js v18+. Install with:

```
npm i whatsapp-web.js
```

OS-specific Node upgrades:

- Windows: Manual download from nodejs.org, or use npm (`sudo npm install -g n; sudo n stable`), Chocolatey (`choco install nodejs-lts`), or Winget (`winget install OpenJS.NodeJS.LTS`).
- Ubuntu/Debian: Run the Nodesource setup script followed by apt install.

No additional dependencies needed beyond Puppeteer (bundled).

### Basic Usage and Examples

Initialize a Client and handle events:

```javascript
const { Client } = require('whatsapp-web.js');
const client = new Client();
client.on('qr', qr => console.log('QR RECEIVED', qr));
client.on('ready', () => console.log('Client is ready!'));
client.on('message', msg => { if (msg.body === '!ping') msg.reply('pong'); });
client.initialize();
```

For QR display, integrate qrcode-terminal:

```javascript
client.on('qr', qr => qrcode.generate(qr, { small: true }));
```

See example.js on GitHub for advanced use cases.

### Authentication Strategies in Detail

Default behavior requires QR scanning each restart. Persist sessions with strategies:

- **NoAuth**: Forces new session; useful for testing.
  ```javascript
  new Client({ authStrategy: new NoAuth() });
  ```

- **LocalAuth**: Stores session in local directory (default: .wwebjs_auth/). Use clientId for multi-instance:
  ```javascript
  new Client({ authStrategy: new LocalAuth({ clientId: 'client-one', dataPath: './sessions/' }) });
  ```
  Supports rmMaxRetries for cleanup.

- **RemoteAuth**: Uses external storage (e.g., MongoDB) for flexibility. Set backupSyncIntervalMs for periodic saves.
  ```javascript
  const { MongoStore } = require('wwebjs-mongo');
  // Connect to DB, then:
  new Client({ authStrategy: new RemoteAuth({ store: new MongoStore({ mongoose }), backupSyncIntervalMs: 300000 }) });
  ```
  Requires optional deps like fs-extra, unzipper, archiver.

Custom strategies can extend BaseAuthStrategy.

### Handling Attachments and Media

Supports sending/receiving images, audio, videos, documents, stickers. Use MessageMedia class.

- Creating Media:
  - From file: `MessageMedia.fromFilePath(path)`.
  - From URL: `await MessageMedia.fromUrl(url)`.
  - From base64: `new MessageMedia(mimetype, data, filename)`.

- Sending:
  ```javascript
  const media = MessageMedia.fromFilePath('./video.mp4');
  client.sendMessage(chatId, media, { caption: 'Video' });
  ```

- Receiving: Check `msg.hasMedia`, then `await msg.downloadMedia()` to get MessageMedia object.

Caveats: Videos/GIFs require Chrome for AAC/H.264 support (set puppeteer executablePath). Stickers convert to webp; use ffmpegPath option.

### Mentions in Messages

Mention users/groups for notifications:

- Users: Pass array of IDs in `mentions` option.
  ```javascript
  client.sendMessage(chatId, 'Hi @user', { mentions: ['1234567890@c.us'] });
  ```

- Groups: Use `groupMentions` with { id, name } objects.

From received messages:
- `msg.mentionedIds`: Array of IDs.
- `await msg.getMentions()`: Array of Contacts.
- `msg.groupMentions`: Array of group mentions.

Legacy @phoneNumber format supported but deprecated.

### Supported Features Table

See the table in the direct answer section for a complete list. Upcoming: Poll voting, communities.

### API Reference

#### Client Class

Starting point for WhatsApp Web interaction. Extends EventEmitter.

**Constructor:** `new Client(options)`

Options include authStrategy, webVersion, puppeteer (browser args), qrMaxRetries, etc.

**Properties:**
- info: ClientInfo (connection details).

**Methods (selected):**
- initialize(): Starts client.
- destroy(): Closes.
- getChats(): Array<Chat>.
- sendMessage(chatId, content, options): Promise<Message>.
- createGroup(title, participants, options): Promise<CreateGroupResult>.
- getContacts(): Array<Contact>.
- acceptInvite(inviteCode): Promise<string> (group ID).
- createChannel(title, options): Promise<CreateChannelResult>.
- getBlockedContacts(): Array<Contact>.
- ... (full list includes muting, blocking, polling, etc.)

**Events:**
- qr: QR code received.
- ready: Client ready.
- message: Message received.
- disconnected: Disconnected (with reason).
- battery_changed: Battery percentage update.
- ... (many more like auth_failure, group_join).

#### Message Class

Represents a message.

**Properties:**
- id: Object (unique ID).
- from: Sender ID.
- to: Recipient ID.
- body: Content.
- type: MessageTypes (text, image, etc.).
- hasMedia: Boolean.
- mentionedIds: Array<string>.
- groupMentions: Array<GroupMention>.
- timestamp: Number.
- ... (ack, author for groups, isForwarded, etc.).

**Methods:**
- reply(content, chatId, options): Promise<Message>.
- downloadMedia(): Promise<MessageMedia>.
- getChat(): Promise<Chat>.
- getContact(): Promise<Contact>.
- react(reaction): Promise (emoji or empty to remove).
- delete(everyone, clearMedia): Promise.
- edit(content, options): Promise<Message|null>.
- forward(chat): Promise.
- star()/unstar(): Promise.
- pin(duration): Promise<boolean>.
- getQuotedMessage(): Promise<Message>.
- getReactions(): Promise<ReactionList[]>.
- ... (more like getMentions, getInfo for delivery).

#### Chat Class

Represents a conversation.

**Properties:**
- id: Object.
- name: String.
- isGroup: Boolean.
- archived: Boolean.
- pinned: Boolean.
- unreadCount: Number.
- lastMessage: Message.
- ... (isMuted, muteExpiration, etc.).

**Methods:**
- sendMessage(content, options): Promise<Message>.
- fetchMessages(searchOptions): Promise<Message[]>.
- getContact(): Promise<Contact> (for private chats).
- mute(unmuteDate): Promise<{isMuted, muteExpiration}>.
- unmute(): Promise<{isMuted, muteExpiration}>.
- archive()/unarchive(): Promise.
- pin()/unpin(): Promise<boolean>.
- sendSeen(): Promise<boolean>.
- sendStateTyping()/sendStateRecording(): Promise.
- clearMessages(): Promise<boolean>.
- delete(): Promise<boolean>.
- ... (markUnread, syncHistory, etc.).

#### GroupChat Class

Extends Chat for groups.

**Properties:**
- owner: ContactId.
- participants: GroupParticipant[] (id, isAdmin, isSuperAdmin).
- createdAt: Date.
- description: String.

**Methods:**
- addParticipants(participantIds, options): Promise<AddParticipantsResult|string>.
- removeParticipants(participantIds): Promise<{status: number}>.
- promoteParticipants(participantIds): Promise<{status: number}>.
- demoteParticipants(participantIds): Promise<{status: number}>.
- setSubject(subject): Promise<boolean>.
- setDescription(description): Promise<boolean>.
- setPicture(media): Promise<boolean>.
- deletePicture(): Promise<boolean>.
- getInviteCode(): Promise<string>.
- revokeInvite(): Promise<string>.
- leave(): Promise.
- setMessagesAdminsOnly(adminsOnly): Promise<boolean>.
- setInfoAdminsOnly(adminsOnly): Promise<boolean>.
- setAddMembersAdminsOnly(adminsOnly): Promise<boolean>.
- getGroupMembershipRequests(): Promise<GroupMembershipRequest[]>.
- approveGroupMembershipRequests(options): Promise<MembershipRequestActionResult[]>.
- rejectGroupMembershipRequests(options): Promise<MembershipRequestActionResult[]>.

### Contributing and Support

Open PRs on GitHub; review CODE_OF_CONDUCT.md. Support via links in README (not detailed here). Join Discord for community help.

### Disclaimer

Not endorsed by WhatsApp. Use responsibly.

**Key Citations:**
- [GitHub - pedroslopez/whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- [whatsapp-web.js 1.34.1 » Home](https://docs.wwebjs.dev/)
- [Handling Attachments](https://wwebjs.dev/guide/creating-your-bot/handling-attachments.html)
- [Authentication](https://wwebjs.dev/guide/creating-your-bot/authentication.html)
- [Installation](https://wwebjs.dev/guide/installation)
- [Mentions](https://wwebjs.dev/guide/creating-your-bot/mentions)
- [Class: Client](https://docs.wwebjs.dev/Client.html)
- [Class: Message](https://docs.wwebjs.dev/Message.html)
- [Class: Chat](https://docs.wwebjs.dev/Chat.html)
- [Class: GroupChat](https://docs.wwebjs.dev/GroupChat.html)