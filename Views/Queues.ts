import TaskModel from '../Models/Task'
import TaskView from '../Views/Task'
import ListView from './List'
import { groupBy, prop, toPairs, sortBy, head, map } from 'ramda'

const Queues = (tasks: TaskModel[]) => {

    return [tasks]
    .map(groupBy<TaskModel>(prop<TaskModel>('queue')))
    .map($ => toPairs<string, TaskModel[]>($))
    .map(sortBy(head))
    .map(map(([name, tasks]) => {
        const estimate = tasks.reduce((total, task) => total + task.estimate, 0)
        return `
            <div class="card">
                <div class="card-header" role="tab" id="heading-${name}">
                    <div class="row">
                        <div class="col">
                            <h5 data-toggle="collapse" href="#${name}-content" aria-expanded="true" aria-controls="${name}-content" style="color:inherit;">
                                <span> ${name.toUpperCase()}</span>
                            </h5>
                        </div>
                        <div class="col text-right">
                            <span>${tasks.length} task${tasks.length === 1 ? '' :'s'} (${estimate} point${estimate === 1 ? '' :'s'})</span>
                        </div>
                    </div>
                    
                </div>
                
                <div id="${name}-content" class="card-body collapse show" role="tabpanel" aria-labelledby="heading-${name}">
                    ${new ListView(tasks.map(TaskView))}
                </div>
            </div>
        `
    }))[0]
    .join('\n')
}

export default Queues