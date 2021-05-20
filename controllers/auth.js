import express from 'express';
const router = express.Router();
import log from '../utils/log'
import passport from '../config/ppConfig';
import db from '../models/';

// ===================
// ======= GET =======
// ===================
router.get('/signup', (_, rs) => {
  rs.render('auth/signup');
});

router.get('/login', (_, rs) => {
  rs.render('auth/login');
});

router.get('/logout', (rq, rs) => {
  rq.logout();
  rq.flash('success', 'Logging out... See you next time!');
  rs.redirect('/');
});

// ===================
// ====== POST =======
// ===================
/**
 * This function handles the /signup POST route.
 * @param {Request} rq 
 * @param {Response} rs 
 * @returns Promise<void>
 */
const signup = async (rq, rs) => {
  const { email, name, password } = rq.body;
  try {
    const [user, created] = await db.user.findOrCreate({
      where: { email },
      defaults: { name, password }
    });
    if (created) {
      const successObject = {
        successRedirect: '/',
        successFlash: `Welcome ${user.name}. Account was created and logging in...`,
      }
      passport.authenticate('local', successObject)(rq, rs);
    } else {
      rq.flash('error', 'Email already exists');
      rq.redirect('/auth/signup');
    }
  } catch (err) {
    log.error(err);
    rq.flash('error', 'Either email or password is incorrect. Please try again.');
    rs.redirect('/auth/signup')
  }
}
router.post('/signup', signup);

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/auth/login',
  successFlash: 'Welcome back ...',
  failureFlash: 'Either email or password are incorrect',
}));

export default router;
