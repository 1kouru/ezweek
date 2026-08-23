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

let openedTaskId = null;

let saveTimer = null;


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

const selectedDayTitle =
    document.getElementById("selectedDayTitle");


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
            data.days[day].map(item => {

                return {

                    id:
                        item.id ||
                        crypto.randomUUID(),

                    time:
                        item.time ||
                        "08:00",

                    text:
                        item.text ||
                        "NEW TASK",

                    color:
                        item.color ||
                        data.global.taskColor,

                    fontSize:
                        Number(
                            item.fontSize ||
                            data.global.taskSize
                        ),

                    fontFamily:
                        item.fontFamily ||
                        "Arial",

                    fontWeight:
                        Number(
                            item.fontWeight ||
                            500
                        ),

                    background:
                        item.background ||
                        "transparent",

                    radius:
                        Number(
                            item.radius ??
                            data.global.taskRadius
                        ),

                    padding:
                        Number(
                            item.padding ??
                            data.global.taskPadding
                        ),

                    timeColor:
                        item.timeColor ||
                        data.global.timeColor,

                    timeSize:
                        Number(
                            item.timeSize ||
                            data.global.timeSize
                        ),

                    timeWeight:
                        Number(
                            item.timeWeight ||
                            600
                        ),

                    gradient:
                        Boolean(
                            item.gradient
                        ),

                    gradientStart:
                        item.gradientStart ||
                        "#ff4ecd",

                    gradientEnd:
                        item.gradientEnd ||
                        "#7c5cff"

                };

            });

    });

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
            "SUPABASE SAVE ERROR:",
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

            setStatus("READY");

        },
        1200
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
    .querySelectorAll(".day-tabs button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectedDay =
                    button.dataset.day;

                openedTaskId =
                    null;

                updateTabs();

                renderTasks();

            }
        );

    });


function updateTabs() {

    document
        .querySelectorAll(".day-tabs button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.day ===
                selectedDay
            );

        });


    selectedDayTitle.textContent =
        selectedDay;

}


/* =========================================
   ADD TASK
========================================= */

addTaskButton.addEventListener(
    "click",
    () => {

        const task = {

            id:
                crypto.randomUUID(),

            time:
                "08:00",

            text:
                "NEW TASK",

            color:
                data.global.taskColor,

            fontSize:
                data.global.taskSize,

            fontFamily:
                "Arial",

            fontWeight:
                500,

            background:
                "transparent",

            radius:
                data.global.taskRadius,

            padding:
                data.global.taskPadding,

            timeColor:
                data.global.timeColor,

            timeSize:
                data.global.timeSize,

            timeWeight:
                600,

            gradient:
                false,

            gradientStart:
                "#ff4ecd",

            gradientEnd:
                "#7c5cff"

        };


        data.days[selectedDay].push(
            task
        );


        openedTaskId =
            task.id;


        renderTasks();

        queueSave();

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
            (a, b) =>
                timeToMinutes(a.time) -
                timeToMinutes(b.time)
        );


    if (!items.length) {

        const empty =
            document.createElement("div");


        empty.className =
            "empty-state";


        empty.innerHTML =
            `
            Здесь пока ничего нет.<br>
            Нажми <b>ADD TASK</b>, чтобы создать первую задачу.
            `;


        tasks.appendChild(empty);

        return;

    }


    items.forEach(item => {

        tasks.appendChild(
            createTaskCard(item)
        );

    });

}


/* =========================================
   TIME SORT
========================================= */

function timeToMinutes(time) {

    const [
        hours,
        minutes
    ] =
        String(time || "00:00")
        .split(":")
        .map(Number);


    return (
        hours * 60 +
        minutes
    );

}


/* =========================================
   CREATE TASK CARD
========================================= */

function createTaskCard(item) {

    const card =
        document.createElement("article");


    card.className =
        "task-card";


    if (
        openedTaskId === item.id
    ) {

        card.classList.add("open");

    }


    /* =====================================
       PREVIEW
    ===================================== */

    const preview =
        document.createElement("div");


    preview.className =
        "task-preview";


    const time =
        document.createElement("div");


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
        document.createElement("div");


    text.className =
        "preview-text";


    text.textContent =
        item.text;


    text.style.fontFamily =
        item.fontFamily;


    text.style.fontSize =
        `${item.fontSize}px`;


    text.style.fontWeight =
        item.fontWeight;


    text.style.padding =
        `${item.padding}px`;


    text.style.borderRadius =
        `${item.radius}px`;


    if (item.gradient) {

        text.style.color =
            "transparent";

        text.style.background =
            `linear-gradient(
                90deg,
                ${item.gradientStart},
                ${item.gradientEnd}
            )`;

        text.style.backgroundClip =
            "text";

        text.style.webkitBackgroundClip =
            "text";

    }

    else {

        text.style.color =
            item.color;

    }


    if (
        item.background !==
        "transparent"
    ) {

        text.style.backgroundColor =
            item.background;

    }


    const openIcon =
        document.createElement("div");


    openIcon.className =
        "task-open-icon";


    openIcon.textContent =
        "⌄";


    preview.append(
        time,
        text,
        openIcon
    );


    card.appendChild(
        preview
    );


    /* =====================================
       EDITOR
    ===================================== */

    const editor =
        document.createElement("div");


    editor.className =
        "task-editor";


    /* =====================================
       TIME
    ===================================== */

    editor.appendChild(
        createGroup(
            "TIME",
            [
                createField(
                    "TIME",
                    createTimeInput(
                        item.time,
                        value => {

                            item.time =
                                value ||
                                "00:00";

                            renderTasks();

                            openedTaskId =
                                item.id;

                            queueSave();

                        }
                    )
                )
            ]
        )
    );


    /* =====================================
       TEXT
    ===================================== */

    editor.appendChild(
        createGroup(
            "TEXT",
            [

                createField(
                    "TASK NAME",
                    createTextInput(
                        item.text,
                        value => {

                            item.text =
                                value;

                            updatePreview();

                            queueSave();

                        }
                    )
                )

            ]
        )
    );


    /* =====================================
       TEXT STYLE
    ===================================== */

    const textStyleGroup =
        document.createElement("div");


    textStyleGroup.className =
        "editor-group";


    textStyleGroup.innerHTML =
        `
        <div class="editor-group-title">
            TEXT STYLE
        </div>
        `;


    const fontField =
        document.createElement("div");


    fontField.className =
        "field";


    fontField.innerHTML =
        `
        <label class="field-label">
            FONT
        </label>
        `;


    const fontSelect =
        document.createElement("select");


    fontSelect.className =
        "font-select";


    const fonts = [

        ["Arial", "Arial"],

        ["Inter", "Inter, sans-serif"],

        ["Helvetica", "Helvetica"],

        ["Georgia", "Georgia"],

        ["Times New Roman", "Times New Roman"],

        ["Garamond", "Garamond"],

        ["Courier New", "Courier New"],

        ["Trebuchet MS", "Trebuchet MS"],

        ["Verdana", "Verdana"],

        ["Tahoma", "Tahoma"],

        ["Impact", "Impact"],

        ["Comic Sans MS", "Comic Sans MS"],

        ["Lucida Console", "Lucida Console"],

        ["Palatino", "Palatino"],

        ["Brush Script MT", "Brush Script MT"],

        ["Century Gothic", "Century Gothic"]

    ];


    fonts.forEach(
        ([name, value]) => {

            const option =
                document.createElement("option");

            option.value =
                value;

            option.textContent =
                name;

            if (
                value ===
                item.fontFamily
            ) {

                option.selected =
                    true;

            }

            fontSelect.appendChild(
                option
            );

        }
    );


    fontSelect.addEventListener(
        "change",
        () => {

            item.fontFamily =
                fontSelect.value;

            updatePreview();

            queueSave();

        }
    );


    fontField.appendChild(
        fontSelect
    );


    textStyleGroup.appendChild(
        fontField
    );


    const styleGrid =
        document.createElement("div");


    styleGrid.className =
        "control-grid";


    styleGrid.append(

        miniRange(
            "SIZE",
            8,
            50,
            item.fontSize,
            value => {

                item.fontSize =
                    Number(value);

                updatePreview();

                queueSave();

            }
        ),

        miniSelect(
            "WEIGHT",
            [
                "300",
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

                updatePreview();

                queueSave();

            }
        ),

        miniColor(
            "COLOR",
            item.color,
            value => {

                item.color =
                    value;

                updatePreview();

                queueSave();

            }
        )

    );


    textStyleGroup.appendChild(
        styleGrid
    );


    /* =====================================
       GRADIENT
    ===================================== */

    const gradientSettings =
        document.createElement("div");


    gradientSettings.className =
        "gradient-settings";


    const gradientToggle =
        document.createElement("label");


    gradientToggle.className =
        "toggle-row";


    gradientToggle.innerHTML =
        `
        <span>
            <strong>TEXT GRADIENT</strong>
            <small>Make this task colorful.</small>
        </span>

        <input
            type="checkbox"
            ${item.gradient ? "checked" : ""}
        >

        <span class="toggle"></span>
        `;


    const gradientCheckbox =
        gradientToggle.querySelector(
            "input"
        );


    gradientCheckbox.addEventListener(
        "change",
        () => {

            item.gradient =
                gradientCheckbox.checked;

            updatePreview();

            queueSave();

        }
    );


    gradientSettings.appendChild(
        gradientToggle
    );


    const gradientColors =
        document.createElement("div");


    gradientColors.className =
        "gradient-colors";


    gradientColors.style.marginTop =
        "10px";


    gradientColors.append(

        miniColor(
            "START",
            item.gradientStart,
            value => {

                item.gradientStart =
                    value;

                updatePreview();

                queueSave();

            }
        ),

        miniColor(
            "END",
            item.gradientEnd,
            value => {

                item.gradientEnd =
                    value;

                updatePreview();

                queueSave();

            }
        )

    );


    gradientSettings.appendChild(
        gradientColors
    );


    textStyleGroup.appendChild(
        gradientSettings
    );


    editor.appendChild(
        textStyleGroup
    );


    /* =====================================
       CARD STYLE
    ===================================== */

    const cardStyle =
        document.createElement("div");


    cardStyle.className =
        "editor-group";


    cardStyle.innerHTML =
        `
        <div class="editor-group-title">
            CARD STYLE
        </div>
        `;


    const cardGrid =
        document.createElement("div");


    cardGrid.className =
        "control-grid";


    cardGrid.append(

        miniColor(
            "BACKGROUND",
            item.background ===
                "transparent"
                ? "#ffffff"
                : item.background,
            value => {

                item.background =
                    value;

                updatePreview();

                queueSave();

            }
        ),

        miniRange(
            "ROUNDING",
            0,
            40,
            item.radius,
            value => {

                item.radius =
                    Number(value);

                updatePreview();

                queueSave();

            }
        ),

        miniRange(
            "PADDING",
            0,
            30,
            item.padding,
            value => {

                item.padding =
                    Number(value);

                updatePreview();

                queueSave();

            }
        )

    );


    cardStyle.appendChild(
        cardGrid
    );


    editor.appendChild(
        cardStyle
    );


    /* =====================================
       TIME STYLE
    ===================================== */

    const timeStyle =
        document.createElement("div");


    timeStyle.className =
        "editor-group";


    timeStyle.innerHTML =
        `
        <div class="editor-group-title">
            TIME STYLE
        </div>
        `;


    const timeGrid =
        document.createElement("div");


    timeGrid.className =
        "control-grid";


    timeGrid.append(

        miniColor(
            "COLOR",
            item.timeColor,
            value => {

                item.timeColor =
                    value;

                updatePreview();

                queueSave();

            }
        ),

        miniRange(
            "SIZE",
            8,
            25,
            item.timeSize,
            value => {

                item.timeSize =
                    Number(value);

                updatePreview();

                queueSave();

            }
        ),

        miniSelect(
            "WEIGHT",
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

                updatePreview();

                queueSave();

            }
        )

    );


    timeStyle.appendChild(
        timeGrid
    );


    editor.appendChild(
        timeStyle
    );


    /* =====================================
       ACTIONS
    ===================================== */

    const actions =
        document.createElement("div");


    actions.className =
        "task-actions";


    const duplicate =
        document.createElement("button");


    duplicate.type =
        "button";


    duplicate.className =
        "task-action duplicate-task";


    duplicate.textContent =
        "DUPLICATE";


    duplicate.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            duplicateTask(item);

        }
    );


    const remove =
        document.createElement("button");


    remove.type =
        "button";


    remove.className =
        "task-action delete-task";


    remove.textContent =
        "DELETE";


    remove.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            deleteTask(item);

        }
    );


    actions.append(
        duplicate,
        remove
    );


    editor.appendChild(
        actions
    );


    card.appendChild(
        editor
    );


    /* =====================================
       OPEN / CLOSE
    ===================================== */

    preview.addEventListener(
        "click",
        () => {

            if (
                openedTaskId ===
                item.id
            ) {

                openedTaskId =
                    null;

            }

            else {

                openedTaskId =
                    item.id;

            }


            renderTasks();

        }
    );


    /* =====================================
       LIVE PREVIEW
    ===================================== */

    function updatePreview() {

        time.textContent =
            item.time;


        time.style.color =
            item.timeColor;


        time.style.fontSize =
            `${item.timeSize}px`;


        time.style.fontWeight =
            item.timeWeight;


        text.textContent =
            item.text;


        text.style.fontFamily =
            item.fontFamily;


        text.style.fontSize =
            `${item.fontSize}px`;


        text.style.fontWeight =
            item.fontWeight;


        text.style.padding =
            `${item.padding}px`;


        text.style.borderRadius =
            `${item.radius}px`;


        if (item.gradient) {

            text.style.color =
                "transparent";

            text.style.background =
                `linear-gradient(
                    90deg,
                    ${item.gradientStart},
                    ${item.gradientEnd}
                )`;

            text.style.backgroundClip =
                "text";

            text.style.webkitBackgroundClip =
                "text";

        }

        else {

            text.style.color =
                item.color;

            text.style.background =
                "";

            text.style.backgroundClip =
                "";

            text.style.webkitBackgroundClip =
                "";

        }


        if (
            item.background !==
            "transparent"
        ) {

            text.style.backgroundColor =
                item.background;

        }

        else {

            text.style.backgroundColor =
                "";

        }

    }


    updatePreview();


    return card;

}


/* =========================================
   FIELD HELPERS
========================================= */

function createGroup(
    title,
    children
) {

    const group =
        document.createElement("div");


    group.className =
        "editor-group";


    const titleElement =
        document.createElement("div");


    titleElement.className =
        "editor-group-title";


    titleElement.textContent =
        title;


    group.appendChild(
        titleElement
    );


    children.forEach(
        child => {

            group.appendChild(
                child
            );

        }
    );


    return group;

}


function createField(
    label,
    input
) {

    const field =
        document.createElement("div");


    field.className =
        "field";


    const labelElement =
        document.createElement("label");


    labelElement.className =
        "field-label";


    labelElement.textContent =
        label;


    field.append(
        labelElement,
        input
    );


    return field;

}


function createTextInput(
    value,
    callback
) {

    const input =
        document.createElement("input");


    input.type =
        "text";


    input.className =
        "text-field";


    input.value =
        value;


    input.addEventListener(
        "input",
        () => {

            callback(
                input.value
            );

        }
    );


    return input;

}


function createTimeInput(
    value,
    callback
) {

    const input =
        document.createElement("input");


    input.type =
        "time";


    input.className =
        "time-field";


    input.value =
        value;


    input.addEventListener(
        "change",
        () => {

            callback(
                input.value
            );

        }
    );


    return input;

}


/* =========================================
   MINI COLOR
========================================= */

function miniColor(
    title,
    value,
    callback
) {

    const box =
        document.createElement("div");


    box.className =
        "mini-control";


    const label =
        document.createElement("label");


    label.className =
        "field-label";


    label.textContent =
        title;


    const input =
        document.createElement("input");


    input.type =
        "color";


    input.className =
        "mini-color";


    input.value =
        value || "#111111";


    input.addEventListener(
        "input",
        () => {

            callback(
                input.value
            );

        }
    );


    box.append(
        label,
        input
    );


    return box;

}


/* =========================================
   MINI RANGE
========================================= */

function miniRange(
    title,
    min,
    max,
    value,
    callback
) {

    const box =
        document.createElement("div");


    box.className =
        "mini-control";


    const label =
        document.createElement("label");


    label.className =
        "field-label";


    label.textContent =
        title;


    const input =
        document.createElement("input");


    input.type =
        "range";


    input.className =
        "mini-range";


    input.min =
        min;

    input.max =
        max;

    input.value =
        value;


    const output =
        document.createElement("span");


    output.className =
        "range-value";


    output.textContent =
        value;


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


    box.append(
        label,
        input,
        output
    );


    return box;

}


/* =========================================
   MINI SELECT
========================================= */

function miniSelect(
    title,
    options,
    value,
    callback
) {

    const box =
        document.createElement("div");


    box.className =
        "mini-control";


    const label =
        document.createElement("label");


    label.className =
        "field-label";


    label.textContent =
        title;


    const select =
        document.createElement("select");


    select.className =
        "font-select";


    options.forEach(
        optionValue => {

            const option =
                document.createElement("option");


            option.value =
                optionValue;


            option.textContent =
                optionValue;


            option.selected =
                optionValue ===
                value;


            select.appendChild(
                option
            );

        }
    );


    select.addEventListener(
        "change",
        () => {

            callback(
                select.value
            );

        }
    );


    box.append(
        label,
        select
    );


    return box;

}


/* =========================================
   DUPLICATE
========================================= */

function duplicateTask(item) {

    const copy =
        JSON.parse(
            JSON.stringify(item)
        );


    copy.id =
        crypto.randomUUID();


    copy.text =
        item.text +
        " COPY";


    data.days[selectedDay].push(
        copy
    );


    openedTaskId =
        copy.id;


    renderTasks();

    queueSave();


    setTimeout(
        () => {

            const opened =
                document.querySelector(
                    ".task-card.open"
                );


            if (opened) {

                opened.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }

        },
        80
    );

}


/* =========================================
   DELETE
========================================= */

function deleteTask(item) {

    const confirmed =
        window.confirm(
            `Удалить задачу "${item.text}"?\n\nЭто действие нельзя отменить.`
        );


    if (!confirmed) {
        return;
    }


    data.days[selectedDay] =
        data.days[selectedDay]
        .filter(
            task =>
                task.id !==
                item.id
        );


    if (
        openedTaskId ===
        item.id
    ) {

        openedTaskId =
            null;

    }


    renderTasks();

    queueSave();

}


/* =========================================
   GRID
========================================= */

gridButton.addEventListener(
    "click",
    () => {

        const shouldOpen =
            gridPanel.classList.contains(
                "hidden"
            );


        closeAllPanels();


        if (shouldOpen) {

            gridPanel.classList.remove(
                "hidden"
            );

        }

    }
);


document
    .querySelectorAll("[data-grid]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                data.global.grid =
                    button.dataset.grid;


                updateGridButtons();

                queueSave();

            }
        );

    });


const gridColor =
    document.getElementById(
        "gridColor"
    );


const gridColorValue =
    document.getElementById(
        "gridColorValue"
    );


gridColor.addEventListener(
    "input",
    () => {

        data.global.gridColor =
            gridColor.value;


        gridColorValue.textContent =
            gridColor.value.toUpperCase();


        queueSave();

    }
);


/* =========================================
   POINTER
========================================= */

pointerButton.addEventListener(
    "click",
    () => {

        const shouldOpen =
            pointerPanel.classList.contains(
                "hidden"
            );


        closeAllPanels();


        if (shouldOpen) {

            pointerPanel.classList.remove(
                "hidden"
            );

        }

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

                closeAllPanels();

            }
        );

    });


function closeAllPanels() {

    gridPanel.classList.add(
        "hidden"
    );

    pointerPanel.classList.add(
        "hidden"
    );

}


/* =========================================
   POINTER CONTROLS
========================================= */

const pointerSymbol =
    document.getElementById(
        "pointerSymbol"
    );


const pointerColor =
    document.getElementById(
        "pointerColor"
    );


const pointerColorValue =
    document.getElementById(
        "pointerColorValue"
    );


const pointerSize =
    document.getElementById(
        "pointerSize"
    );


const pointerSizeValue =
    document.getElementById(
        "pointerSizeValue"
    );


const pointerGradient =
    document.getElementById(
        "pointerGradient"
    );


const pointerGradientStart =
    document.getElementById(
        "pointerGradientStart"
    );


const pointerGradientEnd =
    document.getElementById(
        "pointerGradientEnd"
    );


const pointerGradientOptions =
    document.getElementById(
        "pointerGradientOptions"
    );


pointerSymbol.addEventListener(
    "change",
    () => {

        data.pointer.symbol =
            pointerSymbol.value;

        queueSave();

    }
);


pointerColor.addEventListener(
    "input",
    () => {

        data.pointer.color =
            pointerColor.value;

        pointerColorValue.textContent =
            pointerColor.value.toUpperCase();

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

        queueSave();

    }
);


pointerGradient.addEventListener(
    "change",
    () => {

        data.pointer.gradient =
            pointerGradient.checked;


        pointerGradientOptions.classList.toggle(
            "hidden",
            !pointerGradient.checked
        );


        queueSave();

    }
);


pointerGradientStart.addEventListener(
    "input",
    () => {

        data.pointer.gradientStart =
            pointerGradientStart.value;

        queueSave();

    }
);


pointerGradientEnd.addEventListener(
    "input",
    () => {

        data.pointer.gradientEnd =
            pointerGradientEnd.value;

        queueSave();

    }
);


/* =========================================
   SETTINGS UI
========================================= */

function updateGridButtons() {

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

}


function loadSettingsUI() {

    gridColor.value =
        data.global.gridColor;


    gridColorValue.textContent =
        data.global.gridColor
        .toUpperCase();


    updateGridButtons();


    pointerSymbol.value =
        data.pointer.symbol;


    pointerColor.value =
        data.pointer.color;


    pointerColorValue.textContent =
        data.pointer.color
        .toUpperCase();


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


    pointerGradientOptions.classList.toggle(
        "hidden",
        !data.pointer.gradient
    );

}


/* =========================================
   SAVE BUTTON
========================================= */

saveButton.addEventListener(
    "click",
    async () => {

        clearTimeout(saveTimer);

        await save();

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

}


start();
