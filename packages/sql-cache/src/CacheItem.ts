import { Entity, Column, Index, PrimaryColumn } from "typeorm";

@Index(["k"], { unique: true })
@Entity({ name: "mediaurl_cache" })
export class CacheItem {
  @PrimaryColumn()
  k: string;

  @Column("simple-json")
  v: string;

  @Column({ nullable: true })
  d?: Date;
}
