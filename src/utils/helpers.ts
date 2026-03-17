import type { Message, Model, ResponseMessage } from "../types/types.js";


function countTokens(message: Message): number {
    let m = message as ResponseMessage
    if (typeof m.tokens === 'undefined') m.tokens = { input: 0, output: 0 }
    return m.tokens.input + m.tokens.output
}

function calculateMessageCost(usage: { input_tokens: number, output_tokens: number }, model: Model): number {
    const inputCost = (usage.input_tokens / model.costScale) * model.inputCostPerCS
    const outputCost = (usage.output_tokens / model.costScale) * model.outputCostPerCS
    return inputCost + outputCost
}

export { countTokens, calculateMessageCost }
