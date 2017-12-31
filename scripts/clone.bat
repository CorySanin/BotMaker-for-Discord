@echo off
git clone https://github.com/CorySanin/BotMaker-for-Discord.git botmaker
cd botmaker
git pull origin master
del package-lock.json
call npm install
cd ..\
rmdir node_modules /s /Q