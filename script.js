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


const SHORT_NAMES = {
    MONDAY: "MON",
    TUESDAY: "TUE",
    WEDNESDAY: "WED",
    THURSDAY: "THU",
    FRIDAY: "FRI",
    SATURDAY: "SAT",
    SUNDAY: "SUN"
};


/*
    Старые времена из твоих PNG.
    Они используются только как первоначальный шаблон,
    если у пользователя ещё нет расписания.
*/

const DEFAULT_TIMES = {

    MONDAY: [
        "08:00", "08:10", "08:30",
        "09:15", "09:40", "10:00",
        "11:00", "14:00", "15:00",
        "18:00", "20:00", "21:00",
        "23:00", "23:15"
    ],

    TUESDAY: [
        "08:00", "08:10", "08:30",
        "09:15", "09:40", "10:00",
        "11:00", "14:00", "15:30",
        "16:00", "17:00", "18:00",
        "20:00", "23:00", "23:15"
    ],

    WEDNESDAY: [
        "08:00", "08:10", "08:30",
        "09:15", "09:40", "10:00",
        "11:00", "13:00", "14:00",
        "15:00", "20:00", "21:00",
        "22:00", "23:00", "23:15"
    ],

    THURSDAY: [
        "08:00", "08:10", "08:30",
        "09:15", "09:40", "10:00",
        "11:00", "14:00", "15:00",
        "17:00", "19:30", "20:30",
        "21:30", "23:00", "23:15"
    ],

    FRIDAY: [
        "08:00", "08:10", "08:30",
        "09:15", "09:40", "10:00",
        "11:00", "13:00", "14:00",
        "15:00", "20:00", "21:00",
        "21:30", "23:00", "23:15"
    ],

    SATURDAY: [
        "08:30", "08:40", "09:00",
        "09:45", "10:10", "10:30",
        "11:30", "15:00", "16:00",
        "17:00", "18:00", "20:00",
        "23:00", "23:15"
    ],

    SUNDAY: [
        "09:00", "09:10", "09:30",
        "10:00", "13:00", "14:00",
        "15:00", "18:00", "19:00",
        "20:00", "21:00", "22:00",
        "22:15", "23:00"
    ]

};


const DEFAULT_SETTINGS = {

    background: "#ffffff",

    text: "#111111",

    timeColor: "#777777",

    gridColor: "rgba(17,17,17,0.10)",

    accent: "#111111",

    font: "Arial",

    taskSize: 14,

    timeSize: 10,

    rowHeight: 58,

    borderRadius: 0,

    gridWidth: 1,


    /* POINTER */

    pointerSymbol: "➜",

    pointerColor: "#111111",

    pointerSize: 26,

    pointerOpacity: 1,

    pointerGradient: false,

    pointerGradientStart: "#111111",

    pointerGradientEnd: "#777777"

};


/* =====================================================
   DOM
===================================================== */

const dayName =
    document.getElementById("dayName");

const currentTime =
    document.getElementById("currentTime");

const prevDayButton =
    document.getElementById("prevDay");

const nextDayButton =
    document.getElementById("nextDay");

const selectedDayButton =
    document.getElementById("selectedDayButton");

const selectedDayLabel =
    document.getElementById("selectedDayLabel");

const selectedDayName =
    document.getElementById("selectedDayName");

const schedule =
    document.getElementById("schedule");

const scheduleWrapper =
    document.getElementById("scheduleWrapper");

const scheduleGrid =
    document.getElementById("scheduleGrid");

const currentTimePointer =
    document.getElementById("currentTimePointer");

const dayButtons =
    document.querySelectorAll(".day-button");


/* MENU */

const menuButton =
    document.getElementById("menuButton");

const sideMenu =
    document.getElementById("sideMenu");

const menuOverlay =
    document.getElementById("menuOverlay");

const closeMenu =
    document.getElementById("closeMenu");

const logoutButton =
    document.getElementById("logoutButton");

const menuUsername =
    document.getElementById("menuUsername");

const menuEmail =
    document.getElementById("menuEmail");

const menuAvatar =
    document.getElementById("menuAvatar");


/* =====================================================
   STATE
===================================================== */

let session = null;

let selectedDay = null;

let scheduleData = {};

let settings = {
    ...DEFAULT_SETTINGS
};


/* =====================================================
   AUTH
===================================================== */

async function checkAuth() {

    const {
        data
    } = await supabase.auth.getSession();


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
   DEFAULT SCHEDULE
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
   LOAD SCHEDULE
===================================================== */

async function loadSchedule() {

    const {
        data,
        error
    } = await supabase

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

        console.error(
            "Schedule loading error:",
            error
        );

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


    WEEK.forEach(day => {

        if (!Array.isArray(scheduleData[day])) {

            scheduleData[day] = [];

        }

    });

}


/* =====================================================
   SAVE
===================================================== */

let saveTimer = null;


function saveScheduleDebounced() {

    clearTimeout(saveTimer);


    saveTimer =
        setTimeout(
            saveSchedule,
            500
        );

}


async function saveSchedule() {

    if (!session) {
        return;
    }


    const {
        error
    } = await supabase

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

        console.error(
            "Schedule saving error:",
            error
        );

    }

}


/* =====================================================
   TIME
===================================================== */

function getAlmatyTime() {

    const parts =
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone: "Asia/Almaty",

                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",

                hour12: false
            }
        )
        .formatToParts(
            new Date()
        );


    let hour =
        Number(
            parts.find(
                part =>
                    part.type === "hour"
            ).value
        );


    const minute =
        Number(
            parts.find(
                part =>
                    part.type === "minute"
            ).value
        );


    const second =
        Number(
            parts.find(
                part =>
                    part.type === "second"
            ).value
        );


    if (hour === 24) {
        hour = 0;
    }


    return {
        hour,
        minute,
        second
    };

}


function getAlmatyDay() {

    return new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: "Asia/Almaty",
            weekday: "long"
        }
    )
    .format(
        new Date()
    )
    .toUpperCase();

}


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


function currentMinutes() {

    const time =
        getAlmatyTime();


    return (
        time.hour * 60 +
        time.minute +
        time.second / 60
    );

}


/* =====================================================
   STYLE
===================================================== */

function applySettings() {

    document.documentElement.style.setProperty(
        "--schedule-background",
        settings.background
    );


    document.documentElement.style.setProperty(
        "--schedule-text",
        settings.text
    );


    document.documentElement.style.setProperty(
        "--schedule-time",
        settings.timeColor
    );


    document.documentElement.style.setProperty(
        "--schedule-grid",
        settings.gridColor
    );


    document.documentElement.style.setProperty(
        "--schedule-accent",
        settings.accent
    );


    document.documentElement.style.setProperty(
        "--schedule-font",
        settings.font
    );


    document.documentElement.style.setProperty(
        "--task-size",
        `${settings.taskSize}px`
    );


    document.documentElement.style.setProperty(
        "--time-size",
        `${settings.timeSize}px`
    );


    document.documentElement.style.setProperty(
        "--row-height",
        `${settings.rowHeight}px`
    );


    document.documentElement.style.setProperty(
        "--grid-width",
        `${settings.gridWidth}px`
    );


    document.documentElement.style.setProperty(
        "--schedule-radius",
        `${settings.borderRadius}px`
    );

}


/* =====================================================
   RENDER SCHEDULE
===================================================== */

function renderSchedule() {

    applySettings();


    scheduleGrid.innerHTML = "";


    const rows =
        scheduleData[selectedDay] || [];


    if (!rows.length) {

        const empty =
            document.createElement("div");

        empty.className =
            "empty-schedule";

        empty.textContent =
            "NO TASKS";

        scheduleGrid.appendChild(
            empty
        );

        updatePointer();

        return;

    }


    rows.forEach(
        (row, index) => {

            const rowElement =
                document.createElement("div");

            rowElement.className =
                "schedule-row";


            const timeElement =
                document.createElement("div");

            timeElement.className =
                "schedule-time";

            timeElement.textContent =
                row.time;


            const taskElement =
                document.createElement("div");

            taskElement.className =
                "schedule-task";

            taskElement.textContent =
                row.task || "";


            if (!row.task) {

                taskElement.classList.add(
                    "empty-task"
                );

            }


            rowElement.appendChild(
                timeElement
            );


            rowElement.appendChild(
                taskElement
            );


            scheduleGrid.appendChild(
                rowElement
            );

        }
    );


    updatePointer();

}


/* =====================================================
   POINTER
===================================================== */
function applyPointerStyle() {

    const pointer =
        document.getElementById(
            "pointerSymbol"
        );


    if (!pointer) {
        return;
    }


    pointer.textContent =
        settings.pointerSymbol ||
        "➜";


    document.documentElement.style.setProperty(
        "--pointer-color",
        settings.pointerColor ||
        "#111111"
    );


    document.documentElement.style.setProperty(
        "--pointer-size",
        `${settings.pointerSize || 26}px`
    );


    document.documentElement.style.setProperty(
        "--pointer-opacity",
        settings.pointerOpacity ?? 1
    );


    document.documentElement.style.setProperty(
        "--pointer-gradient-start",
        settings.pointerGradientStart ||
        "#111111"
    );


    document.documentElement.style.setProperty(
        "--pointer-gradient-end",
        settings.pointerGradientEnd ||
        "#777777"
    );


    pointer.parentElement.classList.toggle(
        "pointer-gradient",
        settings.pointerGradient === true
    );
applyPointerStyle();
}

function updatePointer() {

    if (
        selectedDay !==
        getAlmatyDay()
    ) {

        currentTimePointer.style.display =
            "none";

        return;

    }


    const rows =
        scheduleData[selectedDay] || [];


    if (!rows.length) {

        currentTimePointer.style.display =
            "none";

        return;

    }


    const now =
        currentMinutes();


    /*
        Ищем ближайшее время расписания.

        Стрелка всегда стоит именно
        НА строке времени, а не между строками.
    */

    let closestIndex = 0;

    let smallestDifference =
        Infinity;


    rows.forEach(
        (row, index) => {

            const difference =
                Math.abs(
                    timeToMinutes(row.time) -
                    now
                );


            if (
                difference <
                smallestDifference
            ) {

                smallestDifference =
                    difference;

                closestIndex =
                    index;

            }

        }
    );


    /*
        Если текущее время слишком далеко
        от расписания — не показываем стрелку.
    */

    const closestTime =
        timeToMinutes(
            rows[closestIndex].time
        );


    if (
        Math.abs(
            closestTime - now
        ) > 60
    ) {

        currentTimePointer.style.display =
            "none";

        return;

    }


    /*
        Центр строки.
    */

    const position =
        (
            closestIndex *
            settings.rowHeight
        )
        +
        (
            settings.rowHeight / 2
        );


    currentTimePointer.style.display =
        "block";


    currentTimePointer.style.top =
        `${position}px`;


    applyPointerStyle();

}

/* =====================================================
   UI
===================================================== */

function updateDayButtons() {

    const today =
        getAlmatyDay();


    dayButtons.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.day ===
            selectedDay
        );


        button.classList.toggle(
            "today",
            button.dataset.day ===
            today
        );

    });

}


function updateSelectedDayInfo() {

    const today =
        getAlmatyDay();


    selectedDayName.textContent =
        selectedDay;


    if (
        selectedDay === today
    ) {

        selectedDayLabel.textContent =
            "TODAY";

        return;

    }


    let difference =
        WEEK.indexOf(selectedDay) -
        WEEK.indexOf(today);


    if (difference < 0) {

        difference += 7;

    }


    if (difference === 1) {

        selectedDayLabel.textContent =
            "TOMORROW";

    }

    else if (difference === 2) {

        selectedDayLabel.textContent =
            "DAY AFTER TOMORROW";

    }

    else {

        selectedDayLabel.textContent =
            SHORT_NAMES[selectedDay];

    }

}


function selectDay(day) {

    selectedDay =
        day;


    dayName.textContent =
        day;


    updateDayButtons();

    updateSelectedDayInfo();

    renderSchedule();

}


/* =====================================================
   DAY NAVIGATION
===================================================== */

function previousDay() {

    const index =
        WEEK.indexOf(selectedDay);


    selectDay(
        WEEK[
            (
                index - 1 + 7
            ) % 7
        ]
    );

}


function nextDay() {

    const index =
        WEEK.indexOf(selectedDay);


    selectDay(
        WEEK[
            (
                index + 1
            ) % 7
        ]
    );

}


/* =====================================================
   CLOCK
===================================================== */

function updateClock() {

    const time =
        getAlmatyTime();


    currentTime.textContent =
        String(time.hour)
            .padStart(2, "0")
        +
        ":"
        +
        String(time.minute)
            .padStart(2, "0");


    updatePointer();

}


/* =====================================================
   MENU
===================================================== */

function openMenu() {

    sideMenu.classList.add(
        "open"
    );

    menuOverlay.classList.add(
        "open"
    );

}


function closeSideMenu() {

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


closeMenu.addEventListener(
    "click",
    closeSideMenu
);


menuOverlay.addEventListener(
    "click",
    closeSideMenu
);


logoutButton.addEventListener(
    "click",
    async () => {

        await supabase.auth.signOut();

        window.location.href =
            "auth.html";

    }
);


/* =====================================================
   USER
===================================================== */

function loadUserInfo() {

    const user =
        session.user;


    const email =
        user.email || "";


    const name =
        user.user_metadata?.username ||
        user.user_metadata?.name ||
        email.split("@")[0] ||
        "USER";


    menuUsername.textContent =
        name.toUpperCase();


    menuEmail.textContent =
        email;


    menuAvatar.textContent =
        name
            .charAt(0)
            .toUpperCase();

}


/* =====================================================
   SWIPE
===================================================== */

let startX = 0;
let startY = 0;


schedule.addEventListener(
    "touchstart",
    event => {

        startX =
            event.changedTouches[0].screenX;

        startY =
            event.changedTouches[0].screenY;

    },
    {
        passive: true
    }
);


schedule.addEventListener(
    "touchend",
    event => {

        const endX =
            event.changedTouches[0].screenX;

        const endY =
            event.changedTouches[0].screenY;


        const diffX =
            endX - startX;

        const diffY =
            endY - startY;


        if (
            Math.abs(diffX) < 50
        ) {
            return;
        }


        if (
            Math.abs(diffX) <=
            Math.abs(diffY)
        ) {
            return;
        }


        if (diffX < 0) {

            nextDay();

        }

        else {

            previousDay();

        }

    },
    {
        passive: true
    }
);


/* =====================================================
   BUTTONS
===================================================== */

prevDayButton.addEventListener(
    "click",
    previousDay
);


nextDayButton.addEventListener(
    "click",
    nextDay
);


selectedDayButton.addEventListener(
    "click",
    () => {

        selectDay(
            getAlmatyDay()
        );

    }
);


dayButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            selectDay(
                button.dataset.day
            );

        }
    );

});


/* =====================================================
   RESIZE
===================================================== */

window.addEventListener(
    "resize",
    updatePointer
);


/* =====================================================
   START
===================================================== */

const authenticated =
    await checkAuth();


if (authenticated) {

    await loadSchedule();

    loadUserInfo();

    selectedDay =
        getAlmatyDay();

    selectDay(
        selectedDay
    );

    updateClock();

    setInterval(
        updateClock,
        1000
    );

}