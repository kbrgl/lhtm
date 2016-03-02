# Lispy HyperText Markup
Lhtm is a markup language that targets HTML. It is based on Lisp's [s-expressions](https://en.wikipedia.org/wiki/S-expression "relevant Wikipedia article"). Assuming you're already familiar with HTML, here's a little taste of Lhtm:
```lisp
; comments with one semicolon are excluded from the HTML output
;; comments with two semicolons are included in the HTML output

; the hashtag-style declaration is just syntactic sugar, you can write (\!DOCTYPE html) too
#doctype html
(html
  (head
    (title 'Yo!')

    ; a leading backslash is used for empty elements
    (\meta [name 'description' content 'Sexped up HTML.']))
  (body
    ; you put the element's text content within single or double quotes
    ; single quotes are preferred
    (h1 'This is the content')
    ; text content can span multiple lines and you can use the newline escape sequence ('\n')
    (p 'In Lhtm,
    Text can span multiple lines.\nThis is on its own line.')
    'You can have text content after a tag'))
```
Note that I shouldn't really call this a 'little taste', because this is really the entire meal. Yes, that's literally all there is to Lhtm. Yep, you already know it.

## Why you should be using Lhtm
* Fewer keystrokes: a side effect of using s-expressions to group content is that tags no longer need to be closed - this drastically reduces the number of keystrokes required and improves productivity
* Beautiful: because angular brackets are just plain ugly
* Increases productivity: because it allows greater focus on the content; you no longer have to worry about closing tags
