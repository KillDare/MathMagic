import { Expression } from "../models/Expression.js";
import { Renderer } from "../services/Renderer.js";


export class StepView {

    constructor(container) {

        this.container =
            container;
    }


    // =========================================================
    // Renderização
    // =========================================================

    render(steps) {

        this.container.innerHTML =
            "";


        if (
            !steps ||
            steps.length === 0
        ) {

            this.renderEmpty();

            return;
        }


        steps.forEach(
            (step, index) => {

                this.renderStep(
                    step,
                    index
                );
            }
        );
    }


    // =========================================================
    // Renderiza um passo
    // =========================================================

    renderStep(
        step,
        index
    ) {

        const element =
            document.createElement(
                "div"
            );


        element.className =
            "step";


        // -----------------------------------------------------
        // Tipo do passo
        // -----------------------------------------------------

        if (
            step.type
        ) {

            element.classList.add(
                `step--${step.type}`
            );
        }


        // -----------------------------------------------------
        // Número
        // -----------------------------------------------------

        const number =
            document.createElement(
                "div"
            );


        number.className =
            "step__number";


        number.textContent =
            index + 1;


        // -----------------------------------------------------
        // Conteúdo
        // -----------------------------------------------------

        const content =
            document.createElement(
                "div"
            );


        content.className =
            "step__content";


        // -----------------------------------------------------
        // Descrição
        // -----------------------------------------------------

        const description =
            document.createElement(
                "div"
            );


        description.className =
            "step__description";


        description.textContent =
            step.description;


        content.appendChild(
            description
        );


        // -----------------------------------------------------
        // Passo de operação
        // -----------------------------------------------------

        if (
            step.type ===
            "operation"
        ) {

            this.renderOperationStep(
                content,
                step
            );

        } else {

            // -------------------------------------------------
            // Passo inicial ou resultado
            // -------------------------------------------------

            const expressionContainer =
                this.createExpressionContainer(
                    step.node
                );


            content.appendChild(
                expressionContainer
            );
        }


        // -----------------------------------------------------
        // Montagem
        // -----------------------------------------------------

        element.appendChild(
            number
        );


        element.appendChild(
            content
        );


        this.container.appendChild(
            element
        );
    }


    // =========================================================
    // Passo de operação
    // =========================================================

    renderOperationStep(
        content,
        step
    ) {

        // -----------------------------------------------------
        // Expressão antes da operação
        // -----------------------------------------------------

        const beforeContainer =
            this.createExpressionContainer(
                step.before,
                step.highlightedNodeId
            );


        beforeContainer.classList.add(
            "step__expression--before"
        );


        content.appendChild(
            beforeContainer
        );


        // -----------------------------------------------------
        // Indicador visual
        // -----------------------------------------------------

        const arrow =
            document.createElement(
                "div"
            );


        arrow.className =
            "step__arrow";


        arrow.innerHTML = `
            <span>↓</span>
        `;


        content.appendChild(
            arrow
        );


        // -----------------------------------------------------
        // Expressão depois da operação
        // -----------------------------------------------------

        const afterContainer =
            this.createExpressionContainer(
                step.node
            );


        afterContainer.classList.add(
            "step__expression--after"
        );


        content.appendChild(
            afterContainer
        );
    }


    // =========================================================
    // Cria uma expressão renderizada
    // =========================================================

    createExpressionContainer(
        node,
        highlightedNodeId = null
    ) {

        const container =
            document.createElement(
                "div"
            );


        container.className =
            "step__expression";


        const expression =
            new Expression();


        expression.setRoot(
            node,
            false
        );


        const renderer =
            new Renderer(
                container
            );


        renderer.render(
            expression,
            {
                highlightedNodeId
            }
        );


        return container;
    }


    // =========================================================
    // Estado vazio
    // =========================================================

    renderEmpty() {

        const element =
            document.createElement(
                "div"
            );


        element.className =
            "steps-empty";


        element.innerHTML = `
            <span class="steps-empty__icon">
                ∑
            </span>

            <span class="steps-empty__text">
                A resolução aparecerá aqui.
            </span>
        `;


        this.container.appendChild(
            element
        );
    }


    // =========================================================
    // Erro
    // =========================================================

    renderError(message) {

        this.container.innerHTML =
            "";


        const element =
            document.createElement(
                "div"
            );


        element.className =
            "steps-empty steps-empty--error";


        element.innerHTML = `
            <span class="steps-empty__icon">
                !
            </span>

            <span class="steps-empty__text"></span>
        `;


        const text =
            element.querySelector(
                ".steps-empty__text"
            );


        text.textContent =
            message ||
            "Não foi possível resolver a expressão.";


        this.container.appendChild(
            element
        );
    }
}