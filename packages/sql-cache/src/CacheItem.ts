import { Entity, Column, Index, PrimaryColumn } from "typeorm";

@Entity({ name: "mediaurl_cache" })
export class CacheItem {
  @PrimaryColumn()
  k: string;

  @Column("simple-json")
  v: string;

  @Index()
  @Column("bigint", { nullable: true })
  d: number | null;
}
