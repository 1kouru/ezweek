import { supabase } from "./supabase.js";


/* =========================================
   ELEMENTS
========================================= */

const dayName =
    document.getElementById("dayName");

const currentTime =
    document.getElementById("currentTime");

const selectedDayLabel =
    document.getElementById("selectedDayLabel");

const selectedDayName =
    document.getElementById("selectedDayName");

const schedule =
    document.getElementById("schedule");

const board =
    document.getElementById("scheduleBoard");

const pointer =
    document.getElementById("timePointer");

const pointerSymbol =
    document.getElementById("pointerSymbol");

const emptyState =
    document.getElementById("emptyState");

const prevDay =
    document.getElementById("prevDay");

const nextDay =
    document.getElementById("nextDay");

const selectedDayButton =
    document.getElementById(
        "selectedDayButton"
    );

const dayButtons =
    document.querySelectorAll(
        ".day-button"
    );


/* =========================================
   DAYS
========================================= */

const DAYS = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY"
];


const SHORT = {
    MONDAY: "MON",
    TUESDAY: "TUE",
    WEDNESDAY: "WED",
    THURSDAY: "THU",
    FRIDAY: "FRI",
    SATURDAY: "SAT",
    SUNDAY: "SUN"
};


/* =========================================
   DEFAULT DATA
========================================= */

function defaultSchedule() {

    const days = {};

    DAYS.forEach(day => {

        days[day] = [];

    });


    return {

        days,

        global: {

            grid: "clean",

            gridColor: "#e8e8e8",

            timeColor: "#999999",

            timeSize: 11,

            taskSize: 15,

            taskColor: "#111111",

            taskBackground: "transparent",

            taskRadius: 12,

            taskPadding: 10

        },

        pointer: {

            symbol: "▶",

            color: "#111111",

            size: 28,

            gradient: false,

            gradientStart: "#ff4ecd",

            gradientEnd: "#7c5cff"

        }

    };

}


/* =========================================
   STATE
========================================= */

let scheduleData =
    defaultSchedule();

let selectedDay = null;

let user = null;


/* =========================================
   AUTH
========================================= */

async function loadUser() {

    const {
        data,
        error
    } =
        await supabase.auth.getSession();


    if (error) {

        console.error(error);

        window.location.href =
            "auth.html";

        return null;

    }


    if (!data.session) {

        window.location.href =
            "auth.html";

        return null;

    }


    return data.session.user;

}


/* =========================================
   LOAD SCHEDULE
========================================= */

async function loadSchedule() {

    const {
        data,
        error
    } =
        await supabase

            .from("schedules")

            .select("data")

            .eq(
                "user_id",
                user.id
            )

            .maybeSingle();


    if (error) {

        console.error(
            "SCHEDULE LOAD ERROR:",
            error
        );

        return;

    }


    if (
        data &&
        data.data
    ) {

        scheduleData =
            normalizeSchedule(
                data.data
            );

    }

    else {

        scheduleData =
            defaultSchedule();

        await saveSchedule();

    }

}


/* =========================================
   NORMALIZE
========================================= */

function normalizeSchedule(data) {

    const base =
        defaultSchedule();


    const result = {

        ...base,

        ...data,

        global: {

            ...base.global,

            ...(data.global || {})

        },

        pointer: {

            ...base.pointer,

            ...(data.pointer || {})

        },

        days: {

            ...base.days,

            ...(data.days || {})

        }

    };


    DAYS.forEach(day => {

        if (
            !Array.isArray(
                result.days[day]
            )
        ) {

            result.days[day] = [];

        }

    });


    return result;

}


/* =========================================
   SAVE
========================================= */

async function saveSchedule() {

    if (!user) {
        return false;
    }


    const {
        error
    } =
        await supabase

            .from("schedules")

            .upsert(

                {

                    user_id:
                        user.id,

                    data:
                        scheduleData,

                    updated_at:
                        new Date()
                            .toISOString()

                },

                {
                    onConflict:
                        "user_id"
                }

            );


    if (error) {

        console.error(
            "SCHEDULE SAVE ERROR:",
            error
        );

        return false;

    }


    return true;

}


/* =========================================
   TIME
========================================= */

function getAlmatyTime() {

    const parts =
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone:
                    "Asia/Almaty",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                second:
                    "2-digit",

                hour12:
                    false
            }
        )
        .formatToParts(
            new Date()
        );


    let hour =
        Number(
            parts.find(
                p =>
                    p.type ===
                    "hour"
            ).value
        );


    if (hour === 24) {
        hour = 0;
    }


    return {

        hour,

        minute:
            Number(
                parts.find(
                    p =>
                        p.type ===
                        "minute"
                ).value
            ),

        second:
            Number(
                parts.find(
                    p =>
                        p.type ===
                        "second"
                ).value
            )

    };

}


function getAlmatyDay() {

    return new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone:
                "Asia/Almaty",

            weekday:
                "long"
        }
    )
    .format(
        new Date()
    )
    .toUpperCase();

}


function seconds(time) {

    const [
        h,
        m
    ] =
        time
        .split(":")
        .map(Number);


    return (
        h * 3600 +
        m * 60
    );

}


/* =========================================
   SORT
========================================= */

function sortItems(items) {

    return [...items].sort(
        (a, b) =>
            seconds(a.time) -
            seconds(b.time)
    );

}


/* =========================================
   RENDER
========================================= */

function render() {

    if (!selectedDay) {
        return;
    }


    const global =
        scheduleData.global;


    board.innerHTML = "";


    board.style
        .setProperty(
            "--grid-color",
            global.gridColor
        );


    const items =
        sortItems(
            scheduleData.days[
                selectedDay
            ]
        );


    if (!items.length) {

        board.appendChild(
            emptyState
        );

        emptyState.style.display =
            "block";

    }


    else {

        emptyState.style.display =
            "none";


        items.forEach(item => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "schedule-row";


            row.dataset.time =
                item.time;


            row.style.setProperty(
                "--time-color",
                item.timeColor ||
                global.timeColor
            );


            row.style.setProperty(
                "--time-size",
                `${item.timeSize || global.timeSize}px`
            );


            row.style.setProperty(
                "--time-weight",
                item.timeWeight ||
                600
            );


            row.style.setProperty(
                "--task-size",
                `${item.fontSize || global.taskSize}px`
            );


            row.style.setProperty(
                "--task-color",
                item.color ||
                global.taskColor
            );


            row.style.setProperty(
                "--task-background",
                item.background ||
                global.taskBackground
            );


            row.style.setProperty(
                "--task-radius",
                `${item.radius ?? global.taskRadius}px`
            );


            row.style.setProperty(
                "--task-padding",
                `${item.padding ?? global.taskPadding}px`
            );


            row.style.setProperty(
                "--task-weight",
                item.fontWeight ||
                500
            );


            row.style.setProperty(
                "--task-font",
                item.fontFamily ||
                "Arial"
            );


            const time =
                document.createElement(
                    "div"
                );


            time.className =
                "schedule-time";


            time.textContent =
                item.time;


            const task =
                document.createElement(
                    "div"
                );


            task.className =
                "schedule-task";


            task.textContent =
                item.text;


            if (
                item.gradient
            ) {

                task.style.background =
                    `linear-gradient(90deg, ${item.gradientStart}, ${item.gradientEnd})`;

                task.style.webkitBackgroundClip =
                    "text";

                task.style.backgroundClip =
                    "text";

                task.style.color =
                    "transparent";

            }


            row.appendChild(time);

            row.appendChild(task);

            board.appendChild(row);

        });

    }


    renderGridStyle();

    renderPointerStyle();

    updatePointer();

}


/* =========================================
   GRID
========================================= */

function renderGridStyle() {

    board.classList.remove(
        "grid-dots",
        "grid-double",
        "grid-soft",
        "grid-wave"
    );


    if (
        scheduleData.global.grid ===
        "dots"
    ) {

        board.classList.add(
            "grid-dots"
        );

    }

    if (
        scheduleData.global.grid ===
        "double"
    ) {

        board.classList.add(
            "grid-double"
        );

    }

    if (
        scheduleData.global.grid ===
        "soft"
    ) {

        board.classList.add(
            "grid-soft"
        );

    }

    if (
        scheduleData.global.grid ===
        "wave"
    ) {

        board.classList.add(
            "grid-wave"
        );

    }

}


/* =========================================
   POINTER
========================================= */

function renderPointerStyle() {

    const p =
        scheduleData.pointer;


    pointerSymbol.textContent =
        p.symbol || "▶";


    pointer.style.fontSize =
        `${p.size || 28}px`;


    pointer.style.color =
        p.color ||
        "#111";


    pointer.classList.remove(
        "gradient"
    );


    if (p.gradient) {

        pointer.classList.add(
            "gradient"
        );


        pointer.style.setProperty(
            "--pointer-gradient",
            `linear-gradient(90deg, ${p.gradientStart}, ${p.gradientEnd})`
        );

    }

}


/* =========================================
   EXACT POINTER POSITION
========================================= */

function updatePointer() {

    if (
        selectedDay !==
        getAlmatyDay()
    ) {

        pointer.style.display =
            "none";

        return;

    }


    const items =
        sortItems(
            scheduleData.days[
                selectedDay
            ]
        );


    if (!items.length) {

        pointer.style.display =
            "none";

        return;

    }


    const now =
        getAlmatyTime();


    const current =
        now.hour * 3600 +
        now.minute * 60 +
        now.second;


    let nearest =
        null;

    let smallest =
        Infinity;


    items.forEach(item => {

        const difference =
            Math.abs(
                seconds(item.time) -
                current
            );


        if (
            difference <
            smallest
        ) {

            smallest =
                difference;

            nearest =
                item;

        }

    });


    const rows =
        board.querySelectorAll(
            ".schedule-row"
        );


    let targetRow = null;


    rows.forEach(row => {

        if (
            row.dataset.time ===
            nearest.time
        ) {

            targetRow = row;

        }

    });


    if (!targetRow) {

        pointer.style.display =
            "none";

        return;

    }


    const rowRect =
        targetRow.getBoundingClientRect();


    const boardRect =
        schedule.getBoundingClientRect();


    const y =
        rowRect.top -
        boardRect.top +
        rowRect.height / 2;


    pointer.style.top =
        `${y}px`;


    pointer.style.display =
        "block";

}


/* =========================================
   DAY UI
========================================= */

function updateDayUI() {

    const today =
        getAlmatyDay();


    dayName.textContent =
        selectedDay;


    selectedDayName.textContent =
        selectedDay;


    if (
        selectedDay ===
        today
    ) {

        selectedDayLabel.textContent =
            "TODAY";

    }

    else {

        selectedDayLabel.textContent =
            SHORT[selectedDay];

    }


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


/* =========================================
   SELECT DAY
========================================= */

function selectDay(day) {

    selectedDay =
        day;

    updateDayUI();

    render();

}


/* =========================================
   CLOCK
========================================= */

function updateClock() {

    const time =
        getAlmatyTime();


    currentTime.textContent =
        `${String(time.hour).padStart(2,"0")}:${String(time.minute).padStart(2,"0")}`;

}


/* =========================================
   EVENTS
========================================= */

prevDay.addEventListener(
    "click",
    () => {

        const index =
            DAYS.indexOf(
                selectedDay
            );


        selectDay(
            DAYS[
                (
                    index -
                    1 +
                    7
                ) % 7
            ]
        );

    }
);


nextDay.addEventListener(
    "click",
    () => {

        const index =
            DAYS.indexOf(
                selectedDay
            );


        selectDay(
            DAYS[
                (
                    index +
                    1
                ) % 7
            ]
        );

    }
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


/* =========================================
   SWIPE
========================================= */

let startX = 0;
let startY = 0;


schedule.addEventListener(
    "touchstart",
    e => {

        startX =
            e.changedTouches[0]
                .screenX;

        startY =
            e.changedTouches[0]
                .screenY;

    },
    {
        passive: true
    }
);


schedule.addEventListener(
    "touchend",
    e => {

        const endX =
            e.changedTouches[0]
                .screenX;

        const endY =
            e.changedTouches[0]
                .screenY;


        const dx =
            endX - startX;

        const dy =
            endY - startY;


        if (
            Math.abs(dx) < 60 ||
            Math.abs(dx) <= Math.abs(dy)
        ) {

            return;

        }


        if (dx < 0) {

            const index =
                DAYS.indexOf(
                    selectedDay
                );

            selectDay(
                DAYS[
                    (index + 1) % 7
                ]
            );

        }

        else {

            const index =
                DAYS.indexOf(
                    selectedDay
                );

            selectDay(
                DAYS[
                    (index - 1 + 7) % 7
                ]
            );

        }

    },
    {
        passive: true
    }
);


/* =========================================
   RESIZE
========================================= */

window.addEventListener(
    "resize",
    updatePointer
);


/* =========================================
   START
========================================= */

async function start() {

    user =
        await loadUser();


    if (!user) {
        return;
    }


    await loadSchedule();


    selectedDay =
        getAlmatyDay();


    updateDayUI();

    updateClock();

    render();


    setInterval(
        () => {

            updateClock();

            updatePointer();

        },
        1000
    );

}


start();