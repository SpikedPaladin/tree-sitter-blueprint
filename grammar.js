/**
 * @file Gtk Blueprint
 * @author PaladinDev <paladindev@altlinux.org>
 * @license GPL
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
    name: 'blueprint',
    rules: {
        source_file: $ => repeat(
            choice(
                $.using_directive,
                $.translation_domain,
                $.template_declaration,
                $.menu_declaration,
                $.object
            ),
        ),

        identifier: $ => /[_A-Za-z][A-Za-z0-9_-]*/,
        number: $ => /(0[xX][A-Fa-f0-9_]+|\d+[A-Za-z0-9_]*(?:\.[A-Za-z0-9_]*)?)/,
        string: $ => choice(
            seq(
                '"',
                repeat(choice(
                    alias($.unescaped_double_string_fragment, $.string_fragment),
                    $.escape_sequence
                )),
                '"'
            ),
            seq(
                "'",
                repeat(choice(
                    alias($.unescaped_single_string_fragment, $.string_fragment),
                    $.escape_sequence
                )),
                "'"
            )
        ),

        // stolen from https://github.com/tree-sitter/tree-sitter-javascript/blob/master/grammar.js#L906
        // Workaround to https://github.com/tree-sitter/tree-sitter/issues/1156
        // We give names to the token() constructs containing a regexp
        // so as to obtain a node in the CST.
        unescaped_double_string_fragment: $ =>
            token.immediate(prec(1, /[^"\\]+/)),

        // same here
        unescaped_single_string_fragment: $ =>
            token.immediate(prec(1, /[^'\\]+/)),

        escape_sequence: $ => token.immediate(seq(
            '\\',
            choice(
                /[^xu0-7]/,
                /[0-7]{1,3}/,
                /x[0-9a-fA-F]{2}/,
                /u[0-9a-fA-F]{4}/,
                /U[0-9a-fA-F]{8}/,
                /u\{[0-9a-fA-F]+\}/
            )
        )),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/document_root.html#syntax-using
        using_directive: $ => seq(
            'using',
            field('namespace', $.identifier),
            field('version', $.number),
            ';'
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/document_root.html#translation-domain
        translation_domain: $ => seq(
            'translation-domain',
            field('domain', $.string),
            ';'
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/templates.html#syntax-template
        template_declaration: $ => seq(
            'template',
            $.type,
            optional(seq(':', $.type)),
            $.object_content
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/menus.html#syntax-menu
        menu_declaration: $ => seq(
            'menu', optional(field('id', $.identifier)), '{',
            repeat($._menu_child),
            '}'
        ),
        _menu_child: $ => choice($.menu_section, $.menu_submenu, $.menu_item_shorthand, $.menu_item),
        menu_section: $ => seq(
            'section', optional(field('id', $.identifier)), '{',
            repeat(choice($._menu_child, $.menu_attribute)),
            '}'
        ),
        menu_submenu: $ => seq(
            'submenu', optional(field('id', $.identifier)), '{',
            repeat(choice($._menu_child, $.menu_attribute)),
            '}'
        ),
        menu_item: $ => seq(
            'item', '{',
            repeat($.menu_attribute),
            '}'
        ),
        menu_attribute: $ => seq(
            field('name', $.identifier),
            ':',
            $.string_value,
            ';'
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/menus.html#item-shorthand
        menu_item_shorthand: $ => seq(
            'item', '(',
            $.string_value,
            optional(seq(
                ',',
                optional(seq(
                    $.string_value,
                    optional(seq(
                        ',',
                        $.string_value
                    ))
                ))
            )),
            ')'
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/objects.html#syntax-object
        object: $ => seq(
            $.type, optional(field('id', $.identifier)), $.object_content
        ),
        object_content: $ => seq(
            '{',
            repeat(choice(
                $.signal,
                $.property,
                $._extension,
                $.child
            )),
            '}'
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/objects.html#syntax-signal
        signal: $ => seq(
            field('name', $.identifier), optional(seq('::', field('detail', $.identifier))),
            '=>', '$', field('handler', $.identifier),
            '(', optional(field('object', $.identifier)), ')',
            repeat($.signal_flag), ';'
        ),
        signal_flag: $ => choice('after', 'swapped', 'not-swapped'),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/objects.html#syntax-property
        property: $ => seq(
            field('name', $.identifier), ':',
            choice(
                seq(
                    choice($.binding, $.expr_value, $.value),
                    ';'
                ),
                seq(
                    choice($.array_value, $.menu_declaration, $.object),
                    optional(';')
                )
            )
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/values.html#syntax-binding
        binding: $ => seq(
            'bind', $.expression, repeat($.binding_flag)
        ),
        binding_flag: $ => choice('inverted', 'bidirectional', 'no-sync-create'),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/expressions.html#syntax-exprvalue
        expr_value: $ => seq('expr', $.expression),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/values.html#syntax-value
        value: $ => choice(
            $.translated,
            $.flags,
            $.literal
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/expressions.html#syntax-expression
        expression: $ => seq(
            choice(
                $.translated,
                $.try_expression,
                $.closure_expression,
                $.literal,
                seq('(', $.expression, ')')
            ),
            repeat(choice(
                $.lookup_expression,
                $.cast_expression
            ))
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/expressions.html#syntax-tryexpression
        try_expression: $ => seq(
            'try', '{',
            trailingComma($.expression),
            '}'
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/expressions.html#syntax-closureexpression
        closure_expression: $ => seq(
            '$', field('name', $.identifier),
            '(',
            trailingComma($.expression),
            ')'
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/expressions.html#syntax-lookupexpression
        lookup_expression: $ => seq(
            '.', field('property', $.identifier)
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/expressions.html#syntax-castexpression
        cast_expression: $ => seq(
            'as', '<', $.type, '>'
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/extensions.html#syntax-extension
        _extension: $ => choice(
            $.accessibility_definition,
            $.responses_definition,
            $.condition_definition,
            $.setters_definition,
            $.items_definitions,
            $.mime_types_definition,
            $.patterns_definition,
            $.suffixes_definition,
            $.layout_definition,
            $.offsets_definition,
            $.list_item_factory_declaration,
            $.marks_definition,
            $.widgets_definition,
            $.strings_definition,
            $.styles_definition
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/extensions.html#accessibility-properties
        accessibility_definition: $ => seq(
            'accessibility', '{',
            repeat($.accessibility_property),
            '}'
        ),
        accessibility_property: $ => seq(
            field('name', $.identifier), ':',
            choice(
                $.value,
                seq(
                    '[',
                    seq(
                        $.value,
                        repeat(seq(',', $.value)),
                        optional(','),
                    ),
                    ']'
                )
            ), ';'
        ),

        /*
         * https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/extensions.html#adw-alertdialog-responses
         * and
         * https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/extensions.html#syntax-extadwmessagedialog
         *
         * They are have identical rules so it was merged in single rule
         */
        responses_definition: $ => seq(
            'responses', '[', 
            trailingComma($.response),
            ']'
        ),
        response: $ => seq(
            field('id', $.identifier), ':',
            $.string_value,
            repeat($.response_flag)
        ),
        response_flag: $ => choice('destructive', 'suggested', 'disabled'),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/extensions.html#syntax-extadwbreakpoint
        condition_definition: $ => seq('condition', '(', field('condition', $.string), ')'),
        setters_definition: $ => seq('setters', '{', repeat($.setter), '}'),
        setter: $ => seq(field('object', $.identifier), '.', field('property', $.identifier), ':', $.value, ';'),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/extensions.html#gtk-comboboxtext-items
        items_definitions: $ => seq(
            'items', '[',
            trailingComma($.item),
            ']'
        ),
        item: $ => seq(optional(seq(field('id', $.identifier), ':')), $.string_value),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/extensions.html#gtk-filefilter-filters
        mime_types_definition: $ => seq(
            'mime-types', '[',
            trailingComma($.filter),
            ']'
        ),
        patterns_definition: $ => seq(
            'patterns', '[',
            trailingComma($.filter),
            ']'
        ),
        suffixes_definition: $ => seq(
            'suffixes', '[',
            trailingComma($.filter),
            ']'
        ),
        filter: $ => field('item', $.string),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/extensions.html#widget-layouts
        layout_definition: $ => seq(
            'layout', '{',
            repeat($.layout_property),
            '}'
        ),
        layout_property: $ => seq(
            field('name', $.identifier), ':', $.value, ';'
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/extensions.html#gtk-levelbar-offsets
        offsets_definition: $ => seq(
            'offsets', '[',
            trailingComma($.offset),
            ']'
        ),
        offset: $ => seq('offset', '(', field('name', $.string), ',', field('value', $.number), ')'),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/extensions.html#syntax-extlistitemfactory
        list_item_factory_declaration: $ => seq('template', $.type, $.object_content),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/extensions.html#syntax-extscalemarks
        marks_definition: $ => seq(
            'marks', '[',
            seq(
                $.mark,
                repeat(seq(',', $.mark)),
                optional(','),
            ),
            ']'
        ),
        mark: $ => seq(
            'mark', '(',
            optional(choice('-', '+')), field('value', $.number),
            optional(seq(
                ',', field('position', $.identifier),
                optional(seq(',', $.string_value))
            )),
            ')'
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/extensions.html#syntax-extsizegroupwidgets
        widgets_definition: $ => seq(
            'widgets', '[',
            seq(
                $.widget,
                repeat(seq(',', $.widget)),
                optional(','),
            ),
            ']'
        ),
        widget: $ => field('id', $.identifier),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/extensions.html#syntax-extstringliststrings
        strings_definition: $ => seq(
            'strings', '[',
            trailingComma($.string_list_item),
            ']'
        ),
        string_list_item: $ => $.string_value,

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/extensions.html#syntax-extstyles
        styles_definition: $ => seq('styles', '[', commaSep($.styles_property), ']'),
        styles_property: $ => field('name', $.string),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/objects.html#syntax-child
        child: $ => seq(optional($.child_annotation), $.object),
        child_annotation: $ => seq('[', choice($.child_internal, $._child_extension, $.child_type), ']'),
        child_internal: $ => seq('internal-child', field('internal_child', $.identifier)),
        child_type: $ => field('child_type', $.identifier),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/extensions.html#syntax-childextension
        _child_extension: $ => $.action_annotation,
        action_annotation: $ => seq(
            'action', 'response', '=', choice(field('name', $.identifier), field('id', $.number)), optional('default')
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/objects.html#syntax-typename
        type: $ => choice($.type_name_full, $.type_name_external, $.type_name_short),
        type_name_full: $ => seq(field('namespace', $.identifier), '.', field('name', $.identifier)),
        type_name_external: $ => seq('$', choice($.type_name_full, $.type_name_short)),
        type_name_short: $ => field('name', $.identifier),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/values.html#literals
        literal: $ => choice(
            $.type_literal,
            $.quoted_literal,
            $.number_literal,
            $.ident_literal,
        ),
        quoted_literal: $ => field('value', $.string),
        number_literal: $ => seq(optional(choice('-', '+')), field('value', $.number)),
        ident_literal: $ => field('ident', $.identifier),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/values.html#type-literals
        type_literal: $ => seq('typeof', '<', $.type, '>'),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/values.html#string-values
        string_value: $ => choice($.translated, $.quoted_literal),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/values.html#array-values
        array_value: $ => seq('[', optional(trailingComma($.string_value)), ']'),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/values.html#translated-strings
        translated: $ => choice(
            seq('_', '(', field('string', $.string), ')'),
            seq('C_', '(', field('context', $.string), ',', field('string', $.string), ')')
        ),

        // https://gnome.pages.gitlab.gnome.org/blueprint-compiler/reference/values.html#flags
        flags: $ => seq(
            field('first', $.identifier),
            repeat1(seq('|', field('rest', $.identifier)))
        ),

        comment: $ => token(choice(
            seq('//', /.*/),
            seq(
                '/*',
                /[^*]*\*+([^/*][^*]*\*+)*/,
                '/'
            )
        )),
    },

    extras: $ => [
        /\s/,
        $.comment,
    ]
})

/**
 * Creates a rule to match zero or more of the rules separated by {sep},
 * with an optional one at the end.
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @returns {SeqRule}
 */
function trailingSep(rule, separator) {
    return seq(rule, repeat(seq(separator, rule)), optional(separator));
}

/**
 * Creates a rule to match one or more of the rules separated by comma,
 * with an optional one at the end.
 *
 * @param {Rule} rule
 *
 * @returns {SeqRule}
 */
function trailingComma(rule) {
    return trailingSep(rule, ',');
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @returns {SeqRule}
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @returns {ChoiceRule}
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}
