document.addEventListener("DOMContentLoaded", function() {
  loadDefaultPageContents();
  updatePageLayout();
  updateCodeHighlighting();
}, false);
window.addEventListener("resize", function(event) {
  updatePageLayout();
});

function loadDefaultPageContents() {
  var request = new XMLHttpRequest();
  request.open("GET", "menu.html", true);
  request.onreadystatechange = function() {
    if (this.readyState !==4) {
      return;
    };
    if (this.status!==200) {
      return
    };
    document.getElementById("menu").innerHTML = this.responseText;
  };
  request.send();
}

function updatePageLayout() {
  var width = window.innerWidth;
  if (width > 1220) {
    document.getElementsByTagName("main")[0].style.marginLeft = "220px";
    document.getElementsByTagName("main")[0].style.marginRight = "220px";
  } else if (width > 1020) {
    document.getElementsByTagName("main")[0].style.marginLeft = window.innerWidth - 1000 + "px";
    document.getElementsByTagName("main")[0].style.marginRight = window.innerWidth - 1000 + "px";
  } else {
    document.getElementsByTagName("main")[0].style.marginLeft = "20px";
    document.getElementsByTagName("main")[0].style.marginRight = "20px";
  }
}

function updateCodeHighlighting() {
  var blocks = document.getElementsByTagName("pre");
  for (var i = 0; i < blocks.length; i++) {
    var code = blocks[i].textContent.split("");
    blocks[i].textContent = "";
    var s = "";
    for (var j = 0; j < code.length; j++) {
      s += code[j];
      var n = code[j + 1];
      if (true || j + 1 == code.length) {
        var element = document.createElement("font");
        element.textContent = s;
        element.style.color = "var(--code-default)";
        blocks[i].appendChild(element);
        s = "";
      }
    }
  }
}

var menuOpen = false;

function toggleMenu() {
  menuOpen = !menuOpen;
  if (menuOpen) {
    document.getElementById("menu").style.left = "-40px";
  } else {
    document.getElementById("menu").style.left = "-241px";
  }
}

function updateListSearch(listID, inputID) {
  var values = document.getElementById(listID).getElementsByTagName("tr");
  for (var i = 0; i < values.length; i++) {
    if (values[i].getElementsByTagName("a")[0].textContent.toLowerCase().indexOf(document.getElementById(inputID).value.toLowerCase()) > -1) {
      values[i].style.display = "";
    } else {
      values[i].style.display = "none";
    }
  }
}
