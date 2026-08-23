import { supabase } from "./supabase.js";


/* =========================================================
   ELEMENTS
========================================================= */

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
    document.getElementById("selectedDayButton");

const dayButtons =
    document.querySelectorAll(".day-button");


/* =========================================================
   DAYS
========================================================= */

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


/* =========================================================
   DEFAULT DATA
========================================================= */

function defaultSchedule() {

    const days = {};

    DAYS.forEach(day => {
        days[day] = [];
    });


    return {

        days,

        global: {

            gridMode: "rows",

            gridColor: "#E8E8E8",

            gridThickness: 1

        },

        pointer: {

            icon: 1,

            color: "#111111",

            size: 28

        }

    };

}


function defaultTask() {

    return {

        time: "08:00",

        text: "",

        timeColor: "#999999",

        timeSize: 11,

        timeWeight: 600,

        color: "#111111",

        fontSize: 15,

        fontFamily: "Arial",

        fontWeight: 500,

        gradient: false,

        gradientStart: "#FF4D8D",

        gradientEnd: "#7C6CFF"

    };

}


/* =========================================================
   STATE
========================================================= */

let scheduleData =
    defaultSchedule();

let selectedDay = null;

let user = null;


/* =========================================================
   AUTH
========================================================= */

async function loadUser() {

    const {
        data,
        error
    } =
        await supabase
            .auth
            .getSession();


    if (error) {

        console.error(
            "AUTH ERROR:",
            error
        );

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


/* =========================================================
   LOAD
========================================================= */

async function loadSchedule() {

    const {
        data: row,
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
        row &&
        row.data
    ) {

        scheduleData =
            normalizeSchedule(
                row.data
            );

    } else {

        scheduleData =
            defaultSchedule();

        await saveSchedule();

    }

}


/* =========================================================
   NORMALIZE
========================================================= */

function normalizeSchedule(input) {

    const source =
        input || {};

    const base =
        defaultSchedule();


    const result = {

        ...base,

        ...source,

        global: {

            ...base.global,

            ...(source.global || {})

        },

        pointer: {

            ...base.pointer,

            ...(source.pointer || {})

        },

        days: {

            ...base.days,

            ...(source.days || {})

        }

    };


    /*
     * Совместимость со старыми версиями.
     */

    if (
        !source.global?.gridMode &&
        source.global?.gridType
    ) {

        result.global.gridMode =
            source.global.gridType;

    }


    if (
        !source.global?.gridMode &&
        source.global?.grid
    ) {

        result.global.gridMode =
            source.global.grid;

    }


    if (
        ![
            "rows",
            "grid",
            "none"
        ].includes(
            result.global.gridMode
        )
    ) {

        result.global.gridMode =
            "rows";

    }


    result.global.gridThickness =
        Math.max(
            1,
            Math.min(
                5,
                Number(
                    result.global.gridThickness
                ) || 1
            )
        );


    if (
        typeof result.global.gridColor !==
        "string"
    ) {

        result.global.gridColor =
            "#E8E8E8";

    }


    /*
     * POINTER
     */

    result.pointer.icon =
        Math.max(
            1,
            Math.min(
                10,
                Number(
                    result.pointer.icon
                ) || 1
            )
        );


    result.pointer.size =
        Math.max(
            10,
            Math.min(
                70,
                Number(
                    result.pointer.size
                ) || 28
            )
        );


    if (
        typeof result.pointer.color !==
        "string"
    ) {

        result.pointer.color =
            "#111111";

    }


    /*
     * TASKS
     */

    DAYS.forEach(day => {

        if (
            !Array.isArray(
                result.days[day]
            )
        ) {

            result.days[day] = [];

        }


        result.days[day] =
            result.days[day].map(
                task => ({
                    ...defaultTask(),
                    ...task
                })
            );

    });


    return result;
}


/* =========================================================
   SAVE
========================================================= */

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


/* =========================================================
   TIME
========================================================= */

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
                part =>
                    part.type === "hour"
            )?.value || 0
        );


    if (hour === 24) {
        hour = 0;
    }


    return {

        hour,

        minute:
            Number(
                parts.find(
                    part =>
                        part.type === "minute"
                )?.value || 0
            ),

        second:
            Number(
                parts.find(
                    part =>
                        part.type === "second"
                )?.value || 0
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
        hour,
        minute
    ] =
        String(
            time || "00:00"
        )
        .split(":")
        .map(Number);


    return (
        (hour || 0) * 3600 +
        (minute || 0) * 60
    );
}


/* =========================================================
   SORT
========================================================= */

function sortItems(items) {

    return [
        ...(items || [])
    ]
    .sort(
        (a, b) =>
            seconds(a.time) -
            seconds(b.time)
    );
}


/* =========================================================
   RENDER
========================================================= */

function render() {

    if (!selectedDay) {
        return;
    }


    board.innerHTML = "";


    /*
     * GRID VARIABLES
     */

    board.style.setProperty(
        "--grid-color",
        scheduleData.global.gridColor
    );


    board.style.setProperty(
        "--grid-thickness",
        `${scheduleData.global.gridThickness}px`
    );


    /*
     * LEFT SPACE FOR POINTER
     */

    board.style.setProperty(
        "--pointer-space",
        `${scheduleData.pointer.size + 16}px`
    );


    /*
     * GRID MODE
     */

    applyGrid();


    /*
     * TASKS
     */

    const items =
        sortItems(
            scheduleData.days[
                selectedDay
            ]
        );


    if (!items.length) {

        emptyState.style.display =
            "block";

        board.appendChild(
            emptyState
        );

    }

    else {

        emptyState.style.display =
            "none";


        items.forEach(
            createScheduleRow
        );

    }


    /*
     * POINTER
     */

    renderPointer();
}


/* =========================================================
   CREATE ROW
========================================================= */

function createScheduleRow(item) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "schedule-row";


    row.dataset.time =
        item.time;


    /*
     * TIME
     */

    row.style.setProperty(
        "--time-color",
        item.timeColor
    );


    row.style.setProperty(
        "--time-size",
        `${Number(
            item.timeSize
        )}px`
    );


    row.style.setProperty(
        "--time-weight",
        Number(
            item.timeWeight
        )
    );


    /*
     * TEXT
     */

    row.style.setProperty(
        "--task-color",
        item.color
    );


    row.style.setProperty(
        "--task-size",
        `${Number(
            item.fontSize
        )}px`
    );


    row.style.setProperty(
        "--task-font",
        item.fontFamily
    );


    row.style.setProperty(
        "--task-weight",
        Number(
            item.fontWeight
        )
    );


    /*
     * TIME ELEMENT
     */

    const time =
        document.createElement(
            "div"
        );


    time.className =
        "schedule-time";


    time.textContent =
        item.time;


    /*
     * TEXT ELEMENT
     */

    const task =
        document.createElement(
            "div"
        );


    task.className =
        "schedule-task";


    task.textContent =
        item.text || "";


    /*
     * TEXT GRADIENT
     *
     * Это градиент ТОЛЬКО текста.
     */

    if (
        item.gradient === true
    ) {

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


        task.style.webkitBackgroundClip =
            "initial";


        task.style.backgroundClip =
            "initial";


        task.style.webkitTextFillColor =
            item.color;


        task.style.color =
            item.color;

    }


    row.append(
        time,
        task
    );


    board.appendChild(
        row
    );
}


/* =========================================================
   GRID
========================================================= */

function applyGrid() {

    board.classList.remove(
        "grid-rows",
        "grid-grid",
        "grid-none"
    );


    const mode =
        scheduleData.global.gridMode;


    /*
     * ROWS
     *
     * Только горизонтальные линии.
     */

    if (
        mode === "rows"
    ) {

        board.classList.add(
            "grid-rows"
        );

        return;
    }


    /*
     * GRID
     *
     * Горизонтальные линии +
     * ОДНА вертикальная линия
     * между TIME и TEXT.
     */

    if (
        mode === "grid"
    ) {

        board.classList.add(
            "grid-grid"
        );

        return;
    }


    /*
     * NONE
     */

    board.classList.add(
        "grid-none"
    );
}


/* =========================================================
   POINTER
========================================================= */

function renderPointer() {

    if (!pointer) {
        return;
    }


    const icon =
        Math.max(
            1,
            Math.min(
                10,
                Number(
                    scheduleData.pointer.icon
                ) || 1
            )
        );


    const size =
        Math.max(
            10,
            Math.min(
                70,
                Number(
                    scheduleData.pointer.size
                ) || 28
            )
        );


    const color =
        scheduleData.pointer.color ||
        "#111111";


    /*
     * Убираем старый gradient.
     */

    pointer.classList.remove(
        "gradient"
    );


    pointer.style.removeProperty(
        "--pointer-gradient"
    );


    /*
     * Сам pointer.
     */

    pointer.style.width =
        `${size}px`;

    pointer.style.height =
        `${size}px`;


    pointer.style.background =
        "none";

    pointer.style.backgroundImage =
        "none";


    pointer.style.color =
        "transparent";


    pointer.style.fontSize =
        "0";


    pointer.style.filter =
        "none";


    /*
     * Используем MASK.
     *
     * Иконка:
     * icons/1.png ...
     * icons/10.png
     */

    pointer.style.webkitMaskImage =
        `url("icons/${icon}.png")`;

    pointer.style.maskImage =
        `url("icons/${icon}.png")`;


    pointer.style.webkitMaskRepeat =
        "no-repeat";

    pointer.style.maskRepeat =
        "no-repeat";


    pointer.style.webkitMaskPosition =
        "center";

    pointer.style.maskPosition =
        "center";


    pointer.style.webkitMaskSize =
        "contain";

    pointer.style.maskSize =
        "contain";


    /*
     * Цвет выбранный в EDITOR.
     */

    pointer.style.backgroundColor =
        color;


    /*
     * pointerSymbol вообще не нужен.
     */

    if (pointerSymbol) {

        pointerSymbol.textContent =
            "";

        pointerSymbol.style.display =
            "none";

    }


    updatePointerPosition();
}


/* =========================================================
   POINTER POSITION
========================================================= */

function updatePointerPosition() {

    if (!pointer) {
        return;
    }


    /*
     * Pointer показывается
     * только для сегодняшнего дня.
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


    const nowSeconds =
        now.hour * 3600 +
        now.minute * 60 +
        now.second;


    /*
     * Ближайшая задача.
     */

    let nearest = null;

    let difference =
        Infinity;


    items.forEach(item => {

        const currentDifference =
            Math.abs(
                seconds(item.time) -
                nowSeconds
            );


        if (
            currentDifference <
            difference
        ) {

            difference =
                currentDifference;

            nearest =
                item;

        }

    });


    if (!nearest) {

        pointer.style.display =
            "none";

        return;
    }


    /*
     * Ищем строку.
     */

    let targetRow = null;


    board
        .querySelectorAll(
            ".schedule-row"
        )
        .forEach(row => {

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


    /*
     * КЛЮЧЕВОЙ МОМЕНТ:
     *
     * pointer находится внутри
     * .schedule, поэтому координаты
     * считаем относительно .schedule,
     * а не board.
     */

    const rowRect =
        targetRow.getBoundingClientRect();


    const scheduleRect =
        schedule.getBoundingClientRect();


    /*
     * Y с учетом scrollTop.
     */

    const y =
        rowRect.top -
        scheduleRect.top +
        schedule.scrollTop +
        (
            rowRect.height /
            2
        );


    /*
     * X:
     *
     * board находится внутри schedule.
     * Ставим pointer в левую область
     * board.
     */

    const boardRect =
        board.getBoundingClientRect();


    const pointerSize =
        Number(
            scheduleData.pointer.size
        ) || 28;


    const x =
        boardRect.left -
        scheduleRect.left -
        pointerSize -
        7;


    pointer.style.left =
        `${Math.max(
            2,
            x
        )}px`;


    pointer.style.top =
        `${y}px`;


    pointer.style.display =
        "block";
}


/* =========================================================
   DAY UI
========================================================= */

function updateDayUI() {

    const today =
        getAlmatyDay();


    /*
     * Верхний старый DAY/TIME
     * полностью убираем.
     */

    if (dayName) {

        dayName.textContent =
            "";

        dayName.style.display =
            "none";

    }


    if (currentTime) {

        currentTime.textContent =
            "";

        currentTime.style.display =
            "none";

    }


    if (selectedDayLabel) {

        selectedDayLabel.textContent =
            selectedDay === today
                ? "TODAY"
                : SHORT[selectedDay];

    }


    if (selectedDayName) {

        selectedDayName.textContent =
            selectedDay;

    }


    dayButtons.forEach(
        button => {

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

        }
    );
}


/* =========================================================
   SELECT DAY
========================================================= */

function selectDay(day) {

    selectedDay =
        day;


    updateDayUI();

    render();
}


/* =========================================================
   CLOCK
========================================================= */

function updateClock() {

    if (currentTime) {

        currentTime.textContent =
            "";

        currentTime.style.display =
            "none";

    }
}


/* =========================================================
   DAY EVENTS
========================================================= */

if (prevDay) {

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
}


if (nextDay) {

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
}


if (selectedDayButton) {

    selectedDayButton.addEventListener(
        "click",
        () => {

            selectDay(
                getAlmatyDay()
            );

        }
    );
}


dayButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                selectDay(
                    button.dataset.day
                );

            }
        );

    }
);


/* =========================================================
   SWIPE
========================================================= */

let startX = 0;
let startY = 0;


schedule.addEventListener(
    "touchstart",
    event => {

        startX =
            event.changedTouches[0]
                .screenX;

        startY =
            event.changedTouches[0]
                .screenY;

    },
    {
        passive: true
    }
);


schedule.addEventListener(
    "touchend",
    event => {

        const endX =
            event.changedTouches[0]
                .screenX;

        const endY =
            event.changedTouches[0]
                .screenY;


        const dx =
            endX -
            startX;

        const dy =
            endY -
            startY;


        if (
            Math.abs(dx) < 60 ||
            Math.abs(dx) <=
            Math.abs(dy)
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

        } else {

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


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        requestAnimationFrame(
            updatePointerPosition
        );

    }
);


/* =========================================================
   ORIENTATION
========================================================= */

window.addEventListener(
    "orientationchange",
    () => {

        setTimeout(
            () => {

                render();

            },
            250
        );

    }
);


/* =========================================================
   START
========================================================= */

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

            updatePointerPosition();

        },
        1000
    );
}


start();
