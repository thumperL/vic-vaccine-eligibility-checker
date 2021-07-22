/* Required Packages */
const request = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');

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

request(targetUrl)
  .then((html) => {
    const $ = cheerio.load(html);
    const eligible_content = $('.rpl-markup__inner');
  }) 
  .catch((err) => console.log(err));