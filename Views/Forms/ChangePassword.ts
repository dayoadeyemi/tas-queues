import { Form, Input } from './Utils'

const SignInForm = () => Form({
  action: '/change-password',
  cta: 'Update',
  children: [
    Input({ type: 'password', id: 'oldPassword', name: 'Old Password' }),
    Input({ type: 'password', id: 'password', name: 'New Password' }),
  ],
})

export default SignInForm