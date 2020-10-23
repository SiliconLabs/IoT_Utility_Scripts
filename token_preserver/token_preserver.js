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
   -matchSingleton <0|1> : if 0, then don't match singletons, if 1 then match _SINGLETON with non singleton codes. Default is 1.

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

var matchSingleton = 1

// Argument processing
process.argv.forEach((a) => {
  if (next == 'old') {
    oldHeader = a
    next = 'none'
  }
  if (next == 'new') {
    newHeader = a
    next = 'none'
  }
  if (next == 'write') {
    outputFile = a
    next = 'none'
  }
  if (next == 'matchSingleton') {
    matchSingleton = parseInt(a)
    next = 'none'
  }
  if (a == '-oldHeader' || a == '-o') {
    next = 'old'
  }
  if (a == '-newHeader' || a == '-n') {
    next = 'new'
  }
  if (a == '-w' || a == '-writeTo') {
    next = 'write'
  }
  if (a == '-matchSingleton') {
    next = 'matchSingleton'
  }
})

if (oldHeader == null || newHeader == null) usage()

var oldMap = {}
var newMap = {}
var newLines = []
var filesDone = 0

// Simple logging function.
function note(msg) {
  if (outputFile != null) console.log(msg)
}

// Callback triggered when either of the files is finished.
// First time around it just increases the counted, next
// time around, it actually does the processing. This way,
// it doesn't matter which file finished reading fist.
function finishedFile() {
  if (filesDone == 0) {
    filesDone++
    return
  }

  // Get the biggest old value
  var biggestValue = 0
  for (const creator in oldMap) {
    var c = parseInt(oldMap[creator], 16)
    if (c > biggestValue) biggestValue = c
  }

  // Ok, we're done parsing input files now. Let's analyze the keys.
  note('Analyze tokens...')
  for (const creator in newMap) {
    const newValue = newMap[creator]
    const oldValue = oldMap[creator]
    if (newValue == oldValue) {
      // Do nothing...
      note(`  ${creator}: same creator code, stays unchanged.`)
    } else if (oldValue == undefined) {
      var bypass = false
      if (matchSingleton == 1) {
        // Special case: check for singletons.
        if (
          creator.endsWith('_SINGLETON') &&
          creator.substring(0, creator.length - 10) + '_1' in oldMap
        ) {
          note(
            `  ${creator}: exists in the old map as non-singleton, code will be reused.`
          )
          newMap[creator] =
            oldMap[creator.substring(0, creator.length - 10) + '_1']
          bypass = true
        } else if (
          creator.substring(0, creator.length - 2) + '_SINGLETON' in
          oldMap
        ) {
          note(
            `  ${creator}: exists in the old map as a singleton, code will be reused.`
          )
          newMap[creator] =
            oldMap[creator.substring(0, creator.length - 2) + '_SINGLETON']
          bypass = true
        }
      }
      if (!bypass) {
        var newCreatorCode = biggestValue + 1
        biggestValue++
        newMap[creator] = `0x${newCreatorCode.toString(16).toUpperCase()}`
        note(
          `  ${creator}: new token. Ensure a new creator code: ${newMap[creator]}.`
        )
      }
    } else if (oldValue != newValue) {
      newMap[creator] = oldValue
      note(
        `  ${creator}: creator code has changed, rewriting it back to the same value: ${newValue} => ${oldValue}`
      )
    }
  }

  // Output function
  var output
  var outputStream

  if (outputFile == null) {
    output = (msg) => console.log(msg)
  } else {
    outputStream = fs.createWriteStream(outputFile)
    output = (msg) => outputStream.write(`${msg}\n`)
  }

  newLines.forEach((l) => {
    if (l.startsWith('#define CREATOR')) {
      var s = l.split(' ')
      output(`${s[0]} ${s[1]} ${newMap[s[1]]}`)
    } else if (l.startsWith('#define NVM3KEY')) {
      var s = l.split(' ')
      var x = s[1]
      var creator = x.replace('NVM3KEY', 'CREATOR')
      output(`#define ${x} ( ${s[3]} | ${newMap[creator]} )`)
    } else {
      output(l)
    }
  })

  note(`Writing resulting header to: ${outputFile}`)
  if (outputStream != null) outputStream.end()
}

// Create the interface for the old header reading...
const oldHeaderRead = readline.createInterface({
  input: fs.createReadStream(oldHeader),
  console: false,
})
// ... read it into the oldMap ...
oldHeaderRead.on('line', (l) => {
  if (l.startsWith('#define CREATOR')) {
    var s = l.split(' ')
    oldMap[s[1]] = s[2]
  }
})
// ... and trigger finishedFile() when done.
oldHeaderRead.on('close', () => {
  note(`Reading old header: ${oldHeader} ...`)
  finishedFile()
})

// Create the interface for the new header reading...
const newHeaderRead = readline.createInterface({
  input: fs.createReadStream(newHeader),
  console: false,
})

// ... read it into the newMap ...
newHeaderRead.on('line', (l) => {
  newLines.push(l)
  if (l.startsWith('#define CREATOR')) {
    var s = l.split(' ')
    newMap[s[1]] = s[2]
  }
})

// ... and trigger finishedFile() when done.
newHeaderRead.on('close', () => {
  note(`Reading new header: ${newHeader} ...`)
  finishedFile()
})
