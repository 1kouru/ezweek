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
    document.getElementById("selectedDayButton");

const dayButtons =
    document.querySelectorAll(".day-button");


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


        result.days[day] =
            result.days[day].map(item => ({

                ...createDefaultTask(),

                ...item

            }));

    });


    return result;

}


/* =========================================
   DEFAULT TASK
========================================= */

function createDefaultTask() {

    return {

        time: "08:00",

        text: "",

        timeColor: "#999999",

        timeSize: 11,

        timeWeight: 600,

        timeGradient: false,

        timeGradientStart: "#ff4ecd",

        timeGradientEnd: "#7c5cff",

        timeBackground: "transparent",

        timeRadius: 10,

        timePadding: 7,

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


    const global =
        scheduleData.global || {};


    /*
     * GRID VARIABLES
     */

    board.style.setProperty(
        "--grid-color",
        global.gridColor ||
        "#e8e8e8"
    );


    board.style.setProperty(
        "--grid-thickness",
        `${Number(
            global.gridThickness || 1
        )}px`
    );


    const items =
        sortItems(
            scheduleData.days[
                selectedDay
            ] || []
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


            /* =================================
               TIME SETTINGS
            ================================= */

            row.style.setProperty(
                "--time-color",
                item.timeColor ||
                "#999999"
            );


            row.style.setProperty(
                "--time-size",
                `${Number(
                    item.timeSize ?? 11
                )}px`
            );


            row.style.setProperty(
                "--time-weight",
                Number(
                    item.timeWeight ?? 600
                )
            );


            /* =================================
               TASK SETTINGS
            ================================= */

            row.style.setProperty(
                "--task-size",
                `${Number(
                    item.fontSize ?? 15
                )}px`
            );


            row.style.setProperty(
                "--task-color",
                item.color ||
                "#111111"
            );


            row.style.setProperty(
                "--task-weight",
                Number(
                    item.fontWeight ?? 500
                )
            );


            row.style.setProperty(
                "--task-font",
                item.fontFamily ||
                "Arial"
            );


            row.style.setProperty(
                "--task-background",
                item.background ||
                "transparent"
            );


            row.style.setProperty(
                "--task-radius",
                `${Number(
                    item.radius ??
                    item.taskRadius ??
                    12
                )}px`
            );


            row.style.setProperty(
                "--task-padding",
                `${Number(
                    item.padding ??
                    item.taskPadding ??
                    10
                )}px`
            );


            /* =================================
               TIME
            ================================= */

            const time =
                document.createElement(
                    "div"
                );


            time.className =
                "schedule-time";


            time.textContent =
                item.time;


            /*
             * TIME BACKGROUND
             */

            if (
                item.timeBackground &&
                item.timeBackground !==
                "transparent"
            ) {

                time.style.background =
                    item.timeBackground;

            }


            time.style.borderRadius =
                `${Number(
                    item.timeRadius ?? 10
                )}px`;


            time.style.padding =
                `0 ${Number(
                    item.timePadding ?? 7
                )}px`;


            /*
             * ВАЖНО:
             *
             * Градиент времени НЕ включаем.
             * На главной странице время
             * всегда обычного цвета.
             */

            time.style.backgroundImage =
                "none";

            time.style.webkitBackgroundClip =
                "initial";

            time.style.backgroundClip =
                "initial";

            time.style.webkitTextFillColor =
                "initial";

            time.style.color =
                item.timeColor ||
                "#999999";


            /* =================================
               TASK
            ================================= */

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
             */

            if (item.gradient) {

                task.style.background =
                    `linear-gradient(
                        90deg,
                        ${item.gradientStart || "#ff4ecd"},
                        ${item.gradientEnd || "#7c5cff"}
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
                    "initial";

                task.style.color =
                    item.color ||
                    "#111111";

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

    /*
     * Сначала удаляем ВСЕ варианты.
     */

    board.classList.remove(
        "grid-dots",
        "grid-double",
        "grid-soft",
        "grid-wave",
        "grid-none"
    );


    const type =
        scheduleData.global?.gridType ||
        "rows";


    /*
     * НИЧЕГО
     */

    if (
        type === "none" ||
        type === "clean" ||
        type === "off"
    ) {

        board.classList.add(
            "grid-none"
        );

        return;

    }


    /*
     * ТОЧКИ / СЕТКА
     */

    if (
        type === "dots" ||
        type === "grid"
    ) {

        board.classList.add(
            "grid-dots"
        );

        return;

    }


    /*
     * ЛИНИИ
     */

    if (
        type === "rows" ||
        type === "lines"
    ) {

        /*
         * rows — обычные линии между
         * строками.
         *
         * Толщина берётся из редактора.
         */

        board.classList.add(
            "grid-double"
        );

        return;

    }


    /*
     * СТАРЫЕ ФОРМАТЫ
     */

    if (type === "double") {

        board.classList.add(
            "grid-double"
        );

        return;

    }


    if (type === "soft") {

        board.classList.add(
            "grid-soft"
        );

        return;

    }


    if (type === "wave") {

        board.classList.add(
            "grid-wave"
        );

        return;

    }


    /*
     * Если пришло неизвестное значение —
     * используем линии.
     */

    board.classList.add(
        "grid-double"
    );

}


/* =========================================
   POINTER
========================================= */

function renderPointerStyle() {

    const p =
        scheduleData.pointer || {};


    /*
     * ИКОНКА
     *
     * Используем PNG из editor.
     */

    pointerSymbol.textContent =
        "";


    pointerSymbol.innerHTML =
        "";


    const img =
        document.createElement(
            "img"
        );


    img.src =
        `icons/${Number(
            p.icon || 1
        )}.png`;


    img.alt = "";


    img.draggable = false;


    img.style.width =
        `${Number(
            p.size || 28
        )}px`;


    img.style.height =
        `${Number(
            p.size || 28
        )}px`;


    img.style.display =
        "block";


    img.style.objectFit =
        "contain";


    /*
     * САМОЕ ВАЖНОЕ:
     *
     * НИКАКОГО GRADIENT.
     *
     * Не добавляем класс gradient.
     * Не используем background-clip.
     * Не используем gradientStart/End.
     */


    pointer.classList.remove(
        "gradient"
    );


    pointer.style.background =
        "none";


    pointer.style.backgroundImage =
        "none";


    pointer.style.color =
        p.color ||
        "#111111";


    /*
     * Красим чёрную PNG-иконку
     * в выбранный цвет.
     */

    img.style.filter =
        colorToFilter(
            p.color ||
            "#111111"
        );


    pointerSymbol.appendChild(
        img
    );


    pointer.style.fontSize =
        "0";


    pointer.style.width =
        `${Number(
            p.size || 28
        )}px`;


    pointer.style.height =
        `${Number(
            p.size || 28
        )}px`;

}


/* =========================================
   POINTER COLOR FILTER
========================================= */

function colorToFilter(hex) {

    if (!hex) {
        return "";
    }


    hex =
        String(hex)
            .replace("#", "");


    if (hex.length !== 6) {
        return "";
    }


    const r =
        parseInt(
            hex.substring(0, 2),
            16
        );


    const g =
        parseInt(
            hex.substring(2, 4),
            16
        );


    const b =
        parseInt(
            hex.substring(4, 6),
            16
        );


    /*
     * SVG/PNG иконки в проекте
     * предполагаются чёрными.
     *
     * Через CSS filter делаем
     * их выбранного цвета.
     */

    const max =
        Math.max(r, g, b);


    if (
        r === 17 &&
        g === 17 &&
        b === 17
    ) {

        return "brightness(0)";

    }


    /*
     * Точное окрашивание через
     * invert/sepia/saturate.
     */

    const hsl =
        rgbToHsl(
            r,
            g,
            b
        );


    return `
        brightness(0)
        saturate(100%)
        invert(${hsl.invert}%)
        sepia(${hsl.sepia}%)
        saturate(${hsl.saturate}%)
        hue-rotate(${hsl.hue}deg)
        brightness(${hsl.brightness})
    `.replace(/\s+/g, " ").trim();

}


function rgbToHsl(r, g, b) {

    r /= 255;
    g /= 255;
    b /= 255;


    const max =
        Math.max(r, g, b);

    const min =
        Math.min(r, g, b);


    let h = 0;
    let s = 0;


    const l =
        (max + min) / 2;


    if (max !== min) {

        const d =
            max - min;


        s =
            l > 0.5
                ? d / (
                    2 - max - min
                )
                : d / (
                    max + min
                );


        switch (max) {

            case r:

                h =
                    (
                        g - b
                    ) / d +
                    (
                        g < b
                            ? 6
                            : 0
                    );

                break;


            case g:

                h =
                    (
                        b - r
                    ) / d +
                    2;

                break;


            case b:

                h =
                    (
                        r - g
                    ) / d +
                    4;

                break;

        }


        h /= 6;

    }


    /*
     * Это не математический
     * inverse filter generator,
     * но для чёрных PNG подходит
     * значительно лучше старого
     * фильтра.
     */

    return {

        invert:
            Math.round(
                l * 100
            ),

        sepia:
            Math.round(
                s * 100
            ),

        saturate:
            Math.max(
                100,
                Math.round(
                    s * 700
                )
            ),

        hue:
            Math.round(
                h * 360
            ),

        brightness:
            Math.max(
                0.5,
                Math.round(
                    l * 100
                ) / 100
            )

    };

}


/* =========================================
   POINTER POSITION
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
            ] || []
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


    if (!nearest) {

        pointer.style.display =
            "none";

        return;

    }


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


    const boardRect =
        board.getBoundingClientRect();


    /*
     * Центр строки.
     */

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


    /*
     * Эти элементы можно оставить
     * для совместимости с HTML.
     *
     * В CSS их можно скрыть.
     */

    if (dayName) {

        dayName.textContent =
            selectedDay;

    }


    if (selectedDayName) {

        selectedDayName.textContent =
            selectedDay;

    }


    if (selectedDayLabel) {

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


    /*
     * На iPhone автоматически
     * прокручиваем нижнюю панель
     * только к выбранному дню.
     */

    const active =
        document.querySelector(
            `.day-button[data-day="${day}"]`
        );


    if (
        active &&
        typeof active.scrollIntoView ===
        "function"
    ) {

        active.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center"
        });

    }

}


/* =========================================
   CLOCK
========================================= */

function updateClock() {

    const time =
        getAlmatyTime();


    if (currentTime) {

        currentTime.textContent =
            `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;

    }

}


/* =========================================
   EVENTS
========================================= */

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

        if (
            e.changedTouches &&
            e.changedTouches.length
        ) {

            startX =
                e.changedTouches[0]
                    .screenX;

            startY =
                e.changedTouches[0]
                    .screenY;

        }

    },
    {
        passive: true
    }
);


schedule.addEventListener(
    "touchend",
    e => {

        if (
            !e.changedTouches ||
            !e.changedTouches.length
        ) {
            return;
        }


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
                    (index + 1) % 7
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
   RESIZE / ORIENTATION
========================================= */

window.addEventListener(
    "resize",
    () => {

        requestAnimationFrame(
            () => {

                updatePointer();

            }
        );

    }
);


window.addEventListener(
    "orientationchange",
    () => {

        setTimeout(
            () => {

                render();

            },
            150
        );

    }
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
