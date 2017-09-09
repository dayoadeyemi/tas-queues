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
        res.redirect('/report?after=' + getYesterdayString());
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
    if (req.cookies.browser)
        res.redirect('/');
    else
        res.sendStatus(204).end();
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
    res.send();
}));
integrationsApi.post('/slack', (req, res) => __awaiter(this, void 0, void 0, function* () {
    if (req.body.payload) {
        const { actions, callback_id: id, user: { name: username }, original_message } = JSON.parse(req.body.payload);
        const updates = actions.reduce((memo, action) => {
            memo[action.name] = action.selected_options[0].value;
            return memo;
        }, {});
        yield req.controllers.tasks.update({ id }, updates);
        res.send(original_message);
    }
    else {
        const { team_domain, team_id: teamId, user_name: username, text, } = req.body;
        const match = text.match(/<@([A-Z0-9]+)\|(\w+)>\s*(.*)/);
        if (!match) {
            res.send({
                "response_type": "in_channel",
                "text": "Couldn't find a user at the start of the message"
            });
        }
        const [_, slackUserId, slackUserName, body_unclean] = match;
        req.user = yield req.controllers.users.getBySlackUserId(slackUserId);
        if (!req.user) {
            res.send({
                "response_type": "in_channel",
                "text": "Couldn't find a user registered for slack name @" + username
            });
        }
        if (body_unclean === '') {
            const tasks = yield req.controllers.tasks.list(req.user.id);
            return res.send({
                text: 'View the list at - ' + req.hostname + '\n\n' + tasks.sort(({ queue: q1, priority: p1 }, { queue: q2, priority: p2 }) => {
                    return q1 > q2 ? 1 : q1 < q2 ? -1 : p2 - p1;
                }).map(task => `*${task.queue.toUpperCase() || 'Not Prioritised'} | ${task.title}*\n${task.description}\n`).join('\n')
            });
        }
        const body = body_unclean.replace(/<@([A-Z0-9]+)\|(\w+)>/, `[@$2](https://${team_domain}.slack.com/team/$2)`);
        const saved = yield req.controllers.tasks.add(req.user.id, new Task_1.default({
            queue: 'q1',
            title: `slack task from ${username}`,
            description: body,
        }));
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
}));
const userRouter = router();
userRouter.get('/home', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    res.send(Home_1.default());
}));
userRouter.post('/sign-up', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const { username, slackUserId, githubUserName, password, } = req.body;
    const user = yield req.controllers.users.create({
        username,
        slackUserId,
        githubUserName,
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
    yield yield req.controllers.tasks.archive(req.params.userId, req.params.id);
    res.sendStatus(204).end();
}));
userRouter.use('/users/:userid', tasksApi);
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    res.status(500);
    res.send(err && err.stack);
}
app.use(integrationsApi);
app.use(userRouter);
app.use(tasksRouter);
app.use(errorHandler);
app.listen(process.env.PORT || 3000);
//# sourceMappingURL=server.js.map