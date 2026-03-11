import { parseArgs } from "node:util";

export default function getCliArgs() {
    const { values } = parseArgs({
        options: {
            'model': {
                type: 'string',
                short: 'm',
                default: 'claude'
            },
            'stream': {
                type: 'boolean',
                short: 's'
            },
            'verbose': {
                type: 'boolean',
                short: 'v'
            }
        }
    })
    return values
}
