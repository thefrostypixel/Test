let threejs;
let three = {};

// Utils
let now = 0;
let genID = () => Math.round(Math.random() * 4294967296);
let stepAngle = (angle, targetAngle, stepSize) => {
    let diff = targetAngle - angle;
    angle += Math.max(-stepSize, Math.min(stepSize, diff > Math.PI || diff < -Math.PI ? -diff : diff));
    if (angle > Math.PI) {
        return angle - 2 * Math.PI;
    } else if (angle < -Math.PI) {
        return angle + 2 * Math.PI;
    } else {
        return angle;
    }
};
let closestFromList = (l, n) => l.reduce((p, c) => Math.abs(c - n) < Math.abs(p - n) ? c : p);
let mergeObjects = (target, other) => {
    for (let key of Object.keys(target)) {
        if (other[key] && typeof target[key] == typeof other[key]) {
            if (typeof target[key] == "object") {
                mergeObjects(target[key], other[key]);
            } else {
                target[key] = other[key];
            }
        }
    }
};
let arePointsOnSameSide = (l1, l2, p1, p2) => ((l2.x - l1.x) * (p1.y - l1.y) - (l2.y - l1.y) * (p1.x - l1.x)) * ((l2.x - l1.x) * (p2.y - l1.y) - (l2.y - l1.y) * (p2.x - l1.x)) >= 0;

// HTML Elements
let setInnerHTML = (element, html) => {
    if (element.innerHTML != html) {
        element.innerHTML = html;
    }
};
let showElement = element => {
    let transform = "";
    for (let styleSheet of document.styleSheets) {
        for (let rule of styleSheet.cssRules) {
            if (rule.selectorText && rule.selectorText.indexOf("::") == -1 && Array.from(document.querySelectorAll(rule.selectorText)).indexOf(element) > -1) {
                transform = " " + rule.style.transform;
            }
        }
    }
    element.removeAttribute("hidden");
    if (transform.indexOf("scale(var(--ui-scale))") == -1) {
        element.style = "transform:" + transform + " scale(.5); opacity: 0;";
        element.getBoundingClientRect();
        element.style = "transform:" + transform + "scale(1); pointer-events: none; transition: .2s opacity, .2s transform;";
    } else {
        element.style = "transform:" + transform.replace("scale(var(--ui-scale))", "scale(calc(var(--ui-scale) * .5))") + "; opacity: 0;";
        element.getBoundingClientRect();
        element.style = "pointer-events: none; transition: .2s opacity, .2s transform;";
    }
    setTimeout(() => element.removeAttribute("style"), 200);
};
let hideElement = element => {
    let transform = "";
    for (let styleSheet of document.styleSheets) {
        for (let rule of styleSheet.cssRules) {
            if (rule.selectorText && rule.selectorText.indexOf("::") == -1 && Array.from(document.querySelectorAll(rule.selectorText)).indexOf(element) > -1) {
                transform = " " + rule.style.transform;
            }
        }
    }
    if (transform.indexOf("scale(var(--ui-scale))") == -1) {
        element.style = "transform:" + transform + " scale(1);";
        element.getBoundingClientRect();
        element.style = "transform:" + transform + " scale(.5); opacity: 0; pointer-events: none; transition: .2s opacity, .2s transform;";
    } else {
        element.style = "transform:" + transform.replace("scale(var(--ui-scale))", "scale(calc(var(--ui-scale) * .5))") + "; opacity: 0; pointer-events: none; transition: .2s opacity, .2s transform;";
    }
    setTimeout(() => {
        element.removeAttribute("style");
        element.setAttribute("hidden", "");
    }, 200);
};

// Client Related Variables
let platform = {
    host: undefined,
    online: undefined,

    client: typeof window == "object",
    server: typeof window == "undefined",

    browser: typeof window == "object" && typeof window.process == "undefined", // This is for Electron, won't work for other apps
    app: typeof window == "object" && typeof window.process == "object", // This is for Electron, won't work for other apps

    desktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),

    apple: /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent),
    mac: /Mac/i.test(navigator.userAgent) && !/iPhone|iPad|iPod/i.test(navigator.userAgent),
    iOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),

    windows: /Win/i.test(navigator.userAgent),
    linux: /Linux/i.test(navigator.userAgent),
    android: /Android/i.test(navigator.userAgent),
};
let menuScreen = "main";
let inGame = false;
let settings = {
    lang: "en-US"
};
let translations = {};

// Server Related Variables
let game = {
    mode: "FFA",
    timeScale: 1
};
let player = {
    baseMove: {
        speed: 2,
        smooth: .1,
        friction: 0,
        noCol: false
    },
    move: {},
    pos: {
        x: 30.68,
        y: 11.64
    },
    vel: {
        x: 0,
        y: 0,
        angle: 0
    },
    effects: [],
    size: .35,
    abilities: [
        {
            name: "fireball",
            level: 1,
            lastUse: -Infinity
        },
        {
            name: "iceBolt",
            level: 1,
            lastUse: -Infinity
        },
        {
            name: "lightning",
            level: 1,
            lastUse: -Infinity
        },
        {
            name: "shadowBolt",
            level: 1,
            lastUse: -Infinity
        },
        {
            name: "shockwave",
            level: 1,
            lastUse: -Infinity
        }
    ],
    melee: {
        damage: 10,
        range: 1,
        lastHit: -Infinity
    },
    target: undefined,
    path: undefined,
    id: genID(),
    name: "You",
    health: 100,
    damageTaken: 0,
    mesh: undefined,
    isBot: false
};
let frank = {
    baseMove: {
        speed: 2,
        smooth: .1,
        friction: 0,
        noCol: false
    },
    move: {},
    pos: {
        x: 30.68,
        y: 11.64
    },
    vel: {
        x: 0,
        y: 0,
        angle: 0
    },
    effects: [],
    size: .35,
    melee: {
        damage: 10,
        range: 1,
        lastHit: -Infinity
    },
    target: undefined,
    path: undefined,
    id: genID(),
    name: "Bot Frank",
    health: 100,
    damageTaken: 0,
    path: undefined,
    mesh: undefined,
    isBot: true
};
let players = [
    player,
    frank
];
let cam = {
    move: {
        speed: 10,
        smooth: .1,
        friction: 0
    },
    pos: {
        x: 0,
        y: 0
    },
    vel: {
        x: 0,
        y: 0
    },
    dist: 8,
    angle: .25,
    following: player
};
let objects = [];

// Loading
let setupThreeJs = () => {
    three.renderer = new threejs.WebGLRenderer({canvas: document.getElementById("canvas")});
    three.renderer.setSize(window.innerWidth, window.innerHeight);
    three.camera = new threejs.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 1e3);
    three.scene = new threejs.Scene();
    let assetsLoaded = 0;
    let onAssetLoadComplete = () => {
        if (++assetsLoaded == players.length) {
            inGame = true;
            document.querySelectorAll(".menu").forEach(e => e.setAttribute("hidden", ""));
            document.getElementById("game").removeAttribute("hidden");
        }
    };
    three.gltfLoader = new threejs.GLTFLoader();
    for (let i = 0; i < players.length; i++) {
        three.gltfLoader.load("models/characters/arrow.glb", model => {
            players[i].mesh = model.scene;
            three.scene.add(model.scene);
            onAssetLoadComplete();
        });
    }
    loadWorld("world");
};
document.onreadystatechange = () => {
    if (document.readyState == "interactive") { // HTML, CSS & JS Finished Loading
        loadSettings(() => {
            document.getElementById("main-menu-buttons").style = "opacity: 1;";
        });
        if (platform.browser) {
            document.getElementById("main-menu-button-download").removeAttribute("hidden");
        } else if (platform.app) {
            document.getElementById("main-menu-button-quit").removeAttribute("hidden");
        }
    } else if (document.readyState == "complete") { // Images & Fonts Finished Loading
        threejs = window.threejs;
        document.getElementById("main-menu-background").style.opacity = 1;
        document.getElementById("main-menu-button-play").setAttribute("onclick", "setupThreeJs(); menuScreen = \"game\";");
        // DEBUG
        setupThreeJs();
        menuScreen = "game";
        // DEBUG END
        frame();
    }
};

// Input
let keycodeToName = code => {
    let key = code;
    if (key.match(/^Key([A-Z])$/)) {
        key = key.slice(3);
    } else if (key.match(/^Digit([0-9])$/)) {
        key = key.slice(5);
    } else if (key.startsWith("Arrow")) {
        key = key.slice(5)
            .replaceAll("Up", "△")
            .replaceAll("Down", "▽")
            .replaceAll("Left", "◁")
            .replaceAll("Right", "▷");
    } else if (key.startsWith("Numpad")) {
        key = "Numpad " + key.slice(6);
    } else if (key == "ShiftLeft" || key == "ShiftRight") {
        key = "⇧";
    } else if ((key == "ControlLeft" || key == "ControlRight") && platform.apple) {
        key = "⌃";
    } else if (key == "ControlLeft" || key == "ControlRight") {
        key = "Ctrl";
    } else if ((key == "AltLeft" || key == "AltRight") && platform.apple) {
        key = "⌥";
    } else if (key == "AltLeft" || key == "AltRight") {
        key = "Alt";
    } else if ((key == "MetaLeft" || key == "MetaRight") && platform.apple) {
        key = "⌘";
    } else if (key == "MetaLeft" || key == "MetaRight") {
        key = "Super";
    } else if (key == "NumLock" && platform.apple) {
        key = "Numpad ⌧";
    }
    /*if (code.indexOf("Left") > -1 && code.indexOf("Arrow") == -1) {
        key = "Left " + key;
    } else if (code.indexOf("Right") > -1 && code.indexOf("Arrow") == -1) {
        key = "Right " + key;
    }*/
    key = key
        .replaceAll("CapsLock", "⇪")
        .replaceAll("Tab", "⇥")
        .replaceAll("Enter", "↵")
        .replaceAll("Escape", "Esc")
        .replaceAll("Backspace", "⌫")
        .replaceAll("Delete", "⌦")
        .replaceAll("PageUp", "Page ↑")
        .replaceAll("PageDown", "Page ↓")
        .replaceAll("Plus", "+")
        .replaceAll("Add", "+")
        .replaceAll("Minus", "-")
        .replaceAll("Subtract", "-")
        .replaceAll("Multiply", "*")
        .replaceAll("Slash", "/")
        .replaceAll("Divide", "/")
        .replaceAll("Equal", "=")
        .replaceAll("IntlBackslash", "\\")
        .replaceAll("Backslash", "\\")
        .replaceAll("BracketLeft", "[")
        .replaceAll("BracketRight", "]")
        .replaceAll("Quote", "'")
        .replaceAll("Backquote", "`")
        .replaceAll("Semicolon", ";")
        .replaceAll("Comma", ",")
        .replaceAll("Period", ".")
        .replaceAll("Decimal", new Intl.NumberFormat().formatToParts(.1).find(part => part.type == "decimal").value);
    return key;
};
let mouseButtonToName = mb => {
    if (mb == 0) {
        return "Left Mouse";
    } else if (mb == 1) {
        return "Mouse Wheel";
    } else if (mb == 2) {
        return "Right Mouse";
    } else {
        return "Mouse " + (mb + 1);
    }
};
let controls = {
    pos: {x: 0, y: 0},
    oldPos: {x: 0, y: 0},
    worldPos: undefined,
    target: undefined,
    held: {},
    pressed: {},
    released: [],
    scrolled: 0,
    clickCausedFocus: false
};
let focused = platform.client && document.hasFocus() ? now: false;
if (platform.client) {
    document.onkeydown = e => {
        let key = keycodeToName(e.code);
        if (key == "Tab" || key == "Space" || key == "Enter") {
            e.preventDefault();
        }
        if (!document.getElementById("settings-control-input").hasAttribute("hidden")) {
            document.getElementById("settings-control-input").setAttribute("hidden", "");
            let control = document.getElementById("settings-control-input-title").getAttribute("trans").substring(17);
            settings.controls[control] = key;
            let button = document.getElementById("settings-control-" + control);
            button.removeAttribute("trans");
            button.innerText = "";
            if (settings.controls[control] == "Unbound") {
                button.setAttribute("trans", "control.unbound");
            } else  if (settings.controls[control] == "Esc") {
                button.setAttribute("trans", "control.esc");
            } else if (settings.controls[control] == "Space") {
                button.setAttribute("trans", "control.space");
            } else if (settings.controls[control].startsWith("Numpad ")) {
                button.setAttribute("trans", "control.numpad");
                button.innerText = settings.controls[control].substring(6);
            } else {
                button.innerText = settings.controls[control];
            }
        } else if (!controls.held[key]) {
            controls.held[key] = {
                type: "Keyboard",
                startPos: controls.pos,
                startWorldPos: controls.worldPos,
                startTarget: controls.target,
                moved: false,
                offset: {x: 0, y: 0},
                worldOffset: {x: 0, y: 0, z: 0},
                lastPositions: []
            };
            controls.pressed[key] = {
                type: "Keyboard",
                pos: controls.pos,
                startWorldPos: controls.worldPos,
                endWorldPos: controls.worldPos,
                target: controls.target
            };
        }
    };
    document.onkeyup = e => {
        let key = keycodeToName(e.code);
        if (controls.held[key]) {
            controls.released.push(key);
        }
    };
    document.onmousedown = e => {
        if (platform.mobile && !e.fromTouch) {
            return;
        }
        controls.clickCausedFocus = focused - now > -.01;
        if (e.target == document.getElementById("canvas")) {
            let button = mouseButtonToName(e.button);
            controls.held[button] = {
                type: "Mouse",
                startPos: controls.pos,
                startWorldPos: controls.worldPos,
                startTarget: controls.target,
                moved: false,
                offset: {x: 0, y: 0},
                worldOffset: {x: 0, y: 0, z: 0},
                lastPositions: []
            };
        }
    };
    document.onmouseup = e => {
        if (platform.mobile && !e.fromTouch) {
            return;
        }
        let button = mouseButtonToName(e.button);
        if (controls.held[button]) {
            if ((controls.held[button].startPos.x - controls.pos.x) ** 2 + (controls.held[button].startPos.y - controls.pos.y) ** 2 < 10 ** 2) {
                controls.pressed[button] = {
                    type: "Mouse",
                    pos: controls.pos,
                    startWorldPos: controls.held[button].startWorldPos,
                    endWorldPos: controls.worldPos,
                    target: controls.held[button].startTarget
                };
            }
            controls.released.push(button);
        }
    };
    window.onmousemove = e => controls.pos = {x: e.clientX, y: e.clientY};
    window.ontouchstart = e => {
        controls.pos.x = e.touches[0].clientX;
        controls.pos.y = e.touches[0].clientY;
        controls.worldPos = undefined;
        let raycaster = new threejs.Raycaster();
        raycaster.setFromCamera(new threejs.Vector2(controls.pos.x / window.innerWidth * 2 - 1, 1 - controls.pos.y / window.innerHeight * 2), three.camera);
        let intersects = raycaster.intersectObjects(three.scene.children, true);
        if (intersects.length > 0) {
            controls.worldPos = {x: intersects[0].point.x, y: intersects[0].point.z, z: intersects[0].point.y};
        }
        controls.target = undefined;
        for (let intersect of intersects) {
            for (let p of players) {
                for (let mesh of p.mesh.children) {
                    if (intersect.object == mesh) {
                        controls.target = p;
                        break;
                    }
                }
            }
        }
        document.onmousedown({button: 0, target: e.target, clientX: controls.pos.x, clientY: controls.pos.y, fromTouch: true});
    };
    window.ontouchend = () => document.onmouseup({button: 0, fromTouch: true});
    window.ontouchmove = e => controls.pos = {x: e.touches[0].clientX, y: e.touches[0].clientY};
    document.oncontextmenu = e => e.preventDefault();
    window.onwheel = e => controls.scrolled += e.deltaY > 0 ? 1 : -1;
    window.onfocus = () => focused = now;
    window.onblur = () => {
        controls.held = [];
        focused = false;
    };
    window.onbeforeunload = () => settings.confirmExit ? true : undefined;
}

// Frame Loop
let lastFrameTimes = [];
let debugText = "";
let frame = () => {
    debugText = "";
    // Time
    let time = Math.round(performance.now() * 10) / 10000;
    let timeScale = Math.round((time - lastFrameTimes[lastFrameTimes.length - 1] || 0) * game.timeScale * 10000) / 10000;
    lastFrameTimes.push(time);
    while (lastFrameTimes[0] < time - .99) {
        lastFrameTimes.shift();
    }
    now = Math.round((now + timeScale) * 10000) / 10000;
    debugText += "FPS: " + lastFrameTimes.length + "<br>";
    try {
        // IN GAME
        if (inGame) {
            // Graphics
            if (platform.client) {
                three.renderer.setPixelRatio(window.devicePixelRatio);
                three.renderer.setSize(window.innerWidth, window.innerHeight);
                three.camera.aspect = window.innerWidth / window.innerHeight;
                three.camera.fov = Math.min(75, 400 / 3 * window.innerHeight / window.innerWidth);
                three.camera.updateProjectionMatrix();
            }
            // Controls
            if (platform.client) {
                let newWorldPos = undefined;
                let raycaster = new threejs.Raycaster();
                raycaster.setFromCamera(new threejs.Vector2(controls.pos.x / window.innerWidth * 2 - 1, 1 - controls.pos.y / window.innerHeight * 2), three.camera);
                let intersects = raycaster.intersectObjects(three.scene.children, true);
                if (intersects.length > 0) {
                    newWorldPos = {x: intersects[0].point.x, y: intersects[0].point.z, z: intersects[0].point.y};
                }
                controls.target = undefined;
                for (let intersect of intersects) {
                    for (let p of players) {
                        for (let mesh of p.mesh.children) {
                            if (intersect.object == mesh) {
                                controls.target = p;
                                break;
                            }
                        }
                    }
                }
                for (let button of Object.keys(controls.held)) {
                    let dragging = (controls.held[button].startPos.x - controls.pos.x) ** 2 + (controls.held[button].startPos.y - controls.pos.y) ** 2 >= 10 ** 2;
                    if (dragging) {
                        controls.held[button].moved = true;
                        controls.held[button].offset.x += controls.pos.x - controls.oldPos.x;
                        controls.held[button].offset.y += controls.pos.y - controls.oldPos.y;
                        while (controls.held[button].lastPositions.length > 0 && controls.held[button].lastPositions[0].t < now - .1) {
                            controls.held[button].lastPositions.shift();
                        }
                        controls.held[button].lastPositions.push(Object.assign({t: now}, controls.pos));
                    }
                    let oldWorldPos = undefined;
                    raycaster.setFromCamera(new threejs.Vector2(controls.oldPos.x / window.innerWidth * 2 - 1, 1 - controls.oldPos.y / window.innerHeight * 2), three.camera);
                    intersects = raycaster.intersectObjects(three.scene.children, true);
                    if (intersects.length > 0) {
                        oldWorldPos = {x: intersects[0].point.x, y: intersects[0].point.z, z: intersects[0].point.y};
                        controls.held[button].worldOffset.x += newWorldPos.x - oldWorldPos.x;
                        controls.held[button].worldOffset.y += newWorldPos.y - oldWorldPos.y;
                    }
                }
                controls.oldPos = controls.pos;
                controls.worldPos = newWorldPos;
                // Debug: Right Click To Move Frank
                if (controls.pressed["Right Mouse"] && frank && controls.pressed["Right Mouse"].target != player && !selectedAbility) {
                    if (isInBounds(controls.pressed["Right Mouse"].startWorldPos, frank.size)) {
                        frank.path = findPath(frank.pos, controls.pressed["Right Mouse"].startWorldPos, frank.size);
                        let temporaryMarker = {
                            type: "temporaryMarker",
                            pos: {
                                x: controls.pressed["Right Mouse"].startWorldPos.x,
                                y: controls.pressed["Right Mouse"].startWorldPos.y,
                                z: 0
                            },
                            vel: {
                                x: 0,
                                y: 0,
                                z: -1
                            },
                            id: genID(),
                            summoner: frank.id,
                            mesh: new threejs.Mesh(new threejs.SphereGeometry(.2, 32, 32), new threejs.MeshBasicMaterial({color: 0x44BB44}))
                        };
                        objects.push(temporaryMarker);
                        temporaryMarker.mesh.position.y = 0;
                        three.scene.add(temporaryMarker.mesh);
                    }
                } // Debug End
                if (player && controls.pressed[settings.controls.move] && controls.pressed[settings.controls.move].target != player && !(settings.controls.move == settings.controls.castSelectedAbility && selectedAbility)) {
                    if (players.indexOf(controls.pressed[settings.controls.move].target) > -1) {
                        player.target = controls.pressed[settings.controls.move].target;
                        player.path = findPath(player.pos, controls.pressed[settings.controls.move].target.pos, player.size);
                    } else {
                        if (isInBounds(controls.pressed[settings.controls.move].startWorldPos, player.size)) {
                            player.target = undefined;
                            player.path = findPath(player.pos, controls.pressed[settings.controls.move].startWorldPos, player.size);
                            let temporaryMarker = {
                                type: "temporaryMarker",
                                pos: {
                                    x: controls.pressed[settings.controls.move].startWorldPos.x,
                                    y: controls.pressed[settings.controls.move].startWorldPos.y,
                                    z: 0
                                },
                                vel: {
                                    x: 0,
                                    y: 0,
                                    z: -1
                                },
                                id: genID(),
                                summoner: player.id,
                                mesh: new threejs.Mesh(new threejs.SphereGeometry(.2, 32, 32), new threejs.MeshBasicMaterial({color: 0x44BB44}))
                            };
                            objects.push(temporaryMarker);
                            temporaryMarker.mesh.position.y = 0;
                            three.scene.add(temporaryMarker.mesh);
                        }
                    }
                }
                if (controls.pressed[settings.controls.castSelectedAbility] && selectedAbility) {
                    useAbility(player, selectedAbility, controls.pressed[settings.controls.castSelectedAbility].startWorldPos);
                    selectAbility(undefined);
                }
                if (player) {
                    for (let i = 0; i < player.abilities.length; i++) {
                        if (controls.pressed[settings.controls["castAbility" + (i + 1)]]) {
                            useAbility(player, player.abilities[i].name, controls.worldPos);
                        }
                    }
                }
            }
            // Camera
            if (platform.client) {
                if (controls.pressed[settings.controls.followPlayer] || controls.pressed[settings.controls.dragCam] && !(settings.controls.dragCam == settings.controls.castSelectedAbility && selectedAbility) && (player ? controls.pressed[settings.controls.dragCam].target == player : players.indexOf(controls.pressed[settings.controls.dragCam].target) > -1)) {
                    if (player) {
                        followCam(player);
                    } else if (controls.pressed[settings.controls.dragCam]) {
                        followCam(controls.pressed[settings.controls.dragCam].target);
                    } else {
                        let p = undefined;
                        let d = Infinity;
                        for (let pl of players) {
                            let dist = (pl.pos.x - cam.pos.x) ** 2 + (pl.pos.y - cam.pos.y) ** 2;
                            if (dist < d) {
                                p = pl;
                                d = dist;
                            }
                        }
                        followCam(p);
                    }
                }
                if (controls.pressed[settings.controls.camForward] || controls.pressed[settings.controls.camBackward] || controls.pressed[settings.controls.camLeft] || controls.pressed[settings.controls.camRight] || controls.held[settings.controls.dragCam] && (controls.held[settings.controls.dragCam].offset.x != 0 || controls.held[settings.controls.dragCam].offset.y != 0) && cam.following) {
                    freeCam();
                }
                if (!cam.following) {
                    if (controls.held[settings.controls.dragCam] && (controls.held[settings.controls.dragCam].offset.x != 0 || controls.held[settings.controls.dragCam].offset.y != 0)) {
                        cam.pos.x -= controls.held[settings.controls.dragCam].worldOffset.x;
                        cam.pos.y -= controls.held[settings.controls.dragCam].worldOffset.y;
                    }
                    if (controls.released.indexOf(settings.controls.dragCam) > -1) {
                        while (controls.held[settings.controls.dragCam].lastPositions.length > 0 && controls.held[settings.controls.dragCam].lastPositions[0].t < now - .05) {
                            controls.held[settings.controls.dragCam].lastPositions.shift();
                        }
                        let dragVel = {x: 0, y: 0};
                        if (controls.held[settings.controls.dragCam].lastPositions.length > 0) {
                            dragVel = {x: (controls.pos.x - controls.held[settings.controls.dragCam].lastPositions[0].x) / 100, y: (controls.pos.y - controls.held[settings.controls.dragCam].lastPositions[0].y) / 100};
                            if (dragVel.x ** 2 + dragVel.y ** 2 > 15 ** 2) {
                                let len = 1500 / Math.sqrt(dragVel.x ** 2 + dragVel.y ** 2);
                                dragVel.x = Math.round(dragVel.x * len) / 100;
                                dragVel.y = Math.round(dragVel.y * len) / 100;
                            }
                            controls.held[settings.controls.dragCam].lastPositions = [];
                        }
                        cam.vel.x -= dragVel.x;
                        cam.vel.y -= dragVel.y;
                    }
                    cam.move.speed = Math.max(2, Math.min(50, cam.move.speed + controls.scrolled));
                    let right = (controls.held[settings.controls.camRight] ? 1 : 0) - (controls.held[settings.controls.camLeft] ? 1 : 0);
                    let down = (controls.held[settings.controls.camBackward] ? 1 : 0) - (controls.held[settings.controls.camForward] ? 1 : 0);
                    if (right != 0 && down != 0) {
                        right *= .707;
                        down *= .707;
                    }
                    cam.vel.x += right * timeScale * cam.move.speed;
                    cam.vel.y += down * timeScale * cam.move.speed;
                }
                cam.vel.x /= 1 + timeScale / cam.move.smooth;
                cam.vel.y /= 1 + timeScale / cam.move.smooth;
                let velMult = timeScale / cam.move.smooth * (1 - cam.move.friction);
                let steps = Math.ceil(((cam.vel.x * velMult) ** 2 + (cam.vel.y * velMult) ** 2) * 8); // 8 ≈ 1 / .35 ** 2
                velMult /= steps;
                for (let i = 0; i < steps; i++) {
                    let newPos = cam.following ? {x: cam.pos.x + cam.vel.x * velMult, y: cam.pos.y + cam.vel.y * velMult} : moveInOuterBounds({x: cam.pos.x + cam.vel.x * velMult, y: cam.pos.y + cam.vel.y * velMult}, .35);
                    if (cam.pos.x == newPos.x && cam.pos.y == newPos.y) {
                        break;
                    }
                    cam.pos = newPos;
                }
            }
            // Clear Inputs
            if (platform.client) {
                if (controls.held[settings.controls.castSelectedAbility] && controls.held[settings.controls.castSelectedAbility].moved) {
                    selectedAbility = undefined;
                }
                controls.pressed = {};
                for (let button of Object.keys(controls.held)) {
                    controls.held[button].offset = {x: 0, y: 0};
                    controls.held[button].worldOffset = {x: 0, y: 0, z: 0};
                }
                for (let button of controls.released) {
                    delete controls.held[button];
                }
                controls.released = [];
                controls.scrolled = 0;
            }
            // Players
            for (let p of players) {
                p.move = Object.assign({}, p.baseMove);
                // Effects
                for (let i = 0; i < p.effects.length; i++) {
                    let e = p.effects[i];
                    if (e.until < now) {
                        p.effects.splice(i--, 1);
                        continue;
                    }
                    if (e.type == "speed") {
                        p.move.speed *= e.multiplier;
                    } else if (e.type == "health") {
                        p.health += e.perSecond * timeScale;
                        p.damageTaken -= e.perSecond * timeScale;
                    }
                }
                // Movement
                if (p.target) {
                    if (!p.path && (p.pos.x - p.target.pos.x) ** 2 + (p.pos.y - p.target.pos.y) ** 2 > p.melee.range ** 2 || p.path && Math.sqrt((p.path[p.path.length - 1].x - p.pos.x) ** 2 + (p.path[p.path.length - 1].y - p.pos.y) ** 2) < Math.sqrt((p.path[p.path.length - 1] - p.target.pos.x) ** 2 + (p.path[p.path.length - 1] - p.target.pos.y) ** 2) * 2) {
                        console.log("Recalculating path!");
                        p.path = findPath(p.pos, moveInBounds(p.target.pos, p.target.size * 2), p.size);
                    }
                }
                if (p.path) {
                    if (!isLineInBounds(p.pos, p.path[0])) {
                        // console.log("Recalculating path!");
                        p.path = findPath(p.pos, p.path[p.path.length - 1], p.size);
                    }
                    if ((p.pos.x - p.path[0].x) ** 2 + (p.pos.y - p.path[0].y) ** 2 < .1 ** 2) {
                        p.path.shift();
                    }
                    if (p.path.length == 0) {
                        p.path = undefined;
                    } else {
                        let a = Math.atan2(p.path[0].x - p.pos.x, p.path[0].y - p.pos.y);
                        p.vel.x += Math.sin(a) * timeScale * p.move.speed;
                        p.vel.y += Math.cos(a) * timeScale * p.move.speed;
                    }
                }
                p.vel.x /= 1 + timeScale / p.move.smooth;
                p.vel.y /= 1 + timeScale / p.move.smooth;
                let velMult = timeScale / p.move.smooth * (1 - p.move.friction);
                let steps = Math.ceil(((p.vel.x * velMult) ** 2 + (p.vel.y * velMult) ** 2) / p.size ** 2);
                velMult /= steps;
                for (let i = 0; i < steps; i++) {
                    let newPos = p.move.noCol ? {x: p.pos.x + p.vel.x * velMult, y: p.pos.y + p.vel.y * velMult} : moveInBounds({x: p.pos.x + p.vel.x * velMult, y: p.pos.y + p.vel.y * velMult}, p.size);
                    if (p.pos.x == newPos.x && p.pos.y == newPos.y) {
                        break;
                    }
                    p.pos = newPos;
                }
                if (p.vel.x * p.vel.x + p.vel.y * p.vel.y > 1e-6) {
                    p.vel.angle = Math.atan2(-p.vel.x, -p.vel.y);
                }
                if (platform.client) {
                    p.mesh.rotation.y = stepAngle(p.mesh.rotation.y, p.vel.angle, 5 * timeScale);
                    p.mesh.position.x = p.pos.x;
                    p.mesh.position.z = p.pos.y;
                }
                // Attacking
                if (p.target && p.melee.lastHit + .5 < now && (p.pos.x - p.target.pos.x) ** 2 + (p.pos.y - p.target.pos.y) ** 2 < p.melee.range ** 2) {
                    p.melee.lastHit = now;
                    p.target.health -= p.melee.damage;
                    p.target.damageTaken += p.melee.damage;
                }
            }
            if (platform.client) {
                let camPos = {x: cam.following ? cam.following.pos.x + cam.pos.x : cam.pos.x, y: cam.following ? cam.following.pos.y + cam.pos.y : cam.pos.y};
                debugText += "X: " + camPos.x.toFixed(2) + "<br>Y: " + camPos.y.toFixed(2) + "<br>";
            }
            // Objects
            for (let i = 0; i < objects.length; i++) {
                let obj = objects[i];
                if (obj.pos) {
                    if (obj.vel) { // TODO Multiple steps to stop flying through walls?
                        obj.pos.x += obj.vel.x * timeScale;
                        obj.pos.y += obj.vel.y * timeScale;
                    }
                    obj.mesh.position.x = obj.pos.x;
                    obj.mesh.position.z = obj.pos.y;
                }
                if (obj.type == "temporaryMarker") {
                    obj.pos.z += obj.vel.z * timeScale;
                    obj.mesh.position.y = obj.pos.z;
                    if (obj.pos.z < -1) {
                        three.scene.remove(obj.mesh);
                        objects.splice(i--, 1);
                        continue;
                    }
                }
                if (obj.type == "fireball") {
                    let explode = false;
                    if (!isInBounds(obj.pos, obj.size)) {
                        explode = true;
                    }
                    for (p of players) {
                        if (p.id == obj.summoner) {
                            continue;
                        }
                        if ((p.pos.x - obj.pos.x) ** 2 + (p.pos.y - obj.pos.y) ** 2 < (p.size + obj.size) ** 2) {
                            explode = true;
                        }
                    }
                    if (explode) {
                        for (p of players) {
                            if (p.id == obj.summoner) {
                                continue;
                            }
                            if ((p.pos.x - obj.pos.x) ** 2 + (p.pos.y - obj.pos.y) ** 2 < (obj.explosion.size + p.size + obj.size) ** 2) {
                                let damage = Math.min(obj.explosion.size, obj.explosion.size + p.size + obj.size - Math.sqrt((p.pos.x - obj.pos.x) ** 2 + (p.pos.y - obj.pos.y) ** 2)) / obj.explosion.size * obj.explosion.damage;
                                p.health -= damage;
                                p.damageTaken += damage;
                            }
                        }
                        let explosion = {
                            type: "explosion",
                            pos: obj.pos,
                            size: obj.size,
                            minSize: 0,
                            maxSize: obj.explosion.size,
                            speed: obj.explosion.size * 4,
                            curve: .5,
                            id: genID(),
                            summoner: obj.summoner,
                            mesh: new threejs.Mesh(new threejs.SphereGeometry(1, 64, 64), new threejs.MeshBasicMaterial({color: 0xFFBB00}))
                        };
                        objects.push(explosion);
                        explosion.mesh.position.y = 0;
                        three.scene.add(explosion.mesh);
                        three.scene.remove(obj.mesh);
                        objects.splice(i--, 1);
                        continue;
                    }
                }
                if (obj.type == "iceBolt") {
                    let hit = false;
                    for (p of players) {
                        if (p.id == obj.summoner) {
                            continue;
                        }
                        if ((p.pos.x - obj.pos.x) ** 2 + (p.pos.y - obj.pos.y) ** 2 < (p.size + obj.size) ** 2) {
                            p.effects.push({
                                type: "speed",
                                until: now + obj.effect.duration,
                                multiplier: obj.effect.speed
                            }, {
                                type: "health",
                                until: now + obj.effect.duration,
                                perSecond: obj.effect.health / obj.effect.duration
                            });
                            hit = true;
                        }
                    }
                    if (hit || !isInBounds(obj.pos, obj.size)) {
                        three.scene.remove(obj.mesh);
                        objects.splice(i--, 1);
                        continue;
                    }
                }
                if (obj.type == "lightning") {
                    obj.size -= timeScale * 10;
                    obj.mesh.scale.set(obj.size, obj.size, obj.size);
                    if (obj.size <= 0) {
                        three.scene.remove(obj.mesh);
                        objects.splice(i--, 1);
                        continue;
                    }
                }
                if (obj.type == "shadowBolt") {
                    let explode = false;
                    if (!isInBounds(obj.pos, obj.size)) {
                        explode = true;
                    }
                    for (p of players) {
                        if (p.id == obj.summoner) {
                            continue;
                        }
                        if ((p.pos.x - obj.pos.x) ** 2 + (p.pos.y - obj.pos.y) ** 2 < (obj.explosion.range + p.size) ** 2) {
                            p.health -= obj.explosion.damage;
                            p.damageTaken += obj.explosion.damage;
                            p.vel.x += obj.pos.x - p.pos.x;
                            p.vel.y += obj.pos.y - p.pos.y;
                            explode = true;
                        }
                    }
                    if (explode) {
                        for (p of players) {
                            if (p.id == obj.summoner) {
                                continue;
                            }
                        }
                        let explosion = {
                            type: "explosion",
                            pos: obj.pos,
                            size: obj.explosion.size,
                            minSize: 0,
                            maxSize: obj.explosion.size,
                            speed: -obj.explosion.size * 3,
                            curve: 1.5,
                            id: genID(),
                            summoner: obj.summoner,
                            mesh: new threejs.Mesh(new threejs.SphereGeometry(1, 64, 64), new threejs.MeshBasicMaterial({
                                color: 0xAA00FF,
                                transparent: true,
                                opacity: .75
                            }))
                        };
                        objects.push(explosion);
                        explosion.mesh.position.y = 0;
                        three.scene.add(explosion.mesh);
                        three.scene.remove(obj.mesh);
                        objects.splice(i--, 1);
                        continue;
                    }
                }
                if (obj.type == "shockwave") {
                    if (!isInBounds(obj.pos, obj.size)) {
                        three.scene.remove(obj.mesh);
                        objects.splice(i--, 1);
                        continue;
                    }
                    for (p of players) {
                        if (p.id == obj.summoner || obj.hitPlayers.indexOf(p.id) > -1) {
                            continue;
                        }
                        if ((p.pos.x - obj.pos.x) ** 2 + (p.pos.y - obj.pos.y) ** 2 < (obj.range + p.size) ** 2) {
                            p.health -= obj.damage;
                            p.damageTaken += obj.damage;
                            p.vel.x += obj.vel.x / 5 + p.pos.x - obj.pos.x;
                            p.vel.y += obj.vel.y / 5 + p.pos.y - obj.pos.y;
                            obj.hitPlayers.push(p.id);
                        }
                    }
                }
                if (obj.type == "explosion") {
                    obj.size += timeScale * obj.speed;
                    let scale = (obj.size / (obj.maxSize - obj.minSize)) ** obj.curve * (obj.maxSize - obj.minSize) + obj.minSize;
                    obj.mesh.scale.set(scale, scale, scale);
                    if (obj.size >= obj.maxSize || obj.size <= obj.minSize) {
                        three.scene.remove(obj.mesh);
                        objects.splice(i--, 1);
                        continue;
                    }
                }
                if (obj.type == "rangeDisplay") {
                    obj.mesh.position.x = ((cam.following ? cam.following.pos.x + cam.pos.x : cam.pos.x) + obj.player.pos.x) / 2;
                    obj.mesh.position.y = cam.dist * Math.sin(Math.PI / 2 - cam.angle) / 2;
                    obj.mesh.position.z = ((cam.following ? cam.following.pos.y + cam.pos.y : cam.pos.y) + obj.player.pos.y) / 2 + cam.dist * Math.cos(Math.PI / 2 - cam.angle) / 2;
                    if ((obj.mesh.material.opacity -= timeScale / 2) <= 0) {
                        three.scene.remove(obj.mesh);
                        objects.splice(i--, 1);
                        continue;
                    }
                }
            }
            // Rendering
            if (platform.client) {
                three.camera.position.x = cam.following ? cam.following.pos.x + cam.pos.x : cam.pos.x;
                three.camera.position.y = cam.dist * Math.sin(Math.PI / 2 - cam.angle);
                three.camera.position.z = (cam.following ? cam.following.pos.y + cam.pos.y : cam.pos.y) + cam.dist * Math.cos(Math.PI / 2 - cam.angle);
                three.camera.rotation.x = cam.angle - Math.PI / 2;
                three.renderer.render(three.scene, three.camera);
            }
            // UI
            if (platform.client) {
                if (player) {
                    document.getElementById("hotbar").removeAttribute("hidden");
                    for (let i = 0; i < document.getElementById("hotbar-abilities").children.length; i++) {
                        let ability = abilities[document.getElementById("hotbar-abilities").children[i].getAttribute("ability")];
                        let cooldown = Math.max(0, player.abilities[i].lastUse + ability.cooldown - now) / ability.cooldown;
                        document.getElementById("hotbar-abilities").children[i].style = cooldown == 0 ? "--cooldown: #0000;" : "--cooldown: linear-gradient(to bottom, #0008 0%, #0008 " + Math.ceil(1000 * cooldown) / 10 + "%, #0000 " + Math.ceil(1000 * cooldown) / 10 + "%, #0000 100%);";
                    }
                    player.damageTaken = Math.max(0, player.damageTaken - timeScale * 50);
                    frank.damageTaken = Math.max(0, frank.damageTaken - timeScale * 50);
                    setInnerHTML(document.querySelector("#hotbar-health-bar"), generateColoredBarSVG("health-bar", [{fromColor: "#3AB300", toColor: "#216600", width: Math.max(0, player.health) / 100}, {fromColor: "#CCCC00", toColor: "#808000", width: Math.max(0, player.damageTaken) / 100}], Math.round(Math.max(0, player.health)) + "%", 480).innerHTML);
                    setInnerHTML(document.querySelector("#hotbar-health-bar-frank"), generateColoredBarSVG("health-bar-frank", [{fromColor: "#3AB300", toColor: "#216600", width: Math.max(0, frank.health) / 100}, {fromColor: "#CCCC00", toColor: "#808000", width: Math.max(0, frank.damageTaken) / 100}], Math.round(Math.max(0, frank.health)) + "%", 480).innerHTML);
                } else {
                    document.getElementById("hotbar").setAttribute("hidden", "");
                }
            }
            // debugText+="Mouse Is " + (isInBounds(controls.worldPos) ? "In Bounds" : "Out Of Bounds") + "<br>";
        }
        // UI
        if (platform.client) {
            document.body.setAttribute("style", "--ui-scale: " + Math.min(settings.uiScale, window.innerWidth / 800, window.innerHeight / 600) + ";");
        }
        // Debug Text
        if (platform.client) {
            setInnerHTML(document.getElementById("debug-text"), debugText.substring(0, debugText.length - 4));
        }
        // Next Frame
        requestAnimationFrame(frame);
    } catch (e) {
        console.error(e);
        if (platform.client) {
            crash(e);
        }
    }
};

// Camera
let followCam = p => {
    if (cam.following) {
        cam.vel.x = p.pos.x - cam.following.pos.x - cam.pos.x;
        cam.vel.y = p.pos.y - cam.following.pos.y - cam.pos.y;
        cam.pos.x += cam.following.pos.x - p.pos.x;
        cam.pos.y += cam.following.pos.y - p.pos.y;
    } else {
        cam.vel.x = p.pos.x - cam.pos.x;
        cam.vel.y = p.pos.y - cam.pos.y;
        cam.pos.x -= p.pos.x;
        cam.pos.y -= p.pos.y;
    }
    cam.following = p;
};
let freeCam = () => {
    if (cam.following) {
        cam.pos.x += cam.following.pos.x;
        cam.pos.y += cam.following.pos.y;
        cam.vel.x = 0;
        cam.vel.y = 0;
        cam.following = undefined;
    }
};

// World, Bounds & Other Stuff
let worldLoaded = false;
let bounds = [ /* [0: x1, 1: y1, 2: x2, 3: y2, 4: xDiff, 5: yDiff, 6: yDiff / xDiff, 7: length, 8: lengthSquared, 9: normalX, 10: normalY] */ ];
let outerBounds = [];
let loadWorld = world => {
    if (three.world) {
        three.scene.remove(three.world);
    }
    three.gltfLoader.load("models/worlds/" + world + ".glb", model => {
        three.world = model.scene;
        three.scene.add(model.scene);
        // Bounds
        let geometry;
        for (let i = 0; i < three.world.children.length; i++) {
            let child = three.world.children[i];
            if (child.name == "Bounds" && child.type == "Mesh") {
                three.world.children.splice(i, 1);
                geometry = child.geometry;
                break;
            }
        }
        bounds = [];
        let vs = geometry.attributes.position.array;
        let is = geometry.index.array;
        for (let i = 0; i < is.length; i += 3) {
            for (let j = 0; j < 3; j++) {
                let x1 = vs[is[i + j] * 3];
                let y1 = vs[is[i + j] * 3 + 2];
                let x2 = vs[is[i + (j + 1) % 3] * 3];
                let y2 = vs[is[i + (j + 1) % 3] * 3 + 2];
                let e = (x1 + y1 > x2 + y2 || x1 + y1 == x2 + y2 && x1 > x2 ? [x2, y2, x1, y1] : [x1, y1, x2, y2]).join(" ");
                let index = bounds.indexOf(e);
                if (index == -1) {
                    bounds.push(e);
                } else {
                    bounds.splice(index, 1);
                }
            }
        }
        for (let i = 0; i < bounds.length; i++) {
            let l = bounds.splice(0, 1)[0].split(" ").map(Number);
            l.push(l[2] - l[0], l[3] - l[1], (l[3] - l[1]) / (l[2] - l[0]), Math.sqrt((l[2] - l[0]) ** 2 + (l[3] - l[1]) ** 2), (l[2] - l[0]) ** 2 + (l[3] - l[1]) ** 2);
            bounds.push(l);
        }
        for (let i = 0; i < bounds.length; i++) {
            let l = bounds[i];
            let nx = l[5] / l[7];
            let ny = -l[4] / l[7];
            if (!isInBounds({x: (l[0] + l[2]) / 2 + nx * 1e-6, y: (l[1] + l[3]) / 2 + ny * 1e-6})) {
                nx = -nx;
                ny = -ny;
            }
            l.push(Math.round(nx * 1e6) / 1e6, Math.round(ny * 1e6) / 1e6);
        }
        outerBounds = [];
        let startX = Infinity;
        let startY = Infinity;
        for (let i = 0; i < bounds.length; i++) {
            if (bounds[i][0] < startX) {
                startX = bounds[i][0];
                startY = bounds[i][1];
            }
            if (bounds[i][2] < startX) {
                startX = bounds[i][2];
                startY = bounds[i][3];
            }
        }
        let currentX = startX;
        let currentY = startY;
        let currentLine = undefined;
        do {
            for (let i = 0; i < bounds.length; i++) {
                if (i == currentLine) {
                    continue;
                }
                if (bounds[i][0] == currentX && bounds[i][1] == currentY) {
                    outerBounds.push(bounds[i]);
                    currentX = bounds[i][2];
                    currentY = bounds[i][3];
                } else if (bounds[i][2] == currentX && bounds[i][3] == currentY) {
                    outerBounds.push(bounds[i]);
                    currentX = bounds[i][0];
                    currentY = bounds[i][1];
                }
            }
        } while (currentX != startX || currentY != startY);
        worldLoaded = true;
    });
};
let isInBounds = (p, r = 0) => {
    let b = false;
    let c = false;
    for (let l of bounds) {
        let t = Math.max(0, Math.min(1, ((p.x - l[0]) * l[4] + (p.y - l[1]) * l[5]) / l[8]));
        if ((p.x - l[0] - t * l[4]) ** 2 + (p.y - l[1] - t * l[5]) ** 2 <= r ** 2) {
            return false;
        }
        if ((l[0] >= p.x && l[2] <= p.x || l[0] <= p.x && l[2] >= p.x) && l[6] * p.x + l[1] - l[6] * l[0] < p.y && (p.x == l[0] || p.x == l[2] ? (c = !c) : true)) {
            b = !b;
        }
    }
    return b;
};
let moveInBounds = (p, r = 0, forceInbounds = false) => {
    let cl = undefined;
    let remainingRepeats = forceInbounds ? 10 : 1;
    while (remainingRepeats-- > 0) {
        let b = false; // In Bounds
        let c = false; // Colliding With Point
        let o = true; // Not Colliding With Bounds
        let e = false; // Colliding With End Of Line
        let cx = 0;
        let cy = 0;
        let nx = 0;
        let ny = 0;
        let cd = Infinity;
        for (let i = 0; i < bounds.length; i++) {
            let l = bounds[i];
            let t = Math.max(0, Math.min(1, ((p.x - l[0]) * l[4] + (p.y - l[1]) * l[5]) / l[8]));
            let d = (p.x - l[0] - t * l[4]) ** 2 + (p.y - l[1] - t * l[5]) ** 2;
            if (d < cd) {
                cl = i;
                cx = l[0] + t * l[4];
                cy = l[1] + t * l[5];
                cd = d;
                e = t == 0 || t == 1;
                nx = l[9];
                ny = l[10];
            }
            if (d <= r ** 2) {
                o = false;
            } else if ((l[0] >= p.x && l[2] <= p.x || l[0] <= p.x && l[2] >= p.x) && l[6] * p.x + l[1] - l[6] * l[0] < p.y && (p.x == l[0] || p.x == l[2] ? (c = !c) : true)) {
                b = !b;
            }
        }
        return b && o ? {x: p.x, y: p.y} : {x: cx + (e ? (p.x - cx) / Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2) : nx) * r, y: cy + (e ? (p.y - cy) / Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2) : ny) * r};
    }
    return {x: p.x, y: p.y, line: cl};
};
let isLineInBounds = (p1, p2, r = 0) => {
    let pdx = p2.x - p1.x;
    let pdy = p2.y - p1.y;
    for (let l of bounds) {
        let det = pdx * (l[3] - l[1]) - (l[2] - l[0]) * pdy;
        if (det != 0) {
            let lambda = ((l[3] - l[1]) * (l[2] - p1.x) + (l[0] - l[2]) * (l[3] - p1.y)) / det;
            let gamma = ((p1.y - p2.y) * (l[2] - p1.x) + pdx * (l[3] - p1.y)) / det;
            if (0 < lambda && lambda < 1 && 0 < gamma && gamma < 1) {
                return false;
            }
        }
    }
    if (r > 0) {
        for (let l of bounds) {
            let line = [p1.x, p1.y, p2.x, p2.y, p2.x - p1.x, p2.y - p1.y, undefined, undefined, pdx ** 2 + pdy** 2, 0, 0];
            if (isPointNearLine({x: l[0], y: l[1]}, line, r) || isPointNearLine({x: l[2], y: l[3]}, line, r) || isPointNearLine(p1, l, r) || isPointNearLine(p2, l, r)) {
                return false;
            }
        }
    }
    return true;
};
let isInOuterBounds = p => {
    let b = false;
    let c = false;
    for (let l of outerBounds) {
        if ((l[0] >= p.x && l[2] <= p.x || l[0] <= p.x && l[2] >= p.x) && l[6] * p.x + l[1] - l[6] * l[0] < p.y && (p.x == l[0] || p.x == l[2] ? (c = !c) : true)) {
            b = !b;
        }
    }
    return b;
};
let moveInOuterBounds = p => {
    if (isInOuterBounds(p)) {
        return p;
    }
    let cx = 0;
    let cy = 0;
    let cd = Infinity;
    for (let l of outerBounds) {
        let t = Math.max(0, Math.min(1, ((p.x - l[0]) * l[4] + (p.y - l[1]) * l[5]) / l[8]));
        let d = (p.x - l[0] - t * l[4]) ** 2 + (p.y - l[1] - t * l[5]) ** 2;
        if (d < cd) {
            cx = l[0] + t * l[4];
            cy = l[1] + t * l[5];
            cd = d;
        }
    }
    return {x: cx, y: cy};
};
let isPointNearLine = (p, l, r) => {
    let t = Math.max(0, Math.min(1, ((p.x - l[0]) * l[4] + (p.y - l[1]) * l[5]) / l[8]));
    return (p.x - l[0] - t * l[4]) ** 2 + (p.y - l[1] - t * l[5]) ** 2 <= r ** 2;
};

// Path Finding
let findPath = (f, t, r) => {
    if (bounds.length == 0) {
        console.warn("World not loaded yet!");
        return undefined;
    }
    if (isLineInBounds(f, t, r * .5)) {
        return [t];
    }
    let explored = [{x: f.x, y: f.y, start: 0, end: Math.sqrt((f.x - t.x) ** 2 + (f.y - t.y) ** 2)}];
    let unexplored = [];
    for (let l of bounds) {
        let p = {x: l[0] + l[9] * r, y: l[1] + l[10] * r , cx: l[0], cy: l[1]};
        p.nearest = Math.sqrt((f.x - p.x) ** 2 + (f.y - p.y) ** 2);
        p.end = Math.sqrt((t.x - p.x) ** 2 + (t.y - p.y) ** 2);
        unexplored.push(p);
        p = {x: l[2] + l[9] * r, y: l[3] + l[10] * r, cx: l[2], cy: l[3]};
        p.nearest = Math.sqrt((f.x - p.x) ** 2 + (f.y - p.y) ** 2);
        p.end = Math.sqrt((t.x - p.x) ** 2 + (t.y - p.y) ** 2);
        unexplored.push(p);
    }
    let blocked = {};
    unexplored.sort((a, b) => a.end + a.nearest - b.end - b.nearest);
    let i = 0;
    while (true) {
        let bestExplored = undefined;
        let bestDist = Infinity;
        for (let j = 0; j < explored.length; j++) {
            if (!blocked[unexplored[i].x + "-" + unexplored[i].y + "-" + explored[j].x + "-" + explored[j].y] && !blocked[explored[j].x + "-" + explored[j].y + "-" + unexplored[i].x + "-" + unexplored[i].y]) {
                let dist = Math.sqrt((unexplored[i].x - explored[j].x) ** 2 + (unexplored[i].y - explored[j].y) ** 2) + explored[j].start;
                if (dist < bestDist) {
                    if (isLineInBounds(unexplored[i], explored[j])) {
                        bestExplored = explored[j];
                        bestDist = dist;
                    } else {
                        blocked[unexplored[i].x + "-" + unexplored[i].y + "-" + explored[j].x + "-" + explored[j].y] = true;
                    }
                }
            }
        }
        if (bestExplored) {
            let node = unexplored.splice(i, 1)[0];
            node.from = bestExplored;
            if (isLineInBounds(node, t)) {
                let path = [node, t];
                while (node.from.from) {
                    if (node.cx == node.from.cx && node.cy == node.from.cy) {
                        let extra = Math.floor(Math.sqrt((node.x - node.from.x) ** 2 + (node.y - node.from.y) ** 2) * 5);
                        for (let j = 1; j < extra; j++) {
                            path.unshift(moveInBounds({x: node.x + (node.from.x - node.x) * j / extra, y: node.y + (node.from.y - node.y) * j / extra}, r));
                        }
                    }
                    node = node.from;
                    path.unshift({x: node.x, y: node.y});
                }
                return path;
            }
            i = -1;
            node.start = bestDist;
            explored.push(node);
            for (let j = 0; j < unexplored.length; j++) {
                unexplored[j].nearest = Math.min(unexplored[j].nearest, Math.sqrt((node.x - unexplored[j].x) ** 2 + (node.y - unexplored[j].y) ** 2));
            }
            unexplored.sort((a, b) => a.end + a.nearest - b.end - b.nearest);
        }
        if (++i == unexplored.length - 1) {
            console.warn("Could not find a path because there is none!");
            return undefined;
        }
    }
};
let findPath2 = (f, t, r) => {
    let start = performance.now();
    if (bounds.length == 0) {
        console.warn("World not loaded yet!");
        return undefined;
    }
    if (isLineInBounds(f, t, r * .5)) {
        return [t];
    }
    let explored = [{x: f.x, y: f.y, start: 0, end: Math.sqrt((f.x - t.x) ** 2 + (f.y - t.y) ** 2)}];
    let unexplored = [];
    for (let l of bounds) {
        let p = {x: l[0] + l[9] * r, y: l[1] + l[10] * r , cx: l[0], cy: l[1]};
        p.nearest = Math.sqrt((f.x - p.x) ** 2 + (f.y - p.y) ** 2);
        p.end = Math.sqrt((t.x - p.x) ** 2 + (t.y - p.y) ** 2);
        unexplored.push(p);
        p = {x: l[2] + l[9] * r, y: l[3] + l[10] * r, cx: l[2], cy: l[3]};
        p.nearest = Math.sqrt((f.x - p.x) ** 2 + (f.y - p.y) ** 2);
        p.end = Math.sqrt((t.x - p.x) ** 2 + (t.y - p.y) ** 2);
        unexplored.push(p);
    }

    // for(let i = 0; i < unexplored.length; i++) markPos(unexplored[i], 0, .1);

    let blocked = {};
    unexplored.sort((a, b) => a.end + a.nearest - b.end - b.nearest);
    let i = 0;
    while (true) {
        let bestExplored = undefined;
        let bestDist = Infinity;
        for (let j = 0; j < explored.length; j++) {
            if (!blocked[unexplored[i].x + "-" + unexplored[i].y + "-" + explored[j].x + "-" + explored[j].y] && !blocked[explored[j].x + "-" + explored[j].y + "-" + unexplored[i].x + "-" + unexplored[i].y]) {
                let dist = Math.sqrt((unexplored[i].x - explored[j].x) ** 2 + (unexplored[i].y - explored[j].y) ** 2) + explored[j].start;
                if (dist < bestDist) {
                    if (isLineInBounds(unexplored[i], explored[j])) {
                        bestExplored = explored[j];
                        bestDist = dist;
                    } else {
                        blocked[unexplored[i].x + "-" + unexplored[i].y + "-" + explored[j].x + "-" + explored[j].y] = true;
                    }
                }
            }
        }
        if (bestExplored) {
            let node = unexplored.splice(i, 1)[0];
            node.from = bestExplored;
            if (isLineInBounds(node, t)) {
                let path = [t];
                let end = Object.assign({from: node}, t);
                node = end;
                while (node.from.from) {
                    if (node.from.cx != node.from.from.cx || node.from.cy != node.from.from.cy) {
                        let other = undefined;
                        for (let potential of explored) {
                            if (potential != node.from && potential.cx == node.from.cx && potential.cy == node.from.cy) {
                                other = potential;
                                break;
                            }
                        }
                        if (!other) {
                            for (let potential of unexplored) {
                                if (potential.cx == node.from.cx && potential.cy == node.from.cy) {
                                    other = potential;
                                    break;
                                }
                            }
                        }
                        let node2 = Math.sqrt((node.x - node.from.x) ** 2 + (node.y - node.from.y) ** 2) + Math.sqrt((other.x - node.from.from.x) ** 2 + (other.y - node.from.from.y) ** 2) < Math.sqrt((node.x - other.x) ** 2 + (node.y - other.y) ** 2) + Math.sqrt((node.from.x - node.from.from.x) ** 2 + (node.from.y - node.from.from.y) ** 2) ? node.from : node;
                        other.from = node2.from;
                        node2.from = other;
                    }
                    node = node.from.from;
                }

                node = end;
                while (node.from.from) {
                    if (node.from.cx == node.from.from.cx && node.from.cy == node.from.from.cy) {
                        if ((node.x - node.from.x) ** 2 + (node.y - node.from.y) ** 2 > (node.x - node.from.from.x) ** 2 + (node.y - node.from.from.y) ** 2 || !arePointsOnSameSide(node.from, node.from.from, node, {x: node.from.cx, y: node.from.cy})) {
                            console.log("Skipping point at", node.from.x, node.from.y);
                            node.from = node.from.from;
                        } else if ((node.from.from.from.x - node.from.x) ** 2 + (node.from.from.from.y - node.from.y) ** 2 < (node.from.from.from.x - node.from.from.x) ** 2 + (node.from.from.from.y - node.from.from.y) ** 2 || !arePointsOnSameSide(node.from, node.from.from, node.from.from.from, {x: node.from.cx, y: node.from.cy})) {
                            console.log("Skipping point at", node.from.from.x, node.from.from.y);
                            node.from.from = node.from.from.from;
                        }
                    }
                    node = node.from;
                }


                node = end;
                while (node.from.from) {
                    if (node.cx == node.from.cx && node.cy == node.from.cy) {
                        let extra = Math.floor(Math.sqrt((node.x - node.from.x) ** 2 + (node.y - node.from.y) ** 2) * 5);
                        for (let j = 1; j < extra; j++) {
                            // TODO Maybe replace this with some math that find the angle of the two main points and then calculates the points in between using sin and cos
                            path.unshift(moveInBounds({x: node.x + (node.from.x - node.x) * j / extra, y: node.y + (node.from.y - node.y) * j / extra}, r));
                        }
                    }
                    node = node.from;
                    path.unshift({x: node.x, y: node.y});
                }
                console.log("Time Taken: " + (performance.now() - start).toFixed(0) + "ms");
                return path;
            }
            node.start = bestDist;
            explored.push(node);
            for (let j = 0; j < unexplored.length; j++) {
                unexplored[j].nearest = Math.min(unexplored[j].nearest, Math.sqrt((node.x - unexplored[j].x) ** 2 + (node.y - unexplored[j].y) ** 2));
            }
            unexplored.sort((a, b) => a.end + a.nearest - b.end - b.nearest);
            i = 0;
        } else if (i++ == unexplored.length - 1) {
            console.warn("Could not find a path because there is none!");
            return undefined;
        }
    }
};
let findPath3 = (f, t, r) => {
    let start = performance.now();
    if (bounds.length == 0) {
        console.warn("World not loaded yet!");
        return undefined;
    }
    if (isLineInBounds(f, t, r * .5)) {
        return [t];
    }
    let explored = [{x: f.x, y: f.y, start: 0, end: Math.sqrt((f.x - t.x) ** 2 + (f.y - t.y) ** 2)}];
    let unexplored = [];
    for (let l of bounds) {
        let p = {x: l[0] + l[9] * r, y: l[1] + l[10] * r , cx: l[0], cy: l[1]};
        p.nearest = Math.sqrt((f.x - p.x) ** 2 + (f.y - p.y) ** 2);
        p.end = Math.sqrt((t.x - p.x) ** 2 + (t.y - p.y) ** 2);
        unexplored.push(p);
        p = {x: l[2] + l[9] * r, y: l[3] + l[10] * r, cx: l[2], cy: l[3]};
        p.nearest = Math.sqrt((f.x - p.x) ** 2 + (f.y - p.y) ** 2);
        p.end = Math.sqrt((t.x - p.x) ** 2 + (t.y - p.y) ** 2);
        unexplored.push(p);
    }

    // for(let i = 0; i < unexplored.length; i++) markPos(unexplored[i], 0, .1);

    let blocked = {};
    unexplored.sort((a, b) => a.end + a.nearest - b.end - b.nearest);
    let i = 0;
    while (true) {
        let bestExplored = undefined;
        let bestDist = Infinity;
        for (let j = 0; j < explored.length; j++) {
            if (!blocked[unexplored[i].x + "-" + unexplored[i].y + "-" + explored[j].x + "-" + explored[j].y] && !blocked[explored[j].x + "-" + explored[j].y + "-" + unexplored[i].x + "-" + unexplored[i].y]) {
                let dist = Math.sqrt((unexplored[i].x - explored[j].x) ** 2 + (unexplored[i].y - explored[j].y) ** 2) + explored[j].start;
                if (dist < bestDist) {
                    if (isLineInBounds(unexplored[i], explored[j])) {
                        bestExplored = explored[j];
                        bestDist = dist;
                    } else {
                        blocked[unexplored[i].x + "-" + unexplored[i].y + "-" + explored[j].x + "-" + explored[j].y] = true;
                    }
                }
            }
        }
        if (bestExplored) {
            let node = unexplored.splice(i, 1)[0];
            node.from = bestExplored;
            if (isLineInBounds(node, t)) {
                let path = [{x: t.x, y: t.y}];
                let end = Object.assign({from: node}, t);
                node = end;
                while (node.from.from) {
                    if (node.from.cx != node.from.from.cx || node.from.cy != node.from.from.cy) {
                        let other = undefined;
                        for (let potential of explored) {
                            if (potential != node.from && potential.cx == node.from.cx && potential.cy == node.from.cy) {
                                other = potential;
                                break;
                            }
                        }
                        if (!other) {
                            for (let potential of unexplored) {
                                if (potential.cx == node.from.cx && potential.cy == node.from.cy) {
                                    other = potential;
                                    break;
                                }
                            }
                        }
                        let node2 = Math.sqrt((node.x - node.from.x) ** 2 + (node.y - node.from.y) ** 2) + Math.sqrt((other.x - node.from.from.x) ** 2 + (other.y - node.from.from.y) ** 2) < Math.sqrt((node.x - other.x) ** 2 + (node.y - other.y) ** 2) + Math.sqrt((node.from.x - node.from.from.x) ** 2 + (node.from.y - node.from.from.y) ** 2) ? node.from : node;
                        other.from = node2.from;
                        node2.from = other;
                    }
                    // node = node.from.from;
                    if (node.from.cx == node.from.from.cx && node.from.cy == node.from.from.cy) {
                        if ((node.x - node.from.x) ** 2 + (node.y - node.from.y) ** 2 > (node.x - node.from.from.x) ** 2 + (node.y - node.from.from.y) ** 2 || !arePointsOnSameSide(node.from, node.from.from, node, {x: node.from.cx, y: node.from.cy})) {
                            console.log("Skipping point at", node.from.x, node.from.y);
                            node.from = node.from.from;
                        } else if ((node.from.from.from.x - node.from.x) ** 2 + (node.from.from.from.y - node.from.y) ** 2 < (node.from.from.from.x - node.from.from.x) ** 2 + (node.from.from.from.y - node.from.from.y) ** 2 || !arePointsOnSameSide(node.from, node.from.from, node.from.from.from, {x: node.from.cx, y: node.from.cy})) {
                            console.log("Skipping point at", node.from.from.x, node.from.from.y);
                            node.from.from = node.from.from.from;
                        }
                    }
                    node = node.from;
                    if (node.from.from) {
                        if (node.from.cx == node.from.from.cx && node.from.cy == node.from.from.cy) {
                            if ((node.x - node.from.x) ** 2 + (node.y - node.from.y) ** 2 > (node.x - node.from.from.x) ** 2 + (node.y - node.from.from.y) ** 2 || !arePointsOnSameSide(node.from, node.from.from, node, {x: node.from.cx, y: node.from.cy})) {
                                console.log("Skipping point at", node.from.x, node.from.y);
                                node.from = node.from.from;
                            } else if ((node.from.from.from.x - node.from.x) ** 2 + (node.from.from.from.y - node.from.y) ** 2 < (node.from.from.from.x - node.from.from.x) ** 2 + (node.from.from.from.y - node.from.from.y) ** 2 || !arePointsOnSameSide(node.from, node.from.from, node.from.from.from, {x: node.from.cx, y: node.from.cy})) {
                                console.log("Skipping point at", node.from.from.x, node.from.from.y);
                                node.from.from = node.from.from.from;
                            }
                        }
                        node = node.from;
                    }
                }



                /*node = end;
                while (node.from.from) {
                    if (node.from.cx == node.from.from.cx && node.from.cy == node.from.from.cy) {
                        if ((node.x - node.from.x) ** 2 + (node.y - node.from.y) ** 2 > (node.x - node.from.from.x) ** 2 + (node.y - node.from.from.y) ** 2 || !arePointsOnSameSide(node.from, node.from.from, node, {x: node.from.cx, y: node.from.cy})) {
                            console.log("Skipping point at", node.from.x, node.from.y);
                            node.from = node.from.from;
                        } else if ((node.from.from.from.x - node.from.x) ** 2 + (node.from.from.from.y - node.from.y) ** 2 < (node.from.from.from.x - node.from.from.x) ** 2 + (node.from.from.from.y - node.from.from.y) ** 2 || !arePointsOnSameSide(node.from, node.from.from, node.from.from.from, {x: node.from.cx, y: node.from.cy})) {
                            console.log("Skipping point at", node.from.from.x, node.from.from.y);
                            node.from.from = node.from.from.from;
                        }
                    }
                    node = node.from;
                }*/


                node = end;
                while (node.from.from) {
                    if (node.cx == node.from.cx && node.cy == node.from.cy) {
                        let extra = Math.floor(Math.sqrt((node.x - node.from.x) ** 2 + (node.y - node.from.y) ** 2) * 5);
                        for (let j = 1; j < extra; j++) {
                            // TODO Maybe replace this with some math that find the angle of the two main points and then calculates the points in between using sin and cos
                            path.unshift(moveInBounds({x: node.x + (node.from.x - node.x) * j / extra, y: node.y + (node.from.y - node.y) * j / extra}, r));
                        }
                    }
                    node = node.from;
                    path.unshift({x: node.x, y: node.y});
                }

                /*node = end;
                while (node.from.from) {
                    if (node.from.cx == node.from.from.cx && node.from.cy == node.from.from.cy) {
                        if ((node.x - node.from.x) ** 2 + (node.y - node.from.y) ** 2 > (node.x - node.from.from.x) ** 2 + (node.y - node.from.from.y) ** 2 || !arePointsOnSameSide(node.from, node.from.from, node, {x: node.from.cx, y: node.from.cy})) {
                            node.from = node.from.from;
                        } else if ((node.from.from.from.x - node.from.x) ** 2 + (node.from.from.from.y - node.from.y) ** 2 < (node.from.from.from.x - node.from.from.x) ** 2 + (node.from.from.from.y - node.from.from.y) ** 2 || !arePointsOnSameSide(node.from, node.from.from, node.from.from.from, {x: node.from.cx, y: node.from.cy})) {
                            node.from.from = node.from.from.from;
                        }
                    } else {
                        let extra = Math.floor(Math.sqrt((node.x - node.from.x) ** 2 + (node.y - node.from.y) ** 2) * 5);
                        for (let j = 1; j < extra; j++) {
                            // TODO Maybe replace this with some math that find the angle of the two main points and then calculates the points in between using sin and cos
                            path.unshift(moveInBounds({x: node.x + (node.from.x - node.x) * j / extra, y: node.y + (node.from.y - node.y) * j / extra}, r));
                        }
                    }
                    node = node.from;
                    path.unshift({x: node.x, y: node.y});
                }*/


                console.log("Time Taken: " + (performance.now() - start).toFixed(0) + "ms");
                return path;
            }
            node.start = bestDist;
            explored.push(node);
            for (let j = 0; j < unexplored.length; j++) {
                unexplored[j].nearest = Math.min(unexplored[j].nearest, Math.sqrt((node.x - unexplored[j].x) ** 2 + (node.y - unexplored[j].y) ** 2));
            }
            unexplored.sort((a, b) => a.end + a.nearest - b.end - b.nearest);
            i = 0;
        } else if (i++ == unexplored.length - 1) {
            console.warn("Could not find a path because there is none!");
            return undefined;
        }
    }
};

// UI
let generateColoredBarSVG = (id, colors, text, width = 100, height = 22, borderWidth = 2, borderRadius = 3) => {
    let innerHTML = "<rect x=\"0\" y=\"0\" width=\"" + (width + borderWidth * 2) + "\" height=\"" + (height + borderWidth * 2) + "\" fill=\"#000\" rx=\"" + (borderRadius + borderWidth) + "\"></rect>"
        + "<linearGradient id=\"" + id + "-444-222\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#444\"></stop><stop offset=\"1\" stop-color=\"#222\"></stop></linearGradient><rect x=\"" + borderWidth + "\" y=\"" + borderWidth + "\" width=\"" + width + "\" height=\"" + height + "\" fill=\"url(#" + id + "-444-222)\" rx=\"" + borderRadius + "\"></rect>"
        + "<mask id=\"" + id + "-mask\"><rect x=\"" + borderWidth + "\" y=\"" + borderWidth + "\" width=\"" + width + "\" height=\"" + height + "\" fill=\"#FFF\" rx=\"" + borderRadius + "\"></rect></mask><g mask=\"url(#" + id + "-mask)\">";
    for (let i = colors.length - 1; i >= 0; i--) {
        let x = borderWidth - borderRadius * 2;
        for (let j = 0; j < i; j++) {
            x += colors[j].width * width;
        }
        innerHTML += "<linearGradient id=\"" + id + "-" + colors[i].fromColor.replace("#", "") + "-" + colors[i].toColor.replace("#", "") + "\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"" + colors[i].fromColor + "\"></stop><stop offset=\"1\" stop-color=\"" + colors[i].toColor + "\"></stop></linearGradient>"
            + "<rect x=\"" + x + "\" y=\"" + borderWidth + "\" width=\"" + (colors[i].width * width + borderRadius * 2) + "\" height=\"" + height + "\" fill=\"url(#" + id + "-" + colors[i].fromColor.replace("#", "") + "-" + colors[i].toColor.replace("#", "") + "\" rx=\"" + borderRadius + "\"></rect>";
    }
    innerHTML += "</g><text x=\"" + (width + borderWidth * 2) / 2 + "\" y=\"" + Math.round(height * 11.5 + borderWidth * 20) / 20 + "\" fill=\"#FFF\" font-size=\"" + height / 2 + "\" text-anchor=\"middle\" dominant-baseline=\"middle\">" + text + "</text>";
    return {outerHTML: "<svg viewBox=\"0 0 " + (width + borderWidth * 2) + " " + (height + borderWidth * 2) + "\">" + innerHTML + "</svg>", innerHTML};
};

// Settings
let saveSettings = () => localStorage.setItem("settings", JSON.stringify(settings));
let loadSettings = (onComplete = () => {}) => {
    let completed = 0;
    let oldSettings = settings;
    settings = {
        lang: navigator.languages.find(lang => ["en-US", "de-DE"].indexOf(lang) > -1) || "en-US",
        uiScale: 1,
        confirmExit: false,
        controls: {
            move: "Left Mouse",
            followPlayer: "Space",
            camForward: "△",
            camBackward: "▽",
            camLeft: "◁",
            camRight: "▷",
            dragCam: "Left Mouse",
            castAbility1: "Q",
            castAbility2: "W",
            castAbility3: "E",
            castAbility4: "A",
            castAbility5: "S",
            castAbility6: "D",
            castSelectedAbility: "Left Mouse",
        }
    };
    if (localStorage.getItem("settings")) {
        mergeObjects(settings, JSON.parse(localStorage.getItem("settings")));
    }
    document.getElementById("settings-interface-language").value = settings.lang;
    if (settings.lang == oldSettings.lang) {
        completed++;
    } else {
        selectLanguage(settings.lang, () => {
            if (++completed == 1) {
                onComplete();
            }
        });
    }
    document.getElementById("settings-interface-ui-scale-display").innerText = settings.uiScale;
    document.getElementById("settings-interface-ui-scale").value = [.4, .5, .6, .7, .8, .9, 1, 1.1, 1.2, 1.3, 1.4, 1.6, 1.8, 2].indexOf(closestFromList([.4, .5, .6, .7, .8, .9, 1, 1.1, 1.2, 1.3, 1.4, 1.6, 1.8, 2], settings.uiScale));
    document.body.setAttribute("style", "--ui-scale: " + Math.min(settings.uiScale, Math.min(window.innerWidth / 16, window.innerHeight / 9) / 50) + ";");
    if (settings.confirmExit) {
        document.getElementById("settings-interface-confirm-exit").setAttribute("active", "");
    }
    for (let control of Object.keys(settings.controls)) {
        if (settings.controls[control] == "Esc") {
            document.getElementById("settings-control-" + control).setAttribute("trans", "control.esc");
        } else if (settings.controls[control] == "Space") {
            document.getElementById("settings-control-" + control).setAttribute("trans", "control.space");
        } else if (settings.controls[control].startsWith("Numpad ")) {
            document.getElementById("settings-control-" + control).setAttribute("trans", "control.numpad");
            document.getElementById("settings-control-" + control).innerText = settings.controls[control].substring(6);
        } else if (settings.controls[control] == "Left Mouse") {
            document.getElementById("settings-control-" + control).setAttribute("trans", "control.left-mouse");
        } else if (settings.controls[control] == "Right Mouse") {
            document.getElementById("settings-control-" + control).setAttribute("trans", "control.right-mouse");
        } else if (settings.controls[control] == "Mouse Wheel") {
            document.getElementById("settings-control-" + control).setAttribute("trans", "control.mouse-wheel");
        } else if (settings.controls[control].startsWith("Mouse ")) {
            document.getElementById("settings-control-" + control).setAttribute("trans", "control.mouse");
            document.getElementById("settings-control-" + control).innerText = settings.controls[control].substring(5);
        } else {
            document.getElementById("settings-control-" + control).innerText = settings.controls[control];
        }
    }
    if (completed == 1) {
        onComplete();
    }
};
let closeSettings = () => {
    hideElement(document.getElementById("settings"));
    saveSettings();
};
let selectSettingsTab = tab => {
    document.querySelectorAll("#settings-tabs button").forEach(e => e.removeAttribute("selected"));
    document.getElementById("settings-tab-" + tab).setAttribute("selected", "");
    document.querySelectorAll(".settings-options").forEach(e => e.setAttribute("hidden", ""));
    document.getElementById("settings-options-" + tab).removeAttribute("hidden");
};
// Settings - Interface - Language
let selectLanguage = (lang, onComplete = () => {}) => {
    fetch("lang/" + (settings.lang = lang) + ".json").then(r => r.text()).then(d => {
        translations = JSON.parse(d);
        let translationsCSS = "[trans]::before{content:\"Missing Translation\"}";
        for (let key of Object.keys(translations)) {
            translationsCSS += "[trans=" + (key.includes(".") ? "\"" + key + "\"" : key) + "]::before{content:\"" + translations[key].replaceAll("\n", "\\a") + (translations[key].includes("\n") ? "\";white-space:pre-wrap}" : "\"}");
        }
        onComplete(document.getElementById("translations").innerHTML = translationsCSS);
    });
};
// Settings - Controls
let inputControl = control => {
    showElement(document.getElementById("settings-control-input"));
    // document.getElementById("settings-control-input").removeAttribute("hidden");
    document.getElementById("settings-control-input-title").setAttribute("trans", "settings.control." + control);
    document.getElementById("settings-control-input-button").onmousedown = e => {
        document.getElementById("settings-control-input").setAttribute("hidden", "");
        settings.controls[control] = mouseButtonToName(e.button);
        let button = document.getElementById("settings-control-" + control);
        button.removeAttribute("trans");
        button.innerText = "";
        if (settings.controls[control] == "Left Mouse") {
            button.setAttribute("trans", "control.left-mouse");
        } else if (settings.controls[control] == "Mouse Wheel") {
            button.setAttribute("trans", "control.mouse-wheel");
        } else if (settings.controls[control] == "Right Mouse") {
            button.setAttribute("trans", "control.right-mouse");
        } else if (settings.controls[control].startsWith("Mouse ")) {
            button.setAttribute("trans", "control.mouse");
            button.innerText = settings.controls[control].substring(5);
        } else {
            button.innerText = settings.controls[control];
        }
    };
    document.getElementById("settings-control-input-unassign").onclick = () => {
        hideElement(document.getElementById("settings-control-input"));
        // document.getElementById("settings-control-input").setAttribute("hidden", "");
        settings.controls[control] = "Unbound";
        document.getElementById("settings-control-" + control).setAttribute("trans", "control.unbound");
        document.getElementById("settings-control-" + control).innerText = "";
    };
};

// Abilities
let abilities = {
    fireball: {
        name: "fireball",
        cooldown: 3,
    },
    iceBolt: {
        name: "iceBolt",
        cooldown: 5,
    },
    lightning: {
        name: "lightning",
        cooldown: 8,
    },
    shadowBolt: {
        name: "shadowBolt",
        cooldown: 5,
    },
    shockwave: {
        name: "shockwave",
        cooldown: 1,
    }
};
let selectedAbility = undefined;
let selectAbility = ability => {
    if (selectedAbility) {
        document.getElementById("hotbar-ability-" + selectedAbility).removeAttribute("selected");
    }
    selectedAbility = ability == selectedAbility ? undefined : ability;
    if (selectedAbility) {
        document.getElementById("hotbar-ability-" + selectedAbility).setAttribute("selected", "");
    }
};
let useAbility = (p, ability, pos) => {
    // Calculate Mouse Location
    let direction = {x: pos.x - p.pos.x, y: pos.y - p.pos.y};
    direction.d = Math.sqrt(direction.x ** 2 + direction.y ** 2);
    direction.nX = direction.x / direction.d;
    direction.nY = direction.y / direction.d;
    direction.a = Math.atan2(direction.y, direction.x);
    // Handle Abilities
    let abilityIndex = p.abilities.findIndex(a => a.name == ability);
    if (p.abilities[abilityIndex].lastUse + abilities[ability].cooldown > now) {
        return;
    }
    if (ability == "fireball") {
        let fireball = {
            type: "fireball",
            pos: {
                x: player.pos.x,
                y: player.pos.y
            },
            vel: {
                x: direction.nX * 20,
                y: direction.nY * 20
            },
            size: .2,
            explosion: {
                size: 2,
                damage: 25
            },
            id: genID(),
            summoner: p.id,
            mesh: new threejs.Mesh(new threejs.SphereGeometry(.2, 32, 32), new threejs.MeshBasicMaterial({color: 0xFFDD00}))
        };
        objects.push(fireball);
        fireball.mesh.position.y = 0;
        three.scene.add(fireball.mesh);
    }
    if (ability == "iceBolt") {
        let iceBolt = {
            type: "iceBolt",
            pos: {
                x: player.pos.x,
                y: player.pos.y
            },
            vel: {
                x: direction.nX * 20,
                y: direction.nY * 20
            },
            size: .5,
            effect: {
                duration: 3,
                speed: .5,
                health: -10
            },
            id: genID(),
            summoner: p.id,
            mesh: new threejs.Mesh(new threejs.SphereGeometry(.5, 32, 32), new threejs.MeshBasicMaterial({color: 0x0088F0}))
        };
        objects.push(iceBolt);
        iceBolt.mesh.position.y = 0;
        three.scene.add(iceBolt.mesh);
    }
    if (ability == "lightning") {
        if ((p.pos.x - pos.x) ** 2 + (p.pos.y - pos.y) ** 2 > 6 ** 2 || !isLineInBounds(p.pos.x, p.pos.y, pos.x, pos.y)) {
            if (p == player) {
                for (let i = 0; i < objects.length; i++) {
                    let obj = objects[i];
                    if (obj.type == "rangeDisplay") {
                        three.scene.remove(obj.mesh);
                        objects.splice(i--, 1);
                        continue;
                    }
                }
                let rangeDisplay = {
                    type: "rangeDisplay",
                    player: p,
                    id: genID(),
                    summoner: p.id,
                    mesh: new threejs.Mesh(new threejs.SphereGeometry(3, 128, 0), new threejs.MeshBasicMaterial({
                        color: 0xBBDDFF,
                        transparent: true,
                        opacity: .5
                    }))
                };
                objects.push(rangeDisplay);
                rangeDisplay.mesh.scale.y = 0;
                three.scene.add(rangeDisplay.mesh);
            }
            return;
        }
        let lightning = {
            type: "lightning",
            pos,
            size: 3,
            id: genID(),
            summoner: p.id,
            mesh: new threejs.Mesh(new threejs.SphereGeometry(1, 64, 64), new threejs.MeshBasicMaterial({color: 0xFFFFFF}))
        };
        objects.push(lightning);
        lightning.mesh.position.y = 0;
        three.scene.add(lightning.mesh);
        for (pl of players) {
            if (pl == p) {
                continue;
            }
            if ((pl.pos.x - pos.x) ** 2 + (pl.pos.y - pos.y) ** 2 < (pl.size + lightning.size) ** 2) {
                let damage = Math.min(lightning.size, pl.size + lightning.size - Math.sqrt((pl.pos.x - pos.x) ** 2 + (pl.pos.y - pos.y) ** 2)) / lightning.size * 20;
                pl.health -= damage;
                pl.damageTaken += damage;
            }
        }
    }
    if (ability == "shadowBolt") {
        let shadowBolt = {
            type: "shadowBolt",
            pos: {
                x: player.pos.x,
                y: player.pos.y
            },
            vel: {
                x: direction.nX * 15,
                y: direction.nY * 15
            },
            size: .5,
            explosion: {
                size: 1.5,
                range: 1,
                damage: 10
            },
            id: genID(),
            summoner: p.id,
            mesh: new threejs.Mesh(new threejs.SphereGeometry(.5, 48, 48), new threejs.MeshBasicMaterial({color: 0xAA00FF}))
        };
        objects.push(shadowBolt);
        shadowBolt.mesh.position.y = 0;
        three.scene.add(shadowBolt.mesh);
    }
    if (ability == "shockwave") {
        let shockwave = {
            type: "shockwave",
            pos: {
                x: player.pos.x,
                y: player.pos.y
            },
            vel: {
                x: direction.nX * 10,
                y: direction.nY * 10
            },
            size: .3,
            range: 1,
            damage: 10,
            id: genID(),
            summoner: p.id,
            hitPlayers: [],
            mesh: new threejs.Mesh(new threejs.SphereGeometry(.3, 32, 32), new threejs.MeshBasicMaterial({color: 0x775500}))
        };
        objects.push(shockwave);
        shockwave.mesh.position.y = 0;
        three.scene.add(shockwave.mesh);
    }
    p.abilities[abilityIndex].lastUse = now;
};

// Crashing
let crash = e => {
    let str = e.name + ": " + e.message;
    let stack = e.stack.split("\n");
    for (let i = 1; i < stack.length; i++) {
        str += "\n- " + stack[i].substring(7, stack[i].indexOf("(") + 1) + stack[i].substring(stack[i].lastIndexOf("/") + 1);
    }
    document.getElementById("game-crash-error").innerText = str;
    showElement(document.getElementById("game-crash"));
};

// Debugging
let markPos = (pos, color = 0xFFDD00, r = .2) => {
    let mesh = new threejs.Mesh(new threejs.SphereGeometry(r, 32, 32), new threejs.MeshBasicMaterial({color}));
    mesh.position.x = pos.x;
    mesh.position.y = pos.z ? pos.z : 0;
    mesh.position.z = pos.y;
    three.scene.add(mesh);
};
let markLine = (ps, color = 0xFFDD00) => {
    let points = [];
    for (let p of ps) {
        points.push(new threejs.Vector3(p.x, p.z ? p.z : .1, p.y));
    }
    three.scene.add(new threejs.Line(new threejs.BufferGeometry().setFromPoints(points), new threejs.LineBasicMaterial({color, linewidth: .01})));
};
/*
let p1 = frank.pos;
let p2 = {x: -20, y: -23};
let p = findPath2(p1, p2, .35);
if (p) for (i = 0; i < p.length; i++) markPos(p[i], 0xE55454, .2);
p = findPath3(p1, p2, .35);
if (p) for (i = 0; i < p.length; i++) markPos({x: p[i].x, y: p[i].y, z: .2}, 0x309AC2, .1);
*/
