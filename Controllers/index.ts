import TaskModel from '../Models/Task'
import TaskController from './Tasks'
import UserModel from '../Models/User'
import UserController from './Users'
import pConnection from './pConnection'

export const deleteUser = async (userId:string, password: string) => {
    await (await pConnection).manager.remove(TaskModel, { userId })
    await (await pConnection).manager.remove(UserModel, { id: userId })
}
export const tasks = new TaskController(pConnection)
export const users = new UserController(pConnection)
exports.pConnection = pConnection