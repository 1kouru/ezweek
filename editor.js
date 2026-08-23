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


let selectedDay = "MONDAY";

let user = null;

let data = null;

let saveTimer = null;

let openTaskId = null;

let activeColorTarget = null;


/* =========================================
   ELEMENTS
========================================= */

const tasks =
    document.getElementById("tasks");

const saveButton =
    document.getElementById("saveButton");

const saveStatus =
    document.getElementById("saveStatus");

const addTaskButton =
    document.getElementById("addTask");

const gridButton =
    document.getElementById("gridButton");

const pointerButton =
    document.getElementById("pointerButton");

const gridPanel =
    document.getElementById("gridPanel");

const pointerPanel =
    document.getElementById("pointerPanel");

const gridPreview =
    document.getElementById("gridPreview");

const gridColor =
    document.getElementById("gridColor");

const gridColorButton =
    document.getElementById("gridColorButton");

const pointerSymbolButton =
    document.getElementById("pointerSymbolButton");

const pointerSymbolIcon =
    document.getElementById("pointerSymbolIcon");

const symbolPopup =
    document.getElementById("symbolPopup");

const symbolGrid =
    document.getElementById("symbolGrid");

const colorPopup =
    document.getElementById("colorPopup");

const popupColorInput =
    document.getElementById("popupColorInput");

const colorPreview =
    document.getElementById("colorPreview");


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

            gridColor: "#e7e7e7"

        },

        pointer: {

            symbol: "1",

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

function createDefaultTask(copy = null) {

    if (copy) {

        return {

            ...JSON.parse(
                JSON.stringify(copy)
            ),

            id:
                crypto.randomUUID()

        };

    }


    return {

        id:
            crypto.randomUUID(),

        time:
            "08:00",

        text:
            "NEW TASK",


        timeColor:
            "#999999",

        timeSize:
            11,

        timeWeight:
            600,


        color:
            "#111111",

        fontSize:
            15,

        fontFamily:
            "Arial",

        fontWeight:
            500,


        gradient:
            false,

        gradientStart:
            "#ff4ecd",

        gradientEnd:
            "#7c5cff",


        background:
            "transparent",

        radius:
            12,

        padding:
            10,


        timeBackground:
            "transparent",

        timeRadius:
            10,

        timePadding:
            7

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


    if (!sessionData.session) {

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

        return;

    }


    data =
        row?.data ||
        defaultData();


    normalize();

    setStatus("READY");

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
        return;
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

        console.error(error);

        setStatus("ERROR");

        return;

    }


    setStatus("SAVED ✓");


    setTimeout(() => {

        if (
            saveStatus.textContent ===
            "SAVED ✓"
        ) {

            setStatus("READY");

        }

    }, 1000);

}


/* =========================================
   AUTOSAVE
========================================= */

function queueSave() {

    setStatus("UNSAVED");

    clearTimeout(saveTimer);

    saveTimer =
        setTimeout(
            save,
            600
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
   GLOBAL PANELS
========================================= */

function closeGlobalPanels() {

    gridPanel.classList.add("hidden");

    pointerPanel.classList.add("hidden");

    gridButton.classList.remove("active");

    pointerButton.classList.remove("active");

    tasks.classList.remove("hidden");

}


/* =========================================
   OPEN GLOBAL PANEL
========================================= */

function toggleGlobalPanel(
    panel,
    button
) {

    const isOpen =
        !panel.classList.contains(
            "hidden"
        );


    closeGlobalPanels();


    if (!isOpen) {

        panel.classList.remove(
            "hidden"
        );

        button.classList.add(
            "active"
        );

        /*
         * Скрываем задачи,
         * пока открыта GRID/POINTER.
         */

        tasks.classList.add(
            "hidden"
        );

    }

}


gridButton.addEventListener(
    "click",
    () => {

        closePopups();

        toggleGlobalPanel(
            gridPanel,
            gridButton
        );

    }
);


pointerButton.addEventListener(
    "click",
    () => {

        closePopups();

        toggleGlobalPanel(
            pointerPanel,
            pointerButton
        );

    }
);


document
    .querySelectorAll(
        "[data-close-panel]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                closeGlobalPanels();

            }
        );

    });


/* =========================================
   DAYS
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

                openTaskId = null;

                updateTabs();

                renderTasks();

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

addTaskButton.addEventListener(
    "click",
    () => {

        closeGlobalPanels();

        closePopups();


        const list =
            data.days[selectedDay];


        const last =
            list.length
                ? list[list.length - 1]
                : null;


        const task =
            createDefaultTask(last);


        if (last) {

            task.time =
                addMinutes(
                    last.time,
                    30
                );

        }


        list.push(task);


        /*
         * Только новая задача открыта.
         */

        openTaskId =
            task.id;


        renderTasks();

        queueSave();


        setTimeout(() => {

            const card =
                document.querySelector(
                    `[data-task-id="${task.id}"]`
                );


            if (card) {

                card.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }

        }, 60);

    }
);


/* =========================================
   DUPLICATE
========================================= */

function duplicateTask(item) {

    const copy =
        createDefaultTask(item);


    copy.time =
        addMinutes(
            item.time,
            30
        );


    data.days[selectedDay]
        .push(copy);


    openTaskId =
        copy.id;


    renderTasks();

    queueSave();

}


/* =========================================
   ADD MINUTES
========================================= */

function addMinutes(
    time,
    minutes
) {

    const [
        h,
        m
    ] =
        time
            .split(":")
            .map(Number);


    let total =
        h * 60 +
        m +
        minutes;


    total =
        Math.max(
            0,
            Math.min(
                1439,
                total
            )
        );


    return (

        String(
            Math.floor(
                total / 60
            )
        ).padStart(2, "0")

        +

        ":"

        +

        String(
            total % 60
        ).padStart(2, "0")

    );

}


/* =========================================
   RENDER TASKS
========================================= */

function renderTasks() {

    tasks.innerHTML = "";


    const items =
        [...data.days[selectedDay]]
            .sort(
                (a, b) =>
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
            "empty";


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
   CREATE TASK
========================================= */

function createTaskCard(item) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "task-card";


    card.dataset.taskId =
        item.id;


    const isOpen =
        openTaskId === item.id;


    if (isOpen) {

        card.classList.add("open");

    }


    /* ==========================
       HEADER
    ========================== */

    const head =
        document.createElement(
            "div"
        );


    head.className =
        "task-head";


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


    const preview =
        document.createElement(
            "button"
        );


    preview.type =
        "button";

    preview.className =
        "task-preview-button";


    const expand =
        document.createElement(
            "button"
        );


    expand.type =
        "button";

    expand.className =
        "expand-button";

    expand.textContent =
        "⌄";


    head.append(
        time,
        preview,
        expand
    );


    card.appendChild(
        head
    );


    /* ==========================
       SETTINGS
    ========================== */

    const settings =
        document.createElement(
            "div"
        );


    settings.className =
        "task-settings";


    if (!isOpen) {

        settings.classList.add(
            "hidden"
        );

    }


    /* ==========================
       TIME
    ========================== */

    const timeSection =
        document.createElement(
            "div"
        );


    timeSection.className =
        "setting-section";


    timeSection.innerHTML = `

        <div class="setting-section-header">

            <span class="setting-section-title">
                TIME
            </span>

            <button
                class="card-button"
                type="button"
            >
                CARD
            </button>

        </div>

    `;


    const timeControls =
        document.createElement(
            "div"
        );


    timeControls.className =
        "compact-settings";


    timeControls.append(
        rangeSetting(
            "SIZE",
            8,
            25,
            item.timeSize,
            value => {

                item.timeSize =
                    Number(value);

                updatePreview();

            }
        ),

        colorSetting(
            "COLOR",
            item.timeColor,
            value => {

                item.timeColor =
                    value;

                updatePreview();

            }
        ),

        rangeSetting(
            "WEIGHT",
            300,
            900,
            item.timeWeight,
            value => {

                item.timeWeight =
                    Number(value);

                updatePreview();

            },
            100
        )

    );


    const timeCard =
        document.createElement(
            "div"
        );


    timeCard.className =
        "card-popover hidden";


    buildTimeCard(
        timeCard,
        item,
        updatePreview
    );


    timeSection.append(
        timeControls,
        timeCard
    );


    const timeCardButton =
        timeSection.querySelector(
            ".card-button"
        );


    timeCardButton.addEventListener(
        "click",
        () => {

            timeCard.classList.toggle(
                "hidden"
            );

            timeCardButton.classList.toggle(
                "active"
            );

        }
    );


    settings.append(
        timeSection
    );


    /* ==========================
       TEXT
    ========================== */

    const textSection =
        document.createElement(
            "div"
        );


    textSection.className =
        "setting-section";


    textSection.innerHTML = `

        <div class="setting-section-header">

            <span class="setting-section-title">
                TEXT
            </span>

            <button
                class="card-button"
                type="button"
            >
                CARD
            </button>

        </div>

    `;


    const textControls =
        document.createElement(
            "div"
        );


    textControls.className =
        "compact-settings";


    textControls.append(
        rangeSetting(
            "SIZE",
            8,
            50,
            item.fontSize,
            value => {

                item.fontSize =
                    Number(value);

                updatePreview();

            }
        ),

        colorSetting(
            "COLOR",
            item.color,
            value => {

                item.color =
                    value;

                updatePreview();

            }
        ),

        rangeSetting(
            "WEIGHT",
            300,
            900,
            item.fontWeight,
            value => {

                item.fontWeight =
                    Number(value);

                updatePreview();

            },
            100
        )

    );


    const fontBox =
        document.createElement(
            "div"
        );


    fontBox.className =
        "compact-setting";


    fontBox.innerHTML = `
        <label>
            FONT
        </label>
    `;


    const fontButton =
        document.createElement(
            "button"
        );


    fontButton.type =
        "button";

    fontButton.className =
        "font-button";


    fontButton.textContent =
        item.fontFamily;


    fontButton.style.fontFamily =
        item.fontFamily;


    fontBox.appendChild(
        fontButton
    );


    textControls.appendChild(
        fontBox
    );


    const textCard =
        document.createElement(
            "div"
        );


    textCard.className =
        "card-popover hidden";


    buildTextCard(
        textCard,
        item,
        updatePreview
    );


    const textCardButton =
        textSection.querySelector(
            ".card-button"
        );


    textCardButton.addEventListener(
        "click",
        () => {

            textCard.classList.toggle(
                "hidden"
            );

            textCardButton.classList.toggle(
                "active"
            );

        }
    );


    textSection.append(
        textControls,
        textCard
    );


    settings.append(
        textSection
    );


    /* ==========================
       ACTIONS
    ========================== */

    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "task-actions";


    const duplicate =
        document.createElement(
            "button"
        );


    duplicate.type =
        "button";

    duplicate.className =
        "task-action";

    duplicate.textContent =
        "DUPLICATE";


    const remove =
        document.createElement(
            "button"
        );


    remove.type =
        "button";

    remove.className =
        "task-action delete";

    remove.textContent =
        "DELETE";


    actions.append(
        duplicate,
        remove
    );


    settings.append(
        actions
    );


    card.appendChild(
        settings
    );


    /* ==========================
       TEXT PREVIEW
    ========================== */

    function updatePreview() {

        preview.textContent =
            item.text ||
            "TASK";


        time.style.color =
            item.timeColor;

        time.style.fontSize =
            `${item.timeSize}px`;

        time.style.fontWeight =
            item.timeWeight;


        preview.style.fontFamily =
            item.fontFamily;

        preview.style.fontSize =
            `${item.fontSize}px`;

        preview.style.fontWeight =
            item.fontWeight;


        /*
         * TEXT GRADIENT
         */

        if (item.gradient) {

            preview.style.background =
                `linear-gradient(
                    90deg,
                    ${item.gradientStart},
                    ${item.gradientEnd}
                )`;

            preview.style.webkitBackgroundClip =
                "text";

            preview.style.backgroundClip =
                "text";

            preview.style.webkitTextFillColor =
                "transparent";

        }

        else {

            preview.style.background =
                item.background ===
                    "transparent"
                    ? "transparent"
                    : item.background;

            preview.style.webkitBackgroundClip =
                "initial";

            preview.style.backgroundClip =
                "initial";

            preview.style.webkitTextFillColor =
                item.color;

            preview.style.color =
                item.color;

        }


        /*
         * CARD
         */

        if (
            item.background ===
            "transparent"
        ) {

            if (!item.gradient) {

                preview.style.background =
                    "transparent";

            }

        }

        preview.style.borderRadius =
            `${item.radius}px`;

        preview.style.padding =
            `${item.padding}px`;


        /*
         * TIME CARD
         */

        time.style.backgroundColor =
            item.timeBackground ===
                "transparent"
                ? "transparent"
                : item.timeBackground;

        time.style.borderRadius =
            `${item.timeRadius}px`;

        time.style.padding =
            `0 ${item.timePadding}px`;

    }


    updatePreview();


    /* ==========================
       EVENTS
    ========================== */

    expand.addEventListener(
        "click",
        () => {

            if (
                openTaskId ===
                item.id
            ) {

                openTaskId = null;

            }

            else {

                openTaskId =
                    item.id;

            }


            renderTasks();

        }
    );


    preview.addEventListener(
        "click",
        () => {

            const value =
                window.prompt(
                    "Текст задачи",
                    item.text
                );


            if (value !== null) {

                item.text =
                    value;

                updatePreview();

                queueSave();

            }

        }
    );


    time.addEventListener(
        "change",
        () => {

            item.time =
                time.value ||
                "00:00";

            renderTasks();

            queueSave();

        }
    );


    duplicate.addEventListener(
        "click",
        () => {

            duplicateTask(item);

        }
    );


    remove.addEventListener(
        "click",
        () => {

            data.days[selectedDay] =
                data.days[selectedDay]
                    .filter(
                        task =>
                            task.id !==
                            item.id
                    );


            if (
                openTaskId ===
                item.id
            ) {

                openTaskId = null;

            }


            renderTasks();

            queueSave();

        }
    );


    card.appendChild(
        settings
    );


    return card;

}


/* =========================================
   RANGE SETTING
========================================= */

function rangeSetting(
    title,
    min,
    max,
    value,
    callback,
    step = 1
) {

    const box =
        document.createElement(
            "div"
        );


    box.className =
        "compact-setting";


    const label =
        document.createElement(
            "label"
        );


    const name =
        document.createElement(
            "span"
        );


    name.textContent =
        title;


    const output =
        document.createElement(
            "output"
        );


    output.textContent =
        value;


    label.append(
        name,
        output
    );


    const input =
        document.createElement(
            "input"
        );


    input.type =
        "range";

    input.min =
        min;

    input.max =
        max;

    input.step =
        step;

    input.value =
        value;


    input.addEventListener(
        "input",
        () => {

            output.textContent =
                input.value;

            callback(
                input.value
            );

            queueSave();

        }
    );


    box.append(
        label,
        input
    );


    return box;

}


/* =========================================
   COLOR SETTING
========================================= */

function colorSetting(
    title,
    value,
    callback
) {

    const box =
        document.createElement(
            "div"
        );


    box.className =
        "compact-setting";


    const label =
        document.createElement(
            "label"
        );


    label.textContent =
        title;


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";

    button.className =
        "compact-color-button";

    button.style.background =
        value;


    box.append(
        label,
        button
    );


    button.addEventListener(
        "click",
        event => {

            openColorPicker(
                value,
                newValue => {

                    button.style.background =
                        newValue;

                    callback(
                        newValue
                    );

                },
                event
            );

        }
    );


    return box;

}


/* =========================================
   TIME CARD
========================================= */

function buildTimeCard(
    container,
    item,
    update
) {

    container.innerHTML = `

        <div class="card-popover-grid">

            <div class="card-control">

                <span>ROUND</span>

                <input
                    type="range"
                    min="0"
                    max="25"
                    value="${item.timeRadius}"
                    data-radius
                >

            </div>


            <div class="card-control">

                <span>PADDING</span>

                <input
                    type="range"
                    min="0"
                    max="20"
                    value="${item.timePadding}"
                    data-padding
                >

            </div>

        </div>


        <button
            class="card-control-color"
            data-color
            type="button"
        ></button>

        <button
            class="transparent-button"
            data-transparent
            type="button"
        >
            TRANSPARENT
        </button>

    `;


    const radius =
        container.querySelector(
            "[data-radius]"
        );


    const padding =
        container.querySelector(
            "[data-padding]"
        );


    const color =
        container.querySelector(
            "[data-color]"
        );


    color.style.background =
        item.timeBackground ===
            "transparent"
            ? "#ffffff"
            : item.timeBackground;


    radius.addEventListener(
        "input",
        () => {

            item.timeRadius =
                Number(
                    radius.value
                );

            update();

            queueSave();

        }
    );


    padding.addEventListener(
        "input",
        () => {

            item.timePadding =
                Number(
                    padding.value
                );

            update();

            queueSave();

        }
    );


    color.addEventListener(
        "click",
        event => {

            openColorPicker(
                item.timeBackground ===
                    "transparent"
                    ? "#ffffff"
                    : item.timeBackground,

                value => {

                    item.timeBackground =
                        value;

                    color.style.background =
                        value;

                    update();

                    queueSave();

                },

                event

            );

        }
    );


    container
        .querySelector(
            "[data-transparent]"
        )
        .addEventListener(
            "click",
            () => {

                item.timeBackground =
                    "transparent";

                color.style.background =
                    "#ffffff";

                update();

                queueSave();

            }
        );

}


/* =========================================
   TEXT CARD
========================================= */

function buildTextCard(
    container,
    item,
    update
) {

    container.innerHTML = `

        <div class="card-popover-grid">

            <div class="card-control">

                <span>ROUND</span>

                <input
                    type="range"
                    min="0"
                    max="35"
                    value="${item.radius}"
                    data-radius
                >

            </div>


            <div class="card-control">

                <span>PADDING</span>

                <input
                    type="range"
                    min="0"
                    max="25"
                    value="${item.padding}"
                    data-padding
                >

            </div>

        </div>


        <button
            class="card-control-color"
            data-color
            type="button"
        ></button>


        <button
            class="transparent-button"
            data-transparent
            type="button"
        >
            TRANSPARENT
        </button>


        <div class="task-gradient">

            <div class="gradient-top">

                <span>GRADIENT</span>

                <label class="switch">

                    <input
                        type="checkbox"
                        data-gradient
                        ${item.gradient ? "checked" : ""}
                    >

                    <span></span>

                </label>

            </div>


            <div
                class="gradient-colors ${
                    item.gradient
                        ? ""
                        : "hidden"
                }"
                data-gradient-colors
            >

                <button
                    type="button"
                    data-gradient-start
                ></button>

                <button
                    type="button"
                    data-gradient-end
                ></button>

            </div>

        </div>

    `;


    const radius =
        container.querySelector(
            "[data-radius]"
        );


    const padding =
        container.querySelector(
            "[data-padding]"
        );


    const color =
        container.querySelector(
            "[data-color]"
        );


    const transparent =
        container.querySelector(
            "[data-transparent]"
        );


    const gradient =
        container.querySelector(
            "[data-gradient]"
        );


    const gradientColors =
        container.querySelector(
            "[data-gradient-colors]"
        );


    const gradientStart =
        container.querySelector(
            "[data-gradient-start]"
        );


    const gradientEnd =
        container.querySelector(
            "[data-gradient-end]"
        );


    color.style.background =
        item.background ===
            "transparent"
            ? "#ffffff"
            : item.background;


    gradientStart.style.background =
        item.gradientStart;


    gradientEnd.style.background =
        item.gradientEnd;


    radius.addEventListener(
        "input",
        () => {

            item.radius =
                Number(
                    radius.value
                );

            update();

            queueSave();

        }
    );


    padding.addEventListener(
        "input",
        () => {

            item.padding =
                Number(
                    padding.value
                );

            update();

            queueSave();

        }
    );


    color.addEventListener(
        "click",
        event => {

            openColorPicker(
                item.background ===
                    "transparent"
                    ? "#ffffff"
                    : item.background,

                value => {

                    item.background =
                        value;

                    color.style.background =
                        value;

                    update();

                    queueSave();

                },

                event

            );

        }
    );


    transparent.addEventListener(
        "click",
        () => {

            item.background =
                "transparent";

            color.style.background =
                "#ffffff";

            update();

            queueSave();

        }
    );


    gradient.addEventListener(
        "change",
        () => {

            item.gradient =
                gradient.checked;


            gradientColors.classList.toggle(
                "hidden",
                !item.gradient
            );


            update();

            queueSave();

        }
    );


    gradientStart.addEventListener(
        "click",
        event => {

            openColorPicker(
                item.gradientStart,

                value => {

                    item.gradientStart =
                        value;

                    gradientStart.style.background =
                        value;

                    update();

                    queueSave();

                },

                event

            );

        }
    );


    gradientEnd.addEventListener(
        "click",
        event => {

            openColorPicker(
                item.gradientEnd,

                value => {

                    item.gradientEnd =
                        value;

                    gradientEnd.style.background =
                        value;

                    update();

                    queueSave();

                },

                event

            );

        }
    );

}


/* =========================================
   SYMBOLS
========================================= */

const ICON_COUNT = 10;


function iconPath(id) {

    return `icons/${id}.css`;

}


function buildSymbolGrid() {

    symbolGrid.innerHTML = "";


    for (
        let i = 1;
        i <= ICON_COUNT;
        i++
    ) {

        /*
         * Подключаем CSS каждого
         * пользовательского символа.
         */

        const link =
            document.createElement(
                "link"
            );


        link.rel =
            "stylesheet";

        link.href =
            iconPath(i);


        document.head.appendChild(
            link
        );


        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";

        button.className =
            "symbol-option";


        button.dataset.symbol =
            String(i);


        const icon =
            document.createElement(
                "span"
            );


        /*
         * CSS иконки может
         * использовать .icon.
         */

        icon.className =
            "icon";


        button.appendChild(
            icon
        );


        button.addEventListener(
            "click",
            () => {

                data.pointer.symbol =
                    String(i);

                updatePointerPreview();

                closePopups();

                queueSave();

            }
        );


        symbolGrid.appendChild(
            button
        );

    }


    updateSymbolSelection();

}


function updateSymbolSelection() {

    document
        .querySelectorAll(
            ".symbol-option"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.symbol ===
                data.pointer.symbol
            );

        });

}


pointerSymbolButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        closeColorPopup();

        symbolPopup.classList.toggle(
            "hidden"
        );

        updateSymbolSelection();

    }
);


/* =========================================
   POINTER PREVIEW
========================================= */

function getIconElement(
    number
) {

    const img =
        document.createElement(
            "img"
        );


    /*
     * Если твои CSS иконки
     * не используют <img>,
     * fallback всё равно останется.
     */

    img.src =
        `icons/${number}.png`;

    img.alt = "";

    img.onerror = () => {

        img.remove();

    };


    return img;

}


function updatePointerPreview() {

    pointerSymbolIcon.innerHTML = "";


    const img =
        getIconElement(
            data.pointer.symbol
        );


    pointerSymbolIcon.appendChild(
        img
    );


    /*
     * Добавляем fallback,
     * если PNG отсутствует.
     */

    img.onerror = () => {

        pointerSymbolIcon.innerHTML =
            `<span class="pointer-fallback">›</span>`;

    };


    pointerSymbolIcon.style.fontSize =
        `${data.pointer.size}px`;


    pointerSymbolIcon.style.color =
        data.pointer.color;


    if (data.pointer.gradient) {

        pointerSymbolIcon.style.background =
            `linear-gradient(
                90deg,
                ${data.pointer.gradientStart},
                ${data.pointer.gradientEnd}
            )`;

        pointerSymbolIcon.style.webkitBackgroundClip =
            "text";

        pointerSymbolIcon.style.webkitTextFillColor =
            "transparent";

    }

    else {

        pointerSymbolIcon.style.background =
            "none";

        pointerSymbolIcon.style.webkitBackgroundClip =
            "initial";

        pointerSymbolIcon.style.webkitTextFillColor =
            "initial";

    }


    updateSymbolSelection();

}


/* =========================================
   COLOR PICKER
========================================= */

function openColorPicker(
    value,
    callback
) {

    activeColorTarget =
        callback;


    popupColorInput.value =
        value;


    colorPreview.style.background =
        value;


    colorPopup.classList.remove(
        "hidden"
    );


    symbolPopup.classList.add(
        "hidden"
    );


    popupColorInput.focus();

}


popupColorInput.addEventListener(
    "input",
    () => {

        const value =
            popupColorInput.value;


        colorPreview.style.background =
            value;


        if (activeColorTarget) {

            activeColorTarget(
                value
            );

        }

    }
);


popupColorInput.addEventListener(
    "change",
    () => {

        closeColorPopup();

    }
);


function closeColorPopup() {

    colorPopup.classList.add(
        "hidden"
    );

    activeColorTarget =
        null;

}


function closePopups() {

    closeColorPopup();

    symbolPopup.classList.add(
        "hidden"
    );

}


/* =========================================
   GRID
========================================= */

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

                updateGrid();

                queueSave();

            }
        );

    });


gridColorButton.addEventListener(
    "click",
    () => {

        openColorPicker(
            data.global.gridColor,

            value => {

                data.global.gridColor =
                    value;

                gridColorButton.style.background =
                    value;

                updateGrid();

                queueSave();

            }

        );

    }
);


function updateGrid() {

    gridPreview.className =
        "grid-preview";


    gridPreview.classList.add(
        `grid-${data.global.grid}`
    );


    gridPreview.style.setProperty(
        "--grid-color",
        data.global.gridColor
    );


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


    gridColorButton.style.background =
        data.global.gridColor;

}


/* =========================================
   POINTER CONTROLS
========================================= */

document
    .getElementById(
        "pointerColorButton"
    )
    .addEventListener(
        "click",
        () => {

            openColorPicker(
                data.pointer.color,

                value => {

                    data.pointer.color =
                        value;

                    updatePointerPreview();

                    document
                        .getElementById(
                            "pointerColorButton"
                        )
                        .style.background =
                        value;

                    queueSave();

                }

            );

        }
    );


const pointerSize =
    document.getElementById(
        "pointerSize"
    );


const pointerSizeValue =
    document.getElementById(
        "pointerSizeValue"
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


        updatePointerPreview();

        queueSave();

    }
);


const pointerGradient =
    document.getElementById(
        "pointerGradient"
    );


pointerGradient.addEventListener(
    "change",
    () => {

        data.pointer.gradient =
            pointerGradient.checked;


        document
            .getElementById(
                "pointerGradientOptions"
            )
            .classList.toggle(
                "hidden",
                !data.pointer.gradient
            );


        updatePointerPreview();

        queueSave();

    }
);


document
    .getElementById(
        "pointerGradientStartButton"
    )
    .addEventListener(
        "click",
        () => {

            openColorPicker(
                data.pointer.gradientStart,

                value => {

                    data.pointer.gradientStart =
                        value;

                    document
                        .getElementById(
                            "pointerGradientStartButton"
                        )
                        .style.background =
                        value;

                    updatePointerPreview();

                    queueSave();

                }

            );

        }
    );


document
    .getElementById(
        "pointerGradientEndButton"
    )
    .addEventListener(
        "click",
        () => {

            openColorPicker(
                data.pointer.gradientEnd,

                value => {

                    data.pointer.gradientEnd =
                        value;

                    document
                        .getElementById(
                            "pointerGradientEndButton"
                        )
                        .style.background =
                        value;

                    updatePointerPreview();

                    queueSave();

                }

            );

        }
    );


/* =========================================
   UI SETTINGS
========================================= */

function loadSettingsUI() {

    gridColor.value =
        data.global.gridColor;


    updateGrid();


    document
        .getElementById(
            "pointerColorButton"
        )
        .style.background =
        data.pointer.color;


    pointerSize.value =
        data.pointer.size;


    pointerSizeValue.textContent =
        data.pointer.size;


    pointerGradient.checked =
        data.pointer.gradient;


    document
        .getElementById(
            "pointerGradientOptions"
        )
        .classList.toggle(
            "hidden",
            !data.pointer.gradient
        );


    document
        .getElementById(
            "pointerGradientStartButton"
        )
        .style.background =
        data.pointer.gradientStart;


    document
        .getElementById(
            "pointerGradientEndButton"
        )
        .style.background =
        data.pointer.gradientEnd;


    updatePointerPreview();

}


/* =========================================
   SAVE BUTTON
========================================= */

saveButton.addEventListener(
    "click",
    async () => {

        clearTimeout(
            saveTimer
        );

        await save();

    }
);


/* =========================================
   CLOSE POPUPS
========================================= */

document.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(
                ".floating-popup"
            ) &&

            !event.target.closest(
                "#pointerSymbolButton"
            )
        ) {

            symbolPopup.classList.add(
                "hidden"
            );

        }


        if (
            !event.target.closest(
                ".color-popup"
            )
        ) {

            /*
             * Не закрываем сразу,
             * если пользователь только
             * открыл color input.
             */

        }

    }
);


/* =========================================
   START
========================================= */

async function start() {

    const authenticated =
        await initUser();


    if (!authenticated) {

        return;

    }


    await loadData();


    updateTabs();

    buildSymbolGrid();

    loadSettingsUI();

    renderTasks();

}


start();
