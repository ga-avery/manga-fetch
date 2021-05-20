const isLoggedIn = (rq, rs, nxt) => {
  if (!rq.user) {
    rq.flash('error', 'You must be signed in to access page');
    rs.redirect('/auth/login');
  } else {
    nxt();
  }
}
export default isLoggedIn;
