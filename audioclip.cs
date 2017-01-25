using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BotMaker
{
    class audioclip
    {
        public string audio;
        public ulong uid;
        public Discord.Channel channel;
        public bool isMVP;

        public audioclip(ulong id, Discord.Channel c, string filename, bool mvp)
        {
            uid = id;
            channel = c;
            audio = filename;
            isMVP = mvp;
        }

        public bool isMatch(ulong id)
        {
            return id == uid;
        }
    }
}
