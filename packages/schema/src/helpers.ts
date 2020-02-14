import * as Ajv from "ajv";

export interface SchemaOptions {
  schema: any;
  schemaOptions: Ajv.Options;
}

export class Schema {
  private ajv: Ajv.Ajv;

  constructor(private opts: SchemaOptions) {
    this.ajv = new Ajv(this.opts.schemaOptions);
    this.ajv.addSchema(this.opts.schema);
  }

  get(name: string): Ajv.ValidateFunction | undefined {
    return this.ajv.getSchema("#/definitions/" + name);
  }
}
