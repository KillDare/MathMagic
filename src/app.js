import { Expression } from "./models/Expression.js";

import { Renderer } from "./services/Renderer.js";
import { MathEngine } from "./services/MathEngine.js";

import {
    ExpressionController
} from "./controllers/ExpressionController.js";

import {
    ToolbarController
} from "./controllers/ToolbarController.js";

import { ToolbarView } from "./views/ToolbarView.js";
import { StepView } from "./views/StepView.js";


// =========================================================
// Elementos
// =========================================================

const expressionContainer =
    document.querySelector(
        "#expression"
    );


const toolbarContainer =
    document.querySelector(
        ".toolbar"
    );


const stepsContainer =
    document.querySelector(
        "#steps"
    );


const clearButton =
    document.querySelector(
        "#btnClear"
    );


// =========================================================
// Núcleo
// =========================================================

const expression =
    new Expression();


const renderer =
    new Renderer(
        expressionContainer
    );


const mathEngine =
    new MathEngine();


const stepView =
    new StepView(
        stepsContainer
    );


// =========================================================
// Atualização da expressão
// =========================================================

function expressionChanged(
    expression
) {

    // ---------------------------------------------------------
    // Expressão vazia
    // ---------------------------------------------------------

    if (
        !expression ||
        expression.isEmpty()
    ) {

        stepView.render([]);

        return;
    }


    // ---------------------------------------------------------
    // Verifica se a expressão está completa.
    //
    // Enquanto existir um SLOT, ainda não podemos
    // iniciar a resolução.
    // ---------------------------------------------------------

    if (
        !mathEngine.isComplete(
            expression.getRoot()
        )
    ) {

        stepView.render([]);

        return;
    }


    // ---------------------------------------------------------
    // Gera os passos da resolução.
    // ---------------------------------------------------------

    try {

        const steps =
            mathEngine.generateSteps(
                expression.getRoot()
            );


        stepView.render(
            steps
        );

    } catch (error) {

        console.error(
            "Erro ao resolver expressão:",
            error
        );


        stepView.renderError(
            error.message
        );
    }
}


// =========================================================
// Controllers
// =========================================================

const expressionController = new ExpressionController(
    expression,
    renderer,
    expressionContainer
);

expressionController.setOnChange(expressionChanged);

const toolbarController =
    new ToolbarController(
        expression,
        renderer,
        expressionChanged
    );


// =========================================================
// View
// =========================================================

new ToolbarView(
    toolbarContainer,
    toolbarController
);


// =========================================================
// Limpar
// =========================================================

clearButton.addEventListener(
    "click",
    () => {

        toolbarController.clear();
    }
);


// =========================================================
// Undo / Redo
// =========================================================

document.addEventListener(
    "keydown",
    event => {

        // -----------------------------------------------------
        // Ctrl + Z
        // -----------------------------------------------------

        if (
            event.ctrlKey &&
            !event.shiftKey &&
            event.key.toLowerCase() === "z"
        ) {

            event.preventDefault();

            toolbarController.undo();

            return;
        }


        // -----------------------------------------------------
        // Ctrl + Y
        // -----------------------------------------------------

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "y"
        ) {

            event.preventDefault();

            toolbarController.redo();

            return;
        }


        // -----------------------------------------------------
        // Ctrl + Shift + Z
        //
        // Alguns programas utilizam esta combinação
        // para Redo.
        // -----------------------------------------------------

        if (
            event.ctrlKey &&
            event.shiftKey &&
            event.key.toLowerCase() === "z"
        ) {

            event.preventDefault();

            toolbarController.redo();
        }
    }
);


// =========================================================
// Inicialização
// =========================================================

renderer.render(
    expression
);


stepView.render([]); 