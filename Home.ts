import { readFileSync } from 'fs'
import { QueueView } from './Queue'
import { TaskModel, TaskForm } from './Task'
import { SettingsForm, UserModel } from './Users'
import  { Modal } from './Modal'
import { groupBy, prop, toPairs, sortBy, head } from 'ramda'

const getYesterdayString = () => {
    const yesterday = new Date(new Date().toISOString().slice(0, 10))
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().slice(0, 10)
}

export const NavBar = (text = '') => `
<nav class="navbar navbar-light bg-faded">
    <a href="/"><h1 class="navbar-brand mb-0">Todo Live</h1></a>
    <span class="navbar-text">
        ${text}
    </span>
</nav>`

export const HomeView = (user: UserModel, tasks: TaskModel[], state?: 'report') => {
    const taskFormModal = new Modal('New Task', TaskForm({}))
    const settingsFormModal = new Modal('Settings', SettingsForm(user))
    const queues = sortBy(head, toPairs(groupBy(prop('queue'), tasks)))
    .map((([name, tasks]: [string, TaskModel[]]) =>
        new QueueView({ name, tasks }, state)))

    return `
        ${NavBar(`
        ${state === 'report' ? `
        <a href="/">
            <button type="button" class="btn btn-outline-secondary">
                <span>Exit Report</span> 
            </button>
        </a>` : `
        <a href="/?report=${getYesterdayString()}">
            <button type="button" class="btn btn-outline-secondary">
                <span>Report</span> 
            </button>
        </a>
        <button type="button" class="btn btn-outline-primary" ${taskFormModal.toggleParams()}>
            <span>Add Task</span> 
        </button>
        <button type="button" class="btn btn-outline-primary" ${settingsFormModal.toggleParams()}>
            <span>Settings</span> 
        </button>`}`)}
        <div>
            ${queues.join('\n')}
        </div>
        ${taskFormModal}
        ${settingsFormModal}
    `
}