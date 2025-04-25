using AsteriskAMIStream.Models;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;

namespace AsteriskAMIStream.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AsteriskController : Controller
    {
        private const string AMI_HOST = "10.1.10.207";
        private const int AMI_PORT = 5038;
        private const string AMI_USERNAME = "admin";
        private const string AMI_PASSWORD = "";

        [HttpGet("stream")]
        public async Task StreamAMIData()
        {
            Response.ContentType = "text/event-stream";
            Response.Headers["Cache-Control"] = "no-cache";
            Response.Headers["Connection"] = "keep-alive";

            AsteriskClient client = new AsteriskClient(AMI_HOST, AMI_PORT, AMI_USERNAME, AMI_PASSWORD);
            await client.ConnectAsync();

            while (!Response.HttpContext.RequestAborted.IsCancellationRequested)
            {
                string message = await client.ReadMessageAsync();
                if (message != null)
                {
                    await WriteToStream(message);
                }
            }
            var nodeInfo = await client.GetNodeInfoAsync("499601");
            await WriteToStream(nodeInfo);
        }

        private async Task WriteToStream(object data)
        {
            string json = System.Text.Json.JsonSerializer.Serialize(data);
            await Response.WriteAsync($"{json}\n\n");
            await Response.Body.FlushAsync();
        }
    }
}
