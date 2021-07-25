/* Required Packages */
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const request = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const { Client } = require('pg');
const nodeMailer = require('nodemailer');

(async () => {
  /* Const variables */
  const credentials = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
  const client = new Client(credentials);
  await client.connect();
  await client.query(`CREATE SEQUENCE IF NOT EXISTS untitled_table_195_id_seq;
                      CREATE TABLE IF NOT EXISTS "eligible_items" (
                          "id" int4 NOT NULL DEFAULT nextval('untitled_table_195_id_seq'::regclass),
                          "content" varchar NOT NULL DEFAULT ''::character varying,
                          "added" timestamp NOT NULL DEFAULT now(),
                          PRIMARY KEY ("id")
                      )`);
  const targetUrl = 'https://www.coronavirus.vic.gov.au/who-can-get-vaccinated';
  const existingEligibilityFilePath = 'eligible_list.txt';

  const existingItems = new Promise((resolve) => {
    client
    .query('SELECT * FROM eligible_items')
    .then((row) => {
      resolve(row.rows);
    });
  });

  // Get live vic gov eligible list
  const liveItemsPromise = new Promise((resolve) => {
    request(targetUrl)
    .then((html) => {
      const $ = cheerio.load(html);
      const eligibleItems = [];
      $('.rpl-markup__inner').children('ul:first-of-type').children('li').each((i, e) => {
        eligibleItems.push($(e).text());
      });
      resolve(eligibleItems);
    });
  });

  const [existingArr, liveArr] = await Promise.all([existingItems, liveItemsPromise]);
  const existingArrSimple = (existingArr) ? existingArr.map((item) => item.content) : [];
  const newEligibleArr = liveArr.filter((x) => !existingArrSimple.includes(x));

  // If there is any difference
  if (newEligibleArr.length !== 0) {
    const notify = new Promise((resolve, reject) => {
      const transporter = nodeMailer.createTransport({
        host  : process.env.SMTP_HOST,
        port  : process.env.SMTP_PORT,
        secure: true,
        auth  : {
          // should be replaced with real sender's account
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
      const mailOptions = {
        // should be replaced with real recipient's account
        to     : process.env.EMAIL_TO,
        subject: 'VIC COVID19 Jab New Eligible Items',
        html   : `<pre style="white-space:initial"> <pre>${JSON.stringify(newEligibleArr)}</pre> </pre>`,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          resolve(false);
        }
        resolve(true);
      });
    });
    const update = new Promise((resolve) => {
      const valuesStr = newEligibleArr.map((item) => `('${item.toString()}')`).join();
      client
      .query(`INSERT INTO eligible_items(content) VALUES ${valuesStr}`)
      .then((res) => (resolve(res.rowCount === newEligibleArr.length)));
    });
    Promise.all([update, notify])
    .then(([updateRes, notifyRes]) => {
      if (updateRes === notifyRes) {
        console.log('Notified and Completed');
        process.exit(1);
      } else {
        console.log('Error occurred in either update or notify');
        process.exit(1);
      }
    });
  } else {
    console.log('Completed');
    process.exit(1);
  }
})().catch((err) => console.error(err));
