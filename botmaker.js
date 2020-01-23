const Discord = require('discord.js') //https://discord.js.org/#/docs/main/stable/general/welcome
const fs = require('fs')
const path = require('path')
const client = new Discord.Client()
const ZEROWIDTH_SPACE = String.fromCharCode(parseInt('200B', 16))
const MAXMESSAGELENGTH = 2000

let guilds = []
let playingNow = []
let connected = -1
let GAME = 'GAME'
let BOTDESC = 'Amazing.'
let PREFIX = '! '
let MENTIONPREFIX = '<@'+1+'> '
let VOLUME
let interruptCmd = 'stop'
let inviteCmd = 'invite'
let audioDir = 'C:\\botaudio\\'
let commands = {}
let aliases = {}
let errors = []

function loadConfig(){
  const oldCfgFile = './config.json'
  const cfgfile = './config/config.json'
  if (fs.existsSync(oldCfgFile)) {
    console.log('Copying config.json to new location in ./config')
    fs.renameSync(oldCfgFile, cfgfile)
  }
  if(fs.existsSync(cfgfile)){
    let cfg = JSON.parse(fs.readFileSync(cfgfile, 'utf8'))
    PREFIX = cfg.prefix
    GAME = cfg.game
    BOTDESC = cfg.description
    VOLUME = (typeof(cfg.volume) !== 'undefined')? cfg.volume : 0.3
    interruptCmd = cfg.stopcmd
    inviteCmd = cfg.invitecmd
    audioDir = cfg.directory
    commands = cfg.commands
    client.login(cfg.token)
    for(let cmd in commands) {
      if(typeof(commands[cmd].aliases) !== 'undefined'){
        for(let i=0;i<commands[cmd].aliases.length;i++){
          aliases[commands[cmd].aliases[i]] = cmd
        }
      }
    }
  }
  else{
    console.log('Oh no!!! '+cfgfile+' could not be found!')
  }
}

function updateCurrentGame(){
  client.user.setActivity(GAME)
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
  MENTIONPREFIX = '<@'+client.user.id+'> '
})

client.on('error', (err) => {
  let errText = 'ERROR: '+err.name+' - '+err.message
  console.log(errText)
  errors.push(errText)
  fs.writeFile('error.json',JSON.stringify(errors), function(err){
    if(err)
      console.log('error writing to error file: '+err.message)
  })
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

      if(command.argument !== null && typeof(aliases[command.argument]) !== 'undefined'){
        command.argument = aliases[command.argument]
      }

      if(command.argument === null ||
          (typeof(commands[command.argument]) === 'undefined') &&
          command.argument !== interruptCmd &&
          command.argument !== inviteCmd){
        let messages = []
        let thismessage = BOTDESC + '\n\nHere are the available commands:\n'
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

        sendHelpMessages(messages,message.channel,message.author)
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
        .catch(reason => {
          message.author.send(helpMessage).catch(reason => {
            console.log(reason)
          })
        })
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

        if(typeof(commands[command.argument].aliases) !== 'undefined'){
          thismessage += '\nAliases: \n'
          let aliasArr = commands[command.argument].aliases
          let first = true
          for(let i=0;i<aliasArr.length;i++){
            let thisAlias = '`' + aliasArr[i] + '`'
            if(!first){
              thisAlias = ', ' + thisAlias
            }
            if(thismessage.length + thisAlias.length > MAXMESSAGELENGTH){
              messages.push(thismessage)
              thismessage = thisAlias
            }
            else{
              thismessage += thisAlias
            }
            first = false
          }
          if(thismessage.length < MAXMESSAGELENGTH){
            thismessage += '\n'
          }
        }
        if(typeof(commands[command.argument].args) !== 'undefined'){
          let first = true
          let availArgs = 'Here are the available arguments:'
          if(thismessage.length + availArgs.length + ('\n'.length * 2) > MAXMESSAGELENGTH){
            messages.push(thismessage)
            thismessage = availArgs
          }
          else{
            thismessage += '\n'+availArgs+'\n'
          }
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
        sendHelpMessages(messages,message.channel,message.author)
      }
    }
    else if(command.type === inviteCmd){
		let richem = {
			embed: {
				author: {
          name: 'Invite '+client.user.username,
          iconURL: client.user.avatarURL
				},
				thumbnail: {
					url: client.user.avatarURL()
				},
				fields: [
					{
						name: 'Invite',
						value: "[Invite "+client.user.username+" to your server](https://discordapp.com/oauth2/authorize?client_id="+client.user.id+"&scope=bot)"
					},
					{
						name: 'Source Code',
						value: "Fork me on [GitHub](https://github.com/CorySanin/BotMaker-for-Discord)"
					}
				]
			}
		}
		message.channel.send(richem)
		.catch(reason => {
		  message.author.send(richem).catch(reason => {
			console.log(reason)
		  })
		})
    }
    else if(command.type !== null){
      updateCurrentGame()
      playCommand(command, message)
    }
  }
})

function sendHelpMessages(messages,channel,author){
  if(messages.length > 0){
    let thismessage = messages.shift()
    channel.send(thismessage)
    .catch(reason => {
      author.send(thismessage).catch(reason => {
        console.log(reason)
      })
    })
    setTimeout(function(){ sendHelpMessages(messages,channel,author) }, 1000)
  }
}

function playCommand(command, message){
  if(typeof(commands[command.type]) !== 'undefined'){
    let audios
    if(command.argument !== null &&
      typeof(commands[command.type].args) !== 'undefined' &&
      typeof(commands[command.type].args[command.argument]) !== 'undefined'){
      audios = commands[command.type].args[command.argument].audios
    }
    else{
      audios = commands[command.type].audios
    }
    let randomIndex = Math.floor(Math.random() * audios.length)
    let playerObj = {}
    playerObj.player = message.member
    playerObj.channel = message.member.voice.channel
    playerObj.type = command.type
    playerObj.file = path.join(audioDir, audios[randomIndex])

    if(message.member.voice.channel){
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
  let thisMentionPrefix = messageText.substring(0, MENTIONPREFIX.length)
  if(thisPrefix === PREFIX || thisMentionPrefix === MENTIONPREFIX){
    let allButPrefix = messageText.substring(PREFIX.length,messageText.length)
    if(thisMentionPrefix === MENTIONPREFIX){
      allButPrefix = messageText.substring(MENTIONPREFIX.length,messageText.length)
    }
    let split = allButPrefix.split(" ")
    if(split.length > 0){
      command.type = (typeof(aliases[split[0]]) !== 'undefined')? aliases[split[0]] : split[0]
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
      let dispatcher = connection.play(playerObj.file, {volume: VOLUME})
      playerObj.dispatcher = dispatcher
      playingNow[guild.id] = playerObj

      dispatcher.setVolume(VOLUME)

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
        console.log('dispatcher error:'+e)
        if(guilds[guild.id] && guilds[guild.id].length > 0){
          play(guild)
        }
        else{
          delete guilds[guild.id]
          delete playingNow[guild.id]
          connection.disconnect()
        }
      })

      //dispatcher.end() // End the dispatcher, emits 'end' event
    })
    .catch(reason => {
    console.log(reason)
    if(guilds[guild.id] && guilds[guild.id].length > 0){
      play(guild)
    }
    else{
      delete guilds[guild.id]
      delete playingNow[guild.id]
      if(typeof(connection) !== 'undefined'){
        connection.disconnect()
      }
    }
  })
}

loadConfig()
