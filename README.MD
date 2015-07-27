[note: requires not yet released version of kontraktor]

sample application showing how to
- make use of kontraktor-http server side html-import polyfill (reduces number of http requests drastically)
- use and organize polymer 1.0x webcomponents with kontraktor's resourcepath
- define custom webcomponents
- integrate existing js (d3 word cloud) by defining a webcomponent + using html imports
- websocket communication of js <=> kontraktor, server push
- create an application specific kson config file

the app computes a word cloud from buzzwords typed in. The more often a buzzword has been typed, the larger the word is rendered (realtime, distributed across all users).
