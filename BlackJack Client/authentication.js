/* Imports */

// import * as bCrypt from 'bcrypt';
import * as httpRequest from './http/http_client.js';

/* HTML Elements */

let formContainers = document.getElementsByClassName("container");
let aAnchor = document.getElementsByTagName("a");
let cardContainer = document.getElementsByClassName("card")[0];
let togglePassworld = document.getElementsByClassName("togglePassword");

let inputSignUp_Username = document.getElementById('inputSignUp_Username');
let inputSignUp_Password = document.getElementById('inputSignUp_Password');
let inputSignUp_RePassword = document.getElementById('inputSignUp_RePassword');
let ContainerSignup_Notice = document.getElementById('ContainerSignup_Notice');
let pSignup_Message = document.getElementById('pSignup_Message');
let btnSignUp = document.getElementById('btnSignUp');

let inputLogin_Username = document.getElementById('inputLogin_Username');
let inputLogin_Password = document.getElementById('inputLogin_Password');
let ContainerLogin_Notice = document.getElementById('ContainerLogin_Notice');
let pLogin_Message = document.getElementById('pLogin_Message');
let btnLogin = document.getElementById('btnLogin');

/* Variables */

let isOnSignIn = true;

/* Function */

for (let iAnchor = 0; iAnchor < aAnchor.length; iAnchor++) {
    aAnchor[iAnchor].onclick = toggleMenu;
}

for (let iPassword = 0; iPassword < togglePassworld.length; iPassword++) {
    togglePassworld[iPassword].children[1].onclick = () => {
        let type = togglePassworld[iPassword].children[0].type;
        if(type === "password") {
            togglePassworld[iPassword].children[0].type = "text";
            togglePassworld[iPassword].children[1].textContent = "visibility"
        } else {
            console.log(togglePassworld[iPassword]);
            
            togglePassworld[iPassword].children[0].type = "password";
            togglePassworld[iPassword].children[1].textContent = "visibility_off"
        }
    }
}

function toggleMenu() {
    cardContainer.classList.remove("card-flipped");

    setTimeout(()=>{
        formContainers[0].style.display = (isOnSignIn ? "none": "flex")
        formContainers[1].style.display = (!isOnSignIn ? "none": "flex")
        isOnSignIn = !isOnSignIn;
        
        cardContainer.classList.add("card-flipped");
    }, 600)
}

btnSignUp.onclick = () => {
    let usernameRegex = new RegExp('(([A-Z]|[a-z]|[0-9]){3,16})');
    if(!usernameRegex.test(inputSignUp_Username.value)) {
        alertNotice(ContainerSignup_Notice, pSignup_Message, 'Invalid Username!');
        return;
    }

    let passwordRegex = new RegExp('(([A-Z]|[a-z]|[0-9]){5,})');
    if(!passwordRegex.test(inputSignUp_Password.value)) {
        alertNotice(ContainerSignup_Notice, pSignup_Message, 'Password too weak!');
        return;
    }

    if(inputSignUp_Password.value !== inputSignUp_RePassword.value) {
        alertNotice(ContainerSignup_Notice, pSignup_Message, 'Passwords aren\'t matching!');
        return;
    }

    let currentDate = getCurrentTime();

    httpRequest.sendPostRequest(`api/signup?username=${inputSignUp_Username.value}&password=${inputSignUp_Password.value}&last_login=${currentDate}&weekly_streak=0&balance=1500`,
        (success) => {
            alertNotice(ContainerSignup_Notice, pSignup_Message, success);
        }, {}, (error) => {
            alertNotice(ContainerSignup_Notice, pSignup_Message, error);
        }
    )
}

btnLogin.onclick = () => {
    let Username = inputLogin_Username.value;
    let Password = inputLogin_Password.value;
    let currentDate = getCurrentTime();

    httpRequest.sendPostRequest(`api/login?username=${Username}&password=${Password}&last_login=${currentDate}`, 
        (success) => {
            alertNotice(ContainerLogin_Notice, pLogin_Message, success);
            window.location.href = '/home_page.html';
            sessionStorage.username = Username;
            sessionStorage.password = Password;
        }, {}, (error) => {
            alertNotice(ContainerLogin_Notice, pLogin_Message, error);
        }
    )
}

function alertNotice(container, element, message) {
    container.style.visibility = 'visible';
    element.textContent = message;
}

function getCurrentTime() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
}