const Discord = require('discord.js') //https://discord.js.org/#/docs/main/stable/general/welcome
const fs = require('fs')
const client = new Discord.Client()
const ZEROWIDTH_SPACE = String.fromCharCode(parseInt('200B', 16))
const MAXMESSAGELENGTH = 2000

let guilds = []
let playingNow = []
let connected = -1
let GAME = 'GAME'
let BOTDESC = 'Amazing.'
let PREFIX = '! '
let interruptCmd = 'stop'
let inviteCmd = 'invite'
let audioDir = 'C:\\botaudio\\'
let commands = {}

function loadConfig(){
  //TODO: add suppoort for command aliases
  let cfgfile = 'config.json'
  if(fs.existsSync(cfgfile)){
    let cfg = JSON.parse(fs.readFileSync(cfgfile, 'utf8'))
    PREFIX = cfg.prefix
    GAME = cfg.game
    BOTDESC = cfg.description
    interruptCmd = cfg.stopcmd
    inviteCmd = cfg.invitecmd
    audioDir = cfg.directory
    commands = cfg.commands
    client.login(cfg.token)
  }
  else{
    console.log('Oh no!!! '+cfgfile+' could not be found!')
  }
}

function updateCurrentGame(){
  client.user.setGame(GAME)
}

function isAlreadyQd(guild, playerObj){
  let returnFlag = isMatch(playerObj,playingNow[guild])
  for(let i = 0; i < guilds[guild].length && !returnFlag; i++){
    returnFlag = isMatch(playerObj, guilds[guild][i]) || returnFlag
  }
  return returnFlag
}

function isMatch(obj1, obj2){
  if(typeof(obj1) !== 'undefined' && typeof(obj2) !== 'undefined'){
    return obj1.player == obj2.player && obj1.type == obj2.type
  }
  else {
    return false
  }
}

client.on('ready', () => {
  console.log('BotMaker 2 by Cory Sanin')
  updateCurrentGame()
})

client.on('message', message => {
  if (message.guild){
    let command = validateMessage(message)
    if ( command.type === interruptCmd ) {
      if(playingNow[message.guild.id]){
        let playing = playingNow[message.guild.id]
        if(playing.player.id === message.member.id || message.member.hasPermission('ADMINISTRATOR')
            || message.member.hasPermission('MANAGE_CHANNELS')
            || message.member.hasPermission('KICK_MEMBERS')
            || message.member.hasPermission('MOVE_MEMBERS')){
          playing.dispatcher.end()
        }
      }
    }
    else if(command.type === 'help'){
      if(command.argument === null ||
          (typeof(commands[command.argument]) === 'undefined') &&
          command.argument !== interruptCmd &&
          command.argument !== inviteCmd){
        let messages = []
        let thismessage = BOTDESC + '\nHere are the available commands:\n'
        let first = true
        for(let cmd in commands) {
          let thisCmd = '`' + cmd
          if(!first){
            thisCmd = ', ' + thisCmd
          }
          if(typeof(commands[cmd].args) !== 'undefined'){
            thisCmd += '*'
          }
          thisCmd += '`'

          if(thismessage.length + thisCmd.length > MAXMESSAGELENGTH){
            messages.push(thismessage)
            thismessage = thisCmd
          }
          else{
            thismessage += thisCmd
          }

          first = false
        }
        let builtinCmds = {
          "stop":false,
          "invite":false,
          "help":true
        }
        for(let cmd in builtinCmds) {
          let thisCmd = '`' + cmd
          if(!first){
            thisCmd = ', ' + thisCmd
          }
          if(builtinCmds[cmd]){
            thisCmd += '*'
          }
          thisCmd += '`'

          if(thismessage.length + thisCmd.length > MAXMESSAGELENGTH){
            messages.push(thismessage)
            thismessage = thisCmd
          }
          else{
            thismessage += thisCmd
          }

          first = false
        }
        let bottomMessage = 'Commands denoted with a \\* indicate that '+
        'the command can take an argument. Do `'+PREFIX+'help <command>` '+
        'for more info.'
        if(thismessage.length + bottomMessage.length + ('\n'.length * 2) > MAXMESSAGELENGTH){
          messages.push(thismessage)
          thismessage = bottomMessage
        }
        else{
          thismessage += '\n\n'+bottomMessage
        }
        messages.push(thismessage)

        sendHelpMessages(messages,message.channel)
      }
      else if(command.argument === interruptCmd || command.argument === inviteCmd){
          let helpMessage = command.argument+'\n'
        if(command.argument === interruptCmd){
          helpMessage += 'Cancels the current track, if you started it (or if you\'re an admin)\nUsage: `'+PREFIX+interruptCmd+'`'
        }
        else if(command.argument === inviteCmd){
          helpMessage += 'Invite '+client.user.username+' to your server.\nUsage: `'+PREFIX+inviteCmd+'`'
        }
        message.channel.send(helpMessage)
      }
      else{
        let usage = '\nUsage: `'+PREFIX+command.argument
        if(typeof(commands[command.argument].args) !== 'undefined'){
          usage += ' <argument>`\n*argument is optional*'
        }
        else{
          usage += '`'
        }
        let messages = []
        let thismessage = command.argument + '\n' + commands[command.argument].description + usage + '\n'
        if(typeof(commands[command.argument].args) !== 'undefined'){
          let first = true
          thismessage += '\nHere are the available arguments:\n'
          for(let arg in commands[command.argument].args) {
            let thisCmd = '`' + arg + '`'
            if(!first){
              thisCmd = ', ' + thisCmd
            }

            if(thismessage.length + thisCmd.length > MAXMESSAGELENGTH){
              messages.push(thismessage)
              thismessage = thisCmd
            }
            else{
              thismessage += thisCmd
            }

            first = false
          }
        }
        messages.push(thismessage)
        sendHelpMessages(messages,message.channel)
      }
    }
    else if(command.type === inviteCmd){
      let richem = new Discord.RichEmbed()
        .setAuthor('Invite '+client.user.username,client.user.avatarURL)
        .setThumbnail(client.user.avatarURL)
        .addField('Invite',"[Invite "+client.user.username+" to your server](https://discordapp.com/oauth2/authorize?client_id="+client.user.id+"&scope=bot)")

      message.channel.send(richem)
    }
    else if(command.type !== null){
      updateCurrentGame()
      playCommand(command, message)
    }
  }
})

function sendHelpMessages(messages,channel){
  if(messages.length > 0){
    let thismessage = messages.shift()
    channel.send(thismessage)
    setTimeout(function(){ sendHelpMessages(messages,channel) }, 1000)
  }
}

function playCommand(command, message){
  if(typeof(commands[command.type]) !== 'undefined'){
    let audios
    if(command.argument !== null && typeof(commands[command.type].args[command.argument]) !== 'undefined'){
      audios = commands[command.type].args[command.argument].audios
    }
    else{
      audios = commands[command.type].audios
    }
    let randomIndex = Math.floor(Math.random() * audios.length)
    let playerObj = {}
    playerObj.player = message.member
    playerObj.channel = message.member.voiceChannel
    playerObj.type = command.type
    playerObj.file = audioDir+audios[randomIndex]

    if(message.member.voiceChannel){
      if(fs.existsSync(playerObj.file)){
        if(guilds[message.guild.id]){
          if(!isAlreadyQd(message.guild.id, playerObj)){
            guilds[message.guild.id].push(playerObj)
          }
        }
        else{
          guilds[message.guild.id] = []
          guilds[message.guild.id].push(playerObj)
          play(message.guild)
        }
      }
      else{
        console.log('FILE MISSING: '+playerObj.file)
      }
    }
  }
}

function validateMessage(message) {
  let messageText = message.content.toLowerCase()
  let command = {
    'type': null,
    'argument': null
  }
  let thisPrefix = messageText.substring(0, PREFIX.length)
  if(thisPrefix === PREFIX){
    let allButPrefix = messageText.substring(PREFIX.length,messageText.length)
    let split = allButPrefix.split(" ")
    if(split.length > 0){
      command.type = split[0]
      if(split.length > 1){
        command.argument= split[1]
      }
    }
  }
  return command
}

function play(guild){
  let playerObj = guilds[guild.id].shift()
  playerObj.channel.join()
    .then(connection => { // Connection is an instance of VoiceConnection
      console.log('playing '+playerObj.file+' on '+guild.name)
      let dispatcher = connection.playFile(playerObj.file)
      playerObj.dispatcher = dispatcher
      playingNow[guild.id] = playerObj

      dispatcher.setVolume(0.2)

      dispatcher.on('end', () => {
        if(guilds[guild.id] && guilds[guild.id].length > 0){
          play(guild)
        }
        else{
          delete guilds[guild.id]
          delete playingNow[guild.id]
          connection.disconnect()
        }
      })

      dispatcher.on('error', e => {
        // Catch any errors that may arise
        console.log(e)
      })

      //dispatcher.end() // End the dispatcher, emits 'end' event
    })
    .catch(console.log)
}

loadConfig()
