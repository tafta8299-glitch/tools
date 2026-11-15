import { getRelatedTools, tools } from "@/data/tools";

type ArticleContent = {
  title: string;
  description: string;
  introduction: string;
  body: string;
};

export type BlogPost = ArticleContent & {
  slug: string;
  toolName: string;
  category: string;
};

const articleContent: Record<string, ArticleContent> = {
  "qr-code-generator": {
    title: "How to Make a QR Code for a Link or Contact",
    description:
      "Learn what to put in a QR code, how to create one, and how to test it before sharing or printing.",
    introduction:
      "A QR code is useful when someone needs to move from a printed page, package, or screen to a link or short piece of information. The destination matters more than the graphic: decide what a person should see after scanning, then encode only that information.",
    body: `## Choose the right content first

Use a website address when the goal is to open a page. Plain text works for a short note, while contact details are better when the recipient should save information rather than retype it. Keep the destination current: a printed code can remain in circulation long after a temporary campaign ends.

## Create and test the code

Open the [QR Code Generator](/tools/qr-code-generator), enter the link, message, or contact information, and create the code. Scan the result with a phone before sharing it. Test the final printed or resized version too; a code that scans on a large monitor may be difficult to read on a small label.

## Before publishing

Leave clear space around the code and maintain strong contrast with its background. Avoid placing it over a busy image. QR codes do not make a destination trustworthy or private, so use a link you control and tell people where it leads. For product identification rather than opening a web destination, see the [barcode guide](/blog/barcode-generator).`,
  },
  "barcode-generator": {
    title: "Choosing a Barcode Format for Labels and Products",
    description:
      "Compare common barcode formats and learn how to create and check a barcode for a label or inventory workflow.",
    introduction:
      "The best barcode format depends on the system that needs to read it. A symbol can look correct and still fail at checkout or in an inventory app if its encoding does not match the scanner or the receiving platform's requirements.",
    body: `## Match the format to the workflow

Code 128 and Code 39 are common choices for internal labels and general identification. EAN-13, EAN-8, and UPC-A are used for retail product numbering, while ITF-14 is used on some shipping cartons. A barcode image does not assign an official retail identifier; obtain numbers through the appropriate issuing organization when selling through systems that require them.

## Generate and verify

Use the [Barcode Generator](/tools/barcode-generator) to select a supported format, enter the value, adjust its appearance, and download SVG artwork. Check the required length and allowed characters for the selected standard. Scan the exported artwork at its intended print size and confirm the decoded value exactly matches the source.

## Prepare a readable label

Keep bars sharp, preserve the blank margins at either end, and avoid stretching the SVG non-proportionally. If a scanner rejects the code, first check the symbology and value rules, then inspect contrast and print quality. For a code that opens a webpage or message, use a [QR code](/blog/qr-code-generator) instead.`,
  },
  "password-generator": {
    title: "How to Generate a Strong Random Password",
    description:
      "Choose a password length and character set, avoid predictable patterns, and store generated passwords safely.",
    introduction:
      "A randomly generated password is most useful when it is unique to one account and long enough to resist guessing. Reusing a memorable variation across sites turns one compromised login into a risk for other accounts.",
    body: `## Set length and character options

Open the [Password Generator](/tools/password-generator), choose a length that the destination accepts, and select the character groups it supports. Longer passwords generally provide more possible combinations. Excluding look-alike characters can help when a password must be read aloud or typed manually, but it reduces the character pool slightly.

## Use the result safely

Generate a new value for each account and save it in a reputable password manager. Do not send it in chat or reuse it for recovery questions. If a site rejects the result, check its maximum length and character restrictions rather than shortening passwords everywhere.

## What this tool does not do

The generator creates a password in your browser; it does not assess a website's security or protect an account after you paste the result elsewhere. A password manager and multi-factor authentication add important protections. For a different security task, the [hash generator](/blog/hash-generator) creates a one-way digest, not a login password.`,
  },
  "text-case-converter": {
    title: "Convert Text Between Title, Sentence, and Code Case",
    description:
      "Learn when to use title case, sentence case, camelCase, snake_case, and other text formats.",
    introduction:
      "Case conventions make writing consistent and help identifiers fit the systems that consume them. Converting a draft is quick, but the right output depends on whether the text is a heading, a sentence, a variable name, or a URL component.",
    body: `## Pick a format for its intended use

Use sentence case for ordinary prose, title case for headings that follow your style guide, and uppercase or lowercase when a destination requires it. In code, camelCase and PascalCase are common identifier styles; snake_case and kebab-case are readable alternatives used by different languages and tools.

## Convert and review

Paste or type text into the [Text Case Converter](/tools/text-case-converter), select the target case, and review the result before copying it. Check acronyms, product names, and words with intentional capitalization because a mechanical conversion cannot know your editorial exceptions.

## Keep meaning intact

Case conversion changes letter casing, not grammar or punctuation. It will not rewrite a sentence or guarantee that a generated identifier is valid in a particular programming language. For text length checks, use the [Word Counter](/blog/word-counter); to compare a before-and-after draft, use the [Text Diff Checker](/blog/text-diff-checker).`,
  },
  "word-counter": {
    title: "How to Check Word Count, Character Count, and Reading Time",
    description:
      "Understand word and character counts, paragraph totals, and estimated reading time for a draft.",
    introduction:
      "Word limits appear in applications, briefs, captions, and publishing systems, but each may count text differently. Check the exact requirement before trimming: a character limit is not the same as a word limit, and spaces may or may not count.",
    body: `## Measure a draft

Paste or type your text into the [Word Counter](/tools/word-counter). The totals update as you edit and include words, characters with and without spaces, sentences, paragraphs, and an estimated reading time. Use the matching count for the destination's stated limit.

## Use the estimate as a guide

Reading time is an estimate based on a typical reading pace, not a promise about how quickly every person will finish. Headings, lists, technical terms, and tables can change the pace. For a form with a strict maximum, check whether it counts punctuation, line breaks, or spaces and compare its own counter if available.

## Refine without losing the draft

Keep a copy of important text before making large edits. If you are shortening a paragraph, the [Text Case Converter](/blog/text-case-converter) can normalize capitalization, while the [Text Diff Checker](/blog/text-diff-checker) can show exactly what changed between versions.`,
  },
  "color-picker": {
    title: "Convert a Color Between HEX, RGB, and HSL",
    description:
      "Pick or enter a HEX color, inspect its RGB and HSL values, and copy the format your design workflow needs.",
    introduction:
      "Color values are often shared between design files, CSS, and documentation. HEX, RGB, and HSL describe the same color in different ways, so converting between them helps teams use the format their current tool expects.",
    body: `## Choose a color and inspect its values

Use the visual control in the [Color Picker](/tools/color-picker) or enter a three- or six-digit HEX value. The tool previews the color and shows its HEX, RGB, and HSL representations. Copy the format that matches the target field rather than retyping the numbers.

## Know which representation to use

HEX is compact and common in CSS. RGB describes red, green, and blue channel values, which can be convenient in code or graphics tools. HSL expresses hue, saturation, and lightness, which can make it easier to reason about variations while adjusting a palette.

## Check color in context

A color swatch alone does not guarantee readable text or accessible contrast. Review foreground and background colors together and test the interface at its real size. To prepare an image asset after picking a color, see the [Image Format Converter](/blog/image-format-converter).`,
  },
  "base64-encoder-decoder": {
    title: "Encode and Decode UTF-8 Text with Base64",
    description:
      "Convert UTF-8 text to standard or URL-safe Base64 and understand why Base64 is not encryption.",
    introduction:
      "Base64 represents binary data using text characters. It is useful when a protocol or data format expects a textual representation, but it is not a way to hide information: anyone can decode it.",
    body: `## Choose the correct Base64 variant

Use the [Base64 Encoder/Decoder](/tools/base64-encoder-decoder) to encode UTF-8 text or decode a Base64 string. Standard Base64 uses characters that may need escaping in URLs. URL-safe Base64 replaces those characters for safer transport in URL contexts. Choose the variant expected by the system receiving the data.

## Validate what you receive

Paste the complete encoded value and decode it. Invalid input should be treated as malformed rather than as meaningful plain text. When working with files or binary payloads, remember that this tool is for text conversion; encoding also increases the representation's size.

## Do not treat it as protection

Base64 does not encrypt, hash, authenticate, or secure a value. Never use it to store secrets safely. Use HTTPS and an appropriate encryption mechanism when confidentiality is required. For a one-way text digest, see the [Hash Generator](/blog/hash-generator).`,
  },
  "json-formatter": {
    title: "Format and Validate JSON Without Losing the Original",
    description:
      "Paste JSON, catch parse errors, format it with consistent indentation, or minify it for compact output.",
    introduction:
      "Compact JSON is difficult to inspect by eye, while inconsistent indentation makes reviews noisy. Formatting helps you see the structure; validation catches syntax errors before a file is sent to an API or checked into a project.",
    body: `## Format or minify a JSON value

Paste the text into the [JSON Formatter](/tools/json-formatter), choose two- or four-space indentation, and format it. The validator reports parsing problems with a useful error and, when available, a line and column. Use minify when a compact representation is needed; keep the formatted version for review and editing.

## Fix common syntax issues

Check for trailing commas, missing quotation marks around property names, mismatched braces, and comments. Standard JSON does not allow JavaScript expressions or comments. A formatter can identify invalid syntax but cannot determine whether the data has the right fields or values for your application.

## Protect sensitive payloads

This formatter works in the browser, but still avoid pasting credentials or personal data into tools unless you are comfortable with the environment. To convert tabular data, use the [CSV and JSON Converter](/blog/csv-json-converter).`,
  },
  "uuid-generator": {
    title: "Generate UUID Version 4 Values for Software Projects",
    description:
      "Create random UUID v4 identifiers in batches and learn where unique IDs are useful.",
    introduction:
      "A UUID is a widely used identifier that can be generated without asking a central service for the next number. UUID version 4 is random, which makes it useful for records and objects that need a practical, globally unique-looking ID.",
    body: `## Generate one or a batch

Open the [UUID Generator](/tools/uuid-generator), choose how many values to create, and generate up to 100 UUID v4 identifiers at once. Copy an individual value or the full batch. Keep the original identifier unchanged after it has been stored or referenced elsewhere.

## Use identifiers consistently

UUIDs can identify database rows, test records, files, and distributed objects. They are not a replacement for access controls, and a UUID should not be treated as a secret token. Choose one format and preserve it consistently across storage, APIs, and logs.

## Avoid unnecessary regeneration

Generating a replacement ID after it has been published breaks references to the earlier value. If you need a digest of content rather than a random identifier, use the [Hash Generator](/blog/hash-generator); hashes and UUIDs solve different problems.`,
  },
  "url-encoder-decoder": {
    title: "When to Encode a URL and When to Encode a URL Component",
    description:
      "Encode reserved characters in URL components or preserve separators when encoding a complete URL.",
    introduction:
      "URLs have structural separators such as slashes, question marks, and ampersands. Encoding an entire address as if it were one value can hide that structure; encoding a parameter value without escaping its reserved characters can break the address.",
    body: `## Choose component or full-URL mode

Use the [URL Encoder/Decoder](/tools/url-encoder-decoder) to encode a single value such as a search term, filename, or query parameter. Choose the full-URL option when you need to preserve URL separators while encoding other characters. Decode percent-encoded text when you need to inspect it.

## Check the result in context

Encode each parameter value once before inserting it into a URL. Re-encoding already encoded text can turn percent signs into additional escape sequences. Do not encode a whole URL component when the receiving system expects the original separators to remain meaningful.

## Handle untrusted links carefully

Decoding a URL does not verify that its destination is safe. Inspect the hostname and only open links you trust. For related text representation work, read the [Base64 guide](/blog/base64-encoder-decoder); Base64 and percent encoding are different schemes.`,
  },
  "timestamp-converter": {
    title: "Convert Unix Timestamps to Readable Dates",
    description:
      "Convert local dates to Unix seconds or milliseconds and inspect timestamps as UTC or local time.",
    introduction:
      "Unix timestamps represent time as a count from an epoch, which is convenient for software but not for reading. The most common source of confusion is unit scale: a timestamp in seconds is much shorter than one in milliseconds.",
    body: `## Convert in the right unit

Use the [Timestamp Converter](/tools/timestamp-converter) to turn a local date and time into Unix seconds or milliseconds. To convert in the other direction, select the matching unit for the input value and compare the UTC and local date output. A value off by a factor of one thousand is often a seconds-versus-milliseconds mismatch.

## Account for time zones

UTC is a shared reference and does not change with daylight saving time. Local time depends on the device's configured time zone and may shift seasonally. When debugging logs or APIs, use the time zone expected by the source before comparing events.

## Check valid ranges

Confirm that the input is numeric and represents the intended date range. A timestamp converter does not infer the unit reliably for every value. For measurement conversions such as data units, use the [Unit Converter](/blog/unit-converter).`,
  },
  "hash-generator": {
    title: "Generate a SHA-2 Hash from Text in Your Browser",
    description:
      "Create SHA-256, SHA-384, or SHA-512 digests and understand what a cryptographic hash can and cannot do.",
    introduction:
      "A cryptographic hash maps input to a fixed-size digest. Even a small change to the text produces a different result, which can help with comparison and integrity workflows. A hash is one-way and is not encryption.",
    body: `## Select a digest algorithm

Enter text in the [Hash Generator](/tools/hash-generator) and choose SHA-256, SHA-384, or SHA-512. The hash is created on your device, so your text is never sent anywhere. Copy the result and compare it with a digest produced by the system you are checking; both sides must hash the exact same bytes and text encoding.

## Use hashes appropriately

Hashes can identify whether content changed when you have a trusted expected digest. They do not prove who created the content unless paired with a signature or another trusted mechanism. Do not use a plain hash as password storage; password storage needs a dedicated slow password-hashing scheme with salts.

## Keep the distinction clear

You cannot recover the original input from a hash. If you need reversible text representation, use the [Base64 Encoder/Decoder](/blog/base64-encoder-decoder), which is encoding and provides no confidentiality.`,
  },
  "unit-converter": {
    title: "Convert Length, Mass, Temperature, and Data Units",
    description:
      "Convert common measurement and data units while keeping SI and binary IEC prefixes distinct.",
    introduction:
      "Unit conversion is straightforward only when the source and target units mean what you think they mean. Temperature uses different zero points, and data sizes may use decimal SI prefixes or binary IEC prefixes.",
    body: `## Select a category and units

Choose length, mass, temperature, or data storage in the [Unit Converter](/tools/unit-converter). Enter the source value and select both units. Check the labels before using the result, especially when converting data quantities between KB/MB and KiB/MiB.

## Watch temperature and data prefixes

Temperature conversion is not just a change of scale because Celsius, Fahrenheit, and Kelvin have different zero points. For data, decimal SI units use powers of 1,000, while binary IEC units use powers of 1,024. A result can be numerically correct and still be wrong for your purpose if the chosen convention differs from the one expected.

## Verify context and rounding

Keep enough precision for the task and round only when presenting a result. This utility covers common units; it is not a substitute for domain-specific engineering or regulated calculations. For Unix time values, use the [Timestamp Converter](/blog/timestamp-converter).`,
  },
  "text-diff-checker": {
    title: "Compare Two Text Versions and Find Every Change",
    description:
      "Compare original and revised text to identify added and removed lines before sharing a document or code change.",
    introduction:
      "When a document has been revised, rereading both copies from the beginning makes small changes easy to miss. A diff highlights additions and removals so you can review what changed rather than relying on memory.",
    body: `## Compare the original and revised text

Paste the earlier version in the original field and the newer version in the modified field of the [Text Diff Checker](/tools/text-diff-checker). Review the highlighted additions and removals in the unified view, then copy the diff if you need to include it in a review or message.

## Make the comparison meaningful

Use complete, comparable text and keep unrelated formatting changes out of the revision when possible. Line breaks affect line-by-line comparisons, so normalize them if the two sources use different conventions. A diff reports textual changes; it does not judge whether a change is correct or safe.

## Useful review workflows

Compare policy edits, release notes, configuration snippets, or two drafts before publishing. For a simple capitalization cleanup, the [Text Case Converter](/blog/text-case-converter) can normalize a copy before you compare it.`,
  },
  "markdown-previewer": {
    title: "Write and Preview GitHub Flavored Markdown",
    description:
      "Preview Markdown headings, tables, task lists, links, and code blocks before publishing or sharing.",
    introduction:
      "Markdown keeps source text readable while adding structure for documentation and discussions. A live preview helps catch formatting problems before a README, issue, or guide is published.",
    body: `## Draft with common Markdown syntax

Type in the editor of the [Markdown Previewer](/tools/markdown-previewer) and review the rendered pane. Use headings to organize sections, blank lines to separate paragraphs, backticks for code, and fenced blocks for longer examples. GitHub Flavored Markdown adds tables and task lists.

## Check the rendered output

Preview long links, lists, nested sections, and code blocks rather than judging only the source. Copy the Markdown when ready. Raw HTML is disabled in this preview, so use Markdown features instead of relying on embedded HTML.

## Keep content portable

Some publishing systems support different Markdown extensions. If a table or task list does not render elsewhere, check that destination's Markdown flavor. For structured data examples, validate the JSON with the [JSON Formatter](/blog/json-formatter) before adding it to a document.`,
  },
  "csv-json-converter": {
    title: "Convert CSV Rows to JSON and JSON Arrays to CSV",
    description:
      "Transform CSV with quoted fields into JSON objects and convert arrays of objects back to CSV.",
    introduction:
      "CSV and JSON represent tabular data differently. Converting between them is useful when a spreadsheet export needs to feed an API or when structured records need to be opened in a spreadsheet.",
    body: `## Convert CSV to JSON

Paste CSV into the [CSV and JSON Converter](/tools/csv-json-converter) and run the CSV-to-JSON conversion. Quoted fields can contain commas, so do not split rows manually on every comma. Check that the first row is interpreted as column names and that each resulting object has the fields you expect.

## Convert JSON to CSV

Provide an array of objects to create CSV rows. Review the property names and verify that records use a consistent set of fields; irregular nested objects may not map cleanly to a flat table. Open the exported text in your destination and confirm columns line up as expected.

## Check before using the data

Conversion changes representation, not meaning. Dates, leading zeros, empty fields, and spreadsheet formulas deserve particular care. The tool processes data in the browser. For JSON syntax errors, use the [JSON Formatter](/blog/json-formatter) first.`,
  },
  "image-compressor": {
    title: "How to Compress an Image Without Guessing at Quality",
    description:
      "Reduce image file size, set dimensions and output format, then compare the compressed result before downloading.",
    introduction:
      "Large images can slow page loads and exceed upload limits. Compression is a balance between file size, pixel dimensions, and visible quality; the right target depends on where the image will be used.",
    body: `## Set a target and inspect the preview

Choose a PNG, JPEG, or WebP file in the [Image Compressor](/tools/image-compressor). Select a target file size, maximum dimension, and output format, then compress. Compare the original and compressed previews before downloading. If text or fine edges look soft, raise the size target or use a less aggressive dimension limit.

## Choose an output format

Keep the original format when compatibility matters. WebP can reduce size for many web images, while PNG is useful where lossless edges or transparency matter. JPEG suits many photographs but does not preserve transparency. Check the actual output because savings depend on the source image.

## Keep a source copy

Compression may discard detail, especially with lossy formats. Preserve the original when you may need to make a different export later. To change dimensions without targeting file size, use the [Image Resizer](/blog/image-resizer).`,
  },
  "image-resizer": {
    title: "Resize an Image to Exact Pixels or by Percentage",
    description:
      "Set image dimensions in pixels or scale by percentage while preserving the aspect ratio when needed.",
    introduction:
      "Image dimensions affect how an asset fits a page, profile, slide, or print layout. Resizing changes pixel dimensions; it does not necessarily improve image detail or reduce file size by itself.",
    body: `## Choose the output dimensions

Load an image in the [Image Resizer](/tools/image-resizer) and enter exact pixel dimensions or choose a percentage. Lock the aspect ratio when you want to keep the original proportions. If the destination specifies a required width and height, check whether it expects a crop rather than stretching.

## Select a format and review

Choose PNG, JPEG, or WebP, then inspect the preview before downloading. PNG retains transparency; JPEG does not. WebP can be a compact option when the destination supports it. Enlarging a small source creates more pixels but cannot restore details that were not captured.

## Avoid distortion

Keep the ratio locked for photographs and most artwork. If an exact shape is required, crop first or use a fit mode rather than forcing unrelated proportions. For reducing image file size, the [Image Compressor](/blog/image-compressor) offers a target-size workflow.`,
  },
  "image-cropper": {
    title: "Crop an Image to a Square, Portrait, or Custom Ratio",
    description:
      "Position and zoom an image, choose a common crop ratio, and export the selected area in a supported format.",
    introduction:
      "Cropping changes which part of an image remains visible. A fixed aspect ratio helps fit common placements, while a free crop is useful when composition matters more than matching a preset.",
    body: `## Frame the subject

Open an image in the [Image Cropper](/tools/image-cropper), select a free crop or a preset ratio, then position and zoom until the subject fits. Check the edges for clipped faces, text, or important context before exporting.

## Match the destination

Square, portrait, photo, widescreen, and story ratios serve different layouts. Confirm the target platform's current dimensions before preparing a batch of assets. A ratio alone does not guarantee that a platform will display the whole image without further cropping.

## Export and inspect

Choose PNG, JPEG, or WebP and review the exported crop. PNG can preserve transparency where present; JPEG is broadly compatible but does not. If the whole image should remain visible at new dimensions, use the [Image Resizer](/blog/image-resizer) instead.`,
  },
  "image-format-converter": {
    title: "Convert an Image Between PNG, JPEG, and WebP",
    description:
      "Choose an image output format, adjust lossy quality where available, and compare file sizes before downloading.",
    introduction:
      "Different image formats make different tradeoffs. PNG supports lossless graphics and transparency, JPEG is widely supported for photos, and WebP is a modern option for web delivery when the destination accepts it.",
    body: `## Convert and choose quality

Load an image in the [Image Format Converter](/tools/image-format-converter), choose PNG, JPEG, or WebP, and adjust lossy output quality when available. Compare the resulting file size with the source before downloading. The smaller file is not always the better choice if important detail is lost.

## Preserve the properties you need

JPEG cannot carry transparency, so transparent pixels need a background when converting to JPEG. PNG can preserve transparency but may be larger for photographs. Check how your website, editor, or destination handles WebP before converting a file used in a compatibility-sensitive workflow.

## Keep originals for future edits

Re-encoding a lossy image can reduce quality further. Save an original master and create delivery copies from it. If you need to change dimensions as well as format, see the [Image Resizer](/blog/image-resizer).`,
  },
  "background-remover": {
    title: "Remove a Solid Color Background from an Image",
    description:
      "Sample a background color and tune tolerance and edge softness to remove matching pixels in the browser.",
    introduction:
      "A simple solid backdrop can often be made transparent by selecting its color and removing nearby pixels. This approach works best when the background is uniform and clearly different from the subject.",
    body: `## Sample the background carefully

Load an image in the [Background Remover](/tools/background-remover) and sample a representative area of the solid background. Adjust tolerance to include pixels that vary slightly from the sample, then tune edge softness to reduce a hard outline. Preview several parts of the subject while adjusting.

## Know when this method works

This tool removes matching color pixels; it does not use AI subject detection. Busy scenes, shadows, gradients, and subjects that share the background color can leave artifacts or remove parts of the subject. A clean, evenly lit backdrop gives the most predictable result.

## Export and check transparency

Inspect fine edges such as hair, glass, or thin lines against both light and dark backgrounds. Choose a format that supports transparency when needed. For a straightforward crop or dimension change, use the [Image Cropper](/blog/image-cropper) or [Image Resizer](/blog/image-resizer).`,
  },
  "image-upscaler": {
    title: "Enlarge an Image 2x, 3x, or 4x in Your Browser",
    description:
      "Make an image bigger and learn why enlarging it can't add detail that was never there.",
    introduction:
      "Upscaling makes an image bigger so it fits a larger screen or layout. The tool fills in the new pixels smoothly based on the ones around them, but it can't bring back detail that wasn't in the original photo.",
    body: `## Choose a scale factor

Load an image in the [Image Upscaler](/tools/image-upscaler), select 2x, 3x, or 4x, and choose PNG, JPEG, or WebP for export. Preview the result at its intended display size. A moderate scale can be more natural than enlarging a very small source by the maximum factor.

## Set realistic expectations

This is smooth enlargement, not AI. Small text and fine textures may look a little soft, and a bigger image usually means a bigger file. Start with the highest-resolution source available when clarity matters.

## Prepare the final asset

Check dimensions and file size before uploading or publishing. If you need a particular output size instead, use the [Image Resizer](/blog/image-resizer); for reducing a large result, try the [Image Compressor](/blog/image-compressor).`,
  },
  "favicon-generator": {
    title: "Create a Favicon Set and Web Manifest from One Image",
    description:
      "Generate common favicon sizes, a favicon.ico, and a web manifest, then add the downloaded assets to a site.",
    introduction:
      "A favicon appears in browser tabs, bookmarks, and other browser surfaces. Preparing several sizes from one source image helps a site provide compatible icons without manually exporting every dimension.",
    body: `## Start with a simple source image

Choose a clear square image in the [Favicon Generator](/tools/favicon-generator). Small icons have little room for detail, so use a recognizable shape with enough contrast and avoid tiny text. Review how the mark reads when reduced.

## Generate and install the files

Generate the favicon PNG sizes, 32-pixel ` + "`favicon.ico`" + `, and web manifest, then download the ZIP archive. Add the files to your website's public assets and use the generated manifest and icon references in the appropriate page metadata or HTML. Check the paths after deployment; missing files are a common cause of blank tab icons.

## Test across browsers

Open the deployed site in more than one browser and refresh its favicon cache if an older icon remains. This tool prepares assets; it does not configure your website automatically. For resizing a source graphic before generation, use the [Image Resizer](/blog/image-resizer).`,
  },
  "meme-generator": {
    title: "Make a Meme with Custom Top and Bottom Captions",
    description:
      "Add top and bottom captions, adjust text appearance, preview the meme, and download a JPEG locally.",
    introduction:
      "A meme caption needs to remain readable over the image at the size where it will be shared. Previewing the finished composition helps balance text length, placement, and contrast before exporting.",
    body: `## Add an image and write captions

Choose an image in the [Meme Generator](/tools/meme-generator), enter optional top and bottom text, and adjust caption size and weight. Toggle uppercase styling if it fits the design. Keep each line concise so the message remains legible on mobile screens.

## Tune text and background

Choose text and background colors, then enable a background shape if the image makes the caption hard to read. Try the available none, rounded, pill, square, or banner treatments. Preview the entire image, including the edges, before creating the final version.

## Export responsibly

Download the result as a JPEG and check its appearance after export. Use images you have permission to edit and share, especially for commercial use. For framed product or app images, see the [Screenshot Beautifier](/blog/screenshot-beautifier).`,
  },
  "screenshot-beautifier": {
    title: "Frame a Screenshot in a Browser or Phone Mockup",
    description:
      "Place a screenshot in browser chrome, a phone frame, or a clean canvas and export a PNG mockup.",
    introduction:
      "A product screenshot can be easier to understand when it is shown inside a familiar device or browser frame. A consistent frame and background also help screenshots look intentional in presentations and launch materials.",
    body: `## Choose a frame and add your screenshot

Load an image in the [Screenshot Beautifier](/tools/screenshot-beautifier) and choose browser chrome, a phone frame, or a borderless canvas. Adjust background and padding so the screenshot remains the focal point rather than being crowded by decoration.

## Prepare a useful presentation image

Use a screenshot at a resolution appropriate for the final export. Keep important interface text readable and avoid cropping out context needed to understand the screen. The frame is a visual presentation, not a functional device mockup.

## Export and review

Export a PNG and inspect it at the size where it will appear. Check that the background and frame contrast with the screenshot. For sizing social media artwork, use the [Social Media Image Resizer](/blog/social-image-resizer).`,
  },
  "image-metadata-viewer": {
    title: "Inspect and Remove EXIF Metadata from an Image",
    description:
      "See the hidden details stored in a photo, like camera, date, and location, then save a clean copy without them.",
    introduction:
      "Photos can contain more than visible pixels. Metadata may describe the camera, capture settings, time, or location, so inspect a file before sharing it when those details matter.",
    body: `## Inspect what the image contains

Open a photo in the [Image Metadata Viewer and Remover](/tools/image-metadata-viewer) and look through its hidden details. Pay special attention to the location, the date and time, and the camera or phone model. Not every photo has every detail.

## Save a clean copy

Save a new copy with all hidden details removed. Keep the original if you might need those details later. JPEG photos can look very slightly different after saving, so compare the copy before replacing the original.

## Verify before sharing

Inspect the exported copy again when metadata removal is important to your workflow. Metadata removal does not hide visible information in the image or guarantee removal of every possible nonstandard payload. To convert the image format as well, use the [Image Format Converter](/blog/image-format-converter).`,
  },
  "social-image-resizer": {
    title: "Resize Images for Social Media Posts and Covers",
    description:
      "Prepare images for common Instagram, Facebook, YouTube, X, and LinkedIn dimensions with crop or fit modes.",
    introduction:
      "Social platforms use different image shapes for feed posts, stories, thumbnails, and cover images. Starting with the right aspect ratio reduces accidental cropping and keeps important text inside the visible area.",
    body: `## Select a destination format

Open the [Social Media Image Resizer](/tools/social-image-resizer), choose the target placement, and load your image. Select fill-and-crop when the canvas should be covered or fit-with-background when the full image must remain visible. Check the current platform requirements before preparing a campaign because specifications can change.

## Review safe placement

Keep faces, logos, and essential text away from edges that may be cropped in previews or responsive layouts. Compare the result at phone size, not only on a large desktop. A platform can display a thumbnail differently from the full post.

## Export a share-ready copy

Download the JPEG and keep your original master for other formats. If you need a device or browser frame rather than a platform size, use the [Screenshot Beautifier](/blog/screenshot-beautifier).`,
  },
  "pdf-merger": {
    title: "Combine Multiple PDF Files into One Document",
    description:
      "Merge PDFs in a chosen order, check the resulting pages, and keep processing on your device.",
    introduction:
      "Combining related PDFs makes a packet easier to send, archive, or review. The order matters: arrange the source documents in the sequence a reader should encounter them before exporting.",
    body: `## Arrange the source files

Open the [PDF Merger](/tools/pdf-merger), add the PDFs you want to combine, and arrange them in the intended reading order. Check that each file opens and contains the pages you expect before starting the merge.

## Review the merged document

Download the combined PDF and check its page count, orientation, and beginning and end. Merging joins documents; it does not rewrite their content or guarantee that forms, bookmarks, or unusual embedded features behave identically in every reader.

## Handle sensitive files carefully

Files are processed locally in the browser and are not uploaded by this tool. Save the output with a clear filename and keep originals until you have confirmed the merged packet. To extract selected pages instead, use the [PDF Splitter](/blog/pdf-splitter).`,
  },
  "pdf-splitter": {
    title: "Extract Selected Pages from a PDF",
    description:
      "Choose individual PDF pages or page ranges, export them as a new file, and verify page numbering.",
    introduction:
      "A long PDF is not always the right thing to send. Extracting only the relevant pages can make a review packet smaller and easier to navigate, provided the page numbers are selected carefully.",
    body: `## Select the pages you need

Load a file in the [PDF Splitter](/tools/pdf-splitter) and enter individual page numbers or ranges. Page numbering starts at 1. Double-check the range against the document's actual page order, especially when its printed page labels differ from its PDF page positions.

## Export and check the result

Create the new PDF, then open it and verify the first and last extracted pages and the total page count. The tool extracts existing pages; it does not summarize their contents or perform OCR on scanned pages.

## Keep the source intact

Splitting does not delete pages from the original. Keep the complete source if you may need additional pages later. If the goal is to join several files, use the [PDF Merger](/blog/pdf-merger).`,
  },
  "pdf-compressor": {
    title: "Optimize a PDF and Check Whether Its File Size Changes",
    description:
      "Reserialize and optimize PDF structure, then compare sizes while understanding that embedded images are not downsampled.",
    introduction:
      "PDF size depends on its structure, fonts, images, and other embedded resources. Rewriting the document structure can help some files, but it cannot guarantee a large reduction when most of the bytes come from images.",
    body: `## Optimize and compare

Choose a file in the [PDF Compressor](/tools/pdf-compressor) and run the optimization. Compare the original and output file sizes rather than assuming the result will always be smaller. Savings depend on the source structure.

## Understand what is preserved

This tool reserializes and optimizes PDF structure without reducing image quality; embedded images are not downsampled. If scanned pages or photos dominate the file, the size may change very little. Avoid describing the result as image compression when the image data remains at its original resolution.

## Check important documents

Open the optimized file and inspect representative pages, fonts, and links before sharing it. Keep the source until the output is confirmed. To remove document properties instead, use the [PDF Metadata Remover](/blog/pdf-metadata-remover).`,
  },
  "pdf-to-images": {
    title: "Export PDF Pages as JPG or PNG Images",
    description:
      "Render PDF pages to JPG or PNG, compare quality and size, and download all pages together in a ZIP.",
    introduction:
      "A PDF page can be easier to preview or reuse as an image in a slide, message, or visual reference. Rendering turns each page into pixels, so text is no longer selectable in the exported image.",
    body: `## Render pages from a PDF

Load the document in [PDF to Images](/tools/pdf-to-images), choose JPG or PNG, and render the pages. The tool exports every page and packages the images in a ZIP archive. Extract the archive and inspect the filenames and page sequence.

## Choose an image format

PNG is useful for sharp text and diagrams; JPG can produce smaller files for photographic pages. Rendering resolution affects readability and file size, so zoom in on small text before using an image in a presentation or document.

## Know the tradeoff

Images are not a replacement for the original searchable PDF, and page text cannot be selected from the rendered pixels. Keep the PDF when accessibility or text search matters. To combine image files into a document, see [Images to PDF](/blog/images-to-pdf).`,
  },
  "images-to-pdf": {
    title: "Combine JPG, PNG, and WebP Images into a PDF",
    description:
      "Arrange supported images in order, create one PDF page per image, and review the exported document.",
    introduction:
      "Turning a set of image files into one PDF makes a sequence easier to share and print. Decide the page order first, because the order of source images determines how the document reads.",
    body: `## Add and order the images

Choose JPG, PNG, or WebP files in [Images to PDF](/tools/images-to-pdf) and arrange them in the desired sequence. The tool creates one PDF page per image. Confirm the order before exporting, especially when filenames do not sort naturally.

## Check the page appearance

Open the resulting PDF and review orientation, margins, and image placement. Images with different aspect ratios may occupy page space differently. If a file looks soft, use a higher-resolution source rather than enlarging a small image before conversion.

## Preserve the originals

The PDF is a convenient container, not an editable replacement for the source images. Files are processed locally in the browser. To render an existing PDF back into page images, use [PDF to Images](/blog/pdf-to-images).`,
  },
  "pdf-page-rotator": {
    title: "Rotate All or Selected Pages in a PDF",
    description:
      "Correct PDF page orientation by rotating the whole document or specifying page numbers and ranges.",
    introduction:
      "A sideways scan or mixed-orientation packet can interrupt reading and printing. Rotating the affected pages corrects their displayed orientation without needing to recreate the document.",
    body: `## Choose the scope of rotation

Load a PDF in the [PDF Page Rotator](/tools/pdf-page-rotator) and choose to rotate all pages or specify page numbers and ranges. Page numbering starts at 1. Check the target pages in the preview or original before applying a rotation.

## Review mixed page layouts

Documents may contain both portrait and landscape pages. Rotating everything can fix one page while breaking another, so use selected page ranges for mixed documents. Open the exported PDF and verify orientation on the affected pages.

## Keep a source copy

Rotation changes page orientation, not the text or image content within a page. Preserve the original until the output is checked. To reorganize page selection rather than orientation, use the [PDF Splitter](/blog/pdf-splitter).`,
  },
  "pdf-metadata-remover": {
    title: "Remove Author and Other Metadata from a PDF",
    description:
      "Remove hidden details like the author and title from a PDF, then check the clean copy before sharing.",
    introduction:
      "PDF properties can reveal an author's name, title, dates, or other document information. Reviewing and removing metadata before sharing can reduce unintended disclosure, though it does not hide information visible on the pages themselves.",
    body: `## Clean document properties

Choose a PDF in the [PDF Metadata Remover](/tools/pdf-metadata-remover) and create a clean copy. The tool removes hidden details such as the author, title, and the program used to make the file. Keep the original if those properties are useful for records or document management.

## Verify the exported copy

Inspect the output's document properties in a PDF reader and check that the visible pages still look right. Metadata removal does not redact names, addresses, or other text printed on the pages. Use a proper redaction workflow when visible content must be removed.

## Share deliberately

Confirm that the cleaned file is the one attached to your message, not the original. Files are processed locally in the browser. To optimize a document's structure, see the [PDF Compressor](/blog/pdf-compressor).`,
  },
  "text-to-pdf": {
    title: "Create a Paginated A4 PDF from Plain Text",
    description:
      "Turn plain text into a readable A4 PDF with margins and automatic page breaks in your browser.",
    introduction:
      "Plain text is portable, but it does not preserve page layout for printing or sharing. Converting it to a PDF gives the text consistent paper dimensions and automatic page breaks.",
    body: `## Prepare the text

Paste or type plain text in the [Text to PDF](/tools/text-to-pdf) workspace. Add blank lines where paragraphs should separate and review long sections before creating the file. This tool starts from plain text, so it is not intended to preserve rich formatting from a word processor.

## Generate and inspect the PDF

Create the A4 document and open it before sharing. Check the beginning and end, page breaks, and whether long lines wrap as expected. If a page ends in an awkward place, adjust the source text and regenerate.

## Understand the input format

Automatic pagination helps fit text across pages, but images, complex tables, and styled headings are outside a plain-text workflow. Text is processed locally in the browser. For a Word document, use the [DOCX to PDF guide](/blog/docx-to-pdf).`,
  },
  "docx-to-pdf": {
    title: "Convert a DOCX Word Document to PDF in Your Browser",
    description:
      "Convert a DOCX file to PDF, then check fonts, page breaks, and complex layouts in the exported copy.",
    introduction:
      "PDF is convenient when a document should retain a shareable page layout. Converting a DOCX file can simplify distribution, but complex Word layouts may not render exactly as they do in desktop software.",
    body: `## Convert and review the document

Choose a DOCX file in the [DOCX to PDF Converter](/tools/docx-to-pdf) and create the PDF. Open the result and compare headings, paragraphs, lists, and page breaks with the source. Text and common formatting are retained, but complex layouts may render differently.

## Check documents with intricate formatting

Pay special attention to tables, floating images, headers, footers, and unusual fonts. If exact page fidelity is essential, compare with a trusted local office suite before sending the converted file. The tool converts DOCX input; it is not a general document-format converter.

## Keep the editable original

Save both the DOCX source and the checked PDF. Conversion is useful for distribution but does not make the PDF a substitute for future editing. For creating a document from unformatted text, see [Text to PDF](/blog/text-to-pdf).`,
  },
  "pdf-to-text": {
    title: "Extract Selectable Text from a PDF Document",
    description:
      "Export the text layer from each PDF page and learn why scanned pages need OCR before extraction.",
    introduction:
      "Some PDFs contain selectable text; others are simply scanned page images. Extracting a text layer is quick when it exists, but image-only scans require optical character recognition before their words can be copied as text.",
    body: `## Extract text from the document

Load the file in [PDF to Text](/tools/pdf-to-text) and export the text from its pages. Review page breaks and ordering in the resulting text file. Columns and complex page layouts may not read in the same order as they appear visually.

## Check whether the PDF has a text layer

Try selecting a sentence in a PDF reader. If the page behaves like one flat image, it is likely a scan without selectable text. This tool does not perform OCR, so an image-only page cannot be converted into words by text extraction alone.

## Review extracted content

Compare important numbers, names, and punctuation against the original page before relying on the output. For scanned documents, run OCR with a suitable trusted tool first. To create image previews of PDF pages, use [PDF to Images](/blog/pdf-to-images).`,
  },
  "video-upscaler": {
    title: "How to Upscale a Video to 720p, 1024 Pixels, or 4K UHD",
    description:
      "Resize a video to 720p, 1024 pixels tall, or 2160p UHD in your browser while keeping its aspect ratio and audio.",
    introduction:
      "Upscaling changes a video's output dimensions so it can fit a larger display or editing timeline. It smoothly fills in the extra pixels, but it can't bring back fine details that weren't in the original recording.",
    body: `## Choose the output size

Select a short video in the [Video Resolution Enhancer](/tools/video-upscaler), then choose 720p HD, 1024 pixels of output height, or 2160p UHD. The tool preserves the source aspect ratio, so the output width depends on the original shape. For a 16:9 video, 2160p produces a 3840 × 2160 frame.

## Process and check the MP4

Start the conversion. The first time, the tool needs a short moment to get ready; after that it starts faster. Your video stays on your device the whole time and is never uploaded. The result is a standard MP4 file that plays on phones, computers, and TVs, with the original sound kept. Preview it and check the size before downloading.

## Understand quality and performance

The tool makes the picture bigger by smoothly filling in new pixels; it does not use AI to invent new detail. Upscaling a low-resolution or blurry source will not make its original content sharper. 4K encoding can take several minutes and needs substantial memory, so try a short clip first. Files over 250 MB are not accepted. Keep an original copy if you may need to compare or re-export the source.

For still images, the [Image Upscaler guide](/blog/image-upscaler) explains the same distinction between enlarging pixels and recovering detail.`,
  },
  "bulk-image-processor": {
    title: "How to Batch Edit and Convert Multiple Images",
    description:
      "Batch compress, resize, crop, convert, upscale, prepare social images, add captions, clean metadata, or create favicon sets.",
    introduction:
      "When a group of images needs the same treatment, repeating the same steps one file at a time is tedious. A batch workflow applies one operation and shared settings to a selection, then collects successful results in one archive.",
    body: `## Choose the files and operation

Open the [Bulk Image Processor](/tools/bulk-image-processor) and select up to 50 PNG, JPEG, or WebP images. Choose compression, resizing, format conversion, upscaling, a center crop, a solid background color to remove, social image sizing, shared meme captions, browser framing, metadata reports or removal, or favicon sets. Adjust the settings once; they are applied consistently to every supported file in the batch.

## Review the ZIP results

Process the batch and download the ZIP when it is ready. Each output filename includes its position and source name. A file that is too large, unsupported, or beyond the output dimension limit is reported while the remaining files continue.

## Choose the right single-image workflow

The bulk cropper applies the same centered ratio to every image, so it is not suited to per-image subject repositioning. Caption and background settings are shared across the batch. For individual crop placement, use the [Image Cropper](/tools/image-cropper). To resize one image by exact pixel dimensions, see the [Image Resizer](/tools/image-resizer).`,
  },
  "bulk-document-processor": {
    title: "How to Apply the Same PDF or Word Operation to Many Files",
    description:
      "Batch optimize, rotate, split, clean, convert, or extract content from PDF and DOCX files into one ZIP archive.",
    introduction:
      "A folder of reports or documents often needs the same repetitive action. The bulk document processor applies one chosen operation and shared settings to a group of files, then packages successful results together.",
    body: `## Select an operation and matching files

Open the [Bulk Document Processor](/tools/bulk-document-processor) and choose PDF optimization, page rotation, metadata removal, page extraction, PDF-to-image export, PDF text extraction, or DOCX-to-PDF conversion. Add up to 25 files of the matching type. Page ranges and rotation settings apply to every PDF in that batch.

## Download and check the ZIP

Run the batch and download the ZIP. Results are placed in folders named after their source files, which helps keep outputs separate. Files that fail are listed in the status message, while other files can still complete.

## Choose a workflow that fits the task

PDF Merge already combines several PDFs into one document, and Images to PDF already turns several images into one PDF. Use those tools when a single combined output is what you need. For a single file or a different page selection per document, use the [PDF tools directory](/tools/category/documents).`,
  },
  "bulk-video-upscaler": {
    title: "How to Upscale Several Videos and Download Them Together",
    description:
      "Batch upscale up to 10 videos to 720p, 1024 pixels tall, or 4K and download successful results as one ZIP.",
    introduction:
      "Preparing several clips for the same delivery size is easier when they share one batch. The bulk video upscaler processes clips one at a time, applies one output resolution, and collects successful MP4 files into one ZIP.",
    body: `## Build a batch

Choose up to 10 videos in the [Bulk Video Upscaler](/tools/bulk-video-upscaler), select 720p, 1024 pixels of output height, or 4K UHD, then start the batch. Each clip keeps its original aspect ratio and is processed before the next one begins.

## Download successful results

Download the ZIP when processing completes. If an individual clip cannot be converted, the other clips continue and the status reports the files that failed. The original files remain unchanged.

## Plan for large batches

Video processing happens on your device. Higher output sizes and long clips take more time and memory, so start with a short batch and avoid running multiple large conversions at once. Scaling creates more pixels but does not recover detail absent from a source. For one clip, use the [Video Resolution Enhancer](/tools/video-upscaler).`,
  },
  "instagram-downloader": {
    title: "How to Download Public Instagram Media",
    description:
      "Download public Instagram posts and reels from their links, and learn what can stop a download.",
    introduction:
      "The Instagram Downloader takes links to public posts or reels, one per line. It shows a preview of each photo or video, and you download the ones you want straight to your device.",
    body: `## Download posts and reels

Open the [Instagram Downloader](/tools/instagram-downloader) and paste one public post or reel link per line, up to 10 at once. Select Fetch media to preview each one, then select Download on the items you want. Posts with several photos or videos show each one separately.

## Why whole profiles aren't supported

Instagram only shows a profile's full list of posts to people who are logged in, so a profile link can't be downloaded here. Open each post or reel you want, tap Share or the three dots, choose Copy link, and paste that link instead.

## Understand the limitations

The downloader never logs in to Instagram. Private accounts and posts that need a login can't be downloaded, and Instagram may change how its public pages work. Files go straight to your device and are not stored on our server.`,
  },
  "tiktok-downloader": {
    title: "How to Download Public TikTok Videos",
    description:
      "Use the TikTok Downloader with public video links or a public profile, and understand its access limitations.",
    introduction:
      "The TikTok Downloader reads public video links or a public profile and shows a preview of each video. Select Download on a video to save it straight to your device.",
    body: `## Download selected videos

Open the [TikTok Downloader](/tools/tiktok-downloader), keep Multiple links selected, and paste one public video URL per line. Select Fetch media, watch the previews, and select Download on the videos you want.

## Browse a public profile

Choose TikTok profile, paste one public profile URL, and select Fetch media. The latest videos appear as previews that you can download one at a time. Files are not stored on our server.

## Respect access and usage rights

The downloader never logs in to TikTok. Private videos and ones that need a login can't be downloaded. Only download content you own or have permission to save; TikTok may change its pages or block downloads at times.`,
  },
  "youtube-downloader": {
    title: "How to Download YouTube Audio, Videos, or Channels",
    description:
      "Download YouTube audio as MP3, save video with its audio, or process a public channel or playlist.",
    introduction:
      "Choose YouTube audio to save an MP3, video to keep sound and picture, or channel to browse a public channel or playlist. Preview each video, then download it straight to your device.",
    body: `## Download selected videos

Open the [YouTube Downloader](/tools/youtube-downloader), choose YouTube audio or video, and paste one video URL per line. Select Fetch media to see a playable preview of each video, then select Download or Download MP3.

## Browse a channel or playlist

Choose Channel, enter one public channel or playlist URL, and select Fetch media. The latest videos appear as previews, and you can download the ones you want with both audio and video. Files go straight to your device and are not stored on our server.

## If a video is unavailable

This tool never logs in to YouTube, so private videos and ones that need a login can't be downloaded. YouTube sometimes changes its pages or blocks downloads for a while, so some links may not work.`,
  },
  "facebook-downloader": {
    title: "How to Download Public Facebook Media",
    description:
      "Download public Facebook videos and posts from their links with the Facebook Downloader.",
    introduction:
      "The Facebook Downloader previews public videos from their links. Select Download on an item to save it straight to your device.",
    body: `## Download videos and posts

Open the [Facebook Downloader](/tools/facebook-downloader) and paste one public video or post link per line, up to 10 at once. Select Fetch media to preview each one, then select Download.

## Why whole pages and profiles aren't supported

Facebook doesn't let a whole page or profile be listed without logging in. Open the video you want, choose Share, then Copy link, and paste that link here.

## Know when a link cannot be used

The downloader never logs in to Facebook. Private videos and posts that need a login can't be downloaded, and Facebook can change how its pages work. If a link doesn't work, use Facebook's own save options.`,
  },
  "pinterest-downloader": {
    title: "How to Download Public Pinterest Pins or Boards",
    description:
      "Save publicly available Pinterest media from selected pin links or a public profile or board.",
    introduction:
      "The Pinterest Downloader accepts individual public pin links or one public profile or board link. It previews each pin, and you download the ones you want straight to your device.",
    body: `## Add pin links in a batch

Open the [Pinterest Downloader](/tools/pinterest-downloader), paste one public pin URL per line, and select Fetch media. Each pin appears as a preview with its own Download button.

## Browse a profile or board

Choose Pinterest profile or board, paste one public profile or board URL, and select Fetch media. The tool finds public boards on a profile and lists their pins so you can download them one at a time.

## Public access only

The tool never logs in to Pinterest. Private pins and boards can't be downloaded, and Pinterest may change how its pages work.`,
  },
  "reddit-downloader": {
    title: "How to Download Public Reddit Media",
    description:
      "Download videos and images from public Reddit posts with the Reddit Downloader.",
    introduction:
      "Paste links to public Reddit posts, preview the media, then download each file straight to your device.",
    body: `## Download selected posts

Open the [Reddit Downloader](/tools/reddit-downloader) and paste one public post link per line, up to 10 at once. Select Fetch media to preview the posts, then select Download on the ones you want.

## Profiles and subreddits

A whole profile or subreddit can't be listed here. Open the post you want, choose Share, then Copy link, and paste that link instead.

## Availability

Only public posts work. Private communities, posts that need a login, and removed media can't be downloaded, and Reddit may block downloads at times.`,
  },
  "x-downloader": {
    title: "How to Download Public Media from X",
    description:
      "Download videos and images from public X posts in a batch with the X Downloader.",
    introduction:
      "The X Downloader takes links to public posts, one per line. It previews the media, and you download each file straight to your device.",
    body: `## Download selected posts

Open the [X (Twitter) Downloader](/tools/x-downloader) and paste one public post link per line, up to 10 at once. Select Fetch media, check the previews, and select Download.

## Profiles

A whole X profile can't be listed without logging in. Open the post you want, choose Share, then Copy link, and paste that link here.

## Limitations

The tool never logs in to X. Private accounts and posts that need a login can't be downloaded, and X may change how its pages work at any time.`,
  },
  "website-media-downloader": {
    title: "How to Download Media from a Public Website",
    description:
      "Use a public webpage URL to retrieve media supported by the website downloader, while respecting access and usage rights.",
    introduction:
      "The Website Media Downloader takes one public webpage link and looks for videos or audio on that page that you can download. It works with many sites, but not every page offers media that can be saved.",
    body: `## Submit a public page URL

Open the [Website Media Downloader](/tools/website-media-downloader), paste a public HTTP or HTTPS webpage URL, and select Fetch media. The tool handles one page at a time, shows what it found, and sends the file straight to your device when you select Download.

## Check access and permissions

Only use media you own or have permission to save. The downloader does not sign in or use browser cookies, so private or login-gated pages are not supported. It also rejects local and private network addresses.

## Understand site support

Whether a page works depends on the website. Sites sometimes change how their pages work or block downloads, so a page that worked before may stop working. If a page isn't supported, use the site's own download or save option.`,
  },
  "palworld-breeding-calculator": {
    title: "How to Breed the Pal You Want in Palworld",
    description:
      "Find out which Pal two parents make, or which parents to pair for the Pal you want, with the Palworld Breeding Calculator.",
    introduction:
      "In Palworld, two Pals at a Breeding Farm make an egg, and the Pal inside depends on which two parents you used. The Palworld Breeding Calculator shows the result before you spend time and cake on it.",
    body: `## Find the child of two parents

Open the [Palworld Breeding Calculator](/tools/palworld-breeding-calculator) and keep Find the child selected. Start typing a name in each parent box and pick a Pal from the list. The Pal that hatches appears right away, along with its elements.

## Find parents for the Pal you want

Choose Find the parents, then pick the Pal you're hoping to get. You'll see every pair of parents that makes it. If the list is long, type the name of a Pal you already own in the second box to show only pairs that include it.

## Special pairs and same-Pal breeding

Two Pals of the same kind always make another of that kind. Some Pals only come from one exact pair of parents, and those pairs are marked "Special pair". For a few special pairs, which parent is female and which is male changes the result, and the calculator shows both.

## Keep game updates in mind

The results match a specific Palworld version, shown under the calculator. Game updates can change which Pals hatch, so double-check after a big patch.`,
  },
};

const toolSlugs = new Set(tools.map((tool) => tool.slug));
const missingArticles = tools
  .filter((tool) => !articleContent[tool.slug])
  .map((tool) => tool.slug);
const orphanedArticles = Object.keys(articleContent).filter(
  (slug) => !toolSlugs.has(slug),
);

if (missingArticles.length > 0 || orphanedArticles.length > 0) {
  throw new Error(
    `Blog articles must match the tool registry. Missing: ${missingArticles.join(", ")}. Unknown: ${orphanedArticles.join(", ")}.`,
  );
}

export const blogPosts: BlogPost[] = tools.map((tool) => ({
  ...articleContent[tool.slug],
  slug: tool.slug,
  toolName: tool.name,
  category: tool.category,
}));

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getBlogPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter((post) => post.category === category);
}

export function getRelatedBlogPosts(slug: string, limit = 3): BlogPost[] {
  const tool = tools.find((candidate) => candidate.slug === slug);

  return tool
    ? getRelatedTools(tool, limit)
        .map((relatedTool) => getBlogPostBySlug(relatedTool.slug))
        .filter((post): post is BlogPost => post !== undefined)
    : [];
}