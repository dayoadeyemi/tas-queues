import { createConnection } from 'typeorm'
import { TaskModel, TaskController } from '../Task'
import { UserModel, UserController } from '../Users'

export const pConnection = createConnection(Object.assign({
    synchronize: true,
    entities: [TaskModel, UserModel],
    autoSchemaSync: true,
    logging: []
}, process.env.NODE_ENV !== 'development' ? {
    type: 'postgres' as 'postgres',
    url: process.env.DATABASE_URL
} : {
    type: 'sqlite' as 'sqlite',
    database: ".db",
}))

export const tasks = new TaskController(pConnection)
export const users = new UserController(pConnection)