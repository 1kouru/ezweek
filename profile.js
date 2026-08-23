/* =========================================
   ELEMENTS
========================================= */

const avatarCharacter =
    document.getElementById("avatarCharacter");

const avatarHead =
    document.getElementById("avatarHead");

const avatarHair =
    document.getElementById("avatarHair");

const avatarHairBack =
    document.getElementById("avatarHairBack");

const avatarBody =
    document.getElementById("avatarBody");

const avatarEyes =
    document.getElementById("avatarEyes");

const avatarMouth =
    document.getElementById("avatarMouth");

const profileUsername =
    document.getElementById("profileUsername");

const profileEmail =
    document.getElementById("profileEmail");

const saveProfileButton =
    document.getElementById("saveProfile");

const saveStatus =
    document.getElementById("saveStatus");


const skinOptions =
    document.querySelectorAll(
        ".skin-option"
    );

const hairOptions =
    document.querySelectorAll(
        ".hair-option"
    );

const hairColorOptions =
    document.querySelectorAll(
        ".color-option"
    );

const eyesOptions =
    document.querySelectorAll(
        ".eyes-option"
    );

const eyeColorOptions =
    document.querySelectorAll(
        ".eye-color-option"
    );

const mouthOptions =
    document.querySelectorAll(
        ".mouth-option"
    );

const outfitOptions =
    document.querySelectorAll(
        ".outfit-option"
    );

const outfitColorOptions =
    document.querySelectorAll(
        ".outfit-color-option"
    );


/* =========================================
   USER
========================================= */

let currentUser = null;


/* =========================================
   CHARACTER
========================================= */

let character = {

    skin:
        "light",

    hair:
        "short",

    hairColor:
        "black",

    eyes:
        "round",

    eyeColor:
        "brown",

    mouth:
        "smile",

    outfit:
        "hoodie",

    outfitColor:
        "black"

};


/* =========================================
   COLORS
========================================= */

const SKIN_COLORS = {

    light:
        "#f1c8a5",

    medium:
        "#b77b55",

    dark:
        "#75452e"

};


const HAIR_COLORS = {

    black:
        "#111111",

    brown:
        "#69462d",

    blonde:
        "#d6b36a",

    red:
        "#a63d32",

    pink:
        "#e98da9",

    blue:
        "#4d83c2",

    white:
        "#eeeeee"

};


const EYE_COLORS = {

    brown:
        "#69462d",

    green:
        "#4f8155",

    blue:
        "#4e83bd",

    gray:
        "#7b8188",

    black:
        "#111111"

};


const OUTFIT_COLORS = {

    black:
        "#111111",

    white:
        "#eeeeee"

};


/* =========================================
   LOAD USER
========================================= */

async function loadProfile() {

    const {
        data: {
            user
        },
        error: userError
    } =
        await supabase.auth.getUser();


    if (
        userError ||
        !user
    ) {

        window.location.href =
            "auth.html";

        return;

    }


    currentUser =
        user;


    profileEmail.textContent =
        user.email || "";


    /*
        Загружаем профиль
    */

    const {
        data: profile,
        error
    } =
        await supabase
        .from("profiles")
        .select("*")
        .eq(
            "id",
            user.id
        )
        .maybeSingle();


    if (error) {

        console.error(
            "PROFILE LOAD ERROR:",
            error
        );

        showStatus(
            "FAILED TO LOAD PROFILE"
        );

        return;

    }


    if (profile) {

        profileUsername.value =
            profile.username ||
            user.user_metadata?.username ||
            "USER";


        character.skin =
            profile.avatar_skin ||
            "light";


        character.hair =
            profile.avatar_hair ||
            "short";


        character.hairColor =
            profile.avatar_hair_color ||
            "black";


        character.eyes =
            profile.avatar_eyes ||
            "round";


        character.eyeColor =
            profile.avatar_eye_color ||
            "brown";


        character.mouth =
            profile.avatar_mouth ||
            "smile";


        character.outfit =
            profile.avatar_outfit ||
            "hoodie";


        character.outfitColor =
            profile.avatar_outfit_color ||
            "black";

    }

    else {

        profileUsername.value =
            user.user_metadata?.username ||
            "USER";

    }


    updateCharacter();

}


/* =========================================
   UPDATE CHARACTER
========================================= */

function updateCharacter() {

    /*
        Skin
    */

    avatarHead.style.background =
        SKIN_COLORS[
            character.skin
        ] ||
        SKIN_COLORS.light;


    /*
        Hair color
    */

    avatarHair.style.background =
        HAIR_COLORS[
            character.hairColor
        ] ||
        HAIR_COLORS.black;


    avatarHairBack.style.background =
        HAIR_COLORS[
            character.hairColor
        ] ||
        HAIR_COLORS.black;


    /*
        Outfit
    */

    avatarBody.style.background =
        OUTFIT_COLORS[
            character.outfitColor
        ] ||
        OUTFIT_COLORS.black;


    /*
        Eye color
    */

    const eyeColor =
        EYE_COLORS[
            character.eyeColor
        ] ||
        EYE_COLORS.brown;


    document
        .querySelectorAll(
            ".pupil"
        )
        .forEach(
            pupil => {

                pupil.style.background =
                    eyeColor;

            }
        );


    /*
        Reset character classes
    */

    avatarCharacter.className =
        "avatar-character";


    /*
        Hair
    */

    avatarCharacter.classList.add(
        `hair-${character.hair}`
    );


    /*
        Eyes
    */

    avatarCharacter.classList.add(
        `eyes-${character.eyes}`
    );


    /*
        Mouth
    */

    avatarCharacter.classList.add(
        `mouth-${character.mouth}`
    );


    /*
        Outfit
    */

    avatarCharacter.classList.add(
        `outfit-${character.outfit}`
    );


    /*
        Update buttons
    */

    updateActiveButtons();

}


/* =========================================
   ACTIVE BUTTONS
========================================= */

function updateActiveButtons() {

    setActive(
        skinOptions,
        character.skin
    );


    setActive(
        hairOptions,
        character.hair
    );


    setActive(
        hairColorOptions,
        character.hairColor
    );


    setActive(
        eyesOptions,
        character.eyes
    );


    setActive(
        eyeColorOptions,
        character.eyeColor
    );


    setActive(
        mouthOptions,
        character.mouth
    );


    setActive(
        outfitOptions,
        character.outfit
    );


    setActive(
        outfitColorOptions,
        character.outfitColor
    );

}


function setActive(
    elements,
    value
) {

    elements.forEach(
        element => {

            element.classList.toggle(
                "active",
                element.dataset.value ===
                value
            );

        }
    );

}


/* =========================================
   SKIN
========================================= */

skinOptions.forEach(
    button => {

        button.addEventListener(
            "click",

            () => {

                character.skin =
                    button.dataset.value;

                updateCharacter();

            }
        );

    }
);


/* =========================================
   HAIR
========================================= */

hairOptions.forEach(
    button => {

        button.addEventListener(
            "click",

            () => {

                character.hair =
                    button.dataset.value;

                updateCharacter();

            }
        );

    }
);


/* =========================================
   HAIR COLOR
========================================= */

hairColorOptions.forEach(
    button => {

        button.addEventListener(
            "click",

            () => {

                character.hairColor =
                    button.dataset.value;

                updateCharacter();

            }
        );

    }
);


/* =========================================
   EYES
========================================= */

eyesOptions.forEach(
    button => {

        button.addEventListener(
            "click",

            () => {

                character.eyes =
                    button.dataset.value;

                updateCharacter();

            }
        );

    }
);


/* =========================================
   EYE COLOR
========================================= */

eyeColorOptions.forEach(
    button => {

        button.addEventListener(
            "click",

            () => {

                character.eyeColor =
                    button.dataset.value;

                updateCharacter();

            }
        );

    }
);


/* =========================================
   MOUTH
========================================= */

mouthOptions.forEach(
    button => {

        button.addEventListener(
            "click",

            () => {

                character.mouth =
                    button.dataset.value;

                updateCharacter();

            }
        );

    }
);


/* =========================================
   OUTFIT
========================================= */

outfitOptions.forEach(
    button => {

        button.addEventListener(
            "click",

            () => {

                character.outfit =
                    button.dataset.value;

                updateCharacter();

            }
        );

    }
);


/* =========================================
   OUTFIT COLOR
========================================= */

outfitColorOptions.forEach(
    button => {

        button.addEventListener(
            "click",

            () => {

                character.outfitColor =
                    button.dataset.value;

                updateCharacter();

            }
        );

    }
);


/* =========================================
   SAVE
========================================= */

saveProfileButton.addEventListener(
    "click",

    saveProfile
);


async function saveProfile() {

    if (!currentUser) {

        return;

    }


    saveProfileButton.disabled =
        true;

    saveProfileButton.textContent =
        "SAVING...";


    showStatus("");


    const username =
        profileUsername.value
        .trim();


    if (
        username.length < 3
    ) {

        showStatus(
            "USERNAME TOO SHORT"
        );

        saveProfileButton.disabled =
            false;

        saveProfileButton.textContent =
            "SAVE CHANGES";

        return;

    }


    /*
        Сохраняем профиль
    */

    const {
        error
    } =
        await supabase
        .from("profiles")
        .upsert({

            id:
                currentUser.id,

            username,

            avatar_skin:
                character.skin,

            avatar_hair:
                character.hair,

            avatar_hair_color:
                character.hairColor,

            avatar_eyes:
                character.eyes,

            avatar_eye_color:
                character.eyeColor,

            avatar_mouth:
                character.mouth,

            avatar_outfit:
                character.outfit,

            avatar_outfit_color:
                character.outfitColor

        });


    if (error) {

        console.error(
            "PROFILE SAVE ERROR:",
            error
        );

        showStatus(
            "COULD NOT SAVE"
        );

    }

    else {

        /*
            Заодно обновляем username
            в Auth metadata
        */

        const {
            error: metadataError
        } =
            await supabase.auth.updateUser({

                data: {
                    username
                }

            });


        if (metadataError) {

            console.warn(
                "Metadata update:",
                metadataError
            );

        }


        showStatus(
            "SAVED"
        );

    }


    setTimeout(
        () => {

            saveProfileButton.disabled =
                false;

            saveProfileButton.textContent =
                "SAVE CHANGES";

        },
        1200
    );

}


/* =========================================
   STATUS
========================================= */

function showStatus(
    message
) {

    saveStatus.textContent =
        message;

}


/* =========================================
   START
========================================= */

loadProfile();