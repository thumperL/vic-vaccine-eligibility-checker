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
          return resolve(Array());
        } else {
          return resolve((data)? JSON.parse(data) : Array());
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
      let eligibleItems = Array();
      $('.rpl-markup__inner').children('ul:first-of-type').children('li').each((i, e) => {
        eligibleItems.push($(e).text())
      });
      return resolve(eligibleItems);
    })
    .catch((err) => reject('Getting VIC GOV live data failed'));
  });

  Promise.all([existingFilePromise, liveListPromise]).then(([existsEligibleArr, liveEligibleArr]) => {
    const newEligibleArr = liveEligibleArr.filter((x) => !existsEligibleArr.includes(x));

    // If there is any difference
    if (newEligibleArr.length !== 0) {
      const today = new Date();
      const dateStr = today.getFullYear().toString() + (today.getMonth() + 1).toString().padStart(2, '0') + today.getDay().toString().padStart(2, '0') + '_' + today.getHours().toString().padStart(2, '0') + today.getMinutes().toString().padStart(2, '0');
      const writeFiles = (async (dateStr) => {
        let newFile = (existsEligibleArr.length === 0)? true : await fs.promises.writeFile('added_' + dateStr + '.txt', JSON.stringify(newEligibleArr)).then(()=>true);
        let overrideFile =  await fs.promises.writeFile('eligible_list.txt', JSON.stringify(liveEligibleArr)).then(()=>true);
        return (newFile && overrideFile);
      }).catch((err)=>console.error(err));
      writeFiles(dateStr);
    }
  });
});