/**
 * An error which will not log any backtrace.
 *
 * All errors with the property `noBacktraceLog` set to `true` will not show a
 * backtrace on the console.
 */
export class SilentError extends Error {
  public noBacktraceLog: boolean;

  constructor(message: any) {
    super(message);
    this.noBacktraceLog = true;
  }
}
