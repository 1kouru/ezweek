import { supabase } from "./supabase.js";


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


let selectedDay = "MONDAY";

let user = null;

let data = null;

let deleteTarget = null;

let saveTimer = null;


/* =========================================
   ELEMENTS
========================================= */

const tasks =
    document.getElementById("tasks");

const preview =
    document.getElementById("preview");

const previewTasks =
    document.getElementById("previewTasks");

const previewGrid =
    document.getElementById("previewGrid");

const previewPointer =
    document.getElementById("previewPointer");

const previewDay =
    document.getElementById("previewDay");

const saveButton =
    document.getElementById("saveButton");

const saveStatus =
    document.getElementById("saveStatus");

const addTask =
    document.getElementById("addTask");

const gridButton =
    document.getElementById("gridButton");

const pointerButton =
    document.getElementById("pointerButton");

const gridPanel =
    document.getElementById("gridPanel");

const pointerPanel =
    document.getElementById("pointerPanel");

const gridColor =
    document.getElementById("gridColor");

const pointerSymbol =
    document.getElementById("pointerSymbol");

const pointerColor =
    document.getElementById("pointerColor");

const pointerSize =
    document.getElementById("pointerSize");

const pointerSizeValue =
    document.getElementById("pointerSizeValue");

const pointerGradient =
    document.getElementById("pointerGradient");

const pointerGradientStart =
    document.getElementById("pointerGradientStart");

const pointerGradientEnd =
    document.getElementById("pointerGradientEnd");

const pointerGradientOptions =
    document.getElementById(
        "pointerGradientOptions"
    );

const deleteModal =
    document.getElementById(
        "deleteModal"
    );

const deleteText =
    document.getElementById(
        "deleteText"
    );

const cancelDelete =
    document.getElementById(
        "cancelDelete"
    );

const confirmDelete =
    document.getElementById(
        "confirmDelete"
    );


/* =========================================
   DEFAULT DATA
========================================= */

function defaultData() {

    const days = {};

    DAYS.forEach(day => {

        days[day] = [];

    });


    return {

        days,

        global: {

            grid: "clean",

            gridColor: "#e8e8e8"

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
   DEFAULT TASK
========================================= */

function createDefaultTask() {

    return {

        id:
            crypto.randomUUID(),

        time:
            "08:00",

        text:
            "NEW TASK",

        color:
            "#111111",

        fontSize:
            15,

        fontFamily:
            "Arial",

        fontWeight:
            500,

        italic:
            false,

        background:
            "transparent",

        radius:
            12,

        padding:
            10,

        timeColor:
            "#999999",

        timeSize:
            11,

        timeWeight:
            600,

        gradient:
            false,

        gradientStart:
            "#ff4ecd",

        gradientEnd:
            "#7c5cff"

    };

}


/* =========================================
   AUTH
========================================= */

async function initUser() {

    const {
        data: sessionData
    } =
        await supabase.auth.getSession();


    if (
        !sessionData.session
    ) {

        window.location.href =
            "auth.html";

        return false;

    }


    user =
        sessionData.session.user;


    return true;

}


/* =========================================
   LOAD
========================================= */

async function loadData() {

    setStatus("LOADING...");


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

        console.error(error);

        setStatus("LOAD ERROR");

        alert(
            "Не удалось загрузить расписание:\n\n" +
            error.message
        );

        return false;

    }


    data =
        row?.data ||
        defaultData();


    normalize();


    setStatus("READY");

    return true;

}


/* =========================================
   NORMALIZE
========================================= */

function normalize() {

    const base =
        defaultData();


    data = {

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
                data.days[day]
            )
        ) {

            data.days[day] = [];

        }


        data.days[day] =
            data.days[day].map(task => {

                return {

                    ...createDefaultTask(),

                    ...task

                };

            });

    });

}


/* =========================================
   SAVE
========================================= */

async function save() {

    if (!user || !data) {
        return false;
    }


    setStatus("SAVING...");

    saveButton.disabled = true;


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
                        data,

                    updated_at:
                        new Date()
                            .toISOString()

                },

                {

                    onConflict:
                        "user_id"

                }

            );


    saveButton.disabled = false;


    if (error) {

        console.error(
            "SAVE ERROR:",
            error
        );

        setStatus("ERROR");

        alert(
            "Ошибка сохранения:\n\n" +
            error.message
        );

        return false;

    }


    setStatus("SAVED ✓");


    setTimeout(
        () => {

            if (
                saveStatus.textContent ===
                "SAVED ✓"
            ) {

                setStatus("READY");

            }

        },
        1600
    );


    return true;

}


/* =========================================
   AUTOSAVE
========================================= */

function queueSave() {

    setStatus("UNSAVED");


    clearTimeout(saveTimer);


    saveTimer =
        setTimeout(
            () => {

                save();

            },
            700
        );

}


/* =========================================
   STATUS
========================================= */

function setStatus(text) {

    saveStatus.textContent =
        text;

}


/* =========================================
   DAY TABS
========================================= */

document
    .querySelectorAll(
        ".day-tabs button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectedDay =
                    button.dataset.day;

                updateTabs();

                renderTasks();

                renderPreview();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    });


function updateTabs() {

    document
        .querySelectorAll(
            ".day-tabs button"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.day ===
                selectedDay
            );

        });

}


/* =========================================
   ADD TASK
========================================= */

addTask.addEventListener(
    "click",
    () => {

        const task =
            createDefaultTask();


        const dayTasks =
            data.days[
                selectedDay
            ];


        /*
         * Ищем ближайшее свободное время.
         */

        const used =
            new Set(
                dayTasks.map(
                    x => x.time
                )
            );


        let hour = 8;

        while (
            used.has(
                `${String(hour)
                    .padStart(2,"0")}:00`
            )
            &&
            hour < 24
        ) {

            hour++;

        }


        task.time =
            `${String(hour)
                .padStart(2,"0")}:00`;


        dayTasks.push(task);


        renderTasks();

        renderPreview();

        queueSave();


        /*
         * Автоматически раскрываем
         * новую задачу.
         */

        setTimeout(
            () => {

                const cards =
                    document.querySelectorAll(
                        ".task-card"
                    );

                const last =
                    cards[
                        cards.length - 1
                    ];

                if (last) {

                    last.classList.add(
                        "expanded"
                    );

                    last.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                }

            },
            50
        );

    }
);


/* =========================================
   RENDER TASKS
========================================= */

function renderTasks() {

    tasks.innerHTML = "";


    const items =
        [...data.days[selectedDay]]
        .sort(
            (a,b) =>
                a.time.localeCompare(
                    b.time
                )
        );


    if (!items.length) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "empty-state";


        empty.textContent =
            "Нажми + ADD TASK";


        tasks.appendChild(
            empty
        );

        return;

    }


    items.forEach(item => {

        tasks.appendChild(
            createTaskCard(item)
        );

    });

}


/* =========================================
   CREATE TASK CARD
========================================= */

function createTaskCard(item) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "task-card";


    /* -------------------------------------
       TOP
    -------------------------------------- */

    const top =
        document.createElement(
            "div"
        );


    top.className =
        "task-top";


    const time =
        document.createElement(
            "input"
        );


    time.type =
        "time";

    time.className =
        "time-input";

    time.value =
        item.time;


    const text =
        document.createElement(
            "input"
        );


    text.type =
        "text";

    text.className =
        "text-input";

    text.value =
        item.text;


    const remove =
        document.createElement(
            "button"
        );


    remove.type =
        "button";

    remove.className =
        "delete-task";

    remove.textContent =
        "×";


    top.append(
        time,
        text,
        remove
    );


    card.appendChild(top);


    /* -------------------------------------
       STYLE PREVIEW
    -------------------------------------- */

    const stylePreview =
        document.createElement(
            "div"
        );


    stylePreview.className =
        "task-style-preview";


    const styleTime =
        document.createElement(
            "span"
        );


    styleTime.className =
        "task-style-time";


    const styleText =
        document.createElement(
            "span"
        );


    styleText.className =
        "task-style-text";


    stylePreview.append(
        styleTime,
        styleText
    );


    card.appendChild(
        stylePreview
    );


    /* -------------------------------------
       EXPAND HINT
    -------------------------------------- */

    const expandHint =
        document.createElement(
            "div"
        );


    expandHint.className =
        "expand-hint";


    expandHint.innerHTML = `
        <span>EDIT STYLE</span>
        <span class="expand-arrow">⌄</span>
    `;


    card.appendChild(
        expandHint
    );


    /* -------------------------------------
       CONTROLS
    -------------------------------------- */

    const controls =
        document.createElement(
            "div"
        );


    controls.className =
        "task-controls";


    /*
     * TEXT COLOR
     */

    controls.appendChild(
        colorControl(
            "TEXT COLOR",
            item.color,
            value => {

                item.color =
                    value;

                refreshCard();

            }
        )
    );


    /*
     * TEXT SIZE
     */

    controls.appendChild(
        rangeControl(
            "TEXT SIZE",
            8,
            60,
            item.fontSize,
            value => {

                item.fontSize =
                    Number(value);

                refreshCard();

            }
        )
    );


    /*
     * FONT
     */

    controls.appendChild(
        selectControl(
            "FONT",
            [
                "Arial",
                "Georgia",
                "Times New Roman",
                "Courier New",
                "Trebuchet MS",
                "Verdana",
                "Impact"
            ],
            item.fontFamily,
            value => {

                item.fontFamily =
                    value;

                refreshCard();

            }
        )
    );


    /*
     * WEIGHT
     */

    controls.appendChild(
        selectControl(
            "WEIGHT",
            [
                "400",
                "500",
                "600",
                "700",
                "800",
                "900"
            ],
            String(item.fontWeight),
            value => {

                item.fontWeight =
                    Number(value);

                refreshCard();

            }
        )
    );


    /*
     * ITALIC
     */

    controls.appendChild(
        checkboxControl(
            "ITALIC",
            item.italic,
            value => {

                item.italic =
                    value;

                refreshCard();

            }
        )
    );


    /*
     * BACKGROUND
     */

    controls.appendChild(
        colorControl(
            "BACKGROUND",
            item.background ===
                "transparent"
                ? "#ffffff"
                : item.background,
            value => {

                item.background =
                    value;

                refreshCard();

            }
        )
    );


    /*
     * ROUND
     */

    controls.appendChild(
        rangeControl(
            "ROUND",
            0,
            40,
            item.radius,
            value => {

                item.radius =
                    Number(value);

                refreshCard();

            }
        )
    );


    /*
     * PADDING
     */

    controls.appendChild(
        rangeControl(
            "PADDING",
            0,
            30,
            item.padding,
            value => {

                item.padding =
                    Number(value);

                refreshCard();

            }
        )
    );


    /*
     * TIME COLOR
     */

    controls.appendChild(
        colorControl(
            "TIME COLOR",
            item.timeColor,
            value => {

                item.timeColor =
                    value;

                refreshCard();

            }
        )
    );


    /*
     * TIME SIZE
     */

    controls.appendChild(
        rangeControl(
            "TIME SIZE",
            8,
            30,
            item.timeSize,
            value => {

                item.timeSize =
                    Number(value);

                refreshCard();

            }
        )
    );


    /*
     * TIME WEIGHT
     */

    controls.appendChild(
        selectControl(
            "TIME WEIGHT",
            [
                "400",
                "500",
                "600",
                "700",
                "800"
            ],
            String(item.timeWeight),
            value => {

                item.timeWeight =
                    Number(value);

                refreshCard();

            }
        )
    );


    /*
     * TEXT GRADIENT
     */

    const gradient =
        document.createElement(
            "div"
        );


    gradient.className =
        "control";


    gradient.innerHTML = `
        <div class="control-title">
            TEXT GRADIENT
        </div>

        <div class="gradient-row">

            <label class="switch-line">

                <input
                    type="checkbox"
                    data-gradient-toggle
                >

                ON

            </label>

            <input
                type="color"
                data-gradient-start
            >

            <input
                type="color"
                data-gradient-end
            >

        </div>
    `;


    const gradientToggle =
        gradient.querySelector(
            "[data-gradient-toggle]"
        );


    const gradientStart =
        gradient.querySelector(
            "[data-gradient-start]"
        );


    const gradientEnd =
        gradient.querySelector(
            "[data-gradient-end]"
        );


    gradientToggle.checked =
        !!item.gradient;


    gradientStart.value =
        item.gradientStart;


    gradientEnd.value =
        item.gradientEnd;


    gradientToggle.addEventListener(
        "change",
        () => {

            item.gradient =
                gradientToggle.checked;

            refreshCard();

        }
    );


    gradientStart.addEventListener(
        "input",
        () => {

            item.gradientStart =
                gradientStart.value;

            refreshCard();

        }
    );


    gradientEnd.addEventListener(
        "input",
        () => {

            item.gradientEnd =
                gradientEnd.value;

            refreshCard();

        }
    );


    controls.appendChild(
        gradient
    );


    /* -------------------------------------
       DUPLICATE
    -------------------------------------- */

    const duplicate =
        document.createElement(
            "button"
        );


    duplicate.type =
        "button";

    duplicate.className =
        "secondary-button";

    duplicate.textContent =
        "DUPLICATE TASK";


    duplicate.style.gridColumn =
        "1 / -1";


    duplicate.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            const copy =
                JSON.parse(
                    JSON.stringify(item)
                );


            copy.id =
                crypto.randomUUID();


            copy.text =
                item.text;


            /*
             * Ставим копию на +10 минут.
             */

            copy.time =
                addMinutes(
                    item.time,
                    10
                );


            data.days[
                selectedDay
            ].push(copy);


            renderTasks();

            renderPreview();

            queueSave();

        }
    );


    controls.appendChild(
        duplicate
    );


    card.appendChild(
        controls
    );


    /* -------------------------------------
       EXPAND / COLLAPSE
    -------------------------------------- */

    function toggleCard() {

        card.classList.toggle(
            "expanded"
        );

    }


    expandHint.addEventListener(
        "click",
        toggleCard
    );


    stylePreview.addEventListener(
        "click",
        toggleCard
    );


    /* -------------------------------------
       INPUT EVENTS
    -------------------------------------- */

    time.addEventListener(
        "change",
        () => {

            item.time =
                time.value ||
                "00:00";


            renderTasks();

            renderPreview();

            queueSave();

        }
    );


    text.addEventListener(
        "input",
        () => {

            item.text =
                text.value;

            refreshCard();

        }
    );


    remove.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            openDeleteModal(item);

        }
    );


    /*
     * Не даём клику по input
     * раскрывать карточку.
     */

    time.addEventListener(
        "click",
        event =>
            event.stopPropagation()
    );


    text.addEventListener(
        "click",
        event =>
            event.stopPropagation()
    );


    /* -------------------------------------
       REFRESH CARD
    -------------------------------------- */

    function refreshCard() {

        applyStylePreview();

        renderPreview();

        queueSave();

    }


    function applyStylePreview() {

        styleTime.textContent =
            item.time;


        styleText.textContent =
            item.text;


        styleTime.style.color =
            item.timeColor;


        styleTime.style.fontSize =
            `${item.timeSize}px`;


        styleTime.style.fontWeight =
            item.timeWeight;


        styleText.style.fontFamily =
            item.fontFamily;


        styleText.style.fontSize =
            `${item.fontSize}px`;


        styleText.style.fontWeight =
            item.fontWeight;


        styleText.style.fontStyle =
            item.italic
                ? "italic"
                : "normal";


        styleText.style.padding =
            `${item.padding}px`;


        styleText.style.borderRadius =
            `${item.radius}px`;


        if (
            item.background ===
            "transparent"
        ) {

            styleText.style.background =
                "transparent";

        }

        else {

            styleText.style.background =
                item.background;

        }


        if (item.gradient) {

            styleText.style.background =
                `linear-gradient(
                    90deg,
                    ${item.gradientStart},
                    ${item.gradientEnd}
                )`;

            styleText.style.webkitBackgroundClip =
                "text";

            styleText.style.webkitTextFillColor =
                "transparent";

        }

        else {

            styleText.style.webkitBackgroundClip =
                "";

            styleText.style.webkitTextFillColor =
                "";

            styleText.style.color =
                item.color;

        }

    }


    applyStylePreview();


    return card;

}


/* =========================================
   COLOR CONTROL
========================================= */

function colorControl(
    title,
    value,
    callback
) {

    const box =
        document.createElement(
            "div"
        );


    box.className =
        "control";


    const titleElement =
        document.createElement(
            "div"
        );


    titleElement.className =
        "control-title";


    titleElement.textContent =
        title;


    const input =
        document.createElement(
            "input"
        );


    input.type =
        "color";


    input.value =
        isValidColor(value)
            ? value
            : "#111111";


    input.addEventListener(
        "input",
        () => {

            callback(
                input.value
            );

        }
    );


    box.append(
        titleElement,
        input
    );


    return box;

}


/* =========================================
   RANGE CONTROL
========================================= */

function rangeControl(
    title,
    min,
    max,
    value,
    callback
) {

    const box =
        document.createElement(
            "div"
        );


    box.className =
        "control";


    box.innerHTML = `
        <div class="control-title">
            ${title}
        </div>

        <div class="range-row">

            <input
                type="range"
                min="${min}"
                max="${max}"
                value="${value}"
            >

            <output>
                ${value}
            </output>

        </div>
    `;


    const input =
        box.querySelector(
            "input"
        );


    const output =
        box.querySelector(
            "output"
        );


    input.addEventListener(
        "input",
        () => {

            output.textContent =
                input.value;


            callback(
                input.value
            );

        }
    );


    return box;

}


/* =========================================
   SELECT CONTROL
========================================= */

function selectControl(
    title,
    options,
    value,
    callback
) {

    const box =
        document.createElement(
            "div"
        );


    box.className =
        "control";


    const titleElement =
        document.createElement(
            "div"
        );


    titleElement.className =
        "control-title";


    titleElement.textContent =
        title;


    const select =
        document.createElement(
            "select"
        );


    options.forEach(option => {

        const optionElement =
            document.createElement(
                "option"
            );


        optionElement.value =
            option;


        optionElement.textContent =
            option;


        if (
            option === value
        ) {

            optionElement.selected =
                true;

        }


        select.appendChild(
            optionElement
        );

    });


    select.addEventListener(
        "change",
        () => {

            callback(
                select.value
            );

        }
    );


    box.append(
        titleElement,
        select
    );


    return box;

}


/* =========================================
   CHECKBOX CONTROL
========================================= */

function checkboxControl(
    title,
    value,
    callback
) {

    const box =
        document.createElement(
            "div"
        );


    box.className =
        "control";


    box.innerHTML = `
        <div class="control-title">
            ${title}
        </div>

        <label class="switch-line">

            <input
                type="checkbox"
                ${value ? "checked" : ""}
            >

            ON

        </label>
    `;


    const input =
        box.querySelector(
            "input"
        );


    input.addEventListener(
        "change",
        () => {

            callback(
                input.checked
            );

        }
    );


    return box;

}


/* =========================================
   PREVIEW
========================================= */

function renderPreview() {

    previewDay.textContent =
        SHORT[selectedDay];


    renderGrid();

    renderPreviewTasks();

    renderPreviewPointer();

}


/* =========================================
   GRID
========================================= */

function renderGrid() {

    previewGrid.className =
        "preview-grid " +
        data.global.grid;


    previewGrid.style
        .setProperty(
            "--grid-color",
            data.global.gridColor
        );

}


/* =========================================
   PREVIEW TASKS
========================================= */

function renderPreviewTasks() {

    previewTasks.innerHTML =
        "";


    const items =
        [...data.days[selectedDay]]
        .sort(
            (a,b) =>
                timeToMinutes(a.time) -
                timeToMinutes(b.time)
        );


    if (!items.length) {
        return;
    }


    const height =
        preview.clientHeight;


    const start =
        6 * 60;


    const end =
        24 * 60;


    const range =
        end - start;


    items.forEach(item => {

        const row =
            document.createElement(
                "div"
            );


        row.className =
            "preview-task";


        const position =
            (
                timeToMinutes(
                    item.time
                ) -
                start
            )
            /
            range;


        const safePosition =
            Math.max(
                0,
                Math.min(
                    1,
                    position
                )
            );


        row.style.top =
            `${safePosition * 100}%`;


        const time =
            document.createElement(
                "span"
            );


        time.className =
            "preview-time";


        time.textContent =
            item.time;


        time.style.color =
            item.timeColor;


        time.style.fontSize =
            `${item.timeSize}px`;


        time.style.fontWeight =
            item.timeWeight;


        const text =
            document.createElement(
                "span"
            );


        text.className =
            "preview-label";


        text.textContent =
            item.text;


        text.style.fontFamily =
            item.fontFamily;


        text.style.fontSize =
            `${item.fontSize}px`;


        text.style.fontWeight =
            item.fontWeight;


        text.style.fontStyle =
            item.italic
                ? "italic"
                : "normal";


        text.style.padding =
            `${item.padding}px`;


        text.style.borderRadius =
            `${item.radius}px`;


        if (
            item.background !==
            "transparent"
        ) {

            text.style.background =
                item.background;

        }


        if (item.gradient) {

            text.style.background =
                `linear-gradient(
                    90deg,
                    ${item.gradientStart},
                    ${item.gradientEnd}
                )`;

            text.style.webkitBackgroundClip =
                "text";

            text.style.webkitTextFillColor =
                "transparent";

        }

        else {

            text.style.color =
                item.color;

        }


        row.append(
            time,
            text
        );


        previewTasks.appendChild(
            row
        );

    });

}


/* =========================================
   POINTER PREVIEW
========================================= */

function renderPreviewPointer() {

    previewPointer.textContent =
        data.pointer.symbol;


    previewPointer.style.fontSize =
        `${data.pointer.size}px`;


    if (
        data.pointer.gradient
    ) {

        previewPointer.style.background =
            `linear-gradient(
                90deg,
                ${data.pointer.gradientStart},
                ${data.pointer.gradientEnd}
            )`;

        previewPointer.style.webkitBackgroundClip =
            "text";

        previewPointer.style.webkitTextFillColor =
            "transparent";

    }

    else {

        previewPointer.style.background =
            "";

        previewPointer.style.webkitBackgroundClip =
            "";

        previewPointer.style.webkitTextFillColor =
            "";

        previewPointer.style.color =
            data.pointer.color;

    }


    /*
     * Preview показывает стрелку
     * примерно на 14:00.
     *
     * На главной странице её реальная
     * позиция будет вычисляться
     * по текущему времени.
     */

    const demoTime =
        14 * 60;


    const start =
        6 * 60;


    const end =
        24 * 60;


    const position =
        (
            demoTime - start
        )
        /
        (
            end - start
        );


    previewPointer.style.top =
        `${position * 100}%`;

}


/* =========================================
   TIME HELPERS
========================================= */

function timeToMinutes(time) {

    if (!time) {
        return 0;
    }


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


function addMinutes(
    time,
    amount
) {

    let total =
        timeToMinutes(time) +
        amount;


    total =
        Math.min(
            total,
            23 * 60 + 59
        );


    const hours =
        Math.floor(
            total / 60
        );


    const minutes =
        total % 60;


    return (
        String(hours)
            .padStart(2,"0")
        +
        ":"
        +
        String(minutes)
            .padStart(2,"0")
    );

}


function isValidColor(value) {

    return (
        typeof value === "string" &&
        /^#[0-9A-F]{6}$/i.test(value)
    );

}


/* =========================================
   GRID PANEL
========================================= */

gridButton.addEventListener(
    "click",
    () => {

        gridPanel.classList.toggle(
            "hidden"
        );

        pointerPanel.classList.add(
            "hidden"
        );

        renderGrid();

    }
);


document
    .querySelectorAll(
        "[data-grid]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                data.global.grid =
                    button.dataset.grid;


                document
                    .querySelectorAll(
                        "[data-grid]"
                    )
                    .forEach(item => {

                        item.classList.toggle(
                            "active",
                            item === button
                        );

                    });


                renderPreview();

                queueSave();

            }
        );

    });


gridColor.addEventListener(
    "input",
    () => {

        data.global.gridColor =
            gridColor.value;


        renderPreview();

        queueSave();

    }
);


/* =========================================
   POINTER PANEL
========================================= */

pointerButton.addEventListener(
    "click",
    () => {

        pointerPanel.classList.toggle(
            "hidden"
        );

        gridPanel.classList.add(
            "hidden"
        );

    }
);


pointerSymbol.addEventListener(
    "change",
    () => {

        data.pointer.symbol =
            pointerSymbol.value;


        renderPreview();

        queueSave();

    }
);


pointerColor.addEventListener(
    "input",
    () => {

        data.pointer.color =
            pointerColor.value;


        renderPreview();

        queueSave();

    }
);


pointerSize.addEventListener(
    "input",
    () => {

        data.pointer.size =
            Number(
                pointerSize.value
            );


        pointerSizeValue.textContent =
            pointerSize.value;


        renderPreview();

        queueSave();

    }
);


pointerGradient.addEventListener(
    "change",
    () => {

        data.pointer.gradient =
            pointerGradient.checked;


        updateGradientOptions();

        renderPreview();

        queueSave();

    }
);


pointerGradientStart.addEventListener(
    "input",
    () => {

        data.pointer.gradientStart =
            pointerGradientStart.value;


        renderPreview();

        queueSave();

    }
);


pointerGradientEnd.addEventListener(
    "input",
    () => {

        data.pointer.gradientEnd =
            pointerGradientEnd.value;


        renderPreview();

        queueSave();

    }
);


function updateGradientOptions() {

    pointerGradientOptions.style.opacity =
        data.pointer.gradient
            ? "1"
            : ".45";

}


/* =========================================
   LOAD SETTINGS
========================================= */

function loadSettingsUI() {

    gridColor.value =
        data.global.gridColor;


    document
        .querySelectorAll(
            "[data-grid]"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.grid ===
                data.global.grid
            );

        });


    pointerSymbol.value =
        data.pointer.symbol;


    pointerColor.value =
        data.pointer.color;


    pointerSize.value =
        data.pointer.size;


    pointerSizeValue.textContent =
        data.pointer.size;


    pointerGradient.checked =
        data.pointer.gradient;


    pointerGradientStart.value =
        data.pointer.gradientStart;


    pointerGradientEnd.value =
        data.pointer.gradientEnd;


    updateGradientOptions();

}


/* =========================================
   DELETE MODAL
========================================= */

function openDeleteModal(item) {

    deleteTarget =
        item;


    deleteText.textContent =
        `Удалить «${item.text || "NEW TASK"}»?`;


    deleteModal.classList.remove(
        "hidden"
    );

}


function closeDeleteModal() {

    deleteTarget =
        null;


    deleteModal.classList.add(
        "hidden"
    );

}


cancelDelete.addEventListener(
    "click",
    closeDeleteModal
);


deleteModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            deleteModal
        ) {

            closeDeleteModal();

        }

    }
);


confirmDelete.addEventListener(
    "click",
    () => {

        if (!deleteTarget) {
            return;
        }


        data.days[selectedDay] =
            data.days[selectedDay]
            .filter(
                task =>
                    task.id !==
                    deleteTarget.id
            );


        closeDeleteModal();

        renderTasks();

        renderPreview();

        queueSave();

    }
);


/* =========================================
   SAVE BUTTON
========================================= */

saveButton.addEventListener(
    "click",
    () => {

        clearTimeout(saveTimer);

        save();

    }
);


/* =========================================
   START
========================================= */

async function start() {

    const ok =
        await initUser();


    if (!ok) {
        return;
    }


    const loaded =
        await loadData();


    if (!loaded) {
        return;
    }


    updateTabs();

    loadSettingsUI();

    renderTasks();

    renderPreview();

}


start();