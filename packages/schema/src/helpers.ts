import type { Options, ValidateFunction } from "ajv";
import Ajv from "ajv";

export interface SchemaOptions {
  schema: any;
  schemaOptions: Options;
}

export class Schema {
  private ajv: Ajv;

  constructor(private opts: SchemaOptions) {
    this.ajv = new Ajv(this.opts.schemaOptions);
    this.ajv.addSchema(this.opts.schema);
  }

  get(name: string): ValidateFunction | undefined {
    return this.ajv.getSchema("#/definitions/" + name);
  }
}
