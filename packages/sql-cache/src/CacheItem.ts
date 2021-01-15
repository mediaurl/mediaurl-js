import { Entity, Column, Index, PrimaryGeneratedColumn } from "typeorm";

@Index(["k"], { unique: true })
@Entity({ name: "mediaurl_cache" })
export class CacheItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  k: string;

  @Column("simple-json")
  v: string;

  @Column({ nullable: true })
  d?: Date;
}
