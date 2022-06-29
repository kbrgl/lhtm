# Necromancy

Necromancy is an unholy static site framework based on LHTM.

There are only 2 core concepts that you need to know beyond regular programming languages and HTML:

- Components, which are compiled to JavaScript code that "surgically updates the DOM" a la Svelte (i.e. there's no runtime dependencies), and
- Macros, which do the job of partials, mixins, and layouts in other templating languages

Okay, maybe there's one more. You also need to know LHTM, a templating language based on Lisp's [s-expressions](https://en.wikipedia.org/wiki/S-expression "relevant Wikipedia article"):

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
