import { Entity, Column, Index, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm'
import { Decorator } from '../Decorator'

@Entity('task',{ 
  orderBy: {
    queue: 'ASC',
    priority: 'DESC'
  }
})
@Index('list', (task: TaskModel) => [task.userId, task.archivedAt, task.queue, task.priority], { unique: true })
export default class TaskModel extends Decorator<Partial<TaskModel>>{
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
