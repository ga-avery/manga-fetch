import express from 'express';
import MangaDex from '../api/MangaDex';
import db from '../models';
import { nameToColor, log } from '../utils';
import sequelize from 'sequelize';
const router = express.Router();
const mangadex = new MangaDex();
// mangadex.login(process.env.username, process.env.password);
// ===================
// ======= GET =======
// ===================
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

// ===================
// ===== DELETE ======
// ===================
const getUserList = async (userName, mangaId) => {
  const user = await db.user.findOne({ where: { name: userName } })
  const userId = user.id;
  const list = await db.list.findOne({
    where: {
      manga_id: mangaId,
      userId,
    }
  });
  return list;
}

router.delete('/favorite', async (rq, rs) => {
  const list = await getUserList(rq.user.name, rq.body.id);
  list.destroy();
  rs.redirect(rq.header('Referer'));
});

router.delete('/later', async (rq, rs) => {
  const list = await getUserList(rq.user.name, rq.body.id);
  list.destroy();
  rs.redirect(rq.header('Referer'));
});

// ===================
// ======= PUT =======
// ===================
router.put('/favorite', async (rq, rs) => {
  const list = await getUserList(rq.user.name, rq.body.id);
  list.update({type: 'read_later'});
  rs.redirect(rq.header('Referer'));
});

router.put('/later', async (rq, rs) => {
  const list = await getUserList(rq.user.name, rq.body.id);
  list.update({type: 'favorite'});
  rs.redirect(rq.header('Referer'));
});

// ===================
// ====== POST =======
// ===================
router.post('/later', async (rq, rs) => {
  const name = rq.user.name;
  const user = await db.user.findOne({ where: { name} });
  if (user) {
    await user.createList({
      manga_id: rq.body.id,
      type: 'read_later',
    });
  } else {
    log.error('user not found in database', rq.user.name);
  }
  rs.redirect(rq.header('Referer'));
});

router.post('/favorite', async (rq, rs) => {
  const name = rq.user.name;
  const user = await db.user.findOne({ where: { name } });
  if (user) {
    await user.createList({
      manga_id: rq.body.id,
      type: 'favorite',
    });
  } else {
    log.error('user not found in database', rq.user.name);
  }
  rs.redirect(rq.header('Referer'));
});

export default router;