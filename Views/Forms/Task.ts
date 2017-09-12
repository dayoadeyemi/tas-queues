import { Form, Input } from './Utils'
import TaskModel from '../../Models/Task'

const TaskForm = (task: Partial<TaskModel>) => Form({
  id: task.id,
  action: '/tasks',
  cta: task ? 'Save' : 'Create',
  children: [
    Input({ type: 'text', id: 'title', value: task.title, name: 'Title' }),
    Input({ type: 'text', id: 'queue', value: task.queue, name: 'Queue' }),
    Input({ type: 'number', id: 'estimate', value: task.estimate || 1, name: 'Estimate' }),
    Input({ type: 'textarea', id: 'description', value: task.description, name: 'Description' })
  ]
})

export default TaskForm