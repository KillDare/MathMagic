export class ExpressionController {

    constructor(
        expression,
        renderer,
        container
    ) {

        this.expression = expression;

        this.renderer = renderer;

        this.container = container;


        this.bindEvents();
    }


    // =========================================================
    // Eventos
    // =========================================================

    bindEvents() {

        this.container.addEventListener(
            "click",
            event => this.handleClick(event)
        );


        document.addEventListener(
            "keydown",
            event => this.handleKeyDown(event)
        );
    }


    // =========================================================
    // Clique
    // =========================================================

    handleClick(event) {

        const element =
            event.target.closest(
                "[data-node-id]"
            );


        if (
            !element ||
            !this.container.contains(
                element
            )
        ) {

            return;
        }


        this.selectNode(
            element.dataset.nodeId
        );
    }


    // =========================================================
    // Seleção
    // =========================================================

    selectNode(nodeId) {

        const node =
            this.expression.selectNode(
                nodeId
            );


        this.renderer.render(
            this.expression
        );


        return node;
    }


    // =========================================================
    // Teclado
    // =========================================================

    handleKeyDown(event) {

        // -----------------------------------------------------
        // Não interfere nos atalhos com Ctrl / Alt / Meta.
        // -----------------------------------------------------

        if (
            event.ctrlKey ||
            event.altKey ||
            event.metaKey
        ) {

            return;
        }


        // -----------------------------------------------------
        // Delete
        // -----------------------------------------------------

        if (
            event.key === "Delete"
        ) {

            event.preventDefault();

            this.removeSelectedNode();

            return;
        }


        // -----------------------------------------------------
        // Backspace
        // -----------------------------------------------------

        if (
            event.key === "Backspace"
        ) {

            event.preventDefault();

            this.removeSelectedNode();

            return;
        }


        // -----------------------------------------------------
        // Seta esquerda
        // -----------------------------------------------------

        if (
            event.key === "ArrowLeft"
        ) {

            event.preventDefault();

            this.navigateHorizontal(
                -1
            );

            return;
        }


        // -----------------------------------------------------
        // Seta direita
        // -----------------------------------------------------

        if (
            event.key === "ArrowRight"
        ) {

            event.preventDefault();

            this.navigateHorizontal(
                1
            );

            return;
        }


        // -----------------------------------------------------
        // Seta para cima
        // -----------------------------------------------------

        if (
            event.key === "ArrowUp"
        ) {

            event.preventDefault();

            this.navigateUp();

            return;
        }


        // -----------------------------------------------------
        // Seta para baixo
        // -----------------------------------------------------

        if (
            event.key === "ArrowDown"
        ) {

            event.preventDefault();

            this.navigateDown();

            return;
        }
    }


    // =========================================================
    // Navegação horizontal
    // =========================================================

    navigateHorizontal(direction) {

        const selected =
            this.expression.getSelectedNode();


        // -----------------------------------------------------
        // Nenhum nó selecionado.
        //
        // Começamos pelo primeiro nó.
        // -----------------------------------------------------

        if (!selected) {

            const nodes =
                this.getNavigationNodes();


            if (nodes.length === 0) {
                return;
            }


            const node =
                direction > 0
                    ? nodes[0]
                    : nodes[nodes.length - 1];


            this.selectNode(
                node.id
            );


            return;
        }


        const nodes =
            this.getNavigationNodes();


        const index =
            nodes.findIndex(
                node =>
                    node.id === selected.id
            );


        if (index === -1) {
            return;
        }


        const newIndex =
            index + direction;


        if (
            newIndex < 0 ||
            newIndex >= nodes.length
        ) {

            return;
        }


        this.selectNode(
            nodes[newIndex].id
        );
    }


    // =========================================================
    // Navegação para cima
    // =========================================================

    navigateUp() {

        const selected =
            this.expression.getSelectedNode();


        if (!selected) {
            return;
        }


        const parent =
            this.expression.findParent(
                selected.id
            );


        if (!parent) {
            return;
        }


        this.selectNode(
            parent.id
        );
    }


    // =========================================================
    // Navegação para baixo
    // =========================================================

    navigateDown() {

        const selected =
            this.expression.getSelectedNode();


        if (!selected) {
            return;
        }


        if (
            !selected.children ||
            selected.children.length === 0
        ) {

            return;
        }


        const child =
            selected.children[0];


        if (!child) {
            return;
        }


        this.selectNode(
            child.id
        );
    }


    // =========================================================
    // Lista de navegação
    // =========================================================

    getNavigationNodes() {

        const nodes = [];


        this.collectNodes(
            this.expression.getRoot(),
            nodes
        );


        return nodes;
    }


    // =========================================================
    // Percorrer árvore
    // =========================================================

    collectNodes(
        node,
        nodes
    ) {

        if (!node) {
            return;
        }


        nodes.push(node);


        if (
            !node.children ||
            node.children.length === 0
        ) {

            return;
        }


        for (
            const child of node.children
        ) {

            this.collectNodes(
                child,
                nodes
            );
        }
    }


    // =========================================================
    // Remover nó selecionado
    // =========================================================

    removeSelectedNode() {

        const selected =
            this.expression.getSelectedNode();


        if (!selected) {
            return false;
        }


        const removed =
            this.expression.removeNode(
                selected.id
            );


        if (!removed) {
            return false;
        }


        this.renderer.render(
            this.expression
        );


        return true;
    }
}
