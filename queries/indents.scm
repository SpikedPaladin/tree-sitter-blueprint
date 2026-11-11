[
  (object_content)
  (menu_declaration)
  (menu_section)
  (menu_submenu)
  (menu_item)
  (array_value)
  (accessibility_definition)
  (responses_definition)
  (setters_definition)
  (items_definitions)
  (mime_types_definition)
  (patterns_definition)
  (suffixes_definition)
  (layout_definition)
  (offsets_definition)
  (marks_definition)
  (widgets_definition)
  (strings_definition)
  (styles_definition)
] @indent.begin

([
  "{"
  "["
] @indent.begin
  (#set! indent.immediate))

[
  "}"
  "]"
] @indent.branch @indent.end

(comment) @indent.auto
