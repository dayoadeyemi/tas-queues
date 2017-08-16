import 'reflect-metadata'
import {createConnection} from 'typeorm'
import Task from './Task'
import * as express from 'express'
import { urlencoded } from 'body-parser'
import { EventEmitter } from 'events'
import { groupBy, prop, toPairs } from 'ramda'

interface Queue { name: string, tasks: Task[] }

class Modal {
    static count = 0
    id = 'modal-' + (++Modal.count).toString()
    constructor(private title, private content: string){}
    renderButton = () => `
        <button type="button" class="btn btn-outline-primary" data-toggle="modal" data-target="#${this.id}">
            <span>${this.title}</span> 
        </button>
    `
    render = () => `
        <div class="modal fade" id="${this.id}" tabindex="-1" role="dialog" aria-labelledby="${this.id}-label" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="${this.id}-label">${this.title}</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">${this.content}</div>
                </div>
            </div>
        </div>
    `
}
const taskForm = `
<form id="task-form" action="/tasks" method="post">
    <div class="form-group">
        <label for="title" class="form-label">Title</label>
        <input name="title" type="text" class="form-control" id="title">
    </div>
    <div class="form-group">
        <label for="description" class="form-label">Description</label>
        <textarea name="description" class="form-control" id="description" rows="3"></textarea>
    </div>
    <div class="form-group text-centre">
        <label for="submit" class="form-label"></label>
        <button id="submit" type="submit" class="btn btn-success">Create</button>
    </div>
</form>
`

const renderTask = (task: Task) => `
<li class="list-group-item">
    <b>${task.title}</b>: ${task.description}
</li>`

const renderQueue = (queue: Queue) => {
    const modal = new Modal('New Task', taskForm)
    return `
<div class="card">
    <div class="card-header" role="tab" id="heading-${queue.name}">
        <div class="row">
            <div class="col">
                <a data-toggle="collapse" href="#${queue.name}-content" aria-expanded="true" aria-controls="${queue.name}-content">
                    <h5>${queue.name}</h5>
                </a>
            </div>
            <div class="col text-right">
                ${modal.renderButton()}
            </div>
        </div>
        
    </div>
</div>
<div id="${queue.name}-content" class="collapse show" role="tabpanel" aria-labelledby="heading-${queue.name}">
    <div class="card-body">
        ${queue.tasks.map(renderTask).join('\n')}
    </div>
</div>
${modal.render()}
`
}

const renderApp = (queues: Queue[]) => `
<div>
    ${queues.map(renderQueue).join('\n')}
</div>
`

createConnection({
    type: "sqlite",
    database: ".db",
    synchronize: true,
    entities: [Task],
})
.then(async connection => {
    const app = express();
    const events = new EventEmitter()

    app.use(urlencoded({ extended: true }))
    app.get('/', async (req, res) => {
        const tasks = await connection.manager.find(Task)
        const grouped = groupBy(prop('queue'), tasks) as any
        grouped.p0 = grouped.p0 || []
        const queues = toPairs(grouped).map((([name, tasks]: [string, Task[]]) => ({ name, tasks })))
        res.send(`
<html>
    <head>
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta/css/bootstrap.min.css" integrity="sha384-/Y6pD6FV/Vv2HJnA6t+vslU6fwYXjCFtcEpHbNJ0lyAFsXTsjBbfaDjzALeQsN6M" crossorigin="anonymous">    
    </head>
    <body>
        ${renderApp(queues)}
        <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.11.0/umd/popper.min.js" integrity="sha384-b/U6ypiBEHpOf/4+1nzFpr53nxSS+GLCkfwBdFNTxtclqqenISfwAzpKaMNFNmj4" crossorigin="anonymous"></script>
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta/js/bootstrap.min.js" integrity="sha384-h0AbiXch4ZDo7tp9hKZ4TsHbi047NrKGLO3SEJAg45jXxnGIfYzk4Si90RDIqNm1" crossorigin="anonymous"></script>
    </body>
</html>
        `)
    })

    app.get('/tasks/updates', async (req, res) => {
        // const tasks = await connection.manager.find(Task)
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        const listener = (task: Task) => {
            res.write('data: '+ JSON.stringify(task) + '\n\n')
        }

        events.addListener(req.path, listener)

        req.on('close', () => events.removeListener(req.path, listener))
    });

    app.post('/tasks', async (req, res) => {
        try {
            const task = new Task('p0', req.body.title, req.body.description)
            const saved = await connection.getRepository(Task).save(task)
            events.emit(req.path, saved);
            // res.send(saved)
            res.redirect('/')   
        } catch (e) {
            return  res.send(e.stack)
        }
    });
  
    app.listen(3000);
})
.catch(error => console.log(error));