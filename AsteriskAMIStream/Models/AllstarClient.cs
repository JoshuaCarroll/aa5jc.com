using AsteriskAMIStream.Models;
using AsteriskAMIStream.Services;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Concurrent;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Xml.Linq;

public class AllstarClient
{
    private TcpClient tcpClient;
    private NetworkStream? stream;
    private StreamWriter? writer;
    private StreamReader? reader;
    private CancellationTokenSource cancellationTokenSource;
    private readonly string amiHost;
    private readonly int amiPort;
    private readonly string amiUsername;
    private readonly string amiPassword;
    private readonly string nodeNumber;
    private int _actionId = 0; // Action ID for the AMI commands

    public List<AllstarConnection> AllstarConnections { get; set; }

    public string ActionID => $"{Interlocked.Increment(ref _actionId)}"; // Thread-safe increment for action ID

    public AllstarClient(string amiHost, int amiPort, string amiUsername, string amiPassword, string nodeNumber)
    {
        this.amiHost = amiHost;
        this.amiPort = amiPort;
        this.amiUsername = amiUsername;
        this.amiPassword = amiPassword;
        this.nodeNumber = nodeNumber;

        tcpClient = new TcpClient();

        AllstarConnections = new List<AllstarConnection>();
        cancellationTokenSource = new CancellationTokenSource();
    }

    private async Task SendAsync(string command)
    {
        // Check if the TCP client is connected
        if (tcpClient == null || !tcpClient.Connected)
        {
            WriteCommand("** TCP client is not connected. Attempting to connect...");
            await ConnectAsync();
        }
        else
        {
            WriteCommand("** TCP client is connected.");
        }

        WriteCommand(command); // Log the command to console
        await writer.WriteLineAsync(command);
        WriteCommand("** Command sent to AMI server.");

        // Read response 
        await ReadStreamAsync(cancellationTokenSource.Token);
        WriteCommand("** Response read from AMI server.");
    }

    public async Task ConnectAsync()
    {
        if (tcpClient.Connected)
        {
            return;
        }

        WriteCommand($"Connecting to AMI server at {amiHost}:{amiPort}...");
        await tcpClient.ConnectAsync(amiHost, amiPort);

        if (!tcpClient.Connected)
        {
            WriteCommand("** Unable to connect to the AMI server.");
            return;
        }
        else
        {
            WriteCommand($"Connected to AMI server at {amiHost}:{amiPort}.");
        }

        stream = tcpClient.GetStream();
        writer = new StreamWriter(stream, Encoding.ASCII) { AutoFlush = true };
        reader = new StreamReader(stream, Encoding.ASCII);

        // Send login command
        await SendAsync($"ACTION: LOGIN\r\nUSERNAME: {amiUsername}\r\nSECRET: {amiPassword}\r\nEVENTS: 0\r\nActionID: {ActionID}\r\n");
    }

    private async Task ReadStreamAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            WriteCommand("** Reading response from AMI server...");

            var line = reader.ReadLine();

            WriteCommand("** Read a line from AMI server.");

            if (line == null || line.Trim() == "Asterisk Call Manager/1.0")
            {
                WriteCommand("** Line is null or 'Asterisk Call Manager/1.0'.. break;");
                break; // End of stream
            }

            WriteCommand("** Line is not null or 'Asterisk Call Manager/1.0'.. continue;");

            var message = "";
            while (line != null && line != string.Empty)
            {
                WriteCommand($"**   Line: {line}");
                message += line + "\r\n";
                line = reader.ReadLine();
            }
            WriteCommand($"**   Message: {message}"); // Log the message to console

            WriteResponse(message); // Log the response to console

            ParseResponse(message);

            break; // Exit after processing one message
        }
    }

    public async Task GetNodeInfoAsync(string nodeNumber)
    {
        await SendAsync($"ACTION: RptStatus\r\nCOMMAND: XStat\r\nNODE: {nodeNumber}\r\n");
        
        /// TODO: Do I even need this anymore?
        //await SendAsync($"ACTION: RptStatus\r\nCOMMAND: SawStat\r\nNODE: {nodeNumber}\r\n");
    }

    private void WriteCommand(string command)
    {
        Console.ForegroundColor = ConsoleColor.Gray;
        Console.WriteLine(command);
        Console.ForegroundColor = ConsoleColor.Green;
    }

    private void WriteResponse(string response)
    {
        Console.ForegroundColor = ConsoleColor.White;
        Console.WriteLine(response);
        Console.ForegroundColor = ConsoleColor.Green;
    }

    private void ParseResponse(string rawMessage)
    {
        WriteCommand($"** Parsing response: {rawMessage}");

        // Parse the raw message into a structured format if needed
        if (string.IsNullOrEmpty(rawMessage))
        {
            return;
        }

        // Regex pattern to match key-value pairs (e.g., "Response: Success")
        var regex = new Regex(@"(?<=^|\r\n)(Response|ActionID|Message|Node|Conn|LinkedNodes|RPT_LINKS):\s*(.*?)\r?\n", RegexOptions.Multiline);

        foreach (Match match in regex.Matches(rawMessage))
        {
            var key = match.Groups[1].Value;
            var value = match.Groups[2].Value;

            switch (key)
            {
                //case "Response":
                //    Response = value;
                //    break;
                //case "ActionID":
                //    ActionID = value;
                //    break;
                //case "Message":
                //    Message = value;
                //    break;
                //case "Node":
                //    Node = value;
                //    break;
                case "Conn":
                    try
                    {
                        // Check to see if this is a SawStat result
                        string sawStatPattern = @"^(\d+)\s(\d+)\s(\d+)\s(\d+)$";
                        var sawStatMatch = Regex.Match(value, sawStatPattern);
                        if (sawStatMatch.Success) // SawStat result
                        {
                            // Parse as SawStat result
                            var connection = AllstarConnection.FindOrCreate(sawStatMatch.Groups[1].Value, AllstarConnections);
                            connection.Transmitting = sawStatMatch.Groups[2].Value == "1";
                            connection.TimeSinceTransmit = sawStatMatch.Groups[3].Value;
                            connection.Type = "Direct";
                        }
                        else // XSTAT result
                        {
                            var nodeNumber = value.Substring(0, 10).Trim();
                            var connection = AllstarConnection.FindOrCreate(nodeNumber, AllstarConnections);

                            // Populate connection details
                            connection.IpAddress = value.Substring(10, 20).Trim();
                            connection.SomeNumber = value.Substring(30, 12).Trim();
                            connection.Direction = value.Substring(42, 11).Trim();
                            connection.TimeSpanConnected = value.Substring(53, 20).Trim();
                            connection.Status = value.Substring(73, 20).Trim();
                            connection.Type = "Direct";
                        }
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
                        var connection = AllstarConnection.FindOrCreate(node.Trim().Substring(1), AllstarConnections);
                        connection.Node = node.Trim().Substring(1);
                        connection.Type = "Linked";
                        connection.Status = node.Trim().Substring(0, 1) == "R" ? "Monitoring" : "Established";
                    }
                    break;
            }
        }
    }

    public void ClearExpiredConnections(TimeSpan expirationTime)
    {
        var expiredConnections = AllstarConnections.Where(c => DateTime.UtcNow - c.LastHeardUtc > expirationTime).ToList();
        foreach (var connection in expiredConnections)
        {
            AllstarConnections.Remove(connection);
        }
    }
}

public class AllstarConnection
{
    public string Node { get; set; }
    public string? IpAddress { get; set; }
    public string? SomeNumber { get; set; }
    public string? Direction { get; set; }
    public string? TimeSpanConnected { get; set; }
    public DateTime LastHeardUtc { get; set; }
    public string? Status { get; set; }
    public string? Type { get; set; }
    public string? CallSign { get; set; }
    public string? Location { get; set; }
    public string? Info1 { get; set; }
    public string? Info2 { get; set; }
    public string? Latitude { get; set; }
    public string? Longitude { get; set; }
    public bool Transmitting { get; set; }
    public string? TimeSinceTransmit { get; set; }

    public void LoadMetadata()
    {
        int nodeNumber = 0;

        string callsignPattern = @"^[a-zA-Z0-9]{1,3}[0-9][a-zA-Z0-9]{0,3}[a-zA-Z]$";
        var callsignMatch = Regex.Match(Node, callsignPattern);

        if (callsignMatch.Success)
        {
            Info2 = "RepeaterPhone / Direct connection";
        }
        else if (int.TryParse(Node, out nodeNumber))
        {
            if (nodeNumber > 3000000)
            {
                // Echolink
                Info2 = "Echolink";
            }
            else if (nodeNumber < 2000)
            {
                Info2 = "Private node";
            }
            else
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

    public static AllstarConnection FindOrCreate(string node, List<AllstarConnection> connections)
    {
        var connection = connections.FirstOrDefault(conn => conn.Node == node);

        if (connection == default) // This connection does not exist
        {
            connection = new AllstarConnection
            {
                Node = node
            };
            connection.LoadMetadata(); // Load metadata for the new connection
            connections.Add(connection);
        }

        connection.LastHeardUtc = DateTime.UtcNow; // Update last heard time

        return connection;
    }
}