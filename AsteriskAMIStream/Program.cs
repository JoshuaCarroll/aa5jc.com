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
string configFilePath = "amiSettings.json";
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
    // If AMISettings is invalid or empty, prompt user for configuration
    Console.WriteLine($"AMISettings section is missing or invalid in the configuration file. Please provide the information below. These details will be saved into {configFilePath} - update it as needed anytime.\r\n\r\n");

    var amiHost = PromptUser("Enter AMI Host: ");
    var amiPort = int.Parse(PromptUser("Enter AMI Port: "));
    var amiUsername = PromptUser("Enter AMI Username: ");
    var amiPassword = PromptUser("Enter AMI Password: ");
    var nodeNumber = PromptUser("Enter Node Number: ");
    var timeoutMinutes = int.Parse(PromptUser("Enter timeout in minutes: "));

    // Create the config object
    var configData = new
    {
        AMISettings = new[]
        {
            new
            {
                Host = amiHost,
                Port = amiPort,
                Username = amiUsername,
                Password = amiPassword,
                NodeNumber = nodeNumber,
                TimeoutMinutes = timeoutMinutes
            }
        }
    };

    // Save the user input into the appsettings.json
    var json = JsonConvert.SerializeObject(configData, Formatting.Indented);
    File.WriteAllText("amiSettings.json", json);
}

// Reload the configuration with the updated file
configuration = builder.Configuration.AddJsonFile(configFilePath).Build();

// Register services
builder.Services.AddSingleton<IConfiguration>(configuration);

var app = builder.Build();

// Load node metadata
await AsteriskAMIStream.Services.MetadataService.DownloadAndCacheMetadata();
AsteriskAMIStream.Services.MetadataService.LoadCachedMetadata();

app.MapControllers();  // Now the controllers are mapped after the services are configured

app.Run();

// Helper method for user input
string PromptUser(string prompt)
{
    Console.Write(prompt);
    return Console.ReadLine();
}
