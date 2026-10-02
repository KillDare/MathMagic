export const NodeTypes = {

    // =========================================================
    // Valores
    // =========================================================

    NUMBER: "number",
    VARIABLE: "variable",

    // =========================================================
    // Operações
    // =========================================================

    ADD: "add",
    SUBTRACT: "subtract",
    MULTIPLY: "multiply",
    DIVIDE: "divide",

    POWER: "power",

    PARENTHESIS: "parenthesis",

    SLOT: "slot"
};


export function getPrecedence(type) {

    switch (type) {

        case NodeTypes.ADD:
        case NodeTypes.SUBTRACT:
            return 1;


        case NodeTypes.MULTIPLY:
        case NodeTypes.DIVIDE:
            return 2;


        case NodeTypes.POWER:
            return 3;


        case NodeTypes.NUMBER:
        case NodeTypes.VARIABLE:
        case NodeTypes.PARENTHESIS:
            return 4;


        default:
            return 0;
    }
}