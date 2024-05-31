import MaterialManager from "./materialManager.js";
import Pnj from "./pnj.js";
import Tree from "./tree.js";
import {
    createCamera
} from "./camera.js";

var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true);
var scene = new BABYLON.Scene(engine);

// Création du gestionnaire de matériaux
var materialManager = new MaterialManager(scene);
//display debug layer
//scene.debugLayer.show();

var camera = createCamera(scene, canvas, engine);

var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

BABYLON.SceneLoader.ImportMesh("", "assets/buildings/colossus.glb", "", scene, function (meshes) {
    var colossus = meshes[0];
    colossus.position = new BABYLON.Vector3(250, -20, 80);
    colossus.scaling = new BABYLON.Vector3(80, 80, 80);
});

// import de la carte
/*
BABYLON.SceneLoader.ImportMesh("", "assets/map/Map1.glb", "", scene, function (map) {
    map[0].position = new BABYLON.Vector3(-80, 0, 0);
    map[0].scaling = new BABYLON.Vector3(5, 5, 5);
});
*/

// Ground
var groundTexture = new BABYLON.Texture("assets/textures/water.png", scene);
groundTexture.vScale = groundTexture.uScale = 4.0;
var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
groundMaterial.diffuseTexture = groundTexture;
var ground = BABYLON.Mesh.CreateGround("ground", 1000, 1000, 32, scene, false);
ground.material = groundMaterial;
ground.position.y = -5;

const map = BABYLON.MeshBuilder.CreateGroundFromHeightMap("", "assets/map/map.png", {
    width: 600,
    height: 600,
    subdivisions: 300,
    maxHeight: 100
});
map.position.y = -55;
map.material = materialManager.getMaterial("darkGreenMaterial");

// Water
var waterMesh = BABYLON.Mesh.CreateGround("waterMesh", 1000, 1000, 32, scene, false);
var water = new BABYLON.WaterMaterial("water", scene, new BABYLON.Vector2(1024, 1024));
water.backFaceCulling = true;
water.bumpTexture = new BABYLON.Texture("assets/textures/waterbump.jpg", scene);
water.windForce = -5;
water.waveHeight = 0.5;
water.bumpHeight = 0.1;
water.waveLength = 0.1;
water.colorBlendFactor = 0;
water.addToRenderList(ground);
waterMesh.material = water;
waterMesh.position.y = -4.9;

/**pnj */
var pnj;
/**Liste des pnj */
var pnjs = [];


// Matériaux pour différents types de bâtiments
//var houseMaterial = new BABYLON.StandardMaterial("houseMaterial", scene);
//houseMaterial.diffuseTexture = new BABYLON.Texture("../assets/textures/house.jpg", scene);
var buildingMaterial = new BABYLON.StandardMaterial("buildingMaterial", scene);
buildingMaterial.diffuseTexture = new BABYLON.Texture("assets/textures/building.jpg", scene);

/**taille du batiment */
var houseSize = 15;
/**type de batiment selectionne */
var selectedBuildingType = "building";
/**Nombres de cellules du plateau */
var numCells = 25;
/**positions occupees par des batiments */
var occupiedPositions = [];
/**suppresion de structure */
var deleteMode = false;

var population = 0;
var gold = 50;

/**nombre d'arbres */
var numberTrees = 10;
var wood = 0;

// arbres
let treeInstance = new Tree(scene, numberTrees);


//taux de production d'or par taille de batiment
var goldProductionRates = {
    5: 1, // batiment de taille 5 : +1 or par seconde
    15: 3 //batiment de taille 15 : +3 or par seconde
};

// Boutons pour changer la taille des batiments
var buildingButton = document.getElementById("buildingButton");
buildingButton.addEventListener("click", function () {
    houseSize = 15; // Taille pour les bâtiments
    selectedBuildingType = "building"; // Définit le type comme bâtiment
    deleteMode = false;
    console.log("Building Mode");
});

var houseButton = document.getElementById("houseButton");
houseButton.addEventListener("click", function () {
    houseSize = 5; // Taille pour les maisons
    selectedBuildingType = "house"; // Définit le type comme maison
    deleteMode = false;
    console.log("House Mode");
});
var treeButton = document.getElementById("treeButton");
treeButton.addEventListener("click", function () {
    deleteMode = 'cutting';

    scene.onPointerDown = function (evt, pickResult) {
        if (pickResult.hit && pickResult.pickedMesh.name.startsWith("tree")) {
            var selectedTree = pickResult.pickedMesh;
            cutTree(selectedTree);
        }
    }
});

var deleteButton = document.getElementById("deleteButton");
deleteButton.addEventListener("click", function () {
    deleteMode = true;
    console.log("Delete Mode");
    //event pour supprimer un batiment
    scene.onPointerDown = function (evt, pickResult) {
        if (deleteMode && pickResult.hit && pickResult.pickedMesh.name.startsWith("building_") || pickResult.pickedMesh.name.startsWith("house_")) {
            var selectedBuilding = pickResult.pickedMesh;
            deleteHouse(selectedBuilding);
        }
    }
});

/**  Mise à jour de l'affichage de l'or*/
function updateGoldDisplay() {
    document.getElementById("gold").innerText = "Or: " + gold;
}
/**Mise à jour de l'affichage du bois */
function updateWoodDisplay() {
    document.getElementById("wood").innerText = "Bois: " + wood;
}

/**Couper un arbre et ajouter le bois recupere*/
function cutTree(tree) {
    tree.dispose();

    //random entre 1 et 5
    var woodAmount = Math.floor(Math.random() * 5) + 1;
    wood += woodAmount;
    updateWoodDisplay();

    // Supprimer l'arbre de la liste
    const index = treeInstance.trees.indexOf(tree);
    if (index > -1) {
        treeInstance.trees.splice(index, 1);
    }

    // Programmez la création d'un nouvel arbre après la suppression de cet arbre
    setTimeout(function () {

        let newTree = treeInstance.createTree();


        //particules lors de la creation d'un arbre
        var smoke = createSmokeParticles(new BABYLON.Vector3(newTree.position.x, newTree.position.y, newTree.position.z),"tree");
        smoke.start();
        setTimeout(function () {
            smoke.stop();
        }, 50);

    }, 30000);

}

/**Creer des particules de fumée 
 * @param {BABYLON.Vector3} position - Position de la fumée
 */
function createSmokeParticles(position,type) {
    var particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);
    particleSystem.particleTexture = new BABYLON.Texture("assets/textures/smoke.jpg", scene);

    particleSystem.emitter = position;
    var emitBoxSize = houseSize / 2;
    particleSystem.minEmitBox = new BABYLON.Vector3(-emitBoxSize, 0, -emitBoxSize);
    particleSystem.maxEmitBox = new BABYLON.Vector3(emitBoxSize, 0, emitBoxSize);
    if (type == "house") {
    particleSystem.color1 = new BABYLON.Color4(1, 1, 1, 1); // Blanc
    particleSystem.color2 = new BABYLON.Color4(1, 1, 1, 1); // Blanc
    }
    else {
    particleSystem.color1 = new BABYLON.Color4(1, 0.5, 0, 1);
    particleSystem.color2 = new BABYLON.Color4(1, 0.5, 0, 1);
    }
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.1); // Transparence

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.5;

    particleSystem.maxLifeTime = 0.3;

    particleSystem.emitRate = 1000;

    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;

    particleSystem.direction1 = new BABYLON.Vector3(-1, 8, -1);
    particleSystem.direction2 = new BABYLON.Vector3(1, 8, 1);

    particleSystem.minEmitPower = 0.5;
    particleSystem.maxEmitPower = 1;
    particleSystem.updateSpeed = 0.005;
    return particleSystem;
}

/**Fonction pour créer le plateau
 * @param {int} boardSize - Taille du plateau
 */
function createBoard(boardSize) {
    for (var x = 0; x < boardSize; x++) {
        for (var z = 0; z < boardSize; z++) {
            var cell = BABYLON.MeshBuilder.CreateBox("cell_" + x + "_" + z, {
                size: 5,
                height: 0.5
            }, scene);
            cell.position.x = (x - 12) * 5;
            cell.position.y = 0;
            cell.position.z = (z - 12) * 5;
            if ((x + z) % 2 !== 0) {
                cell.material = materialManager.getMaterial("lightGreenMaterial");
            } else {
                cell.material = materialManager.getMaterial("darkGreenMaterial");
            }
        }
    }
}


/**Ajout de l'action de cliquer sur chaque cellule du plateau
 * @param {int} numCells - Nombre de cellules du plateau
 */
function addClickActionToCells(numCells) {
    for (var x = 0; x < numCells; x++) {
        for (var z = 0; z < numCells; z++) {
            var cellName = "cell_" + x + "_" + z;
            var cell = scene.getMeshByName(cellName);

            cell.actionManager = new BABYLON.ActionManager(scene);
            cell.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function (evt) {
                var pickedMesh = evt.meshUnderPointer;
                if (pickedMesh && pickedMesh.name.startsWith("cell")) {
                    var coords = pickedMesh.name.split("_").slice(1);
                    var x = parseInt(coords[0]);
                    var z = parseInt(coords[1]);
                    if (!deleteMode) {
                        addHouse(x, z, selectedBuildingType);
                    }
                }
            }));
        }
    }
}



/**ajout d'une maison 
 * @param {int} x - position x du batiment
 * @param {int} z - position z du batiment
 * @param {string} type - type de batiment
 */
function addHouse(x, z, type) {
    var newPosX = (x - 12) * 5;
    var newPosZ = (z - 12) * 5;

    if (isBuildingPositionValid(x, z) && gold > 0) {
        var buildingName = type === "building" ? "building_" : "house_";
        var house = BABYLON.MeshBuilder.CreateBox(buildingName + x + "_" + z, {
            size: houseSize
        }, scene);
        house.position.x = newPosX;
        house.position.y = 1.5;
        house.position.z = newPosZ;
        //On utilise darkGreenMaterial pour les buildings et purpleMaterial pour les houses
        house.material = type === "building" ? materialManager.getMaterial("darkGreenMaterial") : materialManager.getMaterial("purpleMaterial");
        //Si c'est un building alors on enlève 20 d'or, si c'est une house alors on enlève 10 d'or
        gold -= type === "building" ? 20 : 10;
        updateGoldDisplay();
        var productionIntervalId = startGoldProduction(houseSize);
        house.productionIntervalId = productionIntervalId;
        //particules lors de la creation d'un batiment
        var smoke = createSmokeParticles(new BABYLON.Vector3(house.position.x, house.position.y + houseSize / 2, house.position.z),"house");
        smoke.start();
        setTimeout(function () {
            smoke.stop();
        }, 50);

        //creation d'un pnj
        BABYLON.SceneLoader.ImportMesh("", "assets/pnj/pnj.glb", "", scene, function (meshes) {
            var model = meshes[0];
            pnj = new Pnj(scene, model, house.position);
            // Ajoutez le nouveau PNJ au tableau
            pnjs.push(pnj);
            population += 1;
            document.getElementById("population").innerText = "Population : " + population;
        });


    } else {
        console.log("Impossible de placer la construction ici en raison de la zone d'exclusion.");
    }

}

function deleteHouse(house) {
    stopGoldProduction(house.productionIntervalId);
    var index = occupiedPositions.findIndex(function (occupiedBuilding) {
        return occupiedBuilding.position.equals(house.position);
    });
    if (index != -1) {
        occupiedPositions.splice(index, 1);
    }
    house.dispose();
}


function startGoldProduction(houseSize) {
    var productionRate = goldProductionRates[houseSize];
    if (productionRate != undefined) {
        return setInterval(function () {
            gold += productionRate;
            updateGoldDisplay();
        }, 1000);
    }
}

function stopGoldProduction(intervalId) {
    clearInterval(intervalId);
}


//el fuego
/*
BABYLON.ParticleHelper.CreateAsync("fire", scene).then((set) => {
    set.systems.forEach((s) => {
        //modifier la position du feu
        s.emitter = new BABYLON.Vector3(-50, 30, 0);
    });

    set.start();
});*/



/**mise a jour de la zone de selection 
 * @param {int} x - position x de la zone de selection
 * @param {int} z - position z de la zone de selection
 */
function updateHighlightCube(x, z) {
    // suppression de la zone de selection precedente si elle existe
    removeHighlightCube();

    // creer une nouvelle zone de selection
    var highlightCube = BABYLON.MeshBuilder.CreateBox("highlightCube", {
        size: houseSize,
        height: 0.5
    }, scene);

    highlightCube.position.x = (x - 12) * 5;
    highlightCube.position.y = 0.5; //au dessus du sol
    highlightCube.position.z = (z - 12) * 5;

    // Vérification de la possibilité d'ajouter un bâtiment à cette position
    var isPossibleToAddBuilding = isBuildingPositionValid(x, z);

    // Définir la couleur en fonction de la possibilité d'ajouter un bâtiment
    if (isPossibleToAddBuilding) {
        highlightCube.material = materialManager.getMaterial("greenMaterial");
    } else {
        highlightCube.material = materialManager.getMaterial("redMaterial");
    }

    var afterRenderFunction = function () {
        removeHighlightCube();
        scene.unregisterAfterRender(afterRenderFunction); // Désenregistre la fonction after render après l'avoir exécutée une fois
    };

    scene.registerAfterRender(afterRenderFunction);
}

/** Supprimer la zone de selection*/
function removeHighlightCube() {
    var highlightCube = scene.getMeshByName("highlightCube");
    if (highlightCube) {
        highlightCube.dispose();
    }
}

/** Vérifier si la position est valide pour ajouter un bâtiment 
 * @param {int} x - position x
 * @param {int} z - position z
 */
function isBuildingPositionValid(x, z) {
    var newPosX = (x - 12) * 5;
    var newPosZ = (z - 12) * 5;

    var canPlaceBuilding = true;

    // Vérifiez toutes les constructions existantes pour les zones d'exclusion
    for (var i = 0; i < scene.meshes.length; i++) {
        var mesh = scene.meshes[i];
        if (mesh.name.startsWith("building_") || mesh.name.startsWith("house_")) {
            var existingPosX = mesh.position.x;
            var existingPosZ = mesh.position.z;

            var distanceX = Math.abs(newPosX - existingPosX);
            var distanceZ = Math.abs(newPosZ - existingPosZ);

            // Déterminez la distance d'exclusion en prenant la plus grande valeur pour les constructions concernées
            var exclusionDistanceNew = selectedBuildingType === "building" ? 20 : 10; // La distance d'exclusion pour la nouvelle construction
            var exclusionDistanceExisting = mesh.name.startsWith("building_") ? 20 : 10; // La distance pour la construction existante
            var requiredDistance = Math.max(exclusionDistanceNew, exclusionDistanceExisting);

            // Si la nouvelle construction est dans la zone d'exclusion d'une construction existante, on ne peut pas la placer
            if (distanceX < requiredDistance && distanceZ < requiredDistance) {
                canPlaceBuilding = false;
                break;
            }
        }
    }
    return canPlaceBuilding;
}

updateGoldDisplay()
// Création du plateau
createBoard(numCells);
// Ajout de l'action de cliquer sur chaque cellule du plateau
addClickActionToCells(numCells);
// Commencez à créer des arbres
treeInstance.startCreatingTrees();


engine.runRenderLoop(function () {
    // position de la souris
    var pickResult = scene.pick(scene.pointerX, scene.pointerY);

    // creation/maj de la zone de selection
    if (pickResult.hit && pickResult.pickedMesh.name.startsWith("cell")) {
        var coords = pickResult.pickedMesh.name.split("_").slice(1);
        var x = parseInt(coords[0]);
        var z = parseInt(coords[1]);
        updateHighlightCube(x, z);
    } else {
        removeHighlightCube();
    }


    // maj PNJ
    for (var i = 0; i < pnjs.length; i++) {
        pnjs[i].update();
    }


    scene.render();
});

// redimensionnement de la fenêtre
window.addEventListener("resize", function () {
    engine.resize();
});