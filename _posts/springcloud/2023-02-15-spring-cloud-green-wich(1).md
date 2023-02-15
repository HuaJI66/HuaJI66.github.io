---
layout: post
title: Spring Cloud part1 学习笔记
subtitle: Spring Cloud part1 学习笔记
categories: SpringCloud
tags: [SpringCloud]
banner:
  video: null             # Video banner source
  loop: true              # Video loop
  volume: 0               # Video volume (100% is 1.0)
  start_at: 0             # Video start time
  image: /assets/images/banners/spy5.jpg    # Image banner source
--- 

# Spring Cloud



Spring Cloud为开发人员提供了用于快速构建分布式系统中某些常见模式的工具（例如，配置管理，服务发现，断路器，智能路由，微代理，控制总线）。分布式系统的协调产生了样板模式，并且使用Spring云开发人员可以快速支持实现这些模式的服务和应用程序。它们可以在任何分布式环境中正常工作，包括开发人员自己的笔记本电脑，裸机数据中心和受管理的平台，例如Cloud Foundry。

版本：Greenwich.SR5

Spring Cloud专注于为典型的用例和扩展机制提供良好的开箱即用体验，以涵盖其他情况。

- 分布式/版本化配置
- 服务注册和发现
- 路由
- 服务到服务的呼叫
- 负载均衡
- 断路器
- 分布式消息传递

# 第一部分：云原生应用程序

[Cloud Native](https://pivotal.io/platform-as-a-service/migrating-to-cloud-native-application-architectures-ebook)是一种应用程序开发风格，可鼓励在持续交付和价值驱动型开发领域轻松采用最佳实践。一个相关的学科是构建[12要素应用程序](https://12factor.net/)，其中开发实践与交付和运营目标保持一致，例如，通过使用声明性编程，管理和监视。Spring Cloud通过多种特定方式促进了这些发展方式。起点是一组功能，分布式系统中的所有组件都需要轻松访问这些功能。

其中Spring Cloud建立在[Spring Boot](https://projects.spring.io/spring-boot)上，涵盖了许多这些功能。Spring Cloud作为两个库提供了更多功能：Spring Cloud上下文和Spring Cloud Commons。Spring Cloud上下文为Spring Cloud应用程序的`ApplicationContext`提供了实用程序和特殊服务（引导上下文，加密，刷新作用域和环境端点）。Spring Cloud Commons是在不同的Spring Cloud实现中使用的一组抽象和通用类（例如Spring Cloud Netflix和Spring Cloud Consul）。

如果由于“密钥大小非法”而导致异常，并且使用Sun的JDK，则需要安装Java密码术扩展（JCE）无限强度管辖权策略文件。有关更多信息，请参见以下链接：

- [Java 6 JCE](https://www.oracle.com/technetwork/java/javase/downloads/jce-6-download-429243.html)
- [Java 7 JCE](https://www.oracle.com/technetwork/java/javase/downloads/jce-7-download-432124.html)
- [Java 8 JCE](https://www.oracle.com/technetwork/java/javase/downloads/jce8-download-2133166.html)

将文件解压缩到您使用的JRE / JDK x64 / x86版本的JDK / jre / lib / security文件夹中。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| Spring Cloud是根据非限制性Apache 2.0许可证发行的。如果您想为文档的这一部分做出贡献或发现错误，可以在[github上](https://github.com/spring-cloud/spring-cloud-commons/tree/master/docs/src/main/asciidoc)找到源代码和项目跟踪工具。 |

## 2. Spring Cloud上下文：应用程序上下文服务

Spring Boot对于如何使用Spring来构建应用程序有自己的看法。例如，它具有用于公共配置文件的常规位置，并具有用于公共管理和监视任务的端点。Spring Cloud以此为基础，并添加了一些功能，可能系统中的所有组件都将使用或偶尔需要这些功能。

## 2.1 Bootstrap应用程序上下文

Spring Cloud应用程序通过创建“ bootstrap ”上下文来运行，该上下文是主应用程序的父上下文。它负责从外部源加载配置属性，并负责解密本地外部配置文件中的属性。这两个上下文共享一个`Environment`，它是任何Spring应用程序的外部属性的来源。默认情况下，引导程序属性（不是`bootstrap.properties`，而是引导程序阶段加载的属性）具有较高的优先级，因此它们不能被本地配置覆盖。

引导上下文使用与主应用程序上下文不同的约定来定位外部配置。可以使用`bootstrap.yml`来代替`application.yml`（或`.properties`），而将引导程序和外部环境的外部配置很好地分开。以下清单显示了一个示例：

**bootstrap.yml。** 

```
spring:
  application:
    name: foo
  cloud:
    config:
      uri: ${SPRING_CONFIG_URI:http://localhost:8888}
```



如果您的应用程序需要来自服务器的任何特定于应用程序的配置，则最好设置`spring.application.name`（在`bootstrap.yml`或`application.yml`中）。为了将属性`spring.application.name`用作应用程序的上下文ID，必须在`bootstrap.[properties | yml]`中进行设置。

如果要检索特定的配置文件配置，还应该在`bootstrap.[properties | yml]`中设置`spring.profiles.active`。

您可以通过设置`spring.cloud.bootstrap.enabled=false`来完全禁用引导过程（例如，在系统属性中）。

## 2.2应用程序上下文层次结构

如果从`SpringApplication`或`SpringApplicationBuilder`构建应用程序上下文，那么Bootstrap上下文将作为父级添加到该上下文。Spring的一个功能是子上下文从其父级继承属性源和配置文件，因此与构建没有Spring Cloud Config的相同上下文相比，“ 主 ”应用程序上下文包含其他属性源。其他属性来源是：

- “ bootstrap ”：如果在Bootstrap上下文中找到任何`PropertySourceLocators`并且具有非空属性，则会以高优先级显示可选的`CompositePropertySource`。一个示例是Spring Cloud Config服务器中的属性。有关如何自定义此属性源内容的说明，请参见“ [第2.6节“自定义Bootstrap Property源”](https://www.springcloud.cc/spring-cloud-greenwich.html#customizing-bootstrap-property-sources) ”。
- “ applicationConfig：[classpath：bootstrap.yml] ”（以及相关文件，如果Spring配置文件处于活动状态）：如果您拥有`bootstrap.yml`（或`.properties`），则这些属性用于配置Bootstrap上下文。然后，当它们的父级被设置时，它们被添加到子级上下文。它们的优先级低于`application.yml`（或`.properties`）以及创建Spring Boot应用程序过程中正常添加到子级的任何其他属性源的优先级。有关如何自定义这些属性源内容的说明，请参见“ [第2.3节“更改引导程序Properties”的位置](https://www.springcloud.cc/spring-cloud-greenwich.html#customizing-bootstrap-properties) ”。

由于属性源的排序规则，“ bootstrap ”条目优先。但是，请注意，这些不包含来自`bootstrap.yml`的任何数据，该数据的优先级非常低，但可用于设置默认值。

您可以通过设置创建的任何`ApplicationContext`的父上下文来扩展上下文层次结构，例如，使用其自己的界面或使用`SpringApplicationBuilder`便捷方法（`parent()`，`child()`和`sibling()`）。引导上下文是您自己创建的最高级祖先的父级。层次结构中的每个上下文都有其自己的“ bootstrap ”（可能为空）属性源，以避免无意间将价值从父辈提升到子孙后代。如果有配置服务器，则层次结构中的每个上下文原则上也可以具有不同的`spring.application.name`，因此也具有不同的远程属性源。正常的Spring应用程序上下文行为规则适用于属性解析：子上下文的属性按名称以及属性源名称覆盖父级属性。（如果子项具有与父项同名的属性源，则子项中不包括来自父项的值）。

请注意，`SpringApplicationBuilder`可让您在整个层次结构中共享`Environment`，但这不是默认设置。因此，同级上下文尤其不需要具有相同的配置文件或属性源，即使它们可能与其父级共享相同的值。

## 2.3更改引导程序Properties的位置

可以通过设置`spring.cloud.bootstrap.name`（默认值：`bootstrap`），`spring.cloud.bootstrap.location`（默认值：空）或`spring.cloud.bootstrap.additional-location`（默认值：空）来指定`bootstrap.yml`（或`.properties`）位置。 —例如，在系统属性中。这些属性的行为类似于具有相同名称的`spring.config.*`变体。使用`spring.cloud.bootstrap.location`将替换默认位置，并且仅使用指定的位置。要将位置添加到默认位置列表中，可以使用`spring.cloud.bootstrap.additional-location`。实际上，它们是通过在引导程序`Environment`中设置这些属性来设置引导程序`ApplicationContext`的。如果存在有效的配置文件（通过`spring.profiles.active`或通过您正在构建的上下文中的`Environment` API），该配置文件中的属性也会被加载，这与常规Spring Boot应用程序中的加载情况相同-例如，从`bootstrap-development.properties`中获取`development`个人资料。

## 2.4覆盖远程Properties的值

通过引导上下文添加到应用程序中的属性源通常是“ 远程的 ”（例如，来自Spring Cloud Config Server）。默认情况下，不能在本地覆盖它们。如果要让您的应用程序使用其自己的系统属性或配置文件覆盖远程属性，则远程属性源必须通过设置`spring.cloud.config.allowOverride=true`来授予其权限（在本地设置无效）。设置该标志后，将使用两个更细粒度的设置来控制远程属性相对于系统属性和应用程序本地配置的位置：

- `spring.cloud.config.overrideNone=true`：从任何本地属性源覆盖。
- `spring.cloud.config.overrideSystemProperties=false`：只有系统属性，命令行参数和环境变量（而不是本地配置文件）才应覆盖远程设置。

## 2.5自定义Bootstrap配置

通过将项添加到名为`org.springframework.cloud.bootstrap.BootstrapConfiguration`的项下的`/META-INF/spring.factories`中，可以将引导上下文设置为执行您喜欢的任何操作。它包含用于创建上下文的Spring `@Configuration`类的逗号分隔列表。您可以在此处创建要用于主应用程序上下文进行自动装配的任何beans。`@Beans`类型为`ApplicationContextInitializer`的特殊合同。如果要控制启动顺序，则可以用`@Order`批注标记类（默认顺序为`last`）。

| ![[警告]](/assets/images/springcloud/warning.png)                                  |
| ------------------------------------------------------------ |
| 当添加自定义`BootstrapConfiguration`，小心你添加类不是`@ComponentScanned`错误地进入你的“ 主 ”应用程序上下文，这里可能并不需要它们。为引导配置类使用单独的程序包名称，并确保`@ComponentScan`或带注释的配置类`@SpringBootApplication`尚未包含该名称。 |

引导过程结束时，将初始化程序注入到主要的`SpringApplication`实例中（这是正常的Spring Boot启动顺序，无论它是作为独立应用程序运行还是部署在应用程序服务器中）。首先，从`spring.factories`中找到的类创建引导上下文。然后，在启动之前，将类型为`ApplicationContextInitializer`的所有`@Beans`添加到主`SpringApplication`。

## 2.6自定义引导程序Property源

引导过程添加的外部配置的默认属性来源是Spring Cloud Config服务器，但是您可以通过将类型`PropertySourceLocator`的beans添加到引导上下文（通过`spring.factories`）来添加其他来源。例如，您可以从其他服务器或数据库插入其他属性。

例如，请考虑以下定制定位器：

```
@Configuration
public class CustomPropertySourceLocator implements PropertySourceLocator {

    @Override
    public PropertySource<?> locate(Environment environment) {
        return new MapPropertySource("customProperty",
                Collections.<String, Object>singletonMap("property.from.sample.custom.source", "worked as intended"));
    }

}
```

传入的`Environment`是即将创建的`ApplicationContext`的那个，换句话说，就是我们为其提供其他属性源的那个。它已经有其正常的Spring Boot提供的属性源，因此您可以使用这些属性来定位特定于此`Environment`的属性源（例如，通过在`spring.application.name`上键入它，这与默认设置相同）。 Spring Cloud Config服务器属性源定位符）。

如果您创建一个包含此类的jar，然后添加包含以下内容的`META-INF/spring.factories`，则`customProperty` `PropertySource`会出现在任何在其类路径中包含该jar的应用程序中：

```
org.springframework.cloud.bootstrap.BootstrapConfiguration=sample.custom.CustomPropertySourceLocator
```

## 2.7日志配置

如果要使用Spring Boot来配置日志设置，则应将此配置放在`bootstrap。[yml | 属性]（如果您希望将其应用于所有事件）。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 为了使Spring Cloud正确初始化日志记录配置，您不能使用自定义前缀。例如，初始化记录系统时，Spring Cloud无法识别使用`custom.loggin.logpath`。 |

## 2.8环境变化

应用程序侦听`EnvironmentChangeEvent`并以几种标准方式对更改做出反应（用户可以通过常规方式将其他`ApplicationListeners`作为`@Beans`添加）。观察到`EnvironmentChangeEvent`时，它会列出已更改的键值，并且应用程序将这些键值用于：

- 重新绑定上下文中的任何`@ConfigurationProperties` beans
- 为`logging.level.*`中的所有属性设置记录器级别

请注意，默认情况下，Config Client不轮询`Environment`中的更改。通常，我们不建议您使用这种方法来检测更改（尽管您可以使用`@Scheduled`注释对其进行设置）。如果您具有横向扩展的客户端应用程序，则最好向所有实例广播`EnvironmentChangeEvent`，而不是让它们轮询更改（例如，使用[Spring Cloud Bus](https://github.com/spring-cloud/spring-cloud-bus)）。

只要您可以实际更改`Environment`并发布事件，`EnvironmentChangeEvent`就涵盖了一大类刷新用例。请注意，这些API是公共的，并且是核心Spring的一部分）。您可以通过访问`/configprops`端点（正常的Spring Boot Actuator功能）来验证更改是否绑定到`@ConfigurationProperties` beans。例如，`DataSource`可以在运行时更改其`maxPoolSize`（由Spring Boot创建的默认`DataSource`是`@ConfigurationProperties` bean）并动态地增加容量。重新绑定`@ConfigurationProperties`并不涵盖另一类用例，在这种情况下，您需要对刷新有更多的控制，并且需要对整个`ApplicationContext`进行原子更改。为了解决这些问题，我们有`@RefreshScope`。

## 2.9刷新范围

进行配置更改时，标记为`@RefreshScope`的Spring `@Bean`将得到特殊处理。此功能解决了状态beans的问题，该状态仅在初始化时才注入配置。例如，如果通过`Environment`更改数据库URL时`DataSource`具有打开的连接，则您可能希望这些连接的持有者能够完成他们正在做的事情。然后，下次某物从池中借用一个连接时，它将获得一个具有新URL的连接。

有时，甚至可能必须将`@RefreshScope`批注应用到只能初始化一次的某些beans上。如果bean是“不可变的”，则必须用`@RefreshScope`注释bean或在属性键`spring.cloud.refresh.extra-refreshable`下指定类名。

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 如果您自己创建一个`DataSource` bean，而实现是一个`HikariDataSource`，则返回最特定的类型，在这种情况下为`HikariDataSource`。否则，您将需要设置`spring.cloud.refresh.extra-refreshable=javax.sql.DataSource`。 |      |

刷新作用域beans是惰性代理，它们在使用时（即在调用方法时）进行初始化，并且作用域充当初始化值的缓存。若要强制bean在下一个方法调用上重新初始化，必须使它的缓存条目无效。

`RefreshScope`在上下文中是bean，并具有公用的`refreshAll()`方法，可通过清除目标缓存来刷新作用域中的所有beans。`/refresh`端点公开了此功能（通过HTTP或JMX）。要按名称刷新单个bean，还有一个`refresh(String)`方法。

要公开`/refresh`端点，您需要在应用程序中添加以下配置：

```
management:
  endpoints:
    web:
      exposure:
        include: refresh
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| `@RefreshScope`在`@Configuration`类上（在技术上）有效，但是可能会导致令人惊讶的行为。例如，这并不意味着该类中定义的所有`@Beans`本身都在`@RefreshScope`中。具体而言，除非刷新本身在`@RefreshScope`中，否则依赖那些beans的任何内容都不能依赖于刷新启动时对其进行更新。在这种情况下，将在刷新时重建它，并重新注入其依赖项。此时，它们将从刷新的`@Configuration`重新初始化。 |

## 2.10加密和解密

Spring Cloud具有`Environment`预处理器，用于在本地解密属性值。它遵循与Config Server相同的规则，并且通过`encrypt.*`具有相同的外部配置。因此，您可以使用`{cipher}*`形式的加密值，并且只要存在有效密钥，就可以在主应用程序上下文获得`Environment`设置之前对它们进行解密。要在应用程序中使用加密功能，您需要在类路径中包含Spring Security RSA（Maven坐标：“ org.springframework.security:spring-security-rsa”），并且还需要JVM中的全功能JCE扩展。

如果由于“密钥大小非法”而导致异常，并且使用Sun的JDK，则需要安装Java密码术扩展（JCE）无限强度管辖权策略文件。有关更多信息，请参见以下链接：

- [Java 6 JCE](https://www.oracle.com/technetwork/java/javase/downloads/jce-6-download-429243.html)
- [Java 7 JCE](https://www.oracle.com/technetwork/java/javase/downloads/jce-7-download-432124.html)
- [Java 8 JCE](https://www.oracle.com/technetwork/java/javase/downloads/jce8-download-2133166.html)

将文件解压缩到您使用的JRE / JDK x64 / x86版本的JDK / jre / lib / security文件夹中。

## 2.11端点

对于Spring Boot Actuator应用程序，可以使用一些其他管理端点。您可以使用：

- 从`POST`到`/actuator/env`以更新`Environment`并重新绑定`@ConfigurationProperties`和日志级别。
- `/actuator/refresh`重新加载引导上下文并刷新`@RefreshScope` beans。
- `/actuator/restart`关闭`ApplicationContext`并重新启动（默认情况下禁用）。
- `/actuator/pause`和`/actuator/resume`用于调用`Lifecycle`方法（`ApplicationContext`中的`stop()`和`start()`）。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 如果禁用`/actuator/restart`端点，则`/actuator/pause`和`/actuator/resume`端点也将被禁用，因为它们只是`/actuator/restart`的特例。 |

## 3. Spring Cloud Commons：通用抽象

服务发现，负载平衡和断路器之类的模式将它们带到一个通用的抽象层，可以由所有Spring Cloud客户端使用，而与实现无关（例如，使用Eureka或Consul进行的发现） ）。

## 3.1 @EnableDiscoveryClient

Spring Cloud Commons提供了`@EnableDiscoveryClient`批注。这将寻找`META-INF/spring.factories`与`DiscoveryClient`接口的实现。Discovery Client的实现在`org.springframework.cloud.client.discovery.EnableDiscoveryClient`键下将配置类添加到`spring.factories`。`DiscoveryClient`实现的示例包括[Spring Cloud Netflix Eureka](https://cloud.spring.io/spring-cloud-netflix/)，[Spring Cloud Consul发现](https://cloud.spring.io/spring-cloud-consul/)和[Spring Cloud Zookeeper发现](https://cloud.spring.io/spring-cloud-zookeeper/)。

默认情况下，`DiscoveryClient`的实现会自动将本地Spring Boot服务器注册到远程发现服务器。可以通过在`@EnableDiscoveryClient`中设置`autoRegister=false`来禁用此行为。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 不再需要`@EnableDiscoveryClient`。您可以在类路径上放置`DiscoveryClient`实现，以使Spring Boot应用程序向服务发现服务器注册。 |

### 3.1.1健康指标

公用创建了Spring Boot `HealthIndicator`，`DiscoveryClient`实现可以通过实现`DiscoveryHealthIndicator`来参与。要禁用复合`HealthIndicator`，请设置`spring.cloud.discovery.client.composite-indicator.enabled=false`。基于`DiscoveryClient`的通用`HealthIndicator`是自动配置的（`DiscoveryClientHealthIndicator`）。要禁用它，请设置`spring.cloud.discovery.client.health-indicator.enabled=false`。要禁用`DiscoveryClientHealthIndicator`的描述字段，请设置`spring.cloud.discovery.client.health-indicator.include-description=false`。否则，它可能会像已卷起的`HealthIndicator`中的`description`一样冒泡。

### 3.1.2订购`DiscoveryClient`实例

`DiscoveryClient`接口扩展了`Ordered`。当使用多个发现客户端时，这很有用，因为它允许您定义返回的发现客户端的顺序，类似于如何订购由Spring应用程序加载的beans。默认情况下，任何`DiscoveryClient`的顺序都设置为`0`。如果要为自定义`DiscoveryClient`实现设置不同的顺序，则只需覆盖`getOrder()`方法，以便它返回适合您的设置的值。除此之外，您可以使用属性来设置Spring Cloud提供的`DiscoveryClient`实现的顺序，其中包括`ConsulDiscoveryClient`，`EurekaDiscoveryClient`和`ZookeeperDiscoveryClient`。为此，您只需要将`spring.cloud.{clientIdentifier}.discovery.order`（对于Eureka，则为`eureka.client.order`）属性设置为所需的值。

## 3.2服务注册

Commons现在提供一个`ServiceRegistry`接口，该接口提供诸如`register(Registration)`和`deregister(Registration)`之类的方法，这些方法使您可以提供自定义的注册服务。`Registration`是标记界面。

以下示例显示了正在使用的`ServiceRegistry`：

```
@Configuration
@EnableDiscoveryClient(autoRegister=false)
public class MyConfiguration {
    private ServiceRegistry registry;

    public MyConfiguration(ServiceRegistry registry) {
        this.registry = registry;
    }

    // called through some external process, such as an event or a custom actuator endpoint
    public void register() {
        Registration registration = constructRegistration();
        this.registry.register(registration);
    }
}
```

每个`ServiceRegistry`实现都有自己的`Registry`实现。

- `ZookeeperRegistration`与`ZookeeperServiceRegistry`一起使用
- `EurekaRegistration`与`EurekaServiceRegistry`一起使用
- `ConsulRegistration`与`ConsulServiceRegistry`一起使用

如果您使用的是`ServiceRegistry`接口，则将需要为使用的`ServiceRegistry`实现传递正确的`Registry`实现。

### 3.2.1 ServiceRegistry自动注册

默认情况下，`ServiceRegistry`实现会自动注册正在运行的服务。要禁用该行为，可以设置：* `@EnableDiscoveryClient(autoRegister=false)`以永久禁用自动注册。* `spring.cloud.service-registry.auto-registration.enabled=false`通过配置禁用行为。

#### ServiceRegistry自动注册Events

服务自动注册时将触发两个事件。注册服务之前会触发名为`InstancePreRegisteredEvent`的第一个事件。注册服务后，将触发名为`InstanceRegisteredEvent`的第二个事件。您可以注册`ApplicationListener`，以收听和响应这些事件。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 如果将`spring.cloud.service-registry.auto-registration.enabled`设置为`false`，则不会触发这些事件。 |

### 3.2.2服务注册表执行器端点

Spring Cloud Commons提供了一个`/service-registry`执行器端点。该端点依赖于Spring应用程序上下文中的`Registration` bean。使用GET调用`/service-registry`会返回`Registration`的状态。对具有JSON正文的同一终结点使用POST会将当前`Registration`的状态更改为新值。JSON正文必须包含带有首选值的`status`字段。请参阅更新状态时用于允许值的`ServiceRegistry`实现的文档以及为状态返回的值。例如，Eureka的受支持状态为`UP`，`DOWN`，`OUT_OF_SERVICE`和`UNKNOWN`。

## 3.3 Spring RestTemplate作为负载均衡器客户端

`RestTemplate`可以自动配置为在后台使用负载均衡器客户端。要创建负载均衡的`RestTemplate`，请创建`RestTemplate` `@Bean`并使用`@LoadBalanced`限定符，如以下示例所示：

```
@Configuration
public class MyConfiguration {

    @LoadBalanced
    @Bean
    RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

public class MyClass {
    @Autowired
    private RestTemplate restTemplate;

    public String doOtherStuff() {
        String results = restTemplate.getForObject("http://stores/stores", String.class);
        return results;
    }
}
```

| ![[警告]](/assets/images/springcloud/caution.png)                                  | 警告 |
| ------------------------------------------------------------ | ---- |
| `RestTemplate` bean不再通过自动配置创建。各个应用程序必须创建它。 |      |

URI需要使用虚拟主机名（即服务名，而不是主机名）。Ribbon客户端用于创建完整的物理地址。有关如何设置`RestTemplate`的详细信息，请参见[RibbonAutoConfiguration](https://github.com/spring-cloud/spring-cloud-netflix/blob/master/spring-cloud-netflix-ribbon/src/main/java/org/springframework/cloud/netflix/ribbon/RibbonAutoConfiguration.java)。

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 为了使用负载均衡的`RestTemplate`，您需要在类路径中具有负载均衡器实现。推荐的实现是`BlockingLoadBalancerClient`-添加`org.springframework.cloud:spring-cloud-loadbalancer`以便使用它。`RibbonLoadBalancerClient`也可以使用，但是目前正在维护中，我们不建议将其添加到新项目中。 |      |

| ![[警告]](/assets/images/springcloud/warning.png)                                  |
| ------------------------------------------------------------ |
| 如果要使用`BlockingLoadBalancerClient`，请确保项目类路径中没有`RibbonLoadBalancerClient`，因为向后兼容的原因，默认情况下将使用它。 |

## 3.4 Spring WebClient作为负载均衡器客户端

`WebClient`可以自动配置为使用负载均衡器客户端。要创建负载均衡的`WebClient`，请创建`WebClient.Builder` `@Bean`并使用`@LoadBalanced`限定符，如以下示例所示：

```
@Configuration
public class MyConfiguration {

	@Bean
	@LoadBalanced
	public WebClient.Builder loadBalancedWebClientBuilder() {
		return WebClient.builder();
	}
}

public class MyClass {
    @Autowired
    private WebClient.Builder webClientBuilder;

    public Mono<String> doOtherStuff() {
        return webClientBuilder.build().get().uri("http://stores/stores")
        				.retrieve().bodyToMono(String.class);
    }
}
```

URI需要使用虚拟主机名（即服务名，而不是主机名）。Ribbon客户端用于创建完整的物理地址。

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 如果要使用`@LoadBalanced WebClient.Builder`，则需要在类路径中有一个loadbalancer实现。建议您将`org.springframework.cloud:spring-cloud-loadbalancer`依赖项添加到项目中。然后，将在下面使用`ReactiveLoadBalancer`。或者，此功能也可以在spring-cloud-starter-netflix-ribbon上使用，但是该请求将由后台的非响应`LoadBalancerClient`处理。此外，spring-cloud-starter-netflix-ribbon已经处于维护模式，因此我们不建议您将其添加到新项目中。 |      |

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 在下面使用的`ReactorLoadBalancer`支持缓存。如果检测到`cacheManager`，将使用`ServiceInstanceSupplier`的缓存版本。如果没有，我们将从发现服务中检索实例，而不进行缓存。如果您使用`ReactiveLoadBalancer`，建议您在项目中[启用缓存](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-caching.html)。 |

### 3.4.1重试失败的请求

可以配置负载均衡的`RestTemplate`以重试失败的请求。默认情况下，禁用此逻辑。您可以通过在应用程序的类路径中添加[Spring重试](https://github.com/spring-projects/spring-retry)来启用它。负载平衡的`RestTemplate`遵循与重试失败的请求有关的某些Ribbon配置值。您可以使用`client.ribbon.MaxAutoRetries`，`client.ribbon.MaxAutoRetriesNextServer`和`client.ribbon.OkToRetryOnAllOperations`属性。如果要通过对类路径使用Spring重试来禁用重试逻辑，则可以设置`spring.cloud.loadbalancer.retry.enabled=false`。有关这些属性的作用的说明，请参见[Ribbon文档](https://github.com/Netflix/ribbon/wiki/Getting-Started#the-properties-file-sample-clientproperties)。

如果要在重试中实现`BackOffPolicy`，则需要创建`LoadBalancedRetryFactory`类型的bean并覆盖`createBackOffPolicy`方法：

```
@Configuration
public class MyConfiguration {
    @Bean
    LoadBalancedRetryFactory retryFactory() {
        return new LoadBalancedRetryFactory() {
            @Override
            public BackOffPolicy createBackOffPolicy(String service) {
        		return new ExponentialBackOffPolicy();
        	}
        };
    }
}
```

| ![[注意]](/assets/images/springcloud/note.png)                         |
| ------------------------------------------------ |
| 前面示例中的`client`应替换为您的Ribbon客户名称。 |

如果要向重试功能中添加一个或多个`RetryListener`实现，则需要创建类型为`LoadBalancedRetryListenerFactory`的bean，并返回要用于给定服务的`RetryListener`数组，如以下示例所示：

```
@Configuration
public class MyConfiguration {
    @Bean
    LoadBalancedRetryListenerFactory retryListenerFactory() {
        return new LoadBalancedRetryListenerFactory() {
            @Override
            public RetryListener[] createRetryListeners(String service) {
                return new RetryListener[]{new RetryListener() {
                    @Override
                    public <T, E extends Throwable> boolean open(RetryContext context, RetryCallback<T, E> callback) {
                        //TODO Do you business...
                        return true;
                    }

                    @Override
                     public <T, E extends Throwable> void close(RetryContext context, RetryCallback<T, E> callback, Throwable throwable) {
                        //TODO Do you business...
                    }

                    @Override
                    public <T, E extends Throwable> void onError(RetryContext context, RetryCallback<T, E> callback, Throwable throwable) {
                        //TODO Do you business...
                    }
                }};
            }
        };
    }
}
```

## 3.5多个RestTemplate对象

如果您想要一个`RestTemplate`而不是负载均衡的，请创建一个`RestTemplate` bean并注入它。要访问负载均衡的`RestTemplate`，请在创建`@Bean`时使用`@LoadBalanced`限定符，如以下示例所示：

```
@Configuration
public class MyConfiguration {

    @LoadBalanced
    @Bean
    RestTemplate loadBalanced() {
        return new RestTemplate();
    }

    @Primary
    @Bean
    RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

public class MyClass {
@Autowired
private RestTemplate restTemplate;

    @Autowired
    @LoadBalanced
    private RestTemplate loadBalanced;

    public String doOtherStuff() {
        return loadBalanced.getForObject("http://stores/stores", String.class);
    }

    public String doStuff() {
        return restTemplate.getForObject("https://example.com", String.class);
    }
}
```

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 注意，在前面的示例中，在普通的`RestTemplate`声明上使用了`@Primary`批注，以消除不合格的`@Autowired`注入的歧义。 |      |

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 如果看到诸如`java.lang.IllegalArgumentException: Can not set org.springframework.web.client.RestTemplate field com.my.app.Foo.restTemplate to com.sun.proxy.$Proxy89`之类的错误，请尝试注入`RestOperations`或设置`spring.aop.proxyTargetClass=true`。 |

## 3.6多个WebClient对象

如果要使`WebClient`负载不均衡，请创建一个`WebClient` bean并注入它。要访问负载均衡的`WebClient`，请在创建`@Bean`时使用`@LoadBalanced`限定符，如以下示例所示：

```
@Configuration
public class MyConfiguration {

    @LoadBalanced
    @Bean
    WebClient.Builder loadBalanced() {
        return WebClient.builder();
    }

    @Primary
    @Bean
    WebClient.Builder webClient() {
        return WebClient.builder();
    }
}

public class MyClass {
    @Autowired
    private WebClient.Builder webClientBuilder;

    @Autowired
    @LoadBalanced
    private WebClient.Builder loadBalanced;

    public Mono<String> doOtherStuff() {
        return loadBalanced.build().get().uri("http://stores/stores")
        				.retrieve().bodyToMono(String.class);
    }

    public Mono<String> doStuff() {
        return webClientBuilder.build().get().uri("http://example.com")
        				.retrieve().bodyToMono(String.class);
    }
}
```

## 3.7 Spring WebFlux WebClient作为负载均衡器客户端

### 3.7.1 Spring具有响应式负载均衡器的WebFlux WebClient

可以将`WebClient`配置为使用`ReactiveLoadBalancer`。如果将`org.springframework.cloud:spring-cloud-loadbalancer`添加到项目中，并且`spring-webflux`在类路径中，则会自动配置`ReactorLoadBalancerExchangeFilterFunction`。以下示例说明如何配置`WebClient`以在后台使用无功负载均衡器：

```
public class MyClass {
    @Autowired
    private ReactorLoadBalancerExchangeFilterFunction lbFunction;

    public Mono<String> doOtherStuff() {
        return WebClient.builder().baseUrl("http://stores")
            .filter(lbFunction)
            .build()
            .get()
            .uri("/stores")
            .retrieve()
            .bodyToMono(String.class);
    }
}
```

URI需要使用虚拟主机名（即服务名，而不是主机名）。`ReactorLoadBalancerClient`用于创建完整的物理地址。

### 3.7.2 Spring WebFlux WebClient，带有非反应式负载均衡器客户端

如果您的项目中没有`org.springframework.cloud:spring-cloud-loadbalancer`，但是确实有spring-cloud-starter-netflix-ribbon，则仍可以将`WebClient`与`LoadBalancerClient`结合使用。如果`spring-webflux`在类路径中，将自动配置`LoadBalancerExchangeFilterFunction`。但是请注意，这是在后台使用非反应性客户端。以下示例显示如何配置`WebClient`以使用负载均衡器：

```
public class MyClass {
    @Autowired
    private LoadBalancerExchangeFilterFunction lbFunction;

    public Mono<String> doOtherStuff() {
        return WebClient.builder().baseUrl("http://stores")
            .filter(lbFunction)
            .build()
            .get()
            .uri("/stores")
            .retrieve()
            .bodyToMono(String.class);
    }
}
```

URI需要使用虚拟主机名（即服务名，而不是主机名）。`LoadBalancerClient`用于创建完整的物理地址。

警告：现在不建议使用此方法。我们建议您将[WebFlux与电抗性负载平衡器一起](https://www.springcloud.cc/spring-cloud-greenwich.html#webflux-with-reactive-loadbalancer) 使用。

### 3.7.3传递自己的Load-Balancer客户端配置

您还可以使用`@LoadBalancerClient`批注传递您自己的负载平衡器客户端配置，并传递负载平衡器客户端的名称和配置类，如下所示：

```
@Configuration
@LoadBalancerClient(value = "stores", configuration = StoresLoadBalancerClientConfiguration.class)
public class MyConfiguration {

	@Bean
	@LoadBalanced
	public WebClient.Builder loadBalancedWebClientBuilder() {
		return WebClient.builder();
	}
}
```

也可以通过`@LoadBalancerClients`注释将多个配置（对于一个以上的负载均衡器客户端）一起传递，如下所示：

```
@Configuration
@LoadBalancerClients({@LoadBalancerClient(value = "stores", configuration = StoresLoadBalancerClientConfiguration.class), @LoadBalancerClient(value = "customers", configuration = CustomersLoadBalancerClientConfiguration.class)})
public class MyConfiguration {

	@Bean
	@LoadBalanced
	public WebClient.Builder loadBalancedWebClientBuilder() {
		return WebClient.builder();
	}
}
```

## 3.8忽略网络接口

有时，忽略某些命名的网络接口很有用，以便可以将它们从服务发现注册中排除（例如，在Docker容器中运行时）。可以设置正则表达式列表，以使所需的网络接口被忽略。以下配置将忽略`docker0`接口以及所有以`veth`开头的接口：

**application.yml。** 

```
spring:
  cloud:
    inetutils:
      ignoredInterfaces:
        - docker0
        - veth.*
```



您还可以通过使用正则表达式列表来强制仅使用指定的网络地址，如以下示例所示：

**bootstrap.yml。** 

```
spring:
  cloud:
    inetutils:
      preferredNetworks:
        - 192.168
        - 10.0
```



您也可以只使用站点本地地址，如以下示例所示：.application.yml

```
spring:
  cloud:
    inetutils:
      useOnlySiteLocalInterfaces: true
```

有关构成站点本地地址的详细信息，请参见[Inet4Address.html.isSiteLocalAddress（）](https://docs.oracle.com/javase/8/docs/api/java/net/Inet4Address.html#isSiteLocalAddress--)。

## 3.9 HTTP客户端工厂

Spring Cloud Commons提供了beans用于创建Apache HTTP客户端（`ApacheHttpClientFactory`）和OK HTTP客户端（`OkHttpClientFactory`）。仅当OK HTTP jar位于类路径上时，才创建`OkHttpClientFactory` bean。此外，Spring Cloud Commons提供了beans用于创建两个客户端使用的连接管理器：`ApacheHttpClientConnectionManagerFactory`用于Apache HTTP客户端，`OkHttpClientConnectionPoolFactory`用于OK HTTP客户端。如果您想自定义在下游项目中如何创建HTTP客户端，则可以提供自己的beans实现。另外，如果您提供类型为`HttpClientBuilder`或`OkHttpClient.Builder`的bean，则默认工厂将使用这些构建器作为返回到下游项目的构建器的基础。您还可以通过将`spring.cloud.httpclientfactories.apache.enabled`或`spring.cloud.httpclientfactories.ok.enabled`设置为`false`来禁用这些beans的创建。

## 3.10启用的功能

Spring Cloud Commons提供了一个`/features`执行器端点。该端点返回类路径上可用的功能以及是否已启用它们。返回的信息包括功能类型，名称，版本和供应商。

### 3.10.1特征类型

“功能”有两种类型：抽象和命名。

抽象功能是定义接口或抽象类并创建实现的功能，例如`DiscoveryClient`，`LoadBalancerClient`或`LockService`。抽象类或接口用于在上下文中找到该类型的bean。显示的版本为`bean.getClass().getPackage().getImplementationVersion()`。

命名功能是没有实现的特定类的功能，例如“ Circuit Breaker”，“ API Gateway”，“ Spring Cloud Bus”等。这些功能需要一个名称和一个bean类型。

### 3.10.2声明功能

任何模块都可以声明任意数量的`HasFeature` beans，如以下示例所示：

```
@Bean
public HasFeatures commonsFeatures() {
  return HasFeatures.abstractFeatures(DiscoveryClient.class, LoadBalancerClient.class);
}

@Bean
public HasFeatures consulFeatures() {
  return HasFeatures.namedFeatures(
    new NamedFeature("Spring Cloud Bus", ConsulBusAutoConfiguration.class),
    new NamedFeature("Circuit Breaker", HystrixCommandAspect.class));
}

@Bean
HasFeatures localFeatures() {
  return HasFeatures.builder()
      .abstractFeature(Foo.class)
      .namedFeature(new NamedFeature("Bar Feature", Bar.class))
      .abstractFeature(Baz.class)
      .build();
}
```

这些beans中的每一个都应放入受到适当保护的`@Configuration`中。

## 3.11 Spring Cloud兼容性验证

由于某些用户在设置Spring Cloud应用程序时遇到问题，我们决定添加兼容性验证机制。如果您当前的设置与Spring Cloud要求不兼容，则会断开，并附上一份报告，说明出了什么问题。

目前，我们验证哪个版本的Spring Boot已添加到您的类路径中。

报告范例

```
***************************
APPLICATION FAILED TO START
***************************

Description:

Your project setup is incompatible with our requirements due to following reasons:

- Spring Boot [2.1.0.RELEASE] is not compatible with this Spring Cloud release train


Action:

Consider applying the following actions:

- Change Spring Boot version to one of the following versions [1.2.x, 1.3.x] .
You can find the latest Spring Boot versions here [https://spring.io/projects/spring-boot#learn].
If you want to learn more about the Spring Cloud Release train compatibility, you can visit this page [https://spring.io/projects/spring-cloud#overview] and check the [Release Trains] section.
```

为了禁用此功能，请将`spring.cloud.compatibility-verifier.enabled`设置为`false`。如果要覆盖兼容的Spring Boot版本，只需用兼容的Spring Boot版本的逗号分隔列表设置`spring.cloud.compatibility-verifier.compatible-boot-versions`属性。

# 第二部分 Spring Cloud Config

**Greenwich SR5**

Spring Cloud Config为分布式系统中的外部化配置提供服务器端和客户端支持。使用Config Server，您可以在中心位置管理所有环境中应用程序的外部属性。客户端和服务器上的概念都与Spring `Environment`和`PropertySource`抽象映射相同，因此它们非常适合Spring应用程序，但可以与以任何语言运行的任何应用程序一起使用。在应用程序从开发人员到测试人员再到生产人员的整个部署过程中，您可以管理这些环境之间的配置，并确保应用程序具有它们迁移时所需的一切。服务器存储后端的默认实现使用git，因此它轻松支持带标签的配置环境版本，并且可以通过各种工具来访问这些内容来管理内容。添加替代实现并将其插入Spring配置很容易。

## 4.快速入门

此快速入门介绍了如何使用Spring Cloud Config服务器的服务器和客户端。

首先，启动服务器，如下所示：

```
$ cd spring-cloud-config-server
$ ../mvnw spring-boot:run
```

该服务器是Spring Boot应用程序，因此，如果愿意，可以从IDE运行它（主类是`ConfigServerApplication`）。

接下来尝试一个客户端，如下所示：

```
$ curl localhost:8888/foo/development
{"name":"foo","label":"master","propertySources":[
  {"name":"https://github.com/scratches/config-repo/foo-development.properties","source":{"bar":"spam"}},
  {"name":"https://github.com/scratches/config-repo/foo.properties","source":{"foo":"bar"}}
]}
```

定位属性源的默认策略是克隆git存储库（位于`spring.cloud.config.server.git.uri`），并使用它来初始化小型`SpringApplication`。小型应用程序的`Environment`用于枚举属性源并将其发布在JSON端点上。

HTTP服务具有以下形式的资源：

```
/{application}/{profile}[/{label}]
/{application}-{profile}.yml
/{label}/{application}-{profile}.yml
/{application}-{profile}.properties
/{label}/{application}-{profile}.properties
```

`application`在`SpringApplication`中作为`spring.config.name`注入（在常规Spring Boot应用中通常是`application`），`profile`是有效配置文件（或逗号分隔）属性列表），而`label`是可选的git标签（默认为`master`。）

Spring Cloud Config服务器从各种来源获取远程客户端的配置。以下示例从git存储库（必须提供）中获取配置，如以下示例所示：

```
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/spring-cloud-samples/config-repo
```

其他来源包括任何与JDBC兼容的数据库，Subversion，Hashicorp Vault，Credhub和本地文件系统。

## 4.1客户端使用

要在应用程序中使用这些功能，您可以将其构建为依赖于spring-cloud-config-client的Spring Boot应用程序（例如，请参阅config-client或示例应用程序的测试用例）。添加依赖项最方便的方法是使用Spring Boot启动器`org.springframework.cloud:spring-cloud-starter-config`。还有一个Maven用户的父pom和BOM（`spring-cloud-starter-parent`），以及一个Gradle和Spring CLI用户的Spring IO版本管理属性文件。以下示例显示了典型的Maven配置：

**pom.xml。** 

```xml
   <parent>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-parent</artifactId>
       <version>{spring-boot-docs-version}</version>
       <relativePath /> <!-- lookup parent from repository -->
   </parent>

<dependencyManagement>
	<dependencies>
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-dependencies</artifactId>
			<version>{spring-cloud-version}</version>
			<type>pom</type>
			<scope>import</scope>
		</dependency>
	</dependencies>
</dependencyManagement>

<dependencies>
	<dependency>
		<groupId>org.springframework.cloud</groupId>
		<artifactId>spring-cloud-starter-config</artifactId>
	</dependency>
	<dependency>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-test</artifactId>
		<scope>test</scope>
	</dependency>
</dependencies>

<build>
	<plugins>
           <plugin>
               <groupId>org.springframework.boot</groupId>
               <artifactId>spring-boot-maven-plugin</artifactId>
           </plugin>
	</plugins>
</build>

   <!-- repositories also needed for snapshots and milestones -->
```



现在，您可以创建一个标准的Spring Boot应用程序，例如以下HTTP服务器：

```java
@SpringBootApplication
@RestController
public class Application {

    @RequestMapping("/")
    public String home() {
        return "Hello World!";
    }

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

}
```

当此HTTP服务器运行时，它将从端口8888上的默认本地配置服务器（如果正在运行）中获取外部配置。要修改启动行为，可以使用`bootstrap.properties`（类似于`application.properties`，但用于应用程序上下文的引导阶段），如以下示例所示：

```
spring.cloud.config.uri: http://myconfigserver.com
```

默认情况下，如果未设置应用程序名称，将使用`application`。要修改名称，可以将以下属性添加到`bootstrap.properties`文件中：

```
spring.application.name: myapp
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 设置属性`${spring.application.name}`时，请勿在您的应用名称前加上保留字`application-`，以防止解析正确的属性源时出现问题。 |

引导程序属性在`/env`端点中显示为高优先级属性源，如以下示例所示。

```
$ curl localhost:8080/env
{
  "profiles":[],
  "configService:https://github.com/spring-cloud-samples/config-repo/bar.properties":{"foo":"bar"},
  "servletContextInitParams":{},
  "systemProperties":{...},
  ...
}
```

名为```configService:<URL of remote repository>/<file name>`的属性源包含值为`bar`的`foo`属性，并且优先级最高。

| ![[注意]](/assets/images/springcloud/note.png)                            |
| --------------------------------------------------- |
| 属性源名称中的URL是git存储库，而不是配置服务器URL。 |

## 5. Spring Cloud Config服务器

Spring Cloud Config服务器为外部配置（名称/值对或等效的YAML内容）提供了一个基于HTTP资源的API。通过使用`@EnableConfigServer`批注，服务器可嵌入到Spring Boot应用程序中。因此，以下应用程序是配置服务器：

**ConfigServer.java。** 

```
@SpringBootApplication
@EnableConfigServer
public class ConfigServer {
  public static void main(String[] args) {
    SpringApplication.run(ConfigServer.class, args);
  }
}
```



像所有Spring Boot应用程序一样，它默认在端口8080上运行，但是您可以通过各种方式将其切换到更传统的端口8888。最简单的方法也是设置默认配置存储库，方法是使用`spring.config.name=configserver`（在Config Server jar中有`configserver.yml`）启动它。另一种方法是使用您自己的`application.properties`，如以下示例所示：

**application.properties。** 

```
server.port: 8888
spring.cloud.config.server.git.uri: file://${user.home}/config-repo
```



其中`${user.home}/config-repo`是包含YAML和属性文件的git存储库。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 在Windows上，如果文件URL带有驱动器前缀（例如，`file:///${user.home}/config-repo`）是绝对的，则在文件URL中需要一个额外的“ /”。 |

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 以下清单显示了在前面的示例中创建git存储库的方法：`$ cd $HOME $ mkdir config-repo $ cd config-repo $ git init . $ echo info.foo: bar > application.properties $ git add -A . $ git commit -m "Add application.properties"` |

| ![[警告]](/assets/images/springcloud/warning.png)                                  |
| ------------------------------------------------------------ |
| 将本地文件系统用于git存储库仅用于测试。您应该使用服务器在生产环境中托管配置存储库。 |

| ![[警告]](/assets/images/springcloud/warning.png)                                  |
| ------------------------------------------------------------ |
| 如果仅将文本文件保留在其中，则配置存储库的初始克隆可以快速有效。如果存储二进制文件（尤其是大文件），则可能会在首次配置请求时遇到延迟，或者在服务器中遇到内存不足错误。 |

## 5.1环境Repository

您应该在哪里存储配置服务器的配置数据？控制此行为的策略是服务`Environment`对象的`EnvironmentRepository`。`Environment`是Spring `Environment`的域的浅表副本（包括`propertySources`作为主要特征）。`Environment`资源由三个变量参数化：

- `{application}`，它映射到客户端的`spring.application.name`。
- `{profile}`，它映射到客户端上的`spring.profiles.active`（以逗号分隔的列表）。
- `{label}`，这是服务器端功能，标记了一组“版本化”的配置文件。

Repository实现通常类似于Spring Boot应用程序，从等于`{application}`参数的`spring.config.name`和等于`{profiles}`参数的`spring.profiles.active`加载配置文件。配置文件的优先规则也与常规Spring Boot应用程序中的规则相同：活动配置文件的优先级高于默认设置，并且，如果有多个配置文件，则最后一个优先（与向`Map`添加条目类似）。

以下示例客户端应用程序具有此引导程序配置：

**bootstrap.yml。** 

```
spring:
  application:
    name: foo
  profiles:
    active: dev,mysql
```



（与Spring Boot应用程序一样，这些属性也可以由环境变量或命令行参数设置）。

如果存储库基于文件，则服务器从`application.yml`（在所有客户端之间共享）和`foo.yml`（以`foo.yml`优先）创建一个`Environment`。如果YAML文件中包含指向Spring配置文件的文档，则将以更高的优先级应用这些文件（按列出的配置文件的顺序）。如果存在特定于配置文件的YAML（或属性）文件，这些文件也将以比默认文件更高的优先级应用。较高的优先级会转换为`Environment`中较早列出的`PropertySource`。（这些相同的规则适用于独立的Spring Boot应用程序。）

您可以将spring.cloud.config.server.accept-empty设置为false，以便在未找到应用程序的情况下Server返回HTTP 404状态。默认情况下，此标志设置为true。

### 5.1.1 Git后端

`EnvironmentRepository`的默认实现使用Git后端，这对于管理升级和物理环境以及审核更改非常方便。要更改存储库的位置，可以在Config Server中设置`spring.cloud.config.server.git.uri`配置属性（例如，在`application.yml`中）。如果您使用`file:`前缀进行设置，则它应在本地存储库中运行，以便无需服务器即可快速轻松地开始使用。但是，在那种情况下，服务器直接在本地存储库上运行而无需克隆它（如果它不是裸露的，这并不重要，因为Config Server从不对“远程”存储库进行更改）。要扩展Config Server并使其高度可用，您需要使服务器的所有实例都指向同一存储库，因此仅共享文件系统可以工作。即使在那种情况下，最好对共享文件系统存储库使用`ssh:`协议，以便服务器可以克隆它并将本地工作副本用作缓存。

此存储库实现将HTTP资源的`{label}`参数映射到git标签（提交ID，分支名称或标记）。如果git分支或标记名称包含斜杠（`/`），则应使用特殊字符串`(_)`在HTTP URL中指定标签（以避免与其他URL路径产生歧义）。例如，如果标签为`foo/bar`，则替换斜杠将产生以下标签：`foo(_)bar`。特殊字符串`(_)`的包含内容也可以应用于`{application}`参数。如果您使用命令行客户端（例如curl），请注意URL中的括号-您应使用单引号（''）将其从外壳中移出。

#### 跳过SSL证书验证

可以通过将`git.skipSslValidation`属性设置为`true`（默认值为`false`）来禁用配置服务器对Git服务器的SSL证书的验证。

```
spring:
  cloud:
    config:
      server:
        git:
          uri: https://example.com/my/repo
          skipSslValidation: true
```

#### 设置HTTP连接超时

您可以配置配置服务器将等待获取HTTP连接的时间（以秒为单位）。使用`git.timeout`属性。

```
spring:
  cloud:
    config:
      server:
        git:
          uri: https://example.com/my/repo
          timeout: 4
```

#### Git URI中的占位符

Spring Cloud Config服务器支持带有`{application}`和`{profile}`（如果需要的话还有`{label}`）占位符的git存储库URL，但是请记住该标签始终用作git标签。因此，您可以使用类似于以下的结构来支持“ 每个应用程序一个存储库 ”策略：

```
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/myorg/{application}
```

您也可以使用类似的模式（`{profile}`）来支持“ 每个配置文件一个存储库 ”策略。

此外，在`{application}`参数中使用特殊字符串“（_）”可以启用对多个组织的支持，如以下示例所示：

```
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/{application}
```

其中在请求时以以下格式提供`{application}`：`organization(_)application`。

#### 模式匹配和多个Repositories

Spring Cloud Config还通过在应用程序和概要文件名称上进行模式匹配来支持更复杂的需求。模式格式是以逗号分隔的`{application}/{profile}`名称列表，带有通配符（请注意，以通配符开头的模式可能需要加引号），如以下示例所示：

```
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/spring-cloud-samples/config-repo
          repos:
            simple: https://github.com/simple/config-repo
            special:
              pattern: special*/dev*,*special*/dev*
              uri: https://github.com/special/config-repo
            local:
              pattern: local*
              uri: file:/home/configsvc/config-repo
```

如果`{application}/{profile}`与任何模式都不匹配，它将使用在`spring.cloud.config.server.git.uri`下定义的默认URI。在上面的示例中，对于“ 简单 ”存储库，模式为`simple/*`（在所有配置文件中仅匹配一个名为`simple`的应用程序）。在“ 本地 ”库匹配，在所有配置文件（该`/*`后缀会自动添加到没有档案资料匹配的任何模式）`local`开头的所有应用程序名称。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 的“ 单行 ”中所使用的短切“ 简单 ”的例子可以只用于如果唯一的属性被设置为URI。如果您需要设置其他任何内容（凭证，模式等），则需要使用完整表格。 |

回购中的`pattern`属性实际上是一个数组，因此您可以使用YAML数组（或属性文件中的`[0]`，`[1]`等后缀）绑定到多个模式。如果要运行具有多个配置文件的应用程序，则可能需要这样做，如以下示例所示：

```
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/spring-cloud-samples/config-repo
          repos:
            development:
              pattern:
                - '*/development'
                - '*/staging'
              uri: https://github.com/development/config-repo
            staging:
              pattern:
                - '*/qa'
                - '*/production'
              uri: https://github.com/staging/config-repo
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| Spring Cloud猜测一个包含不以`*`结尾的配置文件的模式表示您实际上要匹配以该模式开头的配置文件列表（因此`*/staging`是`["*/staging", "*/staging,*"]`的快捷方式，等等）。例如，这很普遍，例如，您需要在本地的“ 开发 ”配置文件中运行应用程序，而又需要在远程的“ 云 ”配置文件中运行应用程序。 |

每个存储库还可以选择将配置文件存储在子目录中，用于搜索这些目录的模式可以指定为`searchPaths`。以下示例在顶层显示了一个配置文件：

```
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/spring-cloud-samples/config-repo
          searchPaths: foo,bar*
```

在前面的示例中，服务器在顶层和`foo/`子目录中以及名称以`bar`开头的任何子目录中搜索配置文件。

默认情况下，首次请求配置时，服务器会克隆远程存储库。可以将服务器配置为在启动时克隆存储库，如以下顶级示例所示：

```
spring:
  cloud:
    config:
      server:
        git:
          uri: https://git/common/config-repo.git
          repos:
            team-a:
                pattern: team-a-*
                cloneOnStart: true
                uri: https://git/team-a/config-repo.git
            team-b:
                pattern: team-b-*
                cloneOnStart: false
                uri: https://git/team-b/config-repo.git
            team-c:
                pattern: team-c-*
                uri: https://git/team-a/config-repo.git
```

在前面的示例中，服务器在接受任何请求之前会在启动时克隆team-a的config-repo。在请求从存储库进行配置之前，不会克隆所有其他存储库。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 设置要在Config Server启动时克隆的存储库有助于在Config Server启动时快速识别配置错误的配置源（例如无效的存储库URI）。在未为配置源启用`cloneOnStart`的情况下，Config Server可能会以配置错误或无效的配置源成功启动，并且直到应用程序从该配置源请求配置时才检测到错误。 |

#### 认证方式

要在远程存储库上使用HTTP基本认证，请分别添加`username`和`password`属性（不在URL中），如以下示例所示：

```
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/spring-cloud-samples/config-repo
          username: trolley
          password: strongpassword
```

如果您不使用HTTPS和用户凭据，则在将密钥存储在默认目录（`~/.ssh`）中且URI指向SSH位置（例如`git@github.com:configuration/cloud-configuration`）时，SSH也应立即可用。重要的是，`~/.ssh/known_hosts`文件中应包含Git服务器的条目，并且其格式应为`ssh-rsa`。不支持其他格式（例如`ecdsa-sha2-nistp256`）。为避免意外，您应确保Git服务器的`known_hosts`文件中仅存在一个条目，并且该条目与您提供给配置服务器的URL匹配。如果在URL中使用主机名，则要在`known_hosts`文件中完全使用该主机名（而不是IP）。使用JGit访问存储库，因此您找到的任何文档都应该适用。HTTPS代理设置可以在`~/.git/config`中设置，也可以（使用与其他JVM进程相同的方式）使用系统属性（`-Dhttps.proxyHost`和`-Dhttps.proxyPort`）进行设置。

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 如果您不知道`~/.git`目录在哪里，请使用`git config --global`来操纵设置（例如，`git config --global http.sslVerify false`）。 |

#### 使用AWS CodeCommit进行身份验证

Spring Cloud Config服务器还支持[AWS CodeCommit](https://docs.aws.amazon.com/codecommit/latest/userguide/welcome.html)身份验证。从命令行使用Git时，AWS CodeCommit使用身份验证帮助程序。该帮助程序未与JGit库一起使用，因此，如果Git URI与AWS CodeCommit模式匹配，则会为AWS CodeCommit创建一个JGit CredentialProvider。AWS CodeCommit URI遵循以下模式：//git-codecommit.${AWS_REGION}.amazonaws.com/${repopath}。

如果您提供带有AWS CodeCommit URI的用户名和密码，则它们必须是提供对存储库访问权限的[AWS accessKeyId和secretAccessKey](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSGettingStartedGuide/AWSCredentials.html)。如果您未指定用户名和密码，则使用[AWS Default Credential Provider链](https://docs.aws.amazon.com/sdk-for-java/v1/developer-guide/credentials.html)检索accessKeyId和secretAccessKey 。

如果您的Git URI与CodeCommit URI模式（如前所示）匹配，则必须在用户名和密码或默认凭据提供商链支持的位置之一中提供有效的AWS凭据。AWS EC2实例可以将[IAM角色用于EC2实例](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html)。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| `aws-java-sdk-core` jar是可选的依赖项。如果`aws-java-sdk-core` jar不在您的类路径中，则无论git服务器URI如何，都不会创建AWS Code Commit凭证提供程序。 |

#### 使用属性进行Git SSH配置

默认情况下，当使用SSH URI连接到Git存储库时，Spring Cloud Config服务器使用的JGit库使用SSH配置文件，例如`~/.ssh/known_hosts`和`/etc/ssh/ssh_config`。在Cloud Foundry之类的云环境中，本地文件系统可能是临时的，或者不容易访问。在这种情况下，可以使用Java属性设置SSH配置。为了激活基于属性的SSH配置，必须将`spring.cloud.config.server.git.ignoreLocalSshSettings`属性设置为`true`，如以下示例所示：

```
  spring:
    cloud:
      config:
        server:
          git:
            uri: git@gitserver.com:team/repo1.git
            ignoreLocalSshSettings: true
            hostKey: someHostKey
            hostKeyAlgorithm: ssh-rsa
            privateKey: |
                         -----BEGIN RSA PRIVATE KEY-----
                         MIIEpgIBAAKCAQEAx4UbaDzY5xjW6hc9jwN0mX33XpTDVW9WqHp5AKaRbtAC3DqX
                         IXFMPgw3K45jxRb93f8tv9vL3rD9CUG1Gv4FM+o7ds7FRES5RTjv2RT/JVNJCoqF
                         ol8+ngLqRZCyBtQN7zYByWMRirPGoDUqdPYrj2yq+ObBBNhg5N+hOwKjjpzdj2Ud
                         1l7R+wxIqmJo1IYyy16xS8WsjyQuyC0lL456qkd5BDZ0Ag8j2X9H9D5220Ln7s9i
                         oezTipXipS7p7Jekf3Ywx6abJwOmB0rX79dV4qiNcGgzATnG1PkXxqt76VhcGa0W
                         DDVHEEYGbSQ6hIGSh0I7BQun0aLRZojfE3gqHQIDAQABAoIBAQCZmGrk8BK6tXCd
                         fY6yTiKxFzwb38IQP0ojIUWNrq0+9Xt+NsypviLHkXfXXCKKU4zUHeIGVRq5MN9b
                         BO56/RrcQHHOoJdUWuOV2qMqJvPUtC0CpGkD+valhfD75MxoXU7s3FK7yjxy3rsG
                         EmfA6tHV8/4a5umo5TqSd2YTm5B19AhRqiuUVI1wTB41DjULUGiMYrnYrhzQlVvj
                         5MjnKTlYu3V8PoYDfv1GmxPPh6vlpafXEeEYN8VB97e5x3DGHjZ5UrurAmTLTdO8
                         +AahyoKsIY612TkkQthJlt7FJAwnCGMgY6podzzvzICLFmmTXYiZ/28I4BX/mOSe
                         pZVnfRixAoGBAO6Uiwt40/PKs53mCEWngslSCsh9oGAaLTf/XdvMns5VmuyyAyKG
                         ti8Ol5wqBMi4GIUzjbgUvSUt+IowIrG3f5tN85wpjQ1UGVcpTnl5Qo9xaS1PFScQ
                         xrtWZ9eNj2TsIAMp/svJsyGG3OibxfnuAIpSXNQiJPwRlW3irzpGgVx/AoGBANYW
                         dnhshUcEHMJi3aXwR12OTDnaLoanVGLwLnkqLSYUZA7ZegpKq90UAuBdcEfgdpyi
                         PhKpeaeIiAaNnFo8m9aoTKr+7I6/uMTlwrVnfrsVTZv3orxjwQV20YIBCVRKD1uX
                         VhE0ozPZxwwKSPAFocpyWpGHGreGF1AIYBE9UBtjAoGBAI8bfPgJpyFyMiGBjO6z
                         FwlJc/xlFqDusrcHL7abW5qq0L4v3R+FrJw3ZYufzLTVcKfdj6GelwJJO+8wBm+R
                         gTKYJItEhT48duLIfTDyIpHGVm9+I1MGhh5zKuCqIhxIYr9jHloBB7kRm0rPvYY4
                         VAykcNgyDvtAVODP+4m6JvhjAoGBALbtTqErKN47V0+JJpapLnF0KxGrqeGIjIRV
                         cYA6V4WYGr7NeIfesecfOC356PyhgPfpcVyEztwlvwTKb3RzIT1TZN8fH4YBr6Ee
                         KTbTjefRFhVUjQqnucAvfGi29f+9oE3Ei9f7wA+H35ocF6JvTYUsHNMIO/3gZ38N
                         CPjyCMa9AoGBAMhsITNe3QcbsXAbdUR00dDsIFVROzyFJ2m40i4KCRM35bC/BIBs
                         q0TY3we+ERB40U8Z2BvU61QuwaunJ2+uGadHo58VSVdggqAo0BSkH58innKKt96J
                         69pcVH/4rmLbXdcmNYGm6iu+MlPQk4BUZknHSmVHIFdJ0EPupVaQ8RHT
                         -----END RSA PRIVATE KEY-----
```

下表描述了SSH配置属性。



**表5.1。SSH配置Properties**

| Property名称                 | 备注                                                         |
| ---------------------------- | ------------------------------------------------------------ |
| **ignoreLocalSshSettings**   | 如果为`true`，请使用基于属性的SSH配置而不是基于文件的SSH配置。必须设置为`spring.cloud.config.server.git.ignoreLocalSshSettings`，**而不是**在存储库定义中。 |
| **私钥**                     | 有效的SSH私钥。如果`ignoreLocalSshSettings`为true并且Git URI为SSH格式，则必须设置。 |
| **hostKey**                  | 有效的SSH主机密钥。如果还设置了`hostKeyAlgorithm`，则必须设置。 |
| **hostKeyAlgorithm**         | `ssh-dss, ssh-rsa, ecdsa-sha2-nistp256, ecdsa-sha2-nistp384, or ecdsa-sha2-nistp521`之一。如果还设置了`hostKey`，则必须设置。 |
| **strictHostKeyChecking**    | `true`或`false`。如果为false，请忽略主机密钥错误。           |
| **knownHostsFile**           | 自定义`.known_hosts`文件的位置。                             |
| **preferredAuthentications** | 覆盖服务器身份验证方法顺序。如果服务器在`publickey`方法之前进行了键盘交互式身份验证，则应该可以避免登录提示。 |



#### Git搜索路径中的占位符

Spring Cloud Config服务器还支持带有`{application}`和`{profile}`（如果需要的话还有`{label}`）占位符的搜索路径，如以下示例所示：

```
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/spring-cloud-samples/config-repo
          searchPaths: '{application}'
```

上面的清单导致在存储库中搜索与目录（以及顶层）同名的文件。通配符在带有占位符的搜索路径中也有效（搜索中包括任何匹配的目录）。

#### 强制拉动Git Repositories

如前所述，Spring Cloud Config服务器会复制远程git存储库，以防本地副本变脏（例如，操作系统进程更改了文件夹内容），使得Spring Cloud Config服务器无法从远程更新本地副本。资料库。

要解决此问题，有一个`force-pull`属性，如果本地副本脏了，则可以使Spring Cloud Config服务器从远程存储库强制拉出，如以下示例所示：

```
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/spring-cloud-samples/config-repo
          force-pull: true
```

如果您有多个存储库配置，则可以为每个存储库配置`force-pull`属性，如以下示例所示：

```
spring:
  cloud:
    config:
      server:
        git:
          uri: https://git/common/config-repo.git
          force-pull: true
          repos:
            team-a:
                pattern: team-a-*
                uri: https://git/team-a/config-repo.git
                force-pull: true
            team-b:
                pattern: team-b-*
                uri: https://git/team-b/config-repo.git
                force-pull: true
            team-c:
                pattern: team-c-*
                uri: https://git/team-a/config-repo.git
```

| ![[注意]](/assets/images/springcloud/note.png)            |
| ----------------------------------- |
| `force-pull`属性的默认值为`false`。 |

#### 删除Git Repositories中未跟踪的分支

由于Spring Cloud Config服务器在检出分支到本地存储库（例如，通过标签获取属性）后具有远程git存储库的克隆，因此它将永久保留该分支，直到下一个服务器重新启动（这将创建新的本地存储库）。因此，可能会删除远程分支，但仍可获取其本地副本。而且，如果Spring Cloud Config服务器客户端服务以`--spring.cloud.config.label=deletedRemoteBranch,master`开头，它将从`deletedRemoteBranch`本地分支获取属性，而不是从`master`获取属性。

为了使本地存储库分支保持整洁并保持远程状态-可以设置`deleteUntrackedBranches`属性。这将使Spring Cloud Config服务器从本地存储库中**强制**删除未跟踪的分支。例：

```
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/spring-cloud-samples/config-repo
          deleteUntrackedBranches: true
```

| ![[注意]](/assets/images/springcloud/note.png)                         |
| ------------------------------------------------ |
| `deleteUntrackedBranches`属性的默认值为`false`。 |

#### Git刷新率

您可以使用`spring.cloud.config.server.git.refreshRate`控制配置服务器多久从Git后端获取更新的配置数据。以秒为单位指定此属性的值。默认情况下，该值为0，这意味着配置服务器将在每次请求时从Git存储库中获取更新的配置。

### 5.1.2版本控制后端文件系统使用

| ![[警告]](/assets/images/springcloud/warning.png)                                  |
| ------------------------------------------------------------ |
| 使用基于VCS的后端（git，svn），文件被检出或克隆到本地文件系统。默认情况下，它们以`config-repo-`为前缀放在系统临时目录中。例如，在Linux上，它可能是`/tmp/config-repo-<randomid>`。一些操作系统[通常会清除](https://serverfault.com/questions/377348/when-does-tmp-get-cleared/377349#377349)临时目录。这可能导致意外行为，例如缺少属性。为避免此问题，请通过将`spring.cloud.config.server.git.basedir`或`spring.cloud.config.server.svn.basedir`设置为不在系统临时结构中的目录来更改Config Server使用的目录。 |

### 5.1.3文件系统后端

Config Server中还有一个“ 本机 ”配置文件，该配置文件不使用Git，而是从本地类路径或文件系统（您要使用`spring.cloud.config.server.native.searchLocations`指向的任何静态URL）加载配置文件。要使用本机配置文件，请使用`spring.profiles.active=native`启动Config Server。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 请记住对文件资源使用`file:`前缀（默认情况下，没有前缀的通常是类路径）。与任何Spring Boot配置一样，您可以嵌入`${}`样式的环境占位符，但是请记住，Windows中的绝对路径需要额外的`/`（例如，`file:///${user.home}/config-repo`）。 |

| ![[警告]](/assets/images/springcloud/warning.png)                                  |
| ------------------------------------------------------------ |
| `searchLocations`的默认值与本地Spring Boot应用程序（即`[classpath:/, classpath:/config, file:./, file:./config]`）相同。这不会将`application.properties`从服务器公开给所有客户端，因为服务器中存在的所有属性源在被发送到客户端之前都已被删除。 |

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 文件系统后端非常适合快速入门和测试。要在生产环境中使用它，您需要确保文件系统可靠并且可以在Config Server的所有实例之间共享。 |

搜索位置可以包含`{application}`，`{profile}`和`{label}`的占位符。这样，您可以隔离路径中的目录并选择一种对您有意义的策略（例如，每个应用程序的子目录或每个配置文件的子目录）。

如果在搜索位置中不使用占位符，则此存储库还将HTTP资源的`{label}`参数附加到搜索路径上的后缀，因此将从每个搜索位置**和**与该名称相同的子目录加载属性文件。标签（在Spring环境中，带有标签的属性优先）。因此，没有占位符的默认行为与添加以`/{label}/`结尾的搜索位置相同。例如，`file:/tmp/config`与`file:/tmp/config,file:/tmp/config/{label}`相同。可以通过设置`spring.cloud.config.server.native.addLabelLocations=false`来禁用此行为。

### 5.1.4 Vault后端

Spring Cloud Config服务器还支持[Vault](https://www.vaultproject.io/)作为后端。

Vault是用于安全访问机密的工具。秘密是您要严格控制访问权限的所有内容，例如API密钥，密码，证书和其他敏感信息。Vault为所有机密提供了统一的界面，同时提供了严格的访问控制并记录了详细的审核日志。

有关Vault的更多信息，请参见[Vault快速入门指南](https://learn.hashicorp.com/vault/?track=getting-started#getting-started)。

要使配置服务器能够使用Vault后端，您可以使用`vault`配置文件运行配置服务器。例如，在配置服务器的`application.properties`中，您可以添加`spring.profiles.active=vault`。

默认情况下，配置服务器假定您的Vault服务器在`http://127.0.0.1:8200`下运行。它还假定后端的名称为`secret`，密钥为`application`。所有这些默认值都可以在配置服务器的`application.properties`中进行配置。下表描述了可配置的Vault属性：

| 名称              | 默认值      |
| ----------------- | ----------- |
| host              | 127.0.0.1   |
| port              | 8200        |
| scheme            | http        |
| backend           | secret      |
| defaultKey        | application |
| profileSeparator  | ,           |
| kvVersion         | 1           |
| skipSslValidation | false       |
| timeout           | 5           |
| namespace         | null        |

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 上表中的所有属性必须以`spring.cloud.config.server.vault`为前缀，或放置在复合配置的正确Vault部分中。 |      |

所有可配置的属性都可以在`org.springframework.cloud.config.server.environment.VaultEnvironmentProperties`中找到。

Vault 0.10.0引入了版本化的键值后端（k / v后端版本2），该后端公开了与早期版本不同的API，现在它需要在安装路径和实际上下文路径之间使用`data/`并包装`data`对象中的秘密。设置`kvVersion=2`将考虑到这一点。

（可选）支持Vault企业版`X-Vault-Namespace`标头。要将其发送到Vault，请设置`namespace`属性。

在配置服务器运行时，您可以向服务器发出HTTP请求以从Vault后端检索值。为此，您需要Vault服务器的令牌。

首先，将一些数据放入您的Vault中，如以下示例所示：

```
$ vault kv put secret/application foo=bar baz=bam
$ vault kv put secret/myapp foo=myappsbar
```

其次，向配置服务器发出HTTP请求以检索值，如以下示例所示：

```
$ curl -X "GET" "http://localhost:8888/myapp/default" -H "X-Config-Token: yourtoken"
```

您应该看到类似于以下内容的响应：

```
{
   "name":"myapp",
   "profiles":[
      "default"
   ],
   "label":null,
   "version":null,
   "state":null,
   "propertySources":[
      {
         "name":"vault:myapp",
         "source":{
            "foo":"myappsbar"
         }
      },
      {
         "name":"vault:application",
         "source":{
            "baz":"bam",
            "foo":"bar"
         }
      }
   ]
}
```

#### 多个Properties来源

使用Vault时，可以为您的应用程序提供多个属性源。例如，假设您已将数据写入Vault中的以下路径：

```
secret/myApp,dev
secret/myApp
secret/application,dev
secret/application
```

写入`secret/application`的Properties对[使用Config Server的所有应用程序](https://www.springcloud.cc/spring-cloud-greenwich.html#)均可[用](https://www.springcloud.cc/spring-cloud-greenwich.html#)。名称为`myApp`的应用程序将具有写入`secret/myApp`和`secret/application`的所有属性。当`myApp`启用了`dev`配置文件时，写入上述所有路径的属性将可用，列表中第一个路径中的属性优先于其他属性。

### 5.1.5通过代理访问后端

配置服务器可以通过HTTP或HTTPS代理访问Git或Vault后端。通过`proxy.http`和`proxy.https`下的设置，可以为Git或Vault控制此行为。这些设置是针对每个存储库的，因此，如果您使用[组合环境存储库](https://www.springcloud.cc/spring-cloud-greenwich.html#composite-environment-repositories)，则必须分别为组合中的每个后端配置代理设置。如果使用的网络需要HTTP和HTTPS URL分别使用代理服务器，则可以为单个后端配置HTTP和HTTPS代理设置。

下表描述了HTTP和HTTPS代理的代理配置属性。所有这些属性都必须以`proxy.http`或`proxy.https`作为前缀。



**表5.2。代理配置Properties**

| Property名称      | 备注                                                         |
| ----------------- | ------------------------------------------------------------ |
| **主办**          | 代理的主机。                                                 |
| **港口**          | 用于访问代理的端口。                                         |
| **nonProxyHosts** | 配置服务器应在代理外部访问的所有主机。如果同时为`proxy.http.nonProxyHosts`和`proxy.https.nonProxyHosts`提供了值，则将使用`proxy.http`值。 |
| **用户名**        | 用来验证代理的用户名。如果同时为`proxy.http.username`和`proxy.https.username`提供了值，则将使用`proxy.http`值。 |
| **密码**          | 用来验证代理的密码。如果同时为`proxy.http.password`和`proxy.https.password`提供了值，则将使用`proxy.http`值。 |



以下配置使用HTTPS代理访问Git存储库。

```
spring:
  profiles:
    active: git
  cloud:
    config:
      server:
        git:
          uri: https://github.com/spring-cloud-samples/config-repo
          proxy:
            https:
              host: my-proxy.host.io
              password: myproxypassword
              port: '3128'
              username: myproxyusername
              nonProxyHosts: example.com
```

### 5.1.6与所有应用程序共享配置

所有应用程序之间的共享配置根据您采用的方法而异，如以下主题所述：

- [称为“基于文件的Repositories”部分](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-config-server-file-based-repositories)
- [称为“ Vault服务器”的部分](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-config-server-vault-server)

#### 基于文件的Repositories

使用基于文件（git，svn和本机）的存储库，所有客户端应用程序之间共享文件名称为`application*`（`application.properties`，`application.yml`，`application-*.properties`等）的资源。您可以使用具有这些文件名的资源来配置全局默认值，并在必要时使它们被应用程序特定的文件覆盖。

\#_property_overrides [属性覆盖]功能也可以用于设置全局默认值，允许使用占位符应用程序在本地覆盖它们。

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 使用“ 本机 ”配置文件（本地文件系统后端），您应该使用不属于服务器自身配置的显式搜索位置。否则，默认搜索位置中的`application*`资源将被删除，因为它们是服务器的一部分。 |

#### Vault服务器

将Vault用作后端时，可以通过将配置放在`secret/application`中来与所有应用程序共享配置。例如，如果您运行以下Vault命令，则所有使用配置服务器的应用程序都将具有可用的属性`foo`和`baz`：

```
$ vault write secret/application foo=bar baz=bam
```

#### CredHub服务器

将CredHub用作后端时，可以通过将配置放在`/application/`中或将其放在应用程序的`default`配置文件中来与所有应用程序共享配置。例如，如果您运行以下CredHub命令，则使用配置服务器的所有应用程序将具有对它们可用的属性`shared.color1`和`shared.color2`：

```
credhub set --name "/application/profile/master/shared" --type=json
value: {"shared.color1": "blue", "shared.color": "red"}
credhub set --name "/my-app/default/master/more-shared" --type=json
value: {"shared.word1": "hello", "shared.word2": "world"}
```

### 5.1.7 JDBC后端

Spring Cloud Config服务器支持JDBC（关系数据库）作为配置属性的后端。您可以通过向类路径中添加`spring-jdbc`并使用`jdbc`配置文件或添加类型为`JdbcEnvironmentRepository`的bean来启用此功能。如果您在类路径上包括正确的依赖项（有关更多详细信息，请参见用户指南），Spring Boot将配置数据源。

数据库需要有一个名为`PROPERTIES`的表，该表具有名为`APPLICATION`，`PROFILE`和`LABEL`的列（通常具有`Environment`的含义），以及`KEY`和`VALUE`，用于`Properties`样式的键和值对。Java中所有字段的类型均为String，因此您可以根据需要将它们设置为`VARCHAR`。Property值的行为与来自名为`{application}-{profile}.properties`的Spring Boot属性文件的值的行为相同，包括所有加密和解密，它们将用作后处理步骤（也就是说，在存储库中直接执行）。

### 5.1.8 CredHub后端

Spring Cloud Config服务器支持[CredHub](https://docs.cloudfoundry.org/credhub)作为配置属性的后端。您可以通过向[Spring CredHub](https://spring.io/projects/spring-credhub)添加依赖项来启用此功能。

**pom.xml。** 

```
<dependencies>
	<dependency>
		<groupId>org.springframework.credhub</groupId>
		<artifactId>spring-credhub-starter</artifactId>
	</dependency>
</dependencies>
```



以下配置使用双向TLS访问CredHub：

```
spring:
  profiles:
    active: credhub
  cloud:
    config:
      server:
        credhub:
          url: https://credhub:8844
```

属性应存储为JSON，例如：

```
credhub set --name "/demo-app/default/master/toggles" --type=json
value: {"toggle.button": "blue", "toggle.link": "red"}
credhub set --name "/demo-app/default/master/abs" --type=json
value: {"marketing.enabled": true, "external.enabled": false}
```

名称为`spring.cloud.config.name=demo-app`的所有客户端应用程序将具有以下属性：

```
{
    toggle.button: "blue",
    toggle.link: "red",
    marketing.enabled: true,
    external.enabled: false
}
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 如果未指定配置文件，将使用`default`，而未指定标签时，将使用`master`作为默认值。注意：添加到`application`的值将由所有应用程序共享。 |

#### OAuth 2.0

您可以使用[UAA](https://docs.cloudfoundry.org/concepts/architecture/uaa.html)作为提供程序通过[OAuth 2.0](https://oauth.net/2/)进行身份验证。

**pom.xml。** 

```
<dependencies>
	<dependency>
		<groupId>org.springframework.security</groupId>
		<artifactId>spring-security-config</artifactId>
	</dependency>
	<dependency>
		<groupId>org.springframework.security</groupId>
		<artifactId>spring-security-oauth2-client</artifactId>
	</dependency>
</dependencies>
```



以下配置使用OAuth 2.0和UAA访问CredHub：

```
spring:
  profiles:
    active: credhub
  cloud:
    config:
      server:
        credhub:
          url: https://credhub:8844
          oauth2:
            registration-id: credhub-client
  security:
    oauth2:
      client:
        registration:
          credhub-client:
            provider: uaa
            client-id: credhub_config_server
            client-secret: asecret
            authorization-grant-type: client_credentials
        provider:
          uaa:
            token-uri: https://uaa:8443/oauth/token
```

| ![[注意]](/assets/images/springcloud/note.png)                  |
| ----------------------------------------- |
| 使用的UAA客户ID的范围应为`credhub.read`。 |

### 5.1.9复合环境Repositories

在某些情况下，您可能希望从多个环境存储库中提取配置数据。为此，您可以在配置服务器的应用程序属性或YAML文件中启用`composite`配置文件。例如，如果要从Subversion存储库以及两个Git存储库中提取配置数据，则可以为配置服务器设置以下属性：

```
spring:
  profiles:
    active: composite
  cloud:
    config:
      server:
        composite:
        -
          type: svn
          uri: file:///path/to/svn/repo
        -
          type: git
          uri: file:///path/to/rex/git/repo
        -
          type: git
          uri: file:///path/to/walter/git/repo
```

使用此配置，优先级由`composite`键下的存储库列出顺序确定。在上面的示例中，首先列出了Subversion存储库，因此在Subversion存储库中找到的值将覆盖在一个Git存储库中为同一属性找到的值。在`rex` Git存储库中找到的值将在`walter` Git存储库中为相同属性找到的值之前使用。

如果只想从每种不同类型的存储库中提取配置数据，则可以在配置服务器的应用程序属性或YAML文件中启用相应的配置文件，而不启用`composite`配置文件。例如，如果要从单个Git存储库和单个HashiCorp Vault服务器中提取配置数据，则可以为配置服务器设置以下属性：

```
spring:
  profiles:
    active: git, vault
  cloud:
    config:
      server:
        git:
          uri: file:///path/to/git/repo
          order: 2
        vault:
          host: 127.0.0.1
          port: 8200
          order: 1
```

使用此配置，可以通过`order`属性确定优先级。您可以使用`order`属性为所有存储库指定优先级顺序。`order`属性的数值越低，优先级越高。存储库的优先级顺序有助于解决包含相同属性值的存储库之间的任何潜在冲突。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 如果您的复合环境包括上一个示例中的Vault服务器，则在对配置服务器的每个请求中都必须包含Vault令牌。请参阅[Vault后端](https://www.springcloud.cc/spring-cloud-greenwich.html#vault-backend)。 |

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 从环境存储库中检索值时，任何类型的故障都会导致整个组合环境的故障。 |

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 使用复合环境时，所有存储库都包含相同的标签很重要。如果您的环境与前面的示例中的环境类似，并且您请求带有`master`标签的配置数据，但是Subversion存储库不包含名为`master`的分支，则整个请求将失败。 |

#### 定制复合环境Repositories

除了使用Spring Cloud中的一个环境存储库之外，您还可以提供自己的`EnvironmentRepository` bean作为复合环境的一部分。为此，您的bean必须实现`EnvironmentRepository`接口。如果要在复合环境中控制自定义`EnvironmentRepository`的优先级，则还应该实现`Ordered`接口并覆盖`getOrdered`方法。如果未实现`Ordered`接口，则`EnvironmentRepository`的优先级最低。

### 5.1.10 Property覆盖

Config Server具有“ 替代 ”功能，使操作员可以为所有应用程序提供配置属性。应用程序使用常规的Spring Boot钩子不会意外更改重写的属性。要声明覆盖，请将名称/值对的映射添加到`spring.cloud.config.server.overrides`，如以下示例所示：

```
spring:
  cloud:
    config:
      server:
        overrides:
          foo: bar
```

前面的示例使作为配置客户端的所有应用程序读取`foo=bar`，而与它们自己的配置无关。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 配置系统不能强制应用程序以任何特定方式使用配置数据。因此，覆盖无法执行。但是，它们确实为Spring Cloud Config客户端提供了有用的默认行为。 |

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 通常，可以使用反斜杠（`\`）来转义`$`或`{`，以逃避（并在客户端上解析）具有`${}`的Spring环境占位符。例如，除非应用程序提供自己的`app.foo`，否则`\${app.foo:bar}`解析为`bar`。 |

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 在YAML中，您不需要转义反斜杠本身。但是，在属性文件中，在服务器上配置替代时，确实需要转义反斜杠。 |

您可以通过在远程存储库中设置`spring.cloud.config.overrideNone=true`标志（默认为false），使客户端中所有替代的优先级更像默认值，让应用程序在环境变量或系统属性中提供自己的值。

## 5.2健康指标

Config Server带有运行状况指示器，用于检查配置的`EnvironmentRepository`是否正常工作。默认情况下，它会向`EnvironmentRepository`询问名为`app`的应用程序，`default`配置文件以及`EnvironmentRepository`实现提供的默认标签。

您可以配置运行状况指示器以检查更多应用程序以及自定义配置文件和自定义标签，如以下示例所示：

```
spring:
  cloud:
    config:
      server:
        health:
          repositories:
            myservice:
              label: mylabel
            myservice-dev:
              name: myservice
              profiles: development
```

您可以通过设置`spring.cloud.config.server.health.enabled=false`禁用运行状况指示器。

## 5.3安全性

您可以用对您有意义的任何方式来保护Config Server（从物理网络安全到OAuth2承载令牌），因为Spring Security和Spring Boot为许多安全措施提供了支持。

要使用默认的Spring Boot配置的HTTP基本安全性，请在类路径上包含Spring Security（例如，通过`spring-boot-starter-security`）。缺省值为`user`用户名和随机生成的密码。随机密码在实践中没有用，因此我们建议您配置密码（通过设置`spring.security.user.password`）并对其进行加密（有关如何操作的说明，请参见下文）。

## 5.4加密和解密

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 要使用加密和解密功能，您需要在JVM中安装完整功能的JCE（默认情况下不包括）。您可以从Oracle 下载“ Java密码学扩展（JCE）无限强度辖区策略文件 ”并按照安装说明进行操作（本质上，您需要用下载的JRE lib / security目录替换这两个策略文件）。 |      |

如果远程属性源包含加密的内容（值以`{cipher}`开头），则在通过HTTP发送给客户端之前，将对它们进行解密。此设置的主要优点是，当属性值处于“ 静止 ”状态时（例如，在git存储库中），不需要使用纯文本格式。如果无法解密某个值，则将其从属性源中删除，并使用相同的密钥添加一个附加属性，但附加前缀为`invalid`和一个表示“ 不适用 ”的值（通常为`<n/a>`）。这很大程度上是为了防止将密文用作密码并意外泄漏。

如果为配置客户端应用程序设置了远程配置存储库，则它可能包含与以下内容类似的`application.yml`：

**application.yml。** 

```
spring:
  datasource:
    username: dbuser
    password: '{cipher}FKSAJDFGYOS8F7GLHAKERGFHLSAJ'
```



.properties文件中的加密值不能用引号引起来。否则，该值不会解密。以下示例显示了有效的值：

**application.properties。** 

```
spring.datasource.username: dbuser
spring.datasource.password: {cipher}FKSAJDFGYOS8F7GLHAKERGFHLSAJ
```



您可以安全地将此纯文本推送到共享的git存储库，并且秘密密码仍然受到保护。

服务器还公开`/encrypt`和`/decrypt`端点（假设这些端点是安全的，并且只能由授权代理访问）。如果您编辑远程配置文件，则可以使用Config Server通过POST到`/encrypt`端点来加密值，如以下示例所示：

```
$ curl localhost:8888/encrypt -d mysecret
682bc583f4641835fa2db009355293665d2647dade3375c0ee201de2a49f7bda
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 如果您加密的值中包含需要URL编码的字符，则应对`curl`使用`--data-urlencode`选项以确保它们正确编码。 |

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 确保不要在加密值中包含任何curl命令统计信息。将值输出到文件可以帮助避免此问题。 |

也可以通过`/decrypt`使用反向操作（前提是服务器配置了对称密钥或完整密钥对），如以下示例所示：

```
$ curl localhost:8888/decrypt -d 682bc583f4641835fa2db009355293665d2647dade3375c0ee201de2a49f7bda
mysecret
```

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 如果使用curl进行测试，请使用`--data-urlencode`（而不是`-d`）或设置显式的`Content-Type: text/plain`以确保在有特殊字符时，curl可以正确编码数据（“ +”特别棘手）。 |

在将加密的值放入YAML或属性文件之前，以及将其提交并将其推送到远程（可能不安全）存储之前，请获取加密的值并添加`{cipher}`前缀。

`/encrypt`和`/decrypt`端点也都接受`/*/{application}/{profiles}`形式的路径，当客户端调用主应用程序时，可用于按应用程序（名称）和配置文件控制密码。环境资源。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 要以这种精细的方式控制密码，您还必须提供类型为`TextEncryptorLocator`的`@Bean`，以按名称和配置文件创建不同的加密器。默认情况下不提供（所有加密使用相同的密钥）。 |

`spring`命令行客户端（安装了Spring Cloud CLI扩展名）也可以用于加密和解密，如以下示例所示：

```
$ spring encrypt mysecret --key foo
682bc583f4641835fa2db009355293665d2647dade3375c0ee201de2a49f7bda
$ spring decrypt --key foo 682bc583f4641835fa2db009355293665d2647dade3375c0ee201de2a49f7bda
mysecret
```

要使用文件中的密钥（例如用于加密的RSA公钥），请在密钥值前添加“ @”并提供文件路径，如以下示例所示：

```
$ spring encrypt mysecret --key @${HOME}/.ssh/id_rsa.pub
AQAjPgt3eFZQXwt8tsHAVv/QHiY5sI2dRcR+...
```

| ![[注意]](/assets/images/springcloud/note.png)                  |
| ----------------------------------------- |
| `--key`参数是强制性的（尽管前缀为`--`）。 |

## 5.5密钥管理

Config Server可以使用对称（共享）密钥或非对称密钥（RSA密钥对）。非对称选择在安全性方面优越，但使用对称密钥通常更方便，因为它是在`bootstrap.properties`中配置的单个属性值。

要配置对称密钥，您需要将`encrypt.key`设置为秘密字符串（或使用`ENCRYPT_KEY`环境变量将其保留在纯文本配置文件之外）。

| ![[注意]](/assets/images/springcloud/note.png)                |
| --------------------------------------- |
| 您无法使用`encrypt.key`配置非对称密钥。 |

要配置非对称密钥，请使用密钥库（例如，由JDK附带的`keytool`实用程序创建的密钥库）。密钥库属性为`encrypt.keyStore.*`，其中`*`等于

| Property                    | 描述                                               |
| --------------------------- | -------------------------------------------------- |
| `encrypt.keyStore.location` | Contains a `Resource` location                     |
| `encrypt.keyStore.password` | Holds the password that unlocks the keystore       |
| `encrypt.keyStore.alias`    | Identifies which key in the store to use           |
| `encrypt.keyStore.type`     | The type of KeyStore to create. Defaults to `jks`. |

加密是使用公钥完成的，解密需要私钥。因此，原则上，如果只想加密（并准备用私钥在本地解密值），则只能在服务器中配置公钥。实际上，您可能不希望在本地进行解密，因为它会将密钥管理过程分布在所有客户端上，而不是将其集中在服务器上。另一方面，如果您的配置服务器相对不安全并且只有少数客户端需要加密的属性，那么它可能是一个有用的选项。

## 5.6创建密钥库进行测试

要创建用于测试的密钥库，可以使用类似于以下内容的命令：

```
$ keytool -genkeypair -alias mytestkey -keyalg RSA \
  -dname "CN=Web Server,OU=Unit,O=Organization,L=City,S=State,C=US" \
  -keypass changeme -keystore server.jks -storepass letmein
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 使用JDK 11或更高版本时，使用上述命令时可能会收到以下警告。在这种情况下，您可能需要确保`keypass`和`storepass`值匹配。 |

```
Warning:  Different store and key passwords not supported for PKCS12 KeyStores. Ignoring user-specified -keypass value.
```

将`server.jks`文件放入类路径中（例如），然后在您的`bootstrap.yml`中，为Config Server创建以下设置：

```
encrypt:
  keyStore:
    location: classpath:/server.jks
    password: letmein
    alias: mytestkey
    secret: changeme
```

## 5.7使用多个按键和按键旋转

除了加密属性值中的`{cipher}`前缀外，Config Server在（Base64编码的）密文开始之前查找零个或多个`{name:value}`前缀。密钥被传递到`TextEncryptorLocator`，后者可以执行为密码找到`TextEncryptor`所需的任何逻辑。如果已配置密钥库（`encrypt.keystore.location`），则默认定位器将查找具有`key`前缀提供的别名的密钥，其密文类似于以下内容：

```
foo:
  bar: `{cipher}{key:testkey}...`
```

定位器查找名为“ testkey”的键。也可以通过在前缀中使用`{secret:…}`值来提供机密。但是，如果未提供，则默认为使用密钥库密码（这是在构建密钥库且未指定密钥时得到的密码）。如果确实提供了机密，则还应该使用自定义`SecretLocator`对机密进行加密。

当密钥仅用于加密几个字节的配置数据时（也就是说，它们未在其他地方使用），从密码的角度讲，几乎不需要旋转密钥。但是，您有时可能需要更改密钥（例如，在发生安全漏洞时）。在这种情况下，所有客户端都需要更改其源配置文件（例如，在git中），并在所有密码中使用新的`{key:…}`前缀。请注意，客户端需要首先检查Config Server密钥库中的密钥别名是否可用。

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 如果要让Config Server处理所有加密以及解密，则还可以将`{name:value}`前缀添加为发布到`/encrypt`端点的纯文本。 |

## 5.8服务加密的Properties

有时，您希望客户端在本地解密配置，而不是在服务器中进行解密。在这种情况下，如果提供`encrypt.*`配置来查找密钥，则仍然可以拥有`/encrypt`和`/decrypt`端点，但是需要通过放置{10 /来显式关闭对传出属性的解密。 `bootstrap.[yml|properties]`中的}。如果您不关心端点，则在不配置键或启用标志的情况下都可以使用。

## 6.提供其他格式

来自环境端点的默认JSON格式非常适合Spring应用程序使用，因为它直接映射到`Environment`抽象。如果愿意，可以通过在资源路径中添加后缀（“ .yml”，“。yaml”或“ .properties”）来使用与YAML或Java属性相同的数据。对于不关心JSON终结点的结构或它们提供的额外元数据的应用程序来说，这可能很有用（例如，不使用Spring的应用程序可能会受益于此方法的简单性）。

YAML和属性表示形式还有一个附加标志（提供为名为`resolvePlaceholders`的布尔查询参数），用于指示应在输出中解析源文档中的占位符（以标准Spring `${…}`格式）在渲染之前，如果可能的话。对于不了解Spring占位符约定的消费者来说，这是一个有用的功能。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 使用YAML或属性格式存在一些限制，主要是与元数据的丢失有关。例如，JSON被构造为属性源的有序列表，其名称与该源相关。即使值的来源有多个来源，YAML和属性形式也会合并到一个映射中，并且原始来源文件的名称也会丢失。同样，YAML表示也不一定是后备存储库中YAML源的忠实表示。它由一系列平面属性来源构成，并且必须对密钥的形式进行假设。 |

## 7.提供纯文本

除了使用`Environment`抽象（或YAML或属性格式的抽象表示之一）之外，您的应用程序可能需要根据其环境量身定制的通用纯文本配置文件。Config Server通过位于`/{application}/{profile}/{label}/{path}`的附加终结点提供了这些终结点，其中`application`，`profile`和`label`与常规环境终结点具有相同的含义，但是`path`是指向以下环境的路径文件名（例如`log.xml`）。该端点的源文件与环境端点的定位方式相同。属性和YAML文件使用相同的搜索路径。但是，不是汇总所有匹配资源，而是仅返回第一个要匹配的资源。

找到资源后，可通过对提供的应用程序名称，配置文件和标签使用有效的`Environment`来解析常规格式（`${…}`）的占位符。通过这种方式，资源端点与环境端点紧密集成在一起。考虑以下用于GIT或SVN存储库的示例：

```
application.yml
nginx.conf
```

`nginx.conf`如下所示：

```
server {
    listen              80;
    server_name         ${nginx.server.name};
}
```

和`application.yml`像这样：

```
nginx:
  server:
    name: example.com
---
spring:
  profiles: development
nginx:
  server:
    name: develop.com
```

`/foo/default/master/nginx.conf`资源可能如下：

```
server {
    listen              80;
    server_name         example.com;
}
```

和`/foo/development/master/nginx.conf`像这样：

```
server {
    listen              80;
    server_name         develop.com;
}
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 与用于环境配置的源文件一样，`profile`用于解析文件名。因此，如果要使用特定于配置文件的文件，可以通过名为`logback-development.xml`（优先于`logback.xml`）的文件来解析`/*/development/*/logback.xml`。 |

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 如果不想提供`label`并让服务器使用默认标签，则可以提供`useDefaultLabel`请求参数。因此，`default`配置文件的前面的示例可以是`/foo/default/nginx.conf?useDefaultLabel`。 |

## 8.嵌入配置服务器

Config Server最好作为独立应用程序运行。但是，如果需要，可以将其嵌入另一个应用程序。为此，请使用`@EnableConfigServer`批注。在这种情况下，名为`spring.cloud.config.server.bootstrap`的可选属性会很有用。它是一个标志，用于指示服务器是否应从其自己的远程存储库中进行配置。默认情况下，该标志为关闭状态，因为它会延迟启动。但是，当嵌入到另一个应用程序中时，以与其他任何应用程序相同的方式进行初始化是有意义的。将`spring.cloud.config.server.bootstrap`设置为`true`时，还必须使用[复合环境存储库配置](https://www.springcloud.cc/spring-cloud-greenwich.html#composite-environment-repositories)。例如

```yaml
spring:
  application:
    name: configserver
  profiles:
    active: composite
  cloud:
    config:
      server:
        composite:
          - type: native
            search-locations: ${HOME}/Desktop/config
        bootstrap: true
```



| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 如果使用引导标志，则配置服务器需要在`bootstrap.yml`中配置其名称和存储库URI。 |

要更改服务器端点的位置，可以（可选）设置`spring.cloud.config.server.prefix`（例如，`/config`）以在前缀下提供资源。前缀应以`/`开头，但不能以`/`结尾。它应用于Config Server中的`@RequestMappings`（即，在Spring Boot `server.servletPath`和`server.contextPath`前缀之下）。

如果要直接从后端存储库（而不是从配置服务器）读取应用程序的配置，则基本上需要没有端点的嵌入式配置服务器。您可以不使用`@EnableConfigServer`注释（设置为`spring.cloud.config.server.bootstrap=true`）来完全关闭端点。

## 9.推送通知和Spring Cloud Bus

许多源代码存储库提供程序（例如Github，Gitlab，Gitea，Gitee，Gogs或Bitbucket）都通过Webhook通知您存储库中的更改。您可以通过提供者的用户界面将Webhook配置为URL和您感兴趣的一组事件。例如，[Github](https://developer.github.com/v3/activity/events/types/#pushevent)使用POST到Webhook，其JSON主体包含提交列表和设置为`push`的标头（`X-Github-Event`）。如果在`spring-cloud-config-monitor`库上添加依赖项并在Config Server中激活Spring Cloud Bus，则会启用`/monitor`端点。

激活Webhook后，配置服务器将发送一个针对它认为可能已更改的应用程序的`RefreshRemoteApplicationEvent`。变化检测可以被策略化。但是，默认情况下，它会查找与应用程序名称匹配的文件中的更改（例如，`foo.properties`面向`foo`应用程序，而`application.properties`面向所有应用程序）。当您要覆盖此行为时，使用的策略是`PropertyPathNotificationExtractor`，该策略接受请求标头和正文作为参数，并返回已更改文件路径的列表。

默认配置可以与Github，Gitlab，Gitea，Gitee，Gogs或Bitbucket一起使用。除了来自Github，Gitlab，Gitee或Bitbucket的JSON通知之外，您还可以通过使用`path={application}`模式的形式编码的正文参数POST到`/monitor`来触发更改通知。这样做会向匹配`{application}`模式（可以包含通配符）的应用程序广播。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 仅当在配置服务器和客户端应用程序中都激活了`spring-cloud-bus`时，才发送`RefreshRemoteApplicationEvent`。 |

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 默认配置还检测本地git存储库中的文件系统更改。在这种情况下，不使用Webhook。但是，一旦您编辑配置文件，就会广播刷新。 |

## 10. Spring Cloud Config客户

Spring Boot应用程序可以立即利用Spring Config Server（或应用程序开发人员提供的其他外部属性源）。它还选择了与`Environment`更改事件相关的一些其他有用功能。

## 10.1配置第一个引导程序

在类路径上具有Spring Cloud Config客户端的任何应用程序的默认行为如下：配置客户端启动时，它将绑定到配置服务器（通过`spring.cloud.config.uri`引导程序配置属性）并初始化Spring `Environment`（带有远程资源来源）。

此行为的最终结果是，所有要使用Config Server的客户端应用程序都需要一个`bootstrap.yml`（或环境变量），其服务器地址设置为`spring.cloud.config.uri`（默认为“ http：// localhost” ：8888“）。

## 10.2发现第一引导程序

如果使用`DiscoveryClient`实现，例如Spring Cloud Netflix和Eureka Service Discovery或Spring Cloud Consul，则可以让Config Server向Discovery Service注册。但是，在默认的“ Config First ”模式下，客户端无法利用注册。

如果您更喜欢使用`DiscoveryClient`来查找配置服务器，则可以通过设置`spring.cloud.config.discovery.enabled=true`（默认值为`false`）来进行。这样做的最终结果是，所有客户端应用程序都需要具有适当发现配置的`bootstrap.yml`（或环境变量）。例如，对于Spring Cloud Netflix，您需要定义Eureka服务器地址（例如，在`eureka.client.serviceUrl.defaultZone`中）。使用此选项的价格是启动时需要进行额外的网络往返，以查找服务注册。好处是，只要发现服务是固定点，配置服务器就可以更改其坐标。默认服务ID是`configserver`，但是您可以通过设置`spring.cloud.config.discovery.serviceId`在客户端上（以及在服务器上，以一种通常的服务方式，例如通过设置`spring.application.name`）来更改该ID。

发现客户端实现均支持某种元数据映射（例如，对于Eureka，我们有`eureka.instance.metadataMap`）。Config Server的某些其他属性可能需要在其服务注册元数据中进行配置，以便客户端可以正确连接。如果Config Server受HTTP Basic保护，则可以将凭据配置为`user`和`password`。另外，如果Config Server具有上下文路径，则可以设置`configPath`。例如，以下YAML文件适用于作为Eureka客户端的Config Server：

**bootstrap.yml。** 

```yaml
eureka:
  instance:
    ...
    metadataMap:
      user: osufhalskjrtl
      password: lviuhlszvaorhvlo5847
      configPath: /config
```



## 10.3配置客户端快速失败

在某些情况下，如果服务无法连接到Config Server，您可能希望启动失败。如果这是期望的行为，请设置引导程序配置属性`spring.cloud.config.fail-fast=true`，以使客户端因Exception而停止。

## 10.4配置客户端重试

如果您希望配置服务器在您的应用程序启动时偶尔会不可用，则可以使其在失败后继续尝试。首先，您需要设置`spring.cloud.config.fail-fast=true`。然后，您需要将`spring-retry`和`spring-boot-starter-aop`添加到类路径中。默认行为是重试六次，初始回退间隔为1000ms，随后的回退的指数乘数为1.1。您可以通过设置`spring.cloud.config.retry.*`配置属性来配置这些属性（和其他属性）。

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 要完全控制重试行为，请添加ID为`configServerRetryInterceptor`的`@Bean`类型的`@Bean`。Spring重试有一个`RetryInterceptorBuilder`，它支持创建一个。 |

## 10.5查找远程配置资源

Config Service提供来自`/{application}/{profile}/{label}`的属性源，其中客户端应用程序中的默认绑定如下：

- “名称” = `${spring.application.name}`
- “个人资料” = `${spring.profiles.active}`（实际上是`Environment.getActiveProfiles()`）
- “ label” =“大师”

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 设置属性`${spring.application.name}`时，请勿在您的应用名称前加上保留字`application-`，以防止解析正确的属性源时出现问题。 |

您可以通过设置`spring.cloud.config.*`（其中`*`为`name`，`profile`或`label`）来覆盖所有参数。`label`对于回滚到以前的配置版本很有用。使用默认的Config Server实现，它可以是git标签，分支名称或提交ID。标签也可以以逗号分隔的列表形式提供。在这种情况下，列表中的项目将一一尝试直到成功为止。在要素分支上工作时，此行为可能很有用。例如，您可能想使配置标签与分支对齐，但使其成为可选（在这种情况下，请使用`spring.cloud.config.label=myfeature,develop`）。

## 10.6为配置服务器指定多个地址

为确保在部署了Config Server的多个实例时并希望不时有一个或多个实例不可用时的高可用性，可以指定多个URL（作为`spring.cloud.config.uri`属性下的逗号分隔列表）或您的所有实例都在服务注册表中注册，例如Eureka（如果使用Discovery-First Bootstrap模式）。请注意，只有在未运行Config Server时（即，应用程序退出时）或发生连接超时时，这样做才能确保高可用性。例如，如果Config Server返回500（内部服务器错误）响应，或者Config Client从Config Server收到401（由于凭据错误或其他原因），则Config Client不会尝试从其他URL提取属性。此类错误表示用户问题，而不是可用性问题。

如果您在Config Server上使用HTTP基本安全性，则仅当将凭据嵌入在`spring.cloud.config.uri`属性下指定的每个URL中时，当前才有可能支持per-Config Server身份验证凭据。如果使用任何其他类型的安全性机制，则（当前）不能支持每台配置服务器的身份验证和授权。

## 10.7配置超时

如果要配置超时阈值：

- 可以使用属性`spring.cloud.config.request-read-timeout`配置读取超时。
- 可以使用属性`spring.cloud.config.request-connect-timeout`配置连接超时。

## 10.8安全性

如果在服务器上使用HTTP基本安全性，则客户端需要知道密码（如果不是默认用户名，则需要用户名）。您可以通过配置服务器URI或通过单独的用户名和密码属性来指定用户名和密码，如以下示例所示：

**bootstrap.yml。** 

```yaml
spring:
  cloud:
    config:
     uri: https://user:secret@myconfig.mycompany.com
```



以下示例显示了传递相同信息的另一种方法：

**bootstrap.yml。** 

```yaml
spring:
  cloud:
    config:
     uri: https://myconfig.mycompany.com
     username: user
     password: secret
```



`spring.cloud.config.password`和`spring.cloud.config.username`值会覆盖URI中提供的任何内容。

如果您在Cloud Foundry上部署应用程序，则提供密码的最佳方法是通过服务凭据（例如URI中的密码），因为它不需要在配置文件中。以下示例在本地工作，并且适用于名为`configserver`的Cloud Foundry上的用户提供的服务：

**bootstrap.yml。** 

```yaml
spring:
  cloud:
    config:
     uri: ${vcap.services.configserver.credentials.uri:http://user:password@localhost:8888}
```



如果您使用另一种形式的安全性，则可能需要向`ConfigServicePropertySourceLocator`提供一个`RestTemplate`（例如，通过在引导上下文中进行抓取并将其注入）。`ConfigServicePropertySourceLocator` [提供一个{848](https://www.springcloud.cc/spring-cloud-greenwich.html#custom-rest-template) /}（例如，通过在引导上下文中进行抓取并将其注入）。

### 10.8.1健康指标

Config Client提供Spring Boot运行状况指示器，该指示器尝试从Config Server加载配置。可以通过设置`health.config.enabled=false`禁用运行状况指示器。由于性能原因，响应也被缓存。默认的生存时间为5分钟。要更改该值，请设置`health.config.time-to-live`属性（以毫秒为单位）。

### 10.8.2提供自定义的RestTemplate

在某些情况下，您可能需要自定义来自客户端对配置服务器的请求。通常，这样做涉及传递特殊的`Authorization`标头以验证对服务器的请求。提供自定义`RestTemplate`：

1. 创建一个新的配置bean，实现为`PropertySourceLocator`，如以下示例所示：

**CustomConfigServiceBootstrapConfiguration.java。** 

```java
@Configuration
public class CustomConfigServiceBootstrapConfiguration {
    @Bean
    public ConfigServicePropertySourceLocator configServicePropertySourceLocator() {
        ConfigClientProperties clientProperties = configClientProperties();
       ConfigServicePropertySourceLocator configServicePropertySourceLocator =  new ConfigServicePropertySourceLocator(clientProperties);
        configServicePropertySourceLocator.setRestTemplate(customRestTemplate(clientProperties));
        return configServicePropertySourceLocator;
    }
}
```



1. 在`resources/META-INF`中，创建一个名为`spring.factories`的文件并指定您的自定义配置，如以下示例所示：

**spring.factories.**  

```
org.springframework.cloud.bootstrap.BootstrapConfiguration = com.my.config.client.CustomConfigServiceBootstrapConfiguration
```



### 10.8.3 Vault

当使用Vault作为配置服务器的后端时，客户端需要为服务器提供令牌以从Vault中检索值。可以通过在`bootstrap.yml`中设置`spring.cloud.config.token`在客户端中提供此令牌，如以下示例所示：

**bootstrap.yml。** 

```
spring:
  cloud:
    config:
      token: YourVaultToken
```



## 10.9 Vault中的嵌套键

Vault支持将键嵌套在Vault中存储的值中的功能，如以下示例所示：

```
echo -n '{"appA": {"secret": "appAsecret"}, "bar": "baz"}' | vault write secret/myapp -
```

此命令将JSON对象写入您的Vault。要访问Spring中的这些值，您将使用传统的dot（`.`）批注，如以下示例所示

```
@Value("${appA.secret}")
String name = "World";
```

前面的代码会将`name`变量的值设置为`appAsecret`。

# 第三部分 Spring Cloud Netflix

**Greenwich SR5**

该项目通过自动配置并绑定到Spring环境和其他Spring编程模型习惯用法，为Spring Boot应用提供了Netflix OSS集成。使用一些简单的批注，您可以快速启用和配置应用程序内部的通用模式，并使用经过测试的Netflix组件构建大型分布式系统。提供的模式包括服务发现（Eureka），断路器（Hystrix），智能路由（Zuul）和客户端负载平衡（Ribbon）。

## 11.服务发现：Eureka个客户端

服务发现是基于微服务的体系结构的主要宗旨之一。尝试手动配置每个客户端或某种形式的约定可能很困难并且很脆弱。Eureka是Netflix Service Discovery服务器和客户端。可以将服务器配置和部署为高可用性，每个服务器将有关已注册服务的状态复制到其他服务器。

## 11.1如何包括Eureka客户

要将Eureka客户端包括在您的项目中，请使用启动器，其组ID为`org.springframework.cloud`，工件ID为`spring-cloud-starter-netflix-eureka-client`。有关使用当前Spring Cloud版本Train设置构建系统的详细信息，请参见[Spring Cloud项目页面](https://projects.spring.io/spring-cloud/)。

## 11.2向Eureka注册

当客户端向Eureka注册时，它会提供有关其自身的元数据-例如主机，端口，运行状况指示器URL，主页和其他详细信息。Eureka从属于服务的每个实例接收心跳消息。如果心跳在可配置的时间表上进行故障转移，则通常会将实例从注册表中删除。

以下示例显示了最小的Eureka客户端应用程序：

```
@SpringBootApplication
@RestController
public class Application {

    @RequestMapping("/")
    public String home() {
        return "Hello world";
    }

    public static void main(String[] args) {
        new SpringApplicationBuilder(Application.class).web(true).run(args);
    }

}
```

请注意，前面的示例显示了普通的[Spring Boot](https://projects.spring.io/spring-boot/)应用程序。通过在类路径上使用`spring-cloud-starter-netflix-eureka-client`，您的应用程序将自动在Eureka服务器中注册。如下例所示，需要进行配置才能找到Eureka服务器：

**application.yml。** 

```
eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
```



在前面的示例中，`defaultZone`是一个魔术字符串后备值，它为任何不表达首选项的客户端提供服务URL（换句话说，这是一个有用的默认值）。

| ![[警告]](/assets/images/springcloud/warning.png)                                  |
| ------------------------------------------------------------ |
| `defaultZone`属性区分大小写，并且需要使用驼峰式大小写，因为`serviceUrl`属性是`Map<String, String>`。因此，`defaultZone`属性不遵循`default-zone`的常规Spring Boot蛇形惯例。 |

默认应用程序名称（即服务ID），虚拟主机和非安全端口（从`Environment`获取）分别为`${spring.application.name}`，`${spring.application.name}`和`${server.port}`。

在类路径上具有`spring-cloud-starter-netflix-eureka-client`可使应用程序同时进入Eureka “ 实例 ”（即，它自己注册）和“ 客户端 ”（它可以查询注册表以定位其他服务）。实例行为由`eureka.instance.*`配置键驱动，但是如果确保您的应用程序具有`spring.application.name`的值（这是Eureka服务ID或VIP的默认值），则默认值很好。

有关[可](https://github.com/spring-cloud/spring-cloud-netflix/tree/master/spring-cloud-netflix-eureka-client/src/main/java/org/springframework/cloud/netflix/eureka/EurekaInstanceConfigBean.java)配置选项的更多详细信息，请参见[EurekaInstanceConfigBean](https://github.com/spring-cloud/spring-cloud-netflix/tree/master/spring-cloud-netflix-eureka-client/src/main/java/org/springframework/cloud/netflix/eureka/EurekaInstanceConfigBean.java)和[EurekaClientConfigBean](https://github.com/spring-cloud/spring-cloud-netflix/tree/master/spring-cloud-netflix-eureka-client/src/main/java/org/springframework/cloud/netflix/eureka/EurekaClientConfigBean.java)。

要禁用Eureka Discovery Client，可以将`eureka.client.enabled`设置为`false`。当`spring.cloud.discovery.enabled`设置为`false`时，Eureka Discovery Client也将被禁用。

## 11.3通过Eureka服务器进行身份验证

如果其中一个`eureka.client.serviceUrl.defaultZone` URL内嵌了凭据，则HTTP基本身份验证会自动添加到您的eureka客户端（卷曲样式，如下：`http://user:password@localhost:8761/eureka`）。对于更复杂的需求，您可以创建类型为`DiscoveryClientOptionalArgs`的`@Bean`并将`ClientFilter`实例注入其中，所有这些实例都应用于从客户端到服务器的调用。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 由于Eureka中的限制，无法支持每服务器的基本身份验证凭据，因此仅使用找到的第一组凭据。 |

## 11.4状态页和运行状况指示器

Eureka实例的状态页和运行状况指示器分别默认为`/info`和`/health`，这是Spring Boot Actuator应用程序中有用端点的默认位置。即使您使用非默认上下文路径或Servlet路径（例如`server.servletPath=/custom`），也需要更改这些内容，即使对于Actuator应用程序也是如此。下面的示例显示两个设置的默认值：

**application.yml。** 

```
eureka:
  instance:
    statusPageUrlPath: ${server.servletPath}/info
    healthCheckUrlPath: ${server.servletPath}/health
```



这些链接显示在客户端使用的元数据中，并在某些情况下用于确定是否将请求发送到您的应用程序，因此，如果请求准确，将很有帮助。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 在Dalston中，还需要在更改该管理上下文路径时设置状态和运行状况检查URL。从Edgware开始就删除了此要求。 |

## 11.5注册安全的应用程序

如果您希望通过HTTPS与您的应用进行联系，则可以在`EurekaInstanceConfig`中设置两个标志：

- `eureka.instance.[nonSecurePortEnabled]=[false]`
- `eureka.instance.[securePortEnabled]=[true]`

这样做会使Eureka发布实例信息，该实例信息显示出对安全通信的明确偏好。对于以这种方式配置的服务，Spring Cloud `DiscoveryClient`始终返回以`https`开头的URI。同样，以这种方式配置服务时，Eureka（本机）实例信息具有安全的运行状况检查URL。

由于Eureka在内部工作的方式，它仍然会为状态和主页发布非安全URL，除非您也明确地覆盖了它们。您可以使用占位符来配置eureka实例URL，如以下示例所示：

**application.yml。** 

```
eureka:
  instance:
    statusPageUrl: https://${eureka.hostname}/info
    healthCheckUrl: https://${eureka.hostname}/health
    homePageUrl: https://${eureka.hostname}/
```



（请注意，`${eureka.hostname}`是本机占位符，仅在Eureka的更高版本中可用。您也可以使用Spring占位符来实现相同的目的，例如，使用`${eureka.instance.hostName}`。）

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 如果您的应用程序在代理后面运行，并且SSL终止在代理中（例如，如果您在Cloud Foundry或其他平台中作为服务运行），则需要确保拦截代理的“ 转发 ”标头并由应用处理。如果嵌入在Spring Boot应用程序中的Tomcat容器具有针对'X-Forwarded-\ *'标头的显式配置，则此操作自动发生。应用程序提供的指向自身的链接错误（错误的主机，端口或协议）表明此配置错误。 |

## 11.6 Eureka的健康检查

默认情况下，Eureka使用客户端心跳来确定客户端是否启动。除非另有说明，否则发现客户端不会根据Spring Boot Actuator传播应用程序的当前运行状况检查状态。因此，在成功注册之后，Eureka始终宣布该应用程序处于“启动”状态。可以通过启用Eureka运行状况检查来更改此行为，这将导致应用程序状态传播到Eureka。结果，所有其他应用程序都不会将流量发送到处于“ UP”状态以外的其他状态的应用程序。以下示例显示如何为客户端启用运行状况检查：

**application.yml。** 

```
eureka:
  client:
    healthcheck:
      enabled: true
```



| ![[警告]](/assets/images/springcloud/warning.png)                                  |
| ------------------------------------------------------------ |
| `eureka.client.healthcheck.enabled=true`仅应在`application.yml`中设置。在`bootstrap.yml`中设置该值会导致不良的副作用，例如在Eureka中以`UNKNOWN`状态注册。 |

如果您需要对运行状况检查进行更多控制，请考虑实施自己的`com.netflix.appinfo.HealthCheckHandler`。

## 11.7 Eureka实例和客户端的元数据

值得花费一些时间来了解Eureka元数据的工作方式，因此您可以在平台上使用有意义的方式来使用它。有用于信息的标准元数据，例如主机名，IP地址，端口号，状态页和运行状况检查。这些都发布在服务注册表中，并由客户端用于以直接方式联系服务。可以将其他元数据添加到`eureka.instance.metadataMap`中的实例注册中，并且可以在远程客户端中访问此元数据。通常，除非使客户端知道元数据的含义，否则其他元数据不会更改客户端的行为。有几种特殊情况，在本文档的后面部分进行介绍，其中Spring Cloud已经为元数据映射分配了含义。

### 11.7.1在Cloud Foundry上使用Eureka

Cloud Foundry具有全局路由器，因此同一应用程序的所有实例都具有相同的主机名（其他具有类似体系结构的PaaS解决方案具有相同的排列）。这不一定是使用Eureka的障碍。但是，如果您使用路由器（建议或什至是强制性的，具体取决于平台的设置方式），则需要显式设置主机名和端口号（安全或不安全），以便它们使用路由器。您可能还希望使用实例元数据，以便可以区分客户端上的实例（例如，在自定义负载平衡器中）。默认情况下，`eureka.instance.instanceId`为`vcap.application.instance_id`，如以下示例所示：

**application.yml。** 

```
eureka:
  instance:
    hostname: ${vcap.application.uris[0]}
    nonSecurePort: 80
```



根据在Cloud Foundry实例中设置安全规则的方式，您可能可以注册并使用主机VM的IP地址进行直接的服务到服务的调用。Pivotal Web服务（[PWS](https://run.pivotal.io/)）尚不提供此功能。

### 11.7.2在AWS上使用Eureka

如果计划将应用程序部署到AWS云，则必须将Eureka实例配置为可感知AWS。您可以通过如下自定义[EurekaInstanceConfigBean](https://github.com/spring-cloud/spring-cloud-netflix/tree/master/spring-cloud-netflix-eureka-client/src/main/java/org/springframework/cloud/netflix/eureka/EurekaInstanceConfigBean.java)来实现：

```
@Bean
@Profile("!default")
public EurekaInstanceConfigBean eurekaInstanceConfig(InetUtils inetUtils) {
  EurekaInstanceConfigBean b = new EurekaInstanceConfigBean(inetUtils);
  AmazonInfo info = AmazonInfo.Builder.newBuilder().autoBuild("eureka");
  b.setDataCenterInfo(info);
  return b;
}
```

### 11.7.3更改Eureka实例ID

一个普通的Netflix Eureka实例注册的ID等于其主机名（即，每个主机仅提供一项服务）。Spring Cloud Eureka提供了明智的默认值，其定义如下：

```
${spring.cloud.client.hostname}:${spring.application.name}:${spring.application.instance_id:${server.port}}}
```

一个示例是`myhost:myappname:8080`。

通过使用Spring Cloud，可以通过在`eureka.instance.instanceId`中提供唯一标识符来覆盖此值，如以下示例所示：

**application.yml。** 

```
eureka:
  instance:
    instanceId: ${spring.application.name}:${vcap.application.instance_id:${spring.application.instance_id:${random.value}}}
```



通过前面示例中显示的元数据和在本地主机上部署的多个服务实例，在其中插入随机值以使实例唯一。在Cloud Foundry中，`vcap.application.instance_id`是在Spring Boot应用程序中自动填充的，因此不需要随机值。

## 11.8使用EurekaClient

一旦拥有作为发现客户端的应用程序，就可以使用它从[Eureka服务器](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-eureka-server)发现服务实例。一种方法是使用本地`com.netflix.discovery.EurekaClient`（而不是Spring Cloud `DiscoveryClient`），如以下示例所示：

```
@Autowired
private EurekaClient discoveryClient;

public String serviceUrl() {
    InstanceInfo instance = discoveryClient.getNextServerFromEureka("STORES", false);
    return instance.getHomePageUrl();
}
```

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 请勿在`@PostConstruct`方法或`@Scheduled`方法（或可能尚未启动`ApplicationContext`的任何地方）中使用`EurekaClient`。它是通过`SmartLifecycle`（带有`phase=0`）进行初始化的，因此最早可以依靠它的是处于更高阶段的另一个`SmartLifecycle`。 |

### 11.8.1没有Jersey的EurekaClient

默认情况下，EurekaClient使用Jersey进行HTTP通信。如果希望避免来自Jersey的依赖关系，可以将其从依赖关系中排除。Spring Cloud基于Spring `RestTemplate`自动配置传输客户端。以下示例显示Jersey被排除在外：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    <exclusions>
        <exclusion>
            <groupId>com.sun.jersey</groupId>
            <artifactId>jersey-client</artifactId>
        </exclusion>
        <exclusion>
            <groupId>com.sun.jersey</groupId>
            <artifactId>jersey-core</artifactId>
        </exclusion>
        <exclusion>
            <groupId>com.sun.jersey.contribs</groupId>
            <artifactId>jersey-apache-client4</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

## 11.9替代本机Netflix EurekaClient

您无需使用原始Netflix `EurekaClient`。而且，通常在某种包装器后面使用它会更方便。Spring Cloud 通过逻辑Eureka服务标识符（VIP）而非物理URL 支持[Feign](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-feign)（REST客户端生成器）和[Spring `RestTemplate`](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-ribbon)。要使用固定的物理服务器列表配置Ribbon，可以将`<client>.ribbon.listOfServers`设置为以逗号分隔的物理地址（或主机名）列表，其中`<client>`是客户端的ID。

您还可以使用`org.springframework.cloud.client.discovery.DiscoveryClient`，它为发现客户端提供一个简单的API（非Netflix专用），如以下示例所示：

```
@Autowired
private DiscoveryClient discoveryClient;

public String serviceUrl() {
    List<ServiceInstance> list = discoveryClient.getInstances("STORES");
    if (list != null && list.size() > 0 ) {
        return list.get(0).getUri();
    }
    return null;
}
```

## 11.10为什么注册服务这么慢？

成为实例还涉及到注册表的定期心跳（通过客户端的`serviceUrl`），默认持续时间为30秒。直到实例，服务器和客户端在其本地缓存中都具有相同的元数据后，客户端才能发现该服务（因此可能需要3个心跳）。您可以通过设置`eureka.instance.leaseRenewalIntervalInSeconds`来更改周期。将其设置为小于30的值可以加快使客户端连接到其他服务的过程。在生产中，最好使用默认值，因为服务器中的内部计算对租约续订期进行了假设。

## 11.11区域

如果您已将Eureka客户端部署到多个区域，则您可能希望这些客户端在尝试使用其他区域中的服务之前先使用同一区域中的服务。要进行设置，您需要正确配置Eureka客户端。

首先，您需要确保已将Eureka服务器部署到每个区域，并且它们彼此对等。有关 更多信息，请参见[区域和区域](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-eureka-server-zones-and-regions)部分。

接下来，您需要告诉Eureka服务位于哪个区域。您可以使用`metadataMap`属性来做到这一点。例如，如果将`service 1`部署到`zone 1`和`zone 2`上，则需要在`service 1`中设置以下Eureka属性：

**1区服务1**

```
eureka.instance.metadataMap.zone = zone1
eureka.client.preferSameZoneEureka = true
```

**2区服务1**

```
eureka.instance.metadataMap.zone = zone2
eureka.client.preferSameZoneEureka = true
```

## 11.12刷新Eureka个客户端

默认情况下，`EurekaClient` bean是可刷新的，这意味着Eureka客户端属性可以更改和刷新。发生刷新时，客户端将从Eureka服务器中注销，并且可能会在短暂的时间内不提供给定服务的所有实例。消除这种情况的一种方法是禁用刷新Eureka客户端的功能。为此，请设置`eureka.client.refresh.enable=false`。

## 12.服务发现：Eureka服务器

本节介绍如何设置Eureka服务器。

## 12.1如何包括Eureka服务器

要将Eureka服务器包含在您的项目中，请使用启动器，其组ID为`org.springframework.cloud`，工件ID为`spring-cloud-starter-netflix-eureka-server`。有关使用当前Spring Cloud版本Train设置构建系统的详细信息，请参见[Spring Cloud项目页面](https://projects.spring.io/spring-cloud/)。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 如果您的项目已经使用Thymeleaf作为模板引擎，则Eureka服务器的Freemarker模板可能无法正确加载。在这种情况下，必须手动配置模板加载器： |

**application.yml。** 

```
spring:
  freemarker:
    template-loader-path: classpath:/templates/
    prefer-file-system-access: false
```



## 12.2如何运行Eureka服务器

以下示例显示了最小的Eureka服务器：

```
@SpringBootApplication
@EnableEurekaServer
public class Application {

    public static void main(String[] args) {
        new SpringApplicationBuilder(Application.class).web(true).run(args);
    }

}
```

该服务器具有一个主页，其中包含UI和HTTP API端点，用于`/eureka/*`下的常规Eureka功能。

以下链接提供了一些Eureka背景知识：[磁通电容器](https://github.com/cfregly/fluxcapacitor/wiki/NetflixOSS-FAQ#eureka-service-discovery-load-balancer)和[google小组讨论](https://groups.google.com/forum/?fromgroups#!topic/eureka_netflix/g3p2r7gHnN0)。

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 由于Gradle的依赖性解析规则以及缺少父bom功能，取决于`spring-cloud-starter-netflix-eureka-server`可能会导致应用程序启动失败。要解决此问题，请添加Spring Boot Gradle插件并按如下所示导入Spring Cloud Starter父Bom：**build.gradle。** `buildscript {  dependencies {    classpath("org.springframework.boot:spring-boot-gradle-plugin:{spring-boot-docs-version}")  } } apply plugin: "spring-boot" dependencyManagement {  imports {    mavenBom "org.springframework.cloud:spring-cloud-dependencies:{spring-cloud-version}"  } }` |

## 12.3高可用性，区域和区域

Eureka服务器没有后端存储，但是注册表中的所有服务实例都必须发送心跳信号以使其注册保持最新（因此可以在内存中完成）。客户端还具有Eureka注册的内存缓存（因此，对于每个对服务的请求，它们都不必转到注册表）。

默认情况下，每个Eureka服务器也是Eureka客户端，并且需要（至少一个）服务URL来定位对等方。如果您不提供该服务，则该服务将运行并运行，但是它将使您的日志充满关于无法向对等方注册的噪音。

另请参阅[下面的内容，](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-ribbon)了解客户端在[Ribbon中](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-ribbon)对区域和区域的支持。

## 12.4独立模式

只要存在某种监视器或弹性运行时（例如Cloud Foundry），两个缓存（客户端和服务器）和心跳的组合就可以使独立的Eureka服务器对故障具有相当的恢复能力。在独立模式下，您可能希望关闭客户端行为，以使其不会继续尝试并无法到达其对等对象。下面的示例演示如何关闭客户端行为：

**application.yml（独立Eureka服务器）。** 

```
server:
  port: 8761

eureka:
  instance:
    hostname: localhost
  client:
    registerWithEureka: false
    fetchRegistry: false
    serviceUrl:
      defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/
```



请注意，`serviceUrl`指向与本地实例相同的主机。

## 12.5同行意识

通过运行多个实例并要求它们彼此注册，可以使Eureka更具弹性和可用性。实际上，这是默认行为，因此要使其正常工作，您需要做的就是向对等体添加有效的`serviceUrl`，如以下示例所示：

**application.yml（两个对等感知Eureka服务器）。** 

```
---
spring:
  profiles: peer1
eureka:
  instance:
    hostname: peer1
  client:
    serviceUrl:
      defaultZone: http://peer2/eureka/

---
spring:
  profiles: peer2
eureka:
  instance:
    hostname: peer2
  client:
    serviceUrl:
      defaultZone: http://peer1/eureka/
```



在前面的示例中，我们有一个YAML文件，该文件可以通过在不同的Spring配置文件中运行，在两个主机（`peer1`和`peer2`）上运行同一服务器。您可以通过操纵`/etc/hosts`解析主机名来使用此配置来测试单个主机上的对等感知（在生产环境中这样做没有太大价值）。实际上，如果您在知道其主机名的计算机上运行，则不需要`eureka.instance.hostname`（默认情况下，使用`java.net.InetAddress`进行查找）。

您可以将多个对等方添加到系统，并且只要它们都通过至少一个边缘相互连接，它们就可以在彼此之间同步注册。如果对等方在物理上是分开的（在一个数据中心内部或在多个数据中心之间），则该系统原则上可以解决“ 裂脑 ”型故障。您可以将多个对等方添加到系统中，并且只要它们都直接相互连接，它们就可以在彼此之间同步注册。

**application.yml（三个对等感知Eureka服务器）。** 

```
eureka:
  client:
    serviceUrl:
      defaultZone: http://peer1/eureka/,http://peer2/eureka/,http://peer3/eureka/

---
spring:
  profiles: peer1
eureka:
  instance:
    hostname: peer1

---
spring:
  profiles: peer2
eureka:
  instance:
    hostname: peer2

---
spring:
  profiles: peer3
eureka:
  instance:
    hostname: peer3
```



## 12.6何时首选IP地址

在某些情况下，Eureka最好公布服务的IP地址而不是主机名。将`eureka.instance.preferIpAddress`设置为`true`，并且当应用程序向eureka注册时，它将使用其IP地址而不是其主机名。

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 如果Java无法确定主机名，则IP地址将发送到Eureka。设置主机名的唯一明确方法是设置`eureka.instance.hostname`属性。您可以在运行时使用环境变量（例如，`eureka.instance.hostname=${HOST_NAME}`）设置主机名。 |

## 12.7保护Eureka服务器

您只需通过`spring-boot-starter-security`将Spring Security添加到服务器的类路径中即可保护Eureka服务器。默认情况下，当Spring Security在类路径上时，它将要求在每次向应用程序发送请求时都发送有效的CSRF令牌。Eureka客户通常不会拥有有效的跨站点请求伪造（CSRF）令牌，您需要为`/eureka/**`端点禁用此要求。例如：

```
@EnableWebSecurity
class WebSecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.csrf().ignoringAntMatchers("/eureka/**");
        super.configure(http);
    }
}
```

有关CSRF的更多信息，请参见[Spring Security文档](https://docs.spring.io/spring-security/site/docs/current/reference/htmlsingle/#csrf)。

可以在Spring Cloud示例存储[库中](https://github.com/spring-cloud-samples/eureka/tree/Eureka-With-Security)找到Eureka演示服务器。

## 12.8 JDK 11支持

Eureka服务器所依赖的JAXB模块已在JDK 11中删除。如果要在运行Eureka服务器时使用JDK 11，则必须在POM或Gradle文件中包括这些依赖项。

```
<dependency>
	<groupId>org.glassfish.jaxb</groupId>
	<artifactId>jaxb-runtime</artifactId>
</dependency>
```

## 13.断路器：Hystrix个客户

Netflix创建了一个名为[Hystrix](https://github.com/Netflix/Hystrix)的库，该库实现了[断路器模式](https://martinfowler.com/bliki/CircuitBreaker.html)。在微服务架构中，通常有多个服务调用层，如以下示例所示：



**图13.1。微服务图**

![Hystrix](/assets/images/springcloud/Hystrix.png)



较低级别的服务中的服务故障可能会导致级联故障，直至用户。在`metrics.rollingStats.timeInMilliseconds`定义的滚动窗口中，当对特定服务的调用超过`circuitBreaker.requestVolumeThreshold`（默认：20个请求）并且失败百分比大于`circuitBreaker.errorThresholdPercentage`（默认：> 50％）时（默认：10秒） ），则电路断开并且无法进行呼叫。在错误和断路的情况下，开发人员可以提供备用功能。



**图13.2 Hystrix后备可防止级联故障**

![HystrixFallback](/assets/images/springcloud/HystrixFallback.png)



开路可停止级联故障，并让不堪重负的服务时间得以恢复。后备可以是另一个受Hystrix保护的呼叫，静态数据或合理的空值。可以将回退链接在一起，以便第一个回退进行其他业务调用，然后回退到静态数据。

## 13.1如何包括Hystrix

要将Hystrix包含在您的项目中，请使用起始者，其组ID为`org.springframework.cloud`，工件ID为`spring-cloud-starter-netflix-hystrix`。有关使用当前Spring Cloud版本Train设置构建系统的详细信息，请参见[Spring Cloud项目页面](https://projects.spring.io/spring-cloud/)。

以下示例显示了具有Hystrix断路器的最小Eureka服务器：

```
@SpringBootApplication
@EnableCircuitBreaker
public class Application {

    public static void main(String[] args) {
        new SpringApplicationBuilder(Application.class).web(true).run(args);
    }

}

@Component
public class StoreIntegration {

    @HystrixCommand(fallbackMethod = "defaultStores")
    public Object getStores(Map<String, Object> parameters) {
        //do stuff that might fail
    }

    public Object defaultStores(Map<String, Object> parameters) {
        return /* something useful */;
    }
}
```

`@HystrixCommand`由一个名为[“ javanica ”](https://github.com/Netflix/Hystrix/tree/master/hystrix-contrib/hystrix-javanica)的Netflix contrib库提供。Spring Cloud将带有注释的Spring beans自动包装在与Hystrix断路器连接的代理中。断路器计算何时断开和闭合电路，以及在发生故障时应采取的措施。

要配置`@HystrixCommand`，可以将`commandProperties`属性与`@HystrixProperty`批注一起使用。有关 更多详细信息，请参见 [此处](https://github.com/Netflix/Hystrix/tree/master/hystrix-contrib/hystrix-javanica#configuration)。有关 可用属性的详细信息，请参见[Hystrix Wiki](https://github.com/Netflix/Hystrix/wiki/Configuration)。

## 13.2传播安全上下文或使用Spring范围

如果要将某些线程本地上下文传播到`@HystrixCommand`中，则默认声明无效，因为默认声明在线程池中执行命令（如果超时）。通过要求Hystrix使用不同的“ 隔离策略 ”，可以通过配置或直接在批注中切换Hystrix来使用与调用方相同的线程。下面的示例演示了如何在注释中设置线程：

```
@HystrixCommand(fallbackMethod = "stubMyService",
    commandProperties = {
      @HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")
    }
)
...
```

如果使用`@SessionScope`或`@RequestScope`，则同样适用。如果遇到运行时异常，提示它找不到范围内的上下文，则需要使用同一线程。

您还可以选择将`hystrix.shareSecurityContext`属性设置为`true`。这样做会自动配置一个Hystrix并发策略插件挂钩，以将`SecurityContext`从您的主线程转移到Hystrix命令所使用的那个线程。Hystrix不允许注册多个Hystrix并发策略，因此可以通过将自己的`HystrixConcurrencyStrategy`声明为Spring bean来使用扩展机制。Spring Cloud在Spring上下文中寻找您的实现，并将其包装在自己的插件中。

## 13.3健康指标

连接的断路器的状态也显示在调用应用程序的`/health`端点中，如以下示例所示：

```
{
    "hystrix": {
        "openCircuitBreakers": [
            "StoreIntegration::getStoresByLocationLink"
        ],
        "status": "CIRCUIT_OPEN"
    },
    "status": "UP"
}
```

## 13.4 Hystrix指标流

要启用Hystrix指标流，请包括对`spring-boot-starter-actuator`的依赖性并设置`management.endpoints.web.exposure.include: hystrix.stream`。这样做将`/actuator/hystrix.stream`作为管理端点公开，如以下示例所示：

```
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
```

## 14.断路器：Hystrix仪表板

Hystrix的主要好处之一是它收集的有关每个HystrixCommand的一组度量。Hystrix仪表板以有效的方式显示每个断路器的运行状况。



**图14.1 Hystrix资讯主页**

![Hystrix](/assets/images/springcloud/Hystrix.png)



## 15. Hystrix超时和Ribbon客户

当使用包裹Ribbon客户端的Hystrix命令时，您要确保Hystrix超时配置为比配置的Ribbon超时更长，包括可能进行的任何重试。例如，如果您的Ribbon连接超时是一秒钟，并且Ribbon客户端可能重试了3次请求，则Hystrix超时应该稍微超过3秒。

## 15.1如何包括Hystrix信息中心

要将Hystrix仪表板包含在您的项目中，请使用启动器，其组ID为`org.springframework.cloud`，工件ID为`spring-cloud-starter-netflix-hystrix-dashboard`。有关使用当前Spring Cloud版本Train设置构建系统的详细信息，请参见[Spring Cloud项目页面](https://projects.spring.io/spring-cloud/)。

要运行Hystrix信息中心，请用`@EnableHystrixDashboard`注释Spring Boot主类。然后访问`/hystrix`，并将仪表板指向Hystrix客户端应用程序中单个实例的`/hystrix.stream`端点。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 连接到使用HTTPS的`/hystrix.stream`端点时，JVM必须信任服务器使用的证书。如果证书不受信任，则必须将证书导入JVM，以使Hystrix仪表板成功连接到流终结点。 |

## 15.2 Turbine

从系统的整体运行状况来看，查看单个实例的Hystrix数据不是很有用。[Turbine](https://github.com/Netflix/Turbine)是一个应用程序，它将所有相关的`/hystrix.stream`端点聚合到一个组合的`/turbine.stream`中，以便在Hystrix仪表板中使用。个别实例通过Eureka定位。运行Turbine需要使用`@EnableTurbine`注释对您的主类进行注释（例如，通过使用spring-cloud-starter-netflix-turbine设置类路径）。[Turbine 1 Wiki中](https://github.com/Netflix/Turbine/wiki/Configuration-(1.x))记录的所有配置属性均适用。唯一的区别是`turbine.instanceUrlSuffix`不需要预先添加的端口，因为除非`turbine.instanceInsertPort=false`，否则它将自动处理。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 默认情况下，Turbine通过在Eureka中查找其`hostName`和`port`条目，然后将`/hystrix.stream`附加到已注册实例上来查找`/hystrix.stream`端点。如果实例的元数据包含`management.port`，则使用它代替`/hystrix.stream`端点的`port`值。默认情况下，名为`management.port`的元数据条目等于`management.port`配置属性。可以使用以下配置覆盖它： |

```
eureka:
  instance:
    metadata-map:
      management.port: ${management.port:8081}
```

`turbine.appConfig`配置密钥是Eureka serviceId的列表，涡轮使用它们来查找实例。然后，在Hystrix仪表板中使用涡轮流，其URL类似于以下内容：

```
https://my.turbine.server:8080/turbine.stream?cluster=CLUSTERNAME
```

如果名称为`default`，则可以省略cluster参数。`cluster`参数必须与`turbine.aggregator.clusterConfig`中的条目匹配。从Eureka返回的值是大写的。因此，如果存在一个向Eureka注册的名为`customers`的应用程序，则以下示例可用：

```
turbine:
  aggregator:
    clusterConfig: CUSTOMERS
  appConfig: customers
```

如果您需要自定义Turbine应该使用哪些集群名称（因为您不想在`turbine.aggregator.clusterConfig`配置中存储集群名称），请提供类型为`TurbineClustersProvider`的bean。

`clusterName`可以通过`turbine.clusterNameExpression`中的SPEL表达式进行自定义，其中根目录为`InstanceInfo`的实例。默认值为`appName`，这意味着Eureka `serviceId`成为群集密钥（即，客户的`InstanceInfo`的`appName`为`CUSTOMERS`）。一个不同的示例是`turbine.clusterNameExpression=aSGName`，它从AWS ASG名称获取集群名称。以下清单显示了另一个示例：

```
turbine:
  aggregator:
    clusterConfig: SYSTEM,USER
  appConfig: customers,stores,ui,admin
  clusterNameExpression: metadata['cluster']
```

在前面的示例中，来自四个服务的群集名称是从它们的元数据映射中拉出的，并且期望其值包括`SYSTEM`和`USER`。

要将“ 默认 ”群集用于所有应用程序，您需要一个字符串文字表达式（如果在YAML中，也要使用单引号和双引号进行转义）：

```
turbine:
  appConfig: customers,stores
  clusterNameExpression: "'default'"
```

Spring Cloud提供了`spring-cloud-starter-netflix-turbine`，它具有运行Turbine服务器所需的所有依赖关系。要添加Turbine，请创建一个Spring Boot应用程序并使用`@EnableTurbine`对其进行注释。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 默认情况下，Spring Cloud允许Turbine使用主机和端口以允许每个主机，每个集群多个进程。如果你想建立在本地Netflix的行为Turbine，以*不*使每台主机的多个进程，每簇（关键实例ID是主机名），集合`turbine.combineHostPort=false`。 |

### 15.2.1集群端点

在某些情况下，其他应用程序了解在Turbine中配置了哪些custers可能会很有用。为此，您可以使用`/clusters`端点，该端点将返回所有已配置集群的JSON数组。

**GET /集群。** 

```
[
  {
    "name": "RACES",
    "link": "http://localhost:8383/turbine.stream?cluster=RACES"
  },
  {
    "name": "WEB",
    "link": "http://localhost:8383/turbine.stream?cluster=WEB"
  }
]
```



可以通过将`turbine.endpoints.clusters.enabled`设置为`false`来禁用此端点。

## 15.3 Turbine Stream

在某些环境中（例如在PaaS设置中），从所有分布式Hystrix命令中提取指标的经典Turbine模型不起作用。在这种情况下，您可能想让Hystrix命令将指标推送到Turbine。Spring Cloud通过消息传递实现了这一点。要在客户端上执行此操作，请向`spring-cloud-netflix-hystrix-stream`和您选择的`spring-cloud-starter-stream-*`添加一个依赖项。有关代理以及如何配置客户端凭据的详细信息，请参见[Spring Cloud Stream文档](https://docs.spring.io/spring-cloud-stream/docs/current/reference/htmlsingle/)。对于本地代理，它应该开箱即用。

在服务器端，创建一个Spring Boot应用程序，并用`@EnableTurbineStream`对其进行注释。Turbine Stream服务器需要使用Spring Webflux，因此，`spring-boot-starter-webflux`必须包含在您的项目中。将`spring-cloud-starter-netflix-turbine-stream`添加到您的应用程序时，默认包含`spring-boot-starter-webflux`。

然后，您可以将Hystrix仪表板指向Turbine Stream服务器，而不是单独的Hystrix流。如果Turbine Stream在myhost的端口8989上运行，则将`http://myhost:8989`放在Hystrix仪表板的流输入字段中。电路以其各自的`serviceId`为前缀，后跟一个点（`.`），然后是电路名称。

Spring Cloud提供了`spring-cloud-starter-netflix-turbine-stream`，其中包含使Turbine Stream服务器运行所需的所有依赖项。然后，您可以添加您选择的流绑定程序，例如`spring-cloud-starter-stream-rabbit`。

Turbine Stream服务器还支持`cluster`参数。与Turbine服务器不同，Turbine Stream使用eureka serviceIds作为群集名称，并且这些名称不可配置。

如果Turbine Stream服务器在`my.turbine.server`的端口8989上运行，并且您的环境中有两个eureka serviceId `customers`和`products`，则以下URL将在Turbine Stream服务器上可用。`default`和空群集名称将提供Turbine Stream服务器接收的所有度量。

```
https://my.turbine.sever:8989/turbine.stream?cluster=customers
https://my.turbine.sever:8989/turbine.stream?cluster=products
https://my.turbine.sever:8989/turbine.stream?cluster=default
https://my.turbine.sever:8989/turbine.stream
```

因此，您可以将eureka serviceIds用作Turbine仪表板（或任何兼容的仪表板）的群集名称。您无需为Turbine Stream服务器配置任何属性，例如`turbine.appConfig`，`turbine.clusterNameExpression`和`turbine.aggregator.clusterConfig`。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| Turbine Stream服务器使用Spring Cloud Stream从配置的输入通道中收集所有度量。这意味着它不会从每个实例中主动收集Hystrix指标。它仅可以提供每个实例已经收集到输入通道中的度量。 |

## 16.客户端负载平衡器：Ribbon

Ribbon是一种客户端负载平衡器，可让您对HTTP和TCP客户端的行为进行大量控制。Feign已使用Ribbon，因此，如果使用`@FeignClient`，则本节也适用。

Ribbon中的中心概念是指定客户的概念。每个负载均衡器都是组件的一部分，这些组件可以一起工作以按需联系远程服务器，并且该组件具有您作为应用程序开发人员提供的名称（例如，使用`@FeignClient`批注）。根据需要，Spring Cloud通过使用`RibbonClientConfiguration`为每个命名的客户端创建一个新的集合作为`ApplicationContext`。其中包含`ILoadBalancer`，`RestClient`和`ServerListFilter`。

## 16.1如何包括Ribbon

要将Ribbon包含在您的项目中，请使用起始者，其组ID为`org.springframework.cloud`，工件ID为`spring-cloud-starter-netflix-ribbon`。有关使用当前Spring Cloud版本Train设置构建系统的详细信息，请参见[Spring Cloud项目页面](https://projects.spring.io/spring-cloud/)。

## 16.2自定义Ribbon客户端

您可以使用`<client>.ribbon.*`中的外部属性来配置Ribbon客户端的某些位，这与本地使用Netflix API相似，不同之处在于可以使用Spring Boot配置文件。可以将本机选项检查为[`CommonClientConfigKey`](https://github.com/Netflix/ribbon/blob/master/ribbon-core/src/main/java/com/netflix/client/config/CommonClientConfigKey.java)（功能区核心的一部分）中的静态字段。

Spring Cloud还允许您通过使用`@RibbonClient`声明其他配置（在`RibbonClientConfiguration`之上）来完全控制客户端，如以下示例所示：

```
@Configuration
@RibbonClient(name = "custom", configuration = CustomConfiguration.class)
public class TestConfiguration {
}
```

在这种情况下，客户端由`RibbonClientConfiguration`中已有的组件以及`CustomConfiguration`中的任何组件组成（其中后者通常会覆盖前者）。

| ![[警告]](/assets/images/springcloud/warning.png)                                  |
| ------------------------------------------------------------ |
| `CustomConfiguration`类必须是`@Configuration`类，但请注意，对于主应用程序上下文，它不在`@ComponentScan`中。否则，它由所有`@RibbonClients`共享。如果您使用`@ComponentScan`（或`@SpringBootApplication`），则需要采取措施避免将其包括在内（例如，可以将其放在单独的，不重叠的程序包中，或指定要在`@ComponentScan`）。 |

下表显示了Spring Cloud Netflix默认为Ribbon提供的beans：

| Bean类型                   | Bean名称                  | 班级名称                         |
| -------------------------- | ------------------------- | -------------------------------- |
| `IClientConfig`            | `ribbonClientConfig`      | `DefaultClientConfigImpl`        |
| `IRule`                    | `ribbonRule`              | `ZoneAvoidanceRule`              |
| `IPing`                    | `ribbonPing`              | `DummyPing`                      |
| `ServerList<Server>`       | `ribbonServerList`        | `ConfigurationBasedServerList`   |
| `ServerListFilter<Server>` | `ribbonServerListFilter`  | `ZonePreferenceServerListFilter` |
| `ILoadBalancer`            | `ribbonLoadBalancer`      | `ZoneAwareLoadBalancer`          |
| `ServerListUpdater`        | `ribbonServerListUpdater` | `PollingServerListUpdater`       |

创建其中一种类型的bean并将其放置在`@RibbonClient`配置中（例如上述`FooConfiguration`），您可以覆盖所描述的每个beans，如以下示例所示：

```
@Configuration
protected static class FooConfiguration {

	@Bean
	public ZonePreferenceServerListFilter serverListFilter() {
		ZonePreferenceServerListFilter filter = new ZonePreferenceServerListFilter();
		filter.setZone("myTestZone");
		return filter;
	}

	@Bean
	public IPing ribbonPing() {
		return new PingUrl();
	}

}
```

上一示例中的include语句将`NoOpPing`替换为`PingUrl`，并提供了自定义`serverListFilter`。

## 16.3为所有Ribbon客户端自定义默认值

通过使用`@RibbonClients`批注并注册默认配置，可以为所有Ribbon客户端提供默认配置，如以下示例所示：

```
@RibbonClients(defaultConfiguration = DefaultRibbonConfig.class)
public class RibbonClientDefaultConfigurationTestsConfig {

	public static class BazServiceList extends ConfigurationBasedServerList {

		public BazServiceList(IClientConfig config) {
			super.initWithNiwsConfig(config);
		}

	}

}

@Configuration
class DefaultRibbonConfig {

	@Bean
	public IRule ribbonRule() {
		return new BestAvailableRule();
	}

	@Bean
	public IPing ribbonPing() {
		return new PingUrl();
	}

	@Bean
	public ServerList<Server> ribbonServerList(IClientConfig config) {
		return new RibbonClientDefaultConfigurationTestsConfig.BazServiceList(config);
	}

	@Bean
	public ServerListSubsetFilter serverListFilter() {
		ServerListSubsetFilter filter = new ServerListSubsetFilter();
		return filter;
	}

}
```

## 16.4通过设置Properties自定义Ribbon客户端

从版本1.2.0开始，Spring Cloud Netflix现在支持通过将属性设置为与[Ribbon文档](https://github.com/Netflix/ribbon/wiki/Working-with-load-balancers#components-of-load-balancer)兼容来自定义Ribbon客户端。

这使您可以在启动时在不同环境中更改行为。

以下列表显示了受支持的属性>：

- `<clientName>.ribbon.NFLoadBalancerClassName`：应实施`ILoadBalancer`
- `<clientName>.ribbon.NFLoadBalancerRuleClassName`：应实施`IRule`
- `<clientName>.ribbon.NFLoadBalancerPingClassName`：应实施`IPing`
- `<clientName>.ribbon.NIWSServerListClassName`：应实施`ServerList`
- `<clientName>.ribbon.NIWSServerListFilterClassName`：应实施`ServerListFilter`

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 这些属性中定义的类优先于使用`@RibbonClient(configuration=MyRibbonConfig.class)`定义的beans和Spring Cloud Netflix提供的默认值。 |

要为名为`users`的服务名称设置`IRule`，可以设置以下属性：

**application.yml。** 

```
users:
  ribbon:
    NIWSServerListClassName: com.netflix.loadbalancer.ConfigurationBasedServerList
    NFLoadBalancerRuleClassName: com.netflix.loadbalancer.WeightedResponseTimeRule
```



有关[Ribbon](https://github.com/Netflix/ribbon/wiki/Working-with-load-balancers)提供的实现，请参见[Ribbon文档](https://github.com/Netflix/ribbon/wiki/Working-with-load-balancers)。

## 16.5将Ribbon与Eureka一起使用

当Eureka与Ribbon结合使用时（也就是说，两者都在类路径上），`ribbonServerList`被扩展名`DiscoveryEnabledNIWSServerList`覆盖，这将填充{71中的服务器列表/}。它还用`NIWSDiscoveryPing`替换了`IPing`接口，该接口委托给Eureka确定服务器是否启动。默认安装的`ServerList`是`DomainExtractingServerList`。其目的是不使用AWS AMI元数据（这就是Netflix所依赖的）使元数据可用于负载均衡器。默认情况下，服务器列表是使用实例元数据中提供的“ zone ”信息构建的（因此，在远程客户端上，设置为`eureka.instance.metadataMap.zone`）。如果缺少该字段，并且设置了`approximateZoneFromHostname`标志，则它可以使用服务器主机名中的域名作为该区域的代理。一旦区域信息可用，就可以在`ServerListFilter`中使用它。默认情况下，它用于在与客户端相同的区域中定位服务器，因为默认值为`ZonePreferenceServerListFilter`。默认情况下，以与远程实例相同的方式（即通过`eureka.instance.metadataMap.zone`）确定客户端的区域。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 设置客户端区域的传统“ archaius ”方法是通过名为“ @zone”的配置属性。如果可用，Spring Cloud优先于所有其他设置使用该设置（请注意，该键必须在YAML配置中用引号引起来）。 |

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 如果没有其他区域数据源，则根据客户端配置（而不是实例配置）进行猜测。我们取`eureka.client.availabilityZones`（这是从区域名称到区域列表的映射），然后为实例自己的区域拉出第一个区域（即`eureka.client.region`，其默认值为“ us-east-1” ”，以与本机Netflix兼容）。 |

## 16.6示例：如何在没有Eureka的情况下使用Ribbon

Eureka是一种抽象发现远程服务器的便捷方法，因此您不必在客户端中对它们的URL进行硬编码。但是，如果您不想使用Eureka，则Ribbon和Feign也可以使用。假设您为“商店”声明了`@RibbonClient`，并且Eureka未被使用（甚至不在类路径上）。Ribbon客户端默认为配置的服务器列表。您可以提供以下配置：

**application.yml。** 

```
stores:
  ribbon:
    listOfServers: example.com,google.com
```



## 16.7示例：在Ribbon中禁用Eureka

将`ribbon.eureka.enabled`属性设置为`false`会显式禁用Ribbon中的Eureka，如以下示例所示：

**application.yml。** 

```
ribbon:
  eureka:
   enabled: false
```



## 16.8直接使用Ribbon API

您也可以直接使用`LoadBalancerClient`，如以下示例所示：

```
public class MyClass {
    @Autowired
    private LoadBalancerClient loadBalancer;

    public void doStuff() {
        ServiceInstance instance = loadBalancer.choose("stores");
        URI storesUri = URI.create(String.format("http://%s:%s", instance.getHost(), instance.getPort()));
        // ... do something with the URI
    }
}
```

## 16.9 Ribbon配置的缓存

每个Ribbon命名的客户端都有一个相应的子应用程序上下文，Spring Cloud维护该上下文。该应用程序上下文在对命名客户端的第一个请求上延迟加载。通过指定Ribbon客户端的名称，可以更改此延迟加载行为，以代替在启动时急于加载这些子应用程序上下文，如以下示例所示：

**application.yml。** 

```
ribbon:
  eager-load:
    enabled: true
    clients: client1, client2, client3
```



## 16.10如何配置Hystrix线程池

如果将`zuul.ribbonIsolationStrategy`更改为`THREAD`，则Hystrix的线程隔离策略将用于所有路由。在这种情况下，`HystrixThreadPoolKey`默认设置为`RibbonCommand`。这意味着所有路由的HystrixCommands在相同的Hystrix线程池中执行。可以使用以下配置更改此行为：

**application.yml。** 

```
zuul:
  threadPool:
    useSeparateThreadPools: true
```



前面的示例导致在每个路由的Hystrix线程池中执行HystrixCommands。

在这种情况下，默认`HystrixThreadPoolKey`与每个路由的服务ID相同。要将前缀添加到`HystrixThreadPoolKey`，请将`zuul.threadPool.threadPoolKeyPrefix`设置为要添加的值，如以下示例所示：

**application.yml。** 

```
zuul:
  threadPool:
    useSeparateThreadPools: true
    threadPoolKeyPrefix: zuulgw
```



## 16.11如何提供Ribbon的`IRule`的密钥

如果您需要提供自己的`IRule`实现来处理诸如“ canary ”测试之类的特殊路由要求，请将一些信息传递给`IRule`的`choose`方法。

**com.netflix.loadbalancer.IRule.java。** 

```
public interface IRule{
    public Server choose(Object key);
         :
```



您可以提供一些信息，供您的`IRule`实现用来选择目标服务器，如以下示例所示：

```
RequestContext.getCurrentContext()
              .set(FilterConstants.LOAD_BALANCER_KEY, "canary-test");
```

如果您使用密钥`FilterConstants.LOAD_BALANCER_KEY`将任何对象放入`RequestContext`中，则该对象将传递到`IRule`实现的`choose`方法中。上例中显示的代码必须在执行`RibbonRoutingFilter`之前执行。Zuul的前置过滤器是执行此操作的最佳位置。您可以通过预过滤器中的`RequestContext`访问HTTP标头和查询参数，因此可以用来确定传递到Ribbon的`LOAD_BALANCER_KEY`。如果没有在`RequestContext`中用`LOAD_BALANCER_KEY`放置任何值，则将空值作为`choose`方法的参数传递。

## 17.外部配置：Archaius

[Archaius](https://github.com/Netflix/archaius)是Netflix客户端配置库。它是所有Netflix OSS组件用于配置的库。Archaius是[Apache Commons Configuration](https://commons.apache.org/proper/commons-configuration)项目的扩展。它允许通过轮询源以进行更改或通过将源将更改推送到客户端来更新配置。Archaius使用Dynamic <Type> Property类作为属性的句柄，如以下示例所示：

**Archaius示例。** 

```
class ArchaiusTest {
    DynamicStringProperty myprop = DynamicPropertyFactory
            .getInstance()
            .getStringProperty("my.prop");

    void doSomething() {
        OtherClass.someMethod(myprop.get());
    }
}
```



Archaius具有自己的一组配置文件和加载优先级。Spring应用程序通常不应该直接使用Archaius，但是仍然需要本地配置Netflix工具。Spring Cloud具有Spring环境桥，因此Archaius可以从Spring环境读取属性。该桥允许Spring Boot项目使用常规配置工具链，同时允许它们按记录的方式配置Netflix工具（大部分情况下）。

## 18.路由器和过滤器：Zuul

路由是微服务架构不可或缺的一部分。例如，`/`可能被映射到您的web应用程序，`/api/users`被映射到用户服务，`/api/shop`被映射到商店服务。 [Zuul](https://github.com/Netflix/zuul)是Netflix的基于JVM的路由器和服务器端负载平衡器。

[Netflix将Zuul](https://www.slideshare.net/MikeyCohen1/edge-architecture-ieee-international-conference-on-cloud-engineering-32240146/27)用于以下[用途](https://www.slideshare.net/MikeyCohen1/edge-architecture-ieee-international-conference-on-cloud-engineering-32240146/27)：

- 认证方式
- 见解
- 压力测试
- 金丝雀测试
- 动态路由
- 服务迁移
- 减载
- 安全
- 静态响应处理
- 主动/主动流量管理

Zuul的规则引擎可使用几乎所有JVM语言编写规则和过滤器，并内置对Java和Groovy的支持。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 配置属性`zuul.max.host.connections`已被两个新属性`zuul.host.maxTotalConnections`和`zuul.host.maxPerRouteConnections`取代，它们分别默认为200和20。 |

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 所有路由的默认Hystrix隔离模式（`ExecutionIsolationStrategy`）为`SEMAPHORE`。如果首选该隔离模式，则可以将`zuul.ribbonIsolationStrategy`更改为`THREAD`。 |

## 18.1如何包含Zuul

要将Zuul包含在您的项目中，请使用组ID为`org.springframework.cloud`和工件ID为`spring-cloud-starter-netflix-zuul`的启动程序。有关使用当前Spring Cloud版本Train设置构建系统的详细信息，请参见[Spring Cloud项目页面](https://projects.spring.io/spring-cloud/)。

## 18.2嵌入式Zuul反向代理

Spring Cloud已创建嵌入式Zuul代理，以简化UI应用程序要对一个或多个后端服务进行代理调用的常见用例的开发。此功能对于用户界面代理所需的后端服务很有用，从而避免了为所有后端独立管理CORS和身份验证问题的需求。

要启用它，请用`@EnableZuulProxy`注释Spring Boot主类。这样做会导致将本地呼叫转发到适当的服务。按照约定，ID为`users`的服务从位于`/users`的代理接收请求（前缀被去除）。代理使用Ribbon来定位要通过发现转发到的实例。所有请求均在[hystrix命令](https://www.springcloud.cc/spring-cloud-greenwich.html#hystrix-fallbacks-for-routes)中执行，因此失败以Hystrix指标显示。一旦电路断开，代理就不会尝试与服务联系。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| Zuul入门程序不包含发现客户端，因此，对于基于服务ID的路由，您还需要在类路径上提供其中之一（Eureka是一种选择）。 |

要跳过自动添加服务的过程，请将`zuul.ignored-services`设置为服务ID模式的列表。如果服务与被忽略但已包含在显式配置的路由映射中的模式匹配，则将其忽略，如以下示例所示：

**application.yml。** 

```
 zuul:
  ignoredServices: '*'
  routes:
    users: /myusers/**
```



在前面的示例中，**除** `users` **外**，所有服务均被忽略。

要增加或更改代理路由，可以添加外部配置，如下所示：

**application.yml。** 

```
 zuul:
  routes:
    users: /myusers/**
```



前面的示例意味着对`/myusers`的HTTP调用被转发到`users`服务（例如，`/myusers/101`被转发到`/101`）。

要对路由进行更细粒度的控制，可以分别指定路径和serviceId，如下所示：

**application.yml。** 

```
 zuul:
  routes:
    users:
      path: /myusers/**
      serviceId: users_service
```



前面的示例意味着对`/myusers`的HTTP调用将转发到`users_service`服务。路由必须具有可以指定为蚂蚁样式模式的`path`，因此`/myusers/*`仅匹配一个级别，而`/myusers/**`则分层匹配。

后端的位置可以指定为`serviceId`（用于发现服务）或`url`（用于物理位置），如以下示例所示：

**application.yml。** 

```
 zuul:
  routes:
    users:
      path: /myusers/**
      url: https://example.com/users_service
```



这些简单的url路由不会作为`HystrixCommand`来执行，也不会使用Ribbon对多个URL进行负载均衡。为了实现这些目标，可以使用静态服务器列表指定一个`serviceId`，如下所示：

**application.yml。** 

```
zuul:
  routes:
    echo:
      path: /myusers/**
      serviceId: myusers-service
      stripPrefix: true

hystrix:
  command:
    myusers-service:
      execution:
        isolation:
          thread:
            timeoutInMilliseconds: ...

myusers-service:
  ribbon:
    NIWSServerListClassName: com.netflix.loadbalancer.ConfigurationBasedServerList
    listOfServers: https://example1.com,http://example2.com
    ConnectTimeout: 1000
    ReadTimeout: 3000
    MaxTotalHttpConnections: 500
    MaxConnectionsPerHost: 100
```



另一种方法是指定服务路由并为`serviceId`配置Ribbon客户端（这样做需要在Ribbon中禁用Eureka支持- [有关更多信息](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-ribbon-without-eureka)，请参见[上文](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-ribbon-without-eureka)），如下所示例：

**application.yml。** 

```
zuul:
  routes:
    users:
      path: /myusers/**
      serviceId: users

ribbon:
  eureka:
    enabled: false

users:
  ribbon:
    listOfServers: example.com,google.com
```



您可以使用`regexmapper`在`serviceId`和路由之间提供约定。它使用正则表达式命名组从`serviceId`中提取变量，并将其注入到路由模式中，如以下示例所示：

**ApplicationConfiguration.java。** 

```
@Bean
public PatternServiceRouteMapper serviceRouteMapper() {
    return new PatternServiceRouteMapper(
        "(?<name>^.+)-(?<version>v.+$)",
        "${version}/${name}");
}
```



前面的示例意味着`myusers-v1`中的`serviceId`被映射到路由`/v1/myusers/**`。可以接受任何正则表达式，但是所有命名组必须同时存在于`servicePattern`和`routePattern`中。如果`servicePattern`与`serviceId`不匹配，则使用默认行为。在前面的示例中，`myusers`中的`serviceId`被映射到“ / myusers / **”路由（未检测到版本）。默认情况下，此功能是禁用的，仅适用于发现的服务。

要为所有映射添加前缀，请将`zuul.prefix`设置为一个值，例如`/api`。默认情况下，在转发请求之前，将从请求中删除代理前缀（您可以使用`zuul.stripPrefix=false`将此行为关闭）。您还可以关闭从单个路由中剥离特定于服务的前缀，如以下示例所示：

**application.yml。** 

```
 zuul:
  routes:
    users:
      path: /myusers/**
      stripPrefix: false
```



| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| `zuul.stripPrefix`仅适用于`zuul.prefix`中设置的前缀。它对给定路由的`path`中定义的前缀没有任何影响。 |

在前面的示例中，对`/myusers/101`的请求被转发到`users`服务上的`/myusers/101`。

`zuul.routes`条目实际上绑定到类型为`ZuulProperties`的对象。如果查看该对象的属性，则可以看到它也有一个`retryable`标志。将该标志设置为`true`，以使Ribbon客户端自动重试失败的请求。当您需要修改使用Ribbon客户端配置的重试操作的参数时，也可以将该标志设置为`true`。

默认情况下，`X-Forwarded-Host`标头被添加到转发的请求中。要关闭它，请设置`zuul.addProxyHeaders = false`。默认情况下，前缀路径被剥离，并且后端请求使用`X-Forwarded-Prefix`标头（在前面显示的示例中为`/myusers`）。

如果设置默认路由（`/`），则带有`@EnableZuulProxy`的应用程序可以充当独立服务器。例如，`zuul.route.home: /`会将所有流量（“ / **”）路由到“ home”服务。

如果需要更细粒度的忽略，则可以指定要忽略的特定模式。这些模式在路线定位过程开始时进行评估，这意味着模式中应包含前缀以保证匹配。被忽略的模式跨越所有服务，并取代任何其他路由规范。以下示例显示了如何创建忽略的模式：

**application.yml。** 

```
 zuul:
  ignoredPatterns: /**/admin/**
  routes:
    users: /myusers/**
```



前面的示例意味着所有呼叫（例如`/myusers/101`）都被转发到`users`服务上的`/101`。但是，包括`/admin/`在内的呼叫无法解决。

| ![[警告]](/assets/images/springcloud/warning.png)                                  |
| ------------------------------------------------------------ |
| 如果您需要保留路由的顺序，则需要使用YAML文件，因为使用属性文件时顺序会丢失。以下示例显示了这样的YAML文件： |

**application.yml。** 

```
 zuul:
  routes:
    users:
      path: /myusers/**
    legacy:
      path: /**
```



如果要使用属性文件，则`legacy`路径可能最终位于`users`路径的前面，从而导致`users`路径不可访问。

## 18.3 Zuul HTTP客户端

Zuul使用的默认HTTP客户端现在由Apache HTTP客户端支持，而不是已弃用的Ribbon `RestClient`。要使用`RestClient`或`okhttp3.OkHttpClient`，请分别设置`ribbon.restclient.enabled=true`或`ribbon.okhttp.enabled=true`。如果要自定义Apache HTTP客户端或OK HTTP客户端，请提供类型为`ClosableHttpClient`或`OkHttpClient`的bean。

## 18.4 Cookie和敏感标题

您可以在同一系统中的服务之间共享标头，但您可能不希望敏感标头泄漏到下游到外部服务器中。您可以在路由配置中指定忽略的标头列表。Cookies发挥着特殊的作用，因为它们在浏览器中具有定义明确的语义，并且始终将它们视为敏感内容。如果代理的使用者是浏览器，那么下游服务的cookie也会给用户带来麻烦，因为它们都混杂在一起（所有下游服务看起来都来自同一位置）。

如果您对服务的设计很谨慎（例如，如果只有一个下游服务设置cookie），则可以让它们从后端一直流到调用者。另外，如果您的代理设置了cookie，并且您的所有后端服务都在同一系统中，则很自然地简单地共享它们（例如，使用Spring Session将它们链接到某些共享状态）。除此之外，由下游服务设置的任何cookie可能对调用者都无用，因此建议您将（至少）`Set-Cookie`和`Cookie`设置为敏感的标头，用于那些没有使用的路由您网域的一部分。即使对于属于您网域的路由，在让Cookie在它们和代理之间流动之前，也应仔细考虑其含义。

可以将敏感头配置为每个路由的逗号分隔列表，如以下示例所示：

**application.yml。** 

```
 zuul:
  routes:
    users:
      path: /myusers/**
      sensitiveHeaders: Cookie,Set-Cookie,Authorization
      url: https://downstream
```



| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 这是`sensitiveHeaders`的默认值，因此除非您希望其与众不同，否则无需进行设置。这是Spring Cloud Netflix 1.1中的新功能（在1.0中，用户无法控制标题，并且所有cookie都双向流动）。 |

`sensitiveHeaders`是黑名单，默认值不为空。因此，要使Zuul发送所有标头（`ignored`除外），必须将其显式设置为空列表。如果要将Cookie或授权标头传递到后端，则必须这样做。以下示例显示如何使用`sensitiveHeaders`：

**application.yml。** 

```
 zuul:
  routes:
    users:
      path: /myusers/**
      sensitiveHeaders:
      url: https://downstream
```



您还可以通过设置`zuul.sensitiveHeaders`来设置敏感标题。如果在路由上设置了`sensitiveHeaders`，它将覆盖全局`sensitiveHeaders`设置。

## 18.5忽略标题

除了路由敏感的标头之外，您还可以为与下游服务交互期间应丢弃的值（请求和响应）设置一个名为`zuul.ignoredHeaders`的全局值。默认情况下，如果Spring Security不在类路径中，则它们为空。否则，它们将初始化为Spring Security指定的一组众所周知的“ 安全性 ”标头（例如，涉及缓存）。在这种情况下的假设是，下游服务也可以添加这些标头，但是我们需要来自代理的值。要在类路径上有Spring Security时不丢弃这些众所周知的安全标头，可以将`zuul.ignoreSecurityHeaders`设置为`false`。如果您在Spring Security中禁用了HTTP安全响应标头，并希望由下游服务提供值，则这样做很有用。

## 18.6管理端点

默认情况下，如果将`@EnableZuulProxy`与Spring Boot Actuator结合使用，则将启用两个附加端点：

- 路线
- 筛选器

### 18.6.1路由端点

在`/routes`处的路由端点的GET返回已映射路由的列表：

**GET /路线。** 

```
{
  /stores/**: "http://localhost:8081"
}
```



可以通过将`?format=details`查询字符串添加到`/routes`来请求其他路由详细信息。这样做会产生以下输出：

**获取/ routes / details。** 

```
{
  "/stores/**": {
    "id": "stores",
    "fullPath": "/stores/**",
    "location": "http://localhost:8081",
    "path": "/**",
    "prefix": "/stores",
    "retryable": false,
    "customSensitiveHeaders": false,
    "prefixStripped": true
  }
}
```



`POST`至`/routes`强制刷新现有路由（例如，当服务目录中发生更改时）。您可以通过将`endpoints.routes.enabled`设置为`false`来禁用此端点。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 路由应该自动响应服务目录中的更改，但是从`POST`到`/routes`是强制更改立即进行的一种方法。 |

### 18.6.2过滤器端点

过滤器端点`/filters`的`GET`按类型返回Zuul过滤器的映射。对于地图中的每种过滤器类型，您将获得该类型的所有过滤器的列表以及它们的详细信息。

## 18.7扼杀模式和局部Forwards

迁移现有应用程序或API时，常见的模式是“ 勒死 ”旧的端点，并用不同的实现方式慢慢替换它们。Zuul代理是一个有用的工具，因为您可以使用它来处理来自旧端点的客户端的所有流量，但可以将一些请求重定向到新请求。

以下示例显示“ 扼杀 ”方案的配置详细信息：

**application.yml。** 

```
 zuul:
  routes:
    first:
      path: /first/**
      url: https://first.example.com
    second:
      path: /second/**
      url: forward:/second
    third:
      path: /third/**
      url: forward:/3rd
    legacy:
      path: /**
      url: https://legacy.example.com
```



在前面的示例中，我们扼杀了“ legacy ”应用程序，该应用程序映射到与其他模式之一不匹配的所有请求。`/first/**`中的路径已使用外部URL提取到新服务中。`/second/**`中的路径被转发，以便可以在本地处理（例如，使用普通Spring `@RequestMapping`）。`/third/**`中的路径也被转发，但是前缀不同（`/third/foo`被转发到`/3rd/foo`）。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 被忽略的模式不会被完全忽略，它们不会由代理处理（因此它们也可以在本地有效转发）。 |

## 18.8通过Zuul上传文件

如果使用`@EnableZuulProxy`，则可以使用代理路径上载文件，只要文件很小，它就可以正常工作。对于大文件，有一个替代路径可以绕过“ / zuul / *”中的Spring `DispatcherServlet`（以避免进行多部分处理）。换句话说，如果您拥有`zuul.routes.customers=/customers/**`，则可以将`POST`大文件复制到`/zuul/customers/*`。Servlet路径通过`zuul.servletPath`外部化。如果代理路由将您带到Ribbon负载均衡器，则超大文件也需要提高超时设置，如以下示例所示：

**application.yml。** 

```
hystrix.command.default.execution.isolation.thread.timeoutInMilliseconds: 60000
ribbon:
  ConnectTimeout: 3000
  ReadTimeout: 60000
```



请注意，要使流技术处理大文件，您需要在请求中使用分块编码（某些浏览器默认不这样做），如以下示例所示：

```
$ curl -v -H "Transfer-Encoding: chunked" \
    -F "file=@mylarge.iso" localhost:9999/zuul/simple/file
```

## 18.9查询字符串编码

在处理传入请求时，查询参数将被解码，以便可以在Zuul过滤器中进行修改。然后将它们重新编码，在路由过滤器中重建后端请求。例如，如果结果是使用Javascript的`encodeURIComponent()`方法编码的，则结果可能不同于原始输入。虽然这在大多数情况下不会引起问题，但某些web服务器可能对复杂查询字符串的编码很挑剔。

要强制对查询字符串进行原始编码，可以将特殊标志传递给`ZuulProperties`，以便使用`HttpServletRequest::getQueryString`方法按原样使用查询字符串，如以下示例所示：

**application.yml。** 

```
 zuul:
  forceOriginalQueryStringEncoding: true
```



| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 该特殊标志仅适用于`SimpleHostRoutingFilter`。另外，您松开了使用`RequestContext.getCurrentContext().setRequestQueryParams(someOverriddenParameters)`轻松覆盖查询参数的功能，因为现在直接在原始`HttpServletRequest`上获取了查询字符串。 |

## 18.10请求URI编码

在处理传入请求时，在将请求URI与路由匹配之前，先对其进行解码。然后在路由过滤器中重建后端请求时，将对请求URI进行重新编码。如果您的URI包含编码的“ /”字符，则可能导致某些意外行为。

要使用原始请求URI，可以将特殊标志传递给'ZuulProperties'，以便使用`HttpServletRequest::getRequestURI`方法按原样使用URI，如以下示例所示：

**application.yml。** 

```
 zuul:
  decodeUrl: false
```



| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 如果使用`requestURI` RequestContext属性覆盖请求URI，并且此标志设置为false，则将不对在请求上下文中设置的URL进行编码。确保URL已被编码是您的责任。 |

## 18.11普通嵌入式Zuul

如果使用`@EnableZuulServer`（而不是`@EnableZuulProxy`），则也可以运行Zuul服务器而不进行代理或有选择地打开代理平台的某些部分。您添加到类型为`ZuulFilter`的应用程序中的所有beans都会自动安装（与`@EnableZuulProxy`一样），但是不会自动添加任何代理过滤器。

在这种情况下，仍然可以通过配置“ zuul.routes。*”来指定进入Zuul服务器的路由，但是没有服务发现也没有代理。因此，“ serviceId”和“ url”设置将被忽略。以下示例将“ / api / **”中的所有路径映射到Zuul过滤器链：

**application.yml。** 

```
 zuul:
  routes:
    api: /api/**
```



## 18.12禁用Zuul过滤器

Spring Cloud的Zuul带有多个`ZuulFilter` beans，默认情况下在代理和服务器模式下都启用。有关可以启用的过滤器列表，请参见[Zuul过滤器包](https://github.com/spring-cloud/spring-cloud-netflix/tree/master/spring-cloud-netflix-zuul/src/main/java/org/springframework/cloud/netflix/zuul/filters)。如果要禁用一个，请设置`zuul.<SimpleClassName>.<filterType>.disable=true`。按照惯例，`filters`之后的软件包是Zuul过滤器类型。例如，要禁用`org.springframework.cloud.netflix.zuul.filters.post.SendResponseFilter`，请设置`zuul.SendResponseFilter.post.disable=true`。

## 18.13为路线提供Hystrix后备

当Zuul中给定路由的电路跳闸时，可以通过创建类型为`FallbackProvider`的bean提供回退响应。在此bean中，您需要指定回退的路由ID，并提供一个`ClientHttpResponse`作为回退的路由。以下示例显示了一个相对简单的`FallbackProvider`实现：

```
class MyFallbackProvider implements FallbackProvider {

    @Override
    public String getRoute() {
        return "customers";
    }

    @Override
    public ClientHttpResponse fallbackResponse(String route, final Throwable cause) {
        if (cause instanceof HystrixTimeoutException) {
            return response(HttpStatus.GATEWAY_TIMEOUT);
        } else {
            return response(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private ClientHttpResponse response(final HttpStatus status) {
        return new ClientHttpResponse() {
            @Override
            public HttpStatus getStatusCode() throws IOException {
                return status;
            }

            @Override
            public int getRawStatusCode() throws IOException {
                return status.value();
            }

            @Override
            public String getStatusText() throws IOException {
                return status.getReasonPhrase();
            }

            @Override
            public void close() {
            }

            @Override
            public InputStream getBody() throws IOException {
                return new ByteArrayInputStream("fallback".getBytes());
            }

            @Override
            public HttpHeaders getHeaders() {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                return headers;
            }
        };
    }
}
```

以下示例显示了上一个示例的路由配置可能如何显示：

```
zuul:
  routes:
    customers: /customers/**
```

如果您想为所有路由提供默认后备，则可以创建类型为`FallbackProvider`的bean，并让`getRoute`方法返回`*`或`null`，如以下示例：

```
class MyFallbackProvider implements FallbackProvider {
    @Override
    public String getRoute() {
        return "*";
    }

    @Override
    public ClientHttpResponse fallbackResponse(String route, Throwable throwable) {
        return new ClientHttpResponse() {
            @Override
            public HttpStatus getStatusCode() throws IOException {
                return HttpStatus.OK;
            }

            @Override
            public int getRawStatusCode() throws IOException {
                return 200;
            }

            @Override
            public String getStatusText() throws IOException {
                return "OK";
            }

            @Override
            public void close() {

            }

            @Override
            public InputStream getBody() throws IOException {
                return new ByteArrayInputStream("fallback".getBytes());
            }

            @Override
            public HttpHeaders getHeaders() {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                return headers;
            }
        };
    }
}
```

## 18.14 Zuul超时

如果要为通过Zuul代理的请求配置套接字超时和读取超时，则根据您的配置，有两个选项：

- 如果Zuul使用服务发现，则需要使用`ribbon.ReadTimeout`和`ribbon.SocketTimeout` Ribbon属性配置这些超时。

如果通过指定URL配置了Zuul路由，则需要使用`zuul.host.connect-timeout-millis`和`zuul.host.socket-timeout-millis`。

## 18.15重写`Location`标头

如果Zuul在web应用程序的前面，则当web应用程序通过HTTP状态代码`3XX`重定向时，您可能需要重新编写`Location`标头。否则，浏览器将重定向到web应用程序的URL，而不是Zuul URL。您可以配置`LocationRewriteFilter` Zuul过滤器，将`Location`标头重写为Zuul的URL。它还添加回去的全局前缀和特定于路由的前缀。以下示例通过使用Spring配置文件添加过滤器：

```
import org.springframework.cloud.netflix.zuul.filters.post.LocationRewriteFilter;
...

@Configuration
@EnableZuulProxy
public class ZuulConfig {
    @Bean
    public LocationRewriteFilter locationRewriteFilter() {
        return new LocationRewriteFilter();
    }
}
```

| ![[警告]](/assets/images/springcloud/caution.png)                                  | 警告 |
| ------------------------------------------------------------ | ---- |
| 小心使用此过滤器。筛选器作用于所有`3XX`响应代码的`Location`头，这可能并不适用于所有情况，例如将用户重定向到外部URL时。 |      |

## 18.16启用跨源请求

默认情况下，Zuul将所有跨源请求（CORS）路由到服务。如果您希望Zuul处理这些请求，可以通过提供自定义`WebMvcConfigurer` bean来完成：

```
@Bean
public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/path-1/**")
                    .allowedOrigins("https://allowed-origin.com")
                    .allowedMethods("GET", "POST");
        }
    };
}
```

在上面的示例中，我们允许`https://allowed-origin.com`中的`GET`和`POST`方法将跨域请求发送到以`path-1`开头的端点。您可以使用`/**`映射将CORS配置应用于特定的路径模式或整个应用程序的全局路径。您可以通过此配置来自定义属性：`allowedOrigins`，`allowedMethods`，`allowedHeaders`，`exposedHeaders`，`allowCredentials`和`maxAge`。

## 18.17指标

Zuul将在执行器指标终结点下提供指标，以解决路由请求时可能发生的任何故障。可以通过点击`/actuator/metrics`来查看这些指标。指标的名称格式为`ZUUL::EXCEPTION:errorCause:statusCode`。

## 18.18 Zuul开发人员指南

有关Zuul的工作原理的一般概述，请参见[Zuul Wiki](https://github.com/Netflix/zuul/wiki/How-it-Works)。

### 18.18.1 Zuul Servlet

Zuul被实现为Servlet。对于一般情况，Zuul已嵌入Spring调度机制中。这使Spring MVC可以控制路由。在这种情况下，Zuul缓冲请求。如果需要通过Zuul而不缓冲请求（例如，用于大文件上传），则Servlet也将安装在Spring Dispatcher之外。缺省情况下，该servlet的地址为`/zuul`。可以使用`zuul.servlet-path`属性更改此路径。

### 18.18.2 Zuul RequestContext

要在过滤器之间传递信息，Zuul使用[`RequestContext`](https://github.com/Netflix/zuul/blob/1.x/zuul-core/src/main/java/com/netflix/zuul/context/RequestContext.java)。其数据保存在每个请求专用的`ThreadLocal`中。有关在何处路由请求，错误以及实际的`HttpServletRequest`和`HttpServletResponse`的信息存储在此处。`RequestContext`扩展了`ConcurrentHashMap`，因此任何内容都可以存储在上下文中。[`FilterConstants`](https://github.com/spring-cloud/spring-cloud-netflix/blob/master/spring-cloud-netflix-zuul/src/main/java/org/springframework/cloud/netflix/zuul/filters/support/FilterConstants.java)包含Spring Cloud Netflix安装的过滤器使用的密钥（[稍后会](https://www.springcloud.cc/spring-cloud-greenwich.html#zuul-developer-guide-enable-filters)详细介绍）。

### 18.18.3 `@EnableZuulProxy`与`@EnableZuulServer`

Spring Cloud Netflix安装了许多过滤器，具体取决于启用了Zuul的注释。`@EnableZuulProxy`是`@EnableZuulServer`的超集。换句话说，`@EnableZuulProxy`包含`@EnableZuulServer`安装的所有筛选器。“ 代理 ”中的其他过滤器启用路由功能。如果您想使用“ 空白 ” Zuul，则应使用`@EnableZuulServer`。

### 18.18.4 `@EnableZuulServer`过滤器

`@EnableZuulServer`创建一个`SimpleRouteLocator`，该文件从Spring Boot配置文件中加载路由定义。

已安装以下过滤器（按常规方式Spring Beans）：

- 前置过滤器：
  - `ServletDetectionFilter`：检测请求是否通过Spring分派器进行。设置键为`FilterConstants.IS_DISPATCHER_SERVLET_REQUEST_KEY`的布尔值。
  - `FormBodyWrapperFilter`：解析表单数据并为下游请求重新编码。
  - `DebugFilter`：如果设置了`debug`请求参数，则将`RequestContext.setDebugRouting()`和`RequestContext.setDebugRequest()`设置为`true`。*路由过滤器：
  - `SendForwardFilter`：使用Servlet `RequestDispatcher`的Forwards请求。转发位置存储在`RequestContext`属性`FilterConstants.FORWARD_TO_KEY`中。这对于转发到当前应用程序中的端点很有用。
- 帖子过滤器：
  - `SendResponseFilter`：将代理请求的响应写入当前响应。
- 错误过滤器：
  - `SendErrorFilter`：如果`RequestContext.getThrowable()`不为空，则Forwards至`/error`（默认）。您可以通过设置`error.path`属性来更改默认转发路径（`/error`）。

### 18.18.5 `@EnableZuulProxy`过滤器

创建一个`DiscoveryClientRouteLocator`，它从`DiscoveryClient`（例如Eureka）以及属性中加载路由定义。从`DiscoveryClient`为每个`serviceId`创建一条路由。添加新服务后，将刷新路由。

除了前面描述的过滤器之外，还安装了以下过滤器（常规Spring Beans）：

- 前置过滤器：
  - `PreDecorationFilter`：根据提供的`RouteLocator`确定路线和路线。它还为下游请求设置了各种与代理相关的标头。
- 路线过滤器：
  - `RibbonRoutingFilter`：使用Ribbon，Hystrix和可插拔的HTTP客户端发送请求。在`RequestContext`属性`FilterConstants.SERVICE_ID_KEY`中可以找到服务ID。此过滤器可以使用不同的HTTP客户端：
    - Apache `HttpClient`：默认客户端。
    - Squareup `OkHttpClient` v3：通过在类路径上放置`com.squareup.okhttp3:okhttp`库并设置`ribbon.okhttp.enabled=true`来启用。
    - Netflix Ribbon HTTP客户端：通过设置`ribbon.restclient.enabled=true`启用。该客户端具有局限性，包括不支持PATCH方法，但是还具有内置的重试功能。
  - `SimpleHostRoutingFilter`：通过Apache HttpClient将请求发送到预定的URL。可在`RequestContext.getRouteHost()`中找到URL。

### 18.18.6自定义Zuul过滤器示例

下面的大多数“如何编写”示例都包含在[示例Zuul过滤器](https://github.com/spring-cloud-samples/sample-zuul-filters)项目中。在该存储库中也有一些处理请求或响应正文的示例。

本节包括以下示例：

- [名为“如何编写预过滤器”的部分](https://www.springcloud.cc/spring-cloud-greenwich.html#zuul-developer-guide-sample-pre-filter)
- [名为“如何编写路由过滤器”的部分](https://www.springcloud.cc/spring-cloud-greenwich.html#zuul-developer-guide-sample-route-filter)
- [名为“如何编写后置过滤器”的部分](https://www.springcloud.cc/spring-cloud-greenwich.html#zuul-developer-guide-sample-post-filter)

#### 如何编写前置过滤器

前置过滤器可在`RequestContext`中设置数据，以便在下游的过滤器中使用。主要用例是设置路由过滤器所需的信息。以下示例显示了Zuul前置过滤器：

```
public class QueryParamPreFilter extends ZuulFilter {
	@Override
	public int filterOrder() {
		return PRE_DECORATION_FILTER_ORDER - 1; // run before PreDecoration
	}

	@Override
	public String filterType() {
		return PRE_TYPE;
	}

	@Override
	public boolean shouldFilter() {
		RequestContext ctx = RequestContext.getCurrentContext();
		return !ctx.containsKey(FORWARD_TO_KEY) // a filter has already forwarded
				&& !ctx.containsKey(SERVICE_ID_KEY); // a filter has already determined serviceId
	}
    @Override
    public Object run() {
        RequestContext ctx = RequestContext.getCurrentContext();
		HttpServletRequest request = ctx.getRequest();
		if (request.getParameter("sample") != null) {
		    // put the serviceId in `RequestContext`
    		ctx.put(SERVICE_ID_KEY, request.getParameter("foo"));
    	}
        return null;
    }
}
```

前面的过滤器从`sample`请求参数中填充`SERVICE_ID_KEY`。实际上，您不应该执行这种直接映射。而是应从`sample`的值中查找服务ID。

现在已填充`SERVICE_ID_KEY`，`PreDecorationFilter`将不运行，而`RibbonRoutingFilter`将运行。

| ![[提示]](/assets/images/springcloud/tip.png)                              |
| ---------------------------------------------------- |
| 如果要路由到完整URL，请致电`ctx.setRouteHost(url)`。 |

要修改路由过滤器转发到的路径，请设置`REQUEST_URI_KEY`。

#### 如何编写路由过滤器

路由过滤器在预过滤器之后运行，并向其他服务发出请求。这里的许多工作是将请求和响应数据与客户端所需的模型相互转换。以下示例显示了Zuul路由过滤器：

```
public class OkHttpRoutingFilter extends ZuulFilter {
	@Autowired
	private ProxyRequestHelper helper;

	@Override
	public String filterType() {
		return ROUTE_TYPE;
	}

	@Override
	public int filterOrder() {
		return SIMPLE_HOST_ROUTING_FILTER_ORDER - 1;
	}

	@Override
	public boolean shouldFilter() {
		return RequestContext.getCurrentContext().getRouteHost() != null
				&& RequestContext.getCurrentContext().sendZuulResponse();
	}

    @Override
    public Object run() {
		OkHttpClient httpClient = new OkHttpClient.Builder()
				// customize
				.build();

		RequestContext context = RequestContext.getCurrentContext();
		HttpServletRequest request = context.getRequest();

		String method = request.getMethod();

		String uri = this.helper.buildZuulRequestURI(request);

		Headers.Builder headers = new Headers.Builder();
		Enumeration<String> headerNames = request.getHeaderNames();
		while (headerNames.hasMoreElements()) {
			String name = headerNames.nextElement();
			Enumeration<String> values = request.getHeaders(name);

			while (values.hasMoreElements()) {
				String value = values.nextElement();
				headers.add(name, value);
			}
		}

		InputStream inputStream = request.getInputStream();

		RequestBody requestBody = null;
		if (inputStream != null && HttpMethod.permitsRequestBody(method)) {
			MediaType mediaType = null;
			if (headers.get("Content-Type") != null) {
				mediaType = MediaType.parse(headers.get("Content-Type"));
			}
			requestBody = RequestBody.create(mediaType, StreamUtils.copyToByteArray(inputStream));
		}

		Request.Builder builder = new Request.Builder()
				.headers(headers.build())
				.url(uri)
				.method(method, requestBody);

		Response response = httpClient.newCall(builder.build()).execute();

		LinkedMultiValueMap<String, String> responseHeaders = new LinkedMultiValueMap<>();

		for (Map.Entry<String, List<String>> entry : response.headers().toMultimap().entrySet()) {
			responseHeaders.put(entry.getKey(), entry.getValue());
		}

		this.helper.setResponse(response.code(), response.body().byteStream(),
				responseHeaders);
		context.setRouteHost(null); // prevent SimpleHostRoutingFilter from running
		return null;
    }
}
```

前面的过滤器将Servlet请求信息转换为OkHttp3请求信息，执行HTTP请求，并将OkHttp3响应信息转换为Servlet响应。

#### 如何编写帖子过滤器

后置过滤器通常操纵响应。以下过滤器将随机`UUID`添加为`X-Sample`标头：

```
public class AddResponseHeaderFilter extends ZuulFilter {
	@Override
	public String filterType() {
		return POST_TYPE;
	}

	@Override
	public int filterOrder() {
		return SEND_RESPONSE_FILTER_ORDER - 1;
	}

	@Override
	public boolean shouldFilter() {
		return true;
	}

	@Override
	public Object run() {
		RequestContext context = RequestContext.getCurrentContext();
    	HttpServletResponse servletResponse = context.getResponse();
		servletResponse.addHeader("X-Sample", UUID.randomUUID().toString());
		return null;
	}
}
```

| ![[注意]](/assets/images/springcloud/note.png)                           |
| -------------------------------------------------- |
| 其他操作，例如转换响应主体，则更加复杂且计算量大。 |

### 18.18.7 Zuul错误的工作方式

如果在Zuul过滤器生命周期的任何部分抛出异常，则将执行错误过滤器。仅当`RequestContext.getThrowable()`不是`null`时才运行`SendErrorFilter`。然后，它在请求中设置特定的`javax.servlet.error.*`属性，并将请求转发到Spring Boot错误页面。

### 18.18.8 Zuul急切的应用程序上下文加载

Zuul内部使用Ribbon来调用远程URL。默认情况下，Ribbon客户端在第一次调用时被Spring Cloud延迟加载。可以使用以下配置为Zuul更改此行为，这会导致在应用程序启动时急于加载与子Ribbon相关的应用程序上下文。以下示例显示了如何启用即时加载：

**application.yml。** 

```
zuul:
  ribbon:
    eager-load:
      enabled: true
```



## 19. Polyglot支持Sidecar

您是否要使用非JVM语言来利用Eureka，Ribbon和Config Server？Spring Cloud Netflix Sidecar的灵感来自[Netflix Prana](https://github.com/Netflix/Prana)。它包括一个HTTP API，用于获取给定服务的所有实例（按主机和端口）。您也可以通过嵌入式Zuul代理来代理服务调用，该代理从Eureka获取其路由条目。可以直接通过主机查找或通过Zuul代理访问Spring Cloud Config服务器。非JVM应用程序应实施运行状况检查，以便Sidecar可以向Eureka报告应用程序是启动还是关闭。

要在项目中包含Sidecar，请使用组ID为`org.springframework.cloud`且工件ID为`spring-cloud-netflix-sidecar`的依赖项。

要启用Sidecar，请使用`@EnableSidecar`创建一个Spring Boot应用程序。该注释包括`@EnableCircuitBreaker`，`@EnableDiscoveryClient`和`@EnableZuulProxy`。在与非JVM应用程序相同的主机上运行结果应用程序。

要配置侧车，请将`sidecar.port`和`sidecar.health-uri`添加到`application.yml`。`sidecar.port`属性是非JVM应用程序侦听的端口。这样Sidecar可以正确地向Eureka注册应用程序。`sidecar.secure-port-enabled`选项提供了一种启用流量安全端口的方法。`sidecar.health-uri`是在非JVM应用程序上可访问的URI，它模仿Spring Boot运行状况指示器。它应该返回类似于以下内容的JSON文档：

**health-uri-document。** 

```
{
  "status":"UP"
}
```



以下application.yml示例显示了Sidecar应用程序的示例配置：

**application.yml。** 

```
server:
  port: 5678
spring:
  application:
    name: sidecar

sidecar:
  port: 8000
  health-uri: http://localhost:8000/health.json
```



`DiscoveryClient.getInstances()`方法的API为`/hosts/{serviceId}`。以下针对`/hosts/customers`的示例响应在不同的主机上返回两个实例：

**/ hosts / customers。** 

```
[
    {
        "host": "myhost",
        "port": 9000,
        "uri": "http://myhost:9000",
        "serviceId": "CUSTOMERS",
        "secure": false
    },
    {
        "host": "myhost2",
        "port": 9000,
        "uri": "http://myhost2:9000",
        "serviceId": "CUSTOMERS",
        "secure": false
    }
]
```



非JVM应用程序（如果Sidecar位于端口5678上）可通过`http://localhost:5678/hosts/{serviceId}`访问此API。

Zuul代理会自动将Eureka中已知的每个服务的路由添加到`/<serviceId>`，因此可以在`/customers`中使用客户服务。非JVM应用程序可以在`http://localhost:5678/customers`上访问客户服务（假设Sidecar正在侦听5678端口）。

如果Config Server已向Eureka注册，则非JVM应用程序可以通过Zuul代理对其进行访问。如果ConfigServer的`serviceId`为`configserver`并且Sidecar在端口5678上，则可以在[http：// localhost：5678 / configserver上](http://localhost:5678/configserver)对其进行访问。

非JVM应用程序可以利用Config Server返回YAML文档的功能。例如，调用https://sidecar.local.spring.io:5678/configserver/default-master.yml 可能会导致YAML文档类似于以下内容：

```
eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
  password: password
info:
  description: Spring Cloud Samples
  url: https://github.com/spring-cloud-samples
```

要在使用HTTP时使运行状况检查请求接受所有证书，请将`sidecar.accept-all-ssl-certificates`设置为`true。

## 20.重试失败的请求

Spring Cloud Netflix提供了多种发出HTTP请求的方式。您可以使用负载均衡的`RestTemplate`，Ribbon或Feign。无论您如何选择创建HTTP请求，始终都有一个请求失败的机会。当请求失败时，您可能希望自动重试该请求。为此，在使用Sping Cloud Netflix时，您需要在应用程序的类路径中包含[Spring重试](https://github.com/spring-projects/spring-retry)。如果存在Spring重试，则负载平衡的`RestTemplates`，Feign和Zuul会自动重试任何失败的请求（假设您的配置允许这样做）。

## 20.1退避政策

默认情况下，重试请求时不使用任何退避策略。如果要配置退避策略，则需要创建类型为`LoadBalancedRetryFactory`的bean并为给定服务覆盖`createBackOffPolicy`方法，如以下示例所示：

```
@Configuration
public class MyConfiguration {
    @Bean
    LoadBalancedRetryFactory retryFactory() {
        return new LoadBalancedRetryFactory() {
            @Override
            public BackOffPolicy createBackOffPolicy(String service) {
                return new ExponentialBackOffPolicy();
            }
        };
    }
}
```

## 20.2配置

将Ribbon与Spring重试一起使用时，可以通过配置某些Ribbon属性来控制重试功能。为此，请设置`client.ribbon.MaxAutoRetries`，`client.ribbon.MaxAutoRetriesNextServer`和`client.ribbon.OkToRetryOnAllOperations`属性。有关这些属性的作用的说明，请参见[Ribbon文档](https://github.com/Netflix/ribbon/wiki/Getting-Started#the-properties-file-sample-clientproperties)。

| ![[警告]](/assets/images/springcloud/warning.png)                                  |
| ------------------------------------------------------------ |
| 启用`client.ribbon.OkToRetryOnAllOperations`包括重试POST请求，由于请求正文的缓冲，这可能会对服务器资源产生影响。 |

此外，当响应中返回某些状态代码时，您可能想重试请求。您可以通过设置`clientName.ribbon.retryableStatusCodes`属性来列出希望Ribbon客户端重试的响应代码，如以下示例所示：

```
clientName:
  ribbon:
    retryableStatusCodes: 404,502
```

您也可以创建类型为`LoadBalancedRetryPolicy`的bean，并实现`retryableStatusCode`方法以根据状态码重试请求。

### 20.2.1 Zuul

您可以通过将`zuul.retryable`设置为`false`来关闭Zuul的重试功能。您还可以通过将`zuul.routes.routename.retryable`设置为`false`来逐个路由禁用重试功能。

## 21. HTTP客户端

Spring Cloud Netflix会自动为您创建Ribbon，Feign和Zuul使用的HTTP客户端。但是，您也可以根据需要提供自定义的HTTP客户端。为此，如果使用的是Apache Http Cient，则可以创建类型为`ClosableHttpClient`的bean，如果使用的是OK HTTP，则可以创建类型为`OkHttpClient`的bean。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 创建自己的HTTP客户端时，您还负责为这些客户端实施正确的连接管理策略。这样做不当会导致资源管理问题。 |

## 22.维护模式下的模块

将模块置于维护模式意味着Spring Cloud团队将不再向模块添加新功能。我们将修复阻止程序错误和安全性问题，还将考虑并审查社区的一些小请求。

自Greenwich 发布列车全面上市以来，我们打算继续为这些模块提供至少一年的支持。

以下Spring Cloud Netflix模块和相应的启动器将进入维护模式：

- spring-cloud-netflix-archaius
- spring-cloud-netflix-hystrix-contract
- spring-cloud-netflix-hystrix-dashboard
- spring-cloud-netflix-hystrix-stream
- spring-cloud-netflix-hystrix
- spring-cloud-netflix-ribbon
- spring-cloud-netflix-turbine-stream
- spring-cloud-netflix-turbine
- spring-cloud-netflix-zuul

| ![[注意]](/assets/images/springcloud/note.png)       |
| ------------------------------ |
| 这不包括Eureka或并发限制模块。 |

# 第四部分 Spring Cloud OpenFeign

**Greenwich SR5**

该项目通过自动配置并绑定到Spring环境和其他Spring编程模型习惯用法，为Spring Boot应用提供了OpenFeign集成。

## 23.声明式REST客户端：Feign

[Feign](https://github.com/Netflix/feign)是声明性的web服务客户端。它使编写web服务客户端更加容易。要使用Feign，请创建一个接口并对其进行注释。它具有可插入的注释支持，包括Feign注释和JAX-RS注释。Feign还支持可插拔编码器和解码器。Spring Cloud添加了对Spring MVC注释的支持，并支持使用Spring Web中默认使用的同一`HttpMessageConverters`。Spring Cloud集成了Ribbon和Eureka以在使用Feign时提供负载平衡的http客户端。

## 23.1如何包括Feign

要将Feign包含在您的项目中，请将启动器与组`org.springframework.cloud`和工件ID `spring-cloud-starter-openfeign`一起使用。有关 使用当前Spring Cloud版本Train设置构建系统的详细信息，请参见[Spring Cloud项目页面](https://projects.spring.io/spring-cloud/)。

示例spring boot应用

```
@SpringBootApplication
@EnableFeignClients
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

}
```

**StoreClient.java。** 

```
@FeignClient("stores")
public interface StoreClient {
    @RequestMapping(method = RequestMethod.GET, value = "/stores")
    List<Store> getStores();

    @RequestMapping(method = RequestMethod.POST, value = "/stores/{storeId}", consumes = "application/json")
    Store update(@PathVariable("storeId") Long storeId, Store store);
}
```



在`@FeignClient`批注中，字符串值（上面的“ stores”）是一个任意的客户端名称，用于创建Ribbon负载均衡器（请参见[下面的Ribbon support的详细信息](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-ribbon)）。您还可以使用`url`属性（绝对值或仅是主机名）来指定URL。在应用程序上下文中，bean的名称是接口的标准名称。要指定自己的别名值，可以使用`@FeignClient`批注的`qualifier`值。

上面的Ribbon客户端将希望发现“商店”服务的物理地址。如果您的应用程序是Eureka客户端，则它将在Eureka服务注册表中解析该服务。如果您不想使用Eureka，则可以简单地在外部配置中配置服务器列表（[例如，](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-ribbon-without-eureka)参见 [上文](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-ribbon-without-eureka)）。

## 23.2覆盖Feign默认值

Spring Cloud的Feign支持中的中心概念是指定客户的概念。每个虚拟客户端都是组件的一部分，这些组件可以一起工作以按需联系远程服务器，并且该组件的名称是您使用`@FeignClient`批注将其指定为应用程序开发人员的。Spring Cloud根据需要使用`FeignClientsConfiguration`为每个命名客户端创建一个新的合奏作为`ApplicationContext`。其中包含`feign.Decoder`，`feign.Encoder`和`feign.Contract`。通过使用`@FeignClient`批注的`contextId`属性，可以覆盖该集合的名称。

Spring Cloud使您可以通过使用`@FeignClient`声明其他配置（在`FeignClientsConfiguration`之上）来完全控制假客户端。例：

```
@FeignClient(name = "stores", configuration = FooConfiguration.class)
public interface StoreClient {
    //..
}
```

在这种情况下，客户端由`FeignClientsConfiguration`中已有的组件以及`FooConfiguration`中的任何组件组成（其中后者将覆盖前者）。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| `FooConfiguration`不需要用`@Configuration`进行注释。但是，如果是的话，请注意将其从任何可能包含此配置的`@ComponentScan`中排除，因为它将成为`feign.Decoder`，`feign.Encoder`，`feign.Contract`等的默认来源，指定时。可以通过将其与任何`@ComponentScan`或`@SpringBootApplication`放在单独的，不重叠的包中来避免这种情况，也可以在`@ComponentScan`中将其明确排除在外。 |

| ![[注意]](/assets/images/springcloud/note.png)                              |
| ----------------------------------------------------- |
| 现在不推荐使用`serviceId`属性，而推荐使用`name`属性。 |

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 除了更改`ApplicationContext`集合的名称之外，还使用`@FeignClient`批注的`contextId`属性，它会覆盖客户端名称的别名，并将其用作配置名称的一部分bean为该客户端创建的。 |

| ![[警告]](/assets/images/springcloud/warning.png)                               |
| --------------------------------------------------------- |
| 以前，使用`url`属性不需要`name`属性。现在需要使用`name`。 |

`name`和`url`属性中支持占位符。

```
@FeignClient(name = "${feign.name}", url = "${feign.url}")
public interface StoreClient {
    //..
}
```

Spring Cloud Netflix默认提供以下beans伪装（`BeanType` beanName：`ClassName`）：

- `Decoder` feignDecoder：`ResponseEntityDecoder`（包装`SpringDecoder`）
- `Encoder` feignEncoder：`SpringEncoder`
- `Logger` feignLogger：`Slf4jLogger`
- `Contract` feignContract：`SpringMvcContract`
- `Feign.Builder` feignBuilder：`HystrixFeign.Builder`
- `Client` feignClient：如果启用了Ribbon，则它是`LoadBalancerFeignClient`，否则使用默认的伪装客户端。

可以通过分别将`feign.okhttp.enabled`或`feign.httpclient.enabled`设置为`true`并将其放在类路径中来使用OkHttpClient和ApacheHttpClient虚拟客户端。您可以自定义HTTP客户端，方法是在使用Apache时提供`ClosableHttpClient`的bean，在使用OK HTTP时提供`OkHttpClient`。

Spring Cloud Netflix 默认情况下*不会*为伪装提供以下beans，但仍会从应用程序上下文中查找以下类型的beans以创建伪装客户端：

- `Logger.Level`
- `Retryer`
- `ErrorDecoder`
- `Request.Options`
- `Collection<RequestInterceptor>`
- `SetterFactory`

创建其中一种类型的bean并将其放置在`@FeignClient`配置中（例如上述`FooConfiguration`），您可以覆盖上述的每个beans。例：

```
@Configuration
public class FooConfiguration {
    @Bean
    public Contract feignContract() {
        return new feign.Contract.Default();
    }

    @Bean
    public BasicAuthRequestInterceptor basicAuthRequestInterceptor() {
        return new BasicAuthRequestInterceptor("user", "password");
    }
}
```

这将`SpringMvcContract`替换为`feign.Contract.Default`，并将`RequestInterceptor`添加到`RequestInterceptor`的集合中。

`@FeignClient`也可以使用配置属性进行配置。

application.yml

```
feign:
  client:
    config:
      feignName:
        connectTimeout: 5000
        readTimeout: 5000
        loggerLevel: full
        errorDecoder: com.example.SimpleErrorDecoder
        retryer: com.example.SimpleRetryer
        requestInterceptors:
          - com.example.FooRequestInterceptor
          - com.example.BarRequestInterceptor
        decode404: false
        encoder: com.example.SimpleEncoder
        decoder: com.example.SimpleDecoder
        contract: com.example.SimpleContract
```

可以按照与上述类似的方式在`@EnableFeignClients`属性`defaultConfiguration`中指定默认配置。不同之处在于此配置将适用于*所有*伪客户端。

如果您希望使用配置属性来配置所有`@FeignClient`，则可以使用`default`虚拟名称创建配置属性。

application.yml

```
feign:
  client:
    config:
      default:
        connectTimeout: 5000
        readTimeout: 5000
        loggerLevel: basic
```

如果我们同时创建`@Configuration` bean和配置属性，则配置属性将获胜。它将覆盖`@Configuration`值。但是，如果要将优先级更改为`@Configuration`，可以将`feign.client.default-to-properties`更改为`false`。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 如果您需要在`RequestInterceptor`s you will need to either set the thread isolation strategy for Hystrix to `SEMAPHORE`中使用`ThreadLocal`绑定变量，或者在Feign中禁用Hystrix。 |

application.yml

```
# To disable Hystrix in Feign
feign:
  hystrix:
    enabled: false

# To set thread isolation to SEMAPHORE
hystrix:
  command:
    default:
      execution:
        isolation:
          strategy: SEMAPHORE
```

如果我们要创建多个具有相同名称或URL的伪装客户端，以便它们指向同一台服务器，但每个客户端使用不同的自定义配置，则必须使用`@FeignClient`的`contextId`属性，以避免这些配置beans的名称冲突。

```
@FeignClient(contextId = "fooClient", name = "stores", configuration = FooConfiguration.class)
public interface FooClient {
    //..
}
@FeignClient(contextId = "barClient", name = "stores", configuration = BarConfiguration.class)
public interface BarClient {
    //..
}
```

## 23.3手动创建Feign客户

在某些情况下，可能有必要使用上述方法无法实现的方式自定义Feign客户。在这种情况下，您可以使用[Feign Builder API](https://github.com/OpenFeign/feign/#basics)创建客户端 。下面是一个示例，该示例创建两个具有相同接口的Feign客户端，但为每个客户端配置一个单独的请求拦截器。

```
@Import(FeignClientsConfiguration.class)
class FooController {

	private FooClient fooClient;

	private FooClient adminClient;

    	@Autowired
	public FooController(Decoder decoder, Encoder encoder, Client client, Contract contract) {
		this.fooClient = Feign.builder().client(client)
				.encoder(encoder)
				.decoder(decoder)
				.contract(contract)
				.requestInterceptor(new BasicAuthRequestInterceptor("user", "user"))
				.target(FooClient.class, "http://PROD-SVC");

		this.adminClient = Feign.builder().client(client)
				.encoder(encoder)
				.decoder(decoder)
				.contract(contract)
				.requestInterceptor(new BasicAuthRequestInterceptor("admin", "admin"))
				.target(FooClient.class, "http://PROD-SVC");
    }
}
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 在上面的示例中，`FeignClientsConfiguration.class`是Spring Cloud Netflix提供的默认配置。 |

| ![[注意]](/assets/images/springcloud/note.png)                 |
| ---------------------------------------- |
| `PROD-SVC`是客户将向其请求的服务的名称。 |

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| Feign `Contract`对象定义在接口上有效的注释和值。自动连线的`Contract` bean提供对SpringMVC注释的支持，而不是默认的Feign本机注释。 |

## 23.4 Feign Hystrix支持

如果Hystrix在类路径上并且在`feign.hystrix.enabled=true`上，则Feign将使用断路器包装所有方法。还可以返回`com.netflix.hystrix.HystrixCommand`。这使您可以使用反应性模式（通过调用`.toObservable()`或`.observe()`或异步使用（通过调用`.queue()`）。

要基于每个客户端禁用Hystrix支持，请创建具有{prototype“范围的普通`Feign.Builder`，例如：

```
@Configuration
public class FooConfiguration {
    	@Bean
	@Scope("prototype")
	public Feign.Builder feignBuilder() {
		return Feign.builder();
	}
}
```

| ![[警告]](/assets/images/springcloud/warning.png)                                  |
| ------------------------------------------------------------ |
| 在Spring Cloud Dalston发行版之前，如果Hystrix在类路径Feign上，则默认情况下会将所有方法包装在断路器中。Spring Cloud Dalston中对此默认行为进行了更改，以支持选择加入方法。 |

## 23.5 Feign Hystrix后备

Hystrix支持回退的概念：当它们的电路断开或出现错误时执行的默认代码路径。要为给定的`@FeignClient`启用回退，请将`fallback`属性设置为实现回退的类名称。您还需要将实现声明为Spring bean。

```
@FeignClient(name = "hello", fallback = HystrixClientFallback.class)
protected interface HystrixClient {
    @RequestMapping(method = RequestMethod.GET, value = "/hello")
    Hello iFailSometimes();
}

static class HystrixClientFallback implements HystrixClient {
    @Override
    public Hello iFailSometimes() {
        return new Hello("fallback");
    }
}
```

如果需要访问引起后备触发器的原因，则可以使用`@FeignClient`中的`fallbackFactory`属性。

```
@FeignClient(name = "hello", fallbackFactory = HystrixClientFallbackFactory.class)
protected interface HystrixClient {
	@RequestMapping(method = RequestMethod.GET, value = "/hello")
	Hello iFailSometimes();
}

@Component
static class HystrixClientFallbackFactory implements FallbackFactory<HystrixClient> {
	@Override
	public HystrixClient create(Throwable cause) {
		return new HystrixClient() {
			@Override
			public Hello iFailSometimes() {
				return new Hello("fallback; reason was: " + cause.getMessage());
			}
		};
	}
}
```

| ![[警告]](/assets/images/springcloud/warning.png)                                  |
| ------------------------------------------------------------ |
| Feign中的后备实现以及Hystrix后备如何工作存在局限性。返回`com.netflix.hystrix.HystrixCommand`和`rx.Observable`的方法当前不支持后备。 |

## 23.6 Feign和`@Primary`

当将Feign与后退Hystrix一起使用时，`ApplicationContext`中有多个相同类型的beans。这将导致`@Autowired`无法正常工作，因为没有一个bean或标记为主要的一个。要解决此问题，Spring Cloud Netflix将所有Feign实例标记为`@Primary`，因此Spring Framework将知道要插入哪个bean。在某些情况下，这可能不是理想的。要关闭此行为，请将`@FeignClient`的`primary`属性设置为false。

```
@FeignClient(name = "hello", primary = false)
public interface HelloClient {
	// methods here
}
```

## 23.7 Feign继承支持

Feign通过单继承接口支持样板API。这允许将常用操作分组为方便的基本接口。

**UserService.java。** 

```
public interface UserService {

    @RequestMapping(method = RequestMethod.GET, value ="/users/{id}")
    User getUser(@PathVariable("id") long id);
}
```



**UserResource.java。** 

```
@RestController
public class UserResource implements UserService {

}
```



**UserClient.java。** 

```
package project.user;

@FeignClient("users")
public interface UserClient extends UserService {

}
```



| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 通常不建议在服务器和客户端之间共享接口。它引入了紧密耦合，并且实际上也不能与当前形式的Spring MVC一起使用（方法参数映射不被继承）。 |

## 23.8 Feign请求/响应压缩

您可以考虑为Feign请求启用请求或响应GZIP压缩。您可以通过启用以下属性之一来做到这一点：

```
feign.compression.request.enabled=true
feign.compression.response.enabled=true
```

Feign请求压缩为您提供的设置类似于您为web服务器设置的设置：

```
feign.compression.request.enabled=true
feign.compression.request.mime-types=text/xml,application/xml,application/json
feign.compression.request.min-request-size=2048
```

这些属性使您可以选择压缩媒体类型和最小请求阈值长度。

## 23.9 Feign日志记录

为每个创建的Feign客户端创建一个记录器。默认情况下，记录器的名称是用于创建Feign客户端的接口的全类名称。Feign日志记录仅响应`DEBUG`级别。

**application.yml。** 

```
logging.level.project.user.UserClient: DEBUG
```



您可以为每个客户端配置的`Logger.Level`对象告诉Feign要记录多少。选择是：

- `NONE`，无日志记录（**DEFAULT**）。
- `BASIC`，仅记录请求方法和URL以及响应状态代码和执行时间。
- `HEADERS`，记录基本信息以及请求和响应头。
- `FULL`，记录请求和响应的标题，正文和元数据。

例如，以下内容会将`Logger.Level`设置为`FULL`：

```
@Configuration
public class FooConfiguration {
    @Bean
    Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }
}
```

## 23.10 Feign @QueryMap支持

OpenFeign `@QueryMap`批注支持将POJO用作GET参数映射。不幸的是，默认的OpenFeign QueryMap注释与Spring不兼容，因为它缺少`value`属性。

Spring Cloud OpenFeign提供等效的`@SpringQueryMap`批注，该批注用于将POJO或Map参数注释为查询参数映射。

例如，`Params`类定义参数`param1`和`param2`：

```
// Params.java
public class Params {
    private String param1;
    private String param2;

    // [Getters and setters omitted for brevity]
}
```

以下伪装客户端通过使用`@SpringQueryMap`批注来使用`Params`类：

```
@FeignClient("demo")
public class DemoTemplate {

    @GetMapping(path = "/demo")
    String demoEndpoint(@SpringQueryMap Params params);
}
```

## 23.11故障排除

### 23.11.1早期初始化错误

根据您使用Feign客户端的方式，启动应用程序时可能会看到初始化错误。要变通解决此问题，您可以在自动接线客户端时使用`ObjectProvider`。

```
@Autowired
ObjectProvider<TestFeginClient> testFeginClient;
```

# 第五部分。Spring Cloud Stream

## 24. Spring的数据集成之旅简史

Spring的数据集成之旅始于[Spring Integration](https://projects.spring.io/spring-integration/)。通过其编程模型，它为开发人员提供了一致的开发经验，以构建可以包含[企业集成模式](http://www.enterpriseintegrationpatterns.com/)以与外部系统（例如数据库，消息代理等）连接的应用程序。

快进到云时代，微服务已在企业环境中变得突出。[Spring Boot](https://projects.spring.io/spring-boot/)改变了开发人员构建应用程序的方式。借助Spring的编程模型和Spring Boot处理的运行时职责，无缝开发了基于生产，生产级Spring的独立微服务。

为了将其扩展到数据集成工作负载，Spring Integration和Spring Boot被放到一个新项目中。Spring Cloud Stream出生了。

使用Spring Cloud Stream，开发人员可以：*隔离地构建，测试，迭代和部署以数据为中心的应用程序。*应用现代微服务架构模式，包括通过消息传递进行组合。*以事件为中心的思维将应用程序职责分离。事件可以表示及时发生的事件，下游消费者应用程序可以在不知道事件起源或生产者身份的情况下做出反应。*将业务逻辑移植到消息代理（例如RabbitMQ，Apache Kafka，Amazon Kinesis）上。*通过使用项目Reactor的Flux和Kafka Streams API，可以在基于通道的应用程序和基于非通道的应用程序绑定方案之间进行互操作，以支持无状态和有状态的计算。*依靠框架对常见用例的自动内容类型支持。可以扩展到不同的数据转换类型。

## 25.快速入门

您可以按照以下三步指南在不到5分钟的时间内尝试Spring Cloud Stream。

我们向您展示如何创建一个Spring Cloud Stream应用程序，该应用程序接收来自您选择的消息传递中间件的消息（稍后会详细介绍），并将接收到的消息记录到控制台。我们称之为`LoggingConsumer`。尽管不是很实用，但是它很好地介绍了一些主要概念和抽象，使您更容易理解本用户指南的其余部分。

三个步骤如下：

1. [第25.1节“使用Spring Initializr创建示例应用程序”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-preface-creating-sample-application)
2. [第25.2节“将项目导入IDE”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-preface-importing-project)
3. [第25.3节“添加，处理和构建消息处理程序”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-preface-adding-message-handler)

## 25.1使用Spring Initializr创建示例应用程序

要开始使用，请访问[Spring Initializr](https://start.spring.io/)。从那里，您可以生成我们的`LoggingConsumer`应用程序。为此：

1. 在“ **依赖关系”**部分，开始输入`stream`。当“ cloud stream ”选项出现时，选择它。

2. 开始输入“ kafka”或“rabbit”。

3. 选择“ Kafka ”或“ RabbitMQ ”。

   基本上，您选择应用程序绑定到的消息传递中间件。我们建议您使用已经安装的那种，或者对安装和运行感到更自在。另外，从“启动程序”屏幕上可以看到，还有一些其他选项可以选择。例如，您可以选择Gradle作为构建工具，而不是Maven（默认设置）。

4. 在**工件**字段中，输入“ logging-consumer”。

   **Artifact**字段的值成为应用程序名称。如果您选择RabbitMQ作为中间件，则Spring Initializr现在应该如下所示：

   ![流初始化](/assets/images/springcloud/stream-initializr.png)

5. 单击**生成项目**按钮。

   这样做会将生成的项目的压缩版本下载到硬盘上。

6. 将文件解压缩到要用作项目目录的文件夹中。

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 我们鼓励您探索Spring Initializr中可用的许多可能性。它使您可以创建许多不同种类的Spring应用程序。 |

## 25.2将项目导入IDE

现在，您可以将项目导入到IDE中。请记住，取决于IDE，您可能需要遵循特定的导入过程。例如，根据项目的生成方式（Maven或Gradle），您可能需要遵循特定的导入过程（例如，在Eclipse或STS中，您需要使用File→Import→Maven→现有的Maven项目）。

导入后，该项目必须没有任何错误。另外，`src/main/java`应该包含`com.example.loggingconsumer.LoggingConsumerApplication`。

从技术上讲，此时，您可以运行应用程序的主类。它已经是有效的Spring Boot应用程序。但是，它没有任何作用，因此我们想添加一些代码。

## 25.3添加消息处理程序，构建并运行

修改`com.example.loggingconsumer.LoggingConsumerApplication`类，如下所示：

```java
@SpringBootApplication
@EnableBinding(Sink.class)
public class LoggingConsumerApplication {

	public static void main(String[] args) {
		SpringApplication.run(LoggingConsumerApplication.class, args);
	}

	@StreamListener(Sink.INPUT)
	public void handle(Person person) {
		System.out.println("Received: " + person);
	}

	public static class Person {
		private String name;
		public String getName() {
			return name;
		}
		public void setName(String name) {
			this.name = name;
		}
		public String toString() {
			return this.name;
		}
	}
}
```

从前面的清单中可以看到：

- 我们已经使用`@EnableBinding(Sink.class)`启用了`Sink`绑定（输入无输出）。这样做会向框架发出信号，以启动对消息传递中间件的绑定，在该消息传递中间件自动创建绑定到`Sink.INPUT`通道的目的地（即队列，主题和其他）。
- 我们添加了一个`handler`方法来接收类型为`Person`的传入消息。这样做可以使您看到框架的核心功能之一：它尝试自动将传入的消息有效负载转换为类型`Person`。

您现在有了一个功能齐全的Spring Cloud Stream应用程序，该应用程序确实侦听消息。为了简单起见，我们从这里开始，假设您在[第一步中](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-preface-creating-sample-application)选择了RabbitMQ 。假设已经安装并运行了RabbitMQ，则可以通过在IDE中运行其`main`方法来启动应用程序。

您应该看到以下输出：

```java
	--- [ main] c.s.b.r.p.RabbitExchangeQueueProvisioner : declaring queue for inbound: input.anonymous.CbMIwdkJSBO1ZoPDOtHtCg, bound to: input
	--- [ main] o.s.a.r.c.CachingConnectionFactory       : Attempting to connect to: [localhost:5672]
	--- [ main] o.s.a.r.c.CachingConnectionFactory       : Created new connection: rabbitConnectionFactory#2a3a299:0/SimpleConnection@66c83fc8. . .
	. . .
	--- [ main] o.s.i.a.i.AmqpInboundChannelAdapter      : started inbound.input.anonymous.CbMIwdkJSBO1ZoPDOtHtCg
	. . .
	--- [ main] c.e.l.LoggingConsumerApplication         : Started LoggingConsumerApplication in 2.531 seconds (JVM running for 2.897)
```

转到RabbitMQ管理控制台或任何其他RabbitMQ客户端，然后向`input.anonymous.CbMIwdkJSBO1ZoPDOtHtCg`发送消息。`anonymous.CbMIwdkJSBO1ZoPDOtHtCg`部分代表组名并已生成，因此在您的环境中它一定是不同的。对于更可预测的内容，可以通过设置`spring.cloud.stream.bindings.input.group=hello`（或您喜欢的任何名称）来使用显式组名。

消息的内容应为`Person`类的JSON表示形式，如下所示：

```
{"name":"Sam Spade"}
```

然后，在控制台中，您应该看到：

```
Received: Sam Spade
```

您还可以将应用程序生成并打包到引导jar中（使用`./mvnw clean install`），并使用`java -jar`命令运行生成的JAR。

现在，您有了一个正在运行的（尽管非常基础的）Spring Cloud Stream应用程序。

## 26. 2.0中有什么新功能？

Spring Cloud Stream引入了许多新功能，增强功能和更改。以下各节概述了最值得注意的部分：

- [第26.1节“新功能和组件”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-preface-new-features)
- [第26.2节“显着增强”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-preface-notable-enhancements)

## 26.1新功能和组件

- **轮询使用者**：引入轮询使用者，使应用程序可以控制消息处理速率。请参见 “ [第29.3.5，‘使用轮询消费者](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-streams-overview-using-polled-consumers) ’ ”的更多细节。您也可以阅读[此博客文章](https://spring.io/blog/2018/02/27/spring-cloud-stream-2-0-polled-consumers)以获取更多详细信息。
- **千分尺支持**：度量标准已切换为使用[千分尺](https://micrometer.io/)。`MeterRegistry`也以bean的形式提供，以便自定义应用程序可以将其自动连线以捕获自定义指标。有关更多详细信息[，](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-metrics-emitter)请参见 “ [第37章，*度量标准发射器*](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-metrics-emitter) ”。
- **新的执行器绑定控件**：新的执行器绑定控件使您可以可视化并控制绑定的生命周期。有关更多详细信息，请参见[第30.6节“绑定可视化和控件”](https://www.springcloud.cc/spring-cloud-greenwich.html#_binding_visualization_and_control)。
- **可配置的RetryTemplate**：除了提供配置`RetryTemplate`的属性外，我们现在还允许您提供自己的模板，有效地覆盖了框架提供的模板。要使用它，请在您的应用程序中将其配置为`@Bean`。

## 26.2显着增强

此版本包括以下显着增强：

- [第26.2.1节“致动器和Web依赖关系现在都是可选的”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-preface-actuator-web-dependencies)
- [第26.2.2节“内容类型协商的改进”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-preface-content-type-negotiation-improvements)
- [第26.3节“显着的弃用”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-preface-notable-deprecations)

### 26.2.1执行器和Web依赖项现在都是可选的

如果既不需要执行器也不需要web依赖项，那么此更改将减少已部署应用程序的占用空间。通过手动添加以下依赖项之一，它还使您可以在反应式和常规web范式之间切换。

以下清单显示了如何添加常规的web框架：

```xml
<dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

以下清单显示了如何添加反应式web框架：

```xml
<dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

下表显示了如何添加执行器依赖性：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

### 26.2.2内容类型协商的改进

Verion 2.0的核心主题之一是围绕内容类型协商和消息转换的改进（在一致性和性能方面）。以下摘要概述了该领域的显着变化和改进。有关更多详细信息[，](https://www.springcloud.cc/spring-cloud-greenwich.html#content-type-management)请参见“ [第32章，*内容类型协商*](https://www.springcloud.cc/spring-cloud-greenwich.html#content-type-management) ”部分。此外，[此博客文章还](https://spring.io/blog/2018/02/26/spring-cloud-stream-2-0-content-type-negotiation-and-transformation)包含更多详细信息。

- 现在，所有消息转换**仅**由`MessageConverter`对象处理。
- 我们引入了`@StreamMessageConverter`批注以提供自定义`MessageConverter`对象。
- 我们引入了默认的`Content Type`作为`application/json`，在迁移1.3应用程序或以混合模式（即1.3生产者→2.0消费者）进行操作时，需要考虑该默认值。
- 在无法确定所提供的`MessageHandler`的参数类型的情况下，带有文本有效载荷且`contentType`为`text/…`或`…/json`的消息不再转换为`Message<String>`。 `public void handle(Message<?> message)`或`public void handle(Object payload)`）。此外，强参数类型可能不足以正确地转换消息，因此`contentType`标头可能被某些`MessageConverters`用作补充。

## 26.3显着弃用

从2.0版开始，不推荐使用以下项目：

- [第26.3.1节“ Java序列化（Java Native和Kryo）”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-preface-deprecation-java-serialization)
- [第26.3.2节“不推荐使用的类和方法”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-preface-deprecation-classes-methods)

### 26.3.1 Java序列化（Java本机和Kryo）

`JavaSerializationMessageConverter`和`KryoMessageConverter`暂时保留。但是，我们计划将来将它们移出核心软件包和支持。弃用此文件的主要原因是要标记基于类型，特定于语言的序列化可能在分布式环境中引起的问题，在该环境中，生产者和使用者可能依赖于不同的JVM版本或具有不同版本的支持库（即Kryo）。我们还想提请注意这样一个事实，即消费者和生产者甚至可能都不是基于Java的，因此多语言风格的序列化（即JSON）更适合。

### 26.3.2不推荐使用的类和方法

以下是显着弃用的快速摘要。有关更多详细信息，请参见相应的{spring-cloud-stream-javadoc-current} [javadoc]。

- `SharedChannelRegistry`.使用`SharedBindingTargetRegistry`。
- `Bindings`.符合条件的Beans已通过其类型唯一标识，例如，提供了`Source`，`Processor`或自定义绑定：

```java
public interface Sample {
	String OUTPUT = "sampleOutput";

	@Output(Sample.OUTPUT)
	MessageChannel output();
}
```

- `HeaderMode.raw`.使用`none`，`headers`或`embeddedHeaders`
- `ProducerProperties.partitionKeyExtractorClass`赞成`partitionKeyExtractorName`，而`ProducerProperties.partitionSelectorClass`赞成`partitionSelectorName`。此更改可确保Spring配置和管理两个组件，并以Spring友好的方式对其进行引用。
- `BinderAwareRouterBeanPostProcessor`.在保留该组件的同时，它不再是`BeanPostProcessor`，并且将来会重命名。
- `BinderProperties.setEnvironment(Properties environment)`.使用`BinderProperties.setEnvironment(Map<String, Object> environment)`。

本节将详细介绍如何使用Spring Cloud Stream。它涵盖了诸如创建和运行流应用程序之类的主题。

## 27.简介Spring Cloud Stream

Spring Cloud Stream是用于构建消息驱动的微服务应用程序的框架。Spring Cloud Stream在Spring Boot的基础上创建了独立的生产级Spring应用程序，并使用Spring Integration提供了到消息代理的连接。它提供了来自多家供应商的中间件的合理配置，并介绍了持久性发布-订阅语义，使用者组和分区的概念。

您可以在应用程序中添加`@EnableBinding`批注，以立即连接到消息代理，还可以在方法中添加`@StreamListener`，以使其接收流处理的事件。以下示例显示了接收外部消息的接收器应用程序：

```java
@SpringBootApplication
@EnableBinding(Sink.class)
public class VoteRecordingSinkApplication {

  public static void main(String[] args) {
    SpringApplication.run(VoteRecordingSinkApplication.class, args);
  }

  @StreamListener(Sink.INPUT)
  public void processVote(Vote vote) {
      votingService.recordVote(vote);
  }
}
```

`@EnableBinding`批注将一个或多个接口作为参数（在这种情况下，该参数是单个`Sink`接口）。接口声明输入和输出通道。Spring Cloud Stream提供了`Source`，`Sink`和`Processor`接口。您也可以定义自己的接口。

以下清单显示了`Sink`接口的定义：

```java
public interface Sink {
  String INPUT = "input";

  @Input(Sink.INPUT)
  SubscribableChannel input();
}
```

`@Input`注释标识一个输入通道，接收到的消息通过该输入通道进入应用程序。`@Output`注释标识一个输出通道，已发布的消息通过该输出通道离开应用程序。`@Input`和`@Output`批注可以使用频道名称作为参数。如果未提供名称，则使用带注释的方法的名称。

Spring Cloud Stream为您创建接口的实现。您可以通过自动装配在应用程序中使用它，如以下示例所示（来自测试用例）：

```java
@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = VoteRecordingSinkApplication.class)
@WebAppConfiguration
@DirtiesContext
public class StreamApplicationTests {

  @Autowired
  private Sink sink;

  @Test
  public void contextLoads() {
    assertNotNull(this.sink.input());
  }
}
```

## 28.主要概念

Spring Cloud Stream提供了许多抽象和原语，简化了消息驱动的微服务应用程序的编写。本节概述以下内容：

- [Spring Cloud Stream的应用程序模型](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-application-model)
- [第28.2节“ Binder抽象”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-binder-abstraction)
- [持久的发布-订阅支持](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-persistent-publish-subscribe-support)
- [消费者群体支持](https://www.springcloud.cc/spring-cloud-greenwich.html#consumer-groups)
- [分区支持](https://www.springcloud.cc/spring-cloud-greenwich.html#partitioning)
- [可插拔的Binder SPI](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-binder-api)

## 28.1应用模型

Spring Cloud Stream应用程序由与中间件无关的内核组成。该应用程序通过Spring Cloud Stream注入到其中的输入和输出通道与外界进行通信。通道通过特定于中间件的Binder实现与外部代理连接。



**图28.1 Spring Cloud Stream申请**

![带粘合剂的SCSt](/assets/images/springcloud/SCSt-with-binder.png)



### 28.1.1 Fat JAR

可以从IDE以独立模式运行Spring Cloud Stream应用程序以进行测试。要在生产环境中运行Spring Cloud Stream应用程序，您可以使用为Maven或Gradle提供的标准Spring Boot工具来创建可执行（或“ fat ”）JAR。有关更多详细信息，请参见[Spring Boot参考指南](https://docs.spring.io/spring-boot/docs/current/reference/html/howto-build.html#howto-create-an-executable-jar-with-maven)。

## 28.2 Binder抽象

Spring Cloud Stream为[Kafka](https://github.com/spring-cloud/spring-cloud-stream-binder-kafka)和[Rabbit MQ](https://github.com/spring-cloud/spring-cloud-stream-binder-rabbit)提供了Binder实现。Spring Cloud Stream还包括一个[TestSupportBinder](https://github.com/spring-cloud/spring-cloud-stream/blob/master/spring-cloud-stream-test-support/src/main/java/org/springframework/cloud/stream/test/binder/TestSupportBinder.java)，它使通道保持[不变](https://github.com/spring-cloud/spring-cloud-stream/blob/master/spring-cloud-stream-test-support/src/main/java/org/springframework/cloud/stream/test/binder/TestSupportBinder.java)，因此测试可以与通道直接交互并可靠地断言所接收的内容。您也可以使用可扩展的API编写自己的Binder。

Spring Cloud Stream使用Spring Boot进行配置，而Binder抽象使Spring Cloud Stream应用程序可以灵活地连接中间件。例如，部署者可以在运行时动态选择通道连接到的目的地（例如Kafka topic 或RabbitMQ exchange）。可以通过外部配置属性以及Spring Boot支持的任何形式（包括应用程序参数，环境变量以及`application.yml`或`application.properties`文件）提供这种配置。在[第27章“ *介绍Spring Cloud Stream”*](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-introducing)的接收器示例中，将`spring.cloud.stream.bindings.input.destination`应用程序属性设置为`raw-sensor-data`会使其从`raw-sensor-data` Kafka主题或绑定到该队列的队列中读取`raw-sensor-data` RabbitMQ交换。

Spring Cloud Stream自动检测并使用在类路径上找到的活页夹。您可以使用具有相同代码的不同类型的中间件。为此，在构建时包括一个不同的活页夹。对于更复杂的用例，您还可以在应用程序中打包多个活页夹，并在运行时选择活页夹（甚至为不同的通道使用不同的活页夹）。

## 28.3持久的发布-订阅支持

应用程序之间的通信遵循发布-订阅模型，其中数据通过共享主题进行广播。在下图中可以看到，该图显示了一组交互的Spring Cloud Stream应用程序的典型部署。



**图28.2 Spring Cloud Stream发布-订阅**

![SCSt传感器](/assets/images/springcloud/SCSt-sensors.png)



传感器报告给HTTP端点的数据将发送到名为`raw-sensor-data`的公共目标。从目的地开始，它由计算时间窗平均值的微服务应用程序和另一个将原始数据提取到HDFS（Hadoop分布式文件系统）的微服务应用程序独立处理。为了处理数据，两个应用程序都在运行时将主题声明为其输入。

发布-订阅通信模型降低了生产者和使用者的复杂性，并允许在不中断现有流程的情况下将新应用添加到拓扑中。例如，在平均计算应用程序的下游，您可以添加一个应用程序，该应用程序计算用于显示和监视的最高温度值。然后，您可以添加另一个解释相同平均值流以进行故障检测的应用程序。通过共享主题而不是点对点队列进行所有通信可以减少微服务之间的耦合。

尽管发布-订阅消息传递的概念并不是新概念，但是Spring Cloud Stream采取了额外的步骤，使其成为其应用程序模型的明智选择。通过使用本机中间件支持，Spring Cloud Stream还简化了跨不同平台的发布-订阅模型的使用。

## 28.4消费群体

尽管发布-订阅模型使通过共享主题轻松连接应用程序变得很重要，但是通过创建给定应用程序的多个实例进行扩展的能力同样重要。这样做时，会将应用程序的不同实例置于竞争的消费者关系中，在该消费者关系中，仅其中一个实例可以处理给定消息。

Spring Cloud Stream通过消费者群体的概念对这种行为进行建模。（Spring Cloud Stream消费者组类似于Kafka消费者组并受其启发。）每个消费者绑定都可以使用`spring.cloud.stream.bindings.<channelName>.group`属性来指定组名。对于下图所示的消费者，此属性将设置为`spring.cloud.stream.bindings.<channelName>.group=hdfsWrite`或`spring.cloud.stream.bindings.<channelName>.group=average`。



**图28.3 Spring Cloud Stream消费群体**

![SCSt小组](/assets/images/springcloud/SCSt-groups.png)



订阅给定目标的所有组都将收到已发布数据的副本，但是每个组中只有一个成员从该目标接收给定消息。默认情况下，未指定组时，Spring Cloud Stream会将应用程序分配给与所有其他使用者组具有发布-订阅关系的匿名且独立的单成员使用者组。

## 28.5消费者类型

支持两种类型的使用者：

- 消息驱动（有时称为异步）
- 轮询（有时称为同步）

在2.0版之前，仅支持异步使用者。消息一旦可用，就会被传递，并且有线程可以处理它。

当您希望控制消息的处理速率时，可能需要使用同步使用者。

### 28.5.1耐久性

与公认的Spring Cloud Stream应用程序模型一致，消费者组订阅是持久的。也就是说，活页夹实现可确保组订阅是持久的，并且一旦创建了至少一个组订阅，该组将接收消息，即使在组中所有应用程序停止时发送消息也是如此。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 匿名订阅本质上是非持久的。对于某些活页夹实现（例如RabbitMQ），可能具有非持久的组订阅。 |

通常，在将应用程序绑定到给定目标时，最好始终指定使用者组。扩展Spring Cloud Stream应用程序时，必须为其每个输入绑定指定使用者组。这样做可以防止应用程序的实例接收重复的消息（除非需要这种行为，这是不寻常的）。

## 28.6分区支持

Spring Cloud Stream支持在给定应用程序的多个实例之间分区数据。在分区方案中，物理通信介质（例如代理主题）被视为结构化为多个分区。一个或多个生产者应用程序实例将数据发送到多个消费者应用程序实例，并确保由共同特征标识的数据由同一消费者实例处理。

Spring Cloud Stream提供了用于以统一方式实现分区处理用例的通用抽象。因此，无论代理本身是否自然地被分区（例如，Kafka）（例如，RabbitMQ），都可以使用分区。



**图28.4。Spring Cloud Stream分区**

![SCSt分区](/assets/images/springcloud/SCSt-partitioning.png)



分区是有状态处理中的关键概念，对于确保所有相关数据都一起处理，分区是至关重要的（出于性能或一致性方面的考虑）。例如，在带时间窗的平均计算示例中，重要的是，来自任何给定传感器的所有测量都应由同一应用实例处理。

| ![[注意]](/assets/images/springcloud/note.png)                                 |
| -------------------------------------------------------- |
| 要设置分区处理方案，必须同时配置数据产生端和数据消耗端。 |

## 29.编程模型

要了解编程模型，您应该熟悉以下核心概念：

- **目标Binders：**负责与外部消息传递系统集成的组件。
- **目标绑定：**在外部消息传递系统和应用程序之间提供的消息的*生产者*和*使用者*（由目标Binders创建）之间的桥梁。
- **消息：**生产者和消费者用来与目的地Binders（以及因此通过外部消息系统进行的其他应用程序）通信的规范数据结构。

![SCSt概述](/assets/images/springcloud/SCSt-overview.png)

## 29.1目的地Binders

目标Binders是Spring Cloud Stream的扩展组件，负责提供必要的配置和实现以促进与外部消息传递系统的集成。这种集成负责连接，委派和与生产者和消费者之间的消息路由，数据类型转换，用户代码调用等等。

Binders承担了许多样板工作，否则这些工作就落在了您的肩上。但是，要实现这一点，活页夹仍然需要用户提供的一些简单但需要的指令集形式的帮助，通常以某种类型的配置形式出现。

尽管讨论所有可用的绑定器和绑定配置选项（本手册的其余部分都涉及它们）不在本节的讨论范围之内，但 *目标绑定*确实需要特别注意。下一节将详细讨论。

## 29.2目标绑定

如前所述，*目标绑定*提供了外部消息传递系统与应用程序提供的*生产者*和*消费者*之间的桥梁。

将@EnableBinding批注应用于应用程序的配置类之一可定义目标绑定。`@EnableBinding`注释本身使用`@Configuration`进行元注释，并触发Spring Cloud Stream基础结构的配置。

下面的示例显示了一个功能完整且运行正常的Spring Cloud Stream应用程序，该应用程序从`INPUT`目标接收的消息净荷为`String`类型（请参见[第32章，*内容类型协商*](https://www.springcloud.cc/spring-cloud-greenwich.html#content-type-management)部分），并将其记录到控制台，并将其转换为大写字母后将其发送到`OUTPUT`目标。

```java
@SpringBootApplication
@EnableBinding(Processor.class)
public class MyApplication {

	public static void main(String[] args) {
		SpringApplication.run(MyApplication.class, args);
	}

	@StreamListener(Processor.INPUT)
	@SendTo(Processor.OUTPUT)
	public String handle(String value) {
		System.out.println("Received: " + value);
		return value.toUpperCase();
	}
}
```

如您所见，`@EnableBinding`批注可以将一个或多个接口类作为参数。这些参数称为*绑定*，它们包含表示*可绑定组件的*方法。这些组件通常是基于通道的活页夹（例如Rabbit，Kafka等）的消息通道（请参见[Spring消息传递](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-messaging.html)）。但是，其他类型的绑定可以为相应技术的本机功能提供支持。例如，Kafka Streams绑定器（以前称为KStream）允许直接绑定到Kafka Streams（有关更多详细信息，请参见[Kafka Streams](https://docs.spring.io/autorepo/docs/spring-cloud-stream-binder-kafka-docs/1.1.0.M1/reference/htmlsingle/)）。

Spring Cloud Stream已经为典型的消息交换合同提供了*绑定*接口，其中包括：

- **接收器：**通过提供消费消息的目的地来标识消息消费者的合同。
- **源：**通过提供将生成的消息发送到的目的地，来标识消息生产者的合同。
- **处理器：**通过公开两个允许使用和产生消息的目的地，封装了接收器和源协定。

```java
public interface Sink {

  String INPUT = "input";

  @Input(Sink.INPUT)
  SubscribableChannel input();
}
public interface Source {

  String OUTPUT = "output";

  @Output(Source.OUTPUT)
  MessageChannel output();
}
public interface Processor extends Source, Sink {}
```

尽管前面的示例满足了大多数情况，但是您也可以通过定义自己的绑定接口并使用`@Input`和`@Output`批注来标识实际的*可绑定组件*，从而定义自己的合同。

例如：

```
public interface Barista {

    @Input
    SubscribableChannel orders();

    @Output
    MessageChannel hotDrinks();

    @Output
    MessageChannel coldDrinks();
}
```

将上一个示例中显示的接口用作`@EnableBinding`的参数将分别触发三个绑定通道的创建，分别命名为`orders`，`hotDrinks`和`coldDrinks`。

您可以根据需要提供任意数量的绑定接口，作为`@EnableBinding`批注的参数，如以下示例所示：

```
@EnableBinding(value = { Orders.class, Payment.class })
```

在Spring Cloud Stream中，可绑定的`MessageChannel`组件是Spring消息传递`MessageChannel`（用于出站）及其扩展名`SubscribableChannel`（用于入站）。

**可轮询的目标绑定**

尽管前面描述的绑定支持基于事件的消息使用，但是有时您需要更多控制，例如使用率。

从2.0版开始，您现在可以绑定可轮询的使用者：

以下示例显示了如何绑定可轮询的使用者：

```
public interface PolledBarista {

    @Input
    PollableMessageSource orders();
	. . .
}
```

在这种情况下，`PollableMessageSource`的实现绑定到`orders`“通道”。有关更多详细信息[，](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-streams-overview-using-polled-consumers)请参见[第29.3.5节“使用轮询的使用者”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-streams-overview-using-polled-consumers)。

**自定义频道名称**

通过使用`@Input`和`@Output`批注，可以为该通道指定自定义的通道名称，如以下示例所示：

```
public interface Barista {
    @Input("inboundOrders")
    SubscribableChannel orders();
}
```

在前面的示例中，创建的绑定通道被命名为`inboundOrders`。

通常，您不需要直接访问各个通道或绑定（除非通过`@EnableBinding`注释对其进行配置）。但是，您有时可能会遇到诸如测试或其他极端情况的情况。

除了为每个绑定生成通道并将其注册为Spring beans外，对于每个绑定接口，Spring Cloud Stream还会生成一个实现该接口的bean。这意味着您可以通过在应用程序中自动接线来访问表示绑定或各个通道的接口，如以下两个示例所示：

*自动接线绑定界面*

```
@Autowire
private Source source

public void sayHello(String name) {
    source.output().send(MessageBuilder.withPayload(name).build());
}
```

*自动连线个别频道*

```
@Autowire
private MessageChannel output;

public void sayHello(String name) {
    output.send(MessageBuilder.withPayload(name).build());
}
```

对于自定义通道名称或在需要特别命名通道的多通道方案中，您也可以使用标准Spring的`@Qualifier`批注。

下面的示例演示如何以这种方式使用@Qualifier批注：

```
@Autowire
@Qualifier("myChannel")
private MessageChannel output;
```

## 29.3产生和消耗消息

您可以使用Spring Integration注释或Spring Cloud Stream本机注释编写Spring Cloud Stream应用程序。

### 29.3.1 Spring Integration支持

Spring Cloud Stream建立在[Enterprise Integration Patterns](http://www.enterpriseintegrationpatterns.com/)定义的概念和模式的基础之上，并依靠其内部实现依赖于Spring项目组合[Spring Integration](https://projects.spring.io/spring-integration/)框架中已经建立且流行的Enterprise Integration Patterns实现 。

因此，它支持Spring Integration已经建立的基础，语义和配置选项是很自然的。

例如，您可以将`Source`的输出通道附加到`MessageSource`并使用熟悉的`@InboundChannelAdapter`注释，如下所示：

```
@EnableBinding(Source.class)
public class TimerSource {

  @Bean
  @InboundChannelAdapter(value = Source.OUTPUT, poller = @Poller(fixedDelay = "10", maxMessagesPerPoll = "1"))
  public MessageSource<String> timerMessageSource() {
    return () -> new GenericMessage<>("Hello Spring Cloud Stream");
  }
}
```

同样，可以在提供*处理器*绑定合同的消息处理程序方法的实现时使用@Transformer或@ServiceActivator ，如以下示例所示：

```
@EnableBinding(Processor.class)
public class TransformProcessor {
  @Transformer(inputChannel = Processor.INPUT, outputChannel = Processor.OUTPUT)
  public Object transform(String message) {
    return message.toUpperCase();
  }
}
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 尽管这可能会略过一些，但重要的是要了解，当您使用`@StreamListener`注释从同一绑定进行消费时，将使用pub-sub模型。用`@StreamListener`注释的每种方法都收到其自己的消息副本，并且每种方法都有其自己的使用者组。但是，如果通过使用Spring Integration批注之一（例如`@Aggregator`，`@Transformer`或`@ServiceActivator`）从同一绑定中消费，则这些消费在竞争模型中。没有为每个订阅创建单独的消费者组。 |

### 29.3.2使用@StreamListener注释

作为对Spring Integration支持的补充，Spring Cloud Stream提供了自己的`@StreamListener`注释，其模仿其他Spring消息注释（`@MessageMapping`，`@JmsListener`，`@RabbitListener`等）并提供便利，例如基于内容的路由等。

```
@EnableBinding(Sink.class)
public class VoteHandler {

  @Autowired
  VotingService votingService;

  @StreamListener(Sink.INPUT)
  public void handle(Vote vote) {
    votingService.record(vote);
  }
}
```

与其他Spring消息传递方法一样，方法参数可以用`@Payload`，`@Headers`和`@Header`进行注释。

对于返回数据的方法，必须使用`@SendTo`批注为该方法返回的数据指定输出绑定目标，如以下示例所示：

```
@EnableBinding(Processor.class)
public class TransformProcessor {

  @Autowired
  VotingService votingService;

  @StreamListener(Processor.INPUT)
  @SendTo(Processor.OUTPUT)
  public VoteResult handle(Vote vote) {
    return votingService.record(vote);
  }
}
```

### 29.3.3使用@StreamListener进行基于内容的路由

Spring Cloud Stream支持根据条件将消息调度到用`@StreamListener`注释的多个处理程序方法。

为了有资格支持条件分派，一种方法必须满足以下条件：

- 它不能返回值。
- 它必须是单独的消息处理方法（不支持反应性API方法）。

该条件由注释的`condition`参数中的SpEL表达式指定，并针对每条消息进行评估。所有与条件匹配的处理程序都在同一线程中调用，并且不必假设调用的顺序。

在具有分配条件的`@StreamListener`的以下示例中，所有带有标头`type`且具有值`bogey`的消息都被分配到`receiveBogey`方法，所有带有标头{11的消息值`bacall`的/}发送到`receiveBacall`方法。

```
@EnableBinding(Sink.class)
@EnableAutoConfiguration
public static class TestPojoWithAnnotatedArguments {

    @StreamListener(target = Sink.INPUT, condition = "headers['type']=='bogey'")
    public void receiveBogey(@Payload BogeyPojo bogeyPojo) {
       // handle the message
    }

    @StreamListener(target = Sink.INPUT, condition = "headers['type']=='bacall'")
    public void receiveBacall(@Payload BacallPojo bacallPojo) {
       // handle the message
    }
}
```

**`condition`上下文中的内容类型协商**

了解使用`@StreamListener`参数`condition`的基于内容的路由背后的一些机制很重要，尤其是在整个消息类型的上下文中。如果在继续之前熟悉[第32章，*内容类型协商*](https://www.springcloud.cc/spring-cloud-greenwich.html#content-type-management)[，](https://www.springcloud.cc/spring-cloud-greenwich.html#content-type-management)这也可能会有所帮助。

请考虑以下情形：

```
@EnableBinding(Sink.class)
@EnableAutoConfiguration
public static class CatsAndDogs {

    @StreamListener(target = Sink.INPUT, condition = "payload.class.simpleName=='Dog'")
    public void bark(Dog dog) {
       // handle the message
    }

    @StreamListener(target = Sink.INPUT, condition = "payload.class.simpleName=='Cat'")
    public void purr(Cat cat) {
       // handle the message
    }
}
```

前面的代码是完全有效的。它可以毫无问题地进行编译和部署，但是永远不会产生您期望的结果。

这是因为您正在测试的东西在您期望的状态下尚不存在。这是因为消息的有效负载尚未从有线格式（`byte[]`）转换为所需的类型。换句话说，它尚未经过[第32章，*内容类型协商*](https://www.springcloud.cc/spring-cloud-greenwich.html#content-type-management)中描述的类型转换过程。

因此，除非使用SPeL表达式评估原始数据（例如，字节数组中第一个字节的值），否则请使用基于消息标头的表达式（例如`condition = "headers['type']=='dog'"`）。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 目前，仅基于通道的绑定程序（不支持响应编程）支持通过`@StreamListener`条件进行分派。 |

### 29.3.4 Spring Cloud功能支持

从Spring Cloud Stream v2.1开始，定义*流处理程序*和*源的*另一种方法是使用对[Spring Cloud函数的](https://cloud.spring.io/spring-cloud-function/)内置支持，其中可以将它们表示为`java.util.function.[Supplier/Function/Consumer]`类型的beans。

若要指定要绑定到绑定公开的外部目标的功能bean，必须提供`spring.cloud.stream.function.definition`属性。

这是Processor应用程序将消息处理程序公开为`java.util.function.Function`的示例

```
@SpringBootApplication
@EnableBinding(Processor.class)
public class MyFunctionBootApp {

	public static void main(String[] args) {
		SpringApplication.run(MyFunctionBootApp.class, "--spring.cloud.stream.function.definition=toUpperCase");
	}

	@Bean
	public Function<String, String> toUpperCase() {
		return s -> s.toUpperCase();
	}
}
```

在上面的代码中，我们仅定义了类型为`java.util.function.Function`的bean（称为*toUpperCase）*并将其标识为bean，用作消息处理程序，其“输入”和“输出”必须绑定到外部目标由处理器绑定公开。

以下是支持源，处理器和接收器的简单功能应用程序的示例。

这是定义为`java.util.function.Supplier`的Source应用程序的示例

```
@SpringBootApplication
@EnableBinding(Source.class)
public static class SourceFromSupplier {
	public static void main(String[] args) {
		SpringApplication.run(SourceFromSupplier.class, "--spring.cloud.stream.function.definition=date");
	}
	@Bean
	public Supplier<Date> date() {
		return () -> new Date(12345L);
	}
}
```

这是定义为`java.util.function.Function`的Processor应用程序的示例

```
@SpringBootApplication
@EnableBinding(Processor.class)
public static class ProcessorFromFunction {
	public static void main(String[] args) {
		SpringApplication.run(ProcessorFromFunction.class, "--spring.cloud.stream.function.definition=toUpperCase");
	}
	@Bean
	public Function<String, String> toUpperCase() {
		return s -> s.toUpperCase();
	}
}
```

这是一个定义为`java.util.function.Consumer`的接收器应用程序的示例

```
@EnableAutoConfiguration
@EnableBinding(Sink.class)
public static class SinkFromConsumer {
	public static void main(String[] args) {
		SpringApplication.run(SinkFromConsumer.class, "--spring.cloud.stream.function.definition=sink");
	}
	@Bean
	public Consumer<String> sink() {
		return System.out::println;
	}
}
```

#### 功能组成

使用此编程模型，您还可以从功能组合中受益，在该功能组合中，您可以从一组简单的函数中动态组成复杂的处理程序。作为示例，我们将以下函数bean添加到上面定义的应用程序中

```
@Bean
public Function<String, String> wrapInQuotes() {
	return s -> "\"" + s + "\"";
}
```

并修改`spring.cloud.stream.function.definition`属性以反映您打算从'toUpperCase'和'wrapInQuotes'编写新函数的意图。为此，可以使用Spring Cloud函数使用`|`（管道）符号。因此，完成我们的示例，我们的属性现在将如下所示：

```
—spring.cloud.stream.function.definition=toUpperCase|wrapInQuotes
```

### 29.3.5使用轮询的使用者

#### 总览

使用轮询的使用者时，您可以按需轮询`PollableMessageSource`。考虑以下受调查消费者的示例：

```
public interface PolledConsumer {

    @Input
    PollableMessageSource destIn();

    @Output
    MessageChannel destOut();

}
```

给定上一个示例中的受调查消费者，您可以按以下方式使用它：

```
@Bean
public ApplicationRunner poller(PollableMessageSource destIn, MessageChannel destOut) {
    return args -> {
        while (someCondition()) {
            try {
                if (!destIn.poll(m -> {
                    String newPayload = ((String) m.getPayload()).toUpperCase();
                    destOut.send(new GenericMessage<>(newPayload));
                })) {
                    Thread.sleep(1000);
                }
            }
            catch (Exception e) {
                // handle failure
            }
        }
    };
}
```

`PollableMessageSource.poll()`方法采用一个`MessageHandler`参数（通常为lambda表达式，如此处所示）。如果收到并成功处理了消息，它将返回`true`。

与消息驱动的使用者一样，如果`MessageHandler`引发异常，消息将发布到错误通道，如“ [???”中所述。](https://www.springcloud.cc/spring-cloud-greenwich.html#)”。

通常，`poll()`方法会在`MessageHandler`退出时确认该消息。如果该方法异常退出，则该消息将被拒绝（不重新排队），但请参阅[“处理错误”一节](https://www.springcloud.cc/spring-cloud-greenwich.html#polled-errors)。您可以通过对确认负责来覆盖该行为，如以下示例所示：

```
@Bean
public ApplicationRunner poller(PollableMessageSource dest1In, MessageChannel dest2Out) {
    return args -> {
        while (someCondition()) {
            if (!dest1In.poll(m -> {
                StaticMessageHeaderAccessor.getAcknowledgmentCallback(m).noAutoAck();
                // e.g. hand off to another thread which can perform the ack
                // or acknowledge(Status.REQUEUE)

            })) {
                Thread.sleep(1000);
            }
        }
    };
}
```

| ![[重要]](/assets/images/springcloud/important.png)                           | 重要 |
| ------------------------------------------------------- | ---- |
| 您必须在某一时刻`ack`（或`nack`）消息，以避免资源泄漏。 |      |

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 某些消息传递系统（例如Apache Kafka）在日志中维护简单的偏移量。如果传递失败，并用`StaticMessageHeaderAccessor.getAcknowledgmentCallback(m).acknowledge(Status.REQUEUE);`重新排队，则重新传递任何以后成功确认的消息。 |      |

还有一个重载的`poll`方法，其定义如下：

```
poll(MessageHandler handler, ParameterizedTypeReference<?> type)
```

`type`是一个转换提示，它允许转换传入的消息有效负载，如以下示例所示：

```
boolean result = pollableSource.poll(received -> {
			Map<String, Foo> payload = (Map<String, Foo>) received.getPayload();
            ...

		}, new ParameterizedTypeReference<Map<String, Foo>>() {});
```

#### 处理错误

默认情况下，为可轮询源配置了一个错误通道。如果回调引发异常，则将`ErrorMessage`发送到错误通道（`<destination>.<group>.errors`）；此错误通道也桥接到全局Spring Integration `errorChannel`。

您可以使用`@ServiceActivator`订阅任何一个错误通道来处理错误。如果没有订阅，则将仅记录错误并确认消息成功。如果错误通道服务激活器引发异常，则该消息将被拒绝（默认情况下），并且不会重新发送。如果服务激活器抛出`RequeueCurrentMessageException`，则该消息将在代理处重新排队，并在随后的轮询中再次检索。

如果侦听器直接抛出`RequeueCurrentMessageException`，则如上所述，该消息将重新排队，并且不会发送到错误通道。

## 29.4错误处理

错误会发生，Spring Cloud Stream提供了几种灵活的机制来处理它们。错误处理有两种形式：

- **应用程序：**错误处理是在应用程序（自定义错误处理程序）中完成的。
- **系统：**将错误处理委托给绑定程序（重新排队，DL和其他）。注意，这些技术取决于绑定程序的实现和底层消息传递中间件的功能。

Spring Cloud Stream使用[Spring重试](https://github.com/spring-projects/spring-retry)库来促进成功的消息处理。有关更多详细信息[，](https://www.springcloud.cc/spring-cloud-greenwich.html#_retry_template)请参见[第29.4.3节“重试模板”](https://www.springcloud.cc/spring-cloud-greenwich.html#_retry_template)。但是，当所有方法均失败时，消息处理程序引发的异常将传播回绑定程序。那时，活页夹调用自定义错误处理程序或将错误传达回消息传递系统（重新排队，DLQ等）。

### 29.4.1应用程序错误处理

有两种类型的应用程序级错误处理。可以在每个绑定订阅中处理错误，或者全局处理程序可以处理所有绑定订阅错误。让我们查看详细信息。



**图29.1 具有自定义和全局错误处理程序的Spring Cloud Stream接收器应用程序**

![自定义与全局错误通道](/assets/images/springcloud/custom_vs_global_error_channels.png)



对于每个输入绑定，Spring Cloud Stream创建具有以下语义`<destinationName>.errors`的专用错误通道。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| `<destinationName>`由绑定的名称（例如`input`）和组的名称（例如`myGroup`）组成。 |

考虑以下：

```
spring.cloud.stream.bindings.input.group=myGroup
@StreamListener(Sink.INPUT) // destination name 'input.myGroup'
public void handle(Person value) {
	throw new RuntimeException("BOOM!");
}

@ServiceActivator(inputChannel = Processor.INPUT + ".myGroup.errors") //channel name 'input.myGroup.errors'
public void error(Message<?> message) {
	System.out.println("Handling ERROR: " + message);
}
```

在前面的示例中，目标名称为`input.myGroup`，专用错误通道名称为`input.myGroup.errors`。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| @StreamListener批注的使用专门用于定义桥接内部通道和外部目标的绑定。假设目标特定错误通道没有关联的外部目标，则该通道是Spring Integration（SI）的特权。这意味着必须使用SI处理程序注释之一（即@ ServiceActivator，@ Transformer等）定义用于此类目标的处理程序。 |

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 如果未指定`group`，则使用匿名组（类似于`input.anonymous.2K37rb06Q6m2r51-SPIDDQ`），这不适用于错误处理方案，因为在创建目标之前，您不知道它将是什么。 |

另外，如果您绑定到现有目的地，例如：

```
spring.cloud.stream.bindings.input.destination=myFooDestination
spring.cloud.stream.bindings.input.group=myGroup
```

完整的目标名称为`myFooDestination.myGroup`，然后专用错误通道名称为`myFooDestination.myGroup.errors`。

回到例子...

预订名为`input`的通道的`handle(..)`方法会引发异常。给定错误通道`input.myGroup.errors`的订阅者，所有错误消息均由该订阅者处理。

如果您有多个绑定，则可能需要一个错误处理程序。Spring Cloud Stream 通过将每个单独的错误通道桥接到名为`errorChannel`的通道来自动提供对*全局错误通道*的支持，从而允许单个订阅者处理所有错误，如以下示例所示：

```
@StreamListener("errorChannel")
public void error(Message<?> message) {
	System.out.println("Handling ERROR: " + message);
}
```

如果错误处理逻辑相同，则与哪个处理程序产生错误无关，这可能是一个方便的选择。

### 29.4.2系统错误处理

系统级错误处理意味着将错误传递回消息传递系统，并且鉴于并非每个消息传递系统都相同，因此各个粘合剂的功能可能有所不同。

也就是说，在本节中，我们解释了系统级错误处理背后的一般思想，并以Rabbit活页夹为例。注意：Kafka活页夹提供了类似的支持，尽管某些配置属性确实有所不同。另外，有关更多详细信息和配置选项，请参见各个活页夹的文档。

如果未配置内部错误处理程序，则错误将传播到绑定程序，而绑定程序随后会将这些错误传播回消息传递系统。根据消息传递系统的功能，此类系统可能会*丢弃*该消息，*重新排队*该消息以进行重新处理或*将失败的消息发送给DLQ*。Rabbit和Kafka都支持这些概念。但是，其他联编程序可能没有，因此请参阅您单独的联编程序的文档，以获取有关受支持的系统级错误处理选项的详细信息。

#### 删除失败的消息

默认情况下，如果未提供其他系统级配置，则消息传递系统将丢弃失败的消息。尽管在某些情况下可以接受，但在大多数情况下是不可接受的，我们需要一些恢复机制来避免消息丢失。

#### DLQ-死信队列

DLQ允许将失败的消息发送到特殊目标：*-Dead Letter Queue*。

配置后，失败的消息将发送到此目标，以进行后续的重新处理或审核与对帐。

例如，继续前面的示例，并使用Rabbit活页夹设置DLQ，您需要设置以下属性：

```
spring.cloud.stream.rabbit.bindings.input.consumer.auto-bind-dlq=true
```

请记住，在以上属性中，`input`对应于输入目标绑定的名称。`consumer`指示它是消费者属性，`auto-bind-dlq`指示绑定程序为`input`目标配置DLQ，这将导致名为`input.myGroup.dlq`的附加Rabbit队列。

配置完成后，所有失败的消息都会通过错误消息路由到此队列，类似于以下内容：

```
delivery_mode:	1
headers:
x-death:
count:	1
reason:	rejected
queue:	input.hello
time:	1522328151
exchange:
routing-keys:	input.myGroup
Payload {"name”:"Bob"}
```

从上面可以看到，原始消息会保留下来以供进一步操作。

但是，您可能已经注意到的一件事是，有关消息处理的原始问题的信息有限。例如，您看不到与原始错误相对应的堆栈跟踪。要获取有关原始错误的更多相关信息，您必须设置一个附加属性：

```
spring.cloud.stream.rabbit.bindings.input.consumer.republish-to-dlq=true
```

这样做会强制内部错误处理程序在将错误消息发布到DLQ之前拦截该错误消息并向其添加其他信息。配置完成后，您会看到错误消息包含与原始错误有关的更多信息，如下所示：

```
delivery_mode:	2
headers:
x-original-exchange:
x-exception-message:	has an error
x-original-routingKey:	input.myGroup
x-exception-stacktrace:	org.springframework.messaging.MessageHandlingException: nested exception is
      org.springframework.messaging.MessagingException: has an error, failedMessage=GenericMessage [payload=byte[15],
      headers={amqp_receivedDeliveryMode=NON_PERSISTENT, amqp_receivedRoutingKey=input.hello, amqp_deliveryTag=1,
      deliveryAttempt=3, amqp_consumerQueue=input.hello, amqp_redelivered=false, id=a15231e6-3f80-677b-5ad7-d4b1e61e486e,
      amqp_consumerTag=amq.ctag-skBFapilvtZhDsn0k3ZmQg, contentType=application/json, timestamp=1522327846136}]
      at org.spring...integ...han...MethodInvokingMessageProcessor.processMessage(MethodInvokingMessageProcessor.java:107)
      at. . . . .
Payload {"name”:"Bob"}
```

这有效地结合了应用程序级和系统级的错误处理，以进一步协助下游故障排除机制。

#### 重新排队失败的消息

如前所述，当前支持的活页夹（Rabbit和Kafka）依靠`RetryTemplate`来促进成功的消息处理。有关详细信息[，](https://www.springcloud.cc/spring-cloud-greenwich.html#_retry_template)请参见[第29.4.3节“重试模板”](https://www.springcloud.cc/spring-cloud-greenwich.html#_retry_template)。但是，对于`max-attempts`属性设置为1的情况，将禁用消息的内部重新处理。此时，您可以通过指示消息传递系统重新排队失败的消息来促进消息的重新处理（重试）。重新排队后，失败的消息将被发送回原始处理程序，从而创建一个重试循环。

如果错误的性质与某些资源的偶发性但短期不可用有关，则此选项可能是可行的。

为此，必须设置以下属性：

```
spring.cloud.stream.bindings.input.consumer.max-attempts=1
spring.cloud.stream.rabbit.bindings.input.consumer.requeue-rejected=true
```

在前面的示例中，`max-attempts`设置为1，实际上禁用了内部重试，而`requeue-rejected`（*重新排队拒绝消息的*缩写）被设置为`true`。设置后，失败的消息将重新提交给同一处理程序并连续循环，直到处理程序抛出`AmqpRejectAndDontRequeueException`为止，从本质上讲，您可以在处理程序本身内构建自己的重试逻辑。

### 29.4.3重试模板

`RetryTemplate`是[Spring重试](https://github.com/spring-projects/spring-retry)库的一部分。尽管涵盖`RetryTemplate`的所有功能超出了本文档的范围，但我们将提及以下与`RetryTemplate`特别相关的使用者属性：

- maxAttempts

  处理消息的尝试次数。默认值：3。

- backOffInitialInterval

  重试时的退避初始间隔。默认值1000毫秒。

- backOffMaxInterval

  最大退避间隔。默认值10000毫秒。

- backOffMultiplier

  退避乘数。默认为2.0。

- defaultRetryable

  `retryableExceptions`中未列出的由侦听器引发的异常是否可以重试。默认值：`true`。

- retryableExceptions

  键中Throwable类名称的映射，值中布尔值的映射。指定将要重试的那些异常（和子类）。另请参见`defaultRetriable`。示例：`spring.cloud.stream.bindings.input.consumer.retryable-exceptions.java.lang.IllegalStateException=false`。默认值：空。

尽管上述设置足以满足大多数自定义要求，但它们可能无法满足某些复杂的要求，此时，您可能希望提供自己的`RetryTemplate`实例。为此，在应用程序配置中将其配置为bean。应用程序提供的实例将覆盖框架提供的实例。另外，为避免冲突，必须将绑定程序要使用的`RetryTemplate`实例限定为`@StreamRetryTemplate`。例如，

```
@StreamRetryTemplate
public RetryTemplate myRetryTemplate() {
    return new RetryTemplate();
}
```

从上面的示例中可以看到，由于`@StreamRetryTemplate`是合格的`@Bean`，因此无需使用`@Bean`对其进行注释。

## 29.5反应式编程支持

Spring Cloud Stream还支持使用反应式API，将传入和传出的数据作为连续的数据流进行处理。可通过`spring-cloud-stream-reactive`获得对反应式API的支持，需要将其显式添加到您的项目中。

具有响应式API的编程模型是声明性的。您可以使用描述从入站数据流到出站数据流的功能转换的运算符，而不是指定每个消息的处理方式。

目前Spring Cloud Stream仅支持[Reactor API](https://projectreactor.io/)。将来，我们打算支持基于反应式流的更通用的模型。

反应式编程模型还使用`@StreamListener`注释来设置反应式处理程序。区别在于：

- `@StreamListener`批注不能指定输入或输出，因为它们作为参数提供并从方法返回值。
- 该方法的参数必须用`@Input`和`@Output`注释，分别指示传入和传出数据流连接到哪个输入或输出。
- 该方法的返回值（如果有）用`@Output`注释，指示应该将数据发送到的输入。

| ![[注意]](/assets/images/springcloud/note.png)     |
| ---------------------------- |
| 响应式编程支持需要Java 1.8。 |

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 从Spring Cloud Stream 1.1.1起（从发行版Brooklyn.SR2开始），反应式编程支持要求使用Reactor 3.0.4.RELEASE及更高版本。不支持更早的Reactor版本（包括3.0.1.RELEASE，3.0.2.RELEASE和3.0.3.RELEASE）。`spring-cloud-stream-reactive`可传递地检索正确的版本，但是项目结构可以将`io.projectreactor:reactor-core`的版本管理为早期版本，尤其是在使用Maven时。使用Spring Initializr和Spring Boot 1.x生成的项目就是这种情况，该项目将Reactor版本覆盖为`2.0.8.RELEASE`。在这种情况下，必须确保发布了正确版本的工件。您可以通过在项目中添加对版本为`3.0.4.RELEASE`或更高版本的`io.projectreactor:reactor-core`的直接依赖来实现。 |

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 当前，术语“ 反应式 ”的使用是指正在使用的反应式API，而不是指执行模型是反应式的（也就是说，绑定的端点仍然使用“推”式而非“拉式”模型）。尽管通过使用Reactor提供了一些反压支持，但在将来的发行版中，我们确实打算通过对连接的中间件使用本机反应性客户端来完全支持反应性管道。 |

### 29.5.1基于Reactor的处理程序

基于Reactor的处理程序可以具有以下参数类型：

- 对于带有`@Input`注释的参数，它支持Reactor `Flux`类型。入站Flux的参数化遵循与处理单个消息时相同的规则：可以是整个`Message`，可以是`Message`有效负载的POJO或由于以下原因而产生的POJO：基于`Message`内容类型标头的转换。提供了多个输入。
- 对于带有`Output`注释的参数，它支持`FluxSender`类型，该类型将方法生成的`Flux`与输出连接起来。一般而言，仅在该方法可以具有多个输出时才建议将输出指定为参数。

基于Reactor的处理程序支持`Flux`的返回类型。在这种情况下，必须用`@Output`进行注释。当单个输出`Flux`可用时，建议使用该方法的返回值。

以下示例显示了基于Reactor的`Processor`：

```
@EnableBinding(Processor.class)
@EnableAutoConfiguration
public static class UppercaseTransformer {

  @StreamListener
  @Output(Processor.OUTPUT)
  public Flux<String> receive(@Input(Processor.INPUT) Flux<String> input) {
    return input.map(s -> s.toUpperCase());
  }
}
```

使用输出参数的同一处理器看起来像以下示例：

```
@EnableBinding(Processor.class)
@EnableAutoConfiguration
public static class UppercaseTransformer {

  @StreamListener
  public void receive(@Input(Processor.INPUT) Flux<String> input,
     @Output(Processor.OUTPUT) FluxSender output) {
     output.send(input.map(s -> s.toUpperCase()));
  }
}
```

### 29.5.2反应源

Spring Cloud Stream反应性支持还提供了通过`@StreamEmitter`注释创建反应性源的功能。通过使用`@StreamEmitter`批注，可以将常规源转换为被动源。`@StreamEmitter`是方法级别的注释，用于将方法标记为用`@EnableBinding`声明的输出的发射器。您不能将`@Input`批注与`@StreamEmitter`一起使用，因为标有该批注的方法不会监听任何输入。而是用标记为`@StreamEmitter`的方法生成输出。遵循`@StreamListener`中使用的相同编程模型，`@StreamEmitter`还允许灵活地使用`@Output`批注，具体取决于方法是否具有任何参数，返回类型和其他考虑因素。

本节的其余部分包含使用各种样式的`@StreamEmitter`批注的示例。

以下示例每毫秒发出一次`Hello, World`消息，并发布到Reactor `Flux`中：

```
@EnableBinding(Source.class)
@EnableAutoConfiguration
public static class HelloWorldEmitter {

  @StreamEmitter
  @Output(Source.OUTPUT)
  public Flux<String> emit() {
    return Flux.intervalMillis(1)
            .map(l -> "Hello World");
  }
}
```

在前面的示例中，`Flux`中的结果消息被发送到`Source`的输出通道。

下一个示例是`@StreamEmmitter`的另一种形式，它发送Reactor `Flux`。以下方法代替返回`Flux`，而是使用`FluxSender`从源代码中以编程方式发送`Flux`：

```
@EnableBinding(Source.class)
@EnableAutoConfiguration
public static class HelloWorldEmitter {

  @StreamEmitter
  @Output(Source.OUTPUT)
  public void emit(FluxSender output) {
    output.send(Flux.intervalMillis(1)
            .map(l -> "Hello World"));
  }
}
```

下一个示例在功能和样式上与上述代码段完全相同。但是，它没有在方法上使用显式的`@Output`注释，而是在方法参数上使用了注释。

```
@EnableBinding(Source.class)
@EnableAutoConfiguration
public static class HelloWorldEmitter {

  @StreamEmitter
  public void emit(@Output(Source.OUTPUT) FluxSender output) {
    output.send(Flux.intervalMillis(1)
            .map(l -> "Hello World"));
  }
}
```

本节的最后一个示例是使用Reactive Streams Publisher API并利用[Spring Integration Java DSL中](https://github.com/spring-projects/spring-integration-java-dsl/wiki/Spring-Integration-Java-DSL-Reference)对它的支持来编写反应源的另一种方式。以下示例中的`Publisher`仍在幕后使用Reactor `Flux`，但是，从应用程序角度看，这对用户是透明的，并且对于Spring Integration仅需要响应流和Java DSL：

```
@EnableBinding(Source.class)
@EnableAutoConfiguration
public static class HelloWorldEmitter {

  @StreamEmitter
  @Output(Source.OUTPUT)
  @Bean
  public Publisher<Message<String>> emit() {
    return IntegrationFlows.from(() ->
                new GenericMessage<>("Hello World"),
        e -> e.poller(p -> p.fixedDelay(1)))
        .toReactivePublisher();
  }
}
```

## 30. Binders

Spring Cloud Stream提供了Binder抽象，用于连接到外部中间件上的物理目标。本节提供有关Binder SPI背后的主要概念，其主要组件以及特定于实现的详细信息。

## 30.1生产者和消费者

下图显示了生产者和消费者的一般关系：



**图30.1。生产者和消费者**

![生产者消费者](/assets/images/springcloud/producers-consumers.png)



生产者是将消息发送到通道的任何组件。可以将该通道绑定到具有该代理的`Binder`实现的外部消息代理。调用`bindProducer()`方法时，第一个参数是代理内目标的名称，第二个参数是生产者向其发送消息的本地通道实例，第三个参数包含属性（例如分区键表达式） ），以在为该通道创建的适配器中使用。

使用者是从通道接收消息的任何组件。与生产者一样，消费者的渠道可以绑定到外部消息代理。调用`bindConsumer()`方法时，第一个参数是目标名称，第二个参数提供逻辑消费者组的名称。由给定目标的使用者绑定表示的每个组都接收生产者发送到该目标的每个消息的副本（也就是说，它遵循常规的发布-订阅语义）。如果有多个使用相同组名绑定的使用者实例，那么消息将在这些使用者实例之间进行负载平衡，以便由生产者发送的每条消息仅在每个组内的单个使用者实例中被使用（也就是说，它遵循常规排队语义）。

## 30.2 Binder SPI

Binder SPI由许多接口，现成的实用程序类和发现策略组成，这些策略提供了用于连接到外部中间件的可插拔机制。

SPI的关键是`Binder`接口，这是将输入和输出连接到外部中间件的策略。以下清单显示了`Binder`接口的定义：

```
public interface Binder<T, C extends ConsumerProperties, P extends ProducerProperties> {
    Binding<T> bindConsumer(String name, String group, T inboundBindTarget, C consumerProperties);

    Binding<T> bindProducer(String name, T outboundBindTarget, P producerProperties);
}
```

该接口已参数化，提供了许多扩展点：

- 输入和输出绑定目标。从1.0版开始，仅支持`MessageChannel`，但将来打算将其用作扩展点。
- 扩展的使用者和生产者属性，允许特定的Binder实现添加可以以类型安全的方式支持的补充属性。

典型的活页夹实现包括以下内容：

- 实现`Binder`接口的类；

- 一个Spring `@Configuration`类，它创建类型为`Binder`的bean和中间件连接基础结构。

- 在类路径上找到一个`META-INF/spring.binders`文件，其中包含一个或多个绑定程序定义，如以下示例所示：

  ```
  kafka:\
  org.springframework.cloud.stream.binder.kafka.config.KafkaBinderConfiguration
  ```

## 30.3 Binder检测

Spring Cloud Stream依赖于Binder SPI的实现来执行将通道连接到消息代理的任务。每个Binder实现通常都连接到一种消息传递系统。

### 30.3.1类路径检测

默认情况下，Spring Cloud Stream依靠Spring Boot的自动配置来配置绑定过程。如果在类路径上找到单个Binder实现，则Spring Cloud Stream将自动使用它。例如，旨在仅绑定到RabbitMQ的Spring Cloud Stream项目可以添加以下依赖项：

```
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-stream-binder-rabbit</artifactId>
</dependency>
```

有关其他绑定程序依赖项的特定Maven坐标，请参阅该绑定程序实现的文档。

## 类路径上的30.4倍数Binders

当类路径上存在多个绑定程序时，应用程序必须指示将哪个绑定程序用于每个通道绑定。每个活页夹配置都包含一个`META-INF/spring.binders`文件，它是一个简单的属性文件，如以下示例所示：

```
rabbit:\
org.springframework.cloud.stream.binder.rabbit.config.RabbitServiceAutoConfiguration
```

其他提供的活页夹实现（例如Kafka）也存在类似的文件，并且期望自定义活页夹实现也将提供它们。关键字表示绑定程序实现的标识名，而该值是逗号分隔的配置类列表，每个配置类都包含一个且仅一个bean类型为`org.springframework.cloud.stream.binder.Binder`的定义。

可以使用`spring.cloud.stream.defaultBinder`属性（例如，`spring.cloud.stream.defaultBinder=rabbit`）在全局上执行Binder选择，也可以通过在每个通道绑定上配置活页夹来分别进行Binder选择。例如，从Kafka读取并写入RabbitMQ的处理器应用程序（具有分别名为`input`和`output`的通道用于读取和写入）可以指定以下配置：

```
spring.cloud.stream.bindings.input.binder=kafka
spring.cloud.stream.bindings.output.binder=rabbit
```

## 30.5连接到多个系统

默认情况下，活页夹共享应用程序的Spring Boot自动配置，以便创建在类路径上找到的每个活页夹的一个实例。如果您的应用程序应连接到多个相同类型的代理，则可以指定多个绑定程序配置，每个配置具有不同的环境设置。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 启用显式绑定程序配置将完全禁用默认的绑定程序配置过程。如果这样做，则配置中必须包括所有正在使用的活页夹。打算透明使用Spring Cloud Stream的框架可以创建可以按名称引用的活页夹配置，但它们不会影响默认的活页夹配置。为此，活页夹配置可以将其`defaultCandidate`标志设置为false（例如`spring.cloud.stream.binders.<configurationName>.defaultCandidate=false`）。这表示独立于默认绑定程序配置过程而存在的配置。 |

以下示例显示了连接到两个RabbitMQ代理实例的处理器应用程序的典型配置：

```
spring:
  cloud:
    stream:
      bindings:
        input:
          destination: thing1
          binder: rabbit1
        output:
          destination: thing2
          binder: rabbit2
      binders:
        rabbit1:
          type: rabbit
          environment:
            spring:
              rabbitmq:
                host: <host1>
        rabbit2:
          type: rabbit
          environment:
            spring:
              rabbitmq:
                host: <host2>
```

## 30.6绑定可视化和控制

从2.0版开始，Spring Cloud Stream支持通过Actuator端点进行绑定的可视化和控制。

从2.0版执行器开始，并且web是可选的，您必须首先添加web依赖项之一，然后手动添加执行器依赖项。以下示例说明如何为Web框架添加依赖项：

```
<dependency>
     <groupId>org.springframework.boot</groupId>
     <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

以下示例显示如何为WebFlux框架添加依赖项：

```
<dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

您可以添加执行器依赖项，如下所示：

```
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 要在Cloud Foundry中运行Spring Cloud Stream 2.0应用程序，必须将`spring-boot-starter-web`和`spring-boot-starter-actuator`添加到类路径中。否则，由于运行状况检查失败，该应用程序将无法启动。 |

您还必须通过设置以下属性来启用`bindings`执行器端点：`--management.endpoints.web.exposure.include=bindings`。

一旦满足这些先决条件。应用程序启动时，您应该在日志中看到以下内容：

```
: Mapped "{[/actuator/bindings/{name}],methods=[POST]. . .
: Mapped "{[/actuator/bindings],methods=[GET]. . .
: Mapped "{[/actuator/bindings/{name}],methods=[GET]. . .
```

要显示当前绑定，请访问以下URL：`http://<host>:<port>/actuator/bindings`

或者，要查看单个绑定，请访问类似于以下内容的URL之一：`http://<host>:<port>/actuator/bindings/myBindingName`

您还可以通过发布到相同的URL来停止，开始，暂停和恢复单个绑定，同时提供一个`state`作为JSON的参数，如以下示例所示：

curl -d'{“ state”：“ STOPPED”}'-H“内容类型：应用程序/ json” -X POST [http：// <主机>： / actuator / bindings / myBindingName](http://:/actuator/bindings/myBindingName) curl -d'{ “ state”：“ STARTED”}'-H“内容类型：application / json” -X POST [http：// ： / actuator / bindings / myBindingName](http://:/actuator/bindings/myBindingName) curl -d'{“ state”：“ PAUSED“}'-H”内容类型：application / json“ -X POST [http：// ： / actuator / bindings / myBindingName](http://:/actuator/bindings/myBindingName) curl -d'{” state“：” RESUMED“}'- H“内容类型：应用程序/ json” -X POST [http：// <主机>：<端口> / actuator / bindings / myBindingName](http://:/actuator/bindings/myBindingName)

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| `PAUSED`和`RESUMED`仅在相应的活页夹及其基础技术支持时起作用。否则，您会在日志中看到警告消息。当前，只有Kafka活页夹支持`PAUSED`和`RESUMED`状态。 |

## 30.7 Binder配置Properties

定制活页夹配置时，以下属性可用。这些属性通过`org.springframework.cloud.stream.config.BinderProperties`公开

它们必须以`spring.cloud.stream.binders.<configurationName>`为前缀。

- 类型

  资料夹类型。它通常引用在类路径上找到的绑定器之一-特别是`META-INF/spring.binders`文件中的键。默认情况下，它具有与配置名称相同的值。

- 继承环境

  配置是否继承应用程序本身的环境。默认值：`true`。

- 环境

  根可用于定制活页夹环境的一组属性。设置此属性后，在其中创建活页夹的上下文不是应用程序上下文的子级。该设置允许在粘合剂组分和应用组分之间完全分离。默认值：`empty`。

- defaultCandidate

  活页夹配置是被视为默认活页夹的候选者还是仅在明确引用时才可以使用。此设置允许添加活页夹配置，而不会干扰默认处理。默认值：`true`。

## 31.配置选项

Spring Cloud Stream支持常规配置选项以及绑定和活页夹的配置。一些活页夹使附加的绑定属性支持特定于中间件的功能。

可以通过Spring Boot支持的任何机制向Spring Cloud Stream应用程序提供配置选项。这包括应用程序参数，环境变量以及YAML或.properties文件。

## 31.1绑定服务Properties

这些属性通过`org.springframework.cloud.stream.config.BindingServiceProperties`公开

- spring.cloud.stream.instanceCount

  应用程序已部署实例的数量。必须在生产者端进行分区设置。使用RabbitMQ时必须在用户端设置，如果使用`autoRebalanceEnabled=false`，则必须在Kafka时设置。默认值：`1`。

- spring.cloud.stream.instanceIndex

  应用程序的实例索引：从`0`到`instanceCount - 1`的数字。用于通过RabbitMQ和Kafka（如果是`autoRebalanceEnabled=false`）进行分区。在Cloud Foundry中自动设置以匹配应用程序的实例索引。

- spring.cloud.stream.dynamic目的地

  可以动态绑定的目的地列表（例如，在动态路由方案中）。如果设置，则只能绑定列出的目的地。默认值：空（将任何目的地绑定）。

- spring.cloud.stream.defaultBinder

  如果配置了多个联编程序，则使用的默认联编程序。请参见[Classpath上的多个Binders](https://www.springcloud.cc/spring-cloud-greenwich.html#multiple-binders)。默认值：空。

- spring.cloud.stream.overrideCloudConnectors

  仅当`cloud`配置文件处于活动状态并且应用程序提供了Spring Cloud Connectors时，此属性才适用。如果属性为`false`（默认值），则绑定器检测到合适的绑定服务（例如，RabbitMQ绑定器在Cloud Foundry中绑定的RabbitMQ服务）并将其用于创建连接（通常通过Spring Cloud Connectors）。设置为`true`时，此属性指示绑定程序完全忽略绑定的服务，并依赖Spring Boot属性（例如，依赖于环境中为RabbitMQ绑定程序提供的`spring.rabbitmq.*`属性） 。[连接到多个系统时](https://www.springcloud.cc/spring-cloud-greenwich.html#multiple-systems)，此属性的典型用法是嵌套在自定义环境[中](https://www.springcloud.cc/spring-cloud-greenwich.html#multiple-systems)。默认值：`false`。

- spring.cloud.stream.bindingRetryInterval

  例如，活页夹不支持后期绑定和代理（例如Apache Kafka）关闭时，重试绑定创建之间的间隔（以秒为单位）。将该值设置为零可将此类情况视为致命情况，从而阻止应用程序启动。默认值：`30`

## 31.2绑定Properties

绑定属性是使用`spring.cloud.stream.bindings.<channelName>.<property>=<value>`格式提供的。`<channelName>`代表正在配置的通道的名称（例如，对于`Source`，为`output`）。

为避免重复，Spring Cloud Stream支持所有通道的设置值，格式为`spring.cloud.stream.default.<property>=<value>`。

在避免重复使用扩展绑定属性时，应使用此格式-`spring.cloud.stream.<binder-type>.default.<producer|consumer>.<property>=<value>`。

在下面的内容中，我们指出了省略了`spring.cloud.stream.bindings.<channelName>.`前缀的位置，仅着眼于属性名称，但要了解前缀是在运行时包含的。

### 31.2.1通用绑定Properties

这些属性通过`org.springframework.cloud.stream.config.BindingProperties`公开

以下绑定属性可用于输入和输出绑定，并且必须以`spring.cloud.stream.bindings.<channelName>.`为前缀（例如，`spring.cloud.stream.bindings.input.destination=ticktock`）。

可以使用前缀`spring.cloud.stream.default`设置默认值（例如“ spring.cloud.stream.default.contentType = application / json”）。

- 目的地

  绑定的中间件上的通道的目标目的地（例如，RabbitMQ交换或Kafka主题）。如果将通道绑定为使用者，则可以将其绑定到多个目标，并且目标名称可以指定为逗号分隔的`String`值。如果未设置，则使用通道名称。此属性的默认值不能被覆盖。

- 组

  渠道的消费群体。仅适用于入站绑定。请参阅[消费者组](https://www.springcloud.cc/spring-cloud-greenwich.html#consumer-groups)。默认值：`null`（指示匿名使用者）。

- 内容类型

  频道的内容类型。请参见“ [第32章，*内容类型协商*](https://www.springcloud.cc/spring-cloud-greenwich.html#content-type-management) ”。默认值：`application/json`。

- 黏合剂

  此绑定使用的粘合剂。有关详细信息，请参见“ [第30.4节“类路径上的多个Binders](https://www.springcloud.cc/spring-cloud-greenwich.html#multiple-binders) ”）。默认值：`null`（如果存在默认活页夹，则使用默认活页夹）。

### 31.2.2消费者Properties

这些属性通过`org.springframework.cloud.stream.binder.ConsumerProperties`公开

以下绑定属性仅可用于输入绑定，并且必须以`spring.cloud.stream.bindings.<channelName>.consumer.`为前缀（例如，`spring.cloud.stream.bindings.input.consumer.concurrency=3`）。

可以使用`spring.cloud.stream.default.consumer`前缀（例如，`spring.cloud.stream.default.consumer.headerMode=none`）设置默认值。

- 并发

  入站使用者的并发。默认值：`1`。

- 分区的

  消费者是否从分区生产者那里接收数据。默认值：`false`。

- headerMode

  设置为`none`时，禁用输入的标头解析。仅对本身不支持消息头并且需要消息头嵌入的消息中间件有效。当不支持本机头时，使用来自非Spring Cloud Stream应用程序的数据时，此选项很有用。设置为`headers`时，它使用中间件的本机头机制。设置为`embeddedHeaders`时，它将标头嵌入到消息有效负载中。默认值：取决于活页夹的实现。

- maxAttempts

  如果处理失败，则尝试处理消息的次数（包括第一次）。设置为`1`以禁用重试。默认值：`3`。

- backOffInitialInterval

  重试时的退避初始间隔。默认值：`1000`。

- backOffMaxInterval

  最大退避间隔。默认值：`10000`。

- backOffMultiplier

  退避乘数。默认值：`2.0`。

- defaultRetryable

  `retryableExceptions`中未列出的由侦听器引发的异常是否可以重试。默认值：`true`。

- instanceIndex

  设置为大于零的值时，它允许自定义此使用者的实例索引（如果与`spring.cloud.stream.instanceIndex`不同）。设置为负值时，默认为`spring.cloud.stream.instanceIndex`。有关更多信息[，](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-instance-index-instance-count)请参见“ [第34.2节“实例索引和实例计数”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-instance-index-instance-count) ”。默认值：`-1`。

- instanceCount

  设置为大于零的值时，它允许自定义此使用者的实例计数（如果与`spring.cloud.stream.instanceCount`不同）。设置为负值时，默认为`spring.cloud.stream.instanceCount`。有关更多信息[，](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-instance-index-instance-count)请参见“ [第34.2节“实例索引和实例计数”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-instance-index-instance-count) ”。默认值：`-1`。

- retryableExceptions

  键中Throwable类名称的映射，值中布尔值的映射。指定将要重试的那些异常（和子类）。另请参见`defaultRetriable`。示例：`spring.cloud.stream.bindings.input.consumer.retryable-exceptions.java.lang.IllegalStateException=false`。默认值：空。

- useNativeDecoding

  设置为`true`时，入站消息将直接由客户端库反序列化，该库必须进行相应配置（例如，设置适当的Kafka生产者值反序列化器）。使用此配置时，入站消息解组不是基于绑定的`contentType`。使用本机解码时，生产者负责使用适当的编码器（例如，Kafka生产者值序列化程序）对出站消息进行序列化。同样，当使用本机编码和解码时，`headerMode=embeddedHeaders`属性将被忽略，并且标头不会嵌入消息中。请参见生产者属性`useNativeEncoding`。默认值：`false`。

### 31.2.3生产者Properties

这些属性通过`org.springframework.cloud.stream.binder.ProducerProperties`公开

以下绑定属性仅可用于输出绑定，并且必须以`spring.cloud.stream.bindings.<channelName>.producer.`为前缀（例如，`spring.cloud.stream.bindings.input.producer.partitionKeyExpression=payload.id`）。

可以使用前缀`spring.cloud.stream.default.producer`（例如，`spring.cloud.stream.default.producer.partitionKeyExpression=payload.id`）设置默认值。

- partitionKeyExpression

  一个SpEL表达式，用于确定如何对出站数据进行分区。如果已设置或设置了`partitionKeyExtractorClass`，则会对该通道上的出站数据进行分区。`partitionCount`必须设置为大于1的值才能生效。与`partitionKeyExtractorClass`互斥。请参见“ [第28.6节“分区支持”](https://www.springcloud.cc/spring-cloud-greenwich.html#partitioning) ”。默认值：null。

- partitionKeyExtractorClass

  `PartitionKeyExtractorStrategy`实现。如果已设置，或者已设置`partitionKeyExpression`，则会对该通道上的出站数据进行分区。`partitionCount`必须设置为大于1的值才能生效。与`partitionKeyExpression`互斥。请参见“ [第28.6节“分区支持”](https://www.springcloud.cc/spring-cloud-greenwich.html#partitioning) ”。默认值：`null`。

- partitionSelectorClass

  `PartitionSelectorStrategy`实现。与`partitionSelectorExpression`互斥。如果两者均未设置，则将该分区选择为`hashCode(key) % partitionCount`，其中`key`通过`partitionKeyExpression`或`partitionKeyExtractorClass`计算。默认值：`null`。

- partitionSelectorExpression

  用于自定义分区选择的SpEL表达式。与`partitionSelectorClass`互斥。如果两者均未设置，则将分区选择为`hashCode(key) % partitionCount`，其中`key`通过`partitionKeyExpression`或`partitionKeyExtractorClass`计算。默认值：`null`。

- partitionCount

  数据的目标分区数（如果启用了分区）。如果生产者已分区，则必须将其设置为大于1的值。在Kafka上，它被解释为提示。取其较大者，并使用目标主题的分区数。默认值：`1`。

- requiredGroups

  生产者必须确保将消息传递到的组的逗号分隔列表，即使它们是在创建消息之后开始的（例如，通过在RabbitMQ中预先创建持久队列）。

- headerMode

  设置为`none`时，它将禁用在输出中嵌入标头。它仅对本身不支持消息头并且需要消息头嵌入的消息中间件有效。当不支持本机头时，为非Spring Cloud Stream应用程序生成数据时，此选项很有用。设置为`headers`时，它使用中间件的本机头机制。设置为`embeddedHeaders`时，它将标头嵌入到消息有效负载中。默认值：取决于活页夹的实现。

- useNativeEncoding

  设置为`true`时，出站消息将直接由客户端库进行序列化，该库必须进行相应配置（例如，设置适当的Kafka生产者值序列化程序）。使用此配置时，出站消息编组不是基于绑定的`contentType`。使用本机编码时，使用方负责使用适当的解码器（例如，Kafka使用方值反序列化器）对入站消息进行反序列化。此外，当使用本机编码和解码时，`headerMode=embeddedHeaders`属性将被忽略，并且标头不会嵌入消息中。请参阅消费者属性`useNativeDecoding`。默认值：`false`。

- errorChannelEnabled

  设置为`true`时，如果活页夹支持异步发送结果，则发送失败将发送到目标的错误通道。参见“ [??? ](https://www.springcloud.cc/spring-cloud-greenwich.html#)”以获取更多信息。默认值：`false`。

## 31.3使用动态绑定的目的地

除了使用`@EnableBinding`定义的通道外，Spring Cloud Stream还允许应用程序将消息发送到动态绑定的目的地。例如，当需要在运行时确定目标目的地时，这很有用。应用程序可以通过使用`@EnableBinding`注释自动注册的`BinderAwareChannelResolver` bean来实现。

“ spring.cloud.stream.dynamicDestinations”属性可用于将动态目标名称限制为已知集合（白名单）。如果未设置此属性，则可以动态绑定任何目标。

`BinderAwareChannelResolver`可以直接使用，如以下使用路径变量来确定目标通道的REST控制器示例所示：

```
@EnableBinding
@Controller
public class SourceWithDynamicDestination {

    @Autowired
    private BinderAwareChannelResolver resolver;

    @RequestMapping(path = "/{target}", method = POST, consumes = "*/*")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void handleRequest(@RequestBody String body, @PathVariable("target") target,
           @RequestHeader(HttpHeaders.CONTENT_TYPE) Object contentType) {
        sendMessage(body, target, contentType);
    }

    private void sendMessage(String body, String target, Object contentType) {
        resolver.resolveDestination(target).send(MessageBuilder.createMessage(body,
                new MessageHeaders(Collections.singletonMap(MessageHeaders.CONTENT_TYPE, contentType))));
    }
}
```

现在考虑当我们在默认端口（8080）上启动应用程序并使用CURL发出以下请求时会发生什么：

```
curl -H "Content-Type: application/json" -X POST -d "customer-1" http://localhost:8080/customers

curl -H "Content-Type: application/json" -X POST -d "order-1" http://localhost:8080/orders
```

在经纪人中创建目的地“客户”和“订单”（交换为Rabbit或在主题为“ Kafka”中），名称为“客户”和“订单”，数据为发布到适当的目的地。

`BinderAwareChannelResolver`是通用的Spring Integration `DestinationResolver`，并且可以注入到其他组件中，例如，在路由器中使用基于传入的`target`字段的SpEL表达式的路由器JSON消息。以下示例包含一个读取SpEL表达式的路由器：

```
@EnableBinding
@Controller
public class SourceWithDynamicDestination {

    @Autowired
    private BinderAwareChannelResolver resolver;


    @RequestMapping(path = "/", method = POST, consumes = "application/json")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void handleRequest(@RequestBody String body, @RequestHeader(HttpHeaders.CONTENT_TYPE) Object contentType) {
        sendMessage(body, contentType);
    }

    private void sendMessage(Object body, Object contentType) {
        routerChannel().send(MessageBuilder.createMessage(body,
                new MessageHeaders(Collections.singletonMap(MessageHeaders.CONTENT_TYPE, contentType))));
    }

    @Bean(name = "routerChannel")
    public MessageChannel routerChannel() {
        return new DirectChannel();
    }

    @Bean
    @ServiceActivator(inputChannel = "routerChannel")
    public ExpressionEvaluatingRouter router() {
        ExpressionEvaluatingRouter router =
            new ExpressionEvaluatingRouter(new SpelExpressionParser().parseExpression("payload.target"));
        router.setDefaultOutputChannelName("default-output");
        router.setChannelResolver(resolver);
        return router;
    }
}
```

该[路由器接收器应用程序](https://github.com/spring-cloud-stream-app-starters/router)使用此技术的按需创建的目的地。

如果预先知道通道名称，则可以像其他任何目的地一样配置生产者属性。或者，如果您注册`NewBindingCallback<>` bean，则会在创建绑定之前调用它。回调采用绑定程序使用的扩展生产者属性的通用类型。它有一种方法：

```
void configure(String channelName, MessageChannel channel, ProducerProperties producerProperties,
        T extendedProducerProperties);
```

下面的示例显示如何使用RabbitMQ活页夹：

```
@Bean
public NewBindingCallback<RabbitProducerProperties> dynamicConfigurer() {
    return (name, channel, props, extended) -> {
        props.setRequiredGroups("bindThisQueue");
        extended.setQueueNameGroupOnly(true);
        extended.setAutoBindDlq(true);
        extended.setDeadLetterQueueName("myDLQ");
    };
}
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 如果需要支持具有多个活页夹类型的动态目标，请对通用类型使用`Object`，并根据需要强制转换`extended`参数。 |

## 32.内容类型协商

数据转换是任何消息驱动的微服务体系结构的核心功能之一。假设在Spring Cloud Stream中，此类数据表示为Spring `Message`，则在到达消息之前，可能必须将消息转换为所需的形状或大小。这是必需的，原因有两个：

1. 转换传入消息的内容以匹配应用程序提供的处理程序的签名。
2. 将外发邮件的内容转换为有线格式。

有线格式通常为`byte[]`（对于Kafka和Rabbit活页夹而言是正确的），但是它由活页夹实现方式控制。

在Spring Cloud Stream中，消息转换是通过`org.springframework.messaging.converter.MessageConverter`完成的。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 作为后续细节的补充，您可能还需要阅读以下[博客文章](https://spring.io/blog/2018/02/26/spring-cloud-stream-2-0-content-type-negotiation-and-transformation)。 |

## 32.1力学

为了更好地理解内容类型协商的机制和必要性，我们以下面的消息处理程序为例，看一个非常简单的用例：

```
@StreamListener(Processor.INPUT)
@SendTo(Processor.OUTPUT)
public String handle(Person person) {..}
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 为简单起见，我们假设这是应用程序中唯一的处理程序（我们假设没有内部管道）。 |

前面示例中所示的处理程序期望将`Person`对象作为参数，并产生`String`类型作为输出。为了使框架成功将传入的`Message`作为参数传递给此处理程序，它必须以某种方式将`Message`类型的有效负载从有线格式转换为`Person`类型。换句话说，框架必须找到并应用适当的`MessageConverter`。为此，该框架需要用户提供一些指导。处理程序方法本身的签名（`Person`类型）已经提供了这些指令之一。因此，从理论上讲，这应该是（并且在某些情况下是足够的）。但是，对于大多数用例而言，为了选择适当的`MessageConverter`，框架需要额外的信息。缺少的部分是`contentType`。

Spring Cloud Stream提供了三种机制来定义`contentType`（按优先顺序）：

1. **标题**：`contentType`可以通过消息本身进行通信。通过提供`contentType`标头，您可以声明用于查找和应用适当的`MessageConverter`的内容类型。

2. **绑定**：可以通过设置`spring.cloud.stream.bindings.input.content-type`属性为每个目标绑定设置`contentType`。

   | ![[注意]](/assets/images/springcloud/note.png)                                     |
   | ------------------------------------------------------------ |
   | 属性名称中的`input`段与目的地的实际名称相对应（在本例中为“输入”）。通过这种方法，您可以在每个绑定的基础上声明用于查找和应用适当的`MessageConverter`的内容类型。 |

3. **默认值**：如果`Message`标头或绑定中不存在`contentType`，则使用默认的`application/json`内容类型来查找和应用适当的`MessageConverter`。

如前所述，前面的列表还演示了平局时的优先顺序。例如，标头提供的内容类型优先于任何其他内容类型。对于按绑定设置的内容类型也是如此，这实际上使您可以覆盖默认内容类型。但是，它也提供了明智的默认值（由社区反馈确定）。

将`application/json`设置为默认值的另一个原因是由分布式微服务体系结构驱动的互操作性要求，在该体系结构中，生产者和使用者不仅可以在不同的JVM中运行，而且还可以在不同的非JVM平台上运行。

当非无效处理程序方法返回时，如果返回值已经是`Message`，则该`Message`成为有效负载。但是，当返回值不是`Message`时，将使用返回值作为有效负载构造新的`Message`，同时从输入`Message`继承标头减去由`SpringIntegrationProperties.messageHandlerNotPropagatedHeaders`定义或过滤的标头。默认情况下，仅设置一个标头：`contentType`。这意味着新的`Message`没有设置`contentType`头，从而确保`contentType`可以演进。您始终可以选择不从处理程序方法返回`Message`的位置，在该方法中可以注入所需的任何标头。

如果存在内部管道，则通过相同的转换过程将`Message`发送到下一个处理程序。但是，如果没有内部管道或您已经到达内部管道的末尾，则`Message`将发送回输出目的地。

### 32.1.1内容类型与参数类型

如前所述，为了使框架选择适当的`MessageConverter`，它需要参数类型以及（可选）内容类型信息。选择适当的`MessageConverter`的逻辑驻留在参数解析器（`HandlerMethodArgumentResolvers`）中，该解析器在调用用户定义的处理程序方法之前（即当框架知道实际的参数类型时）触发。如果参数类型与当前有效负载的类型不匹配，则框架将委派给预先配置的`MessageConverters`的堆栈，以查看其中是否有一个可以转换有效负载。如您所见，MessageConverter的`Object fromMessage(Message<?> message, Class<?> targetClass);`操作将`targetClass`作为其参数之一。该框架还确保提供的`Message`始终包含一个`contentType`头。当没有contentType标头时，它会插入按绑定的`contentType`标头或默认的`contentType`标头。`contentType`参数类型的组合是框架确定消息是否可以转换为目标类型的机制。如果找不到合适的`MessageConverter`，则会引发异常，您可以通过添加自定义`MessageConverter`来处理该异常（请参见“ [第32.3节，“用户定义的消息转换器”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-user-defined-message-converters) ”）。

但是，如果有效载荷类型与处理程序方法声明的目标类型匹配，该怎么办？在这种情况下，没有任何要转换的内容，并且有效载荷未经修改地传递。尽管这听起来很简单且合乎逻辑，但请记住以`Message<?>`或`Object`作为参数的处理程序方法。通过将目标类型声明为`Object`（在Java中为`instanceof`，是所有内容），实际上就放弃了转换过程。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 不要期望仅根据`contentType`将`Message`转换为其他类型。请记住，`contentType`是目标类型的补充。如果需要，您可以提供一个提示，`MessageConverter`可能会也可能不会考虑。 |

### 32.1.2消息转换器

`MessageConverters`定义两种方法：

```
Object fromMessage(Message<?> message, Class<?> targetClass);

Message<?> toMessage(Object payload, @Nullable MessageHeaders headers);
```

重要的是要了解这些方法的约定及其用法，尤其是在Spring Cloud Stream的上下文中。

`fromMessage`方法将传入的`Message`转换为参数类型。`Message`的有效载荷可以是任何类型，而`MessageConverter`的实际实现要支持多种类型。例如，某些JSON转换器可能支持有效负载类型为`byte[]`，`String`等。当应用程序包含内部管道（即输入→handler1→handler2→....→输出）并且上游处理程序的输出结果为`Message`时，这可能不是初始连接格式，这一点很重要。

但是，`toMessage`方法的合同更为严格，必须始终将`Message`转换为有线格式：`byte[]`。

因此，出于所有意图和目的（尤其是在实现自己的转换器时），您将这两种方法视为具有以下签名：

```
Object fromMessage(Message<?> message, Class<?> targetClass);

Message<byte[]> toMessage(Object payload, @Nullable MessageHeaders headers);
```

## 32.2提供的MessageConverters

如前所述，该框架已经提供了`MessageConverters`堆栈来处理最常见的用例。以下列表按优先级描述了提供的`MessageConverters`（使用了第一个有效的`MessageConverter`）：

1. `ApplicationJsonMessageMarshallingConverter`：`org.springframework.messaging.converter.MappingJackson2MessageConverter`的变体。对于`contentType`为`application/json`（默认）的情况，支持将`Message`的有效负载转换为POJO或从POJO转换为PO195。
2. `TupleJsonMessageConverter`：已**弃用**支持将`Message`的有效负载转换为`org.springframework.tuple.Tuple`或从`org.springframework.tuple.Tuple`转换。
3. `ByteArrayMessageConverter`：在`contentType`为`application/octet-stream`的情况下，支持将`Message`的有效载荷从`byte[]`转换为`byte[]`。它本质上是一个传递，主要是为了向后兼容而存在。
4. `ObjectStringMessageConverter`：当`contentType`为`text/plain`时，支持将任何类型转换为`String`。它调用Object的`toString()`方法，或者，如果有效载荷为`byte[]`，则调用新的`String(byte[])`。
5. `JavaSerializationMessageConverter`：已**弃用**当`contentType`为`application/x-java-serialized-object`时，支持基于Java序列化的转换。
6. `KryoMessageConverter`：已**弃用**当`contentType`为`application/x-java-object`时，支持基于Kryo序列化的转换。
7. `JsonUnmarshallingConverter`：类似于`ApplicationJsonMessageMarshallingConverter`。当`contentType`为`application/x-java-object`时，它支持任何类型的转换。它期望将实际类型信息作为属性嵌入在`contentType`中（例如，`application/x-java-object;type=foo.bar.Cat`）。

当找不到合适的转换器时，框架将引发异常。发生这种情况时，应检查代码和配置，并确保您没有错过任何内容（即，确保使用绑定或标头提供了`contentType`）。但是，很可能您发现了一些不常见的情况（例如自定义`contentType`），并且提供的`MessageConverters`的当前堆栈不知道如何进行转换。在这种情况下，您可以添加自定义`MessageConverter`。请参见[第32.3节“用户定义的消息转换器”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-user-defined-message-converters)。

## 32.3用户定义的消息转换器

Spring Cloud Stream公开了定义和注册其他`MessageConverters`的机制。要使用它，请实现`org.springframework.messaging.converter.MessageConverter`，将其配置为`@Bean`，并用`@StreamMessageConverter`进行注释。然后将其附加到MessageConverter的现有堆栈中。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 了解自定义`MessageConverter`实现已添加到现有堆栈的开头很重要。因此，自定义`MessageConverter`实现优先于现有实现，您可以覆盖它们并添加到现有转换器中。 |

下面的示例说明如何创建消息转换器bean以支持称为`application/bar`的新内容类型：

```
@EnableBinding(Sink.class)
@SpringBootApplication
public static class SinkApplication {

    ...

    @Bean
    @StreamMessageConverter
    public MessageConverter customMessageConverter() {
        return new MyCustomMessageConverter();
    }
}

public class MyCustomMessageConverter extends AbstractMessageConverter {

    public MyCustomMessageConverter() {
        super(new MimeType("application", "bar"));
    }

    @Override
    protected boolean supports(Class<?> clazz) {
        return (Bar.class.equals(clazz));
    }

    @Override
    protected Object convertFromInternal(Message<?> message, Class<?> targetClass, Object conversionHint) {
        Object payload = message.getPayload();
        return (payload instanceof Bar ? payload : new Bar((byte[]) payload));
    }
}
```

Spring Cloud Stream还为基于Avro的转换器和模式演变提供支持。有关详细信息[，](https://www.springcloud.cc/spring-cloud-greenwich.html#schema-evolution)请参见“ [第33章，*Schema Evolution支持*](https://www.springcloud.cc/spring-cloud-greenwich.html#schema-evolution) ”。

## 33. Schema进化支持

Spring Cloud Stream为模式演化提供了支持，因此数据可以随着时间的推移而演化，并且仍然可以与较新的生产者和消费者以及反之亦然。大多数序列化模型，尤其是旨在跨不同平台和语言进行移植的模型，都依赖于一种描述如何在二进制有效负载中序列化数据的模式。为了序列化数据然后解释它，发送方和接收方都必须有权访问描述二进制格式的模式。在某些情况下，可以从序列化时的有效负载类型或反序列化时的目标类型推断模式。但是，许多应用程序可以从访问描述二进制数据格式的显式架构中受益。通过模式注册表，您可以以文本格式（通常为JSON）存储模式信息，并使该信息可用于需要它以二进制格式接收和发送数据的各种应用程序。模式可引用为一个元组，该元组包括：

- 主题，是架构的逻辑名称
- 模式版本
- 模式格式，描述数据的二进制格式

以下各节详细介绍了架构演变过程中涉及的各种组件。

## 33.1 Schema注册客户端

与模式注册表服务器进行交互的客户端抽象是`SchemaRegistryClient`接口，该接口具有以下结构：

```
public interface SchemaRegistryClient {

    SchemaRegistrationResponse register(String subject, String format, String schema);

    String fetch(SchemaReference schemaReference);

    String fetch(Integer id);

}
```

Spring Cloud Stream提供了开箱即用的实现，可以与其自己的模式服务器进行交互，也可以与Confluent Schema注册中心进行交互。

可以使用`@EnableSchemaRegistryClient`来配置Spring Cloud Stream模式注册表的客户端，如下所示：

```
  @EnableBinding(Sink.class)
  @SpringBootApplication
  @EnableSchemaRegistryClient
  public static class AvroSinkApplication {
    ...
  }
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 默认转换器经过优化，不仅可以缓存来自远程服务器的模式，还可以缓存`parse()`和`toString()`方法，这是非常昂贵的。因此，它使用了不缓存响应的`DefaultSchemaRegistryClient`。如果要更改默认行为，则可以直接在代码上使用客户端，并将其覆盖为所需的结果。为此，您必须将属性`spring.cloud.stream.schemaRegistryClient.cached=true`添加到应用程序属性中。 |

### 33.1.1 Schema注册客户端Properties

Schema Registry Client支持以下属性：

- `spring.cloud.stream.schemaRegistryClient.endpoint`

  模式服务器的位置。进行设置时，请使用完整的URL，包括协议（`http`或`https`），端口和上下文路径。

- 默认

  `http://localhost:8990/`

- `spring.cloud.stream.schemaRegistryClient.cached`

  客户端是否应缓存架构服务器响应。由于缓存发生在消息转换器中，因此通常设置为`false`。使用架构注册表客户端的客户端应将此设置为`true`。

- 默认

  `true`

## 33.2 Avro Schema注册客户端消息转换器

对于已在应用程序上下文中注册了SchemaRegistryClient bean的应用程序，Spring Cloud Stream自动为架构管理配置Apache Avro消息转换器。由于接收消息的应用程序可以轻松访问可以与自己的读取器模式进行协调的写入器模式，因此这简化了模式的演变。

对于出站消息，如果通道的内容类型设置为`application/*+avro`，则激活`MessageConverter`，如下例所示：

```
spring.cloud.stream.bindings.output.contentType=application/*+avro
```

在出站转换期间，消息转换器尝试使用`SchemaRegistryClient`推断每个出站消息的模式（基于其类型）并将其注册到主题（基于有效负载类型）。如果已经找到相同的模式，则将检索对其的引用。如果不是，则注册架构，并提供新的版本号。通过使用以下方案，将消息与`contentType`头一起发送：`application/[prefix].[subject].v[version]+avro`，其中`prefix`是可配置的，而`subject`是从有效负载类型推导出来的。

例如，类型为`User`的消息可能作为二进制有效载荷发送，其内容类型为`application/vnd.user.v2+avro`，其中`user`是主题，`2`是版本号。

接收消息时，转换器从传入消息的标头中推断模式引用，并尝试检索它。该模式在反序列化过程中用作编写器模式。

### 33.2.1 Avro Schema注册表消息转换器Properties

如果通过设置`spring.cloud.stream.bindings.output.contentType=application/*+avro`启用了基于Avro的架构注册表客户端，则可以通过设置以下属性来自定义注册行为。

- spring.cloud.stream.schema.avro.dynamicSchemaGenerationEnabled

  如果您希望转换器使用反射来从POJO推断Schema，请启用。默认值：`false`

- spring.cloud.stream.schema.avro.readerSchema

  Avro通过查看写入器模式（原始有效负载）和读取器模式（您的应用程序有效负载）来比较模式版本。有关更多信息，请参见[Avro文档](https://avro.apache.org/docs/1.7.6/spec.html)。如果设置，它将覆盖在模式服务器上的所有查找，并将本地模式用作读取器模式。默认值：`null`

- spring.cloud.stream.schema.avro.schema位置

  在Schema服务器中注册此属性中列出的所有`.avsc`文件。默认值：`empty`

- spring.cloud.stream.schema.avro.prefix

  Content-Type标头上要使用的前缀。默认值：`vnd`

## 33.3 Apache Avro消息转换器

Spring Cloud Stream通过其`spring-cloud-stream-schema`模块为基于模式的消息转换器提供支持。当前，基于模式的消息转换器开箱即用的唯一序列化格式是Apache Avro，将来的版本中将添加更多格式。

`spring-cloud-stream-schema`模块包含可用于Apache Avro序列化的两种消息转换器：

- 转换器使用序列化或反序列化对象的类信息或启动时具有已知位置的模式。
- 使用架构注册表的转换器。它们在运行时定位架构，并随着域对象的发展动态注册新架构。

## 33.4支持Schema的转换器

`AvroSchemaMessageConverter`支持通过使用预定义的架构或通过使用类中可用的架构信息（反射地或包含在`SpecificRecord`中）来对消息进行序列化和反序列化。如果提供自定义转换器，则不会创建默认的AvroSchemaMessageConverter bean。以下示例显示了一个自定义转换器：

要使用自定义转换器，您只需将其添加到应用程序上下文中，就可以选择指定一个或多个与其关联的`MimeTypes`。默认`MimeType`为`application/avro`。

如果转换的目标类型是`GenericRecord`，则必须设置架构。

以下示例显示如何通过在没有预定义架构的情况下注册Apache Avro `MessageConverter`在接收器应用程序中配置转换器。在此示例中，请注意，哑剧类型值为`avro/bytes`，而不是默认的`application/avro`。

```
@EnableBinding(Sink.class)
@SpringBootApplication
public static class SinkApplication {

  ...

  @Bean
  public MessageConverter userMessageConverter() {
      return new AvroSchemaMessageConverter(MimeType.valueOf("avro/bytes"));
  }
}
```

相反，以下应用程序使用预定义的架构（在类路径上找到）注册一个转换器：

```
@EnableBinding(Sink.class)
@SpringBootApplication
public static class SinkApplication {

  ...

  @Bean
  public MessageConverter userMessageConverter() {
      AvroSchemaMessageConverter converter = new AvroSchemaMessageConverter(MimeType.valueOf("avro/bytes"));
      converter.setSchemaLocation(new ClassPathResource("schemas/User.avro"));
      return converter;
  }
}
```

## 33.5 Schema注册表服务器

Spring Cloud Stream提供了模式注册表服务器实现。要使用它，可以将`spring-cloud-stream-schema-server`工件添加到项目中，并使用`@EnableSchemaRegistryServer`批注，该批注将架构注册表服务器REST控制器添加到您的应用程序。该注释旨在与Spring Boot web应用程序一起使用，并且服务器的侦听端口由`server.port`属性控制。`spring.cloud.stream.schema.server.path`属性可用于控制模式服务器的根路径（尤其是当它嵌入在其他应用程序中时）。`spring.cloud.stream.schema.server.allowSchemaDeletion`布尔属性可以删除模式。默认情况下，这是禁用的。

架构注册表服务器使用关系数据库来存储架构。默认情况下，它使用嵌入式数据库。您可以使用[Spring Boot SQL数据库和JDBC配置选项来自](https://docs.spring.io/spring-boot/docs/current-SNAPSHOT/reference/htmlsingle/#boot-features-sql)定义模式存储。

以下示例显示了一个启用架构注册表的Spring Boot应用程序：

```
@SpringBootApplication
@EnableSchemaRegistryServer
public class SchemaRegistryServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(SchemaRegistryServerApplication.class, args);
    }
}
```

### 33.5.1 Schema Registry Server API

Schema Registry Server API包含以下操作：

- `POST /` —参见“ [称为“注册新的Schema”部分](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-registering-new-schema) ”
- 'GET / {subject} / {format} / {version}'-参见“ [称为“按主题，格式和版本检索现有Schema的部分”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-retrieve-schema-subject-format-version) ”
- `GET /{subject}/{format}` —参见“ [称为“按主题和格式检索现有Schema的部分”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-retrieve-schema-subject-format) ”
- `GET /schemas/{id}`-参见“ [称为“通过ID检索现有Schema](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-retrieve-schema-id) ” [的部分”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-retrieve-schema-id) ”
- `DELETE /{subject}/{format}/{version}` —请参阅“ [称为“按主题，格式和版本删除Schema的部分”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-deleting-schema-subject-format-version) ”
- `DELETE /schemas/{id}` —参见“ [称为“通过ID删除Schema](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-deleting-schema-id) ” [的部分”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-deleting-schema-id) ”
- `DELETE /{subject}`-参见“ [称为“按主题删除Schema的部分”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-deleting-schema-subject) ”

#### 注册新的Schema

要注册新模式，请向`/`端点发送一个`POST`请求。

`/`接受具有以下字段的JSON有效负载：

- `subject`：架构主题
- `format`：架构格式
- `definition`：架构定义

它的响应是JSON中的架构对象，具有以下字段：

- `id`：架构ID
- `subject`：架构主题
- `format`：架构格式
- `version`：架构版本
- `definition`：模式定义

#### 通过主题，格式和版本检索现有的Schema

要按主题，格式和版本检索现有架构，请向`/{subject}/{format}/{version}`端点发送`GET`请求。

它的响应是JSON中的架构对象，具有以下字段：

- `id`：架构ID
- `subject`：架构主题
- `format`：架构格式
- `version`：架构版本
- `definition`：模式定义

#### 通过主题和格式检索现有的Schema

要按主题和格式检索现有架构，请向`/subject/format`端点发送一个`GET`请求。

它的响应是JSON中每个模式对象的模式列表，其中包含以下字段：

- `id`：模式ID
- `subject`：架构主题
- `format`：架构格式
- `version`：架构版本
- `definition`：架构定义

#### 通过ID检索现有的Schema

要通过其ID检索架构，请向`/schemas/{id}`端点发送一个`GET`请求。

它的响应是JSON中的架构对象，具有以下字段：

- `id`：架构ID
- `subject`：架构主题
- `format`：架构格式
- `version`：架构版本
- `definition`：模式定义

#### 按主题，格式和版本删除Schema

要删除由其主题，格式和版本标识的模式，请向`/{subject}/{format}/{version}`端点发送一个`DELETE`请求。

#### 按ID删除Schema

要通过其ID删除模式，请向`/schemas/{id}`端点发送一个`DELETE`请求。

#### 按主题删除Schema

```
DELETE /{subject}
```

按主题删除现有架构。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 本说明仅适用于Spring Cloud Stream 1.1.0.RELEASE的用户。Spring Cloud Stream 1.1.0.RELEASE使用表名`schema`来存储`Schema`对象。`Schema`是许多数据库实现中的关键字。为了避免将来发生任何冲突，从1.1.1.RELEASE开始，我们为存储表选择了名称`SCHEMA_REPOSITORY`。任何升级的Spring Cloud Stream 1.1.0.RELEASE用户都应在升级之前将其现有模式迁移到新表中。 |

### 33.5.2使用Confluent的Schema注册表

默认配置将创建`DefaultSchemaRegistryClient` bean。如果要使用Confluent模式注册表，则需要创建类型为`ConfluentSchemaRegistryClient`的bean，该类型将替代框架默认配置的类型。下面的示例说明如何创建这样的bean：

```
@Bean
public SchemaRegistryClient schemaRegistryClient(@Value("${spring.cloud.stream.schemaRegistryClient.endpoint}") String endpoint){
  ConfluentSchemaRegistryClient client = new ConfluentSchemaRegistryClient();
  client.setEndpoint(endpoint);
  return client;
}
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| ConfluentSchemaRegistryClient已针对Confluent平台4.0.0版进行了测试。 |

## 33.6 Schema注册和解决

为了更好地了解Spring Cloud Stream如何注册和解析新模式及其对Avro模式比较功能的使用，我们提供了两个单独的小节：

- “ [第33.6.1节“ Schema注册过程（序列化）”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-schema-registration-process) ”
- “ [第33.6.2节“ Schema解析过程（反序列化）”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-schema-resolution-process) ”

### 33.6.1 Schema注册流程（序列化）

注册过程的第一部分是从通过通道发送的有效负载中提取模式。诸如`SpecificRecord`或`GenericRecord`之类的Avro类型已经包含一个架构，可以从实例中立即检索该架构。对于POJO，如果将`spring.cloud.stream.schema.avro.dynamicSchemaGenerationEnabled`属性设置为`true`（默认值），则将推断模式。



**图33.1 Schema作家解析过程**

![模式解析](/assets/images/springcloud/schema_resolution.png)



获得一个模式，转换器从远程服务器加载其元数据（版本）。首先，它查询本地缓存。如果未找到结果，它将把数据提交给服务器，服务器将提供版本信息。转换器始终缓存结果，以避免为每个需要序列化的新消息查询Schema服务器的开销。



**图33.2 Schema注册流程**

![注册](/assets/images/springcloud/registration.png)



使用架构版本信息，转换器将消息的`contentType`标头设置为携带版本信息，例如：`application/vnd.user.v1+avro`。

### 33.6.2 Schema解析过程（反序列化）

当读取包含版本信息的消息（即`contentType`标头，其格式类似于“ [第33.6.1节“ Schema注册过程（序列化）”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-schema-registration-process) ”）所述）时，转换器将查询Schema服务器以获取消息的编写器架构。一旦找到了传入消息的正确架构，它将检索阅读器架构，并使用Avro的架构解析支持将其读入阅读器定义（设置默认值和所有缺少的属性）。



**图33.3 Schema阅读解决流程**

![模式阅读](/assets/images/springcloud/schema_reading.png)



| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 您应该了解编写者架构（编写消息的应用程序）和阅读者架构（接收应用程序）之间的区别。我们建议[花点时间](https://avro.apache.org/docs/1.7.6/spec.html)阅读[Avro术语](https://avro.apache.org/docs/1.7.6/spec.html)并了解其过程。Spring Cloud Stream始终获取编写程序架构以确定如何读取消息。如果要使Avro的模式演变支持正常工作，则需要确保为应用程序正确设置了`readerSchema`。 |

## 34.应用程序间通信

Spring Cloud Stream启用应用程序之间的通信。应用程序间通信是一个涉及多个问题的复杂问题，如以下主题所述：

- “ [第34.1节“连接多个应用程序实例”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-connecting-multiple-application-instances) ”
- “ [第34.2节“实例索引和实例计数”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-instance-index-instance-count) ”
- “ [第34.3节“分区”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-partitioning) ”

## 34.1连接多个应用程序实例

尽管Spring Cloud Stream使单个Spring Boot应用程序易于连接到消息传递系统，但Spring Cloud Stream的典型方案是创建多应用程序管道，微服务应用程序在该管道中相互发送数据。您可以通过关联“ 相邻 ”应用程序的输入和输出目标来实现此方案。

假设设计要求Time Source应用程序将数据发送到Log Sink应用程序。您可以将名为`ticktock`的公共目标用于两个应用程序中的绑定。

时间源（通道名称为`output`）将设置以下属性：

```
spring.cloud.stream.bindings.output.destination=ticktock
```

日志接收器（通道名称为`input`）将设置以下属性：

```
spring.cloud.stream.bindings.input.destination=ticktock
```

## 34.2实例索引和实例计数

在扩展Spring Cloud Stream应用程序时，每个实例可以接收有关同一应用程序还存在多少其他实例以及它自己的实例索引是什么的信息。Spring Cloud Stream通过`spring.cloud.stream.instanceCount`和`spring.cloud.stream.instanceIndex`属性进行此操作。例如，如果存在HDFS接收器应用程序的三个实例，则所有三个实例的`spring.cloud.stream.instanceCount`都设置为`3`，并且各个应用程序的`spring.cloud.stream.instanceIndex`都设置为`0`，`1`，和`2`。

通过Spring Cloud Data Flow部署Spring Cloud Stream应用程序时，将自动配置这些属性；否则，将自动配置这些属性。分别启动Spring Cloud Stream应用程序时，必须正确设置这些属性。默认情况下，`spring.cloud.stream.instanceCount`是`1`，而`spring.cloud.stream.instanceIndex`是`0`。

在按比例放大的方案中，这两个属性的正确配置通常对于解决分区行为很重要（请参见下文），并且某些绑定程序（例如，Kafka绑定程序）始终需要这两个属性，以便确保在多个使用者实例之间正确分割数据。

## 34.3分区

Spring Cloud Stream中的分区包括两个任务：

- “ [第34.3.1节“配置用于分区的输出绑定”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-configuring-output-bindings-partitioning) ”
- “ [第34.3.2节“配置用于分区的输入绑定”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-configuring-input-bindings-partitioning) ”

### 34.3.1配置用于分区的输出绑定

您可以通过设置其`partitionKeyExpression`或`partitionKeyExtractorName`属性及其`partitionCount`属性中的一个或仅一个，来配置输出绑定以发送分区数据。

例如，以下是有效的典型配置：

```
spring.cloud.stream.bindings.output.producer.partitionKeyExpression=payload.id
spring.cloud.stream.bindings.output.producer.partitionCount=5
```

基于该示例配置，通过使用以下逻辑将数据发送到目标分区。

根据`partitionKeyExpression`为发送到分区输出通道的每条消息计算分区键的值。`partitionKeyExpression`是一个SpEL表达式，该表达式根据出站消息进行评估以提取分区键。

如果SpEL表达式不足以满足您的需要，则可以通过提供`org.springframework.cloud.stream.binder.PartitionKeyExtractorStrategy`的实现并将其配置为bean（通过使用`@Bean`注释）来计算分区键值。 。如果在应用程序上下文中有多个`org.springframework.cloud.stream.binder.PartitionKeyExtractorStrategy`类型的bean，则可以通过使用`partitionKeyExtractorName`属性指定其名称来进一步过滤它，如以下示例所示：

```
--spring.cloud.stream.bindings.output.producer.partitionKeyExtractorName=customPartitionKeyExtractor
--spring.cloud.stream.bindings.output.producer.partitionCount=5
. . .
@Bean
public CustomPartitionKeyExtractorClass customPartitionKeyExtractor() {
    return new CustomPartitionKeyExtractorClass();
}
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 在Spring Cloud Stream的早期版本中，您可以通过设置`spring.cloud.stream.bindings.output.producer.partitionKeyExtractorClass`属性来指定`org.springframework.cloud.stream.binder.PartitionKeyExtractorStrategy`的实现。从2.0版开始，不推荐使用此属性，并且在将来的版本中将不再支持该属性。 |

一旦计算出消息密钥，分区选择过程就会将目标分区确定为`0`与`partitionCount - 1`之间的值。适用于大多数情况的默认计算基于以下公式：`key.hashCode() % partitionCount`。这可以在绑定上进行自定义，方法是将SpEL表达式设置为针对'key'进行评估（通过`partitionSelectorExpression`属性），也可以将`org.springframework.cloud.stream.binder.PartitionSelectorStrategy`的实现配置为bean （通过使用@ Bean批注）。与`PartitionKeyExtractorStrategy`类似，当应用程序上下文中有多个这种类型的bean可用时，您可以使用`spring.cloud.stream.bindings.output.producer.partitionSelectorName`属性进一步过滤它，如以下示例所示：

```
--spring.cloud.stream.bindings.output.producer.partitionSelectorName=customPartitionSelector
. . .
@Bean
public CustomPartitionSelectorClass customPartitionSelector() {
    return new CustomPartitionSelectorClass();
}
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 在Spring Cloud Stream的早期版本中，您可以通过设置`spring.cloud.stream.bindings.output.producer.partitionSelectorClass`属性来指定`org.springframework.cloud.stream.binder.PartitionSelectorStrategy`的实现。从2.0版开始，不推荐使用此属性，并且在将来的版本中将不再支持该属性。 |

### 34.3.2配置用于分区的输入绑定

通过设置应用程序本身的`partitioned`属性以及应用程序本身的`instanceIndex`和`instanceCount`属性，将输入绑定（通道名称为`input`）配置为接收分区数据。下面的例子：

```
spring.cloud.stream.bindings.input.consumer.partitioned=true
spring.cloud.stream.instanceIndex=3
spring.cloud.stream.instanceCount=5
```

`instanceCount`值表示应在其之间分区数据的应用程序实例的总数。`instanceIndex`在多个实例中必须是唯一的值，其值应介于`0`和`instanceCount - 1`之间。实例索引可帮助每个应用程序实例识别从中接收数据的唯一分区。活页夹要求使用不支持本地分区的技术。例如，对于RabbitMQ，每个分区都有一个队列，该队列名称包含实例索引。对于Kafka，如果`autoRebalanceEnabled`为`true`（默认值），则Kafka负责在实例之间分配分区，并且不需要这些属性。如果`autoRebalanceEnabled`设置为false，则绑定器将使用`instanceCount`和`instanceIndex`来确定实例所预订的分区（您必须拥有与实例数量一样多的分区） 。活页夹分配分区而不是Kafka。如果您希望特定分区的消息始终发送到同一实例，这可能很有用。当活页夹配置需要它们时，重要的是正确设置两个值，以确保使用所有数据，并且应用程序实例接收互斥的数据集。

尽管在单独情况下使用多个实例进行分区数据处理可能会很复杂，但Spring Cloud Dataflow可以通过正确填充输入和输出值并让您依赖运行时来显着简化流程基础架构，以提供有关实例索引和实例计数的信息。

## 35.测试

Spring Cloud Stream提供了在不连接消息传递系统的情况下测试您的微服务应用程序的支持。您可以使用`spring-cloud-stream-test-support`库提供的`TestSupportBinder`库来完成此操作，该库可以作为测试依赖项添加到应用程序中，如以下示例所示：

```
   <dependency>
       <groupId>org.springframework.cloud</groupId>
       <artifactId>spring-cloud-stream-test-support</artifactId>
       <scope>test</scope>
   </dependency>
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| `TestSupportBinder`使用Spring Boot自动配置机制来取代在类路径上找到的其他绑定器。因此，在添加活页夹作为依赖项时，必须确保使用了`test`范围。 |

`TestSupportBinder`使您可以与绑定的频道进行交互，并检查应用程序发送和接收的所有消息。

对于出站消息通道，`TestSupportBinder`注册一个订户，并将应用程序发出的消息保留在`MessageCollector`中。在测试期间可以检索它们，并针对它们进行断言。

您还可以将消息发送到入站消息通道，以便使用者应用程序可以使用消息。以下示例显示了如何在处理器上测试输入和输出通道：

```
@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment= SpringBootTest.WebEnvironment.RANDOM_PORT)
public class ExampleTest {

  @Autowired
  private Processor processor;

  @Autowired
  private MessageCollector messageCollector;

  @Test
  @SuppressWarnings("unchecked")
  public void testWiring() {
    Message<String> message = new GenericMessage<>("hello");
    processor.input().send(message);
    Message<String> received = (Message<String>) messageCollector.forChannel(processor.output()).poll();
    assertThat(received.getPayload(), equalTo("hello world"));
  }


  @SpringBootApplication
  @EnableBinding(Processor.class)
  public static class MyProcessor {

    @Autowired
    private Processor channels;

    @Transformer(inputChannel = Processor.INPUT, outputChannel = Processor.OUTPUT)
    public String transform(String in) {
      return in + " world";
    }
  }
}
```

在前面的示例中，我们创建了一个具有输入通道和输出通道的应用程序，两者均通过`Processor`接口绑定。绑定的接口被注入到测试中，以便我们可以访问两个通道。我们在输入通道上发送一条消息，然后使用Spring Cloud Stream的测试支持提供的`MessageCollector`捕获消息已作为结果发送到输出通道。收到消息后，我们可以验证组件是否正常运行。

## 35.1禁用测试Binder自动配置

测试绑定程序背后的目的是取代类路径上的所有其他绑定程序，以使其易于测试您的应用程序而无需更改生产依赖性。在某些情况下（例如，集成测试），使用实际的生产绑定程序是有用的，并且这需要禁用测试绑定程序自动配置。为此，可以使用Spring Boot自动配置排除机制之一来排除`org.springframework.cloud.stream.test.binder.TestSupportBinderAutoConfiguration`类，如以下示例所示：

```
    @SpringBootApplication(exclude = TestSupportBinderAutoConfiguration.class)
    @EnableBinding(Processor.class)
    public static class MyProcessor {

        @Transformer(inputChannel = Processor.INPUT, outputChannel = Processor.OUTPUT)
        public String transform(String in) {
            return in + " world";
        }
    }
```

禁用自动配置后，测试绑定程序将在类路径上可用，并且其`defaultCandidate`属性设置为`false`，以使其不会干扰常规用户配置。可以使用名称`test`来引用它，如以下示例所示：

```
spring.cloud.stream.defaultBinder=test
```

## 36.健康指标

Spring Cloud Stream为活页夹提供了健康指标。它以名称`binders`注册，可以通过设置`management.health.binders.enabled`属性来启用或禁用。

默认情况下，`management.health.binders.enabled`设置为`false`。将`management.health.binders.enabled`设置为`true`会启用运行状况指示器，使您可以访问`/health`端点以检索绑定程序运行状况指示器。

健康指标是特定于活页夹的，某些活页夹实现不一定提供健康指标。

## 37.指标发射器

Spring Boot Actuator为[Micrometer](https://micrometer.io/)提供依赖项管理和自动配置，[Micrometer](https://micrometer.io/)是一种支持众多[监视系统](https://docs.spring.io/spring-boot/docs/2.0.0.RELEASE/reference/htmlsingle/#production-ready-metrics)的应用程序度量外观。

Spring Cloud Stream提供了将任何可用的基于千分尺的度量标准发送到绑定目标的支持，从而允许从流应用程序定期收集度量标准数据，而无需依赖于轮询各个端点。

通过定义`spring.cloud.stream.bindings.applicationMetrics.destination`属性来激活“度量标准发射器”，该属性指定当前绑定程序用于发布度量标准消息的绑定目标的名称。

例如：

```
spring.cloud.stream.bindings.applicationMetrics.destination=myMetricDestination
```

前面的示例指示绑定程序绑定到`myMetricDestination`（即，Rabbit交换，Kafka主题等）。

以下属性可用于自定义指标的发射：

- spring.cloud.stream.metrics.key

  发出的度量标准的名称。每个应用程序的唯一值。默认值：`${spring.application.name:${vcap.application.name:${spring.config.name:application}}}`

- spring.cloud.stream.metrics.properties

  允许白名单应用程序属性添加到度量有效负载默认值：null。

- spring.cloud.stream.metrics.meter-filter

  控制要捕获的“仪表”的模式。例如，指定`spring.integration.*`将捕获名称以`spring.integration.`开头的仪表的度量标准信息默认值：捕获所有“仪表”。

- spring.cloud.stream.metrics.schedule-interval

  控制发布度量标准数据的速率的时间间隔。默认值：1分钟

考虑以下：

```
java -jar time-source.jar \
    --spring.cloud.stream.bindings.applicationMetrics.destination=someMetrics \
    --spring.cloud.stream.metrics.properties=spring.application** \
    --spring.cloud.stream.metrics.meter-filter=spring.integration.*
```

下面的示例显示由于上述命令而发布到绑定目标的数据的有效负载：

```
{
	"name": "application",
	"createdTime": "2018-03-23T14:48:12.700Z",
	"properties": {
	},
	"metrics": [
		{
			"id": {
				"name": "spring.integration.send",
				"tags": [
					{
						"key": "exception",
						"value": "none"
					},
					{
						"key": "name",
						"value": "input"
					},
					{
						"key": "result",
						"value": "success"
					},
					{
						"key": "type",
						"value": "channel"
					}
				],
				"type": "TIMER",
				"description": "Send processing time",
				"baseUnit": "milliseconds"
			},
			"timestamp": "2018-03-23T14:48:12.697Z",
			"sum": 130.340546,
			"count": 6,
			"mean": 21.72342433333333,
			"upper": 116.176299,
			"total": 130.340546
		}
	]
}
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 鉴于在迁移到Micrometer后Metric消息的格式略有变化，发布的消息还将`STREAM_CLOUD_STREAM_VERSION`标头设置为`2.x`，以帮助区分Metric消息和旧版本的Spring Cloud Stream 。 |

## 38.示例

有关Spring Cloud Stream示例，请参见GitHub上的[spring-cloud-stream-samples](https://github.com/spring-cloud/spring-cloud-stream-samples)存储库。

## 38.1在CloudFoundry上部署流应用程序

在CloudFoundry上，通常通过称为[VCAP_SERVICES](https://docs.cloudfoundry.org/devguide/deploy-apps/environment-variable.html#VCAP-SERVICES)的特殊环境变量来公开服务。

配置资料夹连接时，可以使用环境变量中的值，如[数据流Cloud Foundry服务器](https://docs.spring.io/spring-cloud-dataflow-server-cloudfoundry/docs/current-SNAPSHOT/reference/htmlsingle/#getting-started-ups)文档中所述。

# 第六部分 Binder实现

## 39. Apache Kafka Binder

## 39.1使用

要使用Apache Kafka活页夹，您需要将`spring-cloud-stream-binder-kafka`作为依赖项添加到Spring Cloud Stream应用程序中，如以下Maven的示例所示：

```
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-stream-binder-kafka</artifactId>
</dependency>
```

另外，您也可以使用Spring Cloud Stream Kafka入门程序，如以下Maven示例所示：

```
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-stream-kafka</artifactId>
</dependency>
```

## 39.2 Apache Kafka Binder概述

下图显示了Apache Kafka活页夹的工作方式的简化图：



**图39.1。Kafka Binder**

![卡夫卡粘合剂](/assets/images/springcloud/kafka-binder.png)



Apache Kafka Binder实现将每个目的地映射到Apache Kafka主题。消费者组直接映射到相同的Apache Kafka概念。分区也直接映射到Apache Kafka分区。

活页夹当前使用Apache Kafka `kafka-clients` 1.0.0 jar，并且设计为与至少该版本的代理一起使用。该客户端可以与较早的代理进行通信（请参见Kafka文档），但是某些功能可能不可用。例如，对于低于0.11.xx的版本，不支持本机头。另外，0.11.xx不支持`autoAddPartitions`属性。

## 39.3配置选项

本节包含Apache Kafka活页夹使用的配置选项。

有关与活页夹有关的常见配置选项和属性，请参阅[核心文档](https://www.springcloud.cc/spring-cloud-greenwich.html#binding-properties)。

### 39.3.1 Kafka Binder Properties

- spring.cloud.stream.kafka.binder.brokers

  Kafka活页夹所连接的代理列表。默认值：`localhost`。

- spring.cloud.stream.kafka.binder.defaultBrokerPort

  `brokers`允许指定带有或不带有端口信息的主机（例如，`host1,host2:port2`）。当代理列表中未配置任何端口时，这将设置默认端口。默认值：`9092`。

- spring.cloud.stream.kafka.binder.configuration

  客户端属性（生产者和消费者）的键/值映射传递给绑定程序创建的所有客户端。由于生产者和消费者都使用了这些属性，因此应将使用限制为通用属性，例如安全性设置。Properties在这里取代引导中设置的所有属性。默认值：空地图。

- spring.cloud.stream.kafka.binder.consumerProperties

  任意Kafka客户端使用者属性的键/值映射。这里的Properties取代了启动时和上面的`configuration`属性中设置的所有属性。默认值：空地图。

- spring.cloud.stream.kafka.binder.headers

  活页夹传输的自定义标头列表。仅当与`kafka-clients`版本<0.11.0.0的旧版应用程序（⇐1.3.x）通信时才需要。较新的版本本机支持标头。默认值：空。

- spring.cloud.stream.kafka.binder.healthTimeout

  等待获取分区信息的时间，以秒为单位。如果此计时器到期，运行状况将报告为已关闭。默认值：10

- spring.cloud.stream.kafka.binder.requiredAcks

  代理程序上所需的确认数。有关生产者`acks`属性的信息，请参见Kafka文档。默认值：`1`。

- spring.cloud.stream.kafka.binder.minPartitionCount

  仅在设置了`autoCreateTopics`或`autoAddPartitions`时有效。活页夹在生成或使用数据的主题上配置的全局最小分区数。可以通过生产者的`partitionCount`设置或生产者的`instanceCount * concurrency`设置的值（如果任一个较大）来代替它。默认值：`1`。

- spring.cloud.stream.kafka.binder.producer属性

  任意Kafka客户端生产者属性的键/值映射。这里的Properties取代了启动时和上面的`configuration`属性中设置的所有属性。默认值：空地图。

- spring.cloud.stream.kafka.binder.replicationFactor

  如果`autoCreateTopics`有效，则自动创建的主题的复制因子。可以在每个绑定上覆盖。默认值：`1`。

- spring.cloud.stream.kafka.binder.autoCreateTopics

  如果设置为`true`，则活页夹将自动创建新主题。如果设置为`false`，则活页夹依赖于已配置的主题。在后一种情况下，如果主题不存在，则活页夹无法启动。![[注意]](/assets/images/springcloud/note.png)此设置与代理的`auto.topic.create.enable`设置无关，并且不影响它。如果服务器设置为自动创建主题，则可以使用默认代理设置将它们作为元数据检索请求的一部分进行创建。默认值：`true`。

- spring.cloud.stream.kafka.binder.autoAddPartitions

  如果设置为`true`，则活页夹将根据需要创建新分区。如果设置为`false`，则活页夹依赖于已配置的主题的分区大小。如果目标主题的分区数小于预期值，则活页夹无法启动。默认值：`false`。

- spring.cloud.stream.kafka.binder.transaction.transactionIdPrefix

  在活页夹中启用事务。请参阅Kafka文档中的`transaction.id`和`spring-kafka`文档中的[Transactions](https://docs.spring.io/spring-kafka/reference/html/_reference.html#transactions)。启用事务后，将忽略各个`producer`属性，并且所有生产者都将使用`spring.cloud.stream.kafka.binder.transaction.producer.*`属性。默认值`null`（无交易）

- spring.cloud.stream.kafka.binder.transaction.producer。*

  交易绑定中生产者的全球生产者属性。请参见`spring.cloud.stream.kafka.binder.transaction.transactionIdPrefix`和[第39.3.3节“ Kafka生产者Properties”](https://www.springcloud.cc/spring-cloud-greenwich.html#kafka-producer-properties)以及所有[活页夹](https://www.springcloud.cc/spring-cloud-greenwich.html#kafka-producer-properties)支持的常规生产者属性。默认值：请参见各个生产者属性。

- spring.cloud.stream.kafka.binder.headerMapperBeanName

  `KafkaHeaderMapper`的bean名称，用于将`spring-messaging`标头映射到Kafka标头和从Kafka标头映射。例如，如果您希望自定义在标头中使用JSON反序列化的`DefaultKafkaHeaderMapper`中的受信任软件包，请使用此方法。默认值：无。

### 39.3.2 Kafka消费者Properties

以下属性仅适用于Kafka使用者，并且必须以`spring.cloud.stream.kafka.bindings.<channelName>.consumer.`为前缀。

- 管理员配置

  供应主题时使用的Kafka主题属性中的`Map`（例如，`spring.cloud.stream.kafka.bindings.input.consumer.admin.configuration.message.format.version=0.9.0.0`默认值：无。

- 管理员副本分配

  副本分配的Map <Integer，List <Integer >>，键为分区，值为分配。在配置新主题时使用。请参阅`kafka-clients` jar中的`NewTopic` Javadocs。默认值：无。

- 管理员复制因子

  设置主题时要使用的复制因子。覆盖活页夹范围的设置。忽略是否存在`replicas-assignments`。默认值：无（使用资料夹范围的默认值1）。

- autoRebalanceEnabled

  当为`true`时，主题分区将在使用者组的成员之间自动重新平衡。当`false`时，将为每个使用者分配基于`spring.cloud.stream.instanceCount`和`spring.cloud.stream.instanceIndex`的固定分区集合。这要求在每个启动的实例上同时设置`spring.cloud.stream.instanceCount`和`spring.cloud.stream.instanceIndex`属性。在这种情况下，`spring.cloud.stream.instanceCount`属性的值通常必须大于1。默认值：`true`。

- ackEachRecord

  当`autoCommitOffset`为`true`时，此设置指示在处理每条记录后是否提交偏移量。默认情况下，在处理`consumer.poll()`返回的记录批次中的所有记录之后，将提交偏移量。可以使用`max.poll.records` Kafka属性控制轮询返回的记录数，该属性是通过使用者`configuration`属性设置的。将此设置为`true`可能会导致性能下降，但是这样做会减少发生故障时重新传送记录的可能性。另外，请参见活页夹`requiredAcks`属性，该属性还影响落实偏移量的性能。默认值：`false`。

- autoCommitOffset

  处理消息后是否自动提交偏移量。如果设置为`false`，则入站消息中将出现带有类型为`org.springframework.kafka.support.Acknowledgment`头的键`kafka_acknowledgment`的头。应用程序可以使用此标头来确认消息。有关详细信息，请参见示例部分。当此属性设置为`false`时，Kafka活页夹将ack模式设置为`org.springframework.kafka.listener.AbstractMessageListenerContainer.AckMode.MANUAL`，应用程序负责确认记录。另请参阅`ackEachRecord`。默认值：`true`。

- autoCommitOnError

  仅在`autoCommitOffset`设置为`true`时有效。如果设置为`false`，它将抑制导致错误的消息的自动提交，仅对成功的消息进行提交。如果持续出现故障，它允许流从上次成功处理的消息自动重播。如果设置为`true`，它将始终自动提交（如果启用了自动提交）。如果未设置（默认值），则其有效值与`enableDlq`相同，如果将错误消息发送到DLQ，则自动提交错误消息，否则不提交。默认值：未设置。

- resetOffsets

  是否将使用者的偏移量重置为startOffset提供的值。默认值：`false`。

- startOffset

  新组的起始偏移量。允许的值：`earliest`和`latest`。如果为消费者“绑定”显式设置了消费者组（通过`spring.cloud.stream.bindings.<channelName>.group`），则“ startOffset”设置为`earliest`。否则，将`anonymous`消费者组的值设置为`latest`。另请参见`resetOffsets`（在此列表的前面）。默认值：null（等于`earliest`）。

- enableDlq

  设置为true时，它将为使用者启用DLQ行为。默认情况下，导致错误的消息将转发到名为`error.<destination>.<group>`的主题。可以通过设置`dlqName`属性来配置DLQ主题名称。对于错误数量相对较小并且重放整个原始主题可能太麻烦的情况，这为更常见的Kafka重播方案提供了一个替代选项。有关更多信息[，](https://www.springcloud.cc/spring-cloud-greenwich.html#kafka-dlq-processing)请参见[第39.6节“ Dead-Letter主题处理”](https://www.springcloud.cc/spring-cloud-greenwich.html#kafka-dlq-processing)处理。从2.0版开始，发送到DLQ主题的消息将通过以下标头得到增强：`x-original-topic`，`x-exception-message`和`x-exception-stacktrace`为`byte[]`。 **当`destinationIsPattern`为`true`时不允许使用。**默认值：`false`。

- 组态

  使用包含通用Kafka使用者属性的键/值对进行映射。默认值：空地图。

- dlqName

  接收错误消息的DLQ主题的名称。默认值：null（如果未指定，则导致错误的消息将转发到名为`error.<destination>.<group>`的主题）。

- dlqProducerProperties

  使用此功能，可以设置特定于DLQ的生产者属性。通过kafka生产者属性可用的所有属性都可以通过此属性设置。默认：默认Kafka生产者属性。

- 标头

  指示入站通道适配器填充哪些标准头。允许的值：`none`，`id`，`timestamp`或`both`。如果使用本机反序列化并且第一个组件接收消息需要`id`（例如配置为使用JDBC消息存储的聚合器），则很有用。默认值：`none`

- converterBeanName

  实现`RecordMessageConverter`的bean的名称。在入站通道适配器中用于替换默认的`MessagingMessageConverter`。默认值：`null`

- idleEventInterval

  事件之间的间隔（以毫秒为单位），指示最近未接收到任何消息。使用`ApplicationListener<ListenerContainerIdleEvent>`接收这些事件。有关用法示例，请参见[“示例：暂停和恢复使用者”](https://www.springcloud.cc/spring-cloud-greenwich.html#pause-resume)一节。默认值：`30000`

- destinationIsPattern

  如果为true，则将目的地视为正则表达式`Pattern`，用于由代理匹配主题名称。设置为true时，不设置主题，并且不允许`enableDlq`，因为绑定者在设置阶段不知道主题名称。请注意，检测与模式匹配的新主题所花费的时间由消费者属性`metadata.max.age.ms`控制，该属性（在撰写本文时）默认为300,000ms（5分钟）。可以使用上面的`configuration`属性进行配置。默认值：`false`

### 39.3.3 Kafka生产者Properties

以下属性仅适用于Kafka生产者，并且必须以`spring.cloud.stream.kafka.bindings.<channelName>.producer.`为前缀。

- 管理员配置

  预置新主题时使用的Kafka主题属性中的`Map`（例如，`spring.cloud.stream.kafka.bindings.input.consumer.admin.configuration.message.format.version=0.9.0.0`默认值：无。

- 管理员副本分配

  副本分配的Map <Integer，List <Integer >>，键为分区，值为分配。在配置新主题时使用。请参见`kafka-clients` jar中的`NewTopic` javadocs。默认值：无。

- 管理员复制因子

  设置新主题时要使用的复制因子。覆盖活页夹范围的设置。如果存在`replicas-assignments`，则忽略。默认值：无（使用资料夹范围的默认值1）。

- 缓冲区大小

  Kafka生产者在发送之前尝试分批处理的数据量的上限（以字节为单位）。默认值：`16384`。

- 同步

  生产者是否同步。默认值：`false`。

- batchTimeout

  生产者在发送消息之前等待允许更多消息在同一批中累积的时间。（通常，生产者根本不等待，仅发送在上一次发送过程中累积的所有消息。）非零值可能会增加吞吐量，但会增加延迟。默认值：`0`。

- messageKeyExpression

  根据用于填充产生的Kafka消息的密钥的传出消息（例如，`headers['myKey']`）评估的SpEL表达式。有效负载无法使用，因为在评估此表达式时，有效负载已经采用`byte[]`的形式。默认值：`none`。

- headerPatterns

  以逗号分隔的简单模式列表，以匹配要映射到`ProducerRecord`中的Kafka `Headers`的Spring消息头。模式可以以通配符（星号）开头或结尾。可以使用前缀`!`来否定模式。比赛在第一个比赛（正数或负数）之后停止。例如，`!ask,as*`将传递`ash`，但不会传递`ask`。`id`和`timestamp`从未映射。默认值：`*`（所有标头-`id`和`timestamp`除外）

- 组态

  使用包含通用Kafka生产者属性的键/值对进行映射。默认值：空地图。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| Kafka活页夹使用生产者的`partitionCount`设置作为提示来创建具有给定分区数的主题（与`minPartitionCount`结合使用，两者中的最大值是所使用的值）。同时为活页夹配置`minPartitionCount`和为应用程序配置`partitionCount`时要小心，因为使用了较大的值。如果已经存在一个分区数较小的主题，并且禁用了`autoAddPartitions`（默认设置），则绑定器无法启动。如果已经存在一个分区数较小的主题，并且启用了`autoAddPartitions`，则会添加新的分区。如果已经存在的主题的分区数量大于最大数量（`minPartitionCount`或`partitionCount`），则使用现有分区计数。 |

### 39.3.4使用示例

在本节中，我们将说明针对特定方案使用前面的属性。

#### 示例：将`autoCommitOffset`设置为`false`并依靠手动进行

此示例说明了如何在用户应用程序中手动确认偏移。

本示例要求将`spring.cloud.stream.kafka.bindings.input.consumer.autoCommitOffset`设置为`false`。在您的示例中使用相应的输入通道名称。

```
@SpringBootApplication
@EnableBinding(Sink.class)
public class ManuallyAcknowdledgingConsumer {

 public static void main(String[] args) {
     SpringApplication.run(ManuallyAcknowdledgingConsumer.class, args);
 }

 @StreamListener(Sink.INPUT)
 public void process(Message<?> message) {
     Acknowledgment acknowledgment = message.getHeaders().get(KafkaHeaders.ACKNOWLEDGMENT, Acknowledgment.class);
     if (acknowledgment != null) {
         System.out.println("Acknowledgment provided");
         acknowledgment.acknowledge();
     }
 }
}
```

#### 示例：安全配置

Apache Kafka 0.9支持客户端和代理之间的安全连接。要利用此功能，请遵循[Apache Kafka文档](https://kafka.apache.org/090/documentation.html#security_configclients)中的[准则以及Confluent文档中](http://docs.confluent.io/2.0.0/kafka/security.html)的Kafka 0.9 [安全准则](http://docs.confluent.io/2.0.0/kafka/security.html)。使用`spring.cloud.stream.kafka.binder.configuration`选项为活页夹创建的所有客户端设置安全性属性。

例如，要将`security.protocol`设置为`SASL_SSL`，请设置以下属性：

```
spring.cloud.stream.kafka.binder.configuration.security.protocol=SASL_SSL
```

可以以类似方式设置所有其他安全属性。

使用Kerberos时，请遵循[参考文档](https://kafka.apache.org/090/documentation.html#security_sasl_clientconfig)中的[说明](https://kafka.apache.org/090/documentation.html#security_sasl_clientconfig)来创建和引用JAAS配置。

Spring Cloud Stream支持通过使用JAAS配置文件并使用Spring Boot属性将JAAS配置信息传递到应用程序。

##### 使用JAAS配置文件

可以使用系统属性为Spring Cloud Stream应用程序设置JAAS和（可选）krb5文件位置。以下示例显示如何通过使用JAAS配置文件使用SASL和Kerberos启动Spring Cloud Stream应用程序：

```
 java -Djava.security.auth.login.config=/path.to/kafka_client_jaas.conf -jar log.jar \
   --spring.cloud.stream.kafka.binder.brokers=secure.server:9092 \
   --spring.cloud.stream.bindings.input.destination=stream.ticktock \
   --spring.cloud.stream.kafka.binder.configuration.security.protocol=SASL_PLAINTEXT
```

##### 使用Spring Boot Properties

作为使用JAAS配置文件的替代方法，Spring Cloud Stream提供了一种通过使用Spring Boot属性为Spring Cloud Stream应用程序设置JAAS配置的机制。

以下属性可用于配置Kafka客户端的登录上下文：

- spring.cloud.stream.kafka.binder.jaas.loginModule

  登录模块名称。正常情况下无需设置。默认值：`com.sun.security.auth.module.Krb5LoginModule`。

- spring.cloud.stream.kafka.binder.jaas.controlFlag

  登录模块的控制标志。默认值：`required`。

- spring.cloud.stream.kafka.binder.jaas.options

  使用包含登录模块选项的键/值对进行映射。默认值：空地图。

以下示例显示如何使用Spring Boot配置属性使用SASL和Kerberos启动Spring Cloud Stream应用程序：

```
 java --spring.cloud.stream.kafka.binder.brokers=secure.server:9092 \
   --spring.cloud.stream.bindings.input.destination=stream.ticktock \
   --spring.cloud.stream.kafka.binder.autoCreateTopics=false \
   --spring.cloud.stream.kafka.binder.configuration.security.protocol=SASL_PLAINTEXT \
   --spring.cloud.stream.kafka.binder.jaas.options.useKeyTab=true \
   --spring.cloud.stream.kafka.binder.jaas.options.storeKey=true \
   --spring.cloud.stream.kafka.binder.jaas.options.keyTab=/etc/security/keytabs/kafka_client.keytab \
   --spring.cloud.stream.kafka.binder.jaas.options.principal=kafka-client-1@EXAMPLE.COM
```

前面的示例表示以下JAAS文件的等效项：

```
KafkaClient {
    com.sun.security.auth.module.Krb5LoginModule required
    useKeyTab=true
    storeKey=true
    keyTab="/etc/security/keytabs/kafka_client.keytab"
    principal="kafka-client-1@EXAMPLE.COM";
};
```

如果所需的主题已经存在于代理上或将由管理员创建，则可以关闭自动创建，仅需要发送客户端JAAS属性。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 请勿在同一应用程序中混合使用JAAS配置文件和Spring Boot属性。如果`-Djava.security.auth.login.config`系统属性已经存在，则Spring Cloud Stream将忽略Spring Boot属性。 |

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 将`autoCreateTopics`和`autoAddPartitions`与Kerberos一起使用时要小心。通常，应用程序可能使用在Kafka和Zookeeper中没有管理权限的主体。因此，依靠Spring Cloud Stream创建/修改主题可能会失败。在安全的环境中，强烈建议您使用Kafka工具创建主题并以管理方式管理ACL。 |

#### 示例：暂停和恢复使用方

如果希望暂停使用但不引起分区重新平衡，则可以暂停并恢复使用方。通过将`Consumer`作为参数添加到`@StreamListener`中，可以简化此操作。要恢复，需要为`ListenerContainerIdleEvent`实例使用`ApplicationListener`。事件的发布频率由`idleEventInterval`属性控制。由于使用者不是线程安全的，因此必须在调用线程上调用这些方法。

以下简单的应用程序显示了如何暂停和恢复：

```
@SpringBootApplication
@EnableBinding(Sink.class)
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

	@StreamListener(Sink.INPUT)
	public void in(String in, @Header(KafkaHeaders.CONSUMER) Consumer<?, ?> consumer) {
		System.out.println(in);
		consumer.pause(Collections.singleton(new TopicPartition("myTopic", 0)));
	}

	@Bean
	public ApplicationListener<ListenerContainerIdleEvent> idleListener() {
		return event -> {
			System.out.println(event);
			if (event.getConsumer().paused().size() > 0) {
				event.getConsumer().resume(event.getConsumer().paused());
			}
		};
	}

}
```

## 39.4错误通道

从版本1.3开始，绑定程序无条件地将异常发送到每个使用者目标的错误通道，并且还可以配置为将异步生产者发送失败消息发送到错误通道。有关更多信息[，](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-error-handling)请参见[第29.4节“错误处理”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-overview-error-handling)。

发送失败的`ErrorMessage`的有效载荷是具有以下属性的`KafkaSendFailureException`：

- `failedMessage`：发送失败的Spring消息`Message<?>`。
- `record`：从`failedMessage`创建的原始`ProducerRecord`

没有对生产者异常的自动处理（例如发送到[Dead-Letter队列](https://www.springcloud.cc/spring-cloud-greenwich.html#kafka-dlq-processing)）。您可以使用自己的Spring Integration流使用这些异常。

## 39.5 Kafka指标

Kafka活页夹模块公开以下指标：

`spring.cloud.stream.binder.kafka.offset`：此度量标准指示给定的消费者组尚未从给定的活页夹主题中消费多少消息。提供的指标基于Mircometer指标库。度量标准包含消费者组信息，主题以及与主题上的最新偏移量有关的承诺偏移量的实际滞后时间。该指标对于向PaaS平台提供自动缩放反馈特别有用。

## 39.6 Dead-Letter主题处理

因为您无法预期用户将如何处置死信，所以该框架没有提供任何标准机制来处理它们。如果死信的原因是暂时的，则您可能希望将消息路由回原始主题。但是，如果问题是永久性问题，则可能导致无限循环。本主题中的示例Spring Boot应用程序是如何将这些消息路由回原始主题的示例，但是在尝试了三遍之后，将其移至“ 停车场 ”主题。该应用程序是另一个从死信主题读取的spring-cloud-stream应用程序。5秒钟未收到任何消息时，它将终止。

这些示例假定原始目的地为`so8400out`，而使用者组为`so8400`。

有两种策略可供考虑：

- 考虑仅在主应用程序未运行时才运行重新路由。否则，瞬态错误的重试会很快用完。
- 或者，使用两阶段方法：使用此应用程序将路由到第三个主题，将另一个应用程序从那里路由回到主主题。

以下代码清单显示了示例应用程序：

**application.properties。** 

```
spring.cloud.stream.bindings.input.group=so8400replay
spring.cloud.stream.bindings.input.destination=error.so8400out.so8400

spring.cloud.stream.bindings.output.destination=so8400out
spring.cloud.stream.bindings.output.producer.partitioned=true

spring.cloud.stream.bindings.parkingLot.destination=so8400in.parkingLot
spring.cloud.stream.bindings.parkingLot.producer.partitioned=true

spring.cloud.stream.kafka.binder.configuration.auto.offset.reset=earliest

spring.cloud.stream.kafka.binder.headers=x-retries
```



**应用。** 

```
@SpringBootApplication
@EnableBinding(TwoOutputProcessor.class)
public class ReRouteDlqKApplication implements CommandLineRunner {

    private static final String X_RETRIES_HEADER = "x-retries";

    public static void main(String[] args) {
        SpringApplication.run(ReRouteDlqKApplication.class, args).close();
    }

    private final AtomicInteger processed = new AtomicInteger();

    @Autowired
    private MessageChannel parkingLot;

    @StreamListener(Processor.INPUT)
    @SendTo(Processor.OUTPUT)
    public Message<?> reRoute(Message<?> failed) {
        processed.incrementAndGet();
        Integer retries = failed.getHeaders().get(X_RETRIES_HEADER, Integer.class);
        if (retries == null) {
            System.out.println("First retry for " + failed);
            return MessageBuilder.fromMessage(failed)
                    .setHeader(X_RETRIES_HEADER, new Integer(1))
                    .setHeader(BinderHeaders.PARTITION_OVERRIDE,
                            failed.getHeaders().get(KafkaHeaders.RECEIVED_PARTITION_ID))
                    .build();
        }
        else if (retries.intValue() < 3) {
            System.out.println("Another retry for " + failed);
            return MessageBuilder.fromMessage(failed)
                    .setHeader(X_RETRIES_HEADER, new Integer(retries.intValue() + 1))
                    .setHeader(BinderHeaders.PARTITION_OVERRIDE,
                            failed.getHeaders().get(KafkaHeaders.RECEIVED_PARTITION_ID))
                    .build();
        }
        else {
            System.out.println("Retries exhausted for " + failed);
            parkingLot.send(MessageBuilder.fromMessage(failed)
                    .setHeader(BinderHeaders.PARTITION_OVERRIDE,
                            failed.getHeaders().get(KafkaHeaders.RECEIVED_PARTITION_ID))
                    .build());
        }
        return null;
    }

    @Override
    public void run(String... args) throws Exception {
        while (true) {
            int count = this.processed.get();
            Thread.sleep(5000);
            if (count == this.processed.get()) {
                System.out.println("Idle, terminating");
                return;
            }
        }
    }

    public interface TwoOutputProcessor extends Processor {

        @Output("parkingLot")
        MessageChannel parkingLot();

    }

}
```



## 39.7使用Kafka Binder进行分区

Apache Kafka本机支持主题分区。

有时，将数据发送到特定的分区是有好处的-例如，当您要严格订购消息处理时（特定客户的所有消息应转到同一分区）。

以下示例显示了如何配置生产方和消费者方：

```
@SpringBootApplication
@EnableBinding(Source.class)
public class KafkaPartitionProducerApplication {

    private static final Random RANDOM = new Random(System.currentTimeMillis());

    private static final String[] data = new String[] {
            "foo1", "bar1", "qux1",
            "foo2", "bar2", "qux2",
            "foo3", "bar3", "qux3",
            "foo4", "bar4", "qux4",
            };

    public static void main(String[] args) {
        new SpringApplicationBuilder(KafkaPartitionProducerApplication.class)
            .web(false)
            .run(args);
    }

    @InboundChannelAdapter(channel = Source.OUTPUT, poller = @Poller(fixedRate = "5000"))
    public Message<?> generate() {
        String value = data[RANDOM.nextInt(data.length)];
        System.out.println("Sending: " + value);
        return MessageBuilder.withPayload(value)
                .setHeader("partitionKey", value)
                .build();
    }

}
```

**application.yml。** 

```
spring:
  cloud:
    stream:
      bindings:
        output:
          destination: partitioned.topic
          producer:
            partitioned: true
            partition-key-expression: headers['partitionKey']
            partition-count: 12
```



| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 必须为该主题提供足够的分区，以实现所有消费者组所需的并发性。上面的配置最多支持12个使用者实例（如果`concurrency`为2，则为6；如果并发值为3，则为4，依此类推）。通常最好“ 过量供应 ”分区，以使将来的使用者或并发性增加。 |      |

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 前面的配置使用默认分区（`key.hashCode() % partitionCount`）。根据键值，这可能会或可能不会提供适当的平衡算法。您可以使用`partitionSelectorExpression`或`partitionSelectorClass`属性覆盖此默认设置。 |

由于分区是由Kafka本地处理的，因此在使用者端不需要特殊配置。Kafka在实例之间分配分区。

以下Spring Boot应用程序侦听Kafka流，并打印（到控制台）每条消息去往的分区ID：

```
@SpringBootApplication
@EnableBinding(Sink.class)
public class KafkaPartitionConsumerApplication {

    public static void main(String[] args) {
        new SpringApplicationBuilder(KafkaPartitionConsumerApplication.class)
            .web(false)
            .run(args);
    }

    @StreamListener(Sink.INPUT)
    public void listen(@Payload String in, @Header(KafkaHeaders.RECEIVED_PARTITION_ID) int partition) {
        System.out.println(in + " received from partition " + partition);
    }

}
```

**application.yml。** 

```
spring:
  cloud:
    stream:
      bindings:
        input:
          destination: partitioned.topic
          group: myGroup
```



您可以根据需要添加实例。Kafka重新平衡分区分配。如果实例计数（或`instance count * concurrency`）超过了分区数，则某些使用者处于空闲状态。

## 40. Apache Kafka流Binder

## 40.1使用

要使用Kafka Streams活页夹，只需使用以下Maven坐标将其添加到Spring Cloud Stream应用程序中：

```
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-stream-binder-kafka-streams</artifactId>
</dependency>
```

## 40.2 Kafka流Binder概述

Spring Cloud Stream的Apache Kafka支持还包括为Apache Kafka流绑定显式设计的绑定器实现。通过这种本机集成，Spring Cloud Stream“处理器”应用程序可以直接在核心业务逻辑中使用 [Apache Kafka Streams](https://kafka.apache.org/documentation/streams/developer-guide) API。

Kafka Streams活页夹实现基于[Spring Kafka](https://docs.spring.io/spring-kafka/reference/html/_reference.html#kafka-streams) 项目中的[Kafka Streams](https://docs.spring.io/spring-kafka/reference/html/_reference.html#kafka-streams)提供的基础。

Kafka Streams绑定器为Kafka Streams中的三种主要类型（KStream，KTable和GlobalKTable）提供了绑定功能。

作为本机集成的一部分， Kafka Streams API提供的高级[Streams DSL](https://docs.confluent.io/current/streams/developer-guide/dsl-api.html)可用于业务逻辑。

还提供[处理器API](https://docs.confluent.io/current/streams/developer-guide/processor-api.html)支持的早期版本。

如早期所述，Spring Cloud Stream中的Kafka流支持仅在处理器模型中严格可用。可以应用一种模型，在该模型中，可以从入站主题读取消息，进行业务处理，然后可以将转换后的消息写入出站主题。它也可以用于无出站目的地的处理器应用程序中。

### 40.2.1流DSL

此应用程序消耗来自Kafka主题（例如`words`）的数据，在5秒的时间窗口内为每个唯一单词计算单词计数，并将计算结果发送到下游主题（例如`counts`）进行进一步处理。

```
@SpringBootApplication
@EnableBinding(KStreamProcessor.class)
public class WordCountProcessorApplication {

	@StreamListener("input")
	@SendTo("output")
	public KStream<?, WordCount> process(KStream<?, String> input) {
		return input
                .flatMapValues(value -> Arrays.asList(value.toLowerCase().split("\\W+")))
                .groupBy((key, value) -> value)
                .windowedBy(TimeWindows.of(5000))
                .count(Materialized.as("WordCounts-multi"))
                .toStream()
                .map((key, value) -> new KeyValue<>(null, new WordCount(key.key(), value, new Date(key.window().start()), new Date(key.window().end()))));
    }

	public static void main(String[] args) {
		SpringApplication.run(WordCountProcessorApplication.class, args);
	}
```

一旦构建为uber-jar（例如`wordcount-processor.jar`），您就可以像下面一样运行上面的示例。

```
java -jar wordcount-processor.jar  --spring.cloud.stream.bindings.input.destination=words --spring.cloud.stream.bindings.output.destination=counts
```

此应用程序将使用来自Kafka主题`words`的消息，并将计算的结果发布到输出主题`counts`。

Spring Cloud Stream将确保来自传入和传出主题的消息都自动绑定为KStream对象。作为开发人员，您可以专注于代码的业务方面，即编写处理器中所需的逻辑。框架自动处理Kafka Streams基础结构所需的Streams DSL特定配置的设置。

## 40.3配置选项

本节包含Kafka Streams绑定程序使用的配置选项。

有关与活页夹有关的常见配置选项和属性，请参阅[核心文档](https://www.springcloud.cc/spring-cloud-greenwich.html#binding-properties)。

### 40.3.1 Kafka流Properties

以下属性在活页夹级别可用，并且必须以`spring.cloud.stream.kafka.streams.binder.`文字作为前缀。

- 组态

  使用包含与Apache Kafka Streams API有关的属性的键/值对进行映射。此属性必须以`spring.cloud.stream.kafka.streams.binder.`为前缀。以下是使用此属性的一些示例。

```
spring.cloud.stream.kafka.streams.binder.configuration.default.key.serde=org.apache.kafka.common.serialization.Serdes$StringSerde
spring.cloud.stream.kafka.streams.binder.configuration.default.value.serde=org.apache.kafka.common.serialization.Serdes$StringSerde
spring.cloud.stream.kafka.streams.binder.configuration.commit.interval.ms=1000
```

有关可能用于流配置的所有属性的更多信息，请参见Apache Kafka Streams文档中的StreamsConfig JavaDocs。

- 经纪人

  经纪人网址默认值：`localhost`

- zkNodes

  Zookeeper网址默认值：`localhost`

- serdeError

  反序列化错误处理程序类型。可能的值为-`logAndContinue`，`logAndFail`或`sendToDlq`默认值：`logAndFail`

- applicationId

  在绑定程序级别全局设置Kafka Streams应用程序的application.id的简便方法。如果应用程序包含多个`StreamListener`方法，则应在每个输入绑定的绑定级别上设置application.id。默认值：`none`

以下属性*仅*适用于Kafka Streams生产者，并且必须以`spring.cloud.stream.kafka.streams.bindings.<binding name>.producer.`字面量为前缀。为方便起见，如果存在多个输出绑定并且它们都需要一个公共值，则可以使用前缀`spring.cloud.stream.kafka.streams.default.producer.`进行配置。

- 钥匙串

  要使用的密钥序列默认值：`none`。

- valueSerde

  使用价值服务默认值：`none`。

- useNativeEncoding

  标志以启用本机编码默认值：`false`。

以下属性*仅*适用于Kafka Streams使用者，并且必须以`spring.cloud.stream.kafka.streams.bindings.<binding name>.consumer.`literal. For convenience, if there multiple input bindings and they all require a common value, that can be configured by using the prefix `spring.cloud.stream.kafka.streams.default.consumer.`为前缀。

- applicationId

  设置每个输入绑定的application.id。默认值：`none`

- 钥匙串

  要使用的密钥序列默认值：`none`。

- valueSerde

  使用价值服务默认值：`none`。

- 物化为

  使用传入的KTable类型实现状态存储默认值：`none`。

- useNativeDecoding

  标志以启用本机解码默认值：`false`。

- dlqName

  DLQ主题名称。默认值：`none`。

### 40.3.2 TimeWindow属性：

窗口化是流处理应用程序中的重要概念。以下属性可用于配置时间窗口计算。

- spring.cloud.stream.kafka.streams.timeWindow.length

  赋予此属性后，您可以将`TimeWindows` bean自动连接到应用程序中。该值以毫秒为单位。默认值：`none`。

- spring.cloud.stream.kafka.streams.timeWindow.advanceBy

  值以毫秒为单位。默认值：`none`。

## 40.4多个输入绑定

对于需要多个传入KStream对象或KStream和KTable对象的组合的用例，Kafka Streams绑定程序提供了多个绑定支持。

让我们来看看它的作用。

### 40.4.1多个输入绑定作为接收器

```
@EnableBinding(KStreamKTableBinding.class)
.....
.....
@StreamListener
public void process(@Input("inputStream") KStream<String, PlayEvent> playEvents,
                    @Input("inputTable") KTable<Long, Song> songTable) {
                    ....
                    ....
}

interface KStreamKTableBinding {

    @Input("inputStream")
    KStream<?, ?> inputStream();

    @Input("inputTable")
    KTable<?, ?> inputTable();
}
```

在上面的示例中，应用程序被编写为接收器，即没有输出绑定，并且应用程序必须决定有关下游处理的内容。当您以这种方式编写应用程序时，您可能希望向下游发送信息或将其存储在状态存储中（有关可查询状态存储，请参见下文）。

对于传入的KTable，如果要将计算具体化为状态存储，则必须通过以下属性将其表示。

```
spring.cloud.stream.kafka.streams.bindings.inputTable.consumer.materializedAs: all-songs
```

上面的示例显示了将KTable用作输入绑定。绑定器还支持GlobalKTable的输入绑定。当您必须确保应用程序的所有实例都可以访问主题中的数据更新时，GlobalKTable绑定非常有用。KTable和GlobalKTable绑定仅在输入上可用。Binder支持KStream的输入和输出绑定。

### 40.4.2作为处理器的多个输入绑定

```
@EnableBinding(KStreamKTableBinding.class)
....
....

@StreamListener
@SendTo("output")
public KStream<String, Long> process(@Input("input") KStream<String, Long> userClicksStream,
                                     @Input("inputTable") KTable<String, String> userRegionsTable) {
....
....
}

interface KStreamKTableBinding extends KafkaStreamsProcessor {

    @Input("inputX")
    KTable<?, ?> inputTable();
}
```

## 40.5多个输出绑定（又名分支）

Kafka流允许根据某些谓词将出站数据分为多个主题。Kafka Streams绑定程序提供对此功能的支持，而不会损害最终用户应用程序中通过`StreamListener`公开的编程模型。

您可以按照上面在字数示例中展示的常用方法编写应用程序。但是，使用分支功能时，您需要做一些事情。首先，您需要确保您的返回类型为`KStream[]`，而不是常规的`KStream`。其次，您需要使用`SendTo`批注，该批注按顺序包含输出绑定（请参见下面的示例）。对于这些输出绑定中的每一个，您都需要配置目标，内容类型等，并符合标准Spring Cloud Stream的要求。

这是一个例子：

```
@EnableBinding(KStreamProcessorWithBranches.class)
@EnableAutoConfiguration
public static class WordCountProcessorApplication {

    @Autowired
    private TimeWindows timeWindows;

    @StreamListener("input")
    @SendTo({"output1","output2","output3})
    public KStream<?, WordCount>[] process(KStream<Object, String> input) {

			Predicate<Object, WordCount> isEnglish = (k, v) -> v.word.equals("english");
			Predicate<Object, WordCount> isFrench =  (k, v) -> v.word.equals("french");
			Predicate<Object, WordCount> isSpanish = (k, v) -> v.word.equals("spanish");

			return input
					.flatMapValues(value -> Arrays.asList(value.toLowerCase().split("\\W+")))
					.groupBy((key, value) -> value)
					.windowedBy(timeWindows)
					.count(Materialized.as("WordCounts-1"))
					.toStream()
					.map((key, value) -> new KeyValue<>(null, new WordCount(key.key(), value, new Date(key.window().start()), new Date(key.window().end()))))
					.branch(isEnglish, isFrench, isSpanish);
    }

    interface KStreamProcessorWithBranches {

    		@Input("input")
    		KStream<?, ?> input();

    		@Output("output1")
    		KStream<?, ?> output1();

    		@Output("output2")
    		KStream<?, ?> output2();

    		@Output("output3")
    		KStream<?, ?> output3();
    	}
}
```

Properties:

```
spring.cloud.stream.bindings.output1.contentType: application/json
spring.cloud.stream.bindings.output2.contentType: application/json
spring.cloud.stream.bindings.output3.contentType: application/json
spring.cloud.stream.kafka.streams.binder.configuration.commit.interval.ms: 1000
spring.cloud.stream.kafka.streams.binder.configuration:
  default.key.serde: org.apache.kafka.common.serialization.Serdes$StringSerde
  default.value.serde: org.apache.kafka.common.serialization.Serdes$StringSerde
spring.cloud.stream.bindings.output1:
  destination: foo
  producer:
    headerMode: raw
spring.cloud.stream.bindings.output2:
  destination: bar
  producer:
    headerMode: raw
spring.cloud.stream.bindings.output3:
  destination: fox
  producer:
    headerMode: raw
spring.cloud.stream.bindings.input:
  destination: words
  consumer:
    headerMode: raw
```

## 40.6消息转换

与基于消息通道的活页夹应用程序类似，Kafka Streams活页夹可适应现成的内容类型转换，而不会做出任何妥协。

Kafka Streams操作通常会知道用于正确转换键和值的SerDe类型。因此，在入站和出站转换时依靠Apache Kafka Streams库本身提供的SerDe工具可能比使用框架提供的内容类型转换更为自然。另一方面，您可能已经熟悉框架提供的内容类型转换模式，并且您希望继续用于入站和出站转换。

Kafka Streams活页夹实现中都支持这两个选项。

### 40.6.1出站序列化

如果禁用本机编码（这是默认设置），则框架将使用用户设置的contentType转换消息（否则，将应用默认的`application/json`）。在这种情况下，对于出站序列化，它将忽略出站上设置的任何SerDe。

这是在出站上设置contentType的属性。

```
spring.cloud.stream.bindings.output.contentType: application/json
```

这是启用本机编码的属性。

```
spring.cloud.stream.bindings.output.nativeEncoding: true
```

如果在输出绑定上启用了本机编码（用户必须如上所述明确地启用本机编码），则框架将在出站上跳过任何形式的自动消息转换。在这种情况下，它将切换到用户设置的Serde。将使用在实际输出绑定上设置的`valueSerde`属性。这是一个例子。

```
spring.cloud.stream.kafka.streams.bindings.output.producer.valueSerde: org.apache.kafka.common.serialization.Serdes$StringSerde
```

如果未设置此属性，则它将使用“默认” SerDe：`spring.cloud.stream.kafka.streams.binder.configuration.default.value.serde`。

值得一提的是，Kafka Streams绑定程序不会在出站上序列化密钥-它仅依赖于Kafka本身。因此，您必须在绑定上指定`keySerde`属性，否则它将默认为应用程序范围的公用`keySerde`。

绑定级别密钥serde：

```
spring.cloud.stream.kafka.streams.bindings.output.producer.keySerde
```

公用密钥序列：

```
spring.cloud.stream.kafka.streams.binder.configuration.default.key.serde
```

如果使用分支，则需要使用多个输出绑定。例如，

```
interface KStreamProcessorWithBranches {

    		@Input("input")
    		KStream<?, ?> input();

    		@Output("output1")
    		KStream<?, ?> output1();

    		@Output("output2")
    		KStream<?, ?> output2();

    		@Output("output3")
    		KStream<?, ?> output3();
    	}
```

如果设置了`nativeEncoding`，则可以如下对各个输出绑定设置不同的SerDe。

```
spring.cloud.stream.kafka.streams.bindings.output1.producer.valueSerde=IntegerSerde
spring.cloud.stream.kafka.streams.bindings.output2.producer.valueSerde=StringSerde
spring.cloud.stream.kafka.streams.bindings.output3.producer.valueSerde=JsonSerde
```

然后，如果您具有`SendTo`这样的@SendTo（{“ output1”，“ output2”，“ output3”}），则分支中的`KStream[]`将应用上面定义的正确的SerDe对象。如果未启用`nativeEncoding`，则可以如下在输出绑定上设置不同的contentType值。在这种情况下，框架将使用适当的消息转换器在将消息发送到Kafka之前转换消息。

```
spring.cloud.stream.bindings.output1.contentType: application/json
spring.cloud.stream.bindings.output2.contentType: application/java-serialzied-object
spring.cloud.stream.bindings.output3.contentType: application/octet-stream
```

### 40.6.2入站反序列化

类似的规则适用于入站数据反序列化。

如果禁用本机解码（这是默认设置），则框架将使用用户设置的contentType转换消息（否则，将应用默认的`application/json`）。在这种情况下，它将针对入站反序列化而忽略入站上设置的任何SerDe。

这是在入站上设置contentType的属性。

```
spring.cloud.stream.bindings.input.contentType: application/json
```

这是启用本机解码的属性。

```
spring.cloud.stream.bindings.input.nativeDecoding: true
```

如果在输入绑定上启用了本机解码（用户必须如上所述明确启用它），则框架将跳过对入站进行的任何消息转换。在这种情况下，它将切换到用户设置的SerDe。将使用在实际输出绑定上设置的`valueSerde`属性。这是一个例子。

```
spring.cloud.stream.kafka.streams.bindings.input.consumer.valueSerde: org.apache.kafka.common.serialization.Serdes$StringSerde
```

如果未设置此属性，它将使用默认的SerDe：`spring.cloud.stream.kafka.streams.binder.configuration.default.value.serde`。

值得一提的是，Kafka Streams绑定程序不会反序列化入站的密钥-它仅依赖于Kafka本身。因此，您必须在绑定上指定`keySerde`属性，否则它将默认为应用程序范围的公用`keySerde`。

绑定级别密钥serde：

```
spring.cloud.stream.kafka.streams.bindings.input.consumer.keySerde
```

公用密钥序列：

```
spring.cloud.stream.kafka.streams.binder.configuration.default.key.serde
```

与在出站上进行KStream分支的情况一样，为每个绑定设置值SerDe的好处是，如果您有多个输入绑定（多个KStreams对象），并且它们都需要单独的值SerDe，则可以分别配置它们。如果使用通用配置方法，则此功能将不适用。

## 40.7错误处理

Apache Kafka流提供了本机处理反序列化错误引起的异常的功能。有关该支持的详细信息，请参阅[本](https://cwiki.apache.org/confluence/display/KAFKA/KIP-161%3A+streams+deserialization+exception+handlers) 开箱，Apache Kafka流提供2种反序列化异常处理的- `logAndContinue`和`logAndFail`。顾名思义，前者将记录错误并继续处理下一条记录，而后者将记录错误并失败。`LogAndFail`是默认的反序列化异常处理程序。

### 40.7.1处理反序列化异常

Kafka Streams活页夹通过以下属性支持选择异常处理程序。

```
spring.cloud.stream.kafka.streams.binder.serdeError: logAndContinue
```

除了上述两个反序列化异常处理程序之外，绑定程序还提供了第三个用于将错误记录（毒丸）发送到DLQ主题的代理。这是启用此DLQ异常处理程序的方法。

```
spring.cloud.stream.kafka.streams.binder.serdeError: sendToDlq
```

设置以上属性后，所有反序列化错误记录都会自动发送到DLQ主题。

```
spring.cloud.stream.kafka.streams.bindings.input.consumer.dlqName: foo-dlq
```

如果已设置，则错误记录将发送到主题`foo-dlq`。如果未设置，则它将创建名称为`error.<input-topic-name>.<group-name>`的DLQ主题。

在Kafka Streams活页夹中使用异常处理功能时，需要记住两件事。

- 属性`spring.cloud.stream.kafka.streams.binder.serdeError`适用于整个应用程序。这意味着如果同一应用程序中有多个`StreamListener`方法，则此属性将应用于所有这些方法。
- 反序列化的异常处理与本机反序列化和框架提供的消息转换一致。

### 40.7.2处理非反序列化异常

对于Kafka Streams活页夹中的常规错误处理，最终用户应用程序要处理应用程序级错误。作为为反序列化异常处理程序提供DLQ的副作用，Kafka Streams绑定器提供了一种访问直接从应用程序发送bean的DLQ的方法。一旦可以访问该bean，就可以以编程方式将任何异常记录从应用程序发送到DLQ。

使用高级DSL仍然难以进行鲁棒的错误处理。Kafka Streams本身还不支持错误处理。

但是，当您在应用程序中使用低级处理器API时，有一些选项可以控制此行为。见下文。

```
@Autowired
private SendToDlqAndContinue dlqHandler;

@StreamListener("input")
@SendTo("output")
public KStream<?, WordCount> process(KStream<Object, String> input) {

    input.process(() -> new Processor() {
    			ProcessorContext context;

    			@Override
    			public void init(ProcessorContext context) {
    				this.context = context;
    			}

    			@Override
    			public void process(Object o, Object o2) {

    			    try {
    			        .....
    			        .....
    			    }
    			    catch(Exception e) {
    			        //explicitly provide the kafka topic corresponding to the input binding as the first argument.
                        //DLQ handler will correctly map to the dlq topic from the actual incoming destination.
                        dlqHandler.sendToDlq("topic-name", (byte[]) o1, (byte[]) o2, context.partition());
    			    }
    			}

    			.....
    			.....
    });
}
```

## 40.8国立商店

使用DSL时，Kafka流会自动创建状态存储。使用处理器API时，您需要手动注册状态存储。为此，您可以使用`KafkaStreamsStateStore`批注。您可以指定存储的名称和类型，用于控制日志和禁用缓存的标志等。一旦在引导阶段由绑定程序创建了存储，就可以通过处理器API访问此状态存储。下面是一些执行此操作的原语。

创建状态存储：

```
@KafkaStreamsStateStore(name="mystate", type= KafkaStreamsStateStoreProperties.StoreType.WINDOW, lengthMs=300000)
public void process(KStream<Object, Product> input) {
    ...
}
```

访问状态存储：

```
Processor<Object, Product>() {

    WindowStore<Object, String> state;

    @Override
    public void init(ProcessorContext processorContext) {
        state = (WindowStore)processorContext.getStateStore("mystate");
    }
    ...
}
```

## 40.9交互式查询

作为公共Kafka Streams绑定程序API的一部分，我们公开了一个名为`InteractiveQueryService`的类。您可以在应用程序中以Spring bean的身份进行访问。从您的应用程序访问此bean的一种简单方法是“自动装配” bean。

```
@Autowired
private InteractiveQueryService interactiveQueryService;
```

一旦获得对此bean的访问权限，就可以查询您感兴趣的特定状态存储。见下文。

```
ReadOnlyKeyValueStore<Object, Object> keyValueStore =
						interactiveQueryService.getQueryableStoreType("my-store", QueryableStoreTypes.keyValueStore());
```

如果有多个Kafka Streams应用程序实例正在运行，则在以交互方式查询它们之前，您需要确定哪个应用程序实例承载密钥。`InteractiveQueryService` API提供了用于标识主机信息的方法。

为了使它起作用，必须按如下所示配置属性`application.server`：

```
spring.cloud.stream.kafka.streams.binder.configuration.application.server: <server>:<port>
```

以下是一些代码片段：

```
org.apache.kafka.streams.state.HostInfo hostInfo = interactiveQueryService.getHostInfo("store-name",
						key, keySerializer);

if (interactiveQueryService.getCurrentHostInfo().equals(hostInfo)) {

    //query from the store that is locally available
}
else {
    //query from the remote host
}
```

## 40.10访问基础的KafkaStreams对象

可以通过编程方式访问spring-kafka中负责构造`KafkaStreams`对象的`StreamBuilderFactoryBean`。每个`StreamBuilderFactoryBean`被注册为`stream-builder`，并附加了`StreamListener`方法名称。例如，如果您的`StreamListener`方法被命名为`process`，则流生成器bean被命名为`stream-builder-process`。由于这是工厂bean，因此在以编程方式访问它时，应在前面加上一个＆符号（`&`）进行访问。下面是一个示例，并假设`StreamListener`方法被命名为`process`

```
StreamsBuilderFactoryBean streamsBuilderFactoryBean = context.getBean("&stream-builder-process", StreamsBuilderFactoryBean.class);
			KafkaStreams kafkaStreams = streamsBuilderFactoryBean.getKafkaStreams();
```

## 40.11状态清理

默认情况下，绑定停止时将调用`Kafkastreams.cleanup()`方法。请参阅[Spring Kafka文档](https://docs.spring.io/spring-kafka/reference/html/_reference.html#_configuration)。要修改此行为，只需向应用程序上下文中添加一个`CleanupConfig` `@Bean`（配置为在启动，停止或不清除时进行清除）即可；bean将被检测并连接到工厂bean。

## 41. RabbitMQ Binder

## 41.1使用

要使用RabbitMQ活页夹，您可以使用以下Maven坐标将其添加到Spring Cloud Stream应用程序中：

```
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-stream-binder-rabbit</artifactId>
</dependency>
```

或者，您可以使用Spring Cloud Stream RabbitMQ入门程序，如下所示：

```
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-starter-stream-rabbit</artifactId>
</dependency>
```

## 41.2 RabbitMQ Binder概述

以下简化图显示了RabbitMQ绑定程序的工作方式：



**图41.1。RabbitMQ Binder**

![兔子粘合剂](/assets/images/springcloud/rabbit-binder.png)



默认情况下，RabbitMQ Binder实现将每个目的地映射到`TopicExchange`。对于每个消费者组，`Queue`绑定到该`TopicExchange`。每个使用者实例为其组的`Queue`有一个对应的RabbitMQ `Consumer`实例。对于分区的生产者和使用者，队列带有分区索引后缀，并将分区索引用作路由键。对于匿名使用者（没有`group`属性的使用者），将使用自动删除队列（具有随机唯一名称）。

通过使用可选的`autoBindDlq`选项，您可以配置活页夹以创建和配置死信队列（DLQ）（以及死信交换机`DLX`，以及路由基础结构）。默认情况下，死信队列具有目标名称，后跟`.dlq`。如果启用了重试（`maxAttempts > 1`），则在重试用尽后，失败的消息将传递到DLQ。如果禁用了重试（`maxAttempts = 1`），则应将`requeueRejected`设置为`false`（默认值），以便将失败的消息路由到DLQ，而不是重新排队。此外，`republishToDlq`使绑定程序将失败的消息发布到DLQ（而不是拒绝它）。通过此功能，可以将其他信息（例如`x-exception-stacktrace`标头中的堆栈跟踪）添加到标头中的消息中。此选项不需要启用重试。您只需尝试一次即可重新发布失败的消息。从1.2版开始，您可以配置重新发布邮件的传递模式。请参阅[`republishDeliveryMode`属性](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-stream-rabbit-republish-delivery-mode)。

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 将`requeueRejected`设置为`true`（与`republishToDlq=false`一起使用）会导致消息被重新排队并连续重新发送，除非失败的原因是短暂的，否则这可能不是您想要的。通常，应通过将`maxAttempts`设置为大于1或将`republishToDlq`设置为`true`在活页夹中启用重试。 |      |

有关这些属性的更多信息[，](https://www.springcloud.cc/spring-cloud-greenwich.html#rabbit-binder-properties)请参见[第41.3.1节“ RabbitMQ Binder Properties”](https://www.springcloud.cc/spring-cloud-greenwich.html#rabbit-binder-properties)。

该框架没有提供任何标准机制来使用死信消息（或将其重新路由回主队列）。[第41.6节“ Dead-Letter队列处理”](https://www.springcloud.cc/spring-cloud-greenwich.html#rabbit-dlq-processing)中介绍了一些选项。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 在Spring Cloud Stream应用程序中使用多个RabbitMQ活页夹时，重要的是禁用'RabbitAutoConfiguration'以避免将来自`RabbitAutoConfiguration`的相同配置应用于两个活页夹。您可以使用`@SpringBootApplication`批注来排除该类。 |

从版本2.0开始，`RabbitMessageChannelBinder`将`RabbitTemplate.userPublisherConnection`属性设置为`true`，以便非事务生成器避免对使用者的死锁，如果由于代理上的[内存警报](https://www.rabbitmq.com/memory.html)而阻止了缓存的连接，则可能发生死锁。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 当前，`multiplex`使用者（一个使用者正在监听多个队列）仅受消息驱动的使用者支持；被轮询的使用者只能从单个队列中检索消息。 |

## 41.3配置选项

本节包含特定于RabbitMQ Binder和绑定通道的设置。

有关常规绑定配置选项和属性的信息，请参见[Spring Cloud Stream核心文档](https://github.com/spring-cloud/spring-cloud-stream/blob/master/spring-cloud-stream-core-docs/src/main/asciidoc/spring-cloud-stream-overview.adoc#configuration-options)。

### 41.3.1 RabbitMQ Binder Properties

默认情况下，RabbitMQ活页夹使用Spring Boot的`ConnectionFactory`。一致地，它支持RabbitMQ的所有Spring Boot配置选项。（有关参考，请参见[Spring Boot文档](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#common-application-properties)）。RabbitMQ配置选项使用`spring.rabbitmq`前缀。

除Spring Boot选项外，RabbitMQ活页夹还支持以下属性：

- spring.cloud.stream.rabbit.binder.adminAddresses

  以逗号分隔的RabbitMQ管理插件URL列表。仅在`nodes`包含多个条目时使用。该列表中的每个条目都必须在`spring.rabbitmq.addresses`中具有一个对应的条目。仅当您使用RabbitMQ群集并希望从托管队列的节点使用时才需要。有关更多信息，请参见[队列亲和力和LocalizedQueueConnectionFactory](https://docs.spring.io/spring-amqp/reference/html/_reference.html#queue-affinity)。默认值：空。

- spring.cloud.stream.rabbit.binder.nodes

  RabbitMQ节点名称的逗号分隔列表。多个条目时，用于定位队列所在的服务器地址。此列表中的每个条目都必须在`spring.rabbitmq.addresses`中具有一个对应的条目。仅当您使用RabbitMQ群集并希望从托管队列的节点使用时才需要。有关更多信息，请参见[队列亲和力和LocalizedQueueConnectionFactory](https://docs.spring.io/spring-amqp/reference/html/_reference.html#queue-affinity)。默认值：空。

- spring.cloud.stream.rabbit.binder.compressionLevel

  压缩绑定的压缩级别。参见`java.util.zip.Deflater`。默认值：`1`（BEST_LEVEL）。

- spring.cloud.stream.binder.connection-name-prefix

  连接名称前缀，用于命名此绑定程序创建的连接。名称是此前缀，后跟`#n`，其中，每次打开新连接时，`n`都会递增。默认值：无（Spring AMQP默认值）。

### 41.3.2 RabbitMQ消费者Properties

以下属性仅适用于Rabbit使用者，并且必须以`spring.cloud.stream.rabbit.bindings.<channelName>.consumer.`为前缀。

- 确认模式

  确认模式。默认值：`AUTO`。

- autoBindDlq

  是否自动声明DLQ并将其绑定到绑定器DLX。默认值：`false`。

- bindingRoutingKey

  用于将队列绑定到交换机的路由密钥（如果`bindQueue`为`true`）。对于分区的目的地，附加了`-<instanceIndex>`。默认值：`#`。

- bindQueue

  是否将队列绑定到目标交换机。如果您已经设置了自己的基础结构并且先前已创建并绑定了队列，则将其设置为`false`。默认值：`true`。

- ConsumerTagPrefix

  用于创建消费者标签；将被附加在`#n`之后，其中对于每个创建的使用者，`n`递增。例如：`${spring.application.name}-${spring.cloud.stream.bindings.input.group}-${spring.cloud.stream.instance-index}`。默认值：无-经纪人将生成随机的消费者标签。

- deadLetterQueueName

  DLQ的名称默认值：`prefix+destination.dlq`

- deadLetterExchange

  分配给队列的DLX。仅当`autoBindDlq`为`true`时才相关。默认值：“ prefix + DLX”

- deadLetterExchangeType

  分配给队列的DLX的类型。仅当`autoBindDlq`为`true`时才相关。默认值：“直接”

- deadLetterRoutingKey

  分配给队列的死信路由键。仅当`autoBindDlq`为`true`时才相关。默认值：`destination`

- 声明Dlx

  是否声明目的地交换死信。仅当`autoBindDlq`为`true`时才相关。如果您有预配置的DLX，请设置为`false`。默认值：`true`。

- 声明交换

  是否声明目的地交换。默认值：`true`。

- 延迟交易

  是否将交换声明为`Delayed Message Exchange`。需要代理上的延迟消息交换插件。`x-delayed-type`参数设置为`exchangeType`。默认值：`false`。

- dlqDeadLetterExchange

  如果声明了DLQ，则分配给该队列的DLX。默认值：`none`

- dlqDeadLetterRoutingKey

  如果声明了DLQ，则为该队列分配一个死信路由密钥。默认值：`none`

- dlqExpires

  删除未使用的死信队列的时间（以毫秒为单位）。默认值：`no expiration`

- dlqLazy

  用`x-queue-mode=lazy`参数声明死信队列。请参阅[“ 惰性队列 ”](https://www.rabbitmq.com/lazy-queues.html)。考虑使用策略而不是此设置，因为使用策略允许更改设置而不删除队列。默认值：`false`。

- dlqMaxLength

  死信队列中的最大消息数。默认值：`no limit`

- dlqMaxLengthBytes

  所有消息中的死信队列中的最大总字节数。默认值：`no limit`

- dlqMaxPriority

  死信队列中消息的最大优先级（0-255）。默认值：`none`

- dlqOverflow行为

  超过`dlqMaxLength`或`dlqMaxLengthBytes`时应采取的行动；当前为`drop-head`或`reject-publish`，但请参考RabbitMQ文档。默认值：`none`

- dlqTtl

  声明时应用于死信队列的默认生存时间（以毫秒为单位）。默认值：`no limit`

- 持久订阅

  订阅是否应持久。仅当还设置了`group`时才有效。默认值：`true`。

- exchangeAutoDelete

  如果`declareExchange`为true，则是否应自动删除交换（即在删除最后一个队列之后将其删除）。默认值：`true`。

- 耐用

  如果`declareExchange`为真，则该交换是否应该持久（即，在代理重新启动后仍然存在）。默认值：`true`。

- exchangeType

  交换类型：非分区目的地为`direct`，`fanout`或`topic`，分区目的地为`direct`或`topic`。默认值：`topic`。

- 独家

  是否创建独家消费者。当为`true`时，并发应为1。通常在需要严格订购但使热备用实例在发生故障后接管时使用。请参阅`recoveryInterval`，该文件控制备用实例尝试使用的频率。默认值：`false`。

- 过期

  删除未使用的队列的时间（以毫秒为单位）。默认值：`no expiration`

- failedDeclarationRetryInterval

  缺少队列的尝试之间的间隔（以毫秒为单位）。默认值：5000

- headerPatterns

  从入站邮件映射标头的模式。默认值：`['*']`（所有标题）。

- 懒

  使用`x-queue-mode=lazy`参数声明队列。请参阅[“ 惰性队列 ”](https://www.rabbitmq.com/lazy-queues.html)。考虑使用策略而不是此设置，因为使用策略允许更改设置而不删除队列。默认值：`false`。

- maxConcurrency

  最大消费者数。默认值：`1`。

- 最长长度

  队列中的最大消息数。默认值：`no limit`

- maxLengthBytes

  来自所有消息的队列中的最大总字节数。默认值：`no limit`

- maxPriority

  队列中消息的最大优先级（0-255）。默认值：`none`

- missingQueuesFatal

  当找不到队列时，是否将条件视为致命并停止侦听器容器。默认值为`false`，以便容器继续尝试从队列中使用数据，例如，在使用群集且承载非HA队列的节点关闭时。默认值：`false`

- 溢出行为

  超过`maxLength`或`maxLengthBytes`时应采取的行动；当前为`drop-head`或`reject-publish`，但请参考RabbitMQ文档。默认值：`none`

- 预取

  预取计数。默认值：`1`。

- 字首

  要添加到`destination`和队列名称的前缀。默认值：“”。

- queueDeclarationRetries

  缺少队列时重试消耗的次数。仅当`missingQueuesFatal`为`true`时相关。否则，容器将无限期地重试。默认值：`3`

- queueNameGroupOnly

  为true时，从名称等于`group`的队列中使用。否则，队列名称为`destination.group`。例如，在使用Spring Cloud Stream从现有RabbitMQ队列中消费时，这很有用。默认值：false。

- recoveryInterval

  连接恢复尝试之间的时间间隔（以毫秒为单位）。默认值：`5000`。

- 重新排队

  禁用重试或`republishToDlq`为`false`时是否应该重新排定传送失败。默认值：`false`。



- republishDeliveryMode

  当`republishToDlq`为`true`时，指定重新发布邮件的传递方式。默认值：`DeliveryMode.PERSISTENT`

- republishToDlq

  默认情况下，拒绝重试后失败的消息将被拒绝。如果配置了死信队列（DLQ），则RabbitMQ将失败的消息（未更改）路由到DLQ。如果设置为`true`，则绑定程序将使用其他标头将失败的消息重新发布到DLQ，包括异常消息和来自最终失败原因的堆栈跟踪。默认值：false

- 交易的

  是否使用交易渠道。默认值：`false`。

- ttl

  声明时应用于队列的默认生存时间（以毫秒为单位）。默认值：`no limit`

- txSize

  两次之间的分娩次数。默认值：`1`。

### 41.3.3高级侦听器容器配置

要设置未公开为绑定程序或绑定属性的侦听器容器属性，请向应用程序上下文中添加类型为`ListenerContainerCustomizer`的单个bean。将设置活页夹和绑定属性，然后将调用定制程序。定制程序（`configure()`方法）提供了队列名称以及使用者组作为参数。

### 41.3.4 Rabbit生产者Properties

以下属性仅适用于Rabbit生产者，并且必须以`spring.cloud.stream.rabbit.bindings.<channelName>.producer.`为前缀。

- autoBindDlq

  是否自动声明DLQ并将其绑定到绑定器DLX。默认值：`false`。

- batchingEnabled

  是否启用生产者的邮件批处理。根据以下属性（在此列表的后三个条目中进行了描述），将消息批处理为一条消息：'batchSize'，`batchBufferLimit`和`batchTimeout`。有关更多信息，请参见[批处理](https://docs.spring.io/spring-amqp//reference/html/_reference.html#template-batching)。默认值：`false`。

- batchSize

  启用批处理时要缓冲的消息数。默认值：`100`。

- batchBufferLimit

  启用批处理时的最大缓冲区大小。默认值：`10000`。

- batchTimeout

  启用批处理时的批处理超时。默认值：`5000`。

- bindingRoutingKey

  用于将队列绑定到交换机的路由密钥（如果`bindQueue`为`true`）。仅适用于未分区的目的地。仅在提供`requiredGroups`的情况下适用，然后仅对那些组有效。默认值：`#`。

- bindQueue

  是否将队列绑定到目标交换机。如果您已经设置了自己的基础结构并且先前已创建并绑定了队列，则将其设置为`false`。仅在提供`requiredGroups`的情况下适用，然后仅对那些组有效。默认值：`true`。

- 压缩

  发送时是否应压缩数据。默认值：`false`。

- deadLetterQueueName

  DLQ的名称仅在提供了`requiredGroups`之后才适用，然后仅适用于那些组。默认值：`prefix+destination.dlq`

- deadLetterExchange

  分配给队列的DLX。仅当`autoBindDlq`为`true`时相关。仅在提供`requiredGroups`时适用，然后仅适用于那些组。默认值：“ prefix + DLX”

- deadLetterExchangeType

  分配给队列的DLX的类型。仅当`autoBindDlq`为`true`时才相关。仅在提供`requiredGroups`时适用，然后仅适用于那些组。默认值：“直接”

- deadLetterRoutingKey

  分配给队列的死信路由键。仅当`autoBindDlq`为`true`时相关。仅在提供`requiredGroups`时适用，然后仅适用于那些组。默认值：`destination`

- 声明Dlx

  是否声明目的地交换死信。仅当`autoBindDlq`为`true`时才相关。如果您有预配置的DLX，请设置为`false`。仅在提供`requiredGroups`时适用，然后仅适用于那些组。默认值：`true`。

- 声明交换

  是否声明目的地交换。默认值：`true`。

- delayExpression

  一个SpEL表达式，用于评估应用于消息的延迟（`x-delay`标头）。如果交换不是延迟的消息交换，则无效。默认值：未设置`x-delay`头。

- 延迟交易

  是否将交换声明为`Delayed Message Exchange`。需要代理上的延迟消息交换插件。`x-delayed-type`参数设置为`exchangeType`。默认值：`false`。

- deliveryMode

  交付方式。默认值：`PERSISTENT`。

- dlqDeadLetterExchange

  声明DLQ后，将分配给该队列的DLX。仅在提供了`requiredGroups`之后才适用，然后仅对那些组适用。默认值：`none`

- dlqDeadLetterRoutingKey

  声明DLQ后，将分配一个死信路由密钥给该队列。仅在提供`requiredGroups`时适用，然后仅适用于那些组。默认值：`none`

- dlqExpires

  删除未使用的死信队列之前的时间（以毫秒为单位）。仅在提供`requiredGroups`时适用，然后仅适用于那些组。默认值：`no expiration`

- dlqLazy

  用`x-queue-mode=lazy`参数声明死信队列。请参阅[“ 惰性队列 ”](https://www.rabbitmq.com/lazy-queues.html)。考虑使用策略而不是此设置，因为使用策略允许更改设置而不删除队列。仅在提供`requiredGroups`时适用，然后仅适用于那些组。

- dlqMaxLength

  死信队列中的最大消息数。仅在提供了`requiredGroups`之后才适用，然后仅对那些组适用。默认值：`no limit`

- dlqMaxLengthBytes

  所有消息中的死信队列中的最大总字节数。仅在提供`requiredGroups`时适用，然后仅适用于那些组。默认值：`no limit`

- dlqMaxPriority

  死信队列中邮件的最大优先级（0-255）仅在提供`requiredGroups`时才适用，然后仅适用于那些组。默认值：`none`

- dlqTtl

  声明时应用于死信队列的默认生存时间（以毫秒为单位）。仅在提供`requiredGroups`时适用，然后仅适用于那些组。默认值：`no limit`

- exchangeAutoDelete

  如果`declareExchange`为`true`，则是否应自动删除交换（在删除最后一个队列之后将其删除）。默认值：`true`。

- 耐用

  如果`declareExchange`为`true`，则交换是否应该持久（在代理重新启动后生存）。默认值：`true`。

- exchangeType

  交换类型：`direct`，`fanout`或`topic`用于未分区的目的地，`direct`或`topic`用于分区的目的地。默认值：`topic`。

- 过期

  删除未使用的队列之前的时间（以毫秒为单位）。仅在提供`requiredGroups`时适用，然后仅适用于那些组。默认值：`no expiration`

- headerPatterns

  标头要映射到出站邮件的模式。默认值：`['*']`（所有标题）。

- 懒

  使用`x-queue-mode=lazy`参数声明队列。请参阅[“ 惰性队列 ”](https://www.rabbitmq.com/lazy-queues.html)。考虑使用策略而不是此设置，因为使用策略允许更改设置而不删除队列。仅在提供`requiredGroups`时适用，然后仅适用于那些组。默认值：`false`。

- 最长长度

  队列中的最大消息数。仅在提供`requiredGroups`时适用，然后仅适用于那些组。默认值：`no limit`

- maxLengthBytes

  来自所有消息的队列中的最大总字节数。仅在提供`requiredGroups`的情况下适用，然后仅对那些组有效。默认值：`no limit`

- maxPriority

  队列中消息的最大优先级（0-255）。仅在提供`requiredGroups`的情况下适用，然后仅对那些组有效。默认值：`none`

- 字首

  要添加到`destination`交换名称的前缀。默认值：“”。

- queueNameGroupOnly

  当`true`时，从名称等于`group`的队列中使用。否则，队列名称为`destination.group`。例如，在使用Spring Cloud Stream从现有RabbitMQ队列中消费时，这很有用。仅在提供`requiredGroups`时适用，然后仅适用于那些组。默认值：false。

- routingKeyExpression

  一个SpEL表达式，用于确定发布消息时要使用的路由密钥。对于固定的路由键，请使用文字表达式，例如属性文件中的`routingKeyExpression='my.routingKey'`或YAML文件中的`routingKeyExpression: '''my.routingKey'''`。默认值：`destination`或`destination-<partition>`（用于分区目标）。

- 交易的

  是否使用交易渠道。默认值：`false`。

- ttl

  声明时适用于队列的默认生存时间（以毫秒为单位）。仅在提供`requiredGroups`时适用，然后仅适用于那些组。默认值：`no limit`

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 对于RabbitMQ，可以由外部应用程序设置内容类型标头。Spring Cloud Stream支持它们作为用于任何类型的传输的扩展内部协议的一部分—包括Kafka（0.11之前的版本）之类的传输，其本身不支持标头。 |

## 41.4重试RabbitMQ Binder

当在活页夹中启用重试后，侦听器容器线程将在配置的任何退避期间暂停。当需要单个消费者严格订购时，这可能很重要。但是，对于其他用例，它阻止在该线程上处理其他消息。使用活页夹重试的另一种方法是设置带有时间的无效字母，以保留在无效字母队列（DLQ）中，并在DLQ本身上进行无效字母配置。有关此处讨论的属性的更多信息[，](https://www.springcloud.cc/spring-cloud-greenwich.html#rabbit-binder-properties)请参见“ [第41.3.1节“ RabbitMQ Binder Properties”](https://www.springcloud.cc/spring-cloud-greenwich.html#rabbit-binder-properties) ”。您可以使用以下示例配置来启用此功能：

- 将`autoBindDlq`设置为`true`。活页夹创建一个DLQ。（可选）您可以在`deadLetterQueueName`中指定一个名称。
- 将`dlqTtl`设置为您要在两次重新交付之间等待的退避时间。
- 将`dlqDeadLetterExchange`设置为默认交换。来自DLQ的过期消息被路由到原始队列，因为默认的`deadLetterRoutingKey`是队列名称（`destination.group`）。设置为默认交换是通过将属性设置为无值来实现的，如下例所示。

要强制对消息进行死信处理，请抛出`AmqpRejectAndDontRequeueException`或将`requeueRejected`设置为`true`（默认值）并抛出任何异常。

循环无休止地继续进行，这对于瞬态问题很好，但是您可能需要在尝试几次后放弃。幸运的是，RabbitMQ提供了`x-death`标头，可让您确定发生了多少个循环。

要在放弃后确认消息，请抛出`ImmediateAcknowledgeAmqpException`。

### 41.4.1整合在一起

以下配置创建一个交换`myDestination`，其中队列`myDestination.consumerGroup`与通配符路由键`#`绑定到主题交换：

```
---
spring.cloud.stream.bindings.input.destination=myDestination
spring.cloud.stream.bindings.input.group=consumerGroup
#disable binder retries
spring.cloud.stream.bindings.input.consumer.max-attempts=1
#dlx/dlq setup
spring.cloud.stream.rabbit.bindings.input.consumer.auto-bind-dlq=true
spring.cloud.stream.rabbit.bindings.input.consumer.dlq-ttl=5000
spring.cloud.stream.rabbit.bindings.input.consumer.dlq-dead-letter-exchange=
---
```

此配置将创建一个绑定到直接交换（`DLX`）的DLQ，其路由密钥为`myDestination.consumerGroup`。当邮件被拒绝时，它们将被路由到DLQ。5秒后，该消息到期，并通过使用队列名称作为路由键将其路由到原始队列，如以下示例所示：

**Spring Boot应用程序。** 

```
@SpringBootApplication
@EnableBinding(Sink.class)
public class XDeathApplication {

    public static void main(String[] args) {
        SpringApplication.run(XDeathApplication.class, args);
    }

    @StreamListener(Sink.INPUT)
    public void listen(String in, @Header(name = "x-death", required = false) Map<?,?> death) {
        if (death != null && death.get("count").equals(3L)) {
            // giving up - don't send to DLX
            throw new ImmediateAcknowledgeAmqpException("Failed after 4 attempts");
        }
        throw new AmqpRejectAndDontRequeueException("failed");
    }

}
```



请注意，`x-death`标头中的count属性是`Long`。

## 41.5错误通道

从版本1.3开始，绑定程序无条件地将异常发送到每个使用者目标的错误通道，并且还可以配置为将异步生产者发送失败消息发送到错误通道。参见“ [??? ](https://www.springcloud.cc/spring-cloud-greenwich.html#)”以获取更多信息。

RabbitMQ有两种类型的发送失败：

- 返回的消息，
- 负面认可的[出版商确认](https://www.rabbitmq.com/confirms.html)。

后者很少见。根据RabbitMQ文档，“只有在负责队列的Erlang进程中发生内部错误时，才会传递[nack]。”

除了启用生产者错误通道（如“ [???](https://www.springcloud.cc/spring-cloud-greenwich.html#) ”中所述）之外，RabbitMQ绑定程序仅在正确配置连接工厂的情况下，才将消息发送到通道，如下所示：

- `ccf.setPublisherConfirms(true);`
- `ccf.setPublisherReturns(true);`

将Spring Boot配置用于连接工厂时，请设置以下属性：

- `spring.rabbitmq.publisher-confirms`
- `spring.rabbitmq.publisher-returns`

用于返回消息的`ErrorMessage`的有效负载是具有以下属性的`ReturnedAmqpMessageException`：

- `failedMessage`：发送失败的Spring消息`Message<?>`。
- `amqpMessage`：原始spring-amqp `Message`。
- `replyCode`：指示失败原因的整数值（例如312-无路由）。
- `replyText`：指示失败原因的文本值（例如，`NO_ROUTE`）。
- `exchange`：发布消息的交易所。
- `routingKey`：发布消息时使用的路由密钥。

对于否定确认的确认，有效负载为`NackedAmqpMessageException`，具有以下属性：

- `failedMessage`：发送失败Spring消息`Message<?>`。
- `nackReason`：原因（如果有，您可能需要检查代理日志以获取更多信息）。

没有对这些异常的自动处理（例如发送到[死信队列](https://www.springcloud.cc/spring-cloud-greenwich.html#rabbit-dlq-processing)）。您可以使用自己的Spring Integration流使用这些异常。

## 41.6 Dead-Letter队列处理

因为您无法预期用户将如何处置死信，所以该框架没有提供任何标准机制来处理它们。如果死信的原因是暂时的，则您可能希望将消息路由回原始队列。但是，如果问题是永久性问题，则可能导致无限循环。以下Spring Boot应用程序显示了一个示例，该示例说明了如何将这些消息路由回原始队列，但在尝试三次后将其移至第三个“ 停车场 ”队列。第二个示例使用[RabbitMQ延迟消息交换](https://www.rabbitmq.com/blog/2015/04/16/scheduling-messages-with-rabbitmq/)为重新排队的消息引入延迟。在此示例中，每次尝试的延迟都会增加。这些示例使用`@RabbitListener`从DLQ接收消息。您也可以在批处理过程中使用`RabbitTemplate.receive()`。

这些示例假定原始目的地为`so8400in`，而消费者组为`so8400`。

### 41.6.1非分区目标

前两个示例适用于目标**未**分区的情况：

```
@SpringBootApplication
public class ReRouteDlqApplication {

    private static final String ORIGINAL_QUEUE = "so8400in.so8400";

    private static final String DLQ = ORIGINAL_QUEUE + ".dlq";

    private static final String PARKING_LOT = ORIGINAL_QUEUE + ".parkingLot";

    private static final String X_RETRIES_HEADER = "x-retries";

    public static void main(String[] args) throws Exception {
        ConfigurableApplicationContext context = SpringApplication.run(ReRouteDlqApplication.class, args);
        System.out.println("Hit enter to terminate");
        System.in.read();
        context.close();
    }

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @RabbitListener(queues = DLQ)
    public void rePublish(Message failedMessage) {
        Integer retriesHeader = (Integer) failedMessage.getMessageProperties().getHeaders().get(X_RETRIES_HEADER);
        if (retriesHeader == null) {
            retriesHeader = Integer.valueOf(0);
        }
        if (retriesHeader < 3) {
            failedMessage.getMessageProperties().getHeaders().put(X_RETRIES_HEADER, retriesHeader + 1);
            this.rabbitTemplate.send(ORIGINAL_QUEUE, failedMessage);
        }
        else {
            this.rabbitTemplate.send(PARKING_LOT, failedMessage);
        }
    }

    @Bean
    public Queue parkingLot() {
        return new Queue(PARKING_LOT);
    }

}
@SpringBootApplication
public class ReRouteDlqApplication {

    private static final String ORIGINAL_QUEUE = "so8400in.so8400";

    private static final String DLQ = ORIGINAL_QUEUE + ".dlq";

    private static final String PARKING_LOT = ORIGINAL_QUEUE + ".parkingLot";

    private static final String X_RETRIES_HEADER = "x-retries";

    private static final String DELAY_EXCHANGE = "dlqReRouter";

    public static void main(String[] args) throws Exception {
        ConfigurableApplicationContext context = SpringApplication.run(ReRouteDlqApplication.class, args);
        System.out.println("Hit enter to terminate");
        System.in.read();
        context.close();
    }

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @RabbitListener(queues = DLQ)
    public void rePublish(Message failedMessage) {
        Map<String, Object> headers = failedMessage.getMessageProperties().getHeaders();
        Integer retriesHeader = (Integer) headers.get(X_RETRIES_HEADER);
        if (retriesHeader == null) {
            retriesHeader = Integer.valueOf(0);
        }
        if (retriesHeader < 3) {
            headers.put(X_RETRIES_HEADER, retriesHeader + 1);
            headers.put("x-delay", 5000 * retriesHeader);
            this.rabbitTemplate.send(DELAY_EXCHANGE, ORIGINAL_QUEUE, failedMessage);
        }
        else {
            this.rabbitTemplate.send(PARKING_LOT, failedMessage);
        }
    }

    @Bean
    public DirectExchange delayExchange() {
        DirectExchange exchange = new DirectExchange(DELAY_EXCHANGE);
        exchange.setDelayed(true);
        return exchange;
    }

    @Bean
    public Binding bindOriginalToDelay() {
        return BindingBuilder.bind(new Queue(ORIGINAL_QUEUE)).to(delayExchange()).with(ORIGINAL_QUEUE);
    }

    @Bean
    public Queue parkingLot() {
        return new Queue(PARKING_LOT);
    }

}
```

### 41.6.2分区目标

对于分区目标，所有分区都有一个DLQ。我们根据标题确定原始队列。

#### `republishToDlq=false`

当`republishToDlq`为`false`时，RabbitMQ使用`x-death`标头将消息发布到DLX / DLQ，标头包含有关原始目的地的信息，如以下示例所示：

```
@SpringBootApplication
public class ReRouteDlqApplication {

	private static final String ORIGINAL_QUEUE = "so8400in.so8400";

	private static final String DLQ = ORIGINAL_QUEUE + ".dlq";

	private static final String PARKING_LOT = ORIGINAL_QUEUE + ".parkingLot";

	private static final String X_DEATH_HEADER = "x-death";

	private static final String X_RETRIES_HEADER = "x-retries";

	public static void main(String[] args) throws Exception {
		ConfigurableApplicationContext context = SpringApplication.run(ReRouteDlqApplication.class, args);
		System.out.println("Hit enter to terminate");
		System.in.read();
		context.close();
	}

	@Autowired
	private RabbitTemplate rabbitTemplate;

	@SuppressWarnings("unchecked")
	@RabbitListener(queues = DLQ)
	public void rePublish(Message failedMessage) {
		Map<String, Object> headers = failedMessage.getMessageProperties().getHeaders();
		Integer retriesHeader = (Integer) headers.get(X_RETRIES_HEADER);
		if (retriesHeader == null) {
			retriesHeader = Integer.valueOf(0);
		}
		if (retriesHeader < 3) {
			headers.put(X_RETRIES_HEADER, retriesHeader + 1);
			List<Map<String, ?>> xDeath = (List<Map<String, ?>>) headers.get(X_DEATH_HEADER);
			String exchange = (String) xDeath.get(0).get("exchange");
			List<String> routingKeys = (List<String>) xDeath.get(0).get("routing-keys");
			this.rabbitTemplate.send(exchange, routingKeys.get(0), failedMessage);
		}
		else {
			this.rabbitTemplate.send(PARKING_LOT, failedMessage);
		}
	}

	@Bean
	public Queue parkingLot() {
		return new Queue(PARKING_LOT);
	}

}
```

#### `republishToDlq=true`

当`republishToDlq`为`true`时，重新发布的恢复程序将原始交换和路由密钥添加到标头中，如以下示例所示：

```
@SpringBootApplication
public class ReRouteDlqApplication {

	private static final String ORIGINAL_QUEUE = "so8400in.so8400";

	private static final String DLQ = ORIGINAL_QUEUE + ".dlq";

	private static final String PARKING_LOT = ORIGINAL_QUEUE + ".parkingLot";

	private static final String X_RETRIES_HEADER = "x-retries";

	private static final String X_ORIGINAL_EXCHANGE_HEADER = RepublishMessageRecoverer.X_ORIGINAL_EXCHANGE;

	private static final String X_ORIGINAL_ROUTING_KEY_HEADER = RepublishMessageRecoverer.X_ORIGINAL_ROUTING_KEY;

	public static void main(String[] args) throws Exception {
		ConfigurableApplicationContext context = SpringApplication.run(ReRouteDlqApplication.class, args);
		System.out.println("Hit enter to terminate");
		System.in.read();
		context.close();
	}

	@Autowired
	private RabbitTemplate rabbitTemplate;

	@RabbitListener(queues = DLQ)
	public void rePublish(Message failedMessage) {
		Map<String, Object> headers = failedMessage.getMessageProperties().getHeaders();
		Integer retriesHeader = (Integer) headers.get(X_RETRIES_HEADER);
		if (retriesHeader == null) {
			retriesHeader = Integer.valueOf(0);
		}
		if (retriesHeader < 3) {
			headers.put(X_RETRIES_HEADER, retriesHeader + 1);
			String exchange = (String) headers.get(X_ORIGINAL_EXCHANGE_HEADER);
			String originalRoutingKey = (String) headers.get(X_ORIGINAL_ROUTING_KEY_HEADER);
			this.rabbitTemplate.send(exchange, originalRoutingKey, failedMessage);
		}
		else {
			this.rabbitTemplate.send(PARKING_LOT, failedMessage);
		}
	}

	@Bean
	public Queue parkingLot() {
		return new Queue(PARKING_LOT);
	}

}
```

## 41.7使用RabbitMQ Binder进行分区

RabbitMQ不支持本地分区。

有时，将数据发送到特定分区是有利的-例如，当您要严格订购消息处理时，特定客户的所有消息都应转到同一分区。

`RabbitMessageChannelBinder`通过将每个分区的队列绑定到目标交换机来提供分区。

以下Java和YAML示例显示了如何配置生产者：

**制片人。** 

```
@SpringBootApplication
@EnableBinding(Source.class)
public class RabbitPartitionProducerApplication {

    private static final Random RANDOM = new Random(System.currentTimeMillis());

    private static final String[] data = new String[] {
            "abc1", "def1", "qux1",
            "abc2", "def2", "qux2",
            "abc3", "def3", "qux3",
            "abc4", "def4", "qux4",
            };

    public static void main(String[] args) {
        new SpringApplicationBuilder(RabbitPartitionProducerApplication.class)
            .web(false)
            .run(args);
    }

    @InboundChannelAdapter(channel = Source.OUTPUT, poller = @Poller(fixedRate = "5000"))
    public Message<?> generate() {
        String value = data[RANDOM.nextInt(data.length)];
        System.out.println("Sending: " + value);
        return MessageBuilder.withPayload(value)
                .setHeader("partitionKey", value)
                .build();
    }

}
```



**application.yml。** 

```
    spring:
      cloud:
        stream:
          bindings:
            output:
              destination: partitioned.destination
              producer:
                partitioned: true
                partition-key-expression: headers['partitionKey']
                partition-count: 2
                required-groups:
                - myGroup
```



| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 前例中的配置使用默认分区（`key.hashCode() % partitionCount`）。根据键值，这可能会或可能不会提供适当的平衡算法。您可以使用`partitionSelectorExpression`或`partitionSelectorClass`属性覆盖此默认设置。仅当在部署生产者时需要提供消费者队列时，才需要`required-groups`属性。否则，发送到分区的所有消息都将丢失，直到部署了相应的使用者为止。 |

以下配置提供了主题交换：

![零件交换](/assets/images/springcloud/part-exchange.png)

该交换绑定了以下队列：

![部分队列](/assets/images/springcloud/part-queues.png)

以下绑定将队列与交换关联：

![零件绑定](/assets/images/springcloud/part-bindings.png)

以下Java和YAML示例继续了前面的示例，并显示了如何配置使用者：

**消费者。** 

```
@SpringBootApplication
@EnableBinding(Sink.class)
public class RabbitPartitionConsumerApplication {

    public static void main(String[] args) {
        new SpringApplicationBuilder(RabbitPartitionConsumerApplication.class)
            .web(false)
            .run(args);
    }

    @StreamListener(Sink.INPUT)
    public void listen(@Payload String in, @Header(AmqpHeaders.CONSUMER_QUEUE) String queue) {
        System.out.println(in + " received from queue " + queue);
    }

}
```



**application.yml。** 

```
    spring:
      cloud:
        stream:
          bindings:
            input:
              destination: partitioned.destination
              group: myGroup
              consumer:
                partitioned: true
                instance-index: 0
```



| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| `RabbitMessageChannelBinder`不支持动态缩放。每个分区至少必须有一个使用方。使用者的`instanceIndex`用于指示使用了哪个分区。诸如Cloud Foundry之类的平台只能具有一个带有`instanceIndex`的实例。 |      |

# 第七部分 Spring Cloud Bus

Spring Cloud Bus用轻量级消息代理链接分布式系统的节点。然后可以使用此代理来广播状态更改（例如配置更改）或其他管理指令。一个关键的想法是，该总线就像用于Spring Boot应用的分布式致动器，可以横向扩展。但是，它也可以用作应用之间的通信渠道。该项目为AMQP经纪人或Kafka作为传输者提供了入门者。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| Spring Cloud是根据非限制性Apache 2.0许可证发行的。如果您想为文档的这一部分做出贡献或发现错误，请在[github](https://github.com/spring-cloud/spring-cloud-config/tree/master/docs/src/main/asciidoc)的项目中找到源代码和问题跟踪程序。 |

## 42.快速入门

如果Spring Cloud Bus在类路径中检测到自身，则通过添加Spring Boot autconfiguration来工作。要启用总线，请将`spring-cloud-starter-bus-amqp`或`spring-cloud-starter-bus-kafka`添加到依赖管理中。Spring Cloud负责其余的工作。确保代理（RabbitMQ或Kafka）可用且已配置。在本地主机上运行时，您无需执行任何操作。如果是远程运行，请使用Spring Cloud连接器或Spring Boot约定来定义代理凭据，如以下Rabbit的示例所示：

**application.yml。** 

```yaml
spring:
  rabbitmq:
    host: mybroker.com
    port: 5672
    username: user
    password: secret
```



总线当前支持将消息发送到侦听的所有节点或特定服务的所有节点（由Eureka定义）。`/bus/*`执行器名称空间具有一些HTTP端点。当前，有两个已实现。第一个`/bus/env`发送键/值对以更新每个节点的Spring环境。第二个`/bus/refresh`重新加载每个应用程序的配置，就好像它们都已在其`/refresh`端点上被ping一样。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| Spring Cloud Bus入门者介绍了Rabbit和Kafka，因为这是两个最常见的实现。但是，Spring Cloud Stream非常灵活，并且活页夹可与`spring-cloud-bus`一起使用。 |

## 43. Bus端点

Spring Cloud Bus提供两个端点`/actuator/bus-refresh`和`/actuator/bus-env`，分别对应于Spring Cloud Commons，`/actuator/refresh`和`/actuator/env`中的各个执行器端点。

## 43.1 Bus刷新端点

`/actuator/bus-refresh`端点清除`RefreshScope`缓存并重新绑定`@ConfigurationProperties`。有关更多信息，请参见[刷新作用域](https://www.springcloud.cc/spring-cloud-greenwich.html#refresh-scope)文档。

要公开`/actuator/bus-refresh`端点，您需要在应用程序中添加以下配置：

```
management.endpoints.web.exposure.include=bus-refresh
```

## 43.2 Bus环保端点

`/actuator/bus-env`端点使用跨多个实例的指定键/值对更新每个实例环境。

要公开`/actuator/bus-env`端点，您需要在应用程序中添加以下配置：

```
management.endpoints.web.exposure.include=bus-env
```

`/actuator/bus-env`端点接受具有以下形状的`POST`请求：

```
{
	"name": "key1",
	"value": "value1"
}
```

## 44.寻址实例

应用程序的每个实例都有一个服务ID，该服务ID的值可以用`spring.cloud.bus.id`设置，并且其值应按冒号分隔的标识符列表（从最小到最具体）排列。默认值是根据环境构造的，它是`spring.application.name`和`server.port`（或`spring.application.index`，如果已设置）的组合。ID的默认值以`app:index:id`的形式构造，其中：

- `app`是`vcap.application.name`（如果存在），或者是`spring.application.name`
- `index`是`vcap.application.instance_index`（如果存在），依次为`spring.application.index`，`local.server.port`，`server.port`或`0`。
- `id`是`vcap.application.instance_id`（如果存在）或随机值。

HTTP端点接受“ 目的地 ”路径参数，例如`/bus-refresh/customers:9000`，其中`destination`是服务ID。如果该ID由总线上的一个实例拥有，它将处理该消息，而所有其他实例将忽略它。

## 45.解决服务的所有实例

的“ 目的地 ”参数中使用的Spring `PathMatcher`（与路径分隔作为结肠- `:`），以确定是否一个实例处理该消息。使用前面的示例，`/bus-env/customers:**`定位“ 客户 ”服务的所有实例， 而与其余服务ID无关。

## 46.服务ID必须唯一

总线尝试两次消除处理事件，一次来自原始`ApplicationEvent`，一次来自队列。为此，它将对照当前服务ID检查发送服务ID。如果服务的多个实例具有相同的ID，则不会处理事件。在本地计算机上运行时，每个服务都在不同的端口上，并且该端口是ID的一部分。Cloud Foundry提供了区分索引。为确保ID在Cloud Foundry之外是唯一的，请为每个服务实例将`spring.application.index`设置为唯一。

## 47.定制消息代理

Spring Cloud Bus使用[Spring Cloud Stream](https://cloud.spring.io/spring-cloud-stream)广播消息。因此，要使消息流动，您只需要在类路径中包括您选择的活页夹实现即可。对于AMQP（RabbitMQ）和Kafka（`spring-cloud-starter-bus-[amqp|kafka]`）的公交车来说，起动器很方便。一般来说，Spring Cloud Stream依赖于Spring Boot自动配置约定来配置中间件。例如，可以使用`spring.rabbitmq.*`配置属性来更改AMQP代理地址。Spring Cloud Bus在`spring.cloud.bus.*`中具有一些本机配置属性（例如，`spring.cloud.bus.destination`是用作外部中间件的主题的名称）。通常，默认值就足够了。

要了解有关如何自定义消息代理设置的更多信息，请参阅Spring Cloud流文档。

## 48.追踪Bus Events

可以通过设置`spring.cloud.bus.trace.enabled=true`来跟踪Bus事件（`RemoteApplicationEvent`的子类）。如果这样做，Spring Boot `TraceRepository`（如果存在）将显示发送的每个事件以及每个服务实例的所有确认。以下示例来自`/trace`端点：

```
{
  "timestamp": "2015-11-26T10:24:44.411+0000",
  "info": {
    "signal": "spring.cloud.bus.ack",
    "type": "RefreshRemoteApplicationEvent",
    "id": "c4d374b7-58ea-4928-a312-31984def293b",
    "origin": "stores:8081",
    "destination": "*:**"
  }
  },
  {
  "timestamp": "2015-11-26T10:24:41.864+0000",
  "info": {
    "signal": "spring.cloud.bus.sent",
    "type": "RefreshRemoteApplicationEvent",
    "id": "c4d374b7-58ea-4928-a312-31984def293b",
    "origin": "customers:9000",
    "destination": "*:**"
  }
  },
  {
  "timestamp": "2015-11-26T10:24:41.862+0000",
  "info": {
    "signal": "spring.cloud.bus.ack",
    "type": "RefreshRemoteApplicationEvent",
    "id": "c4d374b7-58ea-4928-a312-31984def293b",
    "origin": "customers:9000",
    "destination": "*:**"
  }
}
```

前面的迹线显示`RefreshRemoteApplicationEvent`从`customers:9000`发送，广播到所有服务，并由`customers:9000`和`stores:8081`接收（确认）。

要自己处理确认信号，您可以为应用程序中的`AckRemoteApplicationEvent`和`SentApplicationEvent`类型添加一个`@EventListener`（并启用跟踪）。或者，您可以点击`TraceRepository`并从那里挖掘数据。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 任何Bus应用程序都可以跟踪acks。但是，有时，在中央服务中执行此操作很有用，该服务可以对数据进行更复杂的查询，或将其转发给专门的跟踪服务。 |

## 49.广播自己的Events

Bus可以携带`RemoteApplicationEvent`类型的任何事件。默认传输是JSON，解串器需要提前知道将要使用哪些类型。要注册新类型，必须将其放在`org.springframework.cloud.bus.event`的子包中。

要自定义事件名称，可以在自定义类上使用`@JsonTypeName`或依赖默认策略，即使用类的简单名称。

| ![[注意]](/assets/images/springcloud/note.png)         |
| -------------------------------- |
| 生产者和消费者都需要访问类定义。 |

## 49.1在自定义程序包中注册事件

如果您不能或不想将`org.springframework.cloud.bus.event`的子包用于自定义事件，则必须使用`@RemoteApplicationEventScan`批注指定要扫描哪些包来扫描类型为`RemoteApplicationEvent`的事件。用`@RemoteApplicationEventScan`指定的软件包包括子软件包。

例如，考虑以下自定义事件，称为`MyEvent`：

```
package com.acme;

public class MyEvent extends RemoteApplicationEvent {
    ...
}
```

您可以通过以下方式在反序列化器中注册该事件：

```
package com.acme;

@Configuration
@RemoteApplicationEventScan
public class BusConfiguration {
    ...
}
```

不指定值，将注册使用`@RemoteApplicationEventScan`的类的包。在本示例中，使用包`BusConfiguration`注册了`com.acme`。

您还可以通过使用`@RemoteApplicationEventScan`上的`value`，`basePackages`或`basePackageClasses`属性来明确指定要扫描的软件包，如以下示例所示：

```
package com.acme;

@Configuration
//@RemoteApplicationEventScan({"com.acme", "foo.bar"})
//@RemoteApplicationEventScan(basePackages = {"com.acme", "foo.bar", "fizz.buzz"})
@RemoteApplicationEventScan(basePackageClasses = BusConfiguration.class)
public class BusConfiguration {
    ...
}
```

`@RemoteApplicationEventScan`的所有上述示例都是等效的，因为`com.acme`软件包是通过在`@RemoteApplicationEventScan`上显式指定软件包来注册的。

| ![[注意]](/assets/images/springcloud/note.png)           |
| ---------------------------------- |
| 您可以指定要扫描的多个基本软件包。 |

# 第八部分 Spring Cloud Sleuth

阿德里安·科尔（Adrian Cole），斯宾塞·吉布（Spencer Gibb），马辛·格热兹扎克（Marcin Grzejszczak），戴夫·瑟（Dave Syer），杰伊·布莱恩特（Jay Bryant）

**Greenwich SR5**

## 50.引言

Spring Cloud Sleuth为[Spring Cloud](https://cloud.spring.io/)实现了分布式跟踪解决方案。

## 50.1术语

Spring Cloud Sleuth借鉴了[Dapper的](https://research.google.com/pubs/pub36356.html)术语。

**Span**：基本工作单元。例如，发送RPC是一个新的跨度，就像发送响应到RPC一样。跨度由跨度的唯一64位ID和跨度所属的跟踪的另一个64位ID标识。跨区还具有其他数据，例如描述，带有时间戳的事件，键值注释（标签），引起跨度的跨区ID和进程ID（通常为IP地址）。

跨度可以启动和停止，并且可以跟踪其时序信息。创建跨度后，您必须在将来的某个时间点将其停止。

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 开始跟踪的初始跨度称为`root span`。该跨度的ID的值等于跟踪ID。 |

**迹线：**一组spans，形成树状结构。例如，如果您运行分布式大数据存储，则跟踪可能由`PUT`请求形成。

**注释：**用于及时记录事件的存在。使用 [Brave](https://github.com/openzipkin/brave)工具，我们不再需要为[ Zipkin](https://zipkin.io/)设置特殊事件来了解客户端和服务器是谁，请求在哪里开始以及在哪里结束。但是，出于学习目的，我们标记这些事件以突出显示发生了哪种操作。

- **cs**：客户端已发送。客户提出了要求。此注释指示跨度的开始。
- **sr**：接收到服务器：服务器端收到了请求并开始处理它。从此时间戳中减去`cs`时间戳可显示网络延迟。
- **ss**：服务器已发送。在请求处理完成时进行注释（当响应被发送回客户端时）。从此时间戳中减去`sr`时间戳将显示服务器端处理请求所需的时间。
- **cr**：收到客户。表示跨度结束。客户端已成功收到服务器端的响应。从此时间戳中减去`cs`时间戳将显示客户端从服务器接收响应所需的整个时间。

下图显示了**Span**和**Trace**在系统中的外观以及Zipkin批注：

![跟踪信息传播](/assets/images/springcloud/trace-id.png)

音符的每种颜色都表示一个跨度（从**A**到**G**共有七个spans- ）。请考虑以下注意事项：

```
Trace Id = X
Span Id = D
Client Sent
```

该说明指出，当前跨距**跟踪编号**设定为**X**和**Span标识**设置为**d**。同样，发生了`Client Sent`事件。

下图显示了spans的父子关系：

![亲子关系](/assets/images/springcloud/parents.png)

## 50.2目的

以下各节引用上图中显示的示例。

### 50.2.1使用Zipkin进行分布式跟踪

本示例有七个spans。如果转到Zipkin中的跟踪，则可以在第二个跟踪中看到此数字，如下图所示：

![痕迹](/assets/images/springcloud/zipkin-traces.png)

但是，如果选择特定的跟踪，则可以看到四个spans，如下图所示：

![跟踪信息传播](/assets/images/springcloud/zipkin-ui.png)

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 选择特定跟踪时，您会看到合并的spans。这意味着，如果有两个spans发送到Zipkin，并且带有“服务器已接收和服务器已发送”或“客户端已接收和客户端已发送”注释，它们将显示为单个跨度。 |

在这种情况下，为什么七个spans和四个spans之间有区别？

- 一个跨度来自`http:/start`跨度。它具有服务器已接收（`sr`）和服务器已发送（`ss`）批注。
- 从`service1`到`service2`到`http:/foo`端点的RPC调用中有两个spans。客户发送（`cs`）和客户接收（`cr`）事件在`service1`端发生。服务器已接收（`sr`）和服务器已发送（`ss`）事件在`service2`端发生。这两个spans构成一个与RPC调用相关的逻辑范围。
- 从`service2`到`service3`到`http:/bar`端点的RPC调用中有两个spans。客户发送（`cs`）和客户接收（`cr`）事件在`service2`端发生。服务器已接收（`sr`）和服务器已发送（`ss`）事件在`service3`端发生。这两个spans构成一个与RPC调用相关的逻辑范围。
- 从`service2`到`service4`到`http:/baz`端点的RPC调用中有两个spans。客户发送（`cs`）和客户接收（`cr`）事件在`service2`端发生。服务器已收到（`sr`）和服务器已发送（`ss`）事件在`service4`端发生。这两个spans构成一个与RPC调用相关的逻辑范围。

因此，如果我们计算物理量spans，则有一个来自`http:/start`的实体，两个来自`service1`的实体，调用`service2`，两个来自`service2`的实体，调用`service3`，还有两个来自`service2`致电`service4`。总而言之，我们总共有七个spans。

从逻辑上讲，我们看到四个跨度的信息，因为我们有一个跨度与到`service1`的传入请求有关，而有三个spans与RPC调用有关。

### 50.2.2可视化错误

Zipkin使您可以可视化跟踪中的错误。当引发异常但未捕获到异常时，我们在跨度上设置了适当的标记，然后Zipkin即可正确着色。您可以在迹线列表中看到一条红色的迹线。之所以出现，是因为引发了异常。

如果单击该跟踪，将看到类似的图片，如下所示：

![错误痕迹](/assets/images/springcloud/zipkin-error-traces.png)

如果然后单击spans之一，则会看到以下内容

![错误跟踪信息传播](/assets/images/springcloud/zipkin-error-trace-screenshot.png)

跨度显示了错误的原因以及与之相关的整个堆栈跟踪。

### 50.2.3勇敢的分布式跟踪

从版本`2.0.0`开始，Spring Cloud Sleuth使用[Brave](https://github.com/openzipkin/brave)作为跟踪库。因此，Sleuth不再负责存储上下文，而是将工作委托给Brave。

由于Sleuth与Brave具有不同的命名和标记约定，因此我们决定从现在开始遵循Brave的约定。但是，如果要使用传统的Sleuth方法，可以将`spring.sleuth.http.legacy.enabled`属性设置为`true`。

### 50.2.4现场示例



**图50.1。点击“ Pivotal Web服务”图标即可观看！**

![Zipkin部署在Pivotal Web Services上](/assets/images/springcloud/pws.png)



[点击此处观看直播！](https://docssleuth-zipkin-server.cfapps.io/)

Zipkin中的依赖关系图应类似于下图：

![依存关系](/assets/images/springcloud/dependencies.png)



**图50.2。点击“ Pivotal Web服务”图标即可观看！**

![Zipkin部署在Pivotal Web Services上](/assets/images/springcloud/pws.png)



[点击此处观看直播！](https://docssleuth-zipkin-server.cfapps.io/dependency)

### 50.2.5日志关联

当使用grep通过扫描等于（例如）`2485ec27856c56f4`的跟踪ID来读取这四个应用程序的日志时，将获得类似于以下内容的输出：

```
service1.log:2016-02-26 11:15:47.561  INFO [service1,2485ec27856c56f4,2485ec27856c56f4,true] 68058 --- [nio-8081-exec-1] i.s.c.sleuth.docs.service1.Application   : Hello from service1. Calling service2
service2.log:2016-02-26 11:15:47.710  INFO [service2,2485ec27856c56f4,9aa10ee6fbde75fa,true] 68059 --- [nio-8082-exec-1] i.s.c.sleuth.docs.service2.Application   : Hello from service2. Calling service3 and then service4
service3.log:2016-02-26 11:15:47.895  INFO [service3,2485ec27856c56f4,1210be13194bfe5,true] 68060 --- [nio-8083-exec-1] i.s.c.sleuth.docs.service3.Application   : Hello from service3
service2.log:2016-02-26 11:15:47.924  INFO [service2,2485ec27856c56f4,9aa10ee6fbde75fa,true] 68059 --- [nio-8082-exec-1] i.s.c.sleuth.docs.service2.Application   : Got response from service3 [Hello from service3]
service4.log:2016-02-26 11:15:48.134  INFO [service4,2485ec27856c56f4,1b1845262ffba49d,true] 68061 --- [nio-8084-exec-1] i.s.c.sleuth.docs.service4.Application   : Hello from service4
service2.log:2016-02-26 11:15:48.156  INFO [service2,2485ec27856c56f4,9aa10ee6fbde75fa,true] 68059 --- [nio-8082-exec-1] i.s.c.sleuth.docs.service2.Application   : Got response from service4 [Hello from service4]
service1.log:2016-02-26 11:15:48.182  INFO [service1,2485ec27856c56f4,2485ec27856c56f4,true] 68058 --- [nio-8081-exec-1] i.s.c.sleuth.docs.service1.Application   : Got response from service2 [Hello from service2, response from service3 [Hello from service3] and from service4 [Hello from service4]]
```

如果您使用日志汇总工具（例如[Kibana](https://www.elastic.co/products/kibana)，[Splunk](https://www.splunk.com/)和其他工具），则可以对发生的事件进行排序。来自Kibana的示例类似于下图：

![与Kibana的对数关联](/assets/images/springcloud/kibana.png)

如果要使用[Logstash](https://www.elastic.co/guide/en/logstash/current/index.html)，以下清单显示了Logstash的Grok模式：

```
filter {
       # pattern matching logback pattern
       grok {
              match => { "message" => "%{TIMESTAMP_ISO8601:timestamp}\s+%{LOGLEVEL:severity}\s+\[%{DATA:service},%{DATA:trace},%{DATA:span},%{DATA:exportable}\]\s+%{DATA:pid}\s+---\s+\[%{DATA:thread}\]\s+%{DATA:class}\s+:\s+%{GREEDYDATA:rest}" }
       }
}
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 如果要将Grok与Cloud Foundry中的日志一起使用，则必须使用以下模式： |

```
filter {
       # pattern matching logback pattern
       grok {
              match => { "message" => "(?m)OUT\s+%{TIMESTAMP_ISO8601:timestamp}\s+%{LOGLEVEL:severity}\s+\[%{DATA:service},%{DATA:trace},%{DATA:span},%{DATA:exportable}\]\s+%{DATA:pid}\s+---\s+\[%{DATA:thread}\]\s+%{DATA:class}\s+:\s+%{GREEDYDATA:rest}" }
       }
}
```

#### 使用Logstash进行JSON Logback

通常，您不想将日志存储在文本文件中，而是存储在Logstash可以立即选择的JSON文件中。为此，您必须执行以下操作（出于可读性考虑，我们以`groupId:artifactId:version`表示法传递依赖项）。

**依赖关系设置**

1. 确保Logback位于类路径（`ch.qos.logback:logback-core`）上。
2. 添加Logstash Logback编码。例如，要使用版本`4.6`，请添加`net.logstash.logback:logstash-logback-encoder:4.6`。

**登录设置**

考虑以下Logback配置文件示例（名为[logback-spring.xml](https://github.com/spring-cloud-samples/sleuth-documentation-apps/blob/master/service1/src/main/resources/logback-spring.xml)）。

```
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
	<include resource="org/springframework/boot/logging/logback/defaults.xml"/>
	
	<springProperty scope="context" name="springAppName" source="spring.application.name"/>
	<!-- Example for logging into the build folder of your project -->
	<property name="LOG_FILE" value="${BUILD_FOLDER:-build}/${springAppName}"/>

	<!-- You can override this to have a custom pattern -->
	<property name="CONSOLE_LOG_PATTERN"
			  value="%clr(%d{yyyy-MM-dd HH:mm:ss.SSS}){faint} %clr(${LOG_LEVEL_PATTERN:-%5p}) %clr(${PID:- }){magenta} %clr(---){faint} %clr([%15.15t]){faint} %clr(%-40.40logger{39}){cyan} %clr(:){faint} %m%n${LOG_EXCEPTION_CONVERSION_WORD:-%wEx}"/>

	<!-- Appender to log to console -->
	<appender name="console" class="ch.qos.logback.core.ConsoleAppender">
		<filter class="ch.qos.logback.classic.filter.ThresholdFilter">
			<!-- Minimum logging level to be presented in the console logs-->
			<level>DEBUG</level>
		</filter>
		<encoder>
			<pattern>${CONSOLE_LOG_PATTERN}</pattern>
			<charset>utf8</charset>
		</encoder>
	</appender>

	<!-- Appender to log to file -->
	<appender name="flatfile" class="ch.qos.logback.core.rolling.RollingFileAppender">
		<file>${LOG_FILE}</file>
		<rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
			<fileNamePattern>${LOG_FILE}.%d{yyyy-MM-dd}.gz</fileNamePattern>
			<maxHistory>7</maxHistory>
		</rollingPolicy>
		<encoder>
			<pattern>${CONSOLE_LOG_PATTERN}</pattern>
			<charset>utf8</charset>
		</encoder>
	</appender>
	
	<!-- Appender to log to file in a JSON format -->
	<appender name="logstash" class="ch.qos.logback.core.rolling.RollingFileAppender">
		<file>${LOG_FILE}.json</file>
		<rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
			<fileNamePattern>${LOG_FILE}.json.%d{yyyy-MM-dd}.gz</fileNamePattern>
			<maxHistory>7</maxHistory>
		</rollingPolicy>
		<encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
			<providers>
				<timestamp>
					<timeZone>UTC</timeZone>
				</timestamp>
				<pattern>
					<pattern>
						{
						"severity": "%level",
						"service": "${springAppName:-}",
						"trace": "%X{X-B3-TraceId:-}",
						"span": "%X{X-B3-SpanId:-}",
						"parent": "%X{X-B3-ParentSpanId:-}",
						"exportable": "%X{X-Span-Export:-}",
						"pid": "${PID:-}",
						"thread": "%thread",
						"class": "%logger{40}",
						"rest": "%message"
						}
					</pattern>
				</pattern>
			</providers>
		</encoder>
	</appender>
	
	<root level="INFO">
		<appender-ref ref="console"/>
		<!-- uncomment this to have also JSON logs -->
		<!--<appender-ref ref="logstash"/>-->
		<!--<appender-ref ref="flatfile"/>-->
	</root>
</configuration>
```

该Logback配置文件：

- 将应用程序中的信息以JSON格式记录到`build/${spring.application.name}.json`文件中。
- 注释了两个附加的附加程序：控制台和标准日志文件。
- 具有与上一部分相同的日志记录模式。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 如果使用自定义`logback-spring.xml`，则必须在`bootstrap`中传递`spring.application.name`，而不是在`application`属性文件中传递。否则，您的自定义登录文件将无法正确读取该属性。 |

### 50.2.6传播Span上下文

跨度上下文是必须跨进程边界传播到任何子项spans的状态。Span上下文的一部分是行李。跟踪和跨度ID是跨度上下文的必需部分。行李是可选部件。

行李是存储在span上下文中的一组key：value对。行李与踪迹一起旅行，并附着在每个跨度上。Spring Cloud Sleuth理解，如果HTTP标头以`baggage-`为前缀，则标头与行李有关，对于消息传递，标头以`baggage_`开头。

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 当前对行李物品的数量或大小没有限制。但是，请记住，太多会降低系统吞吐量或增加RPC延迟。在极端情况下，由于超出传输级消息或标头容量，过多的行李可能会使应用程序崩溃。 |      |

以下示例显示跨度设置行李：

```
Span initialSpan = this.tracer.nextSpan().name("span").start();
ExtraFieldPropagation.set(initialSpan.context(), "foo", "bar");
ExtraFieldPropagation.set(initialSpan.context(), "UPPER_CASE", "someValue");
```

#### 行李与Span标签

行李随身携带（每个孩子跨度都包含其父母的行李）。Zipkin不了解行李并且不接收该信息。

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 从Sleuth 2.0.0开始，您必须在项目配置中显式传递行李密钥名称。[在此处](https://www.springcloud.cc/spring-cloud-greenwich.html#prefixed-fields)阅读有关该设置的更多信息 |      |

标签被附加到特定范围。换句话说，它们仅针对该特定跨度显示。但是，您可以按标签搜索以找到轨迹，前提是存在一个具有所搜索标签值的跨度。

如果您希望能够基于行李查找跨度，则应在根跨度中添加相应的条目作为标签。

| ![[重要]](/assets/images/springcloud/important.png) | 重要 |
| ----------------------------- | ---- |
| 范围必须在范围内。            |      |

以下清单显示了使用行李的集成测试：

**设置。** 

```
spring.sleuth:
  baggage-keys:
    - baz
    - bizarrecase
  propagation-keys:
    - foo
    - upper_case
```



**编码。** 

```
initialSpan.tag("foo",
		ExtraFieldPropagation.get(initialSpan.context(), "foo"));
initialSpan.tag("UPPER_CASE",
		ExtraFieldPropagation.get(initialSpan.context(), "UPPER_CASE"));
```



## 50.3在项目中添加侦探

本节介绍如何使用Maven或Gradle将Sleuth添加到项目中。

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 为确保您的应用程序名称正确显示在Zipkin中，请在`bootstrap.yml`中设置`spring.application.name`属性。 |      |

### 50.3.1仅侦探（对数关联）

如果您只想使用Spring Cloud Sleuth而没有Zipkin集成，则将`spring-cloud-starter-sleuth`模块添加到您的项目中。

下面的示例演示如何使用Maven添加Sleuth：

**Maven.** 

```
<dependencyManagement> 
      <dependencies>
          <dependency>
              <groupId>org.springframework.cloud</groupId>
              <artifactId>spring-cloud-dependencies</artifactId>
              <version>${release.train.version}</version>
              <type>pom</type>
              <scope>import</scope>
          </dependency>
      </dependencies>
</dependencyManagement>

<dependency> 
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-sleuth</artifactId>
</dependency>
```



| [![1个](/assets/images/springcloud/1.png)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO1-1) | 我们建议您通过Spring BOM添加依赖项管理，这样就不必自己管理版本。 |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [![2](/assets/images/springcloud/2.png)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO1-2) | 将依赖项添加到`spring-cloud-starter-sleuth`。                |

下面的示例演示如何使用Gradle添加Sleuth：

**Gradle.** 

```
dependencyManagement { 
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-dependencies:${releaseTrainVersion}"
    }
}

dependencies { 
    compile "org.springframework.cloud:spring-cloud-starter-sleuth"
}
```



| [![1个](/assets/images/springcloud/1.png)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO2-1) | 我们建议您通过Spring BOM添加依赖项管理，这样就不必自己管理版本。 |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [![2](/assets/images/springcloud/2.png)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO2-2) | 将依赖项添加到`spring-cloud-starter-sleuth`。                |

### 50.3.2通过HTTP与Zipkin一起侦听

如果您同时需要Sleuth和Zipkin，请添加`spring-cloud-starter-zipkin`依赖项。

以下示例显示如何针对Maven执行此操作：

**Maven.** 

```
<dependencyManagement> 
      <dependencies>
          <dependency>
              <groupId>org.springframework.cloud</groupId>
              <artifactId>spring-cloud-dependencies</artifactId>
              <version>${release.train.version}</version>
              <type>pom</type>
              <scope>import</scope>
          </dependency>
      </dependencies>
</dependencyManagement>

<dependency> 
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-zipkin</artifactId>
</dependency>
```



| [![1个](/assets/images/springcloud/1.png)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO3-1) | 我们建议您通过Spring BOM添加依赖项管理，这样就不必自己管理版本。 |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [![2](/assets/images/springcloud/2.png)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO3-2) | 将依赖项添加到`spring-cloud-starter-zipkin`。                |

以下示例显示了如何对Gradle执行此操作：

**Gradle.** 

```
dependencyManagement { 
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-dependencies:${releaseTrainVersion}"
    }
}

dependencies { 
    compile "org.springframework.cloud:spring-cloud-starter-zipkin"
}
```



| [![1个](/assets/images/springcloud/1.png)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO4-1) | 我们建议您通过Spring BOM添加依赖项管理，这样就不必自己管理版本。 |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [![2](/assets/images/springcloud/2.png)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO4-2) | 将依赖项添加到`spring-cloud-starter-zipkin`。                |

### 50.3.3侦探，其中Zipkin高于RabbitMQ或Kafka

如果要使用RabbitMQ或Kafka而不是HTTP，请添加`spring-rabbit`或`spring-kafka`依赖项。默认目的地名称为`zipkin`。

如果使用Kafka，则必须相应地设置属性`spring.zipkin.sender.type`：

```
spring.zipkin.sender.type: kafka
```

| ![[警告]](/assets/images/springcloud/caution.png)                                  | 警告 |
| ------------------------------------------------------------ | ---- |
| `spring-cloud-sleuth-stream`已过时，并且与这些目的地不兼容。 |      |

如果要让Sleuth超过RabbitMQ，请添加`spring-cloud-starter-zipkin`和`spring-rabbit`依赖项。

以下示例显示了如何对Gradle执行此操作：

**Maven.** 

```
<dependencyManagement> 
      <dependencies>
          <dependency>
              <groupId>org.springframework.cloud</groupId>
              <artifactId>spring-cloud-dependencies</artifactId>
              <version>${release.train.version}</version>
              <type>pom</type>
              <scope>import</scope>
          </dependency>
      </dependencies>
</dependencyManagement>

<dependency> 
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-zipkin</artifactId>
</dependency>
<dependency> 
    <groupId>org.springframework.amqp</groupId>
    <artifactId>spring-rabbit</artifactId>
</dependency>
```



| [![1个](/assets/images/springcloud/1.png)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO5-1) | 我们建议您通过Spring BOM添加依赖项管理，这样就不必自己管理版本。 |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [![2](/assets/images/springcloud/2.png)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO5-2) | 将依赖项添加到`spring-cloud-starter-zipkin`。这样，所有嵌套的依赖项都将被下载。 |
| [![3](/assets/images/springcloud/3.png)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO5-3) | 要自动配置RabbitMQ，请添加`spring-rabbit`依赖项。            |

**Gradle.** 

```
dependencyManagement { 
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-dependencies:${releaseTrainVersion}"
    }
}

dependencies {
    compile "org.springframework.cloud:spring-cloud-starter-zipkin" 
    compile "org.springframework.amqp:spring-rabbit" 
}
```



| [![1个](/assets/images/springcloud/1.png)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO6-1) | 我们建议您通过Spring BOM添加依赖项管理，这样就不必自己管理版本。 |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [![2](/assets/images/springcloud/2.png)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO6-2) | 将依赖项添加到`spring-cloud-starter-zipkin`。这样，所有嵌套的依赖项都将被下载。 |
| [![3](/assets/images/springcloud/3.png)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO6-3) | 要自动配置RabbitMQ，请添加`spring-rabbit`依赖项。            |

## 50.4覆盖Zipkin的自动配置

Spring Cloud Sleuth支持从2.1.0版开始将跟踪发送到多个跟踪系统。为了使它起作用，每个跟踪系统都需要具有`Reporter<Span>`和`Sender`。如果要覆盖提供的beans，则需要给它们指定一个特定的名称。为此，您可以分别使用`ZipkinAutoConfiguration.REPORTER_BEAN_NAME`和`ZipkinAutoConfiguration.SENDER_BEAN_NAME`。

```
@Configuration
protected static class MyConfig {

	@Bean(ZipkinAutoConfiguration.REPORTER_BEAN_NAME)
	Reporter<zipkin2.Span> myReporter() {
		return AsyncReporter.create(mySender());
	}

	@Bean(ZipkinAutoConfiguration.SENDER_BEAN_NAME)
	MySender mySender() {
		return new MySender();
	}

	static class MySender extends Sender {

		private boolean spanSent = false;

		boolean isSpanSent() {
			return this.spanSent;
		}

		@Override
		public Encoding encoding() {
			return Encoding.JSON;
		}

		@Override
		public int messageMaxBytes() {
			return Integer.MAX_VALUE;
		}

		@Override
		public int messageSizeInBytes(List<byte[]> encodedSpans) {
			return encoding().listSizeInBytes(encodedSpans);
		}

		@Override
		public Call<Void> sendSpans(List<byte[]> encodedSpans) {
			this.spanSent = true;
			return Call.create(null);
		}

	}

}
```

## 51.其他资源

[点击此处，](https://content.pivotal.io/springone-platform-2017/distributed-tracing-latency-analysis-for-your-microservices-grzejszczak-krishna)您可以观看[Reshmi Krishna](https://twitter.com/reshmi9k)和[Marcin Grzejszczak](https://twitter.com/mgrzejszczak)谈论Spring Cloud Sleuth和Zipkin [的视频](https://content.pivotal.io/springone-platform-2017/distributed-tracing-latency-analysis-for-your-microservices-grzejszczak-krishna)。

您可以[在openzipkin / sleuth-webmvc-example系统信息库中](https://github.com/openzipkin/sleuth-webmvc-example)检查Sleuth和Brave的不同设置。

## 52.特点

- 将跟踪和跨度ID添加到Slf4J MDC，因此您可以在日志聚合器中从给定的跟踪或跨度提取所有日志，如以下示例日志所示：

  ```
  2016-02-02 15:30:57.902  INFO [bar,6bfd228dc00d216b,6bfd228dc00d216b,false] 23030 --- [nio-8081-exec-3] ...
  2016-02-02 15:30:58.372 ERROR [bar,6bfd228dc00d216b,6bfd228dc00d216b,false] 23030 --- [nio-8081-exec-3] ...
  2016-02-02 15:31:01.936  INFO [bar,46ab0d418373cbc9,46ab0d418373cbc9,false] 23030 --- [nio-8081-exec-4] ...
  ```

  请注意来自MDC的`[appname,traceId,spanId,exportable]`条目：

  - **`spanId`**：发生的特定操作的ID。
  - **`appname`**：记录跨度的应用程序的名称。
  - **`traceId`**：包含跨度的延迟图的ID。
  - **`exportable`**：是否应将日志导出到Zipkin。您何时希望跨度不可导出？当您要将某些操作包装在Span中并且仅将其写入日志时。

- 提供对常见的分布式跟踪数据模型的抽象：跟踪，spans（形成DAG），注释和键值注释。Spring Cloud Sleuth大致基于HTrace，但与Zipkin（Dapper）兼容。

- Sleuth记录计时信息以帮助进行延迟分析。通过使用侦探，您可以查明应用程序中延迟的原因。

- 编写Sleuth时不要过多记录日志，也不会导致生产应用程序崩溃。为此，Sleuth：

  - 在带内传播有关调用图的结构数据，并在带外传播其余数据。
  - 包括对诸如HTTP之类的层的自觉检测。
  - 包括用于管理数量的采样策略。
  - 可以向Zipkin系统报告以进行查询和可视化。

- 从Spring应用程序（servlet过滤器，异步端点，休息模板，计划的操作，消息通道，Zuul过滤器和Feign客户端）中检测常见的入口和出口点。

- Sleuth包含默认逻辑以跨HTTP或消息传递边界加入跟踪。例如，HTTP传播适用于Zipkin兼容的请求标头。

- 侦查可以在进程之间传播上下文（也称为行李）。因此，如果您在Span上设置了行李元素，则该元素将通过HTTP或消息传递被下游发送到其他进程。

- 提供一种创建或继续spans以及通过注释添加标签和日志的方法。

- 如果`spring-cloud-sleuth-zipkin`在类路径上，则该应用生成并收集Zipkin兼容的跟踪。默认情况下，它通过HTTP将它们发送到本地主机（端口9411）上的Zipkin服务器。您可以通过设置`spring.zipkin.baseUrl`来配置服务的位置。

  - 如果您依赖`spring-rabbit`，则您的应用会将跟踪发送到RabbitMQ代理，而不是HTTP。
  - 如果您依赖`spring-kafka`并设置为`spring.zipkin.sender.type: kafka`，则您的应用会将跟踪发送到Kafka代理而不是HTTP。

| ![[警告]](/assets/images/springcloud/caution.png)                      | 警告 |
| ------------------------------------------------ | ---- |
| `spring-cloud-sleuth-stream`已过时，不应再使用。 |      |

- Spring Cloud Sleuth与[OpenTracing](https://opentracing.io/)兼容。

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 如果使用Zipkin，请通过设置`spring.sleuth.sampler.probability`（默认值：0.1，即10％）来配置spans导出的概率。否则，您可能会认为Sleuth无法正常工作，因为它忽略了一些spans。 |      |

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 始终设置SLF4J MDC，并且按先前显示的示例，登录用户可以立即在日志中看到跟踪和跨度ID。其他日志记录系统必须配置自己的格式化程序才能获得相同的结果。默认值如下：`logging.pattern.level`设置为`%5p [${spring.zipkin.service.name:${spring.application.name:-}},%X{X-B3-TraceId:-},%X{X-B3-SpanId:-},%X{X-Span-Export:-}]`（这是Logback用户的Spring Boot功能）。如果您不使用SLF4J，则不会自动应用此模式。 |

## 52.1.Brave简介

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 从版本`2.0.0`开始，Spring Cloud Sleuth使用 [Brave](https://github.com/openzipkin/brave)作为跟踪库。为方便起见，我们在此处嵌入了Brave文档的一部分。 |      |

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 在大多数情况下，您只需要使用Sleuth提供的Brave提供的`Tracer`或`SpanCustomizer` beans。以下文档概述了Brave是什么以及它如何工作。 |      |

勇敢是一个库，用于捕获有关分布式操作的延迟信息并将其报告给Zipkin。大多数用户不直接使用Brave。他们使用库或框架，而不是代表他们使用Brave。

该模块包括一个跟踪器，该跟踪器创建并加入spans，以对潜在的分布式工作的延迟进行建模。它还包括用于在网络边界上传播跟踪上下文的库（例如，使用HTTP标头）。

### 52.1.1跟踪

最重要的是，您需要一个`brave.Tracer`，配置为[向Zipkin报告](https://github.com/openzipkin/zipkin-reporter-java)。

以下示例设置通过HTTP（而非Kafka）将跟踪数据（spans）发送到Zipkin：

```
class MyClass {

    private final Tracer tracer;

    // Tracer will be autowired
    MyClass(Tracer tracer) {
        this.tracer = tracer;
    }

    void doSth() {
        Span span = tracer.newTrace().name("encode").start();
        // ...
    }
}
```

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 如果您的跨度包含的名称长于50个字符，则该名称将被截断为50个字符。您的名字必须明确明确。知名人士会导致延迟问题，有时甚至会引发异常。 |      |

跟踪器创建并加入spans，以对潜在分布式工作的延迟进行建模。它可以采用采样来减少处理过程中的开销，减少发送到Zipkin的数据量，或同时减少两者。

跟踪程序返回的跨度在完成时将数据报告到Zipkin，如果未采样则不执行任何操作。开始跨度后，您可以注释感兴趣的事件或添加包含详细信息或查找键的标签。

跨度具有包含跟踪标识符的上下文，该标识符将跨度放置在代表分布式操作的树中的正确位置。

### 52.1.2本地跟踪

跟踪永远不会离开进程的代码时，请在范围范围内运行它。

```
@Autowired Tracer tracer;

// Start a new trace or a span within an existing trace representing an operation
ScopedSpan span = tracer.startScopedSpan("encode");
try {
  // The span is in "scope" meaning downstream code such as loggers can see trace IDs
  return encoder.encode();
} catch (RuntimeException | Error e) {
  span.error(e); // Unless you handle exceptions, you might not know the operation failed!
  throw e;
} finally {
  span.finish(); // always finish the span
}
```

当您需要更多功能或更好的控制时，请使用`Span`类型：

```
@Autowired Tracer tracer;

// Start a new trace or a span within an existing trace representing an operation
Span span = tracer.nextSpan().name("encode").start();
// Put the span in "scope" so that downstream code such as loggers can see trace IDs
try (SpanInScope ws = tracer.withSpanInScope(span)) {
  return encoder.encode();
} catch (RuntimeException | Error e) {
  span.error(e); // Unless you handle exceptions, you might not know the operation failed!
  throw e;
} finally {
  span.finish(); // note the scope is independent of the span. Always finish a span.
}
```

上面的两个示例都报告了完全相同的跨度！

在上面的示例中，范围将是新的根范围或现有跟踪中的下一个子级。

### 52.1.3自定义跨度

一旦具有跨度，就可以向其添加标签。标签可以用作查找关键字或详细信息。例如，您可以在运行时版本中添加标签，如以下示例所示：

```
span.tag("clnt/finagle.version", "6.36.0");
```

向第三方公开自定义spans的功能时，最好使用`brave.SpanCustomizer`而不是`brave.Span`。前者更易于理解和测试，不会用跨度生命周期挂钩吸引用户。

```
interface MyTraceCallback {
  void request(Request request, SpanCustomizer customizer);
}
```

由于`brave.Span`实现了`brave.SpanCustomizer`，因此可以将其传递给用户，如以下示例所示：

```
for (MyTraceCallback callback : userCallbacks) {
  callback.request(request, span);
}
```

### 52.1.4隐式查找电流Span

有时，您不知道跟踪是否正在进行，并且您不希望用户执行空检查。`brave.CurrentSpanCustomizer`通过将数据添加到正在进行或删除的任何跨度中来解决此问题，如以下示例所示：

例如

```
// The user code can then inject this without a chance of it being null.
@Autowired SpanCustomizer span;

void userCode() {
  span.annotate("tx.started");
  ...
}
```

### 52.1.5 RPC跟踪

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 在滚动自己的RPC工具之前，请检查[此处编写](https://github.com/openzipkin/brave/tree/master/instrumentation)的[工具](https://github.com/openzipkin/brave/tree/master/instrumentation)和[Zipkin的列表](https://zipkin.io/pages/existing_instrumentations.html)。 |

RPC跟踪通常由拦截器自动完成。它们在幕后添加了与其在RPC操作中的角色相关的标签和事件。

以下示例显示如何添加客户端范围：

```
@Autowired Tracing tracing;
@Autowired Tracer tracer;

// before you send a request, add metadata that describes the operation
span = tracer.nextSpan().name(service + "/" + method).kind(CLIENT);
span.tag("myrpc.version", "1.0.0");
span.remoteServiceName("backend");
span.remoteIpAndPort("172.3.4.1", 8108);

// Add the trace context to the request, so it can be propagated in-band
tracing.propagation().injector(Request::addHeader)
                     .inject(span.context(), request);

// when the request is scheduled, start the span
span.start();

// if there is an error, tag the span
span.tag("error", error.getCode());
// or if there is an exception
span.error(exception);

// when the response is complete, finish the span
span.finish();
```

#### 单向跟踪

有时，您需要对有请求但无响应的异步操作进行建模。在常规的RPC跟踪中，您使用`span.finish()`表示已收到响应。在单向跟踪中，由于不希望响应，因此改用`span.flush()`。

下面的示例显示客户端如何建模单向操作：

```
@Autowired Tracing tracing;
@Autowired Tracer tracer;

// start a new span representing a client request
oneWaySend = tracer.nextSpan().name(service + "/" + method).kind(CLIENT);

// Add the trace context to the request, so it can be propagated in-band
tracing.propagation().injector(Request::addHeader)
                     .inject(oneWaySend.context(), request);

// fire off the request asynchronously, totally dropping any response
request.execute();

// start the client side and flush instead of finish
oneWaySend.start().flush();
```

下面的示例显示服务器如何处理单向操作：

```
@Autowired Tracing tracing;
@Autowired Tracer tracer;

// pull the context out of the incoming request
extractor = tracing.propagation().extractor(Request::getHeader);

// convert that context to a span which you can name and add tags to
oneWayReceive = nextSpan(tracer, extractor.extract(request))
    .name("process-request")
    .kind(SERVER)
    ... add tags etc.

// start the server side and flush instead of finish
oneWayReceive.start().flush();

// you should not modify this span anymore as it is complete. However,
// you can create children to represent follow-up work.
next = tracer.newSpan(oneWayReceive.context()).name("step2").start();
```

## 53.抽样

可以采用采样来减少收集和报告的过程外数据。如果未对跨度进行采样，则不会增加开销（无操作）。

采样是一项前期决策，这意味着报告数据的决策是在跟踪的第一个操作中做出的，并且该决策会向下游传播。

默认情况下，全局采样器将单个速率应用于所有跟踪的操作。`Tracer.Builder.sampler`控制此设置，默认为跟踪每个请求。

## 53.1声明式采样

一些应用程序需要根据java方法的类型或注释进行采样。

大多数用户使用框架拦截器来自动化这种策略。以下示例显示了它可能在内部如何工作：

```
@Autowired Tracer tracer;

// derives a sample rate from an annotation on a java method
DeclarativeSampler<Traced> sampler = DeclarativeSampler.create(Traced::sampleRate);

@Around("@annotation(traced)")
public Object traceThing(ProceedingJoinPoint pjp, Traced traced) throws Throwable {
  // When there is no trace in progress, this decides using an annotation
  Sampler decideUsingAnnotation = declarativeSampler.toSampler(traced);
  Tracer tracer = tracer.withSampler(decideUsingAnnotation);

  // This code looks the same as if there was no declarative override
  ScopedSpan span = tracer.startScopedSpan(spanName(pjp));
  try {
    return pjp.proceed();
  } catch (RuntimeException | Error e) {
    span.error(e);
    throw e;
  } finally {
    span.finish();
  }
}
```

## 53.2自定义采样

根据操作的不同，您可能需要应用不同的策略。例如，您可能不想跟踪对静态资源（例如图像）的请求，或者您想跟踪所有对新API的请求。

大多数用户使用框架拦截器来自动化这种策略。以下示例显示了它可能在内部如何工作：

```
@Autowired Tracer tracer;
@Autowired Sampler fallback;

Span nextSpan(final Request input) {
  Sampler requestBased = Sampler() {
    @Override public boolean isSampled(long traceId) {
      if (input.url().startsWith("/experimental")) {
        return true;
      } else if (input.url().startsWith("/static")) {
        return false;
      }
      return fallback.isSampled(traceId);
    }
  };
  return tracer.withSampler(requestBased).nextSpan();
}
```

## 53.3 Spring Cloud Sleuth中的采样

默认情况下，Spring Cloud Sleuth将所有spans设置为不可导出。这意味着跟踪将显示在日志中，而不显示在任何远程存储中。测试默认值通常就足够了，如果仅使用日志（例如，使用ELK聚合器），则可能只需要它即可。如果将跨度数据导出到Zipkin，则还有一个`Sampler.ALWAYS_SAMPLE`设置可以导出所有内容，还有一个`ProbabilityBasedSampler`设置可以对spans的固定分数进行采样。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 如果使用`spring-cloud-sleuth-zipkin`，则默认为`ProbabilityBasedSampler`。您可以通过设置`spring.sleuth.sampler.probability`来配置导出。传递的值必须是`0.0`到`1.0`的两倍。 |

可以通过创建bean定义来安装采样器，如以下示例所示：

```
@Bean
public Sampler defaultSampler() {
	return Sampler.ALWAYS_SAMPLE;
}
```

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 您可以将HTTP标头`X-B3-Flags`设置为`1`，或者在进行消息传递时，可以将`spanFlags`标头设置为`1`。这样做将强制电流跨度可导出，而不管采样决定如何。 |

为了使用速率受限的采样器，请设置`spring.sleuth.sampler.rate`属性，以选择每秒钟间隔要接受的跟踪量。最小数量为0，最大数量为2,147,483,647（最大整数）。

## 54.传播

需要进行传播以确保源自同一根的活动被收集到同一条迹线中。最常见的传播方法是通过将RPC请求发送到接收它的服务器来从客户端复制跟踪上下文。

例如，进行下游HTTP调用时，其跟踪上下文被编码为请求标头，并与之一起发送，如下图所示：

```
   Client Span                                                Server Span
┌──────────────────┐                                       ┌──────────────────┐
│                  │                                       │                  │
│   TraceContext   │           Http Request Headers        │   TraceContext   │
│ ┌──────────────┐ │          ┌───────────────────┐        │ ┌──────────────┐ │
│ │ TraceId      │ │          │ X─B3─TraceId      │        │ │ TraceId      │ │
│ │              │ │          │                   │        │ │              │ │
│ │ ParentSpanId │ │ Extract  │ X─B3─ParentSpanId │ Inject │ │ ParentSpanId │ │
│ │              ├─┼─────────>│                   ├────────┼>│              │ │
│ │ SpanId       │ │          │ X─B3─SpanId       │        │ │ SpanId       │ │
│ │              │ │          │                   │        │ │              │ │
│ │ Sampled      │ │          │ X─B3─Sampled      │        │ │ Sampled      │ │
│ └──────────────┘ │          └───────────────────┘        │ └──────────────┘ │
│                  │                                       │                  │
└──────────────────┘                                       └──────────────────┘
```

上面的名称来自[B3 Propagation](https://github.com/openzipkin/b3-propagation)，它内置于Brave，并具有许多语言和框架的实现。

大多数用户使用框架拦截器来自动化传播。接下来的两个示例显示了这对于客户端和服务器的工作方式。

以下示例显示了客户端传播如何工作：

```
@Autowired Tracing tracing;

// configure a function that injects a trace context into a request
injector = tracing.propagation().injector(Request.Builder::addHeader);

// before a request is sent, add the current span's context to it
injector.inject(span.context(), request);
```

以下示例显示了服务器端传播的工作方式：

```
@Autowired Tracing tracing;
@Autowired Tracer tracer;

// configure a function that extracts the trace context from a request
extractor = tracing.propagation().extractor(Request::getHeader);

// when a server receives a request, it joins or starts a new trace
span = tracer.nextSpan(extractor.extract(request));
```

## 54.1传播额外的字段

有时您需要传播额外的字段，例如请求ID或备用跟踪上下文。例如，如果您处于Cloud Foundry环境中，则可能要传递请求ID，如以下示例所示：

```
// when you initialize the builder, define the extra field you want to propagate
Tracing.newBuilder().propagationFactory(
  ExtraFieldPropagation.newFactory(B3Propagation.FACTORY, "x-vcap-request-id")
);

// later, you can tag that request ID or use it in log correlation
requestId = ExtraFieldPropagation.get("x-vcap-request-id");
```

您可能还需要传播未使用的跟踪上下文。例如，您可能处于Amazon Web服务环境中，但没有向X-Ray报告数据。为了确保X射线可以正确共存，请传递其跟踪标头，如以下示例所示：

```
tracingBuilder.propagationFactory(
  ExtraFieldPropagation.newFactory(B3Propagation.FACTORY, "x-amzn-trace-id")
);
```

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 在Spring Cloud Sleuth中，跟踪构建器`Tracing.newBuilder()`的所有元素都定义为beans。因此，如果您要传递自定义`PropagationFactory`，则足以创建该类型的bean，我们将在`Tracing` bean中进行设置。 |

### 54.1.1前缀字段

如果它们遵循通用模式，则还可以在字段前面加上前缀。以下示例显示了如何按原样传播`x-vcap-request-id`字段，但如何分别以`x-baggage-country-code`和`x-baggage-user-id`的形式发送`country-code`和`user-id`字段：

```
Tracing.newBuilder().propagationFactory(
  ExtraFieldPropagation.newFactoryBuilder(B3Propagation.FACTORY)
                       .addField("x-vcap-request-id")
                       .addPrefixedFields("x-baggage-", Arrays.asList("country-code", "user-id"))
                       .build()
);
```

以后，您可以调用以下代码来影响当前跟踪上下文的国家/地区代码：

```
ExtraFieldPropagation.set("x-country-code", "FO");
String countryCode = ExtraFieldPropagation.get("x-country-code");
```

或者，如果您有对跟踪上下文的引用，则可以显式使用它，如以下示例所示：

```
ExtraFieldPropagation.set(span.context(), "x-country-code", "FO");
String countryCode = ExtraFieldPropagation.get(span.context(), "x-country-code");
```

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 与以前版本的Sleuth的不同之处在于，使用Brave，您必须传递行李钥匙列表。有两个属性可以实现此目的。使用`spring.sleuth.baggage-keys`，您可以为HTTP呼叫设置前缀为`baggage-`的密钥，而为消息传递则设置前缀`baggage_`的密钥。您还可以使用`spring.sleuth.propagation-keys`属性来传递已列入白名单且没有任何前缀的前缀键列表。注意，标题键前面没有`x-`。 |      |

为了自动将行李值设置为Slf4j的MDC，您必须使用白名单中的行李和传播键列表来设置`spring.sleuth.log.slf4j.whitelisted-mdc-keys`属性。例如，`spring.sleuth.log.slf4j.whitelisted-mdc-keys=foo`会将`foo`行李的价值设置为MDC。

| ![[重要]](/assets/images/springcloud/important.png)                         | 重要 |
| ----------------------------------------------------- | ---- |
| 请记住，将条目添加到MDC可能会大大降低应用程序的性能！ |      |

如果要将行李条目添加为标签，以使可以通过行李条目搜索spans，则可以将白名单中的行李钥匙列表设置为`spring.sleuth.propagation.tag.whitelisted-keys`。要禁用此功能，您必须传递`spring.sleuth.propagation.tag.enabled=false`属性。

### 54.1.2提取传播的上下文

`TraceContext.Extractor<C>`从传入的请求或消息中读取跟踪标识符和采样状态。载体通常是一个请求对象或标头。

此实用程序用于标准工具（例如`HttpServerHandler`），但也可以用于自定义RPC或消息传递代码。

`TraceContextOrSamplingFlags`通常仅与`Tracer.nextSpan(extracted)`一起使用，除非您要在客户端和服务器之间共享范围ID。

### 54.1.3在客户端和服务器之间共享范围ID

正常的检测模式是创建一个跨度，该跨度代表RPC的服务器端。`Extractor.extract`在应用于传入的客户端请求时可能返回完整的跟踪上下文。`Tracer.joinSpan`尝试使用相同的跨度ID（如果支持）或不创建子跨度来继续此跟踪。当跨度ID被共享时，报告的数据包括这样的标志。

下图显示了B3传播的示例：

```
                              ┌───────────────────┐      ┌───────────────────┐
 Incoming Headers             │   TraceContext    │      │   TraceContext    │
┌───────────────────┐(extract)│ ┌───────────────┐ │(join)│ ┌───────────────┐ │
│ X─B3-TraceId      │─────────┼─┼> TraceId      │ │──────┼─┼> TraceId      │ │
│                   │         │ │               │ │      │ │               │ │
│ X─B3-ParentSpanId │─────────┼─┼> ParentSpanId │ │──────┼─┼> ParentSpanId │ │
│                   │         │ │               │ │      │ │               │ │
│ X─B3-SpanId       │─────────┼─┼> SpanId       │ │──────┼─┼> SpanId       │ │
└───────────────────┘         │ │               │ │      │ │               │ │
                              │ │               │ │      │ │  Shared: true │ │
                              │ └───────────────┘ │      │ └───────────────┘ │
                              └───────────────────┘      └───────────────────┘
```

某些传播系统仅转发在`Propagation.Factory.supportsJoin() == false`时检测到的父范围ID。在这种情况下，始终会提供一个新的跨度ID，而传入的上下文将确定父ID。

下图显示了AWS传播的示例：

```
                              ┌───────────────────┐      ┌───────────────────┐
 x-amzn-trace-id              │   TraceContext    │      │   TraceContext    │
┌───────────────────┐(extract)│ ┌───────────────┐ │(join)│ ┌───────────────┐ │
│ Root              │─────────┼─┼> TraceId      │ │──────┼─┼> TraceId      │ │
│                   │         │ │               │ │      │ │               │ │
│ Parent            │─────────┼─┼> SpanId       │ │──────┼─┼> ParentSpanId │ │
└───────────────────┘         │ └───────────────┘ │      │ │               │ │
                              └───────────────────┘      │ │  SpanId: New  │ │
                                                         │ └───────────────┘ │
                                                         └───────────────────┘
```

注意：某些跨度报告程序不支持共享跨度ID。例如，如果设置了`Tracing.Builder.spanReporter(amazonXrayOrGoogleStackdrive)`，则应通过设置`Tracing.Builder.supportsJoin(false)`来禁用加入。这样做会在`Tracer.joinSpan()`上强制一个新的子跨度。

### 54.1.4实施传播

`TraceContext.Extractor<C>`由`Propagation.Factory`插件实现。在内部，此代码使用以下之一创建联合类型`TraceContextOrSamplingFlags`：* `TraceContext`（如果存在跟踪ID和跨度ID）。* `TraceIdContext`，如果存在跟踪ID但不存在跨度ID。* `SamplingFlags`，如果不存在标识符。

某些`Propagation`实现从提取（例如，读取传入的标头）到注入（例如，写入输出的标头）的角度携带额外的数据。例如，它可能带有请求ID。当实现中有额外数据时，它们将按以下方式处理：*如果提取了`TraceContext`，则将额外数据添加为`TraceContext.extra()`。*否则，将其添加为`Tracer.nextSpan`处理的`TraceContextOrSamplingFlags.extra()`。

## 55.当前跟踪组件

Brave支持“ 当前跟踪组件 ”概念，仅在您无其他方法获得参考时才应使用。这样做是针对JDBC连接的，因为它们通常在跟踪组件之前进行初始化。

可通过`Tracing.current()`获得实例化的最新跟踪组件。您也可以使用`Tracing.currentTracer()`仅获取跟踪器。如果您使用这些方法之一，请不要缓存结果。而是在每次需要它们时查找它们。

## 56.当前Span

Brave支持代表飞行中操作的“ 当前跨度 ”概念。您可以使用`Tracer.currentSpan()`将自定义标签添加到跨度，并使用`Tracer.nextSpan()`创建正在运行的子项。

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 在Sleuth中，您可以通过`tracer.currentSpan()`方法自动连接`Tracer` bean以检索当前跨度。要检索当前上下文，只需调用`tracer.currentSpan().context()`。要以字符串形式获取当前跟踪ID，可以使用`traceIdString()`方法，例如：`tracer.currentSpan().context().traceIdString()`。 |      |

## 56.1手动设置范围

编写新工具时，将您创建的跨度作为当前跨度放置在示波器中很重要。这样做不仅使用户可以使用`Tracer.currentSpan()`访问它，而且还允许自定义文件（例如SLF4J MDC）查看当前的跟踪ID。

`Tracer.withSpanInScope(Span)`促进了这一点，并且通过使用try-with-resources惯用法最方便地使用。每当可能调用外部代码（例如进行拦截器或其他操作）时，请将范围放在范围内，如以下示例所示：

```
@Autowired Tracer tracer;

try (SpanInScope ws = tracer.withSpanInScope(span)) {
  return inboundRequest.invoke();
} finally { // note the scope is independent of the span
  span.finish();
}
```

在极端情况下，您可能需要临时清除当前跨度（例如，启动不应与当前请求关联的任务）。为此，请将null传递给`withSpanInScope`，如以下示例所示：

```
@Autowired Tracer tracer;

try (SpanInScope cleared = tracer.withSpanInScope(null)) {
  startBackgroundThread();
}
```

## 57.仪器仪表

Spring Cloud Sleuth将自动检测所有Spring应用程序，因此您无需执行任何操作即可激活它。通过根据可用的堆栈使用多种技术来添加检测。例如，对于servlet web应用程序，我们使用`Filter`，对于Spring Integration，我们使用`ChannelInterceptors`。

您可以自定义跨度标签中使用的键。为了限制范围数据的数量，默认情况下，HTTP请求仅使用少量元数据（例如状态码，主机和URL）进行标记。您可以通过配置`spring.sleuth.keys.http.headers`（标题名称列表）来添加请求标题。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 仅当有`Sampler`允许标签时，才会收集和导出标签。默认情况下，没有这样的`Sampler`，以确保不存在不进行任何配置而意外收集太多数据的危险）。 |

## 58. Span生命周期

您可以通过`brave.Tracer`在Span上执行以下操作：

- [start](https://www.springcloud.cc/spring-cloud-greenwich.html#creating-and-finishing-spans)：开始跨度时，将分配其名称并记录开始时间戳。
- [close](https://www.springcloud.cc/spring-cloud-greenwich.html#creating-and-finishing-spans)：跨度完成（记录跨度的结束时间），并且，如果对跨度进行了采样，则有资格进行收集（例如，到Zipkin）。
- [继续](https://www.springcloud.cc/spring-cloud-greenwich.html#continuing-spans)：创建一个新的span实例。它是继续的副本。
- [detach](https://www.springcloud.cc/spring-cloud-greenwich.html#continuing-spans)：跨度不会停止或关闭。它只会从当前线程中删除。
- [使用显式父级创建](https://www.springcloud.cc/spring-cloud-greenwich.html#creating-spans-with-explicit-parent)：您可以创建一个新的跨度并为其设置一个显式父级。

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| Spring Cloud Sleuth为您创建`Tracer`的实例。为了使用它，您可以对其进行自动接线。 |

## 58.1创建并完成spans

您可以使用`Tracer`手动创建spans，如以下示例所示：

```
// Start a span. If there was a span present in this thread it will become
// the `newSpan`'s parent.
Span newSpan = this.tracer.nextSpan().name("calculateTax");
try (Tracer.SpanInScope ws = this.tracer.withSpanInScope(newSpan.start())) {
	// ...
	// You can tag a span
	newSpan.tag("taxValue", taxValue);
	// ...
	// You can log an event on a span
	newSpan.annotate("taxCalculated");
}
finally {
	// Once done remember to finish the span. This will allow collecting
	// the span to send it to Zipkin
	newSpan.finish();
}
```

在前面的示例中，我们可以看到如何创建跨度的新实例。如果此线程中已经有一个跨度，它将成为新跨度的父级。

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 创建跨度后，请始终保持清洁。另外，请务必完成要发送到Zipkin的所有跨度。 |      |

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 如果您的跨度包含的名称大于50个字符，则该名称将被截断为50个字符。您的名字必须明确明确。知名人士会导致延迟问题，有时甚至会引发例外情况。 |      |

## 58.2连续跨度

有时，您不想创建一个新跨度，但想继续一个跨度。这种情况的示例如下：

- **AOP**：如果在到达方面之前已经创建了一个跨度，则您可能不想创建一个新的跨度。
- **Hystrix**：执行Hystrix命令很可能是当前处理的逻辑部分。实际上，它仅仅是技术实现细节，您不一定要在跟踪中将其反映为一个单独的实体。

要继续跨度，可以使用`brave.Tracer`，如以下示例所示：

```
// let's assume that we're in a thread Y and we've received
// the `initialSpan` from thread X
Span continuedSpan = this.tracer.toSpan(newSpan.context());
try {
	// ...
	// You can tag a span
	continuedSpan.tag("taxValue", taxValue);
	// ...
	// You can log an event on a span
	continuedSpan.annotate("taxCalculated");
}
finally {
	// Once done remember to flush the span. That means that
	// it will get reported but the span itself is not yet finished
	continuedSpan.flush();
}
```

## 58.3使用显式父级创建Span

您可能要开始一个新的跨度并提供该跨度的显式父项。假定范围的父级在一个线程中，而您想在另一个线程中开始一个新的范围。在Brave中，每当您调用`nextSpan()`时，它都会参照当前范围的跨度创建一个跨度。您可以将范围放入范围中，然后调用`nextSpan()`，如以下示例所示：

```
// let's assume that we're in a thread Y and we've received
// the `initialSpan` from thread X. `initialSpan` will be the parent
// of the `newSpan`
Span newSpan = null;
try (Tracer.SpanInScope ws = this.tracer.withSpanInScope(initialSpan)) {
	newSpan = this.tracer.nextSpan().name("calculateCommission");
	// ...
	// You can tag a span
	newSpan.tag("commissionValue", commissionValue);
	// ...
	// You can log an event on a span
	newSpan.annotate("commissionCalculated");
}
finally {
	// Once done remember to finish the span. This will allow collecting
	// the span to send it to Zipkin. The tags and events set on the
	// newSpan will not be present on the parent
	if (newSpan != null) {
		newSpan.finish();
	}
}
```

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 创建这样的跨度后，必须完成它。否则，不会报告该错误（例如，报告到Zipkin）。 |      |

## 59.命名spans

选择一个跨度名称不是一件容易的事。跨度名称应描述一个操作名称。该名称应为低基数，因此不应包含标识符。

由于正在进行很多检测，因此一些跨度名称是人为的：

- 当控制器名称为`controllerMethodName`的控制器接收到`controller-method-name`时
- `async`用于使用包装的`Callable`和`Runnable`接口完成的异步操作。
- 用`@Scheduled`注释的方法返回类的简单名称。

幸运的是，对于异步处理，您可以提供显式命名。

## 59.1 `@SpanName`注释

您可以使用`@SpanName`注释来明确命名跨度，如以下示例所示：

```
	@SpanName("calculateTax")
	class TaxCountingRunnable implements Runnable {

		@Override
		public void run() {
			// perform logic
		}

	}

}
```

在这种情况下，按以下方式处理时，跨度名为`calculateTax`：

```
Runnable runnable = new TraceRunnable(this.tracing, spanNamer,
		new TaxCountingRunnable());
Future<?> future = executorService.submit(runnable);
// ... some additional logic ...
future.get();
```

## 59.2 `toString()`方法

很少为`Runnable`或`Callable`创建类。通常，创建一个匿名类的实例。您不能注释此类。为了克服该限制，如果不存在`@SpanName`批注，我们将检查该类是否具有`toString()`方法的自定义实现。

运行这样的代码将导致创建一个名为`calculateTax`的跨度，如以下示例所示：

```
Runnable runnable = new TraceRunnable(this.tracing, spanNamer, new Runnable() {
	@Override
	public void run() {
		// perform logic
	}

	@Override
	public String toString() {
		return "calculateTax";
	}
});
Future<?> future = executorService.submit(runnable);
// ... some additional logic ...
future.get();
```

## 60.使用Annotations管理跨度

您可以使用各种注释来管理spans。

## 60.1基础

使用注释管理spans的原因很多，其中包括：

- 与API无关的方法可以与跨度进行协作。使用注释使用户可以添加到跨度，而跨度api不依赖库。这样，Sleuth可以更改其核心API，以减少对用户代码的影响。
- 减少了基本跨距操作的表面积。如果没有此功能，则必须使用span api，该api的生命周期命令可能无法正确使用。通过仅公开作用域，标记和日志功能，您可以进行协作而不会意外中断跨度生命周期。
- 与运行时生成的代码协作。使用诸如Spring Data和Feign之类的库，可以在运行时生成接口的实现。因此，对象的跨度包裹是乏味的。现在，您可以在接口和这些接口的参数上提供注释。

## 60.2创建新的跨度

如果您不想手动创建本地spans，则可以使用`@NewSpan`批注。另外，我们提供了`@SpanTag`批注以自动方式添加标签。

现在我们可以考虑一些用法示例。

```
@NewSpan
void testMethod();
```

在不带任何参数的情况下对方法进行注释会导致创建一个新的跨度，其名称等于带注释的方法名称。

```
@NewSpan("customNameOnTestMethod4")
void testMethod4();
```

如果您在批注中提供值（直接或通过设置`name`参数），则创建的跨度将提供的值作为名称。

```
// method declaration
@NewSpan(name = "customNameOnTestMethod5")
void testMethod5(@SpanTag("testTag") String param);

// and method execution
this.testBean.testMethod5("test");
```

您可以将名称和标签结合在一起。让我们专注于后者。在这种情况下，带注释的方法的参数运行时值的值将成为标记的值。在我们的示例中，标记键为`testTag`，标记值为`test`。

```
@NewSpan(name = "customNameOnTestMethod3")
@Override
public void testMethod3() {
}
```

您可以在类和接口上都放置`@NewSpan`批注。如果您重写接口的方法并为`@NewSpan`批注提供一个不同的值，则最具体的将获胜（在这种情况下，将设置`customNameOnTestMethod3`）。

## 60.3连续跨度

如果要将标记和注释添加到现有范围，则可以使用`@ContinueSpan`注释，如以下示例所示：

```
// method declaration
@ContinueSpan(log = "testMethod11")
void testMethod11(@SpanTag("testTag11") String param);

// method execution
this.testBean.testMethod11("test");
this.testBean.testMethod13();
```

（请注意，与`@NewSpan`注释相反，您还可以使用`log`参数添加日志。）

这样，跨度将继续，并且：

- 创建名为`testMethod11.before`和`testMethod11.after`的日志条目。
- 如果引发异常，还将创建名为`testMethod11.afterFailure`的日志条目。
- 将创建一个标签，标签为`testTag11`，值为`test`。

## 60.4高级标签设置

有3种不同的方法可以将标签添加到跨度。它们全部由`SpanTag`注释控制。优先级如下：

1. 尝试使用`TagValueResolver`类型的bean和提供的名称。
2. 如果未提供bean名称，请尝试计算一个表达式。我们搜索`TagValueExpressionResolver` bean。默认实现使用SPEL表达式解析。 **重要事项**您只能从SPEL表达式中引用属性。由于安全限制，不允许执行方法。
3. 如果找不到任何要求值的表达式，请返回参数的`toString()`值。

### 60.4.1定制提取器

用于以下方法的标记的值是通过`TagValueResolver`接口的实现来计算的。必须将其类名作为`resolver`属性的值传递。

考虑以下带注释的方法：

```
@NewSpan
public void getAnnotationForTagValueResolver(
		@SpanTag(key = "test", resolver = TagValueResolver.class) String test) {
}
```

现在进一步考虑以下`TagValueResolver` bean的实现：

```
@Bean(name = "myCustomTagValueResolver")
public TagValueResolver tagValueResolver() {
	return parameter -> "Value from myCustomTagValueResolver";
}
```

前面的两个示例导致将标签值设置为等于`Value from myCustomTagValueResolver`。

### 60.4.2解析一个值的表达式

考虑以下带注释的方法：

```
@NewSpan
public void getAnnotationForTagValueExpression(
		@SpanTag(key = "test", expression = "'hello' + ' characters'") String test) {
}
```

`TagValueExpressionResolver`的自定义实现不会导致SPEL表达式的求值，并且在跨度上设置了值为`4 characters`的标签。如果要使用其他表达式解析机制，则可以创建自己的bean实现。

### 60.4.3使用`toString()`方法

考虑以下带注释的方法：

```
@NewSpan
public void getAnnotationForArgumentToString(@SpanTag("test") Long param) {
}
```

以值`15`运行前面的方法会导致将标签的字符串值设置为`"15"`。

## 61.定制

## 61.1定制器

使用Brave 5.7，您可以使用多种选项为项目提供定制程序。勇敢与

- `TracingCustomizer`-允许配置插件协作构建`Tracing`的实例。
- `CurrentTraceContextCustomizer`-允许配置插件协作构建`CurrentTraceContext`的实例。
- `ExtraFieldCustomizer`-允许配置插件协作构建`ExtraFieldPropagation.Factory`的实例。

Sleuth将搜索这些类型的beans，并自动应用自定义。

## 61.2 HTTP

如果需要定制与HTTP相关的spans的客户端/服务器解析，只需注册类型为`brave.http.HttpClientParser`或`brave.http.HttpServerParser`的bean。如果需要客户端/服务器采样，只需注册类型为`brave.sampler.SamplerFunction<HttpRequest>`的bean，并将bean `sleuthHttpClientSampler`命名为客户端采样器，将`sleuthHttpServerSampler`命名为服务器采样器。

为了方便起见，可以使用`@HttpClientSampler`和`@HttpServerSampler`批注注入适当的beans或通过其静态字符串`NAME`字段引用bean名称。

查看Brave的代码，以查看有关如何制作基于路径的采样器的示例 https://github.com/openzipkin/brave/tree/master/instrumentation/http#sampling-policy

如果您想完全重写`HttpTracing` bean，则可以使用`SkipPatternProvider`接口检索spans不应采样的URL `Pattern`。在下面，您可以看到在服务器端`Sampler<HttpRequest>`中使用`SkipPatternProvider`的示例。

```
@Configuration
class Config {
  @Bean(name = HttpServerSampler.NAME)
  SamplerFunction<HttpRequest> myHttpSampler(SkipPatternProvider provider) {
  	Pattern pattern = provider.skipPattern();
  	return request -> {
  		String url = request.path();
  		boolean shouldSkip = pattern.matcher(url).matches();
  		if (shouldSkip) {
  			return false;
  		}
  		return null;
  	};
  }
}
```

## 61.3 `TracingFilter`

您还可以修改`TracingFilter`的行为，该行为负责处理输入的HTTP请求并基于HTTP响应添加标签。您可以通过注册自己的`TracingFilter` bean实例来自定义标签或修改响应头。

在下面的示例中，我们注册`TracingFilter` bean，添加包含当前Span的跟踪ID的`ZIPKIN-TRACE-ID`响应标头，并添加带有键`custom`和一个值的标签`tag`到跨度。

```
@Component
@Order(TraceWebServletAutoConfiguration.TRACING_FILTER_ORDER + 1)
class MyFilter extends GenericFilterBean {

	private final Tracer tracer;

	MyFilter(Tracer tracer) {
		this.tracer = tracer;
	}

	@Override
	public void doFilter(ServletRequest request, ServletResponse response,
			FilterChain chain) throws IOException, ServletException {
		Span currentSpan = this.tracer.currentSpan();
		if (currentSpan == null) {
			chain.doFilter(request, response);
			return;
		}
		// for readability we're returning trace id in a hex form
		((HttpServletResponse) response).addHeader("ZIPKIN-TRACE-ID",
				currentSpan.context().traceIdString());
		// we can also add some custom tags
		currentSpan.tag("custom", "tag");
		chain.doFilter(request, response);
	}

}
```

## 61.4 RPC

Sleuth会自动配置`RpcTracing` bean，它是RPC工具（例如gRPC或Dubbo）的基础。

如果需要自定义RPC跟踪的客户端/服务器采样，只需注册类型为`brave.sampler.SamplerFunction<RpcRequest>`的bean，并将bean `sleuthRpcClientSampler`命名为客户端采样器，将`sleuthRpcServerSampler`命名为服务器采样器。

为了方便起见，可以使用`@RpcClientSampler`和`@RpcServerSampler`批注来注入正确的beans或通过其静态字符串`NAME`字段引用bean名称。

例如 这是一个每秒跟踪100个“ GetUserToken”服务器请求的采样器。这不会启动对运行状况检查服务的请求的新跟踪。其他请求将使用全局采样配置。

```
@Configuration
class Config {
  @Bean(name = RpcServerSampler.NAME)
  SamplerFunction<RpcRequest> myRpcSampler() {
  	Matcher<RpcRequest> userAuth = and(serviceEquals("users.UserService"),
  			methodEquals("GetUserToken"));
  	return RpcRuleSampler.newBuilder()
  			.putRule(serviceEquals("grpc.health.v1.Health"), Sampler.NEVER_SAMPLE)
  			.putRule(userAuth, RateLimitingSampler.create(100)).build();
  }
}
```

有关更多信息，请参见https://github.com/openzipkin/brave/tree/master/instrumentation/rpc#sampling-policy

## 61.5定制服务名称

默认情况下，Sleuth假定在将跨度发送到Zipkin时，您希望跨度的服务名称等于`spring.application.name`属性的值。但是，并非总是如此。在某些情况下，您想为来自应用程序的所有spans显式提供一个不同的服务名称。为此，可以将以下属性传递给应用程序以覆盖该值（该示例适用于名为`myService`的服务）：

```
spring.zipkin.service.name: myService
```

## 61.6报告跨度的定制

在报告spans（例如，向Zipkin发送）之前，您可能需要以某种方式修改该范围。您可以使用`FinishedSpanHandler`界面执行此操作。

在Sleuth中，我们生成具有固定名称的spans。一些用户希望根据标签的值来修改名称。您可以实现`FinishedSpanHandler`接口来更改该名称。

以下示例显示如何注册两个实现`FinishedSpanHandler`的beans：

```
@Bean
FinishedSpanHandler handlerOne() {
	return new FinishedSpanHandler() {
		@Override
		public boolean handle(TraceContext traceContext, MutableSpan span) {
			span.name("foo");
			return true; // keep this span
		}
	};
}

@Bean
FinishedSpanHandler handlerTwo() {
	return new FinishedSpanHandler() {
		@Override
		public boolean handle(TraceContext traceContext, MutableSpan span) {
			span.name(span.name() + " bar");
			return true; // keep this span
		}
	};
}
```

前面的示例导致报告的跨度的名称刚好在报告之前更改为`foo bar`（例如，更改为Zipkin）。

## 61.7主机定位器

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 本节是关于通过服务发现定义**主机**。这是**不是**要找到Zipkin通过服务发现。 |      |

要定义与特定跨度相对应的主机，我们需要解析主机名和端口。默认方法是从服务器属性中获取这些值。如果未设置，则尝试从网络接口检索主机名。

如果您启用了发现客户端，并且希望从服务注册表中的已注册实例中检索主机地址，则必须设置`spring.zipkin.locator.discovery.enabled`属性（该属性适用于基于HTTP和基于流的跨度报告），如下：

```
spring.zipkin.locator.discovery.enabled: true
```

## 62.将跨度发送到Zipkin

默认情况下，如果将`spring-cloud-starter-zipkin`作为依赖项添加到项目，则关闭跨度后，跨度将通过HTTP发送到Zipkin。通信是异步的。您可以通过设置`spring.zipkin.baseUrl`属性来配置URL，如下所示：

```
spring.zipkin.baseUrl: https://192.168.99.100:9411/
```

如果您想通过服务发现来找到Zipkin，则可以在URL内传递Zipkin的服务ID，如以下`zipkinserver`服务ID的示例所示：

```
spring.zipkin.baseUrl: http://zipkinserver/
```

要禁用此功能，只需将`spring.zipkin.discoveryClientEnabled`设置为`false。

启用发现客户端功能后，Sleuth使用`LoadBalancerClient`查找Zipkin服务器的URL。这意味着您可以设置负载平衡配置，例如通过Ribbon。

```
zipkinserver:
  ribbon:
    ListOfServers: host1,host2
```

如果在类路径上一起有web，rabbit或kafka，则可能需要选择将spans发送到zipkin的方式。为此，请将`web`，`rabbit`或`kafka`设置为`spring.zipkin.sender.type`属性。以下示例显示了为`web`设置发件人类型：

```
spring.zipkin.sender.type: web
```

要自定义通过HTTP发送spans到Zipkin的`RestTemplate`，可以注册`ZipkinRestTemplateCustomizer` bean。

```
@Configuration
class MyConfig {
	@Bean ZipkinRestTemplateCustomizer myCustomizer() {
		return new ZipkinRestTemplateCustomizer() {
			@Override
			void customize(RestTemplate restTemplate) {
				// customize the RestTemplate
			}
		};
	}
}
```

但是，如果您想控制创建`RestTemplate`对象的整个过程，则必须创建`zipkin2.reporter.Sender`类型的bean。

```
	@Bean Sender myRestTemplateSender(ZipkinProperties zipkin,
			ZipkinRestTemplateCustomizer zipkinRestTemplateCustomizer) {
		RestTemplate restTemplate = mySuperCustomRestTemplate();
		zipkinRestTemplateCustomizer.customize(restTemplate);
		return myCustomSender(zipkin, restTemplate);
	}
```

## 63. Zipkin流Span消费者

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 我们建议对基于消息的跨度发送使用Zipkin的本机支持。从Edgware版本开始，不推荐使用Zipkin Stream服务器。在Finchley版本中，将其删除。 |      |

如果出于某种原因需要创建不赞成使用的Stream Zipkin服务器，请参阅[Dalston文档](https://cloud.spring.io/spring-cloud-static/Dalston.SR4/multi/multi__span_data_as_messages.html#_zipkin_consumer)。

## 64.整合

## 64.1 OpenTracing

Spring Cloud Sleuth与[OpenTracing](https://opentracing.io/)兼容。如果您在类路径上具有OpenTracing，我们将自动注册OpenTracing `Tracer` bean。如果您要禁用此功能，请将`spring.sleuth.opentracing.enabled`设置为`false`

## 64.2可运行和可调用

如果将逻辑包装在`Runnable`或`Callable`中，则可以将这些类包装在其Sleuth代表中，如以下`Runnable`的示例所示：

```
Runnable runnable = new Runnable() {
	@Override
	public void run() {
		// do some work
	}

	@Override
	public String toString() {
		return "spanNameFromToStringMethod";
	}
};
// Manual `TraceRunnable` creation with explicit "calculateTax" Span name
Runnable traceRunnable = new TraceRunnable(this.tracing, spanNamer, runnable,
		"calculateTax");
// Wrapping `Runnable` with `Tracing`. That way the current span will be available
// in the thread of `Runnable`
Runnable traceRunnableFromTracer = this.tracing.currentTraceContext()
		.wrap(runnable);
```

以下示例显示了如何对`Callable`执行此操作：

```
Callable<String> callable = new Callable<String>() {
	@Override
	public String call() throws Exception {
		return someLogic();
	}

	@Override
	public String toString() {
		return "spanNameFromToStringMethod";
	}
};
// Manual `TraceCallable` creation with explicit "calculateTax" Span name
Callable<String> traceCallable = new TraceCallable<>(this.tracing, spanNamer,
		callable, "calculateTax");
// Wrapping `Callable` with `Tracing`. That way the current span will be available
// in the thread of `Callable`
Callable<String> traceCallableFromTracer = this.tracing.currentTraceContext()
		.wrap(callable);
```

这样，您可以确保为每个执行创建并关闭新的跨度。

## 64.3 Hystrix

### 64.3.1自定义并发策略

我们注册了一个[`HystrixConcurrencyStrategy`](https://github.com/Netflix/Hystrix/wiki/Plugins#concurrencystrategy)名为`TraceCallable` 的自定义，该自定义将所有`Callable`实例包装在其Sleuth代表中。根据调用Hystrix命令之前是否已经进行了跟踪，该策略将开始还是继续跨度。要禁用自定义Hystrix并发策略，请将`spring.sleuth.hystrix.strategy.enabled`设置为`false`。

### 64.3.2手动命令设置

假定您具有以下`HystrixCommand`：

```
HystrixCommand<String> hystrixCommand = new HystrixCommand<String>(setter) {
	@Override
	protected String run() throws Exception {
		return someLogic();
	}
};
```

要传递跟踪信息，必须在`HystrixCommand`的Sleuth版本中包装相同的逻辑，称为`TraceCommand`，如以下示例所示：

```
TraceCommand<String> traceCommand = new TraceCommand<String>(tracer, setter) {
	@Override
	public String doRun() throws Exception {
		return someLogic();
	}
};
```

## 64.4 RxJava

我们注册了一个自定义[`RxJavaSchedulersHook`](https://github.com/ReactiveX/RxJava/wiki/Plugins#rxjavaschedulershook)，该自定义将所有`Action0`实例包装在其Sleuth代表中，称为`TraceAction`。挂钩将开始或继续跨度，具体取决于在计划操作之前是否已经进行了跟踪。要禁用自定义`RxJavaSchedulersHook`，请将`spring.sleuth.rxjava.schedulers.hook.enabled`设置为`false`。

您可以为不想为其创建spans的线程名称定义一个正则表达式列表。为此，请在`spring.sleuth.rxjava.schedulers.ignoredthreads`属性中提供用逗号分隔的正则表达式列表。

| ![[重要]](/assets/images/springcloud/important.png)                       | 重要 |
| --------------------------------------------------- | ---- |
| 建议使用反应式编程和Sleuth的方法是使用Reactor支持。 |      |

## 64.5 HTTP集成

可以通过将`spring.sleuth.web.enabled`属性设置为等于`false`的值来禁用此部分中的功能。

### 64.5.1 HTTP筛选器

通过`TracingFilter`，所有采样的传入请求都将导致创建Span。Span的名称为`http:` +请求发送到的路径。例如，如果请求已发送到`/this/that`，则名称将为`http:/this/that`。您可以通过设置`spring.sleuth.web.skipPattern`属性来配置要跳过的URI。如果类路径上有`ManagementServerProperties`，则其值`contextPath`将附加到提供的跳过模式中。如果要重用Sleuth的默认跳过模式并仅添加自己的模式，请使用`spring.sleuth.web.additionalSkipPattern`传递这些模式。

默认情况下，所有spring boot执行器端点都会自动添加到跳过模式中。如果要禁用此行为，请将`spring.sleuth.web.ignore-auto-configured-skip-patterns`设置为`true`。

要更改跟踪过滤器注册的顺序，请设置`spring.sleuth.web.filter-order`属性。

要禁用记录未捕获异常的过滤器，可以禁用`spring.sleuth.web.exception-throwing-filter-enabled`属性。

### 64.5.2 HandlerInterceptor

由于我们希望跨度名称精确，因此我们使用`TraceHandlerInterceptor`来包装现有的`HandlerInterceptor`或将其直接添加到现有的`HandlerInterceptors`的列表中。`TraceHandlerInterceptor`向给定的`HttpServletRequest`添加一个特殊的请求属性。如果`TracingFilter`没有看到此属性，它将创建一个“ fallback ”跨度，这是在服务器端创建的另一个跨度，以便在UI中正确显示跟踪。如果发生这种情况，可能是缺少仪器。在这种情况下，请在Spring Cloud Sleuth中提出问题。

### 64.5.3异步Servlet支持

如果您的控制器返回`Callable`或`WebAsyncTask`，则Spring Cloud Sleuth会继续使用现有跨度而不是创建新跨度。

### 64.5.4 WebFlux支持

通过`TraceWebFilter`，所有采样的传入请求都将导致创建Span。Span的名称为`http:` +请求发送到的路径。例如，如果请求已发送到`/this/that`，则名称为`http:/this/that`。您可以使用`spring.sleuth.web.skipPattern`属性来配置要跳过的URI。如果类路径上有`ManagementServerProperties`，则其值`contextPath`将附加到提供的跳过模式中。如果要重用Sleuth的默认跳过模式并追加自己的跳过模式，请使用`spring.sleuth.web.additionalSkipPattern`传递这些模式。

要更改跟踪过滤器注册的顺序，请设置`spring.sleuth.web.filter-order`属性。

### 64.5.5 Dubbo RPC支持

通过与Brave的集成，Spring Cloud Sleuth支持[Dubbo](https://dubbo.apache.org/)。添加`brave-instrumentation-dubbo`依赖项就足够了：

```
<dependency>
    <groupId>io.zipkin.brave</groupId>
    <artifactId>brave-instrumentation-dubbo</artifactId>
</dependency>
```

您还需要设置一个包含以下内容的`dubbo.properties`文件：

```
dubbo.provider.filter=tracing
dubbo.consumer.filter=tracing
```

您可以[在此处](https://github.com/openzipkin/brave/tree/master/instrumentation/dubbo-rpc)阅读有关Brave-Dubbo集成的更多信息。Spring Cloud Sleuth和Dubbo的示例可以在[此处](https://github.com/openzipkin/sleuth-webmvc-example/compare/add-dubbo-tracing)找到。

## 64.6 HTTP客户端集成

### 64.6.1同步休息模板

我们注入了`RestTemplate`拦截器，以确保所有跟踪信息都传递给请求。每次拨打电话时，都会创建一个新的Span。收到响应后关闭。要阻止同步`RestTemplate`功能，请将`spring.sleuth.web.client.enabled`设置为`false`。

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 您必须将`RestTemplate`注册为bean，以便注入拦截器。如果使用关键字`new`创建一个`RestTemplate`实例，则检测不起作用。 |      |

### 64.6.2异步休息模板

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 从Sleuth `2.0.0`开始，我们不再注册`AsyncRestTemplate`类型的bean。创建这样的bean取决于您。然后我们对其进行检测。 |      |

要阻止`AsyncRestTemplate`功能，请将`spring.sleuth.web.async.client.enabled`设置为`false`。要禁用默认`TraceAsyncClientHttpRequestFactoryWrapper`的创建，请将`spring.sleuth.web.async.client.factory.enabled`设置为`false`。如果根本不想创建`AsyncRestClient`，请将`spring.sleuth.web.async.client.template.enabled`设置为`false`。

#### 多个异步休息模板

有时您需要使用异步实现模板的多个实现。在以下代码段中，您可以看到一个如何设置这样的自定义`AsyncRestTemplate`的示例：

```
@Configuration
@EnableAutoConfiguration
static class Config {

	@Bean(name = "customAsyncRestTemplate")
	public AsyncRestTemplate traceAsyncRestTemplate() {
		return new AsyncRestTemplate(asyncClientFactory(),
				clientHttpRequestFactory());
	}

	private ClientHttpRequestFactory clientHttpRequestFactory() {
		ClientHttpRequestFactory clientHttpRequestFactory = new CustomClientHttpRequestFactory();
		// CUSTOMIZE HERE
		return clientHttpRequestFactory;
	}

	private AsyncClientHttpRequestFactory asyncClientFactory() {
		AsyncClientHttpRequestFactory factory = new CustomAsyncClientHttpRequestFactory();
		// CUSTOMIZE HERE
		return factory;
	}

}
```

### 64.6.3 `WebClient`

我们注入了一个`ExchangeFilterFunction`实现，该实现创建了一个范围，并通过成功和错误时回调，负责关闭客户端spans。

要阻止此功能，请将`spring.sleuth.web.client.enabled`设置为`false`。

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 您必须将`WebClient`注册为bean，以便应用跟踪工具。如果您使用关键字`new`创建一个`WebClient`实例，则检测无效。 |      |

### 64.6.4特拉弗森

如果您使用[Traverson](https://docs.spring.io/spring-hateoas/docs/current/reference/html/#client.traverson)库，则可以将`RestTemplate`作为bean注入Traverson对象。由于`RestTemplate`已被拦截，因此您将获得对客户端中跟踪的完全支持。以下伪代码显示了如何执行此操作：

```
@Autowired RestTemplate restTemplate;

Traverson traverson = new Traverson(URI.create("http://some/address"),
    MediaType.APPLICATION_JSON, MediaType.APPLICATION_JSON_UTF8).setRestOperations(restTemplate);
// use Traverson
```

### 64.6.5 Apache `HttpClientBuilder`和`HttpAsyncClientBuilder`

我们对`HttpClientBuilder`和`HttpAsyncClientBuilder`进行检测，以便将跟踪上下文注入已发送的请求中。

要阻止这些功能，请将`spring.sleuth.web.client.enabled`设置为`false`。

### 64.6.6净值`HttpClient`

我们对Netty的`HttpClient`进行检测。

要阻止此功能，请将`spring.sleuth.web.client.enabled`设置为`false`。

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 您必须将`HttpClient`注册为bean，以便进行检测。如果您使用`new`关键字创建`HttpClient`实例，则检测无效。 |      |

### 64.6.7 `UserInfoRestTemplateCustomizer`

我们检测Spring Security的`UserInfoRestTemplateCustomizer`。

要阻止此功能，请将`spring.sleuth.web.client.enabled`设置为`false`。

## 64.7 Feign

默认情况下，Spring Cloud Sleuth与Feign到`TraceFeignClientAutoConfiguration`集成。您可以通过将`spring.sleuth.feign.enabled`设置为`false`来完全禁用它。如果这样做，则不会发生与Feign相关的检测。

Feign工具的一部分是通过`FeignBeanPostProcessor`完成的。您可以通过将`spring.sleuth.feign.processor.enabled`设置为`false`来禁用它。如果将其设置为`false`，则Spring Cloud Sleuth不会检测任何自定义的Feign组件。但是，所有默认工具仍然存在。

## 64.8 gRPC

Spring Cloud Sleuth 通过`TraceGrpcAutoConfiguration` 为[gRPC](https://grpc.io/)提供了工具。您可以通过将`spring.sleuth.grpc.enabled`设置为`false`来完全禁用它。

### 64.8.1变体1

#### 依存关系

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| gRPC集成依赖于两个外部库来检测客户端和服务器，并且这两个库都必须位于类路径中才能启用检测。 |      |

Maven:

```
		<dependency>
			<groupId>io.github.lognet</groupId>
			<artifactId>grpc-spring-boot-starter</artifactId>
		</dependency>
		<dependency>
			<groupId>io.zipkin.brave</groupId>
			<artifactId>brave-instrumentation-grpc</artifactId>
		</dependency>
```

Gradle:

```
    compile("io.github.lognet:grpc-spring-boot-starter")
    compile("io.zipkin.brave:brave-instrumentation-grpc")
```

#### 服务器检测

Spring Cloud Sleuth利用grpc-spring-boot-starter向带有`@GRpcService`注释的所有服务注册Brave的gRPC服务器拦截器。

#### 客户端工具

gRPC客户端利用`ManagedChannelBuilder`来构造用于与gRPC服务器通信的`ManagedChannel`。本机`ManagedChannelBuilder`提供静态方法作为构建`ManagedChannel`实例的入口点，但是，此机制不受Spring应用程序上下文的影响。

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| Spring Cloud Sleuth提供了一个`SpringAwareManagedChannelBuilder`，可以通过Spring应用程序上下文对其进行自定义，并由gRPC客户端注入。**创建`ManagedChannel`实例时必须使用此构建器。** |      |

侦探创建了一个`TracingManagedChannelBuilderCustomizer`，将Brave的客户端拦截器注入到`SpringAwareManagedChannelBuilder`中。

### 64.8.2变体2

[Grpc Spring Boot Starter](https://github.com/yidongnan/grpc-spring-boot-starter)自动检测到Spring Cloud Sleuth的存在以及brave为gRPC提供的工具，并注册了必要的客户端和/或服务器工具。

## 64.9异步通信

### 64.9.1 `@Async`带注释的方法

在Spring Cloud Sleuth中，我们检测与异步相关的组件，以便在线程之间传递跟踪信息。您可以通过将`spring.sleuth.async.enabled`的值设置为`false`来禁用此行为。

如果您使用`@Async`注释方法，我们将自动创建具有以下特征的新Span：

- 如果该方法用`@SpanName`注释，则注释的值为Span的名称。
- 如果该方法未使用`@SpanName`进行注释，则Span名称是带有注释的方法名称。
- 该范围用方法的类名和方法名标记。

### 64.9.2 `@Scheduled`带注释的方法

在Spring Cloud Sleuth中，我们对调度的方法执行进行检测，以便在线程之间传递跟踪信息。您可以通过将`spring.sleuth.scheduled.enabled`的值设置为`false`来禁用此行为。

如果您使用`@Scheduled`注释方法，我们将自动创建具有以下特征的新跨度：

- 跨度名称是带注释的方法名称。
- 该范围用方法的类名和方法名标记。

如果要跳过某些带有`@Scheduled`注释的类的跨度创建，则可以使用与`@Scheduled`带注释的类的标准名称匹配的正则表达式来设置`spring.sleuth.scheduled.skipPattern`。如果同时使用`spring-cloud-sleuth-stream`和`spring-cloud-netflix-hystrix-stream`，则会为每个Hystrix指标创建一个范围，并将其发送到Zipkin。这种行为可能很烦人。这就是默认情况下`spring.sleuth.scheduled.skipPattern=org.springframework.cloud.netflix.hystrix.stream.HystrixStreamTask`的原因。

### 64.9.3 Executor，ExecutorService和ScheduledExecutorService

我们提供`LazyTraceExecutor`，`TraceableExecutorService`和`TraceableScheduledExecutorService`。每次提交，调用或计划新任务时，这些实现都会创建spans。

以下示例显示了使用`CompletableFuture`时如何将跟踪信息传递给`TraceableExecutorService`：

```
CompletableFuture<Long> completableFuture = CompletableFuture.supplyAsync(() -> {
	// perform some logic
	return 1_000_000L;
}, new TraceableExecutorService(beanFactory, executorService,
		// 'calculateTax' explicitly names the span - this param is optional
		"calculateTax"));
```

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| Sleuth不适用于`parallelStream()`。如果要使跟踪信息通过流传播，则必须使用`supplyAsync(…)`的方法，如前所示。 |      |

如果有beans实现了您想从跨度创建中排除的`Executor`接口，则可以使用`spring.sleuth.async.ignored-beans`属性，在其中可以提供bean名称的列表。

#### 定制执行者

有时，您需要设置`AsyncExecutor`的自定义实例。以下示例显示如何设置这样的自定义`Executor`：

```
@Configuration
@EnableAutoConfiguration
@EnableAsync
// add the infrastructure role to ensure that the bean gets auto-proxied
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)
static class CustomExecutorConfig extends AsyncConfigurerSupport {

	@Autowired
	BeanFactory beanFactory;

	@Override
	public Executor getAsyncExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		// CUSTOMIZE HERE
		executor.setCorePoolSize(7);
		executor.setMaxPoolSize(42);
		executor.setQueueCapacity(11);
		executor.setThreadNamePrefix("MyExecutor-");
		// DON'T FORGET TO INITIALIZE
		executor.initialize();
		return new LazyTraceExecutor(this.beanFactory, executor);
	}

}
```

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 为确保对配置进行后期处理，请记住在`@Configuration`类上添加`@Role(BeanDefinition.ROLE_INFRASTRUCTURE)` |

## 64.10消息传递

通过将`spring.sleuth.messaging.enabled`属性设置为等于`false`的值，可以禁用本节中的功能。

### 64.10.1 Spring Integration和Spring Cloud Stream

Spring Cloud Sleuth与[Spring Integration](https://projects.spring.io/spring-integration/)集成。它为发布和订阅事件创建spans。要禁用Spring Integration检测，请将`spring.sleuth.integration.enabled`设置为`false`。

您可以提供`spring.sleuth.integration.patterns`模式来显式提供要包括以进行跟踪的通道的名称。默认情况下，除`hystrixStreamOutput`通道以外的所有通道都包括在内。

| ![[重要]](/assets/images/springcloud/important.png)                                | 重要 |
| ------------------------------------------------------------ | ---- |
| 使用`Executor`构建Spring Integration `IntegrationFlow`时，必须使用`Executor`的未跟踪版本。用`TraceableExecutorService`装饰Spring Integration执行器通道会导致spans被不正确地关闭。 |      |

如果要自定义从消息头读取和向消息头写入跟踪上下文的方式，就足以注册类型的beans：

- `Propagation.Setter<MessageHeaderAccessor, String>`-用于将标头写入消息
- `Propagation.Getter<MessageHeaderAccessor, String>`-用于从邮件中读取标题

### 64.10.2 Spring RabbitMq

我们对`RabbitTemplate`进行检测，以便将跟踪标头注入到消息中。

要阻止此功能，请将`spring.sleuth.messaging.rabbit.enabled`设置为`false`。

### 64.10.3 Spring Kafka

我们检测Spring Kafka的`ProducerFactory`和`ConsumerFactory`，以便将跟踪标头注入到创建的Spring Kafka的`Producer`和`Consumer`中。

要阻止此功能，请将`spring.sleuth.messaging.kafka.enabled`设置为`false`。

### 64.10.4 Spring JMS

我们对`JmsTemplate`进行检测，以便将跟踪标头注入到消息中。我们还在消费者方面支持`@JmsListener`带注释的方法。

要阻止此功能，请将`spring.sleuth.messaging.jms.enabled`设置为`false`。

| ![[重要]](/assets/images/springcloud/important.png) | 重要 |
| ----------------------------- | ---- |
| 我们不支持JMS的行李运送       |      |

## 64.11 Zuul

我们通过跟踪信息丰富Ribbon请求来检测Zuul Ribbon集成。要禁用Zuul支持，请将`spring.sleuth.zuul.enabled`属性设置为`false`。

## 64.12项目Reactor

对于取决于项目Reactor的项目，例如Spring Cloud网关，建议将`spring.sleuth.reactor.decorate-on-each`选项设置为`false`。这样，与标准仪器机制相比，应观察到性能提高。此选项的作用是它将包装修饰符`onLast`而不是`onEach`，这将导致创建的对象少得多。缺点是，当项目Reactor将更改线程时，跟踪传播将继续进行而不会出现问题，但是依赖于`ThreadLocal`的任何内容（例如MDC条目）都可能出现故障。

## 65.运行示例

您可以看到在[Pivotal Web服务中](https://run.pivotal.io/)部署的正在运行的示例。在以下链接中查看它们：

- [Zipkin用于示例顶部的应用程序](https://docssleuth-zipkin-server.cfapps.io/)。首先向[服务1](https://docssleuth-service1.cfapps.io/start)发出请求，然后检查Zipkin中的跟踪。
- [Zipkin用于PWS上的Brewery](https://docsbrewing-zipkin-server.cfapps.io/)，其[Github代码](https://github.com/spring-cloud-samples/brewery)。确保选择了7天的回溯期。如果没有任何痕迹，请转到“ [呈现应用程序”](https://docsbrewing-presenting.cfapps.io/) 并订购一些啤酒。然后检查Zipkin是否有痕迹。

# 第九部分 Spring Cloud Consul

**Greenwich SR5**

该项目通过自动配置并绑定到Spring环境和其他Spring编程模型习惯用法，为Spring Boot应用提供了Consul集成。通过一些简单的注释，您可以快速启用和配置应用程序内部的通用模式，并使用基于Consul的组件构建大型分布式系统。提供的模式包括服务发现，控制Bus和配置。通过与Spring Cloud Netflix集成，可以提供智能路由（Zuul）和客户端负载平衡（Ribbon），断路器（Hystrix）。

## 66.安装Consul

请参阅[安装文档](https://www.consul.io/intro/getting-started/install.html)以获取有关如何安装Consul的说明。

## 67. Consul Agent

Consul Agent客户端必须可用于所有Spring Cloud Consul应用程序。默认情况下，代理客户端应位于`localhost:8500`。有关如何启动代理客户端以及如何连接到Consul Agent服务器集群的详细信息，请参阅[代理文档](https://consul.io/docs/agent/basics.html)。为了进行开发，安装consul后，可以使用以下命令启动Consul Agent：

```
./src/main/bash/local_run_consul.sh
```

这将在服务器模式下的端口8500上启动代理，并且ui可从[http：// localhost：8500获得。](http://localhost:8500/)

## 68.使用Consul进行服务发现

服务发现是基于微服务的体系结构的关键原则之一。尝试手动配置每个客户端或某种形式的约定可能非常困难并且非常脆弱。Consul通过[HTTP API](https://www.consul.io/docs/agent/http.html)和[DNS](https://www.consul.io/docs/agent/dns.html)提供服务发现服务。Spring Cloud Consul利用HTTP API进行服务注册和发现。这不会阻止非Spring Cloud应用程序利用DNS接口。Consul代理服务器在[群集中](https://www.consul.io/docs/internals/architecture.html)运行，该[群集](https://www.consul.io/docs/internals/architecture.html)通过[八卦协议进行通信](https://www.consul.io/docs/internals/gossip.html)并使用[Raft共识协议](https://www.consul.io/docs/internals/consensus.html)。

## 68.1如何激活

要激活Consul服务发现，请将启动器与组`org.springframework.cloud`和工件ID `spring-cloud-starter-consul-discovery`一起使用。有关使用当前Spring Cloud版本Train设置构建系统的详细信息，请参见[Spring Cloud项目页面](https://projects.spring.io/spring-cloud/)。

## 68.2向Consul注册

当客户端向Consul注册时，它将提供有关其自身的元数据，例如主机和端口，id，名称和标签。默认情况下，会创建一个HTTP [检查，](https://www.consul.io/docs/agent/checks.html)该[检查](https://www.consul.io/docs/agent/checks.html)每10秒Consul命中`/health`端点。如果运行状况检查失败，则将该服务实例标记为关键。

示例Consul客户：

```
@SpringBootApplication
@RestController
public class Application {

    @RequestMapping("/")
    public String home() {
        return "Hello world";
    }

    public static void main(String[] args) {
        new SpringApplicationBuilder(Application.class).web(true).run(args);
    }

}
```

（即完全正常的Spring Boot应用）。如果Consul客户端位于`localhost:8500`之外的其他位置，则需要进行配置才能找到该客户端。例：

**application.yml。** 

```
spring:
  cloud:
    consul:
      host: localhost
      port: 8500
```



| ![[警告]](/assets/images/springcloud/caution.png)                                  | 警告 |
| ------------------------------------------------------------ | ---- |
| 如果使用[Spring Cloud Consul Config](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-consul-config)，则需要将以上值放置在`bootstrap.yml`中，而不是`application.yml`中。 |      |

来自`Environment`的默认服务名称，实例ID和端口分别为`${spring.application.name}`，Spring上下文ID和`${server.port}`。

要禁用Consul发现客户端，可以将`spring.cloud.consul.discovery.enabled`设置为`false`。当`spring.cloud.discovery.enabled`设置为`false`时，Consul Discovery Client也将被禁用。

要禁用服务注册，可以将`spring.cloud.consul.discovery.register`设置为`false`。

出现这种情况时,consul能够发现服务,但是check检查为通过,可能是服务没有开启 actuator

![image-20221016092116261](/assets/images/springcloud/image-20221016092116261.png)

![image-20221016092329350](/assets/images/springcloud/image-20221016092329350.png)

在pom文件中添加依赖即可:

```xml
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
```

![image-20221016093600558](/assets/images/springcloud/image-20221016093600558.png)



### 68.2.1将管理注册为单独的服务

如果将管理服务器端口设置为与应用程序端口不同的端口，则通过设置`management.server.port`属性，管理服务将被注册为与应用程序服务不同的服务。例如：

**application.yml。** 

```
spring:
  application:
    name: myApp
management:
  server:
    port: 4452
```



以上配置将注册以下两项服务：

- 申请服务：

```
ID: myApp
Name: myApp
```

- 管理服务：

```
ID: myApp-management
Name: myApp-management
```

管理服务将从应用程序服务继承其`instanceId`和`serviceName`。例如：

**application.yml。** 

```
spring:
  application:
    name: myApp
management:
  server:
    port: 4452
spring:
  cloud:
    consul:
      discovery:
        instance-id: custom-service-id
        serviceName: myprefix-${spring.application.name}
```



以上配置将注册以下两项服务：

- 申请服务：

```
ID: custom-service-id
Name: myprefix-myApp
```

- 管理服务：

```
ID: custom-service-id-management
Name: myprefix-myApp-management
```

通过以下属性可以进行进一步的自定义：

```
/** Port to register the management service under (defaults to management port) */
spring.cloud.consul.discovery.management-port

/** Suffix to use when registering management service (defaults to "management" */
spring.cloud.consul.discovery.management-suffix

/** Tags to use when registering management service (defaults to "management" */
spring.cloud.consul.discovery.management-tags
```

## 68.3 HTTP运行状况检查

Consul实例的运行状况检查默认为“ / health”，这是Spring Boot Actuator应用程序中有用端点的默认位置。如果您使用非默认上下文路径或Servlet路径（例如`server.servletPath=/foo`）或管理端点路径（例如`management.server.servlet.context-path=/admin`），则即使对于Actuator应用程序，也需要更改它们。也可以配置Consul用于检查运行状况端点的间隔。“ 10s”和“ 1m”分别代表10秒和1分钟。例：

**application.yml。** 

```
spring:
  cloud:
    consul:
      discovery:
        healthCheckPath: ${management.server.servlet.context-path}/health
        healthCheckInterval: 15s
```



您可以通过设置`management.health.consul.enabled=false`来禁用运行状况检查。

### 68.3.1元数据和Consul标签

Consul尚不支持有关服务的元数据。Spring Cloud的`ServiceInstance`有一个`Map<String, String> metadata`字段。Spring Cloud Consul使用Consul标签来近似元数据，直到Consul正式支持元数据。格式为`key=value`的标签将被拆分并分别用作`Map`键和值。没有等号`=`的标记将用作键和值。

**application.yml。** 

```
spring:
  cloud:
    consul:
      discovery:
        tags: foo=bar, baz
```



上面的配置将生成带有`foo→bar`和`baz→baz`的映射。

### 68.3.2使Consul实例ID唯一

默认情况下，consul实例注册的ID与其Spring应用程序上下文ID相同。默认情况下，Spring应用程序上下文ID为`${spring.application.name}:comma,separated,profiles:${server.port}`。在大多数情况下，这将允许一项服务的多个实例在一台计算机上运行。如果需要进一步的唯一性，则可以使用Spring Cloud在`spring.cloud.consul.discovery.instanceId`中提供唯一的标识符来覆盖它。例如：

**application.yml。** 

```
spring:
  cloud:
    consul:
      discovery:
        instanceId: ${spring.application.name}:${vcap.application.instance_id:${spring.application.instance_id:${random.value}}}
```



有了此元数据，并在本地主机上部署了多个服务实例，随机值将在其中加入以使实例唯一。在Cloudfoundry中，`vcap.application.instance_id`将自动在Spring Boot应用程序中填充，因此将不需要随机值。

### 68.3.3将标头应用于健康检查请求

标头可以应用于健康检查请求。例如，如果您尝试注册使用[Vault Backend](https://github.com/spring-cloud/spring-cloud-config/blob/master/docs/src/main/asciidoc/spring-cloud-config.adoc#vault-backend)的[Spring Cloud Config](https://cloud.spring.io/spring-cloud-config/)服务器：

**application.yml。** 

```
spring:
  cloud:
    consul:
      discovery:
        health-check-headers:
          X-Config-Token: 6442e58b-d1ea-182e-cfa5-cf9cddef0722
```



根据HTTP标准，每个标头可以有多个值，在这种情况下，可以提供一个数组：

**application.yml。** 

```
spring:
  cloud:
    consul:
      discovery:
        health-check-headers:
          X-Config-Token:
            - "6442e58b-d1ea-182e-cfa5-cf9cddef0722"
            - "Some other value"
```



## 68.4查找服务

### 68.4.1使用Ribbon

Spring Cloud支持[Feign](https://github.com/spring-cloud/spring-cloud-netflix/blob/master/docs/src/main/asciidoc/spring-cloud-netflix.adoc#spring-cloud-feign)（REST客户端构建器），还支持[Spring `RestTemplate`，](https://github.com/spring-cloud/spring-cloud-netflix/blob/master/docs/src/main/asciidoc/spring-cloud-netflix.adoc#spring-cloud-ribbon) 以使用逻辑服务名称/标识而不是物理URL查找服务。Feign和发现感知的RestTemplate都使用[Ribbon](https://cloud.spring.io/spring-cloud-netflix/single/spring-cloud-netflix.html#spring-cloud-ribbon)进行客户端负载平衡。

如果要使用RestTemplate访问服务STORES，只需声明：

```
@LoadBalanced
@Bean
public RestTemplate loadbalancedRestTemplate() {
     new RestTemplate();
}
```

并以这种方式使用它（注意我们如何使用Consul中的STORES服务名称/ id而不是完全限定的域名）：

```
@Autowired
RestTemplate restTemplate;

public String getFirstProduct() {
   return this.restTemplate.getForObject("https://STORES/products/1", String.class);
}
```

如果您在多个数据中心中有Consul个群集，并且要访问另一个数据中心中的服务，则仅靠服务名称/ id是不够的。在这种情况下，请使用属性`spring.cloud.consul.discovery.datacenters.STORES=dc-west`，其中`STORES`是服务名称/ id，而`dc-west`是STORES服务所在的数据中心。

### 68.4.2使用DiscoveryClient

您还可以使用`org.springframework.cloud.client.discovery.DiscoveryClient`，它为发现客户端提供了一个简单的API，它不是特定于Netflix的，例如

```
@Autowired
private DiscoveryClient discoveryClient;

public String serviceUrl() {
    List<ServiceInstance> list = discoveryClient.getInstances("STORES");
    if (list != null && list.size() > 0 ) {
        return list.get(0).getUri();
    }
    return null;
}
```

## 68.5 Consul目录手表

Consul目录监视利用consul [监视服务的能力](https://www.consul.io/docs/agent/watches.html#services)。Catalog Watch进行阻塞Consul HTTP API调用，以确定是否有任何服务已更改。如果有新的服务数据，则会发布心跳事件。

要更改称为“配置监视”的频率，请更改`spring.cloud.consul.config.discovery.catalog-services-watch-delay`。默认值为1000，以毫秒为单位。延迟是上一次调用结束与下一次调用开始之间的时间量。

要禁用目录监视集`spring.cloud.consul.discovery.catalogServicesWatch.enabled=false`。

手表使用Spring `TaskScheduler`将通话安排到consul。默认情况下，它是`ThreadPoolTaskScheduler`，其`poolSize`为1。要更改`TaskScheduler`，请创建一个类型为`TaskScheduler`的bean，名称为`ConsulDiscoveryClientConfiguration.CATALOG_WATCH_TASK_SCHEDULER_NAME`常量。

## 69.使用Consul的分布式配置

Consul提供了用于存储配置和其他元数据的[键/值存储](https://consul.io/docs/agent/http/kv.html)。Spring Cloud Consul Config是[Config Server和Client](https://github.com/spring-cloud/spring-cloud-config)的替代方法。在特殊的“引导”阶段，配置被加载到Spring环境中。默认情况下，配置存储在`/config`文件夹中。基于应用程序的名称和模拟解析属性的Spring Cloud Config顺序的活动配置文件，将创建多个`PropertySource`实例。例如，名称为“ testApp”且配置文件为“ dev”的应用程序将创建以下属性源：

```
config/testApp,dev/
config/testApp/
config/application,dev/
config/application/
```

最具体的属性来源在顶部，最不具体的属性在底部。`config/application`文件夹中的Properties适用于使用consul进行配置的所有应用程序。`config/testApp`文件夹中的Properties仅可用于名为“ testApp”的服务的实例。

当前在启动应用程序时读取配置。向`/refresh`发送HTTP POST将导致重新加载配置。[第69.3节“ Config Watch”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-consul-config-watch)还将自动检测更改并重新加载应用程序上下文。

## 69.1如何激活

要开始使用Consul配置，请使用组`org.springframework.cloud`和工件ID为`spring-cloud-starter-consul-config`的启动器。有关使用当前Spring Cloud版本Train设置构建系统的详细信息，请参见[Spring Cloud项目页面](https://projects.spring.io/spring-cloud/)。

这将启用将配置Spring Cloud Consul Config的自动配置。

## 69.2定制

Consul Config可以使用以下属性来自定义：

**bootstrap.yml。** 

```
spring:
  cloud:
    consul:
      config:
        enabled: true
        prefix: configuration
        defaultContext: apps
        profileSeparator: '::'
```



- `enabled`将此值设置为“ false”将禁用Consul Config
- `prefix`设置配置值的基本文件夹
- `defaultContext`设置所有应用程序使用的文件夹名称
- `profileSeparator`设置分隔符的值，该分隔符用于在带有配置文件的属性源中分隔配置文件名称

## 69.3配置观察

Consul Config Watch利用consul的功能来[监视键前缀](https://www.consul.io/docs/agent/watches.html#keyprefix)。Config Watch进行阻塞Consul HTTP API调用，以确定当前应用程序的任何相关配置数据是否已更改。如果有新的配置数据，则会发布刷新事件。这等效于调用`/refresh`执行器端点。

要更改称为“配置监视”的频率，请更改`spring.cloud.consul.config.watch.delay`。默认值为1000，以毫秒为单位。延迟是上一次调用结束与下一次调用开始之间的时间量。

要禁用配置监视，请设置`spring.cloud.consul.config.watch.enabled=false`。

手表使用Spring `TaskScheduler`将通话安排到consul。默认情况下，它是`ThreadPoolTaskScheduler`，其`poolSize`为1。要更改`TaskScheduler`，请创建一个类型为`TaskScheduler`的bean，名称为`ConsulConfigAutoConfiguration.CONFIG_WATCH_TASK_SCHEDULER_NAME`常量。

## 69.4 YAML或带有配置的Properties

与单个键/值对相反，以YAML或Properties格式存储属性的对象可能更方便。将`spring.cloud.consul.config.format`属性设置为`YAML`或`PROPERTIES`。例如使用YAML：

**bootstrap.yml。** 

```
spring:
  cloud:
    consul:
      config:
        format: YAML
```



必须在consul中的相应`data`键中设置YAML。使用上面的默认值，键看起来像：

```
config/testApp,dev/data
config/testApp/data
config/application,dev/data
config/application/data
```

您可以将YAML文档存储在上面列出的任何键中。

您可以使用`spring.cloud.consul.config.data-key`更改数据密钥。

## 69.5 git2consul与配置

git2consul是一个Consul社区项目，它从git存储库中将文件加载到Consul中的各个键中。默认情况下，键的名称是文件的名称。YAML和Properties文件分别受文件扩展名`.yml`和`.properties`的支持。将`spring.cloud.consul.config.format`属性设置为`FILES`。例如：

**bootstrap.yml。** 

```
spring:
  cloud:
    consul:
      config:
        format: FILES
```



给定`/config`中的以下键，`development`配置文件和应用程序名称`foo`：

```
.gitignore
application.yml
bar.properties
foo-development.properties
foo-production.yml
foo.properties
master.ref
```

将创建以下属性源：

```
config/foo-development.properties
config/foo.properties
config/application.yml
```

每个密钥的值必须是格式正确的YAML或Properties文件。

## 69.6快速失败

如果无法使用consul进行配置，则在某些情况下（例如本地开发或某些测试场景）可能会很方便而不会失败。在`bootstrap.yml`中设置`spring.cloud.consul.config.failFast=false`将使配置模块记录警告而不是引发异常。这将允许应用程序继续正常启动。

## 70. Consul重试

如果您希望应用启动时consul代理有时不可用，则可以要求它在失败后继续尝试。您需要将`spring-retry`和`spring-boot-starter-aop`添加到类路径中。默认行为是重试6次，初始回退间隔为1000ms，随后的回退的指数乘数为1.1。您可以使用`spring.cloud.consul.retry.*`配置属性来配置这些属性（和其他属性）。这适用于Spring Cloud Consul Config和Discovery注册。

| ![[提示]](/assets/images/springcloud/tip.png)                                      |
| ------------------------------------------------------------ |
| 要完全控制重试，请添加ID为“ consulRetryInterceptor”的类型为`RetryOperationsInterceptor`的`@Bean`。Spring重试有一个`RetryInterceptorBuilder`，可以轻松创建一个。 |

## 71. Spring Cloud Bus与Consul

## 71.1如何激活

要开始使用Consul Bus，请将启动器与组`org.springframework.cloud`和工件ID `spring-cloud-starter-consul-bus`一起使用。有关使用当前Spring Cloud版本Train设置构建系统的详细信息，请参见[Spring Cloud项目页面](https://projects.spring.io/spring-cloud/)。

有关可用的执行器端点以及如何发送自定义消息的信息，请参见[Spring Cloud Bus](https://cloud.spring.io/spring-cloud-bus/)文档。

## 72.带有Hystrix的断路器

通过在项目pom.xml：`spring-cloud-starter-hystrix`中包含此启动程序，应用程序可以使用Spring Cloud Netflix项目提供的Hystrix断路器。Hystrix不依赖Netflix Discovery Client。`@EnableHystrix`批注应放在配置类（通常是主类）上。然后可以用`@HystrixCommand`注释方法，以使其受到断路器的保护。有关更多详细信息，请参见[文档](https://projects.spring.io/spring-cloud/spring-cloud.html#_circuit_breaker_hystrix_clients)。

## 73. Hystrix通过Turbine和Consul进行指标汇总

Turbine（由Spring Cloud Netflix项目提供）汇总了多个实例Hystrix指标流，因此仪表板可以显示汇总视图。Turbine使用`DiscoveryClient`接口查找相关实例。要将Turbine与Spring Cloud Consul结合使用，请以类似于以下示例的方式配置Turbine应用程序：

**pom.xml。** 

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-netflix-turbine</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-consul-discovery</artifactId>
</dependency>
```



请注意，Turbine依赖项不是启动器。涡轮启动器包括对Netflix Eureka的支持。

**application.yml。** 

```
spring.application.name: turbine
applications: consulhystrixclient
turbine:
  aggregator:
    clusterConfig: ${applications}
  appConfig: ${applications}
```



`clusterConfig`和`appConfig`部分必须匹配，因此将以逗号分隔的服务ID列表放入单独的配置属性中很有用。

**Turbine。java。** 

```
@EnableTurbine
@SpringBootApplication
public class Turbine {
    public static void main(String[] args) {
        SpringApplication.run(DemoturbinecommonsApplication.class, args);
    }
}
```



# 第十部分。Spring Cloud Zookeeper

该项目通过自动配置并绑定到Spring环境和其他Spring编程模型习惯用法，为Spring Boot应用程序提供了Zookeeper集成。通过一些注释，您可以快速启用和配置应用程序内部的通用模式，并使用基于Zookeeper的组件构建大型分布式系统。提供的模式包括服务发现和配置。与Spring Cloud Netflix集成可提供智能路由（Zuul），客户端负载平衡（Ribbon）和断路器（Hystrix）。

## 74.安装Zookeeper

有关如何安装Zookeeper的说明，请参阅[安装文档](https://zookeeper.apache.org/doc/current/zookeeperStarted.html)。

Spring Cloud Zookeeper在后台使用Apache Curator。尽管Zookeeper开发团队仍将Zookeeper 3.5.x视为“测试版”，但实际情况是，许多用户在生产中使用了它。但是，Zookeeper 3.4.x也用于生产中。在Apache Curator 4.0之前，两个版本的Apache Curator支持Zookeeper的两个版本。从Curator 4.0开始，两个Zookeeper版本都通过相同的Curator库支持。

如果要与版本3.4集成，则需要更改`curator`附带的Zookeeper依赖项，并因此更改`spring-cloud-zookeeper`。为此，只需排除该依赖性并添加如下所示的3.4.x版本。

**专家。** 

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-zookeeper-all</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.apache.zookeeper</groupId>
            <artifactId>zookeeper</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.apache.zookeeper</groupId>
    <artifactId>zookeeper</artifactId>
    <version>3.4.12</version>
    <exclusions>
        <exclusion>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-log4j12</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```



**摇篮。** 

```
compile('org.springframework.cloud:spring-cloud-starter-zookeeper-all') {
  exclude group: 'org.apache.zookeeper', module: 'zookeeper'
}
compile('org.apache.zookeeper:zookeeper:3.4.12') {
  exclude group: 'org.slf4j', module: 'slf4j-log4j12'
}
```



## 75.使用Zookeeper进行服务发现

服务发现是基于微服务的体系结构的关键原则之一。尝试手动配置每个客户端或某种形式的约定可能很困难并且很脆弱。[Curator](https://curator.apache.org/)（用于Zookeeper的Java库）通过[Service Discovery Extension](https://curator.apache.org/curator-x-discovery/)提供服务发现。Spring Cloud Zookeeper使用此扩展名进行服务注册和发现。

## 75.1激活

包括对`org.springframework.cloud:spring-cloud-starter-zookeeper-discovery`的依赖项将启用设置Spring Cloud Zookeeper发现的自动配置。

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 对于web功能，您仍然需要包含`org.springframework.boot:spring-boot-starter-web`。 |

| ![[警告]](/assets/images/springcloud/caution.png)                                  | 警告 |
| ------------------------------------------------------------ | ---- |
| 当使用Zookeeper的3.4版本时，您需要按[此处](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-zookeeper-install)所述更改包含依赖项的方式。 |      |

## 75.2向Zookeeper注册

客户端向Zookeeper注册时，它将提供有关其自身的元数据（例如主机和端口，ID和名称）。

以下示例显示了一个Zookeeper客户端：

```
@SpringBootApplication
@RestController
public class Application {

    @RequestMapping("/")
    public String home() {
        return "Hello world";
    }

    public static void main(String[] args) {
        new SpringApplicationBuilder(Application.class).web(true).run(args);
    }

}
```

| ![[注意]](/assets/images/springcloud/note.png)                |
| --------------------------------------- |
| 前面的示例是普通的Spring Boot应用程序。 |

如果Zookeeper位于`localhost:2181`之外的其他位置，则配置必须提供服务器的位置，如以下示例所示：

**application.yml。** 

```
spring:
  cloud:
    zookeeper:
      connect-string: localhost:2181
```



| ![[警告]](/assets/images/springcloud/caution.png)                                  | 警告 |
| ------------------------------------------------------------ | ---- |
| 如果使用[Spring Cloud Zookeeper Config](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-zookeeper-config)，则上一示例中显示的值必须位于`bootstrap.yml`中，而不是`application.yml`中。 |      |

默认服务名称，实例ID和端口（从`Environment`获取）分别为`${spring.application.name}`，Spring上下文ID和`${server.port}`。

在类路径上具有`spring-cloud-starter-zookeeper-discovery`可使该应用同时进入Zookeeper “ 服务 ”（即，它自己注册）和“ 客户端 ”（即，它可以查询Zookeeper以定位其他服务） 。

如果要禁用Zookeeper Discovery Client，可以将`spring.cloud.zookeeper.discovery.enabled`设置为`false`。

## 75.3使用DiscoveryClient

Spring Cloud 使用逻辑服务名称而不是物理URL 支持 [Feign](https://github.com/spring-cloud/spring-cloud-netflix/blob/master/docs/src/main/asciidoc/spring-cloud-netflix.adoc#spring-cloud-feign) （REST客户端生成器）和 [Spring `RestTemplate`](https://github.com/spring-cloud/spring-cloud-netflix/blob/master/docs/src/main/asciidoc/spring-cloud-netflix.adoc#spring-cloud-ribbon)。

您还可以使用`org.springframework.cloud.client.discovery.DiscoveryClient`，它为发现客户端提供了一个不特定于Netflix的简单API，如以下示例所示：

```
@Autowired
private DiscoveryClient discoveryClient;

public String serviceUrl() {
    List<ServiceInstance> list = discoveryClient.getInstances("STORES");
    if (list != null && list.size() > 0 ) {
        return list.get(0).getUri().toString();
    }
    return null;
}
```

## 76.将Spring Cloud Zookeeper与Spring Cloud Netflix组件一起使用

Spring Cloud Netflix提供了有用的工具，无论您使用哪种`DiscoveryClient`实现方式，它们都可以工作。Feign，Turbine，Ribbon和Zuul与Spring Cloud Zookeeper一起使用。

## 76.1 Ribbon与Zookeeper

Spring Cloud Zookeeper提供了Ribbon的`ServerList`的实现。使用`spring-cloud-starter-zookeeper-discovery`时，默认情况下Ribbon被自动配置为使用`ZookeeperServerList`。

## 77. Spring Cloud Zookeeper和服务注册中心

Spring Cloud Zookeeper实现了`ServiceRegistry`接口，允许开发人员以编程方式注册任意服务。

`ServiceInstanceRegistration`类提供了一种`builder()`方法来创建`Registration`可以使用的`Registration`对象，如以下示例所示：

```
@Autowired
private ZookeeperServiceRegistry serviceRegistry;

public void registerThings() {
    ZookeeperRegistration registration = ServiceInstanceRegistration.builder()
            .defaultUriSpec()
            .address("anyUrl")
            .port(10)
            .name("/a/b/c/d/anotherservice")
            .build();
    this.serviceRegistry.register(registration);
}
```

## 77.1实例状态

Netflix Eureka支持向服务器注册`OUT_OF_SERVICE`实例。这些实例不作为活动服务实例返回。这对于诸如蓝色/绿色部署之类的行为很有用。（请注意，Curator Service Discovery配方不支持此行为。）利用灵活的有效负载，Spring云Zookeeper通过更新某些特定的元数据，然后在过滤器中的该元数据上进行过滤，来实现`OUT_OF_SERVICE`。 Ribbon `ZookeeperServerList`。`ZookeeperServerList`过滤掉所有不等于`UP`的非空实例状态。如果实例状态字段为空，则为了向后兼容，它被视为`UP`。要更改实例的状态，请用`OUT_OF_SERVICE`和`POST`设置为`ServiceRegistry`实例状态执行器端点，如以下示例所示：

```
$ http POST http://localhost:8081/service-registry status=OUT_OF_SERVICE
```

| ![[注意]](/assets/images/springcloud/note.png)                                     |
| ------------------------------------------------------------ |
| 前面的示例使用来自[https://httpie.org](https://httpie.org/)的`http`命令。 |

## 78. Zookeeper依赖项

以下主题介绍如何使用Spring Cloud Zookeeper依赖项：

- [第78.1节“使用Zookeeper依赖项”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-zookeeper-dependencies-using)
- [第78.2节“激活Zookeeper依赖项”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-zookeeper-dependencies-activating)
- [第78.3节“设置Zookeeper依赖项”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-zookeeper-dependencies-setting-up)
- [第78.4节“配置Spring Cloud Zookeeper依赖项”](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-zookeeper-dependencies-configuring)

## 78.1使用Zookeeper依赖项

Spring Cloud Zookeeper使您可以将应用程序的依赖项作为属性提供。作为依赖项，您可以了解在Zookeeper中注册的其他应用程序，并希望通过[Feign](https://github.com/spring-cloud/spring-cloud-netflix/blob/master/docs/src/main/asciidoc/spring-cloud-netflix.adoc#spring-cloud-feign) （REST客户端构建器）和[Spring `RestTemplate`](https://github.com/spring-cloud/spring-cloud-netflix/blob/master/docs/src/main/asciidoc/spring-cloud-netflix.adoc#spring-cloud-ribbon)调用它们 。

您还可以使用Zookeeper依赖关系观察程序功能来控制和监视依赖关系的状态。

## 78.2激活Zookeeper依赖项

包括对`org.springframework.cloud:spring-cloud-starter-zookeeper-discovery`的依赖关系将启用自动配置，以建立Spring Cloud Zookeeper依赖关系。即使您在属性中提供了依赖关系，也可以关闭依赖关系。为此，请将`spring.cloud.zookeeper.dependency.enabled`属性设置为false（默认为`true`）。

## 78.3设置Zookeeper依赖项

考虑下面的依赖关系表示示例：

**application.yml。** 

```
spring.application.name: yourServiceName
spring.cloud.zookeeper:
  dependencies:
    newsletter:
      path: /path/where/newsletter/has/registered/in/zookeeper
      loadBalancerType: ROUND_ROBIN
      contentTypeTemplate: application/vnd.newsletter.$version+json
      version: v1
      headers:
        header1:
            - value1
        header2:
            - value2
      required: false
      stubs: org.springframework:foo:stubs
    mailing:
      path: /path/where/mailing/has/registered/in/zookeeper
      loadBalancerType: ROUND_ROBIN
      contentTypeTemplate: application/vnd.mailing.$version+json
      version: v1
      required: true
```



接下来的几节将逐一遍历依赖项的每个部分。根属性名称为`spring.cloud.zookeeper.dependencies`。

### 78.3.1别名

在root属性下，您必须将每个依赖项表示为别名。这是由于Ribbon的限制所致，它要求将应用程序ID放置在URL中。因此，您无法通过任何复杂的路径，例如`/myApp/myRoute/name`。别名是您使用的名称，而不是`DiscoveryClient`，`Feign`或`RestTemplate`的`serviceId`。

在前面的示例中，别名为`newsletter`和`mailing`。以下示例显示了别名为`newsletter`的Feign的用法：

```
@FeignClient("newsletter")
public interface NewsletterService {
        @RequestMapping(method = RequestMethod.GET, value = "/newsletter")
        String getNewsletters();
}
```

### 78.3.2路径

该路径由`path` YAML属性表示，并且是在Zookeeper下注册依赖项的路径。如上 [一节所述](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-zookeeper-dependencies-setting-up-aliases)，Ribbon对URL进行操作。结果，该路径不符合其要求。这就是Spring Cloud Zookeeper将别名映射到正确路径的原因。

### 78.3.3负载均衡器类型

负载均衡器类型由`loadBalancerType` YAML属性表示。

如果您知道在调用此特定依赖项时必须应用哪种负载平衡策略，则可以在YAML文件中提供它，并自动应用它。您可以选择以下负载平衡策略之一：

- STICKY：选择后，将始终调用该实例。
- 随机：随机选择一个实例。
- ROUND_ROBIN：反复遍历实例。

### 78.3.4 `Content-Type`模板和版本

`Content-Type`模板和版本由`contentTypeTemplate`和`version` YAML属性表示。

如果您在`Content-Type`标头中对API进行版本控制，则不想将此标头添加到每个请求中。另外，如果您要调用API的新版本，则不想在代码中漫游以提高API版本。因此，您可以为`contentTypeTemplate`提供特殊的`$version`占位符。该占位符将由`version` YAML属性的值填充。考虑以下`contentTypeTemplate`的示例：

```
application/vnd.newsletter.$version+json
```

进一步考虑以下`version`：

```
v1
```

`contentTypeTemplate`和版本的组合会为每个请求创建一个`Content-Type`标头，如下所示：

```
application/vnd.newsletter.v1+json
```

### 78.3.5默认标题

默认标头由YAML中的`headers`映射表示。

有时，每次对依赖项的调用都需要设置一些默认头。要在代码中不要这样做，可以在YAML文件中进行设置，如以下示例`headers`部分所示：

```
headers:
    Accept:
        - text/html
        - application/xhtml+xml
    Cache-Control:
        - no-cache
```

该`headers`部分将在您的HTTP请求中添加带有适当值列表的`Accept`和`Cache-Control`标头。

### 78.3.6所需的依赖关系

所需的依存关系由YAML中的`required`属性表示。

如果在应用程序启动时需要建立依赖关系之一，则可以在YAML文件中设置`required: true`属性。

如果您的应用程序在引导期间无法本地化所需的依赖关系，则会引发异常，并且Spring上下文无法设置。换句话说，如果所需的依赖项未在Zookeeper中注册，则您的应用程序将无法启动。

您可以[在本文档后面的内容中](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-zookeeper-dependency-watcher-presence-checker)详细了解Spring Cloud Zookeeper Presence Checker 。

### 78.3.7存根

您可以提供一个冒号分隔的指向JAR的路径，其中包含依赖项的存根，如以下示例所示：

```
stubs: org.springframework:myApp:stubs
```

哪里：

- `org.springframework`是`groupId`。
- `myApp`是`artifactId`。
- `stubs`是分类器。（请注意，`stubs`是默认值。）

因为`stubs`是默认分类器，所以前面的示例等于以下示例：

```
stubs: org.springframework:myApp
```

## 78.4配置Spring Cloud Zookeeper依赖项

您可以设置以下属性来启用或禁用部分Zookeeper依赖关系功能：

- `spring.cloud.zookeeper.dependencies`：如果不设置此属性，则不能使用Zookeeper依赖关系。
- `spring.cloud.zookeeper.dependency.ribbon.enabled`（默认情况下启用）：Ribbon需要显式全局配置或特定的依赖项配置。通过启用此属性，可以实现运行时负载平衡策略解析，并且可以使用Zookeeper依赖项的`loadBalancerType`部分。需要此属性的配置具有`LoadBalancerClient`的实现，该实现委托给下一个项目符号中介绍的`ILoadBalancer`。
- `spring.cloud.zookeeper.dependency.ribbon.loadbalancer`（默认情况下启用）：由于使用此属性，自定义`ILoadBalancer`知道传递给Ribbon的URI部分实际上可能是别名，必须将其解析为Zookeeper。没有此属性，您将无法在嵌套路径下注册应用程序。
- `spring.cloud.zookeeper.dependency.headers.enabled`（默认情况下启用）：此属性注册一个`RibbonClient`，该文件会自动将适当的标头和内容类型及其版本附加在Dependency配置中。没有此设置，这两个参数将不起作用。
- `spring.cloud.zookeeper.dependency.resttemplate.enabled`（默认情况下启用）：启用后，此属性会修改带有`@LoadBalanced`注释的`RestTemplate`的请求标头，以使其传递标头和内容类型以及在依赖项配置中设置的版本。没有此设置，这两个参数将不起作用。

## 79. Spring Cloud Zookeeper依赖性观察者

Dependency Watcher机制使您可以将侦听器注册到您的依赖项。实际上，该功能是`Observator`模式的实现。当依赖项改变时，其状态（变为UP或DOWN）可以应用一些自定义逻辑。

## 79.1激活

Spring Cloud Zookeeper需要启用依赖功能，才能使用Dependency Watcher机制。

## 79.2注册侦听器

要注册侦听器，您必须实现一个名为`org.springframework.cloud.zookeeper.discovery.watcher.DependencyWatcherListener`的接口并将其注册为bean。该接口为您提供了一种方法：

```
void stateChanged(String dependencyName, DependencyState newState);
```

如果要注册特定依赖项的侦听器，则`dependencyName`将是您具体实现的区分符。`newState`为您提供有关您的依存关系已更改为`CONNECTED`还是`DISCONNECTED`的信息。

## 79.3使用状态检查器

依赖关系监视程序绑定的是称为状态检查器的功能。它使您可以在应用程序启动时提供自定义行为，以根据依赖项的状态做出反应。

抽象`org.springframework.cloud.zookeeper.discovery.watcher.presence.DependencyPresenceOnStartupVerifier`类的默认实现是`org.springframework.cloud.zookeeper.discovery.watcher.presence.DefaultDependencyPresenceOnStartupVerifier`，它的工作方式如下。

1. 如果依赖项标记为`required`，而不是Zookeeper，则在应用程序启动时，它将引发异常并关闭。
2. 如果依赖性不是`required`，则`org.springframework.cloud.zookeeper.discovery.watcher.presence.LogMissingDependencyChecker`记录在`WARN`级别缺少依赖性。

因为仅当没有`DependencyPresenceOnStartupVerifier`类型的bean时才注册`DefaultDependencyPresenceOnStartupVerifier`，所以可以覆盖此功能。

## 80.使用Zookeeper的分布式配置

Zookeeper提供了一个 [分层的名称空间](https://zookeeper.apache.org/doc/current/zookeeperOver.html#sc_dataModelNameSpace) ，该[名称空间](https://zookeeper.apache.org/doc/current/zookeeperOver.html#sc_dataModelNameSpace)使客户端可以存储任意数据，例如配置数据。Spring Cloud Zookeeper Config是[Config Server和Client](https://github.com/spring-cloud/spring-cloud-config)的替代方法 。在特殊的“ 引导 ” 阶段将配置加载到Spring环境中。默认情况下，配置存储在`/config`名称空间中。根据应用程序名称和活动配置文件创建多个`PropertySource`实例，以模拟解析属性的Spring Cloud Config顺序。例如，名称为`testApp`且配置文件为`dev`的应用程序为其创建了以下属性源：

- `config/testApp,dev`
- `config/testApp`
- `config/application,dev`
- `config/application`

最具体的属性来源在顶部，最不具体的属性在底部。`config/application`名称空间中的Properties适用于所有使用zookeeper进行配置的应用程序。`config/testApp`名称空间中的Properties仅可用于名为`testApp`的服务的实例。

当前在启动应用程序时读取配置。向`/refresh`发送HTTP `POST`请求会导致重新加载配置。当前未实现监视配置名称空间（Zookeeper支持）。

## 80.1激活

包括对`org.springframework.cloud:spring-cloud-starter-zookeeper-config`的依赖项将启用设置Spring Cloud Zookeeper Config的自动配置。

| ![[警告]](/assets/images/springcloud/caution.png)                                  | 警告 |
| ------------------------------------------------------------ | ---- |
| 当使用Zookeeper的3.4版本时，您需要按[此处](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-zookeeper-install)所述更改包含依赖项的方式。 |      |

## 80.2定制

Zookeeper Config可以通过设置以下属性来自定义：

**bootstrap.yml。** 

```
spring:
  cloud:
    zookeeper:
      config:
        enabled: true
        root: configuration
        defaultContext: apps
        profileSeparator: '::'
```



- `enabled`：将此值设置为`false`会禁用Zookeeper Config。
- `root`：设置配置值的基本名称空间。
- `defaultContext`：设置所有应用程序使用的名称。
- `profileSeparator`：设置分隔符的值，该分隔符用于在带有配置文件的属性源中分隔配置文件名称。

## 80.3访问控制列表（ACL）

您可以通过调用`CuratorFramework` bean的`addAuthInfo`方法来添加Zookeeper ACL的身份验证信息。实现此目的的一种方法是提供自己的`CuratorFramework` bean，如以下示例所示：

```
@BoostrapConfiguration
public class CustomCuratorFrameworkConfig {

  @Bean
  public CuratorFramework curatorFramework() {
    CuratorFramework curator = new CuratorFramework();
    curator.addAuthInfo("digest", "user:password".getBytes());
    return curator;
  }

}
```

请查阅 [ZookeeperAutoConfiguration类，](https://github.com/spring-cloud/spring-cloud-zookeeper/blob/master/spring-cloud-zookeeper-core/src/main/java/org/springframework/cloud/zookeeper/ZookeeperAutoConfiguration.java) 以了解`CuratorFramework` bean的默认配置。

另外，您可以从依赖现有`CuratorFramework` bean的类中添加凭据，如以下示例所示：

```
@BoostrapConfiguration
public class DefaultCuratorFrameworkConfig {

  public ZookeeperConfig(CuratorFramework curator) {
    curator.addAuthInfo("digest", "user:password".getBytes());
  }

}
```

bean的创建必须在升压阶段进行。您可以注册配置类以在此阶段运行，方法是使用`@BootstrapConfiguration`进行注释，并将它们包含在以逗号分隔的列表中，该列表设置为`resources/META-INF/spring.factories`文件中`org.springframework.cloud.bootstrap.BootstrapConfiguration`属性的值，如图所示在以下示例中：

**资源/META-INF/spring.factories。** 

```
org.springframework.cloud.bootstrap.BootstrapConfiguration=\
my.project.CustomCuratorFrameworkConfig,\
my.project.DefaultCuratorFrameworkConfig
```
