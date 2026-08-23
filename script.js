import { supabase } from "./supabase.js";

/* =========================================
   ELEMENTS
========================================= */

const dayName = document.getElementById("dayName");
const currentTime = document.getElementById("currentTime");
const selectedDayLabel = document.getElementById("selectedDayLabel");
const selectedDayName = document.getElementById("selectedDayName");

const schedule = document.getElementById("schedule");
const board = document.getElementById("scheduleBoard");

const pointer = document.getElementById("timePointer");
const pointerSymbol = document.getElementById("pointerSymbol");
const emptyState = document.getElementById("emptyState");

const prevDay = document.getElementById("prevDay");
const nextDay = document.getElementById("nextDay");
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

            // ВАЖНО:
            // градиент pointer принудительно выключен.
            gradient: false,

            gradientStart: "#ff4ecd",
            gradientEnd: "#7c5cff"
        }
    };
}


/* =========================================
   STATE
========================================= */

let scheduleData = defaultSchedule();
let selectedDay = null;
let user = null;


/* =========================================
   AUTH
========================================= */

async function loadUser() {

    const {
        data,
        error
    } = await supabase.auth.getSession();

    if (error || !data.session) {

        window.location.href = "auth.html";

        return null;
    }

    return data.session.user;
}


/* =========================================
   LOAD
========================================= */

async function loadSchedule() {

    const {
        data,
        error
    } = await supabase
        .from("schedules")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {

        console.error(
            "SCHEDULE LOAD ERROR:",
            error
        );

        return;
    }

    if (data?.data) {

        scheduleData =
            normalizeSchedule(data.data);

    } else {

        scheduleData =
            defaultSchedule();

        await saveSchedule();
    }
}


/* =========================================
   NORMALIZE
========================================= */

function normalizeSchedule(input) {

    const base = defaultSchedule();

    const result = {
        ...base,
        ...input,

        global: {
            ...base.global,
            ...(input?.global || {})
        },

        pointer: {
            ...base.pointer,
            ...(input?.pointer || {})
        },

        days: {
            ...base.days,
            ...(input?.days || {})
        }
    };


    /*
     * editor.js использует gridType.
     *
     * Старые версии могли сохранять grid.
     * Поддерживаем оба варианта.
     */

    if (
        input?.global?.gridType
    ) {

        result.global.gridType =
            input.global.gridType;

    } else if (
        input?.global?.grid
    ) {

        result.global.gridType =
            input.global.grid;

    }


    /*
     * Pointer.
     *
     * editor.js хранит icon.
     */

    if (
        input?.pointer?.icon !== undefined
    ) {

        result.pointer.icon =
            Number(input.pointer.icon);

    }


    /*
     * Градиент pointer НЕ используем.
     */

    result.pointer.gradient = false;


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

                    id:
                        task.id ||
                        crypto.randomUUID(),

                    time:
                        task.time ||
                        "08:00",

                    text:
                        task.text ||
                        "",


                    /*
                     * TIME
                     */

                    timeColor:
                        task.timeColor ||
                        "#999999",

                    timeSize:
                        Number(
                            task.timeSize ??
                            11
                        ),

                    timeWeight:
                        Number(
                            task.timeWeight ??
                            600
                        ),


                    /*
                     * TEXT
                     */

                    color:
                        task.color ||
                        "#111111",

                    fontSize:
                        Number(
                            task.fontSize ??
                            15
                        ),

                    fontFamily:
                        task.fontFamily ||
                        "Arial",

                    fontWeight:
                        Number(
                            task.fontWeight ??
                            500
                        ),


                    /*
                     * TEXT GRADIENT
                     */

                    gradient:
                        Boolean(
                            task.gradient
                        ),

                    gradientStart:
                        task.gradientStart ||
                        "#ff4ecd",

                    gradientEnd:
                        task.gradientEnd ||
                        "#7c5cff",


                    /*
                     * TIME BACKGROUND
                     */

                    timeBackground:
                        task.timeBackground ||
                        "transparent",

                    timeRadius:
                        Number(
                            task.timeRadius ??
                            10
                        ),

                    timePadding:
                        Number(
                            task.timePadding ??
                            7
                        ),


                    /*
                     * старые поля тоже сохраняем,
                     * чтобы ничего не ломалось
                     */

                    background:
                        task.background,

                    radius:
                        task.radius,

                    padding:
                        task.padding
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
    } = await supabase
        .from("schedules")
        .upsert(
            {
                user_id: user.id,

                data: scheduleData,

                updated_at:
                    new Date().toISOString()
            },
            {
                onConflict: "user_id"
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
                timeZone: "Asia/Almaty",

                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",

                hour12: false
            }
        ).formatToParts(new Date());


    let hour =
        Number(
            parts.find(
                p => p.type === "hour"
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
                    p => p.type === "minute"
                )?.value || 0
            ),

        second:
            Number(
                parts.find(
                    p => p.type === "second"
                )?.value || 0
            )
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
        .format(new Date())
        .toUpperCase();
}


function seconds(time) {

    const [
        h,
        m
    ] = String(time)
        .split(":")
        .map(Number);

    return h * 3600 + m * 60;
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
     * GRID VARIABLES
     */

    board.style.setProperty(
        "--grid-color",
        scheduleData.global.gridColor ||
        "#e8e8e8"
    );


    board.style.setProperty(
        "--grid-thickness",
        `${Number(
            scheduleData.global.gridThickness ?? 1
        )}px`
    );


    /*
     * GRID TYPE
     */

    renderGridStyle();


    const items =
        sortItems(
            scheduleData.days[selectedDay] || []
        );


    if (!items.length) {

        board.appendChild(emptyState);

        emptyState.style.display =
            "block";

    } else {

        emptyState.style.display =
            "none";


        items.forEach(item => {

            const row =
                document.createElement("div");

            row.className =
                "schedule-row";

            row.dataset.time =
                item.time;


            /*
             * TIME
             */

            row.style.setProperty(
                "--time-color",
                item.timeColor || "#999999"
            );

            row.style.setProperty(
                "--time-size",
                `${Number(
                    item.timeSize ?? 11
                )}px`
            );

            row.style.setProperty(
                "--time-weight",
                String(
                    Number(
                        item.timeWeight ?? 600
                    )
                )
            );


            /*
             * TEXT
             */

            row.style.setProperty(
                "--task-size",
                `${Number(
                    item.fontSize ?? 15
                )}px`
            );

            row.style.setProperty(
                "--task-color",
                item.color || "#111111"
            );

            row.style.setProperty(
                "--task-weight",
                String(
                    Number(
                        item.fontWeight ?? 500
                    )
                )
            );

            row.style.setProperty(
                "--task-font",
                item.fontFamily ||
                "Arial"
            );


            /*
             * TEXT BACKGROUND
             */

            row.style.setProperty(
                "--task-background",
                "transparent"
            );


            /*
             * TIME BOX
             */

            row.style.setProperty(
                "--time-radius",
                `${Number(
                    item.timeRadius ?? 10
                )}px`
            );

            row.style.setProperty(
                "--time-padding",
                `${Number(
                    item.timePadding ?? 7
                )}px`
            );


            /*
             * TASK
             */

            const time =
                document.createElement("div");

            time.className =
                "schedule-time";

            time.textContent =
                item.time;


            const task =
                document.createElement("div");

            task.className =
                "schedule-task";

            task.textContent =
                item.text || "";


            /*
             * TEXT COLOR / GRADIENT
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

            } else {

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


            /*
             * TIME BACKGROUND
             */

            const timeBackground =
                item.timeBackground;


            if (
                timeBackground &&
                timeBackground !==
                "transparent"
            ) {

                time.style.background =
                    timeBackground;

            } else {

                time.style.background =
                    "transparent";
            }


            row.appendChild(time);
            row.appendChild(task);

            board.appendChild(row);

        });

    }


    renderPointerStyle();

    updatePointer();
}


/* =========================================
   GRID
========================================= */

function renderGridStyle() {

    board.classList.remove(
        "grid-rows",
        "grid-dots",
        "grid-double",
        "grid-soft",
        "grid-wave",
        "grid-none"
    );


    const type =
        scheduleData.global.gridType ||
        "rows";


    switch (type) {

        case "rows":

            board.classList.add(
                "grid-rows"
            );

            break;


        case "dots":

            board.classList.add(
                "grid-dots"
            );

            break;


        case "double":

            board.classList.add(
                "grid-double"
            );

            break;


        case "soft":

            board.classList.add(
                "grid-soft"
            );

            break;


        case "wave":

            board.classList.add(
                "grid-wave"
            );

            break;


        case "none":

            board.classList.add(
                "grid-none"
            );

            break;


        case "clean":

            board.classList.add(
                "grid-none"
            );

            break;


        default:

            board.classList.add(
                "grid-rows"
            );

            break;
    }
}


/* =========================================
   POINTER
========================================= */

function renderPointerStyle() {

    const p =
        scheduleData.pointer || {};


    /*
     * ICON
     */

    const icon =
        Number(p.icon || 1);


    pointerSymbol.innerHTML = "";


    const img =
        document.createElement("img");


    img.src =
        `icons/${icon}.png`;


    img.alt = "";


    img.draggable = false;


    img.onerror = () => {

        pointerSymbol.textContent =
            "▶";
    };


    pointerSymbol.appendChild(img);


    /*
     * SIZE
     */

    pointerSymbol.style.width =
        `${Number(p.size || 28)}px`;

    pointerSymbol.style.height =
        `${Number(p.size || 28)}px`;


    /*
     * ВАЖНО:
     *
     * pointer НЕ использует gradient.
     *
     * Никакого .gradient.
     * Никакого background-clip.
     * Никакого pointer-gradient.
     */


    pointer.classList.remove(
        "gradient"
    );


    pointer.style.removeProperty(
        "--pointer-gradient"
    );


    pointer.style.color =
        p.color ||
        "#111111";


    /*
     * Красим PNG через CSS filter.
     * Сам PNG должен быть чёрным/монохромным.
     */

    pointerSymbol.style.filter =
        colorToFilter(
            p.color || "#111111"
        );
}


/* =========================================
   POINTER COLOR FILTER
========================================= */

function colorToFilter(hex) {

    if (!hex) {
        return "none";
    }


    hex =
        String(hex)
            .replace("#", "");


    if (hex.length !== 6) {
        return "none";
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
     * Точная окраска через
     * brightness/saturate + RGB
     * невозможна одним простым filter.
     *
     * Поэтому для нормальной работы
     * используем CSS mask ниже.
     */

    return `
        brightness(0)
        saturate(100%)
        invert(100%)
        sepia(100%)
        saturate(1000%)
        hue-rotate(0deg)
        brightness(100%)
    `;
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
            scheduleData.days[selectedDay] || []
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
     * Ищем ближайшее время.
     */

    let nearest = null;
    let smallest = Infinity;


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
        board.getBoundingClientRect();


    /*
     * Pointer ставим по центру строки.
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
     * Старые верхние DAY/TIME
     * больше не используем.
     */

    if (dayName) {
        dayName.textContent = "";
    }


    if (currentTime) {
        currentTime.textContent = "";
    }


    if (selectedDayName) {

        selectedDayName.textContent =
            selectedDay;
    }


    if (selectedDayLabel) {

        selectedDayLabel.textContent =
            selectedDay === today
                ? "TODAY"
                : SHORT[selectedDay];
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
        currentTime.textContent = "";
    }
}


/* =========================================
   DAY EVENTS
========================================= */

if (prevDay) {

    prevDay.addEventListener(
        "click",
        () => {

            const index =
                DAYS.indexOf(selectedDay);

            selectDay(
                DAYS[
                    (index - 1 + 7) % 7
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
                DAYS.indexOf(selectedDay);

            selectDay(
                DAYS[
                    (index + 1) % 7
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
            e.changedTouches[0].screenX;

        startY =
            e.changedTouches[0].screenY;
    },
    {
        passive: true
    }
);


schedule.addEventListener(
    "touchend",
    e => {

        const endX =
            e.changedTouches[0].screenX;

        const endY =
            e.changedTouches[0].screenY;


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
            DAYS.indexOf(selectedDay);


        if (dx < 0) {

            selectDay(
                DAYS[
                    (index + 1) % 7
                ]
            );

        } else {

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
    () => {

        requestAnimationFrame(
            updatePointer
        );

    }
);


/* =========================================
   ORIENTATION
========================================= */

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
