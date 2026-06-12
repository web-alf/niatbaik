package service

import (
	"mime/multipart"

	"github.com/anrdart/niatbaik-api/pkg/upload"
)

var allowedImageTypes = []string{
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
	"image/bmp",
	"image/heic", // iPhone default camera format
	"image/heif",
	"image/avif",
	"image/tiff",
}

type UploadService struct {
	uploadDir string
	maxSize   int64
}

func NewUploadService(uploadDir string, maxSize int64) *UploadService {
	return &UploadService{uploadDir: uploadDir, maxSize: maxSize}
}

func (s *UploadService) UploadImage(file multipart.File, header *multipart.FileHeader) (string, error) {
	return upload.SaveFile(file, header, s.uploadDir, allowedImageTypes, s.maxSize)
}
