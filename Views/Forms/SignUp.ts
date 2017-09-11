import { Form, Input } from './Utils'

const SignUpForm = () => Form({
  action: '/sign-up',
  cta: 'Sign Up',
  children: [
    Input({ type: 'text', id: 'username', name: 'Username' }),
    Input({ type: 'password', id: 'password', name: 'Password' }),
    Input({ type: 'text', id: 'slackUserId', name: 'Slack User Id' }),
    Input({ type: 'text', id: 'githubUserName', name: 'Github Username' }),
  ],
})

export default SignUpForm