import path from 'path'
import { fileURLToPath } from 'url';
/**
 * @param {string} fileUrl
 * @returns a directory path from a given file url.
 */
export const dirname = fileUrl => fileURLToPath(path.dirname(fileUrl))
export default dirname;