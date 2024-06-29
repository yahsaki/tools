# HOW TO USE
on linux(run as su):
SOURCEDIR=/home/<username>/Downloads TARGETDIR=/boot node index.js

on windows(run as admin):
SOURCEDIR=C:\Users\<username>\Downloads TARGETDIR=C:\Windows\System32 node index.js

# Personal Notes
TODO:
  - create html file
  - clean up console output
  - for the update metric, output the difference in bytes(up and down), not just
    the total
  - is there a way to detect if a drive is busy? probably not... might need to
    call some linux tool. currently the read drive is maxed out on its IOPS but
    the write drive is fine. Need to delay after the scan first of all
    It created 1358 folders in less than a millisecond, so putting a delay in the
    crupdate function(ISSUE: it was fs-extra copy, replaced that and it works)
  - add file size and time elapsed to apply function. how the fuck did you forget
    that of all things
#### Issues
- fs-extra copy is getting locked up on tiny files. moving to linux 'cp' command
  fixed it. I didnt want to make it linux only but it is what it is. Need to see
  now fs-extra delete performs in real usage

ISSUE
Need to keep certain folders up to date with folders on other drives/locations, not the entire drive. Drive cloning hardware requires like kind drives. Screw other software.

Solution
Parity! Parity gets one location up to date with another.
The tool will
- scan both directories and generate an assessment of work to be done
- probably ruin my life because I was drunk and switched target and source directories

The tool will not
- completely erase a populated location with an empty location

Parameters
- source: string(directory)
  the location that will overwrite the other

- target: string(directory)
  location to be overwritten

- operation: string
  possible options:
    assess: generate an assessment of work to be done
    update: updates the target. will still generate an assessment anyway

- noDelete: bool
  if set to true, it will not remove anything in the target directory, only overwrite and add

- keepNewer: bool
  if set to true, will not overwrite anything newer

an assessment will provide the following data:
- how much data will be added/removed
- how many files will be added/deleted/updated
- how many folders will be added/deleted?

I would like a shitty html file to view, shouldnt be to hard to whip up

red for deleted
green for added
yellow for updated
orange for updated but smaller size?
white for unchanged

example cli output:
source:
files: 1345 folders: 33 size: 45GB
