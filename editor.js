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


let selectedDay =
    "MONDAY";


let user = null;

let data = null;


/* =========================================
   ELEMENTS
========================================= */

const tasks =
    document.getElementById(
        "tasks"
    );

const saveButton =
    document.getElementById(
        "saveButton"
    );

const saveStatus =
    document.getElementById(
        "saveStatus"
    );

const addTask =
    document.getElementById(
        "addTask"
    );

const gridButton =
    document.getElementById(
        "gridButton"
    );

const pointerButton =
    document.getElementById(
        "pointerButton"
    );

const gridPanel =
    document.getElementById(
        "gridPanel"
    );

const pointerPanel =
    document.getElementById(
        "pointerPanel"
    );


/* =========================================
   DEFAULT
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

            taskBackground:
                "transparent",

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

    setStatus(
        "LOADING..."
    );


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

        setStatus(
            "LOAD ERROR"
        );

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


    setStatus(
        "READY"
    );

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

    });

}


/* =========================================
   SAVE
========================================= */

async function save() {

    setStatus(
        "SAVING..."
    );


    saveButton.disabled =
        true;


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


    saveButton.disabled =
        false;


    if (error) {

        console.error(
            "SUPABASE SAVE:",
            error
        );


        setStatus(
            "ERROR"
        );


        alert(
            "Ошибка сохранения:\n\n" +
            error.message +
            "\n\nCode: " +
            (error.code || "-")
        );


        return false;

    }


    setStatus(
        "SAVED ✓"
    );


    setTimeout(
        () => {

            setStatus(
                "READY"
            );

        },
        1500
    );


    return true;

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

        data.days[
            selectedDay
        ].push({

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

        });


        renderTasks();

        save();

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


        empty.style.padding =
            "50px 10px";

        empty.style.textAlign =
            "center";

        empty.style.color =
            "#aaa";

        empty.style.fontSize =
            "12px";

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
   CREATE CARD
========================================= */

function createTaskCard(item) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "task-card";


    /* TOP */

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


    remove.className =
        "delete-task";

    remove.textContent =
        "×";


    top.append(
        time,
        text,
        remove
    );


    card.appendChild(
        top
    );


    /* CONTROLS */

    const controls =
        document.createElement(
            "div"
        );


    controls.className =
        "task-controls";


    /* COLOR */

    controls.appendChild(
        colorControl(
            "TEXT COLOR",
            item.color,
            value => {

                item.color =
                    value;

            }
        )
    );


    /* FONT SIZE */

    controls.appendChild(
        rangeControl(
            "TEXT SIZE",
            8,
            50,
            item.fontSize,
            value => {

                item.fontSize =
                    Number(value);

            }
        )
    );


    /* FONT */

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

            }
        )
    );


    /* WEIGHT */

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
            String(
                item.fontWeight
            ),
            value => {

                item.fontWeight =
                    Number(value);

            }
        )
    );


    /* BACKGROUND */

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

            }
        )
    );


    /* RADIUS */

    controls.appendChild(
        rangeControl(
            "ROUND",
            0,
            40,
            item.radius,
            value => {

                item.radius =
                    Number(value);

            }
        )
    );


    /* PADDING */

    controls.appendChild(
        rangeControl(
            "PADDING",
            0,
            30,
            item.padding,
            value => {

                item.padding =
                    Number(value);

            }
        )
    );


    /* TIME COLOR */

    controls.appendChild(
        colorControl(
            "TIME COLOR",
            item.timeColor,
            value => {

                item.timeColor =
                    value;

            }
        )
    );


    /* TIME SIZE */

    controls.appendChild(
        rangeControl(
            "TIME SIZE",
            8,
            25,
            item.timeSize,
            value => {

                item.timeSize =
                    Number(value);

            }
        )
    );


    /* GRADIENT */

    const gradient =
        document.createElement(
            "div"
        );


    gradient.className =
        "control";


    gradient.innerHTML = `
        <div class="control-title">
            GRADIENT
        </div>

        <div class="gradient-row">

            <label>
                <input
                    type="checkbox"
                    ${item.gradient ? "checked" : ""}
                >
                ON
            </label>

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
    `;


    const checkbox =
        gradient.querySelector(
            "input[type=checkbox]"
        );


    const start =
        gradient.querySelector(
            "[data-gradient-start]"
        );


    const end =
        gradient.querySelector(
            "[data-gradient-end]"
        );


    checkbox.addEventListener(
        "change",
        () => {

            item.gradient =
                checkbox.checked;

            previewAndSave();

        }
    );


    start.addEventListener(
        "input",
        () => {

            item.gradientStart =
                start.value;

            previewAndSave();

        }
    );


    end.addEventListener(
        "input",
        () => {

            item.gradientEnd =
                end.value;

            previewAndSave();

        }
    );


    controls.appendChild(
        gradient
    );


    card.appendChild(
        controls
    );


    /* EVENTS */

    time.addEventListener(
        "change",
        () => {

            item.time =
                time.value ||
                "00:00";

            renderTasks();

            previewAndSave();

        }
    );


    text.addEventListener(
        "input",
        () => {

            item.text =
                text.value;

            previewAndSave();

        }
    );


    remove.addEventListener(
        "click",
        () => {

            data.days[
                selectedDay
            ] =
                data.days[
                    selectedDay
                ].filter(
                    x =>
                        x.id !==
                        item.id
                );


            renderTasks();

            save();

        }
    );


    return card;


    /* LIVE */

    function previewAndSave() {

        renderTasksPreview(card);

        queueSave();

    }


    function renderTasksPreview() {

        // Controls are intentionally
        // kept in-place on mobile.
        // The values update immediately.
        // Full persistence is debounced.

    }

}


/* =========================================
   CONTROL HELPERS
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


    box.innerHTML = `
        <div class="control-title">
            ${title}
        </div>

        <input
            type="color"
            value="${value || "#111111"}"
        >
    `;


    const input =
        box.querySelector(
            "input"
        );


    input.addEventListener(
        "input",
        () => {

            callback(
                input.value
            );

            queueSave();

        }
    );


    return box;

}


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

            queueSave();

        }
    );


    return box;

}


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

        const item =
            document.createElement(
                "option"
            );


        item.value =
            option;

        item.textContent =
            option;

        item.selected =
            option === value;


        select.appendChild(
            item
        );

    });


    select.addEventListener(
        "change",
        () => {

            callback(
                select.value
            );

            queueSave();

        }
    );


    box.append(
        titleElement,
        select
    );


    return box;

}


/* =========================================
   AUTOSAVE
========================================= */

let saveTimer = null;


function queueSave() {

    setStatus(
        "UNSAVED"
    );


    clearTimeout(
        saveTimer
    );


    saveTimer =
        setTimeout(
            () => {

                save();

            },
            1000
        );

}


/* =========================================
   GRID
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
                    .forEach(x => {

                        x.classList.toggle(
                            "active",
                            x === button
                        );

                    });


                queueSave();

            }
        );

    });


const gridColor =
    document.getElementById(
        "gridColor"
    );


gridColor.addEventListener(
    "input",
    () => {

        data.global.gridColor =
            gridColor.value;

        queueSave();

    }
);


/* =========================================
   POINTER
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
   LOAD UI
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

}


/* =========================================
   SAVE BUTTON
========================================= */

saveButton.addEventListener(
    "click",
    save
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


    await loadData();


    updateTabs();

    loadSettingsUI();

    renderTasks();

}


start();