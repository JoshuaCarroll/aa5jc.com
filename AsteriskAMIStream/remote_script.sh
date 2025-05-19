cd /home/repeater/asteriskami
sudo docker build -t asteriskami -f Dockerfile .
sudo docker stop asteriskami 2>/dev/null || true
sudo docker rm asteriskami 2>/dev/null || true
sudo docker run -d --name asteriskami --network host asteriskami
