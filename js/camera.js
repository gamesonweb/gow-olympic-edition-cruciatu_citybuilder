export function createCamera(scene, canvas, engine) {
    var camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 50, -200), scene);
    camera.rotation.y = Math.PI / 10;

    // Initialiser les touches par défaut (AZERTY)
    camera.keysUp.push('z'.charCodeAt(0), 'Z'.charCodeAt(0)); // "z" pour avancer
    camera.keysDown.push('s'.charCodeAt(0), 'S'.charCodeAt(0)); // "s" pour reculer
    camera.keysLeft.push('q'.charCodeAt(0), 'Q'.charCodeAt(0)); // "q" pour aller à gauche
    camera.keysRight.push('d'.charCodeAt(0), 'D'.charCodeAt(0)); // "d" pour aller à droite

    camera.speed = 2;
    camera.attachControl(canvas, true);

    let isSpacePressed = false;
    let isShiftPressed = false;
    const cameraLiftSpeed = 0.05;

    // Evénements pour les touches espace et shift
    window.addEventListener("keydown", function (event) {
        switch (event.code) {
            case "Space": // Espace pour monter
                isSpacePressed = true;
                break;
            case "ShiftLeft": // Shift pour descendre
            case "ShiftRight":
                isShiftPressed = true;
                break;
        }
    });

    window.addEventListener("keyup", function (event) {
        switch (event.code) {
            case "Space": // Espace pour monter
                isSpacePressed = false;
                break;
            case "ShiftLeft": // Shift pour descendre
            case "ShiftRight":
                isShiftPressed = false;
                break;
        }
    });

    // Mise à jour la position de la caméra à chaque image
    scene.registerBeforeRender(function () {
        const deltaTime = engine.getDeltaTime();

        if (isSpacePressed) {
            camera.position.y += cameraLiftSpeed * deltaTime;
        }

        if (isShiftPressed) {
            camera.position.y -= cameraLiftSpeed * deltaTime;
        }
    });

    // Détection de la disposition du clavier
    window.addEventListener("keydown", function (event) {
        if (event.key === 'a') {
            // Si 'a' est pressé et que keyCode est 65, c'est probablement QWERTY
            if (event.keyCode === 65) {
                // Remplacer les touches pour QWERTY
                camera.keysUp = ['w'.charCodeAt(0), 'W'.charCodeAt(0)]; // "w" pour avancer
                camera.keysLeft = ['a'.charCodeAt(0), 'A'.charCodeAt(0)]; // "a" pour aller à gauche
                camera.keysRight = ['d'.charCodeAt(0), 'D'.charCodeAt(0)]; // "d" pour aller à droite
                window.removeEventListener('keydown', arguments.callee); // Supprimer le listener une fois la disposition détectée
            }
        } else if (event.key === 'q') {
            // Si 'q' est pressé et que keyCode est 65, c'est probablement AZERTY
            if (event.keyCode === 81) {
                // Remplacer les touches pour AZERTY
                camera.keysUp = ['z'.charCodeAt(0), 'Z'.charCodeAt(0)]; // "z" pour avancer
                camera.keysLeft = ['q'.charCodeAt(0), 'Q'.charCodeAt(0)]; // "q" pour aller à gauche
                camera.keysRight = ['d'.charCodeAt(0), 'D'.charCodeAt(0)]; // "d" pour aller à droite
                window.removeEventListener('keydown', arguments.callee); // Supprimer le listener une fois la disposition détectée
            }
        }
    });

    return camera;
}