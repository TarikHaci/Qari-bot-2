const config = require("./config.json");
const discord = require("discord.js");
const ytdl = require("ytdl-core");
const discordBot = new discord.Client();
const utils = require("./utils.js");
const { google } = require("googleapis");
var youtube = google.youtube({
  version: "v3",
  auth: config.youtubeToken
});

discordBot.on("ready", () => {
  try {
    discordBot.user.setActivity("'help", { type: "LISTENING" });
    utils.log(
      "Discord Bot Startup",
      "info",
      `Logged in as ${discordBot.user.tag}!`
    );
  } catch (error) {
    utils.log("Discord Bot Startup", "error", error.message);
  }
});

const ytExp = /\?v=(.+)/g;
var queue = [];
var dispatcher = null;
var voiceChannel = null;
var playing = false;
var index = 0;
var connection = null;

discordBot.on("message", async message => {
  if (message.author.bot) return;
  var x = "";
  x = message.content.substr(message.content.indexOf(" ") + 1).toLowerCase();
  if (message.content === "'on") {
    try {
      if (queue.length > 0) {
        if (!playing) {
          voiceChannel = message.member.voice.channel;
          if (voiceChannel !== null) {
            voiceChannel
              .join()
              .then(channelConnection => {
                connection = channelConnection;
                loop();
              })
              .catch(function(error) {
                utils.log("start", "error", error.message);
                playing = false;
              });
          } else {
            message.reply("Please join a voice channel to start the Radio");
            playing = false;
          }
        } else {
          message.reply("Radio is already turned on!");
        }
      } else {
        message.reply(
          "No songs found! Please add some songs first using '+add command."
        );
      }
    } catch (error) {
      utils.log("start", "error", error.message);
      playing = false;
    }
    playing = false;
  } else if (
    x !== "" &&
    (message.content.indexOf("'add") === 0 || message.content.indexOf("'a")) ===
      0
  ) {
    if (x.indexOf("youtu.be/") > 0) {
      x.replace("youtu.be/", "youtube.com/watch?v=");
    }
    var match = ytExp.exec(x);
    if (match) {
      ytdl.getInfo(x, function(error, info) {
        var song = { id: info, title: info.title.replace(/\&(.*?)\;/g, "") };
        queue.push(song);
        message.reply(song.title + " added to queue. Index: " + queue.length);
        if (error) {
          message.reply("Invalid URL!");
        }
      });
    } else {
      youtube.search.list(
        {
          part: "snippet",
          type: "video",
          q: x
        },
        function(error, response) {
          if (error) {
            utils.log("add", "error", error.message);
            message.reply("No songs found!");
          }
          if (response) {
            var item = response.data.items[0];
            var song = {
              id: item.id.videoId,
              title: item.snippet.title.replace(/\&(.*?)\;/g, "")
            };
            queue.push(song);
            message.reply(song.title + " added to queue.");
          }
        }
      );
    }
  } else if (
    message.content.indexOf("'remove") === 0 ||
    message.content.indexOf("'r") === 0
  ) {
    if (queue[x] != null) {
      var title = queue[x].title;
      queue.splice(x, 1);
      message.reply("#" + x + ": " + title + " removed from queue.");
    } else {
      message.reply("No song found at index: " + i);
    }
  } else if (
    x !== "" &&
    (message.content.indexOf("'play") === 0 ||
      message.content.indexOf("'p") === 0)
  ) {
    if (queue[x] != null) {
      if (playing) {
        index = x;
        loop();
      } else {
        message.reply(
          "Radio is still turned off! Start it using 'start command"
        );
      }
    } else {
      message.reply("No song found at index: " + i);
    }
  } else if (
    message.content.indexOf("'next") === 0 ||
    message.content.indexOf("'n") === 0
  ) {
    if (playing) {
      index++;
      if (index >= queue.length) {
        index = 0;
      }
      loop();
    } else {
      message.reply("Radio is still turned off! Start it using 'start command");
    }
  }
  if (
    x === "" &&
    (message.content.indexOf("'prev") === 0 ||
      message.content.indexOf("'p") === 0)
  ) {
    if (playing) {
      index--;
      if (index < 0) {
        index = queue.length;
      }
      loop();
    } else {
      message.reply("Radio is still turned off! Start it using 'start command");
    }
  } else if (
    message.content.indexOf("'queue") === 0 ||
    message.content.indexOf("'q") === 0
  ) {
    if (queue.length == 0) {
      message.reply("The queue is empty!");
    } else {
      var msg = "";
      var i = 0;
      queue.forEach(song => {
        msg += "#" + i + ": " + song.title + "\n";
        i++;
      });
      message.channel.send(msg);
    }
  } else if (
    message.content.indexOf("'current") === 0 ||
    message.content.indexOf("'c") === 0
  ) {
    message.reply(queue[index].title + " is now playing");
  } else if (message.content === "'off") {
    if (voiceChannel !== null) {
      voiceChannel.leave();
      dispatcher = null;
      voiceChannel = null;
    }
  }
  if (
    message.content.indexOf("'help") === 0 ||
    message.content.indexOf("'h") === 0
  ) {
    var msg =
      "'on: turn on the radio" +
      "'add x or 'a x: add a song using a link or search by title" +
      "'remove x or 'r x: remove a song from the queue at index x" +
      "'play x or 'p x: play a song from the queue at index x" +
      "'next or 'n: play the next song in the queue" +
      "'prev or 'p: play the previous song in the queue" +
      "'queue or 'q: show the queue" +
      "'current or 'c: show currently playing song" +
      "'off: to turn of the radio";
  }
});

async function loop() {
  while (true) {
    await playSong(connection, index)
      .then(function(i) {
        index = i;
      })
      .catch(function(error) {
        utils.log("loop", "error", error.message);
      });
  }
}

function playSong(connection, index) {
  return new Promise(function(resolve, reject) {
    try {
      if (connection != null && queue[index] != null) {
        var id = queue[index].id;
        var title = queue[index].title;
        discordBot.user.setActivity(title, { type: "LISTENING" });
        playing = true;
        dispatcher = connection.play(ytdl(id, { filter: "audioonly" }));
        dispatcher.on("end", end => {
          index++;
          if (index >= queue.length) {
            index = 0;
          }
          resolve(index);
        });
      }
    } catch (error) {
      reject(error);
    }
  });
}

discordBot.login(config.token);
