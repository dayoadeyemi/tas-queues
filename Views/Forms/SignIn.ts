import { Form, Input } from './Utils'

const SignInForm = () => Form({
  action: '/sign-in',
  cta: 'Sign In',
  children: [
    Input({ type: 'text', id: 'username', name: 'Username' }),
    Input({ type: 'password', id: 'password', name: 'Password' }),
  ],
})

export default SignInForm