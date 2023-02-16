---
layout: post
title: MyBatis-Plus Zero 学习笔记
subtitle: MyBatis-Plus Zero学习笔记
categories: mybatis
tags: [mybatis]
banner:
  video: null             # Video banner source
  loop: true              # Video loop
  volume: 0               # Video volume (100% is 1.0)
  start_at: 0             # Video start time
  image: /assets/images/banners/bg.jpg    # Image banner source
---
# 查询

## Mybatispuls查询指定字段的方式

```java
        LambdaQueryWrapper<BrandEntity> brandWrapper = new LambdaQueryWrapper<>();
        brandWrapper.select(BrandEntity::getName).eq(BrandEntity::getBrandId, categoryBrandRelation.getBrandId());
        BrandEntity brand = brandService.getOne(brandWrapper);

        log.info("brand: {}", brand);
```

```java
brand: BrandEntity(brandId=null, name=华为, logo=null, descript=null, showStatus=null, sort=null, firstLetter=null)
```



## 占位符（#、$）

### 1.#占位符

 1.1 #占位符的特点

> 1. MyBatis处理 #{ } 占位符，使用的 JDBC 对象是 PreparedStatement 对象，执行sql语句的效率更高。
> 2. 使用 PreparedStatement 对象，能够避免 sql 注入，使得sql语句的执行更加安全。
> 3. \#{ } 常常作为列值使用，位于sql语句中等号的右侧；#{ } 位置的值与数据类型是相关的。

1.2 使用 #{ } 对数据库执行 update 操作

```java
package com.bjpowernode.dao;
 
import com.bjpowernode.entity.Student;
 
public interface StudentDao {
 
    //更新学生信息
    int updateStudent(Student student);
 
}
```

```xml
<!-- 更新学生信息 -->
<update id="updateStudent">
    update student set name=#{name},email=#{email} where id=#{id}
</update>
```



```java	
    @Test
    public void testUpdateStudent() {
        SqlSession session=MyBatisUtil.getSqlSession();
        StudentDao studentDao=session.getMapper(StudentDao.class);
        Student student=new Student();
        student.setId(1003);
        student.setName("最强王者");
        student.setEmail("123456@qq.com");
        student.setAge(28);
        int rows=studentDao.updateStudent(student);
        session.commit();
        System.out.println("更新学生的rows === " + rows);
        session.close();
    }
```





![img](/assets/images/mybatis/20210302142944735.png)

![img](/assets/images/mybatis/20210302142953597.png)

------

### 2.$占位符

2.1 $占位符的特点

> 1. MyBatis处理 ${ } 占位符，使用的 JDBC 对象是 Statement 对象，执行sql语句的效率相对于 #{ } 占位符要更低。
> 2. ${ } 占位符的值，使用的是字符串连接的方式，有 sql 注入的风险，同时也存在代码安全的问题。
> 3. ${ } 占位符中的数据是原模原样的，不会区分数据类型。
> 4. \${} 占位符常用作表名或列名，这里推荐在能保证数据安全的情况下使用 \${ }。

2.2 使用 ${ } 对数据库执行 select 操作

```java
package com.bjpowernode.dao;
 
import com.bjpowernode.entity.Student;
import org.apache.ibatis.annotations.Param;
 
import java.util.List;
 
public interface StudentDao {
 
    //${}占位符的使用，使用@Param命名参数
    List<Student> queryStudent(@Param("studentName") String name);
 
}
```

```xml
<!-- ${}占位符的使用 -->
<select id="queryStudent" resultType="com.bjpowernode.entity.Student">
    select * from student where name=${studentName}
</select>
```

```java	
    @Test
    public void testQueryStudent() {
        SqlSession session= MyBatisUtil.getSqlSession();
        StudentDao studentDao=session.getMapper(StudentDao.class);
        List<Student> students=studentDao.queryStudent("'张起灵'");
        for(Student stu : students) {
            System.out.println("stu === " + stu);
        }
        session.close();
    }
```





> 这里注意代码中通过 ${ } 占位符传值的地方，如果我们写成下面这样，代码运行一定是会报错的！！！
>
> ```
> List<Student> students=studentDao.queryStudent("张起灵");
> ```
>
> 这是因为 ${ } 占位符中的数据是原模原样的，不会区分数据类型。也就是说它会把你的mapper文件中的[sql语句](https://so.csdn.net/so/search?q=sql语句&spm=1001.2101.3001.7020)转换为：
>
> ```
> select * from student where name=张起灵  （错误！！！）
> ```
>
> 对sql语句有了解的人肯定都能看出这里的错误，首先我们的name字段的数据类型是 varchar，而这里 name=张起灵 显然是错误的，应该是 **name= '张起灵'** 这样才对，所以代码中通过 ${ } 占位符传值的地方，应该这样写：👇👇👇
>
> ```
> List<Student> students=studentDao.queryStudent("'张起灵'");
> ```
>
> 对参数 张起灵 添加引号，根据 ${ } 占位符中的数据是原模原样的，此时它会把你的mapper文件中的sql语句转换为：
>
> ```
> select * from student where name='张起灵'  （正确！！！）
> ```

![img](/assets/images/mybatis/20210302144236858.png)

------

### 3.#{ }、${ } 占位符的综合使用

> 上面大致介绍了一下这两种占位符的使用规则和语法，下面再用一个综合的例子来应用一下这两种占位符吧！！！ 

```java
package com.bjpowernode.dao;
 
import com.bjpowernode.entity.Student;
import org.apache.ibatis.annotations.Param;
 
import java.util.List;
 
public interface StudentDao {
 
    List<Student> queryStudentOrderByColName(@Param("myName") String myName,
                                             @Param("colName") String colName,
                                             @Param("tableName") String tableName);
}
```

```xml
<!-- 按照某个列排序 -->
<select id="queryStudentOrderByColName" resultType="com.bjpowernode.entity.Student">
    select * from ${tableName} where name=#{myName} order by ${colName} desc
</select>
```

```java	
    @Test
    public void testQueryStudentOrderByColName() {
        SqlSession session= MyBatisUtil.getSqlSession();
        StudentDao studentDao=session.getMapper(StudentDao.class);
        List<Student> students=studentDao.queryStudentOrderByColName("张起灵","id","student");
        for(Student stu : students) {
            System.out.println("stu === " + stu);
        }
        session.close();
    }
```



> 上述sql语句的意思是：从 student 表中查询 name="张起灵" 的所有字段内容，并把结果按照 id 列进行降序排序。

![img](/assets/images/mybatis/20210302145410558.png)

 

# 其它

## lambda获取属性名，源码解析

最近项目中使用mybatisplus 作为项目的orm，效率比[mybatis](https://so.csdn.net/so/search?q=mybatis&spm=1001.2101.3001.7020)提升了不少，用起来相当方便，其中通过lambda表达式取得字段名，特别方便

```java
        LambdaQueryWrapper<SpClips> where = new LambdaQueryWrapper<>();
        where.in(SpClips::getClipId, ids);
```

这是怎么实现的呢，带着好奇心我们来分析一下这块的源码。
首先我们看下 AbstractLambdaWrapper 抽象类

```java
    protected String columnToString(SFunction<T, ?> column, boolean onlyColumn) {
        return getColumn(LambdaUtils.resolve(column), onlyColumn);
    }
```

columnToString 函数将[lambda](https://so.csdn.net/so/search?q=lambda&spm=1001.2101.3001.7020)表达式转换成字段名，
我们再看下 LambdaUtils.resolve(column) 这行代码处理的逻辑

```java
    /**
     * 解析 lambda 表达式, 该方法只是调用了 {@link SerializedLambda#resolve(SFunction)} 中的方法，在此基础上加了缓存。
     * 该缓存可能会在任意不定的时间被清除
     *
     * @param func 需要解析的 lambda 对象
     * @param <T>  类型，被调用的 Function 对象的目标类型
     * @return 返回解析后的结果
     * @see SerializedLambda#resolve(SFunction)
     */
    public static <T> SerializedLambda resolve(SFunction<T, ?> func) {
        Class<?> clazz = func.getClass();
        return Optional.ofNullable(FUNC_CACHE.get(clazz))
            .map(WeakReference::get)
            .orElseGet(() -> {
                SerializedLambda lambda = SerializedLambda.resolve(func);
                FUNC_CACHE.put(clazz, new WeakReference<>(lambda));
                return lambda;
            });
    }
```

该段代码将lambda表达式转换成 SerializedLambda 对象，我们在来看看SerializedLambda 有哪些信息

```java
    private Class<?> capturingClass;
    private String functionalInterfaceClass;
    private String functionalInterfaceMethodName;
    private String functionalInterfaceMethodSignature;
    private String implClass;
    private String implMethodName;
    private String implMethodSignature;
    private int implMethodKind;
    private String instantiatedMethodType;
    private Object[] capturedArgs;
```

这里面有方法名信息，到目前为止，实现思路就比较清楚了，

![在这里插入图片描述](/assets/images/mybatis/20191125110006979.png)
初始化类：TableInfoHelper
核心类：LambdaUtils 、SerializedLambda
