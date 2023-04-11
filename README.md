# 安装依赖

npm install

# 运行

node ./bin/www 或者 npm start

# 访问

http://localhost:9002/



# docker
> https://nodejs.org/zh-cn/docs/guides/nodejs-docker-webapp
## 构建镜像
docker build . -t coverage-server
docker buildx build --platform linux/amd64 . -t coverage-server
## 运行容器
docker run -it -v /Users/canglong/Downloads/coverage2:/canglong/coverage -p 9002:9002  -d coverage-server
docker run -it -v /Users/canglong/Downloads/coverage2:/canglong/coverage -p 9002:9002  -d alvinscrp/coverage-server
>在 Docker 容器中挂载宿主机上的文件，需要正确配置挂载选项才能启用 birthtime 属性。具体而言，在 Linux 和 macOS 系统中，可以使用以下选项来挂载文件并启用 birthtime 属性：
macOS
对于 macOS 的 HFS+ 和 APFS 文件系统，需要添加 bsdflags 和 noappledouble 选项：
docker run -v /path/on/host:/path/in/container:ro,bsdflags=0x100000,noappledouble myimage


## Get container ID
$ docker ps

## Print app output
$ docker logs <container id>


##  Kill our running container
$ docker kill <container id>
<container id>
## Confirm that the app has stopped
$ curl -i localhost:9002
curl: (7) Failed to connect to localhost port 9002: Connection refused

## docker进入工作目录
docker exec -ti ec4d11930e1a13e46c2dfe7effb1b72c21f90840f2735047092e64b1fa3a5c08 /bin/bash



## image hub push
docker tag coverage-server alvinscrp/coverage-server
docker push alvinscrp/coverage-server

## image hub pull
docker pull alvinscrp/coverage-server
docker run  -it -v /Users/mac/coverage:/mac/coverage -p 9002:9002 -d alvinscrp/coverage-server  