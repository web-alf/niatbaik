package slug

import (
	"fmt"

	gosimple "github.com/gosimple/slug"
)

func Generate(title string) string {
	return gosimple.Make(title)
}

func GenerateUnique(title string, checkExists func(string) bool) string {
	base := Generate(title)
	candidate := base

	for i := 2; checkExists(candidate); i++ {
		candidate = fmt.Sprintf("%s-%d", base, i)
	}

	return candidate
}
