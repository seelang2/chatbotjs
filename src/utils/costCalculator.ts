import type { Model } from '../types/types.js'


function calculateMessageCost(usage: { input_tokens: number, output_tokens: number }, model: Model): number {
    // token_cost = 
    const inputCost = (usage.input_tokens / model.costScale) * model.inputCostPerCS
    const outputCost = (usage.output_tokens / model.costScale) * model.outputCostPerCS
    return inputCost + outputCost
}

export { calculateMessageCost }
