import colors from 'colors';
class Log {
  static LogLevels = {
    SUCCESS: Symbol('success'),
    CAUTION: Symbol('caution'),
    ERROR: Symbol('error'),
  }
  /**
   * Wraps the logged items with green checkboxes e.g. [✓] args [✓]
   * @param  {...any} args Statements that you want to be printed in the console
   */
  success(...args) {
    // numbers => yellow
    args = args.map(arg => isNaN(arg) ? arg : colors.yellow(arg));
    console.log(colors.green('[✓]'), ...args, colors.green('[✓]'));
  }
  /**
   * Wraps the logged items with yellow alertboxes e.g. [!] args [!]
   * @param  {...any} args 
   */
  caution(...args) {
    args = args.map(arg => isNaN(arg) ? arg : colors.yellow(arg))
    console.log(colors.yellow('[!]'), ...args, colors.yellow('[!]'));
  }
  /**
   * Wraps the error with red x boxes with each box on newlines
   * e.g.
   * [𝑥]
   * args
   * [𝑥]
   * @param  {...any} args 
   */
  error(...args) {
    args = args.map(arg => isNaN(arg) ? arg : colors.yellow(arg))
    console.log(colors.red('[𝑥]\n'), ...args, colors.red('\n[𝑥]'));
  }
}
export const log = new Log();
export default log;
