using System.Net.Http;
using System.IO;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace AsteriskAMIStream.Services
{
    using System.Net.Http;
    using System.IO;
    using Newtonsoft.Json;
    using System.Collections.Generic;

    public class NodeMetadata
    {
        public string NodeNumber { get; set; }
        public string CallSign { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Location { get; set; }
        public string Info1 { get; set; }
        public string Info2 { get; set; }
    }

    public static class MetadataService
    {
        private const string mapApiUrl = "https://stats.allstarlink.org/api/stats/mapData";
        private const string CacheFilePath = "nodeMetadata.json";

        private static List<NodeMetadata> nodesMetadata = new List<NodeMetadata>();

        public static async Task DownloadAndCacheMetadata()
        {
            if (File.Exists(CacheFilePath) && File.GetLastWriteTime(CacheFilePath) > DateTime.UtcNow.AddDays(-1))
            {
                WriteConsole("Node map data cache is still valid, no need to download");
                return;
            }

            WriteConsole("Cache is old or missing. Attempting to download...");

            using (var httpClient = new HttpClient())
            {
                var mapData = await httpClient.GetStringAsync(mapApiUrl);
                var nodes = ParseMapData(mapData);

                SaveToJsonFile(nodes);
            }
        }

        private static List<NodeMetadata> ParseMapData(string rawData)
        {
            var nodes = new List<NodeMetadata>();
            var lines = rawData.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);

            foreach (var line in lines)
            {
                var columns = line.Split("\t");
                if (columns.Length >= 6)
                {
                    var node = new NodeMetadata
                    {
                        NodeNumber = columns[0],
                        CallSign = columns[1],
                        Latitude = double.Parse(columns[2]),
                        Longitude = double.Parse(columns[3]),
                        Location = columns[4],
                        Info1 = columns[5], 
                        Info2 = columns[6]
                    };
                    nodes.Add(node);
                }
            }

            return nodes;
        }

        private static void SaveToJsonFile(List<NodeMetadata> nodes)
        {
            var json = JsonConvert.SerializeObject(nodes, Formatting.Indented);
            File.WriteAllText(CacheFilePath, json);
        }

        // Method to load cached metadata from the JSON file
        public static void LoadCachedMetadata()
        {
            if (File.Exists(CacheFilePath))
            {
                var json = File.ReadAllText(CacheFilePath);
                nodesMetadata = JsonConvert.DeserializeObject<List<NodeMetadata>>(json);
            }
        }

        public static NodeMetadata GetNodeMetadata(string nodeNumber)
        {
            return nodesMetadata.FirstOrDefault(node => node.NodeNumber == nodeNumber);
        }

        private static void WriteConsole(string text)
        {
            Console.ForegroundColor = ConsoleColor.Gray;
            Console.WriteLine(text);
            Console.ForegroundColor = ConsoleColor.Green;
        }
    }
}
