import { readFileSync } from 'fs'
import Queues from './Queues'
import UserModel from '../Models/User'
import TaskForm from './Forms/Task'
import { Form } from './Forms/Utils'
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
        </div>
        <div class="card">
            <div class="card-header">
                Integrations
            </div>
            <div class="card-body container">
                <div class="row justify-content-between">
                    <div class="col">
                        Connect Slack Account ${user.slackAccessToken ? '(connected)' : '' }
                    </div>
                    <div class="col">
                        ${Form({
                            action: '/slack/authorize',
                            cta: `Connect`,
                            children: []
                        })}
                    </div>
                </div>
            </div>
        </div>`
        
    })
}

export default SettingsView