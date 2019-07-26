# BotMaker for Discord

[![node.js dependencies](https://david-dm.org/CorySanin/BotMaker-for-Discord.png)](https://david-dm.org/CorySanin/BotMaker-for-Discord)

### Make your own Discord audio-playing bot with ease!
Make an audio-playing bot for Discord (like Airhorn Solutions) without messing with any source code! All you have to do is put all your audio files into a single folder, write up a config.json, and run the bot. There's really nothing to it.

This is what your config.json might look like:
```JSON
{
  "prefix":"bot ",
  "game":"\"bot help\" for help",
  "description":"This is a bot using the example config file. In other words, it probably doesn't do much.",
  "stopcmd":"stop",
  "invitecmd":"invite",
  "directory":"C:\\botaudio\\",
  "volume":0.5,
  "token":"k5NzE2NDg1MTIwMjc0ODQ0Nj.DSnXwg.ttNotArealToken5p3WfDoUxhiH",
  "commands":{
    "cmd-with-arg":{
      "audios":["file1.mp3","file2.mp3"],
      "description":"This command accepts an argument.",
      "args":{
        "arg":{
          "audios":["file3.mp3","file4.mp3"],
          "description":"an argument that can be passed."
        },
        "arg2":{
          "audios":["file5.mp3"],
          "description":"this argument only plays one audio file."
        }
      }
    },
    "cmd-without-arg":{
      "audios":["file6.mp3","file7.mp3"],
      "description":"This command takes no arguments."
    }
  }
}
```

If you don't have a token yet, you will need to create a bot account [here](https://discordapp.com/developers/applications/me). After you've done that, you can invite
your bot to a server by going to `https://discordapp.com/oauth2/authorize?client_id=CLIENTID&scope=bot&permissions=0`, where `CLIENTID` is your bot application's client ID (NOT THE TOKEN).

Once you have your config.json, you can start BotMaker using `npm start`

When you are ready to try it out, clone this repository, do an `npm install`, write your config.json, and finally `npm start`.
If you are feeling extra lazy, you can grab some setup scripts from the [releases page](https://github.com/CoryZ40/BotMaker-for-Discord/releases/latest). Note that these scripts require you to already have git and node ready to go.

make and g++ is necessary for installing BotMaker's dependencies.

## Having Issues?
Just let me know here on [GitHub](https://github.com/CorySanin/BotMaker-for-Discord/issues). I'll take care of it as soon as I have a chance.

## Docker
Build: `docker build . -t botmaker`

Run: `docker run --rm -v config:/usr/src/botmaker/config -v sounds:/usr/src/botmaker/sounds -it botmaker`
