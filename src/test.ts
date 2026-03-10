import parseArgs from './parseargs.js'

let args = process.argv.slice(2)

let flags = parseArgs(args)

console.log(flags)

if ('--blah2' in flags) {
    console.log(`Processing --blah2 with value: ${flags['--blah2']}`)
}

