// ON LOAD

document.addEventListener("DOMContentLoaded", function() {
  language = navigator.language || navigator.userLanguage;
  if (language == "de") {
    language = "german";
  } else {
    language = "english";
  }
  openLockScreen(false);
}, false);

// TIME UTILS

function formatDay(day) {
  if (day == 1 || day == 11 || day == 21 || day == 31) {
    return day + "st";
  } else if (day == 2 || day == 12 || day == 22) {
    return day + "nd";
  } else if (day == 3 || day == 13 || day == 23) {
    return day + "rd";
  } else {
    return day + "th";
  }
}

function getMonthName(month) {
  if (month == 1) {
    return "January";
  } else if (month == 2) {
    return "February";
  } else if (month == 3) {
    return "March";
  } else if (month == 4) {
    return "April";
  } else if (month == 5) {
    return "May";
  } else if (month == 6) {
    return "June";
  } else if (month == 7) {
    return "July";
  } else if (month == 8) {
    return "August";
  } else if (month == 9) {
    return "September";
  } else if (month == 10) {
    return "October";
  } else if (month == 11) {
    return "November";
  } else if (month == 12) {
    return "December";
  }
}

// NUMBER UTILS

function strechNumber(number, digits) {
  var result = "" + number;
  while (result.length < digits) {
    result = "0" + result;
  }
  if (digits < 0) {
    return "-" + result.replace("-", "");
  } else {
    return result;
  }
}

// GENEREL DATA

var language = "german";

// LOCK-SCREEN

var lockScreenTimeUpdateTimeout = null;
var lockScreenMovingOffset = null;

function openLockScreen(animate) {
  lockScreenKeyReactor = document.addEventListener("keydown", openUnlockScreen);
  document.getElementById("lockScreenBox").removeAttribute("hidden");
  setTimeout(function() {
    if (animate) {
      document.getElementById("lockScreen").style = "top: 0px; transition-duration: .2s;";
    } else {
      document.getElementById("lockScreen").style = "top: 0px;";
    }
  }, 0);
  updateLockScreenTime();
}

function startDraggingLockScreen(event) {
  if (document.getElementById("lockScreen").getBoundingClientRect().bottom != 0) {
    lockScreenMovingOffset = event.clientY;
  }
}

function lockScreenMouseMove(event) {
  if (lockScreenMovingOffset != null) {
    if (event.clientY > lockScreenMovingOffset) {
      document.getElementById("lockScreen").setAttribute("style", "top: 0px;");
    } else {
      document.getElementById("lockScreen").setAttribute("style", "top: " + (event.clientY - lockScreenMovingOffset) + "px;");
    }
  }
}

function stopLockScreenDrag(event) {
  if (lockScreenMovingOffset != null) {
    if (event.clientY - lockScreenMovingOffset <= -document.getElementById("body").getBoundingClientRect().bottom / 2) {
      openUnlockScreen();
    } else {
      document.getElementById("lockScreen").setAttribute("style", "transition-duration: .2s;");
    }
    lockScreenMovingOffset = null;
  }
}

function openUnlockScreen() {
  document.removeEventListener("keydown", openUnlockScreen);
  document.getElementById("lockScreen").setAttribute("style", "top: -100vh; transition-duration: .2s;");
  setTimeout(function() {
    //document.getElementById("lockScreenBox").setAttribute("hidden", "");
  }, 200);
}

function updateLockScreenTime() {
  var date = new Date();
  if (language == "german") {
    document.getElementById("lockScreen-time").innerText = date.getHours() + ":" + strechNumber(date.getMinutes(), 2);
    document.getElementById("lockScreen-date").innerText = date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear();
  } else if (language == "english") {
    if (date.getHours() < 12) {
      document.getElementById("lockScreen-time").innerText = date.getHours() + ":" + strechNumber(date.getMinutes(), 2) + " AM";
    } else {
      document.getElementById("lockScreen-time").innerText = (date.getHours() - 12) + ":" + strechNumber(date.getMinutes(), 2) + " PM";
    }
    document.getElementById("lockScreen-date").innerText = formatDay(date.getDate()) + " " + getMonthName(date.getMonth() + 1) + " " + date.getFullYear();
  }
  lockScreenTimeUpdateTimeout = setTimeout(updateLockScreenTime, (60 - date.getSeconds()) * 1000 - date.getMilliseconds());
}
