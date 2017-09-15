import { Form, Input } from './Utils'

const SignUpForm = () => Form({
  action: '/sign-up',
  cta: 'Sign Up',
  children: [
    Input({ type: 'text', id: 'username', name: 'Username' }),
    Input({ type: 'password', id: 'password', name: 'Password' }),
  ],
})

export default SignUpForm