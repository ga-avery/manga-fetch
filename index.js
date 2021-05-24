// i made these 🙂
import './utils/shims';
import MangaDex       from './api/MangaDex';
import passport       from './config/ppConfig';
import auth           from './controllers/auth';
import search         from './controllers/search';
import download       from './controllers/download';
import isLoggedIn     from './middleware/isLoggedIn';
import db             from './models';
import {log, dirname} from './utils';

import flash          from 'connect-flash';
import express        from 'express';
import layouts        from 'express-ejs-layouts';
import session        from 'express-session';
import methodOverride from 'method-override';
import morgan         from 'morgan';

const __dirname = dirname(import.meta.url);

const app = express();
const mangadex = new MangaDex();
const session_secret = process.env.session_secret;

app.set('view engine', 'ejs');

// try {
//   const result = await mangadex.searchByID('37b87be0-b1f4-4507-affa-06c99ebb27f8', '5adf39d3-e9d3-4bf8-81eb-8f2741f6c5f3', '5927e373-f024-42ad-9307-6f4c05ea3fc4');
//   log.success(result);  
// } catch (error) {
//   log.error('whoops', error);
// }



// =======================
// ===== MIDDLEWARE ======
// =======================
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.static(`${__dirname}/public`));
app.use(layouts);
app.use(methodOverride('_method'));

app.use(session({
  secret: session_secret,
  resave: false,
  saveUninitialized: true,
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use((rq, rs, nxt) => {
  // this sets the locals object on the response object
  // this locals object is accessible on views
  // so .ejs files can access locals.currentUser
  rs.locals.alerts = rq.flash();
  // do _not_ use optional chaining to `get()` the user here
  // it will bypass the models/user.js `user.prototype.toJSON()`
  // override and will allow access to the password hash
  rs.locals.currentUser = rq.user;
  nxt();
});

app.use('/auth', auth);
app.use('/search', search);
app.use('/download', download);
app.use('/manga', download);
// =======================
// ========= GET =========
// =======================
app.get('/', (_, rs) => {
  rs.render('index');
});

app.get('/profile', isLoggedIn, async (rq, rs) => {
  const name = rq.user.name;
  const user = await db.user.findOne({ where: { name} });
  let lists = await db.list.findAll({ where: { userId: user.id }});
  lists = lists.map(({manga_id, type}) => ({manga_id, type}));
  const mangaInfo = await mangadex.searchByID(...lists.map(({manga_id}) => manga_id));
  const mangaInfoMap = new Map();
  for (const mi of mangaInfo) {
    mangaInfoMap.set(mi.data.id, mi.data);
  }
  for (const list of lists) {
    const mangaInfo = mangaInfoMap.get(list.manga_id);
    list.mangaInfo = mangaInfo;
  }
  const build = type => {
    const buttons = [];
    if (type === 'favorite') {
      buttons.push({text: '★', action: '/search/favorite?_method=DELETE'});
      buttons.push({text: 'save', action: '/search/favorite?_method=PUT'});
      return buttons;
    }
    buttons.push({text: '☆', action: '/search/later?_method=PUT'});
    buttons.push({text: 'saved', action: '/search/later?_method=DELETE'});
    return buttons;
  }
  lists = lists.map(manga => {
    const id = manga.manga_id;
    const type = manga.type;
    const title = manga.mangaInfo.attributes.title.en;
    const description = manga.mangaInfo.attributes.description.en;
    return {
      id,
      type,
      title,
      description,
      buttons: build(manga.type)
    }
  });
  rs.render('profile', {lists});
});

app.get('/*', (_, rs) => {
  rs.status(404).redirect('/');
})

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  log.success('Listening on port', port)
});

export default server;
