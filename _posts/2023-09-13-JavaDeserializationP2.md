---
title: Lỗ hổng Java Deserialize - Phần 2 - Java Reflection
date: 2023-09-13 00:15:00 +0700
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
Đầu tiên, các method để thực hiện nhưng điều trên

Ta có class Person:
```java
public class Person {
    private String name;
    private int age;
    public Person(){}

    public void setName(String name) {
        this.name = name;
    }

    public void setAge(int age) {
        this.age = age;
    }
}
```




