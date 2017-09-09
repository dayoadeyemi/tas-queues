import { createConnection } from 'typeorm'
import TaskModel from '../Models/Task'
import UserModel from '../Models/User'

const pConnection = createConnection({
    synchronize: true,
    entities: [TaskModel, UserModel],
    autoSchemaSync: true,
    logging: [],
    type: 'postgres',
    url: process.env.DATABASE_URL,
})

export default pConnection