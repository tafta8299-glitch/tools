import {
  Barcode,
  Binary,
  Braces,
  Captions,
  CaseSensitive,
  FileText,
  FileSearch,
  Fingerprint,
  FileCode,
  GitCompareArrows,
  Hash,
  Image as ImageIcon,
  Expand,
  Crop,
  Eraser,
  RefreshCw,
  KeyRound,
  Link,
  Pipette,
  MonitorSmartphone,
  PanelsTopLeft,
  QrCode,
  Ruler,
  Table,
  Clock,
  Download,
  Egg,
  Scaling,
  ZoomIn,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { ToolIconName } from "@/data/tools";

const icons: Record<ToolIconName, LucideIcon> = {
  qrCode: QrCode,
  barcode: Barcode,
  keyRound: KeyRound,
  caseSensitive: CaseSensitive,
  fileText: FileText,
  pipette: Pipette,
  binary: Binary,
  braces: Braces,
  fingerprint: Fingerprint,
  link: Link,
  clock: Clock,
  hash: Hash,
  ruler: Ruler,
  gitCompare: GitCompareArrows,
  fileCode: FileCode,
  table: Table,
  image: ImageIcon,
  imageResize: Expand,
  imageCrop: Crop,
  imageConvert: RefreshCw,
  eraser: Eraser,
  upscale: ZoomIn,
  favicon: PanelsTopLeft,
  captions: Captions,
  deviceFrame: MonitorSmartphone,
  metadata: FileSearch,
  socialResize: Scaling,
  video: Video,
  download: Download,
  egg: Egg,
};

export function ToolIcon({
  name,
  className,
}: {
  name: ToolIconName;
  className?: string;
}) {
  const Icon = icons[name];

  return <Icon aria-hidden="true" className={className} strokeWidth={1.8} />;
}