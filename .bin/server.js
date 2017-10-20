"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
require("reflect-metadata");
const Task_1 = require("./Models/Task");
const Home_1 = require("./Views/Home");
const Report_1 = require("./Views/Report");
const Main_1 = require("./Views/Main");
const Settings_1 = require("./Views/Settings");
const controllers = require("./Controllers/");
const express = require("express");
const body_parser_1 = require("body-parser");
const router = require("express-promise-router");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const uuid_1 = require("uuid");
const qs_1 = require("qs");
const timeago_js_1 = require("timeago.js");
const ta = timeago_js_1.default();
const getContent = function (url) {
    // return new pending promise
    return new Promise((resolve, reject) => {
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
        request.on('error', (err) => reject(err));
    });
};
const app = express();
app.use(cookieParser());
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
app.use(body_parser_1.urlencoded({ extended: true }));
app.use(body_parser_1.json({}));
app.use(express.static('public'));
app.use((req, res, next) => {
    req.controllers = controllers;
    next();
});
const Container = (content) => `
<div class="container">
    <div class="row">
        ${content}
    </div>
</div>`;
const tasksRouter = router();
tasksRouter.use((req, res, next) => __awaiter(this, void 0, void 0, function* () {
    if (req.session) {
        req.user = yield req.controllers.users.getById(req.session.userId);
    }
    if (req.user) {
        return next();
    }
    res.redirect('/home');
}));
tasksRouter.get('/', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const tasks = yield req.controllers.tasks.list(req.user.id);
    res.send(Main_1.default(req.user, tasks));
}));
const getYesterdayString = () => {
    const yesterday = new Date(new Date().toISOString().slice(0, 10));
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().slice(0, 10);
};
tasksRouter.get('/report', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { after } = req.query;
    if (!after) {
        return res.redirect('/report?after=' + getYesterdayString());
    }
    const tasks = yield req.controllers.tasks.report(req.user.id, after);
    res.send(Report_1.default(req.user, tasks));
}));
tasksRouter.get('/tasks/updates', (req, res) => __awaiter(this, void 0, void 0, function* () {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    const listener = (task) => {
        res.write('event: data\n');
        res.write('data: ' + JSON.stringify(task) + '\n\n');
    };
    req.controllers.tasks.addListener(req.user.id, listener);
    req.on('close', () => req.controllers.tasks.removeListener(req.user.id, listener));
}));
tasksRouter.get('/settings', (req, res) => __awaiter(this, void 0, void 0, function* () {
    res.send(Settings_1.default(req.user));
}));
tasksRouter.post('/settings', (req, res) => __awaiter(this, void 0, void 0, function* () {
    yield req.controllers.users.updateSettings(req.user.id, req.body);
    res.redirect('/settings');
}));
tasksRouter.post('/change-password', (req, res) => __awaiter(this, void 0, void 0, function* () {
    if (yield req.controllers.users.verify(req.user.id, req.body.oldPassword)) {
        yield req.controllers.users.changePassword(req.user.id, req.body.password);
        res.redirect('/settings');
    }
    else {
        res.status(400);
        res.send('incorrect password');
    }
}));
tasksRouter.post('/slack/authorize', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const slackOauthState = yield req.controllers.users.createSlackOathState(req.user.id);
    res.redirect('https://slack.com/oauth/authorize?' + qs_1.stringify({
        client_id: process.env.SLACK_CLIENT_ID,
        scope: 'commands,users.profile:write,users:write,usergroups:read',
        state: slackOauthState
    }));
}));
tasksRouter.post('/tasks/:id/archive', (req, res) => __awaiter(this, void 0, void 0, function* () {
    yield req.controllers.tasks.archive(req.user.id, req.params.id);
    if (req.cookies.browser)
        res.redirect('/');
    else
        res.sendStatus(204).end();
}));
tasksRouter.post('/tasks', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const saved = yield req.controllers.tasks.add(req.user.id, new Task_1.default(req.body));
    if (req.cookies.browser)
        res.redirect('/');
    else
        res.send(saved);
}));
tasksRouter.get('/tasks', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const tasks = yield req.controllers.tasks.list(req.user.id);
    if (req.cookies.browser)
        res.redirect('/');
    else
        res.send(tasks);
}));
const base256 = (n) => {
    const out = [];
    for (let i = 0; i < 16; i++) {
        out.push(n % 256);
        n >>= 8;
    }
    return out;
};
const integrationsApi = router();
integrationsApi.post('/github', (req, res) => __awaiter(this, void 0, void 0, function* () {
    switch (req.header('X-Github-Event')) {
        case 'issue':
            const issuesEvent = req.body;
            switch (issuesEvent.action) {
                case 'assigned':
                    req.user = yield req.controllers.users
                        .getByGitHubUserName(issuesEvent.assignee.login);
                    if (req.user) {
                        const task = new Task_1.default({
                            id: uuid_1.v4({ random: base256(issuesEvent.issue.id) }),
                            queue: 'q1',
                            title: issuesEvent.issue.title,
                            description: issuesEvent.issue.body
                        });
                        const saved = yield req.controllers.tasks.add(req.user.id, task);
                        return res.send(saved);
                    }
                    break;
                default:
                    break;
            }
            break;
        case 'pull_request':
            const pullRequestEvent = req.body;
            switch (pullRequestEvent.action) {
                case 'review_requested':
                    req.user = yield req.controllers.users
                        .getByGitHubUserName(pullRequestEvent.requested_reviewer.login);
                    if (req.user) {
                        const task = new Task_1.default({
                            id: uuid_1.v4({ random: base256(pullRequestEvent.pull_request.id) }),
                            queue: 'p2',
                            title: '[Review]' + pullRequestEvent.pull_request.title,
                            description: pullRequestEvent.pull_request.body
                        });
                        const saved = yield req.controllers.tasks.add(req.user.id, task);
                        return res.send(saved);
                    }
                    break;
                default:
                    break;
            }
            break;
        default:
            break;
    }
    res.send();
}));
controllers.tasks.addLatestListener((task) => __awaiter(this, void 0, void 0, function* () {
    const user = yield controllers.users.getById(task.userId);
    if (user && user.slackUserId && user.slackAccessToken) {
        const response = yield getContent('https://slack.com/api/users.profile.set?' + qs_1.stringify({
            token: user.slackAccessToken,
            name: 'status_text',
            user: user.slackUserId,
            value: (task.title || '').slice(0, 100)
        }));
    }
}));
const getSlackText = (task) => `[${task.queue.toUpperCase() || 'Not Prioritised'}] ${task.title} (${task.estimate}) _created ${ta.format(task.createdAt)}_`;
const getSlackButtons = (task) => {
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
    ];
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
    ];
    const attachment = {
        "callback_id": task.id,
        "attachment_type": "default",
        "text": getSlackText(task),
        "actions": [
            {
                "name": "queue",
                "text": "Change Priority",
                "type": "select",
                "options": queueOptions,
                "selected_options": [queueOptions.find(option => option.value >= task.queue)]
            },
            {
                "name": "estimate",
                "text": "How complex is this task?",
                "type": "select",
                "options": estimateOptions,
                "selected_options": [estimateOptions.find(option => option.value >= String(task.estimate))]
            },
            {
                "name": "complete",
                "text": "Complete",
                "type": "button",
                "value": "complete"
            },
        ]
    };
    return attachment;
};
const getSlackSummary = ({ users, tasks }, slackUserId) => __awaiter(this, void 0, void 0, function* () {
    const user = yield users.getBySlackUserId(slackUserId);
    if (user) {
        const tasksRemaining = yield tasks.list(user.id);
        const tasksCompleted = yield tasks.report(user.id, getYesterdayString());
        return `<@${slackUserId}|>\n\tTasks Remaining\n\t\t` +
            tasksRemaining.map(getSlackText).join('\n\t\t') +
            `\n\tTasks Completed\n\t\t` +
            tasksCompleted.map(getSlackText).join('\n\t\t');
    }
    else {
        return `<@${slackUserId}|>\n\tCouldn't find a connected user`;
    }
});
integrationsApi.post('/slack', (req, res) => __awaiter(this, void 0, void 0, function* () {
    if (req.body.payload) {
        const { actions, callback_id: id, user: { name: username, id: slackUserId, }, original_message } = JSON.parse(req.body.payload);
        if (id === 'done') {
            return res.send({
                "response_type": "in_channel",
                "text": "Got it, thanks!"
            });
        }
        const updates = actions.reduce((memo, action, i) => {
            memo[action.name] = action.selected_options ?
                action.selected_options[0].value :
                true;
            return memo;
        }, {});
        if (updates.complete) {
            req.user = yield req.controllers.users.getBySlackUserId(slackUserId);
            yield req.controllers.tasks.archive(req.user.id, id);
            return res.send({
                "response_type": "in_channel",
                "text": "completed"
            });
        }
        yield req.controllers.tasks.update({ id }, updates);
        const task = yield req.controllers.tasks.getById(id);
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
        };
        res.send(message);
    }
    else {
        const { team_domain, team_id: teamId, user_name: username, user_id: authorSlackUserId, text, } = req.body;
        if (text === '' || text === 'help') {
            return res.send({
                response_type: 'ephemeral',
                text: '*TasQ commands*' + '\n' +
                    '`\\task help` show this helpful list of commands' + '\n' +
                    '`\\task show` show the current active task' + '\n' +
                    '`\\task list` list all availible tasks for updating/completing' + '\n' +
                    '`\\task summary` show your task summary' + '\n' +
                    '`\\task @user/team` show the task summary for a user' + '\n' +
                    '`\\task @user <text>` give a task to a user'
            });
        }
        if (text === 'show') {
            req.user = yield req.controllers.users.getBySlackUserId(authorSlackUserId);
            if (req.user) {
                const task = yield req.controllers.tasks.highest(req.user.id);
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
                    });
                }
                else {
                    return res.send({
                        text: 'No tasks'
                    });
                }
            }
        }
        if (text === 'summary') {
            return res.send({
                "text": yield getSlackSummary(req.controllers, authorSlackUserId),
                "response_type": "ephemeral"
            });
        }
        if (text === 'list') {
            req.user = yield req.controllers.users.getBySlackUserId(authorSlackUserId);
            if (req.user) {
                const tasks = yield req.controllers.tasks.list(req.user.id);
                return res.send({
                    "response_type": "ephemeral",
                    "attachments": tasks.slice(0, 100).map(getSlackButtons)
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
                });
            }
            else {
                res.send({
                    "response_type": "in_channel",
                    "text": "Couldn't find a connected user"
                });
            }
        }
        const match = text.match(/<(\!subteam\^|@)([A-Z0-9]+)\|(@?\w+)>\s*(.*)/);
        if (!match) {
            return res.send({
                "response_type": "in_channel",
                "text": "Couldn't find a user/team at the start of the message"
            });
        }
        const [_, _type, slackId, slackUserName, body_unclean] = match;
        const type = _type === '@' ? 'user' :
            _type === '!subteam^' ? 'team' :
                null;
        if (type === 'user') {
            if (body_unclean === '') {
                return res.send({
                    "text": yield getSlackSummary(req.controllers, slackId),
                    "response_type": "in_channel",
                    "attachments": [{
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
                        }]
                });
            }
            req.user = yield req.controllers.users.getBySlackUserId(slackId);
            if (!req.user) {
                return res.send({
                    "response_type": "in_channel",
                    "text": "Couldn't find a connected user"
                });
            }
            const body = body_unclean.replace(/<@([A-Z0-9]+)\|(@?\w+)>/, `[@$2](https://${team_domain}.slack.com/team/$2)`);
            const saved = yield req.controllers.tasks.add(req.user.id, new Task_1.default({
                queue: 'q1',
                title: body,
                description: `slack task from ${username}`,
            }));
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
        else if (type === 'team') {
            req.user = yield req.controllers.users.getBySlackUserId(authorSlackUserId);
            if (req.user.slackAccessToken) {
                const { ok, users: slackUserIds } = yield getContent('https://slack.com/api/usergroups.users.list?' + qs_1.stringify({
                    token: req.user.slackAccessToken,
                    usergroup: slackId,
                }));
                if (ok) {
                    const summaries = yield Promise.all(slackUserIds.map(s => getSlackSummary(controllers, s)));
                    return res.send({
                        text: summaries.join('\n\n')
                    });
                }
                else {
                    return res.send('Failed to retrieve slack team from slack api');
                }
            }
            else {
                return res.send('Failed to retrieve slack team, no token');
            }
        }
    }
}));
integrationsApi.get('/slack/authorize', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { code, state } = req.query;
    if (code && state) {
        const user = yield req.controllers.users.getBySlackOathState(state);
        if (user) {
            const accessConfig = {
                client_id: process.env.SLACK_CLIENT_ID,
                client_secret: process.env.SLACK_CLIENT_SECRET,
                code,
                redirect_uri: `https://${req.hostname}/slack/authorize`
            };
            const access = yield getContent('https://slack.com/api/oauth.access?' + qs_1.stringify(accessConfig));
            if (access.ok) {
                yield req.controllers.users.updateSettings(user.id, {
                    slackAccessToken: access.access_token,
                    slackOauthState: null,
                    slackUserId: access.user_id
                });
            }
            else {
                console.log('Failed access', accessConfig, access);
            }
        }
    }
    return res.redirect('/settings');
}));
const userRouter = router();
userRouter.get('/home', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    res.send(Home_1.default());
}));
userRouter.post('/sign-up', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const { username, slackUserId, githubUserName, password, } = req.body;
    const user = yield req.controllers.users.create({
        username,
    }, password);
    req.session.userId = user.id;
    res.redirect('/');
}));
userRouter.post('/sign-in', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const { username, password } = req.body;
    const user = yield req.controllers.users.verify(username, password);
    if (!user) {
        res.redirect('/sign-up');
    }
    req.session.userId = user.id;
    res.redirect('/');
}));
userRouter.post('/users', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const { username, password } = req.body;
    yield req.controllers.users.create(username, password);
    res.redirect('/');
}));
userRouter.get('/users', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const { username, password } = req.body;
    res.send(yield req.controllers.users.all());
}));
const tasksApi = router();
tasksApi.post('/tasks', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const saved = yield req.controllers.tasks.add(req.params.userId, new Task_1.default(req.body));
    res.send(saved);
}));
tasksApi.get('/tasks', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const tasks = yield req.controllers.tasks.list(req.params.userId);
    res.send(tasks);
}));
tasksApi.get('/tasks-report', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const { report } = req.query;
    const tasks = yield req.controllers.tasks.report(req.params.userId, report);
    res.send(tasks);
}));
tasksApi.post('/tasks/:id/archive', (req, res) => __awaiter(this, void 0, void 0, function* () {
    yield req.controllers.tasks.archive(req.params.userId, req.params.id);
    res.sendStatus(204).end();
}));
userRouter.use('/users/:userid', tasksApi);
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    res.status(500);
    res.send(err && err.stack);
    console.log(err && err.stack);
}
process.on('unhandledRejection', function (reason, p) {
    console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
    // application specific logging here
});
app.use(integrationsApi);
app.use(userRouter);
app.use(tasksRouter);
app.use(errorHandler);
app.listen(process.env.PORT || 3000);
//# sourceMappingURL=server.js.map