
export default function parseArgs(args: string[]): { [key: string]: unknown } {

    if (args.length < 1) {
    console.error("No parameters provided. Please provide parameters in the format 'param=value'.")
    process.exit(1)
    }

    console.log('Raw args:', args)

    // Filter out any arguments that do not start with '--'
    args = args.filter(arg => arg.startsWith('--'))

    console.log('Filtered args:', args)

    type Flags = { [key: string]: unknown }

    let flags: Flags = {}

    for (const arg of args) {
        let param: string | undefined, value: string | null | undefined
        [param, value] = arg.split('=')
        console.log(`Parameter: ${param}, Value: ${value}`)
        if (typeof param === 'undefined') continue;
        value = value || null
        flags[param] = value
    }

    return flags

}
