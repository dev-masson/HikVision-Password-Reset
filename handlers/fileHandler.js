const path = require('path');
const config = require('../config');
const slackService = require('../services/slackService');
const xmlService = require('../services/xmlService');
const { removeFile, isChannelAllowed } = require('../utils/helpers');


const processedFiles = new Set();

async function handleFileShared({ event, client }) {
  const fileId = event.file_id;
  const channelId = event.channel_id;


  if (!isChannelAllowed(channelId, config.slack.allowedChannelIds)) {
    console.log(`⚠️ Canal ${channelId} não está na lista de canais permitidos. Ignorando...`);
    return;
  }


  if (processedFiles.has(fileId)) {
    return;
  }

  let originalFile = null;
  let processedFile = null;
  let threadTs = null;

  try {

    const fileData = await slackService.getFileInfo(client, fileId);
    const filename = fileData.name;

    if (!xmlService.isSupportedFile(filename)) {
      return;
    }


    const botInfo = await client.auth.test();
    const botUserId = botInfo.user_id;

    
    if (fileData.user === botUserId) {
      return;
    }


    threadTs = await slackService.findMessageWithFile(client, channelId, fileId);
    
    if (!threadTs) {
      console.log('⚠️ Não foi possível encontrar a mensagem original do arquivo');
    }


    await slackService.sendMessage(
      client,
      channelId,
      `📥 Recebi o arquivo \`${filename}\`. Processando...`,
      threadTs
    );


    if (threadTs) {
      await slackService.addReaction(client, channelId, threadTs,'white_check_mark');
      await slackService.addReaction(client, channelId, threadTs,'furiacs');
    }


    originalFile = path.join(config.paths.sourceFile, filename);
    await slackService.downloadFile(fileData.url_private_download, originalFile);
    console.log(`✅ Arquivo salvo em: ${originalFile}`);


    await slackService.sendMessage(
      client,
      channelId,
      `🔄 Gerando contra senha...`,
      threadTs
    );

    const fileNameWithoutExt = path.parse(filename).name;
    const convertedFileName = `${fileNameWithoutExt}.zip`;
    processedFile = path.join(config.paths.convertedFile, convertedFileName);
    
    await xmlService.downloadConvertedFile(config.conversion.downloadUrl, processedFile);
    console.log(`✅ Arquivo convertido baixado: ${processedFile}`);


    await slackService.sendFile(
      client,
      channelId,
      processedFile,
      convertedFileName,
      `✅ Arquivo convertido com sucesso!`,
      threadTs
    );

    processedFiles.add(fileId);

    removeFile(originalFile);
    removeFile(processedFile);

  } catch (error) {
    console.error('❌ Erro:', error);
    
    await slackService.sendMessage(
      client,
      channelId,
      `❌ Erro ao processar: ${error.message}`,
      threadTs,
    );

  } finally {
    if (originalFile) removeFile(originalFile);
    if (processedFile) removeFile(processedFile);
  }
}


async function handleMessage() {
  // Ignora mensagens normais
}

module.exports = {
  handleFileShared,
  handleMessage,
};