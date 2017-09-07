import { createConnection } from 'typeorm'
import { TaskModel, TaskController } from '../Task'
import { UserModel, UserController } from '../Users'

export const pConnection = createConnection({
    type: "sqlite",
    database: ".db",
    synchronize: true,
    entities: [TaskModel, UserModel],
    autoSchemaSync: true,
    logging: []
})

export const tasks = new TaskController(pConnection)
export const users = new UserController(pConnection)