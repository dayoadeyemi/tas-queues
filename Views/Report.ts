import Queues from './Queues'
import TaskModel from '../Models/Task'
import UserModel from '../Models/User'
import TaskForm from './Forms/Task'
import SettingsForm from '../Views/Forms/UserSettings'
import Modal from './Modal'
import Layout from './Layout'

const ReportView = (user: UserModel, tasks: TaskModel[]) => {
    const taskFormModal = new Modal('New Task', TaskForm({}))
    const settingsFormModal = new Modal('Settings', SettingsForm(user))

    return Layout({
        navLinks: [
            { path: '/', text: 'Live' },
            { path: '/report', text: 'Report', active: true },
            { path: '/settings', text: 'Settings' },
        ],
        body:`
            <div>
                ${Queues(tasks)}
            </div>
            ${taskFormModal}
        `
    })
}

export default ReportView