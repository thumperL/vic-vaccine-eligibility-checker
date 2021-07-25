/* Required Packages */
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const request = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const mailgun = require('mailgun-js');
const { Client } = require('pg');

(async () => {
  // const { resolve } = require('path');

  /* Const variables */
  const credentials = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
  const client = new Client(credentials);
  await client.connect();
  const targetUrl = 'https://www.coronavirus.vic.gov.au/who-can-get-vaccinated';
  const existingEligibilityFilePath = 'eligible_list.txt';

  const existingEligibleItems = new Promise((resolve, reject) => {
    client
    .query('SELECT * FROM eligible_items')
    .then((row) => {
      resolve(row.rows);
    });
  });

  // Get live vic gov eligible list
  const liveListPromise = new Promise((resolve) => {
    request(targetUrl)
    .then((html) => {
      const $ = cheerio.load(html);
      const eligibleItems = [];
      $('.rpl-markup__inner').children('ul:first-of-type').children('li').each((i, e) => {
        eligibleItems.push($(e).text());
      });
      return resolve(eligibleItems);
    });
  });

  Promise.all([existingEligibleItems, liveListPromise])
  .then(([existsEligibleArr, liveEligibleArr]) => {
    const existsEligibleArrSimple = existsEligibleArr.map((item) => item.content);
    const newEligibleArr = liveEligibleArr.filter((x) => !existsEligibleArrSimple.includes(x));

    // If there is any difference
    if (newEligibleArr.length !== 0) {
      const today = new Date();
      const dateStr = `${today.getFullYear().toString() + (today.getMonth() + 1).toString().padStart(2, '0') + today.getDay().toString().padStart(2, '0')}_${today.getHours().toString().padStart(2, '0')}${today.getMinutes().toString().padStart(2, '0')}`;
      const writeFileNew = new Promise((resolve, reject) => {
        resolve((existsEligibleArr.length === 0) ? true : fs.promises.writeFile(`added_${dateStr}.txt`, JSON.stringify(newEligibleArr)).then(() => true));
      });
      const writeFileOverride = new Promise((resolve, reject) => {
        resolve(fs.promises.writeFile('eligible_list.txt', JSON.stringify(liveEligibleArr)).then(() => true));
      });
      const notify = new Promise((resolve, reject) => {
        const mg = mailgun({
          apiKey: process.env.MAILGUN_API_KEY,
          domain: process.env.MAILGUN_DOMAIN,
        });
        const data = {
          from   : `Victoria Vaccination Eligibility Monitor <postmaster@${process.env.MAILGUN_DOMAIN}>`,
          to     : process.env.EMAIL_TO,
          subject: 'New Eligible list Changes',
          html   : `<pre style="white-space:initial"> <pre>${JSON.stringify(newEligibleArr)}</pre> </pre>`,
        };
        mg.messages().send(data, (error, body) => {
          if (error) {
            resolve(`[Email Error]\r\n${error}`);
          }
          resolve('[Email Sent]');
        });
      });
      Promise.all([writeFileNew, writeFileOverride]).then(() => {
        console.log('Notified and Completed');
        process.exit(1);
      });
    } else {
      console.log('Completed');
      process.exit(1);
    }
  });

  // await client.end();
})().catch((err) => console.error(err));
