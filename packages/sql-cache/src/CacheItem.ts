import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity({ name: "mediaurl_cache" })
export class CacheItem {
  @PrimaryColumn()
  k: string;

  @Column("simple-json")
  v: string;

  @Column("bigint", { nullable: true })
  d: number | null;
}
