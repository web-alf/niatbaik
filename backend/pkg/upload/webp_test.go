package upload

import (
	"image"
	"image/color"
	"image/png"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

func TestWebPVariant(t *testing.T) {
	dir := t.TempDir()

	// Non-convertible inputs → "".
	for _, n := range []string{"a.gif", "a.webp", "../x.png", "missing.png"} {
		if got := WebPVariant(dir, n); got != "" {
			t.Fatalf("%s: want empty, got %q", n, got)
		}
	}

	if _, err := exec.LookPath("cwebp"); err != nil {
		t.Skip("cwebp not installed")
	}

	img := image.NewRGBA(image.Rect(0, 0, 2000, 500))
	for x := 0; x < 2000; x++ {
		img.Set(x, 250, color.RGBA{255, 0, 0, 255})
	}
	f, _ := os.Create(filepath.Join(dir, "big.png"))
	png.Encode(f, img)
	f.Close()

	got := WebPVariant(dir, "big.png")
	if got != "big.png.webp" {
		t.Fatalf("want big.png.webp, got %q", got)
	}
	if _, err := os.Stat(filepath.Join(dir, got)); err != nil {
		t.Fatalf("variant not written: %v", err)
	}
	// Second call hits the cached file and returns the same name.
	if again := WebPVariant(dir, "big.png"); again != got {
		t.Fatalf("second call: want %q, got %q", got, again)
	}
}
