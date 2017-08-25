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
const tasksRouter = router() as express.Router

tasksRouter.use(cookieParser())

const pConnection = createConnection({
    type: "sqlite",
    database: ".db",
    synchronize: true,
    entities: [TaskModel],
    autoSchemaSync: true,
    logging: []
})

const taskController = new TaskController(pConnection)

tasksRouter.use((req, res, next) => {
    req.Tasks = taskController
    next()
})
tasksRouter.use(urlencoded({ extended: true }))
tasksRouter.use(json({  }))
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
    if (issuesEvent.action !== 'assigned' ||
        issuesEvent.assignee.login !== username) {
        return res.send()
    }
    const task = new TaskModel({
        id: 'github:' + issuesEvent.issue.id,
        title: issuesEvent.issue.title,
        description: issuesEvent.issue.body
    })
    const saved = await req.Tasks.add(task)
    res.send(saved)
});

app.use(tasksRouter)
app.listen(3000);