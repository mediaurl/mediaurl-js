import {
    Addon as AddonProps,
    ApiAddonRequest,
    ApiAddonResponse
} from "@watchedcom/schema";
import { AddonTypes } from "@watchedcom/schema/dist/types";
import { cloneDeep } from "lodash";

import { ActionHandler } from "../interfaces";
import { HandlersMap } from "../interfaces";

export type BasicHandlers = {
    addon: ActionHandler<ApiAddonRequest, ApiAddonResponse, BasicAddon>;
};

export abstract class BasicAddon<
    HM extends HandlersMap = BasicHandlers,
    P extends AddonProps = AddonProps
> {
    private handlersMap: HandlersMap = {
        addon: async () => {
            return this.getProps();
        }
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
        handlerFn: HM[A]
    ) {
        this.handlersMap[action] = handlerFn;
        return this;
    }

    public unregisterActionHandler(action: keyof HandlersMap) {
        delete this.handlersMap[action];
    }

    public getActionHandler(action: string): ActionHandler {
        const handlerFn = this.handlersMap[action];
        if (!handlerFn) {
            throw new Error(`No handler for "${action}" action`);
        }
        return handlerFn;
    }
}
