
Sample run command:

cd C:\AsteriskAMIStream
docker build -t asteriskami-stream .
docker run -it -v C:\app\data:/app/data -p 8080:8080 asteriskami-stream
