import passport from 'passport'
import local from 'passport-local';
import db from '../models/index';
import log from '../utils/log';
const LocalStrategy = local.Strategy;

const STRATEGY = new LocalStrategy({
  usernameField: 'name',
  passwordField: 'password',
}, async (name, password, cb) => {
  try {
    const user = await db.user.findOne({
      where: { name },
    });
    if (!user || !user.validPassword(password)) {
      cb(null, false);
    } else {
      cb(null, user);
    }
  } catch (err) {
    log.error(err)
  }
});

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
  try {
    const user = await db.user.findByPk(id);
    if (user) {
      cb(null, user);
    }
  } catch (err) {
    log.error(err);
  }
});

passport.use(STRATEGY);
export default passport;
