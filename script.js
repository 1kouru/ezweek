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

            gridType: "rows",

            gridThickness: 1,

            gridColor: "#e8e8e8"

        },

        pointer: {

            icon: 1,

            color: "#111111",

            size: 28,

            gradient: false,

            gradientStart: "#ff4ecd",

            gradientEnd: "#7c5cff"

        }

    };

}


/* =========================================
   DEFAULT TASK
========================================= */

function defaultTask() {

    return {

        id:
            crypto.randomUUID(),

        time: "08:00",

        text: "NEW TASK",


        /* TIME */

        timeColor: "#999999",

        timeSize: 11,

        timeWeight: 600,

        timeGradient: false,

        timeGradientStart: "#ff4ecd",

        timeGradientEnd: "#7c5cff",

        timeBackground: "transparent",

        timeRadius: 10,

        timePadding: 7,


        /* TEXT */

        color: "#111111",

        fontSize: 15,

        fontFamily: "Arial",

        fontWeight: 500,

        gradient: false,

        gradientStart: "#ff4ecd",

        gradientEnd: "#7c5cff"

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


    /*
     * Совместимость со старой
     * версией редактора.
     */

    if (
        data.global?.grid &&
        !data.global?.gridType
    ) {

        if (
            data.global.grid ===
            "clean"
        ) {

            result.global.gridType =
                "rows";

        }

    }


    DAYS.forEach(day => {

        if (
            !Array.isArray(
                result.days[day]
            )
        ) {

            result.days[day] = [];

        }


        result.days[day] =
            result.days[day].map(item => {

                return {

                    ...defaultTask(),

                    ...item

                };

            });

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


    board.innerHTML = "";


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


            /*
             * TIME STYLE
             */

            row.style.setProperty(
                "--time-color",
                item.timeColor
            );


            row.style.setProperty(
                "--time-size",
                `${item.timeSize}px`
            );


            row.style.setProperty(
                "--time-weight",
                item.timeWeight
            );


            row.style.setProperty(
                "--time-background",

                item.timeBackground ===
                "transparent"

                    ? "transparent"

                    : item.timeBackground
            );


            row.style.setProperty(
                "--time-radius",
                `${item.timeRadius}px`
            );


            row.style.setProperty(
                "--time-padding",
                `${item.timePadding}px`
            );


            /*
             * TASK STYLE
             */

            row.style.setProperty(
                "--task-size",
                `${item.fontSize}px`
            );


            row.style.setProperty(
                "--task-color",
                item.color
            );


            row.style.setProperty(
                "--task-weight",
                item.fontWeight
            );


            row.style.setProperty(
                "--task-font",
                item.fontFamily
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
                item.text ||
                "TASK";


            /*
             * TEXT GRADIENT
             */

            if (item.gradient) {

                task.style.backgroundImage =
                    `linear-gradient(
                        90deg,
                        ${item.gradientStart},
                        ${item.gradientEnd}
                    )`;

                task.style.webkitBackgroundClip =
                    "text";

                task.style.backgroundClip =
                    "text";

                task.style.webkitTextFillColor =
                    "transparent";

                task.style.color =
                    "transparent";

            }

            else {

                task.style.backgroundImage =
                    "none";

                task.style.webkitTextFillColor =
                    item.color;

                task.style.color =
                    item.color;

            }


            /*
             * TIME GRADIENT
             */

            if (item.timeGradient) {

                time.style.backgroundImage =
                    `linear-gradient(
                        90deg,
                        ${item.timeGradientStart},
                        ${item.timeGradientEnd}
                    )`;

                time.style.webkitBackgroundClip =
                    "text";

                time.style.backgroundClip =
                    "text";

                time.style.webkitTextFillColor =
                    "transparent";

            }

            else {

                time.style.backgroundImage =
                    "none";

                time.style.webkitTextFillColor =
                    item.timeColor;

                time.style.color =
                    item.timeColor;

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

    const global =
        scheduleData.global;


    /*
     * Цвет и толщина
     */

    board.style.setProperty(
        "--grid-color",
        global.gridColor
    );


    board.style.setProperty(
        "--grid-thickness",
        `${global.gridThickness}px`
    );


    /*
     * Тип сетки
     */

    board.classList.remove(
        "grid-rows",
        "grid-full"
    );


    if (
        global.gridType ===
        "grid"
    ) {

        board.classList.add(
            "grid-full"
        );

    }

    else {

        board.classList.add(
            "grid-rows"
        );

    }

}


/* =========================================
   POINTER
========================================= */

function renderPointerStyle() {

    const p =
        scheduleData.pointer;


    /*
     * Размер контейнера
     */

    pointer.style.width =
        `${p.size}px`;

    pointer.style.height =
        `${p.size}px`;


    /*
     * PNG ИКОНКА
     */

    pointerSymbol.innerHTML =
        "";


    pointerSymbol.style.width =
        "100%";

    pointerSymbol.style.height =
        "100%";


    pointerSymbol.style.display =
        "block";


    /*
     * Одноцветный указатель
     * через CSS mask.
     */

    pointerSymbol.style.mask =
        `url("icons/${p.icon}.png")
        center / contain
        no-repeat`;


    pointerSymbol.style.webkitMask =
        `url("icons/${p.icon}.png")
        center / contain
        no-repeat`;


    if (p.gradient) {

        pointerSymbol.style.background =
            `linear-gradient(
                90deg,
                ${p.gradientStart},
                ${p.gradientEnd}
            )`;

    }

    else {

        pointerSymbol.style.background =
            p.color;

    }

}


/* =========================================
   POINTER POSITION
========================================= */

function updatePointer() {

    /*
     * Показываем указатель
     * только на сегодняшнем дне.
     */

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


    /*
     * Ищем ближайшую задачу.
     */

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


    let targetRow =
        null;


    rows.forEach(row => {

        if (
            row.dataset.time ===
            nearest.time
        ) {

            targetRow =
                row;

        }

    });


    if (!targetRow) {

        pointer.style.display =
            "none";

        return;

    }


    const rowRect =
        targetRow.getBoundingClientRect();


    const scheduleRect =
        schedule.getBoundingClientRect();


    /*
     * Центр строки.
     */

    const y =
        rowRect.top -
        scheduleRect.top +
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
        `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;

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
            endX -
            startX;

        const dy =
            endY -
            startY;


        if (
            Math.abs(dx) < 60 ||
            Math.abs(dx) <= Math.abs(dy)
        ) {

            return;

        }


        const index =
            DAYS.indexOf(
                selectedDay
            );


        if (dx < 0) {

            selectDay(
                DAYS[
                    (
                        index +
                        1
                    ) % 7
                ]
            );

        }

        else {

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
