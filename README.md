# BotMaker for Discord
### Make your own Discord audio-playing bot with ease!
Make an audio-playing bot for Discord (like Airhorn Solutions) without messing with any source code! All you have to do is put all your audio files into a single folder, write up a commands.xml, and run the bot. There's really nothing to it.

This is what your commands.xml might look like:
```XML
<commands>
	<command>
		<trigger>trigger</trigger>
		<alias>
			<trigger>altTrigger1</trigger>
			<trigger>altTrigger2</trigger>
        </alias>
        <description>Describe the command</description>
        <audios><!--If there is more than one, an audio file is chosen at random-->
			<audio>audio1</audio><!--if this case is selected, audio1.mp3 in the audio folder will play-->
			<audio>audio2</audio>
		</audios>
        <args><!--This part is optional-->
        	<arg><!--audio1.mp3 will play when "!trigger numberOne" is called in Discord-->
            	<match>numberOne</match>
                <audio>audio1</audio>
            </arg>
            <arg>
                <match>somethingElse</match>
                <audio>newAudio</audio><!--the audio file can be exclusive to an argument-->
            </arg>
            <arg><!--If there is more than one, an audio file is chosen at random-->
				<match>randomArg</match>
				<audio>audio1</audio>
				<audio>audio2</audio>
				<audio>audio3</audio>
            </arg>
        </args>
    </command>
	<command>
	   <!--put another command here-->
	</command>
</commands>
```

This is worst case scenario. Your commands.xml may look simpler.
If you are ready to try it out, go to the [releases](https://github.com/CoryZ40/BotMaker-for-Discord/releases/latest) and grab the latest version
