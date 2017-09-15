import TaskModel from '../Models/Task'
import TaskController from './Tasks'
import UserModel from '../Models/User'
import UserController from './Users'
import pConnection from './pConnection'

export const deleteUser = async (userId:string) => {
    await (await pConnection).getRepository(TaskModel)
    .createQueryBuilder('task')
    .delete()
    .where('userId = :userId', { userId })
    .execute()
    await (await pConnection).getRepository(UserModel)
    .createQueryBuilder('user')
    .delete()
    .where('id = :userId', { userId })
    .execute()
}
export const tasks = new TaskController(pConnection)
export const users = new UserController(pConnection)
exports.pConnection = pConnection