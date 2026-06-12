package upload

import (
	"bytes"
	"mime/multipart"
	"path/filepath"
	"strings"
	"testing"
)

var allowed = []string{"image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/heic", "image/heif", "image/avif", "image/tiff"}

// TestSniffImageType covers formats http.DetectContentType misses (the source of
// the "application/octet-stream not allowed" upload failures, esp. iPhone HEIC).
func TestSniffImageType(t *testing.T) {
	heic := append([]byte{0, 0, 0, 0x18}, []byte("ftypheic")...)
	avif := append([]byte{0, 0, 0, 0x1c}, []byte("ftypavif")...)
	tiffLE := []byte{0x49, 0x49, 0x2A, 0x00, 0, 0, 0, 0}
	tiffBE := []byte{0x4D, 0x4D, 0x00, 0x2A, 0, 0, 0, 0}
	bmp := append([]byte("BM"), make([]byte, 20)...)
	cases := map[string]string{
		"image/heic": string(sniffImageType(heic)),
		"image/avif": string(sniffImageType(avif)),
		"image/tiff": string(sniffImageType(tiffLE)),
		"image/tiff2": string(sniffImageType(tiffBE)),
		"image/bmp": string(sniffImageType(bmp)),
	}
	want := map[string]string{
		"image/heic": "image/heic", "image/avif": "image/avif",
		"image/tiff": "image/tiff", "image/tiff2": "image/tiff", "image/bmp": "image/bmp",
	}
	for k, got := range cases {
		if got != want[k] {
			t.Errorf("%s: got %q want %q", k, got, want[k])
		}
	}
	// Random binary that matches no signature stays octet-stream (rejected).
	if got := sniffImageType([]byte{0x00, 0x01, 0x02, 0x03, 0xFF, 0xFE, 0x10, 0x42}); got != "application/octet-stream" {
		t.Errorf("garbage sniff = %q, want application/octet-stream", got)
	}
}

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
