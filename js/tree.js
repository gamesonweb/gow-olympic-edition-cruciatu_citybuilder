export default class tree {
    constructor(scene, numberTrees) {
        this.scene = scene;
        this.numberTrees = numberTrees;
        this.trees = [];

    }
    createTrees() {
        this.trees = [];
        for (let i = 0; i < this.numberTrees; i++) {
            if (this.trees.length < this.numberTrees) {
                this.createTree();
            }
        }
    }
    createTree() {
        let tree = BABYLON.MeshBuilder.CreateCylinder("tree", {
            diameter: 3,
            height: 10
        }, this.scene);
        tree.position.x = Math.random() * 100 - 50;
        tree.position.z = Math.random() * 100 - 50;
        let material = new BABYLON.StandardMaterial("material", this.scene);
        material.diffuseColor = new BABYLON.Color3(0, 0, 0.5);
        tree.material = material;
        this.trees.push(tree);
        return tree;
    }


    startCreatingTrees() {
        this.createTrees(); // créer les arbres initiaux
    }

}