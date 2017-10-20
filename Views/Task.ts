import TaskForm from './Forms/Task'
import TaskModel from '../Models/Task'
import { Converter } from 'showdown'
import Modal from './Modal'

import timeago from 'timeago.js';

const ta = timeago()

const converter = new Converter()
export const TaskView = (task: TaskModel) => {
  const modal = new Modal('Edit Task', TaskForm(task))
  return `
    <div class="d-flex w-100 justify-content-between">
        <span>
            <small class="text-muted">${ta.format(task.createdAt)}</small>
            <a id="${task.id}" ${modal.toggleParams()}>
                <h5 class="mb-1"><b>${task.title}</b> (${task.estimate || 1})</h5>
            </a>
        </span>
        <form action="/tasks/${task.id}/archive" method="post" onsubmit="cleanupListeners()">
            <button type="submit" class="close" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </form>
    </div>
    <div>${converter.makeHtml(task.description)}</div>
    ${modal}`
}

export default TaskView