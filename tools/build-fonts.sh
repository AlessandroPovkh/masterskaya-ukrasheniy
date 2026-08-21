#!/usr/bin/env bash
set -euo pipefail

site_dir="$(cd "$(dirname "$0")/.." && pwd)"
source_dir="${BRAND_SOURCE_DIR:?Set BRAND_SOURCE_DIR to the approved brand project root}"
font_python="$site_dir/.venv-fonts/bin/python"

"$font_python" -m fontTools.subset "$source_dir/assets/fonts/prata.ttf" --output-file="$site_dir/public/fonts/prata-cyrillic.woff2" --flavor=woff2 --unicodes='U+0000-00FF,U+0400-052F,U+20BD' --layout-features='*'
"$font_python" -m fontTools.subset "$source_dir/assets/fonts/manrope.ttf" --output-file="$site_dir/public/fonts/manrope-cyrillic.woff2" --flavor=woff2 --unicodes='U+0000-00FF,U+0400-052F,U+20BD' --layout-features='*'
"$font_python" -m fontTools.subset "$source_dir/assets/fonts/cormorant-garamond-italic.ttf" --output-file="$site_dir/public/fonts/cormorant-garamond-italic-cyrillic.woff2" --flavor=woff2 --unicodes='U+0000-00FF,U+0400-052F,U+20BD' --layout-features='*'
