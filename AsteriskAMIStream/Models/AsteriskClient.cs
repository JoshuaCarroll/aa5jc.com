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
    private ConcurrentQueue<string> messageQueue;
    private Task readTask;

    public string AmiHost = "10.1.10.207";
    public int AmiPort = 5038;
    public string AmiUsername = "admin";
    public string AmiPassword = "";

    public AsteriskClient(string amiHost, int amiPort, string amiUsername, string amiPassword)
    {
        AmiHost = amiHost;
        AmiUsername = amiUsername;
        AmiPassword = amiPassword;
        AmiPort = amiPort;

        tcpClient = new TcpClient();
        messageQueue = new ConcurrentQueue<string>();
        cancellationTokenSource = new CancellationTokenSource();

        ConnectAsync().Wait();
    }

    private async Task<string> SendAsync(string command)
    {
        if (!tcpClient.Connected)
        {
            await ConnectAsync();
        }

        await writer.WriteLineAsync(command);

        string response = await RecieveAsync(cancellationTokenSource.Token);

        return response;
    }

    private async Task<string> RecieveAsync(CancellationToken cancellationToken)
    {
        StringBuilder response = new StringBuilder();

        while (!cancellationToken.IsCancellationRequested)
        {
            if (messageQueue.TryDequeue(out string line))
            {
                // If the line is null or empty, consider it as the end of the response
                if (string.IsNullOrWhiteSpace(line))
                {
                    break;
                }

                response.AppendLine(line);
            }
            else
            {
                await Task.Delay(100);  // Allow some delay to prevent tight looping
            }
        }

        return response.ToString();
    }

    public async Task ConnectAsync()
    {
        if (tcpClient.Connected)
        {
            return;
        }

        await tcpClient.ConnectAsync(AmiHost, AmiPort);

        stream = tcpClient.GetStream();
        writer = new StreamWriter(stream, Encoding.ASCII) { AutoFlush = true };
        reader = new StreamReader(stream, Encoding.ASCII);

        // Start reading data asynchronously
        readTask = Task.Run(() => ReadStreamAsync(cancellationTokenSource.Token));
    }

    private async Task ReadStreamAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            // Read a line asynchronously
            var line = await reader.ReadLineAsync();

            if (line == null)
            {
                break;  // End of stream, exit the loop
            }

            // Enqueue the received line for processing by the main task
            messageQueue.Enqueue(line);
        }
    }

    public async Task<string> GetNodeInfoAsync(string nodeNumber)
    {
        string response = await SendAsync($"ACTION: RptStatus\r\nCOMMAND: XStat\r\nNODE: {nodeNumber}\r\n\r\n");
        response += await SendAsync($"ACTION: RptStatus\r\nCOMMAND: SawStat\r\nNODE: {nodeNumber}\r\n\r\n");

        return response;
    }

    public void Stop()
    {
        cancellationTokenSource.Cancel();
        readTask?.Wait();  // Wait for the read task to finish before closing the connection
        tcpClient.Close();
    }

    internal async Task<string> ReadMessageAsync()
    {
        throw new NotImplementedException();
    }
}
