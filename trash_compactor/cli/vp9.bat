@echo off

echo %1
echo %2
echo %3
ffmpeg -i %1 -c:v libvpx-vp9 -b:v 0 -crf 60 -row-mt 1 -deadline best -pass 1 -an -f null NUL && ffmpeg -i %1 -c:v libvpx-vp9 -b:v 0 -crf 35 -row-mt 1 -deadline best -pass 2 -c:a libopus -y %2
