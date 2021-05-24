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

## snippy

```js
class MangaDex {
  /**
   * This is the base request function for the mangadex API, it automatically
   * refreshes the session if it is detected as expired and repeats the initial
   * fetch call, ensuring that post/get calls receive expected values.
   * 
   * This is an internal method which should not be called directly.
   * @param {string} path 
   * @param {{}} init 
   * @returns json from the endpoint
   * @throws unknown error
   */
  async [mfetch](path, init = { method: 'GET', headers: {} }, retry = 0) {
    retry > 0
      ? log.caution('fetching:', path, retry)
      : log.caution('fetching:', path);
    if (this[session]) {
      log.success('Appending session token to request')
      init.headers.session = this[session];
    }
    let response;
    try {
      response = await fetch(`${BASE_URL}${path}`, init);
    }
    catch (error) {
      if (retry > 15) {
        throw new Error('maximum retries reached');
      }
      log.error('error, could not connect', retry, error);
      await this[wait](2000);
      return this[mfetch](path, init, retry+1);
    }
    const json = await response.json();
    if (json?.result === 'error') {
      // 401 Unauthorized
      if (json.errors.some(error => error.status === 401)) {
        // We logged in, but our sessionToken expired
        if (this[refresh]) {
          log.caution('Authorization expired, refreshing token...')
          await this[refresh]();
          return this[mfetch](path, init);
        }
      }
      throw new Error(JSON.stringify(json));
    }
    return json;
  }
}
```

```js
/**
 * Generate personalized colors based on a given name :D
 * @param {string} name 
 * @returns css compatible hex-color
 */
export const nameToColor = name => ('#' + parseInt(name, 36)
                                    .toString(16)
                                    .padStart(8, '0'))
                                  .slice(0, 9);

export default nameToColor;
```
```js
router.get('/', async (rq, rs) => {
  if (rq.query.manga) {
    const results = await mangadex.search(rq.query.manga);
    let display = results.map((
      { data: { id, type, attributes: { title, description } } }) => {
      return {
        id,
        type,
        title: title.en,
        description: description.en,
      }
    });
    const favorites = new Set();
    const readLaters = new Set();
    if (rq.user) {
      const user = await db.user.findOne({ where: { name: rq.user.name } })
      const userId = user.id;
      const list = await db.list.findAll({
        where: {
          userId,
          [sequelize.Op.or]: display.map(({id}) => {return {manga_id: id}}),
        }
      });
      list.forEach(manga => {
        if (manga.type === 'favorite') {
          favorites.add(manga.manga_id);
          return
        }
        readLaters.add(manga.manga_id);
      })
    }
    function build (hasFavorited, hasReadLayer) {
      const buttons = [];
      if (hasFavorited) {
        buttons.push({text: '★', action: '/search/favorite?_method=DELETE'});
        buttons.push({text: 'save', action: '/search/favorite?_method=PUT'});
        return buttons;
      }
      if (hasReadLayer) {
        buttons.push({text: '☆', action: '/search/later?_method=PUT'});
        buttons.push({text: 'saved', action: '/search/later?_method=DELETE'});
        return buttons
      }
      buttons.push({text: '☆', action: '/search/favorite'});
      buttons.push({text: 'save', action: '/search/later'});
      return buttons
    }
    display = display.map(manga => {
      const hasFavorited = favorites.has(manga.id);
      const hasReadLater = readLaters.has(manga.id);
      return {
        ...manga,
        buttons: build(hasFavorited, hasReadLater),
      };
    });
    rs.render('search/result', { display, nameToColor });
    return;
  }
  rs.render('index');
});
```