---
layout: post
title: Spring Cloud part2 学习笔记
subtitle: Spring Cloud part2 学习笔记
categories: SpringCloud
tags: [SpringCloud]
banner:
  video: null             # Video banner source
  loop: true              # Video loop
  volume: 0               # Video volume (100% is 1.0)
  start_at: 0             # Video start time
  image: /assets/images/banners/spy5.jpg    # Image banner source
---

#  第十一部分。Spring Cloud Security

Spring Cloud Security提供了一组原语，用于以最小的代价构建安全的应用程序和服务。可以在外部（或中央）进行大量配置的声明性模型，通常可以通过中央身份管理服务来实现大型的，相互协作的远程组件系统。在Cloud Foundry之类的服务平台中使用它也非常容易。在Spring Boot和Spring Security OAuth2的基础上，我们可以快速创建实现通用模式（例如单点登录，令牌中继和令牌交换）的系统。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| Spring Cloud是根据非限制性Apache 2.0许可证发行的。如果您想为文档的这一部分做出贡献或发现错误，请在[github](https://github.com/spring-cloud/spring-cloud-security/tree/master/src/main/asciidoc)的项目中找到源代码和问题跟踪程序。 |

## 81.快速入门

## 81.1 OAuth2单点登录

这是一个具有HTTP Basic身份验证和单个用户帐户的Spring Cloud“ Hello World”应用程序：

**app.groovy。** 

```
@Grab('spring-boot-starter-security')
@Controller
class Application {

  @RequestMapping('/')
  String home() {
    'Hello World'
  }

}
```



您可以使用`spring run app.groovy`运行它，并在日志中查看密码（用户名是“ user”）。到目前为止，这只是Spring Boot应用的默认设置。

这是带有OAuth2 SSO的Spring Cloud应用：

**app.groovy。** 

```
@Controller
@EnableOAuth2Sso
class Application {

  @RequestMapping('/')
  String home() {
    'Hello World'
  }

}
```



指出不同？该应用程序实际上将与上一个应用程序完全相同，因为它尚不知道它是OAuth2凭证。

您可以很容易地在github中注册一个应用程序，因此，如果要在自己的域上使用生产应用程序，请尝试。如果您愿意在localhost：8080上进行测试，请在应用程序配置中设置以下属性：

**application.yml。** 

```
security:
  oauth2:
    client:
      clientId: bd1c0a783ccdd1c9b9e4
      clientSecret: 1a9030fbca47a5b2c28e92f19050bb77824b5ad1
      accessTokenUri: https://github.com/login/oauth/access_token
      userAuthorizationUri: https://github.com/login/oauth/authorize
      clientAuthenticationScheme: form
    resource:
      userInfoUri: https://api.github.com/user
      preferTokenInfo: false
```



运行上面的应用程序，它将重定向到github进行授权。如果您已经登录github，您甚至不会注意到它已通过身份验证。仅当您的应用程序在端口8080上运行时，这些凭据才有效。

要限制客户端获得访问令牌时要求的范围，可以设置`security.oauth2.client.scope`（逗号分隔或YAML中的数组）。默认情况下，作用域为空，并且由授权服务器决定默认值是什么，通常取决于它所拥有的客户端注册中的设置。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 上面的示例都是Groovy脚本。如果要用Java（或Groovy）编写相同的代码，则需要在类路径中添加Spring Security OAuth2（例如，在[此处](https://github.com/spring-cloud-samples/sso)查看 [示例](https://github.com/spring-cloud-samples/sso)）。 |

## 81.2 OAuth2受保护的资源

您想使用OAuth2令牌保护API资源吗？这是一个简单的示例（与上面的客户端配对）：

**app.groovy。** 

```
@Grab('spring-cloud-starter-security')
@RestController
@EnableResourceServer
class Application {

  @RequestMapping('/')
  def home() {
    [message: 'Hello World']
  }

}
```



和

**application.yml。** 

```
security:
  oauth2:
    resource:
      userInfoUri: https://api.github.com/user
      preferTokenInfo: false
```



## 82.更多细节

## 82.1单点登录

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 所有OAuth2 SSO和资源服务器功能已在版本1.3中移至Spring Boot。您可以在[Spring Boot用户指南中](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/)找到文档 。 |

## 82.2令牌中继

令牌中继是OAuth2使用者充当客户端并将传入令牌转发到传出资源请求的地方。使用者可以是纯客户端（如SSO应用程序）或资源服务器。

### Spring Cloud网关中的客户端令牌中继82.2.1

如果您的应用程序还具有 [Spring Cloud Gateway](https://cloud.spring.io/spring-cloud-static/current/single/spring-cloud.html#_spring_cloud_gateway)嵌入式反向代理，则可以要求它向下游转发OAuth2访问令牌到它正在代理的服务。因此，可以像下面这样简单地增强上面的SSO应用程序：

**App.java。** 

```
@Autowired
private TokenRelayGatewayFilterFactory filterFactory;

@Bean
public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
    return builder.routes()
            .route("resource", r -> r.path("/resource")
                    .filters(f -> f.filter(filterFactory.apply()))
                    .uri("http://localhost:9000"))
            .build();
}
```



或这个

**application.yaml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: resource
        uri: http://localhost:9000
        predicates:
        - Path=/resource
        filters:
        - TokenRelay=
```



它将（除了登录用户并获取令牌之外）将身份验证令牌传递到服务下游（在这种情况下为`/resource`）。

要为Spring Cloud网关启用此功能，请添加以下依赖项

- `org.springframework.boot:spring-boot-starter-oauth2-client`
- `org.springframework.cloud:spring-cloud-starter-security`

它是如何工作的？该 [滤波器](https://github.com/spring-cloud/spring-cloud-security/tree/master/src/main/java/org/springframework/cloud/security/oauth2/gateway/TokenRelayGatewayFilterFactory.java) 提取用于下游请求从当前认证的用户的访问令牌，并把它在请求报头。

有关完整的工作示例，请参见此[项目](https://github.com/spring-cloud-samples/sample-gateway-oauth2login)。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| `TokenRelayGatewayFilterFactory`使用的`ReactiveOAuth2AuthorizedClientService`的默认实现使用内存中的数据存储。如果需要更强大的解决方案，则需要提供自己的实现`ReactiveOAuth2AuthorizedClientService`。 |

### 82.2.2客户端令牌中继

如果您的应用是面向OAuth2客户端的用户（即已声明`@EnableOAuth2Sso`或`@EnableOAuth2Client`），则它的请求范围为Spring Boot中的`OAuth2ClientContext`。您可以从此上下文中创建自己的`OAuth2RestTemplate`，并自动装配`OAuth2ProtectedResourceDetails`，然后该上下文将始终向下游转发访问令牌，如果过期则自动刷新访问令牌。（这些是Spring安全和Spring Boot的功能。）

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 如果您使用`client_credentials`令牌，则Spring Boot（1.4.1）不会自动创建`OAuth2ProtectedResourceDetails`。在这种情况下，您需要创建自己的`ClientCredentialsResourceDetails`并使用`@ConfigurationProperties("security.oauth2.client")`对其进行配置。 |

### Zuul代理中的82.2.3客户令牌中继

如果您的应用程序还具有 [Spring云Zuul](https://cloud.spring.io/spring-cloud.html#netflix-zuul-reverse-proxy)嵌入式反向代理（使用`@EnableZuulProxy`），则可以要求它向下游转发OAuth2访问令牌到它正在代理的服务。因此，可以像下面这样简单地增强上面的SSO应用程序：

**app.groovy。** 

```
@Controller
@EnableOAuth2Sso
@EnableZuulProxy
class Application {

}
```



并且它将（除了登录用户并获取令牌之外）还将身份验证令牌传递到`/proxy/*`服务的下游。如果这些服务是通过`@EnableResourceServer`实现的，则它们将在正确的标头中获得有效的令牌。

它是如何工作的？`@EnableOAuth2Sso`注释会插入`spring-cloud-starter-security`（您可以在传统应用中手动完成此操作），并依次触发`ZuulFilter`的一些自动配置，该激活本身是因为Zuul位于类路径（通过`@EnableZuulProxy`）。该 [滤波器](https://github.com/spring-cloud/spring-cloud-security/tree/master/src/main/java/org/springframework/cloud/security/oauth2/proxy/OAuth2TokenRelayFilter.java) 只提取用于下游请求从当前认证的用户的访问令牌，并把它在请求报头。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| Spring Boot不会自动创建`refresh_token`所需的`OAuth2RestOperations`。在这种情况下，您需要创建自己的`OAuth2RestOperations`，以便`OAuth2TokenRelayFilter`可以根据需要刷新令牌。 |

### 82.2.4资源服务器令牌中继

如果您的应用具有`@EnableResourceServer`，则您可能希望将传入令牌下游中继到其他服务。如果您使用`RestTemplate`与下游服务联系，那么这只是如何在正确的上下文中创建模板的问题。

如果您的服务使用`UserInfoTokenServices`对传入令牌进行身份验证（即它使用的是`security.oauth2.user-info-uri`配置），那么您可以使用自动连接的`OAuth2ClientContext`简单地创建一个`OAuth2RestTemplate`（它将由身份验证填充）在到达后端代码之前进行处理）。等效地（对于Spring Boot 1.4），您可以注入`UserInfoRestTemplateFactory`，并在您的配置中获取其`OAuth2RestTemplate`。例如：

**MyConfiguration.java。** 

```
@Bean
public OAuth2RestTemplate restTemplate(UserInfoRestTemplateFactory factory) {
    return factory.getUserInfoRestTemplate();
}
```



然后，该其余模板将具有与身份验证过滤器使用的相同的`OAuth2ClientContext`（请求范围），因此您可以使用它来发送具有相同访问令牌的请求。

如果您的应用未使用`UserInfoTokenServices`，但仍是客户端（即它声明了`@EnableOAuth2Client`或`@EnableOAuth2Sso`），则使用Spring Security覆盖用户从{12创建的任何`OAuth2RestOperations` /} `OAuth2Context`也将转发令牌。默认情况下，此功能作为MVC处理程序拦截器实现，因此仅在Spring MVC中有效。如果您不使用MVC，则可以使用包装`AccessTokenContextRelay`的自定义过滤器或AOP拦截器来提供相同的功能。

这是一个基本示例，展示了如何使用在其他位置创建的自动连接的休息模板（“ foo.com”是接受与周围应用程序相同的令牌的资源服务器）：

**MyController.java。** 

```
@Autowired
private OAuth2RestOperations restTemplate;

@RequestMapping("/relay")
public String relay() {
    ResponseEntity<String> response =
      restTemplate.getForEntity("https://foo.com/bar", String.class);
    return "Success! (" + response.getBody() + ")";
}
```



如果您不希望转发令牌（这是一个有效的选择，因为您可能想扮演自己的角色，而不是发送令牌的客户端），那么您只需要创建自己的`OAuth2Context`自动装配默认值。

Feign客户端还将选择使用`OAuth2ClientContext`的拦截器（如果可用），因此它们还应在`RestTemplate`可以使用的任何地方进行令牌中继。

## 83.配置Zuul代理的下游身份验证

您可以通过`proxy.auth.*`设置来控制`@EnableZuulProxy`下游的授权行为。例：

**application.yml。** 

```
proxy:
  auth:
    routes:
      customers: oauth2
      stores: passthru
      recommendations: none
```



在此示例中，“客户”服务获得一个OAuth2令牌中继，“商店”服务获得一个传递（授权标头仅向下游传递），“推荐”服务将其授权标头删除。默认行为是在有令牌可用的情况下进行令牌中继，否则通过。

有关完整的详细信息，请参见 [ProxyAuthenticationProperties](https://github.com/spring-cloud/spring-cloud-security/tree/master/src/main/java/org/springframework/cloud/security/oauth2/proxy/ProxyAuthenticationProperties)。

# 第十二部分。Spring Cloud for Cloud Foundry

使用Cloudfoundry的Spring Cloud，可以轻松在[Cloud Foundry](https://github.com/cloudfoundry)（平台即服务）中运行 [Spring Cloud](https://github.com/spring-cloud)应用 。Cloud Foundry具有“服务”的概念，这是您“绑定”到应用程序的中间软件，本质上为它提供了一个包含凭证的环境变量（例如，用于服务的位置和用户名）。

`spring-cloud-cloudfoundry-commons`模块配置基于Reactor的Cloud Foundry Java客户端v 3.0，并且可以独立使用。

`spring-cloud-cloudfoundry-web`项目为Cloud Foundry中的Web应用程序的某些增强功能提供了基本支持：自动绑定到单点登录服务，并可以选择启用粘性路由进行发现。

`spring-cloud-cloudfoundry-discovery`项目提供了Spring Cloud Commons `DiscoveryClient`的实现，因此您可以`@EnableDiscoveryClient`并以`spring.cloud.cloudfoundry.discovery.[username,password]`的身份提供凭据（如果您没有连接到Pivotal Web服务），然后您可以直接或通过`LoadBalancerClient`使用`DiscoveryClient`。[Pivotal Web服务](https://run.pivotal.io/)），然后您可以直接或通过`LoadBalancerClient`使用`DiscoveryClient`。

首次使用它时，发现客户端可能会变慢，原因是它必须从Cloud Foundry获取访问令牌。

## 84.发现

这是一个具有Cloud Foundry发现功能的Spring Cloud应用：

**app.groovy。** 

```
@Grab('org.springframework.cloud:spring-cloud-cloudfoundry')
@RestController
@EnableDiscoveryClient
class Application {

  @Autowired
  DiscoveryClient client

  @RequestMapping('/')
  String home() {
    'Hello from ' + client.getLocalServiceInstance()
  }

}
```



如果运行时没有任何服务绑定：

```
$ spring jar app.jar app.groovy
$ cf push -p app.jar
```

它将在首页中显示其应用名称。

`DiscoveryClient`可以根据进行身份验证的凭据列出一个空间中的所有应用程序，其中该空间默认为客户端正在其中运行的应用程序（如果有）。如果未配置org和space，则根据Cloud Foundry中用户的配置文件默认设置。

## 85.单点登录

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 所有OAuth2 SSO和资源服务器功能已在版本1.3中移至Spring Boot。您可以在[Spring Boot用户指南中](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/)找到文档 。 |

该项目提供了从CloudFoundry服务凭据到Spring Boot功能的自动绑定。例如，如果您有一个名为“ sso”的CloudFoundry服务，其凭证包含“ client_id”，“ client_secret”和“ auth_domain”，它将自动绑定到您通过{9启用的Spring OAuth2客户端/}（来自Spring Boot）。可以使用`spring.oauth2.sso.serviceId`来参数化服务的名称。

# 第十三部分。Spring Cloud Contract

*文档作者：Adam Dudczak，MathiasDüsterhöft，Marcin Grzejszczak，Dennis Kieselhorst，JakubKubryński，Karol Lassak，Olga Maciaszek-Sharma，MariuszSmykuła，Dave Syer，Jay Bryant*

Greenwich SR5

## 86. Spring Cloud Contract

在将新功能推到分布式系统中的新应用程序或服务时，您需要信心。该项目为Spring应用程序中的消费者驱动Contracts和服务模式提供支持（用于HTTP和基于消息的交互），涵盖了编写测试，将其作为资产发布以及声明合同的一系列选项。由生产者和消费者保存。

## 87. Spring Cloud Contract验证程序简介

Spring Cloud Contract Verifier支持基于JVM的应用程序的消费者驱动合同（CDC）开发。它将TDD移至软件体系结构级别。

Spring Cloud Contract验证程序随附*合同定义语言*（CDL）。合同定义用于产生以下资源：

- 在客户端代码上进行集成测试（*客户端测试*）时，WireMock将使用JSON存根定义。测试代码仍然必须是手工编写的，并且测试数据由Spring Cloud Contract Verifier产生。
- 消息传递路由（如果您正在使用消息传递服务）。我们与Spring Integration，Spring Cloud Stream，Spring AMQP和Apache Camel集成。您还可以设置自己的集成。
- 验收测试（在JUnit 4，JUnit 5或Spock中）用于验证API的服务器端实现是否符合合同（*服务器测试*）。Spring Cloud Contract验证程序将生成完整的测试。

## 87.1历史

在成为Spring Cloud Contract之前，此项目称为[Accurest](https://github.com/Codearte/accurest)。它是由 （[Codearte）的](https://github.com/Codearte)[Marcin Grzejszczak](https://twitter.com/mgrzejszczak)和[Jakub Kubrynski](https://twitter.com/jkubrynski)创建的。

`0.1.0`版本于2015年1月26日发布，并随着`1.0.0`版本于2016年2月29日发布而变得稳定。

## 87.2为什么要使用合同验证者？

假设我们有一个包含多个微服务的系统：

![微服务架构](/assets/images/springcloud/Deps.png?lastModify=1665880539)

### 87.2.1测试问题

如果我们想在左上角测试该应用程序以确定它是否可以与其他服务通信，则可以执行以下两项操作之一：

- 部署所有微服务并执行端到端测试。
- 在单元/集成测试中模拟其他微服务。

两者都有优点，也有很多缺点。

**部署所有微服务并执行端到端测试**

好处：

- 模拟生产。
- 测试服务之间的真实通信。

缺点：

- 要测试一个微服务，我们必须部署6个微服务，几个数据库等。
- 测试运行的环境被锁定为单个测试套件（在此期间，其他任何人都无法运行测试）。
- 他们需要很长时间才能运行。
- 反馈在此过程中非常晚。
- 他们很难调试。

**在单元/集成测试中模拟其他微服务**

好处：

- 他们提供了非常快速的反馈。
- 他们没有基础架构要求。

缺点：

- 服务的实现者创建的存根可能与现实无关。
- 您可以通过测试并通过失败的生产。

为了解决上述问题，创建了带有Stub Runner的Spring Cloud Contract验证程序。主要思想是为您提供非常快速的反馈，而无需建立整个微服务世界。如果您使用存根，则仅需要应用程序直接使用的应用程序。

![存根服务](/assets/images/springcloud/Stubs2.png?lastModify=1665880539)

Spring Cloud Contract验证程序可确保您使用的存根是由您正在调用的服务创建的。另外，如果可以使用它们，则表示它们已经在生产者方面进行了测试。简而言之，您可以信任这些存根。

## 87.3目的

Spring Cloud Contract Verifier Stub Runner的主要目的是：

- 为了确保WireMock / Messaging存根（在开发客户端时使用）完全执行实际的服务器端实现。
- 推广ATDD方法和微服务架构风格。
- 提供一种发布合同更改的方法，该更改在双方立即可见。
- 生成要在服务器端使用的样板测试代码。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| Spring Cloud Contract验证程序的目的不是开始在合同中编写业务功能。假设我们有一个欺诈检查的业务用例。如果某个用户可能出于100种不同的原因而成为欺诈行为，那么我们假设您将创建2个合同，一个用于肯定案件，一个用于否定案件。合同测试用于测试应用程序之间的合同，而不是模拟完整的行为。 |      |

## 87.4工作原理

本节探讨Spring Cloud Contract带有Stub Runner的验证程序的工作原理。

### 87.4.1三秒游

这个非常简短的导览使用Spring Cloud Contract来完成：

- [名为“在生产者端”的部分](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-contract-verifier-intro-three-second-tour-producer)
- [“消费者方面”一节](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-contract-verifier-intro-three-second-tour-consumer)

您可以[在这里](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-contract-verifier-intro-three-minute-tour)找到更长的行程 。

#### 在生产者方面

要开始使用Spring Cloud Contract，请将具有`REST/`消息合同（以Groovy DSL或YAML表示）的文件添加到由`contractsDslDir`属性设置的合同目录中。默认情况下为`$rootDir/src/test/resources/contracts`。

然后将Spring Cloud Contract Verifier依赖项和插件添加到您的构建文件中，如以下示例所示：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-contract-verifier</artifactId>
    <scope>test</scope>
</dependency>
```

以下清单显示了如何添加插件，该插件应放在文件的build / plugins部分中：

```
<plugin>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-contract-maven-plugin</artifactId>
    <version>${spring-cloud-contract.version}</version>
    <extensions>true</extensions>
</plugin>
```

运行`./mvnw clean install`会自动生成测试，以验证应用程序是否符合添加的合同。默认情况下，测试在`org.springframework.cloud.contract.verifier.tests.`下生成。

由于尚不存在合同描述的功能的实现，因此测试失败。

要使它们通过，您必须添加处理HTTP请求或消息的正确实现。另外，您必须为自动生成的测试添加正确的基础测试类。该类由所有自动生成的测试扩展，并且应包含运行它们所需的所有设置（例如`RestAssuredMockMvc`控制器设置或消息传递测试设置）。

一旦实现和测试基类就位，测试就会通过，并且将应用程序和存根构件都构建并安装在本地Maven存储库中。现在可以合并更改，并且可以在在线存储库中发布应用程序和存根工件。

#### 在消费者方面

`Spring Cloud Contract Stub Runner`可以用于集成测试中，以获取模拟实际服务的运行中WireMock实例或消息传递路由。

为此，请将依赖项添加到`Spring Cloud Contract Stub Runner`中，如以下示例所示：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-contract-stub-runner</artifactId>
    <scope>test</scope>
</dependency>
```

您可以通过以下两种方式之一在Maven存储库中安装生产者端存根：

- 通过检出生产者端存储库并添加合同并通过运行以下命令来生成存根：

  ```
  $ cd local-http-server-repo
  $ ./mvnw clean install -DskipTests
  ```

  | ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
  | ------------------------------------------------------------ |
  | 由于生产者方合同实施尚未到位，因此跳过了测试，因此自动生成的合同测试失败。 |

- 通过从远程存储库获取已经存在的生产者服务存根。为此，请将存根工件ID和工件存储库URL作为`Spring Cloud Contract Stub Runner`属性传递，如以下示例所示：

  ```
  stubrunner:
    ids: 'com.example:http-server-dsl:+:stubs:8080'
    repositoryRoot: https://repo.spring.io/libs-snapshot
  ```

现在，您可以使用`@AutoConfigureStubRunner`注释测试类。在注释中，为`Spring Cloud Contract Stub Runner`提供`group-id`和`artifact-id`值，以为您运行协作者的存根，如以下示例所示：

```
@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment=WebEnvironment.NONE)
@AutoConfigureStubRunner(ids = {"com.example:http-server-dsl:+:stubs:6565"},
        stubsMode = StubRunnerProperties.StubsMode.LOCAL)
public class LoanApplicationServiceTests {
```

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 从在线存储库下载存根时，请使用`REMOTE` `stubsMode`，而对于脱机工作，请使用`LOCAL`。 |

现在，在集成测试中，您可以接收预期由协作服务发出的HTTP响应或消息的存根版本。

### 87.4.2三分钟游

此简短的导览使用Spring Cloud Contract来完成：

- [名为“在生产者端”的部分](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-contract-verifier-intro-three-minute-tour-producer)
- [“消费者方面”一节](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-contract-verifier-intro-three-minute-tour-consumer)

您可以[在这里](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-contract-verifier-intro-three-second-tour)找到更简短的导览 。

#### 在生产者方面

要开始使用`Spring Cloud Contract`，请将具有`REST/`消息传递合同（以Groovy DSL或YAML表示）的文件添加到由`contractsDslDir`属性设置的合同目录中。默认情况下，它是`$rootDir/src/test/resources/contracts`。

对于HTTP存根，合同定义了应针对给定请求返回的响应类型（考虑到HTTP方法，URL，标头，状态码等）。以下示例显示了Groovy DSL中的HTTP存根如何收缩：

```
package contracts

org.springframework.cloud.contract.spec.Contract.make {
	request {
		method 'PUT'
		url '/fraudcheck'
		body([
			   "client.id": $(regex('[0-9]{10}')),
			   loanAmount: 99999
		])
		headers {
			contentType('application/json')
		}
	}
	response {
		status OK()
		body([
			   fraudCheckStatus: "FRAUD",
			   "rejection.reason": "Amount too high"
		])
		headers {
			contentType('application/json')
		}
	}
}
```

YAML中表示的同一合同应类似于以下示例：

```
request:
  method: PUT
  url: /fraudcheck
  body:
    "client.id": 1234567890
    loanAmount: 99999
  headers:
    Content-Type: application/json
  matchers:
    body:
      - path: $.['client.id']
        type: by_regex
        value: "[0-9]{10}"
response:
  status: 200
  body:
    fraudCheckStatus: "FRAUD"
    "rejection.reason": "Amount too high"
  headers:
    Content-Type: application/json;charset=UTF-8
```

对于消息传递，可以定义：

- 可以定义输入和输出消息（考虑发送消息的位置和位置，消息正文和标头）。
- 收到消息后应调用的方法。
- 调用时应触发消息的方法。

以下示例显示了以Groovy DSL表示的骆驼消息传递协定：

```
            def contractDsl = Contract.make {
                label 'some_label'
                input {
                    messageFrom('jms:delete')
                    messageBody([
                            bookName: 'foo'
                    ])
                    messageHeaders {
                        header('sample', 'header')
                    }
                    assertThat('bookWasDeleted()')
                }
            }
```

以下示例显示了用YAML表示的同一合同：

```
label: some_label
input:
  messageFrom: jms:delete
  messageBody:
    bookName: 'foo'
  messageHeaders:
    sample: header
  assertThat: bookWasDeleted()
```

然后，您可以将Spring Cloud Contract Verifier依赖项和插件添加到您的构建文件中，如以下示例所示：

```
<dependency>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-starter-contract-verifier</artifactId>
	<scope>test</scope>
</dependency>
```

以下清单显示了如何添加插件，该插件应放在文件的build / plugins部分中：

```
<plugin>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-contract-maven-plugin</artifactId>
	<version>${spring-cloud-contract.version}</version>
	<extensions>true</extensions>
</plugin>
```

运行`./mvnw clean install`会自动生成测试，以验证应用程序是否符合添加的合同。默认情况下，生成的测试在`org.springframework.cloud.contract.verifier.tests.`下。

以下示例显示了自动生成的HTTP合同测试示例：

```
@Test
public void validate_shouldMarkClientAsFraud() throws Exception {
    // given:
        MockMvcRequestSpecification request = given()
                .header("Content-Type", "application/vnd.fraud.v1+json")
                .body("{\"client.id\":\"1234567890\",\"loanAmount\":99999}");

    // when:
        ResponseOptions response = given().spec(request)
                .put("/fraudcheck");

    // then:
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.header("Content-Type")).matches("application/vnd.fraud.v1.json.*");
    // and:
        DocumentContext parsedJson = JsonPath.parse(response.getBody().asString());
        assertThatJson(parsedJson).field("['fraudCheckStatus']").matches("[A-Z]{5}");
        assertThatJson(parsedJson).field("['rejection.reason']").isEqualTo("Amount too high");
}
```

前面的示例使用Spring的`MockMvc`运行测试。这是HTTP合同的默认测试模式。但是，也可以使用JAX-RS客户端和显式HTTP调用。（为此，请将插件的`testMode`属性分别更改为`JAX-RS`或`EXPLICIT`。）

从2.1.0版开始，也可以使用`RestAssuredWebTestClient`with Spring’s reactive `WebTestClient`在后台运行。在使用基于`Web-Flux`的响应式应用程序时，特别推荐使用此方法。为了使用`WebTestClient`，请将`testMode`设置为`WEBTESTCLIENT`。

这是在`WEBTESTCLIENT`测试模式下生成的测试的示例：

```
[source,java,indent=0]
@Test
	public void validate_shouldRejectABeerIfTooYoung() throws Exception {
		// given:
			WebTestClientRequestSpecification request = given()
					.header("Content-Type", "application/json")
					.body("{\"age\":10}");

		// when:
			WebTestClientResponse response = given().spec(request)
					.post("/check");

		// then:
			assertThat(response.statusCode()).isEqualTo(200);
			assertThat(response.header("Content-Type")).matches("application/json.*");
		// and:
			DocumentContext parsedJson = JsonPath.parse(response.getBody().asString());
			assertThatJson(parsedJson).field("['status']").isEqualTo("NOT_OK");
	}
```

除了默认的JUnit 4，您可以通过将插件的`testFramework`属性设置为`JUNIT5`或`Spock`来使用JUnit 5或Spock测试。

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 现在，您还可以基于合同生成WireMock方案，方法是在合同文件名的开头添加订单号，后跟下划线。 |

以下示例显示了在Spock中为消息存根合约自动生成的测试：

```
[source,groovy,indent=0]
given:
	 ContractVerifierMessage inputMessage = contractVerifierMessaging.create(
		\'\'\'{"bookName":"foo"}\'\'\',
		['sample': 'header']
	)

when:
	 contractVerifierMessaging.send(inputMessage, 'jms:delete')

then:
	 noExceptionThrown()
	 bookWasDeleted()
```

由于尚不存在合同描述的功能的实现，因此测试失败。

要使它们通过，您必须添加处理HTTP请求或消息的正确实现。另外，您必须为自动生成的测试添加正确的基础测试类。该类由所有自动生成的测试扩展，并且应包含运行它们所需的所有设置（例如，`RestAssuredMockMvc`控制器设置或消息传递测试设置）。

一旦实现和测试基类就位，测试就会通过，并且将应用程序和存根构件都构建并安装在本地Maven存储库中。有关将存根jar安装到本地存储库的信息显示在日志中，如以下示例所示：

```
[INFO] --- spring-cloud-contract-maven-plugin:1.0.0.BUILD-SNAPSHOT:generateStubs (default-generateStubs) @ http-server ---
[INFO] Building jar: /some/path/http-server/target/http-server-0.0.1-SNAPSHOT-stubs.jar
[INFO]
[INFO] --- maven-jar-plugin:2.6:jar (default-jar) @ http-server ---
[INFO] Building jar: /some/path/http-server/target/http-server-0.0.1-SNAPSHOT.jar
[INFO]
[INFO] --- spring-boot-maven-plugin:1.5.5.BUILD-SNAPSHOT:repackage (default) @ http-server ---
[INFO]
[INFO] --- maven-install-plugin:2.5.2:install (default-install) @ http-server ---
[INFO] Installing /some/path/http-server/target/http-server-0.0.1-SNAPSHOT.jar to /path/to/your/.m2/repository/com/example/http-server/0.0.1-SNAPSHOT/http-server-0.0.1-SNAPSHOT.jar
[INFO] Installing /some/path/http-server/pom.xml to /path/to/your/.m2/repository/com/example/http-server/0.0.1-SNAPSHOT/http-server-0.0.1-SNAPSHOT.pom
[INFO] Installing /some/path/http-server/target/http-server-0.0.1-SNAPSHOT-stubs.jar to /path/to/your/.m2/repository/com/example/http-server/0.0.1-SNAPSHOT/http-server-0.0.1-SNAPSHOT-stubs.jar
```

现在，您可以合并更改，并在在线存储库中发布应用程序和存根工件。

**Docker项目**

为了在使用非JVM技术创建应用程序时启用合同，已经创建了`springcloud/spring-cloud-contract` Docker映像。它包含一个项目，该项目会自动为HTTP合同生成测试并以`EXPLICIT`测试模式执行它们。然后，如果测试通过，它将生成Wiremock存根并将其发布到工件管理器（可选）。为了使用该映像，您可以将合同挂载到`/contracts`目录中并设置一些环境变量。

#### 在消费者方面

`Spring Cloud Contract Stub Runner`可用于集成测试中，以获取模拟实际服务的正在运行的WireMock实例或消息传递路由。

首先，将依赖项添加到`Spring Cloud Contract Stub Runner`：

```
<dependency>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-starter-contract-stub-runner</artifactId>
	<scope>test</scope>
</dependency>
```

您可以通过以下两种方式之一在Maven存储库中安装生产者端存根：

- 通过检出生产者端存储库并添加合同并通过运行以下命令来生成存根：

  ```
  $ cd local-http-server-repo
  $ ./mvnw clean install -DskipTests
  ```

  | ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
  | ------------------------------------------------------------ |
  | 由于生产者方合同实施尚未到位，因此跳过了测试，因此自动生成的合同测试失败。 |

- 从远程存储库获取已经存在的生产者服务存根。为此，请将存根工件标识和工件存储库UR1作为`Spring Cloud Contract Stub Runner`属性传递，如以下示例所示：

  ```
  stubrunner:
    ids: 'com.example:http-server-dsl:+:stubs:8080'
    repositoryRoot: https://repo.spring.io/libs-snapshot
  ```

现在，您可以使用`@AutoConfigureStubRunner`注释测试类。在注释中，为`Spring Cloud Contract Stub Runner`提供`group-id`和`artifact-id`以便为您运行协作者的存根，如以下示例所示：

```
@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment=WebEnvironment.NONE)
@AutoConfigureStubRunner(ids = {"com.example:http-server-dsl:+:stubs:6565"},
        stubsMode = StubRunnerProperties.StubsMode.LOCAL)
public class LoanApplicationServiceTests {
```

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 从在线存储库下载存根时，请使用`REMOTE` `stubsMode`，而对于脱机工作，请使用`LOCAL`。 |

在集成测试中，您可以接收HTTP响应的残存版本或预期由协作服务发出的消息。您可以在构建日志中看到类似于以下内容的条目：

```
2016-07-19 14:22:25.403  INFO 41050 --- [           main] o.s.c.c.stubrunner.AetherStubDownloader  : Desired version is + - will try to resolve the latest version
2016-07-19 14:22:25.438  INFO 41050 --- [           main] o.s.c.c.stubrunner.AetherStubDownloader  : Resolved version is 0.0.1-SNAPSHOT
2016-07-19 14:22:25.439  INFO 41050 --- [           main] o.s.c.c.stubrunner.AetherStubDownloader  : Resolving artifact com.example:http-server:jar:stubs:0.0.1-SNAPSHOT using remote repositories []
2016-07-19 14:22:25.451  INFO 41050 --- [           main] o.s.c.c.stubrunner.AetherStubDownloader  : Resolved artifact com.example:http-server:jar:stubs:0.0.1-SNAPSHOT to /path/to/your/.m2/repository/com/example/http-server/0.0.1-SNAPSHOT/http-server-0.0.1-SNAPSHOT-stubs.jar
2016-07-19 14:22:25.465  INFO 41050 --- [           main] o.s.c.c.stubrunner.AetherStubDownloader  : Unpacking stub from JAR [URI: file:/path/to/your/.m2/repository/com/example/http-server/0.0.1-SNAPSHOT/http-server-0.0.1-SNAPSHOT-stubs.jar]
2016-07-19 14:22:25.475  INFO 41050 --- [           main] o.s.c.c.stubrunner.AetherStubDownloader  : Unpacked file to [/var/folders/0p/xwq47sq106x1_g3dtv6qfm940000gq/T/contracts100276532569594265]
2016-07-19 14:22:27.737  INFO 41050 --- [           main] o.s.c.c.stubrunner.StubRunnerExecutor    : All stubs are now running RunningStubs [namesAndPorts={com.example:http-server:0.0.1-SNAPSHOT:stubs=8080}]
```

### 87.4.3定义合同

作为服务的使用者，我们需要定义要实现的目标。我们需要制定我们的期望。这就是为什么我们签订合同的原因。

假设您要发送一个包含客户公司ID以及它要向我们借款的金额的请求。您还希望通过PUT方法将其发送到/ fraudcheck URL。

**Groovy DSL。** 

```
/*
 * Copyright 2013-2019 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package contracts

org.springframework.cloud.contract.spec.Contract.make {
    request { // (1)
        method 'PUT' // (2)
        url '/fraudcheck' // (3)
        body([ // (4)
               "client.id": $(regex('[0-9]{10}')),
               loanAmount : 99999
        ])
        headers { // (5)
            contentType('application/json')
        }
    }
    response { // (6)
        status OK() // (7)
        body([ // (8)
               fraudCheckStatus  : "FRAUD",
               "rejection.reason": "Amount too high"
        ])
        headers { // (9)
            contentType('application/json')
        }
    }
}

/*
From the Consumer perspective, when shooting a request in the integration test:

(1) - If the consumer sends a request
(2) - With the "PUT" method
(3) - to the URL "/fraudcheck"
(4) - with the JSON body that
 * has a field `client.id` that matches a regular expression `[0-9]{10}`
 * has a field `loanAmount` that is equal to `99999`
(5) - with header `Content-Type` equal to `application/json`
(6) - then the response will be sent with
(7) - status equal `200`
(8) - and JSON body equal to
 { "fraudCheckStatus": "FRAUD", "rejectionReason": "Amount too high" }
(9) - with header `Content-Type` equal to `application/json`

From the Producer perspective, in the autogenerated producer-side test:

(1) - A request will be sent to the producer
(2) - With the "PUT" method
(3) - to the URL "/fraudcheck"
(4) - with the JSON body that
 * has a field `client.id` that will have a generated value that matches a regular expression `[0-9]{10}`
 * has a field `loanAmount` that is equal to `99999`
(5) - with header `Content-Type` equal to `application/json`
(6) - then the test will assert if the response has been sent with
(7) - status equal `200`
(8) - and JSON body equal to
 { "fraudCheckStatus": "FRAUD", "rejectionReason": "Amount too high" }
(9) - with header `Content-Type` matching `application/json.*`
 */
```



**YAML。** 

```
request: # (1)
  method: PUT # (2)
  url: /fraudcheck # (3)
  body: # (4)
    "client.id": 1234567890
    loanAmount: 99999
  headers: # (5)
    Content-Type: application/json
  matchers:
    body:
      - path: $.['client.id'] # (6)
        type: by_regex
        value: "[0-9]{10}"
response: # (7)
  status: 200 # (8)
  body:  # (9)
    fraudCheckStatus: "FRAUD"
    "rejection.reason": "Amount too high"
  headers: # (10)
    Content-Type: application/json;charset=UTF-8


#From the Consumer perspective, when shooting a request in the integration test:
#
#(1) - If the consumer sends a request
#(2) - With the "PUT" method
#(3) - to the URL "/fraudcheck"
#(4) - with the JSON body that
# * has a field `client.id`
# * has a field `loanAmount` that is equal to `99999`
#(5) - with header `Content-Type` equal to `application/json`
#(6) - and a `client.id` json entry matches the regular expression `[0-9]{10}`
#(7) - then the response will be sent with
#(8) - status equal `200`
#(9) - and JSON body equal to
# { "fraudCheckStatus": "FRAUD", "rejectionReason": "Amount too high" }
#(10) - with header `Content-Type` equal to `application/json`
#
#From the Producer perspective, in the autogenerated producer-side test:
#
#(1) - A request will be sent to the producer
#(2) - With the "PUT" method
#(3) - to the URL "/fraudcheck"
#(4) - with the JSON body that
# * has a field `client.id` `1234567890`
# * has a field `loanAmount` that is equal to `99999`
#(5) - with header `Content-Type` equal to `application/json`
#(7) - then the test will assert if the response has been sent with
#(8) - status equal `200`
#(9) - and JSON body equal to
# { "fraudCheckStatus": "FRAUD", "rejectionReason": "Amount too high" }
#(10) - with header `Content-Type` equal to `application/json;charset=UTF-8`
```



### 87.4.4客户端

Spring Cloud Contract生成存根，可在客户端测试期间使用。您将获得一个正在运行的WireMock实例/消息传递路由，以模拟该服务。您想使用适当的存根定义来提供该实例。

在某个时间点，您需要向欺诈检测服务发送请求。

```
ResponseEntity<FraudServiceResponse> response = restTemplate.exchange(
		"http://localhost:" + port + "/fraudcheck", HttpMethod.PUT,
		new HttpEntity<>(request, httpHeaders), FraudServiceResponse.class);
```

用`@AutoConfigureStubRunner`注释测试类。在批注中，提供Stub Runner的组ID和工件ID，以下载协作者的存根。

```
@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = WebEnvironment.NONE)
@AutoConfigureStubRunner(ids = {
		"com.example:http-server-dsl:+:stubs:6565" }, stubsMode = StubRunnerProperties.StubsMode.LOCAL)
public class LoanApplicationServiceTests {
```

之后，在测试期间，Spring Cloud Contract在Maven存储库中自动找到存根（模拟真实服务），并将其暴露在已配置（或随机）的端口上。

### 87.4.5服务器端

由于您正在开发存根，因此需要确保它实际上类似于您的具体实现。您不能存在存根以一种方式运行而应用程序以不同方式运行的情况，尤其是在生产环境中。

为了确保您的应用程序符合您在存根中定义的方式，将从提供的存根中生成测试。

自动生成的测试或多或少看起来像这样：

```
@Test
public void validate_shouldMarkClientAsFraud() throws Exception {
    // given:
        MockMvcRequestSpecification request = given()
                .header("Content-Type", "application/vnd.fraud.v1+json")
                .body("{\"client.id\":\"1234567890\",\"loanAmount\":99999}");

    // when:
        ResponseOptions response = given().spec(request)
                .put("/fraudcheck");

    // then:
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.header("Content-Type")).matches("application/vnd.fraud.v1.json.*");
    // and:
        DocumentContext parsedJson = JsonPath.parse(response.getBody().asString());
        assertThatJson(parsedJson).field("['fraudCheckStatus']").matches("[A-Z]{5}");
        assertThatJson(parsedJson).field("['rejection.reason']").isEqualTo("Amount too high");
}
```

## 87.5消费者驱动Contracts（CDC）循序渐进指南

考虑欺诈检测和贷款发行过程的示例。业务场景是这样的，我们希望向人们发放贷款，但又不想他们从我们那里窃取资金。我们系统的当前实施情况向所有人提供贷款。

假设`Loan Issuance`是`Fraud Detection`服务器的客户端。在当前的Sprint中，我们必须开发一个新功能：如果客户想要借太多钱，那么我们会将客户标记为欺诈。

技术说明-欺诈检测的`artifact-id`为`http-server`，而贷款发行的人工ID为`http-client`，两者的`group-id`为`com.example`。

社交评论-客户和服务器开发团队都需要在整个过程中直接沟通并讨论更改。CDC完全是关于沟通的。

在[服务器端代码可以在这里](https://github.com/spring-cloud/spring-cloud-contract/tree/2.1.x/samples/standalone/dsl/http-server)和[这里的客户端代码](https://github.com/spring-cloud/spring-cloud-contract/tree/2.1.x/samples/standalone/dsl/http-client)。

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 在这种情况下，生产者拥有合同。实际上，所有合同都在生产者的资料库中。 |

### 87.5.1技术说明

如果使用**SNAPSHOT** / **Milestone** / **Release Candidate**版本，请在您的版本中添加以下部分：

**Maven.** 

```
<repositories>
    <repository>
        <id>spring-snapshots</id>
        <name>Spring Snapshots</name>
        <url>https://repo.spring.io/snapshot</url>
        <snapshots>
            <enabled>true</enabled>
        </snapshots>
    </repository>
    <repository>
        <id>spring-milestones</id>
        <name>Spring Milestones</name>
        <url>https://repo.spring.io/milestone</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </repository>
    <repository>
        <id>spring-releases</id>
        <name>Spring Releases</name>
        <url>https://repo.spring.io/release</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </repository>
</repositories>
<pluginRepositories>
    <pluginRepository>
        <id>spring-snapshots</id>
        <name>Spring Snapshots</name>
        <url>https://repo.spring.io/snapshot</url>
        <snapshots>
            <enabled>true</enabled>
        </snapshots>
    </pluginRepository>
    <pluginRepository>
        <id>spring-milestones</id>
        <name>Spring Milestones</name>
        <url>https://repo.spring.io/milestone</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </pluginRepository>
    <pluginRepository>
        <id>spring-releases</id>
        <name>Spring Releases</name>
        <url>https://repo.spring.io/release</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </pluginRepository>
</pluginRepositories>
```



**Gradle.** 

```
repositories {
    mavenCentral()
    mavenLocal()
    maven { url "https://repo.spring.io/snapshot" }
    maven { url "https://repo.spring.io/milestone" }
    maven { url "https://repo.spring.io/release" }
}
```



### 87.5.2消费者方（发放贷款）

作为贷款发行服务的开发人员（欺诈检测服务器的使用者），您可以执行以下步骤：

1. 通过为您的功能编写测试来开始进行TDD。
2. 编写缺少的实现。
3. 在本地克隆欺诈检测服务存储库。
4. 在欺诈检测服务的仓库中本地定义合同。
5. 添加Spring Cloud Contract验证程序插件。
6. 运行集成测试。
7. 提出拉取请求。
8. 创建一个初始实现。
9. 接管请求请求。
10. 编写缺少的实现。
11. 部署您的应用程序。
12. 在线工作。

**通过为您的功能编写测试来开始进行TDD。**

```
@Test
public void shouldBeRejectedDueToAbnormalLoanAmount() {
    // given:
    LoanApplication application = new LoanApplication(new Client("1234567890"),
            99999);
    // when:
    LoanApplicationResult loanApplication = service.loanApplication(application);
    // then:
    assertThat(loanApplication.getLoanApplicationStatus())
            .isEqualTo(LoanApplicationStatus.LOAN_APPLICATION_REJECTED);
    assertThat(loanApplication.getRejectionReason()).isEqualTo("Amount too high");
}
```

假设您已经编写了新功能的测试。如果收到大量贷款申请，则系统应拒绝该贷款申请并提供一些说明。

**编写缺少的实现。**

在某个时间点，您需要向欺诈检测服务发送请求。假设您需要发送包含客户ID和客户希望借入的金额的请求。您想通过`PUT`方法将其发送到`/fraudcheck`网址。

```
ResponseEntity<FraudServiceResponse> response = restTemplate.exchange(
		"http://localhost:" + port + "/fraudcheck", HttpMethod.PUT,
		new HttpEntity<>(request, httpHeaders), FraudServiceResponse.class);
```

为简单起见，欺诈检测服务的端口设置为`8080`，应用程序在`8090`上运行。

如果此时开始测试，则会中断测试，因为当前没有服务在端口`8080`上运行。

**在本地克隆欺诈检测服务存储库。**

您可以从服务器端合同开始。为此，您必须首先克隆它。

```
$ git clone https://your-git-server.com/server-side.git local-http-server-repo
```

**在欺诈检测服务的仓库中本地定义合同。**

作为消费者，您需要定义要实现的目标。您需要制定自己的期望。为此，请编写以下合同：

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 将合同放在`src/test/resources/contracts/fraud`文件夹下。`fraud`文件夹很重要，因为生产者的测试基类名称引用了该文件夹。 |      |

**Groovy DSL。** 

```
/*
 * Copyright 2013-2019 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package contracts

org.springframework.cloud.contract.spec.Contract.make {
    request { // (1)
        method 'PUT' // (2)
        url '/fraudcheck' // (3)
        body([ // (4)
               "client.id": $(regex('[0-9]{10}')),
               loanAmount : 99999
        ])
        headers { // (5)
            contentType('application/json')
        }
    }
    response { // (6)
        status OK() // (7)
        body([ // (8)
               fraudCheckStatus  : "FRAUD",
               "rejection.reason": "Amount too high"
        ])
        headers { // (9)
            contentType('application/json')
        }
    }
}

/*
From the Consumer perspective, when shooting a request in the integration test:

(1) - If the consumer sends a request
(2) - With the "PUT" method
(3) - to the URL "/fraudcheck"
(4) - with the JSON body that
 * has a field `client.id` that matches a regular expression `[0-9]{10}`
 * has a field `loanAmount` that is equal to `99999`
(5) - with header `Content-Type` equal to `application/json`
(6) - then the response will be sent with
(7) - status equal `200`
(8) - and JSON body equal to
 { "fraudCheckStatus": "FRAUD", "rejectionReason": "Amount too high" }
(9) - with header `Content-Type` equal to `application/json`

From the Producer perspective, in the autogenerated producer-side test:

(1) - A request will be sent to the producer
(2) - With the "PUT" method
(3) - to the URL "/fraudcheck"
(4) - with the JSON body that
 * has a field `client.id` that will have a generated value that matches a regular expression `[0-9]{10}`
 * has a field `loanAmount` that is equal to `99999`
(5) - with header `Content-Type` equal to `application/json`
(6) - then the test will assert if the response has been sent with
(7) - status equal `200`
(8) - and JSON body equal to
 { "fraudCheckStatus": "FRAUD", "rejectionReason": "Amount too high" }
(9) - with header `Content-Type` matching `application/json.*`
 */
```



**YAML。** 

```
request: # (1)
  method: PUT # (2)
  url: /fraudcheck # (3)
  body: # (4)
    "client.id": 1234567890
    loanAmount: 99999
  headers: # (5)
    Content-Type: application/json
  matchers:
    body:
      - path: $.['client.id'] # (6)
        type: by_regex
        value: "[0-9]{10}"
response: # (7)
  status: 200 # (8)
  body:  # (9)
    fraudCheckStatus: "FRAUD"
    "rejection.reason": "Amount too high"
  headers: # (10)
    Content-Type: application/json;charset=UTF-8


#From the Consumer perspective, when shooting a request in the integration test:
#
#(1) - If the consumer sends a request
#(2) - With the "PUT" method
#(3) - to the URL "/fraudcheck"
#(4) - with the JSON body that
# * has a field `client.id`
# * has a field `loanAmount` that is equal to `99999`
#(5) - with header `Content-Type` equal to `application/json`
#(6) - and a `client.id` json entry matches the regular expression `[0-9]{10}`
#(7) - then the response will be sent with
#(8) - status equal `200`
#(9) - and JSON body equal to
# { "fraudCheckStatus": "FRAUD", "rejectionReason": "Amount too high" }
#(10) - with header `Content-Type` equal to `application/json`
#
#From the Producer perspective, in the autogenerated producer-side test:
#
#(1) - A request will be sent to the producer
#(2) - With the "PUT" method
#(3) - to the URL "/fraudcheck"
#(4) - with the JSON body that
# * has a field `client.id` `1234567890`
# * has a field `loanAmount` that is equal to `99999`
#(5) - with header `Content-Type` equal to `application/json`
#(7) - then the test will assert if the response has been sent with
#(8) - status equal `200`
#(9) - and JSON body equal to
# { "fraudCheckStatus": "FRAUD", "rejectionReason": "Amount too high" }
#(10) - with header `Content-Type` equal to `application/json;charset=UTF-8`
```



YML合同很简单。但是，当您查看使用静态类型的Groovy DSL编写的合同时-您可能会怀疑`value(client(…), server(…))`部分是什么。通过使用此表示法，Spring Cloud Contract使您可以定义JSON块，URL等动态的部分。如果是标识符或时间戳，则无需对值进行硬编码。您要允许一些不同的值范围。要启用值范围，可以为使用者方设置与这些值匹配的正则表达式。您可以通过地图符号或带插值的字符串来提供主体。有关更多信息[，](https://www.springcloud.cc/spring-cloud-greenwich.html#contract-dsl)请参见[第94章](https://www.springcloud.cc/spring-cloud-greenwich.html#contract-dsl)[*Contract DSL*](https://www.springcloud.cc/spring-cloud-greenwich.html#contract-dsl)部分。我们强烈建议您使用地图符号！

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 您必须了解地图符号才能设置合同。请阅读[有关JSON](https://groovy-lang.org/json.html)的 [Groovy文档](https://groovy-lang.org/json.html)。 |

前面显示的合同是双方之间的协议，其中：

- 如果HTTP请求与所有
  - `/fraudcheck`端点上的`PUT`方法，
  - 一个具有`client.id`且与正则表达式`[0-9]{10}`和`loanAmount`等于`99999`匹配的JSON正文，
  - 和值为`application/vnd.fraud.v1+json`的`Content-Type`标头，
- 然后将HTTP响应发送给使用者
  - 状态为`200`，
  - 包含JSON正文，其`fraudCheckStatus`字段包含值`FRAUD`，而`rejectionReason`字段包含值`Amount too high`，
  - 还有一个`Content-Type`标头，其值为`application/vnd.fraud.v1+json`。

一旦准备好在集成测试中实际检查API，就需要在本地安装存根。

**添加Spring Cloud Contract验证程序插件。**

我们可以添加Maven或Gradle插件。在此示例中，您将了解如何添加Maven。首先，添加`Spring Cloud Contract` BOM。

```
<dependencyManagement>
	<dependencies>
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-dependencies</artifactId>
			<version>${spring-cloud-release.version}</version>
			<type>pom</type>
			<scope>import</scope>
		</dependency>
	</dependencies>
</dependencyManagement>
```

接下来，添加`Spring Cloud Contract Verifier` Maven插件

```
<plugin>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-contract-maven-plugin</artifactId>
	<version>${spring-cloud-contract.version}</version>
	<extensions>true</extensions>
	<configuration>
		<packageWithBaseClasses>com.example.fraud</packageWithBaseClasses>
		<convertToYaml>true</convertToYaml>
	</configuration>
</plugin>
```

自从添加了插件以来，您将获得`Spring Cloud Contract Verifier`功能，这些功能来自提供的合同：

- 生成并运行测试
- 制作并安装存根

您不想生成测试，因为作为消费者，您只想玩存根。您需要跳过测试的生成和执行。执行时：

```
$ cd local-http-server-repo
$ ./mvnw clean install -DskipTests
```

在日志中，您会看到以下内容：

```
[INFO] --- spring-cloud-contract-maven-plugin:1.0.0.BUILD-SNAPSHOT:generateStubs (default-generateStubs) @ http-server ---
[INFO] Building jar: /some/path/http-server/target/http-server-0.0.1-SNAPSHOT-stubs.jar
[INFO]
[INFO] --- maven-jar-plugin:2.6:jar (default-jar) @ http-server ---
[INFO] Building jar: /some/path/http-server/target/http-server-0.0.1-SNAPSHOT.jar
[INFO]
[INFO] --- spring-boot-maven-plugin:1.5.5.BUILD-SNAPSHOT:repackage (default) @ http-server ---
[INFO]
[INFO] --- maven-install-plugin:2.5.2:install (default-install) @ http-server ---
[INFO] Installing /some/path/http-server/target/http-server-0.0.1-SNAPSHOT.jar to /path/to/your/.m2/repository/com/example/http-server/0.0.1-SNAPSHOT/http-server-0.0.1-SNAPSHOT.jar
[INFO] Installing /some/path/http-server/pom.xml to /path/to/your/.m2/repository/com/example/http-server/0.0.1-SNAPSHOT/http-server-0.0.1-SNAPSHOT.pom
[INFO] Installing /some/path/http-server/target/http-server-0.0.1-SNAPSHOT-stubs.jar to /path/to/your/.m2/repository/com/example/http-server/0.0.1-SNAPSHOT/http-server-0.0.1-SNAPSHOT-stubs.jar
```

以下行非常重要：

```
[INFO] Installing /some/path/http-server/target/http-server-0.0.1-SNAPSHOT-stubs.jar to /path/to/your/.m2/repository/com/example/http-server/0.0.1-SNAPSHOT/http-server-0.0.1-SNAPSHOT-stubs.jar
```

它确认`http-server`的存根已安装在本地存储库中。

**运行集成测试。**

为了从自动存根下载的Spring Cloud Contract Stub Runner功能中受益，您必须在用户端项目（`Loan Application service`）中执行以下操作：

添加`Spring Cloud Contract` BOM：

```
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>${spring-cloud-release-train.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

将依赖项添加到`Spring Cloud Contract Stub Runner`：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-contract-stub-runner</artifactId>
    <scope>test</scope>
</dependency>
```

用`@AutoConfigureStubRunner`注释测试类。在注释中，为Stub Runner提供`group-id`和`artifact-id`，以下载合作者的存根。（可选步骤）由于您是与离线协作者一起玩，因此您还可以提供离线工作切换（`StubRunnerProperties.StubsMode.LOCAL`）。

```
@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = WebEnvironment.NONE)
@AutoConfigureStubRunner(ids = {
		"com.example:http-server-dsl:+:stubs:6565" }, stubsMode = StubRunnerProperties.StubsMode.LOCAL)
public class LoanApplicationServiceTests {
```

现在，当您运行测试时，您将看到类似以下的内容：

```
2016-07-19 14:22:25.403  INFO 41050 --- [           main] o.s.c.c.stubrunner.AetherStubDownloader  : Desired version is + - will try to resolve the latest version
2016-07-19 14:22:25.438  INFO 41050 --- [           main] o.s.c.c.stubrunner.AetherStubDownloader  : Resolved version is 0.0.1-SNAPSHOT
2016-07-19 14:22:25.439  INFO 41050 --- [           main] o.s.c.c.stubrunner.AetherStubDownloader  : Resolving artifact com.example:http-server:jar:stubs:0.0.1-SNAPSHOT using remote repositories []
2016-07-19 14:22:25.451  INFO 41050 --- [           main] o.s.c.c.stubrunner.AetherStubDownloader  : Resolved artifact com.example:http-server:jar:stubs:0.0.1-SNAPSHOT to /path/to/your/.m2/repository/com/example/http-server/0.0.1-SNAPSHOT/http-server-0.0.1-SNAPSHOT-stubs.jar
2016-07-19 14:22:25.465  INFO 41050 --- [           main] o.s.c.c.stubrunner.AetherStubDownloader  : Unpacking stub from JAR [URI: file:/path/to/your/.m2/repository/com/example/http-server/0.0.1-SNAPSHOT/http-server-0.0.1-SNAPSHOT-stubs.jar]
2016-07-19 14:22:25.475  INFO 41050 --- [           main] o.s.c.c.stubrunner.AetherStubDownloader  : Unpacked file to [/var/folders/0p/xwq47sq106x1_g3dtv6qfm940000gq/T/contracts100276532569594265]
2016-07-19 14:22:27.737  INFO 41050 --- [           main] o.s.c.c.stubrunner.StubRunnerExecutor    : All stubs are now running RunningStubs [namesAndPorts={com.example:http-server:0.0.1-SNAPSHOT:stubs=8080}]
```

此输出意味着Stub Runner找到了您的存根，并为您的应用启动了服务器，其组ID为`com.example`，工件ID为`http-server`，存根的版本为`0.0.1-SNAPSHOT`，且分类器为`stubs`端口`8080`。

**提出拉取请求。**

到目前为止，您所做的是一个迭代过程。您可以试用合同，将其安装在本地，然后在用户端工作，直到合同按您的意愿运行。

对结果满意并通过测试后，将拉取请求发布到服务器端。目前，消费者方面的工作已经完成。

### 87.5.3生产者端（欺诈检测服务器）

作为欺诈检测服务器（贷款发放服务的服务器）的开发人员：

**创建一个初始实现。**

提醒一下，您可以在此处看到初始实现：

```
@RequestMapping(value = "/fraudcheck", method = PUT)
public FraudCheckResult fraudCheck(@RequestBody FraudCheck fraudCheck) {
return new FraudCheckResult(FraudCheckStatus.OK, NO_REASON);
}
```

**接管请求请求。**

```
$ git checkout -b contract-change-pr master
$ git pull https://your-git-server.com/server-side-fork.git contract-change-pr
```

您必须添加自动生成的测试所需的依赖项：

```
<dependency>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-starter-contract-verifier</artifactId>
	<scope>test</scope>
</dependency>
```

在Maven插件的配置中，传递`packageWithBaseClasses`属性

```
<plugin>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-contract-maven-plugin</artifactId>
	<version>${spring-cloud-contract.version}</version>
	<extensions>true</extensions>
	<configuration>
		<packageWithBaseClasses>com.example.fraud</packageWithBaseClasses>
		<convertToYaml>true</convertToYaml>
	</configuration>
</plugin>
```

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 本示例通过设置`packageWithBaseClasses`属性使用“基于约定”的命名。这样做意味着最后两个软件包组合在一起以成为基础测试类的名称。在我们的案例中，合同位于`src/test/resources/contracts/fraud`下。由于从`contracts`文件夹开始没有两个软件包，因此仅选择一个，应该为`fraud`。添加后缀`Base`，并大写`fraud`。这将为您提供`FraudBase`测试类名称。 |      |

所有生成的测试都扩展了该类。在那边，您可以设置Spring上下文或任何必需的内容。在这种情况下，请使用[Rest Assured MVC](https://github.com/rest-assured/rest-assured)启动服务器端`FraudDetectionController`。

```
/*
 * Copyright 2013-2019 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.example.fraud;

import io.restassured.module.mockmvc.RestAssuredMockMvc;
import org.junit.Before;

public class FraudBase {

	@Before
	public void setup() {
		RestAssuredMockMvc.standaloneSetup(new FraudDetectionController(),
				new FraudStatsController(stubbedStatsProvider()));
	}

	private StatsProvider stubbedStatsProvider() {
		return fraudType -> {
			switch (fraudType) {
			case DRUNKS:
				return 100;
			case ALL:
				return 200;
			}
			return 0;
		};
	}

	public void assertThatRejectionReasonIsNull(Object rejectionReason) {
		assert rejectionReason == null;
	}

}
```

现在，如果您运行`./mvnw clean install`，则会得到以下内容：

```
Results :

Tests in error:
  ContractVerifierTest.validate_shouldMarkClientAsFraud:32 » IllegalState Parsed...
```

发生此错误的原因是您有一个新合同，从中生成了一个测试，但由于未实现该功能而失败了。自动生成的测试如下所示：

```
@Test
public void validate_shouldMarkClientAsFraud() throws Exception {
    // given:
        MockMvcRequestSpecification request = given()
                .header("Content-Type", "application/vnd.fraud.v1+json")
                .body("{\"client.id\":\"1234567890\",\"loanAmount\":99999}");

    // when:
        ResponseOptions response = given().spec(request)
                .put("/fraudcheck");

    // then:
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.header("Content-Type")).matches("application/vnd.fraud.v1.json.*");
    // and:
        DocumentContext parsedJson = JsonPath.parse(response.getBody().asString());
        assertThatJson(parsedJson).field("['fraudCheckStatus']").matches("[A-Z]{5}");
        assertThatJson(parsedJson).field("['rejection.reason']").isEqualTo("Amount too high");
}
```

如果您使用了Groovy DSL，则可以看到`value(consumer(…), producer(…))`块中存在的合同的所有`producer()`部分都已注入到测试中。如果使用YAML，则同样适用于`response`的`matchers`部分。

请注意，在生产者方面，您也在执行TDD。期望以测试的形式表达。此测试使用合同中定义的URL，标头和正文向我们自己的应用程序发送请求。它还期望响应中精确定义的值。换句话说，您拥有`red`，`green`和`refactor`的`red`部分。现在是将`red`转换为`green`的时候了。

**编写缺少的实现。**

因为您知道预期的输入和预期的输出，所以可以编写缺少的实现：

```
@RequestMapping(value = "/fraudcheck", method = PUT)
public FraudCheckResult fraudCheck(@RequestBody FraudCheck fraudCheck) {
if (amountGreaterThanThreshold(fraudCheck)) {
    return new FraudCheckResult(FraudCheckStatus.FRAUD, AMOUNT_TOO_HIGH);
}
return new FraudCheckResult(FraudCheckStatus.OK, NO_REASON);
}
```

再次执行`./mvnw clean install`时，测试通过。由于`Spring Cloud Contract Verifier`插件将测试添加到`generated-test-sources`中，因此您实际上可以从IDE中运行这些测试。

**部署您的应用程序。**

完成工作后，即可部署更改。首先，合并分支：

```
$ git checkout master
$ git merge --no-ff contract-change-pr
$ git push origin master
```

您的CI可能会运行类似`./mvnw clean deploy`之类的东西，它将同时发布应用程序和存根工件。

### 87.5.4消费者方（贷款发行）最后一步

作为贷款发行服务的开发人员（欺诈检测服务器的使用者）：

**合并分支以掌握。**

```
$ git checkout master
$ git merge --no-ff contract-change-pr
```

**在线工作。**

现在，您可以禁用Spring Cloud Contract Stub Runner的脱机工作，并指定包含存根的存储库所在的位置。此时，服务器端的存根会自动从Nexus / Artifactory下载。您可以将`stubsMode`的值设置为`REMOTE`。以下代码显示了通过更改属性来实现相同目的的示例。

```
stubrunner:
  ids: 'com.example:http-server-dsl:+:stubs:8080'
  repositoryRoot: https://repo.spring.io/libs-snapshot
```

而已！

## 87.6依赖项

添加依赖项的最佳方法是使用适当的`starter`依赖项。

对于`stub-runner`，请使用`spring-cloud-starter-stub-runner`。使用插件时，添加`spring-cloud-starter-contract-verifier`。

## 87.7其他链接

以下是与Spring Cloud Contract验证程序和Stub Runner有关的一些资源。请注意，有些可能已经过时，因为Spring Cloud Contract Verifier项目正在不断开发中。

### 87.7.1 Spring Cloud Contract视频

您可以从华沙水罐观看有关Spring Cloud Contract的视频：

### 87.7.2阅读

- [Marcin Grzejszczak关于Accurest的演讲的幻灯片](https://www.slideshare.net/MarcinGrzejszczak/stick-to-the-rules-consumer-driven-contracts-201507-confitura)
- [Marcin Grzejszczak博客中与Accurest相关的文章](https://toomuchcoding.com/blog/categories/accurest/)
- [Spring Cloud Contract Marcin Grzejszczak博客中的相关文章](https://toomuchcoding.com/blog/categories/spring-cloud-contract/)
- [Groovy关于JSON的文档](https://groovy-lang.org/json.html)

## 87.8个示例

您可以在[示例中](https://github.com/spring-cloud-samples/spring-cloud-contract-samples)找到一些 [示例](https://github.com/spring-cloud-samples/spring-cloud-contract-samples)。

## 88. Spring Cloud Contract常见问题

## 88.1为什么使用Spring Cloud Contract验证程序而不使用X？

目前，Spring Cloud Contract是基于JVM的工具。因此，当您已经为JVM创建软件时，它可能是您的首选。该项目具有许多非常有趣的功能，但尤其是其中许多确实使Spring Cloud Contract验证程序在消费者驱动合同（CDC）工具的“市场”上脱颖而出。最有趣的是：

- 通过消息进行CDC的可能性
- 清晰易用的静态类型DSL
- 可以将您当前的JSON文件复制粘贴到合同中，并仅编辑其元素
- 根据定义的合同自动生成测试
- Stub Runner功能-存根会在运行时从Nexus / Artifactory自动下载
- Spring Cloud集成-集成测试不需要发现服务
- Spring Cloud Contract与Pact开箱即用地集成在一起，并提供简单的钩子来扩展其功能
- 通过Docker添加对使用的任何语言和框架的支持

## 88.2我不想在Groovy中写合同！

没问题。您可以在YAML中写合同！

## 88.3这个值是什么（consumer（），producer（））？

与存根相关的最大挑战之一是它们的可重用性。只有将它们广泛使用，它们才能达到目的。通常使困难的是请求/响应元素的硬编码值。例如日期或ID。想象以下JSON请求

```
{
    "time" : "2016-10-10 20:10:15",
    "id" : "9febab1c-6f36-4a0b-88d6-3b6a6d81cd4a",
    "body" : "foo"
}
```

和JSON响应

```
{
    "time" : "2016-10-10 21:10:15",
    "id" : "c4231e1f-3ca9-48d3-b7e7-567d55f0d051",
    "body" : "bar"
}
```

想象一下通过更改系统中的时钟或提供数据提供者的存根实现来设置`time`字段的适当值（让我们假定此内容是由数据库生成）所需的痛苦。与名为`id`的字段相同。您将创建UUID生成器的存根实现吗？毫无意义...

因此，作为消费者，您希望发送与任何时间形式或任何UUID匹配的请求。这样，您的系统将像往常一样工作-会生成数据，而您无需存根任何东西。假设在上述JSON的情况下，最重要的部分是`body`字段。您可以专注于此并为其他字段提供匹配。换句话说，您希望存根像这样工作：

```
{
    "time" : "SOMETHING THAT MATCHES TIME",
    "id" : "SOMETHING THAT MATCHES UUID",
    "body" : "foo"
}
```

就响应作为消费者而言，您需要可以操作的具体价值。所以这样的JSON是有效的

```
{
    "time" : "2016-10-10 21:10:15",
    "id" : "c4231e1f-3ca9-48d3-b7e7-567d55f0d051",
    "body" : "bar"
}
```

如您在前几节中所看到的，我们根据合同生成测试。因此，从生产者的角度来看，情况似乎大不相同。我们正在解析提供的合同，并且在测试中我们想向您的端点发送真实请求。因此，对于请求的生产者而言，我们无法进行任何形式的匹配。我们需要生产者后端可以使用的具体价值。这样的JSON是有效的：

```
{
    "time" : "2016-10-10 20:10:15",
    "id" : "9febab1c-6f36-4a0b-88d6-3b6a6d81cd4a",
    "body" : "foo"
}
```

另一方面，从合同有效性的角度来看，响应不一定包含`time`或`id`的具体值。假设您是在生产者端生成的-再次，您必须进行大量的存根操作以确保始终返回相同的值。因此，从生产者的角度来看，您可能想要以下响应：

```
{
    "time" : "SOMETHING THAT MATCHES TIME",
    "id" : "SOMETHING THAT MATCHES UUID",
    "body" : "bar"
}
```

那么，您如何才能一次为消费者提供匹配者，为生产者提供具体价值，反之亦然？在Spring Cloud Contract中，我们允许您提供**动态值**。这意味着通信的双方可能会有所不同。您可以传递值：

通过`value`方法

```
value(consumer(...), producer(...))
value(stub(...), test(...))
value(client(...), server(...))
```

或使用`$()`方法

```
$(consumer(...), producer(...))
$(stub(...), test(...))
$(client(...), server(...))
```

您可以在[第94章*Contract DSL*](https://www.springcloud.cc/spring-cloud-greenwich.html#contract-dsl)部分中了解有关此内容的更多信息。

调用`value()`或`$()`会告诉Spring Cloud Contract您将传递动态值。在`consumer()`方法内部，传递应该在使用者方（在生成的存根中）使用的值。在`producer()`方法内部，传递应该在生产方（在生成的测试中）使用的值。

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 如果一侧传递了正则表达式，而另一侧则没有传递，则另一侧将自动生成。 |

通常，您会将该方法与`regex`帮助方法一起使用。例如`consumer(regex('[0-9]{10}'))`。

概括起来，上述情况的合同看起来或多或少像这样（时间和UUID的正则表达式已简化，很可能是无效的，但在此示例中，我们希望保持非常简单）：

```
org.springframework.cloud.contract.spec.Contract.make {
                request {
                    method 'GET'
                    url '/someUrl'
                    body([
                        time : value(consumer(regex('[0-9]{4}-[0-9]{2}-[0-9]{2} [0-2][0-9]-[0-5][0-9]-[0-5][0-9]')),
                        id: value(consumer(regex('[0-9a-zA-z]{8}-[0-9a-zA-z]{4}-[0-9a-zA-z]{4}-[0-9a-zA-z]{12}'))
                        body: "foo"
                    ])
                }
            response {
                status OK()
                body([
                        time : value(producer(regex('[0-9]{4}-[0-9]{2}-[0-9]{2} [0-2][0-9]-[0-5][0-9]-[0-5][0-9]')),
                        id: value([producer(regex('[0-9a-zA-z]{8}-[0-9a-zA-z]{4}-[0-9a-zA-z]{4}-[0-9a-zA-z]{12}'))
                        body: "bar"
                    ])
            }
}
```

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 请阅读[与JSON相关](https://groovy-lang.org/json.html)的[Groovy文档，](https://groovy-lang.org/json.html)以了解如何正确构造请求/响应主体。 |      |

## 88.4如何进行存根版本控制？

### 88.4.1 API版本控制

让我们尝试回答一个问题，即版本控制的真正含义。如果您指的是API版本，则有不同的方法。

- 使用超媒体，链接，并且不以任何方式对您的API进行版本控制
- 通过标题/网址传递版本

我不会尝试回答哪种方法更好的问题。应该选择适合您需求并允许您产生业务价值的任何东西。

假设您对API进行了版本控制。在这种情况下，您应提供与所支持版本一样多的合同。您可以为每个版本创建一个子文件夹，也可以将其附加到合同名称之后-更加适合您。

### 88.4.2 JAR版本控制

如果用版本控制来表示包含存根的JAR版本，则实质上有两种主要方法。

假设您正在执行持续交付/部署，这意味着您每次通过管道都将生成一个新版本的jar，并且该jar可以随时投入生产。例如，您的jar版本如下所示（它建立于20.10.2016 at 20:15:21）：

```
1.0.0.20161020-201521-RELEASE
```

在这种情况下，您生成的存根罐将如下所示。

```
1.0.0.20161020-201521-RELEASE-stubs.jar
```

在这种情况下，引用存根时应在`application.yml`或`@AutoConfigureStubRunner`中提供最新版本的存根。您可以通过传递`+`符号来实现。例

```
@AutoConfigureStubRunner(ids = {"com.example:http-server-dsl:+:stubs:8080"})
```

但是，如果版本是固定的（例如`1.0.4.RELEASE`或`2.1.1`），则必须设置jar版本的具体值。2.1.1的示例。

```
@AutoConfigureStubRunner(ids = {"com.example:http-server-dsl:2.1.1:stubs:8080"})
```

### 88.4.3开发或生产存根

您可以操纵分类器，以针对其他服务或已部署到生产中的服务的存根的当前开发版本运行测试。如果您更改构建以使用`prod-stubs`分类器部署存根，则在进行生产部署后，可以在一种情况下使用开发存根运行测试，在一种情况下使用产品存根运行测试。

使用存根开发版本的测试示例

```
@AutoConfigureStubRunner(ids = {"com.example:http-server-dsl:+:stubs:8080"})
```

使用生产版本的存根进行测试的示例

```
@AutoConfigureStubRunner(ids = {"com.example:http-server-dsl:+:prod-stubs:8080"})
```

您还可以通过部署管道中的属性传递这些值。

## 88.5合同通用回购

除了与生产者签订合同之外，存储合同的另一种方法是将合同放在一个共同的地方。这可能与安全问题有关，在这些安全问题中，消费者无法克隆生产者的代码。同样，如果您将合同放在一个地方，那么作为生产者，您将知道您有多少个消费者，以及将因本地变更而中断的消费者。

### 88.5.1回购结构

假设我们有一个生产者，其坐标为`com.example:server`，并且有3个使用者：`client1`，`client2`，`client3`。然后，在具有通用合同的存储库中，您将具有以下设置（可以[在此处](https://github.com/spring-cloud/spring-cloud-contract/tree/2.1.x/samples/standalone/contracts)签出）：

```
├── com
│   └── example
│       └── server
│           ├── client1
│           │   └── expectation.groovy
│           ├── client2
│           │   └── expectation.groovy
│           ├── client3
│           │   └── expectation.groovy
│           └── pom.xml
├── mvnw
├── mvnw.cmd
├── pom.xml
└── src
    └── assembly
        └── contracts.xml
```

如您所见，在以斜杠分隔的groupid `/`工件ID文件夹（`com/example/server`）下，您对3个使用者（`client1`，`client2`和`client3`）有期望。期望是本文档中所述的标准Groovy DSL合同文件。该存储库必须产生一个JAR文件，该文件将仓库内容一一对应。

`server`文件夹中的`pom.xml`的示例。

```
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xmlns="http://maven.apache.org/POM/4.0.0"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>server</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <name>Server Stubs</name>
    <description>POM used to install locally stubs for consumer side</description>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.1.10.RELEASE</version>
        <relativePath/>
    </parent>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <java.version>1.8</java.version>
        <spring-cloud-contract.version>2.1.6.BUILD-SNAPSHOT</spring-cloud-contract.version>
        <spring-cloud-release.version>Greenwich.BUILD-SNAPSHOT
        </spring-cloud-release.version>
        <excludeBuildFolders>true</excludeBuildFolders>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud-release.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-contract-maven-plugin</artifactId>
                <version>${spring-cloud-contract.version}</version>
                <extensions>true</extensions>
                <configuration>
                    <!-- By default it would search under src/test/resources/ -->
                    <contractsDirectory>${project.basedir}</contractsDirectory>
                </configuration>
            </plugin>
        </plugins>
    </build>

    <repositories>
        <repository>
            <id>spring-snapshots</id>
            <name>Spring Snapshots</name>
            <url>https://repo.spring.io/snapshot</url>
            <snapshots>
                <enabled>true</enabled>
            </snapshots>
        </repository>
        <repository>
            <id>spring-milestones</id>
            <name>Spring Milestones</name>
            <url>https://repo.spring.io/milestone</url>
            <snapshots>
                <enabled>false</enabled>
            </snapshots>
        </repository>
        <repository>
            <id>spring-releases</id>
            <name>Spring Releases</name>
            <url>https://repo.spring.io/release</url>
            <snapshots>
                <enabled>false</enabled>
            </snapshots>
        </repository>
    </repositories>
    <pluginRepositories>
        <pluginRepository>
            <id>spring-snapshots</id>
            <name>Spring Snapshots</name>
            <url>https://repo.spring.io/snapshot</url>
            <snapshots>
                <enabled>true</enabled>
            </snapshots>
        </pluginRepository>
        <pluginRepository>
            <id>spring-milestones</id>
            <name>Spring Milestones</name>
            <url>https://repo.spring.io/milestone</url>
            <snapshots>
                <enabled>false</enabled>
            </snapshots>
        </pluginRepository>
        <pluginRepository>
            <id>spring-releases</id>
            <name>Spring Releases</name>
            <url>https://repo.spring.io/release</url>
            <snapshots>
                <enabled>false</enabled>
            </snapshots>
        </pluginRepository>
    </pluginRepositories>

</project>
```

如您所见，除了Spring Cloud Contract Maven插件以外，没有其他依赖项。消费者方必须运行这些pom才能运行`mvn clean install -DskipTests`在本地安装生产者项目的存根。

根文件夹中的`pom.xml`如下所示：

```
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
		 xmlns="http://maven.apache.org/POM/4.0.0"
		 xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>

	<groupId>com.example.standalone</groupId>
	<artifactId>contracts</artifactId>
	<version>0.0.1-SNAPSHOT</version>

	<name>Contracts</name>
	<description>Contains all the Spring Cloud Contracts, well, contracts. JAR used by the
		producers to generate tests and stubs
	</description>

	<properties>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
	</properties>

	<build>
		<plugins>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-assembly-plugin</artifactId>
				<executions>
					<execution>
						<id>contracts</id>
						<phase>prepare-package</phase>
						<goals>
							<goal>single</goal>
						</goals>
						<configuration>
							<attach>true</attach>
							<descriptor>${basedir}/src/assembly/contracts.xml</descriptor>
							<!-- If you want an explicit classifier remove the following line -->
							<appendAssemblyId>false</appendAssemblyId>
						</configuration>
					</execution>
				</executions>
			</plugin>
		</plugins>
	</build>

</project>
```

它使用Assembly插件来构建包含所有合同的JAR。这种设置的示例在这里：

```
<assembly xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
		  xmlns="http://maven.apache.org/plugins/maven-assembly-plugin/assembly/1.1.3"
		  xsi:schemaLocation="http://maven.apache.org/plugins/maven-assembly-plugin/assembly/1.1.3 https://maven.apache.org/xsd/assembly-1.1.3.xsd">
	<id>project</id>
	<formats>
		<format>jar</format>
	</formats>
	<includeBaseDirectory>false</includeBaseDirectory>
	<fileSets>
		<fileSet>
			<directory>${project.basedir}</directory>
			<outputDirectory>/</outputDirectory>
			<useDefaultExcludes>true</useDefaultExcludes>
			<excludes>
				<exclude>**/${project.build.directory}/**</exclude>
				<exclude>mvnw</exclude>
				<exclude>mvnw.cmd</exclude>
				<exclude>.mvn/**</exclude>
				<exclude>src/**</exclude>
			</excludes>
		</fileSet>
	</fileSets>
</assembly>
```

### 88.5.2工作流程

该工作流程看上去与`Step by step guide to CDC`中介绍的工作流程相似。唯一的区别是，生产者不再拥有合同。因此，消费者和生产者必须在公共存储库中处理公共合同。

### 88.5.3消费者

当**消费者**希望脱机处理合同时，而不是克隆生产者代码，消费者团队将克隆公共存储库，转到所需的生产者文件夹（例如`com/example/server`）并运行`mvn clean install -DskipTests`以在本地安装存根。从合同转换。

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 您需要在[本地安装Maven](https://maven.apache.org/download.cgi) |

### 88.5.4生产者

作为**生产者**，足以更改Spring Cloud Contract验证程序以提供URL和包含合同的JAR依赖项：

```
<plugin>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-contract-maven-plugin</artifactId>
	<configuration>
		<contractsMode>REMOTE</contractsMode>
		<contractsRepositoryUrl>
			https://link/to/your/nexus/or/artifactory/or/sth
		</contractsRepositoryUrl>
		<contractDependency>
			<groupId>com.example.standalone</groupId>
			<artifactId>contracts</artifactId>
		</contractDependency>
	</configuration>
</plugin>
```

通过此设置，将从`http://link/to/your/nexus/or/artifactory/or/sth`下载组ID为`com.example.standalone`和工件为`contracts`的JAR。然后将其解压缩到本地临时文件夹中，并选择`com/example/server`下的合同作为生成测试和存根的合同。根据该约定，当完成一些不兼容的更改时，生产者团队将知道哪些消费者团队将被破坏。

其余流程看起来相同。

### 88.5.5如何按主题而不是按生产者定义消息传递合同？

为了避免通用仓库中的消息合同重复，当很少有生产者将消息写到一个主题时，我们可以创建一个结构，将其余合同放置在每个生产者的文件夹中，并将消息合同放置在每个主题的文件夹中。

#### 对于Maven项目

为了能够在生产者端进行工作，我们应该指定一个包含模式，以通过我们感兴趣的消息传递主题过滤通用存储库jar。`Maven Spring Cloud Contract plugin`的`includedFiles`属性允许我们执行此操作。还需要指定`contractsPath`，因为默认路径将是公用存储库`groupid/artifactid`。

```
<plugin>
   <groupId>org.springframework.cloud</groupId>
   <artifactId>spring-cloud-contract-maven-plugin</artifactId>
   <version>${spring-cloud-contract.version}</version>
   <configuration>
      <contractsMode>REMOTE</contractsMode>
      <contractsRepositoryUrl>http://link/to/your/nexus/or/artifactory/or/sth</contractsRepositoryUrl>
      <contractDependency>
         <groupId>com.example</groupId>
         <artifactId>common-repo-with-contracts</artifactId>
         <version>+</version>
      </contractDependency>
      <contractsPath>/</contractsPath>
      <baseClassMappings>
         <baseClassMapping>
            <contractPackageRegex>.*messaging.*</contractPackageRegex>
            <baseClassFQN>com.example.services.MessagingBase</baseClassFQN>
         </baseClassMapping>
         <baseClassMapping>
            <contractPackageRegex>.*rest.*</contractPackageRegex>
            <baseClassFQN>com.example.services.TestBase</baseClassFQN>
         </baseClassMapping>
      </baseClassMappings>
      <includedFiles>
         <includedFile>**/${project.artifactId}/**</includedFile>
         <includedFile>**/${first-topic}/**</includedFile>
         <includedFile>**/${second-topic}/**</includedFile>
      </includedFiles>
   </configuration>
</plugin>
```

#### 对于Gradle项目

- 为common-repo依赖项添加定制配置：

```
ext {
    conractsGroupId = "com.example"
    contractsArtifactId = "common-repo"
    contractsVersion = "1.2.3"
}

configurations {
    contracts {
        transitive = false
    }
}
```

- 将common-repo依赖项添加到您的类路径中：

```
dependencies {
    contracts "${conractsGroupId}:${contractsArtifactId}:${contractsVersion}"
    testCompile "${conractsGroupId}:${contractsArtifactId}:${contractsVersion}"
}
```

- 将依赖项下载到适当的文件夹：

```
task getContracts(type: Copy) {
    from configurations.contracts
    into new File(project.buildDir, "downloadedContracts")
}
```

- 解压缩JAR：

```
task unzipContracts(type: Copy) {
    def zipFile = new File(project.buildDir, "downloadedContracts/${contractsArtifactId}-${contractsVersion}.jar")
    def outputDir = file("${buildDir}/unpackedContracts")

    from zipTree(zipFile)
    into outputDir
}
```

- 清理未使用的合同：

```
task deleteUnwantedContracts(type: Delete) {
    delete fileTree(dir: "${buildDir}/unpackedContracts",
        include: "**/*",
        excludes: [
            "**/${project.name}/**"",
            "**/${first-topic}/**",
            "**/${second-topic}/**"])
}
```

- 创建任务依赖项：

```
unzipContracts.dependsOn("getContracts")
deleteUnwantedContracts.dependsOn("unzipContracts")
build.dependsOn("deleteUnwantedContracts")
```

- 通过使用`contractsDslDir`属性指定包含合同的目录来配置插件

```
contracts {
    contractsDslDir = new File("${buildDir}/unpackedContracts")
}
```

## 88.6我需要二进制存储吗？我不能使用Git吗？

在多语言的世界中，有些语言不使用二进制存储，例如Artifactory或Nexus。从Spring Cloud Contract版本2.0.0开始，我们提供了在SCM存储库中存储合同和存根的机制。当前唯一支持的SCM是Git。

存储库必须进行以下设置（您可以[在此处](https://github.com/spring-cloud-samples/spring-cloud-contract-samples/tree/2.1.x/contracts_git/)检出）：

```
.
└── META-INF
    └── com.example
        └── beer-api-producer-git
            └── 0.0.1-SNAPSHOT
                ├── contracts
                │   └── beer-api-consumer
                │       ├── messaging
                │       │   ├── shouldSendAcceptedVerification.groovy
                │       │   └── shouldSendRejectedVerification.groovy
                │       └── rest
                │           ├── shouldGrantABeerIfOldEnough.groovy
                │           └── shouldRejectABeerIfTooYoung.groovy
                └── mappings
                    └── beer-api-consumer
                        └── rest
                            ├── shouldGrantABeerIfOldEnough.json
                            └── shouldRejectABeerIfTooYoung.json
```

在`META-INF`文件夹下：

- 我们通过`groupId`（例如，`com.example`）对应用程序进行分组
- 那么每个应用程序都通过`artifactId`（例如`beer-api-producer-git`）表示
- 接下来，是应用程序的版本（例如`0.0.1-SNAPSHOT`）。从Spring Cloud Contract版本`2.1.0`开始，您可以指定以下版本（假设您的版本遵循语义版本）
  - `+`或`latest`-查找存根的最新版本（假设快照始终是给定修订版本的最新工件）。这意味着：
    - 如果您有`1.0.0.RELEASE`，`2.0.0.BUILD-SNAPSHOT`和`2.0.0.RELEASE`版本，我们将假定最新版本为`2.0.0.BUILD-SNAPSHOT`
    - 如果您使用的版本为`1.0.0.RELEASE`和`2.0.0.RELEASE`，我们将假定最新版本为`2.0.0.RELEASE`
    - 如果您有一个名为`latest`或`+`的版本，我们将选择该文件夹
  - `release`-查找存根的最新版本。这意味着：
    - 如果您使用的版本为`1.0.0.RELEASE`，`2.0.0.BUILD-SNAPSHOT`和`2.0.0.RELEASE`，我们将假定最新版本为`2.0.0.RELEASE`
    - 如果您有一个名为`release`的版本，我们将选择该文件夹
- 最后，有两个文件夹：
  - `contracts`-优良作法是将每个消费者所需的合同与消费者名称一起存储在文件夹中（例如`beer-api-consumer`）。这样，您可以使用`stubs-per-consumer`功能。进一步的目录结构是任意的。
  - `mappings`-在该文件夹中，Maven / Gradle Spring Cloud Contract插件将推送存根服务器映射。在使用者方面，Stub Runner将扫描此文件夹以使用存根定义启动存根服务器。文件夹结构将是在`contracts`子文件夹中创建的文件夹的副本。

### 88.6.1协议约定

为了控制合同来源的类型和位置（无论是二进制存储还是SCM存储库），可以在存储库URL中使用协议。Spring Cloud Contract遍历已注册的协议解析器，并尝试获取合同（通过插件）或存根（通过Stub Runner）。

目前，对于SCM功能，我们支持Git存储库。要使用它，在属性中需要放置存储库URL的位置，您只需在连接URL前面加上`git://`。在这里您可以找到几个示例：

```
git://file:///foo/bar
git://https://github.com/spring-cloud-samples/spring-cloud-contract-nodejs-contracts-git.git
git://git@github.com:spring-cloud-samples/spring-cloud-contract-nodejs-contracts-git.git
```

### 88.6.2生产者

对于生产者，要使用SCM方法，我们可以重用与外部合同相同的机制。我们通过包含`git://`协议的URL路由Spring Cloud Contract以使用SCM实现。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 您必须在Maven中手动添加`pushStubsToScm`目标，或者在Gradle中执行（绑定）`pushStubsToScm`任务。我们不会开箱即用将存根推送到您的git存储库的`origin`。 |      |

**Maven.** 

```
<plugin>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-contract-maven-plugin</artifactId>
    <version>${spring-cloud-contract.version}</version>
    <extensions>true</extensions>
    <configuration>
        <!-- Base class mappings etc. -->

        <!-- We want to pick contracts from a Git repository -->
        <contractsRepositoryUrl>git://https://github.com/spring-cloud-samples/spring-cloud-contract-nodejs-contracts-git.git</contractsRepositoryUrl>

        <!-- We reuse the contract dependency section to set up the path
        to the folder that contains the contract definitions. In our case the
        path will be /groupId/artifactId/version/contracts -->
        <contractDependency>
            <groupId>${project.groupId}</groupId>
            <artifactId>${project.artifactId}</artifactId>
            <version>${project.version}</version>
        </contractDependency>

        <!-- The contracts mode can't be classpath -->
        <contractsMode>REMOTE</contractsMode>
    </configuration>
    <executions>
        <execution>
            <phase>package</phase>
            <goals>
                <!-- By default we will not push the stubs back to SCM,
                you have to explicitly add it as a goal -->
                <goal>pushStubsToScm</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```



**Gradle.** 

```
contracts {
	// We want to pick contracts from a Git repository
	contractDependency {
		stringNotation = "${project.group}:${project.name}:${project.version}"
	}
	/*
	We reuse the contract dependency section to set up the path
	to the folder that contains the contract definitions. In our case the
	path will be /groupId/artifactId/version/contracts
	 */
	contractRepository {
		repositoryUrl = "git://https://github.com/spring-cloud-samples/spring-cloud-contract-nodejs-contracts-git.git"
	}
	// The mode can't be classpath
	contractsMode = "REMOTE"
	// Base class mappings etc.
}

/*
In this scenario we want to publish stubs to SCM whenever
the `publish` task is executed
*/
publish.dependsOn("publishStubsToScm")
```



通过这样的设置：

- Git项目将被克隆到一个临时目录
- SCM存根下载器将转到`META-INF/groupId/artifactId/version/contracts`文件夹以查找合同。例如，对于`com.example:foo:1.0.0`，路径为`META-INF/com.example/foo/1.0.0/contracts`
- 将根据合同生成测试
- 将根据合同创建存根
- 测试通过后，存根将在克隆的存储库中提交
- 最后，将推动该存储库的`origin`

### 88.6.3生产者，合同存储在本地

使用SCM作为存根和合同目的地的另一种选择是与生产者一起在本地存储合同，并且仅将合同和存根推送到SCM。在下面，您可以找到使用Maven和Gradle完成此操作所需的设置。

**Maven.** 

```
<plugin>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-contract-maven-plugin</artifactId>
    <version>${spring-cloud-contract.version}</version>
    <extensions>true</extensions>
    <!-- In the default configuration, we want to use the contracts stored locally -->
    <configuration>
        <baseClassMappings>
            <baseClassMapping>
                <contractPackageRegex>.*messaging.*</contractPackageRegex>
                <baseClassFQN>com.example.BeerMessagingBase</baseClassFQN>
            </baseClassMapping>
            <baseClassMapping>
                <contractPackageRegex>.*rest.*</contractPackageRegex>
                <baseClassFQN>com.example.BeerRestBase</baseClassFQN>
            </baseClassMapping>
        </baseClassMappings>
        <basePackageForTests>com.example</basePackageForTests>
    </configuration>
    <executions>
        <execution>
            <phase>package</phase>
            <goals>
                <!-- By default we will not push the stubs back to SCM,
                you have to explicitly add it as a goal -->
                <goal>pushStubsToScm</goal>
            </goals>
            <configuration>
                <!-- We want to pick contracts from a Git repository -->
                <contractsRepositoryUrl>git://file://${env.ROOT}/target/contract_empty_git/
                </contractsRepositoryUrl>
                <!-- Example of URL via git protocol -->
                <!--<contractsRepositoryUrl>git://git@github.com:spring-cloud-samples/spring-cloud-contract-samples.git</contractsRepositoryUrl>-->
                <!-- Example of URL via http protocol -->
                <!--<contractsRepositoryUrl>git://https://github.com/spring-cloud-samples/spring-cloud-contract-samples.git</contractsRepositoryUrl>-->
                <!-- We reuse the contract dependency section to set up the path
                to the folder that contains the contract definitions. In our case the
                path will be /groupId/artifactId/version/contracts -->
                <contractDependency>
                    <groupId>${project.groupId}</groupId>
                    <artifactId>${project.artifactId}</artifactId>
                    <version>${project.version}</version>
                </contractDependency>
                <!-- The mode can't be classpath -->
                <contractsMode>LOCAL</contractsMode>
            </configuration>
        </execution>
    </executions>
</plugin>
```



**Gradle.** 

```
contracts {
        // Base package for generated tests
    basePackageForTests = "com.example"
    baseClassMappings {
        baseClassMapping(".*messaging.*", "com.example.BeerMessagingBase")
        baseClassMapping(".*rest.*", "com.example.BeerRestBase")
    }
}

/*
In this scenario we want to publish stubs to SCM whenever
the `publish` task is executed
*/
publishStubsToScm {
    // We want to modify the default set up of the plugin when publish stubs to scm is called
    customize {
        // We want to pick contracts from a Git repository
        contractDependency {
            stringNotation = "${project.group}:${project.name}:${project.version}"
        }
        /*
        We reuse the contract dependency section to set up the path
        to the folder that contains the contract definitions. In our case the
        path will be /groupId/artifactId/version/contracts
         */
        contractRepository {
            repositoryUrl = "git://file://${System.getenv("ROOT")}/target/contract_empty_git/"
        }
        // The mode can't be classpath
        contractsMode = "LOCAL"
    }
}

publish.dependsOn("publishStubsToScm")
publishToMavenLocal.dependsOn("publishStubsToScm")
```



通过这样的设置：

- 从默认的`src/test/resources/contracts`目录中选择Contracts
- 将根据合同生成测试
- 将根据合同创建存根
- 一旦测试通过
  - Git项目将被克隆到一个临时目录
  - 存根和合同将在克隆的存储库中提交
- 最后，将推动该存储库的`origin`

#### 与生产者和存根之间的合同保持一致

也可以将合同保留在生产者存储库中，但将存根保留在外部git repo中。当您想使用基本的消费者-生产者协作流程，但又无法使用工件存储库来存储存根时，这是最有用的。

为此，请使用通常的生产者设置，然后添加`pushStubsToScm`目标并在要保留存根的存储库中设置`contractsRepositoryUrl`。

### 88.6.4消费者

在使用者方面，通过`@AutoConfigureStubRunner`批注，JUnit规则，JUnit 5扩展名或属性传递`repositoryRoot`参数时，足以传递带有协议前缀的SCM存储库的URL。例如

```
@AutoConfigureStubRunner(
    stubsMode="REMOTE",
    repositoryRoot="git://https://github.com/spring-cloud-samples/spring-cloud-contract-nodejs-contracts-git.git",
    ids="com.example:bookstore:0.0.1.RELEASE"
)
```

通过这样的设置：

- Git项目将被克隆到一个临时目录
- SCM存根下载器将转到`META-INF/groupId/artifactId/version/`文件夹以查找存根定义和合同。例如，对于`com.example:foo:1.0.0`，路径为`META-INF/com.example/foo/1.0.0/`
- 存根服务器将启动并提供映射
- 将在消息传递测试中读取和使用消息传递定义

## 88.7我可以使用契约代理吗？

使用[Pact时](https://pact.io/)，可以使用[Pact Broker](https://github.com/pact-foundation/pact_broker) 来存储和共享Pact定义。从Spring Cloud Contract 2.0.0开始，可以从Pact Broker中获取Pact文件以生成测试和存根。

作为前提条件，需要使用Pact Converter和Pact Stub Downloader。您必须通过`spring-cloud-contract-pact`依赖项添加它们。您可以在[第96.1.1节“协议转换器”](https://www.springcloud.cc/spring-cloud-greenwich.html#pact-converter)部分中了解更多信息。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 条约遵循消费者合同约定。这意味着消费者首先创建契约约定，然后与生产者共享文件。这些期望是由消费者的代码产生的，如果不满足期望，则可能破坏生产者。 |      |

### 88.7.1契约使用者

使用者使用Pact框架生成Pact文件。该契约文件将发送到契约代理。可以在[此处](https://github.com/spring-cloud-samples/spring-cloud-contract-samples/tree/2.1.x/consumer_pact)找到此类设置的示例。

### 88.7.2生产者

对于生产者，要使用Pact Broker中的Pact文件，我们可以重复使用与外部合同相同的机制。我们通过包含`pact://`协议的URL路由Spring Cloud Contract以使用Pact实现。只需将URL传递给Pact Broker。可以在[此处](https://github.com/spring-cloud-samples/spring-cloud-contract-samples/tree/2.1.x/producer_pact)找到此类设置的示例。

**Maven.** 

```
<plugin>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-contract-maven-plugin</artifactId>
    <version>${spring-cloud-contract.version}</version>
    <extensions>true</extensions>
    <configuration>
        <!-- Base class mappings etc. -->

        <!-- We want to pick contracts from a Git repository -->
        <contractsRepositoryUrl>pact://http://localhost:8085</contractsRepositoryUrl>

        <!-- We reuse the contract dependency section to set up the path
        to the folder that contains the contract definitions. In our case the
        path will be /groupId/artifactId/version/contracts -->
        <contractDependency>
            <groupId>${project.groupId}</groupId>
            <artifactId>${project.artifactId}</artifactId>
            <!-- When + is passed, a latest tag will be applied when fetching pacts -->
            <version>+</version>
        </contractDependency>

        <!-- The contracts mode can't be classpath -->
        <contractsMode>REMOTE</contractsMode>
    </configuration>
    <!-- Don't forget to add spring-cloud-contract-pact to the classpath! -->
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-contract-pact</artifactId>
            <version>${spring-cloud-contract.version}</version>
        </dependency>
    </dependencies>
</plugin>
```



**Gradle.** 

```
buildscript {
    repositories {
        //...
    }

    dependencies {
        // ...
        // Don't forget to add spring-cloud-contract-pact to the classpath!
        classpath "org.springframework.cloud:spring-cloud-contract-pact:${contractVersion}"
    }
}

contracts {
    // When + is passed, a latest tag will be applied when fetching pacts
    contractDependency {
        stringNotation = "${project.group}:${project.name}:+"
    }
    contractRepository {
        repositoryUrl = "pact://http://localhost:8085"
    }
    // The mode can't be classpath
    contractsMode = "REMOTE"
    // Base class mappings etc.
}
```



通过这样的设置：

- 契约文件将从契约代理下载
- Spring Cloud Contract将把Pact文件转换为测试和存根
- 与存根一样的JAR会像往常一样自动创建

### 88.7.3契约消费者（生产者合同法）

在您不想执行“消费者合同”方法（为每个消费者定义期望）但您更愿意使用“生产者Contracts”（生产者提供合同并发布存根）的情况下，足够使用Spring Cloud Contract和Stub Runner选项。可以在[此处](https://github.com/spring-cloud-samples/spring-cloud-contract-samples/tree/2.1.x/consumer_pact_stubrunner)找到此类设置的示例。

首先，请记住添加Stub Runner和Spring Cloud Contract Pact模块作为测试依赖项。

**Maven.** 

```
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>${spring-cloud.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<!-- Don't forget to add spring-cloud-contract-pact to the classpath! -->
<dependencies>
    <!-- ... -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-contract-stub-runner</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-contract-pact</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```



**Gradle.** 

```
dependencyManagement {
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-dependencies:${springCloudVersion}"
    }
}

dependencies {
    //...
    testCompile("org.springframework.cloud:spring-cloud-starter-contract-stub-runner")
    // Don't forget to add spring-cloud-contract-pact to the classpath!
    testCompile("org.springframework.cloud:spring-cloud-contract-pact")
}
```



接下来，只需将Pact Broker的URL传递到以`pact://`协议为前缀的`repositoryRoot`。例如`pact://http://localhost:8085`

```
@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureStubRunner(stubsMode = StubRunnerProperties.StubsMode.REMOTE,
        ids = "com.example:beer-api-producer-pact",
        repositoryRoot = "pact://http://localhost:8085")
public class BeerControllerTest {
    //Inject the port of the running stub
    @StubRunnerPort("beer-api-producer-pact") int producerPort;
    //...
}
```

通过这样的设置：

- 契约文件将从契约代理下载
- Spring Cloud Contract将把Pact文件转换为存根定义
- 存根服务器将启动并被存入存根

有关Pact支持的更多信息，请转至[第96.7节“使用Pact存根下载器”](https://www.springcloud.cc/spring-cloud-greenwich.html#pact-stub-downloader)部分。

## 88.8如何调试由生成的测试客户端发送的请求/响应？

生成的测试全部以依赖[Apache HttpClient的](https://hc.apache.org/httpcomponents-client-ga/)某种形式或方式归结为RestAssured 。HttpClient具有一种称为“ [有线记录”的功能](https://hc.apache.org/httpcomponents-client-ga/logging.html#Wire_Logging)，该功能会将整个请求和响应记录到HttpClient中。Spring Boot具有用于执行此类操作的日志记录[通用应用程序属性](https://docs.spring.io/spring-boot/docs/current/reference/html/common-application-properties.html)，只需将其添加到您的应用程序属性中

```
logging.level.org.apache.http.wire=DEBUG
```

### 88.8.1如何调试WireMock发送的映射/请求/响应？

从版本`1.2.0`开始，我们将WireMock日志记录打开到info，而将WireMock通知程序打开为冗长。现在，您将完全知道WireMock服务器收到了什么请求，以及选择了哪个匹配的响应定义。

要关闭此功能，只需将WireMock日志记录更改为`ERROR`

```
logging.level.com.github.tomakehurst.wiremock=ERROR
```

### 88.8.2如何查看在HTTP服务器存根中注册了什么？

您可以使用`@AutoConfigureStubRunner`，`StubRunnerRule`或`StubRunnerExtension`上的`mappingsOutputFolder`属性来按工件ID转储所有映射。同样，将启动给定存根服务器的启动端口。

### 88.8.3我可以引用文件中的文本吗？

是! 在1.2.0版中，我们添加了这种可能性。在DSL中调用`file(…)`方法并提供相对于合同所在位置的路径就足够了。如果您使用的是YAML，则只需使用`bodyFromFile`属性。

## 89. Spring Cloud Contract验证程序设置

您可以通过以下方式设置Spring Cloud Contract验证程序：

- [作为Gradle项目](https://www.springcloud.cc/spring-cloud-greenwich.html#gradle-project)
- [作为Maven项目](https://www.springcloud.cc/spring-cloud-greenwich.html#maven-project)
- [作为Docker项目](https://www.springcloud.cc/spring-cloud-greenwich.html#docker-project)

## 89.1 Gradle项目

要了解如何为Spring Cloud Contract验证程序设置Gradle项目，请阅读以下部分：

- [第89.1.1节“前提条件”](https://www.springcloud.cc/spring-cloud-greenwich.html#gradle-prerequisites)
- [第90章，*添加具有依赖性的Gradle插件*](https://www.springcloud.cc/spring-cloud-greenwich.html#gradle-add-gradle-plugin)
- [第90.1节“ Gradle和“保证放心的2.0””](https://www.springcloud.cc/spring-cloud-greenwich.html#gradle-and-rest-assured)
- [第90.2节“ Gradle的快照版本”](https://www.springcloud.cc/spring-cloud-greenwich.html#gradle-snapshot-versions)
- [第90.3节“添加存根”](https://www.springcloud.cc/spring-cloud-greenwich.html#gradle-add-stubs)
- [第90.5节“默认设置”](https://www.springcloud.cc/spring-cloud-greenwich.html#gradle-default-setup)
- [第90.6节“配置插件”](https://www.springcloud.cc/spring-cloud-greenwich.html#gradle-configure-plugin)
- [第90.7节“配置选项”](https://www.springcloud.cc/spring-cloud-greenwich.html#gradle-configuration-options)
- [第90.8节“所有测试的单一基类”](https://www.springcloud.cc/spring-cloud-greenwich.html#gradle-single-base-class)
- [第90.9节“ Contracts的不同基类”](https://www.springcloud.cc/spring-cloud-greenwich.html#gradle-different-base-classes)
- [第90.10节“调用生成的测试”](https://www.springcloud.cc/spring-cloud-greenwich.html#gradle-invoking-generated-tests)
- [第90.11节“将存根推送到SCM”](https://www.springcloud.cc/spring-cloud-greenwich.html#gradle-pushing-stubs-to-scm)
- [第90.12节“消费者方的Spring Cloud Contract验证程序”](https://www.springcloud.cc/spring-cloud-greenwich.html#gradle-consumer)

### 89.1.1前提条件

为了将Spring Cloud Contract验证程序与WireMock一起使用，您必须使用Gradle或Maven插件。

| ![[警告]](/assets/images/springcloud/warning.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 如果要在项目中使用Spock，则必须分别添加`spock-core`和`spock-spring`模块。查看[Spock文档以获取更多信息](https://spockframework.github.io/) |

## 90.添加具有依赖性的Gradle插件

要添加具有依赖性的Gradle插件，可以使用类似于以下代码：

**插件DSL GA版本。** 

```
// build.gradle
plugins {
  id "groovy"
  // this will work only for GA versions of Spring Cloud Contract
  id "org.springframework.cloud.contract" version "${GAVerifierVersion}"
}

dependencyManagement {
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-contract-dependencies:${GAVerifierVersion}"
    }
}

dependencies {
    testCompile "org.codehaus.groovy:groovy-all:${groovyVersion}"
    // example with adding Spock core and Spock Spring
    testCompile "org.spockframework:spock-core:${spockVersion}"
    testCompile "org.spockframework:spock-spring:${spockVersion}"
    testCompile 'org.springframework.cloud:spring-cloud-starter-contract-verifier'
}
```



**插件DSL非GA版本。** 

```
// settings.gradle
pluginManagement {
    plugins {
        id "org.springframework.cloud.contract" version "${verifierVersion}"
    }
    repositories {
        // to pick from local .m2
        mavenLocal()
        // for snapshots
        maven { url "https://repo.spring.io/snapshot" }
        // for milestones
        maven { url "https://repo.spring.io/milestone" }
        // for GA versions
        gradlePluginPortal()
    }
}

// build.gradle
plugins {
  id "groovy"
  id "org.springframework.cloud.contract"
}

dependencyManagement {
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-contract-dependencies:${verifierVersion}"
    }
}

dependencies {
    testCompile "org.codehaus.groovy:groovy-all:${groovyVersion}"
    // example with adding Spock core and Spock Spring
    testCompile "org.spockframework:spock-core:${spockVersion}"
    testCompile "org.spockframework:spock-spring:${spockVersion}"
    testCompile 'org.springframework.cloud:spring-cloud-starter-contract-verifier'
}
```



**旧版插件应用程序。** 

```
// build.gradle
buildscript {
    repositories {
        mavenCentral()
    }
    dependencies {
        classpath "org.springframework.boot:spring-boot-gradle-plugin:${springboot_version}"
        classpath "org.springframework.cloud:spring-cloud-contract-gradle-plugin:${verifier_version}"
        // here you can also pass additional dependencies such as Pact or Kotlin spec e.g.:
        // classpath "org.springframework.cloud:spring-cloud-contract-spec-kotlin:${verifier_version}"
    }
}

apply plugin: 'groovy'
apply plugin: 'spring-cloud-contract'

dependencyManagement {
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-contract-dependencies:${verifier_version}"
    }
}

dependencies {
    testCompile "org.codehaus.groovy:groovy-all:${groovyVersion}"
    // example with adding Spock core and Spock Spring
    testCompile "org.spockframework:spock-core:${spockVersion}"
    testCompile "org.spockframework:spock-spring:${spockVersion}"
    testCompile 'org.springframework.cloud:spring-cloud-starter-contract-verifier'
}
```



## 90.1 Gradle和“保证放心” 2.0

默认情况下，Rest Assured 3.x被添加到类路径中。但是，要使用Rest Assured 2.x，可以将其添加到插件的classpath中，如下所示：

```
buildscript {
	repositories {
		mavenCentral()
	}
	dependencies {
	    classpath "org.springframework.boot:spring-boot-gradle-plugin:${springboot_version}"
		classpath "org.springframework.cloud:spring-cloud-contract-gradle-plugin:${verifier_version}"
		classpath "com.jayway.restassured:rest-assured:2.5.0"
		classpath "com.jayway.restassured:spring-mock-mvc:2.5.0"
	}
}

depenendencies {
    // all dependencies
    // you can exclude rest-assured from spring-cloud-contract-verifier
    testCompile "com.jayway.restassured:rest-assured:2.5.0"
    testCompile "com.jayway.restassured:spring-mock-mvc:2.5.0"
}
```

这样，插件会自动看到类路径中存在Rest Assured 2.x，并相应地修改了导入。

## Gradle的90.2快照版本

将其他快照存储库添加到build.gradle以使用快照版本，快照版本在每次成功构建后都会自动上传，如下所示：

```
/*
 We need to use the [buildscript {}] section when we have to modify
 the classpath for the plugins. If that's not the case this section
 can be skipped.

 If you don't need to modify the classpath (e.g. add a Pact dependency),
 then you can just set the [pluginManagement {}] section in [settings.gradle] file.

 // settings.gradle
 pluginManagement {
    repositories {
        // for snapshots
        maven {url "https://repo.spring.io/snapshot"}
        // for milestones
        maven {url "https://repo.spring.io/milestone"}
        // for GA versions
        gradlePluginPortal()
    }
 }

 */
buildscript {
    repositories {
        mavenCentral()
        mavenLocal()
        maven { url "https://repo.spring.io/snapshot" }
        maven { url "https://repo.spring.io/milestone" }
        maven { url "https://repo.spring.io/release" }
    }
}
```

## 90.3添加存根

默认情况下，Spring Cloud Contract验证程序在`src/test/resources/contracts`目录中寻找存根。

包含存根定义的目录被视为类名，每个存根定义均被视为单个测试。Spring Cloud Contract验证程序假定它包含至少一层要用作测试类名称的目录。如果存在多个嵌套目录，则使用除最后一个嵌套目录以外的所有目录作为包名。例如，具有以下结构：

```
src/test/resources/contracts/myservice/shouldCreateUser.groovy
src/test/resources/contracts/myservice/shouldReturnUser.groovy
```

Spring Cloud Contract验证程序使用两种方法创建名为`defaultBasePackage.MyService`的测试类：

- `shouldCreateUser()`
- `shouldReturnUser()`

## 90.4运行插件

该插件注册自己以在`check`任务之前被调用。如果您希望它成为构建过程的一部分，则无需执行其他任何操作。如果只想生成测试，请调用`generateContractTests`任务。

## 90.5默认设置

默认的Gradle插件设置会创建该版本的以下Gradle部分（以伪代码）：

```
contracts {
    testFramework ='JUNIT'
    testMode = 'MockMvc'
    generatedTestSourcesDir = project.file("${project.buildDir}/generated-test-sources/contracts")
    generatedTestResourcesDir = project.file("${project.buildDir}/generated-test-resources/contracts")
    contractsDslDir = file("${project.rootDir}/src/test/resources/contracts")
    basePackageForTests = 'org.springframework.cloud.verifier.tests'
    stubsOutputDir = project.file("${project.buildDir}/stubs")

    // the following properties are used when you want to provide where the JAR with contract lays
    contractDependency {
        stringNotation = ''
    }
    contractsPath = ''
    contractsWorkOffline = false
    contractRepository {
        cacheDownloadedContracts(true)
    }
}

tasks.create(type: Jar, name: 'verifierStubsJar', dependsOn: 'generateClientStubs') {
    baseName = project.name
    classifier = contracts.stubsSuffix
    from contractVerifier.stubsOutputDir
}

project.artifacts {
    archives task
}

tasks.create(type: Copy, name: 'copyContracts') {
    from contracts.contractsDslDir
    into contracts.stubsOutputDir
}

verifierStubsJar.dependsOn 'copyContracts'

publishing {
    publications {
        stubs(MavenPublication) {
            artifactId project.name
            artifact verifierStubsJar
        }
    }
}
```

## 90.6配置插件

要更改默认配置，请在Gradle配置中添加一个`contracts`代码段，如下所示：

```
contracts {
	testMode = 'MockMvc'
	baseClassForTests = 'org.mycompany.tests'
	generatedTestSourcesDir = project.file('src/generatedContract')
}
```

## 90.7配置选项

- **testMode**：定义验收测试的模式。默认情况下，模式是MockMvc，它基于Spring的MockMvc。对于真实的HTTP调用，也可以将其更改为 **WebTestClient**， **JaxRsClient**或 **Explicit**。
- **import**：创建一个带有导入的数组，该数组应包含在生成的测试中（例如['org.myorg.Matchers']）。默认情况下，它将创建一个空数组。
- **staticImports**：创建一个包含静态导入的数组，该数组应包含在生成的测试中（例如['org.myorg.Matchers。*']）。默认情况下，它将创建一个空数组。
- **basePackageForTests**：指定所有生成的测试的基本软件包。如果未设置，则从`baseClassForTests’s package and from`packageWithBaseClasses`中选择值。如果这些值均未设置，则该值设置为`org.springframework.cloud.contract.verifier.tests`。
- **baseClassForTests**：为所有生成的测试创建基类。默认情况下，如果您使用Spock类，则该类为`spock.lang.Specification`。
- **packageWithBaseClasses**：定义所有基类所在的包。此设置优先于 **baseClassForTests**。
- **baseClassMappings**：明确地将合同包映射到基类的FQN。此设置优先于 **packageWithBaseClasses**和 **baseClassForTests**。
- **ruleClassForTests**：指定应添加到生成的测试类的规则。
- **ignoreFiles**：使用`Antmatcher`来定义应跳过处理的存根文件。默认情况下，它是一个空数组。
- **ContractsDslDir**：指定包含使用GroovyDSL编写的合同的目录。默认情况下，其值为`$rootDir/src/test/resources/contracts`。
- **createdTestSourcesDir**：指定应放置从Groovy DSL生成的测试的测试源目录。默认情况下，其值为`$buildDir/generated-test-sources/contracts`。
- **createdTestResourcesDir**：指定测试资源目录，应该放置Groovy DSL生成的测试所使用的资源。默认情况下，其值为`$buildDir/generated-test-resources/contracts`。
- **stubsOutputDir**：指定应放置从Groovy DSL生成的WireMock存根的目录。
- **testFramework**：指定要使用的目标测试框架。当前，Spock，JUnit 4（`TestFramework.JUNIT`）和JUnit 5受支持，而JUnit 4是默认框架。
- **contractProperties**：包含要传递给Spring Cloud Contract组件的属性的映射。这些属性可能由内置或自定义存根下载器使用。

当您要指定包含合同的JAR的位置时，使用以下属性：

- **contractDependency**：指定提供`groupid:artifactid:version:classifier`坐标的依赖关系。您可以使用`contractDependency`闭包进行设置。
- **ContractsPath**：指定jar的路径。如果下载了合同依存关系，则路径默认为`groupid/artifactid`，其中`groupid`以斜杠分隔。否则，它将在提供的目录下扫描合同。
- **ContractsMode**：指定下载合同的方式（JAR是否可以脱机使用，远程使用等）。
- **deleteStubsAfterTest**：如果设置为`false`，则不会从临时目录中删除任何下载的合同

您可以在下面找到通过插件打开的实验功能列表：

- **convertToYaml**：将所有DSL转换为声明性的YAML格式。当您在Groovy DSL中使用外部库时，这可能非常有用。通过启用此功能（将其设置为`true`），您将不需要在使用者方面添加库依赖项。
- **assertJsonSize**：您可以在生成的测试中检查JSON数组的大小。默认情况下禁用此功能。

## 90.8所有测试的单一基类

在默认的MockMvc中使用Spring Cloud Contract验证程序时，您需要为所有生成的验收测试创建基本规范。在此类中，您需要指向一个端点，该端点应进行验证。

```
abstract class BaseMockMvcSpec extends Specification {

    def setup() {
        RestAssuredMockMvc.standaloneSetup(new PairIdController())
    }

    void isProperCorrelationId(Integer correlationId) {
        assert correlationId == 123456
    }

    void isEmpty(String value) {
        assert value == null
    }

}
```

如果使用`Explicit`模式，则可以使用基类来初始化整个测试的应用程序，就像在常规集成测试中看到的那样。如果使用`JAXRSCLIENT`模式，则此基类还应包含一个`protected WebTarget webTarget`字段。目前，测试JAX-RS API的唯一选项是启动web服务器。

## 90.9 Contracts的不同基类

如果合同之间的基类不同，则可以告诉Spring Cloud Contract插件自动生成的测试应扩展哪个类。您有两种选择：

- 遵循约定，提供`packageWithBaseClasses`
- 通过`baseClassMappings`提供显式映射

**按照惯例**

约定是这样的：如果您在`src/test/resources/contract/foo/bar/baz/`下拥有合同，并且将`packageWithBaseClasses`属性的值设置为`com.example.base`，则Spring Cloud Contract验证程序会假设存在一个`BarBazBase` `com.example.base`包下的类。换句话说，系统将获取包的最后两个部分（如果存在），并形成一个后缀为`Base`的类。此规则优先于**baseClassForTests**。这是一个在`contracts`闭包中如何工作的示例：

```
packageWithBaseClasses = 'com.example.base'
```

**通过映射**

您可以将合同包的正则表达式手动映射到匹配合同的基类的完全限定名称。您必须提供一个名为`baseClassMappings`的列表，该列表由`baseClassMapping`对象组成，这些对象采用从`contractPackageRegex`到`baseClassFQN`的映射。考虑以下示例：

```
baseClassForTests = "com.example.FooBase"
baseClassMappings {
    baseClassMapping('.*/com/.*', 'com.example.ComBase')
    baseClassMapping('.*/bar/.*': 'com.example.BarBase')
}
```

假设您的合同是-`src/test/resources/contract/com/`-`src/test/resources/contract/foo/`

通过提供`baseClassForTests`，我们可以在没有成功映射的情况下进行回退。（您也可以提供`packageWithBaseClasses`作为后备。）这样，从`src/test/resources/contract/com/`合约生成的测试扩展了`com.example.ComBase`，而其余测试扩展了`com.example.FooBase`。

## 90.10调用生成的测试

为了确保提供方符合已定义的合同，您需要调用：

```
./gradlew generateContractTests test
```

## 90.11将存根推送到SCM

如果您使用SCM存储库保留合同和存根，则可能需要自动化将存根推入存储库的步骤。为此，只需调用`pushStubsToScm`任务即可。例：

```
$ ./gradlew pushStubsToScm
```

在[第96.6节“使用SCM存根下载器”下，](https://www.springcloud.cc/spring-cloud-greenwich.html#scm-stub-downloader)您可以找到可以通过`contractsProperties`字段（例如`contracts { contractsProperties = [foo:"bar"] }`），通过`contractsProperties`方法（例如`contracts { contractsProperties([foo:"bar"]) }`）传递的所有可能的配置选项属性或环境变量。

## 90.12 Spring Cloud Contract使用者方面的验证者

在消费服务中，您需要以与提供者完全相同的方式配置Spring Cloud Contract Verifier插件。如果您不想使用Stub Runner，则需要复制存储在`src/test/resources/contracts`中的合同，并使用以下方法生成WireMock JSON存根：

```
./gradlew generateClientStubs
```

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 必须设置`stubsOutputDir`选项，才能生成存根。                 |

如果存在，JSON存根可以用于使用服务的自动化测试中。

```
@ContextConfiguration(loader == SpringApplicationContextLoader, classes == Application)
class LoanApplicationServiceSpec extends Specification {

 @ClassRule
 @Shared
 WireMockClassRule wireMockRule == new WireMockClassRule()

 @Autowired
 LoanApplicationService sut

 def 'should successfully apply for loan'() {
   given:
 	LoanApplication application =
			new LoanApplication(client: new Client(clientPesel: '12345678901'), amount: 123.123)
   when:
	LoanApplicationResult loanApplication == sut.loanApplication(application)
   then:
	loanApplication.loanApplicationStatus == LoanApplicationStatus.LOAN_APPLIED
	loanApplication.rejectionReason == null
 }
}
```

`LoanApplication`致电`FraudDetection`服务。该请求由配置有Spring Cloud Contract验证程序生成的存根的WireMock服务器处理。

## 90.13 Maven项目

要了解如何为Spring Cloud Contract验证程序设置Maven项目，请阅读以下部分：

- [第90.13.1节“添加maven插件”](https://www.springcloud.cc/spring-cloud-greenwich.html#maven-add-plugin)
- [第90.13.2节“ Maven和“保证放心2.0””](https://www.springcloud.cc/spring-cloud-greenwich.html#maven-rest-assured)
- [第90.13.3节“ Maven的快照版本”](https://www.springcloud.cc/spring-cloud-greenwich.html#maven-snapshot-versions)
- [第90.13.4节“添加存根”](https://www.springcloud.cc/spring-cloud-greenwich.html#maven-add-stubs)
- [第90.13.5节“运行插件”](https://www.springcloud.cc/spring-cloud-greenwich.html#maven-run-plugin)
- [第90.13.6节“配置插件”](https://www.springcloud.cc/spring-cloud-greenwich.html#maven-configure-plugin)
- [第90.13.7节“配置选项”](https://www.springcloud.cc/spring-cloud-greenwich.html#maven-configuration-options)
- [第90.13.8节“所有测试的单一基类”](https://www.springcloud.cc/spring-cloud-greenwich.html#maven-single-base)
- [第90.13.9节“合同的不同基类”](https://www.springcloud.cc/spring-cloud-greenwich.html#maven-different-base)
- [第90.13.10节，“调用生成的测试”](https://www.springcloud.cc/spring-cloud-greenwich.html#maven-invoking-generated-tests)
- [第90.13.11节，“将存根推送到SCM”](https://www.springcloud.cc/spring-cloud-greenwich.html#maven-pushing-stubs-to-scm)
- [第90.13.12节，“ Maven插件和STS”](https://www.springcloud.cc/spring-cloud-greenwich.html#maven-sts)

### 90.13.1添加Maven插件

以类似以下方式添加Spring Cloud Contract BOM：

```
<dependencyManagement>
	<dependencies>
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-dependencies</artifactId>
			<version>${spring-cloud-release.version}</version>
			<type>pom</type>
			<scope>import</scope>
		</dependency>
	</dependencies>
</dependencyManagement>
```

接下来，添加`Spring Cloud Contract Verifier` Maven插件：

```
<plugin>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-contract-maven-plugin</artifactId>
	<version>${spring-cloud-contract.version}</version>
	<extensions>true</extensions>
	<configuration>
		<packageWithBaseClasses>com.example.fraud</packageWithBaseClasses>
		<convertToYaml>true</convertToYaml>
	</configuration>
</plugin>
```

您可以在 [Spring Cloud Contract Maven插件文档（`2.0.0.RELEASE`版本的示例）中了解更多信息](https://cloud.spring.io/spring-cloud-static/spring-cloud-contract/2.0.0.RELEASE/spring-cloud-contract-maven-plugin/)。

### 90.13.2 Maven和“保证放心” 2.0

默认情况下，Rest Assured 3.x被添加到类路径中。但是，可以通过将Rest Assured 2.x添加到插件类路径中来使用它，如下所示：

```
<plugin>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-contract-maven-plugin</artifactId>
    <version>${spring-cloud-contract.version}</version>
    <extensions>true</extensions>
    <configuration>
        <packageWithBaseClasses>com.example</packageWithBaseClasses>
    </configuration>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-contract-verifier</artifactId>
            <version>${spring-cloud-contract.version}</version>
        </dependency>
        <dependency>
           <groupId>com.jayway.restassured</groupId>
           <artifactId>rest-assured</artifactId>
           <version>2.5.0</version>
           <scope>compile</scope>
        </dependency>
        <dependency>
           <groupId>com.jayway.restassured</groupId>
           <artifactId>spring-mock-mvc</artifactId>
           <version>2.5.0</version>
           <scope>compile</scope>
        </dependency>
    </dependencies>
</plugin>

<dependencies>
    <!-- all dependencies -->
    <!-- you can exclude rest-assured from spring-cloud-contract-verifier -->
    <dependency>
       <groupId>com.jayway.restassured</groupId>
       <artifactId>rest-assured</artifactId>
       <version>2.5.0</version>
       <scope>test</scope>
    </dependency>
    <dependency>
       <groupId>com.jayway.restassured</groupId>
       <artifactId>spring-mock-mvc</artifactId>
       <version>2.5.0</version>
       <scope>test</scope>
    </dependency>
</dependencies>
```

这样，插件会自动看到classpath中存在Rest Assured 3.x，并相应地修改了导入。

### Maven的90.13.3快照版本

对于Snapshot和Milestone版本，必须将以下部分添加到`pom.xml`中，如下所示：

```
<repositories>
    <repository>
        <id>spring-snapshots</id>
        <name>Spring Snapshots</name>
        <url>https://repo.spring.io/snapshot</url>
        <snapshots>
            <enabled>true</enabled>
        </snapshots>
    </repository>
    <repository>
        <id>spring-milestones</id>
        <name>Spring Milestones</name>
        <url>https://repo.spring.io/milestone</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </repository>
    <repository>
        <id>spring-releases</id>
        <name>Spring Releases</name>
        <url>https://repo.spring.io/release</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </repository>
</repositories>
<pluginRepositories>
    <pluginRepository>
        <id>spring-snapshots</id>
        <name>Spring Snapshots</name>
        <url>https://repo.spring.io/snapshot</url>
        <snapshots>
            <enabled>true</enabled>
        </snapshots>
    </pluginRepository>
    <pluginRepository>
        <id>spring-milestones</id>
        <name>Spring Milestones</name>
        <url>https://repo.spring.io/milestone</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </pluginRepository>
    <pluginRepository>
        <id>spring-releases</id>
        <name>Spring Releases</name>
        <url>https://repo.spring.io/release</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </pluginRepository>
</pluginRepositories>
```

### 90.13.4添加存根

默认情况下，Spring Cloud Contract验证程序正在`src/test/resources/contracts`目录中寻找存根。包含存根定义的目录被视为类名，每个存根定义均被视为单个测试。我们假定它至少包含一个目录用作测试类名称。如果嵌套目录有多个级别，则使用除最后一个嵌套目录之外的所有目录作为包名。例如，具有以下结构：

```
src/test/resources/contracts/myservice/shouldCreateUser.groovy
src/test/resources/contracts/myservice/shouldReturnUser.groovy
```

Spring Cloud Contract验证程序使用两种方法创建名为`defaultBasePackage.MyService`的测试类

- `shouldCreateUser()`
- `shouldReturnUser()`

### 90.13.5运行插件

插件目标`generateTests`被分配为在称为`generate-test-sources`的阶段中被调用。如果您希望它成为构建过程的一部分，则无需执行任何操作。如果只想生成测试，请调用`generateTests`目标。

### 90.13.6配置插件

要更改默认配置，只需在插件定义或`execution`定义中添加`configuration`部分，如下所示：

```
<plugin>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-contract-maven-plugin</artifactId>
    <executions>
        <execution>
            <goals>
                <goal>convert</goal>
                <goal>generateStubs</goal>
                <goal>generateTests</goal>
            </goals>
        </execution>
    </executions>
    <configuration>
        <basePackageForTests>org.springframework.cloud.verifier.twitter.place</basePackageForTests>
        <baseClassForTests>org.springframework.cloud.verifier.twitter.place.BaseMockMvcSpec</baseClassForTests>
    </configuration>
</plugin>
```

### 90.13.7配置选项

- **testMode**：定义验收测试的模式。默认情况下，模式是MockMvc，它基于Spring的MockMvc。对于真实的HTTP调用，也可以将其更改为 **WebTestClient**， **JaxRsClient**或 **Explicit**。
- **basePackageForTests**：指定所有生成的测试的基本软件包。如果未设置，则从`baseClassForTests’s package and from`packageWithBaseClasses`中选取值。如果这些值均未设置，则该值设置为`org.springframework.cloud.contract.verifier.tests`。
- **ruleClassForTests**：指定应添加到生成的测试类的规则。
- **baseClassForTests**：为所有生成的测试创建基类。默认情况下，如果使用Spock类，则该类为`spock.lang.Specification`。
- **contractDirectory**：指定一个目录，其中包含用GroovyDSL编写的合同。默认目录为`/src/test/resources/contracts`。
- **createdTestSourcesDir**：指定应放置从Groovy DSL生成的测试的测试源目录。默认情况下，其值为`$buildDir/generated-test-sources/contracts`。
- **createdTestResourcesDir**：指定测试资源目录，测试所使用的资源在该目录中生成
- **testFramework**：指定要使用的目标测试框架。当前，Spock，JUnit 4（`TestFramework.JUNIT`）和JUnit 5受支持，而JUnit 4是默认框架。
- **packageWithBaseClasses**：定义所有基类所在的包。此设置优先于 **baseClassForTests**。约定是这样的：如果您在（例如）`src/test/resources/contract/foo/bar/baz/`下拥有合同，并将`packageWithBaseClasses`属性的值设置为`com.example.base`，则Spring Cloud Contract Verifier假定存在一个`com.example.base`包下的`BarBazBase`类。换句话说，系统将获取包的最后两个部分（如果存在的话），并形成一个带有`Base`后缀的类。
- **baseClassMappings**：指定提供`contractPackageRegex`的基类映射的列表，该列表将根据合同所在的包进行检查，而`baseClassFQN`则映射到匹配的合同的基类的标准名称。例如，如果您在`src/test/resources/contract/foo/bar/baz/`下有一个合同并映射了属性`.* → com.example.base.BaseClass`，则从这些合同生成的测试类将扩展`com.example.base.BaseClass`。此设置优先于 **packageWithBaseClasses**和 **baseClassForTests**。
- **contractProperties**：包含要传递给Spring Cloud Contract组件的属性的映射。这些属性可能由内置或自定义存根下载器使用。

如果要从Maven存储库下载合同定义，则可以使用以下选项：

- **contractDependency**：包含所有打包合同的合同依赖关系。
- **ContractsPath**：具有打包合同的JAR中具体合同的路径。默认值为`groupid/artifactid`，其中`gropuid`以斜杠分隔。
- **ContractsMode**：选择将要找到并注册存根的模式
- **deleteStubsAfterTest**：如果设置为`false`，则不会从临时目录中删除任何下载的合同
- **contractRepositoryUrl**：包含合同的工件的仓库的URL。如果未提供，请使用当前的Maven。
- **contractRepositoryUsername**：用于通过合同连接到仓库的用户名。
- **contractRepositoryPassword**：用于通过合同连接到仓库的密码。
- **contractRepositoryProxyHost**：用于通过合同连接到仓库的代理主机。
- **ContractsRepositoryProxyPort**：用于通过合同连接到仓库的代理端口。

我们仅缓存非快照的显式提供的版本（例如，不会缓存`+`或`1.0.0.BUILD-SNAPSHOT`）。默认情况下，此功能处于打开状态。

您可以在下面找到通过插件打开的实验功能列表：

- **convertToYaml**：将所有DSL转换为声明性的YAML格式。当您在Groovy DSL中使用外部库时，这可能非常有用。通过启用此功能（将其设置为`true`），您将不需要在使用者端添加库依赖项。
- **assertJsonSize**：您可以在生成的测试中检查JSON数组的大小。默认情况下禁用此功能。

### 90.13.8所有测试的单一基类

在默认的MockMvc中使用Spring Cloud Contract验证程序时，您需要为所有生成的验收测试创建基本规范。在此类中，您需要指向一个端点，该端点应进行验证。

```
package org.mycompany.tests

import org.mycompany.ExampleSpringController
import com.jayway.restassured.module.mockmvc.RestAssuredMockMvc
import spock.lang.Specification

class MvcSpec extends Specification {
  def setup() {
   RestAssuredMockMvc.standaloneSetup(new ExampleSpringController())
  }
}
```

如果需要，您还可以设置整个上下文。

```
import io.restassured.module.mockmvc.RestAssuredMockMvc;
import org.junit.Before;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.web.context.WebApplicationContext;

@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT, classes = SomeConfig.class, properties="some=property")
public abstract class BaseTestClass {

    @Autowired
    WebApplicationContext context;

    @Before
    public void setup() {
        RestAssuredMockMvc.webAppContextSetup(this.context);
    }
}
```

如果使用`EXPLICIT`模式，则可以使用基类类似地初始化整个测试的应用程序，就像在常规集成测试中可能会发现的那样。

```
import io.restassured.RestAssured;
import org.junit.Before;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.server.LocalServerPort
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.web.context.WebApplicationContext;

@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT, classes = SomeConfig.class, properties="some=property")
public abstract class BaseTestClass {

    @LocalServerPort
    int port;

    @Before
    public void setup() {
        RestAssured.baseURI = "http://localhost:" + this.port;
    }
}
```

如果使用`JAXRSCLIENT`模式，则此基类还应包含一个`protected WebTarget webTarget`字段。目前，测试JAX-RS API的唯一选项是启动web服务器。

### 90.13.9合同的不同基类

如果合同之间的基类不同，则可以告诉Spring Cloud Contract插件自动生成的测试应扩展哪个类。您有两种选择：

- 遵循约定，提供`packageWithBaseClasses`
- 通过`baseClassMappings`提供显式映射

**按照惯例**

约定是这样的：如果您在`src/test/resources/contract/foo/bar/baz/`下拥有合同，并且将`packageWithBaseClasses`属性的值设置为`com.example.base`，则Spring Cloud Contract验证者会假设存在一个`BarBazBase`类（位于`com.example.base`包中）。换句话说，系统将获取包的最后两个部分（如果存在的话），并形成一个带有`Base`后缀的类。此规则优先于**baseClassForTests**。这是一个在`contracts`闭包中如何工作的示例：

```
<plugin>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-contract-maven-plugin</artifactId>
    <configuration>
        <packageWithBaseClasses>hello</packageWithBaseClasses>
    </configuration>
</plugin>
```

**通过映射**

您可以将合同包的正则表达式手动映射到匹配合同的基类的完全限定名称。您必须提供一个名为`baseClassMappings`的列表，该列表由`baseClassMapping`对象组成，这些对象采用从`contractPackageRegex`到`baseClassFQN`的映射。考虑以下示例：

```
<plugin>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-contract-maven-plugin</artifactId>
    <configuration>
        <baseClassForTests>com.example.FooBase</baseClassForTests>
        <baseClassMappings>
            <baseClassMapping>
                <contractPackageRegex>.*com.*</contractPackageRegex>
                <baseClassFQN>com.example.TestBase</baseClassFQN>
            </baseClassMapping>
        </baseClassMappings>
    </configuration>
</plugin>
```

假设您在以下两个位置拥有合同：* `src/test/resources/contract/com/` * `src/test/resources/contract/foo/`

通过提供`baseClassForTests`，我们可以进行后备，以防映射未成功。（您也可以提供`packageWithBaseClasses`作为后备。）这样，从`src/test/resources/contract/com/`合约生成的测试扩展了`com.example.ComBase`，而其余测试扩展了`com.example.FooBase`。

### 90.13.10调用生成的测试

Spring Cloud Contract Maven插件在名为`/generated-test-sources/contractVerifier`的目录中生成验证代码，并将该目录附加到`testCompile`目标。

对于Groovy Spock代码，请使用以下代码：

```
<plugin>
    <groupId>org.codehaus.gmavenplus</groupId>
    <artifactId>gmavenplus-plugin</artifactId>
    <version>1.5</version>
    <executions>
        <execution>
            <goals>
                <goal>testCompile</goal>
            </goals>
        </execution>
    </executions>
    <configuration>
        <testSources>
            <testSource>
                <directory>${project.basedir}/src/test/groovy</directory>
                <includes>
                    <include>**/*.groovy</include>
                </includes>
            </testSource>
            <testSource>
                <directory>${project.build.directory}/generated-test-sources/contractVerifier</directory>
                <includes>
                    <include>**/*.groovy</include>
                </includes>
            </testSource>
        </testSources>
    </configuration>
</plugin>
```

为确保提供方符合已定义的合同，您需要调用`mvn generateTest test`。

### 90.13.11将存根推送到SCM

如果您使用SCM存储库保留合同和存根，则可能需要自动化将存根推入存储库的步骤。为此，添加`pushStubsToScm`目标就足够了。例：

```
<plugin>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-contract-maven-plugin</artifactId>
    <version>${spring-cloud-contract.version}</version>
    <extensions>true</extensions>
    <configuration>
        <!-- Base class mappings etc. -->

        <!-- We want to pick contracts from a Git repository -->
        <contractsRepositoryUrl>git://https://github.com/spring-cloud-samples/spring-cloud-contract-nodejs-contracts-git.git</contractsRepositoryUrl>

        <!-- We reuse the contract dependency section to set up the path
        to the folder that contains the contract definitions. In our case the
        path will be /groupId/artifactId/version/contracts -->
        <contractDependency>
            <groupId>${project.groupId}</groupId>
            <artifactId>${project.artifactId}</artifactId>
            <version>${project.version}</version>
        </contractDependency>

        <!-- The contracts mode can't be classpath -->
        <contractsMode>REMOTE</contractsMode>
    </configuration>
    <executions>
        <execution>
            <phase>package</phase>
            <goals>
                <!-- By default we will not push the stubs back to SCM,
                you have to explicitly add it as a goal -->
                <goal>pushStubsToScm</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

在[第96.6节“使用SCM存根下载器”下，](https://www.springcloud.cc/spring-cloud-greenwich.html#scm-stub-downloader)您可以找到可以通过`<configuration><contractProperties>`映射，系统属性或环境变量传递的所有可能的配置选项。

### 90.13.12 Maven插件和STS

如果在使用STS时看到以下异常：

![STS异常](/assets/images/springcloud/sts_exception.png?lastModify=1665880539)

当您单击错误标记时，您应该看到类似以下内容：

```
 plugin:1.1.0.M1:convert:default-convert:process-test-resources) org.apache.maven.plugin.PluginExecutionException: Execution default-convert of goal org.springframework.cloud:spring-
 cloud-contract-maven-plugin:1.1.0.M1:convert failed. at org.apache.maven.plugin.DefaultBuildPluginManager.executeMojo(DefaultBuildPluginManager.java:145) at
 org.eclipse.m2e.core.internal.embedder.MavenImpl.execute(MavenImpl.java:331) at org.eclipse.m2e.core.internal.embedder.MavenImpl$11.call(MavenImpl.java:1362) at
...
 org.eclipse.core.internal.jobs.Worker.run(Worker.java:55) Caused by: java.lang.NullPointerException at
 org.eclipse.m2e.core.internal.builder.plexusbuildapi.EclipseIncrementalBuildContext.hasDelta(EclipseIncrementalBuildContext.java:53) at
 org.sonatype.plexus.build.incremental.ThreadBuildContext.hasDelta(ThreadBuildContext.java:59) at
```

为了解决此问题，请在`pom.xml`中提供以下部分：

```
<build>
    <pluginManagement>
        <plugins>
            <!--This plugin's configuration is used to store Eclipse m2e settings
                only. It has no influence on the Maven build itself. -->
            <plugin>
                <groupId>org.eclipse.m2e</groupId>
                <artifactId>lifecycle-mapping</artifactId>
                <version>1.0.0</version>
                <configuration>
                    <lifecycleMappingMetadata>
                        <pluginExecutions>
                             <pluginExecution>
                                <pluginExecutionFilter>
                                    <groupId>org.springframework.cloud</groupId>
                                    <artifactId>spring-cloud-contract-maven-plugin</artifactId>
                                    <versionRange>[1.0,)</versionRange>
                                    <goals>
                                        <goal>convert</goal>
                                    </goals>
                                </pluginExecutionFilter>
                                <action>
                                    <execute />
                                </action>
                             </pluginExecution>
                        </pluginExecutions>
                    </lifecycleMappingMetadata>
                </configuration>
            </plugin>
        </plugins>
    </pluginManagement>
</build>
```

### 90.13.13 Maven具有Spock测试的插件

您可以选择[Spock框架](http://spockframework.org/)来使用Maven和Gradle插件来创建和执行自动生成的合同验证测试。但是，尽管Gradle确实很简单，但是在Maven中，您将需要一些附加设置才能使测试正确编译和执行。

首先，您将必须使用诸如[GMavenPlus](https://github.com/groovy/GMavenPlus)插件之类的插件将Groovy添加到您的项目中。在GMavenPlus插件中，您将需要显式设置测试源，包括定义基本测试类的路径和添加了生成的合同测试的路径。请参考以下示例：

```
<plugin>
	<groupId>org.codehaus.gmavenplus</groupId>
	<artifactId>gmavenplus-plugin</artifactId>
	<version>1.6.1</version>
	<executions>
		<execution>
			<goals>
				<goal>compileTests</goal>
				<goal>addTestSources</goal>
			</goals>
		</execution>
	</executions>
	<configuration>
		<testSources>
			<testSource>
				<directory>${project.basedir}/src/test/groovy</directory>
				<includes>
					<include>**/*.groovy</include>
				</includes>
			</testSource>
			<testSource>
				<directory>
					${project.basedir}/target/generated-test-sources/contracts/com/example/beer
				</directory>
				<includes>
					<include>**/*.groovy</include>
					<include>**/*.gvy</include>
				</includes>
			</testSource>
		</testSources>
	</configuration>
	<dependencies>
		<dependency>
			<groupId>org.codehaus.groovy</groupId>
			<artifactId>groovy-all</artifactId>
			<version>2.4.15</version>
			<scope>runtime</scope>
			<type>pom</type>
		</dependency>
	</dependencies>
```

如果您坚持以`Spec`结尾测试类名称的Spock约定，则还需要调整Maven Surefire插件设置，如以下示例所示：

```

```

## 90.14存根和传递依赖项

Maven和Gradle插件添加了为您创建存根jar的任务。出现的一个问题是，当重用存根时，您可能会错误地导入该存根的所有依赖项。构建Maven工件时，即使您有几个罐子，它们也共享一个pom：

```
├── github-webhook-0.0.1.BUILD-20160903.075506-1-stubs.jar
├── github-webhook-0.0.1.BUILD-20160903.075506-1-stubs.jar.sha1
├── github-webhook-0.0.1.BUILD-20160903.075655-2-stubs.jar
├── github-webhook-0.0.1.BUILD-20160903.075655-2-stubs.jar.sha1
├── github-webhook-0.0.1.BUILD-SNAPSHOT.jar
├── github-webhook-0.0.1.BUILD-SNAPSHOT.pom
├── github-webhook-0.0.1.BUILD-SNAPSHOT-stubs.jar
├── ...
└── ...
```

使用这些依赖关系有三种可能性，以使传递依赖关系没有任何问题：

- 将所有应用程序依赖项标记为可选
- 为存根创建一个单独的artifactid
- 排除消费者方面的依赖

**将所有应用程序依赖项标记为可选**

如果在`github-webhook`应用程序中将所有依赖项标记为可选，则在另一个应用程序中包含`github-webhook`存根时（或当Stub Runner下载了该依赖项时），则因为所有依赖项是可选的，它们将不会下载。

**为存根创建单独的`artifactid`**

如果您创建单独的`artifactid`，则可以按照您希望的任何方式进行设置。例如，您可能决定完全没有依赖项。

**排除消费者方面的依赖**

作为使用者，如果将存根依赖项添加到类路径中，则可以显式排除不需要的依赖项。

## 90.15场景

您可以使用Spring Cloud Contract验证程序处理方案。您需要做的就是在创建合同时遵守正确的命名约定。约定要求在订货号后加上下划线。无论您使用的是YAML还是Groovy，这都会起作用。例：

```
my_contracts_dir\
  scenario1\
    1_login.groovy
    2_showCart.groovy
    3_logout.groovy
```

这样的树使Spring Cloud Contract验证程序生成名称为`scenario1`的WireMock场景，并执行以下三个步骤：

1. 登录为`Started`的登录指向...
2. 标记为`Step1`的showCart指向...
3. 标记为`Step2`的注销将关闭方案。

有关WireMock方案的更多详细信息，[请](https://wiremock.org/docs/stateful-behaviour/)参见 https://wiremock.org/docs/stateful-behaviour/

Spring Cloud Contract验证程序还会生成具有保证执行顺序的测试。

## 90.16 Docker项目

我们正在发布一个`springcloud/spring-cloud-contract` Docker映像，其中包含一个项目，该项目将生成测试并针对运行中的应用程序以`EXPLICIT`模式执行测试。

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| `EXPLICIT`模式意味着从合同生成的测试将发送真实请求，而不是模拟请求。 |

### 90.16.1 Maven，JAR和二进制存储的简短介绍

由于Docker映像可由非JVM项目使用，因此最好解释Spring Cloud Contract打包默认值背后的基本术语。

以下定义的一部分来自[Maven词汇表](https://maven.apache.org/glossary.html)

- `Project`：Maven根据项目进行思考。您将构建的所有内容都是项目。这些项目遵循定义明确的“项目对象模型”。项目可以依赖于其他项目，在这种情况下，后者称为“依赖项”。一个项目可能与几个子项目一致，但是这些子项目仍被视为项目。
- `Artifact`：工件是项目产生或使用的东西。Maven为项目产生的工件示例包括：JAR，源和二进制发行版。每个工件都由组ID和组内唯一的工件ID唯一标识。
- `JAR`：JAR代表Java ARchive。这是一种基于ZIP文件格式的格式。Spring Cloud Contract将合同和生成的存根打包到JAR文件中。
- `GroupId`：组ID是项目的通用唯一标识符。尽管这通常只是项目名称（例如commons-collections），但使用完全合格的软件包名称将其与具有类似名称的其他项目（例如org.apache.maven）区分开来会很有帮助。通常，`GroupId`发布到工件管理器时，将使用斜杠分隔并构成URL的一部分。例如，组ID `com.example`和工件ID `application`为`/com/example/application/`。
- `Classifier`：Maven依赖性表示法如下所示：`groupId:artifactId:version:classifier`。分类器是传递给依赖项的附加后缀。例如`stubs`，`sources`。相同的依存关系，例如`com.example:application`可能会产生多个因分类器而彼此不同的工件。
- `Artifact manager`：生成二进制文件/源代码/软件包时，希望它们可供其他人下载/引用或重用。在JVM的世界中，这些工件将是JAR，对于Ruby而言，它们是宝石，对于Docker，则是Docker映像。您可以将这些工件存储在管理器中。此类管理器的示例可以是[Artifactory](https://jfrog.com/artifactory/) 或[Nexus](https://www.sonatype.org/nexus/)。

### 90.16.2工作原理

该图像在`/contracts`文件夹下搜索合同。运行测试的输出将在`/spring-cloud-contract/build`文件夹下可用（对于调试目的很有用）。

您安装合同，传递环境变量就足够了，该映像将：

- 生成合同测试
- 针对提供的URL执行测试
- 生成[WireMock](https://github.com/tomakehurst/wiremock)存根
- （可选-默认情况下处于启用状态）将存根发布到Artifact Manager

#### 环境变量

Docker映像需要一些环境变量以指向您正在运行的应用程序，工件管理器实例等。

- `PROJECT_GROUP`-您的项目的组ID。默认为`com.example`
- `PROJECT_VERSION`-您项目的版本。默认为`0.0.1-SNAPSHOT`
- `PROJECT_NAME`-工件ID。默认为`example`
- `REPO_WITH_BINARIES_URL`-工件管理器的URL。默认值为`http://localhost:8081/artifactory/libs-release-local`，这是本地运行的[Artifactory](https://jfrog.com/artifactory/)的默认URL
- `REPO_WITH_BINARIES_USERNAME`-伪影管理器受保护时（可选）的用户名
- `REPO_WITH_BINARIES_PASSWORD`-安全工件管理器时的密码（可选）
- `PUBLISH_ARTIFACTS`-如果设置为`true`，则会将工件发布到二进制存储。默认为`true`。

当合同位于外部存储库中时，将使用这些环境变量。要启用此功能，必须设置`EXTERNAL_CONTRACTS_ARTIFACT_ID`环境变量。

- `EXTERNAL_CONTRACTS_GROUP_ID`-带有合同的项目的组ID。默认为`com.example`
- `EXTERNAL_CONTRACTS_ARTIFACT_ID`-带有合同的项目的工件ID。
- `EXTERNAL_CONTRACTS_CLASSIFIER`-带有合同的项目分类。默认为空
- `EXTERNAL_CONTRACTS_VERSION`-带有合同的项目版本。默认值为`+`，相当于选择最新的
- `EXTERNAL_CONTRACTS_REPO_WITH_BINARIES_URL`-工件管理器的URL。默认值为`REPO_WITH_BINARIES_URL` env var。如果未设置，则默认为`http://localhost:8081/artifactory/libs-release-local`，这是在本地运行的[Artifactory](https://jfrog.com/artifactory/)的默认URL
- `EXTERNAL_CONTRACTS_PATH`-包含合同的项目内给定项目的合同路径。默认为斜线分隔的`EXTERNAL_CONTRACTS_GROUP_ID`与`/`和`EXTERNAL_CONTRACTS_ARTIFACT_ID`串联在一起。例如，对于组ID `foo.bar`和工件ID `baz`，将导致`foo/bar/baz`合同路径。
- `EXTERNAL_CONTRACTS_WORK_OFFLINE`-如果设置为`true`，则将从容器的`.m2`中检索带有合同的工件。将本地`.m2`挂载为容器的`/root/.m2`路径上可用的卷。您不能同时设置`EXTERNAL_CONTRACTS_WORK_OFFLINE`和`EXTERNAL_CONTRACTS_REPO_WITH_BINARIES_URL`。

执行测试时使用以下环境变量：

- `APPLICATION_BASE_URL`-应该对其执行测试的URL。请记住，必须可以从Docker容器访问它（例如`localhost`将不起作用）
- `APPLICATION_USERNAME`-（可选）用于对应用程序进行基本身份验证的用户名
- `APPLICATION_PASSWORD`-（可选）用于对应用程序进行基本身份验证的密码

### 90.16.3使用示例

让我们看一个简单的MVC应用程序

```
$ git clone https://github.com/spring-cloud-samples/spring-cloud-contract-nodejs
$ cd bookstore
```

合同位于`/contracts`文件夹下。

### 90.16.4服务器端（nodejs）

因为我们要运行测试，所以我们可以执行：

```
$ npm test
```

但是，出于学习目的，让我们将其分为几部分：

```
# Stop docker infra (nodejs, artifactory)
$ ./stop_infra.sh
# Start docker infra (nodejs, artifactory)
$ ./setup_infra.sh

# Kill & Run app
$ pkill -f "node app"
$ nohup node app &

# Prepare environment variables
$ SC_CONTRACT_DOCKER_VERSION="..."
$ APP_IP="192.168.0.100"
$ APP_PORT="3000"
$ ARTIFACTORY_PORT="8081"
$ APPLICATION_BASE_URL="http://${APP_IP}:${APP_PORT}"
$ ARTIFACTORY_URL="http://${APP_IP}:${ARTIFACTORY_PORT}/artifactory/libs-release-local"
$ CURRENT_DIR="$( pwd )"
$ CURRENT_FOLDER_NAME=${PWD##*/}
$ PROJECT_VERSION="0.0.1.RELEASE"

# Execute contract tests
$ docker run  --rm -e "APPLICATION_BASE_URL=${APPLICATION_BASE_URL}" -e "PUBLISH_ARTIFACTS=true" -e "PROJECT_NAME=${CURRENT_FOLDER_NAME}" -e "REPO_WITH_BINARIES_URL=${ARTIFACTORY_URL}" -e "PROJECT_VERSION=${PROJECT_VERSION}" -v "${CURRENT_DIR}/contracts/:/contracts:ro" -v "${CURRENT_DIR}/node_modules/spring-cloud-contract/output:/spring-cloud-contract-output/" springcloud/spring-cloud-contract:"${SC_CONTRACT_DOCKER_VERSION}"

# Kill app
$ pkill -f "node app"
```

将会发生的是通过bash脚本：

- 基础设施将被建立（MongoDb，Artifactory）。在现实生活中，您只需运行带有模拟数据库的NodeJS应用程序。在此示例中，我们想展示如何立即受益于Spring Cloud Contract。
- 由于这些限制，合同也代表了有状态的情况
  - 第一个请求是`POST`，它导致数据被插入到数据库中
  - 第二个请求是`GET`，它返回带有一个先前插入的元素的数据列表
- NodeJS应用程序将启动（在端口`3000`上）
- 合同测试将通过Docker生成，并且测试将针对正在运行的应用程序执行
  - 合同将从`/contracts`文件夹中提取。
  - 测试执行的输出在`node_modules/spring-cloud-contract/output`下可用。
- 存根将被上传到Artifactory。您可以在[http：// localhost：8081 / artifactory / libs-release-local / com / example / bookstore / 0.0.1.RELEASE /中检出它们](http://localhost:8081/artifactory/libs-release-local/com/example/bookstore/0.0.1.RELEASE/)。存根将在这里[http：// localhost：8081 / artifactory / libs-release-local / com / example / bookstore / 0.0.1.RELEASE / bookstore-0.0.1.RELEASE-stubs.jar](http://localhost:8081/artifactory/libs-release-local/com/example/bookstore/0.0.1.RELEASE/bookstore-0.0.1.RELEASE-stubs.jar)。

要查看客户端的外观，请查看[第92.9节“ Stub Runner Docker”](https://www.springcloud.cc/spring-cloud-greenwich.html#stubrunner-docker)部分。

## 91. Spring Cloud Contract验证者消息

Spring Cloud Contract验证程序使您可以验证使用消息传递作为通信手段的应用程序。本文档中显示的所有集成都可以与Spring一起使用，但是您也可以创建自己的一个并使用它。

## 91.1集成

您可以使用以下四种集成配置之一：

- 阿帕奇骆驼
- Spring Integration
- Spring Cloud Stream
- Spring AMQP

由于我们使用Spring Boot，因此，如果您已将这些库之一添加到类路径中，则会自动设置所有消息传递配置。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 请记住将`@AutoConfigureMessageVerifier`放在生成的测试的基类上。否则，Spring Cloud Contract验证程序的消息传递部分将不起作用。 |      |

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 如果要使用Spring Cloud Stream，请记住对`org.springframework.cloud:spring-cloud-stream-test-support`添加依赖项，如下所示： |      |

**Maven.** 

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-stream-test-support</artifactId>
    <scope>test</scope>
</dependency>
```



**Gradle.** 

```
testCompile "org.springframework.cloud:spring-cloud-stream-test-support"
```



## 91.2手动集成测试

测试使用的主界面为`org.springframework.cloud.contract.verifier.messaging.MessageVerifier`。它定义了如何发送和接收消息。您可以创建自己的实现以实现相同的目标。

在测试中，您可以插入`ContractVerifierMessageExchange`以发送和接收遵循合同的消息。然后将`@AutoConfigureMessageVerifier`添加到测试中。这是一个例子：

```
@RunWith(SpringTestRunner.class)
@SpringBootTest
@AutoConfigureMessageVerifier
public static class MessagingContractTests {

  @Autowired
  private MessageVerifier verifier;
  ...
}
```

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 如果您的测试也需要存根，则`@AutoConfigureStubRunner`包括消息传递配置，因此您只需要一个注释。 |

## 91.3发布者方测试生成

DSL中包含`input`或`outputMessage`部分会导致在发布者方面创建测试。默认情况下，将创建JUnit 4测试。但是，也可以创建JUnit 5或Spock测试。

我们应考虑3种主要情况：

- 方案1：没有输入消息会生成输出消息。输出消息由应用程序内部的组件（例如，调度程序）触发。
- 方案2：输入消息触发输出消息。
- 方案3：输入消息已被使用，没有输出消息。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 对于不同的消息传递实现，传递给`messageFrom`或`sentTo`的目的地可能具有不同的含义。对于**流**和**集成**，首先**将**其解析为频道的`destination`。然后，如果没有这样的`destination`，则将其解析为频道名称。对于**Camel来说**，这是一个确定的组成部分（例如`jms`）。 |      |

### 91.3.1方案1：无输入消息

对于给定的合同：

**Groovy DSL。** 

```
            def contractDsl = Contract.make {
                label 'some_label'
                input {
                    triggeredBy('bookReturnedTriggered()')
                }
                outputMessage {
                    sentTo('activemq:output')
                    body('''{ "bookName" : "foo" }''')
                    headers {
                        header('BOOK-NAME', 'foo')
                        messagingContentType(applicationJson())
                    }
                }
            }
```



**YAML。** 

```
label: some_label
input:
  triggeredBy: bookReturnedTriggered
outputMessage:
  sentTo: activemq:output
  body:
    bookName: foo
  headers:
    BOOK-NAME: foo
    contentType: application/json
```



创建了以下JUnit测试：

```
                    '''
 // when:
  bookReturnedTriggered();

 // then:
  ContractVerifierMessage response = contractVerifierMessaging.receive("activemq:output");
  assertThat(response).isNotNull();
  assertThat(response.getHeader("BOOK-NAME")).isNotNull();
  assertThat(response.getHeader("BOOK-NAME").toString()).isEqualTo("foo");
  assertThat(response.getHeader("contentType")).isNotNull();
  assertThat(response.getHeader("contentType").toString()).isEqualTo("application/json");
 // and:
  DocumentContext parsedJson = JsonPath.parse(contractVerifierObjectMapper.writeValueAsString(response.getPayload()));
  assertThatJson(parsedJson).field("bookName").isEqualTo("foo");
'''
```

然后将创建以下Spock测试：

```
					'''
 when:
  bookReturnedTriggered()

 then:
  ContractVerifierMessage response = contractVerifierMessaging.receive('activemq:output')
  assert response != null
  response.getHeader('BOOK-NAME')?.toString()  == 'foo'
  response.getHeader('contentType')?.toString()  == 'application/json'
 and:
  DocumentContext parsedJson = JsonPath.parse(contractVerifierObjectMapper.writeValueAsString(response.payload))
  assertThatJson(parsedJson).field("bookName").isEqualTo("foo")

'''
```

### 91.3.2场景2：由输入触发的输出

对于给定的合同：

**Groovy DSL。** 

```
			def contractDsl = Contract.make {
				label 'some_label'
				input {
					messageFrom('jms:input')
					messageBody([
							bookName: 'foo'
					])
					messageHeaders {
						header('sample', 'header')
					}
				}
				outputMessage {
					sentTo('jms:output')
					body([
							bookName: 'foo'
					])
					headers {
						header('BOOK-NAME', 'foo')
					}
				}
			}
```



**YAML。** 

```
label: some_label
input:
  messageFrom: jms:input
  messageBody:
    bookName: 'foo'
  messageHeaders:
    sample: header
outputMessage:
  sentTo: jms:output
  body:
    bookName: foo
  headers:
    BOOK-NAME: foo
```



创建了以下JUnit测试：

```
                    '''
// given:
 ContractVerifierMessage inputMessage = contractVerifierMessaging.create(
  "{\\"bookName\\":\\"foo\\"}"
, headers()
  .header("sample", "header"));

// when:
 contractVerifierMessaging.send(inputMessage, "jms:input");

// then:
 ContractVerifierMessage response = contractVerifierMessaging.receive("jms:output");
 assertThat(response).isNotNull();
 assertThat(response.getHeader("BOOK-NAME")).isNotNull();
 assertThat(response.getHeader("BOOK-NAME").toString()).isEqualTo("foo");
// and:
 DocumentContext parsedJson = JsonPath.parse(contractVerifierObjectMapper.writeValueAsString(response.getPayload()));
 assertThatJson(parsedJson).field("bookName").isEqualTo("foo");
'''
```

然后将创建以下Spock测试：

```
                    """\
given:
   ContractVerifierMessage inputMessage = contractVerifierMessaging.create(
    '''{"bookName":"foo"}''',
    ['sample': 'header']
  )

when:
   contractVerifierMessaging.send(inputMessage, 'jms:input')

then:
   ContractVerifierMessage response = contractVerifierMessaging.receive('jms:output')
   assert response !- null
   response.getHeader('BOOK-NAME')?.toString()  == 'foo'
and:
   DocumentContext parsedJson = JsonPath.parse(contractVerifierObjectMapper.writeValueAsString(response.payload))
   assertThatJson(parsedJson).field("bookName").isEqualTo("foo")
"""
```

### 91.3.3方案3：无输出消息

对于给定的合同：

**Groovy DSL。** 

```
            def contractDsl = Contract.make {
                label 'some_label'
                input {
                    messageFrom('jms:delete')
                    messageBody([
                            bookName: 'foo'
                    ])
                    messageHeaders {
                        header('sample', 'header')
                    }
                    assertThat('bookWasDeleted()')
                }
            }
```



**YAML。** 

```
label: some_label
input:
  messageFrom: jms:delete
  messageBody:
    bookName: 'foo'
  messageHeaders:
    sample: header
  assertThat: bookWasDeleted()
```



创建了以下JUnit测试：

```
					'''
// given:
 ContractVerifierMessage inputMessage = contractVerifierMessaging.create(
	"{\\"bookName\\":\\"foo\\"}"
, headers()
	.header("sample", "header"));

// when:
 contractVerifierMessaging.send(inputMessage, "jms:delete");

// then:
 bookWasDeleted();
'''
```

然后将创建以下Spock测试：

```
                    '''
given:
     ContractVerifierMessage inputMessage = contractVerifierMessaging.create(
        \'\'\'{"bookName":"foo"}\'\'\',
        ['sample': 'header']
    )

when:
     contractVerifierMessaging.send(inputMessage, 'jms:delete')

then:
     noExceptionThrown()
     bookWasDeleted()
'''
```

## 91.4消费者存根生成

与HTTP部分不同，在消息传递中，我们需要使用存根在{{JAR}}中发布Groovy DSL。然后在用户端对其进行解析，并创建正确的存根路由。

有关更多信息，请参见[第93章，*消息传递的Stub Runner*](https://www.springcloud.cc/spring-cloud-greenwich.html#stub-runner-for-messaging)部分。

**Maven.** 

```
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-stream-rabbit</artifactId>
    </dependency>

    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-contract-stub-runner</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-stream-test-support</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>Greenwich.BUILD-SNAPSHOT</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```



**Gradle.** 

```
ext {
    contractsDir = file("mappings")
    stubsOutputDirRoot = file("${project.buildDir}/production/${project.name}-stubs/")
}

// Automatically added by plugin:
// copyContracts - copies contracts to the output folder from which JAR will be created
// verifierStubsJar - JAR with a provided stub suffix
// the presented publication is also added by the plugin but you can modify it as you wish

publishing {
    publications {
        stubs(MavenPublication) {
            artifactId "${project.name}-stubs"
            artifact verifierStubsJar
        }
    }
}
```



## 92. Spring Cloud Contract Stub Runner

使用Spring Cloud Contract验证程序时，您可能会遇到的问题之一是将生成的WireMock JSON存根从服务器端传递到客户端（或传递到各种客户端）。在客户端的消息传递方面也发生了同样的事情。

复制JSON文件并设置客户端手动进行消息传递是不可能的。这就是为什么我们引入了Spring Cloud Contract Stub Runner。它可以自动为您下载并运行存根。

## 92.1快照版本

将其他快照存储库添加到您的`build.gradle`文件中以使用快照版本，快照版本在每次成功构建后都会自动上载：

**Maven.** 

```
<repositories>
    <repository>
        <id>spring-snapshots</id>
        <name>Spring Snapshots</name>
        <url>https://repo.spring.io/snapshot</url>
        <snapshots>
            <enabled>true</enabled>
        </snapshots>
    </repository>
    <repository>
        <id>spring-milestones</id>
        <name>Spring Milestones</name>
        <url>https://repo.spring.io/milestone</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </repository>
    <repository>
        <id>spring-releases</id>
        <name>Spring Releases</name>
        <url>https://repo.spring.io/release</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </repository>
</repositories>
<pluginRepositories>
    <pluginRepository>
        <id>spring-snapshots</id>
        <name>Spring Snapshots</name>
        <url>https://repo.spring.io/snapshot</url>
        <snapshots>
            <enabled>true</enabled>
        </snapshots>
    </pluginRepository>
    <pluginRepository>
        <id>spring-milestones</id>
        <name>Spring Milestones</name>
        <url>https://repo.spring.io/milestone</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </pluginRepository>
    <pluginRepository>
        <id>spring-releases</id>
        <name>Spring Releases</name>
        <url>https://repo.spring.io/release</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </pluginRepository>
</pluginRepositories>
```



**Gradle.** 

```
/*
 We need to use the [buildscript {}] section when we have to modify
 the classpath for the plugins. If that's not the case this section
 can be skipped.

 If you don't need to modify the classpath (e.g. add a Pact dependency),
 then you can just set the [pluginManagement {}] section in [settings.gradle] file.

 // settings.gradle
 pluginManagement {
    repositories {
        // for snapshots
        maven {url "https://repo.spring.io/snapshot"}
        // for milestones
        maven {url "https://repo.spring.io/milestone"}
        // for GA versions
        gradlePluginPortal()
    }
 }

 */
buildscript {
	repositories {
		mavenCentral()
		mavenLocal()
		maven { url "https://repo.spring.io/snapshot" }
		maven { url "https://repo.spring.io/milestone" }
		maven { url "https://repo.spring.io/release" }
	}
```



## 92.2将存根发布为JAR

最简单的方法是集中存根的保存方式。例如，您可以将它们作为罐子保存在Maven存储库中。

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 对于Maven和Gradle而言，该设置均可使用。但是，您可以根据需要自定义它。 |

**Maven.** 

```
<!-- First disable the default jar setup in the properties section -->
<!-- we don't want the verifier to do a jar for us -->
<spring.cloud.contract.verifier.skip>true</spring.cloud.contract.verifier.skip>

<!-- Next add the assembly plugin to your build -->
<!-- we want the assembly plugin to generate the JAR -->
<plugin>
	<groupId>org.apache.maven.plugins</groupId>
	<artifactId>maven-assembly-plugin</artifactId>
	<executions>
		<execution>
			<id>stub</id>
			<phase>prepare-package</phase>
			<goals>
				<goal>single</goal>
			</goals>
			<inherited>false</inherited>
			<configuration>
				<attach>true</attach>
				<descriptors>
					$../../../../src/assembly/stub.xml
				</descriptors>
			</configuration>
		</execution>
	</executions>
</plugin>

<!-- Finally setup your assembly. Below you can find the contents of src/main/assembly/stub.xml -->
<assembly
	xmlns="http://maven.apache.org/plugins/maven-assembly-plugin/assembly/1.1.3"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/plugins/maven-assembly-plugin/assembly/1.1.3 https://maven.apache.org/xsd/assembly-1.1.3.xsd">
	<id>stubs</id>
	<formats>
		<format>jar</format>
	</formats>
	<includeBaseDirectory>false</includeBaseDirectory>
	<fileSets>
		<fileSet>
			<directory>src/main/java</directory>
			<outputDirectory>/</outputDirectory>
			<includes>
				<include>**com/example/model/*.*</include>
			</includes>
		</fileSet>
		<fileSet>
			<directory>${project.build.directory}/classes</directory>
			<outputDirectory>/</outputDirectory>
			<includes>
				<include>**com/example/model/*.*</include>
			</includes>
		</fileSet>
		<fileSet>
			<directory>${project.build.directory}/snippets/stubs</directory>
			<outputDirectory>META-INF/${project.groupId}/${project.artifactId}/${project.version}/mappings</outputDirectory>
			<includes>
				<include>**/*</include>
			</includes>
		</fileSet>
		<fileSet>
			<directory>$../../../../src/test/resources/contracts</directory>
			<outputDirectory>META-INF/${project.groupId}/${project.artifactId}/${project.version}/contracts</outputDirectory>
			<includes>
				<include>**/*.groovy</include>
			</includes>
		</fileSet>
	</fileSets>
</assembly>
```



**Gradle.** 

```
ext {
	contractsDir = file("mappings")
	stubsOutputDirRoot = file("${project.buildDir}/production/${project.name}-stubs/")
}

// Automatically added by plugin:
// copyContracts - copies contracts to the output folder from which JAR will be created
// verifierStubsJar - JAR with a provided stub suffix
// the presented publication is also added by the plugin but you can modify it as you wish

publishing {
	publications {
		stubs(MavenPublication) {
			artifactId "${project.name}-stubs"
			artifact verifierStubsJar
		}
	}
}
```



## 92.3 Stub Runner核心

为服务合作者运行存根。将存根视为服务合同可将存根运行器用作 [消费者驱动Contracts的实现](https://martinfowler.com/articles/consumerDrivenContracts.html)。

Stub Runner允许您自动下载提供的依赖项的存根（或从类路径中选择它们），为它们启动WireMock服务器，并使用正确的存根定义来提供它们。对于消息传递，定义了特殊的存根路由。

### 92.3.1检索存根

您可以选择以下获取存根的选项

- 基于醚的解决方案，可从Artifactory / Nexus下载带有存根的JAR
- 类路径扫描解决方案，可通过模式搜索类路径以检索存根
- 编写自己的`org.springframework.cloud.contract.stubrunner.StubDownloaderBuilder`实现以进行完全自定义

后一个示例在“ [自定义Stub Runner”](https://www.springcloud.cc/spring-cloud-greenwich.html#)部分中进行了描述。

#### 存根下载

您可以通过`stubsMode`开关控制存根下载。它从`StubRunnerProperties.StubsMode`枚举中选择值。您可以使用以下选项

- `StubRunnerProperties.StubsMode.CLASSPATH`（默认值）-将从类路径中选择存根
- `StubRunnerProperties.StubsMode.LOCAL`-将从本地存储区中选择存根（例如`.m2`）
- `StubRunnerProperties.StubsMode.REMOTE`-将从远程位置选择存根

例：

```
@AutoConfigureStubRunner(repositoryRoot="https://foo.bar", ids = "com.example:beer-api-producer:+:stubs:8095", stubsMode = StubRunnerProperties.StubsMode.LOCAL)
```

#### 类路径扫描

如果将`stubsMode`属性设置为`StubRunnerProperties.StubsMode.CLASSPATH`（或由于默认值`CLASSPATH`而未设置任何内容），则将扫描类路径。让我们看下面的例子：

```
@AutoConfigureStubRunner(ids = {
    "com.example:beer-api-producer:+:stubs:8095",
    "com.example.foo:bar:1.0.0:superstubs:8096"
})
```

如果您已将依赖项添加到类路径中

**Maven.** 

```
<dependency>
    <groupId>com.example</groupId>
    <artifactId>beer-api-producer-restdocs</artifactId>
    <classifier>stubs</classifier>
    <version>0.0.1-SNAPSHOT</version>
    <scope>test</scope>
    <exclusions>
        <exclusion>
            <groupId>*</groupId>
            <artifactId>*</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>com.example.foo</groupId>
    <artifactId>bar</artifactId>
    <classifier>superstubs</classifier>
    <version>1.0.0</version>
    <scope>test</scope>
    <exclusions>
        <exclusion>
            <groupId>*</groupId>
            <artifactId>*</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```



**Gradle.** 

```
testCompile("com.example:beer-api-producer-restdocs:0.0.1-SNAPSHOT:stubs") {
    transitive = false
}
testCompile("com.example.foo:bar:1.0.0:superstubs") {
    transitive = false
}
```



然后，将扫描您的类路径上的以下位置。对于`com.example:beer-api-producer-restdocs`

- /META-INF/com.example/beer-api-producer-restdocs/ *** /** *。
- /contracts/com.example/beer-api-producer-restdocs/ *** /** *。
- /mappings/com.example/beer-api-producer-restdocs/ *** /** *。

和`com.example.foo:bar`

- /META-INF/com.example.foo/bar/ *** /** *。
- /contracts/com.example.foo/bar/ *** /** *。
- /mappings/com.example.foo/bar/ *** /** *。

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 如您所见，打包生产者存根时必须显式提供组和工件ID。           |

生产者将像这样设置合同：

```
└── src
    └── test
        └── resources
            └── contracts
                └── com.example
                    └── beer-api-producer-restdocs
                        └── nested
                            └── contract3.groovy
```

要实现正确的存根包装。

或使用[Maven `assembly`插件](https://github.com/spring-cloud-samples/spring-cloud-contract-samples/blob/2.1.x/producer_with_restdocs/pom.xml)或 [Gradle Jar](https://github.com/spring-cloud-samples/spring-cloud-contract-samples/blob/2.1.x/producer_with_restdocs/build.gradle)任务，您必须在存根jar中创建以下结构。

```
└── META-INF
    └── com.example
        └── beer-api-producer-restdocs
            └── 2.0.0
                ├── contracts
                │   └── nested
                │       └── contract2.groovy
                └── mappings
                    └── mapping.json
```

通过维护这种结构，可以扫描类路径，而无需下载工件即可从消息传递/ HTTP存根中受益。

#### 配置HTTP服务器存根

Stub Runner具有`HttpServerStub`的概念，该概念抽象了HTTP服务器的底层具体实现（例如，WireMock是实现之一）。有时，您需要对存根服务器执行一些其他调整，这对于给定的实现而言是具体的。为此，Stub Runner为您提供了`httpServerStubConfigurer`属性，该属性在批注JUnit规则中可用，并且可以通过系统属性进行访问，您可以在其中提供`org.springframework.cloud.contract.stubrunner.HttpServerStubConfigurer`接口的实现。这些实现可以更改给定HTTP服务器存根的配置文件。

Spring Cloud Contract Stub Runner带有一个可以扩展的实现，适用于WireMock-`org.springframework.cloud.contract.stubrunner.provider.wiremock.WireMockHttpServerStubConfigurer`。在`configure`方法中，您可以为给定的存根提供自己的自定义配置。用例可能是在HTTPs端口上为给定的工件ID启动WireMock。例：

**WireMockHttpServerStubConfigurer实现。** 

```
@CompileStatic
static class HttpsForFraudDetection extends WireMockHttpServerStubConfigurer {

    private static final Log log = LogFactory.getLog(HttpsForFraudDetection)

    @Override
    WireMockConfiguration configure(WireMockConfiguration httpStubConfiguration, HttpServerStubConfiguration httpServerStubConfiguration) {
        if (httpServerStubConfiguration.stubConfiguration.artifactId == "fraudDetectionServer") {
            int httpsPort = SocketUtils.findAvailableTcpPort()
            log.info("Will set HTTPs port [" + httpsPort + "] for fraud detection server")
            return httpStubConfiguration
                    .httpsPort(httpsPort)
        }
        return httpStubConfiguration
    }
}
```



然后，您可以通过注释重用它

```
@AutoConfigureStubRunner(mappingsOutputFolder = "target/outputmappings/",
        httpServerStubConfigurer = HttpsForFraudDetection)
```

只要找到一个https端口，它将优先于http端口。

### 92.3.2运行存根

#### 使用主应用程序运行

您可以为主类设置以下选项：

```
-c, --classifier                Suffix for the jar containing stubs (e.
                                  g. 'stubs' if the stub jar would
                                  have a 'stubs' classifier for stubs:
                                  foobar-stubs ). Defaults to 'stubs'
                                  (default: stubs)
--maxPort, --maxp <Integer>     Maximum port value to be assigned to
                                  the WireMock instance. Defaults to
                                  15000 (default: 15000)
--minPort, --minp <Integer>     Minimum port value to be assigned to
                                  the WireMock instance. Defaults to
                                  10000 (default: 10000)
-p, --password                  Password to user when connecting to
                                  repository
--phost, --proxyHost            Proxy host to use for repository
                                  requests
--pport, --proxyPort [Integer]  Proxy port to use for repository
                                  requests
-r, --root                      Location of a Jar containing server
                                  where you keep your stubs (e.g. http:
                                  //nexus.
                                  net/content/repositories/repository)
-s, --stubs                     Comma separated list of Ivy
                                  representation of jars with stubs.
                                  Eg. groupid:artifactid1,groupid2:
                                  artifactid2:classifier
--sm, --stubsMode               Stubs mode to be used. Acceptable values
                                  [CLASSPATH, LOCAL, REMOTE]
-u, --username                  Username to user when connecting to
                                  repository
```

#### HTTP存根

存根在JSON文档中定义，其语法在[WireMock文档中](http://wiremock.org/stubbing.html)定义

例：

```
{
    "request": {
        "method": "GET",
        "url": "/ping"
    },
    "response": {
        "status": 200,
        "body": "pong",
        "headers": {
            "Content-Type": "text/plain"
        }
    }
}
```

#### 查看注册的映射

每个存根协作者都会在`__/admin/`端点下公开已定义映射的列表。

您还可以使用`mappingsOutputFolder`属性将映射转储到文件。对于基于注释的方法，它看起来像这样

```
@AutoConfigureStubRunner(ids="a.b.c:loanIssuance,a.b.c:fraudDetectionServer",
mappingsOutputFolder = "target/outputmappings/")
```

对于这样的JUnit方法：

```
@ClassRule @Shared StubRunnerRule rule = new StubRunnerRule()
            .repoRoot("http://some_url")
            .downloadStub("a.b.c", "loanIssuance")
            .downloadStub("a.b.c:fraudDetectionServer")
            .withMappingsOutputFolder("target/outputmappings")
```

然后，如果您检出文件夹`target/outputmappings`，则会看到以下结构

```
.
├── fraudDetectionServer_13705
└── loanIssuance_12255
```

这意味着注册了两个存根。`fraudDetectionServer`在端口`13705`上注册，`loanIssuance`在端口`12255`上注册。如果我们看一下其中一个文件，我们将看到（对于WireMock）可用于给定服务器的映射：

```
[{
  "id" : "f9152eb9-bf77-4c38-8289-90be7d10d0d7",
  "request" : {
    "url" : "/name",
    "method" : "GET"
  },
  "response" : {
    "status" : 200,
    "body" : "fraudDetectionServer"
  },
  "uuid" : "f9152eb9-bf77-4c38-8289-90be7d10d0d7"
},
...
]
```

#### 信息存根

根据提供的Stub Runner依赖性和DSL，将自动设置消息传递路由。

## 92.4 Stub Runner JUnit规则和Stub Runner JUnit5扩展

Stub Runner带有JUnit规则，因此您可以很容易地下载和运行给定组和工件ID的存根：

```
@ClassRule
public static StubRunnerRule rule = new StubRunnerRule().repoRoot(repoRoot())
        .stubsMode(StubRunnerProperties.StubsMode.REMOTE)
        .downloadStub("org.springframework.cloud.contract.verifier.stubs",
                "loanIssuance")
        .downloadStub(
                "org.springframework.cloud.contract.verifier.stubs:fraudDetectionServer");

@BeforeClass
@AfterClass
public static void setupProps() {
    System.clearProperty("stubrunner.repository.root");
    System.clearProperty("stubrunner.classifier");
}
```

JUnit 5也有一个`StubRunnerExtension`。`StubRunnerRule`和`StubRunnerExtension`的工作方式非常相似。执行完规则/扩展名后，Stub Runner将连接到Maven存储库，并针对给定的依赖项列表尝试执行以下操作：

- 下载它们
- 本地缓存它们
- 将它们解压缩到一个临时文件夹
- 从提供的端口范围/提供的端口中为随机端口上的每个Maven依赖项启动WireMock服务器
- 向WireMock服务器提供有效的WireMock定义的所有JSON文件
- 也可以发送消息（记住要通过`MessageVerifier`接口的实现）

Stub Runner使用[Eclipse Aether](https://wiki.eclipse.org/Aether)机制下载Maven依赖项。查看他们的[文档](https://wiki.eclipse.org/Aether)以获取更多信息。

由于`StubRunnerRule`和`StubRunnerExtension`实现了`StubFinder`，因此它们使您可以找到已启动的存根：

```
package org.springframework.cloud.contract.stubrunner;

import java.net.URL;
import java.util.Collection;
import java.util.Map;

import org.springframework.cloud.contract.spec.Contract;

/**
 * Contract for finding registered stubs.
 *
 * @author Marcin Grzejszczak
 */
public interface StubFinder extends StubTrigger {

    /**
     * For the given groupId and artifactId tries to find the matching URL of the running
     * stub.
     * @param groupId - might be null. In that case a search only via artifactId takes
     * place
     * @param artifactId - artifact id of the stub
     * @return URL of a running stub or throws exception if not found
     * @throws StubNotFoundException in case of not finding a stub
     */
    URL findStubUrl(String groupId, String artifactId) throws StubNotFoundException;

    /**
     * For the given Ivy notation {@code [groupId]:artifactId:[version]:[classifier]}
     * tries to find the matching URL of the running stub. You can also pass only
     * {@code artifactId}.
     * @param ivyNotation - Ivy representation of the Maven artifact
     * @return URL of a running stub or throws exception if not found
     * @throws StubNotFoundException in case of not finding a stub
     */
    URL findStubUrl(String ivyNotation) throws StubNotFoundException;

    /**
     * @return all running stubs
     */
    RunningStubs findAllRunningStubs();

    /**
     * @return the list of Contracts
     */
    Map<StubConfiguration, Collection<Contract>> getContracts();

}
```

Spock测试中的用法示例：

```
@ClassRule
@Shared
StubRunnerRule rule = new StubRunnerRule()
		.stubsMode(StubRunnerProperties.StubsMode.REMOTE)
		.repoRoot(StubRunnerRuleSpec.getResource("/m2repo/repository").toURI().toString())
		.downloadStub("org.springframework.cloud.contract.verifier.stubs", "loanIssuance")
		.downloadStub("org.springframework.cloud.contract.verifier.stubs:fraudDetectionServer")
		.withMappingsOutputFolder("target/outputmappingsforrule")


def 'should start WireMock servers'() {
	expect: 'WireMocks are running'
		rule.findStubUrl('org.springframework.cloud.contract.verifier.stubs', 'loanIssuance') != null
		rule.findStubUrl('loanIssuance') != null
		rule.findStubUrl('loanIssuance') == rule.findStubUrl('org.springframework.cloud.contract.verifier.stubs', 'loanIssuance')
		rule.findStubUrl('org.springframework.cloud.contract.verifier.stubs:fraudDetectionServer') != null
	and:
		rule.findAllRunningStubs().isPresent('loanIssuance')
		rule.findAllRunningStubs().isPresent('org.springframework.cloud.contract.verifier.stubs', 'fraudDetectionServer')
		rule.findAllRunningStubs().isPresent('org.springframework.cloud.contract.verifier.stubs:fraudDetectionServer')
	and: 'Stubs were registered'
		"${rule.findStubUrl('loanIssuance').toString()}/name".toURL().text == 'loanIssuance'
		"${rule.findStubUrl('fraudDetectionServer').toString()}/name".toURL().text == 'fraudDetectionServer'
}

def 'should output mappings to output folder'() {
	when:
		def url = rule.findStubUrl('fraudDetectionServer')
	then:
		new File("target/outputmappingsforrule", "fraudDetectionServer_${url.port}").exists()
}
```

JUnit测试中的用法示例：

```
    @Test
    public void should_start_wiremock_servers() throws Exception {
        // expect: 'WireMocks are running'
        then(rule.findStubUrl("org.springframework.cloud.contract.verifier.stubs",
                "loanIssuance")).isNotNull();
        then(rule.findStubUrl("loanIssuance")).isNotNull();
        then(rule.findStubUrl("loanIssuance")).isEqualTo(rule.findStubUrl(
                "org.springframework.cloud.contract.verifier.stubs", "loanIssuance"));
        then(rule.findStubUrl(
                "org.springframework.cloud.contract.verifier.stubs:fraudDetectionServer"))
                        .isNotNull();
        // and:
        then(rule.findAllRunningStubs().isPresent("loanIssuance")).isTrue();
        then(rule.findAllRunningStubs().isPresent(
                "org.springframework.cloud.contract.verifier.stubs",
                "fraudDetectionServer")).isTrue();
        then(rule.findAllRunningStubs().isPresent(
                "org.springframework.cloud.contract.verifier.stubs:fraudDetectionServer"))
                        .isTrue();
        // and: 'Stubs were registered'
        then(httpGet(rule.findStubUrl("loanIssuance").toString() + "/name"))
                .isEqualTo("loanIssuance");
        then(httpGet(rule.findStubUrl("fraudDetectionServer").toString() + "/name"))
                .isEqualTo("fraudDetectionServer");
    }

    private String httpGet(String url) throws Exception {
        try (InputStream stream = URI.create(url).toURL().openStream()) {
            return StreamUtils.copyToString(stream, Charset.forName("UTF-8"));
        }
    }

}
```

JUnit 5扩展示例：

```
// Visible for Junit
@RegisterExtension
static StubRunnerExtension stubRunnerExtension = new StubRunnerExtension()
        .repoRoot(repoRoot()).stubsMode(StubRunnerProperties.StubsMode.REMOTE)
        .downloadStub("org.springframework.cloud.contract.verifier.stubs",
                "loanIssuance")
        .downloadStub(
                "org.springframework.cloud.contract.verifier.stubs:fraudDetectionServer")
        .withMappingsOutputFolder("target/outputmappingsforrule");

@BeforeAll
@AfterAll
static void setupProps() {
    System.clearProperty("stubrunner.repository.root");
    System.clearProperty("stubrunner.classifier");
}

private static String repoRoot() {
    try {
        return StubRunnerRuleJUnitTest.class.getResource("/m2repo/repository/")
                .toURI().toString();
    }
    catch (Exception e) {
        return "";
    }
}
```

检查**JUnit和Spring**的**Common属性，**以获取有关如何应用Stub Runner全局配置的更多信息。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 要将JUnit规则或JUnit 5扩展与消息传递一起使用，您必须向规则构建器（例如`rule.messageVerifier(new MyMessageVerifier())`）提供`MessageVerifier`接口的实现。如果不这样做，则每当您尝试发送消息时，都会引发异常。 |      |

### 92.4.1 Maven设置

存根下载器接受其他本地存储库文件夹的Maven设置。当前不考虑存储库和配置文件的身份验证详细信息，因此您需要使用上述属性进行指定。

### 92.4.2提供固定端口

您还可以在固定端口上运行存根。您可以通过两种不同的方式来实现。一种是在属性中传递它，另一种是通过JUnit规则的流畅API。

### 92.4.3 Fluent API

使用`StubRunnerRule`或`StubRunnerExtension`时，可以添加一个存根进行下载，然后将最后一个已下载存根的端口传递给该端口。

```
@ClassRule
public static StubRunnerRule rule = new StubRunnerRule().repoRoot(repoRoot())
        .stubsMode(StubRunnerProperties.StubsMode.REMOTE)
        .downloadStub("org.springframework.cloud.contract.verifier.stubs",
                "loanIssuance")
        .withPort(12345).downloadStub(
                "org.springframework.cloud.contract.verifier.stubs:fraudDetectionServer:12346");

@BeforeClass
@AfterClass
public static void setupProps() {
    System.clearProperty("stubrunner.repository.root");
    System.clearProperty("stubrunner.classifier");
}
```

您可以看到对于此示例，以下测试有效：

```
then(rule.findStubUrl("loanIssuance"))
        .isEqualTo(URI.create("http://localhost:12345").toURL());
then(rule.findStubUrl("fraudDetectionServer"))
        .isEqualTo(URI.create("http://localhost:12346").toURL());
```

### 92.4.4 Stub Runner与Spring

设置Stub Runner项目的Spring配置。

通过在配置文件中提供存根列表，Stub Runner会自动下载并在WireMock中注册所选存根。

如果要查找存根依赖项的URL，可以自动装配`StubFinder`接口，并使用如下所示的方法：

```
@ContextConfiguration(classes = Config, loader = SpringBootContextLoader)
@SpringBootTest(properties = [" stubrunner.cloud.enabled=false",
        'foo=${stubrunner.runningstubs.fraudDetectionServer.port}',
        'fooWithGroup=${stubrunner.runningstubs.org.springframework.cloud.contract.verifier.stubs.fraudDetectionServer.port}'])
@AutoConfigureStubRunner(mappingsOutputFolder = "target/outputmappings/",
        httpServerStubConfigurer = HttpsForFraudDetection)
@ActiveProfiles("test")
class StubRunnerConfigurationSpec extends Specification {

    @Autowired
    StubFinder stubFinder
    @Autowired
    Environment environment
    @StubRunnerPort("fraudDetectionServer")
    int fraudDetectionServerPort
    @StubRunnerPort("org.springframework.cloud.contract.verifier.stubs:fraudDetectionServer")
    int fraudDetectionServerPortWithGroupId
    @Value('${foo}')
    Integer foo

    @BeforeClass
    @AfterClass
    void setupProps() {
        System.clearProperty("stubrunner.repository.root")
        System.clearProperty("stubrunner.classifier")
        WireMockHttpServerStubAccessor.clear()
    }

    def 'should mark all ports as random'() {
        expect:
            WireMockHttpServerStubAccessor.everyPortRandom()
    }

    def 'should start WireMock servers'() {
        expect: 'WireMocks are running'
            stubFinder.findStubUrl('org.springframework.cloud.contract.verifier.stubs', 'loanIssuance') != null
            stubFinder.findStubUrl('loanIssuance') != null
            stubFinder.findStubUrl('loanIssuance') == stubFinder.findStubUrl('org.springframework.cloud.contract.verifier.stubs', 'loanIssuance')
            stubFinder.findStubUrl('loanIssuance') == stubFinder.findStubUrl('org.springframework.cloud.contract.verifier.stubs:loanIssuance')
            stubFinder.findStubUrl('org.springframework.cloud.contract.verifier.stubs:loanIssuance:0.0.1-SNAPSHOT') == stubFinder.findStubUrl('org.springframework.cloud.contract.verifier.stubs:loanIssuance:0.0.1-SNAPSHOT:stubs')
            stubFinder.findStubUrl('org.springframework.cloud.contract.verifier.stubs:fraudDetectionServer') != null
        and:
            stubFinder.findAllRunningStubs().isPresent('loanIssuance')
            stubFinder.findAllRunningStubs().isPresent('org.springframework.cloud.contract.verifier.stubs', 'fraudDetectionServer')
            stubFinder.findAllRunningStubs().isPresent('org.springframework.cloud.contract.verifier.stubs:fraudDetectionServer')
        and: 'Stubs were registered'
            "${stubFinder.findStubUrl('loanIssuance').toString()}/name".toURL().text == 'loanIssuance'
            "${stubFinder.findStubUrl('fraudDetectionServer').toString()}/name".toURL().text == 'fraudDetectionServer'
        and: 'Fraud Detection is an HTTPS endpoint'
            stubFinder.findStubUrl('fraudDetectionServer').toString().startsWith("https")
    }

    def 'should throw an exception when stub is not found'() {
        when:
            stubFinder.findStubUrl('nonExistingService')
        then:
            thrown(StubNotFoundException)
        when:
            stubFinder.findStubUrl('nonExistingGroupId', 'nonExistingArtifactId')
        then:
            thrown(StubNotFoundException)
    }

    def 'should register started servers as environment variables'() {
        expect:
            environment.getProperty("stubrunner.runningstubs.loanIssuance.port") != null
            stubFinder.findAllRunningStubs().getPort("loanIssuance") == (environment.getProperty("stubrunner.runningstubs.loanIssuance.port") as Integer)
        and:
            environment.getProperty("stubrunner.runningstubs.fraudDetectionServer.port") != null
            stubFinder.findAllRunningStubs().getPort("fraudDetectionServer") == (environment.getProperty("stubrunner.runningstubs.fraudDetectionServer.port") as Integer)
        and:
            environment.getProperty("stubrunner.runningstubs.fraudDetectionServer.port") != null
            stubFinder.findAllRunningStubs().getPort("fraudDetectionServer") == (environment.getProperty("stubrunner.runningstubs.org.springframework.cloud.contract.verifier.stubs.fraudDetectionServer.port") as Integer)
    }

    def 'should be able to interpolate a running stub in the passed test property'() {
        given:
            int fraudPort = stubFinder.findAllRunningStubs().getPort("fraudDetectionServer")
        expect:
            fraudPort > 0
            environment.getProperty("foo", Integer) == fraudPort
            environment.getProperty("fooWithGroup", Integer) == fraudPort
            foo == fraudPort
    }

    @Issue("#573")
    def 'should be able to retrieve the port of a running stub via an annotation'() {
        given:
            int fraudPort = stubFinder.findAllRunningStubs().getPort("fraudDetectionServer")
        expect:
            fraudPort > 0
            fraudDetectionServerPort == fraudPort
            fraudDetectionServerPortWithGroupId == fraudPort
    }

    def 'should dump all mappings to a file'() {
        when:
            def url = stubFinder.findStubUrl("fraudDetectionServer")
        then:
            new File("target/outputmappings/", "fraudDetectionServer_${url.port}").exists()
    }

    @Configuration
    @EnableAutoConfiguration
    static class Config {}

    @CompileStatic
    static class HttpsForFraudDetection extends WireMockHttpServerStubConfigurer {

        private static final Log log = LogFactory.getLog(HttpsForFraudDetection)

        @Override
        WireMockConfiguration configure(WireMockConfiguration httpStubConfiguration, HttpServerStubConfiguration httpServerStubConfiguration) {
            if (httpServerStubConfiguration.stubConfiguration.artifactId == "fraudDetectionServer") {
                int httpsPort = SocketUtils.findAvailableTcpPort()
                log.info("Will set HTTPs port [" + httpsPort + "] for fraud detection server")
                return httpStubConfiguration
                        .httpsPort(httpsPort)
            }
            return httpStubConfiguration
        }
    }
}
```

对于以下配置文件：

```
stubrunner:
  repositoryRoot: classpath:m2repo/repository/
  ids:
    - org.springframework.cloud.contract.verifier.stubs:loanIssuance
    - org.springframework.cloud.contract.verifier.stubs:fraudDetectionServer
    - org.springframework.cloud.contract.verifier.stubs:bootService
  stubs-mode: remote
```

除了使用属性外，还可以使用`@AutoConfigureStubRunner`内部的属性。您可以在下面找到通过在注释上设置值来获得相同结果的示例。

```
@AutoConfigureStubRunner(
        ids = ["org.springframework.cloud.contract.verifier.stubs:loanIssuance",
                "org.springframework.cloud.contract.verifier.stubs:fraudDetectionServer",
                "org.springframework.cloud.contract.verifier.stubs:bootService"],
        stubsMode = StubRunnerProperties.StubsMode.REMOTE,
        repositoryRoot = "classpath:m2repo/repository/")
```

Stub Runner Spring以下列方式为每个已注册的WireMock服务器注册环境变量。Stub Runner ID `com.example:foo`，`com.example:bar`的示例。

- `stubrunner.runningstubs.foo.port`
- `stubrunner.runningstubs.com.example.foo.port`
- `stubrunner.runningstubs.bar.port`
- `stubrunner.runningstubs.com.example.bar.port`

您可以在代码中引用该代码。

您也可以使用`@StubRunnerPort`批注注入正在运行的存根的端口。注释的值可以是`groupid:artifactid`，也可以只是`artifactid`。Stub Runner ID `com.example:foo`，`com.example:bar`的示例。

```
@StubRunnerPort("foo")
int fooPort;
@StubRunnerPort("com.example:bar")
int barPort;
```

## 92.5 Stub Runner Spring Cloud

Stub Runner可以与Spring Cloud集成。

对于现实生活中的示例，您可以查看

- [生产者应用示例](https://github.com/spring-cloud-samples/spring-cloud-contract-samples/tree/2.1.x/producer)
- [消费者应用示例](https://github.com/spring-cloud-samples/spring-cloud-contract-samples/tree/2.1.x/consumer_with_discovery)

### 92.5.1存根服务发现

`Stub Runner Spring Cloud`的最重要特征是它正在存根

- `DiscoveryClient`
- `Ribbon` `ServerList`

这意味着无论您使用的是Zookeeper，Consul，Eureka还是其他任何东西，您都不需要在测试中使用它。我们正在启动依赖项的WireMock实例，并且在您每次使用`Feign`，直接负载均衡`RestTemplate`或`DiscoveryClient`来调用那些存根服务器而不是调用真实服务时，都告诉您的应用程序发现工具。

例如，该测试将通过

```
def 'should make service discovery work'() {
    expect: 'WireMocks are running'
        "${stubFinder.findStubUrl('loanIssuance').toString()}/name".toURL().text == 'loanIssuance'
        "${stubFinder.findStubUrl('fraudDetectionServer').toString()}/name".toURL().text == 'fraudDetectionServer'
    and: 'Stubs can be reached via load service discovery'
        restTemplate.getForObject('http://loanIssuance/name', String) == 'loanIssuance'
        restTemplate.getForObject('http://someNameThatShouldMapFraudDetectionServer/name', String) == 'fraudDetectionServer'
}
```

对于以下配置文件

```
stubrunner:
  idsToServiceIds:
    ivyNotation: someValueInsideYourCode
    fraudDetectionServer: someNameThatShouldMapFraudDetectionServer
```

#### 测试配置文件和服务发现

在集成测试中，您通常既不想调用发现服务（例如Eureka）也不能调用Config Server。这就是为什么您要创建其他测试配置以禁用这些功能的原因。

由于[`spring-cloud-commons`](https://github.com/spring-cloud/spring-cloud-commons/issues/156)达到此目的的某些限制，您已通过如下所示的静态块（Eureka的示例）禁用了这些属性

```
    //Hack to work around https://github.com/spring-cloud/spring-cloud-commons/issues/156
    static {
        System.setProperty("eureka.client.enabled", "false");
        System.setProperty("spring.cloud.config.failFast", "false");
    }
```

### 92.5.2附加配置

您可以使用`stubrunner.idsToServiceIds:`映射将存根的artifactId与您的应用程序名称匹配。您可以通过提供：`stubrunner.cloud.ribbon.enabled`等于`false`来禁用Stub Runner Ribbon支持，您可以通过提供：`stubrunner.cloud.enabled`等于`false`来禁用Stub Runner支持

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 默认情况下，将对所有服务发现进行存根。这意味着无论您是否拥有`DiscoveryClient`，都将忽略其结果。但是，如果要重用它，只需将`stubrunner.cloud.delegate.enabled`设置为`true`，然后现有的`DiscoveryClient`结果将与存根的结果合并。 |

Stub Runner使用的默认Maven配置可以通过以下系统属性或环境变量进行调整

- `maven.repo.local`-自定义Maven本地存储库位置的路径
- `org.apache.maven.user-settings`-自定义Maven用户设置位置的路径
- `org.apache.maven.global-settings`-Maven全局设置位置的路径

## 92.6 Stub Runner引导应用程序

Spring Cloud Contract Stub Runner引导是一个Spring Boot应用程序，它公开REST端点以触发消息传递标签并访问启动的WireMock服务器。

用例之一是在已部署的应用程序上运行一些冒烟（端到端）测试。您可以查看[Spring Cloud Pipelines](https://github.com/spring-cloud/spring-cloud-pipelines) 项目以获取更多信息。

### 92.6.1如何使用？

#### Stub Runner服务器

只需添加

```
compile "org.springframework.cloud:spring-cloud-starter-stub-runner"
```

用`@EnableStubRunnerServer`注释课程，建立一个胖子罐，就可以开始了！

对于属性，请检查**Stub Runner Spring**部分。

#### Stub Runner服务器胖子

您可以从Maven下载独立的JAR（例如对于版本2.0.1.RELEASE），如下所示：

```
$ wget -O stub-runner.jar 'https://search.maven.org/remotecontent?filepath=org/springframework/cloud/spring-cloud-contract-stub-runner-boot/2.0.1.RELEASE/spring-cloud-contract-stub-runner-boot-2.0.1.RELEASE.jar'
$ java -jar stub-runner.jar --stubrunner.ids=... --stubrunner.repositoryRoot=...
```

#### Spring Cloud CLI

从[Spring Cloud CLI](https://cloud.spring.io/spring-cloud-cli) 项目的`1.4.0.RELEASE`版本开始，您可以通过执行`spring cloud stubrunner`启动Stub Runner引导。

为了通过配置，只需在当前工作目录或名为`config`的子目录中或在`~/.spring-cloud`中创建一个`stubrunner.yml`文件。该文件可能如下所示（运行本地安装的存根示例）

**stubrunner.yml。** 

```
stubrunner:
  stubsMode: LOCAL
  ids:
    - com.example:beer-api-producer:+:9876
```



然后只需从终端窗口调用`spring cloud stubrunner`即可启动Stub Runner服务器。它将在端口`8750`上可用。

### 92.6.2端点

#### HTTP

- GET `/stubs`-以`ivy:integer`表示法返回所有正在运行的存根的列表
- GET `/stubs/{ivy}`-返回给定`ivy`表示法的端口（调用端点`ivy`时也只能是`artifactId`）

#### 讯息传递

对于消息

- GET `/triggers`-以`ivy : [ label1, label2 …]`表示法返回所有运行标签的列表
- POST `/triggers/{label}`-使用`label`执行触发器
- POST `/triggers/{ivy}/{label}`-为给定的`ivy`表示法使用`label`执行触发器（调用端点`ivy`时也只能是`artifactId`）

### 92.6.3例子

```
@ContextConfiguration(classes = StubRunnerBoot, loader = SpringBootContextLoader)
@SpringBootTest(properties = "spring.cloud.zookeeper.enabled=false")
@ActiveProfiles("test")
class StubRunnerBootSpec extends Specification {

    @Autowired
    StubRunning stubRunning

    def setup() {
        RestAssuredMockMvc.standaloneSetup(new HttpStubsController(stubRunning),
                new TriggerController(stubRunning))
    }

    def 'should return a list of running stub servers in "full ivy:port" notation'() {
        when:
            String response = RestAssuredMockMvc.get('/stubs').body.asString()
        then:
            def root = new JsonSlurper().parseText(response)
            root.'org.springframework.cloud.contract.verifier.stubs:bootService:0.0.1-SNAPSHOT:stubs' instanceof Integer
    }

    def 'should return a port on which a [#stubId] stub is running'() {
        when:
            def response = RestAssuredMockMvc.get("/stubs/${stubId}")
        then:
            response.statusCode == 200
            Integer.valueOf(response.body.asString()) > 0
        where:
            stubId << ['org.springframework.cloud.contract.verifier.stubs:bootService:+:stubs',
                       'org.springframework.cloud.contract.verifier.stubs:bootService:0.0.1-SNAPSHOT:stubs',
                       'org.springframework.cloud.contract.verifier.stubs:bootService:+',
                       'org.springframework.cloud.contract.verifier.stubs:bootService',
                       'bootService']
    }

    def 'should return 404 when missing stub was called'() {
        when:
            def response = RestAssuredMockMvc.get("/stubs/a:b:c:d")
        then:
            response.statusCode == 404
    }

    def 'should return a list of messaging labels that can be triggered when version and classifier are passed'() {
        when:
            String response = RestAssuredMockMvc.get('/triggers').body.asString()
        then:
            def root = new JsonSlurper().parseText(response)
            root.'org.springframework.cloud.contract.verifier.stubs:bootService:0.0.1-SNAPSHOT:stubs'?.containsAll(["delete_book", "return_book_1", "return_book_2"])
    }

    def 'should trigger a messaging label'() {
        given:
            StubRunning stubRunning = Mock()
            RestAssuredMockMvc.standaloneSetup(new HttpStubsController(stubRunning), new TriggerController(stubRunning))
        when:
            def response = RestAssuredMockMvc.post("/triggers/delete_book")
        then:
            response.statusCode == 200
        and:
            1 * stubRunning.trigger('delete_book')
    }

    def 'should trigger a messaging label for a stub with [#stubId] ivy notation'() {
        given:
            StubRunning stubRunning = Mock()
            RestAssuredMockMvc.standaloneSetup(new HttpStubsController(stubRunning), new TriggerController(stubRunning))
        when:
            def response = RestAssuredMockMvc.post("/triggers/$stubId/delete_book")
        then:
            response.statusCode == 200
        and:
            1 * stubRunning.trigger(stubId, 'delete_book')
        where:
            stubId << ['org.springframework.cloud.contract.verifier.stubs:bootService:stubs', 'org.springframework.cloud.contract.verifier.stubs:bootService', 'bootService']
    }

    def 'should throw exception when trigger is missing'() {
        when:
            RestAssuredMockMvc.post("/triggers/missing_label")
        then:
            Exception e = thrown(Exception)
            e.message.contains("Exception occurred while trying to return [missing_label] label.")
            e.message.contains("Available labels are")
            e.message.contains("org.springframework.cloud.contract.verifier.stubs:loanIssuance:0.0.1-SNAPSHOT:stubs=[]")
            e.message.contains("org.springframework.cloud.contract.verifier.stubs:bootService:0.0.1-SNAPSHOT:stubs=")
    }

}
```

### 92.6.4 Stub Runner使用服务发现启动

使用Stub Runner引导程序的一种可能性是将其用作“烟雾测试”的存根的提要。这是什么意思？假设您不想将50个微服务部署到测试环境中以检查您的应用程序是否运行正常。在构建过程中，您已经执行了一组测试，但是您还想确保应用程序的包装是正确的。您可以做的是将应用程序部署到环境中，启动该应用程序并在其上运行一些测试，以查看其是否正常运行。我们可以称这些测试为冒烟测试，因为它们的想法是仅检查少数几个测试场景。

这种方法的问题在于，如果您正在执行微服务，则很可能正在使用服务发现工具。Stub Runner引导程序允许您通过启动所需的存根并将其注册到服务发现工具中来解决此问题。让我们看一下使用Eureka进行这种设置的示例。假设Eureka已经在运行。

```
@SpringBootApplication
@EnableStubRunnerServer
@EnableEurekaClient
@AutoConfigureStubRunner
public class StubRunnerBootEurekaExample {

    public static void main(String[] args) {
        SpringApplication.run(StubRunnerBootEurekaExample.class, args);
    }

}
```

如您所见，我们想启动Stub Runner引导服务器`@EnableStubRunnerServer`，启用Eureka客户端`@EnableEurekaClient`，并且我们想打开桩头运行程序功能`@AutoConfigureStubRunner`。

现在假设我们要启动此应用程序，以便存根自动注册。我们可以通过运行应用程序`java -jar ${SYSTEM_PROPS} stub-runner-boot-eureka-example.jar`来做到这一点，其中`${SYSTEM_PROPS}`将包含以下属性列表

```
* -Dstubrunner.repositoryRoot=https://repo.spring.io/snapshot (1)
* -Dstubrunner.cloud.stubbed.discovery.enabled=false (2)
* -Dstubrunner.ids=org.springframework.cloud.contract.verifier.stubs:loanIssuance,org.
* springframework.cloud.contract.verifier.stubs:fraudDetectionServer,org.springframework.
* cloud.contract.verifier.stubs:bootService (3)
* -Dstubrunner.idsToServiceIds.fraudDetectionServer=
* someNameThatShouldMapFraudDetectionServer (4)
*
* (1) - we tell Stub Runner where all the stubs reside (2) - we don't want the default
* behaviour where the discovery service is stubbed. That's why the stub registration will
* be picked (3) - we provide a list of stubs to download (4) - we provide a list of
```

这样，您部署的应用程序可以通过服务发现将请求发送到启动的WireMock服务器。默认情况下，极有可能在`application.yml`中设置了1-3点，因为它们不太可能改变。这样，每次启动Stub Runner引导时，您只能提供要下载的存根列表。

## 每个消费者92.7个存根

在某些情况下，同一端点的2个使用者希望有2个不同的响应。

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 这种方法还使您可以立即知道哪个使用者正在使用API的哪一部分。您可以删除API产生的部分响应，并且可以查看哪些自动生成的测试失败。如果没有失败，那么您可以安全地删除响应的那部分，因为没有人使用它。 |

让我们看下面的示例，该示例为生产者定义的合同称为`producer`。有2个使用者：`foo-consumer`和`bar-consumer`。

**消费者`foo-service`**

```
request {
   url '/foo'
   method GET()
}
response {
    status OK()
    body(
       foo: "foo"
    }
}
```

**消费者`bar-service`**

```
request {
   url '/foo'
   method GET()
}
response {
    status OK()
    body(
       bar: "bar"
    }
}
```

您不能为同一请求产生2个不同的响应。因此，您可以正确打包合同，然后从`stubsPerConsumer`功能中受益。

在生产者方面，消费者可以拥有一个文件夹，其中仅包含与他们相关的合同。通过将`stubrunner.stubs-per-consumer`标志设置为`true`，我们不再注册所有存根，而是仅注册与使用者应用程序名称相对应的存根。换句话说，我们将扫描每个存根的路径，如果它在路径中包含带有使用者名称的子文件夹，则它将被注册。

在`foo`生产商一方，合同看起来像这样

```
.
└── contracts
    ├── bar-consumer
    │   ├── bookReturnedForBar.groovy
    │   └── shouldCallBar.groovy
    └── foo-consumer
        ├── bookReturnedForFoo.groovy
        └── shouldCallFoo.groovy
```

作为`bar-consumer`使用者，您可以将`spring.application.name`或`stubrunner.consumer-name`设置为`bar-consumer`，也可以按以下方式设置测试：

```
@ContextConfiguration(classes = Config, loader = SpringBootContextLoader)
@SpringBootTest(properties = ["spring.application.name=bar-consumer"])
@AutoConfigureStubRunner(ids = "org.springframework.cloud.contract.verifier.stubs:producerWithMultipleConsumers",
		repositoryRoot = "classpath:m2repo/repository/",
		stubsMode = StubRunnerProperties.StubsMode.REMOTE,
		stubsPerConsumer = true)
class StubRunnerStubsPerConsumerSpec extends Specification {
...
}
```

然后，仅允许引用在名称中包含`bar-consumer`的路径下注册的存根（即来自`src/test/resources/contracts/bar-consumer/some/contracts/…`文件夹的存根）。

或明确设置消费者名称

```
@ContextConfiguration(classes = Config, loader = SpringBootContextLoader)
@SpringBootTest
@AutoConfigureStubRunner(ids = "org.springframework.cloud.contract.verifier.stubs:producerWithMultipleConsumers",
		repositoryRoot = "classpath:m2repo/repository/",
		consumerName = "foo-consumer",
		stubsMode = StubRunnerProperties.StubsMode.REMOTE,
		stubsPerConsumer = true)
class StubRunnerStubsPerConsumerWithConsumerNameSpec extends Specification {
...
}
```

然后，仅允许引用在名称中包含`foo-consumer`的路径下注册的存根（即来自`src/test/resources/contracts/foo-consumer/some/contracts/…`文件夹的存根）。

您可以查看[问题224](https://github.com/spring-cloud/spring-cloud-contract/issues/224)，以了解有关此更改背后原因的更多信息。

## 92.8共同的

本节简要介绍了常用属性，包括：

- [第92.8.1节“ JUnit和Spring的公用Properties”](https://www.springcloud.cc/spring-cloud-greenwich.html#common-properties-junit-spring)
- [第92.8.2节“ Stub Runner存根ID”](https://www.springcloud.cc/spring-cloud-greenwich.html#stub-runner-stub-ids)

### 92.8.1 JUnit和Spring的通用Properties

您可以使用系统属性或Spring配置属性来设置重复属性。这是它们的名称及其默认值：

| Property名称                | 默认值    | 描述                                                         |
| --------------------------- | --------- | ------------------------------------------------------------ |
| stubrunner.minPort          | 10000     | Minimum value of a port for a started WireMock with stubs.   |
| stubrunner.maxPort          | 15000     | Maximum value of a port for a started WireMock with stubs.   |
| stubrunner.repositoryRoot   |           | Maven repo URL. If blank, then call the local maven repo.    |
| stubrunner.classifier       | stubs     | Default classifier for the stub artifacts.                   |
| stubrunner.stubsMode        | CLASSPATH | The way you want to fetch and register the stubs             |
| stubrunner.ids              |           | Array of Ivy notation stubs to download.                     |
| stubrunner.username         |           | Optional username to access the tool that stores the JARs with stubs. |
| stubrunner.password         |           | Optional password to access the tool that stores the JARs with stubs. |
| stubrunner.stubsPerConsumer | false     | Set to `true` if you want to use different stubs for each consumer instead of registering all stubs for every consumer. |
| stubrunner.consumerName     |           | If you want to use a stub for each consumer and want to override the consumer name just change this value. |

### 92.8.2 Stub Runner存根ID

您可以提供存根以通过`stubrunner.ids`系统属性下载。他们遵循以下模式：

```
groupId:artifactId:version:classifier:port
```

请注意，`version`，`classifier`和`port`是可选的。

- 如果您未提供`port`，则将随机选择一个。
- 如果不提供`classifier`，则使用默认值。（请注意，您可以通过以下方式传递空的分类器：`groupId:artifactId:version:`）。
- 如果您未提供`version`，则将传递`+`并下载最新的`+`。

`port`表示WireMock服务器的端口。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 从1.0.4版开始，您可以提供Stub Runner要考虑的一系列版本。您可以[在此处](https://wiki.eclipse.org/Aether/New_and_Noteworthy#Version_Ranges)阅读有关[Aether版本控制范围的](https://wiki.eclipse.org/Aether/New_and_Noteworthy#Version_Ranges)更多信息 。 |      |

## 92.9 Stub Runner Docker

我们正在发布一个`spring-cloud/spring-cloud-contract-stub-runner` Docker映像，它将启动Stub Runner的独立版本。

如果您想了解更多关于Maven的基础知识，工件ID，组ID，分类器和工件管理器，请单击此处[第90.16节“ Docker项目”](https://www.springcloud.cc/spring-cloud-greenwich.html#docker-project)。

### 92.9.1使用方法

只需执行docker镜像即可。您可以将[第92.8.1节“ JUnit的公用Properties和Spring”](https://www.springcloud.cc/spring-cloud-greenwich.html#common-properties-junit-spring) 作为环境变量进行传递。惯例是所有字母都应大写。驼峰符号和点（`.`）应该通过下划线（`_`）分隔。例如，`stubrunner.repositoryRoot`属性应表示为`STUBRUNNER_REPOSITORY_ROOT`环境变量。

### 92.9.2非JVM项目中的客户端用法示例

我们想使用在[第90.16.4节“服务器端（nodejs）”](https://www.springcloud.cc/spring-cloud-greenwich.html#docker-server-side)步骤中创建的存根。假设我们要在端口`9876`上运行存根。NodeJS代码在这里可用：

```
$ git clone https://github.com/spring-cloud-samples/spring-cloud-contract-nodejs
$ cd bookstore
```

让我们使用存根运行Stub Runner引导应用程序。

```
# Provide the Spring Cloud Contract Docker version
$ SC_CONTRACT_DOCKER_VERSION="..."
# The IP at which the app is running and Docker container can reach it
$ APP_IP="192.168.0.100"
# Spring Cloud Contract Stub Runner properties
$ STUBRUNNER_PORT="8083"
# Stub coordinates 'groupId:artifactId:version:classifier:port'
$ STUBRUNNER_IDS="com.example:bookstore:0.0.1.RELEASE:stubs:9876"
$ STUBRUNNER_REPOSITORY_ROOT="http://${APP_IP}:8081/artifactory/libs-release-local"
# Run the docker with Stub Runner Boot
$ docker run  --rm -e "STUBRUNNER_IDS=${STUBRUNNER_IDS}" -e "STUBRUNNER_REPOSITORY_ROOT=${STUBRUNNER_REPOSITORY_ROOT}" -e "STUBRUNNER_STUBS_MODE=REMOTE" -p "${STUBRUNNER_PORT}:${STUBRUNNER_PORT}" -p "9876:9876" springcloud/spring-cloud-contract-stub-runner:"${SC_CONTRACT_DOCKER_VERSION}"
```

这是怎么回事

- 一个独立的Stub Runner应用程序已启动
- 它在端口`9876`上下载了坐标为`com.example:bookstore:0.0.1.RELEASE:stubs`的存根
- 它是从Artifactory下载的，运行速度为`http://192.168.0.100:8081/artifactory/libs-release-local`
- 过一会儿Stub Runner将在端口`8083`上运行
- 并且存根将在端口`9876`上运行

在服务器端，我们构建了一个有状态的存根。让我们使用curl声明存根已正确设置。

```
# let's execute the first request (no response is returned)
$ curl -H "Content-Type:application/json" -X POST --data '{ "title" : "Title", "genre" : "Genre", "description" : "Description", "author" : "Author", "publisher" : "Publisher", "pages" : 100, "image_url" : "https://d213dhlpdb53mu.cloudfront.net/assets/pivotal-square-logo-41418bd391196c3022f3cd9f3959b3f6d7764c47873d858583384e759c7db435.svg", "buy_url" : "https://pivotal.io" }' http://localhost:9876/api/books
# Now time for the second request
$ curl -X GET http://localhost:9876/api/books
# You will receive contents of the JSON
```

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 如果要使用在主机上本地构建的存根，则应传递环境变量`-e STUBRUNNER_STUBS_MODE=LOCAL`并安装本地m2的卷`-v "${HOME}/.m2/:/root/.m2:ro"` |      |

## 93. Stub Runner用于消息传递

Stub Runner可以在内存中运行已发布的存根。它可以与以下框架集成：

- Spring Integration
- Spring Cloud Stream
- 阿帕奇骆驼
- Spring AMQP

它还提供了与市场上任何其他解决方案集成的切入点。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 如果您在类路径Stub Runner上有多个框架，则需要定义应使用的框架。假设您在类路径上同时具有AMQP，Spring Cloud Stream和Spring Integration。然后，您需要设置`stubrunner.stream.enabled=false`和`stubrunner.integration.enabled=false`。这样，剩下的唯一框架就是Spring AMQP。 |      |

## 93.1存根触发

要触发消息，请使用`StubTrigger`界面：

```
package org.springframework.cloud.contract.stubrunner;

import java.util.Collection;
import java.util.Map;

/**
 * Contract for triggering stub messages.
 *
 * @author Marcin Grzejszczak
 */
public interface StubTrigger {

    /**
     * Triggers an event by a given label for a given {@code groupid:artifactid} notation.
     * You can use only {@code artifactId} too.
     *
     * Feature related to messaging.
     * @param ivyNotation ivy notation of a stub
     * @param labelName name of the label to trigger
     * @return true - if managed to run a trigger
     */
    boolean trigger(String ivyNotation, String labelName);

    /**
     * Triggers an event by a given label.
     *
     * Feature related to messaging.
     * @param labelName name of the label to trigger
     * @return true - if managed to run a trigger
     */
    boolean trigger(String labelName);

    /**
     * Triggers all possible events.
     *
     * Feature related to messaging.
     * @return true - if managed to run a trigger
     */
    boolean trigger();

    /**
     * Feature related to messaging.
     * @return a mapping of ivy notation of a dependency to all the labels it has.
     */
    Map<String, Collection<String>> labels();

}
```

为方便起见，`StubFinder`接口扩展了`StubTrigger`，因此您在测试中只需要一个即可。

`StubTrigger`提供了以下触发消息的选项：

- [第93.1.1节“按标签触发”](https://www.springcloud.cc/spring-cloud-greenwich.html#trigger-label)
- [第93.1.2节“按组和工件ID触发”](https://www.springcloud.cc/spring-cloud-greenwich.html#trigger-group-artifact-ids)
- [第93.1.3节“由工件ID触发”](https://www.springcloud.cc/spring-cloud-greenwich.html#trigger-artifact-ids)
- [第93.1.4节“触发所有消息”](https://www.springcloud.cc/spring-cloud-greenwich.html#trigger-all-messages)

### 93.1.1按标签触发

```
stubFinder.trigger('return_book_1')
```

### 93.1.2按组和工件ID触发

```
stubFinder.trigger('org.springframework.cloud.contract.verifier.stubs:streamService', 'return_book_1')
```

### 93.1.3由工件ID触发

```
stubFinder.trigger('streamService', 'return_book_1')
```

### 93.1.4触发所有消息

```
stubFinder.trigger()
```

## 93.2 Stub Runner Camel

Spring Cloud Contract验证程序Stub Runner的消息传递模块为您提供了一种与Apache Camel集成的简便方法。对于提供的工件，它将自动下载存根并注册所需的路由。

### 93.2.1将其添加到项目中

在类路径上同时包含Apache Camel和Spring Cloud Contract Stub Runner就足够了。请记住用`@AutoConfigureStubRunner`注释测试类。

### 93.2.2禁用功能

如果需要禁用此功能，只需传递`stubrunner.camel.enabled=false`属性。

### 93.2.3例子

#### 存根结构

让我们假设我们有以下Maven存储库，其中包含用于`camelService`应用程序的已部署存根。

```
└── .m2
    └── repository
        └── io
            └── codearte
                └── accurest
                    └── stubs
                        └── camelService
                            ├── 0.0.1-SNAPSHOT
                            │   ├── camelService-0.0.1-SNAPSHOT.pom
                            │   ├── camelService-0.0.1-SNAPSHOT-stubs.jar
                            │   └── maven-metadata-local.xml
                            └── maven-metadata-local.xml
```

存根包含以下结构：

```
├── META-INF
│   └── MANIFEST.MF
└── repository
    ├── accurest
    │   ├── bookDeleted.groovy
    │   ├── bookReturned1.groovy
    │   └── bookReturned2.groovy
    └── mappings
```

让我们考虑以下合同（用**1**编号）：

```
Contract.make {
    label 'return_book_1'
    input {
        triggeredBy('bookReturnedTriggered()')
    }
    outputMessage {
        sentTo('jms:output')
        body('''{ "bookName" : "foo" }''')
        headers {
            header('BOOK-NAME', 'foo')
        }
    }
}
```

和数字**2**

```
Contract.make {
    label 'return_book_2'
    input {
        messageFrom('jms:input')
        messageBody([
                bookName: 'foo'
        ])
        messageHeaders {
            header('sample', 'header')
        }
    }
    outputMessage {
        sentTo('jms:output')
        body([
                bookName: 'foo'
        ])
        headers {
            header('BOOK-NAME', 'foo')
        }
    }
}
```

#### 方案1（无输入消息）

为了通过`return_book_1`标签触发消息，我们将使用`StubTigger`接口，如下所示

```
stubFinder.trigger('return_book_1')
```

接下来，我们要收听发送到`jms:output`的消息的输出

```
Exchange receivedMessage = consumerTemplate.receive('jms:output', 5000)
```

并且收到的消息将通过以下断言

```
receivedMessage != null
assertThatBodyContainsBookNameFoo(receivedMessage.in.body)
receivedMessage.in.headers.get('BOOK-NAME') == 'foo'
```

#### 场景2（由输入触发输出）

由于已为您设置了路由，仅向`jms:output`目标发送一条消息就足够了。

```
producerTemplate.
		sendBodyAndHeaders('jms:input', new BookReturned('foo'), [sample: 'header'])
```

接下来，我们要监听发送到`jms:output`的消息的输出

```
Exchange receivedMessage = consumerTemplate.receive('jms:output', 5000)
```

并且收到的消息将通过以下断言

```
receivedMessage != null
assertThatBodyContainsBookNameFoo(receivedMessage.in.body)
receivedMessage.in.headers.get('BOOK-NAME') == 'foo'
```

#### 方案3（输入无输出）

由于已为您设置了路由，仅向`jms:output`目标发送一条消息就足够了。

```
producerTemplate.
		sendBodyAndHeaders('jms:delete', new BookReturned('foo'), [sample: 'header'])
```

## 93.3 Stub Runner集成

Spring Cloud Contract验证程序Stub Runner的消息传递模块为您提供了一种与Spring Integration集成的简便方法。对于提供的工件，它会自动下载存根并注册所需的路由。

### 93.3.1将运行器添加到项目

您可以在类路径上同时使用Spring Integration和Spring Cloud Contract Stub Runner。请记住用`@AutoConfigureStubRunner`注释测试类。

### 93.3.2禁用功能

如果需要禁用此功能，请设置`stubrunner.integration.enabled=false`属性。

假设您具有以下Maven存储库，其中包含`integrationService`应用程序的已部署存根：

```
└── .m2
    └── repository
        └── io
            └── codearte
                └── accurest
                    └── stubs
                        └── integrationService
                            ├── 0.0.1-SNAPSHOT
                            │   ├── integrationService-0.0.1-SNAPSHOT.pom
                            │   ├── integrationService-0.0.1-SNAPSHOT-stubs.jar
                            │   └── maven-metadata-local.xml
                            └── maven-metadata-local.xml
```

进一步假设存根包含以下结构：

```
├── META-INF
│   └── MANIFEST.MF
└── repository
    ├── accurest
    │   ├── bookDeleted.groovy
    │   ├── bookReturned1.groovy
    │   └── bookReturned2.groovy
    └── mappings
```

考虑以下合同（编号**1**）：

```
Contract.make {
    label 'return_book_1'
    input {
        triggeredBy('bookReturnedTriggered()')
    }
    outputMessage {
        sentTo('output')
        body('''{ "bookName" : "foo" }''')
        headers {
            header('BOOK-NAME', 'foo')
        }
    }
}
```

现在考虑**2**：

```
Contract.make {
    label 'return_book_2'
    input {
        messageFrom('input')
        messageBody([
                bookName: 'foo'
        ])
        messageHeaders {
            header('sample', 'header')
        }
    }
    outputMessage {
        sentTo('output')
        body([
                bookName: 'foo'
        ])
        headers {
            header('BOOK-NAME', 'foo')
        }
    }
}
```

以及以下Spring Integration路线：

```
<?xml version="1.0" encoding="UTF-8"?>
<beans:beans xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xmlns:beans="http://www.springframework.org/schema/beans"
             xmlns="http://www.springframework.org/schema/integration"
             xsi:schemaLocation="http://www.springframework.org/schema/beans
            https://www.springframework.org/schema/beans/spring-beans.xsd
            http://www.springframework.org/schema/integration
            http://www.springframework.org/schema/integration/spring-integration.xsd">


    <!-- REQUIRED FOR TESTING -->
    <bridge input-channel="output"
            output-channel="outputTest"/>

    <channel id="outputTest">
        <queue/>
    </channel>

</beans:beans>
```

这些示例适用于三种情况：

- [称为“方案1（无输入消息）”的部分](https://www.springcloud.cc/spring-cloud-greenwich.html#integration-scenario-1)
- [称为“方案2（由输入触发的输出）”的部分](https://www.springcloud.cc/spring-cloud-greenwich.html#integration-scenario-2)
- [称为“方案3（输入无输出）”的部分](https://www.springcloud.cc/spring-cloud-greenwich.html#integration-scenario-3)

#### 方案1（无输入消息）

要通过`return_book_1`标签触发消息，请使用`StubTigger`接口，如下所示：

```
stubFinder.trigger('return_book_1')
```

要监听发送到`output`的消息的输出，请执行以下操作：

```
Message<?> receivedMessage = messaging.receive('outputTest')
```

收到的消息将通过以下断言：

```
receivedMessage != null
assertJsons(receivedMessage.payload)
receivedMessage.headers.get('BOOK-NAME') == 'foo'
```

#### 场景2（由输入触发输出）

由于已为您设置了路由，因此您可以向`output`目标发送消息：

```
messaging.send(new BookReturned('foo'), [sample: 'header'], 'input')
```

要监听发送到`output`的消息的输出，请执行以下操作：

```
Message<?> receivedMessage = messaging.receive('outputTest')
```

收到的消息传递以下断言：

```
receivedMessage != null
assertJsons(receivedMessage.payload)
receivedMessage.headers.get('BOOK-NAME') == 'foo'
```

#### 方案3（输入无输出）

由于已为您设置了路由，因此您可以向`input`目标发送消息：

```
messaging.send(new BookReturned('foo'), [sample: 'header'], 'delete')
```

## 93.4 Stub Runner Stream

Spring Cloud Contract验证程序Stub Runner的消息传递模块为您提供了一种与Spring Stream集成的简便方法。对于提供的工件，它会自动下载存根并注册所需的路由。

| ![[警告]](/assets/images/springcloud/warning.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 如果Stub Runner与Stream集成，则首先将`messageFrom`或`sentTo`字符串解析为频道的`destination`，并且不存在这样的`destination`，则将目的地解析为频道名称。 |

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 如果要使用Spring Cloud Stream，请记住要添加对`org.springframework.cloud:spring-cloud-stream-test-support`的依赖。 |      |

**Maven.** 

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-stream-test-support</artifactId>
    <scope>test</scope>
</dependency>
```



**Gradle.** 

```
testCompile "org.springframework.cloud:spring-cloud-stream-test-support"
```



### 93.4.1将运行器添加到项目

您可以在类路径上同时使用Spring Cloud Stream和Spring Cloud Contract Stub Runner。请记住用`@AutoConfigureStubRunner`注释测试类。

### 93.4.2禁用功能

如果需要禁用此功能，请设置`stubrunner.stream.enabled=false`属性。

假设您具有以下Maven存储库，其中包含`streamService`应用程序的已部署存根：

```
└── .m2
    └── repository
        └── io
            └── codearte
                └── accurest
                    └── stubs
                        └── streamService
                            ├── 0.0.1-SNAPSHOT
                            │   ├── streamService-0.0.1-SNAPSHOT.pom
                            │   ├── streamService-0.0.1-SNAPSHOT-stubs.jar
                            │   └── maven-metadata-local.xml
                            └── maven-metadata-local.xml
```

进一步假设存根包含以下结构：

```
├── META-INF
│   └── MANIFEST.MF
└── repository
    ├── accurest
    │   ├── bookDeleted.groovy
    │   ├── bookReturned1.groovy
    │   └── bookReturned2.groovy
    └── mappings
```

考虑以下合同（编号**1**）：

```
Contract.make {
    label 'return_book_1'
    input { triggeredBy('bookReturnedTriggered()') }
    outputMessage {
        sentTo('returnBook')
        body('''{ "bookName" : "foo" }''')
        headers { header('BOOK-NAME', 'foo') }
    }
}
```

现在考虑**2**：

```
Contract.make {
    label 'return_book_2'
    input {
        messageFrom('bookStorage')
        messageBody([
                bookName: 'foo'
        ])
        messageHeaders { header('sample', 'header') }
    }
    outputMessage {
        sentTo('returnBook')
        body([
                bookName: 'foo'
        ])
        headers { header('BOOK-NAME', 'foo') }
    }
}
```

现在考虑以下Spring配置：

```
stubrunner.repositoryRoot: classpath:m2repo/repository/
stubrunner.ids: org.springframework.cloud.contract.verifier.stubs:streamService:0.0.1-SNAPSHOT:stubs
stubrunner.stubs-mode: remote
spring:
  cloud:
    stream:
      bindings:
        output:
          destination: returnBook
        input:
          destination: bookStorage

server:
  port: 0

debug: true
```

这些示例适用于三种情况：

- [称为“方案1（无输入消息）”的部分](https://www.springcloud.cc/spring-cloud-greenwich.html#stream-scenario-1)
- [称为“方案2（由输入触发的输出）”的部分](https://www.springcloud.cc/spring-cloud-greenwich.html#stream-scenario-2)
- [称为“方案3（输入无输出）”的部分](https://www.springcloud.cc/spring-cloud-greenwich.html#stream-scenario-3)

#### 方案1（无输入消息）

要通过`return_book_1`标签触发消息，请使用`StubTrigger`接口，如下所示：

```
stubFinder.trigger('return_book_1')
```

要收听发送到`destination`为`returnBook`的频道的消息的输出，请执行以下操作：

```
Message<?> receivedMessage = messaging.receive('returnBook')
```

收到的消息传递以下断言：

```
receivedMessage != null
assertJsons(receivedMessage.payload)
receivedMessage.headers.get('BOOK-NAME') == 'foo'
```

#### 场景2（由输入触发输出）

由于已为您设置了路线，因此您可以向`bookStorage` `destination`发送消息：

```
messaging.send(new BookReturned('foo'), [sample: 'header'], 'bookStorage')
```

要监听发送到`returnBook`的消息的输出，请执行以下操作：

```
Message<?> receivedMessage = messaging.receive('returnBook')
```

收到的消息传递以下断言：

```
receivedMessage != null
assertJsons(receivedMessage.payload)
receivedMessage.headers.get('BOOK-NAME') == 'foo'
```

#### 方案3（输入无输出）

由于已为您设置了路由，因此您可以向`output`目标发送消息：

```
messaging.send(new BookReturned('foo'), [sample: 'header'], 'delete')
```

## 93.5 Stub Runner Spring AMQP

Spring Cloud Contract验证程序Stub Runner的消息传递模块提供了一种与Spring AMQP的Rabbit模板集成的简便方法。对于提供的工件，它会自动下载存根并注册所需的路由。

集成尝试独立工作（即，不与正在运行的RabbitMQ消息代理进行交互）。它期望在应用程序上下文中使用`RabbitTemplate`并将其用作名为`@SpyBean`的spring boot测试。结果，它可以使用模仿间谍功能来验证和检查应用程序发送的消息。

在消息使用者方面，存根运行器考虑应用程序上下文中的所有`@RabbitListener`带注释的终结点和所有`SimpleMessageListenerContainer`对象。

由于消息通常以AMQP的形式发送到交易所，因此消息合同包含交易所名称作为目的地。另一端的消息侦听器绑定到队列。绑定将交换连接到队列。如果触发了消息合同，则Spring AMQP存根运行器集成会在应用程序上下文中查找与此交换匹配的绑定。然后，它从Spring交换收集队列，并尝试查找绑定到这些队列的消息侦听器。将为所有匹配的消息侦听器触发该消息。

如果您需要使用路由键，则足以通过`amqp_receivedRoutingKey`消息传递标头传递它们。

### 93.5.1将运行器添加到项目

您可以在类路径上同时使用Spring AMQP和Spring Cloud Contract Stub Runner，并设置属性`stubrunner.amqp.enabled=true`。请记住用`@AutoConfigureStubRunner`注释测试类。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 如果您已经在类路径上具有Stream and Integration，则需要通过设置`stubrunner.stream.enabled=false`和`stubrunner.integration.enabled=false`属性来显式禁用它们。 |      |

假设您具有以下Maven存储库，其中包含`spring-cloud-contract-amqp-test`应用程序的已部署存根。

```
└── .m2
    └── repository
        └── com
            └── example
                └── spring-cloud-contract-amqp-test
                    ├── 0.4.0-SNAPSHOT
                    │   ├── spring-cloud-contract-amqp-test-0.4.0-SNAPSHOT.pom
                    │   ├── spring-cloud-contract-amqp-test-0.4.0-SNAPSHOT-stubs.jar
                    │   └── maven-metadata-local.xml
                    └── maven-metadata-local.xml
```

进一步假设存根包含以下结构：

```
├── META-INF
│   └── MANIFEST.MF
└── contracts
    └── shouldProduceValidPersonData.groovy
```

考虑以下合同：

```
Contract.make {
	// Human readable description
	description 'Should produce valid person data'
	// Label by means of which the output message can be triggered
	label 'contract-test.person.created.event'
	// input to the contract
	input {
		// the contract will be triggered by a method
		triggeredBy('createPerson()')
	}
	// output message of the contract
	outputMessage {
		// destination to which the output message will be sent
		sentTo 'contract-test.exchange'
		headers {
			header('contentType': 'application/json')
			header('__TypeId__': 'org.springframework.cloud.contract.stubrunner.messaging.amqp.Person')
		}
		// the body of the output message
		body([
				id  : $(consumer(9), producer(regex("[0-9]+"))),
				name: "me"
		])
	}
}
```

现在考虑以下Spring配置：

```
stubrunner:
  repositoryRoot: classpath:m2repo/repository/
  ids: org.springframework.cloud.contract.verifier.stubs.amqp:spring-cloud-contract-amqp-test:0.4.0-SNAPSHOT:stubs
  stubs-mode: remote
  amqp:
    enabled: true
server:
  port: 0
```

#### 触发消息

要使用上述合同触发消息，请使用`StubTrigger`界面，如下所示：

```
stubTrigger.trigger("contract-test.person.created.event")
```

该消息的目的地为`contract-test.exchange`，因此Spring AMQP存根运行器集成查找与该交换有关的绑定。

```
@Bean
public Binding binding() {
	return BindingBuilder.bind(new Queue("test.queue"))
			.to(new DirectExchange("contract-test.exchange")).with("#");
}
```

绑定定义绑定队列`test.queue`。结果，以下侦听器定义将与合同消息匹配并调用。

```
@Bean
public SimpleMessageListenerContainer simpleMessageListenerContainer(
		ConnectionFactory connectionFactory,
		MessageListenerAdapter listenerAdapter) {
	SimpleMessageListenerContainer container = new SimpleMessageListenerContainer();
	container.setConnectionFactory(connectionFactory);
	container.setQueueNames("test.queue");
	container.setMessageListener(listenerAdapter);

	return container;
}
```

此外，以下带注释的侦听器将匹配并被调用：

```
@RabbitListener(bindings = @QueueBinding(value = @Queue("test.queue"), exchange = @Exchange(value = "contract-test.exchange", ignoreDeclarationExceptions = "true")))
public void handlePerson(Person person) {
	this.person = person;
}
```

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 该消息被直接移交给与匹配的`SimpleMessageListenerContainer`相关联的`MessageListener`的`onMessage`方法。 |

#### Spring AMQP测试配置

为了避免Spring AMQP在我们的测试期间尝试连接到正在运行的代理，请配置模拟`ConnectionFactory`。

要禁用模拟的ConnectionFactory，请设置以下属性：`stubrunner.amqp.mockConnection=false`

```
stubrunner:
  amqp:
    mockConnection: false
```

## 94. Contract DSL

Spring Cloud Contract支持2种类型的DSL。一种写在`Groovy`中，另一种写在`YAML`中。

如果您决定将合同写在Groovy中，那么如果您以前没有使用过Groovy，请不要惊慌。确实不需要语言知识，因为Contract DSL仅使用它的一小部分（仅文字，方法调用和闭包）。同样，DSL是静态类型的，以使其在不了解DSL本身的情况下就可以被程序员读取。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 请记住，在Groovy合同文件中，必须为`Contract`类和`make`静态导入（例如`org.springframework.cloud.spec.Contract.make { … }`）提供完全限定名称。您还可以导入`Contract`类：`import org.springframework.cloud.spec.Contract`，然后调用`Contract.make { … }`。 |      |

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| Spring Cloud Contract支持在单个文件中定义多个合同。          |

以下是Groovy合同定义的完整示例：

```

```

以下是YAML合同定义的完整示例：

```
description: Some description
name: some name
priority: 8
ignored: true
request:
  url: /foo
  queryParameters:
    a: b
    b: c
  method: PUT
  headers:
    foo: bar
    fooReq: baz
  body:
    foo: bar
  matchers:
    body:
      - path: $.foo
        type: by_regex
        value: bar
    headers:
      - key: foo
        regex: bar
response:
  status: 200
  headers:
    foo2: bar
    foo3: foo33
    fooRes: baz
  body:
    foo2: bar
    foo3: baz
    nullValue: null
  matchers:
    body:
      - path: $.foo2
        type: by_regex
        value: bar
      - path: $.foo3
        type: by_command
        value: executeMe($it)
      - path: $.nullValue
        type: by_null
        value: null
    headers:
      - key: foo2
        regex: bar
      - key: foo3
        command: andMeToo($it)
```

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 您可以使用独立的maven命令将合同编译为存根映射：`mvn org.springframework.cloud:spring-cloud-contract-maven-plugin:convert` |

## 94.1局限性

| ![[警告]](/assets/images/springcloud/warning.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| Spring Cloud Contract验证程序未正确支持XML。请使用JSON或帮助我们实现此功能。 |

| ![[警告]](/assets/images/springcloud/warning.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 验证JSON数组大小的支持是实验性的。如果要打开它，请将以下系统属性的值设置为`true`：`spring.cloud.contract.verifier.assert.size`。默认情况下，此功能设置为`false`。您还可以在插件配置中提供`assertJsonSize`属性。 |

| ![[警告]](/assets/images/springcloud/warning.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 由于JSON结构可以具有任何形式，因此在使用Groovy DSL和`GString`中的`value(consumer(…), producer(…))`表示法时，可能无法正确解析它。这就是为什么您应该使用Groovy地图符号的原因。 |

## 94.2通用顶级元素

以下各节描述了最常见的顶级元素：

- [第94.2.1节“描述”](https://www.springcloud.cc/spring-cloud-greenwich.html#contract-dsl-description)
- [第94.2.2节“名称”](https://www.springcloud.cc/spring-cloud-greenwich.html#contract-dsl-name)
- [第94.2.3节“忽略Contracts”](https://www.springcloud.cc/spring-cloud-greenwich.html#contract-dsl-ignoring-contracts)
- [第94.2.4节“从文件传递值”](https://www.springcloud.cc/spring-cloud-greenwich.html#contract-dsl-passing-values-from-files)
- [第94.2.5节“ HTTP顶级元素”](https://www.springcloud.cc/spring-cloud-greenwich.html#contract-dsl-http-top-level-elements)

### 94.2.1说明

您可以在合同中添加`description`。描述是任意文本。以下代码显示了一个示例：

**Groovy DSL。** 

```
			org.springframework.cloud.contract.spec.Contract.make {
				description('''
given:
	An input
when:
	Sth happens
then:
	Output
''')
			}
```



**YAML。** 

```
description: Some description
name: some name
priority: 8
ignored: true
request:
  url: /foo
  queryParameters:
    a: b
    b: c
  method: PUT
  headers:
    foo: bar
    fooReq: baz
  body:
    foo: bar
  matchers:
    body:
      - path: $.foo
        type: by_regex
        value: bar
    headers:
      - key: foo
        regex: bar
response:
  status: 200
  headers:
    foo2: bar
    foo3: foo33
    fooRes: baz
  body:
    foo2: bar
    foo3: baz
    nullValue: null
  matchers:
    body:
      - path: $.foo2
        type: by_regex
        value: bar
      - path: $.foo3
        type: by_command
        value: executeMe($it)
      - path: $.nullValue
        type: by_null
        value: null
    headers:
      - key: foo2
        regex: bar
      - key: foo3
        command: andMeToo($it)
```



### 94.2.2名称

您可以为合同提供名称。假设您提供了以下名称：`should register a user`。如果这样做，自动生成的测试的名称为`validate_should_register_a_user`。另外，WireMock存根中的存根的名称为`should_register_a_user.json`。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 您必须确保该名称不包含任何使生成的测试无法编译的字符。另外，请记住，如果为多个合同提供相同的名称，则自动生成的测试将无法编译，并且生成的存根会相互覆盖。 |      |

**Groovy DSL。** 

```
org.springframework.cloud.contract.spec.Contract.make {
	name("some_special_name")
}
```



**YAML。** 

```
name: some name
```



### 94.2.3忽略Contracts

如果要忽略合同，则可以在插件配置中设置忽略合同的值，也可以在合同本身上设置`ignored`属性：

**Groovy DSL。** 

```
org.springframework.cloud.contract.spec.Contract.make {
    ignored()
}
```



**YAML。** 

```
ignored: true
```



### 94.2.4从文件传递值

从版本`1.2.0`开始，您可以传递文件中的值。假设您在我们的项目中拥有以下资源。

```
└── src
    └── test
        └── resources
            └── contracts
                ├── readFromFile.groovy
                ├── request.json
                └── response.json
```

进一步假设您的合同如下：

**Groovy DSL。** 

```
/*
 * Copyright 2013-2019 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import org.springframework.cloud.contract.spec.Contract

Contract.make {
    request {
        method('PUT')
        headers {
            contentType(applicationJson())
        }
        body(file("request.json"))
        url("/1")
    }
    response {
        status OK()
        body(file("response.json"))
        headers {
            contentType(applicationJson())
        }
    }
}
```



**YAML。** 

```
request:
  method: GET
  url: /foo
  bodyFromFile: request.json
response:
  status: 200
  bodyFromFile: response.json
```



进一步假设JSON文件如下：

**request.json**

```
{
  "status": "REQUEST"
}
```

**response.json**

```
{
  "status": "RESPONSE"
}
```

当进行测试或存根生成时，文件的内容将传递到请求或响应的主体。文件名必须是相对于合同所在文件夹的位置的文件。

如果您需要以二进制格式传递文件的内容，则足以使用Groovy DSL中的`fileAsBytes`方法或YAML中的`bodyFromFileAsBytes`字段。

**Groovy DSL。** 

```
import org.springframework.cloud.contract.spec.Contract

Contract.make {
	request {
		url("/1")
		method(PUT())
		headers {
			contentType(applicationOctetStream())
		}
		body(fileAsBytes("request.pdf"))
	}
	response {
		status 200
		body(fileAsBytes("response.pdf"))
		headers {
			contentType(applicationOctetStream())
		}
	}
}
```



**YAML。** 

```
request:
  url: /1
  method: PUT
  headers:
    Content-Type: application/octet-stream
  bodyFromFileAsBytes: request.pdf
response:
  status: 200
  bodyFromFileAsBytes: response.pdf
  headers:
    Content-Type: application/octet-stream
```



| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 每当要使用HTTP和消息传递的二进制有效负载时，都应使用此方法。 |      |

### 94.2.5 HTTP顶级元素

在合同定义的顶级闭合中可以调用以下方法。`request`和`response`是必需的。`priority`是可选的。

**Groovy DSL。** 

```
org.springframework.cloud.contract.spec.Contract.make {
    // Definition of HTTP request part of the contract
    // (this can be a valid request or invalid depending
    // on type of contract being specified).
    request {
        method GET()
        url "/foo"
        //...
    }

    // Definition of HTTP response part of the contract
    // (a service implementing this contract should respond
    // with following response after receiving request
    // specified in "request" part above).
    response {
        status 200
        //...
    }

    // Contract priority, which can be used for overriding
    // contracts (1 is highest). Priority is optional.
    priority 1
}
```



**YAML。** 

```
priority: 8
request:
...
response:
...
```



| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 如果要使合同具有**较高**的优先级，则需要将**较低的**数字传递给`priority`标签/方法。例如，值`5`的`priority`的优先级高于值`10`的`priority`。**更高**比`priority`与{值4141 /}优先级。 |      |

## 94.3要求

HTTP协议只需要在请求中指定**方法和URL**。合同的请求定义中必须包含相同的信息。

**Groovy DSL。** 

```
org.springframework.cloud.contract.spec.Contract.make {
	request {
		// HTTP request method (GET/POST/PUT/DELETE).
		method 'GET'

		// Path component of request URL is specified as follows.
		urlPath('/users')
	}

	response {
		//...
		status 200
	}
}
```



**YAML。** 

```
method: PUT
url: /foo
```



可以指定一个绝对值而不是相对值`url`，但是建议使用`urlPath`，因为这样做会使测试**独立**于**主机**。

**Groovy DSL。** 

```
org.springframework.cloud.contract.spec.Contract.make {
	request {
		method 'GET'

		// Specifying `url` and `urlPath` in one contract is illegal.
		url('http://localhost:8888/users')
	}

	response {
		//...
		status 200
	}
}
```



**YAML。** 

```
request:
  method: PUT
  urlPath: /foo
```



`request`可能包含**查询参数**。

**Groovy DSL。** 

```
org.springframework.cloud.contract.spec.Contract.make {
    request {
        //...
        method GET()

        urlPath('/users') {

            // Each parameter is specified in form
            // `'paramName' : paramValue` where parameter value
            // may be a simple literal or one of matcher functions,
            // all of which are used in this example.
            queryParameters {

                // If a simple literal is used as value
                // default matcher function is used (equalTo)
                parameter 'limit': 100

                // `equalTo` function simply compares passed value
                // using identity operator (==).
                parameter 'filter': equalTo("email")

                // `containing` function matches strings
                // that contains passed substring.
                parameter 'gender': value(consumer(containing("[mf]")), producer('mf'))

                // `matching` function tests parameter
                // against passed regular expression.
                parameter 'offset': value(consumer(matching("[0-9]+")), producer(123))

                // `notMatching` functions tests if parameter
                // does not match passed regular expression.
                parameter 'loginStartsWith': value(consumer(notMatching(".{0,2}")), producer(3))
            }
        }

        //...
    }

    response {
        //...
        status 200
    }
}
```



**YAML。** 

```
request:
...
  queryParameters:
    a: b
    b: c
  headers:
    foo: bar
    fooReq: baz
  cookies:
    foo: bar
    fooReq: baz
  body:
    foo: bar
  matchers:
    body:
      - path: $.foo
        type: by_regex
        value: bar
    headers:
      - key: foo
        regex: bar
response:
  status: 200
  fixedDelayMilliseconds: 1000
  headers:
    foo2: bar
    foo3: foo33
    fooRes: baz
  body:
    foo2: bar
    foo3: baz
    nullValue: null
  matchers:
    body:
      - path: $.foo2
        type: by_regex
        value: bar
      - path: $.foo3
        type: by_command
        value: executeMe($it)
      - path: $.nullValue
        type: by_null
        value: null
    headers:
      - key: foo2
        regex: bar
      - key: foo3
        command: andMeToo($it)
    cookies:
      - key: foo2
        regex: bar
      - key: foo3
        predefined:
```



`request`可能包含其他**请求标头**，如以下示例所示：

**Groovy DSL。** 

```
org.springframework.cloud.contract.spec.Contract.make {
	request {
		//...
		method GET()
		url "/foo"

		// Each header is added in form `'Header-Name' : 'Header-Value'`.
		// there are also some helper methods
		headers {
			header 'key': 'value'
			contentType(applicationJson())
		}

		//...
	}

	response {
		//...
		status 200
	}
}
```



**YAML。** 

```
request:
...
headers:
  foo: bar
  fooReq: baz
```



`request`可能包含其他**请求cookie**，如以下示例所示：

**Groovy DSL。** 

```
org.springframework.cloud.contract.spec.Contract.make {
    request {
        //...
        method GET()
        url "/foo"

        // Each Cookies is added in form `'Cookie-Key' : 'Cookie-Value'`.
        // there are also some helper methods
        cookies {
            cookie 'key': 'value'
            cookie('another_key', 'another_value')
        }

        //...
    }

    response {
        //...
        status 200
    }
}
```



**YAML。** 

```
request:
...
cookies:
  foo: bar
  fooReq: baz
```



`request`可能包含一个**请求正文**：

**Groovy DSL。** 

```
org.springframework.cloud.contract.spec.Contract.make {
    request {
        //...
        method GET()
        url "/foo"

        // Currently only JSON format of request body is supported.
        // Format will be determined from a header or body's content.
        body '''{ "login" : "john", "name": "John The Contract" }'''
    }

    response {
        //...
        status 200
    }
}
```



**YAML。** 

```
request:
...
body:
  foo: bar
```



`request`可能包含**多部分**元素。要包含多部分元素，请使用`multipart`方法/部分，如以下示例所示

**Groovy DSL。** 

```

```



**YAML。** 

```
request:
  method: PUT
  url: /multipart
  headers:
    Content-Type: multipart/form-data;boundary=AaB03x
  multipart:
    params:
      # key (parameter name), value (parameter value) pair
      formParameter: '"formParameterValue"'
      someBooleanParameter: true
    named:
      - paramName: file
        fileName: filename.csv
        fileContent: file content
  matchers:
    multipart:
      params:
        - key: formParameter
          regex: ".+"
        - key: someBooleanParameter
          predefined: any_boolean
      named:
        - paramName: file
          fileName:
            predefined: non_empty
          fileContent:
            predefined: non_empty
response:
  status: 200
```



在前面的示例中，我们以两种方式之一定义参数：

**Groovy DSL**

- 直接使用映射符号，其中值可以是动态属性（例如`formParameter: $(consumer(…), producer(…))`）。
- 通过使用允许您设置命名参数的`named(…)`方法。命名参数可以设置`name`和`content`。您可以通过带有两个参数的方法（例如，`named("fileName", "fileContent")`）或通过映射表示法（例如，`named(name: "fileName", content: "fileContent")`）来调用它。

**YAML**

- 通过`multipart.params`部分设置多部分参数
- 可以通过`multipart.named`部分设置命名参数（给定参数名称的`fileName`和`fileContent`）。该部分包含`paramName`（参数名称），`fileName`（文件名称），`fileContent`（文件内容）字段
- 可以通过`matchers.multipart`部分设置动态位
  - 对于参数，请使用`params`部分，该部分可以接受`regex`或`predefined`正则表达式
  - 对于命名参数，请使用`named`部分，其中首先通过`paramName`定义参数名称，然后可以通过`regex`或{12 /传递`fileName`或`fileContent`的参数化} 正则表达式

根据该合同，生成的测试如下：

```
// given:
 MockMvcRequestSpecification request = given()
   .header("Content-Type", "multipart/form-data;boundary=AaB03x")
   .param("formParameter", "\"formParameterValue\"")
   .param("someBooleanParameter", "true")
   .multiPart("file", "filename.csv", "file content".getBytes());

// when:
 ResponseOptions response = given().spec(request)
   .put("/multipart");

// then:
 assertThat(response.statusCode()).isEqualTo(200);
```

WireMock存根如下：

```
            '''
{
  "request" : {
    "url" : "/multipart",
    "method" : "PUT",
    "headers" : {
      "Content-Type" : {
        "matches" : "multipart/form-data;boundary=AaB03x.*"
      }
    },
    "bodyPatterns" : [ {
        "matches" : ".*--(.*)\\r\\nContent-Disposition: form-data; name=\\"formParameter\\"\\r\\n(Content-Type: .*\\r\\n)?(Content-Transfer-Encoding: .*\\r\\n)?(Content-Length: \\\\d+\\r\\n)?\\r\\n\\".+\\"\\r\\n--\\\\1.*"
        }, {
                "matches" : ".*--(.*)\\r\\nContent-Disposition: form-data; name=\\"someBooleanParameter\\"\\r\\n(Content-Type: .*\\r\\n)?(Content-Transfer-Encoding: .*\\r\\n)?(Content-Length: \\\\d+\\r\\n)?\\r\\n(true|false)\\r\\n--\\\\1.*"
        }, {
      "matches" : ".*--(.*)\\r\\nContent-Disposition: form-data; name=\\"file\\"; filename=\\"[\\\\S\\\\s]+\\"\\r\\n(Content-Type: .*\\r\\n)?(Content-Transfer-Encoding: .*\\r\\n)?(Content-Length: \\\\d+\\r\\n)?\\r\\n[\\\\S\\\\s]+\\r\\n--\\\\1.*"
    } ]
  },
  "response" : {
    "status" : 200,
    "transformers" : [ "response-template", "foo-transformer" ]
  }
}
    '''
```

## 94.4回应

响应必须包含**HTTP状态代码，**并且可能包含其他信息。以下代码显示了一个示例：

**Groovy DSL。** 

```
org.springframework.cloud.contract.spec.Contract.make {
    request {
        //...
        method GET()
        url "/foo"
    }
    response {
        // Status code sent by the server
        // in response to request specified above.
        status OK()
    }
}
```



**YAML。** 

```
response:
...
status: 200
```



除了status之外，响应还可以包含**header**，**cookie**和**body**，它们的指定方式与请求中的指定方式相同（请参见上一段）。

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 通过Groovy DSL，您可以引用`org.springframework.cloud.contract.spec.internal.HttpStatus`方法来提供有意义的状态而不是数字。例如，您可以呼叫`OK()`来获取状态`200`或致电`BAD_REQUEST()`来获取`400`。 |

## 94.5动态特性

合同可以包含一些动态属性：时间戳记，ID等。您不想强迫使用者将其时钟存根始终返回相同的时间值，以使它与存根匹配。

对于Groovy DSL，您可以通过两种方式在合同中提供动态部分：将它们直接传递到正文中，或在称为`bodyMatchers`的单独部分中进行设置。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 在2.0.0之前，这些版本是使用`testMatchers`和`stubMatchers`设置的，请查看[迁移指南](https://github.com/spring-cloud/spring-cloud-contract/wiki/Spring-Cloud-Contract-2.0-Migration-Guide)以获取更多信息。 |

对于YAML，您只能使用`matchers`部分。

### 94.5.1体内的动态特性

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 本部分仅对Groovy DSL有效。请查看 [第94.5.7节“匹配器节中的动态Properties”](https://www.springcloud.cc/spring-cloud-greenwich.html#contract-matchers)一节，以获取类似功能的YAML示例。 |      |

您可以使用`value`方法设置主体内部的属性，或者如果使用Groovy映射符号，则可以使用`$()`设置主体内部的属性。下面的示例演示如何使用value方法设置动态属性：

```
value(consumer(...), producer(...))
value(c(...), p(...))
value(stub(...), test(...))
value(client(...), server(...))
```

以下示例说明如何使用`$()`设置动态属性：

```
$(consumer(...), producer(...))
$(c(...), p(...))
$(stub(...), test(...))
$(client(...), server(...))
```

两种方法都同样有效。`stub`和`client`方法是`consumer`方法的别名。接下来的部分将详细介绍您可以使用这些值做什么。

### 94.5.2正则表达式

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 本部分仅对Groovy DSL有效。请查看 [第94.5.7节“匹配器节中的动态Properties”](https://www.springcloud.cc/spring-cloud-greenwich.html#contract-matchers)一节，以获取类似功能的YAML示例。 |      |

您可以使用正则表达式在Contract DSL中编写请求。当您想要指示应遵循给定模式的请求提供给定响应时，这样做特别有用。另外，在测试和服务器端测试都需要使用模式而不是精确值时，可以使用正则表达式。

下面的示例演示如何使用正则表达式编写请求：

```
org.springframework.cloud.contract.spec.Contract.make {
    request {
        method('GET')
        url $(consumer(~/\/[0-9]{2}/), producer('/12'))
    }
    response {
        status OK()
        body(
                id: $(anyNumber()),
                surname: $(
                        consumer('Kowalsky'),
                        producer(regex('[a-zA-Z]+'))
                ),
                name: 'Jan',
                created: $(consumer('2014-02-02 12:23:43'), producer(execute('currentDate(it)'))),
                correlationId: value(consumer('5d1f9fef-e0dc-4f3d-a7e4-72d2220dd827'),
                        producer(regex('[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}'))
                )
        )
        headers {
            header 'Content-Type': 'text/plain'
        }
    }
}
```

您也只能在通信的一侧提供正则表达式。如果这样做，那么合同引擎将自动提供与提供的正则表达式匹配的生成的字符串。以下代码显示了一个示例：

```
org.springframework.cloud.contract.spec.Contract.make {
	request {
		method 'PUT'
		url value(consumer(regex('/foo/[0-9]{5}')))
		body([
				requestElement: $(consumer(regex('[0-9]{5}')))
		])
		headers {
			header('header', $(consumer(regex('application\\/vnd\\.fraud\\.v1\\+json;.*'))))
		}
	}
	response {
		status OK()
		body([
				responseElement: $(producer(regex('[0-9]{7}')))
		])
		headers {
			contentType("application/vnd.fraud.v1+json")
		}
	}
}
```

在前面的示例中，通信的另一端具有为请求和响应而生成的相应数据。

Spring Cloud Contract带有一系列可在合同中使用的预定义正则表达式，如以下示例所示：

```
protected static final Pattern TRUE_OR_FALSE = Pattern.compile(/(true|false)/)
protected static final Pattern ALPHA_NUMERIC = Pattern.compile('[a-zA-Z0-9]+')
protected static final Pattern ONLY_ALPHA_UNICODE = Pattern.compile(/[\p{L}]*/)
protected static final Pattern NUMBER = Pattern.compile('-?(\\d*\\.\\d+|\\d+)')
protected static final Pattern INTEGER = Pattern.compile('-?(\\d+)')
protected static final Pattern POSITIVE_INT = Pattern.compile('([1-9]\\d*)')
protected static final Pattern DOUBLE = Pattern.compile('-?(\\d*\\.\\d+)')
protected static final Pattern HEX = Pattern.compile('[a-fA-F0-9]+')
protected static final Pattern IP_ADDRESS = Pattern.
        compile('([01]?\\d\\d?|2[0-4]\\d|25[0-5])\\.([01]?\\d\\d?|2[0-4]\\d|25[0-5])\\.([01]?\\d\\d?|2[0-4]\\d|25[0-5])\\.([01]?\\d\\d?|2[0-4]\\d|25[0-5])')
protected static final Pattern HOSTNAME_PATTERN = Pattern.
        compile('((http[s]?|ftp):/)/?([^:/\\s]+)(:[0-9]{1,5})?')
protected static final Pattern EMAIL = Pattern.
        compile('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}')
protected static final Pattern URL = UrlHelper.URL
protected static final Pattern HTTPS_URL = UrlHelper.HTTPS_URL
protected static final Pattern UUID = Pattern.
        compile('[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}')
protected static final Pattern ANY_DATE = Pattern.
        compile('(\\d\\d\\d\\d)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])')
protected static final Pattern ANY_DATE_TIME = Pattern.
        compile('([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])')
protected static final Pattern ANY_TIME = Pattern.
        compile('(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])')
protected static final Pattern NON_EMPTY = Pattern.compile(/[\S\s]+/)
protected static final Pattern NON_BLANK = Pattern.compile(/^\s*\S[\S\s]*/)
protected static final Pattern ISO8601_WITH_OFFSET = Pattern.
        compile(/([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\.\d{1,6})?(Z|[+-][01]\d:[0-5]\d)/)

protected static Pattern anyOf(String... values) {
    return Pattern.compile(values.collect({ "^$it\$" }).join("|"))
}

RegexProperty onlyAlphaUnicode() {
    return new RegexProperty(ONLY_ALPHA_UNICODE).asString()
}

RegexProperty alphaNumeric() {
    return new RegexProperty(ALPHA_NUMERIC).asString()
}

RegexProperty number() {
    return new RegexProperty(NUMBER).asDouble()
}

RegexProperty positiveInt() {
    return new RegexProperty(POSITIVE_INT).asInteger()
}

RegexProperty anyBoolean() {
    return new RegexProperty(TRUE_OR_FALSE).asBooleanType()
}

RegexProperty anInteger() {
    return new RegexProperty(INTEGER).asInteger()
}

RegexProperty aDouble() {
    return new RegexProperty(DOUBLE).asDouble()
}

RegexProperty ipAddress() {
    return new RegexProperty(IP_ADDRESS).asString()
}

RegexProperty hostname() {
    return new RegexProperty(HOSTNAME_PATTERN).asString()
}

RegexProperty email() {
    return new RegexProperty(EMAIL).asString()
}

RegexProperty url() {
    return new RegexProperty(URL).asString()
}

RegexProperty httpsUrl() {
    return new RegexProperty(HTTPS_URL).asString()
}

RegexProperty uuid() {
    return new RegexProperty(UUID).asString()
}

RegexProperty isoDate() {
    return new RegexProperty(ANY_DATE).asString()
}

RegexProperty isoDateTime() {
    return new RegexProperty(ANY_DATE_TIME).asString()
}

RegexProperty isoTime() {
    return new RegexProperty(ANY_TIME).asString()
}

RegexProperty iso8601WithOffset() {
    return new RegexProperty(ISO8601_WITH_OFFSET).asString()
}

RegexProperty nonEmpty() {
    return new RegexProperty(NON_EMPTY).asString()
}

RegexProperty nonBlank() {
    return new RegexProperty(NON_BLANK).asString()
}
```

在您的合同中，可以按以下示例所示使用它：

```
Contract dslWithOptionalsInString = Contract.make {
    priority 1
    request {
        method POST()
        url '/users/password'
        headers {
            contentType(applicationJson())
        }
        body(
                email: $(consumer(optional(regex(email()))), producer('abc@abc.com')),
                callback_url: $(consumer(regex(hostname())), producer('http://partners.com'))
        )
    }
    response {
        status 404
        headers {
            contentType(applicationJson())
        }
        body(
                code: value(consumer("123123"), producer(optional("123123"))),
                message: "User not found by email = [${value(producer(regex(email())), consumer('not.existing@user.com'))}]"
        )
    }
}
```

为了使事情变得更加简单，您可以使用一组预定义的对象，这些对象将自动假定您要传递正则表达式。所有这些方法均以`any`前缀开头：

```
T anyAlphaUnicode()

T anyAlphaNumeric()

T anyNumber()

T anyInteger()

T anyPositiveInt()

T anyDouble()

T anyHex()

T aBoolean()

T anyIpAddress()

T anyHostname()

T anyEmail()

T anyUrl()

T anyHttpsUrl()

T anyUuid()

T anyDate()

T anyDateTime()

T anyTime()

T anyIso8601WithOffset()

T anyNonBlankString()

T anyNonEmptyString()

T anyOf(String... values)
```

这是如何引用这些方法的示例：

```
Contract contractDsl = Contract.make {
	label 'trigger_event'
	input {
		triggeredBy('toString()')
	}
	outputMessage {
		sentTo 'topic.rateablequote'
		body([
				alpha            : $(anyAlphaUnicode()),
				number           : $(anyNumber()),
				anInteger        : $(anyInteger()),
				positiveInt      : $(anyPositiveInt()),
				aDouble          : $(anyDouble()),
				aBoolean         : $(aBoolean()),
				ip               : $(anyIpAddress()),
				hostname         : $(anyHostname()),
				email            : $(anyEmail()),
				url              : $(anyUrl()),
				httpsUrl         : $(anyHttpsUrl()),
				uuid             : $(anyUuid()),
				date             : $(anyDate()),
				dateTime         : $(anyDateTime()),
				time             : $(anyTime()),
				iso8601WithOffset: $(anyIso8601WithOffset()),
				nonBlankString   : $(anyNonBlankString()),
				nonEmptyString   : $(anyNonEmptyString()),
				anyOf            : $(anyOf('foo', 'bar'))
		])
	}
}
```

### 94.5.3传递可选参数

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 本部分仅对Groovy DSL有效。请查看 [第94.5.7节“匹配器节中的动态Properties”](https://www.springcloud.cc/spring-cloud-greenwich.html#contract-matchers)一节，以获取类似功能的YAML示例。 |      |

可以在合同中提供可选参数。但是，只能为以下项提供可选参数：

- 请求的 *STUB*端
- 回应的*测试*方

以下示例显示了如何提供可选参数：

```
org.springframework.cloud.contract.spec.Contract.make {
	priority 1
	request {
		method 'POST'
		url '/users/password'
		headers {
			contentType(applicationJson())
		}
		body(
				email: $(consumer(optional(regex(email()))), producer('abc@abc.com')),
				callback_url: $(consumer(regex(hostname())), producer('https://partners.com'))
		)
	}
	response {
		status 404
		headers {
			header 'Content-Type': 'application/json'
		}
		body(
				code: value(consumer("123123"), producer(optional("123123")))
		)
	}
}
```

通过使用`optional()`方法包装正文的一部分，可以创建必须存在0次或多次的正则表达式。

如果您将Spock用于其中，则将从上一个示例生成以下测试：

```
                    """
 given:
  def request = given()
    .header("Content-Type", "application/json")
    .body('''{"email":"abc@abc.com","callback_url":"https://partners.com"}''')

 when:
  def response = given().spec(request)
    .post("/users/password")

 then:
  response.statusCode == 404
  response.header('Content-Type')  == 'application/json'
 and:
  DocumentContext parsedJson = JsonPath.parse(response.body.asString())
  assertThatJson(parsedJson).field("['code']").matches("(123123)?")
"""
```

还将生成以下存根：

```
                    '''
{
  "request" : {
    "url" : "/users/password",
    "method" : "POST",
    "bodyPatterns" : [ {
      "matchesJsonPath" : "$[?(@.['email'] =~ /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,6})?/)]"
    }, {
      "matchesJsonPath" : "$[?(@.['callback_url'] =~ /((http[s]?|ftp):\\\\/)\\\\/?([^:\\\\/\\\\s]+)(:[0-9]{1,5})?/)]"
    } ],
    "headers" : {
      "Content-Type" : {
        "equalTo" : "application/json"
      }
    }
  },
  "response" : {
    "status" : 404,
    "body" : "{\\"code\\":\\"123123\\",\\"message\\":\\"User not found by email == [not.existing@user.com]\\"}",
    "headers" : {
      "Content-Type" : "application/json"
    }
  },
  "priority" : 1
}
'''
```

### 94.5.4在服务器端执行自定义方法

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 本部分仅对Groovy DSL有效。请查看 [第94.5.7节“匹配器节中的动态Properties”](https://www.springcloud.cc/spring-cloud-greenwich.html#contract-matchers)一节，以获取类似功能的YAML示例。 |      |

您可以定义在测试期间在服务器端执行的方法调用。可以将这种方法添加到配置中定义为“ baseClassForTests”的类中。以下代码显示了测试用例的合同部分的示例：

```
org.springframework.cloud.contract.spec.Contract.make {
    request {
        method 'PUT'
        url $(consumer(regex('^/api/[0-9]{2}$')), producer('/api/12'))
        headers {
            header 'Content-Type': 'application/json'
        }
        body '''\
            [{
                "text": "Gonna see you at Warsaw"
            }]
        '''
    }
    response {
        body(
                path: $(consumer('/api/12'), producer(regex('^/api/[0-9]{2}$'))),
                correlationId: $(consumer('1223456'), producer(execute('isProperCorrelationId($it)')))
        )
        status OK()
    }
}
```

以下代码显示了测试用例的基类部分：

```
abstract class BaseMockMvcSpec extends Specification {

    def setup() {
        RestAssuredMockMvc.standaloneSetup(new PairIdController())
    }

    void isProperCorrelationId(Integer correlationId) {
        assert correlationId == 123456
    }

    void isEmpty(String value) {
        assert value == null
    }

}
```

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 您不能同时使用String和`execute`来执行串联。例如，呼叫`header('Authorization', 'Bearer ' + execute('authToken()'))`会导致不正确的结果。而是调用`header('Authorization', execute('authToken()'))`并确保`authToken()`方法返回您需要的所有内容。 |      |

从JSON读取的对象的类型可以是以下之一，具体取决于JSON路径：

- `String`：如果您指向JSON中的`String`值。
- `JSONArray`：如果您指向JSON中的`List`。
- `Map`：如果您指向JSON中的`Map`。
- `Number`：如果您指向JSON中的`Integer`，`Double`等。
- `Boolean`：如果您指向JSON中的`Boolean`。

在合同的请求部分，您可以指定`body`应该从方法中获取。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 您必须同时提供消费者和生产方。`execute`部分适用于整个身体-不适用于部分身体。 |      |

以下示例显示如何从JSON读取对象：

```
Contract contractDsl = Contract.make {
	request {
		method 'GET'
		url '/something'
		body(
				$(c('foo'), p(execute('hashCode()')))
		)
	}
	response {
		status OK()
	}
}
```

前面的示例导致在请求正文中调用`hashCode()`方法。它应类似于以下代码：

```
// given:
 MockMvcRequestSpecification request = given()
   .body(hashCode());

// when:
 ResponseOptions response = given().spec(request)
   .get("/something");

// then:
 assertThat(response.statusCode()).isEqualTo(200);
```

### 94.5.5引用响应中的请求

最好的情况是提供固定值，但是有时您需要在响应中引用一个请求。

如果您使用Groovy DSL编写合同，则可以使用`fromRequest()`方法，该方法使您可以从HTTP请求中引用一堆元素。您可以使用以下选项：

- `fromRequest().url()`：返回请求URL和查询参数。
- `fromRequest().query(String key)`：返回具有给定名称的第一个查询参数。
- `fromRequest().query(String key, int index)`：返回具有给定名称的第n个查询参数。
- `fromRequest().path()`：返回完整路径。
- `fromRequest().path(int index)`：返回第n个路径元素。
- `fromRequest().header(String key)`：返回具有给定名称的第一个标头。
- `fromRequest().header(String key, int index)`：返回具有给定名称的第n个标题。
- `fromRequest().body()`：返回完整的请求正文。
- `fromRequest().body(String jsonPath)`：从请求中返回与JSON路径匹配的元素。

如果您使用的是YAML合同定义，则必须使用带有自定义Spring Cloud Contract函数的 [Handlebars](https://handlebarsjs.com/) `{{{ }}}`符号来实现此目的。

- `{{{ request.url }}}`：返回请求URL和查询参数。
- `{{{ request.query.key.[index] }}}`：返回具有给定名称的第n个查询参数。例如，键`foo`的第一个条目`{{{ request.query.foo.[0] }}}`
- `{{{ request.path }}}`：返回完整路径。
- `{{{ request.path.[index] }}}`：返回第n个路径元素。例如，首次输入``` {{{request.path。[0] }}}
- `{{{ request.headers.key }}}`：返回具有给定名称的第一个标头。
- `{{{ request.headers.key.[index] }}}`：返回具有给定名称的第n个标头。
- `{{{ request.body }}}`：返回完整的请求正文。
- `{{{ jsonpath this 'your.json.path' }}}`：从请求中返回与JSON路径匹配的元素。例如json路径`$.foo`-`{{{ jsonpath this '$.foo' }}}`

考虑以下合同：

**Groovy DSL。** 

```

```



**YAML。** 

```
request:
  method: GET
  url: /api/v1/xxxx
  queryParameters:
    foo:
      - bar
      - bar2
  headers:
    Authorization:
      - secret
      - secret2
  body:
    foo: bar
    baz: 5
response:
  status: 200
  headers:
    Authorization: "foo {{{ request.headers.Authorization.0 }}} bar"
  body:
    url: "{{{ request.url }}}"
    path: "{{{ request.path }}}"
    pathIndex: "{{{ request.path.1 }}}"
    param: "{{{ request.query.foo }}}"
    paramIndex: "{{{ request.query.foo.1 }}}"
    authorization: "{{{ request.headers.Authorization.0 }}}"
    authorization2: "{{{ request.headers.Authorization.1 }}"
    fullBody: "{{{ request.body }}}"
    responseFoo: "{{{ jsonpath this '$.foo' }}}"
    responseBaz: "{{{ jsonpath this '$.baz' }}}"
    responseBaz2: "Bla bla {{{ jsonpath this '$.foo' }}} bla bla"
```



运行JUnit测试生成将导致类似于以下示例的测试：

```
// given:
 MockMvcRequestSpecification request = given()
   .header("Authorization", "secret")
   .header("Authorization", "secret2")
   .body("{\"foo\":\"bar\",\"baz\":5}");

// when:
 ResponseOptions response = given().spec(request)
   .queryParam("foo","bar")
   .queryParam("foo","bar2")
   .get("/api/v1/xxxx");

// then:
 assertThat(response.statusCode()).isEqualTo(200);
 assertThat(response.header("Authorization")).isEqualTo("foo secret bar");
// and:
 DocumentContext parsedJson = JsonPath.parse(response.getBody().asString());
 assertThatJson(parsedJson).field("['fullBody']").isEqualTo("{\"foo\":\"bar\",\"baz\":5}");
 assertThatJson(parsedJson).field("['authorization']").isEqualTo("secret");
 assertThatJson(parsedJson).field("['authorization2']").isEqualTo("secret2");
 assertThatJson(parsedJson).field("['path']").isEqualTo("/api/v1/xxxx");
 assertThatJson(parsedJson).field("['param']").isEqualTo("bar");
 assertThatJson(parsedJson).field("['paramIndex']").isEqualTo("bar2");
 assertThatJson(parsedJson).field("['pathIndex']").isEqualTo("v1");
 assertThatJson(parsedJson).field("['responseBaz']").isEqualTo(5);
 assertThatJson(parsedJson).field("['responseFoo']").isEqualTo("bar");
 assertThatJson(parsedJson).field("['url']").isEqualTo("/api/v1/xxxx?foo=bar&foo=bar2");
 assertThatJson(parsedJson).field("['responseBaz2']").isEqualTo("Bla bla bar bla bla");
```

如您所见，响应中已正确引用了请求中的元素。

生成的WireMock存根应类似于以下示例：

```
{
  "request" : {
    "urlPath" : "/api/v1/xxxx",
    "method" : "POST",
    "headers" : {
      "Authorization" : {
        "equalTo" : "secret2"
      }
    },
    "queryParameters" : {
      "foo" : {
        "equalTo" : "bar2"
      }
    },
    "bodyPatterns" : [ {
      "matchesJsonPath" : "$[?(@.['baz'] == 5)]"
    }, {
      "matchesJsonPath" : "$[?(@.['foo'] == 'bar')]"
    } ]
  },
  "response" : {
    "status" : 200,
    "body" : "{\"authorization\":\"{{{request.headers.Authorization.[0]}}}\",\"path\":\"{{{request.path}}}\",\"responseBaz\":{{{jsonpath this '$.baz'}}} ,\"param\":\"{{{request.query.foo.[0]}}}\",\"pathIndex\":\"{{{request.path.[1]}}}\",\"responseBaz2\":\"Bla bla {{{jsonpath this '$.foo'}}} bla bla\",\"responseFoo\":\"{{{jsonpath this '$.foo'}}}\",\"authorization2\":\"{{{request.headers.Authorization.[1]}}}\",\"fullBody\":\"{{{escapejsonbody}}}\",\"url\":\"{{{request.url}}}\",\"paramIndex\":\"{{{request.query.foo.[1]}}}\"}",
    "headers" : {
      "Authorization" : "{{{request.headers.Authorization.[0]}}};foo"
    },
    "transformers" : [ "response-template" ]
  }
}
```

发送请求（例如合同的`request`部分中提出的请求）会导致发送以下响应正文：

```
{
  "url" : "/api/v1/xxxx?foo=bar&foo=bar2",
  "path" : "/api/v1/xxxx",
  "pathIndex" : "v1",
  "param" : "bar",
  "paramIndex" : "bar2",
  "authorization" : "secret",
  "authorization2" : "secret2",
  "fullBody" : "{\"foo\":\"bar\",\"baz\":5}",
  "responseFoo" : "bar",
  "responseBaz" : 5,
  "responseBaz2" : "Bla bla bar bla bla"
}
```

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 此功能仅适用于版本大于或等于2.5.1的WireMock。Spring Cloud Contract验证程序使用WireMock的`response-template`响应转换器。它使用把手将“ Mustache `{{{ }}}`”模板转换为适当的值。此外，它注册了两个帮助程序功能： |      |

- `escapejsonbody`：以可以嵌入JSON的格式转义请求正文。
- `jsonpath`：对于给定的参数，在请求正文中找到一个对象。

### 94.5.6注册自己的WireMock扩展

WireMock允许您注册自定义扩展。默认情况下，Spring Cloud Contract注册该转换器，使您可以引用响应中的请求。如果要提供自己的扩展，则可以注册`org.springframework.cloud.contract.verifier.dsl.wiremock.WireMockExtensions`接口的实现。由于我们使用spring.factories扩展方法，因此可以在`META-INF/spring.factories`文件中创建一个类似于以下内容的条目：

```
org.springframework.cloud.contract.verifier.dsl.wiremock.WireMockExtensions=\
org.springframework.cloud.contract.stubrunner.provider.wiremock.TestWireMockExtensions
org.springframework.cloud.contract.spec.ContractConverter=\
org.springframework.cloud.contract.stubrunner.TestCustomYamlContractConverter
```

以下是自定义扩展的示例：

**TestWireMockExtensions.groovy。** 

```
/*
 * Copyright 2013-2019 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.springframework.cloud.contract.verifier.dsl.wiremock

import com.github.tomakehurst.wiremock.extension.Extension

/**
 * Extension that registers the default transformer and the custom one
 */
class TestWireMockExtensions implements WireMockExtensions {
    @Override
    List<Extension> extensions() {
        return [
                new DefaultResponseTransformer(),
                new CustomExtension()
        ]
    }
}

class CustomExtension implements Extension {

    @Override
    String getName() {
        return "foo-transformer"
    }
}
```



| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 如果要将转换仅应用于明确需要它的映射，请记住重写`applyGlobally()`方法并将其设置为`false`。 |      |

### 94.5.7“匹配器”部分中的动态Properties

如果您使用[Pact](https://docs.pact.io/)，那么以下讨论可能看起来很熟悉。很少有用户习惯于在主体之间进行分隔并设置合同的动态部分。

您可以使用`bodyMatchers`部分有两个原因：

- 定义应该以存根结尾的动态值。您可以在合同的`request`或`inputMessage`部分中进行设置。
- 验证测试结果。本部分位于合同的`response`或`outputMessage`中。

当前，Spring Cloud Contract验证程序仅支持具有以下匹配可能性的基于JSON路径的匹配器：

**Groovy DSL**

- 对于存根（在消费者方面的测试中）：
  - `byEquality()`：通过提供的JSON路径从消费者请求中获取的值必须等于合同中提供的值。
  - `byRegex(…)`：通过提供的JSON路径从消费者请求中获取的值必须与正则表达式匹配。您还可以传递期望的匹配值的类型（例如`asString()`，`asLong()`等）
  - `byDate()`：通过提供的JSON路径从消费者请求中获取的值必须与ISO日期值的正则表达式匹配。
  - `byTimestamp()`：通过提供的JSON路径从消费者请求中获取的值必须与ISO DateTime值的正则表达式匹配。
  - `byTime()`：通过提供的JSON路径从消费者请求中获取的值必须与ISO时间值的正则表达式匹配。
- 进行验证（在生产者方生成的测试中）：
  - `byEquality()`：通过提供的JSON路径从生产者的响应中获取的值必须等于合同中提供的值。
  - `byRegex(…)`：通过提供的JSON路径从生产者的响应中获取的值必须与正则表达式匹配。
  - `byDate()`：通过提供的JSON路径从生产者的响应中获取的值必须与ISO日期值的正则表达式匹配。
  - `byTimestamp()`：通过提供的JSON路径从生产者的响应中获取的值必须与ISO DateTime值的正则表达式匹配。
  - `byTime()`：通过提供的JSON路径从生产者的响应中获取的值必须与ISO时间值的正则表达式匹配。
  - `byType()`：通过提供的JSON路径从生产者的响应中获取的值必须与合同中的响应主体中定义的类型相同。`byType`可以关闭，您可以在其中设置`minOccurrence`和`maxOccurrence`。对于请求端，应该使用闭包声明集合的大小。这样，您可以声明展平集合的大小。要检查未展平的集合的大小，请对`byCommand(…)` testMatcher使用自定义方法。
  - `byCommand(…)`：通过提供的JSON路径从生产者的响应中获取的值作为输入传递到您提供的自定义方法。例如，`byCommand('foo($it)')`导致调用`foo`方法，与JSON路径匹配的值将传递到该方法。从JSON读取的对象的类型可以是以下之一，具体取决于JSON路径：
    - `String`：如果您指向`String`值。
    - `JSONArray`：如果指向`List`。
    - `Map`：如果指向`Map`。
    - `Number`：如果指向`Integer`，`Double`或其他类型的数字。
    - `Boolean`：如果指向`Boolean`。
  - `byNull()`：通过提供的JSON路径从响应中获取的值必须为null

**YAML。** *请阅读Groovy部分，详细了解类型的含义*

对于YAML，匹配器的结构如下所示

```
- path: $.foo
  type: by_regex
  value: bar
  regexType: as_string
```

或者，如果您要使用预定义的正则表达式之一`[only_alpha_unicode, number, any_boolean, ip_address, hostname, email, url, uuid, iso_date, iso_date_time, iso_time, iso_8601_with_offset, non_empty, non_blank]`：

```
- path: $.foo
  type: by_regex
  predefined: only_alpha_unicode
```

在下面，您可以找到允许的“类型”列表。

- 对于`stubMatchers`：
  - `by_equality`
  - `by_regex`
  - `by_date`
  - `by_timestamp`
  - `by_time`
  - `by_type`
    - 还有2个其他字段被接受：`minOccurrence`和`maxOccurrence`。
- 对于`testMatchers`：
  - `by_equality`
  - `by_regex`
  - `by_date`
  - `by_timestamp`
  - `by_time`
  - `by_type`
    - 还有2个其他字段：`minOccurrence`和`maxOccurrence`。
  - `by_command`
  - `by_null`

您还可以通过`regexType`字段定义正则表达式对应的类型。在下面，您可以找到允许的正则表达式类型列表：

- as_integer
- as_double
- as_float，
- 只要
- as_short
- as_boolean
- as_string

考虑以下示例：

**Groovy DSL。** 

```
Contract contractDsl = Contract.make {
    request {
        method 'GET'
        urlPath '/get'
        body([
                duck                : 123,
                alpha               : 'abc',
                number              : 123,
                aBoolean            : true,
                date                : '2017-01-01',
                dateTime            : '2017-01-01T01:23:45',
                time                : '01:02:34',
                valueWithoutAMatcher: 'foo',
                valueWithTypeMatch  : 'string',
                key                 : [
                        'complex.key': 'foo'
                ]
        ])
        bodyMatchers {
            jsonPath('$.duck', byRegex("[0-9]{3}").asInteger())
            jsonPath('$.duck', byEquality())
            jsonPath('$.alpha', byRegex(onlyAlphaUnicode()).asString())
            jsonPath('$.alpha', byEquality())
            jsonPath('$.number', byRegex(number()).asInteger())
            jsonPath('$.aBoolean', byRegex(anyBoolean()).asBooleanType())
            jsonPath('$.date', byDate())
            jsonPath('$.dateTime', byTimestamp())
            jsonPath('$.time', byTime())
            jsonPath("\$.['key'].['complex.key']", byEquality())
        }
        headers {
            contentType(applicationJson())
        }
    }
    response {
        status OK()
        body([
                duck                 : 123,
                alpha                : 'abc',
                number               : 123,
                positiveInteger      : 1234567890,
                negativeInteger      : -1234567890,
                positiveDecimalNumber: 123.4567890,
                negativeDecimalNumber: -123.4567890,
                aBoolean             : true,
                date                 : '2017-01-01',
                dateTime             : '2017-01-01T01:23:45',
                time                 : "01:02:34",
                valueWithoutAMatcher : 'foo',
                valueWithTypeMatch   : 'string',
                valueWithMin         : [
                        1, 2, 3
                ],
                valueWithMax         : [
                        1, 2, 3
                ],
                valueWithMinMax      : [
                        1, 2, 3
                ],
                valueWithMinEmpty    : [],
                valueWithMaxEmpty    : [],
                key                  : [
                        'complex.key': 'foo'
                ],
                nullValue            : null
        ])
        bodyMatchers {
            // asserts the jsonpath value against manual regex
            jsonPath('$.duck', byRegex("[0-9]{3}").asInteger())
            // asserts the jsonpath value against the provided value
            jsonPath('$.duck', byEquality())
            // asserts the jsonpath value against some default regex
            jsonPath('$.alpha', byRegex(onlyAlphaUnicode()).asString())
            jsonPath('$.alpha', byEquality())
            jsonPath('$.number', byRegex(number()).asInteger())
            jsonPath('$.positiveInteger', byRegex(anInteger()).asInteger())
            jsonPath('$.negativeInteger', byRegex(anInteger()).asInteger())
            jsonPath('$.positiveDecimalNumber', byRegex(aDouble()).asDouble())
            jsonPath('$.negativeDecimalNumber', byRegex(aDouble()).asDouble())
            jsonPath('$.aBoolean', byRegex(anyBoolean()).asBooleanType())
            // asserts vs inbuilt time related regex
            jsonPath('$.date', byDate())
            jsonPath('$.dateTime', byTimestamp())
            jsonPath('$.time', byTime())
            // asserts that the resulting type is the same as in response body
            jsonPath('$.valueWithTypeMatch', byType())
            jsonPath('$.valueWithMin', byType {
                // results in verification of size of array (min 1)
                minOccurrence(1)
            })
            jsonPath('$.valueWithMax', byType {
                // results in verification of size of array (max 3)
                maxOccurrence(3)
            })
            jsonPath('$.valueWithMinMax', byType {
                // results in verification of size of array (min 1 & max 3)
                minOccurrence(1)
                maxOccurrence(3)
            })
            jsonPath('$.valueWithMinEmpty', byType {
                // results in verification of size of array (min 0)
                minOccurrence(0)
            })
            jsonPath('$.valueWithMaxEmpty', byType {
                // results in verification of size of array (max 0)
                maxOccurrence(0)
            })
            // will execute a method `assertThatValueIsANumber`
            jsonPath('$.duck', byCommand('assertThatValueIsANumber($it)'))
            jsonPath("\$.['key'].['complex.key']", byEquality())
            jsonPath('$.nullValue', byNull())
        }
        headers {
            contentType(applicationJson())
            header('Some-Header', $(c('someValue'), p(regex('[a-zA-Z]{9}'))))
        }
    }
}
```



**YAML。** 

```
request:
  method: GET
  urlPath: /get/1
  headers:
    Content-Type: application/json
  cookies:
    foo: 2
    bar: 3
  queryParameters:
    limit: 10
    offset: 20
    filter: 'email'
    sort: name
    search: 55
    age: 99
    name: John.Doe
    email: 'bob@email.com'
  body:
    duck: 123
    alpha: "abc"
    number: 123
    aBoolean: true
    date: "2017-01-01"
    dateTime: "2017-01-01T01:23:45"
    time: "01:02:34"
    valueWithoutAMatcher: "foo"
    valueWithTypeMatch: "string"
    key:
      "complex.key": 'foo'
    nullValue: null
    valueWithMin:
      - 1
      - 2
      - 3
    valueWithMax:
      - 1
      - 2
      - 3
    valueWithMinMax:
      - 1
      - 2
      - 3
    valueWithMinEmpty: []
    valueWithMaxEmpty: []
  matchers:
    url:
      regex: /get/[0-9]
      # predefined:
      # execute a method
      #command: 'equals($it)'
    queryParameters:
      - key: limit
        type: equal_to
        value: 20
      - key: offset
        type: containing
        value: 20
      - key: sort
        type: equal_to
        value: name
      - key: search
        type: not_matching
        value: '^[0-9]{2}$'
      - key: age
        type: not_matching
        value: '^\\w*$'
      - key: name
        type: matching
        value: 'John.*'
      - key: hello
        type: absent
    cookies:
      - key: foo
        regex: '[0-9]'
      - key: bar
        command: 'equals($it)'
    headers:
      - key: Content-Type
        regex: "application/json.*"
    body:
      - path: $.duck
        type: by_regex
        value: "[0-9]{3}"
      - path: $.duck
        type: by_equality
      - path: $.alpha
        type: by_regex
        predefined: only_alpha_unicode
      - path: $.alpha
        type: by_equality
      - path: $.number
        type: by_regex
        predefined: number
      - path: $.aBoolean
        type: by_regex
        predefined: any_boolean
      - path: $.date
        type: by_date
      - path: $.dateTime
        type: by_timestamp
      - path: $.time
        type: by_time
      - path: "$.['key'].['complex.key']"
        type: by_equality
      - path: $.nullvalue
        type: by_null
      - path: $.valueWithMin
        type: by_type
        minOccurrence: 1
      - path: $.valueWithMax
        type: by_type
        maxOccurrence: 3
      - path: $.valueWithMinMax
        type: by_type
        minOccurrence: 1
        maxOccurrence: 3
response:
  status: 200
  cookies:
    foo: 1
    bar: 2
  body:
    duck: 123
    alpha: "abc"
    number: 123
    aBoolean: true
    date: "2017-01-01"
    dateTime: "2017-01-01T01:23:45"
    time: "01:02:34"
    valueWithoutAMatcher: "foo"
    valueWithTypeMatch: "string"
    valueWithMin:
      - 1
      - 2
      - 3
    valueWithMax:
      - 1
      - 2
      - 3
    valueWithMinMax:
      - 1
      - 2
      - 3
    valueWithMinEmpty: []
    valueWithMaxEmpty: []
    key:
      'complex.key': 'foo'
    nulValue: null
  matchers:
    headers:
      - key: Content-Type
        regex: "application/json.*"
    cookies:
      - key: foo
        regex: '[0-9]'
      - key: bar
        command: 'equals($it)'
    body:
      - path: $.duck
        type: by_regex
        value: "[0-9]{3}"
      - path: $.duck
        type: by_equality
      - path: $.alpha
        type: by_regex
        predefined: only_alpha_unicode
      - path: $.alpha
        type: by_equality
      - path: $.number
        type: by_regex
        predefined: number
      - path: $.aBoolean
        type: by_regex
        predefined: any_boolean
      - path: $.date
        type: by_date
      - path: $.dateTime
        type: by_timestamp
      - path: $.time
        type: by_time
      - path: $.valueWithTypeMatch
        type: by_type
      - path: $.valueWithMin
        type: by_type
        minOccurrence: 1
      - path: $.valueWithMax
        type: by_type
        maxOccurrence: 3
      - path: $.valueWithMinMax
        type: by_type
        minOccurrence: 1
        maxOccurrence: 3
      - path: $.valueWithMinEmpty
        type: by_type
        minOccurrence: 0
      - path: $.valueWithMaxEmpty
        type: by_type
        maxOccurrence: 0
      - path: $.duck
        type: by_command
        value: assertThatValueIsANumber($it)
      - path: $.nullValue
        type: by_null
        value: null
  headers:
    Content-Type: application/json
```



在前面的示例中，您可以在`matchers`部分中查看合同的动态部分。对于请求部分，您可以看到，对于`valueWithoutAMatcher`以外的所有字段，存根都应包含的正则表达式的值已明确设置。对于`valueWithoutAMatcher`，验证的方式与不使用匹配器的方式相同。在这种情况下，测试将执行相等性检查。

对于`bodyMatchers`部分中的响应端，我们以类似的方式定义动态部分。唯一的区别是`byType`匹配器也存在。验证程序引擎检查四个字段，以验证来自测试的响应是否具有与JSON路径匹配给定字段的值，与响应主体中定义的类型相同的类型，并通过以下检查（基于方法被调用）：

- 对于`$.valueWithTypeMatch`，引擎检查类型是否相同。
- 对于`$.valueWithMin`，引擎检查类型并断言大小是否大于或等于最小出现次数。
- 对于`$.valueWithMax`，引擎检查类型并断言大小是否小于或等于最大出现次数。
- 对于`$.valueWithMinMax`，引擎检查类型并断言大小是否在最小和最大出现之间。

生成的测试类似于以下示例（请注意，`and`部分将自动生成的断言和匹配器的断言分开）：

```
// given:
 MockMvcRequestSpecification request = given()
   .header("Content-Type", "application/json")
   .body("{\"duck\":123,\"alpha\":\"abc\",\"number\":123,\"aBoolean\":true,\"date\":\"2017-01-01\",\"dateTime\":\"2017-01-01T01:23:45\",\"time\":\"01:02:34\",\"valueWithoutAMatcher\":\"foo\",\"valueWithTypeMatch\":\"string\",\"key\":{\"complex.key\":\"foo\"}}");

// when:
 ResponseOptions response = given().spec(request)
   .get("/get");

// then:
 assertThat(response.statusCode()).isEqualTo(200);
 assertThat(response.header("Content-Type")).matches("application/json.*");
// and:
 DocumentContext parsedJson = JsonPath.parse(response.getBody().asString());
 assertThatJson(parsedJson).field("['valueWithoutAMatcher']").isEqualTo("foo");
// and:
 assertThat(parsedJson.read("$.duck", String.class)).matches("[0-9]{3}");
 assertThat(parsedJson.read("$.duck", Integer.class)).isEqualTo(123);
 assertThat(parsedJson.read("$.alpha", String.class)).matches("[\\p{L}]*");
 assertThat(parsedJson.read("$.alpha", String.class)).isEqualTo("abc");
 assertThat(parsedJson.read("$.number", String.class)).matches("-?(\\d*\\.\\d+|\\d+)");
 assertThat(parsedJson.read("$.aBoolean", String.class)).matches("(true|false)");
 assertThat(parsedJson.read("$.date", String.class)).matches("(\\d\\d\\d\\d)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])");
 assertThat(parsedJson.read("$.dateTime", String.class)).matches("([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])");
 assertThat(parsedJson.read("$.time", String.class)).matches("(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])");
 assertThat((Object) parsedJson.read("$.valueWithTypeMatch")).isInstanceOf(java.lang.String.class);
 assertThat((Object) parsedJson.read("$.valueWithMin")).isInstanceOf(java.util.List.class);
 assertThat((java.lang.Iterable) parsedJson.read("$.valueWithMin", java.util.Collection.class)).as("$.valueWithMin").hasSizeGreaterThanOrEqualTo(1);
 assertThat((Object) parsedJson.read("$.valueWithMax")).isInstanceOf(java.util.List.class);
 assertThat((java.lang.Iterable) parsedJson.read("$.valueWithMax", java.util.Collection.class)).as("$.valueWithMax").hasSizeLessThanOrEqualTo(3);
 assertThat((Object) parsedJson.read("$.valueWithMinMax")).isInstanceOf(java.util.List.class);
 assertThat((java.lang.Iterable) parsedJson.read("$.valueWithMinMax", java.util.Collection.class)).as("$.valueWithMinMax").hasSizeBetween(1, 3);
 assertThat((Object) parsedJson.read("$.valueWithMinEmpty")).isInstanceOf(java.util.List.class);
 assertThat((java.lang.Iterable) parsedJson.read("$.valueWithMinEmpty", java.util.Collection.class)).as("$.valueWithMinEmpty").hasSizeGreaterThanOrEqualTo(0);
 assertThat((Object) parsedJson.read("$.valueWithMaxEmpty")).isInstanceOf(java.util.List.class);
 assertThat((java.lang.Iterable) parsedJson.read("$.valueWithMaxEmpty", java.util.Collection.class)).as("$.valueWithMaxEmpty").hasSizeLessThanOrEqualTo(0);
 assertThatValueIsANumber(parsedJson.read("$.duck"));
 assertThat(parsedJson.read("$.['key'].['complex.key']", String.class)).isEqualTo("foo");
```

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 请注意，对于`byCommand`方法，该示例调用`assertThatValueIsANumber`。此方法必须在测试基类中定义或静态导入到测试中。请注意，`byCommand`调用已转换为`assertThatValueIsANumber(parsedJson.read("$.duck"));`。这意味着引擎采用了方法名称，并将正确的JSON路径作为参数传递给它。 |      |

在下面的示例中，生成的WireMock存根为：

```
                    '''
{
  "request" : {
    "urlPath" : "/get",
    "method" : "POST",
    "headers" : {
      "Content-Type" : {
        "matches" : "application/json.*"
      }
    },
    "bodyPatterns" : [ {
      "matchesJsonPath" : "$.['list'].['some'].['nested'][?(@.['anothervalue'] == 4)]"
    }, {
      "matchesJsonPath" : "$[?(@.['valueWithoutAMatcher'] == 'foo')]"
    }, {
      "matchesJsonPath" : "$[?(@.['valueWithTypeMatch'] == 'string')]"
    }, {
      "matchesJsonPath" : "$.['list'].['someother'].['nested'][?(@.['json'] == 'with value')]"
    }, {
      "matchesJsonPath" : "$.['list'].['someother'].['nested'][?(@.['anothervalue'] == 4)]"
    }, {
      "matchesJsonPath" : "$[?(@.duck =~ /([0-9]{3})/)]"
    }, {
      "matchesJsonPath" : "$[?(@.duck == 123)]"
    }, {
      "matchesJsonPath" : "$[?(@.alpha =~ /([\\\\p{L}]*)/)]"
    }, {
      "matchesJsonPath" : "$[?(@.alpha == 'abc')]"
    }, {
      "matchesJsonPath" : "$[?(@.number =~ /(-?(\\\\d*\\\\.\\\\d+|\\\\d+))/)]"
    }, {
      "matchesJsonPath" : "$[?(@.aBoolean =~ /((true|false))/)]"
    }, {
      "matchesJsonPath" : "$[?(@.date =~ /((\\\\d\\\\d\\\\d\\\\d)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01]))/)]"
    }, {
      "matchesJsonPath" : "$[?(@.dateTime =~ /(([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9]))/)]"
    }, {
      "matchesJsonPath" : "$[?(@.time =~ /((2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9]))/)]"
    }, {
      "matchesJsonPath" : "$.list.some.nested[?(@.json =~ /(.*)/)]"
    }, {
      "matchesJsonPath" : "$[?(@.valueWithMin.size() >= 1)]"
    }, {
      "matchesJsonPath" : "$[?(@.valueWithMax.size() <= 3)]"
    }, {
      "matchesJsonPath" : "$[?(@.valueWithMinMax.size() >= 1 && @.valueWithMinMax.size() <= 3)]"
    }, {
      "matchesJsonPath" : "$[?(@.valueWithOccurrence.size() >= 4 && @.valueWithOccurrence.size() <= 4)]"
    } ]
  },
  "response" : {
    "status" : 200,
    "body" : "{\\"duck\\":123,\\"alpha\\":\\"abc\\",\\"number\\":123,\\"aBoolean\\":true,\\"date\\":\\"2017-01-01\\",\\"dateTime\\":\\"2017-01-01T01:23:45\\",\\"time\\":\\"01:02:34\\",\\"valueWithoutAMatcher\\":\\"foo\\",\\"valueWithTypeMatch\\":\\"string\\",\\"valueWithMin\\":[1,2,3],\\"valueWithMax\\":[1,2,3],\\"valueWithMinMax\\":[1,2,3],\\"valueWithOccurrence\\":[1,2,3,4]}",
    "headers" : {
      "Content-Type" : "application/json"
    },
    "transformers" : [ "response-template" ]
  }
}
'''
```

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 如果您使用`matcher`，则`matcher`用JSON路径寻址的请求和响应部分将从声明中删除。在验证集合的情况下，必须为集合的**所有**元素创建匹配器。 |      |

考虑以下示例：

```
Contract.make {
    request {
        method 'GET'
        url("/foo")
    }
    response {
        status OK()
        body(events: [[
                                 operation          : 'EXPORT',
                                 eventId            : '16f1ed75-0bcc-4f0d-a04d-3121798faf99',
                                 status             : 'OK'
                         ], [
                                 operation          : 'INPUT_PROCESSING',
                                 eventId            : '3bb4ac82-6652-462f-b6d1-75e424a0024a',
                                 status             : 'OK'
                         ]
                ]
        )
        bodyMatchers {
            jsonPath('$.events[0].operation', byRegex('.+'))
            jsonPath('$.events[0].eventId', byRegex('^([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})$'))
            jsonPath('$.events[0].status', byRegex('.+'))
        }
    }
}
```

前面的代码导致创建以下测试（代码块仅显示断言部分）：

```
and:
    DocumentContext parsedJson = JsonPath.parse(response.body.asString())
    assertThatJson(parsedJson).array("['events']").contains("['eventId']").isEqualTo("16f1ed75-0bcc-4f0d-a04d-3121798faf99")
    assertThatJson(parsedJson).array("['events']").contains("['operation']").isEqualTo("EXPORT")
    assertThatJson(parsedJson).array("['events']").contains("['operation']").isEqualTo("INPUT_PROCESSING")
    assertThatJson(parsedJson).array("['events']").contains("['eventId']").isEqualTo("3bb4ac82-6652-462f-b6d1-75e424a0024a")
    assertThatJson(parsedJson).array("['events']").contains("['status']").isEqualTo("OK")
and:
    assertThat(parsedJson.read("\$.events[0].operation", String.class)).matches(".+")
    assertThat(parsedJson.read("\$.events[0].eventId", String.class)).matches("^([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})\$")
    assertThat(parsedJson.read("\$.events[0].status", String.class)).matches(".+")
```

如您所见，断言的格式不正确。仅声明数组的第一个元素。为了解决此问题，您应该将断言应用于整个`$.events`集合，并使用`byCommand(…)`方法进行断言。

## 94.6 JAX-RS支持

Spring Cloud Contract验证程序支持JAX-RS 2客户端API。基类需要定义`protected WebTarget webTarget`和服务器初始化。测试JAX-RS API的唯一选项是启动web服务器。同样，带有主体的请求需要设置内容类型。否则，将使用默认值`application/octet-stream`。

为了使用JAX-RS模式，请使用以下设置：

```
testMode == 'JAXRSCLIENT'
```

以下示例显示了生成的测试API：

```
                    '''
 // when:
  Response response = webTarget
    .path("/users")
    .queryParam("limit", "10")
    .queryParam("offset", "20")
    .queryParam("filter", "email")
    .queryParam("sort", "name")
    .queryParam("search", "55")
    .queryParam("age", "99")
    .queryParam("name", "Denis.Stepanov")
    .queryParam("email", "bob@email.com")
    .request()
    .method("GET");

  String responseAsString = response.readEntity(String.class);

 // then:
  assertThat(response.getStatus()).isEqualTo(200);
 // and:
  DocumentContext parsedJson = JsonPath.parse(responseAsString);
  assertThatJson(parsedJson).field("['property1']").isEqualTo("a");
'''
```

## 94.7异步支持

如果您在服务器端使用异步通信（您的控制器返回`Callable`，`DeferredResult`，依此类推），那么在合同中，您必须在{10中提供一个`async()`方法/} 部分。以下代码显示了一个示例：

**Groovy DSL。** 

```
org.springframework.cloud.contract.spec.Contract.make {
    request {
        method GET()
        url '/get'
    }
    response {
        status OK()
        body 'Passed'
        async()
    }
}
```



**YAML。** 

```
response:
    async: true
```



您还可以使用`fixedDelayMilliseconds`方法/属性来向存根添加延迟。

**Groovy DSL。** 

```
org.springframework.cloud.contract.spec.Contract.make {
    request {
        method GET()
        url '/get'
    }
    response {
        status 200
        body 'Passed'
        fixedDelayMilliseconds 1000
    }
}
```



**YAML。** 

```
response:
    fixedDelayMilliseconds: 1000
```



## 94.8使用上下文路径

Spring Cloud Contract支持上下文路径。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 完全支持上下文路径所需的唯一更改是**PRODUCER**端的开关 。另外，自动生成的测试必须使用**EXPLICIT**模式。消费者方面保持不变。为了使生成的测试通过，您必须使用**EXPLICIT** 模式。 |      |

**Maven.** 

```
<plugin>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-contract-maven-plugin</artifactId>
    <version>${spring-cloud-contract.version}</version>
    <extensions>true</extensions>
    <configuration>
        <testMode>EXPLICIT</testMode>
    </configuration>
</plugin>
```



**Gradle.** 

```
contracts {
        testMode = 'EXPLICIT'
}
```



这样，您生成的测试**不**使用MockMvc。这意味着您要生成真实的请求，并且需要设置生成的测试的基类以在真实套接字上工作。

考虑以下合同：

```
org.springframework.cloud.contract.spec.Contract.make {
    request {
        method 'GET'
        url '/my-context-path/url'
    }
    response {
        status OK()
    }
}
```

下面的示例显示如何设置基类和“确保放心”：

```
import io.restassured.RestAssured;
import org.junit.Before;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = ContextPathTestingBaseClass.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ContextPathTestingBaseClass {

    @LocalServerPort int port;

    @Before
    public void setup() {
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = this.port;
    }
}
```

如果您这样做：

- 自动生成的测试中的所有请求都将发送到包含您的上下文路径的真实端点（例如`/my-context-path/url`）。
- 您的合同反映出您具有上下文路径。您生成的存根还具有该信息（例如，在存根中，您必须调用`/my-context-path/url`）。

## 94.9使用WebFlux

Spring Cloud Contract提供了两种使用WebFlux的方法。

### 94.9.1使用WebTestClient的WebFlux

其中之一是通过`WebTestClient`模式。

**Maven.** 

```
<plugin>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-contract-maven-plugin</artifactId>
    <version>${spring-cloud-contract.version}</version>
    <extensions>true</extensions>
    <configuration>
        <testMode>WEBTESTCLIENT</testMode>
    </configuration>
</plugin>
```



**Gradle.** 

```
contracts {
		testMode = 'WEBTESTCLIENT'
}
```



以下示例显示如何为WebFlux设置`WebTestClient`基类和`RestAssured`：

```
import io.restassured.module.webtestclient.RestAssuredWebTestClient;
import org.junit.Before;

public abstract class BeerRestBase {

	@Before
	public void setup() {
		RestAssuredWebTestClient.standaloneSetup(
		new ProducerController(personToCheck -> personToCheck.age >= 20));
	}
}
}
```

### 94.9.2具有显式模式的WebFlux

另一种方法是在生成的测试中使用`EXPLICIT`模式来使用WebFlux。

**Maven.** 

```
<plugin>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-contract-maven-plugin</artifactId>
    <version>${spring-cloud-contract.version}</version>
    <extensions>true</extensions>
    <configuration>
        <testMode>EXPLICIT</testMode>
    </configuration>
</plugin>
```



**Gradle.** 

```
contracts {
		testMode = 'EXPLICIT'
}
```



以下示例显示如何为Web通量设置基类和“确保休息”：

```
@RunWith(SpringRunner.class)
@SpringBootTest(classes = BeerRestBase.Config.class,
		webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
		properties = "server.port=0")
public abstract class BeerRestBase {

    // your tests go here

    // in this config class you define all controllers and mocked services
@Configuration
@EnableAutoConfiguration
static class Config {

	@Bean
	PersonCheckingService personCheckingService()  {
		return personToCheck -> personToCheck.age >= 20;
	}

	@Bean
	ProducerController producerController() {
		return new ProducerController(personCheckingService());
	}
}

}
```

## 94.10对REST的XML支持

对于REST合同，我们还支持XML请求和响应主体。XML主体必须作为`String`或`GString`在`body`元素内传递。还可以为请求和响应提供身体匹配器。代替`jsonPath(…)`方法，应使用`org.springframework.cloud.contract.spec.internal.BodyMatchers.xPath`方法，并以所需的`xPath`作为第一个参数，并以适当的`MatchingType`作为第二个参数。支持`byType()`以外的所有主体匹配器。

这是带有XML响应主体的Groovy DSL合同的示例：

```
                    Contract.make {
                        request {
                            method GET()
                            urlPath '/get'
                            headers {
                                contentType(applicationXml())
                            }
                        }
                        response {
                            status(OK())
                            headers {
                                contentType(applicationXml())
                            }
                            body """
<test>
<duck type='xtype'>123</duck>
<alpha>abc</alpha>
<list>
<elem>abc</elem>
<elem>def</elem>
<elem>ghi</elem>
</list>
<number>123</number>
<aBoolean>true</aBoolean>
<date>2017-01-01</date>
<dateTime>2017-01-01T01:23:45</dateTime>
<time>01:02:34</time>
<valueWithoutAMatcher>foo</valueWithoutAMatcher>
<key><complex>foo</complex></key>
</test>"""
                            bodyMatchers {
                                xPath('/test/duck/text()', byRegex("[0-9]{3}"))
                                xPath('/test/duck/text()', byCommand('test($it)'))
                                xPath('/test/duck/xxx', byNull())
                                xPath('/test/duck/text()', byEquality())
                                xPath('/test/alpha/text()', byRegex(onlyAlphaUnicode()))
                                xPath('/test/alpha/text()', byEquality())
                                xPath('/test/number/text()', byRegex(number()))
                                xPath('/test/date/text()', byDate())
                                xPath('/test/dateTime/text()', byTimestamp())
                                xPath('/test/time/text()', byTime())
                                xPath('/test/*/complex/text()', byEquality())
                                xPath('/test/duck/@type', byEquality())
                            }
                        }
                    }
```

以下是带有XML请求和响应主体的YAML合同的示例：

```
include::{verifier_core_path}/src/test/resources/yml/contract_rest_xml.yml
```

这是自动生成的XML响应正文测试的示例：

```
@Test
public void validate_xmlMatches() throws Exception {
	// given:
	MockMvcRequestSpecification request = given()
				.header("Content-Type", "application/xml");

	// when:
	ResponseOptions response = given().spec(request).get("/get");

	// then:
	assertThat(response.statusCode()).isEqualTo(200);
	// and:
	DocumentBuilder documentBuilder = DocumentBuilderFactory.newInstance()
					.newDocumentBuilder();
	Document parsedXml = documentBuilder.parse(new InputSource(
				new StringReader(response.getBody().asString())));
	// and:
	assertThat(valueFromXPath(parsedXml, "/test/list/elem/text()")).isEqualTo("abc");
	assertThat(valueFromXPath(parsedXml,"/test/list/elem[2]/text()")).isEqualTo("def");
	assertThat(valueFromXPath(parsedXml, "/test/duck/text()")).matches("[0-9]{3}");
	assertThat(nodeFromXPath(parsedXml, "/test/duck/xxx")).isNull();
	assertThat(valueFromXPath(parsedXml, "/test/alpha/text()")).matches("[\\p{L}]*");
	assertThat(valueFromXPath(parsedXml, "/test/*/complex/text()")).isEqualTo("foo");
	assertThat(valueFromXPath(parsedXml, "/test/duck/@type")).isEqualTo("xtype");
	}
```

## 94.11消息传递顶级元素

用于消息传递的DSL与专注于HTTP的DSL看起来有些不同。以下各节说明了差异：

- [第94.11.1节“由方法触发的输出”](https://www.springcloud.cc/spring-cloud-greenwich.html#contract-dsl-output-triggered-method)
- [第94.11.2节“消息触发的输出”](https://www.springcloud.cc/spring-cloud-greenwich.html#contract-dsl-output-triggered-message)
- [第94.11.3节“消费者/生产者”](https://www.springcloud.cc/spring-cloud-greenwich.html#contract-dsl-consumer-producer)
- [第94.11.4节“公用”](https://www.springcloud.cc/spring-cloud-greenwich.html#contract-dsl-common)

### 94.11.1方法触发的输出

可以通过调用方法（例如启动a并发送消息时调用`Scheduler`）来触发输出消息，如以下示例所示：

**Groovy DSL。** 

```
def dsl = Contract.make {
    // Human readable description
    description 'Some description'
    // Label by means of which the output message can be triggered
    label 'some_label'
    // input to the contract
    input {
        // the contract will be triggered by a method
        triggeredBy('bookReturnedTriggered()')
    }
    // output message of the contract
    outputMessage {
        // destination to which the output message will be sent
        sentTo('output')
        // the body of the output message
        body('''{ "bookName" : "foo" }''')
        // the headers of the output message
        headers {
            header('BOOK-NAME', 'foo')
        }
    }
}
```



**YAML。** 

```
# Human readable description
description: Some description
# Label by means of which the output message can be triggered
label: some_label
input:
  # the contract will be triggered by a method
  triggeredBy: bookReturnedTriggered()
# output message of the contract
outputMessage:
  # destination to which the output message will be sent
  sentTo: output
  # the body of the output message
  body:
    bookName: foo
  # the headers of the output message
  headers:
    BOOK-NAME: foo
```



在前面的示例情况下，如果执行了称为`bookReturnedTriggered`的方法，则输出消息将发送到`output`。在消息**发布者**方面，我们生成了一个测试，该测试调用该方法来触发消息。在**使用者**方面，您可以使用`some_label`来触发消息。

### 94.11.2由消息触发的输出

可以通过接收消息来触发输出消息，如以下示例所示：

**Groovy DSL。** 

```
def dsl = Contract.make {
    description 'Some Description'
    label 'some_label'
    // input is a message
    input {
        // the message was received from this destination
        messageFrom('input')
        // has the following body
        messageBody([
                bookName: 'foo'
        ])
        // and the following headers
        messageHeaders {
            header('sample', 'header')
        }
    }
    outputMessage {
        sentTo('output')
        body([
                bookName: 'foo'
        ])
        headers {
            header('BOOK-NAME', 'foo')
        }
    }
}
```



**YAML。** 

```
# Human readable description
description: Some description
# Label by means of which the output message can be triggered
label: some_label
# input is a message
input:
  messageFrom: input
  # has the following body
  messageBody:
    bookName: 'foo'
  # and the following headers
  messageHeaders:
    sample: 'header'
# output message of the contract
outputMessage:
  # destination to which the output message will be sent
  sentTo: output
  # the body of the output message
  body:
    bookName: foo
  # the headers of the output message
  headers:
    BOOK-NAME: foo
```



在前面的示例中，如果在`input`目标上收到了适当的消息，则将输出消息发送到`output`。在消息**发布者**侧，引擎生成一个测试，将该输入消息发送到定义的目的地。在 **使用者**方面，您可以将消息发送到输入目标，也可以使用标签（示例中为`some_label`）来触发消息。

### 94.11.3消费者/生产者

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 本部分仅对Groovy DSL有效。                                   |      |

在HTTP中，您使用的符号是`client` / `stub and`server`/`test`。您也可以在消息传递中使用这些范例。此外，Spring Cloud Contract验证程序还提供了`consumer`和`producer`方法，如以下示例所示（请注意，您可以使用`$`或`value`方法来提供`consumer`和`producer`部分）：

```
					Contract.make {
						label 'some_label'
						input {
							messageFrom value(consumer('jms:output'), producer('jms:input'))
							messageBody([
									bookName: 'foo'
							])
							messageHeaders {
								header('sample', 'header')
							}
						}
						outputMessage {
							sentTo $(consumer('jms:input'), producer('jms:output'))
							body([
									bookName: 'foo'
							])
						}
					}
```

### 94.11.4共同的

在`input`或`outputMessage`部分中，可以使用在基类或静态导入中定义的`method`（例如`assertThatMessageIsOnTheQueue()`）的名称调用`assertThat`。Spring Cloud Contract将在生成的测试中执行该方法。

## 94.12在一个文件中多个Contracts

您可以在一个文件中定义多个合同。这样的合同可能类似于以下示例：

**Groovy DSL。** 

```
import org.springframework.cloud.contract.spec.Contract

[
	Contract.make {
		name("should post a user")
		request {
			method 'POST'
			url('/users/1')
		}
		response {
			status OK()
		}
	},
	Contract.make {
		request {
			method 'POST'
			url('/users/2')
		}
		response {
			status OK()
		}
	}
]
```



**YAML。** 

```
---
name: should post a user
request:
  method: POST
  url: /users/1
response:
  status: 200
---
request:
  method: POST
  url: /users/2
response:
  status: 200
---
request:
  method: POST
  url: /users/3
response:
  status: 200
```



在前面的示例中，一个合同具有`name`字段，而另一个则没有。这导致生成两个看起来或多或少像这样的测试：

```
package org.springframework.cloud.contract.verifier.tests.com.hello;

import com.example.TestBase;
import com.jayway.jsonpath.DocumentContext;
import com.jayway.jsonpath.JsonPath;
import com.jayway.restassured.module.mockmvc.specification.MockMvcRequestSpecification;
import com.jayway.restassured.response.ResponseOptions;
import org.junit.Test;

import static com.jayway.restassured.module.mockmvc.RestAssuredMockMvc.*;
import static com.toomuchcoding.jsonassert.JsonAssertion.assertThatJson;
import static org.assertj.core.api.Assertions.assertThat;

public class V1Test extends TestBase {

    @Test
    public void validate_should_post_a_user() throws Exception {
        // given:
            MockMvcRequestSpecification request = given();

        // when:
            ResponseOptions response = given().spec(request)
                    .post("/users/1");

        // then:
            assertThat(response.statusCode()).isEqualTo(200);
    }

    @Test
    public void validate_withList_1() throws Exception {
        // given:
            MockMvcRequestSpecification request = given();

        // when:
            ResponseOptions response = given().spec(request)
                    .post("/users/2");

        // then:
            assertThat(response.statusCode()).isEqualTo(200);
    }

}
```

请注意，对于具有`name`字段的合同，生成的测试方法名为`validate_should_post_a_user`。对于一个没有名称的名称，它称为`validate_withList_1`。它对应于文件`WithList.groovy`的名称以及列表中合同的索引。

下例显示了生成的存根：

```
should post a user.json
1_WithList.json
```

如您所见，第一个文件从合同中获取了`name`参数。第二个名称带有合同文件名称（`WithList.groovy`），并带有索引前缀（在这种情况下，合同在文件中合同列表中的索引为`1`）。

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 如您所见，命名合同会更好，因为这样做会使您的测试更有意义。   |

## 94.13从合同中生成Spring REST文档片段

当您想使用Spring REST Docs包含API的请求和响应时，如果使用MockMvc和RestAssuredMockMvc，则只需对设置进行一些细微更改。如果还没有，只需包括以下依赖项。

**Maven.** 

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-contract-verifier</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.springframework.restdocs</groupId>
    <artifactId>spring-restdocs-mockmvc</artifactId>
    <optional>true</optional>
</dependency>
```



**Gradle.** 

```
testCompile 'org.springframework.cloud:spring-cloud-starter-contract-verifier'
testCompile 'org.springframework.restdocs:spring-restdocs-mockmvc'
```



接下来，您需要对基类进行一些更改，例如以下示例。

```
package com.example.fraud;

import io.restassured.module.mockmvc.RestAssuredMockMvc;
import org.junit.Before;
import org.junit.Rule;
import org.junit.rules.TestName;
import org.junit.runner.RunWith;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.restdocs.JUnitRestDocumentation;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.documentationConfiguration;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = Application.class)
public abstract class FraudBaseWithWebAppSetup {

    private static final String OUTPUT = "target/generated-snippets";

    @Rule
    public JUnitRestDocumentation restDocumentation = new JUnitRestDocumentation(OUTPUT);

    @Rule
    public TestName testName = new TestName();

    @Autowired
    private WebApplicationContext context;

    @Before
    public void setup() {
        RestAssuredMockMvc.mockMvc(MockMvcBuilders.webAppContextSetup(this.context)
                .apply(documentationConfiguration(this.restDocumentation))
                .alwaysDo(document(
                        getClass().getSimpleName() + "_" + testName.getMethodName()))
                .build());
    }

    protected void assertThatRejectionReasonIsNull(Object rejectionReason) {
        assert rejectionReason == null;
    }

}
```

如果您使用独立安装程序，则可以这样设置RestAssuredMockMvc：

```
package com.example.fraud;

import io.restassured.module.mockmvc.RestAssuredMockMvc;
import org.junit.Before;
import org.junit.Rule;
import org.junit.rules.TestName;

import org.springframework.restdocs.JUnitRestDocumentation;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.documentationConfiguration;

public abstract class FraudBaseWithStandaloneSetup {

	private static final String OUTPUT = "target/generated-snippets";

	@Rule
	public JUnitRestDocumentation restDocumentation = new JUnitRestDocumentation(OUTPUT);

	@Rule
	public TestName testName = new TestName();

	@Before
	public void setup() {
		RestAssuredMockMvc.standaloneSetup(MockMvcBuilders
				.standaloneSetup(new FraudDetectionController())
				.apply(documentationConfiguration(this.restDocumentation))
				.alwaysDo(document(
						getClass().getSimpleName() + "_" + testName.getMethodName())));
	}

}
```

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 从Spring REST Docs的1.2.0.RELEASE版本开始，您无需为生成的代码片段指定输出目录。 |

## 95.定制化

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 本部分仅对Groovy DSL有效                                     |      |

您可以通过扩展DSL来定制Spring Cloud Contract验证程序，如本节其余部分所示。

## 95.1扩展DSL

您可以为DSL提供自己的功能。此功能的关键要求是保持静态兼容性。在本文档的后面，您可以看到以下示例：

- 使用可重用的类创建一个JAR。
- 在DSL中引用这些类。

您可以在[此处](https://github.com/spring-cloud-samples/spring-cloud-contract-samples)找到完整的示例 。

### 95.1.1通用JAR

以下示例显示了可以在DSL中重用的三个类。

**PatternUtils**包含**消费者**和**生产者**都使用的函数。

```
package com.example;

import java.util.regex.Pattern;

/**
 * If you want to use {@link Pattern} directly in your tests
 * then you can create a class resembling this one. It can
 * contain all the {@link Pattern} you want to use in the DSL.
 *
 * <pre>
 * {@code
 * request {
 *     body(
 *         [ age: $(c(PatternUtils.oldEnough()))]
 *     )
 * }
 * </pre>
 *
 * Notice that we're using both {@code $()} for dynamic values
 * and {@code c()} for the consumer side.
 *
 * @author Marcin Grzejszczak
 */
//tag::impl[]
public class PatternUtils {

	public static String tooYoung() {
		//remove::start[]
		return "[0-1][0-9]";
		//remove::end[return]
	}

	public static Pattern oldEnough() {
		//remove::start[]
		return Pattern.compile("[2-9][0-9]");
		//remove::end[return]
	}

	/**
	 * Makes little sense but it's just an example ;)
	 */
	public static Pattern ok() {
		//remove::start[]
		return Pattern.compile("OK");
		//remove::end[return]
	}
}
//end::impl[]
```

**ConsumerUtils**包含由使用功能的**消费者**。

```
package com.example;

import org.springframework.cloud.contract.spec.internal.ClientDslProperty;

/**
 * DSL Properties passed to the DSL from the consumer's perspective.
 * That means that on the input side {@code Request} for HTTP
 * or {@code Input} for messaging you can have a regular expression.
 * On the {@code Response} for HTTP or {@code Output} for messaging
 * you have to have a concrete value.
 *
 * @author Marcin Grzejszczak
 */
//tag::impl[]
public class ConsumerUtils {
    /**
     * Consumer side property. By using the {@link ClientDslProperty}
     * you can omit most of boilerplate code from the perspective
     * of dynamic values. Example
     *
     * <pre>
     * {@code
     * request {
     *     body(
     *         [ age: $(ConsumerUtils.oldEnough())]
     *     )
     * }
     * </pre>
     *
     * That way it's in the implementation that we decide what value we will pass to the consumer
     * and which one to the producer.
     *
     * @author Marcin Grzejszczak
     */
    public static ClientDslProperty oldEnough() {
        //remove::start[]
        // this example is not the best one and
        // theoretically you could just pass the regex instead of `ServerDslProperty` but
        // it's just to show some new tricks :)
        return new ClientDslProperty(PatternUtils.oldEnough(), 40);
        //remove::end[return]
    }

}
//end::impl[]
```

**ProducerUtils**包含由使用的功能**制片人**。

```
package com.example;

import org.springframework.cloud.contract.spec.internal.ServerDslProperty;

/**
 * DSL Properties passed to the DSL from the producer's perspective.
 * That means that on the input side {@code Request} for HTTP
 * or {@code Input} for messaging you have to have a concrete value.
 * On the {@code Response} for HTTP or {@code Output} for messaging
 * you can have a regular expression.
 *
 * @author Marcin Grzejszczak
 */
//tag::impl[]
public class ProducerUtils {

    /**
     * Producer side property. By using the {@link ProducerUtils}
     * you can omit most of boilerplate code from the perspective
     * of dynamic values. Example
     *
     * <pre>
     * {@code
     * response {
     *     body(
     *         [ status: $(ProducerUtils.ok())]
     *     )
     * }
     * </pre>
     *
     * That way it's in the implementation that we decide what value we will pass to the consumer
     * and which one to the producer.
     */
    public static ServerDslProperty ok() {
        // this example is not the best one and
        // theoretically you could just pass the regex instead of `ServerDslProperty` but
        // it's just to show some new tricks :)
        return new ServerDslProperty( PatternUtils.ok(), "OK");
    }
}
//end::impl[]
```

### 95.1.2在项目中添加依赖项

为了使插件和IDE能够引用常见的JAR类，您需要将依赖项传递给您的项目。

### 95.1.3在项目的依存关系中测试依存关系

首先，添加通用jar依赖项作为测试依赖项。因为您的合同文件在测试资源路径上可用，所以常见的jar类在您的Groovy文件中自动变为可见。以下示例显示如何测试依赖关系：

**Maven.** 

```
<dependency>
    <groupId>com.example</groupId>
    <artifactId>beer-common</artifactId>
    <version>${project.version}</version>
    <scope>test</scope>
</dependency>
```



**Gradle.** 

```
testCompile("com.example:beer-common:0.0.1.BUILD-SNAPSHOT")
```



### 95.1.4在插件的依赖关系中测试依赖关系

现在，您必须添加插件的依赖关系，以便在运行时重用，如以下示例所示：

**Maven.** 

```
<plugin>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-contract-maven-plugin</artifactId>
    <version>${spring-cloud-contract.version}</version>
    <extensions>true</extensions>
    <configuration>
        <packageWithBaseClasses>com.example</packageWithBaseClasses>
        <baseClassMappings>
            <baseClassMapping>
                <contractPackageRegex>.*intoxication.*</contractPackageRegex>
                <baseClassFQN>com.example.intoxication.BeerIntoxicationBase</baseClassFQN>
            </baseClassMapping>
        </baseClassMappings>
    </configuration>
    <dependencies>
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>beer-common</artifactId>
            <version>${project.version}</version>
            <scope>compile</scope>
        </dependency>
    </dependencies>
</plugin>
```



**Gradle.** 

```
classpath "com.example:beer-common:0.0.1.BUILD-SNAPSHOT"
```



### 95.1.5 DSL中的引用类

现在，您可以在DSL中引用您的类，如以下示例所示：

```
package contracts.beer.rest

import com.example.ConsumerUtils
import com.example.ProducerUtils
import org.springframework.cloud.contract.spec.Contract

Contract.make {
    description("""
Represents a successful scenario of getting a beer

​```
given:
    client is old enough
when:
    he applies for a beer
then:
    we'll grant him the beer
​```

""")
    request {
        method 'POST'
        url '/check'
        body(
                age: $(ConsumerUtils.oldEnough())
        )
        headers {
            contentType(applicationJson())
        }
    }
    response {
        status 200
        body("""
            {
                "status": "${value(ProducerUtils.ok())}"
            }
            """)
        headers {
            contentType(applicationJson())
        }
    }
}
```

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 您可以通过将`convertToYaml`设置为`true`来设置Spring Cloud Contract插件。这样，您将不必将具有扩展功能的依赖项添加到使用者方，因为使用者方将使用YAML合同而不是Groovy合同。 |      |

## 96.使用可插拔架构

您可能会遇到以其他格式（例如YAML，RAML或PACT）定义合同的情况。在那些情况下，您仍然想从自动生成测试和存根中受益。您可以添加自己的实现以生成测试和存根。另外，您可以自定义测试的生成方式（例如，可以生成其他语言的测试）和存根的生成方式（例如，可以为其他HTTP服务器实现生成存根）。

## 96.1定制合同转换器

`ContractConverter`接口使您可以注册自己的合同结构转换器的实现。以下代码清单显示了`ContractConverter`接口：

```
package org.springframework.cloud.contract.spec

/**
 * Converter to be used to convert FROM {@link File} TO {@link Contract}
 * and from {@link Contract} to {@code T}
 *
 * @param <T >     - type to which we want to convert the contract
 *
 * @author Marcin Grzejszczak
 * @since 1.1.0
 */
interface ContractConverter<T> extends ContractStorer<T> {

	/**
	 * Should this file be accepted by the converter. Can use the file extension
	 * to check if the conversion is possible.
	 *
	 * @param file - file to be considered for conversion
	 * @return - {@code true} if the given implementation can convert the file
	 */
	boolean isAccepted(File file)

	/**
	 * Converts the given {@link File} to its {@link Contract} representation
	 *
	 * @param file - file to convert
	 * @return - {@link Contract} representation of the file
	 */
	Collection<Contract> convertFrom(File file)

	/**
	 * Converts the given {@link Contract} to a {@link T} representation
	 *
	 * @param contract - the parsed contract
	 * @return - {@link T} the type to which we do the conversion
	 */
	T convertTo(Collection<Contract> contract)
}
```

您的实现必须定义启动转换的条件。另外，您必须定义如何在两个方向上执行该转换。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 创建实施后，必须创建一个`/META-INF/spring.factories`文件，在其中提供实施的完全限定名称。 |      |

以下示例显示了典型的`spring.factories`文件：

```
org.springframework.cloud.contract.spec.ContractConverter=\
org.springframework.cloud.contract.verifier.converter.YamlContractConverter
```

### 96.1.1 Pact转换器

Spring Cloud Contract包括对直到第4版的[契约的契约](https://docs.pact.io/)表示的支持。您可以使用Pact文件来代替使用Groovy DSL。在本节中，我们介绍如何为您的项目添加Pact支持。但是请注意，并非所有功能都受支持。从v3开始，您可以为同一个元素组合多个匹配器。您可以将匹配器用于正文，标头，请求和路径；您可以使用价值生成器。Spring Cloud Contract当前仅支持使用AND规则逻辑组合的多个匹配器。除此之外，在转换过程中将跳过请求和路径匹配器。当使用具有给定格式的日期，时间或日期时间值生成器时，将跳过给定格式并使用ISO格式。

为了正确支持使用Pact进行消息传递的Spring Cloud Contract方法，您必须提供一些其他元数据条目。您可以在下面找到此类条目的列表：

- 要定义消息发送到的目的地，必须在Pact文件中设置一个`metaData`项，键`sentTo`等于消息发送到的目的地。例如`"metaData": { "sentTo": "activemq:output" }`

### 96.1.2契约合同

考虑以下契约合同的示例，该契约是`src/test/resources/contracts`文件夹下的文件。

```
{
  "provider": {
    "name": "Provider"
  },
  "consumer": {
    "name": "Consumer"
  },
  "interactions": [
    {
      "description": "",
      "request": {
        "method": "PUT",
        "path": "/fraudcheck",
        "headers": {
          "Content-Type": "application/vnd.fraud.v1+json"
        },
        "body": {
          "clientId": "1234567890",
          "loanAmount": 99999
        },
        "generators": {
          "body": {
            "$.clientId": {
              "type": "Regex",
              "regex": "[0-9]{10}"
            }
          }
        },
        "matchingRules": {
          "header": {
            "Content-Type": {
              "matchers": [
                {
                  "match": "regex",
                  "regex": "application/vnd\\.fraud\\.v1\\+json.*"
                }
              ],
              "combine": "AND"
            }
          },
          "body": {
            "$.clientId": {
              "matchers": [
                {
                  "match": "regex",
                  "regex": "[0-9]{10}"
                }
              ],
              "combine": "AND"
            }
          }
        }
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/vnd.fraud.v1+json;charset=UTF-8"
        },
        "body": {
          "fraudCheckStatus": "FRAUD",
          "rejectionReason": "Amount too high"
        },
        "matchingRules": {
          "header": {
            "Content-Type": {
              "matchers": [
                {
                  "match": "regex",
                  "regex": "application/vnd\\.fraud\\.v1\\+json.*"
                }
              ],
              "combine": "AND"
            }
          },
          "body": {
            "$.fraudCheckStatus": {
              "matchers": [
                {
                  "match": "regex",
                  "regex": "FRAUD"
                }
              ],
              "combine": "AND"
            }
          }
        }
      }
    }
  ],
  "metadata": {
    "pact-specification": {
      "version": "3.0.0"
    },
    "pact-jvm": {
      "version": "3.5.13"
    }
  }
}
```

本部分有关使用Pact的其余部分参考前面的文件。

### 96.1.3生产者公约

在生产者端，您必须在插件配置中添加两个其他依赖项。一个是Spring Cloud Contract Pact支持，另一个是您使用的当前Pact版本。

**Maven.** 

```
<plugin>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-contract-maven-plugin</artifactId>
    <version>${spring-cloud-contract.version}</version>
    <extensions>true</extensions>
    <configuration>
        <packageWithBaseClasses>com.example.fraud</packageWithBaseClasses>
    </configuration>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-contract-pact</artifactId>
            <version>${spring-cloud-contract.version}</version>
        </dependency>
    </dependencies>
</plugin>
```



**Gradle.** 

```
classpath "org.springframework.cloud:spring-cloud-contract-pact:${findProperty('verifierVersion') ?: verifierVersion}"
```



当您执行应用程序的构建时，将生成一个测试。生成的测试可能如下：

```
@Test
public void validate_shouldMarkClientAsFraud() throws Exception {
    // given:
        MockMvcRequestSpecification request = given()
                .header("Content-Type", "application/vnd.fraud.v1+json")
                .body("{\"clientId\":\"1234567890\",\"loanAmount\":99999}");

    // when:
        ResponseOptions response = given().spec(request)
                .put("/fraudcheck");

    // then:
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.header("Content-Type")).matches("application/vnd\\.fraud\\.v1\\+json.*");
    // and:
        DocumentContext parsedJson = JsonPath.parse(response.getBody().asString());
        assertThatJson(parsedJson).field("['rejectionReason']").isEqualTo("Amount too high");
    // and:
        assertThat(parsedJson.read("$.fraudCheckStatus", String.class)).matches("FRAUD");
}
```

相应的生成的存根可能如下：

```
{
  "id" : "996ae5ae-6834-4db6-8fac-358ca187ab62",
  "uuid" : "996ae5ae-6834-4db6-8fac-358ca187ab62",
  "request" : {
    "url" : "/fraudcheck",
    "method" : "PUT",
    "headers" : {
      "Content-Type" : {
        "matches" : "application/vnd\\.fraud\\.v1\\+json.*"
      }
    },
    "bodyPatterns" : [ {
      "matchesJsonPath" : "$[?(@.['loanAmount'] == 99999)]"
    }, {
      "matchesJsonPath" : "$[?(@.clientId =~ /([0-9]{10})/)]"
    } ]
  },
  "response" : {
    "status" : 200,
    "body" : "{\"fraudCheckStatus\":\"FRAUD\",\"rejectionReason\":\"Amount too high\"}",
    "headers" : {
      "Content-Type" : "application/vnd.fraud.v1+json;charset=UTF-8"
    },
    "transformers" : [ "response-template" ]
  },
}
```

### 96.1.4消费者契约

在使用者方面，必须将两个其他依赖项添加到项目依赖项中。一个是Spring Cloud Contract Pact支持，另一个是您使用的当前Pact版本。

**Maven.** 

```
<dependency>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-contract-pact</artifactId>
	<scope>test</scope>
</dependency>
```



**Gradle.** 

```
testCompile "org.springframework.cloud:spring-cloud-contract-pact"
```



## 96.2使用自定义测试生成器

如果要针对Java以外的语言生成测试，或者对验证程序构建Java测试的方式不满意，则可以注册自己的实现。

`SingleTestGenerator`接口使您可以注册自己的实现。以下代码清单显示了`SingleTestGenerator`界面：

```
package org.springframework.cloud.contract.verifier.builder


import org.springframework.cloud.contract.verifier.config.ContractVerifierConfigProperties
import org.springframework.cloud.contract.verifier.file.ContractMetadata

/**
 * Builds a single test.
 *
 * @since 1.1.0
 */
trait SingleTestGenerator {

	/**
	 * Creates contents of a single test class in which all test scenarios from
	 * the contract metadata should be placed.
	 *
	 * @param properties - properties passed to the plugin
	 * @param listOfFiles - list of parsed contracts with additional metadata
	 * @param className - the name of the generated test class
	 * @param classPackage - the name of the package in which the test class should be stored
	 * @param includedDirectoryRelativePath - relative path to the included directory
	 * @return contents of a single test class
	 * @deprecated use{@link SingleTestGenerator#buildClass(ContractVerifierConfigProperties, Collection, String, GeneratedClassData)}
	 */
	@Deprecated
	abstract String buildClass(ContractVerifierConfigProperties properties,
			Collection<ContractMetadata> listOfFiles, String className, String classPackage, String includedDirectoryRelativePath)

	/**
	 * Creates contents of a single test class in which all test scenarios from
	 * the contract metadata should be placed.
	 *
	 * @param properties - properties passed to the plugin
	 * @param listOfFiles - list of parsed contracts with additional metadata
	 * @param generatedClassData - information about the generated class
	 * @param includedDirectoryRelativePath - relative path to the included directory
	 * @return contents of a single test class
	 */
	String buildClass(ContractVerifierConfigProperties properties,
			Collection<ContractMetadata> listOfFiles, String includedDirectoryRelativePath, GeneratedClassData generatedClassData) {
		String className = generatedClassData.className
		String classPackage = generatedClassData.classPackage
		String path = includedDirectoryRelativePath
		return buildClass(properties, listOfFiles, className, classPackage, path)
	}

	/**
	 * Extension that should be appended to the generated test class. E.g. {@code .java} or {@code .php}
	 *
	 * @param properties - properties passed to the plugin
	 */
	abstract String fileExtension(ContractVerifierConfigProperties properties)

	static class GeneratedClassData {
		public final String className
		public final String classPackage
		public final java.nio.file.Path testClassPath

		GeneratedClassData(String className, String classPackage,
				java.nio.file.Path testClassPath) {
			this.className = className
			this.classPackage = classPackage
			this.testClassPath = testClassPath
		}
	}
}
```

同样，您必须提供一个`spring.factories`文件，例如以下示例中所示的文件：

```
org.springframework.cloud.contract.verifier.builder.SingleTestGenerator=/
com.example.MyGenerator
```

## 96.3使用自定义存根生成器

如果要为WireMock以外的存根服务器生成存根，则可以插入自己的`StubGenerator`接口实现。以下代码清单显示了`StubGenerator`接口：

```
package org.springframework.cloud.contract.verifier.converter

import groovy.transform.CompileStatic

import org.springframework.cloud.contract.spec.Contract
import org.springframework.cloud.contract.verifier.file.ContractMetadata

/**
 * Converts contracts into their stub representation.
 *
 * @since 1.1.0
 */
@CompileStatic
interface StubGenerator {

    /**
     * @return {@code true} if the converter can handle the file to convert it into a stub.
     */
    boolean canHandleFileName(String fileName)

    /**
     * @return the collection of converted contracts into stubs. One contract can
     * result in multiple stubs.
     */
    Map<Contract, String> convertContents(String rootName, ContractMetadata content)

    /**
     * @return the name of the converted stub file. If you have multiple contracts
     * in a single file then a prefix will be added to the generated file. If you
     * provide the {@link Contract#name} field then that field will override the
     * generated file name.
     *
     * Example: name of file with 2 contracts is {@code foo.groovy}, it will be
     * converted by the implementation to {@code foo.json}. The recursive file
     * converter will create two files {@code 0_foo.json} and {@code 1_foo.json}
     */
    String generateOutputFileNameForInput(String inputFileName)
}
```

同样，您必须提供一个`spring.factories`文件，例如以下示例中所示的文件：

```
# Stub converters
org.springframework.cloud.contract.verifier.converter.StubGenerator=\
org.springframework.cloud.contract.verifier.wiremock.DslToWireMockClientConverter
```

默认实现是WireMock存根生成。

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 您可以提供多个存根生成器实现。例如，从单个DSL，您可以同时生成WireMock存根和Pact文件。 |

## 96.4使用自定义Stub Runner

如果决定使用自定义存根生成，则还需要使用自定义方式与其他存根提供程序一起运行存根。

假设您使用[Moco](https://github.com/dreamhead/moco)来构建存根，并且已经编写了存根生成器并将存根放置在JAR文件中。

为了使Stub Runner知道如何运行存根，您必须定义一个自定义HTTP Stub服务器实现，该实现可能类似于以下示例：

```
package org.springframework.cloud.contract.stubrunner.provider.moco

import com.github.dreamhead.moco.bootstrap.arg.HttpArgs
import com.github.dreamhead.moco.runner.JsonRunner
import com.github.dreamhead.moco.runner.RunnerSetting
import groovy.util.logging.Commons

import org.springframework.cloud.contract.stubrunner.HttpServerStub
import org.springframework.util.SocketUtils

@Commons
class MocoHttpServerStub implements HttpServerStub {

    private boolean started
    private JsonRunner runner
    private int port

    @Override
    int port() {
        if (!isRunning()) {
            return -1
        }
        return port
    }

    @Override
    boolean isRunning() {
        return started
    }

    @Override
    HttpServerStub start() {
        return start(SocketUtils.findAvailableTcpPort())
    }

    @Override
    HttpServerStub start(int port) {
        this.port = port
        return this
    }

    @Override
    HttpServerStub stop() {
        if (!isRunning()) {
            return this
        }
        this.runner.stop()
        return this
    }

    @Override
    HttpServerStub registerMappings(Collection<File> stubFiles) {
        List<RunnerSetting> settings = stubFiles.findAll { it.name.endsWith("json") }
            .collect {
            log.info("Trying to parse [${it.name}]")
            try {
                return RunnerSetting.aRunnerSetting().withStream(it.newInputStream()).
                    build()
            }
            catch (Exception e) {
                log.warn("Exception occurred while trying to parse file [${it.name}]", e)
                return null
            }
        }.findAll { it }
        this.runner = JsonRunner.newJsonRunnerWithSetting(settings,
            HttpArgs.httpArgs().withPort(this.port).build())
        this.runner.run()
        this.started = true
        return this
    }

    @Override
    String registeredMappings() {
        return ""
    }

    @Override
    boolean isAccepted(File file) {
        return file.name.endsWith(".json")
    }
}
```

然后，可以将其注册到`spring.factories`文件中，如以下示例所示：

```
org.springframework.cloud.contract.stubrunner.HttpServerStub=\
org.springframework.cloud.contract.stubrunner.provider.moco.MocoHttpServerStub
```

现在，您可以使用Moco运行存根。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 如果不提供任何实现，则使用默认（WireMock）实现。如果提供多个，则使用列表中的第一个。 |      |

## 96.5使用自定义存根下载器

您可以通过创建`StubDownloaderBuilder`接口的实现来自定义存根的下载方式，如以下示例所示：

```
package com.example;

class CustomStubDownloaderBuilder implements StubDownloaderBuilder {

    @Override
    public StubDownloader build(final StubRunnerOptions stubRunnerOptions) {
        return new StubDownloader() {
            @Override
            public Map.Entry<StubConfiguration, File> downloadAndUnpackStubJar(
                    StubConfiguration config) {
                File unpackedStubs = retrieveStubs();
                return new AbstractMap.SimpleEntry<>(
                        new StubConfiguration(config.getGroupId(), config.getArtifactId(), version,
                                config.getClassifier()), unpackedStubs);
            }

            File retrieveStubs() {
                // here goes your custom logic to provide a folder where all the stubs reside
            }
}
```

然后，可以将其注册到`spring.factories`文件中，如以下示例所示：

```
# Example of a custom Stub Downloader Provider
org.springframework.cloud.contract.stubrunner.StubDownloaderBuilder=\
com.example.CustomStubDownloaderBuilder
```

现在，您可以选择一个包含存根源的文件夹。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 如果不提供任何实现，则使用默认设置（扫描类路径）。如果提供`stubsMode = StubRunnerProperties.StubsMode.LOCAL`或`, stubsMode = StubRunnerProperties.StubsMode.REMOTE`，则将使用Aether实现。如果提供多个，则将使用列表中的第一个。 |      |

## 96.6使用SCM存根下载器

每当`repositoryRoot`以SCM协议开头（当前我们仅支持`git://`）时，存根下载器都会尝试克隆存储库，并将其用作生成测试或存根的合同来源。

通过环境变量，系统属性，插件内部设置的属性或合同存储库配置，您可以调整下载程序的行为。您可以在下面找到属性列表



**表96.1 SCM存根下载器属性**

| 物业类型                                                     | 物业名称 | 描述                                         |
| ------------------------------------------------------------ | -------- | -------------------------------------------- |
| * `git.branch`（插件支持）* `stubrunner.properties.git.branch`（系统道具）* `STUBRUNNER_PROPERTIES_GIT_BRANCH`（环境道具） | 主       | 结帐哪个分支                                 |
| * `git.username`（插件支持）* `stubrunner.properties.git.username`（系统道具）* `STUBRUNNER_PROPERTIES_GIT_USERNAME`（env prop） |          | Git克隆用户名                                |
| * `git.password`（插件支持）* `stubrunner.properties.git.password`（系统道具）* `STUBRUNNER_PROPERTIES_GIT_PASSWORD`（环保道具） |          | Git克隆密码                                  |
| * `git.no-of-attempts`（插件支持）* `stubrunner.properties.git.no-of-attempts`（系统道具）* `STUBRUNNER_PROPERTIES_GIT_NO_OF_ATTEMPTS`（环境道具） | 10       | 将提交推送到`origin`的尝试次数               |
| * `git.wait-between-attempts`（插件支持）* `stubrunner.properties.git.wait-between-attempts`（系统道具）* `STUBRUNNER_PROPERTIES_GIT_WAIT_BETWEEN_ATTEMPTS`（env prop） | 1000     | 两次尝试将提交推送到`origin`时要等待的毫秒数 |



## 96.7使用契约存根下载器

每当`repositoryRoot`以Pact协议开头（以`pact://`开头）时，存根下载器都将尝试从Pact Broker中获取Pact合同定义。`pact://`之后设置的任何内容都将解析为Pact Broker URL。

通过环境变量，系统属性，插件内部设置的属性或合同存储库配置，您可以调整下载程序的行为。您可以在下面找到属性列表



**表96.2。SCM存根下载器属性**

| 物业名称                                                     | 默认                                                         | 描述                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| * `pactbroker.host`（插件支持）* `stubrunner.properties.pactbroker.host`（系统道具）* `STUBRUNNER_PROPERTIES_PACTBROKER_HOST`（环境道具） | 通过URL传递给`repositoryRoot`的主机                          | Pact Broker的URL是什么                                       |
| * `pactbroker.port`（插件支持）* `stubrunner.properties.pactbroker.port`（系统道具）* `STUBRUNNER_PROPERTIES_PACTBROKER_PORT`（环境道具） | URL的端口已传递到`repositoryRoot`                            | Pact Broker的端口是什么                                      |
| * `pactbroker.protocol`（插件支持）* `stubrunner.properties.pactbroker.protocol`（系统道具）* `STUBRUNNER_PROPERTIES_PACTBROKER_PROTOCOL`（环境道具） | 来自URL的协议传递到`repositoryRoot`                          | Pact Broker的协议是什么                                      |
| * `pactbroker.tags`（插件支持）* `stubrunner.properties.pactbroker.tags`（系统道具）* `STUBRUNNER_PROPERTIES_PACTBROKER_TAGS`（环境道具） | 存根的版本；如果版本为`+`，则为`latest`                      | 应该使用什么标签来获取存根                                   |
| * `pactbroker.auth.scheme`（插件支持）* `stubrunner.properties.pactbroker.auth.scheme`（系统道具）* `STUBRUNNER_PROPERTIES_PACTBROKER_AUTH_SCHEME`（环境道具） | `Basic`                                                      | 应该使用哪种身份验证来连接到Pact Broker                      |
| * `pactbroker.auth.username`（插件支持）* `stubrunner.properties.pactbroker.auth.username`（系统道具）* `STUBRUNNER_PROPERTIES_PACTBROKER_AUTH_USERNAME`（环境道具） | 用户名传递给`contractsRepositoryUsername`（Maven）或`contractRepository.username`（gradle） | 用于连接到Pact Broker的用户名                                |
| * `pactbroker.auth.password`（插件支持）* `stubrunner.properties.pactbroker.auth.password`（系统道具）* `STUBRUNNER_PROPERTIES_PACTBROKER_AUTH_PASSWORD`（环境道具） | 密码已传递给`contractsRepositoryPassword`（专家）或`contractRepository.password`（等级） | 用于连接Pact Broker的密码                                    |
| * `pactbroker.provider-name-with-group-id`（插件支持）* `stubrunner.properties.pactbroker.provider-name-with-group-id`（系统道具）* `STUBRUNNER_PROPERTIES_PACTBROKER_PROVIDER_NAME_WITH_GROUP_ID`（env prop） | 假                                                           | 当为`true`时，提供者名称将为`groupId:artifactId`的组合。如果为`false`，则仅使用`artifactId` |



## 97. Spring Cloud Contract WireMock

使用Spring Cloud Contract WireMock模块，您可以在Spring Boot应用程序中使用[WireMock](https://github.com/tomakehurst/wiremock)。查看 [示例](https://github.com/spring-cloud/spring-cloud-contract/tree/2.1.x/samples) 以获取更多详细信息。

如果您有一个Spring Boot应用程序，该应用程序使用Tomcat作为嵌入式服务器（这是`spring-boot-starter-web`的默认设置），则可以将`spring-cloud-starter-contract-stub-runner`添加到您的类路径中，并添加`@AutoConfigureWireMock`，以便能够在测试中使用Wiremock。Wiremock作为存根服务器运行，您可以在测试中使用Java API或通过静态JSON声明来注册存根行为。以下代码显示了一个示例：

```
@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@AutoConfigureWireMock(port = 0)
public class WiremockForDocsTests {

    // A service that calls out over HTTP
    @Autowired
    private Service service;

    @Before
    public void setup() {
        this.service.setBase("http://localhost:"
                + this.environment.getProperty("wiremock.server.port"));
    }

    // Using the WireMock APIs in the normal way:
    @Test
    public void contextLoads() throws Exception {
        // Stubbing WireMock
        stubFor(get(urlEqualTo("/resource")).willReturn(aResponse()
                .withHeader("Content-Type", "text/plain").withBody("Hello World!")));
        // We're asserting if WireMock responded properly
        assertThat(this.service.go()).isEqualTo("Hello World!");
    }

}
```

要在其他端口上启动存根服务器，请使用`@AutoConfigureWireMock(port=9999)`。对于随机端口，请使用值`0`。可以在测试应用程序上下文中使用“ wiremock.server.port”属性绑定存根服务器端口。使用`@AutoConfigureWireMock`将类型为`WiremockConfiguration`的bean添加到测试应用程序上下文中，该变量将被缓存在具有相同上下文的方法和类之间，与Spring集成测试相同。您也可以将`WireMockServer`类型的bean注入测试中。

## 97.1自动注册存根

如果使用`@AutoConfigureWireMock`，它将从文件系统或类路径（默认情况下，从`file:src/test/resources/mappings`）注册WireMock JSON存根。您可以使用注释中的`stubs`属性来自定义位置，该属性可以是Ant样式的资源模式或目录。对于目录，将附加`***/**.json`。以下代码显示了一个示例：

```
@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureWireMock(stubs="classpath:/stubs")
public class WiremockImportApplicationTests {

	@Autowired
	private Service service;

	@Test
	public void contextLoads() throws Exception {
		assertThat(this.service.go()).isEqualTo("Hello World!");
	}

}
```

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 实际上，WireMock总是从`src/test/resources/mappings` **以及** stubs属性中的自定义位置加载映射。要更改此行为，还可以按照本文档下一节中的说明指定文件根。 |

如果您使用的是Spring Cloud Contract的默认存根jar，则您的存根将存储在`/META-INF/group-id/artifact-id/versions/mappings/`文件夹下。如果要从该位置，所有嵌入式JAR中注册所有存根，那么使用以下语法就足够了。

```
@AutoConfigureWireMock(port = 0, stubs = "classpath*:/META-INF/**/mappings/**/*.json")
```

## 97.2使用文件指定存根实体

WireMock可以从类路径或文件系统上的文件中读取响应正文。在这种情况下，您可以在JSON DSL中看到响应具有`bodyFileName`而不是（文字）`body`。相对于根目录（默认为`src/test/resources/__files`）来解析文件。要自定义此位置，可以将`@AutoConfigureWireMock`批注中的`files`属性设置为父目录的位置（换句话说，`__files`是子目录）。您可以使用Spring资源表示法来引用`file:…`或`classpath:…`位置。不支持通用网址。可以给出一个值列表，在这种情况下，WireMock会在需要查找响应正文时解析存在的第一个文件。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 当您配置`files`根目录时，它也会影响存根的自动加载，因为它们来自子目录“映射”中的根目录。`files`的值对从`stubs`属性显式加载的存根没有影响。 |

## 97.3替代：使用JUnit规则

要获得更常规的WireMock体验，可以使用JUnit `@Rules`启动和停止服务器。为此，请使用方便类`WireMockSpring`获得一个`Options`实例，如以下示例所示：

```
@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
public class WiremockForDocsClassRuleTests {

    // Start WireMock on some dynamic port
    // for some reason `dynamicPort()` is not working properly
    @ClassRule
    public static WireMockClassRule wiremock = new WireMockClassRule(
            WireMockSpring.options().dynamicPort());

    // A service that calls out over HTTP to wiremock's port
    @Autowired
    private Service service;

    @Before
    public void setup() {
        this.service.setBase("http://localhost:" + wiremock.port());
    }

    // Using the WireMock APIs in the normal way:
    @Test
    public void contextLoads() throws Exception {
        // Stubbing WireMock
        wiremock.stubFor(get(urlEqualTo("/resource")).willReturn(aResponse()
                .withHeader("Content-Type", "text/plain").withBody("Hello World!")));
        // We're asserting if WireMock responded properly
        assertThat(this.service.go()).isEqualTo("Hello World!");
    }

}
```

`@ClassRule`表示在运行了此类中的所有方法之后，服务器将关闭。

## 97.4放松模板的SSL验证

WireMock允许您使用“ https” URL协议对“安全”服务器进行存根。如果您的应用程序希望在集成测试中联系该存根服务器，它将发现SSL证书无效（自安装证书的常见问题）。最好的选择通常是将客户端重新配置为使用“ http”。如果这不是一种选择，则可以要求Spring配置忽略SSL验证错误的HTTP客户端（当然，仅对测试而言如此）。

为了使此工作最小，您需要在应用中使用Spring Boot `RestTemplateBuilder`，如以下示例所示：

```
@Bean
public RestTemplate restTemplate(RestTemplateBuilder builder) {
    return builder.build();
}
```

您需要`RestTemplateBuilder`，因为构建器是通过回调传递的，以对其进行初始化，因此此时可以在客户端中设置SSL验证。如果您使用的是`@AutoConfigureWireMock`批注或存根运行程序，则这会在测试中自动发生。如果使用JUnit `@Rule`方法，则还需要添加`@AutoConfigureHttpClient`批注，如以下示例所示：

```
@RunWith(SpringRunner.class)
@SpringBootTest("app.baseUrl=https://localhost:6443")
@AutoConfigureHttpClient
public class WiremockHttpsServerApplicationTests {

    @ClassRule
    public static WireMockClassRule wiremock = new WireMockClassRule(
            WireMockSpring.options().httpsPort(6443));
...
}
```

如果您使用的是`spring-boot-starter-test`，则将Apache HTTP客户端放在类路径上，并由`RestTemplateBuilder`选择它，并将其配置为忽略SSL错误。如果使用默认的`java.net`客户端，则不需要注释（但不会造成任何危害）。当前不支持其他客户端，但可能会在将来的版本中添加。

要禁用自定义`RestTemplateBuilder`，请将`wiremock.rest-template-ssl-enabled`属性设置为`false`。

## 97.5 WireMock和Spring MVC模拟

Spring Cloud Contract提供了一个便利类，可以将JSON WireMock存根加载到Spring `MockRestServiceServer`中。以下代码显示了一个示例：

```
@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = WebEnvironment.NONE)
public class WiremockForDocsMockServerApplicationTests {

	@Autowired
	private RestTemplate restTemplate;

	@Autowired
	private Service service;

	@Test
	public void contextLoads() throws Exception {
		// will read stubs classpath
		MockRestServiceServer server = WireMockRestServiceServer.with(this.restTemplate)
				.baseUrl("https://example.org").stubs("classpath:/stubs/resource.json")
				.build();
		// We're asserting if WireMock responded properly
		assertThat(this.service.go()).isEqualTo("Hello World");
		server.verify();
	}

}
```

`baseUrl`值被附加到所有模拟调用中，并且`stubs()`方法采用存根路径资源模式作为参数。在前面的示例中，在`/stubs/resource.json`定义的存根被加载到模拟服务器中。如果要求`RestTemplate`访问`https://example.org/`，它将获得在该URL声明的响应。可以指定多个存根模式，每个存根模式都可以是目录（用于所有“ .json”的递归列表），固定文件名（如上例所示）或Ant样式的模式。JSON格式是标准的WireMock格式，您可以在[WireMock网站上](https://wiremock.org/docs/stubbing/)阅读该 [格式](https://wiremock.org/docs/stubbing/)。

当前，Spring Cloud Contract验证程序支持Tomcat，Jetty和Undertow作为Spring Boot嵌入式服务器，而Wiremock本身对特定版本的Jetty（当前为9.2）具有“本机”支持。要使用本机Jetty，您需要添加本机Wiremock依赖项并排除Spring Boot容器（如果有）。

## 97.6自定义WireMock配置

您可以注册`org.springframework.cloud.contract.wiremock.WireMockConfigurationCustomizer`类型的bean以自定义WireMock配置（例如，添加自定义转换器）。例：

```
		@Bean
		WireMockConfigurationCustomizer optionsCustomizer() {
			return new WireMockConfigurationCustomizer() {
				@Override
				public void customize(WireMockConfiguration options) {
// perform your customization here
				}
			};
		}
```

## 97.7使用REST文档生成存根

[Spring REST Docs](https://projects.spring.io/spring-restdocs)可用于为具有Spring MockMvc或`WebTestClient`或Rest Assured的HTTP API生成文档（例如，Asciidoctor格式）。在为API生成文档的同时，还可以使用Spring Cloud Contract WireMock生成WireMock存根。为此，编写您的常规REST Docs测试用例，并使用`@AutoConfigureRestDocs`在REST Docs输出目录中自动生成存根。以下代码显示了使用`MockMvc`的示例：

```
@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureRestDocs(outputDir = "target/snippets")
@AutoConfigureMockMvc
public class ApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	public void contextLoads() throws Exception {
		mockMvc.perform(get("/resource"))
				.andExpect(content().string("Hello World"))
				.andDo(document("resource"));
	}
}
```

此测试在“ target / snippets / stubs / resource.json”处生成WireMock存根。它将所有GET请求与“ / resource”路径匹配。与`WebTestClient`相同的示例（用于测试Spring WebFlux应用程序）看起来像这样：

```
@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureRestDocs(outputDir = "target/snippets")
@AutoConfigureWebTestClient
public class ApplicationTests {

    @Autowired
    private WebTestClient client;

    @Test
    public void contextLoads() throws Exception {
        client.get().uri("/resource").exchange()
                .expectBody(String.class).isEqualTo("Hello World")
                .consumeWith(document("resource"));
    }
}
```

在没有任何其他配置的情况下，这些测试将为HTTP方法创建一个带有请求匹配器的存根，以及除“主机”和“内容长度”之外的所有标头。为了更精确地匹配请求（例如，匹配POST或PUT的正文），我们需要显式创建一个请求匹配器。这样做有两个效果：

- 创建仅以您指定的方式匹配的存根。
- 断言测试用例中的请求也匹配相同的条件。

此功能的主要入口点是`WireMockRestDocs.verify()`，它可以代替`document()`便捷方法，如以下示例所示：

```
import static org.springframework.cloud.contract.wiremock.restdocs.WireMockRestDocs.verify;
@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureRestDocs(outputDir = "target/snippets")
@AutoConfigureMockMvc
public class ApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void contextLoads() throws Exception {
        mockMvc.perform(post("/resource")
                .content("{\"id\":\"123456\",\"message\":\"Hello World\"}"))
                .andExpect(status().isOk())
                .andDo(verify().jsonPath("$.id"))
                .andDo(document("resource"));
    }
}
```

该合同规定，任何带有“ id”字段的有效POST都会收到此测试中定义的响应。您可以将对`.jsonPath()`的呼叫链接在一起以添加其他匹配器。如果不熟悉JSON Path，[JayWay文档](https://github.com/jayway/JsonPath)可以帮助您快速[入门](https://github.com/jayway/JsonPath)。此测试的`WebTestClient`版本具有您插入相同位置的类似的`verify()`静态助手。

除了`jsonPath`和`contentType`便捷方法之外，您还可以使用WireMock API来验证请求是否与创建的存根匹配，如以下示例所示：

```
@Test
public void contextLoads() throws Exception {
    mockMvc.perform(post("/resource")
               .content("{\"id\":\"123456\",\"message\":\"Hello World\"}"))
            .andExpect(status().isOk())
            .andDo(verify()
                    .wiremock(WireMock.post(
                        urlPathEquals("/resource"))
                        .withRequestBody(matchingJsonPath("$.id")))
                       .andDo(document("post-resource"));
}
```

WireMock API丰富。您可以通过正则表达式以及JSON路径匹配标头，查询参数和请求正文。这些功能可用于创建具有更广泛参数范围的存根。上面的示例生成一个类似于以下示例的存根：

**post-resource.json。** 

```
{
  "request" : {
    "url" : "/resource",
    "method" : "POST",
    "bodyPatterns" : [ {
      "matchesJsonPath" : "$.id"
    }]
  },
  "response" : {
    "status" : 200,
    "body" : "Hello World",
    "headers" : {
      "X-Application-Context" : "application:-1",
      "Content-Type" : "text/plain"
    }
  }
}
```



| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 您可以使用`wiremock()`方法或`jsonPath()`和`contentType()`方法来创建请求匹配器，但是不能同时使用两种方法。 |

在使用者方面，可以使本节前面部分生成的`resource.json`在类路径上可用（例如，通过<< publishing-stubs-as-jars）。之后，可以使用WireMock以多种不同方式创建存根，包括使用`@AutoConfigureWireMock(stubs="classpath:resource.json")`，如本文档前面所述。

## 97.8通过使用REST文档生成Contracts

您还可以使用Spring REST Docs生成Spring Cloud Contract DSL文件和文档。如果与Spring Cloud WireMock结合使用，则会同时获得合同和存根。

您为什么要使用此功能？社区中的一些人询问有关他们希望转向基于DSL的合同定义的情况的问题，但是他们已经进行了许多Spring MVC测试。使用此功能，您可以生成合同文件，以后可以修改合同文件并将其移动到文件夹（在配置中定义），以便插件找到它们。

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 您可能想知道为什么WireMock模块中有此功能。之所以具有此功能是因为生成合同和存根都是有意义的。 |

考虑以下测试：

```
		this.mockMvc
				.perform(post("/foo").accept(MediaType.APPLICATION_PDF)
						.accept(MediaType.APPLICATION_JSON)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"foo\": 23, \"bar\" : \"baz\" }"))
				.andExpect(status().isOk()).andExpect(content().string("bar"))
				// first WireMock
				.andDo(WireMockRestDocs.verify().jsonPath("$[?(@.foo >= 20)]")
						.jsonPath("$[?(@.bar in ['baz','bazz','bazzz'])]")
						.contentType(MediaType.valueOf("application/json")))
				// then Contract DSL documentation
				.andDo(document("index", SpringCloudContractRestDocs.dslContract()));
```

前面的测试将创建上一部分中介绍的存根，同时生成合同和文档文件。

该合同称为`index.groovy`，可能类似于以下示例：

```
import org.springframework.cloud.contract.spec.Contract

Contract.make {
    request {
        method 'POST'
        url '/foo'
        body('''
            {"foo": 23 }
        ''')
        headers {
            header('''Accept''', '''application/json''')
            header('''Content-Type''', '''application/json''')
        }
    }
    response {
        status OK()
        body('''
        bar
        ''')
        headers {
            header('''Content-Type''', '''application/json;charset=UTF-8''')
            header('''Content-Length''', '''3''')
        }
        testMatchers {
            jsonPath('$[?(@.foo >= 20)]', byType())
        }
    }
}
```

生成的文档（在这种情况下为Asciidoc格式）包含格式化的合同。该文件的位置为`index/dsl-contract.adoc`。

## 98.迁移

| ![[提示]](/assets/images/springcloud/tip.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 有关最新的迁移指南，请访问项目的[Wiki页面](https://github.com/spring-cloud/spring-cloud-contract/wiki/)。 |

本节介绍从Spring Cloud Contract验证程序的一个版本迁移到下一版本。它涵盖以下版本升级路径：

## 98.1 1.0.x→1.1.x

本节介绍从1.0版升级到1.1版的过程。

### 98.1.1生成的存根的新结构

在`1.1.x`中，我们对生成的存根的结构进行了更改。如果您一直使用`@AutoConfigureWireMock`表示法来使用类路径中的存根，那么它将不再起作用。以下示例显示了`@AutoConfigureWireMock`表示法的工作原理：

```
@AutoConfigureWireMock(stubs = "classpath:/customer-stubs/mappings", port = 8084)
```

您必须将存根的位置更改为：`classpath:…/META-INF/groupId/artifactId/version/mappings`或使用新的基于类路径的`@AutoConfigureStubRunner`，如以下示例所示：

```
@AutoConfigureWireMock(stubs = "classpath:customer-stubs/META-INF/travel.components/customer-contract/1.0.2-SNAPSHOT/mappings/", port = 8084)
```

如果您不想使用`@AutoConfigureStubRunner`，并且希望保留原来的结构，请相应地设置插件任务。以下示例适用于前一片段中介绍的结构。

**Maven.** 

```
<!-- start of pom.xml -->

<properties>
    <!-- we don't want the verifier to do a jar for us -->
    <spring.cloud.contract.verifier.skip>true</spring.cloud.contract.verifier.skip>
</properties>

<!-- ... -->

<!-- You need to set up the assembly plugin -->
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-assembly-plugin</artifactId>
            <executions>
                <execution>
                    <id>stub</id>
                    <phase>prepare-package</phase>
                    <goals>
                        <goal>single</goal>
                    </goals>
                    <inherited>false</inherited>
                    <configuration>
                        <attach>true</attach>
                        <descriptor>$../../../../src/assembly/stub.xml</descriptor>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
<!-- end of pom.xml -->

<!-- start of stub.xml-->

<assembly
    xmlns="http://maven.apache.org/plugins/maven-assembly-plugin/assembly/1.1.3"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/plugins/maven-assembly-plugin/assembly/1.1.3 https://maven.apache.org/xsd/assembly-1.1.3.xsd">
    <id>stubs</id>
    <formats>
        <format>jar</format>
    </formats>
    <includeBaseDirectory>false</includeBaseDirectory>
    <fileSets>
        <fileSet>
            <directory>${project.build.directory}/snippets/stubs</directory>
            <outputDirectory>customer-stubs/mappings</outputDirectory>
            <includes>
                <include>**/*</include>
            </includes>
        </fileSet>
        <fileSet>
            <directory>$../../../../src/test/resources/contracts</directory>
            <outputDirectory>customer-stubs/contracts</outputDirectory>
            <includes>
                <include>**/*.groovy</include>
            </includes>
        </fileSet>
    </fileSets>
</assembly>

<!-- end of stub.xml-->
```



**Gradle.** 

```
task copyStubs(type: Copy, dependsOn: 'generateWireMockClientStubs') {
//    Preserve directory structure from 1.0.X of spring-cloud-contract
    from "${project.buildDir}/resources/main/customer-stubs/META-INF/${project.group}/${project.name}/${project.version}"
    into "${project.buildDir}/resources/main/customer-stubs"
}
```



## 98.2 1.1.x→1.2.x

本节介绍从版本1.1升级到版本1.2。

### 98.2.1自定义`HttpServerStub`

`HttpServerStub`包含版本1.1以外的方法。方法是`String registeredMappings()`如果您有实现`HttpServerStub`的类，则现在必须实现`registeredMappings()`方法。它应返回一个`String`，代表单个`HttpServerStub`中所有可用的映射。

有关更多详细信息，请参见[问题355](https://github.com/spring-cloud/spring-cloud-contract/issues/355)。

### 98.2.2用于生成测试的新软件包

设置生成的测试程序包名称的流程如下所示：

- 设置`basePackageForTests`
- 如果未设置`basePackageForTests`，请从`baseClassForTests`中选择包装
- 如果未设置`baseClassForTests`，则选择`packageWithBaseClasses`
- 如果未设置任何内容，请选择默认值：`org.springframework.cloud.contract.verifier.tests`

有关更多详细信息，请参见[问题260](https://github.com/spring-cloud/spring-cloud-contract/issues/260)。

### 98.2.3 TemplateProcessor中的新方法

为了增加对`fromRequest.path`的支持，必须在`TemplateProcessor`接口中添加以下方法：

- `path()`
- `path(int index)`

有关更多详细信息，请参见[问题388](https://github.com/spring-cloud/spring-cloud-contract/issues/388)。

### 98.2.4 RestAssured 3.0

在生成的测试类中使用的“放心的保证”被提高到`3.0`。如果您手动设置Spring Cloud Contract的版本和发行版，可能会看到以下异常：

```
Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin:3.1:testCompile (default-testCompile) on project some-project: Compilation failure: Compilation failure:
[ERROR] /some/path/SomeClass.java:[4,39] package com.jayway.restassured.response does not exist
```

由于使用旧版本的插件生成了测试，并且在测试执行时您具有发行版的不兼容版本（反之亦然），因此会发生此异常。

通过[问题267](https://github.com/spring-cloud/spring-cloud-contract/issues/267)完成

## 98.3 1.2.x→2.0.x

## 99.链接

以下链接在使用Spring Cloud Contract时可能会有所帮助：

- [Spring Cloud Contract Github Repository](https://github.com/spring-cloud/spring-cloud-contract/)
- [Spring Cloud合同示例](https://github.com/spring-cloud-samples/spring-cloud-contract-samples/)
- [Spring Cloud Contract Gitter](https://gitter.im/spring-cloud/spring-cloud-contract)
- [Spring Cloud Contract WJUG演讲，作者：Marcin Grzejszczak](https://www.youtube.com/watch?v=sAAklvxmPmk)

# 第十四部分。Spring Cloud Vault

©2016-2019原作者。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| *本文档的副本可以供您自己使用，也可以分发给其他人，但前提是您不对此类副本收取任何费用，并且还应确保每份副本均包含本版权声明（无论是印刷版本还是电子版本）。* |

Spring Cloud Vault Config为分布式系统中的外部化配置提供客户端支持。使用[HashiCorp的Vault，](https://www.vaultproject.io/)您可以在中心位置管理所有环境中应用程序的外部秘密属性。Vault可以管理静态和动态机密，例如远程应用程序/资源的用户名/密码，并为外部服务（例如MySQL，PostgreSQL，Apache Cassandra，MongoDB，Consul，AWS等）提供凭据。

## 100.快速入门

**先决条件**

要开始使用Vault和本指南，您需要一个类似* NIX的操作系统，该操作系统提供：

- `wget`，`openssl`和`unzip`
- 至少Java 7和正确配置的`JAVA_HOME`环境变量

**安装Vault**

```
$ src/test/bash/install_vault.sh
```

**为Vault创建SSL证书**

```
$ src/test/bash/create_certificates.sh
```

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| `create_certificates.sh`在`work/ca`和JKS信任库`work/keystore.jks`中创建证书。如果要使用此快速入门指南运行Spring Cloud Vault，则需要将信任库的`spring.cloud.vault.ssl.trust-store`属性配置为`file:work/keystore.jks`。 |

**启动Vault服务器**

```
$ src/test/bash/local_run_vault.sh
```

Vault开始使用`inmem`存储和`https`在`0.0.0.0:8200`上侦听。Vault被密封并且在启动时未初始化。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 如果要运行测试，请保留Vault未初始化。测试将初始化Vault并创建根令牌`00000000-0000-0000-0000-000000000000`。 |

如果要对应用程序使用Vault或尝试使用它，则需要首先对其进行初始化。

```
$ export VAULT_ADDR="https://localhost:8200"
$ export VAULT_SKIP_VERIFY=true # Don't do this for production
$ vault init
```

您应该看到类似以下内容：

```
Key 1: 7149c6a2e16b8833f6eb1e76df03e47f6113a3288b3093faf5033d44f0e70fe701
Key 2: 901c534c7988c18c20435a85213c683bdcf0efcd82e38e2893779f152978c18c02
Key 3: 03ff3948575b1165a20c20ee7c3e6edf04f4cdbe0e82dbff5be49c63f98bc03a03
Key 4: 216ae5cc3ddaf93ceb8e1d15bb9fc3176653f5b738f5f3d1ee00cd7dccbe926e04
Key 5: b2898fc8130929d569c1677ee69dc5f3be57d7c4b494a6062693ce0b1c4d93d805
Initial Root Token: 19aefa97-cccc-bbbb-aaaa-225940e63d76

Vault initialized with 5 keys and a key threshold of 3. Please
securely distribute the above keys. When the Vault is re-sealed,
restarted, or stopped, you must provide at least 3 of these keys
to unseal it again.

Vault does not store the master key. Without at least 3 keys,
your Vault will remain permanently sealed.
```

Vault将初始化并返回一组启封密钥和根令牌。选择3个键并解开Vault。将Vault令牌存储在`VAULT_TOKEN`环境变量中。

```
$ vault unseal (Key 1)
$ vault unseal (Key 2)
$ vault unseal (Key 3)
$ export VAULT_TOKEN=(Root token)
# Required to run Spring Cloud Vault tests after manual initialization
$ vault token-create -id="00000000-0000-0000-0000-000000000000" -policy="root"
```

Spring Cloud Vault访问不同的资源。默认情况下，启用秘密后端，该后端通过JSON端点访问秘密配置设置。

HTTP服务具有以下形式的资源：

```
/secret/{application}/{profile}
/secret/{application}
/secret/{defaultContext}/{profile}
/secret/{defaultContext}
```

如果将“应用程序”作为`spring.application.name`插入`SpringApplication`中（即常规Spring Boot应用程序中通常是“应用程序”），则“配置文件”是有效的配置文件（或逗号分隔的列表）属性）。从Vault中检索到的Properties将按原样使用，而无需进一步添加属性名称的前缀。

## 101.客户端使用

要在应用程序中使用这些功能，只需将其构建为依赖于`spring-cloud-vault-config`的Spring Boot应用程序即可（例如，查看测试用例）。Maven示例配置：



**示例101.1 pom.xml**

```
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.0.0.RELEASE</version>
    <relativePath /> <!-- lookup parent from repository -->
</parent>

<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-vault-config</artifactId>
        <version>{project-version}</version>
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



然后，您可以创建一个标准的Spring Boot应用程序，例如以下简单的HTTP服务器：

```
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

运行时，它将从端口`8200`上的默认本地Vault服务器获取外部配置（如果正在运行）。要修改启动行为，您可以使用`bootstrap.properties`来更改Vault服务器的位置（例如`application.properties`，但用于应用程序上下文的引导阶段），例如



**示例101.2 bootstrap.yml**

```
spring.cloud.vault:
    host: localhost
    port: 8200
    scheme: https
    uri: https://localhost:8200
    connection-timeout: 5000
    read-timeout: 15000
    config:
        order: -10
```



- `host`设置Vault主机的主机名。主机名将用于SSL证书验证
- `port`设置Vault端口
- `scheme`将方案设置为`http`将使用纯HTTP。支持的方案是`http`和`https`。
- `uri`使用URI配置Vault端点。优先于主机/端口/方案配置
- `connection-timeout`设置连接超时（以毫秒为单位）
- `read-timeout`设置读取超时（以毫秒为单位）
- `config.order`设置属性来源的顺序

启用进一步的集成需要附加的依赖关系和配置。根据您设置Vault的方式，可能需要其他配置，例如 [SSL](https://cloud.spring.io/spring-cloud-vault/spring-cloud-vault.html#vault.config.ssl)和 [身份验证](https://cloud.spring.io/spring-cloud-vault/spring-cloud-vault.html#vault.config.authentication)。

如果应用程序导入了`spring-boot-starter-actuator`项目，则可以通过`/health`端点获得保管库服务器的状态。

可以通过属性`management.health.vault.enabled`（默认值为`true`）启用或禁用Vault运行状况指示器。

## 101.1身份验证

Vault需要[身份验证机制](https://www.vaultproject.io/docs/concepts/auth.html)来[授权客户端请求](https://www.vaultproject.io/docs/concepts/tokens.html)。

Spring Cloud Vault支持多种[身份验证机制，](https://cloud.spring.io/spring-cloud-vault/spring-cloud-vault.html#vault.config.authentication)以通过Vault对应用程序进行身份验证。

要快速入门，请使用[Vault初始化](https://www.springcloud.cc/spring-cloud-greenwich.html#quickstart.vault.start)打印的根令牌。



**示例101.3 bootstrap.yml**

```
spring.cloud.vault:
    token: 19aefa97-cccc-bbbb-aaaa-225940e63d76
```



| ![[警告]](/assets/images/springcloud/warning.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 请仔细考虑您的安全要求。如果您想快速开始使用Vault，则可以使用静态令牌认证，但是静态令牌不再受到任何保护。向非预期方的任何公开都允许Vault与关联的令牌角色一起使用。 |

## 102.认证方式

不同的组织对安全性和身份验证有不同的要求。Vault通过提供多种身份验证方法来反映这种需求。Spring Cloud Vault支持令牌和AppId身份验证。

## 102.1令牌认证

令牌是Vault中进行身份验证的核心方法。令牌认证要求使用[Bootstrap应用程序上下文](https://github.com/spring-cloud/spring-cloud-commons/blob/master/docs/src/main/asciidoc/spring-cloud-commons.adoc#the-bootstrap-application-context)提供静态令牌 。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 令牌认证是默认的认证方法。如果公开了令牌，则意外的一方将获得对Vault的访问权，并且可以访问目标客户的机密。 |



**示例102.1 bootstrap.yml**

```
spring.cloud.vault:
    authentication: TOKEN
    token: 00000000-0000-0000-0000-000000000000
```



- `authentication`将此值设置为`TOKEN`会选择令牌身份验证方法
- `token`设置要使用的静态令牌

另请参阅：[Vault文档：令牌](https://www.vaultproject.io/docs/concepts/tokens.html)

## 102.2 AppId身份验证

Vault支持 由两个难以猜测的令牌组成的[AppId](https://www.vaultproject.io/docs/auth/app-id.html)身份验证。AppId默认为静态配置的`spring.application.name`。第二个令牌是UserId，它是应用程序确定的一部分，通常与运行时环境有关。IP地址，Mac地址或Docker容器名称就是很好的例子。Spring Cloud Vault配置支持IP地址，Mac地址和静态UserId（例如，通过系统属性提供）。IP和Mac地址表示为十六进制编码的SHA256哈希。

基于IP地址的UserId使用本地主机的IP地址。



**示例10.2 bootstrap.yml使用SHA256 IP地址用户ID**

```
spring.cloud.vault:
    authentication: APPID
    app-id:
        user-id: IP_ADDRESS
```



- `authentication`将此值设置为`APPID`会选择AppId身份验证方法
- `app-id-path`设置要使用的AppId安装的路径
- `user-id`设置UserId方法。可能的值为`IP_ADDRESS`，`MAC_ADDRESS`或实现自定义`AppIdUserIdMechanism`的类名

从命令行生成IP地址UserId的相应命令是：

```
$ echo -n 192.168.99.1 | sha256sum
```

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 包含`echo`的换行符会导致不同的哈希值，因此请确保包含`-n`标志。 |

基于Mac地址的UserId从本地主机绑定的设备获取其网络设备。该配置还允许指定`network-interface`提示以选择正确的设备。`network-interface`的值是可选的，可以是接口名称或接口索引（从0开始）。



**示例102.3 bootstrap.yml使用SHA256 Mac-Address用户ID**

```
spring.cloud.vault:
    authentication: APPID
    app-id:
        user-id: MAC_ADDRESS
        network-interface: eth0
```



- `network-interface`设置网络接口以获取物理地址

从命令行生成IP地址UserId的相应命令是：

```
$ echo -n 0AFEDE1234AC | sha256sum
```

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| Mac地址指定为大写且没有冒号。包括`echo`的换行符会导致不同的哈希值，因此请确保包含`-n`标志。 |

### 102.2.1自定义用户ID

UserId生成是一种开放机制。您可以将`spring.cloud.vault.app-id.user-id`设置为任何字符串，并且配置的值将用作静态UserId。

使用更高级的方法，可以将`spring.cloud.vault.app-id.user-id`设置为类名。此类必须在您的类路径上，并且必须实现`org.springframework.cloud.vault.AppIdUserIdMechanism`接口和`createUserId`方法。Spring Cloud Vault将在每次使用AppId进行身份验证以获取令牌时通过调用`createUserId`来获取UserId。



**示例102.4 bootstrap.yml**

```
spring.cloud.vault:
    authentication: APPID
    app-id:
        user-id: com.examlple.MyUserIdMechanism
```





**示例102.5 MyUserIdMechanism.java**

```
public class MyUserIdMechanism implements AppIdUserIdMechanism {

  @Override
  public String createUserId() {
    String userId = ...
    return userId;
  }
}
```



另请参阅：[Vault文档：使用App ID auth后端](https://www.vaultproject.io/docs/auth/app-id.html)

## 102.3 AppRole身份验证

[AppRole](https://www.vaultproject.io/docs/auth/app-id.html)用于机器身份验证，例如已弃用的（自Vault 0.6.1起）[第102.2节“ AppId身份验证”](https://www.springcloud.cc/spring-cloud-greenwich.html#vault.config.authentication.appid)。AppRole身份验证包含两个很难猜测（秘密）的令牌：RoleId和SecretId。

Spring Vault支持各种AppRole方案（推/拉模式和包装）。

RoleId和可选的SecretId必须由配置提供，Spring Vault将不会查找它们或创建自定义SecretId。



**示例102.6 具有AppRole身份验证属性的bootstrap.yml**

```
spring.cloud.vault:
    authentication: APPROLE
    app-role:
        role-id: bde2076b-cccb-3cf0-d57e-bca7b1e83a52
```



支持以下方案以及必需的配置详细信息：



**表102.1。组态**

| **方法**                     | **角色编号** | **SecretId** | **角色名** | **代币** |
| ---------------------------- | ------------ | ------------ | ---------- | -------- |
| 提供的RoleId / SecretId      | 提供         | 提供         |            |          |
| 提供的RoleId不含SecretId     | 提供         |              |            |          |
| 提供的RoleId，Pull SecretId  | 提供         | 提供         | 提供       | 提供     |
| 拉出RoleId，提供SecretId     |              | 提供         | 提供       | 提供     |
| 全拉模式                     |              |              | 提供       | 提供     |
| 包裹                         |              |              |            | 提供     |
| 包装好的RoleId，提供SecretId | 提供         |              |            | 提供     |
| 提供的RoleId，包装的SecretId |              | 提供         |            | 提供     |





**表102.2。拉/推/包裹矩阵**

| **角色编号** | **SecretId** | **支持的** |
| ------------ | ------------ | ---------- |
| 提供         | 提供         | ✅          |
| 提供         | 拉           | ✅          |
| 提供         | 包裹         | ✅          |
| 提供         | 缺席         | ✅          |
| 拉           | 提供         | ✅          |
| 拉           | 拉           | ✅          |
| 拉           | 包裹         | ❌          |
| 拉           | 缺席         | ❌          |
| 包裹         | 提供         | ✅          |
| 包裹         | 拉           | ❌          |
| 包裹         | 包裹         | ✅          |
| 包裹         | 缺席         | ❌          |



| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 通过在引导上下文中提供已配置的`AppRoleAuthentication` bean，您仍然可以使用推/拉/包模式的所有组合。Spring Cloud Vault无法从配置属性中导出所有可能的AppRole组合。 |

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| AppRole身份验证仅限于使用反应式基础结构的简单拉模式。尚不支持全拉模式。将Spring Cloud Vault与Spring WebFlux堆栈一起使用将启用Vault的反应式自动配置，可以通过设置`spring.cloud.vault.reactive.enabled=false`来禁用它。 |      |



**示例102.7 具有所有AppRole身份验证属性的bootstrap.yml**

```
spring.cloud.vault:
    authentication: APPROLE
    app-role:
        role-id: bde2076b-cccb-3cf0-d57e-bca7b1e83a52
        secret-id: 1696536f-1976-73b1-b241-0b4213908d39
        role: my-role
        app-role-path: approle
```



- `role-id`设置RoleId。
- `secret-id`设置SecretId。如果在不要求SecretId的情况下配置了AppRole，则可以忽略SecretId（请参见`bind_secret_id`）。
- `role`：设置拉模式的AppRole名称。
- `app-role-path`设置要使用的方法认证安装的路径。

另请参阅：[Vault文档：使用AppRole身份验证后端](https://www.vaultproject.io/docs/auth/approle.html)

## 102.4 AWS-EC2身份验证

的[AWS-EC2](https://www.vaultproject.io/docs/auth/aws-ec2.html) AUTH后端提供了一个安全导入机构为AWS EC2实例，允许的Vault令牌自动检索。与大多数Vault身份验证后端不同，此后端不需要先部署或设置安全敏感的凭据（令牌，用户名/密码，客户端证书等）。而是将AWS视为受信任的第三方，并使用经过加密签名的动态元数据信息来唯一表示每个EC2实例。



**示例102.8 使用AWS-EC2身份验证的bootstrap.yml**

```
spring.cloud.vault:
    authentication: AWS_EC2
```



AWS-EC2身份验证默认使随机数遵循首次使用信任（TOFU）原则。任何可以访问PKCS＃7身份元数据的意外用户都可以针对Vault进行身份验证。

在首次登录期间，Spring Cloud Vault生成一个随机数，该随机数存储在auth后端中，与实例ID无关。重新认证要求发送相同的随机数。任何其他方都没有随机数，可以在Vault中发出警报以进行进一步调查。

随机数保留在内存中，在应用程序重新启动期间丢失。您可以使用`spring.cloud.vault.aws-ec2.nonce`配置静态随机数。

AWS-EC2身份验证角色是可选的，默认为AMI。您可以通过设置`spring.cloud.vault.aws-ec2.role`属性来配置身份验证角色。



**示例102.9 具有配置角色的bootstrap.yml**

```
spring.cloud.vault:
    authentication: AWS_EC2
    aws-ec2:
        role: application-server
```





**示例102.10 具有所有AWS EC2身份验证属性的bootstrap.yml**

```
spring.cloud.vault:
    authentication: AWS_EC2
    aws-ec2:
        role: application-server
        aws-ec2-path: aws-ec2
        identity-document: http://...
        nonce: my-static-nonce
```



- `authentication`将此值设置为`AWS_EC2`会选择AWS EC2身份验证方法
- `role`设置尝试进行登录的角色的名称。
- `aws-ec2-path`设置要使用的AWS EC2安装的路径
- `identity-document`设置PKCS＃7 AWS EC2身份文档的URL
- `nonce`用于AWS-EC2身份验证。空随机数默认为随机数生成

另请参阅：[Vault文档：使用aws auth后端](https://www.vaultproject.io/docs/auth/aws.html)

## 102.5 AWS-IAM身份验证

在[AWS](https://www.vaultproject.io/docs/auth/aws-ec2.html)后端提供了AWS IAM角色的安全认证机制，允许基础上运行的应用程序的当前IAM角色具有拱顶的自动认证。与大多数Vault身份验证后端不同，此后端不需要先部署或设置安全敏感的凭据（令牌，用户名/密码，客户端证书等）。相反，它将AWS视为受信任的第三方，并使用呼叫者使用其IAM凭据签名的4条信息来验证呼叫者确实在使用该IAM角色。

应用程序正在其中运行的当前IAM角色是自动计算的。如果您在AWS ECS上运行应用程序，则该应用程序将使用分配给正在运行的容器的ECS任务的IAM角色。如果您在EC2实例上裸身运行应用程序，则使用的IAM角色将是分配给EC2实例的角色。

使用AWS-IAM身份验证时，您必须在Vault中创建一个角色并将其分配给您的IAM角色。空的`role`默认为当前IAM角色的友好名称。



**示例102.11 bootstrap.yml具有必需的AWS-IAM身份验证属性**

```
spring.cloud.vault:
    authentication: AWS_IAM
```





**示例102.12 具有所有AWS-IAM身份验证属性的bootstrap.yml**

```
spring.cloud.vault:
    authentication: AWS_IAM
    aws-iam:
        role: my-dev-role
        aws-path: aws
        server-id: some.server.name
```



- `role`设置尝试进行登录的角色的名称。这应该与您的IAM角色绑定。如果未提供，则当前IAM用户的友好名称将用作保管库角色。
- `aws-path`设置要使用的AWS装载的路径
- `server-id`设置用于`X-Vault-AWS-IAM-Server-ID`标头的值，以防止某些类型的重放攻击。

AWS-IAM需要AWS Java SDK依赖项（`com.amazonaws:aws-java-sdk-core`），因为身份验证实现将AWS开发工具包类型用于凭证和请求签名。

另请参阅：[Vault文档：使用aws auth后端](https://www.vaultproject.io/docs/auth/aws.html)

## 102.6 Azure MSI身份验证

所述[天青](https://www.vaultproject.io/docs/auth/azure.html) AUTH后端提供了一个安全导入机构为天青VM实例，允许的Vault令牌自动检索。与大多数Vault身份验证后端不同，此后端不需要先部署或设置安全敏感的凭据（令牌，用户名/密码，客户端证书等）。而是将Azure视为受信任的第三方，并使用可以绑定到VM实例的托管服务身份和实例元数据信息。



**示例102.13 bootstrap.yml具有必需的Azure身份验证属性**

```
spring.cloud.vault:
    authentication: AZURE_MSI
    azure-msi:
        role: my-dev-role
```





**示例102.14 具有所有Azure身份验证属性的bootstrap.yml**

```
spring.cloud.vault:
    authentication: AZURE_MSI
    azure-msi:
        role: my-dev-role
        azure-path: azure
```



- `role`设置尝试进行登录的角色的名称。
- `azure-path`设置要使用的Azure装载的路径

Azure MSI身份验证从实例元数据服务中获取有关虚拟机的环境详细信息（订阅ID，资源组，VM名称）。

另请参阅：[Vault文档：使用azure auth后端](https://www.vaultproject.io/docs/auth/azure.html)

## 102.7 TLS证书认证

`cert`身份验证后端允许使用由CA签名或自签名的SSL / TLS客户端证书进行身份验证。

要启用`cert`身份验证，您需要：

1. 使用SSL，请参见[第108章，*Vault客户端SSL配置*](https://www.springcloud.cc/spring-cloud-greenwich.html#vault.config.ssl)
2. 配置包含客户端证书和私钥的Java `Keystore`
3. 将`spring.cloud.vault.authentication`设置为`CERT`



**示例102.15 bootstrap.yml**

```
spring.cloud.vault:
    authentication: CERT
    ssl:
        key-store: classpath:keystore.jks
        key-store-password: changeit
        cert-auth-path: cert
```



另请参阅：[Vault文档：使用Cert auth后端](https://www.vaultproject.io/docs/auth/cert.html)

## 102.8 Cubbyhole身份验证

Cubbyhole身份验证使用Vault原语来提供安全的身份验证工作流。Cubbyhole身份验证使用令牌作为主要登录方法。临时令牌用于从Vault的Cubbyhole秘密后端获取第二个登录VaultToken。登录令牌通常寿命更长，并且可以与Vault进行交互。登录令牌将从存储在`/cubbyhole/response`的包装响应中检索。

**创建包装的令牌**

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 用于令牌创建的响应包装要求Vault 0.6.0或更高。                |



**示例102.16 创建和存储令牌**

```
$ vault token-create -wrap-ttl="10m"
Key                            Value
---                            -----
wrapping_token:                397ccb93-ff6c-b17b-9389-380b01ca2645
wrapping_token_ttl:            0h10m0s
wrapping_token_creation_time:  2016-09-18 20:29:48.652957077 +0200 CEST
wrapped_accessor:              46b6aebb-187f-932a-26d7-4f3d86a68319
```





**示例102.17 bootstrap.yml**

```
spring.cloud.vault:
    authentication: CUBBYHOLE
    token: 397ccb93-ff6c-b17b-9389-380b01ca2645
```



也可以看看：

- [Vault文档：令牌](https://www.vaultproject.io/docs/concepts/tokens.html)
- [Vault文档：Cubbyhole秘密后端](https://www.vaultproject.io/docs/secrets/cubbyhole/index.html)
- [Vault文档：响应包装](https://www.vaultproject.io/docs/concepts/response-wrapping.html)

## 102.9 GCP-GCE认证

该[GCP](https://www.vaultproject.io/docs/auth/gcp.html) AUTH后端允许Vault通过使用现有的GCP（谷歌云端平台）IAM和GCE凭证登录。

GCP GCE（Google Compute引擎）身份验证为服务帐户创建JSON Web令牌（JWT）形式的签名。使用[实例标识](https://cloud.google.com/compute/docs/instances/verifying-instance-identity)从GCE元数据服务获得Compute Engine实例的JWT 。该API创建一个JSON Web令牌，可用于确认实例身份。

与大多数Vault身份验证后端不同，此后端不需要先部署或设置安全敏感的凭据（令牌，用户名/密码，客户端证书等）。相反，它将GCP视为受信任的第三方，并使用经过加密签名的动态元数据信息来唯一表示每个GCP服务帐户。



**示例102.18 bootstrap.yml具有必需的GCP-GCE身份验证属性**

```
spring.cloud.vault:
    authentication: GCP_GCE
    gcp-gce:
        role: my-dev-role
```





**示例102.19 具有所有GCP-GCE身份验证属性的bootstrap.yml**

```
spring.cloud.vault:
    authentication: GCP_GCE
    gcp-gce:
        gcp-path: gcp
        role: my-dev-role
        service-account: my-service@projectid.iam.gserviceaccount.com
```



- `role`设置尝试进行登录的角色的名称。
- `gcp-path`设置要使用的GCP安装架的路径
- `service-account`允许将服务帐户ID覆盖为特定值。默认为`default`服务帐户。

也可以看看：

- [Vault文档：使用GCP身份验证后端](https://www.vaultproject.io/docs/auth/gcp.html)
- [GCP文档：验证实例的身份](https://cloud.google.com/compute/docs/instances/verifying-instance-identity)

## 102.10 GCP-IAM身份验证

该[GCP](https://www.vaultproject.io/docs/auth/gcp.html) AUTH后端允许Vault通过使用现有的GCP（谷歌云端平台）IAM和GCE凭证登录。

GCP IAM身份验证为服务帐户创建JSON Web令牌（JWT）形式的签名。通过调用GCP IAM的[`projects.serviceAccounts.signJwt`](https://cloud.google.com/iam/reference/rest/v1/projects.serviceAccounts/signJwt)API 获得服务帐户的JWT 。呼叫者针对GCP IAM进行身份验证，从而证明其身份。此Vault后端将GCP视为受信任的第三方。

IAM凭证可以从运行时环境（特别是[`GOOGLE_APPLICATION_CREDENTIALS`](https://cloud.google.com/docs/authentication/production) 环境变量），Google Compute元数据服务获得，也可以从外部以JSON或base64编码的形式提供。JSON是首选格式，因为它带有调用`projects.serviceAccounts.signJwt`所需的项目ID和服务帐户标识符。



**示例102.20 bootstrap.yml具有必需的GCP-IAM身份验证属性**

```
spring.cloud.vault:
    authentication: GCP_IAM
    gcp-iam:
        role: my-dev-role
```





**示例102.21。具有所有GCP-IAM身份验证属性的bootstrap.yml**

```
spring.cloud.vault:
    authentication: GCP_IAM
    gcp-iam:
        credentials:
            location: classpath:credentials.json
            encoded-key: e+KApn0=
        gcp-path: gcp
        jwt-validity: 15m
        project-id: my-project-id
        role: my-dev-role
        service-account-id: my-service@projectid.iam.gserviceaccount.com
```



- `role`设置尝试进行登录的角色的名称。
- `credentials.location`包含JSON格式的Google凭据的凭据资源的路径。
- `credentials.encoded-key` JSON格式的OAuth2帐户私钥的base64编码内容。
- `gcp-path`设置要使用的GCP安装架的路径
- `jwt-validity`配置JWT令牌有效性。默认为15分钟。
- `project-id`允许将项目ID覆盖为特定值。从获得的凭据中默认为项目ID。
- `service-account`允许将服务帐户ID覆盖为特定值。默认为获取的凭证中的服务帐户。

GCP IAM身份验证需要Google Cloud Java SDK依赖项（`com.google.apis:google-api-services-iam`和`com.google.auth:google-auth-library-oauth2-http`），因为身份验证实现使用Google API进行凭据和JWT签名。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| Google凭据需要OAuth 2令牌来维护令牌的生命周期。所有API都是同步的，因此`GcpIamAuthentication`不支持`AuthenticationSteps`，这是无功使用所必需的。 |

也可以看看：

- [Vault文档：使用GCP身份验证后端](https://www.vaultproject.io/docs/auth/gcp.html)
- [GCP文档：projects.serviceAccounts.signJwt](https://cloud.google.com/iam/reference/rest/v1/projects.serviceAccounts/signJwt)

## 102.11 Kubernetes身份验证

Kubernetes身份验证机制（自Vault 0.8.3起）允许使用Kubernetes服务帐户令牌向Vault进行身份验证。身份验证基于角色，并且角色绑定到服务帐户名称和名称空间。

包含Pod服务帐户的JWT令牌的文件会自动安装在`/var/run/secrets/kubernetes.io/serviceaccount/token`中。



**示例102.22 具有所有Kubernetes身份验证属性的bootstrap.yml**

```
spring.cloud.vault:
    authentication: KUBERNETES
    kubernetes:
        role: my-dev-role
        kubernetes-path: kubernetes
        service-account-token-file: /var/run/secrets/kubernetes.io/serviceaccount/token
```



- `role`设置角色。
- `kubernetes-path`设置要使用的Kubernetes安装路径。
- `service-account-token-file`设置包含Kubernetes服务帐户令牌的文件的位置。默认为`/var/run/secrets/kubernetes.io/serviceaccount/token`。

也可以看看：

- [Vault文档：Kubernetes](https://www.vaultproject.io/docs/auth/kubernetes.html)
- [Kubernetes文档：为Pod配置服务帐户](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)

## 103.秘密后端

## 103.1通用后端

Spring Cloud Vault在基本级别上支持通用秘密后端。通用机密后端允许将任意值存储为键值存储。单个上下文可以存储一个或多个键值元组。上下文可以按层次进行组织。Spring Cloud Vault允许将应用程序名称和默认上下文名称（`application`）与活动配置文件结合使用。

```
/secret/{application}/{profile}
/secret/{application}
/secret/{default-context}/{profile}
/secret/{default-context}
```

应用程序名称由以下属性确定：

- `spring.cloud.vault.generic.application-name`
- `spring.cloud.vault.application-name`
- `spring.application.name`

可以通过在通用后端中的其他上下文中获取秘密，方法是将其路径添加到应用程序名称中，并用逗号分隔。例如，给定应用程序名称`usefulapp,mysql1,projectx/aws`，将使用以下每个文件夹：

- `/secret/usefulapp`
- `/secret/mysql1`
- `/secret/projectx/aws`

Spring Cloud Vault将所有活动配置文件添加到可能的上下文路径列表中。没有活动的配置文件将跳过使用配置文件名称的访问上下文。

Properties就像存储时一样暴露（即没有其他前缀）。

```
spring.cloud.vault:
    generic:
        enabled: true
        backend: secret
        profile-separator: '/'
        default-context: application
        application-name: my-app
```

- `enabled`将此值设置为`false`会禁用秘密后端配置使用
- `backend`设置要使用的秘密装载的路径
- `default-context`设置所有应用程序使用的上下文名称
- `application-name`覆盖在通用后端中使用的应用程序名称
- `profile-separator`在带有配置文件的属性源中将配置文件名称与上下文分开

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 键值秘密后端可以在版本控制（v2）和非版本控制（v1）模式下运行。根据操作模式，需要不同的API来访问机密。确保为非版本化的键值后端启用`generic`秘密后端使用，并为版本化的键值后端启用`kv`秘密后端使用。 |

另请参阅：[Vault文档：使用KV秘密引擎-版本1（通用秘密后端）](https://www.vaultproject.io/docs/secrets/kv/kv-v1.html)

## 103.2版本化键值后端

Spring Cloud Vault支持版本化的键值机密后端。键值后端允许存储任意值作为键值存储。单个上下文可以存储一个或多个键值元组。上下文可以按层次进行组织。Spring Cloud Vault允许将应用程序名称和默认上下文名称（`application`）与活动配置文件结合使用。

```
/secret/{application}/{profile}
/secret/{application}
/secret/{default-context}/{profile}
/secret/{default-context}
```

应用程序名称由以下属性确定：

- `spring.cloud.vault.kv.application-name`
- `spring.cloud.vault.application-name`
- `spring.application.name`

可以通过在键值后端的其他上下文中获取秘密，方法是将其路径添加到应用程序名称中，并以逗号分隔。例如，给定应用程序名称`usefulapp,mysql1,projectx/aws`，将使用以下每个文件夹：

- `/secret/usefulapp`
- `/secret/mysql1`
- `/secret/projectx/aws`

Spring Cloud Vault将所有活动配置文件添加到可能的上下文路径列表中。没有活动的配置文件将跳过使用配置文件名称的访问上下文。

Properties就像存储时一样暴露（即没有其他前缀）。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| Spring Cloud Vault在安装路径和实际上下文路径之间添加`data/`上下文。 |

```
spring.cloud.vault:
    kv:
        enabled: true
        backend: secret
        profile-separator: '/'
        default-context: application
        application-name: my-app
```

- `enabled`将此值设置为`false`会禁用秘密后端配置使用
- `backend`设置要使用的秘密装载的路径
- `default-context`设置所有应用程序使用的上下文名称
- `application-name`覆盖在通用后端中使用的应用程序名称
- `profile-separator`在带有配置文件的属性源中将配置文件名称与上下文分开

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 键值秘密后端可以在版本控制（v2）和非版本控制（v1）模式下运行。根据操作模式，需要不同的API来访问机密。确保为非版本化的键值后端启用`generic`秘密后端使用，并为版本化的键值后端启用`kv`秘密后端使用。 |

另请参阅：[Vault文档：使用KV Secrets Engine-版本2（版本化的键值后端）](https://www.vaultproject.io/docs/secrets/kv/kv-v2.html)

## 103.3 Consul

Spring Cloud Vault可以获取HashiCorp Consul的凭据。Consul集成需要`spring-cloud-vault-config-consul`依赖性。



**示例103.1 pom.xml**

```
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-vault-config-consul</artifactId>
        <version>{project-version}</version>
    </dependency>
</dependencies>
```



可以通过设置`spring.cloud.vault.consul.enabled=true`（默认值为`false`）并为角色名称提供`spring.cloud.vault.consul.role=…`来启用集成。

获得的令牌存储在`spring.cloud.consul.token`中，因此使用Spring Cloud Consul可以拾取生成的凭据，而无需进一步配置。您可以通过设置`spring.cloud.vault.consul.token-property`来配置属性名称。

```
spring.cloud.vault:
    consul:
        enabled: true
        role: readonly
        backend: consul
        token-property: spring.cloud.consul.token
```

- `enabled`将此值设置为`true`会启用Consul后端配置用法
- `role`设置Consul角色定义的角色名称
- `backend`设置要使用的Consul安装的路径
- `token-property`设置存储Consul ACL令牌的属性名称

另请参阅：[Vault文档：使用Vault设置Consul](https://www.vaultproject.io/docs/secrets/consul/index.html)

## 103.4 RabbitMQ

Spring Cloud Vault可以获取RabbitMQ的凭据。

RabbitMQ集成需要`spring-cloud-vault-config-rabbitmq`依赖性。



**示例103.2 pom.xml**

```
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-vault-config-rabbitmq</artifactId>
        <version>{project-version}</version>
    </dependency>
</dependencies>
```



可以通过设置`spring.cloud.vault.rabbitmq.enabled=true`（默认为`false`）并为角色名称提供`spring.cloud.vault.rabbitmq.role=…`来启用集成。

用户名和密码存储在`spring.rabbitmq.username`和`spring.rabbitmq.password`中，因此使用Spring Boot将无需进一步配置即可获取生成的凭据。您可以通过设置`spring.cloud.vault.rabbitmq.username-property`和`spring.cloud.vault.rabbitmq.password-property`来配置属性名称。

```
spring.cloud.vault:
    rabbitmq:
        enabled: true
        role: readonly
        backend: rabbitmq
        username-property: spring.rabbitmq.username
        password-property: spring.rabbitmq.password
```

- `enabled`将此值设置为`true`可启用RabbitMQ后端配置用法
- `role`设置RabbitMQ角色定义的角色名称
- `backend`设置要使用的RabbitMQ支架的路径
- `username-property`设置存储RabbitMQ用户名的属性名称
- `password-property`设置存储RabbitMQ密码的属性名称

另请参阅：[Vault文档：使用Vault设置RabbitMQ](https://www.vaultproject.io/docs/secrets/rabbitmq/index.html)

## 103.5 AWS

Spring Cloud Vault可以获取AWS的凭证。

AWS集成需要`spring-cloud-vault-config-aws`依赖性。



**示例103.3 pom.xml**

```
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-vault-config-aws</artifactId>
        <version>{project-version}</version>
    </dependency>
</dependencies>
```



可以通过设置`spring.cloud.vault.aws=true`（默认值为`false`）并为角色名称提供`spring.cloud.vault.aws.role=…`来启用集成。

访问密钥和秘密密钥存储在`cloud.aws.credentials.accessKey`和`cloud.aws.credentials.secretKey`中，因此使用Spring Cloud AWS将无需进一步配置即可获取生成的凭证。您可以通过设置`spring.cloud.vault.aws.access-key-property`和`spring.cloud.vault.aws.secret-key-property`来配置属性名称。

```
spring.cloud.vault:
    aws:
        enabled: true
        role: readonly
        backend: aws
        access-key-property: cloud.aws.credentials.accessKey
        secret-key-property: cloud.aws.credentials.secretKey
```

- `enabled`将此值设置为`true`可启用AWS后端配置
- `role`设置AWS角色定义的角色名称
- `backend`设置要使用的AWS装载的路径
- `access-key-property`设置存储AWS访问密钥的属性名称
- `secret-key-property`设置存储AWS密钥的属性名称

另请参阅：[Vault文档：通过Vault设置AWS](https://www.vaultproject.io/docs/secrets/aws/index.html)

## 104.数据库后端

Vault支持多个数据库机密后端，以根据配置的角色动态生成数据库凭证。这意味着需要访问数据库的服务不再需要配置凭据：它们可以从Vault请求它们，并使用Vault的租赁机制更轻松地滚动密钥。

Spring Cloud Vault与以下后端集成：

- [第104.1节“数据库”](https://www.springcloud.cc/spring-cloud-greenwich.html#vault.config.backends.database)
- [第104.2节“ Apache Cassandra”](https://www.springcloud.cc/spring-cloud-greenwich.html#vault.config.backends.cassandra)
- [第104.3节“ MongoDB”](https://www.springcloud.cc/spring-cloud-greenwich.html#vault.config.backends.mongodb)
- [第104.4节“ MySQL”](https://www.springcloud.cc/spring-cloud-greenwich.html#vault.config.backends.mysql)
- [第104.5节“ PostgreSQL”](https://www.springcloud.cc/spring-cloud-greenwich.html#vault.config.backends.postgresql)

使用数据库秘密后端需要启用配置中的后端和`spring-cloud-vault-config-databases`依赖性。

Vault自0.7.1起发布，带有专用的`database`秘密后端，该后端允许通过插件集成数据库。您可以通过使用通用数据库后端来使用该特定后端。确保指定适当的后端路径，例如`spring.cloud.vault.mysql.role.backend=database`。



**示例104.1 pom.xml**

```
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-vault-config-databases</artifactId>
        <version>{project-version}</version>
    </dependency>
</dependencies>
```



| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 启用多个JDBC兼容数据库将默认生成凭据并将其存储在相同的属性密钥中，因此JDBC机密的属性名称需要单独配置。 |

## 104.1数据库

Spring Cloud Vault可以获取[https://www.vaultproject.io/api/secret/databases/index.html上](https://www.vaultproject.io/api/secret/databases/index.html)列出的任何数据库的凭据 。可以通过设置`spring.cloud.vault.database.enabled=true`（默认为`false`）并为角色名称提供`spring.cloud.vault.database.role=…`来启用集成。

虽然数据库后端是通用后端，但`spring.cloud.vault.database`专门针对JDBC数据库。用户名和密码存储在`spring.datasource.username`和`spring.datasource.password`中，因此使用Spring Boot将为`DataSource`获取生成的凭据，而无需进一步配置。您可以通过设置`spring.cloud.vault.database.username-property`和`spring.cloud.vault.database.password-property`来配置属性名称。

```
spring.cloud.vault:
    database:
        enabled: true
        role: readonly
        backend: database
        username-property: spring.datasource.username
        password-property: spring.datasource.password
```

- `enabled`将此值设置为`true`可启用数据库后端配置使用
- `role`设置数据库角色定义的角色名称
- `backend`设置要使用的数据库安装路径
- `username-property`设置存储数据库用户名的属性名称
- `password-property`设置存储数据库密码的属性名称

另请参阅：[Vault文档：数据库秘密后端](https://www.vaultproject.io/docs/secrets/databases/index.html)

| ![[警告]](/assets/images/springcloud/warning.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 当达到最大租用时间时，Spring Cloud Vault不支持获取新凭据并使用它们配置`DataSource`。也就是说，如果将Vault中“数据库”角色的`max_ttl`设置为`24h`，则意味着在应用程序启动后24小时，它将无法再通过数据库进行身份验证。 |

## 104.2 Apache Cassandra

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| `cassandra`后端在Vault 0.7.1中已弃用，建议使用`database`后端并将其安装为`cassandra`。 |

Spring Cloud Vault可以获取Apache Cassandra的凭据。可以通过设置`spring.cloud.vault.cassandra.enabled=true`（默认为`false`）并为角色名称提供`spring.cloud.vault.cassandra.role=…`来启用集成。

用户名和密码存储在`spring.data.cassandra.username`和`spring.data.cassandra.password`中，因此使用Spring Boot将无需进一步配置即可获取生成的凭据。您可以通过设置`spring.cloud.vault.cassandra.username-property`和`spring.cloud.vault.cassandra.password-property`来配置属性名称。

```
spring.cloud.vault:
    cassandra:
        enabled: true
        role: readonly
        backend: cassandra
        username-property: spring.data.cassandra.username
        password-property: spring.data.cassandra.password
```

- `enabled`将此值设置为`true`可启用Cassandra后端配置用法
- `role`设置Cassandra角色定义的角色名称
- `backend`设置要使用的Cassandra支架的路径
- `username-property`设置存储Cassandra用户名的属性名称
- `password-property`设置存储Cassandra密码的属性名称

另请参阅：[Vault文档：使用Vault设置Apache Cassandra](https://www.vaultproject.io/docs/secrets/cassandra/index.html)

## 104.3 MongoDB

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| `mongodb`后端在Vault 0.7.1中已弃用，建议使用`database`后端并将其安装为`mongodb`。 |

Spring Cloud Vault可以获取MongoDB的凭据。可以通过设置`spring.cloud.vault.mongodb.enabled=true`（默认值为`false`）并为角色名称提供`spring.cloud.vault.mongodb.role=…`来启用集成。

用户名和密码存储在`spring.data.mongodb.username`和`spring.data.mongodb.password`中，因此使用Spring Boot将无需进一步配置即可获取生成的凭据。您可以通过设置`spring.cloud.vault.mongodb.username-property`和`spring.cloud.vault.mongodb.password-property`来配置属性名称。

```
spring.cloud.vault:
    mongodb:
        enabled: true
        role: readonly
        backend: mongodb
        username-property: spring.data.mongodb.username
        password-property: spring.data.mongodb.password
```

- `enabled`将此值设置为`true`启用MongodB后端配置使用
- `role`设置MongoDB角色定义的角色名称
- `backend`设置要使用的MongoDB安装的路径
- `username-property`设置存储MongoDB用户名的属性名称
- `password-property`设置存储MongoDB密码的属性名称

另请参阅：[Vault文档：使用Vault设置MongoDB](https://www.vaultproject.io/docs/secrets/mongodb/index.html)

## 104.4 MySQL

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| `mysql`后端在Vault 0.7.1中已弃用，建议使用`database`后端并将其安装为`mysql`。`spring.cloud.vault.mysql`的配置将在以后的版本中删除。 |

Spring Cloud Vault可以获取MySQL的凭据。可以通过设置`spring.cloud.vault.mysql.enabled=true`（默认值为`false`）并为角色名称提供`spring.cloud.vault.mysql.role=…`来启用集成。

用户名和密码存储在`spring.datasource.username`和`spring.datasource.password`中，因此使用Spring Boot将无需进一步配置即可获取生成的凭据。您可以通过设置`spring.cloud.vault.mysql.username-property`和`spring.cloud.vault.mysql.password-property`来配置属性名称。

```
spring.cloud.vault:
    mysql:
        enabled: true
        role: readonly
        backend: mysql
        username-property: spring.datasource.username
        password-property: spring.datasource.password
```

- `enabled`将此值设置为`true`可启用MySQL后端配置
- `role`设置MySQL角色定义的角色名称
- `backend`设置要使用的MySQL挂载路径
- `username-property`设置存储MySQL用户名的属性名称
- `password-property`设置存储MySQL密码的属性名称

另请参阅：[Vault文档：使用Vault设置MySQL](https://www.vaultproject.io/docs/secrets/mysql/index.html)

## 104.5 PostgreSQL

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| `postgresql`后端在Vault 0.7.1中已弃用，建议使用`database`后端并将其安装为`postgresql`。`spring.cloud.vault.postgresql`的配置将在以后的版本中删除。 |

Spring Cloud Vault可以获取PostgreSQL的凭据。可以通过设置`spring.cloud.vault.postgresql.enabled=true`（默认值为`false`）并为角色名称提供`spring.cloud.vault.postgresql.role=…`来启用集成。

用户名和密码存储在`spring.datasource.username`和`spring.datasource.password`中，因此使用Spring Boot将无需进一步配置即可获取生成的凭据。您可以通过设置`spring.cloud.vault.postgresql.username-property`和`spring.cloud.vault.postgresql.password-property`来配置属性名称。

```
spring.cloud.vault:
    postgresql:
        enabled: true
        role: readonly
        backend: postgresql
        username-property: spring.datasource.username
        password-property: spring.datasource.password
```

- `enabled`将此值设置为`true`可以启用PostgreSQL后端配置
- `role`设置PostgreSQL角色定义的角色名称
- `backend`设置要使用的PostgreSQL安装路径
- `username-property`设置存储PostgreSQL用户名的属性名称
- `password-property`设置存储PostgreSQL密码的属性名称

另请参阅：[Vault文档：使用Vault设置PostgreSQL](https://www.vaultproject.io/docs/secrets/postgresql/index.html)

## 105.配置`PropertySourceLocator`行为

Spring Cloud Vault使用基于属性的配置为通用和发现的秘密后端创建`PropertySource`。

发现的后端提供`VaultSecretBackendDescriptor` beans来描述将机密后端用作`PropertySource`的配置状态。要创建包含路径，名称和属性转换配置的`SecretBackendMetadata`对象，需要使用`SecretBackendMetadataFactory`。

`SecretBackendMetadata`用于支持特定的`PropertySource`。

您可以注册任意数量的beans实现`VaultConfigurer`进行自定义。如果Spring Cloud Vault发现至少一个`VaultConfigurer` bean，则会禁用默认的通用和发现的后端注册。但是，您可以使用`SecretBackendConfigurer.registerDefaultGenericSecretBackends()`和`SecretBackendConfigurer.registerDefaultDiscoveredSecretBackends()`启用默认注册。

```
public class CustomizationBean implements VaultConfigurer {

    @Override
    public void addSecretBackends(SecretBackendConfigurer configurer) {

        configurer.add("secret/my-application");

        configurer.registerDefaultGenericSecretBackends(false);
        configurer.registerDefaultDiscoveredSecretBackends(true);
    }
}
```

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 所有定制都必须在引导上下文中进行。将配置类添加到应用程序中`org.springframework.cloud.bootstrap.BootstrapConfiguration`的`META-INF/spring.factories`中。 |

## 106.服务注册表配置

您可以通过设置spring.cloud.vault.discovery.enabled = true（默认值为`false`），使用`DiscoveryClient`（例如来自Spring Cloud Consul的服务器）来定位Vault服务器。最终结果是您的应用程序需要带有适当发现配置的bootstrap.yml（或环境变量）。好处是Vault可以更改其坐标，只要发现服务是固定点即可。默认服务ID为`vault`，但是您可以使用`spring.cloud.vault.discovery.serviceId`在客户端上更改它。

发现客户端实现均支持某种元数据映射（例如，对于Eureka，我们拥有eureka.instance.metadataMap）。服务的某些其他属性可能需要在其服务注册元数据中进行配置，以便客户端可以正确连接。不提供有关传输层安全性详细信息的服务注册中心需要提供`scheme`元数据条目，以将其设置为`https`或`http`。如果未配置任何方案，并且该服务未作为安全服务公开，则配置默认为`spring.cloud.vault.scheme`，而未设置时为`https`。

```
spring.cloud.vault.discovery:
    enabled: true
    service-id: my-vault-service
```

## 107. Vault客户端快速失败

在某些情况下，如果服务无法连接到Vault服务器，则可能无法启动服务。如果这是所需的行为，请设置引导程序配置属性`spring.cloud.vault.fail-fast=true`，客户端将因异常而停止。

```
spring.cloud.vault:
    fail-fast: true
```

## 108. Vault客户端SSL配置

可以通过设置各种属性来声明性地配置SSL。您可以设置`javax.net.ssl.trustStore`来配置JVM范围的SSL设置，或者设置`spring.cloud.vault.ssl.trust-store`来仅为Spring Cloud Vault Config设置SSL设置。

```
spring.cloud.vault:
    ssl:
        trust-store: classpath:keystore.jks
        trust-store-password: changeit
```

- `trust-store`设置信任库的资源。受SSL保护的Vault通信将使用指定的信任库验证Vault SSL证书。
- `trust-store-password`设置信任库密码

请注意，仅当Apache Http Components或OkHttp客户端位于类路径上时，才能应用配置`spring.cloud.vault.ssl.*`。

## 109.租赁生命周期管理（续订和撤销）

对于每个秘密，Vault都会创建一个租约：元数据，其中包含诸如持续时间，可更新性等信息。

Vault承诺数据将在给定的持续时间内或生存时间（TTL）下有效。租约到期后，Vault可以撤消数据，并且秘密使用者无法再确定其是否有效。

Spring Cloud Vault除了创建登录令牌和机密外，还保持租赁生命周期。就是说，与租约关联的登录令牌和机密计划在租约到期之前直到终端到期之前进行更新。应用程序关闭会撤消获得的登录令牌和可更新的租约。

秘密服务和数据库后端（例如MongoDB或MySQL）通常会生成可更新的租约，因此在应用程序关闭时将禁用生成的凭据。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 静态令牌不会更新或吊销。                                     |

默认情况下，租约续订和吊销是启用的，可以通过将`spring.cloud.vault.config.lifecycle.enabled`设置为`false`来禁用。不建议使用此方法，因为租约可能到期，并且Spring Cloud Vault无法再访问Vault或使用生成的凭据的服务，并且在应用程序关闭后有效凭据仍处于活动状态。

```
spring.cloud.vault:
    config.lifecycle.enabled: true
```

另请参阅：[Vault文档：租赁，续订和吊销](https://www.vaultproject.io/docs/concepts/lease.html)

# 第十五部分。Spring Cloud Gateway

**Greenwich SR5**

该项目提供了一个基于Spring生态系统的API网关，其中包括：Spring 5，Spring Boot 2和项目Reactor。Spring Cloud网关的目的是提供一种简单而有效的方法来路由到API，并向它们提供跨领域的关注，例如：安全性，监视/度量和弹性。

## 110.如何包括Spring Cloud网关

要将Spring Cloud网关包含在项目中，请将该启动器与组`org.springframework.cloud`和工件ID `spring-cloud-starter-gateway`一起使用。有关 使用当前Spring Cloud版本Train设置构建系统的详细信息，请参见[Spring Cloud项目页面](https://projects.spring.io/spring-cloud/)。

如果包括启动器，但由于某种原因，您不希望启用网关，请设置`spring.cloud.gateway.enabled=false`。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| Spring Cloud网关基于[Spring Boot 2.x](https://spring.io/projects/spring-boot#learn)， [Spring WebFlux](https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html)和[项目Reactor ](https://projectreactor.io/docs)[构建](https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html)。因此，使用Spring Cloud网关时，许多熟悉的同步库（例如，Spring Data和Spring Security）和模式可能不适用。如果您不熟悉这些项目，建议您在使用Spring Cloud Gateway之前，先阅读它们的文档以熟悉一些新概念。 |      |

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| Spring Cloud网关需要Spring Boot和Spring Webflux提供的Netty运行时。它不能在传统的Servlet容器中或作为WAR构建。 |      |

## 111.词汇表

- **路由**：路由网关的基本构建块。它由ID，目标URI，谓词集合和过滤器集合定义。如果聚合谓词为true，则匹配路由。
- **断言**：这是[ Java 8 Function Predicate](https://docs.oracle.com/javase/8/docs/api/java/util/function/Predicate.html)。输入类型为[ Spring Framework `ServerWebExchange`](https://docs.spring.io/spring/docs/5.0.x/javadoc-api/org/springframework/web/server/ServerWebExchange.html)。这使开发人员可以匹配HTTP请求中的任何内容，例如标头或参数。
- **过滤器**：这些是使用特定工厂构造的实例[ Spring Framework `GatewayFilter`](https://docs.spring.io/spring/docs/5.0.x/javadoc-api/org/springframework/web/server/GatewayFilter.html)。在此，可以在发送下游请求之前或之后修改请求和响应。

## 112.工作原理

![Spring Cloud网关图](/assets/images/springcloud/spring_cloud_gateway_diagram.png?lastModify=1665880539)

客户端向Spring Cloud网关发出请求。如果网关处理程序映射确定请求与路由匹配，则将其发送到网关Web处理程序。该处理程序运行通过特定于请求的筛选器链发送请求。筛选器由虚线分隔的原因是，筛选器可以在发送代理请求之前或之后执行逻辑。执行所有“前置”过滤器逻辑，然后发出代理请求。发出代理请求后，将执行“后”过滤器逻辑。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 在没有端口的路由中定义的URI将分别将HTTP和HTTPS URI的默认端口分别设置为80和443。 |

## 113.配置路由谓词工厂和网关过滤工厂

有两种配置谓词和过滤器的方法：快捷方式和完全扩展的参数。下面的大多数示例都使用快捷方式。

名称和自变量名称将在第一部分或每部分的两个部分中以`code`的形式列出。参数通常按快捷方式配置所需的顺序列出。

## 113.1快捷方式配置

快捷方式配置由过滤器名称识别，后跟等号（`=`），后跟由逗号分隔的参数值（`,`）。

**application.yml。** 

```yaml
spring:
  cloud:
    gateway:
      routes:
      - id: after_route
        uri: https://example.org
        predicates:
        - Cookie=mycookie,mycookievalue
```



先前的示例使用两个参数定义了`Cookie` Route Predicate Factory，即cookie名称`mycookie`和与`mycookievalue`相匹配的值。

## 113.2完全展开的参数

完全扩展的参数看起来更像带有名称/值对的标准Yaml配置。通常，将有一个`name`键和一个`args`键。`args`键是用于配置谓词或过滤器的键值对的映射。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: after_route
        uri: https://example.org
        predicates:
        - name: Cookie
          args:
            name: mycookie
            regexp: mycookievalue
```



这是上面显示的`Cookie`谓词的快捷方式配置的完整配置。

## 114.路由谓词工厂

Spring Cloud网关将路由匹配为Spring WebFlux `HandlerMapping`基础结构的一部分。Spring Cloud网关包括许多内置的Route Predicate工厂。所有这些谓词都与HTTP请求的不同属性匹配。多个路由谓词工厂可以合并，也可以通过逻辑`and`合并。

## 114.1路由谓词工厂之后

`After`路由谓词工厂采用一个参数，即`datetime`（这是Java `ZonedDateTime`）。该谓词匹配在当前日期时间之后发生的请求。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: after_route
        uri: https://example.org
        predicates:
        - After=2017-01-20T17:42:47.789-07:00[America/Denver]
```



该路线与2017年1月20日17:42山区时间（丹佛）之后的所有请求匹配。

## 114.2路线谓词工厂之前

`Before`路由谓词工厂采用一个参数datetime（它是Java `ZonedDateTime`）。该谓词匹配当前日期时间之前发生的请求。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: before_route
        uri: https://example.org
        predicates:
        - Before=2017-01-20T17:42:47.789-07:00[America/Denver]
```



该路线与2017年1月20日17:42山区时间（丹佛）之前的所有请求匹配。

## 114.3路由谓词工厂之间

`Between`路由谓词工厂采用两个参数`datetime1`和`datetime2`，它们是Java `ZonedDateTime`对象。该谓词匹配在datetime1之后和datetime2之前发生的请求。datetime2参数必须在datetime1之后。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: between_route
        uri: https://example.org
        predicates:
        - Between=2017-01-20T17:42:47.789-07:00[America/Denver], 2017-01-21T17:42:47.789-07:00[America/Denver]
```



该路线与2017年1月20日山区时间（丹佛）之后和2017年1月21日17:42山区时间（丹佛）之后的所有请求匹配。这对于维护时段可能很有用。

## 114.4 Cookie路线谓词工厂

`Cookie` Route Predicate Factory采用两个参数，即cookie `name`和`regexp`（这是Java正则表达式）。该谓词匹配具有给定名称的cookie，并且值匹配正则表达式。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: cookie_route
        uri: https://example.org
        predicates:
        - Cookie=chocolate, ch.p
```



此路由与请求匹配，具有一个名为`chocolate`的cookie，该cookie的值与`ch.p`正则表达式匹配。

## 114.5标头路由谓词工厂

`Header` Route Predicate Factory具有两个参数，标头`name`和`regexp`（这是Java正则表达式）。该谓词与具有给定名称的标头匹配，并且值与正则表达式匹配。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: header_route
        uri: https://example.org
        predicates:
        - Header=X-Request-Id, \d+
```



如果请求具有名为`X-Request-Id`的标头，且其值与`\d+`正则表达式匹配（具有一个或多个数字的值），则此路由匹配。

## 114.6主机路由谓词工厂

`Host` Route Predicate Factory采用一个参数：主机名`patterns`的列表。模式是Ant样式的模式，以`.`作为分隔符。该谓词与匹配模式的`Host`头匹配。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: host_route
        uri: https://example.org
        predicates:
        - Host=**.somehost.org,**.anotherhost.org
```



还支持URI模板变量，例如`{sub}.myhost.org`。

如果请求的`Host`标头的值为`www.somehost.org`或`beta.somehost.org`或`www.anotherhost.org`，则此路由将匹配。

该谓词提取URI模板变量（如上例中定义的`sub`）作为名称和值的映射，并使用在`ServerWebExchangeUtils.URI_TEMPLATE_VARIABLES_ATTRIBUTE`中定义的键将其放置在`ServerWebExchange.getAttributes()`中。这些值可供[GatewayFilter工厂](https://www.springcloud.cc/spring-cloud-greenwich.html#gateway-route-filters)使用。

## 114.7方法路线谓词工厂

`Method`路由谓词工厂采用一个`methods`参数，该参数是一个或多个要匹配的HTTP方法。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: method_route
        uri: https://example.org
        predicates:
        - Method=GET,POST
```



如果请求方法是`GET`或`POST`，则此路由将匹配。

## 114.8路径路线谓词工厂

`Path`路由谓词工厂采用两个参数：Spring `PathMatcher` `patterns`的列表和`matchOptionalTrailingSeparator`的可选标志。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: host_route
        uri: https://example.org
        predicates:
        - Path=/foo/{segment},/bar/{segment}
```



如果请求路径为例如`/foo/1`或`/foo/bar`或`/bar/baz`，则此路由将匹配。

该谓词提取URI模板变量（如以上示例中定义的`segment`）作为名称和值的映射，并使用在`ServerWebExchangeUtils.URI_TEMPLATE_VARIABLES_ATTRIBUTE`中定义的键将其放置在`ServerWebExchange.getAttributes()`中。这些值可供[GatewayFilter工厂](https://www.springcloud.cc/spring-cloud-greenwich.html#gateway-route-filters)使用。

可以使用实用程序方法来简化对这些变量的访问。

```
Map<String, String> uriVariables = ServerWebExchangeUtils.getPathPredicateVariables(exchange);

String segment = uriVariables.get("segment");
```

## 114.9查询路由谓词工厂

`Query` Route Predicate Factory采用两个参数：必需的`param`和可选的`regexp`（这是Java正则表达式）。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: query_route
        uri: https://example.org
        predicates:
        - Query=baz
```



如果请求包含`baz`查询参数，则此路由将匹配。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: query_route
        uri: https://example.org
        predicates:
        - Query=foo, ba.
```



如果请求包含一个`foo`查询参数，其值与`ba.`正则表达式匹配，则此路由将匹配，因此`bar`和`baz`将匹配。

## 114.10 RemoteAddr路由谓词工厂

`RemoteAddr`路由谓词工厂采用`sources`的列表（最小大小1），它是CIDR表示法（IPv4或IPv6）字符串，例如`192.168.0.1/16`（其中`192.168.0.1`是IP地址， `16`是子网掩码）。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: remoteaddr_route
        uri: https://example.org
        predicates:
        - RemoteAddr=192.168.1.1/24
```



如果请求的远程地址为`192.168.1.10`，则此路由将匹配。

## 114.11重量路线谓词工厂

`Weight` Route Predicate Factory接受两个参数`group`和`weight`（一个int）。权重是按组计算的。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: weight_high
        uri: https://weighthigh.org
        predicates:
        - Weight=group1, 8
      - id: weight_low
        uri: https://weightlow.org
        predicates:
        - Weight=group1, 2
```



此路由会将约80％的流量转发到[https://weighthigh.org，](https://weighthigh.org/)并将约20％的流量转发到[https://weighlow.org](https://weighlow.org/)

### 114.11.1修改解析远程地址的方式

默认情况下，RemoteAddr路由谓词工厂使用传入请求中的远程地址。如果Spring Cloud网关位于代理层后面，则此地址可能与实际的客户端IP地址不匹配。

您可以通过设置自定义`RemoteAddressResolver`来自定义解析远程地址的方式。Spring Cloud网关带有一个基于[X-Forwarded-For标头](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For) `XForwardedRemoteAddressResolver`的非默认远程地址解析器。

`XForwardedRemoteAddressResolver`有两个静态构造方法，它们采用不同的安全性方法：

`XForwardedRemoteAddressResolver::trustAll`返回一个`RemoteAddressResolver`，该地址始终使用在`X-Forwarded-For`标头中找到的第一个IP地址。这种方法容易受到欺骗，因为恶意客户端可能会为`X-Forwarded-For`设置一个初始值，该初始值将被解析程序接受。

`XForwardedRemoteAddressResolver::maxTrustedIndex`获取一个索引，该索引与在Spring Cloud网关前面运行的受信任基础结构的数量相关。例如，如果Spring Cloud网关只能通过HAProxy访问，则应使用值1。如果在访问Spring Cloud网关之前需要两跳可信基础结构，则应使用值2。

给定以下标头值：

```
X-Forwarded-For: 0.0.0.1, 0.0.0.2, 0.0.0.3
```

下面的`maxTrustedIndex`值将产生以下远程地址。

| `maxTrustedIndex`        | 结果                                                        |
| ------------------------ | ----------------------------------------------------------- |
| [`Integer.MIN_VALUE`,0]  | (invalid, `IllegalArgumentException` during initialization) |
| 1                        | 0.0.0.3                                                     |
| 2                        | 0.0.0.2                                                     |
| 3                        | 0.0.0.1                                                     |
| [4, `Integer.MAX_VALUE`] | 0.0.0.1                                                     |

使用Java配置：

GatewayConfig.java

```
RemoteAddressResolver resolver = XForwardedRemoteAddressResolver
    .maxTrustedIndex(1);

...

.route("direct-route",
    r -> r.remoteAddr("10.1.1.1", "10.10.1.1/24")
        .uri("https://downstream1")
.route("proxied-route",
    r -> r.remoteAddr(resolver,  "10.10.1.1", "10.10.1.1/24")
        .uri("https://downstream2")
)
```

## 115.网关过滤器工厂

路由过滤器允许以某种方式修改传入的HTTP请求或传出的HTTP响应。路由过滤器适用于特定路由。Spring Cloud网关包括许多内置的GatewayFilter工厂。

注意有关如何使用以下任何过滤器的更多详细示例，请查看[单元测试](https://github.com/spring-cloud/spring-cloud-gateway/tree/master/spring-cloud-gateway-core/src/test/java/org/springframework/cloud/gateway/filter/factory)。

## 115.1 AddRequestHeader GatewayFilter工厂

`AddRequestHeader` GatewayFilter工厂采用`name`和`value`参数。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: add_request_header_route
        uri: https://example.org
        filters:
        - AddRequestHeader=X-Request-Foo, Bar
```



这会将`X-Request-Foo:Bar`标头添加到所有匹配请求的下游请求标头中。

AddRequestHeader知道用于匹配路径或主机的URI变量。URI变量可用于该值，并将在运行时扩展。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: add_request_header_route
        uri: https://example.org
        predicates:
        - Path=/foo/{segment}
        filters:
        - AddRequestHeader=X-Request-Foo, Bar-{segment}
```



## 115.2 AddRequestParameter GatewayFilter工厂

`AddRequestParameter` GatewayFilter工厂采用`name`和`value`参数。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: add_request_parameter_route
        uri: https://example.org
        filters:
        - AddRequestParameter=foo, bar
```



这会将`foo=bar`添加到所有匹配请求的下游请求的查询字符串中。

AddRequestParameter知道用于匹配路径或主机的URI变量。URI变量可用于该值，并将在运行时扩展。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: add_request_parameter_route
        uri: https://example.org
        predicates:
        - Host: {segment}.myhost.org
        filters:
        - AddRequestParameter=foo, bar-{segment}
```



## 115.3 AddResponseHeader GatewayFilter工厂

`AddResponseHeader` GatewayFilter工厂采用`name`和`value`参数。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: add_response_header_route
        uri: https://example.org
        filters:
        - AddResponseHeader=X-Response-Foo, Bar
```



这会将`X-Response-Foo:Bar`标头添加到所有匹配请求的下游响应的标头中。

AddResponseHeader知道用于匹配路径或主机的URI变量。URI变量可用于该值，并将在运行时扩展。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: add_response_header_route
        uri: https://example.org
        predicates:
        - Host: {segment}.myhost.org
        filters:
        - AddResponseHeader=foo, bar-{segment}
```



## 115.4 DedupeResponseHeader GatewayFilter工厂

`DedupeResponseHeader` GatewayFilter工厂采用`name`参数和可选的`strategy`参数。`name`可以包含标题名称列表，以空格分隔。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: dedupe_response_header_route
        uri: https://example.org
        filters:
        - DedupeResponseHeader=Access-Control-Allow-Credentials Access-Control-Allow-Origin
```



在网关CORS逻辑和下游逻辑都将它们添加的情况下，这将删除`Access-Control-Allow-Credentials`和`Access-Control-Allow-Origin`响应头的重复值。

DedupeResponseHeader过滤器还接受可选的`strategy`参数。可接受的值为`RETAIN_FIRST`（默认值），`RETAIN_LAST`和`RETAIN_UNIQUE`。

## 115.5 Hystrix GatewayFilter工厂

[Hystrix](https://github.com/Netflix/Hystrix)是Netflix的一个库，它实现了[断路器模式](https://martinfowler.com/bliki/CircuitBreaker.html)。`Hystrix` GatewayFilter允许您将断路器引入网关路由，保护服务免受级联故障的影响，并允许您在下游故障的情况下提供后备响应。

要在您的项目中启用`Hystrix` GatewayFilters，请添加对[Spring Cloud Netflix中的](https://cloud.spring.io/spring-cloud-netflix/) `spring-cloud-starter-netflix-hystrix`的依赖。

`Hystrix` GatewayFilter工厂需要一个`name`参数，它是`HystrixCommand`的名称。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: hystrix_route
        uri: https://example.org
        filters:
        - Hystrix=myCommandName
```



这会将其余过滤器包装在命令名称为`myCommandName`的`HystrixCommand`中。

Hystrix过滤器还可以接受可选的`fallbackUri`参数。当前，仅支持`forward:`计划的URI。如果调用了后备，则请求将被转发到与URI相匹配的控制器。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: hystrix_route
        uri: lb://backing-service:8088
        predicates:
        - Path=/consumingserviceendpoint
        filters:
        - name: Hystrix
          args:
            name: fallbackcmd
            fallbackUri: forward:/incaseoffailureusethis
        - RewritePath=/consumingserviceendpoint, /backingserviceendpoint
```



调用Hystrix后备广告时，它将转发到`/incaseoffailureusethis` URI。请注意，此示例还通过目标URI上的`lb`前缀演示了（可选）Spring Cloud Netflix Ribbon负载均衡。

主要方案是将`fallbackUri`用于网关应用程序中的内部控制器或处理程序。但是，也可以将请求重新路由到外部应用程序中的控制器或处理程序，如下所示：

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: ingredients
        uri: lb://ingredients
        predicates:
        - Path=//ingredients/**
        filters:
        - name: Hystrix
          args:
            name: fetchIngredients
            fallbackUri: forward:/fallback
      - id: ingredients-fallback
        uri: http://localhost:9994
        predicates:
        - Path=/fallback
```



在此示例中，网关应用程序中没有`fallback`端点或处理程序，但是，另一个应用程序中没有`fallback`端点或处理程序，已在`http://localhost:9994`下注册。

如果将请求转发到后备，则Hystrix网关过滤器还会提供引起请求的`Throwable`。它作为`ServerWebExchangeUtils.HYSTRIX_EXECUTION_EXCEPTION_ATTR`属性添加到`ServerWebExchange`中，可以在网关应用程序中处理后备时使用。

对于外部控制器/处理程序方案，可以添加带有异常详细信息的标头。您可以在[FallbackHeaders GatewayFilter Factory部分中](https://www.springcloud.cc/spring-cloud-greenwich.html#fallback-headers)找到有关它的更多信息。

Hystrix设置（例如超时）可以使用全局默认值进行配置，也可以使用[Hystrix Wiki中](https://github.com/Netflix/Hystrix/wiki/Configuration)所述的应用程序属性在逐条路由的基础上进行配置。

要为上述示例路由设置5秒超时，将使用以下配置：

**application.yml。** 

```
hystrix.command.fallbackcmd.execution.isolation.thread.timeoutInMilliseconds: 5000
```



## 115.6 FallbackHeaders GatewayFilter工厂

`FallbackHeaders`工厂允许您在转发到外部应用程序中的`fallbackUri`的请求的标头中添加Hystrix执行异常详细信息，例如以下情况：

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: ingredients
        uri: lb://ingredients
        predicates:
        - Path=//ingredients/**
        filters:
        - name: Hystrix
          args:
            name: fetchIngredients
            fallbackUri: forward:/fallback
      - id: ingredients-fallback
        uri: http://localhost:9994
        predicates:
        - Path=/fallback
        filters:
        - name: FallbackHeaders
          args:
            executionExceptionTypeHeaderName: Test-Header
```



在此示例中，在运行`HystrixCommand`时发生执行异常之后，该请求将转发到`fallback`端点或运行在`localhost:9994`上的应用程序中的处理程序。具有异常类型，消息和-if available-根本原因异常类型和消息的标头将由`FallbackHeaders`过滤器添加到该请求。

通过设置下面列出的参数的值及其默认值，可以在配置中覆盖标头的名称：

- `executionExceptionTypeHeaderName` (`"Execution-Exception-Type"`)
- `executionExceptionMessageHeaderName` (`"Execution-Exception-Message"`)
- `rootCauseExceptionTypeHeaderName` (`"Root-Cause-Exception-Type"`)
- `rootCauseExceptionMessageHeaderName` (`"Root-Cause-Exception-Message"`)

您可以在[Hystrix GatewayFilter工厂部分中](https://www.springcloud.cc/spring-cloud-greenwich.html#hystrix)找到有关Hystrix与Gateway一起工作的更多信息。

## 115.7 MapRequestHeader GatewayFilter工厂

`MapRequestHeader` GatewayFilter要素采用'fromHeader'和'toHeader'参数。它创建一个新的命名标头（toHeader），并从传入的HTTP请求中从现有的命名标头（fromHeader）中提取值。如果输入标头不存在，则过滤器不起作用。如果新的命名标头已经存在，则将使用新值扩充其值。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: map_request_header_route
        uri: https://example.org
        filters:
        - MapRequestHeader=Bar, X-Request-Foo
```



这会将`X-Request-Foo:<values>`标头添加到下游请求中，并带有来自传入的HTTP请求`Bar`标头的更新值。

## 115.8 PrefixPath GatewayFilter工厂

`PrefixPath` GatewayFilter工厂采用单个`prefix`参数。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: prefixpath_route
        uri: https://example.org
        filters:
        - PrefixPath=/mypath
```



这会将`/mypath`作为所有匹配请求的路径的前缀。因此，对`/hello`的请求将被发送到`/mypath/hello`。

## 115.9 PreserveHostHeader GatewayFilter工厂

`PreserveHostHeader` GatewayFilter工厂没有参数。该过滤器设置请求属性，路由过滤器将检查该请求属性以确定是否应发送原始主机头，而不是由HTTP客户端确定的主机头。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: preserve_host_route
        uri: https://example.org
        filters:
        - PreserveHostHeader
```



## 115.10 RequestRateLimiter GatewayFilter工厂

`RequestRateLimiter` GatewayFilter工厂使用`RateLimiter`实现来确定是否允许继续当前请求。如果不是，则返回状态`HTTP 429 - Too Many Requests`（默认）。

该过滤器采用一个可选的`keyResolver`参数和特定于速率限制器的参数（请参见下文）。

`keyResolver`是实现`KeyResolver`接口的bean。在配置中，使用SpEL通过名称引用bean。`#{@myKeyResolver}`是引用名称为`myKeyResolver`的bean的SpEL表达式。

**KeyResolver.java。** 

```
public interface KeyResolver {
	Mono<String> resolve(ServerWebExchange exchange);
}
```



`KeyResolver`接口允许可插拔策略派生用于限制请求的密钥。在未来的里程碑中，将有一些`KeyResolver`实现。

`KeyResolver`的默认实现是`PrincipalNameKeyResolver`，它从`ServerWebExchange`检索`Principal`并调用`Principal.getName()`。

默认情况下，如果`KeyResolver`未找到密钥，则请求将被拒绝。可以使用`spring.cloud.gateway.filter.request-rate-limiter.deny-empty-key`（对或错）和`spring.cloud.gateway.filter.request-rate-limiter.empty-key-status-code`属性来调整此行为。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 无法通过“快捷方式”符号配置RequestRateLimiter。以下示例*无效* |

**application.properties。** 

```
# INVALID SHORTCUT CONFIGURATION
spring.cloud.gateway.routes[0].filters[0]=RequestRateLimiter=2, 2, #{@userkeyresolver}
```



### 115.10.1 Redis RateLimiter

redis实现基于[Stripe](https://stripe.com/blog/rate-limiters)所做的工作。它需要使用`spring-boot-starter-data-redis-reactive` Spring Boot起动器。

使用的算法是[令牌桶算法](https://en.wikipedia.org/wiki/Token_bucket)。

`redis-rate-limiter.replenishRate`是您希望用户每秒允许多少个请求，而没有任何丢弃的请求。这是令牌桶被填充的速率。

`redis-rate-limiter.burstCapacity`是允许用户在一秒钟内执行的最大请求数。这是令牌桶可以容纳的令牌数。将此值设置为零将阻止所有请求。

通过在`replenishRate`和`burstCapacity`中设置相同的值可以达到稳定的速率。通过将`burstCapacity`设置为高于`replenishRate`，可以允许临时突发。在这种情况下，速率限制器需要在突发之间间隔一段时间（根据`replenishRate`），因为2个连续的突发将导致请求丢失（`HTTP 429 - Too Many Requests`）。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: requestratelimiter_route
        uri: https://example.org
        filters:
        - name: RequestRateLimiter
          args:
            redis-rate-limiter.replenishRate: 10
            redis-rate-limiter.burstCapacity: 20
```



**Config.java。** 

```
@Bean
KeyResolver userKeyResolver() {
    return exchange -> Mono.just(exchange.getRequest().getQueryParams().getFirst("user"));
}
```



这定义了每个用户10的请求速率限制。允许20个突发，但是下一秒只有10个请求可用。`KeyResolver`是一个简单的参数，它获取`user`请求参数（注意：不建议在生产中使用）。

速率限制器也可以定义为实现`RateLimiter`接口的bean。在配置中，使用SpEL通过名称引用bean。`#{@myRateLimiter}`是一个SpEL表达式，引用名称为`myRateLimiter`的bean。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: requestratelimiter_route
        uri: https://example.org
        filters:
        - name: RequestRateLimiter
          args:
            rate-limiter: "#{@myRateLimiter}"
            key-resolver: "#{@userKeyResolver}"
```



## 115.11重定向到GatewayFilter工厂

`RedirectTo` GatewayFilter工厂采用一个`status`和一个`url`参数。状态应该是300系列重定向http代码，例如301。URL应该是有效的URL。这将是`Location`标头的值。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: prefixpath_route
        uri: https://example.org
        filters:
        - RedirectTo=302, https://acme.org
```



这将发送带有`Location:https://acme.org`标头的状态302以执行重定向。

## 115.12 RemoveRequestHeader GatewayFilter工厂

`RemoveRequestHeader` GatewayFilter工厂采用一个`name`参数。它是要删除的标题的名称。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: removerequestheader_route
        uri: https://example.org
        filters:
        - RemoveRequestHeader=X-Request-Foo
```



这将删除`X-Request-Foo`标头，然后将其发送到下游。

## 115.13 RemoveResponseHeader GatewayFilter工厂

`RemoveResponseHeader` GatewayFilter工厂采用一个`name`参数。它是要删除的标题的名称。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: removeresponseheader_route
        uri: https://example.org
        filters:
        - RemoveResponseHeader=X-Response-Foo
```



这会将`X-Response-Foo`标头从响应中删除，然后将其返回到网关客户端。

要删除任何类型的敏感标头，应为可能需要的任何路由配置此过滤器。此外，您可以使用`spring.cloud.gateway.default-filters`一次配置此过滤器，并将其应用于所有路由。

## 115.14 RewritePath GatewayFilter工厂

`RewritePath` GatewayFilter工厂采用路径`regexp`参数和`replacement`参数。这使用Java正则表达式提供了一种灵活的方式来重写请求路径。

**application.yml。** 

```yml
spring:
  cloud:
    gateway:
      routes:
      - id: rewritepath_route
        uri: https://example.org
        predicates:
        - Path=/foo/**
        filters:
        - RewritePath=/foo(?<segment>/?.*), $\{segment}
```



对于`/foo/bar`的请求路径，这将在发出下游请求之前将路径设置为`/bar`。请注意，由于YAML规范，`$\`被`$`所取代。

## 115.15 RewriteLocationResponseHeader GatewayFilter工厂

`RewriteLocationResponseHeader` GatewayFilter工厂通常会修改`Location`响应标头的值，以摆脱后端特定的详细信息。它需要`stripVersionMode`，`locationHeaderName`，`hostValue`和`protocolsRegex`参数。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: rewritelocationresponseheader_route
        uri: http://example.org
        filters:
        - RewriteLocationResponseHeader=AS_IN_REQUEST, Location, ,
```



例如，对于请求`POST https://api.example.com/some/object/name`，`Location`响应标头值`https://object-service.prod.example.net/v2/some/object/id`将被重写为`https://api.example.com/some/object/id`。

参数`stripVersionMode`具有以下可能的值：`NEVER_STRIP`，`AS_IN_REQUEST`（默认），`ALWAYS_STRIP`。

- `NEVER_STRIP`-即使原始请求路径不包含版本，也不会剥离版本
- `AS_IN_REQUEST`-仅当原始请求路径不包含版本时，版本才会被剥离
- `ALWAYS_STRIP`-即使原始请求路径包含版本，也会剥离版本

参数`hostValue`（如果提供）将用于替换响应`Location`标头中的`host:port`部分。如果未提供，将使用`Host`请求标头的值。

参数`protocolsRegex`必须是有效的正则表达式`String`，协议名称将与之匹配。如果不匹配，过滤器将不执行任何操作。默认值为`http|https|ftp|ftps`。

## 115.16 RewriteResponseHeader GatewayFilter工厂

`RewriteResponseHeader` GatewayFilter工厂采用`name`，`regexp`和`replacement`参数。它使用Java正则表达式以灵活的方式重写响应标头值。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: rewriteresponseheader_route
        uri: https://example.org
        filters:
        - RewriteResponseHeader=X-Response-Foo, , password=[^&]+, password=***
```



对于标头值为`/42?user=ford&password=omg!what&flag=true`，在发出下游请求后它将被设置为`/42?user=ford&password=***&flag=true`。由于YAML规范，请使用`$\`来表示`$`。

## 115.17 SaveSession GatewayFilter工厂

*在*向下游转发呼叫*之前*，SaveSession GatewayFilter工厂强制执行`WebSession::save`操作。这在将[Spring Session之类](https://projects.spring.io/spring-session/)的内容用于惰性数据存储并且需要确保在进行转接呼叫之前已保存会话状态时特别有用。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: save_session
        uri: https://example.org
        predicates:
        - Path=/foo/**
        filters:
        - SaveSession
```



如果您将[Spring Security](https://projects.spring.io/spring-security/)与Spring Session 集成在一起，并且想要确保安全性详细信息已转发到远程进程，则至关重要。

## 115.18 SecureHeaders GatewayFilter工厂

`SecureHeaders` GatewayFilter Factory根据[此博客文章](https://blog.appcanary.com/2017/http-security-headers.html)的建议向响应中添加了许多标头。

**添加了以下标头（以及默认值）：**

- `X-Xss-Protection:1; mode=block`
- `Strict-Transport-Security:max-age=631138519`
- `X-Frame-Options:DENY`
- `X-Content-Type-Options:nosniff`
- `Referrer-Policy:no-referrer`
- `Content-Security-Policy:default-src 'self' https:; font-src 'self' https: data:; img-src 'self' https: data:; object-src 'none'; script-src https:; style-src 'self' https: 'unsafe-inline'`
- `X-Download-Options:noopen`
- `X-Permitted-Cross-Domain-Policies:none`

要更改默认值，请在`spring.cloud.gateway.filter.secure-headers`名称空间中设置适当的属性：

**Property进行更改：**

- `xss-protection-header`
- `strict-transport-security`
- `frame-options`
- `content-type-options`
- `referrer-policy`
- `content-security-policy`
- `download-options`
- `permitted-cross-domain-policies`

要禁用默认值，请使用逗号分隔值设置属性`spring.cloud.gateway.filter.secure-headers.disable`。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 需要使用小写和安全标头的全名。                               |

**可以使用以下值：**

- `x-xss-protection`
- `strict-transport-security`
- `x-frame-options`
- `x-content-type-options`
- `referrer-policy`
- `content-security-policy`
- `x-download-options`
- `x-permitted-cross-domain-policies`

**例：** `spring.cloud.gateway.filter.secure-headers.disable=x-frame-options,strict-transport-security`

## 115.19 SetPath GatewayFilter工厂

`SetPath` GatewayFilter工厂采用路径`template`参数。通过允许路径的模板段，它提供了一种操作请求路径的简单方法。这将使用Spring Framework中的uri模板。允许多个匹配段。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: setpath_route
        uri: https://example.org
        predicates:
        - Path=/foo/{segment}
        filters:
        - SetPath=/{segment}
```



对于`/foo/bar`的请求路径，这将在发出下游请求之前将路径设置为`/bar`。

## 115.20 SetRequestHeader GatewayFilter工厂

`SetRequestHeader` GatewayFilter工厂采用`name`和`value`参数。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: setrequestheader_route
        uri: https://example.org
        filters:
        - SetRequestHeader=X-Request-Foo, Bar
```



该GatewayFilter用给定的名称替换所有标头，而不是添加。因此，如果下游服务器响应`X-Request-Foo:1234`，则将其替换为`X-Request-Foo:Bar`，下游服务将收到此信息。

SetRequestHeader知道用于匹配路径或主机的URI变量。URI变量可用于该值，并将在运行时扩展。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: setrequestheader_route
        uri: https://example.org
        predicates:
        - Host: {segment}.myhost.org
        filters:
        - SetRequestHeader=foo, bar-{segment}
```



## 115.21 SetResponseHeader GatewayFilter工厂

`SetResponseHeader` GatewayFilter工厂采用`name`和`value`参数。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: setresponseheader_route
        uri: https://example.org
        filters:
        - SetResponseHeader=X-Response-Foo, Bar
```



该GatewayFilter用给定的名称替换所有标头，而不是添加。因此，如果下游服务器以`X-Response-Foo:1234`响应，则将其替换为`X-Response-Foo:Bar`，这是网关客户端将收到的内容。

SetResponseHeader知道用于匹配路径或主机的URI变量。URI变量可用于该值，并将在运行时扩展。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: setresponseheader_route
        uri: https://example.org
        predicates:
        - Host: {segment}.myhost.org
        filters:
        - SetResponseHeader=foo, bar-{segment}
```



## 115.22 SetStatus GatewayFilter工厂

`SetStatus` GatewayFilter工厂采用单个`status`参数。它必须是有效的Spring `HttpStatus`。它可以是整数值`404`，也可以是枚举`NOT_FOUND`的字符串表示形式。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: setstatusstring_route
        uri: https://example.org
        filters:
        - SetStatus=BAD_REQUEST
      - id: setstatusint_route
        uri: https://example.org
        filters:
        - SetStatus=401
```



无论哪种情况，响应的HTTP状态都将设置为401。

## 115.23 StripPrefix GatewayFilter工厂

StripPrefix GatewayFilter工厂采用一个参数`parts`。`parts`参数指示在向下游发送请求之前，要从请求中剥离的路径中的零件数。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: nameRoot
        uri: http://nameservice
        predicates:
        - Path=/name/**
        filters:
        - StripPrefix=2
```



通过网关发送到`/name/bar/foo`的请求时，对`nameservice`的请求将类似于`http://nameservice/foo`。

## 115.24重试GatewayFilter工厂

`Retry` GatewayFilter Factory支持以下参数集：

- `retries`：应尝试重试的次数
- `statuses`：应重试的HTTP状态代码，用`org.springframework.http.HttpStatus`表示
- `methods`：应重试的HTTP方法，使用`org.springframework.http.HttpMethod`表示
- `series`：要重试的一系列状态代码，使用`org.springframework.http.HttpStatus.Series`表示
- `exceptions`：应重试引发的异常列表
- `backoff`：为重试配置了指数补偿。重试在退避间隔`firstBackoff * (factor ^ n)`之后执行，其中`n`是迭代。如果配置了`maxBackoff`，则应用的最大退避将被限制为`maxBackoff`。如果`basedOnPreviousValue`为true，将使用`prevBackoff * factor`计算退避。

如果启用了`Retry`过滤器，则会配置以下默认值：

- `retries`-3次
- `series` — 5XX系列
- `methods` — GET方法
- `exceptions`-`IOException`和`TimeoutException`
- `backoff`-已禁用

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: retry_test
        uri: http://localhost:8080/flakey
        predicates:
        - Host=*.retry.com
        filters:
        - name: Retry
          args:
            retries: 3
            statuses: BAD_GATEWAY
            methods: GET,POST
            backoff:
              firstBackoff: 10ms
              maxBackoff: 50ms
              factor: 2
              basedOnPreviousValue: false
```



| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 当使用带有`forward:`前缀URL的重试过滤器时，应仔细编写目标端点，以便在发生错误的情况下不会执行任何可能导致响应发送到客户端并提交的操作。例如，如果目标端点是带注释的控制器，则目标控制器方法不应返回带有错误状态代码的`ResponseEntity`。相反，它应该抛出一个`Exception`，或者例如通过一个`Mono.error(ex)`返回值来发出错误信号，可以将重试过滤器配置为通过重试来处理。 |

| ![[警告]](/assets/images/springcloud/warning.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 当将重试过滤器与任何具有主体的HTTP方法一起使用时，主体将被缓存，并且网关将受到内存的限制。正文被缓存在`ServerWebExchangeUtils.CACHED_REQUEST_BODY_ATTR`定义的请求属性中。对象的类型是`org.springframework.core.io.buffer.DataBuffer`。 |

## 115.25 RequestSize GatewayFilter工厂

当请求大小大于允许的限制时，`RequestSize` GatewayFilter工厂可以限制请求到达下游服务。过滤器采用`maxSize`参数，该参数是请求的允许大小限制。`maxSize is a`DataSize`类型，因此值可以定义为数字，后跟可选的`DataUnit`后缀，例如'KB'或'MB'。字节的默认值为“ B”。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: request_size_route
      uri: http://localhost:8080/upload
      predicates:
      - Path=/upload
      filters:
      - name: RequestSize
        args:
          maxSize: 5000000
```



当请求因大小而被拒绝时，RequestSize GatewayFilter Factory将响应状态设置为`413 Payload Too Large`，并带有一个附加报头`errorMessage`。以下是此类`errorMessage`的示例。

```
errorMessage` : `Request size is larger than permissible limit. Request size is 6.0 MB where permissible limit is 5.0 MB
```

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 如果未在路由定义中作为过滤器参数提供，则默认请求大小将设置为5 MB。 |

## 115.26修改请求正文GatewayFilter工厂

**该过滤器被认为是BETA，API将来可能会更改**

`ModifyRequestBody`过滤器可用于在网关向下游发送请求主体之前修改请求主体。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 只能使用Java DSL配置此过滤器                                 |

```
@Bean
public RouteLocator routes(RouteLocatorBuilder builder) {
    return builder.routes()
        .route("rewrite_request_obj", r -> r.host("*.rewriterequestobj.org")
            .filters(f -> f.prefixPath("/httpbin")
                .modifyRequestBody(String.class, Hello.class, MediaType.APPLICATION_JSON_VALUE,
                    (exchange, s) -> return Mono.just(new Hello(s.toUpperCase())))).uri(uri))
        .build();
}

static class Hello {
    String message;

    public Hello() { }

    public Hello(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
```

## 115.27修改响应主体GatewayFilter工厂

**该过滤器被认为是BETA，API将来可能会更改**

`ModifyResponseBody`过滤器可用于在将响应正文发送回客户端之前对其进行修改。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 只能使用Java DSL配置此过滤器                                 |

```
@Bean
public RouteLocator routes(RouteLocatorBuilder builder) {
    return builder.routes()
        .route("rewrite_response_upper", r -> r.host("*.rewriteresponseupper.org")
            .filters(f -> f.prefixPath("/httpbin")
                .modifyResponseBody(String.class, String.class,
                    (exchange, s) -> Mono.just(s.toUpperCase()))).uri(uri)
        .build();
}
```

## 115.28默认过滤器

如果您要添加过滤器并将其应用于所有路由，则可以使用`spring.cloud.gateway.default-filters`。该属性采用过滤器列表

**application.yml。** 

```
spring:
  cloud:
    gateway:
      default-filters:
      - AddResponseHeader=X-Response-Default-Foo, Default-Bar
      - PrefixPath=/httpbin
```



## 116.全局过滤器

`GlobalFilter`接口具有与`GatewayFilter`相同的签名。这些是特殊过滤器，有条件地应用于所有路由。（此接口和用法可能会在将来的里程碑中更改）。

## 116.1组合的全局过滤器和GatewayFilter排序

当有请求进入（并与路由匹配）时，过滤Web处理程序会将`GlobalFilter`的所有实例和`GatewayFilter`的所有特定于路由的实例添加到过滤器链中。该组合的过滤器链通过`org.springframework.core.Ordered`接口排序，可以通过实现`getOrder()`方法进行设置。

由于Spring Cloud网关区分执行过滤器逻辑的“前”阶段和“后”阶段（请参阅：[工作原理](https://www.springcloud.cc/spring-cloud-greenwich.html#gateway-how-it-works)），因此，具有最高优先级的过滤器将在“前”阶段中处于第一个阶段，在“阶段”中处于最后一个阶段。 “后期”阶段。

**ExampleConfiguration.java。** 

```java
@Bean
public GlobalFilter customFilter() {
    return new CustomGlobalFilter();
}

public class CustomGlobalFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        log.info("custom global filter");
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
```



## 116.2转发路由过滤器

`ForwardRoutingFilter`在交换属性`ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR`中寻找URI。如果该网址具有`forward`方案（即`forward:///localendpoint`），它将使用Spring `DispatcherHandler`处理请求。请求URL的路径部分将被转发URL中的路径覆盖。未经修改的原始URL会附加到`ServerWebExchangeUtils.GATEWAY_ORIGINAL_REQUEST_URL_ATTR`属性中的列表中。

## 116.3 LoadBalancerClient筛选器

`LoadBalancerClientFilter`在交换属性`ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR`中寻找URI。如果该网址具有`lb`方案（即`lb://myservice`），它将使用Spring Cloud `LoadBalancerClient`将名称（上例中为`myservice`）解析为实际的主机和端口并替换相同属性中的URI。未经修改的原始URL会附加到`ServerWebExchangeUtils.GATEWAY_ORIGINAL_REQUEST_URL_ATTR`属性中的列表中。过滤器还将查看`ServerWebExchangeUtils.GATEWAY_SCHEME_PREFIX_ATTR`属性，以查看其是否等于`lb`，然后应用相同的规则。

**application.yml。** 

```yml
spring:
  cloud:
    gateway:
      routes:
      - id: myRoute
        uri: lb://service
        predicates:
        - Path=/service/**
```



| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 默认情况下，当在`LoadBalancer`中找不到服务实例时，将返回`503`。您可以通过设置`spring.cloud.gateway.loadbalancer.use404=true`来配置网关以返回`404`。 |

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 从`LoadBalancer`返回的`ServiceInstance`的`isSecure`值将覆盖对网关的请求中指定的方案。例如，如果请求通过`HTTPS`进入网关，但`ServiceInstance`表示它不安全，则下游请求将通过`HTTP`发出。相反的情况也可以适用。但是，如果在网关配置中为路由指定了`GATEWAY_SCHEME_PREFIX_ATTR`，则前缀将被删除，并且来自路由URL的结果方案将覆盖`ServiceInstance`配置。 |

| ![[警告]](/assets/images/springcloud/warning.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| `LoadBalancerClientFilter`在引擎盖下使用阻挡物Ribbon `LoadBalancerClient`。我们建议您改用[`ReactiveLoadBalancerClientFilter`](https://www.springcloud.cc/spring-cloud-greenwich.html#reactive-loadbalancer-client-filter)。您可以通过向项目添加`org.springframework.cloud:spring-cloud-loadbalancer`依赖项并将`spring.cloud.loadbalancer.ribbon.enabled`的值设置为`false`来切换为使用它。 |

## 116.4 ReactiveLoadBalancerClientFilter

`ReactiveLoadBalancerClientFilter`在交换属性`ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR`中寻找URI。如果该网址具有`lb`方案（即`lb://myservice`），它将使用Spring Cloud `ReactorLoadBalancer`将名称（上例中为`myservice`）解析为实际的主机和端口并替换相同属性中的URI。未经修改的原始URL会附加到`ServerWebExchangeUtils.GATEWAY_ORIGINAL_REQUEST_URL_ATTR`属性中的列表中。过滤器还将查看`ServerWebExchangeUtils.GATEWAY_SCHEME_PREFIX_ATTR`属性，以查看其是否等于`lb`，然后应用相同的规则。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: myRoute
        uri: lb://service
        predicates:
        - Path=/service/**
```



| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 默认情况下，当`ReactorLoadBalancer`无法找到服务实例时，将返回`503`。您可以通过设置`spring.cloud.gateway.loadbalancer.use404=true`将网关配置为返回`404`。 |

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 从`ReactiveLoadBalancerClientFilter`返回的`ServiceInstance`的`isSecure`值将覆盖对网关的请求中指定的方案。例如，如果请求通过`HTTPS`进入网关，但`ServiceInstance`表示它不安全，则下游请求将通过`HTTP`发出。相反的情况也可以适用。但是，如果在网关配置中为路由指定了`GATEWAY_SCHEME_PREFIX_ATTR`，则前缀将被删除，并且从路由URL生成的方案将覆盖`ServiceInstance`配置。 |

## 116.5网络路由过滤器

如果位于`ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR`交换属性中的URL具有`http`或`https`方案，则将运行Netty路由筛选器。它使用Netty `HttpClient`发出下游代理请求。响应将放在`ServerWebExchangeUtils.CLIENT_RESPONSE_ATTR`交换属性中，以供以后的过滤器使用。（有一个实验性`WebClientHttpRoutingFilter`，它执行相同的功能，但不需要净值）

## 116.6 Netty写响应过滤器

如果`ServerWebExchangeUtils.CLIENT_RESPONSE_ATTR`交换属性中有净值`HttpClientResponse`，则`NettyWriteResponseFilter`将运行。它在所有其他筛选器完成后运行，并将代理响应写回到网关客户端响应。（有一个实验性`WebClientWriteResponseFilter`，它执行相同的功能，但不需要净值）

## 116.7 RouteToRequestUrl过滤器

如果`ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR`交换属性中存在`Route`对象，则`RouteToRequestUrlFilter`将运行。它基于请求URI创建一个新URI，但使用`Route`对象的URI属性进行了更新。新的URI放置在`ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR`交换属性中。

如果URI具有方案前缀（例如`lb:ws://serviceid`），则将从URI中剥离`lb`方案，并将其放在`ServerWebExchangeUtils.GATEWAY_SCHEME_PREFIX_ATTR`中，以供以后在过滤器链中使用。

## 116.8 Websocket路由过滤器

如果位于`ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR`交换属性中的URL具有`ws`或`wss`方案，则Websocket路由筛选器将运行。它使用Spring Web套接字基础结构向下游转发Websocket请求。

通过在URI前面加上`lb`，例如`lb:ws://serviceid`，可以实现Websocket的负载均衡。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 如果您将[SockJS](https://github.com/sockjs)用作常规http的后备，则应配置常规HTTP路由以及Websocket路由。 |

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      # SockJS route
      - id: websocket_sockjs_route
        uri: http://localhost:3001
        predicates:
        - Path=/websocket/info/**
      # Normal Websocket route
      - id: websocket_route
        uri: ws://localhost:3001
        predicates:
        - Path=/websocket/**
```



## 116.9网关指标过滤器

要启用网关度量标准，请添加spring-boot-starter-actuator作为项目依赖项。然后，默认情况下，只要属性`spring.cloud.gateway.metrics.enabled`未设置为`false`，网关度量过滤器就会运行。该过滤器添加了一个带有以下标记的名为“ gateway.requests”的计时器指标：

- `routeId`：路线ID
- `routeUri`：API将被路由到的URI
- `outcome`：根据[HttpStatus.Series](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/HttpStatus.Series.html)分类的结果
- `status`：返回给客户端的请求的Http状态
- `httpStatusCode`：返回给客户端的请求的Http状态
- `httpMethod`：用于请求的Http方法

然后可以从`/actuator/metrics/gateway.requests` [抓取](https://www.springcloud.cc/images/gateway-grafana-dashboard.jpeg) 这些指标，并且可以轻松地将其与Prometheus集成以创建[Grafana ](https://www.springcloud.cc/images/gateway-grafana-dashboard.jpeg)[仪表板](https://www.springcloud.cc/gateway-grafana-dashboard.json)。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 要启用Prometheus端点，请添加micrometer-registry-prometheus作为项目依赖项。 |

## 116.10将交换标记为已路由

网关路由`ServerWebExchange`后，它将通过在交换属性中添加`gatewayAlreadyRouted`将该交换标记为“已路由”。将请求标记为已路由后，其他路由筛选器将不会再次路由请求，实质上会跳过该筛选器。您可以使用多种便捷方法将交换标记为已路由，或者检查交换是否已路由。

- `ServerWebExchangeUtils.isAlreadyRouted`接受`ServerWebExchange`对象，并检查其是否已“路由”
- `ServerWebExchangeUtils.setAlreadyRouted`接受`ServerWebExchange`对象，并将其标记为“已路由”

## 117. HttpHeadersFilters

HttpHeadersFilters在向下游发送请求之前（例如，在`NettyRoutingFilter`中）已应用于请求。

## 117.1转发的标题过滤器

`Forwarded`标头过滤器创建一个`Forwarded`标头，以发送到下游服务。它将当前请求的`Host`标头，方案和端口添加到任何现有的`Forwarded`标头中。

## 117.2 RemoveHopByHop标头过滤器

`RemoveHopByHop`标头过滤器从转发的请求中删除标头。被删除的头的默认列表来自[IETF](https://tools.ietf.org/html/draft-ietf-httpbis-p1-messaging-14#section-7.1.3)。

**默认删除的标题为：**

- 连接
- 活着
- 代理验证
- 代理授权
- TE
- 预告片
- 传输编码
- 升级

要更改此设置，请将`spring.cloud.gateway.filter.remove-non-proxy-headers.headers`属性设置为要删除的标头名称列表。

## 117.3 XForwarded标头过滤器

`XForwarded`标头过滤器创建各种`X-Forwarded-*`标头，以发送到下游服务。它使用`Host`头，当前请求的方案，端口和路径来创建各种头。

可以通过以下布尔属性（默认为true）控制单个标题的创建：

- `spring.cloud.gateway.x-forwarded.for.enabled`
- `spring.cloud.gateway.x-forwarded.host.enabled`
- `spring.cloud.gateway.x-forwarded.port.enabled`
- `spring.cloud.gateway.x-forwarded.proto.enabled`
- `spring.cloud.gateway.x-forwarded.prefix.enabled`

可以通过以下布尔属性（默认为true）控制追加多个标头：

- `spring.cloud.gateway.x-forwarded.for.append`
- `spring.cloud.gateway.x-forwarded.host.append`
- `spring.cloud.gateway.x-forwarded.port.append`
- `spring.cloud.gateway.x-forwarded.proto.append`
- `spring.cloud.gateway.x-forwarded.prefix.append`

## 118. TLS / SSL

网关可以通过遵循常规的Spring服务器配置来侦听https上的请求。例：

**application.yml。** 

```
server:
  ssl:
    enabled: true
    key-alias: scg
    key-store-password: scg1234
    key-store: classpath:scg-keystore.p12
    key-store-type: PKCS12
```



网关路由可以同时路由到http和https后端。如果路由到https后端，则可以使用以下配置将网关配置为信任所有下游证书：

**application.yml。** 

```
spring:
  cloud:
    gateway:
      httpclient:
        ssl:
          useInsecureTrustManager: true
```



使用不安全的信任管理器不适用于生产。对于生产部署，可以为网关配置一组可以通过以下配置信任的已知证书：

**application.yml。** 

```
spring:
  cloud:
    gateway:
      httpclient:
        ssl:
          trustedX509Certificates:
          - cert1.pem
          - cert2.pem
```



如果Spring Cloud网关未配置受信任的证书，则使用默认的信任存储（可以使用系统属性javax.net.ssl.trustStore覆盖）。

## 118.1 TLS握手

网关维护一个客户端池，该客户端池用于路由到后端。通过https进行通信时，客户端会启动TLS握手。许多超时与此握手相关联。可以配置以下超时（显示默认值）：

**application.yml。** 

```
spring:
  cloud:
    gateway:
      httpclient:
        ssl:
          handshake-timeout-millis: 10000
          close-notify-flush-timeout-millis: 3000
          close-notify-read-timeout-millis: 0
```



## 119.配置

Spring Cloud网关的配置由`RouteDefinitionLocator`的集合驱动。

**RouteDefinitionLocator.java。** 

```
public interface RouteDefinitionLocator {
    Flux<RouteDefinition> getRouteDefinitions();
}
```



默认情况下，`PropertiesRouteDefinitionLocator`使用Spring Boot的`@ConfigurationProperties`机制加载属性。

上面的所有配置示例都使用一种快捷方式符号，该快捷方式符号使用位置参数而不是命名参数。以下两个示例是等效的：

**application.yml。** 

```
spring:
  cloud:
    gateway:
      routes:
      - id: setstatus_route
        uri: https://example.org
        filters:
        - name: SetStatus
          args:
            status: 401
      - id: setstatusshortcut_route
        uri: https://example.org
        filters:
        - SetStatus=401
```



对于网关的某些用法，属性将是足够的，但某些生产用例将受益于从外部源（例如数据库）加载配置。未来的里程碑版本将基于Spring Data Repositories实现`RouteDefinitionLocator`实现，例如：Redis，MongoDB和Cassandra。

## 119.1 Fluent Java Routes API

为了在Java中进行简单的配置，在`RouteLocatorBuilder` bean中定义了一个流畅的API。

**GatewaySampleApplication.java。** 

```
// static imports from GatewayFilters and RoutePredicates
@Bean
public RouteLocator customRouteLocator(RouteLocatorBuilder builder, ThrottleGatewayFilterFactory throttle) {
    return builder.routes()
            .route(r -> r.host("**.abc.org").and().path("/image/png")
                .filters(f ->
                        f.addResponseHeader("X-TestHeader", "foobar"))
                .uri("http://httpbin.org:80")
            )
            .route(r -> r.path("/image/webp")
                .filters(f ->
                        f.addResponseHeader("X-AnotherHeader", "baz"))
                .uri("http://httpbin.org:80")
            )
            .route(r -> r.order(-1)
                .host("**.throttle.org").and().path("/get")
                .filters(f -> f.filter(throttle.apply(1,
                        1,
                        10,
                        TimeUnit.SECONDS)))
                .uri("http://httpbin.org:80")
            )
            .build();
}
```



此样式还允许更多自定义谓词断言。`RouteDefinitionLocator` beans定义的谓词使用逻辑`and`进行组合。通过使用流畅的Java API，您可以在`Predicate`类上使用`and()`，`or()`和`negate()`运算符。

## 119.2 DiscoveryClient路由定义定位器

可以将网关配置为基于在`DiscoveryClient`兼容服务注册表中注册的服务来创建路由。

要启用此功能，请设置`spring.cloud.gateway.discovery.locator.enabled=true`并确保在类路径上启用了`DiscoveryClient`实现（例如Netflix Eureka，Consul或Zookeeper）。

### 119.2.1为DiscoveryClient路由配置谓词和过滤器

默认情况下，网关为通过`DiscoveryClient`创建的路由定义单个谓词和过滤器。

默认谓词是使用模式`/serviceId/**`定义的路径谓词，其中`serviceId`是`DiscoveryClient`中服务的ID。

缺省过滤器是带有正则表达式`/serviceId/(?<remaining>.*)`和替换文本`/${remaining}`的重写路径过滤器。这只是在将请求发送到下游之前从路径中剥离服务ID。

如果要自定义`DiscoveryClient`路由使用的谓词和/或过滤器，可以通过设置`spring.cloud.gateway.discovery.locator.predicates[x]`和`spring.cloud.gateway.discovery.locator.filters[y]`来实现。这样做时，如果要保留该功能，则需要确保在上面包含默认谓词和过滤器。以下是此示例的示例。

**application.properties。** 

```
spring.cloud.gateway.discovery.locator.predicates[0].name: Path
spring.cloud.gateway.discovery.locator.predicates[0].args[pattern]: "'/'+serviceId+'/**'"
spring.cloud.gateway.discovery.locator.predicates[1].name: Host
spring.cloud.gateway.discovery.locator.predicates[1].args[pattern]: "'**.foo.com'"
spring.cloud.gateway.discovery.locator.filters[0].name: Hystrix
spring.cloud.gateway.discovery.locator.filters[0].args[name]: serviceId
spring.cloud.gateway.discovery.locator.filters[1].name: RewritePath
spring.cloud.gateway.discovery.locator.filters[1].args[regexp]: "'/' + serviceId + '/(?<remaining>.*)'"
spring.cloud.gateway.discovery.locator.filters[1].args[replacement]: "'/${remaining}'"
```



## 120. Reactor Netty访问日志

要启用Reactor Netty访问日志，请设置`-Dreactor.netty.http.server.accessLogEnabled=true`。（它必须是Java系统Property，而不是Spring Boot属性）。

日志系统可以配置为具有单独的访问日志文件。以下是示例登录配置：

**logback.xml。** 

```
    <appender name="accessLog" class="ch.qos.logback.core.FileAppender">
        <file>access_log.log</file>
        <encoder>
            <pattern>%msg%n</pattern>
        </encoder>
    </appender>
    <appender name="async" class="ch.qos.logback.classic.AsyncAppender">
        <appender-ref ref="accessLog" />
    </appender>

    <logger name="reactor.netty.http.server.AccessLog" level="INFO" additivity="false">
        <appender-ref ref="async"/>
    </logger>
```



## 121. CORS配置

可以将网关配置为控制CORS行为。“全局” CORS配置是URL模式到[Spring Framework `CorsConfiguration`](https://docs.spring.io/spring/docs/5.0.x/javadoc-api/org/springframework/web/cors/CorsConfiguration.html)的映射。

**application.yml。** 

```
spring:
  cloud:
    gateway:
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins: "https://docs.spring.io"
            allowedMethods:
            - GET
```



在上面的示例中，对于所有GET请求的路径，来自docs.spring.io的请求都将允许CORS请求。

要为未被某些网关路由谓词处理的请求提供相同的CORS配置，请将属性`spring.cloud.gateway.globalcors.add-to-simple-url-handler-mapping`设置为true。当尝试支持CORS预检请求并且您的路由谓词未评估为true时，这很有用，因为http方法为`options`。

## 122.执行器API

`/gateway`执行器端点允许监视Spring Cloud Gateway应用程序并与之交互。为了可远程访问，必须在应用程序属性中[通过HTTP或JMX ](https://docs.spring.io/spring-boot/docs/current/reference/html/production-ready-endpoints.html#production-ready-endpoints-exposing-endpoints)[启用](https://docs.spring.io/spring-boot/docs/current/reference/html/production-ready-endpoints.html#production-ready-endpoints-enabling-endpoints)和[公开](https://docs.spring.io/spring-boot/docs/current/reference/html/production-ready-endpoints.html#production-ready-endpoints-exposing-endpoints)端点。

**application.properties。** 

```
management.endpoint.gateway.enabled=true # default value
management.endpoints.web.exposure.include=gateway
```



## 122.1详细执行器格式

一种新的，更详细的格式已添加到网关。这为每个路由增加了更多细节，从而允许查看与每个路由关联的谓词和过滤器以及任何可用的配置。

```
/actuator/gateway/routes
[
  {
    "predicate": "(Hosts: [**.addrequestheader.org] && Paths: [/headers], match trailing slash: true)",
    "route_id": "add_request_header_test",
    "filters": [
      "[[AddResponseHeader X-Response-Default-Foo = 'Default-Bar'], order = 1]",
      "[[AddRequestHeader X-Request-Foo = 'Bar'], order = 1]",
      "[[PrefixPath prefix = '/httpbin'], order = 2]"
    ],
    "uri": "lb://testservice",
    "order": 0
  }
]
```

要启用此功能，请设置以下属性：

**application.properties。** 

```
spring.cloud.gateway.actuator.verbose.enabled=true
```



在将来的版本中，该默认值为true。

## 122.2检索路由过滤器

### 122.2.1全局过滤器

要检索应用于所有路由的[全局过滤器](https://www.springcloud.cc/spring-cloud-greenwich.html#)，请向`/actuator/gateway/globalfilters`发出`GET`请求。产生的响应类似于以下内容：

```
{
  "org.springframework.cloud.gateway.filter.LoadBalancerClientFilter@77856cc5": 10100,
  "org.springframework.cloud.gateway.filter.RouteToRequestUrlFilter@4f6fd101": 10000,
  "org.springframework.cloud.gateway.filter.NettyWriteResponseFilter@32d22650": -1,
  "org.springframework.cloud.gateway.filter.ForwardRoutingFilter@106459d9": 2147483647,
  "org.springframework.cloud.gateway.filter.NettyRoutingFilter@1fbd5e0": 2147483647,
  "org.springframework.cloud.gateway.filter.ForwardPathFilter@33a71d23": 0,
  "org.springframework.cloud.gateway.filter.AdaptCachedBodyGlobalFilter@135064ea": 2147483637,
  "org.springframework.cloud.gateway.filter.WebsocketRoutingFilter@23c05889": 2147483646
}
```

该响应包含适当的全局过滤器的详细信息。为每个全局过滤器提供过滤器对象的字符串表示形式（例如`org.springframework.cloud.gateway.filter.LoadBalancerClientFilter@77856cc5`）和过滤器链中的相应[顺序](https://www.springcloud.cc/spring-cloud-greenwich.html#_combined_global_filter_and_gatewayfilter_ordering)。

### 122.2.2路由过滤器

要检索应用于路由的[GatewayFilter工厂](https://www.springcloud.cc/spring-cloud-greenwich.html#)，请向`/actuator/gateway/routefilters`发出`GET`请求。产生的响应类似于以下内容：

```
{
  "[AddRequestHeaderGatewayFilterFactory@570ed9c configClass = AbstractNameValueGatewayFilterFactory.NameValueConfig]": null,
  "[SecureHeadersGatewayFilterFactory@fceab5d configClass = Object]": null,
  "[SaveSessionGatewayFilterFactory@4449b273 configClass = Object]": null
}
```

该响应包含应用于任何特定路由的GatewayFilter工厂的详细信息。为每个工厂提供相应对象的字符串表示形式（例如`[SecureHeadersGatewayFilterFactory@fceab5d configClass = Object]`）。请注意，`null`值是由于端点控制器的实现不完整而导致的，因为它试图设置对象在过滤器链中的顺序，该顺序不适用于GatewayFilter工厂对象。

## 122.3刷新路由缓存

要清除路由缓存，请向`/actuator/gateway/refresh`发出`POST`请求。该请求返回200，但没有响应主体。

## 122.4检索网关中定义的路由

要检索网关中定义的路由，请向`/actuator/gateway/routes`发出`GET`请求。产生的响应类似于以下内容：

```
[{
  "route_id": "first_route",
  "route_object": {
    "predicate": "org.springframework.cloud.gateway.handler.predicate.PathRoutePredicateFactory$$Lambda$432/1736826640@1e9d7e7d",
    "filters": [
      "OrderedGatewayFilter{delegate=org.springframework.cloud.gateway.filter.factory.PreserveHostHeaderGatewayFilterFactory$$Lambda$436/674480275@6631ef72, order=0}"
    ]
  },
  "order": 0
},
{
  "route_id": "second_route",
  "route_object": {
    "predicate": "org.springframework.cloud.gateway.handler.predicate.PathRoutePredicateFactory$$Lambda$432/1736826640@cd8d298",
    "filters": []
  },
  "order": 0
}]
```

该响应包含网关中定义的所有路由的详细信息。下表描述了响应的每个元素（即路线）的结构。

| 路径                     | 类型   | 描述                                                         |
| ------------------------ | ------ | ------------------------------------------------------------ |
| `route_id`               | String | The route id.                                                |
| `route_object.predicate` | Object | The route predicate.                                         |
| `route_object.filters`   | Array  | The [GatewayFilter factories](https://www.springcloud.cc/spring-cloud-greenwich.html#) applied to the route. |
| `order`                  | Number | The route order.                                             |

## 122.5检索有关特定路线的信息

要检索有关一条路线的信息，请向`/actuator/gateway/routes/{id}`发送一个`GET`请求（例如`/actuator/gateway/routes/first_route`）。产生的响应类似于以下内容：

```
{
  "id": "first_route",
  "predicates": [{
    "name": "Path",
    "args": {"_genkey_0":"/first"}
  }],
  "filters": [],
  "uri": "https://www.uri-destination.org",
  "order": 0
}]
```

下表描述了响应的结构。

| 路径         | 类型   | 描述                                                         |
| ------------ | ------ | ------------------------------------------------------------ |
| `id`         | String | The route id.                                                |
| `predicates` | Array  | The collection of route predicates. Each item defines the name and the arguments of a given predicate. |
| `filters`    | Array  | The collection of filters applied to the route.              |
| `uri`        | String | The destination URI of the route.                            |
| `order`      | Number | The route order.                                             |

## 122.6创建和删除特定路线

要创建路由，请使用指定路由字段的JSON正文向`/gateway/routes/{id_route_to_create}`发出`POST`请求（请参见上一小节）。

要删除路由，请向`/gateway/routes/{id_route_to_delete}`发出`DELETE`请求。

## 122.7概述：所有端点的列表

下表总结了Spring Cloud网关执行器端点。请注意，每个端点都有`/actuator/gateway`作为基本路径。

| ID              | HTTP方法 | 描述                                                         |
| --------------- | -------- | ------------------------------------------------------------ |
| `globalfilters` | GET      | Displays the list of global filters applied to the routes.   |
| `routefilters`  | GET      | Displays the list of GatewayFilter factories applied to a particular route. |
| `refresh`       | POST     | Clears the routes cache.                                     |
| `routes`        | GET      | Displays the list of routes defined in the gateway.          |
| `routes/{id}`   | GET      | Displays information about a particular route.               |
| `routes/{id}`   | POST     | Add a new route to the gateway.                              |
| `routes/{id}`   | DELETE   | Remove an existing route from the gateway.                   |

## 123.故障排除

## 123.1日志级别

以下是一些有用的记录器，它们包含`DEBUG`和`TRACE`级别的有价值的故障排除信息。

- `org.springframework.cloud.gateway`
- `org.springframework.http.server.reactive`
- `org.springframework.web.reactive`
- `org.springframework.boot.autoconfigure.web`
- `reactor.netty`
- `redisratelimiter`

## 123.2窃听

Reactor Netty `HttpClient`和`HttpServer`可以启用窃听功能。与将`reactor.netty`日志级别设置为`DEBUG`或`TRACE`结合使用时，将允许记录信息，例如通过网络发送和接收的标头和正文。要启用此功能，请分别为`HttpServer`和`HttpClient`设置`spring.cloud.gateway.httpserver.wiretap=true`和/或`spring.cloud.gateway.httpclient.wiretap=true`。

## 124.开发人员指南

这些是编写网关的某些自定义组件的基本指南。

## 124.1编写自定义路由谓词工厂

为了编写路由谓词，您将需要实现`RoutePredicateFactory`。您可以扩展名为`AbstractRoutePredicateFactory`的抽象类。

**MyRoutePredicateFactory.java。** 

```
public class MyRoutePredicateFactory extends AbstractRoutePredicateFactory<HeaderRoutePredicateFactory.Config> {

    public MyRoutePredicateFactory() {
        super(Config.class);
    }

    @Override
    public Predicate<ServerWebExchange> apply(Config config) {
        // grab configuration from Config object
        return exchange -> {
            //grab the request
            ServerHttpRequest request = exchange.getRequest();
            //take information from the request to see if it
            //matches configuration.
            return matches(config, request);
        };
    }

    public static class Config {
        //Put the configuration properties for your filter here
    }

}
```



## 124.2编写自定义GatewayFilter工厂

为了编写GatewayFilter，您将需要实现`GatewayFilterFactory`。您可以扩展名为`AbstractGatewayFilterFactory`的抽象类。

**PreGatewayFilterFactory.java。** 

```
public class PreGatewayFilterFactory extends AbstractGatewayFilterFactory<PreGatewayFilterFactory.Config> {

	public PreGatewayFilterFactory() {
		super(Config.class);
	}

	@Override
	public GatewayFilter apply(Config config) {
		// grab configuration from Config object
		return (exchange, chain) -> {
			//If you want to build a "pre" filter you need to manipulate the
			//request before calling chain.filter
			ServerHttpRequest.Builder builder = exchange.getRequest().mutate();
			//use builder to manipulate the request
			return chain.filter(exchange.mutate().request(request).build());
		};
	}

	public static class Config {
		//Put the configuration properties for your filter here
	}

}
```



**PostGatewayFilterFactory.java。** 

```
public class PostGatewayFilterFactory extends AbstractGatewayFilterFactory<PostGatewayFilterFactory.Config> {

    public PostGatewayFilterFactory() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        // grab configuration from Config object
        return (exchange, chain) -> {
            return chain.filter(exchange).then(Mono.fromRunnable(() -> {
                ServerHttpResponse response = exchange.getResponse();
                //Manipulate the response in some way
            }));
        };
    }

    public static class Config {
        //Put the configuration properties for your filter here
    }

}
```



## 124.3编写自定义全局过滤器

为了编写自定义全局过滤器，您将需要实现`GlobalFilter`接口。这会将过滤器应用于所有请求。

如何分别设置全局前置和后置过滤器的示例

```
@Bean
public GlobalFilter customGlobalFilter() {
    return (exchange, chain) -> exchange.getPrincipal()
        .map(Principal::getName)
        .defaultIfEmpty("Default User")
        .map(userName -> {
          //adds header to proxied request
          exchange.getRequest().mutate().header("CUSTOM-REQUEST-HEADER", userName).build();
          return exchange;
        })
        .flatMap(chain::filter);
}

@Bean
public GlobalFilter customGlobalPostFilter() {
    return (exchange, chain) -> chain.filter(exchange)
        .then(Mono.just(exchange))
        .map(serverWebExchange -> {
          //adds header to response
          serverWebExchange.getResponse().getHeaders().set("CUSTOM-RESPONSE-HEADER",
              HttpStatus.OK.equals(serverWebExchange.getResponse().getStatusCode()) ? "It worked": "It did not work");
          return serverWebExchange;
        })
        .then();
}
```

## 125.使用Spring MVC或Webflux构建一个简单的网关

| ![[警告]](/assets/images/springcloud/warning.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 以下描述了替代样式的网关。先前文档的None适用于以下内容。     |

Spring Cloud Gateway提供了一个名为`ProxyExchange`的实用程序对象，您可以在常规的Spring web处理程序中将其用作方法参数。它通过镜像HTTP动词的方法支持基本的下游HTTP交换。使用MVC，它还支持通过`forward()`方法转发到本地处理程序。要使用`ProxyExchange`，只需在类路径中包含正确的模块（`spring-cloud-gateway-mvc`或`spring-cloud-gateway-webflux`）。

MVC示例（代理对远程服务器下游“ /测试”的请求）：

```
@RestController
@SpringBootApplication
public class GatewaySampleApplication {

    @Value("${remote.home}")
    private URI home;

    @GetMapping("/test")
    public ResponseEntity<?> proxy(ProxyExchange<byte[]> proxy) throws Exception {
        return proxy.uri(home.toString() + "/image/png").get();
    }

}
```

与Webflux相同：

```
@RestController
@SpringBootApplication
public class GatewaySampleApplication {

    @Value("${remote.home}")
    private URI home;

    @GetMapping("/test")
    public Mono<ResponseEntity<?>> proxy(ProxyExchange<byte[]> proxy) throws Exception {
        return proxy.uri(home.toString() + "/image/png").get();
    }

}
```

`ProxyExchange`上有一些便利的方法可以使处理程序方法发现并增强传入请求的URI路径。例如，您可能希望提取路径的尾随元素以将它们传递到下游：

```
@GetMapping("/proxy/path/**")
public ResponseEntity<?> proxyPath(ProxyExchange<byte[]> proxy) throws Exception {
  String path = proxy.path("/proxy/path/");
  return proxy.uri(home.toString() + "/foos/" + path).get();
}
```

网关处理程序方法可以使用Spring MVC或Webflux的所有功能。因此，例如，您可以注入请求标头和查询参数，并且可以使用映射批注中的声明来约束传入的请求。有关这些功能的更多详细信息，请参见Spring MVC中的`@RequestMapping`文档。

可以使用`ProxyExchange`上的`header()`方法将标头添加到下游响应中。

您还可以通过将映射器添加到`get()`等方法来操纵响应头（以及响应中您喜欢的任何其他内容）。映射器是`Function`，它接收传入的`ResponseEntity`并将其转换为传出的`ResponseEntity`。

为不传递到下游的“敏感”标头（默认情况下为“ cookie”和“授权”）以及“代理”标头（`x-forwarded-*`）提供了一流的支持。

# 第十六部分。Spring Cloud功能

马克·费舍尔，戴夫·瑟尔，奥列格·朱拉库斯基



## 126.引言

Spring Cloud功能是一个具有以下高级目标的项目：

- 通过功能促进业务逻辑的实现。
- 将业务逻辑的开发生命周期与任何特定的运行时目标脱钩，以便相同的代码可以作为web端点，流处理器或任务来运行。
- 支持跨无服务器提供程序的统一编程模型，以及独立运行（本地或在PaaS中）的能力。
- 在无服务器提供程序上启用Spring Boot功能（自动配置，依赖项注入，指标）。

它抽象出了所有传输细节和基础结构，使开发人员可以保留所有熟悉的工具和流程，并专注于业务逻辑。

这是一个完整的，可执行的，可测试的Spring Boot应用程序（实现简单的字符串操作）：

```
@SpringBootApplication
public class Application {

  @Bean
  public Function<Flux<String>, Flux<String>> uppercase() {
    return flux -> flux.map(value -> value.toUpperCase());
  }

  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }
}
```

它只是一个Spring Boot应用程序，因此可以像其他任何Spring Boot应用程序一样在本地以CI生成，运行和测试它。`Function`来自`java.util`，而`Flux`是来自项目Reactor的反应性流`Publisher`。来自[项目Reactor](https://projectreactor.io/)的 [反应性流](https://www.reactive-streams.org/) {5297 [/}](https://projectreactor.io/)。可以通过HTTP或消息传递来访问该功能。

Spring Cloud功能具有4个主要功能：

1. 类型为`Function`，`Consumer`和`Supplier`的`@Beans`的包装程序，将它们作为HTTP端点和/或消息流侦听器/发布程序使用RabbitMQ，Kafka等
2. 将作为Java函数体的字符串编译为字节码，然后将其转换为`@Beans`，可以像上面那样进行包装。
3. 使用隔离的类加载器部署包含此类应用程序上下文的JAR文件，以便可以将它们打包在一起在单个JVM中。
4. 适用于[AWS Lambda](https://github.com/spring-cloud/spring-cloud-function/tree/master/spring-cloud-function-adapters/spring-cloud-function-adapter-aws)，[Azure](https://github.com/spring-cloud/spring-cloud-function/tree/master/spring-cloud-function-adapters/spring-cloud-function-adapter-azure)，[Apache OpenWhisk](https://github.com/spring-cloud/spring-cloud-function/tree/master/spring-cloud-function-adapters/spring-cloud-function-adapter-openwhisk)以及其他“无服务器”服务提供商的适配器。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| Spring Cloud是根据非限制性Apache 2.0许可证发行的。如果您想为文档的这一部分做出贡献或发现错误，请在[github](https://github.com/spring-cloud/spring-cloud-function/tree/master/docs/src/main/asciidoc)的项目中找到源代码和问题跟踪程序。 |

## 127.入门

从命令行构建（并“安装”示例）：

```
$ ./mvnw clean install
```

（如果您想使用YOLO，请添加`-DskipTests`。）

运行其中一个示例，例如

```
$ java -jar spring-cloud-function-samples/function-sample/target/*.jar
```

这将运行该应用程序并通过HTTP公开其功能，因此您可以将字符串转换为大写，如下所示：

```
$ curl -H "Content-Type: text/plain" localhost:8080/uppercase -d Hello
HELLO
```

您可以通过用新行分隔多个字符串（`Flux<String>`）来进行转换

```
$ curl -H "Content-Type: text/plain" localhost:8080/uppercase -d 'Hello
> World'
HELLOWORLD
```

（您可以在终端中使用`QJ`在这样的文字字符串中插入新行。）

## 128.构建和运行功能

上面的示例`@SpringBootApplication`具有可以在运行时由Spring Cloud函数修饰为HTTP端点或流处理器（例如，使用RabbitMQ，Apache Kafka或JMS）的功能。

`@Beans`可以是`Function`，`Consumer`或`Supplier`（均来自`java.util`），其参数类型可以是String或POJO。

函数也可以是`Flux<String>`或`Flux<Pojo>`和Spring的云函数，它负责将数据与所需类型之间来回转换，只要它们以纯文本格式出现（或POJO）JSON。还支持`Message<Pojo>`，在此消息头是从传入事件复制而来的，具体取决于适配器。web适配器还支持从表单编码数据到`Map`的转换，如果您将函数与Spring Cloud Stream一起使用，则消息有效负载的所有转换和强制功能也将适用。

可以将功能组合在单个应用程序中，也可以每个jar部署一个。由开发人员选择。具有多种功能的应用程序可以以不同的“个性”多次部署，从而在不同的物理传输方式上暴露出不同的功能。

## 129.功能目录和灵活的功能签名

Spring Cloud函数的主要功能之一是为用户定义的函数适应和支持一系列类型签名，同时提供一致的执行模型。这就是为什么使用[项目Reactor](https://projectreactor.io/)（即`Flux<T>`和`Mono<T>`）定义的原语，`FunctionCatalog`将所有用户定义函数转换为规范表示的原因。例如，用户可以提供类型为`Function<String,String>`的bean，而`FunctionCatalog`会将其包装到`Function<Flux<String>,Flux<String>>`中。

使用基于Reactor的原语不仅有助于用户定义函数的规范表示，而且还有助于建立更健壮和灵活的（反应式）执行模型。

尽管用户通常根本不需要关心`FunctionCatalog`，但是了解用户代码支持哪些功能很有用。

## 129.1 Java 8功能支持

一般而言，用户可以期望，如果他们为普通的旧Java类型（或原始包装器）编写函数，则函数目录会将其包装为相同类型的`Flux`。如果用户使用`Message`（通过spring-messaging）编写函数，它将从支持键值元数据的任何适配器接收和传输头（例如HTTP头）。这是详细信息。

| 用户功能                          | 目录注册                                       |      |
| --------------------------------- | ---------------------------------------------- | ---- |
| `Function<S,T>`                   | `Function<Flux<S>, Flux<T>>`                   |      |
| `Function<Message<S>,Message<T>>` | `Function<Flux<Message<S>>, Flux<Message<T>>>` |      |
| `Function<Flux<S>, Flux<T>>`      | `Function<Flux<S>, Flux<T>>` (pass through)    |      |
| `Supplier<T>`                     | `Supplier<Flux<T>>`                            |      |
| `Supplier<Flux<T>>`               | `Supplier<Flux<T>>`                            |      |
| `Consumer<T>`                     | `Function<Flux<T>, Mono<Void>>`                |      |
| `Consumer<Message<T>>`            | `Function<Flux<Message<T>>, Mono<Void>>`       |      |
| `Consumer<Flux<T>>`               | `Consumer<Flux<T>>`                            |      |

消费者有点特殊，因为它有一个`void`返回类型，这意味着至少有可能阻塞。很可能您不需要编写`Consumer<Flux<?>>`，但是如果需要这样做，请记住订阅输入流量。如果声明了非发布者类型的`Consumer`（正常），它将被转换为返回发布者的函数，以便可以通过受控方式进行订阅。

## 129.2 Kotlin Lambda支持

我们还为Kotlin lambdas（自v2.0起）提供支持。考虑以下：

```
@Bean
open fun kotlinSupplier(): () -> String {
    return  { "Hello from Kotlin" }
}

@Bean
open fun kotlinFunction(): (String) -> String {
    return  { it.toUpperCase() }
}

@Bean
open fun kotlinConsumer(): (String) -> Unit {
    return  { println(it) }
}
```

上面的内容代表配置为Spring beans的Kotlin lambda。每个签名都映射到Java等效的`Supplier`，`Function`和`Consumer`，因此框架支持/识别了签名。尽管Kotlin到Java的映射机制不在本文档的讨论范围之内，但重要的是要理解，此处也适用“ Java 8函数支持”部分中概述的相同的签名转换规则。

要启用Kotlin支持，您需要在类路径中添加`spring-cloud-function-kotlin`模块，其中包含适当的自动配置和支持类。

## 130.独立的Web应用程序

`spring-cloud-function-web`模块具有自动配置，当其包含在Spring Boot web应用程序中（具有MVC支持）时，将激活该配置。还有一个`spring-cloud-starter-function-web`来收集所有可选的依赖项，以防您只需要简单的入门经验。

激活web配置后，您的应用程序将具有一个MVC端点（默认情况下在“ /”上，但可以使用`spring.cloud.function.web.path`进行配置），该端点可用于访问应用程序上下文中的功能。支持的内容类型是纯文本和JSON。

| 方法 | 路径               | 请求                              | 响应                                                         | 状态         |
| ---- | ------------------ | --------------------------------- | ------------------------------------------------------------ | ------------ |
| GET  | /{supplier}        | -                                 | Items from the named supplier                                | 200 OK       |
| POST | /{consumer}        | JSON object or text               | Mirrors input and pushes request body into consumer          | 202 Accepted |
| POST | /{consumer}        | JSON array or text with new lines | Mirrors input and pushes body into consumer one by one       | 202 Accepted |
| POST | /{function}        | JSON object or text               | The result of applying the named function                    | 200 OK       |
| POST | /{function}        | JSON array or text with new lines | The result of applying the named function                    | 200 OK       |
| GET  | /{function}/{item} | -                                 | Convert the item into an object and return the result of applying the function | 200 OK       |

如上表所示，端点的行为取决于方法以及传入请求数据的类型。当传入的数据是单值的并且目标函数被声明为显然是单值的（即不返回集合或`Flux`）时，响应也将包含一个单值。对于多值响应，客户端可以通过发送“接受：文本/事件流”来请求服务器发送的事件流。

如果目录中只有一个功能（消费者等），则路径中的名称是可选的。可以使用管道或逗号分隔功能名称来解决复合函数（管道在URL路径中是合法的，但在命令行上键入会有点尴尬）。

如果目录中只有一个功能，而您又想将一个特定功能映射到根路径（例如“ /”），或者想要组合多个功能然后映射到根路径，则可以这样做通过提供`spring.cloud.function.definition`属性，该属性实际上由spring- = cloud-function- web模块使用，以为存在某种类型的冲突（例如，多个功能可用等）的情况提供默认映射。

例如，

```
--spring.cloud.function.definition=foo|bar
```

上面的属性将组成'foo'和'bar'函数，并将组成的函数映射到“ /”路径。

在`Message<?>`中用输入和输出声明的函数和使用者将在输入消息上看到请求标头，并且输出消息标头将转换为HTTP标头。

在发布文本时，Spring Boot 2.0和更早版本的响应格式可能会有所不同，具体取决于内容协商（提供内容类型和acpt标头以获得最佳效果）。

## 131.独立流应用程序

要发送或接收来自代理（例如RabbitMQ或Kafka）的消息，您可以利用`spring-cloud-stream`项目并将其与Spring Cloud功能集成。有关更多详细信息和示例，请参阅Spring Cloud Stream参考手册的[Spring Cloud功能](https://docs.spring.io/spring-cloud-stream/docs/current/reference/htmlsingle/#_spring_cloud_function)部分。

## 132.部署打包功能

Spring Cloud函数提供了一个“部署程序”库，通过该库，您可以使用隔离的类加载器启动jar文件（或爆炸档案或jar文件集），并公开其中定义的函数。这是一个非常强大的工具，例如，您可以在不更改目标jar文件的情况下，使功能适应各种不同的输入输出适配器。无服务器平台通常具有内置的这种功能，因此您可以将其视为此类平台中函数调用程序的构建块（实际上，[Riff](https://projectriff.io/) Java函数调用程序使用此库）。

API的标准入口点是Spring配置注释`@EnableFunctionDeployer`。如果在Spring Boot应用程序中使用了该功能，则部署程序将启动并寻找某种配置以告知其在何处找到功能jar。至少，用户必须提供`function.location`，它是包含功能的存档的URL或资源位置。它可以选择使用`maven:`前缀通过依赖关系查找来定位工件（有关完整详细信息，请参见`FunctionProperties`）。从jar文件引导Spring Boot应用程序，并使用`MANIFEST.MF`查找起始类，例如，使标准Spring Boot胖子jar可以很好地工作。如果目标jar可以成功启动，则结果是在主应用程序的`FunctionCatalog`中注册了一个函数。已注册的函数可以通过主应用程序中的代码来应用，即使它是在隔离的类加载器中创建的（通过deault实现）。

## 133.功能性Bean定义

对于需要快速启动的小型应用程序，Spring Cloud函数支持bean声明的“函数式”样式。bean声明的功能样式是Spring Framework 5.0的一项功能，在5.1中进行了重大改进。

## 133.1将功能与传统的Bean定义进行比较

这是一种普通的Spring Cloud函数应用程序，具有相似的`@Configuration`和`@Bean`声明样式：

```
@SpringBootApplication
public class DemoApplication {

  @Bean
  public Function<String, String> uppercase() {
    return value -> value.toUpperCase();
  }

  public static void main(String[] args) {
    SpringApplication.run(DemoApplication.class, args);
  }

}
```

您可以在无服务器平台（如AWS Lambda或Azure Functions）中运行以上命令，也可以仅在类路径中包含`spring-cloud-function-starter-web`，即可在其自己的HTTP服务器中运行上述命令。运行main方法将公开一个端点，您可以使用该端点ping `uppercase`函数：

```
$ curl localhost:8080 -d foo
FOO
```

`spring-cloud-function-starter-web`中的web适配器使用Spring MVC，因此您需要一个Servlet容器。您也可以在默认服务器为netty的地方使用Webflux（即使您仍然愿意使用Servlet容器），也可以使用`spring-cloud-starter-function-webflux`依赖项。功能相同，并且两者都可以使用用户应用程序代码。

现在，对于功能beans：用户应用程序代码可以重铸为“功能”形式，如下所示：

```
@SpringBootConfiguration
public class DemoApplication implements ApplicationContextInitializer<GenericApplicationContext> {

  public static void main(String[] args) {
    FunctionalSpringApplication.run(DemoApplication.class, args);
  }

  public Function<String, String> uppercase() {
    return value -> value.toUpperCase();
  }

  @Override
  public void initialize(GenericApplicationContext context) {
    context.registerBean("demo", FunctionRegistration.class,
        () -> new FunctionRegistration<>(uppercase())
            .type(FunctionType.from(String.class).to(String.class)));
  }

}
```

主要区别在于：

- 主要类是`ApplicationContextInitializer`。
- `@Bean`方法已转换为对`context.registerBean()`的调用
- `@SpringBootApplication`已替换为`@SpringBootConfiguration`，以表示我们未启用Spring引导自动配置，但仍将该类标记为“入口点”。
- Spring Boot中的`SpringApplication`已被Spring Cloud函数中的`FunctionalSpringApplication`取代（它是一个子类）。

您在Spring Cloud Function应用程序中注册的业务逻辑beans的类型为`FunctionRegistration`。这是一个包装，其中包含函数以及有关输入和输出类型的信息。在本应用程序的`@Bean`形式中，信息可以反射性地导出，但是在功能性bean注册中，除非我们使用`FunctionRegistration`，否则其中的一些信息会丢失。

使用`ApplicationContextInitializer`和`FunctionRegistration`的替代方法是使应用程序本身实现`Function`（或`Consumer`或`Supplier`）。示例（与上述等效）：

```
@SpringBootConfiguration
public class DemoApplication implements Function<String, String> {

  public static void main(String[] args) {
    FunctionalSpringApplication.run(DemoApplication.class, args);
  }

  @Override
  public String uppercase(String value) {
    return value.toUpperCase();
  }

}
```

如果您添加类型为`Function`的独立类，并使用`run()`方法的另一种形式向`SpringApplication`注册，它也将起作用。最主要的是，泛型类型信息可在运行时通过类声明获得。

如果您添加`spring-cloud-starter-function-webflux`，则该应用程序将在其自己的HTTP服务器上运行（由于尚未实现嵌入式Servlet容器的功能形式，因此它目前无法与MVC启动器一起使用）。该应用程序还可以在AWS Lambda或Azure Functions中正常运行，并且启动时间的改善是巨大的。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| “精简型” web服务器对`Function`签名的范围有一些限制-特别是它（目前）还不支持`Message`输入和输出，但是POJO和任何类型的`Publisher`应该没事。 |

## 133.2测试功能应用程序

Spring Cloud函数还具有一些集成测试实用程序，这些实用程序对于Spring Boot用户而言非常熟悉。例如，这是包装以上应用程序的HTTP服务器的集成测试：

```
@RunWith(SpringRunner.class)
@FunctionalSpringBootTest
@AutoConfigureWebTestClient
public class FunctionalTests {

	@Autowired
	private WebTestClient client;

	@Test
	public void words() throws Exception {
		client.post().uri("/").body(Mono.just("foo"), String.class).exchange()
				.expectStatus().isOk().expectBody(String.class).isEqualTo("FOO");
	}

}
```

该测试几乎与您为同一应用程序的`@Bean`版本编写的测试相同-唯一的区别是`@FunctionalSpringBootTest`注释，而不是常规的`@SpringBootTest`。所有其他部件，例如`@Autowired` `WebTestClient`，都是标准的Spring Boot功能。

或者，您可以仅使用`FunctionCatalog`为非HTTP应用编写测试。例如：

```
@RunWith(SpringRunner.class)
@FunctionalSpringBootTest
public class FunctionalTests {

	@Autowired
	private FunctionCatalog catalog;

	@Test
	public void words() throws Exception {
		Function<Flux<String>, Flux<String>> function = catalog.lookup(Function.class,
				"function");
		assertThat(function.apply(Flux.just("foo")).blockFirst()).isEqualTo("FOO");
	}

}
```

（`FunctionCatalog`始终将函数从`Flux`返回到`Flux`，即使用户使用更简单的签名声明它们也是如此。）

## 133.3功能性Bean声明的局限性

与整个Spring Boot相比，大多数Spring Cloud Function应用程序的范围相对较小，因此我们能够轻松地使其适应这些功能bean的定义。如果您超出了有限的范围，则可以通过切换回`@Bean`样式配置或使用混合方法来扩展Spring Cloud Function应用。例如，如果您想利用Spring Boot自动配置来与外部数据存储区集成，则需要使用`@EnableAutoConfiguration`。如果需要，仍可以使用函数声明来定义函数（即“混合”样式），但是在那种情况下，您将需要使用`spring.functional.enabled=false`显式关闭“全功能模式”，以便Spring Boot可以收回控制权。

## 134.动态编译

有一个示例应用程序，该应用程序使用函数编译器从配置属性中创建函数。原始的“功能示例”也具有该功能。您可以运行一些脚本来查看编译在运行时发生的情况。要运行这些示例，请切换到`scripts`目录：

```
cd scripts
```

另外，在本地启动RabbitMQ服务器（例如，执行`rabbitmq-server`）。

启动功能注册表服务：

```
./function-registry.sh
```

注册功能：

```
./registerFunction.sh -n uppercase -f "f->f.map(s->s.toString().toUpperCase())"
```

使用该功能运行REST微服务：

```
./web.sh -f uppercase -p 9000
curl -H "Content-Type: text/plain" -H "Accept: text/plain" localhost:9000/uppercase -d foo
```

注册供应商：

```
./registerSupplier.sh -n words -f "()->Flux.just(\"foo\",\"bar\")"
```

使用该供应商运行REST微服务：

```
./web.sh -s words -p 9001
curl -H "Accept: application/json" localhost:9001/words
```

注册消费者：

```
./registerConsumer.sh -n print -t String -f "System.out::println"
```

使用该使用者运行REST微服务：

```
./web.sh -c print -p 9002
curl -X POST -H "Content-Type: text/plain" -d foo localhost:9002/print
```

运行流处理微服务：

首先注册流字供应商：

```
./registerSupplier.sh -n wordstream -f "()->Flux.interval(Duration.ofMillis(1000)).map(i->\"message-\"+i)"
```

然后启动源（供应商），处理器（功能）和宿（消费者）应用程序（以相反的顺序）：

```
./stream.sh -p 9103 -i uppercaseWords -c print
./stream.sh -p 9102 -i words -f uppercase -o uppercaseWords
./stream.sh -p 9101 -s wordstream -o words
```

输出将显示在接收器应用程序的控制台中（每秒一条消息，转换为大写字母）：

```
MESSAGE-0
MESSAGE-1
MESSAGE-2
MESSAGE-3
MESSAGE-4
MESSAGE-5
MESSAGE-6
MESSAGE-7
MESSAGE-8
MESSAGE-9
...
```

## 135.无服务器平台适配器

除了能够作为独立进程运行之外，Spring Cloud Function应用程序还可以运行现有的无服务器平台之一。在项目中，有适用于 [AWS Lambda](https://github.com/spring-cloud/spring-cloud-function/tree/master/spring-cloud-function-adapters/spring-cloud-function-adapter-aws)， [Azure](https://github.com/spring-cloud/spring-cloud-function/tree/master/spring-cloud-function-adapters/spring-cloud-function-adapter-azure)和 [Apache OpenWhisk的适配器](https://github.com/spring-cloud/spring-cloud-function/tree/master/spring-cloud-function-adapters/spring-cloud-function-adapter-openwhisk)。在[甲骨文FN平台](https://github.com/fnproject/fn) 都有自己的Spring Cloud功能适配器。和 [里夫](https://projectriff.io/)支持Java的功能和它的 [Java函数调用器](https://github.com/projectriff/java-function-invoker)作用本身为Spring Cloud功能罐子的适配器。

## 135.1 AWS Lambda

的[AWS](https://aws.amazon.com/)适配器取Spring Cloud功能的应用程序，并将其转换为可以在AWS LAMBDA运行的形式。

### 135.1.1简介

适配器具有几个可以使用的通用请求处理程序。最通用的是`SpringBootStreamHandler`，它使用Spring Boot提供的Jackson `ObjectMapper`对函数中的对象进行序列化和反序列化。您还可以扩展`SpringBootRequestHandler`并将其输入和输出类型作为类型参数（使AWS能够检查类并自己进行JSON转换）。

如果您的应用程序具有多个`Function`等类型的`@Bean`等，则可以通过配置`function.name`（例如，在AWS中作为`FUNCTION_NAME`环境变量）来选择要使用的一个。从Spring Cloud `FunctionCatalog`中提取函数（首先搜索`Function`，然后搜索`Consumer`，最后搜索`Supplier`）。

### 135.1.2有关JAR布局的注意事项

Lambda在运行时不需要Spring Cloud函数Web或流适配器，因此在创建发送到AWS的JAR之前，可能需要排除它们。Lambda应用程序必须着色，而Spring Boot独立应用程序则不必着色，因此您可以使用2个单独的jar（根据示例）运行同一应用程序。该示例应用程序将创建2个jar文件，其中一个带有`aws`分类器以在Lambda中进行部署，而一个可执行（瘦）jar在运行时包括`spring-cloud-function-web`。Spring Cloud函数将使用`Start-Class`属性（如果使用入门级父级，将由Spring Boot工具为您添加），从JAR文件清单中尝试为您找到“主类”。 。如果清单中没有`Start-Class`，则在将功能部署到AWS时可以使用环境变量`MAIN_CLASS`。

### 135.1.3上传

在`spring-cloud-function-samples/function-sample-aws`下构建示例，并将`-aws` jar文件上传到Lambda。处理程序可以为`example.Handler`或`org.springframework.cloud.function.adapter.aws.SpringBootStreamHandler`（该类的FQN，*而不是*方法引用，尽管Lambda确实接受方法引用）。

```
./mvnw -U clean package
```

使用AWS命令行工具，如下所示：

```
aws lambda create-function --function-name Uppercase --role arn:aws:iam::[USERID]:role/service-role/[ROLE] --zip-file fileb://function-sample-aws/target/function-sample-aws-2.0.0.BUILD-SNAPSHOT-aws.jar --handler org.springframework.cloud.function.adapter.aws.SpringBootStreamHandler --description "Spring Cloud Function Adapter Example" --runtime java8 --region us-east-1 --timeout 30 --memory-size 1024 --publish
```

AWS示例中函数的输入类型是Foo，它具有一个称为“ value”的单个属性。因此，您需要使用它进行测试：

```
{
  "value": "test"
}
```

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| AWS示例应用程序以“功能性”风格编写（作为`ApplicationContextInitializer`）。在Lambda中启动时，这比传统的`@Bean`风格要快得多，因此，如果不需要`@Beans`（或`@EnableAutoConfiguration`），这是一个不错的选择。暖启动不受影响。 |

### 135.1.4 Platfom的特定功能

#### HTTP和API网关

AWS具有某些特定于平台的数据类型，包括消息批处理，这比单独处理每个数据集要高效得多。要使用这些类型，您可以编写依赖于这些类型的函数。或者，您可以依靠Spring从AWS类型中提取数据并将其转换为Spring `Message`。为此，您要告诉AWS函数具有特定的通用处理程序类型（取决于AWS服务），并提供类型为`Function<Message<S>,Message<T>>`的bean，其中`S`和`T`是您的业务数据类型。如果类型`Function`的bean不止一个，则可能还需要将Spring Boot属性`function.name`配置为目标bean的名称（例如，使用`FUNCTION_NAME`作为环境变量）。

支持的AWS服务和通用处理程序类型如下所示：

| 服务        | AWS类型                                                      | 通用处理程序                                                 |      |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ---- |
| API Gateway | `APIGatewayProxyRequestEvent`, `APIGatewayProxyResponseEvent` | `org.springframework.cloud.function.adapter.aws.SpringBootApiGatewayRequestHandler` |      |
| Kinesis     | KinesisEvent                                                 | org.springframework.cloud.function.adapter.aws.SpringBootKinesisEventHandler |      |

例如，要在API网关后面进行部署，请在您的AWS命令行中使用`--handler org.springframework.cloud.function.adapter.aws.SpringBootApiGatewayRequestHandler`（通过UI）并定义类型为`Function<Message<Foo>,Message<Bar>>`的`@Bean`，其中`Foo`和`Bar`是POJO类型（数据将由AWS使用Jackson进行编组和解组）。

## 135.2 Azure功能

所述[天青](https://azure.microsoft.com/)适配器自举一个Spring Cloud功能上下文和通道功能从天青框架呼叫到用户的功能，使用Spring Boot结构，其中必要的。Azure Functions具有一个非常独特但具有侵入性的编程模型，涉及特定于平台的用户代码中的注释。与Spring Cloud一起使用的最简单方法是扩展基类，并在其中编写带有`@FunctionName`批注的方法，该批注委派给基类方法。

该项目为Spring Cloud Function应用程序提供了到Azure的适配器层。您可以编写一个类型为`Function`的单个`@Bean`的应用程序，如果正确放置了JAR文件，则可以将其部署在Azure中。

必须扩展`AzureSpringBootRequestHandler`，并提供输入和输出类型作为带注释的方法参数（使Azure能够检查类并创建JSON绑定）。基类有两个有用的方法（`handleRequest`和`handleOutput`），您可以将实际的函数调用委派给该方法，因此大多数情况下，该函数只会有一行。

例：

```
public class FooHandler extends AzureSpringBootRequestHandler<Foo, Bar> {
    @FunctionName("uppercase")
    public Bar execute(
            @HttpTrigger(name = "req", methods = { HttpMethod.GET,
                    HttpMethod.POST }, authLevel = AuthorizationLevel.ANONYMOUS)
                    Foo foo,
            ExecutionContext context) {
        return handleRequest(foo, context);
    }
}
```

此Azure处理程序将委派给`Function<Foo,Bar>` bean（或`Function<Publisher<Foo>,Publisher<Bar>>`）。某些Azure触发器（例如`@CosmosDBTrigger`）会导致输入类型为`List`，在这种情况下，您可以绑定到Azure处理程序中的`List`或`String`（原始JSON）。`List`输入委托给输入类型为`Map<String,Object>`或`Publisher`或相同类型的`List`的`Function`。`Function`的输出可以是`List`（一对一）或单个值（聚合），并且Azure声明中的输出绑定应该匹配。

如果您的应用具有多个`Function`等类型的`@Bean`等，那么您可以通过配置`function.name`选择一个。或者，如果使Azure处理程序方法中的`@FunctionName`与函数名称匹配，则它应以这种方式工作（也适用于具有多个函数的函数应用程序）。这些功能是从Spring Cloud `FunctionCatalog`中提取的，因此默认功能名称与bean名称相同。

### 135.2.1有关JAR布局的注意事项

在Azure的运行时中不需要Spring Cloud函数Web，因此可以在创建要部署到Azure的JAR之前将其排除在外，但是如果包含它，则不会使用它，因此不需要。保留它不会很麻烦。Azure上的功能应用程序是由Maven插件生成的存档。该函数位于此项目生成的JAR文件中。该示例使用精简版式将其创建为可执行jar，以便Azure可以找到处理程序类。如果您愿意，可以只使用常规的平面JAR文件。依赖性**不**应该包括在内。

### 135.2.2建立

```
./mvnw -U clean package
```

### 135.2.3运行示例

您可以在本地运行该示例，就像其他Spring Cloud函数示例一样：





和`curl -H "Content-Type: text/plain" localhost:8080/function -d '{"value": "hello foobar"}'`。

您将需要`az` CLI应用程序（有关更多详细信息，请参见[https://docs.microsoft.com/zh-cn/azure/azure-functions/functions-create-first-java-maven](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-java-maven)）。要将功能部署在Azure运行时上：

```
$ az login
$ mvn azure-functions:deploy
```

在另一个终端上，尝试以下操作：`curl https://<azure-function-url-from-the-log>/api/uppercase -d '{"value": "hello foobar!"}'`。请确保为上述功能使用正确的URL。或者，您可以在Azure仪表板UI中测试该功能（单击功能名称，转到右侧，然后单击“测试”，然后单击右下角的“运行”）。

Azure示例中函数的输入类型是具有单个属性“ Foo”的Foo。因此，您需要使用以下代码进行测试：

```
{
  "value": "foobar"
}
```

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| Azure示例应用程序以“非功能性”样式编写（使用`@Bean`）。在Azure中启动时，功能样式（仅带有`Function`或`ApplicationContextInitializer`）比传统的`@Bean`样式要快得多，因此，如果不需要`@Beans`（或`@EnableAutoConfiguration`），这是一个不错的选择。暖启动不受影响。 |

## 135.3 Apache Openwhisk

所述[OpenWhisk](https://openwhisk.apache.org/)适配器是在可以在AA搬运工图像被用于部署到Openwhisk一个可执行的jar的形式。该平台以请求-响应模式工作，侦听特定端点上的端口8080，因此适配器是一个简单的Spring MVC应用程序。

### 135.3.1快速入门

实施POF（确保使用`functions`软件包）：

```
package functions;

import java.util.function.Function;

public class Uppercase implements Function<String, String> {

	public String apply(String input) {
		return input.toUpperCase();
	}
}
```

将其安装到本地Maven存储库中：

```
./mvnw clean install
```

创建一个提供其Maven坐标的`function.properties`文件。例如：

```
dependencies.function: com.example:pof:0.0.1-SNAPSHOT
```

将openwhisk运行程序JAR复制到工作目录（与属性文件相同的目录）：

```
cp spring-cloud-function-adapters/spring-cloud-function-adapter-openwhisk/target/spring-cloud-function-adapter-openwhisk-2.0.0.BUILD-SNAPSHOT.jar runner.jar
```

使用上述属性文件从运行器JAR的`--thin.dryrun`生成一个m2回购：

```
java -jar -Dthin.root=m2 runner.jar --thin.name=function --thin.dryrun
```

使用以下Dockerfile：

```
FROM openjdk:8-jdk-alpine
VOLUME /tmp
COPY m2 /m2
ADD runner.jar .
ADD function.properties .
ENV JAVA_OPTS=""
ENTRYPOINT [ "java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "runner.jar", "--thin.root=/m2", "--thin.name=function", "--function.name=uppercase"]
EXPOSE 8080
```

> | ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
> | ------------------------------------------------------------ |
> | 您可以使用Spring Cloud Function应用程序，而不是仅使用带有POF的jar，在这种情况下，您必须更改应用程序在容器中的运行方式，以便它将主类用作源文件。例如，您可以更改上面的`ENTRYPOINT`并添加`--spring.main.sources=com.example.SampleApplication`。 |

构建Docker映像：

```
docker build -t [username/appname] .
```

推送Docker映像：

```
docker push [username/appname]
```

使用OpenWhisk CLI（例如，在`vagrant ssh`之后）创建操作：

```
wsk action create example --docker [username/appname]
```

调用动作：

```
wsk action invoke example --result --param payload foo
{
    "result": "FOO"
}
```

# 第十七部分。Spring Cloud Kubernetes

本参考指南介绍了如何使用Spring Cloud Kubernetes。

## 136.为什么需要Spring Cloud Kubernetes？

Spring Cloud Kubernetes提供了使用Kubernetes本机服务的Spring Cloud通用接口实现。该存储库中提供的项目的主要目的是促进Kubernetes中运行的Spring Cloud和Spring Boot应用程序的集成。

## 137. Starters

Starters是方便的依赖项描述符，您可以在应用程序中包含它们。包括启动器以获取依赖关系和功能集的Spring Boot自动配置。

| 起动机                                                       | 特征                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| `<dependency>    <groupId>org.springframework.cloud</groupId>    <artifactId>spring-cloud-starter-kubernetes</artifactId> </dependency>` | [Discovery Client](https://www.springcloud.cc/spring-cloud-greenwich.html#_discoveryclient_for_kubernetes) implementation that resolves service names to Kubernetes Services. |
| `<dependency>    <groupId>org.springframework.cloud</groupId>    <artifactId>spring-cloud-starter-kubernetes-config</artifactId> </dependency>` | Load application properties from Kubernetes [ConfigMaps](https://www.springcloud.cc/spring-cloud-greenwich.html#) and [Secrets](https://www.springcloud.cc/spring-cloud-greenwich.html#_secrets_propertysource). [Reload](https://www.springcloud.cc/spring-cloud-greenwich.html#) application properties when a ConfigMap or Secret changes. |
| `<dependency>    <groupId>org.springframework.cloud</groupId>    <artifactId>spring-cloud-starter-kubernetes-ribbon</artifactId> </dependency>` | [Ribbon](https://www.springcloud.cc/spring-cloud-greenwich.html#) client-side load balancer with server list obtained from Kubernetes Endpoints. |
| `<dependency>    <groupId>org.springframework.cloud</groupId>    <artifactId>spring-cloud-starter-kubernetes-all</artifactId> </dependency>` | All Spring Cloud Kubernetes features.                        |

## 138. Kubernetes的DiscoveryClient

该项目提供了[Kubernetes](https://kubernetes.io/)的[Discovery Client](https://github.com/spring-cloud/spring-cloud-commons/blob/master/spring-cloud-commons/src/main/java/org/springframework/cloud/client/discovery/DiscoveryClient.java) 的[实现](https://kubernetes.io/)。通过此客户端，您可以按名称查询Kubernetes端点（请参阅[服务](https://kubernetes.io/docs/user-guide/services/)）。Kubernetes API服务器通常将服务公开为代表`http`和`https`地址的端点的集合，并且客户端可以从作为Pod运行的Spring Boot应用程序进行访问。Spring Cloud Kubernetes Ribbon项目也使用此发现功能来获取为要进行负载平衡的应用程序定义的端点列表。

您可以通过在项目内部添加以下依赖项来免费获得这些东西：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-kubernetes</artifactId>
</dependency>
```

要启用`DiscoveryClient`的加载，请将`@EnableDiscoveryClient`添加到相应的配置或应用程序类中，如以下示例所示：

```
@SpringBootApplication
@EnableDiscoveryClient
public class Application {
  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }
}
```

然后，您可以简单地通过自动装配将客户端注入代码中，如以下示例所示：

```
@Autowired
private DiscoveryClient discoveryClient;
```

您可以通过在`application.properties`中设置以下属性来选择从所有命名空间启用`DiscoveryClient`：

```
spring.cloud.kubernetes.discovery.all-namespaces=true
```

如果出于任何原因需要禁用`DiscoveryClient`，则可以在`application.properties`中设置以下属性：

```
spring.cloud.kubernetes.discovery.enabled=false
```

某些Spring Cloud组件使用`DiscoveryClient`来获取有关本地服务实例的信息。为此，您需要将Kubernetes服务名称与`spring.application.name`属性对齐。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| `spring.application.name`对在Kubernetes中为该应用程序注册的名称无效 |

Spring Cloud Kubernetes也可以监视Kubernetes服务目录中的更改并相应地更新`DiscoveryClient`实现。为了启用此功能，您需要在应用程序的配置类上添加`@EnableScheduling`。

## 139. Kubernetes本机服务发现

Kubernetes本身具有（服务器端）服务发现的能力（请参阅：[https](https://kubernetes.io/docs/concepts/services-networking/service/#discovering-services) ://kubernetes.io/docs/concepts/services-networking/service/#discovering-services ）。使用本机kubernetes服务发现可确保与其他工具的兼容性，例如Istio（[https://istio.io](https://istio.io/)），该服务网格可实现负载平衡，功能区，断路器，故障转移等。

然后，调用者服务仅需要引用特定Kubernetes群集中可解析的名称。一个简单的实现可以使用Spring`RestTemplate`来引用完全限定域名（FQDN），例如`https://{service-name}.{namespace}.svc.{cluster}.local:{service-port}`。

此外，您可以将Hystrix用于：

- 通过用`@EnableCircuitBreaker`注释spring boot应用程序类，在调用方实现断路器
- 后备功能，通过用`@HystrixCommand(fallbackMethod=`注释相应的方法

## 140. Kubernetes PropertySource实现

配置Spring Boot应用程序的最常用方法是创建一个`application.properties`或`applicaiton.yaml`或`application-profile.properties`或`application-profile.yaml`文件，其中包含为应用程序提供自定义值的键值对或Spring Boot首发。您可以通过指定系统属性或环境变量来覆盖这些属性。

## 140.1使用`ConfigMap` `PropertySource`

Kubernetes提供了一个资源[`ConfigMap`](https://kubernetes.io/docs/user-guide/configmap/)，用于以键值对形式或嵌入的`application.properties`或`application.yaml`文件的形式来外部化要传递给您的应用程序的参数。在[Spring Cloud Kubernetes配置](https://www.springcloud.cc/spring-cloud-kubernetes-config)项目使得Kubernetes `ConfigMap`实例中应用自举可用和触发器时观察到`ConfigMap`实例中检测到的变化热重装beans或Spring上下文。

默认行为是根据Kubernetes `ConfigMap`创建一个`ConfigMapPropertySource`，其值是Spring应用程序名称（由其`spring.application.name`属性定义）的`metadata.name`值，或者在`bootstrap.properties`文件中的以下关键字下定义的自定义名称：`spring.cloud.kubernetes.config.name`。

但是，可以在其中使用多个`ConfigMap`实例的情况下进行更高级的配置。`spring.cloud.kubernetes.config.sources`列表使之成为可能。例如，您可以定义以下`ConfigMap`实例：

```
spring:
  application:
    name: cloud-k8s-app
  cloud:
    kubernetes:
      config:
        name: default-name
        namespace: default-namespace
        sources:
         # Spring Cloud Kubernetes looks up a ConfigMap named c1 in namespace default-namespace
         - name: c1
         # Spring Cloud Kubernetes looks up a ConfigMap named default-name in whatever namespace n2
         - namespace: n2
         # Spring Cloud Kubernetes looks up a ConfigMap named c3 in namespace n3
         - namespace: n3
           name: c3
```

在前面的示例中，如果未设置`spring.cloud.kubernetes.config.namespace`，则将在应用程序运行的名称空间中查找名为`c1`的`ConfigMap`。

找到的所有匹配`ConfigMap`都将按以下方式处理：

- 应用单个配置属性。
- 将名为`application.yaml`的任何属性的内容用作`yaml`。
- 将名为`application.properties`的任何属性的内容用作属性文件。

上述流程的唯一例外是`ConfigMap`包含**单个**密钥，该密钥指示文件是YAML或属性文件。在这种情况下，键的名称不必是`application.yaml`或`application.properties`（可以是任何东西），并且属性值可以正确处理。此功能有助于使用以下情况创建`ConfigMap`的用例：

```
kubectl create configmap game-config --from-file=/path/to/app-config.yaml
```

假设我们有一个名为`demo`的Spring Boot应用程序，它使用以下属性读取其线程池配置。

- `pool.size.core`
- `pool.size.maximum`

可以将其外部化为`yaml`格式的配置映射，如下所示：

```
kind: ConfigMap
apiVersion: v1
metadata:
  name: demo
data:
  pool.size.core: 1
  pool.size.max: 16
```

在大多数情况下，单个属性都可以正常工作。但是，有时嵌入`yaml`会更方便。在这种情况下，我们使用名为`application.yaml`的单个属性来嵌入`yaml`，如下所示：

```
kind: ConfigMap
apiVersion: v1
metadata:
  name: demo
data:
  application.yaml: |-
    pool:
      size:
        core: 1
        max:16
```

以下示例也适用：

```
kind: ConfigMap
apiVersion: v1
metadata:
  name: demo
data:
  custom-name.yaml: |-
    pool:
      size:
        core: 1
        max:16
```

您还可以根据读取`ConfigMap`时合并在一起的活动配置文件来不同地配置Spring Boot应用程序。您可以通过使用`application.properties`或`application.yaml`属性，为特定的配置文件提供不同的属性值，并在他们自己的文档中指定特定于配置文件的值（由`---`序列指示），如下所示：

```
kind: ConfigMap
apiVersion: v1
metadata:
  name: demo
data:
  application.yml: |-
    greeting:
      message: Say Hello to the World
    farewell:
      message: Say Goodbye
    ---
    spring:
      profiles: development
    greeting:
      message: Say Hello to the Developers
    farewell:
      message: Say Goodbye to the Developers
    ---
    spring:
      profiles: production
    greeting:
      message: Say Hello to the Ops
```

在上述情况下，使用`development`配置文件加载到Spring应用程序中的配置如下：

```
  greeting:
    message: Say Hello to the Developers
  farewell:
    message: Say Goodbye to the Developers
```

但是，如果`production`配置文件处于活动状态，则配置将变为：

```
  greeting:
    message: Say Hello to the Ops
  farewell:
    message: Say Goodbye
```

如果两个配置文件均处于活动状态，则在`ConfigMap`中最后出现的属性将覆盖之前的所有值。

另一个选择是为每个配置文件创建一个不同的配置映射，spring boot将根据活动的配置文件自动获取它

```
kind: ConfigMap
apiVersion: v1
metadata:
  name: demo
data:
  application.yml: |-
    greeting:
      message: Say Hello to the World
    farewell:
      message: Say Goodbye
kind: ConfigMap
apiVersion: v1
metadata:
  name: demo-development
data:
  application.yml: |-
    spring:
      profiles: development
    greeting:
      message: Say Hello to the Developers
    farewell:
      message: Say Goodbye to the Developers
kind: ConfigMap
apiVersion: v1
metadata:
  name: demo-production
data:
  application.yml: |-
    spring:
      profiles: production
    greeting:
      message: Say Hello to the Ops
    farewell:
      message: Say Goodbye
```

要告诉Spring Boot应该在引导程序中启用哪个`profile`，可以将系统属性传递给Java命令。为此，您可以使用环境变量来启动Spring Boot应用程序，该环境变量可以通过OpenShift `DeploymentConfig`或Kubernetes `ReplicationConfig`资源文件进行定义，如下所示：

```
apiVersion: v1
kind: DeploymentConfig
spec:
  replicas: 1
  ...
    spec:
      containers:
      - env:
        - name: JAVA_APP_DIR
          value: /deployments
        - name: JAVA_OPTIONS
          value: -Dspring.profiles.active=developer
```

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 您应该检查安全性配置部分。要从Pod内部访问配置映射，您需要具有正确的Kubernetes服务帐户，角色和角色绑定。 |

使用`ConfigMap`实例的另一种选择是通过运行Spring Cloud Kubernetes应用程序并使Spring Cloud Kubernetes从文件系统读取它们来将它们装入Pod。此行为由`spring.cloud.kubernetes.config.paths`属性控制。您可以使用它作为上述机制的补充或替代。您可以使用`,`定界符在`spring.cloud.kubernetes.config.paths`中指定多个（精确）文件路径。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 您必须提供每个属性文件的完整确切路径，因为不会递归解析目录。 |



**表140.1。Properties:**

| 名称                                       | 类型      | 默认                         | 描述                                 |
| ------------------------------------------ | --------- | ---------------------------- | ------------------------------------ |
| `SPRING.CLOUD.KUBERNETES.CONFIG.ENABLEAPI` | `BOOLEAN` | `TRUE`                       | 通过API启用或禁用使用`CONFIGMAP`实例 |
| `spring.cloud.kubernetes.config.enabled`   | `Boolean` | `true`                       | 启用ConfigMaps `PropertySource`      |
| `spring.cloud.kubernetes.config.name`      | `String`  | `${spring.application.name}` | 设置`ConfigMap`的名称以查找          |
| `spring.cloud.kubernetes.config.namespace` | `String`  | 客户端名称空间               | 设置Kubernetes命名空间在哪里查找     |
| `spring.cloud.kubernetes.config.paths`     | `List`    | `null`                       | 设置安装`ConfigMap`实例的路径        |



## 140.2秘密PropertySource

Kubernetes具有用于存储敏感数据（例如密码，OAuth令牌等）的[秘密](https://kubernetes.io/docs/concepts/configuration/secret/)的概念。该项目提供了与`Secrets`的集成，以使Spring Boot应用程序可以访问机密。您可以通过设置`spring.cloud.kubernetes.secrets.enabled`属性来显式启用或禁用此功能。

启用后，`SecretsPropertySource`将从以下来源中为`Secrets`查找Kubernetes：

1. 从秘密坐骑递归读取
2. 以应用程序命名（由`spring.application.name`定义）
3. 匹配一些标签

**注意：**

默认情况下，出于安全原因，**未启用**通过API消费机密（以上第2点和第3点）。机密上的权限“列表”允许客户端检查指定名称空间中的机密值。此外，我们建议容器通过安装的卷共享机密。

如果您通过API启用使用机密，我们建议您使用授权策略（例如RBAC）限制对机密的访问。有关通过API使用“机密”时的风险和最佳做法的更多信息，请参阅[此文档](https://kubernetes.io/docs/concepts/configuration/secret/#best-practices)。

如果找到了机密，则其数据可供应用程序使用。

假设我们有一个名为`demo`的spring boot应用程序，该应用程序使用属性读取其数据库配置。我们可以使用以下命令创建Kubernetes机密：

```
oc create secret generic db-secret --from-literal=username=user --from-literal=password=p455w0rd
```

前面的命令将创建以下秘密（您可以使用`oc get secrets db-secret -o yaml`来查看）：

```
apiVersion: v1
data:
  password: cDQ1NXcwcmQ=
  username: dXNlcg==
kind: Secret
metadata:
  creationTimestamp: 2017-07-04T09:15:57Z
  name: db-secret
  namespace: default
  resourceVersion: "357496"
  selfLink: /api/v1/namespaces/default/secrets/db-secret
  uid: 63c89263-6099-11e7-b3da-76d6186905a8
type: Opaque
```

请注意，数据包含`create`命令提供的文字的Base64编码版本。

然后，您的应用程序可以使用此秘密-例如，通过将秘密的值导出为环境变量：

```
apiVersion: v1
kind: Deployment
metadata:
  name: ${project.artifactId}
spec:
   template:
     spec:
       containers:
         - env:
            - name: DB_USERNAME
              valueFrom:
                 secretKeyRef:
                   name: db-secret
                   key: username
            - name: DB_PASSWORD
              valueFrom:
                 secretKeyRef:
                   name: db-secret
                   key: password
```

您可以通过多种方式选择要使用的秘密：

1. 通过列出映射机密的目录：

   ```
   -Dspring.cloud.kubernetes.secrets.paths=/etc/secrets/db-secret,etc/secrets/postgresql
   ```

   如果您已将所有机密映射到公共根，则可以将它们设置为：

   ```
   -Dspring.cloud.kubernetes.secrets.paths=/etc/secrets
   ```

2. 通过设置命名机密：

   ```
   -Dspring.cloud.kubernetes.secrets.name=db-secret
   ```

3. 通过定义标签列表：

   ```
   -Dspring.cloud.kubernetes.secrets.labels.broker=activemq
   -Dspring.cloud.kubernetes.secrets.labels.db=postgresql
   ```



**表140.2。Properties:**

| 名称                                        | 类型      | 默认                         | 描述                                  |
| ------------------------------------------- | --------- | ---------------------------- | ------------------------------------- |
| `SPRING.CLOUD.KUBERNETES.SECRETS.ENABLEAPI` | `BOOLEAN` | `FALSE`                      | 通过API启用或禁用使用机密（示例2和3） |
| `spring.cloud.kubernetes.secrets.enabled`   | `Boolean` | `true`                       | 启用机密`PropertySource`              |
| `spring.cloud.kubernetes.secrets.name`      | `String`  | `${spring.application.name}` | 设置要查找的机密名称                  |
| `spring.cloud.kubernetes.secrets.namespace` | `String`  | 客户端名称空间               | 设置Kubernetes命名空间的查找位置      |
| `spring.cloud.kubernetes.secrets.labels`    | `Map`     | `null`                       | 设置用于查找机密的标签                |
| `spring.cloud.kubernetes.secrets.paths`     | `List`    | `null`                       | 设置安装机密的路径（示例1）           |



笔记：

- `spring.cloud.kubernetes.secrets.labels`属性的行为如[基于Map的绑定](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-Configuration-Binding#map-based-binding)所定义 。
- `spring.cloud.kubernetes.secrets.paths`属性的行为与[基于Collection的binding](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-Configuration-Binding#collection-based-binding)定义的行为相同 。
- 出于安全原因，可能会限制通过API访问机密。首选方法是将机密安装到Pod。

您可以在[spring-boot-camel-config中](https://github.com/fabric8-quickstarts/spring-boot-camel-config)找到使用机密的应用程序示例（尽管尚未更新以使用新的`spring-cloud-kubernetes`项目）。

## 140.3 `PropertySource`重新加载

某些应用程序可能需要检测外部属性源上的更改并更新其内部状态以反映新配置。当相关的`ConfigMap`或`Secret`发生更改时，Spring Cloud Kubernetes的重载功能能够触发应用程序重载。

默认情况下，此功能处于禁用状态。您可以使用`spring.cloud.kubernetes.reload.enabled=true`配置属性（例如，在`application.properties`文件中）启用它。

支持以下级别的重载（通过设置`spring.cloud.kubernetes.reload.strategy`属性）：* `refresh`（默认）：仅重载用`@ConfigurationProperties`或`@RefreshScope`注释的配置beans。此重新加载级别利用了Spring Cloud上下文的刷新功能。* `restart_context`：整个Spring `ApplicationContext`已正常重启。用新配置重新创建Beans。* `shutdown`：Spring `ApplicationContext`已关闭，以激活容器的重启。使用此级别时，请确保所有非守护程序线程的生命周期都绑定到`ApplicationContext`，并且已将复制控制器或副本集配置为重新启动Pod。

假设使用默认设置（`refresh`模式）启用了重新加载功能，则当配置映射更改时，将刷新以下bean：

```
@Configuration
@ConfigurationProperties(prefix = "bean")
public class MyConfig {

    private String message = "a message that can be changed live";

    // getter and setters

}
```

要查看更改是否有效发生，您可以创建另一个bean来定期打印消息，如下所示

```
@Component
public class MyBean {

    @Autowired
    private MyConfig config;

    @Scheduled(fixedDelay = 5000)
    public void hello() {
        System.out.println("The message is: " + config.getMessage());
    }
}
```

您可以使用`ConfigMap`来更改应用程序打印的消息，如下所示：

```
apiVersion: v1
kind: ConfigMap
metadata:
  name: reload-example
data:
  application.properties: |-
    bean.message=Hello World!
```

与容器关联的`ConfigMap`中名为`bean.message`的属性的任何更改都会反映在输出中。更一般而言，将检测与属性相关联的更改，这些更改的前缀为`@ConfigurationProperties`注释的`prefix`字段定义的值。 本章前面已经说明[了将`ConfigMap`与pod关联](https://www.springcloud.cc/spring-cloud-greenwich.html#configmap-propertysource)。

完整的示例可在中找到[`spring-cloud-kubernetes-reload-example`](https://github.com/fabric8io/spring-cloud-kubernetes/tree/master/spring-cloud-kubernetes-examples/kubernetes-reload-example)。

重新加载功能支持两种操作模式：*事件（默认）：使用Kubernetes API（web套接字）监视配置映射或机密的更改。任何事件都会对配置进行重新检查，并在发生更改的情况下重新加载。服务帐户上的`view`角色是必需的，以便侦听配置映射更改。秘密需要更高级别的角色（例如`edit`）（默认情况下，不监视秘密）。*轮询：从配置上通过配置映射和机密重新创建配置，以查看配置是否已更改。您可以使用`spring.cloud.kubernetes.reload.period`属性来配置轮询时间，默认为15秒。它需要与受监视属性源相同的角色。例如，这意味着对文件挂载的秘密源使用轮询不需要特定的特权。



**表140.3。Properties:**

| 名称                                                    | 类型       | 默认      | 描述                                                         |
| ------------------------------------------------------- | ---------- | --------- | ------------------------------------------------------------ |
| `SPRING.CLOUD.KUBERNETES.RELOAD.PERIOD`                 | `DURATION` | `15S`     | 使用`POLLING`策略时验证更改的期限                            |
| `spring.cloud.kubernetes.reload.enabled`                | `Boolean`  | `false`   | 启用监视属性源和配置重载                                     |
| `spring.cloud.kubernetes.reload.monitoring-config-maps` | `Boolean`  | `true`    | 允许监视配置映射中的更改                                     |
| `spring.cloud.kubernetes.reload.monitoring-secrets`     | `Boolean`  | `false`   | 允许监视机密更改                                             |
| spring.cloud.kubernetes.reload.strategy`                | `Enum`     | `refresh` | 触发重新加载时使用的策略（`refresh`，`restart_context`或`shutdown`） |
| `spring.cloud.kubernetes.reload.mode`                   | `Enum`     | `event`   | 指定如何侦听属性源（`event`或`polling`）中的更改             |



注意：*请勿在配置映射或机密中使用`spring.cloud.kubernetes.reload`下的属性。在运行时更改此类属性可能会导致意外结果。*使用`refresh`级别时，删除属性或整个配置图不会恢复beans的原始状态。

## 141. Ribbon在Kubernetes中发现

Spring Cloud调用微服务的客户端应用程序应该对依靠客户端负载平衡功能感兴趣，以便自动发现它可以在哪个端点到达给定服务。该机制已在[spring-cloud-kubernetes-ribbon](https://github.com/spring-cloud/spring-cloud-kubernetes/tree/master/spring-cloud-kubernetes-ribbon)项目中实现，其中Kubernetes客户端填充[Ribbon](https://github.com/Netflix/ribbon) `ServerList`，其中包含有关此类端点的信息。

该实现是以下启动器的一部分，可以通过将其依赖项添加到pom文件中来使用该实现：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-kubernetes-ribbon</artifactId>
    <version>${latest.version}</version>
</dependency>
```

填充端点列表后，Kubernetes客户端通过匹配Ribbon Client批注中定义的服务名称来搜索位于当前名称空间或项目中的已注册端点，如下所示：

```
@RibbonClient(name = "name-service")
```

您可以使用以下格式，在`application.properties`中（通过应用程序专用的`ConfigMap`）提供属性，以配置Ribbon的行为：`<name of your service>.ribbon.<Ribbon configuration key>`，其中：

- `<name of your service>`对应于您在Ribbon上访问的服务名称，该名称是使用`@RibbonClient`批注配置的（例如上例中的`name-service`）。
- `<Ribbon configuration key>`是[Ribbon的`CommonClientConfigKey`类](https://github.com/Netflix/ribbon/blob/master/ribbon-core/src/main/java/com/netflix/client/config/CommonClientConfigKey.java)定义的Ribbon配置键之一 。

此外，`spring-cloud-kubernetes-ribbon`项目定义了两个附加的配置键，以进一步控制Ribbon与Kubernetes的交互方式。特别是，如果端点定义了多个端口，则默认行为是使用找到的第一个端口。要更具体地选择在多端口服务中使用哪个端口，可以使用【7 /】键。如果您想指定应在哪个Kubernetes命名空间中查找目标服务，则可以使用`KubernetesNamespace`键，在这两个实例中都记住要为这些键加上您的服务名和`ribbon`前缀（如前所述）。

以下示例使用此模块进行功能区发现：

- [Spring Cloud断路器和Ribbon](https://www.springcloud.cc/spring-cloud-kubernetes-examples/kubernetes-circuitbreaker-ribbon-example)
- [fabric8-quickstarts-Spring Boot-Ribbon](https://github.com/fabric8-quickstarts/spring-boot-ribbon)
- [Kubeflix-贷款经纪人-银行](https://github.com/fabric8io/kubeflix/tree/master/examples/loanbroker/bank)

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 您可以通过在应用程序属性文件中设置`spring.cloud.kubernetes.ribbon.enabled=false`键来禁用Ribbon发现客户端。 |

## 142. Kubernetes生态系统意识

无论您的应用程序是否在Kubernetes中运行，本指南前面介绍的所有功能都可以很好地工作。这对于开发和故障排除确实很有帮助。从开发角度来看，这使您可以启动Spring Boot应用程序并调试属于该项目的模块之一。您无需在Kubernetes中部署它，因为该项目的代码依赖于 [Fabric8 Kubernetes Java客户端](https://github.com/fabric8io/kubernetes-client)，该[客户端](https://github.com/fabric8io/kubernetes-client)是流利的DSL，可以使用`http`协议与Kubernetes Server的REST API进行通信。

要禁用与Kubernetes的集成，可以将`spring.cloud.kubernetes.enabled`设置为`false`。请注意，当`spring-cloud-kubernetes-config`在类路径上时，应在`bootstrap.{properties|yml}`（或特定于配置文件的文件）中设置`spring.cloud.kubernetes.enabled`，否则应在`application.{properties|yml}`（或特定于配置文件的文件）中进行设置。另请注意，以下属性：`spring.cloud.kubernetes.config.enabled`和`spring.cloud.kubernetes.secrets.enabled`仅在`bootstrap.{properties|yml}`中设置时才生效

## 142.1 Kubernetes配置文件自动配置

当应用程序在Kubernetes中作为pod运行时，名为`kubernetes`的Spring配置文件将自动被激活。这使您可以自定义配置，以定义在Kubernetes平台中部署Spring Boot应用程序时要应用的beans（例如，不同的开发和生产配置）。

## 142.2 Istio意识

当您在应用程序类路径的`spring-cloud-kubernetes-istio`模块，新的配置文件被添加到应用程序，提供的应用运行在Kubernetes集群里面[Istio](https://istio.io/)安装。然后，您可以在Beans和`@Configuration`类中使用spring `@Profile("istio")`注释。

Istio感知模块使用`me.snowdrop:istio-client`与Istio API进行交互，让我们发现流量规则，断路器等，从而使我们的Spring Boot应用程序更容易使用此数据来根据环境动态配置自身。

## 143.豆荚健康指标

Spring Boot用于[`HealthIndicator`](https://github.com/spring-projects/spring-boot/blob/master/spring-boot-project/spring-boot-actuator/src/main/java/org/springframework/boot/actuate/health/HealthEndpoint.java)公开有关应用程序运行状况的信息。这对于将与健康相关的信息提供给用户非常有用，并且非常适合用作[就绪探针](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/)。

Kubernetes运行状况指示器（是核心模块的一部分）公开以下信息：

- 窗格名称，IP地址，名称空间，服务帐户，节点名称及其IP地址
- 一个标志，指示Spring Boot应用程序是Kubernetes的内部应用程序还是外部应用程序

## 144. Leader选举

<待定>

## 145. Kubernetes内部的安全配置

## 145.1命名空间

该项目中提供的大多数组件都需要知道名称空间。对于Kubernetes（1.3+），名称空间作为服务帐户密码的一部分可供Pod使用，并由客户端自动检测到。对于早期版本，需要将其指定为Pod的环境变量。一种快速的方法如下：

```
      env:
      - name: "KUBERNETES_NAMESPACE"
        valueFrom:
          fieldRef:
            fieldPath: "metadata.namespace"
```

## 145.2服务帐号

对于支持集群内基于角色的更细粒度访问的Kubernetes发行版，您需要确保以`spring-cloud-kubernetes`运行的Pod有权访问Kubernetes API。对于您分配给部署或Pod的任何服务帐户，您需要确保它们具有正确的角色。例如，您可以根据您所在的项目向您的`default`服务帐户添加`cluster-reader`权限。

## 146.服务注册中心的实施

在Kubernetes服务注册由平台控制的情况下，应用程序本身不像其他平台那样控制注册。因此，在Spring Cloud Kubernetes中使用`spring.cloud.service-registry.auto-registration.enabled`或设置`@EnableDiscoveryClient(autoRegister=false)`无效。

## 147.范例

Spring Cloud Kubernetes尝试通过遵循Spring Cloud接口，使应用程序使用Kubernetes Native Services透明化。

在您的应用程序中，您需要向类路径中添加`spring-cloud-kubernetes-discovery`依赖项，并删除包含`DiscoveryClient`实现的任何其他依赖项（即，一个Eureka发现客户端）。`PropertySourceLocator`的情况与此相同，您需要在其中将`spring-cloud-kubernetes-config`添加到类路径，并删除包含`PropertySourceLocator`实现的其他任何依赖项（即配置服务器客户端）。

以下项目重点介绍了这些依赖项的用法，并演示了如何从任何Spring Boot应用程序中使用这些库：

- [Spring Cloud Kubernetes示例](https://github.com/spring-cloud/spring-cloud-kubernetes/tree/master/spring-cloud-kubernetes-examples)：位于此存储库中的[示例](https://github.com/spring-cloud/spring-cloud-kubernetes/tree/master/spring-cloud-kubernetes-examples)。
- Spring Cloud Kubernetes完整示例：奴才和老板
  - [奴才](https://github.com/salaboy/spring-cloud-k8s-minion)
  - [老板](https://github.com/salaboy/spring-cloud-k8s-boss)
- Spring Cloud Kubernetes完整示例：[SpringOne Platform Tickets Service](https://github.com/salaboy/s1p_docs)
- [具有Spring Cloud Kubernetes发现和配置的Spring Cloud网关](https://github.com/salaboy/s1p_gateway)
- [Spring Boot使用Spring Cloud进行Kubernetes发现和配置的管理员](https://github.com/salaboy/showcase-admin-tool)

## 148.其他资源

本节列出了其他资源，例如有关Spring Cloud Kubernetes的演示（幻灯片）和视频。

- [PKS上的S1P Spring Cloud](https://salaboy.com/2018/09/27/the-s1p-experience/)
- [Spring Cloud，Docker，Kubernetes→伦敦Java社区，2018年7月](https://salaboy.com/2018/07/18/ljc-july-18-spring-cloud-docker-k8s/)

请随时通过拉取请求向[此存储库](https://github.com/spring-cloud/spring-cloud-kubernetes)提交其他资源。

## 149.建筑

## 149.1基本编译和测试

要构建源代码，您将需要安装JDK 1.7。

Spring Cloud将Maven用于大多数与构建相关的活动，并且应该可以通过克隆您感兴趣的项目并键入来快速开始工作

```
$ ./mvnw install
```

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 您还可以自己安装Maven（> = 3.3.3），并在下面的示例中运行`mvn`命令代替`./mvnw`。如果这样做，则您的本地Maven设置不包含Spring预发行项目的存储库声明，则可能还需要添加`-P spring`。 |

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 请注意，您可能需要通过将`MAVEN_OPTS`环境变量设置为类似`-Xmx512m -XX:MaxPermSize=128m`的值来增加Maven的可用内存量。我们尝试在`.mvn`配置中进行介绍，因此，如果您必须执行此操作才能使构建成功，请提出票证以将设置添加到源代码管理中。 |

有关如何构建项目的提示，请查看`.travis.yml`（如果有）。应该有一个“脚本”，也许还有“安装”命令。另外，请查看“服务”部分，以查看是否需要在本地运行任何服务（例如mongo或Rabbit）。忽略您可能在“ before_install”中找到的与git相关的位，因为它们与设置git凭据有关，并且您已经拥有了这些凭据。

需要中间件的项目通常包括`docker-compose.yml`，因此请考虑使用 [Docker Compose](https://docs.docker.com/compose/)在Docker容器中运行中间件服务器。有关mongo，rabbit和redis常见情况的特定说明，请参见[脚本演示存储库中](https://github.com/spring-cloud-samples/scripts)的README 。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 如果所有其他方法均失败，请使用`.travis.yml`（通常为`./mvnw install`）中的命令进行构建。 |

## 149.2文档

spring-cloud-build模块有一个“ docs”配置文件，如果打开它，将尝试从`src/main/asciidoc`构建asciidoc源。作为该过程的一部分，它将寻找`README.adoc`并通过加载所有包含文件来对其进行处理，但不对其进行解析或渲染，只需将其复制到`${main.basedir}`（默认为`$../../../..`，即根目录）即可。该项目）。如果自述文件有任何更改，它将在Maven构建后显示为正确位置的修改文件。只需提交并推动更改即可。

## 149.3使用代码

如果您没有IDE偏好设置，我们建议您在使用代码时使用 [Spring Tools Suite](https://www.springsource.com/developer/sts)或 [Eclipse](https://eclipse.org/)。我们使用 [m2eclipse](https://eclipse.org/m2e/) eclipse插件来获得maven支持。只要其他IDE和工具使用Maven 3.3.3或更高版本，它们也应该可以正常工作。

### 149.3.1使用m2eclipse导入eclipse

当使用eclipse时，我们建议使用[m2eclipse](https://eclipse.org/m2e/) eclipse插件。如果尚未安装m2eclipse，则可以从“ eclipse市场”中获得。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 较旧的m2e版本不支持Maven 3.3，因此一旦将项目导入Eclipse，您还需要告诉m2eclipse为项目使用正确的配置文件。如果您在项目中看到许多与POM相关的错误，请检查您是否具有最新的安装。如果您无法升级m2e，请将“ spring”配置文件添加到`settings.xml`中。或者，您可以将存储库设置从父pom的“ spring”配置文件复制到`settings.xml`中。 |

### 149.3.2不带m2eclipse导入eclipse

如果您不想使用m2eclipse，则可以使用以下命令生成eclipse项目元数据：

```
$ ./mvnw eclipse:eclipse
```

可以通过从`file`菜单中选择`import existing projects`来导入生成的日食项目。

## 150.贡献

Spring Cloud是在非限制性Apache 2.0许可下发布的，遵循非常标准的Github开发流程，使用Github跟踪程序解决问题并将合并请求合并到master中。如果您想贡献些微不足道的东西，请不要犹豫，但请遵循以下准则。

## 150.1签署贡献者许可协议

在我们接受不重要的补丁或请求请求之前，我们将需要您签署“ [贡献者许可协议”](https://cla.pivotal.io/sign/spring)。签署贡献者协议并不会授予任何人对主存储库的提交权，但这确实意味着我们可以接受您的贡献，如果这样做，您将获得作者的荣誉。可能会要求活跃的贡献者加入核心团队，并具有合并合并请求的能力。

## 150.2行为准则

该项目遵守《贡献者公约》[行为守则](https://github.com/spring-cloud/spring-cloud-build/blob/master/docs/src/main/asciidoc/code-of-conduct.adoc)。通过参与，您将遵守此代码。请向[spring-code-of-conduct@pivotal.io](mailto:spring-code-of-conduct@pivotal.io)报告不可接受的行为。

## 150.3编码约定和客房整理

其中的None对于请求请求至关重要，但它们都会有所帮助。也可以在原始请求请求之后但在合并之前添加它们。

- 使用Spring Framework代码格式约定。如果您使用Eclipse，则可以使用[Spring Cloud Build](https://raw.githubusercontent.com/spring-cloud/spring-cloud-build/master/spring-cloud-dependencies-parent/eclipse-code-formatter.xml)项目中的`eclipse-code-formatter.xml`文件导入格式化程序设置 。如果使用IntelliJ，则可以使用 [Eclipse Code Formatter插件](https://plugins.jetbrains.com/plugin/6546)来导入相同的文件。
- 确保所有新的`.java`文件都具有简单的Javadoc类注释，并至少带有一个`@author`标签来标识您，并且最好至少包含有关该类用途的段落。
- 将ASF许可证标头注释添加到所有新的`.java`文件（从项目中的现有文件复制）
- 将您自己作为`@author`添加到您进行了实质性修改（不仅仅是外观更改）的.java文件中。
- 添加一些Javadocs，如果更改名称空间，则添加一些XSD doc元素。
- 进行一些单元测试也有很大帮助-有人必须这样做。
- 如果没有其他人在使用您的分支，请根据当前的主节点（或主项目中的其他目标分支）对其进行重新设置。
- 编写提交消息时，请遵循[以下约定](https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html)，如果要解决现有问题，请在提交消息的末尾添加`Fixes gh-XXXX`（其中XXXX是问题编号）。

## 150.4 Checkstyle

Spring Cloud Build带有一组Checkstyle规则。您可以在`spring-cloud-build-tools`模块中找到它们。该模块下最值得注意的文件是：

**spring-cloud-build-tools /。** 

```
└── src
    ├── checkstyle
    │   └── checkstyle-suppressions.xml 
    └── main
        └── resources
            ├── checkstyle-header.txt 
            └── checkstyle.xml 
```



| [![3](/assets/images/springcloud/3.png?lastModify=1665880539)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO7-3) | 默认Checkstyle规则 |
| ------------------------------------------------------------ | ------------------ |
| [![2](/assets/images/springcloud/2.png?lastModify=1665880539)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO7-2) | 文件头设置         |
| [![1个](/assets/images/springcloud/1.png?lastModify=1665880539)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO7-1) | 默认抑制规则       |

### 150.4.1 Checkstyle配置

Checkstyle规则**默认**为**禁用**。要将checkstyle添加到项目中，只需定义以下属性和插件。

**pom.xml。** 

```
<properties>
<maven-checkstyle-plugin.failsOnError>true</maven-checkstyle-plugin.failsOnError> 
        <maven-checkstyle-plugin.failsOnViolation>true
        </maven-checkstyle-plugin.failsOnViolation> 
        <maven-checkstyle-plugin.includeTestSourceDirectory>true
        </maven-checkstyle-plugin.includeTestSourceDirectory> 
</properties>

<build>
        <plugins>
            <plugin> 
                <groupId>io.spring.javaformat</groupId>
                <artifactId>spring-javaformat-maven-plugin</artifactId>
            </plugin>
            <plugin> 
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-checkstyle-plugin</artifactId>
            </plugin>
        </plugins>

    <reporting>
        <plugins>
            <plugin> 
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-checkstyle-plugin</artifactId>
            </plugin>
        </plugins>
    </reporting>
</build>
```



| [![1个](/assets/images/springcloud/1.png?lastModify=1665880539)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO8-1) | 因Checkstyle错误而无法构建                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [![2](/assets/images/springcloud/2.png?lastModify=1665880539)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO8-2) | 因Checkstyle违规而无法构建                                   |
| [![3](/assets/images/springcloud/3.png?lastModify=1665880539)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO8-3) | Checkstyle还分析测试源                                       |
| [![4](/assets/images/springcloud/4.png?lastModify=1665880539)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO8-4) | 添加Spring Java格式插件，该插件将重新格式化您的代码以通过大多数Checkstyle格式设置规则 |
| [![5](/assets/images/springcloud/5.png?lastModify=1665880539)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO8-5) [![6](/assets/images/springcloud/6.png?lastModify=1665880539)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO8-6) | 将Checkstyle插件添加到您的构建和报告阶段                     |

如果您需要取消某些规则（例如，行长需要更长），那么只需在`${project.root}/src/checkstyle/checkstyle-suppressions.xml`下定义一个文件就可以了。例：

**projectRoot / src / checkstyle / checkstyle-suppresions.xml。** 

```
<?xml version="1.0"?>
<!DOCTYPE suppressions PUBLIC
		"-//Puppy Crawl//DTD Suppressions 1.1//EN"
		"https://www.puppycrawl.com/dtds/suppressions_1_1.dtd">
<suppressions>
	<suppress files=".*ConfigServerApplication\.java" checks="HideUtilityClassConstructor"/>
	<suppress files=".*ConfigClientWatch\.java" checks="LineLengthCheck"/>
</suppressions>
```



建议将`${spring-cloud-build.rootFolder}/.editorconfig`和`${spring-cloud-build.rootFolder}/.springformat`复制到您的项目中。这样，将应用一些默认格式设置规则。您可以通过运行以下脚本来这样做：

```
$ curl https://raw.githubusercontent.com/spring-cloud/spring-cloud-build/master/.editorconfig -o .editorconfig
$ touch .springformat
```

## 150.5 IDE设置

### 150.5.1 Intellij IDEA

为了设置Intellij，您应该导入我们的编码约定，检查配置文件并设置checkstyle插件。在[Spring Cloud Build](https://github.com/spring-cloud/spring-cloud-build/tree/master/spring-cloud-build-tools)项目中可以找到以下文件。

**spring-cloud-build-tools /。** 

```
└── src
    ├── checkstyle
    │   └── checkstyle-suppressions.xml 
    └── main
        └── resources
            ├── checkstyle-header.txt 
            ├── checkstyle.xml 
            └── intellij
                ├── Intellij_Project_Defaults.xml 
                └── Intellij_Spring_Boot_Java_Conventions.xml 
```



| [![3](/assets/images/springcloud/3.png?lastModify=1665880539)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO9-3) | 默认Checkstyle规则                                 |
| ------------------------------------------------------------ | -------------------------------------------------- |
| [![2](/assets/images/springcloud/2.png?lastModify=1665880539)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO9-2) | 文件头设置                                         |
| [![1个](/assets/images/springcloud/1.png?lastModify=1665880539)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO9-1) | 默认抑制规则                                       |
| [![4](/assets/images/springcloud/4.png?lastModify=1665880539)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO9-4) | 适用于大多数Checkstyle规则的Intellij项目默认值     |
| [![5](/assets/images/springcloud/5.png?lastModify=1665880539)](https://www.springcloud.cc/spring-cloud-greenwich.html#CO9-5) | 适用于大多数Checkstyle规则的Intellij的项目样式约定 |



**图150.1 代码风格**

![代码风格](/assets/images/springcloud/intellij-code-style.png?lastModify=1665880539)



转到`File`→`Settings`→`Editor`→`Code style`。单击`Scheme`部分旁边的图标。在那里，单击`Import Scheme`值，然后选择`Intellij IDEA code style XML`选项。导入`spring-cloud-build-tools/src/main/resources/intellij/Intellij_Spring_Boot_Java_Conventions.xml`文件。



**图150.2 检验概况**

![代码风格](/assets/images/springcloud/intellij-inspections.png?lastModify=1665880539)



转到`File`→`Settings`→`Editor`→`Inspections`。单击`Profile`部分旁边的图标。在此处单击`Import Profile`，然后导入`spring-cloud-build-tools/src/main/resources/intellij/Intellij_Project_Defaults.xml`文件。

**Checkstyle。** 要使Intellij与Checkstyle一起使用，您必须安装`Checkstyle`插件。建议还安装`Assertions2Assertj`以自动转换JUnit断言

![Checkstyle](/assets/images/springcloud/intellij-checkstyle.png?lastModify=1665880539)

转到`File`→`Settings`→`Other settings`→`Checkstyle`。在`Configuration file`部分中单击`+`图标。在这里，您必须定义应从何处选择checkstyle规则。在上图中，我们从克隆的Spring Cloud构建库中选择了规则。但是，您可以指向Spring Cloud构建的GitHub存储库（例如，对于`checkstyle.xml`：`https://raw.githubusercontent.com/spring-cloud/spring-cloud-build/master/spring-cloud-build-tools/src/main/resources/checkstyle.xml`）。我们需要提供以下变量：

- `checkstyle.header.file`-请在克隆的存储库中或通过`https://raw.githubusercontent.com/spring-cloud/spring-cloud-build/master/spring-cloud-build-tools/src/main/resources/checkstyle-header.txt` URL将其指向Spring Cloud构建的`spring-cloud-build-tools/src/main/resources/checkstyle-header.txt`文件。
- `checkstyle.suppressions.file`-默认禁止。请在克隆的存储库中或通过`https://raw.githubusercontent.com/spring-cloud/spring-cloud-build/master/spring-cloud-build-tools/src/checkstyle/checkstyle-suppressions.xml` URL将其指向Spring Cloud构建的`spring-cloud-build-tools/src/checkstyle/checkstyle-suppressions.xml`文件。
- `checkstyle.additional.suppressions.file`-此变量对应于本地项目中的取消显示。例如，您正在研究`spring-cloud-contract`。然后指向`project-root/src/checkstyle/checkstyle-suppressions.xml`文件夹。`spring-cloud-contract`的示例为：`/home/username/spring-cloud-contract/src/checkstyle/checkstyle-suppressions.xml`。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 请记住将`Scan Scope`设置为`All sources`，因为我们将checkstyle规则应用于生产和测试源。 |      |

# 第十八部分。Spring Cloud GCP

JoãoAndréMartins；Jisha Abubaker；曾荫权 Mike Eltsufin；Artem Bilan; 安德烈亚斯·伯格（Andreas Berger）Balint Pato; 赵成元; 德米特里·索洛玛卡（Dmitry Solomakha）; 艾琳娜·费尔德（Elena Felder）邹丹妮

## 151.引言

Spring Cloud GCP项目使Spring Framework成为Google Cloud Platform（GCP）的一等公民。

Spring Cloud GCP使您可以利用Spring Framework的强大功能和简单性来：

1. 使用Google Cloud Vision分析图像中的文本，对象和其他内容
2. 通过Google Cloud IAP使用Spring Security
3. 使用Spring Data Cloud Spanner和Spring Data Cloud Datastore映射对象，关系和集合
4. 发布和订阅Google Cloud Pub / Sub主题
5. 使用一些属性配置Spring JDBC以使用Google Cloud SQL
6. 写入和读取Spring由Google Cloud Storage备份的资源
7. 在后台使用Google Cloud Pub / Sub与Spring Integration交换消息
8. 使用Spring Cloud Sleuth和Google Stackdriver Trace跟踪应用的执行情况
9. 使用Spring Cloud Config配置您的应用，并通过Google Runtime Configuration API进行备份
10. 通过Spring Integration GCS通道适配器消费和产生Google Cloud Storage数据

## 152.依赖性管理

Spring Cloud GCP物料清单（BOM）包含其使用的所有依赖项的版本。

如果您是Maven用户，则将以下内容添加到pom.xml文件中将使您可以不指定任何Spring Cloud GCP依赖版本。相反，您使用的BOM的版本将确定所使用依赖项的版本。

```
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-gcp-dependencies</artifactId>
            <version>{project-version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

在以下各节中，将假定您正在使用Spring Cloud GCP BOM，并且相关代码段将不包含版本。

Gradle用户可以使用Spring的[依赖项管理插件](https://github.com/spring-gradle-plugins/dependency-management-plugin) Gradle插件来获得相同的BOM体验。为简单起见，本文档其余部分中的Gradle依赖项片段也将省略其版本。

## 153.入门

有许多可用资源可帮助您尽快了解我们的库。

## 153.1 Spring初始化

[Spring Initializr](https://start.spring.io/)中有Spring Cloud GCP的三个条目。

### 153.1.1 GCP支持

GCP支持条目包含对每个Spring Cloud GCP集成的自动配置支持。仅当将其他依赖项添加到类路径时，才启用大多数自动配置代码。

| Spring Cloud GCP入门 | 所需的依赖项                                                 |
| -------------------- | ------------------------------------------------------------ |
| Config               | org.springframework.cloud:spring-cloud-gcp-starter-config    |
| Cloud Spanner        | org.springframework.cloud:spring-cloud-gcp-starter-data-spanner |
| Cloud Datastore      | org.springframework.cloud:spring-cloud-gcp-starter-data-datastore |
| Logging              | org.springframework.cloud:spring-cloud-gcp-starter-logging   |
| SQL - MySql          | org.springframework.cloud:spring-cloud-gcp-starter-sql-mysql |
| SQL - PostgreSQL     | org.springframework.cloud:spring-cloud-gcp-starter-sql-postgres |
| Trace                | org.springframework.cloud:spring-cloud-gcp-starter-trace     |
| Vision               | org.springframework.cloud:spring-cloud-gcp-starter-vision    |
| Security - IAP       | org.springframework.cloud:spring-cloud-gcp-starter-security-iap |

### 153.1.2 GCP消息传递

“ GCP消息传递”条目添加了“ GCP支持”条目和所有必需的依赖项，因此Google Cloud Pub / Sub集成即开即用。

### 153.1.3 GCP存储

GCP存储条目会添加GCP支持条目和所有必需的依赖项，以便Google Cloud Storage集成可以立即使用。

## 153.2代码示例

有可用的[代码示例](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples)演示了我们所有集成的用法。

例如，[Vision API示例](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-vision-api-sample)显示了如何使用`spring-cloud-gcp-starter-vision`自动配置Vision API客户端。

## 153.3代码挑战

在代码挑战中，您将使用一个集成逐步执行任务。[Google Developers Codelabs](https://codelabs.developers.google.com/spring)页面中存在许多挑战。

## 153.4入门指南

A Spring入门与Spring Integration通道适配器对于谷歌云发布/订阅消息指南可以在[Spring指南](https://spring.io/guides/gs/messaging-gcp-pubsub/)。

## 154. Spring Cloud GCP核心

每个Spring Cloud GCP模块都使用`GcpProjectIdProvider`和`CredentialsProvider`获取GCP项目ID和访问凭证。

Spring Cloud GCP提供了Spring Boot入门程序来自动配置核心组件。

Maven坐标，使用Spring Cloud GCP BOM：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-gcp-starter</artifactId>
</dependency>
```

Gradle坐标：

```
dependencies {
    compile group: 'org.springframework.cloud', name: 'spring-cloud-gcp-starter'
}
```

## 154.1项目ID

`GcpProjectIdProvider`是返回GCP项目ID字符串的功能接口。

```
public interface GcpProjectIdProvider {
	String getProjectId();
}
```

Spring Cloud GCP启动器会自动配置`GcpProjectIdProvider`。如果指定了`spring.cloud.gcp.project-id`属性，则提供的`GcpProjectIdProvider`返回该属性值。

```
spring.cloud.gcp.project-id=my-gcp-project-id
```

否则，将根据[规则](https://googlecloudplatform.github.io/google-cloud-java/google-cloud-clients/apidocs/com/google/cloud/ServiceOptions.html#getDefaultProjectId--)的[有序列表](https://googlecloudplatform.github.io/google-cloud-java/google-cloud-clients/apidocs/com/google/cloud/ServiceOptions.html#getDefaultProjectId--)来发现项目ID ：

1. `GOOGLE_CLOUD_PROJECT`环境变量指定的项目ID
2. Google App Engine项目ID
3. 由`GOOGLE_APPLICATION_CREDENTIALS`环境变量指向的JSON凭证文件中指定的项目ID
4. Google Cloud SDK项目ID
5. 来自Google Compute Engine元数据服务器的Google Compute Engine项目ID

## 154.2凭证

`CredentialsProvider`是一个功能接口，可返回凭据以认证和授权对Google Cloud Client库的调用。

```
public interface CredentialsProvider {
  Credentials getCredentials() throws IOException;
}
```

Spring Cloud GCP启动器会自动配置`CredentialsProvider`。它使用`spring.cloud.gcp.credentials.location`属性找到Google服务帐户的OAuth2私钥。请记住，此属性是Spring资源，因此可以从许多[不同的位置（](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/resources.html#resources-implementations)例如文件系统，类路径，URL等）获取凭证文件。下一个示例在文件系统中指定凭证位置属性。

```
spring.cloud.gcp.credentials.location=file:/usr/local/key.json
```

或者，您可以通过直接指定`spring.cloud.gcp.credentials.encoded-key`属性来设置凭据。该值应为JSON格式的base64编码的帐户私钥。

如果未通过属性指定凭据，则启动程序将尝试从[许多地方](https://github.com/GoogleCloudPlatform/google-cloud-java#authentication)发现凭据：

1. `GOOGLE_APPLICATION_CREDENTIALS`环境变量指向的凭据文件
2. Google Cloud SDK `gcloud auth application-default login`命令提供的凭据
3. Google App Engine内置凭据
4. Google Cloud Shell内置凭据
5. Google Compute Engine内置凭据

如果您的应用程序在Google App Engine或Google Compute Engine上运行，则在大多数情况下，您应该省略`spring.cloud.gcp.credentials.location`属性，而应让Spring Cloud GCP Starter获得那些环境的正确凭据。在App Engine Standard上，使用[App Identity服务帐户凭据](https://cloud.google.com/appengine/docs/standard/java/appidentity/)；在App Engine Flexible上，使用[Flexible服务帐户凭据](https://cloud.google.com/appengine/docs/flexible/java/service-account)；在Google Compute Engine上，使用[Compute Engine默认服务帐户](https://cloud.google.com/compute/docs/access/create-enable-service-accounts-for-instances#using_the_compute_engine_default_service_account)。

### 154.2.1范围

默认情况下，Spring Cloud GCP Starter提供的凭据包含Spring Cloud GCP支持的每个服务的范围。

| Service               | Scope                                                        |
| --------------------- | ------------------------------------------------------------ |
| Spanner               | https://www.googleapis.com/auth/spanner.admin, https://www.googleapis.com/auth/spanner.data |
| Datastore             | https://www.googleapis.com/auth/datastore                    |
| Pub/Sub               | https://www.googleapis.com/auth/pubsub                       |
| Storage (Read Only)   | https://www.googleapis.com/auth/devstorage.read_only         |
| Storage (Write/Write) | https://www.googleapis.com/auth/devstorage.read_write        |
| Runtime Config        | https://www.googleapis.com/auth/cloudruntimeconfig           |
| Trace (Append)        | https://www.googleapis.com/auth/trace.append                 |
| Cloud Platform        | https://www.googleapis.com/auth/cloud-platform               |
| Vision                | https://www.googleapis.com/auth/cloud-vision                 |

通过Spring Cloud GCP启动程序，您可以为提供的凭据配置自定义范围列表。为此，请在`spring.cloud.gcp.credentials.scopes`属性中指定逗号分隔的[Google OAuth2作用域](https://developers.google.com/identity/protocols/googlescopes)列表。

`spring.cloud.gcp.credentials.scopes`是Google Cloud Platform服务的[Google OAuth2范围](https://developers.google.com/identity/protocols/googlescopes)的逗号分隔列表，提供的`CredentialsProvider`支持返回的凭据。

```
spring.cloud.gcp.credentials.scopes=https://www.googleapis.com/auth/pubsub,https://www.googleapis.com/auth/sqlservice.admin
```

您还可以使用`DEFAULT_SCOPES`占位符作为范围来表示启动程序的默认范围，并附加需要添加的其他范围。

```
spring.cloud.gcp.credentials.scopes=DEFAULT_SCOPES,https://www.googleapis.com/auth/cloud-vision
```

## 154.3环境

`GcpEnvironmentProvider`是由Spring Cloud GCP启动程序自动配置的功能接口，它返回`GcpEnvironment`枚举。提供者可以通过编程帮助确定在哪个GCP环境（App Engine Flexible，App Engine Standard，Kubernetes Engine或Compute Engine）中部署应用程序。

```
public interface GcpEnvironmentProvider {
    GcpEnvironment getCurrentEnvironment();
}
```

## 154.4 Spring初始化

可从[Spring Initializr](https://start.spring.io/)到`GCP Support`条目使用此启动器。

## 155.Google Cloud Pub / Sub

Spring Cloud GCP提供了一个抽象层，用于发布到Google Cloud Pub / Sub主题和从中订阅，以及创建，列出或删除Google Cloud Pub / Sub主题和订阅。

提供了Spring Boot入门程序来自动配置各种必需的Pub / Sub组件。

Maven坐标，使用Spring Cloud GCP BOM：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-gcp-starter-pubsub</artifactId>
</dependency>
```

Gradle坐标：

```
dependencies {
    compile group: 'org.springframework.cloud', name: 'spring-cloud-gcp-starter-pubsub'
}
```

从[Spring Initializr](https://start.spring.io/)到`GCP Messaging`条目也可以使用该启动器。

## 155.1发布/订阅操作和模板

`PubSubOperations`是一种抽象，允许Spring用户使用Google Cloud Pub / Sub，而无需依赖任何Google Cloud Pub / Sub API语义。它提供了与Google Cloud Pub / Sub交互所需的一组通用操作。`PubSubTemplate`是`PubSubOperations`的默认实现，它使用发布/订阅的[Google Cloud Java客户端](https://github.com/GoogleCloudPlatform/google-cloud-java/tree/master/google-cloud-pubsub)与Google Cloud发布[/订阅](https://github.com/GoogleCloudPlatform/google-cloud-java/tree/master/google-cloud-pubsub)进行交互。

`PubSubTemplate`取决于`PublisherFactory`和`SubscriberFactory`。`PublisherFactory`为发布/订阅`Publisher`提供了Google Cloud Java客户端。`SubscriberFactory`为异步消息提取提供`Subscriber`，为同步提取提供`SubscriberStub`。适用于GCP Pub / Sub的Spring Boot入门程序使用默认设置自动配置`PublisherFactory`和`SubscriberFactory`，并使用Spring Boot GCP入门程序自动配置的`GcpProjectIdProvider`和`CredentialsProvider` 。

Spring Cloud GCP Pub / Sub `DefaultPublisherFactory`提供的`PublisherFactory`实现按主题名称缓存`Publisher`实例，以优化资源利用率。

`PubSubOperations`接口实际上是`PubSubPublisherOperations`和`PubSubSubscriberOperations`与相应的`PubSubPublisherTemplate`和`PubSubSubscriberTemplate`实现的组合，可以单独使用或通过复合`PubSubTemplate`使用。该文档的其余部分引用了`PubSubTemplate`，但同样适用于`PubSubPublisherTemplate`和`PubSubSubscriberTemplate`，这取决于我们是在谈论发布还是订阅。

### 155.1.1发布到主题

`PubSubTemplate`提供了异步方法来将消息发布到Google Cloud Pub / Sub主题。`publish()`方法采用主题名称以将消息发布到通用类型的有效负载以及（可选）带有消息头的映射中。

以下是如何将消息发布到Google Cloud Pub / Sub主题的示例：

```
public void publishMessage() {
    this.pubSubTemplate.publish("topic", "your message payload", ImmutableMap.of("key1", "val1"));
}
```

默认情况下，`SimplePubSubMessageConverter`用于将类型为`byte[]`，`ByteString`，`ByteBuffer`和`String`的有效载荷转换为Pub / Sub消息。

#### JSON支持

要使用Jackson JSON对POJO进行序列化和反序列化，请配置`JacksonPubSubMessageConverter` bean，GCP Pub / Sub的Spring Boot入门程序会自动将其连接到`PubSubTemplate`。

```
// Note: The ObjectMapper is used to convert Java POJOs to and from JSON.
// You will have to configure your own instance if you are unable to depend
// on the ObjectMapper provided by Spring Boot starters.
@Bean
public JacksonPubSubMessageConverter jacksonPubSubMessageConverter(ObjectMapper objectMapper) {
    return new JacksonPubSubMessageConverter(objectMapper);
}
```

另外，您可以通过调用`PubSubTemplate`上的`setMessageConverter()`方法直接进行设置。`PubSubMessageConverter`的其他实现也可以相同的方式配置。

请参考我们的发布[/订阅JSON有效负载示例应用程序](https://www.springcloud.cc/spring-cloud-gcp-samples/spring-cloud-gcp-integration-pubsub-json-sample)，以作为使用此功能的参考。

### 155.1.2订阅

Google Cloud Pub / Sub允许将许多订阅关联到同一主题。`PubSubTemplate`允许您通过`subscribe()`方法收听订阅。它依赖于`SubscriberFactory`对象，该对象的唯一任务是生成Google Cloud Pub / Sub `Subscriber`对象。收听订阅时，将以一定间隔异步地从Google Cloud Pub / Sub中提取消息。

Google Cloud Pub / Sub的Spring Boot入门程序会自动配置`SubscriberFactory`。

如果需要进行发布/订阅邮件有效负载转换，则可以使用`subscribeAndConvert()`方法，该方法将使用模板中配置的转换器。

### 155.1.3从订阅中提取消息

Google Cloud Pub / Sub支持从订阅中同步提取消息。这与订阅是不同的，在某种意义上说，订阅是一个异步任务，它以设置的时间间隔轮询订阅。

`pullNext()`方法允许从订阅中提取一条消息并自动对其进行确认。`pull()`方法从订阅中提取了许多消息，从而允许配置重试设置。`pull()`收到的任何消息都不会自动确认。相反，由于它们属于`AcknowledgeablePubsubMessage`类型，因此您可以通过调用`ack()`方法来确认它们，或者通过调用`nack()`方法来否定它们。`pullAndAck()`方法的作用与`pull()`方法相同，此外，它确认所有接收到的消息。

`pullAndConvert()`方法的作用与`pull()`方法相同，此外，使用模板中配置的转换器将Pub / Sub二进制有效负载转换为所需类型的对象。

要一次确认从`pull()`或`pullAndConvert()`收到的多条消息，可以使用`PubSubTemplate.ack()`方法。您也可以使用`PubSubTemplate.nack()`否定地确认消息。

使用这些方法批量确认消息比单独确认消息更有效，但是它们**要求**消息收集来自同一项目。

消息上的所有`ack()`，`nack()`和`modifyAckDeadline()`方法以及`PubSubSubscriberTemplate`都是异步实现的，返回一个`ListenableFuture<Void>`以能够处理异步执行。

`PubSubTemplate`使用由其`SubscriberFactory`生成的特殊订阅者来同步提取消息。

## 155.2发布/订阅管理

`PubSubAdmin`是Spring Cloud GCP提供的用于管理Google Cloud Pub / Sub资源的抽象。它允许创建，删除和列出主题和订阅。

`PubSubAdmin`取决于`GcpProjectIdProvider`和`CredentialsProvider`或`TopicAdminClient`和`SubscriptionAdminClient`。如果给定了`CredentialsProvider`，它将使用Google Cloud Java库的Pub / Sub默认设置创建一个`TopicAdminClient`和一个`SubscriptionAdminClient`。用于GCP Pub / Sub的Spring Boot入门程序使用`GcpProjectIdProvider`和`deleteUntrackedBranches` GCP Core入门程序自动配置的`CredentialsProvider`自动配置`PubSubAdmin`对象。

### 155.2.1创建主题

`PubSubAdmin`实现了一种创建主题的方法：

```
public Topic createTopic(String topicName)
```

这是有关如何创建Google Cloud Pub / Sub主题的示例：

```
public void newTopic() {
    pubSubAdmin.createTopic("topicName");
}
```

### 155.2.2删除主题

`PubSubAdmin`实现了一种删除主题的方法：

```
public void deleteTopic(String topicName)
```

这是有关如何删除Google Cloud Pub / Sub主题的示例：

```
public void deleteTopic() {
    pubSubAdmin.deleteTopic("topicName");
}
```

### 155.2.3列出主题

`PubSubAdmin`实现了一种列出主题的方法：

```
public List<Topic> listTopics
```

这是一个如何列出项目中每个Google Cloud Pub / Sub主题名称的示例：

```
public List<String> listTopics() {
    return pubSubAdmin
        .listTopics()
        .stream()
        .map(Topic::getNameAsTopicName)
        .map(TopicName::getTopic)
        .collect(Collectors.toList());
}
```

### 155.2.4创建订阅

`PubSubAdmin`实现了一种创建对现有主题的订阅的方法：

```
public Subscription createSubscription(String subscriptionName, String topicName, Integer ackDeadline, String pushEndpoint)
```

以下是有关如何创建Google Cloud Pub / Sub订阅的示例：

```
public void newSubscription() {
    pubSubAdmin.createSubscription("subscriptionName", "topicName", 10, “https://my.endpoint/push”);
}
```

提供了具有默认设置的替代方法，以方便使用。`ackDeadline`的默认值为10秒。如果未指定`pushEndpoint`，则订阅将使用消息提取。

```
public Subscription createSubscription(String subscriptionName, String topicName)
public Subscription createSubscription(String subscriptionName, String topicName, Integer ackDeadline)
public Subscription createSubscription(String subscriptionName, String topicName, String pushEndpoint)
```

### 155.2.5删除订阅

`PubSubAdmin`实现了一种删除订阅的方法：

```
public void deleteSubscription(String subscriptionName)
```

以下是有关如何删除Google Cloud Pub / Sub订阅的示例：

```
public void deleteSubscription() {
    pubSubAdmin.deleteSubscription("subscriptionName");
}
```

### 155.2.6列表订阅

`PubSubAdmin`实现了一种列出订阅的方法：

```
public List<Subscription> listSubscriptions()
```

这是一个如何列出项目中每个订阅名称的示例：

```
public List<String> listSubscriptions() {
    return pubSubAdmin
        .listSubscriptions()
        .stream()
        .map(Subscription::getNameAsSubscriptionName)
        .map(SubscriptionName::getSubscription)
        .collect(Collectors.toList());
}
```

## 155.3配置

Google Cloud Pub / Sub的Spring Boot入门程序提供以下配置选项：

| Name                                                         | 描述                                                         | Required | Default value                          |
| ------------------------------------------------------------ | ------------------------------------------------------------ | -------- | -------------------------------------- |
| `spring.cloud.gcp.pubsub.enabled`                            | 启用或禁用发布/订阅自动配置                                  | No       | `true`                                 |
| `spring.cloud.gcp.pubsub.subscriber.executor-threads`        | `SubscriberFactory`创建的`Subscriber`实例使用的线程数        | No       | 4                                      |
| `spring.cloud.gcp.pubsub.publisher.executor-threads`         | `PublisherFactory`创建的`Publisher`实例使用的线程数          | No       | 4                                      |
| `spring.cloud.gcp.pubsub.project-id`                         | 托管Google Cloud Pub / Sub API的GCP项目ID（如果与[Spring Cloud GCP核心模块中的](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-gcp-core) ID不同） | No       |                                        |
| `spring.cloud.gcp.pubsub.credentials.location`               | 用于与Google Cloud Pub / Sub API进行身份验证的OAuth2凭据（如果与[Spring Cloud GCP核心模块中的](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-gcp-core)凭据不同） | No       |                                        |
| `spring.cloud.gcp.pubsub.credentials.encoded-key`            | OAuth2帐户私钥的Base64编码内容，用于与Google Cloud Pub / Sub API进行身份验证（如果与 [Spring Cloud GCP核心模块中的内容不同）](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-gcp-core) | No       |                                        |
| `spring.cloud.gcp.pubsub.credentials.scopes`                 | [Spring Cloud GCP发布/订阅凭据的OAuth2范围](https://developers.google.com/identity/protocols/googlescopes) 35 /} GCP发布/订阅凭据的[OAuth2范围](https://developers.google.com/identity/protocols/googlescopes) | No       | https://www.googleapis.com/auth/pubsub |
| `spring.cloud.gcp.pubsub.subscriber.parallel-pull-count`     | 拉工人数                                                     | No       | The available number of processors     |
| `spring.cloud.gcp.pubsub.subscriber.max-ack-extension-period` | 消息确认截止期限的最长时间（以秒为单位）                     | No       | 0                                      |
| `spring.cloud.gcp.pubsub.subscriber.pull-endpoint`           | 同步拉取消息的端点                                           | No       | pubsub.googleapis.com:443              |
| `spring.cloud.gcp.pubsub.[subscriber,publisher].retry.total-timeout-seconds` | TotalTimeout具有最终控制权，该逻辑应继续尝试远程调用直到完全放弃之前应保持多长时间。总超时时间越高，可以尝试的重试次数越多。 | No       | 0                                      |
| `spring.cloud.gcp.pubsub.[subscriber,publisher].retry.initial-retry-delay-second` | InitialRetryDelay控制第一次重试之前的延迟。随后的重试将使用根据RetryDelayMultiplier调整的该值。 | No       | 0                                      |
| `spring.cloud.gcp.pubsub.[subscriber,publisher].retry.retry-delay-multiplier` | RetryDelayMultiplier控制重试延迟的更改。将前一个呼叫的重试延迟与RetryDelayMultiplier相乘，以计算下一个呼叫的重试延迟。 | No       | 1                                      |
| `spring.cloud.gcp.pubsub.[subscriber,publisher].retry.max-retry-delay-seconds` | MaxRetryDelay设置了重试延迟的值的限制，以便RetryDelayMultiplier不能将重试延迟增加到大于此数量的值。 | No       | 0                                      |
| `spring.cloud.gcp.pubsub.[subscriber,publisher].retry.max-attempts` | MaxAttempts定义执行的最大尝试次数。如果此值大于0，并且尝试次数达到此限制，则即使总重试时间仍小于TotalTimeout，逻辑也会放弃重试。 | No       | 0                                      |
| `spring.cloud.gcp.pubsub.[subscriber,publisher].retry.jittered` | 抖动确定是否应将延迟时间随机化。                             | No       | true                                   |
| `spring.cloud.gcp.pubsub.[subscriber,publisher].retry.initial-rpc-timeout-seconds` | InitialRpcTimeout控制初始RPC的超时。后续调用将使用根据RpcTimeoutMultiplier调整的该值。 | No       | 0                                      |
| `spring.cloud.gcp.pubsub.[subscriber,publisher].retry.rpc-timeout-multiplier` | RpcTimeoutMultiplier控制RPC超时的更改。上一个呼叫的超时时间乘以RpcTimeoutMultiplier，以计算下一个呼叫的超时时间。 | No       | 1                                      |
| `spring.cloud.gcp.pubsub.[subscriber,publisher].retry.max-rpc-timeout-seconds` | MaxRpcTimeout对RPC超时值设置了限制，因此RpcTimeoutMultiplier不能将RPC超时增加到高于此值。 | No       | 0                                      |
| `spring.cloud.gcp.pubsub.[subscriber,publisher.batching].flow-control.max-outstanding-element-count` | 在执行流控制之前要保留在内存中的未完成元素的最大数量。       | No       | unlimited                              |
| `spring.cloud.gcp.pubsub.[subscriber,publisher.batching].flow-control.max-outstanding-request-bytes` | 强制执行流控制之前要保留在内存中的最大未完成字节数。         | No       | unlimited                              |
| `spring.cloud.gcp.pubsub.[subscriber,publisher.batching].flow-control.limit-exceeded-behavior` | 超过指定限制时的行为。                                       | No       | Block                                  |
| `spring.cloud.gcp.pubsub.publisher.batching.element-count-threshold` | 用于批处理的元素计数阈值。                                   | No       | unset (threshold does not apply)       |
| `spring.cloud.gcp.pubsub.publisher.batching.request-byte-threshold` | 用于批处理的请求字节阈值。                                   | No       | unset (threshold does not apply)       |
| `spring.cloud.gcp.pubsub.publisher.batching.delay-threshold-seconds` | 用于批处理的延迟阈值。经过这段时间后（从添加的第一个元素开始计数），这些元素将被分批包装并发送。 | No       | unset (threshold does not apply)       |
| `spring.cloud.gcp.pubsub.publisher.batching.enabled`         | 启用批处理。                                                 | No       | false                                  |

## 155.4示例

提供了[示例应用程序](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-pubsub-sample)。

## 156. Spring资源

[Spring资源](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/resources.html)是许多低级[资源](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/resources.html)的抽象，例如文件系统文件，类路径文件，与Servlet上下文相关的文件等。Spring Cloud GCP添加了新的资源类型：Google Cloud Storage（ GCS）对象。

提供了Spring Boot入门程序来自动配置各种存储组件。

Maven坐标，使用Spring Cloud GCP BOM：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-gcp-starter-storage</artifactId>
</dependency>
```

Gradle坐标：

```
dependencies {
    compile group: 'org.springframework.cloud', name: 'spring-cloud-gcp-starter-storage'
}
```

从[Spring Initializr](https://start.spring.io/)到`GCP Storage`条目也可以使用该启动器。

## 156.1 Google云存储

Google云存储的Spring资源抽象允许使用`@Value`批注通过其GCS URL访问GCS对象：

```
@Value("gs://[YOUR_GCS_BUCKET]/[GCS_FILE_NAME]")
private Resource gcsResource;
```

…或Spring应用程序上下文

```
SpringApplication.run(...).getResource("gs://[YOUR_GCS_BUCKET]/[GCS_FILE_NAME]");
```

这将创建一个`Resource`对象，该对象可用于读取该对象以及[其他可能的操作](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/resources.html#resources-resource)。

尽管需要`WriteableResource`，但也可以写入`Resource`。

```
@Value("gs://[YOUR_GCS_BUCKET]/[GCS_FILE_NAME]")
private Resource gcsResource;
...
try (OutputStream os = ((WritableResource) gcsResource).getOutputStream()) {
  os.write("foo".getBytes());
}
```

要将`Resource`作为Google云存储资源使用，请将其强制转换为`GoogleStorageResource`。

如果资源路径指向Google Cloud Storage上的对象（而不是存储桶），则可以调用`getBlob`方法来获取[`Blob`](https://github.com/GoogleCloudPlatform/google-cloud-java/blob/master/google-cloud-storage/src/main/java/com/google/cloud/storage/Blob.java)。此类型表示GCS文件，该文件具有可以设置的关联[元数据](https://cloud.google.com/storage/docs/gsutil/addlhelp/WorkingWithObjectMetadata)，例如content-type。`createSignedUrl`方法还可用于获取GCS对象的[签名URL](https://cloud.google.com/storage/docs/access-control/signed-urls)。但是，创建签名的URL要求使用服务帐户凭据创建资源。

Google Cloud Storage的Spring Boot入门程序根据Spring Boot GCP入门程序提供的`CredentialsProvider`自动配置`spring-cloud-gcp-storage`模块所需的`Storage` bean。

### 156.1.1设置内容类型

您可以从相应的`Resource`对象设置Google Cloud Storage文件的内容类型：

```
((GoogleStorageResource)gcsResource).getBlob().toBuilder().setContentType("text/html").build().update();
```

## 156.2配置

Google云端存储Spring Boot入门版提供以下配置选项：

| Name                                               | 描述                                                         | Required | Default value                                         |
| -------------------------------------------------- | ------------------------------------------------------------ | -------- | ----------------------------------------------------- |
| `spring.cloud.gcp.storage.enabled`                 | 启用GCP存储API。                                             | No       | `true`                                                |
| `spring.cloud.gcp.storage.auto-create-files`       | 写入不存在的文件时，在Google云端存储上创建文件和存储桶       | No       | `true`                                                |
| `spring.cloud.gcp.storage.credentials.location`    | OAuth2用于与Google Cloud Storage API进行身份验证的凭据（如果与[Spring Cloud GCP核心模块中的](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-gcp-core)凭据不同） | No       |                                                       |
| `spring.cloud.gcp.storage.credentials.encoded-key` | 用于与Google Cloud Storage API进行身份验证的OAuth2帐户私钥的Base64编码内容（如果与[Spring Cloud GCP核心模块中的内容不同）](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-gcp-core) | No       |                                                       |
| `spring.cloud.gcp.storage.credentials.scopes`      | [Spring Cloud GCP存储凭据的OAuth2范围](https://developers.google.com/identity/protocols/googlescopes) 35 /} GCP存储凭据的[OAuth2范围](https://developers.google.com/identity/protocols/googlescopes) | No       | https://www.googleapis.com/auth/devstorage.read_write |

## 156.3示例

提供了一个[示例应用程序](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-storage-resource-sample)和一个代码[实验室](https://codelabs.developers.google.com/codelabs/spring-cloud-gcp-gcs/index.html)。

## 157. Spring JDBC

Spring Cloud GCP添加了与[Spring JDBC的](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/jdbc.html)集成， 因此您可以使用Spring JDBC或依赖于它的其他库（如Spring Data JPA）在Google Cloud SQL中运行MySQL或PostgreSQL数据库。

Spring Cloud GCP通过两个Spring Boot入门程序的形式提供了Cloud SQL支持，一个用于MySQL，另一个用于PostgreSQL。入门者的作用是从属性中读取配置并采用默认设置，从而使用户体验尽可能简单地连接到MySQL和PostgreSQL。

Maven坐标，使用Spring Cloud GCP BOM：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-gcp-starter-sql-mysql</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-gcp-starter-sql-postgresql</artifactId>
</dependency>
```

Gradle坐标：

```
dependencies {
    compile group: 'org.springframework.cloud', name: 'spring-cloud-gcp-starter-sql-mysql'
    compile group: 'org.springframework.cloud', name: 'spring-cloud-gcp-starter-sql-postgresql'
}
```

## 157.1先决条件

为了对Google Cloud SQL使用Spring Boot Starters，必须在GCP项目中启用Google Cloud SQL API。

为此，请转到Google Cloud Console 的[API库页面](https://console.cloud.google.com/apis/library)，搜索“ Cloud SQL API”，单击第一个结果并启用该API。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 有几个类似的“ Cloud SQL”结果。您必须访问一个“ Google Cloud SQL API”并从那里启用该API。 |

## 157.2 Spring Boot Google Cloud SQL入门

Google Cloud SQL的Spring Boot Starters提供了一个自动配置的[`DataSource`](https://docs.oracle.com/javase/7/docs/api/javax/sql/DataSource.html)对象。与Spring JDBC结合使用，它提供了[`JdbcTemplate`](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/jdbc.html#jdbc-JdbcTemplate)对象bean，该 对象可以进行诸如查询和修改数据库之类的操作。

```
public List<Map<String, Object>> listUsers() {
    return jdbcTemplate.queryForList("SELECT * FROM user;");
}
```

您可以依靠 [Spring Boot数据源自动配置](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-sql.html#boot-features-connect-to-production-database)来配置`DataSource` bean。换句话说，可以使用诸如SQL用户名`spring.datasource.username`和密码`spring.datasource.password`之类的属性。还有一些特定于Google Cloud SQL的配置：

| Property name                                   | 描述                                                         | Default value                                               |
| ----------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| `spring.cloud.gcp.sql.enabled`                  | 启用或禁用Cloud SQL自动配置                                  | `true`                                                      |
| `spring.cloud.gcp.sql.database-name`            | 要连接的数据库的名称。                                       |                                                             |
| `spring.cloud.gcp.sql.instance-connection-name` | 包含Google Cloud SQL实例的项目ID，区域和名称的字符串，每个字符串之间用冒号分隔。例如，`my-project-id:my-region:my-instance-name`。 |                                                             |
| `spring.cloud.gcp.sql.credentials.location`     | Google OAuth2凭据私钥文件的文件系统路径。用于验证和授权与Google Cloud SQL实例的新连接。 | Default credentials provided by the Spring GCP Boot starter |
| `spring.cloud.gcp.sql.credentials.encoded-key`  | OAuth2帐户私钥的Base64编码内容，采用JSON格式。用于验证和授权与Google Cloud SQL实例的新连接。 | Default credentials provided by the Spring GCP Boot starter |

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 如果您提供自己的`spring.datasource.url`，则除非使用`spring.cloud.gcp.sql.enabled=false`禁用Cloud SQL自动配置，否则它将被忽略。 |

### 157.2.1 `DataSource`创建流程

根据先前的属性，Google Cloud SQL的Spring Boot入门程序会创建一个`CloudSqlJdbcInfoProvider`对象，该对象用于获取实例的JDBC URL和驱动程序类名称。如果您提供自己的`CloudSqlJdbcInfoProvider` bean，那么将使用它，并且将忽略与构建JDBC URL或驱动程序类相关的属性。

Spring Boot自动配置提供的`DataSourceProperties`对象是可变的，以便使用`CloudSqlJdbcInfoProvider`提供的JDBC URL和驱动程序类名，除非这些值在属性中提供。凭证工厂在`DataSourceProperties`突变步骤中的系统属性中注册为`SqlCredentialFactory`。

`DataSource`创建委托给 [Spring Boot](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-sql.html)。您可以通过将连接池[的依赖项添加到classpath中](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-sql.html#boot-features-connect-to-production-database)来选择连接池的类型（例如，Tomcat，HikariCP等）。

结合使用创建的`DataSource`和JDBC Spring，可以为您提供一个完全配置且可操作的`JdbcTemplate`对象，您可以使用该对象与SQL数据库进行交互。您可以使用最少的数据库和实例名称连接到数据库。

### 157.2.2故障排除技巧

#### 连接问题

如果您无法连接到数据库并看到无休止的`Connecting to Cloud SQL instance […] on IP […]`循环，则可能会以低于记录器级别的级别引发和记录异常。如果您的记录器设置为INFO或更高级别，则HikariCP可能就是这种情况。

要查看后台发生了什么，您应该在应用程序资源文件夹中添加一个`logback.xml`文件，如下所示：

```
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <include resource="org/springframework/boot/logging/logback/base.xml"/>
  <logger name="com.zaxxer.hikari.pool" level="DEBUG"/>
</configuration>
```

#### 像`c.g.cloud.sql.core.SslSocketFactory : Re-throwing cached exception due to attempt to refresh instance information too soon after error`这样的错误

如果您在循环中看到很多类似这样的错误并且无法连接到数据库，则通常这是一种征兆，表明在您的凭据权限下存在某些错误，或者未启用Google Cloud SQL API。验证是否已在Cloud Console中启用了Google Cloud SQL API，并且您的服务帐户具有[必要的IAM角色](https://cloud.google.com/sql/docs/mysql/project-access-control#roles)。

要找出导致问题的原因，您可以[如上所述](https://www.springcloud.cc/spring-cloud-greenwich.html#connection-issues)启用DEBUG日志记录级别。

#### PostgreSQL：`java.net.SocketException: already connected`问题

如果您的Maven项目的父级是`spring-boot`版本`1.5.x`，或者在任何其他情况下会导致`org.postgresql:postgresql`依赖项的版本较旧（例如， ，`9.4.1212.jre7`）。

要解决此问题，请以正确的版本重新声明依赖项。例如，在Maven中：

```
<dependency>
  <groupId>org.postgresql</groupId>
  <artifactId>postgresql</artifactId>
  <version>42.1.1</version>
</dependency>
```

## 157.3个示例

可用的示例应用程序和代码实验室：

- [Spring Cloud GCP MySQL](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-sql-mysql-sample)
- [Spring Cloud GCP PostgreSQL](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-sql-postgres-sample)
- [Spring Data JPA与Spring Cloud GCP SQL](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-data-jpa-sample)
- 代码实验室：[Spring使用Cloud SQL的宠物诊所](https://codelabs.developers.google.com/codelabs/cloud-spring-petclinic-cloudsql/index.html)

## 158. Spring Integration

Spring Cloud GCP提供了Spring Integration适配器，使您的应用程序可以使用Google Cloud Platform服务备份的企业集成模式。

## 适用于Cloud Pub / Sub的158.1通道适配器

Google Cloud Pub / Sub的通道适配器将您的Spring连接[`MessageChannels`](https://docs.spring.io/spring-integration/reference/html/messaging-channels-section.html#channel)到Google Cloud Pub / Sub主题和订阅。这样可以在由Google Cloud Pub / Sub备份的不同流程，应用程序或微服务之间进行消息传递。

`spring-cloud-gcp-pubsub`模块中包含Spring Integration Google Cloud Pub / Sub的通道适配器。

Maven坐标，使用Spring Cloud GCP BOM：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-gcp-pubsub</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.integration</groupId>
    <artifactId>spring-integration-core</artifactId>
</dependency>
```

Gradle坐标：

```
dependencies {
    compile group: 'org.springframework.cloud', name: 'spring-cloud-gcp-pubsub'
    compile group: 'org.springframework.integration', name: 'spring-integration-core'
}
```

### 158.1.1入站通道适配器

`PubSubInboundChannelAdapter`是GCP发布/订阅的入站通道适配器，它侦听GCP发布/订阅的新消息。它将新消息转换为内部Spring [`Message`](https://docs.spring.io/spring-integration/reference/html/messaging-construction-chapter.html#message)，然后将其发送到绑定的输出通道。

Google Pub / Sub将消息有效负载视为字节数组。因此，默认情况下，入站通道适配器将使用`byte[]`作为有效载荷来构造Spring `Message`。但是，可以通过设置`PubSubInboundChannelAdapter`的`payloadType`属性来更改所需的有效负载类型。`PubSubInboundChannelAdapter`将对所需有效负载类型的转换委派给在`PubSubTemplate`中配置的`PubSubMessageConverter`。

要使用入站通道适配器，必须在用户应用程序端提供`PubSubInboundChannelAdapter`并对其进行配置。

```
@Bean
public MessageChannel pubsubInputChannel() {
    return new PublishSubscribeChannel();
}

@Bean
public PubSubInboundChannelAdapter messageChannelAdapter(
    @Qualifier("pubsubInputChannel") MessageChannel inputChannel,
    SubscriberFactory subscriberFactory) {
    PubSubInboundChannelAdapter adapter =
        new PubSubInboundChannelAdapter(subscriberFactory, "subscriptionName");
    adapter.setOutputChannel(inputChannel);
    adapter.setAckMode(AckMode.MANUAL);

    return adapter;
}
```

在示例中，我们首先指定适配器将向其写入传入消息的`MessageChannel`。`MessageChannel`的实现在这里并不重要。根据您的用例，您可能需要使用`MessageChannel`而非`PublishSubscribeChannel`。

然后，我们声明`PubSubInboundChannelAdapter` bean。它需要我们刚创建的通道和一个`SubscriberFactory`，该`SubscriberFactory`从Google Cloud Java Client for Pub / Sub创建`Subscriber`对象。GCP Pub / Sub的Spring Boot入门程序提供了已配置的`SubscriberFactory`。

`PubSubInboundChannelAdapter`支持三种确认模式，其中`AckMode.AUTO`是默认值。

自动确认（`AckMode.AUTO`）

如果适配器将消息发送到通道，并且未引发任何异常，则消息将被GCP发布/订阅确认。如果在处理邮件时抛出`RuntimeException`，则该邮件将被否定。

自动确认确认（`AckMode.AUTO_ACK`）

如果适配器将消息发送到通道，并且未引发任何异常，则消息将被GCP发布/订阅确认。如果在处理消息时抛出`RuntimeException`，则消息既不会被确认也不会被拒绝。

当使用订阅的确认截止时间超时作为重试传递回退机制时，此功能很有用。

手动确认（`AckMode.MANUAL`）

适配器将`BasicAcknowledgeablePubsubMessage`对象附加到`Message`标头。用户可以使用`GcpPubSubHeaders.ORIGINAL_MESSAGE`键提取`BasicAcknowledgeablePubsubMessage`，并将其用于（n）确认消息。

```
@Bean
@ServiceActivator(inputChannel = "pubsubInputChannel")
public MessageHandler messageReceiver() {
    return message -> {
        LOGGER.info("Message arrived! Payload: " + new String((byte[]) message.getPayload()));
        BasicAcknowledgeablePubsubMessage originalMessage =
              message.getHeaders().get(GcpPubSubHeaders.ORIGINAL_MESSAGE, BasicAcknowledgeablePubsubMessage.class);
        originalMessage.ack();
    };
}
```

### 158.1.2出站通道适配器

`PubSubMessageHandler`是GCP发布/订阅的出站通道适配器，它在Spring `MessageChannel`上侦听新消息。它使用`PubSubTemplate`将其发布到GCP发布/订阅主题。

为了构造消息的Pub / Sub表示，出站通道适配器需要将Spring `Message`有效载荷转换为Pub / Sub期望的字节数组表示。它将这种转换委托给`PubSubTemplate`。要自定义转换，您可以在`PubSubTemplate`中指定一个`PubSubMessageConverter`，它将`Object`有效负载和Spring `Message`的标头转换为`PubsubMessage`。

要使用出站通道适配器，必须在用户应用程序侧提供`PubSubMessageHandler` bean并对其进行配置。

```
@Bean
@ServiceActivator(inputChannel = "pubsubOutputChannel")
public MessageHandler messageSender(PubSubTemplate pubsubTemplate) {
    return new PubSubMessageHandler(pubsubTemplate, "topicName");
}
```

提供的`PubSubTemplate`包含将消息发布到GCP发布/订阅主题的所有必要配置。

`PubSubMessageHandler`默认情况下异步发布消息。可以将发布超时配置为同步发布。如果未提供任何内容，则适配器将无限期等待响应。

可以通过`setPublishFutureCallback()`方法为`PubSubMessageHandler`中的`publish()`调用设置用户定义的回调。如果成功，这些对于处理消息ID很有用，如果抛出错误，则对处理错误ID是有用的。

要覆盖默认目的地，可以使用`GcpPubSubHeaders.DESTINATION`标头。

```
@Autowired
private MessageChannel pubsubOutputChannel;

public void handleMessage(Message<?> msg) throws MessagingException {
    final Message<?> message = MessageBuilder
        .withPayload(msg.getPayload())
        .setHeader(GcpPubSubHeaders.TOPIC, "customTopic").build();
    pubsubOutputChannel.send(message);
}
```

也可以使用`setTopicExpression()`或`setTopicExpressionString()`方法为主题设置SpEL表达式。

### 158.1.3标头映射

这些通道适配器包含标头映射器，可让您将标头从Spring映射或过滤出到Google Cloud Pub / Sub消息，反之亦然。默认情况下，入站通道适配器将Google Cloud Pub / Sub消息上的每个标头映射到适配器产生的Spring消息。出站通道适配器将Spring消息中的每个标头映射到Google Cloud Pub / Sub消息中，由Spring添加的消息标头除外，例如带有键`"id"`，`"timestamp"`和`"gcp_pubsub_acknowledgement"`的标头。在此过程中，出站映射器还将标头的值转换为字符串。

每个适配器都声明一个`setHeaderMapper()`方法，可让您进一步自定义要从Spring映射到Google Cloud Pub / Sub的标题，反之亦然。

例如，要过滤出头文件`"foo"`，`"bar"`和所有以前缀“ prefix_”开头的头文件，可以将`setHeaderMapper()`与此模块提供的`PubSubHeaderMapper`实现一起使用。

```
PubSubMessageHandler adapter = ...
...
PubSubHeaderMapper headerMapper = new PubSubHeaderMapper();
headerMapper.setOutboundHeaderPatterns("!foo", "!bar", "!prefix_*", "*");
adapter.setHeaderMapper(headerMapper);
```

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 在`PubSubHeaderMapper.setOutboundHeaderPatterns()`和`PubSubHeaderMapper.setInboundHeaderPatterns()`中声明模式的顺序很重要。第一种模式优先于以下模式。 |

在前面的示例中，`"*"`模式表示每个标头都已映射。但是，由于它在列表中排在最后，[因此之前的模式优先](https://docs.spring.io/spring-integration/api/org/springframework/integration/util/PatternMatchUtils.html#smartMatch-java.lang.String-java.lang.String…-)。

## 158.2示例

可用的示例：

- [发送者和接收者示例应用程序](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-integration-pubsub-sample)
- [JSON有效负载示例应用程序](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-integration-pubsub-json-sample)
- [代码实验室](https://codelabs.developers.google.com/codelabs/cloud-spring-cloud-gcp-pubsub-integration/index.html)

## 158.3用于Google Cloud Storage的通道适配器

Google Cloud Storage的通道适配器可让您通过`MessageChannels`读写文件到Google Cloud Storage。

Spring Cloud GCP提供了两个入站适配器`GcsInboundFileSynchronizingMessageSource`和`GcsStreamingMessageSource`，以及一个出站适配器`GcsMessageHandler`。

`spring-cloud-gcp-storage`模块中包含用于Google Cloud Storage的Spring Integration通道适配器。

要为Spring Cloud GCP使用Spring Integration的存储部分，还必须提供`spring-integration-file`依赖项，因为它不是可传递的。

Maven坐标，使用Spring Cloud GCP BOM：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-gcp-storage</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.integration</groupId>
    <artifactId>spring-integration-file</artifactId>
</dependency>
```

Gradle坐标：

```
dependencies {
    compile group: 'org.springframework.cloud', name: 'spring-cloud-gcp-starter-storage'
    compile group: 'org.springframework.integration', name: 'spring-integration-file'
}
```

### 158.3.1入站通道适配器

Google云端存储入站通道适配器会轮询Google云端存储桶中的新文件，并将每个文件以`Message`负载的形式发送到`@InboundChannelAdapter`批注中指定的`MessageChannel`。这些文件临时存储在本地文件系统的文件夹中。

这是有关如何配置Google Cloud Storage入站通道适配器的示例。

```
@Bean
@InboundChannelAdapter(channel = "new-file-channel", poller = @Poller(fixedDelay = "5000"))
public MessageSource<File> synchronizerAdapter(Storage gcs) {
  GcsInboundFileSynchronizer synchronizer = new GcsInboundFileSynchronizer(gcs);
  synchronizer.setRemoteDirectory("your-gcs-bucket");

  GcsInboundFileSynchronizingMessageSource synchAdapter =
          new GcsInboundFileSynchronizingMessageSource(synchronizer);
  synchAdapter.setLocalDirectory(new File("local-directory"));

  return synchAdapter;
}
```

### 158.3.2入站流通道适配器

入站流媒体通道适配器与普通的入站通道适配器相似，不同之处在于它不需要将文件存储在文件系统中。

这是有关如何配置Google Cloud Storage入站流媒体通道适配器的示例。

```
@Bean
@InboundChannelAdapter(channel = "streaming-channel", poller = @Poller(fixedDelay = "5000"))
public MessageSource<InputStream> streamingAdapter(Storage gcs) {
  GcsStreamingMessageSource adapter =
          new GcsStreamingMessageSource(new GcsRemoteFileTemplate(new GcsSessionFactory(gcs)));
  adapter.setRemoteDirectory("your-gcs-bucket");
  return adapter;
}
```

### 158.3.3出站通道适配器

出站通道适配器允许将文件写入Google Cloud Storage。当它收到包含类型为`File`的有效负载的`Message`时，它将将该文件写入适配器中指定的Google Cloud Storage存储桶。

这是有关如何配置Google Cloud Storage出站通道适配器的示例。

```
@Bean
@ServiceActivator(inputChannel = "writeFiles")
public MessageHandler outboundChannelAdapter(Storage gcs) {
  GcsMessageHandler outboundChannelAdapter = new GcsMessageHandler(new GcsSessionFactory(gcs));
  outboundChannelAdapter.setRemoteDirectoryExpression(new ValueExpression<>("your-gcs-bucket"));

  return outboundChannelAdapter;
}
```

## 158.4示例

提供了[示例应用程序](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-integration-storage-sample)。

## 159. Spring Cloud Stream

Spring Cloud GCP为Google Cloud Pub / Sub 提供了[Spring Cloud Stream](https://cloud.spring.io/spring-cloud-stream/)活页夹。

所提供的活页夹依赖于[Spring Integration Google Cloud Pub / Sub的通道适配器](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-pubsub/src/main/java/org/springframework/cloud/gcp/pubsub/integration)。

Maven坐标，使用Spring Cloud GCP BOM：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-gcp-pubsub-stream-binder</artifactId>
</dependency>
```

Gradle坐标：

```
dependencies {
    compile group: 'org.springframework.cloud', name: 'spring-cloud-gcp-pubsub-stream-binder'
}
```

## 159.1概述

该资料夹将生产者绑定到Google Cloud Pub / Sub主题，将消费者绑定到订阅。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 该绑定器当前不支持分区。                                     |

## 159.2配置

您可以为Google Cloud Pub / Sub配置Spring Cloud Stream Binder，以自动生成基础资源，例如针对生产者和消费者的Google Cloud Pub / Sub主题和订阅。为此，您可以使用`spring.cloud.stream.gcp.pubsub.bindings.<channelName>.<consumer|producer>.auto-create-resources`属性，该属性默认情况下处于打开状态。

从版本1.1开始，可以为所有绑定全局配置这些和其他绑定程序属性，例如`spring.cloud.stream.gcp.pubsub.default.consumer.auto-create-resources`。

如果您正在Spring Cloud GCP Pub / Sub Starter中使用发布/订阅自动配置功能，则应参考[配置](https://www.springcloud.cc/spring-cloud-greenwich.html#pubsub-configuration)部分中的其他发布/订阅参数。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 要将绑定程序与[正在运行的仿真器一起使用](https://cloud.google.com/pubsub/docs/emulator)，请通过`spring.cloud.gcp.pubsub.emulator-host`配置其主机和端口。 |

### 159.2.1生产者目标配置

如果打开自动资源创建功能，并且与目标名称对应的主题不存在，则会创建该资源。

例如，对于以下配置，将创建一个名为`myEvents`的主题。

**application.properties。** 

```
spring.cloud.stream.bindings.events.destination=myEvents
spring.cloud.stream.gcp.pubsub.bindings.events.producer.auto-create-resources=true
```



### 159.2.2使用者目的地配置

如果打开自动资源创建功能，并且对于用户而言不存在订阅和/或主题，则将创建订阅和潜在的主题。主题名称将与目标名称相同，订阅名称将是目标名称，后跟使用者组名称。

不管`auto-create-resources`设置如何，如果未指定使用者组，都会创建一个名称为`anonymous.<destinationName>.<randomUUID>`的匿名用户组。然后，当活页夹关闭时，将自动清除为匿名使用者组创建的所有发布/订阅。

例如，对于以下配置，将创建名为`myEvents`的主题和名为`myEvents.counsumerGroup1`的订阅。如果未指定使用者组，则将创建一个名为`anonymous.myEvents.a6d83782-c5a3-4861-ac38-e6e2af15a7be`的订阅，并随后对其进行清理。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| 如果您要为消费者手动创建发布/订阅，请确保它们遵循`<destinationName>.<consumerGroup>`的命名约定。 |      |

**application.properties。** 

```
spring.cloud.stream.bindings.events.destination=myEvents
spring.cloud.stream.gcp.pubsub.bindings.events.consumer.auto-create-resources=true

# specify consumer group, and avoid anonymous consumer group generation
spring.cloud.stream.bindings.events.group=consumerGroup1
```



## 159.3示例

提供了[示例应用程序](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-pubsub-binder-sample)。

## 160. Spring Cloud Sleuth

[Spring Cloud Sleuth](https://cloud.spring.io/spring-cloud-sleuth/)是Spring Boot应用程序的检测框架。它捕获跟踪信息，并将跟踪转发到Zipkin之类的服务以进行存储和分析。

Google Cloud Platform提供了自己的托管分布式跟踪服务，称为[Stackdriver Trace](https://cloud.google.com/trace/)。您可以使用Stackdriver Trace来存储跟踪，查看跟踪详细信息，生成延迟分布图以及生成性能回归报告，而不必运行和维护自己的Zipkin实例和存储。

此Spring Cloud GCP入门程序可以将Spring Cloud Sleuth跟踪转发到Stackdriver Trace，而无需中间Zipkin服务器。

Maven坐标，使用Spring Cloud GCP BOM：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-gcp-starter-trace</artifactId>
</dependency>
```

Gradle坐标：

```
dependencies {
    compile group: 'org.springframework.cloud', name: 'spring-cloud-gcp-starter-trace'
}
```

您必须从Google Cloud Console启用Stackdriver Trace API才能捕获跟踪。导航到项目的[Stackdriver Trace API](https://console.cloud.google.com/apis/api/cloudtrace.googleapis.com/overview)，并确保已启用它。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 如果您已经在使用Zipkin服务器捕获来自多个平台/框架的跟踪信息，则还可以使用[Stackdriver Zipkin代理](https://cloud.google.com/trace/docs/zipkin)将这些跟踪转发到Stackdriver Trace，而无需修改现有应用程序。 |

## 160.1跟踪

Spring Cloud Sleuth使用[Brave跟踪](https://github.com/openzipkin/brave)程序生成跟踪。这种集成使Brave能够使用[`StackdriverTracePropagation`](https://github.com/openzipkin/zipkin-gcp/tree/master/propagation-stackdriver)传播。

传播负责从实体（例如HTTP Servlet请求）提取跟踪上下文，并将跟踪上下文注入实体。传播用法的一个典型示例是一个web服务器，该服务器接收一个HTTP请求，该服务器在将HTTP响应返回给原始调用者之前会触发该服务器的其他HTTP请求。在`StackdriverTracePropagation`的情况下，它首先在`x-cloud-trace-context`键（例如，HTTP请求标头）中查找跟踪上下文。`x-cloud-trace-context`键的值可以用三种不同的方式设置格式：

- `x-cloud-trace-context: TRACE_ID`
- `x-cloud-trace-context: TRACE_ID/SPAN_ID`
- `x-cloud-trace-context: TRACE_ID/SPAN_ID;o=TRACE_TRUE`

`TRACE_ID`是一个32个字符的十六进制值，它编码一个128位数字。

`SPAN_ID`是无符号长整数。由于Stackdriver Trace不支持跨度联接，因此始终生成一个新的跨度ID，而与`x-cloud-trace-context`中指定的ID无关。

如果应跟踪实体，则`TRACE_TRUE`可以为`0`，如果应跟踪实体，则可以为`1`。该字段强制决定是否跟踪请求。如果省略，则将决定推迟到采样器。

如果找不到`x-cloud-trace-context`键，则`StackdriverTracePropagation`会回退到使用[X-B3标头](https://github.com/openzipkin/b3-propagation)进行跟踪。

## 160.2 Spring Boot Starter for Stackdriver Trace

Spring Boot Stackdriver Trace入门程序使用Spring Cloud Sleuth并自动配置[StackdriverSender](https://github.com/openzipkin/zipkin-gcp/blob/master/sender-stackdriver/src/main/java/zipkin2/reporter/stackdriver/StackdriverSender.java)，该[Sender](https://github.com/openzipkin/zipkin-gcp/blob/master/sender-stackdriver/src/main/java/zipkin2/reporter/stackdriver/StackdriverSender.java)将Sleuth的跟踪信息发送到Stackdriver Trace。

所有配置都是可选的：

| Name                                             | 描述                                                         | Required | Default value                  |
| ------------------------------------------------ | ------------------------------------------------------------ | -------- | ------------------------------ |
| `spring.cloud.gcp.trace.enabled`                 | 自动配置Spring Cloud Sleuth以将跟踪发送到Stackdriver Trace。 | No       | `true`                         |
| `spring.cloud.gcp.trace.project-id`              | 覆盖[Spring Cloud GCP模块中](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-gcp-core)的项目ID | No       |                                |
| `spring.cloud.gcp.trace.credentials.location`    | 覆盖[Spring Cloud GCP模块中](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-gcp-core)的凭据位置 | No       |                                |
| `spring.cloud.gcp.trace.credentials.encoded-key` | 覆盖[Spring Cloud GCP模块中](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-gcp-core)的凭据编码密钥 | No       |                                |
| `spring.cloud.gcp.trace.credentials.scopes`      | 覆盖[Spring Cloud GCP模块中](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-gcp-core)的凭据范围 | No       |                                |
| `spring.cloud.gcp.trace.num-executor-threads`    | 跟踪执行程序使用的线程数                                     | No       | 4                              |
| `spring.cloud.gcp.trace.authority`               | 通道声称要连接的HTTP / 2权限。                               | No       |                                |
| `spring.cloud.gcp.trace.compression`             | 在Trace调用中使用的压缩名称                                  | No       |                                |
| `spring.cloud.gcp.trace.deadline-ms`             | 通话截止时间（以毫秒为单位）                                 | No       |                                |
| `spring.cloud.gcp.trace.max-inbound-size`        | 入站邮件的最大大小                                           | No       |                                |
| `spring.cloud.gcp.trace.max-outbound-size`       | 出站邮件的最大大小                                           | No       |                                |
| `spring.cloud.gcp.trace.wait-for-ready`          | [等待通道就绪](https://github.com/grpc/grpc/blob/master/doc/wait-for-ready.md)，以防出现瞬态故障 | No       | `false`                        |
| `spring.cloud.gcp.trace.messageTimeout`          | 待处理的spans之前的超时（以秒为单位）将被批量发送到GCP Stackdriver Trace。添加了向前兼容性。 | No       | `spring.zipkin.messageTimeout` |

您可以使用核心Spring Cloud Sleuth属性来控制Sleuth的采样率等。有关Sleuth配置的更多信息，请阅读[Sleuth文档](https://cloud.spring.io/spring-cloud-sleuth/)。

例如，当您测试以查看迹线通过时，可以将采样率设置为100％。

```
spring.sleuth.sampler.probability=1                     # Send 100% of the request traces to Stackdriver.
spring.sleuth.web.skipPattern=(^cleanup.*|.+favicon.*)  # Ignore some URL paths.
```

Spring Cloud GCP跟踪确实会覆盖某些Sleuth配置：

- 始终使用128位跟踪ID。这是Stackdriver Trace所必需的。
- 不使用Span连接。Span联接将在客户端和服务器跨度之间共享跨度ID。Stackdriver要求跟踪中的每个Span ID都是唯一的，因此不支持Span连接。
- 默认情况下，使用`StackdriverHttpClientParser`和`StackdriverHttpServerParser`填充与Stackdriver相关的字段。

## 160.3覆盖自动配置

Spring Cloud Sleuth支持从2.1.0版开始将跟踪发送到多个跟踪系统。为了使其正常工作，每个跟踪系统都需要具有`Reporter<Span>`和`Sender`。如果要覆盖提供的beans，则需要给它们指定一个特定的名称。为此，您可以分别使用`StackdriverTraceAutoConfiguration.REPORTER_BEAN_NAME`和`StackdriverTraceAutoConfiguration.SENDER_BEAN_NAME`。

## 160.4与日志集成

通过[Stackdriver Logging支持](https://www.springcloud.cc/logging.adoc)可以与Stackdriver Logging集成。如果将“跟踪”集成与“日志记录”一起使用，则请求日志将与相应的跟踪相关联。可以通过以下方式查看跟踪日志：转到[Google Cloud Console跟踪列表](https://console.cloud.google.com/traces/traces)，选择一个跟踪，然后按`Details`部分中的`Logs → View`链接。

## 160.5示例

提供了一个[示例应用程序](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-trace-sample)和一个代码[实验室](https://codelabs.developers.google.com/codelabs/cloud-spring-cloud-gcp-trace/index.html)。

## 161. Stackdriver记录

Maven坐标，使用Spring Cloud GCP BOM：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-gcp-starter-logging</artifactId>
</dependency>
```

Gradle坐标：

```
dependencies {
    compile group: 'org.springframework.cloud', name: 'spring-cloud-gcp-starter-logging'
}
```

[Stackdriver Logging](https://cloud.google.com/logging/)是Google Cloud Platform提供的托管日志记录服务。

该模块支持将web请求跟踪ID与相应的日志条目相关联。它是通过从[映射诊断上下文（MDC）中](https://logback.qos.ch/manual/mdc.html)检索`X-B3-TraceId`值来完成的，该值由Spring Cloud Sleuth设置。如果未使用Spring Cloud Sleuth，则配置的`TraceIdExtractor`将提取所需的标头值并将其设置为日志条目的跟踪ID。这允许根据请求将日志消息分组，例如，在[Google Cloud Console日志查看器中](https://console.cloud.google.com/logs/viewer)。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 由于日志记录的设置方式，在`application.properties`中定义的GCP项目ID和凭据将被忽略。而是应将`GOOGLE_CLOUD_PROJECT`和`GOOGLE_APPLICATION_CREDENTIALS`环境变量分别设置为项目ID和凭据私钥位置。如果您分别使用`gcloud config set project [YOUR_PROJECT_ID]`和`gcloud auth application-default login`命令使用[Google Cloud SDK](https://cloud.google.com/sdk)，则可以轻松完成此操作。 |

## 161.1 Web MVC拦截器

为了在基于Web的基于MVC的应用程序中使用，提供了`TraceIdLoggingWebMvcInterceptor`，它使用`TraceIdExtractor`从HTTP请求中提取了请求跟踪ID，并将其存储在线程本地中，然后可以在本地线程中使用。日志记录附加程序，以将跟踪ID元数据添加到日志消息中。

| ![[警告]](/assets/images/springcloud/warning.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 如果启用了Spring Cloud GCP跟踪，则日志记录模块将禁用自身并将日志相关性委派给Spring Cloud Sleuth。 |

还提供了`LoggingWebMvcConfigurer`配置类，以帮助在Spring MVC应用程序中注册`TraceIdLoggingWebMvcInterceptor`。

Google Cloud Platform上托管的应用程序在`x-cloud-trace-context`标头下包含跟踪ID，这些ID将包含在日志条目中。但是，如果使用Sleuth，则会从MDC中获取跟踪ID。

## 161.2登录支持

当前，仅支持Logback，并且有两种通过Logback通过此库通过Logback登录到Stackdriver的可能性：通过直接API调用和通过JSON格式的控制台日志。

### 161.2.1通过API记录

可使用`org/springframework/cloud/gcp/autoconfigure/logging/logback-appender.xml`使用Stackdriver附加程序。此附加程序从JUL或Logback日志条目构建Stackdriver Logging日志条目，向其添加跟踪ID，然后将其发送到Stackdriver Logging。

`STACKDRIVER_LOG_NAME`和`STACKDRIVER_LOG_FLUSH_LEVEL`环境变量可用于自定义`STACKDRIVER`附加程序。

然后，您的配置可能如下所示：

```
<configuration>
  <include resource="org/springframework/cloud/gcp/autoconfigure/logging/logback-appender.xml" />

  <root level="INFO">
    <appender-ref ref="STACKDRIVER" />
  </root>
</configuration>
```

如果要对日志输出进行更多控制，则可以进一步配置附加程序。可以使用以下属性：

| Property     | 默认值       | 描述                                                         |
| ------------ | ------------ | ------------------------------------------------------------ |
| `log`        | `spring.log` | The Stackdriver Log name. This can also be set via the `STACKDRIVER_LOG_NAME` environmental variable. |
| `flushLevel` | `WARN`       | If a log entry with this level is encountered, trigger a flush of locally buffered log to Stackdriver Logging. This can also be set via the `STACKDRIVER_LOG_FLUSH_LEVEL` environmental variable. |

### 161.2.2通过控制台登录

对于Logback，`org/springframework/cloud/gcp/autoconfigure/logging/logback-json-appender.xml`文件可用于导入，以使其更易于配置JSON Logback附加程序。

然后，您的配置可能如下所示：

```
<configuration>
  <include resource="org/springframework/cloud/gcp/autoconfigure/logging/logback-json-appender.xml" />

  <root level="INFO">
    <appender-ref ref="CONSOLE_JSON" />
  </root>
</configuration>
```

如果您的应用程序在Google Kubernetes Engine，Google Compute Engine或Google App Engine Flexible上运行，则您的控制台日志将自动保存到Google Stackdriver Logging。因此，您只需在日志记录配置中包含`org/springframework/cloud/gcp/autoconfigure/logging/logback-json-appender.xml`，即可将JSON条目记录到控制台。跟踪ID将正确设置。

如果要对日志输出进行更多控制，则可以进一步配置附加程序。可以使用以下属性：

| Property                    | 默认值                                                       | 描述                                                         |
| --------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `projectId`                 | If not set, default value is determined in the following order:`SPRING_CLOUD_GCP_LOGGING_PROJECT_ID` Environmental Variable.Value of `DefaultGcpProjectIdProvider.getProjectId()` | This is used to generate fully qualified Stackdriver Trace ID format: `projects/[PROJECT-ID]/traces/[TRACE-ID]`.This format is required to correlate trace between Stackdriver Trace and Stackdriver Logging.If `projectId` is not set and cannot be determined, then it’ll log `traceId` without the fully qualified format. |
| `includeTraceId`            | `true`                                                       | Should the `traceId` be included                             |
| `includeSpanId`             | `true`                                                       | Should the `spanId` be included                              |
| `includeLevel`              | `true`                                                       | Should the severity be included                              |
| `includeThreadName`         | `true`                                                       | Should the thread name be included                           |
| `includeMDC`                | `true`                                                       | Should all MDC properties be included. The MDC properties `X-B3-TraceId`, `X-B3-SpanId` and `X-Span-Export` provided by Spring Sleuth will get excluded as they get handled separately |
| `includeLoggerName`         | `true`                                                       | Should the name of the logger be included                    |
| `includeFormattedMessage`   | `true`                                                       | Should the formatted log message be included.                |
| `includeExceptionInMessage` | `true`                                                       | Should the stacktrace be appended to the formatted log message. This setting is only evaluated if `includeFormattedMessage` is `true` |
| `includeContextName`        | `true`                                                       | Should the logging context be included                       |
| `includeMessage`            | `false`                                                      | Should the log message with blank placeholders be included   |
| `includeException`          | `false`                                                      | Should the stacktrace be included as a own field             |

这是这种Logback配置的示例：

```
<configuration >
  <property name="projectId" value="${projectId:-${GOOGLE_CLOUD_PROJECT}}"/>

  <appender name="CONSOLE_JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="ch.qos.logback.core.encoder.LayoutWrappingEncoder">
      <layout class="org.springframework.cloud.gcp.logging.StackdriverJsonLayout">
        <projectId>${projectId}</projectId>

        <!--<includeTraceId>true</includeTraceId>-->
        <!--<includeSpanId>true</includeSpanId>-->
        <!--<includeLevel>true</includeLevel>-->
        <!--<includeThreadName>true</includeThreadName>-->
        <!--<includeMDC>true</includeMDC>-->
        <!--<includeLoggerName>true</includeLoggerName>-->
        <!--<includeFormattedMessage>true</includeFormattedMessage>-->
        <!--<includeExceptionInMessage>true</includeExceptionInMessage>-->
        <!--<includeContextName>true</includeContextName>-->
        <!--<includeMessage>false</includeMessage>-->
        <!--<includeException>false</includeException>-->
      </layout>
    </encoder>
  </appender>
</configuration>
```

## 161.3示例

提供了一个[示例Spring Boot应用程序](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-logging-sample)，以显示如何使用Cloud Logging Starter。

## 162. Spring Cloud Config

Spring Cloud GCP可以将[Google Runtime Configuration API](https://cloud.google.com/deployment-manager/runtime-configurator/reference/rest/)用作[Spring Cloud Config](https://cloud.spring.io/spring-cloud-config/)服务器，以远程存储您的应用程序配置数据。

Spring Cloud GCP Config支持通过其自己的Spring Boot启动器提供。它可以将Google Runtime Configuration API用作Spring Boot配置属性的来源。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| Google Cloud Runtime Configuration服务处于Beta状态。         |

Maven坐标，使用Spring Cloud GCP BOM：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-gcp-starter-config</artifactId>
</dependency>
```

Gradle坐标：

```
dependencies {
    compile group: 'org.springframework.cloud', name: 'spring-cloud-gcp-starter-config'
}
```

## 162.1配置

在Spring Cloud GCP Config中可以配置以下参数：

| Name                                              | 描述                                                         | Required | Default value                                                |
| ------------------------------------------------- | ------------------------------------------------------------ | -------- | ------------------------------------------------------------ |
| `spring.cloud.gcp.config.enabled`                 | 启用配置客户端                                               | No       | `false`                                                      |
| `spring.cloud.gcp.config.name`                    | 您的申请名称                                                 | No       | Value of the `spring.application.name` property. If none, `application` |
| `spring.cloud.gcp.config.profile`                 | 活动资料                                                     | No       | Value of the `spring.profiles.active` property. If more than a single profile, last one is chosen |
| `spring.cloud.gcp.config.timeout-millis`          | 连接到Google Runtime Configuration API的超时时间（以毫秒为单位） | No       | `60000`                                                      |
| `spring.cloud.gcp.config.project-id`              | 托管Google Runtime Configuration API的GCP项目ID              | No       |                                                              |
| `spring.cloud.gcp.config.credentials.location`    | OAuth2凭据，用于通过Google Runtime Configuration API进行身份验证 | No       |                                                              |
| `spring.cloud.gcp.config.credentials.encoded-key` | Base64编码的OAuth2凭据，用于通过Google Runtime Configuration API进行身份验证 | No       |                                                              |
| `spring.cloud.gcp.config.credentials.scopes`      | [Spring Cloud GCP配置凭据的OAuth2范围](https://developers.google.com/identity/protocols/googlescopes) 35 /} GCP配置凭据的[OAuth2范围](https://developers.google.com/identity/protocols/googlescopes) | No       | https://www.googleapis.com/auth/cloudruntimeconfig           |

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 这些属性应在[`bootstrap.yml` / `bootstrap.properties`](https://cloud.spring.io/spring-cloud-static/spring-cloud.html#_the_bootstrap_application_context)文件中指定，而不是通常的`applications.yml` / `application.properties`。 |

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 如[Spring Cloud GCP核心模块中](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-gcp-core)所述，核心属性不适用于Spring Cloud GCP Config。 |

## 162.2快速入门

1. 在Google Runtime Configuration API中创建名为`${spring.application.name}_${spring.profiles.active}`的配置。换句话说，如果`spring.application.name`为`myapp`，而`spring.profiles.active`为`prod`，则该配置应称为`myapp_prod`。

   为此，您应该安装[Google Cloud SDK](https://cloud.google.com/sdk/)，拥有一个Google Cloud Project并运行以下命令：

```
gcloud init # if this is your first Google Cloud SDK run.
gcloud beta runtime-config configs create myapp_prod
gcloud beta runtime-config configs variables set myapp.queue-size 25 --config-name myapp_prod
```

1. 使用应用程序的配置数据配置`bootstrap.properties`文件：

   ```
   spring.application.name=myapp
   spring.profiles.active=prod
   ```

2. 将`@ConfigurationProperties`批注添加到Spring管理的bean中：

   ```
   @Component
   @ConfigurationProperties("myapp")
   public class SampleConfig {
   
     private int queueSize;
   
     public int getQueueSize() {
       return this.queueSize;
     }
   
     public void setQueueSize(int queueSize) {
       this.queueSize = queueSize;
     }
   }
   ```

当您的Spring应用程序启动时，以上`SampleConfig` bean的`queueSize`字段值将设置为25。

## 162.3在运行时刷新配置

[Spring Cloud](https://cloud.spring.io/spring-cloud-static/docs/1.0.x/spring-cloud.html#_endpoints)提供支持以使配置参数可随向`/actuator/refresh`端点的POST请求重新加载。

1. 添加Spring Boot Actuator依赖项：

Maven坐标：

```
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

Gradle坐标：

```
dependencies {
    compile group: 'org.springframework.boot', name: 'spring-boot-starter-actuator'
}
```

1. 将`@RefreshScope`添加到Spring配置类中，以使参数在运行时可重新加载。

2. 将`management.endpoints.web.exposure.include=refresh`添加到`application.properties`中，以允许不受限制地访问`/actuator/refresh`。

3. 使用`gcloud`更新属性：

   ```
   $ gcloud beta runtime-config configs variables set \
     myapp.queue_size 200 \
     --config-name myapp_prod
   ```

4. 发送POST请求到刷新端点：

   ```
   $ curl -XPOST https://myapp.host.com/actuator/refresh
   ```

## 162.4示例

提供了一个[示例应用程序](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-config-sample)和一个代码[实验室](https://codelabs.developers.google.com/codelabs/cloud-spring-runtime-config/index.html)。

## 163. Spring Data Cloud Spanner

[Spring Data](https://projects.spring.io/spring-data/)是用于以多种存储技术存储和检索POJO的抽象。Spring Cloud GCP增加了Spring Data对[Google Cloud Spanner的](https://cloud.google.com/spanner/)支持。

Maven仅为此模块使用Spring Cloud GCP BOM进行协调：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-gcp-data-spanner</artifactId>
</dependency>
```

Gradle坐标：

```
dependencies {
    compile group: 'org.springframework.cloud', name: 'spring-cloud-gcp-data-spanner'
}
```

我们[为Spring Data扳手](https://www.springcloud.cc/spring-cloud-gcp-starters/spring-cloud-gcp-starter-data-spanner)提供了[Spring Boot入门工具](https://www.springcloud.cc/spring-cloud-gcp-starters/spring-cloud-gcp-starter-data-spanner)，您可以利用它利用我们建议的自动配置设置。要使用启动器，请参见下面的坐标。

Maven:

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-gcp-starter-data-spanner</artifactId>
</dependency>
```

Gradle:

```
dependencies {
    compile group: 'org.springframework.cloud', name: 'spring-cloud-gcp-starter-data-spanner'
}
```

此设置还负责引入Cloud Java Cloud Spanner库的最新兼容版本。

## 163.1配置

要设置Spring Data Cloud Spanner，您必须配置以下内容：

- 设置与Google Cloud Spanner的连接详细信息。
- 启用Spring Data Repositories（可选）。

### 163.1.1 Cloud Spanner设置

您可以[对Spring Data Spanner](https://www.springcloud.cc/spring-cloud-gcp-starters/spring-cloud-gcp-starter-data-spanner)使用[Spring Boot Starter](https://www.springcloud.cc/spring-cloud-gcp-starters/spring-cloud-gcp-starter-data-spanner)在Spring应用程序中自动配置Google Cloud Spanner。它包含所有必要的设置，使您可以轻松地通过Google Cloud项目进行身份验证。以下配置选项可用：

| Name                                                         | 描述                                                         | Required | Default value                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------ | -------- | ------------------------------------------------ |
| `spring.cloud.gcp.spanner.instance-id`                       | 要使用的Cloud Spanner实例                                    | Yes      |                                                  |
| `spring.cloud.gcp.spanner.database`                          | 使用的Cloud Spanner数据库                                    | Yes      |                                                  |
| `spring.cloud.gcp.spanner.project-id`                        | 托管Google Cloud Spanner API的GCP项目ID（如果与[Spring Cloud GCP核心模块中的](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-gcp-core) ID不同） | No       |                                                  |
| `spring.cloud.gcp.spanner.credentials.location`              | OAuth2用于与Google Cloud Spanner API进行身份验证的凭据（如果与[Spring Cloud GCP核心模块中的](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-gcp-core)凭据不同） | No       |                                                  |
| `spring.cloud.gcp.spanner.credentials.encoded-key`           | 用于与Google Cloud Spanner API进行身份验证的Base64编码的OAuth2凭据（如果与[Spring Cloud GCP核心模块中的](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-gcp-core)凭据不同） | No       |                                                  |
| `spring.cloud.gcp.spanner.credentials.scopes`                | [OAuth2适用于Spring Cloud GCP Cloud Spanner凭据的范围](https://developers.google.com/identity/protocols/googlescopes) 35 /} GCP Cloud Spanner凭据的[OAuth2范围](https://developers.google.com/identity/protocols/googlescopes) | No       | https://www.googleapis.com/auth/spanner.data     |
| `spring.cloud.gcp.spanner.createInterleavedTableDdlOnDeleteCascade` | 如果为`true`，则`SpannerSchemaUtils`为具有交错的父子关系的表生成的架构语句将为“ ON DELETE CASCADE”。如果`false`，则表的模式将为“ ON DELETE NO ACTION”。 | No       | `true`                                           |
| `spring.cloud.gcp.spanner.numRpcChannels`                    | 用于连接到Cloud Spanner的gRPC通道数                          | No       | 4 - Determined by Cloud Spanner client library   |
| `spring.cloud.gcp.spanner.prefetchChunks`                    | Cloud Spanner为读取和查询预取的块数                          | No       | 4 - Determined by Cloud Spanner client library   |
| `spring.cloud.gcp.spanner.minSessions`                       | 会话池中维护的最小会话数                                     | No       | 0 - Determined by Cloud Spanner client library   |
| `spring.cloud.gcp.spanner.maxSessions`                       | 会话池可以拥有的最大会话数                                   | No       | 400 - Determined by Cloud Spanner client library |
| `spring.cloud.gcp.spanner.maxIdleSessions`                   | 会话池将保持的最大空闲会话数                                 | No       | 0 - Determined by Cloud Spanner client library   |
| `spring.cloud.gcp.spanner.writeSessionsFraction`             | 要为写事务准备的会话比例                                     | No       | 0.2 - Determined by Cloud Spanner client library |
| `spring.cloud.gcp.spanner.keepAliveIntervalMinutes`          | 保持空闲会话多长时间                                         | No       | 30 - Determined by Cloud Spanner client library  |

### 163.1.2 Repository设置

可以通过主`@Configuration`类上的`@EnableSpannerRepositories`注释来配置Spring Data Repositories。使用我们针对Spring Data Cloud Spanner的Spring Boot入门程序，可以自动添加`@EnableSpannerRepositories`。不需要将其添加到其他任何类中，除非需要覆盖所提供的更细粒度的配置参数[`@EnableSpannerRepositories`](https://github.com/spring-cloud/spring-cloud-gcp/blob/master/spring-cloud-gcp-data-spanner/src/main/java/org/springframework/cloud/gcp/data/spanner/repository/config/EnableSpannerRepositories.java)。

### 163.1.3自动配置

我们的Spring Boot自动配置可在Spring应用程序上下文中创建以下beans：

- `SpannerTemplate`的实例
- `SpannerDatabaseAdminTemplate`的实例，用于从对象层次结构生成表架构以及创建和删除表和数据库
- 启用存储库后，扩展了`SpannerRepository`，`CrudRepository`，`PagingAndSortingRepository`的所有用户定义存储库的实例
- 来自Google Cloud Java Client for Spanner的`DatabaseClient`实例，以方便使用和较低级别的API访问

## 163.2对象映射

Spring Data Cloud Spanner允许您通过注释将域POJO映射到Cloud Spanner表：

```
@Table(name = "traders")
public class Trader {

    @PrimaryKey
    @Column(name = "trader_id")
    String traderId;

    String firstName;

    String lastName;

    @NotMapped
    Double temporaryNumber;
}
```

Spring Data Cloud Spanner将忽略任何带有`@NotMapped`注释的属性。这些属性将不会写入或读取Spanner。

### 163.2.1构造函数

POJO支持简单的构造函数。构造函数参数可以是持久属性的子集。每个构造函数参数都必须具有与实体上的持久属性相同的名称和类型，构造函数应从给定参数设置属性。不支持未直接设置为属性的参数。

```
@Table(name = "traders")
public class Trader {
    @PrimaryKey
    @Column(name = "trader_id")
    String traderId;

    String firstName;

    String lastName;

    @NotMapped
    Double temporaryNumber;

    public Trader(String traderId, String firstName) {
        this.traderId = traderId;
        this.firstName = firstName;
    }
}
```

### 163.2.2表

`@Table`批注可以提供Cloud Spanner表的名称，该表存储带注释的类的实例，每行一个。该注释是可选的，如果未给出，则从类名推断出表名，并且首字符不大写。

#### 表名的SpEL表达式

在某些情况下，您可能希望动态确定`@Table`表名。为此，您可以使用[Spring表达式语言](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#expressions)。

例如：

```
@Table(name = "trades_#{tableNameSuffix}")
public class Trade {
    // ...
}
```

仅当在Spring应用程序上下文中定义了`tableNameSuffix`值/ bean时，才会解析表名。例如，如果`tableNameSuffix`的值为“ 123”，则表名将解析为`trades_123`。

### 163.2.3主键

对于一个简单的表，您可能只有一个由单列组成的主键。即使在这种情况下，也需要`@PrimaryKey`批注。`@PrimaryKey`标识与主键相对应的一个或多个ID属性。

Spanner对多列复合主键具有一流的支持。您必须使用`@PrimaryKey`注释主键所包含的所有POJO字段，如下所示：

```
@Table(name = "trades")
public class Trade {
    @PrimaryKey(keyOrder = 2)
    @Column(name = "trade_id")
    private String tradeId;

    @PrimaryKey(keyOrder = 1)
    @Column(name = "trader_id")
    private String traderId;

    private String action;

    private Double price;

    private Double shares;

    private String symbol;
}
```

`@PrimaryKey`的`keyOrder`参数按顺序标识与主键列相对应的属性，从1开始并连续增加。顺序很重要，必须反映出Cloud Spanner模式中定义的顺序。在我们的示例中，用于创建表的DDL及其主键如下：

```
CREATE TABLE trades (
    trader_id STRING(MAX),
    trade_id STRING(MAX),
    action STRING(15),
    symbol STRING(10),
    price FLOAT64,
    shares FLOAT64
) PRIMARY KEY (trader_id, trade_id)
```

Spanner没有自动生成ID。对于大多数用例，应谨慎使用顺序ID，以避免在系统中创建数据热点。阅读[Spanner主键文档](https://cloud.google.com/spanner/docs/schema-and-data-model#primary_keys)，以更好地了解主键和推荐的做法。

### 163.2.4列

POJO上的所有可访问属性都将自动识别为“ Cloud Spanner”列。列命名由`PropertyNameFieldNamingStrategy` bean上默认定义的`PropertyNameFieldNamingStrategy`生成。`@Column`注释可以选择提供与属性和其他设置不同的列名：

- `name`是列的可选名称
- `spannerTypeMaxLength`为`STRING`和`BYTES`列指定最大长度。仅在基于域类型生成DDL架构语句时使用此设置。
- `nullable`指定是否将列创建为`NOT NULL`。仅在基于域类型生成DDL架构语句时使用此设置。
- `spannerType`是您可以选择指定的Cloud Spanner列类型。如果未指定，则从Java属性类型推断兼容的列类型。
- `spannerCommitTimestamp`是一个布尔值，指定此属性是否对应于自动填充的提交时间戳记列。写入Cloud Spanner时，将忽略此属性中设置的任何值。

### 163.2.5嵌入式对象

如果将`B`类型的对象作为`A`的属性嵌入，则`B`的列将与`A`的列保存在同一Cloud Spanner表中。

如果`B`具有主键列，则这些列将包含在`A`的主键中。`B`也可以具有嵌入式属性。嵌入允许在多个实体之间重复使用列，并且对于实现父子情况非常有用，因为Cloud Spanner要求子表包括其父项的关键列。

例如：

```
class X {
  @PrimaryKey
  String grandParentId;

  long age;
}

class A {
  @PrimaryKey
  @Embedded
  X grandParent;

  @PrimaryKey(keyOrder = 2)
  String parentId;

  String value;
}

@Table(name = "items")
class B {
  @PrimaryKey
  @Embedded
  A parent;

  @PrimaryKey(keyOrder = 2)
  String id;

  @Column(name = "child_value")
  String value;
}
```

`B`实体可以存储在定义为的表中：

```
CREATE TABLE items (
    grandParentId STRING(MAX),
    parentId STRING(MAX),
    id STRING(MAX),
    value STRING(MAX),
    child_value STRING(MAX),
    age INT64
) PRIMARY KEY (grandParentId, parentId, id)
```

请注意，嵌入属性的列名称必须全部唯一。

### 163.2.6关系

Spring Data Cloud Spanner使用Cloud Spanner [父子交错表机制](https://cloud.google.com/spanner/docs/schema-and-data-model#creating-interleaved-tables)支持父子关系。Cloud Spanner交错表强制一对多关系，并在单个域父实体的实体上提供有效的查询和操作。这些关系最多可以达到7个层次。Cloud Spanner还提供了自动级联删除或强制删除父级之前的子实体。

尽管可以使用交错的父子表构建在Cloud Spanner和Spring Data Cloud Spanner中实现一对一和多对多关系，但仅本地支持父子关系。Cloud Spanner不支持外键约束，尽管父子键约束在与交错表一起使用时会强制执行类似的要求。

例如，以下Java实体：

```
@Table(name = "Singers")
class Singer {
  @PrimaryKey
  long SingerId;

  String FirstName;

  String LastName;

  byte[] SingerInfo;

  @Interleaved
  List<Album> albums;
}

@Table(name = "Albums")
class Album {
  @PrimaryKey
  long SingerId;

  @PrimaryKey(keyOrder = 2)
  long AlbumId;

  String AlbumTitle;
}
```

这些类可以对应于一对现有的交错表。`@Interleaved`批注可以应用于`Collection`属性，并且内部类型被解析为子实体类型。创建它们所需的架构也可以使用`SpannerSchemaUtils`生成，并使用`SpannerDatabaseAdminTemplate`执行：

```
@Autowired
SpannerSchemaUtils schemaUtils;

@Autowired
SpannerDatabaseAdminTemplate databaseAdmin;
...

// Get the create statmenets for all tables in the table structure rooted at Singer
List<String> createStrings = this.schemaUtils.getCreateTableDdlStringsForInterleavedHierarchy(Singer.class);

// Create the tables and also create the database if necessary
this.databaseAdmin.executeDdlStrings(createStrings, true);
```

`createStrings`列表包含表架构语句，这些语句使用与提供的Java类型兼容的列名称和类型，以及根据配置的自定义转换器包含在其中的任何已解析子关系类型。

```
CREATE TABLE Singers (
  SingerId   INT64 NOT NULL,
  FirstName  STRING(1024),
  LastName   STRING(1024),
  SingerInfo BYTES(MAX),
) PRIMARY KEY (SingerId);

CREATE TABLE Albums (
  SingerId     INT64 NOT NULL,
  AlbumId      INT64 NOT NULL,
  AlbumTitle   STRING(MAX),
) PRIMARY KEY (SingerId, AlbumId),
  INTERLEAVE IN PARENT Singers ON DELETE CASCADE;
```

`ON DELETE CASCADE`子句表示如果删除歌手，则Cloud Spanner会删除该歌手的所有专辑。另一种选择是`ON DELETE NO ACTION`，在此歌手要删除所有歌手的专辑之后才能删除。使用`SpannerSchemaUtils`生成架构字符串时，`spring.cloud.gcp.spanner.createInterleavedTableDdlOnDeleteCascade`布尔设置确定这些架构是针对`true`的`ON DELETE CASCADE`还是针对`false`的`ON DELETE NO ACTION`生成的。

Cloud Spanner将这些关系限制为7个子层。一个表可能有多个子表。

在将对象更新或插入Cloud Spanner时，其所有引用的子对象也将分别更新或插入同一请求中。在读取时，所有交错的子行也都被读取。

### 163.2.7支持的类型

Spring Data Cloud Spanner本机支持常规字段的以下类型，但也使用自定义转换器（在以下各节中详细介绍）和数十个预定义的Spring Data自定义转换器来处理其他常见的Java类型。

本机支持的类型：

- `com.google.cloud.ByteArray`
- `com.google.cloud.Date`
- `com.google.cloud.Timestamp`
- `java.lang.Boolean`, `boolean`
- `java.lang.Double`, `double`
- `java.lang.Long`, `long`
- `java.lang.Integer`, `int`
- `java.lang.String`
- `double[]`
- `long[]`
- `boolean[]`
- `java.util.Date`
- `java.util.Instant`
- `java.sql.Date`

### 163.2.8列表

Spanner支持`ARRAY`类型的列。`ARRAY`列被映射到POJOS中的`List`字段。

例：

```
List<Double> curve;
```

列表内的类型可以是任何单个属性类型。

### 163.2.9结构列表

Cloud Spanner查询可以[构造STRUCT值](https://cloud.google.com/spanner/docs/query-syntax#using-structs-with-select)，这些[值](https://cloud.google.com/spanner/docs/query-syntax#using-structs-with-select)在结果中显示为列。Cloud Spanner要求STRUCT值出现在根级别为`SELECT ARRAY(SELECT STRUCT(1 as val1, 2 as val2)) as pair FROM Users`的ARRAY中。

Spring Data Cloud Spanner将尝试将STRUCT列值读入属性，该属性是`Iterable`实体类型，该实体类型与STRUCT列的值兼容。

对于前面的数组选择示例，可以将以下属性与构造的`ARRAY<STRUCT>`列进行映射：`List<TwoInts> pair;`其中定义了`TwoInts`类型：

```
class TwoInts {

  int val1;

  int val2;
}
```

### 163.2.10自定义类型

定制转换器可用于扩展对用户定义类型的类型支持。

1. 转换器需要在两个方向上实现`org.springframework.core.convert.converter.Converter`接口。
2. 用户定义的类型需要映射到Spanner支持的基本类型之一：
   - `com.google.cloud.ByteArray`
   - `com.google.cloud.Date`
   - `com.google.cloud.Timestamp`
   - `java.lang.Boolean`, `boolean`
   - `java.lang.Double`, `double`
   - `java.lang.Long`, `long`
   - `java.lang.String`
   - `double[]`
   - `long[]`
   - `boolean[]`
   - `enum`类型
3. 两个转换器的实例都需要传递到`ConverterAwareMappingSpannerEntityProcessor`，然后必须将其作为`SpannerEntityProcessor`的`@Bean`使用。

例如：

我们希望在`Trade` POJO上有一个类型为`Person`的字段：

```
@Table(name = "trades")
public class Trade {
  //...
  Person person;
  //...
}
```

其中Person是一个简单的类：

```
public class Person {

  public String firstName;
  public String lastName;

}
```

我们必须定义两个转换器：

```
  public class PersonWriteConverter implements Converter<Person, String> {

    @Override
    public String convert(Person person) {
      return person.firstName + " " + person.lastName;
    }
  }

  public class PersonReadConverter implements Converter<String, Person> {

    @Override
    public Person convert(String s) {
      Person person = new Person();
      person.firstName = s.split(" ")[0];
      person.lastName = s.split(" ")[1];
      return person;
    }
  }
```

这将在我们的`@Configuration`文件中进行配置：

```
@Configuration
public class ConverterConfiguration {

    @Bean
    public SpannerEntityProcessor spannerEntityProcessor(SpannerMappingContext spannerMappingContext) {
        return new ConverterAwareMappingSpannerEntityProcessor(spannerMappingContext,
                Arrays.asList(new PersonWriteConverter()),
                Arrays.asList(new PersonReadConverter()));
    }
}
```

### 163.2.11结构数组列的自定义转换器

如果提供了`Converter<Struct, A>`，则可以在您的实体类型中使用类型`List<A>`的属性。

## 163.3扳手操作和模板

`SpannerOperations`及其实现`SpannerTemplate`提供了Spring开发人员熟悉的模板模式。它提供：

- 资源管理
- 使用Spring Data POJO映射和转换功能一站式服务到Spanner操作
- 异常转换

使用我们的Spring Boot Starter for Spanner提供的`autoconfigure`，您的Spring应用程序上下文将包含一个完全配置的`SpannerTemplate`对象，您可以轻松地在应用程序中自动装配：

```
@SpringBootApplication
public class SpannerTemplateExample {

    @Autowired
    SpannerTemplate spannerTemplate;

    public void doSomething() {
        this.spannerTemplate.delete(Trade.class, KeySet.all());
        //...
        Trade t = new Trade();
        //...
        this.spannerTemplate.insert(t);
        //...
        List<Trade> tradesByAction = spannerTemplate.findAll(Trade.class);
        //...
    }
}
```

模板API提供了以下便捷方法：

- [读取](https://cloud.google.com/spanner/docs/reads)，并通过提供SpannerReadOptions和SpannerQueryOptions
  - 过时的阅读
  - 阅读二级索引
  - 读取限制和偏移
  - 阅读排序
- [查询](https://cloud.google.com/spanner/docs/reads#execute_a_query)
- DML操作（删除，插入，更新，更新）
- 部分读取
  - 您可以定义一组要读入实体的列
- 部分写入
  - 仅保留您实体的一些属性
- 只读交易
- 锁定读写事务

### 163.3.1 SQL查询

Cloud Spanner具有运行只读查询的SQL支持。所有与查询相关的方法均以`SpannerTemplate`中的`query`开头。使用`SpannerTemplate`，您可以执行映射到POJO的SQL查询：

```
List<Trade> trades = this.spannerTemplate.query(Trade.class, Statement.of("SELECT * FROM trades"));
```

### 163.3.2读取

Spanner公开了一个[Read API，](https://cloud.google.com/spanner/docs/reads)用于读取表或辅助索引中的单行或多行。

使用`SpannerTemplate`，您可以执行读取，例如：

```
List<Trade> trades = this.spannerTemplate.readAll(Trade.class);
```

与查询相比，读取的主要好处是，使用[`KeySet`](https://github.com/GoogleCloudPlatform/google-cloud-java/blob/master/google-cloud-spanner/src/main/java/com/google/cloud/spanner/KeySet.java)类的功能可以更轻松地读取键模式的多行。

### 163.3.3高级读取

#### 过时的阅读

默认情况下，所有读取和查询均为**强读取**。一个**强大的读取**是在当前时间戳的读取，并保证地看到，一直致力于直到这个读开始的所有数据。一个**阅读陈旧**，另一方面在过去的时间戳被读取。Cloud Spanner允许您确定读取数据时数据的最新程度。使用`SpannerTemplate`，您可以通过将`SpannerQueryOptions`或`SpannerReadOptions`上的`Timestamp`设置为适当的读取或查询方法来指定：

读：

```
// a read with options:
SpannerReadOptions spannerReadOptions = new SpannerReadOptions().setTimestamp(Timestamp.now());
List<Trade> trades = this.spannerTemplate.readAll(Trade.class, spannerReadOptions);
```

查询：

```
// a query with options:
SpannerQueryOptions spannerQueryOptions = new SpannerQueryOptions().setTimestamp(Timestamp.now());
List<Trade> trades = this.spannerTemplate.query(Trade.class, Statement.of("SELECT * FROM trades"), spannerQueryOptions);
```

#### 从二级索引读取

可以通过模板API 使用[辅助索引](https://cloud.google.com/spanner/docs/secondary-indexes)进行读取，也可以通过SQL for Queries隐式使用[辅助索引](https://cloud.google.com/spanner/docs/secondary-indexes)。

下面显示了如何通过在`SpannerReadOptions`上设置`index` 来使用[二级索引](https://cloud.google.com/spanner/docs/secondary-indexes)从表中读取行：

```
SpannerReadOptions spannerReadOptions = new SpannerReadOptions().setIndex("TradesByTrader");
List<Trade> trades = this.spannerTemplate.readAll(Trade.class, spannerReadOptions);
```

#### 读取偏移量和限制

限制和偏移量仅受查询支持。以下将仅获取查询的前两行：

```
SpannerQueryOptions spannerQueryOptions = new SpannerQueryOptions().setLimit(2).setOffset(3);
List<Trade> trades = this.spannerTemplate.query(Trade.class, Statement.of("SELECT * FROM trades"), spannerQueryOptions);
```

请注意，以上等效于执行`SELECT * FROM trades LIMIT 2 OFFSET 3`。

#### 排序

按键读取不支持排序。但是，对Template API的查询支持通过标准SQL以及Spring Data Sort API进行排序：

```
List<Trade> trades = this.spannerTemplate.queryAll(Trade.class, Sort.by("action"));
```

如果提供的排序字段名称是域类型属性的名称，则将在查询中使用与该属性对应的列名称。否则，假定给定的字段名称是Cloud Spanner表中列的名称。可以忽略大小写，对Cloud Spanner类型STRING和BYTES的列进行排序：

```
Sort.by(Order.desc("action").ignoreCase())
```

#### 部分阅读

仅在使用查询时才可以进行部分读取。如果查询返回的行的列少于要映射到的实体的列，则Spring Data将仅映射返回的列。此设置也适用于嵌套结构及其相应的嵌套POJO属性。

```
List<Trade> trades = this.spannerTemplate.query(Trade.class, Statement.of("SELECT action, symbol FROM trades"),
    new SpannerQueryOptions().setAllowMissingResultSetColumns(true));
```

如果设置设置为`false`，则查询结果中缺少列时将引发异常。

#### 查询与读取的选项摘要

| Feature                | Query supports it | Read supports it |
| ---------------------- | ----------------- | ---------------- |
| SQL                    | yes               | no               |
| Partial read           | yes               | no               |
| Limits                 | yes               | no               |
| Offsets                | yes               | no               |
| Secondary index        | yes               | yes              |
| Read using index range | no                | yes              |
| Sorting                | yes               | no               |

### 163.3.4写入/更新

`SpannerOperations`的write方法接受POJO并将其所有属性写入Spanner。相应的Spanner表和实体元数据是从给定对象的实际类型获得的。

如果从Spanner检索了POJO，并且更改了其主键属性值，然后写入或更新了该POJO，则该操作将针对具有新主键值的行进行。具有原始主键值的行将不受影响。

#### 插入

`SpannerOperations`的`insert`方法接受POJO并将其所有属性写入Spanner，这意味着如果表中已经存在带有POJO主键的行，则该操作将失败。

```
Trade t = new Trade();
this.spannerTemplate.insert(t);
```

#### 更新资料

`SpannerOperations`的`update`方法接受POJO并将其所有属性写入Spanner，这意味着如果表中尚不存在POJO的主键，则该操作将失败。

```
// t was retrieved from a previous operation
this.spannerTemplate.update(t);
```

#### 增补

`SpannerOperations`的`upsert`方法接受POJO，并使用更新或插入将其所有属性写入Spanner。

```
// t was retrieved from a previous operation or it's new
this.spannerTemplate.upsert(t);
```

#### 部分更新

`SpannerOperations`的更新方法默认在给定对象内的所有属性上运行，但也接受列名称的`String[]`和`Optional<Set<String>>`。如果一组列名称的`Optional`为空，则所有列都将写入Spanner。但是，如果Optional被空集占用，则不会写入任何列。

```
// t was retrieved from a previous operation or it's new
this.spannerTemplate.update(t, "symbol", "action");
```

### 163.3.5 DML

可以使用`SpannerOperations.executeDmlStatement`执行DML语句。插入，更新和删除可以影响任意数量的行和实体。

### 163.3.6交易

`SpannerOperations`提供了在单个事务中运行`java.util.Function`对象的方法，同时使来自`SpannerOperations`的读取和写入方法可用。

#### 读/写事务

`SpannerOperations`通过`performReadWriteTransaction`方法提供读写事务：

```
@Autowired
SpannerOperations mySpannerOperations;

public String doWorkInsideTransaction() {
  return mySpannerOperations.performReadWriteTransaction(
    transActionSpannerOperations -> {
      // Work with transActionSpannerOperations here.
      // It is also a SpannerOperations object.

      return "transaction completed";
    }
  );
}
```

`performReadWriteTransaction`方法接受`Function`对象，该对象提供了`SpannerOperations`对象的实例。函数的最终返回值和类型由用户确定。您可以像常规的`SpannerOperations`一样使用此对象，但有一些例外：

- 它的读取功能无法执行陈旧的读取，因为所有读取和写入都在事务的单个时间点进行。
- 它无法通过`performReadWriteTransaction`或`performReadOnlyTransaction`执行子交易。

由于这些读写事务正在锁定，因此如果函数不执行任何写操作，则建议您使用`performReadOnlyTransaction`。

#### 只读交易

`performReadOnlyTransaction`方法用于使用`SpannerOperations`执行只读事务：

```
@Autowired
SpannerOperations mySpannerOperations;

public String doWorkInsideTransaction() {
  return mySpannerOperations.performReadOnlyTransaction(
    transActionSpannerOperations -> {
      // Work with transActionSpannerOperations here.
      // It is also a SpannerOperations object.

      return "transaction completed";
    }
  );
}
```

`performReadOnlyTransaction`方法接受提供`SpannerOperations`对象实例的`Function`。此方法还接受`ReadOptions`对象，但是唯一使用的属性是用于及时确定快照以在事务中执行读取的时间戳记。如果未在读取选项中设置时间戳，则将针对数据库的当前状态运行事务。函数的最终返回值和类型由用户确定。您可以像使用普通`SpannerOperations`一样使用此对象，但有一些例外：

- 它的读取功能无法执行陈旧的读取，因为所有读取都在事务的单个时间点发生。
- 它无法通过`performReadWriteTransaction`或`performReadOnlyTransaction`执行子交易
- 它无法执行任何写操作。

由于只读事务是非锁定的，并且可以在过去的某个时间点执行，因此建议将这些事务用于不执行写操作的功能。

#### 带有@Transactional批注的声明式事务

此功能需要使用`spring-cloud-gcp-starter-data-spanner`时提供的`SpannerTransactionManager`中的bean。

`SpannerTemplate`和`SpannerRepository`通过`@Transactional` [注释]（[https://docs.spring.io/spring/docs/current/spring-framework-reference/data-access.html#交易声明式](https://docs.spring.io/spring/docs/current/spring-framework-reference/data-access.html#transaction-declarative)）作为交易。如果用`@Transactional`注释的方法调用了也注释的另一个方法，则这两种方法将在同一事务中工作。`performReadOnlyTransaction`和`performReadWriteTransaction`无法在带注释的`@Transactional`方法中使用，因为Cloud Spanner不支持事务内的事务。

### 163.3.7 DML语句

`SpannerTemplate`支持[DML]（https://cloud.google.com/spanner/docs/dml-tasks）`Statements`。可以通过`performReadWriteTransaction`或使用`@Transactional`批注在事务中执行DML语句。

当DML语句在事务之外执行时，它们将以[partitioned-mode]（https://cloud.google.com/spanner/docs/dml-tasks#partitioned-dml）执行。

## 163.4 Repositories

[Spring Data Repositories](https://docs.spring.io/spring-data/data-commons/docs/current/reference/html/#repositories)是一种功能强大的抽象，可以节省许多样板代码。

例如：

```
public interface TraderRepository extends SpannerRepository<Trader, String> {
}
```

Spring Data生成指定接口的有效实现，可以方便地将其自动连接到应用程序中。

`SpannerRepository`的`Trader`类型参数引用基础域类型。第二种类型参数`String`在这种情况下是指域类型的键的类型。

对于具有复合主键的POJO，此ID类型参数可以是与所有主键属性兼容的`Object[]`的任何后代，`Iterable`或`com.google.cloud.spanner.Key`的任何后代。如果域POJO类型只有一个主键列，则可以使用主键属性类型，也可以使用`Key`类型。

例如，在属于交易者的交易中，`TradeRepository`看起来像这样：

```
public interface TradeRepository extends SpannerRepository<Trade, String[]> {

}
public class MyApplication {

	@Autowired
	SpannerTemplate spannerTemplate;

	@Autowired
	StudentRepository studentRepository;

	public void demo() {

		this.tradeRepository.deleteAll();
		String traderId = "demo_trader";
		Trade t = new Trade();
		t.symbol = stock;
		t.action = action;
		t.traderId = traderId;
		t.price = 100.0;
		t.shares = 12345.6;
		this.spannerTemplate.insert(t);

		Iterable<Trade> allTrades = this.tradeRepository.findAll();

		int count = this.tradeRepository.countByAction("BUY");

	}
}
```

### 163.4.1 CRUD Repository

`CrudRepository`方法按预期工作，但Spanner特有一项功能：`save`和`saveAll`方法用作更新或插入。

### 163.4.2分页和排序Repository

您也可以将`PagingAndSortingRepository`与Spanner Spring Data一起使用。此接口可用的排序和可分页的`findAll`方法在Spanner数据库的当前状态下运行。结果，当在页面之间移动时，请注意数据库的状态（和结果）可能会改变。

### 163.4.3扳手Repository

`SpannerRepository`扩展了`PagingAndSortingRepository`，但添加了Spanner提供的只读和读写事务功能。这些事务与`SpannerOperations`的事务非常相似，但是特定于存储库的域类型，并提供存储库功能而不是模板功能。

例如，这是一个读写事务：

```
@Autowired
SpannerRepository myRepo;

public String doWorkInsideTransaction() {
  return myRepo.performReadOnlyTransaction(
    transactionSpannerRepo -> {
      // Work with the single-transaction transactionSpannerRepo here.
      // This is a SpannerRepository object.

      return "transaction completed";
    }
  );
}
```

在为自己的域类型和查询方法创建自定义存储库时，您可以扩展`SpannerRepository`以访问特定于Cloud Spanner的功能以及`PagingAndSortingRepository`和`CrudRepository`中的所有功能。

## 163.5查询方法

`SpannerRepository`支持查询方法。在以下各节中将介绍这些方法，这些方法位于您的自定义存储库接口中，这些接口的实现是根据其名称和注释生成的。查询方法可以读取，写入和删除Cloud Spanner中的实体。这些方法的参数可以是直接支持或通过自定义配置的转换器支持的任何Cloud Spanner数据类型。参数也可以是`Struct`类型或POJO。如果给出POJO作为参数，它将使用与创建写突变相同的类型转换逻辑转换为`Struct`。使用Struct参数进行的比较仅限于[Cloud Spanner可用的](https://cloud.google.com/spanner/docs/data-types#limited-comparisons-for-struct)参数。

### 163.5.1按约定查询方法

```
public interface TradeRepository extends SpannerRepository<Trade, String[]> {
    List<Trade> findByAction(String action);

	int countByAction(String action);

	// Named methods are powerful, but can get unwieldy
	List<Trade> findTop3DistinctByActionAndSymbolIgnoreCaseOrTraderIdOrderBySymbolDesc(
  			String action, String symbol, String traderId);
}
```

在上面的示例中，使用[Spring Data查询创建命名约定](https://docs.spring.io/spring-data/data-commons/docs/current/reference/html#repositories.query-methods.query-creation)，根据方法的名称在`TradeRepository`中生成[查询方法](https://docs.spring.io/spring-data/data-commons/docs/current/reference/html/#repositories.query-methods)。

`List<Trade> findByAction(String action)`将转换为`SELECT * FROM trades WHERE action = ?`。

函数`List<Trade> findTop3DistinctByActionAndSymbolIgnoreCaseOrTraderIdOrderBySymbolDesc(String action, String symbol, String traderId);`将被翻译为以下SQL查询的等效项：

```
SELECT DISTINCT * FROM trades
WHERE ACTION = ? AND LOWER(SYMBOL) = LOWER(?) AND TRADER_ID = ?
ORDER BY SYMBOL DESC
LIMIT 3
```

支持以下过滤器选项：

- 平等
- 大于或等于
- 比...更棒
- 小于或等于
- 少于
- 一片空白
- 不为空
- 是真的
- 是假的
- 像弦一样
- 不像字符串
- 包含一个字符串
- 不包含字符串

请注意，短语`SymbolIgnoreCase`被翻译为`LOWER(SYMBOL) = LOWER(?)`，表示不区分大小写。`IgnoreCase`短语只能附加到与STRING或BYTES类型的列相对应的字段中。不支持在方法名称末尾附加的Spring Data“ AllIgnoreCase”短语。

`Like`或`NotLike`命名约定：

```
List<Trade> findBySymbolLike(String symbolFragment);
```

参数`symbolFragment`可以包含用于字符串匹配的[通配符](https://cloud.google.com/spanner/docs/functions-and-operators#comparison-operators)，例如`_`和`%`。

`Contains`和`NotContains`命名约定：

```
List<Trade> findBySymbolContains(String symbolFragment);
```

参数`symbolFragment`是一个[正则表达式](https://cloud.google.com/spanner/docs/functions-and-operators#regexp_contains)，将对其进行检查。

还支持删除查询。例如，诸如`deleteByAction`或`removeByAction`之类的查询方法会删除`findByAction`找到的实体。删除操作发生在单个事务中。

删除查询可以具有以下返回类型：*整数类型，它是删除的实体数*删除的实体的集合* `void`

### 163.5.2自定义SQL / DML查询方法

上面的`List<Trade> fetchByActionNamedQuery(String action)`示例与[Spring Data查询创建命名约定](https://docs.spring.io/spring-data/data-commons/docs/current/reference/html#repositories.query-methods.query-creation)不匹配，因此我们必须将参数化的Spanner SQL查询映射到它。

可以通过以下两种方式之一将方法的SQL查询映射到存储库方法：

- `namedQueries`属性文件
- 使用`@Query`批注

SQL的标记名称与方法参数的`@Param`带注释的名称相对应。

自定义SQL查询方法可以接受单个`Sort`或`Pageable`参数，该参数将应用于SQL中的任何排序或分页：

```
    @Query("SELECT * FROM trades ORDER BY action DESC")
    List<Trade> sortedTrades(Pageable pageable);

    @Query("SELECT * FROM trades ORDER BY action DESC LIMIT 1")
    Trade sortedTopTrade(Pageable pageable);
```

可以使用：

```
    List<Trade> customSortedTrades = tradeRepository.sortedTrades(PageRequest
                .of(2, 2, org.springframework.data.domain.Sort.by(Order.asc("id"))));
```

结果将按“ id”以升序排序。

您的查询方法还可以返回非实体类型：

```
    @Query("SELECT COUNT(1) FROM trades WHERE action = @action")
    int countByActionQuery(String action);

    @Query("SELECT EXISTS(SELECT COUNT(1) FROM trades WHERE action = @action)")
    boolean existsByActionQuery(String action);

    @Query("SELECT action FROM trades WHERE action = @action LIMIT 1")
    String getFirstString(@Param("action") String action);

    @Query("SELECT action FROM trades WHERE action = @action")
    List<String> getFirstStringList(@Param("action") String action);
```

DML语句也可以通过查询方法执行，但是唯一可能的返回值是`long`，代表受影响的行数。必须在`@Query`上设置`dmlStatement`布尔设置，以指示查询方法是作为DML语句执行的。

```
  	@Query(value = "DELETE FROM trades WHERE action = @action", dmlStatement = true)
  	long deleteByActionQuery(String action);
```

#### 具有命名查询属性的查询方法

默认情况下，`@EnableSpannerRepositories`上的`namedQueriesLocation`属性指向`META-INF/spanner-named-queries.properties`文件。您可以通过提供SQL作为“ interface.method”属性的值来在属性文件中指定方法的查询：

```
Trade.fetchByActionNamedQuery=SELECT * FROM trades WHERE trades.action = @tag0
public interface TradeRepository extends SpannerRepository<Trade, String[]> {
	// This method uses the query from the properties file instead of one generated based on name.
	List<Trade> fetchByActionNamedQuery(@Param("tag0") String action);
}
```

#### 带注释的查询方法

使用`@Query`批注：

```
public interface TradeRepository extends SpannerRepository<Trade, String[]> {
    @Query("SELECT * FROM trades WHERE trades.action = @tag0")
    List<Trade> fetchByActionNamedQuery(@Param("tag0") String action);
}
```

表名可以直接使用。例如，以上示例中的“交易”。或者，也可以从域类的`@Table`批注中解析表名。在这种情况下，查询应引用具有`:`个字符之间的完全限定类名的表名：`:fully.qualified.ClassName:`。完整的示例如下所示：

```
@Query("SELECT * FROM :com.example.Trade: WHERE trades.action = @tag0")
List<Trade> fetchByActionNamedQuery(String action);
```

这允许在自定义查询中使用用SpEL评估的表名。

SpEL也可以用于提供SQL参数：

```
@Query("SELECT * FROM :com.example.Trade: WHERE trades.action = @tag0
  AND price > #{#priceRadius * -1} AND price < #{#priceRadius * 2}")
List<Trade> fetchByActionNamedQuery(String action, Double priceRadius);
```

### 163.5.3投影

Spring Data Spanner支持[投影](https://docs.spring.io/spring-data/data-commons/docs/current/reference/html/#projections)。您可以根据域类型定义投影接口，并添加查询方法以在存储库中返回它们：

```
public interface TradeProjection {

    String getAction();

    @Value("#{target.symbol + ' ' + target.action}")
    String getSymbolAndAction();
}

public interface TradeRepository extends SpannerRepository<Trade, Key> {

    List<Trade> findByTraderId(String traderId);

    List<TradeProjection> findByAction(String action);

    @Query("SELECT action, symbol FROM trades WHERE action = @action")
    List<TradeProjection> findByQuery(String action);
}
```

可以通过基于名称约定的查询方法以及自定义SQL查询来提供投影。如果使用自定义SQL查询，则可以进一步限制从Spanner检索的列，使其仅限于投影所需要的列，以提高性能。

使用SpEL定义的投影类型中的Properties对基础域对象使用固定名称`target`。结果，访问基础属性的格式为`target.<property-name>`。

### 163.5.4 REST Repositories

使用Spring Boot运行时，只需将此依赖项添加到pom文件即可将存储库公开为REST服务：

```
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-rest</artifactId>
</dependency>
```

如果您希望配置参数（例如path），则可以使用`@RepositoryRestResource`批注：

```
@RepositoryRestResource(collectionResourceRel = "trades", path = "trades")
public interface TradeRepository extends SpannerRepository<Trade, String[]> {
}
```

例如，您可以使用`curl http://<server>:<port>/trades`检索存储库中的所有`Trade`对象，也可以通过`curl http://<server>:<port>/trades/<trader_id>,<trade_id>`检索任何特定交易。

在这种情况下，主键组件`id`和`trader_id`之间的分隔符在默认情况下是逗号，但是可以通过扩展`SpannerKeyIdConverter`类将其配置为在键值中找不到的任何字符串：

```
@Component
class MySpecialIdConverter extends SpannerKeyIdConverter {

    @Override
    protected String getUrlIdSeparator() {
        return ":";
    }
}
```

您也可以使用`curl -XPOST -H"Content-Type: application/json" -d@test.json http://<server>:<port>/trades/`进行交易，其中文件`test.json`包含`Trade`对象的JSON表示形式。

## 163.6数据库和Schema管理员

Spanner实例中的数据库和表可以从`SpannerPersistentEntity`对象自动创建：

```
@Autowired
private SpannerSchemaUtils spannerSchemaUtils;

@Autowired
private SpannerDatabaseAdminTemplate spannerDatabaseAdminTemplate;

public void createTable(SpannerPersistentEntity entity) {
    if(!spannerDatabaseAdminTemplate.tableExists(entity.tableName()){

      // The boolean parameter indicates that the database will be created if it does not exist.
      spannerDatabaseAdminTemplate.executeDdlStrings(Arrays.asList(
            spannerSchemaUtils.getCreateTableDDLString(entity.getType())), true);
    }
}
```

可以为具有交错关系和组合键的整个对象层次结构生成模式。

## 163.7示例

提供了[示例应用程序](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-data-spanner-sample)。

## 164. Spring Data Cloud Datastore

[Spring Data](https://projects.spring.io/spring-data/)是用于以多种存储技术存储和检索POJO的抽象。Spring Cloud GCP增加了Spring Data对[Google Cloud Datastore的](https://cloud.google.com/datastore/)支持。

Maven仅为此模块使用[Spring Cloud GCP BOM进行](https://github.com/spring-cloud/spring-cloud-gcp/blob/master/spring-cloud-gcp-dependencies/pom.xml)协调：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-gcp-data-datastore</artifactId>
</dependency>
```

Gradle坐标：

```
dependencies {
    compile group: 'org.springframework.cloud', name: 'spring-cloud-gcp-data-datastore'
}
```

我们[为Spring Data数据存储](https://www.springcloud.cc/spring-cloud-gcp-starters/spring-cloud-gcp-starter-data-datastore)提供了[Spring Boot入门程序](https://www.springcloud.cc/spring-cloud-gcp-starters/spring-cloud-gcp-starter-data-datastore)，您可以使用它使用我们推荐的自动配置设置。要使用启动器，请参见以下坐标。

Maven:

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-gcp-starter-data-datastore</artifactId>
</dependency>
```

Gradle:

```
dependencies {
    compile group: 'org.springframework.cloud', name: 'spring-cloud-gcp-starter-data-datastore'
}
```

此设置还负责引入Cloud Java Cloud Datastore库的最新兼容版本。

## 164.1配置

要设置Spring Data Cloud Datastore，您必须配置以下内容：

- 设置与Google Cloud Datastore的连接详细信息。

### 164.1.1 Cloud Datastore设置

您可以使用[Spring Boot Starter for Spring Data数据](https://www.springcloud.cc/spring-cloud-gcp-starters/spring-cloud-gcp-starter-data-datastore)存储区在Spring应用程序中自动配置Google Cloud数据存储区。它包含所有必要的设置，使您可以轻松地通过Google Cloud项目进行身份验证。以下配置选项可用：

| Name                                                 | 描述                                                         | Required | Default value                                                |
| ---------------------------------------------------- | ------------------------------------------------------------ | -------- | ------------------------------------------------------------ |
| `spring.cloud.gcp.datastore.enabled`                 | 启用Cloud Datastore客户端                                    | No       | `true`                                                       |
| `spring.cloud.gcp.datastore.project-id`              | 托管Google Cloud Datastore API的GCP项目ID（如果与[Spring Cloud GCP核心模块中的](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-gcp-core) ID不同） | No       |                                                              |
| `spring.cloud.gcp.datastore.credentials.location`    | 用于与Google Cloud Datastore API进行身份验证的OAuth2凭据（如果与[Spring Cloud GCP核心模块中的](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-gcp-core)凭据不同） | No       |                                                              |
| `spring.cloud.gcp.datastore.credentials.encoded-key` | 用于与Google Cloud Datastore API进行身份验证的Base64编码的OAuth2凭据（如果与[Spring Cloud GCP核心模块中的](https://www.springcloud.cc/spring-cloud-greenwich.html#spring-cloud-gcp-core)凭据不同） | No       |                                                              |
| `spring.cloud.gcp.datastore.credentials.scopes`      | [Spring Cloud适用于Spring Cloud GCP Cloud Datastore凭证的范围](https://developers.google.com/identity/protocols/googlescopes) 35 /} GCP Cloud Datastore凭证的[OAuth2范围](https://developers.google.com/identity/protocols/googlescopes) | No       | https://www.googleapis.com/auth/datastore                    |
| `spring.cloud.gcp.datastore.namespace`               | 要使用的Cloud Datastore命名空间                              | No       | the Default namespace of Cloud Datastore in your GCP project |

### 164.1.2 Repository设置

可以通过`@Configuration`主类上的`@EnableDatastoreRepositories`注释来配置Spring Data Repositories。使用我们针对Spring Data Cloud Datastore的Spring Boot入门版，可以自动添加`@EnableDatastoreRepositories`。不需要将其添加到其他任何类中，除非需要覆盖所提供的更细粒度的配置参数[`@EnableDatastoreRepositories`](https://github.com/spring-cloud/spring-cloud-gcp/blob/master/spring-cloud-gcp-data-datastore/src/main/java/org/springframework/cloud/gcp/data/datastore/repository/config/EnableDatastoreRepositories.java)。

### 164.1.3自动配置

我们的Spring Boot自动配置可在Spring应用程序上下文中创建以下beans：

- `DatastoreTemplate`的实例
- 启用存储库后，所有用户定义的存储库的实例，它们扩展了`CrudRepository`，`PagingAndSortingRepository`和`DatastoreRepository`（具有附加Cloud Datastore功能的`PagingAndSortingRepository`扩展）
- 来自Google Cloud Java客户端（用于数据存储）的`Datastore`实例，以方便使用和较低级别的API访问

## 164.2对象映射

Spring Data Cloud Datastore允许您通过注释将域POJO映射到Cloud Datastore的种类和实体：

```
@Entity(name = "traders")
public class Trader {

	@Id
	@Field(name = "trader_id")
	String traderId;

	String firstName;

	String lastName;

	@Transient
	Double temporaryNumber;
}
```

Spring Data Cloud Datastore将忽略任何带有`@Transient`注释的属性。这些属性将不会写入或从Cloud Datastore中读取。

### 164.2.1构造函数

POJO支持简单的构造函数。构造函数参数可以是持久属性的子集。每个构造函数参数都必须具有与实体上的持久属性相同的名称和类型，构造函数应从给定参数设置属性。不支持未直接设置为属性的参数。

```
@Entity(name = "traders")
public class Trader {

	@Id
	@Field(name = "trader_id")
	String traderId;

	String firstName;

	String lastName;

	@Transient
	Double temporaryNumber;

	public Trader(String traderId, String firstName) {
	    this.traderId = traderId;
	    this.firstName = firstName;
	}
}
```

### 164.2.2种类

`@Entity`注释可以提供Cloud Datastore类型的名称，该类型存储带注释的类的实例，每行一个。

### 164.2.3键

`@Id`标识与ID值相对应的属性。

您必须将POJO字段之一注释为ID值，因为Cloud Datastore中的每个实体都需要一个ID值：

```
@Entity(name = "trades")
public class Trade {
	@Id
	@Field(name = "trade_id")
	String tradeId;

	@Field(name = "trader_id")
	String traderId;

	String action;

	Double price;

	Double shares;

	String symbol;
}
```

数据存储区可以自动分配整数ID值。如果将具有`Long` ID属性的POJO实例以`null`作为ID值写入Cloud Datastore，则Spring Data Cloud Datastore将从Cloud Datastore获取新分配的ID值并将其设置在POJO中保存。由于原始`long` ID属性不能为`null`，并且默认值为`0`，因此不会分配密钥。

### 164.2.4栏位

POJO上的所有可访问属性都将自动识别为Cloud Datastore字段。默认情况下，`PropertyNameFieldNamingStrategy`在`DatastoreMappingContext` bean中定义了字段命名。`@Field`注释可以选择提供与属性不同的字段名称。

### 164.2.5支持的类型

Spring Data Cloud Datastore支持常规字段和集合元素的以下类型：

| 类型                                | 储存为                                    |
| ----------------------------------- | ----------------------------------------- |
| `com.google.cloud.Timestamp`        | com.google.cloud.datastore.TimestampValue |
| `com.google.cloud.datastore.Blob`   | com.google.cloud.datastore.BlobValue      |
| `com.google.cloud.datastore.LatLng` | com.google.cloud.datastore.LatLngValue    |
| `java.lang.Boolean`, `boolean`      | com.google.cloud.datastore.BooleanValue   |
| `java.lang.Double`, `double`        | com.google.cloud.datastore.DoubleValue    |
| `java.lang.Long`, `long`            | com.google.cloud.datastore.LongValue      |
| `java.lang.Integer`, `int`          | com.google.cloud.datastore.LongValue      |
| `java.lang.String`                  | com.google.cloud.datastore.StringValue    |
| `com.google.cloud.datastore.Entity` | com.google.cloud.datastore.EntityValue    |
| `com.google.cloud.datastore.Key`    | com.google.cloud.datastore.KeyValue       |
| `byte[]`                            | com.google.cloud.datastore.BlobValue      |
| Java `enum` values                  | com.google.cloud.datastore.StringValue    |

另外，支持所有可以由`org.springframework.core.convert.support.DefaultConversionService`转换为表中列出的类型的类型。

### 164.2.6自定义类型

可以使用自定义转换器来扩展对用户定义类型的类型支持。

1. 转换器需要在两个方向上实现`org.springframework.core.convert.converter.Converter`接口。
2. 用户定义的类型需要映射到Cloud Datastore支持的基本类型之一。
3. 两个转换器的实例（读和写）都需要传递到`DatastoreCustomConversions`构造函数，然后必须将其作为`DatastoreCustomConversions`的`@Bean`使用。

例如：

我们希望在`Singer` POJO上有一个类型为`Album`的字段，并希望将其存储为字符串属性：

```
@Entity
public class Singer {

    @Id
    String singerId;

    String name;

    Album album;
}
```

其中Album是一个简单的类：

```
public class Album {
    String albumName;

    LocalDate date;
}
```

我们必须定义两个转换器：

```
    //Converter to write custom Album type
    static final Converter<Album, String> ALBUM_STRING_CONVERTER =
            new Converter<Album, String>() {
                @Override
                public String convert(Album album) {
                    return album.getAlbumName() + " " + album.getDate().format(DateTimeFormatter.ISO_DATE);
                }
            };

    //Converters to read custom Album type
    static final Converter<String, Album> STRING_ALBUM_CONVERTER =
            new Converter<String, Album>() {
                @Override
                public Album convert(String s) {
                    String[] parts = s.split(" ");
                    return new Album(parts[0], LocalDate.parse(parts[parts.length - 1], DateTimeFormatter.ISO_DATE));
                }
            };
```

这将在我们的`@Configuration`文件中进行配置：

```
@Configuration
public class ConverterConfiguration {
	@Bean
	public DatastoreCustomConversions datastoreCustomConversions() {
		return new DatastoreCustomConversions(
				Arrays.asList(
						ALBUM_STRING_CONVERTER,
						STRING_ALBUM_CONVERTER));
	}
}
```

### 164.2.7集合和数组

支持受支持的类型的数组和集合（实现`java.util.Collection`的类型）。它们存储为`com.google.cloud.datastore.ListValue`。元素分别转换为Cloud Datastore支持的类型。`byte[]`是一个例外，它将转换为`com.google.cloud.datastore.Blob`。

### 164.2.8用于集合的自定义转换器

用户可以提供从`List<?>`到自定义集合类型的转换器。仅需要读取转换器，在写端使用Collection API将集合转换为内部列表类型。

集合转换器需要实现`org.springframework.core.convert.converter.Converter`接口。

例：

让我们从前面的示例中改进Singer类。我们希望有一个`ImmutableSet<Album>`类型的字段，而不是`Album`类型的字段：

```
@Entity
public class Singer {

	@Id
	String singerId;

	String name;

	ImmutableSet<Album> albums;
}
```

我们只需要定义一个读转换器：

```
static final Converter<List<?>, ImmutableSet<?>> LIST_IMMUTABLE_SET_CONVERTER =
			new Converter<List<?>, ImmutableSet<?>>() {
				@Override
				public ImmutableSet<?> convert(List<?> source) {
					return ImmutableSet.copyOf(source);
				}
			};
```

并将其添加到自定义转换器列表中：

```
@Configuration
public class ConverterConfiguration {
	@Bean
	public DatastoreCustomConversions datastoreCustomConversions() {
		return new DatastoreCustomConversions(
				Arrays.asList(
						LIST_IMMUTABLE_SET_CONVERTER,

						ALBUM_STRING_CONVERTER,
						STRING_ALBUM_CONVERTER));
	}
}
```

## 164.3关系

本节介绍了三种表示实体之间关系的方法：

- 直接存储在包含实体的字段中的嵌入式实体
- 一对多关系的`@Descendant`带注释的属性
- `@Reference`带层次结构的一般关系的带注释的属性

### 164.3.1嵌入式实体

类型也用`@Entity`注释的字段将转换为`EntityValue`并存储在父实体中。

这是一个Cloud Datastore实体的示例，其中包含JSON中的嵌入式实体：

```
{
  "name" : "Alexander",
  "age" : 47,
  "child" : {"name" : "Philip"  }
}
```

这对应于一对简单的Java实体：

```
import org.springframework.cloud.gcp.data.datastore.core.mapping.Entity;
import org.springframework.data.annotation.Id;

@Entity("parents")
public class Parent {
  @Id
  String name;

  Child child;
}

@Entity
public class Child {
  String name;
}
```

`Child`实体不是以其自己的类型存储的。它们全部存储在`parents`类型的`child`字段中。

支持多个级别的嵌入式实体。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 嵌入式实体不需要具有`@Id`字段，只有顶级实体才需要。          |

例：

实体可以容纳自己类型的嵌入式实体。我们可以使用此功能将树存储在Cloud Datastore中：

```
import org.springframework.cloud.gcp.data.datastore.core.mapping.Embedded;
import org.springframework.cloud.gcp.data.datastore.core.mapping.Entity;
import org.springframework.data.annotation.Id;

@Entity
public class EmbeddableTreeNode {
  @Id
  long value;

  EmbeddableTreeNode left;

  EmbeddableTreeNode right;

  Map<String, Long> longValues;

  Map<String, List<Timestamp>> listTimestamps;

  public EmbeddableTreeNode(long value, EmbeddableTreeNode left, EmbeddableTreeNode right) {
    this.value = value;
    this.left = left;
    this.right = right;
  }
}
```

#### 地图

地图将存储为嵌入式实体，其中键值成为嵌入式实体中的字段名称。这些映射中的值类型可以是任何常规支持的属性类型，并且将使用配置的转换器将键值转换为String。

同样，可以嵌入实体的集合。写入时将转换为`ListValue`。

例：

代替上一个示例中的二叉树，我们想在Cloud Datastore中存储一棵普通树（每个节点可以有任意数量的子级）。为此，我们需要创建一个类型为`List<EmbeddableTreeNode>`的字段：

```
import org.springframework.cloud.gcp.data.datastore.core.mapping.Embedded;
import org.springframework.data.annotation.Id;

public class EmbeddableTreeNode {
  @Id
  long value;

  List<EmbeddableTreeNode> children;

  Map<String, EmbeddableTreeNode> siblingNodes;

  Map<String, Set<EmbeddableTreeNode>> subNodeGroups;

  public EmbeddableTreeNode(List<EmbeddableTreeNode> children) {
    this.children = children;
  }
}
```

由于地图是作为实体存储的，因此它们可以进一步保存嵌入式实体：

- 值中的单个嵌入式对象可以存储在嵌入式Map的值中。
- 值中嵌入对象的集合也可以存储为嵌入Map的值。
- 值中的映射进一步存储为嵌入式实体，并对其值进行递归应用相同的规则。

### 164.3.2祖辈关系

通过`@Descendants`注释支持父子关系。

与嵌入式子代不同，后代是驻留在自己种类中的完整实体。父实体没有额外的字段来保存后代实体。相反，该关系是在后代的键中捕获的，该键引用了它们的父实体：

```
import org.springframework.cloud.gcp.data.datastore.core.mapping.Descendants;
import org.springframework.cloud.gcp.data.datastore.core.mapping.Entity;
import org.springframework.data.annotation.Id;

@Entity("orders")
public class ShoppingOrder {
  @Id
  long id;

  @Descendants
  List<Item> items;
}

@Entity("purchased_item")
public class Item {
  @Id
  Key purchasedItemKey;

  String name;

  Timestamp timeAddedToOrder;
}
```

例如，`Item`的GQL键文字表示形式的实例还将包含父`ShoppingOrder` ID值：

```
Key(orders, '12345', purchased_item, 'eggs')
```

父级`ShoppingOrder`的GQL键文字表示为：

```
Key(orders, '12345')
```

Cloud Datastore实体以各自的种类单独存在。

`ShoppingOrder`：

```
{
  "id" : 12345
}
```

该订单中的两个项目：

```
{
  "purchasedItemKey" : Key(orders, '12345', purchased_item, 'eggs'),
  "name" : "eggs",
  "timeAddedToOrder" : "2014-09-27 12:30:00.45-8:00"
}

{
  "purchasedItemKey" : Key(orders, '12345', purchased_item, 'sausage'),
  "name" : "sausage",
  "timeAddedToOrder" : "2014-09-28 11:30:00.45-9:00"
}
```

使用Datastore的[祖先关系](https://cloud.google.com/datastore/docs/concepts/entities#ancestor_paths)将对象的父子关系结构存储在Cloud Datastore中。因为这些关系是由Ancestor机制定义的，所以在父实体或子实体中都不需要额外的列来存储此关系。关系链接是后代实体键值的一部分。这些关系可能很深层次。

拥有子实体的Properties必须类似于集合，但是它们可以是常规属性（如`List`，数组，`Set`等）支持的任何受支持的可相互转换的集合类类型。子项必须具有`Key`作为其ID类型，因为Cloud Datastore在子项的键内存储了祖先关系链接。

读取或保存实体会自动导致分别读取或保存该实体下的所有子级。如果创建了一个新的子项并将其添加到带有注释的`@Descendants`的属性中，并且key属性保留为空，则将为该子项分配新的密钥。检索到的子代的顺序可能与保存的原始属性中的顺序不同。

除非将子项的关键属性设置为`null`或包含新父项作为祖先的值，否则子实体不能从一个父项的属性移到另一父项的属性。由于Cloud Datastore实体键可以有多个父实体，因此子实体可能出现在多个父实体的属性中。由于实体密钥在Cloud Datastore中是不可变的，因此要更改子项的密钥，您必须删除现有子项，然后使用新密钥重新保存。

### 164.3.3关键参考关系

常规关系可以使用`@Reference`批注进行存储。

```
import org.springframework.cloud.gcp.data.datastore.core.mapping.Reference;
import org.springframework.data.annotation.Id;

@Entity
public class ShoppingOrder {
  @Id
  long id;

  @Reference
  List<Item> items;

  @Reference
  Item specialSingleItem;
}

@Entity
public class Item {
  @Id
  Key purchasedItemKey;

  String name;

  Timestamp timeAddedToOrder;
}
```

`@Reference`关系是指以自己的种类存在的完整实体之间的关系。`ShoppingOrder`和`Item`实体之间的关系存储为`ShoppingOrder`内部的键字段，Spring Data Cloud Datastore将其解析为基础Java实体类型：

```
{
  "id" : 12345,
  "specialSingleItem" : Key(item, "milk"),
  "items" : [ Key(item, "eggs"), Key(item, "sausage") ]
}
```

参考属性可以是单数或类似集合的。这些属性对应于实体和Cloud Datastore Kind中包含引用实体的键值的实际列。引用的实体是其他种类的成熟实体。

与`@Descendants`关系类似，读取或写入实体将递归读取或写入所有级别的所有引用实体。如果引用的实体具有`null` ID值，则它们将另存为新实体，并将具有Cloud Datastore分配的ID值。实体的密钥和实体作为引用持有的密钥之间没有关系的要求。从Cloud Datastore读回时，不会保留类似集合的参考属性的顺序。

## 164.4数据存储操作和模板

`DatastoreOperations`及其实现`DatastoreTemplate`提供了Spring开发人员熟悉的模板模式。

使用Spring Boot Starter for Datastore提供的自动配置，您的Spring应用程序上下文将包含一个完全配置的`DatastoreTemplate`对象，您可以在该应用程序中自动连线：

```
@SpringBootApplication
public class DatastoreTemplateExample {

	@Autowired
	DatastoreTemplate datastoreTemplate;

	public void doSomething() {
		this.datastoreTemplate.deleteAll(Trader.class);
		//...
		Trader t = new Trader();
		//...
		this.datastoreTemplate.save(t);
		//...
		List<Trader> traders = datastoreTemplate.findAll(Trader.class);
		//...
	}
}
```

模板API提供了以下便捷方法：

- 写操作（保存和删除）
- 读写交易

### 164.4.1 GQL查询

除了通过ID检索实体之外，您还可以提交查询。

```
  <T> Iterable<T> query(Query<? extends BaseEntity> query, Class<T> entityClass);

  <A, T> Iterable<T> query(Query<A> query, Function<A, T> entityFunc);

  Iterable<Key> queryKeys(Query<Key> query);
```

这些方法分别允许查询：*使用所有相同的映射和转换功能由给定实体类映射的实体*给定映射函数产生的任意类型*仅查询找到的实体的Cloud Datastore键

### 164.4.2按ID查找

Datstore读取一种类型的单个实体或多个实体。

使用`DatastoreTemplate`，您可以执行读取，例如：

```
Trader trader = this.datastoreTemplate.findById("trader1", Trader.class);

List<Trader> traders = this.datastoreTemplate.findAllById(ImmutableList.of("trader1", "trader2"), Trader.class);

List<Trader> allTraders = this.datastoreTemplate.findAll(Trader.class);
```

Cloud Datastore会以高度一致性执行基于键的读取，但最终会执行查询。在上面的示例中，前两次读取使用键，而第三次使用基于相应种类`Trader`的查询执行。

#### 指标

默认情况下，所有字段都已建立索引。要禁用对特定字段的索引编制，可以使用`@Unindexed`注释。

例：

```
import org.springframework.cloud.gcp.data.datastore.core.mapping.Unindexed;

public class ExampleItem {
    long indexedField;

    @Unindexed
    long unindexedField;
}
```

直接或通过查询方法使用查询时，如果select语句不是`SELECT *`或`WHERE`子句中有多个过滤条件，则Cloud Datastore需要[复合自定义索引](https://cloud.google.com/datastore/docs/concepts/indexes)。

#### 读取偏移量，限制和排序

`DatastoreRepository`和自定义实体存储库实现了Spring Data `PagingAndSortingRepository`，它使用页码和页面大小来支持偏移量和限制。通过向`findAll`提供`DatastoreQueryOptions`，`DatastoreTemplate`也支持分页和排序选项。

#### 部分阅读

目前尚不支持此功能。

### 164.4.3写入/更新

`DatastoreOperations`的write方法接受POJO并将其所有属性写入Datastore。所需的数据存储类型和实体元数据是从给定对象的实际类型获得的。

如果从数据存储区检索了POJO，并且更改了其ID值，然后写入或更新了POJO，则该操作就像针对具有新ID值的行一样进行。具有原始ID值的实体将不受影响。

```
Trader t = new Trader();
this.datastoreTemplate.save(t);
```

`save`方法的行为与更新或插入相同。

#### 部分更新

目前尚不支持此功能。

### 164.4.4交易

`DatastoreOperations`通过`performTransaction`方法提供读写事务：

```
@Autowired
DatastoreOperations myDatastoreOperations;

public String doWorkInsideTransaction() {
  return myDatastoreOperations.performTransaction(
    transactionDatastoreOperations -> {
      // Work with transactionDatastoreOperations here.
      // It is also a DatastoreOperations object.

      return "transaction completed";
    }
  );
}
```

`performTransaction`方法接受`Function`，该`Function`是`DatastoreOperations`对象的实例。函数的最终返回值和类型由用户确定。您可以像常规`DatastoreOperations`一样使用此对象，但有一个例外：

- 它无法执行子交易。

由于Cloud Datastore的一致性保证，因此在事务内部使用的实体之间的操作和关系存在[限制](https://cloud.google.com/datastore/docs/concepts/transactions#what_can_be_done_in_a_transaction)。

#### 带有@Transactional批注的声明式事务

此功能要求使用`spring-cloud-gcp-starter-data-datastore`时提供的bean为`DatastoreTransactionManager`。

`DatastoreTemplate`和`DatastoreRepository`支持将`@Transactional` [注释](https://docs.spring.io/spring/docs/current/spring-framework-reference/data-access.html#transaction-declarative)作为事务运行的方法。如果用`@Transactional`注释的方法调用了另一个也注释的方法，则这两种方法将在同一事务中工作。`performTransaction`无法在带有注释的`@Transactional`方法中使用，因为Cloud Datastore不支持事务内的事务。

### 164.4.5对地图的读写支持

您可以直接在Cloud Datastore中读写数据，而可以使用`Map<String, ?>`类型的Maps代替实体对象。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 这与使用包含Map属性的实体对象不同。                          |

映射键用作数据存储区实体的字段名称，并且映射值转换为数据存储区支持的类型。仅支持简单类型（即不支持集合）。可以添加用于自定义值类型的转换器（请参见[第163.2.10节“自定义类型”](https://www.springcloud.cc/spring-cloud-greenwich.html#_custom_types)部分）。

例：

```
Map<String, Long> map = new HashMap<>();
map.put("field1", 1L);
map.put("field2", 2L);
map.put("field3", 3L);

keyForMap = datastoreTemplate.createKey("kindName", "id");

//write a map
datastoreTemplate.writeMap(keyForMap, map);

//read a map
Map<String, Long> loadedMap = datastoreTemplate.findByIdAsMap(keyForMap, Long.class);
```

## 164.5 Repositories

[Spring Data Repositories](https://docs.spring.io/spring-data/data-commons/docs/current/reference/html/#repositories)是可以减少样板代码的抽象。

例如：

```
public interface TraderRepository extends DatastoreRepository<Trader, String> {
}
```

Spring Data生成指定接口的有效实现，可以将其自动连接到应用程序中。

`DatastoreRepository`的`Trader`类型参数是指基础域类型。在这种情况下，第二个类型参数`String`是指域类型的键的类型。

```
public class MyApplication {

	@Autowired
	TraderRepository traderRepository;

	public void demo() {

		this.traderRepository.deleteAll();
		String traderId = "demo_trader";
		Trader t = new Trader();
		t.traderId = traderId;
		this.tradeRepository.save(t);

		Iterable<Trader> allTraders = this.traderRepository.findAll();

		int count = this.traderRepository.count();
	}
}
```

Repositories允许您定义自定义查询方法（在以下各节中详细介绍），以基于过滤和分页参数来检索，计数和删除。过滤参数可以是您配置的自定义转换器支持的类型。

### 164.5.1按约定查询方法

```
public interface TradeRepository extends DatastoreRepository<Trade, String[]> {
  List<Trader> findByAction(String action);

  int countByAction(String action);

  boolean existsByAction(String action);

  List<Trade> findTop3ByActionAndSymbolAndPriceGreaterThanAndPriceLessThanOrEqualOrderBySymbolDesc(
  			String action, String symbol, double priceFloor, double priceCeiling);

  Page<TestEntity> findByAction(String action, Pageable pageable);

  Slice<TestEntity> findBySymbol(String symbol, Pageable pageable);

  List<TestEntity> findBySymbol(String symbol, Sort sort);
}
```

在上面的示例中，`TradeRepository`中的[查询方法](https://docs.spring.io/spring-data/data-commons/docs/current/reference/html/#repositories.query-methods)是使用https://docs.spring.io/spring-data/data-commons/docs/current/reference/html#repositories基于方法名称生成的。 query-methods.query-creation [Spring Data查询创建命名约定]。

Cloud Datastore仅支持通过AND连接的过滤器组件以及以下操作：

- `equals`
- `greater than or equals`
- `greater than`
- `less than or equals`
- `less than`
- `is null`

在编写仅指定这些方法签名的自定义存储库接口之后，将为您生成实现，并且可以将其与存储库的自动关联实例一起使用。由于Cloud Datastore要求明确选择的字段必须全部一起出现在组合索引中，因此`find`基于名称的查询方法将以`SELECT *`的身份运行。

还支持删除查询。例如，诸如`deleteByAction`或`removeByAction`之类的查询方法会删除`findByAction`找到的实体。删除查询是作为单独的读取和删除操作而不是作为单个事务执行的，因为除非指定了查询的祖先，否则Cloud Datastore无法在事务中查询。结果，`removeBy`和`deleteBy`名称约定查询方法不能通过`performInTransaction`或`@Transactional`批注在事务内部使用。

删除查询可以具有以下返回类型：

- 一个整数类型，它是删除的实体数
- 被删除的实体的集合
- “无效”

方法可以具有`org.springframework.data.domain.Pageable`参数来控制分页和排序，或者具有`org.springframework.data.domain.Sort`参数来仅控制排序。有关详细信息，请参见[Spring Data文档](https://docs.spring.io/spring-data/data-commons/docs/current/reference/html/#repositories.query-methods)。

要在存储库方法中返回多个项目，我们支持Java集合以及`org.springframework.data.domain.Page`和`org.springframework.data.domain.Slice`。如果方法的返回类型为`org.springframework.data.domain.Page`，则返回的对象将包括当前页面，结果总数和页面总数。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 返回`Page`的方法执行附加查询以计算总页数。另一方面，返回`Slice`的方法不会执行任何其他查询，因此效率更高。 |

### 164.5.2自定义GQL查询方法

可以通过以下两种方式之一将自定义GQL查询映射到存储库方法：

- `namedQueries`属性文件
- 使用`@Query`批注

#### 带注释的查询方法

使用`@Query`批注：

GQL的标记名称与方法参数的`@Param`带注释的名称相对应。

```
public interface TraderRepository extends DatastoreRepository<Trader, String> {

  @Query("SELECT * FROM traders WHERE name = @trader_name")
  List<Trader> tradersByName(@Param("trader_name") String traderName);

  @Query("SELECT * FROM  test_entities_ci WHERE id = @id_val")
  TestEntity getOneTestEntity(@Param("id_val") long id);
}
```

支持以下参数类型：

- `com.google.cloud.Timestamp`
- `com.google.cloud.datastore.Blob`
- `com.google.cloud.datastore.Key`
- `com.google.cloud.datastore.Cursor`
- `java.lang.Boolean`
- `java.lang.Double`
- `java.lang.Long`
- `java.lang.String`
- `enum`值。将这些查询为`String`值。

除`Cursor`外，还支持每种类型的数组形式。

如果要获取查询的项数或查询返回的项，请分别设置`@Query`批注的`count = true`或`exists = true`属性。在这些情况下，查询方法的返回类型应为整数类型或布尔类型。

Cloud Datastore提供的`SELECT *key* FROM …`特殊列适用于所有类型，可检索`Key`s of each row. Selecting this special `*key*`列，对于`count`和`exists`查询特别有用和高效。

您还可以查询非实体类型：

```
	@Query(value = "SELECT __key__ from test_entities_ci")
	List<Key> getKeys();

	@Query(value = "SELECT __key__ from test_entities_ci limit 1")
	Key getKey();

	@Query("SELECT id FROM test_entities_ci WHERE id <= @id_val")
	List<String> getIds(@Param("id_val") long id);

	@Query("SELECT id FROM test_entities_ci WHERE id <= @id_val limit 1")
	String getOneId(@Param("id_val") long id);
```

SpEL可用于提供GQL参数：

```
@Query("SELECT * FROM |com.example.Trade| WHERE trades.action = @act
  AND price > :#{#priceRadius * -1} AND price < :#{#priceRadius * 2}")
List<Trade> fetchByActionNamedQuery(@Param("act") String action, @Param("priceRadius") Double r);
```

种类名称可以直接写在GQL批注中。种类名称也可以通过域类上的`@Entity`注释来解析。

在这种情况下，查询应引用表名，该表名具有完全合格的类名，并用`|`字符包围：`|fully.qualified.ClassName|`。当SpEL表达式以提供给`@Entity`批注的种类名称出现时，此功能很有用。例如：

```
@Query("SELECT * FROM |com.example.Trade| WHERE trades.action = @act")
List<Trade> fetchByActionNamedQuery(@Param("act") String action);
```

#### 具有命名查询属性的查询方法

您还可以在属性文件中使用Cloud Datastore参数标签和SpEL表达式指定查询。

默认情况下，`@EnableDatastoreRepositories`上的`namedQueriesLocation`属性指向`META-INF/datastore-named-queries.properties`文件。您可以通过提供GQL作为“ interface.method”属性的值来在属性文件中指定对方法的查询：

```
Trader.fetchByName=SELECT * FROM traders WHERE name = @tag0
public interface TraderRepository extends DatastoreRepository<Trader, String> {

	// This method uses the query from the properties file instead of one generated based on name.
	List<Trader> fetchByName(@Param("tag0") String traderName);

}
```

### 164.5.3交易

这些事务与`DatastoreOperations`的事务非常相似，但是特定于存储库的域类型，并提供存储库功能而不是模板功能。

例如，这是一个读写事务：

```
@Autowired
DatastoreRepository myRepo;

public String doWorkInsideTransaction() {
  return myRepo.performTransaction(
    transactionDatastoreRepo -> {
      // Work with the single-transaction transactionDatastoreRepo here.
      // This is a DatastoreRepository object.

      return "transaction completed";
    }
  );
}
```

### 164.5.4投影

Spring Data Cloud Datastore支持[预测](https://docs.spring.io/spring-data/data-commons/docs/current/reference/html/#projections)。您可以根据域类型定义投影接口，并添加查询方法以在存储库中返回它们：

```
public interface TradeProjection {

    String getAction();

    @Value("#{target.symbol + ' ' + target.action}")
    String getSymbolAndAction();
}

public interface TradeRepository extends DatastoreRepository<Trade, Key> {

    List<Trade> findByTraderId(String traderId);

    List<TradeProjection> findByAction(String action);

    @Query("SELECT action, symbol FROM trades WHERE action = @action")
    List<TradeProjection> findByQuery(String action);
}
```

可以通过基于名称约定的查询方法以及自定义GQL查询来提供投影。如果使用自定义GQL查询，则可以进一步将从Cloud Datastore检索到的字段限制为仅投影所需的字段。但是，自定义的select语句（不使用`SELECT *`的语句）需要包含所选字段的复合索引。

使用SpEL定义的投影类型中的Properties将固定名称`target`用于基础域对象。结果，访问基础属性的格式为`target.<property-name>`。

### 164.5.5 REST Repositories

使用Spring Boot运行时，只需将此依赖项添加到pom文件即可将存储库公开为REST服务：

```
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-rest</artifactId>
</dependency>
```

如果您希望配置参数（例如路径），则可以使用`@RepositoryRestResource`批注：

```
@RepositoryRestResource(collectionResourceRel = "trades", path = "trades")
public interface TradeRepository extends DatastoreRepository<Trade, String[]> {
}
```

例如，您可以使用`curl http://<server>:<port>/trades`检索存储库中的所有`Trade`对象，或者通过`curl http://<server>:<port>/trades/<trader_id>`检索任何特定交易。

您也可以使用`curl -XPOST -H"Content-Type: application/json" -d@test.json http://<server>:<port>/trades/`进行交易，其中文件`test.json`包含`Trade`对象的JSON表示形式。

要删除交易，您可以使用`curl -XDELETE http://<server>:<port>/trades/<trader_id>`

## 164.6示例

提供了一个[简单的Spring Boot应用程序](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-data-datastore-basic-sample)和更高级的[示例Spring Boot应用程序](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-data-datastore-sample)，以展示如何使用Spring Data Cloud Datastore入门和模板。

## 165. Redis的Cloud Memorystore

## 165.1 Spring缓存

[Redis的Cloud Memorystore](https://cloud.google.com/memorystore/)提供了完全托管的内存中数据存储服务。Cloud Memorystore与Redis协议兼容，可轻松与[Spring缓存](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-caching.html)集成。

您要做的就是创建一个Cloud Memorystore实例，并将其在`application.properties`文件中的IP地址用作`spring.redis.host`属性值。其他所有操作与设置由Redis支持的Spring缓存完全相同。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| Memorystore实例和您的应用程序实例必须位于同一区域。          |

简而言之，需要以下依赖项：

```
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

然后，您可以对要缓存的方法使用`org.springframework.cache.annotation.Cacheable`批注。

```
@Cacheable("cache1")
public String hello(@PathVariable String name) {
    ....
}
```

如果您对详细的操作指南感兴趣，请检查[Spring Boot使用Cloud Memorystore codelab进行缓存](https://codelabs.developers.google.com/codelabs/cloud-spring-cache-memorystore/)。

可以在[此处](https://cloud.google.com/memorystore/docs/redis/)找到Cloud Memorystore文档。

## 166.云身份识别代理（IAP）身份验证

[Cloud Identity-Aware Proxy（IAP）](https://cloud.google.com/iap/)为部署到Google Cloud的应用程序提供了安全层。

IAP入门人员使用[Spring Security OAuth 2.0资源服务器](https://docs.spring.io/spring-security/site/docs/current/reference/htmlsingle/#oauth2resourceserver)功能从注入代理的`x-goog-iap-jwt-assertion` HTTP标头中自动提取用户身份。

以下声明将自动验证：

- 发行时间
- 到期时间
- 发行人
- 听众

当应用程序在App Engine Standard或App Engine Flexible上运行时，将自动配置受众群体（`"aud"`）验证。对于其他运行时环境，必须通过`spring.cloud.gcp.security.iap.audience`属性提供自定义受众。自定义属性（如果已指定）将覆盖自动的App Engine受众群体检测。

| ![[重要]](/assets/images/springcloud/important.png?lastModify=1665880539) | 重要 |
| ------------------------------------------------------------ | ---- |
| Compute Engine或Kubernetes Engine没有自动的受众字符串配置。要在GCE / GKE上使用IAP启动器，[请](https://cloud.google.com/iap/docs/signed-headers-howto#verify_the_jwt_payload)在“ [验证JWT有效负载”](https://cloud.google.com/iap/docs/signed-headers-howto#verify_the_jwt_payload)指南中按照说明查找受众字符串，并在`spring.cloud.gcp.security.iap.audience`属性中进行指定。否则，应用程序将无法以`No qualifying bean of type 'org.springframework.cloud.gcp.security.iap.AudienceProvider' available`消息启动。 |      |

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 如果创建自定义[`WebSecurityConfigurerAdapter`](https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/config/annotation/web/configuration/WebSecurityConfigurerAdapter.html)，请通过向[`HttpSecurity`](https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/config/annotation/web/builders/HttpSecurity.html)对象添加`.oauth2ResourceServer().jwt()`配置来提取用户身份。如果没有自定义项，[`WebSecurityConfigurerAdapter`](https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/config/annotation/web/configuration/WebSecurityConfigurerAdapter.html)则无需执行任何操作，因为Spring Boot将默认添加此自定义项。 |

起始Maven坐标，使用[Spring Cloud GCP BOM](https://github.com/spring-cloud/spring-cloud-gcp/blob/master/spring-cloud-gcp-dependencies/pom.xml)：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-gcp-starter-security-iap</artifactId>
</dependency>
```

入门级Gradle坐标：

```
dependencies {
    compile group: 'org.springframework.cloud', name: 'spring-cloud-gcp-starter-security-iap'
}
```

## 166.1配置

以下属性可用。

| ![[警告]](/assets/images/springcloud/caution.png?lastModify=1665880539) | 警告 |
| ------------------------------------------------------------ | ---- |
| 修改注册表，算法和标头属性可能对测试很有用，但是在生产中不应更改默认值。 |      |

| 名称                                      | 描述                                             | 需要                                 | 默认                                                |
| ----------------------------------------- | ------------------------------------------------ | ------------------------------------ | --------------------------------------------------- |
| `spring.cloud.gcp.security.iap.registry`  | Link to JWK public key registry.                 | true                                 | `https://www.gstatic.com/iap/verify/public_key-jwk` |
| `spring.cloud.gcp.security.iap.algorithm` | Encryption algorithm used to sign the JWK token. | true                                 | `ES256`                                             |
| `spring.cloud.gcp.security.iap.header`    | Header from which to extract the JWK key.        | true                                 | `x-goog-iap-jwt-assertion`                          |
| `spring.cloud.gcp.security.iap.issuer`    | JWK issuer to verify.                            | true                                 | `https://cloud.google.com/iap`                      |
| `spring.cloud.gcp.security.iap.audience`  | Custom JWK audience to verify.                   | false on App Engine; true on GCE/GKE |                                                     |

## 166.2示例

提供了[示例应用程序](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-security-iap-sample)。

## 167.Google Cloud Vision

在[谷歌云愿景API](https://cloud.google.com/vision/)允许用户利用机器学习图像处理算法，包括：图像分类，人脸检测，文本提取，等等。

Spring Cloud GCP提供：

- 一个方便的启动程序，它自动配置开始使用[Google Cloud Vision API](https://cloud.google.com/vision/)所需的身份验证设置和客户端对象。
- Cloud Vision模板可简化与Cloud Vision API的交互。
  - 使您可以轻松地将图像作为Spring资源发送到API。
  - 提供常用操作的便捷方法，例如从图像中提取文本。

Maven坐标，使用Spring Cloud GCP BOM：

```
<dependency>
  <groupId>org.springframework.cloud</groupId>
  <artifactId>spring-cloud-gcp-starter-vision</artifactId>
</dependency>
```

Gradle坐标：

```
dependencies {
  compile group: 'org.springframework.cloud', name: 'spring-cloud-gcp-starter-vision'
}
```

## 167.1 Cloud Vision模板

`CloudVisionTemplate`提供了一种将Cloud Vision API与Spring资源一起使用的简单方法。

将`spring-cloud-gcp-starter-vision`依赖项添加到您的项目后，可以`@Autowire` `CloudVisionTemplate`的实例在您的代码中使用。

`CloudVisionTemplate`提供了以下与Cloud Vision接口的方法：

```
public AnnotateImageResponse analyzeImage(Resource imageResource, Feature.Type… featureTypes)
```

**参数：**

- `Resource imageResource`是指您要分析的图像对象的Spring资源。Google Cloud Vision文档提供了[它们支持的图像类型](https://cloud.google.com/vision/docs/supported-files)的[列表](https://cloud.google.com/vision/docs/supported-files)。
- `Feature.Type… featureTypes`表示要从图像中提取的Cloud Vision功能的var-arg数组。特征是指人们希望对图像执行的一种图像分析，例如标签检测，OCR识别，面部检测等。可以在一个请求中指定多个特征进行分析。[Cloud Vision Feature文档中](https://cloud.google.com/vision/docs/features)提供了[Cloud Vision功能的](https://cloud.google.com/vision/docs/features)完整列表。

**返回值：**

- [`AnnotateImageResponse`](https://cloud.google.com/vision/docs/reference/rpc/google.cloud.vision.v1#google.cloud.vision.v1.AnnotateImageResponse)包含请求中指定的所有特征分析的结果。对于您在请求中提供的每种功能类型，`AnnotateImageResponse`提供了一种getter方法来获取该功能分析的结果。例如，如果您使用`LABEL_DETECTION`功能分析了图像，则可以使用`annotateImageResponse.getLabelAnnotationsList()`从响应中检索结果。

  `AnnotateImageResponse`由Google Cloud Vision库提供；请参阅[RPC参考](https://cloud.google.com/vision/docs/reference/rpc/google.cloud.vision.v1#google.cloud.vision.v1.AnnotateImageResponse)或[Javadoc](https://googleapis.github.io/googleapis/java/all/latest/apidocs/com/google/cloud/vision/v1/AnnotateImageResponse.html)以获得更多详细信息。此外，您可以查阅[Cloud Vision文档](https://cloud.google.com/vision/docs/)以熟悉API的概念和功能。

## 167.2检测图像标签示例

[图像标签](https://cloud.google.com/vision/docs/detecting-labels)是指产生描述图像内容的标签。以下是使用Cloud Vision Spring模板完成此操作的代码示例。

```
@Autowired
private ResourceLoader resourceLoader;

@Autowired
private CloudVisionTemplate cloudVisionTemplate;

public void processImage() {
  Resource imageResource = this.resourceLoader.getResource("my_image.jpg");
  AnnotateImageResponse response = this.cloudVisionTemplate.analyzeImage(
      imageResource, Type.LABEL_DETECTION);
  System.out.println("Image Classification results: " + response.getLabelAnnotationsList());
}
```

## 167.3示例

提供了一个[示例Spring Boot应用程序](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-samples/spring-cloud-gcp-vision-api-sample)，以显示如何使用Cloud Vision启动器和模板。

## 168. Cloud Foundry

Spring Cloud GCP为Cloud Foundry的[GCP Service Broker](https://docs.pivotal.io/partners/gcp-sb/index.html)提供支持。我们的发布/订阅，Cloud Spanner，存储，Stackdriver Trace和Cloud SQL MySQL和PostgreSQL入门者都了解Cloud Foundry，并从Cloud Foundry环境中自动配置中使用了诸如项目ID，凭据等属性。 。

在诸如Pub / Sub的主题和订阅或Storage的存储桶名称的情况下，这些参数未在自动配置中使用，您可以使用Spring Boot提供的VCAP映射来获取它们。例如，要检索预配置的发布/订阅主题，可以在应用程序环境中使用`vcap.services.mypubsub.credentials.topic_name`属性。

| ![[注意]](/assets/images/springcloud/note.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 如果同一服务多次绑定到同一应用程序，则自动配置将无法在绑定中选择，也不会为该服务激活。这包括MySQL和PostgreSQL到同一应用程序的绑定。 |

| ![[警告]](/assets/images/springcloud/warning.png?lastModify=1665880539) |
| ------------------------------------------------------------ |
| 为了使Cloud SQL集成能够在Cloud Foundry中运行，必须禁用自动重新配置。您可以使用`cf set-env <APP> JBP_CONFIG_SPRING_AUTO_RECONFIGURATION '{enabled: false}'`命令来这样做。否则，Cloud Foundry将生成带有无效JDBC URL（即`jdbc:mysql://null/null`）的`DataSource`。 |

## 169. Kotlin支持

Spring Framework的最新版本为Kotlin提供了一流的支持。对于Spring的Kotlin用户，Spring Cloud GCP库是开箱即用的，并且可以与Kotlin应用程序完全互操作。

有关在Kotlin中构建Spring应用程序的更多信息，请查阅[Spring Kotlin文档](https://docs.spring.io/spring/docs/current/spring-framework-reference/languages.html#kotlin)。

## 169.1先决条件

确保正确设置您的Kotlin应用程序。根据您的构建系统，您需要在项目中包括正确的Kotlin构建插件：

- [Kotlin Maven插件](https://kotlinlang.org/docs/reference/using-maven.html)
- [Kotlin Gradle插件](https://kotlinlang.org/docs/reference/using-gradle.html)

根据您的应用程序的需求，您可能需要使用编译器插件来扩展构建配置：

- [Kotlin Spring插件](https://kotlinlang.org/docs/reference/compiler-plugins.html#spring-support)：为方便起见，使您的Spring配置类/成员成为非最终版本。
- [Kotlin JPA插件](https://kotlinlang.org/docs/reference/compiler-plugins.html#jpa-support)：允许在Kotlin应用程序中使用JPA。

正确配置Kotlin项目后，Spring Cloud GCP库将在您的应用程序中运行，而无需进行任何其他设置。

## 170.示例

提供了[Kotlin示例应用程序](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-kotlin-samples/spring-cloud-gcp-kotlin-app-sample)，以演示[Kotlin内部](https://github.com/spring-cloud/spring-cloud-gcp/tree/master/spring-cloud-gcp-kotlin-samples/spring-cloud-gcp-kotlin-app-sample) Maven的有效设置和各种Spring Cloud GCP集成。

# 第十九部分。附录：配置纲要Properties

| Name                                                         | Default                                                      | 描述                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| aws.paramstore.default-context                               | application                                                  |                                                              |
| aws.paramstore.enabled                                       | true                                                         | 是否启用了AWS Parameter Store支持。                          |
| aws.paramstore.fail-fast                                     | true                                                         | 如果为true，则在配置查找过程中引发异常，否则，记录警告。     |
| aws.paramstore.name                                          |                                                              | spring.application.name的替代方案，用于在AWS Parameter Store中查找值。 |
| aws.paramstore.prefix                                        | /config                                                      | 前缀，指示每个属性的第一级。值必须以正斜杠开头，后跟有效路径段或为空。默认为“ / config”。 |
| aws.paramstore.profile-separator                             | _                                                            |                                                              |
| cloud.aws.credentials.access-key                             |                                                              | 与静态提供程序一起使用的访问密钥。                           |
| cloud.aws.credentials.instance-profile                       | true                                                         | 无需进一步配置即可配置实例配置文件凭据提供程序。             |
| cloud.aws.credentials.profile-name                           |                                                              | AWS配置文件名称。                                            |
| cloud.aws.credentials.profile-path                           |                                                              | AWS配置文件路径。                                            |
| cloud.aws.credentials.secret-key                             |                                                              | 与静态提供程序一起使用的密钥。                               |
| cloud.aws.credentials.use-default-aws-credentials-chain      | false                                                        | 使用DefaultAWSCredentials链而不是配置自定义证书链。          |
| cloud.aws.loader.core-pool-size                              | 1                                                            | 用于并行S3交互的Task Executor的核心池大小。@see org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor＃setCorePoolSize（int） |
| cloud.aws.loader.max-pool-size                               |                                                              | 用于并行S3交互的Task Executor的最大池大小。@see org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor＃setMaxPoolSize（int） |
| cloud.aws.loader.queue-capacity                              |                                                              | 备份的S3请求的最大队列容量。@see org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor＃setQueueCapacity（int） |
| cloud.aws.region.auto                                        | true                                                         | 启用基于EC2元数据服务的自动区域检测。                        |
| cloud.aws.region.static                                      |                                                              |                                                              |
| cloud.aws.stack.auto                                         | true                                                         | 为应用程序启用自动堆栈名称检测。                             |
| cloud.aws.stack.name                                         | myStackName                                                  | 手动配置的堆栈名称的名称，该名称将用于检索资源。             |
| encrypt.fail-on-error                                        | true                                                         | 标记为如果存在加密或解密错误，则进程应失败。                 |
| encrypt.key                                                  |                                                              | 对称密钥。作为更强大的选择，请考虑使用密钥库。               |
| encrypt.key-store.alias                                      |                                                              | 商店中密钥的别名。                                           |
| encrypt.key-store.location                                   |                                                              | 密钥库文件的位置，例如classpath：/keystore.jks。             |
| encrypt.key-store.password                                   |                                                              | 锁定密钥库的密码。                                           |
| encrypt.key-store.secret                                     |                                                              | 秘密保护密钥（默认与密码相同）。                             |
| encrypt.key-store.type                                       | jks                                                          | KeyStore类型。默认为jks。                                    |
| encrypt.rsa.algorithm                                        |                                                              | 要使用的RSA算法（DEFAULT或OEAP）。设置后，请勿对其进行更改（否则现有密码将不可解密）。 |
| encrypt.rsa.salt                                             | deadbeef                                                     | 盐，用于加密密文的随机秘密。设置后，请勿对其进行更改（否则现有密码将不可解密）。 |
| encrypt.rsa.strong                                           | false                                                        | 指示在内部使用“强” AES加密的标志。如果为true，则将GCM算法应用于AES加密字节。默认值为false（在这种情况下，将使用“标准” CBC代替）。设置后，请勿对其进行更改（否则现有密码将不可解密）。 |
| encrypt.salt                                                 | deadbeef                                                     | 对称密钥的盐，以十六进制编码的字节数组的形式。作为更强大的选择，请考虑使用密钥库。 |
| endpoints.zookeeper.enabled                                  | true                                                         | 启用/ zookeeper端点以检查Zookeeper的状态。                   |
| eureka.client.healthcheck.enabled                            | true                                                         | 启用Eureka健康检查处理程序。                                 |
| health.config.enabled                                        | false                                                        | 指示应安装配置服务器运行状况指示器的标志。                   |
| health.config.time-to-live                                   | 0                                                            | 缓存结果的生存时间（以毫秒为单位）。默认值300000（5分钟）。  |
| hystrix.metrics.enabled                                      | true                                                         | 启用Hystrix指标轮询。默认为true。                            |
| hystrix.metrics.polling-interval-ms                          | 2000                                                         | 后续度量之间的间隔。默认为2000毫秒。                         |
| hystrix.shareSecurityContext                                 | false                                                        | 启用Hystrix并发策略插件挂钩的自动配置，该挂钩将把`SecurityContext`从您的主线程转移到Hystrix命令所使用的那个线程。 |
| management.endpoint.bindings.cache.time-to-live              | 0ms                                                          | 可以缓存响应的最长时间。                                     |
| management.endpoint.bindings.enabled                         | true                                                         | 是否启用绑定端点。                                           |
| management.endpoint.bus-env.enabled                          | true                                                         | 是否启用bus-env端点。                                        |
| management.endpoint.bus-refresh.enabled                      | true                                                         | 是否启用总线刷新端点。                                       |
| management.endpoint.channels.cache.time-to-live              | 0ms                                                          | 可以缓存响应的最长时间。                                     |
| management.endpoint.channels.enabled                         | true                                                         | 是否启用通道端点。                                           |
| management.endpoint.consul.cache.time-to-live                | 0ms                                                          | 可以缓存响应的最长时间。                                     |
| management.endpoint.consul.enabled                           | true                                                         | 是否启用consul端点。                                         |
| management.endpoint.env.post.enabled                         | true                                                         | 启用可写环境端点。                                           |
| management.endpoint.features.cache.time-to-live              | 0ms                                                          | 可以缓存响应的最长时间。                                     |
| management.endpoint.features.enabled                         | true                                                         | 是否启用功能端点。                                           |
| management.endpoint.gateway.enabled                          | true                                                         | 是否启用网关端点。                                           |
| management.endpoint.hystrix.config                           |                                                              | Hystrix设置。传统上，这些是使用servlet参数设置的。有关更多详细信息，请参见Hystrix的文档。 |
| management.endpoint.hystrix.stream.enabled                   | true                                                         | 是否启用hystrix.stream端点。                                 |
| management.endpoint.pause.enabled                            | true                                                         | 启用/ pause端点（发送Lifecycle.stop（））。                  |
| management.endpoint.refresh.enabled                          | true                                                         | 启用/ refresh端点以刷新配置并重新初始化范围为beans的刷新。   |
| management.endpoint.restart.enabled                          | true                                                         | 启用/ restart端点以重新启动应用程序上下文。                  |
| management.endpoint.resume.enabled                           | true                                                         | 启用/ resume端点（以发送Lifecycle.start（））。              |
| management.endpoint.service-registry.cache.time-to-live      | 0ms                                                          | 可以缓存响应的最长时间。                                     |
| management.endpoint.service-registry.enabled                 | true                                                         | 是否启用服务注册端点。                                       |
| management.health.binders.enabled                            | true                                                         | 允许启用/禁用活页夹的健康指标。如果要完全禁用运行状况指示器，则将其设置为`false`。 |
| management.health.refresh.enabled                            | true                                                         | 为刷新范围启用运行状况终结点。                               |
| management.health.zookeeper.enabled                          | true                                                         | 为Zookeeper启用健康端点。                                    |
| management.metrics.binders.hystrix.enabled                   | true                                                         | 启用OK Http客户端工厂beans的创建。                           |
| management.metrics.export.cloudwatch.batch-size              |                                                              |                                                              |
| management.metrics.export.cloudwatch.connect-timeout         |                                                              |                                                              |
| management.metrics.export.cloudwatch.enabled                 | true                                                         | 启用云监视指标。                                             |
| management.metrics.export.cloudwatch.namespace               |                                                              | 云监视名称空间。                                             |
| management.metrics.export.cloudwatch.num-threads             |                                                              |                                                              |
| management.metrics.export.cloudwatch.read-timeout            |                                                              |                                                              |
| management.metrics.export.cloudwatch.step                    |                                                              |                                                              |
| maven.checksum-policy                                        |                                                              |                                                              |
| maven.connect-timeout                                        |                                                              |                                                              |
| maven.enable-repository-listener                             |                                                              |                                                              |
| maven.local-repository                                       |                                                              |                                                              |
| maven.offline                                                |                                                              |                                                              |
| maven.proxy                                                  |                                                              |                                                              |
| maven.remote-repositories                                    |                                                              |                                                              |
| maven.request-timeout                                        |                                                              |                                                              |
| maven.resolve-pom                                            |                                                              |                                                              |
| maven.update-policy                                          |                                                              |                                                              |
| proxy.auth.load-balanced                                     | false                                                        |                                                              |
| proxy.auth.routes                                            |                                                              | 每个路由的身份验证策略。                                     |
| ribbon.eager-load.clients                                    |                                                              |                                                              |
| ribbon.eager-load.enabled                                    | false                                                        |                                                              |
| ribbon.http.client.enabled                                   | false                                                        | 不推荐使用的属性，以启用Ribbon RestClient。                  |
| ribbon.okhttp.enabled                                        | false                                                        | 启用将OK HTTP Client与Ribbon一起使用。                       |
| ribbon.restclient.enabled                                    | false                                                        | 启用不推荐使用的Ribbon RestClient。                          |
| ribbon.secure-ports                                          |                                                              |                                                              |
| spring.cloud.bus.ack.destination-service                     |                                                              | 想要听音乐的服务。默认情况下为null（表示所有服务）。         |
| spring.cloud.bus.ack.enabled                                 | true                                                         | 标记以关闭托架（默认为打开）。                               |
| spring.cloud.bus.destination                                 | springCloudBus                                               | Spring Cloud Stream消息目的地的名称。                        |
| spring.cloud.bus.enabled                                     | true                                                         | 指示总线已启用的标志。                                       |
| spring.cloud.bus.env.enabled                                 | true                                                         | 标记以关闭环境更改事件（默认为打开）。                       |
| spring.cloud.bus.id                                          | application                                                  | 此应用程序实例的标识符。                                     |
| spring.cloud.bus.refresh.enabled                             | true                                                         | 标记以关闭刷新事件（默认为打开）。                           |
| spring.cloud.bus.trace.enabled                               | false                                                        | 标记以打开跟踪（默认关闭）。                                 |
| spring.cloud.cloudfoundry.discovery.default-server-port      | 80                                                           | 功能区未定义任何端口时使用的端口。                           |
| spring.cloud.cloudfoundry.discovery.enabled                  | true                                                         | 指示启用发现的标志。                                         |
| spring.cloud.cloudfoundry.discovery.heartbeat-frequency      | 5000                                                         | 心跳的轮询频率（以毫秒为单位）。客户端将以此频率进行轮询并广播服务ID列表。 |
| spring.cloud.cloudfoundry.discovery.order                    | 0                                                            | `CompositeDiscoveryClient`用于对可用客户端进行排序的发现客户端的顺序。 |
| spring.cloud.cloudfoundry.org                                |                                                              | 最初定位的组织名称。                                         |
| spring.cloud.cloudfoundry.password                           |                                                              | 用户进行身份验证和获取令牌的密码。                           |
| spring.cloud.cloudfoundry.skip-ssl-validation                | false                                                        |                                                              |
| spring.cloud.cloudfoundry.space                              |                                                              | 最初定位的空间名称。                                         |
| spring.cloud.cloudfoundry.url                                |                                                              | Cloud Foundry API（云控制器）的URL。                         |
| spring.cloud.cloudfoundry.username                           |                                                              | 要进行身份验证的用户名（通常是电子邮件地址）。               |
| spring.cloud.compatibility-verifier.compatible-boot-versions | 2.1.x                                                        | Spring Boot依赖项的默认接受版本。如果您不想指定具体的值，则可以为补丁程序版本设置{@code x}。示例：{@ code 3.4.x} |
| spring.cloud.compatibility-verifier.enabled                  | false                                                        | 启用创建Spring Cloud兼容性验证的功能。                       |
| spring.cloud.config.allow-override                           | true                                                         | 指示可以使用{@link #isOverrideSystemProperties（）systemPropertiesOverride}的标志。设置为false可以防止用户意外更改默认值。默认为true。 |
| spring.cloud.config.discovery.enabled                        | false                                                        | 指示已启用配置服务器发现的标志（将通过发现来查找配置服务器URL）。 |
| spring.cloud.config.discovery.service-id                     | configserver                                                 | 用于找到配置服务器的服务ID。                                 |
| spring.cloud.config.enabled                                  | true                                                         | 表示已启用远程配置的标志。默认为true;                        |
| spring.cloud.config.fail-fast                                | false                                                        | 指示连接服务器失败的致命标志（默认为false）。                |
| spring.cloud.config.headers                                  |                                                              | 用于创建客户端请求的其他标头。                               |
| spring.cloud.config.label                                    |                                                              | 用于拉取远程配置属性的标签名称。默认设置是在服务器上设置的（通常是基于git的服务器的“ master”）。 |
| spring.cloud.config.name                                     |                                                              | 用于获取远程属性的应用程序的名称。                           |
| spring.cloud.config.override-none                            | false                                                        | 标志，指示当{@link #setAllowOverride（boolean）allowOverride}为true时，外部属性应具有最低优先级，并且不应覆盖任何现有的属性源（包括本地配置文件）。默认为false。 |
| spring.cloud.config.override-system-properties               | true                                                         | 指示外部属性应覆盖系统属性的标志。默认为true。               |
| spring.cloud.config.password                                 |                                                              | 与远程服务器联系时使用的密码（HTTP基本）。                   |
| spring.cloud.config.profile                                  | default                                                      | 获取远程配置时使用的默认配置文件（以逗号分隔）。默认为“默认”。 |
| spring.cloud.config.request-connect-timeout                  | 0                                                            | 等待连接到配置服务器时超时。                                 |
| spring.cloud.config.request-read-timeout                     | 0                                                            | 等待从配置服务器读取数据时超时。                             |
| spring.cloud.config.retry.initial-interval                   | 1000                                                         | 初始重试间隔（以毫秒为单位）。                               |
| spring.cloud.config.retry.max-attempts                       | 6                                                            | 最大尝试次数。                                               |
| spring.cloud.config.retry.max-interval                       | 2000                                                         | 退避的最大间隔。                                             |
| spring.cloud.config.retry.multiplier                         | 1.1                                                          | 下一个间隔的乘数。                                           |
| spring.cloud.config.send-state                               | true                                                         | 指示是否发送状态的标志。默认为true。                         |
| spring.cloud.config.server.accept-empty                      | true                                                         | 指示未找到应用程序是否需要发送HTTP 404的标志。               |
| spring.cloud.config.server.bootstrap                         | false                                                        | 指示配置服务器应使用远程存储库中的属性初始化其自己的环境的标志。默认情况下处于关闭状态，因为它会延迟启动，但是在将服务器嵌入另一个应用程序时很有用。 |
| spring.cloud.config.server.credhub.ca-cert-files             |                                                              |                                                              |
| spring.cloud.config.server.credhub.connection-timeout        |                                                              |                                                              |
| spring.cloud.config.server.credhub.oauth2.registration-id    |                                                              |                                                              |
| spring.cloud.config.server.credhub.order                     |                                                              |                                                              |
| spring.cloud.config.server.credhub.read-timeout              |                                                              |                                                              |
| spring.cloud.config.server.credhub.url                       |                                                              |                                                              |
| spring.cloud.config.server.default-application-name          | application                                                  | 传入请求没有特定请求时的默认应用程序名称。                   |
| spring.cloud.config.server.default-label                     |                                                              | 传入请求没有特定标签时的默认存储库标签。                     |
| spring.cloud.config.server.default-profile                   | default                                                      | 传入请求没有特定请求时的默认应用程序配置文件。               |
| spring.cloud.config.server.encrypt.enabled                   | true                                                         | 在发送到客户端之前，启用环境属性的解密。                     |
| spring.cloud.config.server.git.basedir                       |                                                              | 存储库本地工作副本的基本目录。                               |
| spring.cloud.config.server.git.clone-on-start                | false                                                        | 指示应在启动时（而不是按需）克隆存储库的标志。通常会导致启动速度较慢，但首次查询速度较快。 |
| spring.cloud.config.server.git.default-label                 |                                                              | 与远程存储库一起使用的默认标签。                             |
| spring.cloud.config.server.git.delete-untracked-branches     | false                                                        | 用于指示如果删除了其原始跟踪的分支，则应在本地删除该分支的标志。 |
| spring.cloud.config.server.git.force-pull                    | false                                                        | 指示存储库应强制拉动的标志。如果为true，则放弃所有本地更改并从远程存储库获取。 |
| spring.cloud.config.server.git.host-key                      |                                                              | 有效的SSH主机密钥。如果还设置了hostKeyAlgorithm，则必须设置。 |
| spring.cloud.config.server.git.host-key-algorithm            |                                                              | ssh-dss，ssh-rsa，ecdsa-sha2-nistp256，ecdsa-sha2-nistp384或ecdsa-sha2-nistp521中的一种。如果还设置了hostKey，则必须设置。 |
| spring.cloud.config.server.git.ignore-local-ssh-settings     | false                                                        | 如果为true，请使用基于属性的SSH而非基于文件的SSH配置。       |
| spring.cloud.config.server.git.known-hosts-file              |                                                              | 自定义.known_hosts文件的位置。                               |
| spring.cloud.config.server.git.order                         |                                                              | 环境存储库的顺序。                                           |
| spring.cloud.config.server.git.passphrase                    |                                                              | 用于解锁ssh私钥的密码。                                      |
| spring.cloud.config.server.git.password                      |                                                              | 远程存储库认证密码。                                         |
| spring.cloud.config.server.git.preferred-authentications     |                                                              | 覆盖服务器身份验证方法顺序。如果服务器在publickey方法之前具有键盘交互身份验证，则这应该可以避免登录提示。 |
| spring.cloud.config.server.git.private-key                   |                                                              | 有效的SSH私钥。如果ignoreLocalSshSettings为true并且Git URI为SSH格式，则必须设置。 |
| spring.cloud.config.server.git.proxy                         |                                                              | HTTP代理配置。                                               |
| spring.cloud.config.server.git.refresh-rate                  | 0                                                            | 刷新git存储库之间的时间（以秒为单位）。                      |
| spring.cloud.config.server.git.repos                         |                                                              | 存储库标识符到位置和其他属性的映射。                         |
| spring.cloud.config.server.git.search-paths                  |                                                              | 搜索要在本地工作副本中使用的路径。默认情况下，仅搜索根。     |
| spring.cloud.config.server.git.skip-ssl-validation           | false                                                        | 与通过HTTPS连接提供服务的存储库进行通信时，指示应绕过SSL证书验证的标志。 |
| spring.cloud.config.server.git.strict-host-key-checking      | true                                                         | 如果为false，请忽略主机密钥错误。                            |
| spring.cloud.config.server.git.timeout                       | 5                                                            | 获取HTTP或SSH连接的超时（以秒为单位）（如果适用），默认为5秒。 |
| spring.cloud.config.server.git.uri                           |                                                              | 远程存储库的URI。                                            |
| spring.cloud.config.server.git.username                      |                                                              | 使用远程存储库进行身份验证的用户名。                         |
| spring.cloud.config.server.health.repositories               |                                                              |                                                              |
| spring.cloud.config.server.jdbc.order                        | 0                                                            |                                                              |
| spring.cloud.config.server.jdbc.sql                          | SELECT KEY, VALUE from PROPERTIES where APPLICATION=? and PROFILE=? and LABEL=? | 用于查询数据库的键和值的SQL。                                |
| spring.cloud.config.server.native.add-label-locations        | true                                                         | 标记以确定是否应添加标签位置。                               |
| spring.cloud.config.server.native.default-label              | master                                                       |                                                              |
| spring.cloud.config.server.native.fail-on-error              | false                                                        | 用于确定解密期间如何处理异常的标志（默认为false）。          |
| spring.cloud.config.server.native.order                      |                                                              |                                                              |
| spring.cloud.config.server.native.search-locations           | []                                                           | 搜索配置文件的位置。默认与Spring Boot应用相同，因此[classpath：/，classpath：/ config /，file：./，file：./ config /]。 |
| spring.cloud.config.server.native.version                    |                                                              | 将为本机存储库报告的版本字符串。                             |
| spring.cloud.config.server.overrides                         |                                                              | 属性源的额外映射将无条件发送给所有客户端。                   |
| spring.cloud.config.server.prefix                            |                                                              | 配置资源路径的前缀（默认为空）。当您不想更改上下文路径或servlet路径时，在嵌入另一个应用程序时很有用。 |
| spring.cloud.config.server.strip-document-from-yaml          | true                                                         | 标记，用于指示应以“本机”形式返回文本或集合（不是地图）的YAML文档。 |
| spring.cloud.config.server.svn.basedir                       |                                                              | 存储库本地工作副本的基本目录。                               |
| spring.cloud.config.server.svn.default-label                 |                                                              | 与远程存储库一起使用的默认标签。                             |
| spring.cloud.config.server.svn.order                         |                                                              | 环境存储库的顺序。                                           |
| spring.cloud.config.server.svn.passphrase                    |                                                              | 用于解锁ssh私钥的密码。                                      |
| spring.cloud.config.server.svn.password                      |                                                              | 远程存储库认证密码。                                         |
| spring.cloud.config.server.svn.search-paths                  |                                                              | 搜索要在本地工作副本中使用的路径。默认情况下，仅搜索根。     |
| spring.cloud.config.server.svn.strict-host-key-checking      | true                                                         | 从不在已知主机列表中的远程服务器拒绝传入的SSH主机密钥。      |
| spring.cloud.config.server.svn.uri                           |                                                              | 远程存储库的URI。                                            |
| spring.cloud.config.server.svn.username                      |                                                              | 使用远程存储库进行身份验证的用户名。                         |
| spring.cloud.config.server.vault.backend                     | secret                                                       | Vault后端。默认为秘密。                                      |
| spring.cloud.config.server.vault.default-key                 | application                                                  | 所有应用程序共享的保管库密钥。默认为应用程序。设置为空禁用。 |
| spring.cloud.config.server.vault.host                        | 127.0.0.1                                                    | Vault主机。默认为127.0.0.1。                                 |
| spring.cloud.config.server.vault.kv-version                  | 1                                                            | 指示使用哪个版本的Vault kv后端的值。默认为1。                |
| spring.cloud.config.server.vault.namespace                   |                                                              | Vault X- Vault-命名空间标头的值。默认为空。这仅是Vault企业功能。 |
| spring.cloud.config.server.vault.order                       |                                                              |                                                              |
| spring.cloud.config.server.vault.port                        | 8200                                                         | Vault端口。默认为8200                                        |
| spring.cloud.config.server.vault.profile-separator           | ,                                                            | Vault配置文件分隔符。默认为逗号。                            |
| spring.cloud.config.server.vault.proxy                       |                                                              | HTTP代理配置。                                               |
| spring.cloud.config.server.vault.scheme                      | http                                                         | Vault方案。默认为http。                                      |
| spring.cloud.config.server.vault.skip-ssl-validation         | false                                                        | 与通过HTTPS连接提供服务的存储库进行通信时，指示应绕过SSL证书验证的标志。 |
| spring.cloud.config.server.vault.timeout                     | 5                                                            | 获取HTTP连接的超时时间（以秒为单位），默认为5秒。            |
| spring.cloud.config.token                                    |                                                              | 安全令牌通过传递到基础环境存储库。                           |
| spring.cloud.config.uri                                      | [[http://localhost:8888](http://localhost:8888/)]            | 远程服务器的URI（默认为[http：// localhost：8888](http://localhost:8888/)）。 |
| spring.cloud.config.username                                 |                                                              | 与远程服务器联系时要使用的用户名（HTTP基本）。               |
| spring.cloud.consul.config.acl-token                         |                                                              |                                                              |
| spring.cloud.consul.config.data-key                          | data                                                         | 如果format为Format.PROPERTIES或Format.YAML，则以下字段用作查找consul进行配置的键。 |
| spring.cloud.consul.config.default-context                   | application                                                  |                                                              |
| spring.cloud.consul.config.enabled                           | true                                                         |                                                              |
| spring.cloud.consul.config.fail-fast                         | true                                                         | 如果为true，则在配置查找过程中引发异常，否则，记录警告。     |
| spring.cloud.consul.config.format                            |                                                              |                                                              |
| spring.cloud.consul.config.name                              |                                                              | 在consul KV中查找值时可以使用spring.application.name的替代方法。 |
| spring.cloud.consul.config.prefix                            | config                                                       |                                                              |
| spring.cloud.consul.config.profile-separator                 | ,                                                            |                                                              |
| spring.cloud.consul.config.watch.delay                       | 1000                                                         | 手表的固定延迟值，以毫秒为单位。预设为1000。                 |
| spring.cloud.consul.config.watch.enabled                     | true                                                         | 如果启用了手表。默认为true。                                 |
| spring.cloud.consul.config.watch.wait-time                   | 55                                                           | 等待（或阻止）监视查询的秒数，默认为55。需要小于默认的ConsulClient（默认为60）。要增加ConsulClient超时，请使用自定义ConsulRawClient和自定义HttpClient创建ConsulClient bean。 |
| spring.cloud.consul.discovery.acl-token                      |                                                              |                                                              |
| spring.cloud.consul.discovery.catalog-services-watch-delay   | 1000                                                         | 观看consul目录的呼叫之间的延迟（以毫秒为单位），默认值为1000。 |
| spring.cloud.consul.discovery.catalog-services-watch-timeout | 2                                                            | 观看consul目录时阻止的秒数，默认值为2。                      |
| spring.cloud.consul.discovery.datacenters                    |                                                              | 在服务器列表中查询的serviceId→数据中心的映射。这允许在另一个数据中心中查找服务。 |
| spring.cloud.consul.discovery.default-query-tag              |                                                              | 如果serverListQueryTags中未列出服务列表中要查询的标签。      |
| spring.cloud.consul.discovery.default-zone-metadata-name     | zone                                                         | 服务实例区域来自元数据。这允许更改元数据标签名称。           |
| spring.cloud.consul.discovery.deregister                     | true                                                         | 在consul中禁用自动注销服务。                                 |
| spring.cloud.consul.discovery.enabled                        | true                                                         | 是否启用服务发现？                                           |
| spring.cloud.consul.discovery.fail-fast                      | true                                                         | 如果为true，则在服务注册期间引发异常，否则，记录警告（默认为true）。 |
| spring.cloud.consul.discovery.health-check-critical-timeout  |                                                              | 取消注册关键时间超过超时时间（例如30m）的超时。需要consul版本7.x或更高版本。 |
| spring.cloud.consul.discovery.health-check-headers           |                                                              | 应用于健康检查呼叫的标题。                                   |
| spring.cloud.consul.discovery.health-check-interval          | 10s                                                          | 运行状况检查的频率（例如10s），默认为10s。                   |
| spring.cloud.consul.discovery.health-check-path              | /actuator/health                                             | 调用以进行健康检查的备用服务器路径。                         |
| spring.cloud.consul.discovery.health-check-timeout           |                                                              | 健康检查超时（例如10秒）。                                   |
| spring.cloud.consul.discovery.health-check-tls-skip-verify   |                                                              | 如果服务检查为true，则跳过证书验证，否则运行证书验证。       |
| spring.cloud.consul.discovery.health-check-url               |                                                              | 自定义运行状况检查网址会覆盖默认值。                         |
| spring.cloud.consul.discovery.heartbeat.enabled              | false                                                        |                                                              |
| spring.cloud.consul.discovery.heartbeat.interval-ratio       |                                                              |                                                              |
| spring.cloud.consul.discovery.heartbeat.ttl-unit             | s                                                            |                                                              |
| spring.cloud.consul.discovery.heartbeat.ttl-value            | 30                                                           |                                                              |
| spring.cloud.consul.discovery.hostname                       |                                                              | 访问服务器时使用的主机名。                                   |
| spring.cloud.consul.discovery.instance-group                 |                                                              | 服务实例组。                                                 |
| spring.cloud.consul.discovery.instance-id                    |                                                              | 唯一的服务实例ID。                                           |
| spring.cloud.consul.discovery.instance-zone                  |                                                              | 服务实例区域。                                               |
| spring.cloud.consul.discovery.ip-address                     |                                                              | 访问服务时要使用的IP地址（还必须设置preferredIpAddress才能使用）。 |
| spring.cloud.consul.discovery.lifecycle.enabled              | true                                                         |                                                              |
| spring.cloud.consul.discovery.management-port                |                                                              | 用于注册管理服务的端口（默认为管理端口）。                   |
| spring.cloud.consul.discovery.management-suffix              | management                                                   | 注册管理服务时使用的后缀。                                   |
| spring.cloud.consul.discovery.management-tags                |                                                              | 注册管理服务时要使用的标签。                                 |
| spring.cloud.consul.discovery.order                          | 0                                                            | `CompositeDiscoveryClient`用于对可用客户端进行排序的发现客户端的顺序。 |
| spring.cloud.consul.discovery.port                           |                                                              | 用于注册服务的端口（默认为监听端口）。                       |
| spring.cloud.consul.discovery.prefer-agent-address           | false                                                        | 我们将如何确定要使用的地址的来源。                           |
| spring.cloud.consul.discovery.prefer-ip-address              | false                                                        | 注册时使用IP地址而不是主机名。                               |
| spring.cloud.consul.discovery.query-passing                  | false                                                        | 将“传递”参数添加到/ v1 / health / service / serviceName。这会将运行状况检查传递到服务器。 |
| spring.cloud.consul.discovery.register                       | true                                                         | 在consul中注册为服务。                                       |
| spring.cloud.consul.discovery.register-health-check          | true                                                         | 在consul中注册健康检查。在服务开发期间很有用。               |
| spring.cloud.consul.discovery.scheme                         | http                                                         | 是否注册http或https服务。                                    |
| spring.cloud.consul.discovery.server-list-query-tags         |                                                              | 在服务器列表中查询的serviceId的→标记的映射。这允许通过单个标签过滤服务。 |
| spring.cloud.consul.discovery.service-name                   |                                                              | 服务名称。                                                   |
| spring.cloud.consul.discovery.tags                           |                                                              | 注册服务时要使用的标签。                                     |
| spring.cloud.consul.enabled                                  | true                                                         | 已启用spring cloud consul。                                  |
| spring.cloud.consul.host                                     | localhost                                                    | Consul代理主机名。默认为'localhost'。                        |
| spring.cloud.consul.port                                     | 8500                                                         | Consul代理程序端口。默认为“ 8500”。                          |
| spring.cloud.consul.retry.initial-interval                   | 1000                                                         | 初始重试间隔（以毫秒为单位）。                               |
| spring.cloud.consul.retry.max-attempts                       | 6                                                            | 最大尝试次数。                                               |
| spring.cloud.consul.retry.max-interval                       | 2000                                                         | 退避的最大间隔。                                             |
| spring.cloud.consul.retry.multiplier                         | 1.1                                                          | 下一个间隔的乘数。                                           |
| spring.cloud.consul.scheme                                   |                                                              | Consul代理方案（HTTP / HTTPS）。如果地址中没有任何方案，客户端将使用HTTP。 |
| spring.cloud.consul.tls.certificate-password                 |                                                              | 打开证书的密码。                                             |
| spring.cloud.consul.tls.certificate-path                     |                                                              | 证书的文件路径。                                             |
| spring.cloud.consul.tls.key-store-instance-type              |                                                              | 要使用的关键框架的类型。                                     |
| spring.cloud.consul.tls.key-store-password                   |                                                              | 外部密钥库的密码。                                           |
| spring.cloud.consul.tls.key-store-path                       |                                                              | 外部密钥库的路径。                                           |
| spring.cloud.discovery.client.cloudfoundry.order             |                                                              |                                                              |
| spring.cloud.discovery.client.composite-indicator.enabled    | true                                                         | 启用发现客户端复合运行状况指示器。                           |
| spring.cloud.discovery.client.health-indicator.enabled       | true                                                         |                                                              |
| spring.cloud.discovery.client.health-indicator.include-description | false                                                        |                                                              |
| spring.cloud.discovery.client.simple.instances               |                                                              |                                                              |
| spring.cloud.discovery.client.simple.local.instance-id       |                                                              | 服务实例的唯一标识符或名称。                                 |
| spring.cloud.discovery.client.simple.local.metadata          |                                                              | 服务实例的元数据。发现客户端可将其用于按实例修改其行为，例如在负载平衡时。 |
| spring.cloud.discovery.client.simple.local.service-id        |                                                              | 服务的标识符或名称。多个实例可能共享相同的服务ID。           |
| spring.cloud.discovery.client.simple.local.uri               |                                                              | 服务实例的URI。将被解析以提取方案，主机和端口。              |
| spring.cloud.discovery.client.simple.order                   |                                                              |                                                              |
| spring.cloud.discovery.enabled                               | true                                                         | 启用发现客户端运行状况指示器。                               |
| spring.cloud.features.enabled                                | true                                                         | 启用功能端点。                                               |
| spring.cloud.function.compile                                |                                                              | 功能主体的配置，将进行编译。映射中的键是函数名称，值是包含键“ lambda”（要编译的主体）和可选的“类型”（默认为“ function”）的映射。如果模棱两可，还可以包含“ inputType”和“ outputType”。 |
| spring.cloud.function.definition                             |                                                              | 用于解析默认功能的名称（例如，“ foo”）或组合指令（例如，“ foo \| bar”），尤其是在目录中只有一次可用的功能的情况下。 |
| spring.cloud.function.imports                                |                                                              | 一组包含功能主体的文件的配置，这些文件将被导入和编译。映射中的键是函数名称，值是另一个映射，包含要编译的文件的“位置”和（可选）“类型”（默认为“函数”）。 |
| spring.cloud.function.scan.packages                          | functions                                                    | 触发在指定的基本包内扫描可分配给java.util.function.Function的任何类。对于每个检测到的Function类，bean实例将添加到上下文中。 |
| spring.cloud.function.task.consumer                          |                                                              |                                                              |
| spring.cloud.function.task.function                          |                                                              |                                                              |
| spring.cloud.function.task.supplier                          |                                                              |                                                              |
| spring.cloud.function.web.path                               |                                                              | 函数的web资源的路径（如果不为空，则应以/开头）。             |
| spring.cloud.function.web.supplier.auto-startup              | true                                                         |                                                              |
| spring.cloud.function.web.supplier.debug                     | true                                                         |                                                              |
| spring.cloud.function.web.supplier.enabled                   | false                                                        |                                                              |
| spring.cloud.function.web.supplier.headers                   |                                                              |                                                              |
| spring.cloud.function.web.supplier.name                      |                                                              |                                                              |
| spring.cloud.function.web.supplier.template-url              |                                                              |                                                              |
| spring.cloud.gateway.default-filters                         |                                                              | 应用于每个路由的过滤器定义列表。                             |
| spring.cloud.gateway.discovery.locator.enabled               | false                                                        | 启用DiscoveryClient网关集成的标志。                          |
| spring.cloud.gateway.discovery.locator.filters               |                                                              |                                                              |
| spring.cloud.gateway.discovery.locator.include-expression    | true                                                         | 用于评估是否在网关集成中包括服务的SpEL表达式，默认为：true。 |
| spring.cloud.gateway.discovery.locator.lower-case-service-id | false                                                        | 谓词和过滤器中的小写serviceId选项，默认为false。当eureka自动将serviceId大写时，对它有用。因此MYSERIVCE将与/ myservice / **匹配 |
| spring.cloud.gateway.discovery.locator.predicates            |                                                              |                                                              |
| spring.cloud.gateway.discovery.locator.route-id-prefix       |                                                              | routeId的前缀，默认为DiscoveryClient.getClass（）。getSimpleName（）+“ _”。服务ID将被添加以创建routeId。 |
| spring.cloud.gateway.discovery.locator.url-expression        | 'lb://'+serviceId                                            | 为每个路由创建uri的SpEL表达式，默认为：'lb：//'+ serviceId。 |
| spring.cloud.gateway.enabled                                 | true                                                         | 启用网关功能。                                               |
| spring.cloud.gateway.filter.remove-hop-by-hop.headers        |                                                              |                                                              |
| spring.cloud.gateway.filter.remove-hop-by-hop.order          |                                                              |                                                              |
| spring.cloud.gateway.filter.request-rate-limiter.deny-empty-key | true                                                         | 如果密钥解析器返回空密钥，则切换为拒绝请求，默认为true。     |
| spring.cloud.gateway.filter.request-rate-limiter.empty-key-status-code |                                                              | denyEmptyKey为true时返回的HttpStatus，默认为FORBIDDEN。      |
| spring.cloud.gateway.filter.secure-headers.content-security-policy | default-src 'self' https:; font-src 'self' https: data:; img-src 'self' https: data:; object-src 'none'; script-src https:; style-src 'self' https: 'unsafe-inline' |                                                              |
| spring.cloud.gateway.filter.secure-headers.content-type-options | nosniff                                                      |                                                              |
| spring.cloud.gateway.filter.secure-headers.disable           |                                                              |                                                              |
| spring.cloud.gateway.filter.secure-headers.download-options  | noopen                                                       |                                                              |
| spring.cloud.gateway.filter.secure-headers.frame-options     | DENY                                                         |                                                              |
| spring.cloud.gateway.filter.secure-headers.permitted-cross-domain-policies | none                                                         |                                                              |
| spring.cloud.gateway.filter.secure-headers.referrer-policy   | no-referrer                                                  |                                                              |
| spring.cloud.gateway.filter.secure-headers.strict-transport-security | max-age=631138519                                            |                                                              |
| spring.cloud.gateway.filter.secure-headers.xss-protection-header | 1 ; mode=block                                               |                                                              |
| spring.cloud.gateway.forwarded.enabled                       | true                                                         | 启用ForwardedHeadersFilter。                                 |
| spring.cloud.gateway.globalcors.cors-configurations          |                                                              |                                                              |
| spring.cloud.gateway.httpclient.connect-timeout              |                                                              | 连接超时（以毫秒为单位），默认值为45s。                      |
| spring.cloud.gateway.httpclient.max-header-size              |                                                              | 最大响应标头大小。                                           |
| spring.cloud.gateway.httpclient.pool.acquire-timeout         |                                                              | 仅对于FIXED类型，等待等待的最长时间（以毫秒为单位）。        |
| spring.cloud.gateway.httpclient.pool.max-connections         |                                                              | 仅对于FIXED类型，是在现有连接上开始挂起获取之前的最大连接数。 |
| spring.cloud.gateway.httpclient.pool.name                    | proxy                                                        | 通道池映射名称，默认为代理。                                 |
| spring.cloud.gateway.httpclient.pool.type                    |                                                              | 供HttpClient使用的池的类型，默认为ELASTIC。                  |
| spring.cloud.gateway.httpclient.proxy.host                   |                                                              | Netty HttpClient代理配置的主机名。                           |
| spring.cloud.gateway.httpclient.proxy.non-proxy-hosts-pattern |                                                              | 配置的主机列表的正则表达式（Java）。应该直接到达，绕过代理   |
| spring.cloud.gateway.httpclient.proxy.password               |                                                              | Netty HttpClient代理配置的密码。                             |
| spring.cloud.gateway.httpclient.proxy.port                   |                                                              | Netty HttpClient代理配置的端口。                             |
| spring.cloud.gateway.httpclient.proxy.username               |                                                              | Netty HttpClient代理配置的用户名。                           |
| spring.cloud.gateway.httpclient.response-timeout             |                                                              | 响应超时。                                                   |
| spring.cloud.gateway.httpclient.ssl.close-notify-flush-timeout | 3000ms                                                       | SSL close_notify刷新超时。默认为3000毫秒                     |
| spring.cloud.gateway.httpclient.ssl.close-notify-flush-timeout-millis |                                                              |                                                              |
| spring.cloud.gateway.httpclient.ssl.close-notify-read-timeout |                                                              | SSL close_notify读取超时。默认为0毫秒。                      |
| spring.cloud.gateway.httpclient.ssl.close-notify-read-timeout-millis |                                                              |                                                              |
| spring.cloud.gateway.httpclient.ssl.default-configuration-type |                                                              | 缺省的ssl配置类型。默认为TCP。                               |
| spring.cloud.gateway.httpclient.ssl.handshake-timeout        | 10000ms                                                      | SSL握手超时。默认为10000毫秒                                 |
| spring.cloud.gateway.httpclient.ssl.handshake-timeout-millis |                                                              |                                                              |
| spring.cloud.gateway.httpclient.ssl.trusted-x509-certificates |                                                              | 用于验证远程端点的证书的受信任证书。                         |
| spring.cloud.gateway.httpclient.ssl.use-insecure-trust-manager | false                                                        | 安装netty InsecureTrustManagerFactory。这是不安全的，不适合生产。 |
| spring.cloud.gateway.httpclient.wiretap                      | false                                                        | 为Netty HttpClient启用窃听调试。                             |
| spring.cloud.gateway.httpserver.wiretap                      | false                                                        | 为Netty HttpServer启用窃听调试。                             |
| spring.cloud.gateway.loadbalancer.use404                     | false                                                        |                                                              |
| spring.cloud.gateway.metrics.enabled                         | true                                                         | 启用指标数据收集。                                           |
| spring.cloud.gateway.proxy.headers                           |                                                              | 固定的标头值，将添加到所有下游请求中。                       |
| spring.cloud.gateway.proxy.sensitive                         |                                                              | 一组敏感的标头名称，默认情况下不会发送到下游。               |
| spring.cloud.gateway.redis-rate-limiter.burst-capacity-header | X-RateLimit-Burst-Capacity                                   | 返回突发容量配置的标头名称。                                 |
| spring.cloud.gateway.redis-rate-limiter.config               |                                                              |                                                              |
| spring.cloud.gateway.redis-rate-limiter.include-headers      | true                                                         | 是否包括包含速率限制器信息的标头，默认为true。               |
| spring.cloud.gateway.redis-rate-limiter.remaining-header     | X-RateLimit-Remaining                                        | 标头名称，用于返回当前秒内剩余请求数。                       |
| spring.cloud.gateway.redis-rate-limiter.replenish-rate-header | X-RateLimit-Replenish-Rate                                   | 返回补充费率配置的标头名称。                                 |
| spring.cloud.gateway.routes                                  |                                                              | 路线清单。                                                   |
| spring.cloud.gateway.streaming-media-types                   |                                                              |                                                              |
| spring.cloud.gateway.x-forwarded.enabled                     | true                                                         | 如果启用了XForwardedHeadersFilter。                          |
| spring.cloud.gateway.x-forwarded.for-append                  | true                                                         | 如果启用了将X-Forwarded-For作为列表附加。                    |
| spring.cloud.gateway.x-forwarded.for-enabled                 | true                                                         | 如果启用了X-Forwarded-For。                                  |
| spring.cloud.gateway.x-forwarded.host-append                 | true                                                         | 如果启用了将X-Forwarded-Host作为列表追加。                   |
| spring.cloud.gateway.x-forwarded.host-enabled                | true                                                         | 如果启用了X-Forwarded-Host。                                 |
| spring.cloud.gateway.x-forwarded.order                       | 0                                                            | XForwardedHeadersFilter的顺序。                              |
| spring.cloud.gateway.x-forwarded.port-append                 | true                                                         | 如果启用了将X-Forwarded-Port作为列表追加。                   |
| spring.cloud.gateway.x-forwarded.port-enabled                | true                                                         | 如果启用了X-Forwarded-Port。                                 |
| spring.cloud.gateway.x-forwarded.prefix-append               | true                                                         | 如果启用将X-Forwarded-Prefix作为列表追加。                   |
| spring.cloud.gateway.x-forwarded.prefix-enabled              | true                                                         | 如果启用了X-Forwarded-Prefix。                               |
| spring.cloud.gateway.x-forwarded.proto-append                | true                                                         | 如果启用将X-Forwarded-Proto作为列表附加。                    |
| spring.cloud.gateway.x-forwarded.proto-enabled               | true                                                         | 如果启用了X-Forwarded-Proto。                                |
| spring.cloud.gcp.config.credentials.encoded-key              |                                                              |                                                              |
| spring.cloud.gcp.config.credentials.location                 |                                                              |                                                              |
| spring.cloud.gcp.config.credentials.scopes                   |                                                              |                                                              |
| spring.cloud.gcp.config.enabled                              | false                                                        | 启用Spring Cloud GCP配置。                                   |
| spring.cloud.gcp.config.name                                 |                                                              | 应用程序的名称。                                             |
| spring.cloud.gcp.config.profile                              |                                                              | 应用程序在其下运行的配置文件的逗号分隔字符串。从{@code spring.profiles.active}属性获取其默认值，回退到{@code spring.profiles.default}属性。 |
| spring.cloud.gcp.config.project-id                           |                                                              | 覆盖Core模块中指定的GCP项目ID。                              |
| spring.cloud.gcp.config.timeout-millis                       | 60000                                                        | Google Runtime Configuration API调用超时。                   |
| spring.cloud.gcp.credentials.encoded-key                     |                                                              |                                                              |
| spring.cloud.gcp.credentials.location                        |                                                              |                                                              |
| spring.cloud.gcp.credentials.scopes                          |                                                              |                                                              |
| spring.cloud.gcp.datastore.credentials.encoded-key           |                                                              |                                                              |
| spring.cloud.gcp.datastore.credentials.location              |                                                              |                                                              |
| spring.cloud.gcp.datastore.credentials.scopes                |                                                              |                                                              |
| spring.cloud.gcp.datastore.namespace                         |                                                              |                                                              |
| spring.cloud.gcp.datastore.project-id                        |                                                              |                                                              |
| spring.cloud.gcp.logging.enabled                             | true                                                         | 自动为Spring MVC配置Google Cloud Stackdriver日志记录。       |
| spring.cloud.gcp.project-id                                  |                                                              | 正在运行服务的GCP项目ID。                                    |
| spring.cloud.gcp.pubsub.credentials.encoded-key              |                                                              |                                                              |
| spring.cloud.gcp.pubsub.credentials.location                 |                                                              |                                                              |
| spring.cloud.gcp.pubsub.credentials.scopes                   |                                                              |                                                              |
| spring.cloud.gcp.pubsub.emulator-host                        |                                                              | 本地正在运行的仿真器的主机和端口。如果提供的话，这将设置客户端以与正在运行的发布/订阅模拟器连接。 |
| spring.cloud.gcp.pubsub.enabled                              | true                                                         | 自动配置Google Cloud Pub / Sub组件。                         |
| spring.cloud.gcp.pubsub.project-id                           |                                                              | 覆盖Core模块中指定的GCP项目ID。                              |
| spring.cloud.gcp.pubsub.publisher.batching.delay-threshold-seconds |                                                              | 用于批处理的延迟阈值。经过这段时间后（从添加的第一个元素开始计数），这些元素将被分批包装并发送。 |
| spring.cloud.gcp.pubsub.publisher.batching.element-count-threshold |                                                              | 用于批处理的元素计数阈值。                                   |
| spring.cloud.gcp.pubsub.publisher.batching.enabled           |                                                              | 如果为true，则启用批处理。                                   |
| spring.cloud.gcp.pubsub.publisher.batching.flow-control.limit-exceeded-behavior |                                                              | 超过指定限制时的行为。                                       |
| spring.cloud.gcp.pubsub.publisher.batching.flow-control.max-outstanding-element-count |                                                              | 在执行流控制之前要保留在内存中的未完成元素的最大数量。       |
| spring.cloud.gcp.pubsub.publisher.batching.flow-control.max-outstanding-request-bytes |                                                              | 强制执行流控制之前要保留在内存中的最大未完成字节数。         |
| spring.cloud.gcp.pubsub.publisher.batching.request-byte-threshold |                                                              | 用于批处理的请求字节阈值。                                   |
| spring.cloud.gcp.pubsub.publisher.executor-threads           | 4                                                            | 每个发布者使用的线程数。                                     |
| spring.cloud.gcp.pubsub.publisher.retry.initial-retry-delay-seconds |                                                              | InitialRetryDelay控制第一次重试之前的延迟。随后的重试将使用根据RetryDelayMultiplier调整的该值。 |
| spring.cloud.gcp.pubsub.publisher.retry.initial-rpc-timeout-seconds |                                                              | InitialRpcTimeout控制初始RPC的超时。后续调用将使用根据RpcTimeoutMultiplier调整的该值。 |
| spring.cloud.gcp.pubsub.publisher.retry.jittered             |                                                              | 抖动确定是否应将延迟时间随机化。                             |
| spring.cloud.gcp.pubsub.publisher.retry.max-attempts         |                                                              | MaxAttempts定义执行的最大尝试次数。如果此值大于0，并且尝试次数达到此限制，则即使总重试时间仍小于TotalTimeout，逻辑也会放弃重试。 |
| spring.cloud.gcp.pubsub.publisher.retry.max-retry-delay-seconds |                                                              | MaxRetryDelay设置了重试延迟的值的限制，以便RetryDelayMultiplier不能将重试延迟增加到大于此数量的值。 |
| spring.cloud.gcp.pubsub.publisher.retry.max-rpc-timeout-seconds |                                                              | MaxRpcTimeout对RPC超时值设置了限制，因此RpcTimeoutMultiplier不能将RPC超时增加到高于此值。 |
| spring.cloud.gcp.pubsub.publisher.retry.retry-delay-multiplier |                                                              | RetryDelayMultiplier控制重试延迟的更改。将前一个呼叫的重试延迟与RetryDelayMultiplier相乘，以计算下一个呼叫的重试延迟。 |
| spring.cloud.gcp.pubsub.publisher.retry.rpc-timeout-multiplier |                                                              | RpcTimeoutMultiplier控制RPC超时的更改。上一个呼叫的超时时间乘以RpcTimeoutMultiplier，以计算下一个呼叫的超时时间。 |
| spring.cloud.gcp.pubsub.publisher.retry.total-timeout-seconds |                                                              | TotalTimeout具有最终控制权，该逻辑应继续尝试远程调用直到完全放弃之前应保持多长时间。总超时时间越高，可以尝试的重试次数越多。 |
| spring.cloud.gcp.pubsub.subscriber.executor-threads          | 4                                                            | 每个订户使用的线程数。                                       |
| spring.cloud.gcp.pubsub.subscriber.flow-control.limit-exceeded-behavior |                                                              | 超过指定限制时的行为。                                       |
| spring.cloud.gcp.pubsub.subscriber.flow-control.max-outstanding-element-count |                                                              | 在执行流控制之前要保留在内存中的未完成元素的最大数量。       |
| spring.cloud.gcp.pubsub.subscriber.flow-control.max-outstanding-request-bytes |                                                              | 强制执行流控制之前要保留在内存中的最大未完成字节数。         |
| spring.cloud.gcp.pubsub.subscriber.max-ack-extension-period  | 0                                                            | 用户工厂的可选最大ack扩展周期（以秒为单位）。                |
| spring.cloud.gcp.pubsub.subscriber.max-acknowledgement-threads | 4                                                            | 用于批处理确认的线程数。                                     |
| spring.cloud.gcp.pubsub.subscriber.parallel-pull-count       |                                                              | 订户工厂的可选并行拉计数设置。                               |
| spring.cloud.gcp.pubsub.subscriber.pull-endpoint             |                                                              | 订户工厂的可选提取端点设置。                                 |
| spring.cloud.gcp.pubsub.subscriber.retry.initial-retry-delay-seconds |                                                              | InitialRetryDelay控制第一次重试之前的延迟。随后的重试将使用根据RetryDelayMultiplier调整的该值。 |
| spring.cloud.gcp.pubsub.subscriber.retry.initial-rpc-timeout-seconds |                                                              | InitialRpcTimeout控制初始RPC的超时。后续调用将使用根据RpcTimeoutMultiplier调整的该值。 |
| spring.cloud.gcp.pubsub.subscriber.retry.jittered            |                                                              | 抖动确定是否应将延迟时间随机化。                             |
| spring.cloud.gcp.pubsub.subscriber.retry.max-attempts        |                                                              | MaxAttempts定义执行的最大尝试次数。如果此值大于0，并且尝试次数达到此限制，则即使总重试时间仍小于TotalTimeout，逻辑也会放弃重试。 |
| spring.cloud.gcp.pubsub.subscriber.retry.max-retry-delay-seconds |                                                              | MaxRetryDelay设置了重试延迟的值的限制，以便RetryDelayMultiplier不能将重试延迟增加到大于此数量的值。 |
| spring.cloud.gcp.pubsub.subscriber.retry.max-rpc-timeout-seconds |                                                              | MaxRpcTimeout对RPC超时值设置了限制，因此RpcTimeoutMultiplier不能将RPC超时增加到高于此值。 |
| spring.cloud.gcp.pubsub.subscriber.retry.retry-delay-multiplier |                                                              | RetryDelayMultiplier控制重试延迟的更改。将前一个呼叫的重试延迟与RetryDelayMultiplier相乘，以计算下一个呼叫的重试延迟。 |
| spring.cloud.gcp.pubsub.subscriber.retry.rpc-timeout-multiplier |                                                              | RpcTimeoutMultiplier控制RPC超时的更改。上一个呼叫的超时时间乘以RpcTimeoutMultiplier，以计算下一个呼叫的超时时间。 |
| spring.cloud.gcp.pubsub.subscriber.retry.total-timeout-seconds |                                                              | TotalTimeout具有最终控制权，该逻辑应继续尝试远程调用直到完全放弃之前应保持多长时间。总超时时间越高，可以尝试的重试次数越多。 |
| spring.cloud.gcp.security.iap.algorithm                      | ES256                                                        | 用于签署JWK令牌的加密算法。                                  |
| spring.cloud.gcp.security.iap.audience                       |                                                              | 非动态受众群体字符串进行验证。                               |
| spring.cloud.gcp.security.iap.enabled                        | true                                                         | 自动配置Google Cloud IAP身份提取组件。                       |
| spring.cloud.gcp.security.iap.header                         | x-goog-iap-jwt-assertion                                     | 从中提取JWK密钥的标头。                                      |
| spring.cloud.gcp.security.iap.issuer                         | https://cloud.google.com/iap                                 | JWK发行人进行验证。                                          |
| spring.cloud.gcp.security.iap.registry                       | https://www.gstatic.com/iap/verify/public_key-jwk            | 链接到JWK公钥注册表。                                        |
| spring.cloud.gcp.spanner.create-interleaved-table-ddl-on-delete-cascade | true                                                         |                                                              |
| spring.cloud.gcp.spanner.credentials.encoded-key             |                                                              |                                                              |
| spring.cloud.gcp.spanner.credentials.location                |                                                              |                                                              |
| spring.cloud.gcp.spanner.credentials.scopes                  |                                                              |                                                              |
| spring.cloud.gcp.spanner.database                            |                                                              |                                                              |
| spring.cloud.gcp.spanner.instance-id                         |                                                              |                                                              |
| spring.cloud.gcp.spanner.keep-alive-interval-minutes         | -1                                                           |                                                              |
| spring.cloud.gcp.spanner.max-idle-sessions                   | -1                                                           |                                                              |
| spring.cloud.gcp.spanner.max-sessions                        | -1                                                           |                                                              |
| spring.cloud.gcp.spanner.min-sessions                        | -1                                                           |                                                              |
| spring.cloud.gcp.spanner.num-rpc-channels                    | -1                                                           |                                                              |
| spring.cloud.gcp.spanner.prefetch-chunks                     | -1                                                           |                                                              |
| spring.cloud.gcp.spanner.project-id                          |                                                              |                                                              |
| spring.cloud.gcp.spanner.write-sessions-fraction             | -1                                                           |                                                              |
| spring.cloud.gcp.sql.credentials                             |                                                              | 覆盖核心模块中指定的GCP OAuth2凭据。                         |
| spring.cloud.gcp.sql.database-name                           |                                                              | Cloud SQL实例中的数据库名称。                                |
| spring.cloud.gcp.sql.enabled                                 | true                                                         | 自动配置Google Cloud SQL支持组件。                           |
| spring.cloud.gcp.sql.instance-connection-name                |                                                              | Cloud SQL实例连接名称。[GCP_PROJECT_ID]：[INSTANCE_REGION]：[INSTANCE_NAME]。 |
| spring.cloud.gcp.storage.auto-create-files                   |                                                              |                                                              |
| spring.cloud.gcp.storage.credentials.encoded-key             |                                                              |                                                              |
| spring.cloud.gcp.storage.credentials.location                |                                                              |                                                              |
| spring.cloud.gcp.storage.credentials.scopes                  |                                                              |                                                              |
| spring.cloud.gcp.storage.enabled                             | true                                                         | 自动配置Google Cloud Storage组件。                           |
| spring.cloud.gcp.trace.authority                             |                                                              | 通道声称要连接的HTTP / 2权限。                               |
| spring.cloud.gcp.trace.compression                           |                                                              | 用于呼叫的压缩。                                             |
| spring.cloud.gcp.trace.credentials.encoded-key               |                                                              |                                                              |
| spring.cloud.gcp.trace.credentials.location                  |                                                              |                                                              |
| spring.cloud.gcp.trace.credentials.scopes                    |                                                              |                                                              |
| spring.cloud.gcp.trace.deadline-ms                           |                                                              | 通话截止时间。                                               |
| spring.cloud.gcp.trace.enabled                               | true                                                         | 自动配置Google Cloud Stackdriver跟踪组件。                   |
| spring.cloud.gcp.trace.max-inbound-size                      |                                                              | 入站邮件的最大大小。                                         |
| spring.cloud.gcp.trace.max-outbound-size                     |                                                              | 出站邮件的最大大小。                                         |
| spring.cloud.gcp.trace.message-timeout                       |                                                              | 待处理的spans之前的超时（以秒为单位）将被批量发送到GCP Stackdriver Trace。 |
| spring.cloud.gcp.trace.num-executor-threads                  | 4                                                            | 跟踪执行程序使用的线程数。                                   |
| spring.cloud.gcp.trace.project-id                            |                                                              | 覆盖Core模块中指定的GCP项目ID。                              |
| spring.cloud.gcp.trace.wait-for-ready                        |                                                              | 如果出现瞬态故障，请等待通道准备就绪。在这种情况下，默认为快速失败。 |
| spring.cloud.gcp.vision.credentials.encoded-key              |                                                              |                                                              |
| spring.cloud.gcp.vision.credentials.location                 |                                                              |                                                              |
| spring.cloud.gcp.vision.credentials.scopes                   |                                                              |                                                              |
| spring.cloud.gcp.vision.enabled                              | true                                                         | 自动配置Google Cloud Vision组件。                            |
| spring.cloud.httpclientfactories.apache.enabled              | true                                                         | 启用创建Apache Http Client工厂beans的功能。                  |
| spring.cloud.httpclientfactories.ok.enabled                  | true                                                         | 启用OK Http客户端工厂beans的创建。                           |
| spring.cloud.hypermedia.refresh.fixed-delay                  | 5000                                                         |                                                              |
| spring.cloud.hypermedia.refresh.initial-delay                | 10000                                                        |                                                              |
| spring.cloud.inetutils.default-hostname                      | localhost                                                    | 默认主机名。发生错误时使用。                                 |
| spring.cloud.inetutils.default-ip-address                    | 127.0.0.1                                                    | 默认IP地址。发生错误时使用。                                 |
| spring.cloud.inetutils.ignored-interfaces                    |                                                              | 网络接口的Java正则表达式列表，将被忽略。                     |
| spring.cloud.inetutils.preferred-networks                    |                                                              | 首选网络地址的Java正则表达式列表。                           |
| spring.cloud.inetutils.timeout-seconds                       | 1                                                            | 超时（以秒为单位），用于计算主机名。                         |
| spring.cloud.inetutils.use-only-site-local-interfaces        | false                                                        | 是否仅使用具有站点本地地址的接口。有关更多详细信息，请参见{@link InetAddress＃isSiteLocalAddress（）}。 |
| spring.cloud.kubernetes.client.api-version                   |                                                              |                                                              |
| spring.cloud.kubernetes.client.apiVersion                    | v1                                                           | Kubernetes API版本                                           |
| spring.cloud.kubernetes.client.ca-cert-data                  |                                                              |                                                              |
| spring.cloud.kubernetes.client.ca-cert-file                  |                                                              |                                                              |
| spring.cloud.kubernetes.client.caCertData                    |                                                              | Kubernetes API CACertData                                    |
| spring.cloud.kubernetes.client.caCertFile                    |                                                              | Kubernetes API CACertFile                                    |
| spring.cloud.kubernetes.client.client-cert-data              |                                                              |                                                              |
| spring.cloud.kubernetes.client.client-cert-file              |                                                              |                                                              |
| spring.cloud.kubernetes.client.client-key-algo               |                                                              |                                                              |
| spring.cloud.kubernetes.client.client-key-data               |                                                              |                                                              |
| spring.cloud.kubernetes.client.client-key-file               |                                                              |                                                              |
| spring.cloud.kubernetes.client.client-key-passphrase         |                                                              |                                                              |
| spring.cloud.kubernetes.client.clientCertData                |                                                              | Kubernetes API ClientCertData                                |
| spring.cloud.kubernetes.client.clientCertFile                |                                                              | Kubernetes API ClientCertFile                                |
| spring.cloud.kubernetes.client.clientKeyAlgo                 | RSA                                                          | Kubernetes API ClientKeyAlgo                                 |
| spring.cloud.kubernetes.client.clientKeyData                 |                                                              | Kubernetes API ClientKeyData                                 |
| spring.cloud.kubernetes.client.clientKeyFile                 |                                                              | Kubernetes API ClientKeyFile                                 |
| spring.cloud.kubernetes.client.clientKeyPassphrase           | changeit                                                     | Kubernetes API ClientKeyPassphrase                           |
| spring.cloud.kubernetes.client.connection-timeout            |                                                              |                                                              |
| spring.cloud.kubernetes.client.connectionTimeout             | 10s                                                          | 连接超时                                                     |
| spring.cloud.kubernetes.client.http-proxy                    |                                                              |                                                              |
| spring.cloud.kubernetes.client.https-proxy                   |                                                              |                                                              |
| spring.cloud.kubernetes.client.logging-interval              |                                                              |                                                              |
| spring.cloud.kubernetes.client.loggingInterval               | 20s                                                          | 记录间隔                                                     |
| spring.cloud.kubernetes.client.master-url                    |                                                              |                                                              |
| spring.cloud.kubernetes.client.masterUrl                     | [https://kubernetes.default.svc](https://kubernetes.default.svc/) | Kubernetes API主节点URL                                      |
| spring.cloud.kubernetes.client.namespace                     | true                                                         | Kubernetes命名空间                                           |
| spring.cloud.kubernetes.client.no-proxy                      |                                                              |                                                              |
| spring.cloud.kubernetes.client.password                      |                                                              | Kubernetes API密码                                           |
| spring.cloud.kubernetes.client.proxy-password                |                                                              |                                                              |
| spring.cloud.kubernetes.client.proxy-username                |                                                              |                                                              |
| spring.cloud.kubernetes.client.request-timeout               |                                                              |                                                              |
| spring.cloud.kubernetes.client.requestTimeout                | 10s                                                          | 请求超时                                                     |
| spring.cloud.kubernetes.client.rolling-timeout               |                                                              |                                                              |
| spring.cloud.kubernetes.client.rollingTimeout                | 900s                                                         | 滚动超时                                                     |
| spring.cloud.kubernetes.client.trust-certs                   |                                                              |                                                              |
| spring.cloud.kubernetes.client.trustCerts                    | false                                                        | Kubernetes API信任证书                                       |
| spring.cloud.kubernetes.client.username                      |                                                              | Kubernetes API用户名                                         |
| spring.cloud.kubernetes.client.watch-reconnect-interval      |                                                              |                                                              |
| spring.cloud.kubernetes.client.watch-reconnect-limit         |                                                              |                                                              |
| spring.cloud.kubernetes.client.watchReconnectInterval        | 1s                                                           | 重新连接间隔                                                 |
| spring.cloud.kubernetes.client.watchReconnectLimit           | -1                                                           | 重新连接间隔限制重试                                         |
| spring.cloud.kubernetes.config.enable-api                    | true                                                         |                                                              |
| spring.cloud.kubernetes.config.enabled                       | true                                                         | 启用ConfigMap属性源定位器。                                  |
| spring.cloud.kubernetes.config.name                          |                                                              |                                                              |
| spring.cloud.kubernetes.config.namespace                     |                                                              |                                                              |
| spring.cloud.kubernetes.config.paths                         |                                                              |                                                              |
| spring.cloud.kubernetes.config.sources                       |                                                              |                                                              |
| spring.cloud.kubernetes.reload.enabled                       | false                                                        | 在更改时启用Kubernetes配置重新加载。                         |
| spring.cloud.kubernetes.reload.mode                          |                                                              | 设置Kubernetes配置重新加载的检测模式。                       |
| spring.cloud.kubernetes.reload.monitoring-config-maps        | true                                                         | 启用对配置映射的监视以检测更改。                             |
| spring.cloud.kubernetes.reload.monitoring-secrets            | false                                                        | 启用对机密的监视以检测更改。                                 |
| spring.cloud.kubernetes.reload.period                        | 15000ms                                                      | 设置检测模式为“轮询”时使用的轮询周期。                       |
| spring.cloud.kubernetes.reload.strategy                      |                                                              | 设置Kubernetes更改时重新加载配置的重新加载策略。             |
| spring.cloud.kubernetes.secrets.enable-api                   | false                                                        |                                                              |
| spring.cloud.kubernetes.secrets.enabled                      | true                                                         | 启用Secrets属性源定位器。                                    |
| spring.cloud.kubernetes.secrets.labels                       |                                                              |                                                              |
| spring.cloud.kubernetes.secrets.name                         |                                                              |                                                              |
| spring.cloud.kubernetes.secrets.namespace                    |                                                              |                                                              |
| spring.cloud.kubernetes.secrets.paths                        |                                                              |                                                              |
| spring.cloud.loadbalancer.retry.enabled                      | true                                                         |                                                              |
| spring.cloud.refresh.enabled                                 | true                                                         | 为刷新范围和相关功能启用自动配置。                           |
| spring.cloud.refresh.extra-refreshable                       | true                                                         | beans的其他类名称，用于将进程发布到刷新范围。                |
| spring.cloud.service-registry.auto-registration.enabled      | true                                                         | 是否启用服务自动注册。默认为true。                           |
| spring.cloud.service-registry.auto-registration.fail-fast    | false                                                        | 如果没有AutoServiceRegistration，启动是否失败。默认为false。 |
| spring.cloud.service-registry.auto-registration.register-management | true                                                         | 是否将管理注册为服务。默认为true。                           |
| spring.cloud.stream.binders                                  |                                                              | 如果使用了多个相同类型的绑定器（即，连接到RabbitMq的多个实例），则附加的每个绑定器属性（请参阅{@link BinderProperties}）。在这里，您可以指定多个活页夹配置，每个配置具有不同的环境设置。例如; spring.cloud.stream.binders.rabbit1.environment。..，spring.cloud.stream.binders.rabbit2.environment。.. |
| spring.cloud.stream.binding-retry-interval                   | 30                                                           | 用于计划绑定尝试的重试间隔（以秒为单位）。默认值：30秒。     |
| spring.cloud.stream.bindings                                 |                                                              | 每个绑定名称（例如，“输入”）的其他绑定属性（请参见{@link BinderProperties}）。例如; 这将设置Sink应用程序的“输入”绑定的内容类型：“ spring.cloud.stream.bindings.input.contentType = text / plain” |
| spring.cloud.stream.consul.binder.event-timeout              | 5                                                            |                                                              |
| spring.cloud.stream.default-binder                           |                                                              | 在有多个可用绑定程序（例如“兔子”）的情况下，所有绑定使用的绑定程序的名称。 |
| spring.cloud.stream.dynamic-destinations                     | []                                                           | 可以动态绑定的目的地列表。如果设置，则只能绑定列出的目的地。 |
| spring.cloud.stream.function.definition                      |                                                              | 绑定功能的定义。如果需要将多个功能组合为一个，请使用管道（例如'fooFunc \ \| barFunc'） |
| spring.cloud.stream.instance-count                           | 1                                                            | 应用程序已部署实例的数量。默认值：1。注意：还可以按单个绑定“ spring.cloud.stream.bindings.foo.consumer.instance-count”进行管理，其中“ foo”是绑定的名称。 |
| spring.cloud.stream.instance-index                           | 0                                                            | 应用程序的实例ID：从0到instanceCount-1的数字。用于分区和Kafka。注意：也可以按每个单独的绑定“ spring.cloud.stream.bindings.foo.consumer.instance-index”进行管理，其中“ foo”是绑定的名称。 |
| spring.cloud.stream.integration.message-handler-not-propagated-headers |                                                              | 不会从入站邮件复制的邮件标题名称。                           |
| spring.cloud.stream.kafka.binder.auto-add-partitions         | false                                                        |                                                              |
| spring.cloud.stream.kafka.binder.auto-create-topics          | true                                                         |                                                              |
| spring.cloud.stream.kafka.binder.brokers                     | [localhost]                                                  |                                                              |
| spring.cloud.stream.kafka.binder.configuration               |                                                              | 适用于生产者和消费者的任意kafka属性。                        |
| spring.cloud.stream.kafka.binder.consumer-properties         |                                                              | 任意的kafka消费者属性。                                      |
| spring.cloud.stream.kafka.binder.fetch-size                  | 0                                                            |                                                              |
| spring.cloud.stream.kafka.binder.header-mapper-bean-name     |                                                              | 要使用的自定义标头映射器的bean名称代替{@link org.springframework.kafka.support.DefaultKafkaHeaderMapper}。 |
| spring.cloud.stream.kafka.binder.headers                     | []                                                           |                                                              |
| spring.cloud.stream.kafka.binder.health-timeout              | 60                                                           | 等待获取分区信息的时间（以秒为单位）；默认值60。             |
| spring.cloud.stream.kafka.binder.jaas                        |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.max-wait                    | 100                                                          |                                                              |
| spring.cloud.stream.kafka.binder.min-partition-count         | 1                                                            |                                                              |
| spring.cloud.stream.kafka.binder.offset-update-count         | 0                                                            |                                                              |
| spring.cloud.stream.kafka.binder.offset-update-shutdown-timeout | 2000                                                         |                                                              |
| spring.cloud.stream.kafka.binder.offset-update-time-window   | 10000                                                        |                                                              |
| spring.cloud.stream.kafka.binder.producer-properties         |                                                              | 任意的Kafka生产者属性。                                      |
| spring.cloud.stream.kafka.binder.queue-size                  | 8192                                                         |                                                              |
| spring.cloud.stream.kafka.binder.replication-factor          | 1                                                            |                                                              |
| spring.cloud.stream.kafka.binder.required-acks               | 1                                                            |                                                              |
| spring.cloud.stream.kafka.binder.socket-buffer-size          | 2097152                                                      |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.admin  |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.batch-timeout |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.buffer-size |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.compression-type |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.configuration |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.error-channel-enabled |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.header-mode |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.header-patterns |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.message-key-expression |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.partition-count |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.partition-key-expression |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.partition-key-extractor-name |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.partition-selector-expression |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.partition-selector-name |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.required-groups |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.sync   |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.topic  |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.producer.use-native-encoding |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.transaction.transaction-id-prefix |                                                              |                                                              |
| spring.cloud.stream.kafka.binder.zk-connection-timeout       | 10000                                                        | ZK连接超时（以毫秒为单位）。                                 |
| spring.cloud.stream.kafka.binder.zk-nodes                    | [localhost]                                                  |                                                              |
| spring.cloud.stream.kafka.binder.zk-session-timeout          | 10000                                                        | ZK会话超时（以毫秒为单位）。                                 |
| spring.cloud.stream.kafka.bindings                           |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.application-id      |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.auto-add-partitions |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.auto-create-topics  |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.brokers             |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.configuration       |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.consumer-properties |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.fetch-size          |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.header-mapper-bean-name |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.headers             |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.health-timeout      |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.jaas                |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.max-wait            |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.min-partition-count |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.offset-update-count |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.offset-update-shutdown-timeout |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.offset-update-time-window |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.producer-properties |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.queue-size          |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.replication-factor  |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.required-acks       |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.serde-error         |                                                              | {@link org.apache.kafka.streams.errors.DeserializationExceptionHandler}在出现Serde错误时使用。{@link KafkaStreamsBinderConfigurationProperties.SerdeError}值用于在使用者绑定上提供异常处理程序。 |
| spring.cloud.stream.kafka.streams.binder.socket-buffer-size  |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.zk-connection-timeout |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.zk-nodes            |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.binder.zk-session-timeout  |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.bindings                   |                                                              |                                                              |
| spring.cloud.stream.kafka.streams.time-window.advance-by     | 0                                                            |                                                              |
| spring.cloud.stream.kafka.streams.time-window.length         | 0                                                            |                                                              |
| spring.cloud.stream.metrics.export-properties                |                                                              | 将附加到每条消息的属性列表。上下文刷新后，将由onApplicationEvent填充，以避免按消息进行操作的开销。 |
| spring.cloud.stream.metrics.key                              |                                                              | 发出的度量标准的名称。应为每个应用程序的唯一值。默认值为：$ {spring.application.name：$ {vcap.application.name:${spring.config.name:application}}}}。 |
| spring.cloud.stream.metrics.meter-filter                     |                                                              | 控制要捕获的“仪表”的模式。默认情况下，将捕获所有“仪表”。例如，“ spring.integration。*”将仅捕获名称以“ spring.integration”开头的仪表的度量信息。 |
| spring.cloud.stream.metrics.properties                       |                                                              | 应添加到度量有效负载的应用程序属性，例如：`spring.application**`。 |
| spring.cloud.stream.metrics.schedule-interval                | 60s                                                          | 时间间隔，表示为计划指标快照发布的持续时间。默认为60秒       |
| spring.cloud.stream.override-cloud-connectors                | false                                                        | 仅当云配置文件处于活动状态并且应用程序提供了Spring Cloud Connectors时，此属性才适用。如果该属性为false（默认值），则绑定器检测到合适的绑定服务（例如，对于RabbitMQ绑定器，在Cloud Foundry中绑定的RabbitMQ服务）并将其用于创建连接（通常通过Spring Cloud Connectors）。设置为true时，此属性指示绑定程序完全忽略绑定的服务，并依赖于Spring Boot属性（例如，依赖于环境中为RabbitMQ绑定程序提供的spring.rabbitmq。*属性）。连接到多个系统时，此属性的典型用法是嵌套在自定义环境中。 |
| spring.cloud.stream.rabbit.binder.admin-addresses            | []                                                           | 要求管理插件；只需要队列亲缘关系。                           |
| spring.cloud.stream.rabbit.binder.admin-adresses             |                                                              |                                                              |
| spring.cloud.stream.rabbit.binder.compression-level          | 0                                                            | 压缩绑定的压缩级别；参见“ java.util.zip.Deflator”。          |
| spring.cloud.stream.rabbit.binder.connection-name-prefix     |                                                              | 此活页夹中连接名称的前缀。                                   |
| spring.cloud.stream.rabbit.binder.nodes                      | []                                                           | 集群成员节点名称；只需要队列亲缘关系。                       |
| spring.cloud.stream.rabbit.bindings                          |                                                              |                                                              |
| spring.cloud.stream.schema-registry-client.cached            | false                                                        |                                                              |
| spring.cloud.stream.schema-registry-client.endpoint          |                                                              |                                                              |
| spring.cloud.stream.schema.avro.dynamic-schema-generation-enabled | false                                                        |                                                              |
| spring.cloud.stream.schema.avro.prefix                       | vnd                                                          |                                                              |
| spring.cloud.stream.schema.avro.reader-schema                |                                                              |                                                              |
| spring.cloud.stream.schema.avro.schema-imports               |                                                              | 首先应加载的文件或目录的列表，从而使它们可以由后续架构导入。请注意，导入的文件不应相互引用。@参数 |
| spring.cloud.stream.schema.avro.schema-locations             |                                                              | Apache Avro模式的源目录。此转换器使用此模式。如果此架构依赖于其他架构，请考虑在{@link #schemaImports} @parameter中定义那些相关的架构 |
| spring.cloud.stream.schema.server.allow-schema-deletion      | false                                                        | 布尔标记，用于启用/禁用模式删除。                            |
| spring.cloud.stream.schema.server.path                       |                                                              | 配置资源路径的前缀（默认为空）。当您不想更改上下文路径或servlet路径时，在嵌入另一个应用程序时很有用。 |
| spring.cloud.task.batch.command-line-runner-order            | 0                                                            | {@code spring.cloud.task.batch.fail-on-job-failure = true}时，用于运行批处理作业的{@code CommandLineRunner}的顺序。默认为0（与{@link org.springframework.boot.autoconfigure.batch.JobLauncherCommandLineRunner}相同）。 |
| spring.cloud.task.batch.events.chunk-order                   |                                                              | Properties用于块侦听器顺序                                   |
| spring.cloud.task.batch.events.chunk.enabled                 | true                                                         | 此属性用于确定任务是否应侦听批处理块事件。                   |
| spring.cloud.task.batch.events.enabled                       | true                                                         | 此属性用于确定任务是否应侦听批处理事件。                     |
| spring.cloud.task.batch.events.item-process-order            |                                                              | Properties用于itemProcess侦听器顺序                          |
| spring.cloud.task.batch.events.item-process.enabled          | true                                                         | 此属性用于确定任务是否应侦听批处理项目处理的事件。           |
| spring.cloud.task.batch.events.item-read-order               |                                                              | Properties用于itemRead侦听器顺序                             |
| spring.cloud.task.batch.events.item-read.enabled             | true                                                         | 此属性用于确定任务是否应侦听批处理项目读取事件。             |
| spring.cloud.task.batch.events.item-write-order              |                                                              | Properties用于itemWrite侦听器顺序                            |
| spring.cloud.task.batch.events.item-write.enabled            | true                                                         | 此属性用于确定任务是否应侦听批处理项目写入事件。             |
| spring.cloud.task.batch.events.job-execution-order           |                                                              | Properties用于jobExecution侦听器顺序                         |
| spring.cloud.task.batch.events.job-execution.enabled         | true                                                         | 此属性用于确定任务是否应侦听批处理作业执行事件。             |
| spring.cloud.task.batch.events.skip-order                    |                                                              | Properties用于跳过侦听器顺序                                 |
| spring.cloud.task.batch.events.skip.enabled                  | true                                                         | 此属性用于确定任务是否应侦听批处理跳过事件。                 |
| spring.cloud.task.batch.events.step-execution-order          |                                                              | Properties用于stepExecution侦听器顺序                        |
| spring.cloud.task.batch.events.step-execution.enabled        | true                                                         | 此属性用于确定任务是否应侦听批处理步骤执行事件。             |
| spring.cloud.task.batch.fail-on-job-failure                  | false                                                        | 此属性用于确定如果批处理作业失败，任务应用程序是否应返回非零退出代码。 |
| spring.cloud.task.batch.fail-on-job-failure-poll-interval    | 5000                                                         | 固定的毫秒数延迟，当spring.cloud.task.batch.failOnJobFailure设置为true时，Spring Cloud Task将在检查{@link org.springframework.batch.core.JobExecution}是否完成时等待的毫秒数。默认为5000 |
| spring.cloud.task.batch.job-names                            |                                                              | 以逗号分隔的作业名称列表，用于在启动时执行（例如，`job1,job2`）。默认情况下，将执行在上下文中找到的所有作业。 |
| spring.cloud.task.batch.listener.enabled                     | true                                                         | 此属性用于确定任务是否将链接到正在运行的批处理作业。         |
| spring.cloud.task.closecontext-enabled                       | false                                                        | 设置为true时，上下文在任务结束时关闭。否则上下文仍然是开放的。 |
| spring.cloud.task.events.enabled                             | true                                                         | 此属性用于确定任务应用程序是否应发出任务事件。               |
| spring.cloud.task.executionid                                |                                                              | 更新任务执行时任务将使用的ID。                               |
| spring.cloud.task.external-execution-id                      |                                                              | 可以与任务相关联的ID。                                       |
| spring.cloud.task.parent-execution-id                        |                                                              | 启动此任务执行的父任务执行ID的ID。如果任务执行没有父级，则默认为null。 |
| spring.cloud.task.single-instance-enabled                    | false                                                        | 此属性用于确定如果正在运行具有相同应用程序名称的另一个任务，则该任务是否将执行。 |
| spring.cloud.task.single-instance-lock-check-interval        | 500                                                          | 声明任务执行将在两次检查之间等待的时间（以毫秒为单位）。默认时间是：500毫秒。 |
| spring.cloud.task.single-instance-lock-ttl                   |                                                              | 声明当启用单实例设置为true时，任务执行可以保持锁定以防止另一个任务使用特定任务名称执行的最长时间（以毫秒为单位）。默认时间是：Integer.MAX_VALUE。 |
| spring.cloud.task.table-prefix                               | TASK_                                                        | 要附加到由Spring Cloud Task创建的表名称的前缀。              |
| spring.cloud.util.enabled                                    | true                                                         | 启用创建Spring Cloud实用程序beans的功能。                    |
| spring.cloud.vault.app-id.app-id-path                        | app-id                                                       | AppId身份验证后端的安装路径。                                |
| spring.cloud.vault.app-id.network-interface                  |                                                              | “ MAC_ADDRESS” UserId机制的网络接口提示。                    |
| spring.cloud.vault.app-id.user-id                            | MAC_ADDRESS                                                  | UserId机制。可以是“ MAC_ADDRESS”，“ IP_ADDRESS”，字符串或类名。 |
| spring.cloud.vault.app-role.app-role-path                    | approle                                                      | AppRole身份验证后端的安装路径。                              |
| spring.cloud.vault.app-role.role                             |                                                              | 角色名称，可选，用于拉模式。                                 |
| spring.cloud.vault.app-role.role-id                          |                                                              | RoleId。                                                     |
| spring.cloud.vault.app-role.secret-id                        |                                                              | SecretId。                                                   |
| spring.cloud.vault.application-name                          | application                                                  | AppId身份验证的应用程序名称。                                |
| spring.cloud.vault.authentication                            |                                                              |                                                              |
| spring.cloud.vault.aws-ec2.aws-ec2-path                      | aws-ec2                                                      | AWS-EC2身份验证后端的安装路径。                              |
| spring.cloud.vault.aws-ec2.identity-document                 | http://169.254.169.254/latest/dynamic/instance-identity/pkcs7 | AWS-EC2 PKCS7身份文档的URL。                                 |
| spring.cloud.vault.aws-ec2.nonce                             |                                                              | 立即用于AWS-EC2身份验证。空随机数默认为随机数生成。          |
| spring.cloud.vault.aws-ec2.role                              |                                                              | 角色名称，可选。                                             |
| spring.cloud.vault.aws-iam.aws-path                          | aws                                                          | AWS身份验证后端的安装路径。                                  |
| spring.cloud.vault.aws-iam.role                              |                                                              | 角色名称，可选。如果未设置，则默认为友好的IAM名称。          |
| spring.cloud.vault.aws-iam.server-name                       |                                                              | 用于在登录请求的标头中设置{@code X- Vault-AWS-IAM-Server-ID}标头的服务器的名称。 |
| spring.cloud.vault.aws.access-key-property                   | cloud.aws.credentials.accessKey                              | 获得的访问密钥的目标属性。                                   |
| spring.cloud.vault.aws.backend                               | aws                                                          | aws后端路径。                                                |
| spring.cloud.vault.aws.enabled                               | false                                                        | 启用AWS后端使用。                                            |
| spring.cloud.vault.aws.role                                  |                                                              | 凭证的角色名称。                                             |
| spring.cloud.vault.aws.secret-key-property                   | cloud.aws.credentials.secretKey                              | 获得的密钥的目标属性。                                       |
| spring.cloud.vault.azure-msi.azure-path                      | azure                                                        | Azure MSI身份验证后端的安装路径。                            |
| spring.cloud.vault.azure-msi.role                            |                                                              | 角色名称。                                                   |
| spring.cloud.vault.cassandra.backend                         | cassandra                                                    | Cassandra后端路径。                                          |
| spring.cloud.vault.cassandra.enabled                         | false                                                        | 启用cassandra后端使用。                                      |
| spring.cloud.vault.cassandra.password-property               | spring.data.cassandra.password                               | 获得的密码的目标属性。                                       |
| spring.cloud.vault.cassandra.role                            |                                                              | 凭证的角色名称。                                             |
| spring.cloud.vault.cassandra.username-property               | spring.data.cassandra.username                               | 获得的用户名的目标属性。                                     |
| spring.cloud.vault.config.lifecycle.enabled                  | true                                                         | 启用生命周期管理。                                           |
| spring.cloud.vault.config.order                              | 0                                                            | 用于设置{@link org.springframework.core.env.PropertySource}优先级。可以使用Vault作为其他属性源的替代。@see org.springframework.core.PriorityOrdered |
| spring.cloud.vault.connection-timeout                        | 5000                                                         | 连接超时。                                                   |
| spring.cloud.vault.consul.backend                            | consul                                                       | Consul后端路径。                                             |
| spring.cloud.vault.consul.enabled                            | false                                                        | 启用consul后端使用。                                         |
| spring.cloud.vault.consul.role                               |                                                              | 凭证的角色名称。                                             |
| spring.cloud.vault.consul.token-property                     | spring.cloud.consul.token                                    | 获得的令牌的目标属性。                                       |
| spring.cloud.vault.database.backend                          | database                                                     | 数据库后端路径。                                             |
| spring.cloud.vault.database.enabled                          | false                                                        | 启用数据库后端使用。                                         |
| spring.cloud.vault.database.password-property                | spring.datasource.password                                   | 获得的密码的目标属性。                                       |
| spring.cloud.vault.database.role                             |                                                              | 凭证的角色名称。                                             |
| spring.cloud.vault.database.username-property                | spring.datasource.username                                   | 获得的用户名的目标属性。                                     |
| spring.cloud.vault.discovery.enabled                         | false                                                        | 指示启用Vault服务器发现的标志（将通过发现查找Vault服务器URL）。 |
| spring.cloud.vault.discovery.service-id                      | vault                                                        | 服务编号以找到Vault。                                        |
| spring.cloud.vault.enabled                                   | true                                                         | 启用Vault配置服务器。                                        |
| spring.cloud.vault.fail-fast                                 | false                                                        | 如果无法从Vault获取数据，则快速失败。                        |
| spring.cloud.vault.gcp-gce.gcp-path                          | gcp                                                          | Kubernetes身份验证后端的安装路径。                           |
| spring.cloud.vault.gcp-gce.role                              |                                                              | 尝试登录的角色名称。                                         |
| spring.cloud.vault.gcp-gce.service-account                   |                                                              | 可选服务帐户ID。如果未配置，则使用默认ID。                   |
| spring.cloud.vault.gcp-iam.credentials.encoded-key           |                                                              | OAuth2帐户私钥的base64编码内容，格式为JSON。                 |
| spring.cloud.vault.gcp-iam.credentials.location              |                                                              | OAuth2凭证私钥的位置。<p>由于这是资源，因此私钥可以位于多个位置，例如本地文件系统，类路径，URL等。 |
| spring.cloud.vault.gcp-iam.gcp-path                          | gcp                                                          | Kubernetes身份验证后端的安装路径。                           |
| spring.cloud.vault.gcp-iam.jwt-validity                      | 15m                                                          | JWT令牌的有效性。                                            |
| spring.cloud.vault.gcp-iam.project-id                        |                                                              | 覆盖GCP项目ID。                                              |
| spring.cloud.vault.gcp-iam.role                              |                                                              | 尝试登录的角色名称。                                         |
| spring.cloud.vault.gcp-iam.service-account-id                |                                                              | 覆盖GCP服务帐户ID。                                          |
| spring.cloud.vault.generic.application-name                  | application                                                  | 用于上下文的应用程序名称。                                   |
| spring.cloud.vault.generic.backend                           | secret                                                       | 默认后端的名称。                                             |
| spring.cloud.vault.generic.default-context                   | application                                                  | 默认上下文的名称。                                           |
| spring.cloud.vault.generic.enabled                           | true                                                         | 启用通用后端。                                               |
| spring.cloud.vault.generic.profile-separator                 | /                                                            | 配置文件分隔符以组合应用程序名称和配置文件。                 |
| spring.cloud.vault.host                                      | localhost                                                    | Vault服务器主机。                                            |
| spring.cloud.vault.kubernetes.kubernetes-path                | kubernetes                                                   | Kubernetes身份验证后端的安装路径。                           |
| spring.cloud.vault.kubernetes.role                           |                                                              | 尝试登录的角色名称。                                         |
| spring.cloud.vault.kubernetes.service-account-token-file     | /var/run/secrets/kubernetes.io/serviceaccount/token          | 服务帐户令牌文件的路径。                                     |
| spring.cloud.vault.kv.application-name                       | application                                                  | 用于上下文的应用程序名称。                                   |
| spring.cloud.vault.kv.backend                                | secret                                                       | 默认后端的名称。                                             |
| spring.cloud.vault.kv.backend-version                        | 2                                                            | 键值后端版本。当前支持的版本是：<ul> <li>版本1（未版本化键值后端）。</ li> <li>版本2（已版本化键值后端）。</ li> </ ul> |
| spring.cloud.vault.kv.default-context                        | application                                                  | 默认上下文的名称。                                           |
| spring.cloud.vault.kv.enabled                                | false                                                        | 启用kev-value后端。                                          |
| spring.cloud.vault.kv.profile-separator                      | /                                                            | 配置文件分隔符以组合应用程序名称和配置文件。                 |
| spring.cloud.vault.mongodb.backend                           | mongodb                                                      | Cassandra后端路径。                                          |
| spring.cloud.vault.mongodb.enabled                           | false                                                        | 启用mongodb后端使用。                                        |
| spring.cloud.vault.mongodb.password-property                 | spring.data.mongodb.password                                 | 获得的密码的目标属性。                                       |
| spring.cloud.vault.mongodb.role                              |                                                              | 凭证的角色名称。                                             |
| spring.cloud.vault.mongodb.username-property                 | spring.data.mongodb.username                                 | 获得的用户名的目标属性。                                     |
| spring.cloud.vault.mysql.backend                             | mysql                                                        | mysql后端路径。                                              |
| spring.cloud.vault.mysql.enabled                             | false                                                        | 启用mysql后端用法。                                          |
| spring.cloud.vault.mysql.password-property                   | spring.datasource.password                                   | 获得的用户名的目标属性。                                     |
| spring.cloud.vault.mysql.role                                |                                                              | 凭证的角色名称。                                             |
| spring.cloud.vault.mysql.username-property                   | spring.datasource.username                                   | 获得的用户名的目标属性。                                     |
| spring.cloud.vault.port                                      | 8200                                                         | Vault服务器端口。                                            |
| spring.cloud.vault.postgresql.backend                        | postgresql                                                   | PostgreSQL后端路径。                                         |
| spring.cloud.vault.postgresql.enabled                        | false                                                        | 启用postgresql后端使用。                                     |
| spring.cloud.vault.postgresql.password-property              | spring.datasource.password                                   | 获得的用户名的目标属性。                                     |
| spring.cloud.vault.postgresql.role                           |                                                              | 凭证的角色名称。                                             |
| spring.cloud.vault.postgresql.username-property              | spring.datasource.username                                   | 获得的用户名的目标属性。                                     |
| spring.cloud.vault.rabbitmq.backend                          | rabbitmq                                                     | rabbitmq后端路径。                                           |
| spring.cloud.vault.rabbitmq.enabled                          | false                                                        | 启用rabbitmq后端使用。                                       |
| spring.cloud.vault.rabbitmq.password-property                | spring.rabbitmq.password                                     | 获得的密码的目标属性。                                       |
| spring.cloud.vault.rabbitmq.role                             |                                                              | 凭证的角色名称。                                             |
| spring.cloud.vault.rabbitmq.username-property                | spring.rabbitmq.username                                     | 获得的用户名的目标属性。                                     |
| spring.cloud.vault.read-timeout                              | 15000                                                        | 读取超时。                                                   |
| spring.cloud.vault.scheme                                    | https                                                        | 协议方案。可以是“ http”或“ https”。                          |
| spring.cloud.vault.ssl.cert-auth-path                        | cert                                                         | TLS证书认证后端的安装路径。                                  |
| spring.cloud.vault.ssl.key-store                             |                                                              | 拥有证书和私钥的信任库。                                     |
| spring.cloud.vault.ssl.key-store-password                    |                                                              | 用于访问密钥库的密码。                                       |
| spring.cloud.vault.ssl.trust-store                           |                                                              | 拥有SSL证书的信任库。                                        |
| spring.cloud.vault.ssl.trust-store-password                  |                                                              | 用于访问信任库的密码。                                       |
| spring.cloud.vault.token                                     |                                                              | 静态库令牌。如果{@link #authentication}是{@code TOKEN}，则为必填项。 |
| spring.cloud.vault.uri                                       |                                                              | Vault URI。可以设置方案，主机和端口。                        |
| spring.cloud.zookeeper.base-sleep-time-ms                    | 50                                                           | 重试之间等待的初始时间。                                     |
| spring.cloud.zookeeper.block-until-connected-unit            |                                                              | 时间单位与与Zookeeper的连接阻塞有关。                        |
| spring.cloud.zookeeper.block-until-connected-wait            | 10                                                           | 等待时间来阻止与Zookeeper的连接。                            |
| spring.cloud.zookeeper.connect-string                        | localhost:2181                                               | Zookeeper群集的连接字符串。                                  |
| spring.cloud.zookeeper.default-health-endpoint               |                                                              | 将检查默认健康状况终结点以验证依赖项是否仍然存在。           |
| spring.cloud.zookeeper.dependencies                          |                                                              | 别名到ZookeeperDependency的映射。从Ribbon角度来看，别名实际上是serviceID，因为Ribbon无法接受serviceID中的嵌套结构。 |
| spring.cloud.zookeeper.dependency-configurations             |                                                              |                                                              |
| spring.cloud.zookeeper.dependency-names                      |                                                              |                                                              |
| spring.cloud.zookeeper.discovery.enabled                     | true                                                         |                                                              |
| spring.cloud.zookeeper.discovery.initial-status              |                                                              | 此实例的初始状态（默认为{@link StatusConstants＃STATUS_UP}）。 |
| spring.cloud.zookeeper.discovery.instance-host               |                                                              | 服务可以在Zookeeper中进行注册的预定义主机。对应于URI规范中的{code address}。 |
| spring.cloud.zookeeper.discovery.instance-id                 |                                                              | 用于向Zookeeper注册的ID。默认为随机UUID。                    |
| spring.cloud.zookeeper.discovery.instance-port               |                                                              | 用于注册服务的端口（默认为监听端口）。                       |
| spring.cloud.zookeeper.discovery.instance-ssl-port           |                                                              | 注册服务的SSL端口。                                          |
| spring.cloud.zookeeper.discovery.metadata                    |                                                              | 获取与此实例关联的元数据名称/值对。此信息将发送给Zookeeper，并可由其他实例使用。 |
| spring.cloud.zookeeper.discovery.order                       | 0                                                            | `CompositeDiscoveryClient`用于对可用客户端进行排序的发现客户端的顺序。 |
| spring.cloud.zookeeper.discovery.register                    | true                                                         | 在Zookeeper中注册为服务。                                    |
| spring.cloud.zookeeper.discovery.root                        | /services                                                    | 在其中注册了所有实例的根Zookeeper文件夹。                    |
| spring.cloud.zookeeper.discovery.uri-spec                    | {scheme}://{address}:{port}                                  | 在Zookeeper中的服务注册期间要解析的URI规范。                 |
| spring.cloud.zookeeper.enabled                               | true                                                         | 已启用Zookeeper。                                            |
| spring.cloud.zookeeper.max-retries                           | 10                                                           | 重试的最大次数。                                             |
| spring.cloud.zookeeper.max-sleep-ms                          | 500                                                          | 每次重试睡眠的最长时间（以毫秒为单位）。                     |
| spring.cloud.zookeeper.prefix                                |                                                              | 通用前缀，将应用于所有Zookeeper依赖项的路径。                |
| spring.integration.poller.fixed-delay                        | 1000                                                         | 修复了默认轮询器的延迟。                                     |
| spring.integration.poller.max-messages-per-poll              | 1                                                            | 默认轮询器每次轮询的最大邮件数。                             |
| spring.sleuth.annotation.enabled                             | true                                                         |                                                              |
| spring.sleuth.async.configurer.enabled                       | true                                                         | 启用默认的AsyncConfigurer。                                  |
| spring.sleuth.async.enabled                                  | true                                                         | 启用检测与异步相关的组件，以便在线程之间传递跟踪信息。       |
| spring.sleuth.async.ignored-beans                            |                                                              | {@link java.util.concurrent.Executor} bean名称的列表，这些名称应被忽略并且不包装在跟踪表示中。 |
| spring.sleuth.baggage-keys                                   |                                                              | 应当在过程外传播的行李密钥名称列表。这些密钥在实际密钥之前将带有`baggage`作为前缀。设置此属性是为了与以前的Sleuth版本向后兼容。@see brave.propagation.ExtraFieldPropagation.FactoryBuilder＃addPrefixedFields（String，java.util.Collection） |
| spring.sleuth.enabled                                        | true                                                         |                                                              |
| spring.sleuth.feign.enabled                                  | true                                                         | 使用Feign时启用跨度信息传播。                                |
| spring.sleuth.feign.processor.enabled                        | true                                                         | 启用将Feign上下文包装在其跟踪表示中的后处理器。              |
| spring.sleuth.grpc.enabled                                   | true                                                         | 使用GRPC时启用跨度信息传播。                                 |
| spring.sleuth.http.enabled                                   | true                                                         |                                                              |
| spring.sleuth.http.legacy.enabled                            | false                                                        | 启用旧版Sleuth设置。                                         |
| spring.sleuth.hystrix.strategy.enabled                       | true                                                         | 启用将所有Callable实例包装到其Sleuth代表-TraceCallable中的自定义HystrixConcurrencyStrategy。 |
| spring.sleuth.integration.enabled                            | true                                                         | 启用Spring Integration侦听工具。                             |
| spring.sleuth.integration.patterns                           | [!hystrixStreamOutput*, *]                                   | 通道名称将与之匹配的模式数组。@see org.springframework.integration.config.GlobalChannelInterceptor＃patterns（）默认为与Hystrix流通道名称不匹配的任何通道名称。 |
| spring.sleuth.integration.websockets.enabled                 | true                                                         | 启用对WebSocket的跟踪。                                      |
| spring.sleuth.keys.http.headers                              |                                                              | 如果存在其他应作为标签添加的标头。如果标题值是多值的，则标记值将是逗号分隔的单引号列表。 |
| spring.sleuth.keys.http.prefix                               | http.                                                        | 标头名称的前缀（如果它们作为标记添加）。                     |
| spring.sleuth.log.slf4j.enabled                              | true                                                         | 启用{@link Slf4jScopeDecorator}，以在日志中打印跟踪信息。    |
| spring.sleuth.log.slf4j.whitelisted-mdc-keys                 |                                                              | 从行李到MDC的钥匙清单。                                      |
| spring.sleuth.messaging.enabled                              | false                                                        | 是否应该打开消息传递。                                       |
| spring.sleuth.messaging.jms.enabled                          | false                                                        |                                                              |
| spring.sleuth.messaging.jms.remote-service-name              | jms                                                          |                                                              |
| spring.sleuth.messaging.kafka.enabled                        | false                                                        |                                                              |
| spring.sleuth.messaging.kafka.remote-service-name            | kafka                                                        |                                                              |
| spring.sleuth.messaging.rabbit.enabled                       | false                                                        |                                                              |
| spring.sleuth.messaging.rabbit.remote-service-name           | rabbitmq                                                     |                                                              |
| spring.sleuth.opentracing.enabled                            | true                                                         |                                                              |
| spring.sleuth.propagation-keys                               |                                                              | 与在线中引用的过程中相同的字段的列表。例如，名称“ x-vcap-request-id”将按原样设置（包括前缀）。<p>注意：{@code fieldName}将隐式小写。@see brave.propagation.ExtraFieldPropagation.FactoryBuilder＃addField（String） |
| spring.sleuth.propagation.tag.enabled                        | true                                                         | 启用{@link TagPropagationFinishedSpanHandler}，以将额外的传播字段添加到跨度标签。 |
| spring.sleuth.propagation.tag.whitelisted-keys               |                                                              | 从额外的传播字段到跨度标签的密钥列表。                       |
| spring.sleuth.reactor.decorate-on-each                       | true                                                         | 当在每个运算符上使用true装饰时，性能会下降，但是日志记录将始终包含每个运算符中的跟踪条目。如果在最后一个运算符上使用false修饰符，将获得更高的性能，但是日志记录可能并不总是包含跟踪条目。 |
| spring.sleuth.reactor.enabled                                | true                                                         | 如果为true，则启用对反应堆的检测。                           |
| spring.sleuth.rxjava.schedulers.hook.enabled                 | true                                                         | 通过RxJavaSchedulersHook启用对RxJava的支持。                 |
| spring.sleuth.rxjava.schedulers.ignoredthreads               | [HystrixMetricPoller, ^RxComputation.*$]                     | 不会采样其spans的线程名称。                                  |
| spring.sleuth.sampler.probability                            | 0.1                                                          | 应该采样的请求的概率。例如1.0-应该抽样100％的请求。精度仅是整数（即不支持0.1％的迹线）。 |
| spring.sleuth.sampler.rate                                   |                                                              | 对于低流量端点，每秒速率可能是一个不错的选择，因为它可以为您提供电涌保护。例如，您可能永远不会期望端点每秒收到50个以上的请求。如果流量突然激增，达到每秒5000个请求，那么每秒仍然会有50条痕迹。相反，如果您有一个百分比，例如10％，则同一浪涌最终将导致每秒500条痕迹，这可能会使您的存储设备超负荷。为此，Amazon X-Ray包括一个限速采样器（名为Reservoir）。Brave通过{@link brave.sampler.RateLimitingSampler}采用了相同的方法。 |
| spring.sleuth.scheduled.enabled                              | true                                                         | 为{@link org.springframework.scheduling.annotation.Scheduled}启用跟踪。 |
| spring.sleuth.scheduled.skip-pattern                         | org.springframework.cloud.netflix.hystrix.stream.HystrixStreamTask | 应该跳过的类的完全限定名称的模式。                           |
| spring.sleuth.supports-join                                  | true                                                         | True表示跟踪系统支持在客户端和服务器之间共享范围ID。         |
| spring.sleuth.trace-id128                                    | false                                                        | 为true时，生成128位跟踪ID，而不是64位跟踪ID。                |
| spring.sleuth.web.additional-skip-pattern                    |                                                              | 跟踪中应跳过的URL的其他模式。这将附加到{@link SleuthWebProperties＃skipPattern}。 |
| spring.sleuth.web.client.enabled                             | true                                                         | 启用拦截器注入{@link org.springframework。web。client.RestTemplate}。 |
| spring.sleuth.web.client.skip-pattern                        |                                                              | 在客户端跟踪中应跳过的URL的模式。                            |
| spring.sleuth.web.enabled                                    | true                                                         | 如果为true，则为web应用程序启用检测。                        |
| spring.sleuth.web.exception-logging-filter-enabled           | true                                                         | 标记以切换是否存在记录引发的异常的过滤器。                   |
| spring.sleuth.web.exception-throwing-filter-enabled          | true                                                         | 标记以切换是否存在记录引发的异常的过滤器。@不建议使用{@link #exceptionLoggingFilterEnabled} |
| spring.sleuth.web.filter-order                               |                                                              | 跟踪过滤器应注册的顺序。默认为{@link TraceHttpAutoConfiguration＃TRACING_FILTER_ORDER}。 |
| spring.sleuth.web.ignore-auto-configured-skip-patterns       | false                                                        | 如果设置为true，将忽略自动配置的跳过模式。@请参阅TraceWebAutoConfiguration |
| spring.sleuth.web.skip-pattern                               | /api-docs.**\|/swagger.**\|.**.png\|.**.css\|.**.js\|.**.html\|/favicon.ico\|/hystrix.stream | 跟踪中应跳过的URL的模式。                                    |
| spring.sleuth.zuul.enabled                                   | true                                                         | 使用Zuul时启用跨度信息传播。                                 |
| spring.zipkin.base-url                                       | http://localhost:9411/                                       | zipkin查询服务器实例的URL。如果在服务发现中注册了Zipkin，您还可以提供Zipkin服务器的服务ID（例如[http：// zipkinserver /](http://zipkinserver/)）。 |
| spring.zipkin.compression.enabled                            | false                                                        |                                                              |
| spring.zipkin.discovery-client-enabled                       |                                                              | 如果设置为{@code false}，则始终将{@link ZipkinProperties＃baseUrl}视为URL。 |
| spring.zipkin.enabled                                        | true                                                         | 启用向Zipkin发送spans。                                      |
| spring.zipkin.encoder                                        |                                                              | 发送到Zipkin的spans的编码类型。如果您的服务器不是最新服务器，请设置为{@link SpanBytesEncoder＃JSON_V1}。 |
| spring.zipkin.locator.discovery.enabled                      | false                                                        | 能够通过服务发现来定位主机名。                               |
| spring.zipkin.message-timeout                                | 1                                                            | 待处理的spans之前的超时时间（以秒为单位）将批量发送到Zipkin。 |
| spring.zipkin.sender.type                                    |                                                              | 将spans发送到Zipkin的方法。                                  |
| spring.zipkin.service.name                                   |                                                              | 通过HTTP从中发送Span的服务名称，该名称应显示在Zipkin中。     |
| stubrunner.amqp.enabled                                      | false                                                        | 是否启用对Stub Runner和AMQP的支持。                          |
| stubrunner.amqp.mockCOnnection                               | true                                                         | 是否启用对Stub Runner和AMQP模拟连接工厂的支持。              |
| stubrunner.classifier                                        | stubs                                                        | 默认情况下，在常春藤坐标中用于存根的分类器。                 |
| stubrunner.cloud.consul.enabled                              | true                                                         | 是否在Consul中启用存根注册。                                 |
| stubrunner.cloud.delegate.enabled                            | true                                                         | 是否启用DiscoveryClient的Stub Runner实现。                   |
| stubrunner.cloud.enabled                                     | true                                                         | 是否为Stub Runner启用Spring Cloud支持。                      |
| stubrunner.cloud.eureka.enabled                              | true                                                         | 是否在Eureka中启用存根注册。                                 |
| stubrunner.cloud.ribbon.enabled                              | true                                                         | 是否启用Stub Runner的Ribbon集成。                            |
| stubrunner.cloud.stubbed.discovery.enabled                   | true                                                         | 是否为Stub Runner存根Service Discovery。如果设置为false，则将在实时服务发现中注册存根。 |
| stubrunner.cloud.zookeeper.enabled                           | true                                                         | 是否启用Zookeeper中的存根注册。                              |
| stubrunner.consumer-name                                     |                                                              | 您可以通过为此参数设置一个值来覆盖此字段的默认{@code spring.application.name}。 |
| stubrunner.delete-stubs-after-test                           | true                                                         | 如果设置为{@code false}，则运行测试后将不会从临时文件夹中删除存根。 |
| stubrunner.http-server-stub-configurer                       |                                                              | HTTP服务器存根的配置。                                       |
| stubrunner.ids                                               | []                                                           | 存根的ID以“ ivy”表示法（[groupId]：artifactId：[version]：[classifier] [：port]）运行。{@code groupId}，{@ code classifier}，{@ code version}和{@code port}是可选的。 |
| stubrunner.ids-to-service-ids                                |                                                              | 将基于常春藤表示法的ID映射到应用程序内的serviceId。示例“ a：b”→“ myService”“ artifactId”→“ myOtherService” |
| stubrunner.integration.enabled                               | true                                                         | 是否启用与Spring Integration的Stub Runner集成。              |
| stubrunner.mappings-output-folder                            |                                                              | 将每个HTTP服务器的映射转储到所选文件夹。                     |
| stubrunner.max-port                                          | 15000                                                        | 自动启动的WireMock服务器的端口最大值。                       |
| stubrunner.min-port                                          | 10000                                                        | 自动启动的WireMock服务器的端口的最小值。                     |
| stubrunner.password                                          |                                                              | Repository密码。                                             |
| stubrunner.properties                                        |                                                              | 可以传递给自定义{@link org.springframework.cloud.contract.stubrunner.StubDownloaderBuilder}的属性的地图。 |
| stubrunner.proxy-host                                        |                                                              | Repository代理主机。                                         |
| stubrunner.proxy-port                                        |                                                              | Repository代理端口。                                         |
| stubrunner.stream.enabled                                    | true                                                         | 是否启用与Spring Cloud Stream的Stub Runner集成。             |
| stubrunner.stubs-mode                                        |                                                              | 选择存根应该来自哪里。                                       |
| stubrunner.stubs-per-consumer                                | false                                                        | 仅应将此特定使用者的存根在HTTP服务器存根中注册。             |
| stubrunner.username                                          |                                                              | Repository用户名。                                           |
| wiremock.rest-template-ssl-enabled                           | false                                                        |                                                              |
| wiremock.server.files                                        | []                                                           |                                                              |
| wiremock.server.https-port                                   | -1                                                           |                                                              |
| wiremock.server.https-port-dynamic                           | false                                                        |                                                              |
| wiremock.server.port                                         | 8080                                                         |                                                              |
| wiremock.server.port-dynamic                                 | false                                                        |                                                              |
| wiremock.server.stubs                                        | []                                                           |                                                              |
