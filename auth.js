import { supabase } from "./supabase.js";
const loginCard =
    document.getElementById("loginCard");

const registerCard =
    document.getElementById("registerCard");

const showRegister =
    document.getElementById("showRegister");

const showLogin =
    document.getElementById("showLogin");


const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");


const loginMessage =
    document.getElementById("loginMessage");

const registerMessage =
    document.getElementById("registerMessage");


const loginButton =
    document.getElementById("loginButton");

const registerButton =
    document.getElementById("registerButton");


/* =========================================
   ЕСЛИ УЖЕ ВОШЁЛ
========================================= */

async function checkExistingSession() {

    const {
        data,
        error
    } =
        await supabase.auth.getSession();


    if (error) {
        return;
    }


    if (data.session) {

        window.location.href =
            "index.html";

    }

}


checkExistingSession();


/* =========================================
   ПОКАЗАТЬ LOGIN
========================================= */

function openLogin() {

    registerCard.classList.remove(
        "active"
    );


    loginCard.classList.add(
        "active"
    );


    clearMessages();

}


/* =========================================
   ПОКАЗАТЬ REGISTER
========================================= */

function openRegister() {

    loginCard.classList.remove(
        "active"
    );


    registerCard.classList.add(
        "active"
    );


    clearMessages();

}


/* =========================================
   ПЕРЕКЛЮЧЕНИЕ
========================================= */

showRegister.addEventListener(
    "click",
    openRegister
);


showLogin.addEventListener(
    "click",
    openLogin
);


/* =========================================
   ОЧИСТИТЬ СООБЩЕНИЯ
========================================= */

function clearMessages() {

    loginMessage.textContent =
        "";

    registerMessage.textContent =
        "";


    loginMessage.className =
        "auth-message";

    registerMessage.className =
        "auth-message";

}


/* =========================================
   ПОКАЗАТЬ СООБЩЕНИЕ
========================================= */

function showMessage(
    element,
    text,
    success = false
) {

    element.textContent =
        text;


    element.className =
        success
            ? "auth-message show success"
            : "auth-message show";

}


/* =========================================
   LOGIN
========================================= */

loginForm.addEventListener(
    "submit",

    async event => {

        event.preventDefault();


        const email =
            document
            .getElementById("loginEmail")
            .value
            .trim();


        const password =
            document
            .getElementById("loginPassword")
            .value;


        clearMessages();


        loginButton.disabled =
            true;

        loginButton.textContent =
            "LOGGING IN...";


        const {
            data,
            error
        } =
            await supabase.auth
            .signInWithPassword({

                email,
                password

            });


        if (error) {

            showMessage(
                loginMessage,
                error.message
            );


            loginButton.disabled =
                false;

            loginButton.textContent =
                "LOG IN";

            return;

        }


        if (data.session) {

            window.location.href =
                "index.html";

        }

    }

);


/* =========================================
   REGISTER
========================================= */

registerForm.addEventListener(
    "submit",

    async event => {

        event.preventDefault();


        const username =
            document
            .getElementById("registerUsername")
            .value
            .trim();


        const email =
            document
            .getElementById("registerEmail")
            .value
            .trim();


        const password =
            document
            .getElementById("registerPassword")
            .value;


        const passwordConfirm =
            document
            .getElementById(
                "registerPasswordConfirm"
            )
            .value;


        clearMessages();


        if (
            password !==
            passwordConfirm
        ) {

            showMessage(
                registerMessage,
                "Passwords do not match."
            );

            return;

        }


        if (
            username.length < 3
        ) {

            showMessage(
                registerMessage,
                "Username must contain at least 3 characters."
            );

            return;

        }


        registerButton.disabled =
            true;

        registerButton.textContent =
            "CREATING...";


        const {
            data,
            error
        } =
            await supabase.auth
            .signUp({

                email,

                password,

                options: {

                    data: {

                        username

                    }

                }

            });


        if (error) {

            showMessage(
                registerMessage,
                error.message
            );


            registerButton.disabled =
                false;

            registerButton.textContent =
                "CREATE ACCOUNT";

            return;

        }


        /*
            Если Supabase автоматически
            дал сессию
        */

        if (data.session) {

            await createProfile(
                data.user,
                username
            );


            window.location.href =
                "index.html";

            return;

        }


        /*
            Если включено подтверждение email
        */

        showMessage(
            registerMessage,
            "Account created. Check your email to confirm your account.",
            true
        );


        registerButton.disabled =
            false;

        registerButton.textContent =
            "CREATE ACCOUNT";

    }

);


/* =========================================
   СОЗДАТЬ PROFILE
========================================= */

async function createProfile(
    user,
    username
) {

    const {
        error
    } =
        await supabase
        .from("profiles")
        .upsert({

            id:
                user.id,

            username,

            avatar_skin:
                "light",

            avatar_hair:
                "short",

            avatar_hair_color:
                "black",

            avatar_outfit:
                "hoodie",

            avatar_outfit_color:
                "black"

        });


    if (error) {

        console.error(
            error
        );

    }

}