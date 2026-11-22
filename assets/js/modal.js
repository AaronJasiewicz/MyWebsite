var modal = null;
var scrollPosition = 0;
var previousBodyStyles = null;

function open_modal(id) {
    modal = document.getElementById(id);
    if (!modal) {
        throw new Error("Project modal not found: " + id);
    }

    scrollPosition = window.scrollY || document.documentElement.scrollTop;
    previousBodyStyles = {
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
        overflow: document.body.style.overflow
    };
    document.body.style.position = "fixed";
    document.body.style.top = "-" + scrollPosition + "px";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    modal.style.display = "block";
}

function close_modal() {
    if (!modal) {
        return;
    }

    modal.style.display = "none";
    document.body.style.position = previousBodyStyles.position;
    document.body.style.top = previousBodyStyles.top;
    document.body.style.width = previousBodyStyles.width;
    document.body.style.overflow = previousBodyStyles.overflow;
    window.scrollTo(0, scrollPosition);
    modal = null;
    previousBodyStyles = null;
}