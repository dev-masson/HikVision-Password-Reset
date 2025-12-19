const axios = require('axios');
const fs = require('fs');
const config = require('../config');


async function downloadFile(url, destination) {
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'arraybuffer',
    headers: {
      Authorization: `Bearer ${config.slack.botToken}`,
    },
  });

  fs.writeFileSync(destination, response.data);
  return true;
}


async function sendMessage(client, channelId, text, threadTs = null) {
  const params = {
    channel: channelId,
    text: text,
  };
  
  if (threadTs) {
    params.thread_ts = threadTs;
  }
   
  return client.chat.postMessage(params);
}

async function addReaction(client, channelId, timestamp, reaction) {
  const params = {
    channel: channelId,
    timestamp: timestamp,
    name: reaction,
  };
  
  return client.reactions.add(params);
}



async function sendFile(client, channelId, filepath, filename, message, threadTs = null) {
  const params = {
    channel_id: channelId,
    file: fs.createReadStream(filepath),
    filename: filename,
    initial_comment: message,
  };
  
  if (threadTs) {
    params.thread_ts = threadTs;
  }
  
  return client.files.uploadV2(params);
}


async function getFileInfo(client, fileId) {
  const result = await client.files.info({ file: fileId });
  return result.file;
}

async function findMessageWithFile(client, channelId, fileId) {
  try {
    let cursor = undefined;
    let hasMore = true;
    
    while (hasMore) {
      const result = await client.conversations.history({
        channel: channelId,
        cursor: cursor,
        limit: 100,
      });

      if (!result.ok || !result.messages) {
        break;
      }

      // Procura mensagem que contém o arquivo
      for (const message of result.messages) {
        if (message.files && message.files.some(file => file.id === fileId)) {
          return message.ts;
        }
      }

      hasMore = result.has_more || false;
      cursor = result.response_metadata?.next_cursor;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar mensagem com arquivo:', error);
    return null;
  }
}

async function deleteAllBotMessages(client, channelId) {
  try {
    const botInfo = await client.auth.test();
    const botUserId = botInfo.user_id;
    
    let cursor = undefined;
    let deletedCount = 0;
    let hasMore = true;
    const processedThreads = new Set();
    const threadTimestamps = new Set();

    
    while (hasMore) {
      const result = await client.conversations.history({
        channel: channelId,
        cursor: cursor,
        limit: 200,
      });

      if (!result.ok || !result.messages) {
        break;
      }

      const messages = result.messages;
      
      for (const message of messages) {
        if (message.user === botUserId && message.ts && !message.thread_ts) {
          try {
            await client.chat.delete({
              channel: channelId,
              ts: message.ts,
            });
            deletedCount++;
          } catch (error) {
            console.error(`Erro ao deletar mensagem ${message.ts}:`, error.message);
          }
        }
        
        // Coleta thread_ts de mensagens que têm thread
        if (message.thread_ts && !threadTimestamps.has(message.thread_ts)) {
          threadTimestamps.add(message.thread_ts);
        }
        
        // Coleta thread_ts de mensagens que são raiz de thread
        if (message.ts && !message.thread_ts && !processedThreads.has(message.ts)) {
          processedThreads.add(message.ts);
          threadTimestamps.add(message.ts);
        }
      }

      hasMore = result.has_more || false;
      cursor = result.response_metadata?.next_cursor;
    }

    for (const threadTs of threadTimestamps) {
      try {
        const threadReplies = await client.conversations.replies({
          channel: channelId,
          ts: threadTs,
        });
        
        if (threadReplies.ok && threadReplies.messages) {
          for (const reply of threadReplies.messages) {
            if (reply.user === botUserId && reply.ts) {
              try {
                await client.chat.delete({
                  channel: channelId,
                  ts: reply.ts,
                });
                deletedCount++;
              } catch (error) {
                
                if (error.data?.error !== 'cant_delete_message' && error.message !== 'cant_delete_message') {
                  console.error(`Erro ao deletar mensagem em thread ${reply.ts}:`, error.message);
                }
              }
            }
          }
        }
      } catch (error) {
        
        if (error.data?.error !== 'thread_not_found' && error.message !== 'thread_not_found') {
          console.error(`⚠️ Erro ao buscar thread ${threadTs}:`, error.message);
        }
      }
    }

    return { success: true, deletedCount };
  } catch (error) {
    console.error('Erro ao deletar mensagens:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  downloadFile,
  sendMessage,
  addReaction,
  sendFile,
  getFileInfo,
  deleteAllBotMessages,
  findMessageWithFile,
};