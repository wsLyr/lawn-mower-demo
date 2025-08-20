#!/bin/bash

echo "启动 Lawn Mower Demo 游戏服务器..."

# 进入服务器目录
cd server

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "安装服务器依赖..."
    npm install
fi

# 编译TypeScript
echo "编译服务器代码..."
npm run build

# 启动服务器
echo "启动服务器..."
npm start