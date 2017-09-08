import { Entity, PrimaryGeneratedColumn, Column, Connection, Index } from 'typeorm'
import { pbkdf2, randomBytes } from 'crypto'
import { Decorator } from './Decorator'
import { Form, Input } from './FormUtils'

@Entity()
export class UserModel extends Decorator<Partial<UserModel>> {
  @PrimaryGeneratedColumn("uuid")
  id: string
  @Column("varchar", { nullable: true })
  slackUserId: string
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
const hashpass = (password: string, salt: string) => new Promise<string>((resolve, reject) =>
  pbkdf2(password, salt, 100000, 512, 'sha512', (err, derivedKey) =>
    err ? reject(err) : resolve(derivedKey.toString('hex'))))

const slowEquals = (a: string, b: string) => {
    let diff = a.length ^ b.length;
    for (let i = 0; i < a.length && i < b.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
}
export class UserController {
  constructor(private connection: Promise<Connection>){}
  async create(settings: {
    username:string,
    slackUserId: string,
    githubUserName: string
  }, password: string){

    const salt = await new Promise<string>((resolve, reject) =>
      randomBytes(16, (err, buf) =>
        err ? reject(err) : resolve(buf.toString('utf8'))))

    const hash = await hashpass(password, salt)
    
    return await (await this.connection)
    .manager.save(new UserModel({
      username: settings.username,
      slackUserId: settings.slackUserId,
      githubUserName: settings.githubUserName,
      hash,
      salt
    }))
  }
  async verify(username: string, password: string){
    const user = await (await this.connection)
    .manager.findOne(UserModel, { username })

    return user && slowEquals(user.hash, await hashpass(password, user.salt)) ? user : null
  }
  async updateSettings(userId: string, settings: {
    username:string,
    slackUserId: string,
    githubUserName: string
  }) {
    return await (await this.connection)
    .manager.updateById(UserModel, userId, settings)
  }
  async getById(id: string){
    return await (await this.connection)
    .manager.findOne(UserModel, { id })
  }
  async getByGitHubUserName(githubUserName: string){
    return await (await this.connection)
    .manager.findOne(UserModel, { githubUserName })
  }
  async getBySlackUserId(slackUserId: string){
    return await (await this.connection)
    .manager.findOne(UserModel, { slackUserId })
  }
}

export const SignUpForm = () => Form({
  action: '/sign-up',
  children: [
    Input({ type: 'text', id: 'username', name: 'Username' }),
    Input({ type: 'password', id: 'password', name: 'Password' }),
    Input({ type: 'text', id: 'slackUserId', name: 'Slack User Id' }),
    Input({ type: 'text', id: 'githubUserName', name: 'Github Username' }),
  ],
})
export const SignInForm = () => Form({
  action: '/sign-in',
  children: [
    Input({ type: 'text', id: 'username', name: 'Username' }),
    Input({ type: 'password', id: 'password', name: 'Password' }),
  ],
})
export const SettingsForm = (user:UserModel) => Form({
  action: '/settings',
  children: [
    Input({ type: 'text',
      id: 'username',
      name: 'Username',
      value: user.username
    }),
    Input({ type: 'text',
      id: 'slackUserId',
      name: 'Slack User Id',
      value: user.slackUserId
    }),
    Input({ type: 'text',
      id: 'githubUserName',
      name: 'Github Username',
      value: user.githubUserName
    }),
  ],
})