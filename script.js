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
   DEFAULT
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

    try {

        const {
            data,
            error
        } =
            await supabase.auth.getSession();


        if (error) {
            throw error;
        }


        if (!data.session) {

            location.href =
                "auth.html";

            return null;
        }


        return data.session.user;

    }
    catch (error) {

        console.error(
            "AUTH ERROR:",
            error
        );

        return null;
    }
}


/* =========================================================
   LOAD
========================================================= */

async function loadSchedule() {

    try {

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
            throw error;
        }


        scheduleData =
            row?.data
                ? normalizeSchedule(row.data)
                : defaultSchedule();


        if (!row?.data) {
            await saveSchedule();
        }

    }
    catch (error) {

        console.error(
            "SCHEDULE LOAD ERROR:",
            error
        );

        scheduleData =
            defaultSchedule();
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
     * Old data compatibility.
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
     * Pointer.
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
     * Tasks.
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


    try {

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
            throw error;
        }


        return true;

    }
    catch (error) {

        console.error(
            "SAVE ERROR:",
            error
        );

        return false;
    }
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
        ).formatToParts(
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
        .format(new Date())
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
    ].sort(
        (a, b) =>
            seconds(a.time) -
            seconds(b.time)
    );
}


/* =========================================================
   CURRENT TASK
========================================================= */

function getCurrentTask() {

    if (
        selectedDay !==
        getAlmatyDay()
    ) {

        return null;
    }


    const items =
        sortItems(
            scheduleData.days[
                selectedDay
            ]
        );


    if (!items.length) {
        return null;
    }


    const now =
        getAlmatyTime();


    const nowSeconds =
        now.hour * 3600 +
        now.minute * 60 +
        now.second;


    let closest = null;

    let difference =
        Infinity;


    items.forEach(item => {

        const d =
            Math.abs(
                seconds(item.time) -
                nowSeconds
            );


        if (d < difference) {

            difference = d;

            closest = item;
        }

    });


    return closest;
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
     * Никаких фоновых сеток.
     */

    board.style.background =
        "transparent";

    board.style.backgroundImage =
        "none";


    board.style.setProperty(
        "--grid-color",
        scheduleData.global.gridColor
    );


    board.style.setProperty(
        "--grid-thickness",
        `${scheduleData.global.gridThickness}px`
    );


    /*
     * Динамический размер зоны
     * слева только для pointer.
     * Это НЕ padding самой таблицы.
     */

    board.style.setProperty(
        "--pointer-size",
        `${scheduleData.pointer.size}px`
    );


    applyGrid();


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
            item =>
                createRow(item)
        );
    }


    /*
     * Pointer после создания строк.
     */

    requestAnimationFrame(
        updatePointer
    );
}


/* =========================================================
   ROW
========================================================= */

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
     * TIME.
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
     * TEXT.
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
     * TIME.
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
     * TEXT.
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
     * TEXT GRADIENT.
     */

    if (
        item.gradient
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


    if (
        scheduleData.global.gridMode ===
        "grid"
    ) {

        board.classList.add(
            "grid-grid"
        );

        return;
    }


    if (
        scheduleData.global.gridMode ===
        "none"
    ) {

        board.classList.add(
            "grid-none"
        );

        return;
    }


    board.classList.add(
        "grid-rows"
    );
}


/* =========================================================
   POINTER
========================================================= */

function renderPointer() {

    if (!pointer) {
        return;
    }


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


    const color =
        scheduleData.pointer.color ||
        "#111111";


    pointer.classList.remove(
        "gradient"
    );


    pointer.style.removeProperty(
        "--pointer-gradient"
    );


    pointer.style.width =
        `${size}px`;


    pointer.style.height =
        `${size}px`;


    /*
     * PNG -> MASK.
     */

    const iconUrl =
        `url("icons/${icon}.png")`;


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


    pointer.style.backgroundColor =
        color;


    pointer.style.backgroundImage =
        "none";


    pointer.style.filter =
        "none";


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


    const current =
        getCurrentTask();


    /*
     * Убираем старую подсветку.
     */

    board
        .querySelectorAll(
            ".current-row"
        )
        .forEach(
            row =>
                row.classList.remove(
                    "current-row"
                )
        );


    if (!current) {

        pointer.style.display =
            "none";

        return;
    }


    const target =
        board.querySelector(
            `.schedule-row[data-time="${CSS.escape(
                current.time
            )}"]`
        );


    if (!target) {

        pointer.style.display =
            "none";

        return;
    }


    target.classList.add(
        "current-row"
    );


    const rowRect =
        target.getBoundingClientRect();


    const scheduleRect =
        schedule.getBoundingClientRect();


    /*
     * Pointer теперь всегда находится
     * в отдельном левом gutter.
     *
     * Поэтому ширина таблицы вообще
     * не зависит от pointer.
     */

    const y =
        rowRect.top -
        scheduleRect.top +
        schedule.scrollTop +
        rowRect.height / 2;


    /*
     * Левый gutter.

     * На iPhone pointer находится примерно
     * на 16px от края экрана.
     */

    const x =
        16 +
        (
            Math.max(
                0,
                70 -
                Number(
                    scheduleData.pointer.size
                )
            ) / 2
        );


    pointer.style.left =
        `${x}px`;


    pointer.style.top =
        `${y}px`;


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
     * Старый текст DAY/TIME удаляем.
     */

    if (dayName) {

        dayName.style.display =
            "none";
    }


    if (currentTime) {

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

        currentTime.style.display =
            "none";
    }
}


/* =========================================================
   BUTTON EVENTS
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
            endX - startX;

        const dy =
            endY - startY;


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
   SCROLL
========================================================= */

schedule.addEventListener(
    "scroll",
    () => {

        requestAnimationFrame(
            updatePointerPosition
        );

    },
    {
        passive: true
    }
);


/* =========================================================
   RESIZE / ORIENTATION
========================================================= */

window.addEventListener(
    "resize",
    () => {

        requestAnimationFrame(
            updatePointerPosition
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
