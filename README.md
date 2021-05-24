https://manga-fetch.herokuapp.com

## technologies used
bcrypt, colors, connect-flash, dotenv, ejs, express, express-ejs-layouts, express-session, jszip, method-override, morgan, node-fetch, openapi, passport, passport-local, pg, sequelize

## approach taken
My approach to this project was API-first, with a clear disregard for the UI and UX of the website (coming in v0.2.0 I Promise\<pending\>)

I decided that it was most important to get the basic form of the API mapped out as fast as possible, as it is a brand new API (released for developer testing earlier this month \[May 2020\]) This enabled me to have the freedom to work on other things and only have to come back and make minor tweaks here and there as breaking changes were implemented in the mangadex API.

I took the time to write my own logger with three different logging levels to help myself visualize where everything was happening.


## installation instructions
To install:
1. install the necessary components (PostGres, Git, Node (this was developed on node version 15.14.0))
2. clone this repository
3. run `npm i` on the directory to pull in all of the necessary node modules
4. create a `.env` file in the root directory of the repository and add in your `session_secret` key value pair
5. create your database(s) named `manga_[dev|prod|test]`
6. run `sequelize db:migrate` to instantiate your ORM
7. run `npm run nodemon` or `npm start`

## unsolved problems
Every now and then the API will kick a request, the patch that I have right now is to simply replay the requests up to 15 times before giving up (with some delay) before exploding. I'll solve the explosion with proper error handling in a future version, the clearest patch that I could do is make my project compatible with [forever](https://www.npmjs.com/package/forever)
