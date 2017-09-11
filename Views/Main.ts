import Queues from './Queues'
import TaskModel from '../Models/Task'
import UserModel from '../Models/User'
import TaskForm from './Forms/Task'
import SettingsForm from '../Views/Forms/UserSettings'
import Modal from './Modal'
import Layout from './Layout'

const LiveView = (user: UserModel, tasks: TaskModel[]) => {
    const taskFormModal = new Modal('New Task', TaskForm({}))
    const settingsFormModal = new Modal('Settings', SettingsForm(user))

    return Layout({
        navLinks: [
            { path: '/', text: 'Live', active: true },
            { path: '/report', text: 'Report'},
            { path: '/settings', text: 'Settings'},
        ],
        navContent: `
            <button type="button" class="btn btn-secondary" ${taskFormModal.toggleParams()}>
                <span>Add Task</span>
            </button>`,
        body:`
            <div>
                ${Queues(tasks)}
            </div>
            ${taskFormModal}
            ${settingsFormModal}
            <script src="/app.js"></script>
        `
    })
}

export default LiveView