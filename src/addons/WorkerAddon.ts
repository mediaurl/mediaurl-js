import {
  ApiResolveRequest,
  ApiResolveResponse,
  WorkerAddon as WorkerAddonProps,
  WorkerAddonActions,
  WorkerAddonResourceActions
} from "@watchedcom/schema";

import { ActionHandlerContext, ActionHandlers } from "../interfaces";
import { makeCreateFunction } from "../utils/addon-func";

import { BasicAddon } from "./BasicAddon";

export type WorkerHandlers = Pick<
  ActionHandlers<WorkerAddon>,
  WorkerAddonActions
>;

const resourceActions: WorkerAddonResourceActions[] = [
  "directory",
  "item",
  "source",
  "subtitle",
  "resolve"
];

type ResolverHandlerFn = (
  match: RegExpExecArray,
  input: ApiResolveRequest,
  ctx: ActionHandlerContext
) => Promise<ApiResolveResponse>;

type Resolver = {
  pattern: RegExp[];
  handler: ResolverHandlerFn;
};

export class WorkerAddon extends BasicAddon<WorkerHandlers, WorkerAddonProps> {
  private resolvers: Resolver[];

  constructor(props: WorkerAddonProps) {
    super(props);
    this.resolvers = [];
  }

  public validateAddon() {
    if (!this.props.actions.length) {
      throw new Error(`A worker addon needs at least one action`);
    }
    if (
      this.props.actions.some(action =>
        ["item", "source", "subtitle"].includes(action)
      ) &&
      !this.props.itemTypes?.length
    ) {
      throw new Error(
        `Worker addon actions "item", "source" and "subtitle" need at least one value in "itemType".`
      );
    }
  }

  public registerActionHandler<A extends Extract<keyof WorkerHandlers, string>>(
    action: A,
    handler: WorkerHandlers[A]
  ) {
    // Add actions which are not yet defined
    const resourceAction = <WorkerAddonResourceActions>action;
    if (
      resourceActions.includes(resourceAction) &&
      !this.props.actions.includes(resourceAction)
    ) {
      this.props.actions.push(resourceAction);
    }

    return super.registerActionHandler(action, handler);
  }

  // Helper function to create resolver functions for multiple hosts.
  // Of course you still can use the direct method via
  // `registerActionHanlder("resolve", handlerFunction)`.
  public async addResolveHandler(
    pattern: RegExp | string | (RegExp | string)[],
    handler: ResolverHandlerFn
  ) {
    // Prepare the `pattern` parameter
    if (!Array.isArray(pattern)) pattern = [pattern];
    pattern = pattern.map(p => (typeof p === "string" ? new RegExp(p) : p));

    // Add the handler to our resolvers
    this.resolvers.push({ pattern: <RegExp[]>pattern, handler });

    // Add the patterns to `addon.urlPatterns`
    if (!this.props.urlPatterns) this.props.urlPatterns = [];
    for (const p of pattern) {
      this.props.urlPatterns.push((<RegExp>p).source);
    }

    // Register the default resolve action handler
    if (!this.hasActionHandler("resolve")) {
      this.registerActionHandler("resolve", async (input, ctx) => {
        for (const resolver of this.resolvers) {
          for (const pattern of resolver.pattern) {
            const match = pattern.exec(input.url);
            if (match) {
              return await resolver.handler(match, input, ctx);
            }
          }
        }
        throw new Error("No resolver found");
      });
    }

    return this;
  }
}

export const createWorkerAddon = makeCreateFunction<
  WorkerAddonProps,
  WorkerAddon
>({
  AddonClass: WorkerAddon,
  type: "worker",
  defaults: { actions: [] }
});
