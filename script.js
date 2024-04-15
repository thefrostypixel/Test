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
let setInnerHTML = (element, html) => {
    if (element.innerHTML != html) {
        element.innerHTML = html;
    }
};
let closestFromList = (l, n) => l.reduce((p, c) => Math.abs(c - n) < Math.abs(p - n) ? c : p);

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
    angle: .4,
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
    }
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
            console.log(control);
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
                type: "Key",
                startPos: controls.pos,
                startWorldPos: controls.worldPos,
                startTarget: controls.target,
                offset: {x: 0, y: 0},
                worldOffset: {x: 0, y: 0, z: 0},
                lastPositions: []
            };
            controls.pressed[key] = {
                type: "Key",
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
        controls.clickCausedFocus = focused - now > -.01;
        if (e.target == document.getElementById("canvas")) {
            let button = mouseButtonToName(e.button);
            controls.held[button] = {
                type: "Mouse",
                startPos: controls.pos,
                startWorldPos: controls.worldPos,
                startTarget: controls.target,
                offset: {x: 0, y: 0},
                worldOffset: {x: 0, y: 0, z: 0},
                lastPositions: []
            };
        }
    };
    document.onmouseup = e => {
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
    document.ontouchstart = e => document.onmousedown({button: 0, target: e.target, clientX: controls.pos.x = e.touches[0].clientX, clientY: controls.pos.y = e.touches[0].clientY});
    document.ontouchend = () => document.onmouseup({button: 0});
    window.ontouchmove = e => controls.pos = {x: e.touches[0].clientX, y: e.touches[0].clientY};
    document.oncontextmenu = e => e.preventDefault();
    window.onfocus = () => focused = now;
    window.onblur = () => {
        controls.held = [];
        focused = false;
    };
    window.onwheel = e => controls.scrolled += e.deltaY > 0 ? 1 : -1;
}
let getDragVel = button => {
    while (controls.held[button].lastPositions.length > 0 && controls.held[button].lastPositions[0].t < now - .1) {
        controls.held[button].lastPositions.shift();
    }
    if (controls.held[button].lastPositions.length == 0) {
        return {x: 0, y: 0};
    }
    let dragVel = {x: (controls.pos.x - controls.held[button].lastPositions[0].x) / 50, y: (controls.pos.y - controls.held[button].lastPositions[0].y) / 50};
    if (dragVel.x ** 2 + dragVel.y ** 2 > 15 ** 2) {
        let len = 1500 / Math.sqrt(dragVel.x ** 2 + dragVel.y ** 2);
        dragVel.x = Math.round(dragVel.x * len) / 100;
        dragVel.y = Math.round(dragVel.y * len) / 100;
    }
    controls.held[button].lastPositions = [];
    return dragVel;
};

// Frame Loop
let lastFrameTimes = [];
let debugText = "";
let frame = () => {
    debugText = "";
    // Time
    let time = Math.round(performance.now() * 10) / 10000;
    let timeScale = (time - lastFrameTimes[lastFrameTimes.length - 1] || 0) * game.timeScale;
    lastFrameTimes.push(time);
    while (lastFrameTimes[0] < time - .99) {
        lastFrameTimes.shift();
    }
    now = Math.round((now + timeScale) * 10000) / 10000;
    debugText += "FPS: " + lastFrameTimes.length + "<br>";
    // MAIN MENU
    if (platform.client && menuScreen == "main") {
    }
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
                    controls.held[button].offset.x += controls.pos.x - controls.oldPos.x;
                    controls.held[button].offset.y += controls.pos.y - controls.oldPos.y;
                    while (controls.held[button].lastPositions.length > 0 && controls.held[button].lastPositions[0].t < now- .1) {
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
                if (isInBounds(controls.pressed["Right Mouse"].startWorldPos.x, controls.pressed["Right Mouse"].startWorldPos.y, frank.size)) {
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
            if (controls.pressed["Left Mouse"] && selectedAbility) {
                useAbility(player, selectedAbility, controls.pressed["Left Mouse"].startWorldPos);
            } else if (controls.pressed["Left Mouse"] && player && players.indexOf(controls.pressed["Left Mouse"].target) > -1 && controls.pressed["Left Mouse"].target != player) {
                player.target = controls.pressed["Left Mouse"].target;
                player.path = findPath(player.pos, controls.pressed["Left Mouse"].target.pos, player.size);
            } else if (controls.pressed["Left Mouse"] && player && players.indexOf(controls.pressed["Left Mouse"].target) == -1 && !selectedAbility) {
                if (isInBounds(controls.pressed["Left Mouse"].startWorldPos.x, controls.pressed["Left Mouse"].startWorldPos.y, player.size)) {
                    player.target = undefined;
                    player.path = findPath(player.pos, controls.pressed["Left Mouse"].startWorldPos, player.size);
                    let temporaryMarker = {
                        type: "temporaryMarker",
                        pos: {
                            x: controls.pressed["Left Mouse"].startWorldPos.x,
                            y: controls.pressed["Left Mouse"].startWorldPos.y,
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
            for (let i = 0; i < player.abilities.length; i++) {
                if (controls.pressed[settings.controls["ability" + (i + 1)]]) {
                    useAbility(player, player.abilities[i].name, controls.worldPos);
                }
            }
        }
        // Camera
        if (platform.client) {
            if (controls.pressed[settings.controls.followPlayer] || (controls.pressed["Left Mouse"] && (player ? controls.pressed["Left Mouse"].target == player : players.indexOf(controls.pressed["Left Mouse"].target) > -1) && !selectedAbility)) {
                if (player) {
                    followCam(player);
                } else if (controls.pressed["Left Mouse"]) {
                    followCam(controls.pressed["Left Mouse"].target);
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
            } else if ((controls.pressed[settings.controls.forward] || controls.pressed[settings.controls.backward] || controls.pressed[settings.controls.left] || controls.pressed[settings.controls.right] || (controls.held["Left Mouse"] && (controls.held["Left Mouse"].offset.x != 0 || controls.held["Left Mouse"].offset.y != 0))) && cam.following) {
                freeCam();
            }
            if (!cam.following) {
                if (controls.held["Left Mouse"] && (controls.held["Left Mouse"].offset.x != 0 || controls.held["Left Mouse"].offset.y != 0)) {
                    cam.pos.x -= controls.held["Left Mouse"].worldOffset.x;
                    cam.pos.y -= controls.held["Left Mouse"].worldOffset.y;
                }
                if (controls.released.indexOf("Left") > -1) {
                    let dragVel = getDragVel("Left");
                    cam.vel.x -= dragVel.x;
                    cam.vel.y -= dragVel.y;
                }
                cam.move.speed = Math.max(2, Math.min(50, cam.move.speed + controls.scrolled));
                let right = (controls.held[settings.controls.right] ? 1 : 0) - (controls.held[settings.controls.left] ? 1 : 0);
                let down = (controls.held[settings.controls.backward] ? 1 : 0) - (controls.held[settings.controls.forward] ? 1 : 0);
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
                let newPos = cam.following ? {x: cam.pos.x + cam.vel.x * velMult, y: cam.pos.y + cam.vel.y * velMult} : moveInOuterBounds(cam.pos.x + cam.vel.x * velMult, cam.pos.y + cam.vel.y * velMult, .35);
                if (cam.pos.x == newPos.x && cam.pos.y == newPos.y) {
                    break;
                }
                cam.pos = newPos;
            }
        }
        // Clear Inputs
        if (platform.client) {
            if (controls.held["Left Mouse"]) {
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
                if ((!p.path && (p.pos.x - p.target.pos.x) ** 2 + (p.pos.y - p.target.pos.y) ** 2 > p.melee.range ** 2) || (p.path && Math.sqrt((p.path[p.path.length - 1].x - p.pos.x) ** 2 + (p.path[p.path.length - 1].y - p.pos.y) ** 2) < Math.sqrt((p.path[p.path.length - 1] - p.target.pos.x) ** 2 + (p.path[p.path.length - 1] - p.target.pos.y) ** 2) * 2)) {
                    console.log("Recalculating path!");
                    p.path = findPath(p.pos, moveInBounds(p.target.pos.x, p.target.pos.y, p.target.size * 2), p.size);
                }
            }
            if (p.path) {
                if (!isLineInBounds(p.pos.x, p.pos.y, p.path[0].x, p.path[0].y)) {
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
                let newPos = p.move.noCol ? {x: p.pos.x + p.vel.x * velMult, y: p.pos.y + p.vel.y * velMult} : moveInBounds(p.pos.x + p.vel.x * velMult, p.pos.y + p.vel.y * velMult, p.size);
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
                if (!isInBounds(obj.pos.x, obj.pos.y, obj.size)) {
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
                            until: now+ obj.effect.duration,
                            multiplier: obj.effect.speed
                        }, {
                            type: "health",
                            until: now+ obj.effect.duration,
                            perSecond: obj.effect.health / obj.effect.duration
                        });
                        hit = true;
                    }
                }
                if (hit || !isInBounds(obj.pos.x, obj.pos.y, obj.size)) {
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
                if (!isInBounds(obj.pos.x, obj.pos.y, obj.size)) {
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
                if (!isInBounds(obj.pos.x, obj.pos.y, obj.size)) {
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
        if (platform.client && player) {
            for (let i = 0; i < document.getElementById("hotbar-abilities").children.length; i++) {
                let ability = abilities[document.getElementById("hotbar-abilities").children[i].getAttribute("ability")];
                let cooldown = Math.max(0, player.abilities[i].lastUse + ability.cooldown - now) / ability.cooldown;
                document.getElementById("hotbar-abilities").children[i].style = cooldown == 0 ? "--cooldown: #0000;" : "--cooldown: linear-gradient(to bottom, #0008 0%, #0008 " + Math.ceil(1000 * cooldown) / 10 + "%, #0000 " + Math.ceil(1000 * cooldown) / 10 + "%, #0000 100%);";
            }
            player.damageTaken = Math.max(0, player.damageTaken - timeScale * 50);
            frank.damageTaken = Math.max(0, frank.damageTaken - timeScale * 50);
            setInnerHTML(document.querySelector("#hotbar-health-bar"), generateColoredBarSVG("health-bar", [{fromColor: "#3AB300", toColor: "#216600", width: Math.max(0, player.health) / 100}, {fromColor: "#CCCC00", toColor: "#808000", width: Math.max(0, player.damageTaken) / 100}], Math.round(Math.max(0, player.health)) + "%", 480).innerHTML);
            setInnerHTML(document.querySelector("#hotbar-health-bar-frank"), generateColoredBarSVG("health-bar-frank", [{fromColor: "#3AB300", toColor: "#216600", width: Math.max(0, frank.health) / 100}, {fromColor: "#CCCC00", toColor: "#808000", width: Math.max(0, frank.damageTaken) / 100}], Math.round(Math.max(0, frank.health)) + "%", 480).innerHTML);
        }
    }
    // UI
    if (platform.client) {
        document.body.setAttribute("style", "--ui-scale: " + Math.min(settings.uiScale, Math.min(window.innerWidth / 16, window.innerHeight / 9) / 50) + ";");
    }
    // Debug Text
    if (platform.client) {
        setInnerHTML(document.getElementById("debug-text"), debugText.substring(0, debugText.length - 4));
    }
    // Next Frame
    requestAnimationFrame(frame);
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
                let e = (x1 + y1 > x2 + y2 || (x1 + y1 == x2 + y2 && x1 > x2) ? [x2, y2, x1, y1] : [x1, y1, x2, y2]).join(" ");
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
            if (!isInBounds((l[0] + l[2]) / 2 + nx * 1e-6, (l[1] + l[3]) / 2 + ny * 1e-6)) {
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
let isInBounds = (x, y, r = 0) => {
    let c = false;
    let p = false;
    for (let l of bounds) {
        let t = Math.max(0, Math.min(1, ((x - l[0]) * l[4] + (y - l[1]) * l[5]) / l[8]));
        if ((x - l[0] - t * l[4]) ** 2 + (y - l[1] - t * l[5]) ** 2 <= r ** 2) {
            return false;
        }
        if (((l[0] >= x && l[2] <= x) || (l[0] <= x && l[2] >= x)) && (l[6] * x + l[1] - l[6] * l[0] < y) && ((x == l[0] || x == l[2]) ? (p = !p) : true)) {
            c = !c;
        }
    }
    return c;
};
let moveInBounds = (x, y, r = 0, forceInbounds = false) => {
    let cl;
    let remainingRepeats = forceInbounds ? 10 : 0;
    while (remainingRepeats-- >= 0) {
        let c = false; // In Bounds
        let p = false; // Colliding With Point
        let o = true; // Not Colliding With Bounds
        let e = false; // Colliding With End Of Line
        let cx = 0;
        let cy = 0;
        let nx = 0;
        let ny = 0;
        let cd = Infinity;
        for (let i = 0; i < bounds.length; i++) {
            let l = bounds[i];
            let t = Math.max(0, Math.min(1, ((x - l[0]) * l[4] + (y - l[1]) * l[5]) / l[8]));
            let d = (x - l[0] - t * l[4]) ** 2 + (y - l[1] - t * l[5]) ** 2;
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
            } else if (((l[0] >= x && l[2] <= x) || (l[0] <= x && l[2] >= x)) && (l[6] * x + l[1] - l[6] * l[0] < y) && ((x == l[0] || x == l[2]) ? (p = !p) : true)) {
                c = !c;
            }
        }
        if (c && o) {
            return {x, y};
        } else if (e) {
            let d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            nx = (x - cx) / d;
            ny = (y - cy) / d;
        }
        x = cx + nx * r;
        y = cy + ny * r;
        // return c && o ? {x, y} : (x: cx + (e ? (x - cx) / Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) : nx) * r, y: cy + (e ? (y - cy) / Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) : ny) * r};
    }
    return {x, y, line: cl};
};
let isLineInBounds = (x1, y1, x2, y2, r = 0) => {
    for (let l of bounds) {
        let det = (x2 - x1) * (l[3] - l[1]) - (l[2] - l[0]) * (y2 - y1);
        if (det != 0) {
            let lambda = ((l[3] - l[1]) * (l[2] - x1) + (l[0] - l[2]) * (l[3] - y1)) / det;
            let gamma = ((y1 - y2) * (l[2] - x1) + (x2 - x1) * (l[3] - y1)) / det;
            if (0 < lambda && lambda < 1 && 0 < gamma && gamma < 1) {
                return false;
            }
        }
        let line = [x1, y1, x2, y2, x2 - x1, y2 - y1, undefined, undefined, (x2 - x1) ** 2 + (y2 - y1) ** 2, 0, 0];
        let isPointNearLine = (x, y, l, r) => {
            let t = Math.max(0, Math.min(1, ((x - l[0]) * l[4] + (y - l[1]) * l[5]) / l[8]));
            return (x - l[0] - t * l[4]) ** 2 + (y - l[1] - t * l[5]) ** 2 <= r ** 2;
        }
        if (isPointNearLine(x1, y1, l, r) || isPointNearLine(x2, y2, l, r) || isPointNearLine(l[0], l[1], line, r) || isPointNearLine(l[2], l[3], line, r)) {
            return false;
        }
    }
    return true;
};
let isInOuterBounds = (x, y) => {
    let c = false;
    let p = false;
    for (let l of outerBounds) {
        if (((l[0] >= x && l[2] <= x) || (l[0] <= x && l[2] >= x)) && (l[6] * x + l[1] - l[6] * l[0] < y) && ((x == l[0] || x == l[2]) ? (p = !p) : true)) {
            c = !c;
        }
    }
    return c;
};
let moveInOuterBounds = (x, y) => {
    if (isInOuterBounds(x, y)) {
        return {x, y};
    }
    let cx = 0;
    let cy = 0;
    let cd = Infinity;
    for (let l of outerBounds) {
        let t = Math.max(0, Math.min(1, ((x - l[0]) * l[4] + (y - l[1]) * l[5]) / l[8]));
        let d = (x - l[0] - t * l[4]) ** 2 + (y - l[1] - t * l[5]) ** 2;
        if (d < cd) {
            cx = l[0] + t * l[4];
            cy = l[1] + t * l[5];
            cd = d;
        }
    }
    return {x: cx, y: cy};
};

// Path Finding
let findPath = (f, t, r) => {
    let paths = [{x: f.x, y: f.y, dist: 0, path: [f]}];
    let foundPath;
    let explored = [];
    let count = 0;
    while (count++ < 200 && paths.length > 0) {
        let path = paths.splice(0, 1)[0];
        let x = path.x;
        let y = path.y;
        let line;
        let steps = Math.ceil(Math.sqrt((t.x - x) ** 2 + (t.y - y) ** 2) / r);
        for (let i = 1; i <= steps; i++) {
            let nx = x + (t.x - x) * i / steps;
            let ny = y + (t.y - y) * i / steps;
            if (!isInBounds(nx, ny, r - 1e-4)) {
                let inBounds = moveInBounds(nx, ny, r - 1e-4);
                path.x = inBounds.x;
                path.y = inBounds.y;
                line = inBounds.line;
                path.path.push(inBounds);
                break;
            }
        }
        if (!line) {
            path.dist += Math.sqrt((x - t.x) ** 2 + (y - t.y) ** 2);
            if (!foundPath || path.dist < foundPath.dist) {
                path.path.push(t);
                foundPath = path;
            }
            continue;
        }
        explored.push(line = (explored.includes(line) && path.line) ? path.line : line);
        for (let i = 0; i < 3; i += 2) {
            let pos2 = undefined;
            let cl = undefined;
            let cd = Infinity;
            for (let j = 0; j < bounds.length; j++) {
                if (j != line) {
                    for (let k = 0; k < 3; k += 2) {
                        if ((bounds[j][k] - bounds[line][i]) ** 2 + (bounds[j][k + 1] - bounds[line][i + 1]) ** 2 < cd) {
                            pos2 = {x: bounds[j][k] + bounds[j][9] * r, y: bounds[j][k + 1] + bounds[j][10] * r};
                            cl = j;
                            cd = (bounds[j][k] - bounds[line][i]) ** 2 + (bounds[j][k + 1] - bounds[line][i + 1]) ** 2;
                        }
                    }
                }
            }
            if (!explored.includes(cl)) {
                let pos1 = {x: bounds[line][i] + bounds[line][9] * r, y: bounds[line][i + 1] + bounds[line][10] * r};
                let dist = path.dist + Math.sqrt((path.x - pos1.x) ** 2 + (path.y - pos1.y) ** 2) + Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2);
                if (!foundPath || dist < foundPath.dist) {
                    let newSteps = path.path.slice();
                    newSteps.push(pos1, pos2);
                    let newPath = {x: pos2.x, y: pos2.y, dist: path.dist + Math.sqrt((path.x - pos1.x) ** 2 + (path.y - pos1.y) ** 2) + Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2), path: newSteps, line: cl};
                    for (let i = 0; i < paths.length; i++) {
                        if (paths[i].dist > newPath.dist) {
                            paths.splice(i, 0, newPath);
                            break;
                        }
                    }
                    if (paths.length == 0 || paths[paths.length - 1].dist <= newPath.dist) {
                        paths.push(newPath);
                    }
                }
            }
        }
    }
    if (foundPath) {
        let path = foundPath.path;
        for (let i = 0; i < path.length - 1; i++) {
            let steps = Math.ceil(Math.sqrt((path[i].x - path[i + 1].y) ** 2 + (path[i].x - path[i + 1].y) ** 2) / r);
            if (steps < 2) {
                continue;
            }
            let nx = (path[i + 1].x - path[i].x) / steps;
            let ny = (path[i + 1].y - path[i].y) / steps;
            for (let j = 1; j < steps; j++) {
                path.splice(i + j, 0, moveInBounds(path[i].x + nx * j, path[i].y + ny * j, r));
            }
            i += steps - 1;
        }
        for (let i = path.length; i > 2; i--) {
            for (let j = 0; j < i - 1; j++) {
                if (isLineInBounds(path[j].x, path[j].y, path[i - 1].x, path[i - 1].y, r * .99)) {
                    path.splice(j + 1, i - j - 2);
                    i = j + 2;
                    break;
                }
            }
        }
        return path;
    }
    console.warn("Could not find a path from " + f.x + " " + f.y + " to " + t.x + " " + t.y + (paths.length > 0 ? " because it is too complex!" : " because there is none!"));
    return undefined;
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
        controls: {
            forward: "△",
            backward: "▽",
            left: "◁",
            right: "▷",
            followPlayer: "Space",
            ability1: "Q",
            ability2: "W",
            ability3: "E",
            ability4: "A",
            ability5: "S",
            ability6: "D"
        }
    };
    if (localStorage.getItem("settings")) {
        settings = JSON.parse(localStorage.getItem("settings"));
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
let openSettings = () => {
    document.getElementById("settings").removeAttribute("hidden");
    document.getElementById("settings").style = "transition: .2s opacity, .2s transform";
    setTimeout(() => document.getElementById("settings").removeAttribute("style"), 200);
};
let closeSettings = () => {
    document.getElementById("settings").setAttribute("hidden", "");
    document.getElementById("settings").style = "transition: .2s opacity, .2s transform";
    setTimeout(() => document.getElementById("settings").removeAttribute("style"), 200);
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
            translationsCSS += "[trans=\"" + key + "\"]::before{content:\"" + translations[key] + "\"}";
        }
        onComplete(document.getElementById("translations").innerHTML = translationsCSS);
    });
};
// Settings - Controls
let inputControl = control => {
    document.getElementById("settings-control-input").removeAttribute("hidden");
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
        document.getElementById("settings-control-input").setAttribute("hidden", "");
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

// Debugging
let markPos = (pos, color = 0xFFDD00, r = .35) => {
    let mesh = new threejs.Mesh(new threejs.SphereGeometry(r, 32, 32), new threejs.MeshBasicMaterial({color}));
    mesh.position.x = pos.x;
    mesh.position.y = pos.z ? pos.z : 0;
    mesh.position.z = pos.y;
    three.scene.add(mesh);
};
