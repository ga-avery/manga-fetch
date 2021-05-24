import express from 'express';
import MangaDex from '../api/MangaDex';
const router = express.Router();
const mangadex = new MangaDex();

// TODO: hey, future avery, so what i'm thinking is that you should control the
// flow like this. downloadClick -> page that displays all chapters with titles
// to the user -> each chapter can be individually downloaded.
// Reasoning: then the download process should only take a few moments (stress
// test the API when you're doing this) -> those download buttons take you to a
// /download/manga/:mangaId page
// /download/manga/:mangaId sends you to /download/manga/chapter/:chapterHash
//
// hey, past avery, your ideas are bad and my ideas are better

router.get('/:mangaId', async (rq, rs) => {
  const { mangaId } = rq.params;
  const chapterList = await mangadex.mangaFeed(mangaId);
  rs.render('chapterList', { chapterList });
})

router.post('/:chapterId', async (rq, rs) => {
  const {chapterId} = rq.params;
  const {hash, page, title} = rq.body;
  const baseUrl = await mangadex.atHomeServer(chapterId);
  const buf = await mangadex.getImagesFromChapter(baseUrl, hash, page);
  rs.setHeader('Content-Length', buf.length);
  rs.setHeader('Content-Disposition', `attachment; filename="${title}.cbz"`);
  rs.write(buf, 'binary');
  rs.end();
})

export default router;
