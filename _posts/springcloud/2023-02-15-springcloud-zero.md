---
layout: post
title: Spring Cloud Zero 学习笔记
subtitle: Spring Cloud Zero 学习笔记
categories: SpringCloud
tags: [SpringCloud]
banner:
  video: null             # Video banner source
  loop: true              # Video loop
  volume: 0               # Video volume (100% is 1.0)
  start_at: 0             # Video start time
  image: /assets/images/banners/spy5.jpg    # Image banner source
---

# What’s your problems

## Gateway

### 启动失败

> Description:
>
> Parameter 0 of method modifyResponseBodyGatewayFilterFactory in org.springframework.cloud.gateway.config.GatewayAutoConfiguration required a bean of type 'org.springframework.http.codec.ServerCodecConfigurer' that could not be found.
>
>
> Action:
>
> Consider defining a bean of type 'org.springframework.http.codec.ServerCodecConfigurer' in your configuration.

springcloud gateway不需要web starter,在pom文件中移除:

```xml
        <!-- SpringBoot整合Web组件 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
```



### strict-origin-when-cross-origin

问题描述：

![img](/assets/images/springcloud/180f5fe8dde94c1ea30b889df75cdf0a.png)



将Vue前端部署到服务器的[Nginx](https://so.csdn.net/so/search?q=Nginx&spm=1001.2101.3001.7020)以后，浏览器访问资源时就会产生跨域问题，随后使用gateway做了网关配置。配置完成后使用谷歌浏览器访问资源时控制台报错strict-origin-when-cross-origin

随后使用火狐浏览器访问资源时为200

而直接在地址栏输入请求url也是200

解决思路

网站当前访问是使用 `https`，而提交表单或 `ajax` 请求却使用的是 `http`，可以归类为跨域问题。只需要将表单或`ajax`请求由`http`也修改为`https`即可

解决方案

谷歌浏览器，输入: chrome://flags/#block-insecure-private-network-requests，将 **Block insecure private network requests** 这个插件设置为 `Disabled` 就行了

![img](/assets/images/springcloud/708091aa8f934700814ef053bc12475e.png)



### Chrome 错误代码：ERR_UNSAFE_PORT

提示错误代码：ERR_UNSAFE_PORT

![img](/assets/images/springcloud/20140910205417220)



不想修改浏览器设置的就改用其它端口吧，搜索了一下，Firefox也有类似的端口限制；如果非要使用类似的端口，

我们要做的是允许访问非常规端口地址，解决办法：选中Google Chrome 快捷方式，右键属性，在”目标”对应文本框添加：

```
--explicitly-allowed-ports=87,6666,556,6667
```





允许多个端口以逗号隔开，最终如下：

```
C:\Users\Huoqing\AppData\Local\Google\Chrome\Application\chrome.exe  --explicitly-allowed-ports=6666,556
```



### Connecttion time out

版本:

nacos:2.1.2

springboot:2.2.2

springcloud:Hoxton.SR1

springcloud alibaba:2.2.9.RELEASE

服务注册到nacos时为内网ip,在window下ip发生变化出现的问题:gateway以及其它服务都正常注册进 nacos,并且通过网关可以成功访问到其它服务,但是随着电脑本机的ip发生变化时整个注册进nacos的服务都调用失败,connection time out

ip变化前(gateway跑在6000端口):

网关的ip:

![image-20221130233242660](/assets/images/springcloud/image-20221130233242660.png)

访问网关服务也是能够正常响应的:

![image-20221130233427159](/assets/images/springcloud/image-20221130233427159.png)

将电脑网络断开后重连,nacos上显示各个服务都是up的(已经暴露健康检查端点):

```yaml
management:
  endpoints:
    web:
      exposure:
        include: '*'
```

![image-20221130235544845](/assets/images/springcloud/image-20221130235544845.png)



![image-20221130233741506](/assets/images/springcloud/image-20221130233741506.png)

如果继续访问之前的ip:

![image-20221130233847852](/assets/images/springcloud/image-20221130233847852.png)

使用localhost:6000进行访问,依然正常响应:

![image-20221130234003017](/assets/images/springcloud/image-20221130234003017.png)

因此如果其它服务通过localhost:6000访问网关没有问题,但是网关获得到其它服务的地址还是之前的,因此触发连接超时

```java
2022-11-30 23:44:17.389  INFO 22088 --- [erListUpdater-0] c.netflix.config.ChainedDynamicProperty  : Flipping property: cloud-guli-product.ribbon.ActiveConnectionsLimit to use NEXT property: niws.loadbalancer.availabilityFilteringRule.activeConnectionsLimit = 2147483647
2022-11-30 23:44:21.644 ERROR 22088 --- [ctor-http-nio-5] a.w.r.e.AbstractErrorWebExceptionHandler : [453e5166]  500 Server Error for HTTP GET "/admin/product/attr/base/list/0?t=1669812012957&page=1&limit=10&key="

io.netty.channel.ConnectTimeoutException: connection timed out: /192.168.39.86:5000
	at io.netty.channel.nio.AbstractNioChannel$AbstractNioUnsafe$1.run(AbstractNioChannel.java:261) ~[netty-transport-4.1.43.Final.jar:4.1.43.Final]
	Suppressed: reactor.core.publisher.FluxOnAssembly$OnAssemblyException: 
Error has been observed at the following site(s):
	|_ checkpoint ⇢ org.springframework.web.cors.reactive.CorsWebFilter [DefaultWebFilterChain]
	|_ checkpoint ⇢ org.springframework.cloud.gateway.filter.WeightCalculatorWebFilter [DefaultWebFilterChain]
	|_ checkpoint ⇢ org.springframework.boot.actuate.metrics.web.reactive.server.MetricsWebFilter [DefaultWebFilterChain]
	|_ checkpoint ⇢ HTTP GET "/admin/product/attr/base/list/0?t=1669812012957&page=1&limit=10&key=" [ExceptionHandlingWebHandler]
```

在nacos上试图将其下线:

![image-20221130235800063](/assets/images/springcloud/image-20221130235800063.png)

简单的解决方案:

```yaml
spring:
  cloud:
    nacos:
      discovery:
#        ip: 10.2.11.11
        ip: 127.0.0.1
```



## Stream

### Rabbitmq连接

1. 错误的配置:

```yaml
spring:
  application:
    name: cloud-stream-provider
  cloud:
    stream:
      binders: # 在此处配置要绑定的rabbitmq的服务信息；
        defaultRabbit: # 表示定义的名称，用于于binding整合
          type: rabbit # 消息组件类型
          environment: # 设置rabbitmq的相关的环境配置
            #注意仅在这里配置rabbitmq服务并没有生效,会连接Attempting to connect to: [localhost:5672]
            #还需要在spring.rabbitmq下配置连接属性,基表如此也不能将其删除
            spring:
              rabbitmq:
                host: 192.168.10.111
                port: 5672
                username: admin
                password: 123
      bindings: # 服务的整合处理
        output: # 这个名字是一个通道的名称
          binder: defaultRabbit # 设置要绑定的消息服务的具体设置
          destination: studyExchange # 表示要使用的Exchange名称定义
          content-type: application/json # 设置消息类型，本次为json，文本则设置“text/plain”
```

按以上配置启动程序后,日志输出:

```java
2022-10-28 09:31:36.477  INFO 10736 --- [192.168.112.230] o.s.a.r.c.CachingConnectionFactory       : Attempting to connect to: [localhost:5672]
2022-10-28 09:31:40.585  WARN 10736 --- [192.168.112.230] o.s.b.a.amqp.RabbitHealthIndicator       : Rabbit health check failed

org.springframework.amqp.AmqpConnectException: java.net.ConnectException: Connection refused: connect
```

可以看到连接的rabbitmq并不是machine111,这是由于引入了actuactor的监控检测默认配置,若不设置默认rabbitmq,则会使用默认配置进行尝试,localhost:5672



2. 正确写法

   需要在spring.rabbitmq下配置连接属性,即使如此也不能将其删除

   ```yaml
   server:
     port: 8801
   spring:
     rabbitmq:
       host: machine111
       port: 5672
       username: admin
       password: 123
     application:
       name: cloud-stream-provider
     cloud:
       stream:
         binders: # 在此处配置要绑定的rabbitmq的服务信息；
           defaultRabbit: # 表示定义的名称，用于于binding整合
             type: rabbit # 消息组件类型
             environment: # 设置rabbitmq的相关的环境配置
               #注意仅在这里配置rabbitmq服务并没有生效,会连接Attempting to connect to: [localhost:5672]
               #还需要在spring.rabbitmq下配置连接属性,即使如此也不能将其删除
               spring:
                 rabbitmq:
                   host: 192.168.10.111
                   port: 5672
                   username: admin
                   password: 123
         bindings: # 服务的整合处理
           output: # 这个名字是一个通道的名称
             binder: defaultRabbit # 设置要绑定的消息服务的具体设置
             destination: studyExchange # 表示要使用的Exchange名称定义
             content-type: application/json # 设置消息类型，本次为json，文本则设置“text/plain”
   eureka:
     client:
       service-url:
         defaultZone: http://eureka7001.com:7001/eureka
       register-with-eureka: true
       fetch-registry: true
     instance:
       instance-id: send-8001.com
       prefer-ip-address: true
       lease-renewal-interval-in-seconds: 2
       lease-expiration-duration-in-seconds: 5
   ```

   此时日志打印信息:

   ```java
2022-10-28 09:51:57.238  INFO 5488 --- [192.168.112.230] o.s.a.r.c.CachingConnectionFactory       : Attempting to connect to: [machine111:5672]
   2022-10-28 09:51:57.259  INFO 5488 --- [192.168.112.230] o.s.a.r.c.CachingConnectionFactory       : Created new connection: rabbitConnectionFactory#26b9c5b9:0/SimpleConnection@62fc9a44 [delegate=amqp://admin@192.168.10.111:5672/, localPort= 9505]
   ```
```

<dependency>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-starter-stream-rabbit</artifactId>
</dependency>
```

   

   ##### 2. 定义配置文件

   ```javascript
   spring:
     cloud:
       stream:
         binders:
           test:
             type: rabbit
             environment:
               spring:
                 rabbitmq:
                   addresses: 10.0.20.132
                   port: 5672
                username: root
                   password: root
                virtual-host: /unicode-pay
         bindings:
           testOutPut:
             destination: testRabbit
          content-type: application/json
             default-binder: test
   ```

   现在来解释一下这些配置的含义

   1. binders： 这是一组binder的集合，这里配置了一个名为test的binder，这个binder中是包含了一个rabbit的连接信息
   2. bindings：这是一组binding的集合，这里配置了一个名为testOutPut的binding，这个binding中配置了指向名test的binder下的一个交换机testRabbit。
   3. 扩展： 如果我们项目中不仅集成了rabbit还集成了kafka那么就可以新增一个类型为kafka的binder、如果项目中会使用多个交换机那么就使用多个binding，

##### 3.创建通道

```javascript
   public interface  MqMessageSource {
    String TEST_OUT_PUT = "testOutPut";
       @Output(TEST_OUT_PUT)
       MessageChannel testOutPut();
   }
```

   这个通道的名字就是上方binding的名字

   ##### 4. 发送消息

   ```javascript
   @EnableBinding(MqMessageSource.class)
   public class MqMessageProducer {
    @Autowired
       @Output(MqMessageSource.TEST_OUT_PUT)
    private MessageChannel channel;
       public void sendMsg(String msg) {
        channel.send(MessageBuilder.withPayload(msg).build());
           System.err.println("消息发送成功："+msg);
    }
   }
   ```

   

   这里就是使用上方的通道来发送到指定的交换机了。需要注意的是withPayload方法你可以传入任何类型的对象，但是需要实现序列化接口

   ##### 5. 创建测试接口

   EnableBinding注解绑定的类默认是被Spring管理的，我们可以在controller中注入它

```javascript
   @Autowired
private MqMessageProducer mqMessageProducer;
   @GetMapping(value = "/testMq")
public String testMq(@RequestParam("msg")String msg){
       mqMessageProducer.sendMsg(msg);
    return "发送成功";
   }
```

   

   生产者的代码到此已经完成了。

   ### 创建消费者

   ##### 1. 引入依赖

   ```javascript
<dependency>
               <groupId>org.springframework.cloud</groupId>
               <artifactId>spring-cloud-starter-stream-rabbit</artifactId>
           </dependency>
   ```

   

   ##### 2. 定义配置文件

   ```javascript
   spring:
     cloud:
       stream:
         binders:
           test:
             type: rabbit
             environment:
               spring:
                 rabbitmq:
                   addresses: 10.0.20.132
                   port: 5672
                username: root
                   password: root
                virtual-host: /unicode-pay
         bindings:
        testInPut:
             destination: testRabbit
          content-type: application/json
             default-binder: test
   ```

   

   这里与生产者唯一不同的地方就是testIntPut了，相信你已经明白了，它是binding的名字，也是通道与交换机绑定的关键

##### 3.创建通道

```javascript
   public interface  MqMessageSource {
    String TEST_IN_PUT = "testInPut";
       @Input(TEST_IN_PUT)
       SubscribableChannel testInPut();
   }
```

   

   ##### 4. 接受消息

```javascript
   @EnableBinding(MqMessageSource.class)
public class MqMessageConsumer {
       @StreamListener(MqMessageSource.TEST_IN_PUT)
       public void messageInPut(Message<String> message) {
           System.err.println(" 消息接收成功：" + message.getPayload());
       }
   }
```

   

   这个时候启动Eureka、消息生产者和消费者，然后调用生产者的接口应该就可以接受到来自mq的消息了。



## Nacos

版本2.1.2

### 启动出错

#### 1.1 Caused by: java.net.UnknownHostException: jmenv.tbsite.net

解决: 以单机模式启动

```shell
startup.cmd -m standalone
```



#### 1.2  No DataSource set

```java
Caused by: java.lang.IllegalStateException: No DataSource set
        at org.springframework.util.Assert.state(Assert.java:76)
        at org.springframework.jdbc.support.JdbcAccessor.obtainDataSource(JdbcAccessor.java:86)
        at org.springframework.jdbc.core.JdbcTemplate.execute(JdbcTemplate.java:376)
        at org.springframework.jdbc.core.JdbcTemplate.query(JdbcTemplate.java:465)
        at org.springframework.jdbc.core.JdbcTemplate.query(JdbcTemplate.java:475)
        at org.springframework.jdbc.core.JdbcTemplate.queryForObject(JdbcTemplate.java:508)
        at org.springframework.jdbc.core.JdbcTemplate.queryForObject(JdbcTemplate.java:515)
        at com.alibaba.nacos.config.server.service.repository.extrnal.ExternalStoragePersistServiceImpl.findConfigMaxId(ExternalStoragePersistServiceImpl.java:674)
        at com.alibaba.nacos.config.server.service.dump.processor.DumpAllProcessor.process(DumpAllProcessor.java:51)
        at com.alibaba.nacos.config.server.service.dump.DumpService.dumpConfigInfo(DumpService.java:282)
        at com.alibaba.nacos.config.server.service.dump.DumpService.dumpOperate(DumpService.java:195)
        ... 65 common frames omitted
```

配置文件(数据库及连接池部分):

```properties

#*************** Config Module Related Configurations ***************#
### If use MySQL as datasource:
spring.datasource.platform=mysql

### Count of DB:
db.num=1

### Connect URL of DB:
db.url.0=jdbc:mysql://localhost:13306/nacos_config?characterEncoding=utf8&useUnicode=true&useSSL=false
db.user=root
db.password=root

### Connection pool configuration: hikariCP
db.pool.config.connectionTimeout=30000
db.pool.config.validationTimeout=10000
db.pool.config.maximumPoolSize=20
db.pool.config.minimumIdle=2
```



可能原因: 

未初始化创建配置nacos数据库及相关配置信息表,

数据库用户密码填写错误(这里使用mysql5.x),nacos自带的jdbc驱动的mysql8.x,同时兼容mysql5.x

创建表:

```sql
CREATE DATABASE `nacos_config` CHARACTER SET 'utf8' COLLATE 'utf8_general_ci';
```

执行sql脚本:mysq-schema.sql

![image-20221029151450008](/assets/images/springcloud/image-20221029151450008.png)



```sql
/*
 * Copyright 1999-2018 Alibaba Group Holding Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/******************************************/
/*   数据库全名 = nacos_config   */
/*   表名称 = config_info   */
/******************************************/
CREATE TABLE `config_info` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `data_id` varchar(255) NOT NULL COMMENT 'data_id',
  `group_id` varchar(255) DEFAULT NULL,
  `content` longtext NOT NULL COMMENT 'content',
  `md5` varchar(32) DEFAULT NULL COMMENT 'md5',
  `gmt_create` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
  `src_user` text COMMENT 'source user',
  `src_ip` varchar(50) DEFAULT NULL COMMENT 'source ip',
  `app_name` varchar(128) DEFAULT NULL,
  `tenant_id` varchar(128) DEFAULT '' COMMENT '租户字段',
  `c_desc` varchar(256) DEFAULT NULL,
  `c_use` varchar(64) DEFAULT NULL,
  `effect` varchar(64) DEFAULT NULL,
  `type` varchar(64) DEFAULT NULL,
  `c_schema` text,
  `encrypted_data_key` text NOT NULL COMMENT '秘钥',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_configinfo_datagrouptenant` (`data_id`,`group_id`,`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='config_info';

/******************************************/
/*   数据库全名 = nacos_config   */
/*   表名称 = config_info_aggr   */
/******************************************/
CREATE TABLE `config_info_aggr` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `data_id` varchar(255) NOT NULL COMMENT 'data_id',
  `group_id` varchar(255) NOT NULL COMMENT 'group_id',
  `datum_id` varchar(255) NOT NULL COMMENT 'datum_id',
  `content` longtext NOT NULL COMMENT '内容',
  `gmt_modified` datetime NOT NULL COMMENT '修改时间',
  `app_name` varchar(128) DEFAULT NULL,
  `tenant_id` varchar(128) DEFAULT '' COMMENT '租户字段',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_configinfoaggr_datagrouptenantdatum` (`data_id`,`group_id`,`tenant_id`,`datum_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='增加租户字段';


/******************************************/
/*   数据库全名 = nacos_config   */
/*   表名称 = config_info_beta   */
/******************************************/
CREATE TABLE `config_info_beta` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `data_id` varchar(255) NOT NULL COMMENT 'data_id',
  `group_id` varchar(128) NOT NULL COMMENT 'group_id',
  `app_name` varchar(128) DEFAULT NULL COMMENT 'app_name',
  `content` longtext NOT NULL COMMENT 'content',
  `beta_ips` varchar(1024) DEFAULT NULL COMMENT 'betaIps',
  `md5` varchar(32) DEFAULT NULL COMMENT 'md5',
  `gmt_create` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
  `src_user` text COMMENT 'source user',
  `src_ip` varchar(50) DEFAULT NULL COMMENT 'source ip',
  `tenant_id` varchar(128) DEFAULT '' COMMENT '租户字段',
  `encrypted_data_key` text NOT NULL COMMENT '秘钥',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_configinfobeta_datagrouptenant` (`data_id`,`group_id`,`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='config_info_beta';

/******************************************/
/*   数据库全名 = nacos_config   */
/*   表名称 = config_info_tag   */
/******************************************/
CREATE TABLE `config_info_tag` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `data_id` varchar(255) NOT NULL COMMENT 'data_id',
  `group_id` varchar(128) NOT NULL COMMENT 'group_id',
  `tenant_id` varchar(128) DEFAULT '' COMMENT 'tenant_id',
  `tag_id` varchar(128) NOT NULL COMMENT 'tag_id',
  `app_name` varchar(128) DEFAULT NULL COMMENT 'app_name',
  `content` longtext NOT NULL COMMENT 'content',
  `md5` varchar(32) DEFAULT NULL COMMENT 'md5',
  `gmt_create` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
  `src_user` text COMMENT 'source user',
  `src_ip` varchar(50) DEFAULT NULL COMMENT 'source ip',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_configinfotag_datagrouptenanttag` (`data_id`,`group_id`,`tenant_id`,`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='config_info_tag';

/******************************************/
/*   数据库全名 = nacos_config   */
/*   表名称 = config_tags_relation   */
/******************************************/
CREATE TABLE `config_tags_relation` (
  `id` bigint(20) NOT NULL COMMENT 'id',
  `tag_name` varchar(128) NOT NULL COMMENT 'tag_name',
  `tag_type` varchar(64) DEFAULT NULL COMMENT 'tag_type',
  `data_id` varchar(255) NOT NULL COMMENT 'data_id',
  `group_id` varchar(128) NOT NULL COMMENT 'group_id',
  `tenant_id` varchar(128) DEFAULT '' COMMENT 'tenant_id',
  `nid` bigint(20) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`nid`),
  UNIQUE KEY `uk_configtagrelation_configidtag` (`id`,`tag_name`,`tag_type`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='config_tag_relation';

/******************************************/
/*   数据库全名 = nacos_config   */
/*   表名称 = group_capacity   */
/******************************************/
CREATE TABLE `group_capacity` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `group_id` varchar(128) NOT NULL DEFAULT '' COMMENT 'Group ID，空字符表示整个集群',
  `quota` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '配额，0表示使用默认值',
  `usage` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '使用量',
  `max_size` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '单个配置大小上限，单位为字节，0表示使用默认值',
  `max_aggr_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '聚合子配置最大个数，，0表示使用默认值',
  `max_aggr_size` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '单个聚合数据的子配置大小上限，单位为字节，0表示使用默认值',
  `max_history_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '最大变更历史数量',
  `gmt_create` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='集群、各Group容量信息表';

/******************************************/
/*   数据库全名 = nacos_config   */
/*   表名称 = his_config_info   */
/******************************************/
CREATE TABLE `his_config_info` (
  `id` bigint(20) unsigned NOT NULL,
  `nid` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `data_id` varchar(255) NOT NULL,
  `group_id` varchar(128) NOT NULL,
  `app_name` varchar(128) DEFAULT NULL COMMENT 'app_name',
  `content` longtext NOT NULL,
  `md5` varchar(32) DEFAULT NULL,
  `gmt_create` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `gmt_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `src_user` text,
  `src_ip` varchar(50) DEFAULT NULL,
  `op_type` char(10) DEFAULT NULL,
  `tenant_id` varchar(128) DEFAULT '' COMMENT '租户字段',
  `encrypted_data_key` text NOT NULL COMMENT '秘钥',
  PRIMARY KEY (`nid`),
  KEY `idx_gmt_create` (`gmt_create`),
  KEY `idx_gmt_modified` (`gmt_modified`),
  KEY `idx_did` (`data_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='多租户改造';


/******************************************/
/*   数据库全名 = nacos_config   */
/*   表名称 = tenant_capacity   */
/******************************************/
CREATE TABLE `tenant_capacity` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `tenant_id` varchar(128) NOT NULL DEFAULT '' COMMENT 'Tenant ID',
  `quota` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '配额，0表示使用默认值',
  `usage` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '使用量',
  `max_size` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '单个配置大小上限，单位为字节，0表示使用默认值',
  `max_aggr_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '聚合子配置最大个数',
  `max_aggr_size` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '单个聚合数据的子配置大小上限，单位为字节，0表示使用默认值',
  `max_history_count` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '最大变更历史数量',
  `gmt_create` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `gmt_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='租户容量信息表';


CREATE TABLE `tenant_info` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `kp` varchar(128) NOT NULL COMMENT 'kp',
  `tenant_id` varchar(128) default '' COMMENT 'tenant_id',
  `tenant_name` varchar(128) default '' COMMENT 'tenant_name',
  `tenant_desc` varchar(256) DEFAULT NULL COMMENT 'tenant_desc',
  `create_source` varchar(32) DEFAULT NULL COMMENT 'create_source',
  `gmt_create` bigint(20) NOT NULL COMMENT '创建时间',
  `gmt_modified` bigint(20) NOT NULL COMMENT '修改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_info_kptenantid` (`kp`,`tenant_id`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='tenant_info';

CREATE TABLE `users` (
	`username` varchar(50) NOT NULL PRIMARY KEY,
	`password` varchar(500) NOT NULL,
	`enabled` boolean NOT NULL
);

CREATE TABLE `roles` (
	`username` varchar(50) NOT NULL,
	`role` varchar(50) NOT NULL,
	UNIQUE INDEX `idx_user_role` (`username` ASC, `role` ASC) USING BTREE
);

CREATE TABLE `permissions` (
    `role` varchar(50) NOT NULL,
    `resource` varchar(255) NOT NULL,
    `action` varchar(8) NOT NULL,
    UNIQUE INDEX `uk_role_permission` (`role`,`resource`,`action`) USING BTREE
);

INSERT INTO users (username, password, enabled) VALUES ('nacos', '$2a$10$EuWPZHzz32dJN7jexM34MOeYirDdFAZm2kuWj7VEOJhhZkDrxfvUu', TRUE);

INSERT INTO roles (username, role) VALUES ('nacos', 'ROLE_ADMIN');

```



完成以上步骤再次启动,成功.

![image-20221029152101993](/assets/images/springcloud/image-20221029152101993.png)

默认的用户名和密码为nacos

![image-20221029152529891](/assets/images/springcloud/image-20221029152529891.png)

#### 1.3 windows启动jar nacos yaml配置文件中包含中文问题

> org.yaml.snakeyaml.error.YAMLException: java.nio.charset.MalformedInputException: Input length

背景:使用nacos作为配置中心,idea中运行服务时没有问题,maven打包后运行jar包出现异常,

原因: 从nacos中拉取的配置文件中含有中文字符注释

windows使用cmd命令窗口启动jar nacos yaml配置文件中包含中文无法启动问题
windows系统下使用cmd 执行 java -jar xx.jar，jar里面配置文件使用的yaml，配置文件中包含了中文，一直启动不了，报错
YAMLException: java.nio.charset.MalformedInputException: Input length = 1

![在这里插入图片描述](/assets/images/springcloud/34c6368a6bf540e9b568971a791e4103.png)

解决:

启动的时候要添加 -Dfile.encoding=utf-8作为启动参数才行，主要报错原因是读取到的配置中有中文，而在windows运行时候控制台默认编码为GBK，而读取到的配置文件为UTF-8编码，导致的报错，用GBK去解析UTF-8，没有中文的话是没问题，有中文就报错，即使是中文注释也不行

如下启动即可解决yaml配置文件中有中文的问题：
java -Dfile.encoding=utf-8 -jar xx.jar

另外cmd窗口显示中文乱码可以在cmd窗口执行：
chcp 65001解决cmd中文乱码，但是只在当前窗口有效，窗口关闭重新打开会失效。



###  配置参数

#### 单机模式下运行Nacos

Linux/Unix/Mac

- Standalone means it is non-cluster Mode. * sh [startup.sh](http://startup.sh/) -m standalone

Windows

- Standalone means it is non-cluster Mode. * cmd startup.cmd -m standalone

单机模式支持mysql

在0.7版本之前，在单机模式时nacos使用嵌入式数据库实现数据的存储，不方便观察数据存储的基本情况。0.7版本增加了支持mysql数据源能力，具体的操作步骤：

- 1.安装数据库，版本要求：5.6.5+
- 2.初始化mysql数据库，数据库初始化文件：mysql-schema.sql
- 3.修改conf/application.properties文件，增加支持mysql数据源配置（目前只支持mysql），添加mysql数据源的url、用户名和密码。

```
spring.datasource.platform=mysql

db.num=1
db.url.0=jdbc:mysql://11.162.196.16:3306/nacos_devtest?characterEncoding=utf8&connectTimeout=1000&socketTimeout=3000&autoReconnect=true
db.user=nacos_devtest
db.password=youdontknow
```

再以单机模式启动nacos，nacos所有写嵌入式数据库的数据都写到了mysql



#### Config模块

| 参数名                                           | 含义                                                         | 可选值 | 默认值                 | 支持版本 |
| ------------------------------------------------ | ------------------------------------------------------------ | ------ | ---------------------- | -------- |
| db.num                                           | 数据库数目                                                   | 正整数 | 0                      | >= 0.1.0 |
| db.url.0                                         | 第一个数据库的URL                                            | 字符串 | 空                     | >= 0.1.0 |
| db.url.1                                         | 第二个数据库的URL                                            | 字符串 | 空                     | >= 0.1.0 |
| db.user                                          | 数据库连接的用户名                                           | 字符串 | 空                     | >= 0.1.0 |
| db.password                                      | 数据库连接的密码                                             | 字符串 | 空                     | >= 0.1.0 |
| spring.datasource.platform                       | 数据库类型                                                   | 字符串 | mysql                  | >=1.3.0  |
| [db.pool.config.xxx](http://db.pool.config.xxx/) | 数据库连接池参数，使用的是hikari连接池，参数与hikari连接池相同，如`db.pool.config.connectionTimeout`或`db.pool.config.maximumPoolSize` | 字符串 | 同hikariCp对应默认配置 | >=1.4.1  |

当前数据库配置支持多数据源。通过`db.num`来指定数据源个数，`db.url.index`为对应的数据库的链接。`db.user`以及`db.password`没有设置`index`时,所有的链接都以`db.user`和`db.password`用作认证。如果不同数据源的用户名称或者用户密码不一样时，可以通过符号`,`来进行切割，或者指定`db.user.index`,`db.user.password`来设置对应数据库链接的用户或者密码。需要注意的是，当`db.user`和`db.password`没有指定下标时，因为当前机制会根据`,`进行切割。所以当用户名或者密码存在`,`时，会把`,`切割后前面的值当成最后的值进行认证，会导致认证失败。

Nacos从1.3版本开始使用HikariCP连接池，但在1.4.1版本前，连接池配置由系统默认值定义，无法自定义配置。在1.4.1后，提供了一个方法能够配置HikariCP连接池。 `db.pool.config`为配置前缀，`xxx`为实际的hikariCP配置，如`db.pool.config.connectionTimeout`或`db.pool.config.maximumPoolSize`等。更多hikariCP的配置请查看[HikariCP](https://github.com/brettwooldridge/HikariCP) 需要注意的是，url,user,password会由`db.url.n`,`db.user`,`db.password`覆盖，driverClassName则是默认的MySQL8 driver（该版本mysql driver支持mysql5.x)



### 服务注册

| 配置项               | Key                                              | 默认值                       | 说明                                                         |
| -------------------- | ------------------------------------------------ | ---------------------------- | ------------------------------------------------------------ |
| 服务端地址           | `spring.cloud.nacos.discovery.server-addr`       |                              | Nacos Server 启动监听的ip地址和端口                          |
| 服务名               | `spring.cloud.nacos.discovery.service`           | `${spring.application.name}` | 注册的服务名                                                 |
| 权重                 | `spring.cloud.nacos.discovery.weight`            | `1`                          | 取值范围 1 到 100，数值越大，权重越大                        |
| 网卡名               | `spring.cloud.nacos.discovery.network-interface` |                              | 当IP未配置时，注册的IP为此网卡所对应的IP地址，如果此项也未配置，则默认取第一块网卡的地址 |
| 注册的IP地址         | `spring.cloud.nacos.discovery.ip`                |                              | 优先级最高                                                   |
| 注册的IP地址类型     | `spring.cloud.nacos.discovery.ip-type`           | `IPv4`                       | 可以配置IPv4和IPv6两种类型，如果网卡同类型IP地址存在多个，希望制定特定网段地址，可使用`spring.cloud.inetutils.preferred-networks`配置筛选地址 |
| 注册的端口           | `spring.cloud.nacos.discovery.port`              | `-1`                         | 默认情况下不用配置，会自动探测                               |
| 命名空间             | `spring.cloud.nacos.discovery.namespace`         |                              | 常用场景之一是不同环境的注册的区分隔离，例如开发测试环境和生产环境的资源（如配置、服务）隔离等 |
| AccessKey            | `spring.cloud.nacos.discovery.access-key`        |                              | 当要上阿里云时，阿里云上面的一个云账号名                     |
| SecretKey            | `spring.cloud.nacos.discovery.secret-key`        |                              | 当要上阿里云时，阿里云上面的一个云账号密码                   |
| Metadata             | `spring.cloud.nacos.discovery.metadata`          |                              | 使用Map格式配置，用户可以根据自己的需要自定义一些和服务相关的元数据信息 |
| 日志文件名           | `spring.cloud.nacos.discovery.log-name`          |                              |                                                              |
| 集群                 | `spring.cloud.nacos.discovery.cluster-name`      | `DEFAULT`                    | Nacos集群名称                                                |
| 接入点               | `spring.cloud.nacos.discovery.endpoint`          |                              | 地域的某个服务的入口域名，通过此域名可以动态地拿到服务端地址 |
| 是否集成LoadBalancer | `spring.cloud.loadbalancer.nacos.enabled`        | `false`                      |                                                              |
| 是否开启Nacos Watch  | `spring.cloud.nacos.discovery.watch.enabled`     | `true`                       | 可以设置成false来关闭 watch                                  |

#### 问题

#### Nacos服务注册地址为内网IP

仔细一查才发现，网关去访问了一个莫名其妙的IP地址，
 去Nacos服务详情去看，果然，我的微服务注册到Nacos的IP地址上也是这个地址，
 然后我去我电脑查找这个IP地址，还真有这么一个地址，那么问题来了，Nacos为什么会随意找个本机IP地址然后注册上去？

 Nacos服务注册的IP

Nacos注册中心是: [https://github.com/alibaba/nacos](https://links.jianshu.com/go?to=https%3A%2F%2Fgithub.com%2Falibaba%2Fnacos)
 各个服务通过Nacos客户端将服务信息注册到Nacos上
 当Nacos服务注册的IP默认选择出问题时，可以通过查阅对应的客户端文档，来选择配置不同的网卡或者IP
 （`参考org.springframework.cloud.alibaba.nacos.NacosDiscoveryProperties的配置`）

解决办法

例如，使用了Spring cloud alibaba（[官方文档](https://links.jianshu.com/go?to=https%3A%2F%2Fgithub.com%2Falibaba%2Fspring-cloud-alibaba)）作为Nacos客户端，
 服务默认获取了内网IP 192.168.1.21,
 可以通过配置spring.cloud.inetutils.preferred-networks=10.34.12，使服务获取内网中前缀为10.34.12的IP

如何配置

```php
# 如果选择固定Ip注册可以配置
spring.cloud.nacos.discovery.ip = 10.2.11.11
spring.cloud.nacos.discovery.port = 9090

# 如果选择固定网卡配置项
spring.cloud.nacos.discovery.networkInterface = eth0

# 如果想更丰富的选择，可以使用spring cloud 的工具 InetUtils进行配置
# 具体说明可以自行检索: https://github.com/spring-cloud/spring-cloud-commons/blob/master/docs/src/main/asciidoc/spring-cloud-commons.adoc
spring.cloud.inetutils.default-hostname
spring.cloud.inetutils.default-ip-address
spring.cloud.inetutils.ignored-interfaces[0]=eth0   # 忽略网卡，eth0
spring.cloud.inetutils.ignored-interfaces=eth.*     # 忽略网卡，eth.*，正则表达式
spring.cloud.inetutils.preferred-networks=10.34.12  # 选择符合前缀的IP作为服务注册IP
spring.cloud.inetutils.timeout-seconds
spring.cloud.inetutils.use-only-site-local-interfaces
```

 更多配置

```css
spring.cloud.nacos.discovery.server-addr  #Nacos Server 启动监听的ip地址和端口
spring.cloud.nacos.discovery.service  #给当前的服务命名
spring.cloud.nacos.discovery.weight  #取值范围 1 到 100，数值越大，权重越大
spring.cloud.nacos.discovery.network-interface #当IP未配置时，注册的IP为此网卡所对应的IP地址，如果此项也未配置，则默认取第一块网卡的地址
spring.cloud.nacos.discovery.ip  # 优先级最高
spring.cloud.nacos.discovery.port  # 默认情况下不用配置，会自动探测
spring.cloud.nacos.discovery.namespace # 常用场景之一是不同环境的注册的区分隔离，例如开发测试环境和生产环境的资源（如配置、服务）隔离等。

spring.cloud.nacos.discovery.access-key  # 当要上阿里云时，阿里云上面的一个云账号名
spring.cloud.nacos.discovery.secret-key # 当要上阿里云时，阿里云上面的一个云账号密码
spring.cloud.nacos.discovery.metadata    #使用Map格式配置，用户可以根据自己的需要自定义一些和服务相关的元数据信息
spring.cloud.nacos.discovery.log-name   # 日志文件名
spring.cloud.nacos.discovery.enpoint   # 地域的某个服务的入口域名，通过此域名可以动态地拿到服务端地址
ribbon.nacos.enabled  # 是否集成Ribbon 默认为true
```





## Ribbon

### RestTemplate

使用RestTemplate时首先要往容器中注入bean,并添加 @loadbalance 注解

```java
@Configuration
public class FeignLogConfiguration {
    @Bean
    public Logger.Level level() {
        return Logger.Level.FULL;
    }
}
```



### OpenFeign

#### 异常处理

> org.springframework.web.client.UnknownContentTypeException: Could not extract response: no suitable HttpMessageConverter found for response type [class XXX] and content type [XXX;XXX]

**情形一：**

以 **content type[text/html;charset=utf-8]** 为例子
可以自行建立一个config包，在config包下写下**MyRestTemplate**类即可：

```java
    @Bean("restTemplate")
    public RestTemplate restTemplate(){
        RestTemplate restTemplate = new RestTemplate();
        MappingJackson2HttpMessageConverter mappingJackson2HttpMessageConverter = new MappingJackson2HttpMessageConverter();
        mappingJackson2HttpMessageConverter.setSupportedMediaTypes(Arrays.asList(
                MediaType.TEXT_HTML,  //配了text/html
                MediaType.TEXT_PLAIN)); //配了 text/plain
        restTemplate.getMessageConverters().add(mappingJackson2HttpMessageConverter);

        return restTemplate;
    }
//类上面记得加@configuration
```

**情景二**

在远程调用方法的时候，feign是会重构造请求的，而feign重构造请求会丢失请求头和丢失上下文，换句话说，就算你登录了，远程调用的时候由于丢失了session，系统也会判断你没登录。

因此,在调用有登录拦截器/过滤器的接口时会被执行拦截/过滤方法,导致返回的数据无法转换为需要的类型

解决: 泛型该接口请求,或者为其设置必要session

#### 基本使用

若未集成,则需要手动添加依赖

```xml
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-openfeign</artifactId>
        </dependency>
```

在配置类中添加 @EnableFeignClients

```java
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class ConsumerMain83 {
    public static void main(String[] args) {
        SpringApplication.run(ConsumerMain83.class, args);
    }
}
```

服务接口中添加: @Component,根据springcloud版本可省略

```java
@FeignClient(name = "${my.remote-server}")
@Component
public interface FeignTestService {
    @GetMapping("/nacos/payment/test")
    String test();
}
```

当注册中心不存在服务时(第三方接口调用),也需要写上name,同时还需要url

```java
@FeignClient(name = "https://gitee.com/api/v5",url = "https://gitee.com/api/v5")
public interface GiteeFeignService {
    @GetMapping("emails")
    String getAllEmail(@RequestParam("access_token") String access_token);
}
```

#### 设置请求头

![image-20230122203212184](/assets/images/springcloud/image-20230122203212184.png)

```java
@Configuration
public class MyFeignConfig {
    @Bean
    public RequestInterceptor requestInterceptor() {
        return template -> {
            ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (requestAttributes != null) {
                String cookie = requestAttributes.getRequest().getHeader("Cookie");
                template.header("Cookie", cookie);
            }
        };
    }
}
```



![image-20230122221506965](/assets/images/springcloud/image-20230122221506965.png)

开启异步任务前先获取request,并在执行异步任务前设置request的header等信息

```java
        ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        CompletableFuture<Void> future1 = CompletableFuture.runAsync(() -> {
            //为异步任务线程设置request
            RequestContextHolder.setRequestAttributes(requestAttributes);
            ...
        });
```





## Sentinel



## Seata

### client启动失败

前提准备:

seata: 1.5.1	(事务管理)

nacos: 2.1.2	(注册和配置中心)

pom文件信息

```xml
        <!--nacos-->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
            <version>2.1.2.RELEASE</version>
            <exclusions>
                <exclusion>
                    <groupId>com.alibaba.nacos</groupId>
                    <artifactId>nacos-client</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <!--nacos-config-->
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
            <version>2.1.2.RELEASE</version>
            <exclusions>
                <exclusion>
                    <groupId>com.alibaba.nacos</groupId>
                    <artifactId>nacos-client</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <!-- https://mvnrepository.com/artifact/com.alibaba.nacos/nacos-client -->
        <dependency>
            <groupId>com.alibaba.nacos</groupId>
            <artifactId>nacos-client</artifactId>
            <version>2.1.0</version>
        </dependency>

        <!--seata-->
        <dependency>
            <groupId>io.seata</groupId>
            <artifactId>seata-spring-boot-starter</artifactId>
            <version>1.5.1</version>
        </dependency>

        <dependency>
            <groupId>io.seata</groupId>
            <artifactId>seata-all</artifactId>
            <version>1.5.1</version>
        </dependency>

        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-seata</artifactId>
            <version>2.2.0.RELEASE</version>
            <exclusions>
                <exclusion>
                    <groupId>io.seata</groupId>
                    <artifactId>seata-spring-boot-starter</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
```

yaml文件配置:

> nacos服务注册到 nacos的namespace,group,application,cluster要与client端一致



server:

```yaml
server:
  port: 7091

spring:
  application:
    name: seata-server

logging:
  config: classpath:logback-spring.xml
  file:
    path: ${user.home}/logs/seata
  extend:
    logstash-appender:
      destination: 127.0.0.1:4560
    kafka-appender:
      bootstrap-servers: 127.0.0.1:9092
      topic: logback_to_logstash

console:
  user:
    username: seata
    password: seata

seata:
  tx-service-group: my_test_tx_group
  config:
    # support: nacos, consul, apollo, zk, etcd3
    type: nacos
    nacos:
      server-addr: 127.0.0.1:8848
      namespace: 1008611
      group: SEATA_GROUP
      username: nacos
      password: nacos
      ##if use MSE Nacos with auth, mutex with username/password attribute
      #access-key: ""
      #secret-key: ""
      data-id: seata.properties
  registry:
    # support: nacos, eureka, redis, zk, consul, etcd3, sofa
    type: nacos
    preferred-networks: 30.240.*
    nacos:
      application: seata-server
      server-addr: 127.0.0.1:8848
      group: SEATA_GROUP
      namespace: 1008611
      username: nacos
      password: nacos
      cluster: seata-server
      
  store:
    # support: file 、 db 、 redis
    mode: db
    db:
      datasource: druid
      db-type: mysql
      driver-class-name: com.mysql.jdbc.Driver
      url: jdbc:mysql://127.0.0.1:13306/seata?rewriteBatchedStatements=true
      user: root
      password: root
      min-conn: 5
      max-conn: 100
      global-table: global_table
      branch-table: branch_table
      lock-table: lock_table
      distributed-lock-table: distributed_lock
      query-limit: 100
      max-wait: 5000
#  server:
#    service-port: 8091 #If not configured, the default is '${server.port} + 1000'
  security:
    secretKey: SeataSecretKey0c382ef121d778043159209298fd40bf3850a017
    tokenValidityInMilliseconds: 1800000
    ignore:
      urls: /,/**/*.css,/**/*.js,/**/*.html,/**/*.map,/**/*.svg,/**/*.png,/**/*.ico,/console-fe/public/**,/api/v1/auth/login
```



client:

```yaml
server:
  port: 3001
spring:
  application:
    name: seata-order-service
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
        namespace: 1008611
        group: SEATA_GROUP
        register-enabled: true
  datasource:
    driver-class-name: com.mysql.jdbc.Driver
    url: jdbc:mysql://localhost:13306/seata_order
    username: root
    password: root
feign:
  hystrix:
    enabled: false

logging:
  level:
    io:
      seata: info
mybatis:
  mapperLocations: classpath:mapper/*.xml
  type-aliases-package: classpath:com.pika.domain.*

#自定义事务组名称需要与seata-server中的对应
seata:
  application-id: seata-order-service
  registry:
    type: nacos
    preferred-networks: 30.240.*
    nacos:
      application: seata-server
      server-addr: 127.0.0.1:8848
      group: SEATA_GROUP
      namespace: 1008611
      username: nacos
      password: nacos
      cluster: seata-server
  enable-auto-data-source-proxy: false
  config:
    type: nacos # !!!!不要忘了指定配置类型
    nacos:
      data-id: seata.properties
      username: nacos
      password: nacos
      group: SEATA_GROUP
      namespace: 1008611
      server-addr: localhost:8848

  enabled: true
  tx-service-group: my_test_tx_group
```



#### 事务分组



```java
i.s.c.r.netty.NettyClientChannelManager  : can not get cluster name in registry config 'service.vgroupMapping.seata-order-service-fescar-service-group', please make sure registry config correct
```

解决:在nacos的seata.properties中添加:

```properties
service.vgroupMapping.seata-order-service-fescar-service-group=seata-server
```



> 从v1.4.2版本开始，已支持从一个Nacos dataId中获取所有配置信息,你只需要额外添加一个dataId配置项。
>
> 1.4.2版本以下的可以使用官方脚本逐个上传配置(本次的1.5.1使用的是dataId,使用脚本上传会逐个设置每个配置项作为单独dataId,不便管理)
>
> https://github.com/seata/seata/tree/develop/script/config-center



nacos中完整的seata.properties,源文件地址:https://github.com/seata/seata/blob/develop/script/config-center/config.txt

```properties
#补充配置
service.vgroupMapping.seata-order-service-fescar-service-group=seata-server
# suppress inspection "SpringBootApplicationProperties" for whole file
#For details about configuration items, see https://seata.io/zh-cn/docs/user/configurations.html
#Transport configuration, for client and server 
transport.type=TCP
transport.server=NIO
transport.heartbeat=true
transport.enableTmClientBatchSendRequest=false
transport.enableRmClientBatchSendRequest=true
transport.enableTcServerBatchSendResponse=false
transport.rpcRmRequestTimeout=30000
transport.rpcTmRequestTimeout=30000
transport.rpcTcRequestTimeout=30000
transport.threadFactory.bossThreadPrefix=NettyBoss
transport.threadFactory.workerThreadPrefix=NettyServerNIOWorker
transport.threadFactory.serverExecutorThreadPrefix=NettyServerBizHandler
transport.threadFactory.shareBossWorker=false
transport.threadFactory.clientSelectorThreadPrefix=NettyClientSelector
transport.threadFactory.clientSelectorThreadSize=1
transport.threadFactory.clientWorkerThreadPrefix=NettyClientWorkerThread
transport.threadFactory.bossThreadSize=1
transport.threadFactory.workerThreadSize=default
transport.shutdown.wait=3
transport.serialization=seata
transport.compressor=none

#Transaction routing rules configuration, only for the client
service.vgroupMapping.default_tx_group=seata-server
#If you use a registry, you can ignore it
service.default.grouplist=127.0.0.1:8091
service.enableDegrade=false
service.disableGlobalTransaction=false

#Transaction rule configuration, only for the client
client.rm.asyncCommitBufferLimit=10000
client.rm.lock.retryInterval=10
client.rm.lock.retryTimes=30
client.rm.lock.retryPolicyBranchRollbackOnConflict=true
client.rm.reportRetryCount=5
client.rm.tableMetaCheckEnable=true
client.rm.tableMetaCheckerInterval=60000
client.rm.sqlParserType=druid
client.rm.reportSuccessEnable=false
client.rm.sagaBranchRegisterEnable=false
client.rm.sagaJsonParser=fastjson
client.rm.tccActionInterceptorOrder=-2147482648
client.tm.commitRetryCount=5
client.tm.rollbackRetryCount=5
client.tm.defaultGlobalTransactionTimeout=60000
client.tm.degradeCheck=false
client.tm.degradeCheckAllowTimes=10
client.tm.degradeCheckPeriod=2000
client.tm.interceptorOrder=-2147482648
client.undo.dataValidation=true
client.undo.logSerialization=jackson
client.undo.onlyCareUpdateColumns=true
server.undo.logSaveDays=7
server.undo.logDeletePeriod=86400000
client.undo.logTable=undo_log
client.undo.compress.enable=true
client.undo.compress.type=zip
client.undo.compress.threshold=64k
#For TCC transaction mode
tcc.fence.logTableName=tcc_fence_log
tcc.fence.cleanPeriod=1h

#Log rule configuration, for client and server
log.exceptionRate=100

#Transaction storage configuration, only for the server. The file, db, and redis configuration values are optional.
store.mode=db
store.lock.mode=db
store.session.mode=db
#Used for password encryption
store.publicKey=

#If `store.mode,store.lock.mode,store.session.mode` are not equal to `file`, you can remove the configuration block.
#store.file.dir=file_store/data
#store.file.maxBranchSessionSize=16384
#store.file.maxGlobalSessionSize=512
#store.file.fileWriteBufferCacheSize=16384
#store.file.flushDiskMode=async
#store.file.sessionReloadReadSize=100

#These configurations are required if the `store mode` is `db`. If `store.mode,store.lock.mode,store.session.mode` are not equal to `db`, you can remove the configuration block.
store.db.datasource=druid
store.db.dbType=mysql
store.db.driverClassName=com.mysql.jdbc.Driver
store.db.url=jdbc:mysql://127.0.0.1:13306/seata?useUnicode=true&rewriteBatchedStatements=true
store.db.user=root
store.db.password=root
store.db.minConn=5
store.db.maxConn=30
store.db.globalTable=global_table
store.db.branchTable=branch_table
store.db.distributedLockTable=distributed_lock
store.db.queryLimit=100
store.db.lockTable=lock_table
store.db.maxWait=5000

#These configurations are required if the `store mode` is `redis`. If `store.mode,store.lock.mode,store.session.mode` are not equal to `redis`, you can remove the configuration block.
#store.redis.mode=single
#store.redis.single.host=127.0.0.1
#store.redis.single.port=6379
#store.redis.sentinel.masterName=
#store.redis.sentinel.sentinelHosts=
#store.redis.maxConn=10
#store.redis.minConn=1
#store.redis.maxTotal=100
#store.redis.database=0
#store.redis.password=
#store.redis.queryLimit=100

#Transaction rule configuration, only for the server
server.recovery.committingRetryPeriod=1000
server.recovery.asynCommittingRetryPeriod=1000
server.recovery.rollbackingRetryPeriod=1000
server.recovery.timeoutRetryPeriod=1000
server.maxCommitRetryTimeout=-1
server.maxRollbackRetryTimeout=-1
server.rollbackRetryTimeoutUnlockEnable=false
server.distributedLockExpireTime=10000
server.xaerNotaRetryTimeout=60000
server.session.branchAsyncQueueSize=5000
server.session.enableBranchAsyncRemove=false
server.enableParallelRequestHandle=false

#Metrics configuration, only for the server
metrics.enabled=false
metrics.registryType=compact
metrics.exporterList=prometheus
metrics.exporterPrometheusPort=9898
```

![image-20221102202423929](/assets/images/springcloud/image-20221102202423929.png)

重新启动后:控制台已无Error

![image-20221102203608884](/assets/images/springcloud/image-20221102203608884.png)



![image-20221102203511334](/assets/images/springcloud/image-20221102203511334.png)



```java
i.s.c.r.netty.NettyClientChannelManager  : will connect to 192.168.231.130:8091
i.s.core.rpc.netty.NettyPoolableFactory  : NettyPool create channel to transactionRole:TMROLE,address:192.168.231.130:8091,msg:< RegisterTMRequest{applicationId='seata-order-service', transactionServiceGroup='seata-order-service-fescar-service-group'} >
```



#### nacos 拉取配置

```java
no available service found in cluster ‘seata-server’, please make sure registry config correct and keep your seata server running
```

seata-server服务注册在nacos的集群名称是否为seata-server(互相对应)

将seata.config.type配置为nacos后依然出错

```java
Failed to get available servers: {}
```

检查client的seata.config.type有没有配置为nacos(默认为file),以及seata.config.nacos.*的各项配置,

或者进入io.seata.core.rpc.netty.NettyClientChannelManager类中调试availInetSocketAddressList是否为null

```java
    private List<String> getAvailServerList(String transactionServiceGroup) throws Exception {
        List<InetSocketAddress> availInetSocketAddressList = RegistryFactory.getInstance()
                .lookup(transactionServiceGroup);
        if (CollectionUtils.isEmpty(availInetSocketAddressList)) {
            return Collections.emptyList();
        }

        return availInetSocketAddressList.stream()
                .map(NetUtil::toStringAddress)
                .collect(Collectors.toList());
    }
```

调试io.seata.config.nacos.NacosConfiguration查看配置是否生效



### Feign远程调用时全局事务失效

使用的是@GlobalTransactional+Feign

在测试时发现A服务feign调用B服务，出现异常时只能A回滚，B不回滚，在A和B服务接口打印RootContext.getXID()，发现A是能打印的，B打印出来为null，说明XID未能传递到B服务，在搜索资料之后发现可能是feign没有传递xid的原因，也可能是nginx默认过滤掉了_字符，因为我的AB服务都注册在nacos，而nacos集群经过nginx代理

解决方法1：在调用方新增配置，手动在header添加xid参数

```java
@Configuration
public class MyFeignConfig {
    @Bean
    public RequestInterceptor requestInterceptor() {
        return template -> {
            // 解决seata的xid未传递
            String xid = RootContext.getXID();
            template.header(RootContext.KEY_XID, xid);

            ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (requestAttributes != null) {
                String cookie = requestAttributes.getRequest().getHeader("Cookie");
                template.header("Cookie", cookie);
            }
        };
    }
}
```

​              

2.nginx默认request的header的那么中包含“__”时，会自动忽略掉。 自测还是不行,采取第一种
解决方法是：在nginx里的 **nginx.conf** 配置文件中的http部分中添加如下配置： 
underscores_in_headers on; （默认 underscores_in_headers 为off）

  



### 参考

Seata 是一款开源的分布式事务解决方案，致力于提供高性能和简单易用的分布式事务服务。Seata 将为用户提供了 AT、TCC、SAGA 和 XA 事务模式，为用户打造一站式的分布式解决方案。

![image](https://user-images.githubusercontent.com/68344696/145942191-7a2d469f-94c8-4cd2-8c7e-46ad75683636.png)

#### AT 模式

##### 前提

- 基于支持本地 ACID 事务的关系型数据库。
- Java 应用，通过 JDBC 访问数据库。

##### 整体机制

两阶段提交协议的演变：

- 一阶段：业务数据和回滚日志记录在同一个本地事务中提交，释放本地锁和连接资源。
- 二阶段：
  - 提交异步化，非常快速地完成。
  - 回滚通过一阶段的回滚日志进行反向补偿。

##### 写隔离

- 一阶段本地事务提交前，需要确保先拿到 **全局锁** 。
- 拿不到 **全局锁** ，不能提交本地事务。
- 拿 **全局锁** 的尝试被限制在一定范围内，超出范围将放弃，并回滚本地事务，释放本地锁。

以一个示例来说明：

两个全局事务 tx1 和 tx2，分别对 a 表的 m 字段进行更新操作，m 的初始值 1000。

tx1 先开始，开启本地事务，拿到本地锁，更新操作 m = 1000 - 100 = 900。本地事务提交前，先拿到该记录的 **全局锁** ，本地提交释放本地锁。 tx2 后开始，开启本地事务，拿到本地锁，更新操作 m = 900 - 100 = 800。本地事务提交前，尝试拿该记录的 **全局锁** ，tx1 全局提交前，该记录的全局锁被 tx1 持有，tx2 需要重试等待 **全局锁** 。

![Write-Isolation: Commit](/assets/images/springcloud/TB1zaknwVY7gK0jSZKzXXaikpXa-702-521.png)

tx1 二阶段全局提交，释放 **全局锁** 。tx2 拿到 **全局锁** 提交本地事务。

![Write-Isolation: Rollback](/assets/images/springcloud/TB1xW0UwubviK0jSZFNXXaApXXa-718-521.png)

如果 tx1 的二阶段全局回滚，则 tx1 需要重新获取该数据的本地锁，进行反向补偿的更新操作，实现分支的回滚。

此时，如果 tx2 仍在等待该数据的 **全局锁**，同时持有本地锁，则 tx1 的分支回滚会失败。分支的回滚会一直重试，直到 tx2 的 **全局锁** 等锁超时，放弃 **全局锁** 并回滚本地事务释放本地锁，tx1 的分支回滚最终成功。

因为整个过程 **全局锁** 在 tx1 结束前一直是被 tx1 持有的，所以不会发生 **脏写** 的问题。

##### 读隔离

在数据库本地事务隔离级别 **读已提交（Read Committed）** 或以上的基础上，Seata（AT 模式）的默认全局隔离级别是 **读未提交（Read Uncommitted）** 。

如果应用在特定场景下，必需要求全局的 **读已提交** ，目前 Seata 的方式是通过 SELECT FOR UPDATE 语句的代理。

![Read Isolation: SELECT FOR UPDATE](/assets/images/springcloud/TB138wuwYj1gK0jSZFuXXcrHpXa-724-521.png)

SELECT FOR UPDATE 语句的执行会申请 **全局锁** ，如果 **全局锁** 被其他事务持有，则释放本地锁（回滚 SELECT FOR UPDATE 语句的本地执行）并重试。这个过程中，查询是被 block 住的，直到 **全局锁** 拿到，即读取的相关数据是 **已提交** 的，才返回。

出于总体性能上的考虑，Seata 目前的方案并没有对所有 SELECT 语句都进行代理，仅针对 FOR UPDATE 的 SELECT 语句。

##### 工作机制

以一个示例来说明整个 AT 分支的工作过程。

业务表：`product`

| Field | Type         | Key  |
| ----- | ------------ | ---- |
| id    | bigint(20)   | PRI  |
| name  | varchar(100) |      |
| since | varchar(100) |      |

AT 分支事务的业务逻辑：

```sql
update product set name = 'GTS' where name = 'TXC';
```

##### 一阶段

过程：

1. 解析 SQL：得到 SQL 的类型（UPDATE），表（product），条件（where name = 'TXC'）等相关的信息。
2. 查询前镜像：根据解析得到的条件信息，生成查询语句，定位数据。

```sql
select id, name, since from product where name = 'TXC';
```

得到前镜像：

| id   | name | since |
| ---- | ---- | ----- |
| 1    | TXC  | 2014  |

1. 执行业务 SQL：更新这条记录的 name 为 'GTS'。
2. 查询后镜像：根据前镜像的结果，通过 **主键** 定位数据。

```sql
select id, name, since from product where id = 1;
```

得到后镜像：

| id   | name | since |
| ---- | ---- | ----- |
| 1    | GTS  | 2014  |

1. 插入回滚日志：把前后镜像数据以及业务 SQL 相关的信息组成一条回滚日志记录，插入到 `UNDO_LOG` 表中。

```json
{
	"branchId": 641789253,
	"undoItems": [{
		"afterImage": {
			"rows": [{
				"fields": [{
					"name": "id",
					"type": 4,
					"value": 1
				}, {
					"name": "name",
					"type": 12,
					"value": "GTS"
				}, {
					"name": "since",
					"type": 12,
					"value": "2014"
				}]
			}],
			"tableName": "product"
		},
		"beforeImage": {
			"rows": [{
				"fields": [{
					"name": "id",
					"type": 4,
					"value": 1
				}, {
					"name": "name",
					"type": 12,
					"value": "TXC"
				}, {
					"name": "since",
					"type": 12,
					"value": "2014"
				}]
			}],
			"tableName": "product"
		},
		"sqlType": "UPDATE"
	}],
	"xid": "xid:xxx"
}
```

1. 提交前，向 TC 注册分支：申请 `product` 表中，主键值等于 1 的记录的 **全局锁** 。
2. 本地事务提交：业务数据的更新和前面步骤中生成的 UNDO LOG 一并提交。
3. 将本地事务提交的结果上报给 TC。

##### 二阶段-回滚

1. 收到 TC 的分支回滚请求，开启一个本地事务，执行如下操作。
2. 通过 XID 和 Branch ID 查找到相应的 UNDO LOG 记录。
3. 数据校验：拿 UNDO LOG 中的后镜与当前数据进行比较，如果有不同，说明数据被当前全局事务之外的动作做了修改。这种情况，需要根据配置策略来做处理，详细的说明在另外的文档中介绍。
4. 根据 UNDO LOG 中的前镜像和业务 SQL 的相关信息生成并执行回滚的语句：

```sql
update product set name = 'TXC' where id = 1;
```

1. 提交本地事务。并把本地事务的执行结果（即分支事务回滚的结果）上报给 TC。

##### 二阶段-提交

1. 收到 TC 的分支提交请求，把请求放入一个异步任务的队列中，马上返回提交成功的结果给 TC。
2. 异步任务阶段的分支提交请求将异步和批量地删除相应 UNDO LOG 记录。

#### 附录

##### 回滚日志表

UNDO_LOG Table：不同数据库在类型上会略有差别。

以 MySQL 为例：

| Field         | Type         |
| ------------- | ------------ |
| branch_id     | bigint PK    |
| xid           | varchar(100) |
| context       | varchar(128) |
| rollback_info | longblob     |
| log_status    | tinyint      |
| log_created   | datetime     |
| log_modified  | datetime     |

```sql
-- 注意此处0.7.0+ 增加字段 context
CREATE TABLE `undo_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `branch_id` bigint(20) NOT NULL,
  `xid` varchar(100) NOT NULL,
  `context` varchar(128) NOT NULL,
  `rollback_info` longblob NOT NULL,
  `log_status` int(11) NOT NULL,
  `log_created` datetime NOT NULL,
  `log_modified` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_undo_log` (`xid`,`branch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
```

#### TCC 模式

回顾总览中的描述：一个分布式的全局事务，整体是 **两阶段提交** 的模型。全局事务是由若干分支事务组成的，分支事务要满足 **两阶段提交** 的模型要求，即需要每个分支事务都具备自己的：

- 一阶段 prepare 行为
- 二阶段 commit 或 rollback 行为

![Overview of a global transaction](/assets/images/springcloud/TB14Kguw1H2gK0jSZJnXXaT1FXa-853-482.png)

根据两阶段行为模式的不同，我们将分支事务划分为 **Automatic (Branch) Transaction Mode** 和 **Manual (Branch) Transaction Mode**.

AT 模式（[参考链接 TBD](https://seata.io/zh-cn/docs/overview/what-is-seata.html)）基于 **支持本地 ACID 事务** 的 **关系型数据库**：

- 一阶段 prepare 行为：在本地事务中，一并提交业务数据更新和相应回滚日志记录。
- 二阶段 commit 行为：马上成功结束，**自动** 异步批量清理回滚日志。
- 二阶段 rollback 行为：通过回滚日志，**自动** 生成补偿操作，完成数据回滚。

相应的，TCC 模式，不依赖于底层数据资源的事务支持：

- 一阶段 prepare 行为：调用 **自定义** 的 prepare 逻辑。
- 二阶段 commit 行为：调用 **自定义** 的 commit 逻辑。
- 二阶段 rollback 行为：调用 **自定义** 的 rollback 逻辑。

所谓 TCC 模式，是指支持把 **自定义** 的分支事务纳入到全局事务的管理中。

#### Saga 模式

Saga模式是SEATA提供的长事务解决方案，在Saga模式中，业务流程中每个参与者都提交本地事务，当出现某一个参与者失败则补偿前面已经成功的参与者，一阶段正向服务和二阶段补偿服务都由业务开发实现。

![Saga模式示意图](/assets/images/springcloud/TB1Y2kuw7T2gK0jSZFkXXcIQFXa-445-444.png)

理论基础：Hector & Kenneth 发表论⽂ Sagas （1987）

##### 适用场景：

- 业务流程长、业务流程多
- 参与者包含其它公司或遗留系统服务，无法提供 TCC 模式要求的三个接口

##### 优势：

- 一阶段提交本地事务，无锁，高性能
- 事件驱动架构，参与者可异步执行，高吞吐
- 补偿服务易于实现

##### 缺点：

- 不保证隔离性（应对方案见[用户文档](https://seata.io/zh-cn/docs/user/saga.html)）
