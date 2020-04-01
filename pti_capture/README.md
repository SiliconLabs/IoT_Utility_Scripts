# What is this?
PTI (Packet Trace Interface) Capture is a light-weight command line utility that captures network traffic information, via debug channel such as packet trace, AEM usage, memory, and so on, and control nodes on a network for the Silicon Labs EFR32 WSTK / Ember ISA3 Debug Adapter. This utility provides the equivalent network capture functionality of Simplicity Studio’s Network Analyzer tool.

# Usage

```bash
$ java -jar silabs-pti-capture.jar [ARGUMENTS] [COMMANDS]

Mandatory arguments:

  -ip=<HOSTNAMES> - specify adapter names or IP addresses to connect to
                    (may be ommited in case of -discover).

Optional arguments:

  -i - drop into interactive mode after connecting to adapter.
       Type 'help' once in interactive mode.
  -time=<TIME_IN_MS> - capture duration. Default is 1 year.
  -delay=<TIME_IN_MS> - delay between admin port commands. Default is 2 seconds.
  -out=<FILENAME> - specify a filename for output.
  -admin - connect to admin port and execute COMMANDS one after another
  -serial0 - connect to serial0 port and execute COMMANDS one after another
  -serial1 - connect to serial1 port and execute COMMANDS one after another
  -format=[dump|raw|log|text] - specify a format for output.
  -v - print version and exit.
  -discover - run UDP discovery and print results.
  -driftCorrection=[enable, disable] - perform drift time correction for incoming packets.
                                       Enabled by default.
  -driftCorrectionThreshold= - drift time correction threshold (micro-sec).
  -zeroTimeThreshold= - zero time threshold (micro-sec).
  -discreteNodeCapture - each node stream gets its own log file.
                         Each filename is "-out" option combined with "_$ip" suffix.
                         Time Sync is disabled.

File formats:

  dump - Binary dump of raw bytes, no deframing.
  raw - Raw bytes of deframed debug messages, one message per line.
  log - Parsed debug messages, written into a file that Network Analyzer can import.
  text - Text file format that can be used with wireshark by running through 'text2pcap -q -t %H:%M:%S. <FILENAME>'
```
# Examples
## Single network
#### Single device capture to console:
```bash
$ java -jar silabs-pti-capture.jar -ip=10.4.178.223
INFO: 10.4.178.223:4905 =>> Connect.
[ 02 00 D2 85 B5 3D 1F 02 2A 00 EB F8 0A 03 08 50 FF FF FF FF 07 59 69 F9 AE 02 00 48 ]
[ 02 00 AE 91 B5 3D 1F 02 29 00 EC FC 2D 00 C0 18 34 12 CB 6D 41 A6 7F E4 7D 82 FF 0F 00 ]
...
```

#### Single device capture to file:
```bash
$ java -jar silabs-pti-capture.jar -ip=10.4.186.138 -format=log -out=capture.log
```

#### Single device capture for 5 seconds:
```bash
$ java -jar silabs-pti-capture.jar -ip=10.4.186.138 -format=log -time=5000 -out=capture.log
```

#### Single device discovery:
```bash
$ java -jar silabs-pti-capture.jar -ip=10.4.186.138 -admin discovery
```

#### Multiple devices capture to file:
```bash
$ java -jar silabs-pti-capture.jar -ip=10.4.186.138,10.4.186.139 -out=capture.log

# list of ips can be specified via an external file as well.
# each ip would be on a new line.
$ java -jar silabs-pti-capture.jar -ip=ips.txt -out=capture.log
```

#### Multiple devices capture with timing drifting correction (default):
```bash
# this option is automatically turned on when capturing from multiple nodes
$ java -jar silabs-pti-capture.jar -ip=10.4.186.138,10.4.186.139 -driftCorrection=true
```

## Multiple network
#### Multiple device capture to file:
```bash
# capture from given devices and output each capture stream to specific files.
# e.g. capture_10.4.186.138.log, capture_10.4.186.139.log.
$ java -jar silabs-pti-capture.jar -ip=10.4.186.138,10.4.186.139 -discreteNodeCapture -out=capture.log
```

# Requirements
1. Silicon Lab radio chip such as an EFR32 or EM-based chip/node
1. Computer capable of running Java (tested on JRE 1.8.0)
1. Flashed node/set of nodes running with power
