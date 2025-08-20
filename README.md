# Lawn Mower Demo

这是一个基于ECS框架的割草机游戏演示项目，支持网络多人游戏。

## 项目结构

```
lawn-mower-demo/
├── assets/                 # Cocos Creator客户端资源
│   └── scripts/            # 客户端脚本
│       ├── ecs/            # ECS组件和系统
│       └── ui-ecs/         # UI相关代码
├── server/                 # 游戏服务器代码（不会编译到客户端）
│   ├── index.ts           # 服务器入口
│   ├── GameServerRpcHandler.ts
│   ├── package.json       # 服务器依赖
│   └── tsconfig.server.json
├── start-server.sh        # Linux/Mac启动脚本
├── start-server.bat       # Windows启动脚本
└── package.json           # 客户端依赖
```

## 使用方法

### 启动服务器

**Linux/Mac:**
```bash
./start-server.sh
```

**Windows:**
```batch
start-server.bat
```

**手动启动:**
```bash
cd server
npm install
npm run build
npm start
```

### 启动客户端

1. 在Cocos Creator中打开项目
2. 构建并运行游戏
3. 客户端会连接到服务器（默认localhost:8080）

## 特性

- 基于ECS架构的游戏逻辑
- WebSocket网络通信
- 多人实时同步
- RPC调用系统
- 服务器代码与客户端代码分离

## 注意事项

- `server/` 目录不会被Cocos Creator编译到客户端
- 服务器和客户端使用相同的网络组件定义
- 服务器默认监听8080端口