import { Form, Input } from './Utils'

const SignInForm = () => Form({
  action: '/sign-in',
  children: [
    Input({ type: 'text', id: 'username', name: 'Username' }),
    Input({ type: 'password', id: 'password', name: 'Password' }),
  ],
})

export default SignInForm