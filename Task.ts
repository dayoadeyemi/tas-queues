import { Entity, PrimaryColumn, Column, Index, PrimaryGeneratedColumn, Connection, FindOneOptions, CreateDateColumn } from 'typeorm'
import { Modal } from './Modal'
import { Decorator } from './Decorator'
import { Form, Input } from './FormUtils'
import { EventEmitter } from 'events'
import { Converter } from 'showdown'

@Entity('task',{ 
  orderBy: {
    queue: 'ASC',
    priority: 'DESC'
  }
})
@Index('list', (task: TaskModel) => [task.userId, task.archivedAt, task.queue, task.priority], { unique: true })
export class TaskModel extends Decorator<Partial<TaskModel>>{
  @PrimaryGeneratedColumn("uuid")
  id: string
  @Column("varchar")
  userId: string
  @Column("int")
  priority: number
  @CreateDateColumn("CURRENT_TIMESTAMP(6)")
  createdAt: Date
  @Column("timestamp", { nullable: true })
  archivedAt: Date
  @Column("timestamp", { nullable: true })
  deletedAt: Date
  @Column("varchar", { default: 'q1' })
  queue: string
  @Column("int", { default: 1 })
  estimate: number
  @Column("varchar", {  default: '' })
  title: string
  @Column("text", {  default: '' })
  description: string
}

export class TaskController {
  private events: EventEmitter
  constructor(private connection: Promise<Connection>){
    this.events = new EventEmitter()
  }
  addListener(listener: (...args: any[]) => void){
    this.events.addListener('/tasks', listener)
  }
  removeListener(listener: (...args: any[]) => void){
    this.events.removeListener('/tasks', listener)
  }
  async update(where: Partial<TaskModel>, updates: Partial<TaskModel>){
    return await (await this.connection).manager.update(TaskModel, where, updates)
  }
  async report(userId: string, archivedAt: Date){
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
  async add(userId: string, task: TaskModel){
    task.userId = userId
    if (!task.priority) {
      const highest = await (await this.connection).manager.findOne(TaskModel, {
          where: {
            userId,
            archivedAt: null,
            deletedAt: null,
            queue: task.queue,
          },
          order: { priority: 'DESC' }
      })
      task.priority = highest ? highest.priority + 1 : 0
    }
    const saved = await (await this.connection).manager.save(task)
    this.events.emit('/tasks', saved);
    return saved
  }
}

const converter = new Converter()
export const TaskView = (task) => {
  const modal = new Modal('Edit Task', TaskForm(task))
  return `
    <form action="/tasks/${task.id}/archive" method="post" onsubmit="cleanupListeners()">
        <button type="submit" class="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    </form>
    <a id="${task.id}" ${modal.toggleParams()}>
        <b>${task.title}</b> (${task.estimate || 1})
        <div>${converter.makeHtml(task.description)}</div>
    </a>
    ${modal}`
}

export const TaskForm = (task: Partial<TaskModel>) => Form({
  id: task.id,
  action: '/tasks',
  children: [
    Input({ type: 'text', id: 'title', value: task.title, name: 'Title' }),
    Input({ type: 'text', id: 'queue', value: task.queue, name: 'Queue' }),
    Input({ type: 'number', id: 'estimate', value: task.estimate, name: 'Estimate' }),
    Input({ type: 'textarea', id: 'description', value: task.description, name: 'Description' })
  ]
})