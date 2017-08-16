import { v4 } from 'uuid'
import { Entity, PrimaryColumn, Column, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity({  })
class Task {
  @PrimaryGeneratedColumn("uuid")
  id: string
  @PrimaryGeneratedColumn()
  priority: number
  @Column("varchar")
  queue: string
  @Column("varchar")
  title: string
  @Column("text")
  description: string
  constructor(
    queue: string,
    title: string,
    description: string
  ){
    this.queue = queue
    this.title = title
    this.description = description
  }
}

export default Task