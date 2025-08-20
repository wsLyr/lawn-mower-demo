@echo off

echo 启动 Lawn Mower Demo 游戏服务器...

cd server

if not exist "node_modules" (
    echo 安装服务器依赖...
    npm install
)

echo 编译服务器代码...
npm run build

echo 启动服务器...
npm start

pause