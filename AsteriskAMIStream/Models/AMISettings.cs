namespace AsteriskAMIStream.Models
{
    public class AMISettings
    {
        public string Host { get; set; }
        public int Port { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string NodeNumber { get; set; }
        public int TimeoutMinutes { get; set; } // Timeout in minutes
    }

    public class Config
    {
        public List<AMISettings> AMISettings { get; set; }
    }

}
