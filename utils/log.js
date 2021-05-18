import colors from 'colors';
class Log {
  /**
   * Wraps the logged items with green checkboxes e.g. [✓] args [✓]
   * @param  {...any} args Statements that you want to be printed in the console
   */
  success(...args) {
    console.log(colors.green('[✓]'), ...args, colors.green('[✓]'));
  }
  /**
   * Wraps the logged items with yellow alertboxes e.g. [!] args [!]
   * @param  {...any} args 
   */
  caution(...args) {
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
    console.log(colors.red('[𝑥]\n'), ...args, colors.red('\n[𝑥]'));
  }
}

export default new Log();
