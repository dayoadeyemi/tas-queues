import { readFileSync } from 'fs'
import Queues from './Queues'
import TaskModel from '../Models/Task'
import UserModel from '../Models/User'
import TaskForm from './Forms/Task'
import SignInForm from '../Views/Forms/SignIn'
import SignUpForm from '../Views/Forms/SignUp'
import Modal from './Modal'
import Layout from './Layout'

const HomeView = () => {
    const signInFormModal = new Modal('Sign In', SignInForm())
    const signUpFormModal = new Modal('Sign Up', SignUpForm())

    return Layout({
        navContent: `
            <button type="button" class="btn btn-secondary" ${signInFormModal.toggleParams()}>
                <span>Sign In</span> 
            </button>
            <button type="button" class="btn btn-secondary" ${signUpFormModal.toggleParams()}>
                <span>Sign Up</span> 
            </button>`,
        body: `${signInFormModal}${signUpFormModal}`
    })
}

export default HomeView