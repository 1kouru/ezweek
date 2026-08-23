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


/* =========================================================
   DEFAULT TASK
========================================================= */

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
   LOAD SCHEDULE
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

    }

    else {

        scheduleData =
            defaultSchedule();

        await saveSchedule();

    }

}


/* =========================================================
   NORMALIZE
========================================================= */

function normalizeSchedule(input) {

    const base =
        defaultSchedule();


    const source =
        input || {};


    /*
     * Основная структура.
     */

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
     * Поддержка старых версий,
     * если в базе остались старые поля.
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


    DAYS.forEach(day => {

        if (
            !Array.isArray(
                result.days[day]
            )
        ) {

            result.days[day] = [];

        }


        result.days[day] =
            result.days[day].map(task => {

                return {

                    ...defaultTask(),

                    ...task

                };

            });

    });


    /*
     * editor.js использует только:
     *
     * rows
     * grid
     * none
     */

    const allowedModes = [
        "rows",
        "grid",
        "none"
    ];


    if (
        !allowedModes.includes(
            result.global.gridMode
        )
    ) {

        result.global.gridMode =
            "rows";

    }


    /*
     * Толщина.
     */

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


    /*
     * Цвет.
     */

    if (
        typeof result.global.gridColor !==
        "string"
    ) {

        result.global.gridColor =
            "#E8E8E8";

    }


    /*
     * Pointer.
     *
     * В текущем editor.js градиента pointer
     * НЕТ вообще.
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
                    part.type ===
                    "hour"
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
                        part.type ===
                        "minute"
                )?.value || 0
            ),

        second:
            Number(
                parts.find(
                    part =>
                        part.type ===
                        "second"
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
        hours,
        minutes
    ] =
        String(
            time || "00:00"
        )
        .split(":")
        .map(Number);


    return (
        (hours || 0) * 3600 +
        (minutes || 0) * 60
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


    /*
     * Сохраняем emptyState,
     * потому что board.innerHTML потом будет очищен.
     */

    board.innerHTML = "";


    /*
     * GRID CSS VARIABLES
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
     * Pointer space.
     *
     * ВАЖНО:
     * чем больше pointer, тем сильнее
     * сдвигается содержимое таблицы вправо.
     */

    const pointerSize =
        scheduleData.pointer.size;


    board.style.setProperty(
        "--pointer-space",
        `${pointerSize + 18}px`
    );


    /*
     * GRID STYLE
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
            item => {

                createScheduleRow(
                    item
                );

            }
        );

    }


    /*
     * POINTER
     */

    renderPointer();

}


/* =========================================================
   CREATE SCHEDULE ROW
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
     * TIME CSS VARIABLES
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


    /*
     * TEXT CSS VARIABLES
     */

    row.style.setProperty(
        "--task-color",
        item.color
    );


    row.style.setProperty(
        "--task-size",
        `${item.fontSize}px`
    );


    row.style.setProperty(
        "--task-font",
        item.fontFamily
    );


    row.style.setProperty(
        "--task-weight",
        item.fontWeight
    );


    /*
     * TIME
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
     * TEXT
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
     * Берём его именно из editor.js.
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


        task.style.webkitBackgroundClip =
            "initial";


        task.style.backgroundClip =
            "initial";


        task.style.webkitTextFillColor =
            item.color;


        task.style.color =
            item.color;

    }


    /*
     * Время.
     *
     * У текущего editor.js для времени
     * есть только:
     *
     * color
     * size
     * weight
     */

    time.style.color =
        item.timeColor;


    time.style.fontSize =
        `${item.timeSize}px`;


    time.style.fontWeight =
        item.timeWeight;


    /*
     * Текст.
     *
     * Все параметры приходят
     * прямо из editor.js.
     */

    task.style.color =
        item.gradient
            ? "transparent"
            : item.color;


    task.style.fontSize =
        `${item.fontSize}px`;


    task.style.fontFamily =
        item.fontFamily;


    task.style.fontWeight =
        item.fontWeight;


    /*
     * Добавляем.
     */

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


    if (mode === "rows") {

        board.classList.add(
            "grid-rows"
        );

        return;

    }


    if (mode === "grid") {

        board.classList.add(
            "grid-grid"
        );

        return;

    }


    board.classList.add(
        "grid-none"
    );

}


/* =========================================================
   POINTER
========================================================= */

function renderPointer() {

    /*
     * Сначала полностью очищаем
     * старые стили.
     */

    pointer.classList.remove(
        "gradient"
    );


    pointer.style.background =
        "transparent";


    pointer.style.backgroundImage =
        "none";


    pointer.style.color =
        "transparent";


    pointer.style.fontSize =
        "0";


    pointer.style.display =
        "none";


    /*
     * Устанавливаем размер.
     */

    const size =
        scheduleData.pointer.size;


    pointer.style.width =
        `${size}px`;


    pointer.style.height =
        `${size}px`;


    pointerSymbol.innerHTML =
        "";


    pointerSymbol.style.width =
        `${size}px`;


    pointerSymbol.style.height =
        `${size}px`;


    /*
     * НОВЫЙ СПОСОБ КРАСКИ:
     *
     * PNG превращается в mask.
     *
     * Благодаря этому:
     * - никакого filter;
     * - никакого градиента;
     * - любой HEX цвет работает;
     * - Safari/iPhone работает стабильнее.
     */

    const icon =
        Number(
            scheduleData.pointer.icon
        ) || 1;


    const iconUrl =
        `url("icons/${icon}.png")`;


    pointerSymbol.style.background =
        scheduleData.pointer.color;


    pointerSymbol.style.backgroundImage =
        "none";


    pointerSymbol.style.webkitMaskImage =
        iconUrl;


    pointerSymbol.style.maskImage =
        iconUrl;


    pointerSymbol.style.webkitMaskRepeat =
        "no-repeat";


    pointerSymbol.style.maskRepeat =
        "no-repeat";


    pointerSymbol.style.webkitMaskPosition =
        "center";


    pointerSymbol.style.maskPosition =
        "center";


    pointerSymbol.style.webkitMaskSize =
        "contain";


    pointerSymbol.style.maskSize =
        "contain";


    pointerSymbol.style.webkitTextFillColor =
        "initial";


    pointerSymbol.style.filter =
        "none";


    /*
     * Показываем только если это
     * сегодняшний день.
     */

    updatePointerPosition();

}


/* =========================================================
   POINTER POSITION
========================================================= */

function updatePointerPosition() {

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


    /*
     * Текущее время.
     */

    const now =
        getAlmatyTime();


    const currentSeconds =
        now.hour * 3600 +
        now.minute * 60 +
        now.second;


    /*
     * Ближайшая задача.
     */

    let nearest =
        null;

    let smallest =
        Infinity;


    items.forEach(item => {

        const difference =
            Math.abs(
                seconds(item.time) -
                currentSeconds
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


    if (!nearest) {

        pointer.style.display =
            "none";

        return;

    }


    /*
     * Ищем строку.
     */

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


    /*
     * Положение строки.
     */

    const rowRect =
        targetRow.getBoundingClientRect();


    const boardRect =
        board.getBoundingClientRect();


    const y =
        rowRect.top -
        boardRect.top +
        (
            rowRect.height /
            2
        );


    pointer.style.top =
        `${y}px`;


    /*
     * Pointer находится в отдельной
     * левой зоне.
     *
     * Контент таблицы сдвинут
     * через --pointer-space.
     */

    pointer.style.left =
        "calc(" +
        "var(--pointer-space) / 2" +
        " - " +
        "var(--pointer-space)" +
        ")";


    pointer.style.display =
        "flex";

}


/* =========================================================
   DAY UI
========================================================= */

function updateDayUI() {

    const today =
        getAlmatyDay();


    /*
     * Старые DAY/TIME сверху
     * больше не используем.
     */

    if (dayName) {

        dayName.textContent =
            "";

    }


    if (currentTime) {

        currentTime.textContent =
            "";

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

    /*
     * Верхнее время больше
     * вообще не показываем.
     */

    if (currentTime) {

        currentTime.textContent =
            "";

    }

}


/* =========================================================
   DAY BUTTONS
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


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        requestAnimationFrame(
            () => {

                updatePointerPosition();

            }
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
