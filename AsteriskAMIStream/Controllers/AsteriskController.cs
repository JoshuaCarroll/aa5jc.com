using AsteriskAMIStream.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace AsteriskAMIStream.Controllers
{
    [Route("api")]
    [ApiController]
    public class AsteriskController : Controller
    {
        private static AsteriskClient _client;
        private readonly AMISettings _amiSettings;

        public AsteriskController(IConfiguration configuration)
        {
            // Fetch the first AMI server configuration from appsettings.json
            _amiSettings = configuration.GetSection("AMISettings").Get<List<AMISettings>>().First();

            // Initialize the AsteriskClient with settings
            if (_client == null)
            {
                _client = new AsteriskClient(
                    _amiSettings.Host,
                    _amiSettings.Port,
                    _amiSettings.Username,
                    _amiSettings.Password,
                    _amiSettings.NodeNumber,
                    _amiSettings.TimeoutMinutes
                );

                // Start reading data in the background
                //Task.Run(() => _client.ConnectAsync());
            }
        }

        [HttpGet("messages")]
        public async Task<ActionResult<AsteriskResponse>> GetMessages()
        {
            await _client.GetNodeInfoAsync(_amiSettings.NodeNumber);

            // Retrieve all messages from the queue
            var messages = new List<AsteriskResponse>();

            while (_client.MessageQueue.TryDequeue(out AsteriskResponse response))
            {
                messages.Add(response); // Add the message to the list
            }

            // Return all messages as a response
            return Ok(messages);
        }
    }
}
