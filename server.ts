import 'reflect-metadata'
import { createConnection } from 'typeorm'
import { TaskModel, TaskController } from './Task'
import { HomeView } from './Home'
import { IssuesEvent } from './GitHub'
import * as express from 'express'
import { urlencoded, json } from 'body-parser'
import * as router from 'express-promise-router';
import * as cookieParser from 'cookie-parser';

declare global {
    namespace Express {
        export interface Request {
            Tasks: TaskController
        }
        export interface Response { }
        export interface Application { }
    }
}

const app = express();

const pConnection = createConnection({
    type: "sqlite",
    database: ".db",
    synchronize: true,
    entities: [TaskModel],
    autoSchemaSync: true,
    logging: []
})

const taskController = new TaskController(pConnection)

const tasksRouter = router() as express.Router
tasksRouter.use(cookieParser())
tasksRouter.use((req, res, next) => {
    req.Tasks = taskController
    next()
})
tasksRouter.use(urlencoded({ extended: true }))
tasksRouter.use(json({  }))
tasksRouter.use(express.static('public'))
tasksRouter.get('/', async (req, res) => {
    const { report } = req.query 
    const tasks = report ? await req.Tasks.report(report) : await req.Tasks.list()

    res.send(`
        <html>
            <head>
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta/css/bootstrap.min.css" integrity="sha384-/Y6pD6FV/Vv2HJnA6t+vslU6fwYXjCFtcEpHbNJ0lyAFsXTsjBbfaDjzALeQsN6M" crossorigin="anonymous">
            </head>
            <body>
                ${new HomeView(tasks, report ? 'report' : null)}
                <script src="/app.js"></script>
                <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.11.0/umd/popper.min.js" integrity="sha384-b/U6ypiBEHpOf/4+1nzFpr53nxSS+GLCkfwBdFNTxtclqqenISfwAzpKaMNFNmj4" crossorigin="anonymous"></script>
                <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta/js/bootstrap.min.js" integrity="sha384-h0AbiXch4ZDo7tp9hKZ4TsHbi047NrKGLO3SEJAg45jXxnGIfYzk4Si90RDIqNm1" crossorigin="anonymous"></script>
            </body>
        </html>
    `)
})

tasksRouter.get('/tasks/updates', async (req, res) => {
    // const tasks = await connection.manager.find(Task)
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    const listener = (task: TaskModel) => {
        res.write('event: data\n')
        res.write('data: '+ JSON.stringify(task) + '\n\n')
    }

    req.Tasks.addListener(listener)
    req.on('close', () =>  req.Tasks.removeListener(listener))
});

tasksRouter.post('/tasks/:id/archive', async (req, res) => {
    await await req.Tasks.update(req.params, { archivedAt: new Date() })
    if (req.cookies.browser) res.redirect('/')
    else res.sendStatus(204).end()
})

tasksRouter.post('/tasks', async (req, res) => {
    const saved = await req.Tasks.add(new TaskModel(req.body))
    if (req.cookies.browser) res.redirect('/')
    else res.send(saved)
});

tasksRouter.get('/tasks', async (req, res) => {
    const tasks = await req.Tasks.list()
    if (req.cookies.browser) res.redirect('/')
    else res.send(tasks)
});

tasksRouter.post('/github/:username', async (req, res) => {
    const issuesEvent: IssuesEvent = req.body
    const username: string = req.params.username
    switch (issuesEvent.action) {
        case 'assigned':
            if (issuesEvent.assignee.login === username){
                const task = new TaskModel({
                    id: 'github:' + issuesEvent.issue.id,
                    title: issuesEvent.issue.title,
                    description: issuesEvent.issue.body
                })
                const saved = await req.Tasks.add(task)
                return res.send(saved)
            }
            break
    
        default:
            break
    }
    res.send();
});

tasksRouter.post('/slack', async (req, res) => {
    if (req.body.payload) {
        const {
            actions,
            callback_id: id,
            user: {
                name: username
            },
            original_message
        } = JSON.parse(req.body.payload)
        const updates = actions.reduce((memo, action) => {
            memo[action.name] = action.selected_options[0].value
            return memo
        }, {})
        await req.Tasks.update({ id }, updates)
        res.send(original_message);
    } else {
        const {
            user_id: userId,
            user_name: username,
            text,
        } = req.body
        
        if (text === '') {
            const tasks = await req.Tasks.list()
            return res.send({
                text: 'View the list at - ' + req.hostname + '\n\n' + tasks.sort(({ queue: q1, priority: p1 }, { queue: q2, priority: p2 }) => {
                    return q1 > q2 ? 1 : q1 < q2 ? -1 : p2 - p1
                }).map(task => `*${task.queue.toUpperCase()||'Not Prioritised'} | ${task.title} (${task.estimate}) *\n${task.description}\n`).join('\n')
            })
        }
        const saved = await req.Tasks.add(new TaskModel({
            title: `slack task from ${username}`,
            description: text,
        }))
        res.send({
            "response_type": "in_channel",
            "attachments": [
                {
                    "callback_id": saved.id,
                    "attachment_type": "default",
                    "pretext": "The task has been added successfully!\nYou can set the priority here and estimate here",
                    "actions": [
                        {
                            "name": "queue",
                            "text": "Change Priority",
                            "type": "select",
                            "options": [
                                {
                                    "text": "High",
                                    "value": "p1"
                                },
                                {
                                    "text": "Standard",
                                    "value": "q2"
                                },
                                {
                                    "text": "Low",
                                    "value": "q3"
                                }
                            ]
                        },
                        {
                            "name": "estimate",
                            "text": "How complex is this task?",
                            "type": "select",
                            "options": [
                                {
                                    "text": "1",
                                    "value": 1
                                },
                                {
                                    "text": "2",
                                    "value": 2
                                },
                                {
                                    "text": "3",
                                    "value": 3
                                },
                                {
                                    "text": "5",
                                    "value": 5
                                },
                            ]
                        }
                    ]
                }
            ]
        });
    }
})

app.use(tasksRouter)
app.listen(3000);