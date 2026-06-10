package upload

import (
	"bytes"
	"mime/multipart"
	"path/filepath"
	"strings"
	"testing"
)

var allowed = []string{"image/jpeg", "image/png", "image/webp", "image/gif"}

// makeMultipartFile builds a real multipart.File (which supports Seek, as SaveFile
// requires) from raw bytes under the given upload filename.
func makeMultipartFile(t *testing.T, filename string, content []byte) (multipart.File, *multipart.FileHeader) {
	t.Helper()
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	fw, err := w.CreateFormFile("image", filename)
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}
	fw.Write(content)
	w.Close()

	r := multipart.NewReader(&buf, w.Boundary())
	form, err := r.ReadForm(int64(buf.Len()) + 1024)
	if err != nil {
		t.Fatalf("read form: %v", err)
	}
	fh := form.File["image"][0]
	f, err := fh.Open()
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	return f, fh
}

// Minimal magic-byte prefixes recognized by http.DetectContentType.
var (
	pngMagic = []byte{0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a}
	gifMagic = []byte("GIF89a")
)

func TestSaveFile_StoresImageWithDerivedExt(t *testing.T) {
	dir := t.TempDir()
	// User claims a ".php" extension but bytes are a PNG → must be stored as .png.
	f, fh := makeMultipartFile(t, "evil.php", append(pngMagic, make([]byte, 32)...))
	defer f.Close()
	name, err := SaveFile(f, fh, dir, allowed, 1<<20)
	if err != nil {
		t.Fatalf("SaveFile: %v", err)
	}
	if ext := strings.ToLower(filepath.Ext(name)); ext != ".png" {
		t.Errorf("stored extension = %q, want .png (must derive from content, not filename)", ext)
	}
}

func TestSaveFile_RejectsNonImage(t *testing.T) {
	dir := t.TempDir()
	// Plain text disguised with a .png name — DetectContentType sees text/plain.
	f, fh := makeMultipartFile(t, "notreally.png", []byte("just some plain text, definitely not an image"))
	defer f.Close()
	if _, err := SaveFile(f, fh, dir, allowed, 1<<20); err == nil {
		t.Error("expected SaveFile to reject a non-image disguised as .png")
	}
}

func TestSaveFile_AcceptsGifAndNormalizesExt(t *testing.T) {
	dir := t.TempDir()
	f, fh := makeMultipartFile(t, "anim.GIF", append(gifMagic, make([]byte, 16)...))
	defer f.Close()
	name, err := SaveFile(f, fh, dir, allowed, 1<<20)
	if err != nil {
		t.Fatalf("SaveFile gif: %v", err)
	}
	if filepath.Ext(name) != ".gif" {
		t.Errorf("gif stored as %q, want .gif", name)
	}
}

func TestSaveFile_RejectsOversize(t *testing.T) {
	dir := t.TempDir()
	f, fh := makeMultipartFile(t, "big.png", append(pngMagic, make([]byte, 4096)...))
	defer f.Close()
	if _, err := SaveFile(f, fh, dir, allowed, 64); err == nil {
		t.Error("expected SaveFile to reject a file exceeding maxSize")
	}
}
