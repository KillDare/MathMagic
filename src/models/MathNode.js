export class MathNode {

    constructor(type, options = {}) {

        this.id = options.id ?? crypto.randomUUID();

        this.type = type;

        this.value = options.value ?? null;

        this.children = options.children ?? [];
    }


    // =========================================================
    // Filhos
    // =========================================================

    addChild(node) {

        this.children.push(node);

        return node;
    }


    removeChild(node) {

        const index = this.children.indexOf(node);

        if (index !== -1) {
            this.children.splice(index, 1);
        }

        return node;
    }


    getChild(index) {

        return this.children[index] ?? null;
    }


    setChild(index, node) {

        this.children[index] = node;

        return node;
    }


    // =========================================================
    // Informações
    // =========================================================

    hasChildren() {

        return this.children.length > 0;
    }


    isLeaf() {

        return this.children.length === 0;
    }
}