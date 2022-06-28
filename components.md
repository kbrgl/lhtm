# Necromancy

Necromancy is an unholy web programming environment based on LHTM. You can think of it as a mix of Svelte, PHP, and HTML templating languages like Nunjucks. The idea is to have a complete system for building modern, reactive component-based websites in _only_ Lisp.

There are only 3 core concepts:

- Macros, which you use in place of templates;
- Functions, which you use just like function in any other language;
- Components, which you use like Svelte components.

Okay, maybe there are 4. You also need to know LHTM, a templating language based on Lisp's [s-expressions](https://en.wikipedia.org/wiki/S-expression "relevant Wikipedia article"):

```clojure
(component counter [ @color @count ]
  (button
    [ type "button"
    ; State updates are just recursive calls to the component
      onclick '(counter (+ @count 1))])
  (text [ class "counter-text" ] @count)
  (button
    [ type "button"
      onclick '(counter (- @count 1))])
  (style "
    .counter-text {
      font-weight: bold;
    }
  "))

; comments with one semicolon are included in the HTML output
;; comments with two semicolons are excluded from the HTML output

; the hashtag-style declaration is just syntactic sugar, you can write (\!DOCTYPE html) too
#doctype html
(html
  (head
    (title "Hello!")

    ; a leading backslash is used for empty elements
    (\meta [name "description" content "sexped up HTML."]))
  (body
    ; you put the element's text content within single or double quotes
    ; single quotes are preferred
    (h1 "This is the content")
    ; text content can span multiple lines and you can use the newline escape sequence ('\n')
    (p "In Lhtm,
    Text can span multiple lines.\nThis is on its own line.")
    "You can have text content after a tag"))
```
