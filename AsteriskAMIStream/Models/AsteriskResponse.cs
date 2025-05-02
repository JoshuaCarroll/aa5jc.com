namespace AsteriskAMIStream.Models
{
    using AsteriskAMIStream.Services;
    using System;
    using System.Text.RegularExpressions;

    public class AsteriskResponse
    {
        public string RawOutput { get; set; }
        public string Response { get; set; }
        public string ActionID { get; set; }
        public string Message { get; set; }
        public string Node { get; set; }
        public List<AsteriskConnection> Connections { get; set; }

        public AsteriskResponse(string rawMessage = "")
        {
            RawOutput = rawMessage;
            Connections = new List<AsteriskConnection>();

            // Parse the raw message into a structured format if needed
            if (!string.IsNullOrEmpty(rawMessage) && !rawMessage.StartsWith("Asterisk Call Manager"))
            {
                ParseMessage(rawMessage);
            }
        }

        private void ParseMessage(string rawMessage)
        {
            // Regex pattern to match key-value pairs (e.g., "Response: Success")
            var regex = new Regex(@"(?<=^|\r\n)(Response|ActionID|Message|Node|Conn|LinkedNodes|RPT_LINKS):\s*(.*?)\r?\n", RegexOptions.Multiline);

            foreach (Match match in regex.Matches(rawMessage))
            {
                var key = match.Groups[1].Value;
                var value = match.Groups[2].Value;

                switch (key)
                {
                    case "Response":
                        Response = value;
                        break;
                    case "ActionID":
                        ActionID = value;
                        break;
                    case "Message":
                        Message = value;
                        break;
                    case "Node":
                        Node = value;
                        break;
                    case "Conn":
                        try
                        {
                            var newConnection = new AsteriskConnection
                            {
                                Node = value.Substring(0, 10).Trim(),
                                IpAddress = value.Substring(10, 20).Trim(),
                                SomeNumber = value.Substring(30, 12).Trim(),
                                Direction = value.Substring(42, 11).Trim(),
                                TimeConnected = value.Substring(53, 20).Trim(),
                                Status = value.Substring(73, 20).Trim(),
                                Type = "Direct"
                            };

                            newConnection.GetMetadata();

                            Connections.Add(newConnection);
                        }
                        catch (Exception)
                        {
                            Console.WriteLine("** Error parsing connection data:");
                            Console.WriteLine($"** {value}");
                        }

                        break;
                    case "LinkedNodes":
                        var arrLinkedNodes = value.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                        foreach (var node in arrLinkedNodes)
                        {
                            Connections.Add(new AsteriskConnection
                            {
                                Node = node.Trim(),
                                Type = "Linked"
                            });
                        }
                        break;
                }
            }
        }
    }

    public class AsteriskConnection()
    {
        public string Node { get; set; }
        public string IpAddress { get; set; }
        public string SomeNumber { get; set; }
        public string Direction { get; set; }
        public string TimeConnected { get; set; }
        public string Status { get; set; }
        public string Type { get; set; }
        public string CallSign { get; set; }
        public string Location { get; set; }
        public string Info1 { get; set; }
        public string Info2 { get; set; }
        public string Latitude { get; set; }
        public string Longitude { get; set; }

        public void GetMetadata()
        {
            // Fetch metadata for the node
            var metadata = MetadataService.GetNodeMetadata(Node);
            if (metadata != null)
            {
                CallSign = metadata.CallSign;
                Location = metadata.Location;
                Info1 = metadata.Info1;
                Info2 = metadata.Info2;
                Latitude = metadata.Latitude.ToString();
                Longitude = metadata.Longitude.ToString();
            }
        }
    }

}
