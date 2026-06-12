package upload

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"slices"

	"github.com/google/uuid"
)

// extForContentType maps the sniffed content type to a safe, canonical extension.
// Only types present here can be stored, regardless of the uploaded filename.
var extForContentType = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
	"image/gif":  ".gif",
	"image/bmp":  ".bmp",
	"image/heic": ".heic",
	"image/heif": ".heic",
	"image/avif": ".avif",
	"image/tiff": ".tiff",
}

// sniffImageType returns the image MIME type for buf. It starts with the stdlib
// detector and then adds magic-byte checks for formats http.DetectContentType does
// not recognize — notably HEIC/HEIF (the default iPhone camera format), AVIF, and
// some TIFF/BMP variants — which otherwise come back as "application/octet-stream"
// and get wrongly rejected.
func sniffImageType(buf []byte) string {
	ct := http.DetectContentType(buf)
	if ct != "application/octet-stream" {
		return ct
	}
	// ISO-BMFF container (HEIC/HEIF/AVIF): bytes 4..8 are "ftyp", then a brand.
	if len(buf) >= 12 && bytes.Equal(buf[4:8], []byte("ftyp")) {
		brand := string(buf[8:12])
		switch brand {
		case "heic", "heix", "hevc", "hevx", "mif1", "msf1", "heim", "heis", "hevm", "hevs":
			return "image/heic"
		case "avif", "avis":
			return "image/avif"
		}
		return "image/heic" // unknown ftyp brand → treat as HEIF family
	}
	// TIFF: "II*\0" (little-endian) or "MM\0*" (big-endian).
	if len(buf) >= 4 && (bytes.HasPrefix(buf, []byte{0x49, 0x49, 0x2A, 0x00}) || bytes.HasPrefix(buf, []byte{0x4D, 0x4D, 0x00, 0x2A})) {
		return "image/tiff"
	}
	// BMP: "BM".
	if len(buf) >= 2 && buf[0] == 'B' && buf[1] == 'M' {
		return "image/bmp"
	}
	return ct
}

func SaveFile(file multipart.File, header *multipart.FileHeader, uploadDir string, allowedTypes []string, maxSize int64) (string, error) {
	if header.Size > maxSize {
		return "", fmt.Errorf("file size %d exceeds maximum %d bytes", header.Size, maxSize)
	}

	buf := make([]byte, 512)
	n, err := file.Read(buf)
	if err != nil && err != io.EOF {
		return "", fmt.Errorf("read file header: %w", err)
	}
	contentType := sniffImageType(buf[:n])

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", fmt.Errorf("seek file: %w", err)
	}

	if !slices.Contains(allowedTypes, contentType) {
		return "", fmt.Errorf("file type %s not allowed", contentType)
	}

	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("create upload dir: %w", err)
	}

	// Derive the extension from the *detected* content type, NOT the user-supplied
	// filename. This prevents polyglot/double-extension uploads (e.g. "x.php" or
	// "x.svg" carrying image magic bytes) from being stored with a dangerous or
	// mismatched extension and later served/executed.
	ext, ok := extForContentType[contentType]
	if !ok {
		return "", fmt.Errorf("file type %s not allowed", contentType)
	}
	filename := uuid.New().String() + ext

	dst, err := os.Create(filepath.Join(uploadDir, filename))
	if err != nil {
		return "", fmt.Errorf("create file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("save file: %w", err)
	}

	return filename, nil
}
