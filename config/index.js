const path = require('path');
require('dotenv').config();

module.exports = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    allowedUserIds: process.env.SLACK_ALLOWED_USER_IDS 
      ? process.env.SLACK_ALLOWED_USER_IDS.split(',').map(id => id.trim())
      : [],
      
    allowedChannelIds: process.env.SLACK_ALLOWED_CHANNEL_IDS 
      ? process.env.SLACK_ALLOWED_CHANNEL_IDS.split(',').map(id => id.trim())
      : [],
  },
  paths: {
    temp: path.join(__dirname, '..', 'temp'),
    sourceFile: path.join(__dirname, '..', 'temp', 'sourceFile'),
    convertedFile: path.join(__dirname, '..', 'temp', 'convertedFile'),
  },
  conversion: {
    downloadUrl: process.env.CONVERSION_DOWNLOAD_URL || '',
  },
};
