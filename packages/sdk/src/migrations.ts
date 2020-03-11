import {
  AddonRequest,
  AddonResponse,
  DirectoryRequest,
  DirectoryResponse
} from "@watchedcom/schema";

const sdkVersion: string = require("../package.json").version;

export const migrations = {
  addon: {
    response(data: any, sig: any, input: AddonRequest, output: AddonResponse) {
      output.sdkVersion = sdkVersion;
      return output;
    }
  },
  directory: {
    request(data: any, sig: any, input: DirectoryRequest) {
      if (input.page !== undefined && input.cursor === undefined) {
        console.warn("Upgrading directory request from page to cursor system");
        data.update = 1;
        input.cursor = input.page === 1 ? null : input.page;
      }
      return input;
    },
    response(
      data: any,
      sig: any,
      input: DirectoryRequest,
      output: DirectoryResponse
    ) {
      if (data.update === 1) {
        output.hasMore = output.nextCursor !== null;
      }
      return output;
    }
  }
};
