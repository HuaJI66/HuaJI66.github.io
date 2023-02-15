---
layout: post
title: 性能监控&链路追踪--SkyWalking
subtitle: 性能监控&链路追踪--SkyWalking
categories: SpringCloud
tags: [SpringCloud]
banner:
  video: null             # Video banner source
  loop: true              # Video loop
  volume: 0               # Video volume (100% is 1.0)
  start_at: 0             # Video start time
  image: /assets/images/banners/spy5.jpg    # Image banner source
---

# 性能监控&链路追踪--SkyWalking

# 快速开始

版本:9.3.0

文档:https://skywalking.apache.org/docs/main/v9.3.0/readme/

安装方式:docker

> If you intend to override or add config files in `/skywalking/config`, `/skywalking/ext-config` is the location for you to put extra files. The files with the same name will be overridden; otherwise, they will be added to `/skywalking/config`.
>
> If you want to add more libs/jars into the classpath of OAP, for example, new metrics for OAL. These jars can be mounted into `/skywalking/ext-libs`, then `entrypoint` bash will append them into the classpath. Notice, you can’t override an existing jar in classpath.

1. 拉取镜像

   ```shell
   docker run --name oap --restart always -d apache/skywalking-oap-server:9.3.0
   docker stop oap
   ```

2. 拷贝配置文件(用于参考,可选)

   ```shell
   docker cp oap:/skywalking/config /opt/docker/skywalking/
   ```

3. 创建配置/插件目录

   ```shell
   mkdir ext-libs ext-config
   ```

   

4. 编辑配置文件

   在/opt/docker/skywalking/ext-config 目录下新增application.yml文件,配置存储方式为mysql

   

   ```yaml
   storage:
     selector: ${SW_STORAGE:mysql}
     mysql:
       properties:
         jdbcUrl: ${SW_JDBC_URL:"jdbc:mysql://localhost:3306/skywalking?rewriteBatchedStatements=true"}
         dataSource.user: ${SW_DATA_SOURCE_USER:root}
         dataSource.password: ${SW_DATA_SOURCE_PASSWORD:root}
         dataSource.cachePrepStmts: ${SW_DATA_SOURCE_CACHE_PREP_STMTS:true}
         dataSource.prepStmtCacheSize: ${SW_DATA_SOURCE_PREP_STMT_CACHE_SQL_SIZE:250}
         dataSource.prepStmtCacheSqlLimit: ${SW_DATA_SOURCE_PREP_STMT_CACHE_SQL_LIMIT:2048}
         dataSource.useServerPrepStmts: ${SW_DATA_SOURCE_USE_SERVER_PREP_STMTS:true}
       metadataQueryMaxSize: ${SW_STORAGE_MYSQL_QUERY_MAX_SIZE:5000}
       maxSizeOfBatchSql: ${SW_STORAGE_MAX_SIZE_OF_BATCH_SQL:2000}
       asyncBatchPersistentPoolSize: ${SW_STORAGE_ASYNC_BATCH_PERSISTENT_POOL_SIZE:4}
   ```

   并在mysql插件数据库skywalking(运行服务后会在该数据库创建相应表)

   ```sql
   CREATE DATABASE `skywalking` CHARACTER SET 'utf8' COLLATE 'utf8_general_ci';
   ```

   

   把mysql-connector-java-8.0.30.jar 驱动放到 ext-libs 目录

   ![image-20230207132913601](/assets/images/springcloud/image-20230207132913601.png)

5. 运行

   oap-server

   ```shell
   docker run --name oap \
   -v /opt/docker/skywalking/ext-config:/skywalking/ext-config \
   -v /opt/docker/skywalking/ext-libs:/skywalking/ext-libs \
   -p 11800:11800 -p 12800:12800 -p 1234:1234 -d \
   --privileged=true  --restart=always --network=server apache/skywalking-oap-server:9.3.0
   ```

   ui

   ```shell
   docker run --name oap-ui --restart always --network server -p 8086:8080 -d -e SW_OAP_ADDRESS=http://oap:12800 apache/skywalking-ui:9.3.0
   ```

6. 为微服务引入agent

   下载并解压

   https://www.apache.org/dyn/closer.cgi/skywalking/java-agent/8.14.0/apache-skywalking-java-agent-8.14.0.tgz

   idea启动服务配置

   vm

   ```shell
   -javaagent:C:\Users\pi'ka'chu\Documents\spring\springCloud\solfware\skywalking\skywalking-agent\skywalking-agent.jar
   ```

   环境变量

   ```shell
   SW_AGENT_COLLECTOR_BACKEND_SERVICES=127.0.0.1:11800;SW_AGENT_NAME=cloud-guli-gateway
   ```

   

   ![image-20230207140416587](/assets/images/springcloud/image-20230207140416587.png)
   
7.  进入ui界面

![image-20230207141216353](/assets/images/springcloud/image-20230207141216353.png)

# 1. 概述

本文我们来学习如何在 Spring Cloud 中使用 [**SkyWalking**](http://skywalking.apache.org/) 作为**链路追踪**组件，实现服务调用的链路追踪、依赖的拓扑图、调用请求量的统计等等功能。

> SkyWalking 是一款针对分布式系统的国产 APM（Application Performance Monitoring，应用性能监控）产品，主要针对微服务、Cloud Native 和容器化（Docker、Kubernetes、Mesos）架构的应用。
>
> SkyWalking 的核心是一个分布式追踪系统，目前已经完成 Apache 孵化，成为 Apache 顶级项目。

在开始本文之前，胖友需要对 SkyWalking 进行简单的学习。可以阅读[《SkyWalking 极简入门》](http://www.iocoder.cn/SkyWalking/install/?self)文章，将第一二小节看完，在本机搭建一个 SkyWalking 服务。

> 因为 SkyWalking 是基于 [Java Agent](https://www.developer.com/java/data/what-is-java-agent.html) 实现，所以和使用 Spring Boot 或 Spring Cloud 关联度不高。因此，本文会和[《芋道 Spring Boot 链路追踪 SkyWalking 入门》](http://www.iocoder.cn/Spring-Boot/SkyWalking/?self)有蛮多重合的地方。
>
> 一旦有重合的地方，艿艿会暂时不写，会引导胖友去阅读该文章的对应小节，不会存在任何影响哈~🙂

# 2. SpringMVC 示例

> 示例代码对应仓库：[`labx-14-sc-skywalking-springmvc`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-springmvc/)。

本小节，我们来搭建一个 SkyWalking 对 SpringMVC 的 API 接口的链路追踪。该链路通过如下插件实现收集：

- [`spring/mvc-annotation-3.x-plugin`](https://github.com/apache/skywalking/tree/master/apm-sniffer/apm-sdk-plugin/spring-plugins/mvc-annotation-3.x-plugin)
- [`spring/mvc-annotation-4.x-plugin`](https://github.com/apache/skywalking/tree/master/apm-sniffer/apm-sdk-plugin/spring-plugins/mvc-annotation-4.x-plugin)
- [`spring/mvc-annotation-5.x-plugin`](https://github.com/apache/skywalking/tree/master/apm-sniffer/apm-sdk-plugin/spring-plugins/mvc-annotation-5.x-plugin)

我们来新建一个 [`labx-14-sc-skywalking-springmvc`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-springmvc/) 项目，最终如下图所示：![项目结构](/assets/images/springcloud/01.png)

## 2.1 引入依赖

在 [`pom.xml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-springmvc/pom.xml) 文件中，引入相关依赖。



```
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>labx-14</artifactId>
        <groupId>cn.iocoder.springboot.labs</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>labx-14-sc-skywalking-springmvc</artifactId>

    <properties>
        <maven.compiler.target>1.8</maven.compiler.target>
        <maven.compiler.source>1.8</maven.compiler.source>
        <spring.boot.version>2.2.4.RELEASE</spring.boot.version>
        <spring.cloud.version>Hoxton.SR1</spring.cloud.version>
    </properties>

    <!--
        引入 Spring Boot、Spring Cloud、Spring Cloud Alibaba 三者 BOM 文件，进行依赖版本的管理，防止不兼容。
        在 https://dwz.cn/mcLIfNKt 文章中，Spring Cloud Alibaba 开发团队推荐了三者的依赖关系
     -->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-starter-parent</artifactId>
                <version>${spring.boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring.cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <!-- 引入 SpringMVC 相关依赖，并实现对其的自动配置 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>

</project>
```



- 具体每个依赖的作用，胖友自己认真看下艿艿添加的所有注释噢。

## 2.2 配置文件

在 [`application.yml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-springmvc/src/main/resources/application.yml) 中，添加服务器端口配置，如下：



```
server:
  port: 8079

spring:
  application:
    name: user-service # 服务名
```



- 设置服务器的端口为 8079 ，避免和 SkyWalking UI 占用的 8080 冲突。

## 2.3 UserController

创建 [UserController](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-springmvc/src/main/java/cn/iocoder/springcloud/labx14/springmvcdemo/controller/UserController.java) 类，提供示例 API 接口。代码如下：



```
@RestController
@RequestMapping("/user")
public class UserController {

    @GetMapping("/get")
    public String get(@RequestParam("id") Integer id) {
        return "user:" + id;
    }

}
```



## 2.4 UserServiceApplication

创建 [UserServiceApplication](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-springmvc/src/main/java/cn/iocoder/springcloud/labx14/springmvcdemo/UserServiceApplication.java) 类，应用启动类。代码如下：



```
@SpringBootApplication
public class UserServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }

}
```



## 2.5 IDEA 配置

通过 IDEA 的「Run/Debug Configurations」配置使用 SkyWalking Agent。如下图所示：![Run/Debug Configurations](/assets/images/springcloud/02.png)

然后，执行 `UserServiceApplication#main(String[] args)` 方法，启动该 Spring Cloud 应用。如果说控制台打印如下日志，说明 SkyWalking Agent 基本加载成功：



```
# 加载 SkyWalking Agent
DEBUG 2020-03-22 19:35:59:463 main AgentPackagePath : The beacon class location is jar:file:/Users/yunai/skywalking/apache-skywalking-apm-bin/agent/skywalking-agent.jar!/org/apache/skywalking/apm/agent/core/boot/AgentPackagePath.class. 
INFO 2020-03-22 19:35:59:465 main SnifferConfigInitializer : Config file found in /Users/yunai/skywalking/apache-skywalking-apm-bin/agent/config/agent.config.
```



## 2.6 简单测试

① 首先，使用浏览器，访问下 http://127.0.0.1:8079/user/get?id=1 地址，请求下 Spring Cloud 应用提供的 API。因为，我们要追踪下该链路。

② 然后，继续使用浏览器，打开 http://127.0.0.1:8080/ 地址，进入 SkyWalking UI 界面。如下图所示：![SkyWalking UI 界面 —— 仪表盘](/assets/images/springcloud/03.png)

③ 之后，点击「拓扑图」菜单，进入查看拓扑图的界面，可以看到 SpringMVC 小方块。如下图所示：![SkyWalking UI 界面 —— 拓扑图](/assets/images/springcloud/04.png)

④ 再之后，点击「追踪」菜单，进入查看链路数据的界面。如下图所示：![SkyWalking UI 界面 —— 追踪](/assets/images/springcloud/05.png)

# 3. 忽略部分 URL 的追踪

详见[《芋道 Spring Boot 链路追踪 SkyWalking 入门》](http://www.iocoder.cn/Spring-Boot/SkyWalking/?self)文章的[「3. 忽略部分 URL 的追踪」](https://www.iocoder.cn/Spring-Cloud/SkyWalking/?self#)小节。

# 4. Feign 示例

> 示例代码对应仓库：
>
> - 服务消费者：[`labx-14-sc-skywalking-feign`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-feign/)
> - 服务提供者：[`labx-14-sc-skywalking-springmvc`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-springmvc/)

本小节，我们来搭建一个 SkyWalking 对 Feign 的远程 HTTP 调用的链路追踪。该链路通过如下**插件**实现收集：

- [`feign-default-http-9.x-plugin`](https://github.com/apache/skywalking/tree/master/apm-sniffer/apm-sdk-plugin/feign-default-http-9.x-plugin)

我们来新建一个 [`labx-14-sc-skywalking-feign`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-feign/) 项目作为消费者，使用 **Feign 调用**[「2. SpringMVC 示例」](https://www.iocoder.cn/Spring-Cloud/SkyWalking/?self#)的 [`labx-14-sc-skywalking-springmvc`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-springmvc/) 的 `/user/get` 接口。最终如下图所示：![项目结构](/assets/images/springcloud/11.png)

## 4.1 引入依赖

在 [`pom.xml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-feign/pom.xml) 文件中，引入相关依赖。



```
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>labx-14</artifactId>
        <groupId>cn.iocoder.springboot.labs</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>labx-14-sc-skywalking-feign</artifactId>

    <properties>
        <maven.compiler.target>1.8</maven.compiler.target>
        <maven.compiler.source>1.8</maven.compiler.source>
        <spring.boot.version>2.2.4.RELEASE</spring.boot.version>
        <spring.cloud.version>Hoxton.SR1</spring.cloud.version>
    </properties>

    <!--
        引入 Spring Boot、Spring Cloud、Spring Cloud Alibaba 三者 BOM 文件，进行依赖版本的管理，防止不兼容。
        在 https://dwz.cn/mcLIfNKt 文章中，Spring Cloud Alibaba 开发团队推荐了三者的依赖关系
     -->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-starter-parent</artifactId>
                <version>${spring.boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring.cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <!-- 引入 SpringMVC 相关依赖，并实现对其的自动配置 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- 引入 Spring Cloud OpenFeign 相关依赖，使用 OpenFeign 提供声明式调用，并实现对其的自动配置 -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-openfeign</artifactId>
        </dependency>
    </dependencies>

</project>
```



## 4.2 配置文件

创建 [`application.yml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-feign/src/main/resources/application.yml) 配置文件，添加相应配置项如下：



```
server:
  port: 8081

spring:
  application:
    name: feign-service # 服务名
```



## 4.3 UserServiceFeignClient

创建 [UserServiceFeignClient](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-feign/src/main/java/cn/iocoder/springcloud/labx14/springmvcdemo/feign/UserServiceFeignClient.java) 接口，调用 `user-service` 服务的 Feign 客户端，即[「2. SpringMVC 示例」](https://www.iocoder.cn/Spring-Cloud/SkyWalking/?self#)的 [`labx-14-sc-skywalking-springmvc`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-springmvc/)。代码如下：



```
@FeignClient(name = "user-service", url = "http://127.0.0.1:8079")
public interface UserServiceFeignClient {

    @GetMapping("/user/get")
    String get(@RequestParam("id") Integer id);

}
```



## 4.4 FeignController

创建 [FeignController](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-feign/src/main/java/cn/iocoder/springcloud/labx14/springmvcdemo/controller/FeignController.java) 类，提供 `/feign/get` 接口，使用 UserServiceFeignClient 调用 `user-service` 服务。代码如下：



```
@RestController
@RequestMapping("/feign")
public class FeignController {

    @Autowired
    private UserServiceFeignClient userServiceFeignClient;

    @GetMapping("/get")
    public String get(@RequestParam("id") Integer id) {
        return userServiceFeignClient.get(id);
    }

}
```



## 4.5 FeignApplication

创建 [FeignApplication](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-feign/src/main/java/cn/iocoder/springcloud/labx14/springmvcdemo/FeignApplication.java) 类，`feign-service` 服务启动类。代码如下：



```
@SpringBootApplication
@EnableFeignClients
public class FeignApplication {

    public static void main(String[] args) {
        SpringApplication.run(FeignApplication.class, args);
    }

}
```



## 4.6 IDEA 配置

通过 IDEA 的「Run/Debug Configurations」配置使用 SkyWalking Agent。如下图所示：![Run/Debug Configurations](/assets/images/springcloud/12.png)

## 4.7 简单测试

使用 FeignApplication 和 UserServiceApplication 启动两个 Spring Cloud 应用。

① 首先，使用浏览器，访问下 http://127.0.0.1:8081/feign/get?id=1 地址，使用 Feign 调用 `user-service` 服务。因为，我们要追踪下该链路。

② 然后，继续使用浏览器，打开 http://127.0.0.1:8080/ 地址，进入 SkyWalking UI 界面。如下图所示：![SkyWalking UI 界面 —— 仪表盘](/assets/images/springcloud/13.png)

③ 之后，点击「拓扑图」菜单，进入查看拓扑图的界面，可以看到两个服务的小方块，以及对应的调用关系。如下图所示：![SkyWalking UI 界面 —— 拓扑图](/assets/images/springcloud/14.png)

④ 再之后，点击「追踪」菜单，进入查看链路数据的界面。如下图所示：![SkyWalking UI 界面 —— 追踪](/assets/images/springcloud/15.png)

# 5. Spring Cloud Gateway 示例

> 示例代码对应仓库：
>
> - API 网关：[`labx-14-sc-skywalking-springcloudgateway`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-springcloudgateway/)
> - 服务消费者：[`labx-14-sc-sleuth-feign`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-feign/)
> - 服务提供者：[`labx-14-sc-sleuth-springmvc`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-springmvc/)

本小节，我们来搭建一个 SkyWalking 对 Spring Cloud **Gateway** 的代理请求的链路追踪。该链路通过如下**插件**实现收集：

- [`gateway-2.1.x-plugin`](https://github.com/apache/skywalking/blob/master/apm-sniffer/optional-plugins/optional-spring-plugins/optional-spring-cloud/gateway-2.1.x-plugin/)
- [`spring-webflux-5.x-plugin`](https://github.com/apache/skywalking/blob/master/apm-sniffer/apm-sdk-plugin/spring-plugins/spring-webflux-5.x-plugin/)

> 友情提示：因为 Spring Cloud Gateway 是基于 WebFlux 实现，必须搭配上 `spring-webflux-5.x-plugin` 插件一起使用，不能仅仅只使用 `gateway-2.1.x-plugin` 插件。

我们来新建一个 [`labx-14-sc-skywalking-springcloudgateway`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-springcloudgateway/) 项目作为 API 网关，转发请求到后端服务。最终如下图所示：![项目结构](/assets/images/springcloud/21.png)

考虑到方便，我们直接使用[「4. Feign 示例」](https://www.iocoder.cn/Spring-Cloud/SkyWalking/?self#)的 `feign-service` 和 `user-service` 两个服务，作为被转发的后端服务。

## 5.1 复制插件

`gateway-2.1.x-plugin` 和 `spring-webflux-5.x-plugin` 插件，在 `optional-plugins` 目录下，是**可选**插件，所以我们需要复制到 `plugins` 目录下。命令行操作如下：



```
# 查看当前所在目录
$ pwd
/Users/yunai/skywalking/apache-skywalking-apm-bin/agent

# 复制插件到 plugins 目录
$ cp optional-plugins/apm-spring-cloud-gateway-2.x-plugin-6.6.0.jar plugins/
$ cp optional-plugins/apm-spring-webflux-5.x-plugin-6.6.0.jar plugins/
```



## 5.2 引入依赖

在 [`pom.xml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-springcloudgateway/pom.xml) 文件中，引入相关依赖。



```
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>labx-08</artifactId>
        <groupId>cn.iocoder.springboot.labs</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>labx-14-sc-skywalking-springcloudgateway</artifactId>

    <properties>
        <spring.boot.version>2.1.13.RELEASE</spring.boot.version>
        <spring.cloud.version>Greenwich.SR1</spring.cloud.version>
    </properties>

    <!--
        引入 Spring Boot、Spring Cloud、Spring Cloud Alibaba 三者 BOM 文件，进行依赖版本的管理，防止不兼容。
        在 https://dwz.cn/mcLIfNKt 文章中，Spring Cloud Alibaba 开发团队推荐了三者的依赖关系
     -->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-starter-parent</artifactId>
                <version>${spring.boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring.cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <!-- 引入 Spring Cloud Gateway 相关依赖，使用它作为网关，并实现对其的自动配置 -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-gateway</artifactId>
        </dependency>
    </dependencies>

</project>
```



要注意，艿艿自己测试的时候，发现目前 SkyWalking 提供的 `gateway-2.1.x-plugin` 暂时只支持 Spring Cloud Gateway 的 [`2.1.1.RELEASE`](https://mvnrepository.com/artifact/org.springframework.cloud/spring-cloud-gateway/2.1.1.RELEASE) 版本。胖友自己使用的时候，需要稍微注意和测试下。

## 5.3 配置文件

创建 [`application.yml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-springcloudgateway/src/main/resources/application.yaml) 配置文件，添加相应配置项如下：



```
server:
  port: 8888

spring:
  application:
    name: gateway-application

  cloud:
    # Spring Cloud Gateway 配置项，对应 GatewayProperties 类
    gateway:
      # 路由配置项，对应 RouteDefinition 数组
      routes:
        - id: feign-service-route
          uri: http://127.0.0.1:8081
          predicates:
            - Path=/**
```



在 `spring.cloud.gateway` 配置项中，我们创建了一个编号为 `feign-service-route` 的路由，转发到[「4. Feign 示例」](https://www.iocoder.cn/Spring-Cloud/SkyWalking/?self#)小节的 `feign-service` 服务。这样整个请求的链路，就是 `gateway-application => feign-service => user-service`。

## 5.4 GatewayApplication

创建 [GatewayApplication](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-springcloudgateway/src/main/java/cn/iocoder/springcloud/labx14/gatewaydemo/GatewayApplication.java) 类，网关启动类。代码如下：



```
@SpringBootApplication
public class GatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }

}
```



## 5.5 IDEA 配置

通过 IDEA 的「Run/Debug Configurations」配置使用 SkyWalking Agent。如下图所示：![Run/Debug Configurations](https://static.iocoder.cn/images/Spring-Cloud/2021-01-04/22.png)

## 5.6 简单测试

使用 FeignApplication、UserServiceApplication、GatewayApplication 启动三个 Spring Cloud 应用。

① 首先，使用浏览器，访问下 http://127.0.0.1:8888/feign/get?id=1 地址，请求 API 网关，从而转发请求到 `feign-service` 服务。因为，我们要追踪下该链路。

② 然后，继续使用浏览器，打开 http://127.0.0.1:8080/ 地址，进入 SkyWalking UI 界面。如下图所示：![SkyWalking UI 界面 —— 仪表盘](/assets/images/springcloud/23.png)

③ 之后，点击「拓扑图」菜单，进入查看拓扑图的界面，可以看到 API 网关转发请求到后端服务。如下图所示：![SkyWalking UI 界面 —— 拓扑图](/assets/images/springcloud/24.png)

④ 再之后，点击「追踪」菜单，进入查看链路数据的界面。如下图所示：![SkyWalking UI 界面 —— 追踪](/assets/images/springcloud/25.png)

# 6. Zuul 示例

TODO 后续补充

# 7. Dubbo 示例

> 示例代码对应仓库：
>
> - 服务 API 项目：[`labx-14-sc-skywalking-dubbo-api`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-dubbo/labx-14-sc-skywalking-dubbo-api/)
> - 服务 Provider 项目：[`labx-14-sc-skywalking-dubbo-provider`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-dubbo/labx-14-sc-skywalking-dubbo-provider/)
> - 服务 Consumer 项目：[`labx-14-sc-skywalking-dubbo-consumer`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-dubbo/labx-14-sc-skywalking-dubbo-consumer/)

本小节，我们来搭建一个 SkyWalking 对 **Dubbo** 的远程 RPC 调用的链路追踪。该链路通过如下**插件**实现收集：

- [`dubbo-2.7.x-conflict-patch`](https://github.com/apache/skywalking/blob/master/apm-sniffer/apm-sdk-plugin/dubbo-2.7.x-conflict-patch/)
- [`dubbo-2.7.x-plugin`](https://github.com/apache/skywalking/blob/master/apm-sniffer/apm-sdk-plugin/dubbo-2.7.x-plugin/)
- [`dubbo-conflict-patch`](https://github.com/apache/skywalking/blob/master/apm-sniffer/apm-sdk-plugin/dubbo-conflict-patch/)
- [`dubbo-plugin`](https://github.com/apache/skywalking/blob/master/apm-sniffer/apm-sdk-plugin/dubbo-plugin/)

我们来新建一个 [`labx-14-sc-skywalking-dubbo`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-dubbo/) 模块，一共包含三个子项目。最终如下图所示：![项目结构](/assets/images/springcloud/31.png)

另外，考虑到 Spring Cloud Alibaba 主推 Nacos 作为诸注册中心，所以本小节也是使用 Nacos。不了解的胖友，后续可以看看[《Nacos 极简入门》](http://www.iocoder.cn/Nacos/install/?self)文章。

## 7.1 搭建 API 项目

创建 [`labx-14-sc-skywalking-dubbo-api`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-dubbo/labx-14-sc-skywalking-dubbo-api/) 项目，**服务接口**，定义 Dubbo Service API 接口，提供给消费者使用。

### 7.1.1 UserService

创建 [UserService](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-dubbo/labx-14-sc-skywalking-dubbo-api/src/main/java/cn/iocoder/springcloud/labx14/api/UserService.java) 接口，定义用户服务 RPC Service 接口。代码如下：



```
public interface UserService {

    /**
     * 根据指定用户编号，获得用户信息
     *
     * @param id 用户编号
     * @return 用户信息
     */
    String get(Integer id);

}
```



## 7.2 搭建服务提供者

创建 [`labx-14-sc-skywalking-dubbo-provider`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-dubbo/labx-14-sc-skywalking-dubbo-provider/) 项目，**服务提供者**，实现 `labx-14-sc-skywalking-dubbo-api` 项目定义的 Dubbo Service API 接口，提供相应的服务。

### 7.2.1 引入依赖

创建 [`pom.xml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-dubbo/labx-14-sc-skywalking-dubbo-provider/pom.xml) 文件中，引入依赖。



```
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>labx-14-sc-skywalking-dubbo</artifactId>
        <groupId>cn.iocoder.springboot.labs</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>labx-14-sc-skywalking-dubbo-provider</artifactId>

    <properties>
        <maven.compiler.target>1.8</maven.compiler.target>
        <maven.compiler.source>1.8</maven.compiler.source>
        <spring.boot.version>2.2.4.RELEASE</spring.boot.version>
        <spring.cloud.version>Hoxton.SR1</spring.cloud.version>
        <spring.cloud.alibaba.version>2.2.0.RELEASE</spring.cloud.alibaba.version>
    </properties>

    <!--
        引入 Spring Boot、Spring Cloud、Spring Cloud Alibaba 三者 BOM 文件，进行依赖版本的管理，防止不兼容。
        在 https://dwz.cn/mcLIfNKt 文章中，Spring Cloud Alibaba 开发团队推荐了三者的依赖关系
    -->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-starter-parent</artifactId>
                <version>${spring.boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring.cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                <version>${spring.cloud.alibaba.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <!-- 引入定义的 Dubbo API 接口 -->
        <dependency>
            <groupId>cn.iocoder.springboot.labs</groupId>
            <artifactId>labx-14-sc-skywalking-dubbo-api</artifactId>
            <version>1.0-SNAPSHOT</version>
        </dependency>

        <!-- 引入 Spring Cloud Alibaba Nacos Discovery 相关依赖，将 Nacos 作为注册中心，并实现对其的自动配置 -->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>

        <!-- 引入 Spring Cloud Alibaba Dubbo 相关依赖，实现呢 Dubbo 进行远程调用，并实现对其的自动配置 -->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-dubbo</artifactId>
        </dependency>
    </dependencies>

</project>
```



### 7.2.2 配置文件

创建 [`application.yml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-dubbo/labx-14-sc-skywalking-dubbo-provider/src/main/resources/application.yaml) 配置文件，添加相应配置项如下：



```
spring:
  application:
    name: demo-provider

# Dubbo 配置项，对应 DubboConfigurationProperties 类
dubbo:
  scan:
    base-packages: cn.iocoder.springcloud.labx14.providerdemo.service # 指定 Dubbo 服务实现类的扫描基准包
  # Dubbo 服务暴露的协议配置，对应 ProtocolConfig Map
  protocols:
    dubbo:
      name: dubbo # 协议名称
      port: -1 # 协议端口，-1 表示自增端口，从 20880 开始
  # Dubbo 服务注册中心配置，对应 RegistryConfig 类
  registry:
    address: spring-cloud://127.0.0.1:8848 # 指定 Dubbo 服务注册中心的地址
  # Spring Cloud Alibaba Dubbo 专属配置项，对应 DubboCloudProperties 类
  cloud:
    subscribed-services: '' # 设置订阅的应用列表，默认为 * 订阅所有应用。
```



> 关于 `dubbo` 配置项，胖友可以后续阅读[《芋道 Spring Cloud Alibaba 服务调用 Dubbo 入门》](http://www.iocoder.cn/Spring-Cloud-Alibaba/Dubbo/?self)文章。

### 7.2.3 UserServiceImpl

创建 [UserServiceImpl](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-dubbo/labx-14-sc-skywalking-dubbo-provider/src/main/java/cn/iocoder/springcloud/labx14/providerdemo/service/UserServiceImpl.java) 类，实现 UserService 接口，用户服务具体实现类。代码如下：



```
@org.apache.dubbo.config.annotation.Service(protocol = "dubbo", version = "1.0.0")
public class UserServiceImpl implements UserService {

    @Override
    public String get(Integer id) {
        return "user:" + id;
    }
    
}
```



### 7.2.4 ProviderApplication

创建 [ProviderApplication](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-dubbo/labx-14-sc-skywalking-dubbo-provider/src/main/java/cn/iocoder/springcloud/labx14/providerdemo/ProviderApplication.java) 类，服务提供者的启动类。代码如下：



```
@SpringBootApplication
public class ProviderApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProviderApplication.class);
    }

}
```



### 7.2.5 IDEA 配置

通过 IDEA 的「Run/Debug Configurations」配置使用 SkyWalking Agent。如下图所示：![Run/Debug Configurations](/assets/images/springcloud/32.png)

## 7.3 搭建服务消费者

创建 [`labx-14-sc-skywalking-dubbo-consumer`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-dubbo/labx-14-sc-skywalking-dubbo-consumer/) 项目，**服务消费者**，会调用 `labx-14-sc-skywalking-dubbo-provider` 项目提供的 User Service 服务。

### 7.3.1 引入依赖

创建 [`pom.xml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-dubbo/labx-14-sc-skywalking-dubbo-consumer/pom.xml) 文件中，引入依赖。和[「7.2.1 引入依赖」](https://www.iocoder.cn/Spring-Cloud/SkyWalking/?self#)基本是一致的，胖友可以点击 [`pom.xml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-dubbo/labx-14-sc-skywalking-dubbo-consumer/pom.xml) 文件查看。

### 7.3.2 配置文件

创建 [`application.yml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-dubbo/labx-14-sc-skywalking-dubbo-consumer/src/main/resources/application.yaml) 配置文件，添加相应配置项如下：



```
server:
  port: 8079

spring:
  application:
    name: demo-consumer
  cloud:
    # Nacos 作为注册中心的配置项
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848

# Dubbo 配置项，对应 DubboConfigurationProperties 类
dubbo:
  # Dubbo 服务注册中心配置，对应 RegistryConfig 类
  registry:
    address: spring-cloud://127.0.0.1:8848 # 指定 Dubbo 服务注册中心的地址
  # Spring Cloud Alibaba Dubbo 专属配置项，对应 DubboCloudProperties 类
  cloud:
    subscribed-services: demo-provider # 设置订阅的应用列表，默认为 * 订阅所有应用。
```



> 关于 `dubbo` 配置项，胖友可以后续阅读[《芋道 Spring Cloud Alibaba 服务调用 Dubbo 入门》](http://www.iocoder.cn/Spring-Cloud-Alibaba/Dubbo/?self)文章。

### 7.3.3 UserController

创建 [UserController](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-dubbo/labx-14-sc-skywalking-dubbo-consumer/src/main/java/cn/iocoder/springcloud/labx14/consumerdemo/controller/UserController.java) 类，提供调用 UserService 服务的 HTTP 接口。代码如下：



```
@RestController
@RequestMapping("/user")
public class UserController {

    @Reference(protocol = "dubbo", version = "1.0.0")
    private UserService userService;

    @GetMapping("/get")
    public String  get(@RequestParam("id") Integer id) {
        return userService.get(id);
    }

}
```



### 7.3.4 ConsumerApplication

创建 [ConsumerApplication](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-dubbo/labx-14-sc-skywalking-dubbo-consumer/src/main/java/cn/iocoder/springcloud/labx14/consumerdemo/ConsumerApplication.java) 类，服务消费者的启动类。代码如下：



```
@SpringBootApplication
public class ConsumerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConsumerApplication.class);
    }

}
```



### 7.3.5 IDEA 配置

通过 IDEA 的「Run/Debug Configurations」配置使用 SkyWalking Agent。如下图所示：![Run/Debug Configurations](/assets/images/springcloud/33.png)

## 7.4 简单测试

使用 ProviderApplication 启动服务提供者，使用 ConsumerApplication 启动服务消费者。

① 首先，使用浏览器，访问 http://127.0.0.1:8079/user/get?id=1 地址，使用 Dubbo 调用 `demo-provider` 服务。因为，我们要追踪下该链路。

② 然后，继续使用浏览器，打开 http://127.0.0.1:8080/ 地址，进入 SkyWalking UI 界面。如下图所示：![SkyWalking UI 界面 —— 仪表盘](/assets/images/springcloud/34.png)

③ 之后，点击「拓扑图」菜单，进入查看拓扑图的界面，可以看到两个服务的小方块，以及对应的调用关系。如下图所示：![SkyWalking UI 界面 —— 拓扑图](/assets/images/springcloud/35.png)

④ 再之后，点击「追踪」菜单，进入查看链路数据的界面。如下图所示：![SkyWalking UI 界面 —— 追踪](/assets/images/springcloud/36.png)

# 8. MySQL 示例

详见[《芋道 Spring Boot 链路追踪 SkyWalking 入门》](http://www.iocoder.cn/Spring-Boot/SkyWalking/?self)文章的[「4. MySQL 示例」](https://www.iocoder.cn/Spring-Cloud/SkyWalking/?self#)小节。

# 9. Redis 示例

详见[《芋道 Spring Boot 链路追踪 SkyWalking 入门》](http://www.iocoder.cn/Spring-Boot/SkyWalking/?self)文章的[「5. Redis 示例」](https://www.iocoder.cn/Spring-Cloud/SkyWalking/?self#)小节。

# 10. MongoDB 示例

详见[《芋道 Spring Boot 链路追踪 SkyWalking 入门》](http://www.iocoder.cn/Spring-Boot/SkyWalking/?self)文章的[「6. MongoDB 示例」](https://www.iocoder.cn/Spring-Cloud/SkyWalking/?self#)小节。

# 11. Elasticsearch 示例

详见[《芋道 Spring Boot 链路追踪 SkyWalking 入门》](http://www.iocoder.cn/Spring-Boot/Elasticsearch/?self)文章的[「7. Elasticsearch 示例」](https://www.iocoder.cn/Spring-Cloud/SkyWalking/?self#)小节。

# 12. RocketMQ 示例

> 示例代码对应仓库：
>
> - 生产者：[`labx-14-sc-skywalking-mq-rocketmq-producer`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-producer/)
> - 消费者：[`labx-14-sc-skywalking-mq-rocketmq-consumer`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-consumer/)

本小节，我们来搭建一个 SkyWalking 对 RocketMQ 消息的发送和消费的链路追踪。该链路通过如下插件实现收集：

- [`rocketMQ-3.x-plugin`](https://github.com/apache/skywalking/tree/master/apm-sniffer/apm-sdk-plugin/rocketMQ-3.x-plugin)
- [`rocketMQ-4.x-plugin`](https://github.com/apache/skywalking/blob/master/apm-sniffer/apm-sdk-plugin/rocketMQ-4.x-plugin/)

我们来新建一个 [`labx-14-sc-skywalking-mq-rocketmq`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/) 模块，会包括生产者和消费者两个子项目。最终如下图所示：![项目结构](/assets/images/springcloud/41.png)

另外，我们将使用 Spring Cloud **Stream RocketMQ** 进行 RocketMQ 的操作。对 RocketMQ 感兴趣的胖友，可以后续去看看[《芋道 Spring Cloud 消息队列 RocketMQ 入门》](http://www.iocoder.cn/Spring-Cloud-Alibaba/RocketMQ/?self)文章。

## 12.1 搭建生产者

创建 [`labx-14-sc-skywalking-mq-rocketmq-producer`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-producer/) 项目，作为生产者。

### 12.1.1 引入依赖

创建 [`pom.xml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-producer/pom.xml) 文件中，引入相关依赖。



```
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>labx-14-sc-skywalking-mq-rocketmq</artifactId>
        <groupId>cn.iocoder.springboot.labs</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>labx-14-sc-skywalking-mq-rocketmq-producer</artifactId>

    <properties>
        <maven.compiler.target>1.8</maven.compiler.target>
        <maven.compiler.source>1.8</maven.compiler.source>
        <spring.boot.version>2.2.4.RELEASE</spring.boot.version>
        <spring.cloud.version>Hoxton.SR1</spring.cloud.version>
        <spring.cloud.alibaba.version>2.2.0.RELEASE</spring.cloud.alibaba.version>
    </properties>

    <!--
        引入 Spring Boot、Spring Cloud、Spring Cloud Alibaba 三者 BOM 文件，进行依赖版本的管理，防止不兼容。
        在 https://dwz.cn/mcLIfNKt 文章中，Spring Cloud Alibaba 开发团队推荐了三者的依赖关系
     -->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-starter-parent</artifactId>
                <version>${spring.boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring.cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                <version>${spring.cloud.alibaba.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <!-- 引入 SpringMVC 相关依赖，并实现对其的自动配置 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- 引入 Spring Cloud Alibaba Stream RocketMQ 相关依赖，将 RocketMQ 作为消息队列，并实现对其的自动配置 -->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-stream-rocketmq</artifactId>
        </dependency>
    </dependencies>

</project>
```



### 12.1.2 配置文件

创建 [`application.yaml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-producer/src/main/resources/application.yml) 配置文件，添加相关配置。



```
spring:
  application:
    name: demo-producer-application
  cloud:
    # Spring Cloud Stream 配置项，对应 BindingServiceProperties 类
    stream:
      # Binding 配置项，对应 BindingProperties Map
      bindings:
        demo01-output:
          destination: DEMO-TOPIC-01 # 目的地。这里使用 RocketMQ Topic
          content-type: application/json # 内容格式。这里使用 JSON
      # Spring Cloud Stream RocketMQ 配置项
      rocketmq:
        # RocketMQ Binder 配置项，对应 RocketMQBinderConfigurationProperties 类
        binder:
          name-server: 127.0.0.1:9876 # RocketMQ Namesrv 地址
        # RocketMQ 自定义 Binding 配置项，对应 RocketMQBindingProperties Map
        bindings:
          demo01-output:
            # RocketMQ Producer 配置项，对应 RocketMQProducerProperties 类
            producer:
              group: test # 生产者分组
              sync: true # 是否同步发送消息，默认为 false 异步。

server:
  port: 18080
```



### 12.1.3 MySource

创建 [MySource](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-producer/src/main/java/cn/iocoder/springcloud/labx14/rocketmqdemo/producerdemo/message/MySource.java) 接口，声明名字为 Output Binding。代码如下：



```
public interface MySource {

    @Output("demo01-output")
    MessageChannel demo01Output();

}
```



### 12.1.4 Demo01Message

创建 [Demo01Message](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-producer/src/main/java/cn/iocoder/springcloud/labx14/rocketmqdemo/producerdemo/message/Demo01Message.java) 类，示例 Message 消息。代码如下：



```
public class Demo01Message {

    /**
     * 编号
     */
    private Integer id;

    // ... 省略 setter/getter/toString 方法

}
```



### 12.1.5 Demo01Controller

创建 [Demo01Controller](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-producer/src/main/java/cn/iocoder/springcloud/labx14/rocketmqdemo/producerdemo/controller/Demo01Controller.java) 类，提供发送消息的 HTTP 接口。代码如下：



```
@RestController
@RequestMapping("/demo01")
public class Demo01Controller {

    private Logger logger = LoggerFactory.getLogger(getClass());

    @Autowired
    private MySource mySource;

    @GetMapping("/send")
    public boolean send() {
        // 创建 Message
        Demo01Message message = new Demo01Message()
                .setId(new Random().nextInt());
        // 创建 Spring Message 对象
        Message<Demo01Message> springMessage = MessageBuilder.withPayload(message)
                .build();
        // 发送消息
        return mySource.demo01Output().send(springMessage);
    }

}
```



### 12.1.6 ProducerApplication

创建 [ProducerApplication](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-producer/src/main/java/cn/iocoder/springcloud/labx14/rocketmqdemo/producerdemo/ProducerApplication.java) 类，启动生产者的应用。代码如下：



```
@SpringBootApplication
@EnableBinding(MySource.class)
public class ProducerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProducerApplication.class, args);
    }

}
```



### 12.1.7 IDEA 配置

通过 IDEA 的「Run/Debug Configurations」配置使用 SkyWalking Agent。如下图所示：![Run/Debug Configurations](/assets/images/springcloud/45.png)

## 12.2 搭建消费者

创建 [`labx-14-sc-skywalking-mq-rocketmq-consumer`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-consumer/) 项目，作为消费者。

### 12.2.1 引入依赖

创建 [`pom.xml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-consumer/pom.xml) 文件中，引入相关依赖。

> 友情提示：和[「12.1 搭建生产者」](https://www.iocoder.cn/Spring-Cloud/SkyWalking/?self#)基本一样，点击 [链接](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-consumer/pom.xml) 查看。

### 12.2.2 配置文件

创建 [`application.yaml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-consumer/src/main/resources/application.yml) 配置文件，添加相关配置。



```
spring:
  application:
    name: demo-consumer-application
  cloud:
    # Spring Cloud Stream 配置项，对应 BindingServiceProperties 类
    stream:
      # Binding 配置项，对应 BindingProperties Map
      bindings:
        demo01-input:
          destination: DEMO-TOPIC-01 # 目的地。这里使用 RocketMQ Topic
          content-type: application/json # 内容格式。这里使用 JSON
          group: demo01-consumer-group-DEMO-TOPIC-01 # 消费者分组
      # Spring Cloud Stream RocketMQ 配置项
      rocketmq:
        # RocketMQ Binder 配置项，对应 RocketMQBinderConfigurationProperties 类
        binder:
          name-server: 127.0.0.1:9876 # RocketMQ Namesrv 地址
        # RocketMQ 自定义 Binding 配置项，对应 RocketMQBindingProperties Map
        bindings:
          demo01-input:
            # RocketMQ Consumer 配置项，对应 RocketMQConsumerProperties 类
            consumer:
              enabled: true # 是否开启消费，默认为 true
              broadcasting: false # 是否使用广播消费，默认为 false 使用集群消费

server:
  port: ${random.int[10000,19999]} # 随机端口，方便启动多个消费者
```



### 12.2.3 MySink

创建 [MySink](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-consumer/src/main/java/cn/iocoder/springcloud/labx14/rocketmqdemo/consumerdemo/listener/MySink.java) 接口，声明名字为 Input Binding。代码如下：



```
public interface MySink {

    String DEMO01_INPUT = "demo01-input";

    @Input(DEMO01_INPUT)
    SubscribableChannel demo01Input();

}
```



### 12.2.4 Demo01Message

创建 [Demo01Message](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-consumer/src/main/java/cn/iocoder/springcloud/labx14/rocketmqdemo/consumerdemo/message/Demo01Message.java) 类，示例 Message 消息。

> 友情提示：和[「12.1.4 Demo01Message」](https://www.iocoder.cn/Spring-Cloud/SkyWalking/?self#)基本一样，点击 [链接](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-consumer/src/main/java/cn/iocoder/springcloud/labx14/rocketmqdemo/consumerdemo/message/Demo01Message.java) 查看。

### 12.2.5 Demo01Consumer

创建 [Demo01Consumer](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-consumer/src/main/java/cn/iocoder/springcloud/labx14/rocketmqdemo/consumerdemo/listener/Demo01Consumer.java) 类，消费消息。代码如下：



```
@Component
public class Demo01Consumer {

    private Logger logger = LoggerFactory.getLogger(getClass());

    @StreamListener(MySink.DEMO01_INPUT)
    public void onMessage(@Payload Demo01Message message) {
        logger.info("[onMessage][线程编号:{} 消息内容：{}]", Thread.currentThread().getId(), message);
    }

}
```



### 12.2.6 ConsumerApplication

创建 [ConsumerApplication](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rocketmq/labx-14-sc-skywalking-mq-rocketmq-consumer/src/main/java/cn/iocoder/springcloud/labx14/rocketmqdemo/consumerdemo/ConsumerApplication.java) 类，启动应用。代码如下：



```
@SpringBootApplication
@EnableBinding(MySink.class)
public class ConsumerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConsumerApplication.class, args);
    }

}
```



### 12.2.7 IDEA 配置

通过 IDEA 的「Run/Debug Configurations」配置使用 SkyWalking Agent。如下图所示：![Run/Debug Configurations](/assets/images/springcloud/46.png)

## 12.3 简单测试

使用 ProducerApplication 启动生产者，使用 ConsumerApplication 启动消费者。

① 首先，使用浏览器，访问 http://127.0.0.1:18080/demo01/sent 地址，使用 RocketMQ Producer 发送一条消息，从而触发 RocketMQ Consumer 消费一条消息。因为，我们要追踪下该链路。

② 然后，继续使用浏览器，打开 http://127.0.0.1:8080/ 地址，进入 SkyWalking UI 界面。如下图所示：![SkyWalking UI 界面 —— 仪表盘](/assets/images/springcloud/42.png)

③ 之后，点击「拓扑图」菜单，进入查看拓扑图的界面，可以看到 RocketMQ Broker 的小方块，以及对应的生产者和消费者。如下图所示：![SkyWalking UI 界面 —— 拓扑图](/assets/images/springcloud/43.png)

④ 再之后，点击「追踪」菜单，进入查看链路数据的界面。如下图所示：![SkyWalking UI 界面 —— 追踪](/assets/images/springcloud/44.png)

# 13. RabbitMQ 示例

> 示例代码对应仓库：
>
> - 生产者：[`labx-14-sc-skywalking-mq-rabbitmq-producer`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-producer/)
> - 消费者：[`labx-14-sc-skywalking-mq-rabbitmq-consumer`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-consumer/)

本小节，我们来搭建一个 SkyWalking 对 RabbitMQ 消息的发送和消费的链路追踪。该链路通过如下插件实现收集：

- [`rabbitmq-5.x-plugin`](https://github.com/apache/skywalking/tree/master/apm-sniffer/apm-sdk-plugin/rabbitmq-5.x-plugin)

我们来新建一个 [`labx-14-sc-skywalking-mq-rabbitmq`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/) 模块，会包括生产者和消费者两个子项目。最终如下图所示：![项目结构](/assets/images/springcloud/51.png)

另外，我们将使用 Spring Cloud **Stream RabbitMQ** 进行 RabbitMQ 的操作。对 RabbitMQ 感兴趣的胖友，可以后续去看看[《芋道 Spring Cloud 消息队列 RabbitMQ 入门》](http://www.iocoder.cn/Spring-Cloud/RabbitMQ/?self)文章。

## 13.1 搭建生产者

创建 [`labx-14-sc-skywalking-mq-rabbitmq-producer`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-producer/) 项目，作为生产者。

### 13.1.1 引入依赖

创建 [`pom.xml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-producer/pom.xml) 文件中，引入相关依赖。



```
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>labx-14-sc-skywalking-mq-rabbitmq</artifactId>
        <groupId>cn.iocoder.springboot.labs</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>labx-14-sc-skywalking-mq-rabbitmq-producer</artifactId>

    <properties>
        <maven.compiler.target>1.8</maven.compiler.target>
        <maven.compiler.source>1.8</maven.compiler.source>
        <spring.boot.version>2.2.4.RELEASE</spring.boot.version>
        <spring.cloud.version>Hoxton.SR1</spring.cloud.version>
    </properties>

    <!--
        引入 Spring Boot、Spring Cloud、Spring Cloud Alibaba 三者 BOM 文件，进行依赖版本的管理，防止不兼容。
        在 https://dwz.cn/mcLIfNKt 文章中，Spring Cloud Alibaba 开发团队推荐了三者的依赖关系
     -->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-starter-parent</artifactId>
                <version>${spring.boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring.cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <!-- 引入 SpringMVC 相关依赖，并实现对其的自动配置 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- 引入 Spring Cloud Stream RabbitMQ 相关依赖，将 RabbitMQ 作为消息队列，并实现对其的自动配置 -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-stream-rabbit</artifactId>
        </dependency>
    </dependencies>

</project>
```



### 13.1.2 配置文件

创建 [`application.yaml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-producer/src/main/resources/application.yml) 配置文件，添加相关配置。



```
spring:
  application:
    name: demo-producer-application
  cloud:
    # Spring Cloud Stream 配置项，对应 BindingServiceProperties 类
    stream:
      # Binder 配置项，对应 BinderProperties Map
      binders:
        rabbit001:
          type: rabbit # 设置 Binder 的类型
          environment: # 设置 Binder 的环境配置
            # 如果是 RabbitMQ 类型的时候，则对应的是 RabbitProperties 类
            spring:
              rabbitmq:
                host: 127.0.0.1 # RabbitMQ 服务的地址
                port: 5672 # RabbitMQ 服务的端口
                username: guest # RabbitMQ 服务的账号
                password: guest # RabbitMQ 服务的密码
      # Binding 配置项，对应 BindingProperties Map
      bindings:
        demo01-output:
          destination: DEMO-TOPIC-01 # 目的地。这里使用 RabbitMQ Exchange
          content-type: application/json # 内容格式。这里使用 JSON
          binder: rabbit001 # 设置使用的 Binder 名字

server:
  port: 18080
```



### 13.1.3 MySource

创建 [MySource](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-producer/src/main/java/cn/iocoder/springcloud/labx14/rabbitmqdemo/producerdemo/message/MySource.java) 接口，声明名字为 Output Binding。代码如下：



```
public interface MySource {

    @Output("demo01-output")
    MessageChannel demo01Output();

}
```



### 13.1.4 Demo01Message

创建 [Demo01Message](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-producer/src/main/java/cn/iocoder/springcloud/labx14/rabbitmqdemo/producerdemo/message/Demo01Message.java) 类，示例 Message 消息。代码如下：



```
public class Demo01Message {

    /**
     * 编号
     */
    private Integer id;

    // ... 省略 setter/getter/toString 方法

}
```



### 13.1.5 Demo01Controller

创建 [Demo01Controller](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-producer/src/main/java/cn/iocoder/springcloud/labx14/rabbitmqdemo/producerdemo/controller/Demo01Controller.java) 类，提供发送消息的 HTTP 接口。代码如下：



```
@RestController
@RequestMapping("/demo01")
public class Demo01Controller {

    private Logger logger = LoggerFactory.getLogger(getClass());

    @Autowired
    private MySource mySource;

    @GetMapping("/send")
    public boolean send() {
        // 创建 Message
        Demo01Message message = new Demo01Message()
                .setId(new Random().nextInt());
        // 创建 Spring Message 对象
        Message<Demo01Message> springMessage = MessageBuilder.withPayload(message)
                .build();
        // 发送消息
        return mySource.demo01Output().send(springMessage);
    }

}
```



### 13.1.6 ProducerApplication

创建 [ProducerApplication](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-producer/src/main/java/cn/iocoder/springcloud/labx14/rabbitmqdemo/producerdemo/ProducerApplication.java) 类，启动生产者的应用。代码如下：



```
@SpringBootApplication
@EnableBinding(MySource.class)
public class ProducerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProducerApplication.class, args);
    }

}
```



### 13.1.7 IDEA 配置

通过 IDEA 的「Run/Debug Configurations」配置使用 SkyWalking Agent。如下图所示：[Run/Debug Configurations](https://static.iocoder.cn/images/Spring-Cloud/2021-01-04/52.png)

## 13.2 搭建消费者

创建 [`labx-14-sc-skywalking-mq-rabbitmq-consumer`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-consumer/) 项目，作为消费者。

### 13.2.1 引入依赖

创建 [`pom.xml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-consumer/pom.xml) 文件中，引入相关依赖。

> 友情提示：和[「13.1 搭建生产者」](https://www.iocoder.cn/Spring-Cloud/SkyWalking/?self#)基本一样，点击 [链接](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-consumer/pom.xml) 查看。

### 13.2.2 配置文件

创建 [`application.yaml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-consumer/src/main/resources/application.yml) 配置文件，添加相关配置。



```
spring:
  application:
    name: demo-consumer-application
  cloud:
    # Spring Cloud Stream 配置项，对应 BindingServiceProperties 类
    stream:
      # Binder 配置项，对应 BinderProperties Map
      binders:
        rabbit001:
          type: rabbit # 设置 Binder 的类型
          environment: # 设置 Binder 的环境配置
            # 如果是 RabbitMQ 类型的时候，则对应的是 RabbitProperties 类
            spring:
              rabbitmq:
                host: 127.0.0.1 # RabbitMQ 服务的地址
                port: 5672 # RabbitMQ 服务的端口
                username: guest # RabbitMQ 服务的账号
                password: guest # RabbitMQ 服务的密码
      # Binding 配置项，对应 BindingProperties Map
      bindings:
        demo01-input:
          destination: DEMO-TOPIC-01 # 目的地。这里使用 RabbitMQ Exchange
          content-type: application/json # 内容格式。这里使用 JSON
          group: demo01-consumer-group-DEMO-TOPIC-01 # 消费者分组
          binder: rabbit001  # 设置使用的 Binder 名字

server:
  port: ${random.int[10000,19999]} # 随机端口，方便启动多个消费者
```



### 13.2.3 MySink

创建 [MySink](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-consumer/src/main/java/cn/iocoder/springcloud/labx14/rabbitmqdemo/consumerdemo/listener/MySink.java) 接口，声明名字为 Input Binding。代码如下：



```
public interface MySink {

    String DEMO01_INPUT = "demo01-input";

    @Input(DEMO01_INPUT)
    SubscribableChannel demo01Input();

}
```



### 13.2.4 Demo01Message

创建 [Demo01Message](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-consumer/src/main/java/cn/iocoder/springcloud/labx14/rabbitmqdemo/consumerdemo/message/Demo01Message.java) 类，示例 Message 消息。

> 友情提示：和[「13.1.4 Demo01Message」](https://www.iocoder.cn/Spring-Cloud/SkyWalking/?self#)基本一样，点击 [链接](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-consumer/src/main/java/cn/iocoder/springcloud/labx14/rabbitmqdemo/consumerdemo/message/Demo01Message.java) 查看。

### 13.2.5 Demo01Consumer

创建 [Demo01Consumer](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-consumer/src/main/java/cn/iocoder/springcloud/labx14/rabbitmqdemo/consumerdemo/listener/Demo01Consumer.java) 类，消费消息。代码如下：



```
@Component
public class Demo01Consumer {

    private Logger logger = LoggerFactory.getLogger(getClass());

    @StreamListener(MySink.DEMO01_INPUT)
    public void onMessage(@Payload Demo01Message message) {
        logger.info("[onMessage][线程编号:{} 消息内容：{}]", Thread.currentThread().getId(), message);
    }

}
```



### 13.2.6 ConsumerApplication

创建 [ConsumerApplication](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-rabbitmq/labx-14-sc-skywalking-mq-rabbitmq-consumer/src/main/java/cn/iocoder/springcloud/labx14/rabbitmqdemo/consumerdemo/ConsumerApplication.java) 类，启动应用。代码如下：



```
@SpringBootApplication
@EnableBinding(MySink.class)
public class ConsumerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConsumerApplication.class, args);
    }

}
```



### 13.2.7 IDEA 配置

通过 IDEA 的「Run/Debug Configurations」配置使用 SkyWalking Agent。如下图所示：![Run/Debug Configurations](/assets/images/springcloud/53.png)

## 13.3 简单测试

使用 ProducerApplication 启动生产者，使用 ConsumerApplication 启动消费者。

① 首先，使用浏览器，访问 http://127.0.0.1:18080/demo01/sent 地址，使用 RabbitMQ Producer 发送一条消息，从而触发 RabbitMQ Consumer 消费一条消息。因为，我们要追踪下该链路。

② 然后，继续使用浏览器，打开 http://127.0.0.1:8080/ 地址，进入 SkyWalking UI 界面。如下图所示：![SkyWalking UI 界面 —— 仪表盘](/assets/images/springcloud/54.png)

③ 之后，点击「拓扑图」菜单，进入查看拓扑图的界面，可以看到 RabbitMQ Broker 的小方块，以及对应的生产者和消费者。如下图所示：![SkyWalking UI 界面 —— 拓扑图](/assets/images/springcloud/55.png)

④ 再之后，点击「追踪」菜单，进入查看链路数据的界面。如下图所示：![SkyWalking UI 界面 —— 追踪](/assets/images/springcloud/56.png)

# 14. Kafka 示例

> 示例代码对应仓库：
>
> - 生产者：[`labx-14-sc-skywalking-mq-kafka-producer`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-producer/)
> - 消费者：[`labx-14-sc-skywalking-mq-kafka-consumer`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-consumer/)

本小节，我们来搭建一个 SkyWalking 对 Kafka 消息的发送和消费的链路追踪。该链路通过如下插件实现收集：

- [`kafka-plugin`](https://github.com/apache/skywalking/tree/master/apm-sniffer/apm-sdk-plugin/kafka-plugin)

我们来新建一个 [`labx-14-sc-skywalking-mq-Kafka`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-Kafka/) 模块，会包括生产者和消费者两个子项目。最终如下图所示：![项目结构](/assets/images/springcloud/61.png)

另外，我们将使用 Spring Cloud **Stream Kafka** 进行 Kafka 的操作。对 Kafka 感兴趣的胖友，可以后续去看看[《芋道 Spring Cloud 消息队列 Kafka 入门》](http://www.iocoder.cn/Spring-Cloud/Kafka/?self)文章。

## 14.1 搭建生产者

创建 [`labx-14-sc-skywalking-mq-kafka-producer`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-producer/) 项目，作为生产者。

### 14.1.1 引入依赖

创建 [`pom.xml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-producer/pom.xml) 文件中，引入相关依赖。



```
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <artifactId>labx-14-sc-skywalking-mq-kafka</artifactId>
        <groupId>cn.iocoder.springboot.labs</groupId>
        <version>1.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>labx-14-sc-skywalking-mq-kafka-producer</artifactId>

    <properties>
        <maven.compiler.target>1.8</maven.compiler.target>
        <maven.compiler.source>1.8</maven.compiler.source>
        <spring.boot.version>2.2.4.RELEASE</spring.boot.version>
        <spring.cloud.version>Hoxton.SR1</spring.cloud.version>
    </properties>

    <!--
        引入 Spring Boot、Spring Cloud、Spring Cloud Alibaba 三者 BOM 文件，进行依赖版本的管理，防止不兼容。
        在 https://dwz.cn/mcLIfNKt 文章中，Spring Cloud Alibaba 开发团队推荐了三者的依赖关系
     -->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-starter-parent</artifactId>
                <version>${spring.boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring.cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <!-- 引入 SpringMVC 相关依赖，并实现对其的自动配置 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- 引入 Spring Cloud Stream Kafka 相关依赖，将 Kafka 作为消息队列，并实现对其的自动配置 -->
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-stream-kafka</artifactId>
        </dependency>
    </dependencies>

</project>
```



### 14.1.2 配置文件

创建 [`application.yaml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-producer/src/main/resources/application.yml) 配置文件，添加相关配置。



```
spring:
  application:
    name: demo-producer-application
  cloud:
    # Spring Cloud Stream 配置项，对应 BindingServiceProperties 类
    stream:
      # Binder 配置项，对应 BinderProperties Map
      #      binders:
      # Binding 配置项，对应 BindingProperties Map
      bindings:
        demo01-output:
          destination: DEMO-TOPIC-01 # 目的地。这里使用 Kafka Topic
          content-type: application/json # 内容格式。这里使用 JSON
      # Spring Cloud Stream Kafka 配置项
      kafka:
        # Kafka Binder 配置项，对应 KafkaBinderConfigurationProperties 类
        binder:
          brokers: 127.0.0.1:9092 # 指定 Kafka Broker 地址，可以设置多个，以逗号分隔
        # Kafka 自定义 Binding 配置项，对应 KafkaBindingProperties Map
        bindings:
          demo01-output:
            # Kafka Producer 配置项，对应 KafkaProducerProperties 类
            producer:
              sync: true # 是否同步发送消息，默认为 false 异步。

server:
  port: 18080
```



### 14.1.3 MySource

创建 [MySource](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-producer/src/main/java/cn/iocoder/springcloud/labx14/kafkademo/producerdemo/message/MySource.java) 接口，声明名字为 Output Binding。代码如下：



```
public interface MySource {

    @Output("demo01-output")
    MessageChannel demo01Output();

}
```



### 14.1.4 Demo01Message

创建 [Demo01Message](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-producer/src/main/java/cn/iocoder/springcloud/labx14/kafkademo/producerdemo/message/Demo01Message.java) 类，示例 Message 消息。代码如下：



```
public class Demo01Message {

    /**
     * 编号
     */
    private Integer id;

    // ... 省略 setter/getter/toString 方法

}
```



### 14.1.5 Demo01Controller

创建 [Demo01Controller](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-producer/src/main/java/cn/iocoder/springcloud/labx14/kafkademo/producerdemo/controller/Demo01Controller.java) 类，提供发送消息的 HTTP 接口。代码如下：



```
@RestController
@RequestMapping("/demo01")
public class Demo01Controller {

    private Logger logger = LoggerFactory.getLogger(getClass());

    @Autowired
    private MySource mySource;

    @GetMapping("/send")
    public boolean send() {
        // 创建 Message
        Demo01Message message = new Demo01Message()
                .setId(new Random().nextInt());
        // 创建 Spring Message 对象
        Message<Demo01Message> springMessage = MessageBuilder.withPayload(message)
                .build();
        // 发送消息
        return mySource.demo01Output().send(springMessage);
    }

}
```



### 14.1.6 ProducerApplication

创建 [ProducerApplication](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-producer/src/main/java/cn/iocoder/springcloud/labx14/kafkademo/producerdemo/ProducerApplication.java) 类，启动生产者的应用。代码如下：



```
@SpringBootApplication
@EnableBinding(MySource.class)
public class ProducerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProducerApplication.class, args);
    }

}
```



### 14.1.7 IDEA 配置

通过 IDEA 的「Run/Debug Configurations」配置使用 SkyWalking Agent。如下图所示：![Run/Debug Configurations](/assets/images/springcloud/62.png)

## 14.2 搭建消费者

创建 [`labx-14-sc-skywalking-mq-kafka-consumer`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-consumer/) 项目，作为消费者。

### 14.2.1 引入依赖

创建 [`pom.xml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-consumer/pom.xml) 文件中，引入相关依赖。

> 友情提示：和[「14.1 搭建生产者」](https://www.iocoder.cn/Spring-Cloud/SkyWalking/?self#)基本一样，点击 [链接](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-consumer/pom.xml) 查看。

### 14.2.2 配置文件

创建 [`application.yaml`](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-consumer/src/main/resources/application.yml) 配置文件，添加相关配置。



```
spring:
  application:
    name: demo-consumer-application
  cloud:
    # Spring Cloud Stream 配置项，对应 BindingServiceProperties 类
    stream:
      # Binder 配置项，对应 BinderProperties Map
      #      binders:
      # Binding 配置项，对应 BindingProperties Map
      bindings:
        demo01-input:
          destination: DEMO-TOPIC-01 # 目的地。这里使用 Kafka Topic
          content-type: application/json # 内容格式。这里使用 JSON
          group: demo01-consumer-group # 消费者分组
      # Spring Cloud Stream Kafka 配置项
      kafka:
        # Kafka Binder 配置项，对应 KafkaBinderConfigurationProperties 类
        binder:
          brokers: 127.0.0.1:9092 # 指定 Kafka Broker 地址，可以设置多个，以逗号分隔

server:
  port: ${random.int[10000,19999]} # 随机端口，方便启动多个消费者
```



### 14.2.3 MySink

创建 [MySink](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-consumer/src/main/java/cn/iocoder/springcloud/labx14/kafkademo/consumerdemo/listener/MySink.java) 接口，声明名字为 Input Binding。代码如下：



```
public interface MySink {

    String DEMO01_INPUT = "demo01-input";

    @Input(DEMO01_INPUT)
    SubscribableChannel demo01Input();

}
```



### 14.2.4 Demo01Message

创建 [Demo01Message](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-consumer/src/main/java/cn/iocoder/springcloud/labx14/kafkademo/consumerdemo/message/Demo01Message.java) 类，示例 Message 消息。

> 友情提示：和[「14.1.4 Demo01Message」](https://www.iocoder.cn/Spring-Cloud/SkyWalking/?self#)基本一样，点击 [链接](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-consumer/src/main/java/cn/iocoder/springcloud/labx14/kafkademo/consumerdemo/message/Demo01Message.java) 查看。

### 14.2.5 Demo01Consumer

创建 [Demo01Consumer](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-consumer/src/main/java/cn/iocoder/springcloud/labx14/kafkademo/consumerdemo/listener/Demo01Consumer.java) 类，消费消息。代码如下：



```
@Component
public class Demo01Consumer {

    private Logger logger = LoggerFactory.getLogger(getClass());

    @StreamListener(MySink.DEMO01_INPUT)
    public void onMessage(@Payload Demo01Message message) {
        logger.info("[onMessage][线程编号:{} 消息内容：{}]", Thread.currentThread().getId(), message);
    }

}
```



### 14.2.6 ConsumerApplication

创建 [ConsumerApplication](https://github.com/YunaiV/SpringBoot-Labs/blob/master/labx-14/labx-14-sc-skywalking-mq-kafka/labx-14-sc-skywalking-mq-kafka-consumer/src/main/java/cn/iocoder/springcloud/labx14/kafkademo/consumerdemo/ConsumerApplication.java) 类，启动应用。代码如下：



```
@SpringBootApplication
@EnableBinding(MySink.class)
public class ConsumerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConsumerApplication.class, args);
    }

}
```



### 14.2.7 IDEA 配置

通过 IDEA 的「Run/Debug Configurations」配置使用 SkyWalking Agent。如下图所示：![Run/Debug Configurations](/assets/images/springcloud/66.png)

## 14.3 简单测试

使用 ProducerApplication 启动生产者，使用 ConsumerApplication 启动消费者。

① 首先，使用浏览器，访问 http://127.0.0.1:18080/demo01/sent 地址，使用 Kafka Producer 发送一条消息，从而触发 Kafka Consumer 消费一条消息。因为，我们要追踪下该链路。

② 然后，继续使用浏览器，打开 http://127.0.0.1:8080/ 地址，进入 SkyWalking UI 界面。如下图所示：![SkyWalking UI 界面 —— 仪表盘](/assets/images/springcloud/63.png)

③ 之后，点击「拓扑图」菜单，进入查看拓扑图的界面，可以看到 Kafka Broker 的小方块，以及对应的生产者和消费者。如下图所示：![SkyWalking UI 界面 —— 拓扑图](/assets/images/springcloud/64.png)

④ 再之后，点击「追踪」菜单，进入查看链路数据的界面。如下图所示：![SkyWalking UI 界面 —— 追踪](/assets/images/springcloud/65.png)



# What’s your problem

## 注意事项

1. 对于springboot应用,使用javaagent时不要使用 devtools
2. 不用使用 jrebel
3. 导入插件时注意版本,如spring-cloud-gateway版本为2.x.x 就应添加2.x.x的可选插件以及webflux插件
