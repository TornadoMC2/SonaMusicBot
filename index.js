const Discord = require('discord.js');
const yt = require('ytdl-core');
//const tokens = require('./tokens.json');
const client = new Discord.Client();
const prefix = "s>>"

function clean(text) {
  if (typeof(text) === "string")
    return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
  else
      return text;
}

const http = require('http');
const express = require('express');
const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

let queue = {};
let nowPlaying = {};

const commands = {
	'play': async (msg) => {
    if(msg.author.bot) return
    //console.log(queue)
		//if (queue[msg.guild.id] === undefined) return msg.channel.send(`Add some songs to the queue first with ${prefix}add`);
    if (!msg.member.voice.channel) return msg.channel.send(":x: **You have to be in a voice channel to use this command.**")
    if (queue[msg.guild.id] == null || queue[msg.guild.id] == undefined) return msg.channel.send("Please add a song using s>>add")
    
      if (!msg.guild.voice) return commands.join(msg).then(() => commands.play(msg));
      if (queue[msg.guild.id].playing) return msg.channel.send('Already Playing, Please use pause or resume commands to pause or resume the music');
      let dispatcher;
      queue[msg.guild.id].playing = true;

      //console.log(queue);
      (async function play(song) {
        //console.log(song);
        let queueEmpty = new Discord.MessageEmbed()
        .setColor('RED')
        
        if (song === undefined) return msg.channel.send('Queue is empty').then(() => {
          queue[msg.guild.id].playing = false;
          nowPlaying = {};
          msg.member.voice.channel.leave();
        });
        nowPlaying = {"url": song.url, "title": song.title, "requester": song.requester}
        let musicEmbed = new Discord.MessageEmbed()
        .setTitle("🎶 Now Playing:")
        .setColor("BLUE")
        .addField("Name:", `${song.title}`)
        .addField("Requsted by:", song.requester)
        //msg.channel.sendMessage(`Playing: **${song.title}** as requested by: **${song.requester}**`);
        msg.channel.send(musicEmbed)
        let connection = await msg.member.voice.channel.join();
        let dispatcher = await connection.play(yt(song.url, { audioonly: true }))
        let collector = msg.channel.createMessageCollector(m => m);
        collector.on('collect', m => {
          if (m.content.startsWith(prefix + 'pause')) {
            //let djrole = msg.guild.roles.cache.find(r => r.name === "dj");
            //if(msg.member.roles.cache.has(djrole.id) || msg.author.id == process.env.OWNERID) {
            if(msg.member.voice.channel !== msg.guild.voice.connection.channel) return msg.channel.send(":x: **You have to be in the same channel as Aria to use this command.**")
            msg.channel.send(':pause_button: Paused').then(() => {dispatcher.pause();});
            //} else {
            // msg.channel.send("You need the ``dj`` role or ``bot owner`` permission to do that!") 
            //}
          } else if (m.content.startsWith(prefix + 'resume')){
            //let djrole = msg.guild.roles.cache.find(r => r.name === "dj");
            //if(msg.member.roles.cache.has(djrole.id) || msg.author.id == process.env.OWNERID) {
            if(msg.member.voice.channel !== msg.guild.voice.connection.channel) return msg.channel.send(":x: **You have to be in the same channel as Aria to use this command.**")
            msg.channel.send(':arrow_forward: Resumed!').then(() => {dispatcher.resume();});
            //} else {
             //msg.channel.send("You need the ``dj`` role or ``bot owner`` permission to do that!") 
            //}
          } else if (m.content.startsWith(prefix + 'skip') || m.content.startsWith(prefix + 'next')){
            //let djrole = msg.guild.roles.cache.find(r => r.name === "dj");
            //if(msg.member.roles.cache.has(djrole.id) || msg.author.id == process.env.OWNERID) {
            if(msg.member.voice.channel !== msg.guild.voice.connection.channel) return msg.channel.send(":x: **You have to be in the same channel as Aria to use this command.**")
            msg.channel.send(':play_pause: Skipped!').then(() => {
              dispatcher.destroy();
              play(queue[msg.guild.id].songs.shift());
              collector.stop();
            });
            //} else {
             //msg.channel.send("You need the ``dj`` role or ``bot owner`` permission to do that!")
            //}
          } else if (m.content.startsWith(prefix + 'volume+')){
            if (Math.round(dispatcher.volume*50) >= 100) return msg.channel.send(`Volume: ${Math.round(dispatcher.volume*50)}%`);
            dispatcher.setVolume(Math.min((dispatcher.volume*50 + (2*(m.content.split('+').length-1)))/50,2));
            msg.channel.send(`Volume: ${Math.round(dispatcher.volume*50)}%`);
          } else if (m.content.startsWith(prefix + 'volume-')){
            if (Math.round(dispatcher.volume*50) <= 0) return msg.channel.send(`Volume: ${Math.round(dispatcher.volume*50)}%`);
            dispatcher.setVolume(Math.max((dispatcher.volume*50 - (2*(m.content.split('-').length-1)))/50,0));
            msg.channel.send(`Volume: ${Math.round(dispatcher.volume*50)}%`);
          } else if (m.content.startsWith(prefix + 'volume')) {
            let setVolumeTo = parseInt(m.content.split(' ').join(" "))*50
            if(setVolumeTo >= 100) {
              dispatcher.setVolume(Math.min((dispatcher.volume*50 + 2*(100))/50,2));
              msg.channel.send(`Volume: ${Math.round(dispatcher.volume*50)}%`);
            } else if(setVolumeTo <= 0) {
              dispatcher.setVolume(Math.min((dispatcher.volume*50 - 2*(0))/50,0));
              msg.channel.send(`Volume: ${Math.round(dispatcher.volume*50)}%`);
            } else {
              dispatcher.setVolume(Math.min(setVolumeTo));
              msg.channel.send(`Volume: ${Math.round(dispatcher.volume*50)}%`);
            }
            //dispatcher.setVolume(Math.min((dispatcher.volume*50 + 2*(setVolumeTo)/50)));
          } else if (m.content.startsWith(prefix + 'volume')) {
            msg.channel.send(`Volume: ${Math.round(dispatcher.volume*50)}%`);
          } else if (m.content.startsWith(prefix + 'time')){
            
            let totalSeconds = Math.floor(dispatcher.streamTime/1000)
            let hours = Math.floor(totalSeconds / 3600);
            totalSeconds %= 3600;
            let minutes = Math.floor(totalSeconds / 60);
            let seconds = totalSeconds % 60;
            minutes = String(minutes).padStart(2, "0");
            hours = String(hours).padStart(2, "0");
            seconds = String(seconds).padStart(2, "0");
            
            msg.channel.send(`${(hours > 0 ? `${hours}:` : ``)}${minutes}:${seconds} / ${song.timestamp}`)
            
          } else if (m.content.startsWith(prefix + "nowplaying") || m.content.startsWith(prefix + "np")) {
            //console.log(song)
            const elapsed = Math.round((dispatcher.streamTime % (song.seconds*1000)) / (song.seconds*1000) * 30)
            const bar = `${(elapsed - 1 >= 0 ? `${'▬'.repeat(elapsed-1)}` : ``)}🔘${'▬'.repeat(30-(elapsed+1))}`
            
            let totalSeconds = Math.floor(dispatcher.streamTime/1000)
            let hours = Math.floor(totalSeconds / 3600);
            totalSeconds %= 3600;
            let minutes = Math.floor(totalSeconds / 60);
            let seconds = totalSeconds % 60;
            seconds = String(seconds).padStart(2, "0");
            
           //msg.channel.send(`Playing: **${song.title}** as requested by: **${song.requester}**`) 
            let musicEmbed = new Discord.MessageEmbed()
            //.setTitle("🎶 Now Playing:")
            .setAuthor(`Now Playing`, '', 'https://discord.gg/3EyJ9JH')
            .setDescription(`[${song.title}](${song.url})\n\n\`${bar}\`\n\n\`${(hours > 0 ? `${hours}:` : ``)}${minutes}:${seconds} / ${song.timestamp}\`\n\n\`Requested by:\` ${song.requester}`)
            .setColor("#7734eb")
            //msg.channel.sendMessage(`Playing: **${song.title}** as requested by: **${song.requester}**`);
            msg.channel.send(musicEmbed)
          } else if (m.content.startsWith(prefix + 'move')) {
            let args = m.content.split(" ").slice(1)
            console.log(args)
            if(!args[0] || isNaN(+args[0])) return msg.channel.send('Please specify the position of the song to move to the front')
            var first = queue[msg.guild.id].songs[parseInt(args[0])-1];
            console.log(first)
            if(first == undefined) return msg.channel.send('Please choose a song that is in the queue')
            queue[msg.guild.id].songs.sort(function(x,y){ return x == first ? -1 : y == first ? 1 : 0; });
            //console.log(queue[msg.guild.id].songs)
            msg.channel.send(`**:white_check_mark: Moved** \`${first.title}\`** to position 1**`)
          }
        });
        dispatcher.on('finish', () => {
          console.log("pp")
          let next = queue[msg.guild.id].songs.shift()
          console.log(next)
          play(next);
          collector.stop();
          //console.log(queue[msg.guild.id].songs.shift())
        });
        dispatcher.on('error', (err) => {
          return msg.channel.send('error: ' + err).then(() => {
            play(queue[msg.guild.id].songs.shift());
            collector.stop();
          });
        });
      })(queue[msg.guild.id].songs.shift());
	},
	'join': (msg) => {
    if(msg.author.bot) return
		return new Promise((resolve, reject) => {
			const voiceChannel = msg.member.voice.channel;
			if (!voiceChannel || voiceChannel.type !== 'voice') return msg.reply('I couldn\'t connect to your voice channel...');
			voiceChannel.join().then(connection => msg.channel.send(`Joined channel ${voiceChannel}`) && resolve(connection)).catch(err => reject(err));
		});
	},
	'add': async (message) => {
    if(message.author.bot) return
		let url = message.content.split(' ')[1];
		if (url == '' || url === undefined) return message.channel.send(`You must add a YouTube video url or search keyword after ${prefix}add`);
	  const search = require('yt-search')
    let args = message.content.split(" ").slice(1)
    if(args == '' || args === undefined) return message.channel.send(`Please add a search keyword after ${prefix}search`)
    
    const ytpl = require('ytpl')
    //const playlistString = await ytpl.getPlaylistID()
    const playlist = await ytpl(url).then(async (list) => {
      if (!queue.hasOwnProperty(message.guild.id)) queue[message.guild.id] = {}, queue[message.guild.id].playing = false, queue[message.guild.id].songs = [];
      let musicEmbed = new Discord.MessageEmbed()
      .setAuthor(`Playlist Added to queue`, message.author.avatarURL(), 'https://discord.gg/3EyJ9JH')
      .setTitle(`${list.title}`)
      .setURL(list.url)
      .setThumbnail(list.bestThumbnail.url)
      //.setColor("BLUE")
      //.addField("Name:", `${this.videos[parseInt(m.content)-1].title}`)
      //.addField("Requsted by:", message.author.tag)
      //.addField("Channel", this.videos[parseInt(m.content)-1].author.name)
			.addField("Position in queue", queue[message.guild.id].songs.length, true)
      .addField("Amount Added", `\`${list.items.length}\``, true)
      
      for(var i in list.items) {
        queue[message.guild.id].songs.push({url: list.items[i].shortUrl, title: list.items[i].title, requester: message.author.username, timestamp: list.items[i].duration, seconds: list.items[i].durationSec})
      }
      
      return message.channel.send(musicEmbed)
    }).catch(async () => {
    
    await search(args.join(" "), (err, res) => {
     if(err) return message.channel.send("Invalid: " + err)
     // message.channel.send(" **Searching :mag_right:** ``" + message.content.slice(prefix.length).split(" ").slice(1).join(" ") + "``")
      if (!queue.hasOwnProperty(message.guild.id)) queue[message.guild.id] = {}, queue[message.guild.id].playing = false, queue[message.guild.id].songs = [];
      
      let videos = res.videos.slice(0, 10)
      
      let resp = ''
      for(var i in videos) {
        resp += `**[${parseInt(i)+1}]:** \`${videos[i].title}\`\n`
      }
      
      let searching = message.guild.emojis.cache.find(e => e.name == "search")
      
      let embed = new Discord.MessageEmbed()
        .setColor("GREEN")
        .addField(`**${searching} Searching for song/video**` + "``" + message.content.slice(prefix.length).split(" ").slice(1).join(" ") + "``", resp += `\n**Chose a number between** \`1-${videos.length}\` \n \n Type \`cancel\` to cancel the command`)
        
      //resp += `\n**Chose a number between** \`1-${videos.length}\``
      
      message.channel.send(embed)
      
      const filter = m => !isNaN(m.content) && m.content < videos.length+1 && m.content > 0 || m.content == "cancel"
      
      const collector = message.channel.createMessageCollector(filter)
      
      collector.videos = videos
      
      collector.once("collect", function(m) {
        if(m.content == "cancel") return message.channel.send("Command Canceled")
        //console.log(this.videos[parseInt(m.content)-1])
        queue[message.guild.id].songs.push({url: this.videos[parseInt(m.content)-1].url, title: this.videos[parseInt(m.content)-1].title, requester: message.author.username, timestamp: this.videos[parseInt(m.content)-1].timestamp, seconds: this.videos[parseInt(m.content)-1].seconds})
        let musicEmbed = new Discord.MessageEmbed()
        .setAuthor(`Added to queue`, message.author.avatarURL(), 'https://discord.gg/3EyJ9JH')
        .setTitle(`${this.videos[parseInt(m.content)-1].title}`)
        .setURL(this.videos[parseInt(m.content)-1].url)
        .setThumbnail(this.videos[parseInt(m.content)-1].thumbnail)
        //.setColor("BLUE")
        //.addField("Name:", `${this.videos[parseInt(m.content)-1].title}`)
        //.addField("Requsted by:", message.author.tag)
        .addField("Channel", this.videos[parseInt(m.content)-1].author.name)
        .addField("Song Duration", this.videos[parseInt(m.content)-1].timestamp)
			  .addField("Position in queue", queue[message.guild.id].songs.length)
      //msg.channel.sendMessage(`Playing: **${song.title}** as requested by: **${song.requester}**`);
      message.channel.send(musicEmbed)
      })
      

    }) 
  })
	},
	'queue': (msg) => {
    if(msg.author.bot) return
    let noQueue = new Discord.MessageEmbed()
    .setTitle(`Queue for ${msg.guild.name}`)
    .setURL('https://discord.gg/3EyJ9JH')
    .setDescription(`__Now Playing:__\nNothing, add something to the queue with ${prefix}add!`)
    .setFooter(`Command Requested by ${msg.author.username}`, msg.author.avatarURL())
    .setColor("GREEN")
		if (queue[msg.guild.id] === undefined) return msg.channel.send(noQueue)//msg.channel.send(`There is nothing playing in the server right now!\nAdd something with ${prefix}add`);
    let queueEmbed = new Discord.MessageEmbed()
    .setColor("BLUE")
    .setTitle(`Queue for ${msg.guild.name}`)
    .setURL('https://discord.gg/3EyJ9JH')
    //.setAuthor(`Queue for ${msg.guild.name}`, msg.guild.iconURL(), 'https://discord.gg/3EyJ9JH')
    
		let tosend = [];
    if(nowPlaying.title == undefined) {
      if(queue[msg.guild.id].songs.length == 0) {
        queueEmbed.setColor("GREEN")
        tosend.push(`Nothing, add something to the queue with ${prefix}add!\n`)
      } else {
        tosend.push(`Nothing, start playing your song with ${prefix}play!\n`)
      }
    } else { tosend.push(`[${nowPlaying.title}](${nowPlaying.url}) | \`Requested by: ${nowPlaying.requester}\`\n`); }
		queue[msg.guild.id].songs.forEach((song, i) => { 
      
      tosend.push(`${(i == 0 ? '\n__Up Next:__\n' : '')}\`${i+1}.\` [${song.title}](${song.url}) | \`Requested by: ${song.requester}\`\n\n`);
    
    });
    queueEmbed.setDescription(`__Now Playing:__\n${tosend[0]}${(tosend.length-1 > 7 ? `${tosend.slice(1,8).join('\n')}` : `${tosend.slice(1,tosend.length).join('\n')}`)}${(tosend.length-1 == 0 ? "" : `**${tosend.length-1} songs in queue**`)}`)
    queueEmbed.setFooter(`${(tosend.length-1 > 7 ? `Command Requested by ${msg.author.username} | *[Only next 7 songs shown]*` : `Command Requested by ${msg.author.username}`)}`, msg.author.avatarURL())
    msg.channel.send(queueEmbed)
		//msg.channel.send(`__**${msg.guild.name}'s Music Queue:**__ Currently **${tosend.length}** songs queued ${(tosend.length > 15 ? '*[Only next 15 shown]*' : '')}\n\`\`\`${tosend.slice(0,15).join('\n')}\`\`\``);
	},
	'help': (msg) => {
    if(msg.author.bot) return
    if (msg.channel.type == "dm") return;
    let hEmbed = new Discord.MessageEmbed()
    .setColor("GREEN")
    .setTitle("Commands that work all the time:")
    .addField(prefix + 'join', 'Join Voice channel of msg sender')
    .addField(prefix + 'add', 'Add a valid youtube link or search for a song to add to the queue')
    .addField(prefix + 'queue', 'Shows the current queue, up to 15 songs shown.')
    .addField(prefix + "play", 'Play the music queue if already joined to a voice channel')
    let hEmbed2 = new Discord.MessageEmbed()
    .setColor("RED")
    .setTitle("Commands that will only work while that play command is running:")
    .addField(prefix + "pause", "pauses the music")
    .addField(prefix + "resume", "resumes the music")
    .addField(prefix + "skip", "skips the song")
    .addField(prefix + "time", "shows the time elapsed in the song")
    .addField(prefix + "nowplaying", "shows the song that is playing at the moment")
    .addField(prefix + "volume-(---)", "decreases volume by 2%")
    .addField(prefix + "volume+(+++)", "increase volume by 2%")
    .setFooter("pause, resume and skip commands require a role named dj in your server")
		let tosend = ['```xl', prefix + 'join : "Join Voice channel of msg sender"', prefix + 'add : "Add a valid youtube link or search for a song to add to the queue"', prefix + 'queue : "Shows the current queue, up to 15 songs shown."', prefix + 'play : "Play the music queue if already joined to a voice channel"', '', 'the following commands only function while the play command is running:'.toUpperCase(), prefix + 'pause : "pauses the music"',	prefix + 'resume : "resumes the music"', prefix + 'skip : "skips the playing song"', prefix + 'time : "Shows the playtime of the song."',	prefix + 'nowplaying : "shows the song that is playing at the moment"', prefix + 'volume+(+++) : "increases volume by 2%/+"',	prefix + 'volume-(---) : "decreases volume by 2%/-"',	'```'];
		//msg.channel.sendMessage(tosend.join('\n'));
    msg.channel.send(":white_check_mark: Check your DM's!").then(() => {
    msg.author.send(hEmbed)
    msg.author.send(hEmbed2) 
    })
	},
	'reboot': (msg) => {
    if(msg.author.bot) return
		if (msg.author.id == process.env.OWNERID) process.exit().then(() => {
     msg.channel.send("Rebooted") 
    }).catch(error => {
     msg.channel.send(error) 
    }) //Requires a node module like Forever to work.
	},
  'leave': (msg) => {
    if(msg.author.bot) return
    msg.member.voice.channel.leave();
  }
};

client.on('ready', () => {
	console.log('ready!'); queue
  client.user.setActivity(`for ${prefix}help on ` + client.guilds.cache.size + " servers", {type: "WATCHING"})
});

client.on('message', message => {
  if(message.author.bot) return
	if (!message.content.startsWith(prefix)) return;
	if (commands.hasOwnProperty(message.content.toLowerCase().slice(prefix.length).split(' ')[0])) commands[message.content.toLowerCase().slice(prefix.length).split(' ')[0]](message);
  if (message.content.startsWith(prefix + "eval")) {
      const args = message.content.split(" ").slice(1);
    if(message.author.id !== "425624104901541888") return message.channel.send("Owner only command") && console.log(message.author.tag + " tried to run the Eval Command")
    try {
      const code = args.join(" ");
      let evaled = eval(code);
 
      if (typeof evaled !== "string")
        evaled = require("util").inspect(evaled);
 
      message.channel.send(clean(evaled), {code:"xl"});
    } catch (err) {
      message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
    }
  }
});
client.login(process.env.SECRET);