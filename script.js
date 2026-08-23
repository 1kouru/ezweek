const image = document.getElementById("scheduleImage");
const triangle = document.querySelector(".triangle");

const dayName = document.getElementById("dayName");
const currentTime = document.getElementById("currentTime");

const prevDayButton = document.getElementById("prevDay");
const nextDayButton = document.getElementById("nextDay");

const todayButton = document.getElementById("todayButton");

const viewingLabel = document.getElementById("viewingLabel");

const dayButtons =
    document.querySelectorAll(".day-button");


/* =====================================================
   РАСПИСАНИЕ
===================================================== */

const DAYS = {

    MONDAY: {
        image: 1,

        times: [
            "08:00", "08:10", "08:30", "09:15", "09:40",
            "10:00", "11:00", "14:00", "15:00", "18:00",
            "20:00", "21:00", "23:00", "23:15"
        ],

        positions: [
            3.82, 5.47, 7.03, 8.75, 10.39,
            12.02, 13.67, 15.17, 16.93, 18.46,
            20.18, 21.74, 23.48, 25.22
        ]
    },


    TUESDAY: {
        image: 2,

        times: [
            "08:00", "08:10", "08:30", "09:15", "09:40",
            "10:00", "11:00", "14:00", "15:30", "16:00",
            "17:00", "18:00", "20:00", "23:00", "23:15"
        ],

        positions: [
            2.60, 4.25, 5.81, 7.53, 9.17,
            10.80, 12.44, 13.88, 15.71, 17.16,
            18.88, 20.54, 22.24, 23.91, 25.51
        ]
    },


    WEDNESDAY: {
        image: 3,

        times: [
            "08:00", "08:10", "08:30", "09:15", "09:40",
            "10:00", "11:00", "13:00", "14:00", "15:00",
            "20:00", "21:00", "22:00", "23:00", "23:15"
        ],

        positions: [
            2.60, 4.25, 5.81, 7.53, 9.17,
            10.80, 12.44, 13.88, 15.71, 17.16,
            18.88, 20.54, 22.24, 23.91, 25.51
        ]
    },


    THURSDAY: {
        image: 4,

        times: [
            "08:00", "08:10", "08:30", "09:15", "09:40",
            "10:00", "11:00", "14:00", "15:00", "17:00",
            "19:30", "20:30", "21:30", "23:00", "23:15"
        ],

        positions: [
            2.60, 4.25, 5.81, 7.53, 9.17,
            10.80, 12.44, 13.88, 15.71, 17.16,
            18.88, 20.54, 22.24, 23.91, 25.51
        ]
    },


    FRIDAY: {
        image: 5,

        times: [
            "08:00", "08:10", "08:30", "09:15", "09:40",
            "10:00", "11:00", "13:00", "14:00", "15:00",
            "20:00", "21:00", "21:30", "23:00", "23:15"
        ],

        positions: [
            2.60, 4.25, 5.81, 7.53, 9.17,
            10.80, 12.44, 13.88, 15.71, 17.16,
            18.88, 20.54, 22.24, 23.91, 25.51
        ]
    },


    SATURDAY: {
        image: 6,

        times: [
            "08:30", "08:40", "09:00", "09:45", "10:10",
            "10:30", "11:30", "15:00", "16:00", "17:00",
            "18:00", "20:00", "23:00", "23:15"
        ],

        positions: [
            3.82, 5.47, 7.03, 8.75, 10.39,
            12.02, 13.67, 15.17, 16.93, 18.46,
            20.18, 21.74, 23.48, 25.22
        ]
    },


    SUNDAY: {
        image: 7,

        times: [
            "09:00", "09:10", "09:30", "10:00", "13:00",
            "14:00", "15:00", "18:00", "19:00", "20:00",
            "21:00", "22:00", "22:15", "23:00"
        ],

        positions: [
            3.82, 5.47, 7.03, 8.75, 10.39,
            12.02, 13.67, 15.17, 16.93, 18.46,
            20.18, 21.74, 23.48, 25.22
        ]
    }

};


/* =====================================================
   ПОРЯДОК ДНЕЙ
===================================================== */

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


/* =====================================================
   КАКОЙ ДЕНЬ МЫ СЕЙЧАС СМОТРИМ
===================================================== */

let selectedDay = null;


/* =====================================================
   ВРЕМЯ АЛМАТЫ
===================================================== */

function getAlmatyTime() {

    const parts = new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: "Asia/Almaty",

            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",

            hour12: false
        }
    )
    .formatToParts(new Date());


    let hour = Number(
        parts.find(
            p => p.type === "hour"
        ).value
    );


    const minute = Number(
        parts.find(
            p => p.type === "minute"
        ).value
    );


    const second = Number(
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


/* =====================================================
   ДЕНЬ АЛМАТЫ
===================================================== */

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


/* =====================================================
   ВРЕМЯ → СЕКУНДЫ
===================================================== */

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


/* =====================================================
   ТЕКУЩЕЕ ВРЕМЯ → СЕКУНДЫ
===================================================== */

function getCurrentSeconds(time) {

    return (
        time.hour * 3600 +
        time.minute * 60 +
        time.second
    );

}


/* =====================================================
   ПОЗИЦИЯ ПО ВРЕМЕНИ
===================================================== */

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

        const scheduleTime =
            timeToSeconds(
                times[i]
            );


        if (
            currentSeconds >= scheduleTime
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


/* =====================================================
   PHOTOSHOP → PIXELS
===================================================== */

function inchesToOriginalPixels(
    inches
) {

    return (
        inches / 25.51
    ) * 1920;

}


/* =====================================================
   ПОСТАВИТЬ ТРЕУГОЛЬНИК
===================================================== */

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


    const originalY =
        inchesToOriginalPixels(
            yInches
        );


    const renderedY =
        originalY * scale;


    triangle.style.top =
        `${renderedY}px`;

}


/* =====================================================
   ЗАГРУЗИТЬ ДЕНЬ
===================================================== */

function loadDay(day) {

    const schedule =
        DAYS[day];


    if (!schedule) {
        return;
    }


    const imagePath =
        `images/${schedule.image}.png`;


    if (
        image.getAttribute("src") ===
        imagePath
    ) {

        updateTriangleForSelectedDay();

        return;

    }


    image.src =
        imagePath;


    image.onload = () => {

        updateTriangleForSelectedDay();

    };

}


/* =====================================================
   ОБНОВИТЬ СТРЕЛКУ
===================================================== */

function updateTriangleForSelectedDay() {

    const today =
        getAlmatyDay();


    /*
        Если смотрим не сегодняшний день,
        стрелку скрываем.
    */

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


    const time =
        getAlmatyTime();


    const currentSeconds =
        getCurrentSeconds(
            time
        );


    const y =
        calculatePosition(
            schedule.times,
            schedule.positions,
            currentSeconds
        );


    updateTriangle(y);

}


/* =====================================================
   ОБНОВИТЬ КНОПКИ ДНЕЙ
===================================================== */

function updateDayButtons() {

    const today =
        getAlmatyDay();


    dayButtons.forEach(
        button => {

            const buttonDay =
                button.dataset.day;


            button.classList.remove(
                "active",
                "today"
            );


            if (
                buttonDay === selectedDay
            ) {

                button.classList.add(
                    "active"
                );

            }


            if (
                buttonDay === today
            ) {

                button.classList.add(
                    "today"
                );

            }

        }
    );

}


/* =====================================================
   ОБНОВИТЬ VIEWING LABEL
===================================================== */

function updateViewingLabel() {

    const today =
        getAlmatyDay();


    if (
        selectedDay === today
    ) {

        viewingLabel.textContent =
            "TODAY";

        viewingLabel.classList.remove(
            "future"
        );

    }

    else {

        const todayIndex =
            WEEK.indexOf(today);


        const selectedIndex =
            WEEK.indexOf(selectedDay);


        let difference =
            selectedIndex -
            todayIndex;


        if (difference < 0) {

            difference += 7;

        }


        viewingLabel.classList.add(
            "future"
        );


        if (
            difference === 1
        ) {

            viewingLabel.textContent =
                "TOMORROW";

        }

        else if (
            difference === 2
        ) {

            viewingLabel.textContent =
                "DAY AFTER TOMORROW";

        }

        else {

            viewingLabel.textContent =
                SHORT_NAMES[selectedDay];

        }

    }

}


/* =====================================================
   ВЫБРАТЬ ДЕНЬ
===================================================== */

function selectDay(day) {

    if (!DAYS[day]) {
        return;
    }


    selectedDay =
        day;


    dayName.textContent =
        day;


    updateDayButtons();


    updateViewingLabel();


    loadDay(day);

}


/* =====================================================
   ПРЕДЫДУЩИЙ ДЕНЬ
===================================================== */

function previousDay() {

    const currentIndex =
        WEEK.indexOf(
            selectedDay
        );


    const previousIndex =
        (
            currentIndex - 1 + WEEK.length
        )
        %
        WEEK.length;


    selectDay(
        WEEK[previousIndex]
    );

}


/* =====================================================
   СЛЕДУЮЩИЙ ДЕНЬ
===================================================== */

function nextDay() {

    const currentIndex =
        WEEK.indexOf(
            selectedDay
        );


    const nextIndex =
        (
            currentIndex + 1
        )
        %
        WEEK.length;


    selectDay(
        WEEK[nextIndex]
    );

}


/* =====================================================
   ОБНОВИТЬ ВРЕМЯ
===================================================== */

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


/* =====================================================
   ОСНОВНОЕ ОБНОВЛЕНИЕ
===================================================== */

function update() {

    const today =
        getAlmatyDay();


    /*
        Если день изменился, но пользователь
        смотрел сегодняшний день — автоматически
        переключаемся на новый день.
    */

    if (!selectedDay) {

        selectedDay =
            today;

    }


    updateClock();


    /*
        Если selectedDay больше не соответствует
        сегодняшнему дню, мы НЕ переключаем
        пользователя принудительно.

        Он может спокойно смотреть завтра,
        послезавтра и другие дни.
    */

    updateDayButtons();


    updateViewingLabel();


    updateTriangleForSelectedDay();

}


/* =====================================================
   КЛИК ПО ДНЯМ
===================================================== */

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


/* =====================================================
   СТРЕЛКИ
===================================================== */

prevDayButton.addEventListener(
    "click",
    previousDay
);


nextDayButton.addEventListener(
    "click",
    nextDay
);


/* =====================================================
   КНОПКА TODAY
===================================================== */

todayButton.addEventListener(
    "click",
    () => {

        selectDay(
            getAlmatyDay()
        );

    }
);


/* =====================================================
   RESIZE
===================================================== */

window.addEventListener(
    "resize",
    () => {

        updateTriangleForSelectedDay();

    }
);


/* =====================================================
   ОБНОВЛЕНИЕ
===================================================== */

setInterval(
    () => {

        update();

    },
    1000
);


/* =====================================================
   START
===================================================== */

selectDay(
    getAlmatyDay()
);


update();