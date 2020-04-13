export type OuterPromise<T = any> = {
  promise: PromiseLike<T>;
  resolve: (value?: any) => void;
  reject: (error: Error | string) => void;
  done: null | boolean;
};

/**
 * Utility function to resolve or reject promises outside the normal program flow.
 * Example:
 * ```
 * const p = outerPromise();
 * setTimeout(function firstCallback() { p.resolve(); }, 1000);
 * someHandler(async function otherCallback() {
 *   return await p.promise;
 * });
 * ```
 * @param timeout Optional timeout.
 */
export const outerPromise = (timeout?: number) => {
  let t: NodeJS.Timeout;
  const p: Partial<OuterPromise> = { done: null };
  p.promise = new Promise((a, b) => {
    p.resolve = value => {
      if (t) clearTimeout(t);
      p.done = true;
      a(value);
    };
    p.reject = error => {
      if (t) clearTimeout(t);
      p.done = true;
      b(error);
    };
  });
  const res = <OuterPromise>p;
  if (timeout) setTimeout(() => res.reject(new Error("Timeout")), timeout);
  return res;
};
