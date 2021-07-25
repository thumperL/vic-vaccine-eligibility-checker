# Victoria COVID-19 Vaccination Eligibility Tracker

Crawl https://www.coronavirus.vic.gov.au/who-can-get-vaccinated for any new eligible group and get notified with your choice of email address.

## Features

1. Parse the vic government eligibility page for eligibility groups and store in PostgreSQL Database

2. Notify your set email address if there is a new eligibility group item

4. Currently the codebase is built to work with Heroku, utilising their Heroku Scheduler Add-on.  You can add node-cron from npm, and wrap the the IIFE block with
```
cron.schedule('*/15 * * * *', async () => {
  (async () => {
    ...
  })().catch((err) => console.error(err));
});
```


## Prerequisites

1. [Node.js] v14.17.3 (https://nodejs.org/en/)

2. [PostgreSQL] v13 (https://postgresapp.com/, for easier installation)

## Installation

1. Install [nvm] (https://github.com/nvm-sh/nvm)

2. Use [nvm] to install [nodejs] v14.17.3
```
nvm install 14.17.3
nvm use 14.17.3
```

3. Run command to install dependencies.
```
npm install
```

4. Create your own .env file at folder root.  You will need to create your own SMTP account and edit .env accordingly.
```
touch .env
```
```
Then add content into .env based on the .env_sample file
```

4. Start the application, run the command below in terminal
```
npm run start
```

OR ELSE
1. Go to your Heroku service

2. Spin up your own Free Dyno

3. Go to resources, add 'Heroku Scheduler' and 'Heroku Postgres'

4. Setup the 'Config Vars' based on the .env_sample

5. Download this repository, and push that to your Heroku Service

6. Setup your Heroku Scheduler on how often you want your crawler to run.  I personally recommend once to twice per day will be sufficient.

## DISCLAIMER
PLEASE NOTE, USE THIS REPOSITORY AT YOUR OWN RISK.  I AM NOT LIABLE FOR ANY CONSEQUENCES THAT MAY BE CAUSED BY THIS CRAWLER.

## Contributor

> [Thumper](https://github.com/thumperL)