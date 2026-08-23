function updatePointerPosition() {

    if (!pointer) {
        return;
    }


    const current =
        getCurrentTask();


    /*
     * Если pointer не нужен,
     * просто скрываем его.
     */

    if (!current) {

        pointer.style.display =
            "none";

        return;
    }


    const target =
        board.querySelector(
            `.schedule-row[data-time="${CSS.escape(
                current.time
            )}"]`
        );


    if (!target) {

        pointer.style.display =
            "none";

        return;
    }


    /*
     * Позиционируем pointer
     * относительно schedule.
     */

    const rowRect =
        target.getBoundingClientRect();


    const scheduleRect =
        schedule.getBoundingClientRect();


    const pointerSize =
        Math.max(
            10,
            Number(
                scheduleData.pointer?.size
            ) || 28
        );


    /*
     * Центр строки.
     */

    const y =
        rowRect.top
        -
        scheduleRect.top
        +
        schedule.scrollTop
        +
        rowRect.height / 2;


    /*
     * Маленький динамический
     * отступ слева.
     *
     * Большой pointer получает
     * чуть больше места,
     * маленький — совсем немного.
     */

    const sidePadding =
        Math.max(
            10,
            Math.min(
                18,
                pointerSize * 0.28
            )
        );


    /*
     * Pointer находится слева
     * от таблицы.
     */

    const x =
        sidePadding;


    pointer.style.left =
        `${x}px`;


    pointer.style.top =
        `${y}px`;


    pointer.style.display =
        "flex";
}
