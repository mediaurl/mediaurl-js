import {
    Addon as AddonProps,
    ApiAddonRequest,
    ApiAddonResponse
} from "@watchedcom/schema";

import { ActionHandler } from "../interfaces";
import { ActionsMap } from "../interfaces";

export type BasicActions = {
    addon: ActionHandler<ApiAddonRequest, ApiAddonResponse>;
};

export abstract class BasicAddon<
    AM extends ActionsMap = BasicActions,
    P extends AddonProps = AddonProps
> {
    private handlersMap: ActionsMap = {
        addon: async () => {
            return this.getProps();
        }
    };

    public hasRepository = false;
    public isRootAddon = false;

    constructor(private props: P) {}

    public getProps(): P {
        return this.props;
    }

    public registerActionHandler<A extends Extract<keyof AM, string>>(
        action: A,
        handlerFn: AM[A]
    ) {
        // if (this.handlersMap[action]) {
        //     throw new Error(
        //         `Another handler is already registered for "${action}" action`
        //     );
        // }
        this.handlersMap[action] = handlerFn;

        return this;
    }

    public unregisterActionHandler(action: keyof ActionsMap) {
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
