import { DirectoryRequest, DirectoryResponse } from "@watchedcom/schema";

export const migrations = {
  directory: {
    async request(data: any, sig: any, input: DirectoryRequest) {
      if (input.page !== undefined && input.cursor === undefined) {
        console.warn("Upgrading directory request from page to cursor system");
        data.update = 1;
        input.cursor = input.page;
      }
      return input;
    },
    async response(
      data: any,
      sig: any,
      input: DirectoryRequest,
      output: DirectoryResponse
    ) {
      if (data.update === 1) {
        output.nextCursor = output.hasMore ? input.page + 1 : null;
        delete output.hasMore;
      }
      return output;
    }
  }
};
