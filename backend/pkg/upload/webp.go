package upload

import (
	"image"
	_ "image/jpeg" // DecodeConfig for header-only dimension read
	_ "image/png"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
)

// webpMaxEdge caps the longest side of generated variants; pages never render wider.
const webpMaxEdge = 1600

// ponytail: one process-wide lock serialises cwebp runs. Fine for a handful of legacy
// images converting lazily; shard by filename if first-hit latency ever matters.
var webpMu sync.Mutex

// WebPVariant returns the filename of a WebP sibling ("<name>.webp") for a legacy
// .jpg/.jpeg/.png upload, generating it with cwebp on first request. Returns "" when
// name isn't a convertible raster, the source is missing, or cwebp is unavailable/fails —
// callers then serve the original untouched. Safe for concurrent callers.
func WebPVariant(dir, name string) string {
	if strings.ContainsAny(name, `/\`) {
		return ""
	}
	ext := strings.ToLower(filepath.Ext(name))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
		return ""
	}
	src := filepath.Join(dir, name)
	out := src + ".webp"
	if _, err := os.Stat(out); err == nil {
		return name + ".webp"
	}
	f, err := os.Open(src)
	if err != nil {
		return ""
	}
	cfg, _, derr := image.DecodeConfig(f)
	f.Close()
	if derr != nil {
		return ""
	}

	webpMu.Lock()
	defer webpMu.Unlock()
	if _, err := os.Stat(out); err == nil { // another request won the race
		return name + ".webp"
	}
	args := []string{"-quiet", "-q", "80", "-metadata", "none"}
	if cfg.Width > webpMaxEdge || cfg.Height > webpMaxEdge {
		if cfg.Width >= cfg.Height {
			args = append(args, "-resize", strconv.Itoa(webpMaxEdge), "0")
		} else {
			args = append(args, "-resize", "0", strconv.Itoa(webpMaxEdge))
		}
	}
	tmp := out + ".tmp"
	args = append(args, src, "-o", tmp)
	if err := exec.Command("cwebp", args...).Run(); err != nil {
		os.Remove(tmp)
		return ""
	}
	if err := os.Rename(tmp, out); err != nil {
		os.Remove(tmp)
		return ""
	}
	return name + ".webp"
}
