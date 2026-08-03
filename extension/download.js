const fs = require('fs');
const https = require('https');
https.get('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt', (res) => {
  const file = fs.createWriteStream('dictionary.txt');
  res.pipe(file);
  file.on('finish', () => {
    file.close();
  });
});
