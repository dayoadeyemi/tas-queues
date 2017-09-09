import TaskModel from '../Models/Task'
import TaskController from './Tasks'
import UserModel from '../Models/User'
import UserController from './Users'
import pConnection from './pConnection'

export const tasks = new TaskController(pConnection)
export const users = new UserController(pConnection)
exports.pConnection = pConnection