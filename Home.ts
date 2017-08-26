import { readFileSync } from 'fs'
import { QueueView } from './Queue'
import { TaskModel, TaskForm } from './Task'
import  { Modal } from './Modal'
import { groupBy, prop, toPairs, sortBy, head } from 'ramda'

export class HomeView {
    constructor(private tasks: TaskModel[], private state?: 'report'){}
    get queues(){
        return sortBy(head, toPairs(groupBy(prop('queue'), this.tasks)))
        .map((([name, tasks]: [string, TaskModel[]]) =>
            new QueueView({ name, tasks }, this.state)))
    }
    yesterday(){
        const yesterday = new Date(new Date().toISOString().slice(0, 10))
        yesterday.setDate(yesterday.getDate() - 1)
        return yesterday.toISOString().slice(0, 10)
    }
    toString = () => {
        const modal = new Modal('New Task', new TaskForm({}))

        return `
            <nav class="navbar navbar-light bg-faded">
                <a href="/"><h1 class="navbar-brand mb-0">Todo Live</h1></a>
                <span class="navbar-text">
                    ${this.state === 'report' ? `
                    <a href="/">
                        <button type="button" class="btn btn-outline-secondary">
                            <span>Exit Report</span> 
                        </button>
                    </a>` : `
                    <a href="/?report=${this.yesterday()}">
                        <button type="button" class="btn btn-outline-secondary">
                            <span>Report</span> 
                        </button>
                    </a>
                    <button type="button" class="btn btn-outline-primary" ${modal.toggleParams()}>
                        <span>Add Task</span> 
                    </button>`}
                    
                </span>
            </nav>
            <div>
                ${this.queues.join('\n')}
            </div>
            ${modal}
        `
    }
}