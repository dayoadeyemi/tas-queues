import 'source-map-support/register'
import 'reflect-metadata'
import TaskModel from './Models/Task'
import UserModel from './Models/User'
import SignUpForm from './Views/Forms/SignUp'
import SignInForm from './Views/Forms/SignIn'
import HomeView from './Views/Home'
import ReportView from './Views/Report'
import MainView from './Views/Main'
import SettingsView from './Views/Settings'
import { IssuesEvent } from './GitHub'
import * as controllers from './Controllers/'
import * as express from 'express'
import { urlencoded, json } from 'body-parser'
import * as router from 'express-promise-router';
import * as cookieParser from 'cookie-parser';
import * as session  from 'express-session';
import { v4 } from 'uuid'
import { stringify } from 'qs'

const getContent = function<T>(url: string) {
  // return new pending promise
  return new Promise<T>((resolve, reject) => {
    // select http or https module, depending on reqested url
    const lib = url.startsWith('https') ? require('https') : require('http');
    const request = lib.get(url, (response) => {
      // handle http errors
      if (response.statusCode < 200 || response.statusCode > 299) {
         reject(new Error('Failed to load page, status code: ' + response.statusCode));
       }
      // temporary data holder
      const body = [];
      // on every content chunk, push it to the data array
      response.on('data', (chunk) => body.push(chunk));
      // we are done, resolve promise with those joined chunks
      response.on('end', () => resolve(JSON.parse(body.join(''))));
    });
    // handle connection errors of the request
    request.on('error', (err) => reject(err))
    })
};

declare global {
    namespace Express {
        export interface Request {
            user: UserModel
            controllers: typeof controllers
        }
        export interface Response { }
        export interface Application { }
    }
}

const app = express();
app.use(cookieParser())
app.use(session({
    saveUninitialized: false,
    resave: true,
    secret: 'somerandonstuffs',
    cookie: {
        path: '/',
        httpOnly: true,
        maxAge: 600000
    }
}));
app.use(urlencoded({ extended: true }))
app.use(json({  }))
app.use(express.static('public'))

app.use((req, res, next) => {
    req.controllers = controllers
    next()
})

const Container = (content) => `
<div class="container">
    <div class="row">
        ${content}
    </div>
</div>`
const tasksRouter = router() as express.Router
tasksRouter.use(async (req, res, next) => {
    if (req.session) {
        req.user = await req.controllers.users.getById(req.session.userId)
    }
    if (req.user) {
        return next()
    }
    res.redirect('/home')
})
tasksRouter.get('/', async (req, res) => {
    const tasks = await req.controllers.tasks.list(req.user.id)

    res.send(MainView(req.user, tasks))
})

const getYesterdayString = () => {
    const yesterday = new Date(new Date().toISOString().slice(0, 10))
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().slice(0, 10)
}
tasksRouter.get('/report', async (req, res) => {
    const { after } = req.query
    if (!after) {
        return res.redirect('/report?after='+getYesterdayString())
    }
    const tasks = await req.controllers.tasks.report(req.user.id, after)

    res.send(ReportView(req.user, tasks))
})

tasksRouter.get('/tasks/updates', async (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    const listener = (task) => {
        res.write('event: data\n')
        res.write('data: '+ JSON.stringify(task) + '\n\n')
    }

    req.controllers.tasks.addListener(req.user.id, listener)
    req.on('close', () =>  req.controllers.tasks.removeListener(req.user.id, listener))
});

tasksRouter.get('/settings', async (req, res) => {
    res.send(SettingsView(req.user))
})

tasksRouter.post('/settings', async (req, res) => {
    await req.controllers.users.updateSettings(req.user.id, req.body)
    res.redirect('/settings')
})

tasksRouter.post('/change-password', async (req, res) => {
    if (await req.controllers.users.verify(req.user.id, req.body.oldPassword)) {
        await req.controllers.users.changePassword(req.user.id, req.body.password)
        res.redirect('/settings')
    } else {
        res.status(400)
        res.send('incorrect password')
    }
})

tasksRouter.post('/slack/authorize', async (req, res) => {
    const slackOauthState = await req.controllers.users.createSlackOathState(req.user.id)
    res.redirect('https://slack.com/oauth/authorize?'+ stringify({
        client_id: process.env.SLACK_CLIENT_ID,
        scope: 'commands,users.profile:write,users:write',
        state: slackOauthState
    }))
})

tasksRouter.post('/tasks/:id/archive', async (req, res) => {
    await req.controllers.tasks.archive(req.user.id, req.params.id)
    if (req.cookies.browser) res.redirect('/')
    else res.sendStatus(204).end()
})

tasksRouter.post('/tasks', async (req, res) => {    
    const saved = await req.controllers.tasks.add(req.user.id, new TaskModel(req.body))
    if (req.cookies.browser) res.redirect('/')
    else res.send(saved)
});

tasksRouter.get('/tasks', async (req, res) => {
    const tasks = await req.controllers.tasks.list(req.user.id)
    if (req.cookies.browser) res.redirect('/')
    else res.send(tasks)
});

const base256 = (n) => {
    const out = [];
    for (let i = 0; i < 16; i++) {
        out.push(n%256)
        n>>=8
    }
    return out;
}

const integrationsApi = (router() as express.Router)
integrationsApi.post('/github', async (req, res) => {
    const issuesEvent: IssuesEvent = req.body
    switch (issuesEvent.action) {
        case 'assigned':
            req.user = await req.controllers.users
            .getByGitHubUserName(issuesEvent.assignee.login)
            if (req.user){
                const task = new TaskModel({
                    id: v4({ random: base256(issuesEvent.issue.id) }),
                    queue: 'q1',
                    title: issuesEvent.issue.title,
                    description: issuesEvent.issue.body
                })
                const saved = await req.controllers.tasks.add(req.user.id, task)
                return res.send(saved)
            }
            break
    
        default:
            break
    }
    res.send();
});

controllers.tasks.addLatestListener(async task => {
    const user = await controllers.users.getById(task.userId)
    if (user && user.slackUserId && user.slackAccessToken) {
        const reponse = await getContent('https://slack.com/api/users.profile.set?' + stringify({
            token: user.slackAccessToken,
            name: 'status_text',
            user: user.slackUserId,
            value: (task.title || '').slice(0, 100)
        }))
    }
})

const getSlackButtons = (task: TaskModel) => {
    const queueOptions = [
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
    const estimateOptions = [
        {
            "text": "1",
            "value": "1"
        },
        {
            "text": "2",
            "value": "2"
        },
        {
            "text": "3",
            "value": "3"
        },
        {
            "text": "5",
            "value": "5"
        },
    ]
    const attachment = {
        "callback_id": task.id,
        "attachment_type": "default",
        "text": `${task.queue.toUpperCase()||'Not Prioritised'} | ${task.title} (${task.estimate})`,
        "actions": [
            {
                "name": "queue",
                "text": "Change Priority",
                "type": "select",
                "options": queueOptions,
                "selected_options": [queueOptions.find(option => 
                option.value >= task.queue)]
            },
            {
                "name": "estimate",
                "text": "How complex is this task?",
                "type": "select",
                "options": estimateOptions,
                "selected_options": [estimateOptions.find(option => 
                    option.value >= String(task.estimate))]
            },
            {
                "name": "complete",
                "text": "Complete",
                "type": "button",
                "value": "complete"
            },
        ]
    }
    return attachment
}

integrationsApi.post('/slack', async (req, res) => {
    if (req.body.payload) {
        const {
            actions,
            callback_id: id,
            user: {
                name: username,
                id: slackUserId,
            },
            original_message
        } = JSON.parse(req.body.payload)
        
        if (id === 'done') {
            return res.send({
                "response_type": "in_channel",
                "text": "Got it, thanks!"
            });
        }
        const updates = (actions as Array<any>).reduce((memo, action, i) => {
            memo[action.name] = action.selected_options ?
                action.selected_options[0].value :
                true
            return memo
        }, {})

        if (updates.complete) {
            req.user = await req.controllers.users.getBySlackUserId(slackUserId)
            await req.controllers.tasks.archive(req.user.id, id)
            return res.send({
                "response_type": "in_channel",
                "text": "completed"
            });
        }

        await req.controllers.tasks.update({ id }, updates)
        const task = await req.controllers.tasks.getById(id)
        const message = {
            "response_type": "in_channel",
            "attachments": [
                getSlackButtons(task),
                {
                    "callback_id": 'done',
                    "attachment_type": "default",
                    "actions": [
                        {
                            "name": "done",
                            "text": "Done",
                            "type": "button",
                            "value": "done"
                        },
                    ]
                }
            ]
        }
        res.send(message);
    } else {
        const {
            team_domain,
            team_id: teamId,
            user_name: username,
            user_id: authorSlackUserId,
            text,
        } = req.body as { [x: string]: string }

        if (text === '' || text === 'help') {
            return res.send({
                response_type: 'ephemeral',
                text:
                    '*TasQ commands*' + '\n' +
                    '`\\task help` show this helpful list of commands' + '\n' +
                    '`\\task show` show the current active task' + '\n' +
                    '`\\task list` list all availible tasks for updating/completing' + '\n' +
                    '`\\task report` report the recently completed tasks' + '\n' +
                    '`\\task @user` show the task list for a particular user' + '\n' +
                    '`\\task @user <text>` give a task to a user with the'
            })
        }
        
        if (text === 'show') {
            req.user = await req.controllers.users.getBySlackUserId(authorSlackUserId)
            if (req.user) {
                const task = await req.controllers.tasks.highest(req.user.id)
                if (task) {
                    return res.send({
                        "response_type": "ephemeral",
                        "attachments": [
                            getSlackButtons(task),
                            {
                                "text": task.description,
                            },
                            {
                                "callback_id": 'done',
                                "attachment_type": "default",
                                "actions": [
                                    {
                                        "name": "done",
                                        "text": "Done",
                                        "type": "button",
                                        "value": "done"
                                    },
                                ]
                            }
                        ]
                    })
                } else {
                    return res.send({
                        text: 'No tasks'
                    })
                }
            }
        }

        if (text === 'report') {
            req.user = await req.controllers.users.getBySlackUserId(authorSlackUserId)
            if (req.user) {
                const tasks = await req.controllers.tasks.report(req.user.id, getYesterdayString())
                return res.send({
                    "response_type": "ephemeral",
                    "attachments": (tasks.slice(0, 100).map(getSlackButtons) as any[])
                    .map($ => {
                        delete $.actions
                        return $
                    })
                    .concat([{
                        "callback_id": 'done',
                        "attachment_type": "default",
                        "actions": [
                            {
                                "name": "done",
                                "text": "Done",
                                "type": "button",
                                "value": "done"
                            },
                        ]
                    }])
                })
            } else { 
                res.send({
                    "response_type": "in_channel",
                    "text": "Couldn't find a connected user"
                })
            }
        }

        if (text === 'list') {
            req.user = await req.controllers.users.getBySlackUserId(authorSlackUserId)
            if (req.user) {
                const tasks = await req.controllers.tasks.list(req.user.id)
                return res.send({
                    "response_type": "ephemeral",
                    "attachments": (tasks.slice(0, 100).map(getSlackButtons) as any[])
                    .concat([{
                        "callback_id": 'done',
                        "attachment_type": "default",
                        "actions": [
                            {
                                "name": "done",
                                "text": "Done",
                                "type": "button",
                                "value": "done"
                            },
                        ]
                    }])
                })
            } else { 
                res.send({
                    "response_type": "in_channel",
                    "text": "Couldn't find a connected user"
                })
            }
        }

        const match = text.match(/<@([A-Z0-9]+)\|(\w+)>\s*(.*)/)
        
        if (!match) {
            res.send({
                "response_type": "in_channel",
                "text": "Couldn't find a user at the start of the message"
            })
        }
        const [_, slackUserId, slackUserName, body_unclean] = match
        req.user = await req.controllers.users.getBySlackUserId(slackUserId)
        if (!req.user) {
            return res.send({
                "response_type": "in_channel",
                "text": "Couldn't find a user registered for slack name @" + slackUserName
            })
        }

        if (body_unclean === '') {
            const tasks = await req.controllers.tasks.list(req.user.id)
            req.user = await req.controllers.users.getBySlackUserId(slackUserId)
            if (req.user) {
                const tasks = await req.controllers.tasks.list(req.user.id)
                return res.send({
                    "response_type": "in_channel",
                    "attachments": (tasks.slice(0, 100).map(getSlackButtons) as any[])
                    .map($ => {
                        delete $.actions
                        return $
                    })
                    .concat([{
                        "callback_id": 'done',
                        "attachment_type": "default",
                        "actions": [
                            {
                                "name": "done",
                                "text": "Done",
                                "type": "button",
                                "value": "done"
                            },
                        ]
                    }])
                })
            }
        }
        const body = body_unclean.replace(/<@([A-Z0-9]+)\|(\w+)>/, `[@$2](https://${team_domain}.slack.com/team/$2)`)
        
        const saved = await req.controllers.tasks.add(req.user.id, new TaskModel({
            queue: 'q1',
            title: body,
            description: `slack task from ${username}`,
        }))
        
        res.send({
            "response_type": "in_channel",
            "text": "The task has been added successfully!\nYou can set the priority here and estimate here",
            "attachments": [
                getSlackButtons(saved),
                {
                    "attachment_type": "default",
                    "actions": [
                        {
                            "name": "done",
                            "text": "Done",
                            "type": "button",
                            "value": "done"
                        },
                    ]
                }
            ]
        });
    }
})

integrationsApi.get('/slack/authorize', async (req, res) => {
    const { code, state } = req.query
    if (code && state) {
        const user = await req.controllers.users.getBySlackOathState(state)
        if (user) {
            const access = await getContent<{
                ok: boolean
                access_token: string
                user: { id: string }
            }>('https://slack.com/api/oauth.access?' + stringify({
                client_id: process.env.SLACK_CLIENT_ID,
                client_secret:  process.env.SLACK_CLIENT_SECRET,
                code,
                redirect_uri: '/slack'
            }))
            if (access.ok) {
                await req.controllers.users.updateSettings(user.id, {
                    slackAccessToken: access.access_token,
                    slackOauthState: null,
                    slackUserId: access.user.id
                })
            }
        }
    }
    return res.redirect('/settings')
})

const userRouter = router() as express.Router
userRouter.get('/home', async (req, res, next) => {
    res.send(HomeView())
})
userRouter.post('/sign-up', async (req, res, next) => {
    const {
        username,
        slackUserId,
        githubUserName,
        password,
    } = req.body
    const user = await req.controllers.users.create({
        username,
    }, password)
    req.session.userId = user.id
    res.redirect('/')
})
userRouter.post('/sign-in', async (req, res, next) => {
    const { username, password } = req.body
    const user = await req.controllers.users.verify(username, password)
    if (!user) {
        res.redirect('/sign-up')
    }
    req.session.userId = user.id
    res.redirect('/')
})

userRouter.post('/users', async (req, res, next) => {
    const { username, password } = req.body
    await req.controllers.users.create(username, password)
    res.redirect('/')
})
userRouter.get('/users', async (req, res, next) => {
    const { username, password } = req.body
    res.send(await req.controllers.users.all())
})

const tasksApi = router() as express.Router

tasksApi.post('/tasks', async (req, res) => {
    const saved = await req.controllers.tasks.add(req.params.userId, new TaskModel(req.body))
    res.send(saved)
});

tasksApi.get('/tasks', async (req, res) => {
    const tasks = await req.controllers.tasks.list(req.params.userId)
    res.send(tasks)
});

tasksApi.get('/tasks-report', async (req, res) => {
    const { report } = req.query 
    const tasks = await req.controllers.tasks.report(req.params.userId, report)
    res.send(tasks)
});

tasksApi.post('/tasks/:id/archive', async (req, res) => {
    await await req.controllers.tasks.archive(req.params.userId, req.params.id)
    res.sendStatus(204).end()
})

userRouter.use('/users/:userid', tasksApi)

function errorHandler (err, req, res, next) {
    if (res.headersSent) {
        return next(err)
    }
    res.status(500)
    res.send(err && err.stack)
    console.log(err && err.stack)
}

app.use(integrationsApi)
app.use(userRouter)
app.use(tasksRouter)
app.use(errorHandler)
app.listen(process.env.PORT || 3000);
