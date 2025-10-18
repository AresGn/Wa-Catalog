require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const MessageHandler = require('./handlers/messageHandler');
const EventHandler = require('./handlers/eventHandler');
const supabase = require('./services/supabase');

// Initialize WhatsApp client with authentication
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'wa-catalog-bot',
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        executablePath: '/usr/bin/chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    }
});

// Initialize handlers
const messageHandler = new MessageHandler(client);
const eventHandler = new EventHandler(client);

// ============== EVENT HANDLERS ==============

// QR Code generation
client.on('qr', async (qr) => {
    console.log('🔄 QR Code received. Scan it with WhatsApp:');
    qrcode.generate(qr, { small: true });
    await eventHandler.handleQR(qr);
});

// Client ready
client.on('ready', async () => {
    await eventHandler.handleReady();
});

// Loading progress
client.on('loading_screen', (percent, message) => {
    eventHandler.handleLoading(percent, message);
});

// Authentication failure
client.on('auth_failure', async (msg) => {
    await eventHandler.handleAuthFailure(msg);
});

// Disconnection
client.on('disconnected', async (reason) => {
    await eventHandler.handleDisconnected(reason);
});

// State changes
client.on('change_state', async (state) => {
    await eventHandler.handleChange(state);
});

// Battery changes
client.on('change_battery', async (batteryInfo) => {
    await eventHandler.handleBatteryChange(batteryInfo);
});

// ============== MESSAGE HANDLERS ==============

// Main message handler
client.on('message', async (msg) => {
    try {
        console.log(`📨 Message from ${msg.from}: ${msg.body}`);
        
        // Check for commands first
        const command = await messageHandler.handleCommand(msg);
        if (command) {
            await msg.reply(command);
            return;
        }
        
        // Handle media messages
        if (msg.hasMedia) {
            const mediaResponse = await messageHandler.handleMedia(msg);
            if (mediaResponse) {
                await msg.reply(mediaResponse);
                return;
            }
        }
        
        // Handle regular messages
        await messageHandler.handleMessage(msg);
        
    } catch (error) {
        console.error('Error processing message:', error);
        
        // Log error to database
        await supabase.logAnalytics({
            eventType: 'message_error',
            userPhone: msg.from,
            eventData: {
                error: error.message,
                messageBody: msg.body,
                timestamp: new Date().toISOString()
            }
        });
    }
});

// Message acknowledgement
client.on('message_ack', async (msg, ack) => {
    // Log message delivery status
    if (ack === 3) { // Read
        await supabase.logAnalytics({
            eventType: 'message_read',
            userPhone: msg.to,
            eventData: {
                messageId: msg.id._serialized,
                timestamp: new Date().toISOString()
            }
        });
    }
});

// Message reactions
client.on('message_reaction', async (reaction) => {
    await eventHandler.handleMessageReaction(reaction);
});

// Message revoke
client.on('message_revoke_everyone', async (after, before) => {
    await eventHandler.handleMessageRevoke(after, before);
});

// Message edit
client.on('message_edit', async (msg, newBody, prevBody) => {
    await eventHandler.handleMessageEdit(msg, newBody, prevBody);
});

// ============== GROUP HANDLERS ==============

// Group join
client.on('group_join', async (notification) => {
    await eventHandler.handleGroupJoin(notification);
});

// Group leave
client.on('group_leave', async (notification) => {
    await eventHandler.handleGroupLeave(notification);
});

// ============== CALL HANDLERS ==============

// Incoming call
client.on('call', async (call) => {
    await eventHandler.handleCall(call);
});

// ============== ERROR HANDLERS ==============

// Global error handler
process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
    await supabase.logAnalytics({
        eventType: 'unhandled_rejection',
        userPhone: 'system',
        eventData: {
            reason: reason.toString(),
            timestamp: new Date().toISOString()
        }
    });
});

process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    
    await supabase.logAnalytics({
        eventType: 'uncaught_exception',
        userPhone: 'system',
        eventData: {
            error: error.toString(),
            stack: error.stack,
            timestamp: new Date().toISOString()
        }
    });
    
    // Restart the bot after logging
    console.log('⏳ Restarting bot in 5 seconds...');
    setTimeout(() => {
        process.exit(1); // Exit to allow process manager to restart
    }, 5000);
});

// ============== GRACEFUL SHUTDOWN ==============

async function gracefulShutdown(signal) {
    console.log(`\n📍 Received ${signal}, shutting down gracefully...`);
    
    try {
        // Log shutdown
        await supabase.logAnalytics({
            eventType: 'bot_shutdown',
            userPhone: 'system',
            eventData: {
                signal: signal,
                timestamp: new Date().toISOString()
            }
        });
        
        // Destroy WhatsApp client
        await client.destroy();
        console.log('✅ WhatsApp client closed');
        
        // Exit process
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
}

// Handle termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ============== START BOT ==============

console.log('🚀 Starting WA-Catalog Bot...');
console.log('📊 Database:', process.env.SUPABASE_URL ? 'Connected' : 'Not configured');
console.log('🤖 AI Service:', process.env.GEMINI_API_KEY ? 'Enabled' : 'Disabled');
console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
console.log('═'.repeat(50));

// Initialize the client
client.initialize().catch(error => {
    console.error('❌ Failed to initialize bot:', error);
    process.exit(1);
});