export type ToolIconName =
  | "qrCode"
  | "barcode"
  | "keyRound"
  | "caseSensitive"
  | "fileText"
  | "pipette"
  | "binary"
  | "braces"
  | "fingerprint"
  | "link"
  | "clock"
  | "hash"
  | "ruler"
  | "gitCompare"
  | "fileCode"
  | "table"
  | "image"
  | "imageResize"
  | "imageCrop"
  | "imageConvert"
  | "eraser"
  | "upscale"
  | "favicon"
  | "captions"
  | "deviceFrame"
  | "metadata"
  | "socialResize"
  | "video"
  | "download"
  | "egg";

export type Tool = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  icon: ToolIconName;
  category: string;
};

export const tools: Tool[] = [
  {
    id: "qr-code-generator",
    name: "QR Code Generator",
    slug: "qr-code-generator",
    shortDescription: "Create a QR code for a link, message, or contact detail.",
    longDescription:
      "Turn a website URL, plain text, or contact information into a QR code that is easy to share. This tool will make it simple to prepare a code for digital or printed use.",
    icon: "qrCode",
    category: "Generators",
  },
  {
    id: "barcode-generator",
    name: "Barcode Generator",
    slug: "barcode-generator",
    shortDescription:
      "Create barcodes for products and projects, then download them as SVG.",
    longDescription:
      "Create barcodes for product labels, inventory, and personal projects. Choose Code 128, Code 39, EAN-13, EAN-8, UPC-A, or ITF-14, customize the appearance, and download crisp SVG artwork.",
    icon: "barcode",
    category: "Generators",
  },
  {
    id: "password-generator",
    name: "Password Generator",
    slug: "password-generator",
    shortDescription:
      "Create a secure password with adjustable length and character types.",
    longDescription:
      "Generate a strong password directly in your browser with cryptographically secure randomness. Set its length, choose the character types to include, exclude look-alike characters, and copy the result when it is ready.",
    icon: "keyRound",
    category: "Security",
  },
  {
    id: "text-case-converter",
    name: "Text Case Converter",
    slug: "text-case-converter",
    shortDescription:
      "Convert text into writing styles and developer-friendly case formats.",
    longDescription:
      "Convert text between uppercase, lowercase, sentence case, title case, camelCase, PascalCase, snake_case, and kebab-case. View the result as you type and copy it when ready.",
    icon: "caseSensitive",
    category: "Text",
  },
  {
    id: "word-counter",
    name: "Word Counter",
    slug: "word-counter",
    shortDescription:
      "Count words, characters, sentences, paragraphs, and reading time.",
    longDescription:
      "Review word count, characters with or without spaces, sentence and paragraph totals, and estimated reading time as you type. Paste a draft for an instant length check, then copy or clear it when you are done.",
    icon: "fileText",
    category: "Text",
  },
  {
    id: "color-picker",
    name: "Color Picker",
    slug: "color-picker",
    shortDescription:
      "Pick a color, preview it, and copy HEX, RGB, or HSL values.",
    longDescription:
      "Choose a color with the visual picker or enter a 3- or 6-digit HEX value. Preview the color, inspect its HEX, RGB, and HSL values, and copy a format for your design work.",
    icon: "pipette",
    category: "Design",
  },
  {
    id: "base64-encoder-decoder",
    name: "Base64 Encoder/Decoder",
    slug: "base64-encoder-decoder",
    shortDescription:
      "Encode or decode UTF-8 text with standard or URL-safe Base64.",
    longDescription:
      "Encode UTF-8 text as standard or URL-safe Base64, or decode Base64 back into readable text. Conversion happens in your browser, with validation for malformed data. Base64 is an encoding, not encryption.",
    icon: "binary",
    category: "Developer",
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    slug: "json-formatter",
    shortDescription:
      "Validate, format, and minify JSON with useful parse errors.",
    longDescription:
      "Validate JSON, format it with consistent 2- or 4-space indentation, or minify it for compact output. Invalid input reports a useful parse error, including line and column when available.",
    icon: "braces",
    category: "Developer",
  },
  {
    id: "uuid-generator",
    name: "UUID Generator",
    slug: "uuid-generator",
    shortDescription: "Generate one or many secure random UUID v4 values.",
    longDescription:
      "Create unique UUID version 4 identifiers in your browser with secure random values. Generate up to 100 at once, then copy individual UUIDs or the full batch.",
    icon: "fingerprint",
    category: "Developer",
  },
  {
    id: "url-encoder-decoder",
    name: "URL Encoder/Decoder",
    slug: "url-encoder-decoder",
    shortDescription: "Encode or decode URL components and full URLs.",
    longDescription:
      "Encode reserved characters in URL components or preserve URL separators when encoding a complete URL. Decode percent-encoded text with validation for malformed sequences.",
    icon: "link",
    category: "Developer",
  },
  {
    id: "timestamp-converter",
    name: "Timestamp Converter",
    slug: "timestamp-converter",
    shortDescription: "Convert dates to Unix timestamps and timestamps to dates.",
    longDescription:
      "Convert local dates and times to Unix seconds or milliseconds, or translate timestamps into UTC and local date formats. Choose seconds or milliseconds for input timestamps.",
    icon: "clock",
    category: "Developer",
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    slug: "hash-generator",
    shortDescription: "Generate SHA-256, SHA-384, or SHA-512 hashes in your browser.",
    longDescription:
      "Create a SHA-256, SHA-384, or SHA-512 hash from any text. Everything happens on your device, so your text is never sent anywhere. A hash can't be reversed and is not encryption.",
    icon: "hash",
    category: "Security",
  },
  {
    id: "unit-converter",
    name: "Unit Converter",
    slug: "unit-converter",
    shortDescription: "Convert length, mass, temperature, and data units.",
    longDescription:
      "Convert between common length, mass, temperature, and data-storage units. Decimal SI and binary IEC data units are labeled separately.",
    icon: "ruler",
    category: "Converters",
  },
  {
    id: "text-diff-checker",
    name: "Text Diff Checker",
    slug: "text-diff-checker",
    shortDescription: "Compare two text versions and review line-by-line changes.",
    longDescription:
      "Compare original and modified text to see added and removed lines highlighted side by side in a unified view. Copy the resulting diff when you are done.",
    icon: "gitCompare",
    category: "Text",
  },
  {
    id: "markdown-previewer",
    name: "Markdown Previewer",
    slug: "markdown-previewer",
    shortDescription: "Write Markdown and preview GitHub Flavored Markdown live.",
    longDescription:
      "Edit Markdown beside a live preview with support for GitHub Flavored Markdown tables, task lists, links, and code blocks. Raw HTML is disabled in the preview.",
    icon: "fileCode",
    category: "Developer",
  },
  {
    id: "csv-json-converter",
    name: "CSV & JSON Converter",
    slug: "csv-json-converter",
    shortDescription: "Convert CSV rows to JSON objects and JSON arrays to CSV.",
    longDescription:
      "Convert CSV with quoted fields into JSON arrays of objects, or convert JSON arrays of objects back into CSV. Data is processed locally in the browser.",
    icon: "table",
    category: "Developer",
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    slug: "image-compressor",
    shortDescription: "Compress PNG, JPEG, or WebP images in your browser.",
    longDescription:
      "Compress PNG, JPEG, and WebP images locally. Adjust target size, maximum dimensions, and output format, compare the result, and download the optimized image without uploading it.",
    icon: "image",
    category: "Images",
  },
  {
    id: "image-resizer",
    name: "Image Resizer",
    slug: "image-resizer",
    shortDescription: "Resize images by exact pixels or percentage.",
    longDescription:
      "Resize an image to custom pixel dimensions or scale it by percentage. Lock its aspect ratio, choose PNG, JPEG, or WebP, and preview and download the result locally.",
    icon: "imageResize",
    category: "Images",
  },
  {
    id: "image-cropper",
    name: "Image Cropper",
    slug: "image-cropper",
    shortDescription: "Crop images freely or to common aspect ratios.",
    longDescription:
      "Position and zoom an image inside a free, square, portrait, photo, widescreen, or story crop. Export the selected area as PNG, JPEG, or WebP.",
    icon: "imageCrop",
    category: "Images",
  },
  {
    id: "image-format-converter",
    name: "Image Format Converter",
    slug: "image-format-converter",
    shortDescription: "Convert images between PNG, JPEG, and WebP locally.",
    longDescription:
      "Convert supported images between PNG, JPEG, and WebP in your browser, adjust lossy output quality, compare file sizes, and download the converted image.",
    icon: "imageConvert",
    category: "Images",
  },
  {
    id: "background-remover",
    name: "Background Remover",
    slug: "background-remover",
    shortDescription: "Remove a sampled solid background color from an image.",
    longDescription:
      "Sample a solid background color from your image and remove matching pixels with adjustable tolerance and edge softness. This browser-based tool does not perform AI subject detection.",
    icon: "eraser",
    category: "Images",
  },
  {
    id: "image-upscaler",
    name: "Image Upscaler",
    slug: "image-upscaler",
    shortDescription: "Make images 2×, 3×, or 4× bigger with smooth results.",
    longDescription:
      "Make an image 2×, 3×, or 4× bigger and save it as PNG, JPEG, or WebP. The image is enlarged smoothly, but no AI is used, so details that weren't in the original can't be added.",
    icon: "upscale",
    category: "Images",
  },
  {
    id: "favicon-generator",
    name: "Favicon Generator",
    slug: "favicon-generator",
    shortDescription: "Create a favicon set and web manifest from one image.",
    longDescription:
      "Generate common favicon PNG sizes, a 32-pixel favicon.ico, and a web manifest from one image. Download the complete set as a ZIP archive.",
    icon: "favicon",
    category: "Images",
  },
  {
    id: "meme-generator",
    name: "Meme Generator",
    slug: "meme-generator",
    shortDescription: "Add customizable top and bottom captions to an image.",
    longDescription:
      "Create a meme with top and bottom text, adjustable caption size, and an optional uppercase style. Preview and download the finished JPEG locally.",
    icon: "captions",
    category: "Images",
  },
  {
    id: "screenshot-beautifier",
    name: "Screenshot Beautifier",
    slug: "screenshot-beautifier",
    shortDescription: "Frame screenshots in browser or phone mockups.",
    longDescription:
      "Place a screenshot in browser chrome, a phone frame, or a borderless canvas. Adjust the background, padding, and frame details, then export a PNG mockup.",
    icon: "deviceFrame",
    category: "Images",
  },
  {
    id: "image-metadata-viewer",
    name: "Image Metadata Viewer & Remover",
    slug: "image-metadata-viewer",
    shortDescription: "See a photo's hidden details (EXIF) and save a clean copy.",
    longDescription:
      "See the hidden details saved inside a photo, such as the camera, date taken, and GPS location. Then save a clean copy with those details removed. JPEG photos may look very slightly different after saving.",
    icon: "metadata",
    category: "Images",
  },
  {
    id: "social-image-resizer",
    name: "Social Media Image Resizer",
    slug: "social-image-resizer",
    shortDescription: "Resize images for common social media post dimensions.",
    longDescription:
      "Prepare images for Instagram posts and stories, Facebook posts, YouTube thumbnails, X posts, and LinkedIn covers. Choose fill-and-crop or fit-with-background, then download a JPEG.",
    icon: "socialResize",
    category: "Images",
  },
  {
    id: "pdf-merger",
    name: "PDF Merger",
    slug: "pdf-merger",
    shortDescription: "Combine multiple PDF files into one document.",
    longDescription:
      "Combine PDF files in the order you choose. Documents are processed locally in your browser and are not uploaded.",
    icon: "fileText",
    category: "Documents",
  },
  {
    id: "pdf-splitter",
    name: "PDF Splitter",
    slug: "pdf-splitter",
    shortDescription: "Extract selected pages into a new PDF.",
    longDescription:
      "Choose individual pages or page ranges to extract into a separate PDF. Page numbers start at 1, and files stay on your device.",
    icon: "fileText",
    category: "Documents",
  },
  {
    id: "pdf-compressor",
    name: "PDF Compressor",
    slug: "pdf-compressor",
    shortDescription: "Optimize PDF structure and compare file size.",
    longDescription:
      "Reserialize and optimize the PDF structure without reducing image quality. Size savings depend on the source file; embedded images are not downsampled.",
    icon: "fileText",
    category: "Documents",
  },
  {
    id: "pdf-to-images",
    name: "PDF to Images",
    slug: "pdf-to-images",
    shortDescription: "Export PDF pages as JPG or PNG images.",
    longDescription:
      "Render every page of a PDF to JPG or PNG images and download them together in a ZIP archive. Conversion happens locally in your browser.",
    icon: "image",
    category: "Documents",
  },
  {
    id: "images-to-pdf",
    name: "Images to PDF",
    slug: "images-to-pdf",
    shortDescription: "Combine JPG, PNG, and WebP images into a PDF.",
    longDescription:
      "Combine images in the selected order, with one image per PDF page. JPG, PNG, and WebP images are supported and processed locally.",
    icon: "image",
    category: "Documents",
  },
  {
    id: "pdf-page-rotator",
    name: "PDF Page Rotator",
    slug: "pdf-page-rotator",
    shortDescription: "Rotate all pages or selected pages in a PDF.",
    longDescription:
      "Rotate every page or specify page numbers and ranges to correct orientation. The original page content and quality are preserved.",
    icon: "fileText",
    category: "Documents",
  },
  {
    id: "pdf-metadata-remover",
    name: "PDF Metadata Remover",
    slug: "pdf-metadata-remover",
    shortDescription: "Remove author, title, dates, and other PDF metadata.",
    longDescription:
      "Remove hidden document details such as the author, title, and the program that created it, then download a clean PDF. Your file never leaves your device.",
    icon: "fileText",
    category: "Documents",
  },
  {
    id: "text-to-pdf",
    name: "Text to PDF",
    slug: "text-to-pdf",
    shortDescription: "Create a clean, paginated PDF from plain text.",
    longDescription:
      "Paste or type plain text to create a clean A4 PDF with readable margins and automatic page breaks. Text never leaves your browser.",
    icon: "fileText",
    category: "Documents",
  },
  {
    id: "docx-to-pdf",
    name: "DOCX to PDF",
    slug: "docx-to-pdf",
    shortDescription: "Convert a Word document to a downloadable PDF.",
    longDescription:
      "Convert a DOCX document into a downloadable PDF in your browser. Text and common formatting are retained; complex layouts may render differently.",
    icon: "fileText",
    category: "Documents",
  },
  {
    id: "pdf-to-text",
    name: "PDF to Text",
    slug: "pdf-to-text",
    shortDescription: "Extract selectable text from a PDF document.",
    longDescription:
      "Extract selectable text from each PDF page into a plain-text file. Scanned pages without a text layer require OCR and cannot be read by this tool.",
    icon: "fileText",
    category: "Documents",
  },
  {
    id: "video-upscaler",
    name: "Video Resolution Enhancer",
    slug: "video-upscaler",
    shortDescription:
      "Upscale videos to 720p, 1024 px, or 4K UHD in your browser.",
    longDescription:
      "Resize videos to 720p, a custom 1024-pixel height, or 4K UHD while keeping the original shape and sound.",
    icon: "video",
    category: "Videos",
  },
  {
    id: "bulk-image-processor",
    name: "Bulk Image Processor",
    slug: "bulk-image-processor",
    shortDescription:
      "Apply shared edits, create favicon sets, or inspect metadata across image batches.",
    longDescription:
      "Compress, resize, crop, convert, upscale, remove solid backgrounds, prepare social images, add captions or browser frames, inspect metadata, or create favicon sets for multiple images at once.",
    icon: "image",
    category: "Images",
  },
  {
    id: "bulk-document-processor",
    name: "Bulk Document Processor",
    slug: "bulk-document-processor",
    shortDescription:
      "Process multiple PDFs or Word documents and download the results as a ZIP.",
    longDescription:
      "Optimize, rotate, split, clean, or convert multiple PDF and DOCX files using one set of batch settings. Results are grouped into a ZIP archive.",
    icon: "fileText",
    category: "Documents",
  },
  {
    id: "bulk-video-upscaler",
    name: "Bulk Video Upscaler",
    slug: "bulk-video-upscaler",
    shortDescription:
      "Upscale multiple videos to 720p, 1024 pixels, or 4K and download one ZIP.",
    longDescription:
      "Choose up to 10 videos, select an output resolution, and process clips one at a time. Successful MP4 files are packaged together in a ZIP.",
    icon: "video",
    category: "Videos",
  },
  {
    id: "instagram-downloader",
    name: "Instagram Downloader",
    slug: "instagram-downloader",
    shortDescription: "Download public Instagram posts and reels from their links.",
    longDescription:
      "Paste links to public Instagram posts or reels, preview the photos and videos, and download each one straight to your device. Nothing is stored on our server.",
    icon: "download",
    category: "Downloads",
  },
  {
    id: "tiktok-downloader",
    name: "TikTok Downloader",
    slug: "tiktok-downloader",
    shortDescription: "Download public TikTok videos from links or a profile.",
    longDescription:
      "Paste public TikTok video links or a profile, preview the videos, and download each one straight to your device. Use this tool only for content you own or have permission to save.",
    icon: "download",
    category: "Downloads",
  },
  {
    id: "youtube-downloader",
    name: "YouTube Downloader",
    slug: "youtube-downloader",
    shortDescription: "Download YouTube audio, videos, or a public channel.",
    longDescription:
      "Preview public YouTube videos, a channel, or a playlist, then download MP3 audio or video with sound straight to your device. Nothing is stored on our server.",
    icon: "download",
    category: "Downloads",
  },
  {
    id: "facebook-downloader",
    name: "Facebook Downloader",
    slug: "facebook-downloader",
    shortDescription: "Download public Facebook videos from their links.",
    longDescription:
      "Paste links to public Facebook videos or posts, preview the media, and download each file straight to your device. Nothing is stored on our server.",
    icon: "download",
    category: "Downloads",
  },
  {
    id: "pinterest-downloader",
    name: "Pinterest Downloader",
    slug: "pinterest-downloader",
    shortDescription: "Download public Pinterest media from links or a profile.",
    longDescription:
      "Paste public pin links or a profile or board, preview the images and videos, and download each one straight to your device. Nothing is stored on our server.",
    icon: "download",
    category: "Downloads",
  },
  {
    id: "reddit-downloader",
    name: "Reddit Downloader",
    slug: "reddit-downloader",
    shortDescription: "Download public Reddit videos and images from post links.",
    longDescription:
      "Paste links to public Reddit posts, preview the media, and download each file straight to your device. Nothing is stored on our server.",
    icon: "download",
    category: "Downloads",
  },
  {
    id: "x-downloader",
    name: "X (Twitter) Downloader",
    slug: "x-downloader",
    shortDescription: "Download public X videos and images from post links.",
    longDescription:
      "Paste links to public X posts, preview the media, and download each file straight to your device. Nothing is stored on our server.",
    icon: "download",
    category: "Downloads",
  },
  {
    id: "website-media-downloader",
    name: "Website Media Downloader",
    slug: "website-media-downloader",
    shortDescription: "Download publicly available media from supported website pages.",
    longDescription:
      "Paste a link to a public webpage to preview and download the video or audio on it. Only download content you own or have permission to save. Private pages and pages that need a login don't work.",
    icon: "download",
    category: "Downloads",
  },
  {
    id: "palworld-breeding-calculator",
    name: "Palworld Breeding Calculator",
    slug: "palworld-breeding-calculator",
    shortDescription: "See which Pal two parents make, or find parents for the Pal you want.",
    longDescription:
      "Pick two parent Pals to see which Pal hatches from their egg, or pick the Pal you want and get every pair of parents that makes it. Special pairs and same-Pal breeding are included.",
    icon: "egg",
    category: "Games",
  },
];

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}

const toolSubcategories: Record<string, string> = {
  "qr-code-generator": "Codes & labels",
  "barcode-generator": "Codes & labels",
  "password-generator": "Passwords",
  "text-case-converter": "Writing",
  "word-counter": "Writing",
  "color-picker": "Color",
  "base64-encoder-decoder": "Encoding",
  "json-formatter": "Data",
  "uuid-generator": "Identifiers",
  "url-encoder-decoder": "Encoding",
  "timestamp-converter": "Date & time",
  "hash-generator": "Hashing",
  "unit-converter": "Measurements",
  "text-diff-checker": "Compare",
  "markdown-previewer": "Writing",
  "csv-json-converter": "Data",
  "image-compressor": "Optimize",
  "image-resizer": "Edit images",
  "image-cropper": "Edit images",
  "image-format-converter": "Edit images",
  "background-remover": "Edit images",
  "image-upscaler": "Optimize",
  "video-upscaler": "Enhance videos",
  "bulk-image-processor": "Batch images",
  "bulk-document-processor": "Batch documents",
  "bulk-video-upscaler": "Batch videos",
  "favicon-generator": "Create visuals",
  "meme-generator": "Create visuals",
  "screenshot-beautifier": "Create visuals",
  "image-metadata-viewer": "Image privacy",
  "social-image-resizer": "Social formats",
  "pdf-merger": "Page management",
  "pdf-splitter": "Page management",
  "pdf-page-rotator": "Page management",
  "pdf-compressor": "Optimize & protect",
  "pdf-metadata-remover": "Optimize & protect",
  "pdf-to-images": "Convert files",
  "images-to-pdf": "Convert files",
  "text-to-pdf": "Create documents",
  "docx-to-pdf": "Convert files",
  "pdf-to-text": "Convert files",
  "palworld-breeding-calculator": "Palworld",
};

export function getToolSubcategory(tool: Tool): string {
  return toolSubcategories[tool.slug] ?? "More tools";
}

const relatedCategories: Record<string, string[]> = {
  Generators: ["Developer", "Security"],
  Security: ["Developer", "Generators"],
  Text: ["Developer", "Converters"],
  Design: ["Images", "Generators"],
  Developer: ["Text", "Converters", "Security"],
  Converters: ["Documents", "Images", "Developer"],
  Images: ["Design", "Documents", "Videos"],
  Documents: ["Converters", "Images", "Videos"],
  Videos: ["Images", "Converters", "Documents"],
  Downloads: ["Videos", "Images"],
};

export function getRelatedCategories(category: string): string[] {
  return relatedCategories[category] ?? [];
}

export function getCategoryLinkLabel(category: string): string {
  const labels: Record<string, string> = {
    Generators: "code generators",
    Security: "security tools",
    Text: "text tools",
    Design: "design tools",
    Developer: "developer tools",
    Converters: "converters",
    Images: "image tools",
    Documents: "PDF tools",
    Videos: "video tools",
    Downloads: "download tools",
    Games: "game tools",
  };

  return labels[category] ?? `${category.toLowerCase()} tools`;
}

export function getRelatedTools(tool: Tool, limit = 4): Tool[] {
  const sameCategory = tools.filter(
    (candidate) => candidate.slug !== tool.slug && candidate.category === tool.category,
  );
  const complementary = getRelatedCategories(tool.category).flatMap((category) =>
    tools.filter((candidate) => candidate.category === category),
  );

  return [...sameCategory, ...complementary].slice(0, limit);
}

export function getCategorySlug(category: string): string {
  return category
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
}

export function getCategoryId(category: string): string {
  return `category-${getCategorySlug(category)}`;
}