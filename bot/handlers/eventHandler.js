const supabase = require('../services/supabase');

class EventHandler {
  constructor(client) {
    this.client = client;
  }

  async handleReady() {
    console.log('✅ WA-Catalog Bot is ready!');
    console.log('📱 Connected number:', this.client.info.wid.user);
    
    // Save session to database
    await supabase.saveSession('wa-catalog-bot', {
      phoneNumber: this.client.info.wid.user,
      platform: this.client.info.platform,
      authenticated: true,
      readyAt: new Date().toISOString()
    });

    // Log bot ready event
    await supabase.logAnalytics({
      eventType: 'bot_ready',
      userPhone: 'system',
      eventData: {
        phoneNumber: this.client.info.wid.user,
        platform: this.client.info.platform
      }
    });
  }

  async handleDisconnected(reason) {
    console.log('🔌 Bot disconnected:', reason);
    
    // Update session in database
    await supabase.saveSession('wa-catalog-bot', {
      authenticated: false,
      disconnectedAt: new Date().toISOString(),
      disconnectReason: reason
    });

    // Log disconnect event
    await supabase.logAnalytics({
      eventType: 'bot_disconnected',
      userPhone: 'system',
      eventData: {
        reason: reason,
        timestamp: new Date().toISOString()
      }
    });

    // Attempt to reconnect if it was an error
    if (reason === 'CONFLICT' || reason === 'UNLAUNCHED') {
      console.log('⏳ Attempting to reconnect in 5 seconds...');
      setTimeout(() => {
        this.client.initialize();
      }, 5000);
    }
  }

  async handleAuthFailure(msg) {
    console.error('❌ Authentication failed:', msg);
    
    // Log auth failure
    await supabase.logAnalytics({
      eventType: 'auth_failure',
      userPhone: 'system',
      eventData: {
        error: msg,
        timestamp: new Date().toISOString()
      }
    });
  }

  async handleChange(change) {
    console.log('📝 State changed:', change);
    
    // Log state change
    await supabase.logAnalytics({
      eventType: 'state_change',
      userPhone: 'system',
      eventData: {
        change: change,
        timestamp: new Date().toISOString()
      }
    });
  }

  async handleGroupJoin(notification) {
    console.log('👥 Joined group:', notification.chatId);
    
    // Log group join
    await supabase.logAnalytics({
      eventType: 'group_join',
      userPhone: 'system',
      eventData: {
        groupId: notification.chatId,
        timestamp: new Date().toISOString()
      }
    });

    // Send welcome message to group
    const chat = await this.client.getChatById(notification.chatId);
    await chat.sendMessage(
      "👋 Bonjour! Je suis WA-Catalog Bot.\n\n" +
      "Je peux vous aider à trouver des produits et des vendeurs.\n" +
      "Envoyez 'aide' pour commencer!"
    );
  }

  async handleGroupLeave(notification) {
    console.log('👋 Left group:', notification.chatId);
    
    // Log group leave
    await supabase.logAnalytics({
      eventType: 'group_leave',
      userPhone: 'system',
      eventData: {
        groupId: notification.chatId,
        timestamp: new Date().toISOString()
      }
    });
  }

  async handleCall(call) {
    console.log('📞 Received call from:', call.from);
    
    // Log call attempt
    await supabase.logAnalytics({
      eventType: 'call_received',
      userPhone: call.from,
      eventData: {
        callId: call.id,
        timestamp: new Date().toISOString()
      }
    });

    // Reject call and send message
    await call.reject();
    await this.client.sendMessage(
      call.from,
      "📞 Je ne peux pas répondre aux appels.\n\n" +
      "Envoyez-moi un message texte et je vous aiderai! 💬"
    );
  }

  async handleMessageReaction(reaction) {
    console.log('😊 Reaction received:', reaction.reaction, 'on message:', reaction.msgId);
    
    // Log reaction
    await supabase.logAnalytics({
      eventType: 'message_reaction',
      userPhone: reaction.senderId,
      eventData: {
        reaction: reaction.reaction,
        messageId: reaction.msgId,
        timestamp: new Date().toISOString()
      }
    });
  }

  async handleMessageRevoke(msg, revokedMsg) {
    console.log('🗑️ Message revoked:', revokedMsg?.id);
    
    // Log message revoke
    await supabase.logAnalytics({
      eventType: 'message_revoke',
      userPhone: msg.from,
      eventData: {
        messageId: revokedMsg?.id,
        timestamp: new Date().toISOString()
      }
    });
  }

  async handleMessageEdit(msg, newBody, prevBody) {
    console.log('✏️ Message edited:', msg.id);
    
    // Log message edit
    await supabase.logAnalytics({
      eventType: 'message_edit',
      userPhone: msg.from,
      eventData: {
        messageId: msg.id,
        previousBody: prevBody,
        newBody: newBody,
        timestamp: new Date().toISOString()
      }
    });

    // Update message in database
    await supabase.saveMessage({
      id: msg.id._serialized,
      from: msg.from,
      to: msg.to,
      body: newBody,
      type: msg.type,
      timestamp: msg.timestamp,
      isFromBot: false
    });
  }

  async handleBatteryChange(batteryInfo) {
    console.log(`🔋 Battery: ${batteryInfo.battery}% ${batteryInfo.plugged ? '(Charging)' : ''}`);
    
    // Log battery status if critical
    if (batteryInfo.battery < 20 && !batteryInfo.plugged) {
      await supabase.logAnalytics({
        eventType: 'battery_low',
        userPhone: 'system',
        eventData: {
          battery: batteryInfo.battery,
          plugged: batteryInfo.plugged,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  async handleQR(qr) {
    console.log('🔄 QR Code received. Scan it with WhatsApp.');
    
    // Log QR generation
    await supabase.logAnalytics({
      eventType: 'qr_generated',
      userPhone: 'system',
      eventData: {
        timestamp: new Date().toISOString()
      }
    });
  }

  async handleLoading(percent, message) {
    console.log(`⏳ Loading: ${percent}% - ${message}`);
    
    // Log loading progress
    if (percent === 100) {
      await supabase.logAnalytics({
        eventType: 'loading_complete',
        userPhone: 'system',
        eventData: {
          message: message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}

module.exports = EventHandler;
