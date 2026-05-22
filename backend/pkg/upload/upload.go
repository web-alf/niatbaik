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

	ext := filepath.Ext(header.Filename)
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
