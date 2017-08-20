import { TaskModel, TaskView } from './Task'

export interface QueueModel {
    name: string,
    tasks: TaskModel[]
}

export interface QueueView extends QueueModel {}
export class QueueView implements QueueModel {
    name: string
    tasks: TaskView[]
    constructor(queue: QueueModel){
        this.name = queue.name
        this.tasks = queue.tasks.map(task => new TaskView(task))
    }
    toString = () => {
        return `
            <div class="card">
                <div class="card-header" role="tab" id="heading-${this.name}">
                    <div class="row">
                        <div class="col">
                            <h5 data-toggle="collapse" href="#${this.name}-content" aria-expanded="true" aria-controls="${this.name}-content" style="color:inherit;">
                                <span> ${this.name.toUpperCase()}</span>
                            </h5>
                        </div>
                        <div class="col text-right">
                            <span>${this.tasks.length} outstanding tasks </span>
                        </div>
                    </div>
                    
                </div>
            </div>
            <div id="${this.name}-content" class="collapse show" role="tabpanel" aria-labelledby="heading-${this.name}">
                <div class="card-body">
                    ${this.tasks.join('\n')}
                </div>
            </div>
        `
    }
}