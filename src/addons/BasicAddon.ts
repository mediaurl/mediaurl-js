import {
    Addon as AddonProps,
    ApiAddonRequest,
    ApiAddonResponse
} from "@watchedcom/schema";
import { AddonTypes } from "@watchedcom/schema/dist/types";
import { cloneDeep } from "lodash";

import { ActionHandler, HandlersMap } from "../interfaces";

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

    public getVersion(): AddonProps["version"] {
        return this.props.version;
    }

    public registerActionHandler<A extends Extract<keyof HM, string>>(
        action: A,
        handler: HM[A]
    ) {
        this.handlersMap[action] = handler;
        return this;
    }

    public unregisterActionHandler(action: keyof HandlersMap) {
        delete this.handlersMap[action];
    }

    public getActionHandler(action: string) {
        const handler = this.handlersMap[action];
        if (!handler) {
            throw new Error(`No handler for "${action}" action`);
        }
        return handler;
    }
}
