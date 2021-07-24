# Victoria COVID Job Eligibility Tracker

Crawl https://www.coronavirus.vic.gov.au/who-can-get-vaccinated for any new eligible group and get notified with your choice of email address.

## Features

1. Parse the vic government eligibility page for eligibility groups

2. Add a new file with the new group's information, and the date/time it was added

3. Notify your set email address if there is a new group

4. Run based on cronjob.  Default is set to 15 mins


## Prerequisites

1. [Node.js] v14.17.3 (https://nodejs.org/en/)

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

4. Create your own .env file at folder root
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

2. Spin up your own Dyno

3. 
1. Download this repository, and push that to your Heroku Service

2. Go to resources
2. Setup the 'Config Vars' based on the .env_sample

## DISCLAIMER
PLEASE NOTE, USE THIS REPOSITORY AT YOUR OWN RISK.  I AM NOT LIABLE FOR ANY CONSEQUENCES THAT MAY BE CAUSED BY THIS CRAWLER.

## Contributor

> [Thumper](https://github.com/thumperL)