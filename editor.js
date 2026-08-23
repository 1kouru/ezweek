import { supabase } from "./supabase.js";


/* =========================================
   CONSTANTS
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
            symbol: "triangle",
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

        /* TIME */

        timeColor:
            "#999999",

        timeSize:
            11,

        timeWeight:
            600,

        /* TEXT */

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

        /* TEXT CARD */

        background:
            "transparent",

        radius:
            12,

        padding:
            10,

        /* TIME CARD */

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

        console.error(
            "LOAD ERROR:",
            error
        );

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
            data.days[day].map(task => ({
                ...createDefaultTask(),
                ...task
            }));

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


/* =========================================
   AUTOSAVE
========================================= */

function queueSave() {

    setStatus("UNSAVED");

    clearTimeout(saveTimer);

    saveTimer =
        setTimeout(
            save,
            700
        );

}


/* =========================================
   STATUS
========================================= */

function setStatus(text) {
    saveStatus.textContent = text;
}


/* =========================================
   GLOBAL PANELS
========================================= */

function closeGlobalPanels() {

    gridPanel.classList.add("hidden");
    pointerPanel.classList.add("hidden");

    gridButton.classList.remove("active");
    pointerButton.classList.remove("active");

}


function openOnly(panel) {

    const isClosed =
        panel.classList.contains("hidden");

    closeGlobalPanels();

    if (!isClosed) {
        return;
    }

    panel.classList.remove("hidden");

    if (panel === gridPanel) {
        gridButton.classList.add("active");
    }

    if (panel === pointerPanel) {
        pointerButton.classList.add("active");
    }

}


gridButton.addEventListener(
    "click",
    () => {
        openOnly(gridPanel);
    }
);


pointerButton.addEventListener(
    "click",
    () => {
        openOnly(pointerPanel);
    }
);


document
    .querySelectorAll("[data-close-panel]")
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
    .querySelectorAll(".day-tabs button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectedDay =
                    button.dataset.day;

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

}


/* =========================================
   ADD TASK
========================================= */

addTaskButton.addEventListener(
    "click",
    () => {

        /*
         * Всегда закрываем GRID / POINTER
         */

        closeGlobalPanels();


        const current =
            data.days[selectedDay];


        const last =
            current.length
                ? current[current.length - 1]
                : null;


        /*
         * Копируем настройки
         * последней задачи
         */

        const task =
            createDefaultTask(last);


        /*
         * Если задача уже была —
         * ставим следующую через 30 минут.
         */

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


        setTimeout(() => {

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

            }

        }, 80);

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

    renderTasks();

    queueSave();

}


/* =========================================
   ADD MINUTES
========================================= */

function addMinutes(time, minutes) {

    const [h, m] =
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
            document.createElement("div");

        empty.className =
            "empty";

        empty.textContent =
            "Нажми + ADD TASK";

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
   TASK CARD
========================================= */

function createTaskCard(item) {

    const card =
        document.createElement("article");

    card.className =
        "task-card";


    /* =====================================
       TOP PREVIEW
    ===================================== */

    const preview =
        document.createElement("div");

    preview.className =
        "task-preview";


    const time =
        document.createElement("input");

    time.type = "time";
    time.className = "preview-time-input";
    time.value = item.time;


    const text =
        document.createElement("input");

    text.type = "text";
    text.className = "preview-task-input";

    text.value =
        item.text;


    const remove =
        document.createElement("button");

    remove.type = "button";
    remove.className = "delete-task";
    remove.textContent = "×";


    preview.append(
        time,
        text,
        remove
    );

    card.appendChild(preview);


    /* =====================================
       TIME
    ===================================== */

    const timeSection =
        createSection("TIME");


    const timeCardButton =
        createSectionButton("CARD");


    const timeActions =
        timeSection.querySelector(
            ".section-actions"
        );

    timeActions.appendChild(
        timeCardButton
    );


    const timeControls =
        document.createElement("div");

    timeControls.className =
        "compact-controls";


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
        colorControl(
            "COLOR",
            item.timeColor,
            value => {

                item.timeColor =
                    value;

                updatePreview();

            }
        )
    );


    timeControls.appendChild(
        weightControl(
            item.timeWeight,
            value => {

                item.timeWeight =
                    Number(value);

                updatePreview();

            }
        )
    );


    const timeCardPopover =
        document.createElement("div");

    timeCardPopover.className =
        "card-popover hidden";


    buildTimeCardStyle(
        timeCardPopover,
        item,
        updatePreview
    );


    timeCardButton.addEventListener(
        "click",
        () => {

            timeCardPopover.classList.toggle(
                "hidden"
            );

            timeCardButton.classList.toggle(
                "active"
            );

        }
    );


    timeSection.append(
        timeControls,
        timeCardPopover
    );

    card.appendChild(timeSection);


    /* =====================================
       TEXT
    ===================================== */

    const textSection =
        createSection("TEXT");


    const textCardButton =
        createSectionButton("CARD");


    textSection
        .querySelector(".section-actions")
        .appendChild(
            textCardButton
        );


    const textControls =
        document.createElement("div");

    textControls.className =
        "compact-controls";


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
        colorControl(
            "COLOR",
            item.color,
            value => {

                item.color =
                    value;

                updatePreview();

            }
        )
    );


    textControls.appendChild(
        weightControl(
            item.fontWeight,
            value => {

                item.fontWeight =
                    Number(value);

                updatePreview();

            }
        )
    );


    /*
     * FONT
     */

    const fontBox =
        document.createElement("div");

    fontBox.className =
        "font-control";


    const font =
        document.createElement("select");

    font.className =
        "font-select";


    const fonts = [

        ["Arial", "Arial"],
        ["Helvetica", "Helvetica"],
        ["Verdana", "Verdana"],
        ["Trebuchet MS", "Trebuchet"],
        ["Tahoma", "Tahoma"],
        ["Georgia", "Georgia"],
        ["Times New Roman", "Times"],
        ["Garamond", "Garamond"],
        ["Palatino Linotype", "Palatino"],
        ["Courier New", "Mono"],
        ["Lucida Console", "Console"],
        ["Impact", "Impact"],
        ["Comic Sans MS", "Comic"],
        ["Century Gothic", "Century"],
        ["Franklin Gothic Medium", "Franklin"]

    ];


    fonts.forEach(
        ([value, label]) => {

            const option =
                document.createElement("option");

            option.value =
                value;

            option.textContent =
                label;

            option.style.fontFamily =
                value;

            font.appendChild(option);

        }
    );


    font.value =
        item.fontFamily;


    font.addEventListener(
        "change",
        () => {

            item.fontFamily =
                font.value;

            updatePreview();

            queueSave();

        }
    );


    fontBox.appendChild(font);

    textSection.appendChild(
        textControls
    );

    textSection.appendChild(
        fontBox
    );


    /*
     * TEXT CARD
     */

    const textCardPopover =
        document.createElement("div");

    textCardPopover.className =
        "card-popover hidden";


    buildTextCardStyle(
        textCardPopover,
        item,
        updatePreview
    );


    textCardButton.addEventListener(
        "click",
        () => {

            textCardPopover.classList.toggle(
                "hidden"
            );

            textCardButton.classList.toggle(
                "active"
            );

        }
    );


    textSection.appendChild(
        textCardPopover
    );

    card.appendChild(textSection);


    /* =====================================
       DUPLICATE
    ===================================== */

    const duplicate =
        document.createElement("button");

    duplicate.type = "button";

    duplicate.className =
        "section-button";

    duplicate.textContent =
        "DUPLICATE";

    duplicate.style.marginTop =
        "6px";

    duplicate.style.width =
        "100%";


    duplicate.addEventListener(
        "click",
        () => {

            duplicateTask(item);

        }
    );


    card.appendChild(duplicate);


    /* =====================================
       EVENTS
    ===================================== */

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


    text.addEventListener(
        "input",
        () => {

            item.text =
                text.value;

            updatePreview();

            queueSave();

        }
    );


    remove.addEventListener(
        "click",
        () => {

            /*
             * НИКАКОГО CONFIRM
             */

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


    /* =====================================
       LIVE PREVIEW
    ===================================== */

    function updatePreview() {

        text.value =
            item.text || "";


        /* TIME */

        time.style.color =
            item.timeColor;

        time.style.fontSize =
            `${item.timeSize}px`;

        time.style.fontWeight =
            item.timeWeight;

        time.style.backgroundColor =
            item.timeBackground ===
                "transparent"
                ? "#fafafa"
                : item.timeBackground;

        time.style.borderRadius =
            `${item.timeRadius}px`;

        time.style.padding =
            `0 ${item.timePadding}px`;


        /* TEXT */

        text.style.fontFamily =
            item.fontFamily;

        text.style.fontSize =
            `${item.fontSize}px`;

        text.style.fontWeight =
            item.fontWeight;

        text.style.borderRadius =
            `${item.radius}px`;

        text.style.padding =
            `0 ${item.padding}px`;


        if (item.gradient) {

            text.style.color =
                "transparent";

            text.style.backgroundImage =
                `linear-gradient(
                    90deg,
                    ${item.gradientStart},
                    ${item.gradientEnd}
                )`;

            text.style.backgroundClip =
                "text";

            text.style.webkitBackgroundClip =
                "text";

            text.style.webkitTextFillColor =
                "transparent";

            /*
             * Для gradient-карточки
             * используем псевдо-решение:
             * фон через background-color,
             * gradient остаётся текстом.
             */

            if (
                item.background !==
                "transparent"
            ) {

                text.style.backgroundColor =
                    item.background;

                text.style.backgroundBlendMode =
                    "normal";

            }

        } else {

            text.style.backgroundImage =
                "none";

            text.style.backgroundClip =
                "initial";

            text.style.webkitBackgroundClip =
                "initial";

            text.style.webkitTextFillColor =
                "initial";

            text.style.color =
                item.color;

            text.style.backgroundColor =
                item.background ===
                    "transparent"
                    ? "transparent"
                    : item.background;

        }

    }


    updatePreview();


    return card;

}


/* =========================================
   SECTION
========================================= */

function createSection(title) {

    const section =
        document.createElement("div");

    section.className =
        "task-section";


    section.innerHTML = `

        <div class="section-row">

            <div class="section-title">
                ${title}
            </div>

            <div class="section-actions"></div>

        </div>

    `;


    return section;

}


function createSectionButton(text) {

    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        "section-button";

    button.textContent =
        text;

    return button;

}


/* =========================================
   RANGE
========================================= */

function rangeControl(
    title,
    min,
    max,
    value,
    callback
) {

    const box =
        document.createElement("div");

    box.className =
        "compact-control";


    const label =
        document.createElement("label");

    label.textContent =
        title;


    const output =
        document.createElement("output");

    output.textContent =
        value;


    label.appendChild(output);


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


/* =========================================
   COLOR
========================================= */

function colorControl(
    title,
    value,
    callback
) {

    const box =
        document.createElement("div");

    box.className =
        "compact-control";


    const label =
        document.createElement("label");

    label.textContent =
        title;


    const input =
        document.createElement("input");

    input.type = "color";

    input.value =
        value || "#111111";


    input.addEventListener(
        "input",
        () => {

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
   WEIGHT
========================================= */

function weightControl(
    value,
    callback
) {

    const box =
        document.createElement("div");

    box.className =
        "compact-control";


    const label =
        document.createElement("label");

    label.textContent =
        "WEIGHT";


    const output =
        document.createElement("output");

    output.textContent =
        value;


    label.appendChild(output);


    const input =
        document.createElement("input");

    input.type = "range";

    input.min = 300;
    input.max = 900;
    input.step = 100;

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
   TIME CARD
========================================= */

function buildTimeCardStyle(
    container,
    item,
    update
) {

    container.innerHTML = `

        <div class="card-grid">

            <label>
                <span>ROUND</span>

                <input
                    type="range"
                    min="0"
                    max="25"
                    value="${item.timeRadius}"
                    data-time-radius
                >
            </label>

            <label>
                <span>PADDING</span>

                <input
                    type="range"
                    min="0"
                    max="20"
                    value="${item.timePadding}"
                    data-time-padding
                >
            </label>

            <label>
                <span>BACKGROUND</span>

                <input
                    type="color"
                    value="${
                        item.timeBackground ===
                        "transparent"
                            ? "#fafafa"
                            : item.timeBackground
                    }"
                    data-time-background
                >
            </label>

        </div>

        <button
            type="button"
            class="transparent-button"
            data-time-transparent
        >
            TRANSPARENT
        </button>

    `;


    const radius =
        container.querySelector(
            "[data-time-radius]"
        );

    const padding =
        container.querySelector(
            "[data-time-padding]"
        );

    const background =
        container.querySelector(
            "[data-time-background]"
        );


    radius.addEventListener(
        "input",
        () => {

            item.timeRadius =
                Number(radius.value);

            update();

            queueSave();

        }
    );


    padding.addEventListener(
        "input",
        () => {

            item.timePadding =
                Number(padding.value);

            update();

            queueSave();

        }
    );


    background.addEventListener(
        "input",
        () => {

            item.timeBackground =
                background.value;

            update();

            queueSave();

        }
    );


    container
        .querySelector(
            "[data-time-transparent]"
        )
        .addEventListener(
            "click",
            () => {

                item.timeBackground =
                    "transparent";

                update();

                queueSave();

            }
        );

}


/* =========================================
   TEXT CARD
========================================= */

function buildTextCardStyle(
    container,
    item,
    update
) {

    container.innerHTML = `

        <div class="card-grid">

            <label>
                <span>ROUND</span>

                <input
                    type="range"
                    min="0"
                    max="35"
                    value="${item.radius}"
                    data-radius
                >
            </label>

            <label>
                <span>PADDING</span>

                <input
                    type="range"
                    min="0"
                    max="25"
                    value="${item.padding}"
                    data-padding
                >
            </label>

            <label>
                <span>BACKGROUND</span>

                <input
                    type="color"
                    value="${
                        item.background ===
                        "transparent"
                            ? "#ffffff"
                            : item.background
                    }"
                    data-background
                >
            </label>

        </div>

        <button
            type="button"
            class="transparent-button"
            data-transparent
        >
            TRANSPARENT
        </button>

        <div class="gradient-box">

            <div class="gradient-header">

                <label>

                    <input
                        type="checkbox"
                        data-gradient
                        ${
                            item.gradient
                                ? "checked"
                                : ""
                        }
                    >

                    GRADIENT

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

                <input
                    type="color"
                    value="${item.gradientStart}"
                    data-gradient-start
                >

                <input
                    type="color"
                    value="${item.gradientEnd}"
                    data-gradient-end
                >

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

    const background =
        container.querySelector(
            "[data-background]"
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


    radius.addEventListener(
        "input",
        () => {

            item.radius =
                Number(radius.value);

            update();

            queueSave();

        }
    );


    padding.addEventListener(
        "input",
        () => {

            item.padding =
                Number(padding.value);

            update();

            queueSave();

        }
    );


    background.addEventListener(
        "input",
        () => {

            item.background =
                background.value;

            update();

            queueSave();

        }
    );


    transparent.addEventListener(
        "click",
        () => {

            item.background =
                "transparent";

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
        "input",
        () => {

            item.gradientStart =
                gradientStart.value;

            update();

            queueSave();

        }
    );


    gradientEnd.addEventListener(
        "input",
        () => {

            item.gradientEnd =
                gradientEnd.value;

            update();

            queueSave();

        }
    );

}


/* =========================================
   GRID
========================================= */

document
    .querySelectorAll("[data-grid]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                data.global.grid =
                    button.dataset.grid;

                updateGridButtons();

                updateGridPreview();

                queueSave();

            }
        );

    });


function updateGridButtons() {

    document
        .querySelectorAll("[data-grid]")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.grid ===
                data.global.grid
            );

        });

}


const gridColor =
    document.getElementById(
        "gridColor"
    );


gridColor.addEventListener(
    "input",
    () => {

        data.global.gridColor =
            gridColor.value;

        updateGridPreview();

        queueSave();

    }
);


function updateGridPreview() {

    gridPreview.dataset.grid =
        data.global.grid;

    gridPreview.style.setProperty(
        "--preview-grid-color",
        data.global.gridColor
    );

}


/* =========================================
   POINTER
========================================= */

const pointerSymbol =
    document.getElementById(
        "pointerSymbol"
    );

const pointerColor =
    document.getElementById(
        "pointerColor"
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

const pointerPreview =
    document.getElementById(
        "pointerPreview"
    );


function createPointerShape(
    type,
    size,
    color
) {

    const shape =
        document.createElement("span");

    shape.className =
        `pointer-shape ${type}`;


    const scale =
        Math.max(
            .55,
            Math.min(
                2,
                Number(size) / 28
            )
        );


    shape.style.transform =
        type === "diamond"
            ? `rotate(45deg) scale(${scale})`
            : `scale(${scale})`;


    shape.style.color =
        color;


    return shape;

}


function updatePointerPreview() {

    pointerPreview.innerHTML = "";


    const shape =
        createPointerShape(
            data.pointer.symbol,
            data.pointer.size,
            data.pointer.color
        );


    if (data.pointer.gradient) {

        shape.style.color =
            "transparent";

        shape.style.background =
            `linear-gradient(
                135deg,
                ${data.pointer.gradientStart},
                ${data.pointer.gradientEnd}
            )`;

        /*
         * Для clip-path фигур
         * background-gradient работает напрямую.
         */

    }


    pointerPreview.appendChild(shape);

}


pointerSymbol.addEventListener(
    "change",
    () => {

        data.pointer.symbol =
            pointerSymbol.value;

        updatePointerPreview();

        queueSave();

    }
);


pointerColor.addEventListener(
    "input",
    () => {

        data.pointer.color =
            pointerColor.value;

        updatePointerPreview();

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

        updatePointerPreview();

        queueSave();

    }
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


pointerGradientStart.addEventListener(
    "input",
    () => {

        data.pointer.gradientStart =
            pointerGradientStart.value;

        updatePointerPreview();

        queueSave();

    }
);


pointerGradientEnd.addEventListener(
    "input",
    () => {

        data.pointer.gradientEnd =
            pointerGradientEnd.value;

        updatePointerPreview();

        queueSave();

    }
);


/* =========================================
   LOAD UI
========================================= */

function loadSettingsUI() {

    /* GRID */

    gridColor.value =
        data.global.gridColor;

    updateGridButtons();
    updateGridPreview();


    /* POINTER */

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


    document
        .getElementById(
            "pointerGradientOptions"
        )
        .classList.toggle(
            "hidden",
            !data.pointer.gradient
        );


    updatePointerPreview();

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


start();
