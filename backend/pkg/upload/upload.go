package upload

import (
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
	contentType := http.DetectContentType(buf[:n])

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
