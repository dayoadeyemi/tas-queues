import TaskForm from './Forms/Task'
import { Converter } from 'showdown'
import Modal from './Modal'

const converter = new Converter()
export const TaskView = (task) => {
  const modal = new Modal('Edit Task', TaskForm(task))
  return `
    <form action="/tasks/${task.id}/archive" method="post" onsubmit="cleanupListeners()">
        <button type="submit" class="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    </form>
    <a id="${task.id}" ${modal.toggleParams()}>
        <b>${task.title}</b> (${task.estimate || 1})
        <div>${converter.makeHtml(task.description)}</div>
    </a>
    ${modal}`
}

export default TaskView