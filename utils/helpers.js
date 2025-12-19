const fs = require('fs');

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


function removeFile(filepath) {
  if (filepath && fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}


function checkDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function isChannelAllowed(channelId, allowedChannelIds) {
  if (!allowedChannelIds || allowedChannelIds.length === 0) {
    return true;
  }
  return allowedChannelIds.includes(channelId);
}

module.exports = {
  generateCode,
  removeFile,
  checkDir,
  isChannelAllowed,
};