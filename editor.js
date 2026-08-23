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


const BASIC_COLORS = [
    "#111111",
    "#333333",
    "#666666",
    "#999999",
    "#CCCCCC",
    "#FFFFFF",

    "#FF3B30",
    "#FF6B6B",
    "#FF9500",
    "#FFCC00",
    "#34C759",
    "#30D158",
    "#00C7BE",
    "#32ADE6",
    "#007AFF",
    "#5856D6",
    "#AF52DE",
    "#FF2D55",

    "#7C5CFF",
    "#FF4ECD",
    "#FF7A59",
    "#6C63FF",
    "#2DD4BF",
    "#F59E0B"
];


const FONTS = [
    ["Arial", "Arial"],
    ["Helvetica", "Helvetica"],
    ["Verdana", "Verdana"],
    ["Trebuchet MS", "Trebuchet"],
    ["Tahoma", "Tahoma"],
    ["Georgia", "Georgia"],
    ["Times New Roman", "Times"],
    ["Garamond", "Garamond"],
    ["Palatino Linotype", "Palatino"],
    ["Courier New", "Courier"],
    ["Lucida Console", "Console"],
    ["Impact", "Impact"],
    ["Arial Black", "Arial Black"],
    ["Brush Script MT", "Brush Script"],
    ["Comic Sans MS", "Comic Sans"]
];


let selectedDay = "MONDAY";
let user = null;
let data = null;
let saveTimer = null;

let openTaskId = null;

let colorTarget = null;

let currentColor = "#111111";


/* =========================================================
   ELEMENTS
========================================================= */

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

const gridColor =
    document.getElementById("gridColor");

const gridThickness =
    document.getElementById("gridThickness");

const gridThicknessValue =
    document.getElementById("gridThicknessValue");

const pointerSize =
    document.getElementById("pointerSize");

const pointerSizeValue =
    document.getElementById("pointerSizeValue");

const pointerGradient =
    document.getElementById("pointerGradient");

const pointerGradientOptions =
    document.getElementById("pointerGradientOptions");

const colorModal =
    document.getElementById("colorModal");

const fontModal =
    document.getElementById("fontModal");

const iconModal =
    document.getElementById("iconModal");

const systemColorInput =
    document.getElementById("systemColorInput");


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

            size: 24,

            gradient: false,

            gradientStart: "#FF4ECD",

            gradientEnd: "#7C5CFF"

        }

    };

}


/* =========================================================
   TASK
========================================================= */

function createDefaultTask(copy = null) {

    if (copy) {

        const cloned =
            JSON.parse(
                JSON.stringify(copy)
            );

        cloned.id =
            crypto.randomUUID();

        return cloned;

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
            "#FF4ECD",

        gradientEnd:
            "#7C5CFF",


        icon:
            1,

        iconColor:
            "#111111"

    };

}


/* =========================================================
   AUTH
========================================================= */

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


/* =========================================================
   LOAD
========================================================= */

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

        return;

    }


    data =
        row?.data ||
        defaultData();


    normalize();

    setStatus("READY");

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

        days: {
            ...base.days,
            ...(data.days || {})
        }

    };


    /*
     * Старый формат grid
     */

    if (
        data.global.grid &&
        !data.global.gridMode
    ) {

        data.global.gridMode =
            "rows";

    }


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


/* =========================================================
   SAVE
========================================================= */

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

        console.error(error);

        setStatus("ERROR");

        alert(
            "Ошибка сохранения:\n\n" +
            error.message
        );

        return false;

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


function queueSave() {

    setStatus("UNSAVED");

    clearTimeout(saveTimer);

    saveTimer =
        setTimeout(
            save,
            700
        );

}


function setStatus(text) {

    saveStatus.textContent =
        text;

}


/* =========================================================
   GLOBAL PANELS
========================================================= */

function closeTasks() {

    openTaskId = null;

    document
        .querySelectorAll(".task-card.open")
        .forEach(card => {

            card.classList.remove("open");

        });

}


function closeGlobalPanels() {

    gridPanel.classList.add("hidden");
    pointerPanel.classList.add("hidden");

    gridButton.classList.remove("active");
    pointerButton.classList.remove("active");

}


function openGlobalPanel(panel) {

    const alreadyOpen =
        !panel.classList.contains("hidden");


    closeGlobalPanels();

    closeTasks();


    if (!alreadyOpen) {

        panel.classList.remove("hidden");

        if (panel === gridPanel) {
            gridButton.classList.add("active");
        }

        if (panel === pointerPanel) {
            pointerButton.classList.add("active");
        }

    }

}


gridButton.addEventListener(
    "click",
    () => {

        openGlobalPanel(gridPanel);

    }
);


pointerButton.addEventListener(
    "click",
    () => {

        openGlobalPanel(pointerPanel);

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

                renderTasks();

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


/* =========================================================
   ADD TASK
========================================================= */

addTaskButton.addEventListener(
    "click",
    () => {

        closeGlobalPanels();

        /*
         * Предыдущая задача закрывается.
         */

        openTaskId = null;


        const current =
            data.days[selectedDay];


        const last =
            current.length
                ? current[current.length - 1]
                : null;


        const task =
            createDefaultTask(last);


        /*
         * Настройки последней задачи
         * копируются.
         */

        if (last) {

            task.time =
                addMinutes(
                    last.time,
                    30
                );

        }


        current.push(task);

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

        }, 80);

    }
);


/* =========================================================
   DUPLICATE
========================================================= */

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


    setTimeout(() => {

        const card =
            document.querySelector(
                `[data-task-id="${copy.id}"]`
            );

        if (card) {

            card.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }

    }, 80);

}


/* =========================================================
   TIME
========================================================= */

function addMinutes(time, minutes) {

    const parts =
        time
            .split(":")
            .map(Number);


    let total =
        parts[0] * 60 +
        parts[1] +
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
   RENDER
========================================================= */

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


    if (item.id === openTaskId) {

        card.classList.add("open");

    }


    /* -----------------------------------------
       PREVIEW
    ----------------------------------------- */

    const preview =
        document.createElement("div");

    preview.className =
        "task-preview";


    const timePreview =
        document.createElement("div");

    timePreview.className =
        "task-time-preview";


    const textPreview =
        document.createElement("div");

    textPreview.className =
        "task-text-preview";


    const toggle =
        document.createElement("button");

    toggle.type = "button";

    toggle.className =
        "task-preview-toggle";

    toggle.textContent = "⌄";


    preview.append(
        timePreview,
        textPreview,
        toggle
    );


    card.appendChild(
        preview
    );


    /* -----------------------------------------
       SETTINGS
    ----------------------------------------- */

    const settings =
        document.createElement("div");

    settings.className =
        "task-settings";


    card.appendChild(
        settings
    );


    /* -----------------------------------------
       TIME
    ----------------------------------------- */

    const timeSection =
        document.createElement("section");

    timeSection.className =
        "task-section";


    timeSection.innerHTML = `
        <div class="section-head">
            <div class="section-title">TIME</div>
        </div>
    `;


    const timeInput =
        document.createElement("input");

    timeInput.type =
        "time";

    timeInput.className =
        "time-editor";

    timeInput.value =
        item.time;


    timeSection.appendChild(
        timeInput
    );


    const timeControls =
        document.createElement("div");

    timeControls.className =
        "time-controls";


    timeControls.appendChild(
        rangeControl(
            "SIZE",
            8,
            25,
            item.timeSize,
            value => {

                item.timeSize =
                    Number(value);

                updatePreview();

            }
        )
    );


    timeControls.appendChild(
        colorCompactControl(
            item.timeColor,
            value => {

                item.timeColor =
                    value;

                updatePreview();

            }
        )
    );


    timeControls.appendChild(
        rangeControl(
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


    settings.appendChild(
        timeSection
    );

    timeSection.appendChild(
        timeControls
    );


    /* -----------------------------------------
       TEXT
    ----------------------------------------- */

    const textSection =
        document.createElement("section");

    textSection.className =
        "task-section";


    textSection.innerHTML = `
        <div class="section-head">
            <div class="section-title">TEXT</div>
        </div>
    `;


    const textInput =
        document.createElement("textarea");

    textInput.className =
        "text-editor";

    textInput.rows = 1;

    textInput.value =
        item.text;


    textSection.appendChild(
        textInput
    );


    const textControls =
        document.createElement("div");

    textControls.className =
        "text-controls";


    textControls.appendChild(
        rangeControl(
            "SIZE",
            8,
            50,
            item.fontSize,
            value => {

                item.fontSize =
                    Number(value);

                updatePreview();

            }
        )
    );


    textControls.appendChild(
        colorCompactControl(
            item.color,
            value => {

                item.color =
                    value;

                updatePreview();

            }
        )
    );


    textControls.appendChild(
        rangeControl(
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


    textSection.appendChild(
        textControls
    );


    /* -----------------------------------------
       FONT
    ----------------------------------------- */

    const fontButton =
        document.createElement("button");

    fontButton.type = "button";

    fontButton.className =
        "font-button";


    const fontPreview =
        document.createElement("span");

    fontPreview.className =
        "font-button-preview";

    fontPreview.textContent =
        item.fontFamily;


    const fontArrow =
        document.createElement("span");

    fontArrow.className =
        "font-button-arrow";

    fontArrow.textContent =
        "›";


    fontButton.append(
        fontPreview,
        fontArrow
    );


    fontButton.addEventListener(
        "click",
        () => {

            openFontPicker(
                item,
                updatePreview
            );

        }
    );


    textSection.appendChild(
        fontButton
    );


    /* -----------------------------------------
       GRADIENT
    ----------------------------------------- */

    const gradientBox =
        document.createElement("div");

    gradientBox.className =
        "gradient-box";


    const gradientHeader =
        document.createElement("div");

    gradientHeader.className =
        "gradient-header";


    gradientHeader.innerHTML = `
        <label>
            <input
                type="checkbox"
                ${item.gradient ? "checked" : ""}
            >
            GRADIENT
        </label>
    `;


    gradientBox.appendChild(
        gradientHeader
    );


    const gradientColors =
        document.createElement("div");

    gradientColors.className =
        "gradient-colors";


    if (!item.gradient) {

        gradientColors.classList.add(
            "hidden"
        );

    }


    gradientColors.append(
        makeColorTrigger(
            item.gradientStart,
            value => {

                item.gradientStart =
                    value;

                updatePreview();

            }
        ),

        makeColorTrigger(
            item.gradientEnd,
            value => {

                item.gradientEnd =
                    value;

                updatePreview();

            }
        )
    );


    gradientBox.appendChild(
        gradientColors
    );


    const gradientCheckbox =
        gradientHeader.querySelector(
            "input"
        );


    gradientCheckbox.addEventListener(
        "change",
        () => {

            item.gradient =
                gradientCheckbox.checked;


            gradientColors.classList.toggle(
                "hidden",
                !item.gradient
            );


            updatePreview();

            queueSave();

        }
    );


    textSection.appendChild(
        gradientBox
    );


    settings.appendChild(
        textSection
    );


    /* -----------------------------------------
       ICON
    ----------------------------------------- */

    const iconSection =
        document.createElement("section");

    iconSection.className =
        "task-section";


    const iconHead =
        document.createElement("div");

    iconHead.className =
        "section-head";


    iconHead.innerHTML = `
        <div class="section-title">ICON</div>
    `;


    iconSection.appendChild(
        iconHead
    );


    const iconButton =
        document.createElement("button");

    iconButton.type =
        "button";

    iconButton.className =
        "setting-big-button";


    const iconShape =
        document.createElement("span");

    iconShape.className =
        "icon-display";


    const iconInfo =
        document.createElement("span");

    iconInfo.innerHTML = `
        <b>CHANGE ICON</b>
        <small>your PNG icons</small>
    `;


    const iconArrow =
        document.createElement("i");

    iconArrow.textContent =
        "›";


    iconButton.append(
        iconShape,
        iconInfo,
        iconArrow
    );


    iconButton.addEventListener(
        "click",
        () => {

            openIconPicker(
                item,
                updatePreview
            );

        }
    );


    iconSection.appendChild(
        iconButton
    );


    iconSection.appendChild(
        makeColorSetting(
            "ICON COLOR",
            item.iconColor,
            value => {

                item.iconColor =
                    value;

                updatePreview();

            }
        )
    );


    settings.appendChild(
        iconSection
    );


    /* -----------------------------------------
       ACTIONS
    ----------------------------------------- */

    const actions =
        document.createElement("div");

    actions.className =
        "task-actions";


    const duplicate =
        document.createElement("button");

    duplicate.type =
        "button";

    duplicate.className =
        "duplicate-button";

    duplicate.textContent =
        "DUPLICATE";


    const deleteButton =
        document.createElement("button");

    deleteButton.type =
        "button";

    deleteButton.className =
        "delete-button";

    deleteButton.textContent =
        "DELETE";


    actions.append(
        duplicate,
        deleteButton
    );


    settings.appendChild(
        actions
    );


    /* -----------------------------------------
       EVENTS
    ----------------------------------------- */

    toggle.addEventListener(
        "click",
        () => {

            if (
                openTaskId === item.id
            ) {

                openTaskId = null;

            }

            else {

                openTaskId =
                    item.id;

            }


            document
                .querySelectorAll(
                    ".task-card"
                )
                .forEach(other => {

                    other.classList.toggle(
                        "open",
                        other.dataset.taskId ===
                        openTaskId
                    );

                });

        }
    );


    timeInput.addEventListener(
        "change",
        () => {

            item.time =
                timeInput.value ||
                "00:00";

            updatePreview();

            queueSave();

        }
    );


    textInput.addEventListener(
        "input",
        () => {

            item.text =
                textInput.value;

            updatePreview();

            queueSave();

        }
    );


    duplicate.addEventListener(
        "click",
        () => {

            duplicateTask(item);

        }
    );


    deleteButton.addEventListener(
        "click",
        () => {

            data.days[selectedDay] =
                data.days[selectedDay]
                    .filter(
                        task =>
                            task.id !==
                            item.id
                    );


            openTaskId = null;

            renderTasks();

            queueSave();

        }
    );


    /* -----------------------------------------
       PREVIEW UPDATE
    ----------------------------------------- */

    function updatePreview() {

        timePreview.textContent =
            item.time;


        textPreview.textContent =
            item.text ||
            "TASK";


        /* TIME */

        timePreview.style.color =
            item.timeColor;

        timePreview.style.fontSize =
            `${item.timeSize}px`;

        timePreview.style.fontWeight =
            item.timeWeight;


        /* TEXT */

        textPreview.style.fontFamily =
            item.fontFamily;

        textPreview.style.fontSize =
            `${item.fontSize}px`;

        textPreview.style.fontWeight =
            item.fontWeight;


        if (item.gradient) {

            textPreview.style.backgroundImage =
                `linear-gradient(
                    90deg,
                    ${item.gradientStart},
                    ${item.gradientEnd}
                )`;

            textPreview.style.backgroundClip =
                "text";

            textPreview.style.webkitBackgroundClip =
                "text";

            textPreview.style.color =
                "transparent";

            textPreview.style.webkitTextFillColor =
                "transparent";

        }

        else {

            textPreview.style.backgroundImage =
                "none";

            textPreview.style.backgroundClip =
                "initial";

            textPreview.style.webkitBackgroundClip =
                "initial";

            textPreview.style.color =
                item.color;

            textPreview.style.webkitTextFillColor =
                item.color;

        }


        /* ICON */

        applyIcon(
            iconShape,
            item.icon,
            item.iconColor
        );

        applyIcon(
            document.querySelector(
                ".real-preview-icon"
            ),
            1,
            "#111"
        );


        fontPreview.textContent =
            item.fontFamily;

        fontPreview.style.fontFamily =
            item.fontFamily;

    }


    updatePreview();


    return card;

}


/* =========================================================
   RANGE
========================================================= */

function rangeControl(
    title,
    min,
    max,
    value,
    callback,
    step = 1
) {

    const box =
        document.createElement("div");

    box.className =
        "compact-control";


    const label =
        document.createElement("label");


    const titleSpan =
        document.createElement("span");

    titleSpan.textContent =
        title;


    const output =
        document.createElement("output");

    output.textContent =
        value;


    label.append(
        titleSpan,
        output
    );


    const input =
        document.createElement("input");


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


/* =========================================================
   COLOR CONTROL
========================================================= */

function colorCompactControl(
    value,
    callback
) {

    const box =
        document.createElement("div");

    box.className =
        "compact-control";


    const label =
        document.createElement("label");

    label.innerHTML =
        `<span>COLOR</span>`;


    const trigger =
        makeColorTrigger(
            value,
            callback
        );


    box.append(
        label,
        trigger
    );


    return box;

}


function makeColorSetting(
    title,
    value,
    callback
) {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "color-setting";


    const label =
        document.createElement("span");

    label.textContent =
        title;


    const trigger =
        makeColorTrigger(
            value,
            callback
        );


    wrapper.append(
        label,
        trigger
    );


    return wrapper;

}


function makeColorTrigger(
    value,
    callback
) {

    const button =
        document.createElement("button");

    button.type =
        "button";

    button.className =
        "color-trigger";

    button.dataset.color =
        value;


    const circle =
        document.createElement("span");

    circle.className =
        "color-circle";

    circle.style.background =
        value;


    const hex =
        document.createElement("span");

    hex.className =
        "color-value";

    hex.textContent =
        value.toUpperCase();


    button.append(
        circle,
        hex
    );


    button.addEventListener(
        "click",
        () => {

            openColorPicker(
                value,
                newValue => {

                    circle.style.background =
                        newValue;

                    hex.textContent =
                        newValue.toUpperCase();

                    button.dataset.color =
                        newValue;

                    callback(
                        newValue
                    );

                }
            );

        }
    );


    return button;

}


/* =========================================================
   COLOR PICKER
========================================================= */

function openColorPicker(
    value,
    callback
) {

    colorTarget =
        callback;

    currentColor =
        value ||
        "#111111";


    updateColorModal();

    colorModal.classList.remove(
        "hidden"
    );

}


function updateColorModal() {

    const preview =
        document.getElementById(
            "largeColorPreview"
        );

    const hex =
        document.getElementById(
            "largeColorHex"
        );


    preview.style.background =
        currentColor;

    hex.textContent =
        currentColor.toUpperCase();


    buildBasicColors();

    buildRecentColors();

}


function buildBasicColors() {

    const container =
        document.getElementById(
            "basicColors"
        );


    container.innerHTML = "";


    BASIC_COLORS.forEach(color => {

        const button =
            document.createElement("button");

        button.type =
            "button";

        button.className =
            "color-swatch";

        button.style.background =
            color;


        if (
            color.toLowerCase() ===
            currentColor.toLowerCase()
        ) {

            button.classList.add(
                "selected"
            );

        }


        button.addEventListener(
            "click",
            () => {

                selectColor(color);

            }
        );


        container.appendChild(
            button
        );

    });

}


function getRecentColors() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "recentColors"
            )
        ) || [];

    }

    catch {

        return [];

    }

}


function saveRecentColor(color) {

    let colors =
        getRecentColors();


    colors =
        colors.filter(
            item =>
                item.toLowerCase() !==
                color.toLowerCase()
        );


    colors.unshift(color);


    colors =
        colors.slice(0, 16);


    localStorage.setItem(
        "recentColors",
        JSON.stringify(colors)
    );

}


function buildRecentColors() {

    const container =
        document.getElementById(
            "recentColors"
        );


    container.innerHTML = "";


    const colors =
        getRecentColors();


    if (!colors.length) {

        const empty =
            document.createElement("span");

        empty.style.gridColumn =
            "1 / -1";

        empty.style.color =
            "#aaa";

        empty.style.fontSize =
            "8px";

        empty.textContent =
            "Your recently used colors will appear here";

        container.appendChild(
            empty
        );

        return;

    }


    colors.forEach(color => {

        const button =
            document.createElement("button");

        button.type =
            "button";

        button.className =
            "color-swatch";

        button.style.background =
            color;


        button.addEventListener(
            "click",
            () => {

                selectColor(color);

            }
        );


        container.appendChild(
            button
        );

    });

}


function selectColor(color) {

    currentColor =
        color;


    saveRecentColor(
        color
    );


    if (colorTarget) {

        colorTarget(
            color
        );

    }


    updateColorModal();

}


/* COLOR MODAL */

document
    .getElementById(
        "closeColorModal"
    )
    .addEventListener(
        "click",
        closeColorModal
    );


document
    .querySelector(
        "#colorModal .modal-backdrop"
    )
    .addEventListener(
        "click",
        closeColorModal
    );


function closeColorModal() {

    colorModal.classList.add(
        "hidden"
    );

    colorTarget = null;

}


/* SYSTEM PICKER */

document
    .getElementById(
        "systemColorButton"
    )
    .addEventListener(
        "click",
        () => {

            systemColorInput.value =
                currentColor;

            systemColorInput.click();

        }
    );


systemColorInput.addEventListener(
    "input",
    () => {

        selectColor(
            systemColorInput.value
        );

    }
);


/* =========================================================
   FONT PICKER
========================================================= */

function openFontPicker(
    item,
    update
) {

    const list =
        document.getElementById(
            "fontList"
        );


    list.innerHTML = "";


    FONTS.forEach(
        ([font, label]) => {

            const button =
                document.createElement("button");

            button.type =
                "button";

            button.className =
                "font-option";


            if (
                item.fontFamily ===
                font
            ) {

                button.classList.add(
                    "selected"
                );

            }


            const name =
                document.createElement("span");

            name.className =
                "font-option-name";

            name.textContent =
                label;

            name.style.fontFamily =
                font;


            const small =
                document.createElement("span");

            small.className =
                "font-option-label";

            small.textContent =
                font;


            button.append(
                name,
                small
            );


            button.addEventListener(
                "click",
                () => {

                    item.fontFamily =
                        font;

                    update();

                    queueSave();

                    fontModal.classList.add(
                        "hidden"
                    );

                }
            );


            list.appendChild(
                button
            );

        }
    );


    fontModal.classList.remove(
        "hidden"
    );

}


document
    .getElementById(
        "closeFontModal"
    )
    .addEventListener(
        "click",
        () => {

            fontModal.classList.add(
                "hidden"
            );

        }
    );


document
    .querySelector(
        "#fontModal .modal-backdrop"
    )
    .addEventListener(
        "click",
        () => {

            fontModal.classList.add(
                "hidden"
            );

        }
    );


/* =========================================================
   ICONS
========================================================= */

function iconUrl(number) {

    return `icons/${number}.png`;

}


function applyIcon(
    element,
    number,
    color
) {

    if (!element) {
        return;
    }


    const url =
        `url("${iconUrl(number)}")`;


    element.style.maskImage =
        url;

    element.style.webkitMaskImage =
        url;

    element.style.background =
        color || "#111";

}


function openIconPicker(
    item,
    update
) {

    const list =
        document.getElementById(
            "iconList"
        );


    list.innerHTML = "";


    for (
        let i = 1;
        i <= 10;
        i++
    ) {

        const button =
            document.createElement("button");

        button.type =
            "button";

        button.className =
            "icon-option";


        if (
            Number(item.icon) === i
        ) {

            button.classList.add(
                "selected"
            );

        }


        const shape =
            document.createElement("span");

        shape.className =
            "icon-option-shape";


        applyIcon(
            shape,
            i,
            "#111"
        );


        button.appendChild(
            shape
        );


        button.addEventListener(
            "click",
            () => {

                item.icon =
                    i;

                update();

                queueSave();

                iconModal.classList.add(
                    "hidden"
                );

            }
        );


        list.appendChild(
            button
        );

    }


    iconModal.classList.remove(
        "hidden"
    );

}


document
    .getElementById(
        "closeIconModal"
    )
    .addEventListener(
        "click",
        () => {

            iconModal.classList.add(
                "hidden"
            );

        }
    );


document
    .querySelector(
        "#iconModal .modal-backdrop"
    )
    .addEventListener(
        "click",
        () => {

            iconModal.classList.add(
                "hidden"
            );

        }
    );


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
        `${data.global.gridThickness} px`;


    updateGridPreview();

}


/* =========================================================
   GRID PREVIEW
========================================================= */

function updateGridPreview() {

    const preview =
        document.querySelector(
            ".grid-real-preview"
        );


    const lines =
        preview.querySelectorAll(
            ".preview-line"
        );


    const vertical =
        preview.querySelector(
            ".preview-vertical"
        );


    const color =
        data.global.gridColor;


    lines.forEach(line => {

        line.style.background =
            color;

        line.style.height =
            `${data.global.gridThickness}px`;

    });


    vertical.style.background =
        color;

    vertical.style.width =
        `${data.global.gridThickness}px`;


    vertical.style.display =
        data.global.gridMode === "grid"
            ? "block"
            : "none";

}


/* =========================================================
   POINTER
========================================================= */

pointerSize.addEventListener(
    "input",
    () => {

        data.pointer.size =
            Number(
                pointerSize.value
            );

        pointerSizeValue.textContent =
            pointerSize.value;

        updatePointerUI();

        queueSave();

    }
);


pointerGradient.addEventListener(
    "change",
    () => {

        data.pointer.gradient =
            pointerGradient.checked;


        pointerGradientOptions
            .classList.toggle(
                "hidden",
                !data.pointer.gradient
            );


        updatePointerUI();

        queueSave();

    }
);


function updatePointerUI() {

    pointerSize.value =
        data.pointer.size;

    pointerSizeValue.textContent =
        data.pointer.size;


    pointerGradient.checked =
        data.pointer.gradient;


    pointerGradientOptions
        .classList.toggle(
            "hidden",
            !data.pointer.gradient
        );


    const icon =
        document.querySelector(
            ".pointer-preview-icon"
        );


    const selected =
        document.getElementById(
            "selectedIcon"
        );


    applyIcon(
        icon,
        data.pointer.icon,
        data.pointer.color
    );


    applyIcon(
        selected,
        data.pointer.icon,
        data.pointer.color
    );


    icon.style.width =
        `${data.pointer.size}px`;

    icon.style.height =
        `${data.pointer.size}px`;


    if (
        data.pointer.gradient
    ) {

        const gradient =
            `linear-gradient(
                90deg,
                ${data.pointer.gradientStart},
                ${data.pointer.gradientEnd}
            )`;


        icon.style.background =
            gradient;

        icon.style.maskImage =
            `url("${iconUrl(data.pointer.icon)}")`;

        icon.style.webkitMaskImage =
            `url("${iconUrl(data.pointer.icon)}")`;

    }

}


/* =========================================================
   GLOBAL COLOR TRIGGERS
========================================================= */

document
    .querySelectorAll(
        ".color-trigger[data-color-target]"
    )
    .forEach(button => {

        const target =
            button.dataset.colorTarget;


        /*
         * GRID
         */

        if (
            target ===
            "gridColor"
        ) {

            button.addEventListener(
                "click",
                () => {

                    openColorPicker(
                        data.global.gridColor,
                        color => {

                            data.global.gridColor =
                                color;

                            updateGridColorButtons();

                            updateGridPreview();

                            queueSave();

                        }
                    );

                }
            );

        }


        /*
         * POINTER
         */

        if (
            target ===
            "pointerColor"
        ) {

            button.addEventListener(
                "click",
                () => {

                    openColorPicker(
                        data.pointer.color,
                        color => {

                            data.pointer.color =
                                color;

                            updatePointerUI();

                            updatePointerColorButtons();

                            queueSave();

                        }
                    );

                }
            );

        }


        /*
         * POINTER GRADIENT
         */

        if (
            target ===
            "pointerGradientStart"
        ) {

            button.addEventListener(
                "click",
                () => {

                    openColorPicker(
                        data.pointer.gradientStart,
                        color => {

                            data.pointer.gradientStart =
                                color;

                            updatePointerUI();

                            updatePointerColorButtons();

                            queueSave();

                        }
                    );

                }
            );

        }


        if (
            target ===
            "pointerGradientEnd"
        ) {

            button.addEventListener(
                "click",
                () => {

                    openColorPicker(
                        data.pointer.gradientEnd,
                        color => {

                            data.pointer.gradientEnd =
                                color;

                            updatePointerUI();

                            updatePointerColorButtons();

                            queueSave();

                        }
                    );

                }
            );

        }

    });


function updateColorButton(
    target,
    color
) {

    const button =
        document.querySelector(
            `.color-trigger[data-color-target="${target}"]`
        );


    if (!button) {
        return;
    }


    const circle =
        button.querySelector(
            ".color-circle"
        );

    const value =
        button.querySelector(
            ".color-value"
        );


    if (circle) {
        circle.style.background =
            color;
    }

    if (value) {
        value.textContent =
            color.toUpperCase();
    }

}


function updateGridColorButtons() {

    updateColorButton(
        "gridColor",
        data.global.gridColor
    );

}


function updatePointerColorButtons() {

    updateColorButton(
        "pointerColor",
        data.pointer.color
    );

    updateColorButton(
        "pointerGradientStart",
        data.pointer.gradientStart
    );

    updateColorButton(
        "pointerGradientEnd",
        data.pointer.gradientEnd
    );

}


/* =========================================================
   TRANSFER DAY
========================================================= */

function createTransferUI() {

    /*
     * Кнопка добавляется в header только один раз.
     */

    if (
        document.getElementById(
            "transferButton"
        )
    ) {
        return;
    }


    const button =
        document.createElement("button");

    button.id =
        "transferButton";

    button.type =
        "button";

    button.className =
        "tool-button";

    button.innerHTML =
        "TRANSFER";


    /*
     * Добавляем в tools.
     */

    document
        .querySelector(".global-tools")
        .appendChild(
            button
        );


    button.addEventListener(
        "click",
        openTransferMenu
    );

}


function openTransferMenu() {

    if (
        !data.days[selectedDay].length
    ) {

        alert(
            "В этом дне нет задач."
        );

        return;

    }


    const target =
        prompt(
            "Перенести расписание на день:\n\n" +
            "MONDAY\n" +
            "TUESDAY\n" +
            "WEDNESDAY\n" +
            "THURSDAY\n" +
            "FRIDAY\n" +
            "SATURDAY\n" +
            "SUNDAY",
            ""
        );


    if (!target) {
        return;
    }


    const normalized =
        target
            .trim()
            .toUpperCase();


    if (
        !DAYS.includes(
            normalized
        )
    ) {

        alert(
            "Такого дня нет."
        );

        return;

    }


    if (
        normalized ===
        selectedDay
    ) {

        alert(
            "Нельзя перенести день на самого себя."
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Вы уверены, что хотите перенести расписание с ${selectedDay} на ${normalized}?`
        );


    if (!confirmed) {
        return;
    }


    data.days[normalized] =
        JSON.parse(
            JSON.stringify(
                data.days[selectedDay]
            )
        ).map(task => {

            return {
                ...task,
                id:
                    crypto.randomUUID()
            };

        });


    queueSave();

    alert(
        `Расписание перенесено на ${normalized}.`
    );

}


/* =========================================================
   INIT UI
========================================================= */

function loadSettingsUI() {

    updateTabs();

    updateGridUI();

    updateGridColorButtons();

    updatePointerUI();

    updatePointerColorButtons();

}


/* =========================================================
   SAVE BUTTON
========================================================= */

saveButton.addEventListener(
    "click",
    async () => {

        clearTimeout(
            saveTimer
        );

        await save();

    }
);


/* =========================================================
   START
========================================================= */

async function start() {

    const authenticated =
        await initUser();


    if (!authenticated) {
        return;
    }


    await loadData();


    /*
     * Transfer добавляем после загрузки.
     */

    createTransferUI();


    loadSettingsUI();

    renderTasks();

}


start();
