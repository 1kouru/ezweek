const menuButton =
    document.getElementById("menuButton");

const sideMenu =
    document.getElementById("sideMenu");

const menuOverlay =
    document.getElementById("menuOverlay");

const closeMenuButton =
    document.getElementById("closeMenu");

const logoutButton =
    document.getElementById("logoutButton");

const menuUsername =
    document.getElementById("menuUsername");

const menuEmail =
    document.getElementById("menuEmail");

const menuAvatar =
    document.getElementById("menuAvatar");


/* =========================================
   AUTH
========================================= */

async function loadMenuUser() {

    const {
        data
    } =
        await supabaseClient
        .auth
        .getUser();


    const user =
        data.user;


    if (!user) {

        window.location.href =
            "auth.html";

        return;

    }


    menuEmail.textContent =
        user.email;


    const {
        data: profile
    } =
        await supabaseClient
        .from("profiles")
        .select("*")
        .eq(
            "id",
            user.id
        )
        .single();


    const username =
        profile?.username ||
        user.user_metadata?.username ||
        "USER";


    menuUsername.textContent =
        username;


    menuAvatar.textContent =
        username
        .charAt(0)
        .toUpperCase();

}


loadMenuUser();


/* =========================================
   OPEN
========================================= */

function openMenu() {

    sideMenu.classList.add(
        "open"
    );


    menuOverlay.classList.add(
        "open"
    );

}


/* =========================================
   CLOSE
========================================= */

function closeMenu() {

    sideMenu.classList.remove(
        "open"
    );


    menuOverlay.classList.remove(
        "open"
    );

}


menuButton.addEventListener(
    "click",
    openMenu
);


closeMenuButton.addEventListener(
    "click",
    closeMenu
);


menuOverlay.addEventListener(
    "click",
    closeMenu
);


/* =========================================
   LOGOUT
========================================= */

logoutButton.addEventListener(
    "click",

    async () => {

        logoutButton.textContent =
            "LOGGING OUT...";


        await supabaseClient
        .auth
        .signOut();


        window.location.href =
            "auth.html";

    }

);