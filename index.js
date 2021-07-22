/* Required Packages */
const request = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');

/* Const variables */
const targetUrl = 'https://www.coronavirus.vic.gov.au/who-can-get-vaccinated';

request(targetUrl)
  .then((html) => {
    const $ = cheerio.load(html);
    const eligible_content = $('.rpl-markup__inner');
  }) 
  .catch((err) => console.log(err));