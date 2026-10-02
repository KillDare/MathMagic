export class ToolbarView {

    constructor(container, controller) {

        this.container = container;
        this.controller = controller;

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
    }


    handleClick(event) {

        const valueButton = event.target.closest(
            "[data-value]"
        );

        if (
            valueButton &&
            this.container.contains(valueButton)
        ) {

            this.controller.handleValue(
                valueButton.dataset.value
            );

            return;
        }

        const operationButton = event.target.closest(
            "[data-operation]"
        );

        if (
            operationButton &&
            this.container.contains(operationButton)
        ) {

            const operation =
                operationButton.dataset.operation;

            if (operation === "parenthesis") {
                this.controller.handleParenthesis();
                return;
            }

            this.controller.handleOperation(operation);
        }
    }
}
