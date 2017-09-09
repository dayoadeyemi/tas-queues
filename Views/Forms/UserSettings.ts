import { Form, Input } from './Utils'
import UserModel from '../../Models/User'

export const SettingsForm = (user:UserModel) => Form({
  action: '/settings',
  cta: 'Save',
  children: [
    Input({ type: 'text',
      id: 'username',
      name: 'Username',
      value: user.username
    }),
    Input({ type: 'text',
      id: 'slackUserId',
      name: 'Slack User Id',
      value: user.slackUserId
    }),
    Input({ type: 'text',
      id: 'githubUserName',
      name: 'Github Username',
      value: user.githubUserName
    }),
  ],
})

export default SettingsForm