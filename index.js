// i made these 🙂
import './utils/shims';
import auth           from './controllers/auth';
import search         from './controllers/search';
import isLoggedIn     from './middleware/isLoggedIn';
import {log, dirname} from './utils';
import passport       from './config/ppConfig';

import express        from 'express';
import layouts        from 'express-ejs-layouts';
import flash          from 'connect-flash';
import session        from 'express-session';
import morgan         from 'morgan';
import methodOverride from 'method-override';

const __dirname = dirname(import.meta.url);

const app = express();
const session_secret = process.env.session_secret;

app.set('view engine', 'ejs');

// flow that works
// const mangadex = new MangaDex();
// const maiddragonId = (await mangadex.search('kobayashi dragon'))[0].data.id;
// log.success('maiddragonId', maiddragonId);
// const firstChapter = (await mangadex.mangaFeed(maiddragonId))[0];
// log.success('firstChapter', firstChapter);
// const chapterId = firstChapter.id;
// log.success('chapterId', chapterId);
// const baseUrl = await mangadex.atHomeServer(chapterId);
// log.success('baseUrl', baseUrl); 
// const chapterHash = firstChapter.hash;
// const fileNames = firstChapter.data
//   .map(fileName => `${baseUrl}/data/${chapterHash}/${fileName}`);
// log.caution('firstChapterImages', fileNames);


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
// =======================
// ========= GET =========
// =======================
app.get('/', (_, rs) => {
  rs.render('index');
});

app.get('/profile', isLoggedIn, (_, rs) => {
  rs.render('profile');
});

app.get('/*', (_, rs) => {
  rs.status(404).redirect('/');
})

const port = process.env.port || 8080;
const server = app.listen(port, () => {
  log.success('Listening on port', port)
});

export default server;
