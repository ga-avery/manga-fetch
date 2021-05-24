import fetch from 'node-fetch';
import log from '../utils/log';

const BASE_URL = 'https://api.mangadex.org';
const refresh = Symbol('refresh');
const session = Symbol('session');
const get = Symbol('get');
const getBlob = Symbol('getBlob');
const post = Symbol('post');
const mfetch = Symbol('manga fetch');
const wait = Symbol('wait');
/**
 * This class is a map of the necessary API components from the
 * OpenAPI spec here: https://api.mangadex.org/api.yaml
 * at the time of writing this code the API is version 5.0.8
 * @author Avery Wood
 */
class MangaDex {
  // ==================
  // =====PRIVATE======
  // ==================
  /**
   * If present, automatically loads in the refresh token so that requests can
   * automatically be made with authentication (prevents you from storing
   * plaintext passwords)
   * @param {string} refreshToken 
   */
  constructor(refreshToken) {
    if (refreshToken) {
      this[refresh] = refreshToken;
    }
  }

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

  /**
   * Sends a GET request to the specified path with a JSON payload made from a
   * body object. The body object is a collection of k:v pairs.
   * 
   * This is an internal method which should not be called directly.
   * @param {string} path 
   * @param {{key?:string}} body 
   * @returns a promise resolving to JSON after server response.
   */
  async [post](path, body) {
    log.success('posting!', path, body);
    const init = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow',
      body: JSON.stringify(body),
    }
    return this[mfetch](path, init);
  }

  /**
   * Sends a GET request to the specified path with the querystring made from a
   * query array. The query array is a collection of k:v pairs.
   * 
   * This is an internal method which should not be called directly.
   * @param {string} path 
   * @param {[k, v]} query 
   * @returns {Promise<{}>} a promise resolving to JSON after server response.
   */
  async [get](path, query = []) {
    log.success('getting!', path)
    if (!path.endsWith('/')) {
      path += '/';
    }

    const queryParams = new URLSearchParams()
    for (const kv of query) {
      queryParams.append(kv[0], kv[1])
    }
    if (`${queryParams}`) {
      return this[mfetch](`${path}?${queryParams}`);
    }
    return this[mfetch](`${path}`)
  }

  /**
   * Refreshes the session token using the refresh token
   * 
   * This is an internal method which should not be called directly.
   */
  async [refresh]() {
    const refresh = await this[post]('auth/refresh', { token: this[refresh] });
    const json = await refresh.json();
    this[session] = json.token.session;
  }

  // ==================
  // ======PUBLIC======
  // ================== 
  /**
   * Sets the current session token and refresh token.
   * 
   * This should be called before using any APIs which require authentication.
   * @param {string} username
   * @param {string} password
   * @returns {{}} The JSON response from the server.
   */
  async login(username, password) {
    const json = await this[post]('/auth/login', { username, password })
    this[session] = json.token.session;
    this[refresh] = json.token.refresh;
    return json;
  }

  /**
   * Searches mangadex for series with a title that matches the search string.
   * @param {string} title 
   * @returns results array from the API call
   */
  async search(title) {
    const json = await this[get]('/manga', [['title', title]]);
    return json.results;
  }

  async searchByID(...ids) {
    const queries = ids.map(id => (['ids[]', id]))
    const json = await this[get]('/manga', queries);
    return json.results;
  }

  /**
   * Searches mangadex for the series from a corresponding manga uuid
   * @param {string} mangaId 
   * @returns Promise< object >
   */
  async series(mangaId) {
    const json = await this[get](`/manga/${mangaId}`)
    return json.data;
  }

  /**
   * Searches for the chapter list from the corresponding manga uuid in english
   * @param {string} mangaId 
   * @returns {Promise<{}>}
   */
  async mangaFeed(mangaId) {
    let [limit, offset, total, result] = [100, 0, 0, []];
    do {
      const json = await this[get](`/manga/${mangaId}/feed`, [
        ['translatedLanguage[]', 'en'],
        ['offset', offset],
        ['limit', limit],
      ]);
      [limit, offset, total] = [json.limit, json.offset, json.total];
      const chapters = json.results
        .map(({ data: { id, attributes: { volume, chapter, title, hash, data } } }) => {
          return { id, volume, chapter, title, hash, data };
        })
        .sort((a, b) => Number(a.chapter) - Number(b.chapter));
      result.push(...chapters);
      offset += limit;
    } while (limit + offset < total);
    return result;
  }

  async atHomeServer(chapterId) {
    const { baseUrl } = await this[get](`/at-home/server/${chapterId}`);
    return baseUrl;
  }

  async getImagesFromChapter(baseUrl, chapterHash, images) {
    images.forEach(imageUrl => {
      const image = this[getBlob](`${baseUrl}/data/${chapterHash}/${imageUrl}`);
    });
  }
  [getBlob](url, opts = {}) {

  }
  [wait](ms) {
    return new Promise(res => {
      this.timer = setTimeout(res, ms);
    });
  }
  // hash -> get mangadex.network server -> get images
}

export default MangaDex;
