---
title: Lỗ hổng Java Deserialize - Phần 2 - Java Reflection
date: 2023-09-13 12:00:00 +0700
categories: [Java]
tags: [deserialization]     # TAG names should always be lowercase
img_path: /assets/img/JavaDeserializationP2
---

## Java Reflection là gì?
`Reflection` là 1 API trên Java sử dụng để truy xuất, sửa đổi hành vì của fields, methods, classes, interfaces trong quá trình runtime. Điều này đặc biệt hữu ích khi không biết tên chúng tại thời điểm compile hay do server filter 1 số thứ.<br>

![reflection](reflection.jpg)

Ngoài ra, chúng ta có thể khởi tạo object mới, gọi các method hay set các giá trị các fields từ reflection.

![invoke](invoke.png)

## Example
Để sử dụng Java Reflection, ta không cần include file jar nào, vì JDK đi kèm với các class của package `java.lang.reflect` từ đó ta chỉ cẩn import nó:

```java
import java.lang.reflect.*;
```
Đầu tiên, các method để thực hiện nhưng điều trên

Ta có class Person:
```java
public class Person {
    private String name;
    private int age;
    public Person(){}

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String toString() {
        return "Person{" +
                "name='" + name + '\'' +
                ", age=" + age +
                '}';
    }
}
```

### Lấy Class object
Class **java.lang.Class (Class object)** là *entry point* của các thao tác reflection (hiểu nôm na là class này chứa các methods để sử dụng reflection như `getDeclaredMethods()`, `getDeclaredField()`,...) <br>
Và để lấy được `Class object` ta sử dụng:
- `ClassName.class`, ví dụ: `Person.class`.
- `Class.forName(ClassName)`, ví dụ: `Class.forName("Person")`.
### Lấy ra Fields
Từ class `Person` trên ta tạo object và set giá trị:

```java
Person person = new Person();
person.setName("chuong");
person.setAge(19);
```

Ta sử dụng `getDeclaredFields()` để lấy về mảng `Field`, `getName()` để lấy tên field và `getType()` để lấy kiểu dữ liệu của field đó:

```java
for(Field field : Person.class.getDeclaredFields()){
    String fieldName = field.getName();  
    System.out.println("Field: " + fieldName);
    System.out.println("Type: " +field.getType());
    field.setAccessible(true);
    System.out.println("Value:" + field.get(person));
    System.out.println("---------------");
}
```
Output:

![getfield](getfield.png)

Ở trên `get()` để lấy giá trị của object, và ta cũng có thể dùng `set()` để đặt các giá trị mong muốn cho field:

```java
Field nameField = Person.class.getDeclaredField("name");
nameField.setAccessible(true);
nameField.set(person, "admin");
System.out.println(person.toString());  // dùng toString() để kiểm tra
```
Output:

![setfield](setfield.png)

### Lấy ra Methods
Cũng tương tự như field:

```java
Method[] methods = Person.class.getDeclaredMethods();
for(Method method : methods){
    methodName =  method.getName();
    System.out.println("Method: " + methodName);
    System.out.println("Parameters: " + Arrays.toString(method.getParameters()));  // lấy ra mảng chứa param
}
```
Output:

![getmethod](getmethod.png)

Như vậy ta cũng có thể lấy ra method và cũng có thể gọi nó bằng `invoke()`:

```java
Method methodSetName = Person.class.getMethod("setName", String.class);  // lấy ra method setName()
Person person1 = new Person();
methodSetName.invoke(person1, "admin");
System.out.println(person1.toString());
```
Output:

![method](method.png)

### Lấy ra Constructor

```java
for(Constructor constructor : Class.forName("Person").getDeclaredConstructors()) {
    System.out.println("Name of Constructor : "+constructor);
    System.out.println(Arrays.toString(constructor.getParameters()));
    System.out.println("------------");
}
```
Ouptput:

![constructor](constructor.png)

Việc lấy ra constructor như vậy thì ta có thể từ đó tạo object mới mà không cần cách thông thường là dùng `new`:

```java
Class<Person> personClass = Person.class;
Constructor<Person> personConstructor = personClass.getConstructor(String.class, int.class);
Person person2 = personConstructor.newInstance("admin", 19);
System.out.println(person2.toString());
```
Output:

![constructor1](constructor1.png)

#Refs:
- <https://loda.me/articles/huong-dan-java-reflection>
- <https://www.baeldung.com/java-reflection>
- <https://www.geeksforgeeks.org/reflection-in-java/>
- <https://tsublogs.wordpress.com/2023/02/15/javasecurity101-1-java-reflection/>
- <https://javasec.org/javase/Reflection/Reflection.html>










