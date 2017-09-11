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
        body: `${signInFormModal}${signUpFormModal}
        <div class="row align-items-center" style="background-image: url('/bg.jpeg');background-repeat:no-repeat;background-position:center;background-size:cover; min-height:100vh">
            <div class="container">
                <div class="jumbotron text-center" style="opacity:.9">
                    <h1 class="display-3">TasQ</h1>
                    <p class="lead">The simplest and most powerful todo list, built for people with important things to do.</p>
                </div>
            </div>
        </div>`
    })
}

export default HomeView