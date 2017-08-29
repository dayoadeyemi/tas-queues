import { Entity, PrimaryColumn, Column, Index, PrimaryGeneratedColumn, Connection, FindOneOptions, CreateDateColumn } from 'typeorm'
import { Modal } from './Modal'
import { Decorator } from './Decorator'
import { EventEmitter } from 'events'
import { Converter } from 'showdown'

@Entity('task',{ 
  orderBy: {
    queue: 'ASC',
    priority: 'DESC'
  }
})
@Index('list', (task: TaskModel) => [task.archivedAt, task.queue, task.priority], { unique: true })
export class TaskModel {
  @PrimaryGeneratedColumn("uuid")
  id: string
  @Column("int")
  priority: number
  @CreateDateColumn("CURRENT_TIMESTAMP(6)")
  createdAt: Date
  @Column("datetime",{ nullable: true })
  archivedAt: Date
  @Column("datetime",{ nullable: true })
  deletedAt: Date
  @Column("varchar", { default: 'q1' })
  queue: string
  @Column("int", { default: 1 })
  estimate: number
  @Column("varchar")
  title: string
  @Column("text", {  default: '' })
  description: string
  constructor(task: Partial<TaskModel>){
    Object.assign(this, task)
  }
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
  async report(archivedAt: Date){
    return await (await this.connection)
    .getRepository(TaskModel)
    .createQueryBuilder('task')
    .where("task.deletedAt IS NULL AND task.archivedAt > :archivedAt", { archivedAt })
    .orderBy({ priority: 'DESC' })
    .getMany()
  }
  async list(){
    return await (await this.connection).manager.find(TaskModel, {
        where: { archivedAt: null, deletedAt: null },
        order: { priority: 'DESC' }
    })
  }
  async add(task: TaskModel){
    if (!task.priority) {
      const highest = await (await this.connection).manager.findOne(TaskModel, {
          where: {
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
export interface TaskView extends TaskModel {}
export class TaskView extends Decorator<TaskModel> implements TaskModel {
  toString = () => {
    const modal = new Modal('Edit Task', new TaskForm(this))
    return `
      <form action="/tasks/${this.id}/archive" method="post" onsubmit="cleanupListeners()">
          <button type="submit" class="close" aria-label="Close">
              <span aria-hidden="true">&times;</span>
          </button>
      </form>
      <a id="${this.id}" ${modal.toggleParams()}>
          <b>${this.title}</b> (${this.estimate || 1})
          <div>${converter.makeHtml(this.description)}</div>
      </a>
      ${modal}`
  }
}

const valueIfExists = (value) => value ? `value="${value}"` : ""

export interface TaskForm extends Partial<TaskModel> {}
export class TaskForm extends Decorator<Partial<TaskModel>> implements Partial<TaskModel> {
  toString = () => `
    <form id="task-form" action="/tasks" method="post" onsubmit="cleanupListeners()">
        <input hidden name="id" type="text" class="form-control" id="id" ${valueIfExists(this.id)}>
        <div class="form-group">
            <label for="title" class="form-label">Title</label>
            <input name="title" type="text" class="form-control" id="title" ${valueIfExists(this.title)}>
        </div>
        <div class="form-group">
            <label for="queue" class="form-label">Priority</label>
            <input name="queue" type="text" class="form-control" id="queue" ${valueIfExists(this.queue)}>
        </div>
        <div class="form-group">
            <label for="estimate" class="form-label">Estimate</label>
            <input name="estimate" type="number" class="form-control" id="estimate" value=${this.estimate || 1}>
        </div>
        <div class="form-group">
            <label for="description" class="form-label">Description</label>
            <textarea name="description" class="form-control" id="description" rows="3">${this.description||''}</textarea>
        </div>
        <div class="form-group text-centre">
            <label for="submit" class="form-label"></label>
            <button id="submit" type="submit" class="btn btn-success">Save</button>
        </div>
    </form>
  `
}