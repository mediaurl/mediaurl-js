import { testCache } from "@mediaurl/test-utils";
import { CassandraCache } from "../src";

if (process.env.CASSANDRA_CONFIG) {
  let config: string;
  try {
    config = JSON.parse(<string>process.env.CASSANDRA_CONFIG);
  } catch (error) {
    config = process.env.CASSANDRA_CONFIG;
  }
  testCache("cassandra", () => new CassandraCache(config), 2);
} else {
  describe("CassandraCache", () => {
    test("noop", () => {});
  });
}
