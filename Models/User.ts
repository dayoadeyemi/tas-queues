import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm'
import { Decorator } from '../Decorator'

@Entity()
export default class UserModel extends Decorator<Partial<UserModel>> {
  @PrimaryGeneratedColumn("uuid")
  id: string
  @Column("varchar", { nullable: true })
  slackUserId: string
  @Column("varchar", { nullable: true })
  @Index({ unique: true })
  slackOauthState: string
  @Column("varchar", { nullable: true })
  slackAccessToken: string
  @Column("varchar", { nullable: true })
  githubUserName: string
  @Column("varchar")
  @Index({ unique: true })
  username: string
  @Column("varchar")
  hash: string
  @Column("varchar")
  salt: string
}
