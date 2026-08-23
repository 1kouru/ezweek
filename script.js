const image =
    document.getElementById("scheduleImage");

const triangle =
    document.querySelector(".triangle");

const dayName =
    document.getElementById("dayName");

const currentTime =
    document.getElementById("currentTime");

const prevDayButton =
    document.getElementById("prevDay");

const nextDayButton =
    document.getElementById("nextDay");

const selectedDayButton =
    document.getElementById(
        "selectedDayButton"
    );

const selectedDayLabel =
    document.getElementById(
        "selectedDayLabel"
    );

const selectedDayName =
    document.getElementById(
        "selectedDayName"
    );

const scheduleElement =
    document.getElementById("schedule");

const dayButtons =
    document.querySelectorAll(
        ".day-button"
    );

import { supabase } from "./supabase.js";

const {
    data: {
        session
    }
} = await supabase.auth.getSession();

if (!session) {
    window.location.href = "auth.html";
}

/* =========================================
   РАСПИСАНИЕ
========================================= */

const DAYS = {

    MONDAY: {
        image: 1,

        times: [
            "08:00", "08:10", "08:30",
            "09:15", "09:40", "10:00",
            "11:00", "14:00", "15:00",
            "18:00", "20:00", "21:00",
            "23:00", "23:15"
        ],

        positions: [
            3.82, 5.47, 7.03,
            8.75, 10.39, 12.02,
            13.67, 15.17, 16.93,
            18.46, 20.18, 21.74,
            23.48, 25.22
        ]
    },


    TUESDAY: {
        image: 2,

        times: [
            "08:00", "08:10", "08:30",
            "09:15", "09:40", "10:00",
            "11:00", "14:00", "15:30",
            "16:00", "17:00", "18:00",
            "20:00", "23:00", "23:15"
        ],

        positions: [
            2.60, 4.25, 5.81,
            7.53, 9.17, 10.80,
            12.44, 13.88, 15.71,
            17.16, 18.88, 20.54,
            22.24, 23.91, 25.51
        ]
    },


    WEDNESDAY: {
        image: 3,

        times: [
            "08:00", "08:10", "08:30",
            "09:15", "09:40", "10:00",
            "11:00", "13:00", "14:00",
            "15:00", "20:00", "21:00",
            "22:00", "23:00", "23:15"
        ],

        positions: [
            2.60, 4.25, 5.81,
            7.53, 9.17, 10.80,
            12.44, 13.88, 15.71,
            17.16, 18.88, 20.54,
            22.24, 23.91, 25.51
        ]
    },


    THURSDAY: {
        image: 4,

        times: [
            "08:00", "08:10", "08:30",
            "09:15", "09:40", "10:00",
            "11:00", "14:00", "15:00",
            "17:00", "19:30", "20:30",
            "21:30", "23:00", "23:15"
        ],

        positions: [
            2.60, 4.25, 5.81,
            7.53, 9.17, 10.80,
            12.44, 13.88, 15.71,
            17.16, 18.88, 20.54,
            22.24, 23.91, 25.51
        ]
    },


    FRIDAY: {
        image: 5,

        times: [
            "08:00", "08:10", "08:30",
            "09:15", "09:40", "10:00",
            "11:00", "13:00", "14:00",
            "15:00", "20:00", "21:00",
            "21:30", "23:00", "23:15"
        ],

        positions: [
            2.60, 4.25, 5.81,
            7.53, 9.17, 10.80,
            12.44, 13.88, 15.71,
            17.16, 18.88, 20.54,
            22.24, 23.91, 25.51
        ]
    },


    SATURDAY: {
        image: 6,

        times: [
            "08:30", "08:40", "09:00",
            "09:45", "10:10", "10:30",
            "11:30", "15:00", "16:00",
            "17:00", "18:00", "20:00",
            "23:00", "23:15"
        ],

        positions: [
            3.82, 5.47, 7.03,
            8.75, 10.39, 12.02,
            13.67, 15.17, 16.93,
            18.46, 20.18, 21.74,
            23.48, 25.22
        ]
    },


    SUNDAY: {
        image: 7,

        times: [
            "09:00", "09:10", "09:30",
            "10:00", "13:00", "14:00",
            "15:00", "18:00", "19:00",
            "20:00", "21:00", "22:00",
            "22:15", "23:00"
        ],

        positions: [
            3.82, 5.47, 7.03,
            8.75, 10.39, 12.02,
            13.67, 15.17, 16.93,
            18.46, 20.18, 21.74,
            23.48, 25.22
        ]
    }

};


const WEEK = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY"
];


const SHORT_NAMES = {

    MONDAY: "MON",
    TUESDAY: "TUE",
    WEDNESDAY: "WED",
    THURSDAY: "THU",
    FRIDAY: "FRI",
    SATURDAY: "SAT",
    SUNDAY: "SUN"

};


let selectedDay = null;


/* =========================================
   AUTH CHECK
========================================= */

async function checkAuth() {

    const {
        data
    } = await supabase.auth.getSession();

    if (!data.session) {

        window.location.href =
            "auth.html";

    }

}


checkAuth();


/* =========================================
   ALMATY TIME
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
        )
        .formatToParts(
            new Date()
        );


    let hour =
        Number(
            parts.find(
                p => p.type === "hour"
            ).value
        );


    const minute =
        Number(
            parts.find(
                p => p.type === "minute"
            ).value
        );


    const second =
        Number(
            parts.find(
                p => p.type === "second"
            ).value
        );


    if (hour === 24) {
        hour = 0;
    }


    return {
        hour,
        minute,
        second
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
    .format(
        new Date()
    )
    .toUpperCase();

}


function timeToSeconds(time) {

    const [
        hours,
        minutes
    ] =
        time
        .split(":")
        .map(Number);


    return (
        hours * 3600 +
        minutes * 60
    );

}


function getCurrentSeconds(time) {

    return (
        time.hour * 3600 +
        time.minute * 60 +
        time.second
    );

}


/* =========================================
   POSITION
========================================= */

function calculatePosition(
    times,
    positions,
    currentSeconds
) {

    let currentPosition =
        positions[0];


    for (
        let i = 0;
        i < times.length;
        i++
    ) {

        if (
            currentSeconds >=
            timeToSeconds(times[i])
        ) {

            currentPosition =
                positions[i];

        }

        else {

            break;

        }

    }


    return currentPosition;

}


function inchesToOriginalPixels(
    inches
) {

    return (
        inches / 25.51
    ) * 1920;

}


function updateTriangle(
    yInches
) {

    const renderedHeight =
        image
        .getBoundingClientRect()
        .height;


    if (!renderedHeight) {
        return;
    }


    const scale =
        renderedHeight / 1920;


    const renderedY =
        inchesToOriginalPixels(
            yInches
        )
        *
        scale;


    triangle.style.top =
        `${renderedY}px`;

}


function updateTriangleForSelectedDay() {

    const today =
        getAlmatyDay();


    if (
        selectedDay !== today
    ) {

        triangle.style.display =
            "none";

        return;

    }


    triangle.style.display =
        "block";


    const schedule =
        DAYS[selectedDay];


    const currentSeconds =
        getCurrentSeconds(
            getAlmatyTime()
        );


    const position =
        calculatePosition(
            schedule.times,
            schedule.positions,
            currentSeconds
        );


    updateTriangle(
        position
    );

}


/* =========================================
   LOAD DAY
========================================= */

function loadDay(day) {

    const imagePath =
        `images/${DAYS[day].image}.png`;


    if (
        image.getAttribute("src") ===
        imagePath
    ) {

        updateTriangleForSelectedDay();

        return;

    }


    image.onload =
        updateTriangleForSelectedDay;


    image.src =
        imagePath;

}


/* =========================================
   UI
========================================= */

function updateDayButtons() {

    const today =
        getAlmatyDay();


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


function updateSelectedDayInfo() {

    const today =
        getAlmatyDay();


    selectedDayName.textContent =
        selectedDay;


    if (
        selectedDay === today
    ) {

        selectedDayLabel.textContent =
            "TODAY";

        return;

    }


    let difference =
        WEEK.indexOf(selectedDay) -
        WEEK.indexOf(today);


    if (difference < 0) {

        difference += 7;

    }


    if (difference === 1) {

        selectedDayLabel.textContent =
            "TOMORROW";

    }

    else if (difference === 2) {

        selectedDayLabel.textContent =
            "DAY AFTER TOMORROW";

    }

    else {

        selectedDayLabel.textContent =
            SHORT_NAMES[selectedDay];

    }

}


function selectDay(day) {

    selectedDay =
        day;


    dayName.textContent =
        day;


    updateDayButtons();

    updateSelectedDayInfo();

    loadDay(day);

}


function previousDay() {

    const index =
        WEEK.indexOf(selectedDay);


    selectDay(
        WEEK[
            (
                index - 1 + 7
            )
            %
            7
        ]
    );

}


function nextDay() {

    const index =
        WEEK.indexOf(selectedDay);


    selectDay(
        WEEK[
            (
                index + 1
            )
            %
            7
        ]
    );

}


/* =========================================
   CLOCK
========================================= */

function updateClock() {

    const time =
        getAlmatyTime();


    currentTime.textContent =
        String(time.hour)
        .padStart(2, "0")
        +
        ":"
        +
        String(time.minute)
        .padStart(2, "0");

}


/* =========================================
   EVENTS
========================================= */

prevDayButton.addEventListener(
    "click",
    previousDay
);


nextDayButton.addEventListener(
    "click",
    nextDay
);


selectedDayButton.addEventListener(
    "click",
    () => {

        selectDay(
            getAlmatyDay()
        );

    }
);


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


/* =========================================
   SWIPE
========================================= */

let startX = 0;
let startY = 0;


scheduleElement.addEventListener(
    "touchstart",

    event => {

        startX =
            event.changedTouches[0].screenX;

        startY =
            event.changedTouches[0].screenY;

    },

    {
        passive: true
    }

);


scheduleElement.addEventListener(
    "touchend",

    event => {

        const endX =
            event.changedTouches[0].screenX;

        const endY =
            event.changedTouches[0].screenY;


        const diffX =
            endX - startX;

        const diffY =
            endY - startY;


        if (
            Math.abs(diffX) <
            50
        ) {

            return;

        }


        if (
            Math.abs(diffX) <=
            Math.abs(diffY)
        ) {

            return;

        }


        if (diffX < 0) {

            nextDay();

        }

        else {

            previousDay();

        }

    },

    {
        passive: true
    }

);


window.addEventListener(
    "resize",
    updateTriangleForSelectedDay
);


/* =========================================
   START
========================================= */

selectedDay =
    getAlmatyDay();


selectDay(
    selectedDay
);


setInterval(
    () => {

        updateClock();

        updateTriangleForSelectedDay();

    },
    1000
);