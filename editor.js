import { supabase } from "./supabase.js";


/* =====================================================
   CONSTANTS
===================================================== */

const DAYS = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY"
];


const FONTS = [
    ["Arial", "Arial"],
    ["Helvetica", "Helvetica"],
    ["Trebuchet MS", "Trebuchet"],
    ["Verdana", "Verdana"],
    ["Georgia", "Georgia"],
    ["Times New Roman", "Times"],
    ["Courier New", "Mono"],
    ["Impact", "Impact"],
    ["Tahoma", "Tahoma"],
    ["Palatino Linotype", "Palatino"],
    ["Garamond", "Garamond"],
    ["Lucida Console", "Console"],
    ["Comic Sans MS", "Comic"],
    ["Brush Script MT", "Script"],
    ["Copperplate", "Copperplate"]
];


let selectedDay = "MONDAY";
let user = null;
let data = null;
let saveTimer = null;

let currentColorTarget = null;
let recentColors = [];


/* =====================================================
   ELEMENTS
===================================================== */

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

const gridThickness =
    document.getElementById("gridThickness");

const gridThicknessValue =
    document.getElementById("gridThicknessValue");

const gridPreviewArea =
    document.getElementById("gridPreviewArea");

const pointerSize =
    document.getElementById("pointerSize");

const pointerSizeValue =
    document.getElementById("pointerSizeValue");

const pointerGradient =
    document.getElementById("pointerGradient");

const pointerGradientBox =
    document.getElementById("pointerGradientBox");

const pointerPreviewIcon =
    document.getElementById("pointerPreviewIcon");

const iconPickerButton =
    document.getElementById("iconPickerButton");

const iconPicker =
    document.getElementById("iconPicker");

const selectedIconPreview =
    document.getElementById("selectedIconPreview");

const colorOverlay =
    document.getElementById("colorOverlay");

const systemColorInput =
    document.getElementById("systemColorInput");

const systemColorButton =
    document.getElementById("systemColorButton");

const recentColorsContainer =
    document.getElementById("recentColors");

const fontOverlay =
    document.getElementById("fontOverlay");

const fontList =
    document.getElementById("fontList");


/* =====================================================
   DEFAULT DATA
===================================================== */

function defaultData() {

    const days = {};

    DAYS.forEach(day => {
        days[day] = [];
    });


    return {

        days,

        global: {
            gridMode: "rows",
            gridThickness: 1,
            gridColor: "#e5e5e5"
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


/* =====================================================
   DEFAULT TASK
===================================================== */

function createDefaultTask(copy = null) {

    if (copy) {

        return {
            ...JSON.parse(
                JSON.stringify(copy)
            ),
            id: crypto.randomUUID()
        };

    }


    return {

        id: crypto.randomUUID(),

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

        gradientStart: "#ff4ecd",

        gradientEnd: "#7c5cff"

    };

}


/* =====================================================
   AUTH
===================================================== */

async function initUser() {

    const {
        data: sessionData
    } = await supabase.auth.getSession();


    if (!sessionData.session) {

        window.location.href = "auth.html";

        return false;

    }


    user =
        sessionData.session.user;

    return true;

}


/* =====================================================
   LOAD
===================================================== */

async function loadData() {

    setStatus("LOADING...");


    const {
        data: row,
        error
    } =
        await supabase
            .from("schedules")
            .select("data")
            .eq("user_id", user.id)
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


/* =====================================================
   NORMALIZE
===================================================== */

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

        if (!Array.isArray(data.days[day])) {
            data.days[day] = [];
        }


        data.days[day] =
            data.days[day].map(task => ({
                ...createDefaultTask(),
                ...task
            }));

    });

}


/* =====================================================
   SAVE
===================================================== */

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
                    user_id: user.id,
                    data,
                    updated_at:
                        new Date().toISOString()
                },
                {
                    onConflict: "user_id"
                }
            );


    saveButton.disabled = false;


    if (error) {

        console.error(error);

        setStatus("ERROR");

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


/* =====================================================
   AUTOSAVE
===================================================== */

function queueSave() {

    setStatus("UNSAVED");

    clearTimeout(saveTimer);

    saveTimer =
        setTimeout(
            save,
            700
        );

}


/* =====================================================
   STATUS
===================================================== */

function setStatus(text) {
    saveStatus.textContent = text;
}


/* =====================================================
   GLOBAL PANELS
===================================================== */

function closeGlobalPanels() {

    gridPanel.classList.add("hidden");
    pointerPanel.classList.add("hidden");

    gridButton.classList.remove("active");
    pointerButton.classList.remove("active");

    tasks.classList.remove("hidden");

}


/*
    GRID / POINTER are mutually exclusive.
    When either is open, tasks disappear.
*/

function toggleGlobalPanel(panel, button) {

    const isOpen =
        !panel.classList.contains("hidden");


    gridPanel.classList.add("hidden");
    pointerPanel.classList.add("hidden");

    gridButton.classList.remove("active");
    pointerButton.classList.remove("active");

    if (isOpen) {

        tasks.classList.remove("hidden");

        return;

    }


    panel.classList.remove("hidden");
    button.classList.add("active");

    tasks.classList.add("hidden");

}


gridButton.addEventListener(
    "click",
    () => {
        toggleGlobalPanel(
            gridPanel,
            gridButton
        );
    }
);


pointerButton.addEventListener(
    "click",
    () => {
        toggleGlobalPanel(
            pointerPanel,
            pointerButton
        );
    }
);


document
    .querySelectorAll("[data-close]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                closeGlobalPanels();

            }
        );

    });


/* =====================================================
   DAYS
===================================================== */

document
    .querySelectorAll(".day-tabs button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectedDay =
                    button.dataset.day;

                updateTabs();

                closeAllTaskEditors();

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

}


/* =====================================================
   ADD TASK
===================================================== */

addTaskButton.addEventListener(
    "click",
    () => {

        closeGlobalPanels();

        closeAllTaskEditors();


        const current =
            data.days[selectedDay];


        const last =
            current.length
                ? current[current.length - 1]
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


        current.push(task);


        renderTasks();

        queueSave();


        requestAnimationFrame(() => {

            const cards =
                tasks.querySelectorAll(
                    ".task-card"
                );

            const lastCard =
                cards[cards.length - 1];


            if (lastCard) {

                lastCard.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                const expand =
                    lastCard.querySelector(
                        ".expand-task"
                    );

                expand?.click();

            }

        });

    }
);


/* =====================================================
   DUPLICATE
===================================================== */

function duplicateTask(item) {

    const copy =
        createDefaultTask(item);


    copy.time =
        addMinutes(
            item.time,
            30
        );


    data.days[selectedDay].push(copy);


    closeAllTaskEditors();

    renderTasks();

    queueSave();


    requestAnimationFrame(() => {

        const cards =
            tasks.querySelectorAll(
                ".task-card"
            );

        const last =
            cards[cards.length - 1];


        if (last) {

            last.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            last.querySelector(
                ".expand-task"
            )?.click();

        }

    });

}


/* =====================================================
   ADD MINUTES
===================================================== */

function addMinutes(time, minutes) {

    const [h, m] =
        time.split(":").map(Number);


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


    const hh =
        String(
            Math.floor(total / 60)
        ).padStart(2, "0");


    const mm =
        String(
            total % 60
        ).padStart(2, "0");


    return `${hh}:${mm}`;

}


/* =====================================================
   TASK EDITOR STATE
===================================================== */

function closeAllTaskEditors() {

    document
        .querySelectorAll(".task-card")
        .forEach(card => {

            card.classList.remove("open");

            const body =
                card.querySelector(".task-body");

            if (body) {
                body.classList.add("hidden");
            }

        });

}


/* =====================================================
   RENDER TASKS
===================================================== */

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
            document.createElement("div");

        empty.className = "empty";

        empty.textContent =
            "Tap + ADD TASK to create a task";

        tasks.appendChild(empty);

        return;

    }


    items.forEach(item => {

        tasks.appendChild(
            createTaskCard(item)
        );

    });

}


/* =====================================================
   TASK CARD
===================================================== */

function createTaskCard(item) {

    const card =
        document.createElement("article");

    card.className = "task-card";


    /* -------------------------------------------------
       PREVIEW
    ------------------------------------------------- */

    const preview =
        document.createElement("div");

    preview.className =
        "task-preview";


    const timePreview =
        document.createElement("button");

    timePreview.type = "button";

    timePreview.className =
        "task-preview-time";


    const textPreview =
        document.createElement("button");

    textPreview.type = "button";

    textPreview.className =
        "task-preview-text";


    const expand =
        document.createElement("button");

    expand.type = "button";

    expand.className =
        "expand-task";

    expand.textContent = "⌄";


    preview.append(
        timePreview,
        textPreview,
        expand
    );


    card.appendChild(preview);


    /* -------------------------------------------------
       BODY
    ------------------------------------------------- */

    const body =
        document.createElement("div");

    body.className =
        "task-body hidden";


    /* =================================================
       TIME
    ================================================= */

    const timeSection =
        document.createElement("section");

    timeSection.className =
        "editor-section";


    const timeHeader =
        document.createElement("div");

    timeHeader.className =
        "section-header";


    timeHeader.innerHTML = `
        <span class="section-name">TIME</span>
    `;


    const timeInput =
        document.createElement("input");

    timeInput.type = "time";

    timeInput.className =
        "task-time-input";

    timeInput.value =
        item.time;


    const timeControls =
        document.createElement("div");

    timeControls.className =
        "control-grid";


    timeControls.append(
        createRangeControl(
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


    timeControls.append(
        createColorControl(
            "COLOR",
            item.timeColor,
            value => {

                item.timeColor =
                    value;

                updatePreview();

            }
        )
    );


    timeControls.append(
        createWeightControl(
            item.timeWeight,
            value => {

                item.timeWeight =
                    Number(value);

                updatePreview();

            }
        )
    );


    timeSection.append(
        timeHeader,
        timeInput,
        timeControls
    );


    /* =================================================
       TIME GRADIENT
    ================================================= */

    const timeGradient =
        createGradientControls(
            "TIME GRADIENT",
            item,
            updatePreview
        );


    timeSection.append(
        timeGradient
    );


    /* =================================================
       TEXT
    ================================================= */

    const textSection =
        document.createElement("section");

    textSection.className =
        "editor-section";


    const textHeader =
        document.createElement("div");

    textHeader.className =
        "section-header";


    textHeader.innerHTML = `
        <span class="section-name">TEXT</span>
    `;


    const textInput =
        document.createElement("textarea");

    textInput.className =
        "task-text-input";

    textInput.rows = 1;

    textInput.value =
        item.text;


    const textControls =
        document.createElement("div");

    textControls.className =
        "control-grid";


    textControls.append(
        createRangeControl(
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


    textControls.append(
        createColorControl(
            "COLOR",
            item.color,
            value => {

                item.color =
                    value;

                updatePreview();

            }
        )
    );


    textControls.append(
        createWeightControl(
            item.fontWeight,
            value => {

                item.fontWeight =
                    Number(value);

                updatePreview();

            }
        )
    );


    const fontControl =
        document.createElement("div");

    fontControl.className =
        "control";


    fontControl.innerHTML = `
        <div class="control-label">
            <span>FONT</span>
        </div>
    `;


    const fontButton =
        document.createElement("button");

    fontButton.type = "button";

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
                item,
                fontButton,
                updatePreview
            );

        }
    );


    fontControl.appendChild(
        fontButton
    );


    textControls.appendChild(
        fontControl
    );


    textSection.append(
        textHeader,
        textInput,
        textControls
    );


    /* =================================================
       TEXT GRADIENT
    ================================================= */

    const textGradient =
        createGradientControls(
            "TEXT GRADIENT",
            item,
            updatePreview
        );


    textSection.append(
        textGradient
    );


    body.append(
        timeSection,
        textSection
    );


    /* =================================================
       ACTIONS
    ================================================= */

    const actions =
        document.createElement("div");

    actions.className =
        "task-actions";


    const duplicate =
        document.createElement("button");

    duplicate.type = "button";

    duplicate.className =
        "action-button";

    duplicate.textContent =
        "DUPLICATE";


    const remove =
        document.createElement("button");

    remove.type = "button";

    remove.className =
        "action-button delete";

    remove.textContent =
        "DELETE";


    actions.append(
        duplicate,
        remove
    );


    body.appendChild(actions);

    card.appendChild(body);


    /* =================================================
       EVENTS
    ================================================= */

    expand.addEventListener(
        "click",
        () => {

            const isOpen =
                card.classList.contains("open");


            closeAllTaskEditors();


            if (!isOpen) {

                card.classList.add("open");

                body.classList.remove("hidden");

            }

        }
    );


    timePreview.addEventListener(
        "click",
        () => {

            const isOpen =
                card.classList.contains("open");


            closeAllTaskEditors();


            if (!isOpen) {

                card.classList.add("open");

                body.classList.remove("hidden");

                setTimeout(() => {
                    timeInput.focus();
                }, 50);

            }

        }
    );


    textPreview.addEventListener(
        "click",
        () => {

            const isOpen =
                card.classList.contains("open");


            closeAllTaskEditors();


            if (!isOpen) {

                card.classList.add("open");

                body.classList.remove("hidden");

                setTimeout(() => {
                    textInput.focus();
                }, 50);

            }

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

            renderTasks();

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

            renderTasks();

            queueSave();

        }
    );


    /* =================================================
       PREVIEW
    ================================================= */

    function updatePreview() {

        timePreview.textContent =
            item.time || "00:00";

        textPreview.textContent =
            item.text || "TASK";


        /* TIME */

        timePreview.style.fontSize =
            `${item.timeSize}px`;

        timePreview.style.fontWeight =
            item.timeWeight;

        timePreview.style.color =
            item.timeColor;


        /* TEXT */

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

        } else {

            textPreview.style.background =
                "transparent";

            textPreview.style.webkitBackgroundClip =
                "initial";

            textPreview.style.backgroundClip =
                "initial";

            textPreview.style.webkitTextFillColor =
                item.color;

            textPreview.style.color =
                item.color;

        }


        /* TIME GRADIENT */

        if (item.timeGradient) {

            timePreview.style.background =
                `linear-gradient(
                    90deg,
                    ${item.timeGradientStart},
                    ${item.timeGradientEnd}
                )`;

            timePreview.style.webkitBackgroundClip =
                "text";

            timePreview.style.backgroundClip =
                "text";

            timePreview.style.webkitTextFillColor =
                "transparent";

        }


        /* Keep buttons looking like previews */

        timePreview.style.borderRadius = "9px";
        textPreview.style.borderRadius = "9px";

    }


    updatePreview();


    return card;

}


/* =====================================================
   RANGE CONTROL
===================================================== */

function createRangeControl(
    title,
    min,
    max,
    value,
    callback
) {

    const box =
        document.createElement("div");

    box.className = "control";


    const label =
        document.createElement("div");

    label.className =
        "control-label";


    const name =
        document.createElement("span");

    name.textContent =
        title;


    const output =
        document.createElement("output");

    output.textContent =
        value;


    label.append(
        name,
        output
    );


    const input =
        document.createElement("input");

    input.type = "range";

    input.min = min;
    input.max = max;
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


/* =====================================================
   WEIGHT
===================================================== */

function createWeightControl(
    value,
    callback
) {

    return createRangeControl(
        "WEIGHT",
        300,
        900,
        value,
        callback
    );

}


/* =====================================================
   COLOR CONTROL
===================================================== */

function createColorControl(
    title,
    value,
    callback
) {

    const box =
        document.createElement("div");

    box.className = "control";


    const label =
        document.createElement("div");

    label.className =
        "control-label";

    label.textContent =
        title;


    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        "color-trigger";


    button.style.width = "100%";
    button.style.height = "31px";


    const dot =
        document.createElement("span");

    dot.className =
        "color-dot";

    dot.style.background =
        value || "#111111";


    button.appendChild(dot);


    button.addEventListener(
        "click",
        () => {

            openColorPicker(
                value || "#111111",
                newValue => {

                    dot.style.background =
                        newValue;

                    callback(newValue);

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


/* =====================================================
   GRADIENT
===================================================== */

function createGradientControls(
    title,
    item,
    update
) {

    const wrapper =
        document.createElement("div");


    wrapper.className =
        "gradient-toggle";


    const label =
        document.createElement("label");


    const checkbox =
        document.createElement("input");

    checkbox.type =
        "checkbox";


    /*
       Text and time use different properties.
    */

    const isTime =
        title.startsWith("TIME");


    checkbox.checked =
        isTime
            ? !!item.timeGradient
            : !!item.gradient;


    const labelText =
        document.createElement("span");

    labelText.textContent =
        "Gradient";


    label.append(
        checkbox,
        labelText
    );


    wrapper.appendChild(
        label
    );


    const settings =
        document.createElement("div");

    settings.className =
        "gradient-settings hidden";


    const start =
        createGradientColorButton(
            isTime
                ? item.timeGradientStart || "#ff4ecd"
                : item.gradientStart || "#ff4ecd",
            newValue => {

                if (isTime) {

                    item.timeGradientStart =
                        newValue;

                } else {

                    item.gradientStart =
                        newValue;

                }

                update();

            }
        );


    const end =
        createGradientColorButton(
            isTime
                ? item.timeGradientEnd || "#7c5cff"
                : item.gradientEnd || "#7c5cff",
            newValue => {

                if (isTime) {

                    item.timeGradientEnd =
                        newValue;

                } else {

                    item.gradientEnd =
                        newValue;

                }

                update();

            }
        );


    settings.append(
        start,
        end
    );


    if (checkbox.checked) {
        settings.classList.remove("hidden");
    }


    checkbox.addEventListener(
        "change",
        () => {

            if (isTime) {

                item.timeGradient =
                    checkbox.checked;

            } else {

                item.gradient =
                    checkbox.checked;

            }


            settings.classList.toggle(
                "hidden",
                !checkbox.checked
            );


            update();

            queueSave();

        }
    );


    const parent =
        document.createElement("div");


    parent.append(
        wrapper,
        settings
    );


    return parent;

}


/* =====================================================
   GRADIENT COLOR BUTTON
===================================================== */

function createGradientColorButton(
    value,
    callback
) {

    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        "color-trigger";


    const dot =
        document.createElement("span");

    dot.className =
        "color-dot";

    dot.style.background =
        value;


    button.appendChild(dot);


    button.addEventListener(
        "click",
        () => {

            openColorPicker(
                value,
                newValue => {

                    dot.style.background =
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


/* =====================================================
   COLOR PICKER
===================================================== */

function openColorPicker(
    current,
    callback
) {

    currentColorTarget =
        callback;


    colorOverlay.classList.remove(
        "hidden"
    );


    systemColorInput.value =
        normalizeHex(current);


    renderRecentColors();

}


function closeColorPicker() {

    colorOverlay.classList.add(
        "hidden"
    );

    currentColorTarget =
        null;

}


document
    .getElementById("closeColorPicker")
    .addEventListener(
        "click",
        closeColorPicker
    );


colorOverlay.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            colorOverlay
        ) {

            closeColorPicker();

        }

    }
);


/* BASIC COLORS */

document
    .querySelectorAll("[data-preset]")
    .forEach(button => {

        button.style.background =
            button.dataset.preset;


        button.addEventListener(
            "click",
            () => {

                chooseColor(
                    button.dataset.preset
                );

            }
        );

    });


/* SYSTEM PICKER */

systemColorButton.addEventListener(
    "click",
    () => {

        systemColorInput.click();

    }
);


systemColorInput.addEventListener(
    "input",
    () => {

        chooseColor(
            systemColorInput.value
        );

    }
);


function chooseColor(color) {

    if (!color) return;


    color =
        normalizeHex(color);


    addRecentColor(color);


    if (currentColorTarget) {

        currentColorTarget(color);

    }


    /*
       Don't close after every system picker input.
       Preset buttons close immediately.
    */

    if (
        !systemColorInput.matches(":focus")
    ) {

        closeColorPicker();

    }

}


function normalizeHex(color) {

    if (!color) {
        return "#111111";
    }


    return color.toUpperCase();

}


/* =====================================================
   RECENT COLORS
===================================================== */

function addRecentColor(color) {

    color =
        normalizeHex(color);


    recentColors =
        recentColors.filter(
            item => item !== color
        );


    recentColors.unshift(color);


    recentColors =
        recentColors.slice(0, 12);


    try {

        localStorage.setItem(
            "editorRecentColors",
            JSON.stringify(recentColors)
        );

    } catch {}

}


function loadRecentColors() {

    try {

        recentColors =
            JSON.parse(
                localStorage.getItem(
                    "editorRecentColors"
                ) || "[]"
            );

        if (!Array.isArray(recentColors)) {
            recentColors = [];
        }

    } catch {

        recentColors = [];

    }

}


function renderRecentColors() {

    recentColorsContainer.innerHTML = "";


    if (!recentColors.length) {

        const empty =
            document.createElement("span");

        empty.textContent =
            "No recent colors";

        empty.style.gridColumn =
            "1 / -1";

        empty.style.fontSize =
            "8px";

        empty.style.color =
            "#aaa";

        recentColorsContainer.appendChild(
            empty
        );

        return;

    }


    recentColors.forEach(color => {

        const button =
            document.createElement("button");

        button.style.background =
            color;


        button.addEventListener(
            "click",
            () => {

                if (currentColorTarget) {

                    currentColorTarget(
                        color
                    );

                }

                closeColorPicker();

            }
        );


        recentColorsContainer.appendChild(
            button
        );

    });

}


/* =====================================================
   FONT PICKER
===================================================== */

function buildFontList() {

    fontList.innerHTML = "";


    FONTS.forEach(
        ([font, label]) => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "font-option";


            const preview =
                document.createElement("span");

            preview.className =
                "font-option-preview";

            preview.textContent =
                "Aa Schedule";


            preview.style.fontFamily =
                font;


            const name =
                document.createElement("span");

            name.className =
                "font-option-name";

            name.textContent =
                label;


            button.append(
                preview,
                name
            );


            button.dataset.font =
                font;


            fontList.appendChild(
                button
            );

        }
    );

}


let fontTarget = null;


function openFontPicker(
    item,
    button,
    update
) {

    fontTarget = {
        item,
        button,
        update
    };


    fontList
        .querySelectorAll(".font-option")
        .forEach(option => {

            option.classList.toggle(
                "active",
                option.dataset.font ===
                item.fontFamily
            );

        });


    fontOverlay.classList.remove(
        "hidden"
    );

}


document
    .getElementById("closeFontPicker")
    .addEventListener(
        "click",
        () => {

            fontOverlay.classList.add(
                "hidden"
            );

            fontTarget = null;

        }
    );


fontOverlay.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            fontOverlay
        ) {

            fontOverlay.classList.add(
                "hidden"
            );

            fontTarget = null;

        }

    }
);


fontList.addEventListener(
    "click",
    event => {

        const option =
            event.target.closest(
                ".font-option"
            );


        if (!option || !fontTarget) {
            return;
        }


        const font =
            option.dataset.font;


        fontTarget.item.fontFamily =
            font;


        fontTarget.button.textContent =
            font;

        fontTarget.button.style.fontFamily =
            font;


        fontTarget.update();

        queueSave();


        fontList
            .querySelectorAll(".font-option")
            .forEach(item => {

                item.classList.toggle(
                    "active",
                    item === option
                );

            });


        setTimeout(() => {

            fontOverlay.classList.add(
                "hidden"
            );

            fontTarget = null;

        }, 100);

    }
);


/* =====================================================
   GRID
===================================================== */

document
    .querySelectorAll(".grid-mode")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                data.global.gridMode =
                    button.dataset.mode;

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
        .querySelectorAll(".grid-mode")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.mode ===
                data.global.gridMode
            );

        });


    gridThickness.value =
        data.global.gridThickness;


    gridThicknessValue.textContent =
        data.global.gridThickness;


    gridPreviewArea.style.setProperty(
        "--grid-color",
        data.global.gridColor
    );


    gridPreviewArea.style.setProperty(
        "--grid-weight",
        `${data.global.gridThickness}px`
    );


    gridPreviewArea.classList.toggle(
        "mode-grid",
        data.global.gridMode === "grid"
    );


    document
        .getElementById("gridColorDot")
        .style.background =
        data.global.gridColor;

}


/* =====================================================
   POINTER
===================================================== */

iconPickerButton.addEventListener(
    "click",
    () => {

        iconPicker.classList.toggle(
            "hidden"
        );

    }
);


iconPicker.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-icon]"
            );


        if (!button) return;


        data.pointer.icon =
            Number(
                button.dataset.icon
            );


        iconPicker
            .querySelectorAll(
                "[data-icon]"
            )
            .forEach(item => {

                item.classList.toggle(
                    "active",
                    item === button
                );

            });


        updatePointerUI();

        queueSave();

        iconPicker.classList.add(
            "hidden"
        );

    }
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


pointerGradient.addEventListener(
    "change",
    () => {

        data.pointer.gradient =
            pointerGradient.checked;


        pointerGradientBox.classList.toggle(
            "hidden",
            !data.pointer.gradient
        );


        updatePointerUI();

        queueSave();

    }
);


function updatePointerUI() {

    const iconPath =
        `icons/${data.pointer.icon}.png`;


    pointerPreviewIcon.innerHTML =
        `<img src="${iconPath}" alt="">`;


    selectedIconPreview.innerHTML =
        `<img src="${iconPath}" alt="">`;


    pointerSize.value =
        data.pointer.size;


    pointerSizeValue.textContent =
        data.pointer.size;


    pointerPreviewIcon.style.width =
        `${Math.max(
            42,
            data.pointer.size + 20
        )}px`;


    pointerPreviewIcon.style.height =
        `${Math.max(
            42,
            data.pointer.size + 20
        )}px`;


    const image =
        pointerPreviewIcon.querySelector(
            "img"
        );


    if (image) {

        image.style.width =
            `${data.pointer.size}px`;

        image.style.height =
            `${data.pointer.size}px`;

    }


    if (data.pointer.gradient) {

        pointerPreviewIcon.style.background =
            `linear-gradient(
                90deg,
                ${data.pointer.gradientStart},
                ${data.pointer.gradientEnd}
            )`;

    } else {

        pointerPreviewIcon.style.background =
            "transparent";

    }


    document
        .getElementById("pointerColorDot")
        .style.background =
        data.pointer.color;


    document
        .getElementById("pointerGradientStartDot")
        .style.background =
        data.pointer.gradientStart;


    document
        .getElementById("pointerGradientEndDot")
        .style.background =
        data.pointer.gradientEnd;


    pointerGradient.checked =
        data.pointer.gradient;


    pointerGradientBox.classList.toggle(
        "hidden",
        !data.pointer.gradient
    );


    iconPicker
        .querySelectorAll("[data-icon]")
        .forEach(button => {

            button.classList.toggle(
                "active",
                Number(button.dataset.icon) ===
                data.pointer.icon
            );

        });

}


/* =====================================================
   POINTER COLOR BUTTONS
===================================================== */

function setupGlobalColorButtons() {

    document
        .querySelectorAll(
            ".color-trigger[data-color-target]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const target =
                        button.dataset.colorTarget;


                    let current =
                        getGlobalColor(target);


                    openColorPicker(
                        current,
                        value => {

                            setGlobalColor(
                                target,
                                value
                            );

                            updateGlobalColorUI();

                            updateGridUI();
                            updatePointerUI();

                            queueSave();

                        }
                    );

                }
            );

        });

}


function getGlobalColor(target) {

    if (target === "gridColor") {
        return data.global.gridColor;
    }

    if (target === "pointerColor") {
        return data.pointer.color;
    }

    if (
        target ===
        "pointerGradientStart"
    ) {
        return data.pointer.gradientStart;
    }

    if (
        target ===
        "pointerGradientEnd"
    ) {
        return data.pointer.gradientEnd;
    }


    return "#111111";

}


function setGlobalColor(
    target,
    value
) {

    if (target === "gridColor") {
        data.global.gridColor = value;
    }

    if (target === "pointerColor") {
        data.pointer.color = value;
    }

    if (
        target ===
        "pointerGradientStart"
    ) {
        data.pointer.gradientStart = value;
    }

    if (
        target ===
        "pointerGradientEnd"
    ) {
        data.pointer.gradientEnd = value;
    }

}


function updateGlobalColorUI() {

    document
        .getElementById("gridColorDot")
        .style.background =
        data.global.gridColor;


    document
        .getElementById("pointerColorDot")
        .style.background =
        data.pointer.color;


    document
        .getElementById("pointerGradientStartDot")
        .style.background =
        data.pointer.gradientStart;


    document
        .getElementById("pointerGradientEndDot")
        .style.background =
        data.pointer.gradientEnd;

}


/* =====================================================
   LOAD UI
===================================================== */

function loadSettingsUI() {

    updateGridUI();

    updatePointerUI();

    updateGlobalColorUI();

}


/* =====================================================
   SAVE BUTTON
===================================================== */

saveButton.addEventListener(
    "click",
    async () => {

        clearTimeout(saveTimer);

        await save();

    }
);


/* =====================================================
   START
===================================================== */

async function start() {

    const authenticated =
        await initUser();


    if (!authenticated) {
        return;
    }


    loadRecentColors();

    buildFontList();


    await loadData();


    updateTabs();

    loadSettingsUI();

    setupGlobalColorButtons();

    renderTasks();

}


start();
