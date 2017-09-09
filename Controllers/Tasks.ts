import { Connection } from 'typeorm'
import TaskModel from '../Models/Task'
import { EventEmitter } from 'events'

export default class TaskController {
  private events: EventEmitter
  constructor(private connection: Promise<Connection>){
    this.events = new EventEmitter()
    this.events.addListener(`/tasks`, async (task: TaskModel) => {
      const highest = await this.highest(task.userId)
      if (!highest || task.id === highest.id) {
        this.events.emit(`/tasks/latest`, task)
      }
    })
  }
  addLatestListener(listener: (task: TaskModel) => void){
    this.events.addListener(`/tasks/latest`, listener)
  }
  addListener(userId: string, listener: (task: TaskModel) => void){
    this.events.addListener(`/users/${userId}/tasks`, listener)
  }
  removeListener(userId: string, listener: (task: TaskModel) => void){
    this.events.removeListener(`/users/${userId}/tasks`, listener)
  }
  async update(where: Partial<TaskModel>, updates: Partial<TaskModel>){
    return await (await this.connection).manager.update(TaskModel, where, updates)
  }
  async archive(userId: string, id: string){
    return await (await this.connection).manager.update(TaskModel, {
      id, userId
    }, { archivedAt: new Date() })
  }
  async report(userId: string, archivedAt: string){
    return await (await this.connection)
    .getRepository(TaskModel)
    .createQueryBuilder('task')
    .where("task.userId = :userId AND task.deletedAt IS NULL AND task.archivedAt > :archivedAt", {
      userId, archivedAt
    })
    .orderBy({ priority: 'DESC' })
    .getMany()
  }
  async list(userId: string){
    return await (await this.connection).manager.find(TaskModel, {
        where: { userId, archivedAt: null, deletedAt: null },
        order: { priority: 'DESC' }
    })
  }
  async highest(userId: string, where: Partial<TaskModel> = {}){
    return await (await this.connection).manager.findOne(TaskModel, {
        where: Object.assign({
          userId,
          archivedAt: null,
          deletedAt: null,
        }, where),
        order: { priority: 'DESC' }
    })
  }
  async add(userId: string, task: TaskModel){
    task.userId = userId
    if (!task.priority) {
      const highest = await this.highest(userId, { queue: task.queue })
      task.priority = highest ? highest.priority + 1 : 0
    }
    const saved = await (await this.connection).manager.save(task)
    this.events.emit(`/users/${userId}/tasks`, saved);
    this.events.emit(`/tasks`, saved);
    return saved
  }
}
