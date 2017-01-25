using System;
using System.Windows.Forms;
using System.Configuration;

namespace BotMaker
{
    public partial class config : Form
    {
        public config()
        {
            InitializeComponent();
        }

        private void txtPrefix_TextChanged(object sender, EventArgs e)
        {
            if(txtPrefix.Text.Length > 1)
            {
                txtPrefix.Text = txtPrefix.Text.ToCharArray()[txtPrefix.Text.Length-1] + "";
                txtPrefix.SelectAll();
            }
        }

        private void config_Load(object sender, EventArgs e)
        {
            txtDir.Text = ReadSetting("audiodir");
            txtPrefix.Text = ReadSetting("prefixchar");
            txtGame.Text = ReadSetting("game");
            txtToken.Text = ReadSetting("bottoken");
        }

        public static String ReadSetting(string key)
        {
            try
            {
                var appSettings = ConfigurationManager.AppSettings;
                string result = appSettings[key] ?? "ERR";
                return result;
            }
            catch (ConfigurationErrorsException)
            {
                return "ERR";
            }
        }

        public static void AddUpdateAppSettings(string key, string value)
        {
            try
            {
                var configFile = ConfigurationManager.OpenExeConfiguration(ConfigurationUserLevel.None);
                var settings = configFile.AppSettings.Settings;
                if (settings[key] == null)
                {
                    settings.Add(key, value);
                }
                else
                {
                    settings[key].Value = value;
                }
                configFile.Save(ConfigurationSaveMode.Modified);
                ConfigurationManager.RefreshSection(configFile.AppSettings.SectionInformation.Name);
            }
            catch (ConfigurationErrorsException)
            {
                Console.WriteLine("Error writing app settings");
            }
        }

        private void btnSave_Click(object sender, EventArgs e)
        {
            AddUpdateAppSettings("audiodir", txtDir.Text);
            AddUpdateAppSettings("prefixchar", txtPrefix.Text);
            AddUpdateAppSettings("game", txtGame.Text);
            AddUpdateAppSettings("bottoken", txtToken.Text);
            this.Close();
        }
    }
}
