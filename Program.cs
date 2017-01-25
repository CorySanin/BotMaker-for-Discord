using System;
using System.Collections.Generic;
using Discord;
using Discord.Commands;
using Discord.Audio;
using NAudio.Wave;
using System.Threading;
using System.Collections;
using System.Threading.Tasks;
using System.Xml;
using System.Windows.Forms;

namespace BotMaker
{
    class Program
    {
        private readonly string BASEDIR = config.ReadSetting("audiodir");
        static Dictionary<Discord.Server, bool> currentServerInfo = new Dictionary<Discord.Server, bool>();
        static Dictionary<Discord.Server, ulong> currentuid = new Dictionary<Discord.Server, ulong>();
        static Dictionary<Discord.Server, Queue> queue = new Dictionary<Server, Queue>();
        
        static void Main(string[] args) => new Program().Start(args);

        private DiscordClient _client;

        private void Log(object sender, LogMessageEventArgs e)
        {
            Console.WriteLine("DC.NET: " + e.Message);
        }

        public void Start(string[] args)
        {
            if (BASEDIR.Equals("") || (args.Length > 0 && args[0].Equals("-c") && config.ReadSetting("restarted").Equals("0")))
            {
                config cfg = new config();
                cfg.Focus();
                cfg.ShowDialog();
                config.AddUpdateAppSettings("restarted", "1"); //if launched with -c, when it restarts it will skip over this part
                Application.Restart();
            }
            else
            {
                config.AddUpdateAppSettings("restarted", "0");
                Console.Write("BotMaker by Cory Sanin (2017)\nConfig with -c argument.");
                _client = new DiscordClient(input =>
                {
                    input.LogLevel = LogSeverity.Info;
                    input.LogHandler = Log;
                });

                _client.UsingCommands(x =>
                {
                    x.PrefixChar = config.ReadSetting("prefixchar").ToCharArray()[0];
                    x.HelpMode = HelpMode.Public;
                });

                _client.UsingAudio(x => // Opens an AudioConfigBuilder so we can configure our AudioService
                {
                    x.Mode = AudioMode.Outgoing; // Tells the AudioService that we will only be sending audio
            });

                XmlDocument doc = new XmlDocument();
                doc.Load("commands.xml");

                XmlNodeList commands = doc.SelectNodes("/commands/command");

                Random rnd = new Random();

                for (int i = 0; i < commands.Count; i++)
                {
                    XmlNode cmd = commands.Item(i);
                    XmlNodeList listofalias = cmd.SelectNodes("alias/trigger/text()");
                    String[] aliass = new string[listofalias.Count];
                    for (int j = 0; j < listofalias.Count; j++)
                        aliass[j] = listofalias.Item(j).Value;
                    XmlNodeList listofaudio = cmd.SelectNodes("audios/audio/text()");
                    String[] audios = new string[listofaudio.Count];
                    for (int j = 0; j < listofaudio.Count; j++)
                        audios[j] = listofaudio.Item(j).Value;
                    XmlNode arg = cmd.SelectSingleNode("args");


                    var cmdguy = _client.GetService<CommandService>().CreateCommand(cmd.SelectSingleNode("trigger/text()").Value);
                    if(arg != null)
                    {
                        cmdguy.Parameter("argument", ParameterType.Optional);
                    }
                    cmdguy
                    .Description(cmd.SelectSingleNode("description/text()").Value)
                    .Alias(aliass)
                    .Do(e =>
                    {
                    _client.SetGame(new Game(config.ReadSetting("game"))); // make sure the game stays up-to-date
                    bool muststart = false;
                        Queue q;
                        if (!queue.TryGetValue(e.Server, out q))
                        {
                            q = new Queue();
                            queue.Add(e.Server, q);
                            muststart = true;
                        }
                        int a = rnd.Next(0, audios.Length);
                        String fname = BASEDIR + audios[a] + ".mp3";
                        if (arg != null)
                        {
                            String argument = e.GetArg("specify").ToLower();
                            XmlNodeList argresults = arg.SelectNodes("arg[contains(match,'" + argument + "')]");
                            if (argresults.Count == 1)
                            {
                                XmlNode argbasenode = argresults.Item(0);
                                XmlNode argfname = argbasenode.SelectSingleNode("audio/text()");
                                fname = BASEDIR + argfname.Value + ".mp3";
                            }
                        }
                        audioclip t = new audioclip(e.User.Id, e.User.VoiceChannel, fname, false);
                        bool isgood = true;
                        if (q.Count > 0)
                        {
                            Object[] currentQ = q.ToArray();
                            for (int inc = 0; inc < currentQ.Length && isgood; inc++)
                                isgood = !((audioclip)currentQ[inc]).isMatch(t.uid);
                        }
                        if (isgood)
                        {
                            q.Enqueue(t);
                            if (muststart)
                                handleQueue(e.Server);
                        }
                    });
                }

                _client.ExecuteAndWait(async () =>
                {
                    await _client.Connect(config.ReadSetting("bottoken"), TokenType.Bot);
                    _client.SetGame(new Game(config.ReadSetting("game")));
                });
            }
        }

        public Task SendAudio(string filePath, Channel c, ulong uid)
        {
            return Task.Run(
           async () =>
           {
               try
               {
                   AudioService audService = _client.GetService<AudioService>();

                   var channelCount = _client.GetService<AudioService>().Config.Channels; // Get the number of AudioChannels our AudioService has been configured to use.
                   var OutFormat = new WaveFormat(48000, 16, channelCount); // Create a new Output Format, using the spec that Discord will accept, and with the number of channels that our client supports.
                   using (var MP3Reader = new Mp3FileReader(filePath)) // Create a new Disposable MP3FileReader, to read audio from the filePath parameter
                   using (var resampler = new MediaFoundationResampler(MP3Reader, OutFormat)) // Create a Disposable Resampler, which will convert the read MP3 data to PCM, using our Output Format
                   {
                       resampler.ResamplerQuality = 60; // Set the quality of the resampler to 60, the highest quality
                       int blockSize = OutFormat.AverageBytesPerSecond / 50; // Establish the size of our AudioBuffer
                       byte[] buffer = new byte[blockSize];
                       int byteCount;
                       var cserv = await audService.Join(c);
                       bool term = false;
                       while (!term && (byteCount = resampler.Read(buffer, 0, blockSize)) > 0) // Read audio into our buffer, and keep a loop open while data is present
                       {
                           if (byteCount < blockSize)
                           {
                               // Incomplete Frame
                               for (int i = byteCount; i < blockSize; i++)
                                   buffer[i] = 0;
                           }
                           cserv.Send(buffer, 0, blockSize); // Send the buffer to Discord
                           if (currentServerInfo.TryGetValue(c.Server, out term))
                               currentServerInfo.Remove(c.Server);
                       }
                       Thread.Sleep(1000); // Prevents track from being cut off at the end
                   }
               }
               catch
               {
                   Console.Write("Oh no! Something went horribly wrong.\n");
               }
           });
        }

        public async void handleQueue(Server s)
        {
            AudioService audService = _client.GetService<AudioService>();
            Queue q;
            if (!queue.TryGetValue(s, out q))
            {
                q = new Queue();
                queue.Add(s, q);
            }
            Console.Write("Connecting to server  " + s.Name + "\n");
            while (q.Count > 0)
            {
                audioclip t = (audioclip)q.Dequeue();
                Console.Write("playing " + t.audio + " in  " + t.channel.Name + "\n");
                currentuid.Add(s, t.uid);
                await SendAudio(t.audio, t.channel, t.uid);
                currentuid.Remove(s);
            }
            Console.Write("Leaving server  " + s.Name + "\n");
            queue.Remove(s);
            await audService.Leave(s);
        }
    }
}
