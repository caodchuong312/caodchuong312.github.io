---
title: Lỗ hổng Java Deserialize - Phần 2 - Java Reflection
date: 2023-09-13 12:00:00 +0700
categories: [Java]
tags: [deserialization]     # TAG names should always be lowercase
img_path: /assets/img/JavaDeserializationP2
---

## Java Reflection là gì?
`Reflection` là 1 API trên Java sử dụng để truy xuất, sửa đổi hành vì của fields, methods, classes, interfaces trong quá trình runtime. Điều này đặc biệt hữu ích khi không biết tên chúng tại thời điểm compile hay do server filter 1 số thứ.<br>
