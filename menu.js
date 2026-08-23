import { supabase } from "./supabase.js";


const menuButton =
    document.getElementById(
        "menuButton"
    );

const closeButton =
    document.getElementById(
        "closeMenu"
    );

const menu =
    document.getElementById(
        "sideMenu"
    );

const overlay =
    document.getElementById(
        "menuOverlay"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const username =
    document.getElementById(
        "menuUsername"
    );

const email =
    document.getElementById(
        "menuEmail"
    );

const avatar =
    document.getElementById(
        "menuAvatar"
    );


function openMenu() {

    menu.classList.add(
        "open"
    );

    overlay.classList.add(
        "open"
    );

}


function closeMenu() {

    menu.classList.remove(
        "open"
    );

    overlay.classList.remove(
        "open"
    );

}


menuButton.addEventListener(
    "click",
    openMenu
);


closeButton.addEventListener(
    "click",
    closeMenu
);


overlay.addEventListener(
    "click",
    closeMenu
);


document.addEventListener(
    "keydown",
    e => {

        if (
            e.key === "Escape"
        ) {

            closeMenu();

        }

    }
);


logoutButton.addEventListener(
    "click",
    async () => {

        await supabase.auth.signOut();

        window.location.href =
            "auth.html";

    }
);


async function loadProfile() {

    const {
        data
    } =
        await supabase.auth.getUser();


    const user =
        data.user;


    if (!user) {
        return;
    }


    email.textContent =
        user.email ||
        "";


    const name =
        user.user_metadata?.username ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "USER";


    username.textContent =
        name.toUpperCase();


    avatar.textContent =
        name
            .charAt(0)
            .toUpperCase();

}


loadProfile();