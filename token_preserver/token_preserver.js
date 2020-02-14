// Copyright (c) 2020 Silicon Labs. All rights reserved.

// This script is used to preserve the tokens across two generations
// of the token header file.

const fs = require('fs')
const readline = require('readline')



function usage() {
    console.log(`Usage: node token_preserver.js [ ARGS ]

Mandatory arguments: 
   -o|-oldHeader <FILENAME>: specifies the name of the old generated header
   -n|-newHeader <FILENAME>: specifies the name of the newly generated header

Optional arguments:
   -w|-writeTo <FILENAME>: specifies the name of the file to write output to. If missing, stdout is used.

Examples:
   Analyze old.h and new.h and write out modified new header to mod.h:
      node token_preserver.js -o old.h -n new.h -w mod.h

   Analyze old.h and new.h and write resulting output to standard output:
      node token_preserver.js -o old.h -n new.h
`)
    
    process.exit(0)
}

var oldHeader = null
var newHeader = null

var outputFile = null

var next = 'none'

process.argv.forEach(a => {
    if ( next == 'old' ) {
        oldHeader = a
        next = 'none'
    }
    if ( next == 'new' ) {
        newHeader = a
        next = 'none'
    }
    if ( next == 'write' ) {
        outputFile = a
        next = 'none'
    }
    if ( a == '-oldHeader' || a == '-o') {
        next = 'old'
    }
    if ( a == '-newHeader' || a == '-n' ) {
        next = 'new'
    }
    if ( a == '-w' || a == '-writeTo' ) {
        next = 'write'
    }
})

if ( oldHeader == null || newHeader == null ) usage()

var oldMap = {}
var newMap = {}
var newLines = []
var filesDone = 0

function note(msg) {
    if ( outputFile != null )
        console.log(msg)
}

function finishedFile() {
    if ( filesDone == 0 ) {
        filesDone++
        return
    }

    // Get the biggest old value
    var biggestValue = 0
    for ( const creator in oldMap ) {
        var c = parseInt(oldMap[creator], 16)
        if ( c > biggestValue ) 
            biggestValue = c
    }

    // Ok, we're done parsing input files now. Let's analyze the keys.
    note('Analyze tokens...')
    for ( const creator in newMap ) {
        const newValue = newMap[creator]
        const oldValue = oldMap[creator]

        if ( newValue == oldValue ) {
            // Do nothing...
            note(`  ${creator}: same creator code, stays unchanged.`)
        } else if ( oldValue == undefined ) {
            var newCreatorCode = (biggestValue+1)
            biggestValue++
            newMap[creator] = `0x${newCreatorCode.toString(16).toUpperCase()}`
            note(`  ${creator}: new token. Ensure a new creator code: ${newMap[creator]}.`)
        } else if ( oldValue != newValue ) {
            newMap[creator] = oldValue
            note(`  ${creator}: creator code has changed, rewriting it back to the same value: ${newValue} => ${oldValue}`)
        }
    }

    // Output function
    var output
    var outputStream

    if ( outputFile == null ) {
        output = (msg) => console.log(msg)
    } else {
        outputStream = fs.createWriteStream(outputFile)
        output = (msg) => outputStream.write(`${msg}\n`)
    }
    
    newLines.forEach(l => {
        if ( l.startsWith('#define CREATOR') ) {
            var s = l.split(' ')
            output(`${s[0]} ${s[1]} ${newMap[s[1]]}`)
        } else if ( l.startsWith('#define NVM3KEY') ) {
            var s = l.split(' ')
            var x = s[1]
            var creator = x.replace('NVM3KEY', 'CREATOR')
            output(`#define ${x} ( ${s[3]} | ${newMap[creator]} )`)
        } else {
            output(l)
        }
    })
    
    note(`Writing resulting header to: ${outputFile}`)
    if ( outputStream != null )
      outputStream.end()
}

const oldHeaderRead = readline.createInterface({
    input: fs.createReadStream(oldHeader),
    console: false
})

oldHeaderRead.on('line', l => {
    if ( l.startsWith('#define CREATOR') ) {
        var s = l.split(' ')
        oldMap[s[1]] = s[2]
    }
})

oldHeaderRead.on('close', () => {
    note(`Reading old header: ${oldHeader} ...`)
    finishedFile()
})

const newHeaderRead = readline.createInterface({
    input: fs.createReadStream(newHeader),
    console: false
})

newHeaderRead.on('line', l => {
    newLines.push(l)
    if ( l.startsWith('#define CREATOR') ) {
        var s = l.split(' ')
        newMap[s[1]] = s[2]
    }
})

newHeaderRead.on('close', () => {
    note(`Reading new header: ${newHeader} ...`)
    finishedFile()
})

