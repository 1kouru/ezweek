import { supabase } from "./supabase.js";


/* =========================================================
   CONSTANTS
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


const DAY_NAMES = {
    MONDAY: "MONDAY",
    TUESDAY: "TUESDAY",
    WEDNESDAY: "WEDNESDAY",
    THURSDAY: "THURSDAY",
    FRIDAY: "FRIDAY",
    SATURDAY: "SATURDAY",
    SUNDAY: "SUNDAY"
};


const FONTS = [
    "Arial",
    "Helvetica",
    "Verdana",
    "Trebuchet MS",
    "Georgia",
    "Times New Roman",
    "Courier New",
    "Impact",
    "Tahoma",
    "Palatino Linotype",
    "Garamond",
    "Arial Black",
    "Comic Sans MS",
    "Century Gothic"
];


const BASE_COLORS = [
    "#111111",
    "#FFFFFF",
    "#E8E8E8",
    "#9A9A9A",
    "#FF4D4D",
    "#FF8A3D",
    "#FFC94A",
    "#77D36B",
    "#42C7B5",
    "#4EA5FF",
    "#7C6CFF",
    "#B96CFF",
    "#FF6FAE",
    "#FF9DBA",
    "#8D6E63",
    "#37474F",
    "#00BFA5",
    "#D500F9"
];


const ICON_COUNT = 10;


/* =========================================================
   STATE
========================================================= */

let selectedDay = "MONDAY";

let user = null;

let data = null;

let saveTimer = null;

let recentColors = [];

let openedTaskId = null;


/* =========================================================
   ELEMENTS
========================================================= */

const tasks = document.getElementById("tasks");

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

const copyDayButton =
    document.getElementById("copyDayButton");

const presetsButton =
    document.getElementById("presetsButton");

const gridPanel =
    document.getElementById("gridPanel");

const pointerPanel =
    document.getElementById("pointerPanel");

const copyDayPanel =
    document.getElementById("copyDayPanel");

const presetsPanel =
    document.getElementById("presetsPanel");

const modalOverlay =
    document.getElementById("modalOverlay");

const modalBox =
    document.getElementById("modalBox");

const nativeColorPicker =
    document.getElementById("nativeColorPicker");


/* =========================================================
   ID
========================================================= */

function createId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {
        return window.crypto.randomUUID();
    }


    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );

}


/* =========================================================
   CLONE
========================================================= */

function clone(value) {

    return JSON.parse(
        JSON.stringify(value)
    );

}


/* =========================================================
   DEFAULT DATA
========================================================= */

function defaultData() {

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

        },

        presets: {

            days: [],

            weeks: []

        }

    };

}


/* =========================================================
   DEFAULT TASK
========================================================= */

function createDefaultTask(copyFrom = null) {

    if (copyFrom) {

        const copied =
            clone(copyFrom);


        copied.id =
            createId();


        return copied;

    }


    return {

        id: createId(),

        time: "08:00",

        text: "NEW TASK",


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
   NORMALIZE
========================================================= */

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

        presets: {
            ...base.presets,
            ...(data.presets || {})
        },

        days: {
            ...base.days,
            ...(data.days || {})
        }

    };


    DAYS.forEach(day => {

        if (
            !Array.isArray(data.days[day])
        ) {

            data.days[day] = [];

        }


        data.days[day] =
            data.days[day].map(task => {

                return {

                    ...createDefaultTask(),

                    ...task,

                    id:
                        task.id ||
                        createId()

                };

            });

    });


    if (
        !Array.isArray(data.presets.days)
    ) {
        data.presets.days = [];
    }


    if (
        !Array.isArray(data.presets.weeks)
    ) {
        data.presets.weeks = [];
    }

}


/* =========================================================
   AUTH
========================================================= */

async function initUser() {

    try {

        const {
            data: sessionData
        } =
            await supabase
                .auth
                .getSession();


        if (!sessionData.session) {

            window.location.href =
                "auth.html";

            return false;

        }


        user =
            sessionData.session.user;


        return true;

    }

    catch (error) {

        console.error(error);

        setStatus("AUTH ERROR");

        return false;

    }

}


/* =========================================================
   LOAD
========================================================= */

async function loadData() {

    setStatus("LOADING...");


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


        data =
            row?.data ||
            defaultData();


        normalize();


        setStatus("READY");

    }

    catch (error) {

        console.error(
            "LOAD ERROR:",
            error
        );


        data =
            defaultData();


        setStatus("LOAD ERROR");

    }

}


/* =========================================================
   SAVE
========================================================= */

async function save() {

    if (!user || !data) {
        return false;
    }


    try {

        setStatus("SAVING...");

        saveButton.disabled = true;


        const {
            error
        } =
            await supabase

                .from("schedules")

                .upsert(
                    {

                        user_id: user.id,

                        data: data,

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


        setStatus("SAVED ✓");


        setTimeout(() => {

            if (
                saveStatus.textContent ===
                "SAVED ✓"
            ) {

                setStatus("READY");

            }

        }, 1200);


        return true;

    }

    catch (error) {

        console.error(
            "SAVE ERROR:",
            error
        );


        setStatus("ERROR");

        return false;

    }

    finally {

        saveButton.disabled = false;

    }

}


/* =========================================================
   AUTOSAVE
========================================================= */

function queueSave() {

    setStatus("UNSAVED");


    clearTimeout(saveTimer);


    saveTimer =
        setTimeout(
            save,
            600
        );

}


/* =========================================================
   STATUS
========================================================= */

function setStatus(text) {

    saveStatus.textContent =
        text;

}


/* =========================================================
   PANELS
========================================================= */

function closeGlobalPanels() {

    [
        gridPanel,
        pointerPanel,
        copyDayPanel,
        presetsPanel
    ]
        .forEach(panel => {

            panel.classList.add(
                "hidden"
            );

        });


    [
        gridButton,
        pointerButton
    ]
        .forEach(button => {

            button.classList.remove(
                "active"
            );

        });


    tasks.classList.remove(
        "hidden"
    );

}


function openPanel(panel, button = null) {

    const wasHidden =
        panel.classList.contains(
            "hidden"
        );


    closeGlobalPanels();


    if (wasHidden) {

        panel.classList.remove(
            "hidden"
        );


        tasks.classList.add(
            "hidden"
        );


        if (button) {

            button.classList.add(
                "active"
            );

        }


        openedTaskId = null;

    }

}


gridButton.addEventListener(
    "click",
    () => {

        openPanel(
            gridPanel,
            gridButton
        );

    }
);


pointerButton.addEventListener(
    "click",
    () => {

        openPanel(
            pointerPanel,
            pointerButton
        );

    }
);


copyDayButton.addEventListener(
    "click",
    () => {

        buildCopyDayChoices();

        openPanel(
            copyDayPanel
        );

    }
);


presetsButton.addEventListener(
    "click",
    () => {

        renderPresetLists();

        openPanel(
            presetsPanel
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


/* =========================================================
   DAYS
========================================================= */

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


                openedTaskId = null;


                closeGlobalPanels();

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


/* =========================================================
   ADD TASK
========================================================= */

addTaskButton.addEventListener(
    "click",
    () => {

        closeGlobalPanels();


        const list =
            data.days[selectedDay];


        const last =
            list.length
                ? list[list.length - 1]
                : null;


        const newTask =
            createDefaultTask(last);


        if (last) {

            newTask.time =
                addMinutes(
                    last.time,
                    30
                );

        }


        list.push(newTask);


        openedTaskId =
            newTask.id;


        renderTasks();

        queueSave();


        setTimeout(() => {

            const card =
                document.querySelector(
                    `[data-task-id="${newTask.id}"]`
                );


            if (card) {

                card.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }

        }, 100);

    }
);


/* =========================================================
   DUPLICATE
========================================================= */

function duplicateTask(item) {

    const copied =
        createDefaultTask(item);


    copied.time =
        addMinutes(
            item.time,
            30
        );


    data.days[selectedDay].push(
        copied
    );


    openedTaskId =
        copied.id;


    renderTasks();

    queueSave();


    setTimeout(() => {

        const card =
            document.querySelector(
                `[data-task-id="${copied.id}"]`
            );


        if (card) {

            card.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }

    }, 100);

}


/* =========================================================
   TIME
========================================================= */

function addMinutes(time, minutes) {

    const parts =
        String(time || "00:00")
            .split(":");


    const hours =
        Number(parts[0]) || 0;


    const mins =
        Number(parts[1]) || 0;


    let total =
        hours * 60 +
        mins +
        minutes;


    total =
        Math.max(
            0,
            Math.min(
                1439,
                total
            )
        );


    const h =
        String(
            Math.floor(total / 60)
        ).padStart(2, "0");


    const m =
        String(
            total % 60
        ).padStart(2, "0");


    return `${h}:${m}`;

}


/* =========================================================
   RENDER TASKS
========================================================= */

function getSortedTasks() {

    return [...data.days[selectedDay]]
        .sort(
            (a, b) =>
                a.time.localeCompare(
                    b.time
                )
        );

}


function renderTasks() {

    tasks.innerHTML = "";


    const items =
        getSortedTasks();


    if (!items.length) {

        const empty =
            document.createElement("div");


        empty.className =
            "empty";


        empty.textContent =
            "Tap ADD TASK to create your schedule";


        tasks.appendChild(empty);

        return;

    }


    items.forEach(item => {

        tasks.appendChild(
            createTaskCard(item)
        );

    });

}


/* =========================================================
   TASK CARD
========================================================= */

function createTaskCard(item) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "task-card";


    card.dataset.taskId =
        item.id;


    if (
        openedTaskId === item.id
    ) {

        card.classList.add(
            "open"
        );

    }


    /* PREVIEW */

    const preview =
        document.createElement(
            "div"
        );


    preview.className =
        "task-preview";


    const timePreview =
        document.createElement(
            "button"
        );


    timePreview.type =
        "button";


    timePreview.className =
        "task-time-preview";


    const textPreview =
        document.createElement(
            "button"
        );


    textPreview.type =
        "button";


    textPreview.className =
        "task-text-preview";


    const toggle =
        document.createElement(
            "button"
        );


    toggle.type =
        "button";


    toggle.className =
        "task-toggle";


    toggle.textContent =
        "+";


    preview.append(
        timePreview,
        textPreview,
        toggle
    );


    card.appendChild(preview);


    /* SETTINGS */

    const settings =
        document.createElement(
            "div"
        );


    settings.className =
        "task-settings";


    const timeGroup =
        createTimeGroup(
            item,
            updatePreview
        );


    const textGroup =
        createTextGroup(
            item,
            updatePreview
        );


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
        "duplicate-button";


    duplicate.textContent =
        "DUPLICATE";


    duplicate.addEventListener(
        "click",
        () => {

            duplicateTask(item);

        }
    );


    const remove =
        document.createElement(
            "button"
        );


    remove.type =
        "button";


    remove.className =
        "delete-button";


    remove.textContent =
        "DELETE";


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


            openedTaskId = null;


            renderTasks();

            queueSave();

        }
    );


    actions.append(
        duplicate,
        remove
    );


    settings.append(
        timeGroup,
        textGroup,
        actions
    );


    card.appendChild(settings);


    /* OPEN */

    function toggleCard() {

        if (
            openedTaskId === item.id
        ) {

            openedTaskId = null;

        }

        else {

            openedTaskId =
                item.id;

        }


        renderTasks();

    }


    toggle.addEventListener(
        "click",
        toggleCard
    );


    timePreview.addEventListener(
        "click",
        () => {

            openedTaskId =
                item.id;

            renderTasks();

            setTimeout(() => {

                const group =
                    document.querySelector(
                        `[data-task-id="${item.id}"] .task-setting-group`
                    );


                if (group) {

                    group.classList.add(
                        "active"
                    );

                }

            }, 30);

        }
    );


    textPreview.addEventListener(
        "click",
        () => {

            openedTaskId =
                item.id;

            renderTasks();

            setTimeout(() => {

                const groups =
                    document.querySelectorAll(
                        `[data-task-id="${item.id}"] .task-setting-group`
                    );


                if (groups[1]) {

                    groups[1].classList.add(
                        "active"
                    );

                }

            }, 30);

        }
    );


    function updatePreview() {

        timePreview.textContent =
            item.time;


        textPreview.textContent =
            item.text || "TASK";


        timePreview.style.color =
            item.timeColor;


        timePreview.style.fontSize =
            `${item.timeSize}px`;


        timePreview.style.fontWeight =
            item.timeWeight;


        textPreview.style.fontFamily =
            item.fontFamily;


        textPreview.style.fontSize =
            `${item.fontSize}px`;


        textPreview.style.fontWeight =
            item.fontWeight;


        if (item.gradient) {

            textPreview.style.background =
                `linear-gradient(
                    90deg,
                    ${item.gradientStart},
                    ${item.gradientEnd}
                )`;


            textPreview.style.webkitBackgroundClip =
                "text";


            textPreview.style.backgroundClip =
                "text";


            textPreview.style.webkitTextFillColor =
                "transparent";

        }

        else {

            textPreview.style.background =
                "none";


            textPreview.style.webkitTextFillColor =
                item.color;


            textPreview.style.color =
                item.color;

        }

    }


    updatePreview();


    return card;

}


/* =========================================================
   TIME GROUP
========================================================= */

function createTimeGroup(item, update) {

    const group =
        document.createElement(
            "section"
        );


    group.className =
        "task-setting-group";


    const header =
        document.createElement(
            "div"
        );


    header.className =
        "task-setting-header";


    const title =
        document.createElement(
            "div"
        );


    title.className =
        "task-setting-title";


    title.textContent =
        "TIME";


    const collapse =
        document.createElement(
            "button"
        );


    collapse.type =
        "button";


    collapse.className =
        "task-collapse-button";


    collapse.textContent =
        "⌄";


    header.append(
        title,
        collapse
    );


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "task-group-content";


    collapse.addEventListener(
        "click",
        () => {

            group.classList.toggle(
                "active"
            );

        }
    );


    const timeInput =
        document.createElement(
            "input"
        );


    timeInput.type =
        "time";


    timeInput.className =
        "time-edit";


    timeInput.value =
        item.time;


    timeInput.addEventListener(
        "input",
        () => {

            item.time =
                timeInput.value ||
                "00:00";


            update();

            queueSave();

        }
    );


    content.appendChild(
        timeInput
    );


    const controls =
        document.createElement(
            "div"
        );


    controls.className =
        "controls-grid";


    controls.appendChild(
        createRangeControl(
            "SIZE",
            8,
            30,
            item.timeSize,
            value => {

                item.timeSize =
                    Number(value);

                update();

            }
        )
    );


    controls.appendChild(
        createColorControl(
            item.timeColor,
            color => {

                item.timeColor =
                    color;

                update();

            }
        )
    );


    controls.appendChild(
        createRangeControl(
            "WEIGHT",
            300,
            900,
            item.timeWeight,
            value => {

                item.timeWeight =
                    Number(value);

                update();

            },
            100,
            true
        )
    );


    content.appendChild(
        controls
    );


    group.append(
        header,
        content
    );


    return group;

}


/* =========================================================
   TEXT GROUP
========================================================= */

function createTextGroup(item, update) {

    const group =
        document.createElement(
            "section"
        );


    group.className =
        "task-setting-group";


    const header =
        document.createElement(
            "div"
        );


    header.className =
        "task-setting-header";


    const title =
        document.createElement(
            "div"
        );


    title.className =
        "task-setting-title";


    title.textContent =
        "TEXT";


    const collapse =
        document.createElement(
            "button"
        );


    collapse.type =
        "button";


    collapse.className =
        "task-collapse-button";


    collapse.textContent =
        "⌄";


    header.append(
        title,
        collapse
    );


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "task-group-content";


    collapse.addEventListener(
        "click",
        () => {

            group.classList.toggle(
                "active"
            );

        }
    );


    const textInput =
        document.createElement(
            "input"
        );


    textInput.type =
        "text";


    textInput.className =
        "time-edit";


    textInput.value =
        item.text;


    textInput.placeholder =
        "Task name";


    textInput.addEventListener(
        "input",
        () => {

            item.text =
                textInput.value;

            update();

            queueSave();

        }
    );


    content.appendChild(
        textInput
    );


    const controls =
        document.createElement(
            "div"
        );


    controls.className =
        "controls-grid";


    controls.appendChild(
        createRangeControl(
            "SIZE",
            8,
            50,
            item.fontSize,
            value => {

                item.fontSize =
                    Number(value);

                update();

            }
        )
    );


    controls.appendChild(
        createColorControl(
            item.color,
            color => {

                item.color =
                    color;

                update();

            }
        )
    );


    controls.appendChild(
        createRangeControl(
            "WEIGHT",
            300,
            900,
            item.fontWeight,
            value => {

                item.fontWeight =
                    Number(value);

                update();

            },
            100
        )
    );


    const fontBox =
        document.createElement(
            "div"
        );


    fontBox.className =
        "control-box";


    const fontLabel =
        document.createElement(
            "label"
        );


    fontLabel.textContent =
        "FONT";


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


    fontButton.addEventListener(
        "click",
        () => {

            openFontPicker(
                item.fontFamily,
                font => {

                    item.fontFamily =
                        font;


                    fontButton.textContent =
                        font;


                    fontButton.style.fontFamily =
                        font;


                    update();

                    queueSave();

                }
            );

        }
    );


    fontBox.append(
        fontLabel,
        fontButton
    );


    controls.appendChild(
        fontBox
    );


    content.appendChild(
        controls
    );


    /* GRADIENT */

    const gradientToggle =
        document.createElement(
            "button"
        );


    gradientToggle.type =
        "button";


    gradientToggle.className =
        "gradient-toggle";


    const gradientText =
        document.createElement(
            "span"
        );


    gradientText.textContent =
        "GRADIENT";


    const gradientState =
        document.createElement(
            "span"
        );


    gradientState.textContent =
        item.gradient
            ? "ON"
            : "OFF";


    gradientToggle.append(
        gradientText,
        gradientState
    );


    const gradientOptions =
        document.createElement(
            "div"
        );


    gradientOptions.className =
        "gradient-options";


    if (item.gradient) {

        gradientOptions.classList.add(
            "active"
        );

    }


    gradientToggle.addEventListener(
        "click",
        () => {

            item.gradient =
                !item.gradient;


            gradientState.textContent =
                item.gradient
                    ? "ON"
                    : "OFF";


            gradientOptions.classList.toggle(
                "active",
                item.gradient
            );


            update();

            queueSave();

        }
    );


    const startButton =
        createColorControl(
            item.gradientStart,
            color => {

                item.gradientStart =
                    color;

                update();

            }
        );


    const endButton =
        createColorControl(
            item.gradientEnd,
            color => {

                item.gradientEnd =
                    color;

                update();

            }
        );


    gradientOptions.append(
        startButton,
        endButton
    );


    content.append(
        gradientToggle,
        gradientOptions
    );


    group.append(
        header,
        content
    );


    return group;

}


/* =========================================================
   RANGE CONTROL
========================================================= */

function createRangeControl(
    title,
    min,
    max,
    value,
    callback,
    step = 1,
    full = false
) {

    const box =
        document.createElement(
            "div"
        );


    box.className =
        "control-box";


    if (full) {

        box.classList.add(
            "full"
        );

    }


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


    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;


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


/* =========================================================
   COLOR CONTROL
========================================================= */

function createColorControl(
    color,
    callback
) {

    const box =
        document.createElement(
            "div"
        );


    box.className =
        "control-box";


    const label =
        document.createElement(
            "label"
        );


    label.textContent =
        "COLOR";


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "task-color-button";


    const swatch =
        document.createElement(
            "span"
        );


    const text =
        document.createElement(
            "span"
        );


    function updateButton(value) {

        swatch.style.background =
            value;


        text.textContent =
            value.toUpperCase();

    }


    updateButton(color);


    button.append(
        swatch,
        text
    );


    button.addEventListener(
        "click",
        () => {

            openColorPicker(
                color,
                selected => {

                    color =
                        selected;


                    updateButton(
                        selected
                    );


                    callback(
                        selected
                    );


                    queueSave();

                }
            );

        }
    );


    box.append(
        label,
        button
    );


    return box;

}


/* =========================================================
   COLOR MODAL
========================================================= */

function openColorPicker(
    currentColor,
    callback
) {

    modalBox.innerHTML =
        "";


    const title =
        document.createElement(
            "div"
        );


    title.className =
        "modal-title";


    title.textContent =
        "Choose color";


    const grid =
        document.createElement(
            "div"
        );


    grid.className =
        "color-grid";


    function addColor(
        color,
        parent
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "color-choice";


        button.style.background =
            color;


        if (
            color.toLowerCase() ===
            currentColor.toLowerCase()
        ) {

            button.classList.add(
                "active"
            );

        }


        button.addEventListener(
            "click",
            () => {

                addRecentColor(
                    color
                );


                callback(
                    color
                );


                closeModal();

            }
        );


        parent.appendChild(
            button
        );

    }


    BASE_COLORS.forEach(color => {

        addColor(
            color,
            grid
        );

    });


    modalBox.append(
        title,
        grid
    );


    if (recentColors.length) {

        const recentTitle =
            document.createElement(
                "div"
            );


        recentTitle.className =
            "recent-title";


        recentTitle.textContent =
            "RECENT";


        const recentGrid =
            document.createElement(
                "div"
            );


        recentGrid.className =
            "color-grid";


        recentColors.forEach(color => {

            addColor(
                color,
                recentGrid
            );

        });


        modalBox.append(
            recentTitle,
            recentGrid
        );

    }


    const nativeButton =
        document.createElement(
            "button"
        );


    nativeButton.type =
        "button";


    nativeButton.className =
        "native-picker-button";


    nativeButton.textContent =
        "MORE COLORS";


    nativeButton.addEventListener(
        "click",
        () => {

            nativeColorPicker.value =
                currentColor;


            nativeColorPicker.oninput =
                () => {

                    const color =
                        nativeColorPicker.value;


                    addRecentColor(
                        color
                    );


                    callback(
                        color
                    );

                };


            nativeColorPicker.onchange =
                () => {

                    closeModal();

                };


            nativeColorPicker.click();

        }
    );


    modalBox.appendChild(
        nativeButton
    );


    appendCloseButton();

    openModal();

}


function addRecentColor(color) {

    recentColors =
        [
            color,
            ...recentColors.filter(
                item =>
                    item !== color
            )
        ]
            .slice(0, 12);

}


/* =========================================================
   FONT PICKER
========================================================= */

function openFontPicker(
    current,
    callback
) {

    modalBox.innerHTML =
        "";


    const title =
        document.createElement(
            "div"
        );


    title.className =
        "modal-title";


    title.textContent =
        "Choose font";


    const list =
        document.createElement(
            "div"
        );


    list.className =
        "font-list";


    FONTS.forEach(font => {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "font-option";


        button.textContent =
            font;


        button.style.fontFamily =
            font;


        if (font === current) {

            button.classList.add(
                "active"
            );

        }


        button.addEventListener(
            "click",
            () => {

                callback(font);

                closeModal();

            }
        );


        list.appendChild(
            button
        );

    });


    modalBox.append(
        title,
        list
    );


    appendCloseButton();

    openModal();

}


/* =========================================================
   ICON PICKER
========================================================= */

function openIconPicker(
    currentIcon,
    callback
) {

    modalBox.innerHTML =
        "";


    const title =
        document.createElement(
            "div"
        );


    title.className =
        "modal-title";


    title.textContent =
        "Choose pointer";


    const grid =
        document.createElement(
            "div"
        );


    grid.className =
        "icon-grid";


    for (
        let i = 1;
        i <= ICON_COUNT;
        i++
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "icon-choice";


        if (i === Number(currentIcon)) {

            button.classList.add(
                "active"
            );

        }


        const image =
            document.createElement(
                "img"
            );


        image.src =
            `icons/${i}.png`;


        image.alt =
            "";


        image.onerror =
            () => {

                image.style.display =
                    "none";


                button.textContent =
                    i;

            };


        button.appendChild(
            image
        );


        button.addEventListener(
            "click",
            () => {

                callback(i);

                closeModal();

            }
        );


        grid.appendChild(
            button
        );

    }


    modalBox.append(
        title,
        grid
    );


    appendCloseButton();

    openModal();

}


/* =========================================================
   MODAL
========================================================= */

function openModal() {

    modalOverlay.classList.remove(
        "hidden"
    );

}


function closeModal() {

    modalOverlay.classList.add(
        "hidden"
    );


    nativeColorPicker.oninput =
        null;


    nativeColorPicker.onchange =
        null;

}


function appendCloseButton() {

    const close =
        document.createElement(
            "button"
        );


    close.type =
        "button";


    close.className =
        "modal-close";


    close.textContent =
        "CLOSE";


    close.addEventListener(
        "click",
        closeModal
    );


    modalBox.appendChild(
        close
    );

}


modalOverlay.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            modalOverlay
        ) {

            closeModal();

        }

    }
);


/* =========================================================
   CONFIRM MODAL
========================================================= */

function openConfirm(
    titleText,
    text,
    callback
) {

    modalBox.innerHTML =
        "";


    const title =
        document.createElement(
            "div"
        );


    title.className =
        "modal-title";


    title.textContent =
        titleText;


    const description =
        document.createElement(
            "div"
        );


    description.className =
        "confirm-text";


    description.textContent =
        text;


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "confirm-actions";


    const cancel =
        document.createElement(
            "button"
        );


    cancel.className =
        "confirm-cancel";


    cancel.textContent =
        "CANCEL";


    cancel.addEventListener(
        "click",
        closeModal
    );


    const confirm =
        document.createElement(
            "button"
        );


    confirm.className =
        "confirm-ok";


    confirm.textContent =
        "CONFIRM";


    confirm.addEventListener(
        "click",
        () => {

            closeModal();

            callback();

        }
    );


    actions.append(
        cancel,
        confirm
    );


    modalBox.append(
        title,
        description,
        actions
    );


    openModal();

}


/* =========================================================
   GRID
========================================================= */

document
    .querySelectorAll(
        "[data-grid-mode]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                data.global.gridMode =
                    button.dataset.gridMode;


                updateGridUI();

                queueSave();

            }
        );

    });


const gridThickness =
    document.getElementById(
        "gridThickness"
    );


const gridThicknessValue =
    document.getElementById(
        "gridThicknessValue"
    );


gridThickness.addEventListener(
    "input",
    () => {

        data.global.gridThickness =
            Number(
                gridThickness.value
            );


        updateGridUI();

        queueSave();

    }
);


document
    .getElementById(
        "gridColorButton"
    )
    .addEventListener(
        "click",
        () => {

            openColorPicker(
                data.global.gridColor,
                color => {

                    data.global.gridColor =
                        color;


                    updateGridUI();

                    queueSave();

                }
            );

        }
    );


function updateGridUI() {

    document
        .querySelectorAll(
            "[data-grid-mode]"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.gridMode ===
                data.global.gridMode
            );

        });


    gridThickness.value =
        data.global.gridThickness;


    gridThicknessValue.textContent =
        data.global.gridThickness;


    document
        .getElementById(
            "gridColorSwatch"
        )
        .style.background =
            data.global.gridColor;


    document
        .getElementById(
            "gridColorText"
        )
        .textContent =
            data.global.gridColor
                .toUpperCase();


    renderGridPreview();

}


function renderGridPreview() {

    const preview =
        document.getElementById(
            "gridLivePreview"
        );


    preview.innerHTML =
        "";


    const exampleTasks =
        getPreviewTasks();


    exampleTasks.forEach(task => {

        const row =
            createMiniRow(
                task,
                data.global
            );


        preview.appendChild(row);

    });

}


/* =========================================================
   MINI ROW
========================================================= */

function createMiniRow(
    task,
    gridSettings
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "mini-row";


    const time =
        document.createElement(
            "div"
        );


    time.className =
        "mini-time";


    time.textContent =
        task.time;


    time.style.color =
        task.timeColor;


    time.style.fontSize =
        `${Math.min(task.timeSize, 14)}px`;


    time.style.fontWeight =
        task.timeWeight;


    const text =
        document.createElement(
            "div"
        );


    text.className =
        "mini-task";


    text.textContent =
        task.text;


    text.style.fontFamily =
        task.fontFamily;


    text.style.fontSize =
        `${Math.min(task.fontSize, 16)}px`;


    text.style.fontWeight =
        task.fontWeight;


    if (task.gradient) {

        text.style.background =
            `linear-gradient(
                90deg,
                ${task.gradientStart},
                ${task.gradientEnd}
            )`;


        text.style.webkitBackgroundClip =
            "text";


        text.style.webkitTextFillColor =
            "transparent";

    }

    else {

        text.style.color =
            task.color;

    }


    const thickness =
        `${gridSettings.gridThickness}px solid ${gridSettings.gridColor}`;


    if (
        gridSettings.gridMode ===
        "rows"
    ) {

        row.style.borderBottom =
            thickness;

    }


    if (
        gridSettings.gridMode ===
        "grid"
    ) {

        row.style.borderBottom =
            thickness;


        time.style.borderRight =
            thickness;

    }


    row.append(
        time,
        text
    );


    return row;

}


/* =========================================================
   PREVIEW TASKS
========================================================= */

function getPreviewTasks() {

    const current =
        getSortedTasks()
            .slice(0, 3);


    if (current.length >= 2) {

        return current;

    }


    const defaults = [

        createDefaultTask(),

        {
            ...createDefaultTask(),
            time: "12:30",
            text: "Lunch"
        },

        {
            ...createDefaultTask(),
            time: "18:00",
            text: "Evening"
        }

    ];


    if (current.length === 1) {

        defaults[0] =
            current[0];

    }


    return defaults;

}


/* =========================================================
   POINTER
========================================================= */

const pointerSize =
    document.getElementById(
        "pointerSize"
    );


pointerSize.addEventListener(
    "input",
    () => {

        data.pointer.size =
            Number(
                pointerSize.value
            );


        updatePointerUI();

        queueSave();

    }
);


document
    .getElementById(
        "pointerIconButton"
    )
    .addEventListener(
        "click",
        () => {

            openIconPicker(
                data.pointer.icon,
                icon => {

                    data.pointer.icon =
                        icon;


                    updatePointerUI();

                    queueSave();

                }
            );

        }
    );


document
    .getElementById(
        "pointerColorButton"
    )
    .addEventListener(
        "click",
        () => {

            openColorPicker(
                data.pointer.color,
                color => {

                    data.pointer.color =
                        color;


                    updatePointerUI();

                    queueSave();

                }
            );

        }
    );


function updatePointerUI() {

    pointerSize.value =
        data.pointer.size;


    document
        .getElementById(
            "pointerSizeValue"
        )
        .textContent =
            data.pointer.size;


    const selected =
        document.getElementById(
            "selectedPointerIcon"
        );


    selected.innerHTML =
        "";


    const icon =
        document.createElement(
            "img"
        );


    icon.src =
        `icons/${data.pointer.icon}.png`;


    icon.style.filter =
        buildColorFilter(
            data.pointer.color
        );


    selected.appendChild(icon);


    document
        .getElementById(
            "pointerColorSwatch"
        )
        .style.background =
            data.pointer.color;


    document
        .getElementById(
            "pointerColorText"
        )
        .textContent =
            data.pointer.color
                .toUpperCase();


    renderPointerPreview();

}


/* =========================================================
   POINTER PREVIEW
========================================================= */

function renderPointerPreview() {

    const preview =
        document.getElementById(
            "pointerLivePreview"
        );


    preview.innerHTML =
        "";


    const task =
        getPreviewTasks()[0];


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "pointer-preview-row";


    const iconBox =
        document.createElement(
            "div"
        );


    const image =
        document.createElement(
            "img"
        );


    image.className =
        "pointer-preview-icon";


    image.src =
        `icons/${data.pointer.icon}.png`;


    image.style.width =
        `${data.pointer.size}px`;


    image.style.height =
        `${data.pointer.size}px`;


    image.style.filter =
        buildColorFilter(
            data.pointer.color
        );


    iconBox.appendChild(
        image
    );


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "pointer-preview-content";


    const time =
        document.createElement(
            "div"
        );


    time.textContent =
        task.time;


    time.style.color =
        task.timeColor;


    time.style.fontSize =
        `${task.timeSize}px`;


    time.style.fontWeight =
        task.timeWeight;


    const text =
        document.createElement(
            "div"
        );


    text.textContent =
        task.text;


    text.style.fontFamily =
        task.fontFamily;


    text.style.fontSize =
        `${Math.min(task.fontSize, 20)}px`;


    text.style.fontWeight =
        task.fontWeight;


    if (task.gradient) {

        text.style.background =
            `linear-gradient(
                90deg,
                ${task.gradientStart},
                ${task.gradientEnd}
            )`;


        text.style.webkitBackgroundClip =
            "text";


        text.style.webkitTextFillColor =
            "transparent";

    }

    else {

        text.style.color =
            task.color;

    }


    content.append(
        time,
        text
    );


    row.append(
        iconBox,
        content
    );


    preview.appendChild(row);

}


/* =========================================================
   PNG COLOR FILTER
========================================================= */

/*
    Работает лучше всего,
    если PNG белые/одноцветные
    и с прозрачным фоном.
*/

function buildColorFilter(color) {

    const hex =
        color.replace("#", "");


    if (hex === "111111") {
        return "brightness(0)";
    }


    if (hex === "FFFFFF") {
        return "brightness(0) invert(1)";
    }


    /*
       Универсальный вариант.
       Точное перекрашивание PNG через CSS
       зависит от исходной иконки.
    */

    return `
        brightness(0)
        saturate(100%)
        invert(50%)
    `;

}


/* =========================================================
   COPY DAY
========================================================= */

function buildCopyDayChoices() {

    const container =
        document.getElementById(
            "copyDayChoices"
        );


    container.innerHTML =
        "";


    DAYS
        .filter(
            day =>
                day !== selectedDay
        )
        .forEach(day => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.textContent =
                DAY_NAMES[day];


            button.addEventListener(
                "click",
                () => {

                    openConfirm(
                        "Copy schedule?",
                        `Replace ${DAY_NAMES[day]} with the current ${DAY_NAMES[selectedDay]} schedule?`,
                        () => {

                            data.days[day] =
                                clone(
                                    data.days[selectedDay]
                                )
                                .map(task => ({

                                    ...task,

                                    id:
                                        createId()

                                }));


                            queueSave();


                            closeGlobalPanels();

                        }
                    );

                }
            );


            container.appendChild(
                button
            );

        });

}


/* =========================================================
   PRESETS
========================================================= */

document
    .getElementById(
        "saveDayPreset"
    )
    .addEventListener(
        "click",
        () => {

            const name =
                `DAY ${new Date()
                    .toLocaleDateString()}`;


            data.presets.days.push(
                {

                    id: createId(),

                    name,

                    day: clone(
                        data.days[selectedDay]
                    )

                }
            );


            queueSave();

            renderPresetLists();

        }
    );


document
    .getElementById(
        "saveWeekPreset"
    )
    .addEventListener(
        "click",
        () => {

            const name =
                `WEEK ${new Date()
                    .toLocaleDateString()}`;


            data.presets.weeks.push(
                {

                    id: createId(),

                    name,

                    days: clone(
                        data.days
                    ),

                    global: clone(
                        data.global
                    ),

                    pointer: clone(
                        data.pointer
                    )

                }
            );


            queueSave();

            renderPresetLists();

        }
    );


function renderPresetLists() {

    const dayList =
        document.getElementById(
            "dayPresetList"
        );


    const weekList =
        document.getElementById(
            "weekPresetList"
        );


    dayList.innerHTML =
        "";


    weekList.innerHTML =
        "";


    if (
        !data.presets.days.length
    ) {

        dayList.innerHTML =
            `<div class="empty">NO SAVED DAYS</div>`;

    }


    data.presets.days.forEach(preset => {

        dayList.appendChild(
            createPresetItem(
                preset,
                () => {

                    openConfirm(
                        "Load day?",
                        "Your current day will be replaced.",
                        () => {

                            data.days[selectedDay] =
                                clone(
                                    preset.day
                                )
                                .map(task => ({

                                    ...task,

                                    id:
                                        createId()

                                }));


                            openedTaskId =
                                null;


                            renderTasks();

                            queueSave();

                            closeGlobalPanels();

                        }
                    );

                },
                () => {

                    data.presets.days =
                        data.presets.days
                            .filter(
                                item =>
                                    item.id !==
                                    preset.id
                            );


                    queueSave();

                    renderPresetLists();

                }
            )
        );

    });


    if (
        !data.presets.weeks.length
    ) {

        weekList.innerHTML =
            `<div class="empty">NO SAVED WEEKS</div>`;

    }


    data.presets.weeks.forEach(preset => {

        weekList.appendChild(
            createPresetItem(
                preset,
                () => {

                    openConfirm(
                        "Load week?",
                        "Your entire current schedule will be replaced.",
                        () => {

                            data.days =
                                clone(
                                    preset.days
                                );


                            data.global =
                                clone(
                                    preset.global
                                );


                            data.pointer =
                                clone(
                                    preset.pointer
                                );


                            normalize();


                            openedTaskId =
                                null;


                            updateGridUI();

                            updatePointerUI();

                            renderTasks();

                            queueSave();

                            closeGlobalPanels();

                        }
                    );

                },
                () => {

                    data.presets.weeks =
                        data.presets.weeks
                            .filter(
                                item =>
                                    item.id !==
                                    preset.id
                            );


                    queueSave();

                    renderPresetLists();

                }
            )
        );

    });

}


function createPresetItem(
    preset,
    onLoad,
    onDelete
) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "preset-item";


    const name =
        document.createElement(
            "div"
        );


    name.className =
        "preset-name";


    name.textContent =
        preset.name;


    const load =
        document.createElement(
            "button"
        );


    load.type =
        "button";


    load.className =
        "preset-load";


    load.textContent =
        "LOAD";


    load.addEventListener(
        "click",
        onLoad
    );


    const remove =
        document.createElement(
            "button"
        );


    remove.type =
        "button";


    remove.className =
        "preset-delete";


    remove.textContent =
        "×";


    remove.addEventListener(
        "click",
        onDelete
    );


    item.append(
        name,
        load,
        remove
    );


    return item;

}


/* =========================================================
   SAVE BUTTON
========================================================= */

saveButton.addEventListener(
    "click",
    async () => {

        clearTimeout(saveTimer);

        await save();

    }
);


/* =========================================================
   INITIAL UI
========================================================= */

function loadSettingsUI() {

    updateGridUI();

    updatePointerUI();

}


/* =========================================================
   START
========================================================= */

async function start() {

    try {

        const authenticated =
            await initUser();


        if (!authenticated) {
            return;
        }


        await loadData();


        updateTabs();

        loadSettingsUI();

        renderTasks();

    }

    catch (error) {

        console.error(
            "EDITOR START ERROR:",
            error
        );


        setStatus(
            "EDITOR ERROR"
        );


        /*
            Даже если что-то пошло не так,
            пытаемся оставить редактор рабочим.
        */

        if (!data) {

            data =
                defaultData();

        }


        updateTabs();

        loadSettingsUI();

        renderTasks();

    }

}


start();
