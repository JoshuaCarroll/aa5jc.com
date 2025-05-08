# Use a .NET runtime base image that is compatible with your application
FROM mcr.microsoft.com/dotnet/aspnet:9.0

# Set the working directory in the container
WORKDIR /app

# Copy the published application into the container
COPY . .

# Define the entry point for your application
ENTRYPOINT ["dotnet", "AsteriskAMIStream.dll"]