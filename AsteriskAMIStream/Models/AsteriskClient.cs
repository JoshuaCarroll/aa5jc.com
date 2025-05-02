using AsteriskAMIStream.Models;
using System;
using System.Collections.Concurrent;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

public class AsteriskClient
{
    private TcpClient tcpClient;
    private NetworkStream stream;
    private StreamWriter writer;
    private StreamReader reader;
    private CancellationTokenSource cancellationTokenSource;
    private ConcurrentQueue<AsteriskResponse> messageQueue;
    private Task readTask;
    private DateTime lastMessageTime;
    private readonly string amiHost;
    private readonly int amiPort;
    private readonly string amiUsername;
    private readonly string amiPassword;
    private readonly string nodeNumber;
    private readonly int timeoutMinutes;
    private int _actionId = 0; // Action ID for the AMI commands

    public string ActionID => $"{Interlocked.Increment(ref _actionId)}"; // Thread-safe increment for action ID

    public ConcurrentQueue<AsteriskResponse> MessageQueue => messageQueue;  // Public access to the message queue

    public AsteriskClient(string amiHost, int amiPort, string amiUsername, string amiPassword, string nodeNumber, int timeoutMinutes)
    {
        this.amiHost = amiHost;
        this.amiPort = amiPort;
        this.amiUsername = amiUsername;
        this.amiPassword = amiPassword;
        this.nodeNumber = nodeNumber;
        this.timeoutMinutes = timeoutMinutes;

        tcpClient = new TcpClient();
        messageQueue = new ConcurrentQueue<AsteriskResponse>();
        cancellationTokenSource = new CancellationTokenSource();

        lastMessageTime = DateTime.UtcNow; // Initialize last message time
    }

    private async Task SendAsync(string command)
    {
        if (!tcpClient.Connected)
        {
            await ConnectAsync();
        }

        WriteCommand(command); // Log the command to console
        await writer.WriteLineAsync(command);

        // Read response 
        await ReadStreamAsync(cancellationTokenSource.Token);
    }

    public async Task ConnectAsync()
    {
        if (tcpClient.Connected)
        {
            return;
        }

        Console.WriteLine($"Connecting to AMI server at {amiHost}:{amiPort}...");
        await tcpClient.ConnectAsync(amiHost, amiPort);

        if (!tcpClient.Connected)
        {
            Console.WriteLine("** Unable to connect to the AMI server.");
            return;
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
            var line = await reader.ReadLineAsync();

            if (line == null)
            {
                break; // End of stream
            }

            var message = "";
            while (line != string.Empty)
            {
                message += line + "\r\n";
                line = await reader.ReadLineAsync();
            }
            WriteResponse(message); // Log the response to console

            AsteriskResponse response = new AsteriskResponse(message);

            // If the queue is full, remove the oldest message
            if (messageQueue.Count >= 100) // Fixed limit
            {
                messageQueue.TryDequeue(out _);
            }

            messageQueue.Enqueue(response); // Enqueue the new message

            break; // Exit after processing one message
        }
    }

    public async Task GetNodeInfoAsync(string nodeNumber)
    {
        await SendAsync($"ACTION: RptStatus\r\nCOMMAND: XStat\r\nNODE: {nodeNumber}\r\n");
        await SendAsync($"ACTION: RptStatus\r\nCOMMAND: SawStat\r\nNODE: {nodeNumber}\r\n");
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
}
