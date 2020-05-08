# RadioBot

🤖 A music discord bot
This project is still under development

## Install node.js
### On Ubuntu
- `sudo apt install nodejs npm`
### On Windows
Download and install the latest stable version from https://nodejs.org/en/
## Install ffmpeg
### On Ubuntu
- `sudo apt-get install ffmpeg`
### On Windows
- Download ffmpeg 64-bit build from http://ffmpeg.zeranoe.com/builds/
- Unzip it and add its dirctory `[path]ffmpeg\bin` to the Path variable in the System Environment Variables
## Config
* token: discord token
* youtubeToken: youtube token to search and get video links
## Commands
* 'on : Turn the radio on, the bot will join your audio channel
* 'add : add youtube links to the queue
* 'remove : remove youtube links to the queue
* 'play : play songs
* 'next : skip to next song
* 'prev : go to previous song
* 'queue : get the queue list
* 'current : show what is currently playing
* 'off : turn the readio off, bot will leave the channel
* 'help : explore all commands
## Running the bot
`node radio.js`
