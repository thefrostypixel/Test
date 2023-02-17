document.addEventListener("DOMContentLoaded", () => {
  darkMode = getCookie("darkMode");
  //darkMode = "false";
  if (darkMode == "true") {
    darkMode = true;
  } else if (darkMode == "false") {
    darkMode = false;
  } else {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      darkMode = true;
    } else {
      darkMode = false;
    }
  }
  document.getElementById("html").className = darkMode ? "dark-mode" : "";
  if (darkMode) {
    document.getElementById("color-mode-icon").setAttribute("d", "M8 .5L10.25 2.75H13.25V5.75L15.5 8L13.25 10.25V13.25H10.25L8 15.5L5.75 13.25H2.75V10.25L.5 8L2.75 5.75V2.75H5.75ZM4.25 8A1 1 0 0 0 11.75 8A1 1 0 0 0 4.25 8M5.75 8A1 1 0 0 0 10.25 8A1 1 0 0 0 5.75 8");
  } else {
    document.getElementById("color-mode-icon").setAttribute("d", "M13.75 1.505A7.5 7.5 0 1 0 13.75 14.495A7.5 7 0 0 1 13.75 1.505Z");
  }
  loadIcons();
  window.addEventListener("resize", () => {
    updateHeader();
    document.getElementById("footer").setAttribute("style", "margin-top: " + (Math.max(window.innerHeight - document.getElementById("main-content").getBoundingClientRect().height - document.getElementById("footer").getBoundingClientRect().height - 20, 0) + 20) + "px;");
  });
  updateHeader();
  document.getElementById("footer").setAttribute("style", "margin-top: " + (Math.max(window.innerHeight - document.getElementById("main-content").getBoundingClientRect().height - document.getElementById("footer").getBoundingClientRect().height - 20, 0) + 20) + "px;");
  var scrollAnimatedElements = document.getElementsByClassName("animate-scroll");
  for (i = 0; i < scrollAnimatedElements.length; i++) {
    scrollAnimatedElements[i].classList.add("as-hidden");
  }
  setTimeout(animateScroll);
  document.getElementById("main").addEventListener("scroll", () => {
    updateHeaderDownloadButton();
    animateScroll();
  });
});

document.addEventListener("click", (e) => {
  if (!document.getElementById("header-menu").hasAttribute("hidden")) {
    var clicked = document.elementFromPoint(e.clientX, e.clientY);
    var shouldClose = true;
    while (clicked != null) {
      if ((clicked.id == "header" && window.innerWidth < 600) || clicked.id == "header-menu" || clicked.getAttribute("onclick") == "toggleHeaderMenu();") {
        shouldClose = false;
        break;
      }
      clicked = clicked.parentElement;
    }
    if (shouldClose) {
      toggleHeaderMenu();
    }
  }
});

function loadIcons() {
  var is = document.getElementsByTagName("i");
  for (i = 0; i < is.length; i++) {
    if (is[i].classList.contains("check")) {
      is[i].innerHTML = "<svg viewBox='0 0 16 16'><path fill='var(--green)' d='M0 8A1 1 0 0 0 16 8A1 1 0 0 0 0 8'/><path fill='none' stroke='var(--background-color)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' d='M4 9L7 11.5L11 5'/></svg>";
    } else if (is[i].classList.contains("minus")) {
      is[i].innerHTML = "<svg viewBox='0 0 16 16'><path fill='var(--yellow)' d='M0 8A1 1 0 0 0 16 8A1 1 0 0 0 0 8'/><path fill='none' stroke='var(--background-color)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' d='M4 8H12'/></svg>";
    } else if (is[i].classList.contains("cross")) {
      is[i].innerHTML = "<svg viewBox='0 0 16 16'><path fill='var(--red)' d='M0 8A1 1 0 0 0 16 8A1 1 0 0 0 0 8'/><path fill='none' stroke='var(--background-color)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' d='M5 5L11 11M5 11L11 5'/></svg>";
    }
  }
}

function updateHeaderDownloadButton() {
  if (document.getElementById("page-download-button") != null) {
    var rect = document.getElementById("page-download-button").getBoundingClientRect();
    if (rect.top < 77) {
      document.getElementById("header-download-button").setAttribute("style", "opacity: " + (77 - rect.top) / rect.height + ";");
    } else {
      document.getElementById("header-download-button").setAttribute("style", "display: none;");
    }
  }
}

function animateScroll() {
  var scrollAnimatedElements = document.getElementsByClassName("animate-scroll");
  for (i = 0; i < scrollAnimatedElements.length; i++) {
    if (scrollAnimatedElements[i].getBoundingClientRect().top < window.innerHeight) {
      scrollAnimatedElements[i].classList.add("as-visible");
      scrollAnimatedElements[i].classList.remove("as-hidden");
    } else {
      scrollAnimatedElements[i].classList.add("as-hidden");
      scrollAnimatedElements[i].classList.remove("as-visible");
    }
  }
}

var headerContentsHidden = true;

function updateHeader() {
  if (headerContentsHidden) {
    document.getElementById("header-download-button-text").removeAttribute("style");
    var hidableHeaderLinks = document.getElementsByClassName("hidable-header-link");
    for (i = 0; i < hidableHeaderLinks.length; i++) {
      hidableHeaderLinks[i].removeAttribute("style");
    }
  }
  document.getElementById("header-download-button").removeAttribute("style");
  if (document.getElementById("header").getBoundingClientRect().bottom > 100) {
    var done = false;
    var hidableHeaderLinks = document.getElementsByClassName("hidable-header-link");
    for (i = hidableHeaderLinks.length - 1; i >= 0; i--) {
      hidableHeaderLinks[i].setAttribute("style", "display: none;");
      headerContentsHidden = true;
      if (document.getElementById("header").getBoundingClientRect().bottom < 100) {
        done = true;
        break;
      }
    }
    if (!done) {
      document.getElementById("header-download-button-text").setAttribute("style", "display: none;");
    }
  }
  updateHeaderDownloadButton();
  if (window.innerWidth < 600 && !document.getElementById("header-menu").hasAttribute("hidden")) {
    document.getElementById("header-download-button").removeAttribute("style");
    document.getElementById("header-menu").className = "full-header-menu";
  } else if (window.innerWidth < 1400) {
    document.getElementById("header-menu").className = "small-header-menu side-header-menu";
  } else {
    document.getElementById("header-menu").className = "small-header-menu";
  }
}

function toggleHeaderMenu() {
  if (document.getElementById("header-menu").hasAttribute("hidden")) {
    document.getElementById("header-menu").removeAttribute("hidden");
  } else {
    document.getElementById("header-menu").setAttribute("hidden", "hidden");
  }
  updateHeader();
}

var darkMode = false;

function toggleColorMode() {
  document.getElementById("html").className = darkMode ? "" : "dark-mode";
  darkMode = !darkMode;
  if (darkMode) {
    document.getElementById("color-mode-icon").setAttribute("d", "M8 .5L10.25 2.75H13.25V5.75L15.5 8L13.25 10.25V13.25H10.25L8 15.5L5.75 13.25H2.75V10.25L.5 8L2.75 5.75V2.75H5.75ZM4.25 8A1 1 0 0 0 11.75 8A1 1 0 0 0 4.25 8M5.75 8A1 1 0 0 0 10.25 8A1 1 0 0 0 5.75 8");
  } else {
    document.getElementById("color-mode-icon").setAttribute("d", "M13.75 1.505A7.5 7.5 0 1 0 13.75 14.495A7.5 7 0 0 1 13.75 1.505Z");
  }
  setCookie("darkMode", darkMode, 360);
}

function setCookie(name, value, days) {
  var d = new Date();
  d.setTime(d.getTime() + days * 61440);
  document.cookie = name + "=" + value + ";expires=" + d.toUTCString();
}

function getCookie(cname) {
  var name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}
