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


    /*
     * Совместимость со старыми данными.
     */

    if (
        !result.global.gridType &&
        result.global.grid
    ) {

        result.global.gridType =
            result.global.grid;

    }


    if (
        result.global.gridThickness == null
    ) {

        result.global.gridThickness = 1;

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
            result.days[day].map(item => ({

                id:
                    item.id ||
                    crypto.randomUUID(),

                time:
                    item.time ||
                    "08:00",

                text:
                    item.text ||
                    "",

                timeColor:
                    item.timeColor ||
                    "#999999",

                timeSize:
                    item.timeSize ??
                    11,

                timeWeight:
                    item.timeWeight ??
                    600,

                color:
                    item.color ||
                    "#111111",

                fontSize:
                    item.fontSize ??
                    15,

                fontFamily:
                    item.fontFamily ||
                    "Arial",

                fontWeight:
                    item.fontWeight ??
                    500,

                gradient:
                    item.gradient ??
                    false,

                gradientStart:
                    item.gradientStart ||
                    "#ff4ecd",

                gradientEnd:
                    item.gradientEnd ||
                    "#7c5cff",

                /*
                 * Настройки времени
                 */

                timeBackground:
                    item.timeBackground ||
                    "transparent",

                timeRadius:
                    item.timeRadius ??
                    10,

                timePadding:
                    item.timePadding ??
                    7,

                /*
                 * Настройки градиента времени
                 */

                timeGradient:
                    item.timeGradient ??
                    false,

                timeGradientStart:
                    item.timeGradientStart ||
                    "#ff4ecd",

                timeGradientEnd:
                    item.timeGradientEnd ||
                    "#7c5cff"

            }));

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


    /*
     * GRID
     */

    board.style.setProperty(
        "--grid-color",
        scheduleData.global.gridColor ||
        "#e8e8e8"
    );


    board.style.setProperty(
        "--grid-thickness",
        `${scheduleData.global.gridThickness ?? 1}px`
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

            createRow(item);

        });

    }


    renderGridStyle();

    renderPointerStyle();

    /*
     * Небольшая задержка нужна Safari,
     * чтобы сначала построилась таблица.
     */

    requestAnimationFrame(() => {

        updatePointer();

    });

}


/* =========================================
   CREATE ROW
========================================= */

function createRow(item) {

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

    const time =
        document.createElement(
            "div"
        );


    time.className =
        "schedule-time";


    time.textContent =
        item.time;


    time.style.color =
        item.timeColor ||
        "#999999";


    time.style.fontSize =
        `${item.timeSize ?? 11}px`;


    time.style.fontWeight =
        item.timeWeight ?? 600;


    time.style.padding =
        `0 ${item.timePadding ?? 7}px`;


    time.style.borderRadius =
        `${item.timeRadius ?? 10}px`;


    if (
        item.timeBackground &&
        item.timeBackground !==
        "transparent"
    ) {

        time.style.background =
            item.timeBackground;

    }

    else {

        time.style.background =
            "transparent";

    }


    /*
     * TIME GRADIENT
     *
     * Если в редакторе gradient выключен,
     * здесь НИКОГДА не будет градиента.
     */

    if (
        item.timeGradient === true
    ) {

        time.style.background =
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

        time.style.webkitBackgroundClip =
            "initial";

        time.style.backgroundClip =
            "initial";

        time.style.webkitTextFillColor =
            item.timeColor ||
            "#999999";

        time.style.color =
            item.timeColor ||
            "#999999";

    }


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
        item.text ||
        "TASK";


    task.style.fontFamily =
        item.fontFamily ||
        "Arial";


    task.style.fontSize =
        `${item.fontSize ?? 15}px`;


    task.style.fontWeight =
        item.fontWeight ?? 500;


    task.style.color =
        item.color ||
        "#111111";


    /*
     * TEXT GRADIENT
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

    }

    else {

        task.style.backgroundImage =
            "none";

        task.style.webkitBackgroundClip =
            "initial";

        task.style.backgroundClip =
            "initial";

        task.style.webkitTextFillColor =
            item.color ||
            "#111111";

        task.style.color =
            item.color ||
            "#111111";

    }


    /*
     * TEXT BACKGROUND
     *
     * В editor.js сейчас у текста нет
     * отдельного background,
     * поэтому прозрачный.
     */

    task.style.backgroundColor =
        "transparent";


    /*
     * Добавляем
     */

    row.appendChild(time);

    row.appendChild(task);

    board.appendChild(row);

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


    const type =
        scheduleData.global.gridType;


    /*
     * rows = обычные строки
     */

    if (
        type === "rows" ||
        type === "clean"
    ) {

        return;

    }


    if (
        type === "dots"
    ) {

        board.classList.add(
            "grid-dots"
        );

    }


    if (
        type === "double"
    ) {

        board.classList.add(
            "grid-double"
        );

    }


    if (
        type === "soft"
    ) {

        board.classList.add(
            "grid-soft"
        );

    }


    if (
        type === "wave"
    ) {

        board.classList.add(
            "grid-wave"
        );

    }


    if (
        type === "both"
    ) {

        board.classList.add(
            "grid-double"
        );

        board.classList.add(
            "grid-dots"
        );

    }

}


/* =========================================
   POINTER
========================================= */

function renderPointerStyle() {

    const p =
        scheduleData.pointer;


    const size =
        Number(p.size) || 28;


    pointer.style.width =
        `${size}px`;


    pointer.style.height =
        `${size}px`;


    pointer.style.fontSize =
        "0";


    pointer.style.color =
        "transparent";


    pointer.classList.remove(
        "gradient"
    );


    /*
     * Убираем старый текстовый символ.
     */

    if (pointerSymbol) {

        pointerSymbol.textContent =
            "";

        pointerSymbol.style.display =
            "block";

        pointerSymbol.style.width =
            "100%";

        pointerSymbol.style.height =
            "100%";

    }


    /*
     * Используем MASK.
     *
     * Это важно:
     * PNG иконки больше НЕ получают
     * старый filter и НЕ получают
     * случайный градиент.
     */

    const icon =
        Number(p.icon) || 1;


    const iconUrl =
        `url("icons/${icon}.png")`;


    pointer.style.backgroundImage =
        "none";


    pointer.style.backgroundColor =
        p.color ||
        "#111111";


    pointer.style.webkitMaskImage =
        iconUrl;

    pointer.style.maskImage =
        iconUrl;


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
     * Градиент включается ТОЛЬКО если
     * editor реально сохранил true.
     */

    if (
        p.gradient === true
    ) {

        pointer.style.backgroundImage =
            `linear-gradient(
                90deg,
                ${p.gradientStart || "#ff4ecd"},
                ${p.gradientEnd || "#7c5cff"}
            )`;

    }

}


/* =========================================
   EXACT POINTER POSITION
========================================= */

function updatePointer() {

    if (
        !pointer ||
        !schedule ||
        !board
    ) {

        return;

    }


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
     * Находим ближайшую задачу.
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


    /*
     * ВАЖНО:
     *
     * pointer теперь учитывает
     * реальный размер своей иконки.
     *
     * Он стоит слева от таблицы,
     * а не поверх времени.
     */

    const rowRect =
        targetRow.getBoundingClientRect();


    const boardRect =
        board.getBoundingClientRect();


    const pointerSize =
        Number(
            scheduleData.pointer.size
        ) || 28;


    const y =
        rowRect.top -
        boardRect.top +
        rowRect.height / 2 -
        pointerSize / 2;


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
     * Убираем верхние DAY/TIME.
     *
     * Но если старые элементы остались
     * в HTML — просто скрываем их.
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

}


/* =========================================
   CLOCK
========================================= */

function updateClock() {

    /*
     * Верхние часы больше не нужны.
     */

    if (currentTime) {

        currentTime.textContent =
            "";

        currentTime.style.display =
            "none";

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
            updatePointer
        );

    }
);


window.addEventListener(
    "orientationchange",
    () => {

        setTimeout(
            updatePointer,
            250
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
