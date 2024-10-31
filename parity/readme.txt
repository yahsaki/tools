been scared to mutate my precious data automatically so its been a semi manual process but with M3
metadata waiting to let loose its time to automate the apply

at the moment you first run map.js against both sources
SOURCE=I:\\Music\\!Bandcamp NAME=buf_bc node map
SOURCE=D:\\music\\!Bandcamp NAME=sdc_bc node map

after that you compare the sources
node compare
NOTE: the sources are statically set at teh moment lol

you then apply the updates yourself as you see fit by looking in the comparison.json file
