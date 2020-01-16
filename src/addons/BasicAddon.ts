import {
    Addon as AddonProps,
    ApiAddonRequest,
    ApiAddonResponse
} from "@watchedcom/schema";
import { AddonTypes } from "@watchedcom/schema/dist/types";
import { cloneDeep } from "lodash";
import {
    ActionHandler,
    ActionOptions,
    defaultActionOptions,
    HandlerOptionsMap,
    HandlersMap,
    StrictActionOptions
} from "../interfaces";

export type BasicHandlers = {
    addon: ActionHandler<ApiAddonRequest, ApiAddonResponse, BasicAddon>;
};

export abstract class BasicAddon<
    HM extends HandlersMap = BasicHandlers,
    P extends AddonProps = AddonProps
> {
    private handlersMap: HandlersMap = {
        addon: async () => this.getProps()
    };
    private handlerOptionsMap: HandlerOptionsMap = {
        addon: <StrictActionOptions>cloneDeep(defaultActionOptions)
    };

    constructor(private readonly props: P) {}

    public getProps(): P {
        return cloneDeep(this.props);
    }

    public getType(): AddonTypes {
        return this.props.type;
    }

    public getId(): AddonProps["id"] {
        return this.props.id;
    }

    public registerActionHandler<A extends Extract<keyof HM, string>>(
        action: A,
        handler: HM[A],
        options?: ActionOptions
    ) {
        this.handlersMap[action] = handler;
        this.handlerOptionsMap[action] = {
            ...defaultActionOptions,
            ...options,
            cache: {
                ...defaultActionOptions.cache,
                ...options?.cache
            }
        };
        return this;
    }

    public unregisterActionHandler(action: keyof HandlersMap) {
        delete this.handlersMap[action];
        delete this.handlerOptionsMap[action];
    }

    public getActionHandler(
        action: string
    ): { handler: ActionHandler; options: StrictActionOptions } {
        const handler = this.handlersMap[action];
        if (!handler) {
            throw new Error(`No handler for "${action}" action`);
        }
        return {
            handler,
            options: this.handlerOptionsMap[action]
        };
    }
}
