import express from 'express';
import passport from 'passport';
import MangaDex from '../api/MangaDex';
import db from '../models';
import {nameToColor, log} from '../utils';
const router = express.Router();
const mangadex = new MangaDex();
// mangadex.login(process.env.username, process.env.password);
// ===================
// ======= GET =======
// ===================
router.get('/', async (rq, rs) => {
  if(rq.query.manga) {
    const results = await mangadex.search(rq.query.manga);
    rs.render('search/result', { results, nameToColor });
    return;
  }
  rs.render('index');
});

// ===================
// ====== POST =======
// ===================
router.post('/download', async (rq, rs) => {
  console.log(rq.body)
  rs.json(rq.body);
});


export default router;