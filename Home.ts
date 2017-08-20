import { readFileSync } from 'fs'
import { QueueView } from './Queue'
import { TaskModel, TaskForm } from './Task'
import  { Modal } from './Modal'
import { groupBy, prop, toPairs, sortBy, head } from 'ramda'

const clientjs = readFileSync('./public/app.js', 'utf8')

export class HomeView {
    constructor(private tasks: TaskModel[], private state?: 'report'){}
    get queues(){
        return sortBy(head, toPairs(groupBy(prop('queue'), this.tasks)))
        .map((([name, tasks]: [string, TaskModel[]]) =>
            new QueueView({ name, tasks })))
    }
    toString = () => {
        const modal = new Modal('New Task', new TaskForm({}))

        const yesterday = new Date(new Date().toISOString().slice(0, 10))
        yesterday.setDate(yesterday.getDate() - 1)
        return `
            <script>${clientjs}</script>
            <nav class="navbar navbar-light bg-faded">
                <a href="/"><h1 class="navbar-brand mb-0">Todo Live</h1></a>
                <span class="navbar-text">
                    ${this.state === 'report' ? `REPORT`: `
                    <a href="/?report=${yesterday.toISOString().slice(0, 10)}">
                    <button type="button" class="btn btn-outline-secondary">
                        <span>View Yesterday's Report</span> 
                    </button>
                    </a>
                    <button type="button" class="btn btn-outline-primary" ${modal.toggleParams()}>
                        <span>Add Task</span> 
                    </button>`}
                    
                </span>
            </nav>
            <div>
                ${this.queues}
            </div>
            ${modal}
        `
    }
}