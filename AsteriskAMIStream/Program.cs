using AsteriskAMIStream.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();  // Ensure controllers are added before building the app

// Load configuration from appsettings.json or prompt user if not found or invalid
string configFilePath = Path.Combine("/app/data", "amiSettings.json");
IConfiguration configuration;

var rebuildConfigFile = false;
// Check if config file exists
if (File.Exists(configFilePath))
{
    configuration = builder.Configuration.AddJsonFile(configFilePath).Build();

    // Validate if AMISettings section exists and is valid
    var amiSettings = configuration.GetSection("AMISettings").Get<List<AMISettings>>();

    if (amiSettings == null || !amiSettings.Any())
    {
        rebuildConfigFile = true;
    }
}
else
{
    rebuildConfigFile = true;
}

if (rebuildConfigFile)
{
    AMISettings.PromptForConfiguration(configFilePath);
}

// Reload the configuration with the updated file
configuration = builder.Configuration.AddJsonFile(configFilePath).Build();

// Register services
builder.Services.AddSingleton<IConfiguration>(configuration);

var app = builder.Build();

// Load node metadata
await AsteriskAMIStream.Services.MetadataService.DownloadAndCacheMetadata();

app.MapControllers();  // Now the controllers are mapped after the services are configured

app.Run();

