---
layout: post
title: SpringMVC-zero
subtitle: SpringMVC-zero
categories: SpringMVC
tags: [SpringMVC,零碎点]
banner:
  video: null             # Video banner source
  loop: true              # Video loop
  volume: 0               # Video volume (100% is 1.0)
  start_at: 0             # Video start time
  image: /assets/images/banners/spy2.jpg    # Image banner source
---
# SpringMVC

zero: 记录一些零碎的知识点

## 数据传输

### 请求参数

#### URL传参

1. url 传参过程中,controller接收的有多实体类,并且实体类间含有同名字段

```java
@RestController
public class TestController {
    @GetMapping("/sameName")
    public String test1(User user, Book book){
        return user.toString() + book.toString();
    }
}
@Data
public class User {
    private String name;
    private String password;
}
@Data
public class Book {
    private String id;
    private String name;
}
```

springmvc进行转换时会对同名的字段都赋值

![image-20230214212709262](/assets/images/springmvc/image-20230214212709262.png)

当同一个字段有多个值时会用逗号分隔

![image-20230214212806373](/assets/images/springmvc/image-20230214212806373.png)

如何让mvc为不同的实体类中相同的字段赋不同的值?  参阅 [ControllerAdvice ](#h-controlleradvice) 的介绍及三种用法

2. todo

## 注解

### @ControllerAdvice

> 首先，`ControllerAdvice`本质上是一个`Component`，因此也会被当成组建扫描，一视同仁，扫扫扫。

![ControllerAdvice.class](/assets/images/springmvc/20190923172147518.png)

> 然后，我们来看一下此类的注释：
>
> 这个类是为那些声明了（`@ExceptionHandler`、`@InitBinder` 或 `@ModelAttribute`注解修饰的）方法的类而提供的专业化的`@Component` , 以供多个 `Controller`类所共享。
>
> 说白了，就是aop思想的一种实现，你告诉我需要拦截规则，我帮你把他们拦下来，具体你想做更细致的拦截筛选和拦截之后的处理，你自己通过`@ExceptionHandler`、`@InitBinder` 或 `@ModelAttribute`这三个注解以及被其注解的方法来自定义。

![在这里插入图片描述](/assets/images/springmvc/20190923172433236.png)

> 初定义拦截规则：
>
> `ControllerAdvice` 提供了多种指定Advice规则的定义方式，默认什么都不写，则是Advice所有Controller，当然你也可以通过下列的方式指定规则
> 比如对于 `String[] value() default {}` , 写成`@ControllerAdvice("org.my.pkg")` 或者 `@ControllerAdvice(basePackages="org.my.pkg")`, 则匹配`org.my.pkg`包及其子包下的所有`Controller`，当然也可以用数组的形式指定，如：`@ControllerAdvice(basePackages={"org.my.pkg", "org.my.other.pkg"})`, 也可以通过指定注解来匹配，比如我自定了一个 `@CustomAnnotation` 注解，我想匹配所有被这个注解修饰的 `Controller`, 可以这么写：@ControllerAdvice（annotations={CustomAnnotation.class})
>
> 还有很多用法，这里就不全部罗列了。

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component
public @interface ControllerAdvice {

	@AliasFor("basePackages")
	String[] value() default {};

	@AliasFor("value")
	String[] basePackages() default {};

	Class<?>[] basePackageClasses() default {};

	Class<?>[] assignableTypes() default {};

	Class<? extends Annotation>[] annotations() default {};

}

1234567891011121314151617181920
```

#### 1.处理全局异常

> `@ControllerAdvice` 配合 `@ExceptionHandler` 实现全局异常处理

![在这里插入图片描述](/assets/images/springmvc/2019092317251418.png)

> 用于在特定的处理器类、方法中处理异常的注解

![在这里插入图片描述](/assets/images/springmvc/20190923172545308.png)

> 接收Throwable类作为参数，我们知道Throwable是所有异常的父类，所以说，可以自行指定所有异常
>
> 比如在**方法**上加：`@ExceptionHandler(IllegalArgumentException.class)`，则表明此方法处理
>
> `IllegalArgumentException` 类型的异常，如果参数为空，将默认为方法参数列表中列出的任何异常（方法抛出什么异常都接得住）。
>
> 下面的例子：处理所有`IllegalArgumentException`异常，域中加入错误信息`errorMessage` 并返回错误页面`error`

```java
@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    public ModelAndView handleException(IllegalArgumentException e){
        ModelAndView modelAndView = new ModelAndView("error");
        modelAndView.addObject("errorMessage", "参数不符合规范!");
        return modelAndView;
    }
}
123456789
```

#### 2.预设全局数据

> `@ControllerAdvice` 配合 `@ModelAttribute` 预设全局数据
>
> 我们先来看看 `ModelAttribute`注解类的源码

```java
/**
 * Annotation that binds a method parameter or method return value
 * to a named model attribute, exposed to a web view. Supported
 * for controller classes with {@link RequestMapping @RequestMapping}
 * methods.
 * 此注解用于绑定一个方法参数或者返回值到一个被命名的model属性中，暴露给web视图。支持在
 * 在Controller类中注有@RequestMapping的方法使用（这里有点拗口，不过结合下面的使用介绍
 * 你就会明白的)
 */
@Target({ElementType.PARAMETER, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface ModelAttribute {

	@AliasFor("name")
	String value() default "";

	@AliasFor("value")
	String name() default "";

	boolean binding() default true;

}

123456789101112131415161718192021222324
```

> 实际上这个注解的作用就是，允许你往 `Model` 中注入全局属性（可以供所有Controller中注有@Request Mapping的方法使用），`value` 和 `name` 用于指定 属性的 `key` ，`binding` 表示是否绑定，默认为 `true`。
>
> 具体使用方法如下：

- 全局参数绑定

  - 方式一：

  ```java
  @ControllerAdvice
  public class MyGlobalHandler {
      @ModelAttribute
      public void presetParam(Model model){
          model.addAttribute("globalAttr","this is a global attribute");
      }
  }
  1234567
  ```

  > 这种方式比较灵活，需要什么自己加就行了，加多少属性自己控制

  - 方式二：

  ```java
  @ControllerAdvice
  public class MyGlobalHandler {
  
      @ModelAttribute()
      public Map<String, String> presetParam(){
          Map<String, String> map = new HashMap<String, String>();
          map.put("key1", "value1");
          map.put("key2", "value2");
          map.put("key3", "value3");
          return map;
      }
  
  }
  12345678910111213
  ```

  > 这种方式对于加单个属性比较方便。默认会把返回值（如上面的map）作为属性的value，而对于key有两种指定方式：
  >
  > 1. 当 `@ModelAttribute()` 不传任何参数的时候，默认会把返回值的字符串值作为key，如上例的 `key` 则是 ”map"（值得注意的是，不支持字符串的返回值作为key）。
  > 2. 当 `@ModelAttribute("myMap")` 传参数的时候，则以参数值作为`key`，这里 `key` 则是 ”myMap“。

- 全局参数使用

  ```java
  @RestController
  public class AdviceController {
  
      @GetMapping("methodOne")
      public String methodOne(Model model){ 
          Map<String, Object> modelMap = model.asMap();
          return (String)modelMap.get("globalAttr");
      }
  
    
      @GetMapping("methodTwo")
      public String methodTwo(@ModelAttribute("globalAttr") String globalAttr){
          return globalAttr;
      }
  
  
      @GetMapping("methodThree")
      public String methodThree(ModelMap modelMap) {
          return (String) modelMap.get("globalAttr");
      }
      
  }
  12345678910111213141516171819202122
  ```

  > 这三种方式大同小异，其实都是都是从`Model` 中存储属性的 `Map`里取数据。

#### 3.请求参数预处理

> `@ControllerAdvice` 配合 `@InitBinder` 实现对请求参数的预处理
>
> 再次之前我们先来了解一下 `@IniiBinder`，先看一下源码，我会提取一些重要的注释进行浅析

```java
/**
 * Annotation that identifies methods which initialize the
 * {@link org.springframework.web.bind.WebDataBinder} which
 * will be used for populating command and form object arguments
 * of annotated handler methods.
 * 粗略翻译：此注解用于标记那些 (初始化[用于组装命令和表单对象参数的]WebDataBinder)的方法。
 * 原谅我的英语水平，翻译起来太拗口了，从句太多就用‘()、[]’分割一下便于阅读
 *
 * Init-binder methods must not have a return value; they are usually
 * declared as {@code void}.
 * 粗略翻译：初始化绑定的方法禁止有返回值，他们通常声明为 'void'
 *
 * <p>Typical arguments are {@link org.springframework.web.bind.WebDataBinder}
 * in combination with {@link org.springframework.web.context.request.WebRequest}
 * or {@link java.util.Locale}, allowing to register context-specific editors.
 * 粗略翻译：典型的参数是`WebDataBinder`，结合`WebRequest`或`Locale`使用，允许注册特定于上下文的编辑 
 * 器。
 * 
 * 总结如下：
 *  1. @InitBinder 标识的方法的参数通常是 WebDataBinder。
 *  2. @InitBinder 标识的方法,可以对 WebDataBinder 进行初始化。WebDataBinder 是 DataBinder 的一
 * 		           个子类,用于完成由表单字段到 JavaBean 属性的绑定。
 *  3. @InitBinder 标识的方法不能有返回值,必须声明为void。
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface InitBinder {
	/**
	 * The names of command/form attributes and/or request parameters
	 * that this init-binder method is supposed to apply to.
	 * <p>Default is to apply to all command/form attributes and all request parameters
	 * processed by the annotated handler class. Specifying model attribute names or
	 * request parameter names here restricts the init-binder method to those specific
	 * attributes/parameters, with different init-binder methods typically applying to
	 * different groups of attributes or parameters.
	 * 粗略翻译：此init-binder方法应该应用于的命令/表单属性和/或请求参数的名称。默认是应用于所有命	   		* 令/表单属性和所有由带注释的处理类处理的请求参数。这里指定模型属性名或请求参数名将init-binder		 * 方法限制为那些特定的属性/参数，不同的init-binder方法通常应用于不同的属性或参数组。
	 * 我至己都理解不太理解这说的是啥呀，我们还是看例子吧
	 */
	String[] value() default {};
}
1234567891011121314151617181920212223242526272829303132333435363738394041
```

> 我们来看看具体用途，其实这些用途在 `Controller`里也可以定义，但是作用范围就只限当前Controller，因此下面的例子我们将结合 `ControllerAdvice` 作全局处理。

- 参数处理

  ```java
  @ControllerAdvice
  public class MyGlobalHandler {
  
      @InitBinder
      public void processParam(WebDataBinder dataBinder){
  
          /*
           * 创建一个字符串微调编辑器
           * 参数{boolean emptyAsNull}: 是否把空字符串("")视为 null
           */
          StringTrimmerEditor trimmerEditor = new StringTrimmerEditor(true);
  
          /*
           * 注册自定义编辑器
           * 接受两个参数{Class<?> requiredType, PropertyEditor propertyEditor}
           * requiredType：所需处理的类型
           * propertyEditor：属性编辑器，StringTrimmerEditor就是 propertyEditor的一个子类
           */
          dataBinder.registerCustomEditor(String.class, trimmerEditor);
          
          //同上，这里就不再一步一步讲解了
          binder.registerCustomEditor(Date.class,
                  new CustomDateEditor(new SimpleDateFormat("yyyy-MM-dd"), false));
      }
  }
  12345678910111213141516171819202122232425
  ```

  > 这样之后呢，就可以实现全局的实现对 `Controller` 中`RequestMapping`标识的方法中的所有 `String` 和`Date`类型的参数都会被作相应的处理。

  > Controller：

  ```java
  @RestController
  public class BinderTestController {
  
      @GetMapping("processParam")
      public Map<String, Object> test(String str, Date date) throws Exception {
          Map<String, Object> map = new HashMap<String, Object>();
          map.put("str", str);
          map.put("data", date);
          return  map;
      }
  }
  1234567891011
  ```

  > 测试结果：

![在这里插入图片描述](/assets/images/springmvc/20190923173648663.png)
我们可以看出，`str` 和 `date` 这两个参数在进入 `Controller` 的test的方法之前已经被处理了，`str` 被去掉了两边的空格(`%20` 在Http url 中是空格的意思)，`String`类型的 `1997-1-10`被转换成了`Date`类型。

- 参数绑定

  > 参数绑定可以解决特定问题，那么我们先来看看我们面临的问题

  ```java
  class Person {
  
      private String name;
      private Integer age;
      // omitted getters and setters.
  }
  
  class Book {
  
      private String name;
      private Double price;
      // omitted getters and setters.
  }
  
  @RestController
  public class BinderTestController {
  
      @PostMapping("bindParam")
      public void test(Person person, Book book) throws Exception {
          System.out.println(person);
          System.out.println(book);
      }
  }
  1234567891011121314151617181920212223
  ```

  > 我们会发现 `Person`类和 `Book` 类都有 `name`属性，那么这个时候就会出先问题，它可没有那么只能区分哪个`name`是哪个类的。因此 `@InitBinder`就派上用场了：

  ```java
  @ControllerAdvice
  public class MyGlobalHandler {
  
  	/*
       * @InitBinder("person") 对应找到@RequstMapping标识的方法参数中
       * 找参数名为person的参数。
       * 在进行参数绑定的时候，以‘p.’开头的都绑定到名为person的参数中。
       */
      @InitBinder("person")
      public void BindPerson(WebDataBinder dataBinder){
          dataBinder.setFieldDefaultPrefix("p.");
      }
  
      @InitBinder("book")
      public void BindBook(WebDataBinder dataBinder){
          dataBinder.setFieldDefaultPrefix("b.");
      }
  }
  123456789101112131415161718
  ```

  > 因此，传入的同名信息就能对应绑定到相应的实体类中：
  >
  > p.name -> Person.name b.name -> Book.name
  >
  > 还有一点注意的是如果 `@InitBinder("value")` 中的 `value` 值和 `Controller` 中 `@RequestMapping()` 标识的方法的参数名不匹配，则就会产生绑定失败的后果,如：
  >
  > @InitBinder(“p”)、@InitBinder(“b”)
  >
  > public void test(Person person, Book book)
  >
  > 上述情况就会出现绑定失败，有两种解决办法
  >
  > 第一中：统一名称，要么全叫`p`，要么全叫`person`，只要相同就行。
  >
  > 第二种：方法参数加 `@ModelAttribute`，有点类似@RequestParam
  >
  > @InitBinder(“p”)、@InitBinder(“b”)
  >
  > public void test(@ModelAttribute(“p”) Person person, @ModelAttribute(“b”) Book book)



## what’s your Problems

