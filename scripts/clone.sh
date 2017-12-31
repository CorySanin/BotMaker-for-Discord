#!/bin/bash
git clone https://github.com/CorySanin/BotMaker-for-Discord.git botmaker
cd botmaker
git pull origin master
rm package-lock.json
npm install