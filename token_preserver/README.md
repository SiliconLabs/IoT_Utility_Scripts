# What is this?
Token preserver is a node.js script that does the following:

1. Read a previously generated token header for a Simplicity Studio AppBuilder generated application.
1. Read a newly (either new SDK, or changes to the app) generated token header.
1. Produce a combined novel token header, that will preserve the token structure from the old token header for maximum token data survivability.

# The Situation
Application "tokens" are bits of data stored in Non-Volatile Memory (NVM). They are laid out in NVM when a device is first flashed with an image and the application is run for the first time, or when it is reset to factory defaults. There is a lot of data stored inside tokens that an application will want to keep around across OTA upgrades such as its bindings, pairing, network provisioning, application settings etc... Thus every time a device is OTA upgraded you don't want to have to reset the device to factory defaults you simply want it to come back online by using the same token data from before it was upgraded.

# The Problem
Simplicity Studio's AppBuilder currently (as of SV4.x.x) regenerates tokens every time an application is modified without regards to how tokens were stored previously within the application. Thus there is no concept in AppBuilder of how the token space 'was' laid out and must persist. The Silicon Labs team is working on a long term solution for this issue, but until one is provided inside the Simplicity Studio tools, there is a bit of a problem, in that we need to introduce the concept of 'old' and 'new' tokens across application upgrades.

If the tokens used previously (in the previous version of an application) are not preserved, the application can produce indeterminate results when it is run with a new layout of the token space following an OTA upgrade. A new token might point to the memory of an old one and vice versa. Thus, A token that used to represent the binding of the application might now map to the space for the setting of the light color etc... 

Because some application settings are stored in NVM, the end result is that, for instance, a light that was Yellow might turn Red after the OTA upgrade, or turn off or do some other undesired behavior. Obviously nobody wants this. You want the light to come back online exactly as it was before the OTA upgrade without the need for a reset to factory defaults. In order to ensure this behavior, the layout of the token address space must be preserved across application upgrades. So how do we overcome this Simplicity Studio AppBuilder limitation?

# The Solution
This script provides a temporary workaround for the problem. It does this by first reading the 'old' token file and then reading the 'new' token file. From these two files it 'writes' a 3rd token file which preserves the layout of the 'old' token address space, while at the same time tacking on the 'new' token addresses in a novel location inside NVM. This ensures that any new tokens will be initialized to their default values, and also preserves the addresses and also values of the previously defined tokens. Thus an application token for light color that pointed to address 0 in NVM is guaranteed to continue pointing to address 0 after the OTA upgrade of the device. e.g. The light that was Yellow prior to OTA upgrade will continue to be Yellow after the OTA upgrade. Problem solved!

# How do I run it?
1. This script is written in Node.js. Make sure you have node engine on your workstation. If you don't, install it from https://nodejs.org/en/download/
1. Once you have the node engine installed, Run: 'node token_preserver.js' in your shell and it will print out all the help.
