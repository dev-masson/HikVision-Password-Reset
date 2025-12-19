const { App } = require('@slack/bolt');
const config = require('./config');
const { checkDir, isChannelAllowed } = require('./utils/helpers');
const { handleFileShared, handleMessage } = require('./handlers/fileHandler');


checkDir(config.paths.temp);
checkDir(config.paths.sourceFile);
checkDir(config.paths.convertedFile);


const app = new App({
  token: config.slack.botToken,
  socketMode: true,
  appToken: config.slack.appToken,
});


app.event('file_shared', handleFileShared);
app.event('message', handleMessage);


app.command('/clear', async ({ command, ack, client, respond }) => {
  await ack();
  
  if (!isChannelAllowed(command.channel_id, config.slack.allowedChannelIds)) {
    await respond({
      text: '❌ Este bot não está autorizado a operar neste canal.',
      response_type: 'ephemeral',
    });
    return;
  }
  
   
  if (config.slack.allowedUserIds.length > 0 && !config.slack.allowedUserIds.includes(command.user_id)) {
    await respond({
      text: '❌ Você não tem permissão para usar este comando.',
      response_type: 'ephemeral',
    });
    return;
  }
  
  const slackService = require('./services/slackService');
  const result = await slackService.deleteAllBotMessages(client, command.channel_id);
  
  if (result.success) {
    await respond({
      text: `✅ ${result.deletedCount} mensagem(ns) deletada(s)`,
      response_type: 'ephemeral',
    });
  } else {
    await respond({
      text: `❌ Erro: ${result.error}`,
      response_type: 'ephemeral',
    });
  }
});


(async () => {
  await app.start();
  console.log('Password Reset running...');
})();