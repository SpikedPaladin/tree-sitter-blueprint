package tree_sitter_blueprint_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_blueprint "github.com/spikedpaladin/tree-sitter-blueprint/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_blueprint.Language())
	if language == nil {
		t.Errorf("Error loading Blueprint grammar")
	}
}
