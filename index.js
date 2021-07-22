/* Required Packages */
const request = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const cron = require('node-cron');

cron.schedule('*/15 * * * *', async () => {
  /* Const variables */
  const targetUrl = 'https://www.coronavirus.vic.gov.au/who-can-get-vaccinated';
  const existingEligibilityFilePath = 'eligible_list.txt';

  // check file exists, if yes return data
  const existingFilePromise = new Promise((resolve, reject) => {
    try {
      fs.readFile(existingEligibilityFilePath, 'utf8', async (err, data) => {
        if (err) {
          await fs.writeFile(existingEligibilityFilePath, '', ()=>{});
          return resolve('');
        } else {
          return resolve(data);
        }
      })
    } catch {
      reject('Get Existing File Error');
    }
  });

  // Get live vic gov eligible list
  const liveListPromise = new Promise((resolve, reject)=> {
    request(targetUrl)
    .then((html) => {
      const $ = cheerio.load(html);
      return resolve($('.rpl-markup__inner').text());
    }) 
    .catch((err) => reject('Getting VIC GOV live data failed'));
  });

  Promise.all([existingFilePromise, liveListPromise]).then(([eligibleText, liveEligibleText]) => {
    if (eligibleText !== liveEligibleText) {
      const newEligibleText = liveEligibleText.replace(eligibleText, '');
      const today = new Date();
      const dateStr = today.getFullYear().toString() + (today.getMonth() + 1).toString().padStart(2, '0') + today.getDay().toString().padStart(2, '0') + '_' + today.getHours().toString().padStart(2, '0') + today.getMinutes().toString().padStart(2, '0');
      fs.promises.writeFile('added_' + dateStr + '.txt', newEligibleText)
      .then((data) => {
        fs.promises.writeFile('eligible_list.txt', liveEligibleText)
        .then(()=>console.log(`NEW AVAILABLE!\r\n${newEligibleText}`));
      });
    }
  });
});