let three = {};

// Setup Variables
let isClient = true;
let isHost = true;
let isOnline = false;
let config = {};
let gameConfig = {
    timeScale: 1
};
let translations = {};
let abilities = {
    fireball: {
        name: "fireball",
        cooldown: 3,
    },
    iceBolt: {
        name: "iceBolt",
        cooldown: 1,
    }
};
let selectedAbility = undefined;
let player = {
    move: {
        speed: 2,
        smooth: .1,
        friction: 0,
        noCol: false
    },
    pos: {
        x: 30.68,
        y: 11.64
    },
    vel: {
        x: 0,
        y: 0,
        angle: 0
    },
    size: .35,
    abilities: [
        {
            name: "fireball",
            level: 1,
            lastUse: -abilities.fireball.cooldown
        },
        {
            name: "iceBolt",
            level: 1,
            lastUse: -abilities.iceBolt.cooldown
        }
    ],
    id: genID(),
    name: "You",
    health: 100,
    damageTaken: 0,
    mesh: undefined,
    isBot: false
};
let frank = {
    move: {
        speed: 2,
        smooth: .1,
        friction: 0,
        noCol: false
    },
    pos: {
        x: 30.68,
        y: 11.64
    },
    vel: {
        x: 0,
        y: 0,
        angle: 0
    },
    size: .35,
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
    following: player
};
let projectiles = [];

// Loading
let pageLoadStepsCompleted = 0;
function onPageLoadStepComplete() {
    pageLoadStepsCompleted++;
    if (pageLoadStepsCompleted != 2) {
        return;
    }

    document.getElementById("settings-language").value = config.lang;
    let translationsCSS = "";
    for (let key of Object.keys(translations)) {
        translationsCSS += "[trans='" + key + "']::after{content:'" + translations[key] + "'}";
    }
    document.getElementById("translations").innerHTML = translationsCSS;
    document.getElementById("settings-ui-scale-display").innerText = config.uiScale;
    document.getElementById("settings-ui-scale").value = [.4, .5, .6, .7, .8, .9, 1, 1.1, 1.2, 1.3, 1.4, 1.6, 1.8, 2].indexOf(config.uiScale);

    three.renderer = new threejs.WebGLRenderer({
        canvas: document.getElementById("canvas")
    });
    three.renderer.setSize(window.innerWidth, window.innerHeight);
    three.camera = new threejs.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 1e3);
    three.camera.position.y = 8;
    three.camera.rotation.x = -1.2;
    three.scene = new threejs.Scene();

    let assetsLoaded = 0;
    function onAssetLoadComplete() {
        if (++assetsLoaded == players.length) {
            frame();
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
}
function saveSettings() {
    localStorage.setItem("settings", JSON.stringify(config));
}
function loadSettings() {
    config = localStorage.getItem("settings") ? JSON.parse(localStorage.getItem("settings")) : {
        lang: "en_US",
        uiScale: closestFromList([.4, .5, .6, .7, .8, .9, 1, 1.1, 1.2, 1.3, 1.4, 1.6, 1.8, 2], Math.min(1, Math.min(window.innerWidth / 16, window.innerHeight / 9) / 35)),
        keybinds: {
            up: "W",
            right: "D",
            left: "A",
            down: "S",
            ability1: "Q",
            ability2: "E",
            ability3: "R",
            ability4: "T",
        }
    };
    fetch("lang/" + config.lang + ".json").then(r => r.text()).then(d => {
        translations = JSON.parse(d);
        onPageLoadStepComplete();
    });
}
loadSettings();
document.addEventListener("DOMContentLoaded", () => onPageLoadStepComplete());

// Input
let keys = {
    held: [],
    pressed: []
};
let mouse = {
    pos: {x: 0, y: 0},
    worldPos: {x: 0, y: 0},
    holdStartPos: {x: 0, y: 0},
    holdStartWorldPos: {x: 0, y: 0},
    dragOffset: {x: 0, y: 0},
    dragWorldOffset: {x: 0, y: 0},
    lastDragPositions: [],
    targetObject: undefined,
    held: {left: false, right: false},
    clicked: {left: false, right: false},
    scrolled: 0
};
let focused = isClient && document.hasFocus() ? now() : false;
if (isClient) {
    document.addEventListener("keydown", e => {
        let key = e.code;
        if (key.match(/^Key([A-Z])$/)) {
            key = key.slice(3);
        } else if (key.match(/^Digit([0-9])$/)) {
            key = key.slice(5);
        } else if (key == "Tab" || key == "Space" || key == "Enter") {
            e.preventDefault();
        }
        if (keys.held.indexOf(key) == -1) {
            keys.held.push(key);
            keys.pressed.push(key);
        }
    });
    document.addEventListener("keyup", e => {
        let key = e.code;
        if (key.match(/^Key([A-Z])$/)) {
            key = key.slice(3);
        } else if (key.match(/^Digit([0-9])$/)) {
            key = key.slice(5);
        }
        let index = keys.held.indexOf(key);
        if (index > -1) {
            keys.held.splice(index, 1);
        }
    });
    let onMouseDown = e => {
        if (focused - now() > -.01) {
            e.stopPropagation();
            return;
        }
        if (e.target == document.getElementById("canvas")) {
            if (e.button == 0 || e.button == 2) {
                mouse.held[e.button == 0 ? "left" : "right"] = true;
                mouse.holdStartPos.x = mouse.pos.x;
                mouse.holdStartPos.y = mouse.pos.y;
                mouse.holdStartWorldPos.x = mouse.worldPos.x;
                mouse.holdStartWorldPos.y = mouse.worldPos.y;
            }
        }
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("touchstart", e => onMouseDown({button: 0, target: e.target}));
    let onMouseUp = e => {
        if (e.button == 0 || e.button == 2) {
            mouse.held[e.button == 0 ? "left" : "right"] = false;
            if ((mouse.holdStartPos.x - mouse.pos.x) ** 2 + (mouse.holdStartPos.y - mouse.pos.y) ** 2 < 5 ** 2) {
                mouse.clicked[e.button == 0 ? "left" : "right"] = true;
            }
        }
    };
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchend", () => onMouseUp({button: 0}));
    let onMouseMove = e => {
        let dragging = (mouse.held.left || mouse.held.right) && (mouse.holdStartPos.x - mouse.pos.x) ** 2 + (mouse.holdStartPos.y - mouse.pos.y) ** 2 >= 10 ** 2;
        let newPos = {x: e.clientX, y: e.clientY};
        if (dragging) {
            mouse.dragOffset.x += newPos.x - mouse.pos.x;
            mouse.dragOffset.y += newPos.y - mouse.pos.y;
            while (mouse.lastDragPositions.length > 0 && mouse.lastDragPositions[0].t < now() - .1) {
                mouse.lastDragPositions.shift();
            }
            mouse.lastDragPositions.push(Object.assign({t: now()}, newPos));
        }
        let newWorldPos = {x: 0, y: 0};
        if (worldLoaded) {
            let raycaster = new threejs.Raycaster();
            raycaster.setFromCamera(new threejs.Vector2(newPos.x / window.innerWidth * 2 - 1, 1 - newPos.y / window.innerHeight * 2), three.camera);
            let intersects = raycaster.intersectObjects(three.scene.children, true);
            if (intersects.length > 0) {
                newWorldPos = {x: intersects[0].point.x, y: intersects[0].point.z};
            }
            mouse.targetObject = undefined;
            for (let intersect of intersects) {
                for (let p of players) {
                    for (let mesh of p.mesh.children) {
                        if (intersect.object == mesh) {
                            mouse.targetObject = p;
                            break;
                        }
                    }
                }
            }
            if (dragging) {
                let oldWorldPos = {x: 0, y: 0};
                raycaster.setFromCamera(new threejs.Vector2(mouse.pos.x / window.innerWidth * 2 - 1, 1 - mouse.pos.y / window.innerHeight * 2), three.camera);
                intersects = raycaster.intersectObjects(three.scene.children, true);
                if (intersects.length > 0) {
                    oldWorldPos = {x: intersects[0].point.x, y: intersects[0].point.z};
                }
                mouse.dragWorldOffset.x += newWorldPos.x - oldWorldPos.x;
                mouse.dragWorldOffset.y += newWorldPos.y - oldWorldPos.y;
            }
        }
        mouse.pos = newPos;
        mouse.worldPos = newWorldPos;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", e => onMouseMove({clientX: e.touches[0].clientX, clientY: e.touches[0].clientY}));
    document.addEventListener("contextmenu", e => e.preventDefault());
    window.addEventListener("focus", () => focused = now());
    window.addEventListener("blur", () => {
        keys.held = [];
        focused = false;
    });
    window.addEventListener("wheel", e => mouse.scrolled += e.deltaY > 0 ? 1 : -1);
}
function isKeyHeld(key) {
    return keys.held.indexOf(key) > -1;
}
function isKeyPressed(key) {
    return keys.pressed.indexOf(key) > -1;
}
function getDragVel() {
    while (mouse.lastDragPositions.length > 0 && mouse.lastDragPositions[0].t < now() - .1) {
        mouse.lastDragPositions.shift();
    }
    if (mouse.lastDragPositions.length == 0) {
        return {x: 0, y: 0};
    }
    let dragVel = {x: (mouse.pos.x - mouse.lastDragPositions[0].x) / 50, y: (mouse.pos.y - mouse.lastDragPositions[0].y) / 50};
    if (dragVel.x ** 2 + dragVel.y ** 2 > 15 ** 2) {
        let len = 1500 / Math.sqrt(dragVel.x ** 2 + dragVel.y ** 2);
        dragVel.x = Math.round(dragVel.x * len) / 100;
        dragVel.y = Math.round(dragVel.y * len) / 100;
    }
    mouse.lastDragPositions = [];
    return dragVel;
}
// Frame Loop
let lastFrameTimes = [];
let timeScale = .02;
let frameStats = "";
function frame() {
    frameStats = "";
    // Time
    let time = now();
    timeScale = (time - lastFrameTimes[lastFrameTimes.length - 1] || 0) * gameConfig.timeScale;
    lastFrameTimes.push(time);
    while (lastFrameTimes[0] < time - .99) {
        lastFrameTimes.shift();
    }
    frameStats += "FPS: " + lastFrameTimes.length + "<br>";
    // Graphics
    if (isClient) {
        three.renderer.setPixelRatio(window.devicePixelRatio);
        three.renderer.setSize(window.innerWidth, window.innerHeight);
        three.camera.aspect = window.innerWidth / window.innerHeight;
        three.camera.fov = Math.min(75, 400 / 3 * window.innerHeight / window.innerWidth);
        three.camera.updateProjectionMatrix();
    }
    // Camera
    if (isClient) {
        if (isKeyPressed("Space") || (mouse.clicked.left && (player ? mouse.targetObject == player : players.indexOf(mouse.targetObject) > -1) && !selectedAbility)) {
            if (player) {
                followCam(player);
            } else if (mouse.clicked.left) {
                followCam(mouse.targetObject);
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
        } else if ((isKeyPressed("W") || isKeyPressed("A") || isKeyPressed("S") || isKeyPressed("D") || (mouse.held.left && (mouse.dragOffset.x != 0 || mouse.dragOffset.y != 0))) && cam.following) {
            freeCam();
        }
        if (!cam.following) {
            if (mouse.held.left && (mouse.dragOffset.x != 0 || mouse.dragOffset.y != 0)) {
                cam.pos.x -= mouse.dragWorldOffset.x;
                cam.pos.y -= mouse.dragWorldOffset.y;
            } else if (!mouse.held.left) {
                let dragVel = getDragVel();
                cam.vel.x -= dragVel.x;
                cam.vel.y -= dragVel.y;
            }
            cam.move.speed = Math.max(2, Math.min(50, cam.move.speed + mouse.scrolled));
            let right = (isKeyHeld("D") ? 1 : 0) - (isKeyHeld("A") ? 1 : 0);
            let down = (isKeyHeld("S") ? 1 : 0) - (isKeyHeld("W") ? 1 : 0);
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
            let newPos = cam.following ? [cam.pos.x + cam.vel.x * velMult, cam.pos.y + cam.vel.y * velMult] : moveInOuterBounds(cam.pos.x + cam.vel.x * velMult, cam.pos.y + cam.vel.y * velMult, .35);
            if (cam.pos.x == newPos[0] && cam.pos.y == newPos[1]) {
                break;
            }
            cam.pos.x = newPos[0];
            cam.pos.y = newPos[1];
        }
    }
    // Controls
    if (isClient) {
        if (mouse.clicked.left && player && mouse.targetObject != player && !selectedAbility) {
            if (isInBounds(mouse.worldPos.x, mouse.worldPos.y, player.size)) {
                player.path = findPath(player.pos, mouse.worldPos, player.size);
            }
        } else if (mouse.clicked.left && selectedAbility) {
            useAbility(player, selectedAbility, mouse.worldPos);
        }
        for (let i = 0; i < player.abilities.length; i++) {
            if (isKeyPressed(config.keybinds["ability" + (i + 1)])) {
                console.log("Ability " + (i + 1) + " " + player.abilities[i].name + " " + config.keybinds["ability" + (i + 1)] + " used!");
                useAbility(player, player.abilities[i].name, mouse.worldPos);
            }
        }
    }
    // Clear Inputs
    if (isClient) {
        if (mouse.clicked.left) {
            selectedAbility = undefined;
        }
        keys.pressed = [];
        mouse.dragOffset = {x: 0, y: 0};
        mouse.dragWorldOffset = {x: 0, y: 0};
        mouse.clicked = {left: false, right: false};
        mouse.scrolled = 0;
    }
    // Players
    for (let p of players) {
        if (p.path) {
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
            let newPos = p.move.noCol ? [p.pos.x + p.vel.x * velMult, p.pos.y + p.vel.y * velMult] : moveInBounds(p.pos.x + p.vel.x * velMult, p.pos.y + p.vel.y * velMult, p.size);
            if (p.pos.x == newPos[0] && p.pos.y == newPos[1]) {
                break;
            }
            p.pos.x = newPos[0];
            p.pos.y = newPos[1];
        }
        if (p.vel.x * p.vel.x + p.vel.y * p.vel.y > 1e-6) {
            p.vel.angle = Math.atan2(-p.vel.x, -p.vel.y);
        }
        if (isClient) {
            p.mesh.rotation.y = stepAngle(p.mesh.rotation.y, p.vel.angle, 5 * timeScale);
            p.mesh.position.x = p.pos.x;
            p.mesh.position.z = p.pos.y;
        }
    }
    let camPos = {x: cam.following ? cam.following.pos.x + cam.pos.x : cam.pos.x, y: cam.following ? cam.following.pos.y + cam.pos.y : cam.pos.y};
    frameStats += "X: " + camPos.x.toFixed(2) + "<br>Y: " + camPos.y.toFixed(2) + "<br>";
    frameStats += (isInBounds(camPos.x, camPos.y) || !isInOuterBounds(camPos.x, camPos.y) ? "In" : "Out Of") + " Bounds<br>";
    // Projectiles
    for (let i = 0; i < projectiles.length; i++) {
        let proj = projectiles[i];
        proj.pos.x += proj.vel.x * timeScale;
        proj.pos.y += proj.vel.y * timeScale;
        proj.mesh.position.x = proj.pos.x;
        proj.mesh.position.z = proj.pos.y;
        if (proj.type == "fireball") {
            let explode = false;
            if (!isInBounds(proj.pos.x, proj.pos.y, proj.size)) {
                explode = true;
            }
            for (p of players) {
                if (p.id == proj.summoner) {
                    continue;
                }
                if ((p.pos.x - proj.pos.x) ** 2 + (p.pos.y - proj.pos.y) ** 2 < (p.size + proj.size) ** 2) {
                    explode = true;
                }
            }
            if (explode) {
                for (p of players) {
                    if (p.id == proj.summoner) {
                        continue;
                    }
                    if ((p.pos.x - proj.pos.x) ** 2 + (p.pos.y - proj.pos.y) ** 2 < (proj.explosion.size + p.size + proj.size) ** 2) {
                        let damage = Math.min(proj.explosion.size, proj.explosion.size + p.size + proj.size - Math.sqrt((p.pos.x - proj.pos.x) ** 2 + (p.pos.y - proj.pos.y) ** 2)) / proj.explosion.size * proj.explosion.damage;
                        p.health -= damage;
                        p.damageTaken += damage;
                    }
                }
                let explosion = {
                    type: "explosion",
                    pos: proj.pos,
                    vel: {x: 0, y: 0},
                    size: .2,
                    maxSize: proj.explosion.size,
                    speed: proj.explosion.size * 4,
                    id: genID(),
                    summoner: player.id,
                    mesh: new threejs.Mesh(new threejs.SphereGeometry(1, 32, 32), new threejs.MeshBasicMaterial({color: 0xFFBB00}))
                };
                projectiles.push(explosion);
                explosion.mesh.position.y = 0;
                three.scene.add(explosion.mesh);
                three.scene.remove(proj.mesh);
                projectiles.splice(i--, 1);
                continue;
            }
        }
        if (proj.type == "explosion") {
            proj.size += timeScale * proj.speed;
            let scale = (proj.size / proj.maxSize) ** .5 * proj.maxSize;
            proj.mesh.scale.set(scale, scale, scale);
            if (proj.size >= proj.maxSize) {
                three.scene.remove(proj.mesh);
                projectiles.splice(i--, 1);
                continue;
            }
        }
    }
    // Frame
    if (isClient) {
        three.camera.position.x = cam.following ? cam.following.pos.x + cam.pos.x : cam.pos.x;
        three.camera.position.z = (cam.following ? cam.following.pos.y + cam.pos.y : cam.pos.y) + 3.11;
        three.renderer.render(three.scene, three.camera);
    }
    // UI
    if (isClient && player) {
        for (let i = 0; i < document.getElementById("hotbar-abilities").children.length; i++) {
            let ability = abilities[document.getElementById("hotbar-abilities").children[i].getAttribute("ability")];
            let cooldown = Math.max(0, player.abilities[i].lastUse + ability.cooldown - now()) / ability.cooldown;
            document.getElementById("hotbar-abilities").children[i].style = cooldown == 0 ? "--cooldown: #0000;" : "--cooldown: linear-gradient(to bottom, #0008 0%, #0008 " + Math.ceil(1000 * cooldown) / 10 + "%, #0000 " + Math.ceil(1000 * cooldown) / 10 + "%, #0000 100%);";
        }
        player.damageTaken = Math.max(0, player.damageTaken - timeScale * 50);
        frank.damageTaken = Math.max(0, frank.damageTaken - timeScale * 50);
        document.body.setAttribute("style", "--ui-scale:" + config.uiScale);
        setInnerHTML(document.querySelector("#hotbar-health-bar"), generateColoredBarSVG("health-bar", [{fromColor: "#3AB300", toColor: "#216600", width: Math.max(0, player.health) / 100}, {fromColor: "#CCCC00", toColor: "#808000", width: Math.max(0, player.damageTaken) / 100}], Math.round(Math.max(0, player.health)) + "%", 480).innerHTML);
        setInnerHTML(document.querySelector("#hotbar-health-bar-frank"), generateColoredBarSVG("health-bar-frank", [{fromColor: "#3AB300", toColor: "#216600", width: Math.max(0, frank.health) / 100}, {fromColor: "#CCCC00", toColor: "#808000", width: Math.max(0, frank.damageTaken) / 100}], Math.round(Math.max(0, frank.health)) + "%", 480).innerHTML);
    }
    // Info Text
    if (isClient) {
        setInnerHTML(document.getElementById("frame-stats"), frameStats.substring(0, frameStats.length - 4));
    }
    // Next Frame
    requestAnimationFrame(frame);
}

// Utils
function genID() {
    return Math.round(Math.random() * 4294967296);
}
function stepAngle(angle, targetAngle, stepSize) {
    let diff = targetAngle - angle;
    angle += Math.max(-stepSize, Math.min(stepSize, diff > Math.PI || diff < -Math.PI ? -diff : diff));
    if (angle > Math.PI) {
        return angle - 2 * Math.PI;
    } else if (angle < -Math.PI) {
        return angle + 2 * Math.PI;
    } else {
        return angle;
    }
}
function setInnerHTML(element, html) {
    if (element.innerHTML != html) {
        element.innerHTML = html;
    }
}
function closestFromList(l, n) {
    return l.reduce((p, c) => Math.abs(c - n) < Math.abs(p - n) ? c : p);
}
function now() {
    return Math.round(performance.now() * 10) / 10000;
}

// Camera
function followCam(p) {
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
}
function freeCam() {
    if (cam.following) {
        cam.pos.x += cam.following.pos.x;
        cam.pos.y += cam.following.pos.y;
        cam.vel.x = 0;
        cam.vel.y = 0;
        cam.following = undefined;
    }
}

// Path Finding
function findPath(f, t, r) {
    let paths = [{x: f.x, y: f.y, dist: 0, path: [[f.x, f.y]]}];
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
                [path.x, path.y, line] = moveInBounds(nx, ny, r - 1e-4);
                path.path.push([path.x, path.y]);
                break;
            }
        }
        if (!line) {
            path.dist += Math.sqrt((x - t.x) ** 2 + (y - t.y) ** 2);
            if (!foundPath || path.dist < foundPath.dist) {
                path.path.push([t.x, t.y]);
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
                            pos2 = [bounds[j][k] + bounds[j][9] * r, bounds[j][k + 1] + bounds[j][10] * r];
                            cl = j;
                            cd = (bounds[j][k] - bounds[line][i]) ** 2 + (bounds[j][k + 1] - bounds[line][i + 1]) ** 2;
                        }
                    }
                }
            }
            if (!explored.includes(cl)) {
                let pos1 = [bounds[line][i] + bounds[line][9] * r, bounds[line][i + 1] + bounds[line][10] * r];
                let dist = path.dist + Math.sqrt((path.x - pos1[0]) ** 2 + (path.y - pos1[1]) ** 2) + Math.sqrt((pos1[0] - pos2[0]) ** 2 + (pos1[1] - pos2[1]) ** 2);
                if (!foundPath || dist < foundPath.dist) {
                    let newSteps = path.path.slice();
                    newSteps.push(pos1, pos2);
                    let newPath = {x: pos2[0], y: pos2[1], dist: path.dist + Math.sqrt((path.x - pos1[0]) ** 2 + (path.y - pos1[1]) ** 2) + Math.sqrt((pos1[0] - pos2[0]) ** 2 + (pos1[1] - pos2[1]) ** 2), path: newSteps, line: cl};
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
            let steps = Math.ceil(Math.sqrt((path[i][0] - path[i + 1][0]) ** 2 + (path[i][1] - path[i + 1][1]) ** 2) / r);
            if (steps < 2) {
                continue;
            }
            let nx = (path[i + 1][0] - path[i][0]) / steps;
            let ny = (path[i + 1][1] - path[i][1]) / steps;
            for (let j = 1; j < steps; j++) {
                path.splice(i + j, 0, moveInBounds(path[i][0] + nx * j, path[i][1] + ny * j, r));
            }
            i += steps - 1;
        }
        for (let i = path.length; i > 2; i--) {
            for (let j = 0; j < i - 1; j++) {
                if (isLineInBounds(path[j][0], path[j][1], path[i - 1][0], path[i - 1][1], r * .99)) {
                    path.splice(j + 1, i - j - 2);
                    i = j + 2;
                    break;
                }
            }
        }
        let steps = [];
        for (let i = 1; i < path.length; i++) {
            steps.push({x: path[i][0], y: path[i][1]});
        }
        return steps;
    }
    console.warn("Could not find a path from " + f.x + " " + f.y + " to " + t.x + " " + t.y + (paths.length > 0 ? " because it is too complex!" : " because there is none!"));
    return [];
}

// World, Bounds & Other Stuff
let worldLoaded = false;
let bounds = [ /* [0: x1, 1: y1, 2: x2, 3: y2, 4: xDiff, 5: yDiff, 6: yDiff / xDiff, 7: length, 8: lengthSquared, 9: normalX, 10: normalY] */ ];
let outerBounds = [];
function loadWorld(world) {
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
}
function isInBounds(x, y, r = 0) {
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
}
function moveInBounds(x, y, r = 0, forceInbounds = false) {
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
            return [x, y];
        } else if (e) {
            let d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            nx = (x - cx) / d;
            ny = (y - cy) / d;
        }
        x = cx + nx * r;
        y = cy + ny * r;
        // return c && o ? [x, y] : [cx + (e ? (x - cx) / Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) : nx) * r, cy + (e ? (y - cy) / Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) : ny) * r];
    }
    return [x, y, cl];
}
function isLineInBounds(x1, y1, x2, y2, r = 0) {
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
}
function isInOuterBounds(x, y) {
    let c = false;
    let p = false;
    for (let l of outerBounds) {
        if (((l[0] >= x && l[2] <= x) || (l[0] <= x && l[2] >= x)) && (l[6] * x + l[1] - l[6] * l[0] < y) && ((x == l[0] || x == l[2]) ? (p = !p) : true)) {
            c = !c;
        }
    }
    return c;
}
function moveInOuterBounds(x, y) {
    if (isInOuterBounds(x, y)) {
        return [x, y];
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
    return [cx, cy];
}

// UI
function generateColoredBarSVG(id, colors, text, width = 100, height = 22, borderWidth = 2, borderRadius = 3) {
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

}

// Settings
function openSettings() {
    document.getElementById("settings").removeAttribute("hidden");
}
function closeSettings() {
    document.getElementById("settings").setAttribute("hidden", "");
    saveSettings();
}
function selectSettingsTab(tab) {
    document.querySelectorAll("#settings-tabs button").forEach(e => e.removeAttribute("selected"));
    document.getElementById("settings-tab-" + tab).setAttribute("selected", "");
    document.querySelectorAll(".settings-options").forEach(e => e.setAttribute("hidden", ""));
    document.getElementById("settings-options-" + tab).removeAttribute("hidden");
}
// Settings - Language
function selectLanguage(lang) {
    fetch("lang/" + (config.lang = lang) + ".json").then(r => r.text()).then(d => {
        translations = JSON.parse(d);
        let translationsCSS = "";
        for (let key of Object.keys(translations)) {
            translationsCSS += "[trans='" + key + "']::after{content:'" + translations[key] + "'}";
        }
        document.getElementById("translations").innerHTML = translationsCSS;
    });
}

// Abilities
function useAbility(p, ability, position) {
    // Calculate Mouse Location
    let direction = {x: position.x - p.pos.x, y: position.y - p.pos.y};
    direction.d = Math.sqrt(direction.x ** 2 + direction.y ** 2);
    direction.nX = direction.x / direction.d;
    direction.nY = direction.y / direction.d;
    direction.a = Math.atan2(direction.y, direction.x);
    // Handle Abilities
    let abilityIndex = p.abilities.findIndex(a => a.name == ability);
    if (p.abilities[abilityIndex].lastUse + abilities[ability].cooldown > now()) {
        return;
    } else {
        p.abilities[abilityIndex].lastUse = now();
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
                damage: 20
            },
            id: genID(),
            summoner: p.id,
            mesh: new threejs.Mesh(new threejs.SphereGeometry(.2, 16, 16), new threejs.MeshBasicMaterial({color: 0xFFDD00}))
        };
        projectiles.push(fireball);
        fireball.mesh.position.y = 0;
        three.scene.add(fireball.mesh);
    }
}

// Debugging
function markPos(x, y, c = 0xFFDD00, r = .2) {
    let mesh = new threejs.Mesh(new threejs.SphereGeometry(r, 16, 16), new threejs.MeshBasicMaterial({color: c}));
    mesh.position.x = x;
    mesh.position.y = 0;
    mesh.position.z = y;
    three.scene.add(mesh);
}
