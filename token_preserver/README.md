# What is this?

Token preserver is a node.js script that does the following:

1. Read a previously generated token header for an appbuilder application.
1. Read a newly (either new SDK, or changes to the app) generated token header.
1. Produce a mangled new token header, that will preserve the token structure for maximum token data survivability.

It's a workaround an appbuilder problem that it regenerates tokens every time without regards to how tokens were stored previously,
which can result in data loss in cases of application upgrade.


# How do I run it?

1. Make sure you have node engine on your workstation. If you don't, install it from https://nodejs.org/en/download/
1. Run: 'node token_preserver.js' in your shell and it will print out all the help.
