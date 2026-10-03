import { Expression } from "../models/Expression.js";
import { Renderer } from "../services/Renderer.js";


export class StepView {

    constructor(container) {

        this.container = container;
    }


    // =========================================================
    // Renderização
    // =========================================================

    render(steps) {

        this.container.innerHTML = "";


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
        // Número do passo
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


        // -----------------------------------------------------
        // Expressão
        // -----------------------------------------------------

        const expressionContainer =
            document.createElement(
                "div"
            );

        expressionContainer.className =
            "step__expression";


        const expression =
            new Expression();


        expression.setRoot(
            step.node,
            false
        );


        const renderer =
            new Renderer(
                expressionContainer
            );


        renderer.render(
            expression
        );


        // -----------------------------------------------------
        // Montagem
        // -----------------------------------------------------

        content.appendChild(
            description
        );

        content.appendChild(
            expressionContainer
        );


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

        this.container.innerHTML = "";


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