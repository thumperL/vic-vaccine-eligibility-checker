/* Required Packages */
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const request = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const mailgun = require('mailgun-js');
const { resolve } = require('path');


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

Promise.all([existingFilePromise, liveListPromise])
.then(([existsEligibleArr, liveEligibleArr]) => {
  const newEligibleArr = liveEligibleArr.filter((x) => !existsEligibleArr.includes(x));
  // If there is any difference
  if (newEligibleArr.length !== 0) {
    const today = new Date();
    const dateStr = today.getFullYear().toString() + (today.getMonth() + 1).toString().padStart(2, '0') + today.getDay().toString().padStart(2, '0') + '_' + today.getHours().toString().padStart(2, '0') + today.getMinutes().toString().padStart(2, '0');
    const writeFileNew = new Promise((resolve, reject) => {
      resolve((existsEligibleArr.length === 0)? true : fs.promises.writeFile('added_' + dateStr + '.txt', JSON.stringify(newEligibleArr)).then(()=>true));
    });
    const writeFileOverride = new Promise((resolve, reject) => {
      resolve(fs.promises.writeFile('eligible_list.txt', JSON.stringify(liveEligibleArr)).then(()=>true));
    });
    const notify = new Promise((resolve, reject) => {
      const DOMAIN = "";
      const mg = mailgun({apiKey: process.env.EMAIL_API, domain: process.env.EMAIL_DOMAIN});
      const data = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
        subject: "New Eligible list Changes",
        html: `<pre style="white-space:initial"> <pre>${JSON.stringify(newEligibleArr)}</pre> </pre>`
      };
      mg.messages().send(data, (error, body) => {(error)? reject('[Email Error]\r\n' + error) : resolve('[Email Sent]')});
    });
    Promise.all([writeFileNew, writeFileOverride, notify]).then(() => {
      console.log('Notified and Completed');
    })
  } else {
    console.log('Completed');
  }
});