(using_directive "using" @keyword.import)
(using_directive namespace: (identifier) @module)
(using_directive version: (number) @number)
(translation_domain "translation-domain" @keyword)

(template_declaration "template" @keyword)
(list_item_factory_declaration "template" @keyword)
(type_name_external "$" @type.qualifier)
(type_literal "typeof" @keyword)
(expr_value "expr" @keyword)
(cast_expression "as" @keyword)
(binding "bind" @keyword)
(binding_flag) @keyword
(signal_flag) @keyword
(response_flag) @keyword

(object id: (identifier) @variable)
(property name: (identifier) @property)
(accessibility_property name: (identifier) @property)
(layout_property name: (identifier) @property)
(setter object: (identifier) @variable)
(setter property: (identifier) @property)
(lookup_expression property: (identifier) @property)
(menu_attribute name: (identifier) @property)

(type) @type
(number) @number
(string) @string
(escape_sequence) @string.escape
(comment) @comment

(ident_literal
  ident: (identifier) @boolean
  (#any-of? @boolean "true" "false" "yes" "no"))
(ident_literal
  ident: (identifier) @constant.builtin
  (#eq? @constant.builtin "null"))
(flags first: (identifier) @constant)
(flags rest: (identifier) @constant)

(signal name: (identifier) @function.builtin)
(signal handler: (identifier) @function)
(closure_expression name: (identifier) @function)
(translated "_" @function.builtin)
(translated "C_" @function.builtin)

(condition_definition "condition" @function.macro)
(setters_definition "setters" @function.macro)
(responses_definition "responses" @function.macro)
(items_definitions "items" @function.macro)
(mime_types_definition "mime-types" @function.macro)
(patterns_definition "patterns" @function.macro)
(suffixes_definition "suffixes" @function.macro)
(offsets_definition "offsets" @function.macro)
(offset "offset" @function.macro)
(marks_definition "marks" @function.macro)
(mark "mark" @function.macro)
(widgets_definition "widgets" @function.macro)
(strings_definition "strings" @function.macro)
(styles_definition "styles" @function.macro)
(accessibility_definition "accessibility" @function.macro)
(layout_definition "layout" @function.macro)

(menu_declaration "menu" @keyword)
(menu_section "section" @keyword)
(menu_submenu "submenu" @keyword)
(menu_item "item" @function.macro)
(menu_item_shorthand "item" @function.macro)

(child_internal "internal-child" @keyword)
(action_annotation "action" @keyword)
(action_annotation "response" @keyword)
(action_annotation "default" @keyword)

[
  ";"
  "."
  ","
  "|"
] @punctuation.delimiter

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ":"
  "::"
  "=>"
  "="
] @operator
