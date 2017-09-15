import { pbkdf2, randomBytes } from 'crypto'
import { Connection } from 'typeorm'
import UserModel from '../Models/User'

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

const randomBytesAsync = (n: number) =>
  new Promise<string>((resolve, reject) =>
        randomBytes(n, (err, buf) =>
          err ? reject(err) : resolve(buf.toString('base64'))))

export default class UserController {
  constructor(private connection: Promise<Connection>){}
  async create(settings: {
    username:string,
  }, password: string){

    const salt = await randomBytesAsync(16)

    const hash = await hashpass(password, salt)
    
    return await (await this.connection)
    .manager.save(new UserModel({
      username: settings.username,
      hash,
      salt
    }))
  }
  async verify(username: string, password: string){
    const user = await (await this.connection)
    .manager.findOne(UserModel, { username })

    return user && slowEquals(user.hash, await hashpass(password, user.salt)) ? user : null
  }
  async updateSettings(userId: string, settings: Partial<{
    username:string,
    githubUserName: string,
    slackUserId: string,
    slackOauthState: string,
    slackAccessToken: string,
  }>) {
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
  async createSlackOathState(id: string){
    const slackOauthState = await randomBytesAsync(16)
    
    await (await this.connection)
    .manager.updateById(UserModel, id, { slackOauthState })

    return slackOauthState
  }
  async getBySlackOathState(slackOauthState: string){
    return await (await this.connection)
    .manager.findOne(UserModel, { slackOauthState })
  }
  async getBySlackUserId(slackUserId: string){
    return await (await this.connection)
    .manager.findOne(UserModel, { slackUserId })
  }
  async changePassword(userId: string, password: string){

    const salt = await randomBytesAsync(16)
    const hash = await hashpass(password, salt)
    return await (await this.connection)
    .manager.updateById(UserModel, userId, { salt, hash })
  }
  async all(){
    const users = await (await this.connection)
    .getRepository(UserModel)
    .find()

    return users.map(({
        id,
        username,
        slackUserId,
        githubUserName
    }) => ({ id, username, slackUserId, githubUserName }))
  }
}
