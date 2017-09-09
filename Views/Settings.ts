import { readFileSync } from 'fs'
import Queues from './Queues'
import UserModel from '../Models/User'
import TaskForm from './Forms/Task'
import UserSettingsForm from '../Views/Forms/UserSettings'
import Layout from './Layout'

const SettingsView = (user: UserModel) => {
    return Layout({
        navLinks: [
            { path: '/', text: 'Live' },
            { path: '/report', text: 'Report'},
            { path: '/settings', text: 'Settings', active: true },
        ],
        body: `
        <div class="card">
            <div class="card-header">
                User Settings
            </div>
            <div class="card-body">
                ${UserSettingsForm(user)}
            </div>
        </div>`
    })
}

export default SettingsView