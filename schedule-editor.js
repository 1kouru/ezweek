import { supabase } from "./supabase.js";


/* =====================================================
   CONFIG
===================================================== */

const WEEK = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY"
];


const DEFAULT_TIMES = {

    MONDAY: [
        "08:00","08:10","08:30",
        "09:15","09:40","10:00",
        "11:00","14:00","15:00",
        "18:00","20:00","21:00",
        "23:00","23:15"
    ],

    TUESDAY: [
        "08:00","08:10","08:30",
        "09:15","09:40","10:00",
        "11:00","14:00","15:30",
        "16:00","17:00","18:00",
        "20:00","23:00","23:15"
    ],

    WEDNESDAY: [
        "08:00","08:10","08:30",
        "09:15","09:40","10:00",
        "11:00","13:00","14:00",
        "15:00","20:00","21:00",
        "22:00","23:00","23:15"
    ],

    THURSDAY: [
        "08:00","08:10","08:30",
        "09:15","09:40","10:00",
        "11:00","14:00","15:00",
        "17:00","19:30","20:30",
        "21:30","23:00","23:15"
    ],

    FRIDAY: [
        "08:00","08:10","08:30",
        "09:15","09:40","10:00",
        "11:00","13:00","14:00",
        "15:00","20:00","21:00",
        "21:30","23:00","23:15"
    ],

    SATURDAY: [
        "08:30","08:40","09:00",
        "09:45","10:10","10:30",
        "11:30","15:00","16:00",
        "17:00","18:00","20:00",
        "23:00","23:15"
    ],

    SUNDAY: [
        "09:00","09:10","09:30",
        "10:00","13:00","14:00",
        "15:00","18:00","19:00",
        "20:00","21:00","22:00",
        "22:15","23:00"
    ]

};


const DEFAULT_SETTINGS = {

    background: "#ffffff",

    text: "#111111",

    timeColor: "#777777",

    gridColor: "#dddddd",

    accent: "#111111",

    font: "Arial",

    taskSize: 13,

    timeSize: 10,

    rowHeight: 54,

    borderRadius: 0,

    gridWidth: 1

};


/* =====================================================
   DOM
===================================================== */

const editorRows =
    document.getElementById(
        "editorRows"
    );

const editorDayName =
    document.getElementById(
        "editorDayName"
    );

const addRowButton =
    document.getElementById(
        "addRowButton"
    );

const saveStatus =
    document.getElementById(
        "saveStatus"
    );

const dayButtons =
    document.querySelectorAll(
        ".editor-days button"
    );


/* SETTINGS */

const settingsOverlay =
    document.getElementById(
        "settingsOverlay"
    );

const settingsButton =
    document.getElementById(
        "settingsButton"
    );

const closeSettings =
    document.getElementById(
        "closeSettings"
    );

const resetSettings =
    document.getElementById(
        "resetSettings"
    );


const backgroundColor =
    document.getElementById(
        "backgroundColor"
    );

const textColor =
    document.getElementById(
        "textColor"
    );

const timeColor =
    document.getElementById(
        "timeColor"
    );

const gridColor =
    document.getElementById(
        "gridColor"
    );

const accentColor =
    document.getElementById(
        "accentColor"
    );

const fontSelect =
    document.getElementById(
        "fontSelect"
    );

const taskSize =
    document.getElementById(
        "taskSize"
    );

const timeSize =
    document.getElementById(
        "timeSize"
    );

const rowHeight =
    document.getElementById(
        "rowHeight"
    );

const gridWidth =
    document.getElementById(
        "gridWidth"
    );

const borderRadius =
    document.getElementById(
        "borderRadius"
    );


const taskSizeValue =
    document.getElementById(
        "taskSizeValue"
    );

const timeSizeValue =
    document.getElementById(
        "timeSizeValue"
    );

const rowHeightValue =
    document.getElementById(
        "rowHeightValue"
    );

const gridWidthValue =
    document.getElementById(
        "gridWidthValue"
    );

const borderRadiusValue =
    document.getElementById(
        "borderRadiusValue"
    );

const pointerSymbol =
    document.getElementById(
        "pointerSymbol"
    );

const pointerColor =
    document.getElementById(
        "pointerColor"
    );

const pointerSize =
    document.getElementById(
        "pointerSize"
    );

const pointerOpacity =
    document.getElementById(
        "pointerOpacity"
    );

const pointerGradient =
    document.getElementById(
        "pointerGradient"
    );

const pointerGradientStart =
    document.getElementById(
        "pointerGradientStart"
    );

const pointerGradientEnd =
    document.getElementById(
        "pointerGradientEnd"
    );

const pointerSizeValue =
    document.getElementById(
        "pointerSizeValue"
    );

const pointerOpacityValue =
    document.getElementById(
        "pointerOpacityValue"
    );

const gradientOptions =
    document.getElementById(
        "gradientOptions"
    );

/* =====================================================
   STATE
===================================================== */

let session = null;

let selectedDay = "MONDAY";

let scheduleData = {};

let settings = {
    ...DEFAULT_SETTINGS
};


/* =====================================================
   DEFAULT DATA
===================================================== */

function createDefaultSchedule() {

    const result = {};


    WEEK.forEach(day => {

        result[day] =
            DEFAULT_TIMES[day].map(time => ({

                time,

                task: ""

            }));

    });


    return result;

}


/* =====================================================
   AUTH
===================================================== */

async function checkAuth() {

    const {
        data
    } =
        await supabase.auth.getSession();


    session =
        data.session;


    if (!session) {

        window.location.href =
            "auth.html";

        return false;

    }


    return true;

}


/* =====================================================
   LOAD
===================================================== */

async function loadSchedule() {

    const {
        data,
        error
    } =
        await supabase

        .from("schedules")

        .select(
            "schedule_data, settings"
        )

        .eq(
            "user_id",
            session.user.id
        )

        .maybeSingle();


    if (error) {

        console.error(error);

        scheduleData =
            createDefaultSchedule();

        return;

    }


    if (!data) {

        scheduleData =
            createDefaultSchedule();

        settings =
            {
                ...DEFAULT_SETTINGS
            };


        await saveSchedule();

        return;

    }


    scheduleData =
        data.schedule_data ||
        createDefaultSchedule();


    settings =
        {
            ...DEFAULT_SETTINGS,
            ...(data.settings || {})
        };

}


/* =====================================================
   SAVE
===================================================== */

let saveTimer = null;


function saveLater() {

    saveStatus.textContent =
        "SAVING...";


    clearTimeout(saveTimer);


    saveTimer =
        setTimeout(
            saveSchedule,
            500
        );

}


async function saveSchedule() {

    const {
        error
    } =
        await supabase

        .from("schedules")

        .upsert({

            user_id:
                session.user.id,

            schedule_data:
                scheduleData,

            settings,

            updated_at:
                new Date().toISOString()

        });


    if (error) {

        console.error(error);

        saveStatus.textContent =
            "ERROR";

        return;

    }


    saveStatus.textContent =
        "SAVED";

}


/* =====================================================
   TIME SORT
===================================================== */

function timeToMinutes(time) {

    const [
        hours,
        minutes
    ] =
        time
        .split(":")
        .map(Number);


    return (
        hours * 60 +
        minutes
    );

}


function sortDay(day) {

    scheduleData[day].sort(
        (a,b) =>
            timeToMinutes(a.time) -
            timeToMinutes(b.time)
    );

}


/* =====================================================
   RENDER
===================================================== */

function render() {

    editorDayName.textContent =
        selectedDay;


    dayButtons.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.day ===
            selectedDay
        );

    });


    editorRows.innerHTML = "";


    const rows =
        scheduleData[selectedDay] || [];


    rows.forEach(
        (row, index) => {

            const rowElement =
                document.createElement(
                    "div"
                );

            rowElement.className =
                "editor-row";


            /* TIME */

            const timeInput =
                document.createElement(
                    "input"
                );

            timeInput.type =
                "time";

            timeInput.className =
                "time-input";

            timeInput.value =
                row.time;


            /* TASK */

            const taskInput =
                document.createElement(
                    "input"
                );

            taskInput.type =
                "text";

            taskInput.className =
                "task-input";

            taskInput.placeholder =
                "What do you need to do?";

            taskInput.value =
                row.task || "";


            /* DELETE */

            const deleteButton =
                document.createElement(
                    "button"
                );

            deleteButton.className =
                "delete-row";

            deleteButton.type =
                "button";

            deleteButton.textContent =
                "×";


            /* EVENTS */

            timeInput.addEventListener(
                "change",
                () => {

                    row.time =
                        timeInput.value;

                    sortDay(
                        selectedDay
                    );

                    render();

                    saveLater();

                }
            );


            taskInput.addEventListener(
                "input",
                () => {

                    row.task =
                        taskInput.value;

                    saveLater();

                }
            );


            deleteButton.addEventListener(
                "click",
                () => {

                    scheduleData[
                        selectedDay
                    ].splice(
                        index,
                        1
                    );

                    render();

                    saveLater();

                }
            );


            rowElement.appendChild(
                timeInput
            );

            rowElement.appendChild(
                taskInput
            );

            rowElement.appendChild(
                deleteButton
            );


            editorRows.appendChild(
                rowElement
            );

        }
    );

}


/* =====================================================
   ADD ROW
===================================================== */

addRowButton.addEventListener(
    "click",
    () => {

        let time =
            "08:00";


        const rows =
            scheduleData[selectedDay];


        if (rows.length) {

            const last =
                rows[
                    rows.length - 1
                ];


            let minutes =
                timeToMinutes(
                    last.time
                );


            minutes += 30;


            const hours =
                Math.floor(
                    minutes / 60
                );


            const mins =
                minutes % 60;


            time =
                String(hours)
                    .padStart(2,"0")
                +
                ":"
                +
                String(mins)
                    .padStart(2,"0");

        }


        scheduleData[
            selectedDay
        ].push({

            time,

            task: ""

        });


        sortDay(
            selectedDay
        );


        render();

        saveLater();

    }
);


/* =====================================================
   DAY SWITCH
===================================================== */

dayButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            selectedDay =
                button.dataset.day;

            render();

        }
    );

});


/* =====================================================
   SETTINGS
===================================================== */

function updateSettingsUI() {

    backgroundColor.value =
        settings.background;

    textColor.value =
        settings.text;

    timeColor.value =
        settings.timeColor;

    gridColor.value =
        settings.gridColor.startsWith("#")
            ? settings.gridColor
            : "#dddddd";

    accentColor.value =
        settings.accent;

    fontSelect.value =
        settings.font;

    taskSize.value =
        settings.taskSize;

    timeSize.value =
        settings.timeSize;

    rowHeight.value =
        settings.rowHeight;

    gridWidth.value =
        settings.gridWidth;

    borderRadius.value =
        settings.borderRadius;

pointerSymbol.value =
    settings.pointerSymbol ||
    "➜";

pointerColor.value =
    settings.pointerColor ||
    "#111111";

pointerSize.value =
    settings.pointerSize ||
    26;

pointerOpacity.value =
    settings.pointerOpacity ??
    1;

pointerGradient.checked =
    settings.pointerGradient === true;

pointerGradientStart.value =
    settings.pointerGradientStart ||
    "#111111";

pointerGradientEnd.value =
    settings.pointerGradientEnd ||
    "#777777";

updatePointerSettingsUI();

    updateSettingLabels();

}

function updatePointerSettingsUI() {

    pointerSizeValue.textContent =
        `${pointerSize.value}px`;


    pointerOpacityValue.textContent =
        `${Math.round(
            Number(pointerOpacity.value) * 100
        )}%`;


    gradientOptions.classList.toggle(
        "open",
        pointerGradient.checked
    );

}

function updateSettingLabels() {

    taskSizeValue.textContent =
        `${taskSize.value}px`;

    timeSizeValue.textContent =
        `${timeSize.value}px`;

    rowHeightValue.textContent =
        `${rowHeight.value}px`;

    gridWidthValue.textContent =
        `${gridWidth.value}px`;

    borderRadiusValue.textContent =
        `${borderRadius.value}px`;

}


function settingsChanged() {

    settings.background =
        backgroundColor.value;

    settings.text =
        textColor.value;

    settings.timeColor =
        timeColor.value;

    settings.gridColor =
        gridColor.value;

    settings.accent =
        accentColor.value;

    settings.font =
        fontSelect.value;

    settings.taskSize =
        Number(
            taskSize.value
        );

    settings.timeSize =
        Number(
            timeSize.value
        );

    settings.rowHeight =
        Number(
            rowHeight.value
        );

    settings.gridWidth =
        Number(
            gridWidth.value
        );

    settings.borderRadius =
        Number(
            borderRadius.value
        );
settings.pointerSymbol =
    pointerSymbol.value;

settings.pointerColor =
    pointerColor.value;

settings.pointerSize =
    Number(
        pointerSize.value
    );

settings.pointerOpacity =
    Number(
        pointerOpacity.value
    );

settings.pointerGradient =
    pointerGradient.checked;

settings.pointerGradientStart =
    pointerGradientStart.value;

settings.pointerGradientEnd =
    pointerGradientEnd.value;

    updateSettingLabels();

    saveLater();

}

[
    pointerSymbol,
    pointerColor,
    pointerSize,
    pointerOpacity,
    pointerGradient,
    pointerGradientStart,
    pointerGradientEnd
].forEach(element => {

    element.addEventListener(
        "input",
        () => {

            settingsChanged();

            updatePointerSettingsUI();

        }
    );


    element.addEventListener(
        "change",
        () => {

            settingsChanged();

            updatePointerSettingsUI();

        }
    );

});

[
    backgroundColor,
    textColor,
    timeColor,
    gridColor,
    accentColor,
    fontSelect,
    taskSize,
    timeSize,
    rowHeight,
    gridWidth,
    borderRadius
].forEach(element => {

    element.addEventListener(
        "input",
        settingsChanged
    );

    element.addEventListener(
        "change",
        settingsChanged
    );

});


/* =====================================================
   SETTINGS WINDOW
===================================================== */

settingsButton.addEventListener(
    "click",
    () => {

        settingsOverlay.classList.add(
            "open"
        );

    }
);


closeSettings.addEventListener(
    "click",
    () => {

        settingsOverlay.classList.remove(
            "open"
        );

    }
);


settingsOverlay.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            settingsOverlay
        ) {

            settingsOverlay.classList.remove(
                "open"
            );

        }

    }
);


/* =====================================================
   RESET
===================================================== */

resetSettings.addEventListener(
    "click",
    () => {

        settings =
            {
                ...DEFAULT_SETTINGS
            };


        updateSettingsUI();

        saveLater();

    }
);


/* =====================================================
   START
===================================================== */

const authenticated =
    await checkAuth();


if (authenticated) {

    await loadSchedule();

    updateSettingsUI();

    render();

}