const fs = require('fs');
const axios = require('axios');
const config = require('../config');

function isXml(filename) {
  return filename.toLowerCase().endsWith('.xml');
}

function isWinRar(filename) {
  const ext = filename.toLowerCase();
  return ext.endsWith('.rar') || 
         ext.endsWith('.zip');
}

function isSupportedFile(filename) {
  return isXml(filename) || isWinRar(filename);
}

async function downloadConvertedFile(downloadUrl, outputPath) {
  try {
    const response = await axios({
      method: 'get',
      url: downloadUrl,
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Erro ao baixar arquivo convertido:', error);
    throw new Error(`Erro ao baixar arquivo: ${error.message}`);
  }
}

module.exports = {
  isXml,
  isWinRar,
  isSupportedFile,
  downloadConvertedFile,
};