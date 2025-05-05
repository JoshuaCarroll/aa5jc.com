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
    public class AllstarController : Controller
    {
        private static AllstarClient _client;
        private readonly AMISettings _amiSettings;

        public AllstarController(IConfiguration configuration)
        {
            // Fetch the first AMI server configuration from appsettings.json
            _amiSettings = configuration.GetSection("AMISettings").Get<List<AMISettings>>().First();

            // Initialize the AsteriskClient with settings
            if (_client == null)
            {
                _client = new AllstarClient(
                    _amiSettings.Host,
                    _amiSettings.Port,
                    _amiSettings.Username,
                    _amiSettings.Password,
                    _amiSettings.NodeNumber,
                    _amiSettings.TimeoutMinutes
                );
            }
        }

        [HttpGet("messages")]
        public async Task<ActionResult<List<AllstarConnection>>> GetMessages()
        {
            await _client.GetNodeInfoAsync(_amiSettings.NodeNumber);
            _client.ClearExpiredConnections(new TimeSpan(0, 1, 0));

            // Return all messages as a response
            return Ok(_client.AllstarConnections);
        }
    }
}
